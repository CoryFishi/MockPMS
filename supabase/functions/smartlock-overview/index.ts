// Weekly SmartLock Overview email — "a summary of all the SmartLocks in your
// selected facilities", for every user with automated_reports.smartlockOverview.
//
// Replaces send-smartlock-overview, whose source was lost and which used the
// legacy service_role key. Triggered by pg_cron via
// public.call_send_smartlock_overview(), which sends the project's secret API
// key on the `apikey` header. Deploy with verify_jwt = false: the platform's JWT
// check doesn't understand sb_secret_ keys, so the key is checked here instead.
//
//   POST {}                                → email each subscriber their report
//   POST { "testRecipient": "you@x.com" }  → build every report, send all to you@x.com
//
// Secrets: RESEND_API_KEY (required), REPORT_FROM (optional sender address).
// SUPABASE_URL and SUPABASE_SECRET_KEYS are injected by the platform.

interface Facility {
  id: string | number;
  name?: string;
  api: string;
  apiSecret: string;
  client: string;
  clientSecret: string;
  environment: string; // "" | "staging" | "-dev" | "-qa"
}

interface Subscriber {
  user_email: string;
  selected_tokens: Facility[] | null;
}

interface FacilityReport {
  name: string;
  environment: string;
  error?: string;
  total: number;
  ok: number;
  warning: number;
  errors: number;
  offline: number;
  lowestSignal: number | null; // percent, online locks only
  lowestBattery: number | null; // percent, online locks only
}

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_CONCURRENT_FACILITIES = 6;
const DEFAULT_FROM = "MockPMS <noreply@cfishburn.dev>";

// --- OpenTech (mirrors src/hooks/opentech.ts) -------------------------------

function envKeys(environment: string) {
  return {
    stage: environment === "staging" ? "cia-stg-1.aws." : "",
    env: environment === "staging" ? "" : environment,
  };
}

function authUrl(f: Facility) {
  const { stage, env } = envKeys(f.environment);
  return `https://auth.${stage}insomniaccia${env}.com/auth/token`;
}

function apiUrl(f: Facility, path: string) {
  const { stage, env } = envKeys(f.environment);
  return `https://accesscontrol.${stage}insomniaccia${env}.com${path}`;
}

function environmentName(environment: string) {
  const names: Record<string, string> = {
    "": "Production",
    staging: "Staging",
    "-dev": "Development",
    "-qa": "QA",
  };
  return names[environment] ?? environment.toUpperCase();
}

// One login per credential per run, shared by every facility that uses it.
const bearerCache = new Map<string, Promise<string>>();

function bearerFor(f: Facility): Promise<string> {
  const key = `${f.api}::${f.environment}`;
  let bearer = bearerCache.get(key);
  if (!bearer) {
    bearer = (async () => {
      const res = await fetch(authUrl(f), {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "password",
          username: f.api,
          password: f.apiSecret,
          client_id: f.client,
          client_secret: f.clientSecret,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`authentication failed (${res.status})`);
      const token = await res.json();
      return token.access_token as string;
    })();
    bearerCache.set(key, bearer);
  }
  return bearer;
}

async function getJson(f: Facility, bearer: string, path: string) {
  const res = await fetch(apiUrl(f, path), {
    headers: {
      Authorization: `Bearer ${bearer}`,
      accept: "application/json",
      "api-version": "2.0",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
}

// Same numbers as the SmartSpace dashboard (src/hooks/smartspace.ts).
async function facilityReport(f: Facility): Promise<FacilityReport> {
  const base: FacilityReport = {
    name: f.name || `Facility ${f.id}`,
    environment: environmentName(f.environment),
    total: 0,
    ok: 0,
    warning: 0,
    errors: 0,
    offline: 0,
    lowestSignal: null,
    lowestBattery: null,
  };
  try {
    const bearer = await bearerFor(f);
    const [summary, locks] = await Promise.all([
      getJson(f, bearer, `/facilities/${f.id}/smartlockstatussummary`),
      getJson(f, bearer, `/facilities/${f.id}/smartlockstatus`),
    ]);
    const smartlocks: any[] = Array.isArray(locks) ? locks : [];
    const online = smartlocks.filter((s) => !s.isDeviceOffline);
    const minOf = (values: number[]) => (values.length ? Math.min(...values) : null);
    const lowestSignal = minOf(online.map((s) => s.signalQuality || 255));

    return {
      ...base,
      total: smartlocks.length,
      ok: summary?.okCount ?? 0,
      warning: summary?.warningCount ?? 0,
      errors: summary?.errorCount ?? 0,
      offline: smartlocks.length - online.length,
      lowestSignal: lowestSignal === null ? null : Math.round((lowestSignal / 255) * 100),
      lowestBattery: minOf(online.map((s) => s.batteryLevel || 100)),
    };
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : String(error) };
  }
}

async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// --- Email ------------------------------------------------------------------

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

function renderEmail(reports: FacilityReport[]) {
  const measured = reports.filter((r) => !r.error);
  const failed = reports.filter((r) => r.error);
  const sum = (pick: (r: FacilityReport) => number) =>
    measured.reduce((n, r) => n + pick(r), 0);

  // Facilities with the most problems first.
  const rows = [...measured].sort(
    (a, b) => b.offline + b.errors - (a.offline + a.errors) || a.name.localeCompare(b.name)
  );

  const cell = 'style="padding:6px 10px;border-bottom:1px solid #e4e4e7;text-align:right"';
  const nameCell = 'style="padding:6px 10px;border-bottom:1px solid #e4e4e7"';
  const flag = (n: number, color: string) =>
    n > 0 ? `<b style="color:${color}">${n}</b>` : "0";
  const pct = (n: number | null) => (n === null ? "—" : `${n}%`);

  const tableRows = rows
    .map((r) =>
      r.total === 0
        ? `<tr><td ${nameCell}>${escapeHtml(r.name)}<br><small>${r.environment}</small></td>` +
          `<td colspan="7" style="padding:6px 10px;border-bottom:1px solid #e4e4e7;color:#71717a">No SmartLocks</td></tr>`
        : `<tr><td ${nameCell}>${escapeHtml(r.name)}<br><small>${r.environment}</small></td>` +
          `<td ${cell}>${r.total}</td><td ${cell}>${r.ok}</td>` +
          `<td ${cell}>${flag(r.warning, "#ca8a04")}</td><td ${cell}>${flag(r.errors, "#dc2626")}</td>` +
          `<td ${cell}>${flag(r.offline, "#dc2626")}</td>` +
          `<td ${cell}>${pct(r.lowestSignal)}</td><td ${cell}>${pct(r.lowestBattery)}</td></tr>`
    )
    .join("");

  const failedList = failed.length
    ? `<h3 style="margin-top:24px">Couldn't reach ${failed.length} ${failed.length === 1 ? "facility" : "facilities"}</h3><ul>` +
      failed
        .map((r) => `<li>${escapeHtml(r.name)} (${r.environment}): ${escapeHtml(r.error!)}</li>`)
        .join("") +
      "</ul>"
    : "";

  const header = ["Facility", "Locks", "OK", "Warning", "Error", "Offline", "Lowest signal", "Lowest battery"]
    .map((h, i) => `<th style="padding:6px 10px;text-align:${i ? "right" : "left"};background:#f4f4f5">${h}</th>`)
    .join("");

  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#18181b">
<h2>SmartLock Overview</h2>
<p>${reports.length} selected ${reports.length === 1 ? "facility" : "facilities"} ·
${sum((r) => r.total)} SmartLocks · ${sum((r) => r.ok)} OK ·
${sum((r) => r.warning)} warning · ${sum((r) => r.errors)} error · ${sum((r) => r.offline)} offline</p>
<table style="border-collapse:collapse"><tr>${header}</tr>${tableRows}</table>
${failedList}
<p style="color:#71717a;font-size:12px;margin-top:24px">Sent weekly by MockPMS. Turn this off under User Settings → Email Preferences.</p>
</div>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY secret is not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("REPORT_FROM") || DEFAULT_FROM,
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${await res.text()}`);
}

// --- Handler ----------------------------------------------------------------

function secretKeys(): string[] {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  return raw ? Object.values(JSON.parse(raw) as Record<string, string>) : [];
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const keys = secretKeys();
  const apikey = req.headers.get("apikey");
  if (!apikey || !keys.includes(apikey)) {
    return json({ error: "Unauthorized" }, 401);
  }

  bearerCache.clear(); // a warm worker must not reuse last run's (possibly expired) logins

  const body = await req.json().catch(() => ({}));
  const testRecipient: string | undefined = body?.testRecipient;

  // Secret keys go on the apikey header only — never as a Bearer token.
  const res = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/rest/v1/user_data` +
      "?select=user_email,selected_tokens&automated_reports->>smartlockOverview=eq.true",
    { headers: { apikey: keys[0] } }
  );
  if (!res.ok) {
    return json({ error: `user_data query failed (${res.status})` }, 500);
  }
  const subscribers: Subscriber[] = await res.json();

  const results = [];
  for (const sub of subscribers) {
    const facilities = sub.selected_tokens ?? [];
    const to = testRecipient || sub.user_email;
    try {
      if (!facilities.length) {
        results.push({ subscriber: sub.user_email, skipped: "no selected facilities" });
        continue;
      }
      const reports = await mapLimited(facilities, MAX_CONCURRENT_FACILITIES, facilityReport);
      const subject = `${testRecipient ? `[TEST for ${sub.user_email}] ` : ""}SmartLock Overview`;
      await sendEmail(to, subject, renderEmail(reports));
      results.push({
        subscriber: sub.user_email,
        sentTo: to,
        facilities: reports.length,
        unreachable: reports.filter((r) => r.error).length,
      });
    } catch (error) {
      results.push({
        subscriber: sub.user_email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(JSON.stringify({ subscribers: subscribers.length, results }));
  const failed = results.some((r) => "error" in r);
  return json({ subscribers: subscribers.length, results }, failed ? 500 : 200);
});

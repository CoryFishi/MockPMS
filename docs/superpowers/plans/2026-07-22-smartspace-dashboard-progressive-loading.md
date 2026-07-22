# SmartSpace Dashboard Progressive Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SmartSpace dashboard's all-or-nothing blocking load with per-facility TanStack Query queries so rows stream in progressively, single-facility failures show an error row with Retry instead of blanking the dashboard, and return visits render instantly from cache.

**Architecture:** One TanStack Query query per selected facility (key `['smartspace-facility', environment, id]`), fetched through a module-level 6-slot semaphore with 15s axios timeouts. Critical failures (auth, facility detail) reject the query → error row with Retry; non-critical endpoint failures are caught individually and reported via a `failedSections` array → row renders with "—" cells. Aggregate totals become a `useMemo` over loaded facilities.

**Tech Stack:** React 19, TypeScript, Vite, `@tanstack/react-query` (new dependency), axios, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-07-22-smartspace-dashboard-loading-design.md`

## Global Constraints

- Repo has **no test infrastructure** (no test script in package.json). Verification per task = `npx tsc --noEmit` + `npm run build` + `npm run lint`; final task is a manual QA checklist from the spec. Do NOT add a test framework.
- **Always use path aliases** (`@hooks`, `@views`, `@components`, `@context`) — never relative imports.
- Concurrency cap: **6** facility fetches in flight. Request timeout: **15000 ms**. Stale time / refetch interval: **5 minutes**. `gcTime`: **30 minutes**. `retry: 1`. `refetchOnWindowFocus: false`.
- Critical endpoints (throw → query error): bearer token acquisition, `GET /facilities/{id}`. Non-critical (caught, listed in `failedSections`): edge router, access points, smartlock summary, smartlock status, smartmotion, weather.
- Preserve the existing derived-field math exactly, including the `-100` sentinel values for facilities with no smartlocks and the `Math.round((x / 255) * 100)` signal conversion.
- The codebase uses `any` typing liberally — match that style; do not introduce strict typing beyond what the existing files use.
- Commit after each task. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- The dev branch is `dev` — commit there, do not push unless asked.

---

### Task 1: Install TanStack Query and wire the provider

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a `QueryClientProvider` above `AuthProvider` so any component (and `useQueryClient`) works app-wide. Later tasks rely on the default options set here.

- [ ] **Step 1: Install the dependency**

Run: `npm install @tanstack/react-query`
Expected: package.json gains `"@tanstack/react-query"` under dependencies; install exits 0.

- [ ] **Step 2: Wrap the app in QueryClientProvider**

Replace the full contents of `src/main.tsx` with:

```tsx
import ReactDOM from "react-dom/client";
import App from "@app/App.tsx";
import "@app/index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "@context/AuthProvider.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  </QueryClientProvider>
);
```

Note: the spec says "App.tsx"; the router and AuthProvider actually live in `src/main.tsx`, so the provider goes there — same effect, correct location.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit; npm run build`
Expected: both succeed with no new errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/main.tsx
git commit -m "feat: add TanStack Query provider

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Create the facility status fetch module and hook

**Files:**
- Create: `src/hooks/smartspace.ts`

**Interfaces:**
- Consumes: `handleSingleLogin(facility)` from `@hooks/opentech` (returns `{ message, token }` on success or `{ error }` on failure); `getBearerToken(credential): string | null` passed in from `useAuth()`.
- Produces (used by Task 3):
  - `useFacilityStatusQueries(selectedTokens: any[], getBearerToken: (credential: any) => string | null)` returning `{ results, loaded, pending, errored, lastUpdatedAt }` where:
    - `loaded: any[]` — facility status objects (same shape as the old `fetchFacilityData` return, plus `failedSections: string[]`)
    - `pending: any[]` — entries from `selectedTokens` whose query is still pending
    - `errored: { facility: any; error: any; refetch: () => void; isFetching: boolean }[]`
    - `lastUpdatedAt: number` — max `dataUpdatedAt` across queries (0 if none)
  - `FACILITY_QUERY_KEY = "smartspace-facility"` — exported so Refresh All can invalidate by key.

- [ ] **Step 1: Write the module**

Create `src/hooks/smartspace.ts` with exactly:

```typescript
import axios from "axios";
import { useQueries } from "@tanstack/react-query";
import { handleSingleLogin } from "@hooks/opentech";

export const FACILITY_QUERY_KEY = "smartspace-facility";

const REQUEST_TIMEOUT_MS = 15000;
const MAX_CONCURRENT_FACILITY_FETCHES = 6;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

// Module-level semaphore: at most MAX_CONCURRENT_FACILITY_FETCHES facility
// fetches run at once; the rest queue in FIFO order.
let activeFetches = 0;
const waitQueue: (() => void)[] = [];

async function withFacilitySlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeFetches >= MAX_CONCURRENT_FACILITY_FETCHES) {
    await new Promise<void>((resolve) => waitQueue.push(resolve));
  }
  activeFetches++;
  try {
    return await task();
  } finally {
    activeFetches--;
    const next = waitQueue.shift();
    if (next) next();
  }
}

function apiBase(environment: string) {
  const stageKey = environment === "staging" ? "cia-stg-1.aws." : "";
  const envKey = environment === "staging" ? "" : environment;
  return `https://accesscontrol.${stageKey}insomniaccia${envKey}.com`;
}

export async function fetchFacilityStatus(
  facility: any,
  getBearerToken: (credential: any) => string | null
) {
  // Bearer token is critical — no token, no data.
  let bearer = getBearerToken(facility);
  if (!bearer) {
    const login: any = await handleSingleLogin(facility);
    if (!login?.token?.access_token) {
      throw new Error("Authentication failed");
    }
    bearer = login.token.access_token;
  }

  const headers = {
    Authorization: `Bearer ${bearer}`,
    accept: "application/json",
    "api-version": "2.0",
  };
  const base = apiBase(facility.environment);
  const get = (path: string) =>
    axios
      .get(`${base}${path}`, { headers, timeout: REQUEST_TIMEOUT_MS })
      .then((res) => res.data);

  const failedSections: string[] = [];
  const guard = <T,>(section: string, promise: Promise<T>, fallback: T): Promise<T> =>
    promise.catch(() => {
      failedSections.push(section);
      return fallback;
    });

  // Facility detail is deliberately unguarded — its rejection fails the query.
  const [edgeRouter, aps, summary, smartlocks, smartMotion, facilityDetail] =
    await Promise.all([
      guard("edgeRouter", get(`/facilities/${facility.id}/edgerouterstatus`), null),
      guard(
        "accessPoints",
        get(`/facilities/${facility.id}/edgerouterplatformdevicesstatus`),
        [] as any[]
      ),
      guard(
        "smartlockSummary",
        get(`/facilities/${facility.id}/smartlockstatussummary`),
        null
      ),
      guard("smartlocks", get(`/facilities/${facility.id}/smartlockstatus`), [] as any[]),
      guard("smartMotion", get(`/facilities/${facility.id}/smartmotionstatus`), [] as any[]),
      get(`/facilities/${facility.id}`),
    ]);

  const weather = await guard(
    "weather",
    axios
      .get(
        `https://api.weatherapi.com/v1/current.json?q=${facilityDetail.city}&key=${
          import.meta.env.VITE_WEATHER_KEY
        }`,
        { timeout: REQUEST_TIMEOUT_MS }
      )
      .then((res) => res.data),
    null
  );

  const smartMotionOkayCount = smartMotion.filter(
    (s: any) => s.overallStatus === "ok"
  ).length;
  const smartMotionWarningCount = smartMotion.filter(
    (s: any) => s.overallStatus === "warning"
  ).length;
  const smartMotionErrorCount = smartMotion.filter(
    (s: any) => s.overallStatus === "error"
  ).length;
  const smartMotionOfflineCount = smartMotion.filter(
    (s: any) => s.isDeviceOffline
  ).length;
  const smartMotionLowestSignal = Math.min(
    ...smartMotion
      .filter((s: any) => !s.isDeviceOffline)
      .map((s: any) => s.signalQuality || 255)
  );
  const smartMotionLowestBattery = Math.min(
    ...smartMotion
      .filter((s: any) => !s.isDeviceOffline)
      .map((s: any) => s.batteryLevel)
  );

  const lowestSignal = Math.min(
    ...smartlocks
      .filter((s: any) => !s.isDeviceOffline)
      .map((s: any) => s.signalQuality || 255)
  );
  const lowestBattery = Math.min(
    ...smartlocks
      .filter((s: any) => !s.isDeviceOffline)
      .map((s: any) => s.batteryLevel || 100)
  );
  const offlineCount = smartlocks.filter((s: any) => s.isDeviceOffline).length;

  const smartMotionFields = {
    smartMotion,
    smartMotionOkayCount,
    smartMotionWarningCount,
    smartMotionErrorCount,
    smartMotionOfflineCount,
    smartMotionLowestSignal: isFinite(smartMotionLowestSignal)
      ? Math.round((smartMotionLowestSignal / 255) * 100)
      : 0,
    smartMotionLowestBattery: isFinite(smartMotionLowestBattery)
      ? smartMotionLowestBattery
      : 0,
  };

  const shared = {
    ...facility,
    bearer,
    edgeRouterStatus: edgeRouter?.connectionStatus || "error",
    onlineAccessPointsCount: aps.filter((ap: any) => !ap.isDeviceOffline).length || 0,
    offlineAccessPointsCount: aps.filter((ap: any) => ap.isDeviceOffline).length || 0,
    edgeRouterName: edgeRouter?.name || "Edge Router",
    edgeRouter: edgeRouter || {},
    accessPoints: aps || [],
    facilityDetail,
    weather,
    failedSections,
    ...smartMotionFields,
  };

  if (smartlocks.length > 0) {
    return {
      ...shared,
      okCount: summary?.okCount || 0,
      warningCount: summary?.warningCount || 0,
      errorCount: summary?.errorCount || 0,
      offlineCount,
      lowestSignal: isFinite(lowestSignal)
        ? Math.round((lowestSignal / 255) * 100)
        : 0,
      lowestBattery: isFinite(lowestBattery) ? lowestBattery : 0,
      smartLocks: smartlocks,
    };
  }
  return {
    ...shared,
    okCount: -100,
    warningCount: -100,
    errorCount: -100,
    offlineCount: -100,
    lowestSignal: -100,
    lowestBattery: -100,
    smartLocks: [],
  };
}

export function useFacilityStatusQueries(
  selectedTokens: any[],
  getBearerToken: (credential: any) => string | null
) {
  const facilities = selectedTokens ?? [];
  return useQueries({
    queries: facilities.map((facility: any) => ({
      queryKey: [FACILITY_QUERY_KEY, facility.environment, facility.id],
      queryFn: () => withFacilitySlot(() => fetchFacilityStatus(facility, getBearerToken)),
      staleTime: FIVE_MINUTES_MS,
      refetchInterval: FIVE_MINUTES_MS,
    })),
    combine: (results) => ({
      results,
      loaded: results.filter((r) => r.data).map((r) => r.data as any),
      pending: facilities.filter((_: any, i: number) => results[i].isPending),
      errored: facilities
        .map((facility: any, i: number) => ({
          facility,
          error: results[i].error,
          refetch: results[i].refetch,
          isError: results[i].isError,
          isFetching: results[i].isFetching,
        }))
        .filter((e) => e.isError),
      lastUpdatedAt: Math.max(0, ...results.map((r) => r.dataUpdatedAt || 0)),
    }),
  });
}
```

Two intentional behavior notes (do not "fix" these):
- The old `fetchFacilityData` fetched smartmotion, facility detail, and weather **sequentially**; here everything except weather runs in one `Promise.all`, and weather chains after facility detail because it needs the city.
- `combine` gives structural sharing, so `loaded` keeps a stable reference between renders when no query data changed — Task 3's `useEffect` on `loaded` depends on this to avoid an infinite re-render loop.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit; npm run lint`
Expected: no new errors. (`npm run build` also works but tsc is the fast check; run build once at the end of the task.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/smartspace.ts
git commit -m "feat: add per-facility SmartSpace status queries with concurrency cap and timeouts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Refactor SmartSpaceDashboard to progressive rendering

**Files:**
- Modify: `src/components/app/smartspace/dashboard/SmartSpaceDashboard.tsx`

**Interfaces:**
- Consumes: `useFacilityStatusQueries`, `FACILITY_QUERY_KEY` from `@hooks/smartspace` (Task 2).
- Produces: passes `pendingFacilities: any[]` and `erroredFacilities: { facility, error, refetch, isFetching }[]` props to `SmartSpaceDashboardList` (rendered by Task 4 — until Task 4 lands, pass them but the list ignores unknown props, which is fine for one commit).

- [ ] **Step 1: Replace imports and the fetching/state logic**

In `SmartSpaceDashboard.tsx`, replace the import block (lines 1–11) with:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FaLock } from "react-icons/fa";
import SmartSpaceFacilityCard from "@views/smartspace/dashboard/SmartSpaceFacilityCard";
import SmartSpaceExport from "@views/smartspace/dashboard/SmartSpaceExport";
import { useAuth } from "@context/AuthProvider";
import SmartSpaceDashboardList from "@views/smartspace/dashboard/SmartSpaceDashboardList";
import InputBox from "@components/ui/InputBox";
import SliderButton from "@components/ui/SliderButton";
import { useFacilityStatusQueries, FACILITY_QUERY_KEY } from "@hooks/smartspace";
import FacilityPendingCard from "@views/smartspace/dashboard/FacilityPendingCard";
import FacilityErrorCard from "@views/smartspace/dashboard/FacilityErrorCard";
```

(`axios`, `toast`, `LoadingSpinner` imports are removed. The two card imports will exist after Task 5; if executing tasks strictly in order, add those two imports in Task 5 instead.)

Then DELETE from the component body:
- All 25 aggregate-counter `useState` declarations (`facilitiesWithBearers`, `filteredFacilities` stay — see below; delete `facilitiesInfo`, `edgeRouterOfflineCount` ... `smartMotionLowestBattery`, `isLoading`, `currentLoadingText`).
- `fetchBearerToken` (entire function).
- The "Add totals together" `useEffect` (the whole `updateAggregatedCounts` effect).
- The "Get bearer tokens prior to creating rows/cards" `useEffect`.
- `fetchFacilityData` (entire function — it moved to `@hooks/smartspace`).

Replace with this state/derivation block at the top of the component:

```tsx
const { selectedTokens, getBearerToken } = useAuth();
const queryClient = useQueryClient();
const { loaded, pending, errored, lastUpdatedAt } = useFacilityStatusQueries(
  selectedTokens,
  getBearerToken
);

// Sorted stable copy of loaded facilities (most smartlocks first), the
// source list for search and for the List's sort-reset.
const loadedFacilities = useMemo(
  () =>
    [...loaded].sort(
      (a, b) => (b.smartLocks?.length || 0) - (a.smartLocks?.length || 0)
    ),
  [loaded]
);

const [filteredFacilities, setFilteredFacilities] = useState<any[]>([]);
const [searchQuery, setSearchQuery] = useState<string>("");
```

Keep the existing `listView`, `toggledSections`, `explicitSort` states unchanged. Update `search` to filter `loadedFacilities` instead of `facilitiesWithBearers` (same body, change the array and the `useCallback` dep). Keep the existing search-sync `useEffect` but swap `facilitiesWithBearers` → `loadedFacilities` in both the body and deps.

- [ ] **Step 2: Add the totals useMemo (destructured to keep all JSX prop names unchanged)**

Add below the search logic:

```tsx
const totals = useMemo(() => {
  const t = {
    totalAccessPoints: 0,
    totalEdgeRouters: 0,
    totalSmartlocks: 0,
    totalSmartMotion: 0,
    edgeRouterOfflineCount: 0,
    edgeRouterOnlineCount: 0,
    edgeRouterWarningCount: 0,
    accessPointsOnlineCount: 0,
    accessPointsOfflineCount: 0,
    smartlockOkayCount: 0,
    smartlockWarningCount: 0,
    smartlockErrorCount: 0,
    smartlockOfflineCount: 0,
    smartlockLowestSignal: { lowestSignal: 100 as any, facility: "N/A" },
    smartlockLowestBattery: { lowestBattery: 100 as any, facility: "N/A" },
    smartMotionOkayCount: 0,
    smartMotionWarningCount: 0,
    smartMotionErrorCount: 0,
    smartMotionOfflineCount: 0,
    smartMotionLowestSignal: { lowestSignal: 100 as any, facility: "N/A" },
    smartMotionLowestBattery: { lowestBattery: 100 as any, facility: "N/A" },
  };

  // Mirrors the row-hiding rules in SmartSpaceFacilityRow so totals match
  // what is actually rendered.
  const hiddenByExplicitSort = (facility: any) =>
    (facility.smartMotion.length < 1 &&
      !toggledSections.smartLock &&
      toggledSections.smartMotion &&
      explicitSort) ||
    (facility.smartLocks.length < 1 &&
      !toggledSections.smartMotion &&
      toggledSections.smartLock &&
      explicitSort);

  for (const facility of filteredFacilities) {
    if (hiddenByExplicitSort(facility)) continue;

    t.totalEdgeRouters += 1;
    t.edgeRouterOfflineCount += facility.edgeRouterStatus === "error" ? 1 : 0;
    t.edgeRouterOnlineCount += facility.edgeRouterStatus === "ok" ? 1 : 0;
    t.edgeRouterWarningCount += facility.edgeRouterStatus === "warning" ? 1 : 0;
    t.accessPointsOnlineCount += facility.onlineAccessPointsCount;
    t.accessPointsOfflineCount += facility.offlineAccessPointsCount;
    t.totalAccessPoints +=
      facility.onlineAccessPointsCount + facility.offlineAccessPointsCount;

    if (Array.isArray(facility.smartLocks) && facility.smartLocks.length > 0) {
      t.totalSmartlocks +=
        facility.okCount + facility.warningCount + facility.errorCount;
      t.smartlockOkayCount += facility.okCount || 0;
      t.smartlockWarningCount += facility.warningCount || 0;
      t.smartlockErrorCount += facility.errorCount || 0;
      t.smartlockOfflineCount += facility.offlineCount || 0;

      const signal = parseInt(facility.lowestSignal);
      const battery = parseInt(facility.lowestBattery);
      if (signal < parseInt(t.smartlockLowestSignal.lowestSignal)) {
        t.smartlockLowestSignal = { lowestSignal: signal, facility: facility.name };
      }
      if (battery < parseInt(t.smartlockLowestBattery.lowestBattery)) {
        t.smartlockLowestBattery = { lowestBattery: battery, facility: facility.name };
      }
    }

    if (Array.isArray(facility.smartMotion) && facility.smartMotion.length > 0) {
      t.totalSmartMotion +=
        facility.smartMotionOkayCount +
        facility.smartMotionWarningCount +
        facility.smartMotionErrorCount;
      t.smartMotionOkayCount += facility.smartMotionOkayCount || 0;
      t.smartMotionWarningCount += facility.smartMotionWarningCount || 0;
      t.smartMotionErrorCount += facility.smartMotionErrorCount || 0;
      t.smartMotionOfflineCount += facility.smartMotionOfflineCount || 0;

      const signal = parseInt(facility.smartMotionLowestSignal);
      const battery = parseInt(facility.smartMotionLowestBattery);
      if (signal < parseInt(t.smartMotionLowestSignal.lowestSignal)) {
        t.smartMotionLowestSignal = { lowestSignal: signal, facility: facility.name };
      }
      if (battery < parseInt(t.smartMotionLowestBattery.lowestBattery)) {
        t.smartMotionLowestBattery = { lowestBattery: battery, facility: facility.name };
      }
    }
  }
  return t;
}, [filteredFacilities, toggledSections, explicitSort]);

const {
  totalAccessPoints,
  totalEdgeRouters,
  totalSmartlocks,
  totalSmartMotion,
  edgeRouterOfflineCount,
  edgeRouterOnlineCount,
  edgeRouterWarningCount,
  accessPointsOnlineCount,
  accessPointsOfflineCount,
  smartlockOkayCount,
  smartlockWarningCount,
  smartlockErrorCount,
  smartlockOfflineCount,
  smartlockLowestSignal,
  smartlockLowestBattery,
  smartMotionOkayCount,
  smartMotionWarningCount,
  smartMotionErrorCount,
  smartMotionOfflineCount,
  smartMotionLowestSignal,
  smartMotionLowestBattery,
} = totals;
```

Because the destructured names match the old state variable names exactly, **no JSX below needs renaming**. Known behavior change (intended, from spec review): the old code computed edge-router/AP totals from the unfiltered list but smartlock/smartmotion totals from the filtered list; now all totals consistently reflect the filtered list.

- [ ] **Step 3: Replace the loading spinner with a progress bar + last-updated/refresh controls**

In the JSX, delete:

```tsx
{isLoading && <LoadingSpinner loadingText={currentLoadingText} />}
```

and change the wrapper div (which referenced `isLoading`) to:

```tsx
<div className="relative overflow-auto h-full dark:text-white dark:bg-zinc-900">
```

Directly below the header-title bar (`SmartSpace Dashboard` div), add:

```tsx
{pending.length > 0 && (
  <div className="mx-5 mt-3 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
    <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full bg-yellow-500 transition-all duration-500"
        style={{
          width: `${
            ((selectedTokens.length - pending.length) /
              Math.max(selectedTokens.length, 1)) *
            100
          }%`,
        }}
      />
    </div>
    <span className="whitespace-nowrap">
      {selectedTokens.length - pending.length} of {selectedTokens.length} facilities loaded
    </span>
  </div>
)}
```

In the existing search-bar row, before the Card/List toggle button, add the last-updated label and Refresh All button:

```tsx
{lastUpdatedAt > 0 && (
  <span className="mr-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
    Last updated {new Date(lastUpdatedAt).toLocaleTimeString()}
  </span>
)}
<button
  className="bg-zinc-500 text-white p-1 py-2 rounded-sm hover:bg-zinc-600 ml-3 w-28 font-bold cursor-pointer hover:transition hover:duration-300 hover:ease-in-out"
  onClick={() =>
    queryClient.invalidateQueries({ queryKey: [FACILITY_QUERY_KEY] })
  }
>
  Refresh All
</button>
```

- [ ] **Step 4: Pass pending/errored to the list, gate the export, update card view**

List view — add two props to `<SmartSpaceDashboardList ...>` and swap the sort-reset source:

```tsx
facilitiesWithBearers={loadedFacilities}
pendingFacilities={pending}
erroredFacilities={errored}
```

(Remove the old `facilitiesWithBearers={facilitiesWithBearers}` line; every other existing prop stays.)

Card view — inside the `columns-1 sm:columns-2 lg:columns-3` div, after the `filteredFacilities.map(...)`, add (components arrive in Task 5; if building strictly in task order add this block in Task 5):

```tsx
{pending.map((facility: any) => (
  <div key={`pending-${facility.id}`} className="break-inside-avoid">
    <FacilityPendingCard facility={facility} />
  </div>
))}
{errored.map((entry: any) => (
  <div key={`error-${entry.facility.id}`} className="break-inside-avoid">
    <FacilityErrorCard
      facility={entry.facility}
      error={entry.error}
      onRetry={() => entry.refetch()}
      isRetrying={entry.isFetching}
    />
  </div>
))}
```

Export gating — replace the export block at the bottom:

```tsx
<div
  className="float-right px-5"
  title={
    pending.length > 0
      ? `Export available after all facilities load (${pending.length} remaining)`
      : undefined
  }
>
  <div className={pending.length > 0 ? "pointer-events-none opacity-50" : ""}>
    <SmartSpaceExport facilitiesInfo={loadedFacilities} />
  </div>
</div>
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit; npm run lint; npm run build`
Expected: passes. (If Task 4/5 components aren't built yet and you added their imports/props, comment them out for this commit or execute Tasks 3–5 as one PR-sized sequence and only run the full build at Task 5 — but each task still gets its own commit.)

- [ ] **Step 6: Commit**

```bash
git add src/components/app/smartspace/dashboard/SmartSpaceDashboard.tsx
git commit -m "feat: progressive SmartSpace dashboard loading via per-facility queries

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Pending and error rows in list view

**Files:**
- Create: `src/components/app/smartspace/dashboard/FacilityPendingRow.tsx`
- Create: `src/components/app/smartspace/dashboard/FacilityErrorRow.tsx`
- Modify: `src/components/app/smartspace/dashboard/SmartSpaceDashboardList.tsx`

**Interfaces:**
- Consumes: `pendingFacilities: any[]`, `erroredFacilities: { facility: any; error: any; refetch: () => void; isFetching: boolean }[]` props from Task 3; `getEnvironmentName(facility)` from `@hooks/opentech`.
- Produces: `<FacilityPendingRow facility colSpan />` and `<FacilityErrorRow facility error onRetry isRetrying colSpan />` table-row components. Also exports `errorReason(error): string` from `FacilityErrorRow.tsx` (reused by Task 5's error card).

- [ ] **Step 1: Create FacilityPendingRow**

`src/components/app/smartspace/dashboard/FacilityPendingRow.tsx`:

```tsx
import { getEnvironmentName } from "@hooks/opentech";

export default function FacilityPendingRow({
  facility,
  colSpan,
}: {
  facility: any;
  colSpan: number;
}) {
  return (
    <tr className="border border-zinc-300 dark:border-zinc-700">
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
          <p className="truncate max-w-[20ch]">{facility.name}</p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {getEnvironmentName(facility)}
          </span>
        </div>
      </td>
      <td colSpan={colSpan - 1} className="px-4 py-2">
        <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: Create FacilityErrorRow**

`src/components/app/smartspace/dashboard/FacilityErrorRow.tsx`:

```tsx
import { IoIosWarning } from "react-icons/io";
import { getEnvironmentName } from "@hooks/opentech";

export function errorReason(error: any): string {
  if (error?.message === "Authentication failed") return "Authentication failed";
  if (error?.code === "ECONNABORTED") return "Request timed out";
  if (error?.response?.status) return `Request failed (HTTP ${error.response.status})`;
  return "Failed to load facility data";
}

export default function FacilityErrorRow({
  facility,
  error,
  onRetry,
  isRetrying,
  colSpan,
}: {
  facility: any;
  error: any;
  onRetry: () => void;
  isRetrying: boolean;
  colSpan: number;
}) {
  return (
    <tr className="border border-zinc-300 bg-red-50 dark:border-zinc-700 dark:bg-red-950/30">
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <IoIosWarning className="min-w-5 text-red-500" />
          <p className="truncate max-w-[20ch]">{facility.name}</p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {getEnvironmentName(facility)}
          </span>
        </div>
      </td>
      <td colSpan={colSpan - 1} className="px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-red-600 dark:text-red-400">
            {errorReason(error)}
          </span>
          <button
            className="rounded-sm bg-yellow-500 px-3 py-1 font-bold text-white hover:bg-yellow-600 disabled:opacity-50 cursor-pointer"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        </div>
      </td>
    </tr>
  );
}
```

- [ ] **Step 3: Render them in SmartSpaceDashboardList**

In `SmartSpaceDashboardList.tsx`:

Add imports:

```tsx
import FacilityPendingRow from "@views/smartspace/dashboard/FacilityPendingRow";
import FacilityErrorRow from "@views/smartspace/dashboard/FacilityErrorRow";
```

Add to the destructured props and the prop type (defaults keep the component safe if a caller omits them):

```tsx
pendingFacilities = [],
erroredFacilities = [],
```

```tsx
pendingFacilities?: any[];
erroredFacilities?: {
  facility: any;
  error: any;
  refetch: () => void;
  isFetching: boolean;
}[];
```

Inside the component body, compute the row width once:

```tsx
const totalColumns =
  1 +
  (toggledSections.openNet ? 3 : 0) +
  (toggledSections.smartLock ? 6 : 0) +
  (toggledSections.smartMotion ? 6 : 0);
```

In `<tbody>`, between the `filteredFacilities.map(...)` block and the Totals `<tr>`, insert:

```tsx
{pendingFacilities.map((facility: any) => (
  <FacilityPendingRow
    key={`pending-${facility.id}`}
    facility={facility}
    colSpan={totalColumns}
  />
))}
{erroredFacilities.map((entry) => (
  <FacilityErrorRow
    key={`error-${entry.facility.id}`}
    facility={entry.facility}
    error={entry.error}
    onRetry={() => entry.refetch()}
    isRetrying={entry.isFetching}
    colSpan={totalColumns}
  />
))}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit; npm run lint; npm run build`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/app/smartspace/dashboard/FacilityPendingRow.tsx src/components/app/smartspace/dashboard/FacilityErrorRow.tsx src/components/app/smartspace/dashboard/SmartSpaceDashboardList.tsx
git commit -m "feat: skeleton and error rows with retry in SmartSpace list view

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Pending and error cards for card view

**Files:**
- Create: `src/components/app/smartspace/dashboard/FacilityPendingCard.tsx`
- Create: `src/components/app/smartspace/dashboard/FacilityErrorCard.tsx`
- Modify: `src/components/app/smartspace/dashboard/SmartSpaceDashboard.tsx` (only if the Task 3 card-view block/imports were deferred)

**Interfaces:**
- Consumes: `errorReason(error)` from `@views/smartspace/dashboard/FacilityErrorRow` (Task 4); `getEnvironmentName` from `@hooks/opentech`.
- Produces: `<FacilityPendingCard facility />`, `<FacilityErrorCard facility error onRetry isRetrying />` used by the dashboard card view (Task 3 Step 4).

- [ ] **Step 1: Create FacilityPendingCard**

`src/components/app/smartspace/dashboard/FacilityPendingCard.tsx`:

```tsx
import { getEnvironmentName } from "@hooks/opentech";

export default function FacilityPendingCard({ facility }: { facility: any }) {
  return (
    <div className="mb-4 rounded-lg border bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
        <h2 className="truncate font-bold text-black dark:text-white">
          {facility.name}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {getEnvironmentName(facility)}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create FacilityErrorCard**

`src/components/app/smartspace/dashboard/FacilityErrorCard.tsx`:

```tsx
import { IoIosWarning } from "react-icons/io";
import { getEnvironmentName } from "@hooks/opentech";
import { errorReason } from "@views/smartspace/dashboard/FacilityErrorRow";

export default function FacilityErrorCard({
  facility,
  error,
  onRetry,
  isRetrying,
}: {
  facility: any;
  error: any;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="mb-4 rounded-lg border bg-red-50 p-5 shadow-lg dark:border-zinc-700 dark:bg-red-950/30">
      <div className="flex items-center gap-2">
        <IoIosWarning className="min-w-5 text-red-500" />
        <h2 className="truncate font-bold text-black dark:text-white">
          {facility.name}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {getEnvironmentName(facility)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm text-red-600 dark:text-red-400">
          {errorReason(error)}
        </span>
        <button
          className="rounded-sm bg-yellow-500 px-3 py-1 font-bold text-white hover:bg-yellow-600 disabled:opacity-50 cursor-pointer"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Ensure the dashboard card view renders them**

If Task 3 Step 4's card-view block and the two card imports were deferred, add them now (exact code is in Task 3 Step 1 and Step 4).

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit; npm run lint; npm run build`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/app/smartspace/dashboard/FacilityPendingCard.tsx src/components/app/smartspace/dashboard/FacilityErrorCard.tsx src/components/app/smartspace/dashboard/SmartSpaceDashboard.tsx
git commit -m "feat: skeleton and error cards with retry in SmartSpace card view

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Graceful degradation for partial failures in the facility row

**Files:**
- Modify: `src/components/app/smartspace/dashboard/SmartSpaceFacilityRow.tsx`

**Interfaces:**
- Consumes: `facility.failedSections: string[]` produced by Task 2 (section names: `"edgeRouter"`, `"accessPoints"`, `"smartlockSummary"`, `"smartlocks"`, `"smartMotion"`, `"weather"`).
- Produces: nothing new — same component API.

- [ ] **Step 1: Stop hiding rows whose edge router call failed**

The current early return hides the entire row when edge router data is missing (silent data loss — the pre-existing behavior this task fixes). Change:

```tsx
if (
  Object.keys(facility.edgeRouter).length === 0 ||
  (toggledSections.openNet === false &&
    toggledSections.smartLock === false &&
    toggledSections.smartMotion === false)
) {
  return null;
}
```

to:

```tsx
if (
  toggledSections.openNet === false &&
  toggledSections.smartLock === false &&
  toggledSections.smartMotion === false
) {
  return null;
}
```

- [ ] **Step 2: Add a failed-section helper and "—" cells**

Below the `openDetailModal` function, add:

```tsx
const sectionFailed = (section: string) =>
  Array.isArray(facility.failedSections) &&
  facility.failedSections.includes(section);
```

In the OpenNet section, wrap the edge-router `<td>`: render the existing cell only when `!sectionFailed("edgeRouter")`, otherwise:

```tsx
<td
  className="px-4 py-2 text-center border-l border-zinc-300 dark:border-zinc-700 text-zinc-400"
  title="Edge router data unavailable"
>
  —
</td>
```

Same pattern for the two access-point `<td>`s when `sectionFailed("accessPoints")` (one "—" cell each, title `"Access point data unavailable"`, keep the `text-center` class).

For the SmartLock section, change the render condition from
`toggledSections.smartLock && facility.smartLocks.length > 0 ? (...normal cells...)` so that when `sectionFailed("smartlocks") || sectionFailed("smartlockSummary")` the fallback branch renders instead:

```tsx
) : toggledSections.smartLock ? (
  <td
    className="border-l border-zinc-300 dark:border-zinc-700 px-4 py-2 text-center text-zinc-400"
    colSpan={6}
    title={
      sectionFailed("smartlocks") || sectionFailed("smartlockSummary")
        ? "SmartLock data unavailable"
        : undefined
    }
  >
    {sectionFailed("smartlocks") || sectionFailed("smartlockSummary") ? "—" : ""}
  </td>
) : null}
```

(The full condition for the normal-cells branch becomes:
`toggledSections.smartLock && facility.smartLocks.length > 0 && !sectionFailed("smartlocks") && !sectionFailed("smartlockSummary")`.)

Mirror this for the SmartMotion section with `sectionFailed("smartMotion")`, tooltip `"SmartMotion data unavailable"`, on its existing empty-`<td>` fallback branch.

The expanded-row weather panel already renders "No weather data available" when `facility.weather` is null — no change needed there.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit; npm run lint; npm run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/app/smartspace/dashboard/SmartSpaceFacilityRow.tsx
git commit -m "feat: render unavailable-data placeholders instead of hiding facility rows

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Manual QA pass (spec verification checklist)

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` and open the printed localhost URL, log in, go to SmartSpace → Dashboard with a user that has many selected facilities.

- [ ] **Step 2: Walk the spec checklist**

1. Dashboard shell + skeleton rows render immediately; no full-page spinner.
2. Rows stream in as facilities load; totals update live; progress bar counts up and disappears at 100%.
3. Temporarily corrupt one facility's `apiSecret` (SmartSpace → Selected, or via user settings) → exactly one error row appears with "Authentication failed"; Retry refetches only that facility. Restore the secret afterwards.
4. In browser DevTools, block `api.weatherapi.com` (Network request blocking) → rows still render fully; expanded row shows "No weather data available".
5. Navigate to another SmartSpace tab and back → rows render instantly from cache; "Last updated" shows the earlier time; background refetch updates it.
6. Network tab: with 50+ facilities, at most ~6 facilities' request bursts in flight at once.
7. DevTools network throttling "Slow 3G" on one visit: no request runs past ~15s — slow endpoints degrade to "—" cells or an error row, never a stuck screen.
8. Card view: same checks for skeleton cards, error cards with Retry, and the disabled Export button while pending (tooltip shows remaining count).
9. Dark mode: new rows/cards/progress bar look correct in both themes.

- [ ] **Step 3: Report results**

Record any checklist failures as follow-up fixes before merging; do not mark the feature done with open failures.

---

## Self-Review Notes

- **Spec coverage:** provider/defaults → Task 1; per-facility queries, semaphore, timeouts, critical-vs-noncritical split, `failedSections` → Task 2; progressive rendering, totals `useMemo`, progress indicator, last-updated + Refresh All, export gating → Task 3; list pending/error rows + Retry → Task 4; card equivalents → Task 5; "—" unavailable cells → Task 6; spec's manual verification list → Task 7. `refetchInterval` replaces manual interval logic (Task 2). No gaps found.
- **Type consistency:** `errored` entry shape `{ facility, error, refetch, isFetching }` is identical in Task 2 (producer), Task 3 (dashboard), Task 4 (list/row), Task 5 (card). `colSpan` math matches the list's real column counts (1 + 3 + 6 + 6). `errorReason` is exported from `FacilityErrorRow.tsx` and imported by `FacilityErrorCard.tsx`.
- **Known intentional behavior changes** (called out inline): totals now computed from the filtered list for all sections; rows with failed edge-router data render with "—" instead of being hidden; per-facility auth toast removed (error rows replace it).

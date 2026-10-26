-- Point the weekly SmartLock Overview cron job at the smartlock-overview Edge
-- Function (supabase/functions/smartlock-overview), which replaces
-- send-smartlock-overview and works without the legacy JWT API keys.
--
-- The function authorizes callers by the project's secret API key on the
-- `apikey` header. New-style keys must never go on `Authorization: Bearer`
-- (the platform parses that as a JWT and rejects it), which is why the old
-- Vault secret `anon_key` is no longer used.
--
-- Prerequisite: a Vault secret named `smartlock_report_key` holding an
-- sb_secret_ key (Dashboard → Integrations → Vault). The cron job itself
-- (weekly-smartlock-overview, Mondays 08:00 UTC) is unchanged.

create or replace function public.call_send_smartlock_overview()
returns void
language plpgsql
set search_path = ''
as $$
declare
  report_key text := (
    select decrypted_secret from vault.decrypted_secrets where name = 'smartlock_report_key'
  );
begin
  if report_key is null then
    raise exception 'Vault secret smartlock_report_key is missing';
  end if;

  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/smartlock-overview',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', report_key),
    body := jsonb_build_object('triggered_at', now()::text),
    timeout_milliseconds := 300000
  );
end;
$$;

-- Only pg_cron (running as postgres) should trigger the email, not API callers.
revoke all on function public.call_send_smartlock_overview() from public, anon, authenticated;

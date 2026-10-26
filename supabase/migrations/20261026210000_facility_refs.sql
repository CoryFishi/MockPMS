-- Store favorite_tokens, selected_tokens and current_facility as references.
--
-- Each entry is stripped to {id, name, environment, propertyNumber, api} when
-- the user's `tokens` has the matching credential (same api + environment);
-- the frontend (@hooks/facilityRefs) and the smartlock-overview Edge Function
-- re-attach the secrets from `tokens`. Entries with no matching credential
-- keep their inline secrets so they keep working. The stored bearer token in
-- current_facility is always dropped.
--
-- ORDER MATTERS: deploy the frontend and the smartlock-overview function that
-- hydrate references BEFORE running this — older code reads secrets inline.
--
-- Apply in the Supabase SQL editor (runs as postgres, so the role guard
-- trigger allows it).

begin;

create or replace function pg_temp.to_facility_ref(f jsonb, creds jsonb[])
returns jsonb language sql immutable as $$
  select case
    when exists (
      select 1 from unnest(creds) c
      where c->>'api' = f->>'api'
        and coalesce(c->>'environment', '') = coalesce(f->>'environment', '')
    )
    then f - 'apiSecret' - 'client' - 'clientSecret' - 'token'
    else f - 'token'
  end
$$;

update public.user_data set
  favorite_tokens = (
    select coalesce(array_agg(pg_temp.to_facility_ref(f, tokens) order by ord), '{}')
    from unnest(favorite_tokens) with ordinality as t(f, ord)
  ),
  selected_tokens = (
    select coalesce(array_agg(pg_temp.to_facility_ref(f, tokens) order by ord), '{}')
    from unnest(selected_tokens) with ordinality as t(f, ord)
  ),
  current_facility = case
    when current_facility ? 'api' then pg_temp.to_facility_ref(current_facility, tokens)
    else current_facility
  end;

commit;

-- Check: entries still carrying secrets should equal the orphan count
-- (no matching credential), and no current_facility should hold a token.
-- select
--   count(*) filter (where f ? 'apiSecret') as with_secret,
--   count(*) filter (where f ? 'token')     as with_bearer
-- from public.user_data u,
--   lateral unnest(u.favorite_tokens || u.selected_tokens || array[u.current_facility]) f;

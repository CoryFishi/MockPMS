-- Verifies migrations/20261026220000_site_plans.sql.
-- Run in the Supabase SQL editor. Changes nothing: everything rolls back.
-- Needs one admin and one non-admin user_data row whose role grants
-- smartlockPlatform; the non-admin checks are skipped (with a notice) otherwise.
--
-- Result: a row saying PASS. Any failure aborts with an error naming the check.

begin;

do $$
declare
  admin_id uuid;
  member_id uuid;
  plan_id uuid;
  row_creator uuid;
  n int;
begin
  select count(*) into n
  from pg_policies
  where schemaname = 'public' and tablename = 'site_plans'
    and (roles && array['anon', 'public']::name[] or qual = 'true' or with_check = 'true');
  if n > 0 then
    raise exception 'FAIL: % overly permissive site_plans policies', n;
  end if;

  select user_id into admin_id from public.user_data where role = 'admin' limit 1;
  select u.user_id into member_id
  from public.user_data u join public.roles r on r.role_name = u.role
  where u.role is distinct from 'admin' and r.permissions ->> 'smartlockPlatform' = 'true'
  limit 1;
  if admin_id is null then
    raise exception 'SETUP: need at least one admin row in user_data';
  end if;

  -- Admin creates a plan; the trigger stamps the creator --------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_id, 'role', 'authenticated', 'email', 'admin@verify')::text, true);
  set local role authenticated;

  insert into public.site_plans (name, created_by) values ('verify plan', gen_random_uuid())
  returning id, created_by into plan_id, row_creator;
  if row_creator is distinct from admin_id then
    raise exception 'FAIL: created_by was not stamped from auth.uid()';
  end if;

  reset role;

  if member_id is null then
    raise notice 'SKIP: no non-admin user with smartlockPlatform; member checks not run';
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', member_id, 'role', 'authenticated', 'email', 'member@verify')::text, true);
    set local role authenticated;

    select count(*) into n from public.site_plans where id = plan_id;
    if n <> 1 then
      raise exception 'FAIL: member with smartlockPlatform cannot read the plan';
    end if;

    update public.site_plans set notes = 'edited' where id = plan_id;
    get diagnostics n = row_count;
    if n <> 1 then
      raise exception 'FAIL: member with smartlockPlatform cannot edit the plan';
    end if;

    select created_by into row_creator from public.site_plans where id = plan_id;
    if row_creator is distinct from admin_id then
      raise exception 'FAIL: update changed created_by';
    end if;

    delete from public.site_plans where id = plan_id;
    get diagnostics n = row_count;
    if n <> 0 then
      raise exception 'FAIL: member deleted a plan they did not create';
    end if;

    reset role;
  end if;

  -- No auth → no permission
  perform set_config('request.jwt.claims', '{}', true);
  if public.has_permission('smartlockPlatform') then
    raise exception 'FAIL: has_permission is true without a user';
  end if;
end $$;

select 'PASS' as result;

rollback;

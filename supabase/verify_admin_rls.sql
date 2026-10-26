-- Verifies the admin RLS setup from migrations/20261026000000_admin_rls.sql.
-- Run in the Supabase SQL editor. Changes nothing: everything rolls back.
-- Needs at least one admin and one non-admin row in user_data.
--
-- Result: a row saying PASS. Any failure aborts with an error naming the check.

begin;

do $$
declare
  admin_id uuid;
  member_id uuid;
  total int;
  n int;
begin
  -- Leftover permissive policies would undo everything below: flag any policy
  -- on these tables that is open to anon/public or whose condition is just "true"
  -- (except the intended "roles read").
  select count(*) into n
  from pg_policies
  where schemaname = 'public'
    and tablename in ('user_data', 'roles', 'user_events')
    and policyname <> 'roles read'
    and (roles && array['anon', 'public']::name[] or qual = 'true' or with_check = 'true');
  if n > 0 then
    raise exception 'FAIL: % overly permissive policies remain — inspect: select * from pg_policies where tablename in (''user_data'',''roles'',''user_events'');', n;
  end if;

  select user_id into admin_id from public.user_data where role = 'admin' limit 1;
  select user_id into member_id from public.user_data where role is distinct from 'admin' limit 1;
  if admin_id is null or member_id is null then
    raise exception 'SETUP: need at least one admin and one non-admin row in user_data';
  end if;
  select count(*) into total from public.user_data;

  -- As a regular user -------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', member_id, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.user_data;
  if n <> 1 then
    raise exception 'FAIL: non-admin sees % user_data rows (expected 1)', n;
  end if;

  update public.user_data set tokens = tokens where user_id = admin_id;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAIL: non-admin updated another user''s row';
  end if;

  begin
    update public.user_data set role = 'admin' where user_id = member_id;
    raise exception 'FAIL: non-admin promoted themselves to admin';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.admin_delete_user(admin_id);
    raise exception 'FAIL: non-admin called admin_delete_user';
  exception when insufficient_privilege then null;
  end;

  insert into public.user_events (event_name, event_description, completed)
  values ('RLS verify', 'rolled back', true);

  perform 1 from public.roles limit 1;
  reset role;

  -- As an admin -------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.user_data;
  if n <> total then
    raise exception 'FAIL: admin sees % of % user_data rows', n, total;
  end if;

  update public.user_data set tokens = tokens where user_id = member_id;
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'FAIL: admin could not update another user''s row';
  end if;

  reset role;
end $$;

select 'PASS: admin RLS checks succeeded (all changes rolled back)' as result;

rollback;

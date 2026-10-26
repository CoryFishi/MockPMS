-- RLS performance cleanup for the policies from 20261026000000_admin_rls.sql.
-- Same access rules; fixes the Supabase performance advisor warnings:
--
--   * auth_rls_initplan — auth.uid() / is_admin() are wrapped in (select …) so
--     Postgres evaluates them once per query instead of once per row.
--   * multiple_permissive_policies — each "own" + "admin" pair for the same
--     action is merged into one policy (own row OR admin).
--   * duplicate_index — user_data_user_id_key duplicates the primary key.
--
-- Apply in the Supabase SQL editor, then run supabase/verify_admin_rls.sql.

begin;

-- user_data ---------------------------------------------------------------

drop policy if exists "user_data own select"   on public.user_data;
drop policy if exists "user_data admin select" on public.user_data;
drop policy if exists "user_data own update"   on public.user_data;
drop policy if exists "user_data admin update" on public.user_data;
drop policy if exists "user_data own insert"   on public.user_data;
drop policy if exists "user_data admin delete" on public.user_data;

-- Everyone reads their own row; admins read all
create policy "user_data select" on public.user_data
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Everyone inserts their own row (guard_user_data_role restricts the role)
create policy "user_data own insert" on public.user_data
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Everyone updates their own row; admins update all
create policy "user_data update" on public.user_data
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "user_data admin delete" on public.user_data
  for delete to authenticated
  using ((select public.is_admin()));

alter table public.user_data drop constraint if exists user_data_user_id_key;

-- roles -------------------------------------------------------------------

drop policy if exists "roles admin insert" on public.roles;
drop policy if exists "roles admin update" on public.roles;
drop policy if exists "roles admin delete" on public.roles;

create policy "roles admin insert" on public.roles
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "roles admin update" on public.roles
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "roles admin delete" on public.roles
  for delete to authenticated
  using ((select public.is_admin()));

-- user_events -------------------------------------------------------------

drop policy if exists "user_events own select"   on public.user_events;
drop policy if exists "user_events admin select" on public.user_events;
drop policy if exists "user_events own insert"   on public.user_events;

-- Everyone reads their own events; admins read all
create policy "user_events select" on public.user_events
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "user_events own insert" on public.user_events
  for insert to authenticated
  with check (user_id = (select auth.uid()));

commit;

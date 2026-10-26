-- Admin access via row-level security instead of the service role key.
--
-- Before this migration the frontend shipped VITE_SUPABASE_SERVICE_KEY to the
-- browser and used it for admin pages. After it, admin pages use the public
-- client and the database decides what an admin may do:
--   * public.is_admin()            — true when the caller's user_data.role = 'admin'
--   * RLS policies                 — own-row access for everyone, all rows for admins
--   * guard_user_data_role trigger — only admins can change a role (blocks self-promotion)
--   * public.admin_delete_user()   — replaces auth.admin.deleteUser()
--
-- Safe to re-run: functions use CREATE OR REPLACE and every policy is dropped
-- by name before being created. Policies are permissive (OR'd), so any
-- pre-existing policies keep working alongside these.

begin;

-- ---------------------------------------------------------------------------
-- is_admin(): SECURITY DEFINER so it can read user_data without recursing
-- through user_data's own RLS policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_data
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Role guard: non-admins may create their row with role 'user' (or no role)
-- and may never change role or user_id afterwards. Calls with no auth.uid()
-- (SQL editor, service role) are trusted.
-- ---------------------------------------------------------------------------
create or replace function public.guard_user_data_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is not null and new.role <> 'user' then
      raise exception 'Only admins can assign role "%"', new.role
        using errcode = '42501';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change roles' using errcode = '42501';
    end if;
    if new.user_id is distinct from old.user_id then
      raise exception 'user_id cannot be changed' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_user_data_role on public.user_data;
create trigger guard_user_data_role
  before insert or update on public.user_data
  for each row execute function public.guard_user_data_role();

-- ---------------------------------------------------------------------------
-- user_data
-- ---------------------------------------------------------------------------
alter table public.user_data enable row level security;

drop policy if exists "user_data own select" on public.user_data;
create policy "user_data own select" on public.user_data
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "user_data own insert" on public.user_data;
create policy "user_data own insert" on public.user_data
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "user_data own update" on public.user_data;
create policy "user_data own update" on public.user_data
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "user_data admin select" on public.user_data;
create policy "user_data admin select" on public.user_data
  for select to authenticated using (public.is_admin());

drop policy if exists "user_data admin update" on public.user_data;
create policy "user_data admin update" on public.user_data
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "user_data admin delete" on public.user_data;
create policy "user_data admin delete" on public.user_data
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- roles: every signed-in user reads roles (AuthProvider resolves permissions);
-- only admins write.
-- ---------------------------------------------------------------------------
alter table public.roles enable row level security;

drop policy if exists "roles read" on public.roles;
create policy "roles read" on public.roles
  for select to authenticated using (true);

drop policy if exists "roles admin insert" on public.roles;
create policy "roles admin insert" on public.roles
  for insert to authenticated with check (public.is_admin());

drop policy if exists "roles admin update" on public.roles;
create policy "roles admin update" on public.roles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "roles admin delete" on public.roles;
create policy "roles admin delete" on public.roles
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- user_events: addEvent() inserts without user_id, so default it to the caller.
-- Users log and read their own events; admins read all.
-- ---------------------------------------------------------------------------
alter table public.user_events alter column user_id set default auth.uid();
alter table public.user_events enable row level security;

drop policy if exists "user_events own insert" on public.user_events;
create policy "user_events own insert" on public.user_events
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "user_events own select" on public.user_events;
create policy "user_events own select" on public.user_events
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "user_events admin select" on public.user_events;
create policy "user_events admin select" on public.user_events
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- admin_delete_user(): replaces supabaseAdmin.auth.admin.deleteUser().
-- ---------------------------------------------------------------------------
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete users' using errcode = '42501';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Admins cannot delete themselves' using errcode = '42501';
  end if;

  delete from public.user_data where user_id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

commit;

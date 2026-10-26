-- Site plans for SmartSpace → Mapping (docs/superpowers/specs/2026-10-26-site-plan-mapping-design.md).
--
--   * has_permission(key) — true when the caller's role grants `key` in
--     roles.permissions, or the caller is an admin.
--   * site_plans — shared pre-install site plans. Anyone with smartlockPlatform
--     reads, creates and edits every plan; only the creator or an admin deletes.
--     site_plans_stamp fills created_* / updated_* so clients never send them.
--   * site-plan-backgrounds — private Storage bucket for the background images.
--
-- Safe to re-run. Apply in the Supabase SQL editor, then run
-- supabase/verify_site_plans.sql.

begin;

-- ---------------------------------------------------------------------------
-- has_permission(): SECURITY DEFINER so it can read user_data without
-- recursing through user_data's RLS.
-- ---------------------------------------------------------------------------
create or replace function public.has_permission(key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or coalesce((
    select (r.permissions ->> key) = 'true'
    from public.user_data u
    join public.roles r on r.role_name = u.role
    where u.user_id = auth.uid()
    limit 1
  ), false);
$$;

revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;

-- ---------------------------------------------------------------------------
-- site_plans
-- ---------------------------------------------------------------------------
create table if not exists public.site_plans (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(trim(name)) > 0),
  customer         text not null default '',
  address          text not null default '',
  notes            text not null default '',
  layout           jsonb not null default
    '{"version":1,"background":null,"scale":null,"nodes":[],"links":[],"shapes":[]}'::jsonb,
  summary          jsonb not null default '{}'::jsonb,
  created_by       uuid references auth.users (id) on delete set null,
  created_by_email text,
  created_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null,
  updated_by_email text,
  updated_at       timestamptz not null default now()
);

create index if not exists site_plans_updated_at_idx on public.site_plans (updated_at desc);

create or replace function public.site_plans_stamp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by       := auth.uid();
    new.created_by_email := auth.jwt() ->> 'email';
    new.created_at       := now();
  else
    new.created_by       := old.created_by;
    new.created_by_email := old.created_by_email;
    new.created_at       := old.created_at;
  end if;
  new.updated_by       := auth.uid();
  new.updated_by_email := auth.jwt() ->> 'email';
  new.updated_at       := now();
  return new;
end;
$$;

drop trigger if exists site_plans_stamp on public.site_plans;
create trigger site_plans_stamp
  before insert or update on public.site_plans
  for each row execute function public.site_plans_stamp();

alter table public.site_plans enable row level security;

drop policy if exists "site_plans select" on public.site_plans;
create policy "site_plans select" on public.site_plans
  for select to authenticated
  using ((select public.has_permission('smartlockPlatform')));

drop policy if exists "site_plans insert" on public.site_plans;
create policy "site_plans insert" on public.site_plans
  for insert to authenticated
  with check ((select public.has_permission('smartlockPlatform')));

drop policy if exists "site_plans update" on public.site_plans;
create policy "site_plans update" on public.site_plans
  for update to authenticated
  using ((select public.has_permission('smartlockPlatform')))
  with check ((select public.has_permission('smartlockPlatform')));

drop policy if exists "site_plans delete" on public.site_plans;
create policy "site_plans delete" on public.site_plans
  for delete to authenticated
  using (
    (select public.has_permission('smartlockPlatform'))
    and (created_by = (select auth.uid()) or (select public.is_admin()))
  );

-- ---------------------------------------------------------------------------
-- site-plan-backgrounds bucket: objects live at {planId}/{uuid}.{png|jpg}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-plan-backgrounds', 'site-plan-backgrounds', false, 15728640,
        array['image/png', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site plan backgrounds select" on storage.objects;
create policy "site plan backgrounds select" on storage.objects
  for select to authenticated
  using (bucket_id = 'site-plan-backgrounds'
         and (select public.has_permission('smartlockPlatform')));

drop policy if exists "site plan backgrounds insert" on storage.objects;
create policy "site plan backgrounds insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-plan-backgrounds'
              and (select public.has_permission('smartlockPlatform')));

drop policy if exists "site plan backgrounds update" on storage.objects;
create policy "site plan backgrounds update" on storage.objects
  for update to authenticated
  using (bucket_id = 'site-plan-backgrounds'
         and (select public.has_permission('smartlockPlatform')))
  with check (bucket_id = 'site-plan-backgrounds'
              and (select public.has_permission('smartlockPlatform')));

drop policy if exists "site plan backgrounds delete" on storage.objects;
create policy "site plan backgrounds delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-plan-backgrounds'
         and (select public.has_permission('smartlockPlatform')));

commit;

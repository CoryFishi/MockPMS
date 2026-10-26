-- site_plans_stamp is a trigger function; nobody needs to call it over the API.
-- Postgres only checks EXECUTE when the trigger is created, so revoking it
-- doesn't stop the trigger. Clears the Supabase advisor's
-- "anon/authenticated can execute SECURITY DEFINER function" warnings for it.

revoke all on function public.site_plans_stamp() from public, anon, authenticated;

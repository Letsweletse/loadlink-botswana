-- Grant EXECUTE on the app's SECURITY DEFINER RPCs to the API roles.
-- Purpose: accept_load / admin_cancel_load / admin_verify_payment were created
-- directly against the database (never committed as a migration) and never had
-- EXECUTE granted to anon/authenticated. PostgREST does not implicitly grant
-- call permission just because a function exists — Postgres requires it
-- explicitly — so every call was failing with "permission denied for function"
-- (42501) before it ever reached the function's own row-lock/wallet-check/
-- is_admin() logic. This grants call access broadly; each function already
-- enforces its own authorization internally (status checks, is_admin(), etc.),
-- so a broad EXECUTE grant is the correct Supabase pattern here.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('accept_load', 'admin_cancel_load', 'admin_verify_payment')
  loop
    execute format('grant execute on function %s to authenticated;', r.sig);
  end loop;
end $$;

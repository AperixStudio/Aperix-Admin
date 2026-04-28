-- =============================================================
-- 0002 — Grant table privileges to service_role and authenticated
-- =============================================================
-- Newer Supabase projects do NOT auto-grant table privileges to
-- service_role / authenticated on user-created tables. Without
-- this, the live adapter hits "permission denied for table X"
-- (Postgres SQLSTATE 42501) even though it uses the service role
-- key (which is supposed to bypass RLS).
--
-- RLS still applies for the anon/authenticated roles via the
-- policies created in 0001_init.sql — these grants only restore
-- the underlying Postgres privileges so RLS can be evaluated.
-- =============================================================

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

grant select on all tables in schema public to authenticated;

-- Make future tables inherit these grants automatically.
alter default privileges in schema public
  grant all privileges on tables    to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
alter default privileges in schema public
  grant all privileges on functions to service_role;
alter default privileges in schema public
  grant select on tables to authenticated;

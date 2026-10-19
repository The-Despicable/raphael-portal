-- ===========================================================================
-- Raphael Research Portal — revoke browser-role table privileges
--
-- WHY THIS EXISTS
-- ---------------
-- Supabase grants SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on
-- every new table in the public schema to the anon and authenticated roles.
-- Those grants are what the PostgREST and GraphQL APIs expose to the public
-- anon key.
--
-- Row-level security already neutralises them: every table carries a deny-all
-- policy (USING (false) WITH CHECK (false)), so a browser query returns no rows
-- and every write is refused. RLS is the control doing the work.
--
-- This migration removes the grant layer underneath it so that the two are
-- independent. Defence in depth means a future, accidental
-- ALTER TABLE ... DISABLE ROW LEVEL SECURITY cannot silently turn the community
-- tables — chat messages, reviews, paper suggestions and reports — into
-- anon-readable tables. Under the previous state that single mistake would have
-- exposed every row to anyone holding the publishable anon key.
--
-- SCOPE
-- -----
-- Exactly the four application tables created by 001_init.sql. No ownership
-- change, no policy change, no other schema, no project-level settings.
--
-- DELIBERATELY LEFT ALONE
-- -----------------------
--   postgres      The owner of all four tables, and the role the server-side
--                 connection string uses. An owner keeps implicit privileges
--                 regardless of the ACL, so this migration cannot reduce the
--                 access the application depends on. It also holds BYPASSRLS,
--                 which is what allows it to work through the deny-all policies
--                 at all.
--   service_role  Supabase server-side API role. Raphael does not use it — it
--                 connects over a direct Postgres connection — but revoking it
--                 would be an unrequested change to platform behaviour.
--   PUBLIC        This database grants nothing to PUBLIC on these tables, so no
--                 revoke from PUBLIC is required.
--
-- Ordering: apply after 001_init.sql. REVOKE is idempotent, so re-running this
-- migration is safe.
-- ===========================================================================

BEGIN;

REVOKE ALL PRIVILEGES ON TABLE public.chat_messages     FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.reviews           FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.paper_suggestions FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.reports           FROM anon, authenticated;

COMMIT;
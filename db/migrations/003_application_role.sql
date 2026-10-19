-- ===========================================================================
-- Raphael Research Portal — least-privilege application role
--
-- NO CREDENTIAL APPEARS IN THIS FILE, and none must ever be added.
--
-- CREATED NOLOGIN. There is no usable credential until LOGIN and a password are
-- provisioned separately, outside the repository, after these grants have been
-- verified. That separation is deliberate: grants can be reviewed while the
-- role cannot authenticate.
--
-- PostgreSQL has no CREATE ROLE IF NOT EXISTS. The DO block below refuses to
-- proceed if raphael_app already exists, because silently inheriting an unknown
-- role's attributes and memberships would defeat the point of this migration.
--
-- Derived statement by statement from src/lib/store/index.ts. Every column name
-- below was checked against the live schema.
--
--   addMessage      INSERT (id,nickname,accent,body,moderation)
--                    RETURNING id,nickname,accent,body,created_at,moderation
--   listMessages    SELECT all six columns
--   setModeration   UPDATE ... SET moderation
--   addReview       INSERT (9 columns) RETURNING all ten
--   listReviews     SELECT all ten + COUNT(*)
--   setModeration   UPDATE ... SET moderation
--   addSuggestion   INSERT (7 columns) RETURNING all eight
--   addReport       INSERT (4 columns), no RETURNING, never read back
--
-- created_at is excluded from every INSERT grant: the application never lists
-- it and always relies on the column default. id is excluded from the reports
-- INSERT because it is bigserial.
--
-- RUN ONCE, under migration tracking. The role block is idempotent-by-refusal;
-- the CREATE POLICY statements are not (PostgreSQL has no CREATE POLICY IF NOT
-- EXISTS), so a second manual run raises rather than silently succeeding.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Role — created only when absent; otherwise STOP.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'raphael_app') THEN
    RAISE EXCEPTION
      'Role raphael_app already exists. Refusing to proceed: this migration must not inherit unknown attributes, memberships or privileges from an existing role. Drop it manually if that is intended, then re-run.';
  END IF;

  CREATE ROLE raphael_app
    NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
END
$$;

-- Schema usage. Required to resolve public.* at all, and the ONLY schema
-- granted: no auth, storage, vault, realtime or graphql_* access.
GRANT USAGE ON SCHEMA public TO raphael_app;

-- ---------------------------------------------------------------------------
-- Table privileges, column-level where it narrows the grant
-- ---------------------------------------------------------------------------

-- listMessages reads all six columns, so SELECT is table-level.
-- INSERT omits created_at. UPDATE touches the moderation column and nothing
-- else, so the role cannot rewrite a message body or a timestamp.
GRANT SELECT ON public.chat_messages TO raphael_app;
GRANT INSERT (id, nickname, accent, body, moderation) ON public.chat_messages TO raphael_app;
GRANT UPDATE (moderation) ON public.chat_messages TO raphael_app;

-- listReviews reads all ten columns and counts them; setModeration updates only
-- the moderation column.
GRANT SELECT ON public.reviews TO raphael_app;
GRANT INSERT (id, nickname, accent, rating, title, body, category, component, moderation)
  ON public.reviews TO raphael_app;
GRANT UPDATE (moderation) ON public.reviews TO raphael_app;

-- addSuggestion RETURNINGs every column and the route returns the whole
-- PaperSuggestion object to the client, so SELECT covers all eight. Narrowing
-- RETURNING would change the API response and is out of scope here.
GRANT INSERT (id, title, identifier, relevance, component, rationale, review_status)
  ON public.paper_suggestions TO raphael_app;
GRANT SELECT ON public.paper_suggestions TO raphael_app;

-- addReport has no RETURNING and nothing reads reports, so INSERT only.
-- id is omitted (bigserial default) and created_at is never written.
GRANT INSERT (target_kind, target_id, reason, reporter_digest)
  ON public.reports TO raphael_app;

-- reports.id is bigserial and the INSERT omits id, so the DEFAULT calls
-- nextval(). USAGE alone permits nextval(); SELECT is not required for that and
-- is deliberately not granted. No currval/lastval/nextval/setval or
-- sequence-state query exists anywhere in src/ or tests/.
GRANT USAGE ON SEQUENCE public.reports_id_seq TO raphael_app;

-- ---------------------------------------------------------------------------
-- Row-level security — command-specific policies
-- ---------------------------------------------------------------------------
-- The four existing *_server_only policies are USING (false) with no role
-- clause, so they deny EVERY role that lacks BYPASSRLS, including this one.
-- An application-role policy is therefore required, not optional.
--
-- Policies are permissive and unioned per command, so both sets apply at once:
-- the policies below admit raphael_app for the listed commands, and the
-- retained deny-all policies keep refusing anon and authenticated. Nothing is
-- dropped or replaced.
--
-- These policies are deliberately command-specific rather than FOR ALL, and
-- there is NO DELETE policy anywhere in this file. RLS is a second gate behind
-- the column grants: even if an unrelated future GRANT were to hand this role
-- DELETE on a table, no policy would permit the deletion, so the statement would
-- be refused for want of a policy.
CREATE POLICY raphael_app_chat_messages_select ON public.chat_messages
  FOR SELECT TO raphael_app USING (true);

CREATE POLICY raphael_app_chat_messages_insert ON public.chat_messages
  FOR INSERT TO raphael_app WITH CHECK (true);

CREATE POLICY raphael_app_chat_messages_update ON public.chat_messages
  FOR UPDATE TO raphael_app USING (true) WITH CHECK (true);

CREATE POLICY raphael_app_reviews_select ON public.reviews
  FOR SELECT TO raphael_app USING (true);

CREATE POLICY raphael_app_reviews_insert ON public.reviews
  FOR INSERT TO raphael_app WITH CHECK (true);

CREATE POLICY raphael_app_reviews_update ON public.reviews
  FOR UPDATE TO raphael_app USING (true) WITH CHECK (true);

CREATE POLICY raphael_app_paper_suggestions_select ON public.paper_suggestions
  FOR SELECT TO raphael_app USING (true);

CREATE POLICY raphael_app_paper_suggestions_insert ON public.paper_suggestions
  FOR INSERT TO raphael_app WITH CHECK (true);

CREATE POLICY raphael_app_reports_insert ON public.reports
  FOR INSERT TO raphael_app WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Close the gap left by 002
-- ---------------------------------------------------------------------------
-- 002 revoked the four TABLES from the browser roles but not the bigserial's
-- sequence, which still granted anon and authenticated USAGE and SELECT. The
-- tables stay inaccessible either way, so no community data is exposed; this
-- removes an unintended grant so the ACL matches 002's stated intent.
REVOKE ALL PRIVILEGES ON SEQUENCE public.reports_id_seq FROM anon, authenticated;

COMMIT;
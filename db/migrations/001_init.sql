-- ===========================================================================
-- Raphael Research Portal — initial schema
--
-- PRIVACY POSTURE
-- ---------------
-- This schema stores ONLY what the community features need:
--   - a pseudonym (nickname) that is not linked to any real identity
--   - the text a visitor chose to post
--   - a timestamp
--   - a keyed hash of the guest session, used for rate limiting and duplicate
--     suppression. The raw session token is NEVER persisted.
--
-- There is deliberately NO column for:
--   - an email address, IP address, user agent, or device fingerprint
--   - a moderation note that could be mistaken for a verified fact
--   - anything derived from the assessed project's private repositories
--
-- Apply with your managed provider's migration tooling, e.g.
--   psql "$DATABASE_URL" -f db/migrations/001_init.sql
-- ===========================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Chat messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id          text PRIMARY KEY,
  nickname    text        NOT NULL CHECK (char_length(nickname) BETWEEN 2 AND 24),
  accent      text        NOT NULL DEFAULT 'cyan',
  body        text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 800),
  moderation  text        NOT NULL DEFAULT 'VISIBLE'
                        CHECK (moderation IN ('VISIBLE', 'PENDING', 'HIDDEN')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx
  ON chat_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS chat_messages_visible_idx
  ON chat_messages (created_at DESC) WHERE moderation = 'VISIBLE';

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id          text PRIMARY KEY,
  -- Null when the visitor was not in a guest session at submission time.
  nickname    text        CHECK (nickname IS NULL OR char_length(nickname) BETWEEN 2 AND 24),
  accent      text,
  rating      smallint    CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  title       text        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  body        text        NOT NULL CHECK (char_length(body) BETWEEN 10 AND 4000),
  category    text        NOT NULL CHECK (category IN (
                'PROJECT_OVERVIEW', 'ARCHITECTURE', 'RESEARCH_LIBRARY',
                'DOCUMENTATION', 'CONTRIBUTION_EXPERIENCE', 'OTHER')),
  component   text        CHECK (component IS NULL OR component IN (
                'RUNTIME_ORCHESTRATION', 'CAPABILITY_BROKER_PDP', 'PEP_AUTHORIZATION',
                'EXECUTION_BOUNDARY', 'EVIDENCE_PROVENANCE', 'MEASUREMENT_EVALUATION',
                'AGENT_SELF_IMPROVEMENT', 'GOVERNANCE_GATES', 'VESPER_SUCCESSOR')),
  moderation  text        NOT NULL DEFAULT 'PENDING'
                        CHECK (moderation IN ('VISIBLE', 'PENDING', 'HIDDEN')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_created_at_idx
  ON reviews (created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_visible_idx
  ON reviews (created_at DESC) WHERE moderation = 'VISIBLE';

-- ---------------------------------------------------------------------------
-- Paper suggestions (never auto-merged into the verified bibliography)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paper_suggestions (
  id            text PRIMARY KEY,
  title         text        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  identifier    text        NOT NULL CHECK (char_length(identifier) BETWEEN 3 AND 200),
  relevance     text        NOT NULL CHECK (char_length(relevance) BETWEEN 10 AND 1000),
  component     text,
  rationale     text        NOT NULL CHECK (char_length(rationale) BETWEEN 10 AND 2000),
  review_status text        NOT NULL DEFAULT 'AWAITING_REVIEW'
                          CHECK (review_status = 'AWAITING_REVIEW'),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
-- `reporter_digest` is a keyed HMAC of the guest session, not a session token
-- and not an IP address. Reports are NEVER exposed by any public endpoint.
CREATE TABLE IF NOT EXISTS reports (
  id              bigserial PRIMARY KEY,
  target_kind     text        NOT NULL CHECK (target_kind IN ('MESSAGE', 'REVIEW', 'SUGGESTION')),
  target_id       text        NOT NULL,
  reason          text        NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
  reporter_digest text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_target_idx ON reports (target_kind, target_id);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
-- The application connects with a server-side credential and performs all
-- access through server-side queries. RLS is enabled as defence in depth: if a
-- client ever obtained a direct database URL, these policies would still
-- refuse anonymous reads and writes.
--
-- NOTE: the application role must be granted BYPASSRLS, or you must supply a
-- dedicated server-side policy. Do NOT grant BYPASSRLS to an anon role.
ALTER TABLE chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_server_only    ON chat_messages;
CREATE POLICY chat_messages_server_only ON chat_messages
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS reviews_server_only          ON reviews;
CREATE POLICY reviews_server_only ON reviews
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS paper_suggestions_server_only ON paper_suggestions;
CREATE POLICY paper_suggestions_server_only ON paper_suggestions
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS reports_server_only          ON reports;
CREATE POLICY reports_server_only ON reports
  FOR ALL USING (false) WITH CHECK (false);

COMMIT;

-- ===========================================================================
-- DATA RETENTION
-- ===========================================================================
-- Nothing here is indefinite. Chat messages expire after 30 days and reviews
-- after 365. Reports are retained 90 days for abuse investigation.
--
-- Run these on a schedule (cron, pg_cron, or a platform job):
--
--   DELETE FROM chat_messages WHERE created_at < now() - interval '30 days';
--   DELETE FROM reviews       WHERE created_at < now() - interval '365 days';
--   DELETE FROM reports       WHERE created_at < now() - interval '90 days';
--
-- Adjust the intervals to your jurisdiction and moderation obligations before
-- going live, and record what you chose.
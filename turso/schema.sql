-- ===========================================================================
-- MITHQAL Assurance — Turso (libSQL) projection schema
-- Correction 2 of the FULL-PLATFORM-BUILD directive.
--
-- EXACTLY 7 projection tables. Every table records:
--   * source_commit   — the git commit hash of the Neon writer that emitted
--                       the OutboxEvent this projection row was built from.
--   * projected_at    — the timestamp at which the Turso projector applied
--                       the row (UTC, ISO-8601).
--
-- These columns are the watermark bookkeeping that lets the
-- `turso-reconcile` Inngest function detect drift between the
-- authoritative Neon writer and the Turso read projection. A row whose
-- `projected_at` lags more than the §5.3 EVENTUAL_CONSISTENCY_PROJECTION
-- tolerance (1000 ms) is treated as STALE and the read router MUST fall
-- back to the authoritative writer (see src/lib/turso-projector.ts and
-- docs/turso-policy.md).
--
-- Truth state: DESIGN-STAGE. productionAuthorized = false.
-- Turso is READ-ONLY from the app perspective. The only writer is the
-- `inngest/functions/turso-projection.ts` projector that consumes the
-- Neon outbox_events table via the transactional-outbox pattern (§6.2).
-- ===========================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ---------------------------------------------------------------------------
-- 1. dashboard_summary
--    Single-row aggregate counters powering the dashboard cards.
--    Rebuilt by the `turso-projection` Inngest function on every
--    VALIDATION_CASE_RECEIVED / EXCEPTION_OPENED / EXCEPTION_RESOLVED
--    outbox event.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_summary (
  id                  TEXT PRIMARY KEY DEFAULT 'singleton',
  total_cases         INTEGER NOT NULL DEFAULT 0,
  validated_cases     INTEGER NOT NULL DEFAULT 0,
  open_exceptions     INTEGER NOT NULL DEFAULT 0,
  critical_exceptions INTEGER NOT NULL DEFAULT 0,
  reconciliations     INTEGER NOT NULL DEFAULT 0,
  safe_halted         INTEGER NOT NULL DEFAULT 0,
  last_updated        TEXT NOT NULL,
  source_commit       TEXT NOT NULL,
  projected_at        TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 2. recent_cases
--    Cap-bounded (200 rows) ring buffer of the newest validation_cases
--    for the dashboard "Recent activity" panel. Old rows are evicted by
--    the projector when the cap is exceeded.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recent_cases (
  id                TEXT PRIMARY KEY,
  case_id           TEXT NOT NULL UNIQUE,
  institution_id    TEXT NOT NULL,
  corridor          TEXT,
  source_currency   TEXT,
  target_currency   TEXT,
  amount            TEXT,
  status            TEXT NOT NULL,
  policy_version    TEXT,
  created_at        TEXT NOT NULL,
  source_commit     TEXT NOT NULL,
  projected_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recent_cases_created_at ON recent_cases (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_cases_institution ON recent_cases (institution_id);
CREATE INDEX IF NOT EXISTS idx_recent_cases_status ON recent_cases (status);

-- ---------------------------------------------------------------------------
-- 3. active_exceptions
--    Open exceptions for the dashboard exception queue view.
--    Rows are removed when status transitions to RESOLVED.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS active_exceptions (
  id                  TEXT PRIMARY KEY,
  exception_id        TEXT NOT NULL UNIQUE,
  case_id             TEXT NOT NULL,
  code                TEXT NOT NULL,
  severity            TEXT NOT NULL,
  owner               TEXT,
  reason_code         TEXT,
  opened_at           TEXT NOT NULL,
  source_commit       TEXT NOT NULL,
  projected_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_active_exceptions_severity ON active_exceptions (severity);
CREATE INDEX IF NOT EXISTS idx_active_exceptions_opened_at ON active_exceptions (opened_at DESC);

-- ---------------------------------------------------------------------------
-- 4. policy_cache
--    The latest active policy_version row. Single-row table that is
--    upserted by the `policy-publish` Inngest function on every policy
--    publish event. Used by the policy-registry read path.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_cache (
  id              TEXT PRIMARY KEY DEFAULT 'singleton',
  policy_version  TEXT NOT NULL,
  content_digest  TEXT NOT NULL,
  effective_from  TEXT NOT NULL,
  status          TEXT NOT NULL,
  source_commit   TEXT NOT NULL,
  projected_at   TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 5. session_state
--    Per-institution operator session state. Used by the dashboard
--    topbar to surface the current operator + tenant without hitting
--    Neon on every render.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_state (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL UNIQUE,
  institution_id  TEXT NOT NULL,
  user_subject    TEXT NOT NULL,
  scopes          TEXT,
  created_at      TEXT NOT NULL,
  expires_at      TEXT NOT NULL,
  source_commit   TEXT NOT NULL,
  projected_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_state_institution ON session_state (institution_id);
CREATE INDEX IF NOT EXISTS idx_session_state_expires_at ON session_state (expires_at);

-- ---------------------------------------------------------------------------
-- 6. reference_lookups
--    Static-ish reference data (corridors, currencies, custodians,
--    jurisdictions). Re-built on every reference-data outbox event.
--    Treated as eventually consistent reference cache.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reference_lookups (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL,
  code          TEXT NOT NULL,
  label         TEXT NOT NULL,
  jurisdiction  TEXT,
  metadata      TEXT,
  source_commit TEXT NOT NULL,
  projected_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reference_lookups_kind_code ON reference_lookups (kind, code);
CREATE UNIQUE INDEX IF NOT EXISTS ux_reference_lookups_kind_code_jurisdiction
  ON reference_lookups (kind, code, COALESCE(jurisdiction, ''));

-- ---------------------------------------------------------------------------
-- 7. rate_limit_counters
--    Token-bucket rate-limiter state. The rate limiter
--    (src/lib/rate-limiter.ts) reads + writes this row on every
--    request. This table is the ONLY Turso projection that is written
--    by the app directly (not by the outbox projector) because rate
--    limiting requires sub-second read-modify-write and cannot wait for
--    outbox fan-out. Per docs/turso-policy.md §5.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limit_counters (
  id             TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  route          TEXT NOT NULL,
  tokens         REAL NOT NULL,
  capacity       REAL NOT NULL,
  refill_rate    REAL NOT NULL,
  last_refill    TEXT NOT NULL,
  source_commit  TEXT NOT NULL,
  projected_at   TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_rate_limit_counters_inst_route
  ON rate_limit_counters (institution_id, route);

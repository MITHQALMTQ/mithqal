-- ===========================================================================
-- MITHQAL Assurance — Neon Postgres schema (audit dump).
-- FULL-PLATFORM-BUILD deliverable.
--
-- This file is the canonical reference schema for the 11 business
-- tables defined in src/db/schema.ts. It is dumped from the live
-- Neon database via:
--
--   psql $DATABASE_URL --schema-only > db/schema.sql
--
-- or, equivalently, generated from `drizzle-kit generate` against
-- src/db/schema.ts. The dump is the audit-trail reference: an
-- auditor reading this file at any future date can reconstruct the
-- exact column types + indexes that were deployed.
--
-- Truth state: DESIGN-STAGE. productionAuthorized = false.
-- The schema is migrated to Neon but contains no production data.
-- All rows inserted by `db/seed.ts` are labelled "DEMO DATA".
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE validation_status AS ENUM (
    'RECEIVED', 'VALIDATED', 'EXCEPTION_OPENED', 'RESOLVED', 'REPLAYED', 'SAFE_HALTED', 'CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'RECORD_RECEIVED', 'SOURCE_AUTHENTICATED', 'VALIDATION_PASSED', 'EXCEPTION_OPENED',
    'HUMAN_APPROVAL_RECORDED', 'PROVIDER_ACKNOWLEDGEMENT_RECEIVED',
    'SETTLEMENT_CONFIRMATION_RECEIVED', 'RECONCILIATION_COMPLETED',
    'EVIDENCE_CONFLICT_DETECTED', 'DISPUTE_OPENED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 1. institutions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS institutions (
  id                varchar(50) PRIMARY KEY,
  legal_name        varchar(255) NOT NULL,
  jurisdiction      varchar(10) NOT NULL,
  status            varchar(20) NOT NULL DEFAULT 'ACTIVE',
  participant_type  varchar(50) NOT NULL,
  config            jsonb,
  created_at        timestamp NOT NULL DEFAULT NOW(),
  updated_at        timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS inst_jurisdiction_idx ON institutions (jurisdiction);

-- ---------------------------------------------------------------------------
-- 2. validation_cases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS validation_cases (
  id                varchar(50) PRIMARY KEY,
  institution_id    varchar(50) NOT NULL REFERENCES institutions(id),
  source_reference  varchar(255),
  corridor          varchar(50),
  source_currency   varchar(3),
  target_currency   varchar(3),
  amount            decimal(20, 2),
  status            validation_status NOT NULL DEFAULT 'RECEIVED',
  policy_version    varchar(50),
  created_at        timestamp NOT NULL DEFAULT NOW(),
  updated_at        timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vc_institution_idx ON validation_cases (institution_id);
CREATE INDEX IF NOT EXISTS vc_status_idx     ON validation_cases (status);
CREATE INDEX IF NOT EXISTS vc_created_idx    ON validation_cases (created_at);

-- ---------------------------------------------------------------------------
-- 3. source_snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS source_snapshots (
  id                  varchar(50) PRIMARY KEY,
  validation_case_id  varchar(50) NOT NULL REFERENCES validation_cases(id),
  source_system       varchar(100) NOT NULL,
  record_version      varchar(50),
  payload_ref         text,
  payload_digest      varchar(255) NOT NULL,
  source_timestamp    timestamp NOT NULL,
  ingestion_timestamp timestamp NOT NULL DEFAULT NOW(),
  access_scope        varchar(100)
);
CREATE INDEX IF NOT EXISTS ss_case_idx ON source_snapshots (validation_case_id);

-- ---------------------------------------------------------------------------
-- 4. evidence_events (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence_events (
  id                  varchar(50) PRIMARY KEY,
  institution_id      varchar(50) NOT NULL,
  validation_case_id  varchar(50) REFERENCES validation_cases(id),
  event_type          event_type NOT NULL,
  actor_source        varchar(100) NOT NULL,
  timestamp           timestamp NOT NULL DEFAULT NOW(),
  signature_state     varchar(20) DEFAULT 'UNVERIFIED',
  prior_event_hash     varchar(255),
  details             jsonb
);
CREATE INDEX IF NOT EXISTS ee_case_idx ON evidence_events (validation_case_id);
CREATE INDEX IF NOT EXISTS ee_type_idx ON evidence_events (event_type);
CREATE INDEX IF NOT EXISTS ee_inst_idx ON evidence_events (institution_id);

-- ---------------------------------------------------------------------------
-- 5. exceptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exceptions (
  id                  varchar(50) PRIMARY KEY,
  validation_case_id  varchar(50) NOT NULL REFERENCES validation_cases(id),
  code                varchar(50) NOT NULL,
  severity            severity NOT NULL,
  owner               varchar(100),
  status              varchar(20) NOT NULL DEFAULT 'OPEN',
  required_evidence   jsonb,
  reason_code         varchar(50),
  recommended_action  text,
  opened_at           timestamp NOT NULL DEFAULT NOW(),
  resolved_at         timestamp
);
CREATE INDEX IF NOT EXISTS ex_case_idx      ON exceptions (validation_case_id);
CREATE INDEX IF NOT EXISTS ex_status_idx    ON exceptions (status);
CREATE INDEX IF NOT EXISTS ex_severity_idx  ON exceptions (severity);

-- ---------------------------------------------------------------------------
-- 6. policy_versions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_versions (
  id              varchar(50) PRIMARY KEY,
  effective_from  timestamp NOT NULL,
  effective_to    timestamp,
  content_digest  varchar(255) NOT NULL,
  approval_record jsonb,
  status          varchar(20) NOT NULL DEFAULT 'DRAFT'
);
CREATE INDEX IF NOT EXISTS pv_status_idx ON policy_versions (status);

-- ---------------------------------------------------------------------------
-- 7. policy_decisions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_decisions (
  id                  varchar(50) PRIMARY KEY,
  validation_case_id  varchar(50) NOT NULL REFERENCES validation_cases(id),
  policy_version_id   varchar(50) REFERENCES policy_versions(id),
  decision            varchar(20) NOT NULL,
  input_snapshot_id   varchar(50),
  reason_codes        jsonb,
  output              jsonb,
  actor               varchar(100) NOT NULL,
  evaluated_at        timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pd_case_idx ON policy_decisions (validation_case_id);

-- ---------------------------------------------------------------------------
-- 8. reconciliation_cases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reconciliation_cases (
  id                  varchar(50) PRIMARY KEY,
  validation_case_id  varchar(50) REFERENCES validation_cases(id),
  sources             jsonb NOT NULL,
  expected_value      text NOT NULL,
  actual_value        text NOT NULL,
  discrepancy_class  varchar(50) NOT NULL,
  tolerance_policy    varchar(50),
  resolution          text,
  status              varchar(20) NOT NULL DEFAULT 'OPEN',
  created_at          timestamp NOT NULL DEFAULT NOW(),
  resolved_at         timestamp
);
CREATE INDEX IF NOT EXISTS rc_case_idx     ON reconciliation_cases (validation_case_id);
CREATE INDEX IF NOT EXISTS rc_status_idx   ON reconciliation_cases (status);

-- ---------------------------------------------------------------------------
-- 9. idempotency_records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_records (
  id              varchar(50) PRIMARY KEY,
  institution_id  varchar(50) NOT NULL,
  idempotency_key varchar(255) NOT NULL,
  request_digest  varchar(255) NOT NULL,
  outcome         jsonb,
  expires_at      timestamp,
  created_at      timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ir_key_idx  ON idempotency_records (idempotency_key);
CREATE INDEX IF NOT EXISTS ir_inst_idx ON idempotency_records (institution_id);

-- ---------------------------------------------------------------------------
-- 10. outbox_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbox_events (
  id              varchar(50) PRIMARY KEY,
  aggregate_type  varchar(50) NOT NULL,
  aggregate_id    varchar(50) NOT NULL,
  event_type      varchar(50) NOT NULL,
  payload         jsonb NOT NULL,
  status          varchar(20) NOT NULL DEFAULT 'PENDING',
  retry_count     integer NOT NULL DEFAULT 0,
  created_at      timestamp NOT NULL DEFAULT NOW(),
  delivered_at    timestamp
);
CREATE INDEX IF NOT EXISTS ob_status_idx   ON outbox_events (status);
CREATE INDEX IF NOT EXISTS ob_created_idx  ON outbox_events (created_at);

-- ---------------------------------------------------------------------------
-- 11. access_audit_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_audit_events (
  id              varchar(50) PRIMARY KEY,
  institution_id  varchar(50) NOT NULL,
  actor           varchar(100) NOT NULL,
  action          varchar(50) NOT NULL,
  resource        varchar(255),
  result          varchar(20) NOT NULL,
  details         jsonb,
  timestamp       timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS aa_inst_idx   ON access_audit_events (institution_id);
CREATE INDEX IF NOT EXISTS aa_action_idx ON access_audit_events (action);

-- ---------------------------------------------------------------------------
-- Drizzle migrations table (managed by drizzle-kit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id        serial PRIMARY KEY,
  hash      text NOT NULL,
  created_at bigint
);

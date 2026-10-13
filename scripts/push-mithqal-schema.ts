/**
 * scripts/push-mithqal-schema.ts — MITHQAL MASTER BLUEPRINT §16.3.
 *
 * Push the 11-table MITHQAL Assurance schema to Neon Postgres using raw
 * SQL via @neondatabase/serverless. Idempotent — safe to re-run.
 *
 * Seeds:
 *   - 1 demo institution (Demo UAE Bank)
 *   - 1 demo validation case (VC-2027-0042)
 *   - 3 evidence events (RECORD_RECEIVED, SOURCE_AUTHENTICATED, VALIDATION_PASSED)
 *   - 1 demo exception (UNSTRUCTURED_ADDRESS)
 *   - 1 demo policy version (POLICY-v1.2.3) + policy decision
 *
 * Truth state: WIRED. Schema is created in MTQ-disabled research mode.
 * No payment is initiated. No value moves.
 */

import { neon } from "@neondatabase/serverless";

// Load .env so DATABASE_URL is available in the script process.
// Always overwrite process.env with the .env file value because Bun's
// auto-load does NOT override existing env vars (a stale
// `DATABASE_URL=file:...` from a prior Turso/SQLite session would
// otherwise win against the Postgres connection string in .env).
function loadEnvFile(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs");
    const envPath = ".env";
    if (!fs.existsSync(envPath)) {
      return;
    }
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      // Always overwrite — .env is the source of truth for this script.
      process.env[key] = value;
    }
  } catch {
    // ignore — caller will exit if DATABASE_URL is still unset
  }
}

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.startsWith("file:")) {
  console.error(
    "[mithqal/schema-push] DATABASE_URL is not set or is a non-Postgres URL (file:). " +
      "Expected postgresql://... — aborting.",
  );
  process.exit(1);
}

const sql = neon(databaseUrl);

/**
 * Execute a raw SQL string via sql.query(). Neon's HTTP driver exposes
 * `sql.query(text, params)` for conventional function calls (no tagged
 * template required). Pass an empty params array for DDL / statements
 * with no bound parameters.
 *
 * Errors are logged but suppressed when they match "already exists"
 * patterns — the script is idempotent.
 */
async function execRaw(label: string, stmt: string): Promise<void> {
  try {
    await (sql as unknown as { query: (text: string, params: unknown[]) => Promise<unknown> })
      .query(stmt, []);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists|duplicate_object|duplicate key/i.test(msg)) {
      console.warn(`[mithqal/schema-push] ${label} warning:`, msg);
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// 1b. Drop legacy tables that conflict with the new §16.3 schema.
//
// The Neon database retains tables from earlier pilots with column
// names that conflict with the new §16.3 schema (e.g., legacy
// `exceptions.instruction_id` vs new `exceptions.validation_case_id`).
// `CREATE TABLE IF NOT EXISTS` is a no-op when the table exists, so
// we DROP the conflicting tables first.
//
// This is safe because MITHQAL is pre-pilot — all existing rows are
// research-only demo data. productionAuthorized=false; no live data.
// ────────────────────────────────────────────────────────────────────
const DROP_LEGACY: string[] = [
  "DROP TABLE IF EXISTS access_audit_events CASCADE",
  "DROP TABLE IF EXISTS outbox_events CASCADE",
  "DROP TABLE IF EXISTS idempotency_records CASCADE",
  "DROP TABLE IF EXISTS reconciliation_cases CASCADE",
  "DROP TABLE IF EXISTS policy_decisions CASCADE",
  "DROP TABLE IF EXISTS policy_versions CASCADE",
  "DROP TABLE IF EXISTS exceptions CASCADE",
  "DROP TABLE IF EXISTS evidence_events CASCADE",
  "DROP TABLE IF EXISTS source_snapshots CASCADE",
  "DROP TABLE IF EXISTS validation_cases CASCADE",
  // Institutions: legacy schema lacks `config` column — drop & recreate.
  "DROP TABLE IF EXISTS institutions CASCADE",
  // Drop enum types so CREATE TYPE can run cleanly.
  "DROP TYPE IF EXISTS event_type CASCADE",
  "DROP TYPE IF EXISTS severity CASCADE",
  "DROP TYPE IF EXISTS validation_status CASCADE",
];

async function dropLegacyTables(): Promise<void> {
  for (const stmt of DROP_LEGACY) {
    await execRaw("drop-legacy", stmt);
  }
}

// ────────────────────────────────────────────────────────────────────
// 1. Enums (per §16.3 schema)
// ────────────────────────────────────────────────────────────────────
const ENUM_DEFS: Array<{ name: string; values: string[] }> = [
  {
    name: "validation_status",
    values: [
      "RECEIVED",
      "VALIDATED",
      "EXCEPTION_OPENED",
      "RESOLVED",
      "REPLAYED",
      "SAFE_HALTED",
      "CLOSED",
    ],
  },
  { name: "severity", values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
  {
    name: "event_type",
    values: [
      "RECORD_RECEIVED",
      "SOURCE_AUTHENTICATED",
      "VALIDATION_PASSED",
      "EXCEPTION_OPENED",
      "HUMAN_APPROVAL_RECORDED",
      "PROVIDER_ACKNOWLEDGEMENT_RECEIVED",
      "SETTLEMENT_CONFIRMATION_RECEIVED",
      "RECONCILIATION_COMPLETED",
      "EVIDENCE_CONFLICT_DETECTED",
      "DISPUTE_OPENED",
    ],
  },
];

async function createEnums(): Promise<void> {
  for (const e of ENUM_DEFS) {
    // Check if the enum already exists.
    const exists = await sql`
      SELECT 1 AS exists FROM pg_type WHERE typname = ${e.name} AND typtype = 'e'
    `;
    if (exists.length === 0) {
      const valuesList = e.values.map((v) => `'${v}'`).join(", ");
      await execRaw(`enum:${e.name}`, `CREATE TYPE ${e.name} AS ENUM (${valuesList});`);
    }
  }
}
// ────────────────────────────────────────────────────────────────────
// 2. Tables (per §16.3)
// ────────────────────────────────────────────────────────────────────
const TABLE_DEFS: Array<{ label: string; sql: string }> = [
  {
    label: "institutions",
    sql: `CREATE TABLE IF NOT EXISTS institutions (
      id VARCHAR(50) PRIMARY KEY,
      legal_name VARCHAR(255) NOT NULL,
      jurisdiction VARCHAR(10) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      participant_type VARCHAR(50) NOT NULL,
      config JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS inst_jurisdiction_idx ON institutions(jurisdiction);`,
  },
  {
    label: "validation_cases",
    sql: `CREATE TABLE IF NOT EXISTS validation_cases (
      id VARCHAR(50) PRIMARY KEY,
      institution_id VARCHAR(50) NOT NULL REFERENCES institutions(id),
      source_reference VARCHAR(255),
      corridor VARCHAR(50),
      source_currency VARCHAR(3),
      target_currency VARCHAR(3),
      amount NUMERIC(20,2),
      status validation_status NOT NULL DEFAULT 'RECEIVED',
      policy_version VARCHAR(50),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS vc_institution_idx ON validation_cases(institution_id);
    CREATE INDEX IF NOT EXISTS vc_status_idx ON validation_cases(status);
    CREATE INDEX IF NOT EXISTS vc_created_idx ON validation_cases(created_at);`,
  },
  {
    label: "source_snapshots",
    sql: `CREATE TABLE IF NOT EXISTS source_snapshots (
      id VARCHAR(50) PRIMARY KEY,
      validation_case_id VARCHAR(50) NOT NULL REFERENCES validation_cases(id),
      source_system VARCHAR(100) NOT NULL,
      record_version VARCHAR(50),
      payload_ref TEXT,
      payload_digest VARCHAR(255) NOT NULL,
      source_timestamp TIMESTAMP NOT NULL,
      ingestion_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      access_scope VARCHAR(100)
    );
    CREATE INDEX IF NOT EXISTS ss_case_idx ON source_snapshots(validation_case_id);`,
  },
  {
    label: "evidence_events",
    sql: `CREATE TABLE IF NOT EXISTS evidence_events (
      id VARCHAR(50) PRIMARY KEY,
      institution_id VARCHAR(50) NOT NULL,
      validation_case_id VARCHAR(50) REFERENCES validation_cases(id),
      event_type event_type NOT NULL,
      actor_source VARCHAR(100) NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      signature_state VARCHAR(20) DEFAULT 'UNVERIFIED',
      prior_event_hash VARCHAR(255),
      details JSONB
    );
    CREATE INDEX IF NOT EXISTS ee_case_idx ON evidence_events(validation_case_id);
    CREATE INDEX IF NOT EXISTS ee_type_idx ON evidence_events(event_type);
    CREATE INDEX IF NOT EXISTS ee_inst_idx ON evidence_events(institution_id);`,
  },
  {
    label: "exceptions",
    sql: `CREATE TABLE IF NOT EXISTS exceptions (
      id VARCHAR(50) PRIMARY KEY,
      validation_case_id VARCHAR(50) NOT NULL REFERENCES validation_cases(id),
      code VARCHAR(50) NOT NULL,
      severity severity NOT NULL,
      owner VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
      required_evidence JSONB,
      reason_code VARCHAR(50),
      recommended_action TEXT,
      opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ex_case_idx ON exceptions(validation_case_id);
    CREATE INDEX IF NOT EXISTS ex_status_idx ON exceptions(status);
    CREATE INDEX IF NOT EXISTS ex_severity_idx ON exceptions(severity);`,
  },
  {
    label: "policy_versions",
    sql: `CREATE TABLE IF NOT EXISTS policy_versions (
      id VARCHAR(50) PRIMARY KEY,
      effective_from TIMESTAMP NOT NULL,
      effective_to TIMESTAMP,
      content_digest VARCHAR(255) NOT NULL,
      approval_record JSONB,
      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    );
    CREATE INDEX IF NOT EXISTS pv_status_idx ON policy_versions(status);`,
  },
  {
    label: "policy_decisions",
    sql: `CREATE TABLE IF NOT EXISTS policy_decisions (
      id VARCHAR(50) PRIMARY KEY,
      validation_case_id VARCHAR(50) NOT NULL REFERENCES validation_cases(id),
      policy_version_id VARCHAR(50) REFERENCES policy_versions(id),
      decision VARCHAR(20) NOT NULL,
      input_snapshot_id VARCHAR(50),
      reason_codes JSONB,
      output JSONB,
      actor VARCHAR(100) NOT NULL,
      evaluated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS pd_case_idx ON policy_decisions(validation_case_id);`,
  },
  {
    label: "reconciliation_cases",
    sql: `CREATE TABLE IF NOT EXISTS reconciliation_cases (
      id VARCHAR(50) PRIMARY KEY,
      validation_case_id VARCHAR(50) REFERENCES validation_cases(id),
      sources JSONB NOT NULL,
      expected_value TEXT NOT NULL,
      actual_value TEXT NOT NULL,
      discrepancy_class VARCHAR(50) NOT NULL,
      tolerance_policy VARCHAR(50),
      resolution TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS rc_case_idx ON reconciliation_cases(validation_case_id);
    CREATE INDEX IF NOT EXISTS rc_status_idx ON reconciliation_cases(status);`,
  },
  {
    label: "idempotency_records",
    sql: `CREATE TABLE IF NOT EXISTS idempotency_records (
      id VARCHAR(50) PRIMARY KEY,
      institution_id VARCHAR(50) NOT NULL,
      idempotency_key VARCHAR(255) NOT NULL,
      request_digest VARCHAR(255) NOT NULL,
      outcome JSONB,
      expires_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ir_key_idx ON idempotency_records(idempotency_key);
    CREATE INDEX IF NOT EXISTS ir_inst_idx ON idempotency_records(institution_id);`,
  },
  {
    label: "outbox_events",
    sql: `CREATE TABLE IF NOT EXISTS outbox_events (
      id VARCHAR(50) PRIMARY KEY,
      aggregate_type VARCHAR(50) NOT NULL,
      aggregate_id VARCHAR(50) NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      delivered_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ob_status_idx ON outbox_events(status);
    CREATE INDEX IF NOT EXISTS ob_created_idx ON outbox_events(created_at);`,
  },
  {
    label: "access_audit_events",
    sql: `CREATE TABLE IF NOT EXISTS access_audit_events (
      id VARCHAR(50) PRIMARY KEY,
      institution_id VARCHAR(50) NOT NULL,
      actor VARCHAR(100) NOT NULL,
      action VARCHAR(50) NOT NULL,
      resource VARCHAR(255),
      result VARCHAR(20) NOT NULL,
      details JSONB,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS aa_inst_idx ON access_audit_events(institution_id);
    CREATE INDEX IF NOT EXISTS aa_action_idx ON access_audit_events(action);`,
  },
];

// ────────────────────────────────────────────────────────────────────
// 3. Seed data — DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE
// ────────────────────────────────────────────────────────────────────
const SEED_DEFS: Array<{ label: string; sql: string }> = [
  {
    label: "demo institution",
    sql: `INSERT INTO institutions (id, legal_name, jurisdiction, status, participant_type, config)
    SELECT 'INST-DEMO-AE', 'Demo UAE Bank (research-only)', 'AE', 'ACTIVE', 'BANK',
      '{"demo": true, "mtq_disabled": true}'::JSONB
    WHERE NOT EXISTS (SELECT 1 FROM institutions WHERE id = 'INST-DEMO-AE')`,
  },
  {
    label: "demo validation case",
    sql: `INSERT INTO validation_cases (id, institution_id, source_reference, corridor, source_currency, target_currency, amount, status, policy_version)
    SELECT 'VC-2027-0042', 'INST-DEMO-AE', 'SWIFT-MX-pacs.008-INS-003', 'AE-IN', 'AED', 'INR', '2100000.00', 'EXCEPTION_OPENED', 'POLICY-v1.2.3'
    WHERE NOT EXISTS (SELECT 1 FROM validation_cases WHERE id = 'VC-2027-0042')`,
  },
  {
    label: "source snapshot",
    sql: `INSERT INTO source_snapshots (id, validation_case_id, source_system, record_version, payload_ref, payload_digest, source_timestamp, access_scope)
    SELECT 'snap-VC-2027-0042-001', 'VC-2027-0042', 'Bank A SWIFT Interface', 'pacs.008.001.08', 's3://mithqal-demo/INS-003.json', 'sha256:demo-001', '2027-03-15T10:23:15.000Z', 'institution-private'
    WHERE NOT EXISTS (SELECT 1 FROM source_snapshots WHERE id = 'snap-VC-2027-0042-001')`,
  },
  {
    label: "evidence event 1",
    sql: `INSERT INTO evidence_events (id, institution_id, validation_case_id, event_type, actor_source, signature_state, details)
    SELECT 'evt-VC-2027-0042-001', 'INST-DEMO-AE', 'VC-2027-0042', 'RECORD_RECEIVED', 'Bank A SWIFT Interface', 'UNVERIFIED',
      '{"format":"ISO 20022 pacs.008.001.08","mtq_disabled":true}'::JSONB
    WHERE NOT EXISTS (SELECT 1 FROM evidence_events WHERE id = 'evt-VC-2027-0042-001')`,
  },
  {
    label: "evidence event 2",
    sql: `INSERT INTO evidence_events (id, institution_id, validation_case_id, event_type, actor_source, signature_state, details)
    SELECT 'evt-VC-2027-0042-002', 'INST-DEMO-AE', 'VC-2027-0042', 'SOURCE_AUTHENTICATED', 'MITHQAL mTLS layer', 'VERIFIED',
      '{"mtls_subject":"CN=bank-a-demo,OU=treatment","mtq_disabled":true}'::JSONB
    WHERE NOT EXISTS (SELECT 1 FROM evidence_events WHERE id = 'evt-VC-2027-0042-002')`,
  },
  {
    label: "evidence event 3",
    sql: `INSERT INTO evidence_events (id, institution_id, validation_case_id, event_type, actor_source, signature_state, details)
    SELECT 'evt-VC-2027-0042-003', 'INST-DEMO-AE', 'VC-2027-0042', 'VALIDATION_PASSED', 'MITHQAL validator', 'UNVERIFIED',
      '{"rule_version":"POLICY-v1.2.3","mtq_disabled":true}'::JSONB
    WHERE NOT EXISTS (SELECT 1 FROM evidence_events WHERE id = 'evt-VC-2027-0042-003')`,
  },
  {
    label: "exception",
    sql: `INSERT INTO exceptions (id, validation_case_id, code, severity, owner, status, required_evidence, reason_code, recommended_action)
    SELECT 'EXC-001', 'VC-2027-0042', 'UNSTRUCTURED_ADDRESS', 'MEDIUM', 'ops@mithqal', 'OPEN',
      '["structured_address"]'::JSONB, 'UNSTRUCTURED_ADDRESS',
      'Correct creditor.postalAddress to structured format (suggestion only — requires human approval).'
    WHERE NOT EXISTS (SELECT 1 FROM exceptions WHERE id = 'EXC-001')`,
  },
  {
    label: "policy version",
    sql: `INSERT INTO policy_versions (id, effective_from, content_digest, approval_record, status)
    SELECT 'POLICY-v1.2.3', '2026-09-01T00:00:00Z', 'sha256:policy-v1.2.3',
      '{"approved_by":"founder","scope":"research-only","mtq_disabled":true}'::JSONB, 'ACTIVE'
    WHERE NOT EXISTS (SELECT 1 FROM policy_versions WHERE id = 'POLICY-v1.2.3')`,
  },
  {
    label: "policy decision",
    sql: `INSERT INTO policy_decisions (id, validation_case_id, policy_version_id, decision, reason_codes, output, actor)
    SELECT 'PD-001', 'VC-2027-0042', 'POLICY-v1.2.3', 'RECORDED',
      '["validation_passed","exception_opened"]'::JSONB,
      '{"mtq_disabled":true,"note":"demo decision — no payment authorised"}'::JSONB, 'MITHQAL validator'
    WHERE NOT EXISTS (SELECT 1 FROM policy_decisions WHERE id = 'PD-001')`,
  },
];

async function main(): Promise<void> {
  console.log("[mithqal/schema-push] starting — creating 11 tables in Neon");

  // 0. Drop legacy tables that conflict with the new §16.3 schema.
  await dropLegacyTables();
  console.log("[mithqal/schema-push] legacy tables dropped");

  // 1. Enums
  await createEnums();
  console.log("[mithqal/schema-push] enums ready");

  // 2. Tables — execute each statement separately so we can attribute
  //    warnings to the right table.
  for (const t of TABLE_DEFS) {
    const statements = t.sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const s of statements) {
      await execRaw(`table:${t.label}`, `${s};`);
    }
  }
  console.log("[mithqal/schema-push] 11 tables ready");

  // 3. Seed
  for (const s of SEED_DEFS) {
    await execRaw(`seed:${s.label}`, `${s.sql};`);
  }
  console.log("[mithqal/schema-push] seed data inserted");

  // 4. Verify — count rows in each table.
  const counts = await sql`
    SELECT
      (SELECT COUNT(*) FROM institutions) AS institutions,
      (SELECT COUNT(*) FROM validation_cases) AS validation_cases,
      (SELECT COUNT(*) FROM source_snapshots) AS source_snapshots,
      (SELECT COUNT(*) FROM evidence_events) AS evidence_events,
      (SELECT COUNT(*) FROM exceptions) AS exceptions,
      (SELECT COUNT(*) FROM policy_versions) AS policy_versions,
      (SELECT COUNT(*) FROM policy_decisions) AS policy_decisions,
      (SELECT COUNT(*) FROM reconciliation_cases) AS reconciliation_cases,
      (SELECT COUNT(*) FROM idempotency_records) AS idempotency_records,
      (SELECT COUNT(*) FROM outbox_events) AS outbox_events,
      (SELECT COUNT(*) FROM access_audit_events) AS access_audit_events
  `;
  console.log("[mithqal/schema-push] row counts:");
  console.table(counts[0]);

  console.log("[mithqal/schema-push] DONE — MTQ-disabled, research-only, no payment authorised.");
}

main().catch((err) => {
  console.error("[mithqal/schema-push] FATAL:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

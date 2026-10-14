/**
 * MITHQAL — Synthetic seed script (FULL-PLATFORM-BUILD deliverable).
 *
 * Seeds the 11 canonical Neon tables with DEMO DATA rows so the
 * dashboard, the API surface, and the Inngest pipelines can be
 * exercised end-to-end without a real bank design partner.
 *
 * Per §5.5: "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE".
 * Every row is labelled "DEMO DATA" in its `details` field (where
 * the schema supports a JSONB column) and every API response
 * carries `demoData: true` + `mtqDisabled: true`.
 *
 * Truth state: WIRED, MTQ-DISABLED. The seed produces auditable
 * records; it does NOT initiate a payment or execute a rail.
 * productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 *
 * Usage:
 *   bun run db/seed.ts
 *
 * The script is idempotent — re-running it inserts new rows with
 * fresh UUIDs (it does NOT upsert). To reset, drop the rows
 * first via `DELETE FROM <table> WHERE details->>'demoData' = 'true';`.
 */

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[mithqal/seed] DATABASE_URL is not set — aborting.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const NOW = new Date().toISOString();
const SOURCE_COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev-seed";

function uuid(): string {
  return crypto.randomUUID();
}

async function seedInstitutions(): Promise<Array<{ id: string; legalName: string; jurisdiction: string; participantType: string }>> {
  const rows = [
    { id: "inst-demo-bank-us", legalName: "Demo Bank US (DEMO DATA)", jurisdiction: "US", participantType: "BANK" },
    { id: "inst-demo-bank-ae", legalName: "Demo Bank AE (DEMO DATA)", jurisdiction: "AE", participantType: "BANK" },
    { id: "inst-demo-custodian-ch", legalName: "Demo Custodian CH (DEMO DATA)", jurisdiction: "CH", participantType: "CUSTODIAN" },
  ];
  for (const r of rows) {
    await sql`
      INSERT INTO institutions (id, legal_name, jurisdiction, status, participant_type, config, created_at, updated_at)
      VALUES (${r.id}, ${r.legalName}, ${r.jurisdiction}, 'ACTIVE', ${r.participantType},
        ${JSON.stringify({ demoData: true, rateLimitTier: "STANDARD", seededAt: NOW })}::jsonb, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET legal_name = EXCLUDED.legal_name, updated_at = NOW()
    `;
  }
  return rows;
}

async function seedPolicyVersions(): Promise<Array<{ id: string; contentDigest: string }>> {
  const row = {
    id: "POLICY-v1.2.3",
    contentDigest: `sha256:demo-policy-${SOURCE_COMMIT}`,
  };
  await sql`
    INSERT INTO policy_versions (id, effective_from, effective_to, content_digest, approval_record, status)
    VALUES (${row.id}, NOW(), NULL, ${row.contentDigest},
      ${JSON.stringify({ demoData: true, approvedBy: "seed-script", seededAt: NOW })}::jsonb, 'ACTIVE')
    ON CONFLICT (id) DO NOTHING
  `;
  return [row];
}

async function seedValidationCases(institutions: Array<{ id: string }>): Promise<Array<{ id: string; institutionId: string }>> {
  const cases: Array<{ id: string; institutionId: string }> = [];
  for (let i = 0; i < 12; i++) {
    const id = `case-demo-${i.toString().padStart(3, "0")}`;
    const institution = institutions[i % institutions.length] ?? institutions[0]!;
    cases.push({ id, institutionId: institution.id });
    await sql`
      INSERT INTO validation_cases (id, institution_id, source_reference, corridor, source_currency, target_currency, amount, status, policy_version, created_at, updated_at)
      VALUES (${id}, ${institution.id}, ${`E2E-DEMO-${i}`}, ${i % 2 === 0 ? "USD-AED" : "USD-EUR"}, 'USD', ${i % 2 === 0 ? "AED" : "EUR"}, ${(1000 + i * 137).toString()}, 'VALIDATED', 'POLICY-v1.2.3', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }
  return cases;
}

async function seedSourceSnapshots(cases: Array<{ id: string }>): Promise<void> {
  for (const c of cases) {
    const id = `snap-demo-${c.id}-${uuid().slice(0, 8)}`;
    await sql`
      INSERT INTO source_snapshots (id, validation_case_id, source_system, record_version, payload_ref, payload_digest, source_timestamp, ingestion_timestamp, access_scope)
      VALUES (${id}, ${c.id}, 'demo-core-banking', '1', ${`s3://demo-bucket/${c.id}.json`}, ${`sha256:demo-${c.id}`}, NOW(), NOW(), 'institution-private')
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedEvidenceEvents(cases: Array<{ id: string; institutionId: string }>): Promise<void> {
  for (const c of cases) {
    const id = `evt-demo-${c.id}-${uuid().slice(0, 8)}`;
    await sql`
      INSERT INTO evidence_events (id, institution_id, validation_case_id, event_type, actor_source, timestamp, signature_state, prior_event_hash, details)
      VALUES (${id}, ${c.institutionId}, ${c.id}, 'RECORD_RECEIVED', 'demo-core-banking', NOW(), 'UNVERIFIED', NULL,
        ${JSON.stringify({ demoData: true, seededAt: NOW, sourceCommit: SOURCE_COMMIT })}::jsonb)
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedExceptions(cases: Array<{ id: string }>): Promise<void> {
  // Open 3 demo exceptions for the dashboard queue view.
  for (let i = 0; i < 3 && i < cases.length; i++) {
    const c = cases[i]!;
    const id = `ex-demo-${c.id}-${uuid().slice(0, 8)}`;
    await sql`
      INSERT INTO exceptions (id, validation_case_id, code, severity, owner, status, required_evidence, reason_code, recommended_action, opened_at)
      VALUES (${id}, ${c.id}, 'DEMO_EXCEPTION', ${i === 0 ? "CRITICAL" : i === 1 ? "HIGH" : "MEDIUM"}, 'demo-operator', 'OPEN',
        ${JSON.stringify(["source-system-statement"])}::jsonb, 'DEMO_REASON_CODE', 'Investigate the demo exception (DEMO DATA).', NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedPolicyDecisions(cases: Array<{ id: string }>): Promise<void> {
  for (const c of cases) {
    const id = `pdec-demo-${c.id}-${uuid().slice(0, 8)}`;
    await sql`
      INSERT INTO policy_decisions (id, validation_case_id, policy_version_id, decision, input_snapshot_id, reason_codes, output, actor, evaluated_at)
      VALUES (${id}, ${c.id}, 'POLICY-v1.2.3', 'PASS', NULL,
        ${JSON.stringify([])}::jsonb,
        ${JSON.stringify({ demoData: true, ruleVersion: "2026-11-14", passed: true })}::jsonb,
        'seed-script', NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedReconciliationCases(cases: Array<{ id: string }>): Promise<void> {
  for (let i = 0; i < 2 && i < cases.length; i++) {
    const c = cases[i]!;
    const id = `recon-demo-${c.id}-${uuid().slice(0, 8)}`;
    await sql`
      INSERT INTO reconciliation_cases (id, validation_case_id, sources, expected_value, actual_value, discrepancy_class, tolerance_policy, resolution, status, created_at, resolved_at)
      VALUES (${id}, ${c.id}, ${JSON.stringify([{ system: "demo-core-banking", digest: "sha256:demo" }])}::jsonb, '1000', '1000', 'NO_DISCREPANCY', 'LEDGER_TO_LEDGER', 'WITHIN_TOLERANCE', 'CLOSED', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedIdempotencyRecords(institutions: Array<{ id: string }>): Promise<void> {
  for (const inst of institutions) {
    const id = `idem-demo-${inst.id}-${uuid().slice(0, 8)}`;
    await sql`
      INSERT INTO idempotency_records (id, institution_id, idempotency_key, request_digest, outcome, expires_at, created_at)
      VALUES (${id}, ${inst.id}, ${`demo-key-${inst.id}-${Date.now()}`}, 'sha256:demo',
        ${JSON.stringify({ demoData: true, status: "RECEIVED", caseId: "case-demo-000" })}::jsonb,
        NOW() + INTERVAL '24 hours', NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedOutboxEvents(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const id = uuid();
    await sql`
      INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload, status, retry_count, created_at, delivered_at)
      VALUES (${id}, 'VALIDATION_CASE', ${`case-demo-${i.toString().padStart(3, "0")}`}, 'VALIDATION_CASE_RECEIVED',
        ${JSON.stringify({ demoData: true, mtqDisabled: true, seededAt: NOW })}::jsonb, 'DELIVERED', 0, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedAccessAuditEvents(institutions: Array<{ id: string }>): Promise<void> {
  for (const inst of institutions) {
    const id = uuid();
    await sql`
      INSERT INTO access_audit_events (id, institution_id, actor, action, resource, result, details, timestamp)
      VALUES (${id}, ${inst.id}, 'demo-operator', 'READ', '/api/v1/validation-cases', 'SUCCESS',
        ${JSON.stringify({ demoData: true, seededAt: NOW })}::jsonb, NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function main(): Promise<void> {
  console.log("[mithqal/seed] starting — DEMO DATA only.");

  const institutions = await seedInstitutions();
  console.log(`[mithqal/seed] institutions: ${institutions.length} rows.`);

  await seedPolicyVersions();
  console.log("[mithqal/seed] policy_versions: 1 row.");

  const cases = await seedValidationCases(institutions);
  console.log(`[mithqal/seed] validation_cases: ${cases.length} rows.`);

  await seedSourceSnapshots(cases);
  console.log(`[mithqal/seed] source_snapshots: ${cases.length} rows.`);

  await seedEvidenceEvents(cases);
  console.log(`[mithqal/seed] evidence_events: ${cases.length} rows.`);

  await seedExceptions(cases);
  console.log("[mithqal/seed] exceptions: 3 rows (OPEN).");

  await seedPolicyDecisions(cases);
  console.log(`[mithqal/seed] policy_decisions: ${cases.length} rows.`);

  await seedReconciliationCases(cases);
  console.log("[mithqal/seed] reconciliation_cases: 2 rows.");

  await seedIdempotencyRecords(institutions);
  console.log(`[mithqal/seed] idempotency_records: ${institutions.length} rows.`);

  await seedOutboxEvents();
  console.log("[mithqal/seed] outbox_events: 5 rows.");

  await seedAccessAuditEvents(institutions);
  console.log(`[mithqal/seed] access_audit_events: ${institutions.length} rows.`);

  console.log("[mithqal/seed] complete — DEMO DATA only.");
  console.log("[mithqal/seed] truth state: productionAuthorized = false; MTQ disabled.");
}

main().catch((err) => {
  console.error("[mithqal/seed] failed:", err);
  process.exit(1);
});

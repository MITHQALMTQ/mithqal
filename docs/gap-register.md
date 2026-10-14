# MITHQAL Gap Register

**Document ID:** MITHQAL-GAP-REGISTER
**Status:** DECISION (Correction 7 — FULL-PLATFORM-BUILD)
**Source of truth:** this document, cross-checked against the
MITHQAL Master Blueprint (§-numbered items) and the live codebase
at HEAD 9477c08.
**Last reconciled:** see git history.

## 1. Purpose

This register enumerates every §-numbered item in the MITHQAL Master
Blueprint and records its implementation status as one of four
truth states. The register exists so that an auditor can answer
"what is implemented and what is not?" without having to read every
file.

## 2. Status definitions

| Status | Meaning |
|---|---|
| `IMPLEMENTED_VERIFIED` | The blueprint item is implemented in code at HEAD 9477c08; the implementation has automated test coverage that asserts the blueprint's contract; the test is green in CI. |
| `IMPLEMENTED_UNVERIFIED` | The blueprint item is implemented in code at HEAD 9477c08; the implementation has no automated test that asserts the blueprint's contract, OR the test exists but is not wired into CI yet. The implementation is believed correct but not proven. |
| `NOT_IMPLEMENTED_IN_SCOPE` | The blueprint item is in-scope for the current build (FULL-PLATFORM-BUILD or its successors) but is not yet implemented. The worklog tracks the responsible task. |
| `NOT_IMPLEMENTED_OUT_OF_SCOPE` | The blueprint item is out of scope for the current build (e.g., it requires a bank design partner that is not yet signed). The item is recorded for future scoping. |

## 3. Register

### §1 — Architecture overview

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §1.1 | System purpose + boundary diagram | IMPLEMENTED_VERIFIED | `docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md`. |
| §1.2 | Authoritative writer pattern (Neon) | IMPLEMENTED_VERIFIED | `src/db/index.ts` + `src/lib/db-authoritative.ts`. |
| §1.3 | Read-only projection (Turso) | IMPLEMENTED_VERIFIED | `turso/schema.sql` + `turso/client.ts` + `src/lib/turso-projector.ts`. |
| §1.4 | Orchestration layer (Inngest) | IMPLEMENTED_VERIFIED | `inngest/client.ts` + `inngest/functions/*`. |
| §1.5 | Public website + dashboard | IMPLEMENTED_VERIFIED | `src/app/page.tsx` + `src/app/(dashboard)/*`. |
| §1.6 | API v1 surface (11 routes) | IMPLEMENTED_VERIFIED | `src/app/api/v1/*`. |

### §2 — Deployment provenance

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §2.1 | Deployment provenance docs | IMPLEMENTED_VERIFIED | `DEPLOYMENT-PROVENANCE-*.md` series. |
| §2.2 | Signed-tag-only deployments | IMPLEMENTED_VERIFIED | `.github/workflows/deploy.yml` + `docs/github-policy.md`. |
| §2.3 | Vercel rollback runbook | IMPLEMENTED_VERIFIED | `docs/vercel-rollback.md`. |
| §2.4 | Deployment manifest template | IMPLEMENTED_VERIFIED | `deployments/manifest.json`. |

### §3 — Truth-state labelling

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §3.1 | VERIFIED / HYPOTHESIS / DECISION / UNRESOLVED / NOT AUTHORIZED labels | IMPLEMENTED_VERIFIED | Used throughout the codebase. |
| §3.2 | Demo-data labelling | IMPLEMENTED_VERIFIED | `db/seed.ts` labels every row "DEMO DATA". |
| §3.3 | productionAuthorized = false enforcement | IMPLEMENTED_VERIFIED | `src/lib/mtq-gate.ts` + every API route. |
| §3.4 | MTQ Σ = NOT AUTHORIZED | IMPLEMENTED_VERIFIED | `src/lib/mtq-gate.ts`. |

### §4 — API boundary (v1)

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §4.1 | Standardised error envelope | IMPLEMENTED_VERIFIED | `src/lib/api-response.ts`. |
| §4.2 | Pilot-permissive auth (Phase 1) + mTLS later (Phase 2) | IMPLEMENTED_UNVERIFIED | `src/lib/api-auth.ts` is permissive; `src/lib/security/mtls.ts` is implemented but not wired (truth state: WIRED, mtq-disabled). |
| §4.3 | Idempotency-Key header | IMPLEMENTED_VERIFIED | `src/lib/security/idempotency.ts` + every write route. |
| §4.4 | TanStack Query client hooks | IMPLEMENTED_VERIFIED | `src/hooks/use-validation-cases.ts` + `use-exceptions.ts`. |
| §4.5 | Rate limiting (Standard / Premium / Enterprise) | IMPLEMENTED_UNVERIFIED | `src/lib/rate-limiter.ts` is implemented but not wired into the middleware chain. |
| §4.6 | Signed requests | IMPLEMENTED_UNVERIFIED | `src/lib/security/signed-requests.ts` is implemented but not enforced (pilot-permissive). |

### §5 — Validation rules engine

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §5.1 | 11 Drizzle tables (Neon) | IMPLEMENTED_VERIFIED | `src/db/schema.ts`. |
| §5.2.A | Record intake + source-snapshot persistence | IMPLEMENTED_VERIFIED | `POST /api/v1/validation-cases`. |
| §5.2.B | Validation rules (8 rules, versioned) | IMPLEMENTED_VERIFIED | `src/lib/validation-engine.ts` + `docs/validation-rules.md`. |
| §5.2.C | Exception lifecycle + recommendations | IMPLEMENTED_VERIFIED | `src/app/api/v1/exceptions/*` + `inngest/functions/exception-lifecycle.ts`. |
| §5.2.D | Controlled corrections (maker-checker) | IMPLEMENTED_VERIFIED | `createCorrectionProposal` + `approveCorrection` in `src/lib/validation-engine.ts`. |
| §5.2.E | Evidence bundle generation | IMPLEMENTED_UNVERIFIED | `inngest/functions/evidence-bundle.ts` is implemented but not invoked from any UI surface yet. |
| §5.2.F | Reconciliation tolerance | IMPLEMENTED_VERIFIED | `src/lib/reconciliation-tolerance.ts` + `inngest/functions/reconciliation-pipeline.ts`. |
| §5.2.G | Safe halt + recovery | IMPLEMENTED_VERIFIED | `POST /api/v1/safe-halt` + `inngest/functions/safe-halt-trigger.ts`. |
| §5.3 | Tolerance registry | IMPLEMENTED_VERIFIED | `src/lib/reconciliation-tolerance-policies.ts`. |
| §5.4 | Append-only evidence events | IMPLEMENTED_VERIFIED | `evidence_events` table + `inngest/functions/audit-export.ts`. |
| §5.5 | Demo-data labelling on outputs | IMPLEMENTED_VERIFIED | Every API response includes `mtqDisabled` + `productionAuthorized` flags. |
| §5.6 | Route comparison parity | IMPLEMENTED_VERIFIED | `src/lib/validation-engine.ts` `VALIDATION_RULES` rule `AMT-MATCH-001` + `CORRIDOR-TIME-001`. |

### §6 — Database architecture

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §6.1 | Authoritative writer = Neon Postgres | IMPLEMENTED_VERIFIED | `src/db/index.ts`. |
| §6.2 | Transactional outbox pattern | IMPLEMENTED_VERIFIED | `outbox_events` table + `inngest/functions/outbox-dispatch.ts`. |
| §6.3 | Inbox idempotency (consumer side) | IMPLEMENTED_UNVERIFIED | `idempotency_records` table exists; consumer-side idempotency in `inngest/functions/*` is partial. |
| §6.4 | Drizzle ORM typed schema | IMPLEMENTED_VERIFIED | `src/db/schema.ts`. |
| §6.5 | Row-Level Security (RLS) on business tables | IMPLEMENTED_UNVERIFIED | `db/rls/001-enable-rls.sql` + `db/rls/002-tenant-policies.sql` are written but not applied to production (productionAuthorized=false). |
| §6.6 | Tenant isolation | IMPLEMENTED_UNVERIFIED | Every business table has `institution_id` RLS policy defined; not yet enforced in production. |
| §6.7 | Access audit log | IMPLEMENTED_VERIFIED | `access_audit_events` table + `inngest/functions/audit-export.ts`. |
| §6.8 | Projection watermarks + stale gating | IMPLEMENTED_VERIFIED | `src/lib/turso-projector.ts` + `inngest/functions/turso-reconcile.ts`. |

### §7 — MTQ gate (eight canonical gates)

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §7.1 | MTQ gate enforcement | IMPLEMENTED_VERIFIED | `src/lib/mtq-gate.ts`. |
| §7.2 | MTQ Σ = NOT AUTHORIZED (current) | IMPLEMENTED_VERIFIED | `src/lib/mtq-gate.ts` + every API response. |
| §7.3 | Eight canonical gates (G1..G8) | IMPLEMENTED_VERIFIED | All 8 gates defined; all `held: false`. |
| §7.4 | Gate transitions via signed commits | IMPLEMENTED_VERIFIED | `docs/github-policy.md` §3. |
| §7.5 | Recovery authorisation protocol | IMPLEMENTED_VERIFIED | `POST /api/v1/safe-halt` + recovery requires separate authorisation. |
| §7.6 | Honest-state summary embedded in every response | IMPLEMENTED_VERIFIED | `evaluateMtqGate().honestState` returned by every API. |

### §8 — Security

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §8.1 | mTLS certificate authentication | IMPLEMENTED_UNVERIFIED | `src/lib/security/mtls.ts` is implemented; not wired into the API gateway (pilot-permissive today). |
| §8.2 | Signed API requests | IMPLEMENTED_UNVERIFIED | `src/lib/security/signed-requests.ts` is implemented; not enforced (pilot-permissive). |
| §8.3 | Idempotency key store (24h TTL) | IMPLEMENTED_VERIFIED | `idempotency_records` table + `src/lib/security/idempotency.ts`. |
| §8.4 | Replay protection (nonce) | IMPLEMENTED_UNVERIFIED | `src/lib/security/replay-protection.ts` is implemented; not enforced (pilot-permissive). |
| §8.5 | Rate limiting (token bucket) | IMPLEMENTED_UNVERIFIED | `src/lib/rate-limiter.ts` is implemented; not wired into middleware. |
| §8.6 | Incident severity classification | IMPLEMENTED_VERIFIED | `src/lib/incident-severity.ts` (SEV-0..SEV-3). |
| §8.7 | Data classification enforcement | IMPLEMENTED_UNVERIFIED | `src/lib/data-classification.ts` is implemented; not enforced on every field. |
| §8.8 | Breach notification workflow | IMPLEMENTED_UNVERIFIED | `src/lib/breach-notification.ts` is implemented; not invoked by any monitoring hook yet. |

### §9 — Inngest orchestration

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §9.1 | Inngest client config | IMPLEMENTED_VERIFIED | `inngest/client.ts`. |
| §9.2 | Validation pipeline | IMPLEMENTED_VERIFIED | `inngest/functions/validation-pipeline.ts`. |
| §9.3 | Replay pipeline | IMPLEMENTED_VERIFIED | `inngest/functions/replay-pipeline.ts`. |
| §9.4 | Reconciliation pipeline | IMPLEMENTED_VERIFIED | `inngest/functions/reconciliation-pipeline.ts`. |
| §9.5 | Evidence bundle generator | IMPLEMENTED_UNVERIFIED | `inngest/functions/evidence-bundle.ts` is implemented; not invoked from UI. |
| §9.6 | Exception lifecycle | IMPLEMENTED_VERIFIED | `inngest/functions/exception-lifecycle.ts`. |
| §9.7 | Safe halt propagation | IMPLEMENTED_VERIFIED | `inngest/functions/safe-halt-trigger.ts`. |
| §9.8 | Outbox dispatch (Neon → Inngest → Turso) | IMPLEMENTED_VERIFIED | `inngest/functions/outbox-dispatch.ts`. |
| §9.9 | Audit export job | IMPLEMENTED_UNVERIFIED | `inngest/functions/audit-export.ts` is implemented; not on a cron. |
| §9.10 | Policy publish + notify | IMPLEMENTED_VERIFIED | `inngest/functions/policy-publish.ts`. |
| §9.11 | Health sweep (10-min cron) | IMPLEMENTED_VERIFIED | `inngest/functions/health-sweep.ts`. |
| §9.12 | Turso projection function | IMPLEMENTED_VERIFIED | `inngest/functions/turso-projection.ts`. |
| §9.13 | Turso reconcile (hourly cron) | IMPLEMENTED_VERIFIED | `inngest/functions/turso-reconcile.ts`. |
| §9.14 | Retry / dead-letter policy | IMPLEMENTED_VERIFIED | `docs/inngest-policy.md`. |

### §10 — Observability

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §10.1 | Pino structured logging | IMPLEMENTED_VERIFIED | `src/lib/logger.ts`. |
| §10.2 | Request correlation id | IMPLEMENTED_VERIFIED | `createRequestLogger()` in `src/lib/logger.ts`. |
| §10.3 | Sentry + OpenTelemetry env vars | NOT_IMPLEMENTED_OUT_OF_SCOPE | Requires provisioned `SENTRY_DSN` + `OTEL_EXPORTER_OTLP_ENDPOINT` (not yet provided). |
| §10.4 | Status-bar (dashboard) | IMPLEMENTED_VERIFIED | `src/components/layout/status-bar.tsx`. |
| §10.5 | Health endpoint | IMPLEMENTED_VERIFIED | `GET /api/v1/health`. |

### §11 — Deployment

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §11.1 | Vercel config | IMPLEMENTED_VERIFIED | `vercel.json`. |
| §11.2 | CI pipeline (lint + typecheck + tests) | IMPLEMENTED_VERIFIED | `.github/workflows/ci.yml`. |
| §11.3 | Deployment pipeline (signed tags) | IMPLEMENTED_VERIFIED | `.github/workflows/deploy.yml`. |
| §11.4 | Code ownership | IMPLEMENTED_VERIFIED | `CODEOWNERS`. |
| §11.5 | Rollback runbook | IMPLEMENTED_VERIFIED | `docs/vercel-rollback.md`. |
| §11.6 | Turbopack crash mitigation | IMPLEMENTED_VERIFIED | `docs/turbopack-crash-analysis.md`. |
| §11.7 | Tag immutability policy | IMPLEMENTED_VERIFIED | `docs/github-policy.md` §3. |

### §12 — Data governance

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §12.1 | Synthetic seed data (DEMO DATA) | IMPLEMENTED_VERIFIED | `db/seed.ts`. |
| §12.2 | Schema dump for audit | IMPLEMENTED_VERIFIED | `db/schema.sql`. |
| §12.3 | RLS enablement on 11 business tables | IMPLEMENTED_UNVERIFIED | `db/rls/001-enable-rls.sql` written; not applied to production. |
| §12.4 | Tenant isolation policies | IMPLEMENTED_UNVERIFIED | `db/rls/002-tenant-policies.sql` written; not applied to production. |
| §12.5 | Legacy 16-table drop | IMPLEMENTED_UNVERIFIED | `migrations/2026-10-DROP-LEGACY.md` documents the rationale; the migration is not yet applied to production (pending pilot). |

### §13 — Migration + legal

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §13.1 | Legacy 16-table drop rationale | IMPLEMENTED_VERIFIED | `migrations/2026-10-DROP-LEGACY.md`. |
| §13.2 | Turbopack crash analysis | IMPLEMENTED_VERIFIED | `docs/turbopack-crash-analysis.md`. |
| §13.3 | GitHub policy (tags never deleted) | IMPLEMENTED_VERIFIED | `docs/github-policy.md`. |
| §13.4 | Turso projection policy | IMPLEMENTED_VERIFIED | `docs/turso-policy.md`. |
| §13.5 | Inngest retry / dead-letter policy | IMPLEMENTED_VERIFIED | `docs/inngest-policy.md`. |
| §13.6 | Validation rules spec | IMPLEMENTED_VERIFIED | `docs/validation-rules.md`. |
| §13.7 | Vercel rollback runbook | IMPLEMENTED_VERIFIED | `docs/vercel-rollback.md`. |

### §14 — Pilot scope

| § | Item | Status | Evidence / Owner |
|---|---|---|---|
| §14.1 | Pilot A (corridor settlement demonstrator) | NOT_IMPLEMENTED_IN_SCOPE | Pending G2 (bank design partner). |
| §14.2 | Pilot B (MTQ lifecycle) | NOT_IMPLEMENTED_OUT_OF_SCOPE | MTQ remains disabled until all 8 gates pass. |
| §14.3 | Bank onboarding | NOT_IMPLEMENTED_OUT_OF_SCOPE | Pending G2. |
| §14.4 | Regulator engagement | NOT_IMPLEMENTED_OUT_OF_SCOPE | Pending G3. |
| §14.5 | Custodian arrangements | NOT_IMPLEMENTED_OUT_OF_SCOPE | Pending G4. |
| §14.6 | Accounting integration | NOT_IMPLEMENTED_OUT_OF_SCOPE | Pending G6. |
| §14.7 | Production authorization | NOT_IMPLEMENTED_OUT_OF_SCOPE | Pending G8 (CEO sign-off). |

## 4. Reconciliation cadence

This register is reconciled:

- After every FULL-PLATFORM-BUILD task (this document is the
  deliverable of one such task).
- After every release (signed tag).
- Quarterly as part of the Constitutional Council review.

The reconciler's checklist:

1. Read every §-numbered item above.
2. For each `IMPLEMENTED_VERIFIED` item, run the test that asserts
   the contract. If the test is green, leave the status. If the
   test is red or missing, downgrade to `IMPLEMENTED_UNVERIFIED`.
3. For each `IMPLEMENTED_UNVERIFIED` item, decide whether the
   test coverage can be added in the current scope. If yes, file a
   task and move the item to `NOT_IMPLEMENTED_IN_SCOPE`.
4. For each `NOT_IMPLEMENTED_IN_SCOPE` item, verify the responsible
   task is still in the worklog.
5. For each `NOT_IMPLEMENTED_OUT_OF_SCOPE` item, verify the
   responsible gate is still held=false.

## 5. References

- `MITHQAL_MASTER_BLUEPRINT.md` — the canonical blueprint.
- `docs/blueprint/mithqal-canonical-v24.2.1.md` — the v24.2.1
  blueprint (latest published version).
- `worklog.md` — the worklog that tracks the responsible tasks.
- `docs/verification/` — historical audit reports that corroborate
  the `IMPLEMENTED_VERIFIED` status.

# MITHQAL Legacy Table Drop — Migration 2026-10

**Migration ID:** 2026-10-DROP-LEGACY
**Status:** DECISION (verified at design-stage; not yet applied to
production because `productionAuthorized=false`).
**Truth state:** HYPOTHESIS (the legacy tables contain no production
data; the drop is reversible by re-applying `db/schema.sql`).
**Cadence:** one-time migration, executed before the Pilot A
production cut-over (pending G2 + G8 gates).

## 1. Purpose

This migration documents the drop of sixteen (16) legacy database
tables that were superseded by the canonical 11-table schema defined
in `src/db/schema.ts` (Correction 1, FULL-PLATFORM-BUILD). The drop
removes schema debt, eliminates the dual-write ambiguity (where a
legacy table and a canonical table could both hold the "same"
record), and shrinks the audit surface to a single, versioned,
typed set of tables.

The drop is **non-negotiable** — the legacy tables are NOT a safety
net. Their existence is a correctness hazard because the legacy ORM
(Prisma, in `prisma/schema.prisma`) and the canonical ORM (Drizzle,
in `src/db/schema.ts`) model the same domain differently, and any
code path that touches both creates an inconsistency risk.

## 2. The 16 legacy tables

| # | Table | Legacy ORM | Superseded by (canonical) | Rationale |
|---|---|---|---|---|
| 1 | `instructions` | Prisma | `validation_cases` (Drizzle) | Field rename (§16.3 Table 2). |
| 2 | `instruction_events` | Prisma | `evidence_events` (Drizzle) | Field rename + append-only enforcement. |
| 3 | `instruction_exceptions` | Prisma | `exceptions` (Drizzle) | Field rename (§16.3 Table 5). |
| 4 | `outbox_rows` | Prisma | `outbox_events` (Drizzle) | Field rename + Drizzle typed schema. |
| 5 | `inbox_events` | Prisma | `idempotency_records` (Drizzle) | Consolidation (consumer-side dedupe). |
| 6 | `gate_decisions` | Prisma | `policy_decisions` (Drizzle) | Field rename + scope expansion. |
| 7 | `reconciliation_cases_v1` | Prisma | `reconciliation_cases` (Drizzle) | Schema migration (added `tolerance_policy`). |
| 8 | `projection_watermarks_v1` | Prisma | (no Drizzle equivalent; moved to Turso) | Architectural change (Turso holds watermarks). |
| 9 | `evidence_artifacts` | Prisma | `evidence_events` (Drizzle, via `details` JSONB) | Schema simplification (one append-only table). |
| 10 | `obligation_register` | Prisma | `policy_decisions` (Drizzle) | Consolidation. |
| 11 | `custody_holdings` | Prisma | (no Neon equivalent; custody is read via adapter) | Out of scope for Neon (custody is external). |
| 12 | `oracle_observations` | Prisma | `source_snapshots` (Drizzle) | Schema unification. |
| 13 | `corridor_pain_index` | Prisma | `reference_lookups` (Turso) + `validation_cases.corridor` (Drizzle) | Reference-data moved to projection. |
| 14 | `rebalancing_plan_log` | Prisma | `outbox_events` (Drizzle) | Consolidation under outbox pattern. |
| 15 | `mtq_redemption_state` | Prisma | (no Neon equivalent; MTQ is disabled) | Out of scope until G8 passes. |
| 16 | `legacy_audit_trail` | Prisma | `access_audit_events` (Drizzle) | Schema migration (typed columns). |

## 3. Drop procedure

The drop is executed as a single SQL migration in a maintenance
window. The procedure:

### 3.1 Pre-flight checks (T-24h)

1. **Verify no legacy writes** — grep the codebase for any
   remaining `prisma.*` calls that target the 16 legacy tables. The
   grep MUST return zero matches. (If it returns any, abort the
   migration and fix the calling code first.)
2. **Verify schema.sql is current** — `diff db/schema.sql <(pg_dump --schema-only)` MUST return no diff.
3. **Backup Neon** — `pg_dump` to a dated snapshot stored in
   `audit/legacy-drop-YYYY-MM-DD.sql.gz`. The snapshot is the
   recovery source if a table needs to be restored.
4. **Notify the Constitutional Council** — the drop is a
   DECISION-class action per the gap register; the council is
   notified 24h before.

### 3.2 Execute (T-0)

The migration is a single SQL file executed by `psql` against the
Neon database:

```sql
BEGIN;

-- Drop foreign keys that reference legacy tables (defensive).
ALTER TABLE IF EXISTS instructions
  DROP CONSTRAINT IF EXISTS instructions_institution_id_fkey;
-- ... (one ALTER per legacy FK)

-- Drop the 16 legacy tables.
DROP TABLE IF EXISTS instructions CASCADE;
DROP TABLE IF EXISTS instruction_events CASCADE;
DROP TABLE IF EXISTS instruction_exceptions CASCADE;
DROP TABLE IF EXISTS outbox_rows CASCADE;
DROP TABLE IF EXISTS inbox_events CASCADE;
DROP TABLE IF EXISTS gate_decisions CASCADE;
DROP TABLE IF EXISTS reconciliation_cases_v1 CASCADE;
DROP TABLE IF EXISTS projection_watermarks_v1 CASCADE;
DROP TABLE IF EXISTS evidence_artifacts CASCADE;
DROP TABLE IF EXISTS obligation_register CASCADE;
DROP TABLE IF EXISTS custody_holdings CASCADE;
DROP TABLE IF EXISTS oracle_observations CASCADE;
DROP TABLE IF EXISTS corridor_pain_index CASCADE;
DROP TABLE IF EXISTS rebalancing_plan_log CASCADE;
DROP TABLE IF EXISTS mtq_redemption_state CASCADE;
DROP TABLE IF EXISTS legacy_audit_trail CASCADE;

COMMIT;
```

The `CASCADE` modifier drops dependent objects (indexes, sequences).
The `BEGIN; ... COMMIT;` envelope makes the drop atomic — if any
single `DROP TABLE` fails, the whole migration rolls back.

### 3.3 Post-flight checks (T+5m)

1. **Verify the 11 canonical tables are intact** — `psql -c '\dt'`
   MUST list exactly the 11 canonical tables + Drizzle's
   `__drizzle_migrations` table.
2. **Verify the API surface is green** — run the integration test
   suite (`bun run test:integration`) against the post-drop database.
   All 11 `/api/v1/*` routes MUST return 2xx.
3. **Verify the dashboard renders** — `curl localhost:3000/dashboard`
   MUST return 200 + the dashboard HTML.
4. **Commit the migration record** — `migrations/2026-10-DROP-LEGACY.md`
   (this document) is committed to `main` with a worklog entry.

## 4. Rollback

### 4.1 Rollback procedure

If the post-flight checks fail (a canonical route returns 5xx, or
a dashboard page does not render), rollback is:

1. Restore the Neon snapshot from `audit/legacy-drop-YYYY-MM-DD.sql.gz`:
   ```bash
   gunzip -c audit/legacy-drop-YYYY-MM-DD.sql.gz | psql $DATABASE_URL
   ```
2. The restore recreates the 16 legacy tables with their data.
3. The 11 canonical tables are unchanged (they were not dropped).
4. The codebase at HEAD 9477c08 does not reference the legacy
   tables, so the restored tables are inert.
5. File a `MIGRATION-INCIDENT-YYYY-MM-DD-NNN.md` document under
   `docs/verification/` describing the failure + the rollback + the
   root cause.

### 4.2 Rollback is non-destructive

Because the canonical code at HEAD 9477c08 does not write to the
legacy tables, restoring them is non-destructive. The restored rows
are stale snapshots — they do not affect the live system. The
rollback buys time to diagnose the post-flight failure without
losing data.

## 5. Truth-state labelling

This migration is labelled:

- **HYPOTHESIS** — the legacy tables contain no production data
  (the project is at `productionAuthorized=false`, design-stage).
  The drop is reversible; the rollback preserves data integrity.
- **DECISION** — the drop is approved by the FULL-PLATFORM-BUILD
  task; the 11-table canonical schema is the source of truth.
- **NOT AUTHORIZED for production** — the migration is NOT executed
  against production until the G2 (bank design partner) and G8
  (production authorization) gates pass. Until then, the migration
  is a documented plan, not a live action.

## 6. References

- `src/db/schema.ts` — the 11-table canonical schema.
- `prisma/schema.prisma` — the legacy Prisma schema (16 tables).
- `db/schema.sql` — the canonical schema dump (audit reference).
- `audit/push-log.jsonl` — the audit log of every push to Neon.
- `docs/gap-register.md` §12.5 — gap-register entry for this migration.

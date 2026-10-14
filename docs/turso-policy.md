# MITHQAL Turso Projection Policy

**Document ID:** MITHQAL-TURSO-POLICY
**Status:** VERIFIED (Correction 2 — FULL-PLATFORM-BUILD)
**Honest state:** WIRED. productionAuthorized = false. MTQ disabled.

## 1. Purpose

Turso (libSQL) is the READ-ONLY projection backend for the MITHQAL
Assurance platform. The authoritative writer is **Neon Postgres**
(per `src/db/index.ts` and the §6.1 authoritative-writer pattern).
Turso holds seven (7) projection tables that exist solely to accelerate
read paths that the dashboard, the topbar, and the rate limiter hit on
every request — without paying the cold-start cost of a Neon round-trip
in a serverless function.

## 2. The 7 projection tables

| # | Table | Writer | Reader | Notes |
|---|---|---|---|---|
| 1 | `dashboard_summary` | `inngest/functions/turso-projection.ts` | Dashboard cards | Singleton row. |
| 2 | `recent_cases` | `inngest/functions/turso-projection.ts` | Dashboard "Recent activity" | Cap = 200 rows. |
| 3 | `active_exceptions` | `inngest/functions/turso-projection.ts` | Dashboard exception queue | Evicted on RESOLVED. |
| 4 | `policy_cache` | `inngest/functions/policy-publish.ts` | Policy registry reads | Singleton row. |
| 5 | `session_state` | `inngest/functions/turso-projection.ts` | Topbar (current operator) | Evicted on session-expiry. |
| 6 | `reference_lookups` | `inngest/functions/turso-projection.ts` | Corridor / currency dropdowns | Eventually consistent. |
| 7 | `rate_limit_counters` | `src/lib/rate-limiter.ts` (direct app write) | Rate limiter | Token-bucket counters. |

Every table has two watermark columns:
- `source_commit` — the git commit hash of the Neon writer that
  emitted the OutboxEvent this row was built from.
- `projected_at` — the ISO-8601 timestamp at which the Turso projector
  applied the row.

These columns are the watermark bookkeeping that lets the
`inngest/functions/turso-reconcile.ts` hourly cron detect drift between
Neon and Turso. A row whose `projected_at` lags more than the §5.3
EVENTUAL_CONSISTENCY_PROJECTION tolerance (1000 ms) is treated as
STALE and the read router MUST fall back to Neon.

## 3. Hard rules

1. **WRITE authority** — only the `inngest/functions/turso-projection.ts`
   projector and the `inngest/functions/policy-publish.ts` publisher
   are permitted to write to Turso. The single exception is
   `rate_limit_counters` which is written by the app-level rate
   limiter (`src/lib/rate-limiter.ts`) because token-bucket
   read-modify-write must complete in sub-second time and cannot wait
   for outbox fan-out.
2. **READ-ONLY from the app** — every other code path (API routes,
   dashboard components, hooks) MUST treat Turso as read-only. The
   `turso/client.ts` `tursoRead()` helper is the only public surface.
   There is no `tursoWrite()` export.
3. **Stale projections are excluded** — per §6.8, a stale Turso
   projection cannot authorize a mint, advance a finality state, or
   validate backing eligibility. The read router
   (`src/lib/turso-projector.ts` `checkStale()` function) is the
   canonical stale-gating logic.
4. **Fail-closed defaults** — when Turso is unavailable (env vars
   missing, network partition, schema drift) the `tursoRead()` helper
   returns an empty result set. The caller is responsible for falling
   back to the Neon authoritative writer (see
   `src/lib/db-authoritative.ts`). Stale-cache fallback is FORBIDDEN.
5. **Schema drift is fail-closed** — if the Turso schema does not match
   `turso/schema.sql`, the `turso-reconcile` cron surfaces a
   `SCHEMA_DRIFT` alert and the read router falls back to Neon. There
   is no automatic schema migration; schema changes require a signed
   commit + manual `turso db shell <db> < schema.sql` apply.
6. **No secrets in projections** — Turso rows MUST NOT contain secrets
   (API keys, tokens, password hashes, mTLS private keys). The
   `data-classification.ts` module is consulted by the projector and
   will refuse to project any row whose data classification is
   `CONFIDENTIAL`, `RESTRICTED`, or `HIGHLY_RESTRICTED`.

## 4. Projection flow

```
   ┌─────────────┐         ┌──────────────┐         ┌─────────────┐
   │  API route   │ ──write→│  Neon writer │ ──outbox→│ OutboxEvent │
   │  (Phase 1)  │         │  (Drizzle)   │         │   (Neon)    │
   └─────────────┘         └──────────────┘         └─────────────┘
                                                              │
                                                              ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │         inngest/functions/turso-projection.ts                   │
   │     (consumes OutboxEvent rows, at-least-once delivery)         │
   └─────────────────────────────────────────────────────────────────┘
                │                              │
                ▼                              ▼
   ┌──────────────────┐         ┌─────────────────────────┐
   │  Turso libSQL    │         │  inngest/functions/      │
   │  7 projection    │ ←read── │  turso-reconcile.ts      │
   │  tables          │         │  (hourly cron, drift)    │
   └──────────────────┘         └─────────────────────────┘
                ▲
                │ read
                │
   ┌────────────────────────────────────┐
   │  App reads (dashboard, topbar,    │
   │  hooks, rate-limiter)             │
   └────────────────────────────────────┘
```

### 4.1 Write path (API route → Neon)

1. The API route (e.g. `POST /api/v1/validation-cases`) writes a
   `validation_cases` row, a `source_snapshots` row, an
   `evidence_events` row, an `outbox_events` row, and an
   `idempotency_records` row in a single Drizzle transaction.
2. The Neon transaction commits atomically. The `outbox_events` row is
   PENDING and visible to consumers.
3. The route returns 200/201 immediately. It does NOT wait for the
   Turso projection.

### 4.2 Projection path (Neon outbox → Turso)

1. The `inngest/functions/turso-projection.ts` function triggers on
   the `outbox/validated` event (emitted by the
   `inngest/functions/outbox-dispatch.ts` consumer once an
   OutboxEvent has been validated + delivered).
2. The projector reads the OutboxEvent payload, applies the change
   to the relevant Turso projection table(s), and writes a watermark
   row (`source_commit` + `projected_at`).
3. The projector is idempotent — re-delivery of the same OutboxEvent
   produces the same Turso state (upsert by primary key).

### 4.3 Read path (Turso → app)

1. The dashboard / topbar / hooks call `tursoRead()` from
   `turso/client.ts`.
2. `tursoRead()` checks the projection's freshness via
   `src/lib/turso-projector.ts` `checkStale()`. If fresh, it serves
   from Turso.
3. If stale (lag > 1000 ms per §5.3), it falls back to the Neon
   authoritative writer via Drizzle.
4. If Turso is unavailable (network, schema drift), it serves an
   empty result set and the caller falls back to Neon.

### 4.4 Reconciliation path (Turso ↔ Neon)

1. The `inngest/functions/turso-reconcile.ts` function triggers on a
   cron schedule (every hour, configurable).
2. It reads the latest `outbox_events` row from Neon, compares its
   `id` against the Turso projections' `source_commit` watermark, and
   emits a `TURSO_RECONCILIATION_RESULT` Inngest event with either
   `IN_SYNC` or `DRIFT_DETECTED` payload.
3. On drift, it triggers a `turso-projection` rebuild for the affected
   projection.

## 5. Operational runbook

### 5.1 Provisioning Turso

```bash
turso db create mtq-fortleem
turso db tokens create mtq-fortleem
turso db shell mtq-fortleem < turso/schema.sql
```

Set in `.env`:
```
TURSO_DATABASE_URL=libsql://mtq-fortleem.<region>.turso.io
TURSO_AUTH_TOKEN=<token-from-step-2>
```

### 5.2 Schema migration

There is no automatic schema migration. Schema changes require:
1. A signed commit that updates `turso/schema.sql`.
2. A manual `turso db shell` apply in a maintenance window.
3. A `turso-reconcile` reconciliation run to confirm consistency.

### 5.3 Drift recovery

When `turso-reconcile` reports `DRIFT_DETECTED`:
1. Verify the Neon outbox_events table for unprocessed PENDING rows.
2. Re-run `inngest/functions/turso-projection.ts` with `--rebuild`
   flag (or trigger the `turso/projection/rebuild` event).
3. Confirm the next `turso-reconcile` cron reports `IN_SYNC`.

### 5.4 Read-router failover

The read router in `src/lib/turso-projector.ts` `checkStale()`
transparently falls back to Neon when Turso is stale. To force a
failover (e.g. during a Turso outage), set
`MITHQAL_PROJECTION_BACKEND=none` in env and redeploy. The read
router will then short-circuit to Neon on every read.

## 6. References

- `turso/schema.sql` — the 7-table DDL.
- `turso/client.ts` — the read-only libSQL client.
- `src/lib/turso-projector.ts` — the watermark + stale-gating logic.
- `inngest/functions/turso-projection.ts` — the projector function.
- `inngest/functions/turso-reconcile.ts` — the hourly reconciliation
  cron.
- `docs/inngest-policy.md` — the retry / dead-letter policy that
  governs the projector and the reconciler.

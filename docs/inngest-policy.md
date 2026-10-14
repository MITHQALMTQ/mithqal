# MITHQAL Inngest Retry + Dead-Letter Policy

**Document ID:** MITHQAL-INNGEST-POLICY
**Status:** DECISION (FULL-PLATFORM-BUILD)
**Truth state:** WIRED. Inngest Cloud is the orchestration backend
for every long-running workflow in the MITHQAL Assurance platform.
This document defines the retry policy, the dead-letter handling,
and the operational runbook for the 12 Inngest functions registered
under `inngest/functions/`.

## 1. Function inventory

| # | Function ID | Trigger | Purpose | Truth state |
|---|---|---|---|---|
| 1 | `validation-pipeline` | `validation.case.received` | Run the validation engine + persist policy decision + exceptions. | WIRED |
| 2 | `replay-pipeline` | `replay.requested` | Re-evaluate a historical case under its original rule version. | WIRED |
| 3 | `reconciliation-pipeline` | `reconciliation.needed` | Compare source-system values + apply tolerance policy. | WIRED |
| 4 | `evidence-bundle` | `evidence.bundle.requested` | Assemble the immutable evidence bundle for a case. | WIRED |
| 5 | `exception-lifecycle` | `exception.opened` / `exception.resolved` | Drive the exception state machine. | WIRED |
| 6 | `safe-halt-trigger` | `safe.halt.triggered` | Propagate the halt signal + emit outbox row. | WIRED |
| 7 | `outbox-dispatch` | `outbox.pending` (cron every 10s) | Consume the Neon outbox + fan out to consumers. | WIRED |
| 8 | `audit-export` | `audit.export.requested` | Assemble the audit bundle for an institution + window. | WIRED |
| 9 | `policy-publish` | `policy.published` | Promote DRAFT → ACTIVE + upsert the policy_cache projection. | WIRED |
| 10 | `health-sweep` | `health.sweep` (cron every 10 min) | Probe dependencies + purge expired idempotency records. | WIRED |
| 11 | `turso-projection` | `turso.projection.needed` | Apply an outbox event to the Turso projection tables. | WIRED |
| 12 | `turso-reconcile` | `turso.reconcile.needed` (cron hourly) | Compare Turso watermarks against Neon + trigger rebuild on drift. | WIRED |

## 2. Retry policy

Per Inngest v4 default + the §6.2 transactional-outbox contract:

1. **At-least-once delivery** — every function MUST tolerate
   re-delivery of the same event. The Neon authoritative writer is
   the single source of truth; Inngest functions are idempotent
   consumers that upsert by primary key.
2. **Default retry** — Inngest's default policy is 3 retries with
   exponential backoff (1s, 4s, 16s). The default applies to every
   function in this directory unless overridden in the function's
   `createFunction` options.
3. **Maximum retries** — 5 retries. Functions that exceed this
   limit are moved to the Inngest Cloud dead-letter queue (DLQ) for
   operator intervention.
4. **Step-level retries** — every `step.run()` call is wrapped in
   Inngest's step-run instrumentation; a step that throws is
   retried independently of the parent function. Steps that must
   not retry (e.g. irreversible side effects) use `step.run().nonRetriable()`.
5. **No silent failures** — every `step.run()` catch block logs to
   Pino at WARN / ERROR so the audit trail records the failure even
   when the retry succeeds.

## 3. Dead-letter handling

When a function exhausts its retries (5 attempts), Inngest Cloud
marks the function invocation as `FAILED` and the event is moved to
the DLQ. The DLQ is observable via:

1. The Inngest Cloud dashboard — `mithqal-assurance` project →
   Functions → Failed runs.
2. The `health-sweep` Inngest function — every 10 minutes it queries
   the Inngest Cloud API for failed runs in the last 10 minutes
   and emits an `outbox_events` row recording the failure count.
3. The dashboard status-bar — failed runs surface as a
   `InngestDLQ` badge in the topbar.

An operator resolves a DLQ entry by:

1. Reading the failed run's logs (Inngest Cloud dashboard).
2. Either:
   - Fixing the root cause (e.g. a transient Neon outage) and
     replaying the event from the Inngest Cloud dashboard, OR
   - Manually replaying the event via the relevant API route (e.g.
     `POST /api/v1/validation-cases/{id}/replay` for a failed
     `validation-pipeline` run), OR
   - Acknowledging the failure as unrecoverable (e.g. a malformed
     event payload that cannot be fixed) and recording it in
     `docs/verification/inngest-dlq-YYYY-MM-DD.md`.

DLQ entries are NEVER silently discarded. The Inngest Cloud DLQ is
configured with a 30-day retention; entries older than 30 days are
auto-purged after an operator has reviewed them.

## 4. Per-function retry overrides

| Function ID | Override | Rationale |
|---|---|---|
| `validation-pipeline` | None — default 3 retries. | Idempotent via `policy_decisions` upsert. |
| `replay-pipeline` | None — default 3 retries. | Idempotent via `policy_decisions` upsert. |
| `reconciliation-pipeline` | None — default 3 retries. | Idempotent via `reconciliation_cases` upsert. |
| `evidence-bundle` | None — default 3 retries. | Idempotent via `evidence_events` upsert. |
| `exception-lifecycle` | 1 retry only. | The state-machine transition is short; the dispatcher will re-emit if the function fails. |
| `safe-halt-trigger` | 0 retries (fire-and-forget). | The halt signal must propagate immediately; retries add latency without improving the outcome. |
| `outbox-dispatch` | 5 retries (max). | The dispatcher is the only path from Neon to Turso; we want to maximise the chance of eventual delivery. |
| `audit-export` | None — default 3 retries. | Idempotent via `outbox_events` upsert. |
| `policy-publish` | None — default 3 retries. | Idempotent via `policy_versions.status` upsert. |
| `health-sweep` | 0 retries (fire-and-forget). | The sweep runs every 10 minutes; a transient failure is recovered by the next sweep. |
| `turso-projection` | 5 retries (max). | The projection is the canonical path from Neon to Turso; we want to maximise the chance of eventual delivery. |
| `turso-reconcile` | 0 retries (fire-and-forget). | The reconcile runs hourly; a transient failure is recovered by the next run. |

## 5. Cron schedules

| Function ID | Schedule | Inngest Cloud cron expression |
|---|---|---|
| `outbox-dispatch` | every 10 seconds | `*/10 * * * * *` (configured in the Inngest Cloud dashboard) |
| `health-sweep` | every 10 minutes | `*/10 * * * *` (configured in the Inngest Cloud dashboard + emitted via the `health.sweep` event from the Vercel cron — see `vercel.json`) |
| `turso-reconcile` | hourly | `0 * * * *` (configured in the Inngest Cloud dashboard) |

The cron schedules are NOT hardcoded in the function definitions —
Inngest v4 cron triggers are registered in the Inngest Cloud
dashboard so they survive a code deploy without a schema migration.

## 6. Operational runbook

### 6.1 Provisioning Inngest Cloud

```bash
inngest-cli register inngest/client.ts
inngest-cli deploy inngest/functions/
```

Set in `.env`:
```
INNGEST_API_KEY=sk-inn-...
INNGEST_SIGNING_KEY=signkey-prod-...
INNGEST_EVENT_KEY=...
```

The route handler at `src/app/api/inngest/route.ts` re-exports
`serve()` with this client. Inngest Cloud polls that route to
discover registered functions + invoke them on event.

### 6.2 Local development

```bash
bunx inngest-cli dev
```

This starts a local Inngest dev server on `http://localhost:8288`
that polls the local `/api/inngest` route. Events sent via
`inngest.send()` are queued locally; the dashboard is at
`http://localhost:8288`.

### 6.3 Production authorization

Per §7.6, Inngest functions are READ-ONLY with respect to monetary
state. They refresh audit records, run reconciliation reports, and
emit advisory signals — they NEVER mint, weight, or alter NAV. The
deterministic v19 monetary engine remains the sole writer; the
canonical v26.0 authoritative writer is Neon Postgres per §6.1 /
D-006.

Inngest functions are NOT production-authorized to initiate a
payment, execute a rail, or move value. The MTQ gate
(`src/lib/mtq-gate.ts`) is the hard boundary; `mtqDisabled=true`
means every Inngest function's writes are downgraded to synthetic
+ auditable, never to live settlement.

## 7. References

- `inngest/client.ts` — the canonical Inngest client config.
- `inngest/functions/*.ts` — the 12 function definitions.
- `src/app/api/inngest/route.ts` — the route handler that serves
  the Inngest Cloud polling endpoint.
- `src/lib/inngest-client.ts` — the legacy v26.0 client (re-exported
  by `src/inngest/client.ts`).
- `docs/gap-register.md` §9 — the gap-register entries for each
  function.
- `docs/turso-policy.md` — the projection policy that governs
  `turso-projection` + `turso-reconcile`.

# inngest/

MITHQAL v26.0 Inngest workflow definitions.

## Scope

This directory holds the canonical Inngest function definitions that
implement the long-running workflows of the v26.0 control plane,
notably:

- **OutboxEvent dispatcher** (§6.2 + §11.4 OD-007). Reads
  `dispatchStatus='PENDING'` OutboxEvent rows, fans them out to
  consumers (projection, reporting, reconciliation), and writes
  `InboxEvent` rows for consumer-side idempotency.
- **BM-15 Monetary Authorization** (§4.4). Runs the policy engine for
  an instruction that has reached F2 and produces a `PolicyDecision`
  row.
- **BM-16A Finality Verification** (§4.4). Verifies the minimum-proof
  predicate of the target finality state and writes a `GateDecision`
  row.
- **Projection watermark updater** (§6.8). Updates
  `ProjectionWatermark.lagMs` and `isStale` for each projection.
- **Reconciliation case closer** (§5.3). Closes a `ReconciliationCase`
  when the discrepancy class's tolerance is met or when an operator
  signs off.

## Configuration

- `INNGEST_API_KEY`, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY` are
  read from `.env`. Per `cred-incident-001-2026-10-10.json`, these
  credentials are PENDING_ROTATION and must not be considered
  production-authorized.

## Rules

- Inngest functions MUST be idempotent. At-least-once delivery is the
  contract; the function MUST tolerate redelivery.
- An Inngest function that writes to the authoritative writer MUST
  emit an OutboxEvent row in the same transaction.

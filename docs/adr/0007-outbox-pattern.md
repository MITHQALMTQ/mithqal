# ADR 0007 — Outbox Pattern

- **Status:** ACCEPTED
- **Date:** 2026-10-10
- **Blueprint Reference:** v26.0 §6.2, §6.3, §11.3 D-007
- **Reviewers:** Platform Engineering, Architecture Review Board, Operations

## Context

v25.x attempted to dual-write to Neon and Turso within a single
application-level transaction. The dual-write pattern caused:

1. **Atomicity drift.** When the Neon write succeeded but the Turso
   write failed (or vice versa), the two stores drifted. Reconciliation
   cases were the rule, not the exception.

2. **Idempotency gaps.** Without a transactional outbox, the same
   instruction could be projected twice if the dispatcher retried after
   a transient failure.

3. **Cross-consumer fan-out complexity.** Each new consumer (projection,
   reporting, reconciliation) required a new write path. There was no
   central event stream that all consumers could read from.

## Decision

Every authoritative write to Neon is accompanied by an `OutboxEvent` row
in the same database transaction (transactional outbox pattern, §6.2).
The OutboxEvent row carries:

- `outboxId`, `eventId` (canonical ids),
- `aggregateType`, `aggregateId`, `aggregateVersion` (which aggregate this
  event belongs to, e.g. `Instruction` + the instruction id + version),
- `eventType`, `schemaVersion`, `payloadRef`, `payloadHash`,
- `nextAttemptAt`, `attemptCount`, `dispatchStatus`,
- `leaseOwner`, `leaseExpiresAt` (for at-least-once dispatch),
- `consumerDedupeKey` (for consumer-side idempotency),
- `traceId`, `errorCategory`.

Each consumer (projection fans-out, reporting, reconciliation) reads the
OutboxEvent stream with at-least-once delivery and writes an `InboxEvent`
row keyed by `consumerDedupeKey` before processing. Idempotency is
enforced on the consumer side: a redelivery with the same
`consumerDedupeKey` is a no-op.

The `IdempotencyRecord` table tracks the first outcome for a given
`idempotencyKey` + `operation`. A conflicting body hash raises a
`conflictingBodyHash` mismatch and surfaces to the operator.

## Consequences

**Positive:**

- Authoritative writes are atomic with their OutboxEvent emission. No
  dual-write drift.
- Idempotency is provable on the consumer side. At-least-once delivery
  is the only delivery guarantee; exactly-once is not promised and not
  needed.
- New consumers can be added without changing the writer path; they
  read the same OutboxEvent stream.
- The OutboxEvent stream is the canonical audit trail.

**Negative:**

- The dispatcher (OutboxEvent → consumer) must be implemented and
  operated. Pilot A defers the dispatcher to an Inngest function
  (OD-007 is partially closed: schema fields present, dispatcher
  pending).
- Consumers must write an InboxEvent before processing. This is a
  discipline, not a default; tests must verify the discipline.
- `consumerDedupeKey` collisions surface as conflicting outcomes.
  Operators must investigate collisions rather than silently drop
  them.

## Alternatives Considered

1. **Dual-write with reconciliation.** Rejected; this is the v25.x
   state and the source of the atomicity drift this ADR addresses.

2. **Change Data Capture (CDC) on Neon.** Partially considered. CDC
   on Neon Postgres is feasible but adds operational complexity
   (a separate CDC pipeline, lag monitoring, schema-change handling).
   The transactional outbox is simpler and equally auditable. CDC may
   be revisited for a high-volume consumer in a later pilot stage.

3. **Exactly-once delivery.** Rejected; exactly-once delivery across
   heterogeneous consumers is not provable. At-least-once with consumer
   idempotency is the institutional messaging standard (RTGS, SWIFT,
   FIX all use at-least-once + dedupe).

## Blueprint Reference

- v26.0 §6.2 Outbox / Inbox Pattern
- v26.0 §6.3 Idempotency
- v26.0 §6.8 Projection Watermarks
- v26.0 §11.3 D-007 At-Least-Once + Idempotent Delivery
- Appendix B.3 OutboxEvent row shape

## Code Evidence

- `prisma/schema.prisma#OutboxEvent`
- `prisma/schema.prisma#InboxEvent`
- `prisma/schema.prisma#IdempotencyRecord`
- `src/lib/db-authoritative.ts#OutboxRow`
- `src/app/api/gateway/v1/instructions/route.ts` (OutboxEvent row
  emitted alongside the authoritative Instruction write)
- `institutional/decision-log/od-001-through-od-015.json#OD-007`
  (dispatcher implementation pending)

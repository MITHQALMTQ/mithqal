# ADR 0001 — Database Writer Authority

- **Status:** ACCEPTED
- **Date:** 2026-10-10
- **Blueprint Reference:** v26.0 §6.1, §11.3 D-006, Appendix B
- **Reviewers:** Architecture Review Board, Platform Engineering, Controller

## Context

v25.x experimented with treating both Neon (Postgres) and Turso (libSQL) as
"writers" and used application-level reconciliation to merge the two. This
created three problems:

1. **Dual-write atomicity drift.** When the Neon write succeeded but the
   Turso write failed (or vice versa), the two stores drifted. Reconciliation
   cases were the rule, not the exception.

2. **Confused authority.** Operators could not tell which store contained
   the canonical record. Read-after-write scenarios depended on which store
   the caller hit first.

3. **Latency masking.** The reconciliation pipeline tolerated up to 1%
   deltas, which masked identity drift and principal corruption until they
   became incidents.

MITHQAL v26.0 §6.1 establishes the principle of a single authoritative
writer for the control plane, with projection stores that consume events
through a transactional outbox.

## Decision

Neon Postgres is the single authoritative writer for every MITHQAL
control-plane instruction. Turso (libSQL) is the projection store,
consuming OutboxEvents through at-least-once delivery with consumer-side
idempotency (InboxEvent + consumerDedupeKey).

Concretely:

- `getAuthoritativeBackend()` returns `"neon"` by default; the only
  alternative is `"turso-demo-only"` for local demo environments.
- `getProjectionBackend()` returns `"turso"` (or `"none"`).
- `getCanonicalPrisma()` returns the shared PrismaClient instance wired
  to `DATABASE_URL` (Neon Postgres).
- Every authoritative write MUST be accompanied by an `OutboxEvent` row in
  the same transaction (transactional outbox pattern, §6.2).
- Projections are watermark-gated per §6.8. Reads route to the projection
  only when the watermark lag is within SLO; otherwise they fall back to
  the authoritative writer.
- `MITHQAL_PRODUCTION_AUTHORIZED` defaults to `false`; promotion to `true`
  requires a `GateDecision` row with `decision=PRODUCTION_AUTHORIZED` and
  all G0..G11 gates satisfied.

## Consequences

**Positive:**

- Exactly one writer per instruction — no dual-write atomicity drift.
- Authority is unambiguous at any time.
- Projection failures no longer corrupt the authoritative record.
- The reconciliation pipeline becomes a class-specific tolerance check
  (§5.3) rather than a "merge the two stores" heuristic.

**Negative:**

- Neon becomes a hard dependency for every authoritative write. A Neon
  outage blocks new instructions until recovered (mitigated by the F0
  failure behavior `REJECT_QUARANTINE`).
- Projections can lag up to the SLO (1000 ms per §5.3) before reads
  flip back to the authoritative writer.
- Operator must run a projection dispatcher (planned as an Inngest
  function — see OD-007).

## Alternatives Considered

1. **Dual-writer with reconciliation.** Rejected; this was the v25.x
   state and is the source of the problems this ADR addresses.

2. **Turso-only.** Rejected; libSQL is excellent for projections but
   does not provide the relational guarantees Neon Postgres provides for
   the authoritative record (foreign keys, transactional outbox, etc.).

3. **Neon-only (no projection).** Rejected; projection reads are needed
   for low-latency dashboard and analytics queries that should not hit
   the authoritative writer.

## Blueprint Reference

- v26.0 §6.1 Authoritative Writer
- v26.0 §6.2 Outbox / Inbox Pattern
- v26.0 §6.8 Projection Watermarks
- v26.0 §11.3 D-006 Neon Authoritative; Turso Projection
- Appendix B.1 Instruction, B.3 OutboxEvent, B.4 EvidenceArtifact

## Code Evidence

- `src/lib/prisma-canonical.ts`
- `src/lib/db-authoritative.ts`
- `prisma/schema.prisma`
- `src/app/api/neon/health/route.ts`
- `src/app/api/gateway/v1/instructions/route.ts`

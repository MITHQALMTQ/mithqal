# schemas/

JSON Schema and equivalent machine-readable schemas for MITHQAL v26.0
external API contracts and internal record shapes.

## Scope

This directory holds the canonical JSON Schemas that correspond to:

- Appendix B.1 — Instruction record
- Appendix B.2 — Policy decision record
- Appendix B.3 — OutboxEvent row
- Appendix B.4 — EvidenceArtifact, GateDecision, ReconciliationCase rows
- §6.3 — IdempotencyRecord

The TypeScript interfaces in `src/lib/db-authoritative.ts` are the
runtime source of truth for record shapes. The JSON Schemas in this
directory are the external-contract source of truth used by the gateway
endpoints to validate request bodies.

## Planned files

- `instruction.schema.json` (Appendix B.1)
- `policy-decision.schema.json` (Appendix B.2)
- `outbox-event.schema.json` (Appendix B.3)
- `evidence-artifact.schema.json` (Appendix B.4)
- `gate-decision.schema.json` (§9.1 + Appendix B.4)
- `reconciliation-case.schema.json` (Appendix B.4 + §5.3)
- `idempotency-record.schema.json` (§6.3)

## Rules

- Schemas MUST stay in sync with the TypeScript interfaces in
  `src/lib/db-authoritative.ts`.
- A schema version bump (e.g. 1.0.0 → 1.1.0) requires a decision-log
  entry and an ADR.

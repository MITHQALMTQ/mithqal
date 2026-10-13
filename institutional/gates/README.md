# institutional/gates/

Gate decision records for MITHQAL v26.0 §9.1 G0..G11.

## Scope

Each file in this directory is a human-readable projection of a
`GateDecision` row (or a set of `GateDecision` rows) from the
authoritative writer (Neon). The source of truth is the database row;
these files are the institutional attestation layer.

## File naming

- `G<NN>-<YYYYMMDD>.json` — a single gate decision (e.g.
  `G0-20261010.json`)
- `G<NN>-history.json` — the full decision history for one gate,
  ordered by `decisionAt` ascending.
- `gate-ledger-<YYYYMMDD>.json` — a point-in-time snapshot of all
  G0..G11 gate decisions.

## Fields

Per `src/lib/db-authoritative.ts#GateDecisionRecord`:

- `decisionId`, `gateId`, `scope`, `evidenceRefs`
- `unmetRequirements`, `decision`, `conditions`, `conditionsExpiry`
- `approvers`, `decisionAt`
- `blueprintReleaseHash`, `priorDecisionId`, `nextReviewAt`

## Rules

- A `GateDecision` row MUST cite at least one evidence artifact from
  `institutional/evidence/`.
- A `decision=PRODUCTION_AUTHORIZED` row requires all G0..G11 gates
  to have a `decision=PASS` row in the same scope.
- Gate decisions are immutable. A new decision in the same scope
  supersedes the prior; the `priorDecisionId` chain MUST be intact.

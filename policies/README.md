# policies/

Machine-readable policy definitions and policy-version registry for
MITHQAL v26.0.

## Scope

This directory holds the canonical policy definitions referenced by:

- v26.0 §3.2 — MTQ Activation Gate (env-driven, runtime-checked by
  `src/lib/mtq-gate.ts`)
- v26.0 §3.3 — Eligible Backing Freshness Policy (referenced by
  `BackingDimensionInput.freshnessPolicyVersion`)
- v26.0 §4.4 — BM-15 Monetary Authorization Policy
- v26.0 §5.3 — Reconciliation Class Tolerance (source of truth is
  `src/lib/reconciliation-tolerance.ts`)
- v26.0 §9.1 — Gate Decision Policy

## Planned files

- `mtq-activation-gate.policy.json`
- `eligible-backing-freshness.policy.json`
- `bm-15-monetary-authorization.policy.json`
- `reconciliation-tolerance.policy.json` (read-only export of
  RECONCILIATION_TOLERANCE_REGISTRY)
- `gate-decision.policy.json`

## Rules

- Policy versions MUST be bumped atomically with code changes that
  consume them. The `policyVersion` field on every record
  (`InstructionRecord`, `PolicyDecisionRecord`, `BackingDimensionInput`)
  is the runtime attestation of which policy produced the row.
- A policy change MUST be accompanied by:
  1. A new policy file (with the new version number),
  2. A new `PolicyDecision` row in Neon,
  3. A decision-log entry,
  4. An ADR (when the change is architectural).

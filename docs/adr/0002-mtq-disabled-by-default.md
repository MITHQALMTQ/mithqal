# ADR 0002 — MTQ Disabled by Default

- **Status:** ACCEPTED
- **Date:** 2026-10-10
- **Blueprint Reference:** v26.0 §3.2, §11.3 D-001, §11.3 D-012
- **Reviewers:** Architecture Review Board, Operations, Compliance

## Context

v25.x treated the MITHQAL Token (MTQ) as the centerpiece of the platform.
Marketing copy described MTQ as "the next-generation stablecoin", the
documentation assumed MTQ was always available, and several endpoints
silently auto-enabled MTQ features when an operator merely set
`MTQ_ENABLED` to any truthy value.

This caused three institutional problems:

1. **Ambiguous product framing.** Operators and counterparties could not
   tell whether MITHQAL was a stablecoin, a CBDC, or a settlement network.

2. **Silent enablement.** Setting `MTQ_ENABLED=true` was sufficient to
   unlock mint execution — there was no second gate, no pilot-stage
   check, and no policy decision record.

3. **Counterparty risk.** Without a clear "MTQ is optional" framing,
   counterparties could reasonably expect MTQ to behave as a stablecoin
   (mintable on demand, redeemable on demand) and structure their
   exposure accordingly.

## Decision

MITHQAL is a neutral institutional settlement control plane. The MITHQAL
Token (MTQ) is **optional** and **disabled by default** in every
environment. The control plane is the canonical surface; MTQ is one
possible settlement instrument among many.

Concretely:

- `isMtqEnabled()` reads `MTQ_ENABLED` (default `"false"`). Truthy values
  are `"true"`, `"1"`, or `"yes"`.
- `getMtqPilotStage()` reads `MTQ_PILOT_STAGE` (default `"A"`). Only
  Pilot B is permitted to execute MTQ actions.
- `assertMtqEnabled(action)` returns `ok=false` whenever MTQ is disabled
  **or** whenever the pilot stage is not `B`. Callers must consult this
  function before any MTQ-related progression (notably F3 in the finality
  state machine, §4.2).
- `MITHQAL_PRODUCTION_AUTHORIZED` defaults to `false` (§11.3 D-012).
  Promotion to `true` requires an explicit `GateDecision` row.
- The home page surfaces `v26.0 CANONICAL BASELINE — MTQ DISABLED BY
  DEFAULT` as a `VERIFIED_PRIMARY_DOCUMENT` claim, because the badge
  text matches the gate's runtime behavior.

## Consequences

**Positive:**

- Product framing is unambiguous: MITHQAL is a control plane; MTQ is an
  optional instrument.
- Promotion to "MTQ enabled" is a deliberate two-step action
  (`MTQ_ENABLED=true` AND `MTQ_PILOT_STAGE=B`), not a single-flag slip.
- The MTQ gate is enforceable in code, not in documentation.

**Negative:**

- Any operator expecting v25.x "set the flag and it works" behavior will
  be surprised. This is by design; the surprise is the safety property.
- Some legacy endpoints that called MTQ features without consulting the
  gate need updating. The 5 mint/redeem/transfer routes have already
  been updated to call `assertMtqEnabled`.

## Alternatives Considered

1. **MTQ enabled by default.** Rejected; this is the v25.x state and the
   source of the silent-enablement risk.

2. **MTQ enabled with a single flag.** Rejected; a single flag is too
   easy to set by accident. The two-step gate (enabled AND pilot-stage=B)
   prevents most accidental enablements.

3. **MTQ as a separate product.** Rejected; the institutional framing of
   MITHQAL is a control plane that may use MTQ as one of several
   settlement instruments. Splitting MTQ out would fragment the surface.

## Blueprint Reference

- v26.0 §3.2 MTQ Activation Gate
- v26.0 §11.3 D-001 Control Plane Core; MTQ Optional
- v26.0 §11.3 D-012 Production Authorization False by Default
- v26.0 §4.4 BM-15 Monetary Authorization

## Code Evidence

- `src/lib/mtq-gate.ts`
- `src/app/api/mint/route.ts`
- `src/app/api/redeem/route.ts`
- `src/app/api/transfer/route.ts`
- `src/app/api/gateway/v1/instructions/route.ts`
- `src/app/page.tsx` (ProgramStatus badge)

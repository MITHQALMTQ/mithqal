# SCALE READINESS — MITHQAL PILOT A (v25.3.2 — PROMPT 72, Section AF)

> **NOT PRODUCTION-AUTHORIZED.** Determines what would need to change
> to move from one controlled pilot to repeatable institutional pilots
> to multi-bank controlled operation. **No scaling is implemented
> automatically.** This is a future change register.

## 1. Scaling Stages (Section AF — paragraph 1)

```
ONE_CONTROLLED_PILOT
  → REPEATABLE_INSTITUTIONAL_PILOTS
    → MULTI-BANK_CONTROLLED_OPERATION
```

MITHQAL is currently at **PRE-ONE_CONTROLLED_PILOT** (Pilot A not
executed). No stage transition is contemplated.

## 2. Scaling Dimensions (Section AF — paragraph 2)

For each dimension, the future change register records what would need
to change:

| # | Dimension | Current | Required for REPEATABLE_INSTITUTIONAL_PILOTS | Required for MULTI_BANK_CONTROLLED_OPERATION |
|---|---|---|---|---|
| AF-01 | technical scaling | DESIGNED (v25.3.2 frozen) | runtime validation; multi-scenario support; performance evidence | multi-tenant; multi-corridor; horizontal scaling |
| AF-02 | operational scaling | DESIGNED | operator runbooks; incident response | multi-bank operations; 24/7 coverage |
| AF-03 | security scaling | DESIGNED (no assessment) | security assessment; controls testing | enterprise security posture; certification (separately scoped) |
| AF-04 | support scaling | DESIGNED | support procedures; SLAs | multi-bank support; escalation |
| AF-05 | legal scaling | LEGAL_VALIDATION_PENDING | counsel opinion (UAE/SG); contract templates | multi-jurisdiction legal opinions; entity restructuring |
| AF-06 | regulatory scaling | JURISDICTION_PENDING | 2-jurisdiction triage; filings | multi-jurisdiction authorization |
| AF-07 | custody scaling | NOT_REQUIRED (BANK_MONEY) | n/a for Pilot A | qualified custodian (if MTQ enabled); PBC predicates |
| AF-08 | liquidity scaling | NOT_TESTED | liquidity measurement | multi-bank liquidity coordination |
| AF-09 | reconciliation scaling | DESIGNED | reconciliation evidence at scale | multi-bank reconciliation; break resolution workflow |
| AF-10 | governance scaling | DESIGNED | governance framework; gate matrix | multi-bank governance; institutional oversight |
| AF-11 | assurance scaling | DESIGNED (framework) | independent assurance engagement | multi-bank assurance; continuous assurance |
| AF-12 | commercial scaling | INSUFFICIENT | commercial evidence; pricing model | multi-bank commercial model; revenue |

## 3. No Automatic Implementation (Section AF — last two paragraphs)

> "Do not implement these changes automatically. Create a future change
> register."

This file IS the future change register. No changes are implemented.
No code is modified. No architecture is added. The register records
what would need to change — it does not make the changes.

## 4. Honest State

- `scale_readiness_defined`: true
- `current_stage`: PRE_ONE_CONTROLLED_PILOT
- `future_change_register_created`: true (this file)
- `changes_implemented_automatically`: 0 (none)
- `production_authorized`: false
- `institutionally_validated`: false

NOT PRODUCTION-AUTHORIZED. Scale readiness designed as a future change
register; no scaling implemented; no stage transition contemplated.

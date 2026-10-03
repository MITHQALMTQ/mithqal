# SECOND-INSTITUTION REPLICATION SCOPE — MITHQAL PILOT A (v25.3.2 — PROMPT 72, Section AN)

> **NOT PRODUCTION-AUTHORIZED.** Template for a future second-
> institution replication engagement. NOT activated.

## 1. Replication Scope (template)

The replication scope would cover:
- same corridor (C-AE-SG) OR different corridor (per Section AN —
  "different corridor where appropriate")
- same MTQ-disabled mode (MTQ remains DISABLED)
- same BANK_MONEY settlement asset
- same 19 BM steps
- same 15 KPIs (for direct comparison)
- same 12 stop conditions
- same 18 conditions precedent
- different bank (the second institution)
- potentially different rail (where applicable)
- potentially different workflow (where appropriate)

## 2. Variables vs Constants

| Variable | Same or Different? | Rationale |
|---|---|---|
| corridor | SAME or DIFFERENT | per Section AN — "different corridor where appropriate" |
| bank | DIFFERENT | the point of second-institution test |
| MTQ mode | SAME (DISABLED) | MTQ remains disabled; no MTQ validity inferred |
| settlement asset | SAME (BANK_MONEY) | consistency |
| BM steps | SAME (19) | direct comparison |
| KPIs | SAME (15) | direct comparison |
| stop conditions | SAME (12) | consistency |
| conditions precedent | SAME (18) | consistency |
| rail | SAME or DIFFERENT | per Section AN — "different rail where appropriate" |
| workflow | SAME or DIFFERENT | per Section AN — "different workflow where appropriate" |

## 3. Population (template)

| Population | First Pilot | Second Pilot (template) |
|---|---|---|
| transactions | 16 scenarios (planned; 0 executed) | 16 scenarios (template) |
| BM steps | 19 × 16 = 304 events (planned; 0 executed) | 19 × 16 = 304 events (template) |
| KPIs | 15 (0 measured) | 15 (template) |
| failure scenarios | 15 (0 tested) | 15 (template) |
| independent assurance tests | 94 (0 executed) | 94 (template) |

## 4. Activation Conditions

This scope is NOT activated. Activation requires:
1. First Pilot A executed
2. First Pilot A evidence independently assured
3. `SECOND_INSTITUTION_REQUIRED = YES` supported by evidence

## 5. Honest State

- `replication_scope_defined`: true (template)
- `replication_scope_activated`: false
- `production_authorized`: false
- `institutionally_validated`: false

NOT PRODUCTION-AUTHORIZED. Replication scope template designed; not
activated.

# SECOND-INSTITUTION REPEATABILITY TEST — MITHQAL PILOT A (v25.3.2 — PROMPT 72, Section AN)

> **NOT PRODUCTION-AUTHORIZED.** Template for the second-institution
> repeatability test. NOT activated.

## 1. Purpose (Section AN — last paragraph)

> "The purpose is to test whether the first pilot result survives:
> different institution and/or different workflow and/or different
> corridor where appropriate."

This test is NOT activated because the first pilot has not executed.

## 2. Test Design (template)

### Step 1 — Establish First-Pilot Baseline
- Execute first Pilot A (16 scenarios, 19 BM steps, 15 KPIs)
- Collect evidence per `06_transaction-traceability.md`
- Measure KPIs per `19_kpi-assurance.md`
- Perform independent assurance per `13_independent-assurance-outcome.md`

### Step 2 — Engage Second Institution
- Approach a second bank (different from the first)
- Execute NDA + DPA
- Conduct second Institutional Discovery Workshop per `bank-workshop/`
- Negotiate second pilot term sheet
- Execute second pilot

### Step 3 — Compare Results
- For each same-metric (per `same-vs-different-metrics.md`):
  - Record first-pilot value
  - Record second-pilot value
  - Compute variance
  - Classify: MATCH / MISMATCH / INSUFFICIENT_EVIDENCE
- For each MISMATCH, investigate cause (bank-specific? workflow-specific? corridor-specific?)

### Step 4 — Determine Generalizability
- Per `21_repeatability-analysis.md`:
  - transaction-specific?
  - workflow-specific?
  - bank-specific?
  - corridor-specific?
  - rail-specific?
  - jurisdiction-specific?
  - potentially generalizable?
- Classify: REPEATABILITY_SUPPORTED / REPEATABILITY_PARTIAL / REPEATABILITY_NOT_SUPPORTED / REPEATABILITY_UNKNOWN

## 3. Activation Gate

This test is activated only when:
1. First Pilot A executed
2. First Pilot A evidence independently assured
3. `SECOND_INSTITUTION_REQUIRED = YES` supported by evidence
4. Second bank engaged
5. Second pilot term sheet EXECUTED

None of these conditions is met.

## 4. Honest State

- `repeatability_test_defined`: true (template)
- `repeatability_test_activated`: false
- `first_pilot_executed`: false
- `second_pilot_executed`: false
- `generalizability_assessment`: UNKNOWN
- `production_authorized`: false
- `institutionally_validated`: false

NOT PRODUCTION-AUTHORIZED. Repeatability test template designed; not
activated; first pilot not executed.

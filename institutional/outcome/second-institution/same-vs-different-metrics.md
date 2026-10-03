# SECOND-INSTITUTION SAME-VS-DIFFERENT METRICS — MITHQAL PILOT A (v25.3.2 — PROMPT 72, Section AN)

> **NOT PRODUCTION-AUTHORIZED.** Template for comparing same-vs-
> different metrics across first and second pilots. NOT activated.

## 1. Same Metrics (for direct comparison)

These metrics MUST be the same in both pilots to permit direct
comparison:

| Metric | Same Value |
|---|---|
| KPI definitions | same 15 KPIs |
| KPI formulas | same formulas |
| KPI inclusion rules | same |
| KPI exclusion rules | same |
| KPI timestamp basis | same |
| BM step definitions | same 19 BM steps |
| Tolerance classes | same |
| Failure scenarios | same 15 |
| Stop conditions | same 12 |
| Conditions precedent | same 18 |
| Evidence schema | same FROZEN EvidencePackage |
| Access levels | same PUBLIC / INSTITUTIONAL / AUDIT |

## 2. Different Metrics (where the second pilot legitimately differs)

| Metric | May Differ | Rationale |
|---|---|---|
| bank baseline | different | different bank → different baseline |
| bank system landscape | different | different bank systems |
| bank operational context | different | different bank operations |
| bank compliance requirements | different (potentially) | different bank compliance posture |
| corridor (if different) | different | per Section AN |
| rail (if different) | different | per Section AN |
| workflow (if different) | different | per Section AN |

## 3. Comparison Methodology (template)

For each same-metric, the comparison would be:
1. Record first-pilot value
2. Record second-pilot value
3. Compute variance
4. Classify: MATCH / MISMATCH / INSUFFICIENT_EVIDENCE
5. If MISMATCH, investigate cause (bank-specific? workflow-specific? corridor-specific?)
6. Determine generalizability per `21_repeatability-analysis.md`

## 4. Honest State

- `same_vs_different_metrics_defined`: true (template)
- `same_metrics_count`: 12
- `different_metrics_count`: 6
- `comparison_methodology_defined`: true (template)
- `activated`: false
- `production_authorized`: false
- `institutionally_validated`: false

NOT PRODUCTION-AUTHORIZED. Same-vs-different metrics template
designed; not activated.

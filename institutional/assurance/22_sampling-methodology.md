# Sampling Methodology — 9 Populations + 7-Field Method + Small-Population Rule

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Sampling Identity

| Field | Value |
|---|---|
| **Sampling methodology ID** | `SM-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Canonical plan** | `ASP-PA-001` (see `assurance-sampling-plan.md`) |
| **State** | `DESIGNED` |
| **Population count** | 9 |
| **Per-method field count** | 7 |
| **Small-population rule** | ENFORCED — see Section 4 (16 scenarios too small for statistical inference) |
| **Samples drawn to date** | 0 |

## 2. Nine Sampling Populations

| # | Population ID | Name | Description | Sampling method | Status |
|---|---|---|---|---|---|
| 1 | SP-01 | Transactions | All transactions in scope | Census (small N) or stratified random | DESIGNED |
| 2 | SP-02 | Authorization decisions | All authorization events | Census | DESIGNED |
| 3 | SP-03 | Policy versions | All policy versions ACTIVE in audit period | Census | DESIGNED |
| 4 | SP-04 | Compliance decisions | All compliance events | Census | DESIGNED |
| 5 | SP-05 | Settlement events | All settlement events | Census | DESIGNED |
| 6 | SP-06 | Reconciliation runs | All reconciliation runs in audit period | Census | DESIGNED |
| 7 | SP-07 | Failure scenarios | The 15 mandatory scenarios (F-01..F-15) | Census (N=15) | DESIGNED |
| 8 | SP-08 | Safe-halt triggers | All safe-halt triggers in audit period | Census (likely small N) | DESIGNED |
| 9 | SP-09 | KPI records | All populated KPIs (0/15 populated — population size 0) | Census (N=0) | DESIGNED |

## 3. Seven-Field Sampling Method

For each population, the sampling method must specify:

| # | Field | Purpose |
|---|---|---|
| 1 | `population_id` | SP-01..SP-09 |
| 2 | `population_size` | Total N (small populations trigger Section 4 rule) |
| 3 | `sampling_method` | Census / Stratified random / Purposive / Systematic |
| 4 | `sample_size` | n (≤ N) |
| 5 | `selection_criteria` | How items were selected (random seed, strata, etc.) |
| 6 | `evidence_required` | What evidence each sampled item must produce |
| 7 | `inference_class` | Statistical / Non-statistical / None (per small-population rule) |

## 4. Small-Population Rule

**The 15 mandatory failure scenarios (SP-07) and the 16 authorization scenarios (per `11_authorization-assurance.md`) are TOO SMALL for statistical inference.**

For populations with N ≤ 30, the sampling method must be:
- `Census` (examine every item) — preferred for populations with N ≤ 30
- `Purposive` (select specific items based on risk) — acceptable when census is impractical

For these small populations:
- The inference class is `Non-statistical`.
- The framework does NOT claim "statistical confidence" in any conclusion drawn from these populations.
- Any file that claims a statistical confidence for a small population must be retracted.

For larger populations (e.g., transactions over a long audit period with N > 30):
- Stratified random sampling is acceptable.
- Statistical inference is acceptable IF the sample is truly random and the population is well-defined.

## 5. Honest-State Markers

- 0 samples drawn.
- 0 sampling methods executed.
- 0 populations enumerated.
- All 9 populations at state `DESIGNED`.
- All 7 method fields at state `DESIGNED`.
- Small-population rule enforced.
- 0/15 KPI baselines populated (SP-09 N=0).

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

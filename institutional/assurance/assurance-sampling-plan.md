# Assurance Sampling Plan — ASP-PA-001

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Sampling Plan Identity

| Field | Value |
|---|---|
| **Plan ID** | `ASP-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Companion file** | `22_sampling-methodology.md` |
| **State** | `DESIGNED` |
| **Population count** | 9 (per `22_sampling-methodology.md` Section 2) |
| **Small-population rule** | ENFORCED — see Section 4 |
| **Statistical confidence claimed** | NONE — see Section 4 |
| **Samples drawn to date** | 0 |

## 2. Nine-Population Sampling Table

Per `22_sampling-methodology.md` Section 2. All 9 populations at state `DESIGNED`. 0 samples drawn.

| Population ID | Population | Size (N) | Sampling method | Inference class |
|---|---|---|---|---|
| SP-01 | Transactions | TBD (likely small) | Census | Non-statistical |
| SP-02 | Authorization decisions | TBD | Census | Non-statistical |
| SP-03 | Policy versions | TBD | Census | Non-statistical |
| SP-04 | Compliance decisions | TBD | Census | Non-statistical |
| SP-05 | Settlement events | TBD | Census | Non-statistical |
| SP-06 | Reconciliation runs | TBD | Census | Non-statistical |
| SP-07 | Failure scenarios (F-01..F-15) | 15 | Census | Non-statistical |
| SP-08 | Safe-halt triggers | TBD (likely small) | Census | Non-statistical |
| SP-09 | KPI records | 0 (0/15 populated) | Census (N=0) | Non-statistical |

## 3. Per-Population Sampling Method

Each population's sampling method is specified by 7 fields per `22_sampling-methodology.md` Section 3:
1. `population_id`
2. `population_size`
3. `sampling_method` (Census / Stratified / Purposive / Systematic)
4. `sample_size`
5. `selection_criteria`
6. `evidence_required`
7. `inference_class`

## 4. Small-Population Rule

Per `22_sampling-methodology.md` Section 4:
- N ≤ 30 → Census (examine every item).
- 16 authorization scenarios + 15 failure scenarios → N ≤ 16 → too small for statistical inference.
- No statistical confidence is claimed for any population.
- Inference class = Non-statistical for all 9 populations.

## 5. No Statistical Confidence Claimed

The framework explicitly does NOT claim statistical confidence in any sampling conclusion. The framework:
- Examines every item where N is small.
- Uses non-statistical inference.
- Reports findings as factual (per `23_finding-classification.md`), not as statistical confidence intervals.

## 6. Honest-State Markers

- 0 samples drawn.
- 0/9 populations enumerated.
- All 9 populations at state `DESIGNED`.
- All 7 method fields at state `DESIGNED`.
- Small-population rule enforced.
- 0 statistical confidence claimed.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

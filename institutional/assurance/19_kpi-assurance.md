# KPI Assurance — 13-Field KPI Record + 7-Test Surface + Independent Recalculation

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. KPI Assurance Identity

| Field | Value |
|---|---|
| **KPI assurance ID** | `KPI-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Canonical recalc spec** | `AKR-PA-001` (see `assurance-kpi-recalculation.md`) |
| **State** | `DESIGNED` |
| **KPI record field count** | 13 |
| **KPI population (per Prompt 69)** | 15 KPIs designed; 0/15 baselines populated |
| **Test surface count** | 7 |
| **Independent recalculation** | REQUIRED — see Section 4 |
| **KPIs populated to date** | 0/15 |

## 2. 13-Field KPI Record Schema

| # | Field | Purpose |
|---|---|---|
| 1 | `kpi_id` | Unique identifier for the KPI |
| 2 | `kpi_name` | Short name |
| 3 | `kpi_definition` | Verbatim definition (per Prompt 69) |
| 4 | `kpi_unit` | Unit of measurement (count / seconds / dollars / percent) |
| 5 | `kpi_formula` | The formula or computation logic |
| 6 | `kpi_inputs` | Array of input fields/evidence references |
| 7 | `kpi_baseline` | Baseline value (0/15 baselines populated — all are null) |
| 8 | `kpi_observed_value` | Observed value (none observed yet) |
| 9 | `kpi_class` | OBSERVED_RESULT / MODELED_RESULT / ASSUMPTION / UNKNOWN (never merge) |
| 10 | `kpi_evidence_ref` | Pointer to EvidencePackage record |
| 11 | `kpi_independent_recalc_value` | Reviewer's independently recalculated value |
| 12 | `kpi_recalc_match` | TRUE / FALSE / INSUFFICIENT_EVIDENCE |
| 13 | `kpi_status` | DESIGNED / EXECUTED / FAILED / INSUFFICIENT_EVIDENCE |

## 3. KPI Population (15 per Prompt 69, 0/15 baselines)

Per Prompt 69, 15 KPIs are designed. The 0/15 baseline status means: none of the 15 KPIs has a baseline value populated. KPI baselines require observed execution data — which does not exist (0 pilot executions, 0 banks, 0 counsel).

The 15 KPIs (indicative list, with detailed definitions in the system KPI registry):

1. Transaction authorization rate
2. Settlement success rate
3. Reconciliation match rate
4. F0 finality achievement rate
5. F1 ledger posting rate
6. F2 reconciliation finality rate
7. F5 settlement finality rate (cryptographic portion only — legal portion NOT_CLAIMED)
8. Safe-halt trigger count
9. Safe-halt recovery time
10. Policy version stability
11. Compliance decision rate
12. Routing decision rate
13. Closure rate
14. Audit-trail seal rate
15. Evidence integrity violation count (must be 0)

**Note:** KPIs that would reference MTQ-economic outputs (e.g., "asset-backed value rate") are EXCLUDED because MTQ is DISABLED and F3/F4 are NOT_CLAIMED.

## 4. Independent Recalculation Protocol

For each KPI, the reviewer must:
1. Obtain the KPI record from the system.
2. Re-derive the KPI value from the source evidence (per `07_evidence-chain.md` backward-trace).
3. Compare the reviewer's recalculation to the system's recorded value.
4. Record the result as MATCH / MISMATCH / INSUFFICIENT_EVIDENCE.
5. If MISMATCH, issue a finding per `23_finding-classification.md` (typically CRITICAL for KPI mismatch).
6. If INSUFFICIENT_EVIDENCE, record a limitation per `27_assurance-limitations.md`.

The reviewer's recalculation is the source of truth — the system's own KPI engine is NOT the source of truth.

## 5. Seven-Test KPI Test Surface

| # | Test ID | Name | Method | Expected result | Status |
|---|---|---|---|---|---|
| 1 | K-PI-01 | KPI record schema integrity | Verify every populated KPI record has all 13 fields valid | 100% schema integrity | DESIGNED |
| 2 | K-PI-02 | KPI class separation | Verify no KPI record has merged classes (OBSERVED_RESULT ≠ MODELED_RESULT ≠ ASSUMPTION ≠ UNKNOWN) | 0 merges | DESIGNED |
| 3 | K-PI-03 | KPI evidence strength | Verify every OBSERVED_RESULT KPI has ET-08 or ET-04 evidence (not ET-12/ET-13 WEAK) | 100% STRONG evidence for OBSERVED_RESULT | DESIGNED |
| 4 | K-PI-04 | KPI baseline presence | Verify every EXECUTED KPI has a baseline value | 100% baseline presence | DESIGNED |
| 5 | K-PI-05 | KPI independent recalculation | Recalculate every populated KPI; verify MATCH | 100% MATCH | DESIGNED |
| 6 | K-PI-06 | KPI MTQ exclusion | Verify no KPI references MTQ-economic output (MTQ DISABLED) | 0 MTQ references | DESIGNED |
| 7 | K-PI-07 | KPI replay reproducibility | Replay KPI computation (per L-01..L-08); verify MATCH | 100% MATCH | DESIGNED |

## 6. Honest-State Markers

- 0/15 KPI baselines populated.
- 0 KPIs observed.
- 0 KPIs recalculated.
- All 13 fields at state `DESIGNED`.
- All 7 tests at status `DESIGNED`.
- MTQ DISABLED; F3/F4 NOT_CLAIMED.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

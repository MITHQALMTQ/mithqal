# Assurance KPI Recalculation Spec — AKR-PA-001

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. KPI Recalculation Identity

| Field | Value |
|---|---|
| **Spec ID** | `AKR-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Companion file** | `19_kpi-assurance.md` |
| **State** | `DESIGNED` |
| **Recalculation contract** | YES — see Section 2 |
| **Procedure step count** | 6 (see Section 3) |
| **Test coverage** | 6 (see Section 4) |
| **KPIs recalculated to date** | 0/15 |

## 2. Recalculation Contract

> **For every KPI populated by the system, the reviewer must independently recalculate the KPI value from the source evidence (per `07_evidence-chain.md` backward-trace) and compare to the system's recorded value. The reviewer's recalculation is the source of truth.**

The system's own KPI engine is NOT the source of truth. The reviewer's recalculation is.

A KPI recalculation:
- MATCH: Reviewer's value == system's value (within tolerance per `13_reconciliation-assurance.md`).
- MISMATCH: Reviewer's value != system's value. CRITICAL or HIGH finding issued (per `23_finding-classification.md`).
- INSUFFICIENT_EVIDENCE: Reviewer cannot recalculate (missing source evidence). Limitation recorded (per `27_assurance-limitations.md`).

## 3. Six-Step Procedure

| # | Step | Description |
|---|---|---|
| 1 | Read KPI record | Read the KPI record from the system (13 fields per `19_kpi-assurance.md` Section 2) |
| 2 | Identify source evidence | Backward-trace (per `07_evidence-chain.md` Section 5) to identify the source events and evidence records |
| 3 | Re-derive formula | Apply the KPI formula (per `19_kpi-assurance.md` Section 2 field 5) to the source evidence |
| 4 | Compare to system's value | Compare reviewer's recalculation to system's recorded `kpi_observed_value` |
| 5 | Record result | As ET-08 (independent recalculation) — STRONG evidence |
| 6 | Update KPI record | Set `kpi_independent_recalc_value`, `kpi_recalc_match`, and `kpi_status` (per `19_kpi-assurance.md` Section 2 fields 11–13) |

## 4. Six-Test Coverage

| # | Test ID | Name | Method | Expected result | Status |
|---|---|---|---|---|---|
| 1 | AKR-01 | KPI record schema integrity | Verify 13-field schema | 100% integrity | DESIGNED |
| 2 | AKR-02 | KPI class separation | Verify no merged classes | 0 merges | DESIGNED |
| 3 | AKR-03 | KPI evidence strength | OBSERVED_RESULT has STRONG evidence | 100% STRONG | DESIGNED |
| 4 | AKR-04 | KPI baseline presence | EXECUTED KPI has baseline | 100% baseline | DESIGNED |
| 5 | AKR-05 | KPI independent recalculation | Reviewer recalc MATCH | 100% MATCH | DESIGNED |
| 6 | AKR-06 | KPI MTQ exclusion | No KPI references MTQ output | 0 MTQ refs | DESIGNED |

## 5. Honest-State Markers

- 0/15 KPIs recalculated.
- 0 MATCH results.
- 0 MISMATCH results.
- 0 INSUFFICIENT_EVIDENCE results.
- All 6 procedure steps at state `DESIGNED`.
- All 6 tests at status `DESIGNED`.
- MTQ DISABLED; F3/F4 NOT_CLAIMED.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

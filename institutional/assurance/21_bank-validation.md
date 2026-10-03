# Bank Validation Framework — 4-Field + "Attendance ≠ Validation" Rule

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Bank Validation Identity

| Field | Value |
|---|---|
| **Bank validation ID** | `BV-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Bank validation field count** | 4 |
| **Bank attendance count** | 0 |
| **Bank validation count** | 0 |
| **Mandatory rule** | Bank attendance ≠ bank validation (see Section 3) |
| **Bank pipeline status** | NOT_STARTED — 0 banks, 0 counsel, 0 pipeline |

## 2. Four-Field Bank Validation Framework

| # | Field | Purpose | Status |
|---|---|---|---|
| 1 | `bank_id` | Unique identifier for the bank | DESIGNED — 0 banks registered |
| 2 | `attendance_evidence_ref` | Pointer to EvidencePackage record for bank attendance (e.g., signed attendance sheet, meeting minutes) | DESIGNED — 0 attendance records |
| 3 | `validation_evidence_ref` | Pointer to EvidencePackage record for bank validation (e.g., counterparty-signed test transaction, F5 settlement receipt) | DESIGNED — 0 validation records |
| 4 | `validation_status` | ATTENDED / VALIDATED / NOT_VALIDATED / INSUFFICIENT_EVIDENCE | DESIGNED — 0 validations |

## 3. Mandatory Rule: Bank Attendance ≠ Bank Validation

The framework's mandatory rule:

> **A bank's attendance at a meeting, workshop, or pilot discussion does NOT constitute bank validation.**

A bank is "validated" only when:
- A counterparty-signed receipt (ET-04) is produced for a transaction with that bank.
- The receipt is independently verified (per K-07 in `08_evidence-integrity.md`).
- The bank's ledger reconciles (within tolerance) with the system's ledger (per Q-01 in `13_reconciliation-assurance.md`).

Until ALL THREE conditions are met, the bank's status is `ATTENDED` (not `VALIDATED`).

Any file in this room that claims a bank is "validated" without the three conditions must be retracted with the explicit disclosure: "Bank attendance ≠ bank validation. No bank validation has been performed."

## 4. Bank Pipeline Status

| Stage | Description | Status |
|---|---|---|
| 1. Identification | Identify candidate banks | NOT_STARTED — 0 banks identified |
| 2. Outreach | Initial outreach (e.g., letter, call) | NOT_STARTED — 0 outreach events |
| 3. Attendance | Bank attends a meeting/workshop | NOT_STARTED — 0 attendances |
| 4. Engagement | Bank agrees to engage in pilot | NOT_STARTED — 0 engagements |
| 5. Validation | Bank validates a test transaction | NOT_STARTED — 0 validations |
| 6. Endorsement | Bank endorses production deployment | NOT_STARTED — 0 endorsements |

The bank pipeline is at stage 0 (NOT_STARTED). No bank has been identified, no outreach has occurred, no attendance, no engagement, no validation, no endorsement.

## 5. Honest-State Markers

- 0 banks registered.
- 0 bank attendances.
- 0 bank validations.
- 0 bank endorsements.
- Bank attendance ≠ bank validation rule enforced.
- All 4 fields at state `DESIGNED`.
- All 6 pipeline stages at status `NOT_STARTED`.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

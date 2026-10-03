# Management Response — 4 Response Options + 8-Field Response Record + Dispute Preservation Rule

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Management Response Identity

| Field | Value |
|---|---|
| **Management response ID** | `MR-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Response option count** | 4 |
| **Response record field count** | 8 |
| **Dispute preservation rule** | ENFORCED — see Section 4 |
| **Management responses received to date** | 0 |

## 2. Four Response Options

When a finding is issued (per `23_finding-classification.md`), management must respond with exactly one of four options:

| # | Option | Meaning | Conditions |
|---|---|---|---|
| 1 | `ACCEPT` | Management accepts the finding and agrees the issue exists; remediation is required | Management must specify remediation plan and timeline |
| 2 | `REMEDIATE` | Management commits to remediate the underlying issue (fix the control, the schema, the config, etc.) | Management must specify remediation owner, plan, and timeline |
| 3 | `MITIGATE` | Management accepts the finding but commits to mitigate the risk (compensating control) instead of remediating | Management must specify the compensating control, its evidence, and timeline |
| 4 | `DISPUTE_WITH_EVIDENCE` | Management disputes the finding and provides evidence that the finding is incorrect | Management must provide STRONG evidence (ET-01..ET-09; not ET-12/ET-13 WEAK) |

A "non-response" is NOT an option. If management does not respond within the response window, the finding is escalated to CRITICAL and recorded as `RESPONSE_OVERDUE` per `29_open-issues.md`.

## 3. Eight-Field Response Record

| # | Field | Purpose |
|---|---|---|
| 1 | `response_id` | Unique identifier |
| 2 | `finding_ref` | Pointer to the finding (per `23_finding-classification.md`) |
| 3 | `response_option` | ACCEPT / REMEDIATE / MITIGATE / DISPUTE_WITH_EVIDENCE |
| 4 | `response_rationale` | Detailed rationale (text) |
| 5 | `response_evidence_refs` | Array of EvidencePackage references (required for MITIGATE and DISPUTE_WITH_EVIDENCE) |
| 6 | `response_owner` | Manager (must differ from reviewer per K-05) |
| 7 | `response_timestamp` | ISO 8601 UTC (with TSA per K-06) |
| 8 | `response_status` | DRAFT / SUBMITTED / ACKNOWLEDGED / REJECTED / SUPERSEDED |

## 4. Dispute Preservation Rule

> **If management disputes a finding (DISPUTE_WITH_EVIDENCE), the original finding is PRESERVED (not deleted, not modified) and the dispute is recorded as a separate response record.**

This means:
- The reviewer's original finding remains in the findings register with its original severity.
- The reviewer's original evidence remains in the evidence room.
- Management's dispute is recorded as a new response record (per Section 3) with management's counter-evidence.
- The dispute is then resolved through an independent retest (per `25_remediation-retest.md`).
- If the retest supports the reviewer, the finding remains CRITICAL/HIGH/MEDIUM/LOW/OBSERVATION.
- If the retest supports management, the finding is marked `DISPUTE_UPHELD` and superseded — but the original finding remains in the register for audit trail.
- The finding is NEVER deleted; the dispute is NEVER silently resolved.

## 5. Honest-State Markers

- 0 findings issued (per `23_finding-classification.md`).
- 0 management responses received.
- 0 ACCEPT responses.
- 0 REMEDIATE responses.
- 0 MITIGATE responses.
- 0 DISPUTE_WITH_EVIDENCE responses.
- All 4 response options specified.
- All 8 response record fields at state `DESIGNED`.
- Dispute preservation rule enforced.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

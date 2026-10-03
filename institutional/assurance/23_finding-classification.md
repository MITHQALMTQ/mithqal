# Finding Classification — 5-Severity Taxonomy + 12-Field Finding Record

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Finding Classification Identity

| Field | Value |
|---|---|
| **Finding classification ID** | `FC-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Severity taxonomy count** | 5 |
| **Finding record field count** | 12 |
| **Severity manipulation prohibition** | ENFORCED — see Section 4 |
| **Findings issued to date** | 0 |

## 2. Five-Severity Taxonomy

| # | Severity | Definition | Examples |
|---|---|---|---|
| 1 | `CRITICAL` | The system has a control failure that materially compromises assurance objectives; remediation required before any further claim may be made | F0–F5 finality merge violation; OBSERVED/MODELED class merge violation; safe-halt bypass; unauthorized frozen-schema modification |
| 2 | `HIGH` | The system has a control weakness that significantly impairs assurance; remediation required before findings can be closed | Reconciliation mismatch (no fraud); KPI mismatch; policy version rollback; unauthorized change to non-frozen schema |
| 3 | `MEDIUM` | The system has a control gap that may impair assurance; remediation recommended | Missing policy version record; late-arriving evidence; tolerance-class misapplication |
| 4 | `LOW` | The system has a minor issue that does not impair assurance but should be improved | Inconsistent log format; missing optional evidence field |
| 5 | `OBSERVATION` | The reviewer notes something for management awareness; no control failure | Suggestion for efficiency; recommendation for future enhancement |

## 3. Twelve-Field Finding Record

| # | Field | Purpose |
|---|---|---|
| 1 | `finding_id` | Unique identifier |
| 2 | `finding_title` | Short title |
| 3 | `finding_severity` | CRITICAL / HIGH / MEDIUM / LOW / OBSERVATION |
| 4 | `finding_description` | Detailed description |
| 5 | `finding_criteria_refs` | Array of criterion IDs (per `03_assurance-criteria.json`) |
| 6 | `finding_control_refs` | Array of control IDs (per `05_control-library.json`) |
| 7 | `finding_evidence_refs` | Array of EvidencePackage references |
| 8 | `finding_chain` | Backward-trace chain (EVENT → CONTROL → EVIDENCE → KPI → CONCLUSION — per `07_evidence-chain.md`) |
| 9 | `finding_management_response_ref` | Pointer to management response (per `24_management-response.md`) |
| 10 | `finding_remediation_ref` | Pointer to remediation record (per `25_remediation-retest.md`) |
| 11 | `finding_status` | DRAFT / ISSUED / RESPONDED / REMEDIATED / RETESTED / CLOSED |
| 12 | `finding_severity_history` | Array of severity changes (per Section 4) |

## 4. Severity Manipulation Prohibition

> **A finding's severity may NOT be downgraded without a documented management response and an explicit retest.**

Severity manipulation is a CRITICAL violation of the framework. Specifically:

- A reviewer may NOT downgrade a CRITICAL finding to HIGH to make it "look better."
- A reviewer may NOT silently upgrade or downgrade severity to align with management preferences.
- A reviewer may NOT close a finding without an explicit remediation cycle (per `25_remediation-retest.md`).

If the severity of a finding is changed:
- The change is recorded in `finding_severity_history` (field 12).
- The change requires a documented justification.
- The change requires either a management response (for downgrade) or an additional retest (for upgrade).
- The change is auditable (per `08_evidence-integrity.md` K-10).

## 5. Honest-State Markers

- 0 findings issued.
- 0 CRITICAL findings.
- 0 HIGH findings.
- 0 MEDIUM findings.
- 0 LOW findings.
- 0 OBSERVATION findings.
- All 5 severity levels specified.
- All 12 finding record fields at state `DESIGNED`.
- Severity manipulation prohibition enforced.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

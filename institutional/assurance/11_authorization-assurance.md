# Authorization Assurance — 10 Mandatory Scenarios (O-01..O-10)

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Authorization Assurance Identity

| Field | Value |
|---|---|
| **Authorization assurance ID** | `AA-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Mandatory scenario count** | 10 (O-01..O-10) |
| **Outcome states** | 5 (see Section 3) |
| **Canonical Pilot A spec reference** | The 10 scenarios below are derived from the canonical Pilot A specification (per Prompt 70 Section J) |
| **Scenarios executed to date** | 0 |

## 2. Ten Mandatory Scenarios

| # | Scenario ID | Name | Description | Expected result (from canonical Pilot A spec) | Status |
|---|---|---|---|---|---|
| 1 | O-01 | Authorized instruction | An instruction authorized by an authorized actor; policy permits; compliance passes | Authorization decision = AUTHORIZED; event proceeds to funding | DESIGNED |
| 2 | O-02 | Unauthorized actor | An instruction from an actor not in the authorized-actor list | Authorization decision = DENIED_ACTOR; event blocked | DESIGNED |
| 3 | O-03 | Policy denies | An instruction from an authorized actor where policy version 1.0.0 explicitly denies | Authorization decision = DENIED_POLICY; event blocked | DESIGNED |
| 4 | O-04 | Compliance failure | An instruction where the compliance check fails (e.g., AML flag) | Authorization decision = DENIED_COMPLIANCE; event blocked; exception raised | DESIGNED |
| 5 | O-05 | Funding insufficient | An instruction that passes authorization, policy, and compliance but has insufficient funding | Authorization decision = AUTHORIZED but funding_event = INSUFFICIENT_FUNDS; event held | DESIGNED |
| 6 | O-06 | Routing ambiguity | An instruction where routing has multiple valid paths | Authorization decision = AUTHORIZED; routing decision = AMBIGUOUS; human review required | DESIGNED |
| 7 | O-07 | Settlement confirmation timeout | Counterparty confirmation does not arrive within SLA | Settlement_event = TIMEOUT; exception raised; F5 finality NOT achieved | DESIGNED |
| 8 | O-08 | Reconciliation mismatch | Ledger entry does not match counterparty ledger at reconciliation | Reconciliation_event = MISMATCH; exception raised; F2 finality NOT achieved | DESIGNED |
| 9 | O-09 | Safe-halt triggered | An emergency trigger fires during the workflow | Safe-halt invoked; workflow suspended per `17_safe-halt-assurance.md`; no further events processed | DESIGNED |
| 10 | O-10 | Full closure | Instruction → authorization → policy → compliance → funding → routing → settlement → finality → ledger → reconciliation → closure (no exception) | All 19 BM steps complete; closure_event recorded; F0/F1/F2/F5 finality achieved | DESIGNED |

## 3. Five Outcome States

| State | Meaning |
|---|---|
| `AUTHORIZED` | Authorization decision permitted the event to proceed |
| `DENIED_ACTOR` | Authorization decision blocked the event because the actor was not authorized |
| `DENIED_POLICY` | Authorization decision blocked the event because the policy denied it |
| `DENIED_COMPLIANCE` | Authorization decision blocked the event because the compliance check failed |
| `HELD_INSUFFICIENT_FUNDS` | Authorization permitted; downstream funding check held the event (not denied, but not proceeding) |

A scenario may NOT produce an outcome that is none of these five. A scenario may NOT merge `AUTHORIZED` with any `DENIED_*` state.

## 4. Expected Results from Canonical Pilot A Spec

The expected results in Section 2 are derived from the **canonical Pilot A specification** referenced in Prompt 70 Section J. Pilot A has NOT been executed (per Prompt 74: 0 pilot executions). The expected results are therefore `DESIGNED` expected results — they specify what the system should produce when Pilot A eventually executes.

If the actual execution of Pilot A produces different results:
- The reviewer must record the discrepancy as a finding per `23_finding-classification.md`.
- The reviewer must NOT retroactively edit the expected results to match the actual results (no severity manipulation, no document drift acceptance).

## 5. Honest-State Markers

- 0 scenarios executed.
- 0 authorization decisions observed.
- All 10 scenarios at status `DESIGNED`.
- All 5 outcome states specified; none observed.
- 0 banks; 0 counsel; 0 pilot execution.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

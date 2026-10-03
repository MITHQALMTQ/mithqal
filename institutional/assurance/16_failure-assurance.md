# Failure Assurance — 15 Mandatory Failure Scenarios (F-01..F-15) × 10 Fields

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Failure Assurance Identity

| Field | Value |
|---|---|
| **Failure assurance ID** | `FAS-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Canonical plan** | `AFTP-PA-001` (see `assurance-failure-test-plan.md`) |
| **State** | `DESIGNED` |
| **Failure scenario count** | 15 (F-01..F-15) |
| **Per-scenario field count** | 10 |
| **Failure management status** | NOT_TESTED (no scenarios executed) |
| **Failure scenarios executed to date** | 0 |

## 2. Per-Scenario 10 Fields

Each failure scenario must be specified with these 10 fields:

| # | Field | Purpose |
|---|---|---|
| 1 | `scenario_id` | F-01..F-15 |
| 2 | `scenario_name` | Short name |
| 3 | `failure_trigger` | What triggers the failure |
| 4 | `expected_detection` | How the system should detect the failure |
| 5 | `expected_response` | How the system should respond (auto-recovery, safe-halt, alert) |
| 6 | `expected_evidence` | What evidence should be produced (per 13-type taxonomy) |
| 7 | `recovery_procedure` | How recovery should be performed |
| 8 | `replay_target` | Which reproducibility target (L-01..L-08) verifies recovery |
| 9 | `test_method` | How to actually induce the failure for testing |
| 10 | `status` | DESIGNED / EXECUTED / NOT_TESTED |

## 3. Fifteen Mandatory Failure Scenarios

| # | Scenario ID | Name | Failure trigger | Expected detection | Expected response | Expected evidence | Recovery procedure | Replay target | Test method | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | F-01 | Authorization service unavailable | Auth service down | Health check | Safe-halt (per `17_safe-halt-assurance.md`); alert | ET-01 + ET-07 | Restart auth service; verify post-restart | L-01 | Stop auth service; observe response | DESIGNED |
| 2 | F-02 | Policy registry unavailable | Policy DB unreachable | Health check | Safe-halt; alert | ET-01 + ET-06 | Restart policy DB; verify | L-02 | Stop policy DB; observe | DESIGNED |
| 3 | F-03 | Compliance service timeout | Compliance check > SLA | Timeout | Block event; exception raised | ET-01 + ET-07 | Investigate; re-run compliance | L-03 | Inject delay; observe | DESIGNED |
| 4 | F-04 | Funding source insufficient | Funding < required | Funding check | Hold event; alert | ET-01 + ET-07 | Replenish funding; re-run | L-01 | Reduce funding; observe | DESIGNED |
| 5 | F-05 | Routing ambiguity | Multiple valid paths | Routing engine | Hold event; human review | ET-01 + ET-07 | Resolve ambiguity; re-route | L-04 | Inject ambiguity; observe | DESIGNED |
| 6 | F-06 | Settlement confirmation timeout | Counterparty silent | Timeout | Exception raised; F5 NOT achieved | ET-01 + ET-07 | Re-contact counterparty; re-attempt | L-05 | Withhold confirmation; observe | DESIGNED |
| 7 | F-07 | Reconciliation mismatch | Local ≠ counterparty ledger | Recon run | Exception raised; F2 NOT achieved | ET-03 + ET-07 | Investigate; correct; re-recon | L-08 | Inject ledger drift; observe | DESIGNED |
| 8 | F-08 | Ledger posting failure | DB write fails | DB error | Retry; safe-halt if persistent | ET-01 + ET-07 | Restart DB; re-post | L-07 | Stop DB; observe | DESIGNED |
| 9 | F-09 | Safe-halt trigger fires | Emergency trigger | Safe-halt module | Workflow suspended; no further events | ET-01 + ET-07 | Resolve emergency; resume | L-01..L-08 | Fire trigger; observe | DESIGNED |
| 10 | F-10 | Cryptographic receipt missing | Counterparty receipt absent | Settlement | F5 NOT achieved; exception raised | ET-04 + ET-07 | Re-request receipt; verify | L-05 | Withhold receipt; observe | DESIGNED |
| 11 | F-11 | Hash mismatch on read | Tamper detection (K-03) | Integrity check | Block read; safe-halt; alert | ET-01 + integrity log | Restore from backup; investigate | L-07 | Tamper with record; observe | DESIGNED |
| 12 | F-12 | Policy version rollback | Active policy reverted | Policy version check | Block event; alert | ET-06 + ET-07 | Investigate; restore correct version | L-02 | Roll back version; observe | DESIGNED |
| 13 | F-13 | Replay mismatch | Replay differs from original | Replay tool | CRITICAL finding (per `23_finding-classification.md`) | ET-09 + ET-07 | Investigate root cause; remediate | L-01..L-08 | Run replay; observe | DESIGNED |
| 14 | F-14 | Closure unauthorized | Closure attempted without authorization | Authorization check | Block closure; alert | ET-01 + ET-07 | Investigate; correct authorization; retry | L-01 | Attempt unauthorized closure; observe | DESIGNED |
| 15 | F-15 | Audit-trail seal failure | Closure seal fails | Seal verification | Retry; safe-halt if persistent | ET-01 + ET-07 | Investigate; re-seal | L-07 | Induce seal failure; observe | DESIGNED |

## 4. Failure Management Status

| Status | Meaning | This framework |
|---|---|---|
| `TESTED` | All 15 scenarios have been executed and pass | NOT_TESTED |
| `PARTIALLY_TESTED` | Some scenarios executed | NOT_TESTED |
| `NOT_TESTED` | No scenarios executed | **THIS** |
| `FAILED` | At least one scenario failed | NOT_TESTED |

The failure management status is `NOT_TESTED`. None of the 15 scenarios has been executed.

## 5. Honest-State Markers

- 0 failure scenarios executed.
- 0 failures induced.
- 0 recovery procedures verified.
- All 15 scenarios at status `DESIGNED`.
- Failure management status: NOT_TESTED.
- 0 banks; 0 counsel; 0 pilot execution.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

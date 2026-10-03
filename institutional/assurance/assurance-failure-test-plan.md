# Assurance Failure Test Plan — AFTP-PA-001

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Failure Test Plan Identity

| Field | Value |
|---|---|
| **Plan ID** | `AFTP-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **Companion file** | `16_failure-assurance.md` |
| **State** | `DESIGNED` |
| **Scenario count** | 15 (F-01..F-15) |
| **Test coverage matrix** | YES — see Section 3 |
| **Failure induction protocol** | YES — see Section 4 |
| **Failure tests executed to date** | 0 |

## 2. Fifteen Failure Scenarios

Per `16_failure-assurance.md` Section 3. All 15 scenarios at status `DESIGNED`. Failure management status: NOT_TESTED.

## 3. Test Coverage Matrix

| Scenario ID | Required fields | Required tests | Required evidence | Status |
|---|---|---|---|---|
| F-01..F-15 | 10 per scenario (per `16_failure-assurance.md` Section 2) | Per scenario | ET-01 + ET-07 (most); ET-04 for F-06, F-10; ET-09 for F-13 | All DESIGNED |

The test coverage matrix specifies, for each scenario, which fields must be populated, which tests must be executed, and which evidence types must be produced when the scenario is executed.

## 4. Failure Induction Protocol

The failure induction protocol describes how each failure scenario is induced for testing. The protocol requires:

1. A controlled test environment (separate from production).
2. A test harness that can induce each failure trigger (e.g., stop the auth service for F-01).
3. A monitoring system that captures the system's response.
4. A recovery procedure that restores the system to a known-good state after the test.
5. A replay (per `09_replay-protocol.md`) that verifies the system's response is reproducible.

The failure induction protocol is at state `DESIGNED`. No protocol has been implemented.

## 5. Honest-State Markers

- 0 failure scenarios executed.
- 0 failures induced.
- 0 recovery procedures verified.
- All 15 scenarios at status `DESIGNED`.
- Failure management status: NOT_TESTED.
- Failure induction protocol at state `DESIGNED`.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

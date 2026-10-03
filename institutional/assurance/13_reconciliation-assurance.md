# Reconciliation Assurance — 9-Test Surface (Q-01..Q-09) + 9 Edge Conditions (EC-01..EC-09)

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Reconciliation Assurance Identity

| Field | Value |
|---|---|
| **Reconciliation assurance ID** | `RA-PA-001` |
| **Charter reference** | `AC-PA-001` |
| **State** | `DESIGNED` |
| **Test surface count** | 9 (Q-01..Q-09) |
| **Edge condition count** | 9 (EC-01..EC-09) |
| **Tolerance-class selector** | YES — see Section 4 |
| **Independent recalculation** | REQUIRED — see Section 3 |
| **Reconciliations executed to date** | 0 |

## 2. Nine-Test Surface (Q-01..Q-09)

| # | Test ID | Name | Method | Expected result | Evidence | Status |
|---|---|---|---|---|---|---|
| 1 | Q-01 | Ledger-to-counterparty ledger reconciliation | Recalculate counterparty ledger from settlement events; compare to local ledger | MATCH within tolerance | ET-03 + ET-09 | DESIGNED |
| 2 | Q-02 | Funding-to-settlement reconciliation | Recalculate total funding from authorization events; compare to total settled | MATCH within tolerance | ET-03 + ET-09 | DESIGNED |
| 3 | Q-03 | Policy-version reconciliation | For each event, retrieve the ACTIVE policy version at the event timestamp; compare to the version used by the event | MATCH (same version) | ET-06 + ET-09 | DESIGNED |
| 4 | Q-04 | Compliance-decision reconciliation | Replay compliance check (L-03); compare to recorded decision | MATCH | ET-09 + ET-11 | DESIGNED |
| 5 | Q-05 | Routing-decision reconciliation | Replay routing decision (L-04); compare to recorded decision | MATCH | ET-09 + ET-11 | DESIGNED |
| 6 | Q-06 | Settlement-workflow reconciliation | Replay settlement workflow (L-05); compare to recorded state transitions | MATCH | ET-05 + ET-09 | DESIGNED |
| 7 | Q-07 | Finality-state reconciliation | Verify each event with finality_class F0/F1/F2/F5 has the corresponding finality evidence (ET-07) | 100% correspondence; F3/F4 absent (NOT_CLAIMED) | ET-07 + ET-09 | DESIGNED |
| 8 | Q-08 | Exception closeout reconciliation | Verify every raised exception (BM-16A) has a resolved exception (BM-16B) or an open-issue record | 100% resolution-or-open-issue | ET-01 + ET-12 | DESIGNED |
| 9 | Q-09 | Closure reconciliation | Verify every closed transaction has all 12 trace stages populated | 100% stage coverage | ET-01 + ET-09 | DESIGNED |

## 3. Independent Recalculation

Every reconciliation test must be performed by **independent recalculation**:
- The reviewer must re-derive the expected output from the source events (not from the system's own reconciliation engine).
- If the reviewer's recalculation matches the system's recorded output (within tolerance — Section 4), the result is `MATCH`.
- If not, the result is `MISMATCH` and a finding is issued.
- If the reviewer cannot recalculate (e.g., missing source events), the result is `INSUFFICIENT_EVIDENCE` and a limitation is recorded.

Independent recalculation must NOT use the system's own reconciliation engine as the source of truth. The reviewer's recalculation is the source of truth.

## 4. Nine Edge Conditions (EC-01..EC-09)

| # | Edge ID | Name | Description | Expected behavior | Status |
|---|---|---|---|---|---|
| 1 | EC-01 | Floating-point tolerance | Two reconciliations differ by less than the floating-point tolerance | MATCH (within tolerance) | DESIGNED |
| 2 | EC-02 | Time-zone offset | Counterparty ledger is in a different timezone | Convert to UTC before comparison; MATCH | DESIGNED |
| 3 | EC-03 | Currency conversion | Counterparty ledger is in a different currency | Convert at the event-timestamp FX rate; MATCH within tolerance | DESIGNED |
| 4 | EC-04 | Missing counterparty ledger | Counterparty ledger is unavailable | INSUFFICIENT_EVIDENCE; do NOT mark MATCH | DESIGNED |
| 5 | EC-05 | Partial settlement | Only part of the instruction was settled | Reconcile partial-amount; MATCH within tolerance for the partial amount | DESIGNED |
| 6 | EC-06 | Reversed transaction | A transaction was reversed post-closure | Verify reversal is recorded as a new event (not in-place mutation); MATCH | DESIGNED |
| 7 | EC-07 | Concurrent events | Two events occur at the same timestamp | Use sequence numbers; MATCH if sequence is consistent | DESIGNED |
| 8 | EC-08 | Late-arriving evidence | Evidence arrives after the reconciliation window has closed | Re-open the reconciliation; record the late arrival as a limitation | DESIGNED |
| 9 | EC-09 | Tolerance-class change | The tolerance class for an event type has changed between original execution and replay | Use the tolerance class that was ACTIVE at the original event timestamp (per policy version N-06) | DESIGNED |

## 5. Tolerance-Class Selector

The reconciliation framework uses a tolerance-class selector to choose the appropriate tolerance for each event type. The selector is parameterized by:
- Event type (instruction / authorization / settlement / etc.)
- Currency (for FX tolerance)
- Counterparty (for bilateral tolerance)
- Time window (for late-arriving evidence)

Tolerance classes:
| Class | Tolerance | Use case |
|---|---|---|
| TC-1 | Exact (hash-equal) | Ledger entries; policy versions |
| TC-2 | Floating-point epsilon (1e-9) | Quantitative reconciliations |
| TC-3 | FX tolerance (10 bps) | Cross-currency reconciliations |
| TC-4 | Time-window tolerance (1 second) | Concurrent event reconciliations |

## 6. Honest-State Markers

- 0 reconciliations executed.
- 0 MATCH results.
- 0 MISMATCH results.
- 0 INSUFFICIENT_EVIDENCE results.
- All 9 tests (Q-01..Q-09) at status `DESIGNED`.
- All 9 edge conditions (EC-01..EC-09) at status `DESIGNED`.
- 0 tolerance-class applications.
- Independent recalculation rule enforced.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.

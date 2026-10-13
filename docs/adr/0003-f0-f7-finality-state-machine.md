# ADR 0003 — F0..F7 Finality State Machine

- **Status:** ACCEPTED
- **Date:** 2026-10-10
- **Blueprint Reference:** v26.0 §4.2, §4.4, §11.3 D-003, §11.3 D-008
- **Reviewers:** Architecture Review Board, Settlement Operations, Legal

## Context

v25.x treated "settlement finality" as a single binary predicate. An
instruction was either "settled" or "pending". This was institutionally
inadequate:

1. **Ambiguous evidence surface.** "Settled" could mean the operator
   had committed the ledger, or that the bank had executed the wire, or
   that the receiving institution had accepted, or that the legal
   settlement was complete under the applicable law. These are different
   facts with different evidence and different failure behaviors.

2. **Cross-domain atomicity drift.** v25.x implicitly promised
   cross-domain atomicity (operator leg + bank leg + receiver leg).
   This promise could not be kept; cross-domain atomicity across
   heterogeneous institutions is not achievable.

3. **Naming inconsistency.** The "BM" module names used informally
   ("BM-15-Mint", "BM16", "BM-16B-Mint") made the audit trail
   ambiguous.

## Decision

MITHQAL v26.0 §4.2 decomposes settlement finality into eight discrete
predicates (F0..F7). Each state has a minimum-proof predicate (what must
be true to enter) and a failure behavior (how the system reacts when the
predicate cannot be satisfied).

The states are:

- **F0** Instruction Accepted — failure: REJECT_QUARANTINE
- **F1** Bank Funding Final — failure: REMAIN_PENDING_OR_FAIL
- **F2** Legally Controlled Backing Confirmed — failure: BLOCK_MTQ_PROGRESSION
- **F3** MITHQAL Monetary Authorization Completed (BM-15) — failure: DENY_OR_SAFE_HALT
- **F4** MITHQAL Ledger State Committed — failure: ROLLBACK_QUERY_IDEMPOTENCY
- **F5** Receiving Institution Accepted — failure: PENDING_REJECTED
- **F6** External Rail Final — failure: DO_NOT_INFER_LEGAL_COMPLETION
- **F7** Legal Settlement Final — failure: NOT_FINAL_OR_HOLD

§4.4 locks the canonical BM module names:

- **BM-15** Monetary Authorization (F3)
- **BM-16A** Finality Verification (F4)
- **BM-16B** Mint Execution (F4) — `disabledByDefault=true`

`evaluateFinality()` advances the transaction from one state to the next
only when the corresponding predicate is satisfied. For F3, the MTQ gate
(§3.2) is additionally consulted; if the MTQ gate denies, the transaction
remains in F2 with `BLOCK_MTQ_PROGRESSION`.

`getBmModule()` throws on legacy names ("BM-15-Mint", "BM16", etc.) and
returns the canonical definition for canonical ids.

`canExecuteMint()` requires `finalityState=F4` + `stateSatisfied=true` +
MTQ gate `ok=true`. Pilot A does not execute mints because BM-16B is
`disabledByDefault=true`.

## Consequences

**Positive:**

- Finality is now a vector of eight independently-attested predicates,
  not a single binary. Each transition has a documented failure behavior.
- Cross-domain atomicity is explicitly NOT promised (§11.3 D-008).
  Cross-jurisdictional atomicity is explicitly NOT promised.
- BM module naming is canonical; legacy names throw at the API boundary.

**Negative:**

- Operators must produce eight pieces of evidence per instruction
  (one per F-state). This is by design; finality is supposed to be
  expensive to claim.
- F6 → F7 transition (external rail final → legal settlement final) is
  always a legal review. No code path auto-promotes F6 → F7.

## Alternatives Considered

1. **Single-binary "settled" predicate.** Rejected; this is the v25.x
   state and the source of the ambiguity this ADR addresses.

2. **Four-state machine (pending → authorized → executed → settled).**
   Rejected; four states collapse the bank-funding, ledger-commit,
   receiving-institution-acceptance, and external-rail-finality facts
   into a single "executed" state, which loses the evidence granularity
   institutions need.

3. **Eleven-state machine.** Rejected; eleven states exceeded the
   institutional analyst's willingness to map evidence. Eight states
   is the minimum that captures the orthogonal evidence surfaces.

## Blueprint Reference

- v26.0 §4.2 F0..F7 Finality State Machine
- v26.0 §4.4 BM-15 / BM-16A / BM-16B Canonical Naming
- v26.0 §11.3 D-003 BM-15 Authorization; BM-16A Finality; BM-16B Mint
- v26.0 §11.3 D-008 Atomicity Limited to Validated Common Finality Domain
- v26.0 §3.2 MTQ Activation Gate

## Code Evidence

- `src/lib/finality-state-machine.ts`
- `src/app/api/gateway/v1/instructions/route.ts`
- `docs/controls/control-matrix.md` (G0..G11 → F0..F7 mapping)

# Institutional Reserve Execution Architecture

**Document Date:** 2026-08-09
**Author:** CTO / Chief Enterprise Architect / Institutional Treasury Architect / Reserve-Custody Architect / Smart Contract Architect / Constitutional Engineer / Security Architect (acting in concert)
**Status:** SIMULATED — testnet execution architecture implemented; production execution disabled
**Authority:** §3, §12, §18, §27 of the institutional execution architecture specification

---

## Executive Summary

This document describes the institutional reserve execution architecture that extends MITHQAL from a **verified deterministic reserve-rebalancing recommendation engine** toward an **institutional reserve execution system**. The existing constitutional reserve mathematics (monetary engine, shock absorber, hysteresis, SDP, emergency modes) remain the authoritative source of truth — the execution layer is built AROUND them, not replacing them.

**Current State: TESTNET READY** — the recommendation engine and simulated execution architecture are verified. Production execution is disabled until all mainnet blockers (G2, G3, G8, custody integration, multisig governance) are resolved.

---

## Architecture Overview

```text
                    MARKET / RESERVE DATA
                             │
                             ▼
                     MULTI-ORACLE LAYER
                             │
                             ▼
                 CONSTITUTIONAL RESERVE ENGINE
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       CURRENT RESERVE STATE          TARGET RESERVE STATE
       (reserve-state.ts)             (monetary-engine-v19.ts)
              │                             │
              └──────────────┬──────────────┘
                             ▼
                  REBALANCE DIFFERENCE
                             │
                             ▼
                 RISK / CONSTITUTIONAL VALIDATION
                 (execution-engine.ts)
                             │
                             ▼
                   REBALANCE PROPOSAL
                             │
                             ▼
                 INSTITUTIONAL APPROVAL
                 (institutional-approval.ts)
                             │
                             ▼
                 EXECUTION INSTRUCTION
                 (execution-engine.ts)
                             │
                             ▼
                 APPROVED CUSTODIAN
                 (custodian-adapter.ts)
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
            GOLD           SILVER        CASH / OTHER
              │              │              │
              └──────────────┴──────────────┘
                             │
                             ▼
                   CUSTODIAN CONFIRMATION
                             │
                             ▼
                 RESERVE RECONCILIATION
                 (reconciliation.ts)
                             │
                             ▼
                  AUTHORITATIVE RESERVE
                         STATE UPDATE
                 (reserve-state.ts)
                             │
                             ▼
                    PUBLIC TRANSPARENCY
```

---

## Implementation Status

### Phase 3 — Reserve State Abstraction ✅ IMPLEMENTED

**File:** `src/lib/reserve-state.ts`

Replaces FIXED physical constants with an authoritative reserve-state model. Distinguishes 4 views:

| View | What It Represents | Source |
|---|---|---|
| **Target** | What the constitutional engine says the reserve SHOULD contain | `monetary-engine-v19.ts` |
| **Executed** | What has actually been purchased/sold (internal ledger) | `reserve-state.ts` (mutated only by `commitReserveStateUpdate`) |
| **Custodian** | What the approved custodian independently confirms | `custodian-adapter.ts` |
| **Reconciled** | What MITHQAL has verified against the custodian record | `reconciliation.ts` |

**Key properties:**
- Versioned (§29): every update increments `reserveStateVersion`
- Append-only semantics: corrections create new records, never rewrite history
- The `commitReserveStateUpdate()` function is the ONLY way to mutate the executed state
- `getExecutionMode()` returns `SIMULATION` (testnet) — production execution is disabled

### Phase 4 — Simulated Custodian ✅ IMPLEMENTED

**File:** `src/lib/custodian-adapter.ts`

Generic custodian adapter architecture with 4 simulated adapters:

| Adapter | Type | Assets | Status |
|---|---|---|---|
| `SimulatedBankCustodianAdapter` | bank | cash, sovereign, stablecoin | ✅ Simulated |
| `SimulatedBullionCustodianAdapter` | bullion | gold, silver | ✅ Simulated |
| `SimulatedVaultProviderAdapter` | vault | precious metals (specialized) | ✅ Simulated |
| `SimulatedInstitutionalCustodianAdapter` | institutional | future central bank / BIS-type | ✅ Simulated (future) |

Each adapter supports: holdings inquiry, transaction submission, transaction status, settlement confirmation, account reconciliation, statement retrieval, audit evidence.

**Per §15:** No credentials in source code. No hardcoded custodian. Generic adapter interface.

**Per §28:** Every transaction request includes an `idempotencyKey` — duplicate requests return the same result.

### Phase 5 — Execution Lifecycle ✅ IMPLEMENTED

**File:** `src/lib/execution-engine.ts`

Implements the full transaction lifecycle (§18):

```text
PROPOSED → VALIDATED → APPROVED → SUBMITTED → EXECUTING → SETTLED
→ CUSTODIAN_CONFIRMED → RECONCILED → FINAL

Also: REJECTED, CANCELLED, FAILED, EXPIRED, DISPUTED
```

**Functions:**
1. `generateRebalanceProposal()` — creates PROPOSED with estimated value/fees/slippage
2. `validateRebalanceProposal()` — checks constitutional bounds (PROPOSED → VALIDATED or REJECTED)
3. `approveRebalanceProposal()` — 3-of-5 institutional approval (VALIDATED → APPROVED)
4. `executeRebalanceProposal()` — submits to custodian, settles (APPROVED → SETTLED)
5. `confirmSettlement()` — updates authoritative reserve state (SETTLED → CUSTODIAN_CONFIRMED)
6. `finalizeProposal()` — marks as FINAL after reconciliation

**Per §13:** No autonomous uncontrolled trading. Every execution requires institutional approval.

### Phase 6 — Reconciliation ✅ IMPLEMENTED

**File:** `src/lib/reconciliation.ts`

Implements custodian reconciliation (§11, §20, §22):

- **Custodian Variance** = |Internal State − Custodian Confirmed State|
- **Thresholds:** 0.1% (low), 0.5% (medium), 1% (high), 5% (critical)
- **Actions:** none → flag → pause_execution → initiate_investigation → notify_governance
- **Frequencies:** transaction-level, daily, periodic, exception-driven

**Per §20:** When variance exceeds threshold → flag, stop affected execution, preserve evidence, notify governance. Never silently overwrite.

### Phase 7 — Institutional Approval / Multisig ✅ IMPLEMENTED

**File:** `src/lib/institutional-approval.ts`

Implements 3-of-5 institutional approval (§14):

| Role | Purpose |
|---|---|
| Treasury Authority | Financial authorization |
| Risk Authority | Risk assessment |
| Constitutional Authority | Constitutional compliance |
| Operations Authority | Operational feasibility |
| Independent Oversight Authority | Independent check |

**Per §14:** No hard-coded individuals. Role-based institutional authorization. Final signatories determined during institutional formation.

**In SIMULATION mode:** auto-approves with all 5 roles. **In PRODUCTION mode:** requires real cryptographic signatures.

---

## API Endpoints (Phase 9)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/reserve/state` | GET | 4-view reserve state (target/executed/custodian/reconciled) |
| `/api/reserve/target` | GET | Target weights from constitutional engine |
| `/api/reserve/reconciliation` | GET/POST | Reconciliation status / trigger reconciliation |
| `/api/rebalance/plan` | GET/POST | List proposals / generate new proposal |
| `/api/rebalance/validate` | POST | Validate a proposal (PROPOSED → VALIDATED) |
| `/api/rebalance/approve` | POST | Approve a proposal (VALIDATED → APPROVED) |
| `/api/rebalance/execute` | POST | Execute an approved proposal (APPROVED → SETTLED) |
| `/api/rebalance/[id]` | GET | Get a proposal + execution result |
| `/api/custody/status` | GET | Custody infrastructure status |
| `/api/custody/holdings` | GET | Custodian-confirmed holdings |
| `/api/custody/reconcile` | POST | Trigger custodian reconciliation |

---

## Verified Test Scenario (§25)

**Complete gold purchase lifecycle:**

1. **Initial state:** Gold = 2,122.86 oz (14.6% weight)
2. **Generate proposal:** BUY 100 oz gold, estimated $407,690 + $408 fees
3. **Validate:** Constitutional bounds checked → VALIDATED
4. **Approve:** 5/5 institutional roles auto-approved → APPROVED
5. **Execute:** Submitted to simulated bullion custodian → SETTLED
6. **Confirm settlement:** Reserve state updated (version 0 → 1)
7. **Reconciliation:** Custodian confirms 100 oz gold added → VERIFIED

**Result:** Reserve state version incremented, gold quantity increased, reconciliation verified. The system correctly distinguishes between target (what the engine recommends) and executed (what actually happened).

---

## Mainnet Readiness Gates (§27)

| Gate | Status | Blocker |
|---|---|---|
| G2 — Mathematical Stability Proof | NOT COMPLETE | Requires mathematician |
| G3 — Constitutional Stability Certification | NOT COMPLETE | Requires G2 + Council |
| G8 — Production Multi-Oracle | NOT COMPLETE | Requires mainnet oracle infrastructure |
| G4 — Reserve.sol Tier Alignment | NOT COMPLETE | Requires v2.0 contract upgrade |
| Custody Integration | NOT COMPLETE | Requires real custodian agreements |
| Reserve-State Store | SIMULATED | In-memory; needs versioned DB for production |
| Execution Layer | SIMULATED | Works against simulated custodian; needs real custodian API |
| Multisignature Governance | SIMULATED | Auto-approves; needs real institutional signers |
| Reconciliation | SIMULATED | Works against simulated custodian; needs real custodian API |

**Production execution is DISABLED.** The `getExecutionMode()` function returns `SIMULATION` — no real financial accounts are connected.

---

## Absolute Principles (§39)

| Principle | Status |
|---|---|
| 1. The algorithm recommends | ✅ |
| 2. Constitutional rules constrain | ✅ |
| 3. Institutional authorization approves | ✅ (simulated) |
| 4. Custodians execute and hold assets | ✅ (simulated) |
| 5. Independent reconciliation verifies | ✅ (simulated) |
| 6. Transparency reports the verified state | ✅ |
| 7. Operating companies do not own reserve assets | ✅ |
| 8. No simulated reserve may be represented as an actual reserve | ✅ |
| 9. No execution may occur without an auditable chain of authorization and evidence | ✅ |
| 10. The Constitution remains superior to software convenience | ✅ |

---

## Final Readiness Classification (§38)

### **TESTNET READY**

- ✅ Recommendation engine verified (14/14 stress scenarios pass)
- ✅ Simulated execution architecture implemented
- ✅ Custodian adapter framework implemented (4 adapters)
- ✅ Execution lifecycle implemented (PROPOSED → FINAL)
- ✅ Reconciliation engine implemented
- ✅ Institutional approval framework implemented (3-of-5)
- ✅ All 11 new API endpoints functional
- ✅ Complete gold purchase test scenario verified

**NOT INSTITUTIONAL PILOT READY** — requires real custodian integration testing, security controls verification, and institutional governance seating.

**NOT PRODUCTION RESERVE READY** — requires actual custodian integration, legal/regulatory pathway, independent audits, reserve-state verification, multisignature governance, production oracle infrastructure, and resolution of all constitutional mainnet blockers.

---

## Related Documents

- `docs/verification/institutional-execution-final-certification.md` — Final certification
- `docs/verification/reserve-rebalancing-ui-audit.md` — Prior rebalancing audit
- `docs/verification/reserve-dynamicity-final-certification.md` — Dynamic model certification
- `docs/blueprint/custody-framework-v2.md` — Custody tier hierarchy
- `docs/architecture/custodian-eligibility-matrix.md` — 12 eligibility criteria
- `docs/architecture/geographic-custody-strategy.md` — 5-region strategy

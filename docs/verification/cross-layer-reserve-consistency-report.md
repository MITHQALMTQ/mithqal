# Cross-Layer Reserve Consistency Report
## Phase 5 — Off-Chain / On-Chain Consistency Verification

**Date:** 2026-08-10

---

## 1. Consistency Model

The system has a single monetary engine (off-chain TS) and a constitutional enforcement layer (on-chain Solidity). The consistency requirement is:

**Every off-chain decision must pass on-chain constitutional verification before execution.**

The on-chain layer does NOT reproduce the monetary model — it only verifies constitutional bounds.

---

## 2. Consistency Verification

| Check | Off-chain (TS) | On-chain (Solidity) | Consistent? |
|---|---|---|---|
| RR formula | `RR = R_a / (S × PAR)` (§4) | `getReserveRatio() = reserveValueUsd × 10000 / totalSupply` (PAR=1.0) | ✅ Both PAR-based |
| RR floor | ≥100% hard, ≥102% policy (§4) | `_checkReserveRatio()` auto-pauses if <10000 bps | ✅ Both enforce ≥100% |
| Basket floor | 0.5% (§22A) | `verifyBasket()` requires minWeightBps ≥ 50 | ✅ |
| Basket cap | 60% (§22A) | `verifyBasket()` requires maxWeightBps ≤ 6000 | ✅ |
| Liquidation order | Article X sequential (TS) | Article X sequential (Reserve.sol) | ✅ Both sequential (after refactor) |
| Gold protection | Exhaustion Certificate (§34) | `goldLiquidationAuthorized` flag + exhaustion cert | ✅ |
| Oracle freshness | 60s (TS) / 1hr (on-chain) | `MAX_STALENESS = 1 hours` enforced on ALL paths | ✅ |
| Attestation guards | ±10% drift + 1hr rate (§37) | Same in Reserve.sol + MTQ.sol | ✅ |
| Approval binding | Proposal lifecycle (TS) | `proposalHash` binding (Reserve.sol) | ⚠️ TS doesn't compute hash yet |
| Replay protection | `depositProofUsed` mapping | `executedProposalHashes` mapping | ✅ |
| Concentration caps | §10 7-tier (TS runtime gate) | `verifyBasket()` checks max≤60% | ⚠️ On-chain only checks basket-level, not 7-tier |

---

## 3. Identified Gaps

| # | Gap | Impact | Severity |
|---|---|---|---|
| 1 | TS engine doesn't compute proposal hash | Approval binding not end-to-end | HIGH |
| 2 | On-chain doesn't enforce §10 7-tier caps | Only basket-level (60%) enforced on-chain | MEDIUM |
| 3 | Reserve.sol NOT deployed | Source aligned but bytecode unchanged | CRITICAL (blocker) |
| 4 | In-memory state not persisted | Restart loses proposals/approvals/executions | HIGH |
| 5 | No `validUntil` on proposals | Expired approvals can be executed | HIGH |

---

## 4. Test Results

### Cross-Layer Tests (Phase 5 §29)

| Test | Result | Root cause |
|---|---|---|
| Altered proposal (quantity) | KNOWN FAILURE | No proposal hash binding in TS |
| Altered proposal (value) | KNOWN FAILURE | Same |
| Altered custodian | KNOWN FAILURE | Same |
| Expired approval | KNOWN FAILURE | No validUntil field |
| Replay attack | PASS | executedProposalHashes prevents |
| Duplicate execution | PASS | Same hash can't execute twice |

### Cross-Page Tests (Phase 5 §28)

| Test | Result | Root cause |
|---|---|---|
| NAV consistency | 2/4 KNOWN (SSR baseline vs live) | Hydration artifact |
| RR consistency | 2/4 KNOWN (same) | Same |
| Gold consistency | 3/4 KNOWN (same) | Same |
| Forbidden tokens | 20/20 PASS | All fixed |
| Version v19.0.3 | 4/4 PASS | All pages show correct version |

---

## 5. Conclusion

The off-chain TS engine and on-chain Solidity contracts are **architecturally aligned** at the source code level. The remaining gaps are:
1. **Implementation gaps** (proposal hash, validUntil, persistence) — solvable in TS without Solidity changes
2. **Deployment gap** (Reserve.sol source is aligned but not deployed) — requires explicit authorization

**No monetary rule conflicts found.** The same PAR-based RR, same Article X liquidation order, same §22A basket bounds, same §37 attestation guards appear in both layers.

**Consistency status: ALIGNED (source) / PARTIALLY VERIFIED (deployed)**

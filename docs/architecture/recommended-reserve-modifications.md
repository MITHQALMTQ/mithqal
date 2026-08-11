# Recommended Reserve Modifications
## Evidence-Based Recommendations Only

**Date:** 2026-08-10
**Rule:** Only recommend changes where the evidence justifies it. No cosmetic changes.

---

## 1. Fix Mint.sol/Algorithm.sol Tier Model (P0)

**Existing rule:** Reserve.sol uses 4 constitutional tiers (1=cash, 2=sovereign, 3=gold, 4=stablecoin, 5=silver).
**Problem:** Mint.sol (line 141) and Algorithm.sol (line 138) still use legacy 3-tier model (1=gold/silver, 2=cash, 3=sukuk). A cash deposit via Mint.sol credits sovereign; a "sukuk" deposit credits gold.
**Evidence:** `Mint.sol:141 require(tier >= 1 && tier <= 3)` vs `Reserve.sol:126-140` expects tier 1-5.
**Proposed modification:** Update Mint.sol and Algorithm.sol to accept tiers 1-5 matching Reserve.sol.
**Expected benefit:** Correct tier crediting on all mint operations.
**New risk:** Breaking change — requires contract redeployment + migration.
**Blueprint compatibility:** ✅ Aligns with constitutional 4-tier model.
**Governance approval required:** Yes (contract redeployment).

---

## 2. Fix Mint.sol Default Fee (P0)

**Existing rule:** Mint fee = 0.05% (5 bps) per §9/USER_FEES_SPEC.
**Problem:** Mint.sol:57 sets `mintFeeBps = 10` (0.10%), 2× the spec.
**Evidence:** `Mint.sol:57` vs `reserve-policy-spec.ts:544 MINT_RATE: 0.0005` and `monetary-engine-v19.ts:880 MINT_FEE_BPS = 5`.
**Proposed modification:** Change `mintFeeBps = 10` to `mintFeeBps = 5`.
**Expected benefit:** Correct fee charged to users.
**New risk:** None.
**Blueprint compatibility:** ✅ Aligns with §9 fee schedule.
**Governance approval required:** No (bug fix).

---

## 3. Fix Algorithm.sol:146 Logical Bug (P0)

**Existing rule:** Settlement should verify the deposit is covered by reserves.
**Problem:** `Algorithm.sol:146` checks `reserve.getReserveBalance() < reserveDepositedUsd` — this REJECTS any deposit larger than the current balance (which is 0 on fresh deployment). Settlement is impossible without pre-existing balance.
**Evidence:** `Algorithm.sol:146 require(reserve.getReserveBalance() >= reserveDepositedUsd)` — the deposit hasn't been recorded yet, so this always fails for large deposits.
**Proposed modification:** Remove this check or move it after `reserve.depositReserve()`.
**Expected benefit:** Settlement works on fresh deployment.
**New risk:** None (the 1:1 deposit-vs-mint check at line 145 is the real protection).
**Blueprint compatibility:** ✅ Bug fix.
**Governance approval required:** No.

---

## 4. Add API Authentication to Rebalance Routes (P0)

**Existing rule:** §29.2 requires institutional approval (2/3/4/5-of-5 by severity).
**Problem:** All `/api/rebalance/*` routes are unauthenticated. Anyone can POST approvals. The `constitutionalCouncilFlag` is a boolean the caller asserts — no signature verification.
**Evidence:** No `getServerSession` or auth check in any rebalance route.
**Proposed modification:** Add NextAuth session verification + role-based access control to all rebalance routes.
**Expected benefit:** Only authorized institutional roles can approve/execute.
**New risk:** None (adds security, doesn't remove).
**Blueprint compatibility:** ✅ Aligns with §29.2 institutional governance.
**Governance approval required:** No (security fix).

---

## 5. Add validUntil to RebalanceProposal (P1)

**Existing rule:** §29.2 implies approvals should have a validity window.
**Problem:** `RebalanceProposal` has no `validUntil` field. An approved proposal stays APPROVED forever and can be executed at any time.
**Evidence:** `execution-engine.ts:97-100` — no `validUntil` or `expiresAt` field.
**Proposed modification:** Add `validUntilMs: number` field; reject execution when `asOfTimestamp > createdAt + validUntilMs` (default 7 days).
**Expected benefit:** Expired approvals cannot be executed.
**New risk:** Legitimate delayed executions would be rejected — mitigated by setting a generous default (7 days).
**Blueprint compatibility:** ✅ Aligns with §29.2 institutional governance.
**Governance approval required:** No.

---

## 6. Persist In-Memory State to Turso DB (P1)

**Existing rule:** §29.10 requires an immutable audit trail that survives restart.
**Problem:** `reserveStateStore`, `proposals`, `executionResults`, `turnoverRecords`, `moduleHysteresisState` are all in-memory. Lost on restart.
**Evidence:** `reserve-state.ts:126` (module-level singleton), `execution-engine.ts:205-206` (module-level Maps).
**Proposed modification:** Persist all state to Turso DB on every commit. Replay the §29.10 audit ledger on boot to reconstruct state.
**Expected benefit:** State survives restart; turnover cap doesn't reset; hysteresis state preserved.
**New risk:** Performance impact (DB writes on every state change) — mitigated by async writes.
**Blueprint compatibility:** ✅ Aligns with §29.10 institutional auditability.
**Governance approval required:** No.

---

## 7. Wire Multi-Oracle Consensus to Live Path (P1)

**Existing rule:** §31 specifies 8 oracle families with ≥5/8 consensus.
**Problem:** `oracleConsensus()` is spec-echo only (called from `/api/infrastructure` with synthetic data). The live NAV path uses `getLiveOracleData()` which fetches from a single free API (gold-api.com).
**Evidence:** `live-oracle.ts:169` fetches `https://api.gold-api.com/price/XAU` with silent fallback to $4050.
**Proposed modification:** Wire `oracleConsensus()` to the live NAV path. Add at least 3 independent sources (Chainlink, Pyth, gold-api.com) with quorum + outlier detection.
**Expected benefit:** Manipulation resistance; no single point of failure.
**New risk:** Latency increase (quorum requires multiple fetches).
**Blueprint compatibility:** ✅ Aligns with §31 multi-oracle architecture.
**Governance approval required:** No (but mainnet deployment requires it).

---

## 8. Replace §39 HMAC Simulation with HSM (P1)

**Existing rule:** §39 specifies HSM-backed cryptographic framework.
**Problem:** `sign()` uses HMAC-SHA256 keyed by `keyId` which is public. Signatures are forgeable.
**Evidence:** `v19-infrastructure.ts:4412` generates `keyId` with `Math.random()`, then uses it as HMAC key at `:4504`.
**Proposed modification:** Replace with real HSM-backed signing (AWS KMS, Azure Key Vault, or on-prem HSM). Use asymmetric signatures (ECDSA or Falcon-512 for post-quantum).
**Expected benefit:** Non-forgeable signatures; institutional-grade cryptography.
**New risk:** HSM dependency (new infrastructure component).
**Blueprint compatibility:** ✅ Aligns with §39 cryptographic framework.
**Governance approval required:** Yes (new infrastructure).

---

## 9. Fix LCR HQLA Formula (P2)

**Existing rule:** §5 LCR = HQLA / net outflows. HQLA should be L1+L2 sum.
**Problem:** Code uses `HQLA = totalReserve × 0.60` (a simplified proxy). Textbook formula gives 8.31 vs code's 6.31.
**Evidence:** `nav-compute.ts:219 hqla = totalReserve * 0.60`.
**Proposed modification:** Replace with `HQLA = cash + sovereign×0.98 + stablecoin×0.98` (applying §6 haircuts).
**Expected benefit:** Accurate LCR reporting (~32% higher than current).
**New risk:** None (more accurate, not less safe).
**Blueprint compatibility:** ✅ Aligns with §5 + §6.
**Governance approval required:** No.

---

## 10. Tighten Hysteresis Band for Gold/Silver (P3 — Research)

**Existing rule:** §22B hysteresis band = 2pp.
**Problem:** A 13% gold move is needed to exceed the 2pp band (because gold is 80% of bullion and bullion is 20% of reserves). Small but sustained moves go uncorrected.
**Evidence:** Mathematical audit Test 12 — +0.5% ×10 cycles (cumulative +5.1%) produces 0 trades.
**Proposed modification:** Add a "cumulative drift over T cycles" check as a supplement to the per-cycle hysteresis band. E.g., if cumulative drift >5% over 10 cycles, trigger rebalance even if no single cycle exceeded 2pp.
**Expected benefit:** Catches sustained slow drift that the per-cycle band misses.
**New risk:** More frequent rebalancing (but still bounded by turnover cap).
**Blueprint compatibility:** ⚠️ Not explicitly in blueprint — this is an enhancement.
**Governance approval required:** Yes (policy change).

---

## Blueprint Changes Required

**NONE.** All 10 recommendations are implementation fixes or enhancements that align with the existing blueprint. No blueprint rule needs to be changed. The blueprint is sound; the implementation has gaps.

---

## Summary

| Priority | Count | Type |
|---|---|---|
| P0 (before any institutional use) | 4 | Bug fixes + security |
| P1 (before pilot) | 4 | Infrastructure + persistence |
| P2 (before mainnet) | 1 | Accuracy improvement |
| P3 (future research) | 1 | Enhancement |
| **Total** | **10** | **0 blueprint changes** |

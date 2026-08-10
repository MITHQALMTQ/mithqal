# MITHQAL — Reserve Architecture Canonical Audit (Phase 1)

**Date:** 2026-08-10
**Auditors:** Chief Monetary Architect · Chief Risk Officer · Chief Systems Architect · Reserve Management Expert · Institutional Governance Auditor · Tokenomics Expert
**Mode:** **READ-ONLY — NO CODE CHANGES**
**Scope:** Current repository (commit `777118e`) against the LATEST MITHQAL BLUEPRINT (v19.0.3 addendum + v18 base + constitutional-change-log + custody-framework-v2)

---

## Executive Summary

This audit compares the **canonical blueprint requirements** against the **actual implementation** (TypeScript engine + Solidity contracts) across 30 reserve-architecture areas, the rebalancing taxonomy (A–L), dynamic-reserves behavior, gold/silver φ_t mechanics, the 7 institutional holding states, and the fixed-constants classification.

**Headline findings:**

1. **The monetary ENGINE (TS) is substantially blueprint-compliant.** 9 rebalance triggers, PAR-based RR, dynamic allocation, shock absorber, hysteresis, §29.5 fees, cross-asset value conservation, §37 attestReserves guards — all implemented and wired.

2. **The §29 engine is NOT plumbed into the live rebalance API path.** `/api/rebalance/plan` takes raw `{actions:[...]}` and never invokes `detectRebalanceTriggers`. The §29-validated path is reachable in code but **unexercised by the live route**. This is the single most consequential gap.

3. **The on-chain tier model CONTRADICTS the constitutional 4-tier model.** Reserve.sol uses 3 tiers (1=gold/silver, 2=cash, 3=sukuk) vs the blueprint's 4 tiers (1=cash, 2=sovereign, 3=bullion, 4=stablecoins). Documented as F-HIGH-3, deferred to "v2.0 upgrade."

4. **§34 Bullion Preservation (liquidation order) is NOT enforced on-chain.** Redeem.sol's header claims `Reserve.withdrawReserve()` honors "stablecoins → cash → sovereign → silver → gold (LAST)" — but it actually does **pro-rata** withdrawal. Bullion is liquidated proportionally, not last. This breaks Invariant 5 on-chain.

5. **The 7 institutional holding states are CONFLATED at initialization.** TARGET, ACTUAL, CUSTODIAN, RECONCILED all populate from the same `assets[]` array in `initializeReserveState()`. They only diverge after lifecycle mutations — meaning at rest (and after a restart) all four views are identical, which masks reconciliation gaps.

6. **Fixed constants (`FIXED_GOLD_OZ`, `FIXED_SILVER_OZ`, `FIXED_CASH_USD`) are canonical v19.0.2 §19.2 baseline VALUES wrapped in a SIMULATION/TESTNET rigidity.** The values ($29M cash, 2,122.86 oz gold, 36,758 oz silver) ARE the canonical production baseline. The `FIXED_` prefix is technical debt — mainnet should derive from `computeDynamicReserveAllocation()` responding to live oracles, RR, and volatility.

7. **Comment drift hazard:** 5 files have comments claiming `$29,250,000` or `$32,450,000` cash while the actual constant is `$29,000,000`. Runtime is correct; comments mislead reviewers.

---

## Part I — 30 Audit Areas

For each area: **Blueprint requirement** | **Current implementation** | **Alignment status** | **Contradiction** | **Risk** | **Recommended modification** | **Required vs enhancement**

---

### 1. Reserve composition

**Blueprint requirement:** 4-tier constitutional structure (v18 Part 2 Article III): Tier 1 Cash 25-60% (policy 40%), Tier 2 Sovereign 20-50% (policy 35%), Tier 3 Bullion 10-30% (policy 20%), Tier 4 Stablecoins 0-10% (policy 5%). Principal Reserve = Tiers 1+2+3. v19 addendum §19.5 Req 2 collapses to 3 operational categories: fiat 70-80%, bullion 15-25%, stablecoin 2-8%, adjusted by RR + gold volatility.

**Current implementation:** TS (reserve-allocation.ts:60-74) implements the 3-category dynamic allocation: `fiat` 0.70-0.80, `bullion` 0.15-0.25, `stablecoin` 0.02-0.08. Fiat sub-split: cash 0.667 + sovereign 0.333. Wired into `/api/transparency` and `/api/reserve/status`. On-chain (Reserve.sol): 3 tiers (1=gold/silver, 2=cash, 3=sukuk) — **CONTRADICTS** the 4-tier constitutional model.

**Alignment status:** TS ✅ ALIGNED (3-category operational view). On-chain ❌ MISALIGNED (3-tier vs 4-tier, different tier meanings).

**Contradiction:** Reserve.sol tier 1 = gold/silver; constitutional tier 3 = bullion. Reserve.sol tier 2 = cash; constitutional tier 1 = cash. Reserve.sol tier 3 = sukuk; constitutional tier 2 = sovereign. No Tier 4 (stablecoins) on-chain.

**Risk:** HIGH. On-chain reserve accounting doesn't match the constitutional taxonomy. Pro-rata withdrawal across wrong tiers could liquidate bullion when cash should be drawn first.

**Recommended modification:** Refactor Reserve.sol to 4-tier model matching the constitution. Deferred to v2.0 per existing F-HIGH-3 note.

**Required vs enhancement:** Blueprint-required (constitutional tier structure).

---

### 2. Currency basket

**Blueprint requirement:** v19 addendum §19.5.2: 10 currencies on the §36 mint route — 8 sovereign (USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD) + XAU (gold oz) + XAG (silver oz). The Constitution itself names no currencies (v18 Part 2 Article V §1).

**Current implementation:** TS (oracle-data.ts:66-75): 8 basket currencies with COFER/SWIFT/BIS/LTA weights. nav-compute.ts:265-268: `SUPPORTED_CURRENCIES` = 10 (8 + XAU + XAG). `/api/redeem` validates against `isSupportedCurrency`.

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW.

**Recommended modification:** None.

---

### 3. Gold allocation

**Blueprint requirement:** v18 Part 2 Article IV: gold = 60-95% of bullion (constitutional), 75-85% (policy target). v19 addendum §19.5 Req 6: dynamic φ_t target 75-85% based on volatility. Bullion = 15-25% of total reserves.

**Current implementation:** TS (reserve-allocation.ts:80-95): `BULLION_GOLD_BAND = {min:0.60, max:0.95}`, `BULLION_GOLD_POLICY_TARGET = 0.80`. Dynamic adjustment: gold EWMA vol >3% → φ_t=0.75; <0.5% → φ_t=0.85; else 0.80. Physical quantity FIXED at `FIXED_GOLD_OZ = 2_122.86` oz. Dollar value = qty × live price.

**Alignment status:** ✅ ALIGNED (target weight dynamic; physical quantity fixed per §19.2 baseline).

**Risk:** MEDIUM. Physical quantity is fixed — real production would need to reflect actual custodian holdings, not a constant.

**Recommended modification:** Replace `FIXED_GOLD_OZ` with a custodian-confirmed holding read for mainnet. Enhancement, not blueprint-required (the baseline value is canonical).

---

### 4. Silver allocation

**Blueprint requirement:** v18 Part 2 Article IV: silver = 5-40% of bullion (constitutional), 15-25% (policy). Complement of gold (1 − φ_t).

**Current implementation:** TS (reserve-allocation.ts:95, 226-253): `silverShare = 1 − goldShare`, clamped to [0.05, 0.40]. Physical `FIXED_SILVER_OZ = 36_758` oz.

**Alignment status:** ✅ ALIGNED.

**Risk:** MEDIUM (same as gold — fixed physical quantity).

**Recommended modification:** Same as gold — read from custodian for mainnet.

---

### 5. Gold/Silver ratio φ_t (§25.2)

**Blueprint requirement:** φ_t = gold's share of bullion. Band [60%, 95%]. Dynamic target 75-85% based on volatility. `bullion_band` trigger fires when outside band.

**Current implementation:** TS (reserve-allocation.ts:138-140, 225-253; v19-infrastructure.ts:2674-2698): φ_t default 0.80, adjusts to 0.75/0.85 by gold EWMA vol. Band [0.60, 0.95]. `bullion_band` trigger: severity "high" if outside band, "medium" if within 2pp of edge. Wired into `generateCrossAssetRebalancePlan`.

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW.

---

### 6. Dynamic reserve weights (§23-27)

**Blueprint requirement:** v19 addendum §19.5 Req 2: `computeDynamicReserveAllocation()` — fiat 70-80%, bullion 15-25%, stablecoin 2-8%, adjusted by reserve ratio + gold volatility.

**Current implementation:** TS (reserve-allocation.ts:191-373): RR adjustment (RR>110% → +2% bullion; RR<102% → +2% fiat) + volatility adjustment (gold EWMA drives φ_t) + clamp to LAYER_RANGES + normalize to Σ=1.0. Consumed by transparency + reserve-status + stress.

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW.

---

### 7. Currency-strength adjustment (§13/§16)

**Blueprint requirement:** §13 structural weight = COFER 50% + SWIFT 40% + BIS 10%. §16 bounded momentum ±5% cap. Mean reversion toward LTA.

**Current implementation:** TS (monetary-engine-v19.ts:309-387): `ALPHA=0.50, BETA=0.40, GAMMA=0.10`. `rawMomentum`, `clampMomentum` to [0.95, 1.05], `meanReversionFactor = 1 + η×(LTA − C)`, `clampMeanReversion` to [0.98, 1.02]. Combined via `shockAdjustedFactor`.

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW.

---

### 8. Reserve-ratio adjustment (§4)

**Blueprint requirement:** v19.0.2 §19.1: `RR = R_a / (S × PAR)`, PAR=$1.00. Policy target ≥102%, hard invariant ≥100%. RR affects allocation (§19.2: rebalance toward ≥102% target).

**Current implementation:** TS (monetary-engine-v19.ts:124, 156-157): `L = supply × PAR_VALUE (1.00)`, `ratio = R_a / L`. reserve-allocation.ts:207-223: RR>110% → +2% bullion; RR<102% → +2% fiat. On-chain (MTQ.sol): `_checkReserveRatio()` auto-pauses minting if `getReserveRatio() < 10000` (100%).

**Alignment status:** ✅ ALIGNED (TS + on-chain).

**Risk:** LOW.

---

### 9. Volatility adjustment (§17)

**Blueprint requirement:** v18 Part 2 Article VI Component 5: shock absorber caps weight adjustments during high volatility (half-rate). Specific σ thresholds (≤2%→1.0, ≥5%→0.5, linear between) — **BLUEPRINT SILENT** in provided docs (defined only in code per prior worklog).

**Current implementation:** TS (monetary-engine-v19.ts:389-443): `V_NORMAL=0.02, V_HIGH=0.05, EWMA_LAMBDA=0.94`. `shockAbsorberFactor`: v≤0.02→1.0, v≥0.05→0.5, linear between. Documented fix correcting prior [0.02,0.05]→[1.0,0.0] bug.

**Alignment status:** ✅ ALIGNED at principle level. σ-numeric thresholds are code-only (blueprint silent on specifics).

**Risk:** LOW.

---

### 10. Shock absorber A_t (§17.4)

**Blueprint requirement:** Principle: cap adjustments at half-rate during high volatility. Specifics BLUEPRINT SILENT.

**Current implementation:** TS (monetary-engine-v19.ts:412-443): `shockAbsorberFactor` returns 1.0 / interpolated / 0.5. Applied via `shockAdjustedFactor(M, R, A_t) = 1 + A_t×(M×R − 1)`.

**Alignment status:** ✅ ALIGNED (code-defined; blueprint silent on exact σ mapping).

**Risk:** LOW.

---

### 11. Momentum limits (§16.1)

**Blueprint requirement:** v18 Part 2 Article VI Component 2: momentum cap ±5%.

**Current implementation:** TS (monetary-engine-v19.ts:312): `L_MOMENTUM = 0.05`. `clampMomentum` to [0.95, 1.05]. `L_REVERSION = 0.02` (±2% mean reversion).

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW.

---

### 12. Currency floors (§22A)

**Blueprint requirement:** v19 addendum §3: all W ≥ 0.5%. `minimum_floor` trigger (high severity).

**Current implementation:** TS (monetary-engine-v19.ts:316, 527-539): `W_MIN = 0.005`. `checkMinimumFloor`. `verifyBasket` enforces. Trigger fires at <0.5%. `validateRebalanceProposal` rejects proposals where post-trade weight <0.005. `mintingPaused = !basketVerification.passed`.

**Alignment status:** ✅ ALIGNED (TS). ❌ NOT enforced on-chain.

**Risk:** MEDIUM. A malicious MINTER_ROLE could mint in a way that breaches the floor without on-chain rejection.

**Recommended modification:** Add basket verification to Mint.sol/Algorithm.sol for mainnet.

---

### 13. Currency caps (§21/§22A)

**Blueprint requirement:** v19 addendum §3: all W ≤ 60%. `concentration_cap` trigger (critical severity).

**Current implementation:** TS (monetary-engine-v19.ts:315, 488-525): `L_MAX = 0.60`. `applyConcentrationCap` — iterative cap-and-redistribute (10 iterations). Trigger fires at >60%. `validateRebalanceProposal` rejects >0.60.

**Alignment status:** ✅ ALIGNED (TS). ❌ NOT enforced on-chain.

**Risk:** MEDIUM (same as floors).

---

### 14. Gold/silver limits (§25.2)

**Blueprint requirement:** Gold 60-95% of bullion, silver 5-40%.

**Current implementation:** TS (reserve-allocation.ts:80, 252-253): `BULLION_GOLD_BAND = {min:0.60, max:0.95}`. `goldShare = clamp(goldShare, 0.60, 0.95)`, `silverShare = clamp(1−goldShare, 0.05, 0.40)`.

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW.

---

### 15. Reserve concentration limits (§10 7-tier cap table)

**Blueprint requirement:** v19 addendum §4: per-counterparty ≤10%, per-custodian ≤25%, per-issuer ≤15%, per-jurisdiction ≤30%, per-infrastructure ≤20%, per-currency ≤35%, aggregate ≤100%.

**Current implementation:** TS (v19-infrastructure.ts:305-313): `COUNTERPARTY_EXPOSURE_LIMITS` 7-tier table. multi-custodian.ts:46-52: `maxSingleCustodian=0.25, maxSingleJurisdiction=0.30, maxSingleVault=0.30, minCustodians=3`. `exceedsExposureLimit` checker.

**Alignment status:** ✅ ALIGNED (TS). ❌ NOT enforced on-chain. ❌ §10 counterparty table is "only consumed by display code (no runtime gate in execution-engine.ts)" per code audit.

**Risk:** HIGH. The 7-tier caps exist in code but are NOT enforced as a runtime gate on rebalance execution.

**Recommended modification:** Wire `exceedsExposureLimit` into `validateRebalanceProposal`. Blueprint-required.

---

### 16. Rebalancing triggers (§29)

**Blueprint requirement:** v19 addendum §19.3: 9 trigger types + LCR.

**Current implementation:** TS (v19-infrastructure.ts:2513-2524, 2615-2864): 10 trigger types (9 + LCR) — `weight_drift, layer_breach, bullion_band, stablecoin_eligibility, currency_eligibility, concentration_cap, minimum_floor, reserve_ratio, lcr, council_authorization`. All actively detected. Pure function (deterministic sort by severity then description).

**Alignment status:** ✅ ALIGNED (engine). ❌ NOT wired into live `/api/rebalance/plan` route (raw-actions path taken — no context passed).

**Risk:** CRITICAL. The §29 engine exists but is bypassed by the live API.

**Recommended modification:** Refactor `/api/rebalance/plan` to construct and pass a `RebalanceContext`. Blueprint-required.

---

### 17. Rebalancing frequency

**Blueprint requirement:** v18 Part 3 Article I: quarterly scheduled + triggered-as-needed + emergency + annual strategic. 3% weekly weight-change cap (Invariant I-4).

**Current implementation:** TS (dynamic-rebalancing.ts:111-120): `minDeferralHours=4, maxDeferralHours=48, scheduledWindowHours=24, batchingSavingsThreshold=0.20`. No explicit 3% weekly cap in code.

**Alignment status:** ⚠️ PARTIAL. Frequency decisioning implemented; 3% weekly cap NOT explicitly enforced.

**Risk:** MEDIUM. Without the weekly cap, a burst of triggered rebalances could exceed the constitutional turnover limit.

**Recommended modification:** Add a rolling 7-day turnover tracker that blocks rebalances exceeding 3% weekly weight change per asset. Blueprint-required (Invariant I-4).

---

### 18. Hysteresis (§22B)

**Blueprint requirement:** BLUEPRINT SILENT on §22B specifics in provided docs. 2% band is canonical elsewhere.

**Current implementation:** TS (monetary-engine-v19.ts:541-631): `HYSTERESIS_BAND=0.02, HYSTERESIS_CONFIRMATION_THRESHOLD=2`. Module-level persistent state. `applyHysteresis`: |proposed−current|≤0.02 → keep; counter<2 → hold; counter≥2 → apply.

**Alignment status:** ✅ IMPLEMENTED (code-defined; blueprint silent on §22B specifically).

**Risk:** LOW.

---

### 19. Emergency rebalancing (§44)

**Blueprint requirement:** v19 addendum §9: 4-level (Normal, Heightened Watch 30d, Emergency 7d, Constitutional Emergency 24h).

**Current implementation:** TS (v19-infrastructure.ts:1379-1513): 5 levels (Normal, Technical 24h, Operational 7d, Constitutional 30d, Systemic 90d). `declareEmergency`, `liftEmergency`, `isEmergencyActive`. Emergency override in `verifyRebalancePlanReserveRatio`. On-chain (MTQ.sol): `emergencyPaused` (PAUSER_ROLE sets, COUNCIL_ROLE lifts). On-chain (Governance.sol): `emergencyCustodian` (60-day expiry).

**Alignment status:** ⚠️ PARTIAL. TS has 5 levels (blueprint specifies 4). On-chain emergency custodian powers are NOT wired — address stored but no contract checks it.

**Risk:** MEDIUM. Emergency custodian is a governance designation only, not an executable on-chain role.

**Recommended modification:** Wire emergency custodian checks into MTQ/Mint/Reserve. Blueprint-required for mainnet.

---

### 20. Severe Deviation Protocol (§33)

**Blueprint requirement:** v19 addendum §6: SDP triggers on sovereign default / >5% deviation. `computeSDPEmergency()` calculates emergency weights. Public via `monetary.sdp.triggered`.

**Current implementation:** TS (v19-infrastructure.ts:188-266): `SDP_TRIGGER_THRESHOLD=0.05, SDP_CAP=0.50`. `detectSDP(currentPrice, referencePrice, currency)`. `computeSDPEmergency`: `W_emergency = structuralWeight × (referencePrice/currentPrice)`, `W_new = max(W_emergency, currentWeight × SDP_CAP)`. Triggers currency lifecycle full→suspended.

**Alignment status:** ✅ ALIGNED (engine). ⚠️ NOT directly invoked by any API route (needs a caller comparing current vs reference prices per currency).

**Risk:** MEDIUM. SDP is implemented but not actively triggered in production.

**Recommended modification:** Wire SDP detection into a periodic cron/batch that compares live oracle prices against reference prices. Blueprint-required.

---

### 21. Liquidity requirements (§5/§29.6)

**Blueprint requirement:** LCR ≥100% (target 125%). Redemption Buffer ≥2% (target 5%). Minimum Constitutional Buffer ≥8% above S×PAR. LRR ≥1.0 (excludes gold).

**Current implementation:** TS (monetary-engine-v19.ts:168-206): `computeLCR`. `verifyRebalancePlanLiquidity` rejects if projected LCR<1.0. lrr.ts: `computeLrr` (excludes gold+silver by Bullion Protection Rule). On-chain: NOT enforced.

**Alignment status:** ✅ ALIGNED (TS). ❌ NOT enforced on-chain.

**Risk:** MEDIUM.

---

### 22. Redemption requirements (§34)

**Blueprint requirement:** Never paused. 1 kg gold minimum. 10-min soft / 7-day hard finality. 0.05% fee capped at $5,000.

**Current implementation:** On-chain (Redeem.sol): NO pause function, NO notPaused modifier, anyone can call. MTQ.burn(): NO pause modifier. TS (redeem/route.ts): does NOT check `mintingPaused`. Fee 0.05% capped at $5,000 (monetary-engine-v19.ts:866-867). Liquidation order: stablecoin → cash → sovereign → silver → gold LAST (v19-infrastructure.ts:347-354).

**Alignment status:** ✅ ALIGNED (never paused — on-chain enforced). ❌ §34 liquidation order NOT enforced on-chain (Reserve.withdrawReserve does pro-rata, not bullion-last).

**Risk:** CRITICAL. The Bullion Protection Rule (Invariant 5) is NOT enforced on-chain despite `liquidateGold()` being a forbidden selector. A redemption could liquidate gold proportionally when stablecoins should be drawn first.

**Recommended modification:** Refactor `Reserve.withdrawReserve()` to implement the sequential liquidation order. Blueprint-required (Invariant 5).

---

### 23. Oracle requirements (§30-32)

**Blueprint requirement:** v18 Part 4 Article III: 8 oracle families, ≥5-of-8 consensus, 2% outlier exclusion, 48-hour TWAP fallback. constitutional-change-log Phase 11: every publication includes price/confidence/quality/volatility/freshness.

**Current implementation:** TS (v19-infrastructure.ts:30-185): `ORACLE_FRESHNESS_MS=60_000, ORACLE_MINIMUM_QUORUM=5`. `oracleConsensus` pipeline (freshness → eligibility → MAD outlier → quorum → weighted-median → 5% validation → TWAP fallback). live-oracle.ts: gold-api.com, open.er-api.com, CoinGecko, Turso DB. On-chain (Oracle.sol): single-provider, `MAX_STALENESS=1 hours`, `getPrice()` reverts if stale. MockOracle: no freshness check on read.

**Alignment status:** ⚠️ PARTIAL. TS has the full consensus pipeline. On-chain is single-provider testnet (mainnet multi-oracle deferred). `getGoldPrice()`/`getSilverPrice()` aliases bypass staleness — footgun.

**Risk:** MEDIUM for testnet. HIGH for mainnet (single-provider = single point of failure/manipulation).

**Recommended modification:** Implement multi-oracle consensus on-chain for mainnet. Remove the staleness-bypassing aliases. Blueprint-required for mainnet.

---

### 24. Custodian requirements

**Blueprint requirement:** custody-framework-v2: 4-tier custodian hierarchy, 12 eligibility criteria, 25% per-custodian cap, 30% per-jurisdiction, daily reconciliation, quarterly independent audit, daily cryptographic PoR.

**Current implementation:** TS (custodian-adapter.ts): 4 simulated custodians, `ensureSimulatedCustodianHoldingsSeeded` (fixed in prior task). multi-custodian.ts: `DEFAULT_CUSTODIAN_FLEET` (7 institutional custodians across 5 jurisdictions). reconciliation.ts: 4-tier severity, 5 actions. On-chain: NOT implemented (no custodian tracking).

**Alignment status:** ✅ ALIGNED (TS simulation). ❌ NOT enforced on-chain.

**Risk:** MEDIUM for testnet. HIGH for mainnet.

---

### 25. Approval requirements (§29.2)

**Blueprint requirement:** BLUEPRINT SILENT on specific 2/3/4/5-of-5 routing in provided docs. Severity levels (low/medium/high/critical) per v19 addendum §19.3.

**Current implementation:** TS (execution-engine.ts:685-795): 5 roles, `SEVERITY_APPROVAL_THRESHOLDS`: low=2/5, medium=3/5, high=4/5, critical=5/5+Constitutional Council. SIMULATION mode auto-approves all 5. SHADOW/LIVE requires manual approval. On-chain (Governance.sol): 6-of-7 supermajority for constitutional, 4-of-7 for policy, 90-day/7-day timelocks.

**Alignment status:** ✅ ALIGNED (code-defined severity routing). ⚠️ SIMULATION mode auto-approves everything (no human-in-loop).

**Risk:** MEDIUM. Default SIMULATION mode bypasses all approval gates.

**Recommended modification:** Set `EXECUTION_MODE=SHADOW` or `LIVE` for production. Blueprint-required for mainnet.

---

### 26. Execution requirements (§29.4/§29.5)

**Blueprint requirement:** v19 addendum §19.5.3: cross-asset pairing, value conservation (sell=buy per pair), §29.5 fee model.

**Current implementation:** TS (execution-engine.ts:801-960): lifecycle PROPOSED→VALIDATED→APPROVED→SUBMITTED→EXECUTING→SETTLED→CUSTODIAN_CONFIRMED→RECONCILED→FINAL. `executeRebalanceProposal` requires APPROVED state. `generateCrossAssetRebalancePlan` pairs sell-buy with `pairId`. Fees via `computeRebalanceFee`. Post-trade RR computed. `confirmSettlement` calls `commitReserveStateUpdate` (only way to mutate executed state).

**Alignment status:** ✅ ALIGNED (when §29 context is passed). ⚠️ Raw-actions path bypasses cross-asset pairing.

**Risk:** MEDIUM (mitigated if §29 context is wired per area 16).

---

### 27. Auditability (§29.10/§37)

**Blueprint requirement:** v18 Part 1 Article II: no operation without audit trail. v19 addendum §17: attestReserves ±10% drift + 1-hour rate limit. constitutional-change-log Article XVI: Constitutional Assumptions Register (14 mandatory fields).

**Current implementation:** TS (execution-engine.ts:264-354): immutable JSONL ledger at `logs/rebalance-audit.jsonl` (synchronous `appendFileSync`). Every lifecycle transition logged. On-chain (Reserve.sol + MTQ.sol): `attestReserves` with ±10% drift + 1-hour rate limit. All 9 contracts emit events on every state change.

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW. (Note: two parallel `attestReserves` implementations — Reserve.sol and MTQ.sol — can diverge. Should be reconciled.)

---

### 28. Determinism (§29.12)

**Blueprint requirement:** v18 Part 2 Article VI §2: deterministic, same inputs → same outputs, no hidden parameters.

**Current implementation:** TS: `detectRebalanceTriggers` is a pure function (no Math.random/Date.now in trigger detection). Deterministic sort. `decimal.js` fixed-point arithmetic. `simulateThresholds` uses Mulberry32 PRNG seeded with input hash (documented fix removing Date.now). `proposalId` uses Date.now + Math.random (non-deterministic ID, but content is deterministic).

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW.

---

### 29. Stress testing (§38/§19.5)

**Blueprint requirement:** v18 Part 4 Article VII: 12 formally-verified invariants (I-1 to I-12). v19 addendum §7: Foundry/Slither/Halmos/Certora. §19.5: 10-point compliance matrix. constitutional-change-log Article XV: 20-scenario Stress Laboratory.

**Current implementation:** TS (stress-lab-scenarios.ts): 20 scenarios (5 existential). `/api/stress-lab` returns 20/20 pass. 10-point compliance matrix in stress-test-proof.tsx. LRR computation excludes gold. Foundry test suite (10 files, 241 tests per prior audit).

**Alignment status:** ✅ ALIGNED.

**Risk:** LOW. (Note: 4 scenarios were reclassified/reduced in prior task to pass RR≥100% — verify this is constitutionally sound.)

---

### 30. Constitutional invariants (§45/§12)

**Blueprint requirement:** §12: 4 absolute invariants (100% reserve, no discretionary minting, no lending, no commingling) + v19 Invariant 5 (bullion preservation). §45: 10 on-chain checkable invariants via `checkInvariant(uint8)`.

**Current implementation:** TS (v19-infrastructure.ts:525-657): 21 entries in `CONSTITUTIONAL_INVARIANTS`, all `amendable: false`. `checkInvariantConflict` blocks "liquidate gold" phrases without "exhaustion certificate". `FORBIDDEN_WORDS` (10 categories + 6 v18 terms). On-chain (Governance.sol): `checkInvariant(uint8)` for IDs 0-9. 15 forbidden selectors (6 platform + 9 invariant) blocked at create + execute. Anti-platform permanently frozen in constructor.

**Alignment status:** ✅ ALIGNED (TS + on-chain). ❌ Invariant 5 (Bullion Preservation) NOT enforced on-chain (see area 22).

**Risk:** HIGH. The bullion preservation invariant is declared but not enforced in the redemption flow.

---

## Part II — Required vs Not Required

| Item | Required by blueprint? | Evidence |
|---|---|---|
| Fixed currency percentages | **NO** | v18 Part 2 Article V §1: "No Currency Names in the Constitution." Engine determines weights algorithmically. |
| Fixed gold percentage | **NO** | v18 Part 2 Article IV: "The Constitution does not establish fixed percentages." Dynamic φ_t. |
| Fixed silver percentage | **NO** | Same — silver = 1 − φ_t, dynamic. |
| Fixed gold/silver ratio | **NO** | v19 addendum §19.5 Req 6: "Gold/silver ratio as RANGE — band [60%, 95%]." |
| Discretionary reserve management | **NO** | v18 Part 2 Article I Invariant 2: "No Discretionary Minting." Engine is algorithmic. |
| Operator-controlled weights | **NO** | v18 Part 2 Article V §3: "Weights are determined algorithmically, not politically." |
| Automatic market trading | **NO** | v18 Part 1 Article V: Anti-Platform clause — "The Institution does not execute trades." Permanently frozen. |
| Unrestricted rebalancing | **NO** | v18 Invariant I-4: 3% weekly cap. 9 trigger types + LCR with severity routing. |
| Continuous rebalancing | **NO** | v18 Part 3 Article I: quarterly scheduled + triggered + emergency + annual. Event-driven. |
| Large one-time trades | **NO** | Invariant I-4 (3% weekly cap). Negotiated block 1.5x fee multiplier penalizes large trades. |

**Code confirms:** all 10 are correctly NOT implemented. Currency/gold/silver percentages are DYNAMIC. Reserve management is RULE-BASED. No automatic trading. Rebalancing is CONSTRAINED and EVENT-DRIVEN.

---

## Part III — Rebalancing in Detail (A–L)

### A. WHAT causes a rebalance
The 9 trigger types + LCR (v19 addendum §19.3): `weight_drift` (>2%), `layer_breach`, `bullion_band` (φ_t outside [60%,95%]), `stablecoin_eligibility`, `currency_eligibility`, `concentration_cap` (>60%), `minimum_floor` (<0.5%), `reserve_ratio` (RR<100% critical, <102% medium), `council_authorization` + LCR (<1.0).

### B. WHAT does NOT cause a rebalance
Routine market movements within thresholds, minting/redemption operations (proportional), finality confirmations, custodian reconciliation (daily operational), calendar-driven scheduled/strategic rebalances (these ARE rebalances but not "triggered").

### C. Minimum deviation required
2% (`rebalanceThreshold` default 0.02 per v19 addendum §19.3 RebalanceContext).

### D. Hysteresis requirement
2% band + 2-observation confirmation threshold (§22B — code-defined; blueprint silent on §22B specifics).

### E. Frequency limits
Quarterly scheduled + triggered-as-needed + emergency + annual strategic. 3% weekly weight-change cap (Invariant I-4 — **NOT explicitly enforced in code**). Tier 1-3 deviation >3% → 30 days; Tier 4 >2% → 14 days; Gold/Silver >5% → 60 days.

### F. Emergency conditions
§33 SDP (volatility >5% / sovereign default). §44 4-level emergency governance (Normal / Heightened Watch 30d / Emergency 7d / Constitutional Emergency 24h). RR<100% → emergency protocols.

### G. Maximum transaction size
BLUEPRINT SILENT on explicit max transaction size. 3% weekly cap implicitly limits aggregate weekly volume. §29.6 phasing triggers when single action >5% of totalReserveValue.

### H. Maximum portfolio turnover
BLUEPRINT SILENT on explicit annualized turnover cap. 3% weekly cap implicitly bounds turnover to ≤156% per asset per year.

### I. Gold/silver limits
Gold 60-95% of bullion, silver 5-40%. `bullion_band` trigger (medium/high severity).

### J. Currency limits
Floor: W ≥ 0.5%. Cap: W ≤ 60%. Sum: Σ W = 1.0. Group: regional ≤70%. Min diversity: 3 currencies. Single currency in reserves: ≤50%.

### K. Liquidity constraints
LCR ≥100% (target 125%). Redemption Buffer ≥2% (target 5%). Constitutional Buffer ≥8%. LRR ≥1.0 (excludes gold). `verifyRebalancePlanLiquidity` rejects if projected LCR<1.0.

### L. Approval requirements
Severity-based: low=2/5, medium=3/5, high=4/5, critical=5/5+Constitutional Council. SIMULATION auto-approves. SHADOW/LIVE requires manual POST. On-chain: 6-of-7 supermajority for constitutional, 4-of-7 for policy.

---

## Part IV — Dynamic Reserves

**Can a stronger currency gain weight when another depreciates?** YES — §20 normalization (v19 addendum §19.5 Req 8: "when USD drops, others rise proportionally"). Verified end-to-end: EUR −90% → SDP → suspension.

**Can a currency lose weight due to:**
- Sustained depreciation: YES (mean reversion + §20 normalization)
- Volatility: YES (shock absorber caps adjustment latitude)
- Liquidity deterioration: YES (§12 lifecycle: full→suspended)
- Concentration: YES (60% cap, `concentration_cap` trigger)
- Reserve-ratio pressure: YES (`reserve_ratio` trigger at <102%)
- Sanctions: YES (§12 lifecycle + eligibility criteria)
- Severe deviation: YES (§33 SDP)

**Symmetrical?** YES — v18 Part 2 Article V §2: "Criteria are applied uniformly." All currencies evaluated against the same criteria.

---

## Part V — Gold/Silver φ_t

- **Definition:** Gold's share of bullion (Tier 3) at time t.
- **Minimum φ_t:** 60% (constitutional)
- **Maximum φ_t:** 95% (constitutional)
- **Trigger conditions:** `bullion_band` fires when outside [60%, 95%] (high) or within 2pp of edge (medium)
- **Rebalance mechanism:** Cross-asset pairing (sell bullion ↔ buy fiat/stablecoin), split per φ_t
- **Transaction-cost consideration:** Gold 10 bps VWAP, silver 20 bps (highest). Method multipliers apply to execution+slippage.
- **Emergency behavior:** Bullion Protection Rule — liquidation order: stablecoins → cash → sovereign → silver → gold (LAST). Gold requires Exhaustion Certificate.
- **Relationship:** Independent behaviour principle (constitutional-change-log Phase 2 §25). No netting permitted.
- **Sold independently?** YES — both can be sold independently via cross-asset pairing. But gold only as last resort.
- **Bullion replace currencies?** YES (sell fiat, buy bullion when underweight).
- **Currencies replace bullion?** YES (symmetric pair). But Bullion Protection Rule constrains directionality.

---

## Part VI — 7 Institutional Holding States

| # | State | Code representation | Conflated? |
|---|---|---|---|
| 1 | TARGET WEIGHT | `ReserveState.target` + `computeDynamicReserveAllocation` outputs | **YES at init** — same assets array |
| 2 | ACTUAL HOLDING | `ReserveState.executed` | **YES at init** — same assets array |
| 3 | REBALANCE SIGNAL | `detectRebalanceTriggers(ctx)` output | Not a state (pure function output) |
| 4 | APPROVED ORDER | `RebalanceProposal` lifecycle PROPOSED→APPROVED | In-memory only (lost on restart) |
| 5 | EXECUTED TRADE | `ExecutionResult` from `executeRebalanceProposal` | In-memory only |
| 6 | CUSTODIAN CONFIRMED | `ReserveState.custodian` from `commitCustodianConfirmation` | **YES at init** — same assets array |
| 7 | RECONCILED HOLDING | `ReserveState.reconciled` | **YES at init** — same assets array |

**CRITICAL FINDING:** All 4 stored views (target/executed/custodian/reconciled) are CONFLATED at `initializeReserveState()` — populated from the same `assets[]` array, differing only in `dataSourceId`. They diverge ONLY after lifecycle mutations. After a process restart, all 4 views are identical again, which **masks reconciliation gaps** and makes custodian variance appear as 0 when it may not be.

**Recommended modification:** Seed target from `computeDynamicReserveAllocation`, seed executed from the committed ledger, seed custodian from `getCustodianAdapter().getHoldings()`, and compute reconciled as the variance-resolution output. Blueprint-required (the 7 states must never be conflated per the institutional separation principle).

---

## Part VII — Fixed Constants Classification

| Constant | Value | Classification |
|---|---|---|
| `FIXED_GOLD_OZ` | 2,122.86 oz | **Canonical production value** (v19.0.2 §19.2 baseline) wrapped in **simulation rigidity** (FIXED_ prefix is technical debt for mainnet — should read from custodian) |
| `FIXED_SILVER_OZ` | 36,758 oz | Same — canonical value, simulation rigidity |
| `FIXED_CASH_USD` | $29,000,000 | **Canonical production value** (v19.0.2 §19.2 over-collateralization baseline). Label correctly says "canonical." |

**Values are CONSISTENT** across all files ($29M cash, 2,122.86 oz gold, 36,758 oz silver, $13.5M sovereign, $2.7M stablecoin, 54M supply).

**Comment drift hazard:** 5 files have comments claiming `$29,250,000` or `$32,450,000` cash while the actual constant is `$29,000,000`. The runtime is correct; the comments mislead reviewers. Files affected: nav-compute.ts:14, nav-compute.ts:87, reserve-allocation.ts:27, stress-test-fixed.ts:75, e2e-workflow-tests.ts:109, stability-comparison.ts:50.

**Classification verdict:** The fixed constants are **canonical production baseline values** (per v19.0.2 §19.2) currently used in a **simulation/testnet context** (per reserve-state.ts:13 "Status: SIMULATED (testnet)"). The `FIXED_` prefix is **technical debt** — mainnet should replace them with dynamic reads from custodian holdings + live oracle prices, while keeping the values as the documented baseline reference.

---

## Consolidated Risk Register

| # | Risk | Severity | Area |
|---|---|---|---|
| 1 | §29 engine NOT wired into live `/api/rebalance/plan` route | CRITICAL | 16 |
| 2 | §34 Bullion Preservation NOT enforced on-chain (pro-rata withdrawal) | CRITICAL | 22, 30 |
| 3 | On-chain 3-tier model contradicts constitutional 4-tier model | HIGH | 1 |
| 4 | §10 7-tier concentration caps NOT enforced as runtime gate | HIGH | 15 |
| 5 | 7 holding states CONFLATED at initialization | HIGH | Part VI |
| 6 | §22A basket floors/caps NOT enforced on-chain | MEDIUM | 12, 13 |
| 7 | 3% weekly turnover cap NOT explicitly enforced | MEDIUM | 17 |
| 8 | Emergency custodian powers NOT wired on-chain | MEDIUM | 19 |
| 9 | SDP detection NOT actively triggered in production | MEDIUM | 20 |
| 10 | Oracle single-provider on-chain (mainnet risk) | MEDIUM→HIGH | 23 |
| 11 | SIMULATION mode auto-approves all rebalances | MEDIUM | 25 |
| 12 | Comment drift (5 files claim wrong cash value) | LOW | Part VII |

---

## Recommended Modifications (Priority Order)

### Blueprint-Required (must fix for mainnet)
1. Wire §29 engine into `/api/rebalance/plan` (construct + pass `RebalanceContext`)
2. Implement §34 Bullion Preservation liquidation order in `Reserve.withdrawReserve()`
3. Refactor Reserve.sol to 4-tier constitutional model (resolve F-HIGH-3)
4. Wire §10 concentration caps into `validateRebalanceProposal` as a runtime gate
5. De-conflate the 7 holding states at initialization
6. Add §22A basket verification to Mint.sol/Algorithm.sol
7. Enforce 3% weekly turnover cap (Invariant I-4)
8. Wire emergency custodian powers into MTQ/Mint/Reserve
9. Wire SDP detection into a periodic batch
10. Implement multi-oracle consensus on-chain for mainnet
11. Set `EXECUTION_MODE=SHADOW` or `LIVE` for production

### Institutional Enhancements (recommended but not strictly blueprint-required)
12. Replace `FIXED_*` constants with dynamic custodian reads for mainnet
13. Fix comment drift in 5 files (comments claim $29.25M/$32.45M, actual is $29M)
14. Reconcile the two parallel `attestReserves` implementations (Reserve.sol + MTQ.sol)
15. Remove Oracle.sol staleness-bypassing aliases (`getGoldPrice`/`getSilverPrice`)

---

## FINAL RULE

**NO CODE CHANGES WERE MADE.** This is a Phase 1 read-only audit. All modifications listed above are **recommendations for a future Phase 2 implementation pass**, to be authorized separately.

The audit stops here.

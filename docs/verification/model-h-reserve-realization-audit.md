# MODEL H RESERVE REALIZATION AUDIT

## Forensic Inventory of True Current State vs. Documented State

**Document:** 1 of 7
**Mode:** READ-ONLY + SHADOW SIMULATION
**Source:** Actual v20 source code, live runtime API, on-chain contract verification, Turso database

---

## EXECUTIVE SUMMARY

This audit independently verifies, from source code and deployed state (not documentation), what the MITHQAL reserve system ACTUALLY is. The finding is stark:

**The documented 8-currency basket does not exist in the runtime. The actual reserve is 100% USD. The 60% constitutional cap is violated. Reserves are hardcoded, not verified.**

---

## 1. FORENSIC INVENTORY

### 1.1 What the blueprint says (v20 Canonical Blueprint, §6.2)

| Rule | Blueprint specification |
|---|---|
| Currency basket | 8 sovereign currencies: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD |
| Structural weighting | C_i = 0.50×COFER + 0.40×SWIFT + 0.10×BIS |
| Per-currency cap | 60% (§22A) |
| Per-currency floor | 0.5% (§22A) |
| Minimum diversity | 3 currencies |
| φ_t (gold/silver) | [60%, 95%], default 80% |

### 1.2 What the TypeScript engine calculates

| Component | Status | Evidence |
|---|---|---|
| Structural weight computation | ✅ LIVE | `monetary-engine-v19.ts` computes C_i for all 8 currencies |
| Momentum (M_i) | ✅ LIVE | Computed from 12-month-ago FX rates |
| Mean reversion (B_i) | ✅ LIVE | Computed from LTA vs structural weight |
| Shock absorber (A_t) | ✅ LIVE | Computed from EWMA volatility |
| SDP (currency suspension) | ✅ LIVE | FX deviation >5% triggers |
| Basket verification | ✅ LIVE | Checks weights sum to 1.0, within [0.5%, 60%] |
| **Reserve asset allocation** | ❌ **HARDCODED** | `nav-compute.ts:46-50` hardcodes 100% USD cash + 100% US T-bills |

### 1.3 What the database stores

Turso database (16 tables, verified live):
- `GoldPriceSnapshot` — daily gold + FX snapshots (live, building historical dataset)
- `engine_state` — monetary engine state (live)
- `reserves` — reserve records (simulated)
- `proposals` — rebalance proposals (live governance trail)
- `transactions` — mint/redeem/transfer records (simulated)
- `users` — user accounts (simulated)
- Other tables: `fees`, `TestnetOperation`, `ProofAttestation`, etc.

### 1.4 What NAV actually uses

The live `/api/nav` endpoint returns (verified 2026-08-11):

| Field | Value | Source |
|---|---|---|
| NAV_m | $1.0896 | R_m / S |
| NAV_l | $1.0675 | R_a / S |
| NAV_s | $0.9725 | R_l / S |
| RR | 106.75% | R_a / (S × PAR) |
| R_m | $58,837,457 | Σ Q × P |
| R_a | $57,645,742 | Σ Q × P × (1-H) × C |
| Gold | $4,358/oz | Multi-oracle (2/3 sources live) |
| Silver | $64.89/oz | Single source (gold-api.com) |
| Supply | 54,000,000 | Hardcoded baseline |

### 1.5 Actual reserve assets (from nav-compute.ts source code)

| Asset | Quantity | Price | Value | Currency |
|---|---|---|---|---|
| Cash | $31,000,000 | $1.00 | $31,000,000 | **100% USD** |
| US T-bills | $13,500,000 | $1.00 | $13,500,000 | **100% USD** |
| Gold | 2,122.86 oz | $4,358 | $9,249,000 | XAU |
| Silver | 36,758 oz | $64.89 | $2,385,000 | XAG |
| Stablecoin | $2,700,000 | $1.00 | $2,700,000 | **100% USD-pegged** |
| **Total R_m** | | | **$58,834,000** | |

### 1.6 Actual currency concentration (independently computed)

| Currency | Value | % of R_a | Status |
|---|---|---|---|
| USD | $47,200,000 | **81.9%** | ❌ **VIOLATES 60% CAP** |
| EUR | $0 | 0.0% | Not held |
| JPY | $0 | 0.0% | Not held |
| GBP | $0 | 0.0% | Not held |
| CHF | $0 | 0.0% | Not held |
| CNY | $0 | 0.0% | Not held |
| AUD | $0 | 0.0% | Not held |
| CAD | $0 | 0.0% | Not held |
| XAU | $9,249,000 | 16.1% | ✅ |
| XAG | $2,385,000 | 4.1% | ✅ |

---

## 2. CONTRACT DEPLOYMENT STATUS (on-chain verified)

### 2.1 Monad testnet (chain ID 10143) — verified via eth_getCode

| Contract | Address | Deployed? | Bytecode size | Status |
|---|---|---|---|---|
| MTQ token | 0x237c3Aa2... | ❌ NO | 0 chars | **NOT DEPLOYED** |
| Governance | 0xE35a9180... | ✅ YES | 51,640 chars | Deployed |
| Safe (multisig) | 0xE71869C6... | ✅ YES | 344 chars | Deployed (minimal) |
| Algorithm | 0x62f8E524... | ❌ NO | 0 chars | **NOT DEPLOYED** |
| Reserve | 0x27a1a201... | ✅ YES | 8,274 chars | Deployed |
| Mint | 0x0dd8b4F8... | ❌ NO | 0 chars | **NOT DEPLOYED** |
| Redeem | 0xcAde4594... | ✅ YES | 5,094 chars | Deployed |
| Oracle | 0xFd2B8d17... | ✅ YES | 5,094 chars | Deployed (STUB — returns 0x) |
| Takaful | 0xA3B89Ffd... | ✅ YES | 5,094 chars | Deployed |

### 2.2 Oracle on-chain verification

- `eth_call` for `goldPrice()` → returns `0x` (empty)
- `eth_call` for `silverPrice()` → returns `0x` (empty)
- `MOCK_ORACLE_ADDRESS` env var NOT set in `.env`
- Result: On-chain Oracle is dead code. System runs entirely on off-chain API fallbacks.

---

## 3. RESERVE CLASSIFICATION (MODELED vs VERIFIED)

### 3.1 The critical distinction

| Category | Definition | Current MITHQAL status |
|---|---|---|
| **MODELED RESERVE** | A reserve value assumed/calculated by software | $57.65M R_a (all reserves) |
| **VERIFIED RESERVE** | A reserve independently proven to exist via custody/bank/custodian attestation | **$0** |

### 3.2 Every reserve classified

| Reserve asset | Modeled value | Independently verified? | Evidence |
|---|---|---|---|
| Cash $31M USD | $31,000,000 | ❌ UNVERIFIED | Hardcoded in nav-compute.ts. No bank statement. |
| Sovereign $13.5M | $13,500,000 | ❌ UNVERIFIED | Hardcoded. No Treasury Direct account. |
| Gold 2,122.86 oz | $9,249,000 | ❌ UNVERIFIED | Hardcoded. No vault attestation, no LBMA serials. |
| Silver 36,758 oz | $2,385,000 | ❌ UNVERIFIED | Hardcoded. No vault attestation. |
| Stablecoin $2.7M | $2,700,000 | ❌ UNVERIFIED | Hardcoded. No on-chain wallet verification. |
| Gold price | $4,358/oz | ✅ LIVE | Multi-oracle (2/3 sources live) |
| Silver price | $64.89/oz | ✅ LIVE | gold-api.com (single source) |
| FX rates | various | ✅ LIVE | open.er-api.com (single source) |
| Turso database | 16 tables | ✅ LIVE | Connection verified |
| Discord bot | 1 guild, 5 commands | ✅ LIVE | Connected as MithqalMTQ#8586 |

### 3.3 The two NAVs

| Metric | Value | Meaning |
|---|---|---|
| **MODELED NAV** | $1.0896 | What the software calculates from hardcoded values |
| **VERIFIED NAV** | **$0.00** | What is independently proven to exist |

**If the hardcoded values are wrong (intentionally or accidentally), the entire system is a fiction.**

---

## 4. TRACEABILITY MATRIX: RESERVE HOLDINGS → EXECUTION

| Stage | Component | Status | Evidence |
|---|---|---|---|
| Reserve holdings | nav-compute.ts:46-50 | **HARDCODED** | 5 hardcoded asset entries |
| Oracle (gold) | multi-oracle.ts | **LIVE** (2/3 sources) | gold-api.com, CoinGecko active |
| Oracle (silver) | live-oracle.ts + oracle-client.ts | **PARTIAL** (1 source + stub) | gold-api.com only, on-chain returns 0x |
| Oracle (FX) | live-oracle.ts | **LIVE** (1 source) | open.er-api.com |
| Oracle (stablecoin) | hardcoded | **STUB** | Always $1.00, no depeg monitoring |
| Asset valuation | monetary-engine-v19.ts | **LIVE** | Computes R_m, R_a, R_l correctly |
| NAV | monetary-engine-v19.ts | **LIVE** | NAV_m = R_m/S |
| RR | monetary-engine-v19.ts | **LIVE** | RR = R_a/(S×PAR) |
| LCR | monetary-engine-v19.ts | **LIVE** | HQLA / net outflows |
| LRR | lrr.ts | **LIVE** | Immediate liquidity / redemptions |
| Risk engine | dynamic-rebalancing.ts | **LIVE** | Evaluates rebalance factors |
| Structural weights | monetary-engine-v19.ts | **DISPLAY ONLY** | Computes weights but never applies to reserves |
| Momentum | monetary-engine-v19.ts | **DISPLAY ONLY** | Computes M_i but not wired to allocation |
| SDP | monetary-engine-v19.ts | **LIVE** | Suspends currencies in weight computation |
| Rebalancing | execution-engine.ts | **LIVE** | 7-state pipeline, hash binding |
| Governance | institutional-approval.ts | **LIVE** | 5-role, severity-routed |
| Approval | execution-engine.ts | **LIVE** | Hash-bound, validUntil |
| Execution | execution-engine.ts | **SIMULATED** | Simulated custodian (no real API) |
| Ledger | audit trail (JSONL) | **LIVE** | Append-only, durable |
| Redemption | redeem route | **PARTIAL** | Computes value but MTQ token NOT deployed |

---

## 5. CRITICAL FINDINGS

### Finding 1: The 60% cap is VIOLATED

USD concentration = 81.9%. The constitutional 60% per-currency cap (§22A) is violated. The basket verification function checks the engine's *computed* weights (which pass) but the actual reserve holdings (100% USD) are never passed through the verifier.

**Classification: Implementation error (wiring gap).**

### Finding 2: Reserves are UNVERIFIED

Every dollar of the $57.65M R_a is hardcoded in source code. No independent custodian attestation, no bank statement, no on-chain wallet verification. The system reports accurate COMPUTATIONS but UNVERIFIED HOLDINGS.

**Classification: Deployment error (no custodian integration).**

### Finding 3: 3 contracts are NOT deployed

MTQ token, Mint, and Algorithm contracts are not deployed on Monad testnet. The addresses in `arc-testnet-addresses.json` point to empty code. This means:
- No on-chain MTQ token exists
- No on-chain minting is possible
- No on-chain algorithm enforcement
- The founder cap (20%) is NOT enforced

**Classification: Deployment error (incomplete deployment).**

### Finding 4: On-chain Oracle is dead code

The Oracle contract is deployed but returns `0x` for all prices. `MOCK_ORACLE_ADDRESS` is not set. The system runs entirely on off-chain API fallbacks.

**Classification: Configuration error (env var not set).**

### Finding 5: Silver and FX oracles are single-source

- Silver: 1 source (gold-api.com) + on-chain stub (returns 0x)
- FX: 1 source (open.er-api.com)
- Stablecoins: hardcoded at $1.00 (no depeg monitoring)

**Classification: Architectural gap (no multi-oracle for silver/FX).**

---

## 6. CONCLUSION

The MITHQAL v20 system is **economically sound in design but incomplete in implementation**. The documented 8-currency basket does not exist in the runtime. The actual reserve is 100% USD, violating the 60% constitutional cap. Reserves are hardcoded, not verified. Three critical contracts are not deployed. The on-chain Oracle is dead code.

**Model H (or Model H+) cannot be evaluated as "ready" until these gaps are closed.** The shadow simulation in the companion documents evaluates what Model H+ WOULD achieve IF properly implemented — but the current system is far from that state.

**Next steps:** See the companion documents for stress testing, currency optimization, and the final management decision.

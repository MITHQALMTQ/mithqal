# ORACLE INSTITUTIONAL READINESS

## Oracle Architecture Audit & Failure Mode Analysis

**Document:** 6 of 8
**Mode:** READ-ONLY — audit, no configuration changes

---

## EXECUTIVE SUMMARY

The current oracle architecture is **institutionally inadequate.** Gold has 2 of 3 sources live (acceptable but needs the 3rd). Silver has 1 source (unacceptable). FX has 1 source (unacceptable). Stablecoins are hardcoded at $1.00 with no depeg monitoring (unacceptable). The on-chain Oracle contract is deployed but returns 0x for all prices (dead code).

This document defines the institutional oracle architecture required for mainnet.

---

## 1. CURRENT ORACLE STATE (verified from source + runtime)

### 1.1 Gold oracle — PARTIALLY INSTITUTIONAL

| Source | Status | Evidence |
|---|---|---|
| gold-api.com (LBMA XAU/USD) | ✅ Live | Primary source, free API |
| CoinGecko (tether-gold/XAUt) | ✅ Live | Independent gold-backed token |
| goldprice.org (LBMA benchmark) | ❌ Not responding | Third source, failing silently |
| On-chain MockOracle | ❌ Dead code | Deployed but returns 0x |
| Computed proxy (silver × ratio) | ⚠️ Circuit breaker only | Used when <2 primaries succeed |

**Consensus mechanism:** 3-source median + 2% outlier rejection
**Fallback hierarchy:** Tier 1 (median) → Tier 2 (single) → Tier 3 (last-known-good) → Tier 4 ($4,076.9 hardcoded)

**Assessment:** ⚠️ **Acceptable for testnet, NOT for mainnet.** Need 3rd live source + on-chain Oracle integration.

### 1.2 Silver oracle — INADEQUATE

| Source | Status | Evidence |
|---|---|---|
| gold-api.com (XAG/USD) | ✅ Live | Single source |
| On-chain MockOracle | ❌ Dead code | Returns 0x |
| Fallback | $58.76 hardcoded | Stale constant |

**Assessment:** ❌ **UNACCEPTABLE.** Single source + hardcoded fallback. If gold-api.com fails, silver is valued at a stale $58.76 (current price is $64.89 — 10% error).

### 1.3 FX oracle — INADEQUATE

| Source | Status | Evidence |
|---|---|---|
| open.er-api.com | ✅ Live | Single source, free API |
| Fallback | Hardcoded rates | EUR=1.14, JPY=0.0061, etc. (months old) |

**Assessment:** ❌ **UNACCEPTABLE.** Single source + stale hardcoded fallback. No consensus, no outlier rejection.

### 1.4 Stablecoin oracle — NONEXISTENT

| Source | Status | Evidence |
|---|---|---|
| Hardcoded | $1.00 always | No live pricing |
| Depeg monitoring | ❌ Not implemented | No alert if USDC drops to $0.95 |

**Assessment:** ❌ **UNACCEPTABLE.** Stablecoins are assumed to be $1.00 forever. The March 2023 USDC depeg (to $0.87) would have been invisible to the system.

### 1.5 Sovereign oracle — N/A

Sovereign securities are marked at $1.00 (par). This is correct for short-duration T-bills (≤1yr) — they don't need mark-to-market pricing. No oracle needed.

---

## 2. ORACLE FAILURE MODE TESTING

### 2.1 Failure scenarios tested

| Failure | Gold | Silver | FX | Stablecoin | System behavior |
|---|---|---|---|---|---|
| 1 source fails | 2/3 → median of 2 | N/A (only 1) | N/A (only 1) | N/A | ✅ Gold OK, others degraded |
| 2 sources fail | 1/3 → single, quorumMet=false | N/A | N/A | N/A | ⚠️ Gold warning |
| All sources fail | Tier 3 last-known-good → Tier 4 $4,076.9 | $58.76 hardcoded | Hardcoded rates | $1.00 | ⚠️ Stale prices |
| Stale data (>60s) | Cache expires, refetch | Same | Same | N/A | ✅ Auto-refresh |
| Conflicting prices | 2% outlier rejection | N/A | N/A | N/A | ✅ Gold handled |
| Manipulated price | Outlier rejection + median | N/A | N/A | N/A | ✅ Gold (if <50% compromised) |
| Zero/absurd price | Filtered (price > 0, finite) | Same | Same | N/A | ✅ |
| API rate limit | Retry + cache | N/A | N/A | N/A | ⚠️ May use stale cache |

### 2.2 Safe failure behavior

| Check | Status |
|---|---|
| Oracle outage does not crash the system | ✅ Fallback to last-known-good or hardcoded |
| Stale prices are flagged | ✅ Age warning logged |
| Conflicting prices are resolved | ✅ Median + outlier (gold only) |
| Zero/negative prices are rejected | ✅ |
| System fails safely (no false minting) | ✅ Minting pauses if RR < 100% |

### 2.3 Unsafe failure behavior

| Check | Status |
|---|---|
| Silver single-source failure → stale $58.76 | ❌ 10% valuation error |
| FX single-source failure → stale hardcoded rates | ❌ Significant valuation error |
| Stablecoin depeg invisible | ❌ System values USDC at $1.00 even if it's $0.87 |
| On-chain Oracle dead code | ❌ Never queried (MOCK_ORACLE_ADDRESS not set) |

---

## 3. REQUIRED INSTITUTIONAL ORACLE ARCHITECTURE

### 3.1 Gold — 3+ independent sources

| Source | Type | Independence | Priority |
|---|---|---|---|
| gold-api.com | Free API | Independent | ✅ Keep |
| CoinGecko (XAUt) | Free API | Independent (token market) | ✅ Keep |
| goldprice.org | Free API | Independent | P1: Fix (currently failing) |
| metals.live | Free API | Independent | P1: Add as 4th source |
| Kitco | Paid API | Independent | P2: Add for redundancy |
| Chainlink (XAU/USD) | On-chain oracle | Independent | P2: Add for mainnet |
| Pyth (XAU/USD) | On-chain oracle | Independent | P2: Add for mainnet |

**Target:** 5+ sources (3 free + 2 paid/on-chain). Median + 2% outlier rejection.

### 3.2 Silver — 3+ independent sources (CURRENTLY 1)

| Source | Type | Priority |
|---|---|---|
| gold-api.com (XAG) | Free API | ✅ Keep |
| metals.live (XAG) | Free API | P1: Add |
| CoinGecko (silver spot) | Free API | P1: Add |
| Kitco (XAG) | Paid API | P2: Add |
| Chainlink (XAG/USD) | On-chain | P2: Add for mainnet |

**Target:** 3+ sources with median + outlier rejection (matching gold architecture).

### 3.3 FX — 2+ independent sources (CURRENTLY 1)

| Source | Type | Priority |
|---|---|---|
| open.er-api.com | Free API | ✅ Keep |
| Frankfurter (ECB) | Free API | P1: Add |
| Fixer.io | Paid API | P2: Add |
| Chainlink (EUR/USD, etc.) | On-chain | P2: Add for mainnet |

**Target:** 3+ sources with median + outlier rejection.

### 3.4 Stablecoin — live pricing + depeg monitoring (CURRENTLY NONE)

| Source | Type | Priority |
|---|---|---|
| CoinGecko (USDC, USDT, DAI) | Free API | P1: Add |
| Chainlink (USDC/USD, USDT/USD) | On-chain | P2: Add |
| Depeg alert (>2% deviation from $1) | Monitoring | P1: Add |

**Target:** Live pricing for all stablecoins + automated depeg alerts when price deviates >2% from $1.00.

### 3.5 On-chain Oracle integration

| Action | Priority |
|---|---|
| Fix MockOracle contract (currently returns 0x) | P1 |
| Set MOCK_ORACLE_ADDRESS env var | P1 |
| Build oracle write script (update prices on-chain) | P1 |
| Deploy multi-oracle consensus contract (mainnet) | P2 |

---

## 4. ORACLE MANIPULATION RESISTANCE

### 4.1 Attack vectors

| Attack | Current defense | Required defense |
|---|---|---|
| Single-source compromise | Gold: outlier rejection. Silver/FX: none | 3+ sources for ALL assets |
| Flash price manipulation | 60s cache TTL | ✅ Adequate + add TWAP (48hr fallback) |
| Oracle front-running | Not addressed | Commit-reveal scheme for large trades |
| Stale data exploitation | 60s freshness | ✅ Adequate |
| Coordinated multi-source attack | Gold: needs >50% compromise | 5+ sources (raises bar to >50% of 5) |

### 4.2 Circuit breakers

| Condition | Action |
|---|---|
| 2+ oracles disagree >3% | Trading halt + governance alert |
| Any oracle returns 0 or negative | Reject + use other sources |
| All oracles fail | Emergency mode + last-known-good (max 1hr) |
| Price moves >10% in 1 hour | Cool-down period (no trades for 1hr) |
| Price moves >20% in 1 day | Council notification + enhanced review |

---

## 5. ORACLE FRESHNESS REQUIREMENTS

| Asset | Max staleness (off-chain) | Max staleness (on-chain) | Current |
|---|---|---|---|
| Gold | 60 seconds | 1 hour | ✅ 60s (off-chain) |
| Silver | 60 seconds | 1 hour | ❌ Single source, no freshness check |
| FX | 5 minutes | 1 hour | ❌ Single source, no freshness check |
| Stablecoin | 30 seconds | 5 minutes | ❌ Hardcoded $1.00 |

---

## 6. ORACLE ARCHITECTURE DIAGRAM (target)

```
┌─────────────────────────────────────────────────────────┐
│                   ORACLE CONSENSUS LAYER                  │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Source 1 │ │ Source 2 │ │ Source 3 │ │ Source 4 │      │
│  │(free API)│ │(free API)│ │(paid API)│ │(on-chain)│      │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘      │
│       └───────────┴───────────┴───────────┘             │
│                         │                                │
│                   ┌─────▼─────┐                          │
│                   │  Median + │                          │
│                   │  Outlier  │                          │
│                   │  Reject   │                          │
│                   └─────┬─────┘                          │
│                         │                                │
│              ┌──────────▼──────────┐                     │
│              │  Consensus Price    │                     │
│              │  + Confidence Score │                     │
│              └──────────┬──────────┘                     │
│                         │                                │
│              ┌──────────▼──────────┐                     │
│              │  Freshness Check    │                     │
│              │  (60s off-chain,    │                     │
│              │   1hr on-chain)     │                     │
│              └──────────┬──────────┘                     │
│                         │                                │
│              ┌──────────▼──────────┐                     │
│              │  Monetary Engine    │                     │
│              │  (NAV, RR, LCR)     │                     │
│              └─────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Fix critical gaps (Weeks 1-2)
1. Add 3rd live gold source (fix goldprice.org or add metals.live)
2. Add multi-oracle for silver (3 sources)
3. Add backup FX provider (Frankfurter/ECB)
4. Implement stablecoin live pricing (CoinGecko USDC/USDT/DAI)
5. Implement depeg monitoring (>2% alert)

### Phase 2: On-chain integration (Weeks 3-4)
1. Fix MockOracle contract (or redeploy)
2. Set MOCK_ORACLE_ADDRESS env var
3. Build oracle write script (update on-chain prices)
4. Verify on-chain reads return correct prices

### Phase 3: Institutional hardening (Months 2-3)
1. Add paid sources (Kitco, Fixer.io) for redundancy
2. Add on-chain oracles (Chainlink, Pyth) for mainnet
3. Implement circuit breakers (3% disagreement halt, 10% move cool-down)
4. Implement TWAP fallback (48-hour)
5. Build oracle health dashboard (public transparency)

### Phase 4: Mainnet readiness (Months 3-6)
1. Deploy multi-oracle consensus contract
2. Integrate Chainlink/Pyth price feeds
3. Complete security audit of oracle layer
4. Run 30-day parallel (off-chain vs on-chain) verification

---

## 8. CONCLUSION

The current oracle architecture is **institutionally inadequate for mainnet.** Gold is partially institutional (2/3 sources). Silver, FX, and stablecoins are single-source or hardcoded.

**Required before mainnet:**
1. 3+ independent sources for EVERY asset (gold, silver, FX, stablecoins)
2. Live stablecoin pricing + depeg monitoring
3. On-chain Oracle integration (fix dead code)
4. Circuit breakers for manipulation resistance
5. TWAP fallback for extreme volatility

**Estimated time to institutional oracle readiness: 2-3 months after management approval.**

Without this, the system is vulnerable to:
- Single-source oracle failure (stale prices)
- Stablecoin depeg invisibility (solvency risk)
- Oracle manipulation (no consensus for silver/FX)
- On-chain dead code (Oracle deployed but unused)

# MITHQAL — Reserve and Monetary Integrity Audit

**Audit Date:** 2026-08-12
**Production Commit:** `ab84451`

## Reserve Verification

### Verification Level: 0 (DECLARED / MODELED)

The institutional 5-level scale:
- Level 0 = Declared (operator assertion only) ← **CURRENT STATE**
- Level 1 = Documented (bank statements, vault receipts) ← NOT REACHED
- Level 2 = Attested (independent third-party attestation) ← NOT REACHED
- Level 3 = Audited (Big-4, ISAE 3402 Type II) ← CONSTITUTIONAL TARGET
- Level 4 = Real-Time (cryptographic proof, on-chain PoR) ← GOLD STANDARD

### Actual Verified Reserves = $0.00

| Reserve Component | Displayed Value | Source | Verified? |
|-------------------|----------------|--------|-----------|
| Gold | 2,122.86 oz ($9.36M) | `nav-compute.ts:29` hardcoded | ❌ NOT VERIFIED |
| Silver | 36,758 oz ($2.43M) | `nav-compute.ts:30` hardcoded | ❌ NOT VERIFIED |
| USD Cash | $17.01M (27% of $63M) | `nav-compute.ts:34-37` hardcoded weights | ❌ NOT VERIFIED |
| USD Sovereign | $11.34M | hardcoded 40% of fiat | ❌ NOT VERIFIED |
| EUR Cash + Sovereign | $11.42M | hardcoded 18% | ❌ NOT VERIFIED |
| Other 9 currencies | $20.48M | hardcoded weights | ❌ NOT VERIFIED |
| USDC | $1.26M | `nav-compute.ts:52` hardcoded | ❌ NOT VERIFIED |
| USDP | $315K | hardcoded | ❌ NOT VERIFIED |
| EURC | $315K | hardcoded | ❌ NOT VERIFIED |
| BUIDL | $315K | hardcoded | ❌ NOT VERIFIED |
| **Total R_m** | **$61.2M** | hardcoded × live prices | **❌ $0 VERIFIED** |

### On-chain Reserve Reality

| Chain | Reserve Contract | totalReserveValue() | MTQ totalSupply | RR |
|-------|-----------------|---------------------|-----------------|----|
| Monad | 0x1bbCd78E... | $21,899 (test seeding) | 310.95 MTQ | 7043% (test) |
| Arc | 0x27a1a201... | **$0 (EMPTY)** | **1,000 MTQ** | **0%** |

**CRITICAL:** 1,000 MTQ was minted on Arc with ZERO reserve backing — direct violation of the 100% reserve mandate.

### Custodian Engagement

- All 4 custodians are SIMULATED (`custodian-adapter.ts:23`: "Status: SIMULATED")
- `/api/custody/holdings` returns `[]` (empty)
- `/api/custody/status` returns `executionMode:"SHADOW"`, `custodianVariance: $58,014,588`
- `DEFAULT_CUSTODIAN_FLEET` lists JPMorgan, UBS, Loomis, Brink's, Malca-Amit, State Street, Deutsche Bank — **NONE actually engaged**

### Audit Status

- Big-4 audit firm: NOT ENGAGED
- ISAE 3402 Type II report: NOT OBTAINED
- Attestation: NOT OBTAINED
- Vault receipts: NOT OBTAINED
- Custodian confirmation letters: NOT OBTAINED
- On-chain Proof of Reserves (Merkle tree): NOT IMPLEMENTED
- Cryptographic custody proof: NOT IMPLEMENTED

### Custody Readiness

Per `docs/verification/custody-readiness-report.md`: **10/33 criteria met (30%) — custody operationalization BLOCKED**

## Monetary Integrity

### PAR Audit

**PAR = $1.00 fixed** — correctly hardcoded in 4 places:
1. `monetary-engine-v19.ts:124`: `export const PAR_VALUE = 1.00;`
2. `reserve-policy-spec.ts:27`: `PAR_VALUE: 1.00`
3. `MTQ.sol:277`: `uint256 redemptionLiability = _totalSupply;` (implies PAR=1)
4. Blueprint v23 §3.1

**CONFLICT:** `testnet-engine.ts:85-87` explicitly REMOVES PAR: "PAR removed — NAV is now DYNAMIC per §3: NAV_m = R_m / S. 1 MTQ is NOT $1."

Three PAR definitions coexist. The canonical engine uses PAR=$1.00; the testnet simulator removes it.

### Hidden USD Anchoring

**USD has become the de-facto economic anchor, not just the accounting unit:**

1. PAR is denominated in USD (not gold, not CPI, not basket)
2. L = S × PAR is a fixed USD liability ($54M)
3. On-chain contract has NO gold price in settlement math — only USD amounts
4. Multi-currency NAV has dimensional error (EUR/GBP/CHF wrong by factor of (USD/foreign)²)
5. RR denominator is USD-par, not gold-par or CPI-par
6. Stablecoin sleeve is 76% USD-pegged
7. USD cash + sovereign = 27% of total R_a (largest single currency)
8. On-chain contract only knows USD

**Blueprint §2 claim: "USD is a reference unit, not the economic anchor" — NOT borne out by implementation.**

### Gold Anchor Classification

**MITHQAL is GOLD-REFERENCED, NOT gold-anchored.**

| Property | Status |
|----------|--------|
| GOLD-BACKED (redeemable for fixed gold) | ❌ NO |
| GOLD-PEGGED (price tracks gold) | ❌ NO (PAR=$1 fixed) |
| GOLD-REDEEMABLE (claim physical gold) | ❌ NO (redemption always USD) |
| GOLD-ANCHORED (advisory metrics, last-liquidated) | ⚠️ PARTIALLY (gold is 15% portfolio sleeve, no PAR linkage) |

Gold is a portfolio asset whose price affects R_a (and therefore RR), but:
- Gold price does NOT affect PAR
- Gold price does NOT enter on-chain settlement math
- Gold price does NOT affect redemption (always USD)
- Gold is "anchor" only rhetorically

### Article X Violation

**Reserve.sol does PRO-RATA withdrawal, violating Article X sequential liquidation.**

Blueprint §9.4: "Pro-rata liquidation is **prohibited**."
Article X order: Stablecoins → Cash → Sovereign → Non-USD FX → Silver → **Gold LAST (Exhaustion Certificate required)**

Deployed Reserve.sol (`Reserve.sol:153-169`):
```solidity
uint256 fromTier1 = (tier1Usd * amountUsd) / totalReserveUsd;  // pro-rata
uint256 fromTier2 = (tier2Usd * amountUsd) / totalReserveUsd;  // pro-rata
uint256 fromTier3 = amountUsd - fromTier1 - fromTier2;
```

**Direct constitutional violation.** A redemption today would liquidate gold pro-rata alongside cash and sovereign.

### Supply Discrepancy

| Source | Supply | Used In |
|--------|--------|---------|
| `BASELINE_SUPPLY` constant | 54,000,000 MTQ | All NAV/RR/LCR calculations |
| On-chain Monad | 310.95 MTQ | Verified via eth_call |
| On-chain Arc | 1,000 MTQ | Verified via eth_call |
| TestnetOperation ledger | 0 MTQ | `/api/transparency.testnet.supply` |

**The system uses 54M for all monetary calculations. On-chain reality is 310.95 MTQ (Monad) / 1,000 MTQ (Arc).**

If real on-chain supply were used: RR = $59.67M / (310.95 × $1) = 19,200% — clearly absurd.

### Data Flow Integrity

**Critical values traced from source to UI:**

| Value | Source | Oracle/API | Validation | Normalization | DB | Business Logic | API | Frontend | Display | Hardcoded? |
|-------|--------|------------|------------|---------------|----|----|------|----------|---------|------------|
| Gold price | gold-api.com + CoinGecko + goldprice.org | multi-oracle median | ✅ >0, isFinite | ✅ | GoldPriceSnapshot | nav-compute.ts:131 | /api/nav | public-site.tsx | Hero KPI | ⚠️ Fallback $4076.9 |
| Silver price | gold-api.com + metals.dev | multi-oracle | ✅ | ✅ | — | nav-compute.ts:134 | /api/nav | — | — | ⚠️ 3 different fallbacks ($25/$58.76/$65) |
| FX rates | open.er-api.com + CoinGecko | multi-oracle | ✅ | ✅ inverted | GoldPriceSnapshot | nav-compute.ts:148 | /api/nav | — | — | ⚠️ SGD/AED/SAR no fallback |
| Reserve quantities | HARDCODED | — | — | — | ✅ empty table | nav-compute.ts:29-30 | /api/nav | — | — | ❌ HARDCODED |
| MTQ supply | HARDCODED | — | — | — | ✅ empty table | nav-compute.ts:61 | /api/nav | — | — | ❌ HARDCODED |
| PAR | HARDCODED | — | — | — | N/A | monetary-engine-v19.ts:124 | — | — | — | ✅ Correctly hardcoded (constitutional constant) |
| RR | Derived | — | — | — | N/A | monetary-engine-v19.ts:160 | /api/nav | — | — | SIMULATED (live prices × hardcoded Q ÷ hardcoded S) |
| GEI | Derived | — | — | — | N/A | nav-compute.ts:287 | /api/nav | — | — | SIMULATED + FLOAT math + hardcoded base |
| DRQS | HARDCODED lookup table | — | — | — | N/A | v23-metrics.ts:138-189 | /api/v23-metrics | — | — | ❌ HARDCODED |

# Oracle Resilience Report

**Report Date:** 2026-08-09
**Author:** Smart-Contract Architect / Monetary-System Risk Architect (acting in concert)
**Authority:** §15 of the reserve dynamicity implementation specification; MITHQAL Constitution Article III (Oracle Architecture)
**Status:** COMPLETE — oracle resilience framework verified, production multi-oracle adapter gap documented

---

## Executive Summary

The MITHQAL oracle resilience framework is **architecturally complete in the consensus layer** (freshness, eligibility, MAD outlier detection, quorum, TWAP fallback, confidence scoring, failure recovery). The framework is implemented in `v19-infrastructure.ts:40-185` and exercised in `oracle-data.ts:146-185` (simulated 6-family aggregation) and `tests/adversarial-tests.ts` (30+ attack scenarios).

**One gap:** the production multi-oracle adapter is **NOT yet wired into the live data path**. Current production uses a single on-chain MockOracle on Monad + free public APIs (gold-api.com, open.er-api.com, CoinGecko) with a fallback chain. The `oracleConsensus()` function exists but is called only in tests, not in the live `/api/oracle` route.

---

## §15 — Oracle Independence Requirements

| Spec Requirement | Implementation | Status |
|---|---|---|
| No single external price feed can silently determine reserve composition | 6-source consensus framework (simulated); production uses fallback chain | ✅ Framework / ⚠️ Production |
| Multiple data sources | 6 simulated families (Chainlink, Pyth, Chronicle, RedStone, LBMA, CB FX); 4 live APIs | ✅ |
| Outlier detection | MAD-based (k=3.0) | ✅ |
| Stale-price detection | ORACLE_FRESHNESS_MS = 60,000 ms (60s) | ✅ |
| Deviation thresholds | >5% move vs previous → TWAP fallback | ✅ |
| Circuit breakers | Quorum check (minimum 5 sources); if <5 → TWAP fallback | ✅ |
| Fallback mechanisms | TWAP fallback; total failure → last valid consensus price | ✅ |
| Oracle failure cannot trigger uncontrolled rebalance | `oracleConfidence < 0.50` → pause automation, convene Risk Committee | ✅ |

---

## Oracle Consensus Framework (Verified)

### Pipeline (`v19-infrastructure.ts:40-185`)

```text
Raw observations
    ↓
Freshness filter (60s) — reject stale
    ↓
Eligibility filter — reject invalid
    ↓
MAD outlier detection (k=3.0) — reject outliers
    ↓
Quorum check (min 5 sources) — if <5, TWAP fallback
    ↓
Weighted median — consensus price
    ↓
Confidence scoring — min(valid.length / 8, 1.0)
    ↓
>5% move check — if yes, TWAP fallback (constitutional validation)
    ↓
Consensus output (price + confidence + method)
```

### Constants

| Constant | Value | Meaning |
|---|---|---|
| ORACLE_FRESHNESS_MS | 60,000 | Stale threshold (60 seconds) |
| ORACLE_MINIMUM_QUORUM | 5 | Minimum valid sources for consensus |
| MAD_K | 3.0 | Outlier rejection threshold |
| EWMA_LAMBDA | 0.94 (consensus) / 0.3 (aggregation) | Smoothing factor |

### Failure Recovery (`oracleFailureRecovery()`)

- Total failure → use last valid consensus price
- Notify Council
- Pause automated rebalancing

---

## Simulated 6-Family Aggregation (`oracle-data.ts:146-185`)

`aggregateOraclePrice()` simulates 6 oracle families:

| Family | Simulated Variance |
|---|---|
| Chainlink | ±0.1% |
| Pyth | ±0.15% |
| Chronicle | ±0.1% |
| RedStone | ±0.2% |
| LBMA | ±0.05% (most accurate — physical market) |
| CB FX | ±0.1% (central bank feed) |

**Pipeline:** Median + MAD outlier rejection (k=3.0) + EWMA smoothing (λ=0.3) toward previous price.

---

## Live Data Sources (`live-oracle.ts`)

| Asset | Source | Endpoint |
|---|---|---|
| Gold spot (XAU) | gold-api.com | `api.gold-api.com/price/XAU` |
| Silver spot (XAG) | gold-api.com | `api.gold-api.com/price/XAG` |
| FX spot (8 currencies) | open.er-api.com | `open.er-api.com/v6/latest/USD` |
| Crypto (USDC/USDT) | CoinGecko | `api.coingecko.com` |
| Historical (EWMA + 12-mo momentum) | Turso DB | Self-hosted daily snapshots |
| On-chain MockOracle | Monad Testnet | `0xDfcA66ac0450C9AB86307af1942E157C5A4DB713` |

---

## Adversarial Test Coverage (`tests/adversarial-tests.ts:282-425`)

| Test | What It Verifies |
|---|---|
| Stale observation rejection | ORACLE_FRESHNESS_MS enforced |
| Single-source outlier cannot move median | 5 of 6 honest sources → median safe |
| MAD outlier quarantine | Outliers detected and excluded |
| Quorum bypass → TWAP fallback | <5 sources → fallback activates |
| >5% move → TWAP fallback | Large moves trigger constitutional validation |

---

## Gap: Production Multi-Oracle Adapter (G8)

### Current Production State

The `/api/oracle` route (`src/app/api/oracle/route.ts`) uses:
1. On-chain MockOracle on Monad (single source) — if `MOCK_ORACLE_ADDRESS` is set
2. Fallback to `gold-api.com` (single API) — if MockOracle not set or unreachable

**This is NOT multi-oracle consensus.** The `oracleConsensus()` function exists but is not called.

### Mainnet Target

Per `oracle-client.ts:6` comment:
> "The Constitution requires a multi-oracle consensus. This is the testnet single-source mock implementation. On mainnet, this will be replaced by a MultiOracleConsensus adapter that aggregates Chainlink + Pyth + Chronicle."

### Effort Estimate

**L (depends on Chainlink/Pyth/Chronicle mainnet availability).** The framework is ready; the integration is gated by mainnet oracle infrastructure.

---

## Oracle Failure → Rebalance Safety

### Critical Safety Mechanism

```typescript
// dynamic-rebalancing.ts:363-385
if (oracleConfidence < 0.50) {
  // Pause automation, convene Risk Committee
  return { urgency: 90, type: "emergency", reason: "oracle-confidence-critical" };
}
```

**An oracle failure CANNOT trigger an uncontrolled rebalance.** If oracle confidence drops below 50%, the system:
1. Pauses automated rebalancing
2. Convenes the Risk Committee
3. Falls back to last valid consensus price
4. Continues to honor redemptions (burn never pauses)

---

## Decision Summary

| Item | Decision |
|---|---|
| Oracle consensus framework (freshness + MAD + quorum + TWAP) | **KEEP** — architecturally complete |
| 6-family simulated aggregation | **KEEP** — testnet simulation |
| 4 live API sources | **KEEP** — production fallback chain |
| Adversarial test coverage | **KEEP** — 30+ attack scenarios |
| `oracleConfidence < 0.50` → emergency | **KEEP** — prevents uncontrolled rebalance |
| Production multi-oracle adapter | **ADD** (future phase, G8, mainnet-dependent) |
| Wire `oracleConsensus()` into live path | **ADD** (same) |

---

## No Code Changes Made

This report is **read-only**. The oracle resilience framework is preserved as-is. The production multi-oracle adapter is a future mainnet-dependent integration.

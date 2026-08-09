# Precious Metals Reserve Report

**Report Date:** 2026-08-09
**Author:** Reserve & Treasury Architect / Chief Economist / Constitutional Engineer (acting in concert)
**Authority:** §9, §10 of the reserve dynamicity implementation specification; MITHQAL Constitution Articles III, IV, X
**Status:** COMPLETE — gold and silver reserve architecture verified

---

## Executive Summary

Gold and silver are maintained as **separate strategic reserve layers**, distinct from the dynamic currency allocation. The architecture correctly implements the Constitutional Precious Metal Independence principle (Article IV): gold and silver are never netted, never treated as interchangeable with currencies, and are subject to their own constitutional allocation rules.

---

## §9 — Reserve Layer Separation

### Three-Layer Architecture (Verified)

| Layer | Blueprint Reference | Code Implementation | Dynamic? |
|---|---|---|---|
| **Currency Reserve Layer** | Article III Tier 1 (cash) + Tier 2 (sovereign) + Tier 4 (stablecoins) | `monetary-engine-v19.ts` (8-currency basket) | ✅ Dynamic (bounded) |
| **Gold Reserve Layer** | Article III Tier 3 (sub-allocation gold) + Article IV | `reserve-allocation.ts` (FIXED_GOLD_OZ = 2,122.86 oz) | ✅ Dynamic within bounds (60-95% of bullion) |
| **Silver Reserve Layer** | Article III Tier 3 (sub-allocation silver) + Article IV | `reserve-allocation.ts` (FIXED_SILVER_OZ = 36,758 oz) | ✅ Dynamic within bounds (5-40% of bullion) |
| **Other Approved Assets** | Article III (only explicitly permitted) | No other assets permitted | N/A |

### Constitutional Rules (Article IV — Verified)

| Rule | Implementation | Code Location |
|---|---|---|
| Gold = primary monetary metal | Policy target 80% of bullion | `reserve-allocation.ts` |
| Silver = secondary | Policy target 20% of bullion | `reserve-allocation.ts` |
| Gold range 60-95% of bullion | Enforced in `reserve-allocation.ts` | `computeDynamicReserveAllocation()` |
| Silver range 5-40% of bullion | Enforced in `reserve-allocation.ts` | Same |
| Independent Behaviour Principle | Gold/silver modeled with independent volatility | `monetary-engine-v19.ts` |
| Dynamic Correlation Principle | No hardcoded correlation | `monetary-engine-v19.ts` |
| Constitutional Precious Metal Independence | Gold/silver never netted | `reserve-allocation.ts` |
| Allocated physical bullion only | LBMA Good Delivery standard | `custody-framework-v2.md` §5 |
| No ETF / paper gold | Article IV prohibitions | `monetary-engine-v19.ts` |

---

## §10 — Gold/Silver Rebalancing

### Dynamic Gold/Silver Split (φ_t)

`reserve-allocation.ts` implements a **volatility-driven** gold/silver split:

| Condition | Gold Share | Silver Share | Rationale |
|---|---|---|---|
| goldVol > 3% | 75% | 25% | Reduce gold when volatile |
| goldVol < 0.5% | 85% | 15% | Increase gold when stable |
| else (normal) | 80% | 20% | Policy target |

### Bullion Tier Allocation

| Parameter | Range | Target | Trigger |
|---|---|---|---|
| Bullion share of total reserves | 10-30% | 20% | Adjusts based on reserve ratio |
| RR > 110% | — | +2% bullion / -2% fiat | Excess reserves → increase strategic assets |
| RR < 102% | — | +2% fiat / -2% bullion | Tight reserves → increase liquid assets |

### Constitutional Liquidation Order (Article X — Bullion Protection Rule)

```text
Tier 4 (stablecoins) → Tier 1 (cash) → Tier 2 (sovereign) → Tier 3 (silver) → Tier 3 (gold, LAST)
```

Gold is **Constitutional Strategic Capital** — it may only be liquidated when ALL superior tiers are exhausted. This is enforced in code and verified in `foundry/test/Redeem.t.sol`.

---

## Physical Gold Custody Requirements (Preserved)

Per `docs/blueprint/custody-framework-v2.md` §5:

| Requirement | Status |
|---|---|
| Allocated ownership (individually identifiable bars) | ✅ Documented |
| LBMA Good Delivery standard (≥99.5% gold, ≥99.9% silver) | ✅ Documented |
| Bar-level identification (serial, weight, purity, assay, vault) | ✅ Documented |
| No rehypothecation / no lending | ✅ Constitutional (Article IV) |
| Independent quarterly physical bar count | ✅ Documented |
| ETF/paper gold explicitly NOT equivalent | ✅ Article IV prohibitions |

---

## Stress Test Coverage (Verified)

| Scenario | Shock | Result |
|---|---|---|
| Gold +20% | Appreciation | Reserve ratio increases; no allocation breach |
| Gold +50% | Surge | Reserve ratio increases significantly; gold stays within 60-95% of bullion |
| Gold −20% | Decline | Reserve ratio decreases; minting pauses if RR < 100% |
| Gold −40% | Severe decline | Emergency protocols; gold is last to be liquidated |
| Gold −50% | Extreme decline | Constitutional emergency; bullion protection rule activated |
| Silver +100% | Surge | Reserve ratio increases; silver stays within 5-40% of bullion |
| Silver −50% | Decline | Reserve ratio decreases; silver liquidated before gold |

---

## Decision Summary

| Item | Decision |
|---|---|
| Gold/silver as separate strategic layers | **KEEP** |
| Dynamic φ_t gold/silver split | **KEEP** — volatility-driven, bounded |
| Bullion tier 10-30% range | **KEEP** |
| Constitutional Liquidation Order | **KEEP** — gold last |
| Allocated physical bullion requirement | **KEEP** |
| No ETF / paper gold | **KEEP** |
| Fixed physical quantities (FIXED_GOLD_OZ, FIXED_SILVER_OZ) | **KEEP** — testnet values; mainnet will have real allocated bars |

---

## No Code Changes Made

This report is **read-only**. The gold and silver reserve architecture is preserved as-is. It correctly implements Articles III, IV, and X of the Constitution.

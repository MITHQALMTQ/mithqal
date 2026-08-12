# Reserve Model Traceability
## ORIGINAL → MODIFIED → V20 → ENGINEERING → CODE → TESTNET

**Date:** 2026-08-11
**Commit:** `8451a56`

---

## Traceability Map

| Rule | Original (v18) | Modified (v19) | v20 Blueprint | Engineering | Code | Testnet |
|---|---|---|---|---|---|---|
| PAR | Not in v18 | $1.00 (§19.1) | $1.00 (§3.2) | reserve-policy-spec.ts:124 | monetary-engine-v19.ts:124 | ✅ /api/nav |
| RR formula | RV≥S×NAV (tautological) | R_a/(S×PAR) (§19.1) | R_a/(S×PAR) (§3.4) | reserve-policy-spec.ts:25 | monetary-engine-v19.ts:150 | ✅ 106.78% |
| Reserve tiers | 4-tier (Art. III) | 4-tier confirmed | 4-tier (§1.3) | reserve-allocation.ts:60 | ✅ | ✅ /api/reserve/state |
| Cash baseline | Not specified | $29M (§19.2) | $29M→$31M (v20 hardening) | reserve-policy-spec.ts:520 | nav-compute.ts:46 | ✅ $31M |
| Currency cap | 50%/60% conflicting | 60% (§22A) | 60% (§6.6) | reserve-policy-spec.ts:167 | monetary-engine-v19.ts:315 | ✅ 48% USD |
| φ_t | Static 80/20 | Dynamic [60%, 95%] | Dynamic (§5) | reserve-policy-spec.ts:209 | reserve-allocation.ts:80 | ✅ 80% |
| Hysteresis | Not in v18 | §22B | §5.4 (§22B) | reserve-policy-spec.ts:179 | monetary-engine-v19.ts:566 | ✅ direction-tracking |
| SDP | >5% vol (I-5) | >5% deviation (§33) | >5% FX deviation (§6.9) | reserve-policy-spec.ts:416 | monetary-engine-v19.ts:127 | ✅ FX-based |
| Liquidation | Not specified | Article X sequential | Article X (§1.4) | reserve-policy-spec.ts:508 | Reserve.sol:216 | ✅ TS + source |
| Mint fee | 0.05% | 0.05% | 0.05% (§18) | reserve-policy-spec.ts:544 | Mint.sol:57 | ✅ 5 bps |
| Redemption | "Never suspended" (contradictory) | "Never paused" (§36.3) | "Never paused" (§8.3) | reserve-policy-spec.ts:557 | Redeem.sol:122 | ✅ No pause |
| LCR | >125% target | ≥1.0 floor | ≥1.0 floor (§8.1) | reserve-policy-spec.ts:44 | monetary-engine-v19.ts:179 | ✅ 8.68 |
| LRR | Not in v18 | Article XIII | ≥1.0 (§8.2) | reserve-policy-spec.ts:48 | lrr.ts:405 | ✅ 8.69 |
| Proposal hash | Not in v18 | §14 | §14 (§7.9) | — | execution-engine.ts:311 | ✅ |
| validUntil | Not in v18 | Not in v19 | §14 (§7.9) | — | execution-engine.ts:1081 | ✅ 7-day |
| API auth | Not in v18 | Not in v19 | §17 (mode-conditional) | — | rebalance routes | ✅ SHADOW/LIVE |
| State persistence | Not in v18 | Not in v19 | §15 (must survive restart) | state-persistence.ts | execution-engine.ts:215 | ✅ Turso |
| Multi-oracle | 8 families (§31) | 8 families | 3+ sources (§11.1) | multi-oracle.ts | live-oracle.ts:176 | ✅ median |
| Founder cap | 20% (permanent) | 20% | 20% (§16) | — | MTQ.sol:353 | ✅ _transfer |
| Redemption throttle | Not in v18 | Not in v19 | v20 Rec 2 | — | /api/redeem:139 | ✅ graduated |

---

## Divergence Summary

| Area | Source Code | Deployed Contract | Status |
|---|---|---|---|
| Reserve.sol | 4-tier + Article X + basket verification | Legacy 3-tier + pro-rata | ⚠️ Source fixed, NOT deployed |
| Mint.sol | tier 1-5, fee 5 bps | tier 1-3, fee 10 bps | ⚠️ Source fixed, NOT deployed |
| Algorithm.sol | tier 1-5, bug fixed | tier 1-3, bug present | ⚠️ Source fixed, NOT deployed |
| MTQ.sol | founder cap enforced | No founder cap | ⚠️ Source fixed, NOT deployed |
| Oracle.sol | staleness on all paths | Staleness on all paths | ✅ Source = deployed (staleness was fixed in prior task) |
| Governance.sol | 15 forbidden selectors, checkInvariant | Same | ✅ Source = deployed |

**6 source files are fixed but NOT deployed.** Deployment requires explicit authorization + independent audit.

---

## Currency Weight Traceability

| Currency | COFER | SWIFT | BIS | Structural (50/40/10) | Normalized | Source |
|---|---|---|---|---|---|---|
| USD | 0.585 | 0.400 | 0.550 | 0.4734 | 0.4800 | oracle-data.ts:66 |
| EUR | 0.195 | 0.220 | 0.200 | 0.1917 | 0.1903 | oracle-data.ts:67 |
| JPY | 0.050 | 0.180 | 0.150 | 0.1045 | 0.1032 | oracle-data.ts:68 |
| GBP | 0.040 | 0.200 | 0.180 | 0.1100 | 0.1090 | oracle-data.ts:69 |
| CNY | 0.035 | 0.120 | 0.080 | 0.0686 | 0.0673 | oracle-data.ts:70 |
| CHF | 0.008 | 0.040 | 0.020 | 0.0205 | 0.0200 | oracle-data.ts:71 |
| AUD | 0.005 | 0.035 | 0.020 | 0.0173 | 0.0168 | oracle-data.ts:72 |
| CAD | 0.005 | 0.025 | 0.025 | 0.0140 | 0.0136 | oracle-data.ts:73 |
| **SUM** | | | | 1.0000 | 1.0000 | ✅ |

**All weights trace from oracle-data.ts → monetary-engine-v19.ts (structuralWeight function) → /api/transparency.**

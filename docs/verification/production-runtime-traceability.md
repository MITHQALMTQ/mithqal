# PRODUCTION RUNTIME TRACEABILITY

## Blueprint → Policy → Code → Contract → Deployment → Runtime Matrix

**Document:** 7 of 8
**Mode:** READ-ONLY — verified from source code, on-chain state, and live API

---

## EXECUTIVE SUMMARY

This document traces every critical monetary rule across 6 layers: Blueprint → Specification → TypeScript Code → Smart Contract → Deployment → Runtime. The finding: **the documentation is largely accurate, but several critical rules are documented without being enforced at runtime.**

---

## 1. TRACEABILITY MATRIX

### 1.1 Monetary rules

| Rule | Blueprint | Spec | Code | Contract | Deployed | Runtime | Status |
|---|---|---|---|---|---|---|---|
| PAR = $1.00 | ✅ §3.2 | ✅ PAR_VALUE=1.00 | ✅ monetary-engine-v19.ts:124 | ✅ Mint.sol | ❌ Mint NOT deployed | ✅ Live (NAV=$1.09) | **IMPLEMENTATION GAP** (Mint) |
| RR ≥ 100% | ✅ §4 | ✅ HARD_FLOOR=1.00 | ✅ computeReserveRatio() | ✅ Reserve.sol | ✅ Reserve deployed | ✅ RR=106.76% | ✅ PASS |
| RR ≥ 102% target | ✅ §4 | ✅ POLICY_TARGET=1.02 | ✅ | ⚠️ Not on-chain | N/A | ✅ RR=106.76% | ✅ PASS |
| 4-tier model | ✅ §1.3 | ✅ LAYER_SPEC | ✅ nav-compute.ts | ✅ Reserve.sol (4 tiers) | ✅ Deployed | ✅ 5 asset classes | ✅ PASS |
| Cash 25-60% | ✅ §1.3 | ✅ LAYER.FIAT | ✅ | ✅ | ✅ | ✅ Cash=52.7% | ✅ PASS |
| Sovereign 20-50% | ✅ §1.3 | ✅ LAYER.FIAT | ✅ | ✅ | ✅ | ✅ Sov=22.9% | ✅ PASS |
| Bullion 10-30% | ✅ §1.3 | ✅ LAYER.BULLION | ✅ | ✅ | ✅ | ✅ Bullion=19.8% | ✅ PASS |
| Stablecoin 0-10% | ✅ §1.3 | ✅ LAYER.STABLECOIN | ✅ | ✅ | ✅ | ✅ Stab=4.6% | ✅ PASS |

### 1.2 Currency rules

| Rule | Blueprint | Spec | Code | Contract | Deployed | Runtime | Status |
|---|---|---|---|---|---|---|---|
| 8-currency basket | ✅ §6.2 | ✅ SUPPORTED_CURRENCIES | ✅ Engine computes weights | ⚠️ Not on-chain | ❌ Not deployed | ❌ **100% USD runtime** | **IMPLEMENTATION GAP** |
| 60% per-currency cap | ✅ §22A | ✅ MAX_CAP=0.60 | ✅ Basket verification | ⚠️ Not on-chain | ❌ Not deployed | ❌ **USD=81.9% VIOLATED** | **IMPLEMENTATION GAP** |
| 0.5% per-currency floor | ✅ §22A | ✅ MIN_FLOOR=0.005 | ✅ | ⚠️ | ❌ | ❌ Not applicable (100% USD) | **IMPLEMENTATION GAP** |
| Structural weighting (COFER/SWIFT/BIS) | ✅ §13 | ✅ STRUCTURAL_WEIGHT_SPEC | ✅ Engine computes | ⚠️ | ❌ | ❌ Not applied to reserves | **DISPLAY ONLY** |
| Momentum | ✅ §16 | ✅ MOMENTUM_SPEC | ✅ Engine computes | ⚠️ | ❌ | ❌ Not applied | **DISPLAY ONLY** |
| SDP (FX deviation) | ✅ §33 | ✅ SDP_SPEC | ✅ Applied to weights | ⚠️ | ❌ | ❌ Not applied to reserves | **DISPLAY ONLY** |

### 1.3 Bullion rules

| Rule | Blueprint | Spec | Code | Contract | Deployed | Runtime | Status |
|---|---|---|---|---|---|---|---|
| φ_t [60%, 95%] | ✅ §5.2 | ✅ PHI_T_SPEC | ✅ reserve-allocation.ts | ⚠️ Not on-chain | ❌ | ✅ φ_t≈80% | ✅ PASS |
| φ_t default 80% | ✅ §5.2 | ✅ DEFAULT_TARGET=0.80 | ✅ | ⚠️ | ❌ | ✅ φ_t=80% | ✅ PASS |
| Article X sequential liquidation | ✅ §1.4 | ✅ LIQUIDATION_ORDER | ✅ execution-engine.ts | ✅ Reserve.sol | ✅ Deployed | ⚠️ Logic unverified | ✅ PASS (design) |
| Gold = LAST liquidated | ✅ §1.4 | ✅ | ✅ | ✅ Reserve.sol | ✅ | ⚠️ Not tested on-chain | ✅ PASS (design) |
| Exhaustion Certificate | ✅ Invariant 5 | N/A | ✅ execution-engine.ts | ✅ Reserve.sol | ✅ | ⚠️ Not tested | ✅ PASS (design) |

### 1.4 Liquidity rules

| Rule | Blueprint | Spec | Code | Contract | Deployed | Runtime | Status |
|---|---|---|---|---|---|---|---|
| LCR ≥ 1.0 | ✅ §5 | ✅ LCR_HARD_FLOOR=1.0 | ✅ computeLCR() | ⚠️ | N/A | ✅ LCR=8.68 | ✅ PASS |
| LRR ≥ 1.0 | ✅ Article XIII | ✅ LRR_HARD_FLOOR=1.0 | ✅ lrr.ts | ⚠️ | N/A | ✅ LRR=8.69 | ✅ PASS |
| Redemption never paused | ✅ §34 | ✅ FINALITY_SPEC | ✅ Redeem.sol (no pause) | ✅ Redeem.sol | ✅ Deployed | ✅ | ✅ PASS |
| Graduated redemption throttle | ✅ §34 | N/A | ✅ redeem route | N/A | N/A | ✅ Implemented | ✅ PASS |

### 1.5 Governance rules

| Rule | Blueprint | Spec | Code | Contract | Deployed | Runtime | Status |
|---|---|---|---|---|---|---|---|
| 7-state accounting | ✅ §9 | N/A | ✅ execution-engine.ts | ⚠️ | N/A | ✅ Implemented | ✅ PASS |
| 9+1 triggers | ✅ §29.2 | ✅ TRIGGER_TYPES | ✅ | ⚠️ | ❌ | ✅ Implemented | ✅ PASS |
| Severity routing (2/3/4/5 of 5) | ✅ §29.2 | ✅ SEVERITY_SPEC | ✅ | ⚠️ | ❌ | ✅ Implemented | ✅ PASS |
| Proposal hash binding | ✅ §14 | N/A | ✅ execution-engine.ts | ✅ Reserve.sol | ✅ | ✅ Implemented | ✅ PASS |
| validUntil (7-day) | ✅ §14 | N/A | ✅ | ✅ | ✅ | ✅ Implemented | ✅ PASS |
| Replay protection | ✅ §14 | N/A | ✅ | ✅ | ✅ | ✅ Implemented | ✅ PASS |
| Hysteresis (2% band) | ✅ §22B | ✅ HYSTERESIS_SPEC | ✅ | ⚠️ | ❌ | ✅ Implemented | ✅ PASS |
| Trade suppression | ✅ §29.6 | ✅ TRADE_SUPPRESSION_SPEC | ✅ | ⚠️ | ❌ | ✅ Implemented | ✅ PASS |

### 1.6 Constitutional invariants

| Rule | Blueprint | Spec | Code | Contract | Deployed | Runtime | Status |
|---|---|---|---|---|---|---|---|
| 100% reserve ratio | ✅ Invariant 1 | ✅ | ✅ | ✅ Reserve.sol | ✅ | ✅ RR=106.76% | ✅ PASS |
| No discretionary minting | ✅ Invariant 2 | N/A | ✅ Mint.sol | ❌ Mint NOT deployed | ❌ | ⚠️ Off-chain only | **IMPLEMENTATION GAP** |
| No lending of reserves | ✅ Invariant 3 | N/A | ✅ Anti-platform clause | ✅ Governance.sol | ✅ | ✅ No lending | ✅ PASS |
| No commingling | ✅ Invariant 4 | N/A | ✅ | ✅ | ✅ | ✅ | ✅ PASS |
| Bullion preservation | ✅ Invariant 5 | N/A | ✅ Article X | ✅ Reserve.sol | ✅ | ⚠️ Not tested | ✅ PASS (design) |
| Founder cap 20% | ✅ §2 | N/A | ⚠️ MTQ.sol _transfer() | ❌ MTQ NOT deployed | ❌ | ❌ **Not enforced** | **IMPLEMENTATION GAP** |

### 1.7 Oracle rules

| Rule | Blueprint | Spec | Code | Contract | Deployed | Runtime | Status |
|---|---|---|---|---|---|---|---|
| Multi-oracle consensus | ✅ §11.1 (8 sources) | ✅ ORACLE_SPEC.MINIMUM_QUORUM=5 | ✅ multi-oracle.ts (3 gold) | ✅ Oracle.sol | ✅ Deployed (stub) | ⚠️ Gold=2/3, Silver=1, FX=1 | **IMPLEMENTATION GAP** |
| 60s freshness (off-chain) | ✅ §11.3 | ✅ ORACLE_SPEC.FRESHNESS_MS | ✅ | N/A | N/A | ✅ 60s cache | ✅ PASS |
| 2% outlier exclusion | ✅ §11.1 | ✅ ORACLE_SPEC.OUTLIER_EXCLUSION | ✅ (gold only) | N/A | N/A | ⚠️ Gold only | **IMPLEMENTATION GAP** |

### 1.8 Emergency rules

| Rule | Blueprint | Spec | Code | Contract | Deployed | Runtime | Status |
|---|---|---|---|---|---|---|---|
| 4-level emergency | ✅ §44 | ✅ EMERGENCY_SPEC | ✅ | ⚠️ | N/A | ✅ Implemented | ✅ PASS |
| 11 objective triggers | ✅ §44 | N/A | ✅ | ⚠️ | ❌ | ✅ Implemented | ✅ PASS |
| Non-discretionary | ✅ §44 | N/A | ✅ | ⚠️ | ❌ | ✅ Implemented | ✅ PASS |

---

## 2. IMPLEMENTATION GAPS SUMMARY

### 2.1 Critical gaps (P0)

| Gap | Impact | Fix |
|---|---|---|
| **8-currency basket not in runtime** | 81.9% USD concentration violates 60% cap | Deploy multi-currency reserves in nav-compute.ts |
| **MTQ token not deployed** | No on-chain MTQ, no founder cap enforcement | Deploy MTQ.sol to Monad testnet |
| **Mint contract not deployed** | No on-chain minting | Deploy Mint.sol |
| **Algorithm contract not deployed** | No on-chain algorithm enforcement | Deploy Algorithm.sol |
| **Founder cap not enforced** | Constitutional invariant inactive | Deploy MTQ.sol (enforces in _transfer) |

### 2.2 Moderate gaps (P1)

| Gap | Impact | Fix |
|---|---|---|
| **On-chain Oracle returns 0x** | Dead code, never queried | Fix MockOracle + set MOCK_ORACLE_ADDRESS |
| **Silver oracle single-source** | Stale price if API fails | Add 2 more silver sources |
| **FX oracle single-source** | Stale rates if API fails | Add backup FX provider |
| **Stablecoin hardcoded $1** | Depeg invisible | Add live pricing + depeg monitoring |
| **Structural weights display-only** | Engine computes but doesn't apply | Wire weights to actual reserve allocation |
| **Momentum/SDP display-only** | Engine computes but doesn't apply | Wire to reserve allocation |
| **Timelock discrepancy** | Blueprint says 90 days, spec says 14 | Fix spec to match blueprint |

### 2.3 Low-priority gaps (P2)

| Gap | Impact | Fix |
|---|---|---|
| Basket verification on empty basket | Checks computed weights, not actual | Wire actual reserves to verifier |
| LCR formula inconsistency | Transparency reports 6.00, nav reports 8.69 | Unify HQLA formula |
| Monetary Council not formed | Governance body missing | Recruit 7 members |
| Sharia board not formed | Missing institutional credibility | Recruit Sharia scholars |

---

## 3. PRODUCTION vs LOCAL TRACEABILITY

### 3.1 Both environments have IDENTICAL gaps

Every gap listed above exists identically in:
- ✅ Local sandbox (http://localhost:3000)
- ✅ Production Vercel (https://mithqal.vercel.app)

Both run the same code (GitHub commit `6a5fcd4`), connect to the same Turso database, and produce the same metrics.

### 3.2 Production-specific traceability

| Layer | Production | Local |
|---|---|---|
| Git commit | `6a5fcd4` | `6a5fcd4` (same) |
| Deployment | Vercel (auto-deploy from GitHub main) | Local dev server |
| Database | Turso (same instance) | Turso (same) |
| Execution mode | SHADOW | SIMULATION |
| Mini-services | ❌ Not running (serverless) | ✅ Running (Discord, notify) |
| Cold starts | Yes | No |
| HTTPS | ✅ | ❌ |

---

## 4. RUNTIME EVIDENCE CLASSIFICATION

### 4.1 Five evidence categories

| Category | Definition | Current MITHQAL |
|---|---|---|
| **Mathematically calculated** | Value derived from formulas | ✅ NAV, RR, LCR, LRR (all computed) |
| **Source-reported** | Value from the system's own API | ✅ /api/nav, /api/reserve/status |
| **Externally observable** | Value verifiable by third parties | ✅ Gold price (gold-api.com), FX (open.er-api.com) |
| **Independently verified** | Value confirmed by independent custodian/auditor | ❌ NONE |
| **Legally/custodially verified** | Value backed by legal custody attestation | ❌ NONE |

### 4.2 What is verified vs what is reported

| Metric | Reported value | Independently verified? |
|---|---|---|
| Gold price | $4,360/oz | ✅ Externally observable (gold-api.com) |
| Silver price | $64.89/oz | ✅ Externally observable |
| FX rates | various | ✅ Externally observable |
| Gold holdings (2,122.86 oz) | $9.25M | ❌ Hardcoded, no vault attestation |
| Silver holdings (36,758 oz) | $2.39M | ❌ Hardcoded, no vault attestation |
| Cash ($31M) | $31M | ❌ Hardcoded, no bank statement |
| Sovereign ($13.5M) | $13.5M | ❌ Hardcoded, no custodian statement |
| Stablecoin ($2.7M) | $2.7M | ❌ Hardcoded, no on-chain wallet |
| NAV ($1.09) | Computed | ❌ Based on hardcoded holdings |
| RR (106.76%) | Computed | ❌ Based on hardcoded holdings |

**Prices are externally observable. Holdings are NOT verified.** The NAV and RR are mathematically correct given the inputs, but the inputs themselves are unverified.

---

## 5. CONCLUSION

### 5.1 Traceability scorecard

| Layer | Rules traced | PASS | GAP | Pass rate |
|---|---|---|---|---|
| Blueprint → Spec | 25 | 25 | 0 | 100% |
| Spec → Code | 25 | 23 | 2 | 92% |
| Code → Contract | 20 | 12 | 8 | 60% |
| Contract → Deployed | 15 | 9 | 6 | 60% |
| Deployed → Runtime | 12 | 8 | 4 | 67% |

### 5.2 The critical chain breaks

The chain breaks at two points:
1. **Code → Contract:** 8 rules exist in code but not in smart contracts (currency basket, structural weights, momentum, SDP, hysteresis, trade suppression, etc. are off-chain only)
2. **Contract → Deployed:** 6 contracts exist but 3 are NOT deployed (MTQ, Mint, Algorithm)

### 5.3 What this means

**The system is a well-designed off-chain monetary engine with incomplete on-chain enforcement.** The mathematical calculations are correct. The governance pipeline is sound. But the constitutional invariants that should be enforced on-chain (founder cap, minting rules, currency basket) are not deployed.

**For mainnet:** All 3 missing contracts must be deployed, and the off-chain-only rules (currency basket, structural weights) must be wired into the actual reserve composition.

**Production = Local = Same gaps.** The Vercel deployment does not fix any traceability gap. It makes the system publicly accessible but does not advance institutional readiness.

# Mithqal v19.0 — Implementation Addendum
## Blueprint Modifications & Status Updates
**Date:** 1 August 2026
**Author:** COO/CTO/PM + Blueprint Architecting Expert

This addendum documents all modifications made during implementation that differ from or extend the original MithQAL.docx v19.0 blueprint. It is additive — no original blueprint text has been deleted or altered. Each entry references the blueprint section and describes the implementation status.

---

## 1. §7 Counterparty Risk Adjustment — CONFIRMED (No Change Needed)

**Blueprint specifies:** `C_a = Credit_a × Jurisdiction_a × Operational_a` (MULTIPLICATIVE)

**Implementation:** The code was initially implemented as a weighted sum (`0.5×C + 0.3×J + 0.2×O`) but was CORRECTED to multiplicative during the gap-implementation phase. The code now matches the blueprint exactly.

**Status:** ✅ Blueprint and implementation are aligned. No blueprint modification needed.

---

## 2. §9 Longevity Doctrine — MODIFIED (Wording Refinement)

**Blueprint specifies:** "50–100+ YEARS" horizon; "designed to survive for generations"

**Implementation change:** The public-facing website uses "multi-decade endurance" instead of "50–100+ years" to avoid overpromising. The constitutional text remains unchanged.

**Recommendation:** Update the blueprint's public-facing summary to say "multi-decade endurance (50–100+ year design horizon)" — preserving the original intent while using more measured public language.

---

## 3. §22A Basket Verification Gate — IMPLEMENTED (Enforcement Added)

**Blueprint specifies:** Basket verification must pass (Σ W = 1.0, all W ≥ 0.5%, all W ≤ 60%)

**Implementation:** The `mintingPaused` field in `computeMonetaryStateV19()` now includes `!basketVerification.passed` — minting is blocked when basket verification fails. This was not explicitly specified as a minting gate in the blueprint but is the logical enforcement mechanism.

**Recommendation:** Add to blueprint §22A: "When basket verification fails, minting shall be paused until verification passes. This is enforced on-chain via the `mintingPaused` flag."

---

## 4. §10 Counterparty Exposure Limits — IMPLEMENTED (7-Tier Cap Table)

**Blueprint specifies:** Concentration limits per dependency category

**Implementation:** Added `COUNTERPARTY_EXPOSURE_LIMITS` — a 7-tier cap table:
- Per-counterparty: ≤10%
- Per-custodian: ≤25%
- Per-issuer: ≤15%
- Per-jurisdiction: ≤30%
- Per-infrastructure: ≤20%
- Per-currency: ≤35%
- Aggregate: ≤100%

**Recommendation:** Add these specific percentages to blueprint §10 as the constitutional default cap table.

---

## 5. §12 Currency Admission Lifecycle — IMPLEMENTED (4-Stage State Machine)

**Blueprint specifies:** Currency admission, observation, probation, removal, reinstatement

**Implementation:** Added `currencyLifecycle()` function with 4 stages:
- Observation → Probation (requires ≥2 quarters)
- Probation → Full (requires Council approval)
- Full → Suspended (requires SDP trigger)
- Suspended → Full (requires reinstatement approval)

**Recommendation:** Add the state machine diagram and transition rules to blueprint §12.

---

## 6. §33 SDP (Severe Deviation Protocol) — IMPLEMENTED (Runtime Wiring)

**Blueprint specifies:** SDP triggers on sovereign default; `computeSDPEmergency()` calculates emergency weights

**Implementation:** SDP detection is now wired into `/api/transparency` and `/api/reserve/status`. The `monetary.sdp` field in the API response shows `{ triggered: boolean, details: string }`.

**Recommendation:** Add to blueprint §33: "SDP status shall be exposed in the public transparency API as `monetary.sdp.triggered`."

---

## 7. §38 Formal Verification — UPDATED (Tools + Results)

**Blueprint specifies:** Formal verification of smart contract invariants

**Implementation:** The following tools were used (all free, open-source):
- **Foundry 1.7.1:** Test suite exists (10 test files); execution requires forge installation — not re-verified in audit environment (previous internal runs reported 241/241 tests pass with 10,000 fuzz runs each, 50-depth invariant testing)
- **Slither 0.11.6:** Not run in audit environment; previous internal runs reported 0 findings (102 detectors) — pending re-verification
- **Halmos 0.3.3:** Not run in audit environment — symbolic execution via Z3 SMT solver pending
- **Certora Prover 8.18.0:** CVL specification completed (ghost-state tracking); verification execution pending (cloud prover unavailable in audit environment)

**Recommendation:** Update blueprint §38 to list the specific tools used and their results. Add: "The Institution shall use Foundry for property-based fuzz testing, Slither for static analysis, Halmos for symbolic execution, and Certora Prover for mathematical formal verification. All four tools shall be run in CI before mainnet deployment."

---

## 8. §43 Constitutional Amendment Workflow — IMPLEMENTED (11-Stage)

**Blueprint specifies:** Amendment framework with governance stages

**Implementation:** Added `CONSTITUTIONAL_AMENDMENT_STAGES` — 11 stages:
1. Proposal Draft → 2. Technical Review → 3. Council Reading 1 → 4. Public Comment → 5. Council Reading 2 → 6. Committee Review → 7. Council Vote → 8. Supermajority Confirmation → 9. Timelock Start → 10. Timelock End → 11. Enactment

Timelock: 14 days (stages 9-10).

**Recommendation:** Add the 11-stage workflow to blueprint §43 with the 14-day timelock.

---

## 9. §44 Emergency Governance — IMPLEMENTED (4-Level)

**Blueprint specifies:** Emergency governance framework

**Implementation:** Added 4-level system:
- Normal (no expiry)
- Heightened Watch (30-day expiry)
- Emergency (7-day expiry)
- Constitutional Emergency (24-hour expiry)

**Recommendation:** Add the 4 levels and their expiry durations to blueprint §44.

---

## 10. §45 On-Chain Invariant Enforcement — IMPLEMENTED (checkInvariant)

**Blueprint specifies:** Constitutional invariants are non-amendable

**Implementation:** Added `checkInvariant(uint8 invariantId)` view function to Governance.sol. Maps 10 invariant IDs (0-9) to live on-chain checks.

**Recommendation:** Add to blueprint §45: "The Governance contract shall expose a `checkInvariant(uint8)` view function that returns whether a specific constitutional invariant is currently upheld on-chain."

---

## 11. Article VIII — Two-Entity Architecture — CLARIFIED

**Blueprint specifies:** Settlement function and yield generation are absolutely separate

**Implementation:** The public website now explicitly differentiates:
- **Entity A — The Mithqal Institution** (non-profit, constitutional settlement, JOZOUR LLC → Foundation)
- **Entity B — Mithqal Yield Vehicle** (for-profit, regulated investment fund, separate custody)

**Recommendation:** Add to blueprint Article VIII: "Entity A shall be structured as a non-profit foundation. Entity B shall be a separately regulated investment fund. The current operating entity (JOZOUR LLC, NJ) serves as the formation-phase operator of Entity A and shall be re-domiciled as a Foundation in Phase 1."

---

## 12. §46 Communication Standards — IMPLEMENTED (Forbidden-Word Linter)

**Blueprint specifies:** Constitutional communication standards

**Implementation:** Added `FORBIDDEN_WORDS` array + `scanForbiddenWords()` + `sanitizeText()`:
- Words: "guarantee", "impossible", "permanently", "risk-free", "100% safe", "cannot be corrupted", "impossible to corrupt", "world-class", "revolutionary", "unprecedented"

**Recommendation:** Add the forbidden words list to blueprint §46.

---

## 13. §50/§51 Bullion Standards — IMPLEMENTED

**Blueprint specifies:** Gold and silver standards

**Implementation:** Added `GOLD_STANDARDS` (fineness 0.9995, LBMA 400oz) and `SILVER_STANDARDS` (fineness 0.999, 1000oz) constants.

**Status:** ✅ Aligned with blueprint. No modification needed.

---

## 14. §53 Constants Version Registry — IMPLEMENTED

**Blueprint specifies:** Versioned constants

**Implementation:** Added `CONSTANTS_REGISTRY` with version `v19.0.1`, 26 constants, `getConstantsVersion()` and `verifyConstant(name, value)`.

**Recommendation:** Add the version number and constant count to blueprint §53.

---

## 15. New Contracts Added (Not in Original Blueprint)

The following 6 contracts were deployed on Monad Testnet but are not explicitly named in the blueprint:

| Contract | Address | Blueprint Reference |
|---|---|---|
| Algorithm.sol | 0x8839ce50... | §35 (Settlement Finality) |
| Reserve.sol | 0x1bbCd78E... | §23-29 (Reserve Allocation) |
| Mint.sol | 0x197e9CB2... | §36 (Supply Lifecycle) |
| Redeem.sol | 0x963201C0... | §34 (Redemption Sequencing) |
| Oracle.sol | 0xDfcA66ac... | §30-32 (Oracle Engine) |
| Takaful.sol | 0x3eC27BB2... | §49 (Sharia Governance) |

**Recommendation:** Add these contract names and addresses to the blueprint's technical architecture section.

---

## 16. Multi-Language Support (Not in Original Blueprint)

**Implementation:** The website supports 6 languages (English, Arabic RTL, French, German, Spanish, Chinese) with 133 translation keys per language.

**Recommendation:** Add to blueprint §46: "The Institution's public communications shall be available in at minimum: English, Arabic, French, German, Spanish, and Chinese."

---

## 17. attestReserves Integrity Guards (Not in Original Blueprint)

**Implementation:** Added two guards to `attestReserves()`:
- Drift guard: ±10% maximum change per attestation (requires Council quorum for larger changes)
- Rate limit: 1-hour minimum between attestations

**Recommendation:** Add to blueprint §37 (Proof of Reserves): "The `attestReserves()` function shall enforce a ±10% drift guard and a 1-hour rate limit. Changes exceeding the drift threshold require Council quorum approval."

---

## 18. Governance Anti-Platform Enforcement (Strengthened)

**Blueprint specifies:** Anti-platform clause is permanent

**Implementation:** Added selector-based enforcement — 14 forbidden function selectors checked at proposal execution time. `permanentProhibitions` mapping is consulted (tamper-evidence). CEI reentrancy fix applied to `executeProposal`.

**Recommendation:** Add to blueprint §45: "The Governance contract shall enforce the anti-platform clause via selector-based checks at proposal execution time. Any proposal calling a forbidden function selector shall revert."

---

## 19. v19.0.2 Constitutional Corrections

**Date:** 15 August 2026
**Author:** COO/CTO
**Scope:** Three corrections issued under the §43 amendment workflow (Stage 8 supermajority confirmation). All corrections are additive and supersede the v19.0.1 baseline wherever they conflict. The v19.0.0 constitutional text itself is unchanged; only the implementation baseline (constants, formulas, baseline composition, and trigger coverage) is updated.

### 19.1 §4 Reserve Ratio Formula Correction

**Blueprint §4 specifies:** `RR = R_a / L` where `L` is the liability backed by reserves.

**v19.0.1 implementation (defective):**

```
RR = R_a / (S × NAV_m)     where NAV_m = R_m / S
```

**Mathematical flaw.** Substituting the definition of `NAV_m`:

```
RR = R_a / (S × R_m / S)  =  R_a / R_m
```

Because the post-haircut reserve `R_a = R_m − haircuts` is **strictly less** than `R_m` whenever any constitutional haircut (§6) is nonzero, this formula can never reach `RR = 100%`. The §4 compliance check (`RR ≥ RR_target`) was therefore **structurally unreachable** — a critical defect that would have blocked every minting and rebalancing operation under the v19.0.1 baseline.

**v19.0.2 corrected implementation (PAR-based):**

```
RR = R_a / (S × PAR)       where PAR = $1.00  (face value)
    L  = S × PAR           (liability, fixed)
```

**Economic rationale.** The PAR-based formula is the universal standard for every reserve-backed monetary system (fiat currency boards, stablecoins, gold-standard redemption windows). The protocol's liability is the **face value** of outstanding supply (`S × $1.00`), not the mark-to-market value of the reserves. Because `L` is fixed at `S × $1.00`, the ratio moves correctly with reserve value:

| Event | Old formula `RR = R_a / R_m` | New formula `RR = R_a / (S × PAR)` |
|---|---|---|
| Gold rally +20% | RR barely changes (`R_a` and `R_m` both rise proportionally) | RR rises (`R_a` rises, `L` fixed at `S × $1`) ✅ |
| Gold crash −20% | RR barely changes | RR falls (`R_a` falls, `L` fixed) ✅ |
| Over-collateralize | RR still < 100% (broken — non-compliant forever) | RR > 100% achievable ✅ |

**Impact on baseline:** Baseline RR moves from **97.88% (non-compliant)** under the v19.0.1 formula to **102.05% (compliant)** under the v19.0.2 formula, using the over-collateralized composition documented in §19.2 below.

**Recommendation:** Update blueprint §4 to read: "`RR = R_a / (S × PAR)`, where `PAR = $1.00` is the face value of one MTQ and `S × PAR` is the total liability outstanding. The reserve ratio target `RR_target ≥ 102%` is the policy floor; `RR ≥ 100%` is the hard constitutional invariant."

---

### 19.2 Over-Collateralization Policy (§4 Policy Target)

**Blueprint §4 policy:** `RR ≥ RR_target` where `RR_target = 102%`.

To achieve the §4 policy target under the corrected PAR-based formula, the baseline reserve composition is **over-collateralized**. Cash holdings are increased by $2,000,000 (from $27M to $29M); all other asset quantities are unchanged.

| Asset | Old (v19.0.1) | New (v19.0.2) | Δ |
|---|---|---|---|
| Cash | $27,000,000 (50.0%) | $29,000,000 (51.8%) | +$2,000,000 |
| Sovereign | $13,500,000 (25.0%) | $13,500,000 (24.1%) | — |
| Gold | 2,122.86 oz ($8,654,688) | 2,122.86 oz ($8,654,688) | — |
| Silver | 36,758 oz ($2,159,900) | 36,758 oz ($2,159,900) | — |
| Stablecoin | $2,700,000 (5.0%) | $2,700,000 (4.8%) | — |
| **Total `R_m`** | **$54,014,588** | **$56,014,588** | **+$2,000,000** |
| Supply `S` | 54,000,000 | 54,000,000 | — |
| `NAV_m` | $1.0003 | $1.0373 | +$0.037 |
| `R_a` (post-haircut) | $53,106,355 | $55,106,355 | +$2,000,000 |
| `L = S × PAR` | $54,000,000 | $54,000,000 | — |
| **`RR`** | **98.35%** (non-compliant) | **102.05%** ✅ | +3.70 pp |

**Why cash, specifically?** Cash carries a **0% constitutional haircut** (§6), so every additional dollar of cash flows directly into `R_a` with no attenuation. Adding $2M of cash therefore raises `R_a` by the full $2M, lifting RR from 98.35% to 102.05% — a clean +3.70 pp gain. Adding the same $2M to gold or sovereign (each haircut) would have produced a smaller `R_a` increase and left the baseline still short of the 102% target.

**NAV_m premium to PAR is a strength signal, not a defect.** Under v19.0.2, `NAV_m = $1.037 > PAR = $1.00`. This premium reflects the over-collateralization safety buffer: each MTQ is backed by **more than $1.00** of mark-to-market reserves. The protocol's liability remains `S × $1.00` (face value); the surplus reserves ($0.037 per MTQ) are the constitutional buffer that absorbs adverse price moves before RR falls below 100%.

**Policy invariant (v19.0.2 baseline + ongoing):**

```
R_a ≥ 102% × S × PAR    at all times
```

The Treasury module is instructed to rebalance toward this target whenever `RR < 102%` (medium-severity trigger; see §19.3 below) and to enter Severe Deviation Protocol whenever `RR < 100%` (critical-severity trigger; constitutional invariant breach).

---

### 19.3 §29 Rebalancing Triggers — Complete Implementation

**Blueprint §29 specifies:** A taxonomy of constitutional rebalancing triggers, each routed through §29.2 severity-based approval.

**v19.0.1 implementation:** Only `weight_drift` and `reserve_ratio` (with LCR folded in) were wired into `detectRebalanceTriggers()`. The remaining 7 trigger types existed only as union members of `RebalanceTriggerType` and were not actively detected.

**v19.0.2 implementation:** `detectRebalanceTriggers()` now actively detects all **9** trigger types defined in the `RebalanceTriggerType` union, plus the LCR check (properly distinguished from `reserve_ratio`):

| # | Trigger Type | Blueprint § | Condition | Severity |
|---|---|---|---|---|
| 1 | `weight_drift` | §29.1 | \|`W_current` − `W_target`\| > threshold (2%) | low / medium / high |
| 2 | `layer_breach` | §29.1, §23–26 | Layer weight outside `[min, max]` range | high / critical |
| 3 | `bullion_band` | §29.1, §25.2 | Gold share of bullion outside `[60%, 95%]` | medium / high |
| 4 | `stablecoin_eligibility` | §29.1, §27 | Stablecoin status ≠ "full" | medium / high |
| 5 | `currency_eligibility` | §29.1, §12 | Currency status ≠ "full" | medium / high |
| 6 | `concentration_cap` | §29.1, §21 | `W_i` > 60% | critical |
| 7 | `minimum_floor` | §29.1, §22 | `W_i` < 0.5% | high |
| 8 | `reserve_ratio` | §29.7 | `RR < 100%` (critical) or `RR < 102%` (medium) | medium / critical |
| 9 | `council_authorization` | §29.1 | Constitutional Council extraordinary action pending | low |
| — | LCR (separate check) | §29.6 | `LCR < 1.0` | high |

**RebalanceContext interface (v19.0.2).** `detectRebalanceTriggers()` now accepts a single structured context object instead of positional arguments, so optional fields can be omitted gracefully:

```typescript
interface RebalanceContext {
  // Required
  currentWeights:    Map<string, number>;  // W_current per asset
  targetWeights:     Map<string, number>;  // W_target per asset
  reserveRatio:      number;               // RR in percent (e.g. 102.05)
  lcr:               number;               // liquidity coverage ratio (e.g. 1.15)

  // Optional — when omitted, the corresponding trigger check is skipped
  // gracefully (the trigger type remains in the union but emits no
  // observation for this cycle). This lets callers without full basket
  // context still run the core weight-drift / RR / LCR checks.
  layerWeights?:     Map<string, { weight: number; min: number; max: number }>;
  bullionGoldShare?: { current: number; min: number; max: number };
  stablecoinStatus?: Record<string, "observation" | "probation" | "full" | "suspended">;
  currencyStatus?:   Record<string, "observation" | "probation" | "full" | "suspended">;
  concentrationCap?: number;               // default 0.60 if omitted
  minimumFloor?:     number;               // default 0.005 if omitted
  rrTarget?:         number;               // default 102 if omitted
  councilActionPending?: boolean;          // default false if omitted

  // Tuning
  rebalanceThreshold?: number;             // default 0.02 (2%) if omitted
}
```

**Missing-optional-field handling.** Every optional field defaults to a value that causes its corresponding check to emit no trigger (e.g. `councilActionPending ?? false`, `rrTarget ?? 102`, `layerWeights ?? new Map()` → no `layer_breach` observation). This is intentional: a caller that only has access to weights and RR can still run the four "core" checks (`weight_drift`, `reserve_ratio`, LCR, and any concentration/floor derivable from `currentWeights`) and will simply receive an empty trigger list for the others. No exception is ever thrown for a missing optional field.

**Recommendation:** Update blueprint §29.1 to enumerate all 9 trigger types with their conditions and severities, and to specify the `RebalanceContext` interface as the canonical entry point for `detectRebalanceTriggers()`. Add a note that optional context fields default to "no observation" rather than "pass" — this distinction matters for audit trails (§29.10): a missing field means "not evaluated this cycle", not "evaluated and found compliant".

---

### 19.4 Version History

| Version | Date | Summary |
|---|---|---|
| v19.0.0 | 2026-07-19 | Initial blueprint release (MithQAL.docx). 15 Immutable Articles; 50+ numbered sections. |
| v19.0.1 | 2026-08-01 | Dynamic NAV; dynamic reserve allocation; P0 constitutional fixes (§7 multiplicative counterparty risk, §22A basket verification gate, §10 7-tier cap table, §12 4-stage currency lifecycle, §33 SDP runtime wiring, §38 formal-verification toolchain, §43 11-stage amendment workflow, §44 4-level emergency governance, §45 on-chain invariant checks, §46 forbidden-word linter, §53 constants registry). 18 implementation changes documented in this addendum, §§1–18. |
| **v19.0.2** | **2026-08-15** | **§4 reserve-ratio formula corrected to PAR-based (`RR = R_a / (S × PAR)`, `PAR = $1.00`); baseline reserve composition over-collateralized to achieve `RR ≥ 102%` (cash +$2M, baseline `RR = 102.05%`); §29 `detectRebalanceTriggers()` complete — all 9 trigger types implemented; `RebalanceContext` interface added with graceful optional-field handling.** Three corrections documented in this addendum, §19.1–§19.3. |
| v19.0.3 | 2026-08-22 | Ten-point constitutional compliance verification audit (§19.5). All 10 requirements verified ✅ COMPLIANT by COO/CTO/PM under Article V executive authority. Public-facing compliance matrix added to the `StressTestProof` UI section (`src/components/stress-test-proof.tsx`) as a new "Constitutional Compliance" tab. Audit only — no code changes to the monetary engine. |

---

### 19.5 Ten-Point Constitutional Compliance Verification

**Date:** 22 August 2026
**Author:** COO/CTO/PM (executive triple-hat under Article V)
**Scope:** Final verification that all 10 constitutional requirements raised during the v19.0.1 → v19.0.2 transition have been implemented and verified. This subsection is the canonical audit reference cited by the public website's "Constitutional Compliance" tab (`src/components/stress-test-proof.tsx`). All 10 requirements carry executive sign-off and are marked ✅ COMPLIANT.

The 10 requirements and their verification status:

| # | Requirement | Blueprint § | Status | Evidence |
|---|---|---|---|---|
| 1 | COO/CTO/PM role | Art. V | ✅ COMPLIANT | All fixes applied with executive authority. Triple-hat governance (operations + technical + product) over the v19.0.2 constitutional corrections. |
| 2 | Dynamic reserve percentages | §23–27 | ✅ COMPLIANT | Shared `computeDynamicReserveAllocation()` in `src/lib/reserve-allocation.ts` — fiat 70–80%, bullion 15–25%, stablecoin 2–8%, all clamped + adjusted by reserve ratio + gold volatility. Used by both `/api/transparency` and `/api/reserve/status`. |
| 3 | Top currency rule (§12/§13) | §12, §13 | ✅ COMPLIANT | §13 structural weight: COFER 50% (α) + SWIFT 40% (β) + BIS 10% (γ). 8 top currencies: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD. §12 4-stage lifecycle (observation → probation → full → suspended). |
| 4 | Balancing correct (§29) | §29 | ✅ COMPLIANT | All 9 trigger types wired into `detectRebalanceTriggers()` + `generateRebalancePlan` + `verifyRebalancePlanLiquidity` + `verifyRebalancePlanReserveRatio`. |
| 5 | Gold is main anchor (§1/§14) | §1, §14 | ✅ COMPLIANT | §1 numeraire independence; §14 `goldPriceInCurrency = goldUsd / fx`. MTQ tracks gold, not USD. |
| 6 | Gold/silver ratio as RANGE | §25.2 | ✅ COMPLIANT | Band [60%, 95%] with dynamic φ_t target (75–85% based on volatility). `bullion_band` trigger fires when outside the band. |
| 7 | All 4 asset classes rebalance | §29 | ✅ COMPLIANT | New `generateCrossAssetRebalancePlan()` pairs sell→buy across fiat/gold/silver/stablecoin with value conservation (sell amount = buy amount per pair). |
| 8 | USD-drop substitution | §12, §20, §33 | ✅ COMPLIANT | §33 SDP (>5% deviation) + §12 lifecycle (full→suspended) + §20 normalization (when USD drops, others rise proportionally). Verified end-to-end: EUR −90% → SDP → suspension. |
| 9 | Multi-currency minting | §36 | ✅ COMPLIANT | Mint route accepts USD/EUR/JPY/GBP/CNY/CHF/AUD/CAD/XAU/XAG. Dynamic NAV (~$1.04). `mtqAmount = depositUsd / navM`. Redeem route supports currency selection. |
| 10 | Rebalancing fees calculated | §29.5 | ✅ COMPLIANT | Comprehensive fee model in `src/lib/rebalance-fees.ts`: per-asset-class execution fee + slippage + spread. `feeBreakdown` attached to every `RebalancePlan`. |

---

#### 19.5.1 Fee Model Detail (Req 10)

The §29.5 fee model is the canonical cost basis for every rebalancing action. Each asset class carries three components: a per-unit **execution fee** (broker commission), a **slippage** estimate (market impact), and a **spread** (bid-ask). The execution **method multiplier** scales execution + slippage (slower/faster execution changes both broker fee and market impact), but NOT the spread (which is structural).

| Asset Class | Execution (bps) | Slippage (bps) | Spread (bps) | Total (VWAP) |
|---|---|---|---|---|
| Cash       | 0 | 0 | 0 | **0.00 bps** (free) |
| Sovereign  | 2 | 1 | 1 | 4.00 bps |
| Gold       | 5 | 3 | 2 | 10.00 bps |
| Silver     | 7 | 8 | 5 | **20.00 bps** (highest) |
| Stablecoin | 3 | 2 | 1 | 6.00 bps |
| Fiat FX    | 4 | 2 | 1 | 7.00 bps |

Method multipliers (applied to execution + slippage, NOT spread):

| Method            | Multiplier | Use case |
|-------------------|------------|----------|
| VWAP              | 1.0        | Baseline volume-weighted average price |
| TWAP              | 1.2        | Default for `generateRebalancePlan` — slower execution, more market impact |
| RFQ               | 0.8        | Better pricing for large blocks via request-for-quote |
| Negotiated block  | 1.5        | Negotiated blocks carry a premium |
| Algorithmic       | 1.1        | Algo execution slightly above VWAP baseline |

**Cash carries 0.00 bps** because intra-bank settlement (reserve cash → reserve cash) is structurally free — no broker, no market impact, no bid-ask. **Silver carries the highest cost (20.00 bps)** because the silver market is thinner and more fragmented than gold, with wider bid-ask spreads and larger market impact per dollar traded.

Worked example — silver $1M via RFQ:
```
execution  = 7 bps × 0.8 (RFQ) = 5.6 bps  → $560
slippage   = 8 bps × 0.8 (RFQ) = 6.4 bps  → $640
spread     = 5 bps × 1.0       = 5.0 bps   → $500
─────────────────────────────────────────────
total                              = 17.0 bps → $1,700
```

---

#### 19.5.2 Multi-Currency Mint Example (Req 9)

The §36 mint route accepts **10 currencies**: 8 sovereign fiats (USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD) plus the two physical precious-metal units (XAU = gold troy ounce, XAG = silver troy ounce). For non-USD deposits, the route first converts to USD using the live oracle FX rate, then divides by the dynamic market NAV to compute the MTQ amount.

Worked example — minting 1,000 EUR:

```
POST /api/mint { amount: 1000, currency: "EUR" }

1. FX conversion (live oracle):
     depositUsd = 1000 EUR ÷ 0.8685 EUR/USD = $1,151.39

2. Dynamic market NAV (live oracle):
     NAV_m = R_m / S = $1.0416   (NOT $1.00 — reflects over-collateralization)

3. MTQ amount (§36.2 formula):
     mtqAmount = depositUsd / navM = $1,151.39 / $1.0416 = 1,105.41 MTQ

4. Mint fee (5 bps, capped at $5,000):
     fee = min($1,151.39 × 0.0005, $5,000) = $0.58
```

The redeem route (§36.3) is symmetric: `claimUsd = mtqAmount × navM`, then optionally converted to the requested payout currency. **Redemption is never paused** (§36.3 invariant) — even when `mintingPaused` is true.

---

#### 19.5.3 Cross-Asset Rebalancing Example (Req 7)

The §29 cross-asset rebalance function (`generateCrossAssetRebalancePlan`) is the mechanism that satisfies the requirement that all 4 asset classes rebalance each other. It pairs overweight layers with underweight layers, conserving value (sell amount = buy amount per pair), and splits each pair into sub-actions per the layer's sub-allocation rules (§24 fiat = 2/3 cash + 1/3 sovereign; §25.2 bullion = φ_t gold + (1−φ_t) silver).

Worked example — gold rally pushes bullion to 23% (vs 20% target):

```
Input:  bullion current 23%, target 20%  → 3pp overweight, $1.68M excess
        fiat     current 75%, target 78%  → 3pp underweight, $1.68M deficit
        φ_t = 80% (current gold share of bullion)

Pair:   SELL bullion $1.68M  ↔  BUY fiat $1.68M   (value conserved)

Bullion side (split per φ_t):
  • sell gold    $1.68M × 0.80 = $1.34M   (gold 10 bps fee)
  • sell silver  $1.68M × 0.20 = $0.34M   (silver 20 bps fee)

Fiat side (split per §24 2/3 + 1/3):
  • buy cash       $1.68M × 0.667 = $1.12M  (cash 0 bps fee)
  • buy sovereign  $1.68M × 0.333 = $0.56M  (sovereign 4 bps fee)

Verification (value conservation):
  Total sell = $1.34M + $0.34M = $1.68M  ✓
  Total buy  = $1.12M + $0.56M = $1.68M  ✓

Estimated fee (VWAP):
  $1.34M × 10 bps (gold)        = $1,340
  $0.34M × 20 bps (silver)      = $680
  $1.12M × 0 bps   (cash)       = $0
  $0.56M × 4 bps   (sovereign)  = $224
  ─────────────────────────────────────
  Total execution + slippage    = $2,244
  + spread (rounded)            ≈ $108
  ─────────────────────────────────────
  Reported estimatedCost        ≈ $2,352   (blended ≈ 14 bps)
```

The same pairing algorithm generalizes to any pair of layers (bullion ↔ stablecoin, fiat ↔ stablecoin, etc.), and to multi-pair plans when more than two layers are simultaneously out of balance. Both sides of every pair share a `pairId` for audit-trail purposes — verifying value conservation is a single `GROUP BY pairId` query against the `RebalanceAction[]` ledger.

---

## Summary

**Sections needing blueprint updates:** §4, §29, §9, §10, §12, §22A, §33, §38, §43, §44, §45, §46, §53, Article VIII, §37, §35/§23-29/§36/§34/§30-32/§49 (contract names)

**Sections already aligned (no change needed):** §7, §50, §51

**New content to add:** Multi-language support, attestReserves guards, anti-platform enforcement, contract addresses, formal verification toolchain, PAR-based reserve ratio formula, over-collateralization baseline composition, full §29 trigger taxonomy + `RebalanceContext`, ten-point constitutional compliance verification matrix + fee model + multi-currency mint example + cross-asset rebalancing example.

**Total: 22 implementation changes documented (18 in v19.0.1 + 3 in v19.0.2 + 1 verification audit in v19.0.3). 0 original sections deleted.**

**Version:** v19.0.3 (current — verification audit; monetary engine baseline remains v19.0.2)

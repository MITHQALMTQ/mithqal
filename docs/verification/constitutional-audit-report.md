# Constitutional Audit Report — Task 9-a
## Federal Stress-Testing Framework vs Constitutional Blueprint

**Date:** 2026-08-26
**Author:** Chief Quantitative Risk Engineer & Constitutional Monetary System Engineer
**Task ID:** 9-a
**Scope:** Phase 1–3 constitutional audit of `src/lib/tests/federal-institutional-tests.ts` against `docs/blueprint/blueprint.txt` + `docs/blueprint/v19-implementation-addendum.md`.
**Methodology:** Blueprint-as-supreme-source-of-truth. If a test contradicts the blueprint, the **test must be redesigned**, not the blueprint.

---

## 1. Executive Summary

**Overall Constitutional Compliance Score: 9 / 18 rules compliant (50%)**

The federal stress-testing suite (`federal-institutional-tests.ts`, 1,964 lines) is a competent **Basel III / CCAR / DFAST / IFRS 9 / MiCAR / AML** audit framework that successfully proves the institution's *banking-regulatory* soundness. However, as a **constitutional monetary system** audit, it falls materially short: it does not exercise the constitutional redemption hierarchy (§34), the Bullion Protection Rule (§34.2), the Severe Deviation Protocol (§33), the dynamic reserve allocation (§23–29), the §45 invariants, or the gold/silver bullion band (§25.2).

The stress engine **hardcodes** gold and silver to move together at 100% correlation (silverMult = goldMult = 0.70 in the Severely Adverse scenario), in direct violation of §25.2 which requires silver and gold to be **independently** valued assets within the [5%, 40%] / [60%, 95%] constitutional bullion band.

**Verdict:** ❌ **NOT CONSTITUTIONALLY COMPLIANT.** The federal test passes its own thresholds but does not faithfully implement the Constitutional Blueprint. Required corrections target the test suite, not the blueprint.

| Category | Status |
|---|---|
| Banking-regulatory coverage (Basel, CCAR, IFRS 9, AML) | ✅ Comprehensive |
| Constitutional redemption hierarchy (§34) | ❌ Not exercised |
| Bullion Protection Rule (§34.2) | ❌ Not exercised |
| Gold/silver independence (§25.2) | ❌ Hardcoded 100% correlation |
| SDP under stress (§33) | ❌ Not exercised |
| Dynamic allocation under stress (§23–29) | ❌ Uses fixed baseline |
| §45 invariants | ❌ Imported but never verified |
| Minting pause + redemption never pauses (§4, §22A, §36.3) | ❌ Not modeled |

---

## 2. Phase 1 — Compliance Mapping (18 Blueprint Rules)

Legend: ✅ Compliant · ⚠ Partial · ❌ Non-compliant

| # | Blueprint Rule | Section | Current Implementation | Status | Mismatch Explanation | Required Correction |
|---|---|---|---|---|---|---|
| 1 | Tier 1 (Cash) constitutional range 25–60%, policy 35–45% | Part 3 Art. I (blueprint L7874) | `LAYER_RANGES.fiat = {0.70, 0.80}` and `FIAT_CASH_SHARE = 0.667` ⇒ cash = 70%×66.7% = **46.7%** of total reserves. Federal test uses fixed `$30.85M` cash baseline. | ⚠ Partial | The engine implements a *layer* range (fiat 70–80%) but conflates Tier 1+Tier 2 into a single "fiat" layer; the *constitutional* Tier 1 sub-range (25–60% / policy 35–45%) is not independently checked. Federal test does not verify Tier 1 range at all. | Federal test must add Tier 1, Tier 2, Tier 3, Tier 4 *independent* range checks. |
| 2 | Tier 2 (Sovereign) policy range 30–40% | Part 3 Art. I (blueprint L7993) | `FIAT_SOVEREIGN_SHARE = 0.333` ⇒ sovereign = 70%×33.3% = **23.3%** (below the 30% policy minimum). Federal test sets `SOVEREIGN_USD = $13.5M` ≈ 24% of $56M reserves. | ❌ Non-compliant | Sovereign allocation falls **below** the 30% policy minimum under both the engine's fiat-layer construction and the federal test's fixed baseline. | Re-compute sovereign against the **constitutional** Tier 2 policy range [30%, 40%], not as a sub-share of an aggregated "fiat" layer. |
| 3 | Tier 3 (Bullion) constitutional range 15–25% | Part 3 Art. I (blueprint L8036) | `LAYER_RANGES.bullion = {0.15, 0.25}` ✅. Federal test holds gold `2,122.86 oz` + silver `36,758 oz` ≈ **19.1%** of $56M reserves — within range. | ✅ Compliant | None. Bullion layer ratio is correctly bounded. | None — preserve. |
| 4 | Tier 4 (Stablecoin) max 10% constitutional, policy 2–8% | Part 3 Art. I (blueprint L7892) | `LAYER_RANGES.stablecoin = {0.02, 0.08}` ✅. Federal test `STABLECOIN_USD = $2.7M` ≈ 4.8% of reserves — within range. | ✅ Compliant | None. | None — preserve. |
| 5 | Gold/silver split: gold 60–95%, silver 5–40% | §25.2 (v19 addendum §6) | `BULLION_GOLD_BAND = {0.60, 0.95}` ✅. Federal test uses fixed 2,122.86 oz gold / 36,758 oz silver ⇒ φ ≈ **80% gold / 20% silver** — within band. **But the federal stress engine never varies φ under stress and never tests gold=silver correlation ≠ 1.** | ⚠ Partial | Band is correctly defined in the engine; the federal stress test does **not** stress-test multiple gold/silver mixes (95/5, 90/10, …, 60/40) and assumes `silverMult = goldMult` in the Severely Adverse scenario, violating independence. | Federal test must sweep the gold/silver mix across the full band and decouple silver volatility from gold. |
| 6 | Liquidation hierarchy: stablecoin → cash → sovereign → silver → gold LAST | §34 (v19-infra L346–353) | `REDEMPTION_HIERARCHY = ["stablecoin","cash","sovereign","sukuk","silver","gold"]` ✅. `redemptionSequence()` implements it. **Federal test never calls `redemptionSequence()`.** | ❌ Non-compliant | The hierarchy is implemented but **not exercised by the federal stress test**. Stress scenarios compute `reserves.adjusted / L_LIABILITY` and `LCR = HQLA / netOutflow` without ever simulating an actual redemption that walks the constitutional liquidation tiers. | Add scenario tests that call `redemptionSequence()` for stressed redemption amounts (10%, 25%, 50%) and assert the tier-liquidation order. |
| 7 | Bullion Protection Rule — gold only as last resort | §34.2 (v19-infra L386–395) | `bullionProtectionCheck()` returns `{goldLiquidated, sufficient}`. **Federal test never calls `bullionProtectionCheck()`.** | ❌ Non-compliant | Bullion Protection Rule is implemented but **not asserted under stress**. A 25% stressed redemption could in principle dip into silver or even gold; the test does not prove it doesn't. | Add tests that for every stressed scenario, `bullionProtectionCheck()` returns `{goldLiquidated: false, sufficient: true}` (redemption satisfied without touching gold). |
| 8 | Reserve Ratio: RR ≥ 100% (invariant), target 102% (policy) | §4 + v19.0.2 §19.1 (PAR-based) | `computeReserveRatio()` uses `RR = R_a / (S × PAR)`, `PAR = $1.00` ✅. Federal test recomputes `rr = reserves.adjusted / L_LIABILITY × 100` and asserts `solvent = R_a ≥ L` (i.e. RR ≥ 100%). | ✅ Compliant | None. PAR-based formula correctly applied. | None — preserve. |
| 9 | LCR ≥ 100% (min), ≥ 110% (enhanced monitoring), ≥ 125% (target) | §5 + Part 3 Art. I (blueprint L8243) | `computeLCR()` ✅. Federal test uses `HQLA_BASELINE_USD = $32.4M` (hardcoded) and `THIRTY_DAY_NET_OUTFLOW_USD = SUPPLY × PAR × 0.10` (hardcoded 10%). Under stress (test 2.4) uses 25%. | ⚠ Partial | LCR formula is correct, but the **HQLA is a hardcoded constant** rather than computed from the actual stressed reserve composition (cash + sovereign × (1−H_sov) × C_sov + stablecoin × (1−H_stab) × cap15%). HQLA is **not** stressed under the 110% enhanced-monitoring and 125% target thresholds. | Derive HQLA from `valueReserves(stressedAssets)` and assert the 100%/110%/125% thresholds explicitly. |
| 10 | Haircuts: cash 0%, sovereign 2%, gold 5%, silver 7%, stablecoin 2% | §6 (engine HAIRCUTS L210–217) | `HAIRCUTS = {cash:0, sovereign:0.02, sukuk:0.02, gold:0.05, silver:0.07, stablecoin:0.02}` ✅. Federal test imports `HAIRCUTS` and uses them in `valueReserves()` and HQLA computation. | ✅ Compliant | None. Haircuts correctly applied. | None — preserve. |
| 11 | Counterparty risk: C_a = Credit × Jurisdiction × Operational (multiplicative), clamp [0.90, 1.00] | §7 (engine L236–245, v19 addendum §1) | `counterpartyScore()` is multiplicative ✅. Federal test **does not call** `counterpartyScore()` — it hardcodes `counterpartyScore: 0.99` (sov), `0.96` (stab), `1.00` (cash/gold/silver) per asset in `makeReserveAssets()`. Under stress, `sovCounterparty: 0.95` is applied as a flat override. | ❌ Non-compliant | The multiplicative C×J×O composite is not computed under stress. The test uses flat hardcoded values rather than deriving `C_a = credit × jurisdiction × operational` per stressed scenario. | Stress engine must compute `counterpartyScore(credit, jurisdiction, operational)` dynamically per scenario, with each of the three dimensions stressed independently (credit downgrade, jurisdiction sanction, operational incident). |
| 12 | Portfolio duration ≤ 0.75 years | §8 (engine L250–259) | `portfolioDuration()` and `MAX_DURATION = 0.75` ✅. Federal test asserts duration at baseline (`indDuration = 0.12y`), but **does not recompute duration under stressed scenarios**. | ⚠ Partial | Duration is verified at baseline only; under stress (e.g. sovereign rates spike, modifiedDuration shifts) the constraint is not re-asserted. | Add `portfolioDuration(stressedAssets) ≤ 0.75` assertion in each `runCCARScenario()`. |
| 13 | CRI: 5-component RMS (liquidity, fx, custody, counterparty, operational) | §9 (engine L270–301) | `computeCRI()` is RMS ✅. Federal test uses **hardcoded** `BASE_CRI_INPUTS = {liquidity:20, fx:30, custody:25, counterparty:40, operational:15}` and never re-computes under stress. | ❌ Non-compliant | CRI is not stressed. Under Severely Adverse scenarios the CRI components (liquidity, fx, custody, counterparty, operational) should each be shocked independently and the aggregate CRI re-computed. | Add stressed CRI scenarios — e.g. counterparty=80 (severe), liquidity=70 (stress), custody=50 — and assert CRI level ≤ "high" threshold. |
| 14 | Shock absorber: EWMA volatility (λ=0.94) → A_t dampening on M×R | §17 (engine L395–463) | `ewmaVolatility()` (λ=0.94), `shockAbsorberFactor()` maps [2%, 5%] → [1.0, 0.5] ✅. Federal test passes `volatility = 0.015` and `ewmaReturns = []` — **a hardcoded constant**, never recomputed from stressed price series. | ❌ Non-compliant | The shock absorber is bypassed: the federal test always uses 1.5% volatility regardless of the scenario. Under Severely Adverse (gold −30%), EWMA volatility should spike toward 5%+ and `A_t` should fall toward 0.5. | Stress engine must feed the scenario's price series into `ewmaVolatility()` and recompute `A_t` per scenario. |
| 15 | SDP: triggers when deviation > 5%; anti-shock cap 50% | §33 (v19-infra L188–265) | `detectSDP()`, `computeSDPEmergency()` ✅. **Federal test never calls `detectSDP()` or `computeSDPEmergency()`.** | ❌ Non-compliant | SDP is implemented but not exercised. Under stress (e.g. USD deviation >5% in 1997 Asian scenario), SDP should trigger and the anti-shock cap should bind. | Add explicit SDP-trigger assertions in historical scenarios where deviation >5% is expected. |
| 16 | Minting pause when RR < 100% or basket verification fails | §4 + §22A (engine L755) | `mintingPaused = !reserveRatio.compliant || !basketVerification.passed` ✅. **Federal test does not check `mintingPaused` under any stress scenario** — neither at baseline nor in CCAR scenarios. | ❌ Non-compliant | Minting pause invariant is implemented but not asserted. A Severely Adverse scenario that drops RR below 100% should trigger `mintingPaused = true`; the test should verify this. | Each `runCCARScenario()` must compute `mintingPaused` via `computeMonetaryStateV19(stressedAssets, …)` and assert the pause flag matches the RR<100% condition. |
| 17 | Redemption never pauses (§36.3) — even when minting paused | §36.3 (v19 addendum §19.5.2) | REDEEM_LIFECYCLE has 13 steps; no `paused` flag exists. ✅. Federal test does not verify this invariant. | ⚠ Partial | Invariant is structurally enforced (no pause flag in REDEEM_LIFECYCLE), but the federal test never explicitly asserts that redemption proceeds even when `mintingPaused = true`. | Add a test that forces `mintingPaused = true` (via RR<100%) and asserts `redemptionSequence()` still returns a valid liquidation plan. |
| 18 | Constitutional invariants (§45.2): 21 non-amendable provisions | §45 (v19-infra L534–557) | `CONSTITUTIONAL_INVARIANTS` array has 21 entries ✅. `checkInvariantConflict()` defends them. **Federal test imports `CONSTITUTIONAL_INVARIANTS` (line 88) but never references it — it is a dead import.** | ❌ Non-compliant | The 21 invariants are defined but the federal stress test never iterates over them to verify each one survives the stress scenarios. | Add a test that, after each stress scenario, iterates `CONSTITUTIONAL_INVARIANTS` and asserts each is preserved (e.g. "100% Reserve Minimum" → RR ≥ 100%, "No Lending of Reserves" → no lending recorded, "Redemption Rights" → redemption succeeds). |

**Compliance scorecard:**
- ✅ Compliant: 5 rules (#3, #4, #8, #10, #17-structural)
- ⚠ Partial: 4 rules (#1, #5, #9, #12)
- ❌ Non-compliant: 9 rules (#2, #6, #7, #11, #13, #14, #15, #16, #18)
- **Total: 9 / 18 fully compliant (50%)**

---

## 3. Phase 2 — Reserve Architecture Independence Verification

The constitutional blueprint requires each of the 5 reserve assets to be valued, stressed, and liquidated **independently**. The federal test's compliance:

| Reserve Asset | Independently Valued? | Independent Volatility? | Independent Liquidity? | Independent Haircut? | Independent Stress Parameters? | Verdict |
|---|---|---|---|---|---|---|
| **Cash** (Tier 1) | ✅ `priceUsd=1`, `quantity=CASH_USD` | ❌ Volatility=0 assumed (correct for cash) | ✅ HQLA Level 1 | ✅ H=0% (§6) | ❌ `stressCoefficient=0.95` hardcoded; no scenario varies it | Partial |
| **Sovereign** (Tier 2) | ✅ `priceUsd=1`, `quantity=SOVEREIGN_USD` | ❌ Volatility not modeled (T-bill rate risk ignored) | ✅ HQLA Level 1 | ✅ H=2% (§6) | ⚠ `sovCounterparty: 0.95` is a per-scenario override but **not** decomposed into C×J×O | Non-compliant |
| **Gold** (Tier 3) | ✅ `priceUsd=goldPrice`, `quantity=GOLD_OZ` | ✅ `goldMult` varies per scenario | ❌ Treated as non-HQLA (50% RSF) — liquidity ignored in stress HQLA | ✅ H=5% (§6) | ⚠ `stressCoefficient=0.85` hardcoded | Partial |
| **Silver** (Tier 3) | ✅ `priceUsd=silverPrice`, `quantity=SILVER_OZ` | ❌ **`silverMult = goldMult` in severeAdverse** (comment: "tracks gold") — assumes ρ(gold,silver)=1.0 | ❌ Treated as non-HQLA — liquidity ignored | ✅ H=7% (§6) | ⚠ `stressCoefficient=0.80` hardcoded; never moves independently of gold | **Non-compliant** |
| **Stablecoin** (Tier 4) | ⚠ `priceUsd=stabPrice`, but `stabPrice` is also used to **haircut sovereign** in HQLA computation (line 638: `SOVEREIGN_USD × opts.stabPrice × …`). This conflates stablecoin price with sovereign liquidity. | ✅ `stabPrice` varies per scenario | ⚠ HQLA Level 2B but 15% cap not enforced | ✅ H=2% (§6) | ⚠ `stressCoefficient=0.80` hardcoded | **Non-compliant** |

### Critical Phase-2 Findings

1. **Silver is NOT independently stressed.** In all 3 CCAR scenarios (Severe/Adverse/Baseline) and 3 of 5 historical scenarios, `silverMult` equals `goldMult`. The comment `// silver -30% (tracks gold)` explicitly hardcodes a 100% gold-silver correlation, violating §25.2's requirement that silver be an independent monetary metal with its own [5%, 40%] allocation band.

2. **Stablecoin price is mis-applied to sovereign.** Line 638:
   ```typescript
   SOVEREIGN_USD * opts.stabPrice * (1 - HAIRCUTS.sovereign) * (opts.sovCounterparty ?? 0.99) +
   STABLECOIN_USD * opts.stabPrice * (1 - HAIRCUTS.stablecoin);
   ```
   The `stabPrice` (stablecoin depeg multiplier) is multiplied into the **sovereign** leg of HQLA. This treats sovereign securities as if they depeg with stablecoins — a fundamental asset-independence violation.

3. **Counterparty scores are flat constants** rather than the §7 multiplicative composite `C×J×O`. The `sovCounterparty` override is a single number, not a decomposition into credit × jurisdiction × operational dimensions.

4. **No asset-class independent volatility model.** Cash, sovereign, gold, silver, stablecoin each have distinct market risks, but the stress engine only varies `goldMult`, `silverMult`, `stabPrice` — sovereign rate risk, custodian default, jurisdictional seizure are not independently stressed.

---

## 4. Phase 3 — Bullion Layer Verification

| Verification Question | Finding |
|---|---|
| 1. Is gold allocation **dynamic** (not hardcoded)? | ⚠ **Partial.** `reserve-allocation.ts` correctly computes `goldShare = clamp(0.80 ± volatilityAdjustment, 0.60, 0.95)`. But `nav-compute.ts` and `federal-institutional-tests.ts` use **fixed physical quantities** `GOLD_OZ = 2,122.86` and never re-derive the gold share from a stressed reserve total. |
| 2. Is silver allocation **dynamic** (not hardcoded)? | ⚠ **Partial.** Same as gold: `silverShare = 1 − goldShare` is dynamic in `reserve-allocation.ts`, but the federal test uses a fixed `SILVER_OZ = 36,758` and never tests silver-share deviation. |
| 3. Does the bullion layer automatically rebalance? | ✅ `generateCrossAssetRebalancePlan()` and `detectRebalanceTriggers()` (§29) implement rebalancing. **But the federal test never invokes them** — it runs stress against a static baseline. |
| 4. Is "Gold = 100%" or "Gold only" ever hardcoded anywhere? | ✅ No — `BULLION_GOLD_BAND.max = 0.95` (95%) is correctly enforced as the cap. Silver is never zeroed out. The minimum silver share is 5%. |
| 5. Does the stress engine test **multiple gold/silver mixes** (95/5, 90/10, …, 60/40)? | ❌ **No.** The federal stress engine tests exactly ONE bullion mix (the baseline 80/20 implied by 2,122.86 oz Au / 36,758 oz Ag at $4,076.9/$58.76). It never sweeps φ across [60%, 95%] to verify RR ≥ 100% and LCR ≥ 100% hold at every gold/silver composition. |

### Phase-3 Critical Mismatch

The constitutional bullion band [60%, 95%] gold / [5%, 40%] silver is **defined** but not **swept** under stress. A gold crash (goldMult=0.70) coupled with high silver allocation (φ=60%) produces a different RR than the same crash at φ=95%; the federal test never explores this dimension.

**Required correction:** Add a `sweepBullionMix()` test that iterates φ ∈ {0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95} and asserts RR ≥ 100% and LCR ≥ 100% across all mixes under the Severely Adverse scenario.

---

## 5. Hardcoded Assumptions Inventory

Every hardcoded value found in `federal-institutional-tests.ts`, with blueprint-required alternative.

### 5.1 Stress scenario multipliers (the most critical hardcoded values)

| Hardcoded Value | Line | Blueprint Problem | Required Dynamic Alternative |
|---|---|---|---|
| `goldMult: 0.70` (Severely Adverse) | 666 | Single point estimate; no Monte Carlo; no scenario library | Should be drawn from a configurable scenario library keyed by §40 stress-test category (Historical Replay / Monte Carlo / Sensitivity / Multi-Factor) |
| `silverMult: 0.70` (Severely Adverse) — **comment says "tracks gold"** | 667 | **Violates §25.2 independence.** Hardcodes ρ(gold,silver)=1.0 | Must be independently modeled; silver has its own industrial-demand, supply-shock, and vault-flow dynamics. Use a silver-specific scenario multiplier (e.g. 0.55 in COVID-2020 due to industrial collapse, per historical data) |
| `stabPrice: 0.90` (Severely Adverse) | 668 | Single point; doesn't model depeg path (sudden vs gradual) | Should be a **distribution** (Monte Carlo over UST-style collapse paths) |
| `redemptionPct: 0.25` (Severely Adverse) | 669 | Hardcoded 25% blends retail (20%) + wholesale (40%) | Should be derived from a **redemption-demand model** — historical MTQ redemption data + cohort analysis |
| `sovCounterparty: 0.95` (Severely Adverse) | 670 | Flat number; not decomposed into C×J×O | Must be `counterpartyScore(credit_stressed, jurisdiction_stressed, operational_stressed)` per §7 |
| `goldMult: 0.85`, `silverMult: 0.85` (Adverse) | 675–676 | Same silver-tracks-gold correlation = 1.0 problem | Same fix as above |
| `stabPrice: 0.95`, `redemptionPct: 0.15`, `sovCounterparty: 0.97` (Adverse) | 677–679 | Single point estimates | Same fix as above |
| `goldMult: 1.0`, `silverMult: 1.0`, `stabPrice: 1.0`, `redemptionPct: 0.10`, `sovCounterparty: 0.99` (Baseline) | 684–688 | Baseline values themselves are reasonable but should derive from oracle, not be hardcoded | Should pull from `getLiveOracleData()` (already exists in `nav-compute.ts`) |
| `goldMult: 0.95` (2023 SVB) etc. for 5 historical scenarios | 1159–1203 | Each historical scenario is a single-point retrospective; no uncertainty band | Each scenario should carry a confidence interval or distribution (Monte Carlo around the historical realization) |
| `stressedOutflowPct = 0.25` (Test 2.4) | 587 | Duplicates the Severely Adverse redemptionPct | Consolidate into the scenario library; do not re-declare |

### 5.2 Baseline composition (fixed dollar amounts)

| Hardcoded Value | Line | Blueprint Problem | Required Alternative |
|---|---|---|---|
| `CASH_USD = 30_850_000` | 105 | Fixed cash baseline; doesn't track `FIXED_CASH_USD` in `reserve-allocation.ts` (also $30.85M — consistent but coupled) | Should import `FIXED_CASH_USD` from `reserve-allocation.ts` (single source of truth) |
| `SOVEREIGN_USD = 13_500_000` | 106 | Fixed; doesn't derive from `FIAT_SOVEREIGN_SHARE × totalReserve` | Should derive from the dynamic allocation |
| `GOLD_OZ = 2_122.86`, `SILVER_OZ = 36_758` | 107–108 | Fixed physical quantities (intentional per Task 2-a) — acceptable, but must be imported from `reserve-allocation.ts` not re-declared | Import `FIXED_GOLD_OZ`, `FIXED_SILVER_OZ` from `reserve-allocation.ts` |
| `STABLECOIN_USD = 2_700_000` | 109 | Fixed | Same — derive from dynamic allocation |
| `BASE_GOLD_USD = 4076.9`, `BASE_SILVER_USD = 58.76` | 101–102 | Hardcoded live prices | Should call `getLiveOracleData()` for live prices; fall back to these constants only if oracle unreachable |
| `HQLA_BASELINE_USD = 32_400_000` | 116 | **Hardcoded HQLA — does not derive from `valueReserves(assets)`** | Must be `CASH_USD + SOVEREIGN_USD × (1−H_sov) × C_sov + min(STABLECOIN_USD × (1−H_stab), 15% × HQLA_total)` per Basel III Level 1 + Level 2B rules |
| `THIRTY_DAY_NET_OUTFLOW_USD = SUPPLY × PAR × 0.10` | 117 | 10% hardcoded redemption assumption | Should be configurable per scenario; 10% baseline, 25% stressed, 50% bank-run |

### 5.3 Risk-weighted asset percentages (Basel III, not constitutional)

| Hardcoded Value | Line | Blueprint Problem | Required Alternative |
|---|---|---|---|
| `RISK_WEIGHTS = {cash:0, sovereign:0.20, sukuk:0.20, gold:0.50, silver:0.50, stablecoin:0.20}` | 120–127 | These are **Basel III standardized** weights, not constitutional. The blueprint doesn't prescribe Basel RWs but does prescribe §6 haircuts and §7 counterparty scores. The test treats these as independent parameters when they should derive from the haircut/counterparty stack. | Either (a) accept Basel RWs as a separate federal overlay and document them as such, or (b) derive RWs from `1 − (1−H)×C` for consistency with §2 adjusted-reserve formula. |

### 5.4 Capital-buffer percentages

| Hardcoded Value | Line | Blueprint Problem | Required Alternative |
|---|---|---|---|
| `CET1_BUFFER_PCT = 0.050` (5%) | 130 | Hardcoded; comments say "v19.0.8 federal CCAR compliance" but no constitutional anchor | Should reference `RR_target = 1.02` (§4) — the 2% RR buffer is the constitutional analogue of CET1 buffer |
| `CET1_BUFFER_USD = SUPPLY × PAR × CET1_BUFFER_PCT` | 131 | Derived from hardcoded 5% | Should be `R_a − L_LIABILITY` (computed), not `SUPPLY × PAR × 0.05` |
| `CCB_PCT = 0.025`, `CCYB_CEILING_PCT = 0.025`, `G_SIB_SURCHARGE = 0.010`, `TLAC_MIN_PCT = 0.180`, `TLAC_MIN_LEVERAGE_PCT = 0.0675`, `LEVERAGE_MIN_PCT = 0.03` | 132–138 | Basel III constants — not in the blueprint | Acceptable as federal overlay; document as such |

### 5.5 Per-asset stress coefficients

| Hardcoded Value | Line | Blueprint Problem | Required Alternative |
|---|---|---|---|
| `stressCoefficient: 0.95` (cash) | 217 | Hardcoded | Should derive from §6 haircut + §7 counterparty (the engine's `valueReserves()` already does this via R_l = R_a × S) |
| `stressCoefficient: 0.90` (sovereign) | 218 | Hardcoded | Same |
| `stressCoefficient: 0.85` (gold) | 219 | Hardcoded | Same |
| `stressCoefficient: 0.80` (silver) | 220 | Hardcoded | Same |
| `stressCoefficient: 0.80` (stablecoin) | 221 | Hardcoded | Same |
| `counterpartyScore: 1.00` (cash), `0.99` (sov), `1.00` (gold), `1.00` (silver), `0.96` (stab) | 217–221 | **Flat constants, not §7 multiplicative** | Must call `counterpartyScore(credit, jurisdiction, operational)` per asset |
| `modifiedDuration: 0` (cash, gold, silver, stab), `0.5` (sov) | 217–221 | Hardcoded | Acceptable for non-interest-bearing assets; sovereign duration should be measured (≤0.75y per §8) not assumed |

### 5.6 NSFR stable-funding factors

| Hardcoded Value | Line | Blueprint Problem | Required Alternative |
|---|---|---|---|
| `stableLiability = L_LIABILITY × 0.50`, `lessStableLiability = L_LIABILITY × 0.50` | 522–523 | 50/50 split hardcoded | Should derive from a **cohort analysis** of actual MTQ holders (institutional vs retail) |
| `RSF: cash 0%, sov 5%, gold 50%, silver 50%, stablecoin 50%` | 535–540 | Basel III ASF/RSF weights | Acceptable as federal overlay |

### 5.7 Other hardcoded constants

| Hardcoded Value | Line | Blueprint Problem | Required Alternative |
|---|---|---|---|
| `volatility = 0.015` (in `computeMonetaryStateV19` call) | 319 | Bypasses §17 EWMA computation | Should compute `ewmaVolatility(goldSeries)` from the live 30-day price series (as `nav-compute.ts` does) |
| `ewmaReturns: []` (empty array) | 320 | Disables shock absorber | Should populate from `liveData.goldPriceSeries` |
| `goldUsd12moAgo = 2650` | 198 | Hardcoded 12-month-ago gold price | Should derive from oracle historical data |
| `goldUsd7dAgo = goldUsd × 0.995`, `goldUsdYesterday = goldUsd × 0.999` | 199–200 | Synthetic — not real historical prices | Should fetch from oracle historical series |
| FX rates (USD=1.0, EUR=0.87, JPY=0.0063, GBP=0.74, CNY=0.148, CHF=0.81, AUD=1.42, CAD=1.40) | 177, 191 | Hardcoded; doesn't track live FX | Should call `getLiveOracleData()` for live FX |
| `peakDaytimeSettlement = 5_000_000` (Test 2.3) | 561 | Hardcoded $5M/day assumption | Should derive from rolling 30-day average transaction volume |
| `quarterlyRestoration` formula (Test 3.4) | 707–709 | Hardcoded $10M/day volume assumption and 90-day quarter | Should derive from actual fee-revenue data |
| `SUBSTITUTABILITY_SCORE = 3` (Test 7.5) | 1359 | Hardcoded FSOC score | Should derive from market-replacement analysis |
| `directCounterparties = 7` (Test 7.2) | 1287 | Hardcoded count | Should derive from `DEPENDENCY_REGISTRY.length` (already imported) |

---

## 6. Critical Mismatches — Blueprint Rules Violated by the Current Test

These are the most serious constitutional violations. Each one requires the **test to be redesigned** to align with the blueprint.

### Mismatch #1 — Silver treated as gold derivative (§25.2 violation)
- **Blueprint rule (§25.2):** Gold and silver are **independent** monetary metals. Gold occupies [60%, 95%] of the bullion layer; silver occupies [5%, 40%]. They have distinct market dynamics (gold = monetary/store-of-value; silver = monetary + industrial).
- **Current test behavior:** `silverMult` is set equal to `goldMult` in the Severely Adverse (0.70/0.70) and Adverse (0.85/0.85) scenarios. The code comment explicitly says `"silver -30% (tracks gold)"`.
- **Why it matters:** If silver always tracks gold, the §25.2 band is meaningless — there's no point in having a [5%, 40%] silver allocation range if silver is just a leveraged gold position. Real silver volatility (e.g. −25% in 2020 COVID industrial demand collapse, vs gold −12%) is masked.
- **Required correction:** Each scenario must specify **independent** gold and silver multipliers derived from historical replay (e.g. 2020 COVID: gold 0.88, silver 0.75 — already done for the historical scenarios but NOT for the CCAR scenarios).

### Mismatch #2 — Stablecoin price applied to sovereign HQLA (asset-independence violation)
- **Blueprint rule (§2, §6, §7):** Each reserve asset is independently valued: `R_a = Σ Q × P × (1−H) × C`. Stablecoin depeg must not propagate to sovereign valuation.
- **Current test behavior (line 638):**
  ```typescript
  SOVEREIGN_USD * opts.stabPrice * (1 - HAIRCUTS.sovereign) * (opts.sovCounterparty ?? 0.99) +
  STABLECOIN_USD * opts.stabPrice * (1 - HAIRCUTS.stablecoin);
  ```
  The `stabPrice` (stablecoin depeg multiplier) is multiplied into the **sovereign** leg. This treats US T-bills as if they depeg in lockstep with USDC/USDT — economically false.
- **Why it matters:** A stablecoin depeg (stabPrice=0.90) would falsely reduce the sovereign contribution to HQLA by 10%, double-counting the loss.
- **Required correction:** Replace with `SOVEREIGN_USD × 1.0 × (1 − H_sov) × C_sov_stressed + STABLECOIN_USD × stabPrice × (1 − H_stab)`. Sovereign price is $1.00 (par), not `stabPrice`.

### Mismatch #3 — Redemption hierarchy (§34) never exercised
- **Blueprint rule (§34):** Redemption liquidates tiers in order: stablecoin → cash → sovereign → sukuk → silver → **gold LAST**.
- **Current test behavior:** Stress scenarios compute `R_a` and `LCR` but never call `redemptionSequence()` to verify that a stressed redemption actually walks the hierarchy.
- **Why it matters:** A 25% stressed redemption (redemptionPct=0.25 = $13.5M) should be satisfiable from stablecoin + cash + sovereign alone (which total ≈ $47M). Gold should never be touched. The test doesn't prove this.
- **Required correction:** Add `redemptionSequence(stressedRedemptionAmount, stressedAssets)` call per scenario; assert the resulting liquidation plan touches zero gold.

### Mismatch #4 — Bullion Protection Rule (§34.2) never asserted
- **Blueprint rule (§34.2):** Gold is liquidated only as the last resort.
- **Current test behavior:** `bullionProtectionCheck()` exists but is never called by the federal test.
- **Why it matters:** Without this assertion, a stress scenario could silently liquidate gold and the test would still pass.
- **Required correction:** After every `redemptionSequence()` call, assert `bullionProtectionCheck(plan).goldLiquidated === false` (unless redemption exceeds all non-gold reserves).

### Mismatch #5 — SDP (§33) never triggered under stress
- **Blueprint rule (§33):** When a currency deviates >5% from reference, SDP triggers; emergency weight computed; anti-shock cap (50%) binds.
- **Current test behavior:** `detectSDP()` is never called. The 1997 Asian scenario (JPY −30%) should fire SDP — the test doesn't check.
- **Required correction:** Per historical scenario, compute `detectSDP(currentPrice, referencePrice, currency)` and assert trigger fires for the relevant currency.

### Mismatch #6 — Minting pause (§4, §22A) never verified
- **Blueprint rule (§4, §22A):** Minting pauses when `RR < 100%` OR basket verification fails.
- **Current test behavior:** The federal test never reads `mintingPaused` from the computed monetary state.
- **Why it matters:** If a Severely Adverse scenario drops RR below 100%, minting must pause — the test doesn't verify this safeguard.
- **Required correction:** Each `runCCARScenario()` must call `computeMonetaryStateV19(stressedAssets, …)` and assert `state.mintingPaused === (state.reserveRatio.ratio < 100)`.

### Mismatch #7 — Constitutional invariants (§45) imported but never verified
- **Blueprint rule (§45):** 21 non-amendable invariants must hold under all conditions, including stress.
- **Current test behavior:** `CONSTITUTIONAL_INVARIANTS` is imported (line 88) but **never referenced**. It is a dead import.
- **Why it matters:** The most fundamental constitutional guarantees (100% reserve minimum, no lending, no encumbrance, redemption rights, etc.) are not verified to survive stress.
- **Required correction:** Add a post-scenario assertion block: for each invariant, verify the corresponding engine output (e.g. "100% Reserve Minimum" → `state.reserveRatio.compliant === true`; "No Lending of Reserves" → no lending recorded; "Redemption Rights" → `redemptionSequence()` succeeds).

### Mismatch #8 — Shock absorber (§17) bypassed with constant volatility
- **Blueprint rule (§17):** EWMA volatility (λ=0.94) drives the shock-absorber factor `A_t ∈ [0.5, 1.0]` which dampens currency-weight momentum.
- **Current test behavior:** `volatility = 0.015` and `ewmaReturns = []` are hardcoded in the `computeMonetaryStateV19` call. Under Severely Adverse (gold −30%), volatility should spike toward 5%+, driving `A_t → 0.5`.
- **Why it matters:** The shock absorber is the constitutional mechanism that prevents panic-driven currency-weight swings. By feeding it a constant 1.5%, the test disables it.
- **Required correction:** Construct a synthetic 30-day return series per scenario (e.g. Severely Adverse: 30 daily returns averaging −1.1% with σ ≈ 5%) and pass to `ewmaVolatility()`.

### Mismatch #9 — Counterparty scores flat, not §7 multiplicative
- **Blueprint rule (§7):** `C_a = Credit_a × Jurisdiction_a × Operational_a` (multiplicative), clamped [0.90, 1.00].
- **Current test behavior:** Flat per-asset constants: `cash: 1.00, sov: 0.99, gold: 1.00, silver: 1.00, stab: 0.96`. The `sovCounterparty` override is also a single number, not a (C, J, O) decomposition.
- **Why it matters:** A multiplicative composite captures the principle that "any single weak dimension materially impairs the overall counterparty quality" — a sovereign downgrade to A (credit=0.95) under sanctions (jurisdiction=0.95) with operational incident (operational=0.95) yields `0.95³ = 0.857`, not the test's flat `0.95`.
- **Required correction:** Replace flat scores with `counterpartyScore(credit, jurisdiction, operational)` per scenario, with each dimension stressed independently.

### Mismatch #10 — Bullion mix not swept (§25.2 verification gap)
- **Blueprint rule (§25.2):** The gold share φ ∈ [0.60, 0.95] of the bullion layer is a constitutional band. RR and LCR must hold at every point in the band.
- **Current test behavior:** Only the baseline 80/20 mix is tested. No sweep across φ ∈ {0.60, 0.65, …, 0.95}.
- **Why it matters:** A 95% gold allocation under a gold −30% shock produces a materially worse RR than a 60% gold allocation. The test doesn't verify RR ≥ 100% across the band.
- **Required correction:** Add a `sweepBullionMix(φ_values, scenario)` test.

---

## 7. Required Corrections (Test Redesigns, Not Blueprint Changes)

The blueprint is the supreme source of truth. The following corrections target the **test suite** (`federal-institutional-tests.ts`) and supplementary test infrastructure.

### Correction C1 — Independent silver stress
- **Where:** `runCCARScenario()` (line 622) and all 8 scenario definitions (Severe/Adverse/Baseline + 5 historical).
- **Change:** Decouple `silverMult` from `goldMult`. Use historical silver-gold correlation estimates (≈ 0.65 long-run) and apply scenario-specific silver shocks (e.g. COVID-2020: silverMult=0.75 vs goldMult=0.88, per actual market data).

### Correction C2 — Fix HQLA sovereign leg
- **Where:** `runCCARScenario()` line 638.
- **Change:** Replace `SOVEREIGN_USD × opts.stabPrice × …` with `SOVEREIGN_USD × 1.0 × (1 − H_sov) × C_sov_stressed`. Sovereign price is par ($1.00), not `stabPrice`.

### Correction C3 — Exercise §34 redemption hierarchy
- **Where:** New test in Category 3 (CCAR) or Category 6 (Historical).
- **Change:** For each scenario, call `redemptionSequence(stressedRedemptionAmount, stressedAssets)`. Assert the liquidation plan touches zero gold when total non-gold reserves ≥ redemption amount. Document the tier-by-tier drawdown.

### Correction C4 — Assert Bullion Protection Rule
- **Where:** New test, paired with C3.
- **Change:** `assert(bullionProtectionCheck(plan).goldLiquidated === false)` for every scenario where non-gold reserves suffice.

### Correction C5 — Compute §7 counterparty score multiplicatively
- **Where:** `makeReserveAssets()` (line 208) and per-scenario overrides.
- **Change:** Replace flat `counterpartyScore` with `counterpartyScore(credit, jurisdiction, operational)` — each scenario specifies (credit, jurisdiction, operational) per asset, and the function returns the multiplicative composite.

### Correction C6 — Stressed CRI computation
- **Where:** New CRI test in Category 1 or Category 3.
- **Change:** Per scenario, set `criInputs = {liquidity, fx, custody, counterparty, operational}` with shocked values; assert CRI level ≤ "high" and that no single component exceeds 90.

### Correction C7 — Stressed shock absorber (§17)
- **Where:** `baselineState` and each `runCCARScenario()`.
- **Change:** Construct a synthetic 30-day return series per scenario (Severe: σ≈5%, Adverse: σ≈3%, Baseline: σ≈1.5%); pass to `ewmaVolatility()` to compute `A_t`; assert `A_t` falls within [0.5, 1.0] and matches the scenario.

### Correction C8 — SDP trigger assertions
- **Where:** Historical scenarios (Category 6).
- **Change:** For each historical scenario, identify the currency with the largest FX deviation; call `detectSDP(currentPrice, referencePrice, currency)`; assert trigger fires when deviation >5% and the new weight respects the 50% anti-shock cap.

### Correction C9 — Minting pause verification
- **Where:** Each `runCCARScenario()`.
- **Change:** Compute `state = computeMonetaryStateV19(stressedAssets, …)`; assert `state.mintingPaused === (state.reserveRatio.ratio < 100 || !state.basketVerification.passed)`.

### Correction C10 — §45 invariants post-scenario verification
- **Where:** New Category 11 (or extend Category 8).
- **Change:** Iterate `CONSTITUTIONAL_INVARIANTS` (21 entries). For each, map to an engine-output check:
  - "100% Reserve Minimum" → `state.reserveRatio.compliant`
  - "No Lending of Reserves" → no lending transaction recorded
  - "Redemption Rights" → `redemptionSequence()` succeeds for stressed amount
  - "Mandatory Proof of Reserves" → `state.reserves.market > 0`
  - "Gold Constitutional Anchor" → `state.goldUsd > 0`
  - … etc. for all 21.
- Assert each invariant is preserved after every stress scenario.

### Correction C11 — Bullion-mix sweep
- **Where:** New test in Category 3.
- **Change:** Iterate φ ∈ {0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95}. For each, re-allocate the bullion layer (gold_qty × φ × bullionUSD / goldPrice, silver_qty × (1−φ) × bullionUSD / silverPrice), run the Severely Adverse scenario, assert RR ≥ 100% and LCR ≥ 100%.

### Correction C12 — Derive HQLA from reserves, not constant
- **Where:** Test 2.1, 2.4.
- **Change:** Replace `HQLA_BASELINE_USD = 32_400_000` with `CASH_USD + SOVEREIGN_USD × (1−H_sov) × C_sov + min(STABLECOIN_USD × (1−H_stab) × stabPrice, 0.15 × total_HQLA)` (Basel III Level 1 + Level 2B 15% cap).

### Correction C13 — Duration under stress
- **Where:** Each `runCCARScenario()`.
- **Change:** Recompute `portfolioDuration(stressedAssets)` and assert `≤ 0.75` (§8).

### Correction C14 — Dynamic redemption-rate model
- **Where:** `redemptionPct` parameter.
- **Change:** Replace hardcoded 25% / 15% / 10% with a model: baseline rate from rolling-30-day redemption history, scaled by scenario severity multiplier. The 25% number itself is reasonable (between Basel retail 20% and wholesale 40%) but should be documented as derived, not arbitrary.

### Correction C15 — Live oracle integration for baseline
- **Where:** `BASE_GOLD_USD`, `BASE_SILVER_USD`, FX rates, `goldUsd12moAgo`.
- **Change:** Pull from `getLiveOracleData()` (already exists in `nav-compute.ts`); fall back to constants only if oracle unreachable. This eliminates test-vs-production drift.

---

## 8. Blueprint Changes Needed

**Default: NONE.** The blueprint (Part 1 Layer 1 Constitution, Part 2 Layer 2 Monetary Constitution, Part 3 Layer 3 Policy Framework) is the supreme source of truth and is internally consistent. The v19.0.2 addendum (§19.1 PAR-based RR, §19.2 over-collateralization, §19.3 §29 trigger taxonomy) resolves prior ambiguities.

**No blueprint changes are recommended.** All corrections target the test suite (`federal-institutional-tests.ts`) and its supporting infrastructure.

**Optional clarification (not a change):** The v19 addendum could be enhanced to explicitly state that the federal stress-testing framework MUST exercise §34, §34.2, §33, §29, §45 under stress — but this is an addendum-level clarification, not a blueprint amendment. The §40 stress-testing framework already lists the required scenario categories; the test suite simply hasn't implemented them all.

---

## 9. Conclusion

The federal stress-testing suite is a high-quality **banking-regulatory** audit (Basel III, CCAR, DFAST, IFRS 9, MiCAR, AML) but a deficient **constitutional** audit. It passes 9/18 blueprint rules and violates 9. The most serious violations are:

1. **Silver treated as a gold derivative** (silverMult = goldMult), violating §25.2 independence.
2. **Stablecoin depeg propagated to sovereign HQLA**, violating §2/§6/§7 asset independence.
3. **§34 redemption hierarchy never exercised**, §34.2 Bullion Protection Rule never asserted.
4. **§33 SDP never triggered under stress**, §45 invariants imported but never verified.
5. **§17 shock absorber bypassed** with constant 1.5% volatility.
6. **§7 counterparty score** uses flat constants, not the multiplicative C×J×O composite.
7. **Bullion mix (§25.2 band [60%, 95%]) never swept** — only the baseline 80/20 is tested.

All required corrections target the **test suite**. The blueprint remains the supreme source of truth and requires no changes.

**Recommended next step:** Engage the Federal Banking & Institutional Audit Expert (Task 8-a owner) to redesign `federal-institutional-tests.ts` implementing corrections C1–C15. Track via Task 9-b (test redesign) and Task 9-c (verification of redesigned tests against this audit report).

---

*End of Constitutional Audit Report — Task 9-a.*

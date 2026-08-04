# Federal Test Gap Report — Task 9-a
## Gap Between `federal-institutional-tests.ts` and Constitutional Compliance

**Date:** 2026-08-26
**Author:** Chief Quantitative Risk Engineer & Constitutional Monetary System Engineer
**Task ID:** 9-a
**Companion document:** `docs/verification/constitutional-audit-report.md`

This report enumerates which federal tests fail (or would fail under proper constitutional assertion), which fail due to hardcoded assumptions vs. blueprint mismatches, which are structurally correct, and the overall compliance gap.

---

## 1. Federal Tests That FAIL Due to Hardcoded Assumptions

These tests pass under the current implementation because the hardcoded values are calibrated to make them pass. Under a proper dynamic, configurable implementation they would expose failures or require redesign.

| Test # | Test Name | Hardcoded Assumption Causing Failure | Why It's a Gap |
|---|---|---|---|
| 3.1–3.4 (Severely Adverse) | CET1/Tier1/Total/Leverage/LCR across 9 quarters | `goldMult=0.70, silverMult=0.70` (correlation = 1.0); `stabPrice=0.90`; `redemptionPct=0.25`; `sovCounterparty=0.95` | Passes only because silver silently tracks gold. If silver were independently stressed (e.g. silverMult=0.55 for COVID-style industrial collapse), CET1 would drop further and 3.4a–3.4e could fail. |
| 3.1 (Severe HQLA) | HQLA computation in `runCCARScenario` line 636–639 | `SOVEREIGN_USD × opts.stabPrice × (1−H_sov) × C_sov` | Stablecoin depeg (`stabPrice=0.90`) is incorrectly subtracted from sovereign HQLA. If sovereign were correctly held at par, HQLA would be ~$1.35M higher and the test would still pass — but the *reported* HQLA is wrong. |
| 2.1 / 2.1b | LCR ≥ 100% / ≥ 120% | `HQLA_BASELINE_USD = $32.4M` hardcoded | Does not derive from `valueReserves(baselineAssets)`. If `valueReserves()` produces a different HQLA (likely, given the stablecoin Level 2B 15% cap), the test result is decoupled from actual reserve composition. |
| 2.4 | Stressed LCR ≥ 100% under 30-day stressed outflow (25%) | `stressedOutflowPct = 0.25` hardcoded; HQLA unchanged from baseline (line 589 comment: "no asset-side haircut in this stress") | The 25% outflow is reasonable, but HQLA should be **stressed** (stablecoin depeg reduces HQLA Level 2B contribution). Without asset-side stress, this test under-reports true LCR vulnerability. |
| 4.1–4.4 | IFRS 9 ECL stages | `pdStage1`, `pdStage2`, `pdStage3`, `lgd` hardcoded per asset | Reasonable for a model illustration, but the stablecoin PDs (0.2% / 2% / 30%) are point estimates with no confidence interval. A proper ECL model would derive PDs from market-implied credit spreads. |
| 6.1–6.5 | Historical stress replays (2023/2020/2008/1997/2022) | Each scenario's goldMult/silverMult/stabPrice are point estimates from historical data — no Monte Carlo uncertainty | Passes by construction (historical data is known). Doesn't model "what if 2020 COVID had been 2× worse?" |
| 7.1–7.5 | SIF assessment | `SIF_SIZE_THRESHOLD = $50B`, `crossExposuresUsd = R_m` hardcoded; `substitutabilityScore = 3`, `directCounterparties = 7` | Informational tests, but the substitutability score (3) and counterparty count (7) are expert-judgment constants. |
| 8.2 | DFAST company-run stress framework | `requiredCategories` list hardcoded | Passes because `STRESS_SCENARIOS` includes all 5 required categories by construction. Doesn't verify the scenarios have *content*, only that the category names exist. |
| 9.2 | MiCAR capital ≥ 2% reserves | `MICAR_MIN_CAPITAL_PCT = 0.02` hardcoded; `ANNUAL_OP_COST_USD = $500K` hardcoded | Passes given $1.62M CET1 > max($1.13M, €125K, $250K). Would fail if op cost rose to $3M/year or if reserve value dropped 50%. |
| §41 | Operational capital ≥ 12 months | `ANNUAL_OP_COST_USD = $500K` hardcoded | Passes with $1.62M CET1 covering 39 months. Would fail if op cost rose to $2M/year (only 9.7 months coverage). |
| §10 | Counterparty concentration | Hardcoded exposure percentages | Passes given the fixed baseline composition. Would fail if cash concentration rose above 25% (single counterparty limit). |

**Subtotal: 12 test groups that pass only because of hardcoded calibration.**

---

## 2. Federal Tests That FAIL Due to Blueprint Mismatches

These tests would fail under proper constitutional assertion because the test itself does not implement the blueprint rule.

| Missing Test | Blueprint Rule | Why It's Missing | Required Redesign |
|---|---|---|---|
| §34 redemption hierarchy walk | §34 (v19-infra L346–384) | `redemptionSequence()` is never called; tests check RR/LCR but not tier-by-tier liquidation | Add `redemptionSequence(stressedAmount, stressedAssets)` per scenario; assert tier order: stablecoin → cash → sovereign → sukuk → silver → gold LAST |
| §34.2 Bullion Protection Rule | §34.2 (v19-infra L386–395) | `bullionProtectionCheck()` never called | Assert `goldLiquidated === false` for every stressed redemption where non-gold reserves suffice |
| §33 SDP trigger under stress | §33 (v19-infra L188–265) | `detectSDP()` never called; 1997 Asian scenario should fire SDP on JPY but doesn't | Per historical scenario, compute `detectSDP()` for the most-deviated currency; assert trigger fires when deviation >5% |
| §25.2 bullion-mix sweep | §25.2 (v19 addendum §6) | Only baseline 80/20 mix tested; no sweep across [60%, 95%] gold | Iterate φ ∈ {0.60, 0.65, …, 0.95}; for each, re-allocate bullion and run Severely Adverse; assert RR ≥ 100% and LCR ≥ 100% |
| §7 multiplicative counterparty under stress | §7 (engine L236–245) | Flat per-asset `counterpartyScore` constants; `sovCounterparty` override is single number | Replace with `counterpartyScore(credit, jurisdiction, operational)` per scenario |
| §17 shock absorber under stress | §17 (engine L395–463) | `volatility = 0.015` constant; `ewmaReturns = []` | Construct synthetic 30-day return series per scenario; pass to `ewmaVolatility()` to compute `A_t` |
| §9 CRI under stress | §9 (engine L270–301) | `BASE_CRI_INPUTS = {20, 30, 25, 40, 15}` hardcoded; never re-stressed | Per scenario, set stressed CRI inputs; assert CRI level ≤ "high" |
| §4 + §22A minting pause | §4 + §22A (engine L755) | `mintingPaused` never read | Per scenario, call `computeMonetaryStateV19()`; assert `mintingPaused === (RR < 100 || !basketVerified)` |
| §36.3 redemption never pauses | §36.3 (v19 addendum §19.5.2) | No explicit test that redemption proceeds when `mintingPaused = true` | Force `mintingPaused = true` (via RR<100%); assert `redemptionSequence()` still returns valid plan |
| §45 21 invariants post-scenario | §45 (v19-infra L534–557) | `CONSTITUTIONAL_INVARIANTS` imported but never referenced | Iterate 21 invariants; per invariant, map to engine-output check; assert preserved after every scenario |
| §8 duration under stress | §8 (engine L250–259) | Duration only checked at baseline (0.12y); not re-asserted under stressed sovereign rates | Per scenario, recompute `portfolioDuration(stressedAssets)`; assert ≤ 0.75 |
| §29 rebalancing triggers under stress | §29 (v19-infra L2455+) | `detectRebalanceTriggers()` never called; tests use fixed baseline | Per scenario, compute `detectRebalanceTriggers(stressedContext)`; assert triggers fire appropriately (e.g. `reserve_ratio` critical when RR<100%) |
| Silver-gold correlation ≠ 1.0 | §25.2 (independence) | `silverMult = goldMult` in CCAR scenarios | Decouple; use independent silver shocks based on industrial-demand and supply-shock factors |
| HQLA stablecoin Level 2B 15% cap | Basel III §27 + blueprint §5 | Stablecoin HQLA not capped at 15% of total HQLA | Cap stablecoin HQLA contribution at 15% × (cash + sovereign HQLA) |
| Tier 1 / Tier 2 / Tier 3 / Tier 4 range compliance | Part 3 Art. I (blueprint L7874–L8045) | Federal test does not verify tier allocations against constitutional/policy ranges | Per scenario, compute tier weights from stressed assets; assert within [25%, 60%] / [30%, 40%] / [15%, 25%] / [0%, 10%] (constitutional) and [35%, 45%] / [30%, 40%] / [15%, 25%] / [2%, 8%] (policy) |

**Subtotal: 15 missing test categories required by the blueprint.**

---

## 3. Federal Tests That Are Structurally Correct

These tests faithfully implement both the blueprint and federal regulatory standards. No redesign needed.

| Test # | Test Name | Why It's Correct |
|---|---|---|
| 1.1 | CET1 capital ratio ≥ 4.5% | Correctly computes `CET1 / RWA`; over-collat buffer is the proper CET1 analogue for a 100%-reserve institution |
| 1.2 | Tier 1 capital ratio ≥ 6% | Correct (Tier 1 = CET1 for MTQ, no AT1) |
| 1.3 | Total capital ratio ≥ 8% | Correct (Total = Tier 1 for MTQ, no Tier 2) |
| 1.4 | CET1 + CCB ≥ 7.0% | Correctly applies 2.5% CCB on top of 4.5% minimum |
| 1.5 | CCyB activation up to 2.5% | Correctly tests 9.5% CET1 threshold for max CCyB |
| 1.6 | Leverage ratio ≥ 3% | Correctly computes `CET1 / total_exposure` with no netting |
| 1.7 | TLAC eligibility (if designated G-SIB) | Correctly tests 18% RWA / 6.75% leverage TLAC thresholds |
| 2.2 | NSFR ≥ 100% | Correctly applies ASF/RSF weights per Basel III §28 |
| 2.3 / 2.3b | Intraday liquidity | Correctly uses cash as immediately-available intraday liquidity |
| 4.1–4.4 | IFRS 9 ECL stages | Correctly applies 12-month / lifetime / impaired ECL formulas |
| 5.1 | CTR threshold flagging | Correctly implements FinCEN $10K CTR |
| 5.2 | SAR structuring detection | Correctly detects 6×$9,500 structuring pattern |
| 5.3 | OFAC sanctions screening | Correctly blocks SDN addresses |
| 5.4 | FATF Travel Rule | Correctly applies $1K threshold |
| 5.5 | Rate limiter (10/min) | Correctly tests §35 rate limit |
| 5.5b | $1B supply hard cap | Correctly tests §3 supply cap |
| 8.1 | DFAST supervisory stress test methodology | Correctly verifies annual frequency if subject |
| 9.1 | MiCAR ART qualification | Correctly identifies MTQ as ART (fiat + commodity + basket) |
| 9.3 | MiCAR custody (segregated + bankruptcy-remote) | Correctly verifies all 5 tiers segregated |
| 9.4 | MiCAR white-paper (constitution covers required areas) | Correctly maps §1–§55 to MiCAR Article 17 areas |
| 10.1 | RTO ≤ 4 hours | Correctly tests §47.3 Level 1 RTO |
| 10.2 | RPO ≤ 1 hour | Correctly tests §47.3 Level 1 RPO |
| 10.3 | BCP documented for all continuity levels | Correctly verifies 4 §47 levels |
| 10.4 | DR failover capability | Correctly verifies §47 Level 3 + §39 backup/emergency keys |
| 10.5 | Cyber resilience (NIST CSF + §39) | Correctly verifies 5 NIST CSF functions + key hierarchy |
| §56 | No dependency concentration risks | Correctly calls `getDependencyHealth()` |

**Subtotal: 26 structurally correct tests.**

---

## 4. Gap Between Current Implementation and Constitutional Compliance

### 4.1 Quantitative gap

| Metric | Current State | Constitutional Requirement | Gap |
|---|---|---|---|
| Blueprint rules compliant | 9 / 18 | 18 / 18 | **9 rules non-compliant (50%)** |
| Hardcoded stress values | ~30+ distinct hardcoded constants | 0 (all should derive from oracle / scenario library / dynamic models) | **30+ values to refactor** |
| Constitutional sections exercised | §4, §5, §6, §8 (partial), §9 (formula only), §37 (proof types) | §1–§55 with focus on §4, §5, §6, §7, §8, §9, §17, §22A, §23–29, §33, §34, §34.2, §36.3, §40, §45 | **§7, §17, §22A, §23–29, §33, §34, §34.2, §36.3, §45 not exercised under stress** |
| Reserve assets independently stressed | 2 of 5 (gold, stablecoin partially) | 5 of 5 (cash, sovereign, gold, silver, stablecoin) | **3 assets not independently stressed (cash OK as risk-free; sovereign missing rate risk; silver merged with gold)** |
| Bullion mixes tested | 1 (baseline 80/20) | 8 (sweep across [60%, 95%]) | **7 mixes untested** |
| Constitutional invariants verified | 0 of 21 (imported but unused) | 21 of 21 | **21 invariants unverified** |
| §34 redemption hierarchy calls | 0 | ≥1 per stress scenario (8 scenarios) | **8+ missing test calls** |
| §33 SDP trigger calls | 0 | ≥1 per historical scenario (5 scenarios with deviation >5%) | **5+ missing test calls** |

### 4.2 Qualitative gap

The current federal test treats MTQ as a **bank holding company** subject to Basel III / CCAR / DFAST / IFRS 9 / MiCAR / AML — and successfully passes those frameworks. But MTQ is constitutionally a **monetary institution**, not a bank. The constitutional framework (§1–§55) imposes additional invariants that the banking-regulatory framework does not:

1. **Constitutional redemption hierarchy (§34)** — banks liquidate assets in any order; MTQ must follow stablecoin → cash → sovereign → silver → gold.
2. **Bullion Protection Rule (§34.2)** — banks can sell any asset; MTQ must preserve gold until last resort.
3. **SDP (§33)** — banks have no equivalent; MTQ must trigger emergency weighting when a currency deviates >5%.
4. **21 non-amendable invariants (§45)** — banks have regulatory requirements that can be amended; MTQ's are permanent.
5. **Dynamic reserve allocation (§23–29)** — banks hold static reserves; MTQ's allocation responds to RR and gold volatility.
6. **Gold/silver bullion band (§25.2)** — banks have no equivalent; MTQ must keep gold in [60%, 95%] of bullion.

The federal test addresses **0 of 6** of these constitutional-layer requirements.

### 4.3 Severity-ranked gap summary

| Severity | Gap Description | Count |
|---|---|---|
| **BLOCKER** | §34, §34.2, §33, §45, §22A+§4 minting pause, §25.2 silver independence, §7 multiplicative counterparty | 7 |
| **MATERIAL** | §17 shock absorber, §9 CRI under stress, §8 duration under stress, §29 rebalancing triggers, HQLA stablecoin 15% cap, Tier range compliance | 6 |
| **STRUCTURAL** | Hardcoded baseline composition (cash/sov/gold/silver/stab USD amounts), hardcoded FX rates, hardcoded gold/silver prices | 3 categories |
| **INFORMATIONAL** | Hardcoded SIF scores, op-cost assumptions, sovereign yield | 3 |

### 4.4 Path to closure

To close the gap between the current federal test suite and full constitutional compliance:

1. **Task 9-b (Test Redesign):** Implement corrections C1–C15 from the constitutional audit report. Estimated effort: 2–3 engineer-days.
2. **Task 9-c (Verification):** Re-run the redesigned test suite; verify all 18 blueprint rules now pass. Estimated effort: 0.5 engineer-days.
3. **Task 9-d (CI Integration):** Wire the redesigned test suite into CI so future regressions are caught. Estimated effort: 0.5 engineer-days.

**Total estimated closure effort: 3–4 engineer-days.**

---

## 5. Final Verdict

The current `federal-institutional-tests.ts` is a **banking-regulatory pass** but a **constitutional audit fail**. It certifies MTQ as a sound bank-like institution under Basel III / CCAR / DFAST / IFRS 9 / MiCAR / AML, but does not certify MTQ as a faithful implementation of the Constitutional Blueprint.

The 9/18 compliance score reflects a test suite that was designed against the **wrong standard** (banking regulation) rather than the **right standard** (constitutional monetary system). The blueprint is correct; the test must be redesigned.

**Recommended action:** Proceed to Task 9-b (test redesign) using the 15 corrections enumerated in `docs/verification/constitutional-audit-report.md` §7.

---

*End of Federal Gap Report — Task 9-a.*

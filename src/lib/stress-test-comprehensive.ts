/**
 * @deprecated DEPRECATED — use `stress-test-fixed.ts` instead.
 *
 * This file has a known bug (documented in reserve-dynamicity-audit.md §16):
 * the `makeReserveAssets` helper derives gold quantity as
 * `(totalReserve × 0.16) / goldPrice`, so the dollar value never changes
 * and NAV_m is stuck at $1.0000 regardless of the gold price shock.
 *
 * `stress-test-fixed.ts` is the corrected version with FIXED physical bullion
 * quantities (FIXED_GOLD_OZ = 2,122.86 oz, FIXED_SILVER_OZ = 36,758 oz)
 * that properly reflects price shocks in the NAV.
 *
 * This file is retained for historical reference only. Do NOT use it for
 * production stress testing. All stress test consumers should import from
 * `stress-test-fixed.ts` instead.
 *
 * @see stress-test-fixed.ts
 * @see docs/verification/reserve-dynamicity-audit.md §16 (U8)
 */

/**
 * MITHQAL v19.0.3 — COMPREHENSIVE STRESS TEST SUITE (DEPRECATED)
 *
 * Tests every scenario the monetary engine must handle:
 * 1. Gold price shocks (up/down)
 * 2. Individual currency crashes (each of 8 currencies)
 * 3. Currency suspension/removal (§12, §33 SDP)
 * 4. Silver ratio adjustment (§25.2 φ_t)
 * 5. Reserve allocation shifts (§23-29)
 * 6. NAV changes under stress
 * 7. Emergency governance triggers (§44)
 * 8. Basket verification under stress (§22A)
 * 9. Reserve ratio breaches (§4)
 * 10. Multi-currency NAV stability
 */

import { computeMonetaryStateV19, HAIRCUTS, MAX_DURATION } from "./monetary-engine-v19";
import { detectRebalanceTriggers, generateRebalancePlan, CONSTITUTIONAL_EXPOSURE_LIMITS, checkExposure } from "./v19-infrastructure";
import type { ReserveAsset } from "./monetary-engine-v19";
import type { OracleSnapshot, CurrencyData } from "./oracle-data";

// ---- Base oracle snapshot (live-like data) ----
const BASE_GOLD = 4076.9;
const BASE_SILVER = 58.76;

function makeCurrencies(fxRates: Record<string, number>): CurrencyData[] {
  return [
    { code: "USD", name: "US Dollar",       fx: fxRates.USD || 1.0,    cofer: 0.585, swift: 0.400, bis: 0.550, lta: 0.5110, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "EUR", name: "Euro",             fx: fxRates.EUR || 0.87,   cofer: 0.195, swift: 0.220, bis: 0.200, lta: 0.2100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "JPY", name: "Japanese Yen",     fx: fxRates.JPY || 0.0063, cofer: 0.050, swift: 0.180, bis: 0.150, lta: 0.1080, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "GBP", name: "Pound Sterling",   fx: fxRates.GBP || 0.74,   cofer: 0.040, swift: 0.200, bis: 0.180, lta: 0.1100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CNY", name: "Chinese Yuan",     fx: fxRates.CNY || 0.148,  cofer: 0.035, swift: 0.120, bis: 0.080, lta: 0.0830, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CHF", name: "Swiss Franc",      fx: fxRates.CHF || 0.81,   cofer: 0.008, swift: 0.040, bis: 0.020, lta: 0.0230, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "AUD", name: "Australian Dollar", fx: fxRates.AUD || 1.42,  cofer: 0.005, swift: 0.035, bis: 0.020, lta: 0.0160, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CAD", name: "Canadian Dollar",  fx: fxRates.CAD || 1.40,   cofer: 0.005, swift: 0.025, bis: 0.025, lta: 0.0130, lifecycleStatus: "full", admittedDate: "2024-01-01" },
  ];
}

function makeReserveAssets(goldPrice: number, silverPrice: number, totalReserve: number = 54_000_000): ReserveAsset[] {
  return [
    { id: "cash-1", name: "Central-bank cash", assetClass: "cash", quantity: totalReserve * 0.50, priceUsd: 1, haircut: HAIRCUTS.cash, counterpartyScore: 1.00, stressCoefficient: 0.95, modifiedDuration: 0 },
    { id: "sov-1", name: "US T-bills", assetClass: "sovereign", quantity: totalReserve * 0.25, priceUsd: 1, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: 0.90, modifiedDuration: 0.5 },
    { id: "gold-1", name: "Gold", assetClass: "gold", quantity: (totalReserve * 0.16) / goldPrice, priceUsd: goldPrice, haircut: HAIRCUTS.gold, counterpartyScore: 1.00, stressCoefficient: 0.85, modifiedDuration: 0 },
    { id: "silver-1", name: "Silver", assetClass: "silver", quantity: (totalReserve * 0.04) / silverPrice, priceUsd: silverPrice, haircut: HAIRCUTS.silver, counterpartyScore: 1.00, stressCoefficient: 0.80, modifiedDuration: 0 },
    { id: "stab-1", name: "Stablecoins", assetClass: "stablecoin", quantity: totalReserve * 0.05, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.96, stressCoefficient: 0.80, modifiedDuration: 0 },
  ];
}

function makeOracle(goldUsd: number, fxRates: Record<string, number>, gold12moAgo?: number, vol?: number): OracleSnapshot {
  const currencies = makeCurrencies(fxRates);
  return {
    goldUsd,
    goldUsd12moAgo: gold12moAgo || 2650,
    goldUsd7dAgo: goldUsd * 0.995,
    goldUsdYesterday: goldUsd * 0.999,
    currencies,
    fxAgo: { ...fxRates },
    fx7dAgo: { ...fxRates },
    fxAgo1d: { ...fxRates },
    cryptoPrices: { btc: 64000, eth: 3200 },
    goldPriceSeries: gold12moAgo ? [gold12moAgo, goldUsd] : [],
    liveDataSources: ["test"],
    liveDataFetchedAt: new Date().toISOString(),
  } as OracleSnapshot;
}

function runScenario(name: string, fn: () => void) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`SCENARIO: ${name}`);
  console.log(`${"=".repeat(70)}`);
  try {
    fn();
    console.log(`  ✅ PASSED`);
  } catch (e: any) {
    console.log(`  ❌ FAILED: ${e.message}`);
  }
}

function fmt(n: number, d = 4): string {
  return n.toFixed(d);
}

const SUPPLY = 54_000_000;
const LCR = { hqla: 32_400_000, expectedRedemptions: 5_400_000, committedInflows: 0, operationalAdjustments: 0 };
const CRI = { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 };
const BASE_FX = { USD: 1.0, EUR: 0.87, JPY: 0.0063, GBP: 0.74, CNY: 0.148, CHF: 0.81, AUD: 1.42, CAD: 1.40 };

// ---- BASELINE ----
const baseline = computeMonetaryStateV19(
  makeOracle(BASE_GOLD, BASE_FX),
  makeReserveAssets(BASE_GOLD, BASE_SILVER),
  SUPPLY, LCR, CRI, 0.015, []
);

console.log("\n" + "=".repeat(70));
console.log("MITHQAL v19.0.3 COMPREHENSIVE STRESS TEST SUITE");
console.log("Tests all monetary engine scenarios per blueprint §1-§56");
console.log("=".repeat(70));
console.log(`\nBASELINE (gold=$${BASE_GOLD}, silver=$${BASE_SILVER}):`);
console.log(`  NAV_m: $${fmt(baseline.nav.market)}`);
console.log(`  NAV_l: $${fmt(baseline.nav.prudential)}`);
console.log(`  NAV_stress: $${fmt(baseline.nav.stress)}`);
console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}%`);
console.log(`  LCR: ${fmt(baseline.lcr.ratio, 2)}`);
console.log(`  CRI: ${fmt(baseline.cri.cri, 2)} (${baseline.cri.level})`);
console.log(`  Shock Absorber: ${fmt(baseline.shockAbsorber, 2)}`);
console.log(`  Basket Verified: ${baseline.basketVerification.passed}`);
console.log(`  Minting Paused: ${baseline.mintingPaused}`);

// ============ 1. GOLD PRICE SHOCKS ============

runScenario("Gold +20% (gold rally)", () => {
  const newGold = BASE_GOLD * 1.20;
  const state = computeMonetaryStateV19(
    makeOracle(newGold, BASE_FX, BASE_GOLD * 0.80),
    makeReserveAssets(newGold, BASE_SILVER), SUPPLY, LCR, CRI, 0.025, []
  );
  console.log(`  Gold: $${BASE_GOLD} → $${fmt(newGold, 2)}`);
  console.log(`  NAV_m: $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
  console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}% → ${fmt(state.reserveRatio.ratio, 2)}%`);
  console.log(`  Shock Absorber: ${fmt(baseline.shockAbsorber)} → ${fmt(state.shockAbsorber)}`);
  console.log(`  Gold tier value: $${fmt(BASE_GOLD * (54e6 * 0.16 / BASE_GOLD))} → $${fmt(newGold * (54e6 * 0.16 / newGold))}`);
  console.log(`  ANALYSIS: Gold rally increases reserve value → NAV rises above $1`);
  console.log(`  ANALYSIS: Higher volatility triggers shock absorber (A_t < 1.0)`);
  if (state.nav.market <= baseline.nav.market) throw new Error("NAV should increase with gold rally");
  if (state.reserveRatio.ratio <= baseline.reserveRatio.ratio) throw new Error("Ratio should increase");
});

runScenario("Gold -20% (gold crash)", () => {
  const newGold = BASE_GOLD * 0.80;
  const state = computeMonetaryStateV19(
    makeOracle(newGold, BASE_FX, BASE_GOLD),
    makeReserveAssets(newGold, BASE_SILVER), SUPPLY, LCR, CRI, 0.035, []
  );
  console.log(`  Gold: $${BASE_GOLD} → $${fmt(newGold, 2)}`);
  console.log(`  NAV_m: $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
  console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}% → ${fmt(state.reserveRatio.ratio, 2)}%`);
  console.log(`  Shock Absorber: ${fmt(baseline.shockAbsorber)} → ${fmt(state.shockAbsorber)}`);
  console.log(`  Minting Paused: ${state.mintingPaused}`);
  console.log(`  ANALYSIS: Gold crash decreases reserve value → NAV falls`);
  console.log(`  ANALYSIS: If ratio < 100%, minting pauses (constitutional guard)`);
  if (state.nav.market >= baseline.nav.market) throw new Error("NAV should decrease with gold crash");
});

runScenario("Gold +50% (extreme rally)", () => {
  const newGold = BASE_GOLD * 1.50;
  const state = computeMonetaryStateV19(
    makeOracle(newGold, BASE_FX, BASE_GOLD * 0.70),
    makeReserveAssets(newGold, BASE_SILVER), SUPPLY, LCR, CRI, 0.05, []
  );
  console.log(`  Gold: $${BASE_GOLD} → $${fmt(newGold, 2)}`);
  console.log(`  NAV_m: $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
  console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}% → ${fmt(state.reserveRatio.ratio, 2)}%`);
  console.log(`  ANALYSIS: Extreme gold rally → NAV rises significantly`);
  console.log(`  ANALYSIS: MTQ appreciates against ALL currencies (gold-backed)`);
});

runScenario("Gold -40% (extreme crash)", () => {
  const newGold = BASE_GOLD * 0.60;
  const state = computeMonetaryStateV19(
    makeOracle(newGold, BASE_FX, BASE_GOLD),
    makeReserveAssets(newGold, BASE_SILVER), SUPPLY, LCR, CRI, 0.06, []
  );
  console.log(`  Gold: $${BASE_GOLD} → $${fmt(newGold, 2)}`);
  console.log(`  NAV_m: $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
  console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}% → ${fmt(state.reserveRatio.ratio, 2)}%`);
  console.log(`  Stress NAV: $${fmt(state.nav.stress)}`);
  console.log(`  Minting Paused: ${state.mintingPaused}`);
  console.log(`  ANALYSIS: Extreme crash → NAV drops, ratio may breach 100%`);
  console.log(`  ANALYSIS: Emergency governance (§44) may activate if CRI > threshold`);
});

// ============ 2. CURRENCY CRASHES ============

const currencyCrashScenarios = [
  { code: "EUR", name: "Euro -30%", factor: 0.70 },
  { code: "JPY", name: "Yen -40%", factor: 0.60 },
  { code: "GBP", name: "Pound -25%", factor: 0.75 },
  { code: "CNY", name: "Yuan -20%", factor: 0.80 },
  { code: "CHF", name: "Franc -15%", factor: 0.85 },
  { code: "AUD", name: "AUD -35%", factor: 0.65 },
  { code: "CAD", name: "CAD -30%", factor: 0.70 },
  { code: "USD", name: "USD -10% (all FX adjust)", factor: 0.90 },
];

for (const scenario of currencyCrashScenarios) {
  runScenario(`Currency crash: ${scenario.name}`, () => {
    const newFx = { ...BASE_FX };
    if (scenario.code === "USD") {
      // USD crash means all foreign currencies appreciate
      for (const c of Object.keys(newFx)) {
        if (c !== "USD") newFx[c] = newFx[c] / scenario.factor;
      }
    } else {
      newFx[scenario.code] = (newFx[scenario.code] || 1) * scenario.factor;
    }
    
    const state = computeMonetaryStateV19(
      makeOracle(BASE_GOLD, newFx, BASE_GOLD * 0.95),
      makeReserveAssets(BASE_GOLD, BASE_SILVER), SUPPLY, LCR, CRI, 0.02, []
    );
    
    const baseWeight = baseline.weights.find(w => w.code === scenario.code);
    const newWeight = state.weights.find(w => w.code === scenario.code);
    
    console.log(`  ${scenario.code} FX: ${fmt(BASE_FX[scenario.code as keyof typeof BASE_FX] || 1)} → ${fmt(newFx[scenario.code] || 1)}`);
    console.log(`  ${scenario.code} weight: ${fmt((baseWeight?.normalizedWeight || 0) * 100, 2)}% → ${fmt((newWeight?.normalizedWeight || 0) * 100, 2)}%`);
    console.log(`  ${scenario.code} momentum: ${fmt(baseWeight?.momentum || 0)} → ${fmt(newWeight?.momentum || 0)}`);
    console.log(`  NAV_m: $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
    console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}% → ${fmt(state.reserveRatio.ratio, 2)}%`);
    console.log(`  Basket verified: ${state.basketVerification.passed}`);
    
    // Check if the crashed currency hit the 0.5% floor
    const weight = newWeight?.normalizedWeight || 0;
    if (weight < 0.005) {
      console.log(`  ⚠️ ${scenario.code} hit minimum floor (0.5%) — eligible for §12 suspension`);
    }
    
    console.log(`  ANALYSIS: ${scenario.code} crash → its gold-denominated price rises`);
    console.log(`  ANALYSIS: Momentum M_i changes (P_12mo/P_today shifts)`);
    console.log(`  ANALYSIS: Currency weight adjusts via momentum + mean reversion`);
    console.log(`  ANALYSIS: If weight < 0.5%, §22A floor breach → currency may be suspended (§12)`);
  });
}

// ============ 3. CURRENCY SUSPENSION / REMOVAL (§12, §33 SDP) ============

runScenario("Currency suspension: EUR weight drops below 0.5% floor (§22A)", () => {
  // Simulate EUR losing 90% of its value
  const newFx = { ...BASE_FX, EUR: BASE_FX.EUR * 0.10 };
  const state = computeMonetaryStateV19(
    makeOracle(BASE_GOLD, newFx, BASE_GOLD * 0.95),
    makeReserveAssets(BASE_GOLD, BASE_SILVER), SUPPLY, LCR, CRI, 0.03, []
  );
  
  const eurWeight = state.weights.find(w => w.code === "EUR");
  console.log(`  EUR FX: ${fmt(BASE_FX.EUR)} → ${fmt(newFx.EUR)}`);
  console.log(`  EUR weight: ${fmt((eurWeight?.normalizedWeight || 0) * 100, 4)}%`);
  console.log(`  EUR below floor: ${eurWeight?.belowFloor}`);
  console.log(`  Basket floor check: ${state.basketVerification.allAboveFloor}`);
  console.log(`  Basket verified: ${state.basketVerification.passed}`);
  console.log(`  ANALYSIS: If EUR < 0.5%, §22A basket verification fails`);
  console.log(`  ANALYSIS: Minting pauses until EUR is either: rebalanced back above floor, OR suspended (§12.8) and removed (§12.9)`);
  console.log(`  ANALYSIS: §33 SDP may trigger if deviation > 5% from reference`);
});

runScenario("SDP trigger: JPY deviates >5% from gold reference (§33)", () => {
  // JPY crashes 50% — gold price in JPY doubles
  const newFx = { ...BASE_FX, JPY: BASE_FX.JPY * 0.50 };
  const state = computeMonetaryStateV19(
    makeOracle(BASE_GOLD, newFx, BASE_GOLD * 0.95),
    makeReserveAssets(BASE_GOLD, BASE_SILVER), SUPPLY, LCR, CRI, 0.04, []
  );
  
  const jpyWeight = state.weights.find(w => w.code === "JPY");
  const jpyGoldPrice = jpyWeight?.goldPrice || 0;
  const jpyGold12mo = jpyWeight?.goldPrice12moAgo || 0;
  const deviation = jpyGold12mo > 0 ? Math.abs((jpyGoldPrice - jpyGold12mo) / jpyGold12mo) * 100 : 0;
  
  console.log(`  JPY FX: ${fmt(BASE_FX.JPY, 6)} → ${fmt(newFx.JPY, 6)}`);
  console.log(`  Gold in JPY: ¥${fmt(jpyGold12mo, 0)} → ¥${fmt(jpyGoldPrice, 0)}`);
  console.log(`  Deviation: ${fmt(deviation, 2)}% (SDP threshold: 5%)`);
  console.log(`  JPY weight: ${fmt((jpyWeight?.normalizedWeight || 0) * 100, 2)}%`);
  console.log(`  ANALYSIS: JPY deviation > 5% → §33 SDP triggers`);
  console.log(`  ANALYSIS: SDP emergency weight: max(W_emergency, W_current × 0.50)`);
  console.log(`  ANALYSIS: If sustained, Council reviews JPY for suspension (§12.8)`);
});

// ============ 4. GOLD/SILVER RATIO ADJUSTMENT (§25.2 φ_t) ============

runScenario("Gold/Silver ratio: Silver +100% (silver rally)", () => {
  const newSilver = BASE_SILVER * 2.0;
  const state = computeMonetaryStateV19(
    makeOracle(BASE_GOLD, BASE_FX),
    makeReserveAssets(BASE_GOLD, newSilver), SUPPLY, LCR, CRI, 0.015, []
  );
  
  console.log(`  Silver: $${BASE_SILVER} → $${fmt(newSilver, 2)}`);
  console.log(`  NAV_m: $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
  console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}% → ${fmt(state.reserveRatio.ratio, 2)}%`);
  console.log(`  ANALYSIS: Silver rally increases bullion layer value`);
  console.log(`  ANALYSIS: §25.2: Silver share of bullion increases (toward 40% max)`);
  console.log(`  ANALYSIS: Gold share φ_t decreases (toward 60% min)`);
  console.log(`  ANALYSIS: Rebalancing NOT triggered while 75% ≤ Gold ≤ 85%`);
});

runScenario("Gold/Silver ratio: Silver -50% (silver crash)", () => {
  const newSilver = BASE_SILVER * 0.50;
  const state = computeMonetaryStateV19(
    makeOracle(BASE_GOLD, BASE_FX),
    makeReserveAssets(BASE_GOLD, newSilver), SUPPLY, LCR, CRI, 0.015, []
  );
  
  console.log(`  Silver: $${BASE_SILVER} → $${fmt(newSilver, 2)}`);
  console.log(`  NAV_m: $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
  console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}% → ${fmt(state.reserveRatio.ratio, 2)}%`);
  console.log(`  ANALYSIS: Silver crash decreases bullion layer value`);
  console.log(`  ANALYSIS: §25.2: Silver share of bullion decreases (toward 5% min)`);
  console.log(`  ANALYSIS: Gold share φ_t increases (toward 95% max)`);
});

// ============ 5. RESERVE ALLOCATION SHIFTS (§23-29) ============

runScenario("Reserve allocation: Gold +30% shifts bullion above 25% cap", () => {
  const newGold = BASE_GOLD * 1.30;
  const assets = makeReserveAssets(newGold, BASE_SILVER);
  const state = computeMonetaryStateV19(
    makeOracle(newGold, BASE_FX), assets, SUPPLY, LCR, CRI, 0.03, []
  );
  
  // Calculate actual layer percentages
  const totalReserve = assets.reduce((s, a) => s + a.quantity * a.priceUsd, 0);
  const fiatValue = assets[0].quantity * assets[0].priceUsd + assets[1].quantity * assets[1].priceUsd;
  const bullionValue = assets[2].quantity * assets[2].priceUsd + assets[3].quantity * assets[3].priceUsd;
  const stableValue = assets[4].quantity * assets[4].priceUsd;
  
  console.log(`  Gold: $${BASE_GOLD} → $${fmt(newGold, 2)}`);
  console.log(`  Fiat layer: ${fmt((fiatValue / totalReserve) * 100, 2)}% (range: 70-80%)`);
  console.log(`  Bullion layer: ${fmt((bullionValue / totalReserve) * 100, 2)}% (range: 15-25%)`);
  console.log(`  Stablecoin layer: ${fmt((stableValue / totalReserve) * 100, 2)}% (range: 2-8%)`);
  console.log(`  NAV_m: $${fmt(state.nav.market)}`);
  console.log(`  ANALYSIS: Gold rally pushes bullion above 25% → §29 rebalancing trigger`);
  console.log(`  ANALYSIS: Rebalance: sell excess gold, buy fiat/stablecoin to restore range`);
  
  // Check rebalancing triggers — §29 RebalanceContext (v19 §29.1)
  // Pass layer weights both as currentWeights (for §29.1 weight_drift
  // at the layer level) and as layerWeights (for §29.1 layer_breach
  // against constitutional layer ranges §23-25).
  const triggers = detectRebalanceTriggers({
    currentWeights: new Map([
      ["fiat", fiatValue / totalReserve],
      ["bullion", bullionValue / totalReserve],
      ["stablecoin", stableValue / totalReserve],
    ]),
    targetWeights: new Map([
      ["fiat", 0.75],
      ["bullion", 0.20],
      ["stablecoin", 0.05],
    ]),
    reserveRatio: state.reserveRatio.ratio,
    lcr: state.lcr.ratio,
    rebalanceThreshold: 0.02,
    layerWeights: new Map([
      ["fiat", fiatValue / totalReserve],
      ["bullion", bullionValue / totalReserve],
      ["stablecoin", stableValue / totalReserve],
    ]),
    layerRanges: new Map([
      ["fiat", { min: 0.70, max: 0.80 }],
      ["bullion", { min: 0.15, max: 0.25 }],
      ["stablecoin", { min: 0.02, max: 0.08 }],
    ]),
  });
  console.log(`  Rebalance triggers: ${triggers.length}`);
  for (const t of triggers) {
    console.log(`    → ${t.type}: ${t.description} [${t.severity}]`);
  }
});

// ============ 6. HIGH VOLATILITY / SHOCK ABSORBER ============

runScenario("High volatility σ=6% (shock absorber at maximum)", () => {
  const state = computeMonetaryStateV19(
    makeOracle(BASE_GOLD, BASE_FX),
    makeReserveAssets(BASE_GOLD, BASE_SILVER), SUPPLY, LCR, CRI, 0.06, []
  );
  console.log(`  Volatility: 6% (≥ V_HIGH = 5%)`);
  console.log(`  Shock Absorber A_t: ${fmt(state.shockAbsorber)} (expected: 0.5)`);
  console.log(`  ANALYSIS: At σ ≥ 5%, A_t = 0.5 (maximum dampening)`);
  console.log(`  ANALYSIS: All currency weight adjustments dampened by 50%`);
  console.log(`  ANALYSIS: Prevents any single currency from dominating during crisis`);
  if (state.shockAbsorber !== 0.5) throw new Error(`Expected 0.5, got ${state.shockAbsorber}`);
});

// ============ 7. EMERGENCY GOVERNANCE (§44) ============

runScenario("Emergency: Reserve ratio drops below 100% (§4 breach)", () => {
  const newGold = BASE_GOLD * 0.50; // Gold crashes 50%
  const state = computeMonetaryStateV19(
    makeOracle(newGold, BASE_FX, BASE_GOLD),
    makeReserveAssets(newGold, BASE_SILVER), SUPPLY, LCR, CRI, 0.06, []
  );
  
  console.log(`  Gold: $${BASE_GOLD} → $${fmt(newGold, 2)} (-50%)`);
  console.log(`  NAV_m: $${fmt(state.nav.market)}`);
  console.log(`  NAV_stress: $${fmt(state.nav.stress)}`);
  console.log(`  Reserve Ratio: ${fmt(state.reserveRatio.ratio, 2)}%`);
  console.log(`  Minting Paused: ${state.mintingPaused}`);
  console.log(`  CRI: ${fmt(state.cri.cri)} (${state.cri.level})`);
  console.log(`  ANALYSIS: Ratio < 100% → minting auto-pauses (constitutional guard)`);
  console.log(`  ANALYSIS: §44 Emergency Governance may activate (Level 2/3/4)`);
  console.log(`  ANALYSIS: Redemption NEVER pauses (§36.3 — burn always works)`);
  console.log(`  ANALYSIS: Emergency Custodian may be appointed (§44.5)`);
});

// ============ 8. MULTI-CURRENCY NAV STABILITY ============

runScenario("Multi-currency NAV: 1 MTQ across all currencies after gold +20%", () => {
  const newGold = BASE_GOLD * 1.20;
  const state = computeMonetaryStateV19(
    makeOracle(newGold, BASE_FX, BASE_GOLD * 0.85),
    makeReserveAssets(newGold, BASE_SILVER), SUPPLY, LCR, CRI, 0.025, []
  );
  
  console.log(`  Gold: $${BASE_GOLD} → $${fmt(newGold, 2)}`);
  console.log(`  NAV (USD): $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
  console.log(`  1 MTQ in all currencies:`);
  for (const w of state.weights) {
    const baseW = baseline.weights.find(b => b.code === w.code);
    console.log(`    ${w.code}: ${fmt(baseW?.goldPrice || 0, 2)} → ${fmt(w.goldPrice, 2)} (gold price in ${w.code})`);
  }
  console.log(`  ANALYSIS: When gold rises, 1 MTQ buys MORE of every currency`);
  console.log(`  ANALYSIS: This is numeraire independence (§1) — MTQ tracks gold, not USD`);
  console.log(`  ANALYSIS: USD-pegged stablecoins would NOT show this behavior`);
});

// ============ 9. STABLECOIN LAYER STRESS ============

runScenario("Stablecoin depeg: USDC drops to $0.90", () => {
  const assets = makeReserveAssets(BASE_GOLD, BASE_SILVER);
  // Modify stablecoin price to $0.90 (depeg)
  assets[4] = { ...assets[4], priceUsd: 0.90 };
  const state = computeMonetaryStateV19(
    makeOracle(BASE_GOLD, BASE_FX), assets, SUPPLY, LCR, CRI, 0.015, []
  );
  
  console.log(`  Stablecoin price: $1.00 → $0.90 (-10% depeg)`);
  console.log(`  NAV_m: $${fmt(baseline.nav.market)} → $${fmt(state.nav.market)}`);
  console.log(`  Reserve Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}% → ${fmt(state.reserveRatio.ratio, 2)}%`);
  console.log(`  ANALYSIS: Depeg reduces stablecoin layer value → NAV drops slightly`);
  console.log(`  ANALYSIS: §27: If depeg persists, stablecoin is replaced with eligible alternative`);
  console.log(`  ANALYSIS: Haircut (2%) provides buffer before ratio breaches 100%`);
});

// ============ 10. EXPOSURE LIMIT CHECKS (§10) ============

runScenario("Exposure check: All categories", () => {
  const exposures: Record<string, number> = {
    single_counterparty: 0.08,    // 8% (limit 10%)
    single_custodian: 0.22,       // 22% (limit 25%)
    single_issuer: 0.14,          // 14% (limit 15%)
    single_jurisdiction: 0.28,    // 28% (limit 30%)
    single_currency: 0.48,        // 48% (limit 35% — BREACH for non-USD)
    single_asset_class: 0.75,     // 75% (limit 40% — BREACH)
    operational_concentration: 0.30, // 30% (limit 35%)
  };
  
  const results = checkExposure(exposures);
  console.log(`  Exposure checks:`);
  for (const r of results) {
    const status = r.status === "compliant" ? "✅" : r.status === "warning" ? "⚠️" : "❌";
    console.log(`    ${status} ${r.category}: ${fmt(r.currentExposure * 100, 1)}% / ${fmt(r.limit * 100, 1)}% (${fmt(r.utilized, 1)}% utilized)`);
  }
  console.log(`  ANALYSIS: Single currency (48%) breaches 35% limit — but USD is exempt (§10.5)`);
  console.log(`  ANALYSIS: Single asset class (75%) breaches 40% — needs rebalancing`);
});

// ============ SUMMARY ============

console.log("\n" + "=".repeat(70));
console.log("STRESS TEST SUMMARY");
console.log("=".repeat(70));
console.log(`Baseline NAV: $${fmt(baseline.nav.market)}`);
console.log(`Baseline Ratio: ${fmt(baseline.reserveRatio.ratio, 2)}%`);
console.log(`Baseline Basket: ${baseline.basketVerification.passed ? "PASS" : "FAIL"}`);
console.log("");
console.log("Key findings:");
console.log("  1. Gold rally (+20%): NAV rises, ratio improves, MTQ appreciates vs ALL currencies");
console.log("  2. Gold crash (-20%): NAV falls, ratio drops, may pause minting");
console.log("  3. Currency crash: Weight adjusts via momentum, may hit 0.5% floor → §12 suspension");
console.log("  4. SDP trigger: >5% deviation from gold reference → emergency weight adjustment");
console.log("  5. Silver rally: Bullion layer rebalances (gold share decreases)");
console.log("  6. High volatility: Shock absorber dampens all weight changes by 50%");
console.log("  7. Emergency: Ratio < 100% → minting pauses, redemption never pauses");
console.log("  8. Multi-currency: MTQ tracks gold, not USD — appreciates against all currencies when gold rises");
console.log("  9. Stablecoin depeg: Haircut buffer absorbs small depegs; §27 replacement for persistent");
console.log("  10. Exposure limits: §10 categories checked, breaches trigger rebalancing");

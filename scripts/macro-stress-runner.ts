/**
 * MITHQAL — Macro Reserve Robustness Validation Runner
 *
 * Executes all stress scenarios from the §2, §6, §7 specification:
 *   - JPY scenarios A-F (−20%, −30%, −40%, −50%, combined, recovery)
 *   - Precious metals scenarios (gold ±20%/+50%, silver ±30%, opposite directions, combined)
 *   - Systemic crisis (JPY −40% + USD vol + EUR vol + gold +30% + silver +20% + liquidity stress + oracle disagreement)
 *
 * Uses the SAME engine and SAME helpers as stress-test-fixed.ts — no mock.
 * Outputs structured JSON to stdout for capture.
 */
import {
  computeMonetaryStateV19,
  shockAbsorberFactor,
  applyHysteresis,
  type HysteresisState,
  type ReserveAsset,
  type MonetaryStateV19,
} from "../src/lib/monetary-engine-v19";
import type { OracleSnapshot, CurrencyData } from "../src/lib/oracle-data";
import {
  detectSDP,
  computeSDPEmergency,
  SDP_TRIGGER_THRESHOLD,
  SDP_CAP,
} from "../src/lib/v19-infrastructure";
import {
  computeDynamicReserveAllocation,
  FIXED_GOLD_OZ,
  FIXED_SILVER_OZ,
  FIXED_CASH_USD,
} from "../src/lib/reserve-allocation";

// ============================================================
// CONSTANTS (match stress-test-fixed.ts)
// ============================================================

const BASE_GOLD = 4076.9;
const BASE_SILVER = 58.76;
const SUPPLY = 54_000_000;

const GOLD_OZ = FIXED_GOLD_OZ;
const SILVER_OZ = FIXED_SILVER_OZ;
const CASH_USD = FIXED_CASH_USD;
const SOVEREIGN_USD = 13_500_000;
const STABLECOIN_USD = 2_700_000;

const LCR = { hqla: 32_400_000, expectedRedemptions: 5_400_000, committedInflows: 0, operationalAdjustments: 0 };
const CRI = { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 };

const BASE_FX: Record<string, number> = {
  USD: 1.0, EUR: 0.87, JPY: 0.0063, GBP: 0.74,
  CNY: 0.148, CHF: 0.81, AUD: 1.42, CAD: 1.40,
};

// ============================================================
// HELPERS (match stress-test-fixed.ts)
// ============================================================

function makeCurrencies(fxRates: Record<string, number>): CurrencyData[] {
  return [
    { code: "USD", name: "US Dollar",       fx: fxRates.USD, cofer: 0.585, swift: 0.400, bis: 0.550, lta: 0.5110, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "EUR", name: "Euro",            fx: fxRates.EUR, cofer: 0.195, swift: 0.220, bis: 0.200, lta: 0.2100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "JPY", name: "Japanese Yen",    fx: fxRates.JPY, cofer: 0.050, swift: 0.180, bis: 0.150, lta: 0.1080, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "GBP", name: "Pound Sterling",  fx: fxRates.GBP, cofer: 0.040, swift: 0.200, bis: 0.180, lta: 0.1100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CNY", name: "Chinese Yuan",    fx: fxRates.CNY, cofer: 0.035, swift: 0.120, bis: 0.080, lta: 0.0830, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CHF", name: "Swiss Franc",     fx: fxRates.CHF, cofer: 0.008, swift: 0.040, bis: 0.020, lta: 0.0230, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "AUD", name: "Australian Dollar", fx: fxRates.AUD, cofer: 0.005, swift: 0.035, bis: 0.020, lta: 0.0160, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CAD", name: "Canadian Dollar",  fx: fxRates.CAD, cofer: 0.005, swift: 0.025, bis: 0.025, lta: 0.0130, lifecycleStatus: "full", admittedDate: "2024-01-01" },
  ];
}

function makeReserveAssets(
  goldPrice: number = BASE_GOLD,
  silverPrice: number = BASE_SILVER,
  overrides: { cashUsd?: number; sovereignUsd?: number; stablecoinUsd?: number; stablecoinPrice?: number } = {}
): ReserveAsset[] {
  const SEED_TOTAL = CASH_USD + SOVEREIGN_USD + GOLD_OZ * BASE_GOLD + SILVER_OZ * BASE_SILVER + STABLECOIN_USD;
  const allocation = computeDynamicReserveAllocation({
    totalReserve: SEED_TOTAL,
    goldPrice,
    silverPrice,
    reserveRatio: 102,
    goldVolatility: 0.015,
  });
  const cashUsd = overrides.cashUsd ?? CASH_USD;
  const sovereignUsd = overrides.sovereignUsd ?? SOVEREIGN_USD;
  const stablecoinUsd = overrides.stablecoinUsd ?? STABLECOIN_USD;
  const stablecoinPrice = overrides.stablecoinPrice ?? 1.0;
  return allocation.reserveAssets.map((a) => {
    if (a.assetClass === "cash") return { ...a, quantity: cashUsd, priceUsd: 1 };
    if (a.assetClass === "sovereign") return { ...a, quantity: sovereignUsd, priceUsd: 1 };
    if (a.assetClass === "stablecoin") return { ...a, quantity: stablecoinUsd, priceUsd: stablecoinPrice };
    return a;
  });
}

function makeOracle(
  goldUsd: number,
  fxRates: Record<string, number>,
  opts: { gold12moAgo?: number; fxAgo?: Record<string, number> } = {}
): OracleSnapshot {
  const gold12moAgo = opts.gold12moAgo ?? goldUsd;
  const fxAgo = opts.fxAgo ?? { ...fxRates };
  return {
    goldUsd,
    goldUsd12moAgo: gold12moAgo,
    goldUsd7dAgo: goldUsd * 0.995,
    goldUsdYesterday: goldUsd * 0.999,
    currencies: makeCurrencies(fxRates),
    fxAgo,
    fx7dAgo: { ...fxAgo },
    fxAgo1d: { ...fxAgo },
  };
}

// ============================================================
// SCENARIO RUNNER
// ============================================================

interface ScenarioResult {
  scenario: string;
  description: string;
  shocks: Record<string, string>;
  results: {
    reserveRatio: number;
    compliant: boolean;
    policyTarget: boolean;
    navMarket: number;
    navPrudential: number;
    navStress: number;
    lcr: number;
    cri: number;
    criLevel: string;
    jpyWeight: number;
    usdWeight: number;
    eurWeight: number;
    topCurrency: string;
    topWeight: number;
    basketSum: number;
    allAboveFloor: boolean;
    allBelowCap: boolean;
    shockAbsorber: number;
    mintingPaused: boolean;
    sdpTriggered: boolean;
  };
  verdict: "PASS" | "FAIL" | "WARNING";
  notes: string[];
}

function runScenario(
  scenario: string,
  description: string,
  shocks: Record<string, string>,
  opts: {
    goldPrice?: number;
    silverPrice?: number;
    fxRates?: Record<string, number>;
    fxAgo?: Record<string, number>;
    volatility?: number;
    cashUsd?: number;
    stablecoinPrice?: number;
  } = {}
): ScenarioResult {
  const goldUsd = opts.goldPrice ?? BASE_GOLD;
  const silverUsd = opts.silverPrice ?? BASE_SILVER;
  const fxRates = opts.fxRates ?? BASE_FX;
  const fxAgo = opts.fxAgo ?? BASE_FX;

  const oracle = makeOracle(goldUsd, fxRates, { fxAgo });
  const reserveAssets = makeReserveAssets(goldUsd, silverUsd, {
    cashUsd: opts.cashUsd,
    stablecoinPrice: opts.stablecoinPrice,
  });

  const state = computeMonetaryStateV19(
    oracle,
    reserveAssets,
    SUPPLY,
    LCR,
    CRI,
    opts.volatility ?? 0.015,
    []
  );

  const weights = state.weights ?? [];
  const jpyW = weights.find((w) => w.code === "JPY")?.normalizedWeight ?? 0;
  const usdW = weights.find((w) => w.code === "USD")?.normalizedWeight ?? 0;
  const eurW = weights.find((w) => w.code === "EUR")?.normalizedWeight ?? 0;

  let topCurrency = "USD";
  let topWeight = 0
  let topW = 0;
  for (const w of weights) {
    if (w.normalizedWeight > topWeight) { topWeight = w.normalizedWeight; topCurrency = w.code; }
  }

  const basketSum = weights.reduce((s, w) => s + w.normalizedWeight, 0);
  const allAboveFloor = weights.every((w) => w.normalizedWeight >= 0.005);
  const allBelowCap = weights.every((w) => w.normalizedWeight <= 0.60);

  // Check SDP for JPY
  const jpyCurrency = oracle.currencies.find((c) => c.code === "JPY");
  const sdpTriggered = jpyCurrency
    ? Math.abs(jpyCurrency.fx - (fxAgo.JPY ?? jpyCurrency.fx)) / (fxAgo.JPY ?? jpyCurrency.fx) > SDP_TRIGGER_THRESHOLD
    : false;

  const notes: string[] = [];
  let verdict: ScenarioResult["verdict"] = "PASS";

  if (!state.reserveRatio.compliant) { notes.push("RR below 100% floor"); verdict = "FAIL"; }
  if (!allAboveFloor) { notes.push("Currency below 0.5% floor"); verdict = "FAIL"; }
  if (!allBelowCap) { notes.push("Currency above 60% cap"); verdict = "FAIL"; }
  if (topWeight > 0.60) { notes.push(`Top currency ${topCurrency} > 60%`); verdict = "FAIL"; }
  if (Math.abs(basketSum - 1.0) > 0.01) { notes.push(`Basket sum ${basketSum.toFixed(4)} ≠ 1.0`); verdict = "WARNING"; }
  if (state.mintingPaused) { notes.push("Minting paused (RR < 100% or basket verification failed)"); }

  if (verdict === "PASS") {
    notes.push("All constitutional bounds maintained");
    notes.push("Reserve ratio compliant");
    notes.push("Basket diversified");
  }

  return {
    scenario,
    description,
    shocks,
    results: {
      reserveRatio: state.reserveRatio.ratio,
      compliant: state.reserveRatio.compliant,
      policyTarget: state.reserveRatio.policyTarget,
      navMarket: state.nav.market,
      navPrudential: state.nav.prudential,
      navStress: state.nav.stress,
      lcr: state.lcr.ratio,
      cri: state.cri.cri,
      criLevel: state.cri.level,
      jpyWeight: jpyW,
      usdWeight: usdW,
      eurWeight: eurW,
      topCurrency,
      topWeight,
      basketSum,
      allAboveFloor,
      allBelowCap,
      shockAbsorber: state.shockAbsorber ?? 1.0,
      mintingPaused: state.mintingPaused,
      sdpTriggered,
    },
    verdict,
    notes,
  };
}

// ============================================================
// RUN ALL SCENARIOS
// ============================================================

const results: ScenarioResult[] = [];

// === §2 JPY Scenarios A-F ===

// A: JPY −20% (mild)
results.push(runScenario("A", "JPY −20%", { JPY: "−20%" }, {
  fxRates: { ...BASE_FX, JPY: BASE_FX.JPY * 0.80 },
}));

// B: JPY −30%
results.push(runScenario("B", "JPY −30%", { JPY: "−30%" }, {
  fxRates: { ...BASE_FX, JPY: BASE_FX.JPY * 0.70 },
}));

// C: JPY −40%
results.push(runScenario("C", "JPY −40%", { JPY: "−40%" }, {
  fxRates: { ...BASE_FX, JPY: BASE_FX.JPY * 0.60 },
}));

// D: JPY −50%
results.push(runScenario("D", "JPY −50%", { JPY: "−50%" }, {
  fxRates: { ...BASE_FX, JPY: BASE_FX.JPY * 0.50 },
}));

// E: JPY −50% + USD strength + EUR strength + gold +30% + vol + liquidity
results.push(runScenario("E", "JPY −50% + USD strength + EUR strength + gold +30% + elevated vol + liquidity stress",
  { JPY: "−50%", USD: "+strength", EUR: "+strength", Gold: "+30%", Vol: "elevated", Liq: "stress" },
  {
    fxRates: { ...BASE_FX, JPY: BASE_FX.JPY * 0.50, EUR: BASE_FX.EUR * 1.05, GBP: BASE_FX.GBP * 1.05 },
    goldPrice: BASE_GOLD * 1.30,
    volatility: 0.06,
    cashUsd: CASH_USD * 0.85, // liquidity stress — 15% of cash locked
  }
));

// F: JPY recovery
results.push(runScenario("F", "JPY recovery (back to baseline)", { JPY: "recovery" }, {
  fxRates: { ...BASE_FX },
}));

// === §6 Precious Metals ===

results.push(runScenario("GOLD+20", "Gold +20%", { Gold: "+20%" }, { goldPrice: BASE_GOLD * 1.20 }));
results.push(runScenario("GOLD+50", "Gold +50%", { Gold: "+50%" }, { goldPrice: BASE_GOLD * 1.50 }));
results.push(runScenario("GOLD-20", "Gold −20%", { Gold: "−20%" }, { goldPrice: BASE_GOLD * 0.80 }));
results.push(runScenario("SILVER+30", "Silver +30%", { Silver: "+30%" }, { silverPrice: BASE_SILVER * 1.30 }));
results.push(runScenario("SILVER-30", "Silver −30%", { Silver: "−30%" }, { silverPrice: BASE_SILVER * 0.70 }));
results.push(runScenario("GOLD_UP_SILVER_DOWN", "Gold +20% & Silver −15%", { Gold: "+20%", Silver: "−15%" },
  { goldPrice: BASE_GOLD * 1.20, silverPrice: BASE_SILVER * 0.85 }));
results.push(runScenario("CURRENCY_GOLD", "JPY −40% + Gold +30%", { JPY: "−40%", Gold: "+30%" },
  { fxRates: { ...BASE_FX, JPY: BASE_FX.JPY * 0.60 }, goldPrice: BASE_GOLD * 1.30 }));

// === §7 Systemic Crisis ===

results.push(runScenario("SYSTEMIC", "Systemic: JPY −40% + USD vol + EUR vol + gold +30% + silver +20% + liquidity stress + elevated vol",
  { JPY: "−40%", USD: "vol", EUR: "vol", Gold: "+30%", Silver: "+20%", Vol: "elevated", Liq: "stress" },
  {
    fxRates: { ...BASE_FX, JPY: BASE_FX.JPY * 0.60, EUR: BASE_FX.EUR * 0.95, GBP: BASE_FX.GBP * 0.95 },
    goldPrice: BASE_GOLD * 1.30,
    silverPrice: BASE_SILVER * 1.20,
    volatility: 0.08,
    cashUsd: CASH_USD * 0.80,
  }
));

// === §5 Hysteresis Test ===

const hysteresisState: HysteresisState = { confirmationCounts: new Map() };
const hysteresisTest = {
  tests: [] as Array<{ step: string; proposed: number; current: number; applied: number; expectedBehavior: string; correct: boolean }>,
};

let applied: number;

// Step 1: small change (1%) — should NOT trigger (within noise band)
applied = applyHysteresis("JPY", 0.06, 0.05, hysteresisState);
hysteresisTest.tests.push({
  step: "1. Small Δ1% (5%→6%)", proposed: 0.06, current: 0.05, applied,
  expectedBehavior: "Should keep current (0.05) — within 2% noise band",
  correct: applied === 0.05,
});

// Step 2: large change (3%) — first observation, should NOT apply yet
applied = applyHysteresis("JPY", 0.08, 0.05, hysteresisState);
hysteresisTest.tests.push({
  step: "2. Large Δ3% (5%→8%), 1st obs", proposed: 0.08, current: 0.05, applied,
  expectedBehavior: "Should keep current (0.05) — needs 2nd confirmation",
  correct: applied === 0.05,
});

// Step 3: same large change — second observation, should NOW apply
applied = applyHysteresis("JPY", 0.08, 0.05, hysteresisState);
hysteresisTest.tests.push({
  step: "3. Large Δ3% (5%→8%), 2nd obs", proposed: 0.08, current: 0.05, applied,
  expectedBehavior: "Should apply proposed (0.08) — 2nd confirmation reached",
  correct: applied === 0.08,
});

// === §8 Shock Absorber Test ===

const shockAbsorberTests = [
  { vol: 0.01, expected: 1.0, desc: "σ=1% (normal) → A_t=1.0" },
  { vol: 0.02, expected: 1.0, desc: "σ=2% (threshold) → A_t=1.0" },
  { vol: 0.035, expected: 0.75, desc: "σ=3.5% (mid) → A_t≈0.75" },
  { vol: 0.05, expected: 0.5, desc: "σ=5% (high) → A_t=0.5" },
  { vol: 0.10, expected: 0.5, desc: "σ=10% (extreme) → A_t=0.5 (capped)" },
].map((t) => {
  const actual = shockAbsorberFactor(t.vol);
  return { ...t, actual, pass: Math.abs(actual - t.expected) < 0.02 };
});

// === OUTPUT ===

const output = {
  timestamp: new Date().toISOString(),
  gitHead: "d273247",
  scenarios: results,
  hysteresisTest,
  shockAbsorberTests,
  summary: {
    total: results.length,
    passed: results.filter((r) => r.verdict === "PASS").length,
    warnings: results.filter((r) => r.verdict === "WARNING").length,
    failed: results.filter((r) => r.verdict === "FAIL").length,
    hysteresisAllCorrect: hysteresisTest.tests.every((t) => t.correct),
    shockAbsorberAllPass: shockAbsorberTests.every((t) => t.pass),
  },
};

console.log(JSON.stringify(output, null, 2));

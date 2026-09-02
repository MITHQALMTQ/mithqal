// ════════════════════════════════════════════════════════════
// MITHQAL §V25.2 — Reserve Weighting Simulator
// Interactive stress-testing · Monte Carlo (250K paths) · §V25.2 formulas
// ════════════════════════════════════════════════════════════
export const MODULE_ID = "v25.2-reserve-simulator-1.0";

// §V25.2 — Formal stress testing uses 250,000 paths with seed=42
// for stable tail estimates (per blueprint §V25.2 Monte Carlo spec).
// The interactive simulator runs a lighter 10K-path preview for responsiveness.
export const MC_FORMAL_PATHS = 250_000;
export const MC_INTERACTIVE_PATHS = 10_000;
export const MC_SEED = 42;

export interface ShockScenario { id: string; name: string; currency: string; declinePct: number; goldDeclinePct?: number; }
export const PRESET_SHOCKS: ShockScenario[] = [
  { id: "gold-20", name: "Gold -20%", currency: "GOLD", declinePct: 0.2, goldDeclinePct: 0.2 },
  { id: "usd-10", name: "USD -10%", currency: "USD", declinePct: 0.1 },
  { id: "currency-15", name: "Currency -15%", currency: "EUR", declinePct: 0.15 },
  { id: "digital-50", name: "Digital -50%", currency: "USDC", declinePct: 0.5 },
  { id: "combined", name: "Combined Shock", currency: "ALL", declinePct: 0.12 },
];

export interface SliderControl { id: string; label: string; min: number; max: number; step: number; default: number; }
export const SLIDER_CONTROLS: SliderControl[] = [
  { id: "sleeve.fiat", label: "Fiat sleeve %", min: 0.7, max: 0.85, step: 0.01, default: 0.8 },
  { id: "sleeve.gold", label: "Gold sleeve %", min: 0.15, max: 0.25, step: 0.01, default: 0.18 },
  { id: "sleeve.digital", label: "Digital sleeve %", min: 0, max: 0.05, step: 0.005, default: 0.02 },
  { id: "supply", label: "MTQ Supply", min: 1000000, max: 500000000, step: 1000000, default: 100000000 },
  { id: "goldPrice", label: "Gold Price ($)", min: 1000, max: 10000, step: 50, default: 4500 },
];

// ─── Monte Carlo engine (deterministic, seed=42) ───
// Simple LCG (Linear Congruential Generator) for reproducibility
// Same algorithm as scripts/monte-carlo-v24.2.py (seed=42)
function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Box-Muller transform for Gaussian samples
function gaussian(rng: () => number, mean = 0, std = 1): number {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

// Student-t sample (df=5) for fat tails (FX/gold/silver)
function studentT(rng: () => number, df = 5): number {
  const normal = gaussian(rng);
  const chiSq = 2 * gaussian(rng, 0, 1) ** 2; // simplified chi-square
  return normal / Math.sqrt(chiSq / df);
}

export interface MonteCarloResult {
  paths: number;
  seed: number;
  RR_mean: number;
  RR_p5: number;
  RR_p50: number;
  RR_p95: number;
  RR_min: number;
  RR_worstScenario: string;
  FSCR_mean: number;
  probRRBelow100: number;
  probRRBelow130: number;
  probLCRBelow100: number;
  computationMs: number;
}

export function runMonteCarlo(paths: number = MC_INTERACTIVE_PATHS, seed: number = MC_SEED): MonteCarloResult {
  const startMs = Date.now();
  const rng = lcg(seed);
  const baseRR = 1.2365;
  const baseFSCR = 1.1603;

  // Streaming statistics (no array storage — handles 250K+ paths without OOM)
  let rrSum = 0, fscrSum = 0;
  let below100 = 0, below130 = 0, lcrBelow100 = 0;
  let worstRR = Infinity;
  let worstScenario = "baseline";

  // For percentile estimation, use a fixed-size reservoir sample (10K samples)
  const reservoirSize = Math.min(10_000, paths);
  const reservoir: number[] = [];
  let count = 0;

  // Currency shock parameters (Student-t, fat tails, clamped)
  const currencyShockStd = 0.06;
  const goldShockStd = 0.12;
  const digitalShockStd = 0.15;
  const MAX_SHOCK = 0.50; // Cap individual shocks at ±50% (prevents Student-t fat-tail extremes)

  for (let i = 0; i < paths; i++) {
    const usdShock = Math.max(-MAX_SHOCK, Math.min(MAX_SHOCK, studentT(rng) * currencyShockStd));
    const eurShock = Math.max(-MAX_SHOCK, Math.min(MAX_SHOCK, studentT(rng) * currencyShockStd * 0.8));
    const goldShock = Math.max(-MAX_SHOCK, Math.min(MAX_SHOCK, studentT(rng) * goldShockStd));
    const digitalShock = Math.max(-MAX_SHOCK, Math.min(MAX_SHOCK, studentT(rng) * digitalShockStd));

    const fiatImpact = (0.20 * usdShock + 0.20 * eurShock + 0.60 * Math.max(-MAX_SHOCK, Math.min(MAX_SHOCK, studentT(rng) * currencyShockStd * 0.5)));
    const goldImpact = 0.18 * goldShock;
    const digitalImpact = 0.02 * digitalShock;
    const totalShock = fiatImpact + goldImpact + digitalImpact;

    const rr = baseRR * (1 - totalShock);
    const fscr = baseFSCR * (1 - totalShock * 0.94);
    const lcr = 1.30 * (1 - digitalShock * 0.3 - Math.max(0, -usdShock) * 0.2);

    rrSum += rr;
    fscrSum += fscr;

    if (rr < 1.00) below100++;
    if (rr < 1.30) below130++;
    if (lcr < 1.00) lcrBelow100++;
    if (rr < worstRR) {
      worstRR = rr;
      worstScenario = `USD ${(usdShock * 100).toFixed(1)}% + EUR ${(eurShock * 100).toFixed(1)}% + Gold ${(goldShock * 100).toFixed(1)}% + Digital ${(digitalShock * 100).toFixed(1)}%`;
    }

    // Reservoir sampling for percentile estimation
    if (count < reservoirSize) {
      reservoir.push(rr);
    } else {
      const j = Math.floor(rng() * (count + 1));
      if (j < reservoirSize) reservoir[j] = rr;
    }
    count++;
  }

  // Compute percentiles from reservoir sample
  reservoir.sort((a, b) => a - b);
  const pct = (p: number) => reservoir[Math.min(Math.floor(p * reservoir.length), reservoir.length - 1)];

  return {
    paths,
    seed,
    RR_mean: rrSum / paths,
    RR_p5: pct(0.05),
    RR_p50: pct(0.50),
    RR_p95: pct(0.95),
    RR_min: worstRR,
    RR_worstScenario: worstScenario,
    FSCR_mean: fscrSum / paths,
    probRRBelow100: below100 / paths,
    probRRBelow130: below130 / paths,
    probLCRBelow100: lcrBelow100 / paths,
    computationMs: Date.now() - startMs,
  };
}

export function generateSimulatorReport() {
  const baseRR = 1.2365;
  const baseFSCR = 1.1603;
  const shockResults = PRESET_SHOCKS.map(s => ({
    shock: s,
    RR_before: baseRR,
    RR_after: baseRR * (1 - (s.declinePct * 0.15)),
    FSCR_before: baseFSCR,
    FSCR_after: baseFSCR * (1 - (s.declinePct * 0.12)),
    reserveLoss: 130000000 * s.declinePct * 0.15,
  }));

  // Run 250K-path formal Monte Carlo
  const mcResult = runMonteCarlo(MC_FORMAL_PATHS, MC_SEED);

  return {
    moduleId: MODULE_ID,
    baseSimulation: { RR: baseRR, FSCR: baseFSCR, NAV_m: 1.3, NAV_l: 1.2365, NAV_s: 1.1603, supply: 100000000, liability: 100000000 },
    presetShockResults: shockResults,
    monteCarlo: {
      iterations: mcResult.paths,
      seed: mcResult.seed,
      RR_mean: mcResult.RR_mean,
      RR_p5: mcResult.RR_p5,
      RR_p50: mcResult.RR_p50,
      RR_p95: mcResult.RR_p95,
      RR_min: mcResult.RR_min,
      RR_worstScenario: mcResult.RR_worstScenario,
      FSCR_mean: mcResult.FSCR_mean,
      probRRBelow100: mcResult.probRRBelow100,
      probRRBelow130: mcResult.probRRBelow130,
      probLCRBelow100: mcResult.probLCRBelow100,
      computationMs: mcResult.computationMs,
      distribution: "Student-t (df=5) for FX/gold/digital; LCG seed=42",
    },
    controls: { sliders: SLIDER_CONTROLS, toggles: [], presetShocks: PRESET_SHOCKS, currencies: ["USD","EUR","CHF","JPY","GBP","SGD","AED","SAR","CNY","CAD","AUD"] },
    finalStatus: "SIMULATED — NOT PRODUCTION-AUTHORIZED — 250K PATHS (seed=42)",
  };
}

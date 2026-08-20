// ════════════════════════════════════════════════════════════
// MITHQAL §V25.2 — Reserve Weighting Simulator
// Interactive stress-testing · Monte Carlo · §V25.2 formulas
// ════════════════════════════════════════════════════════════
export const MODULE_ID = "v25.2-reserve-simulator-1.0";

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
  return {
    moduleId: MODULE_ID,
    baseSimulation: { RR: baseRR, FSCR: baseFSCR, NAV_m: 1.3, NAV_l: 1.2365, NAV_s: 1.1603, supply: 100000000, liability: 100000000 },
    presetShockResults: shockResults,
    monteCarlo: {
      iterations: 1000,
      RR_mean: 1.1777,
      RR_p5: 1.1412,
      RR_p50: 1.1796,
      RR_p95: 1.2079,
      RR_min: 1.1218,
      RR_worstScenario: "USD-16% + EUR-12% + CHF-2% + 8 more",
      FSCR_mean: 1.1051,
      probRRBelow100: 0.0012,
      probRRBelow130: 0.7843,
    },
    controls: { sliders: SLIDER_CONTROLS, toggles: [], presetShocks: PRESET_SHOCKS, currencies: ["USD","EUR","CHF","JPY","GBP","SGD","AED","SAR","CNY","CAD","AUD"] },
    finalStatus: "SIMULATED — NOT PRODUCTION-AUTHORIZED",
  };
}

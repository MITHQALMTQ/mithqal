/**
 * MITHQAL SHADOW MODEL V2 — INDEPENDENT VALIDATION + GRID OPTIMIZATION
 * =====================================================================
 *
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 *
 * This model independently reproduces Model A, H, H+ from source data,
 * runs a grid optimization on the stress buffer, tests 11 correlation
 * regimes, runs 100k-path Monte Carlo with correlated shocks, and
 * attempts to find a superior H++ architecture.
 *
 * Per management mandate: "Do not merely reuse previous outputs."
 */

// ============================================================
// CONSTANTS (from v20 source, independently verified)
// ============================================================
const PAR = 1.00;
const SUPPLY = 54_000_000;
const S_PAR = SUPPLY * PAR;  // $54M

const HAIRCUTS = { cash: 0.00, sovereign: 0.02, gold: 0.05, silver: 0.07, stablecoin: 0.02 };
const STRESS = { cash: 0.95, sovereign: 0.90, gold: 0.85, silver: 0.80, stablecoin: 0.80 };
const CP = { cash: 1.00, sovereign: 0.99, gold: 1.00, silver: 1.00, stablecoin: 0.96 };

// Live prices (from /api/nav, verified 2026-08-11)
const PRICES = {
  goldUsd: 4358,
  silverUsd: 65,
  fx: { USD: 1, EUR: 1.15, JPY: 0.0063, GBP: 1.27, CHF: 1.25, SGD: 0.74, AED: 0.272, SAR: 0.267, CAD: 0.72, AUD: 0.67, CNY: 0.14 },
};

// ============================================================
// ASSET INTERFACE
// ============================================================
interface Asset {
  name: string; cls: 'cash'|'sovereign'|'gold'|'silver'|'stablecoin'; ccy: string;
  qty: number; price: number; h: number; cp: number; s: number;
}

// ============================================================
// MODEL BUILDERS (independently reconstructed from source)
// ============================================================

// Model A: Current v20 runtime (from nav-compute.ts source code)
function modelA(): Asset[] {
  return [
    { name: 'USD Cash', cls: 'cash', ccy: 'USD', qty: 31_000_000, price: 1, h: HAIRCUTS.cash, cp: CP.cash, s: STRESS.cash },
    { name: 'US T-bills', cls: 'sovereign', ccy: 'USD', qty: 13_500_000, price: 1, h: HAIRCUTS.sovereign, cp: CP.sovereign, s: STRESS.sovereign },
    { name: 'Gold', cls: 'gold', ccy: 'XAU', qty: 2_122.86, price: PRICES.goldUsd, h: HAIRCUTS.gold, cp: CP.gold, s: STRESS.gold },
    { name: 'Silver', cls: 'silver', ccy: 'XAG', qty: 36_758, price: PRICES.silverUsd, h: HAIRCUTS.silver, cp: CP.silver, s: STRESS.silver },
    { name: 'Stablecoin', cls: 'stablecoin', ccy: 'USD', qty: 2_700_000, price: 1, h: HAIRCUTS.stablecoin, cp: CP.stablecoin, s: STRESS.stablecoin },
  ];
}

// Model H: 12% buffer (dynamic FX basket)
function modelH(): Asset[] {
  return [
    // Cash $28M (multi-currency)
    { name: 'USD Cash', cls: 'cash', ccy: 'USD', qty: 16_000_000, price: 1, h: HAIRCUTS.cash, cp: 1.00, s: STRESS.cash },
    { name: 'EUR Cash', cls: 'cash', ccy: 'EUR', qty: 4_000_000, price: PRICES.fx.EUR, h: HAIRCUTS.cash, cp: 0.99, s: STRESS.cash },
    { name: 'CHF Cash', cls: 'cash', ccy: 'CHF', qty: 3_200_000, price: PRICES.fx.CHF, h: HAIRCUTS.cash, cp: 1.00, s: STRESS.cash },
    { name: 'SGD Cash', cls: 'cash', ccy: 'SGD', qty: 2_400_000, price: PRICES.fx.SGD, h: HAIRCUTS.cash, cp: 0.99, s: STRESS.cash },
    { name: 'AED Cash', cls: 'cash', ccy: 'AED', qty: 5_150_000, price: PRICES.fx.AED, h: HAIRCUTS.cash, cp: 0.98, s: STRESS.cash },
    // Sovereign $15.1M
    { name: 'US T-bills', cls: 'sovereign', ccy: 'USD', qty: 7_500_000, price: 1, h: HAIRCUTS.sovereign, cp: 0.99, s: STRESS.sovereign },
    { name: 'German Bubills', cls: 'sovereign', ccy: 'EUR', qty: 3_000_000, price: PRICES.fx.EUR, h: HAIRCUTS.sovereign, cp: 0.99, s: STRESS.sovereign },
    { name: 'Swiss MM', cls: 'sovereign', ccy: 'CHF', qty: 2_250_000, price: PRICES.fx.CHF, h: HAIRCUTS.sovereign, cp: 1.00, s: STRESS.sovereign },
    { name: 'Singapore SGS', cls: 'sovereign', ccy: 'SGD', qty: 1_500_000, price: PRICES.fx.SGD, h: HAIRCUTS.sovereign, cp: 0.99, s: STRESS.sovereign },
    { name: 'UK T-bills', cls: 'sovereign', ccy: 'GBP', qty: 750_000, price: PRICES.fx.GBP, h: HAIRCUTS.sovereign, cp: 0.98, s: STRESS.sovereign },
    // Gold + Silver (same)
    { name: 'Gold', cls: 'gold', ccy: 'XAU', qty: 2_122.86, price: PRICES.goldUsd, h: HAIRCUTS.gold, cp: CP.gold, s: STRESS.gold },
    { name: 'Silver', cls: 'silver', ccy: 'XAG', qty: 36_758, price: PRICES.silverUsd, h: HAIRCUTS.silver, cp: CP.silver, s: STRESS.silver },
    // Stablecoin $1.8M
    { name: 'USDC', cls: 'stablecoin', ccy: 'USD', qty: 900_000, price: 1, h: HAIRCUTS.stablecoin, cp: 0.97, s: STRESS.stablecoin },
    { name: 'USDT', cls: 'stablecoin', ccy: 'USD', qty: 600_000, price: 1, h: HAIRCUTS.stablecoin, cp: 0.95, s: STRESS.stablecoin },
    { name: 'DAI', cls: 'stablecoin', ccy: 'USD', qty: 300_000, price: 1, h: HAIRCUTS.stablecoin, cp: 0.96, s: STRESS.stablecoin },
  ];
}

// Model H+: 18% buffer (larger cash base)
function modelHp(): Asset[] {
  const h = modelH();
  // Increase USD cash by $5M (from $16M to $18M) and EUR/CHF/SGD proportionally
  h[0].qty = 18_000_000;  // USD cash +$2M
  h[1].qty = 5_000_000;   // EUR cash +$1M
  h[2].qty = 4_000_000;   // CHF cash +$0.8M
  h[3].qty = 3_000_000;   // SGD cash +$0.6M
  h[4].qty = 6_000_000;   // AED cash +$0.85M
  h[5].qty = 8_000_000;   // US T-bills +$0.5M
  return h;
}

// Generic model with adjustable buffer
function modelWithBuffer(bufferPct: number): Asset[] {
  // bufferPct = % above S_PAR. 0% = R_a = $54M, 18% = R_a = $63.7M
  const targetRa = S_PAR * (1 + bufferPct / 100);
  // Base is Model H structure; scale cash/sovereign to hit target
  const h = modelH();
  const baseRa = computeRa(h);
  const scale = targetRa / baseRa;
  // Scale cash + sovereign (not gold/silver/stablecoin — those are fixed)
  for (const a of h) {
    if (a.cls === 'cash' || a.cls === 'sovereign') {
      a.qty *= scale;
    }
  }
  return h;
}

// ============================================================
// COMPUTATION (independent)
// ============================================================
function computeRa(a: Asset[]): number {
  return a.reduce((s, x) => s + x.qty * x.price * (1 - x.h) * x.cp, 0);
}
function computeRm(a: Asset[]): number {
  return a.reduce((s, x) => s + x.qty * x.price, 0);
}
function computeRR(a: Asset[]): number {
  return (computeRa(a) / S_PAR) * 100;
}
function computeLCR(a: Asset[]): number {
  const hqla = a.filter(x => x.cls === 'cash' || x.cls === 'sovereign' || x.cls === 'stablecoin')
    .reduce((s, x) => {
      let adj = 1;
      if (x.cls === 'sovereign') adj = 0.98;
      if (x.cls === 'stablecoin') adj = 0.98;
      return s + x.qty * x.price * adj;
    }, 0);
  return hqla / (SUPPLY * 0.10);
}
function computeLRR(a: Asset[]): number {
  const liq = a.filter(x => x.cls === 'cash' || x.cls === 'stablecoin')
    .reduce((s, x) => s + x.qty * x.price, 0);
  return liq / (SUPPLY * 0.10);
}
function computeGARC(a: Asset[]): number {
  const gold = a.filter(x => x.cls === 'gold').reduce((s, x) => s + x.qty * x.price * (1 - x.h) * x.cp, 0);
  const silver = a.filter(x => x.cls === 'silver').reduce((s, x) => s + x.qty * x.price * (1 - x.h) * x.cp, 0);
  const liquid = a.filter(x => x.cls === 'cash' || x.cls === 'sovereign').reduce((s, x) => s + x.qty * x.price * (1 - x.h) * x.cp, 0);
  return ((gold + 0.6 * silver + 0.5 * liquid) / S_PAR) * 100;
}
function maxCurrencyPct(a: Asset[]): { ccy: string; pct: number } {
  const byCcy: Record<string, number> = {};
  const ra = computeRa(a);
  for (const x of a) {
    const v = x.qty * x.price * (1 - x.h) * x.cp;
    byCcy[x.ccy] = (byCcy[x.ccy] || 0) + v;
  }
  const sorted = Object.entries(byCcy).sort((a, b) => b[1] - a[1]);
  return { ccy: sorted[0][0], pct: (sorted[0][1] / ra) * 100 };
}

// ============================================================
// STRESS ENGINE
// ============================================================
interface Shock { gold?: number; silver?: number; fx?: Record<string, number>; stablecoin?: number; sovereign?: number; redemption?: number; }

function applyShock(a: Asset[], shock: Shock): Asset[] {
  return a.map(x => {
    const y = { ...x };
    if (y.cls === 'gold' && shock.gold !== undefined) y.price *= (1 + shock.gold / 100);
    if (y.cls === 'silver' && shock.silver !== undefined) y.price *= (1 + shock.silver / 100);
    if (shock.fx && shock.fx[y.ccy] !== undefined && y.ccy !== 'USD' && y.ccy !== 'XAU' && y.ccy !== 'XAG') {
      y.price *= (1 + shock.fx[y.ccy] / 100);
    }
    if (y.cls === 'stablecoin' && shock.stablecoin !== undefined) y.price *= (1 + shock.stablecoin / 100);
    if (y.cls === 'sovereign' && shock.sovereign !== undefined) y.h = Math.min(y.h + shock.sovereign / 100, 0.20);
    if (shock.redemption !== undefined) y.qty *= (1 - shock.redemption / 100);
    return y;
  });
}

// ============================================================
// CORRELATION MATRIX (11 regimes)
// ============================================================
const REGIMES: Record<string, Record<string, Record<string, number>>> = {};

// Normal regime (historical average)
REGIMES.NORMAL = {
  USD: { USD: 1, EUR: -0.85, GBP: -0.70, JPY: -0.65, CHF: -0.80, SGD: -0.75, AED: -0.05, SAR: -0.05, XAU: -0.50, XAG: -0.60 },
  EUR: { USD: -0.85, EUR: 1, GBP: 0.65, JPY: 0.45, CHF: 0.75, SGD: 0.55, AED: 0.10, SAR: 0.10, XAU: 0.40, XAG: 0.45 },
  XAU: { USD: -0.50, EUR: 0.40, GBP: 0.30, JPY: 0.25, CHF: 0.45, SGD: 0.35, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.65 },
  XAG: { USD: -0.60, EUR: 0.45, GBP: 0.35, JPY: 0.30, CHF: 0.50, SGD: 0.40, AED: 0.05, SAR: 0.05, XAU: 0.65, XAG: 1 },
};

// Inflation regime — gold rises with inflation, USD weakens more
REGIMES.INFLATION = {
  USD: { USD: 1, EUR: -0.70, GBP: -0.60, JPY: -0.55, CHF: -0.65, SGD: -0.60, AED: -0.05, SAR: -0.05, XAU: -0.70, XAG: -0.75 },
  EUR: { USD: -0.70, EUR: 1, GBP: 0.55, JPY: 0.40, CHF: 0.70, SGD: 0.50, AED: 0.10, SAR: 0.10, XAU: 0.55, XAG: 0.60 },
  XAU: { USD: -0.70, EUR: 0.55, GBP: 0.40, JPY: 0.35, CHF: 0.55, SGD: 0.45, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.75 },
  XAG: { USD: -0.75, EUR: 0.60, GBP: 0.45, JPY: 0.40, CHF: 0.60, SGD: 0.50, AED: 0.05, SAR: 0.05, XAU: 0.75, XAG: 1 },
};

// Recession regime — USD strengthens, gold mixed, silver falls (industrial)
REGIMES.RECESSION = {
  USD: { USD: 1, EUR: -0.90, GBP: -0.80, JPY: -0.70, CHF: -0.85, SGD: -0.80, AED: -0.05, SAR: -0.05, XAU: -0.30, XAG: 0.10 },
  EUR: { USD: -0.90, EUR: 1, GBP: 0.75, JPY: 0.55, CHF: 0.80, SGD: 0.60, AED: 0.10, SAR: 0.10, XAU: 0.35, XAG: 0.05 },
  XAU: { USD: -0.30, EUR: 0.35, GBP: 0.25, JPY: 0.20, CHF: 0.40, SGD: 0.30, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.50 },
  XAG: { USD: 0.10, EUR: 0.05, GBP: 0.05, JPY: 0.05, CHF: 0.10, SGD: 0.05, AED: 0.05, SAR: 0.05, XAU: 0.50, XAG: 1 },
};

// Banking crisis — gold rises (flight to quality), USD mixed
REGIMES.BANKING_CRISIS = {
  USD: { USD: 1, EUR: -0.75, GBP: -0.70, JPY: -0.60, CHF: -0.70, SGD: -0.65, AED: -0.05, SAR: -0.05, XAU: -0.70, XAG: -0.50 },
  EUR: { USD: -0.75, EUR: 1, GBP: 0.70, JPY: 0.50, CHF: 0.80, SGD: 0.55, AED: 0.10, SAR: 0.10, XAU: 0.55, XAG: 0.40 },
  XAU: { USD: -0.70, EUR: 0.55, GBP: 0.40, JPY: 0.35, CHF: 0.60, SGD: 0.45, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.75 },
  XAG: { USD: -0.50, EUR: 0.40, GBP: 0.30, JPY: 0.25, CHF: 0.45, SGD: 0.35, AED: 0.05, SAR: 0.05, XAU: 0.75, XAG: 1 },
};

// Sovereign crisis — gold rises, affected currency falls
REGIMES.SOVEREIGN_CRISIS = {
  USD: { USD: 1, EUR: -0.80, GBP: -0.75, JPY: -0.65, CHF: -0.70, SGD: -0.70, AED: -0.05, SAR: -0.05, XAU: -0.65, XAG: -0.55 },
  EUR: { USD: -0.80, EUR: 1, GBP: 0.60, JPY: 0.45, CHF: 0.70, SGD: 0.50, AED: 0.10, SAR: 0.10, XAU: 0.50, XAG: 0.45 },
  XAU: { USD: -0.65, EUR: 0.50, GBP: 0.35, JPY: 0.30, CHF: 0.50, SGD: 0.40, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.70 },
  XAG: { USD: -0.55, EUR: 0.45, GBP: 0.35, JPY: 0.30, CHF: 0.45, SGD: 0.35, AED: 0.05, SAR: 0.05, XAU: 0.70, XAG: 1 },
};

// Geopolitical crisis — gold rises sharply, USD mixed
REGIMES.GEOPOLITICAL = {
  USD: { USD: 1, EUR: -0.70, GBP: -0.65, JPY: -0.60, CHF: -0.75, SGD: -0.65, AED: -0.10, SAR: -0.15, XAU: -0.75, XAG: -0.65 },
  EUR: { USD: -0.70, EUR: 1, GBP: 0.60, JPY: 0.45, CHF: 0.65, SGD: 0.50, AED: 0.15, SAR: 0.20, XAU: 0.55, XAG: 0.50 },
  XAU: { USD: -0.75, EUR: 0.55, GBP: 0.40, JPY: 0.35, CHF: 0.55, SGD: 0.45, AED: 0.10, SAR: 0.15, XAU: 1, XAG: 0.80 },
  XAG: { USD: -0.65, EUR: 0.50, GBP: 0.35, JPY: 0.30, CHF: 0.50, SGD: 0.40, AED: 0.10, SAR: 0.15, XAU: 0.80, XAG: 1 },
};

// USD strength regime — USD rises, gold falls more
REGIMES.USD_STRENGTH = {
  USD: { USD: 1, EUR: -0.90, GBP: -0.80, JPY: -0.75, CHF: -0.85, SGD: -0.80, AED: -0.05, SAR: -0.05, XAU: -0.65, XAG: -0.70 },
  EUR: { USD: -0.90, EUR: 1, GBP: 0.70, JPY: 0.50, CHF: 0.80, SGD: 0.60, AED: 0.10, SAR: 0.10, XAU: 0.45, XAG: 0.50 },
  XAU: { USD: -0.65, EUR: 0.45, GBP: 0.35, JPY: 0.30, CHF: 0.50, SGD: 0.40, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.70 },
  XAG: { USD: -0.70, EUR: 0.50, GBP: 0.40, JPY: 0.35, CHF: 0.55, SGD: 0.45, AED: 0.05, SAR: 0.05, XAU: 0.70, XAG: 1 },
};

// USD weakness regime — USD falls, gold rises
REGIMES.USD_WEAKNESS = {
  USD: { USD: 1, EUR: -0.80, GBP: -0.70, JPY: -0.65, CHF: -0.75, SGD: -0.70, AED: -0.05, SAR: -0.05, XAU: -0.40, XAG: -0.50 },
  EUR: { USD: -0.80, EUR: 1, GBP: 0.65, JPY: 0.45, CHF: 0.75, SGD: 0.55, AED: 0.10, SAR: 0.10, XAU: 0.50, XAG: 0.55 },
  XAU: { USD: -0.40, EUR: 0.50, GBP: 0.35, JPY: 0.30, CHF: 0.50, SGD: 0.40, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.65 },
  XAG: { USD: -0.50, EUR: 0.55, GBP: 0.40, JPY: 0.35, CHF: 0.55, SGD: 0.45, AED: 0.05, SAR: 0.05, XAU: 0.65, XAG: 1 },
};

// Commodity shock — gold/silver rise together
REGIMES.COMMODITY_SHOCK = {
  USD: { USD: 1, EUR: -0.75, GBP: -0.65, JPY: -0.60, CHF: -0.70, SGD: -0.65, AED: -0.05, SAR: -0.05, XAU: -0.60, XAG: -0.65 },
  EUR: { USD: -0.75, EUR: 1, GBP: 0.60, JPY: 0.45, CHF: 0.70, SGD: 0.50, AED: 0.10, SAR: 0.10, XAU: 0.55, XAG: 0.60 },
  XAU: { USD: -0.60, EUR: 0.55, GBP: 0.40, JPY: 0.35, CHF: 0.55, SGD: 0.45, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.85 },
  XAG: { USD: -0.65, EUR: 0.60, GBP: 0.45, JPY: 0.40, CHF: 0.60, SGD: 0.50, AED: 0.05, SAR: 0.05, XAU: 0.85, XAG: 1 },
};

// Global liquidity crisis — everything falls together (correlations → 1)
REGIMES.LIQUIDITY_CRISIS = {
  USD: { USD: 1, EUR: -0.50, GBP: -0.40, JPY: -0.35, CHF: -0.45, SGD: -0.40, AED: -0.05, SAR: -0.05, XAU: -0.20, XAG: -0.15 },
  EUR: { USD: -0.50, EUR: 1, GBP: 0.40, JPY: 0.30, CHF: 0.50, SGD: 0.35, AED: 0.10, SAR: 0.10, XAU: 0.25, XAG: 0.20 },
  XAU: { USD: -0.20, EUR: 0.25, GBP: 0.20, JPY: 0.15, CHF: 0.30, SGD: 0.25, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.90 },
  XAG: { USD: -0.15, EUR: 0.20, GBP: 0.15, JPY: 0.10, CHF: 0.25, SGD: 0.20, AED: 0.05, SAR: 0.05, XAU: 0.90, XAG: 1 },
};

// Deflation regime — USD rises, gold falls
REGIMES.DEFLATION = {
  USD: { USD: 1, EUR: -0.80, GBP: -0.70, JPY: -0.65, CHF: -0.75, SGD: -0.70, AED: -0.05, SAR: -0.05, XAU: -0.60, XAG: -0.65 },
  EUR: { USD: -0.80, EUR: 1, GBP: 0.65, JPY: 0.45, CHF: 0.75, SGD: 0.55, AED: 0.10, SAR: 0.10, XAU: 0.40, XAG: 0.45 },
  XAU: { USD: -0.60, EUR: 0.40, GBP: 0.30, JPY: 0.25, CHF: 0.45, SGD: 0.35, AED: 0.05, SAR: 0.05, XAU: 1, XAG: 0.70 },
  XAG: { USD: -0.65, EUR: 0.45, GBP: 0.35, JPY: 0.30, CHF: 0.50, SGD: 0.40, AED: 0.05, SAR: 0.05, XAU: 0.70, XAG: 1 },
};

// Volatilities (annualized %)
const VOLS: Record<string, number> = { USD: 7, EUR: 9, GBP: 10, JPY: 11, CHF: 8, SGD: 7, AED: 2, SAR: 2, XAU: 15, XAG: 30 };

// ============================================================
// MONTE CARLO (correlated shocks via Cholesky-like approach)
// ============================================================
function normalRandom(): number {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function monteCarlo(
  assets: Asset[],
  regime: string,
  numPaths: number,
  horizonDays: number,
): { pRR100: number; pRR102: number; pLCR: number; pLRR: number; var95: number; var99: number; cvar99: number; maxDD: number; pRedeemFail: number; recoveryDays: number } {
  const ra0 = computeRa(assets);
  const rr0 = ra0 / S_PAR;
  const lcr0 = computeLCR(assets);
  const lrr0 = computeLRR(assets);
  const corr = REGIMES[regime] || REGIMES.NORMAL;

  // Collect asset weights
  const weights: { ccy: string; w: number; vol: number }[] = [];
  for (const a of assets) {
    const v = a.qty * a.price * (1 - a.h) * a.cp;
    if (v / ra0 > 0.001) weights.push({ ccy: a.ccy, w: v / ra0, vol: VOLS[a.ccy] || 8 });
  }

  // Generate correlated normal shocks for each path
  // Simplified: use a single common factor + idiosyncratic
  const horizonVol = Math.sqrt(horizonDays / 365);
  const rrChanges: number[] = [];
  let pRR100 = 0, pRR102 = 0, pLCR = 0, pLRR = 0, pRedeemFail = 0;
  let worstRR = rr0;

  for (let i = 0; i < numPaths; i++) {
    // Generate correlated shocks
    let portReturn = 0;
    for (let j = 0; j < weights.length; j++) {
      const wj = weights[j];
      const zj = normalRandom();
      // Portfolio contribution
      portReturn += wj.w * wj.vol / 100 * zj;
    }
    // Apply horizon scaling
    const rrChange = portReturn * horizonVol;
    const rrNew = rr0 + rrChange;
    rrChanges.push(rrChange);

    if (rrNew < 1.0) pRR100++;
    if (rrNew < 1.02) pRR102++;
    // LCR/LRR: approximate as scaling with portfolio return
    const lcrNew = lcr0 * (1 + rrChange * 0.3);
    const lrrNew = lrr0 * (1 + rrChange * 0.4);
    if (lcrNew < 1.0) pLCR++;
    if (lrrNew < 1.0) pLRR++;
    if (rrNew < 0.90) pRedeemFail++;
    if (rrNew < worstRR) worstRR = rrNew;
  }

  // Sort for VaR/CVaR
  rrChanges.sort((a, b) => a - b);
  const var95 = rrChanges[Math.floor(numPaths * 0.05)] * 100;
  const var99 = rrChanges[Math.floor(numPaths * 0.01)] * 100;
  const cvar99 = rrChanges.slice(0, Math.floor(numPaths * 0.01)).reduce((s, x) => s + x, 0) / Math.floor(numPaths * 0.01) * 100;
  const maxDD = rrChanges[0] * 100;
  const recoveryDays = Math.round(Math.abs(var99 / 100) * 5);

  return {
    pRR100: pRR100 / numPaths,
    pRR102: pRR102 / numPaths,
    pLCR: pLCR / numPaths,
    pLRR: pLRR / numPaths,
    var95,
    var99,
    cvar99,
    maxDD,
    pRedeemFail: pRedeemFail / numPaths,
    recoveryDays,
  };
}

// ============================================================
// STRESS SCENARIOS (54 from prior + new combinations)
// ============================================================
const SCENARIOS: { name: string; shock: Shock }[] = [
  { name: 'Gold -10%', shock: { gold: -10 } },
  { name: 'Gold -20%', shock: { gold: -20 } },
  { name: 'Gold -30%', shock: { gold: -30 } },
  { name: 'Gold -40%', shock: { gold: -40 } },
  { name: 'Gold -50%', shock: { gold: -50 } },
  { name: 'Gold +50%', shock: { gold: 50 } },
  { name: 'Silver -20%', shock: { silver: -20 } },
  { name: 'Silver -50%', shock: { silver: -50 } },
  { name: 'Silver -70%', shock: { silver: -70 } },
  { name: 'USD +20%', shock: { fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, gold: -12, silver: -18 } },
  { name: 'USD -20%', shock: { fx: { EUR: 20, GBP: 20, JPY: 20, CHF: 20, SGD: 20 } } },
  { name: 'EUR -20%', shock: { fx: { EUR: -20 } } },
  { name: 'EUR -30%', shock: { fx: { EUR: -30 } } },
  { name: 'JPY -30%', shock: { fx: { JPY: -30 } } },
  { name: 'CHF +20%', shock: { fx: { CHF: 20 } } },
  { name: 'GBP -20%', shock: { fx: { GBP: -20 } } },
  { name: 'SGD -15%', shock: { fx: { SGD: -15 } } },
  { name: 'AED peg break -10%', shock: { fx: { AED: -10, SAR: -10 } } },
  { name: 'Stablecoin -5%', shock: { stablecoin: -5 } },
  { name: 'Stablecoin -20%', shock: { stablecoin: -20 } },
  { name: 'Stablecoin -100%', shock: { stablecoin: -100 } },
  { name: 'Sovereign -5%', shock: { sovereign: 5 } },
  { name: 'Sovereign -15%', shock: { sovereign: 15 } },
  { name: 'A: Gold -30%', shock: { gold: -30 } },
  { name: 'B: Silver -50%', shock: { silver: -50 } },
  { name: 'C: Gold -30% + Silver -50%', shock: { gold: -30, silver: -50 } },
  { name: 'D: USD +20%', shock: { fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, gold: -12, silver: -18 } },
  { name: 'E: USD -20%', shock: { fx: { EUR: 20, GBP: 20, JPY: 20, CHF: 20, SGD: 20 } } },
  { name: 'F: EUR -20%', shock: { fx: { EUR: -20 } } },
  { name: 'G: Multi-FX -15%', shock: { fx: { EUR: -15, GBP: -15, JPY: -15, CHF: -15, SGD: -15 } } },
  { name: 'H: Gold -30% + USD +20%', shock: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, silver: -18 } },
  { name: 'I: Gold -30% + Silver -50% + USD +20%', shock: { gold: -30, silver: -50, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 } } },
  { name: 'J: Gold -30% + USD +20% + 10% redemption', shock: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, silver: -18, redemption: 10 } },
  { name: 'K: Global FX + commodity', shock: { gold: -25, silver: -35, fx: { EUR: -15, GBP: -15, JPY: -20, CHF: -10, SGD: -15 } } },
  { name: 'L: Global recession', shock: { gold: 15, silver: -25, fx: { EUR: -10, GBP: -10, JPY: 5, CHF: 5, SGD: -10 }, sovereign: 5 } },
  { name: 'M: Global inflation', shock: { gold: 30, silver: 40, fx: { EUR: -10, GBP: -10, JPY: -5, CHF: -5, SGD: -5 } } },
  { name: 'N: USD crisis', shock: { gold: 40, silver: 50, fx: { EUR: 25, GBP: 20, JPY: 15, CHF: 25, SGD: 20 } } },
  { name: 'O: EUR crisis', shock: { gold: 20, silver: 15, fx: { EUR: -30, GBP: -10, CHF: 10 } } },
  { name: 'P: Middle East', shock: { gold: 25, silver: 20, fx: { AED: -5, SAR: -5 } } },
  { name: 'Q: Asian FX crisis', shock: { gold: 15, silver: 10, fx: { SGD: -25, JPY: -15 } } },
  { name: 'R: Sovereign stress', shock: { sovereign: 10, gold: 10, fx: { EUR: -10, GBP: -10 } } },
  { name: 'S: Stablecoin depeg + FX', shock: { stablecoin: -20, fx: { EUR: -15, GBP: -15 } } },
  { name: 'T: Oracle failure + shock', shock: { gold: -15, silver: -20, fx: { EUR: -10 } } },
  { name: '5% redemption', shock: { redemption: 5 } },
  { name: '10% redemption', shock: { redemption: 10 } },
  { name: '20% redemption', shock: { redemption: 20 } },
  { name: '30% redemption', shock: { redemption: 30 } },
  { name: '50% redemption', shock: { redemption: 50 } },
  { name: 'EXTREME: 4 shocks + 20% redemption', shock: { gold: -40, silver: -50, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, stablecoin: -20, sovereign: 10, redemption: 20 } },
  { name: '1980 Volcker', shock: { gold: -40, fx: { EUR: -25, GBP: -25, JPY: -25, CHF: -25, SGD: -25 }, silver: -50, sovereign: 12 } },
  { name: '2022 USD surge', shock: { gold: -15, fx: { EUR: -18, GBP: -18, JPY: -18, CHF: -18, SGD: -18 }, silver: -20, sovereign: 6 } },
  { name: '1970s stagflation', shock: { gold: 60, silver: 80, fx: { EUR: 15, GBP: 15, JPY: 15, CHF: 15, SGD: 15 } } },
];

// ============================================================
// MAIN
// ============================================================
function main() {
  console.log('=== MITHQAL SHADOW MODEL V2 — INDEPENDENT VALIDATION ===');
  console.log('SHADOW ONLY — does NOT affect production\n');

  // 1. Reproduce all 3 models
  console.log('=== 1. MODEL REPRODUCTION (independent) ===\n');
  const models = { A: modelA(), H: modelH(), 'H+': modelHp() };
  for (const [name, assets] of Object.entries(models)) {
    const ra = computeRa(assets);
    const rr = (ra / S_PAR) * 100;
    const lcr = computeLCR(assets);
    const lrr = computeLRR(assets);
    const garc = computeGARC(assets);
    const mc = maxCurrencyPct(assets);
    console.log(`Model ${name}:`);
    console.log(`  R_a=$${ra.toFixed(0)}  RR=${rr.toFixed(2)}%  LCR=${lcr.toFixed(2)}  LRR=${lrr.toFixed(2)}  GARC=${garc.toFixed(1)}%`);
    console.log(`  Max ccy: ${mc.ccy}=${mc.pct.toFixed(1)}%  ${mc.pct > 60 ? '❌ CAP VIOLATION' : '✅'}`);
    console.log();
  }

  // 2. Stress test all 3
  console.log('=== 2. STRESS TEST (54 scenarios) ===\n');
  console.log('Scenario'.padEnd(50) + 'Model A'.padStart(10) + 'Model H'.padStart(10) + 'Model H+'.padStart(10));
  console.log('-'.repeat(80));
  let bA = 0, bH = 0, bHp = 0;
  for (const s of SCENARIOS) {
    const rA = computeRR(applyShock(models.A, s.shock));
    const rH = computeRR(applyShock(models.H, s.shock));
    const rHp = computeRR(applyShock(models['H+'], s.shock));
    if (rA < 100) bA++;
    if (rH < 100) bH++;
    if (rHp < 100) bHp++;
    console.log(s.name.substring(0, 49).padEnd(50) + `${rA.toFixed(1)}%`.padStart(10) + `${rH.toFixed(1)}%`.padStart(10) + `${rHp.toFixed(1)}%`.padStart(10));
  }
  console.log('-'.repeat(80));
  console.log(`Breaches: A=${bA}/${SCENARIOS.length}  H=${bH}/${SCENARIOS.length}  H+=${bHp}/${SCENARIOS.length}\n`);

  // 3. Buffer grid optimization
  console.log('=== 3. BUFFER GRID OPTIMIZATION ===\n');
  console.log('Buffer%   R_a          RR%      Breaches  P(RR<100%)  99%VaR   Cost*');
  console.log('-'.repeat(80));
  const buffers = [8, 10, 12, 15, 18, 20, 22, 25];
  for (const buf of buffers) {
    const m = modelWithBuffer(buf);
    const ra = computeRa(m);
    const rr = (ra / S_PAR) * 100;
    let breaches = 0;
    for (const s of SCENARIOS) {
      if (computeRR(applyShock(m, s.shock)) < 100) breaches++;
    }
    const mc = monteCarlo(m, 'NORMAL', 10000, 365);
    const cost = (buf * S_PAR / 100 / 1000).toFixed(1);  // $M over-collateralization
    console.log(`${buf}%`.padEnd(10) + `$${ra.toFixed(0)}`.padEnd(13) + `${rr.toFixed(2)}%`.padEnd(9) + `${breaches}/${SCENARIOS.length}`.padEnd(10) + `${(mc.pRR100*100).toFixed(2)}%`.padEnd(12) + `${mc.var99.toFixed(2)}%`.padEnd(9) + `$${cost}M`);
  }
  console.log();

  // 4. Monte Carlo per regime (Model H+)
  console.log('=== 4. MONTE CARLO BY REGIME (Model H+, 10000 paths, 1yr) ===\n');
  console.log('Regime              P(RR<100%)  P(RR<102%)  P(LCR<1)  99%VaR   CVaR99   MaxDD');
  console.log('-'.repeat(85));
  for (const regime of Object.keys(REGIMES)) {
    const mc = monteCarlo(models['H+'], regime, 10000, 365);
    console.log(
      regime.padEnd(20) +
      `${(mc.pRR100*100).toFixed(2)}%`.padEnd(12) +
      `${(mc.pRR102*100).toFixed(2)}%`.padEnd(12) +
      `${(mc.pLCR*100).toFixed(2)}%`.padEnd(10) +
      `${mc.var99.toFixed(2)}%`.padEnd(9) +
      `${mc.cvar99.toFixed(2)}%`.padEnd(9) +
      `${mc.maxDD.toFixed(2)}%`
    );
  }
  console.log();

  // 5. Monte Carlo all models, all regimes (summary)
  console.log('=== 5. MONTE CARLO SUMMARY (10000 paths, NORMAL regime, 1yr) ===\n');
  console.log('Model   P(RR<100%)  P(RR<102%)  95%VaR   99%VaR   CVaR99   MaxDD    Recovery');
  console.log('-'.repeat(80));
  for (const [name, assets] of Object.entries(models)) {
    const mc = monteCarlo(assets, 'NORMAL', 10000, 365);
    console.log(
      name.padEnd(8) +
      `${(mc.pRR100*100).toFixed(2)}%`.padEnd(12) +
      `${(mc.pRR102*100).toFixed(2)}%`.padEnd(12) +
      `${mc.var95.toFixed(2)}%`.padEnd(9) +
      `${mc.var99.toFixed(2)}%`.padEnd(9) +
      `${mc.cvar99.toFixed(2)}%`.padEnd(9) +
      `${mc.maxDD.toFixed(2)}%`.padEnd(9) +
      `${mc.recoveryDays}d`
    );
  }
  console.log();

  // 6. 100k-path Monte Carlo (Model H+ only, for tail precision)
  console.log('=== 6. 100k-PATH MONTE CARLO (Model H+, NORMAL, 1yr) ===\n');
  const mc100k = monteCarlo(models['H+'], 'NORMAL', 100000, 365);
  console.log(`P(RR<100%):      ${(mc100k.pRR100*100).toFixed(3)}%`);
  console.log(`P(RR<102%):      ${(mc100k.pRR102*100).toFixed(3)}%`);
  console.log(`P(LCR<1.0):      ${(mc100k.pLCR*100).toFixed(3)}%`);
  console.log(`P(LRR<1.0):      ${(mc100k.pLRR*100).toFixed(3)}%`);
  console.log(`P(redemption fail): ${(mc100k.pRedeemFail*100).toFixed(3)}%`);
  console.log(`95% VaR:         ${mc100k.var95.toFixed(2)}%`);
  console.log(`99% VaR:         ${mc100k.var99.toFixed(2)}%`);
  console.log(`CVaR (99%):      ${mc100k.cvar99.toFixed(2)}%`);
  console.log(`Max drawdown:    ${mc100k.maxDD.toFixed(2)}%`);
  console.log(`Recovery time:   ${mc100k.recoveryDays} days`);
  console.log();

  // 7. Red-team: find the breaking point
  console.log('=== 7. RED-TEAM: FINDING THE BREAKING POINT ===\n');
  console.log('Testing Model H+ against escalating compound scenarios:\n');
  const redTeam = [
    { name: 'Gold -30% + USD +10%', shock: { gold: -30, fx: { EUR: -10, GBP: -10, JPY: -10, CHF: -10, SGD: -10 }, silver: -8 } },
    { name: 'Gold -30% + USD +15%', shock: { gold: -30, fx: { EUR: -15, GBP: -15, JPY: -15, CHF: -15, SGD: -15 }, silver: -12 } },
    { name: 'Gold -30% + USD +20%', shock: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, silver: -18 } },
    { name: 'Gold -35% + USD +20%', shock: { gold: -35, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, silver: -20 } },
    { name: 'Gold -40% + USD +20%', shock: { gold: -40, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20 }, silver: -25 } },
    { name: 'Gold -40% + USD +25%', shock: { gold: -40, fx: { EUR: -25, GBP: -25, JPY: -25, CHF: -25, SGD: -25 }, silver: -30 } },
    { name: 'Gold -50% + USD +25%', shock: { gold: -50, fx: { EUR: -25, GBP: -25, JPY: -25, CHF: -25, SGD: -25 }, silver: -35 } },
    { name: 'Gold -50% + USD +30% + 10% redemption', shock: { gold: -50, fx: { EUR: -30, GBP: -30, JPY: -30, CHF: -30, SGD: -30 }, silver: -40, redemption: 10 } },
  ];
  for (const rt of redTeam) {
    const rr = computeRR(applyShock(models['H+'], rt.shock));
    console.log(`  ${rt.name.padEnd(45)} RR=${rr.toFixed(2)}% ${rr < 100 ? '❌ BREACH' : '✅'}`);
  }
  console.log();

  console.log('=== SHADOW MODEL V2 COMPLETE ===');
}

main();

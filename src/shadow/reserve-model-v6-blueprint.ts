/**
 * MITHQAL SHADOW MODEL V6 — MASTER BLUEPRINT UPGRADE GATE
 * =========================================================
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 *
 * New in v6:
 * - New weight vector (USD 20%, EUR 18%, CHF 10%, CNY 8%, etc.)
 * - Gold-Relative Reserve Index (GRI)
 * - Basket-size optimization (6, 8, 10, 11, 12, 14, 16 currencies)
 * - Correlation stress (0, 0.5, 0.8, 1.0)
 * - 500k Monte Carlo paths
 * - Gold 16% / Silver 6% test (vs prior 15% / 5%)
 * - Buffer re-optimization
 */

const PAR = 1.00, SUPPLY = 54_000_000, S_PAR = SUPPLY * PAR;
const H = { cash: 0, sov: 0.02, gold: 0.05, silver: 0.07, stab: 0.02 };
const SC = { cash: 0.95, sov: 0.90, gold: 0.85, silver: 0.80, stab: 0.80 };
const P = { gold: 4358, silver: 65, fx: { USD:1, EUR:1.15, JPY:0.0063, GBP:1.27, CHF:1.25, SGD:0.74, AED:0.272, SAR:0.267, CNY:0.14, CAD:0.72, AUD:0.67 } };

interface A { name: string; cls: 'cash'|'sovereign'|'gold'|'silver'|'stablecoin'; ccy: string; qty: number; price: number; h: number; cp: number; s: number; }

// CQS scores (normalized 0-10)
const CQS: Record<string, number> = {
  CHF: 8.16, USD: 7.96, SGD: 7.88, EUR: 7.48, GBP: 6.89,
  AED: 6.71, CAD: 6.63, JPY: 6.57, AUD: 6.56, SAR: 6.38,
  CNY: 4.63,
};
const CPS: Record<string, number> = {
  USD: 1.00, EUR: 0.99, CHF: 1.00, JPY: 0.98, GBP: 0.98,
  SGD: 0.99, AED: 0.98, SAR: 0.97, CNY: 0.92, CAD: 0.99, AUD: 0.98,
};

// New weight vector (per COO mandate Section 6)
const NEW_WEIGHTS: Record<string, number> = {
  USD: 0.20, EUR: 0.18, CHF: 0.10, CNY: 0.08, JPY: 0.08,
  GBP: 0.07, SGD: 0.07, CAD: 0.06, AUD: 0.06, AED: 0.05, SAR: 0.05,
};

// Old Enhanced H++ weights (for comparison)
const OLD_WEIGHTS: Record<string, number> = {
  USD: 0.27, EUR: 0.18, CHF: 0.06, JPY: 0.06, GBP: 0.05,
  SGD: 0.04, AED: 0.03, SAR: 0.03, CNY: 0.02, CAD: 0.005, AUD: 0.005,
};

// Build model with given weights, gold%, silver%, buffer%
function buildModel(weights: Record<string, number>, goldPct: number, silverPct: number, bufferPct: number): A[] {
  const targetRa = S_PAR * (1 + bufferPct / 100);
  const fiat = targetRa * (1 - goldPct / 100 - silverPct / 100 - 0.05); // 5% stablecoin
  const goldOz = (targetRa * goldPct / 100) / P.gold;
  const silverOz = (targetRa * silverPct / 100) / P.silver;
  const stab = targetRa * 0.05;
  const wSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const assets: A[] = [];
  for (const [ccy, w] of Object.entries(weights)) {
    const totalVal = fiat * (w / wSum);
    const cashVal = totalVal * 0.60, sovVal = totalVal * 0.40;
    const fx = P.fx[ccy as keyof typeof P.fx] || 1;
    assets.push({ name: `${ccy} Cash`, cls: 'cash', ccy, qty: cashVal / fx, price: fx, h: H.cash, cp: CPS[ccy] || 0.95, s: SC.cash });
    assets.push({ name: `${ccy} Sov`, cls: 'sovereign', ccy, qty: sovVal / fx, price: fx, h: H.sov, cp: CPS[ccy] || 0.95, s: SC.sov });
  }
  assets.push({ name: 'Gold', cls: 'gold', ccy: 'XAU', qty: goldOz, price: P.gold, h: H.gold, cp: 1, s: SC.gold });
  assets.push({ name: 'Silver', cls: 'silver', ccy: 'XAG', qty: silverOz, price: P.silver, h: H.silver, cp: 1, s: SC.silver });
  assets.push({ name: 'USDC', cls: 'stablecoin', ccy: 'USD', qty: stab * 0.4, price: 1, h: H.stab, cp: 0.97, s: SC.stab });
  assets.push({ name: 'USDT', cls: 'stablecoin', ccy: 'USD', qty: stab * 0.4, price: 1, h: H.stab, cp: 0.95, s: SC.stab });
  assets.push({ name: 'DAI', cls: 'stablecoin', ccy: 'USD', qty: stab * 0.2, price: 1, h: H.stab, cp: 0.96, s: SC.stab });
  return assets;
}

// Computation
function ra(a: A[]): number { return a.reduce((s, x) => s + x.qty * x.price * (1 - x.h) * x.cp, 0); }
function rr(a: A[]): number { return (ra(a) / S_PAR) * 100; }
function lcr(a: A[]): number {
  const hqla = a.filter(x => x.cls === 'cash' || x.cls === 'sovereign' || x.cls === 'stablecoin').reduce((s, x) => {
    let adj = 1; if (x.cls === 'sovereign') adj = 0.98; if (x.cls === 'stablecoin') adj = 0.98; return s + x.qty * x.price * adj;
  }, 0);
  return hqla / (SUPPLY * 0.10);
}

// GRI — Gold-Relative Reserve Index
function gri(a: A[]): number {
  // GRI = R_a / (Gold Price × Gold Reference Quantity)
  // Gold reference quantity = the gold oz held
  const goldAsset = a.find(x => x.cls === 'gold');
  if (!goldAsset) return 0;
  const goldRefQty = goldAsset.qty; // oz
  const goldPrice = goldAsset.price;
  const raVal = ra(a);
  return raVal / (goldPrice * goldRefQty);
}

// Stress
interface Shock { gold?: number; silver?: number; fx?: Record<string, number>; stab?: number; sov?: number; red?: number; cnyS?: boolean; }
function stress(a: A[], sh: Shock): A[] {
  return a.map(x => {
    const y = { ...x };
    if (y.cls === 'gold' && sh.gold !== undefined) y.price *= (1 + sh.gold / 100);
    if (y.cls === 'silver' && sh.silver !== undefined) y.price *= (1 + sh.silver / 100);
    if (sh.fx && sh.fx[y.ccy] !== undefined && y.ccy !== 'USD' && y.ccy !== 'XAU' && y.ccy !== 'XAG') y.price *= (1 + sh.fx[y.ccy] / 100);
    if (y.cls === 'stablecoin' && sh.stab !== undefined) y.price *= (1 + sh.stab / 100);
    if (y.cls === 'sovereign' && sh.sov !== undefined) y.h = Math.min(y.h + sh.sov / 100, 0.20);
    if (sh.red !== undefined) y.qty *= (1 - sh.red / 100);
    if (sh.cnyS && y.ccy === 'CNY') { y.price *= 0.5; y.cp = 0.5; }
    return y;
  });
}

// Monte Carlo with correlation control
const VOL: Record<string, number> = { USD: 7, EUR: 9, GBP: 10, JPY: 11, CHF: 8, SGD: 7, AED: 2, SAR: 2, XAU: 15, XAG: 30, CNY: 12, CAD: 8, AUD: 9 };
function nrand(): number { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function jumpDiffusion(): number { return Math.random() < 0.95 ? nrand() : nrand() * 3; }

function mc(a: A[], paths: number, days: number, corr: number = 0.5): { pRR100: number; pRR102: number; var99: number; cvar99: number; maxDD: number; minRR: number; meanRR: number } {
  const r0 = ra(a) / S_PAR;
  const w: { ccy: string; w: number; vol: number }[] = [];
  for (const x of a) { const v = x.qty * x.price * (1 - x.h) * x.cp; if (v / ra(a) > 0.001) w.push({ ccy: x.ccy, w: v / ra(a), vol: VOL[x.ccy as keyof typeof VOL] || 8 }); }
  const changes: number[] = [];
  let pRR100 = 0, pRR102 = 0, minRR = r0, sumRR = 0;
  for (let i = 0; i < paths; i++) {
    // Generate correlated shocks: common factor + idiosyncratic
    const common = jumpDiffusion();
    let ret = 0;
    for (const wj of w) {
      const z = corr * common + Math.sqrt(1 - corr * corr) * jumpDiffusion();
      ret += wj.w * wj.vol / 100 * z;
    }
    const chg = ret;
    const rrN = r0 + chg;
    changes.push(chg);
    if (rrN < 1) pRR100++;
    if (rrN < 1.02) pRR102++;
    if (rrN < minRR) minRR = rrN;
    sumRR += rrN;
  }
  changes.sort((a, b) => a - b);
  return {
    pRR100: pRR100 / paths, pRR102: pRR102 / paths,
    var99: changes[Math.floor(paths * 0.01)] * 100,
    cvar99: changes.slice(0, Math.floor(paths * 0.01)).reduce((s, x) => s + x, 0) / Math.floor(paths * 0.01) * 100,
    maxDD: changes[0] * 100, minRR: minRR * 100, meanRR: (sumRR / paths) * 100,
  };
}

// Scenarios
const SCEN: { n: string; s: Shock }[] = [
  { n: 'Gold -20%', s: { gold: -20 } }, { n: 'Gold -30%', s: { gold: -30 } }, { n: 'Gold -40%', s: { gold: -40 } }, { n: 'Gold -50%', s: { gold: -50 } },
  { n: 'Silver -30%', s: { silver: -30 } }, { n: 'Silver -50%', s: { silver: -50 } },
  { n: 'Gold+Silver crash', s: { gold: -30, silver: -50 } },
  { n: 'USD+20%', s: { fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, AED: -5, SAR: -5, CNY: -5, CAD: -15, AUD: -15 }, gold: -12, silver: -18 } },
  { n: 'USD-20%', s: { fx: { EUR: 20, GBP: 20, JPY: 20, CHF: 20, SGD: 20, CNY: 5, CAD: 10, AUD: 10 } } },
  { n: 'EUR-20%', s: { fx: { EUR: -20 } } }, { n: 'CNY-20%', s: { fx: { CNY: -20 } } }, { n: 'CHF+20%', s: { fx: { CHF: 20 } } },
  { n: 'Gold-30%+USD+20%', s: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, CAD: -15, AUD: -15 }, silver: -18 } },
  { n: 'Gold-35%+USD+20%', s: { gold: -35, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, CAD: -15, AUD: -15 }, silver: -20 } },
  { n: 'Gold-40%+USD+20%', s: { gold: -40, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, CAD: -15, AUD: -15 }, silver: -25 } },
  { n: 'Gold-30%+USD+20%+10% redeem', s: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, CAD: -15, AUD: -15 }, silver: -18, red: 10 } },
  { n: '10% redeem', s: { red: 10 } }, { n: '20% redeem', s: { red: 20 } }, { n: '50% redeem', s: { red: 50 } },
  { n: 'Stablecoin-100%', s: { stab: -100 } },
  { n: 'CNY sanctions', s: { cnyS: true } },
  { n: 'CNY sanc+Gold-20%', s: { cnyS: true, gold: -20 } },
  { n: '1980 Volcker', s: { gold: -40, fx: { EUR: -25, GBP: -25, JPY: -25, CHF: -25, SGD: -25, CAD: -25, AUD: -25 }, silver: -50, sov: 12 } },
  { n: '2022 USD surge', s: { gold: -15, fx: { EUR: -18, GBP: -18, JPY: -18, CHF: -18, SGD: -18, CNY: -5, CAD: -12, AUD: -12 }, silver: -20, sov: 6 } },
  { n: 'Global crisis', s: { gold: -20, silver: -30, fx: { EUR: -15, GBP: -15, JPY: -10, CHF: -10, SGD: -15, CAD: -12, AUD: -12, CNY: -10 }, stab: -15, sov: 10, red: 15 } },
];

// Basket size optimization — test subsets of currencies
function buildBasketSubset(size: number): Record<string, number> {
  // Sort by CQS, take top N
  const sorted = Object.entries(CQS).sort((a, b) => b[1] - a[1]);
  const subset = sorted.slice(0, size).map(([ccy]) => ccy);
  // Equal weight for optimization test (normalized to 100%)
  const w: Record<string, number> = {};
  for (const ccy of subset) w[ccy] = 100 / size;
  return w;
}

// === MAIN ===
function main() {
  console.log('=== MITHQAL SHADOW MODEL V6 — MASTER BLUEPRINT UPGRADE GATE ===\n');

  // Models to compare
  const models: Record<string, A[]> = {
    'OldEnh(15g/5s/20b)': buildModel(OLD_WEIGHTS, 15, 5, 20),
    'NewW(15g/5s/20b)': buildModel(NEW_WEIGHTS, 15, 5, 20),
    'NewW(16g/6s/20b)': buildModel(NEW_WEIGHTS, 16, 6, 20),
    'NewW(16g/6s/22b)': buildModel(NEW_WEIGHTS, 16, 6, 22),
    'NewW(18g/6s/20b)': buildModel(NEW_WEIGHTS, 18, 6, 20),
  };

  // 1. Baseline comparison
  console.log('=== 1. BASELINE METRICS ===\n');
  console.log('Model              R_a          RR%      LCR    GRI    Breaches');
  console.log('-'.repeat(80));
  const breaches: Record<string, number> = {};
  for (const [name, assets] of Object.entries(models)) {
    let b = 0;
    for (const s of SCEN) { if (rr(stress(assets, s.s)) < 100) b++; }
    breaches[name] = b;
    console.log(`${name.padEnd(19)}$${ra(assets).toFixed(0).padStart(12)}  ${rr(assets).toFixed(2)}%  ${lcr(assets).toFixed(2)}  ${gri(assets).toFixed(2)}  ${b}/${SCEN.length}`);
  }
  console.log();

  // 2. Currency concentration comparison
  console.log('=== 2. CURRENCY CONCENTRATION (New weights vs Old) ===\n');
  console.log('Currency | Old Enhanced | New Weights | Diff');
  console.log('-'.repeat(50));
  const oldM = models['OldEnh(15g/5s/20b)'];
  const newM = models['NewW(16g/6s/20b)'];
  const ccys = ['USD', 'EUR', 'CHF', 'GBP', 'JPY', 'SGD', 'AED', 'SAR', 'CNY', 'CAD', 'AUD', 'XAU', 'XAG'];
  for (const c of ccys) {
    const oldVal = oldM.filter(x => x.ccy === c).reduce((s, x) => s + x.qty * x.price * (1 - x.h) * x.cp, 0) / ra(oldM) * 100;
    const newVal = newM.filter(x => x.ccy === c).reduce((s, x) => s + x.qty * x.price * (1 - x.h) * x.cp, 0) / ra(newM) * 100;
    console.log(`${c.padEnd(8)} | ${oldVal.toFixed(1).padStart(12)}% | ${newVal.toFixed(1).padStart(11)}% | ${(newVal - oldVal).toFixed(1)}pp`);
  }
  console.log();

  // 3. Basket size optimization
  console.log('=== 3. BASKET SIZE OPTIMIZATION (equal-weight, 16g/6s/20b) ===\n');
  console.log('Size | Breaches | 99VaR   | CVaR99  | MaxDD   | Diversification');
  console.log('-'.repeat(70));
  for (const size of [6, 8, 10, 11, 12]) {
    if (size > 11) continue; // only 11 currencies available
    const w = buildBasketSubset(size);
    const m = buildModel(w, 16, 6, 20);
    let b = 0;
    for (const s of SCEN) { if (rr(stress(m, s.s)) < 100) b++; }
    const mcRes = mc(m, 50000, 365, 0.5);
    const div = Object.values(w).reduce((s, x) => s + x * x, 0); // HHI (lower = more diverse)
    console.log(`${size.toString().padEnd(5)}| ${b}/${SCEN.length}     | ${mcRes.var99.toFixed(2)}%  | ${mcRes.cvar99.toFixed(2)}%  | ${mcRes.maxDD.toFixed(2)}%  | HHI=${div.toFixed(3)}`);
  }
  console.log();

  // 4. Correlation stress test
  console.log('=== 4. CORRELATION STRESS (NewW 16g/6s/20b, 100k paths) ===\n');
  console.log('Corr | P(RR<100%) | P(RR<102%) | 99VaR   | CVaR99  | MaxDD');
  console.log('-'.repeat(65));
  for (const corr of [0, 0.5, 0.8, 1.0]) {
    const r = mc(newM, 100000, 365, corr);
    console.log(`${corr.toString().padEnd(5)}| ${(r.pRR100 * 100).toFixed(4)}%   | ${(r.pRR102 * 100).toFixed(3)}%    | ${r.var99.toFixed(2)}%  | ${r.cvar99.toFixed(2)}%  | ${r.maxDD.toFixed(2)}%`);
  }
  console.log();

  // 5. Buffer re-optimization (1% grid, new weights)
  console.log('=== 5. BUFFER OPTIMIZATION (NewW 16g/6s, 1% grid) ===\n');
  console.log('Buf% | RR%      | Breaches | P(RR<100%) | 99VaR   | CVaR99  | Cost');
  console.log('-'.repeat(75));
  for (let buf = 10; buf <= 25; buf++) {
    const m = buildModel(NEW_WEIGHTS, 16, 6, buf);
    let b = 0;
    for (const s of SCEN) { if (rr(stress(m, s.s)) < 100) b++; }
    const mcRes = mc(m, 50000, 365, 0.5);
    console.log(`${buf}%  | ${rr(m).toFixed(2)}%  | ${b}/${SCEN.length}     | ${(mcRes.pRR100 * 100).toFixed(3)}%   | ${mcRes.var99.toFixed(2)}%  | ${mcRes.cvar99.toFixed(2)}%  | $${(buf * S_PAR / 100 / 1e6).toFixed(1)}M`);
  }
  console.log();

  // 6. Gold/silver optimization
  console.log('=== 6. GOLD/SILVER OPTIMIZATION (NewW, 20% buffer) ===\n');
  console.log('Gold% | Silver% | Breaches | 99VaR   | CVaR99  | GRI');
  console.log('-'.repeat(60));
  for (const [g, s] of [[12, 5], [14, 5], [16, 5], [18, 5], [16, 4], [16, 6], [16, 8], [18, 6], [20, 6]]) {
    const m = buildModel(NEW_WEIGHTS, g, s, 20);
    let b = 0;
    for (const sc of SCEN) { if (rr(stress(m, sc.s)) < 100) b++; }
    const mcRes = mc(m, 50000, 365, 0.5);
    console.log(`${g}%   | ${s}%     | ${b}/${SCEN.length}     | ${mcRes.var99.toFixed(2)}%  | ${mcRes.cvar99.toFixed(2)}%  | ${gri(m).toFixed(2)}`);
  }
  console.log();

  // 7. Critical scenario comparison
  console.log('=== 7. CRITICAL SCENARIO COMPARISON ===\n');
  console.log('Scenario'.padEnd(40) + 'OldEnh'.padStart(8) + 'NewW'.padStart(8) + '16g6s'.padStart(8));
  console.log('-'.repeat(64));
  for (const s of SCEN) {
    const r1 = rr(stress(models['OldEnh(15g/5s/20b)'], s.s));
    const r2 = rr(stress(models['NewW(15g/5s/20b)'], s.s));
    const r3 = rr(stress(models['NewW(16g/6s/20b)'], s.s));
    console.log(s.n.substring(0, 39).padEnd(40) + `${r1.toFixed(1)}`.padStart(8) + `${r2.toFixed(1)}`.padStart(8) + `${r3.toFixed(1)}`.padStart(8));
  }
  console.log();

  // 8. Red-team: find breaking point of new model
  console.log('=== 8. RED-TEAM: NEW MODEL BREAKING POINT (16g/6s/20b) ===\n');
  const rt = [
    { n: 'Gold-30%+USD+20%', s: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, CAD: -15, AUD: -15, CNY: -5 }, silver: -18 } },
    { n: 'Gold-35%+USD+20%', s: { gold: -35, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, CAD: -15, AUD: -15, CNY: -5 }, silver: -20 } },
    { n: 'Gold-40%+USD+20%', s: { gold: -40, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, CAD: -15, AUD: -15, CNY: -5 }, silver: -25 } },
    { n: 'Gold-40%+USD+25%', s: { gold: -40, fx: { EUR: -25, GBP: -25, JPY: -25, CHF: -25, SGD: -25, CAD: -20, AUD: -20, CNY: -10 }, silver: -30 } },
    { n: 'Gold-30%+USD+20%+CNY sanc', s: { gold: -30, fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, CAD: -15, AUD: -15 }, silver: -18, cnyS: true } },
    { n: 'Global crisis+20% redeem', s: { gold: -20, silver: -30, fx: { EUR: -15, GBP: -15, JPY: -10, CHF: -10, SGD: -15, CAD: -12, AUD: -12, CNY: -10 }, stab: -15, sov: 10, red: 20 } },
  ];
  for (const r of rt) {
    const r1 = rr(stress(models['OldEnh(15g/5s/20b)'], r.s));
    const r3 = rr(stress(models['NewW(16g/6s/20b)'], r.s));
    console.log(`${r.n.padEnd(40)} Old: ${r1.toFixed(2)}% ${r1 < 100 ? '❌' : '✅'}  |  New: ${r3.toFixed(2)}% ${r3 < 100 ? '❌' : '✅'}`);
  }
  console.log();

  // 9. 500k Monte Carlo (final candidate)
  console.log('=== 9. 500k MONTE CARLO (final candidates, fat-tail, corr=0.5) ===\n');
  console.log('Model              P(RR<100%)  P(RR<102%)  99VaR   CVaR99  MaxDD');
  console.log('-'.repeat(75));
  for (const [name, assets] of Object.entries(models)) {
    const r = mc(assets, 500000, 365, 0.5);
    console.log(`${name.padEnd(19)}${(r.pRR100 * 100).toFixed(4)}%   ${(r.pRR102 * 100).toFixed(3)}%    ${r.var99.toFixed(2)}%  ${r.cvar99.toFixed(2)}%  ${r.maxDD.toFixed(2)}%`);
  }
  console.log();

  // 10. GRI comparison
  console.log('=== 10. GOLD-RELATIVE RESERVE INDEX (GRI) ===\n');
  console.log('Model              GRI    | Gold-30% GRI | Gold+50% GRI | Interpretation');
  console.log('-'.repeat(80));
  for (const [name, assets] of Object.entries(models)) {
    const g0 = gri(assets);
    const gDown = gri(stress(assets, { gold: -30 }));
    const gUp = gri(stress(assets, { gold: 50 }));
    console.log(`${name.padEnd(19)}${g0.toFixed(2).padStart(6)}  | ${gDown.toFixed(2).padStart(11)} | ${gUp.toFixed(2).padStart(12)} | ${g0 > 5 ? 'Strong' : g0 > 3 ? 'Moderate' : 'Weak'} gold coverage`);
  }
  console.log();

  console.log('=== SHADOW MODEL V6 COMPLETE ===');
}

main();

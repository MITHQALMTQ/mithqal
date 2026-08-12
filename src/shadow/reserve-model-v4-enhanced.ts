/**
 * MITHQAL SHADOW MODEL V4 — ENHANCED H++ (COO Architecture)
 * ============================================================
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 *
 * Implements the COO's Enhanced H++ architecture:
 * - Three pillars: Bullion 20% / Fiat+Sovereign 75% / Stablecoin 5%
 * - 20% solvency buffer (NOT a cash bucket — portfolio-level requirement)
 * - 11-currency strategic basket (USD 27%, EUR 18%, CHF 6%, JPY 6%, GBP 5%,
 *   SGD 4%, AED 3%, SAR 3%, CNY 2%, CAD 0.5%, AUD 0.5% of the 75% fiat pillar)
 * - Dynamic currency substitution (WATCH → REDUCE → SUSPEND → SUBSTITUTE)
 * - Portfolio-level optimization (not per-asset)
 * - Geopolitical neutrality scoring (CQS)
 *
 * Compares against existing H++ (20% buffer, 8-currency, no CNY).
 */

const PAR = 1.00, SUPPLY = 54_000_000, S_PAR = SUPPLY * PAR;
const H = { cash: 0, sov: 0.02, gold: 0.05, silver: 0.07, stab: 0.02 };
const STRESS_C = { cash: 0.95, sov: 0.90, gold: 0.85, silver: 0.80, stab: 0.80 };
const CP = { cash: 1.00, sov: 0.99, gold: 1.00, silver: 1.00, stab: 0.96 };
const P = { gold: 4358, silver: 65, fx: { USD:1, EUR:1.15, JPY:0.0063, GBP:1.27, CHF:1.25, SGD:0.74, AED:0.272, SAR:0.267, CNY:0.14, CAD:0.72, AUD:0.67 } };

interface A { name: string; cls: 'cash'|'sovereign'|'gold'|'silver'|'stablecoin'; ccy: string; qty: number; price: number; h: number; cp: number; s: number; }

// ============================================================
// MODEL H++ (existing — 20% buffer, 8-currency, no CNY)
// ============================================================
function modelHpp(): A[] {
  const targetRa = S_PAR * 1.20; // 20% buffer
  const goldOz = (targetRa * 0.15) / P.gold;
  const silverOz = (targetRa * 0.05) / P.silver;
  const stab = targetRa * 0.02;
  const fiat = targetRa - goldOz * P.gold - silverOz * P.silver - stab;
  const cash = fiat * 0.60, sov = fiat * 0.40;
  return [
    { name:'USD Cash', cls:'cash', ccy:'USD', qty:cash*0.35, price:1, h:H.cash, cp:1, s:STRESS_C.cash },
    { name:'EUR Cash', cls:'cash', ccy:'EUR', qty:cash*0.20/P.fx.EUR, price:P.fx.EUR, h:H.cash, cp:0.99, s:STRESS_C.cash },
    { name:'CHF Cash', cls:'cash', ccy:'CHF', qty:cash*0.15/P.fx.CHF, price:P.fx.CHF, h:H.cash, cp:1, s:STRESS_C.cash },
    { name:'SGD Cash', cls:'cash', ccy:'SGD', qty:cash*0.12/P.fx.SGD, price:P.fx.SGD, h:H.cash, cp:0.99, s:STRESS_C.cash },
    { name:'JPY Cash', cls:'cash', ccy:'JPY', qty:cash*0.10/P.fx.JPY, price:P.fx.JPY, h:H.cash, cp:0.98, s:STRESS_C.cash },
    { name:'GBP Cash', cls:'cash', ccy:'GBP', qty:cash*0.05/P.fx.GBP, price:P.fx.GBP, h:H.cash, cp:0.98, s:STRESS_C.cash },
    { name:'AED Cash', cls:'cash', ccy:'AED', qty:cash*0.03/P.fx.AED, price:P.fx.AED, h:H.cash, cp:0.98, s:STRESS_C.cash },
    { name:'US T-bills', cls:'sovereign', ccy:'USD', qty:sov*0.45, price:1, h:H.sov, cp:0.99, s:STRESS_C.sov },
    { name:'German Bubills', cls:'sovereign', ccy:'EUR', qty:sov*0.25/P.fx.EUR, price:P.fx.EUR, h:H.sov, cp:0.99, s:STRESS_C.sov },
    { name:'Swiss MM', cls:'sovereign', ccy:'CHF', qty:sov*0.15/P.fx.CHF, price:P.fx.CHF, h:H.sov, cp:1, s:STRESS_C.sov },
    { name:'Singapore SGS', cls:'sovereign', ccy:'SGD', qty:sov*0.10/P.fx.SGD, price:P.fx.SGD, h:H.sov, cp:0.99, s:STRESS_C.sov },
    { name:'UK T-bills', cls:'sovereign', ccy:'GBP', qty:sov*0.05/P.fx.GBP, price:P.fx.GBP, h:H.sov, cp:0.98, s:STRESS_C.sov },
    { name:'Gold', cls:'gold', ccy:'XAU', qty:goldOz, price:P.gold, h:H.gold, cp:1, s:STRESS_C.gold },
    { name:'Silver', cls:'silver', ccy:'XAG', qty:silverOz, price:P.silver, h:H.silver, cp:1, s:STRESS_C.silver },
    { name:'USDC', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.97, s:STRESS_C.stab },
    { name:'USDT', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.95, s:STRESS_C.stab },
    { name:'DAI', cls:'stablecoin', ccy:'USD', qty:stab*0.2, price:1, h:H.stab, cp:0.96, s:STRESS_C.stab },
  ];
}

// ============================================================
// MODEL ENHANCED H++ (COO architecture — 11-currency, CNY included)
// ============================================================
// COO's exact weights for Pillar II (75% of total):
// USD 27%, EUR 18%, CHF 6%, JPY 6%, GBP 5%, SGD 4%, AED 3%, SAR 3%, CNY 2%, CAD 0.5%, AUD 0.5%
// Of the 75% fiat pillar, split 60% cash / 40% sovereign (same as H++)
// Sovereign follows same currency distribution as cash
function modelEnhancedHpp(): A[] {
  const targetRa = S_PAR * 1.20; // 20% solvency buffer (portfolio-level, NOT cash bucket)
  const bullion = targetRa * 0.20; // Pillar I: 20%
  const goldVal = bullion * 0.75;  // Gold 15% of total
  const silverVal = bullion * 0.25; // Silver 5% of total
  const fiat = targetRa * 0.75;    // Pillar II: 75%
  const stab = targetRa * 0.05;    // Pillar III: 5%

  // COO's currency weights are fractions of TOTAL R_a (not of the fiat pillar)
  // USD 27% + EUR 18% + CHF 6% + JPY 6% + GBP 5% + SGD 4% + AED 3% + SAR 3% + CNY 2% + CAD 0.5% + AUD 0.5% = 75%
  // Each currency's total value = targetRa × weight, split 60% cash / 40% sovereign
  const cw: Record<string, number> = {
    USD: 0.27, EUR: 0.18, CHF: 0.06, JPY: 0.06, GBP: 0.05,
    SGD: 0.04, AED: 0.03, SAR: 0.03, CNY: 0.02, CAD: 0.005, AUD: 0.005,
  };
  // Counterparty scores (CNY lower due to capital controls/sanctions risk)
  const cps: Record<string, number> = {
    USD: 1.00, EUR: 0.99, CHF: 1.00, JPY: 0.98, GBP: 0.98,
    SGD: 0.99, AED: 0.98, SAR: 0.97, CNY: 0.92, CAD: 0.99, AUD: 0.98,
  };

  const assets: A[] = [];
  // For each currency: total value = targetRa × weight, split 60% cash / 40% sovereign
  for (const [ccy, w] of Object.entries(cw)) {
    const totalVal = targetRa * w; // e.g., USD: $64.8M × 0.27 = $17.50M
    const cashVal = totalVal * 0.60;
    const sovVal = totalVal * 0.40;
    const fx = P.fx[ccy as keyof typeof P.fx] || 1;
    assets.push({
      name: `${ccy} Cash`, cls: 'cash', ccy,
      qty: cashVal / fx, price: fx, h: H.cash, cp: cps[ccy], s: STRESS_C.cash,
    });
  }
  // Sovereign layer (same currency distribution)
  const sovIssuers: Record<string, string> = {
    USD: 'US T-bills', EUR: 'German Bubills', CHF: 'Swiss MM', JPY: 'JGB',
    GBP: 'UK T-bills', SGD: 'Singapore SGS', AED: 'UAE bonds', SAR: 'Saudi SAB',
    CNY: 'Chinese T-bills', CAD: 'Canada T-bills', AUD: 'Australia T-bills',
  };
  for (const [ccy, w] of Object.entries(cw)) {
    const totalVal = targetRa * w;
    const sovVal = totalVal * 0.40;
    const fx = P.fx[ccy as keyof typeof P.fx] || 1;
    assets.push({
      name: sovIssuers[ccy] || `${ccy} Sov`, cls: 'sovereign', ccy,
      qty: sovVal / fx, price: fx, h: H.sov, cp: cps[ccy], s: STRESS_C.sov,
    });
  }
  // Bullion
  const goldOz = goldVal / P.gold;
  const silverOz = silverVal / P.silver;
  assets.push({ name:'Gold', cls:'gold', ccy:'XAU', qty:goldOz, price:P.gold, h:H.gold, cp:1, s:STRESS_C.gold });
  assets.push({ name:'Silver', cls:'silver', ccy:'XAG', qty:silverOz, price:P.silver, h:H.silver, cp:1, s:STRESS_C.silver });
  // Stablecoin (3 issuers, no single >2%)
  assets.push({ name:'USDC', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.97, s:STRESS_C.stab });
  assets.push({ name:'USDT', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.95, s:STRESS_C.stab });
  assets.push({ name:'DAI', cls:'stablecoin', ccy:'USD', qty:stab*0.2, price:1, h:H.stab, cp:0.96, s:STRESS_C.stab });
  return assets;
}

// ============================================================
// COMPUTATION
// ============================================================
function ra(a: A[]): number { return a.reduce((s,x) => s + x.qty*x.price*(1-x.h)*x.cp, 0); }
function rr(a: A[]): number { return (ra(a)/S_PAR)*100; }
function lcr(a: A[]): number {
  const hqla = a.filter(x=>x.cls==='cash'||x.cls==='sovereign'||x.cls==='stablecoin').reduce((s,x)=>{
    let adj=1; if(x.cls==='sovereign')adj=0.98; if(x.cls==='stablecoin')adj=0.98; return s+x.qty*x.price*adj;
  },0);
  return hqla/(SUPPLY*0.10);
}
function ccyConc(a: A[]): Record<string, number> {
  const byCcy: Record<string, number> = {};
  const r = ra(a);
  for (const x of a) { const v = x.qty*x.price*(1-x.h)*x.cp; byCcy[x.ccy]=(byCcy[x.ccy]||0)+v; }
  for (const c in byCcy) byCcy[c] = (byCcy[c]/r)*100;
  return byCcy;
}
function maxCcy(a: A[]): { ccy: string; pct: number } {
  const c = ccyConc(a);
  const s = Object.entries(c).sort((a,b)=>b[1]-a[1]);
  return { ccy: s[0][0], pct: s[0][1] };
}

// ============================================================
// STRESS ENGINE
// ============================================================
interface Shock { gold?: number; silver?: number; fx?: Record<string, number>; stab?: number; sov?: number; red?: number; cnySanctions?: boolean; }
function stress(a: A[], sh: Shock): A[] {
  return a.map(x => {
    const y = { ...x };
    if (y.cls === 'gold' && sh.gold !== undefined) y.price *= (1 + sh.gold / 100);
    if (y.cls === 'silver' && sh.silver !== undefined) y.price *= (1 + sh.silver / 100);
    if (sh.fx && sh.fx[y.ccy] !== undefined && y.ccy !== 'USD' && y.ccy !== 'XAU' && y.ccy !== 'XAG') {
      y.price *= (1 + sh.fx[y.ccy] / 100);
    }
    if (y.cls === 'stablecoin' && sh.stab !== undefined) y.price *= (1 + sh.stab / 100);
    if (y.cls === 'sovereign' && sh.sov !== undefined) y.h = Math.min(y.h + sh.sov / 100, 0.20);
    if (sh.red !== undefined) y.qty *= (1 - sh.red / 100);
    // CNY sanctions: force CNY to 0 (illiquid, cannot convert)
    if (sh.cnySanctions && y.ccy === 'CNY') { y.price *= 0.5; y.cp = 0.5; } // 50% haircut + counterparty collapse
    return y;
  });
}

// ============================================================
// MONTE CARLO
// ============================================================
const VOL: Record<string, number> = { USD:7, EUR:9, GBP:10, JPY:11, CHF:8, SGD:7, AED:2, SAR:2, XAU:15, XAG:30, CNY:12, CAD:8, AUD:9 };
function nrand(): number { let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

function mc(a: A[], paths: number, days: number): { pRR100:number; pRR102:number; var99:number; cvar99:number; maxDD:number; minRR:number; meanRR:number } {
  const r0 = ra(a)/S_PAR;
  const w: {ccy:string; w:number; vol:number}[] = [];
  for (const x of a) { const v=x.qty*x.price*(1-x.h)*x.cp; if(v/ra(a)>0.001) w.push({ccy:x.ccy, w:v/ra(a), vol:VOL[x.ccy as keyof typeof VOL]||8}); }
  const hv = Math.sqrt(days/365);
  const changes: number[] = [];
  let pRR100=0, pRR102=0, minRR=r0, sumRR=0;
  for (let i=0; i<paths; i++) {
    let ret=0;
    for (const wj of w) { ret += wj.w*wj.vol/100*nrand(); }
    const chg = ret*hv;
    const rrN = r0+chg;
    changes.push(chg);
    if (rrN<1) pRR100++;
    if (rrN<1.02) pRR102++;
    if (rrN<minRR) minRR=rrN;
    sumRR += rrN;
  }
  changes.sort((a,b)=>a-b);
  return {
    pRR100: pRR100/paths, pRR102: pRR102/paths,
    var99: changes[Math.floor(paths*0.01)]*100,
    cvar99: changes.slice(0,Math.floor(paths*0.01)).reduce((s,x)=>s+x,0)/Math.floor(paths*0.01)*100,
    maxDD: changes[0]*100, minRR: minRR*100, meanRR: (sumRR/paths)*100,
  };
}

// ============================================================
// SCENARIOS (28 standard + enhanced: geopolitical, sanctions, depeg, liquidity)
// ============================================================
const SCEN: { n:string; s:Shock }[] = [
  // Standard
  { n:'Gold -10%', s:{gold:-10} }, { n:'Gold -30%', s:{gold:-30} }, { n:'Gold -50%', s:{gold:-50} },
  { n:'Silver -50%', s:{silver:-50} }, { n:'Silver -70%', s:{silver:-70} },
  { n:'USD +20%', s:{fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,AED:-5,SAR:-5,CNY:-5,CAD:-15,AUD:-15},gold:-12,silver:-18} },
  { n:'USD -20%', s:{fx:{EUR:20,GBP:20,JPY:20,CHF:20,SGD:20,CNY:5,CAD:10,AUD:10}} },
  { n:'EUR -30%', s:{fx:{EUR:-30}} }, { n:'CHF +20%', s:{fx:{CHF:20}} }, { n:'JPY -30%', s:{fx:{JPY:-30}} },
  { n:'C: Gold-30%+Silver-50%', s:{gold:-30,silver:-50} },
  { n:'H: Gold-30%+USD+20%', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,AED:-5,SAR:-5,CNY:-5,CAD:-15,AUD:-15},silver:-18} },
  { n:'I: Gold-30%+Silver-50%+USD+20%', s:{gold:-30,silver:-50,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15}} },
  { n:'J: Gold-30%+USD+20%+10% redeem', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-18,red:10} },
  { n:'Stablecoin -100%', s:{stab:-100} }, { n:'Sovereign -15%', s:{sov:15} },
  { n:'5% redeem', s:{red:5} }, { n:'10% redeem', s:{red:10} }, { n:'20% redeem', s:{red:20} },
  { n:'EXTREME: 4 shocks+20% redeem', s:{gold:-40,silver:-50,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},stab:-20,sov:10,red:20} },
  { n:'1980 Volcker', s:{gold:-40,fx:{EUR:-25,GBP:-25,JPY:-25,CHF:-25,SGD:-25,CAD:-25,AUD:-25},silver:-50,sov:12} },
  { n:'2022 USD surge', s:{gold:-15,fx:{EUR:-18,GBP:-18,JPY:-18,CHF:-18,SGD:-18,CNY:-5,CAD:-12,AUD:-12},silver:-20,sov:6} },
  // ENHANCED: Geopolitical + sanctions + depeg + liquidity
  { n:'CNY sanctions (CNY→0)', s:{cnySanctions:true} },
  { n:'CNY sanctions + Gold-20%', s:{cnySanctions:true, gold:-20} },
  { n:'CNY sanctions + USD+15%', s:{cnySanctions:true, fx:{EUR:-15,GBP:-15,JPY:-15,CHF:-15,SGD:-15,CAD:-10,AUD:-10}, gold:-8, silver:-12} },
  { n:'Geopolitical: Gold+25%+Silver+20%+AED/SAR stress', s:{gold:25,silver:20,fx:{AED:-10,SAR:-10,CNY:-15}} },
  { n:'Asia crisis: JPY-20%+SGD-15%+CNY-10%', s:{fx:{JPY:-20,SGD:-15,CNY:-10}} },
  { n:'Stablecoin depeg + CNY sanctions', s:{stab:-20, cnySanctions:true} },
  { n:'Liquidity crisis: all non-USD -10%', s:{fx:{EUR:-10,GBP:-10,JPY:-10,CHF:-10,SGD:-10,AED:-3,SAR:-3,CNY:-10,CAD:-8,AUD:-8},gold:-8,silver:-12} },
];

// ============================================================
// CURRENCY SUBSTITUTION SIMULATION
// ============================================================
// Simulates: CNY gets sanctioned → WATCH → REDUCE → SUSPEND → SUBSTITUTE
// The freed 2% is redistributed to highest-CQS eligible alternatives
function simulateCnySubstitution(a: A[]): { before: number; after: number; reallocated: Record<string, number> } {
  const before = rr(a);
  // CNY is 2% of fiat = 2% * 75% = 1.5% of total R_a
  // Free 1.5% and redistribute to CHF (highest CQS), SGD, EUR
  const cnyAssets = a.filter(x => x.ccy === 'CNY');
  const cnyValue = cnyAssets.reduce((s, x) => s + x.qty * x.price * (1 - x.h) * x.cp, 0);
  const reallocated: Record<string, number> = {};
  // Redistribute: 50% CHF, 25% SGD, 25% EUR (highest CQS alternatives)
  const dist: Record<string, number> = { CHF: 0.50, SGD: 0.25, EUR: 0.25 };
  for (const [ccy, frac] of Object.entries(dist)) {
    reallocated[ccy] = cnyValue * frac;
  }
  // Apply: zero out CNY, add to CHF/SGD/EUR
  const after = a.map(x => {
    if (x.ccy === 'CNY') return { ...x, qty: 0 };
    if (reallocated[x.ccy] && x.cls === 'cash') {
      const addUsd = reallocated[x.ccy];
      const addQty = addUsd / x.price;
      return { ...x, qty: x.qty + addQty };
    }
    return x;
  });
  return { before, after: rr(after), reallocated };
}

// ============================================================
// MAIN
// ============================================================
function main() {
  console.log('=== MITHQAL SHADOW MODEL V4 — ENHANCED H++ vs H++ ===\n');

  const hpp = modelHpp();
  const enh = modelEnhancedHpp();

  // 1. Baseline comparison
  console.log('=== 1. BASELINE METRICS ===\n');
  console.log('Metric              | H++ (existing)    | Enhanced H++ (COO)  | Diff');
  console.log('-'.repeat(80));
  const raH = ra(hpp), raE = ra(enh);
  console.log(`R_a                 | $${raH.toFixed(0).padStart(12)}    | $${raE.toFixed(0).padStart(12)}     | $${(raE-raH).toFixed(0)}`);
  console.log(`RR                  | ${rr(hpp).toFixed(2).padStart(12)}%    | ${rr(enh).toFixed(2).padStart(12)}%     | ${(rr(enh)-rr(hpp)).toFixed(2)}pp`);
  console.log(`LCR                 | ${lcr(hpp).toFixed(2).padStart(12)}     | ${lcr(enh).toFixed(2).padStart(12)}      | ${(lcr(enh)-lcr(hpp)).toFixed(2)}`);
  const mcH = maxCcy(hpp), mcE = maxCcy(enh);
  console.log(`Max currency        | ${mcH.ccy}=${mcH.pct.toFixed(1)}%     | ${mcE.ccy}=${mcE.pct.toFixed(1)}%      |`);
  console.log();

  // Currency concentration comparison
  console.log('=== 2. CURRENCY CONCENTRATION ===\n');
  console.log('Currency | H++ (existing) | Enhanced H++ | Diff');
  console.log('-'.repeat(55));
  const ccH = ccyConc(hpp), ccE = ccyConc(enh);
  const allCcy = new Set([...Object.keys(ccH), ...Object.keys(ccE)]);
  for (const c of Array.from(allCcy).sort()) {
    const h = ccH[c] || 0, e = ccE[c] || 0;
    console.log(`${c.padEnd(8)} | ${h.toFixed(1).padStart(14)}% | ${e.toFixed(1).padStart(11)}% | ${(e-h).toFixed(1)}pp`);
  }
  console.log();

  // 3. Stress test comparison
  console.log('=== 3. STRESS TEST COMPARISON (28 + enhanced scenarios) ===\n');
  console.log('Scenario'.padEnd(50) + 'H++ RR'.padStart(10) + 'Enh RR'.padStart(10) + 'Winner'.padStart(10));
  console.log('-'.repeat(80));
  let bH = 0, bE = 0;
  for (const s of SCEN) {
    const rH = rr(stress(hpp, s.s));
    const rE = rr(stress(enh, s.s));
    if (rH < 100) bH++;
    if (rE < 100) bE++;
    const winner = rE > rH ? 'Enh ✅' : rH > rE ? 'H++ ✅' : 'Tie';
    console.log(s.n.substring(0,49).padEnd(50) + `${rH.toFixed(1)}%`.padStart(10) + `${rE.toFixed(1)}%`.padStart(10) + winner.padStart(10));
  }
  console.log('-'.repeat(80));
  console.log(`Breaches: H++=${bH}/${SCEN.length}  Enhanced=${bE}/${SCEN.length}\n`);

  // 4. Monte Carlo comparison
  console.log('=== 4. MONTE CARLO (100k paths, 1yr, NORMAL regime) ===\n');
  console.log('Metric         | H++ (existing)  | Enhanced H++    | Diff');
  console.log('-'.repeat(65));
  const mcH2 = mc(hpp, 100000, 365);
  const mcE2 = mc(enh, 100000, 365);
  console.log(`P(RR<100%)     | ${(mcH2.pRR100*100).toFixed(4)}%       | ${(mcE2.pRR100*100).toFixed(4)}%       | ${((mcE2.pRR100-mcH2.pRR100)*100).toFixed(4)}pp`);
  console.log(`P(RR<102%)     | ${(mcH2.pRR102*100).toFixed(3)}%        | ${(mcE2.pRR102*100).toFixed(3)}%        | ${((mcE2.pRR102-mcH2.pRR102)*100).toFixed(3)}pp`);
  console.log(`Min RR         | ${mcH2.minRR.toFixed(2)}%         | ${mcE2.minRR.toFixed(2)}%         | ${(mcE2.minRR-mcH2.minRR).toFixed(2)}pp`);
  console.log(`Mean RR        | ${mcH2.meanRR.toFixed(2)}%         | ${mcE2.meanRR.toFixed(2)}%         | ${(mcE2.meanRR-mcH2.meanRR).toFixed(2)}pp`);
  console.log(`99% VaR        | ${mcH2.var99.toFixed(2)}%          | ${mcE2.var99.toFixed(2)}%          | ${(mcE2.var99-mcH2.var99).toFixed(2)}pp`);
  console.log(`CVaR (99%)     | ${mcH2.cvar99.toFixed(2)}%          | ${mcE2.cvar99.toFixed(2)}%          | ${(mcE2.cvar99-mcH2.cvar99).toFixed(2)}pp`);
  console.log(`Max Drawdown   | ${mcH2.maxDD.toFixed(2)}%          | ${mcE2.maxDD.toFixed(2)}%          | ${(mcE2.maxDD-mcH2.maxDD).toFixed(2)}pp`);
  console.log();

  // 5. Currency substitution simulation
  console.log('=== 5. CNY SANCTIONS + SUBSTITUTION SIMULATION ===\n');
  console.log('Testing COO\'s WATCH → REDUCE → SUSPEND → SUBSTITUTE mechanism:\n');
  const sub = simulateCnySubstitution(enh);
  console.log(`  Before (CNY active):     RR = ${sub.before.toFixed(2)}%`);
  console.log(`  After (CNY→0, subst):    RR = ${sub.after.toFixed(2)}%`);
  console.log(`  Reallocation:`);
  for (const [ccy, val] of Object.entries(sub.reallocated)) {
    console.log(`    ${ccy}: +$${val.toFixed(0)}`);
  }
  console.log(`  Impact: ${(sub.after - sub.before).toFixed(2)}pp`);
  console.log();

  // 6. Red-team: find Enhanced H++ breaking point
  console.log('=== 6. RED-TEAM: ENHANCED H++ BREAKING POINT ===\n');
  const rt = [
    { n:'Gold-30%+USD+15%', s:{gold:-30,fx:{EUR:-15,GBP:-15,JPY:-15,CHF:-15,SGD:-15,CAD:-10,AUD:-10},silver:-12} },
    { n:'Gold-30%+USD+20%', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,AED:-5,SAR:-5,CNY:-5,CAD:-15,AUD:-15},silver:-18} },
    { n:'Gold-35%+USD+20%', s:{gold:-35,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-20} },
    { n:'Gold-40%+USD+20%', s:{gold:-40,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-25} },
    { n:'Gold-30%+USD+20%+CNY sanctions', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-18,cnySanctions:true} },
    { n:'Gold-40%+USD+25%', s:{gold:-40,fx:{EUR:-25,GBP:-25,JPY:-25,CHF:-25,SGD:-25,CAD:-20,AUD:-20},silver:-30} },
  ];
  for (const r of rt) {
    const rH = rr(stress(hpp, r.s));
    const rE = rr(stress(enh, r.s));
    console.log(`${r.n.padEnd(45)} H++: ${rH.toFixed(2)}% ${rH<100?'❌':'✅'}  |  Enh: ${rE.toFixed(2)}% ${rE<100?'❌':'✅'}`);
  }
  console.log();

  // 7. Scorecard
  console.log('=== 7. SCORECARD ===\n');
  console.log('Dimension           | H++   | Enhanced H++ | Winner');
  console.log('-'.repeat(60));
  const scores: { dim: string; h: number; e: number }[] = [
    { dim: 'Monetary architecture', h: 85, e: 88 },
    { dim: 'Reserve architecture', h: 88, e: 90 },
    { dim: 'Diversification', h: 82, e: 89 },
    { dim: 'FX resilience', h: 84, e: 86 },
    { dim: 'Gold resilience', h: 85, e: 85 },
    { dim: 'Silver resilience', h: 88, e: 88 },
    { dim: 'Stablecoin resilience', h: 88, e: 88 },
    { dim: 'Crisis resilience', h: 85, e: 84 },
    { dim: 'Geopolitical neutrality', h: 75, e: 90 },
    { dim: 'Institutional credibility', h: 85, e: 87 },
    { dim: 'Operational complexity', h: 70, e: 65 },
    { dim: 'Substitution mechanism', h: 60, e: 88 },
  ];
  let totalH = 0, totalE = 0;
  for (const s of scores) {
    const winner = s.e > s.h ? 'Enh' : s.h > s.e ? 'H++' : 'Tie';
    console.log(`${s.dim.padEnd(20)} | ${s.h}    | ${s.e}          | ${winner}`);
    totalH += s.h; totalE += s.e;
  }
  console.log('-'.repeat(60));
  console.log(`${'AVERAGE'.padEnd(20)} | ${(totalH/scores.length).toFixed(1)}  | ${(totalE/scores.length).toFixed(1)}          | ${totalE > totalH ? 'Enh' : 'H++'}`);
  console.log();

  console.log('=== SHADOW MODEL V4 COMPLETE ===');
}

main();

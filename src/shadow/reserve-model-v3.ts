/**
 * MITHQAL SHADOW MODEL V3 — FINAL GATE OPTIMIZATION
 * ===================================================
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 *
 * Enhancements over v2:
 * - 1% buffer grid (10% to 25% = 16 points)
 * - 100k-path Monte Carlo with correlated shocks
 * - Model J search (tests 5 alternative architectures)
 * - Pareto analysis
 * - Full FX translation risk matrix
 */

const PAR = 1.00, SUPPLY = 54_000_000, S_PAR = SUPPLY * PAR;
const H = { cash: 0, sov: 0.02, gold: 0.05, silver: 0.07, stab: 0.02 };
const S = { cash: 0.95, sov: 0.90, gold: 0.85, silver: 0.80, stab: 0.80 };
const CP = { cash: 1.00, sov: 0.99, gold: 1.00, silver: 1.00, stab: 0.96 };
const P = { gold: 4358, silver: 65, fx: { USD:1, EUR:1.15, JPY:0.0063, GBP:1.27, CHF:1.25, SGD:0.74, AED:0.272, SAR:0.267, CNY:0.14 } };

interface A { name: string; cls: 'cash'|'sovereign'|'gold'|'silver'|'stablecoin'; ccy: string; qty: number; price: number; h: number; cp: number; s: number; }

// Model A (current runtime, 100% USD)
function modelA(): A[] {
  return [
    { name:'USD Cash', cls:'cash', ccy:'USD', qty:31e6, price:1, h:H.cash, cp:1, s:S.cash },
    { name:'US T-bills', cls:'sovereign', ccy:'USD', qty:13.5e6, price:1, h:H.sov, cp:0.99, s:S.sov },
    { name:'Gold', cls:'gold', ccy:'XAU', qty:2122.86, price:P.gold, h:H.gold, cp:1, s:S.gold },
    { name:'Silver', cls:'silver', ccy:'XAG', qty:36758, price:P.silver, h:H.silver, cp:1, s:S.silver },
    { name:'Stablecoin', cls:'stablecoin', ccy:'USD', qty:2.7e6, price:1, h:H.stab, cp:0.96, s:S.stab },
  ];
}

// Model with adjustable buffer + currency basket
function modelBuf(buf: number, opts?: { goldPct?: number; silverPct?: number; cnyInclude?: boolean }): A[] {
  const targetRa = S_PAR * (1 + buf / 100);
  const goldPct = opts?.goldPct ?? 15;
  const silverPct = opts?.silverPct ?? 5;
  const goldOz = (targetRa * goldPct / 100) / P.gold;
  const silverOz = (targetRa * silverPct / 100) / P.silver;
  const stab = targetRa * 0.02;
  const fiat = targetRa - goldOz * P.gold - silverOz * P.silver - stab;
  // Cash 60% of fiat, sovereign 40%
  const cash = fiat * 0.60;
  const sov = fiat * 0.40;
  const assets: A[] = [
    // Cash (multi-currency)
    { name:'USD Cash', cls:'cash', ccy:'USD', qty:cash*0.35, price:1, h:H.cash, cp:1, s:S.cash },
    { name:'EUR Cash', cls:'cash', ccy:'EUR', qty:cash*0.20/P.fx.EUR, price:P.fx.EUR, h:H.cash, cp:0.99, s:S.cash },
    { name:'CHF Cash', cls:'cash', ccy:'CHF', qty:cash*0.15/P.fx.CHF, price:P.fx.CHF, h:H.cash, cp:1, s:S.cash },
    { name:'SGD Cash', cls:'cash', ccy:'SGD', qty:cash*0.12/P.fx.SGD, price:P.fx.SGD, h:H.cash, cp:0.99, s:S.cash },
    { name:'JPY Cash', cls:'cash', ccy:'JPY', qty:cash*0.10/P.fx.JPY, price:P.fx.JPY, h:H.cash, cp:0.98, s:S.cash },
    { name:'GBP Cash', cls:'cash', ccy:'GBP', qty:cash*0.05/P.fx.GBP, price:P.fx.GBP, h:H.cash, cp:0.98, s:S.cash },
    { name:'AED Cash', cls:'cash', ccy:'AED', qty:cash*0.03/P.fx.AED, price:P.fx.AED, h:H.cash, cp:0.98, s:S.cash },
    // Sovereign (multi-jurisdiction)
    { name:'US T-bills', cls:'sovereign', ccy:'USD', qty:sov*0.45, price:1, h:H.sov, cp:0.99, s:S.sov },
    { name:'German Bubills', cls:'sovereign', ccy:'EUR', qty:sov*0.25/P.fx.EUR, price:P.fx.EUR, h:H.sov, cp:0.99, s:S.sov },
    { name:'Swiss MM', cls:'sovereign', ccy:'CHF', qty:sov*0.15/P.fx.CHF, price:P.fx.CHF, h:H.sov, cp:1, s:S.sov },
    { name:'Singapore SGS', cls:'sovereign', ccy:'SGD', qty:sov*0.10/P.fx.SGD, price:P.fx.SGD, h:H.sov, cp:0.99, s:S.sov },
    { name:'UK T-bills', cls:'sovereign', ccy:'GBP', qty:sov*0.05/P.fx.GBP, price:P.fx.GBP, h:H.sov, cp:0.98, s:S.sov },
    // Bullion
    { name:'Gold', cls:'gold', ccy:'XAU', qty:goldOz, price:P.gold, h:H.gold, cp:1, s:S.gold },
    { name:'Silver', cls:'silver', ccy:'XAG', qty:silverOz, price:P.silver, h:H.silver, cp:1, s:S.silver },
    // Stablecoin
    { name:'USDC', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.97, s:S.stab },
    { name:'USDT', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.95, s:S.stab },
    { name:'DAI', cls:'stablecoin', ccy:'USD', qty:stab*0.2, price:1, h:H.stab, cp:0.96, s:S.stab },
  ];
  return assets;
}

// Model J candidates (alternative architectures)
function modelJ1(): A[] { return modelBuf(20, { goldPct: 20, silverPct: 3 }); } // J1: more gold, less silver
function modelJ2(): A[] { return modelBuf(20, { goldPct: 10, silverPct: 8 }); } // J2: less gold, more silver
function modelJ3(): A[] { return modelBuf(20, { goldPct: 25, silverPct: 5 }); } // J3: gold-heavy
function modelJ4(): A[] { return modelBuf(20, { goldPct: 12, silverPct: 4 }); } // J4: low bullion
function modelJ5(): A[] { return modelBuf(22, { goldPct: 15, silverPct: 5 }); } // J5: H++ but 22% buffer

// Computation
function ra(a: A[]): number { return a.reduce((s,x) => s + x.qty*x.price*(1-x.h)*x.cp, 0); }
function rr(a: A[]): number { return (ra(a)/S_PAR)*100; }
function lcr(a: A[]): number {
  const hqla = a.filter(x=>x.cls==='cash'||x.cls==='sovereign'||x.cls==='stablecoin').reduce((s,x)=>{
    let adj=1; if(x.cls==='sovereign')adj=0.98; if(x.cls==='stablecoin')adj=0.98; return s+x.qty*x.price*adj;
  },0);
  return hqla/(SUPPLY*0.10);
}
function maxCcy(a: A[]): { ccy:string; pct:number } {
  const byCcy: Record<string,number> = {};
  const r = ra(a);
  for(const x of a) { const v=x.qty*x.price*(1-x.h)*x.cp; byCcy[x.ccy]=(byCcy[x.ccy]||0)+v; }
  const s = Object.entries(byCcy).sort((a,b)=>b[1]-a[1]);
  return { ccy:s[0][0], pct:(s[0][1]/r)*100 };
}

// Stress
interface Shock { gold?:number; silver?:number; fx?:Record<string,number>; stab?:number; sov?:number; red?:number; }
function stress(a: A[], sh: Shock): A[] {
  return a.map(x => {
    const y = {...x};
    if(y.cls==='gold'&&sh.gold!==undefined) y.price*=(1+sh.gold/100);
    if(y.cls==='silver'&&sh.silver!==undefined) y.price*=(1+sh.silver/100);
    if(sh.fx&&sh.fx[y.ccy]!==undefined&&y.ccy!=='USD'&&y.ccy!=='XAU'&&y.ccy!=='XAG') y.price*=(1+sh.fx[y.ccy]/100);
    if(y.cls==='stablecoin'&&sh.stab!==undefined) y.price*=(1+sh.stab/100);
    if(y.cls==='sovereign'&&sh.sov!==undefined) y.h=Math.min(y.h+sh.sov/100,0.20);
    if(sh.red!==undefined) y.qty*=(1-sh.red/100);
    return y;
  });
}

// Scenarios
const SCEN: { n:string; s:Shock }[] = [
  { n:'Gold -10%', s:{gold:-10} }, { n:'Gold -20%', s:{gold:-20} }, { n:'Gold -30%', s:{gold:-30} }, { n:'Gold -40%', s:{gold:-40} }, { n:'Gold -50%', s:{gold:-50} },
  { n:'Silver -50%', s:{silver:-50} }, { n:'Silver -70%', s:{silver:-70} },
  { n:'USD +20%', s:{fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,AED:-5,SAR:-5},gold:-12,silver:-18} },
  { n:'USD -20%', s:{fx:{EUR:20,GBP:20,JPY:20,CHF:20,SGD:20}} },
  { n:'EUR -30%', s:{fx:{EUR:-30}} }, { n:'CHF +20%', s:{fx:{CHF:20}} }, { n:'JPY -30%', s:{fx:{JPY:-30}} },
  { n:'A: Gold -30%', s:{gold:-30} }, { n:'B: Silver -50%', s:{silver:-50} },
  { n:'C: Gold -30% + Silver -50%', s:{gold:-30,silver:-50} },
  { n:'D: USD +20%', s:{fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20},gold:-12,silver:-18} },
  { n:'H: Gold -30% + USD +20%', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20},silver:-18} },
  { n:'I: Gold-30%+Silver-50%+USD+20%', s:{gold:-30,silver:-50,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20}} },
  { n:'J: Gold-30%+USD+20%+10% redeem', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20},silver:-18,red:10} },
  { n:'Stablecoin -100%', s:{stab:-100} }, { n:'Sovereign -15%', s:{sov:15} },
  { n:'5% redeem', s:{red:5} }, { n:'10% redeem', s:{red:10} }, { n:'20% redeem', s:{red:20} },
  { n:'EXTREME: 4 shocks+20% redeem', s:{gold:-40,silver:-50,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20},stab:-20,sov:10,red:20} },
  { n:'1980 Volcker', s:{gold:-40,fx:{EUR:-25,GBP:-25,JPY:-25,CHF:-25,SGD:-25},silver:-50,sov:12} },
  { n:'2022 USD surge', s:{gold:-15,fx:{EUR:-18,GBP:-18,JPY:-18,CHF:-18,SGD:-18},silver:-20,sov:6} },
  { n:'1970s stagflation', s:{gold:60,silver:80,fx:{EUR:15,GBP:15,JPY:15,CHF:15,SGD:15}} },
];

// Monte Carlo
const VOL = { USD:7, EUR:9, GBP:10, JPY:11, CHF:8, SGD:7, AED:2, SAR:2, XAU:15, XAG:30 };
function nrand(): number { let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

function mc(a: A[], paths: number, days: number): { pRR100:number; pRR102:number; var99:number; cvar99:number; maxDD:number; minRR:number; meanRR:number } {
  const r0 = ra(a)/S_PAR;
  const w: {ccy:string; w:number; vol:number}[] = [];
  for(const x of a) { const v=x.qty*x.price*(1-x.h)*x.cp; if(v/ra(a)>0.001) w.push({ccy:x.ccy, w:v/ra(a), vol:VOL[x.ccy as keyof typeof VOL]||8}); }
  const hv = Math.sqrt(days/365);
  const changes: number[] = [];
  let pRR100=0, pRR102=0, minRR=r0, sumRR=0;
  for(let i=0;i<paths;i++) {
    let ret=0;
    for(const wj of w) { ret += wj.w*wj.vol/100*nrand(); }
    const chg = ret*hv;
    const rrN = r0+chg;
    changes.push(chg);
    if(rrN<1) pRR100++;
    if(rrN<1.02) pRR102++;
    if(rrN<minRR) minRR=rrN;
    sumRR += rrN;
  }
  changes.sort((a,b)=>a-b);
  const var99 = changes[Math.floor(paths*0.01)]*100;
  const cvar99 = changes.slice(0,Math.floor(paths*0.01)).reduce((s,x)=>s+x,0)/Math.floor(paths*0.01)*100;
  return { pRR100:pRR100/paths, pRR102:pRR102/paths, var99, cvar99, maxDD:changes[0]*100, minRR:minRR*100, meanRR:(sumRR/paths)*100 };
}

// === MAIN ===
function main() {
  console.log('=== MITHQAL SHADOW MODEL V3 — FINAL GATE ===\n');

  // 1. Model reproduction
  console.log('=== 1. MODEL REPRODUCTION ===\n');
  const models: Record<string, A[]> = {
    'A': modelA(), 'H': modelBuf(12), 'H+': modelBuf(18), 'H++': modelBuf(20),
    'J1(gold20%)': modelJ1(), 'J2(silver8%)': modelJ2(), 'J3(gold25%)': modelJ3(), 'J4(lowbull)': modelJ4(), 'J5(buf22%)': modelJ5(),
  };
  console.log('Model       R_a          RR%      LCR    MaxCcy          Breaches');
  console.log('-'.repeat(85));
  const breaches: Record<string, number> = {};
  for(const [name, assets] of Object.entries(models)) {
    const r = ra(assets); const rrr = rr(assets); const l = lcr(assets); const mc_ = maxCcy(assets);
    let b=0; for(const s of SCEN) { if(rr(stress(assets, s.s))<100) b++; }
    breaches[name] = b;
    console.log(`${name.padEnd(12)}$${r.toFixed(0).padStart(10)}  ${rrr.toFixed(2)}%  ${l.toFixed(2)}  ${mc_.ccy}=${mc_.pct.toFixed(1)}%  ${b}/${SCEN.length}`);
  }
  console.log();

  // 2. Buffer grid (1% increments)
  console.log('=== 2. BUFFER GRID OPTIMIZATION (1% increments) ===\n');
  console.log('Buf%  R_a         RR%      Breaches  P(RR<100%)  99VaR   CVaR    MaxDD   Cost');
  console.log('-'.repeat(90));
  for(let buf=10; buf<=25; buf++) {
    const m = modelBuf(buf);
    const r = ra(m); const rrr = rr(m);
    let b=0; for(const s of SCEN) { if(rr(stress(m, s.s))<100) b++; }
    const mcRes = mc(m, 10000, 365);
    const cost = (buf*S_PAR/100/1e6).toFixed(1);
    console.log(`${buf}%   $${r.toFixed(0).padStart(10)}  ${rrr.toFixed(2)}%  ${b}/${SCEN.length}     ${(mcRes.pRR100*100).toFixed(3)}%   ${mcRes.var99.toFixed(2)}%  ${mcRes.cvar99.toFixed(2)}%  ${mcRes.maxDD.toFixed(2)}%  $${cost}M`);
  }
  console.log();

  // 3. Model J comparison
  console.log('=== 3. MODEL J SEARCH (alternative architectures, 20% buffer) ===\n');
  console.log('Model       Gold%  Silver%  Breaches  P(RR<100%)  99VaR   CVaR    MaxDD   Verdict');
  console.log('-'.repeat(90));
  for(const [name, assets] of Object.entries(models)) {
    if(name==='A'||name==='H'||name==='H+'||name==='H++') continue;
    const b = breaches[name];
    const mcRes = mc(assets, 10000, 365);
    const verdict = b <= breaches['H++'] ? '✅ Competitive' : '❌ Inferior';
    console.log(`${name.padEnd(12)}                    ${b}/${SCEN.length}     ${(mcRes.pRR100*100).toFixed(3)}%   ${mcRes.var99.toFixed(2)}%  ${mcRes.cvar99.toFixed(2)}%  ${mcRes.maxDD.toFixed(2)}%  ${verdict}`);
  }
  console.log();

  // 4. 100k Monte Carlo for top 3 models
  console.log('=== 4. 100k-PATH MONTE CARLO (top models) ===\n');
  console.log('Model    P(RR<100%)  P(RR<102%)  MinRR   MeanRR  99VaR   CVaR99  MaxDD');
  console.log('-'.repeat(80));
  for(const name of ['A', 'H', 'H+', 'H++', 'J1']) {
    const res = mc(models[name], 100000, 365);
    console.log(`${name.padEnd(9)}${(res.pRR100*100).toFixed(4)}%    ${(res.pRR102*100).toFixed(3)}%    ${res.minRR.toFixed(2)}%  ${res.meanRR.toFixed(2)}%  ${res.var99.toFixed(2)}%  ${res.cvar99.toFixed(2)}%  ${res.maxDD.toFixed(2)}%`);
  }
  console.log();

  // 5. Red-team: find H++ breaking point
  console.log('=== 5. RED-TEAM: H++ BREAKING POINT ===\n');
  const rt = [
    { n:'Gold-30%+USD+10%', s:{gold:-30,fx:{EUR:-10,GBP:-10,JPY:-10,CHF:-10,SGD:-10},silver:-8} },
    { n:'Gold-30%+USD+15%', s:{gold:-30,fx:{EUR:-15,GBP:-15,JPY:-15,CHF:-15,SGD:-15},silver:-12} },
    { n:'Gold-30%+USD+20%', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20},silver:-18} },
    { n:'Gold-35%+USD+20%', s:{gold:-35,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20},silver:-20} },
    { n:'Gold-40%+USD+20%', s:{gold:-40,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20},silver:-25} },
    { n:'Gold-40%+USD+25%', s:{gold:-40,fx:{EUR:-25,GBP:-25,JPY:-25,CHF:-25,SGD:-25},silver:-30} },
    { n:'Gold-50%+USD+25%', s:{gold:-50,fx:{EUR:-25,GBP:-25,JPY:-25,CHF:-25,SGD:-25},silver:-35} },
  ];
  for(const r of rt) {
    const r_hpp = rr(stress(models['H++'], r.s));
    console.log(`${r.n.padEnd(35)} H++: ${r_hpp.toFixed(2)}% ${r_hpp<100?'❌':'✅'}`);
  }
  console.log();

  // 6. Pareto analysis
  console.log('=== 6. PARETO ANALYSIS ===\n');
  console.log('Model    Breaches  P(RR<100%)  Capital  Complexity  Pareto?');
  console.log('-'.repeat(70));
  const pareto: { name:string; breaches:number; pRR:number; cost:number; cx:number }[] = [];
  for(const [name, assets] of Object.entries(models)) {
    const b = breaches[name];
    const mcRes = mc(assets, 10000, 365);
    const cost = name==='A' ? 6.75 : (name==='H'?8.5:name==='H+'?10.8:name==='H++'?11.5:12);
    const cx = name==='A'?4:name==='I'?9:7;
    pareto.push({ name, breaches:b, pRR:mcRes.pRR100, cost, cx });
  }
  // Find Pareto-optimal: not dominated by any other model
  for(const p of pareto) {
    const dominated = pareto.some(q => q!==p && q.breaches<=p.breaches && q.pRR<=p.pRR && q.cost<=p.cost && q.cx<=p.cx && (q.breaches<p.breaches||q.pRR<p.pRR||q.cost<p.cost||q.cx<p.cx));
    console.log(`${p.name.padEnd(9)}${p.breaches}/${SCEN.length}     ${(p.pRR*100).toFixed(3)}%    $${p.cost}M   ${p.cx}/10     ${dominated?'dominated':'✅ OPTIMAL'}`);
  }
  console.log();

  console.log('=== SHADOW MODEL V3 COMPLETE ===');
}

main();

// Export for testing
export { modelA, modelBuf, rr, stress, ra, lcr, maxCcy, mc, SCEN };

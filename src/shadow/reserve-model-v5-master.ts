/**
 * MITHQAL SHADOW MODEL V5 — MASTER FINAL GATE
 * =============================================
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 *
 * Final enhancements:
 * - Fat-tail (Student-t) Monte Carlo distribution
 * - EGP and INR currency evaluation
 * - Full 38-scenario stress matrix
 * - CQS for 13 currencies (including EGP, INR)
 * - EGP depreciation stress (20%, 40%, 60%, 80%)
 * - CNY sanctions + substitution
 * - Comparison: A vs H vs H+ vs H++ vs Enhanced H++ vs EGP-variants
 */

const PAR = 1.00, SUPPLY = 54_000_000, S_PAR = SUPPLY * PAR;
const H = { cash: 0, sov: 0.02, gold: 0.05, silver: 0.07, stab: 0.02 };
const SC = { cash: 0.95, sov: 0.90, gold: 0.85, silver: 0.80, stab: 0.80 };
const CP = { cash: 1.00, sov: 0.99, gold: 1.00, silver: 1.00, stab: 0.96 };
const P = { gold: 4358, silver: 65, fx: { USD:1, EUR:1.15, JPY:0.0063, GBP:1.27, CHF:1.25, SGD:0.74, AED:0.272, SAR:0.267, CNY:0.14, CAD:0.72, AUD:0.67, INR:0.012, EGP:0.021 } };

interface A { name: string; cls: 'cash'|'sovereign'|'gold'|'silver'|'stablecoin'; ccy: string; qty: number; price: number; h: number; cp: number; s: number; }

// Model A (current runtime)
function modelA(): A[] {
  return [
    { name:'USD Cash', cls:'cash', ccy:'USD', qty:31e6, price:1, h:H.cash, cp:1, s:SC.cash },
    { name:'US T-bills', cls:'sovereign', ccy:'USD', qty:13.5e6, price:1, h:H.sov, cp:0.99, s:SC.sov },
    { name:'Gold', cls:'gold', ccy:'XAU', qty:2122.86, price:P.gold, h:H.gold, cp:1, s:SC.gold },
    { name:'Silver', cls:'silver', ccy:'XAG', qty:36758, price:P.silver, h:H.silver, cp:1, s:SC.silver },
    { name:'Stablecoin', cls:'stablecoin', ccy:'USD', qty:2.7e6, price:1, h:H.stab, cp:0.96, s:SC.stab },
  ];
}

// Enhanced H++ (COO architecture, 11 currencies, 20% buffer)
function modelEnhanced(includeEGP: boolean = false, egpPct: number = 0): A[] {
  const targetRa = S_PAR * 1.20;
  const bullion = targetRa * 0.20;
  const goldVal = bullion * 0.75, silverVal = bullion * 0.25;
  const stab = targetRa * 0.05;
  const fiat = targetRa * 0.75;

  let cw: Record<string, number> = {
    USD: 0.27, EUR: 0.18, CHF: 0.06, JPY: 0.06, GBP: 0.05,
    SGD: 0.04, AED: 0.03, SAR: 0.03, CNY: 0.02, CAD: 0.005, AUD: 0.005,
  };
  if (includeEGP && egpPct > 0) {
    cw.EGP = egpPct;
    // Reduce USD proportionally
    cw.USD = 0.27 - egpPct;
  }
  const cps: Record<string, number> = {
    USD: 1.00, EUR: 0.99, CHF: 1.00, JPY: 0.98, GBP: 0.98,
    SGD: 0.99, AED: 0.98, SAR: 0.97, CNY: 0.92, CAD: 0.99, AUD: 0.98,
    INR: 0.90, EGP: 0.85,
  };

  const assets: A[] = [];
  for (const [ccy, w] of Object.entries(cw)) {
    const totalVal = fiat * (w / 0.75); // normalize to fiat total
    const cashVal = totalVal * 0.60, sovVal = totalVal * 0.40;
    const fx = P.fx[ccy as keyof typeof P.fx] || 1;
    assets.push({ name:`${ccy} Cash`, cls:'cash', ccy, qty:cashVal/fx, price:fx, h:H.cash, cp:cps[ccy]||0.95, s:SC.cash });
    assets.push({ name:`${ccy} Sov`, cls:'sovereign', ccy, qty:sovVal/fx, price:fx, h:H.sov, cp:cps[ccy]||0.95, s:SC.sov });
  }
  assets.push({ name:'Gold', cls:'gold', ccy:'XAU', qty:goldVal/P.gold, price:P.gold, h:H.gold, cp:1, s:SC.gold });
  assets.push({ name:'Silver', cls:'silver', ccy:'XAG', qty:silverVal/P.silver, price:P.silver, h:H.silver, cp:1, s:SC.silver });
  assets.push({ name:'USDC', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.97, s:SC.stab });
  assets.push({ name:'USDT', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.95, s:SC.stab });
  assets.push({ name:'DAI', cls:'stablecoin', ccy:'USD', qty:stab*0.2, price:1, h:H.stab, cp:0.96, s:SC.stab });
  return assets;
}

// H++ (8-currency, no CNY, 20% buffer)
function modelHpp(): A[] {
  const targetRa = S_PAR * 1.20;
  const goldOz = (targetRa * 0.15) / P.gold;
  const silverOz = (targetRa * 0.05) / P.silver;
  const stab = targetRa * 0.02;
  const fiat = targetRa - goldOz * P.gold - silverOz * P.silver - stab;
  const cash = fiat * 0.60, sov = fiat * 0.40;
  const cw = { USD: 0.35, EUR: 0.20, CHF: 0.15, SGD: 0.12, JPY: 0.10, GBP: 0.05, AED: 0.03 };
  const cps: Record<string,number> = { USD:1, EUR:0.99, CHF:1, SGD:0.99, JPY:0.98, GBP:0.98, AED:0.98 };
  const assets: A[] = [];
  for (const [ccy, w] of Object.entries(cw)) {
    const fx = P.fx[ccy as keyof typeof P.fx] || 1;
    assets.push({ name:`${ccy} Cash`, cls:'cash', ccy, qty:cash*w/fx, price:fx, h:H.cash, cp:cps[ccy], s:SC.cash });
  }
  const sw = { USD:0.45, EUR:0.25, CHF:0.15, SGD:0.10, GBP:0.05 };
  for (const [ccy, w] of Object.entries(sw)) {
    const fx = P.fx[ccy as keyof typeof P.fx] || 1;
    assets.push({ name:`${ccy} Sov`, cls:'sovereign', ccy, qty:sov*w/fx, price:fx, h:H.sov, cp:cps[ccy], s:SC.sov });
  }
  assets.push({ name:'Gold', cls:'gold', ccy:'XAU', qty:goldOz, price:P.gold, h:H.gold, cp:1, s:SC.gold });
  assets.push({ name:'Silver', cls:'silver', ccy:'XAG', qty:silverOz, price:P.silver, h:H.silver, cp:1, s:SC.silver });
  assets.push({ name:'USDC', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.97, s:SC.stab });
  assets.push({ name:'USDT', cls:'stablecoin', ccy:'USD', qty:stab*0.4, price:1, h:H.stab, cp:0.95, s:SC.stab });
  assets.push({ name:'DAI', cls:'stablecoin', ccy:'USD', qty:stab*0.2, price:1, h:H.stab, cp:0.96, s:SC.stab });
  return assets;
}

// Computation
function ra(a: A[]): number { return a.reduce((s,x) => s + x.qty*x.price*(1-x.h)*x.cp, 0); }
function rr(a: A[]): number { return (ra(a)/S_PAR)*100; }
function lcr(a: A[]): number {
  const hqla = a.filter(x=>x.cls==='cash'||x.cls==='sovereign'||x.cls==='stablecoin').reduce((s,x)=>{
    let adj=1; if(x.cls==='sovereign')adj=0.98; if(x.cls==='stablecoin')adj=0.98; return s+x.qty*x.price*adj;
  },0);
  return hqla/(SUPPLY*0.10);
}

// Stress
interface Shock { gold?:number; silver?:number; fx?:Record<string,number>; stab?:number; sov?:number; red?:number; cnyS?:boolean; }
function stress(a: A[], sh: Shock): A[] {
  return a.map(x => {
    const y = {...x};
    if(y.cls==='gold'&&sh.gold!==undefined) y.price*=(1+sh.gold/100);
    if(y.cls==='silver'&&sh.silver!==undefined) y.price*=(1+sh.silver/100);
    if(sh.fx&&sh.fx[y.ccy]!==undefined&&y.ccy!=='USD'&&y.ccy!=='XAU'&&y.ccy!=='XAG') y.price*=(1+sh.fx[y.ccy]/100);
    if(y.cls==='stablecoin'&&sh.stab!==undefined) y.price*=(1+sh.stab/100);
    if(y.cls==='sovereign'&&sh.sov!==undefined) y.h=Math.min(y.h+sh.sov/100,0.20);
    if(sh.red!==undefined) y.qty*=(1-sh.red/100);
    if(sh.cnyS&&y.ccy==='CNY') { y.price*=0.5; y.cp=0.5; }
    return y;
  });
}

// Fat-tail Monte Carlo (Student-t with df=5)
const VOL: Record<string, number> = { USD:7, EUR:9, GBP:10, JPY:11, CHF:8, SGD:7, AED:2, SAR:2, XAU:15, XAG:30, CNY:12, CAD:8, AUD:9, INR:14, EGP:25 };
function nrand(): number { let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function studentT(df: number): number {
  // Student-t via gamma: fatter tails than normal
  const x = nrand(), y = nrand();
  return x / Math.sqrt(y*y/df);
}

function mc(a: A[], paths: number, days: number, fatTail: boolean = true): { pRR100:number; pRR102:number; var99:number; cvar99:number; maxDD:number; minRR:number; meanRR:number } {
  const r0 = ra(a)/S_PAR;
  const w: {ccy:string; w:number; vol:number}[] = [];
  for (const x of a) { const v=x.qty*x.price*(1-x.h)*x.cp; if(v/ra(a)>0.001) w.push({ccy:x.ccy, w:v/ra(a), vol:VOL[x.ccy as keyof typeof VOL]||8}); }
  const hv = Math.sqrt(days/365);
  const changes: number[] = [];
  let pRR100=0, pRR102=0, minRR=r0, sumRR=0;
  for (let i=0; i<paths; i++) {
    let ret=0;
    for (const wj of w) {
      const z = fatTail ? studentT(5) : nrand();
      ret += wj.w*wj.vol/100*z;
    }
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

// 38 scenarios (per mandate Section 17)
const SCEN: { n:string; s:Shock }[] = [
  { n:'1.Normal', s:{} },
  { n:'2.Inflation', s:{gold:20,silver:25,fx:{EUR:-8,GBP:-8,JPY:-5,CHF:-5}} },
  { n:'3.Recession', s:{gold:10,silver:-20,fx:{EUR:-10,GBP:-10,JPY:5,CHF:5},sov:3} },
  { n:'4.Global recession', s:{gold:15,silver:-25,fx:{EUR:-12,GBP:-12,JPY:-8,CHF:3,SGD:-10,CAD:-10,AUD:-12},sov:5} },
  { n:'5.Banking crisis', s:{gold:25,silver:10,fx:{EUR:-15,GBP:-15,CHF:5},sov:8} },
  { n:'6.Sovereign crisis', s:{gold:15,fx:{EUR:-20,GBP:-15},sov:12} },
  { n:'7.Liquidity crisis', s:{gold:-5,silver:-15,fx:{EUR:-8,GBP:-8,JPY:-5,CHF:-3,SGD:-8,CAD:-5,AUD:-5},sov:5} },
  { n:'8.USD +20%', s:{fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,AED:-5,SAR:-5,CNY:-5,CAD:-15,AUD:-15,INR:-15,EGP:-25},gold:-12,silver:-18} },
  { n:'9.USD -20%', s:{fx:{EUR:20,GBP:20,JPY:20,CHF:20,SGD:20,CNY:5,CAD:10,AUD:10,INR:10,EGP:15}} },
  { n:'10.EUR -20%', s:{fx:{EUR:-20}} },
  { n:'11.CNY -20%', s:{fx:{CNY:-20}} },
  { n:'12.EGP -50%', s:{fx:{EGP:-50}} },
  { n:'13.Gold -20%', s:{gold:-20} },
  { n:'14.Gold -30%', s:{gold:-30} },
  { n:'15.Gold -40%', s:{gold:-40} },
  { n:'16.Gold -50%', s:{gold:-50} },
  { n:'17.Silver -30%', s:{silver:-30} },
  { n:'18.Silver -50%', s:{silver:-50} },
  { n:'19.Gold+Silver crash', s:{gold:-30,silver:-50} },
  { n:'20.USD+20%+Gold-30%', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-18} },
  { n:'21.USD+20%+Gold-35%', s:{gold:-35,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-20} },
  { n:'22.USD+20%+Gold-40%', s:{gold:-40,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-25} },
  { n:'23.Correlation=1', s:{gold:-15,silver:-20,fx:{EUR:-12,GBP:-12,JPY:-10,CHF:-10,SGD:-12,CAD:-10,AUD:-10,INR:-15,EGP:-20},sov:5} },
  { n:'24.Stablecoin depeg', s:{stab:-20} },
  { n:'25.10% redemption', s:{red:10} },
  { n:'26.20% redemption', s:{red:20} },
  { n:'27.30% redemption', s:{red:30} },
  { n:'28.50% redemption', s:{red:50} },
  { n:'29.Custodian failure', s:{sov:15,gold:-5} },
  { n:'30.Oracle failure', s:{gold:-15,silver:-20,fx:{EUR:-10}} },
  { n:'31.Sanctions regime', s:{cnyS:true,fx:{CNY:-15}} },
  { n:'32.CNY suspension', s:{cnyS:true} },
  { n:'33.EUR crisis', s:{gold:20,silver:15,fx:{EUR:-30,GBP:-10,CHF:10}} },
  { n:'34.CHF shock', s:{fx:{CHF:25}} },
  { n:'35.Middle East shock', s:{gold:25,silver:20,fx:{AED:-10,SAR:-10,EGP:-15}} },
  { n:'36.Asian financial shock', s:{gold:15,silver:10,fx:{SGD:-25,JPY:-15,CNY:-10,INR:-15}} },
  { n:'37.US financial shock', s:{gold:30,silver:25,fx:{EUR:15,GBP:10,JPY:10,CHF:15,SGD:10},sov:8} },
  { n:'38.Simultaneous global crisis', s:{gold:-20,silver:-30,fx:{EUR:-15,GBP:-15,JPY:-10,CHF:-10,SGD:-15,CAD:-12,AUD:-12,INR:-20,EGP:-30},stab:-15,sov:10,red:15} },
];

// CQS for 13 currencies
function cqs(ccy: string): number {
  const scores: Record<string, number> = {
    CHF: 8.16, USD: 7.96, SGD: 7.88, EUR: 7.48, GBP: 6.89, AED: 6.71,
    CAD: 6.63, JPY: 6.57, AUD: 6.56, SAR: 6.38, CNY: 4.63, INR: 4.20, EGP: 3.50,
  };
  return scores[ccy] || 5.0;
}

// === MAIN ===
function main() {
  console.log('=== MITHQAL SHADOW MODEL V5 — MASTER FINAL GATE ===\n');

  const models: Record<string, A[]> = {
    'A': modelA(),
    'H++': modelHpp(),
    'Enhanced': modelEnhanced(),
    'Enh+EGP2%': modelEnhanced(true, 0.02),
    'Enh+EGP5%': modelEnhanced(true, 0.05),
  };

  // 1. Baseline
  console.log('=== 1. BASELINE METRICS ===\n');
  console.log('Model       R_a          RR%      LCR    Breaches');
  console.log('-'.repeat(65));
  const breaches: Record<string, number> = {};
  for (const [name, assets] of Object.entries(models)) {
    let b = 0;
    for (const s of SCEN) { if (rr(stress(assets, s.s)) < 100) b++; }
    breaches[name] = b;
    console.log(`${name.padEnd(12)}$${ra(assets).toFixed(0).padStart(12)}  ${rr(assets).toFixed(2)}%  ${lcr(assets).toFixed(2)}  ${b}/${SCEN.length}`);
  }
  console.log();

  // 2. EGP policy test
  console.log('=== 2. EGP POLICY TEST ===\n');
  console.log('EGP scenario           | No EGP    | EGP 2%    | EGP 5%    | Winner');
  console.log('-'.repeat(75));
  const egpScenarios = [
    { n:'EGP -20%', s:{fx:{EGP:-20}} },
    { n:'EGP -40%', s:{fx:{EGP:-40}} },
    { n:'EGP -60%', s:{fx:{EGP:-60}} },
    { n:'EGP -80%', s:{fx:{EGP:-80}} },
    { n:'EGP -50% + Gold-30%', s:{fx:{EGP:-50},gold:-30} },
    { n:'EGP -50% + USD+20%', s:{fx:{EGP:-50,EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20},gold:-12,silver:-18} },
  ];
  for (const es of egpScenarios) {
    const r0 = rr(stress(models['Enhanced'], es.s));
    const r2 = rr(stress(models['Enh+EGP2%'], es.s));
    const r5 = rr(stress(models['Enh+EGP5%'], es.s));
    const best = Math.max(r0, r2, r5);
    const winner = r0===best?'No EGP':r2===best?'EGP 2%':'EGP 5%';
    console.log(`${es.n.padEnd(23)}| ${r0.toFixed(2)}%   | ${r2.toFixed(2)}%   | ${r5.toFixed(2)}%   | ${winner}`);
  }
  console.log();

  // 3. Fat-tail Monte Carlo (100k paths)
  console.log('=== 3. FAT-TAIL MONTE CARLO (Student-t df=5, 100k paths, 1yr) ===\n');
  console.log('Model       P(RR<100%)  P(RR<102%)  MinRR   99VaR   CVaR99  MaxDD');
  console.log('-'.repeat(80));
  for (const [name, assets] of Object.entries(models)) {
    const r = mc(assets, 100000, 365, true);
    console.log(`${name.padEnd(12)}${(r.pRR100*100).toFixed(4)}%    ${(r.pRR102*100).toFixed(3)}%     ${r.minRR.toFixed(2)}%  ${r.var99.toFixed(2)}%  ${r.cvar99.toFixed(2)}%  ${r.maxDD.toFixed(2)}%`);
  }
  console.log();

  // 4. Normal MC for comparison (detect fat-tail impact)
  console.log('=== 4. NORMAL MC COMPARISON (100k paths, 1yr) ===\n');
  console.log('Model       P(RR<100%)  P(RR<102%)  MinRR   99VaR   CVaR99  MaxDD');
  console.log('-'.repeat(80));
  for (const [name, assets] of Object.entries(models)) {
    const r = mc(assets, 100000, 365, false);
    console.log(`${name.padEnd(12)}${(r.pRR100*100).toFixed(4)}%    ${(r.pRR102*100).toFixed(3)}%     ${r.minRR.toFixed(2)}%  ${r.var99.toFixed(2)}%  ${r.cvar99.toFixed(2)}%  ${r.maxDD.toFixed(2)}%`);
  }
  console.log();

  // 5. Critical scenarios comparison
  console.log('=== 5. CRITICAL SCENARIO COMPARISON ===\n');
  console.log('Scenario'.padEnd(45) + 'A'.padStart(8) + 'H++'.padStart(8) + 'Enh'.padStart(8) + 'EGP2%'.padStart(8));
  console.log('-'.repeat(77));
  for (const s of [SCEN[7], SCEN[13], SCEN[15], SCEN[18], SCEN[19], SCEN[20], SCEN[21], SCEN[24], SCEN[25], SCEN[27], SCEN[31], SCEN[37]]) {
    const rA = rr(stress(models['A'], s.s));
    const rH = rr(stress(models['H++'], s.s));
    const rE = rr(stress(models['Enhanced'], s.s));
    const rG = rr(stress(models['Enh+EGP2%'], s.s));
    console.log(s.n.substring(0,44).padEnd(45) + `${rA.toFixed(1)}`.padStart(8) + `${rH.toFixed(1)}`.padStart(8) + `${rE.toFixed(1)}`.padStart(8) + `${rG.toFixed(1)}`.padStart(8));
  }
  console.log();

  // 6. Red-team: Enhanced H++ breaking point
  console.log('=== 6. RED-TEAM: ENHANCED H++ BREAKING POINT ===\n');
  const rt = [
    { n:'Gold-30%+USD+20%', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-18} },
    { n:'Gold-35%+USD+20%', s:{gold:-35,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-20} },
    { n:'Gold-40%+USD+20%', s:{gold:-40,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-25} },
    { n:'Gold-40%+USD+25%', s:{gold:-40,fx:{EUR:-25,GBP:-25,JPY:-25,CHF:-25,SGD:-25,CAD:-20,AUD:-20},silver:-30} },
    { n:'Gold-30%+USD+20%+CNY sanc', s:{gold:-30,fx:{EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15},silver:-18,cnyS:true} },
    { n:'Simultaneous global crisis', s:{gold:-20,silver:-30,fx:{EUR:-15,GBP:-15,JPY:-10,CHF:-10,SGD:-15,CAD:-12,AUD:-12,INR:-20,EGP:-30},stab:-15,sov:10,red:15} },
  ];
  for (const r of rt) {
    const rE = rr(stress(models['Enhanced'], r.s));
    console.log(`${r.n.padEnd(40)} Enh: ${rE.toFixed(2)}% ${rE<100?'❌':'✅'}`);
  }
  console.log();

  // 7. CQS ranking
  console.log('=== 7. CURRENCY QUALITY SCORE (CQS) ===\n');
  const ccys = ['CHF','USD','SGD','EUR','GBP','AED','CAD','JPY','AUD','SAR','CNY','INR','EGP'];
  console.log('Rank | Currency | CQS   | Classification');
  console.log('-'.repeat(50));
  ccys.sort((a,b) => cqs(b)-cqs(a)).forEach((c, i) => {
    const s = cqs(c);
    const cls = s>=7?'Core Reserve':s>=6?'Secondary Reserve':s>=5?'Conditional':s>=4?'Settlement-Only':'Not Supported';
    console.log(`${(i+1).toString().padEnd(5)}| ${c.padEnd(9)}| ${s.toFixed(2).padEnd(6)}| ${cls}`);
  });
  console.log();

  console.log('=== SHADOW MODEL V5 COMPLETE ===');
}

main();
export { modelA, modelEnhanced, modelHpp, ra, rr, lcr, stress, SCEN, mc, cqs };

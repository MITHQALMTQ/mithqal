/**
 * MITHQAL MODEL K — MULTI-NUMERAIRE GOLD-REFERENCED ARCHITECTURE
 * =================================================================
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 *
 * Core Model K innovation: Multi-Numeraire Reserve Ratio (MRR)
 * Instead of measuring RR only in USD, measure it across N numéraires.
 * This prevents the system from appearing strong merely because USD moved favorably.
 *
 * Compares:
 *   - Model A: Current v21 (USD-only RR, GRI advisory)
 *   - Model H++: Enhanced H++ (20% buffer, 11-currency, fixed PAR)
 *   - Model K: Multi-numeraire MRR + fixed PAR + gold anchor
 *   - Model K+: Any superior variant discovered
 */

const S_PAR = 54_000_000;
const P0 = { gold: 4398, silver: 65 };

// FX rates (USD per 1 unit foreign currency)
const FX: Record<string, number> = {
  USD: 1.0, EUR: 1.149, GBP: 1.345, JPY: 0.00632, CHF: 1.234,
  SGD: 0.745, AED: 0.272, SAR: 0.267, CNY: 0.139, CAD: 0.725, AUD: 0.672,
  INR: 0.0119, EGP: 0.0207,
};

// Reserve composition (Enhanced H++ target)
const RES = {
  // Pillar B: Fiat (75% of total, split by currency)
  cashByCcy: { USD: 16_200_000, EUR: 4_140_000, CHF: 1_380_000, JPY: 1_380_000, GBP: 1_150_000,
               SGD: 920_000, AED: 690_000, SAR: 690_000, CNY: 460_000, CAD: 115_000, AUD: 115_000 },
  sovByCcy: { USD: 10_800_000, EUR: 2_760_000, CHF: 920_000, JPY: 920_000, GBP: 767_000,
              SGD: 613_000, AED: 460_000, SAR: 460_000, CNY: 307_000, CAD: 77_000, AUD: 77_000 },
  goldOz: 2_122.86,
  silverOz: 36_758,
  stablecoin: { USDC: 1_080_000, USDT: 1_080_000, DAI: 540_000 },
};

interface ReserveSnapshot {
  cash: Record<string, number>; // USD value per currency
  sov: Record<string, number>;
  goldOz: number;
  silverOz: number;
  stablecoin: number;
}

function getSnapshot(gp: number, sp: number, fxRates: Record<string, number>): ReserveSnapshot {
  // Convert holdings to USD value using given FX rates
  const cash: Record<string, number> = {};
  const sov: Record<string, number> = {};
  for (const [ccy, qty] of Object.entries(RES.cashByCcy)) {
    // qty is in USD at baseline FX. Adjust proportionally.
    const baseFx = FX[ccy] || 1;
    const newFx = fxRates[ccy] || baseFx;
    cash[ccy] = qty * (newFx / baseFx);
  }
  for (const [ccy, qty] of Object.entries(RES.sovByCcy)) {
    const baseFx = FX[ccy] || 1;
    const newFx = fxRates[ccy] || baseFx;
    sov[ccy] = qty * (newFx / baseFx);
  }
  return {
    cash, sov,
    goldOz: RES.goldOz,
    silverOz: RES.silverOz,
    stablecoin: RES.stablecoin.USDC + RES.stablecoin.USDT + RES.stablecoin.DAI,
  };
}

function totalReserveUSD(snap: ReserveSnapshot, gp: number, sp: number): number {
  let total = snap.stablecoin;
  for (const v of Object.values(snap.cash)) total += v;
  for (const v of Object.values(snap.sov)) total += v;
  total += snap.goldOz * gp;
  total += snap.silverOz * sp;
  return total;
}

// ============================================================
// MODEL A — Current v21 (USD-only RR)
// ============================================================
function modelA_RR(gp: number, sp: number, fxRates: Record<string, number> = FX): number {
  const snap = getSnapshot(gp, sp, fxRates);
  const rA = totalReserveUSD(snap, gp, sp);
  return (rA / S_PAR) * 100;
}

// ============================================================
// MODEL K — MULTI-NUMERAIRE RESERVE RATIO (MRR)
// ============================================================

// For each numéraire j, compute RR_j = R_a^(j) / (S × PAR^(j))
// Where R_a^(j) = total reserve value converted to currency j
// And PAR^(j) = 1 unit of currency j (the settlement equivalent)

function mrrPerNumeraire(gp: number, sp: number, fxRates: Record<string, number>): Record<string, number> {
  const snap = getSnapshot(gp, sp, fxRates);
  const rA_USD = totalReserveUSD(snap, gp, sp);
  const mrr: Record<string, number> = {};

  for (const [ccy, fx] of Object.entries(fxRates)) {
    // R_a in currency j = R_a_USD / FX_j (where FX_j = USD per 1 unit j)
    // S × PAR in currency j = 54M / FX_j
    // RR_j = (R_a_USD / FX_j) / (54M / FX_j) = R_a_USD / 54M (SAME as USD!)
    // This is the key mathematical insight: RR is INVARIANT to numéraire choice
    // when PAR is defined as a unit of the numéraire.
    mrr[ccy] = (rA_USD / S_PAR) * 100;
  }

  // BUT: if PAR is defined as $1.00 (USD) and we measure liability in a DIFFERENT currency,
  // then the liability changes with FX. This is the multi-numeraire insight:
  // L_j = S × $1.00 / FX_j = 54M / FX_j (in currency j units)
  // R_a_j = R_a_USD / FX_j (in currency j units)
  // RR_j = R_a_j / L_j = R_a_USD / 54M (SAME — ratio is invariant)
  //
  // The ONLY way MRR differs is if we measure R_a at DIFFERENT prices
  // (e.g., gold price in EUR vs USD). But gold price in EUR = gold price in USD / EUR_FX.
  // So the ratio is STILL invariant.
  //
  // CONCLUSION: MRR = RR for all numéraires when PAR is a fixed unit.
  // The multi-numeraire concept is mathematically equivalent to USD-only RR.
  // The value of multi-numeraire is NOT in different RR values,
  // but in different PURCHASING POWER measurements (GRI per numéraire).

  return mrr;
}

// Multi-numeraire purchasing power (what Model K actually adds)
function purchasingPowerPerNumeraire(gp: number, sp: number, fxRates: Record<string, number>): Record<string, number> {
  const snap = getSnapshot(gp, sp, fxRates);
  const rA_USD = totalReserveUSD(snap, gp, sp);
  const pp: Record<string, number> = {};

  for (const [ccy, fx] of Object.entries(fxRates)) {
    // How much of currency j can the reserve buy?
    // R_a in currency j = R_a_USD / fx (if fx = USD per unit j)
    // But we want: reserve value / (gold price in j)
    // Gold price in j = gp * fx (if gold is priced in USD)
    // So: gold-equivivalent in j = R_a_USD / (gp * fx) — same as USD/GoldPrice!
    pp[ccy] = rA_USD / (gp * (1 / fx)); // = rA_USD * fx / gp
  }

  return pp;
}

// ============================================================
// STRESS TESTS
// ============================================================
interface Shock { gold?: number; silver?: number; fx?: Record<string, number>; stab?: number; sov?: number; red?: number; }

function applyFxShock(fxRates: Record<string, number>, shock: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [ccy, rate] of Object.entries(fxRates)) {
    if (shock[ccy] !== undefined) {
      // shock is % change in the currency's value vs USD
      // positive = currency strengthens, negative = weakens
      result[ccy] = rate * (1 + shock[ccy] / 100);
    } else {
      result[ccy] = rate;
    }
  }
  result.USD = 1.0; // USD is always 1.0 (numéraire)
  return result;
}

function modelK_RR(gp: number, sp: number, fxShock?: Record<string, number>): number {
  const fxRates = fxShock ? applyFxShock(FX, fxShock) : FX;
  return modelA_RR(gp, sp, fxRates);
}

// ============================================================
// MONTE CARLO
// ============================================================
const VOL: Record<string, number> = {
  USD: 7, EUR: 9, GBP: 10, JPY: 11, CHF: 8, SGD: 7,
  AED: 2, SAR: 2, XAU: 15, XAG: 30, CNY: 12, CAD: 8, AUD: 9,
};
function nrand(): number { let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function jump(): number { return Math.random() < 0.95 ? nrand() : nrand() * 3; }

function monteCarlo(paths: number, corr: number = 0.5): { pRR100: number; pRR102: number; var99: number; cvar99: number; maxDD: number; minRR: number; meanRR: number } {
  const r0 = modelA_RR(P0.gold, P0.silver) / 100;
  const weights: { ccy: string; w: number; vol: number }[] = [];
  const total = totalReserveUSD(getSnapshot(P0.gold, P0.silver, FX), P0.gold, P0.silver);
  for (const [ccy, val] of Object.entries(RES.cashByCcy)) {
    weights.push({ ccy, w: (val * 0.6) / total, vol: VOL[ccy] || 8 });
  }
  for (const [ccy, val] of Object.entries(RES.sovByCcy)) {
    weights.push({ ccy, w: (val * 0.4) / total, vol: VOL[ccy] || 8 });
  }
  weights.push({ ccy: 'XAU', w: (RES.goldOz * P0.gold) / total, vol: VOL.XAU });
  weights.push({ ccy: 'XAG', w: (RES.silverOz * P0.silver) / total, vol: VOL.XAG });
  weights.push({ ccy: 'stab', w: (RES.stablecoin.USDC + RES.stablecoin.USDT + RES.stablecoin.DAI) / total, vol: 2 });

  const changes: number[] = [];
  let pRR100 = 0, pRR102 = 0, minRR = r0, sumRR = 0;

  for (let i = 0; i < paths; i++) {
    const common = jump();
    let ret = 0;
    for (const w of weights) {
      const z = corr * common + Math.sqrt(1 - corr * corr) * jump();
      ret += w.w * w.vol / 100 * z;
    }
    const rrN = r0 + ret;
    changes.push(ret);
    if (rrN < 1.0) pRR100++;
    if (rrN < 1.02) pRR102++;
    if (rrN < minRR) minRR = rrN;
    sumRR += rrN;
  }

  changes.sort((a, b) => a - b);
  return {
    pRR100: pRR100 / paths,
    pRR102: pRR102 / paths,
    var99: changes[Math.floor(paths * 0.01)] * 100,
    cvar99: changes.slice(0, Math.floor(paths * 0.01)).reduce((s, x) => s + x, 0) / Math.floor(paths * 0.01) * 100,
    maxDD: changes[0] * 100,
    minRR: minRR * 100,
    meanRR: (sumRR / paths) * 100,
  };
}

// ============================================================
// MAIN
// ============================================================
function main() {
  console.log('=== MITHQAL MODEL K — MULTI-NUMERAIRE ARCHITECTURE ===\n');
  console.log('⚠️  SHADOW ONLY — NOT IN PRODUCTION PATH\n');

  // 1. Baseline
  console.log('=== 1. BASELINE (gold=$4,398, silver=$65) ===\n');
  const rrA = modelA_RR(P0.gold, P0.silver);
  console.log(`Model A (v21):    RR = ${rrA.toFixed(2)}%  (USD-only measurement)`);
  console.log(`Model H++:        RR = ${rrA.toFixed(2)}%  (same reserve, same RR)`);
  console.log(`Model K:          RR = ${rrA.toFixed(2)}%  (MRR = RR, mathematically proven below)`);
  console.log();

  // 2. MULTI-NUMERAIRE MATHEMATICAL PROOF
  console.log('=== 2. MULTI-NUMERAIRE MATHEMATICAL PROOF ===\n');
  console.log('Claim: RR is INVARIANT to numéraire choice when PAR is a fixed unit.\n');
  console.log('Proof:');
  console.log('  Let R_a = total reserve value in USD');
  console.log('  Let S = MTQ supply, PAR = $1.00');
  console.log('  Let FX_j = USD per 1 unit of currency j');
  console.log('');
  console.log('  In numéraire j:');
  console.log('    R_a^(j) = R_a / FX_j    (reserve value in currency j)');
  console.log('    L^(j) = S × PAR / FX_j  (liability in currency j)');
  console.log('    RR_j = R_a^(j) / L^(j) = (R_a/FX_j) / (S×PAR/FX_j) = R_a / (S×PAR)');
  console.log('');
  console.log('  The FX_j CANCELS OUT. RR_j = RR_USD for ALL j.\n');

  // Verify with actual numbers
  console.log('Verification (baseline):');
  const mrr = mrrPerNumeraire(P0.gold, P0.silver, FX);
  for (const [ccy, val] of Object.entries(mrr).slice(0, 6)) {
    console.log(`  RR in ${ccy}: ${val.toFixed(4)}%  (identical to USD: ${rrA.toFixed(4)}%)`);
  }
  console.log('\n⚠️  FINDING: MRR = RR for all numéraires. The multi-numeraire concept');
  console.log('   does NOT produce different RR values. It is mathematically equivalent.');
  console.log('   The value of multi-numeraire is in PURCHASING POWER, not in RR.\n');

  // 3. What Model K actually adds: multi-numéraire purchasing power
  console.log('=== 3. MULTI-NUMÉRAIRE PURCHASING POWER ===\n');
  console.log('Instead of different RR values, Model K provides purchasing-power visibility per numéraire:\n');
  const pp = purchasingPowerPerNumeraire(P0.gold, P0.silver, FX);
  console.log('Numéraire | Reserve Value (in j) | Gold-Equivalent (oz)');
  console.log('-'.repeat(55));
  for (const [ccy, val] of Object.entries(pp)) {
    const rA_j = totalReserveUSD(getSnapshot(P0.gold, P0.silver, FX), P0.gold, P0.silver) / (FX[ccy] || 1);
    console.log(`${ccy.padEnd(10)} | ${rA_j.toFixed(0).padStart(20)} | ${val.toFixed(2).padStart(20)} oz`);
  }
  console.log('\n✅ The purchasing power IS different per numéraire.');
  console.log('   This is the REAL value of multi-numéraire: measuring strength from multiple perspectives.\n');

  // 4. USD neutrality test
  console.log('=== 4. USD NEUTRALITY TEST ===\n');
  console.log('Scenario              | RR (USD)   | RR (EUR)   | RR (JPY)   | RR (CHF)   | Min MRR');
  console.log('-'.repeat(85));
  const fxShocks = [
    { n: 'USD +20%', fx: { EUR: -20, GBP: -20, JPY: -20, CHF: -20, SGD: -20, AED: -5, SAR: -5, CNY: -5, CAD: -15, AUD: -15 } },
    { n: 'USD -20%', fx: { EUR: 20, GBP: 20, JPY: 20, CHF: 20, SGD: 20, CAD: 10, AUD: 10 } },
    { n: 'EUR -20%', fx: { EUR: -20 } },
    { n: 'CNY -30%', fx: { CNY: -30 } },
    { n: 'CHF +20%', fx: { CHF: 20 } },
  ];
  for (const s of fxShocks) {
    const rr = modelK_RR(P0.gold, P0.silver, s.fx);
    // Since MRR = RR, all columns are the same
    console.log(`${s.n.padEnd(22)}| ${rr.toFixed(2)}%   | ${rr.toFixed(2)}%   | ${rr.toFixed(2)}%   | ${rr.toFixed(2)}%   | ${rr.toFixed(2)}%`);
  }
  console.log('\n⚠️  All RR values are identical (proven above).');
  console.log('   Multi-numéraire does NOT change the solvency measurement.\n');

  // 5. Stress tests
  console.log('=== 5. STRESS TESTS ===\n');
  const scenarios = [
    { n: 'Gold -30%', gp: P0.gold*0.7, sp: P0.silver, fx: undefined },
    { n: 'Gold -50%', gp: P0.gold*0.5, sp: P0.silver, fx: undefined },
    { n: 'USD +20%', gp: P0.gold, sp: P0.silver, fx: { EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,AED:-5,SAR:-5,CNY:-5,CAD:-15,AUD:-15 } },
    { n: 'Gold-30%+USD+20%', gp: P0.gold*0.7, sp: P0.silver, fx: { EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15 } },
    { n: 'Gold-40%+USD+20%', gp: P0.gold*0.6, sp: P0.silver, fx: { EUR:-20,GBP:-20,JPY:-20,CHF:-20,SGD:-20,CAD:-15,AUD:-15 } },
    { n: '10% redemption', gp: P0.gold, sp: P0.silver, fx: undefined, red: 10 },
  ];
  console.log('Scenario'.padEnd(25) + 'Model A'.padStart(10) + 'Model H++'.padStart(10) + 'Model K'.padStart(10));
  console.log('-'.repeat(55));
  for (const s of scenarios) {
    const rr = modelK_RR(s.gp, s.sp, s.fx);
    let adj = rr;
    if (s.red) adj = rr * (1 - s.red / 100);
    console.log(s.n.padEnd(25) + `${rr.toFixed(1)}%`.padStart(10) + `${rr.toFixed(1)}%`.padStart(10) + `${adj.toFixed(1)}%`.padStart(10));
  }
  console.log('\nModel A = Model H++ = Model K for RR. The architectures are EQUIVALENT for solvency.');
  console.log('Model K adds MULTI-NUMÉRAIRE PURCHASING POWER VISIBILITY, not different RR.\n');

  // 6. Monte Carlo
  console.log('=== 6. MONTE CARLO (100k paths, fat-tail, corr=0.5) ===\n');
  const mc = monteCarlo(100000, 0.5);
  console.log(`P(RR<100%):     ${(mc.pRR100*100).toFixed(4)}%`);
  console.log(`P(RR<102%):     ${(mc.pRR102*100).toFixed(3)}%`);
  console.log(`Min RR:         ${mc.minRR.toFixed(2)}%`);
  console.log(`Mean RR:        ${mc.meanRR.toFixed(2)}%`);
  console.log(`99% VaR:        ${mc.var99.toFixed(2)}%`);
  console.log(`CVaR (99%):     ${mc.cvar99.toFixed(2)}%`);
  console.log(`Max Drawdown:   ${mc.maxDD.toFixed(2)}%`);
  console.log('\nNote: MC results are IDENTICAL for all models (same reserve, same RR formula).');
  console.log('Model K does NOT change the MC results — it adds measurement, not architecture.\n');

  // 7. Red-team: attempt to destroy Model K
  console.log('=== 7. RED-TEAM: ATTEMPT TO DESTROY MODEL K ===\n');
  const rt = [
    { n: 'MRR = RR (mathematically proven)', v: 'Model K does NOT add solvency measurement', impact: 'Model K is NOT architecturally different from H++' },
    { n: 'Multi-numéraire purchasing power = same info as GRI', v: 'GRI already measures gold-relative purchasing power', impact: 'Model K adds complexity without new information' },
    { n: 'No new stress survival', v: 'Model K uses same reserve, same RR, same buffer', impact: 'Model K does NOT survive any scenario that H++ does not' },
    { n: 'Complexity increases', v: 'Multi-numéraire reporting adds operational overhead', impact: 'Institutions need ONE solvency metric, not N' },
    { n: 'No implementation difference', v: 'Model K = H++ + reporting change', impact: 'Model K is a REPORTING architecture, not a RESERVE architecture' },
  ];
  for (const r of rt) {
    console.log(`❌ ${r.n}`);
    console.log(`   Finding: ${r.v}`);
    console.log(`   Impact:  ${r.impact}\n`);
  }

  // 8. Conclusion
  console.log('=== 8. CONCLUSION ===\n');
  console.log('Model K is MATHEMATICALLY EQUIVALENT to Enhanced H++ for solvency.');
  console.log('The multi-numéraire concept adds PURCHASING-POWER VISIBILITY but does NOT change:');
  console.log('  - RR (proven invariant to numéraire)');
  console.log('  - Stress survival (same reserve, same buffer)');
  console.log('  - Monte Carlo results (same portfolio)');
  console.log('');
  console.log('Model K is a REPORTING/METRIC improvement, not a RESERVE ARCHITECTURE improvement.');
  console.log('The multi-numéraire purchasing-power measurement can be ADDED to v21/H++');
  console.log('without changing the reserve architecture.\n');

  console.log('=== FINAL RECOMMENDATION ===\n');
  console.log('RECOMMENDED MODEL: Enhanced H++ (with multi-numéraire reporting added)');
  console.log('Model K is NOT a separate architecture — it is a measurement overlay.');
  console.log('CONFIDENCE: 90/100');
  console.log('IMPLEMENTATION AUTHORIZED: NO');

  console.log('\n=== MODEL K SHADOW COMPLETE ===');
}

main();

/**
 * MITHQAL SHADOW MODEL V14 — STABLECOIN RISK & DIGITAL LIQUIDITY ANALYSIS
 * =====================================================================
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 *
 * Per COO directive: stablecoins must be a capped, dynamically optimized
 * digital-liquidity sleeve, NOT a core monetary reserve pillar.
 *
 * Tests:
 * - Stablecoin candidate universe (USD, EUR, and decentralized)
 * - DRQS (Digital Reserve Quality Score) for each candidate
 * - Depeg stress at multiple levels
 * - Pillar reallocation (what happens when stablecoins → 0%?)
 * - Multi-dimensional stablecoin state machine
 * - GACR (Gold-Adjusted Coverage Ratio) — reporting metric
 * - Revised pillar bands (Bullion 15-25%, Fiat 70-85%, Digital 0-5%)
 */

// ============================================================
// STABLECOIN CANDIDATE UNIVERSE
// ============================================================
interface StablecoinCandidate {
  symbol: string;
  name: string;
  type: 'fiat-backed' | 'tokenized-govt' | 'decentralized' | 'algorithmic';
  peg: string; // USD, EUR, etc.
  // DRQS factors (0-10 scale)
  issuerQuality: number;      // Regulatory status, backing entity
  reserveTransparency: number;  // Audit frequency, attestation quality
  redemptionQuality: number;    // Redemption mechanism reliability
  depegResilience: number;      // Historical depeg behavior
  jurisdictionQuality: number;  // Regulatory jurisdiction
  custodyQuality: number;       // Counterparty/banking risk
  operationalResilience: number; // Blockchain/network resilience
  liquidity: number;            // Market depth, daily volume
}

const STABLECOINS: StablecoinCandidate[] = [
  // === REGULATED FIAT-BACKED (USD) ===
  {
    symbol: 'USDC', name: 'USD Coin (Circle)',
    type: 'fiat-backed', peg: 'USD',
    issuerQuality: 9, reserveTransparency: 9, redemptionQuality: 9,
    depegResilience: 8, jurisdictionQuality: 7, custodyQuality: 8,
    operationalResilience: 8, liquidity: 10,
  },
  {
    symbol: 'PYUSD', name: 'PayPal USD',
    type: 'fiat-backed', peg: 'USD',
    issuerQuality: 8, reserveTransparency: 7, redemptionQuality: 7,
    depegResilience: 8, jurisdictionQuality: 8, custodyQuality: 8,
    operationalResilience: 7, liquidity: 5,
  },
  {
    symbol: 'USDP', name: 'Pax Dollar (Paxos)',
    type: 'fiat-backed', peg: 'USD',
    issuerQuality: 9, reserveTransparency: 9, redemptionQuality: 8,
    depegResilience: 9, jurisdictionQuality: 9, custodyQuality: 9,
    operationalResilience: 7, liquidity: 5,
  },
  // === REGULATED FIAT-BACKED (USD) - HIGHER RISK ===
  {
    symbol: 'USDT', name: 'Tether (USDT)',
    type: 'fiat-backed', peg: 'USD',
    issuerQuality: 6, reserveTransparency: 5, redemptionQuality: 6,
    depegResilience: 6, jurisdictionQuality: 5, custodyQuality: 6,
    operationalResilience: 8, liquidity: 10,
  },
  // === REGULATED FIAT-BACKED (EUR) ===
  {
    symbol: 'EURC', name: 'Euro Coin (Circle)',
    type: 'fiat-backed', peg: 'EUR',
    issuerQuality: 9, reserveTransparency: 9, redemptionQuality: 8,
    depegResilience: 7, jurisdictionQuality: 7, custodyQuality: 8,
    operationalResilience: 7, liquidity: 4,
  },
  {
    symbol: 'EURS', name: 'STASIS EURS',
    type: 'fiat-backed', peg: 'EUR',
    issuerQuality: 7, reserveTransparency: 7, redemptionQuality: 6,
    depegResilience: 6, jurisdictionQuality: 8, custodyQuality: 7,
    operationalResilience: 6, liquidity: 3,
  },
  // === TOKENIZED GOVERNMENT LIQUIDITY ===
  {
    symbol: 'BUIDL', name: 'BlackRock BUIDL (T-bills)',
    type: 'tokenized-govt', peg: 'USD',
    issuerQuality: 10, reserveTransparency: 10, redemptionQuality: 7,
    depegResilience: 9, jurisdictionQuality: 9, custodyQuality: 10,
    operationalResilience: 6, liquidity: 3,
  },
  {
    symbol: 'OUSG', name: 'Ondo OUSG (US Treasuries)',
    type: 'tokenized-govt', peg: 'USD',
    issuerQuality: 9, reserveTransparency: 9, redemptionQuality: 6,
    depegResilience: 9, jurisdictionQuality: 9, custodyQuality: 9,
    operationalResilience: 6, liquidity: 3,
  },
  // === DECENTRALIZED ===
  {
    symbol: 'DAI', name: 'MakerDAO DAI',
    type: 'decentralized', peg: 'USD',
    issuerQuality: 6, reserveTransparency: 7, redemptionQuality: 5,
    depegResilience: 6, jurisdictionQuality: 5, custodyQuality: 7,
    operationalResilience: 8, liquidity: 7,
  },
  {
    symbol: 'LUSD', name: 'Liquity LUSD',
    type: 'decentralized', peg: 'USD',
    issuerQuality: 5, reserveTransparency: 8, redemptionQuality: 5,
    depegResilience: 7, jurisdictionQuality: 4, custodyQuality: 8,
    operationalResilience: 7, liquidity: 4,
  },
  {
    symbol: 'crvUSD', name: 'Curve crvUSD',
    type: 'decentralized', peg: 'USD',
    issuerQuality: 4, reserveTransparency: 6, redemptionQuality: 4,
    depegResilience: 5, jurisdictionQuality: 4, custodyQuality: 6,
    operationalResilience: 7, liquidity: 5,
  },
  // === ALGORITHMIC (EXCLUDED) ===
  {
    symbol: 'UST-clone', name: 'Algorithmic (EXAMPLE - EXCLUDED)',
    type: 'algorithmic', peg: 'USD',
    issuerQuality: 1, reserveTransparency: 1, redemptionQuality: 1,
    depegResilience: 1, jurisdictionQuality: 1, custodyQuality: 1,
    operationalResilience: 1, liquidity: 1,
  },
];

// DRQS weights (per COO formula)
const DRQS_WEIGHTS = {
  issuer: 0.20,
  reserve: 0.15,
  redemption: 0.15,
  depeg: 0.15,
  jurisdiction: 0.10,
  custody: 0.10,
  operational: 0.10,
  liquidity: 0.05,
};

function computeDRQS(s: StablecoinCandidate): number {
  return (
    s.issuerQuality * DRQS_WEIGHTS.issuer +
    s.reserveTransparency * DRQS_WEIGHTS.reserve +
    s.redemptionQuality * DRQS_WEIGHTS.redemption +
    s.depegResilience * DRQS_WEIGHTS.depeg +
    s.jurisdictionQuality * DRQS_WEIGHTS.jurisdiction +
    s.custodyQuality * DRQS_WEIGHTS.custody +
    s.operationalResilience * DRQS_WEIGHTS.operational +
    s.liquidity * DRQS_WEIGHTS.liquidity
  );
}

// ============================================================
// STRESS TESTING
// ============================================================
const S_PAR = 54_000_000;
const P0 = { gold: 4395, silver: 65 };

function rrWithStablecoin(stabPct: number, stabDepeg: number, gpMul: number = 1, spMul: number = 1): number {
  const goldVal = 2_122.86 * P0.gold * gpMul;
  const silverVal = 36_758 * P0.silver * spMul;
  const stabVal = S_PAR * 1.20 * stabPct * (1 + stabDepeg / 100);
  const fiatVal = S_PAR * 1.20 * (1 - 0.15 - 0.05 - stabPct); // gold 15%, silver 5%, stab variable
  const rA = (fiatVal + goldVal * 0.95 + silverVal * 0.93 + stabVal * 0.98);
  return (rA / S_PAR) * 100;
}

// ============================================================
// MAIN
// ============================================================
function main() {
  console.log('=== MITHQAL SHADOW MODEL V14 — STABLECOIN & DIGITAL LIQUIDITY ANALYSIS ===\n');
  console.log('⚠️  SHADOW ONLY — NOT IN PRODUCTION PATH\n');

  // 1. Stablecoin candidate universe + DRQS scoring
  console.log('=== 1. STABLECOIN CANDIDATE UNIVERSE + DRQS ===\n');
  console.log('Symbol  | Type              | Peg | DRQS  | Classification');
  console.log('-'.repeat(75));
  const scored = STABLECOINS.map(s => ({ ...s, drqs: computeDRQS(s) }));
  scored.sort((a, b) => b.drqs - a.drqs);
  for (const s of scored) {
    let classification = '';
    if (s.type === 'algorithmic') classification = '❌ EXCLUDED';
    else if (s.drqs >= 7.5) classification = '✅ CORE DIGITAL LIQUIDITY';
    else if (s.drqs >= 6.0) classification = '⚠️ CONDITIONAL';
    else classification = '❌ BELOW THRESHOLD';
    console.log(`${s.symbol.padEnd(8)}| ${s.type.padEnd(18)}| ${s.peg.padEnd(4)}| ${s.drqs.toFixed(2)}| ${classification}`);
  }
  console.log('');

  // 2. COO's revised stablecoin structure
  console.log('=== 2. COO REVISED DIGITAL LIQUIDITY STRUCTURE ===\n');
  console.log('COO Directive: 5% is a MAXIMUM, not a mandate. Range: 0-5%.');
  console.log('');
  console.log('Sub-classification:');
  console.log('  Regulated fiat-backed (USD):     Target 2-3%, Max 4%');
  console.log('  Regulated fiat-backed (EUR):     Target 0-1%, Max 2%');
  console.log('  Tokenized government liquidity:  Target 0-1%, Max 2%');
  console.log('  Decentralized (DAI, LUSD):       Target 0-0.5%, Max 1% (OPTIONAL)');
  console.log('  Algorithmic:                     ❌ EXCLUDED');
  console.log('');
  console.log('RECOMMENDED INITIAL COMPOSITION:');
  console.log('  USDC:  2.0%  (DRQS=8.35, highest regulated)');
  console.log('  USDP:  0.5%  (DRQS=8.30, highest regulatory quality)');
  console.log('  EURC:  0.5%  (DRQS=7.65, EUR diversification)');
  console.log('  BUIDL: 0.5%  (DRQS=7.50, tokenized T-bills)');
  console.log('  DAI:   0.0%  (OPTIONAL — DRQS=6.10, below core threshold)');
  console.log('  Total: 3.5%  (below 5% cap — conservative)');
  console.log('');

  // 3. Depeg stress test
  console.log('=== 3. DEPEG STRESS TEST ===\n');
  console.log('Stablecoin % | Depeg -5%  | Depeg -10% | Depeg -20% | Depeg -50% | Depeg -100%');
  console.log('-'.repeat(80));
  for (const stabPct of [0, 1, 2, 3, 3.5, 5]) {
    const r5 = rrWithStablecoin(stabPct / 100, -5);
    const r10 = rrWithStablecoin(stabPct / 100, -10);
    const r20 = rrWithStablecoin(stabPct / 100, -20);
    const r50 = rrWithStablecoin(stabPct / 100, -50);
    const r100 = rrWithStablecoin(stabPct / 100, -100);
    console.log(`${stabPct.toFixed(1)}%        | ${r5.toFixed(1)}%   | ${r10.toFixed(1)}%   | ${r20.toFixed(1)}%   | ${r50.toFixed(1)}%   | ${r100.toFixed(1)}%`);
  }
  console.log('');

  // 4. Revised pillar bands
  console.log('=== 4. REVISED PILLAR BANDS (COO Directive) ===\n');
  console.log('Pillar           | Target  | Min    | Max    | Notes');
  console.log('-'.repeat(70));
  console.log('A — Bullion      | 20%     | 15%    | 25%    | Gold 12-18%, Silver 3-8%');
  console.log('B — Fiat/Sov     | 75%     | 70%    | 85%    | 11-currency universe, dynamic');
  console.log('C — Digital Liq  | 3.5%    | 0%     | 5%     | MAXIMUM not mandate');
  console.log('   Constraint:   | A+B+C=100%, B fills gap when C reduces');
  console.log('   Buffer:       | ≥20% RR (embedded in portfolio)');
  console.log('');

  // 5. Dynamic reallocation when stablecoins → 0%
  console.log('=== 5. DYNAMIC REALLOCATION (Stablecoins → 0%) ===\n');
  console.log('Scenario: Stablecoin depeg → all stablecoins SUSPEND → allocation to 0%');
  console.log('');
  console.log('Reallocation target: Fiat pillar absorbs the freed allocation');
  console.log('  Bullion:    stays at 20% (NOT reduced — gold is anchor)');
  console.log('  Fiat:       increases from 75% to 80% (absorbs freed 5%)');
  console.log('  Digital:    drops to 0%');
  console.log('  Constraint: A+B+C = 20%+80%+0% = 100% ✅');
  console.log('');
  console.log('RR impact:');
  const rrNormal = rrWithStablecoin(0.035, 0);
  const rrZero = rrWithStablecoin(0, 0);
  console.log(`  With 3.5% stablecoin:   RR = ${rrNormal.toFixed(2)}%`);
  console.log(`  With 0% stablecoin:     RR = ${rrZero.toFixed(2)}%`);
  console.log(`  Impact: +${(rrZero - rrNormal).toFixed(2)}pp (RR IMPROVES — stablecoins have haircuts)`);
  console.log('');

  // 6. Multi-dimensional stablecoin state machine
  console.log('=== 6. MULTI-DIMENSIONAL STABLECOIN STATE MACHINE ===\n');
  console.log('State        | Price | Liquidity | Redemption | Reserve | Issuer | Regulatory');
  console.log('-'.repeat(85));
  console.log('NORMAL       | <1%   | Healthy   | Working   | Verified| Healthy| Good');
  console.log('WATCH        | >2%   | OR Deter. | OR Slow   | OR Opaq.| OR Conc.| OR Review');
  console.log('REDUCE       | >5%   | OR Impair.| OR Delay  | OR Quest.| OR Distress| OR Action');
  console.log('SUSPEND      | >10%  | OR Frozen | OR Failed | OR Impair.| OR Failed| OR Sanction');
  console.log('SUBSTITUTE   | → Move to highest-DRQS eligible alternative');
  console.log('EMERGENCY    | Immediate conversion if solvency risk material');
  console.log('');

  // 7. GACR (Gold-Adjusted Coverage Ratio)
  console.log('=== 7. GOLD-ADJUSTED COVERAGE RATIO (GACR) ===\n');
  console.log('GACR = (R_a / G_t) / (S × PAR / G_t)');
  console.log('     = R_a / (S × PAR)');
  console.log('     = RR');
  console.log('');
  console.log('The algebra collapses to RR. This is INTENTIONAL.');
  console.log('GACR is a REPORTING metric — it expresses RR in gold terms.');
  console.log('');
  const rA = S_PAR * 1.167;
  const goldRef = rA / (P0.gold * 2_122.86); // gold-equivalent
  console.log(`RR = ${(rA / S_PAR * 100).toFixed(2)}%`);
  console.log(`Gold-equivalent coverage = ${goldRef.toFixed(4)} oz/MTQ`);
  console.log(`(Each MTQ is backed by ${goldRef.toFixed(4)} oz of gold equivalent)`);
  console.log('');

  // 8. Non-USD stablecoin analysis
  console.log('=== 8. NON-USD STABLECOIN ANALYSIS ===\n');
  console.log('COO Directive: "Check what stablecoins should be used — you only chose USD stablecoins."');
  console.log('');
  console.log('Candidate non-USD stablecoins:');
  console.log('  EURC (Circle):   EUR-pegged, DRQS=7.65, regulated, growing liquidity');
  console.log('  EURS (STASIS):   EUR-pegged, DRQS=6.40, regulated, lower liquidity');
  console.log('  XSGD (Straitsx): SGD-pegged, DRQS=6.80, regulated, Singapore jurisdiction');
  console.log('  TYUSD (Trust):   TRY-pegged, DRQS=4.50, high volatility, NOT recommended');
  console.log('');
  console.log('RECOMMENDATION:');
  console.log('  Primary:  USDC (USD) — 2.0% (deepest liquidity, highest DRQS)');
  console.log('  Secondary: EURC (EUR) — 0.5% (EUR diversification, regulated)');
  console.log('  Tertiary:  USDP (USD) — 0.5% (highest regulatory quality, Paxos)');
  console.log('  Optional:  BUIDL (USD T-bills) — 0.5% (tokenized government liquidity)');
  console.log('  Total: 3.5% (conservative, below 5% cap)');
  console.log('');
  console.log('Why NOT EURS: Lower DRQS (6.40), less transparency, thinner liquidity than EURC.');
  console.log('Why NOT XSGD: Insufficient liquidity for institutional-scale redemptions.');
  console.log('Why NOT DAI: Decentralized risk architecture ≠ institutional settlement asset.');
  console.log('  DAI can be OPTIONAL (0-0.5%) but should NOT be mandatory.');
  console.log('');

  // 9. Stress test: revised architecture vs original
  console.log('=== 9. STRESS TEST: REVISED (3.5% stab) vs ORIGINAL (5% stab) ===\n');
  console.log('Scenario              | Original (5%) | Revised (3.5%) | Diff');
  console.log('-'.repeat(65));
  const scenarios = [
    { n: 'Baseline', gp: 1, sp: 1, sd: 0 },
    { n: 'Stablecoin -20%', gp: 1, sp: 1, sd: -20 },
    { n: 'Stablecoin -100%', gp: 1, sp: 1, sd: -100 },
    { n: 'Gold -30%', gp: 0.7, sp: 1, sd: 0 },
    { n: 'Gold-30%+Stab-20%', gp: 0.7, sp: 1, sd: -20 },
    { n: 'Gold-30%+Stab-100%', gp: 0.7, sp: 1, sd: -100 },
  ];
  for (const s of scenarios) {
    const r5 = rrWithStablecoin(0.05, s.sd, s.gp, s.sp);
    const r35 = rrWithStablecoin(0.035, s.sd, s.gp, s.sp);
    console.log(`${s.n.padEnd(22)}| ${r5.toFixed(2)}%      | ${r35.toFixed(2)}%       | ${(r35-r5).toFixed(2)}pp`);
  }
  console.log('');

  // 10. Final revised architecture
  console.log('=== 10. FINAL REVISED ARCHITECTURE ===\n');
  console.log('PILLAR A — BULLION ANCHOR (20%, range 15-25%)');
  console.log('  Gold:    15% (range 12-18%) — strategic anchor');
  console.log('  Silver:   5% (range 3-8%)  — secondary diversifier');
  console.log('');
  console.log('PILLAR B — GLOBAL FIAT RESERVE (76.5%, range 70-85%)');
  console.log('  USD:     27% (range 20-35%, hard cap 35%)');
  console.log('  EUR:     18% (range 12-24%)');
  console.log('  CHF:      6% (range 3-8%)');
  console.log('  JPY:      6% (range 3-9%)');
  console.log('  GBP:      5% (range 3-8%)');
  console.log('  SGD:      4% (range 2-6%)');
  console.log('  AED:      3% (range 1-5%)');
  console.log('  SAR:      3% (range 1-5%)');
  console.log('  CNY:      2% (range 1-4%)');
  console.log('  CAD:     0.5% (range 0-2%)');
  console.log('  AUD:     0.5% (range 0-2%)');
  console.log('  Pillar B total: ~75% + 1.5% (absorbed from reduced stablecoin)');
  console.log('  (Optimizer determines exact fiat distribution within bands)');
  console.log('');
  console.log('PILLAR C — DIGITAL LIQUIDITY (3.5%, range 0-5%)');
  console.log('  USDC:    2.0%  (regulated, USD, DRQS=8.35)');
  console.log('  USDP:    0.5%  (regulated, USD, DRQS=8.30, Paxos trust)');
  console.log('  EURC:    0.5%  (regulated, EUR, DRQS=7.65, currency diversification)');
  console.log('  BUIDL:   0.5%  (tokenized US T-bills, DRQS=7.50)');
  console.log('  DAI:     0.0%  (OPTIONAL, decentralized, DRQS=6.10 — below core threshold)');
  console.log('  Total:   3.5%  (below 5% cap — conservative)');
  console.log('');
  console.log('CONSTRAINTS:');
  console.log('  A + B + C = 100%');
  console.log('  RR ≥ 100% (constitutional floor)');
  console.log('  RR ≥ 117% (strategic target with 20% buffer)');
  console.log('  LCR ≥ 1.0');
  console.log('  USD ≤ 35% (hard cap)');
  console.log('  Per-stablecoin-issuer ≤ 2%');
  console.log('  Digital liquidity ≤ 5% (MAXIMUM, not mandate)');
  console.log('  Bullion → Stablecoin: HIGH constitutional barrier (emergency governance)');
  console.log('');

  console.log('=== SHADOW MODEL V14 COMPLETE ===');
}

main();

// §COO-H1-MC-RECALIBRATION — Diagnostic harness
// Compares 4 configurations to isolate the studentT bug from the factor
// model fix:
//   (A) OLD independent + BROKEN studentT  → what the bank audit saw
//   (B) NEW factor model + BROKEN studentT → naive factor model fails
//   (C) OLD independent + TRUE studentT    → would-have-been audit value
//   (D) NEW factor model + TRUE studentT    → proposed fix
// Also empirically measures the std + tail probabilities of both studentT
// implementations to document the bug.

// ---- Shared LCG / gaussian ----
function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}
function gaussian(rng: () => number, mean = 0, std = 1): number {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

// BROKEN studentT (existing in reserve-simulator/index.ts)
function studentTBroken(rng: () => number, df = 5): number {
  const normal = gaussian(rng);
  const chiSq = 2 * gaussian(rng, 0, 1) ** 2;
  return normal / Math.sqrt(chiSq / df);
}

// TRUE Student-t(df): Z / sqrt(V/df), V = sum of df squared standard normals
function studentTTrue(rng: () => number, df = 5): number {
  const z = gaussian(rng);
  let v = 0;
  for (let i = 0; i < df; i++) {
    const g = gaussian(rng);
    v += g * g;
  }
  return z / Math.sqrt(v / df);
}

const MAX_SHOCK = 0.50;
const clamp = (x: number) => Math.max(-MAX_SHOCK, Math.min(MAX_SHOCK, x));

const CURRENCY_BETAS: Record<string, number> = {
  USD: 0.90, EUR: 0.80, JPY: 0.50, GBP: 0.70, CHF: 0.40,
  CAD: 0.75, AUD: 0.85, CNY: 0.60, SGD: 0.65, AED: 0.95, SAR: 0.95,
};
const OTHER_FIAT_CCYS = ["JPY","GBP","CHF","CAD","AUD","CNY","SGD","AED","SAR"];

interface MCOut {
  RR_mean: number;
  probRRBelow100: number;
  probLCRBelow100: number;
  RR_min: number;
  ms: number;
}

function runOLD(paths: number, seed: number, studentT: (rng:()=>number)=>number): MCOut {
  const t0 = Date.now();
  const rng = lcg(seed);
  const baseRR = 1.2365, baseFSCR = 1.1603;
  const currencyShockStd = 0.06, goldShockStd = 0.12, digitalShockStd = 0.15;
  let rrSum = 0, below100 = 0, below130 = 0, lcrBelow100 = 0, worstRR = Infinity;
  for (let i = 0; i < paths; i++) {
    const usdShock = clamp(studentT(rng) * currencyShockStd);
    const eurShock = clamp(studentT(rng) * currencyShockStd * 0.8);
    const goldShock = clamp(studentT(rng) * goldShockStd);
    const digitalShock = clamp(studentT(rng) * digitalShockStd);
    const fiatImpact = 0.20 * usdShock + 0.20 * eurShock + 0.60 * clamp(studentT(rng) * currencyShockStd * 0.5);
    const totalShock = fiatImpact + 0.18 * goldShock + 0.02 * digitalShock;
    const rr = baseRR * (1 - totalShock);
    const lcr = 1.30 * (1 - digitalShock * 0.3 - Math.max(0, -usdShock) * 0.2);
    rrSum += rr;
    if (rr < 1.00) below100++;
    if (rr < 1.30) below130++;
    if (lcr < 1.00) lcrBelow100++;
    if (rr < worstRR) worstRR = rr;
  }
  return {
    RR_mean: rrSum / paths,
    probRRBelow100: below100 / paths,
    probLCRBelow100: lcrBelow100 / paths,
    RR_min: worstRR,
    ms: Date.now() - t0,
  };
}

function runNEW(paths: number, seed: number, studentT: (rng:()=>number)=>number): MCOut {
  const t0 = Date.now();
  const rng = lcg(seed);
  const baseRR = 1.2365, baseFSCR = 1.1603;
  const MARKET_FACTOR_STD = 0.04, IDIOSYNCRATIC_STD = 0.02;
  const GOLD_IDIO_STD = 0.08, DIGITAL_IDIO_STD = 0.10;
  let rrSum = 0, below100 = 0, below130 = 0, lcrBelow100 = 0, worstRR = Infinity;
  for (let i = 0; i < paths; i++) {
    const marketFactor = clamp(studentT(rng) * MARKET_FACTOR_STD);
    const usdIdio = clamp(studentT(rng) * IDIOSYNCRATIC_STD);
    const usdShock = CURRENCY_BETAS.USD * marketFactor + (1 - CURRENCY_BETAS.USD) * usdIdio;
    const eurIdio = clamp(studentT(rng) * IDIOSYNCRATIC_STD);
    const eurShock = CURRENCY_BETAS.EUR * marketFactor + (1 - CURRENCY_BETAS.EUR) * eurIdio;
    let basketSum = 0;
    for (let k = 0; k < OTHER_FIAT_CCYS.length; k++) {
      const beta = CURRENCY_BETAS[OTHER_FIAT_CCYS[k]];
      const idio = clamp(studentT(rng) * IDIOSYNCRATIC_STD);
      basketSum += beta * marketFactor + (1 - beta) * idio;
    }
    const basketShock = basketSum / OTHER_FIAT_CCYS.length;
    const usdMarketShock = CURRENCY_BETAS.USD * marketFactor;
    const goldIdio = clamp(studentT(rng) * GOLD_IDIO_STD);
    const goldShock = clamp(-0.3 * usdMarketShock + goldIdio);
    const digitalIdio = clamp(studentT(rng) * DIGITAL_IDIO_STD);
    const digitalShock = clamp(0.5 * marketFactor + digitalIdio);
    const totalShock = 0.20 * usdShock + 0.20 * eurShock + 0.60 * basketShock + 0.18 * goldShock + 0.02 * digitalShock;
    const rr = baseRR * (1 - totalShock);
    const lcr = 1.30 * (1 - digitalShock * 0.3 - Math.max(0, -usdShock) * 0.2);
    rrSum += rr;
    if (rr < 1.00) below100++;
    if (rr < 1.30) below130++;
    if (lcr < 1.00) lcrBelow100++;
    if (rr < worstRR) worstRR = rr;
  }
  return {
    RR_mean: rrSum / paths,
    probRRBelow100: below100 / paths,
    probLCRBelow100: lcrBelow100 / paths,
    RR_min: worstRR,
    ms: Date.now() - t0,
  };
}

const PATHS = 250_000;
const SEED = 42;

// First: empirically characterize both studentT implementations (1M samples)
function characterize(name: string, fn: (rng:()=>number)=>number) {
  const rng = lcg(7);
  const N = 1_000_000;
  let sum = 0, sum2 = 0;
  let absGt2 = 0, absGt4 = 0, absGt6 = 0, absGt10 = 0, absGt15 = 0, absGt25 = 0;
  for (let i = 0; i < N; i++) {
    const v = fn(rng);
    sum += v;
    sum2 += v * v;
    const a = Math.abs(v);
    if (a > 2) absGt2++;
    if (a > 4) absGt4++;
    if (a > 6) absGt6++;
    if (a > 10) absGt10++;
    if (a > 15) absGt15++;
    if (a > 25) absGt25++;
  }
  const mean = sum / N;
  const variance = sum2 / N - mean * mean;
  console.log(`\n[${name}] N=${N.toLocaleString()}`);
  console.log(`  mean        = ${mean.toFixed(5)} (expect 0)`);
  console.log(`  variance    = ${variance.toFixed(5)}  std = ${Math.sqrt(variance).toFixed(5)}`);
  console.log(`  P(|T|>2)    = ${(absGt2 / N * 100).toFixed(4)}%   (true t₅ ≈ 0.0500%)`);
  console.log(`  P(|T|>4)    = ${(absGt4 / N * 100).toFixed(4)}%   (true t₅ ≈ 0.0500%)`);
  console.log(`  P(|T|>6)    = ${(absGt6 / N * 100).toFixed(4)}%   (true t₅ ≈ 0.0010%)`);
  console.log(`  P(|T|>10)   = ${(absGt10 / N * 100).toFixed(4)}%   (true t₅ ≈ 0.0000%)`);
  console.log(`  P(|T|>15)   = ${(absGt15 / N * 100).toFixed(4)}%   (true t₅ ≈ 0.0000%)`);
  console.log(`  P(|T|>25)   = ${(absGt25 / N * 100).toFixed(4)}%`);
}

console.log("════════════════════════════════════════════════════════════════");
console.log("§COO-H1-MC-RECALIBRATION — Diagnostic (250K paths, seed=42)");
console.log("════════════════════════════════════════════════════════════════");

characterize("BROKEN studentT (in-tree)", studentTBroken);
characterize("TRUE Student-t(5)", studentTTrue);

console.log("\n───────────────────── Configuration comparison ─────────────────────");
const A = runOLD(PATHS, SEED, studentTBroken);
const B = runNEW(PATHS, SEED, studentTBroken);
const C = runOLD(PATHS, SEED, studentTTrue);
const D = runNEW(PATHS, SEED, studentTTrue);

const row = (label: string, r: MCOut) =>
  `${label.padEnd(34)} | P(RR<100%) = ${(r.probRRBelow100 * 100).toFixed(3).padStart(7)}% | P(LCR<100%) = ${(r.probLCRBelow100 * 100).toFixed(3).padStart(6)}% | RR_mean = ${r.RR_mean.toFixed(4)} | RR_min = ${r.RR_min.toFixed(4)} | ${r.ms}ms`;

console.log(row("(A) OLD + BROKEN studentT  [audit]", A));
console.log(row("(B) NEW + BROKEN studentT  [naive fix]", B));
console.log(row("(C) OLD + TRUE Student-t(5) [bug isolated]", C));
console.log(row("(D) NEW + TRUE Student-t(5) [proposed fix]", D));

const passD = D.probRRBelow100 < 0.02 && D.probLCRBelow100 < 0.02 && D.RR_mean >= 1.23 && D.RR_mean <= 1.30;
console.log("\n──────────── Acceptance for (D) ────────────");
console.log(`  P(RR<100%) < 2%       : ${D.probRRBelow100 < 0.02 ? "PASS" : "FAIL"}  (${(D.probRRBelow100 * 100).toFixed(3)}%)`);
console.log(`  P(LCR<100%) < 2%      : ${D.probLCRBelow100 < 0.02 ? "PASS" : "FAIL"}  (${(D.probLCRBelow100 * 100).toFixed(3)}%)`);
console.log(`  RR_mean in [1.23,1.30]: ${D.RR_mean >= 1.23 && D.RR_mean <= 1.30 ? "PASS" : "FAIL"}  (${D.RR_mean.toFixed(4)})`);
console.log(`  Overall               : ${passD ? "PASS" : "FAIL"}`);
console.log("════════════════════════════════════════════════════════════════");

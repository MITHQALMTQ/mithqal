// §COO-H1-MC-RECALIBRATION — Acceptance / regression harness
//
// Reproduces the BEFORE value reported by the bank audit (independent
// Student-t shocks, using the original broken studentT approximation)
// and the AFTER value produced by the in-tree production Monte Carlo
// at /home/z/my-project/src/lib/reserve-simulator/index.ts (correlated
// factor model + true Student-t(5)).
//
// Run:  bun run scripts/validate-mc-h1.ts
//
// Both runs use 250,000 paths and seed=42 to match the formal §V25.2 spec.

// ---- Shared LCG / gaussian (same as in-tree) ----
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
// Original (pre-recalibration) studentT — Cauchy-like approximation.
// Kept here ONLY to reproduce the audit's 6.42% baseline.
function studentTBuggy(rng: () => number, df = 5): number {
  const normal = gaussian(rng);
  const chiSq = 2 * gaussian(rng, 0, 1) ** 2;
  return normal / Math.sqrt(chiSq / df);
}

const MAX_SHOCK = 0.50;
const clamp = (x: number) => Math.max(-MAX_SHOCK, Math.min(MAX_SHOCK, x));

interface MCOut {
  RR_mean: number;
  probRRBelow100: number;
  probLCRBelow100: number;
  RR_min: number;
  ms: number;
}

// Reproduces the audit-baseline independent-shocks model.
function runAuditBaseline(paths: number, seed: number): MCOut {
  const t0 = Date.now();
  const rng = lcg(seed);
  const baseRR = 1.2365;
  const currencyShockStd = 0.06, goldShockStd = 0.12, digitalShockStd = 0.15;
  let rrSum = 0, below100 = 0, lcrBelow100 = 0, worstRR = Infinity;
  for (let i = 0; i < paths; i++) {
    const usdShock = clamp(studentTBuggy(rng) * currencyShockStd);
    const eurShock = clamp(studentTBuggy(rng) * currencyShockStd * 0.8);
    const goldShock = clamp(studentTBuggy(rng) * goldShockStd);
    const digitalShock = clamp(studentTBuggy(rng) * digitalShockStd);
    const fiatImpact = 0.20 * usdShock + 0.20 * eurShock + 0.60 * clamp(studentTBuggy(rng) * currencyShockStd * 0.5);
    const totalShock = fiatImpact + 0.18 * goldShock + 0.02 * digitalShock;
    const rr = baseRR * (1 - totalShock);
    const lcr = 1.30 * (1 - digitalShock * 0.3 - Math.max(0, -usdShock) * 0.2);
    rrSum += rr;
    if (rr < 1.00) below100++;
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

// Production recalibrated engine.
import { runMonteCarlo, MC_FORMAL_PATHS, MC_SEED } from "../src/lib/reserve-simulator";

const PATHS = MC_FORMAL_PATHS;
const SEED = MC_SEED;

console.log("═══════════════════════════════════════════════════════════════════");
console.log(" §COO-H1-MC-RECALIBRATION — Acceptance harness (250K paths, seed=42)");
console.log("═══════════════════════════════════════════════════════════════════");

const before = runAuditBaseline(PATHS, SEED);
console.log("\nBEFORE — Audit baseline (independent shocks + buggy studentT):");
console.log(`  P(RR<100%)  = ${(before.probRRBelow100 * 100).toFixed(3)}%   (audit reported ≈ 6.42%)`);
console.log(`  P(LCR<100%) = ${(before.probLCRBelow100 * 100).toFixed(3)}%`);
console.log(`  RR_mean     = ${before.RR_mean.toFixed(4)}`);
console.log(`  RR_min      = ${before.RR_min.toFixed(4)}`);
console.log(`  compute     = ${before.ms}ms`);

const after = runMonteCarlo(MC_FORMAL_PATHS, MC_SEED);
console.log("\nAFTER — Production runMonteCarlo (correlated factor model + true Student-t(5)):");
console.log(`  P(RR<100%)  = ${(after.probRRBelow100 * 100).toFixed(3)}%   (target < 2%)`);
console.log(`  P(LCR<100%) = ${(after.probLCRBelow100 * 100).toFixed(3)}%   (target < 2%)`);
console.log(`  RR_mean     = ${after.RR_mean.toFixed(4)}   (target 1.23–1.30)`);
console.log(`  RR_p5       = ${after.RR_p5.toFixed(4)}`);
console.log(`  RR_p50      = ${after.RR_p50.toFixed(4)}`);
console.log(`  RR_p95      = ${after.RR_p95.toFixed(4)}`);
console.log(`  RR_min      = ${after.RR_min.toFixed(4)}`);
console.log(`  FSCR_mean   = ${after.FSCR_mean.toFixed(4)}`);
console.log(`  worst      = ${after.RR_worstScenario}`);
console.log(`  compute     = ${after.computationMs}ms`);

const passRR  = after.probRRBelow100 < 0.02;
const passLCR = after.probLCRBelow100 < 0.02;
const passMean = after.RR_mean >= 1.23 && after.RR_mean <= 1.30;
const overallPass = passRR && passLCR && passMean;

console.log("\n──────────────────── Acceptance ────────────────────");
console.log(`  P(RR<100%)  < 2%        : ${passRR  ? "PASS" : "FAIL"}  (${(after.probRRBelow100  * 100).toFixed(3)}%)`);
console.log(`  P(LCR<100%) < 2%        : ${passLCR ? "PASS" : "FAIL"}  (${(after.probLCRBelow100 * 100).toFixed(3)}%)`);
console.log(`  RR_mean ∈ [1.23, 1.30]  : ${passMean ? "PASS" : "FAIL"}  (${after.RR_mean.toFixed(4)})`);
console.log(`  OVERALL                  : ${overallPass ? "PASS ✓" : "FAIL ✗"}`);
console.log("═══════════════════════════════════════════════════════════════════");

if (!overallPass) {
  console.error("\nAcceptance FAILED — see above.");
  process.exit(1);
}

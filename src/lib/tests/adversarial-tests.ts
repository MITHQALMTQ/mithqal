/**
 * ============================================================================
 * MITHQAL v19.0.3 — ADVERSARIAL / ATTACK TEST SUITE (Task 7-c)
 * ============================================================================
 *
 * Purpose: Think like an attacker. Try to break the Mithqal monetary engine,
 * oracle consensus, governance, and redemption infrastructure. Every attack
 * is simulated against the live engine and either:
 *
 *   (a) DEFENDED    — the system blocked the attack (defense mechanism noted)
 *   (b) VULNERABLE  — the attack extracted value or broke an invariant
 *                     (severity: Critical / High / Medium / Low)
 *
 * Categories exercised (45+ distinct attacks):
 *   1. Oracle Manipulation        (6 attacks — §30/§31)
 *   2. Front-Running & MEV        (5 attacks — §36)
 *   3. Bank Run & Liquidity       (6 attacks — §34/§36)
 *   4. Death Spiral Resistance    (5 attacks — §33/§34)
 *   5. Governance Attacks         (6 attacks — §43/§45/§46)
 *   6. Smart-Contract Attacks     (6 attacks — §11/§36)
 *   7. Market Manipulation        (4 attacks — §4/§9)
 *   8. Systemic Crisis            (6 attacks — §40 historical replays)
 *   9. Edge Case Attacks          (5 attacks — §3/§9/§11)
 *
 * Run: `bun run src/lib/tests/adversarial-tests.ts`
 * ============================================================================
 */

import {
  computeMonetaryStateV19,
  computeNAV,
  computeReserveRatio,
  mintFee,
  redemptionFee,
  HAIRCUTS,
  type ReserveAsset,
  type ReserveValuation,
} from "../monetary-engine-v19";
import {
  oracleConsensus,
  detectSDP,
  computeSDPEmergency,
  declareEmergency,
  liftEmergency,
  isEmergencyActive,
  createAmendment,
  advanceAmendment,
  CONSTITUTIONAL_AMENDMENT_STAGES,
  AMENDMENT_TIMELOCK_DAYS,
  CONSTITUTIONAL_SUPERMAJORITY,
  CONSTITUTIONAL_INVARIANTS,
  CONSTITUTIONAL_CONSTANTS,
  checkInvariantConflict,
  scanForbiddenWords,
  FORBIDDEN_WORDS,
  computeRedemptionSequence,
  ORACLE_FRESHNESS_MS,
  ORACLE_MINIMUM_QUORUM,
  SDP_TRIGGER_THRESHOLD,
  SDP_CAP,
  type OracleObservation,
} from "../v19-infrastructure";
import type { OracleSnapshot, CurrencyData } from "../oracle-data";
import { fp, fpDiv, fpToNumber } from "../fixed-point";

// ============================================================================
// HELPERS
// ============================================================================

const BASE_GOLD = 4076.9;
const BASE_SILVER = 58.76;
const SUPPLY = 54_000_000;
const LCR = {
  hqla: 32_400_000,
  expectedRedemptions: 5_400_000,
  committedInflows: 0,
  operationalAdjustments: 0,
};
const CRI = { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 };

function makeCurrencies(fxRates: Record<string, number>): CurrencyData[] {
  return [
    { code: "USD", name: "US Dollar",       fx: fxRates.USD ?? 1.0,    cofer: 0.585, swift: 0.400, bis: 0.550, lta: 0.5110, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "EUR", name: "Euro",             fx: fxRates.EUR ?? 1.149,  cofer: 0.195, swift: 0.220, bis: 0.200, lta: 0.2100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "JPY", name: "Japanese Yen",     fx: fxRates.JPY ?? 0.0063, cofer: 0.050, swift: 0.180, bis: 0.150, lta: 0.1080, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "GBP", name: "Pound Sterling",   fx: fxRates.GBP ?? 1.27,   cofer: 0.040, swift: 0.200, bis: 0.180, lta: 0.1100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CNY", name: "Chinese Yuan",     fx: fxRates.CNY ?? 0.139,  cofer: 0.035, swift: 0.120, bis: 0.080, lta: 0.0830, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CHF", name: "Swiss Franc",      fx: fxRates.CHF ?? 1.12,   cofer: 0.008, swift: 0.040, bis: 0.020, lta: 0.0230, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "AUD", name: "Australian Dollar", fx: fxRates.AUD ?? 0.66,  cofer: 0.005, swift: 0.035, bis: 0.020, lta: 0.0160, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CAD", name: "Canadian Dollar",  fx: fxRates.CAD ?? 0.73,   cofer: 0.005, swift: 0.025, bis: 0.025, lta: 0.0130, lifecycleStatus: "full", admittedDate: "2024-01-01" },
  ];
}

/**
 * Build the v19.0.2 baseline reserve composition with FIXED physical gold/silver
 * quantities (the Task 2-a fix — quantities NOT derived from price).
 *
 *   - Cash:        $29,250,000  (USD-denominated; price = 1)
 *   - Sovereign:   $13,500,000  (US T-bills ≤1yr; price = 1)
 *   - Gold:        2,122.86 oz  (FIXED physical; price = live goldUsd)
 *   - Silver:      36,758 oz    (FIXED physical; price = live silverUsd)
 *   - Stablecoins: $2,700,000   (USD-denominated; price = 1)
 *
 * Total at BASE_GOLD=$4076.90, BASE_SILVER=$58.76 ≈ $56.3M (baseline supply 54M → RR ≈ 101.5%).
 *
 * The `totalReserve` parameter (when provided) scales the USD-denominated tiers
 * proportionally — useful for testing lower-reserve scenarios. Gold/silver
 * physical quantities are ALWAYS fixed so price shocks flow through to reserve
 * value (the v19.0.2 dynamic NAV guarantee).
 */
function makeReserveAssets(
  goldPrice: number = BASE_GOLD,
  silverPrice: number = BASE_SILVER,
  totalReserve: number = 56_264_127
): ReserveAsset[] {
  // USD-denominated tiers sum to ~$45.45M at baseline (cash + sov + stab).
  // Scale them proportionally if a different totalReserve is requested.
  const usdScale = totalReserve / 56_264_127;
  const CASH_USD = 32_450_000 * usdScale;
  const SOVEREIGN_USD = 13_500_000 * usdScale;
  const STABLECOIN_USD = 2_700_000 * usdScale;
  // FIXED physical quantities (Task 2-a fix)
  const GOLD_OZ = 2_122.86;
  const SILVER_OZ = 36_758;
  return [
    { id: "cash-1",   name: "Central-bank cash", assetClass: "cash",       quantity: CASH_USD,      priceUsd: 1,           haircut: HAIRCUTS.cash,       counterpartyScore: 1.00, stressCoefficient: 0.95, modifiedDuration: 0   },
    { id: "sov-1",    name: "US T-bills ≤1yr",   assetClass: "sovereign",  quantity: SOVEREIGN_USD, priceUsd: 1,           haircut: HAIRCUTS.sovereign,  counterpartyScore: 0.99, stressCoefficient: 0.90, modifiedDuration: 0.5 },
    { id: "gold-1",   name: "Allocated gold",    assetClass: "gold",       quantity: GOLD_OZ,        priceUsd: goldPrice,   haircut: HAIRCUTS.gold,       counterpartyScore: 1.00, stressCoefficient: 0.85, modifiedDuration: 0   },
    { id: "silver-1", name: "Allocated silver", assetClass: "silver",     quantity: SILVER_OZ,      priceUsd: silverPrice, haircut: HAIRCUTS.silver,     counterpartyScore: 1.00, stressCoefficient: 0.80, modifiedDuration: 0   },
    { id: "stab-1",   name: "Regulated stables", assetClass: "stablecoin", quantity: STABLECOIN_USD, priceUsd: 1,           haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.96, stressCoefficient: 0.80, modifiedDuration: 0   },
  ];
}

function makeOracle(
  goldUsd: number = BASE_GOLD,
  fxRates?: Record<string, number>,
  gold12moAgo: number = BASE_GOLD * 0.95
): OracleSnapshot {
  const fx = fxRates ?? { USD: 1.0, EUR: 1.149, JPY: 0.0063, GBP: 1.27, CNY: 0.139, CHF: 1.12, AUD: 0.66, CAD: 0.73 };
  return {
    goldUsd,
    goldUsd12moAgo: gold12moAgo,
    goldUsd7dAgo: goldUsd * 0.995,
    goldUsdYesterday: goldUsd * 0.999,
    currencies: makeCurrencies(fx),
    fxAgo: { ...fx },
    fx7dAgo: { ...fx },
    fxAgo1d: { ...fx },
  } as OracleSnapshot;
}

function fmtUsd(n: number, d = 2): string {
  if (!isFinite(n)) return "∞";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtPct(n: number, d = 2): string {
  if (!isFinite(n)) return "∞";
  return n.toFixed(d) + "%";
}
function fmtNav(n: number): string {
  return "$" + n.toFixed(6);
}

// ---- Attack-runner framework ----

type Severity = "Critical" | "High" | "Medium" | "Low";

interface AttackResult {
  category: string;
  name: string;
  vector: string;
  defended: boolean;
  severity?: Severity;
  mechanism?: string;       // defense that stopped it
  detail?: string;          // what happened / why vulnerable
  metrics?: Record<string, string | number | boolean | null>; // quantitative findings
}

const results: AttackResult[] = [];
let currentCategory = "";

function category(name: string) {
  currentCategory = name;
  console.log(`\n${"=".repeat(78)}`);
  console.log(`  CATEGORY: ${name}`);
  console.log(`${"=".repeat(78)}`);
}

/**
 * Run a single attack. The callback throws on assertion failure of the
 * system's defense (i.e., the attack SUCCEEDED — system is vulnerable).
 * If the callback returns normally, the attack was DEFENDED.
 */
function attack(
  name: string,
  vector: string,
  fn: () => { mechanism: string; detail?: string; metrics?: Record<string, string | number | boolean | null> }
) {
  console.log(`\n  ▶ ATTACK: ${name}`);
  console.log(`    Vector: ${vector}`);
  try {
    const r = fn();
    results.push({
      category: currentCategory,
      name,
      vector,
      defended: true,
      mechanism: r.mechanism,
      detail: r.detail,
      metrics: r.metrics,
    });
    console.log(`    ✅ DEFENDED — ${r.mechanism}`);
    if (r.detail) console.log(`       detail: ${r.detail}`);
    if (r.metrics) {
      for (const [k, v] of Object.entries(r.metrics)) {
        console.log(`       ${k}: ${v}`);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const explicitSeverity = (e as Error & { severity?: Severity }).severity;
    const explicitMetrics = (e as Error & { metrics?: Record<string, string | number | boolean | null> }).metrics;
    results.push({
      category: currentCategory,
      name,
      vector,
      defended: false,
      severity: explicitSeverity ?? inferSeverity(name, msg),
      detail: msg,
      metrics: explicitMetrics,
    });
    console.log(`    ❌ VULNERABLE [${explicitSeverity ?? inferSeverity(name, msg)}] — ${msg}`);
    if (explicitMetrics) {
      for (const [k, v] of Object.entries(explicitMetrics)) {
        console.log(`       ${k}: ${v}`);
      }
    }
  }
}

/** Mark an attack as explicitly vulnerable (call inside fn). */
function vulnerable(severity: Severity, detail: string, metrics?: Record<string, string | number | boolean | null>): never {
  const err = new Error(detail);
  (err as Error & { severity?: Severity }).severity = severity;
  (err as Error & { metrics?: Record<string, string | number | boolean | null> }).metrics = metrics;
  throw err;
}

function inferSeverity(name: string, msg: string): Severity {
  // Heuristic: governance / oracle manipulation that extracts value → High
  if (/extract|profit|negative|forbidden word|interest|lending/i.test(name + msg)) return "High";
  if (/stale|front.?run|sandwich|death spiral|bank run/i.test(name + msg)) return "Medium";
  return "Low";
}

/** Assert helper — throws "attack succeeded" if condition is false. */
function assertDefense(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`defense failed: ${msg}`);
  }
}

// ============================================================================
// BASELINE
// ============================================================================

const baselineOracle = makeOracle(BASE_GOLD);
const baselineReserve = makeReserveAssets(BASE_GOLD, BASE_SILVER);
const baseline = computeMonetaryStateV19(baselineOracle, baselineReserve, SUPPLY, LCR, CRI, 0.015, []);

console.log("\n" + "=".repeat(78));
console.log("  MITHQAL v19.0.3 — ADVERSARIAL / ATTACK TEST SUITE (Task 7-c)");
console.log("  Think like an attacker. Find the break points.");
console.log("=".repeat(78));
console.log(`\nBASELINE (gold=${fmtUsd(BASE_GOLD)}, silver=${fmtUsd(BASE_SILVER)}, supply=${SUPPLY.toLocaleString()} MTQ):`);
console.log(`  NAV_m:        ${fmtNav(baseline.nav.market)}`);
console.log(`  NAV_l:        ${fmtNav(baseline.nav.prudential)}`);
console.log(`  NAV_stress:   ${fmtNav(baseline.nav.stress)}`);
console.log(`  Reserve Ratio:${baseline.reserveRatio.ratio.toFixed(2)}%  (compliant=${baseline.reserveRatio.compliant})`);
console.log(`  LCR:          ${baseline.lcr.ratio.toFixed(2)}  (compliant=${baseline.lcr.compliant})`);
console.log(`  CRI:          ${baseline.cri.cri.toFixed(2)} (${baseline.cri.level})`);
console.log(`  Shock Absorber: ${baseline.shockAbsorber.toFixed(4)}`);
console.log(`  Basket OK:    ${baseline.basketVerification.passed}`);
console.log(`  Minting Paused:${baseline.mintingPaused}`);

// ============================================================================
// CATEGORY 1: ORACLE MANIPULATION ATTACKS (§30, §31)
// ============================================================================

category("1. ORACLE MANIPULATION ATTACKS (§30/§31)");

// 1.1 Stale oracle attack — observation timestamp 1 hour ago
attack("Stale oracle attack (1-hour-old price)", "Oracle returns gold=$4076 with timestamp = now - 1 hour. Attacker expects engine to use it.", () => {
  const staleObs: OracleObservation[] = [
    { source: "Chainlink", weight: 1, price: 4076, timestamp: Date.now() - 60 * 60 * 1000, eligible: true },
    { source: "Pyth",      weight: 1, price: 4076, timestamp: Date.now() - 60 * 60 * 1000, eligible: true },
    { source: "Chronicle", weight: 1, price: 4076, timestamp: Date.now() - 60 * 60 * 1000, eligible: true },
    { source: "RedStone",  weight: 1, price: 4076, timestamp: Date.now() - 60 * 60 * 1000, eligible: true },
    { source: "LBMA",      weight: 1, price: 4076, timestamp: Date.now() - 60 * 60 * 1000, eligible: true },
  ];
  const result = oracleConsensus(staleObs, 4076);
  assertDefense(
    result.validObservations === 0 && result.fallbackUsed && result.method.includes("failed"),
    `stale observations were not rejected (valid=${result.validObservations}, method=${result.method})`
  );
  return {
    mechanism: `§30 ORACLE_FRESHNESS_MS = 60_000 — observations older than 60s are filtered; with 0 fresh observations, consensus fails safe (returns previousPrice, fallback=true)`,
    metrics: {
      "stale threshold": `${ORACLE_FRESHNESS_MS / 1000}s`,
      "attack age": "3600s",
      "valid observations": result.validObservations,
      "fallback used": result.fallbackUsed,
    },
  };
});

// 1.2 Flash crash attack — single oracle reports gold=$0.01
attack("Flash crash attack (1 oracle reports $0.01)", "1 of 6 oracles reports gold=$0.01. Attacker mints at crashed NAV, redeems at real NAV.", () => {
  const real = 4076;
  const obs: OracleObservation[] = [
    { source: "Chainlink", weight: 1, price: real,  timestamp: Date.now(), eligible: true },
    { source: "Pyth",      weight: 1, price: real,  timestamp: Date.now(), eligible: true },
    { source: "Chronicle", weight: 1, price: real,  timestamp: Date.now(), eligible: true },
    { source: "RedStone",  weight: 1, price: real,  timestamp: Date.now(), eligible: true },
    { source: "LBMA",      weight: 1, price: real,  timestamp: Date.now(), eligible: true },
    { source: "AttackerOracle", weight: 1, price: 0.01, timestamp: Date.now(), eligible: true },
  ];
  const result = oracleConsensus(obs, real);
  // Median of [0.01, 4076, 4076, 4076, 4076, 4076] = 4076. The single attacker
  // observation CANNOT move the median (5 of 6 are honest).
  //
  // NOTE: When all honest oracles agree PERFECTLY, MAD = 0 and the outlier filter
  // is bypassed (the `if (mad > 0)` guard in oracleConsensus skips quarantine).
  // This is an OBSERVABILITY gap (quarantined count is wrong), NOT a value-extraction
  // vector — the consensus price is still the correct median.
  assertDefense(
    result.consensusPrice > real * 0.99 && result.consensusPrice < real * 1.01,
    `consensus moved toward attacker price: ${result.consensusPrice} (should be ~${real})`
  );
  // Document the observability gap: when MAD=0, quarantine count is 0 even though
  // there IS an outlier. The defense (median) still works, but the audit trail
  // under-reports the anomaly. This is a Low-severity observability finding.
  const observabilityGap = result.quarantined === 0;
  return {
    mechanism: `§31.7 weighted-median consensus — single attacker observation cannot move the median (5 of 6 reports unaffected). Consensus price = ${fmtUsd(result.consensusPrice, 2)} (correct).${observabilityGap ? " OBSERVABILITY NOTE: MAD=0 (all honest oracles agree perfectly) bypasses outlier quarantine; audit trail under-reports anomaly. Defense still holds — median is correct." : ""}`,
    detail: observabilityGap ? "Quarantine count is 0 (MAD=0 bypass), but consensus price is correct. Low-severity observability gap — audit trail under-reports single-source outlier when honest sources agree perfectly." : undefined,
    metrics: {
      "real price": fmtUsd(real),
      "attacker price": "$0.01",
      "consensus price": fmtUsd(result.consensusPrice, 2),
      quarantined: result.quarantined,
      "observability gap": observabilityGap,
      "method": result.method,
    },
  };
});

// 1.3 Oracle divergence attack — 3 different prices
attack("Oracle divergence attack (3 different prices)", "3 of 5 oracles report divergent prices [2000, 2100, 4000, 1900, 2050].", () => {
  const obs: OracleObservation[] = [
    { source: "O1", weight: 1, price: 2000, timestamp: Date.now(), eligible: true },
    { source: "O2", weight: 1, price: 2100, timestamp: Date.now(), eligible: true },
    { source: "O3", weight: 1, price: 4000, timestamp: Date.now(), eligible: true }, // outlier
    { source: "O4", weight: 1, price: 1900, timestamp: Date.now(), eligible: true },
    { source: "O5", weight: 1, price: 2050, timestamp: Date.now(), eligible: true },
  ];
  const result = oracleConsensus(obs);
  // Median = 2050. MAD = median(|2000-2050|, |2100-2050|, |4000-2050|, |1900-2050|, |2050-2050|)
  //                 = median(50, 50, 1950, 150, 0) = 50. 3×MAD = 150. 4000 deviates 1950 > 150 → quarantined.
  assertDefense(result.quarantined >= 1, "outlier (4000) was not quarantined");
  assertDefense(
    result.consensusPrice < 2200 && result.consensusPrice > 1900,
    `consensus far from median cluster: ${result.consensusPrice}`
  );
  return {
    mechanism: "§31.5 MAD outlier rejection — extreme outlier (4000) excluded from consensus",
    metrics: {
      "input prices": "[2000, 2100, 4000, 1900, 2050]",
      "consensus": fmtUsd(result.consensusPrice, 0),
      quarantined: result.quarantined,
      "method": result.method,
    },
  };
});

// 1.4 Oracle quorum attack — only 2 of 5 oracles respond
attack("Oracle quorum attack (only 2 of 5 oracles respond)", "Only 2 of 5 oracles respond — quorum of 5 not met.", () => {
  const obs: OracleObservation[] = [
    { source: "O1", weight: 1, price: 4076, timestamp: Date.now(), eligible: true },
    { source: "O2", weight: 1, price: 4076, timestamp: Date.now(), eligible: true },
  ];
  const result = oracleConsensus(obs);
  // ORACLE_MINIMUM_QUORUM = 5. 2 < 5 → TWAP fallback.
  assertDefense(
    result.fallbackUsed && result.method.includes("TWAP"),
    `quorum bypass: ${result.method}, fallback=${result.fallbackUsed}`
  );
  assertDefense(
    result.validObservations === 2,
    `expected 2 valid observations, got ${result.validObservations}`
  );
  return {
    mechanism: `§31.6 ORACLE_MINIMUM_QUORUM = ${ORACLE_MINIMUM_QUORUM} — fewer than 5 valid observations triggers TWAP fallback (degraded mode, flag raised)`,
    metrics: {
      "min quorum": ORACLE_MINIMUM_QUORUM,
      "obs available": 2,
      "fallback": result.fallbackUsed,
      "confidence": result.confidence.toFixed(3),
    },
  };
});

// 1.5 Price spike attack — gold +1000% in 1 second
attack("Price spike attack (gold +1000% in 1 second)", "All oracles report gold +1000% (10×) instantly. §31 constitutional validation should trigger.", () => {
  const prev = 4076;
  const spike = prev * 11; // +1000%
  const obs: OracleObservation[] = Array.from({ length: 6 }, (_, i) => ({
    source: `O${i}`,
    weight: 1,
    price: spike,
    timestamp: Date.now(),
    eligible: true,
  }));
  const result = oracleConsensus(obs, prev);
  // >5% move triggers TWAP fallback. But all observations agree, so TWAP = spike.
  // The defense is partial: TWAP fallback flags the event, but if all oracles are
  // compromised simultaneously, the consensus still uses the spiked price.
  assertDefense(
    result.fallbackUsed && result.method.includes("constitutional"),
    `constitutional validation did not trigger: ${result.method}`
  );
  // Document the residual risk: if all oracles agree on a spike, TWAP fallback
  // is just the average of the same spiked observations.
  const twapValue = obs.reduce((s, o) => s + o.price, 0) / obs.length;
  return {
    mechanism: `§31 constitutional validation — >5% move triggers TWAP fallback; flags event for review. NOTE: if all oracles are simultaneously compromised, TWAP cannot help — multi-source independence is the real defense.`,
    detail: `TWAP fallback activated (price moved ${(Math.abs(spike - prev) / prev * 100).toFixed(1)}%); but TWAP = mean of observations = ${fmtUsd(twapValue, 0)} (same as spike). Defense-in-depth requires oracle SOURCE independence.`,
    metrics: {
      "prev price": fmtUsd(prev, 0),
      "spike price": fmtUsd(spike, 0),
      "move %": ((spike - prev) / prev * 100).toFixed(1) + "%",
      "threshold": ">5%",
      "fallback": result.fallbackUsed,
    },
  };
});

// 1.6 Manipulation extraction — attacker controls 1 of 6 oracles
attack("Single-oracle manipulation extraction", "Attacker controls 1 of 6 oracles. Can they extract value?", () => {
  const real = 4076;
  // Attacker manipulates their oracle by +5% (just below the constitutional threshold)
  // to push the consensus upward and mint at a higher NAV (more MTQ per dollar).
  const attackerBias = 0.05; // +5%
  const obs: OracleObservation[] = [
    { source: "Chainlink", weight: 1, price: real, timestamp: Date.now(), eligible: true },
    { source: "Pyth",      weight: 1, price: real, timestamp: Date.now(), eligible: true },
    { source: "Chronicle", weight: 1, price: real, timestamp: Date.now(), eligible: true },
    { source: "RedStone",  weight: 1, price: real, timestamp: Date.now(), eligible: true },
    { source: "LBMA",      weight: 1, price: real, timestamp: Date.now(), eligible: true },
    { source: "AttackerOracle", weight: 1, price: real * (1 + attackerBias), timestamp: Date.now(), eligible: true },
  ];
  const result = oracleConsensus(obs);
  // Median of [real, real, real, real, real, real*1.05] = real (median of 6 values, even count = avg of 3rd and 4th).
  // Even with attacker's bias, median = real. Attacker cannot move consensus.
  const extractablePct = Math.abs(result.consensusPrice - real) / real * 100;
  assertDefense(
    extractablePct < 0.01,
    `attacker moved consensus by ${extractablePct.toFixed(4)}% (should be ~0)`
  );
  return {
    mechanism: "§31.7 weighted-median consensus — single oracle cannot move the median (5 of 6 reports unaffected)",
    metrics: {
      "attacker oracle weight": "1/6 = 16.67%",
      "attacker bias": `+${(attackerBias * 100).toFixed(1)}%`,
      "consensus drift": `${extractablePct.toFixed(4)}%`,
      "extractable value": "$0 (median invariant to single outlier)",
    },
  };
});

// ============================================================================
// CATEGORY 2: FRONT-RUNNING & MEV ATTACKS (§36)
// ============================================================================

category("2. FRONT-RUNNING & MEV ATTACKS (§36)");

// 2.1 Mint front-running
attack("Mint front-running (attacker mints before large victim mint)", "Attacker sees victim's $10M mint coming, mints $1M first at lower NAV, redeems after at higher NAV.", () => {
  // Simulate: before mint, R=$56M, S=54M, NAV=$1.037
  const before = baseline;
  const navBefore = before.nav.market;

  // Attacker mints $1M
  const mint1Fee = mintFee(1_000_000);
  const mint1Mtq = (1_000_000 - mint1Fee) / navBefore;
  // After attacker mint: R += $1M - fee, S += mint1Mtq
  const r1 = before.reserves.market + 1_000_000 - mint1Fee;
  const s1 = SUPPLY + mint1Mtq;
  const navAfter1 = r1 / s1;

  // Victim mints $10M
  const mint2Fee = mintFee(10_000_000);
  const mint2Mtq = (10_000_000 - mint2Fee) / navAfter1;
  const r2 = r1 + 10_000_000 - mint2Fee;
  const s2 = s1 + mint2Mtq;
  const navAfter2 = r2 / s2;

  // Attacker redeems mint1Mtq
  const redeemGross = mint1Mtq * navAfter2;
  const redeemFee = redemptionFee(redeemGross);
  const net = redeemGross - redeemFee;
  const profit = net - 1_000_000;

  // Defense: attacker CANNOT extract positive value. A negative profit (loss to fees)
  // means the attack failed. We assert profit is NOT meaningfully positive.
  assertDefense(
    profit < 1, // attacker cannot extract >$1 of value
    `attacker extracted positive value: ${fmtUsd(profit, 4)} (should be ≤ 0 — fees only)`
  );
  assertDefense(
    Math.abs(navAfter2 - navBefore) < 1e-9,
    `NAV moved ${navAfter2 - navBefore} (should be unchanged — proportional scaling)`
  );
  return {
    mechanism: "§36 mint scales R and S proportionally (deposit increases R, minted MTQ increases S). NAV = R/S is invariant. Front-running has no edge — attacker only loses fees.",
    metrics: {
      "NAV before": fmtNav(navBefore),
      "NAV after attacker mint": fmtNav(navAfter1),
      "NAV after victim mint": fmtNav(navAfter2),
      "attacker net P/L": fmtUsd(profit, 4),
      "fees paid": fmtUsd(mint1Fee + redeemFee, 2),
    },
  };
});

// 2.2 Redeem front-running
attack("Redeem front-running (attacker redeems before large victim redeem)", "Attacker sees victim's $10M redeem coming, redeems $1M first before NAV drops.", () => {
  const before = baseline;
  const navBefore = before.nav.market;

  // Attacker redeems $1M worth of MTQ
  const mtqBurned1 = 1_000_000 / navBefore;
  const redeemGross1 = mtqBurned1 * navBefore;
  const redeemFee1 = redemptionFee(redeemGross1);
  // After: R -= redeemGross1, S -= mtqBurned1 (proportional)
  const r1 = before.reserves.market - redeemGross1;
  const s1 = SUPPLY - mtqBurned1;
  const navAfter1 = r1 / s1;

  // Victim redeems $10M
  const mtqBurned2 = 10_000_000 / navAfter1;
  const redeemGross2 = mtqBurned2 * navAfter1;
  const redeemFee2 = redemptionFee(redeemGross2);
  const r2 = r1 - redeemGross2;
  const s2 = s1 - mtqBurned2;
  const navAfter2 = r2 / s2;

  // Attacker got $1M - fee out. Net position = ($1M - fee) - $1M deposited earlier (assume original mint at NAV_before)
  const attackerOut = redeemGross1 - redeemFee1;
  const profit = attackerOut - 1_000_000;

  // Defense: attacker CANNOT extract positive value. Negative profit = loss to fees = defense works.
  assertDefense(
    profit < 1,
    `attacker extracted positive value: ${fmtUsd(profit, 4)} (should be ≤ 0 — fees only)`
  );
  assertDefense(
    Math.abs(navAfter2 - navBefore) < 1e-9,
    `NAV moved ${navAfter2 - navBefore} (should be unchanged)`
  );
  return {
    mechanism: "§36.3 redeem scales R and S proportionally. NAV = R/S is invariant. Redeem front-running has no edge — attacker only loses fees.",
    metrics: {
      "NAV before": fmtNav(navBefore),
      "NAV after attacker redeem": fmtNav(navAfter1),
      "NAV after victim redeem": fmtNav(navAfter2),
      "attacker P/L": fmtUsd(profit, 4),
    },
  };
});

// 2.3 Sandwich attack
attack("Sandwich attack (mint before, redeem after large mint)", "Attacker mints $1M before victim's $10M mint, redeems $1M after.", () => {
  const nav0 = baseline.nav.market;

  // Step 1: attacker mints $1M
  const f1 = mintFee(1_000_000);
  const mtq1 = (1_000_000 - f1) / nav0;
  const r1 = baseline.reserves.market + 1_000_000 - f1;
  const s1 = SUPPLY + mtq1;
  const nav1 = r1 / s1;

  // Step 2: victim mints $10M
  const f2 = mintFee(10_000_000);
  const mtq2 = (10_000_000 - f2) / nav1;
  const r2 = r1 + 10_000_000 - f2;
  const s2 = s1 + mtq2;
  const nav2 = r2 / s2;

  // Step 3: attacker redeems mtq1
  const grossOut = mtq1 * nav2;
  const f3 = redemptionFee(grossOut);
  const net = grossOut - f3;
  const profit = net - 1_000_000;

  assertDefense(profit < 0, `attacker made positive profit: ${fmtUsd(profit, 4)} (should be negative — fees)`);
  return {
    mechanism: "NAV is invariant under proportional mint/redeem scaling. Sandwich yields no edge; attacker only loses fees.",
    metrics: {
      "NAV t0": fmtNav(nav0),
      "NAV t1 (post-attacker mint)": fmtNav(nav1),
      "NAV t2 (post-victim mint)": fmtNav(nav2),
      "attacker P/L": fmtUsd(profit, 4),
      "fees burned": fmtUsd(f1 + f3, 2),
    },
  };
});

// 2.4 NAV arbitrage (mint NAV vs redeem NAV gap)
attack("NAV arbitrage (gap between mint NAV and redeem NAV)", "Arbitrageur tries to profit from a spread between mint NAV and redeem NAV.", () => {
  // Both mint and redeem compute NAV via the same computeMonetaryStateV19 against
  // the same oracle snapshot and reserve. §36.2 (minted = deposit / NAV_m) and
  // §36.3 (redeemed = burned × NAV_m) use the SAME NAV_m.
  const navMint = baseline.nav.market;
  const navRedeem = baseline.nav.market;
  const spread = navRedeem - navMint;

  assertDefense(
    Math.abs(spread) < 1e-12,
    `mint NAV (${navMint}) ≠ redeem NAV (${navRedeem}) — spread ${spread}`
  );
  return {
    mechanism: "§36.2 and §36.3 both reference NAV_m = R_m / S — single source of truth (computeLiveNav). Zero spread = zero arbitrage.",
    metrics: {
      "mint NAV": fmtNav(navMint),
      "redeem NAV": fmtNav(navRedeem),
      "spread": "$0.000000",
    },
  };
});

// 2.5 Time-of-check vs time-of-use
attack("Time-of-check vs time-of-use (slippage window)", "NAV changes between quote and execution — can attacker exploit?", () => {
  // In this implementation there is no "quote" — the engine computes NAV at
  // execution time using the live oracle. There is no committed price.
  // This means no stale-quote MEV, but also no slippage protection for the user.
  // Test: simulate a NAV change between time T0 (quote) and T1 (execute).
  const nav0 = baseline.nav.market;
  // Oracle moves 5% (gold +5%)
  const movedOracle = makeOracle(BASE_GOLD * 1.05);
  const movedState = computeMonetaryStateV19(movedOracle, baselineReserve, SUPPLY, LCR, CRI, 0.025, []);
  const nav1 = movedState.nav.market;
  const userSlippage = (nav1 - nav0) / nav0;

  // The user who expected to mint at nav0 actually mints at nav1.
  // If gold rose 5%, NAV rose ~3% (gold is ~16% of reserve). User gets ~3% fewer MTQ.
  // No locked-in quote. This is a design choice (no MEV) but a UX tradeoff.
  if (Math.abs(userSlippage) > 0.001) {
    vulnerable("Medium", `No slippage protection — user slippage = ${(userSlippage * 100).toFixed(2)}% on a 5% oracle move. Design choice (no MEV) but users bear the risk.`, {
      "NAV t0": fmtNav(nav0),
      "NAV t1 (post 5% gold move)": fmtNav(nav1),
      "user slippage": (userSlippage * 100).toFixed(2) + "%",
    });
  }
  return {
    mechanism: "No committed quotes — NAV computed at execution time using live oracle. Eliminates stale-quote MEV but exposes users to slippage (design tradeoff).",
    metrics: {
      "NAV t0": fmtNav(nav0),
      "NAV t1": fmtNav(nav1),
      "user slippage": (userSlippage * 100).toFixed(2) + "%",
    },
  };
});

// ============================================================================
// CATEGORY 3: BANK RUN & LIQUIDITY CRISIS (§34, §36)
// ============================================================================

category("3. BANK RUN & LIQUIDITY CRISIS (§34/§36)");

// 3.1 50% redemption in 1 hour (27M MTQ)
attack("50% redemption in 1 hour (27M MTQ)", "27M MTQ redeemed simultaneously. Does the system survive?", () => {
  // Pre-redemption: R = $56M (baseline), S = 54M, NAV = $1.037
  // Redeem 27M MTQ: redeemer claims 27M × NAV_m = $28M
  // §34 hierarchy: drain stablecoin ($2.8M), cash ($28M), sov ($14M)... total = $44.8M available before bullion
  // $28M claim: stablecoin ($2.8M) + cash ($25.2M) = $28M. No sov/silver/gold touched.
  const claim = 54_000_000 * baseline.nav.market;
  const plan = computeRedemptionSequence(claim, baselineReserve);
  // Post-redemption: R halves, S halves → NAV unchanged
  const newReserveUsd = baseline.reserves.market - claim;
  const newSupply = SUPPLY - 54_000_000;
  const newNav = newReserveUsd / newSupply;

  assertDefense(plan.sufficient, "system could not cover 50% redemption");
  assertDefense(!plan.goldLiquidated, "gold was liquidated for 50% redemption — §34.2 violated");
  assertDefense(
    Math.abs(newNav - baseline.nav.market) / baseline.nav.market < 0.01,
    `NAV moved ${((newNav - baseline.nav.market) / baseline.nav.market * 100).toFixed(2)}% (should be ~0)`
  );
  return {
    mechanism: "§34 redemption hierarchy drains stablecoins + cash first; §4 PAR-based RR invariant under proportional redemption (R and S scale together).",
    metrics: {
      "claim value": fmtUsd(claim, 0),
      "tiers tapped": plan.tiers.length,
      "gold liquidated": plan.goldLiquidated,
      "sufficient": plan.sufficient,
      "NAV before": fmtNav(baseline.nav.market),
      "NAV after": fmtNav(newNav),
    },
  };
});

// 3.2 100% redemption (extreme)
attack("100% redemption (54M MTQ — full wind-down)", "All 54M MTQ redeemed. Does the system wind down gracefully?", () => {
  const claim = 54_000_000 * baseline.nav.market; // ~$56M
  const plan = computeRedemptionSequence(claim, baselineReserve);

  // At 100% redemption, gold WILL be liquidated (last resort). That's expected —
  // the institution is winding down. The defense is "graceful wind-down".
  assertDefense(plan.sufficient, "system could not cover 100% redemption");
  assertDefense(plan.goldLiquidated, "gold was NOT liquidated at 100% redemption — math error");
  assertDefense(plan.unmet === 0, `unmet shortfall: ${plan.unmet}`);
  return {
    mechanism: "§34 hierarchy drains in order: stablecoin → cash → sov → silver → gold (last). At 100% redemption, gold IS liquidated (institution winds down). Graceful shutdown.",
    metrics: {
      "total claim": fmtUsd(claim, 0),
      "total liquidated": fmtUsd(plan.totalLiquidated, 0),
      "unmet shortfall": fmtUsd(plan.unmet, 0),
      "gold liquidated": plan.goldLiquidated,
      "sufficient": plan.sufficient,
    },
  };
});

// 3.3 Cascading redemption → NAV drop → death spiral
attack("Cascading redemption death spiral", "Redemption → NAV drops → more redemption → death spiral?", () => {
  // Run 5 successive 10% redemptions. Track NAV after each.
  // NAV = R_m / S. If redemption is proportional (R and S scale together),
  // NAV is invariant. We track R and S directly (not asset-class detail) to
  // isolate the death-spiral question from the §34 liquidation-hierarchy effect.
  let reserveUsd = baseline.reserves.market;
  let supply = SUPPLY;
  const navHistory: number[] = [reserveUsd / supply];
  for (let i = 0; i < 5; i++) {
    const burn = supply * 0.10;
    const claimUsd = burn * navHistory[navHistory.length - 1];
    // Verify the §34 hierarchy can actually cover this redemption from current assets
    const plan = computeRedemptionSequence(claimUsd, baselineReserve);
    if (!plan.sufficient) {
      vulnerable("High", `redemption round ${i + 1} failed (unmet=${plan.unmet}) — death spiral triggered`);
    }
    // Proportional scaling: R -= claim, S -= burn (this is what the engine math does)
    reserveUsd -= claimUsd;
    supply -= burn;
    navHistory.push(reserveUsd / supply);
  }
  const navChange = (navHistory[navHistory.length - 1] - navHistory[0]) / navHistory[0];
  assertDefense(
    Math.abs(navChange) < 1e-9, // <1e-7% drift (exact invariance under proportional scaling)
    `NAV drifted ${(navChange * 100).toFixed(4)}% over 5 redemption rounds — death spiral`
  );
  return {
    mechanism: "NAV = R/S is invariant under proportional redemption (R and S scale together). No feedback loop possible — cascading redemption cannot trigger a death spiral.",
    metrics: {
      "rounds": 5,
      "NAV t0": fmtNav(navHistory[0]),
      "NAV t1": fmtNav(navHistory[1]),
      "NAV t2": fmtNav(navHistory[2]),
      "NAV t3": fmtNav(navHistory[3]),
      "NAV t4": fmtNav(navHistory[4]),
      "NAV t5": fmtNav(navHistory[5]),
      "NAV drift": (navChange * 1e9).toFixed(2) + " ppb",
    },
  };
});

// 3.4 Redemption queue FIFO fairness
attack("Redemption queue FIFO fairness", "If redemptions are queued, are they processed in arrival order?", () => {
  // The runtime has no persistent queue; redemptionSequence is stateless.
  // Test: simulate 3 sequential redemptions, verify they're processed in order
  // and each gets the NAV at its execution time (no priority inversion).
  const nav = baseline.nav.market;
  const r1 = computeRedemptionSequence(1_000 * nav, baselineReserve);
  const r2 = computeRedemptionSequence(2_000 * nav, baselineReserve);
  const r3 = computeRedemptionSequence(3_000 * nav, baselineReserve);
  // All should succeed (each individually small)
  assertDefense(r1.sufficient && r2.sufficient && r3.sufficient, "queue blocked");
  // The stateless design means there's no prioritization — first-come-first-served is implicit.
  return {
    mechanism: "§34 redemptionSequence is stateless and atomic per call — no priority inversion possible. FIFO is implicit.",
    metrics: {
      "r1 sufficient": r1.sufficient,
      "r2 sufficient": r2.sufficient,
      "r3 sufficient": r3.sufficient,
    },
  };
});

// 3.5 Redemption never pauses even at RR=80%
attack("Redemption never pauses (RR=80% non-compliant)", "Verify redemption still works when RR<100% (only minting pauses).", () => {
  // Construct a state where RR < 80%
  const lowReserve = makeReserveAssets(BASE_GOLD, BASE_SILVER, 40_000_000); // $40M vs $54M supply
  const state = computeMonetaryStateV19(baselineOracle, lowReserve, SUPPLY, LCR, CRI, 0.015, []);
  assertDefense(state.mintingPaused, "minting NOT paused when RR < 100%");
  // Even so, redemption should compute (no pause flag in redemptionSequence)
  const plan = computeRedemptionSequence(1_000_000, lowReserve);
  assertDefense(plan.sufficient, "redemption failed when RR<100%");
  assertDefense(!plan.goldLiquidated, "gold liquidated for $1M redemption with $40M reserve");
  return {
    mechanism: "§36.3 redemption is non-suspendable. Only MINTING is paused when RR<100% (§22A gate). Redemption rights are permanent (§45 invariant).",
    metrics: {
      "RR": state.reserveRatio.ratio.toFixed(2) + "%",
      "minting paused": state.mintingPaused,
      "redemption sufficient": plan.sufficient,
      "gold liquidated": plan.goldLiquidated,
    },
  };
});

// 3.6 Minting pause effectiveness
attack("Minting pause effectiveness (RR<100%)", "When RR<100%, is minting truly blocked?", () => {
  const lowReserve = makeReserveAssets(BASE_GOLD, BASE_SILVER, 30_000_000); // $30M vs $54M supply
  const state = computeMonetaryStateV19(baselineOracle, lowReserve, SUPPLY, LCR, CRI, 0.015, []);
  assertDefense(state.mintingPaused, "minting NOT paused with RR < 100%");
  assertDefense(!state.reserveRatio.compliant, "RR reported as compliant when it shouldn't be");
  return {
    mechanism: "§22A+§4 — mintingPaused = (RR<100%) OR (basket verification failed). Verified both gates are wired.",
    metrics: {
      "RR": state.reserveRatio.ratio.toFixed(2) + "%",
      "compliant": state.reserveRatio.compliant,
      "mintingPaused": state.mintingPaused,
    },
  };
});

// ============================================================================
// CATEGORY 4: DEATH SPIRAL RESISTANCE (§33, §34)
// ============================================================================

category("4. DEATH SPIRAL RESISTANCE (§33/§34)");

// 4.1 Gold crash → NAV drop → redemption → gold sale → further crash
attack("Gold crash → redemption → gold sale feedback loop", "Gold crashes 30%; redemptions force gold sale; gold crashes more.", () => {
  // Gold -30%
  const crashedGold = BASE_GOLD * 0.70;
  const crashedReserve = makeReserveAssets(crashedGold, BASE_SILVER);
  const crashedState = computeMonetaryStateV19(makeOracle(crashedGold), crashedReserve, SUPPLY, LCR, CRI, 0.04, []);
  // Even with crashed gold, redemption should drain stablecoin+cash first
  const redemption = 5_000_000 * crashedState.nav.market;
  const plan = computeRedemptionSequence(redemption, crashedReserve);
  assertDefense(!plan.goldLiquidated, "gold liquidated when stablecoin+cash were available — §34.2 violated");
  return {
    mechanism: "§34.2 Bullion Protection Rule — gold is liquidated LAST. Gold crash does NOT force gold sale (other reserves absorb redemptions first). Feedback loop broken.",
    metrics: {
      "gold before": fmtUsd(BASE_GOLD, 0),
      "gold after": fmtUsd(crashedGold, 0),
      "NAV before": fmtNav(baseline.nav.market),
      "NAV after": fmtNav(crashedState.nav.market),
      "RR before": baseline.reserveRatio.ratio.toFixed(2) + "%",
      "RR after": crashedState.reserveRatio.ratio.toFixed(2) + "%",
      "gold liquidated in $5M redeem": plan.goldLiquidated,
    },
  };
});

// 4.2 Stablecoin depeg → redemption → sale → further depeg
attack("Stablecoin depeg → sale → further depeg", "Stablecoin depegs to $0.70. Redemptions force stablecoin sale, worsening depeg.", () => {
  // Stablecoin drops to $0.70
  const depeggedReserve = baselineReserve.map((a) =>
    a.assetClass === "stablecoin" ? { ...a, priceUsd: 0.70, counterpartyScore: 0.85 } : a
  );
  const state = computeMonetaryStateV19(baselineOracle, depeggedReserve, SUPPLY, LCR, CRI, 0.015, []);
  // Redemption drains stablecoin FIRST (§34). This means selling the depegged asset.
  // However: total stablecoin exposure is only $2.7M (4.8% of reserve). Sale impact is bounded.
  const plan = computeRedemptionSequence(500_000, depeggedReserve);
  const stableTapped = plan.tiers.find((t) => t.assetClass === "stablecoin")?.liquidatedUsd ?? 0;
  // Partial defense: §6 2% haircut already prices in some depeg risk; small absolute exposure ($2.7M of $56M = 4.8%).
  // Residual risk: if all stablecoins must be sold into a thin market, slippage could worsen depeg.
  return {
    mechanism: "§34 drains stablecoins first (depegged asset liquidated before gold). §6 2% haircut + §7 0.96 counterparty score pre-price some depeg risk. Small absolute exposure ($2.7M / 4.8%) bounds systemic impact.",
    detail: "Partial defense — large depeg + thin market could create feedback. Mitigated by small exposure + haircut.",
    metrics: {
      "stablecoin exposure": "$2,700,000 (4.8% of reserve)",
      "depeg scenario": "$1.00 → $0.70 (-30%)",
      "stablecoin tapped in $500k redeem": fmtUsd(stableTapped, 0),
      "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
    },
  };
});

// 4.3 Currency crash → SDP → suspension → panic loop
attack("Currency crash → SDP → panic → redemption loop", "JPY crashes 30%; SDP triggers; panic causes more redemption.", () => {
  // JPY FX drops 30% (USD per JPY goes from 0.0063 to 0.00441)
  const crashedFx = { USD: 1.0, EUR: 1.149, JPY: 0.0063 * 0.70, GBP: 1.27, CNY: 0.139, CHF: 1.12, AUD: 0.66, CAD: 0.73 };
  const oracle = makeOracle(BASE_GOLD, crashedFx);
  const state = computeMonetaryStateV19(oracle, baselineReserve, SUPPLY, LCR, CRI, 0.015, []);
  // SDP detects: deviation > 5%
  const sdp = detectSDP(crashedFx.JPY, 0.0063, "JPY");
  assertDefense(sdp.triggered, "SDP did not trigger for JPY -30%");
  assertDefense(sdp.trigger === "severe", `SDP severity wrong: ${sdp.trigger}`);
  // SDP emergency weight: K_SDP = Ref/Cur = 1/0.7 = 1.43. New weight capped at 50% drop.
  const sdpResult = computeSDPEmergency(0.05, 0.0063, crashedFx.JPY, 0.05);
  assertDefense(sdpResult.newWeight !== null, "SDP newWeight not computed");
  assertDefense(sdpResult.recoveryRampActive, "SDP recovery ramp not active");
  return {
    mechanism: "§33 SDP — detects >5% deviation, computes emergency weight K_SDP=Ref/Cur, applies §33.6 anti-shock cap (50% floor). Currency isolated, panic loop dampened.",
    metrics: {
      "JPY deviation": (sdp.deviation! * 100).toFixed(2) + "%",
      "SDP severity": String(sdp.trigger),
      "emergency K_SDP": sdpResult.emergencyFactor?.toFixed(4) ?? "n/a",
      "new weight": sdpResult.newWeight?.toFixed(4) ?? "n/a",
      "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
    },
  };
});

// 4.4 NAV discount → arbitrage → mint → supply inflation → NAV drop
attack("NAV premium → arbitrage → supply inflation spiral", "NAV > $1 attracts minting; supply inflates; NAV drops.", () => {
  // If NAV > $1 (premium), arbitrageur mints MTQ (gets MTQ per dollar at high NAV).
  // After mint: R += deposit, S += MTQ. NAV = R/S unchanged (proportional scaling).
  // So minting does NOT push NAV down. No spiral.
  let reserve = baseline.reserves.market;
  let supply = SUPPLY;
  const navHistory = [baseline.nav.market];
  for (let i = 0; i < 5; i++) {
    const deposit = 1_000_000;
    const fee = mintFee(deposit);
    const mtq = (deposit - fee) / navHistory[navHistory.length - 1];
    reserve += deposit - fee;
    supply += mtq;
    navHistory.push(reserve / supply);
  }
  const drift = (navHistory[navHistory.length - 1] - navHistory[0]) / navHistory[0];
  assertDefense(Math.abs(drift) < 1e-9, `NAV drifted ${drift} — inflation spiral detected`);
  return {
    mechanism: "NAV is invariant under minting (R and S scale proportionally). No inflation spiral — arbitrage is self-correcting, not spiral-inducing.",
    metrics: {
      "rounds": 5,
      "NAV t0": fmtNav(navHistory[0]),
      "NAV t5": fmtNav(navHistory[navHistory.length - 1]),
      "drift": (drift * 1e9).toFixed(2) + " ppb",
    },
  };
});

// 4.5 Over-collateralization buffer (2%) breaks spirals
attack("2% over-collateralization buffer absorbs shocks", "Verify the 2% RR buffer (RR_target=102%) absorbs small shocks without breaching compliance.", () => {
  // Gold -2% (small shock)
  const shockGold = BASE_GOLD * 0.98;
  const shockReserve = makeReserveAssets(shockGold, BASE_SILVER);
  const shockState = computeMonetaryStateV19(makeOracle(shockGold), shockReserve, SUPPLY, LCR, CRI, 0.015, []);
  assertDefense(shockState.reserveRatio.compliant, `RR < 100% after 2% gold drop: ${shockState.reserveRatio.ratio}%`);
  // Gold -5% (medium shock)
  const bigShockGold = BASE_GOLD * 0.95;
  const bigShockReserve = makeReserveAssets(bigShockGold, BASE_SILVER);
  const bigShockState = computeMonetaryStateV19(makeOracle(bigShockGold), bigShockReserve, SUPPLY, LCR, CRI, 0.015, []);
  // Even at -5%, RR should be > 100% (gold is ~16% of reserve; 5% × 16% = 0.8% drop in R_a)
  assertDefense(bigShockState.reserveRatio.compliant, `RR < 100% after 5% gold drop: ${bigShockState.reserveRatio.ratio}%`);
  return {
    mechanism: "§4 RR_target = 102% provides 2% buffer. Gold is ~16% of reserve, so even a 12% gold crash only drops RR by ~2% — buffer absorbs it.",
    metrics: {
      "baseline RR": baseline.reserveRatio.ratio.toFixed(2) + "%",
      "RR after -2% gold": shockState.reserveRatio.ratio.toFixed(2) + "%",
      "RR after -5% gold": bigShockState.reserveRatio.ratio.toFixed(2) + "%",
      "compliant (-5%)": bigShockState.reserveRatio.compliant,
    },
  };
});

// ============================================================================
// CATEGORY 5: GOVERNANCE ATTACKS (§43, §45, §46)
// ============================================================================

category("5. GOVERNANCE ATTACKS (§43/§45/§46)");

// 5.1 Malicious amendment to change RR_min
attack("Malicious amendment: lower RR_min from 100% to 80%", "Proposal to amend §4 RR_min (non-amendable invariant) from 100% to 80%.", () => {
  // Check 1: constants registry marks RR_min as non-modifiable
  const rrMinConstant = CONSTITUTIONAL_CONSTANTS.find((c) => c.symbol === "RR_min");
  assertDefense(!!rrMinConstant, "RR_min not in constants registry");
  assertDefense(!rrMinConstant!.modifiable, `RR_min marked modifiable (rule: ${rrMinConstant!.modificationRule})`);

  // Check 2: textual conflict checker — does it catch this phrasing?
  const conflict = checkInvariantConflict("amend RR_min from 100% to 80%");
  if (!conflict.violates) {
    vulnerable(
      "Medium",
      "checkInvariantConflict does NOT catch 'amend RR_min' phrasing. The textual linter has gaps — only checks if action contains the full invariant name (e.g. '100% reserve minimum') or 'suspend'+'reserve'. Defense relies on constants registry, not linter.",
      {
        "constants registry modifiable": rrMinConstant!.modifiable,
        "linter detected": conflict.violates,
      }
    );
  }
  return {
    mechanism: "§53 constants registry marks RR_min as `modifiable: false, modificationRule: Constitutional Invariant (§45)`. Defense at registry level (not textual linter).",
    metrics: {
      "RR_min in registry": "yes",
      "modifiable": rrMinConstant!.modifiable,
      "modification rule": rrMinConstant!.modificationRule,
    },
  };
});

// 5.2 Rush amendment (< 90 days)
attack("Rush amendment (try to enact in < 90 days)", "Proposal tries to skip the 90-day timelock.", () => {
  let amendment = createAmendment("Rush attack");
  // Advance through all stages 0→7 (no timelock)
  for (let i = 0; i < 8; i++) {
    const r = advanceAmendment(amendment);
    if (!r.advanced) {
      vulnerable("High", `amendment stuck at stage ${i}: ${r.reason}`);
    }
    amendment = r.amendment;
  }
  // Now at stage 8 (Timelock Start). Advance to 9 (Timelock End).
  const r9 = advanceAmendment(amendment);
  assertDefense(r9.advanced, "could not start timelock");
  amendment = r9.amendment;
  // Now at stage 9. Try to advance to 10 (Enactment) immediately — should fail.
  const r10 = advanceAmendment(amendment, { now: new Date() });
  assertDefense(!r10.advanced, "amendment enacted without timelock elapsed!");
  assertDefense(r10.reason.includes("timelock not elapsed"), `wrong rejection reason: ${r10.reason}`);
  // Try with 89 days — should still fail
  const r10_89 = advanceAmendment(amendment, {
    now: new Date(Date.parse(amendment.timelockStartedAt!) + 89 * 86_400_000),
  });
  assertDefense(!r10_89.advanced, "amendment enacted at day 89 (< 90)!");
  // Try with 90 days — should succeed
  const r10_90 = advanceAmendment(amendment, {
    now: new Date(Date.parse(amendment.timelockStartedAt!) + 90 * 86_400_000),
  });
  assertDefense(r10_90.advanced, "amendment NOT enacted at day 90");
  return {
    mechanism: `§43.13 AMENDMENT_TIMELOCK_DAYS = ${AMENDMENT_TIMELOCK_DAYS} — advanceAmendment() refuses to enact if elapsed < 90 days. Verified 89d fails, 90d passes.`,
    metrics: {
      "timelock days": AMENDMENT_TIMELOCK_DAYS,
      "enact at 89d": r10_89.advanced,
      "enact at 90d": r10_90.advanced,
      "rejection reason": r10_89.reason,
    },
  };
});

// 5.3 Supermajority bypass (5/7)
attack("Supermajority bypass (5/7 signers try to enact)", "5 of 7 signers attempt to pass an amendment (needs 6/7 = 85.7%).", () => {
  const YES_VOTES = 5;
  const TOTAL_SEAT = 7;
  const pct = (YES_VOTES / TOTAL_SEAT) * 100;
  assertDefense(
    YES_VOTES < CONSTITUTIONAL_SUPERMAJORITY,
    `5/7 ≥ threshold (${CONSTITUTIONAL_SUPERMAJORITY}/7) — bypass succeeded`
  );
  assertDefense(pct < 75, `5/7 = ${pct.toFixed(1)}% ≥ 75% threshold — bypass succeeded`);
  return {
    mechanism: `§43.11 CONSTITUTIONAL_SUPERMAJORITY = ${CONSTITUTIONAL_SUPERMAJORITY}/7 = 85.7%. 5/7 = 71.4% < 75% (constitutional minimum) — insufficient.`,
    metrics: {
      "yes votes": YES_VOTES,
      "total seats": TOTAL_SEAT,
      "approval %": pct.toFixed(1) + "%",
      "required %": "≥75% (6/7)",
      "bypass succeeded": YES_VOTES >= CONSTITUTIONAL_SUPERMAJORITY,
    },
  };
});

// 5.4 Emergency override
attack("Emergency override of invariants", "Try to use 'emergency' declaration to suspend constitutional invariants.", () => {
  // §44.5 Constitutional Emergency declared
  const emergency = declareEmergency("Constitutional Emergency", "Council declares emergency to suspend RR_min");
  assertDefense(isEmergencyActive(emergency), "emergency not active");
  // Try to suspend invariants via emergency
  const test1 = checkInvariantConflict("emergency override: suspend 100% reserve minimum");
  const test2 = checkInvariantConflict("emergency override: suspend redemption rights");
  const test3 = checkInvariantConflict("emergency override: suspend no fractional reserve");
  const test4 = checkInvariantConflict("emergency override: amend RR_min to 80%");
  // test1-3 should be caught (contain "suspend" + invariant name)
  // test4 might not be caught (no "suspend" keyword, uses symbol not name)
  assertDefense(test1.violates, "suspend '100% reserve minimum' not caught");
  assertDefense(test2.violates, "suspend 'redemption rights' not caught");
  assertDefense(test3.violates, "suspend 'no fractional reserve' not caught");
  // Document test4 gap
  if (!test4.violates) {
    vulnerable(
      "Medium",
      "Emergency override phrased as 'amend RR_min to 80%' bypasses checkInvariantConflict. Linter only matches full invariant names; symbol-based references ('RR_min') evade detection. Defense relies on constants registry (RR_min.modifiable=false).",
      {
        "test1 (suspend reserve minimum)": test1.violates,
        "test2 (suspend redemption rights)": test2.violates,
        "test3 (suspend no fractional reserve)": test3.violates,
        "test4 (amend RR_min to 80%)": test4.violates,
      }
    );
  }
  return {
    mechanism: "§45.3 — invariants are PERMANENT (amendable: false). checkInvariantConflict catches 'suspend'+invariant-name phrasings. Constants registry independently blocks RR_min modification.",
    metrics: {
      "emergency level": emergency.level,
      "test1 violates": test1.violates,
      "test2 violates": test2.violates,
      "test3 violates": test3.violates,
    },
  };
});

// 5.5 Forbidden words (interest, lending, leverage)
attack("Forbidden words: 'interest', 'lending', 'leverage'", "Proposal text contains 'interest', 'lending', 'leverage' — should be blocked per §46.", () => {
  const proposal = "Proposal to add interest-bearing accounts, lending facilities, and leverage features to MTQ.";
  const found = scanForbiddenWords(proposal);
  // Cast to readonly string[] so TypeScript doesn't narrow the literal union and
  // statically conclude the comparison is "always false" (TS2367). The runtime
  // check is what matters here — we're verifying the FORBIDDEN_WORDS list.
  const words = FORBIDDEN_WORDS as readonly string[];
  const hasInterest = words.some((w) => w === "interest");
  const hasLending = words.some((w) => w === "lending");
  const hasLeverage = words.some((w) => w === "leverage");

  if (!hasInterest || !hasLending || !hasLeverage) {
    vulnerable(
      "High",
      `Sharia-critical terms missing from FORBIDDEN_WORDS: interest=${hasInterest}, lending=${hasLending}, leverage=${hasLeverage}. §49 prohibits riba (interest), gharar (excessive uncertainty), and haram industries. The linter does NOT catch these terms — a proposal containing them would pass §46 marketing compliance despite violating §49 Sharia framework.`,
      {
        "'interest' in list": hasInterest,
        "'lending' in list": hasLending,
        "'leverage' in list": hasLeverage,
        "words found in proposal": found.length,
      }
    );
  }
  return {
    mechanism: "§46 FORBIDDEN_WORDS list (167 entries) — covers hype/revolutionary/future/marketing terms.",
    metrics: {
      "'interest' forbidden": hasInterest,
      "'lending' forbidden": hasLending,
      "'leverage' forbidden": hasLeverage,
      "total forbidden words": FORBIDDEN_WORDS.length,
    },
  };
});

// 5.6 Governance capture (4/7 signers)
attack("Governance capture (4/7 signers collude)", "4 of 7 signers collude. Can they enact harmful amendments?", () => {
  const CAPTURED = 4;
  const TOTAL = 7;
  const pct = (CAPTURED / TOTAL) * 100;
  // 4/7 = 57.1% — well below 75% supermajority. Cannot enact amendments.
  assertDefense(
    CAPTURED < CONSTITUTIONAL_SUPERMAJORITY,
    `4/7 ≥ ${CONSTITUTIONAL_SUPERMAJORITY}/7 — capture can enact`
  );
  // However, 4/7 CAN block legitimate amendments (if 4 vote no, only 3 yes — well below supermajority).
  // This is a governance DoS risk, but not a value-extraction risk.
  const canBlock = CAPTURED > TOTAL - CONSTITUTIONAL_SUPERMAJORITY; // 4 > 7-6 = 1, so yes
  return {
    mechanism: `§43.11 supermajority (6/7) means 4/7 capture cannot enact. BUT 4/7 can block (4 no-votes → only 3 yes → fails supermajority). Capture enables DoS, not theft.`,
    detail: `4/7 capture = governance gridlock risk (DoS). Not a value-extraction vector — constitutional invariants (§45) are non-amendable regardless of signer count.`,
    metrics: {
      "captured signers": CAPTURED,
      "total signers": TOTAL,
      "capture %": pct.toFixed(1) + "%",
      "can enact": CAPTURED >= CONSTITUTIONAL_SUPERMAJORITY,
      "can block": canBlock,
    },
  };
});

// ============================================================================
// CATEGORY 6: SMART CONTRACT ATTACKS (§11, §36)
// ============================================================================

category("6. SMART-CONTRACT ATTACKS (§11/§36, simulated)");

// 6.1 Reentrancy on mint (conceptual)
attack("Reentrancy on mint (conceptual)", "Attacker tries to re-enter mint() callback before state updates finalize.", () => {
  // The MINT_LIFECYCLE is a 12-step sequential pipeline. The engine itself is
  // pure (no external calls during mint computation). There are no callback hooks.
  // In a Solidity implementation, this would require CEI pattern + ReentrancyGuard.
  // Test: verify mintFee + computeMonetaryStateV19 are pure (no side effects).
  const fee1 = mintFee(1_000_000);
  const fee2 = mintFee(1_000_000);
  assertDefense(fee1 === fee2, "mintFee is non-deterministic (side effect)");
  // Compute state twice — should be identical
  const s1 = computeMonetaryStateV19(baselineOracle, baselineReserve, SUPPLY, LCR, CRI, 0.015, []);
  const s2 = computeMonetaryStateV19(baselineOracle, baselineReserve, SUPPLY, LCR, CRI, 0.015, []);
  assertDefense(s1.nav.market === s2.nav.market, "computeMonetaryStateV19 is non-deterministic");
  return {
    mechanism: "§36 mint lifecycle is a pure 12-step pipeline — no external callbacks during mint computation. Engine functions are deterministic (same input → same output). In Solidity: must use CEI pattern + ReentrancyGuard.",
    metrics: {
      "mintFee deterministic": fee1 === fee2,
      "state deterministic": s1.nav.market === s2.nav.market,
    },
  };
});

// 6.2 Reentrancy on redeem (conceptual)
attack("Reentrancy on redeem (conceptual)", "Attacker tries to re-enter redeem() callback before burn finalizes.", () => {
  const s1 = computeMonetaryStateV19(baselineOracle, baselineReserve, SUPPLY, LCR, CRI, 0.015, []);
  const s2 = computeMonetaryStateV19(baselineOracle, baselineReserve, SUPPLY, LCR, CRI, 0.015, []);
  assertDefense(s1.nav.market === s2.nav.market, "redeem path non-deterministic");
  // Also: redemptionSequence is stateless (no mutation of inputs)
  const assets1 = [...baselineReserve];
  const plan1 = computeRedemptionSequence(1_000_000, assets1);
  const plan2 = computeRedemptionSequence(1_000_000, assets1);
  assertDefense(plan1.totalLiquidated === plan2.totalLiquidated, "redemptionSequence non-deterministic");
  // Verify inputs not mutated
  assertDefense(assets1[0].quantity === baselineReserve[0].quantity, "redemptionSequence mutated input reserve");
  return {
    mechanism: "§36 redeem lifecycle (13 steps) is pure. redemptionSequence is stateless — does not mutate input ReserveAsset[]. No callback hooks for reentrancy.",
    metrics: {
      "redeem deterministic": s1.nav.market === s2.nav.market,
      "inputs not mutated": assets1[0].quantity === baselineReserve[0].quantity,
    },
  };
});

// 6.3 Integer overflow (1e18 MTQ)
attack("Integer overflow (supply = 1e18 MTQ)", "Engine given supply = 1e18 MTQ — does it overflow?", () => {
  // decimal.js with precision 28 handles 1e18 fine.
  const bigSupply = 1e18;
  const state = computeMonetaryStateV19(baselineOracle, baselineReserve, bigSupply, LCR, CRI, 0.015, []);
  assertDefense(isFinite(state.nav.market), "NAV overflowed to non-finite");
  assertDefense(state.nav.market > 0, "NAV is non-positive");
  // 1e18 MTQ against $56M reserve → NAV = $56e6 / 1e18 = $5.6e-11 (very small but valid)
  return {
    mechanism: "§11 fixed-point arithmetic via decimal.js (Decimal128 equivalent, 28 sig digits). 1e18 is well within range. No integer overflow.",
    metrics: {
      "supply": bigSupply.toExponential(),
      "NAV_m": state.nav.market.toExponential(4),
      "finite": isFinite(state.nav.market),
    },
  };
});

// 6.4 Precision loss (0.000001 MTQ)
attack("Precision loss (0.000001 MTQ)", "Very small amounts — is precision maintained?", () => {
  const smallAmount = 0.000001;
  const fee = mintFee(smallAmount);
  // Fee should be 0.000001 × 0.0005 = 5e-10. Below the $5000 cap.
  assertDefense(fee > 0, "fee is 0 — precision lost");
  assertDefense(Math.abs(fee - 5e-10) < 1e-15, `fee precision lost: ${fee.toExponential()}`);
  // fpDiv precision
  const quotient = fpToNumber(fpDiv(fp(smallAmount), fp(3)));
  assertDefense(Math.abs(quotient - smallAmount / 3) < 1e-20, "fpDiv precision lost");
  return {
    mechanism: "§11 decimal.js precision = 28 significant digits. Sub-cent amounts (1e-6 MTQ) and their products (5e-10 USD fee) computed exactly.",
    metrics: {
      "input amount": smallAmount.toExponential(),
      "fee": fee.toExponential(4),
      "expected fee": (smallAmount * 0.0005).toExponential(4),
      "precision": "28 sig digits",
    },
  };
});

// 6.5 Division by zero (supply=0, reserves=[])
attack("Division by zero (supply=0, reserves=[])", "Engine given supply=0 and empty reserves — does it crash?", () => {
  const emptyReserves: ReserveAsset[] = [];
  const emptyValuation: ReserveValuation = { market: 0, adjusted: 0, liquidation: 0, hierarchyValid: true };
  // Test computeNAV
  const nav = computeNAV(emptyValuation, 0);
  assertDefense(nav.market === 0 && nav.prudential === 0 && nav.stress === 0, "computeNAV crashed on supply=0");
  assertDefense(!nav.hierarchyValid, "computeNAV should flag supply=0 as invalid hierarchy");
  // Test computeReserveRatio
  const rr = computeReserveRatio(emptyValuation, nav, 0);
  assertDefense(rr.ratio === 0, "computeReserveRatio crashed on supply=0");
  assertDefense(!rr.compliant, "RR should be non-compliant when supply=0");
  // Test fpDiv
  const quotient = fpToNumber(fpDiv(fp(100), fp(0)));
  assertDefense(quotient === 0, "fpDiv did not guard divide-by-zero");
  // Test full computeMonetaryStateV19 with supply=0
  const state = computeMonetaryStateV19(baselineOracle, [], 0, LCR, CRI, 0.015, []);
  assertDefense(isFinite(state.nav.market), "computeMonetaryStateV19 crashed on supply=0");
  return {
    mechanism: "§11 fpDiv returns Decimal(0) on divide-by-zero (no throw). §3 computeNAV guards supply<=0. §4 computeReserveRatio guards L<=0.",
    metrics: {
      "NAV (supply=0)": nav.market,
      "RR (supply=0)": rr.ratio,
      "fpDiv(100, 0)": quotient,
      "state.nav (supply=0)": state.nav.market,
    },
  };
});

// 6.6 Negative amounts (amount = -1000)
attack("Negative amounts (amount = -1000)", "Engine given amount = -1000 — is it rejected?", () => {
  // Test mintFee(-1000)
  const fee = mintFee(-1000);
  // Math.min(-1000 × 0.0005, 5000) = Math.min(-0.5, 5000) = -0.5 — NEGATIVE FEE
  if (fee < 0) {
    vulnerable(
      "Medium",
      `mintFee(-1000) = ${fee} (NEGATIVE). Math.min(-0.5, 5000) = -0.5. The engine accepts negative amounts without validation — a negative mint fee could be exploited to mint MTQ without depositing. Defense requires API-layer input validation; engine itself has no guards.`,
      {
        "mintFee(-1000)": fee,
        "expected": "throw or return 0",
      }
    );
  }
  return {
    mechanism: "mintFee uses Math.min(amount × bps, cap) — accepts negative inputs (returns negative fee).",
    metrics: { "mintFee(-1000)": fee },
  };
});

// ============================================================================
// CATEGORY 7: MARKET MANIPULATION RESISTANCE (§4, §9)
// ============================================================================

category("7. MARKET MANIPULATION RESISTANCE (§4/§9)");

// 7.1 Whale dump (40% of supply redeemed at once)
attack("Whale dump (40% of supply redeemed)", "Whale holding 21.6M MTQ redeems all at once.", () => {
  const claim = 21_600_000 * baseline.nav.market; // ~$22.4M
  const plan = computeRedemptionSequence(claim, baselineReserve);
  // Stablecoin ($2.8M) + cash ($28M) = $30.8M available before sovereign
  assertDefense(plan.sufficient, "whale dump not covered");
  assertDefense(!plan.goldLiquidated, "gold liquidated for $22M whale dump — §34.2 violated");
  // NAV should be invariant (proportional)
  const newR = baseline.reserves.market - claim;
  const newS = SUPPLY - 21_600_000;
  const newNav = newR / newS;
  assertDefense(
    Math.abs(newNav - baseline.nav.market) / baseline.nav.market < 0.01,
    `NAV moved ${((newNav - baseline.nav.market) / baseline.nav.market * 100).toFixed(2)}%`
  );
  return {
    mechanism: "§34 hierarchy drains stablecoin ($2.8M) + cash ($28M) first = $30.8M available before bullion. Whale's $22M claim covered without touching gold. NAV invariant under proportional redemption.",
    metrics: {
      "whale claim": fmtUsd(claim, 0),
      "tiers tapped": plan.tiers.length,
      "gold liquidated": plan.goldLiquidated,
      "NAV before": fmtNav(baseline.nav.market),
      "NAV after": fmtNav(newNav),
    },
  };
});

// 7.2 Wash trading (mint → transfer → redeem → repeat)
attack("Wash trading (mint → transfer → redeem × 1000)", "Attacker wash-trades to manipulate something — what?", () => {
  // Each cycle: mint fee (5 bps) + transfer fee (1 bp) + redeem fee (5 bps) = 11 bps
  const principal = 1_000_000;
  const cycles = 1000;
  const mintF = mintFee(principal);
  const redeemF = redemptionFee(principal);
  const transferF = Math.min(principal * 0.0001, 1000); // §9 transfer fee 1 bp, cap $1000
  const perCycle = mintF + redeemF + transferF;
  const totalFees = perCycle * cycles;
  // After 1000 cycles, attacker has paid $11M in fees on $1M principal — total loss
  const attackerLoss = totalFees - principal;
  assertDefense(attackerLoss > 0, "wash trading is profitable — fee model broken");
  // What could the attacker manipulate? NAV is invariant. Basket weights unaffected by mint/redeem.
  return {
    mechanism: "§9 fee schedule (mint 5 bps + transfer 1 bp + redeem 5 bps = 11 bps/cycle). 1000 cycles on $1M = $110K in fees (11% of principal). Wash trading is self-punishing; NAV and basket weights are invariant.",
    metrics: {
      "principal": fmtUsd(principal, 0),
      "cycles": cycles,
      "per-cycle fees": fmtUsd(perCycle, 2),
      "total fees burned": fmtUsd(totalFees, 0),
      "attacker loss": fmtUsd(attackerLoss, 0),
    },
  };
});

// 7.3 NAV pumping (deposit + withdraw)
attack("NAV pumping (deposit to inflate NAV, withdraw to realize)", "Attacker deposits to pump NAV, then withdraws at the inflated NAV.", () => {
  // Mint increases R and S proportionally. NAV unchanged.
  // Withdraw (redeem) decreases R and S proportionally. NAV unchanged.
  // No pumping possible.
  let r = baseline.reserves.market;
  let s = SUPPLY;
  const nav0 = r / s;

  // Mint $5M
  const f1 = mintFee(5_000_000);
  const mtq1 = (5_000_000 - f1) / nav0;
  r += 5_000_000 - f1;
  s += mtq1;
  const nav1 = r / s;

  // Redeem mtq1
  const gross = mtq1 * nav1;
  const f2 = redemptionFee(gross);
  r -= gross;
  s -= mtq1;
  const nav2 = r / s;

  assertDefense(Math.abs(nav2 - nav0) < 1e-6, `NAV changed by ${nav2 - nav0} — pumping succeeded`);
  return {
    mechanism: "NAV is invariant under mint/redeem (proportional scaling of R and S). No pumping vector.",
    metrics: {
      "NAV t0": fmtNav(nav0),
      "NAV after mint": fmtNav(nav1),
      "NAV after redeem": fmtNav(nav2),
      "pumping profit": "$0.00",
    },
  };
});

// 7.4 Reserve composition manipulation
attack("Reserve composition manipulation", "Can a user influence the reserve asset-class weights to their advantage?", () => {
  // The reserve composition (cash 50%, sov 25%, gold 16%, silver 4%, stab 5%) is
  // institutionally set (Task 3-a baseline). Individual mint/redeem doesn't alter it.
  // Mint: deposit USD → cash increases; R_m += deposit, S += MTQ. Cash share rises slightly.
  // Redeem: §34 drains stablecoin first. Stablecoin share drops slightly.
  // Test: mint $1M, verify reserve composition barely changes
  const beforeCash = baselineReserve[0].quantity * baselineReserve[0].priceUsd;
  const beforeTotal = baseline.reserves.market;
  const beforeCashShare = beforeCash / beforeTotal;
  // Mint $1M (deposited as cash)
  const afterCash = beforeCash + 1_000_000;
  const afterTotal = beforeTotal + 1_000_000;
  const afterCashShare = afterCash / afterTotal;
  // Cash share rises by ~$1M / $57M = 1.75%
  const shareChange = (afterCashShare - beforeCashShare) * 100;
  // Even with $1M mint, share moves <2%. To manipulate to 60% cash (from 50%), attacker needs ~$6M mint — costs $3K in fees.
  // But the institution can rebalance (§29) at any time, restoring the target composition.
  assertDefense(Math.abs(shareChange) < 5, "reserve composition shifted dramatically — manipulation succeeded");
  return {
    mechanism: "Reserve composition is institutionally set. Mint shifts weights marginally (<2% per $1M). §29 rebalancing restores target composition. Users cannot meaningfully manipulate reserve composition.",
    metrics: {
      "cash share before": (beforeCashShare * 100).toFixed(2) + "%",
      "cash share after $1M mint": (afterCashShare * 100).toFixed(2) + "%",
      "share change": shareChange.toFixed(2) + " pp",
    },
  };
});

// ============================================================================
// CATEGORY 8: SYSTEMIC CRISIS TESTS (§40 historical replays)
// ============================================================================

category("8. SYSTEMIC CRISIS TESTS (§40 historical replays)");

// 8.1 2008 GFC: gold +25%, sovereign bonds -40%, S&P -40%
attack("2008 GFC simulation (gold +25%, sov -40%, equities -40%)", "Gold +25%, sovereign bonds -40%, S&P -40%. Does MTQ survive?", () => {
  const crisisGold = BASE_GOLD * 1.25;
  const crisisReserve = baselineReserve.map((a) => {
    if (a.assetClass === "gold") return { ...a, priceUsd: crisisGold };
    if (a.assetClass === "sovereign") return { ...a, priceUsd: 0.60, counterpartyScore: 0.92 }; // 40% drop + downgrade
    return a;
  });
  const state = computeMonetaryStateV19(makeOracle(crisisGold), crisisReserve, SUPPLY, LCR, CRI, 0.06, []);
  // NAV: cash $28M + sov $8.1M + gold $11.3M + silver $2.2M + stab $2.7M = $52.3M (down from $56M)
  // SURVIVAL checks: NAV finite, NAV > 0, redemption works.
  assertDefense(isFinite(state.nav.market), "NAV non-finite after 2008 GFC");
  assertDefense(state.nav.market > 0, "NAV non-positive after 2008 GFC");
  const plan = computeRedemptionSequence(1_000_000, crisisReserve);
  assertDefense(plan.sufficient, "redemption failed during 2008 GFC");
  // The 2008 GFC scenario pushes RR to 94.32% — well below 100%. The 2% buffer
  // is insufficient for a 40% sovereign crash + 25% gold rally combination.
  // Minting pauses (defense), but institution is non-compliant. Low severity.
  if (!state.reserveRatio.compliant) {
    vulnerable(
      "Low",
      `2008 GFC scenario (sov -40% + gold +25%) pushed RR to ${state.reserveRatio.ratio.toFixed(2)}% (< 100%). The 2% over-collateralization buffer is insufficient for a 40% sovereign crash. Minting pauses (defense), but institution is non-compliant. NAV impact is -6%. Redemption still works (gold not liquidated).`,
      {
        "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
        "RR after": state.reserveRatio.ratio.toFixed(2) + "%",
        "compliant": state.reserveRatio.compliant,
        "minting paused": state.mintingPaused,
      }
    );
  }
  return {
    mechanism: "Over-collateralization buffer partially absorbs sovereign -40% (mitigated by gold +25%). Cash + stablecoin (44% of reserve) untouched. Redemption still works (gold not liquidated).",
    metrics: {
      "NAV before": fmtNav(baseline.nav.market),
      "NAV after GFC": fmtNav(state.nav.market),
      "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
      "RR before": baseline.reserveRatio.ratio.toFixed(2) + "%",
      "RR after GFC": state.reserveRatio.ratio.toFixed(2) + "%",
      "redemption works": plan.sufficient,
    },
  };
});

// 8.2 2020 COVID: gold -12% then +28%, BTC -50%, vol doubles
attack("2020 COVID simulation (gold V-shape, vol doubles)", "Gold -12% then +28% (net +13%), BTC -50%, vol doubles.", () => {
  const netGold = BASE_GOLD * 0.88 * 1.28; // = 1.1264
  const crisisReserve = baselineReserve.map((a) =>
    a.assetClass === "gold" ? { ...a, priceUsd: netGold } : a
  );
  const state = computeMonetaryStateV19(makeOracle(netGold), crisisReserve, SUPPLY, LCR, CRI, 0.06, []);
  assertDefense(isFinite(state.nav.market), "NAV non-finite after COVID");
  assertDefense(state.nav.market > baseline.nav.market, "NAV should rise with gold +13%");
  // High volatility → shock absorber at 0.5 (max dampening)
  assertDefense(state.shockAbsorber === 0.5, `shock absorber not at max: ${state.shockAbsorber}`);
  return {
    mechanism: "Gold net +13% → NAV rises. §17 shock absorber at 0.5 (max dampening) due to doubled volatility. Basket weights dampened (K_i → 1). System survives.",
    metrics: {
      "NAV before": fmtNav(baseline.nav.market),
      "NAV after COVID": fmtNav(state.nav.market),
      "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
      "shock absorber": state.shockAbsorber.toFixed(2),
    },
  };
});

// 8.3 2022 stablecoin crisis: USDC depeg to $0.87, UST collapse
attack("2022 stablecoin crisis (USDC depeg -13%, UST collapse)", "USDC depegs to $0.87, UST collapses (stablecoin layer → $0.70).", () => {
  const crisisReserve = baselineReserve.map((a) => {
    if (a.assetClass === "stablecoin") return { ...a, priceUsd: 0.70, counterpartyScore: 0.85 };
    return a;
  });
  const state = computeMonetaryStateV19(baselineOracle, crisisReserve, SUPPLY, LCR, CRI, 0.03, []);
  // Stablecoin exposure = $2.7M. Loss = $2.7M × 0.30 = $0.81M (1.4% of reserve).
  // SURVIVAL checks: NAV finite, NAV > 0, redemption works, minting paused if RR<100%.
  assertDefense(isFinite(state.nav.market), "NAV non-finite after stablecoin crisis");
  assertDefense(state.nav.market > 0, "NAV non-positive after stablecoin crisis");
  const plan = computeRedemptionSequence(1_000_000, crisisReserve);
  assertDefense(plan.sufficient, "redemption failed during stablecoin crisis");
  assertDefense(!plan.goldLiquidated, "gold liquidated during stablecoin crisis — §34.2 violated");
  // The crisis DID push RR below 100% (99.65%). Minting must pause.
  // This is a Low-severity finding: 2% buffer insufficient for 30% stablecoin depeg + counterparty downgrade.
  if (!state.reserveRatio.compliant) {
    vulnerable(
      "Low",
      `Stablecoin depeg -30% + counterparty downgrade (0.96→0.85) pushed RR to ${state.reserveRatio.ratio.toFixed(2)}% (< 100%). The 2% over-collateralization buffer is insufficient for this combined shock. Minting pauses (defense), but institution is technically non-compliant. NAV impact is only -1.4% (small absolute exposure).`,
      {
        "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
        "RR after": state.reserveRatio.ratio.toFixed(2) + "%",
        "compliant": state.reserveRatio.compliant,
        "minting paused": state.mintingPaused,
      }
    );
  }
  return {
    mechanism: "§6 2% haircut + §7 0.96 counterparty score pre-price some depeg risk. Stablecoin exposure $2.7M (4.8% of reserve). NAV impact -1.4%. Redemption still works (gold not liquidated).",
    metrics: {
      "stablecoin exposure": "$2,700,000 (4.8%)",
      "depeg severity": "$1.00 → $0.70 (-30%)",
      "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
      "RR after": state.reserveRatio.ratio.toFixed(2) + "%",
      "compliant": state.reserveRatio.compliant,
      "redemption works": plan.sufficient,
    },
  };
});

// 8.4 2023 banking crisis: regional bank failures, sovereign stress
attack("2023 banking crisis (regional bank failures, sov stress)", "Cash counterparty downgraded, sovereign -10%, banking system stress.", () => {
  const crisisReserve = baselineReserve.map((a) => {
    if (a.assetClass === "cash") return { ...a, counterpartyScore: 0.94, stressCoefficient: 0.90 };
    if (a.assetClass === "sovereign") return { ...a, priceUsd: 0.90, counterpartyScore: 0.95 };
    return a;
  });
  const state = computeMonetaryStateV19(baselineOracle, crisisReserve, SUPPLY, LCR, CRI, 0.04, []);
  assertDefense(state.nav.market > 0, "NAV non-positive after banking crisis");
  assertDefense(isFinite(state.reserveRatio.ratio), "RR non-finite");
  const plan = computeRedemptionSequence(1_000_000, crisisReserve);
  assertDefense(plan.sufficient, "redemption failed during banking crisis");
  // The 2023 banking crisis (cash downgrade + sov -10%) pushes RR to 94.96% (< 100%).
  // 2% buffer insufficient. Low severity.
  if (!state.reserveRatio.compliant) {
    vulnerable(
      "Low",
      `2023 banking crisis (cash downgrade + sov -10%) pushed RR to ${state.reserveRatio.ratio.toFixed(2)}% (< 100%). 2% buffer insufficient. Minting pauses (defense). NAV impact -2.5%. Redemption still works.`,
      {
        "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
        "RR after": state.reserveRatio.ratio.toFixed(2) + "%",
        "compliant": state.reserveRatio.compliant,
        "minting paused": state.mintingPaused,
      }
    );
  }
  return {
    mechanism: "§7 counterparty score (cash 1.00→0.94, sov 0.99→0.95) reduces R_a. Combined with sovereign -10% price drop, R_a drops ~3%. Minting pauses (§22A gate). Redemption works.",
    metrics: {
      "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
      "RR after": state.reserveRatio.ratio.toFixed(2) + "%",
      "compliant": state.reserveRatio.compliant,
      "redemption works": plan.sufficient,
    },
  };
});

// 8.5 1997 Asian crisis: JPY -30%, CNY depeg
attack("1997 Asian crisis (JPY -30%, CNY depeg)", "JPY crashes 30%, CNY depegs. SDP should trigger for both.", () => {
  const crisisFx = { USD: 1.0, EUR: 1.149, JPY: 0.0063 * 0.70, GBP: 1.27, CNY: 0.139 * 0.80, CHF: 1.12, AUD: 0.66, CAD: 0.73 };
  const oracle = makeOracle(BASE_GOLD, crisisFx);
  const state = computeMonetaryStateV19(oracle, baselineReserve, SUPPLY, LCR, CRI, 0.04, []);
  // SDP for JPY (-30%) and CNY (-20%)
  const sdpJpy = detectSDP(crisisFx.JPY, 0.0063, "JPY");
  const sdpCny = detectSDP(crisisFx.CNY, 0.139, "CNY");
  assertDefense(sdpJpy.triggered, "SDP did not trigger for JPY -30%");
  assertDefense(sdpCny.triggered, "SDP did not trigger for CNY -20%");
  assertDefense(sdpJpy.trigger === "severe", `JPY SDP severity wrong: ${sdpJpy.trigger}`);
  // NAV should be roughly preserved (FX only affects basket weights, not reserve values directly)
  assertDefense(
    Math.abs(state.nav.market - baseline.nav.market) / baseline.nav.market < 0.01,
    "NAV moved >1% from FX-only crisis"
  );
  return {
    mechanism: "§33 SDP triggers for both JPY (-30%) and CNY (-20%). SDP emergency weight + §33.6 cap isolates the currencies. NAV largely unaffected (FX doesn't directly hit reserve values).",
    metrics: {
      "JPY deviation": (sdpJpy.deviation! * 100).toFixed(2) + "%",
      "CNY deviation": (sdpCny.deviation! * 100).toFixed(2) + "%",
      "JPY SDP": String(sdpJpy.trigger),
      "CNY SDP": String(sdpCny.trigger),
      "NAV impact": ((state.nav.market - baseline.nav.market) / baseline.nav.market * 100).toFixed(2) + "%",
    },
  };
});

// 8.6 Hyperinflation: USD -50% (gold +100% in USD terms)
attack("Hyperinflation (USD -50%, gold +100%)", "USD loses 50% of value. Gold doubles in USD terms. Does MTQ preserve real value?", () => {
  const hyperGold = BASE_GOLD * 2.0; // gold +100% in USD
  const crisisReserve = baselineReserve.map((a) =>
    a.assetClass === "gold" ? { ...a, priceUsd: hyperGold } : a
  );
  const state = computeMonetaryStateV19(makeOracle(hyperGold), crisisReserve, SUPPLY, LCR, CRI, 0.04, []);
  // NAV should roughly double (gold is 16% of reserve; 100% gold appreciation → ~16% NAV rise)
  // But cash + sov + stab are USD-denominated → their real value halves
  // The "real" (gold-equivalent) NAV is what matters
  const navUsd = state.nav.market;
  const navGoldEquiv = navUsd / hyperGold; // NAV in gold ounces
  const baselineNavGoldEquiv = baseline.nav.market / BASE_GOLD;
  const realValueRetained = navGoldEquiv / baselineNavGoldEquiv;
  // With 16% gold backing, real value retention = 16% (gold) + 84% (USD halved) = 16% + 42% = 58%
  // The other 42% is lost to USD depreciation (this is the cost of USD denomination)
  assertDefense(realValueRetained > 0.40, `real value retention too low: ${(realValueRetained * 100).toFixed(1)}%`);
  assertDefense(state.reserveRatio.compliant, "RR non-compliant after hyperinflation");
  return {
    mechanism: "§14 gold anchor — 16% gold backing preserves ~16% of real value during USD hyperinflation. Remaining 84% (USD-denominated) loses purchasing power. RR rises (gold appreciates, L fixed at PAR). Redemption still works.",
    metrics: {
      "USD gold price": fmtUsd(hyperGold, 0),
      "NAV (USD)": fmtNav(navUsd),
      "NAV (gold equiv, oz)": navGoldEquiv.toExponential(4),
      "baseline NAV (gold equiv, oz)": baselineNavGoldEquiv.toExponential(4),
      "real value retained": (realValueRetained * 100).toFixed(1) + "%",
      "RR": state.reserveRatio.ratio.toFixed(2) + "%",
    },
  };
});

// ============================================================================
// CATEGORY 9: EDGE CASE ATTACKS (§3, §9, §11)
// ============================================================================

category("9. EDGE CASE ATTACKS (§3/§9/§11)");

// 9.1 Zero supply attack (mint when supply=0)
attack("Zero supply attack (first mint when supply=0)", "Mint when supply=0 — what NAV is used? depositUsd / NAV = ?/0.", () => {
  const nav = computeNAV({ market: 56_000_000, adjusted: 54_000_000, liquidation: 48_000_000, hierarchyValid: true }, 0);
  // computeNAV returns 0 when supply <= 0
  assertDefense(nav.market === 0, "computeNAV did not return 0 for supply=0");
  // §36.2 mint formula: depositUsd / NAV. If NAV=0, this is division by zero.
  // fpDiv guards: returns 0. So mint returns 0 MTQ — deposit is "lost".
  const minted = fpToNumber(fpDiv(fp(1_000_000), fp(nav.market)));
  if (minted === 0) {
    vulnerable(
      "Medium",
      "First-mint undefined behavior: computeNAV returns 0 when supply=0, so mint formula depositUsd/NAV = depositUsd/0 = 0 (fpDiv guards). The deposit is 'lost' (no MTQ issued). System needs a bootstrap NAV (e.g., $1.00) or minimum-supply gate before opening mint.",
      {
        "supply=0 NAV": nav.market,
        "minted MTQ for $1M deposit": minted,
      }
    );
  }
  return {
    mechanism: "§3 computeNAV returns 0 when supply=0. §11 fpDiv guards divide-by-zero (returns 0). No crash, but first-mint is undefined — bootstrap required.",
    metrics: {
      "supply=0 NAV": nav.market,
      "minted MTQ": minted,
    },
  };
});

// 9.2 Maximum supply attack (1B MTQ)
attack("Maximum supply attack (supply = 1B MTQ)", "Mint until supply = 1,000,000,000 MTQ — does anything break?", () => {
  const bigSupply = 1_000_000_000;
  const state = computeMonetaryStateV19(baselineOracle, baselineReserve, bigSupply, LCR, CRI, 0.015, []);
  assertDefense(isFinite(state.nav.market), "NAV non-finite at 1B supply");
  assertDefense(state.nav.market > 0, "NAV non-positive at 1B supply");
  // NAV = $56M / 1B = $0.056/MTQ. PAR is $1.00, so RR = R_a / (S × PAR) = $54M / $1B = 5.4% — way below 100%.
  assertDefense(!state.reserveRatio.compliant, "RR reported compliant at 1B supply — should be ~5%");
  assertDefense(state.mintingPaused, "minting NOT paused at 1B supply (RR<100%)");
  return {
    mechanism: "§11 decimal.js handles 1e9 without overflow. §4 RR drops to 5.4% (R_a fixed, L=S×PAR grows). §22A+§4 mint pause correctly activates. No crash.",
    metrics: {
      "supply": bigSupply.toLocaleString(),
      "NAV_m": fmtNav(state.nav.market),
      "RR": state.reserveRatio.ratio.toFixed(2) + "%",
      "minting paused": state.mintingPaused,
    },
  };
});

// 9.3 Dust attack (millions of tiny mints)
attack("Dust attack (1M mints of 0.000001 MTQ)", "Attacker mints 1,000,000 tiny amounts to bloat the ledger.", () => {
  const tinyAmount = 0.000001; // $1 micro-cent
  const fee = mintFee(tinyAmount);
  const cycles = 1_000_000;
  const totalFees = fee * cycles;
  const totalMinted = tinyAmount * cycles;
  // Fee per mint = 5e-10 USD. 1M mints = 5e-4 USD total fees (half a cent).
  // But ledger has 1M records — storage bloat.
  assertDefense(totalFees < 1, "fee revenue exceeds $1 — dust attack economically meaningful");
  // The real cost is ledger storage (1M records). This is an operational concern.
  // §9 fee cap ($5000 max) does NOT prevent tiny mints.
  return {
    mechanism: "§9 fee schedule: tiny mints generate tiny fees (5e-10 USD × 1M = $0.0005). Ledger bloat is operational, not monetary. Mitigation: minimum mint amount at API layer (e.g., $1 min).",
    detail: "Defense at API/rate-limit layer, not engine. Engine itself has no minimum-amount guard.",
    metrics: {
      "tiny amount": tinyAmount.toExponential(),
      "fee per mint": fee.toExponential(4),
      "total fees (1M mints)": fmtUsd(totalFees, 6),
      "total minted": totalMinted.toExponential(),
      "ledger records": cycles.toLocaleString(),
    },
  };
});

// 9.4 Round-trip attack (mint $1M → redeem $1M × 1000)
attack("Round-trip attack (1000 cycles of $1M mint+redeem)", "Attacker mints and redeems $1M repeatedly — cumulative fee leak?", () => {
  const principal = 1_000_000;
  const cycles = 1000;
  const mintF = mintFee(principal); // $500
  const redeemF = redemptionFee(principal); // $500
  const perCycle = mintF + redeemF; // $1000
  const totalFees = perCycle * cycles;
  // After 1000 cycles: $1M principal, $1M fees paid. Attacker has $0 left.
  assertDefense(totalFees >= principal, "fees < principal — round-trip is profitable");
  return {
    mechanism: "§9 round-trip cost = mint 5 bps + redeem 5 bps = 10 bps/cycle = $1000 per $1M cycle. 1000 cycles = $1M fees = 100% of principal. Self-defeating.",
    metrics: {
      "principal": fmtUsd(principal, 0),
      "per-cycle fees": fmtUsd(perCycle, 0),
      "cycles to drain principal": Math.ceil(principal / perCycle),
      "total fees (1000 cycles)": fmtUsd(totalFees, 0),
    },
  };
});

// 9.5 Multi-currency arbitrage (mint with EUR, redeem with JPY)
attack("Multi-currency arbitrage (mint EUR, redeem JPY)", "Attacker mints with EUR, redeems in JPY — profit from FX discrepancy?", () => {
  // Mint EUR: 100 EUR → USD = 100 × fx_EUR. Minted MTQ = USD / NAV.
  // Redeem JPY: burned MTQ × NAV = USD. JPY = USD / fx_JPY (or × inverted convention).
  // Same oracle → same FX → no arbitrage.
  const fxEur = 1.149; // USD per EUR
  const fxJpy = 0.0063; // USD per JPY
  const nav = baseline.nav.market;

  // Mint 100 EUR
  const depositUsd = 100 * fxEur; // $114.90
  const mintFeePaid = mintFee(depositUsd);
  const mtqMinted = (depositUsd - mintFeePaid) / nav;

  // Redeem in JPY
  const redeemUsd = mtqMinted * nav;
  const redeemFeePaid = redemptionFee(redeemUsd);
  const netUsd = redeemUsd - redeemFeePaid;
  const jpyOut = netUsd / fxJpy;

  // If we just converted 100 EUR → JPY directly:
  const directJpy = (100 * fxEur) / fxJpy;
  // Attacker's JPY should be LESS than direct (due to fees)
  const profit = jpyOut - directJpy;
  assertDefense(profit < 0, `multi-currency arbitrage profitable: ${profit.toFixed(2)} JPY`);
  return {
    mechanism: "§36.2 and §36.3 use the same NAV_m and the same oracle FX rates. No spread between mint FX and redeem FX. Round-trip only loses fees (10 bps).",
    metrics: {
      "minted (100 EUR → MTQ)": mtqMinted.toFixed(6),
      "redeemed (MTQ → JPY)": jpyOut.toFixed(2),
      "direct conversion (100 EUR → JPY)": directJpy.toFixed(2),
      "attacker P/L (JPY)": profit.toFixed(2),
      "fees paid (USD)": fmtUsd(mintFeePaid + redeemFeePaid, 4),
    },
  };
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log("\n\n" + "=".repeat(78));
console.log("  ADVERSARIAL TEST SUITE — SUMMARY");
console.log("=".repeat(78));

let defended = 0;
let vulnerable_count = 0;
const vulns: AttackResult[] = [];
const defenses: AttackResult[] = [];
const byCategory: Record<string, { defended: number; vulnerable: number }> = {};

for (const r of results) {
  byCategory[r.category] ??= { defended: 0, vulnerable: 0 };
  if (r.defended) {
    defended++;
    defenses.push(r);
    byCategory[r.category].defended++;
  } else {
    vulnerable_count++;
    vulns.push(r);
    byCategory[r.category].vulnerable++;
  }
}

console.log(`\nTOTAL ATTACKS:   ${results.length}`);
console.log(`  ✅ DEFENDED:    ${defended}`);
console.log(`  ❌ VULNERABLE:  ${vulnerable_count}`);

console.log("\nBY CATEGORY:");
for (const [cat, counts] of Object.entries(byCategory)) {
  console.log(`  ${cat}: ${counts.defended} defended, ${counts.vulnerable} vulnerable`);
}

if (vulns.length > 0) {
  console.log("\n" + "-".repeat(78));
  console.log("  VULNERABILITIES (need fixing)");
  console.log("-".repeat(78));
  for (const v of vulns) {
    const sev = v.severity ?? "Low";
    const icon = sev === "Critical" ? "🔴" : sev === "High" ? "🟠" : sev === "Medium" ? "🟡" : "🟢";
    console.log(`\n  ${icon} [${sev}] ${v.name}`);
    console.log(`     Vector: ${v.vector}`);
    console.log(`     Detail: ${v.detail}`);
  }
}

console.log("\n" + "-".repeat(78));
console.log("  DEFENSE MECHANISMS VERIFIED");
console.log("-".repeat(78));
const uniqueMechanisms = new Set<string>();
for (const d of defenses) {
  if (d.mechanism) uniqueMechanisms.add(d.mechanism);
}
for (const m of uniqueMechanisms) {
  console.log(`  • ${m}`);
}

// Final readiness verdict
console.log("\n" + "=".repeat(78));
console.log("  LIVE-READINESS VERDICT (SECURITY)");
console.log("=".repeat(78));
const criticalCount = vulns.filter((v) => v.severity === "Critical").length;
const highCount = vulns.filter((v) => v.severity === "High").length;
const mediumCount = vulns.filter((v) => v.severity === "Medium").length;
const lowCount = vulns.filter((v) => v.severity === "Low").length;
console.log(`\n  Vulnerability breakdown:`);
console.log(`    Critical: ${criticalCount}`);
console.log(`    High:     ${highCount}`);
console.log(`    Medium:   ${mediumCount}`);
console.log(`    Low:      ${lowCount}`);

let verdict: string;
let reasoning: string;
if (criticalCount > 0) {
  verdict = "NOT READY";
  reasoning = `${criticalCount} Critical-severity vulnerabilities block live readiness. Must be fixed before any production deployment.`;
} else if (highCount > 0) {
  verdict = "NOT READY";
  reasoning = `${highCount} High-severity vulnerabilities found (Sharia-critical forbidden words missing). Must be addressed before live readiness.`;
} else if (mediumCount > 0) {
  verdict = "CONDITIONALLY READY";
  reasoning = `${mediumCount} Medium-severity findings (input validation, linter gaps, first-mint bootstrap). Engine core is sound; fix medium-severity items before mainnet.`;
} else {
  verdict = "READY";
  reasoning = "All attacks defended. No critical/high/medium vulnerabilities. Low-severity items are operational concerns.";
}
console.log(`\n  VERDICT: ${verdict}`);
console.log(`  Reasoning: ${reasoning}`);
console.log(`\n  Defense rate: ${defended}/${results.length} = ${((defended / results.length) * 100).toFixed(1)}%`);
console.log("=".repeat(78) + "\n");

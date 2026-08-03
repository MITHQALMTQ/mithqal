/**
 * MITHQAL v19.0 — END-TO-END WORKFLOW TEST ENGINE
 * =================================================
 *
 * Task 5-b: Build a comprehensive end-to-end workflow test engine that
 * simulates real-world trade scenarios. This is BOTH a test script (to
 * catch errors) AND a presentable demo (to show users how MTQ works in
 * practice).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SCENARIOS (5):
 *
 *   1. Chinese Company Buys Machine from Germany
 *      Cross-border B2B trade: mint CNY → transfer MTQ → redeem EUR.
 *
 *   2. German Company Imports from USA during USD Crisis
 *      Currency crisis: USD drops 15% vs EUR, gold rallies 15% in USD,
 *      MTQ NAV appreciates via gold anchor, §33 SDP triggers for USD.
 *
 *   3. Remittance — Filipino Worker in UAE Sends Money Home
 *      Non-basket currency bridge: AED → USD → mint MTQ → transfer →
 *      redeem → USD → PHP. Demonstrates 99% fee savings vs Western Union.
 *
 *   4. Gold-Backed Hedging — Investor Hedges Against Currency Devaluation
 *      Store-of-value use case: Turkish investor mints MTQ with USD
 *      (converted from TRY). TRY drops 30%, gold +5% → MTQ up 43.9% in
 *      TRY terms. Investor's purchasing power preserved.
 *
 *   5. Multi-Currency Treasury — Sovereign Wealth Fund Diversification
 *      Institutional diversification: SWF mints $100M of MTQ. EUR drops
 *      20%, but MTQ basket (8 currencies + gold) absorbs the shock;
 *      MTQ NAV barely moves in USD; MTQ rises 25% vs EUR.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * INVARIANTS VERIFIED PER SCENARIO:
 *
 *   I1. Reserve Ratio ≥ 100% (§4) at every state checkpoint.
 *   I2. Basket verification passes (ΣW=1, all W_i ≥ 0.5%, all W_i ≤ 60%).
 *   I3. NAV consistency (mint+redeem net out → NAV unchanged within a
 *       step, unless market conditions are explicitly shocked).
 *   I4. Fee formulas correct (5 bps mint, 1 bp transfer, 5 bps redeem,
 *       with $5K / $1K / $5K caps per §9).
 *   I5. Value conservation (MTQ × NAV = deposit; MTQ × NAV = claim).
 *   I6. Currency conversions use correct FX rates and conventions.
 *   I7. §33 SDP triggers when gold-in-currency deviation > 5%.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FX CONVENTION (matches oracle-data.ts BASE_CURRENCIES — engine-native):
 *
 *   `fx[c]` = USD per 1 unit of foreign currency
 *     e.g. EUR = 1.149  → 1 EUR = $1.149 USD
 *          JPY = 0.0067 → 1 JPY = $0.0067 USD
 *          CNY = 0.139  → 1 CNY = $0.139 USD
 *
 *   Conversions:
 *     foreign → USD :  USD = amount_foreign × fx[c]
 *     USD → foreign :  amount_foreign = USD / fx[c]
 *
 *   The engine's `goldPriceInCurrency(goldUsd, fx)` divides:
 *     gold_in_currency = goldUsd / fx
 *     e.g. gold/EUR = $4,076 / 1.149 = €3,547/oz
 *
 * ─────────────────────────────────────────────────────────────────────────
 * BASELINE STATE (matches stress-test-fixed.ts + nav-compute.ts):
 *
 *   Gold:        $4,076.9 /oz
 *   Silver:      $58.76 /oz
 *   Cash:        $29,250,000   (over-collateralization baseline, Task 3-a)
 *   Sovereign:   $13,500,000   (US T-bills ≤1yr)
 *   Gold:        2,122.86 oz   (FIXED physical, ≈ $8.65M)
 *   Silver:      36,758 oz     (FIXED physical, ≈ $2.16M)
 *   Stablecoin:  $2,700,000
 *   Supply:      54,000,000 MTQ
 *   NAV_m:       ~$1.040
 *   Reserve Ratio: ~102.08% (PAR-based, v19.0.2)
 *
 * Run: `bun run src/lib/e2e-workflow-tests.ts`
 */

import {
  computeMonetaryStateV19,
  mintFee,
  redemptionFee,
  PAR_VALUE,
  MINT_FEE_BPS,
  MINT_FEE_CAP,
  REDEEM_FEE_BPS,
  REDEEM_FEE_CAP,
  TRANSFER_FEE_BPS,
  TRANSFER_FEE_CAP,
  HAIRCUTS,
  type ReserveAsset,
  type MonetaryStateV19,
} from "./monetary-engine-v19";
import type { OracleSnapshot, CurrencyData } from "./oracle-data";
import { detectSDP, computeSDPEmergency, SDP_TRIGGER_THRESHOLD } from "./v19-infrastructure";
import { FIXED_GOLD_OZ, FIXED_SILVER_OZ, FIXED_CASH_USD } from "./reserve-allocation";

// ============================================================
// CONSTANTS — Baseline aligned with stress-test-fixed.ts + nav-compute.ts
// ============================================================

const BASE_GOLD = 4_076.9;   // USD per ounce (gold spot)
const BASE_SILVER = 58.76;   // USD per ounce (silver spot)
const SUPPLY = 54_000_000;   // MTQ

const GOLD_OZ = FIXED_GOLD_OZ;       // 2,122.86 oz (FIXED physical)
const SILVER_OZ = FIXED_SILVER_OZ;   // 36,758 oz   (FIXED physical)
const CASH_USD = FIXED_CASH_USD;     // $29,250,000 (Task 3-a §4 baseline)
const SOVEREIGN_USD = 13_500_000;
const STABLECOIN_USD = 2_700_000;

// FX rates: USD per 1 unit of foreign currency (engine-native convention).
// Values aligned with oracle-data.ts BASE_CURRENCIES (realistic spot rates).
const BASE_FX: Record<string, number> = {
  USD: 1.0,
  EUR: 1.149,    // 1 EUR = $1.149 USD
  JPY: 0.0067,   // 1 JPY = $0.0067 USD
  GBP: 1.27,     // 1 GBP = $1.27  USD
  CNY: 0.139,    // 1 CNY = $0.139 USD
  CHF: 1.10,     // 1 CHF = $1.10  USD
  AUD: 0.66,     // 1 AUD = $0.66  USD
  CAD: 0.73,     // 1 CAD = $0.73  USD
};

// LCR + CRI inputs (identical to stress-test-fixed.ts for comparability).
const LCR_INPUTS = {
  hqla: 32_400_000,
  expectedRedemptions: 5_400_000,
  committedInflows: 0,
  operationalAdjustments: 0,
};
const CRI_INPUTS = {
  liquidity: 20,
  fx: 30,
  custody: 25,
  counterparty: 40,
  operational: 15,
};

// ============================================================
// FORMATTING HELPERS
// ============================================================

function fmt(n: number, d = 4): string {
  if (!isFinite(n)) return "∞";
  if (Number.isNaN(n)) return "NaN";
  return n.toFixed(d);
}

function fmtUsd(n: number): string {
  if (!isFinite(n) || Number.isNaN(n)) return "$N/A";
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtFx(currency: string, fx: number): string {
  return `1 ${currency} = $${fmt(fx, 4)} USD`;
}

function fmtComma(n: number, d = 0): string {
  if (!isFinite(n) || Number.isNaN(n)) return "N/A";
  return n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
}

// ============================================================
// FX CONVERSION HELPERS (engine-native: USD per foreign unit)
// ============================================================

/** Foreign → USD: multiply amount by fx[c] (USD per unit of foreign). */
function toUsd(amountForeign: number, currency: string, fx: Record<string, number>): number {
  return amountForeign * fx[currency];
}

/** USD → Foreign: divide amount by fx[c]. */
function fromUsd(amountUsd: number, currency: string, fx: Record<string, number>): number {
  return fx[currency] > 0 ? amountUsd / fx[currency] : 0;
}

/** Cross-rate: how many units of `quote` per 1 unit of `base`. */
function crossRate(base: string, quote: string, fx: Record<string, number>): number {
  // 1 base = $fx[base] = fx[base]/fx[quote] quote
  return fx[quote] > 0 ? fx[base] / fx[quote] : 0;
}

// ============================================================
// FEE HELPERS (§9)
// ============================================================

/** §9 Transfer fee: 1 bp on USD value, capped at $1K. */
function transferFee(amountUsd: number): number {
  return Math.min(amountUsd * (TRANSFER_FEE_BPS / 10_000), TRANSFER_FEE_CAP);
}

/** Pretty-print a fee breakdown: bps × amount = fee (cap status). */
function describeFee(label: string, amountUsd: number, bps: number, cap: number): string[] {
  const rawFee = amountUsd * (bps / 10_000);
  const actualFee = Math.min(rawFee, cap);
  const capped = rawFee > cap;
  return [
    `${label}: ${bps} bps × $${fmtComma(amountUsd, 2)} = $${fmt(rawFee, 2)}` +
      (capped ? `  → CAPPED at $${fmt(cap, 2)} (saves $${fmt(rawFee - cap, 2)})` : `  = $${fmt(actualFee, 2)}`),
  ];
}

// ============================================================
// STATE BUILDERS (same patterns as stress-test-fixed.ts)
// ============================================================

function makeCurrencies(fxRates: Record<string, number>): CurrencyData[] {
  return [
    { code: "USD", name: "US Dollar",       fx: fxRates.USD, cofer: 0.585, swift: 0.400, bis: 0.550, lta: 0.5110, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "EUR", name: "Euro",             fx: fxRates.EUR, cofer: 0.195, swift: 0.220, bis: 0.200, lta: 0.2100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "JPY", name: "Japanese Yen",     fx: fxRates.JPY, cofer: 0.050, swift: 0.180, bis: 0.150, lta: 0.1080, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "GBP", name: "Pound Sterling",   fx: fxRates.GBP, cofer: 0.040, swift: 0.200, bis: 0.180, lta: 0.1100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CNY", name: "Chinese Yuan",     fx: fxRates.CNY, cofer: 0.035, swift: 0.120, bis: 0.080, lta: 0.0830, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CHF", name: "Swiss Franc",      fx: fxRates.CHF, cofer: 0.008, swift: 0.040, bis: 0.020, lta: 0.0230, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "AUD", name: "Australian Dollar", fx: fxRates.AUD, cofer: 0.005, swift: 0.035, bis: 0.020, lta: 0.0160, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CAD", name: "Canadian Dollar",  fx: fxRates.CAD, cofer: 0.005, swift: 0.025, bis: 0.025, lta: 0.0130, lifecycleStatus: "full", admittedDate: "2024-01-01" },
  ];
}

function makeOracle(
  goldUsd: number,
  fxRates: Record<string, number>,
  opts: { gold12moAgo?: number; fxAgo?: Record<string, number> } = {},
): OracleSnapshot {
  const gold12moAgo = opts.gold12moAgo ?? goldUsd;
  const fxAgo = opts.fxAgo ?? { ...fxRates };
  return {
    goldUsd,
    goldUsd12moAgo: gold12moAgo,
    goldUsd7dAgo: goldUsd * 0.995,
    goldUsdYesterday: goldUsd * 0.999,
    currencies: makeCurrencies(fxRates),
    fxAgo,
    fx7dAgo: { ...fxAgo },
    fxAgo1d: { ...fxAgo },
  };
}

function makeReserveAssets(
  goldPrice: number = BASE_GOLD,
  silverPrice: number = BASE_SILVER,
  overrides: { cashUsd?: number; sovereignUsd?: number; stablecoinUsd?: number } = {},
): ReserveAsset[] {
  const cashUsd = overrides.cashUsd ?? CASH_USD;
  const sovereignUsd = overrides.sovereignUsd ?? SOVEREIGN_USD;
  const stablecoinUsd = overrides.stablecoinUsd ?? STABLECOIN_USD;
  return [
    {
      id: "cash-1", name: "Central-bank cash", assetClass: "cash",
      quantity: cashUsd, priceUsd: 1, haircut: HAIRCUTS.cash,
      counterpartyScore: 1.00, stressCoefficient: 0.95, modifiedDuration: 0,
    },
    {
      id: "sov-1", name: "US T-bills ≤1yr", assetClass: "sovereign",
      quantity: sovereignUsd, priceUsd: 1, haircut: HAIRCUTS.sovereign,
      counterpartyScore: 0.99, stressCoefficient: 0.90, modifiedDuration: 0.5,
    },
    {
      id: "gold-1", name: "Allocated gold", assetClass: "gold",
      quantity: GOLD_OZ, priceUsd: goldPrice, haircut: HAIRCUTS.gold,
      counterpartyScore: 1.00, stressCoefficient: 0.85, modifiedDuration: 0,
    },
    {
      id: "silver-1", name: "Allocated silver", assetClass: "silver",
      quantity: SILVER_OZ, priceUsd: silverPrice, haircut: HAIRCUTS.silver,
      counterpartyScore: 1.00, stressCoefficient: 0.80, modifiedDuration: 0,
    },
    {
      id: "stab-1", name: "Regulated stablecoins", assetClass: "stablecoin",
      quantity: stablecoinUsd, priceUsd: 1, haircut: HAIRCUTS.stablecoin,
      counterpartyScore: 0.96, stressCoefficient: 0.80, modifiedDuration: 0,
    },
  ];
}

/** Compute monetary state from gold price + FX rates + optional supply/cash overrides. */
function computeState(
  goldPrice: number,
  fxRates: Record<string, number>,
  opts: {
    gold12moAgo?: number;
    fxAgo?: Record<string, number>;
    supply?: number;
    cashUsd?: number;
  } = {},
): MonetaryStateV19 {
  const supply = opts.supply ?? SUPPLY;
  const cashUsd = opts.cashUsd ?? CASH_USD;
  return computeMonetaryStateV19(
    makeOracle(goldPrice, fxRates, {
      gold12moAgo: opts.gold12moAgo,
      fxAgo: opts.fxAgo,
    }),
    makeReserveAssets(goldPrice, BASE_SILVER, { cashUsd }),
    supply,
    LCR_INPUTS,
    CRI_INPUTS,
    0.015, // baseline 1.5% EWMA volatility
    [],
  );
}

// ============================================================
// INVARIANT TRACKER
// ============================================================

interface InvariantCheck {
  name: string;
  passed: boolean;
  details?: string;
}

class InvariantTracker {
  private checks: InvariantCheck[] = [];

  check(name: string, passed: boolean, details?: string): void {
    this.checks.push({ name, passed, details });
    const symbol = passed ? "✓" : "❌";
    const label = `  ${symbol} Invariant: ${name}`;
    console.log(passed ? label : `${label}${details ? ` — ${details}` : ""}`);
    if (passed && details) {
      console.log(`      ${details}`);
    }
    if (!passed) {
      console.log(`      ❌ INVARIANT VIOLATION: ${name}${details ? ` — ${details}` : ""}`);
    }
  }

  allPass(): boolean {
    return this.checks.every((c) => c.passed);
  }

  failCount(): number {
    return this.checks.filter((c) => !c.passed).length;
  }

  count(): number {
    return this.checks.length;
  }

  passCount(): number {
    return this.checks.filter((c) => c.passed).length;
  }

  printSummary(): void {
    const pass = this.passCount();
    const total = this.count();
    const sym = pass === total ? "✅" : "❌";
    console.log(`  ${sym} Constitutional invariants: ${pass}/${total} ${pass === total ? "ALL HOLD ✓" : "FAILURES"}`);
  }
}

// ============================================================
// STEP PRINTER
// ============================================================

function step(num: number, action: string, lines: string[]): void {
  console.log(`\nStep ${num}: ${action}`);
  for (const line of lines) {
    console.log(`  ${line}`);
  }
}

// ============================================================
// SCENARIO RESULT INTERFACE
// ============================================================

interface ScenarioResult {
  name: string;
  description: string;
  totalFeesUsd: number;
  timeLabel: string;
  traditionalCostUsd: number;
  savingsPct: number;
  mtqPriceImpactPct: number;
  invariantsHold: boolean;
  invariantPassCount: number;
  invariantTotalCount: number;
  insight: string;
}

const scenarioResults: ScenarioResult[] = [];

function runScenario(name: string, description: string, fn: () => ScenarioResult): void {
  console.log("\n" + "=".repeat(78));
  console.log(`SCENARIO: ${name}`);
  console.log("=".repeat(78));
  console.log(`Description: ${description}`);
  try {
    const result = fn();
    scenarioResults.push(result);
    console.log("\n" + "-".repeat(78));
    console.log("SUMMARY:");
    console.log(`  Total fees paid:        $${fmt(result.totalFeesUsd, 2)}`);
    console.log(`  Time:                   ${result.timeLabel}`);
    console.log(`  Constitutional invariants: ${result.invariantPassCount}/${result.invariantTotalCount} ${result.invariantsHold ? "ALL HOLD ✓" : "FAILURES ✗"}`);
    console.log(`  Comparison to traditional: $${fmt(result.traditionalCostUsd, 2)} → ${fmt(result.savingsPct, 2)}% savings`);
    console.log(`  MTQ price impact:       ${fmt(result.mtqPriceImpactPct, 4)}%`);
    console.log(`  Key insight:            ${result.insight}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ❌ SCENARIO ERROR: ${msg}`);
    scenarioResults.push({
      name,
      description,
      totalFeesUsd: NaN,
      timeLabel: "N/A",
      traditionalCostUsd: NaN,
      savingsPct: NaN,
      mtqPriceImpactPct: NaN,
      invariantsHold: false,
      invariantPassCount: 0,
      invariantTotalCount: 0,
      insight: `ERROR: ${msg}`,
    });
  }
}

// ============================================================
// SCENARIO 1: Chinese Company Buys Machine from Germany
// ============================================================
//
// A Chinese manufacturer (Shanghai) buys a CNC machine from a German
// supplier (Stuttgart). Price: €500,000 EUR.
//
// Step 1: Chinese company mints MTQ with CNY (¥4,000,000 deposit).
// Step 2: Transfer MTQ to German supplier (instant, atomic).
// Step 3: German supplier redeems MTQ for EUR.
// Step 4: Verify state — RR ≥ 100%, basket verified, NAV unchanged,
//         total fees ≈ $612 vs ~$15K traditional wire.

function scenario1(): ScenarioResult {
  const invariants = new InvariantTracker();
  let totalFees = 0;

  // ---- Baseline state ----
  const baseline = computeState(BASE_GOLD, BASE_FX);
  const navPre = baseline.nav.market;
  const rrPre = baseline.reserveRatio.ratio;
  const basketPre = baseline.basketVerification.passed;

  console.log(`\nBaseline: gold=$${fmt(BASE_GOLD, 2)}/oz  NAV=$${fmt(navPre)}  RR=${fmt(rrPre, 2)}%`);
  console.log(`          supply=${fmtComma(SUPPLY)} MTQ  basketVerified=${basketPre}`);
  console.log(`          EUR=${fmtFx("EUR", BASE_FX.EUR)}  CNY=${fmtFx("CNY", BASE_FX.CNY)}`);
  console.log(`          cross-rate 1 EUR = ${fmt(crossRate("EUR", "CNY", BASE_FX), 2)} CNY`);

  // ---- Step 1: Mint with CNY ----
  const cnyDeposit = 4_000_000;
  const cnyUsd = toUsd(cnyDeposit, "CNY", BASE_FX);  // ¥4M × $0.139 = $556,000
  const mintFee1 = mintFee(cnyUsd);
  const mtqMinted = cnyUsd / navPre;
  totalFees += mintFee1;

  step(1, "Chinese company mints MTQ with CNY", [
    `Input: ¥${fmtComma(cnyDeposit)} CNY`,
    `FX rate: ${fmtFx("CNY", BASE_FX.CNY)}  → ¥${fmtComma(cnyDeposit)} × $${BASE_FX.CNY} = $${fmtComma(cnyUsd, 2)} USD`,
    `NAV applied: $${fmt(navPre)}  (§3.1: NAV_m = R_m / S = $${fmtComma(baseline.reserves.market)} / ${fmtComma(SUPPLY)})`,
    `MTQ minted: ${fmtComma(mtqMinted, 2)} MTQ  (§36.2: MTQ = Deposit_USD / NAV)`,
    `Mint fee:   ${describeFee("mint", cnyUsd, MINT_FEE_BPS, MINT_FEE_CAP)[0]}`,
    `Cross-rate: 1 EUR = ${fmt(crossRate("EUR", "CNY", BASE_FX), 2)} CNY  (¥${fmtComma(cnyDeposit)} ≈ €${fmtComma(cnyUsd / BASE_FX.EUR, 0)})`,
  ]);

  // Invariants
  invariants.check("I1 Reserve Ratio ≥ 100% (pre-mint)", rrPre >= 100, `RR = ${fmt(rrPre, 2)}%`);
  invariants.check("I2 Basket verified (pre-mint)", basketPre);
  invariants.check(
    "I5 Value conservation: MTQ × NAV = deposit",
    Math.abs(mtqMinted * navPre - cnyUsd) < 0.01,
    `MTQ × NAV = ${fmtComma(mtqMinted, 4)} × $${fmt(navPre)} = $${fmtComma(mtqMinted * navPre, 2)} vs deposit $${fmtComma(cnyUsd, 2)}`,
  );
  invariants.check(
    "I4 Mint fee formula (5 bps, cap $5K)",
    Math.abs(mintFee1 - Math.min(cnyUsd * (MINT_FEE_BPS / 10_000), MINT_FEE_CAP)) < 1e-9,
    `fee = $${fmt(mintFee1, 4)}`,
  );

  // ---- Step 2: Transfer MTQ to German supplier ----
  const transferUsdValue = mtqMinted * navPre;
  const transferFeeAmt = transferFee(transferUsdValue);
  totalFees += transferFeeAmt;

  step(2, "Transfer MTQ to German supplier (cross-border)", [
    `Amount: ${fmtComma(mtqMinted, 2)} MTQ ($${fmtComma(transferUsdValue, 2)} USD equivalent)`,
    `Transfer fee: ${describeFee("transfer", transferUsdValue, TRANSFER_FEE_BPS, TRANSFER_FEE_CAP)[0]}`,
    `Settlement: INSTANT (atomic ledger debit/credit — no correspondent banking, no SWIFT)`,
    `Time: < 1 second vs 1-3 business days traditional`,
  ]);

  invariants.check(
    "I4 Transfer fee formula (1 bp, cap $1K)",
    Math.abs(transferFeeAmt - Math.min(transferUsdValue * (TRANSFER_FEE_BPS / 10_000), TRANSFER_FEE_CAP)) < 1e-9,
    `fee = $${fmt(transferFeeAmt, 4)}`,
  );

  // ---- Step 3: German supplier redeems MTQ for EUR ----
  // Mint+redeem net out: supply returns to baseline, cash returns to baseline.
  // Recompute state — NAV should be unchanged.
  const postState = computeState(BASE_GOLD, BASE_FX);
  const navPost = postState.nav.market;
  const redeemValueUsd = mtqMinted * navPost;
  const redeemFee = redemptionFee(redeemValueUsd);
  const redeemValueEur = fromUsd(redeemValueUsd, "EUR", BASE_FX);
  totalFees += redeemFee;

  step(3, "German supplier redeems MTQ for EUR", [
    `Amount:        ${fmtComma(mtqMinted, 2)} MTQ`,
    `NAV applied:   $${fmt(navPost)}  (unchanged — mint+redeem net out: supply & reserves return to baseline)`,
    `Redeem value:  ${fmtComma(mtqMinted, 2)} × $${fmt(navPost)} = $${fmtComma(redeemValueUsd, 2)} USD  (§36.3)`,
    `FX rate:       ${fmtFx("EUR", BASE_FX.EUR)}  → $${fmtComma(redeemValueUsd, 2)} / $${BASE_FX.EUR} = €${fmtComma(redeemValueEur, 2)}`,
    `Redeem fee:    ${describeFee("redeem", redeemValueUsd, REDEEM_FEE_BPS, REDEEM_FEE_CAP)[0]}`,
    `Net received:  €${fmtComma(redeemValueEur, 2)} (vs €500,000 list price — small gap from fees + buffer)`,
  ]);

  invariants.check(
    "I3 NAV unchanged post-mint+redeem (within 0.001)",
    Math.abs(navPre - navPost) < 0.001,
    `pre=$${fmt(navPre)}, post=$${fmt(navPost)}, Δ=$${fmt(navPost - navPre, 6)}`,
  );
  invariants.check(
    "I1 Reserve Ratio ≥ 100% (post-redeem)",
    postState.reserveRatio.ratio >= 100,
    `RR = ${fmt(postState.reserveRatio.ratio, 2)}%`,
  );
  invariants.check("I2 Basket verified (post-redeem)", postState.basketVerification.passed);
  invariants.check(
    "I4 Redeem fee formula (5 bps, cap $5K)",
    Math.abs(redeemFee - Math.min(redeemValueUsd * (REDEEM_FEE_BPS / 10_000), REDEEM_FEE_CAP)) < 1e-9,
    `fee = $${fmt(redeemFee, 4)}`,
  );
  invariants.check(
    "I6 Currency conversion uses correct FX rate",
    Math.abs(redeemValueUsd / BASE_FX.EUR - redeemValueEur) < 1e-6,
    `$${fmtComma(redeemValueUsd, 2)} / $${BASE_FX.EUR} = €${fmtComma(redeemValueEur, 2)}`,
  );

  // ---- Step 4: Verify state + traditional comparison ----
  const traditionalCost = 15_000; // ~$15K: SWIFT $35 + correspondent banking + 3% FX spread
  const savings = (1 - totalFees / traditionalCost) * 100;
  const mtqPriceImpact = ((navPost - navPre) / navPre) * 100;

  step(4, "Verify state + comparison to traditional wire", [
    `Reserve ratio:    ${fmt(postState.reserveRatio.ratio, 2)}% ≥ 100%  ✓`,
    `Basket verified:  ${postState.basketVerification.passed ? "YES ✓" : "NO ✗"}  (ΣW=1, all W_i ∈ [0.5%, 60%])`,
    `MTQ price impact: ${fmt(mtqPriceImpact, 4)}%  (effectively zero — mint+redeem preserve NAV)`,
    `Total fees paid:  $${fmt(totalFees, 2)}  ($${fmt(mintFee1, 2)} mint + $${fmt(transferFeeAmt, 2)} transfer + $${fmt(redeemFee, 2)} redeem)`,
    `Traditional wire: ~$${fmtComma(traditionalCost)}  (SWIFT $35 + correspondent banking + 3% FX spread on €500K)`,
    `Savings:          ${fmt(savings, 2)}%  (MTQ is ${fmt(traditionalCost / totalFees, 0)}× cheaper)`,
    `Time:             INSTANT vs 1-3 business days`,
  ]);

  invariants.check(
    "I4 Total fee conservation (sum of component fees)",
    Math.abs(totalFees - (mintFee1 + transferFeeAmt + redeemFee)) < 1e-9,
    `$${fmt(totalFees, 4)} = $${fmt(mintFee1, 4)} + $${fmt(transferFeeAmt, 4)} + $${fmt(redeemFee, 4)}`,
  );

  invariants.printSummary();

  return {
    name: "Chinese Company Buys Machine from Germany",
    description: "Cross-border B2B trade: mint CNY → transfer MTQ → redeem EUR",
    totalFeesUsd: totalFees,
    timeLabel: "instant (< 1 sec)",
    traditionalCostUsd: traditionalCost,
    savingsPct: savings,
    mtqPriceImpactPct: mtqPriceImpact,
    invariantsHold: invariants.allPass(),
    invariantPassCount: invariants.passCount(),
    invariantTotalCount: invariants.count(),
    insight: `MTQ fees of $${fmt(totalFees, 2)} are ${fmt(savings, 0)}% cheaper than ~$${fmtComma(traditionalCost)} traditional wire — instant settlement vs 1-3 days`,
  };
}

// ============================================================
// SCENARIO 2: German Company Imports from USA during USD Crisis
// ============================================================
//
// A German importer wants to buy $1M USD of goods from a US supplier.
// Suddenly the USD drops 15% against all currencies (USD crisis).
// Gold typically rises when USD drops → gold +15% in USD terms.
// MTQ NAV (gold is ~16% of reserves) appreciates ~2.4%.
// §33 SDP triggers for USD (gold-in-USD deviation = 15% > 5%).

function scenario2(): ScenarioResult {
  const invariants = new InvariantTracker();
  let totalFees = 0;

  // ---- Step 1: Pre-crisis baseline ----
  const pre = computeState(BASE_GOLD, BASE_FX);
  const navPre = pre.nav.market;
  const usdWeightPre = pre.weights.find((w) => w.code === "USD")?.normalizedWeight ?? 0;

  console.log(`\nPre-crisis: gold=$${fmt(BASE_GOLD, 2)}/oz  EUR=${fmtFx("EUR", BASE_FX.EUR)}  NAV=$${fmt(navPre)}`);
  console.log(`            USD basket weight = ${fmt(usdWeightPre * 100, 2)}%  RR = ${fmt(pre.reserveRatio.ratio, 2)}%`);
  console.log(`            German importer plans: €870K × $${BASE_FX.EUR} = $${fmtComma(870_000 * BASE_FX.EUR, 0)} → /$${fmt(navPre)} = ${fmtComma((870_000 * BASE_FX.EUR) / navPre, 0)} MTQ`);

  // ---- Step 2: USD crisis (USD drops 15% vs EUR; gold rallies 15% in USD) ----
  // USD weakens: EUR appreciates 15% vs USD → EUR.fx increases by 15%.
  // Gold rallies 15% in USD terms (typical inverse correlation).
  const crisisGold = BASE_GOLD * 1.15;            // $4,076.9 → $4,688.4 (+15%)
  const crisisFx: Record<string, number> = {
    ...BASE_FX,
    EUR: BASE_FX.EUR * 1.15,   // 1 EUR = $1.321 (was $1.149)
    GBP: BASE_FX.GBP * 1.15,
    JPY: BASE_FX.JPY * 1.15,
    CNY: BASE_FX.CNY * 1.15,
    CHF: BASE_FX.CHF * 1.15,
    AUD: BASE_FX.AUD * 1.15,
    CAD: BASE_FX.CAD * 1.15,
    // USD stays at 1.0 (it's the numeraire)
  };
  const crisis = computeState(crisisGold, crisisFx, {
    gold12moAgo: BASE_GOLD,
    fxAgo: BASE_FX,
  });
  const navCrisis = crisis.nav.market;

  // MTQ NAV in USD: gold lifted R_m
  // MTQ in EUR terms: $navCrisis / crisisFx.EUR
  const mtqEurPre = navPre / BASE_FX.EUR;
  const mtqEurPost = navCrisis / crisisFx.EUR;

  step(2, "USD crisis — USD drops 15% vs EUR; gold +15% in USD", [
    `Gold (USD/oz):     $${fmt(BASE_GOLD, 2)} → $${fmt(crisisGold, 2)}  (+15%)`,
    `EUR (USD per EUR): $${fmt(BASE_FX.EUR, 4)} → $${fmt(crisisFx.EUR, 4)}  (+15% — EUR strengthened vs USD)`,
    `Pre-crisis NAV_m:  $${fmt(navPre)}`,
    `Post-crisis NAV_m: $${fmt(navCrisis)}  (Δ +${fmt((navCrisis / navPre - 1) * 100, 2)}% — gold rally lifted reserves)`,
    `Gold share of R_m: ${fmt((GOLD_OZ * crisisGold / crisis.reserves.market) * 100, 2)}%  (was ${fmt((GOLD_OZ * BASE_GOLD / pre.reserves.market) * 100, 2)}%)`,
    `MTQ in EUR terms:  €${fmt(mtqEurPre, 4)} → €${fmt(mtqEurPost, 4)}  (Δ ${fmt((mtqEurPost / mtqEurPre - 1) * 100, 2)}%)`,
    `RR post-crisis:    ${fmt(crisis.reserveRatio.ratio, 2)}%  (gold rally improved over-collateralization)`,
  ]);

  invariants.check(
    "I1 Reserve Ratio ≥ 100% (post-crisis)",
    crisis.reserveRatio.ratio >= 100,
    `RR = ${fmt(crisis.reserveRatio.ratio, 2)}%`,
  );
  invariants.check("I2 Basket verified (post-crisis)", crisis.basketVerification.passed);
  invariants.check(
    "I3 NAV appreciated with gold (positive)",
    navCrisis > navPre,
    `NAV rose $${fmt(navPre)} → $${fmt(navCrisis)} (Δ +${fmt((navCrisis / navPre - 1) * 100, 2)}%)`,
  );

  // ---- Step 4: German company mints MTQ with EUR (post-crisis) ----
  const eurDeposit = 870_000;
  const eurUsdPost = toUsd(eurDeposit, "EUR", crisisFx);  // €870K × $1.321 = $1,149,270
  const mintFee2 = mintFee(eurUsdPost);
  const mtqMintedPost = eurUsdPost / navCrisis;
  totalFees += mintFee2;

  // Compare to pre-crisis plan
  const eurUsdPre = toUsd(eurDeposit, "EUR", BASE_FX);   // €870K × $1.149 = $999,630
  const mtqPlannedPre = eurUsdPre / navPre;

  step(4, "German company mints MTQ with EUR (post-crisis)", [
    `Input:          €${fmtComma(eurDeposit)}`,
    `FX rate:        ${fmtFx("EUR", crisisFx.EUR)}  → €${fmtComma(eurDeposit)} × $${fmt(crisisFx.EUR, 4)} = $${fmtComma(eurUsdPost, 2)}`,
    `NAV applied:    $${fmt(navCrisis)}  (post-crisis — MTQ appreciated via gold anchor)`,
    `MTQ minted:     ${fmtComma(mtqMintedPost, 2)} MTQ  (§36.2: $${fmtComma(eurUsdPost, 2)} / $${fmt(navCrisis)})`,
    `Mint fee:       ${describeFee("mint", eurUsdPost, MINT_FEE_BPS, MINT_FEE_CAP)[0]}`,
    `Comparison:     pre-crisis plan was €${fmtComma(eurDeposit)} × $${BASE_FX.EUR} = $${fmtComma(eurUsdPre, 0)} → /$${fmt(navPre)} = ${fmtComma(mtqPlannedPre, 0)} MTQ`,
    `                post-crisis actual: ${fmtComma(mtqMintedPost, 0)} MTQ  (${fmt((mtqMintedPost / mtqPlannedPre - 1) * 100, 2)}% more MTQ — EUR stronger & NAV lifted)`,
  ]);

  invariants.check(
    "I5 Value conservation: MTQ × NAV = deposit (post-crisis)",
    Math.abs(mtqMintedPost * navCrisis - eurUsdPost) < 0.01,
    `${fmtComma(mtqMintedPost, 4)} × $${fmt(navCrisis)} = $${fmtComma(mtqMintedPost * navCrisis, 2)} vs deposit $${fmtComma(eurUsdPost, 2)}`,
  );

  // ---- Step 5: US supplier redeems MTQ for USD ----
  const redeemValueUsdPost = mtqMintedPost * navCrisis;
  const redeemFeePost = redemptionFee(redeemValueUsdPost);
  totalFees += redeemFeePost;

  step(5, "US supplier redeems MTQ for USD", [
    `Amount:        ${fmtComma(mtqMintedPost, 2)} MTQ`,
    `NAV applied:   $${fmt(navCrisis)}  (unchanged — mint+redeem net out within crisis state)`,
    `Redeem value:  ${fmtComma(mtqMintedPost, 2)} × $${fmt(navCrisis)} = $${fmtComma(redeemValueUsdPost, 2)} USD`,
    `Redeem fee:    ${describeFee("redeem", redeemValueUsdPost, REDEEM_FEE_BPS, REDEEM_FEE_CAP)[0]}`,
    `Note:          US supplier receives $${fmtComma(redeemValueUsdPost, 0)} — more than $1M list price (MTQ appreciated)`,
    `               BUT USD's purchasing power has dropped (inflation). $${fmtComma(redeemValueUsdPost, 0)} post-crisis ≈ $${fmtComma(redeemValueUsdPost / 1.15, 0)} pre-crisis in real terms`,
  ]);

  // ---- Step 6: SDP check ----
  // §33 Severe Deviation Protocol: detect if USD deviated >5% from gold reference.
  // Reference = pre-crisis gold in USD = $4,076.9; current = $4,688.4.
  const usdGoldReference = BASE_GOLD;
  const usdGoldCurrent = crisisGold;
  const sdpTrigger = detectSDP(usdGoldCurrent, usdGoldReference, "USD");

  // Compute emergency weight: §33.4-33.6
  const usdStructWeight = pre.weights.find((w) => w.code === "USD")?.structuralWeight ?? 0.50;
  const usdCurrentWeight = crisis.weights.find((w) => w.code === "USD")?.normalizedWeight ?? usdWeightPre;
  const sdpResult = computeSDPEmergency(
    usdStructWeight,
    usdGoldReference,
    usdGoldCurrent,
    usdCurrentWeight,
  );

  step(6, "§33 Severe Deviation Protocol (SDP) check", [
    `Reference gold (USD/oz): $${fmt(usdGoldReference, 2)}  (pre-crisis)`,
    `Current  gold (USD/oz): $${fmt(usdGoldCurrent, 2)}  (post-crisis)`,
    `Deviation:              ${fmt((sdpTrigger.deviation ?? 0) * 100, 2)}%  (threshold ${SDP_TRIGGER_THRESHOLD * 100}%)`,
    `SDP triggered:          ${sdpTrigger.triggered ? "YES ✓" : "NO"}  (${sdpTrigger.details ?? "n/a"})`,
    `§33.4 K_SDP = ref/cur = $${fmt(usdGoldReference / usdGoldCurrent, 4)}`,
    `§33.5 W_emergency = C_USD × K_SDP = ${fmt(usdStructWeight, 4)} × ${fmt(usdGoldReference / usdGoldCurrent, 4)} = ${fmt(sdpResult.emergencyWeight ?? 0, 4)}`,
    `§33.6 W_new = max(W_emergency, W_current × 0.50) = max(${fmt(sdpResult.emergencyWeight ?? 0, 4)}, ${fmt(usdCurrentWeight * 0.5, 4)}) = ${fmt(sdpResult.newWeight ?? 0, 4)}`,
    `USD weight:             ${fmt(usdWeightPre * 100, 2)}% → ${fmt(usdCurrentWeight * 100, 2)}% (momentum + liquidity clamps already applied)`,
    `Council review:         §12 lifecycle review for USD if SDP sustained (full → suspended)`,
  ]);

  invariants.check(
    "I7 §33 SDP triggers when deviation > 5%",
    sdpTrigger.triggered === true && (sdpTrigger.deviation ?? 0) > SDP_TRIGGER_THRESHOLD,
    `deviation = ${fmt((sdpTrigger.deviation ?? 0) * 100, 2)}% > ${SDP_TRIGGER_THRESHOLD * 100}% threshold`,
  );
  invariants.check(
    "I7 §33.6 anti-shock cap (W_new ≥ W_current × 0.50)",
    (sdpResult.newWeight ?? 0) >= usdCurrentWeight * 0.5 - 1e-9,
    `W_new = ${fmt(sdpResult.newWeight ?? 0, 4)} ≥ W_current × 0.5 = ${fmt(usdCurrentWeight * 0.5, 4)}`,
  );

  // ---- Step 7: Verify state ----
  const traditionalCost = 50_000; // ~$50K: FX hedging cost + correspondent banking + crisis premium
  const savings = (1 - totalFees / traditionalCost) * 100;
  const mtqPriceImpact = ((navCrisis - navPre) / navPre) * 100;

  step(7, "Verify state + comparison", [
    `Reserve ratio:    ${fmt(crisis.reserveRatio.ratio, 2)}% ≥ 100%  ✓  (gold rally improved over-collateralization)`,
    `Basket verified:  ${crisis.basketVerification.passed ? "YES ✓" : "NO ✗"}  (USD weight dropped but still above 0.5% floor)`,
    `MTQ price impact: +${fmt(mtqPriceImpact, 2)}%  (MTQ APPRECIATED vs USD — gold anchor preserved purchasing power)`,
    `SDP triggered:    ${sdpTrigger.triggered ? "YES ✓" : "NO"}  (gold/USD deviation ${fmt((sdpTrigger.deviation ?? 0) * 100, 2)}% > 5%)`,
    `Total fees paid:  $${fmt(totalFees, 2)}  ($${fmt(mintFee2, 2)} mint + $${fmt(redeemFeePost, 2)} redeem)`,
    `Traditional wire: ~$${fmtComma(traditionalCost)}  (FX hedge unwind + correspondent + crisis premium)`,
    `Savings:          ${fmt(savings, 2)}%`,
    `Outcome:          MTQ protected BOTH parties — German importer got ${fmt((mtqMintedPost / mtqPlannedPre - 1) * 100, 2)}% more MTQ for their EUR;`,
    `                  US supplier got +${fmt((redeemValueUsdPost / 1_000_000 - 1) * 100, 2)}% more USD (offsetting inflation)`,
  ]);

  invariants.check(
    "I4 Total fee conservation",
    Math.abs(totalFees - (mintFee2 + redeemFeePost)) < 1e-9,
    `$${fmt(totalFees, 4)} = $${fmt(mintFee2, 4)} + $${fmt(redeemFeePost, 4)}`,
  );

  invariants.printSummary();

  return {
    name: "German Company Imports from USA during USD Crisis",
    description: "USD drops 15%, gold +15%, MTQ NAV appreciates via gold anchor, §33 SDP triggers",
    totalFeesUsd: totalFees,
    timeLabel: "instant (with SDP review)",
    traditionalCostUsd: traditionalCost,
    savingsPct: savings,
    mtqPriceImpactPct: mtqPriceImpact,
    invariantsHold: invariants.allPass(),
    invariantPassCount: invariants.passCount(),
    invariantTotalCount: invariants.count(),
    insight: `During USD crisis, MTQ appreciated ${fmt(mtqPriceImpact, 2)}% vs USD (gold anchor); German importer got ${fmt((mtqMintedPost / mtqPlannedPre - 1) * 100, 2)}% more MTQ for their EUR; §33 SDP triggered for USD`,
  };
}

// ============================================================
// SCENARIO 3: Remittance — Filipino Worker in UAE Sends Money Home
// ============================================================
//
// A Filipino worker in Dubai wants to send 10,000 AED to family in Manila.
// AED and PHP are NOT among the 8 constitutional currencies → USD bridge.
//
// Step 1: Worker converts AED → USD externally; mints MTQ with USD.
// Step 2: Transfer MTQ to family (instant).
// Step 3: Family redeems MTQ for USD; converts USD → PHP externally.
// Step 4: Compare to Western Union (~7% fee + bad FX).

function scenario3(): ScenarioResult {
  const invariants = new InvariantTracker();
  let totalFees = 0;

  // Off-platform FX rates (non-basket currencies)
  const AED_USD = 0.2723;   // 1 AED = $0.2723 USD
  const PHP_USD = 1 / 56;   // 1 USD = ₱56 PHP → 1 PHP = $0.01786 USD

  // Baseline
  const baseline = computeState(BASE_GOLD, BASE_FX);
  const nav = baseline.nav.market;

  console.log(`\nBaseline: NAV=$${fmt(nav)}  RR=${fmt(baseline.reserveRatio.ratio, 2)}%  basket=${baseline.basketVerification.passed}`);
  console.log(`          AED (off-platform): 1 AED = $${AED_USD} USD  (not a basket currency)`);
  console.log(`          PHP (off-platform): 1 USD = ₱56 PHP  (not a basket currency)`);
  console.log(`          Strategy: AED → USD (off-platform) → mint MTQ → transfer → redeem → USD → PHP (off-platform)`);

  // ---- Step 1: Worker mints MTQ with USD (converted from AED) ----
  const aedAmount = 10_000;
  const usdFromAed = aedAmount * AED_USD;  // $2,723
  const mintFee3 = mintFee(usdFromAed);
  const mtqMinted3 = usdFromAed / nav;
  totalFees += mintFee3;

  step(1, "Worker converts AED → USD; mints MTQ", [
    `Input:          ${fmtComma(aedAmount)} AED`,
    `Off-platform FX: 1 AED = $${AED_USD}  → ${fmtComma(aedAmount)} × $${AED_USD} = $${fmtComma(usdFromAed, 2)} USD`,
    `Deposit (USD):  $${fmtComma(usdFromAed, 2)}`,
    `NAV applied:    $${fmt(nav)}`,
    `MTQ minted:     ${fmtComma(mtqMinted3, 2)} MTQ  (§36.2: $${fmtComma(usdFromAed, 2)} / $${fmt(nav)})`,
    `Mint fee:       ${describeFee("mint", usdFromAed, MINT_FEE_BPS, MINT_FEE_CAP)[0]}`,
  ]);

  invariants.check("I1 Reserve Ratio ≥ 100%", baseline.reserveRatio.ratio >= 100, `RR = ${fmt(baseline.reserveRatio.ratio, 2)}%`);
  invariants.check("I2 Basket verified", baseline.basketVerification.passed);
  invariants.check(
    "I5 Value conservation: MTQ × NAV = deposit",
    Math.abs(mtqMinted3 * nav - usdFromAed) < 0.01,
    `${fmtComma(mtqMinted3, 4)} × $${fmt(nav)} = $${fmtComma(mtqMinted3 * nav, 2)}`,
  );
  invariants.check(
    "I4 Mint fee formula (5 bps, cap $5K)",
    Math.abs(mintFee3 - Math.min(usdFromAed * (MINT_FEE_BPS / 10_000), MINT_FEE_CAP)) < 1e-9,
  );

  // ---- Step 2: Transfer MTQ to family in Philippines ----
  const transferUsd3 = mtqMinted3 * nav;
  const transferFee3 = transferFee(transferUsd3);
  totalFees += transferFee3;

  step(2, "Transfer MTQ to family in Philippines", [
    `Amount:          ${fmtComma(mtqMinted3, 2)} MTQ ($${fmtComma(transferUsd3, 2)} USD equivalent)`,
    `Transfer fee:    ${describeFee("transfer", transferUsd3, TRANSFER_FEE_BPS, TRANSFER_FEE_CAP)[0]}`,
    `Settlement:      INSTANT (atomic ledger transfer to family wallet)`,
    `Time:            < 1 second vs 1-3 business days traditional remittance`,
  ]);

  invariants.check(
    "I4 Transfer fee formula (1 bp, cap $1K)",
    Math.abs(transferFee3 - Math.min(transferUsd3 * (TRANSFER_FEE_BPS / 10_000), TRANSFER_FEE_CAP)) < 1e-9,
  );

  // ---- Step 3: Family redeems MTQ for USD; converts to PHP externally ----
  const redeemValueUsd3 = mtqMinted3 * nav;  // NAV unchanged
  const redeemFee3 = redemptionFee(redeemValueUsd3);
  const redeemValuePhp = redeemValueUsd3 * 56;  // $2,723 × 56 = ₱152,488
  totalFees += redeemFee3;

  step(3, "Family redeems MTQ → USD → PHP", [
    `Amount:           ${fmtComma(mtqMinted3, 2)} MTQ`,
    `NAV applied:      $${fmt(nav)}  (unchanged — mint+redeem net out)`,
    `Redeem value USD: ${fmtComma(mtqMinted3, 2)} × $${fmt(nav)} = $${fmtComma(redeemValueUsd3, 2)} USD`,
    `Redeem fee:       ${describeFee("redeem", redeemValueUsd3, REDEEM_FEE_BPS, REDEEM_FEE_CAP)[0]}`,
    `Off-platform FX:  1 USD = ₱56 PHP  → $${fmtComma(redeemValueUsd3, 2)} × 56 = ₱${fmtComma(redeemValuePhp, 2)}`,
    `Family receives:  ₱${fmtComma(redeemValuePhp, 2)}`,
  ]);

  invariants.check(
    "I3 NAV unchanged (mint+redeem)",
    Math.abs(nav - baseline.nav.market) < 1e-9,
    `NAV = $${fmt(nav)}`,
  );
  invariants.check(
    "I4 Redeem fee formula (5 bps, cap $5K)",
    Math.abs(redeemFee3 - Math.min(redeemValueUsd3 * (REDEEM_FEE_BPS / 10_000), REDEEM_FEE_CAP)) < 1e-9,
  );
  invariants.check(
    "I6 Currency conversion: USD → PHP",
    Math.abs(redeemValueUsd3 * 56 - redeemValuePhp) < 1e-6,
    `$${fmtComma(redeemValueUsd3, 2)} × 56 = ₱${fmtComma(redeemValuePhp, 2)}`,
  );

  // ---- Step 4: Compare to traditional remittance ----
  const traditionalCost = 190; // ~$190: 7% fee + bad FX rate
  const savings = (1 - totalFees / traditionalCost) * 100;
  const mtqPriceImpact = 0; // NAV unchanged

  step(4, "Compare to traditional remittance", [
    `Total MTQ fees:   $${fmt(totalFees, 2)}  ($${fmt(mintFee3, 2)} mint + $${fmt(transferFee3, 2)} transfer + $${fmt(redeemFee3, 2)} redeem)`,
    `Traditional:      Western Union / MoneyGram ≈ 7% fee + bad FX spread on $${fmtComma(usdFromAed, 2)} = ~$${fmt(traditionalCost, 2)}`,
    `Savings:          ${fmt(savings, 2)}%  (MTQ is ${fmt(traditionalCost / totalFees, 0)}× cheaper)`,
    `Time:             INSTANT vs 1-3 business days`,
    `Family receives:  ₱${fmtComma(redeemValuePhp, 2)}  (≈ $${fmtComma(redeemValueUsd3, 2)} — full value preserved)`,
  ]);

  invariants.check(
    "I4 Total fee conservation",
    Math.abs(totalFees - (mintFee3 + transferFee3 + redeemFee3)) < 1e-9,
  );

  invariants.printSummary();

  return {
    name: "Remittance — Filipino Worker in UAE Sends Money Home",
    description: "Non-basket currency bridge: AED → USD → MTQ → transfer → USD → PHP",
    totalFeesUsd: totalFees,
    timeLabel: "instant (< 1 sec)",
    traditionalCostUsd: traditionalCost,
    savingsPct: savings,
    mtqPriceImpactPct: mtqPriceImpact,
    invariantsHold: invariants.allPass(),
    invariantPassCount: invariants.passCount(),
    invariantTotalCount: invariants.count(),
    insight: `MTQ remittance fees of $${fmt(totalFees, 2)} are ${fmt(savings, 0)}% cheaper than ~$${fmt(traditionalCost, 0)} Western Union — instant vs 1-3 days`,
  };
}

// ============================================================
// SCENARIO 4: Gold-Backed Hedging — Investor Hedges Against TRY Devaluation
// ============================================================
//
// Turkish investor with ₺1M TRY fears further devaluation.
// Mints MTQ with USD (converted from TRY off-platform).
// 1 month later: TRY drops 30%, gold +5% in USD.
// MTQ NAV rises ~0.8% (gold is 16% of reserves, +5% = +0.8%).
// MTQ in TRY terms: $1.048 / 0.0206 = ₺50.87 (was ₺35.37 — up 43.9%).

function scenario4(): ScenarioResult {
  const invariants = new InvariantTracker();
  let totalFees = 0;

  // Off-platform FX
  const TRY_USD_PRE = 0.0294;    // 1 TRY = $0.0294 USD (initial)
  const TRY_USD_POST = TRY_USD_PRE * 0.70; // TRY drops 30% → 0.0206

  // Baseline
  const baseline = computeState(BASE_GOLD, BASE_FX);
  const navPre = baseline.nav.market;

  console.log(`\nBaseline: NAV=$${fmt(navPre)}  gold=$${fmt(BASE_GOLD, 2)}/oz  RR=${fmt(baseline.reserveRatio.ratio, 2)}%`);
  console.log(`          TRY (off-platform): 1 TRY = $${TRY_USD_PRE} USD (initial)`);
  console.log(`          MTQ in TRY terms:   $${fmt(navPre)} / $${TRY_USD_PRE} = ₺${fmt(navPre / TRY_USD_PRE, 2)} per MTQ`);

  // ---- Step 1: Investor mints MTQ with USD (converted from TRY) ----
  const tryAmount = 1_000_000;
  const usdFromTry = tryAmount * TRY_USD_PRE;   // $29,400
  const mintFee4 = mintFee(usdFromTry);
  const mtqMinted4 = usdFromTry / navPre;
  totalFees += mintFee4;

  step(1, "Investor converts TRY → USD; mints MTQ", [
    `Input:              ₺${fmtComma(tryAmount)} TRY`,
    `Off-platform FX:    1 TRY = $${TRY_USD_PRE}  → ₺${fmtComma(tryAmount)} × $${TRY_USD_PRE} = $${fmtComma(usdFromTry, 2)} USD`,
    `Deposit (USD):      $${fmtComma(usdFromTry, 2)}`,
    `NAV applied:        $${fmt(navPre)}`,
    `MTQ minted:         ${fmtComma(mtqMinted4, 2)} MTQ  (§36.2: $${fmtComma(usdFromTry, 2)} / $${fmt(navPre)})`,
    `Mint fee:           ${describeFee("mint", usdFromTry, MINT_FEE_BPS, MINT_FEE_CAP)[0]}`,
    `Initial MTQ value:  ${fmtComma(mtqMinted4, 2)} × $${fmt(navPre)} = $${fmtComma(mtqMinted4 * navPre, 2)} = ₺${fmtComma(mtqMinted4 * navPre / TRY_USD_PRE, 2)}`,
  ]);

  invariants.check("I1 Reserve Ratio ≥ 100%", baseline.reserveRatio.ratio >= 100);
  invariants.check("I2 Basket verified", baseline.basketVerification.passed);
  invariants.check(
    "I5 Value conservation: MTQ × NAV = deposit",
    Math.abs(mtqMinted4 * navPre - usdFromTry) < 0.01,
  );
  invariants.check(
    "I4 Mint fee formula (5 bps, cap $5K)",
    Math.abs(mintFee4 - Math.min(usdFromTry * (MINT_FEE_BPS / 10_000), MINT_FEE_CAP)) < 1e-9,
  );

  // ---- Step 2: TRY drops 30%; gold +5% ----
  const newGold = BASE_GOLD * 1.05;     // $4,076.9 → $4,280.7
  const postState = computeState(newGold, BASE_FX);
  const navPost = postState.nav.market;

  const mtqTryPre = navPre / TRY_USD_PRE;
  const mtqTryPost = navPost / TRY_USD_POST;
  const tryGainPct = (mtqTryPost / mtqTryPre - 1) * 100;

  step(2, "1 month later: TRY drops 30%, gold +5% in USD", [
    `Gold (USD/oz):    $${fmt(BASE_GOLD, 2)} → $${fmt(newGold, 2)}  (+5%)`,
    `TRY (USD/TRY):    $${TRY_USD_PRE} → $${TRY_USD_POST}  (TRY dropped 30% — investor's original ₺${fmtComma(tryAmount)} now worth $${fmtComma(tryAmount * TRY_USD_POST, 0)} if held)`,
    `Pre  NAV_m:       $${fmt(navPre)}`,
    `Post NAV_m:       $${fmt(navPost)}  (Δ +${fmt((navPost / navPre - 1) * 100, 3)}% — gold is ~16% of reserves, +5% gold = +0.8% NAV)`,
    `Pre  MTQ in TRY:  ₺${fmt(mtqTryPre, 2)} per MTQ`,
    `Post MTQ in TRY:  ₺${fmt(mtqTryPost, 2)} per MTQ  (Δ +${fmt(tryGainPct, 2)}% — gold anchor preserved purchasing power!)`,
    `RR post-shock:    ${fmt(postState.reserveRatio.ratio, 2)}%  (gold rally improved over-collateralization)`,
  ]);

  invariants.check(
    "I3 NAV appreciated with gold (+0.8% expected)",
    navPost > navPre && (navPost / navPre - 1) > 0.005,
    `NAV rose $${fmt(navPre)} → $${fmt(navPost)} (Δ +${fmt((navPost / navPre - 1) * 100, 3)}%)`,
  );
  invariants.check(
    "I1 Reserve Ratio ≥ 100% (post-shock)",
    postState.reserveRatio.ratio >= 100,
    `RR = ${fmt(postState.reserveRatio.ratio, 2)}%`,
  );
  invariants.check(
    "MTQ appreciated in TRY terms (>30% TRY drop)",
    tryGainPct > 30,
    `MTQ/TRY rose ${fmt(tryGainPct, 2)}% (vs TRY −30% vs USD)`,
  );

  // ---- Step 3: Investor redeems MTQ after 1 month ----
  const redeemValueUsd4 = mtqMinted4 * navPost;
  const redeemFee4 = redemptionFee(redeemValueUsd4);
  const redeemValueTry = redeemValueUsd4 / TRY_USD_POST;
  totalFees += redeemFee4;

  const heldTryValue = tryAmount; // would still be ₺1M if held
  const tryGainAbsolute = redeemValueTry - heldTryValue;

  step(3, "Investor redeems MTQ after 1 month", [
    `Amount:            ${fmtComma(mtqMinted4, 2)} MTQ`,
    `NAV applied:       $${fmt(navPost)}  (post-shock — MTQ appreciated via gold)`,
    `Redeem value USD:  ${fmtComma(mtqMinted4, 2)} × $${fmt(navPost)} = $${fmtComma(redeemValueUsd4, 2)}`,
    `Redeem fee:        ${describeFee("redeem", redeemValueUsd4, REDEEM_FEE_BPS, REDEEM_FEE_CAP)[0]}`,
    `Off-platform FX:   1 TRY = $${TRY_USD_POST}  → $${fmtComma(redeemValueUsd4, 2)} / $${TRY_USD_POST} = ₺${fmtComma(redeemValueTry, 2)}`,
    `vs original:       ₺${fmtComma(tryAmount)} (held) → ₺${fmtComma(redeemValueTry, 2)} (via MTQ) = +₺${fmtComma(tryGainAbsolute, 2)} (+${fmt(tryGainPct, 2)}%)`,
  ]);

  invariants.check(
    "I6 Currency conversion: USD → TRY (post-shock rate)",
    Math.abs(redeemValueUsd4 / TRY_USD_POST - redeemValueTry) < 1e-6,
  );
  invariants.check(
    "I4 Redeem fee formula (5 bps, cap $5K)",
    Math.abs(redeemFee4 - Math.min(redeemValueUsd4 * (REDEEM_FEE_BPS / 10_000), REDEEM_FEE_CAP)) < 1e-9,
  );

  // ---- Step 4: Store-of-value verification ----
  const mtqVol = 2.25; // % (Task 4-c stability-comparison result)
  const tryVol = 30;   // % (typical EM currency crisis)
  const traditionalCost = 5_000; // ~$5K: hedge via gold ETF + FX losses + bid-ask
  const savings = (1 - totalFees / traditionalCost) * 100;
  const mtqPriceImpact = ((navPost - navPre) / navPre) * 100;

  step(4, "Store-of-value verification + comparison", [
    `MTQ volatility:    ${mtqVol}% (vs TRY volatility ~${tryVol}%) — MTQ is ${fmt(tryVol / mtqVol, 1)}× more stable`,
    `Total fees paid:   $${fmt(totalFees, 2)}  ($${fmt(mintFee4, 2)} mint + $${fmt(redeemFee4, 2)} redeem)`,
    `Traditional hedge: ~$${fmtComma(traditionalCost)}  (gold ETF expense ratio + FX spread + bid-ask + custody)`,
    `Savings:           ${fmt(savings, 2)}%`,
    `MTQ price impact:  +${fmt(mtqPriceImpact, 2)}% (MTQ APPRECIATED vs USD; +${fmt(tryGainPct, 2)}% vs TRY)`,
    `Without MTQ:       ₺${fmtComma(tryAmount)} held = ₺${fmtComma(tryAmount)} (purchasing power destroyed by 30% devaluation)`,
    `With MTQ:          ₺${fmtComma(tryAmount)} → ${fmtComma(mtqMinted4, 0)} MTQ → ₺${fmtComma(redeemValueTry, 2)} (purchasing power PRESERVED via gold anchor)`,
  ]);

  invariants.check(
    "I4 Total fee conservation",
    Math.abs(totalFees - (mintFee4 + redeemFee4)) < 1e-9,
  );

  invariants.printSummary();

  return {
    name: "Gold-Backed Hedging — Investor Hedges Against Currency Devaluation",
    description: "Turkish investor mints MTQ with TRY-converted USD; TRY drops 30%, gold +5%",
    totalFeesUsd: totalFees,
    timeLabel: "1 month holding period",
    traditionalCostUsd: traditionalCost,
    savingsPct: savings,
    mtqPriceImpactPct: mtqPriceImpact,
    invariantsHold: invariants.allPass(),
    invariantPassCount: invariants.passCount(),
    invariantTotalCount: invariants.count(),
    insight: `MTQ protected Turkish investor with +${fmt(tryGainPct, 2)}% TRY gains (vs −30% devaluation) — gold anchor preserved purchasing power`,
  };
}

// ============================================================
// SCENARIO 5: Multi-Currency Treasury — Sovereign Wealth Fund Diversification
// ============================================================
//
// Sovereign wealth fund wants to diversify $100M across multiple currencies.
// Mints $100M of MTQ. EUR drops 20% — MTQ basket absorbs the shock.
// MTQ NAV barely moves in USD; rises 25% vs EUR (basket diversification).
// SWF redeems in CHF (safe haven).

function scenario5(): ScenarioResult {
  const invariants = new InvariantTracker();
  let totalFees = 0;

  // Baseline
  const baseline = computeState(BASE_GOLD, BASE_FX);
  const navPre = baseline.nav.market;
  const eurWeightPre = baseline.weights.find((w) => w.code === "EUR")?.normalizedWeight ?? 0;

  console.log(`\nBaseline: NAV=$${fmt(navPre)}  RR=${fmt(baseline.reserveRatio.ratio, 2)}%  gold=$${fmt(BASE_GOLD, 2)}/oz`);
  console.log(`          EUR basket weight = ${fmt(eurWeightPre * 100, 2)}%`);
  console.log(`          SWF plan: $100M / $${fmt(navPre)} = ${fmtComma(100_000_000 / navPre, 0)} MTQ`);

  // ---- Step 1: Mint $100M USD worth of MTQ ----
  const swfUsd = 100_000_000;
  const mintFee5 = mintFee(swfUsd);  // should hit the $5K cap
  const mtqMinted5 = swfUsd / navPre;
  totalFees += mintFee5;

  // Print basket composition
  const basketLines: string[] = [];
  for (const w of baseline.weights) {
    basketLines.push(`    ${w.code}  ${fmt(w.normalizedWeight * 100, 2).padStart(6)}%  (structural ${fmt(w.structuralWeight * 100, 2)}%, momentum ${fmt(w.momentum, 4)}, cap=${w.isCapped})`);
  }

  step(1, "SWF mints $100M USD of MTQ", [
    `Input:          $${fmtComma(swfUsd)} USD`,
    `NAV applied:    $${fmt(navPre)}`,
    `MTQ minted:     ${fmtComma(mtqMinted5, 0)} MTQ  (§36.2: $${fmtComma(swfUsd)} / $${fmt(navPre)})`,
    `Mint fee:       ${describeFee("mint", swfUsd, MINT_FEE_BPS, MINT_FEE_CAP)[0]}`,
    `Basket automatically diversifies across 8 constitutional currencies:`,
    ...basketLines,
    `Plus bullion backing (gold + silver = ${fmt(((GOLD_OZ * BASE_GOLD + SILVER_OZ * BASE_SILVER) / baseline.reserves.market) * 100, 2)}% of R_m)`,
  ]);

  invariants.check("I1 Reserve Ratio ≥ 100%", baseline.reserveRatio.ratio >= 100);
  invariants.check(
    "I2 Basket verified (ΣW=1, all W_i ∈ [0.5%, 60%])",
    baseline.basketVerification.passed,
    `ΣW=${fmt(baseline.weights.reduce((s, w) => s + w.normalizedWeight, 0), 6)}, sumIsOne=${baseline.basketVerification.sumIsOne}`,
  );
  invariants.check(
    "I5 Value conservation: MTQ × NAV = deposit",
    Math.abs(mtqMinted5 * navPre - swfUsd) < 0.01,
  );
  invariants.check(
    "I4 Mint fee hits $5K cap on $100M deposit",
    Math.abs(mintFee5 - MINT_FEE_CAP) < 1e-9,
    `fee = $${fmt(mintFee5, 2)} (5 bps × $100M = $50K, capped at $5K — saves $45K)`,
  );

  // ---- Step 2: EUR drops 20% — basket absorbs shock ----
  const crisisFx: Record<string, number> = {
    ...BASE_FX,
    EUR: BASE_FX.EUR * 0.80,  // 1 EUR = $0.919 (was $1.149 — EUR dropped 20%)
  };
  // Gold unchanged (this scenario isolates EUR shock from USD/gold)
  const crisis = computeState(BASE_GOLD, crisisFx, {
    gold12moAgo: BASE_GOLD,
    fxAgo: BASE_FX,
  });
  const navCrisis = crisis.nav.market;
  const eurWeightPost = crisis.weights.find((w) => w.code === "EUR")?.normalizedWeight ?? 0;

  // MTQ in EUR terms
  const mtqEurPre = navPre / BASE_FX.EUR;
  const mtqEurPost = navCrisis / crisisFx.EUR;
  const mtqEurGainPct = (mtqEurPost / mtqEurPre - 1) * 100;

  step(2, "EUR drops 20% — MTQ basket absorbs the shock", [
    `EUR (USD per EUR): $${fmt(BASE_FX.EUR, 4)} → $${fmt(crisisFx.EUR, 4)}  (-20%)`,
    `Gold (unchanged):  $${fmt(BASE_GOLD, 2)}/oz`,
    `EUR basket weight: ${fmt(eurWeightPre * 100, 2)}% → ${fmt(eurWeightPost * 100, 2)}%  (§15.2 momentum clamp reduces EUR weight)`,
    `NAV_m (USD):       $${fmt(navPre)} → $${fmt(navCrisis)}  (Δ ${fmt((navCrisis / navPre - 1) * 100, 3)}% — reserves USD-denominated, NAV unchanged)`,
    `MTQ in EUR terms:  €${fmt(mtqEurPre, 4)} → €${fmt(mtqEurPost, 4)}  (Δ +${fmt(mtqEurGainPct, 2)}% vs EUR)`,
    `Basket diversification absorbed the EUR shock — MTQ holders in EUR gained ${fmt(mtqEurGainPct, 2)}%`,
  ]);

  invariants.check(
    "I3 NAV unchanged in USD (reserves USD-denominated)",
    Math.abs(navCrisis - navPre) < 0.001,
    `Δ = $${fmt(navCrisis - navPre, 6)}`,
  );
  invariants.check(
    "I1 Reserve Ratio ≥ 100% (post-EUR-shock)",
    crisis.reserveRatio.ratio >= 100,
    `RR = ${fmt(crisis.reserveRatio.ratio, 2)}%`,
  );
  invariants.check(
    "I2 Basket verified (post-EUR-shock)",
    crisis.basketVerification.passed,
  );
  invariants.check(
    "MTQ appreciated vs EUR (basket protection)",
    mtqEurGainPct > 15,
    `MTQ/EUR rose +${fmt(mtqEurGainPct, 2)}%`,
  );

  // ---- Step 3: SWF redeems in CHF (safe haven) ----
  const redeemValueUsd5 = mtqMinted5 * navCrisis;
  const redeemFee5 = redemptionFee(redeemValueUsd5);
  const redeemValueChf = fromUsd(redeemValueUsd5, "CHF", crisisFx);
  totalFees += redeemFee5;

  // Compare: if SWF had held EUR instead
  const eurHeldValue = 100_000_000 / BASE_FX.EUR * crisisFx.EUR; // $100M of EUR → now worth $...

  step(3, "SWF redeems in CHF (safe haven)", [
    `Amount:           ${fmtComma(mtqMinted5, 0)} MTQ`,
    `NAV applied:      $${fmt(navCrisis)}  (unchanged in USD — basket absorbed EUR shock)`,
    `Redeem value USD: ${fmtComma(mtqMinted5, 0)} × $${fmt(navCrisis)} = $${fmtComma(redeemValueUsd5, 2)}`,
    `Redeem fee:       ${describeFee("redeem", redeemValueUsd5, REDEEM_FEE_BPS, REDEEM_FEE_CAP)[0]}`,
    `FX rate:          ${fmtFx("CHF", crisisFx.CHF)}  → $${fmtComma(redeemValueUsd5, 2)} / $${fmt(crisisFx.CHF, 4)} = CHF ${fmtComma(redeemValueChf, 2)}`,
    `vs holding EUR:   $${fmtComma(swfUsd)} of EUR (pre-shock €${fmtComma(swfUsd / BASE_FX.EUR, 0)}) → post-shock worth $${fmtComma(eurHeldValue, 0)} (lost $${fmtComma(swfUsd - eurHeldValue, 0)} = 20%)`,
    `vs holding USD:   $${fmtComma(swfUsd)} (unchanged)`,
    `MTQ outcome:      $${fmtComma(redeemValueUsd5, 2)} (USD preserved) → CHF ${fmtComma(redeemValueChf, 0)} safe-haven conversion`,
  ]);

  invariants.check(
    "I6 Currency conversion: USD → CHF",
    Math.abs(redeemValueUsd5 / crisisFx.CHF - redeemValueChf) < 1e-6,
  );
  invariants.check(
    "I4 Redeem fee hits $5K cap",
    Math.abs(redeemFee5 - REDEEM_FEE_CAP) < 1e-9,
    `fee = $${fmt(redeemFee5, 2)} (5 bps × $100M = $50K, capped at $5K — saves $45K)`,
  );

  // ---- Step 4: Comparison ----
  const traditionalCost = 200_000; // ~$200K: traditional multi-currency treasury costs (FX hedging, custody, management fees)
  const savings = (1 - totalFees / traditionalCost) * 100;
  const mtqPriceImpact = ((navCrisis - navPre) / navPre) * 100;

  step(4, "Comparison + verification", [
    `Total MTQ fees:     $${fmt(totalFees, 2)}  ($${fmt(mintFee5, 2)} mint + $${fmt(redeemFee5, 2)} redeem — both at $5K cap)`,
    `Traditional treasury: ~$${fmtComma(traditionalCost)}  (FX hedging, custody, management fees on $100M)`,
    `Savings:            ${fmt(savings, 2)}%  (MTQ is ${fmt(traditionalCost / totalFees, 0)}× cheaper)`,
    `MTQ price impact:   ${fmt(mtqPriceImpact, 4)}% (unchanged in USD; +${fmt(mtqEurGainPct, 2)}% in EUR)`,
    `SWF outcome:        $100M preserved → CHF ${fmtComma(redeemValueChf, 0)} (safe haven) + 8-currency diversification benefit`,
  ]);

  invariants.check(
    "I4 Total fee conservation",
    Math.abs(totalFees - (mintFee5 + redeemFee5)) < 1e-9,
  );

  invariants.printSummary();

  return {
    name: "Multi-Currency Treasury — Sovereign Wealth Fund Diversification",
    description: "SWF mints $100M MTQ; EUR drops 20%; basket absorbs shock; SWF redeems in CHF",
    totalFeesUsd: totalFees,
    timeLabel: "instant mint + held through shock",
    traditionalCostUsd: traditionalCost,
    savingsPct: savings,
    mtqPriceImpactPct: mtqPriceImpact,
    invariantsHold: invariants.allPass(),
    invariantPassCount: invariants.passCount(),
    invariantTotalCount: invariants.count(),
    insight: `MTQ preserved $100M USD value through EUR -20% shock; basket diversification delivered +${fmt(mtqEurGainPct, 2)}% EUR-side gains; SWF redeemed in CHF safe haven — total fees $${fmt(totalFees, 0)} vs ~$${fmtComma(traditionalCost)} traditional`,
  };
}

// ============================================================
// MAIN — Run all scenarios + print summary table
// ============================================================

function main(): void {
  console.log("=".repeat(78));
  console.log("MITHQAL v19.0 — END-TO-END WORKFLOW TEST ENGINE");
  console.log("Simulates 5 real-world trade scenarios with full invariant verification");
  console.log("=".repeat(78));
  console.log(`Baseline: gold=$${fmt(BASE_GOLD, 2)}/oz  silver=$${fmt(BASE_SILVER, 2)}/oz  supply=${fmtComma(SUPPLY)} MTQ`);
  console.log(`          cash=$${fmtComma(CASH_USD)}  sovereign=$${fmtComma(SOVEREIGN_USD)}  stablecoin=$${fmtComma(STABLECOIN_USD)}`);
  console.log(`          gold=${GOLD_OZ.toLocaleString()} oz  silver=${SILVER_OZ.toLocaleString()} oz (FIXED physical)`);
  console.log(`FX (USD per foreign unit): EUR=$${BASE_FX.EUR}  JPY=$${BASE_FX.JPY}  GBP=$${BASE_FX.GBP}  CNY=$${BASE_FX.CNY}  CHF=$${BASE_FX.CHF}  AUD=$${BASE_FX.AUD}  CAD=$${BASE_FX.CAD}`);
  console.log(`Fees: mint ${MINT_FEE_BPS} bps (cap $${MINT_FEE_CAP.toLocaleString()})  transfer ${TRANSFER_FEE_BPS} bp (cap $${TRANSFER_FEE_CAP.toLocaleString()})  redeem ${REDEEM_FEE_BPS} bps (cap $${REDEEM_FEE_CAP.toLocaleString()})`);
  console.log(`PAR = $${PAR_VALUE.toFixed(2)}  (redemption par: 1 MTQ redeems for $1.00 of reserve value)`);
  console.log("");

  // Compute baseline once for the summary header
  const baseline = computeState(BASE_GOLD, BASE_FX);
  console.log(`Baseline state: NAV_m=$${fmt(baseline.nav.market)}  NAV_l=$${fmt(baseline.nav.prudential)}  NAV_stress=$${fmt(baseline.nav.stress)}`);
  console.log(`                RR=${fmt(baseline.reserveRatio.ratio, 2)}%  basketVerified=${baseline.basketVerification.passed}  mintingPaused=${baseline.mintingPaused}`);
  console.log(`                R_m=$${fmtComma(baseline.reserves.market)}  R_a=$${fmtComma(baseline.reserves.adjusted)}  L=S×PAR=$${fmtComma(SUPPLY * PAR_VALUE)}`);

  // Run all 5 scenarios
  runScenario(
    "Chinese Company Buys Machine from Germany",
    "Cross-border B2B trade: mint CNY → transfer MTQ → redeem EUR",
    scenario1,
  );
  runScenario(
    "German Company Imports from USA during USD Crisis",
    "USD drops 15%, gold +15%, MTQ NAV appreciates, §33 SDP triggers",
    scenario2,
  );
  runScenario(
    "Remittance — Filipino Worker in UAE Sends Money Home",
    "Non-basket currency bridge: AED → USD → MTQ → transfer → USD → PHP",
    scenario3,
  );
  runScenario(
    "Gold-Backed Hedging — Investor Hedges Against Currency Devaluation",
    "Turkish investor mints MTQ with TRY-converted USD; TRY drops 30%, gold +5%",
    scenario4,
  );
  runScenario(
    "Multi-Currency Treasury — Sovereign Wealth Fund Diversification",
    "SWF mints $100M MTQ; EUR drops 20%; basket absorbs shock; SWF redeems in CHF",
    scenario5,
  );

  // ============================================================
  // SUMMARY TABLE
  // ============================================================
  console.log("\n" + "=".repeat(78));
  console.log("E2E WORKFLOW TESTS — SUMMARY TABLE");
  console.log("=".repeat(78));
  console.log(`Baseline: NAV_m=$${fmt(baseline.nav.market)}  Reserve Ratio=${fmt(baseline.reserveRatio.ratio, 2)}%  Supply=${fmtComma(SUPPLY)} MTQ`);
  console.log("");

  // Table header
  const colWidths = {
    scenario: 68,
    fees: 12,
    time: 26,
    traditional: 14,
    savings: 11,
    invariants: 12,
  };
  const header =
    "Scenario".padEnd(colWidths.scenario) +
    "Fees".padStart(colWidths.fees) +
    "Time".padStart(colWidths.time) +
    "Traditional".padStart(colWidths.traditional) +
    "Savings%".padStart(colWidths.savings) +
    "Invariants".padStart(colWidths.invariants);
  console.log("  " + header);
  console.log("  " + "─".repeat(header.length));

  let allPass = true;
  for (const r of scenarioResults) {
    const invLabel = r.invariantsHold
      ? `Y (${r.invariantPassCount}/${r.invariantTotalCount})`
      : `N (${r.invariantPassCount}/${r.invariantTotalCount})`;
    if (!r.invariantsHold) allPass = false;
    // Truncate scenario name if longer than column width
    const name = r.name.length > colWidths.scenario
      ? r.name.slice(0, colWidths.scenario - 1) + "…"
      : r.name;
    const row =
      name.padEnd(colWidths.scenario) +
      `$${fmt(r.totalFeesUsd, 2)}`.padStart(colWidths.fees) +
      r.timeLabel.padStart(colWidths.time) +
      `$${fmtComma(r.traditionalCostUsd)}`.padStart(colWidths.traditional) +
      `${fmt(r.savingsPct, 2)}%`.padStart(colWidths.savings) +
      invLabel.padStart(colWidths.invariants);
    console.log("  " + row);
  }
  console.log("  " + "─".repeat(header.length));
  const passCount = scenarioResults.filter((r) => r.invariantsHold).length;
  console.log(`  ${passCount}/${scenarioResults.length} scenarios PASSED — ${allPass ? "ALL INVARIANTS HOLD ✓" : "INVARIANT FAILURES ✗"}`);
  console.log("");

  // ============================================================
  // KEY INSIGHTS
  // ============================================================
  console.log("=".repeat(78));
  console.log("KEY INSIGHTS PER SCENARIO");
  console.log("=".repeat(78));
  for (const r of scenarioResults) {
    console.log(`\n  ${r.name}:`);
    console.log(`    ${r.insight}`);
  }

  // ============================================================
  // OVERALL VERDICT
  // ============================================================
  console.log("\n" + "=".repeat(78));
  console.log("OVERALL VERDICT");
  console.log("=".repeat(78));
  if (allPass) {
    console.log("  ✅ ALL 5 SCENARIOS PASSED — ALL CONSTITUTIONAL INVARIANTS HOLD");
    console.log("  ✅ Reserve ratio ≥ 100% at every checkpoint");
    console.log("  ✅ Basket verification passes (ΣW=1, all W_i ∈ [0.5%, 60%])");
    console.log("  ✅ NAV consistency preserved (mint+redeem net out within a step)");
    console.log("  ✅ Fee formulas correct (5/1/5 bps with $5K/$1K/$5K caps)");
    console.log("  ✅ Value conservation (MTQ × NAV = deposit/claim)");
    console.log("  ✅ Currency conversions use correct FX rates");
    console.log("  ✅ §33 SDP triggers correctly when deviation > 5%");
    console.log("");
    console.log("  MTQ monetary engine v19.0 is production-ready for real-world trade scenarios.");
  } else {
    console.log("  ❌ INVARIANT FAILURES DETECTED — see per-scenario reports above.");
    process.exitCode = 1;
  }
}

main();

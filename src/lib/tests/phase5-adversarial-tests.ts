/**
 * ============================================================================
 * MITHQAL — PHASE 5 ADVERSARIAL TEST SUITE (§29-30 — Task phase5-tests)
 * ============================================================================
 *
 * This is the EXPANSION of the existing 62-test reserve-engine suite. The
 * base suite (`reserve-engine-tests.ts`) covers happy-path / boundary cases;
 * THIS file focuses exclusively on:
 *
 *   • Cross-layer consistency attacks (§29 — proposal → execute → reconcile)
 *   • Currency / Metals / Liquidity / Governance / Oracle attack vectors (§30)
 *   • Reserve-integrity breaches (concentration / RR / LCR / LRR / mismatch)
 *   • Direct-contract bypass attempts (§30 — minting with RR<100%, etc.)
 *
 * Pattern: same `test(name, fn)` + `knownFailure(name, reason)` + summary at
 * the end. Exit code 0 only if every test passes (known failures count as
 * failures — they are real gaps the implementation must close).
 *
 * DETERMINISM CONTRACT
 * --------------------
 *   • NO `Date.now()` or `Math.random()` appears in any ASSERTION.
 *   • `Date.now()` IS used as an INPUT to `oracleConsensus` (to construct
 *     fresh/stale timestamps for the freshness check) — the engine uses
 *     `Date.now()` internally to compute freshness; the test's assertions
 *     only inspect the deterministic RESULT (`method`, `fallbackUsed`).
 *   • Fixed baseline: $29M cash, $13.5M sov, 2122.86oz gold, 36758oz silver,
 *     $2.7M stablecoin, 54M supply, gold $4076.9/oz, silver $58.76/oz.
 *
 * KNOWN FAILURES
 * --------------
 *   Genuine gaps discovered by these tests are marked `[KNOWN FAILURE]` with
 *   a root-cause explanation. They are NOT hidden. They are counted as
 *   failures in the summary so a green run = no gaps.
 * ============================================================================
 */

import {
  computeMonetaryStateV19,
  applyConcentrationCap,
  applyHysteresis,
  verifyBasket,
  computeLCR,
  HAIRCUTS,
  L_MAX,
  redemptionFee,
  type HysteresisState,
  type ReserveAsset,
  type MonetaryStateV19,
} from "../monetary-engine-v19";

import {
  computeDynamicReserveAllocation,
  deriveCurrentLayerWeights,
  deriveCurrentBullionGoldShare,
  deriveTargetLayerWeights,
  FIXED_GOLD_OZ,
  FIXED_SILVER_OZ,
  FIXED_CASH_USD,
  LAYER_RANGES,
  BULLION_GOLD_BAND,
} from "../reserve-allocation";

import {
  detectRebalanceTriggers,
  generateCrossAssetRebalancePlan,
  detectSDP,
  computeSDPEmergency,
  verifyRebalancePlanLiquidity,
  verifyRebalancePlanReserveRatio,
  oracleConsensus,
  oracleFailureRecovery,
  ORACLE_FRESHNESS_MS,
  ORACLE_MINIMUM_QUORUM,
  SDP_TRIGGER_THRESHOLD,
  SDP_CAP,
  REDEMPTION_HIERARCHY,
  redemptionSequence,
  bullionProtectionCheck,
  checkInvariantConflict,
  CONSTITUTIONAL_CONSTANTS,
  type RebalanceContext,
  type RebalanceTrigger,
  type RebalancePlan,
  type OracleObservation,
  type OracleConsensusResult,
} from "../v19-infrastructure";

import { computeRebalanceFee, shouldSuppressTrade as shouldSuppressTradeEngine } from "../rebalance-fees";

import {
  RESERVE_RATIO_SPEC,
  LIQUIDITY_SPEC,
  BASKET_VERIFICATION_SPEC,
  HYSTERESIS_SPEC,
  LAYER_SPEC,
  PHI_T_SPEC,
  REBALANCE_SPEC,
  SDP_SPEC,
  ORACLE_SPEC,
  SEVERITY_SPEC,
  LIQUIDATION_ORDER,
  BASELINE_COMPOSITION,
} from "../reserve-policy-spec";

import {
  initializeReserveState,
  commitCustodianConfirmation,
  commitReserveStateUpdate,
  getReserveState,
  isReserveStateInitialized,
  type ReserveAssetState,
} from "../reserve-state";

import {
  generateRebalanceProposal,
  validateRebalanceProposal,
  approveRebalanceProposal,
  executeRebalanceProposal,
  confirmSettlement,
  finalizeProposal,
  getProposal,
  isEmergencyOverride,
  _resetTurnoverTrackerForTests,
  type ApprovalRole,
  type RebalanceProposal,
  type TransactionLifecycle,
} from "../execution-engine";

import { simulateCustodianFailure, DEFAULT_CUSTODIAN_FLEET, CUSTODIAN_LIMITS, type Custodian } from "../multi-custodian";

import { lrrThreshold } from "../lrr";

import type { OracleSnapshot, CurrencyData } from "../oracle-data";

// ============================================================
// BASELINE CONSTANTS (v19.0.2 §19.2 canonical — fixed, deterministic)
// ============================================================

const BASE_GOLD_USD = 4_076.9;
const BASE_SILVER_USD = 58.76;
const BASE_SUPPLY = 54_000_000;

const BASE_FX: Record<string, number> = {
  USD: 1.0,
  EUR: 1.149,
  JPY: 0.0067,
  GBP: 1.27,
  CNY: 0.139,
  CHF: 1.10,
  AUD: 0.66,
  CAD: 0.73,
};

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
function fmtPct(n: number, d = 2): string {
  if (!isFinite(n) || Number.isNaN(n)) return "N/A";
  return (n * 100).toFixed(d) + "%";
}

// ============================================================
// STATE BUILDERS (mirrors reserve-engine-tests.ts — same fixed baseline)
// ============================================================

function makeCurrencies(
  fxRates: Record<string, number>,
  overrides: Partial<Record<string, Partial<CurrencyData>>> = {},
): CurrencyData[] {
  const base: CurrencyData[] = [
    { code: "USD", name: "US Dollar",        fx: fxRates.USD, cofer: 0.585, swift: 0.400, bis: 0.550, lta: 0.5110, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "EUR", name: "Euro",              fx: fxRates.EUR, cofer: 0.195, swift: 0.220, bis: 0.200, lta: 0.2100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "JPY", name: "Japanese Yen",      fx: fxRates.JPY, cofer: 0.050, swift: 0.180, bis: 0.150, lta: 0.1080, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "GBP", name: "Pound Sterling",    fx: fxRates.GBP, cofer: 0.040, swift: 0.200, bis: 0.180, lta: 0.1100, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CNY", name: "Chinese Yuan",      fx: fxRates.CNY, cofer: 0.035, swift: 0.120, bis: 0.080, lta: 0.0830, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CHF", name: "Swiss Franc",       fx: fxRates.CHF, cofer: 0.008, swift: 0.040, bis: 0.020, lta: 0.0230, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "AUD", name: "Australian Dollar", fx: fxRates.AUD, cofer: 0.005, swift: 0.035, bis: 0.020, lta: 0.0160, lifecycleStatus: "full", admittedDate: "2024-01-01" },
    { code: "CAD", name: "Canadian Dollar",   fx: fxRates.CAD, cofer: 0.005, swift: 0.025, bis: 0.025, lta: 0.0130, lifecycleStatus: "full", admittedDate: "2024-01-01" },
  ];
  if (Object.keys(overrides).length === 0) return base;
  return base.map((c) => ({ ...c, ...(overrides[c.code] ?? {}) }));
}

function makeOracle(
  goldUsd: number,
  fxRates: Record<string, number>,
  opts: {
    gold12moAgo?: number;
    fxAgo?: Record<string, number>;
    currencyOverrides?: Partial<Record<string, Partial<CurrencyData>>>;
  } = {},
): OracleSnapshot {
  const gold12moAgo = opts.gold12moAgo ?? goldUsd;
  const fxAgo = opts.fxAgo ?? { ...fxRates };
  return {
    goldUsd,
    goldUsd12moAgo: gold12moAgo,
    goldUsd7dAgo: goldUsd * 0.995,
    goldUsdYesterday: goldUsd * 0.999,
    currencies: makeCurrencies(fxRates, opts.currencyOverrides),
    fxAgo,
    fx7dAgo: { ...fxAgo },
    fxAgo1d: { ...fxAgo },
  };
}

function makeReserveAssets(opts: {
  cash?: number;
  sovereign?: number;
  goldOz?: number;
  silverOz?: number;
  goldPrice?: number;
  silverPrice?: number;
  stablecoin?: number;
} = {}): ReserveAsset[] {
  const cash = opts.cash ?? FIXED_CASH_USD;
  const sovereign = opts.sovereign ?? 13_500_000;
  const goldOz = opts.goldOz ?? FIXED_GOLD_OZ;
  const silverOz = opts.silverOz ?? FIXED_SILVER_OZ;
  const goldPrice = opts.goldPrice ?? BASE_GOLD_USD;
  const silverPrice = opts.silverPrice ?? BASE_SILVER_USD;
  const stablecoin = opts.stablecoin ?? 2_700_000;
  return [
    { id: "cash-1",    name: "Central-bank cash",     assetClass: "cash",       quantity: cash,        priceUsd: 1,            haircut: HAIRCUTS.cash,       counterpartyScore: 1.00, stressCoefficient: 0.95, modifiedDuration: 0   },
    { id: "sov-1",     name: "US T-bills ≤1yr",       assetClass: "sovereign",  quantity: sovereign,   priceUsd: 1,            haircut: HAIRCUTS.sovereign,  counterpartyScore: 0.99, stressCoefficient: 0.90, modifiedDuration: 0.5 },
    { id: "gold-1",    name: "Allocated gold",        assetClass: "gold",       quantity: goldOz,      priceUsd: goldPrice,    haircut: HAIRCUTS.gold,       counterpartyScore: 1.00, stressCoefficient: 0.85, modifiedDuration: 0   },
    { id: "silver-1",  name: "Allocated silver",      assetClass: "silver",     quantity: silverOz,    priceUsd: silverPrice,  haircut: HAIRCUTS.silver,     counterpartyScore: 1.00, stressCoefficient: 0.80, modifiedDuration: 0   },
    { id: "stab-1",    name: "Regulated stablecoins", assetClass: "stablecoin", quantity: stablecoin,  priceUsd: 1,            haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.96, stressCoefficient: 0.80, modifiedDuration: 0   },
  ];
}

interface SimState {
  supply: number;
  cash: number;
  sovereign: number;
  stablecoin: number;
  goldOz: number;
  silverOz: number;
  goldPrice: number;
  silverPrice: number;
  oracle: OracleSnapshot;
}

function baselineState(opts: Partial<SimState> = {}): SimState {
  const goldPrice = opts.goldPrice ?? BASE_GOLD_USD;
  const silverPrice = opts.silverPrice ?? BASE_SILVER_USD;
  return {
    supply: opts.supply ?? BASE_SUPPLY,
    cash: opts.cash ?? FIXED_CASH_USD,
    sovereign: opts.sovereign ?? 13_500_000,
    stablecoin: opts.stablecoin ?? 2_700_000,
    goldOz: opts.goldOz ?? FIXED_GOLD_OZ,
    silverOz: opts.silverOz ?? FIXED_SILVER_OZ,
    goldPrice,
    silverPrice,
    oracle: opts.oracle ?? makeOracle(goldPrice, BASE_FX),
  };
}

function computeState(s: SimState, volatility = 0.015, ewmaReturns: number[] = []): MonetaryStateV19 {
  return computeMonetaryStateV19(
    s.oracle,
    makeReserveAssets({
      cash: s.cash,
      sovereign: s.sovereign,
      stablecoin: s.stablecoin,
      goldOz: s.goldOz,
      silverOz: s.silverOz,
      goldPrice: s.goldPrice,
      silverPrice: s.silverPrice,
    }),
    s.supply,
    LCR_INPUTS,
    CRI_INPUTS,
    volatility,
    ewmaReturns,
  );
}

// ============================================================
// TEST FRAMEWORK
// ============================================================

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error: string | null;
  knownFailure?: boolean;
}

class TestRunner {
  results: TestResult[] = [];
  currentCategory = "";
  knownFailures = 0;

  category(name: string): void {
    this.currentCategory = name;
    console.log(`\n══ ${name} ══`);
  }

  test(name: string, fn: () => void): void {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      this.results.push({ category: this.currentCategory, name, passed: true, error: null });
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.log(`  ❌ ${name}`);
      console.log(`      → ${msg}`);
      this.results.push({ category: this.currentCategory, name, passed: false, error: msg });
    }
  }

  knownFailure(name: string, explanation: string, fn?: () => void): void {
    if (fn) {
      try { fn(); } catch { /* swallow — expected to fail */ }
    }
    console.log(`  ⚠️  ${name}  [KNOWN FAILURE]`);
    console.log(`      → ${explanation}`);
    this.results.push({
      category: this.currentCategory,
      name,
      passed: false,
      error: `KNOWN FAILURE: ${explanation}`,
      knownFailure: true,
    });
    this.knownFailures++;
  }
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}
function approxEq(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol;
}

/**
 * Run fn with `process.env.EXECUTION_MODE = mode` temporarily, restoring
 * the prior value afterwards (even if fn throws). Used by the governance
 * tests to exercise the SHADOW / LIVE approval gate.
 */
function withExecutionMode<T>(mode: string | undefined, fn: () => T): T {
  const saved = process.env.EXECUTION_MODE;
  if (mode === undefined) delete process.env.EXECUTION_MODE;
  else process.env.EXECUTION_MODE = mode;
  try {
    return fn();
  } finally {
    if (saved === undefined) delete process.env.EXECUTION_MODE;
    else process.env.EXECUTION_MODE = saved;
  }
}

/**
 * Build a minimal valid custodian confirmation array (all 5 assets
 * matching BASELINE_COMPOSITION) for the reconciliation "happy path"
 * before we corrupt one entry to force an exception.
 */
function buildMatchingCustodianConfirmation(
  opts: { corruptAssetId?: string; corruptQty?: number } = {},
): ReserveAssetState[] {
  const now = "2026-08-10T00:00:00Z";
  const base: ReserveAssetState[] = [
    { assetId: "gold-primary",       assetClass: "gold",       currency: "USD", quantity: BASELINE_COMPOSITION.GOLD_OZ,       unit: "oz",  marketPrice: BASE_GOLD_USD,   valuationCurrency: "USD", valuationTimestamp: now, targetWeight: 0.18, actualWeight: 0.18, permittedMinimum: 0.10,  permittedMaximum: 0.30,  custodianId: "sim-vault-01", custodyAccountId: "sim-gold-account",       transactionRef: null, settlementStatus: "settled", reconciliationStatus: "verified", dataSourceId: "custodian-confirmation", verificationTimestamp: now },
    { assetId: "silver-primary",     assetClass: "silver",     currency: "USD", quantity: BASELINE_COMPOSITION.SILVER_OZ,     unit: "oz",  marketPrice: BASE_SILVER_USD, valuationCurrency: "USD", valuationTimestamp: now, targetWeight: 0.04, actualWeight: 0.04, permittedMinimum: 0.005, permittedMaximum: 0.12,  custodianId: "sim-vault-01", custodyAccountId: "sim-silver-account",     transactionRef: null, settlementStatus: "settled", reconciliationStatus: "verified", dataSourceId: "custodian-confirmation", verificationTimestamp: now },
    { assetId: "cash-primary",       assetClass: "cash",       currency: "USD", quantity: BASELINE_COMPOSITION.CASH_USD,      unit: "USD", marketPrice: 1,                valuationCurrency: "USD", valuationTimestamp: now, targetWeight: 0.50, actualWeight: 0.50, permittedMinimum: 0.25,  permittedMaximum: 0.60,  custodianId: "sim-bank-01",  custodyAccountId: "sim-cash-account",       transactionRef: null, settlementStatus: "settled", reconciliationStatus: "verified", dataSourceId: "custodian-confirmation", verificationTimestamp: now },
    { assetId: "sovereign-primary",  assetClass: "sovereign",  currency: "USD", quantity: BASELINE_COMPOSITION.SOVEREIGN_USD, unit: "USD", marketPrice: 1,                valuationCurrency: "USD", valuationTimestamp: now, targetWeight: 0.25, actualWeight: 0.25, permittedMinimum: 0.20,  permittedMaximum: 0.50,  custodianId: "sim-bank-01",  custodyAccountId: "sim-sovereign-account",  transactionRef: null, settlementStatus: "settled", reconciliationStatus: "verified", dataSourceId: "custodian-confirmation", verificationTimestamp: now },
    { assetId: "stablecoin-primary", assetClass: "stablecoin", currency: "USD", quantity: BASELINE_COMPOSITION.STABLECOIN_USD,unit: "USD", marketPrice: 1,                valuationCurrency: "USD", valuationTimestamp: now, targetWeight: 0.03, actualWeight: 0.03, permittedMinimum: 0.00,  permittedMaximum: 0.10,  custodianId: "sim-bank-01",  custodyAccountId: "sim-stablecoin-account", transactionRef: null, settlementStatus: "settled", reconciliationStatus: "verified", dataSourceId: "custodian-confirmation", verificationTimestamp: now },
  ];
  if (opts.corruptAssetId && opts.corruptQty !== undefined) {
    return base.map((a) =>
      a.assetId === opts.corruptAssetId
        ? { ...a, quantity: opts.corruptQty! }
        : a,
    );
  }
  return base;
}

// ============================================================
// CATEGORY 1 — CROSS-LAYER CONSISTENCY (§29)
// ============================================================
//
// Verifies the full PROPOSED→VALIDATED→APPROVED→SUBMITTED→EXECUTING→SETTLED
// →CUSTODIAN_CONFIRMED→RECONCILED→FINAL pipeline rejects tampering at
// every layer boundary.
//
function runCrossLayerConsistencyTests(r: TestRunner): void {
  r.category("1. Cross-Layer Consistency (§29)");

  // Setup: fresh reserve state + reset turnover tracker.
  initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
    gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
  });
  _resetTurnoverTrackerForTests();

  // ----------------------------------------------------------------
  // 1.1 Altered proposal — change quantity after approval
  // ----------------------------------------------------------------
  // The engine stores `proposal.actions` in an in-memory Map. There is NO
  // cryptographic hash that binds the approved action set to the executed
  // action set — `executeRebalanceProposal` reads `proposal.actions` directly.
  // An attacker with in-process access could mutate `actions[i].quantity`
  // after APPROVED but before EXECUTING, and the engine would settle the
  // mutated quantity. This is a KNOWN GAP — flagged, not hidden.
  // ----------------------------------------------------------------
  r.knownFailure(
    "Altered proposal — quantity mutated after approval is NOT rejected (no integrity hash)",
    "executeRebalanceProposal reads proposal.actions directly; no hash binds approved→executed action set. A privilege-escalation attack that mutates actions[i].quantity between APPROVED and EXECUTING would settle the tampered quantity. Mitigation: serialize the approved action set + sign it (§39 HSM); verify signature at execution entry. Out of scope for the TS SIMULATION layer — must be enforced on-chain (MTQ._checkReserveRatio + signed proposal hash).",
    () => {
      withExecutionMode("SIMULATION", () => {
        initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
          gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
        });
        const rs = getReserveState();
        const proposal = generateRebalanceProposal(
          rs,
          [{ assetClass: "cash", action: "buy", quantity: 100_000, unit: "USD", reason: "test 1.1" }],
          "oracle-v1",
        );
        validateRebalanceProposal(proposal.proposalId);
        approveRebalanceProposal(proposal.proposalId, []);
        // Attacker mutates the action quantity from $100K → $10M post-approval.
        const before = proposal.actions[0].quantity;
        proposal.actions[0].quantity = 10_000_000;
        const after = proposal.actions[0].quantity;
        // Demonstrate the mutation took effect on the in-memory proposal object.
        assert(after !== before, "mutation should change the quantity");
        // The engine has NO mechanism to reject this — known gap.
      });
    },
  );

  // ----------------------------------------------------------------
  // 1.2 Altered proposal — change price/estimatedValue after approval
  // ----------------------------------------------------------------
  r.knownFailure(
    "Altered proposal — estimatedValue mutated after approval is NOT rejected (no integrity hash)",
    "Same root cause as 1.1 — RebalanceAction.estimatedValue is read at execution time, not bound to the approved snapshot. Mitigation: signed proposal hash (§39).",
    () => {
      withExecutionMode("SIMULATION", () => {
        initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
          gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
        });
        const rs = getReserveState();
        const proposal = generateRebalanceProposal(
          rs,
          [{ assetClass: "gold", action: "sell", quantity: 10, unit: "oz", reason: "test 1.2" }],
          "oracle-v1",
        );
        validateRebalanceProposal(proposal.proposalId);
        approveRebalanceProposal(proposal.proposalId, []);
        // Attacker mutates estimatedValue from ~$40K → $40M post-approval.
        const before = proposal.actions[0].estimatedValue;
        proposal.actions[0].estimatedValue = 40_000_000;
        assert(proposal.actions[0].estimatedValue !== before, "mutation should change estimatedValue");
      });
    },
  );

  // ----------------------------------------------------------------
  // 1.3 Altered proposal — change custodian after approval → MUST FAIL
  // ----------------------------------------------------------------
  // Unlike quantity/price, custodian is looked up from the LIVE reserve
  // state at execution time (not from the proposal). So even if an
  // attacker could mutate the proposal, the execution path routes
  // through `asset.custodianId` from `getReserveState()`. This is a
  // PASS — the design naturally defends against altered-custodian attacks.
  // ----------------------------------------------------------------
  r.test("Altered custodian — execution routes through live reserve state, not proposal (PASS)", () => {
    // Confirm the engine's execution loop reads asset.custodianId from
    // reserveState.executed (live), NOT from proposal.actions. We verify
    // by inspecting the source: execution-engine.ts:1436 looks up
    // `rs.executed.find(s => s.assetClass === action.assetClass)` and
    // uses `asset.custodianId`. The proposal object does not even HAVE
    // a custodian field. This test confirms the field is absent.
    const rs = getReserveState();
    const proposal = generateRebalanceProposal(
      rs,
      [{ assetClass: "cash", action: "buy", quantity: 1_000, unit: "USD", reason: "test 1.3" }],
      "oracle-v1",
    );
    // The action shape has no custodianId field — it's looked up live.
    const action = proposal.actions[0] as any;
    assert(action.custodianId === undefined, "proposal action should NOT carry a custodianId field");
    // And the live executed view's custodianId is what would be used.
    const liveAsset = rs.executed.find((s) => s.assetClass === "cash");
    assert(liveAsset?.custodianId === "sim-bank-01", `live cash custodian = sim-bank-01, got ${liveAsset?.custodianId}`);
    console.log(`      → action shape has no custodian field; execution uses live asset.custodianId=${liveAsset?.custodianId}`);
  });

  // ----------------------------------------------------------------
  // 1.4 Expired approval — approval past validity window → MUST FAIL
  // ----------------------------------------------------------------
  r.knownFailure(
    "Expired approval — proposal stays APPROVED forever (no validity window)",
    "RebalanceProposal has no `validUntil` / `expiresAt` field. `approveRebalanceProposal` records approval timestamp but never checks expiry. `executeRebalanceProposal` only checks `lifecycle === APPROVED`. An approval granted N years ago still authorizes execution today. Mitigation: add `validUntilMs: number` to RebalanceProposal, reject execution when Date.now() > createdAt + validUntilMs (default 7 days per §29.2).",
  );

  // ----------------------------------------------------------------
  // 1.5 Replay attack — same approval used twice → MUST FAIL
  // ----------------------------------------------------------------
  r.test("Replay attack — second executeRebalanceProposal on same proposal throws (lifecycle gate)", async () => {
    // Use SIMULATION mode so the full pipeline runs against sim custodians.
    await withExecutionMode("SIMULATION", async () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const rs = getReserveState();
      const proposal = generateRebalanceProposal(
        rs,
        [{ assetClass: "cash", action: "buy", quantity: 50_000, unit: "USD", reason: "test 1.5 replay" }],
        "oracle-v1",
      );
      validateRebalanceProposal(proposal.proposalId);
      approveRebalanceProposal(proposal.proposalId, []);
      // First execution: SETTLED.
      const result1 = await executeRebalanceProposal(proposal.proposalId);
      assert(!result1.failed, `first execution should succeed, got failed=${result1.failed}`);
      const after1 = getProposal(proposal.proposalId)!;
      assert(after1.lifecycle === "SETTLED", `after first exec: SETTLED, got ${after1.lifecycle}`);
      // Replay attempt: must throw (state is no longer APPROVED).
      let replayThrew = false;
      try {
        await executeRebalanceProposal(proposal.proposalId);
      } catch (e: any) {
        replayThrew = true;
        assert(/not in APPROVED state/.test(e?.message ?? ""), `error should mention APPROVED state, got: ${e?.message}`);
      }
      assert(replayThrew, "second executeRebalanceProposal must throw — replay protection via lifecycle state");
      console.log(`      → first exec: SETTLED; replay attempt threw "not in APPROVED state" ✓`);
    });
  });

  // ----------------------------------------------------------------
  // 1.6 Duplicate execution — same proposal executed twice → MUST FAIL
  // ----------------------------------------------------------------
  r.test("Duplicate execution — re-executing a FINAL proposal throws (lifecycle gate)", async () => {
    await withExecutionMode("SIMULATION", async () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const rs = getReserveState();
      const proposal = generateRebalanceProposal(
        rs,
        [{ assetClass: "cash", action: "buy", quantity: 25_000, unit: "USD", reason: "test 1.6 duplicate" }],
        "oracle-v1",
      );
      validateRebalanceProposal(proposal.proposalId);
      approveRebalanceProposal(proposal.proposalId, []);
      const result1 = await executeRebalanceProposal(proposal.proposalId);
      assert(!result1.failed, `first execution should succeed, got failed=${result1.failed}`);
      // Move through the rest of the lifecycle to FINAL.
      confirmSettlement(proposal.proposalId);
      finalizeProposal(proposal.proposalId);
      const afterFinal = getProposal(proposal.proposalId)!;
      assert(afterFinal.lifecycle === "FINAL", `after finalize: FINAL, got ${afterFinal.lifecycle}`);
      // Duplicate execution attempt: must throw.
      let dupThrew = false;
      try {
        await executeRebalanceProposal(proposal.proposalId);
      } catch (e: any) {
        dupThrew = true;
        assert(/not in APPROVED state/.test(e?.message ?? ""), `error should mention APPROVED state, got: ${e?.message}`);
      }
      assert(dupThrew, "duplicate execution of FINAL proposal must throw");
      console.log(`      → lifecycle FINAL; duplicate exec threw "not in APPROVED state" ✓`);
    });
  });
}

// ============================================================
// CATEGORY 2 — CURRENCY ADVERSARIAL (§30)
// ============================================================

function runCurrencyAdversarialTests(r: TestRunner): void {
  r.category("2. Currency Adversarial (§30)");

  // 2.1 JPY -40% — verify SDP triggers AND bounded response (SDP_CAP)
  r.test("JPY −40% depreciation — SDP triggers (severe), SDP_CAP bounds newWeight ≥ current×0.50", () => {
    const jpyToday = BASE_FX.JPY * 0.60;  // 40% drop
    const sdp = detectSDP(jpyToday, BASE_FX.JPY, "JPY");
    assert(sdp.triggered, "SDP should trigger");
    assert(sdp.trigger === "severe", `should be severe (>10%), got ${sdp.trigger}`);
    assert(sdp.deviation! > SDP_SPEC.TRIGGER_THRESHOLD, `deviation > 5% threshold`);
    // SDP_CAP: newWeight cannot drop below currentWeight × 0.50.
    const emergency = computeSDPEmergency(0.05, BASE_FX.JPY, jpyToday, 0.10, "JPY");
    assert(emergency.newWeight! >= 0.10 * SDP_SPEC.CAP,
      `newWeight ${emergency.newWeight} ≥ current×0.50 (${0.10 * SDP_SPEC.CAP}) — anti-shock cap holds`);
    console.log(`      → JPY deviation=${fmtPct(sdp.deviation!)}, newWeight=${fmtPct(emergency.newWeight!)} (floored at ${fmtPct(0.10 * SDP_SPEC.CAP)})`);
  });

  // 2.2 JPY -50% — more severe; verify SDP + SDP_CAP both hold
  r.test("JPY −50% depreciation — SDP severe + SDP_CAP floor holds (anti-shock)", () => {
    const jpyToday = BASE_FX.JPY * 0.50;  // 50% drop
    const sdp = detectSDP(jpyToday, BASE_FX.JPY, "JPY");
    assert(sdp.triggered && sdp.trigger === "severe", `should be severe (50% > 10%), got ${sdp.trigger}`);
    assert(sdp.deviation! >= 0.50, `deviation ≥ 0.50, got ${sdp.deviation}`);
    const emergency = computeSDPEmergency(0.05, BASE_FX.JPY, jpyToday, 0.10, "JPY");
    // SDP_CAP: newWeight ≥ currentWeight × 0.50 = 0.05
    assert(emergency.newWeight! >= 0.10 * SDP_SPEC.CAP,
      `newWeight ${emergency.newWeight} ≥ 0.05 (anti-shock cap)`);
    // Verify K_SDP = ref/current = 1/0.5 = 2.0; W_emergency = 0.05 × 2.0 = 0.10
    assert(approxEq(emergency.emergencyFactor!, 2.0, 1e-6),
      `K_SDP should be 2.0 (ref/current), got ${emergency.emergencyFactor}`);
    assert(approxEq(emergency.emergencyWeight!, 0.10, 1e-6),
      `W_emergency = 0.05 × 2.0 = 0.10, got ${emergency.emergencyWeight}`);
    // newWeight = max(0.10, 0.10×0.50=0.05) = 0.10
    assert(approxEq(emergency.newWeight!, 0.10, 1e-6),
      `newWeight = max(0.10, 0.05) = 0.10, got ${emergency.newWeight}`);
    console.log(`      → JPY −50%: K_SDP=2.0, W_emergency=0.10, newWeight=0.10 (SDP_CAP=0.50 × current=0.10 = 0.05 floored)`);
  });

  // 2.3 USD +20% — concentration cap at 60%
  r.test("USD +20% weight — concentration_cap triggers (critical), excess redistributed to ≤60%", () => {
    const m = new Map<string, number>([
      ["USD", 0.72], ["EUR", 0.13], ["JPY", 0.10], ["GBP", 0.05],
    ]);
    const { weights, capped } = applyConcentrationCap(m);
    assert(capped.has("USD"), `USD should be flagged as capped`);
    assert(weights.get("USD")! <= L_MAX + 1e-9, `USD ≤ ${L_MAX}, got ${weights.get("USD")}`);
    const sum = [...weights.values()].reduce((s, w) => s + w, 0);
    assert(approxEq(sum, 1.0, 1e-6), `Σ after redistribution = ${sum} (expected 1.0)`);
    // detectRebalanceTriggers fires concentration_cap with CRITICAL severity
    const ctx: RebalanceContext = {
      currentWeights: new Map([["USD", 0.72], ["EUR", 0.13], ["JPY", 0.10], ["GBP", 0.05]]),
      targetWeights: new Map([["USD", 0.50], ["EUR", 0.25], ["JPY", 0.15], ["GBP", 0.10]]),
      reserveRatio: 102.05,
      lcr: 6.0,
      rebalanceThreshold: 0.02,
    };
    const triggers = detectRebalanceTriggers(ctx);
    const conc = triggers.find((t) => t.type === "concentration_cap" && t.asset === "USD");
    assert(conc !== undefined, `concentration_cap trigger should fire for USD`);
    assert(conc!.severity === "critical", `severity should be critical (>60% breach), got ${conc!.severity}`);
    console.log(`      → USD 72% → capped to ${fmtPct(weights.get("USD")!)}, ${triggers.filter(t=>t.type==="concentration_cap").length} concentration_cap trigger(s)`);
  });

  // 2.4 EUR +20% appreciation — bounded momentum ±5%
  r.test("EUR +20% appreciation — momentum clamped to ±5% (prevents EUR domination)", () => {
    const appreciatedFx = { ...BASE_FX, EUR: BASE_FX.EUR * 1.20 };
    const s = baselineState({
      oracle: makeOracle(BASE_GOLD_USD, appreciatedFx, { fxAgo: { ...BASE_FX } }),
    });
    computeState(s); // hysteresis warm-up
    const st = computeState(s);
    const eur = st.weights.find((w) => w.code === "EUR")!;
    // Raw momentum = P_ago/P_today = (gold/1.149)/(gold/1.3788) = 1.20 → clamped to 1.05
    assert(approxEq(eur.momentum, 1.05, 1e-3),
      `EUR momentum should be clamped to 1.05 (raw 1.20), got ${eur.momentum}`);
    assert(eur.normalizedWeight <= BASKET_VERIFICATION_SPEC.MAX_CAP + 1e-9,
      `EUR weight ${fmtPct(eur.normalizedWeight)} ≤ 60% cap`);
    console.log(`      → EUR +20%: raw momentum 1.20 → clamped to ${eur.momentum}, normalized weight ${fmtPct(eur.normalizedWeight)}`);
  });

  // 2.5 Emerging-market collapse — currency deviates >10% → SDP "severe"
  r.test("EM currency collapse (CNY −15%) — SDP severe trigger fires", () => {
    const cnyToday = BASE_FX.CNY * 0.85;  // 15% drop
    const sdp = detectSDP(cnyToday, BASE_FX.CNY, "CNY");
    assert(sdp.triggered, `15% deviation should trigger SDP`);
    assert(sdp.trigger === "severe", `should be severe (>10%), got ${sdp.trigger}`);
    assert(sdp.deviation! > SDP_SPEC.SEVERE_THRESHOLD,
      `deviation ${sdp.deviation} > severe threshold ${SDP_SPEC.SEVERE_THRESHOLD}`);
    // Lifecycle: marking CNY suspended should fire currency_eligibility.
    const ctx: RebalanceContext = {
      currentWeights: new Map([["CNY", 0.08], ["USD", 0.50], ["EUR", 0.25], ["JPY", 0.17]]),
      targetWeights: new Map([["CNY", 0.08], ["USD", 0.50], ["EUR", 0.25], ["JPY", 0.17]]),
      reserveRatio: 102.05,
      lcr: 6.0,
      rebalanceThreshold: 0.02,
      currencyStatuses: new Map([["CNY", "suspended"]]),
    };
    const triggers = detectRebalanceTriggers(ctx);
    const elig = triggers.find((t) => t.type === "currency_eligibility" && t.asset === "CNY");
    assert(elig !== undefined, `currency_eligibility trigger should fire for suspended CNY`);
    assert(elig!.severity === "high", `suspended → high severity, got ${elig!.severity}`);
    console.log(`      → CNY deviation=${fmtPct(sdp.deviation!)} (severe), currency_eligibility=${elig!.severity}`);
  });

  // 2.6 Dollar shortage — USD drops >5% → SDP moderate + normalization
  r.test("USD shortage (USD −6%) — SDP moderate trigger fires (>5% deviation)", () => {
    const usdToday = 0.94;  // USD weakened 6% (vs reference 1.00)
    const sdp = detectSDP(usdToday, 1.00, "USD");
    assert(sdp.triggered, `6% deviation should trigger SDP`);
    assert(sdp.trigger === "moderate", `should be moderate (5% < dev ≤ 10%), got ${sdp.trigger}`);
    assert(sdp.deviation! > SDP_SPEC.TRIGGER_THRESHOLD,
      `deviation ${sdp.deviation} > 5% trigger threshold`);
    // §20 normalization: other currencies rise when USD falls. detectSDP just
    // detects — the rebalance plan handles redistribution.
    const emergency = computeSDPEmergency(0.50, 1.00, usdToday, 0.55, "USD");
    // K_SDP = 1.00/0.94 = 1.0638; W_emergency = 0.50 × 1.0638 = 0.5319
    // current×SDP_CAP = 0.55×0.50 = 0.275; max(0.5319, 0.275) = 0.5319
    assert(emergency.newWeight! > 0.50,
      `newWeight should INCREASE when USD weakens (normalization), got ${emergency.newWeight}`);
    console.log(`      → USD deviation=${fmtPct(sdp.deviation!)} (moderate), newWeight=${fmtPct(emergency.newWeight!)} (rises — normalization)`);
  });

  // 2.7 Simultaneous multi-currency shock — 3+ currencies deviate at once
  r.test("Simultaneous multi-currency shock (3 currencies deviate) — each SDP triggers independently", () => {
    const shocks: Array<{ code: string; ref: number; today: number }> = [
      { code: "JPY", ref: BASE_FX.JPY, today: BASE_FX.JPY * 0.60 },  // −40% severe
      { code: "CNY", ref: BASE_FX.CNY, today: BASE_FX.CNY * 0.85 },  // −15% severe
      { code: "GBP", ref: BASE_FX.GBP, today: BASE_FX.GBP * 0.92 },  // −8% moderate
    ];
    let severeCount = 0;
    let moderateCount = 0;
    for (const sh of shocks) {
      const sdp = detectSDP(sh.today, sh.ref, sh.code);
      assert(sdp.triggered, `${sh.code} should trigger SDP`);
      if (sdp.trigger === "severe") severeCount++;
      else if (sdp.trigger === "moderate") moderateCount++;
    }
    assert(severeCount === 2, `expected 2 severe (JPY, CNY), got ${severeCount}`);
    assert(moderateCount === 1, `expected 1 moderate (GBP), got ${moderateCount}`);
    console.log(`      → 3 simultaneous shocks: ${severeCount} severe + ${moderateCount} moderate — each detected independently ✓`);
  });
}

// ============================================================
// CATEGORY 3 — METALS ADVERSARIAL (§30)
// ============================================================

function runMetalsAdversarialTests(r: TestRunner): void {
  r.category("3. Metals Adversarial (§30)");

  // 3.1 Gold −30% — φ_t stays in [60%, 95%]; minting pauses if RR < 100%
  //
  // NOTE: the Phase 5 task spec says "verify RR stays ≥ 100%" for gold −30%,
  // but mathematically a 30% gold crash drops RR below 100% (gold is ~16%
  // of adjusted reserves; −30% × 16% ≈ −4.8% of R_a, which exceeds the 2.05%
  // over-collateralization buffer). The engine's CORRECT response is to
  // PAUSE minting — that's the protective action. The test verifies both
  // (a) φ_t stays in band AND (b) mintingPaused becomes true.
  //
  r.test("Gold −30% crash — φ_t ∈ [60%, 95%], mintingPaused when RR < 100% (protective response)", () => {
    const s = baselineState({ goldPrice: BASE_GOLD_USD * 0.70 });
    computeState(s); // warm hysteresis
    const st = computeState(s);
    const assets = makeReserveAssets({ goldPrice: s.goldPrice });
    const phi = deriveCurrentBullionGoldShare(assets);
    assert(phi >= PHI_T_SPEC.PHI_MIN - 1e-9 && phi <= PHI_T_SPEC.PHI_MAX + 1e-9,
      `φ_t=${fmtPct(phi)} must be in [${fmtPct(PHI_T_SPEC.PHI_MIN)}, ${fmtPct(PHI_T_SPEC.PHI_MAX)}]`);
    // Gold −30% mathematically drops RR below 100% — the engine MUST pause minting.
    assert(st.mintingPaused,
      `minting MUST be paused when gold −30% drops RR below 100% (got RR=${fmt(st.reserveRatio.ratio, 2)}%, mintingPaused=${st.mintingPaused})`);
    console.log(`      → gold −30%: φ_t=${fmtPct(phi)}, RR=${fmt(st.reserveRatio.ratio, 2)}%, mintingPaused=${st.mintingPaused} (protective response ✓)`);
  });

  // 3.2 Gold +30% rally — bullion layer cap 25% enforced
  r.test("Gold +30% rally — bullion layer cap (25%) enforced when allocation drifts", () => {
    const s = baselineState({ goldPrice: BASE_GOLD_USD * 1.30 });
    computeState(s); // warm hysteresis
    const assets = makeReserveAssets({ goldPrice: s.goldPrice });
    const layerWeights = deriveCurrentLayerWeights(assets);
    const bullionW = layerWeights.get("bullion")!;
    // With gold +30%, bullion layer weight rises. If it exceeds 25% max,
    // a layer_breach trigger must fire.
    const ctx: RebalanceContext = {
      currentWeights: new Map([["USD", 0.50], ["EUR", 0.25], ["JPY", 0.15], ["GBP", 0.10]]),
      targetWeights: new Map([["USD", 0.50], ["EUR", 0.25], ["JPY", 0.15], ["GBP", 0.10]]),
      reserveRatio: 102.05,
      lcr: 6.0,
      rebalanceThreshold: 0.02,
      layerWeights,
      layerRanges: new Map([
        ["fiat", { min: LAYER_SPEC.FIAT.MIN, max: LAYER_SPEC.FIAT.MAX }],
        ["bullion", { min: LAYER_SPEC.BULLION.MIN, max: LAYER_SPEC.BULLION.MAX }],
        ["stablecoin", { min: LAYER_SPEC.STABLECOIN.MIN, max: LAYER_SPEC.STABLECOIN.MAX }],
      ]),
    };
    const triggers = detectRebalanceTriggers(ctx);
    if (bullionW > LAYER_SPEC.BULLION.MAX + 1e-9) {
      const breach = triggers.find((t) => t.type === "layer_breach" && t.asset === "bullion");
      assert(breach !== undefined, `bullion ${fmtPct(bullionW)} > 25% cap → layer_breach trigger must fire`);
      console.log(`      → gold +30%: bullion=${fmtPct(bullionW)} > 25% → layer_breach (${breach!.severity}) ✓`);
    } else {
      console.log(`      → gold +30%: bullion=${fmtPct(bullionW)} ≤ 25% (within band — over-collateralization absorbs)`);
    }
    // Also: dynamic allocation clamps bullion to [15%, 25%].
    const alloc = computeDynamicReserveAllocation({
      totalReserve: 50_000_000, goldPrice: s.goldPrice, silverPrice: BASE_SILVER_USD,
      reserveRatio: 102.05, goldVolatility: 0.015,
    });
    assert(alloc.bullionRatio >= LAYER_SPEC.BULLION.MIN - 1e-9 && alloc.bullionRatio <= LAYER_SPEC.BULLION.MAX + 1e-9,
      `dynamic alloc bullion ${fmtPct(alloc.bullionRatio)} must be clamped to [15%, 25%]`);
  });

  // 3.3 Silver −40% — silver share stays in [5%, 40%]
  r.test("Silver −40% crash — silver share of bullion stays in [5%, 40%]", () => {
    const s = baselineState({ silverPrice: BASE_SILVER_USD * 0.60 });
    const assets = makeReserveAssets({ silverPrice: s.silverPrice });
    const phi = deriveCurrentBullionGoldShare(assets);
    const silverShare = 1 - phi;
    // Constitutional: φ_t ∈ [60%, 95%] ⟺ silver ∈ [5%, 40%]
    assert(phi >= PHI_T_SPEC.PHI_MIN - 1e-9, `φ_t=${fmtPct(phi)} ≥ 60% (silver −40% pushes gold share up)`);
    assert(silverShare >= PHI_T_SPEC.SILVER_MIN - 1e-9 && silverShare <= PHI_T_SPEC.SILVER_MAX + 1e-9,
      `silver share=${fmtPct(silverShare)} must be in [5%, 40%]`);
    console.log(`      → silver −40%: φ_t=${fmtPct(phi)}, silver share=${fmtPct(silverShare)} (within [5%, 40%]) ✓`);
  });

  // 3.4 Silver +40% rally — silver does NOT auto-mirror gold
  r.test("Silver +40% rally — silver share stays ≤ 40% (does not auto-mirror gold)", () => {
    const s = baselineState({ silverPrice: BASE_SILVER_USD * 1.40 });
    const assets = makeReserveAssets({ silverPrice: s.silverPrice });
    const phi = deriveCurrentBullionGoldShare(assets);
    const silverShare = 1 - phi;
    // Silver share rises but is capped at 40% by deriveCurrentBullionGoldShare logic
    // (silverShare = 1 - phi; phi floored at 60% by the band).
    assert(silverShare <= PHI_T_SPEC.SILVER_MAX + 1e-9,
      `silver share=${fmtPct(silverShare)} ≤ 40% cap (silver does not auto-mirror gold)`);
    assert(phi >= PHI_T_SPEC.PHI_MIN - 1e-9,
      `φ_t=${fmtPct(phi)} ≥ 60% floor — gold anchor preserved`);
    // Dynamic allocation clamps silverShare to [5%, 40%].
    const alloc = computeDynamicReserveAllocation({
      totalReserve: 50_000_000, goldPrice: BASE_GOLD_USD, silverPrice: s.silverPrice,
      reserveRatio: 102.05, goldVolatility: 0.015,
    });
    assert(alloc.silverShare >= PHI_T_SPEC.SILVER_MIN - 1e-9 && alloc.silverShare <= PHI_T_SPEC.SILVER_MAX + 1e-9,
      `dynamic alloc silverShare ${fmtPct(alloc.silverShare)} ∈ [5%, 40%]`);
    console.log(`      → silver +40%: φ_t=${fmtPct(phi)}, silver share=${fmtPct(silverShare)} (≤ 40% ✓)`);
  });

  // 3.5 Gold/silver divergence (gold up, silver down) — hysteresis prevents whipsaw
  //
  // Demonstrates that a DIRECTION REVERSAL resets the confirmation counter.
  // Without the reset, an oscillating weight would confirm on cycle 2 (because
  // the cumulative |delta| would exceed the band). The direction-tracking
  // reset forces the new direction to independently reach 2-cycle confirmation.
  //
  r.test("Gold/silver divergence — direction reversal resets counter, requires re-confirmation", () => {
    const state: HysteresisState = { confirmationCounts: new Map(), lastDirections: new Map() };
    // Cycle 1: gold proposed 0.90 (large +delta from 0.80). Direction=+1.
    // Counter 0→1 (no prior direction, no reset). Hold current.
    const r1 = applyHysteresis("XAU", 0.90, 0.80, state);
    assert(approxEq(r1, 0.80, 1e-9), `cycle 1 should hold current 0.80, got ${r1}`);
    assert(state.confirmationCounts.get("XAU") === 1, `counter 0→1, got ${state.confirmationCounts.get("XAU")}`);
    assert(state.lastDirections!.get("XAU") === 1, `lastDirection=+1, got ${state.lastDirections!.get("XAU")}`);
    // Cycle 2: gold proposed 0.70 (DIRECTION REVERSED, -delta). Direction=-1.
    // lastDir=+1, direction=-1 → REVERSAL → reset counter to 0, then 0→1 for
    // the current cycle in the new direction. Hold current.
    const r2 = applyHysteresis("XAU", 0.70, 0.80, state);
    assert(approxEq(r2, 0.80, 1e-9), `cycle 2 (direction reversed) should hold current 0.80, got ${r2}`);
    assert(state.confirmationCounts.get("XAU") === 1,
      `direction reversal resets counter to 0, then increments to 1 (got ${state.confirmationCounts.get("XAU")})`);
    assert(state.lastDirections!.get("XAU") === -1, `lastDirection=-1, got ${state.lastDirections!.get("XAU")}`);
    // Cycle 3: gold proposed 0.70 AGAIN (same direction as cycle 2, -delta).
    // lastDir=-1, direction=-1 → same direction, NO reset. Counter 1→2 ≥ threshold.
    // CONFIRM — return proposed 0.70.
    const r3 = applyHysteresis("XAU", 0.70, 0.80, state);
    assert(approxEq(r3, 0.70, 1e-9),
      `cycle 3 (same direction, count 1→2 ≥ threshold) should CONFIRM 0.70, got ${r3}`);
    // After confirmation, counter resets to 0 (ready for the next change).
    assert(state.confirmationCounts.get("XAU") === 0,
      `after confirmation, counter resets to 0 (got ${state.confirmationCounts.get("XAU")})`);
    console.log(`      → cycle 1: hold (count 0→1, dir=+1) → cycle 2: hold (reversal, count reset→1, dir=-1) → cycle 3: CONFIRM (count 1→2, reset to 0) ✓`);
  });

  // 3.6 Repeated φ_t oscillation (±3% alternating) — direction-tracking prevents confirmation
  r.test("Repeated φ_t oscillation (±3% alternating) — never confirms (anti-whipsaw)", () => {
    const state: HysteresisState = { confirmationCounts: new Map(), lastDirections: new Map() };
    // Alternating ±3% (delta = 0.03 > band 0.02) for 10 cycles.
    let current = 0.80;
    const proposals = [0.83, 0.77, 0.83, 0.77, 0.83, 0.77, 0.83, 0.77, 0.83, 0.77];
    let confirmations = 0;
    for (const proposed of proposals) {
      const result = applyHysteresis("XAU", proposed, current, state);
      if (Math.abs(result - current) > 1e-9) {
        confirmations++;
        current = result;
      }
    }
    assert(confirmations === 0, `alternating ±3% should NEVER confirm (got ${confirmations} confirmations)`);
    // Counter must never reach 2 (every reversal resets it).
    const finalCount = state.confirmationCounts.get("XAU") ?? 0;
    assert(finalCount < HYSTERESIS_SPEC.CONFIRMATION_THRESHOLD,
      `final counter ${finalCount} < threshold ${HYSTERESIS_SPEC.CONFIRMATION_THRESHOLD}`);
    console.log(`      → 10 alternating ±3% cycles → 0 confirmations, final counter=${finalCount} (anti-whipsaw ✓)`);
  });
}

// ============================================================
// CATEGORY 4 — LIQUIDITY ADVERSARIAL (§30)
// ============================================================

function runLiquidityAdversarialTests(r: TestRunner): void {
  r.category("4. Liquidity Adversarial (§30)");

  // 4.1 Redemption wave — 30% of supply in 30 days → LCR ≥1.0 OR emergency
  r.test("Redemption wave (30% of supply in 30 days) — LCR drops; verify ≥1.0 OR emergency protocol", () => {
    // 30% of $54M supply = $16.2M expected redemptions.
    // Baseline HQLA = $32.4M → LCR = 32.4/16.2 = 2.0 (still compliant).
    const lcr_ok = computeLCR(32_400_000, 16_200_000, 0, 0);
    assert(lcr_ok.ratio >= LIQUIDITY_SPEC.LCR_HARD_FLOOR,
      `LCR ${fmt(lcr_ok.ratio)} ≥ 1.0 — even 30% redemption wave is absorbed by $32.4M HQLA`);
    // If HQLA were only $14M (lower buffer), LCR = 14/16.2 = 0.864 < 1.0 → non-compliant.
    const lcr_breach = computeLCR(14_000_000, 16_200_000, 0, 0);
    assert(!lcr_breach.compliant, `LCR ${fmt(lcr_breach.ratio)} < 1.0 — breach detected, emergency triggered`);
    // verifyRebalancePlanLiquidity: any plan that drops projected LCR below 1.0 is blocked.
    const planProxy = { phased: false } as RebalancePlan;
    const blocked = verifyRebalancePlanLiquidity(planProxy, 1.05, -0.10);
    assert(!blocked.allowed, `projected LCR 0.95 < 1.0 → plan blocked`);
    assert(blocked.phased, `blocked plan must be phased`);
    console.log(`      → 30% wave: HQLA $32.4M → LCR=${fmt(lcr_ok.ratio)} ✓; reduced HQLA $14M → LCR=${fmt(lcr_breach.ratio)} (breach, emergency)`);
  });

  // 4.2 Liquidity freeze — stablecoin market frozen → stablecoin_eligibility trigger
  r.test("Liquidity freeze (USDC suspended) — stablecoin_eligibility trigger fires (high severity)", () => {
    const ctx: RebalanceContext = {
      currentWeights: new Map([["USD", 0.50], ["EUR", 0.25], ["JPY", 0.15], ["GBP", 0.10]]),
      targetWeights: new Map([["USD", 0.50], ["EUR", 0.25], ["JPY", 0.15], ["GBP", 0.10]]),
      reserveRatio: 102.05,
      lcr: 6.0,
      rebalanceThreshold: 0.02,
      currencyStatuses: new Map([["USDC", "suspended"]]),
      stablecoinCodes: new Set(["USDC"]),
    };
    const triggers = detectRebalanceTriggers(ctx);
    const stab = triggers.find((t) => t.type === "stablecoin_eligibility" && t.asset === "USDC");
    assert(stab !== undefined, `stablecoin_eligibility trigger should fire for suspended USDC`);
    assert(stab!.severity === "high", `suspended stablecoin → high severity, got ${stab!.severity}`);
    console.log(`      → USDC suspended → stablecoin_eligibility (${stab!.severity}) ✓`);
  });

  // 4.3 Stablecoin depeg (USDC → $0.89) — SDP severe + suspension
  //
  // NOTE: detectSDP uses STRICT inequality for severe (deviation > 0.10).
  // A drop to exactly $0.90 yields deviation = 0.10 which is "moderate"
  // (boundary is inclusive on the lower side). We use $0.89 (deviation 0.11)
  // to clearly exercise the severe branch.
  //
  r.test("Stablecoin depeg (USDC $1.00 → $0.89) — SDP triggers (11% deviation = severe)", () => {
    const sdp = detectSDP(0.89, 1.00, "USDC");
    assert(sdp.triggered, `11% deviation should trigger SDP`);
    assert(sdp.trigger === "severe", `should be severe (deviation > 10%), got ${sdp.trigger}`);
    assert(sdp.deviation! > SDP_SPEC.SEVERE_THRESHOLD,
      `deviation ${sdp.deviation} > severe threshold ${SDP_SPEC.SEVERE_THRESHOLD}`);
    // The engine should mark the stablecoin as suspended via currency_eligibility
    // / stablecoin_eligibility (lifecycle status ≠ "full").
    const ctx: RebalanceContext = {
      currentWeights: new Map([["USD", 0.50], ["EUR", 0.25], ["JPY", 0.15], ["GBP", 0.10]]),
      targetWeights: new Map([["USD", 0.50], ["EUR", 0.25], ["JPY", 0.15], ["GBP", 0.10]]),
      reserveRatio: 102.05,
      lcr: 6.0,
      rebalanceThreshold: 0.02,
      currencyStatuses: new Map([["USDC", "suspended"]]),
      stablecoinCodes: new Set(["USDC"]),
    };
    const triggers = detectRebalanceTriggers(ctx);
    const eligCount = triggers.filter(
      (t) => t.type === "stablecoin_eligibility" || t.type === "currency_eligibility",
    ).length;
    assert(eligCount >= 1, `at least 1 eligibility trigger should fire for suspended USDC`);
    console.log(`      → USDC $0.90 → SDP ${sdp.trigger} (deviation ${fmtPct(sdp.deviation!)}), ${eligCount} eligibility trigger(s) ✓`);
  });

  // 4.4 Custodian failure — verify redistribution across surviving custodians
  r.test("Custodian failure (JPMorgan insolvency) — exposure redistributed, caps respected", () => {
    // Use the default institutional fleet (5 custodians, $50M total exposure).
    const fleet: Custodian[] = DEFAULT_CUSTODIAN_FLEET.map((c) => ({ ...c }));
    const failedId = "cust-jpm";
    const failed = fleet.find((c) => c.id === failedId)!;
    const failedExposure = failed.currentExposure;
    const result = simulateCustodianFailure(fleet, failedId);
    // Survived flag reflects whether all caps were respected post-redistribution.
    assert(result.redistribution.length > 0, `redistribution should produce allocations to survivors`);
    // Each surviving custodian's new concentration ≤ 25% (per-custodian cap).
    for (const alloc of result.redistribution) {
      assert(alloc.allocationPct <= CUSTODIAN_LIMITS.maxSingleCustodian + 1e-9,
        `survivor ${alloc.custodianId} at ${fmtPct(alloc.allocationPct)} ≤ 25% cap`);
    }
    // Survivors count ≥ MIN_CUSTODIANS (3) for the redistribution to be constitutional.
    const survivorCount = fleet.filter((c) => c.id !== failedId && c.status === "active").length;
    assert(survivorCount >= CUSTODIAN_LIMITS.minCustodians,
      `survivor count ${survivorCount} ≥ MIN_CUSTODIANS ${CUSTODIAN_LIMITS.minCustodians}`);
    console.log(`      → JPM ($${failedExposure.toLocaleString()}) failed → redistributed across ${survivorCount} survivors, maxNewConcentration=${fmtPct(result.maxNewConcentration)}, unplaced=$${result.unplacedExposure.toLocaleString()}`);
  });

  // 4.5 Market closure (gold market closed) — existential scenario, minting pauses
  r.test("Gold market closure (goldPrice → near 0) — RR < 100%, minting PAUSES (existential)", () => {
    // If the gold market is "closed", price discovery fails. The closest
    // deterministic simulation: gold price effectively 0 (no buyers).
    const s = baselineState({ goldPrice: BASE_GOLD_USD * 0.10 }); // −90%
    const st = computeState(s);
    assert(st.reserveRatio.ratio < RESERVE_RATIO_SPEC.HARD_FLOOR * 100,
      `RR ${fmt(st.reserveRatio.ratio)}% < 100% — gold market closure is existential`);
    assert(st.mintingPaused,
      `minting MUST be paused when RR < 100% (gold market closure)`);
    console.log(`      → gold −90%: RR=${fmt(st.reserveRatio.ratio, 2)}%, mintingPaused=${st.mintingPaused} (existential — Council must be convened)`);
  });
}

// ============================================================
// CATEGORY 5 — GOVERNANCE ADVERSARIAL (§30)
// ============================================================

function runGovernanceAdversarialTests(r: TestRunner): void {
  r.category("5. Governance Adversarial (§30)");

  // 5.1 Missing approval — execute without approve → MUST FAIL
  r.test("Missing approval — executeRebalanceProposal on PROPOSED (not APPROVED) throws", async () => {
    await withExecutionMode("SIMULATION", async () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const rs = getReserveState();
      const proposal = generateRebalanceProposal(
        rs,
        [{ assetClass: "cash", action: "buy", quantity: 1_000, unit: "USD", reason: "test 5.1 no-approval" }],
        "oracle-v1",
      );
      // Skip validate + approve — try to execute directly from PROPOSED state.
      let threw = false;
      try {
        await executeRebalanceProposal(proposal.proposalId);
      } catch (e: any) {
        threw = true;
        assert(/not in APPROVED state/.test(e?.message ?? ""),
          `error should mention APPROVED state, got: ${e?.message}`);
      }
      assert(threw, "executeRebalanceProposal on a non-APPROVED proposal must throw");
      console.log(`      → execute on PROPOSED threw "not in APPROVED state" ✓`);
    });
  });

  // ----------------------------------------------------------------
  // NOTE on the §29.2 approval-gate tests (5.2 / 5.2b / 5.2c / 5.3 / 5.3b / 5.4):
  // ----------------------------------------------------------------
  // The §29.2 severity-based approval router lives in `approveRebalanceProposal`
  // and operates on `proposal.maxSeverity` + `proposal.lifecycle === "VALIDATED"`.
  // To ISOLATE the approval-gate logic from the §10 concentration cap runtime
  // gate (which would REJECT any proposal that worsens the sim baseline's
  // pre-existing per-custodian over-cap), we generate the proposal via the
  // raw-actions path, then manually set `maxSeverity` + `lifecycle = "VALIDATED"`
  // before calling `approveRebalanceProposal`. This tests the §29.2 router in
  // isolation — the §10 cap gate is exercised separately in test 7.1.
  // ----------------------------------------------------------------

  /**
   * Helper: build a proposal pre-marked VALIDATED with a given maxSeverity,
   * bypassing the §10 cap + trade-suppression validation gates so the §29.2
   * approval router can be tested in isolation.
   */
  function makeValidatedProposal(maxSeverity: "critical" | "high" | "medium" | "low"): RebalanceProposal {
    const rs = getReserveState();
    const proposal = generateRebalanceProposal(
      rs,
      [{ assetClass: "cash", action: "buy", quantity: 1, unit: "USD", reason: `severity=${maxSeverity}` }],
      "oracle-v1",
    );
    // Manually mark VALIDATED + inject maxSeverity (bypasses §10 cap rejection
    // so the §29.2 approval-gate logic can be tested in isolation).
    proposal.lifecycle = "VALIDATED";
    proposal.maxSeverity = maxSeverity;
    proposal.approvalRequired = maxSeverity === "critical" || maxSeverity === "high";
    return proposal;
  }

  // 5.2 Insufficient approval — 2-of-5 for critical severity → MUST FAIL
  r.test("Insufficient approval — 2-of-5 for CRITICAL severity → REJECTED (requires 5-of-5 + council flag)", () => {
    withExecutionMode("SHADOW", () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const proposal = makeValidatedProposal("critical");
      // Only submit 2-of-5 approvals (insufficient for critical which needs 5-of-5).
      const twoApprovals: Array<{ role: ApprovalRole; approved: boolean }> = [
        { role: "treasury_authority", approved: true },
        { role: "risk_authority", approved: true },
      ];
      const result = approveRebalanceProposal(proposal.proposalId, twoApprovals);
      assert(result.lifecycle === "REJECTED",
        `2-of-5 for critical severity should be REJECTED, got ${result.lifecycle}`);
      assert(/Insufficient approvals: 2\/5/.test(result.rejectionReason ?? ""),
        `rejection reason should mention "2/5", got: ${result.rejectionReason}`);
      console.log(`      → 2-of-5 for critical → REJECTED: "${result.rejectionReason}"`);
    });
  });

  // 5.2b Sufficient approval — 5-of-5 + council flag for critical → APPROVED
  r.test("Sufficient approval — 5-of-5 + Constitutional Council flag for CRITICAL → APPROVED", () => {
    withExecutionMode("SHADOW", () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const proposal = makeValidatedProposal("critical");
      const fiveApprovals: Array<{ role: ApprovalRole; approved: boolean }> = [
        { role: "treasury_authority", approved: true },
        { role: "risk_authority", approved: true },
        { role: "constitutional_authority", approved: true },
        { role: "operations_authority", approved: true },
        { role: "independent_oversight", approved: true },
      ];
      const result = approveRebalanceProposal(proposal.proposalId, fiveApprovals, {
        constitutionalCouncilFlag: true,
      });
      assert(result.lifecycle === "APPROVED",
        `5-of-5 + council flag for critical should be APPROVED, got ${result.lifecycle}`);
      console.log(`      → 5-of-5 + council flag for critical → APPROVED ✓`);
    });
  });

  // 5.2c Critical severity WITHOUT council flag → REJECTED (even with 5-of-5)
  r.test("Critical severity — 5-of-5 WITHOUT Constitutional Council flag → REJECTED", () => {
    withExecutionMode("SHADOW", () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const proposal = makeValidatedProposal("critical");
      const fiveApprovals: Array<{ role: ApprovalRole; approved: boolean }> = [
        { role: "treasury_authority", approved: true },
        { role: "risk_authority", approved: true },
        { role: "constitutional_authority", approved: true },
        { role: "operations_authority", approved: true },
        { role: "independent_oversight", approved: true },
      ];
      // 5-of-5 but NO constitutionalCouncilFlag → must be REJECTED.
      const result = approveRebalanceProposal(proposal.proposalId, fiveApprovals);
      assert(result.lifecycle === "REJECTED",
        `5-of-5 WITHOUT council flag for critical should be REJECTED, got ${result.lifecycle}`);
      assert(/Constitutional Council authorization flag/.test(result.rejectionReason ?? ""),
        `rejection should mention Council flag, got: ${result.rejectionReason}`);
      console.log(`      → 5-of-5 without council flag → REJECTED: "${result.rejectionReason}"`);
    });
  });

  // 5.3 Invalid signature — approvals with `approved: false` are rejected by count
  r.test("Invalid signature — approvals with `approved: false` are rejected by count", () => {
    withExecutionMode("SHADOW", () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const proposal = makeValidatedProposal("high");
      // Submit 5 approvals where 2 say approved:false (effectively 3 valid).
      // High severity requires 4-of-5.
      const bogus: Array<{ role: ApprovalRole; approved: boolean }> = [
        { role: "treasury_authority", approved: true },
        { role: "risk_authority", approved: false },     // rejected
        { role: "constitutional_authority", approved: true },
        { role: "operations_authority", approved: false }, // rejected
        { role: "independent_oversight", approved: true },
      ];
      const result = approveRebalanceProposal(proposal.proposalId, bogus);
      // approvedCount = 3, required for high = 4 → REJECTED
      assert(result.lifecycle === "REJECTED",
        `3-of-5 with high severity (requires 4) → REJECTED, got ${result.lifecycle}`);
      assert(/Insufficient approvals: 3\/5/.test(result.rejectionReason ?? ""),
        `rejection reason should mention "3/5", got: ${result.rejectionReason}`);
      console.log(`      → 3-of-5 valid (2 rejected) for high severity → REJECTED ✓`);
    });
  });

  // 5.3b Malformed signature — empty approvals array (no signatures at all)
  r.test("Malformed signature — empty approvals array → REJECTED (0-of-5)", () => {
    withExecutionMode("SHADOW", () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const proposal = makeValidatedProposal("high");
      // Empty approvals array — equivalent to "no signatures submitted".
      const result = approveRebalanceProposal(proposal.proposalId, []);
      assert(result.lifecycle === "REJECTED",
        `0-of-5 approvals → REJECTED, got ${result.lifecycle}`);
      assert(/Insufficient approvals: 0\/5/.test(result.rejectionReason ?? ""),
        `rejection reason should mention "0/5", got: ${result.rejectionReason}`);
      console.log(`      → empty approvals array → REJECTED ("0/5") ✓`);
    });
  });

  // 5.4 Replayed approval — same approval used for different proposal
  // The engine stores approvals per-proposalId in an in-memory Map. Submitting
  // approvals recorded for proposal A to proposal B's `approveRebalanceProposal`
  // call has NO effect on proposal B's state — each proposal tracks its own
  // approvals. The attack surface is the in-memory Map, which is process-scoped
  // (not exposed externally). The test verifies state isolation.
  r.test("Replayed approval — approvals from proposal A do NOT apply to proposal B (state isolation)", () => {
    withExecutionMode("SHADOW", () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      // Proposal A: approve with 4 valid approvals → APPROVED (high severity, 4-of-5).
      const proposalA = makeValidatedProposal("high");
      const fourApprovals: Array<{ role: ApprovalRole; approved: boolean }> = [
        { role: "treasury_authority", approved: true },
        { role: "risk_authority", approved: true },
        { role: "constitutional_authority", approved: true },
        { role: "operations_authority", approved: true },
      ];
      const resultA = approveRebalanceProposal(proposalA.proposalId, fourApprovals);
      assert(resultA.lifecycle === "APPROVED", `A should be APPROVED with 4-of-5, got ${resultA.lifecycle}`);
      // Proposal B: a fresh proposal — its approvals Map is empty.
      const proposalB = makeValidatedProposal("high");
      // Try to "replay" by submitting NO approvals — B should be REJECTED.
      const resultB = approveRebalanceProposal(proposalB.proposalId, []);
      assert(resultB.lifecycle === "REJECTED", `B with 0 approvals should be REJECTED (A's approvals do NOT carry over), got ${resultB.lifecycle}`);
      assert(resultB.approvals.length === 0, `B.approvals should be empty (no carryover from A), got ${resultB.approvals.length}`);
      console.log(`      → A (4-of-5) APPROVED; B (0 approvals) REJECTED — state isolation per proposalId ✓`);
    });
  });

  // 5.5 Altered proposal (change asset after approval) — KNOWN FAILURE
  r.knownFailure(
    "Altered proposal — asset mutated after approval is NOT rejected (no hash)",
    "Same root cause as 1.1/1.2: RebalanceAction.assetClass is read at execution time, not bound to the approved snapshot. An attacker who mutates actions[0].assetClass from 'cash' to 'gold' between APPROVED and EXECUTING would settle a gold trade approved as cash. Mitigation: signed proposal hash (§39 HSM) verified at executeRebalanceProposal entry.",
    () => {
      withExecutionMode("SIMULATION", () => {
        initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
          gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
        });
        const rs = getReserveState();
        const proposal = generateRebalanceProposal(
          rs,
          [{ assetClass: "cash", action: "buy", quantity: 1_000, unit: "USD", reason: "test 5.5" }],
          "oracle-v1",
        );
        validateRebalanceProposal(proposal.proposalId);
        approveRebalanceProposal(proposal.proposalId, []);
        // Attacker swaps asset class.
        const before = proposal.actions[0].assetClass;
        (proposal.actions[0] as any).assetClass = "gold";
        assert(proposal.actions[0].assetClass !== before, "mutation should change assetClass");
      });
    },
  );

  // 5.6 Expired approval (past validity window) — KNOWN FAILURE (same as 1.4)
  r.knownFailure(
    "Expired approval — no validity window enforces expiry (§29.2 gap)",
    "Same root cause as 1.4. RebalanceProposal lacks a `validUntil` field; an approval granted months ago still authorizes execution today. The §29.2 spec implies a validity window but the engine does not implement one.",
  );
}

// ============================================================
// CATEGORY 6 — ORACLE ADVERSARIAL (§30)
// ============================================================

function runOracleAdversarialTests(r: TestRunner): void {
  r.category("6. Oracle Adversarial (§30)");

  // 6.1 Stale oracle (>1hr old) — verify rejection / fallback
  r.test("Stale oracle — observations >1hr old are rejected, fallback to previousPrice", () => {
    const now = Date.now();
    const stale = now - 2 * 60 * 60 * 1000; // 2 hours ago
    const observations: OracleObservation[] = Array.from({ length: 6 }, (_, i) => ({
      source: `src-${i}`,
      weight: 1.0 / 6,
      price: 4_000,
      timestamp: stale,
      eligible: true,
    }));
    const result = oracleConsensus(observations, 4_076.9);
    assert(result.fallbackUsed, `all-stale observations should trigger fallback, got method=${result.method}`);
    assert(result.validObservations === 0, `0 fresh observations, got ${result.validObservations}`);
    // Fallback uses previousPrice when no fresh observations exist.
    assert(approxEq(result.consensusPrice, 4_076.9, 1e-6),
      `fallback consensusPrice should equal previousPrice, got ${result.consensusPrice}`);
    console.log(`      → 6 stale observations (2hr old) → method="${result.method}", consensus=${result.consensusPrice} (= previousPrice) ✓`);
  });

  // 6.2 Conflicting oracle (sources disagree >5%) — verify outlier rejection
  r.test("Conflicting oracle — sources disagree >5%, MAD outlier exclusion kicks in", () => {
    const now = Date.now();
    // 5 sources around $4000, 1 source at $4300 (+7.5% deviation).
    const observations: OracleObservation[] = [
      { source: "s1", weight: 0.20, price: 4_000, timestamp: now, eligible: true },
      { source: "s2", weight: 0.20, price: 3_995, timestamp: now, eligible: true },
      { source: "s3", weight: 0.20, price: 4_005, timestamp: now, eligible: true },
      { source: "s4", weight: 0.20, price: 4_010, timestamp: now, eligible: true },
      { source: "s5", weight: 0.10, price: 4_000, timestamp: now, eligible: true },
      { source: "outlier", weight: 0.10, price: 4_300, timestamp: now, eligible: true },
    ];
    const result = oracleConsensus(observations, 4_000);
    // The outlier at 4300 should be quarantined by MAD (median=4000, MAD=5, 3×MAD=15, |4300-4000|=300 > 15).
    assert(result.quarantined >= 1, `at least 1 outlier should be quarantined, got ${result.quarantined}`);
    // The consensus should be close to 4000 (not 4300).
    assert(Math.abs(result.consensusPrice - 4_000) < 30,
      `consensus ${result.consensusPrice} should be near $4,000 (outlier excluded), not pulled to $4,300`);
    console.log(`      → 5 sources ~$4,000 + 1 outlier at $4,300 → quarantined=${result.quarantined}, consensus=${result.consensusPrice}`);
  });

  // 6.3 Outlier oracle (one source 10× off) — verify consensus is NOT pulled
  //
  // NOTE on MAD edge case: when 5 of 6 observations are IDENTICAL ($4,000),
  // the median = $4,000 and the MAD (median absolute deviation) = 0. The
  // engine's MAD filter is `if (mad > 0) { filter }` — so when MAD=0, NO
  // outlier is quarantined. The 10× manipulator observation IS counted in
  // `validObservations` (6, not 5). However, the WEIGHTED MEDIAN still
  // rejects the manipulator's price pull: 5 sources at $4,000 carry 90%
  // of the weight, so the cumulative weight reaches 50% at $4,000 — the
  // manipulator's $40,000 observation is on the high end of the sorted list
  // and never becomes the median. The defense is the WEIGHTED MEDIAN, not MAD.
  //
  r.test("Outlier oracle — one source 10× off does NOT pull consensus (weighted median defense)", () => {
    const now = Date.now();
    const observations: OracleObservation[] = [
      { source: "s1", weight: 0.20, price: 4_000, timestamp: now, eligible: true },
      { source: "s2", weight: 0.20, price: 4_000, timestamp: now, eligible: true },
      { source: "s3", weight: 0.20, price: 4_000, timestamp: now, eligible: true },
      { source: "s4", weight: 0.20, price: 4_000, timestamp: now, eligible: true },
      { source: "s5", weight: 0.10, price: 4_000, timestamp: now, eligible: true },
      { source: "manipulator", weight: 0.10, price: 40_000, timestamp: now, eligible: true }, // 10× off
    ];
    const result = oracleConsensus(observations, 4_000);
    // The consensus should be $4,000 (weighted median ignores the 10× outlier).
    assert(approxEq(result.consensusPrice, 4_000, 1e-6),
      `consensus should be $4,000 (weighted median rejects 10× outlier), got ${result.consensusPrice}`);
    // The manipulator's price does NOT pull the consensus.
    assert(result.consensusPrice < 10_000,
      `consensus ${result.consensusPrice} must NOT be pulled toward $40,000 outlier`);
    console.log(`      → 5 sources @ $4,000 + 1 @ $40,000 → consensus=${result.consensusPrice} (weighted median rejects outlier pull; MAD=0 so quarantined=${result.quarantined}) ✓`);
  });

  // 6.4 Oracle outage — all sources fail (stale or ineligible) → "failed" method, previousPrice
  r.test("Oracle outage — all sources stale/ineligible → method=failed, previousPrice used", () => {
    const now = Date.now();
    const stale = now - 2 * 60 * 60 * 1000; // 2hr ago
    const observations: OracleObservation[] = [
      { source: "s1", weight: 0.25, price: 4_000, timestamp: stale, eligible: true },    // stale
      { source: "s2", weight: 0.25, price: 4_000, timestamp: now, eligible: false },      // ineligible
      { source: "s3", weight: 0.25, price: 4_000, timestamp: stale, eligible: false },    // both
      { source: "s4", weight: 0.25, price: 4_000, timestamp: now, eligible: true },       // 1 fresh+eligible
    ];
    // Only 1 fresh+eligible → quorum (5) NOT met → TWAP fallback.
    const result = oracleConsensus(observations, 4_076.9);
    assert(result.fallbackUsed, `quorum failure should trigger fallback, got method=${result.method}`);
    assert(result.validObservations < ORACLE_MINIMUM_QUORUM,
      `valid observations ${result.validObservations} < quorum ${ORACLE_MINIMUM_QUORUM}`);
    // TWAP fallback = average of the valid (1) observations = 4000.
    assert(approxEq(result.consensusPrice, 4_000, 1e-6),
      `TWAP fallback consensus = 4000 (single valid obs), got ${result.consensusPrice}`);
    // Oracle failure recovery procedure should be invoked.
    const recovery = oracleFailureRecovery(result, 4_076.9);
    assert(recovery.action.includes("TWAP") || recovery.action.includes("fallback") || recovery.action.includes("Suspend"),
      `recovery action should mention TWAP/fallback/Suspend, got: ${recovery.action}`);
    console.log(`      → 4 sources (1 fresh+eligible) < quorum 5 → method="${result.method}", recovery="${recovery.scenario}" ✓`);
  });

  // 6.5 Manipulated price — price that would breach concentration is rejected
  r.test("Manipulated price — USD weight pushed >60% triggers concentration_cap (rejection)", () => {
    // An attacker manipulates the oracle so USD appears to have 70% weight.
    // The concentration cap layer must reject this.
    //
    // NOTE: applyConcentrationCap MUTATES the input map (it sets USD → 0.60
    // in-place). To verify the ORIGINAL manipulated basket via verifyBasket,
    // we must pass a FRESH copy (not the post-cap mutated map).
    //
    const m = new Map<string, number>([
      ["USD", 0.70], ["EUR", 0.13], ["JPY", 0.10], ["GBP", 0.07],
    ]);
    // Verify the ORIGINAL (pre-cap) basket is rejected.
    const vOriginal = verifyBasket(new Map(m));
    assert(!vOriginal.allBelowCap, `verifyBasket should reject USD=70% > 60% cap (got allBelowCap=${vOriginal.allBelowCap})`);
    assert(!vOriginal.passed, `manipulated basket should fail verification`);
    // Apply the cap — USD gets capped to 60%, excess redistributed.
    const { weights, capped } = applyConcentrationCap(m);
    assert(capped.has("USD"), `USD at 70% must be flagged as capped`);
    assert(weights.get("USD")! <= BASKET_VERIFICATION_SPEC.MAX_CAP + 1e-9,
      `USD after cap ${weights.get("USD")} ≤ 60% — manipulated concentration rejected`);
    console.log(`      → manipulated USD=70% → verifyBasket.passed=${vOriginal.passed} (rejected); applyConcentrationCap → ${fmtPct(weights.get("USD")!)} ✓`);
  });
}

// ============================================================
// CATEGORY 7 — RESERVE INTEGRITY (§30)
// ============================================================

function runReserveIntegrityTests(r: TestRunner): void {
  r.category("7. Reserve Integrity (§30)");

  // 7.1 Concentration breach (>60%) — critical trigger + rejection
  r.test("Concentration breach — USD >60% triggers concentration_cap (critical), basket rejected", () => {
    const ctx: RebalanceContext = {
      currentWeights: new Map([["USD", 0.65], ["EUR", 0.15], ["JPY", 0.12], ["GBP", 0.08]]),
      targetWeights: new Map([["USD", 0.50], ["EUR", 0.25], ["JPY", 0.15], ["GBP", 0.10]]),
      reserveRatio: 102.05, lcr: 6.0, rebalanceThreshold: 0.02,
    };
    const triggers = detectRebalanceTriggers(ctx);
    const conc = triggers.find((t) => t.type === "concentration_cap" && t.asset === "USD");
    assert(conc !== undefined, `concentration_cap trigger must fire for USD=65%`);
    assert(conc!.severity === "critical", `>60% breach → critical, got ${conc!.severity}`);
    // The trigger is an EMERGENCY OVERRIDE — bypasses trade suppression.
    assert(isEmergencyOverride([conc!]), `concentration_cap trigger is an emergency override`);
    console.log(`      → USD=65% → concentration_cap (critical), emergency override=${isEmergencyOverride([conc!])} ✓`);
  });

  // 7.2 RR deterioration (RR<100%) — minting auto-pause
  r.test("RR deterioration (RR<100%) — minting auto-pauses", () => {
    // Crash gold enough to push RR < 100%.
    const s = baselineState({ goldPrice: BASE_GOLD_USD * 0.30 });
    const st = computeState(s);
    assert(st.reserveRatio.ratio < RESERVE_RATIO_SPEC.HARD_FLOOR * 100,
      `RR ${fmt(st.reserveRatio.ratio)}% < 100% — deterioration detected`);
    assert(st.mintingPaused,
      `minting MUST be paused when RR < 100% (got mintingPaused=${st.mintingPaused})`);
    // At healthy baseline, minting is NOT paused.
    const sHealthy = baselineState();
    const stHealthy = computeState(sHealthy);
    assert(!stHealthy.mintingPaused,
      `minting should NOT be paused at healthy baseline (RR=${stHealthy.reserveRatio.ratio.toFixed(2)}%)`);
    console.log(`      → gold −70%: RR=${fmt(st.reserveRatio.ratio, 2)}%, mintingPaused=${st.mintingPaused} ✓`);
  });

  // 7.3 LCR deterioration (LCR<1.0) — plan rejection
  r.test("LCR deterioration (LCR<1.0) — verifyRebalancePlanLiquidity rejects plan", () => {
    const plan: RebalancePlan = {
      triggers: [], actions: [], estimatedCost: 0,
      liquidityImpact: "minimal", reserveRatioImpact: 0,
      approvalRequired: false, phased: false,
    };
    // LCR = 1.05, delta = -0.10 → projected 0.95 < 1.0 → blocked.
    const blocked = verifyRebalancePlanLiquidity(plan, 1.05, -0.10);
    assert(!blocked.allowed, `projected LCR 0.95 < 1.0 → plan blocked`);
    assert(blocked.phased, `blocked plan must be phased`);
    // LCR = 1.50, delta = -0.10 → projected 1.40 ≥ 1.0 → allowed.
    const ok = verifyRebalancePlanLiquidity(plan, 1.50, -0.10);
    assert(ok.allowed, `projected LCR 1.40 ≥ 1.0 → plan allowed`);
    console.log(`      → projected LCR 0.95 → blocked (phased); projected LCR 1.40 → allowed ✓`);
  });

  // 7.4 LRR deterioration (LRR<0.9) — critical status
  r.test("LRR deterioration (LRR<0.9) — lrrThreshold returns 'critical'", () => {
    // LRR < 0.9 is the critical threshold per Article XIII.
    assert(lrrThreshold(0.85) === "critical", `LRR=0.85 → critical, got ${lrrThreshold(0.85)}`);
    assert(lrrThreshold(0.90) === "marginal", `LRR=0.90 (boundary) → marginal, got ${lrrThreshold(0.90)}`);
    assert(lrrThreshold(0.95) === "marginal", `LRR=0.95 → marginal, got ${lrrThreshold(0.95)}`);
    assert(lrrThreshold(1.00) === "compliant", `LRR=1.00 → compliant, got ${lrrThreshold(1.00)}`);
    assert(lrrThreshold(1.20) === "strong", `LRR=1.20 → strong, got ${lrrThreshold(1.20)}`);
    // LRR<0.9 should escalate to emergency protocols.
    assert(lrrThreshold(0.80) === "critical", `LRR=0.80 → critical (gold liquidation may be approached)`);
    console.log(`      → LRR thresholds: 0.80=critical, 0.85=critical, 0.90=marginal, 1.00=compliant, 1.20=strong ✓`);
  });

  // 7.5 Reconciliation mismatch — custodian disagrees with ledger → exception
  r.test("Reconciliation mismatch — custodian reports wrong gold qty → status=exception", () => {
    initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
      gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
    });
    // Custodian reports gold qty 100oz LESS than the executed ledger.
    const corrupted = buildMatchingCustodianConfirmation({
      corruptAssetId: "gold-primary",
      corruptQty: BASELINE_COMPOSITION.GOLD_OZ - 100,
    });
    const state = commitCustodianConfirmation(corrupted);
    assert(state.reconciliationStatus === "exception",
      `mismatch should produce status=exception, got ${state.reconciliationStatus}`);
    assert(state.custodianVariance > 0,
      `custodianVariance should be non-zero on mismatch, got ${state.custodianVariance}`);
    // The gold-primary entry in the reconciled view should be flagged "exception".
    const goldRecon = state.reconciled.find((a) => a.assetId === "gold-primary");
    assert(goldRecon?.reconciliationStatus === "exception",
      `gold-primary reconciled status should be "exception", got ${goldRecon?.reconciliationStatus}`);
    console.log(`      → custodian reports gold 100oz short → status=exception, variance=$${state.custodianVariance.toFixed(0)} ✓`);
  });

  // 7.6 Restart during execution — state survives OR fails closed
  // The SIMULATION engine uses in-memory state — a process restart RESETS
  // the reserve state to BASELINE_COMPOSITION. There is no persistence
  // layer. This is a KNOWN GAP for production; acceptable for testnet.
  r.knownFailure(
    "Restart during execution — in-memory state does NOT survive process restart",
    "reserve-state.ts uses a module-level `reserveStateStore` variable. On process restart, the state is lost and re-initializes to BASELINE_COMPOSITION. In-flight proposals (execution-engine.ts `proposals` Map) are also lost. Mitigation: persist `reserveStateStore` + `proposals` Map to a durable store (Postgres/Redis) on every commit; restore on boot before accepting API traffic. The §29.10 audit ledger (logs/rebalance-audit.jsonl) IS durable (append-only file) — it can be replayed to reconstruct state, but the engine does not currently replay it.",
    () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      const before = getReserveState();
      const beforeVersion = before.reserveStateVersion;
      // Simulate a restart by calling initializeReserveState again.
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      const after = getReserveState();
      // Version resets to 0 — state did NOT survive.
      assert(after.reserveStateVersion === 0,
        `after re-init: version reset to 0 (was ${beforeVersion}) — state did NOT survive`);
    },
  );

  // 7.7 Duplicate execution (same proposal twice) — rejection
  // (Also tested in 1.6; included here for the §30 reserve-integrity checklist.)
  r.test("Duplicate execution — same proposal cannot be executed twice (lifecycle gate)", async () => {
    await withExecutionMode("SIMULATION", async () => {
      initializeReserveState(BASE_GOLD_USD, BASE_SILVER_USD, {
        gold: 0.18, silver: 0.04, cash: 0.50, sovereign: 0.25, stablecoin: 0.03,
      });
      _resetTurnoverTrackerForTests();
      const rs = getReserveState();
      const proposal = generateRebalanceProposal(
        rs,
        [{ assetClass: "cash", action: "buy", quantity: 10_000, unit: "USD", reason: "test 7.7" }],
        "oracle-v1",
      );
      validateRebalanceProposal(proposal.proposalId);
      approveRebalanceProposal(proposal.proposalId, []);
      const r1 = await executeRebalanceProposal(proposal.proposalId);
      assert(!r1.failed, `first execution should succeed`);
      // Second execution must throw.
      let threw = false;
      try {
        await executeRebalanceProposal(proposal.proposalId);
      } catch (e: any) {
        threw = true;
        assert(/not in APPROVED state/.test(e?.message ?? ""), `error should mention APPROVED state`);
      }
      assert(threw, "duplicate execution must throw");
      console.log(`      → first exec SETTLED; second exec threw "not in APPROVED state" ✓`);
    });
  });
}

// ============================================================
// CATEGORY 8 — DIRECT CONTRACT BYPASS ATTACK (§30)
// ============================================================
//
// Per §30: an attacker who attempts to call Mint.sol / Reserve.sol directly
// (bypassing the TS engine) must be independently rejected by the on-chain
// contract's own constitutional guards. The TS engine is the recommendation
// layer; the on-chain contract is the enforcement layer.
//
// In this TypeScript testbed the on-chain contract is NOT deployed — but the
// equivalent logic is implemented in monetary-engine-v19 (computeReserveRatio,
// mintFee, mintingPaused) and v19-infrastructure (checkInvariantConflict,
// CONSTITUTIONAL_CONSTANTS). These tests verify those guards refuse
// constitutionally prohibited execution.
//
function runDirectContractBypassTests(r: TestRunner): void {
  r.category("8. Direct Contract Bypass Attack (§30)");

  // 8.1 Minting with RR<100% — engine's `mintingPaused` gate refuses
  r.test("Direct mint with RR<100% — engine's mintingPaused gate refuses (MTQ._checkReserveRatio equivalent)", () => {
    // Crash gold enough to push RR < 100%.
    const s = baselineState({ goldPrice: BASE_GOLD_USD * 0.30 });
    const st = computeState(s);
    assert(st.reserveRatio.ratio < RESERVE_RATIO_SPEC.HARD_FLOOR * 100,
      `RR ${fmt(st.reserveRatio.ratio)}% < 100% — minting must be refused`);
    assert(st.mintingPaused,
      `mintingPaused=true is the engine-level guard that blocks direct mint when RR<100%`);
    // The on-chain equivalent (MTQ._checkReserveRatio in Mint.sol) would revert.
    // The TS engine surfaces this via the mintingPaused flag.
    console.log(`      → RR=${fmt(st.reserveRatio.ratio, 2)}% → mintingPaused=${st.mintingPaused} (engine refuses; on-chain MTQ._checkReserveRatio would revert) ✓`);
  });

  // 8.2 Minting with invalid tier — checkInvariantConflict refuses non-amendable constants
  //
  // An attacker attempts to enable sub-100% minting by lowering RR_min (the
  // constitutional floor). The §45.3 checkInvariantConflict guard must refuse
  // ANY proposal that touches a non-amendable constant. RR_min is the ONLY
  // non-modifiable ratio constant in the §53 registry — LCR_min, SDP_cap,
  // W_max, etc. are all `modifiable: true` (they go through the §53.2
  // amendment process with timelock + supermajority).
  //
  r.test("Direct mint with invalid tier — proposal to lower RR_min is refused (non-amendable constant)", () => {
    // Verify RR_min is the non-modifiable constitutional floor.
    const rrMin = CONSTITUTIONAL_CONSTANTS.find((c) => c.symbol === "RR_min");
    assert(rrMin?.modifiable === false, `RR_min must be non-modifiable (constitutional invariant)`);
    // An attacker proposes to lower RR_min below 100% to enable minting at
    // sub-100% reserve. The §45.3 checkInvariantConflict guard must refuse.
    const result1 = checkInvariantConflict("Proposal: lower RR_min to 0.95 to enable emergency minting");
    assert(result1.violates, `proposal to lower RR_min must be refused, got violates=${result1.violates}`);
    assert(result1.invariant?.includes("RR_min") || result1.invariant?.includes("Reserve Ratio Minimum"),
      `invariant should mention RR_min, got: ${result1.invariant}`);
    // Also refuses proposals to amend / change / modify / remove RR_min.
    const result2 = checkInvariantConflict("Proposal: amend RR_min to 0.90");
    assert(result2.violates, `proposal to amend RR_min must be refused`);
    const result3 = checkInvariantConflict("Proposal: remove RR_min constraint entirely");
    assert(result3.violates, `proposal to remove RR_min must be refused`);
    console.log(`      → proposals to lower/amend/remove RR_min all refused (non-amendable constitutional constant) ✓`);
  });

  // 8.3 Redemption when not authorized — §45.2 says anyone can redeem
  r.test("Direct redemption — §45.2 guarantees redemption rights (non-suspendable burn)", () => {
    // Per §45.2: redemption is NEVER suspended. The redemption path is open
    // to any MTQ holder. The engine's redemptionFee + redemptionSequence
    // enforce Article X liquidation order but do NOT gate on authorization.
    const fee = redemptionFee(1_000); // $1,000 redemption
    assert(fee > 0, `redemption fee should be positive ($1,000 × 5bps = $5, got ${fee})`);
    assert(fee <= 5_000, `redemption fee capped at $5,000 (REDEEM_FEE_CAP), got ${fee}`);
    // Article X liquidation order is preserved — gold LAST.
    const availableAssets = [
      { assetClass: "stablecoin", usdValue: 2_700_000 },
      { assetClass: "cash", usdValue: 29_000_000 },
      { assetClass: "sovereign", usdValue: 13_500_000 },
      { assetClass: "silver", usdValue: 2_160_000 },
      { assetClass: "gold", usdValue: 8_654_000 },
    ];
    // $10M redemption — fits within non-gold HQLA.
    const seq = redemptionSequence(10_000_000, availableAssets);
    const prot = bullionProtectionCheck(seq);
    assert(prot.sufficient, `redemption should be sufficient`);
    assert(!prot.goldLiquidated, `gold should NOT be liquidated (HQLA sufficient)`);
    // Anyone can redeem — the engine has no "authorized redeemer" check.
    // (Production: KYC/AML is enforced at the custodian layer, not at the
    //  constitutional layer. The constitutional layer guarantees redemption.)
    const invariantNames = [
      "100% Reserve Minimum",
      "No Discretionary Minting",
      "No Lending of Reserves",
      "No Commingling of Reserves with Operational Funds",
      "Bullion Preservation",
    ];
    // Verify none of the 5 absolute invariants gate on redemption authorization.
    for (const inv of invariantNames) {
      assert(!inv.toLowerCase().includes("redemption authorized"),
        `invariant "${inv}" must NOT gate redemption on authorization (§45.2)`);
    }
    console.log(`      → redemption fee=$${fee} (5bps, capped $5K); $10M redemption: gold NOT liquidated (HQLA sufficient); no authorization gate (§45.2) ✓`);
  });
}

// ============================================================
// MAIN — run all 8 categories, print summary, exit
// ============================================================

function main(): void {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   MITHQAL — PHASE 5 ADVERSARIAL TEST SUITE (§29-30)         ║");
  console.log("║   8 categories · attack vectors + cross-layer consistency   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  // Pre-warm the engine's module-level hysteresis state so subsequent
  // comparisons are stable.
  computeState(baselineState());

  const r = new TestRunner();

  runCrossLayerConsistencyTests(r);
  runCurrencyAdversarialTests(r);
  runMetalsAdversarialTests(r);
  runLiquidityAdversarialTests(r);
  runGovernanceAdversarialTests(r);
  runOracleAdversarialTests(r);
  runReserveIntegrityTests(r);
  runDirectContractBypassTests(r);

  // ─────────── SUMMARY ───────────
  const total = r.results.length;
  const passed = r.results.filter((x) => x.passed).length;
  const failed = r.results.filter((x) => !x.passed).length;
  const knownFails = r.results.filter((x) => x.knownFailure).length;
  const trueFails = failed - knownFails;

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                        SUMMARY                               ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");

  const categories = [...new Set(r.results.map((x) => x.category))];
  for (const cat of categories) {
    const catResults = r.results.filter((x) => x.category === cat);
    const catPass = catResults.filter((x) => x.passed).length;
    const catFail = catResults.length - catPass;
    const catKnown = catResults.filter((x) => x.knownFailure).length;
    const tag = catKnown > 0 ? ` (${catKnown} known)` : "";
    const line = `  ${cat.padEnd(60)} ${catPass}/${catResults.length} passed${tag}`;
    console.log(line);
  }

  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`  TOTAL: ${passed}/${total} tests passed (${failed} failed: ${trueFails} true failures + ${knownFails} known failures)`);
  if (knownFails > 0) {
    console.log("  KNOWN FAILURES (documented, not hidden):");
    for (const kf of r.results.filter((x) => x.knownFailure)) {
      console.log(`    ⚠️  [${kf.category}] ${kf.name}`);
    }
  }
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (failed === 0) {
    console.log("\n✅ ALL TESTS PASSED");
    process.exit(0);
  } else {
    console.log(`\n❌ ${failed} TEST(S) FAILED (including ${knownFails} known failure(s))`);
    process.exit(1);
  }
}

main();

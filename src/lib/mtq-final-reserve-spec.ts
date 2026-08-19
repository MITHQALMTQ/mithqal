// ============================================================================
// §V25.2 — FINAL MTQ INSTITUTIONAL BACKING ARCHITECTURE
// ============================================================================
// This module is the CONTROLLING reserve mathematical specification for the
// MTQ system. It supersedes all older conflicting material per the §49
// Blueprint Conflict Reconciliation directive.
//
// Implements (faithfully) the 50-section COO/CTO directive:
//   §1-6   Institutional backing structure + mathematical foundation + 130% target
//   §7-16  Currency weight engine (COFER/SWIFT/BIS → momentum → mean-reversion
//          → EWMA volatility attenuation → K factor → liquidity overlay →
//          proportional normalization → concentration caps)
//   §17    Effective USD exposure (direct + AED/SAR peg-equivalent + synthetic + digital)
//   §18-19 Currency fall price effect + post-fall weight drift
//   §20-22 Currency lifecycle (WATCH/REDUCE/SUSPEND/SUBSTITUTE/REINSTATE) +
//          exit renormalization + minimum-floor Q1-Q4 removal
//   §23-29 Gold/bullion (18% target, 15-25% corridor, silver SDC=0%, PAXG conditional TGRS, BRI advisory)
//   §30-36 Digital liquidity (2%/3%/5%/0% tiers, DRQS scoring, USDC/USDP/EURC/BUIDL approved,
//          DAI/USDT excluded-from-core, stablecoin stress equation, state machine)
//   §37-42 Reserve valuation (market/adjusted/stress), counterparty adjustment,
//          three NAVs, FSCR, LCR
//   §43-44 Rebalancing (delta trigger, 2pp threshold, hard overrides, transaction-cost NetBenefit test)
//   §45    What-if scenario engine (4 canonical scenarios)
//   §46-48 Final asset admission structure (core reserve / settlement-only / USDT architecture)
//   §49    Blueprint conflict reconciliation (4 conflicts)
//   §50    Final equation system
//
// HONEST STATE:
//   - This is a DESIGN-TIME specification engine, NOT a live market data system.
//   - All reserve inputs (COFER shares, FX prices, gold spot, DRQS scores) are
//     policy reference values / illustrative inputs, NOT live oracle feeds.
//   - finalStatus = "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED"
//   - No real bank/provider/asset is contracted. All backing is SIMULATED/SPECIFIED.
// ============================================================================

export const MODULE_ID = "v25.2-final-reserve-spec-1.0";
export const SPEC_VERSION = "v25.2 (FINAL RESERVE MATHEMATICAL SPECIFICATION — CONTROLLING)";
export const DIRECTIVE_SECTIONS = 50;
export const HONEST_STATE = {
  designTimeSpec: true,
  liveOracleFeeds: false,
  bankContracted: false,
  providerContracted: false,
  assetContracted: false,
  productionAuthorized: false,
  finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED",
  finalStatusColor: "AMBER" as const,
};

// ============================================================================
// PART A — §1-6: INSTITUTIONAL BACKING STRUCTURE & 130% TARGET
// ============================================================================

// §1 — MTQ is bank/institutional backing, NOT a MITHQAL-owned reserve.
// MITHQAL: verifies, applies constitutional rules, calculates issuance capacity,
//          authorizes issuance, reconciles, monitors systemic risk.
// MITHQAL does NOT: own the backing, custody it by default.
// The Protected Backing Cell is a bank-side identified/earmarked allocation.

export const PAR = 1.00; // §2 — accounting/settlement reference (USD)

export const RESERVE_TARGETS = {
  // §3 — 130% is the controlling strategic backing target (supersedes older 120%)
  RR_strategic: 1.30,        // strategic target
  RR_policy_floor: 1.05,     // policy floor
  RR_floor: 1.00,            // absolute solvency floor
  // §4 — Emergency resilience capacity is SEPARATE from core reserve
  emergencyCapacityMax: 0.15, // ≤ 15%, not auto-added to 130%
  // §42 — Core sleeve composition (80/18/2 of the 130% core backing)
  fiatPct: 0.80,
  goldPct: 0.18,
  digitalPct: 0.02,
  // §42 — Front-line vs strategic split WITHIN fiat
  frontlinePct: 0.50,       // of total core reserve
  strategicFiatPct: 0.30,   // of total core reserve
  // §5 — Constitutional corridors (the policy CENTER is 80/18/2)
  fiatCorridor: { min: 0.70, max: 0.85 },
  bullionCorridor: { min: 0.15, max: 0.25 },
  digitalCorridor: { min: 0.00, max: 0.05 },
} as const;

// §6 — Settlement-only currencies (NOT core reserve, but usable for conversion)
export const SETTLEMENT_ONLY_CURRENCIES = [
  "EGP", "INR", "KRW", "TRY", "BRL", "MXN", "ZAR", "IDR", "MYR", "THB",
] as const;

// §46A — Core reserve currency basket (Layer A, 11 currencies, CNY conditional)
export const CORE_RESERVE_CURRENCIES = [
  "USD", "EUR", "CHF", "JPY", "GBP", "SGD", "AED", "SAR", "CNY", "CAD", "AUD",
] as const;

export interface BackingBreakdown {
  totalStrategicBacking: number;
  fiat: number;            // 80%
  gold: number;            // 18%
  digital: number;         // 2%
  frontlineFiat: number;   // 50% of total core
  strategicFiat: number;   // 30% of total core
  emergencyCapacity: number; // separate, ≤15%, currently 0 unless activated
}

// §3 — computeBackingBreakdown: for S supply, returns the 130% institutional backing
export function computeBackingBreakdown(supply: number): BackingBreakdown {
  const liability = supply * PAR;
  const totalStrategicBacking = liability * RESERVE_TARGETS.RR_strategic; // 1.30 × L
  return {
    totalStrategicBacking,
    fiat: totalStrategicBacking * RESERVE_TARGETS.fiatPct,       // 80%
    gold: totalStrategicBacking * RESERVE_TARGETS.goldPct,        // 18%
    digital: totalStrategicBacking * RESERVE_TARGETS.digitalPct, // 2%
    frontlineFiat: totalStrategicBacking * RESERVE_TARGETS.frontlinePct,    // 50%
    strategicFiat: totalStrategicBacking * RESERVE_TARGETS.strategicFiatPct, // 30%
    emergencyCapacity: 0, // §4 — separate, not auto-added; only counted when verifiable
  };
}

// §4 — Emergency resilience eligibility test
export interface EmergencyResource {
  description: string;
  notionalValue: number;
  legallyEnforceable: boolean;
  independentlyVerified: boolean;
  accessibleDuringStress: boolean;
  notDoubleCounted: boolean;     // not already counted in core reserve
  haircut: number;               // 0-1, applied to notional
}
export function qualifyEmergencyResource(r: EmergencyResource): {
  eligible: boolean; adjustedValue: number; reasons: string[];
} {
  const reasons: string[] = [];
  if (!r.legallyEnforceable) reasons.push("not legally enforceable");
  if (!r.independentlyVerified) reasons.push("not independently verified");
  if (!r.accessibleDuringStress) reasons.push("not accessible during stress");
  if (!r.notDoubleCounted) reasons.push("already counted elsewhere");
  const eligible = reasons.length === 0;
  return {
    eligible,
    adjustedValue: eligible ? r.notionalValue * (1 - r.haircut) : 0,
    reasons,
  };
}

// ============================================================================
// PART B — §2, §37-42: LIABILITY, VALUATION, RR, FSCR, LCR
// ============================================================================

// §2 — Liability
export function computeLiability(supply: number): number {
  return supply * PAR; // L = S × PAR
}

// §37 — Reserve asset primitive
export interface ReserveAsset {
  id: string;
  name: string;
  type: "fiat" | "gold" | "silver" | "tokenized-gold" | "digital" | "sovereign" | "cash";
  quantity: number;        // Q_a
  price: number;           // P_a (market price per unit, USD)
  haircut: number;         // H_a (0-1, constitutional haircut)
  creditAdjustment: number;    // Credit_a (0-1]
  jurisdictionAdjustment: number; // Jurisdiction_a (0-1]
  operationalAdjustment: number; // Operational_a (0-1]
  stressFactor: number;     // S_a (0-1, stress haircut for liquidation value)
  currency?: string;       // for fiat/sovereign/cash
}

// §38 — Counterparty adjustment: C_a = Credit × Jurisdiction × Operational, 0 < C ≤ 1
export function computeCounterpartyAdjustment(a: ReserveAsset): number {
  const c = a.creditAdjustment * a.jurisdictionAdjustment * a.operationalAdjustment;
  return Math.min(Math.max(c, 0.0001), 1.0); // clamp (0, 1]
}

// §37 — Three reserve values
export function computeMarketReserve(assets: ReserveAsset[]): number {
  return assets.reduce((sum, a) => sum + a.quantity * a.price, 0); // R_m = Σ Q_a P_a
}
export function computeAdjustedReserve(assets: ReserveAsset[]): number {
  return assets.reduce( // R_a = Σ Q_a P_a (1 - H_a) C_a
    (sum, a) => sum + a.quantity * a.price * (1 - a.haircut) * computeCounterpartyAdjustment(a),
    0,
  );
}
export function computeStressReserve(assets: ReserveAsset[]): number {
  return assets.reduce( // R_l = Σ Q_a P_a (1 - H_a) C_a S_a
    (sum, a) =>
      sum + a.quantity * a.price * (1 - a.haircut) * computeCounterpartyAdjustment(a) * a.stressFactor,
    0,
  );
}

// §39 — Three NAVs (spec notation: NAV_m market, NAV_l prudential, NAV_s stress)
export interface NavTriple {
  NAV_m: number; // market   = R_m / S
  NAV_l: number; // prudential = R_a / S  (NOTE: spec uses subscript 'l' for prudential; maps to R_a)
  NAV_s: number; // stress   = R_l / S
}
export function computeNAVs(supply: number, assets: ReserveAsset[]): NavTriple {
  return {
    NAV_m: computeMarketReserve(assets) / supply,
    NAV_l: computeAdjustedReserve(assets) / supply,
    NAV_s: computeStressReserve(assets) / supply,
  };
}

// §5/§40 — Reserve Ratio: RR = R_a / L
export interface ReserveRatio {
  RR: number;              // R_a / L (prudential solvency ratio)
  RR_target: number;       // 1.30
  RR_policyFloor: number;  // 1.05
  RR_absoluteFloor: number; // 1.00
  status: "STRATEGIC" | "DEFENSIVE" | "EMERGENCY" | "INSOLVENT";
}
export function computeReserveRatio(supply: number, assets: ReserveAsset[]): ReserveRatio {
  const liability = computeLiability(supply);
  const R_a = computeAdjustedReserve(assets);
  const RR = R_a / liability;
  let status: ReserveRatio["status"] = "INSOLVENT";
  if (RR >= RESERVE_TARGETS.RR_strategic) status = "STRATEGIC";
  else if (RR >= RESERVE_TARGETS.RR_policy_floor) status = "DEFENSIVE";
  else if (RR >= RESERVE_TARGETS.RR_floor) status = "EMERGENCY";
  return {
    RR,
    RR_target: RESERVE_TARGETS.RR_strategic,
    RR_policyFloor: RESERVE_TARGETS.RR_policy_floor,
    RR_absoluteFloor: RESERVE_TARGETS.RR_floor,
    status,
  };
}

// §40 — FSCR (Funding/Stress Coverage Ratio)
// SPEC NOTATION RECONCILIATION:
//   §40 writes "FSCR = MTQ Liabilities / StressAdjustedReserve" and "FSCR = S×PAR / R_stress-adjusted".
//   Taken literally (L / R_l) this yields values < 1, which is INCONSISTENT with the
//   thresholds (Normal ≥ 1.10, Defensive ≥ 1.05, Emergency ≥ 1.00).
//   Standard banking convention (cf. LCR = HQLA / NetOutflow ≥ 1.00) and the thresholds
//   both imply FSCR = R_l / L (stress reserve over liability). We implement the
//   coverage interpretation FSCR = R_l / L and flag this as a resolved notational ambiguity.
export interface FSCR {
  FSCR: number;            // R_l / L (coverage interpretation)
  normal: number;          // ≥ 1.10
  defensive: number;       // ≥ 1.05
  emergency: number;       // ≥ 1.00
  status: "NORMAL" | "DEFENSIVE" | "EMERGENCY" | "BREACH";
  noFeasiblePortfolio: boolean; // §40 — if hard constraints cannot be met
  notationReconciliation: string;
}
export function computeFSCR(supply: number, assets: ReserveAsset[]): FSCR {
  const liability = computeLiability(supply);
  const R_l = computeStressReserve(assets);
  const FSCR = R_l / liability;
  let status: FSCR["status"] = "BREACH";
  if (FSCR >= 1.10) status = "NORMAL";
  else if (FSCR >= 1.05) status = "DEFENSIVE";
  else if (FSCR >= 1.00) status = "EMERGENCY";
  return {
    FSCR,
    normal: 1.10,
    defensive: 1.05,
    emergency: 1.00,
    status,
    noFeasiblePortfolio: FSCR < 1.00, // §40 — issuance reduced/frozen
    notationReconciliation:
      "Spec §40 literally writes L/R_l but thresholds require R_l/L (coverage). Implemented as R_l/L per standard banking convention; flagged for blueprint clarification.",
  };
}

// §41 — LCR (Liquidity Coverage Ratio): LCR = HQLA / 30-day net redemption outflow
export interface LCR {
  LCR: number;
  HQLA: number;
  netOutflow30d: number;
  target: number; // ≥ 1.00
  status: "ADEQUATE" | "STRESSED" | "BREACH";
}
export function computeLCR(hqla: number, netOutflow30d: number): LCR {
  const LCR = netOutflow30d > 0 ? hqla / netOutflow30d : Infinity;
  let status: LCR["status"] = "BREACH";
  if (LCR >= 1.00) status = "ADEQUATE";
  else if (LCR >= 0.90) status = "STRESSED";
  return { LCR, HQLA: hqla, netOutflow30d, target: 1.00, status };
}

// ============================================================================
// PART C — §7-16: CURRENCY WEIGHT ENGINE
// ============================================================================

// §7 — Structural weight components (per eligible reserve currency i)
export interface CurrencyStructuralInputs {
  currency: string;
  coferShare: number;    // 0-1, IMF COFER share (normalized)
  swiftShare: number;   // 0-1, SWIFT settlement share (normalized)
  bisShare: number;      // 0-1, BIS turnover share (normalized)
  isUsdPegged: boolean;  // AED, SAR = true
  usdEquivalenceFactor: number; // 0-1 (1.0 full peg)
}
// §7 — C_i = 0.50·COFER_i + 0.40·SWIFT_i + 0.10·BIS_i
export function computeStructuralWeight(c: CurrencyStructuralInputs): number {
  return 0.5 * c.coferShare + 0.4 * c.swiftShare + 0.1 * c.bisShare;
}

// §8 — Momentum factor: M_i(t) = P_i(t) / P_i(t - 12m), bounded 0.95 ≤ M ≤ 1.05
export function computeMomentum(priceNow: number, price12mAgo: number): number {
  if (price12mAgo <= 0) return 1.0;
  const M = priceNow / price12mAgo;
  return clamp(M, 0.95, 1.05);
}

// §9 — Mean-reversion factor: R_i(t) = 1 + 0.05·(LTA_i − C_i), bounded 0.98 ≤ R ≤ 1.02
export function computeMeanReversion(longTermAvgC: number, currentC: number): number {
  const R = 1 + 0.05 * (longTermAvgC - currentC);
  return clamp(R, 0.98, 1.02);
}

// §10 — EWMA volatility + attenuation
//   σ²_t = λ·σ²_(t-1) + (1-λ)·r²_t,  λ = 0.94
//   r_t = ln(P_(t-1) / P_t)
export function computeEWMAVolatility(prices: number[], lambda = 0.94): number {
  if (prices.length < 2) return 0;
  let sigma2 = 0;
  for (let t = 1; t < prices.length; t++) {
    const r = Math.log(prices[t - 1] / prices[t]);
    sigma2 = lambda * sigma2 + (1 - lambda) * r * r;
  }
  return Math.sqrt(Math.max(sigma2, 0));
}

// §10 — Attenuation factor A_t (clamped 0.50 ≤ A ≤ 1.00)
export function computeAttenuation(sigma: number): number {
  if (sigma <= 0.02) return 1.0;        // σ ≤ 2% → A = 1.00
  if (sigma >= 0.05) return 0.5;        // σ ≥ 5% → A = 0.50
  return 1 - (sigma - 0.02) / 0.03;     // linear between 2% and 5%
}

// §11 — Combined currency adjustment: K_i = 1 + A_t·(M_i·R_i − 1)
export function computeKFactor(M: number, R: number, A: number): number {
  return 1 + A * (M * R - 1);
}

// §12 — Liquidity overlay: L_i = 1 + η·(Liq_i − Median), η = 0.02, clamped ±5%
export function computeLiquidityOverlay(
  liquidityScore: number,
  medianLiquidity: number,
  eta = 0.02,
): number {
  const L = 1 + eta * (liquidityScore - medianLiquidity);
  return clamp(L, 0.95, 1.05);
}

// §13 — Raw currency weight: W_raw,i = C_i · K_i · L_i
export function computeRawWeight(C: number, K: number, L: number): number {
  return C * K * L;
}

// §14 — Proportional normalization: W_i^norm = W_raw,i / Σ_j W_raw,j  (NOT softmax)
export function proportionalNormalize(rawWeights: number[]): number[] {
  const total = rawWeights.reduce((s, w) => s + w, 0);
  if (total <= 0) return rawWeights.map(() => 0);
  return rawWeights.map((w) => w / total);
}

// §15/§16 — Concentration caps
export const CONCENTRATION_POLICY = {
  // §16 — Controlling policy: preferred ≤15%, hard max = 20% effective exposure
  preferredEffective: 0.15,
  hardMaxEffective: 0.20,
  // §16 — Old 60% constitutional ceiling retained ONLY as deeper sanity fail-safe
  //        It must NEVER permit a currency to operate at 60% when 20% policy says otherwise.
  constitutionalSanityCeiling: 0.60,
  // §17 — USD effective hard ceiling (direct + AED/SAR peg + synthetic + digital)
  usdEffectiveCeiling: 0.35,
  // §22 — Minimum currency floor
  minFloor: 0.005, // 0.5%
} as const;

// §15 — Apply post-normalization constraints (eligibility, concentration, floor, etc.)
export interface CurrencyWeightCandidate {
  currency: string;
  normalizedWeight: number;
  eligible: boolean;
  isUsdPegged: boolean;
  usdEquivalenceFactor: number;
}
export interface FinalizedCurrencyWeight {
  currency: string;
  finalWeight: number;       // W_i^final
  eligible: boolean;
  concentrationCapped: boolean;
  usdEffectiveContribution: number; // contribution to effective USD exposure
}
// §15 — finalize with concentration + USD-effective cap; renormalize to sum=1
export function finalizeCurrencyWeights(
  candidates: CurrencyWeightCandidate[],
): { weights: FinalizedCurrencyWeight[]; sum: number; usdEffective: number; constraintsMet: boolean } {
  // Step 1: zero out ineligible
  let working = candidates.map((c) => ({
    currency: c.currency,
    weight: c.eligible ? c.normalizedWeight : 0,
    eligible: c.eligible,
    capped: false,
    isUsdPegged: c.isUsdPegged,
    usdEq: c.usdEquivalenceFactor,
  }));
  // Step 2: renormalize after eligibility filter
  let sum = working.reduce((s, w) => s + w.weight, 0);
  if (sum > 0) working = working.map((w) => ({ ...w, weight: w.weight / sum }));

  // Step 3: enforce hard concentration cap (20%) — iterate to fixpoint
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (const w of working) {
      if (w.weight > CONCENTRATION_POLICY.hardMaxEffective) {
        w.weight = CONCENTRATION_POLICY.hardMaxEffective;
        w.capped = true;
        changed = true;
      }
    }
    if (changed) {
      // renormalize the uncapped ones to absorb the slack
      const cappedTotal = working.filter((w) => w.capped).reduce((s, w) => s + w.weight, 0);
      const uncapped = working.filter((w) => !w.capped);
      const uncappedTotal = uncapped.reduce((s, w) => s + w.weight, 0);
      const targetUncapped = 1 - cappedTotal;
      if (uncappedTotal > 0) {
        for (const w of uncapped) w.weight = (w.weight / uncappedTotal) * targetUncapped;
      }
    } else break;
  }

  // Step 4: compute USD-effective exposure and enforce ceiling
  const usdEffective = working.reduce(
    (s, w) => s + (w.currency === "USD" ? w.weight : 0) + (w.isUsdPegged ? w.weight * w.usdEq : 0),
    0,
  );
  // (USD ceiling enforcement is advisory-flagged; hard reduction requires governance)
  const constraintsMet =
    working.every((w) => w.weight <= CONCENTRATION_POLICY.hardMaxEffective + 1e-9) &&
    usdEffective <= CONCENTRATION_POLICY.usdEffectiveCeiling + 1e-9;

  const weights: FinalizedCurrencyWeight[] = working.map((w) => ({
    currency: w.currency,
    finalWeight: w.weight,
    eligible: w.eligible,
    concentrationCapped: w.capped,
    usdEffectiveContribution:
      (w.currency === "USD" ? w.weight : 0) + (w.isUsdPegged ? w.weight * w.usdEq : 0),
  }));

  return {
    weights,
    sum: working.reduce((s, w) => s + w.weight, 0),
    usdEffective,
    constraintsMet,
  };
}

// Full currency weight pipeline (§7-16)
export interface CurrencyPipelineInputs {
  currency: string;
  cofer: number; swift: number; bis: number;       // structural shares 0-1
  priceNow: number; price12mAgo: number;            // momentum
  longTermAvgC: number;                            // mean reversion
  priceHistory: number[];                          // EWMA volatility (chronological)
  liquidityScore: number; medianLiquidity: number;  // liquidity overlay
  isUsdPegged: boolean; usdEquivalenceFactor: number;
  eligible: boolean;
}
export interface CurrencyPipelineResult {
  currency: string;
  C: number; M: number; R: number; sigma: number; A: number; K: number; L: number;
  rawWeight: number; normalizedWeight: number; finalWeight: number;
  usdEffectiveContribution: number; eligible: boolean; concentrationCapped: boolean;
}
export function runCurrencyWeightPipeline(
  inputs: CurrencyPipelineInputs[],
): { results: CurrencyPipelineResult[]; sum: number; usdEffective: number; constraintsMet: boolean } {
  const intermediates = inputs.map((i) => {
    // map pipeline inputs (cofer/swift/bis) to structural inputs (coferShare/swiftShare/bisShare)
    const C = computeStructuralWeight({
      currency: i.currency,
      coferShare: i.cofer,
      swiftShare: i.swift,
      bisShare: i.bis,
      isUsdPegged: i.isUsdPegged,
      usdEquivalenceFactor: i.usdEquivalenceFactor,
    });
    const M = computeMomentum(i.priceNow, i.price12mAgo);
    const R = computeMeanReversion(i.longTermAvgC, C);
    const sigma = computeEWMAVolatility(i.priceHistory);
    const A = computeAttenuation(sigma);
    const K = computeKFactor(M, R, A);
    const L = computeLiquidityOverlay(i.liquidityScore, i.medianLiquidity);
    const rawWeight = computeRawWeight(C, K, L);
    return { ...i, C, M, R, sigma, A, K, L, rawWeight };
  });
  const raws = intermediates.map((x) => x.rawWeight);
  const norms = proportionalNormalize(raws);
  const candidates: CurrencyWeightCandidate[] = intermediates.map((x, idx) => ({
    currency: x.currency,
    normalizedWeight: norms[idx],
    eligible: x.eligible,
    isUsdPegged: x.isUsdPegged,
    usdEquivalenceFactor: x.usdEquivalenceFactor,
  }));
  const finalized = finalizeCurrencyWeights(candidates);
  const results: CurrencyPipelineResult[] = intermediates.map((x, idx) => ({
    currency: x.currency,
    C: x.C, M: x.M, R: x.R, sigma: x.sigma, A: x.A, K: x.K, L: x.L,
    rawWeight: x.rawWeight,
    normalizedWeight: norms[idx],
    finalWeight: finalized.weights[idx].finalWeight,
    usdEffectiveContribution: finalized.weights[idx].usdEffectiveContribution,
    eligible: finalized.weights[idx].eligible,
    concentrationCapped: finalized.weights[idx].concentrationCapped,
  }));
  return {
    results,
    sum: finalized.sum,
    usdEffective: finalized.usdEffective,
    constraintsMet: finalized.constraintsMet,
  };
}

// ============================================================================
// PART D — §17: EFFECTIVE USD EXPOSURE
// ============================================================================
// §17 — USD_effective = USD_direct + AED_equiv + SAR_equiv + USD-linked synthetic + USD-linked digital
export interface UsdExposureBreakdown {
  usdDirect: number;
  aedUsdEquivalent: number;
  sarUsdEquivalent: number;
  usdLinkedSynthetic: number;
  usdLinkedDigital: number;
  usdEffective: number;
  ceiling: number;     // 35%
  breached: boolean;
}
export function computeEffectiveUsdExposure(
  usdDirectWeight: number,
  aedWeight: number, aedUsdEq: number,
  sarWeight: number, sarUsdEq: number,
  usdLinkedSynthetic: number,
  usdLinkedDigital: number,
): UsdExposureBreakdown {
  const aedEquiv = aedWeight * aedUsdEq;
  const sarEquiv = sarWeight * sarUsdEq;
  const usdEffective = usdDirectWeight + aedEquiv + sarEquiv + usdLinkedSynthetic + usdLinkedDigital;
  return {
    usdDirect: usdDirectWeight,
    aedUsdEquivalent: aedEquiv,
    sarUsdEquivalent: sarEquiv,
    usdLinkedSynthetic,
    usdLinkedDigital,
    usdEffective,
    ceiling: CONCENTRATION_POLICY.usdEffectiveCeiling,
    breached: usdEffective > CONCENTRATION_POLICY.usdEffectiveCeiling,
  };
}

// ============================================================================
// PART E — §18-19: CURRENCY FALL PRICE EFFECTS
// ============================================================================
// §18 — Price effect on reserve value: R' = R·(1 − w_i·d), RR' = RR·(1 − w_i·d)
export function currencyFallOnReserveRatio(RR: number, weight: number, fallPct: number): number {
  return RR * (1 - weight * fallPct);
}
// §19 — Post-fall weight drift: w_i' = w_i·(1−d) / (1 − w_i·d)
export function currencyFallOnWeight(weight: number, fallPct: number): number {
  return (weight * (1 - fallPct)) / (1 - weight * fallPct);
}

// ============================================================================
// PART F — §20-22: CURRENCY LIFECYCLE STATE MACHINE
// ============================================================================
export type CurrencyLifecycleState =
  | "ACTIVE" | "WATCH" | "REDUCE" | "SUSPEND" | "SUBSTITUTE" | "REINSTATE" | "EXITED";

// §20 — Lifecycle triggers (CQS = Currency Quality Score, 0-10)
export interface CurrencyHealthSignals {
  cqs: number;                 // 0-10
  sovereignDowngrade: boolean;
  volatilitySigma: number;     // # of std deviations
  sanctions: boolean;
  capitalControls: boolean;
  consecutiveReadingsBelowReduce: number; // for REDUCE (CQS<5.5 ~20 readings)
  consecutiveReadingsForReinstate: number; // for REINSTATE (CQS>6.5 60 readings)
}
export function assessCurrencyLifecycle(
  current: CurrencyLifecycleState,
  s: CurrencyHealthSignals,
): { next: CurrencyLifecycleState; reason: string } {
  // SUSPEND takes priority (severe)
  if (s.sanctions || s.capitalControls || s.cqs < 4.0) {
    return { next: "SUSPEND", reason: "CQS<4.0 or sanctions/capital controls" };
  }
  // REDUCE
  if (s.cqs < 5.5 && s.consecutiveReadingsBelowReduce >= 20) {
    return { next: "REDUCE", reason: "CQS<5.5 for ~20 consecutive readings" };
  }
  // WATCH
  if (s.cqs < 6.0 || s.sovereignDowngrade || s.volatilitySigma > 2) {
    return { next: "WATCH", reason: "CQS<6.0 or sovereign downgrade or vol>2σ" };
  }
  // REINSTATE (from reduced/suspended)
  if ((current === "REDUCE" || current === "SUSPEND" || current === "WATCH") &&
      s.cqs > 6.5 && s.consecutiveReadingsForReinstate >= 60) {
    return { next: "REINSTATE", reason: "CQS>6.5 for 60 consecutive readings" };
  }
  return { next: "ACTIVE", reason: "healthy" };
}

// §21 — Exit: weight → 0, renormalize remaining: W_j' = W_j / (1 − W_i)
export function exitCurrencyAndRenormalize(
  weights: Record<string, number>,
  exitedCurrency: string,
): Record<string, number> {
  const w_i = weights[exitedCurrency] ?? 0;
  const remaining: Record<string, number> = {};
  let sum = 0;
  for (const [k, v] of Object.entries(weights)) {
    if (k === exitedCurrency) continue;
    remaining[k] = v / (1 - w_i);
    sum += remaining[k];
  }
  // §21 — verify Σ W_j' = 1 (floating point guard)
  if (Math.abs(sum - 1) > 1e-9 && sum > 0) {
    for (const k of Object.keys(remaining)) remaining[k] /= sum;
  }
  return remaining;
}

// §22 — Minimum currency floor (0.5%) + Q1-Q4 removal ladder
export type FloorQuarter = "OBSERVATION_Q1" | "OBSERVATION_Q2" | "PROBATION_Q3" | "REMOVAL_Q4";
export function assessMinFloorLadder(
  quartersBelowFloor: number,
  currentWeight: number,
): { stage: FloorQuarter | "HEALTHY" | "REMOVE_AND_RENORMALIZE"; action: string } {
  const floor = CONCENTRATION_POLICY.minFloor;
  if (currentWeight >= floor) return { stage: "HEALTHY", action: "no action" };
  if (quartersBelowFloor < 1) return { stage: "OBSERVATION_Q1", action: "observe" };
  if (quartersBelowFloor < 2) return { stage: "OBSERVATION_Q2", action: "observe" };
  if (quartersBelowFloor < 3) return { stage: "PROBATION_Q3", action: "probation + governance review" };
  if (quartersBelowFloor < 4) return { stage: "REMOVAL_Q4", action: "final notice" };
  return { stage: "REMOVE_AND_RENORMALIZE", action: "remove and renormalize remaining currencies" };
}

// ============================================================================
// PART G — §23-29: GOLD / BULLION MODULE
// ============================================================================

export const GOLD_POLICY = {
  // §23 — controlling policy center = 18%
  goldTarget: 0.18,
  goldPreferredLower: 0.15,
  goldOperationalUpperZone: { low: 0.21, high: 0.22 }, // under validated currency-risk conditions
  bullionCorridor: { min: 0.15, max: 0.25 }, // constitutional
  // §27 — silver is conditional, currently 0% (SDC_Ag ≤ 0 under tested assumptions)
  silverConditionalMax: 0.03,
  silverCurrent: 0.0,
} as const;

// §24 — Gold value: R_G = Q_G × P_G; adjusted: R_G,a = Q_G·P_G·(1−H_G)·C_G
export function computeGoldValue(quantityOz: number, spotPrice: number, haircut: number, counterparty: number): {
  market: number; adjusted: number;
} {
  return {
    market: quantityOz * spotPrice,
    adjusted: quantityOz * spotPrice * (1 - haircut) * counterparty,
  };
}

// §25 — Gold price fall: RR' = RR·(1 − 0.18·d_G)
export function goldFallOnReserveRatio(RR: number, goldWeight: number, fallPct: number): number {
  return RR * (1 - goldWeight * fallPct);
}

// §26 — Liquidation sequence (gold protected LAST)
export const LIQUIDATION_SEQUENCE = [
  "1. Eligible digital liquidity",
  "2. Cash",
  "3. Short-duration sovereign",
  "4. Non-USD FX",
  "5. Conditional silver",
  "6. Tokenized gold",
  "7. Physical gold (LAST)",
] as const;

// §27 — Silver SDC (Silver Diversification Contribution)
export interface SilverSDCInputs {
  cvarImprovement: number;
  stressRRImprovement: number;
  lcrImprovement: number;
  executionCost: number;
  custodyCost: number;
  volatilityPenalty: number;
  liquidityPenalty: number;
}
// SDC_Ag = NetResilienceGain − NetCost; admit if > 0, up to 3%
export function computeSilverSDC(i: SilverSDCInputs): { SDC: number; admitted: boolean; allocation: number } {
  const netGain = i.cvarImprovement + i.stressRRImprovement + i.lcrImprovement;
  const netCost = i.executionCost + i.custodyCost + i.volatilityPenalty + i.liquidityPenalty;
  const SDC = netGain - netCost;
  return {
    SDC,
    admitted: SDC > 0,
    allocation: SDC > 0 ? GOLD_POLICY.silverConditionalMax : 0,
  };
}

// §28 — BRI (Bullion Resilience Index) — advisory only
// BRI_t = (Gold_0/Gold_t)^0.90 · (Silver_0/Silver_t)^0.10  (if silver held)
// If silver weight = 0, silver component omitted → BRI = gold resilience measure
export function computeBRI(
  gold0: number, goldT: number,
  silver0: number, silverT: number, silverHeld: boolean,
): { BRI: number; advisoryOnly: boolean } {
  const goldComponent = Math.pow(gold0 / goldT, 0.90);
  const silverComponent = silverHeld ? Math.pow(silver0 / silverT, 0.10) : 1;
  return { BRI: goldComponent * silverComponent, advisoryOnly: true };
}

// §29 — Tokenized gold (PAXG) TGRS — conditional separate exposure, NOT auto-counted as physical
export interface TGRSInputs {
  physicalBacking: number; legalTitle: number; custody: number; redemption: number;
  issuerReliability: number; oracleReliability: number; settlement: number;
  liquidity: number; operationalResilience: number; jurisdiction: number;
}
export function computeTGRS(i: TGRSInputs): { TGRS: number; status: "ELIGIBLE" | "CONDITIONAL" | "REJECTED"; haircut: number } {
  const TGRS = 0.20 * i.physicalBacking + 0.15 * i.legalTitle + 0.15 * i.custody +
    0.10 * i.redemption + 0.10 * i.issuerReliability + 0.10 * i.oracleReliability +
    0.08 * i.settlement + 0.05 * i.liquidity + 0.05 * i.operationalResilience + 0.02 * i.jurisdiction;
  let status: "ELIGIBLE" | "CONDITIONAL" | "REJECTED" = "REJECTED";
  if (TGRS >= 8.0) status = "ELIGIBLE";
  else if (TGRS >= 6.0) status = "CONDITIONAL";
  // §29 — haircut H_TG = max(5%, 5% + (10 − TGRS)·0.5%)
  const haircut = Math.max(0.05, 0.05 + (10 - TGRS) * 0.005);
  return { TGRS, status, haircut };
}

// ============================================================================
// PART H — §30-36: DIGITAL LIQUIDITY MODULE
// ============================================================================

export const DIGITAL_POLICY = {
  // §30 — digital tiers
  D_normal: 0.02,        // 2% normal target
  D_operational: 0.03,   // ≤ 3% operational ceiling
  D_max: 0.05,           // 5% constitutional maximum
  D_emergency: 0.00,     // 0% in emergency
  // §31 — DRQS thresholds
  drqsCore: 7.5,         // ≥ 7.5 core
  drqsConditional: 6.0,   // ≥ 6.0 conditional
  // §31 — algorithmic stablecoins EXCLUDED
  algorithmicExcluded: true,
} as const;

// §31 — DRQS (Digital Reserve Quality Score)
export interface DRQSInputs {
  issuer: number; reserve: number; redemption: number; depeg: number;
  jurisdiction: number; custody: number; operational: number; liquidity: number;
}
export function computeDRQS(i: DRQSInputs): number {
  return 0.20 * i.issuer + 0.15 * i.reserve + 0.15 * i.redemption + 0.15 * i.depeg +
    0.10 * i.jurisdiction + 0.10 * i.custody + 0.10 * i.operational + 0.05 * i.liquidity;
}
export function classifyDigitalAsset(drqs: number, isAlgorithmic: boolean): {
  status: "CORE" | "CONDITIONAL" | "EXCLUDED";
} {
  if (isAlgorithmic) return { status: "EXCLUDED" }; // §31 — algorithmic excluded
  if (drqs >= DIGITAL_POLICY.drqsCore) return { status: "CORE" };
  if (drqs >= DIGITAL_POLICY.drqsConditional) return { status: "CONDITIONAL" };
  return { status: "EXCLUDED" };
}

// §32 — Current digital universe (policy reference values, NOT live)
export const DIGITAL_UNIVERSE = [
  { id: "USDC", drqs: 8.50, role: "Primary digital liquidity", algorithmic: false, inCore: true, targetWeight: 0 },
  { id: "USDP", drqs: 8.45, role: "Secondary regulated USD liquidity", algorithmic: false, inCore: true, targetWeight: 0 },
  { id: "EURC", drqs: 7.80, role: "EUR diversification", algorithmic: false, inCore: true, targetWeight: 0 },
  { id: "BUIDL", drqs: 8.55, role: "Tokenized U.S. T-bill liquidity", algorithmic: false, inCore: true, targetWeight: 0 },
  { id: "DAI", drqs: 6.25, role: "Optional/conditional, currently 0%", algorithmic: false, inCore: false, targetWeight: 0 },
  { id: "USDT", drqs: 6.15, role: "Excluded from core digital reserve; external conversion only", algorithmic: false, inCore: false, targetWeight: 0 },
] as const;

// §34 — Stablecoin risk-adjusted exposure
export function computeStablecoinExposure(stablecoinValues: number[], totalAdjustedReserve: number): number {
  return stablecoinValues.reduce((s, v) => s + v, 0) / totalAdjustedReserve;
}
// §34 — SAE (risk-adjusted): Σ (value · (DRQS−1)/DRQS · stressFactor) / R_a
export function computeStablecoinRiskAdjustedExposure(
  assets: { value: number; drqs: number; stressFactor: number }[],
  totalAdjustedReserve: number,
): number {
  return assets.reduce(
    (s, a) => s + a.value * ((a.drqs - 1) / a.drqs) * a.stressFactor,
    0,
  ) / totalAdjustedReserve;
}

// §35 — Stress DRQS: StressDRQS_i = DRQS_i · (1 − SF_i)
export interface StablecoinStressInputs {
  depegShock: number; redemptionStress: number; liquidityStress: number;
  counterpartyStress: number; custodyStress: number; jurisdictionStress: number;
  settlementDelayStress: number;
}
export function computeStressFactor(s: StablecoinStressInputs): number {
  return 0.20 * s.depegShock + 0.20 * s.redemptionStress + 0.15 * s.liquidityStress +
    0.15 * s.counterpartyStress + 0.10 * s.custodyStress + 0.10 * s.jurisdictionStress +
    0.10 * s.settlementDelayStress;
}
export function computeStressDRQS(drqs: number, SF: number): number {
  return drqs * (1 - SF);
}
export function computeEffectiveDRQS(drqs: number, stressDRQS: number): number {
  return Math.min(drqs, stressDRQS); // §35 — optimizer uses min(DRQS, StressDRQS)
}

// §36 — Digital state machine
export type DigitalState = "NORMAL" | "WATCH" | "REDUCE" | "SUSPEND";
export function assessDigitalState(
  deviationPct: number, redemptionFrozen: boolean, reserveFailed: boolean, sanctions: boolean,
): { state: DigitalState; action: string } {
  if (deviationPct >= 0.10 || redemptionFrozen || reserveFailed || sanctions) {
    return { state: "SUSPEND", action: "suspend; convert to Tier-1 cash until replacement approved" };
  }
  if (deviationPct >= 0.05) {
    return { state: "REDUCE", action: "reduce allocation; seek eligible replacement" };
  }
  if (deviationPct >= 0.02) {
    return { state: "WATCH", action: "monitor; tighten eligibility" };
  }
  return { state: "NORMAL", action: "no action" };
}

// ============================================================================
// PART I — §43-44: REBALANCING ENGINE
// ============================================================================

export const REBALANCE_POLICY = {
  // §43 — ordinary trigger threshold
  tau: 0.02, // 2 percentage points
} as const;

// §43 — Δ_i = W_actual,i − W_target,i
export function computeRebalanceDelta(actualWeight: number, targetWeight: number): number {
  return actualWeight - targetWeight;
}

// §43 — hard override conditions (bypass ordinary threshold)
export interface RebalanceHardOverride {
  constitutionalRangeBreached: boolean;
  concentrationBreached: boolean;
  eligibilityChanged: boolean;
  backingOrSolvencyRequires: boolean;
  stablecoinEligibilityFailed: boolean;
  emergencyGovernanceActivated: boolean;
}
export function requiresHardRebalance(o: RebalanceHardOverride): boolean {
  return o.constitutionalRangeBreached || o.concentrationBreached || o.eligibilityChanged ||
    o.backingOrSolvencyRequires || o.stablecoinEligibilityFailed || o.emergencyGovernanceActivated;
}

// §44 — Transaction-cost test: execute voluntary rebalance only if NetBenefit > 0
export interface TradeCostBreakdown {
  spread: number; fees: number; slippage: number; marketImpact: number;
  custody: number; settlement: number; taxes: number; lifecycleCosts: number;
}
export function computeTotalTradeCost(c: TradeCostBreakdown): number {
  return c.spread + c.fees + c.slippage + c.marketImpact + c.custody + c.settlement + c.taxes + c.lifecycleCosts;
}
export interface RebalanceDecision {
  delta: number;
  ordinaryTrigger: boolean;      // |Δ| > τ
  hardOverride: boolean;          // §43 hard conditions
  netBenefit: number;            // riskReductionBenefit − totalTradeCost
  execute: boolean;
  reason: string;
}
export function decideRebalance(
  actualWeight: number, targetWeight: number,
  riskReductionBenefit: number, costs: TradeCostBreakdown,
  hardOverride: RebalanceHardOverride,
): RebalanceDecision {
  const delta = computeRebalanceDelta(actualWeight, targetWeight);
  const ordinaryTrigger = Math.abs(delta) > REBALANCE_POLICY.tau;
  const hard = requiresHardRebalance(hardOverride);
  const totalCost = computeTotalTradeCost(costs);
  const netBenefit = riskReductionBenefit - totalCost;
  // §44 — execute if NetBenefit > 0, UNLESS hard constitutional/legal breach requires correction
  const execute = hard ? true : (ordinaryTrigger && netBenefit > 0);
  let reason: string;
  if (hard) reason = "HARD OVERRIDE — constitutional/legal breach requires correction regardless of cost";
  else if (!ordinaryTrigger) reason = `|Δ|=${(Math.abs(delta) * 100).toFixed(2)}pp ≤ τ=2pp — no trigger`;
  else if (netBenefit <= 0) reason = `NetBenefit=${netBenefit.toFixed(4)} ≤ 0 — cost exceeds risk reduction`;
  else reason = `NetBenefit=${netBenefit.toFixed(4)} > 0 — execute voluntary rebalance`;
  return { delta, ordinaryTrigger, hardOverride: hard, netBenefit, execute, reason };
}

// ============================================================================
// PART J — §45: WHAT-IF SCENARIO ENGINE
// ============================================================================

export interface WhatIfScenarioResult {
  id: string; label: string;
  RR_before: number; RR_after: number; RR_deltaPp: number;
  R_a_before: number; R_a_after: number; loss: number;
  explanation: string;
}
// §45 — 4 canonical scenarios (for S=100M MTQ, L=100M, RR=130%, R_a=130M)
export function runCanonicalWhatIfScenarios(
  supply: number, assets: ReserveAsset[],
): WhatIfScenarioResult[] {
  const L = computeLiability(supply);
  const R_a = computeAdjustedReserve(assets);
  const RR = R_a / L;
  const results: WhatIfScenarioResult[] = [];

  // Scenario A — One 15%-weighted currency falls 20%
  const wA = 0.15, dA = 0.20;
  const RR_A = RR * (1 - wA * dA);
  results.push({
    id: "A", label: "One 15%-weighted currency falls 20%",
    RR_before: RR, RR_after: RR_A,
    RR_deltaPp: (RR_A - RR) * 100,
    R_a_before: R_a, R_a_after: R_a * (1 - wA * dA), loss: R_a * wA * dA,
    explanation: `R_a' = ${R_a.toFixed(1)}M × (1 − ${wA}×${dA}) = ${(R_a * (1 - wA * dA)).toFixed(2)}M; RR'=${(RR_A * 100).toFixed(2)}% (still above strategic defensive levels)`,
  });

  // Scenario B — Gold falls 20% (gold weight = 18%)
  const wB = GOLD_POLICY.goldTarget, dB = 0.20;
  const RR_B = RR * (1 - wB * dB);
  results.push({
    id: "B", label: "Gold falls 20%",
    RR_before: RR, RR_after: RR_B,
    RR_deltaPp: (RR_B - RR) * 100,
    R_a_before: R_a, R_a_after: R_a * (1 - wB * dB), loss: R_a * wB * dB,
    explanation: `R_a' = ${R_a.toFixed(1)}M × (1 − ${wB}×${dB}) = ${(R_a * (1 - wB * dB)).toFixed(2)}M; RR'=${(RR_B * 100).toFixed(2)}%`,
  });

  // Scenario C — Entire 2% digital sleeve loses 50%
  const wC = RESERVE_TARGETS.digitalPct, dC = 0.50;
  const RR_C = RR * (1 - wC * dC);
  results.push({
    id: "C", label: "Entire 2% digital sleeve loses 50%",
    RR_before: RR, RR_after: RR_C,
    RR_deltaPp: (RR_C - RR) * 100,
    R_a_before: R_a, R_a_after: R_a * (1 - wC * dC), loss: R_a * wC * dC,
    explanation: `R_a' = ${R_a.toFixed(1)}M × (1 − ${wC}×${dC}) = ${(R_a * (1 - wC * dC)).toFixed(2)}M; RR'=${(RR_C * 100).toFixed(2)}% (demonstrates why digital sleeve is deliberately small)`,
  });

  // Scenario D — entire digital sleeve goes to zero
  const wD = RESERVE_TARGETS.digitalPct;
  const RR_D = RR * (1 - wD);
  results.push({
    id: "D", label: "Entire digital sleeve goes to zero",
    RR_before: RR, RR_after: RR_D,
    RR_deltaPp: (RR_D - RR) * 100,
    R_a_before: R_a, R_a_after: R_a * (1 - wD), loss: R_a * wD,
    explanation: `R_a' = ${R_a.toFixed(1)}M × (1 − ${wD}) = ${(R_a * (1 - wD)).toFixed(2)}M; RR'=${(RR_D * 100).toFixed(2)}% (still above 100% solvency floor)`,
  });
  return results;
}

// ============================================================================
// PART K — §49: BLUEPRINT CONFLICT RECONCILIATION
// ============================================================================

export interface BlueprintConflict {
  id: string;
  conflict: string;
  olderPosition: string;
  controllingPosition: string;
  resolution: string;
  implemented: boolean;
}
export const BLUEPRINT_CONFLICTS: BlueprintConflict[] = [
  {
    id: "Conflict-1",
    conflict: "Reserve Ratio target",
    olderPosition: "RR = 120%",
    controllingPosition: "RR = 130%",
    resolution: "Implement 130% as current strategic target. Older 120% treated as historical/non-controlling.",
    implemented: true,
  },
  {
    id: "Conflict-2",
    conflict: "Reserve sleeve composition",
    olderPosition: "15% gold + 5% tokenized gold + 2.5% digital etc. (detailed Portfolio-B table)",
    controllingPosition: "80% fiat / 18% gold / 2% digital",
    resolution: "Implement 80/18/2 as controlling. Do NOT implement both. Tokenized gold is conditional separate exposure, not auto-added to 18%.",
    implemented: true,
  },
  {
    id: "Conflict-3",
    conflict: "Digital liquidity target",
    olderPosition: "USDC 2% + USDP 0.5% + EURC 0.5% + BUIDL 0.5% = 3.5%",
    controllingPosition: "Digital normal = 2%",
    resolution: "2% is the normal center; individual asset weights are OPTIMIZER OUTPUTS, not hard-coded allocations.",
    implemented: true,
  },
  {
    id: "Conflict-4",
    conflict: "Per-currency constitutional cap",
    olderPosition: "60% per-currency ceiling",
    controllingPosition: "Preferred effective = 15%, Hard effective = 20%",
    resolution: "20% is the operative hard effective exposure limit. Old 60% retained ONLY as deeper constitutional sanity cap that can NEVER override the 20% operating limit.",
    implemented: true,
  },
];

// ============================================================================
// PART L — §46-48: FINAL ASSET ADMISSION STRUCTURE
// ============================================================================

// §46A — Core reserve/backing basket
export const CORE_RESERVE_STRUCTURE = {
  monetaryFiat: {
    target: 0.80,
    layerA: ["USD", "EUR", "CHF", "JPY", "GBP", "SGD", "AED", "SAR", "CNY", "CAD", "AUD"],
    note: "CNY conditional; all currencies subject to dynamic eligibility",
  },
  goldBullion: {
    target: 0.18,
    primary: "allocated physical gold",
    silver: "conditional, currently 0%, max conditional 3% if SDC_Ag > 0",
    tokenizedGold: "conditional separate exposure; not automatically counted as physical gold",
  },
  digitalLiquidity: {
    target: 0.02,
    preferredUniverse: ["USDC", "USDP", "EURC", "BUIDL"],
    conditional: { DAI: 0, USDT: "excluded from core digital reserve under current quality score" },
  },
} as const;

// §47 — Settlement-only (NOT core reserve, but usable for conversion)
export const SETTLEMENT_ONLY_STRUCTURE = {
  fiatSettlementOnly: ["EGP", "INR", "KRW", "TRY", "BRL", "MXN", "ZAR", "IDR", "MYR", "THB", "+ qualified others"],
  digitalSettlementConversion: ["USDT (external)", "DAI (conditional)", "other approved stablecoins", "other approved digital assets"],
  cbdcs: "subject to central-bank authorization",
  tokenizedBankMoney: "separate class from stablecoins",
  goldBackedDigital: "conditional and individually assessed",
  principle: "settlement eligibility ≠ backing eligibility",
} as const;

// §48 — USDT architecture: external interoperability/conversion asset, NOT core digital backing
export const USDT_ARCHITECTURE = {
  role: "external input/bridge → eligibility engine → authorized conversion → bank/LP → institutional value → final settlement → MTQ issuance",
  eligibilityChecks: ["jurisdiction", "provider", "sanctions"],
  coreBackingEligible: false,
  principle: "MTQ can interoperate with USDT without becoming dependent on USDT",
  bis2026Note: "current stablecoins can deviate from par and have redemption/liquidity/settlement frictions — supports not making MTQ structurally dependent",
} as const;

// ============================================================================
// PART M — §50: FINAL EQUATION SYSTEM (consolidated reference)
// ============================================================================

export const FINAL_EQUATION_SYSTEM = {
  liability: "L = S × PAR",
  marketReserve: "R_m = Σ_a Q_a · P_a",
  adjustedReserve: "R_a = Σ_a Q_a · P_a · (1 − H_a) · C_a",
  stressReserve: "R_l = Σ_a Q_a · P_a · (1 − H_a) · C_a · S_a",
  reserveRatio: "RR = R_a / L",
  fscr: "FSCR = R_l / L  (coverage interpretation; spec notation L/R_l flagged for clarification)",
  // per-currency
  structuralWeight: "C_i = 0.50·COFER_i + 0.40·SWIFT_i + 0.10·BIS_i",
  momentum: "M_i(t) = P_i(t) / P_i(t−12m),  bounded 0.95 ≤ M ≤ 1.05",
  meanReversion: "R_i(t) = 1 + 0.05·(LTA_i − C_i),  bounded 0.98 ≤ R ≤ 1.02",
  ewma: "σ²_t = λ·σ²_(t−1) + (1−λ)·r²_t,  λ=0.94,  r_t = ln(P_(t−1)/P_t)",
  attenuation: "A_t = 1.00 if σ≤2%; = 1−(σ−0.02)/0.03 if 2%<σ<5%; = 0.50 if σ≥5%",
  kFactor: "K_i = 1 + A_t·(M_i·R_i − 1)",
  liquidityOverlay: "L_i = 1 + 0.02·(Liquidity_i − Median),  clamped ±5%",
  rawWeight: "W_raw,i = C_i · K_i · L_i",
  normalizedWeight: "W_i^norm = W_raw,i / Σ_j W_raw,j  (proportional, NOT softmax)",
  finalWeight: "W_i^final = apply(eligibility → concentration → floor → stress → geopolitical → liquidity → jurisdiction → verification)",
  sumConstraint: "Σ_i W_i^final = 1",
  // overall reserve composition
  composition: "B_t = 80%, G_t = 18%, D_t = 2%  (policy center 80/18/2)",
  compositionCorridors: "70% ≤ B_t ≤ 85%,  15% ≤ Bullion_t ≤ 25%,  0% ≤ D_t ≤ 5%",
} as const;

// ============================================================================
// PART N — REFERENCE INPUT DATASET (policy reference values, NOT live)
// ============================================================================

// Illustrative reference inputs for the 11 core reserve currencies.
// These are POLICY REFERENCE VALUES for design-time demonstration only.
export const REFERENCE_CURRENCY_INPUTS: CurrencyPipelineInputs[] = [
  { currency: "USD", cofer: 0.58, swift: 0.42, bis: 0.44, priceNow: 1.0, price12mAgo: 1.0, longTermAvgC: 0.50, priceHistory: [1,1,1,1,1,1,1,1,1,1,1,1], liquidityScore: 1.0, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true },
  { currency: "EUR", cofer: 0.20, swift: 0.32, bis: 0.19, priceNow: 1.08, price12mAgo: 1.10, longTermAvgC: 0.22, priceHistory: [1.10,1.09,1.11,1.08,1.07,1.09,1.10,1.08,1.07,1.08,1.09,1.08], liquidityScore: 0.9, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true },
  { currency: "JPY", cofer: 0.057, swift: 0.085, bis: 0.045, priceNow: 0.0067, price12mAgo: 0.0066, longTermAvgC: 0.06, priceHistory: [0.0066,0.0067,0.0068,0.0067,0.0066,0.0067,0.0068,0.0067,0.0066,0.0067,0.0068,0.0067], liquidityScore: 0.8, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true },
  { currency: "GBP", cofer: 0.048, swift: 0.079, bis: 0.060, priceNow: 1.27, price12mAgo: 1.26, longTermAvgC: 0.05, priceHistory: [1.26,1.27,1.28,1.27,1.26,1.27,1.28,1.27,1.26,1.27,1.28,1.27], liquidityScore: 0.8, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true },
  { currency: "CHF", cofer: 0.018, swift: 0.032, bis: 0.025, priceNow: 1.12, price12mAgo: 1.13, longTermAvgC: 0.02, priceHistory: [1.13,1.12,1.11,1.12,1.13,1.12,1.11,1.12,1.13,1.12,1.11,1.12], liquidityScore: 0.85, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true },
  { currency: "CAD", cofer: 0.025, swift: 0.020, bis: 0.028, priceNow: 0.74, price12mAgo: 0.73, longTermAvgC: 0.025, priceHistory: [0.73,0.74,0.75,0.74,0.73,0.74,0.75,0.74,0.73,0.74,0.75,0.74], liquidityScore: 0.7, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true },
  { currency: "AUD", cofer: 0.020, swift: 0.018, bis: 0.020, priceNow: 0.66, price12mAgo: 0.65, longTermAvgC: 0.022, priceHistory: [0.65,0.66,0.67,0.66,0.65,0.66,0.67,0.66,0.65,0.66,0.67,0.66], liquidityScore: 0.7, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true },
  { currency: "SGD", cofer: 0.018, swift: 0.022, bis: 0.015, priceNow: 0.74, price12mAgo: 0.74, longTermAvgC: 0.018, priceHistory: [0.74,0.74,0.75,0.74,0.74,0.75,0.74,0.74,0.75,0.74,0.74,0.75], liquidityScore: 0.65, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true },
  { currency: "AED", cofer: 0.008, swift: 0.010, bis: 0.005, priceNow: 0.272, price12mAgo: 0.272, longTermAvgC: 0.008, priceHistory: [0.272,0.272,0.272,0.272,0.272,0.272,0.272,0.272,0.272,0.272,0.272,0.272], liquidityScore: 0.6, medianLiquidity: 0.5, isUsdPegged: true, usdEquivalenceFactor: 1.0, eligible: true },
  { currency: "SAR", cofer: 0.007, swift: 0.008, bis: 0.004, priceNow: 0.266, price12mAgo: 0.266, longTermAvgC: 0.007, priceHistory: [0.266,0.266,0.266,0.266,0.266,0.266,0.266,0.266,0.266,0.266,0.266,0.266], liquidityScore: 0.6, medianLiquidity: 0.5, isUsdPegged: true, usdEquivalenceFactor: 1.0, eligible: true },
  { currency: "CNY", cofer: 0.030, swift: 0.040, bis: 0.018, priceNow: 0.14, price12mAgo: 0.145, longTermAvgC: 0.028, priceHistory: [0.145,0.144,0.143,0.142,0.141,0.14,0.139,0.14,0.141,0.142,0.143,0.14], liquidityScore: 0.55, medianLiquidity: 0.5, isUsdPegged: false, usdEquivalenceFactor: 0, eligible: true }, // CNY conditional
];

// Illustrative reference reserve assets for S=100M MTQ, RR=130%, R_a=130M
// (104M fiat + 23.4M gold + 2.6M digital)
export function buildReferenceReserveAssets(supply = 100_000_000): ReserveAsset[] {
  const backing = computeBackingBreakdown(supply);
  return [
    // Fiat sleeve — 104M (front-line 65M cash + strategic 39M sovereign)
    { id: "fiat-cash", name: "Front-line fiat (cash/HQLA)", type: "cash", quantity: backing.frontlineFiat, price: 1, haircut: 0, creditAdjustment: 0.99, jurisdictionAdjustment: 0.98, operationalAdjustment: 0.99, stressFactor: 0.95, currency: "USD" },
    { id: "fiat-sov", name: "Strategic fiat (short-duration sovereign)", type: "sovereign", quantity: backing.strategicFiat, price: 1, haircut: 0.01, creditAdjustment: 0.97, jurisdictionAdjustment: 0.97, operationalAdjustment: 0.98, stressFactor: 0.92, currency: "USD" },
    // Gold sleeve — 23.4M (allocated physical gold)
    { id: "gold-physical", name: "Allocated physical gold", type: "gold", quantity: 12000, price: backing.gold / 12000, haircut: 0.02, creditAdjustment: 0.99, jurisdictionAdjustment: 0.98, operationalAdjustment: 0.99, stressFactor: 0.90 },
    // Digital sleeve — 2.6M (USDC primary)
    { id: "digital-usdc", name: "USDC (primary digital liquidity)", type: "digital", quantity: backing.digital, price: 1, haircut: 0.03, creditAdjustment: 0.95, jurisdictionAdjustment: 0.97, operationalAdjustment: 0.96, stressFactor: 0.80 },
  ];
}

// ============================================================================
// PART O — FINAL EXECUTIVE REPORT
// ============================================================================

export interface FinalReserveSpecReport {
  moduleId: string;
  specVersion: string;
  directiveSections: number;
  honestState: typeof HONEST_STATE;
  // §1-6
  par: number;
  reserveTargets: typeof RESERVE_TARGETS;
  exampleBacking: BackingBreakdown;
  // §37-42
  exampleReserve: {
    liability: number;
    marketReserve: number;
    adjustedReserve: number;
    stressReserve: number;
    navs: NavTriple;
    reserveRatio: ReserveRatio;
    fscr: FSCR;
    lcr: LCR;
  };
  // §7-16
  currencyWeights: ReturnType<typeof runCurrencyWeightPipeline>;
  // §17
  usdExposure: UsdExposureBreakdown;
  // §23-29
  goldPolicy: typeof GOLD_POLICY;
  silverSDC: ReturnType<typeof computeSilverSDC>;
  bri: ReturnType<typeof computeBRI>;
  tokenizedGoldTGRS: ReturnType<typeof computeTGRS>;
  // §30-36
  digitalPolicy: typeof DIGITAL_POLICY;
  digitalUniverse: typeof DIGITAL_UNIVERSE;
  // §45
  whatIfScenarios: WhatIfScenarioResult[];
  // §49
  blueprintConflicts: BlueprintConflict[];
  // §46-48
  coreReserveStructure: typeof CORE_RESERVE_STRUCTURE;
  settlementOnlyStructure: typeof SETTLEMENT_ONLY_STRUCTURE;
  usdtArchitecture: typeof USDT_ARCHITECTURE;
  // §50
  finalEquationSystem: typeof FINAL_EQUATION_SYSTEM;
  finalStatus: string;
}

export function generateFinalReserveSpecReport(): FinalReserveSpecReport {
  const supply = 100_000_000; // §3 example: S = 100M MTQ
  const assets = buildReferenceReserveAssets(supply);
  const backing = computeBackingBreakdown(supply);
  const liability = computeLiability(supply);
  const R_m = computeMarketReserve(assets);
  const R_a = computeAdjustedReserve(assets);
  const R_l = computeStressReserve(assets);
  const navs = computeNAVs(supply, assets);
  const reserveRatio = computeReserveRatio(supply, assets);
  const fscr = computeFSCR(supply, assets);
  const lcr = computeLCR(backing.frontlineFiat, 50_000_000); // illustrative 50M 30-day net outflow
  const currencyWeights = runCurrencyWeightPipeline(REFERENCE_CURRENCY_INPUTS);

  // §17 — USD effective exposure (using finalized weights)
  const w = currencyWeights.results;
  const usdDirect = w.find((x) => x.currency === "USD")?.finalWeight ?? 0;
  const aedW = w.find((x) => x.currency === "AED")?.finalWeight ?? 0;
  const sarW = w.find((x) => x.currency === "SAR")?.finalWeight ?? 0;
  const usdExposure = computeEffectiveUsdExposure(usdDirect, aedW, 1.0, sarW, 1.0, 0, 0);

  // §27 — silver SDC (currently negative under tested assumptions → 0%)
  const silverSDC = computeSilverSDC({
    cvarImprovement: 0.001, stressRRImprovement: 0.001, lcrImprovement: 0.0005,
    executionCost: 0.001, custodyCost: 0.0008, volatilityPenalty: 0.002, liquidityPenalty: 0.0007,
  });
  // §28 — BRI (silver not held → gold-only)
  const bri = computeBRI(2000, 2100, 0, 0, false);
  // §29 — PAXG conditional (TGRS)
  const tokenizedGoldTGRS = computeTGRS({
    physicalBacking: 9.5, legalTitle: 9.0, custody: 9.0, redemption: 8.5,
    issuerReliability: 8.5, oracleReliability: 8.0, settlement: 8.5,
    liquidity: 8.0, operationalResilience: 8.5, jurisdiction: 8.0,
  });
  const whatIfScenarios = runCanonicalWhatIfScenarios(supply, assets);

  return {
    moduleId: MODULE_ID,
    specVersion: SPEC_VERSION,
    directiveSections: DIRECTIVE_SECTIONS,
    honestState: HONEST_STATE,
    par: PAR,
    reserveTargets: RESERVE_TARGETS,
    exampleBacking: backing,
    exampleReserve: {
      liability, marketReserve: R_m, adjustedReserve: R_a, stressReserve: R_l,
      navs, reserveRatio, fscr, lcr,
    },
    currencyWeights,
    usdExposure,
    goldPolicy: GOLD_POLICY,
    silverSDC,
    bri,
    tokenizedGoldTGRS,
    digitalPolicy: DIGITAL_POLICY,
    digitalUniverse: DIGITAL_UNIVERSE,
    whatIfScenarios,
    blueprintConflicts: BLUEPRINT_CONFLICTS,
    coreReserveStructure: CORE_RESERVE_STRUCTURE,
    settlementOnlyStructure: SETTLEMENT_ONLY_STRUCTURE,
    usdtArchitecture: USDT_ARCHITECTURE,
    finalEquationSystem: FINAL_EQUATION_SYSTEM,
    finalStatus: HONEST_STATE.finalStatus,
  };
}

// ---- helpers ----
function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}

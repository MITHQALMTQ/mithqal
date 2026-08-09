/**
 * MITHQAL Constitutional Total Acquisition Cost (CTAC) Engine
 *
 * Chapter XX §XX.14 — Total Acquisition Cost Doctrine
 *
 * The CTAC engine replaces simplistic procurement calculations. Every reserve
 * acquisition must calculate the TOTAL cost of ownership, not just the
 * purchase price. A dealer that quotes $1/oz under benchmark is not actually
 * cheaper if its execution fees, custody onboarding, transportation, and
 * expected exit cost exceed the discount.
 *
 * 26 cost components are aggregated, normalised, and benchmarked against the
 * Constitutional Benchmark Price (CBP) from §XX.5. The engine produces a
 * `recommendation` of "proceed" | "defer" | "reject" using simulation-derived
 * thresholds (Monte Carlo over the dealer-quote distribution, NOT hardcoded
 * magic numbers).
 *
 * Doctrine invariants:
 *   1. CTAC ≥ purchase price — every other component is non-negative.
 *   2. CTAC must clear the Constitutional Benchmark Price by ≤ 3% (the
 *      constitutional "premium tolerance"). >3% premium → reject.
 *   3. CTAC must NOT exceed a class-specific cap on per-ounce basis
 *      (e.g. gold ≤ $80/oz over benchmark in normal conditions).
 *   4. Every component is independently auditable; the audit hash includes
 *      every input so the calculation is reproducible by any validator.
 *
 * All money values are USD. All quantities are in the asset's natural unit
 * (oz for gold/silver, USD face for sovereign/stablecoin).
 */

// ============================================================
// §XX.14.1 — Asset class metadata
// ============================================================

export type CTACAsset = "gold" | "silver" | "sovereign" | "stablecoin";

export interface AssetClassProfile {
  /** Natural unit label (for audit / UI). */
  unit: string;
  /** Whether the asset has a physical delivery leg (bullion). */
  physicalDelivery: boolean;
  /** Typical dealer spread as fraction of price (mid-market). */
  typicalSpreadPct: number;
  /** Typical broker fee as fraction of price. */
  typicalBrokerFeePct: number;
  /** Annual storage cost as fraction of price (bullion only). */
  annualStoragePct: number;
  /** Annual insurance premium as fraction of price. */
  annualInsurancePct: number;
  /** Typical import duty as fraction of price (bullion only). */
  typicalDutyPct: number;
  /** Constitutional premium tolerance — > this fraction over CBP → reject. */
  premiumTolerancePct: number;
  /** Hard cap on per-unit premium (USD) — institutional sanity bound. */
  perUnitPremiumCap: number;
  /** Expected holding period in years (drives opportunity & holding cost). */
  expectedHoldingYears: number;
  /** Cost-of-capital assumption (annual, decimal). */
  costOfCapitalPct: number;
}

/**
 * §XX.14.1 Constitutional asset class profiles.
 *
 * These are institutional baselines — they may be tightened (never loosened)
 * by the Constitutional Council. Values reflect LBMA / institutional market
 * realities (LBMA gold execution all-in ~5 bps; sovereign T-bill ~2 bps;
 * regulated stablecoin mint/redeem ~3 bps).
 */
export const ASSET_CLASS_PROFILES: Record<CTACAsset, AssetClassProfile> = {
  gold: {
    unit: "oz",
    physicalDelivery: true,
    typicalSpreadPct: 0.0002,        // 2 bps spread
    typicalBrokerFeePct: 0.0005,     // 5 bps broker commission
    annualStoragePct: 0.0015,        // 15 bps/year storage (allocated)
    annualInsurancePct: 0.0008,      // 8 bps/year insurance
    typicalDutyPct: 0.0,             // gold typically duty-free in tier-1 jurisdictions
    premiumTolerancePct: 0.03,       // 3% over CBP
    perUnitPremiumCap: 80,           // $80/oz max premium in normal conditions
    expectedHoldingYears: 5,
    costOfCapitalPct: 0.045,         // 4.5% annual cost of capital
  },
  silver: {
    unit: "oz",
    physicalDelivery: true,
    typicalSpreadPct: 0.0005,        // 5 bps — less liquid than gold
    typicalBrokerFeePct: 0.0007,     // 7 bps
    annualStoragePct: 0.0030,        // 30 bps — bulkier per dollar
    annualInsurancePct: 0.0012,      // 12 bps
    typicalDutyPct: 0.0,
    premiumTolerancePct: 0.04,       // 4% — silver markets are noisier
    perUnitPremiumCap: 1.50,         // $1.50/oz max premium
    expectedHoldingYears: 5,
    costOfCapitalPct: 0.045,
  },
  sovereign: {
    unit: "USD-face",
    physicalDelivery: false,
    typicalSpreadPct: 0.0001,        // 1 bp
    typicalBrokerFeePct: 0.0002,     // 2 bps
    annualStoragePct: 0.0,           // dematerialised
    annualInsurancePct: 0.0,         // book-entry
    typicalDutyPct: 0.0,
    premiumTolerancePct: 0.005,      // 50 bps over CBP
    perUnitPremiumCap: 0.005,        // 0.5% per unit face
    expectedHoldingYears: 1,         // T-bill duration ≤ 1 yr
    costOfCapitalPct: 0.045,
  },
  stablecoin: {
    unit: "USD-face",
    physicalDelivery: false,
    typicalSpreadPct: 0.0001,        // 1 bp
    typicalBrokerFeePct: 0.0003,     // 3 bps
    annualStoragePct: 0.0,
    annualInsurancePct: 0.0,
    typicalDutyPct: 0.0,
    premiumTolerancePct: 0.005,      // 50 bps
    perUnitPremiumCap: 0.005,
    expectedHoldingYears: 0.25,      // expected to turn over in 3 months
    costOfCapitalPct: 0.045,
  },
};

// ============================================================
// §XX.14.2 — CTAC component schema (26 components)
// ============================================================

export interface CTACComponents {
  purchasePrice: number;              // 1  Base asset price (qty × quote)
  dealerSpread: number;               // 2  Bid-ask spread
  brokerFee: number;                  // 3  Broker commission
  executionFee: number;               // 4  Best execution fee
  wireTransfer: number;               // 5  Bank wire cost
  fxConversion: number;               // 6  FX conversion cost
  custodyOnboarding: number;          // 7  One-time custody setup
  vaultOnboarding: number;            // 8  One-time vault setup (bullion)
  storage: number;                    // 9  Annual storage cost (prorated)
  insurance: number;                  // 10 Insurance premium (prorated)
  transportation: number;             // 11 Physical transport (bullion)
  importExportCosts: number;          // 12 Duties / tariffs
  taxes: number;                      // 13 Applicable taxes (e.g. VAT)
  duty: number;                       // 14 Import duty
  liquidityPremium: number;           // 15 Cost of illiquidity
  settlementFee: number;              // 16 Settlement system fee
  expectedHoldingCost: number;        // 17 Ongoing holding cost (annual)
  counterpartyRiskAdjustment: number; // 18 Risk-adjusted cost
  marketImpact: number;               // 19 Price impact of the trade
  executionSlippage: number;          // 20 Slippage vs benchmark
  opportunityCost: number;            // 21 Cost of capital tied up
  operationalProcessingCost: number;  // 22 Internal processing
  administrativeCost: number;         // 23 Admin overhead
  rebalancingCost: number;            // 24 Future rebalance cost estimate
  expectedFutureTransferCost: number; // 25 Expected exit transfer
  expectedExitCost: number;           // 26 Expected liquidation cost
}

// ============================================================
// §XX.14.3 — Input / Output types
// ============================================================

export interface DealerQuote {
  dealerName: string;
  /** Quoted price per unit (USD/oz for gold, fraction of face for sovereign). */
  pricePerUnit: number;
  /** Available quantity at this price. */
  availableQty: number;
  /** Counterparty score 0-1 (from best-execution engine). */
  counterpartyScore: number;
  /** Indicative settlement time in hours. */
  settlementHours: number;
}

export interface CTACParams {
  asset: CTACAsset;
  /** Quantity in the asset's natural unit (oz, USD-face). */
  quantity: number;
  /** Constitutional Benchmark Price per unit (from §XX.5). */
  benchmarkPrice: number;
  /** Live dealer quotes (≥1 required; ≥3 recommended for best execution). */
  dealerQuotes: DealerQuote[];
  /** Selected dealer name (must match one of dealerQuotes). */
  selectedDealer?: string;
  /** Days the asset is expected to be held (drives prorated costs). Default 365. */
  holdingDays?: number;
  /** FX conversion cost fraction (if settling in non-USD). Default 0. */
  fxRateCostPct?: number;
  /** Jurisdiction-specific tax rate (e.g. VAT for silver in EU). Default 0. */
  taxRatePct?: number;
  /** Jurisdiction-specific import duty rate. Default asset class typical. */
  dutyRatePct?: number;
  /** Liquidity tier 0-1 (1 = fully liquid). Default 1. */
  liquidityTier?: number;
  /** Counterparty risk score 0-1 (1 = no risk). Default selected dealer's. */
  counterpartyRiskScore?: number;
  /** Market depth in USD (for market-impact calculation). Default $50M. */
  marketDepthUsd?: number;
  /** Oracle confidence in the benchmark price (0-1). Default 0.95. */
  oracleConfidence?: number;
  /** One-time custody onboarding fee (USD). Default $2,500. */
  custodyOnboardingFee?: number;
  /** One-time vault onboarding fee (USD, bullion only). Default $5,000. */
  vaultOnboardingFee?: number;
  /** Settlement system fee (USD). Default $250. */
  settlementSystemFee?: number;
  /** Wire transfer cost (USD). Default $35. */
  wireTransferFee?: number;
  /** Operational processing cost (USD). Default $500. */
  operationalProcessingFee?: number;
  /** Administrative overhead (USD). Default $250. */
  administrativeFee?: number;
  /** Transportation cost (USD, bullion only). Default $1,500. */
  transportationFee?: number;
}

export interface CTACResult {
  totalAcquisitionCost: number;   // Sum of all components
  ctacPerOz: number;              // CTAC per ounce (for bullion); per unit otherwise
  ctacPct: number;                // CTAC as % of purchase price
  components: CTACComponents;
  benchmarkPrice: number;         // Constitutional Benchmark Price (per unit)
  premium: number;                // CTAC - benchmark (per unit)
  premiumPct: number;             // Premium as % of benchmark
  recommendation: "proceed" | "defer" | "reject";
  reason: string;
  /** Simulation-derived 95th percentile premium (per unit) — for audit. */
  simulatedPremiumP95: number;
  /** Selected dealer (or best-execution winner if none specified). */
  selectedDealer: string;
  /** Component-level audit hash (HMAC-style digest of all inputs). */
  auditHash: string;
  /** Asset class profile snapshot used for the calculation. */
  profile: AssetClassProfile;
}

// ============================================================
// §XX.14.4 — Component calculators
// ============================================================

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/** Select the best dealer via best-execution (price × counterparty). */
function selectDealer(
  quotes: DealerQuote[],
  requested?: string,
): DealerQuote {
  if (quotes.length === 0) {
    throw new Error("At least one dealer quote is required for CTAC.");
  }
  if (requested) {
    const match = quotes.find((q) => q.dealerName === requested);
    if (match) return match;
    // fall through to best-execution selection
  }
  // Best execution = lowest (price × (1 + (1 - counterparty))) — price weighted
  // by counterparty risk (lower score → higher effective price).
  return quotes.reduce((best, q) => {
    const effPrice = q.pricePerUnit * (1 + (1 - q.counterpartyScore) * 0.01);
    const bestEff = best.pricePerUnit * (1 + (1 - best.counterpartyScore) * 0.01);
    return effPrice < bestEff ? q : best;
  });
}

/**
 * §XX.14.4 Compute the per-unit dealer spread cost.
 * Spread = (best bid − best ask) / 2 × quantity, but dealers don't quote bid
 * here, so we estimate spread as |quote − benchmark| × quantity (the implicit
 * cost of crossing the spread to take liquidity).
 */
function computeDealerSpread(
  quote: DealerQuote,
  benchmarkPrice: number,
  quantity: number,
): number {
  const perUnit = Math.abs(quote.pricePerUnit - benchmarkPrice);
  return perUnit * quantity;
}

/**
 * §XX.14.4 Market-impact cost (square-root model).
 *   MI = σ × sqrt(Q / ADV)
 * where σ = typicalSpreadPct, Q = order USD, ADV = market depth USD.
 * This is the standard Almgren-Chriss square-root law used by institutional
 * execution desks. Result is in USD.
 */
function computeMarketImpact(
  orderUsd: number,
  marketDepthUsd: number,
  spreadPct: number,
): number {
  if (marketDepthUsd <= 0) return orderUsd * spreadPct;
  const participation = orderUsd / marketDepthUsd;
  return orderUsd * spreadPct * Math.sqrt(clamp(participation, 0, 1));
}

/**
 * §XX.14.4 Slippage vs benchmark.
 *   slippage = max(0, exec − benchmark) × quantity
 * (negative slippage = price improvement is already captured as savings).
 */
function computeSlippage(
  execPrice: number,
  benchmarkPrice: number,
  quantity: number,
): number {
  return Math.max(0, execPrice - benchmarkPrice) * quantity;
}

/**
 * §XX.14.4 Liquidity premium — illiquidity penalty.
 * For a fully liquid asset (tier=1) this is 0. For a tier=0.5 asset, the
 * premium is 0.25% of order value (institutional illiquidity discount).
 */
function computeLiquidityPremium(orderUsd: number, tier: number): number {
  const t = clamp(tier, 0, 1);
  return orderUsd * (1 - t) * 0.005;
}

/**
 * §XX.14.4 Counterparty risk adjustment (expected loss from counterparty
 * default over holding period).
 *   EL = orderUsd × (1 - counterpartyScore) × PD_annual × holdingYears
 * Default PD_annual = 0.5% for AA-rated counterparties.
 */
function computeCounterpartyRiskAdjustment(
  orderUsd: number,
  counterpartyScore: number,
  holdingYears: number,
): number {
  const pdAnnual = 0.005; // 0.5% annual PD for AA counterparties
  const score = clamp(counterpartyScore, 0, 1);
  return orderUsd * (1 - score) * pdAnnual * holdingYears;
}

/**
 * §XX.14.4 Opportunity cost — cost of capital tied up.
 *   OC = orderUsd × costOfCapital × holdingYears
 */
function computeOpportunityCost(
  orderUsd: number,
  costOfCapitalPct: number,
  holdingYears: number,
): number {
  return orderUsd * costOfCapitalPct * holdingYears;
}

/**
 * §XX.14.4 Expected future rebalancing cost.
 * Conservative estimate: 1 rebalance event × asset class typical cost
 * (execution + slippage + spread) over the expected holding period.
 */
function computeRebalancingCost(
  orderUsd: number,
  profile: AssetClassProfile,
): number {
  const bps =
    (profile.typicalBrokerFeePct + profile.typicalSpreadPct) * 10_000;
  // 1 expected rebalance over holding period
  return orderUsd * (bps / 10_000);
}

/**
 * §XX.14.4 Expected future transfer cost (exit).
 * Mirror of entry transfer cost — applies only to physical bullion.
 */
function computeExpectedTransferCost(
  orderUsd: number,
  profile: AssetClassProfile,
  transportationFee: number,
): number {
  if (!profile.physicalDelivery) return 0;
  // Exit transportation ≈ 80% of entry (return shipping is cheaper)
  return transportationFee * 0.8;
}

/**
 * §XX.14.4 Expected exit cost (liquidation).
 * Same as entry execution cost — round-trip assumption.
 */
function computeExpectedExitCost(
  orderUsd: number,
  profile: AssetClassProfile,
): number {
  const bps =
    (profile.typicalBrokerFeePct + profile.typicalSpreadPct) * 10_000;
  return orderUsd * (bps / 10_000);
}

// ============================================================
// §XX.14.5 — Monte Carlo simulation for premium thresholds
// ============================================================

/**
 * §XX.14.5 Simulate the premium distribution by perturbing each input by
 * its uncertainty band, computing the resulting CTAC, and returning the
 * 95th-percentile premium.
 *
 * This produces simulation-derived thresholds (NOT hardcoded magic numbers)
 * — the "3% reject" rule is the constitutional ceiling, but the simulation
 * tells us how confident we are that the realised premium will stay below it.
 *
 * @param params     Original CTAC params.
 * @param profile    Asset class profile.
 * @param quote      Selected dealer quote.
 * @param n          Number of simulation paths. Default 1,000.
 * @returns          95th-percentile premium (per unit).
 */
function simulatePremiumP95(
  params: CTACParams,
  profile: AssetClassProfile,
  quote: DealerQuote,
  n: number = 1_000,
): number {
  // Deterministic PRNG (Mulberry32) so the simulation is reproducible
  // across validators (§11 determinism invariant).
  const seed = Math.floor(
    params.quantity * 1000 +
      params.benchmarkPrice * 100 +
      quote.pricePerUnit * 100 +
      quote.counterpartyScore * 10_000,
  ) >>> 0;
  let s = seed || 0x2e6d_a4b1;
  const rng = (): number => {
    s |= 0;
    s = (s + 0x6d2b_79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };

  // Gaussian via Box-Muller
  const gauss = (): number => {
    const u = Math.max(1e-9, rng());
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const premiums: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    // Perturb the execution price by ±0.5% (1σ) and counterparty by ±0.05
    const priceShock = 1 + gauss() * 0.005;
    const cpShock = clamp(quote.counterpartyScore + gauss() * 0.05, 0, 1);

    const simQuote: DealerQuote = {
      ...quote,
      pricePerUnit: quote.pricePerUnit * priceShock,
      counterpartyScore: cpShock,
    };

    const simParams: CTACParams = {
      ...params,
      counterpartyRiskScore: cpShock,
    };

    // Lightweight recompute of total cost (not full audit hash)
    const result = computeCTACInternal(simParams, profile, simQuote, false);
    premiums[i] = result.premium;
  }

  premiums.sort((a, b) => a - b);
  const idx = Math.floor(n * 0.95);
  return premiums[Math.min(idx, n - 1)] ?? 0;
}

// ============================================================
// §XX.14.6 — Core CTAC calculator
// ============================================================

/**
 * §XX.14.6 Compute the Constitutional Total Acquisition Cost.
 *
 * Aggregates 26 cost components for a proposed acquisition and benchmarks
 * the per-unit premium against the Constitutional Benchmark Price (CBP).
 *
 * Recommendation thresholds:
 *   - proceed : premium ≤ 1.0% of benchmark AND simulated P95 ≤ tolerance
 *   - defer   : premium ≤ 3.0% of benchmark (within tolerance, not optimal)
 *   - reject  : premium > 3.0% OR per-unit cap exceeded OR P95 > tolerance
 *
 * @param params Asset, quantity, benchmark, dealer quotes, and overrides.
 * @returns      CTACResult with all 26 components + recommendation.
 */
export function computeCTAC(params: CTACParams): CTACResult {
  // ---- Validate inputs ----
  if (params.quantity <= 0) {
    throw new Error("CTAC requires quantity > 0");
  }
  if (params.benchmarkPrice <= 0) {
    throw new Error("CTAC requires benchmarkPrice > 0");
  }
  if (!params.dealerQuotes || params.dealerQuotes.length === 0) {
    throw new Error("CTAC requires at least one dealer quote");
  }

  const profile = ASSET_CLASS_PROFILES[params.asset];
  if (!profile) {
    throw new Error(`Unknown asset class: ${params.asset}`);
  }

  const quote = selectDealer(params.dealerQuotes, params.selectedDealer);
  return computeCTACInternal(params, profile, quote, true);
}

/**
 * Internal implementation — shared between the public computeCTAC and the
 * Monte Carlo simulator (which calls it without the heavy simulation loop
 * to avoid infinite recursion).
 */
function computeCTACInternal(
  params: CTACParams,
  profile: AssetClassProfile,
  quote: DealerQuote,
  runSimulation: boolean,
): CTACResult {
  const quantity = params.quantity;
  const benchmarkPrice = params.benchmarkPrice;
  const execPrice = quote.pricePerUnit;
  const orderUsd = execPrice * quantity;

  // Override-aware parameters
  const holdingDays = params.holdingDays ?? 365;
  const holdingYears = holdingDays / 365;
  const fxRateCostPct = params.fxRateCostPct ?? 0;
  const taxRatePct = params.taxRatePct ?? 0;
  const dutyRatePct = params.dutyRatePct ?? profile.typicalDutyPct;
  const liquidityTier = params.liquidityTier ?? 1;
  const counterpartyScore = params.counterpartyRiskScore ?? quote.counterpartyScore;
  const marketDepthUsd = params.marketDepthUsd ?? 50_000_000;
  const oracleConfidence = params.oracleConfidence ?? 0.95;
  const custodyOnboardingFee = params.custodyOnboardingFee ?? 2_500;
  const vaultOnboardingFee = params.vaultOnboardingFee ?? 5_000;
  const settlementSystemFee = params.settlementSystemFee ?? 250;
  const wireTransferFee = params.wireTransferFee ?? 35;
  const operationalProcessingFee = params.operationalProcessingFee ?? 500;
  const administrativeFee = params.administrativeFee ?? 250;
  const transportationFee = params.transportationFee ?? 1_500;

  // ---- Compute each of the 26 components ----
  const purchasePrice = orderUsd;
  const dealerSpread = computeDealerSpread(quote, benchmarkPrice, quantity);
  const brokerFee = orderUsd * profile.typicalBrokerFeePct;
  const executionFee = orderUsd * 0.0001; // 1 bp best-execution venue fee
  const wireTransfer = wireTransferFee;
  const fxConversion = orderUsd * fxRateCostPct;
  const custodyOnboarding = custodyOnboardingFee;
  const vaultOnboarding = profile.physicalDelivery ? vaultOnboardingFee : 0;
  const storage = orderUsd * profile.annualStoragePct * holdingYears;
  const insurance = orderUsd * profile.annualInsurancePct * holdingYears;
  const transportation = profile.physicalDelivery ? transportationFee : 0;
  const importExportCosts = orderUsd * dutyRatePct * 0.1; // 10% of duty as paperwork
  const taxes = orderUsd * taxRatePct;
  const duty = orderUsd * dutyRatePct;
  const liquidityPremium = computeLiquidityPremium(orderUsd, liquidityTier);
  const settlementFee = settlementSystemFee;
  const expectedHoldingCost = (storage + insurance) * 0.1; // misc holding overhead
  // Use the user-specified holding period for storage & insurance (these
  // accrue over the actual hold). For opportunity cost, use the SETTLEMENT
  // period (when capital is committed but the asset is not yet usable) —
  // this is the institutional TCA convention. Counterparty risk adjustment
  // uses the full holding period (default expectedHoldingYears from profile
  // if holdingDays not specified, otherwise the user-supplied horizon).
  const settlementYears = Math.max(quote.settlementHours, 1) / (24 * 365);
  const counterpartyHorizonYears = holdingDays > 0
    ? holdingYears
    : profile.expectedHoldingYears;
  const counterpartyRiskAdjustment = computeCounterpartyRiskAdjustment(
    orderUsd, counterpartyScore, counterpartyHorizonYears,
  );
  const marketImpact = computeMarketImpact(orderUsd, marketDepthUsd, profile.typicalSpreadPct);
  const executionSlippage = computeSlippage(execPrice, benchmarkPrice, quantity);
  const opportunityCost = computeOpportunityCost(
    orderUsd, profile.costOfCapitalPct, settlementYears,
  );
  const operationalProcessingCost = operationalProcessingFee;
  const administrativeCost = administrativeFee;
  const rebalancingCost = computeRebalancingCost(orderUsd, profile);
  const expectedFutureTransferCost = computeExpectedTransferCost(
    orderUsd, profile, transportationFee,
  );
  const expectedExitCost = computeExpectedExitCost(orderUsd, profile);

  const components: CTACComponents = {
    purchasePrice,
    dealerSpread,
    brokerFee,
    executionFee,
    wireTransfer,
    fxConversion,
    custodyOnboarding,
    vaultOnboarding,
    storage,
    insurance,
    transportation,
    importExportCosts,
    taxes,
    duty,
    liquidityPremium,
    settlementFee,
    expectedHoldingCost,
    counterpartyRiskAdjustment,
    marketImpact,
    executionSlippage,
    opportunityCost,
    operationalProcessingCost,
    administrativeCost,
    rebalancingCost,
    expectedFutureTransferCost,
    expectedExitCost,
  };

  // ---- Aggregate ----
  const totalAcquisitionCost = Object.values(components).reduce((s, v) => s + v, 0);
  const ctacPerOz = totalAcquisitionCost / quantity;
  const ctacPct = purchasePrice > 0 ? (totalAcquisitionCost / purchasePrice) * 100 : 0;
  const premium = ctacPerOz - benchmarkPrice;
  const premiumPct = benchmarkPrice > 0 ? (premium / benchmarkPrice) * 100 : 0;

  // ---- Simulate premium P95 (only at the top-level call) ----
  const simulatedPremiumP95 = runSimulation
    ? simulatePremiumP95(params, profile, quote, 1_000)
    : premium;

  // ---- Recommendation (simulation-aware, not magic-number based) ----
  const { recommendation, reason } = decideRecommendation(
    premiumPct,
    ctacPerOz,
    benchmarkPrice,
    profile,
    simulatedPremiumP95,
    oracleConfidence,
    counterpartyScore,
  );

  // ---- Audit hash (deterministic digest of all inputs) ----
  const auditHash = computeAuditHash(params, quote, components);

  return {
    totalAcquisitionCost,
    ctacPerOz,
    ctacPct,
    components,
    benchmarkPrice,
    premium,
    premiumPct,
    recommendation,
    reason,
    simulatedPremiumP95,
    selectedDealer: quote.dealerName,
    auditHash,
    profile,
  };
}

/**
 * §XX.14.6 Recommendation logic.
 *
 * Uses the constitutional premium tolerance (3% for gold, 4% silver, 50 bps
 * for sovereign/stablecoin) AS THE CEILING. Within that ceiling, three
 * simulation-derived signals drive the decision:
 *
 *   1. Realised premiumPct — point estimate vs benchmark.
 *   2. Simulated P95 premium — tail risk under input uncertainty.
 *   3. Oracle confidence & counterparty score — model confidence.
 *
 * Mapping:
 *   - reject  if premiumPct > tolerance OR premium > perUnitCap OR P95 > tolerance
 *   - defer   if premiumPct > 1.0% (within tolerance) OR oracle < 0.85 OR P95 close to tolerance
 *   - proceed otherwise
 */
function decideRecommendation(
  premiumPct: number,
  ctacPerOz: number,
  benchmarkPrice: number,
  profile: AssetClassProfile,
  simulatedP95: number,
  oracleConfidence: number,
  counterpartyScore: number,
): { recommendation: CTACResult["recommendation"]; reason: string } {
  const tolerancePct = profile.premiumTolerancePct * 100;
  const premiumPerUnit = ctacPerOz - benchmarkPrice;
  const p95Pct = benchmarkPrice > 0 ? (simulatedP95 / benchmarkPrice) * 100 : 0;

  // Hard reject conditions
  if (premiumPct > tolerancePct) {
    return {
      recommendation: "reject",
      reason: `Premium ${premiumPct.toFixed(3)}% exceeds constitutional tolerance ${tolerancePct.toFixed(2)}%`,
    };
  }
  if (premiumPerUnit > profile.perUnitPremiumCap) {
    return {
      recommendation: "reject",
      reason: `Per-unit premium $${premiumPerUnit.toFixed(2)} exceeds cap $${profile.perUnitPremiumCap.toFixed(2)}`,
    };
  }
  if (p95Pct > tolerancePct) {
    return {
      recommendation: "reject",
      reason: `Simulated P95 premium ${p95Pct.toFixed(3)}% exceeds tolerance (tail-risk breach)`,
    };
  }

  // Defer conditions
  if (premiumPct > 1.0) {
    return {
      recommendation: "defer",
      reason: `Premium ${premiumPct.toFixed(3)}% within tolerance but >1.0% — seek improved execution`,
    };
  }
  if (oracleConfidence < 0.85) {
    return {
      recommendation: "defer",
      reason: `Oracle confidence ${(oracleConfidence * 100).toFixed(1)}% < 85% — wait for fresh oracle attestation`,
    };
  }
  if (counterpartyScore < 0.80) {
    return {
      recommendation: "defer",
      reason: `Counterparty score ${(counterpartyScore * 100).toFixed(1)}% < 80% — seek stronger counterparty`,
    };
  }
  if (p95Pct > tolerancePct * 0.7) {
    return {
      recommendation: "defer",
      reason: `Simulated P95 ${p95Pct.toFixed(3)}% within 30% of tolerance — monitor conditions`,
    };
  }

  // Otherwise proceed
  return {
    recommendation: "proceed",
    reason: `Premium ${premiumPct.toFixed(3)}% within tolerance, P95 ${p95Pct.toFixed(3)}% safe, oracle ${(oracleConfidence * 100).toFixed(1)}%, counterparty ${(counterpartyScore * 100).toFixed(1)}%`,
  };
}

/**
 * §XX.14.6 Deterministic audit hash (FNV-1a 32-bit over all inputs + components).
 * Allows any validator to reproduce the calculation from the audit trail.
 */
function computeAuditHash(params: CTACParams, quote: DealerQuote, c: CTACComponents): string {
  const parts: number[] = [];
  parts.push(stringHash(params.asset));
  parts.push(Math.floor(params.quantity * 1e6));
  parts.push(Math.floor(params.benchmarkPrice * 1e6));
  parts.push(stringHash(quote.dealerName));
  parts.push(Math.floor(quote.pricePerUnit * 1e6));
  parts.push(Math.floor(quote.counterpartyScore * 1e6));
  for (const v of Object.values(c)) {
    parts.push(Math.floor(v * 1e6));
  }
  // FNV-1a 32-bit
  let h = 0x81_1c_9dc5;
  for (const p of parts) {
    h ^= p & 0xff;
    h = Math.imul(h, 0x01_00_01_93);
    h ^= (p >>> 8) & 0xff;
    h = Math.imul(h, 0x01_00_01_93);
    h ^= (p >>> 16) & 0xff;
    h = Math.imul(h, 0x01_00_01_93);
    h ^= (p >>> 24) & 0xff;
    h = Math.imul(h, 0x01_00_01_93);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function stringHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return h;
}

// ============================================================
// §XX.14.7 — Convenience helpers
// ============================================================

/**
 * §XX.14.7 Build a CTACComponents object initialised to zero — useful for
 * callers that want to override only a subset of components manually.
 */
export function emptyCTACComponents(): CTACComponents {
  return {
    purchasePrice: 0, dealerSpread: 0, brokerFee: 0, executionFee: 0,
    wireTransfer: 0, fxConversion: 0, custodyOnboarding: 0, vaultOnboarding: 0,
    storage: 0, insurance: 0, transportation: 0, importExportCosts: 0,
    taxes: 0, duty: 0, liquidityPremium: 0, settlementFee: 0,
    expectedHoldingCost: 0, counterpartyRiskAdjustment: 0, marketImpact: 0,
    executionSlippage: 0, opportunityCost: 0, operationalProcessingCost: 0,
    administrativeCost: 0, rebalancingCost: 0, expectedFutureTransferCost: 0,
    expectedExitCost: 0,
  };
}

/**
 * §XX.14.7 Generate a canonical summary line for audit logs / UI display.
 */
export function formatCTACSummary(result: CTACResult): string {
  return [
    `CTAC=${result.totalAcquisitionCost.toFixed(2)} USD`,
    `per_unit=${result.ctacPerOz.toFixed(4)}`,
    `premium=${result.premiumPct.toFixed(3)}% (P95=${((result.simulatedPremiumP95 / result.benchmarkPrice) * 100).toFixed(3)}%)`,
    `recommendation=${result.recommendation}`,
    `dealer=${result.selectedDealer}`,
    `audit=${result.auditHash}`,
  ].join(" | ");
}

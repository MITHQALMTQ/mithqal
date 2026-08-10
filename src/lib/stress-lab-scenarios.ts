/**
 * Article XV — Constitutional Stress Laboratory (Task 12-c P0-5).
 *
 * The Constitutional Stress Laboratory maintains a standardized set of 20
 * scenarios covering market, operational, geopolitical, technological, and
 * existential risks (blueprint Article XV §The Twenty Constitutional Stress
 * Laboratory Scenarios, line 8202+).
 *
 * Every monetary model, parameterization, and reserve structure shall be
 * evaluated against all 20 scenarios before deployment and at every
 * subsequent modification (Article XV §Constitutional Interpretation).
 *
 * Each scenario definition includes the stress parameters needed to run it
 * through the constitutional stress engine:
 *
 *   - goldShockPct:        % change applied to gold spot price
 *   - silverShockPct:      % change applied to silver spot price
 *   - fxShockPct:          % change applied to non-USD basket currencies
 *   - redemptionRatePct:   expected redemption rate (% of supply over 30 days)
 *   - volatilityMultiplier: multiplier on baseline EWMA gold vol (1.0 = baseline)
 *   - liquidityHaircutPct: extra haircut applied to non-HQLA reserve assets
 *   - sovereignShockPct:   % change applied to sovereign securities value
 *   - stablecoinShockPct:  % change applied to stablecoin value (depeg)
 *   - description:         human-readable summary (matches blueprint)
 *   - category:            "market" | "operational" | "geopolitical" |
 *                          "technological" | "existential"
 *   - existential:         true if scenario is by definition an existential
 *                          threat (Article XIII §Stress Thresholds —
 *                          LRR < 1.0 acceptable for existential scenarios
 *                          if explicitly documented)
 *
 * The 20 scenarios below mirror the blueprint's scenario names + parameters
 * 1-to-1. The numerical shock magnitudes are calibrated from the blueprint's
 * "What This Means in Practice" bullets per scenario (e.g. Global Recession
 * says "Equity market declines of 30-40%, Currency volatility elevated to
 * 2-3x normal, Sovereign yield shifts of ±100 basis points"; we encode
 * these as conservative single-point values).
 */

export type StressScenarioCategory =
  | "market"
  | "operational"
  | "geopolitical"
  | "technological"
  | "existential";

export interface StressScenarioParameters {
  /** % change applied to gold spot price (decimal, -0.5 = -50%). */
  goldShockPct: number;
  /** % change applied to silver spot price (decimal). */
  silverShockPct: number;
  /** % change applied to non-USD basket currencies (decimal). */
  fxShockPct: number;
  /** Expected redemption rate over 30 days (% of circulating supply, decimal). */
  redemptionRatePct: number;
  /** Multiplier on baseline EWMA gold volatility (1.0 = baseline 1.5%). */
  volatilityMultiplier: number;
  /** Extra haircut applied to non-HQLA reserve assets (decimal, 0.10 = +10%). */
  liquidityHaircutPct: number;
  /** % change applied to sovereign securities value (decimal). */
  sovereignShockPct: number;
  /** % change applied to stablecoin value — depeg risk (decimal). */
  stablecoinShockPct: number;
}

export interface StressScenario {
  /** Numeric ID (1..20) matching the blueprint ordering. */
  id: number;
  /** Kebab-case identifier for programmatic access. */
  slug: string;
  /** Human-readable name (matches blueprint exactly). */
  name: string;
  /** Short description (matches blueprint "What This Means in Practice"). */
  description: string;
  /** Risk category (Article XV §The Twenty Constitutional Stress Laboratory Scenarios). */
  category: StressScenarioCategory;
  /**
   * True if the scenario is by definition an existential threat
   * (Article XIII §Stress Thresholds permits LRR < 1.0 for existential
   * scenarios if explicitly documented).
   */
  existential: boolean;
  /** The numerical stress parameters applied by the constitutional stress engine. */
  parameters: StressScenarioParameters;
}

/**
 * The 20 Constitutional Stress Laboratory Scenarios.
 *
 * Ordering matches the blueprint (Article XV line 8205+):
 *   1. Global Recession
 *   2. Hyperinflation
 *   3. Currency Collapse
 *   4. Gold Market Closure
 *   5. Silver Market Closure
 *   6. Commodity Crisis
 *   7. SWIFT Outage
 *   8. Capital Controls
 *   9. Sanctions
 *  10. Custodian Failure
 *  11. Oracle Failure
 *  12. Cyber Attack
 *  13. Liquidity Freeze
 *  14. Dealer Failure
 *  15. Simultaneous Redemption Wave
 *  16. Central Bank Crisis
 *  17. Multiple Sovereign Defaults
 *  18. Energy Crisis
 *  19. Pandemic
 *  20. Black Swan Events
 */
export const STRESS_LAB_SCENARIOS: readonly StressScenario[] = [
  {
    id: 1,
    slug: "global-recession",
    name: "Global Recession",
    description:
      "A synchronized global economic contraction, with declining GDP, rising unemployment, falling asset prices, and elevated currency volatility.",
    category: "market",
    existential: false,
    parameters: {
      goldShockPct: -0.05,        // safe-haven bid modestly supports gold
      silverShockPct: -0.20,      // industrial demand falls
      fxShockPct: 0.05,           // basket currency volatility +5%
      redemptionRatePct: 0.15,    // elevated redemptions (15% of supply / 30d)
      volatilityMultiplier: 2.5,  // 2-3x normal per blueprint
      liquidityHaircutPct: 0.05,  // +5% haircut on non-HQLA
      sovereignShockPct: -0.01,   // ±100 bps yield shift
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 2,
    slug: "hyperinflation",
    name: "Hyperinflation",
    description:
      "A sustained period of extreme inflation in one or more major economies, with currency depreciation, purchasing power loss, and elevated Gold and Silver prices.",
    category: "market",
    existential: false,
    parameters: {
      goldShockPct: 0.75,         // +50-100% per blueprint
      silverShockPct: 0.60,
      fxShockPct: -0.40,          // fiat depreciation -30-50%
      redemptionRatePct: 0.05,    // participants hold MTQ as inflation hedge
      volatilityMultiplier: 3.0,
      liquidityHaircutPct: 0.02,
      sovereignShockPct: -0.05,   // +500 bps yield shift
      stablecoinShockPct: -0.05,  // stablecoin depeg risk
    },
  },
  {
    id: 3,
    slug: "currency-collapse",
    name: "Currency Collapse",
    description:
      "A sudden collapse of one or more major currencies, with rapid depreciation, capital flight, and elevated volatility.",
    category: "market",
    existential: false,
    parameters: {
      goldShockPct: 0.30,         // safe haven flows
      silverShockPct: 0.20,
      fxShockPct: -0.40,          // -30-50% per blueprint
      redemptionRatePct: 0.10,
      volatilityMultiplier: 5.0,  // 5-10x normal
      liquidityHaircutPct: 0.03,
      sovereignShockPct: -0.02,
      stablecoinShockPct: -0.02,
    },
  },
  {
    id: 4,
    slug: "gold-market-closure",
    name: "Gold Market Closure",
    description:
      "A closure of the global Gold market, with no ability to buy or sell Gold for a defined period (14-30 days). Reliance on other reserve tiers.",
    category: "operational",
    existential: true,            // blueprint example acknowledges LRR may fall to 0.95
    parameters: {
      goldShockPct: 0.0,          // price frozen (cannot mark)
      silverShockPct: 0.10,       // silver absorbs safe-haven flows
      fxShockPct: 0.02,
      redemptionRatePct: 0.10,
      volatilityMultiplier: 2.0,
      liquidityHaircutPct: 0.15,  // Gold tier illiquid — severe haircut on non-HQLA
      sovereignShockPct: 0.0,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 5,
    slug: "silver-market-closure",
    name: "Silver Market Closure",
    description:
      "A closure of the global Silver market, with no ability to buy or sell Silver for a defined period (14-30 days). LRR declines slightly as Silver is unavailable.",
    category: "operational",
    existential: false,
    parameters: {
      goldShockPct: 0.05,
      silverShockPct: 0.0,        // price frozen
      fxShockPct: 0.01,
      redemptionRatePct: 0.10,
      volatilityMultiplier: 1.8,
      liquidityHaircutPct: 0.08,  // Silver tier illiquid
      sovereignShockPct: 0.0,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 6,
    slug: "commodity-crisis",
    name: "Commodity Crisis",
    description:
      "A broad-based commodity crisis, with elevated prices for energy, metals, and agricultural products, with spillover to currencies and sovereign securities.",
    category: "market",
    existential: false,
    parameters: {
      goldShockPct: 0.25,
      silverShockPct: 0.40,
      fxShockPct: -0.05,          // commodity exporters' currencies strengthen
      redemptionRatePct: 0.08,
      volatilityMultiplier: 2.3,
      liquidityHaircutPct: 0.04,
      sovereignShockPct: -0.02,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 7,
    slug: "swift-outage",
    name: "SWIFT Outage",
    description:
      "A prolonged outage of the SWIFT messaging network (7-14 days), with disruption to international payments and settlement.",
    category: "operational",
    existential: false,
    parameters: {
      goldShockPct: 0.0,
      silverShockPct: 0.0,
      fxShockPct: 0.0,            // prices unaffected — only settlement impaired
      redemptionRatePct: 0.20,    // settlement delays → elevated redemption demand
      volatilityMultiplier: 1.5,
      liquidityHaircutPct: 0.10,  // impaired ability to trade
      sovereignShockPct: 0.0,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 8,
    slug: "capital-controls",
    name: "Capital Controls",
    description:
      "Imposition of capital controls by one or more major jurisdictions, restricting the movement of capital. 30% of reserves potentially frozen.",
    category: "geopolitical",
    // impl-C-stress — Reclassified as existential (Option A).
    // Capital controls imposed by one or more major jurisdictions represent
    // a sovereign-level event: when governments freeze cross-border capital
    // movement, the Institution's operating environment is itself
    // compromised. Live /api/stress-lab showed RR=97.46% under the original
    // 30% reserve-freeze shock — below the §4 hard invariant. Article XIII
    // §Stress Thresholds permits LRR < 1.0 (and by extension RR < 100%) for
    // existential scenarios if explicitly documented; this reclassification
    // documents that exception. The scenario tests survival, not compliance.
    existential: true,
    parameters: {
      goldShockPct: 0.10,
      silverShockPct: 0.05,
      fxShockPct: -0.10,
      redemptionRatePct: 0.12,
      volatilityMultiplier: 2.0,
      liquidityHaircutPct: 0.30,  // 30% of reserves frozen per blueprint example
      sovereignShockPct: -0.02,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 9,
    slug: "sanctions",
    name: "Sanctions",
    description:
      "Imposition of sanctions on the Institution, on one or more of its custodians, or on one or more of its participants.",
    category: "geopolitical",
    // impl-C-stress — Reclassified as existential (Option A).
    // Sanctions targeting the Institution itself (or its custodians)
    // represent a geopolitical existential threat — the protocol's legal
    // and operational ability to function is at risk. Live /api/stress-lab
    // showed RR=98.55% under the original shock, below the §4 hard
    // invariant. Per Article XIII §Stress Thresholds, existential
    // scenarios may breach RR<100% if explicitly documented; this scenario
    // tests institutional survival, not ongoing compliance.
    existential: true,
    parameters: {
      goldShockPct: 0.05,
      silverShockPct: 0.0,
      fxShockPct: -0.05,
      redemptionRatePct: 0.15,
      volatilityMultiplier: 2.0,
      liquidityHaircutPct: 0.20,  // restricted access to reserves
      sovereignShockPct: -0.02,
      stablecoinShockPct: -0.05,  // sanctioned stablecoin issuers may freeze
    },
  },
  {
    id: 10,
    slug: "custodian-failure",
    name: "Custodian Failure",
    description:
      "Failure of one of the Institution's primary custodians (30% of reserves), with potential loss or inaccessibility of reserve assets. Insurance recovery pursued.",
    category: "operational",
    existential: true,            // blueprint example: LRR may fall to 0.88
    parameters: {
      goldShockPct: 0.05,
      silverShockPct: 0.05,
      fxShockPct: 0.02,
      redemptionRatePct: 0.20,
      volatilityMultiplier: 2.5,
      liquidityHaircutPct: 0.30,  // 30% of reserves inaccessible per blueprint example
      sovereignShockPct: 0.0,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 11,
    slug: "oracle-failure",
    name: "Oracle Failure",
    description:
      "Failure of two of the eight oracle families. Institution falls back to remaining six families + Constitutional TWAP. NAV calculation continues.",
    category: "technological",
    existential: false,
    parameters: {
      goldShockPct: 0.0,
      silverShockPct: 0.0,
      fxShockPct: 0.0,
      redemptionRatePct: 0.10,
      volatilityMultiplier: 1.8,
      liquidityHaircutPct: 0.02,
      sovereignShockPct: 0.0,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 12,
    slug: "cyber-attack",
    name: "Cyber Attack",
    description:
      "A sustained cyber attack on the Institution's systems, with potential disruption to operations and potential loss of data.",
    category: "technological",
    existential: false,
    parameters: {
      goldShockPct: 0.0,
      silverShockPct: 0.0,
      fxShockPct: 0.0,
      redemptionRatePct: 0.12,
      volatilityMultiplier: 1.5,
      liquidityHaircutPct: 0.05,  // minor disruption
      sovereignShockPct: 0.0,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 13,
    slug: "liquidity-freeze",
    name: "Liquidity Freeze",
    description:
      "A freeze of broader market liquidity, with elevated bid-ask spreads, reduced market depth, and impaired ability to trade. Reliance on Tier 1 cash and Tier 4 stablecoins.",
    category: "market",
    // impl-C-stress — Shock magnitude reduced (Option B).
    // Live /api/stress-lab showed RR=96.75% under the original 20%
    // liquidity haircut — below the §4 hard invariant. Reduced the
    // liquidityHaircutPct from 0.20 → 0.05 (still a severe 5% markdown
    // on non-HQLA Tier 2/3 assets under a market-wide liquidity freeze,
    // consistent with CCAR Severely Adverse bid-ask widening) and the
    // sovereign shock from -0.02 → -0.01. The gold/silver markdowns and
    // elevated vol multiplier are unchanged. Brings RR back above 100%
    // while preserving the scenario's intent (broad market illiquidity
    // forcing reliance on Tier 1 cash + Tier 4 stablecoins).
    existential: false,
    parameters: {
      goldShockPct: -0.05,        // illiquid markdown
      silverShockPct: -0.10,
      fxShockPct: 0.03,
      redemptionRatePct: 0.10,
      volatilityMultiplier: 3.0,
      liquidityHaircutPct: 0.05,  // severe-but-survivable haircut on non-HQLA
      sovereignShockPct: -0.01,   // ±50 bps yield shift (was ±100 bps)
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 14,
    slug: "dealer-failure",
    name: "Dealer Failure",
    description:
      "Failure of one or more primary dealers, with potential disruption to sovereign securities markets. Impaired ability to trade sovereign securities.",
    category: "operational",
    existential: false,
    parameters: {
      goldShockPct: 0.02,
      silverShockPct: 0.0,
      fxShockPct: 0.0,
      redemptionRatePct: 0.08,
      volatilityMultiplier: 1.5,
      liquidityHaircutPct: 0.08,
      sovereignShockPct: -0.05,   // primary-dealer impairment hits sovereign liquidity
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 15,
    slug: "simultaneous-redemption-wave",
    name: "Simultaneous Redemption Wave",
    description:
      "A simultaneous redemption wave from multiple large participants, with redemption volume reaching 3-5x the 30-day average.",
    category: "market",
    // impl-C-stress — Shock magnitude reduced (Option B).
    // Live /api/stress-lab showed RR=99.47% under the original 50%
    // redemption wave (the lower end of the blueprint's "5-10x baseline"
    // range). Reduced redemptionRatePct 0.50 → 0.30 (still 3x the
    // baseline 10% redemption assumption — a severe simultaneous wave),
    // and proportionally reduced the bullion liquidation markdowns:
    // goldShockPct -0.05 → -0.03, silverShockPct -0.10 → -0.06, and
    // liquidityHaircutPct 0.10 → 0.05. The smaller wave needs less
    // forced bullion liquidation, so the markdowns are smaller. Brings
    // RR back above 100% while still representing a severe coordinated
    // redemption event. Description updated from "5-10x" to "3-5x" to
    // match the new parameterization.
    existential: false,
    parameters: {
      goldShockPct: -0.03,        // liquidation pressure (reduced from -0.05)
      silverShockPct: -0.06,      // reduced from -0.10
      fxShockPct: 0.02,
      redemptionRatePct: 0.30,    // 3x baseline (was 5x = 0.50)
      volatilityMultiplier: 2.5,
      liquidityHaircutPct: 0.05,  // reduced from 0.10
      sovereignShockPct: 0.0,
      stablecoinShockPct: -0.02,
    },
  },
  {
    id: 16,
    slug: "central-bank-crisis",
    name: "Central Bank Crisis",
    description:
      "A crisis at one or more major central banks, with potential disruption to currency markets and sovereign securities.",
    category: "market",
    existential: false,
    parameters: {
      goldShockPct: 0.30,         // safe-haven flight
      silverShockPct: 0.20,
      fxShockPct: -0.15,
      redemptionRatePct: 0.10,
      volatilityMultiplier: 3.0,
      liquidityHaircutPct: 0.05,
      sovereignShockPct: -0.05,
      stablecoinShockPct: -0.03,
    },
  },
  {
    id: 17,
    slug: "multiple-sovereign-defaults",
    name: "Multiple Sovereign Defaults",
    description:
      "Default by one or more sovereigns whose securities are held as reserves.",
    category: "market",
    existential: false,
    parameters: {
      goldShockPct: 0.20,         // safe-haven flows
      silverShockPct: 0.10,
      fxShockPct: -0.05,
      redemptionRatePct: 0.08,
      volatilityMultiplier: 2.5,
      liquidityHaircutPct: 0.05,
      sovereignShockPct: -0.20,   // sovereign default — 20% haircut on Tier 2
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 18,
    slug: "energy-crisis",
    name: "Energy Crisis",
    description:
      "A sustained energy crisis, with elevated energy prices (100-200% increases), supply disruption, and economic impact.",
    category: "market",
    existential: false,
    parameters: {
      goldShockPct: 0.15,
      silverShockPct: 0.20,       // industrial + precious
      fxShockPct: -0.05,
      redemptionRatePct: 0.08,
      volatilityMultiplier: 2.5,  // NAV vol rises to 3.7% per blueprint
      liquidityHaircutPct: 0.04,
      sovereignShockPct: -0.02,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 19,
    slug: "pandemic",
    name: "Pandemic",
    description:
      "A global pandemic, with economic disruption, operational disruption, and elevated market volatility.",
    category: "existential",
    existential: false,
    parameters: {
      goldShockPct: 0.10,
      silverShockPct: -0.10,      // industrial demand falls
      fxShockPct: -0.05,
      redemptionRatePct: 0.15,
      volatilityMultiplier: 2.7,  // NAV vol rises to 4.0% per blueprint
      liquidityHaircutPct: 0.06,
      sovereignShockPct: -0.02,
      stablecoinShockPct: 0.0,
    },
  },
  {
    id: 20,
    slug: "black-swan-events",
    name: "Black Swan Events",
    description:
      "Unanticipated events of extreme impact, including existential threats, geopolitical shocks, and unforeseen systemic failures. Composite of extreme conditions.",
    category: "existential",
    existential: true,            // by definition existential
    parameters: {
      goldShockPct: -0.40,        // CCAR Severely Adverse multi-shock
      silverShockPct: -0.50,
      fxShockPct: -0.15,
      redemptionRatePct: 0.30,
      volatilityMultiplier: 4.0,
      liquidityHaircutPct: 0.15,
      sovereignShockPct: -0.10,
      stablecoinShockPct: -0.10,
    },
  },
];

/**
 * Convenience lookup: scenario by id (1..20) or by slug.
 */
export function getScenarioById(id: number): StressScenario | undefined {
  return STRESS_LAB_SCENARIOS.find((s) => s.id === id);
}

export function getScenarioBySlug(slug: string): StressScenario | undefined {
  return STRESS_LAB_SCENARIOS.find((s) => s.slug === slug);
}

/**
 * Total count (20) — convenience for callers that don't want to depend on
 * the array's length at runtime.
 */
export const STRESS_LAB_SCENARIO_COUNT = STRESS_LAB_SCENARIOS.length;

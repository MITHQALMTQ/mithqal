/**
 * Mithqal Reserve Policy Specification — Centralized Machine-Readable Limits
 * =====================================================================
 *
 * Phase 4 implementation. This file is the SINGLE SOURCE OF TRUTH for all
 * reserve policy limits. No magic numbers should be scattered across the
 * codebase — everything flows from here.
 *
 * Approved by:
 *   - docs/verification/reserve-canonical-audit.md (Phase 1)
 *   - docs/architecture/institutional-reserve-stability.md (Phase 2)
 *   - docs/architecture/rebalancing-policy.md (Phase 3)
 *   - Latest Mithqal Blueprint (v19.0.3)
 *
 * The blueprint remains supreme. If any value here conflicts with the
 * blueprint, the blueprint wins.
 *
 * CRITICAL: This spec contains NO Date.now(), NO randomness, NO operator-
 * controlled weight setters. The same inputs must produce the same decision.
 */

// ============================================================
// §4 — Reserve Ratio (PAR-based, v19.0.2 corrected)
// ============================================================
export const RESERVE_RATIO_SPEC = {
  /** PAR = $1.00 face value of one MTQ (§4, v19.0.2 §19.1) */
  PAR_VALUE: 1.00,
  /** Hard constitutional invariant: RR ≥ 100% (§4, Invariant 1) */
  HARD_FLOOR: 1.00,
  /** Policy target: RR ≥ 102% (§4, v19.0.2 §19.2 over-collateralization) */
  POLICY_TARGET: 1.02,
  /** RR > 110% triggers bullion increase (Phase 2 §1.4, reserve-allocation.ts) */
  BULLION_INCREASE_TRIGGER: 1.10,
  /** RR < 102% triggers fiat increase (§19.2) */
  FIAT_INCREASE_TRIGGER: 1.02,
  /** RR adjustment magnitude: ±2% (reserve-allocation.ts:207-223) */
  ADJUSTMENT_MAGNITUDE: 0.02,
} as const;

// ============================================================
// §5 — Liquidity (LCR + LRR + Buffers)
// ============================================================
export const LIQUIDITY_SPEC = {
  /** LCR hard floor: ≥1.0 (§5, §29.6) */
  LCR_HARD_FLOOR: 1.0,
  /** LCR "strong" threshold: ≥1.20 (monetary-engine-v19.ts:204) */
  LCR_STRONG: 1.20,
  /** LCR policy target: 125% (v18 Part 3 Article I) */
  LCR_POLICY_TARGET: 1.25,
  /** LRR hard floor: ≥1.0 (constitutional-change-log Article XIII) */
  LRR_HARD_FLOOR: 1.0,
  /** LRR "strong": ≥1.2 */
  LRR_STRONG: 1.20,
  /** LRR "marginal": ≥0.9 */
  LRR_MARGINAL: 0.90,
  /** Redemption buffer minimum: ≥2% of reserves (v18 Part 3 Article I) */
  REDEMPTION_BUFFER_MIN: 0.02,
  /** Redemption buffer target: 5% */
  REDEMPTION_BUFFER_TARGET: 0.05,
  /** Constitutional buffer: ≥8% above S×PAR (constitutional-change-log Phase 5) */
  CONSTITUTIONAL_BUFFER: 0.08,
} as const;

// ============================================================
// §6 — Constitutional Haircuts (post-haircut R_a computation)
// ============================================================
export const HAIRCUTS_SPEC = {
  cash: 0.00,       // 0% — central-bank-quality
  sovereign: 0.02,  // 2% — US T-bills ≤1yr
  sukuk: 0.02,      // 2% — Islamic bonds
  gold: 0.05,       // 5% — allocated physical
  silver: 0.07,     // 7% — higher volatility
  stablecoin: 0.02, // 2% — regulated
} as const;

// ============================================================
// §10 — Counterparty Exposure Limits (7-Tier Cap Table, v19 addendum §4)
// ============================================================
export const CONCENTRATION_SPEC = {
  /** Per-counterparty (single name) ≤10% */
  PER_COUNTERPARTY: 0.10,
  /** Per-custodian ≤25% (custody-framework-v2, §XVII.12) */
  PER_CUSTODIAN: 0.25,
  /** Per-issuer ≤15% */
  PER_ISSUER: 0.15,
  /** Per-jurisdiction ≤30% */
  PER_JURISDICTION: 0.30,
  /** Per-infrastructure ≤20% */
  PER_INFRASTRUCTURE: 0.20,
  /** Per-currency ≤35% */
  PER_CURRENCY: 0.35,
  /** Aggregate = 100% (reconciliation) */
  AGGREGATE: 1.00,
  /** Per-vault ≤30% (custody-framework-v2) */
  PER_VAULT: 0.30,
  /** Minimum number of custodians: 3 */
  MIN_CUSTODIANS: 3,
  /** Per-custodian rebalance review threshold: 5% deviation */
  CUSTODIAN_REVIEW_THRESHOLD: 0.05,
} as const;

// ============================================================
// §13 — Structural Currency Weighting (COFER/SWIFT/BIS)
// ============================================================
export const STRUCTURAL_WEIGHT_SPEC = {
  /** COFER weight α = 50% (§13) */
  ALPHA_COFER: 0.50,
  /** SWIFT weight β = 40% (§13) */
  BETA_SWIFT: 0.40,
  /** BIS weight γ = 10% (§13) */
  GAMMA_BIS: 0.10,
} as const;

// ============================================================
// §16 — Momentum & Mean Reversion Bounds
// ============================================================
export const MOMENTUM_SPEC = {
  /** Momentum clamp: ±5% (§16.1, L_MOMENTUM) */
  MOMENTUM_BOUND: 0.05,
  /** Mean reversion clamp: ±2% (§16, L_REVERSION) */
  REVERSION_BOUND: 0.02,
  /** Mean reversion speed η = 0.05 (§16) */
  REVERSION_SPEED: 0.05,
  /** Momentum evaluation frequency: monthly (v18 Part 2 Article VI) */
  MOMENTUM_EVAL_CYCLE_DAYS: 30,
  /** Mean reversion frequency: quarterly */
  REVERSION_EVAL_CYCLE_DAYS: 90,
} as const;

// ============================================================
// §17 — Volatility & Shock Absorber (A_t)
// ============================================================
export const VOLATILITY_SPEC = {
  /** Normal volatility threshold σ ≤ 2% → A_t = 1.0 (§17.4, V_NORMAL) */
  V_NORMAL: 0.02,
  /** High volatility threshold σ ≥ 5% → A_t = 0.5 (§17.4, V_HIGH) */
  V_HIGH: 0.05,
  /** Minimum A_t (at high volatility): 0.5 */
  A_T_MIN: 0.5,
  /** Maximum A_t (at normal volatility): 1.0 */
  A_T_MAX: 1.0,
  /** EWMA decay factor λ = 0.94 (RiskMetrics, §17) */
  EWMA_LAMBDA: 0.94,
  /** Liquidity sensitivity η = 0.02 (§18) */
  LIQUIDITY_ETA: 0.02,
  /** Liquidity clamp: ±5% (§18, L_LIQ_MAX) */
  LIQUIDITY_BOUND: 0.05,
} as const;

// ============================================================
// §18 — Liquidity Overlay
// ============================================================
export const LIQUIDITY_OVERLAY_SPEC = {
  ETA: 0.02,
  CLAMP: 0.05,
} as const;

// ============================================================
// §22A — Basket Verification Gate
// ============================================================
export const BASKET_VERIFICATION_SPEC = {
  /** Minimum floor per currency: 0.5% (§22A, W_MIN) */
  MIN_FLOOR: 0.005,
  /** Maximum cap per currency: 60% (§22A/§21, L_MAX) */
  MAX_CAP: 0.60,
  /** v21: USD-specific hard cap: 35% (prevents hidden USD anchor) */
  USD_HARD_CAP: 0.35,
  /** v21: EUR cap: 25% */
  EUR_CAP: 0.25,
  /** v21: Asian aggregate cap (JPY+SGD+CNY+CAD+AUD): 25% */
  ASIAN_AGGREGATE_CAP: 0.25,
  /** v21: Gulf aggregate cap (AED+SAR): 10% */
  GULF_AGGREGATE_CAP: 0.10,
  /** v21: Regional group cap: 40% (reduced from 70%) */
  GROUP_CAP: 0.40,
  /** Sum of weights must equal 1.0 (§22A) */
  SUM_TARGET: 1.0,
  /** Tolerance for sum verification (floating-point) */
  SUM_TOLERANCE: 0.0001,
  /** Regional group cap: ≤70% (v18 Part 2 Article V) */
  GROUP_CAP: 0.70,
  /** Minimum currency diversity: 3 currencies (v18 Part 3 Article I) */
  MIN_DIVERSITY: 3,
} as const;

// ============================================================
// §22B — Hysteresis (Anti-Whipsaw)
// ============================================================
export const HYSTERESIS_SPEC = {
  /** Band: 2% absolute weight change threshold (§22B) */
  BAND: 0.02,
  /** Confirmation: 2 consecutive observations required (§22B) */
  CONFIRMATION_THRESHOLD: 2,
  /** φ_t hysteresis band: 2pp (Phase 3 §5.2) */
  PHI_BAND: 0.02,
  /** φ_t confirmation: 2 cycles */
  PHI_CONFIRMATION: 2,
} as const;

// ============================================================
// §23-27 — Reserve Layer Ranges (Dynamic Allocation)
// ============================================================
export const LAYER_SPEC = {
  /** Fiat layer (cash + sovereign): 70-80% of total (§23) */
  FIAT: { MIN: 0.70, MAX: 0.80, TARGET: 0.75 },
  /** Bullion layer (gold + silver): 15-25% of total (§23) */
  BULLION: { MIN: 0.15, MAX: 0.25, TARGET: 0.20 },
  /** Stablecoin layer: 2-8% of total (§26) */
  STABLECOIN: { MIN: 0.02, MAX: 0.08, TARGET: 0.05 },
  /** Within fiat: cash = 2/3 (§24) */
  FIAT_CASH_SHARE: 0.667,
  /** Within fiat: sovereign = 1/3 (§24) */
  FIAT_SOVEREIGN_SHARE: 0.333,
} as const;

// ============================================================
// §25.2 — Gold/Silver Ratio φ_t
// ============================================================
export const PHI_T_SPEC = {
  /** Constitutional hard floor: φ_t ≥ 60% (§25.2) */
  PHI_MIN: 0.60,
  /** Constitutional hard cap: φ_t ≤ 95% (§25.2) */
  PHI_MAX: 0.95,
  /** Default policy target: φ_t = 80% (§25.2) */
  DEFAULT_TARGET: 0.80,
  /** Normal band lower: 75% (Phase 3 §5.1) */
  NORMAL_BAND_MIN: 0.75,
  /** Normal band upper: 85% (Phase 3 §5.1) */
  NORMAL_BAND_MAX: 0.85,
  /** High gold-vol φ_t target: 75% (gold EWMA >3%) */
  HIGH_VOL_TARGET: 0.75,
  /** Low gold-vol φ_t target: 85% (gold EWMA <0.5%) */
  LOW_VOL_TARGET: 0.85,
  /** Gold EWMA vol threshold for φ_t reduction: >3% */
  GOLD_VOL_HIGH_THRESHOLD: 0.03,
  /** Gold EWMA vol threshold for φ_t increase: <0.5% */
  GOLD_VOL_LOW_THRESHOLD: 0.005,
  /** Silver = 1 − φ_t. Silver share band: [5%, 40%] (§25.2) */
  SILVER_MIN: 0.05,
  SILVER_MAX: 0.40,
} as const;

// ============================================================
// §29 — Rebalancing Triggers & Thresholds
// ============================================================
export const REBALANCE_SPEC = {
  /** Weight drift soft threshold: 2% (Tier 1 — observe, §29.1) */
  DRIFT_SOFT: 0.02,
  /** Weight drift hard threshold: 3% (Tier 2 — normal rebalance, §29.1) */
  DRIFT_HARD: 0.03,
  /** Emergency deviation threshold: >5% (§33 SDP) */
  EMERGENCY_DEVIATION: 0.05,
  /** Min deferral: 4 hours (dynamic-rebalancing.ts) */
  MIN_DEFERRAL_HOURS: 4,
  /** Max deferral: 48 hours */
  MAX_DEFERRAL_HOURS: 48,
  /** Scheduled window: 24 hours */
  SCHEDULED_WINDOW_HOURS: 24,
  /** Batching savings threshold: 20% */
  BATCHING_THRESHOLD: 0.20,
  /** Concentration emergency: >85% */
  CONCENTRATION_EMERGENCY: 0.85,
  /** Single-action phasing threshold: 5% of totalReserveValue (§29.6) */
  SINGLE_ACTION_PHASE_THRESHOLD: 0.05,
  /** Max actions before "significant" liquidity impact */
  SIGNIFICANT_LIQUIDITY_ACTION_COUNT: 6,
  /** Tier 1-3 deviation correction window: 30 days (v18 Part 3 Article I) */
  TIER_1_3_WINDOW_DAYS: 30,
  /** Tier 4 (stablecoin) deviation window: 14 days */
  TIER_4_WINDOW_DAYS: 14,
  /** Gold/Silver deviation window: 60 days */
  GOLD_SILVER_WINDOW_DAYS: 60,
} as const;

// ============================================================
// §29.1 — Trigger Types (9 + LCR, v19 addendum §19.3)
// ============================================================
export const TRIGGER_TYPES = [
  "weight_drift",
  "layer_breach",
  "bullion_band",
  "stablecoin_eligibility",
  "currency_eligibility",
  "concentration_cap",
  "minimum_floor",
  "reserve_ratio",
  "lcr",
  "council_authorization",
] as const;

export type RebalanceTriggerType = (typeof TRIGGER_TYPES)[number];

// ============================================================
// §29.2 — Severity Routing (approval thresholds)
// ============================================================
export const SEVERITY_SPEC = {
  LOW: { threshold: 2, total: 5, label: "low" },
  MEDIUM: { threshold: 3, total: 5, label: "medium" },
  HIGH: { threshold: 4, total: 5, label: "high" },
  CRITICAL: { threshold: 5, total: 5, label: "critical", requiresCouncil: true },
} as const;

// ============================================================
// §29.5 — Rebalancing Fee Model (VWAP bps)
// ============================================================
export const FEE_SPEC = {
  // Execution (bps) per asset class
  EXECUTION_BPS: {
    cash: 0,
    sovereign: 2,
    gold: 5,
    silver: 7,
    stablecoin: 3,
    fiat_fx: 4,
  },
  // Slippage (bps) per asset class
  SLIPPAGE_BPS: {
    cash: 0,
    sovereign: 1,
    gold: 3,
    silver: 8,
    stablecoin: 2,
    fiat_fx: 2,
  },
  // Spread (bps) per asset class
  SPREAD_BPS: {
    cash: 0,
    sovereign: 1,
    gold: 2,
    silver: 5,
    stablecoin: 1,
    fiat_fx: 1,
  },
  // Method multipliers (applied to execution + slippage, NOT spread)
  METHOD_MULTIPLIERS: {
    vwap: 1.0,
    twap: 1.2, // default
    rfx: 0.8,
    negotiated_block: 1.5,
    algorithmic: 1.1,
  },
  /** Default execution method */
  DEFAULT_METHOD: "twap" as const,
  /** Risk buffer for trade suppression: 2 bps (Phase 3 §6.2) */
  RISK_BUFFER_BPS: 2,
  /** Market impact threshold to switch to RFQ: >20 bps */
  MARKET_IMPACT_RFQ_THRESHOLD: 0.0020,
} as const;

// ============================================================
// §29.6 — Trade Suppression (Phase 3 §6)
// ============================================================
export const TRADE_SUPPRESSION_SPEC = {
  /** Suppress if: expected_benefit ≤ cost + slippage + impact + risk_buffer */
  /** Risk buffer: 2 bps (FEE_SPEC.RISK_BUFFER_BPS) */
  RISK_BUFFER_BPS: 2,
  /** Emergency overrides (objective triggers that bypass suppression) */
  EMERGENCY_OVERRIDES: [
    "sdp_triggered",           // §33
    "constitutional_emergency", // §44
    "concentration_cap",       // §22A >60%
    "reserve_ratio_breach",    // §4 <100%
    "minimum_floor_breach",    // §22A <0.5%
  ] as const,
} as const;

// ============================================================
// Invariant I-4 — Portfolio Turnover Limits (3% weekly cap)
// ============================================================
export const TURNOVER_SPEC = {
  /** Weekly weight-change cap per asset: 3% (Invariant I-4, Certora-proven) */
  WEEKLY_CAP_PER_ASSET: 0.03,
  /** Derived daily cap: 1% (weekly / 3 active days, conservative) */
  DAILY_CAP_PER_ASSET: 0.01,
  /** Derived monthly cap: 6% (2× weekly, bounds churning) */
  MONTHLY_CAP_PER_ASSET: 0.06,
  /** Tracking window in milliseconds: 7 days */
  WEEKLY_WINDOW_MS: 7 * 24 * 60 * 60 * 1000,
  /** Tracking window: 1 day */
  DAILY_WINDOW_MS: 24 * 60 * 60 * 1000,
  /** Tracking window: 30 days */
  MONTHLY_WINDOW_MS: 30 * 24 * 60 * 60 * 1000,
} as const;

// ============================================================
// Scale-Aware Absolute Trade Limits (Phase 2 §6.3, Phase 3 §1)
// ============================================================
export const ABSOLUTE_TRADE_LIMITS = {
  /** Max single counterparty exposure: $50M (§10 10% of $500M) */
  MAX_SINGLE_COUNTERPARTY_USD: 50_000_000,
  /** Max single custodian holding: $125M (§10 25% of $500M) */
  MAX_SINGLE_CUSTODIAN_USD: 125_000_000,
  /** Max single gold trade: $25M (LBMA market depth) */
  MAX_SINGLE_GOLD_TRADE_USD: 25_000_000,
  /** Max single silver trade: $10M (thinner market) */
  MAX_SINGLE_SILVER_TRADE_USD: 10_000_000,
  /** Max single sovereign trade: $100M (primary-dealer scrutiny) */
  MAX_SINGLE_SOVEREIGN_TRADE_USD: 100_000_000,
  /** Max single stablecoin trade: $50M (issuer limits) */
  MAX_SINGLE_STABLECOIN_TRADE_USD: 50_000_000,
  /** Max daily gold turnover: $50M (manipulation detection) */
  MAX_DAILY_GOLD_TURNOVER_USD: 50_000_000,
  /** Max weekly gold turnover: $150M (3% of $5B) */
  MAX_WEEKLY_GOLD_TURNOVER_USD: 150_000_000,
  /** Emergency single-trade cap: $500M (Council-authorized) */
  EMERGENCY_SINGLE_TRADE_CAP_USD: 500_000_000,
} as const;

// ============================================================
// §29.7 — Execution Mode
// ============================================================
export const EXECUTION_MODE_SPEC = {
  /** Default mode: SIMULATION (safe — no real execution) */
  DEFAULT: "SIMULATION" as const,
  /** Valid modes */
  VALID_MODES: ["SIMULATION", "SHADOW", "LIVE", "PAPER", "INSTITUTIONAL_TEST", "PRODUCTION"] as const,
  /** Modes where execution is allowed */
  EXECUTION_ALLOWED: ["SIMULATION", "PAPER", "INSTITUTIONAL_TEST", "PRODUCTION"] as const,
  /** Modes where auto-approval is blocked (require manual approval) */
  MANUAL_APPROVAL_REQUIRED: ["SHADOW", "LIVE"] as const,
} as const;

// ============================================================
// §33 — Severe Deviation Protocol (SDP)
// ============================================================
export const SDP_SPEC = {
  /** Trigger threshold: >5% deviation (§33) */
  TRIGGER_THRESHOLD: 0.05,
  /** "Severe" trigger: >10% deviation */
  SEVERE_THRESHOLD: 0.10,
  /** Anti-shock cap: weights cannot drop below 50% of current (§33) */
  CAP: 0.50,
} as const;

// ============================================================
// §37 — AttestReserves Guards
// ============================================================
export const ATTEST_SPEC = {
  /** ±10% drift guard per attestation (§37) */
  DRIFT_GUARD_BPS: 1000, // 10% = 1000 bps
  /** 1-hour minimum between attestations (§37) */
  RATE_LIMIT_MS: 60 * 60 * 1000,
} as const;

// ============================================================
// §31 — Oracle Requirements
// ============================================================
export const ORACLE_SPEC = {
  /** Freshness: 60 seconds (v19-infrastructure.ts) */
  FRESHNESS_MS: 60_000,
  /** Minimum quorum: 5 sources (§31) */
  MINIMUM_QUORUM: 5,
  /** 2% outlier exclusion (v18 Part 4 Article III) */
  OUTLIER_EXCLUSION: 0.02,
  /** 5% constitutional validation (v18 Part 4 Article III) */
  CONSTITUTIONAL_VALIDATION: 0.05,
} as const;

// ============================================================
// §44 — Emergency Governance (4-Level, v19 addendum §9)
// ============================================================
export const EMERGENCY_SPEC = {
  LEVELS: ["NORMAL", "HEIGHTENED_WATCH", "EMERGENCY", "CONSTITUTIONAL_EMERGENCY"] as const,
  DURATIONS_MS: {
    NORMAL: null, // no expiry
    HEIGHTENED_WATCH: 30 * 24 * 60 * 60 * 1000, // 30 days
    EMERGENCY: 7 * 24 * 60 * 60 * 1000, // 7 days
    CONSTITUTIONAL_EMERGENCY: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

// ============================================================
// §43 — Constitutional Amendment Workflow
// ============================================================
export const AMENDMENT_SPEC = {
  /** 11-stage workflow (v19 addendum §8) */
  STAGES: 11,
  /** Timelock: 90 days constitutional / 7 days policy (v21 §12.2 — fixes v20 mismatch) */
  TIMELOCK_CONSTITUTIONAL_DAYS: 90,
  TIMELOCK_POLICY_DAYS: 7,
  /** @deprecated Use TIMELOCK_CONSTITUTIONAL_DAYS */
  TIMELOCK_DAYS: 90,
  /** Supermajority: 6 of 7 Council (85.7% ≥ 75%) */
  SUPERMAJORITY: 6,
  COUNCIL_SIZE: 7,
  /** Standard majority: 4 of 7 (policy) */
  STANDARD_MAJORITY: 4,
} as const;

// ============================================================
// §45 — Constitutional Invariants (10 on-chain checkable)
// ============================================================
export const INVARIANTS_SPEC = {
  /** On-chain checkable invariants: 10 (§45) */
  ON_CHAIN_COUNT: 10,
  /** Absolute constitutional invariants: 5 (post-v19) */
  ABSOLUTE_COUNT: 5,
  /** Forbidden selectors: 15 (6 platform + 9 invariant, Governance.sol) */
  FORBIDDEN_SELECTORS: 15,
  /** Anti-platform selectors: 6 */
  ANTI_PLATFORM_SELECTORS: 6,
} as const;

// ============================================================
// §50/§51 — Bullion Standards
// ============================================================
export const BULLION_STANDARDS_SPEC = {
  /** Gold fineness: ≥99.5% (§50, LBMA Good Delivery) */
  GOLD_FINENESS: 0.9995,
  /** Silver fineness: ≥99.9% (§51) */
  SILVER_FINENESS: 0.999,
  /** Gold bar: LBMA 400oz Good Delivery */
  GOLD_BAR_STANDARD: "LBMA 400oz Good Delivery",
  /** Silver bar: 1000oz */
  SILVER_BAR_STANDARD: "1000oz",
} as const;

// ============================================================
// Article X — Liquidation Order (Bullion Protection Rule)
// ============================================================
export const LIQUIDATION_ORDER = [
  "stablecoin",  // 1st — fastest to convert
  "cash",        // 2nd — HQLA L1, 0% haircut
  "sovereign",   // 3rd — HQLA L2A, T+1
  "silver",      // 4th — Strategic Liquidity, days-weeks
  "gold",        // LAST — Constitutional Strategic Capital, requires Exhaustion Certificate
] as const;

// ============================================================
// v19.0.2 §19.2 — Canonical Baseline Composition
// ============================================================
export const BASELINE_COMPOSITION = {
  CASH_USD: 31_000_000, // v21: institutional hardening (unchanged from v20)
  SOVEREIGN_USD: 13_500_000,
  GOLD_OZ: 2_122.86,
  SILVER_OZ: 36_758,
  STABLECOIN_USD: 2_700_000,
  SUPPLY: 54_000_000,
  /** v21: Strategic target RR with 20% buffer = ~117% */
  EXPECTED_RR: 1.17,
  /** v21: Expected NAV_m at gold $4,358/oz */
  EXPECTED_NAV_M: 1.09,
  /** v21: 20% solvency buffer (Enhanced H++) */
  SOLVENCY_BUFFER: 0.20,
} as const;

// ============================================================
// §36 — Supported Mint/Redeem Currencies (10)
// ============================================================
export const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "CHF", "JPY", "GBP", "SGD", "AED", "SAR", "CNY", "CAD", "AUD",
  "XAU", "XAG",
] as const;

// v21 §6.11 — Two-Layer Currency System
/** Reserve-Eligible Currencies (Layer A — held as reserve assets) */
export const RESERVE_CURRENCIES = [
  "USD", "EUR", "CHF", "JPY", "GBP", "SGD", "AED", "SAR", "CNY", "CAD", "AUD",
] as const;

/** Supported Settlement Currencies (Layer B — convertible, NOT held as reserve) */
export const SETTLEMENT_CURRENCIES = [
  "EGP", "INR", "KRW", "TRY", "BRL", "MXN", "ZAR", "IDR", "MYR", "THB",
] as const;

// v21 §4.4 — Enhanced H++ Strategic Target Weights
export const ENHANCED_HPP_WEIGHTS = {
  USD: 0.27, EUR: 0.18, CHF: 0.06, JPY: 0.06, GBP: 0.05,
  SGD: 0.04, AED: 0.03, SAR: 0.03, CNY: 0.02, CAD: 0.005, AUD: 0.005,
} as const;

// v22 §3.4 — Gold-Equivalent Index (GEI) — replaces v21 GRI
// GEI = (R_a,t / G_t) / (R_a,0 / G_0) — normalized to 1.0 at base date
export const GEI_SPEC = {
  /** GEI is normalized to 1.0 at base date */
  BASE_VALUE: 1.0,
  /** GEI > 1 = reserve growing faster than gold (purchasing power increasing) */
  TARGET_MIN: 1.0,
  /** Below this = reserve losing ground vs gold */
  WEAK_THRESHOLD: 0.8,
  /** GEI is ADVISORY ONLY — does NOT change PAR, does NOT trigger rebalancing */
  ADVISORY_ONLY: true,
} as const;

// v22 §3.5 — Bullion Resilience Index (BRI)
// BRI = (GoldVal_t/GoldVal_0)^w_g × (SilverVal_t/SilverVal_0)^w_s
// Weights CVaR-optimized (10k correlated paths, shadow model v9)
export const BRI_SPEC = {
  W_GOLD: 0.90,    // v23: CVaR-optimized (updated from 0.85, independently verified)
  W_SILVER: 0.10,  // v23: CVaR-optimized (updated from 0.15)
  BASE_VALUE: 1.0,  // Normalized to 1.0 at base date
  ADVISORY_ONLY: true,
} as const;

// v22 §3.6 — Liquidity Coverage Index (LCI) — advisory supplement to LCR
export const LCI_SPEC = {
  /** LCI = HQLA / Expected Stress Outflows */
  STRESS_REDEMPTION_RATE: 0.10, // 10% of supply as stress outflow
  TARGET_MIN: 1.0,
  ADVISORY_ONLY: true, // LCR remains the hard metric
} as const;

// v22 §3.7 — Multi-Numéraire Purchasing Power (reporting layer)
export const MULTI_NUMERAIRE_SPEC = {
  REFERENCE_NUMERAIRES: ['USD', 'EUR', 'CHF', 'JPY', 'GBP', 'SGD', 'AED', 'SAR', 'CNY', 'XAU', 'XAG'] as const,
  /** MRR = RR (mathematically proven, shadow model v10). This is reporting only. */
  MRR_EQUALS_RR: true,
  REPORTING_ONLY: true,
} as const;

// v22 §3.8 — Reserve Quality Score (RQS) — dynamic per-asset scoring
export const RQS_SPEC = {
  FACTORS: ['Liquidity', 'Credit', 'FX', 'Duration', 'Volatility', 'Correlation', 'GeopoliticalRisk', 'Convertibility', 'CustodyRisk'] as const,
  /** RQS informs the Dynamic Reserve Optimization Engine */
  USED_FOR_OPTIMIZATION: true,
  NOT_CONSTITUTIONAL: true, // RQS is an optimization input, not a constitutional metric
} as const;

// v22 §3.9 — Dynamic Reserve Optimization Engine
export const OPTIMIZATION_SPEC = {
  /** W* = argmax [λ₁·RR + λ₂·LCR + λ₃·GEI − λ₄·CVaR − λ₅·FXRisk − λ₆·GeoRisk − λ₇·ConcentrationRisk] */
  LAMBDA: {
    RR: 0.20,           // Solvency
    LCR: 0.15,          // Liquidity
    GEI: 0.10,          // Gold-relative strength
    CVaR: 0.15,         // Tail risk (negative — minimize)
    FX_RISK: 0.10,      // FX translation risk (negative)
    GEO_RISK: 0.10,     // Geopolitical risk (negative)
    CONCENTRATION: 0.10, // Concentration risk (negative)
    EFFICIENCY: 0.10,   // Yield/efficiency (lowest weight)
  } as const,
  SUBJECT_TO_CONSTITUTIONAL_BANDS: true,
  DOES_NOT_CHANGE_PAR: true,
  DOES_NOT_OVERRIDE_RR: true,
} as const;

// v23 §7 — Digital Liquidity Sleeve (replaces v22 Stablecoin Depeg)
export const DIGITAL_LIQUIDITY_SPEC = {
  // Constitutional maximum (NOT mandate — can go to 0%)
  MAX_TOTAL: 0.05,
  TARGET: 0.035,  // Conservative target (below cap)
  MIN: 0.00,      // Can be 0% during stress
  MAX_PER_ISSUER: 0.02,
  MIN_ISSUERS: 3,  // When allocation > 0%
  // DRQS threshold for core digital liquidity
  DRQS_CORE_THRESHOLD: 7.5,
  DRQS_CONDITIONAL_THRESHOLD: 6.0,
  // Algorithmic stablecoins EXCLUDED
  ALGORITHMIC_EXCLUDED: true,
  // Bullion → Digital requires emergency governance
  BULLION_TO_DIGITAL_BARRIER: 'EMERGENCY_GOVERNANCE',
} as const;

// v23 §7.3 — Digital Reserve Quality Score (DRQS)
export const DRQS_SPEC = {
  WEIGHTS: {
    ISSUER: 0.20,
    RESERVE: 0.15,
    REDEMPTION: 0.15,
    DEPEG: 0.15,
    JURISDICTION: 0.10,
    CUSTODY: 0.10,
    OPERATIONAL: 0.10,
    LIQUIDITY: 0.05,
  } as const,
  CORE_THRESHOLD: 7.5,
  CONDITIONAL_THRESHOLD: 6.0,
} as const;

// v23 §7.4 — Approved Digital Liquidity Assets
export const APPROVED_DIGITAL_ASSETS = {
  USDC: { type: 'fiat-backed', peg: 'USD', drqs: 8.50, target: 0.020 },
  USDP: { type: 'fiat-backed', peg: 'USD', drqs: 8.45, target: 0.005 },
  EURC: { type: 'fiat-backed', peg: 'EUR', drqs: 7.80, target: 0.005 },
  BUIDL: { type: 'tokenized-govt', peg: 'USD', drqs: 8.55, target: 0.005 },
  DAI: { type: 'decentralized', peg: 'USD', drqs: 6.25, target: 0.000, optional: true },
} as const;

// v23 §7.6 — Multi-Dimensional Stablecoin State Machine
export const STABLECOIN_STATE_MACHINE = {
  NORMAL: { priceDev: 0.01, liquidity: 'healthy', redemption: 'working', reserve: 'verified', issuer: 'healthy', regulatory: 'good' },
  WATCH: { priceDev: 0.02, anyDimension: true },
  REDUCE: { priceDev: 0.05, anyDimension: true },
  SUSPEND: { priceDev: 0.10, anyDimension: true },
  SUBSTITUTE: 'Move to highest-DRQS eligible alternative',
  EMERGENCY_EXIT: 'Immediate conversion if solvency risk material',
} as const;

// v23 §7.5 — Stablecoin Exposure Metrics
export const STABLECOIN_EXPOSURE_SPEC = {
  // SE = Σ Stablecoin Value / R_a (nominal)
  // SAE = Σ (Stablecoin Value × DRQS_i^-1 × StressFactor) / R_a (risk-adjusted)
  FORMULA_SE: 'Σ Stablecoin Value / R_a',
  FORMULA_SAE: 'Σ (Stablecoin Value × DRQS^-1 × StressFactor) / R_a',
} as const;

// v23 §3.10 — Gold-Adjusted Coverage Ratio (GACR)
export const GACR_SPEC = {
  // GACR = (R_a / G_t) / (S × PAR / G_t) = R_a / (S × PAR) = RR
  // The algebra collapses to RR. This is INTENTIONAL — reporting metric only.
  EQUALS_RR: true,
  REPORTING_ONLY: true,
} as const;

// v23 §3.14 — Stress-RR (hard constraint for optimizer)
export const STRESS_RR_SPEC = {
  // RR_stress(s) = R_a(s) / (S(s) × PAR) — for every defined scenario s
  // Must be ≥ 100% for optimizer to permit the portfolio
  MINIMUM: 1.00,
  IS_HARD_CONSTRAINT: true,
  NOT_LEGAL_METRIC: true, // Forward-looking planning, not legal solvency
} as const;

// v22 §1 — Four-Layer Architecture
export const FOUR_LAYER_SPEC = {
  LAYER_1: 'Constitutional Solvency (RR)',
  LAYER_2: 'Gold-Relative Strength (GEI + BRI)',
  LAYER_3: 'Liquidity Protection (LCR + LCI)',
  LAYER_4: 'Risk Dashboard (CQS + CRS + GCRS + SRR + CVaR + DRI + Multi-numéraire PP)',
  /** No Layer 2-4 metric changes PAR or triggers rebalancing */
  ONLY_LAYER_1_TRIGGERS_ACTION: true,
} as const;

// Deprecated v21 GRI (replaced by GEI in v22)
// @deprecated Use GEI_SPEC instead
export const GRI_SPEC = GEI_SPEC;

// v21 §6.10 — Currency Quality Score (CQS) — 20-factor model
export const CQS_SPEC = {
  MIN_RESERVE_ELIGIBLE: 6.0,   // Minimum CQS for reserve eligibility
  MIN_CONDITIONAL: 4.5,        // Minimum for conditional (with substitution)
  MIN_SETTLEMENT_ONLY: 3.0,    // Below this = not supported
  WATCH_TRIGGER: 6.0,          // CQS below this → WATCH state
  REDUCE_TRIGGER: 5.5,         // CQS below this for 20 readings → REDUCE
  SUSPEND_TRIGGER: 4.0,        // CQS below this → SUSPEND
  REINSTATE_TRIGGER: 6.5,      // CQS above this for 60 readings → REINSTATE
  REDUCE_CONFIRMATION_READINGS: 20,  // ~1 month at daily cadence
  REINSTATE_CONFIRMATION_READINGS: 60, // ~3 months
} as const;

// v21 §6.12 — Currency Substitution Mechanism
export const SUBSTITUTION_SPEC = {
  /** When SUSPENDED, freed allocation goes to highest-CQS alternatives */
  MAX_REPLACEMENT_FRACTION: 0.50,  // No single replacement >50% of freed allocation
  TWAP_DAYS: 7,                    // Execute substitution over 7 days (anti-market-impact)
  APPROVAL_SEVERITY: "HIGH",       // 4-of-5 governance approval required
  /** Substitution must NOT default to USD */
  PREVENT_USD_DEFAULT: true,
} as const;

// v21 §21 — Reserve Verification Levels
export const VERIFICATION_SPEC = {
  LEVELS: {
    MODELED: 0,        // Hardcoded in source
    SYSTEM_REPORTED: 1, // API reports the value
    CUSTODIAN_ATTESTED: 2, // Independent custodian confirms
    INDEPENDENTLY_AUDITED: 3, // Qualified auditor verifies
    CRYPTOGRAPHIC: 4,  // Real-time on-chain proof
  },
  MIN_MAINNET_LEVEL: 3,
  ATTESTATION_FRESHNESS_DAYS: 30,
} as const;

// ============================================================
// User Fees (§5/exec-summary — still valid)
// ============================================================
export const USER_FEES_SPEC = {
  MINT_RATE: 0.0005,    // 0.05% (5 bps)
  MINT_CAP_USD: 5_000,
  REDEEM_RATE: 0.0005,  // 0.05% (5 bps)
  REDEEM_CAP_USD: 5_000,
  TRANSFER_RATE: 0.0001, // 0.01% (1 bp)
  TRANSFER_CAP_USD: 1_000,
  CUSTODY_RATE_PA: 0.001, // 0.10% p.a.
  CUSTODY_CAP: null,      // no cap
} as const;

// ============================================================
// Finality (§34)
// ============================================================
export const FINALITY_SPEC = {
  /** Soft finality: 10 minutes */
  SOFT_MINUTES: 10,
  /** Hard finality: 7 days */
  HARD_DAYS: 7,
  /** Minimum physical gold redemption: 1 kg (§34) */
  GOLD_REDEMPTION_MIN_KG: 1,
} as const;

// ============================================================
// Aggregated Spec (for export convenience)
// ============================================================
export const RESERVE_POLICY_SPEC = {
  RESERVE_RATIO: RESERVE_RATIO_SPEC,
  LIQUIDITY: LIQUIDITY_SPEC,
  HAIRCUTS: HAIRCUTS_SPEC,
  CONCENTRATION: CONCENTRATION_SPEC,
  STRUCTURAL_WEIGHT: STRUCTURAL_WEIGHT_SPEC,
  MOMENTUM: MOMENTUM_SPEC,
  VOLATILITY: VOLATILITY_SPEC,
  BASKET_VERIFICATION: BASKET_VERIFICATION_SPEC,
  HYSTERESIS: HYSTERESIS_SPEC,
  LAYER: LAYER_SPEC,
  PHI_T: PHI_T_SPEC,
  REBALANCE: REBALANCE_SPEC,
  TRIGGER_TYPES,
  SEVERITY: SEVERITY_SPEC,
  FEE: FEE_SPEC,
  TRADE_SUPPRESSION: TRADE_SUPPRESSION_SPEC,
  TURNOVER: TURNOVER_SPEC,
  ABSOLUTE_TRADE_LIMITS,
  EXECUTION_MODE: EXECUTION_MODE_SPEC,
  SDP: SDP_SPEC,
  ATTEST: ATTEST_SPEC,
  ORACLE: ORACLE_SPEC,
  EMERGENCY: EMERGENCY_SPEC,
  AMENDMENT: AMENDMENT_SPEC,
  INVARIANTS: INVARIANTS_SPEC,
  BULLION_STANDARDS: BULLION_STANDARDS_SPEC,
  LIQUIDATION_ORDER,
  BASELINE_COMPOSITION,
  SUPPORTED_CURRENCIES,
  USER_FEES: USER_FEES_SPEC,
  FINALITY: FINALITY_SPEC,
  // v21 additions
  RESERVE_CURRENCIES,
  SETTLEMENT_CURRENCIES,
  ENHANCED_HPP_WEIGHTS,
  GRI: GRI_SPEC, // @deprecated v22 — use GEI
  CQS: CQS_SPEC,
  SUBSTITUTION: SUBSTITUTION_SPEC,
  VERIFICATION: VERIFICATION_SPEC,
  // v22 additions
  GEI: GEI_SPEC,
  BRI: BRI_SPEC,
  LCI: LCI_SPEC,
  MULTI_NUMERAIRE: MULTI_NUMERAIRE_SPEC,
  RQS: RQS_SPEC,
  OPTIMIZATION: OPTIMIZATION_SPEC,
  STABLECOIN_DEPEG: DIGITAL_LIQUIDITY_SPEC, // v23: renamed to DIGITAL_LIQUIDITY
  FOUR_LAYER: FOUR_LAYER_SPEC,
  // v23 additions
  DIGITAL_LIQUIDITY: DIGITAL_LIQUIDITY_SPEC,
  DRQS: DRQS_SPEC,
  APPROVED_DIGITAL_ASSETS,
  STABLECOIN_STATE_MACHINE,
  STABLECOIN_EXPOSURE: STABLECOIN_EXPOSURE_SPEC,
  GACR: GACR_SPEC,
  STRESS_RR: STRESS_RR_SPEC,
} as const;

export default RESERVE_POLICY_SPEC;

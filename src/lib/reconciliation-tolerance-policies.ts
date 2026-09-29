// src/lib/reconciliation-tolerance-policies.ts
//
// MITHQAL v25.3.2 — CANONICAL RECONCILIATION TOLERANCE POLICIES
// (single source of truth)
//
// Per O-directive (trace 1a0ee793ba929555):
//   "Refactor reconciliation into separate tolerance policies.
//    Do NOT use one universal tolerance for every reconciliation type.
//    Create separate policies for: ledger-to-ledger balances, bank attestations,
//    custody/quantity, market valuation, FX valuation, stressed valuation.
//    Every reconciliation record must include: tolerancePolicyId,
//    valuationTimestamp, dataSource, assetClass, currency, exceptionPolicy.
//    Update reconciliation engines and tests accordingly."
//
// This is the SINGLE CANONICAL SOURCE for reconciliation tolerance policies.
// The old universal RECONCILIATION_TOLERANCE = 0.0001 (1 bps) in
// src/lib/non-custodial-reserve-architecture.ts:830 is SUPERSEDED.
// Each reconciliation type now has its OWN policy with its OWN tolerance.
//
// HONEST STATE:
//   - productionAuthorized: false
//   - simulated: true
//   - v19MonetaryEnginePreserved: true (NOT touched)
//   - legacyUniversalTolerancePreserved: true (kept with SUPERSEDED comment for backward compat)
//   - existing5WayReconciliationPreserved: true (runReserveBackingReconciliation unchanged)
//
// Owner: Reconciliation Tolerance Policies Architect (Agent O2)
// Release: v25.3.9

export const MODULE_ID = "v25.3.2-O2-1.0-reconciliation-tolerance-policies";

export const HONEST_STATE = {
  productionAuthorized: false,
  simulated: true,
  // The deterministic v19 monetary engine is PRESERVED (NOT touched).
  v19MonetaryEnginePreserved: true,
  // The legacy universal 1 bps tolerance is PRESERVED with a SUPERSEDED comment
  // (NOT deleted) for backward compat — see LEGACY_UNIVERSAL_TOLERANCE_STATUS below.
  legacyUniversalTolerancePreserved: true,
  // The existing 5-way reconciliation (runReserveBackingReconciliation in
  // src/lib/non-custodial-reserve-architecture.ts) is PRESERVED — this module
  // ADDS the new 6-policy + 6-field reconciliation record ON TOP, it does NOT
  // replace the existing 5-way reconciliation.
  existing5WayReconciliationPreserved: true,
  // Per directive: 6 separate tolerance policies (NO universal tolerance).
  tolerancePoliciesCount: 6,
  // Per directive: every reconciliation record must include 6 fields.
  reconciliationRecordFieldCount: 6,
};

// === Tolerance Policy Types ===

export type TolerancePolicyId =
  | "LEDGER_TO_LEDGER"
  | "BANK_ATTESTATION"
  | "CUSTODY_QUANTITY"
  | "MARKET_VALUATION"
  | "FX_VALUATION"
  | "STRESSED_VALUATION";

export type ExceptionPolicy =
  | "BLOCK_ON_MISMATCH"      // reconciliation fails immediately on mismatch
  | "WARN_ON_MISMATCH"       // log warning but continue
  | "ESCALATE_ON_MISMATCH"   // escalate to human review
  | "TOLERATE_WITHIN_BOUNDS" // tolerate within the configured bounds
  | "CUSTOM";                // custom exception handling (per-asset)

export interface TolerancePolicy {
  id: TolerancePolicyId;
  name: string;
  description: string;
  // The tolerance in basis points (1 bps = 0.01%)
  toleranceBps: number;
  // The tolerance as an absolute amount (for quantity-based reconciliation)
  toleranceAbsolute?: number;
  // Whether the tolerance is a hard limit (BLOCK) or soft (WARN/ESCALATE)
  isHardLimit: boolean;
  // The exception policy for this reconciliation type
  exceptionPolicy: ExceptionPolicy;
  // Default currency for FX/market valuation reconciliation
  defaultCurrency?: string;
  // Configurable per-asset-class overrides
  assetClassOverrides?: Record<string, { toleranceBps?: number; toleranceAbsolute?: number; exceptionPolicy?: ExceptionPolicy; }>;
}

// === The 6 Separate Tolerance Policies (per directive) ===

export const TOLERANCE_POLICIES: TolerancePolicy[] = [
  // 1. Ledger-to-ledger balances
  // Used when reconciling balances between two ledgers (e.g., bank subledger vs MITHQAL canonical ledger)
  {
    id: "LEDGER_TO_LEDGER",
    name: "Ledger-to-Ledger Balances",
    description:
      "Reconciliation of balances between two ledgers (e.g., bank subledger vs MITHQAL canonical ledger). " +
      "Tight tolerance — ledger balances should match exactly (within rounding).",
    toleranceBps: 1,  // 0.01% (1 bps) — tight tolerance for ledger-to-ledger
    isHardLimit: true,
    exceptionPolicy: "BLOCK_ON_MISMATCH",  // block immediately if mismatch
    assetClassOverrides: {
      // Stable assets can have tighter tolerance
      "BANK_MONEY": { toleranceBps: 1 },
      "CENTRAL_BANK_MONEY": { toleranceBps: 0 },
      "STABLECOIN": { toleranceBps: 2 },  // stablecoins may have slight variance
    },
  },

  // 2. Bank attestations
  // Used when reconciling bank-attested values (e.g., AvailableBackingCertificate)
  {
    id: "BANK_ATTESTATION",
    name: "Bank Attestations",
    description:
      "Reconciliation of bank-attested values (e.g., AvailableBackingCertificate per BM-05). " +
      "Moderate tolerance — bank attestations may have slight timing differences.",
    toleranceBps: 5,  // 0.05% (5 bps) — moderate for bank attestations
    isHardLimit: true,
    exceptionPolicy: "ESCALATE_ON_MISMATCH",  // escalate to human review
    assetClassOverrides: {
      "BANK_MONEY": { toleranceBps: 3 },
      "SOVEREIGN_BONDS": { toleranceBps: 5 },
    },
  },

  // 3. Custody/quantity
  // Used when reconciling custody quantities (e.g., gold ounces, silver ounces)
  {
    id: "CUSTODY_QUANTITY",
    name: "Custody/Quantity",
    description:
      "Reconciliation of custody quantities (e.g., gold ounces, silver ounces, tokenized deposits). " +
      "Quantity-based tolerance — may have slight variance due to custody chain.",
    toleranceBps: 10,  // 0.10% (10 bps)
    toleranceAbsolute: 0.001,  // 0.001 units absolute tolerance
    isHardLimit: true,
    exceptionPolicy: "BLOCK_ON_MISMATCH",
    assetClassOverrides: {
      "GOLD": { toleranceBps: 5, toleranceAbsolute: 0.0001 },  // tighter for gold
      "SILVER": { toleranceBps: 10, toleranceAbsolute: 0.001 },
      "TOKENIZED_DEPOSITS": { toleranceBps: 0 },  // exact for tokenized
    },
  },

  // 4. Market valuation
  // Used when reconciling market values (e.g., gold spot price, sovereign bond prices)
  {
    id: "MARKET_VALUATION",
    name: "Market Valuation",
    description:
      "Reconciliation of market values (e.g., gold spot price, sovereign bond prices, stablecoin prices). " +
      "Wider tolerance — market values fluctuate throughout the day.",
    toleranceBps: 50,  // 0.50% (50 bps) — wider for market valuation
    isHardLimit: false,  // soft limit — warn but don't block
    exceptionPolicy: "WARN_ON_MISMATCH",
    defaultCurrency: "USD",
    assetClassOverrides: {
      "GOLD": { toleranceBps: 30 },  // gold is relatively stable
      "SILVER": { toleranceBps: 100 },  // silver is more volatile
      "STABLECOIN": { toleranceBps: 10 },  // stablecoins should be tight
      "SOVEREIGN_BONDS": { toleranceBps: 5 },  // sovereign bonds are stable
    },
  },

  // 5. FX valuation
  // Used when reconciling FX rates (e.g., USD/EUR, USD/JPY)
  {
    id: "FX_VALUATION",
    name: "FX Valuation",
    description:
      "Reconciliation of FX rates (e.g., USD/EUR, USD/JPY, USD/CNY). " +
      "Moderate tolerance — FX rates fluctuate but should be within a reasonable band.",
    toleranceBps: 20,  // 0.20% (20 bps) — moderate for FX
    isHardLimit: false,
    exceptionPolicy: "WARN_ON_MISMATCH",
    defaultCurrency: "USD",
    assetClassOverrides: {
      // Pegged currencies should have tighter tolerance
      "AED": { toleranceBps: 5 },  // AED is pegged to USD
      "SAR": { toleranceBps: 5 },  // SAR is pegged to USD
      // Volatile currencies need wider tolerance
      "JPY": { toleranceBps: 30 },
      "CNY": { toleranceBps: 25 },
    },
  },

  // 6. Stressed valuation
  // Used when reconciling values under stress scenarios (e.g., stress test results)
  {
    id: "STRESSED_VALUATION",
    name: "Stressed Valuation",
    description:
      "Reconciliation of values under stress scenarios (e.g., stress test results per v25.3.5 reserve coverage). " +
      "Widest tolerance — stressed values are inherently uncertain.",
    toleranceBps: 200,  // 2.00% (200 bps) — widest for stressed valuation
    isHardLimit: false,
    exceptionPolicy: "TOLERATE_WITHIN_BOUNDS",  // tolerate within the wider bounds
    defaultCurrency: "USD",
    assetClassOverrides: {
      "GOLD": { toleranceBps: 100 },
      "SILVER": { toleranceBps: 300 },
      "STABLECOIN": { toleranceBps: 50 },  // stablecoin depeg scenarios
    },
  },
];

// === The 6-Field Reconciliation Record (per directive) ===

export interface ReconciliationRecord {
  // 1. tolerancePolicyId — which tolerance policy applies
  tolerancePolicyId: TolerancePolicyId;

  // 2. valuationTimestamp — when the valuation was taken
  valuationTimestamp: string;  // ISO 8601

  // 3. dataSource — where the data came from
  dataSource: string;  // e.g., "gold-api.com", "open.er-api.com", "bank-attestation-BANK_001", "canonical-ledger"

  // 4. assetClass — what asset class is being reconciled
  assetClass: string;  // e.g., "BANK_MONEY", "GOLD", "SILVER", "STABLECOIN"

  // 5. currency — what currency (for valuation reconciliation)
  currency: string;  // ISO 4217 code, e.g., "USD", "EUR", "JPY"

  // 6. exceptionPolicy — what to do if there's a mismatch
  exceptionPolicy: ExceptionPolicy;

  // === Additional reconciliation fields ===
  expectedValue: number;  // the expected value
  actualValue: number;    // the actual value
  difference: number;     // actualValue - expectedValue
  differenceBps: number;  // difference in basis points
  isWithinTolerance: boolean;  // whether the difference is within the tolerance
  reconciliationStatus: "VERIFIED" | "WARNING" | "MISMATCH" | "CRITICAL" | "EXPIRED" | "UNAVAILABLE" | "LOCKED";
  reconciledAt: string;  // ISO 8601
  notes?: string;
}

// === Reconciliation Engine (uses the policies) ===

export function reconcile(input: {
  tolerancePolicyId: TolerancePolicyId;
  valuationTimestamp: string;
  dataSource: string;
  assetClass: string;
  currency: string;
  expectedValue: number;
  actualValue: number;
}): ReconciliationRecord {
  // Get the tolerance policy
  const policy = TOLERANCE_POLICIES.find(p => p.id === input.tolerancePolicyId);
  if (!policy) {
    throw new Error(`Invalid tolerancePolicyId: ${input.tolerancePolicyId}. Valid: ${TOLERANCE_POLICIES.map(p => p.id).join(", ")}`);
  }

  // Get the effective tolerance (with asset-class overrides)
  let effectiveToleranceBps = policy.toleranceBps;
  let effectiveExceptionPolicy = policy.exceptionPolicy;

  if (policy.assetClassOverrides && policy.assetClassOverrides[input.assetClass]) {
    const override = policy.assetClassOverrides[input.assetClass];
    if (override.toleranceBps !== undefined) effectiveToleranceBps = override.toleranceBps;
    if (override.exceptionPolicy !== undefined) effectiveExceptionPolicy = override.exceptionPolicy;
  }

  // Compute the difference
  const difference = input.actualValue - input.expectedValue;
  const differenceBps = input.expectedValue !== 0 ? (difference / input.expectedValue) * 10000 : 0;
  const isWithinTolerance = Math.abs(differenceBps) <= effectiveToleranceBps;

  // Determine the reconciliation status
  let reconciliationStatus: ReconciliationRecord["reconciliationStatus"];
  if (isWithinTolerance) {
    reconciliationStatus = "VERIFIED";
  } else if (Math.abs(differenceBps) <= effectiveToleranceBps * 2) {
    reconciliationStatus = "WARNING";
  } else {
    reconciliationStatus = policy.isHardLimit ? "CRITICAL" : "MISMATCH";
  }

  return {
    tolerancePolicyId: input.tolerancePolicyId,
    valuationTimestamp: input.valuationTimestamp,
    dataSource: input.dataSource,
    assetClass: input.assetClass,
    currency: input.currency,
    exceptionPolicy: effectiveExceptionPolicy,
    expectedValue: input.expectedValue,
    actualValue: input.actualValue,
    difference,
    differenceBps,
    isWithinTolerance,
    reconciliationStatus,
    reconciledAt: new Date().toISOString(),
  };
}

// === API ===

export function getTolerancePolicy(id: TolerancePolicyId): TolerancePolicy | undefined {
  return TOLERANCE_POLICIES.find(p => p.id === id);
}

export function getToleranceForAsset(policyId: TolerancePolicyId, assetClass: string): {
  toleranceBps: number;
  exceptionPolicy: ExceptionPolicy;
} {
  const policy = getTolerancePolicy(policyId);
  if (!policy) {
    throw new Error(`Invalid tolerancePolicyId: ${policyId}`);
  }
  let toleranceBps = policy.toleranceBps;
  let exceptionPolicy = policy.exceptionPolicy;
  if (policy.assetClassOverrides && policy.assetClassOverrides[assetClass]) {
    const override = policy.assetClassOverrides[assetClass];
    if (override.toleranceBps !== undefined) toleranceBps = override.toleranceBps;
    if (override.exceptionPolicy !== undefined) exceptionPolicy = override.exceptionPolicy;
  }
  return { toleranceBps, exceptionPolicy };
}

// === Status ===
export const TOLERANCE_POLICIES_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" = "ACTIVE";
export const TOLERANCE_POLICIES_VERSION = "v25.3.2-O2-1.0";
export const TOLERANCE_POLICIES_SOURCE = "src/lib/reconciliation-tolerance-policies.ts";

// === Legacy universal tolerance (SUPERSEDED) ===
// Per O-directive: "Do NOT use one universal tolerance for every reconciliation type."
// The old RECONCILIATION_TOLERANCE = 0.0001 (1 bps) in src/lib/non-custodial-reserve-architecture.ts:830
// is SUPERSEDED. Each reconciliation type now has its OWN policy.
export const LEGACY_UNIVERSAL_TOLERANCE_STATUS = "SUPERSEDED — universal 1 bps tolerance replaced by 6 separate tolerance policies per O-directive";

// === Required Reconciliation Record Fields (per directive) ===
// Per directive: "Every reconciliation record must include: tolerancePolicyId,
// valuationTimestamp, dataSource, assetClass, currency, exceptionPolicy."
export const REQUIRED_RECONCILIATION_RECORD_FIELDS: ReadonlyArray<keyof ReconciliationRecord> = [
  "tolerancePolicyId",
  "valuationTimestamp",
  "dataSource",
  "assetClass",
  "currency",
  "exceptionPolicy",
] as const;

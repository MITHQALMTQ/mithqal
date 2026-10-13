/**
 * MITHQAL v26.0 §5.3 — Reconciliation Class Tolerance Registry
 *
 * Each class of comparison has its own tolerance policy. The legacy
 * practice of "1% reconciliation tolerance for everything" is
 * explicitly DEPRECATED (see DEPRECATED_LEGACY_THRESHOLDS).
 *
 * The registry is the canonical source of truth for whether a
 * mismatch is BLOCKED, TOLERATED, raised as an EXCEPTION, or flagged
 * as a STALE_PROJECTION. The values are not configurable at runtime —
 * changes require a registry edit, a review-date bump, and a new
 * approval evidence reference.
 */

export type ReconciliationClass =
  | "IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE"
  | "LEDGER_ENTRIES_OBLIGATION_PRINCIPAL"
  | "BANK_RAIL_TRANSACTION_MAPPING"
  | "FX_VALUATION"
  | "REPORTING_AGGREGATE"
  | "EVENTUAL_CONSISTENCY_PROJECTION";

export type ReconciliationToleranceStatus = "ACTIVE" | "DEPRECATED" | "SUPERSEDED" | "DRAFT";

export interface ReconciliationToleranceRule {
  ruleId: string;
  reconciliationClass: ReconciliationClass;
  /** Zero tolerance, exact match, 5 bps, 1000ms lag, etc. */
  baseline: string;
  /** Human-readable tolerance policy, e.g. "no delta permitted". */
  tolerance: string;
  /** Numeric threshold in the rule's unit, when applicable. */
  numericThreshold: number | null;
  /** Unit: usd_minor_unit, exact_match, exact_external_ref, bps, ms, etc. */
  unit: string;
  owner: string;
  rationale: string;
  testRefs: string[];
  approvalEvidenceRef: string;
  effectiveFrom: string;
  expiresAt: string | null;
  reviewDate: string;
  status: ReconciliationToleranceStatus;
  blueprintRef: string;
}

export const RECONCILIATION_TOLERANCE_REGISTRY: ReconciliationToleranceRule[] = [
  {
    ruleId: "RT-IDENTITY-001",
    reconciliationClass: "IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE",
    baseline: "Identity, authorization status, and legal scope must match exactly across control plane and projection.",
    tolerance: "Zero tolerance; any mismatch is a control-plane violation.",
    numericThreshold: 0,
    unit: "exact_match",
    owner: "Security & Compliance",
    rationale:
      "Identity scope drift breaks the entire authorization chain. Identity mismatches cannot be tolerated under any pilot stage.",
    testRefs: ["tests/contract/reconciliation-identity.test.ts", "tests/security/scope-drift.test.ts"],
    approvalEvidenceRef: "EVD-RT-IDENTITY-001",
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    reviewDate: "2026-07-01",
    status: "ACTIVE",
    blueprintRef: "v26.0 §5.3 Identity Authorization Status Legal Scope",
  },
  {
    ruleId: "RT-LEDGER-001",
    reconciliationClass: "LEDGER_ENTRIES_OBLIGATION_PRINCIPAL",
    baseline: "Ledger entry principal must equal the obligation principal in the source instruction.",
    tolerance: "Zero tolerance; principal reconciliation is exact-match at USD minor unit (1/100 of one cent).",
    numericThreshold: 0,
    unit: "usd_minor_unit",
    owner: "Controller / Settlement Operations",
    rationale:
      "Principal mismatches indicate a ledger corruption or a missing instruction. No rounding tolerance is permitted; FX rounding is handled separately under FX_VALUATION.",
    testRefs: ["tests/contract/reconciliation-ledger.test.ts", "tests/unit/eligible-backing.test.ts"],
    approvalEvidenceRef: "EVD-RT-LEDGER-001",
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    reviewDate: "2026-07-01",
    status: "ACTIVE",
    blueprintRef: "v26.0 §5.3 Ledger Entries Obligation Principal",
  },
  {
    ruleId: "RT-BANKRAIL-001",
    reconciliationClass: "BANK_RAIL_TRANSACTION_MAPPING",
    baseline: "Each control-plane instruction must map 1:1 to an external bank-rail transaction reference.",
    tolerance: "Zero tolerance; the external reference must be present and unique.",
    numericThreshold: 0,
    unit: "exact_external_ref",
    owner: "Settlement Operations",
    rationale:
      "Bank-rail references are the cross-institutional anchor. A missing or duplicate reference breaks reconciliation with the counterparty bank and the regulator.",
    testRefs: ["tests/contract/reconciliation-bank-rail.test.ts", "tests/integration/bank-rail-mapping.test.ts"],
    approvalEvidenceRef: "EVD-RT-BANKRAIL-001",
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    reviewDate: "2026-07-01",
    status: "ACTIVE",
    blueprintRef: "v26.0 §5.3 Bank Rail Transaction Mapping",
  },
  {
    ruleId: "RT-FX-001",
    reconciliationClass: "FX_VALUATION",
    baseline: "FX-converted amounts may diverge from a third-party reference rate by at most 5 basis points.",
    tolerance: "Tolerated up to 5 bps delta; above 5 bps raises an EXCEPTION case.",
    numericThreshold: 5,
    unit: "bps",
    owner: "Treasury",
    rationale:
      "FX rates from independent providers naturally differ by a few bps due to timestamps, spreads, and rounding. 5 bps is well below materiality for institutional settlement, but above the threshold for stale-rate manipulation.",
    testRefs: ["tests/property/fx-bps.test.ts", "tests/contract/fx-tolerance.test.ts"],
    approvalEvidenceRef: "EVD-RT-FX-001",
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-07-01T00:00:00.000Z",
    reviewDate: "2026-04-01",
    status: "ACTIVE",
    blueprintRef: "v26.0 §5.3 FX Valuation",
  },
  {
    ruleId: "RT-REPORTING-001",
    reconciliationClass: "REPORTING_AGGREGATE",
    baseline: "Reporting aggregates must reconcile to the underlying ledger to the USD minor unit.",
    tolerance: "Zero tolerance; aggregates must equal the sum of the underlying entries exactly.",
    numericThreshold: 0,
    unit: "usd_minor_unit",
    owner: "Controller / Regulatory Reporting",
    rationale:
      "Regulatory reports must be reproducible from the ledger exactly. Aggregation deltas are not tolerable; any delta triggers a reporting-accuracy case.",
    testRefs: ["tests/contract/reconciliation-reporting.test.ts", "tests/integration/reporting-aggregate.test.ts"],
    approvalEvidenceRef: "EVD-RT-REPORTING-001",
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    reviewDate: "2026-07-01",
    status: "ACTIVE",
    blueprintRef: "v26.0 §5.3 Reporting Aggregate",
  },
  {
    ruleId: "RT-PROJECTION-001",
    reconciliationClass: "EVENTUAL_CONSISTENCY_PROJECTION",
    baseline: "Projection watermarks may lag the authoritative writer by at most 1000 ms (SLO).",
    tolerance: "Tolerated up to 1000 ms; lag above 1000 ms is STALE_PROJECTION and blocks reads.",
    numericThreshold: 1000,
    unit: "ms",
    owner: "Platform Engineering",
    rationale:
      "Projections (Turso) are eventually consistent by design. The 1000 ms SLO is the upper bound before projections are marked stale and reads are routed to the authoritative writer.",
    testRefs: ["tests/property/projection-lag.test.ts", "tests/integration/projection-watermark.test.ts"],
    approvalEvidenceRef: "EVD-RT-PROJECTION-001",
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    reviewDate: "2026-04-01",
    status: "ACTIVE",
    blueprintRef: "v26.0 §5.3 Eventual Consistency Projection + §6.8 Projection Watermark",
  },
];

/**
 * Legacy percentage thresholds (0.1%, 0.5%, 1%, 5%) used by the v25.x
 * reconciliation pipeline. These are DEPRECATED per v26.0 §5.3 and
 * must not be used by any new code path.
 */
export const DEPRECATED_LEGACY_THRESHOLDS = {
  "0.1%": {
    status: "DEPRECATED" as const,
    reason:
      "Replaced by class-specific rules (IDENTITY/LEDGER/BANK_RAIL/REPORTING all require exact match).",
    blueprintRef: "v26.0 §5.3 + §11.3 D-002",
  },
  "0.5%": {
    status: "DEPRECATED" as const,
    reason:
      "Replaced by class-specific rules (FX is 5 bps, not 0.5%; principal is exact match).",
    blueprintRef: "v26.0 §5.3 + §11.3 D-002",
  },
  "1%": {
    status: "DEPRECATED" as const,
    reason:
      "Replaced by class-specific rules; legacy 1% tolerance masked identity drift and principal corruption.",
    blueprintRef: "v26.0 §5.3 + §11.3 D-002",
  },
  "5%": {
    status: "DEPRECATED" as const,
    reason:
      "Replaced by class-specific rules; legacy 5% tolerance is incompatible with regulatory reporting accuracy.",
    blueprintRef: "v26.0 §5.3 + §11.3 D-002",
  },
} as const;

export type ReconciliationDisposition =
  | "BLOCKED"
  | "TOLERATED"
  | "EXCEPTION"
  | "STALE_PROJECTION";

/**
 * Resolve the applicable tolerance rule for a class as of a given
 * ISO-8601 timestamp. Returns null when no active rule applies.
 */
export function getToleranceRule(
  reconciliationClass: ReconciliationClass,
  asOf: string = new Date().toISOString(),
): ReconciliationToleranceRule | null {
  const asOfMs = Date.parse(asOf);
  return (
    RECONCILIATION_TOLERANCE_REGISTRY.find(
      (r) =>
        r.reconciliationClass === reconciliationClass &&
        r.status === "ACTIVE" &&
        Date.parse(r.effectiveFrom) <= asOfMs &&
        (r.expiresAt === null || asOfMs < Date.parse(r.expiresAt)),
    ) ?? null
  );
}

/**
 * Classify a mismatch against the active tolerance rule.
 *
 * Returns one of:
 *   - BLOCKED: identity, ledger, bank-rail, or reporting delta > 0
 *   - TOLERATED: fx delta ≤ 5 bps, or projection lag ≤ 1000 ms
 *   - EXCEPTION: fx delta > 5 bps (within review window)
 *   - STALE_PROJECTION: projection lag > 1000 ms (read routing flips)
 */
export function evaluateMismatch(
  reconciliationClass: ReconciliationClass,
  mismatchMagnitude: number,
  mismatchUnit: string,
): {
  disposition: ReconciliationDisposition;
  rule: ReconciliationToleranceRule | null;
  reason: string;
} {
  const rule = getToleranceRule(reconciliationClass);
  if (!rule) {
    return {
      disposition: "BLOCKED",
      rule: null,
      reason: `No ACTIVE tolerance rule for ${reconciliationClass}. Defaulting to BLOCKED.`,
    };
  }
  if (rule.unit !== mismatchUnit) {
    return {
      disposition: "BLOCKED",
      rule,
      reason: `Unit mismatch: rule expects ${rule.unit}, observed ${mismatchUnit}.`,
    };
  }

  switch (reconciliationClass) {
    case "EVENTUAL_CONSISTENCY_PROJECTION":
      if (mismatchMagnitude <= (rule.numericThreshold ?? 0)) {
        return { disposition: "TOLERATED", rule, reason: `Lag ${mismatchMagnitude} ms ≤ SLO ${rule.numericThreshold} ms.` };
      }
      return {
        disposition: "STALE_PROJECTION",
        rule,
        reason: `Lag ${mismatchMagnitude} ms > SLO ${rule.numericThreshold} ms; projection marked STALE.`,
      };
    case "FX_VALUATION":
      if (mismatchMagnitude <= (rule.numericThreshold ?? 0)) {
        return { disposition: "TOLERATED", rule, reason: `FX delta ${mismatchMagnitude} bps ≤ ${rule.numericThreshold} bps.` };
      }
      return {
        disposition: "EXCEPTION",
        rule,
        reason: `FX delta ${mismatchMagnitude} bps > ${rule.numericThreshold} bps; raising EXCEPTION case.`,
      };
    case "IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE":
    case "LEDGER_ENTRIES_OBLIGATION_PRINCIPAL":
    case "BANK_RAIL_TRANSACTION_MAPPING":
    case "REPORTING_AGGREGATE":
    default:
      if (mismatchMagnitude === 0) {
        return { disposition: "TOLERATED", rule, reason: "Zero delta — exact match." };
      }
      return {
        disposition: "BLOCKED",
        rule,
        reason: `Class ${reconciliationClass} requires exact match; observed delta ${mismatchMagnitude} ${rule.unit}.`,
      };
  }
}

/**
 * MITHQAL v26.0 §3.3 — Eligible Backing Formula
 *
 *   EligibleBacking =
 *     MIN(EconomicBacking,
 *         LegalBacking,
 *         LiquidBacking,
 *         SettlementAvailableBacking)
 *
 * Each dimension is independently attested, freshness-scoped,
 * legal-scoped, and status-checked. The MIN reflects the
 * institutional principle that no dimension can be substituted by
 * another — a single dimension being unverified blocks eligibility.
 *
 * Blueprint: v26.0 §3.3, §3.4, Appendix B.4 EvidenceArtifact
 */

export const ELIGIBLE_BACKING_FORMULA =
  "EligibleBacking = MIN(EconomicBacking, LegalBacking, LiquidBacking, SettlementAvailableBacking)";

/**
 * Canonical backing input status (per v26.0 §3.3 + §5.5 ClaimStatus taxonomy).
 * The first four are "verified" statuses; the remainder either block
 * eligibility outright or require explicit review.
 */
export type BackingInputStatus =
  | "VERIFIED_PRIMARY_DOCUMENT"
  | "EXECUTED_EXTERNAL_DOCUMENT"
  | "MEASURED"
  | "EXTERNAL_SOURCE"
  | "SIMULATED"
  | "ASSUMED"
  | "PENDING_PRIMARY_DOCUMENT"
  | "PENDING_LEGAL_REVIEW"
  | "EXPIRED"
  | "CONTRADICTED"
  | "UNKNOWN";

/**
 * A single dimension's attested backing input. Each input carries its
 * own evidence reference, freshness policy, and legal scope so that
 * reviewers can independently re-verify the dimension.
 */
export interface BackingDimensionInput {
  /** Which of the four MIN dimensions this input belongs to. */
  dimension:
    | "economic"
    | "legal"
    | "liquid"
    | "settlementAvailable";
  /** Backed amount in the declared unit (e.g. 1_000_000.00). */
  amount: number;
  /** Currency or asset unit (e.g. "USD", "USD_MINOR_UNIT", "XAU_OZ"). */
  unit: string;
  /** ISO-8601 timestamp when the input was measured or attested. */
  asOf: string;
  /** Reference to an EvidenceArtifact row (evidenceId or external ref). */
  evidenceRef: string;
  /** Freshness policy version that governs this input's expiry. */
  freshnessPolicyVersion: string;
  /** ISO-8601 timestamp after which this input is considered STALE. */
  expiresAt: string;
  /** Legal scope under which the evidence is admissible. */
  legalScope: {
    entity: string;
    jurisdiction: string;
    applicableLaw: string;
  };
  /** Verification status of the underlying evidence. */
  status: BackingInputStatus;
  /** If true, this input blocks EligibleBacking regardless of amount. */
  blocksEligibility: boolean;
  /** Human-readable note for review/audit. */
  note?: string;
}

/**
 * The four canonical MIN dimensions. All four MUST be supplied.
 */
export interface EligibleBackingInputs {
  economic: BackingDimensionInput;
  legal: BackingDimensionInput;
  liquid: BackingDimensionInput;
  settlementAvailable: BackingDimensionInput;
}

/**
 * The full computation result returned by computeEligibleBacking().
 * Captures the MIN, the formula applied, and any blocking reason so
 * the result is itself an audit artifact.
 */
export interface EligibleBackingComputation {
  /** The MIN amount, in `unit`. */
  eligibleBacking: number;
  /** Homogeneous unit across all four dimensions. */
  unit: string;
  /** Per-dimension snapshot used by the MIN. */
  dimensions: {
    economic: { amount: number; status: BackingInputStatus; evidenceRef: string };
    legal: { amount: number; status: BackingInputStatus; evidenceRef: string };
    liquid: { amount: number; status: BackingInputStatus; evidenceRef: string };
    settlementAvailable: { amount: number; status: BackingInputStatus; evidenceRef: string };
  };
  /** The canonical formula string. */
  formula: string;
  /** True only when every dimension has a verified status. */
  allInputsVerified: boolean;
  /** True when at least one dimension blocks eligibility. */
  blocked: boolean;
  /** Human-readable explanation when blocked. Null when not blocked. */
  blockedReason: string | null;
  /** Policy version that produced this computation. */
  policyVersion: string;
  /** ISO-8601 timestamp of the computation. */
  computedAt: string;
}

const BLOCKING_STATUSES: ReadonlySet<BackingInputStatus> = new Set([
  "UNKNOWN",
  "EXPIRED",
  "CONTRADICTED",
  "PENDING_PRIMARY_DOCUMENT",
  "PENDING_LEGAL_REVIEW",
]);

const VERIFIED_STATUSES: ReadonlySet<BackingInputStatus> = new Set([
  "VERIFIED_PRIMARY_DOCUMENT",
  "EXECUTED_EXTERNAL_DOCUMENT",
  "MEASURED",
  "EXTERNAL_SOURCE",
]);

function findBlocker(inputs: EligibleBackingInputs): {
  blocked: boolean;
  reason: string | null;
} {
  const entries: Array<[string, BackingDimensionInput]> = [
    ["economic", inputs.economic],
    ["legal", inputs.legal],
    ["liquid", inputs.liquid],
    ["settlementAvailable", inputs.settlementAvailable],
  ];

  for (const [label, input] of entries) {
    if (input.blocksEligibility) {
      return {
        blocked: true,
        reason: `Dimension "${label}" carries blocksEligibility=true (${input.note ?? "no note"}).`,
      };
    }
    if (BLOCKING_STATUSES.has(input.status)) {
      return {
        blocked: true,
        reason: `Dimension "${label}" has blocking status "${input.status}" (evidenceRef=${input.evidenceRef}).`,
      };
    }
    const expiryMs = Date.parse(input.expiresAt);
    if (!Number.isNaN(expiryMs) && expiryMs < Date.now()) {
      return {
        blocked: true,
        reason: `Dimension "${label}" expired at ${input.expiresAt} (freshnessPolicyVersion=${input.freshnessPolicyVersion}).`,
      };
    }
  }

  return { blocked: false, reason: null };
}

function assertUnitConsistency(inputs: EligibleBackingInputs): string {
  const units = new Set([
    inputs.economic.unit,
    inputs.legal.unit,
    inputs.liquid.unit,
    inputs.settlementAvailable.unit,
  ]);
  if (units.size !== 1) {
    const seen = Array.from(units).join(", ");
    throw new Error(
      `Unit consistency violation: EligibleBacking requires all four dimensions in the same unit, but found [${seen}].`,
    );
  }
  return inputs.economic.unit;
}

/**
 * Compute EligibleBacking per the v26.0 §3.3 formula.
 *
 * Steps:
 *   1. Assert all four dimensions share a common unit.
 *   2. Walk the dimensions; the first blocking status, explicit
 *      blocksEligibility flag, or stale expiry produces a BLOCKED
 *      result with zero eligible backing.
 *   3. Otherwise, return MIN(economic, legal, liquid, settlementAvailable).
 */
export function computeEligibleBacking(
  inputs: EligibleBackingInputs,
  policyVersion: string,
): EligibleBackingComputation {
  const unit = assertUnitConsistency(inputs);
  const blocker = findBlocker(inputs);

  const dimensions = {
    economic: {
      amount: inputs.economic.amount,
      status: inputs.economic.status,
      evidenceRef: inputs.economic.evidenceRef,
    },
    legal: {
      amount: inputs.legal.amount,
      status: inputs.legal.status,
      evidenceRef: inputs.legal.evidenceRef,
    },
    liquid: {
      amount: inputs.liquid.amount,
      status: inputs.liquid.status,
      evidenceRef: inputs.liquid.evidenceRef,
    },
    settlementAvailable: {
      amount: inputs.settlementAvailable.amount,
      status: inputs.settlementAvailable.status,
      evidenceRef: inputs.settlementAvailable.evidenceRef,
    },
  } as const;

  const allInputsVerified =
    VERIFIED_STATUSES.has(inputs.economic.status) &&
    VERIFIED_STATUSES.has(inputs.legal.status) &&
    VERIFIED_STATUSES.has(inputs.liquid.status) &&
    VERIFIED_STATUSES.has(inputs.settlementAvailable.status);

  if (blocker.blocked) {
    return {
      eligibleBacking: 0,
      unit,
      dimensions,
      formula: ELIGIBLE_BACKING_FORMULA,
      allInputsVerified,
      blocked: true,
      blockedReason: blocker.reason,
      policyVersion,
      computedAt: new Date().toISOString(),
    };
  }

  const minAmount = Math.min(
    inputs.economic.amount,
    inputs.legal.amount,
    inputs.liquid.amount,
    inputs.settlementAvailable.amount,
  );

  return {
    eligibleBacking: minAmount,
    unit,
    dimensions,
    formula: ELIGIBLE_BACKING_FORMULA,
    allInputsVerified,
    blocked: false,
    blockedReason: null,
    policyVersion,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Direct-matched backing test per v26.0 §3.4.
 *
 * Direct-matched means the eligible backing covers the obligation
 * amount in the same unit, with no credit for projected or
 * risk-buffered backing. A separate risk buffer (§3.5) is tracked
 * independently and does NOT contribute to direct-match satisfaction.
 */
export function isDirectMatched(
  eligible: EligibleBackingComputation,
  obligationAmount: number,
  unit: string,
): { directMatched: boolean; reason: string } {
  if (eligible.blocked) {
    return {
      directMatched: false,
      reason: `Eligible backing is BLOCKED: ${eligible.blockedReason ?? "no reason given"}.`,
    };
  }
  if (eligible.unit !== unit) {
    return {
      directMatched: false,
      reason: `Unit mismatch: eligible is in ${eligible.unit}, obligation is in ${unit}.`,
    };
  }
  if (eligible.eligibleBacking < obligationAmount) {
    return {
      directMatched: false,
      reason: `Shortfall: eligible ${eligible.eligibleBacking} ${eligible.unit} < obligation ${obligationAmount} ${unit}.`,
    };
  }
  return {
    directMatched: true,
    reason: `Direct-matched: eligible ${eligible.eligibleBacking} ${eligible.unit} ≥ obligation ${obligationAmount} ${unit}.`,
  };
}

// ============================================================================
// §47 — PROTECTED BACKING CELL (PBC)
// ============================================================================
// A Protected Backing Cell (PBC) is a bank/institution-side, identified and
// earmarked allocation of a single reserve asset that is pledged to support
// MTQ issuance. MITHQAL verifies, applies constitutional rules, calculates
// issuance capacity, authorizes issuance, reconciles, and monitors systemic
// risk — MITHQAL does NOT own or custody the backing by default.
//
// Core §47 invariant (anti-double-count):
//   The SAME backing must NEVER support multiple MTQ obligations.
//   A given PBC may be allocated to AT MOST ONE mtqObligationId at a time.
//
// §47 formula:
//   AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking
//
// Honest-state discipline (§73/§74):
//   - This module is a DESIGN-TIME specification — no live bank is contracted.
//   - Reference/demo cells are SIMULATED (liveCells = 0).
//   - Required honest-state fields (§74):
//       protectedBackingModelImplemented = true
//       protectedBackingLiveCells       = 0
//
// HONEST STATE: All reference cells are SIMULATED. No real institution,
// custodian, or asset is contracted. PRODUCTION_READY evidence is a target
// state, NOT a current state for any reference cell.
// ============================================================================

export const MODULE_ID = "v25.2-protected-backing-cell-1.0";
export const PBC_SECTION = 47;

// ----------------------------------------------------------------------------
// §73 — Evidence state vocabulary (7 canonical + *_PENDING variants)
// ----------------------------------------------------------------------------
export const PBC_EVIDENCE_STATES = [
  "DESIGNED",
  "DESIGNED_PENDING",
  "IMPLEMENTED",
  "IMPLEMENTED_PENDING",
  "INTEGRATED",
  "INTEGRATED_PENDING",
  "TESTED",
  "TESTED_PENDING",
  "SANDBOX_VALIDATED",
  "SANDBOX_VALIDATED_PENDING",
  "INSTITUTIONALLY_VALIDATED",
  "INSTITUTIONALLY_VALIDATED_PENDING",
  "PRODUCTION_READY",
] as const;

export type ProtectedBackingEvidenceState = (typeof PBC_EVIDENCE_STATES)[number];

/** Canonical 7 evidence states (without PENDING variants). */
export const PBC_CANONICAL_EVIDENCE_STATES: ProtectedBackingEvidenceState[] = [
  "DESIGNED",
  "IMPLEMENTED",
  "INTEGRATED",
  "TESTED",
  "SANDBOX_VALIDATED",
  "INSTITUTIONALLY_VALIDATED",
  "PRODUCTION_READY",
];

// ----------------------------------------------------------------------------
// Enumerated status types for the 17-field PBC
// ----------------------------------------------------------------------------

export type LegalStatus =
  | "CLEARED" // legal title confirmed, free to pledge
  | "CONFIRMED" // title confirmed, pledge authorized
  | "PENDING_REVIEW" // documentation under review
  | "DISPUTED" // title / pledge disputed
  | "ENCUMBERED_LEGAL" // subject to a perfected security interest
  | "LIQUIDATED"; // asset has been realized / written off

export type EncumbranceStatus =
  | "FREE" // no third-party interest
  | "PARTIALLY_ENCUMBERED" // a portion is subject to a perfected security interest
  | "ENCUMBERED" // fully subject to a perfected security interest
  | "FROZEN" // regulator/court-ordered freeze
  | "PLEDGED_TO_MITHQAL" // pledged exclusively to support MTQ issuance
  | "PENDING_RELEASE"; // release in process, not yet freed

export type AllocationStatus =
  | "UNALLOCATED" // available to support a new MTQ obligation
  | "ALLOCATED" // already supporting an MTQ obligation
  | "PARTIALLY_ALLOCATED" // a portion is allocated, remainder is free
  | "RESERVED" // held back (cannot support new obligations)
  | "RELEASED"; // previously allocated, now released back to UNALLOCATED

export type AssetType =
  | "fiat-cash"
  | "fiat-sovereign"
  | "gold-physical-allocated"
  | "gold-physical-unallocated"
  | "tokenized-gold"
  | "silver"
  | "digital-stablecoin"
  | "digital-treasury"
  | "money-market-fund";

export type CustodianTier =
  | "TIER1_REGULATED_BANK" // major regulated bank custodian
  | "TIER2_SPECIALIST_CUSTODIAN" // specialist bullion/digital custodian
  | "TIER3_TRUST_COMPANY" // regulated trust company
  | "TIER4_SELF_CUSTODY" // disfavored / requires extra haircut
  | "TIER_UNKNOWN";

export type JurisdictionRisk =
  | "APPROVED"
  | "WATCH"
  | "SANCTIONED"
  | "UNKNOWN";

/** Status color palette — amber/emerald/red/gray ONLY (NO indigo/blue). */
export type StatusColor = "amber" | "emerald" | "red" | "gray";

export interface ProtectedBackingCellStatus {
  /** Aggregated lifecycle status for the cell. */
  status:
    | "ELIGIBLE"
    | "ELIGIBLE_WITH_CONDITIONS"
    | "PENDING_VERIFICATION"
    | "INELIGIBLE"
    | "EXPIRED"
    | "LIQUIDATED";
  color: StatusColor;
  reasons: string[];
}

// ----------------------------------------------------------------------------
// §47 — The 17-field Protected Backing Cell
// ----------------------------------------------------------------------------

/**
 * The asset descriptor (the "asset" field of the 17-field PBC).
 * Carries type, name, optional currency / ISIN / digital token identifier.
 */
export interface ProtectedBackingAsset {
  type: AssetType;
  name: string;
  currency?: string;       // ISO 4217 code (for fiat/cash/sovereign/stablecoin)
  isin?: string;          // for sovereign / money-market instruments
  tokenId?: string;       // for digital / tokenized assets
  chain?: string;          // chain identifier for tokenized assets
}

/**
 * The evidence descriptor (the "evidence" field of the 17-field PBC).
 * Holds the §73 evidence-state progression and supporting attestations.
 */
export interface ProtectedBackingEvidence {
  evidenceState: ProtectedBackingEvidenceState;
  /** Documentation artifacts supporting the evidence state. */
  attestations: ProtectedBackingAttestation[];
  /** Last evidence-state transition timestamp (ISO 8601). */
  lastTransitionAt: string;
  /** Honest flag: SIMULATED until a live institution attests otherwise. */
  simulated: boolean;
}

export interface ProtectedBackingAttestation {
  /** Kind of attestation (custodian attestation, audit, legal opinion, etc.). */
  kind: "custodian_attestation" | "independent_audit" | "legal_opinion" | "regulator_no_objection" | "smart_contract_proof" | "off_chain_receipt";
  /** Identifier of the attesting party. */
  attester: string;
  /** ISO 8601 timestamp of the attestation. */
  at: string;
  /** SHA-256 / multihash reference to the off-chain evidence document. */
  evidenceHash: string;
  /** Honest flag: SIMULATED attestations are non-binding illustrations. */
  simulated: boolean;
}

/**
 * §47 Protected Backing Cell — the 17 canonical fields plus operational
 * companion fields needed to enforce the anti-double-count rule and to
 * compute AvailableBacking.
 *
 * The 17 canonical fields (in spec order):
 *   1.  backingId
 *   2.  institutionId
 *   3.  asset
 *   4.  quantity
 *   5.  valuation
 *   6.  haircut
 *   7.  legalStatus
 *   8.  custodian
 *   9.  jurisdiction
 *   10. encumbranceStatus
 *   11. allocationStatus
 *   12. utilizedAmount
 *   13. availableAmount
 *   14. evidence
 *   15. verificationTimestamp
 *   16. effectiveDate
 *   17. expiry
 *
 * Operational companion fields (kept for anti-double-count enforcement and
 * AvailableBacking computation — not part of the canonical 17 but required
 * for the §47 formula and invariant):
 *   - encumberedAmount       (drives the EncumberedBacking term)
 *   - allocatedObligationIds (max 1 enforced — the anti-double-count)
 *   - custodianTier          (drives eligibility rules)
 *   - jurisdictionRisk       (drives eligibility rules)
 */
export interface ProtectedBackingCell {
  // --- 17 canonical fields -------------------------------------------------
  backingId: string;               // 1. unique PBC identifier
  institutionId: string;          // 2. owning/pledging institution
  asset: ProtectedBackingAsset;   // 3. asset descriptor
  quantity: number;               // 4. Q (units of the asset)
  valuation: number;              // 5. V = Q × P (current market valuation, USD)
  haircut: number;                // 6. H (0–1, applied to valuation)
  legalStatus: LegalStatus;       // 7. legal title / pledge status
  custodian: string;              // 8. custodian identifier
  jurisdiction: string;           // 9. ISO-3166 jurisdiction code
  encumbranceStatus: EncumbranceStatus; // 10. encumbrance status
  allocationStatus: AllocationStatus;  // 11. allocation status
  utilizedAmount: number;          // 12. AlreadyAllocatedBacking (USD)
  availableAmount: number;         // 13. AvailableBacking (USD, computed)
  evidence: ProtectedBackingEvidence;  // 14. §73 evidence package
  verificationTimestamp: string;   // 15. ISO 8601 — last independent verification
  effectiveDate: string;           // 16. ISO date — pledge effective date
  expiry: string;                  // 17. ISO date — pledge expiry

  // --- operational companion fields (not in canonical 17) -----------------
  /** Numeric encumbrance amount (USD). Drives EncumberedBacking. */
  encumberedAmount: number;
  /** MTQ obligation IDs this cell currently supports. Max 1 enforced. */
  allocatedObligationIds: string[];
  /** Custodian tier — drives eligibility rules. */
  custodianTier: CustodianTier;
  /** Jurisdiction risk classification — drives eligibility rules. */
  jurisdictionRisk: JurisdictionRisk;
  /** Honest flag — TRUE for SIMULATED reference cells, FALSE only when a live institution attests. */
  simulated: boolean;
}

// ----------------------------------------------------------------------------
// §47 FORMULA — AvailableBacking = Recognized − Encumbered − AlreadyAllocated
// ----------------------------------------------------------------------------

export interface AvailableBackingComputation {
  /** Recognized = valuation × (1 − haircut). */
  recognizedBacking: number;
  /** Encumbered portion (USD). */
  encumberedBacking: number;
  /** Already-allocated portion (USD) = utilizedAmount. */
  alreadyAllocatedBacking: number;
  /** AvailableBacking = Recognized − Encumbered − AlreadyAllocated (USD). */
  availableBacking: number;
  /** Whether the available backing is non-negative. */
  nonNegative: boolean;
  /** The canonical formula, as a string for evidence packages. */
  formula: string;
}

/** The canonical §47 formula string. */
export const PBC_FORMULA =
  "AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking";

/** The anti-double-count rule string. */
export const PBC_ANTI_DOUBLE_COUNT_RULE =
  "A single backing must never support multiple MTQ obligations; " +
  "a Protected Backing Cell may be allocated to at most one mtqObligationId at a time.";

/**
 * Compute the §47 AvailableBacking for a PBC.
 *
 *   RecognizedBacking       = valuation × (1 − haircut)
 *   EncumberedBacking       = encumberedAmount   (clamped to [0, recognizedBacking])
 *   AlreadyAllocatedBacking = utilizedAmount      (clamped to [0, recognizedBacking])
 *   AvailableBacking        = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking
 *
 * If the terms exceed RecognizedBacking, AvailableBacking is clamped to 0 and
 * `nonNegative` is set to false (a constitutional breach condition).
 */
export function computeAvailableBacking(cell: ProtectedBackingCell): AvailableBackingComputation {
  const recognizedBacking = round2(cell.valuation * (1 - cell.haircut));
  const encumberedBacking = clamp(
    round2(cell.encumberedAmount),
    0,
    recognizedBacking,
  );
  const alreadyAllocatedBacking = clamp(
    round2(cell.utilizedAmount),
    0,
    recognizedBacking,
  );
  const rawAvailable = round2(
    recognizedBacking - encumberedBacking - alreadyAllocatedBacking,
  );
  const availableBacking = Math.max(0, rawAvailable);
  return {
    recognizedBacking,
    encumberedBacking,
    alreadyAllocatedBacking,
    availableBacking,
    nonNegative: rawAvailable >= 0,
    formula: PBC_FORMULA,
  };
}

// ----------------------------------------------------------------------------
// Anti-double-count — allocate / release / verify
// ----------------------------------------------------------------------------

export type AllocationResult =
  | { ok: true; cell: ProtectedBackingCell; allocatedAmount: number; mtqObligationId: string }
  | { ok: false; reason: string; cell: ProtectedBackingCell };

/**
 * Allocate backing from a PBC to a single MTQ obligation.
 *
 * ANTI-DOUBLE-COUNT (critical §47 rule): if the cell is already allocated to a
 * DIFFERENT mtqObligationId, the allocation is REJECTED. The same backing
 * must never support multiple MTQ obligations. Same-obligation top-up is
 * permitted (e.g., to increase utilization on the same obligation), subject
 * to available-capacity constraints.
 *
 * Capacity check: the post-allocation utilizedAmount must not exceed
 * AvailableBacking (Recognized − Encumbered − AlreadyAllocated).
 */
export function allocateBacking(
  cell: ProtectedBackingCell,
  amount: number,
  mtqObligationId: string,
): AllocationResult {
  if (amount <= 0) {
    return { ok: false, reason: "amount must be positive", cell };
  }
  if (!mtqObligationId || mtqObligationId.trim() === "") {
    return { ok: false, reason: "mtqObligationId is required", cell };
  }

  // Anti-double-count: the cell may support AT MOST ONE distinct obligation.
  const existingOther = cell.allocatedObligationIds.find(
    (id) => id !== mtqObligationId,
  );
  if (existingOther !== undefined) {
    return {
      ok: false,
      reason:
        `anti-double-count violation: backing ${cell.backingId} is already ` +
        `allocated to MTQ obligation '${existingOther}'; cannot also support '${mtqObligationId}'`,
      cell,
    };
  }

  const avail = computeAvailableBacking(cell);
  const newUtilized = round2(cell.utilizedAmount + amount);
  if (newUtilized > avail.availableBacking + 1e-6) {
    return {
      ok: false,
      reason:
        `insufficient available backing: requested ${amount} ` +
        `(would bring utilized to ${newUtilized}); available = ${avail.availableBacking}`,
      cell,
    };
  }

  const obligationIds =
    cell.allocatedObligationIds.includes(mtqObligationId)
      ? cell.allocatedObligationIds
      : [...cell.allocatedObligationIds, mtqObligationId];

  const updated: ProtectedBackingCell = {
    ...cell,
    utilizedAmount: newUtilized,
    availableAmount: round2(avail.availableBacking - amount),
    allocatedObligationIds: obligationIds,
    allocationStatus:
      newUtilized >= avail.recognizedBacking - avail.encumberedBacking - 1e-6
        ? "ALLOCATED"
        : "PARTIALLY_ALLOCATED",
  };
  return { ok: true, cell: updated, allocatedAmount: amount, mtqObligationId };
}

export type ReleaseResult =
  | { ok: true; cell: ProtectedBackingCell; releasedAmount: number; mtqObligationId: string }
  | { ok: false; reason: string; cell: ProtectedBackingCell };

/**
 * Release the allocation of a PBC to a given MTQ obligation.
 *
 * If the cell is allocated to `mtqObligationId`, the utilizedAmount is reset
 * to 0 and the obligation id is removed from `allocatedObligationIds`.
 * If the cell is NOT allocated to that obligation, returns ok:false with a
 * descriptive reason (no mutation).
 */
export function releaseAllocation(
  cell: ProtectedBackingCell,
  mtqObligationId: string,
): ReleaseResult {
  if (!cell.allocatedObligationIds.includes(mtqObligationId)) {
    return {
      ok: false,
      reason:
        `backing ${cell.backingId} is not allocated to MTQ obligation '${mtqObligationId}'`,
      cell,
    };
  }
  const released = cell.utilizedAmount;
  const updated: ProtectedBackingCell = {
    ...cell,
    utilizedAmount: 0,
    availableAmount: round2(
      computeAvailableBacking({ ...cell, utilizedAmount: 0 }).availableBacking,
    ),
    allocatedObligationIds: cell.allocatedObligationIds.filter(
      (id) => id !== mtqObligationId,
    ),
    allocationStatus: "RELEASED",
  };
  return {
    ok: true,
    cell: updated,
    releasedAmount: released,
    mtqObligationId,
  };
}

export interface DoubleCountViolation {
  backingId: string;
  institutionId: string;
  allocatedObligationIds: string[];
  violation: string;
}

/**
 * Scan a set of PBCs and return any that violate the anti-double-count rule
 * (i.e., support more than one MTQ obligation). Returns an empty array if
 * all cells are clean.
 *
 * This is a verification primitive — the `allocateBacking` function already
 * prevents double-count at mutation time, but `verifyNoDoubleCount` is the
 * independent audit pass used by the reconciliation/monitoring layer.
 */
export function verifyNoDoubleCount(
  cells: ProtectedBackingCell[],
): DoubleCountViolation[] {
  const violations: DoubleCountViolation[] = [];
  for (const cell of cells) {
    const distinct = new Set(cell.allocatedObligationIds);
    if (distinct.size > 1) {
      violations.push({
        backingId: cell.backingId,
        institutionId: cell.institutionId,
        allocatedObligationIds: [...cell.allocatedObligationIds],
        violation:
          `backing ${cell.backingId} supports ${distinct.size} distinct MTQ obligations ` +
          `(${Array.from(distinct).join(", ")}); anti-double-count rule violated`,
      });
    }
  }
  return violations;
}

// ----------------------------------------------------------------------------
// Encumbrance + eligibility checks
// ----------------------------------------------------------------------------

export interface EncumbranceReport {
  encumbranceStatus: EncumbranceStatus;
  encumberedAmount: number;
  /** Recognized − encumbered (pre-allocation free backing). */
  freeBeforeAllocation: number;
  blocked: boolean;
  note: string;
}

/**
 * Return the encumbrance status of a PBC, including the recognized-minus-
 * encumbered figure (the pre-allocation free backing).
 */
export function checkEncumbrance(cell: ProtectedBackingCell): EncumbranceReport {
  const avail = computeAvailableBacking(cell);
  const freeBeforeAllocation = round2(
    avail.recognizedBacking - avail.encumberedBacking,
  );
  const blocked =
    cell.encumbranceStatus === "FROZEN" ||
    cell.encumbranceStatus === "ENCUMBERED";
  const note =
    cell.encumbranceStatus === "FROZEN"
      ? "cell is subject to a regulator/court-ordered freeze; cannot be allocated"
      : cell.encumbranceStatus === "ENCUMBERED"
        ? "cell is fully encumbered by a perfected third-party security interest"
        : cell.encumbranceStatus === "PARTIALLY_ENCUMBERED"
          ? "a portion of the cell is subject to a perfected security interest"
          : cell.encumbranceStatus === "PLEDGED_TO_MITHQAL"
            ? "cell is pledged exclusively to support MTQ issuance"
            : cell.encumbranceStatus === "PENDING_RELEASE"
              ? "encumbrance release is in process; not yet free"
              : "cell is free of third-party encumbrance";
  return {
    encumbranceStatus: cell.encumbranceStatus,
    encumberedAmount: avail.encumberedBacking,
    freeBeforeAllocation,
    blocked,
    note,
  };
}

/**
 * Apply §47 eligibility rules to a PBC. Returns the aggregated lifecycle
 * status with a color (amber/emerald/red/gray — never indigo/blue) and the
 * list of failure/condition reasons.
 *
 * Eligibility rules:
 *   - legalStatus must be CLEARED or CONFIRMED.
 *   - evidence.evidenceState must be ≥ INTEGRATED (TESTED or higher preferred).
 *   - verificationTimestamp must be present and within the past 90 days.
 *   - expiry must be in the future.
 *   - custodianTier must not be TIER4_SELF_CUSTODY or TIER_UNKNOWN.
 *   - jurisdictionRisk must be APPROVED (not WATCH/SANCTIONED/UNKNOWN).
 *   - encumbranceStatus must NOT be FROZEN or ENCUMBERED.
 *   - haircut must be ≤ 0.20 (constitutional sanity ceiling).
 *   - quantity and valuation must be positive.
 */
export function isEligibleAsBacking(cell: ProtectedBackingCell): ProtectedBackingCellStatus {
  const reasons: string[] = [];
  const now = new Date();

  if (cell.legalStatus !== "CLEARED" && cell.legalStatus !== "CONFIRMED") {
    reasons.push(`legalStatus is ${cell.legalStatus} (must be CLEARED or CONFIRMED)`);
  }

  const stateRank = PBC_EVIDENCE_STATES.indexOf(cell.evidence.evidenceState);
  const integratedRank = PBC_EVIDENCE_STATES.indexOf("INTEGRATED");
  if (stateRank < integratedRank) {
    reasons.push(
      `evidence state ${cell.evidence.evidenceState} is below INTEGRATED (§73 minimum for backing)`,
    );
  }

  const vts = cell.verificationTimestamp ? new Date(cell.verificationTimestamp) : null;
  if (!vts || isNaN(vts.getTime())) {
    reasons.push("verificationTimestamp is missing or invalid");
  } else {
    const ageDays = (now.getTime() - vts.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 0) {
      reasons.push(`verificationTimestamp is in the future (${cell.verificationTimestamp})`);
    } else if (ageDays > 90) {
      reasons.push(`verification is stale (${ageDays.toFixed(0)} days old; limit 90)`);
    }
  }

  const exp = cell.expiry ? new Date(cell.expiry) : null;
  if (!exp || isNaN(exp.getTime())) {
    reasons.push("expiry is missing or invalid");
  } else if (exp.getTime() < now.getTime()) {
    reasons.push(`cell has expired (expiry ${cell.expiry})`);
  }

  const eff = cell.effectiveDate ? new Date(cell.effectiveDate) : null;
  if (!eff || isNaN(eff.getTime())) {
    reasons.push("effectiveDate is missing or invalid");
  } else if (eff.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
    reasons.push(`effectiveDate is in the future (${cell.effectiveDate})`);
  }

  if (cell.custodianTier === "TIER4_SELF_CUSTODY" || cell.custodianTier === "TIER_UNKNOWN") {
    reasons.push(`custodianTier ${cell.custodianTier} is not acceptable`);
  }

  if (cell.jurisdictionRisk !== "APPROVED") {
    reasons.push(`jurisdictionRisk is ${cell.jurisdictionRisk} (must be APPROVED)`);
  }

  if (cell.encumbranceStatus === "FROZEN" || cell.encumbranceStatus === "ENCUMBERED") {
    reasons.push(`encumbranceStatus ${cell.encumbranceStatus} blocks backing eligibility`);
  }

  if (cell.haircut < 0 || cell.haircut > 0.20) {
    reasons.push(`haircut ${cell.haircut} is outside [0, 0.20] constitutional ceiling`);
  }

  if (cell.quantity <= 0) {
    reasons.push(`quantity ${cell.quantity} must be positive`);
  }
  if (cell.valuation <= 0) {
    reasons.push(`valuation ${cell.valuation} must be positive`);
  }

  // Anti-double-count — if the cell already supports multiple obligations it
  // is never eligible until remediated.
  if (new Set(cell.allocatedObligationIds).size > 1) {
    reasons.push(
      `cell supports multiple MTQ obligations (${cell.allocatedObligationIds.join(", ")}); anti-double-count violation`,
    );
  }

  if (reasons.length === 0) {
    return {
      status: "ELIGIBLE",
      color: "emerald",
      reasons: ["all §47 eligibility checks passed"],
    };
  }

  // Expired takes precedence over INELIGIBLE.
  const expired =
    cell.expiry && !isNaN(new Date(cell.expiry).getTime())
      ? new Date(cell.expiry).getTime() < now.getTime()
      : false;
  if (expired) {
    return { status: "EXPIRED", color: "amber", reasons };
  }
  if (cell.legalStatus === "LIQUIDATED") {
    return { status: "LIQUIDATED", color: "red", reasons };
  }

  // If the only failures are evidence-state progression / pending review,
  // classify as PENDING_VERIFICATION rather than INELIGIBLE.
  const onlyPending = reasons.every((r) =>
    /evidence state|verification is stale|verificationTimestamp is missing/.test(r),
  );
  if (onlyPending) {
    return { status: "PENDING_VERIFICATION", color: "amber", reasons };
  }

  // If there are non-blocking conditions but the cell is still usable
  // (e.g., haircut near ceiling, partial encumbrance), mark conditional.
  const conditional =
    reasons.length === 1 &&
    /haircut|PARTIALLY_ENCUMBERED|PENDING_RELEASE/.test(reasons[0]);
  if (conditional) {
    return { status: "ELIGIBLE_WITH_CONDITIONS", color: "amber", reasons };
  }

  return { status: "INELIGIBLE", color: "red", reasons };
}

// ----------------------------------------------------------------------------
// PBC creation
// ----------------------------------------------------------------------------

export interface CreateProtectedBackingCellInput {
  backingId: string;
  institutionId: string;
  asset: ProtectedBackingAsset;
  quantity: number;
  valuation: number;
  haircut: number;
  legalStatus: LegalStatus;
  custodian: string;
  custodianTier: CustodianTier;
  jurisdiction: string;
  jurisdictionRisk: JurisdictionRisk;
  encumbranceStatus: EncumbranceStatus;
  encumberedAmount?: number;
  evidence: ProtectedBackingEvidence;
  verificationTimestamp: string;
  effectiveDate: string;
  expiry: string;
  simulated?: boolean;
}

export type CreateResult =
  | { ok: true; cell: ProtectedBackingCell }
  | { ok: false; reason: string; errors: string[] };

/**
 * Validate input and create a Protected Backing Cell.
 *
 * Validation:
 *   - backingId and institutionId are non-empty.
 *   - quantity and valuation are positive.
 *   - haircut is in [0, 1].
 *   - encumbranceStatus / encumberedAmount are consistent.
 *   - effectiveDate < expiry.
 *   - evidence.evidenceState is a known §73 state.
 *   - allocatedObligationIds is empty on creation (no pre-existing allocation).
 *
 * On success, utilizedAmount is 0, availableAmount is computed, allocationStatus
 * is UNALLOCATED.
 */
export function createProtectedBackingCell(
  input: CreateProtectedBackingCellInput,
): CreateResult {
  const errors: string[] = [];

  if (!input.backingId?.trim()) errors.push("backingId is required");
  if (!input.institutionId?.trim()) errors.push("institutionId is required");
  if (!input.asset?.name?.trim()) errors.push("asset.name is required");
  if (!(input.quantity > 0)) errors.push("quantity must be positive");
  if (!(input.valuation > 0)) errors.push("valuation must be positive");
  if (input.haircut < 0 || input.haircut > 1) {
    errors.push("haircut must be in [0, 1]");
  }

  const enc = input.encumberedAmount ?? 0;
  if (enc < 0) errors.push("encumberedAmount must be ≥ 0");
  if (enc > input.valuation) {
    errors.push("encumberedAmount must not exceed valuation");
  }
  if (
    (input.encumbranceStatus === "FREE" && enc > 0) ||
    (input.encumbranceStatus === "ENCUMBERED" &&
      enc < input.valuation * (1 - input.haircut))
  ) {
    errors.push(
      `encumbranceStatus ${input.encumbranceStatus} is inconsistent with encumberedAmount ${enc}`,
    );
  }

  const eff = new Date(input.effectiveDate);
  const exp = new Date(input.expiry);
  if (isNaN(eff.getTime())) errors.push("effectiveDate is invalid");
  if (isNaN(exp.getTime())) errors.push("expiry is invalid");
  if (!isNaN(eff.getTime()) && !isNaN(exp.getTime()) && eff.getTime() >= exp.getTime()) {
    errors.push("effectiveDate must be before expiry");
  }

  const vts = new Date(input.verificationTimestamp);
  if (isNaN(vts.getTime())) errors.push("verificationTimestamp is invalid");

  if (!PBC_EVIDENCE_STATES.includes(input.evidence.evidenceState)) {
    errors.push(
      `evidence.evidenceState ${input.evidence.evidenceState} is not a known §73 state`,
    );
  }

  if (errors.length > 0) {
    return { ok: false, reason: "validation failed", errors };
  }

  const baseCell: ProtectedBackingCell = {
    backingId: input.backingId,
    institutionId: input.institutionId,
    asset: input.asset,
    quantity: input.quantity,
    valuation: round2(input.valuation),
    haircut: input.haircut,
    legalStatus: input.legalStatus,
    custodian: input.custodian,
    custodianTier: input.custodianTier,
    jurisdiction: input.jurisdiction,
    jurisdictionRisk: input.jurisdictionRisk,
    encumbranceStatus: input.encumbranceStatus,
    encumberedAmount: round2(enc),
    allocationStatus: "UNALLOCATED",
    utilizedAmount: 0,
    availableAmount: 0, // computed below
    evidence: input.evidence,
    verificationTimestamp: input.verificationTimestamp,
    effectiveDate: input.effectiveDate,
    expiry: input.expiry,
    allocatedObligationIds: [],
    simulated: input.simulated ?? true, // default SIMULATED
  };
  baseCell.availableAmount = computeAvailableBacking(baseCell).availableBacking;
  return { ok: true, cell: baseCell };
}

// ----------------------------------------------------------------------------
// Evidence package generation
// ----------------------------------------------------------------------------

export interface ProtectedBackingEvidencePackage {
  evidencePackageId: string;
  generatedAt: string;
  module: typeof MODULE_ID;
  section: typeof PBC_SECTION;
  cellCount: number;
  totals: {
    recognizedBacking: number;
    encumberedBacking: number;
    alreadyAllocatedBacking: number;
    availableBacking: number;
  };
  doubleCountViolations: DoubleCountViolation[];
  perCell: Array<{
    backingId: string;
    institutionId: string;
    evidenceState: ProtectedBackingEvidenceState;
    simulated: boolean;
    availableBacking: number;
    eligibility: ProtectedBackingCellStatus;
    attestations: ProtectedBackingAttestation[];
  }>;
  honestState: ReturnType<typeof protectedBackingHonestState>;
  formula: typeof PBC_FORMULA;
  antiDoubleCountRule: typeof PBC_ANTI_DOUBLE_COUNT_RULE;
}

/**
 * Generate an evidence package for a set of PBCs — bundles per-cell evidence
 * records, the aggregated totals, double-count violations, eligibility
 * statuses, and the §74 honest-state declaration.
 */
export function generateProtectedBackingEvidence(
  cells: ProtectedBackingCell[],
): ProtectedBackingEvidencePackage {
  const violations = verifyNoDoubleCount(cells);
  let recognized = 0;
  let encumbered = 0;
  let allocated = 0;
  let available = 0;
  for (const c of cells) {
    const a = computeAvailableBacking(c);
    recognized += a.recognizedBacking;
    encumbered += a.encumberedBacking;
    allocated += a.alreadyAllocatedBacking;
    available += a.availableBacking;
  }
  return {
    evidencePackageId: `pbc-evidence-${Date.now().toString(36)}`,
    generatedAt: new Date().toISOString(),
    module: MODULE_ID,
    section: PBC_SECTION,
    cellCount: cells.length,
    totals: {
      recognizedBacking: round2(recognized),
      encumberedBacking: round2(encumbered),
      alreadyAllocatedBacking: round2(allocated),
      availableBacking: round2(available),
    },
    doubleCountViolations: violations,
    perCell: cells.map((c) => ({
      backingId: c.backingId,
      institutionId: c.institutionId,
      evidenceState: c.evidence.evidenceState,
      simulated: c.simulated,
      availableBacking: computeAvailableBacking(c).availableBacking,
      eligibility: isEligibleAsBacking(c),
      attestations: c.evidence.attestations,
    })),
    honestState: protectedBackingHonestState(),
    formula: PBC_FORMULA,
    antiDoubleCountRule: PBC_ANTI_DOUBLE_COUNT_RULE,
  };
}

// ----------------------------------------------------------------------------
// §74 Honest-state declaration
// ----------------------------------------------------------------------------

/**
 * §74 honest-state declaration for the PBC module.
 *
 * - protectedBackingModelImplemented = true  → the model/code is implemented.
 * - protectedBackingLiveCells = 0            → NO live cell has been contracted;
 *   every reference cell is SIMULATED/SPECIFIED, not a live institutional pledge.
 *
 * This pair is the honest-state contract for §47.
 */
export function protectedBackingHonestState(): {
  protectedBackingModelImplemented: true;
  protectedBackingLiveCells: 0;
} {
  return {
    protectedBackingModelImplemented: true,
    protectedBackingLiveCells: 0,
  };
}

// ----------------------------------------------------------------------------
// Reference / demo dataset — SIMULATED cells (liveCells = 0)
// ----------------------------------------------------------------------------
//
// The following reference cells are ILLUSTRATIVE. No real institution, bank,
// custodian, or asset is contracted. The institutions named below are
// plausible institutional counterparties used to make the data shape
// concrete — they are NOT live contractual relationships. Per §74 the
// honest-state contract reports protectedBackingLiveCells = 0 for these.

/**
 * Build a set of illustrative reference Protected Backing Cells. Three cells
 * covering the three §42 core sleeves: front-line fiat (cash), allocated
 * physical gold, and a regulated-issuer stablecoin (USDC).
 *
 * All cells are SIMULATED with TESTED evidence state (NOT PRODUCTION_READY).
 * Per §74, protectedBackingLiveCells = 0.
 */
export function buildReferenceProtectedBackingCells(): ProtectedBackingCell[] {
  const now = new Date();
  const verificationTimestamp = now.toISOString();
  const effectiveDate = now.toISOString().slice(0, 10);
  // Pledges are illustrated as 12-month terms.
  const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const mkAttestation = (
    kind: ProtectedBackingAttestation["kind"],
    attester: string,
    daysAgo: number,
  ): ProtectedBackingAttestation => ({
    kind,
    attester,
    at: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    evidenceHash: `sha256:sim:${kind}:${attester.toLowerCase().replace(/\s+/g, "-")}`,
    simulated: true,
  });

  // ---- Cell 1: USD cash at a regulated US bank (front-line fiat) ----------
  const usdCash = createProtectedBackingCell({
    backingId: "pbc-usd-cash-001",
    institutionId: "inst-bank-ny-001",
    asset: {
      type: "fiat-cash",
      name: "USD demand deposit (HQLA-1 cash)",
      currency: "USD",
    },
    quantity: 65_000_000,
    valuation: 65_000_000, // 1:1 USD
    haircut: 0.0,
    legalStatus: "CLEARED",
    custodian: "SIMULATED — regulated US bank custodian (NY)",
    custodianTier: "TIER1_REGULATED_BANK",
    jurisdiction: "US-NY",
    jurisdictionRisk: "APPROVED",
    encumbranceStatus: "PLEDGED_TO_MITHQAL",
    encumberedAmount: 0,
    evidence: {
      evidenceState: "TESTED",
      lastTransitionAt: verificationTimestamp,
      simulated: true,
      attestations: [
        mkAttestation("custodian_attestation", "SIMULATED — bank treasury", 5),
        mkAttestation("independent_audit", "SIMULATED — Big-4 audit firm", 12),
      ],
    },
    verificationTimestamp,
    effectiveDate,
    expiry,
    simulated: true,
  });

  // ---- Cell 2: Allocated physical gold at a specialist custodian ----------
  const gold = createProtectedBackingCell({
    backingId: "pbc-xau-allocated-001",
    institutionId: "inst-bullion-custodian-lon-001",
    asset: {
      type: "gold-physical-allocated",
      name: "Allocated physical gold (Good Delivery bars)",
    },
    quantity: 12_000, // troy ounces
    valuation: 23_400_000, // ~$1,950/oz illustrative
    haircut: 0.02,
    legalStatus: "CONFIRMED",
    custodian: "SIMULATED — LBMA bullion custodian (London vault)",
    custodianTier: "TIER2_SPECIALIST_CUSTODIAN",
    jurisdiction: "GB-ENG",
    jurisdictionRisk: "APPROVED",
    encumbranceStatus: "PLEDGED_TO_MITHQAL",
    encumberedAmount: 0,
    evidence: {
      evidenceState: "TESTED",
      lastTransitionAt: verificationTimestamp,
      simulated: true,
      attestations: [
        mkAttestation("custodian_attestation", "SIMULATED — vault operator", 7),
        mkAttestation("legal_opinion", "SIMULATED — London counsel", 18),
        mkAttestation("independent_audit", "SIMULATED — LBMA auditor", 20),
      ],
    },
    verificationTimestamp,
    effectiveDate,
    expiry,
    simulated: true,
  });

  // ---- Cell 3: USDC at a regulated stablecoin issuer ----------------------
  const usdc = createProtectedBackingCell({
    backingId: "pbc-usdc-001",
    institutionId: "inst-stablecoin-issuer-001",
    asset: {
      type: "digital-stablecoin",
      name: "USDC (regulated stablecoin)",
      currency: "USDC",
      tokenId: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      chain: "ethereum",
    },
    quantity: 2_600_000,
    valuation: 2_600_000, // 1:1 USD peg
    haircut: 0.03,
    legalStatus: "CONFIRMED",
    custodian: "SIMULATED — regulated money-transmitter / issuer",
    custodianTier: "TIER2_SPECIALIST_CUSTODIAN",
    jurisdiction: "US-NY",
    jurisdictionRisk: "APPROVED",
    encumbranceStatus: "PLEDGED_TO_MITHQAL",
    encumberedAmount: 0,
    evidence: {
      evidenceState: "TESTED",
      lastTransitionAt: verificationTimestamp,
      simulated: true,
      attestations: [
        mkAttestation("smart_contract_proof", "SIMULATED — on-chain proof-of-reserves", 2),
        mkAttestation("off_chain_receipt", "SIMULATED — issuer attestation report", 3),
        mkAttestation("regulator_no_objection", "SIMULATED — NYDFS-regulated issuer", 30),
      ],
    },
    verificationTimestamp,
    effectiveDate,
    expiry,
    simulated: true,
  });

  // ---- Cell 4: short-duration US Treasury at a regulated custodian --------
  const ust = createProtectedBackingCell({
    backingId: "pbc-ust-001",
    institutionId: "inst-bank-ny-001",
    asset: {
      type: "fiat-sovereign",
      name: "US Treasury Bill (3-month)",
      currency: "USD",
      isin: "US9127973C91", // SIMULATED ISIN — illustrative only
    },
    quantity: 39_000_000,
    valuation: 39_000_000,
    haircut: 0.01,
    legalStatus: "CLEARED",
    custodian: "SIMULATED — regulated US bank custody",
    custodianTier: "TIER1_REGULATED_BANK",
    jurisdiction: "US-NY",
    jurisdictionRisk: "APPROVED",
    encumbranceStatus: "PARTIALLY_ENCUMBERED",
    encumberedAmount: 2_000_000, // small pre-existing security interest, illustrative
    evidence: {
      evidenceState: "TESTED",
      lastTransitionAt: verificationTimestamp,
      simulated: true,
      attestations: [
        mkAttestation("custodian_attestation", "SIMULATED — bank custody ops", 4),
        mkAttestation("independent_audit", "SIMULATED — custody auditor", 15),
      ],
    },
    verificationTimestamp,
    effectiveDate,
    expiry,
    simulated: true,
  });

  const cells: ProtectedBackingCell[] = [];
  for (const r of [usdCash, gold, usdc, ust]) {
    if (r.ok) cells.push(r.cell);
  }
  return cells;
}

// ----------------------------------------------------------------------------
// §47 Report — schema + formula + honest state + reference cells
// ----------------------------------------------------------------------------

export interface ProtectedBackingCellReport {
  moduleId: typeof MODULE_ID;
  section: typeof PBC_SECTION;
  schema: Array<{ index: number; field: string; type: string; description: string }>;
  formula: typeof PBC_FORMULA;
  antiDoubleCountRule: typeof PBC_ANTI_DOUBLE_COUNT_RULE;
  evidenceStates: readonly ProtectedBackingEvidenceState[];
  canonicalEvidenceStates: ProtectedBackingEvidenceState[];
  honestState: ReturnType<typeof protectedBackingHonestState>;
  eligibilityRules: string[];
  referenceCells: ProtectedBackingCell[];
  referenceCellsLive: number; // always 0 per §74
  finalStatus: string;
  finalStatusColor: StatusColor;
}

/**
 * Generate a summary report for the §47 Protected Backing Cell module:
 * the 17-field schema, the §47 formula, the anti-double-count rule, the §73
 * evidence-state vocabulary, the §74 honest-state declaration, and the
 * SIMULATED reference cells.
 */
export function generateProtectedBackingCellReport(): ProtectedBackingCellReport {
  const referenceCells = buildReferenceProtectedBackingCells();
  return {
    moduleId: MODULE_ID,
    section: PBC_SECTION,
    schema: [
      { index: 1, field: "backingId", type: "string", description: "Unique PBC identifier" },
      { index: 2, field: "institutionId", type: "string", description: "Owning/pledging institution identifier" },
      { index: 3, field: "asset", type: "ProtectedBackingAsset", description: "Asset descriptor (type, name, currency, ISIN, tokenId, chain)" },
      { index: 4, field: "quantity", type: "number", description: "Q — units of the asset" },
      { index: 5, field: "valuation", type: "number", description: "V = Q × P (current market valuation, USD)" },
      { index: 6, field: "haircut", type: "number [0,1]", description: "H — constitutional haircut applied to valuation" },
      { index: 7, field: "legalStatus", type: "LegalStatus", description: "Legal title / pledge status" },
      { index: 8, field: "custodian", type: "string", description: "Custodian identifier" },
      { index: 9, field: "jurisdiction", type: "string", description: "ISO-3166 jurisdiction code" },
      { index: 10, field: "encumbranceStatus", type: "EncumbranceStatus", description: "Encumbrance status (FREE / PARTIALLY_ENCUMBERED / ENCUMBERED / FROZEN / PLEDGED_TO_MITHQAL / PENDING_RELEASE)" },
      { index: 11, field: "allocationStatus", type: "AllocationStatus", description: "Allocation status (UNALLOCATED / ALLOCATED / PARTIALLY_ALLOCATED / RESERVED / RELEASED)" },
      { index: 12, field: "utilizedAmount", type: "number", description: "AlreadyAllocatedBacking (USD) — utilized against an MTQ obligation" },
      { index: 13, field: "availableAmount", type: "number", description: "AvailableBacking (USD) — computed = Recognized − Encumbered − AlreadyAllocated" },
      { index: 14, field: "evidence", type: "ProtectedBackingEvidence", description: "§73 evidence package (evidenceState + attestations + simulated flag)" },
      { index: 15, field: "verificationTimestamp", type: "string (ISO 8601)", description: "Last independent verification timestamp" },
      { index: 16, field: "effectiveDate", type: "string (ISO date)", description: "Pledge effective date" },
      { index: 17, field: "expiry", type: "string (ISO date)", description: "Pledge expiry date" },
    ],
    formula: PBC_FORMULA,
    antiDoubleCountRule: PBC_ANTI_DOUBLE_COUNT_RULE,
    evidenceStates: PBC_EVIDENCE_STATES,
    canonicalEvidenceStates: PBC_CANONICAL_EVIDENCE_STATES,
    honestState: protectedBackingHonestState(),
    eligibilityRules: [
      "legalStatus must be CLEARED or CONFIRMED",
      "evidence.evidenceState must be ≥ INTEGRATED (§73 minimum for backing)",
      "verificationTimestamp must be present and within the past 90 days",
      "expiry must be in the future",
      "custodianTier must not be TIER4_SELF_CUSTODY or TIER_UNKNOWN",
      "jurisdictionRisk must be APPROVED",
      "encumbranceStatus must NOT be FROZEN or ENCUMBERED",
      "haircut must be ≤ 0.20 (constitutional sanity ceiling)",
      "quantity and valuation must be positive",
      "cell must support at most one MTQ obligation (anti-double-count)",
    ],
    referenceCells,
    referenceCellsLive: 0, // §74 honest-state invariant
    finalStatus:
      "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED " +
      "(model implemented; 0 live cells; all reference cells SIMULATED)",
    finalStatusColor: "amber",
  };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

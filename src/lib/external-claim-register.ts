/**
 * MITHQAL v26.0 §5.5 — External Claim Register
 *
 * A single canonical list of every external (home-page, marketing,
 * institutional) claim about MITHQAL. Each claim carries an explicit
 * truth label (ClaimStatus). The register is consumed by:
 *   - the home page (ProgramStatus badge),
 *   - the Evidence Fabric API,
 *   - the contradiction-scan / reconciliation pipeline.
 *
 * The register is NOT a list of marketing copy to publish; it is a
 * list of claims that have been ATTETSTED to a specific evidence
 * status. Claims marked UNKNOWN / UNVERIFIED / CONTRADICTED / EXPIRED
 * must NOT be published in their original wording.
 */

import { CLAIM_REGISTRY } from "./claim-registry-data";

export type ClaimStatus =
  | "VERIFIED_PRIMARY_DOCUMENT"
  | "EXECUTED_EXTERNAL_DOCUMENT"
  | "MEASURED"
  | "EXTERNAL_SOURCE"
  | "SIMULATED"
  | "ASSUMED"
  | "UNKNOWN"
  | "UNVERIFIED"
  | "CONTRADICTED"
  | "EXPIRED";

export interface ClaimRecord {
  claimId: string;
  /** Verbatim wording of the claim as it appears (or appeared) on the channel. */
  exactWording: string;
  /** Where the claim appears: "home.hero.h1", "home.program-status.badge", etc. */
  channel: string;
  status: ClaimStatus;
  scope: {
    entity: string;
    jurisdiction: string;
    applicableLaw: string;
  };
  owner: string;
  reviewer: string;
  reviewDate: string;
  expiresAt: string;
  /** References to EvidenceArtifact records or file paths. */
  evidenceRefs: string[];
  limitations: string | null;
  retractionAction: string | null;
  blueprint_ref: string;
}

/**
 * The full canonical registry. Re-exported so consumers can read
 * directly without a function call where convenient.
 */
export const CLAIM_REGISTRY_ALL: readonly ClaimRecord[] = CLAIM_REGISTRY;

/**
 * Look up a single claim by id. Returns null when not found.
 */
export function getClaim(claimId: string): ClaimRecord | null {
  return CLAIM_REGISTRY.find((c) => c.claimId === claimId) ?? null;
}

/**
 * All claims currently in a given status (e.g. all SIMULATED).
 * Useful for the contradiction scan and for marketing review.
 */
export function getClaimsByStatus(status: ClaimStatus): ClaimRecord[] {
  return CLAIM_REGISTRY.filter((c) => c.status === status);
}

/**
 * All claims currently surfaced on a given channel (e.g.
 * "home.hero.h1"). Useful for the page-render audit.
 */
export function getClaimsByChannel(channel: string): ClaimRecord[] {
  return CLAIM_REGISTRY.filter((c) => c.channel === channel);
}

const PUBLISHABLE_STATUSES: ReadonlySet<ClaimStatus> = new Set<ClaimStatus>([
  "VERIFIED_PRIMARY_DOCUMENT",
  "EXECUTED_EXTERNAL_DOCUMENT",
  "MEASURED",
  "EXTERNAL_SOURCE",
  "SIMULATED",
]);

/**
 * Whether a claim is allowed to be published in its current wording.
 * UNKNOWN / UNVERIFIED / CONTRADICTED / EXPIRED / ASSUMED claims
 * must be removed from publication until re-attested.
 */
export function isPublishable(claim: ClaimRecord): boolean {
  if (!claim.expiresAt) {
    return PUBLISHABLE_STATUSES.has(claim.status);
  }
  const expiresMs = Date.parse(claim.expiresAt);
  if (Number.isNaN(expiresMs)) {
    return false;
  }
  return PUBLISHABLE_STATUSES.has(claim.status) && expiresMs > Date.now();
}

/**
 * Short, human-readable truth label for surfacing on the home page.
 * Maps each ClaimStatus to a one-line label that can be shown next to
 * the claim, in a tooltip, or in the program-status block.
 */
export function getTruthLabel(claim: ClaimRecord): string {
  switch (claim.status) {
    case "VERIFIED_PRIMARY_DOCUMENT":
      return "Verified — backed by a primary document currently enforced in code.";
    case "EXECUTED_EXTERNAL_DOCUMENT":
      return "Verified — backed by an executed external document currently in force.";
    case "MEASURED":
      return "Verified — measured from a live, admissible observation.";
    case "EXTERNAL_SOURCE":
      return "Verified — sourced from an external authority with current attestation.";
    case "SIMULATED":
      return "Design target — describes intended v26.0 behavior; not yet observed in production.";
    case "ASSUMED":
      return "Assumption — must not be published without elevation to VERIFIED.";
    case "UNKNOWN":
      return "Unknown — claim must not be published until re-attested.";
    case "UNVERIFIED":
      return "Unverified — claim must not be published.";
    case "CONTRADICTED":
      return "Contradicted — claim has been retracted; see retractionAction.";
    case "EXPIRED":
      return "Expired — claim must be removed from publication and re-attested.";
    default:
      return "Unknown status";
  }
}

// ---------------------------------------------------------------------------
// Legacy-name retraction helper
// ---------------------------------------------------------------------------

/**
 * Returns the published wording for a claim if publishable, or the
 * retraction notice if the claim has been CONTRADICTED. Used by the
 * home page to render either the live wording or a notice that the
 * previous wording was retracted.
 */
export function getPublishableWordingOrRetraction(claimId: string): {
  claimId: string;
  publishable: boolean;
  wording: string | null;
  retraction: string | null;
} {
  const claim = getClaim(claimId);
  if (!claim) {
    return {
      claimId,
      publishable: false,
      wording: null,
      retraction: `Claim ${claimId} not found in register.`,
    };
  }
  if (isPublishable(claim)) {
    return {
      claimId,
      publishable: true,
      wording: claim.exactWording,
      retraction: null,
    };
  }
  return {
    claimId,
    publishable: false,
    wording: null,
    retraction:
      claim.retractionAction ??
      `Claim ${claimId} is ${claim.status} and must not be published in its original wording.`,
  };
}

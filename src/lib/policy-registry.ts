// MITHQAL v25.3.2 — Machine-Readable Policy Registry
//
// Source: MITHQAL-V25.3.2-REMEDIATION-LAYER.md §2 layer 3 (canonical authority hierarchy).
// Owner: Policy Registry Architect (Agent I2).
//
// OVERRIDE-PREVENTION RULES (per §3 of the remediation layer doc):
// - There is exactly ONE active normative model: v25.3.2.
// - Every policy has status ACTIVE | SUPERSEDED | HISTORICAL | PENDING_VALIDATION.
// - Only ACTIVE policies are exposed via runtime diagnostics by default.
// - SUPERSEDED / HISTORICAL / PENDING_VALIDATION are queryable via ?include=
//   for operator audit only — they are NEVER exposed as "current".
// - No historical section may silently override the active model.
// - getActivePolicy(id) throws if no ACTIVE policy exists (no silent fallback
//   to SUPERSEDED values).
//
// CANONICAL AUTHORITY HIERARCHY (per §2 of the remediation layer doc):
//   1. v25.3.2 controlling remediation layer (THE ACTIVE MODEL)
//   2. approved constitutional rules (Constitution v19.0)
//   3. active machine-readable policy registry (THIS FILE)
//   4. validated external legal / regulatory evidence (Agent I3 scope)
//   5. historical material (preserved for traceability only)
//
// Each Policy references its sourceLayer so consumers can audit which layer
// a value came from without re-reading the doc.

export type PolicyStatus =
  | "ACTIVE"
  | "SUPERSEDED"
  | "HISTORICAL"
  | "PENDING_VALIDATION";

export type ValidationStatus =
  | "VALIDATED"
  | "PENDING_VALIDATION"
  | "NOT_REQUIRED";

// Per §2 canonical authority hierarchy (1 = apex, 5 = historical).
export type SourceLayer = 1 | 2 | 3 | 4 | 5;

export interface PolicyPreviousValue {
  /** Version that previously held this value, e.g., "v25.0". */
  fromVersion: string;
  /** The previous value (typed unknown to support any policy value type). */
  value: unknown;
  /** Always "SUPERSEDED" or "HISTORICAL" — never "ACTIVE". */
  status: PolicyStatus;
  /** ISO 8601 date the previous value was replaced. */
  supersededDate: string;
  /** Policy id of the current ACTIVE replacement. */
  supersededBy: string;
}

export interface Policy {
  /** Machine-readable id, UPPER_SNAKE_CASE. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Lifecycle status. ACTIVE values are exposed by default. */
  status: PolicyStatus;
  /** Current effective value (if ACTIVE) or last value (if not ACTIVE). */
  value: unknown;
  /** Prior values — retained for traceability, NEVER exposed as "current". */
  previousValues: PolicyPreviousValue[];
  /** Source citation, e.g., "Constitution v19.0 §22", "v25.3.2 REMEDIATION_LAYER". */
  sourceSection: string;
  /** Authority layer (1=v25.3.2 apex, 2=Constitution, 3=policy-registry, 4=legal evidence, 5=historical). */
  sourceLayer: SourceLayer;
  /** ISO 8601 date the policy became effective in its current form. */
  effectiveDate: string;
  /** ISO 8601 date the policy was superseded (only set when status !== "ACTIVE"). */
  supersededDate?: string;
  /** Policy id that supersedes this one (only set when status === "SUPERSEDED"). */
  supersededBy?: string;
  /** 1-2 sentence human-readable description of the policy. */
  description: string;
  /** Whether this policy has been validated by external legal/regulatory evidence. */
  validationStatus: ValidationStatus;
  /** Source that validated this policy (e.g., "JOZOUR Amendment §1.3"). */
  validatedBy?: string;
  /** Optional operator notes. */
  notes?: string;
}

// === META ===
export const ACTIVE_MODEL = "v25.3.2";
export const POLICY_REGISTRY_VERSION = "1.0.0";
export const POLICY_REGISTRY_SOURCE = "src/lib/policy-registry.ts";

// === THE REGISTRY (alphabetized by id) ===
//
// Counts (must total ≥ 25):
//   - 8 constitutional invariants (layer 2, validated by JOZOUR §1.3)
//   - 5 reserve composition policies (layer 2)
//   - 3 MTQ anchoring policies (layer 1 — v25.3.2 explicitly addresses these)
//   - 2 custody policies (layer 2)
//   - 2 governance policies (layer 2)
//   - 2 institutional neutrality policies (layer 2)
//   - 1 FX policy (layer 3 — registry-level operational policy)
//   - 2 historical markers (layer 5 — preserved for traceability only)
//
// Total: 25 policies.
export const POLICY_REGISTRY: Policy[] = [
  // ========================================================================
  // CONSTITUTIONAL INVARIANTS (8 — per JOZOUR Amendment §1.3)
  // Source: Constitution v19.0 §1 (constitutional invariants).
  // Layer: 2 (Constitution) — these are non-amendable bedrock principles.
  // Validated by JOZOUR Amendment §1.3 (constitutional principle #N).
  // ========================================================================

  {
    id: "FULL_REDEEMABILITY",
    name: "Full Redeemability",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #7)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Every MTQ unit is redeemable on demand for proportional reserves. Redemption is never suspended except in constitutional emergency.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #7: Full Redeemability)",
  },
  {
    id: "GOLD_AS_CONSTITUTIONAL_ANCHOR",
    name: "Gold as Constitutional Anchor",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #8)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Gold remains the permanent constitutional monetary anchor. MTQ is gold-anchored (purchasing power), not USD-fixed.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #8: Gold as Constitutional Anchor)",
  },
  {
    id: "NO_COMMINGLING",
    name: "No Commingling",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #4)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Yield assets never mix with settlement reserves. Three-book separation enforced cryptographically.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #4: No Commingling)",
  },
  {
    id: "NO_DISCRETIONARY_MINTING",
    name: "No Discretionary Minting",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #2)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Minting is permitted only upon verified deposit of equivalent value. No discretionary expansion, ever.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #2: No Discretionary Minting)",
  },
  {
    id: "NO_LENDING_OF_RESERVES",
    name: "No Lending of Reserves",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #3)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "No leverage, no fractional reserve, no rehypothecation of settlement reserves.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #3: No Lending of Reserves)",
  },
  {
    id: "INSTITUTIONAL_NEUTRALITY",
    name: "Institutional Neutrality (umbrella)",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #6)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "No political, economic, or jurisdictional alignment. Demonstrated through verifiable, non-discretionary processes — not by declaration.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #6: Institutional Neutrality)",
    notes:
      "Umbrella invariant. The two operational facets are split into NO_POLITICAL_ALIGNMENT and NO_JURISDICTION_ALIGNMENT (see below).",
  },
  {
    id: "RESERVE_REQUIREMENT_100_PERCENT",
    name: "100%+ Reserve Requirement (constitutional invariant)",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #1)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Reserve Value ≥ Supply Value at all times. The reserve ratio never falls below 100%.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #1: 100%+ Reserve Requirement)",
    notes:
      "Constitutional principle #1. The operational numeric value is RESERVE_RATIO_MINIMUM (see reserve composition below).",
  },
  {
    id: "DETERMINISTIC_MONETARY_ENGINE",
    name: "Deterministic Monetary Engine",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #5)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Identical inputs produce identical outputs. The deterministic v19 monetary engine is the sole state mutator.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #5: Deterministic Monetary Engine)",
  },

  // ========================================================================
  // RESERVE COMPOSITION (5 — Constitution v19.0 §22)
  // Layer: 2 (Constitution) — these are constitutional reserve rules.
  // ========================================================================

  {
    id: "RESERVE_RATIO_MINIMUM",
    name: "Reserve Ratio Minimum",
    status: "ACTIVE",
    value: 1.0, // 100%+ (ratio expressed as a fraction: 1.0 == 100%)
    previousValues: [],
    sourceSection: "Constitution v19.0 §22",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Reserve Value ≥ Supply Value at all times. Reserve ratio must be ≥ 100% (expressed as 1.0).",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #1: 100%+ Reserve Requirement)",
    notes:
      "Numeric expression of constitutional invariant #1. Value 1.0 == 100%. Status ACTIVE per v25.3.2 §4.",
  },
  {
    id: "MIN_GOLD_WEIGHT",
    name: "Minimum Gold Weight",
    status: "ACTIVE",
    value: 0.18, // 18% minimum
    previousValues: [],
    sourceSection: "Constitution v19.0 §22 (gold-anchored basket)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Minimum gold weight in the reserve basket. Gold is the constitutional anchor; the basket floor is 18%.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #8: Gold as Constitutional Anchor)",
    notes: "Fraction (0.18 == 18%). The dominant driver of MTQ's USD baseline per Constitution v19.0 §22.",
  },
  {
    id: "MIN_SILVER_WEIGHT",
    name: "Minimum Silver Weight",
    status: "ACTIVE",
    value: 0.05, // 5% minimum
    previousValues: [],
    sourceSection: "Constitution v19.0 §22 (precious-metals basket)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Minimum silver weight in the reserve basket. Silver is the secondary precious metal anchor.",
    validationStatus: "VALIDATED",
    validatedBy: "Constitution v19.0 §22 (precious-metals basket)",
  },
  {
    id: "MAX_STABLECOIN_WEIGHT",
    name: "Maximum Stablecoin Weight",
    status: "ACTIVE",
    value: 0.3, // 30% ceiling
    previousValues: [],
    sourceSection: "Constitution v19.0 §22 (liquid reserve composition)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Maximum stablecoin weight in the liquid reserve tranche. Capped to preserve redeemability under stress.",
    validationStatus: "VALIDATED",
    validatedBy: "Constitution v19.0 §22 (liquid reserve composition)",
    notes: "Fraction (0.30 == 30% ceiling).",
  },
  {
    id: "MIN_SOVEREIGN_WEIGHT",
    name: "Minimum Sovereign Weight",
    status: "ACTIVE",
    value: 0.5, // 50% minimum across sovereign-grade reserves (gold + silver + sovereign bullion)
    previousValues: [],
    sourceSection: "Constitution v19.0 §22 (sovereign-grade reserves)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Minimum combined weight of sovereign-grade reserves (gold + silver + sovereign bullion).",
    validationStatus: "VALIDATED",
    validatedBy: "Constitution v19.0 §22 (sovereign-grade reserves)",
    notes: "Fraction (0.50 == 50% floor).",
  },

  // ========================================================================
  // MTQ ANCHORING (3 — Constitution v19.0 §6 + v25.3.2 REMEDIATION_LAYER)
  // Layer: 1 (v25.3.2) — these are EXPLICITLY addressed by the active model
  // per the override rule "v25.3.2 controls over v25.3 (parent) and ALL lower
  // layers where v25.3.2 explicitly supersedes."
  // ========================================================================

  {
    id: "MTQ_ANCHOR",
    name: "MTQ Monetary Anchor",
    status: "ACTIVE",
    value: "gold",
    previousValues: [
      {
        fromVersion: "v25.0",
        value: "usd-pegged",
        status: "SUPERSEDED",
        supersededDate: "2026-09-29",
        supersededBy: "MTQ_ANCHOR",
      },
    ],
    sourceSection: "Constitution v19.0 §6 + v25.3.2 REMEDIATION_LAYER",
    sourceLayer: 1,
    effectiveDate: "2026-09-29",
    description:
      "MTQ is gold-anchored (purchasing power), NOT USD-fixed. USD is the baseline for conversion; gold is the constitutional anchor.",
    validationStatus: "VALIDATED",
    validatedBy:
      "JOZOUR Amendment §1.3 (constitutional principle #8: Gold as Constitutional Anchor)",
    notes:
      "Per user directive 2026-09-29 ('MTQ is purchasing power, not fixed to any currency'). Replaces the v25.0 'usd-pegged' interpretation. See H2 worklog for live implementation (/api/mtq-purchasing-power).",
  },
  {
    id: "MTQ_ISSUANCE_MODE",
    name: "MTQ Issuance Mode",
    status: "ACTIVE",
    value: "verified-deposit",
    previousValues: [],
    sourceSection: "Constitution v19.0 §22 + v25.3.2 REMEDIATION_LAYER",
    sourceLayer: 1,
    effectiveDate: "2026-09-29",
    description:
      "MTQ is issued ONLY upon verified deposit of equivalent value. The verified-deposit mode is non-negotiable.",
    validationStatus: "VALIDATED",
    validatedBy:
      "JOZOUR Amendment §1.3 (constitutional principle #2: No Discretionary Minting)",
  },
  {
    id: "MTQ_RETAIL",
    name: "MTQ Retail Availability",
    status: "ACTIVE",
    value: false, // retail issuance is NOT active
    previousValues: [],
    sourceSection: "v25.3.2 REMEDIATION_LAYER §5 (NOT PRODUCTION-AUTHORIZED)",
    sourceLayer: 1,
    effectiveDate: "2026-09-29",
    description:
      "MTQ is NOT available to retail accounts. This release is APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.",
    validationStatus: "VALIDATED",
    validatedBy: "v25.3.2 REMEDIATION_LAYER §5 (NOT PRODUCTION-AUTHORIZED)",
    notes:
      "Reflects the honest-state discipline per Constitution v19.0 §74. Flip to true ONLY after institutional validation gates pass.",
  },

  // ========================================================================
  // CUSTODY (2 — Constitution v19.0 §8 + §22)
  // Layer: 2 (Constitution).
  // ========================================================================

  {
    id: "MITHQAL_CUSTODIES_BACKING",
    name: "MITHQAL Custodies Backing",
    status: "ACTIVE",
    value: false,
    previousValues: [],
    sourceSection: "Constitution v19.0 §8 (custody separation)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "MITHQAL does NOT custody the backing reserves. Backing is held by independent chartered banks and vault operators.",
    validationStatus: "VALIDATED",
    validatedBy: "Constitution v19.0 §8 (custody separation) + JOZOUR Amendment §1.6",
    notes:
      "Explicit prohibition per Constitution v19.0 §8. MITHQAL is the settlement institution, not the custodian.",
  },
  {
    id: "BANK_CUSTODY_REQUIRED",
    name: "Bank Custody Required",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §8 + §22",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Settlement reserves MUST be held by independent chartered custody banks (not MITHQAL, not the protocol).",
    validationStatus: "VALIDATED",
    validatedBy: "Constitution v19.0 §8 (custody separation) + JOZOUR Amendment §1.6",
  },

  // ========================================================================
  // GOVERNANCE (2 — Constitution v19.0 governance articles)
  // Layer: 2 (Constitution).
  // ========================================================================

  {
    id: "COUNCIL_QUORUM",
    name: "Council Quorum",
    status: "ACTIVE",
    value: 5, // 5 of 7 councillors must be present to transact
    previousValues: [],
    sourceSection: "Constitution v19.0 governance articles",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Minimum number of council members required to be present for a binding decision (out of a 7-member council).",
    validationStatus: "VALIDATED",
    validatedBy: "Constitution v19.0 governance articles",
    notes: "Integer. The council is 7 members; quorum is 5.",
  },
  {
    id: "COUNCIL_APPROVAL_THRESHOLD",
    name: "Council Approval Threshold",
    status: "ACTIVE",
    value: "4-of-7", // 4 of 7 affirmative votes required to approve
    previousValues: [],
    sourceSection: "Constitution v19.0 governance articles",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "Minimum affirmative vote count required to approve a binding decision (supermajority of a 7-member council).",
    validationStatus: "VALIDATED",
    validatedBy: "Constitution v19.0 governance articles",
    notes: "Expressed as a 'k-of-n' string for human readability.",
  },

  // ========================================================================
  // INSTITUTIONAL NEUTRALITY (2 — operational facets of invariant #6)
  // Layer: 2 (Constitution).
  // ========================================================================

  {
    id: "NO_POLITICAL_ALIGNMENT",
    name: "No Political Alignment",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #6, operational facet A)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "No political alignment. The institution does not endorse, fund, or favor any political movement, party, or jurisdiction-side position.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #6: Institutional Neutrality)",
  },
  {
    id: "NO_JURISDICTION_ALIGNMENT",
    name: "No Jurisdiction Alignment",
    status: "ACTIVE",
    value: true,
    previousValues: [],
    sourceSection: "Constitution v19.0 §1 (constitutional invariant #6, operational facet B)",
    sourceLayer: 2,
    effectiveDate: "2026-07-22",
    description:
      "No jurisdictional alignment. A settlement between counterparties in any two nations settles with identical finality, cost, and speed.",
    validationStatus: "VALIDATED",
    validatedBy: "JOZOUR Amendment §1.3 (constitutional principle #6: Institutional Neutrality)",
  },

  // ========================================================================
  // FX (1 — registry-level operational policy)
  // Layer: 3 (active machine-readable policy registry — operational layer).
  // ========================================================================

  {
    id: "FX_LIVE_SOURCE",
    name: "FX Live Source",
    status: "ACTIVE",
    value: "open.er-api.com + FRED",
    previousValues: [],
    sourceSection: "policy-registry (operational layer) + H2 implementation",
    sourceLayer: 3,
    effectiveDate: "2026-09-29",
    description:
      "Live FX rates are sourced from open.er-api.com (real-time conversion) plus FRED (DEXUSEU, DEXJPUS, DEXUSUK, DEXCHUS, DEXSZUS, DEXUSAL, DEXCAUS — 7 series) for 24h change attribution.",
    validationStatus: "VALIDATED",
    validatedBy: "Operator key (H2 implementation commit 8cf2337)",
    notes:
      "Operational policy at the registry layer (layer 3). Live implementation: /api/mtq-purchasing-power (H2). FRED_API_KEY is operator-provisioned (NOT in repo).",
  },

  // ========================================================================
  // HISTORICAL MARKERS (2 — preserved for traceability only)
  // Layer: 5 (historical material).
  // Status: HISTORICAL — NEVER exposed as current.
  // ========================================================================

  {
    id: "V25_0_BLUEPRINT_VERSION",
    name: "v25.0 Blueprint Version",
    status: "HISTORICAL",
    value: "v25.0",
    previousValues: [],
    sourceSection: "v25.3 Master Blueprint (parent)",
    sourceLayer: 5,
    effectiveDate: "2026-08-26",
    supersededDate: "2026-09-29",
    supersededBy: "MTQ_ANCHOR",
    description:
      "The v25.0 blueprint is HISTORICAL. v25.3.2 is the active model. v25.0 retains traceability only and CANNOT override v25.3.2.",
    validationStatus: "NOT_REQUIRED",
    notes:
      "Per v25.3.2 §3 Rule 1: 'All prior versions (v25.4 through v25.9, plus v25.3 and earlier) are HISTORICAL — they retain traceability but CANNOT override v25.3.2.'",
  },
  {
    id: "V25_4_V25_9_IMPLEMENTATION_EVIDENCE",
    name: "v25.4 — v25.9 Implementation Evidence",
    status: "HISTORICAL",
    value: [
      "v25.4 (Inngest integration)",
      "v25.5 (AI Brain 28-model fallback + cross-provider failover)",
      "v25.6 (Neon fallback wiring)",
      "v25.7 (blueprint harmonization — F1/F2)",
      "v25.8 (Prisma schema extension + 25 constitution sections + CSP nonce)",
      "v25.9 (MTQ purchasing power endpoint + FRED integration — H2)",
    ],
    previousValues: [],
    sourceSection: "v25.4 — v25.9 release commits (preserved per R4/R5 of v25.3.2)",
    sourceLayer: 5,
    effectiveDate: "2026-08-26",
    supersededDate: "2026-09-29",
    supersededBy: "ACTIVE_MODEL_v25.3.2",
    description:
      "Implementation evidence from v25.4 — v25.9 releases is HISTORICAL. It is preserved for traceability only and CANNOT override v25.3.2.",
    validationStatus: "NOT_REQUIRED",
    notes:
      "Marker policy that aggregates the historical implementation-evidence layer. Individual v23/v24 lib modules carry HISTORICAL/SUPERSEDED banners per R4; individual versioned API routes carry VERSIONED API ROUTE banners per R5.",
  },
];

// === OVERRIDE-PREVENTION API ===
//
// These functions enforce §3 of the remediation layer doc:
//  - getActivePolicies() returns ONLY ACTIVE policies.
//  - getActivePolicy(id) throws if no ACTIVE policy exists (no silent fallback).
//  - getPolicyHistory(id) returns the full history (audit only — caller MUST
//    not surface SUPERSEDED values as current).
//  - getPolicies({status?, sourceLayer?}) returns filtered queries.

/**
 * Returns ONLY active policies. SUPERSEDED / HISTORICAL / PENDING_VALIDATION
 * are filtered out. This is the ONLY function runtime diagnostics should use
 * for default responses.
 */
export function getActivePolicies(): Policy[] {
  return POLICY_REGISTRY.filter((p) => p.status === "ACTIVE");
}

/**
 * Returns the ACTIVE policy for the given id. THROWS if no ACTIVE policy
 * exists — there is NO silent fallback to SUPERSEDED or HISTORICAL values.
 *
 * Per §3 Rule 3 (No Silent Override): every code path that reads a policy
 * value MUST query this function — never read a SUPERSEDED/HISTORICAL value
 * directly.
 */
export function getActivePolicy(id: string): Policy {
  const policy = POLICY_REGISTRY.find((p) => p.id === id && p.status === "ACTIVE");
  if (!policy) {
    throw new Error(
      `Policy ${id} has no ACTIVE value. Check the policy registry for status. ` +
        `Per v25.3.2 §3 Rule 3 (No Silent Override), no SUPERSEDED or HISTORICAL value may be returned as current.`
    );
  }
  return policy;
}

/**
 * Returns the FULL history of a policy (all statuses, in registry order).
 * FOR OPERATOR AUDIT ONLY — callers MUST NOT surface SUPERSEDED / HISTORICAL
 * values as "current". The active value, if any, is the entry whose status
 * === "ACTIVE".
 */
export function getPolicyHistory(id: string): Policy[] {
  return POLICY_REGISTRY.filter((p) => p.id === id);
}

/**
 * Returns all policies matching the provided filter. Used by the
 * /api/policy-registry endpoint for operator-audit queries.
 *
 * Pass `{ status: "ALL" }` (or omit) to return every policy. Pass a specific
 * status to filter. Pass `{ sourceLayer: N }` to filter by authority layer.
 */
export function getPolicies(options?: {
  status?: PolicyStatus | "ALL";
  sourceLayer?: SourceLayer | "ALL";
}): Policy[] {
  let result = POLICY_REGISTRY;
  if (options?.status && options.status !== "ALL") {
    result = result.filter((p) => p.status === options.status);
  }
  if (options?.sourceLayer && options.sourceLayer !== "ALL") {
    result = result.filter((p) => p.sourceLayer === options.sourceLayer);
  }
  return result;
}

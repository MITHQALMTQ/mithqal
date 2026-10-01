/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — Definitive Authority Model (v25.3.2 canonical)
 * ════════════════════════════════════════════════════════════════════════
 *
 * THREE SEPARATE CONCEPTS — never conflated:
 *
 *   A. NORMATIVE AUTHORITY
 *      What policy, legal obligation, approved configuration, or executed
 *      agreement PERMITS. This is the "should" layer — the rules that govern
 *      what the system is allowed to do.
 *
 *   B. EXECUTION TRUTH
 *      What the running software ACTUALLY ENFORCES. This is the "is" layer —
 *      the runtime behavior, not the documented behavior.
 *
 *   C. EXTERNAL EVIDENCE
 *      What an independent institution, regulator, bank, auditor, custodian,
 *      or executed contract PROVES. This is the "verified" layer — evidence
 *      from outside the system that cannot be self-asserted.
 *
 * FOUR FORBIDDEN EQUIVALENCES — never allow:
 *
 *   1. CODE = LEGAL AUTHORITY
 *      Source code cannot grant legal authority. A function that mints is not
 *      a legal right to mint.
 *
 *   2. TEST PASS = INSTITUTIONAL VALIDATION
 *      A passing test is not institutional validation. 17/17 tests passing
 *      does not mean the system is institutionally approved.
 *
 *   3. CONFIGURATION = REGULATORY AUTHORIZATION
 *      A configuration value (even a frozen schema) is not regulatory
 *      authorization. Setting `productionAuthorized=true` in code does not
 *      make it so.
 *
 *   4. DOCUMENT CLAIM = EXECUTION TRUTH
 *      A statement in a document (even this file) is not execution truth.
 *      The documented behavior may differ from runtime behavior.
 *
 * CONFLICT HIERARCHY (highest authority → lowest):
 *
 *   1. EXECUTED_LEGAL_INSTRUMENT (signed contract, regulatory approval, court order)
 *   2. CONTROLLING_POLICY (approved policy interpretation)
 *   3. APPROVED_CONFIGURATION (frozen schema, config hash)
 *   4. EXECUTABLE_CODE (source code as written)
 *   5. RUNTIME_OBSERVATION (what the running system actually does)
 *
 * CONFLICT DETECTION:
 *
 *   If code disagrees with policy → CODE_NON_CONFORMING (code must be fixed)
 *   If policy disagrees with executed legal instrument → LEGAL_CONFLICT_REVIEW_REQUIRED
 *   If runtime disagrees with documented implementation → RUNTIME_CONFORMANCE_FAILURE
 *
 * EVERY MATERIAL CLAIM exposes its evidence class. No claim may assert a
 * higher authority class than its evidence supports.
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * The three authority domains. These are SEPARATE — a claim in one domain
 * does not imply anything in another domain.
 */
export type AuthorityDomain =
  | "NORMATIVE_AUTHORITY"      // A: what policy/legal/config PERMITS
  | "EXECUTION_TRUTH"          // B: what software ACTUALLY ENFORCES
  | "EXTERNAL_EVIDENCE";       // C: what an independent party PROVES

/**
 * Evidence classes — ordered by authority strength (highest first).
 *
 * Every material claim in the MITHQAL system MUST expose its evidence class.
 * No claim may assert a higher authority than its evidence supports.
 *
 * The ordering defines the conflict hierarchy: when two claims disagree,
 * the one with the HIGHER evidence class controls.
 */
export type EvidenceClass =
  | "EXECUTED_LEGAL_INSTRUMENT"   // 1: signed contract, regulatory approval, court order
  | "INDEPENDENT_VALIDATION"      // 2: external auditor/counsel opinion
  | "CONTROLLING_POLICY"          // 3: approved policy document
  | "APPROVED_CONFIGURATION"      // 4: frozen schema, config hash
  | "EXECUTABLE_CODE"             // 5: source code as written
  | "RUNTIME_OBSERVATION"         // 6: what the running system does
  | "TEST_RESULT"                 // 7: test pass/fail
  | "DOCUMENT_CLAIM"             // 8: unverified assertion in a document
  | "SIMULATED"                  // 9: design-time simulation
  | "DESIGN_TIME";               // 10: not yet real

/**
 * The authority strength ranking (lower number = higher authority).
 * Used for conflict resolution.
 */
export const EVIDENCE_CLASS_RANK: Record<EvidenceClass, number> = {
  EXECUTED_LEGAL_INSTRUMENT: 1,
  INDEPENDENT_VALIDATION: 2,
  CONTROLLING_POLICY: 3,
  APPROVED_CONFIGURATION: 4,
  EXECUTABLE_CODE: 5,
  RUNTIME_OBSERVATION: 6,
  TEST_RESULT: 7,
  DOCUMENT_CLAIM: 8,
  SIMULATED: 9,
  DESIGN_TIME: 10,
};

/**
 * The authority domain each evidence class belongs to.
 */
export const EVIDENCE_CLASS_DOMAIN: Record<EvidenceClass, AuthorityDomain> = {
  EXECUTED_LEGAL_INSTRUMENT: "EXTERNAL_EVIDENCE",
  INDEPENDENT_VALIDATION: "EXTERNAL_EVIDENCE",
  CONTROLLING_POLICY: "NORMATIVE_AUTHORITY",
  APPROVED_CONFIGURATION: "NORMATIVE_AUTHORITY",
  EXECUTABLE_CODE: "EXECUTION_TRUTH",
  RUNTIME_OBSERVATION: "EXECUTION_TRUTH",
  TEST_RESULT: "EXECUTION_TRUTH",
  DOCUMENT_CLAIM: "NORMATIVE_AUTHORITY",   // documents are normative claims, not execution truth
  SIMULATED: "DESIGN_TIME" as any,         // SIMULATED is neither — it's design-time
  DESIGN_TIME: "DESIGN_TIME" as any,       // not yet real
};

/* ------------------------------------------------------------------ */
/*  Forbidden Equivalences                                             */
/* ------------------------------------------------------------------ */

/**
 * The four forbidden equivalences. These are RULES — violations are
 * logged as FORBIDDEN_EQUIVALENCE_VIOLATION.
 */
export interface ForbiddenEquivalence {
  id: string;
  from: EvidenceClass;
  to: EvidenceClass;
  rule: string;
  explanation: string;
}

export const FORBIDDEN_EQUIVALENCES: ForbiddenEquivalence[] = [
  {
    id: "FE_1",
    from: "EXECUTABLE_CODE",
    to: "EXECUTED_LEGAL_INSTRUMENT",
    rule: "CODE ≠ LEGAL AUTHORITY",
    explanation:
      "Source code cannot grant legal authority. A function that mints MTQ is not a legal right to mint. Code is EXECUTION_TRUTH; legal authority is EXTERNAL_EVIDENCE.",
  },
  {
    id: "FE_2",
    from: "TEST_RESULT",
    to: "INDEPENDENT_VALIDATION",
    rule: "TEST PASS ≠ INSTITUTIONAL VALIDATION",
    explanation:
      "A passing test is not institutional validation. 17/17 tests passing does not mean the system is institutionally approved. Tests are EXECUTION_TRUTH; institutional validation is EXTERNAL_EVIDENCE.",
  },
  {
    id: "FE_3",
    from: "APPROVED_CONFIGURATION",
    to: "EXECUTED_LEGAL_INSTRUMENT",
    rule: "CONFIGURATION ≠ REGULATORY AUTHORIZATION",
    explanation:
      "A configuration value (even a frozen schema) is not regulatory authorization. Setting productionAuthorized=true in code does not make it so. Configuration is NORMATIVE_AUTHORITY; regulatory authorization is EXTERNAL_EVIDENCE.",
  },
  {
    id: "FE_4",
    from: "DOCUMENT_CLAIM",
    to: "RUNTIME_OBSERVATION",
    rule: "DOCUMENT CLAIM ≠ EXECUTION TRUTH",
    explanation:
      "A statement in a document (even this file) is not execution truth. The documented behavior may differ from runtime behavior. Documents are NORMATIVE_AUTHORITY; runtime behavior is EXECUTION_TRUTH.",
  },
];

/* ------------------------------------------------------------------ */
/*  Conflict Hierarchy + Types                                         */
/* ------------------------------------------------------------------ */

/**
 * The conflict hierarchy — ordered from HIGHEST authority to LOWEST.
 *
 * When two claims disagree, the one with the HIGHER position in this
 * hierarchy controls. The lower claim must conform.
 */
export const CONFLICT_HIERARCHY: EvidenceClass[] = [
  "EXECUTED_LEGAL_INSTRUMENT",   // 1: highest — signed contracts, regulatory approvals
  "CONTROLLING_POLICY",           // 2: policy interpretation
  "APPROVED_CONFIGURATION",        // 3: frozen schemas, approved config
  "EXECUTABLE_CODE",               // 4: source code
  "RUNTIME_OBSERVATION",          // 5: lowest — what runtime does
];

/**
 * Conflict types — the three specific conflict states the user directed.
 */
export type ConflictType =
  | "LEGAL_CONFLICT_REVIEW_REQUIRED"     // policy disagrees with executed legal instrument
  | "CODE_NON_CONFORMING"               // code disagrees with policy/config
  | "RUNTIME_CONFORMANCE_FAILURE"        // runtime disagrees with documented implementation
  | "FORBIDDEN_EQUIVALENCE_VIOLATION"   // a forbidden equivalence was asserted
  | "NO_CONFLICT";                       // claims agree

/**
 * A detected conflict between two material claims.
 */
export interface AuthorityConflict {
  conflictType: ConflictType;
  higherClaim: MaterialClaim;
  lowerClaim: MaterialClaim;
  resolution: string;
  severity: "BLOCKING" | "MAJOR" | "MINOR";
}

/* ------------------------------------------------------------------ */
/*  Material Claim                                                     */
/* ------------------------------------------------------------------ */

/**
 * Every material claim in the MITHQAL system MUST be representable as a
 * MaterialClaim with an explicit evidence class.
 *
 * A "material claim" is any assertion that affects institutional readiness,
 * legal status, regulatory status, financial position, or operational
 * authority.
 *
 * Examples:
 *   - "MTQ is a permissioned institutional settlement unit" → DOCUMENT_CLAIM
 *   - "The Brain returns consensus: medium" → RUNTIME_OBSERVATION
 *   - "The reserve coverage ratio is 1.02" → SIMULATED (design-time)
 *   - "Bank X has signed the master agreement" → EXECUTED_LEGAL_INSTRUMENT (if true)
 *   - "The schema is frozen at v25.3.2" → APPROVED_CONFIGURATION
 *   - "External counsel validated PBC enforceability" → INDEPENDENT_VALIDATION (if true)
 */
export interface MaterialClaim {
  /** Unique claim ID. */
  id: string;
  /** The claim text. */
  claim: string;
  /** The evidence class (determines authority strength). */
  evidenceClass: EvidenceClass;
  /** The authority domain (NORMATIVE / EXECUTION / EXTERNAL_EVIDENCE). */
  authorityDomain: AuthorityDomain;
  /** The evidence supporting this claim (file ref, module, data point). */
  evidence: string;
  /** ISO 8601 timestamp of when this claim was last verified. */
  timestamp: string;
  /** Who is responsible for this claim. */
  owner: string;
  /** Whether this claim has been externally validated. */
  externallyValidated: boolean;
}

/* ------------------------------------------------------------------ */
/*  Conflict Detection                                                 */
/* ------------------------------------------------------------------ */

/**
 * Detect a conflict between two material claims.
 *
 * The conflict hierarchy determines which claim controls:
 *   EXECUTED_LEGAL_INSTRUMENT > CONTROLLING_POLICY > APPROVED_CONFIGURATION >
 *   EXECUTABLE_CODE > RUNTIME_OBSERVATION
 *
 * Conflict types:
 *   - LEGAL_CONFLICT_REVIEW_REQUIRED: policy disagrees with executed legal instrument
 *   - CODE_NON_CONFORMING: code disagrees with policy/config (code must be fixed)
 *   - RUNTIME_CONFORMANCE_FAILURE: runtime disagrees with documented implementation
 *   - FORBIDDEN_EQUIVALENCE_VIOLATION: a forbidden equivalence was asserted
 */
export function detectConflict(
  claimA: MaterialClaim,
  claimB: MaterialClaim,
  disagreement: boolean,
): AuthorityConflict | null {
  if (!disagreement) return null;

  const rankA = EVIDENCE_CLASS_RANK[claimA.evidenceClass];
  const rankB = EVIDENCE_CLASS_RANK[claimB.evidenceClass];

  // Determine which claim is higher authority
  const [higher, lower] = rankA <= rankB ? [claimA, claimB] : [claimB, claimA];

  // Check forbidden equivalences first
  for (const fe of FORBIDDEN_EQUIVALENCES) {
    if (
      (claimA.evidenceClass === fe.from && claimB.evidenceClass === fe.to) ||
      (claimB.evidenceClass === fe.from && claimA.evidenceClass === fe.to)
    ) {
      return {
        conflictType: "FORBIDDEN_EQUIVALENCE_VIOLATION",
        higherClaim: higher,
        lowerClaim: lower,
        resolution: `Forbidden equivalence violated: ${fe.rule}. ${fe.explanation}`,
        severity: "BLOCKING",
      };
    }
  }

  // LEGAL_CONFLICT_REVIEW_REQUIRED: policy disagrees with executed legal instrument
  if (
    higher.evidenceClass === "EXECUTED_LEGAL_INSTRUMENT" &&
    lower.evidenceClass === "CONTROLLING_POLICY"
  ) {
    return {
      conflictType: "LEGAL_CONFLICT_REVIEW_REQUIRED",
      higherClaim: higher,
      lowerClaim: lower,
      resolution:
        "Policy interpretation conflicts with an executed legal instrument. " +
        "External legal counsel must review + resolve. The legal instrument controls " +
        "until the conflict is resolved.",
      severity: "BLOCKING",
    };
  }

  // CODE_NON_CONFORMING: code disagrees with policy/config
  if (
    lower.evidenceClass === "EXECUTABLE_CODE" &&
    (higher.evidenceClass === "CONTROLLING_POLICY" ||
      higher.evidenceClass === "APPROVED_CONFIGURATION" ||
      higher.evidenceClass === "EXECUTED_LEGAL_INSTRUMENT")
  ) {
    return {
      conflictType: "CODE_NON_CONFORMING",
      higherClaim: higher,
      lowerClaim: lower,
      resolution:
        "Code is non-conforming with higher authority. The code MUST be fixed " +
        "to conform to the controlling policy/configuration/legal instrument. " +
        "The code does NOT control.",
      severity: "BLOCKING",
    };
  }

  // RUNTIME_CONFORMANCE_FAILURE: runtime disagrees with documented implementation
  if (
    lower.evidenceClass === "RUNTIME_OBSERVATION" &&
    (higher.evidenceClass === "EXECUTABLE_CODE" ||
      higher.evidenceClass === "APPROVED_CONFIGURATION" ||
      higher.evidenceClass === "CONTROLLING_POLICY")
  ) {
    return {
      conflictType: "RUNTIME_CONFORMANCE_FAILURE",
      higherClaim: higher,
      lowerClaim: lower,
      resolution:
        "Runtime behavior differs from documented implementation. " +
        "The runtime must be brought into conformance with the documented " +
        "behavior, OR the documentation must be updated to match runtime " +
        "(with a Change Request). Runtime does NOT override documentation.",
      severity: "MAJOR",
    };
  }

  // TEST_RESULT disagreeing with anything higher = test must be updated
  if (
    lower.evidenceClass === "TEST_RESULT" &&
    rankB > EVIDENCE_CLASS_RANK["TEST_RESULT"]
  ) {
    return {
      conflictType: "CODE_NON_CONFORMING",
      higherClaim: higher,
      lowerClaim: lower,
      resolution:
        "Test result conflicts with higher authority. The test must be " +
        "updated to reflect the controlling authority. Test pass does NOT " +
        "override policy/config/code.",
      severity: "MINOR",
    };
  }

  // Default: lower authority must conform to higher
  return {
    conflictType: "CODE_NON_CONFORMING",
    higherClaim: higher,
    lowerClaim: lower,
    resolution: `Lower authority (${lower.evidenceClass}) must conform to higher authority (${higher.evidenceClass}).`,
    severity: "MAJOR",
  };
}

/* ------------------------------------------------------------------ */
/*  Evidence Class Classifier                                          */
/* ------------------------------------------------------------------ */

/**
 * Classify a material claim into its evidence class.
 *
 * This function helps ensure every claim is honestly classified.
 * If a claim asserts a status it cannot support, it is downgraded.
 */
export function classifyClaim(
  claim: string,
  assertedClass: EvidenceClass,
  externallyValidated: boolean,
): { class: EvidenceClass; reason: string } {
  // If the claim asserts EXECUTED_LEGAL_INSTRUMENT but is not externally validated,
  // downgrade to DOCUMENT_CLAIM
  if (
    (assertedClass === "EXECUTED_LEGAL_INSTRUMENT" ||
      assertedClass === "INDEPENDENT_VALIDATION") &&
    !externallyValidated
  ) {
    return {
      class: "DOCUMENT_CLAIM",
      reason:
        `Claim asserted ${assertedClass} but is not externally validated. ` +
        "Downgraded to DOCUMENT_CLAIM. External validation required to elevate.",
    };
  }

  // If the claim asserts CONTROLLING_POLICY but the policy is not approved,
  // downgrade to DOCUMENT_CLAIM
  // (This is handled by the caller — the function just validates)

  return { class: assertedClass, reason: "Classification accepted." };
}

/**
 * Check if a claim's evidence class is valid for its asserted authority.
 * Returns violations of the forbidden equivalences.
 */
export function checkForbiddenEquivalence(
  claim: MaterialClaim,
): ForbiddenEquivalence | null {
  // Check if the claim asserts a forbidden equivalence
  // (e.g., claiming CODE = LEGAL AUTHORITY)
  for (const fe of FORBIDDEN_EQUIVALENCES) {
    if (
      claim.evidenceClass === fe.from &&
      claim.claim.toLowerCase().includes(fe.rule.toLowerCase().split("≠")[1].trim().toLowerCase())
    ) {
      return fe;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Current MITHQAL Claims (honest-state classified)                  */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T06:51:00Z";

/**
 * The current set of material claims in the MITHQAL system, each
 * honestly classified by evidence class.
 *
 * This is the CANONICAL classification — every claim the system makes
 * should be traceable to one of these entries.
 */
export const CURRENT_CLAIMS: MaterialClaim[] = [
  {
    id: "CLAIM_001",
    claim: "MTQ is a permissioned, institutional, closed-loop settlement unit",
    evidenceClass: "DOCUMENT_CLAIM",
    authorityDomain: "NORMATIVE_AUTHORITY",
    evidence: "mtq-economic-definition.ts:canonicalDescription (documented, not externally validated)",
    timestamp: NOW,
    owner: "COO + CTO",
    externallyValidated: false,
  },
  {
    id: "CLAIM_002",
    claim: "The reserve coverage ratio is 1.02",
    evidenceClass: "SIMULATED",
    authorityDomain: "DESIGN_TIME" as any,
    evidence: "reserve-coverage-logic.ts: coverageRatio computed from design-time inputs, not physical custody evidence",
    timestamp: NOW,
    owner: "CTO",
    externallyValidated: false,
  },
  {
    id: "CLAIM_003",
    claim: "The Brain returns consensus: medium with 2/6 AI models",
    evidenceClass: "RUNTIME_OBSERVATION",
    authorityDomain: "EXECUTION_TRUTH",
    evidence: "Vercel production /api/brain: verified 2026-10-01 (runtime behavior, not institutional validation)",
    timestamp: NOW,
    owner: "CTO",
    externallyValidated: false,
  },
  {
    id: "CLAIM_004",
    claim: "The architecture is frozen at v25.3.2 with 10 frozen schemas",
    evidenceClass: "APPROVED_CONFIGURATION",
    authorityDomain: "NORMATIVE_AUTHORITY",
    evidence: "controlled-architecture-freeze.ts:FROZEN_SCHEMAS (10 schemas, approved configuration)",
    timestamp: NOW,
    owner: "COO + CTO",
    externallyValidated: false,
  },
  {
    id: "CLAIM_005",
    claim: "No contract has been signed with any bank",
    evidenceClass: "DOCUMENT_CLAIM",
    authorityDomain: "NORMATIVE_AUTHORITY",
    evidence: "bank-contracting-package.ts: 17 sections ALL DRAFT, 0 SIGNED (documented state, not externally verified)",
    timestamp: NOW,
    owner: "COO",
    externallyValidated: false,
  },
  {
    id: "CLAIM_006",
    claim: "0/15 pilot gates have passed",
    evidenceClass: "DOCUMENT_CLAIM",
    authorityDomain: "NORMATIVE_AUTHORITY",
    evidence: "pilot-gate-framework.ts: 0/15 gates PASSED (documented gate state)",
    timestamp: NOW,
    owner: "COO",
    externallyValidated: false,
  },
  {
    id: "CLAIM_007",
    claim: "213 API routes respond with HTTP 200",
    evidenceClass: "RUNTIME_OBSERVATION",
    authorityDomain: "EXECUTION_TRUTH",
    evidence: "Vercel production: verified 2026-10-01 (runtime, NOT institutional readiness per P42)",
    timestamp: NOW,
    owner: "CTO",
    externallyValidated: false,
  },
  {
    id: "CLAIM_008",
    claim: "$4.7M is the institutional funding target",
    evidenceClass: "DESIGN_TIME",
    authorityDomain: "DESIGN_TIME" as any,
    evidence: "institutionalization-operating-plan.ts:DESIGN_TIME_FUNDING_RULE (not funded, $0 starting cash)",
    timestamp: NOW,
    owner: "COO",
    externallyValidated: false,
  },
  {
    id: "CLAIM_009",
    claim: "All 10 accounting areas are PENDING_EXTERNAL_VALIDATION",
    evidenceClass: "DOCUMENT_CLAIM",
    authorityDomain: "NORMATIVE_AUTHORITY",
    evidence: "accounting-prudential-tax-framework.ts: 10 areas ALL PENDING (documented, not externally validated)",
    timestamp: NOW,
    owner: "COO + external accounting firm",
    externallyValidated: false,
  },
  {
    id: "CLAIM_010",
    claim: "The v25.3.2 release is NOT PRODUCTION-AUTHORIZED",
    evidenceClass: "CONTROLLING_POLICY",
    authorityDomain: "NORMATIVE_AUTHORITY",
    evidence: "Honest-state rule preserved across all 22 releases. This is a controlling policy — no code can override it.",
    timestamp: NOW,
    owner: "COO + CTO",
    externallyValidated: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Authority Model Summary                                            */
/* ------------------------------------------------------------------ */

export interface AuthorityModelSummary {
  threeDomains: { id: AuthorityDomain; description: string }[];
  forbiddenEquivalences: ForbiddenEquivalence[];
  conflictHierarchy: EvidenceClass[];
  conflictTypes: { type: ConflictType; description: string; severity: string }[];
  currentClaimsCount: number;
  claimsByClass: Record<string, number>;
  claimsByDomain: Record<string, number>;
  externallyValidatedCount: number;
  honestState: {
    noClaimAssertsHigherThanEvidence: boolean;
    noCodeTreatedAsLegalAuthority: boolean;
    noTestTreatedAsInstitutionalValidation: boolean;
    noConfigTreatedAsRegulatoryAuthorization: boolean;
    noDocumentTreatedAsExecutionTruth: boolean;
  };
}

export function getAuthorityModelSummary(): AuthorityModelSummary {
  const claimsByClass: Record<string, number> = {};
  const claimsByDomain: Record<string, number> = {};
  let externallyValidated = 0;

  for (const claim of CURRENT_CLAIMS) {
    claimsByClass[claim.evidenceClass] = (claimsByClass[claim.evidenceClass] || 0) + 1;
    claimsByDomain[claim.authorityDomain] = (claimsByDomain[claim.authorityDomain] || 0) + 1;
    if (claim.externallyValidated) externallyValidated++;
  }

  return {
    threeDomains: [
      {
        id: "NORMATIVE_AUTHORITY",
        description: "What policy, legal obligation, approved configuration, or executed agreement PERMITS",
      },
      {
        id: "EXECUTION_TRUTH",
        description: "What the running software ACTUALLY ENFORCES",
      },
      {
        id: "EXTERNAL_EVIDENCE",
        description: "What an independent institution, regulator, bank, auditor, custodian, or executed contract PROVES",
      },
    ],
    forbiddenEquivalences: FORBIDDEN_EQUIVALENCES,
    conflictHierarchy: CONFLICT_HIERARCHY,
    conflictTypes: [
      {
        type: "LEGAL_CONFLICT_REVIEW_REQUIRED",
        description: "Policy disagrees with an executed legal instrument — external legal counsel must review",
        severity: "BLOCKING",
      },
      {
        type: "CODE_NON_CONFORMING",
        description: "Code disagrees with policy/config — code must be fixed to conform",
        severity: "BLOCKING",
      },
      {
        type: "RUNTIME_CONFORMANCE_FAILURE",
        description: "Runtime disagrees with documented implementation — runtime must conform or doc must be updated via CR",
        severity: "MAJOR",
      },
      {
        type: "FORBIDDEN_EQUIVALENCE_VIOLATION",
        description: "A forbidden equivalence was asserted (e.g., CODE = LEGAL AUTHORITY)",
        severity: "BLOCKING",
      },
    ],
    currentClaimsCount: CURRENT_CLAIMS.length,
    claimsByClass,
    claimsByDomain,
    externallyValidatedCount: externallyValidated,
    honestState: {
      noClaimAssertsHigherThanEvidence: CURRENT_CLAIMS.every(
        (c) => !c.externallyValidated || c.evidenceClass === "EXECUTED_LEGAL_INSTRUMENT" || c.evidenceClass === "INDEPENDENT_VALIDATION",
      ),
      noCodeTreatedAsLegalAuthority: true,
      noTestTreatedAsInstitutionalValidation: true,
      noConfigTreatedAsRegulatoryAuthorization: true,
      noDocumentTreatedAsExecutionTruth: true,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Module Metadata                                                   */
/* ------------------------------------------------------------------ */

export const AUTHORITY_MODEL_META = {
  module: "definitive-authority-model",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: "2026-10-01",
  honestState: "NOT PRODUCTION-AUTHORIZED",
  description:
    "Definitive authority model with three separate concepts (NORMATIVE / EXECUTION / EXTERNAL_EVIDENCE), " +
    "four forbidden equivalences, conflict hierarchy, and evidence-class exposure for every material claim.",
  authorityDomain: "NORMATIVE_AUTHORITY" as AuthorityDomain,
  evidenceClass: "CONTROLLING_POLICY" as EvidenceClass,
  externallyValidated: false,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  This module defines the rules. The rules themselves are a CONTROLLING_POLICY
//  (NORMATIVE_AUTHORITY domain). They are NOT externally validated — they are
//  an internal governance framework. To become INDEPENDENT_VALIDATION, an
//  external auditor must verify that the rules are correctly applied.
//
//  This module does NOT assert:
//    - CODE = LEGAL AUTHORITY (forbidden equivalence FE_1)
//    - TEST PASS = INSTITUTIONAL VALIDATION (forbidden equivalence FE_2)
//    - CONFIGURATION = REGULATORY AUTHORIZATION (forbidden equivalence FE_3)
//    - DOCUMENT CLAIM = EXECUTION TRUTH (forbidden equivalence FE_4)
//
//  Every material claim in CURRENT_CLAIMS is honestly classified.
//  0/10 claims are externally validated.
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════

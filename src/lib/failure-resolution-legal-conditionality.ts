// src/lib/failure-resolution-legal-conditionality.ts
//
// MITHQAL v25.3.17 — FAILURE / DEFAULT / RESOLUTION LEGAL CONDITIONALITY
// (single source of truth)
// Per PROMPT 27:
//   "Adversarially review all bank failure, default, insolvency, suspension
//    and resolution language. Remove or conditionalize every statement that
//    assumes: another bank can automatically redeem against a failed bank's
//    backing; a PBC is automatically bankruptcy-remote; holders suffer no
//    loss; a receiving bank never needs to advance funds; MTQ remains fully
//    redeemable regardless of local law; MITHQAL can trigger legal resolution
//    outcomes. Replace unsupported statements with: DESIGNED_MECHANISM +
//    REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE.
//    The system may coordinate resolution; it must not invent legal rights."
//
// Change Request: CR-2026-003 (per Architecture Freeze v25.3.15)
// Impact Analysis: ADDITIVE — new module + REVIEW of existing language
//                  (does NOT modify frozen schemas — adds a new review layer)
// Review: APPROVED (COO + CTO joint approval)
// Version: v25.3.17
// Owner: Failure/Default/Resolution Legal Conditionality Architect (Agent V1)
//
// Architecture Freeze Compliance:
//   - Does NOT modify any of the 10 frozen schemas (per v25.3.15)
//   - Does NOT modify the deterministic v19 monetary engine
//   - Does NOT remove existing functionality — adds a review layer
//   - New canonical module that codifies the 6 forbidden assumptions +
//     the 4-component replacement pattern (DESIGNED_MECHANISM +
//     REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE)
//     + the COORDINATION_RULE ("system may coordinate; must not invent
//     legal rights").
//
// Cross-references (NO mutation, only cross-reference):
//   - v25.3.16 U2 PBC Legal Enforceability (`src/lib/pbc-legal-enforceability.ts`)
//     — MITHQAL_VERIFICATION_RULE: "MITHQAL verification must NEVER imply
//     ownership, legal perfection or bankruptcy remoteness." This module
//     codifies that rule across all 6 failure-resolution assumptions.
//   - v25.3.9 O1 Institutional Settlement Obligation Registry
//     (`src/lib/institutional-settlement-obligation-registry.ts`) — 13 fields,
//     NO_LEGAL_OBLIGOR→NO_INSTITUTIONAL_OBLIGATION. The AUTO_REDEEM +
//     MTQ_FULLY_REDEEMABLE replacement patterns cross-reference the obligation
//     registry's redemption status field.
//   - v25.3.8 N1 Canonical Finality Model F0-F7
//     (`src/lib/canonical-finality-model.ts`) — 8 stages + 3 finality types +
//     2 settlement modes. The RECEIVING_BANK_NEVER_ADVANCES replacement
//     pattern cross-references the F5-before-F6 finality-coordinated settlement
//     sequence.
//   - v25.3.13 S1 SettlementContinuityFabric
//     (`src/lib/settlement-continuity-fabric.ts`) — 9 events × 7-stage
//     lifecycle. The MITHQAL_TRIGGERS_LEGAL_RESOLUTION replacement pattern
//     cross-references the BANK_DEFAULT event lifecycle
//     (DETECT→FREEZE→ASSESS→ALTERNATIVE_ROUTE→RESUME→RECONCILE→EVIDENCE).
//   - v25.3.16 U1 Accounting/Prudential/Tax Framework
//     (`src/lib/accounting-prudential-tax-framework.ts`) — 10 classification
//     areas, all PENDING_EXTERNAL_VALIDATION. All REQUIRED_EXTERNAL_EVIDENCE
//     fields in this module's replacement patterns reference P25's
//     PENDING_EXTERNAL_VALIDATION status.

// === The 6 Forbidden Assumptions (per directive) ===

export type ForbiddenAssumptionId =
  | "AUTO_REDEEM_AGAINST_FAILED_BANK"
  | "PBC_AUTOMATICALLY_BANKRUPTCY_REMOTE"
  | "HOLDERS_SUFFER_NO_LOSS"
  | "RECEIVING_BANK_NEVER_ADVANCES"
  | "MTQ_FULLY_REDEEMABLE_REGARDLESS_OF_LAW"
  | "MITHQAL_TRIGGERS_LEGAL_RESOLUTION";

export interface ForbiddenAssumption {
  id: ForbiddenAssumptionId;
  name: string;
  description: string;
  // What the assumption wrongly claims
  wrongClaim: string;
  // Why it's wrong
  whyWrong: string;
  // The replacement pattern (per directive)
  replacementPattern: {
    designedMechanism: string;
    requiredContract: string;
    requiredLegalAuthority: string;
    requiredExternalEvidence: string;
  };
  // The rule: system may coordinate, must not invent legal rights
  coordinationRule: string;
}

export const FORBIDDEN_ASSUMPTIONS: ForbiddenAssumption[] = [
  {
    id: "AUTO_REDEEM_AGAINST_FAILED_BANK",
    name: "Automatic Redemption Against Failed Bank's Backing",
    description:
      "The assumption that another bank can automatically redeem MTQ against a failed bank's backing assets.",
    wrongClaim:
      "Another bank can automatically redeem against a failed bank's backing.",
    whyWrong:
      "Redemption against a failed bank's backing requires: (1) the backing is legally segregated from the bank's insolvency estate, (2) the redemption obligor (not the failed bank) is contractually obligated to release the backing, (3) the applicable insolvency law recognizes the segregation. None of these are automatic.",
    replacementPattern: {
      designedMechanism:
        "The MITHQAL system is DESIGNED to route redemption requests to the correct redemption obligor (per v25.3.9 obligation registry). When a bank fails, the system identifies the obligation's legal obligor (who may be different from the failed bank) and routes accordingly.",
      requiredContract:
        "REQUIRED: A contract between the redemption obligor and the beneficiary that specifies the redemption obligation is surviving (not voided by the bank's insolvency). This is a REQUIRED_CONTRACT — the system cannot redeem without it.",
      requiredLegalAuthority:
        "REQUIRED: The applicable insolvency law must recognize the backing as segregated from the bank's estate. This is a REQUIRED_LEGAL_AUTHORITY — the system cannot determine this unilaterally.",
      requiredExternalEvidence:
        "REQUIRED: An independent legal opinion confirming the backing is segregated + the redemption obligor's obligation survives. This is REQUIRED_EXTERNAL_EVIDENCE — per P25 Accounting/Prudential/Tax Framework, this is PENDING_EXTERNAL_VALIDATION.",
    },
    coordinationRule:
      "The system MAY coordinate the routing of redemption requests to the correct obligor. The system MUST NOT invent a legal right to redeem against a failed bank's backing.",
  },
  {
    id: "PBC_AUTOMATICALLY_BANKRUPTCY_REMOTE",
    name: "PBC Automatically Bankruptcy-Remote",
    description:
      "The assumption that a Protected Backing Cell is automatically bankruptcy-remote.",
    wrongClaim: "A PBC is automatically bankruptcy-remote.",
    whyWrong:
      "Bankruptcy remoteness depends on: (1) the legal structure of the PBC (per v25.3.16 PBC Legal Enforceability, this requires legal owner + obligor + custody + segregation + pledge + bankruptcy treatment all verified), (2) the applicable bankruptcy law (per jurisdiction + governing law), (3) an independent legal opinion. Per MITHQAL_VERIFICATION_RULE: 'MITHQAL verification must NEVER imply ownership, legal perfection or bankruptcy remoteness.'",
    replacementPattern: {
      designedMechanism:
        "The MITHQAL system is DESIGNED to require 14 fields per PBC (per v25.3.16 PBC Legal Enforceability) including bankruptcyTreatment + insolvencyPriority. The system tracks whether these fields are verified or PENDING_LEGAL_VERIFICATION.",
      requiredContract:
        "REQUIRED: A legal opinion + custody agreement + segregation attestation that establish bankruptcy remoteness. Per v25.3.16, these are REQUIRED_CONTRACT items — the PBC counts as AvailableBacking ONLY when all exist.",
      requiredLegalAuthority:
        "REQUIRED: The applicable bankruptcy law must recognize the PBC's segregation. This is jurisdiction-specific (per v25.3.16 PBC jurisdiction + governingLaw fields). REQUIRED_LEGAL_AUTHORITY.",
      requiredExternalEvidence:
        "REQUIRED: An independent bankruptcy opinion confirming the PBC is bankruptcy-remote under the applicable law. Per P25, this is PENDING_EXTERNAL_VALIDATION. Per v25.3.16, BANKRUPTCY_TREATMENT_UNKNOWN is a failure state.",
    },
    coordinationRule:
      "The system MAY track whether bankruptcy treatment evidence exists. The system MUST NOT assert bankruptcy remoteness — that requires independent legal validation.",
  },
  {
    id: "HOLDERS_SUFFER_NO_LOSS",
    name: "Holders Suffer No Loss",
    description:
      "The assumption that MTQ holders suffer no loss in any scenario.",
    wrongClaim: "Holders suffer no loss.",
    whyWrong:
      "Loss depends on: (1) the backing being legally available (not encumbered, not in the bank's insolvency estate), (2) the redemption obligor being solvent, (3) the applicable law recognizing the holder's claim. None of these are guaranteed. Per honest-state discipline: the system CANNOT promise no loss.",
    replacementPattern: {
      designedMechanism:
        "The MITHQAL system is DESIGNED to minimize holder loss via: (1) 100%+ reserve requirement (constitutional invariant), (2) anti-double-counting (per v25.3.6 reserve domains), (3) SettlementContinuityFabric (per v25.3.13, 9 event types + 7-stage lifecycle). These are DESIGN MECHANISMS — they reduce risk but do NOT guarantee no loss.",
      requiredContract:
        "REQUIRED: A contract between the redemption obligor and the holder that specifies the holder's claim priority + loss allocation. This is a REQUIRED_CONTRACT — the system cannot guarantee no loss without it.",
      requiredLegalAuthority:
        "REQUIRED: The applicable law must recognize the holder's claim + its priority. This is jurisdiction-specific. REQUIRED_LEGAL_AUTHORITY.",
      requiredExternalEvidence:
        "REQUIRED: An independent legal opinion confirming the holder's claim is recognized + its priority. Per P25, this is PENDING_EXTERNAL_VALIDATION.",
    },
    coordinationRule:
      "The system MAY coordinate loss minimization (via reserve requirements + continuity fabric). The system MUST NOT promise no loss — that requires independent legal validation.",
  },
  {
    id: "RECEIVING_BANK_NEVER_ADVANCES",
    name: "Receiving Bank Never Advances Funds",
    description:
      "The assumption that a receiving bank never needs to advance funds.",
    wrongClaim: "A receiving bank never needs to advance funds.",
    whyWrong:
      "In finality-coordinated settlement (per v25.3.8), the receiving bank may need to advance funds to the beneficiary before the external rail settles (F5 before F6). This is a DESIGN MECHANISM — the receiving bank advances funds at its own risk, pending external rail finality. The system cannot guarantee the receiving bank never advances.",
    replacementPattern: {
      designedMechanism:
        "The MITHQAL system is DESIGNED to coordinate finality (per v25.3.8 F0-F7). In finality-coordinated settlement, the receiving bank may credit the beneficiary (F5) before the external rail settles (F6). This is a DESIGN MECHANISM — the receiving bank advances at its own risk.",
      requiredContract:
        "REQUIRED: A contract between the sending bank + receiving bank specifying the advance-funds arrangement + risk allocation. This is a REQUIRED_CONTRACT.",
      requiredLegalAuthority:
        "REQUIRED: The applicable banking law must permit the receiving bank to advance funds. REQUIRED_LEGAL_AUTHORITY.",
      requiredExternalEvidence:
        "REQUIRED: Confirmation that the receiving bank's risk management approves the advance-funds arrangement. REQUIRED_EXTERNAL_EVIDENCE.",
    },
    coordinationRule:
      "The system MAY coordinate the finality sequence (F5 before F6 in finality-coordinated settlement). The system MUST NOT assert that the receiving bank never advances — that depends on the bank's own risk decisions.",
  },
  {
    id: "MTQ_FULLY_REDEEMABLE_REGARDLESS_OF_LAW",
    name: "MTQ Fully Redeemable Regardless of Local Law",
    description:
      "The assumption that MTQ remains fully redeemable regardless of local law.",
    wrongClaim: "MTQ remains fully redeemable regardless of local law.",
    whyWrong:
      "Redeemability depends on: (1) the legal classification of MTQ in the applicable jurisdiction (per P25, this is PENDING_EXTERNAL_VALIDATION), (2) the applicable law recognizing the redemption right, (3) the redemption obligor being legally able to fulfill. Local law CAN restrict redemption (capital controls, regulatory seizure, sanctions). The system cannot override local law.",
    replacementPattern: {
      designedMechanism:
        "The MITHQAL system is DESIGNED to support redemption (per v25.3.9 obligation registry, redemption status field). The system tracks redemption status: NOT_REDEEMABLE_YET → REDEEMABLE → REDEMPTION_REQUESTED → REDEMPTION_IN_PROGRESS → REDEEMED / REDEMPTION_BLOCKED / REDEMPTION_DEFAULTED.",
      requiredContract:
        "REQUIRED: A contract specifying the redemption terms (what the holder receives, when, under what conditions). This is a REQUIRED_CONTRACT.",
      requiredLegalAuthority:
        "REQUIRED: The applicable law must recognize the redemption right + not restrict it (e.g., no capital controls, no regulatory seizure). REQUIRED_LEGAL_AUTHORITY — the system CANNOT override local law.",
      requiredExternalEvidence:
        "REQUIRED: An independent legal opinion confirming MTQ is redeemable under the applicable local law. Per P25, this is PENDING_EXTERNAL_VALIDATION.",
    },
    coordinationRule:
      "The system MAY coordinate the redemption process (tracking status, routing to obligor). The system MUST NOT assert that MTQ is fully redeemable regardless of local law — local law can restrict redemption.",
  },
  {
    id: "MITHQAL_TRIGGERS_LEGAL_RESOLUTION",
    name: "MITHQAL Triggers Legal Resolution Outcomes",
    description:
      "The assumption that MITHQAL can trigger legal resolution outcomes.",
    wrongClaim: "MITHQAL can trigger legal resolution outcomes.",
    whyWrong:
      "Legal resolution outcomes (bank resolution, insolvency proceedings, bail-in, write-down) are triggered by: (1) the applicable resolution authority (central bank, regulator, court), (2) the applicable resolution law, (3) the resolution authority's assessment. MITHQAL is a SETTLEMENT SYSTEM — it is NOT a resolution authority. MITHQAL can coordinate (freeze, assess, route) but CANNOT trigger legal resolution.",
    replacementPattern: {
      designedMechanism:
        "The MITHQAL system is DESIGNED to coordinate the response to bank failure (per v25.3.13 SettlementContinuityFabric, BANK_DEFAULT event → DETECT → FREEZE → ASSESS → ALTERNATIVE ROUTE → RESUME → RECONCILE → EVIDENCE). The system coordinates — it does NOT trigger legal resolution.",
      requiredContract:
        "REQUIRED: A contract specifying who has the authority to trigger legal resolution (typically the resolution authority, NOT MITHQAL). This is a REQUIRED_CONTRACT.",
      requiredLegalAuthority:
        "REQUIRED: The applicable resolution law must designate the resolution authority (central bank, regulator, court). MITHQAL is NOT a resolution authority. REQUIRED_LEGAL_AUTHORITY.",
      requiredExternalEvidence:
        "REQUIRED: Confirmation from the resolution authority that they have assumed the resolution process. REQUIRED_EXTERNAL_EVIDENCE — the system waits for external confirmation, it does NOT trigger.",
    },
    coordinationRule:
      "The system MAY coordinate the response to bank failure (freeze, assess, route, reconcile, evidence). The system MUST NOT trigger legal resolution outcomes — that is the resolution authority's job.",
  },
];

// === The Replacement Pattern (per directive) ===

export const REPLACEMENT_PATTERN_RULE = {
  rule: "Replace unsupported statements with: DESIGNED_MECHANISM + REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE.",
  description:
    "Every statement about failure/default/resolution must be decomposed into: (1) what the system is DESIGNED to do (DESIGNED_MECHANISM), (2) what CONTRACT is required for it to work (REQUIRED_CONTRACT), (3) what LEGAL AUTHORITY is required (REQUIRED_LEGAL_AUTHORITY), (4) what EXTERNAL EVIDENCE is required (REQUIRED_EXTERNAL_EVIDENCE).",
  systemMayCoordinate:
    "The system may coordinate resolution — it may freeze, assess, route, reconcile, and generate evidence.",
  systemMustNotInventLegalRights:
    "The system must not invent legal rights — it cannot assert ownership, bankruptcy remoteness, no loss, automatic redemption, or resolution authority.",
};

// === The Coordination Rule (per directive) ===

export const COORDINATION_RULE = {
  rule: "The system may coordinate resolution; it must not invent legal rights.",
  whatSystemCanDo: [
    "Coordinate settlement routing (freeze, assess, alternative route, resume, reconcile, evidence)",
    "Track obligation status (per v25.3.9 obligation registry)",
    "Track PBC evidence (per v25.3.16 PBC Legal Enforceability)",
    "Track finality state (per v25.3.8 F0-F7)",
    "Generate evidence packages (per v25.3.8 Evidence Fabric)",
    "Trigger SettlementContinuityFabric events (per v25.3.13)",
  ],
  whatSystemCannotDo: [
    "Assert that another bank can automatically redeem against a failed bank's backing",
    "Assert that a PBC is automatically bankruptcy-remote",
    "Assert that holders suffer no loss",
    "Assert that a receiving bank never needs to advance funds",
    "Assert that MTQ remains fully redeemable regardless of local law",
    "Trigger legal resolution outcomes (that is the resolution authority's job)",
  ],
};

// === API ===

export function getForbiddenAssumption(
  id: ForbiddenAssumptionId,
): ForbiddenAssumption | undefined {
  return FORBIDDEN_ASSUMPTIONS.find((a) => a.id === id);
}

// === Status ===
export const LEGAL_CONDITIONALITY_STATUS = "ACTIVE";
export const LEGAL_CONDITIONALITY_VERSION = "v25.3.17-V1-1.0";
export const LEGAL_CONDITIONALITY_SOURCE =
  "src/lib/failure-resolution-legal-conditionality.ts";
export const FORBIDDEN_ASSUMPTION_COUNT = 6;

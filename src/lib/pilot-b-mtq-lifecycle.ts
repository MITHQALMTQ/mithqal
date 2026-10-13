/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL Pilot B — MTQ Lifecycle (Independently Gated MTQ Extension)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Pilot B inherits EVERY Pilot A control. MTQ functionality may activate
 * only after ALL 11 institutional prerequisites are met.
 *
 * FOUR MTQ STATES:
 *
 *   MTQ_DISABLED (default)
 *     → MTQ is completely off. No MTQ mint/redeem/transfer.
 *     → The control plane operates with BANK_MONEY (Pilot A mode).
 *
 *   MTQ_ELIGIBLE_PENDING
 *     → Eligibility process initiated. Prerequisites being checked.
 *     → MTQ still NOT active. No mint/redeem/transfer.
 *     → Software CAN initiate this transition (start the process).
 *
 *   MTQ_AUTHORIZED_FOR_PILOT
 *     → ALL 11 prerequisites met (including external evidence where required).
 *     → MTQ is AUTHORIZED but NOT yet active.
 *     → Requires an EXTERNAL institutional decision to activate.
 *
 *   MTQ_ACTIVE
 *     → MTQ is live in pilot mode.
 *     → CANNOT be reached from software configuration alone.
 *     → Requires EXTERNAL evidence (executed legal instrument, regulatory
 *       authorization, signed bank contract, independent assurance).
 *
 * STATE MACHINE:
 *
 *   MTQ_DISABLED
 *     ↓ (initiate eligibility — software can do this)
 *   MTQ_ELIGIBLE_PENDING
 *     ↓ (ALL 11 prerequisites pass — some require EXTERNAL evidence)
 *   MTQ_AUTHORIZED_FOR_PILOT
 *     ↓ (EXTERNAL institutional authorization — NOT reachable from config)
 *   MTQ_ACTIVE
 *
 * CRITICAL CONSTRAINT:
 *   MTQ_ACTIVE CANNOT be reached from software configuration alone.
 *   Setting MTQ_SETTLEMENT_ENABLED=true in .env does NOT activate MTQ.
 *   The 11 prerequisites MUST pass first, AND an external institutional
 *   authority MUST authorize activation.
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

import { MTQ_SETTLEMENT_ENABLED } from "./mtq-settlement-config";
import { PILOT_A_CONTROL_PLANE, PILOT_B_MTQ_SETTLEMENT } from "./two-pilot-modes";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * The four MTQ lifecycle states.
 */
export type MTQState =
  | "MTQ_DISABLED"
  | "MTQ_ELIGIBLE_PENDING"
  | "MTQ_AUTHORIZED_FOR_PILOT"
  | "MTQ_ACTIVE";

/**
 * The 11 institutional prerequisites for MTQ activation.
 */
export type PrerequisiteId =
  | "JURISDICTION_ELIGIBILITY"
  | "LEGAL_CLASSIFICATION"
  | "IDENTIFIED_OBLIGOR"
  | "REDEMPTION_FRAMEWORK"
  | "VERIFIED_BACKING"
  | "CUSTODY_LEGAL_CONTROLS"
  | "BANK_CONTRACT"
  | "LICENSING_AUTHORIZATION"
  | "FINALITY_CONDITIONS"
  | "ACCOUNTING_TREATMENT"
  | "INDEPENDENT_ASSURANCE";

/**
 * Whether a prerequisite can be satisfied by software or requires external evidence.
 */
export type EvidenceRequirement =
  | "SOFTWARE_CHECK"        // can be verified by code/config
  | "EXTERNAL_EVIDENCE"     // requires an independent external party's evidence
  | "EXECUTED_INSTRUMENT";  // requires a signed/executed legal instrument

/**
 * The status of a single prerequisite.
 */
export interface PrerequisiteStatus {
  id: PrerequisiteId;
  label: string;
  evidenceRequirement: EvidenceRequirement;
  status: "NOT_STARTED" | "IN_PROGRESS" | "PENDING_EXTERNAL" | "MET" | "FAILED";
  evidence: string;
  evidenceClass: "EXECUTED_LEGAL_INSTRUMENT" | "INDEPENDENT_VALIDATION" | "CONTROLLING_POLICY" | "APPROVED_CONFIGURATION" | "DOCUMENT_CLAIM" | "SIMULATED" | "DESIGN_TIME";
  externallyValidated: boolean;
  owner: string;
  nextAction: string;
  timestamp: string;
}

/**
 * The full MTQ lifecycle state.
 */
export interface MTQLifecycleState {
  currentState: MTQState;
  pilotBInheritsPilotA: boolean;
  pilotAControlsActive: boolean;
  mtqSetActive: boolean;
  mtqSettlementEnabledConfig: boolean;  // the raw config flag
  prerequisites: PrerequisiteStatus[];
  prerequisitesMet: number;
  prerequisitesTotal: number;
  allPrerequisitesMet: boolean;
  externalEvidenceRequired: boolean;
  canTransitionToActive: boolean;
  transitionBlocked: string[];
  honestState: {
    mtqDisabled: boolean;
    mtqActiveRequiresExternalEvidence: boolean;
    notReachableFromConfigAlone: boolean;
    productionAuthorized: boolean;
  };
}

/* ------------------------------------------------------------------ */
/*  The 11 Prerequisites (canonical definition)                         */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T06:51:00Z";

export const MTQ_PREREQUISITES: PrerequisiteStatus[] = [
  {
    id: "JURISDICTION_ELIGIBILITY",
    label: "Jurisdiction Eligibility",
    evidenceRequirement: "EXTERNAL_EVIDENCE",
    status: "PENDING_EXTERNAL",
    evidence: "jurisdiction-truth-model.ts: 8 jurisdictions ALL SEED_DATA/UNKNOWN. No jurisdiction has triaged regulatory material. UNKNOWN = CONSERVATIVE_BLOCK.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + regulatory counsel",
    nextAction: "Triage public regulatory material for each of 8 jurisdictions. MTQ requires jurisdiction-specific eligibility determination.",
    timestamp: NOW,
  },
  {
    id: "LEGAL_CLASSIFICATION",
    label: "Legal Classification of MTQ",
    evidenceRequirement: "EXTERNAL_EVIDENCE",
    status: "PENDING_EXTERNAL",
    evidence: "mtq-economic-definition.ts: MTQ = 'permissioned, institutional, closed-loop settlement unit'. Legal classification = PENDING_VALIDATION. No external legal opinion obtained.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + external legal counsel",
    nextAction: "Engage external legal counsel for MTQ legal classification opinion (commodity? security? payment instrument? e-money?)",
    timestamp: NOW,
  },
  {
    id: "IDENTIFIED_OBLIGOR",
    label: "Identified Obligor",
    evidenceRequirement: "EXECUTED_INSTRUMENT",
    status: "PENDING_EXTERNAL",
    evidence: "institutional-operating-model.ts: bankFacingCounterpartyEntityId = 'JOZOUR_LLC_NJ'. But NO executed obligor agreement exists. The obligor must be a legally identified entity with executed contracts.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + external legal counsel",
    nextAction: "Execute obligor agreement (requires legal classification + jurisdiction eligibility first)",
    timestamp: NOW,
  },
  {
    id: "REDEMPTION_FRAMEWORK",
    label: "Redemption Framework",
    evidenceRequirement: "EXTERNAL_EVIDENCE",
    status: "PENDING_EXTERNAL",
    evidence: "mtq-redemption-value-consistency.ts: ONE canonical redemption framework = PENDING. No external validation of redemption mechanics. No executed redemption agreement with any bank.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + external counsel",
    nextAction: "Define + externally validate the redemption framework (requires legal classification + obligor first)",
    timestamp: NOW,
  },
  {
    id: "VERIFIED_BACKING",
    label: "Verified Backing",
    evidenceRequirement: "EXTERNAL_EVIDENCE",
    status: "PENDING_EXTERNAL",
    evidence: "reserve-domains.ts: 2 domains. Gold in STRATEGIC_RESILIENCE (NOT settlement backing). SETTLEMENT_LIQUIDITY has no qualified custodian. reserve-coverage-logic.ts: coverageRatio computed but unbacked by physical custody evidence.",
    evidenceClass: "SIMULATED",
    externallyValidated: false,
    owner: "COO + custody counsel + external auditor",
    nextAction: "Engage qualified custodian + obtain independent attestation of physical reserves",
    timestamp: NOW,
  },
  {
    id: "CUSTODY_LEGAL_CONTROLS",
    label: "Required Custody/Legal Controls",
    evidenceRequirement: "EXECUTED_INSTRUMENT",
    status: "PENDING_EXTERNAL",
    evidence: "pbc-legal-enforceability.ts: 14 fields, 6 failure states, 0 evidence predicates met. PBC counts as AvailableBacking ONLY when ALL 14 evidence predicates exist. No custodian engaged.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + custody counsel",
    nextAction: "Execute custody agreement (requires verified backing + legal classification first)",
    timestamp: NOW,
  },
  {
    id: "BANK_CONTRACT",
    label: "Bank Contract (Executed)",
    evidenceRequirement: "EXECUTED_INSTRUMENT",
    status: "PENDING_EXTERNAL",
    evidence: "bank-contracting-package.ts: 17 sections ALL DRAFT, 0 SIGNED. No contract may become SIGNED without actual executed evidence. 0 banks engaged.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO",
    nextAction: "Execute bank master agreement (requires ALL prior prerequisites first)",
    timestamp: NOW,
  },
  {
    id: "LICENSING_AUTHORIZATION",
    label: "Applicable Licensing/Authorization",
    evidenceRequirement: "EXTERNAL_EVIDENCE",
    status: "PENDING_EXTERNAL",
    evidence: "jurisdiction-truth-model.ts: No regulator engagement in any jurisdiction. No sandbox/admission application filed. No licensing or authorization obtained.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + regulatory counsel",
    nextAction: "Apply for regulatory authorization in each applicable jurisdiction (requires jurisdiction eligibility first)",
    timestamp: NOW,
  },
  {
    id: "FINALITY_CONDITIONS",
    label: "Finality Conditions",
    evidenceRequirement: "EXTERNAL_EVIDENCE",
    status: "PENDING_EXTERNAL",
    evidence: "canonical-finality-model.ts: F0-F7 stages defined. F7 (LEGAL_FINALITY) requires external legal evidence. No finality condition has been externally validated. Bank money finality (F6) works in Pilot A; MTQ finality (F7) requires legal opinion.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + external legal counsel",
    nextAction: "Obtain external legal opinion on MTQ settlement finality (requires legal classification + bank contract first)",
    timestamp: NOW,
  },
  {
    id: "ACCOUNTING_TREATMENT",
    label: "Accounting Treatment",
    evidenceRequirement: "EXTERNAL_EVIDENCE",
    status: "PENDING_EXTERNAL",
    evidence: "accounting-prudential-tax-framework.ts: 10 areas ALL PENDING_EXTERNAL_VALIDATION. MTQ accounting treatment (asset? liability? equity?) requires external accounting opinion. 0 areas have reached EXTERNAL stage.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + external accounting firm",
    nextAction: "Engage external accounting firm for MTQ accounting classification (requires legal classification first)",
    timestamp: NOW,
  },
  {
    id: "INDEPENDENT_ASSURANCE",
    label: "Independent Assurance Requirements",
    evidenceRequirement: "EXTERNAL_EVIDENCE",
    status: "PENDING_EXTERNAL",
    evidence: "technical-evidence-classification.ts: 42 forbidden equivalences enforced. HTTP 200 ≠ production readiness. No independent assurance audit performed. evidence-fabric.ts: 0 packages INSTITUTIONALLY_VERIFIED.",
    evidenceClass: "DOCUMENT_CLAIM",
    externallyValidated: false,
    owner: "COO + external auditor",
    nextAction: "Commission independent institutional audit (requires ALL prior prerequisites first — this is the GATEKEEPER)",
    timestamp: NOW,
  },
];

/* ------------------------------------------------------------------ */
/*  State Machine                                                      */
/* ------------------------------------------------------------------ */

/**
 * Valid state transitions.
 * MTQ_DISABLED → MTQ_ELIGIBLE_PENDING → MTQ_AUTHORIZED_FOR_PILOT → MTQ_ACTIVE
 *
 * MTQ_ACTIVE CANNOT be reached from configuration alone.
 * The transition MTQ_AUTHORIZED_FOR_PILOT → MTQ_ACTIVE requires
 * `externalAuthorization = true` which can ONLY be set by an external
 * institutional authority (not by software, not by config, not by code).
 */
export function canTransition(
  from: MTQState,
  to: MTQState,
  prerequisites: PrerequisiteStatus[],
  externalAuthorization: boolean,
): { allowed: boolean; reason: string } {
  // Cannot skip states
  const order: MTQState[] = ["MTQ_DISABLED", "MTQ_ELIGIBLE_PENDING", "MTQ_AUTHORIZED_FOR_PILOT", "MTQ_ACTIVE"];
  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(to);

  if (toIdx !== fromIdx + 1) {
    return { allowed: false, reason: `Cannot transition ${from} → ${to}. Must follow sequential order: DISABLED → ELIGIBLE_PENDING → AUTHORIZED → ACTIVE.` };
  }

  // MTQ_DISABLED → MTQ_ELIGIBLE_PENDING: software can initiate
  if (from === "MTQ_DISABLED" && to === "MTQ_ELIGIBLE_PENDING") {
    return { allowed: true, reason: "Eligibility process initiated. Prerequisites being checked." };
  }

  // MTQ_ELIGIBLE_PENDING → MTQ_AUTHORIZED_FOR_PILOT: ALL prerequisites must be MET
  if (from === "MTQ_ELIGIBLE_PENDING" && to === "MTQ_AUTHORIZED_FOR_PILOT") {
    const unmet = prerequisites.filter(p => p.status !== "MET");
    if (unmet.length > 0) {
      return {
        allowed: false,
        reason: `${unmet.length}/${prerequisites.length} prerequisites not MET: ${unmet.map(p => p.id).join(", ")}. ALL must be MET (including external evidence) before authorization.`,
      };
    }
    return { allowed: true, reason: "ALL prerequisites MET. Authorized for pilot (pending external activation decision)." };
  }

  // MTQ_AUTHORIZED_FOR_PILOT → MTQ_ACTIVE: REQUIRES external authorization
  if (from === "MTQ_AUTHORIZED_FOR_PILOT" && to === "MTQ_ACTIVE") {
    if (!externalAuthorization) {
      return {
        allowed: false,
        reason: "MTQ_ACTIVE CANNOT be reached from software configuration alone. External institutional authorization required (executed legal instrument, regulatory approval, signed bank contract, independent assurance). This is a FORBIDDEN EQUIVALENCE: CONFIGURATION ≠ REGULATORY AUTHORIZATION.",
      };
    }
    return { allowed: true, reason: "External institutional authorization provided. MTQ_ACTIVE." };
  }

  return { allowed: false, reason: "Invalid transition." };
}

/* ------------------------------------------------------------------ */
/*  Current Lifecycle State                                           */
/* ------------------------------------------------------------------ */

/**
 * Get the current MTQ lifecycle state.
 *
 * The state is determined by:
 * 1. The config flag (MTQ_SETTLEMENT_ENABLED) — but this does NOT determine MTQ_ACTIVE
 * 2. The prerequisite statuses — ALL must be MET for AUTHORIZED
 * 3. External authorization — required for ACTIVE (not available from code)
 *
 * HONEST STATE: ALL prerequisites are PENDING_EXTERNAL. MTQ is DISABLED.
 */
export function getMTQLifecycleState(externalAuthorization: boolean = false): MTQLifecycleState {
  const prerequisitesMet = MTQ_PREREQUISITES.filter(p => p.status === "MET").length;
  const allMet = prerequisitesMet === MTQ_PREREQUISITES.length;
  const externalEvidenceRequired = MTQ_PREREQUISITES.some(p => p.evidenceRequirement !== "SOFTWARE_CHECK");

  // Determine current state
  let currentState: MTQState = "MTQ_DISABLED";

  // Can only advance to ELIGIBLE_PENDING if the process has been initiated
  // (For now, honest state: NOT initiated — still MTQ_DISABLED)
  // currentState = "MTQ_DISABLED"

  // Can only advance to AUTHORIZED if ALL prerequisites are MET
  // (For now: 0/11 MET — still MTQ_DISABLED or MTQ_ELIGIBLE_PENDING)

  // Can only advance to ACTIVE if external authorization is provided
  // (For now: no external authorization — cannot reach MTQ_ACTIVE)

  const transitionBlocked: string[] = [];
  if (currentState === "MTQ_DISABLED") {
    const transition = canTransition("MTQ_DISABLED", "MTQ_ELIGIBLE_PENDING", MTQ_PREREQUISITES, externalAuthorization);
    if (!transition.allowed) transitionBlocked.push(transition.reason);
  }

  return {
    currentState,
    pilotBInheritsPilotA: true,  // Pilot B inherits ALL Pilot A controls
    pilotAControlsActive: true,   // Pilot A control plane is active (BANK_MONEY)
    mtqSetActive: false,          // MTQ is NOT active
    mtqSettlementEnabledConfig: MTQ_SETTLEMENT_ENABLED,  // raw config flag (may be true, but doesn't matter)
    prerequisites: MTQ_PREREQUISITES,
    prerequisitesMet,
    prerequisitesTotal: MTQ_PREREQUISITES.length,
    allPrerequisitesMet: allMet,
    externalEvidenceRequired,
    canTransitionToActive: false,  // CANNOT — requires ALL prerequisites + external authorization
    transitionBlocked: [
      `${prerequisitesMet}/${MTQ_PREREQUISITES.length} prerequisites MET (ALL required for MTQ_AUTHORIZED_FOR_PILOT)`,
      "External institutional authorization required for MTQ_ACTIVE (NOT reachable from config)",
      ...transitionBlocked,
    ],
    honestState: {
      mtqDisabled: currentState === "MTQ_DISABLED",
      mtqActiveRequiresExternalEvidence: true,
      notReachableFromConfigAlone: true,
      productionAuthorized: false,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Attempt Transition (honest enforcement)                           */
/* ------------------------------------------------------------------ */

/**
 * Attempt a state transition. Enforces ALL constraints honestly.
 *
 * This function will REFUSE to set MTQ_ACTIVE from config alone.
 * Even if MTQ_SETTLEMENT_ENABLED=true is set in .env, the lifecycle
 * will NOT reach MTQ_ACTIVE without:
 *   1. ALL 11 prerequisites MET (including external evidence)
 *   2. externalAuthorization = true (from an external institutional authority)
 */
export function attemptTransition(
  targetState: MTQState,
  externalAuthorization: boolean = false,
): { success: boolean; fromState: MTQState; toState: MTQState; reason: string } {
  const current = getMTQLifecycleState(externalAuthorization);
  const transition = canTransition(current.currentState, targetState, MTQ_PREREQUISITES, externalAuthorization);

  return {
    success: transition.allowed,
    fromState: current.currentState,
    toState: targetState,
    reason: transition.reason,
  };
}

/* ------------------------------------------------------------------ */
/*  Module Metadata                                                   */
/* ------------------------------------------------------------------ */

export const PILOT_B_META = {
  module: "pilot-b-mtq-lifecycle",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: "2026-10-01",
  honestState: "NOT PRODUCTION-AUTHORIZED",
  description:
    "Pilot B — independently gated MTQ extension. Inherits ALL Pilot A controls. " +
    "4-state lifecycle: MTQ_DISABLED → MTQ_ELIGIBLE_PENDING → MTQ_AUTHORIZED_FOR_PILOT → MTQ_ACTIVE. " +
    "MTQ_ACTIVE CANNOT be reached from software configuration alone.",
  pilotBInheritsPilotA: PILOT_B_MTQ_SETTLEMENT.inheritsFrom === PILOT_A_CONTROL_PLANE.id,
  mtqStates: ["MTQ_DISABLED", "MTQ_ELIGIBLE_PENDING", "MTQ_AUTHORIZED_FOR_PILOT", "MTQ_ACTIVE"] as MTQState[],
  prerequisiteCount: MTQ_PREREQUISITES.length,
  externalEvidenceRequiredPrerequisites: MTQ_PREREQUISITES.filter(p => p.evidenceRequirement !== "SOFTWARE_CHECK").length,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  MTQ is DISABLED by default. The current state is MTQ_DISABLED.
//  0/11 prerequisites are MET. ALL are PENDING_EXTERNAL.
//
//  MTQ_ACTIVE CANNOT be reached from:
//    - Software configuration (MTQ_SETTLEMENT_ENABLED=true does NOT activate)
//    - Code (no function can set MTQ_ACTIVE without external evidence)
//    - Test pass (tests do NOT validate institutional prerequisites)
//    - Document claim (this module describes the rules, not the evidence)
//
//  FORBIDDEN EQUIVALENCES enforced:
//    - CONFIGURATION ≠ REGULATORY AUTHORIZATION (FE_3)
//    - CODE ≠ LEGAL AUTHORITY (FE_1)
//    - TEST PASS ≠ INSTITUTIONAL VALIDATION (FE_2)
//    - DOCUMENT CLAIM ≠ EXECUTION TRUTH (FE_4)
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════

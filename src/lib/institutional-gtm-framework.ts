// src/lib/institutional-gtm-framework.ts
//
// MITHQAL v25.3.20 — INSTITUTIONAL GTM / DESIGN-PARTNER FRAMEWORK
// (single source of truth for evidence-gated institutional go-to-market)
//
// Per PROMPT 36 (verbatim):
//   "Create an evidence-gated institutional GTM framework.
//    The first target must be selected using:
//    Corridor Pain Index + regulatory feasibility + technical feasibility +
//    executive sponsorship + integration capacity + evidence/reference value.
//    Define:
//    target-account profile, decision-maker map, engagement sequence,
//    pilot offer, bank value proposition, regulatory engagement path,
//    design-partner criteria, required evidence and progression states.
//    Use:
//    RESEARCHED → CONTACTED → QUALIFIED → ARCHITECTURE_REVIEW →
//    LEGAL_REVIEW → PILOT_CANDIDATE → CONTRACTED → PILOT → MEASURED.
//    Do not hard-code a specific bank, regulator or corridor as the winner."
//
// CHANGE REQUEST: CR-2026-012 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.20
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - Evidence-gated — progression between states requires explicit evidence
//   - No hard-coded bank, regulator or corridor — first target is selected
//     by 6-factor scoring (NO_HARD_CODED_WINNER_RULE)
//
// Cross-references prior canonical modules:
//   - v25.3.5 K2/K3 (MTQ economic definition + reserve coverage)
//   - v25.3.6 K4 (reserve domains — Settlement Liquidity vs Strategic Resilience)
//   - v25.3.6 J3 (control-plane boundary — CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE)
//   - v25.3.7 M1/M2 (institutional operating model — JOZOUR_LLC_NJ + trust domains)
//   - v25.3.8 N1 (canonical finality model F0-F7)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry)
//   - v25.3.9 O2 (6 reconciliation tolerance policies)
//   - v25.3.10 P1 (Corridor Pain Index — 12 weighted factors — used as factor #1 here)
//   - v25.3.10 P2 (two pilot modes — A control plane + B MTQ settlement)
//   - v25.3.11 Q1 (bank value model — bank value proposition re-uses Q1 evidence status labels)
//   - v25.3.11 Q2 (pilot gate framework — 15 default gates — referenced by pilot offer)
//   - v25.3.12 R1 (bank-facing document set — referenced by engagement sequence)
//   - v25.3.12 R2 (RegulatoryReplayEngine — referenced by regulatory engagement path)
//   - v25.3.13 S1 (SettlementContinuityFabric — referenced by design-partner criteria)
//   - v25.3.14 T2 (Controlled Architecture Freeze — 10 frozen schemas)
//   - v25.3.15 T1 (Adversarial Tests — 17/17 passed)
//   - v25.3.16 U1 (P25 Accounting/Prudential/Tax — referenced by regulatory engagement path)
//   - v25.3.16 U2 (P26 PBC Legal Enforceability — referenced by legal review)
//   - v25.3.17 V1 (PROMPT 27 Failure/Default/Resolution Legal Conditionality)
//   - v25.3.18 W1 (P28 Bank Contracting Package — 17 sections ALL DRAFT — referenced by CONTRACTED state)
//   - v25.3.18 W2 (P30 Enterprise Risk Register + P31 Insurance Framework)
//   - v25.3.19 X2 (P34 Competitive Compatibility Framework)
//   - v25.3.19 X1 (P32 Data Governance + P33 Dispute & Exception Framework)
//   - v25.3.20 Y1 (P35 Pricing Architecture — fees cannot influence control-plane,
//     so fee stage cannot advance GTM state — FEE_INDEPENDENCE_RULE applies here too)
//
// HONEST-STATE RULES (per directive):
//   - "Do not hard-code a specific bank, regulator or corridor as the winner."
//     (NO_HARD_CODED_WINNER_RULE — first target selected by 6-factor scoring;
//      all candidate targets start as RESEARCHED; no bank has been contacted)
//   - "evidence-gated" — every state transition requires explicit evidence
//     (per N2 evidence fabric + W1 NO_CONTRACT_WITHOUT_EVIDENCE_RULE)

// ============================================================================
// TYPES
// ============================================================================

// 9 progression states per directive (verbatim ordered list):
//   RESEARCHED → CONTACTED → QUALIFIED → ARCHITECTURE_REVIEW →
//   LEGAL_REVIEW → PILOT_CANDIDATE → CONTRACTED → PILOT → MEASURED
export type GTMProgressionState =
  | "RESEARCHED"
  | "CONTACTED"
  | "QUALIFIED"
  | "ARCHITECTURE_REVIEW"
  | "LEGAL_REVIEW"
  | "PILOT_CANDIDATE"
  | "CONTRACTED"
  | "PILOT"
  | "MEASURED";

// 6 target-selection factors per directive (verbatim list):
//   Corridor Pain Index + regulatory feasibility + technical feasibility +
//   executive sponsorship + integration capacity + evidence/reference value
export type TargetSelectionFactorId =
  | "CORRIDOR_PAIN_INDEX" // per v25.3.10 P1 — 12 weighted factors
  | "REGULATORY_FEASIBILITY"
  | "TECHNICAL_FEASIBILITY"
  | "EXECUTIVE_SPONSORSHIP"
  | "INTEGRATION_CAPACITY"
  | "EVIDENCE_REFERENCE_VALUE";

// 9 definition areas per directive (verbatim list):
//   target-account profile, decision-maker map, engagement sequence,
//   pilot offer, bank value proposition, regulatory engagement path,
//   design-partner criteria, required evidence, progression states
export type DefinitionAreaId =
  | "TARGET_ACCOUNT_PROFILE"
  | "DECISION_MAKER_MAP"
  | "ENGAGEMENT_SEQUENCE"
  | "PILOT_OFFER"
  | "BANK_VALUE_PROPOSITION"
  | "REGULATORY_ENGAGEMENT_PATH"
  | "DESIGN_PARTNER_CRITERIA"
  | "REQUIRED_EVIDENCE"
  | "PROGRESSION_STATES";

// Honest state-status for a candidate target. Per directive: "Do not hard-
// code a specific bank, regulator or corridor as the winner." All candidate
// targets start as RESEARCHED — no bank has been contacted yet.
export type CandidateTargetState = "RESEARCHED"; // honest default — sole value at module load

// Scored factor (numeric score is PENDING per honest state — the SCORING
// SHAPE is defined; the actual numeric scores require live engagement)
export interface ScoredFactor {
  factorId: TargetSelectionFactorId;
  name: string;
  description: string;
  // Weight in the aggregate score (all 6 weights sum to 1.00).
  // Per v25.3.10 P1 corridor-pain-index pattern.
  weight: number;
  // Numeric score 0..100. Per honest state: PENDING until live research.
  // Stored as string to avoid IEEE-754 ambiguity + to allow "PENDING" sentinel.
  score: "PENDING" | number;
  // Required evidence to convert this factor from PENDING to a numeric score
  requiredEvidence: string;
}

// A candidate target (bank + corridor). Per NO_HARD_CODED_WINNER_RULE no
// specific bank/regulator/corridor is hard-coded. All start RESEARCHED.
export interface CandidateTarget {
  targetId: string; // opaque identifier — no bank name encoded
  // Per directive: "Do not hard-code a specific bank, regulator or corridor
  //  as the winner." Targets are described by ROLE/PROFILE, not by name.
  // The bank entity name, regulator name, and corridor ID are PENDING until
  // a candidate is contacted (CONTACTED state) and an evidence package is
  // recorded (per N2 Evidence Fabric).
  bankEntityName: "PENDING"; // honest — no bank named
  regulatorName: "PENDING"; // honest — no regulator named
  corridorId: "PENDING"; // honest — no corridor named
  // Profile description (per directive: "target-account profile")
  accountProfileSummary: string;
  // 6 scored factors
  scoredFactors: ScoredFactor[];
  // Aggregate score (sum of weighted scores). PENDING until live scoring.
  aggregateScore: "PENDING" | number;
  // Current progression state — honest default RESEARCHED for all candidates
  currentState: CandidateTargetState;
  // Whether this candidate has been designated as "the winner". Per
  // NO_HARD_CODED_WINNER_RULE, this is ALWAYS false at module load —
  // winner designation requires MEASURED state + evidence (per directive).
  isHardCodedWinner: false;
}

// Definition-area record (one per directive's 9 definition areas)
export interface DefinitionArea {
  areaId: DefinitionAreaId;
  name: string;
  description: string;
  // Required evidence to complete this area
  requiredEvidence: string;
  // Whether this area is PENDING (honest state) or completed
  status: "PENDING"; // all PENDING — no candidate engaged
}

// Progression-state transition record
export interface ProgressionTransition {
  fromState: GTMProgressionState;
  toState: GTMProgressionState;
  // Required evidence to advance (per N2 evidence fabric + W1 NO_CONTRACT_WITHOUT_EVIDENCE_RULE)
  requiredEvidence: string;
  // Whether fee payment status may gate this transition.
  // ALWAYS false per FEE_INDEPENDENCE_RULE (per v25.3.20 Y1 P35).
  feeMayGateTransition: false;
}

// ============================================================================
// CRITICAL RULE (per directive)
// ============================================================================

export const NO_HARD_CODED_WINNER_RULE = {
  ruleId: "NO_HARD_CODED_WINNER_RULE",
  rule:
    "Do not hard-code a specific bank, regulator or corridor as the winner. " +
    "The first target is selected using the 6-factor scoring " +
    "(Corridor Pain Index + regulatory feasibility + technical feasibility + " +
    "executive sponsorship + integration capacity + evidence/reference value).",
  description:
    "Per PROMPT 36: 'Do not hard-code a specific bank, regulator or corridor as the winner.' " +
    "The framework defines the SHAPE of target selection (6 factors, weights, required evidence) " +
    "but does NOT name a specific bank, regulator, or corridor as the designated winner. " +
    "All candidate targets carry bankEntityName = 'PENDING', regulatorName = 'PENDING', corridorId = 'PENDING', " +
    "currentState = 'RESEARCHED', isHardCodedWinner = false. Winner designation requires progression to MEASURED state " +
    "with executed evidence — and even then the designation is by aggregate score, not by hard-coded identity.",
  whatItForbids:
    "(1) Hard-coding a named bank (e.g., 'Bank X') as the first target. " +
    "(2) Hard-coding a named regulator (e.g., 'Regulator Y') as the regulatory path. " +
    "(3) Hard-coding a named corridor (e.g., 'AED→EGP') as the first corridor. " +
    "(4) Setting any candidate's isHardCodedWinner = true. " +
    "(5) Pre-populating scored factors with numeric values that would pre-empt the 6-factor scoring.",
  whatItPermits:
    "(1) Defining the 6-factor scoring shape (factor IDs, weights, required evidence). " +
    "(2) Recording future scores when supported by executed research evidence. " +
    "(3) Internal modeling of scoring scenarios for design purposes — provided the output is clearly labeled " +
    "ILLUSTRATIVE (per Q1 evidence status labels) and never surfaced as the actual selected target. " +
    "(4) Designating a winner ONLY after MEASURED state + aggregate score comparison.",
  enforcement:
    "All candidate targets carry isHardCodedWinner = false. All bankEntityName / regulatorName / corridorId = 'PENDING'. " +
    "All scored factor scores = 'PENDING'. All candidate currentState = 'RESEARCHED'. " +
    "Runtime invariant check at module load scans every candidate target and asserts these honest-state values.",
  selectionFactors: [
    "Corridor Pain Index (per v25.3.10 P1)",
    "Regulatory feasibility",
    "Technical feasibility",
    "Executive sponsorship",
    "Integration capacity",
    "Evidence / reference value",
  ],
  honestState:
    "0 candidates designated as winner. 0 candidates with named bank/regulator/corridor. " +
    "All candidates at RESEARCHED state. 0 candidates with non-PENDING scores. " +
    "No bank has been contacted under this GTM framework.",
} as const;

// ============================================================================
// THE 9 PROGRESSION STATES (catalog for transparency / API surfacing)
// ============================================================================

export const PROGRESSION_STATES: GTMProgressionState[] = [
  "RESEARCHED",
  "CONTACTED",
  "QUALIFIED",
  "ARCHITECTURE_REVIEW",
  "LEGAL_REVIEW",
  "PILOT_CANDIDATE",
  "CONTRACTED",
  "PILOT",
  "MEASURED",
];

export const PROGRESSION_STATE_COUNT = PROGRESSION_STATES.length; // 9

// ============================================================================
// THE 6 TARGET-SELECTION FACTORS
// ============================================================================
//
// HONEST-STATE — all scores are "PENDING". The framework defines the SHAPE
// (factor IDs, weights summing to 1.00, required evidence) — not live scores.
// Per NO_HARD_CODED_WINNER_RULE: no candidate may carry pre-populated scores.

export const TARGET_SELECTION_FACTORS: ScoredFactor[] = [
  {
    factorId: "CORRIDOR_PAIN_INDEX",
    name: "Corridor Pain Index",
    description:
      "Per v25.3.10 P1 corridor-pain-index — 12 weighted factors measuring settlement friction " +
      "(cost, speed, transparency, reconciliation, regulatory friction, FX risk, etc.) for a candidate corridor. " +
      "MITHQAL targets corridors where the pain index indicates the highest unmet institutional settlement need.",
    weight: 0.25,
    score: "PENDING",
    requiredEvidence:
      "Per P1: a configured CandidateCorridor with 12-factor pain score computed from validated market data. " +
      "Per Q1 evidence status labels: the pain score must reach at least ILLUSTRATIVE before this factor may be scored.",
  },
  {
    factorId: "REGULATORY_FEASIBILITY",
    name: "Regulatory Feasibility",
    description:
      "Whether the candidate bank's home regulator permits institutional settlement coordination via a non-bank " +
      "control-plane operator (per v25.3.12 R2 RegulatoryReplayEngine — READ-ONLY; per v25.3.16 U1 P25 Accounting/" +
      "Prudential/Tax Framework — prudential treatment; per v25.3.18 W2 P30 Enterprise Risk Register — regulatory risk). " +
      "MITHQAL coordinates with regulators; it does NOT displace them (per v25.3.19 X2 NO_SUPERIORITY_RULE).",
    weight: 0.20,
    score: "PENDING",
    requiredEvidence:
      "Per R2: a regulatory decision-context replay for the candidate's home jurisdiction. " +
      "Per U1: prudential classification (PENDING_EXTERNAL_VALIDATION or stronger). " +
      "Per Q1: at least ILLUSTRATIVE regulatory analysis before this factor may be scored.",
  },
  {
    factorId: "TECHNICAL_FEASIBILITY",
    name: "Technical Feasibility",
    description:
      "Whether the candidate bank's technical estate can integrate with the MITHQAL control-plane perimeter " +
      "(per v25.3.6 J3 CONTROL_PLANE_CORE) via standard adapters (per v25.3.20 Y1 P35 CONNECTIVITY_FEE + " +
      "ENTERPRISE_INTEGRATION_FEE) — covers API gateway access, mutual-TLS lifecycle, ISO 20022 message compatibility " +
      "(per v25.3.19 X2 — MITHQAL may ingest SWIFT message references; not a prerequisite for viability).",
    weight: 0.15,
    score: "PENDING",
    requiredEvidence:
      "Architecture-review document confirming API gateway, mTLS, and ISO 20022 message compatibility. " +
      "Per Q1: at least ILLUSTRATIVE architecture review before this factor may be scored.",
  },
  {
    factorId: "EXECUTIVE_SPONSORSHIP",
    name: "Executive Sponsorship",
    description:
      "Whether the candidate bank has an executive sponsor (C-suite or head of wholesale payments / treasury / " +
      "transaction banking) with mandate to evaluate institutional settlement coordination. " +
      "Per W1 bank-contracting-package: sponsor must be named in the contract authority section.",
    weight: 0.15,
    score: "PENDING",
    requiredEvidence:
      "Named executive sponsor with stated mandate; recorded engagement log entry (per N2 evidence fabric).",
  },
  {
    factorId: "INTEGRATION_CAPACITY",
    name: "Integration Capacity",
    description:
      "Whether the candidate bank has engineering and operational capacity to dedicate to the implementation engagement " +
      "(per v25.3.20 Y1 P35 IMPLEMENTATION_FEE + ENTERPRISE_INTEGRATION_FEE) — covers product owner, technical lead, " +
      "compliance liaison, and operations liaison availability over the engagement window.",
    weight: 0.15,
    score: "PENDING",
    requiredEvidence:
      "Named integration team with stated availability; recorded engagement log entry (per N2 evidence fabric).",
  },
  {
    factorId: "EVIDENCE_REFERENCE_VALUE",
    name: "Evidence / Reference Value",
    description:
      "The reference value that completing a pilot with this candidate would generate for the broader institutional " +
      "evidence base (per v25.3.8 N2 Evidence Fabric + Q1 evidence status labels — SIMULATED → ILLUSTRATIVE → " +
      "VALIDATED → INSTITUTIONALLY_VERIFIED). Candidates that unlock more evidence-quality progression are preferred " +
      "all else equal — but no candidate may be pre-designated the winner on this basis alone (per NO_HARD_CODED_WINNER_RULE).",
    weight: 0.10,
    score: "PENDING",
    requiredEvidence:
      "Evidence-fabric impact assessment listing the N2 EvidencePackage fields and Q1 evidence status labels " +
      "that would advance if this candidate reaches MEASURED state.",
  },
];

export const TARGET_SELECTION_FACTOR_COUNT = TARGET_SELECTION_FACTORS.length; // 6

// ============================================================================
// THE 9 DEFINITION AREAS (per directive)
// ============================================================================

export const DEFINITION_AREAS: DefinitionArea[] = [
  {
    areaId: "TARGET_ACCOUNT_PROFILE",
    name: "Target-Account Profile",
    description:
      "Per directive: 'target-account profile'. Profile of an ideal institutional settlement-coordination counterparty — " +
      "bank type (universal / wholesale / transaction-banking-focused), asset scale, corridor footprint, technical maturity, " +
      "regulatory posture, and innovation mandate. Described by profile attributes, NOT by a named bank (per NO_HARD_CODED_WINNER_RULE).",
    requiredEvidence:
      "Documented profile attributes (bank type, scale, corridor footprint, technical maturity, regulatory posture, innovation mandate). " +
      "Per Q1: at least ILLUSTRATIVE before this area may be completed.",
    status: "PENDING",
  },
  {
    areaId: "DECISION_MAKER_MAP",
    name: "Decision-Maker Map",
    description:
      "Per directive: 'decision-maker map'. Roles involved in the bank's evaluation of institutional settlement coordination — " +
      "executive sponsor (CEO/COO/CFO/CIO), head of wholesale payments / treasury / transaction banking, CISO, head of compliance, " +
      "head of legal, head of operations. Described by role, NOT by named individuals (per NO_HARD_CODED_WINNER_RULE).",
    requiredEvidence:
      "Role list with stated decision authority and stated evaluation criteria. " +
      "Per W1 §1 contract authority: named sponsor at CONTRACTED state only (per N2 evidence).",
    status: "PENDING",
  },
  {
    areaId: "ENGAGEMENT_SEQUENCE",
    name: "Engagement Sequence",
    description:
      "Per directive: 'engagement sequence'. The ordered interactions between MITHQAL and the candidate bank — initial briefing, " +
      "technical architecture review (per v25.3.6 J3), legal review (per v25.3.16 U2 P26 PBC Legal Enforceability + " +
      "v25.3.17 V1 PROMPT 27 Failure/Default/Resolution Legal Conditionality), pilot scoping (per v25.3.11 Q2 pilot gate " +
      "framework + v25.3.10 P2 two pilot modes), contracting (per v25.3.18 W1 bank-contracting-package 17 sections), " +
      "pilot execution (per v25.3.13 S1 SettlementContinuityFabric), measurement (per v25.3.8 N2 evidence fabric).",
    requiredEvidence:
      "Documented engagement sequence with state-to-state transitions (per PROGRESSION_STATES below) and required evidence per transition. " +
      "Per Q1: at least ILLUSTRATIVE before this area may be completed.",
    status: "PENDING",
  },
  {
    areaId: "PILOT_OFFER",
    name: "Pilot Offer",
    description:
      "Per directive: 'pilot offer'. The scoped pilot offered to the candidate — covers pilot mode (per v25.3.10 P2: " +
      "PILOT_A_CONTROL_PLANE 8 test areas OR PILOT_B_MTQ_SETTLEMENT 7 test areas), pilot gates (per v25.3.11 Q2 15 default gates), " +
      "pilot duration, pilot success criteria, and pilot commercial terms (per v25.3.20 Y1 P35 — pricing SEPARATE from ROI engine; " +
      "fees cannot influence pilot gate progression per FEE_INDEPENDENCE_RULE).",
    requiredEvidence:
      "Documented pilot offer with selected pilot mode, gate schedule, success criteria, and commercial terms reference (per Y1 P35). " +
      "Per Q1: at least ILLUSTRATIVE before this area may be completed.",
    status: "PENDING",
  },
  {
    areaId: "BANK_VALUE_PROPOSITION",
    name: "Bank Value Proposition",
    description:
      "Per directive: 'bank value proposition'. The value MITHQAL offers to the candidate bank — measured by the bank-value-model " +
      "(per v25.3.11 Q1) with explicit evidence status labels (SIMULATED / ILLUSTRATIVE / VALIDATED / INSTITUTIONALLY_VERIFIED). " +
      "Per v25.3.20 Y1 P35 FEE_INDEPENDENCE_RULE: pricing is SEPARATE from the ROI engine — the value proposition does NOT " +
      "depend on fee schedule, and fee schedule does NOT influence the value calculation.",
    requiredEvidence:
      "Bank-value-model computation (per Q1) with stated evidence status. Per Q1: SIMULATED is the floor — ILLUSTRATIVE or higher is preferred.",
    status: "PENDING",
  },
  {
    areaId: "REGULATORY_ENGAGEMENT_PATH",
    name: "Regulatory Engagement Path",
    description:
      "Per directive: 'regulatory engagement path'. The path by which MITHQAL engages the candidate bank's home regulator — " +
      "regulatory briefing, regulatory decision-context replay (per v25.3.12 R2 RegulatoryReplayEngine — READ-ONLY), " +
      "prudential classification (per v25.3.16 U1 P25), and continuity evidence (per v25.3.13 S1). " +
      "MITHQAL coordinates with regulators; does NOT displace them (per v25.3.19 X2 NO_SUPERIORITY_RULE).",
    requiredEvidence:
      "Documented regulatory engagement path with regulator role (NOT named regulator — per NO_HARD_CODED_WINNER_RULE), " +
      "briefing agenda, replay scenario list (per R2), and continuity evidence references (per S1).",
    status: "PENDING",
  },
  {
    areaId: "DESIGN_PARTNER_CRITERIA",
    name: "Design-Partner Criteria",
    description:
      "Per directive: 'design-partner criteria'. The criteria a candidate must meet to qualify as a design partner — " +
      "willingness to co-design the control-plane perimeter (per v25.3.6 J3), willingness to participate in evidence-fabric " +
      "validation (per v25.3.8 N2), willingness to execute the bank-contracting-package (per v25.3.18 W1 17 sections — " +
      "all start DRAFT per NO_CONTRACT_WITHOUT_EVIDENCE_RULE), willingness to support SettlementContinuityFabric drills " +
      "(per v25.3.13 S1), and willingness to publish reference evidence (per Q1 INSTITUTIONALLY_VERIFIED label).",
    requiredEvidence:
      "Documented design-partner criteria checklist with each criterion's evidence requirement. " +
      "Per Q1: at least ILLUSTRATIVE before this area may be completed.",
    status: "PENDING",
  },
  {
    areaId: "REQUIRED_EVIDENCE",
    name: "Required Evidence",
    description:
      "Per directive: 'required evidence'. The evidence a candidate must produce or permit MITHQAL to record at each " +
      "progression state — covers evidence-package fields (per v25.3.8 N2 15-field EvidencePackage + SHA-256 commitments), " +
      "contract execution evidence (per v25.3.18 W1 NO_CONTRACT_WITHOUT_EVIDENCE_RULE), pilot-gate evidence " +
      "(per v25.3.11 Q2 15 gates), and accounting/prudential evidence (per v25.3.16 U1).",
    requiredEvidence:
      "Documented evidence requirement per progression state (see PROGRESSION_TRANSITIONS below). " +
      "Per Q1: every evidence item must carry a status label (SIMULATED / ILLUSTRATIVE / VALIDATED / INSTITUTIONALLY_VERIFIED).",
    status: "PENDING",
  },
  {
    areaId: "PROGRESSION_STATES",
    name: "Progression States",
    description:
      "Per directive: 'progression states'. The 9-state progression: RESEARCHED → CONTACTED → QUALIFIED → " +
      "ARCHITECTURE_REVIEW → LEGAL_REVIEW → PILOT_CANDIDATE → CONTRACTED → PILOT → MEASURED. " +
      "Each transition is evidence-gated (per PROGRESSION_TRANSITIONS below) and fee-independent " +
      "(per v25.3.20 Y1 P35 FEE_INDEPENDENCE_RULE — fee payment status may NOT gate transition).",
    requiredEvidence:
      "Documented transition table (per PROGRESSION_TRANSITIONS) with required evidence per transition and fee-may-gate flag = false.",
    status: "PENDING",
  },
];

export const DEFINITION_AREA_COUNT = DEFINITION_AREAS.length; // 9

// ============================================================================
// THE 9-STATE PROGRESSION TRANSITIONS (8 transitions between 9 states)
// ============================================================================

export const PROGRESSION_TRANSITIONS: ProgressionTransition[] = [
  {
    fromState: "RESEARCHED",
    toState: "CONTACTED",
    requiredEvidence:
      "Initial briefing invitation accepted by candidate's named executive sponsor (or sponsor's delegate). " +
      "Recorded in evidence fabric (per N2) as a CONTACT_INITIATED evidence package.",
    feeMayGateTransition: false,
  },
  {
    fromState: "CONTACTED",
    toState: "QUALIFIED",
    requiredEvidence:
      "Candidate passes the 6-factor target-selection scoring threshold (per TARGET_SELECTION_FACTORS — " +
      "all 6 factors must carry at least ILLUSTRATIVE scores per Q1 evidence status labels; aggregate score threshold TBD by operator).",
    feeMayGateTransition: false,
  },
  {
    fromState: "QUALIFIED",
    toState: "ARCHITECTURE_REVIEW",
    requiredEvidence:
      "Architecture-review document produced (per v25.3.6 J3 control-plane boundary + v25.3.8 N1 F0-F7 finality model + " +
      "v25.3.9 O1 obligation registry + v25.3.9 O2 reconciliation policies). Recorded in evidence fabric (per N2).",
    feeMayGateTransition: false,
  },
  {
    fromState: "ARCHITECTURE_REVIEW",
    toState: "LEGAL_REVIEW",
    requiredEvidence:
      "Architecture-review signed off by candidate's head of technology + head of compliance. " +
      "Legal review engagement letter issued (per v25.3.16 U2 P26 PBC Legal Enforceability + v25.3.17 V1 PROMPT 27 " +
      "Failure/Default/Resolution Legal Conditionality — 6 forbidden assumptions each require 4-component replacement pattern).",
    feeMayGateTransition: false,
  },
  {
    fromState: "LEGAL_REVIEW",
    toState: "PILOT_CANDIDATE",
    requiredEvidence:
      "Legal review completed; bank-contracting-package (per v25.3.18 W1 — 17 sections ALL DRAFT) circulated to candidate. " +
      "Pilot scope agreed (per v25.3.10 P2 two pilot modes — PILOT_A_CONTROL_PLANE or PILOT_B_MTQ_SETTLEMENT). " +
      "Pilot gate schedule agreed (per v25.3.11 Q2 — 15 default gates).",
    feeMayGateTransition: false,
  },
  {
    fromState: "PILOT_CANDIDATE",
    toState: "CONTRACTED",
    requiredEvidence:
      "Bank-contracting-package executed (per v25.3.18 W1 NO_CONTRACT_WITHOUT_EVIDENCE_RULE — all 17 sections SIGNED, " +
      "ACTIVE, or VALIDATED only with executed evidence). Per v25.3.20 Y1 P35: fee schedule contracted BUT fee payment status " +
      "may NOT gate this transition (per FEE_INDEPENDENCE_RULE).",
    feeMayGateTransition: false,
  },
  {
    fromState: "CONTRACTED",
    toState: "PILOT",
    requiredEvidence:
      "Pilot kickoff — pilot gates begin execution (per v25.3.11 Q2 15 default gates). " +
      "SettlementContinuityFabric drill scheduled (per v25.3.13 S1). " +
      "Per v25.3.20 Y1 P35: fee invoiced BUT fee collection status may NOT gate this transition (per FEE_INDEPENDENCE_RULE).",
    feeMayGateTransition: false,
  },
  {
    fromState: "PILOT",
    toState: "MEASURED",
    requiredEvidence:
      "Pilot gates passed (per v25.3.11 Q2). Pilot success criteria met. " +
      "Evidence-package recorded in Institutional Evidence Fabric (per v25.3.8 N2) with evidence status INSTITUTIONALLY_VERIFIED " +
      "(per v25.3.11 Q1). Measurement report produced + signed by candidate + MITHQAL. " +
      "Per v25.3.20 Y1 P35: fee collected BUT fee collection status may NOT gate this transition (per FEE_INDEPENDENCE_RULE).",
    feeMayGateTransition: false,
  },
];

export const PROGRESSION_TRANSITION_COUNT = PROGRESSION_TRANSITIONS.length; // 8

// ============================================================================
// CANDIDATE TARGETS (HONEST STATE — EMPTY REGISTRY)
// ============================================================================
//
// Per NO_HARD_CODED_WINNER_RULE: no candidate targets are pre-populated.
// The candidate-registry is intentionally EMPTY at module load — every
// candidate target starts as RESEARCHED when added by an operator, with
// all 6 factor scores PENDING, aggregateScore PENDING, isHardCodedWinner=false.
//
// The framework provides a factory for creating new candidate targets in
// the honest default state (see createCandidateTarget below).

export const CANDIDATE_TARGET_REGISTRY: CandidateTarget[] = [];

export const CANDIDATE_TARGET_COUNT = CANDIDATE_TARGET_REGISTRY.length; // 0

// ============================================================================
// RUNTIME INVARIANTS (verified at module load — fail-fast if any directive
// is violated). These guard against accidental edits that would hard-code
// a winner or pre-populate scores.
// ============================================================================

function assertProgressionStates(): void {
  if (PROGRESSION_STATES.length !== 9) {
    throw new Error(
      `[institutional-gtm-framework] Progression state count = ${PROGRESSION_STATES.length}; expected 9 per directive.`,
    );
  }
  const expectedStates: GTMProgressionState[] = [
    "RESEARCHED",
    "CONTACTED",
    "QUALIFIED",
    "ARCHITECTURE_REVIEW",
    "LEGAL_REVIEW",
    "PILOT_CANDIDATE",
    "CONTRACTED",
    "PILOT",
    "MEASURED",
  ];
  for (let i = 0; i < expectedStates.length; i++) {
    if (PROGRESSION_STATES[i] !== expectedStates[i]) {
      throw new Error(
        `[institutional-gtm-framework] Progression state at index ${i} is ${PROGRESSION_STATES[i]}; expected ${expectedStates[i]}.`,
      );
    }
  }
}

function assertTargetSelectionFactors(): void {
  if (TARGET_SELECTION_FACTORS.length !== 6) {
    throw new Error(
      `[institutional-gtm-framework] Target selection factor count = ${TARGET_SELECTION_FACTORS.length}; expected 6 per directive.`,
    );
  }
  const expectedIds: TargetSelectionFactorId[] = [
    "CORRIDOR_PAIN_INDEX",
    "REGULATORY_FEASIBILITY",
    "TECHNICAL_FEASIBILITY",
    "EXECUTIVE_SPONSORSHIP",
    "INTEGRATION_CAPACITY",
    "EVIDENCE_REFERENCE_VALUE",
  ];
  for (let i = 0; i < expectedIds.length; i++) {
    if (TARGET_SELECTION_FACTORS[i].factorId !== expectedIds[i]) {
      throw new Error(
        `[institutional-gtm-framework] Target selection factor at index ${i} is ${TARGET_SELECTION_FACTORS[i].factorId}; expected ${expectedIds[i]}.`,
      );
    }
  }
  // All scores must be PENDING (per honest state — no live research)
  for (const f of TARGET_SELECTION_FACTORS) {
    if (f.score !== "PENDING") {
      throw new Error(
        `[institutional-gtm-framework] NO_HARD_CODED_WINNER_RULE violation at factor ${f.factorId}: score === '${f.score}' (expected 'PENDING'). ` +
          `Per PROMPT 36: 'Do not hard-code a specific bank, regulator or corridor as the winner.'`,
      );
    }
  }
  // Weights must sum to 1.00 (per v25.3.10 P1 corridor-pain-index pattern)
  const weightSum = TARGET_SELECTION_FACTORS.reduce((acc, f) => acc + f.weight, 0);
  if (Math.abs(weightSum - 1.0) > 0.0001) {
    throw new Error(
      `[institutional-gtm-framework] Target selection factor weights sum to ${weightSum}; expected 1.00.`,
    );
  }
}

function assertDefinitionAreas(): void {
  if (DEFINITION_AREAS.length !== 9) {
    throw new Error(
      `[institutional-gtm-framework] Definition area count = ${DEFINITION_AREAS.length}; expected 9 per directive.`,
    );
  }
  for (const area of DEFINITION_AREAS) {
    if (area.status !== "PENDING") {
      throw new Error(
        `[institutional-gtm-framework] Definition area ${area.areaId} has status '${area.status}'; expected 'PENDING' (honest state).`,
      );
    }
  }
}

function assertProgressionTransitions(): void {
  if (PROGRESSION_TRANSITIONS.length !== 8) {
    throw new Error(
      `[institutional-gtm-framework] Progression transition count = ${PROGRESSION_TRANSITIONS.length}; expected 8 transitions between 9 states.`,
    );
  }
  for (const t of PROGRESSION_TRANSITIONS) {
    if (t.feeMayGateTransition !== false) {
      throw new Error(
        `[institutional-gtm-framework] FEE_INDEPENDENCE_RULE violation at transition ${t.fromState}→${t.toState}: ` +
          `feeMayGateTransition !== false. Per v25.3.20 Y1 P35: fee payment status may NOT gate GTM state progression.`,
      );
    }
  }
}

function assertCandidateRegistry(): void {
  if (CANDIDATE_TARGET_REGISTRY.length !== 0) {
    throw new Error(
      `[institutional-gtm-framework] NO_HARD_CODED_WINNER_RULE violation: candidate registry is non-empty at module load. ` +
        `Per PROMPT 36: 'Do not hard-code a specific bank, regulator or corridor as the winner.'`,
    );
  }
}

// Validate on module load (fail-fast at runtime + import time)
assertProgressionStates();
assertTargetSelectionFactors();
assertDefinitionAreas();
assertProgressionTransitions();
assertCandidateRegistry();

// ============================================================================
// HELPERS
// ============================================================================

export function getProgressionState(
  state: GTMProgressionState,
): GTMProgressionState | undefined {
  return PROGRESSION_STATES.find((s) => s === state);
}

export function getTargetSelectionFactor(
  id: TargetSelectionFactorId,
): ScoredFactor | undefined {
  return TARGET_SELECTION_FACTORS.find((f) => f.factorId === id);
}

export function getDefinitionArea(
  id: DefinitionAreaId,
): DefinitionArea | undefined {
  return DEFINITION_AREAS.find((a) => a.areaId === id);
}

// Factory: create a new candidate target in the honest default state.
// Per NO_HARD_CODED_WINNER_RULE: bank/regulator/corridor all PENDING,
// all factor scores PENDING, aggregateScore PENDING, currentState RESEARCHED,
// isHardCodedWinner false.
export function createCandidateTarget(
  targetId: string,
  accountProfileSummary: string,
): CandidateTarget {
  return {
    targetId,
    bankEntityName: "PENDING",
    regulatorName: "PENDING",
    corridorId: "PENDING",
    accountProfileSummary,
    scoredFactors: TARGET_SELECTION_FACTORS.map((f) => ({
      ...f,
    })),
    aggregateScore: "PENDING",
    currentState: "RESEARCHED",
    isHardCodedWinner: false,
  };
}

// ============================================================================
// STATUS EXPORTS
// ============================================================================

export const GTM_FRAMEWORK_STATUS = "ACTIVE";
export const GTM_FRAMEWORK_VERSION = "v25.3.20-Y1-1.0";
export const GTM_FRAMEWORK_SOURCE =
  "src/lib/institutional-gtm-framework.ts";
export const GTM_PROGRESSION_STATE_COUNT = PROGRESSION_STATES.length; // 9
export const GTM_TARGET_SELECTION_FACTOR_COUNT = TARGET_SELECTION_FACTORS.length; // 6
export const GTM_DEFINITION_AREA_COUNT = DEFINITION_AREAS.length; // 9

// Honest-state summary — verified at runtime (not magic numbers)
export const GTM_FRAMEWORK_HONEST_STATE = {
  progressionStateCount: GTM_PROGRESSION_STATE_COUNT, // 9
  targetSelectionFactorCount: GTM_TARGET_SELECTION_FACTOR_COUNT, // 6
  definitionAreaCount: GTM_DEFINITION_AREA_COUNT, // 9
  candidateTargetCount: CANDIDATE_TARGET_COUNT, // 0
  allFactorScoresPending: TARGET_SELECTION_FACTORS.every(
    (f) => f.score === "PENDING",
  ),
  allDefinitionAreasPending: DEFINITION_AREAS.every(
    (a) => a.status === "PENDING",
  ),
  allTransitionsFeeIndependent: PROGRESSION_TRANSITIONS.every(
    (t) => t.feeMayGateTransition === false,
  ),
  hardCodedWinnerCount: CANDIDATE_TARGET_REGISTRY.filter(
    (c) => c.isHardCodedWinner === true,
  ).length, // 0
  contactedCount: CANDIDATE_TARGET_REGISTRY.filter(
    (c) => c.currentState !== "RESEARCHED",
  ).length, // 0
  noHardCodedWinnerRuleEnforced: true,
  honestStatement:
    "0 candidate targets in registry. 0 hard-coded winners. 0 candidates contacted. " +
    "All 6 target-selection factor scores = PENDING. All 9 definition areas = PENDING. " +
    "All 8 progression transitions fee-independent. No bank has been contacted under this GTM framework.",
} as const;

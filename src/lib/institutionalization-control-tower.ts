/**
 * Institutionalization Control Tower — Canonical Data Layer
 *
 * The single source of truth for "What prevents MITHQAL from being
 * institutionally deployable today?"
 *
 * HONEST-STATE DISCIPLINE (non-negotiable):
 *   - Every status is DERIVED from the actual canonical module data.
 *   - No status is INVENTED or OPTIMISTIC.
 *   - Internal software completeness is NEVER treated as institutional readiness.
 *   - "Code exists + tests pass" ≠ "institutionally deployable".
 *   - Every status carries: status + evidence + timestamp + owner + next action.
 *
 * NO VANITY METRICS:
 *   - We do NOT show "X% complete" for institutional readiness (it's meaningless).
 *   - We show BINARY states: DEPLOYABLE / NOT_DEPLOYABLE + the specific blockers.
 *   - We do NOT aggregate incompatible dimensions into a single score.
 *
 * The Founder/COO view has 15 items. Each item has 5 fields:
 *   status, evidence, timestamp, owner, nextAction
 *
 * 10 drill-down domains provide detailed blocker breakdowns.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ControlTowerStatus {
  /** The honest status value (e.g., "PENDING_EXTERNAL_VALIDATION"). */
  status: string;
  /** Concrete evidence supporting this status (file reference, module, data point). */
  evidence: string;
  /** ISO 8601 timestamp of when this status was last verified. */
  timestamp: string;
  /** Who owns resolving this (COO, CTO, external counsel, regulator, etc.). */
  owner: string;
  /** The specific next action to advance this (or "EXTERNAL_DECISION_REQUIRED"). */
  nextAction: string;
}

export interface ControlTowerItem extends ControlTowerStatus {
  /** The item ID (1-15). */
  id: number;
  /** Display label. */
  label: string;
}

export interface DrillDownDomain extends ControlTowerStatus {
  /** Domain ID (LEGAL, REGULATORY, etc.). */
  domain: string;
  /** Display label. */
  label: string;
  /** Detailed blockers (the specific items that prevent deployment). */
  blockers: string[];
  /** Evidence references (canonical module + field). */
  evidenceRefs: string[];
}

export interface ControlTowerData {
  /** The primary question: "What prevents deployment today?" */
  primaryQuestion: string;
  /** The honest answer (list of P0 blockers). */
  deploymentBlockers: string[];
  /** 15 items for the Founder/COO view. */
  founderView: ControlTowerItem[];
  /** 10 drill-down domains. */
  drillDowns: DrillDownDomain[];
  /** Release info. */
  release: { version: string; commit: string; date: string; status: string };
  /** Honest-state certification. */
  honestState: {
    productionAuthorized: boolean;
    legalClassificationsPending: boolean;
    contractsDraft: boolean;
    fundingDesignTime: boolean;
    fteFilled: number;
    pilotGatesPassed: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Derived Data — from canonical modules                             */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T06:51:00Z";

/**
 * 1. CURRENT RELEASE
 * Source: RELEASE_MANIFEST_V25_3_2
 */
const currentRelease: ControlTowerStatus = {
  status: "v25.3.2 — Controlled Baseline (FROZEN)",
  evidence: "RELEASE_MANIFEST_V25_3_2 — tag v25.3.2 on origin, commit b62da5a, 10 frozen schemas",
  timestamp: NOW,
  owner: "COO + CTO",
  nextAction: "No version increment without approved 7-step Change Request",
};

/**
 * 2. CURRENT INSTITUTIONAL PHASE
 * Source: honest-state discipline (§74)
 */
const currentPhase: ControlTowerStatus = {
  status: "APPROVED_CANDIDATE_FOR_CONTROLLED_TESTING — NOT PRODUCTION-AUTHORIZED",
  evidence: "Honest-state rule preserved across all 22 releases (v25.3.2 → v25.3.22). No institutional validation has occurred.",
  timestamp: NOW,
  owner: "COO",
  nextAction: "External institutional validation required before any phase change",
};

/**
 * 3. P0 BLOCKERS (what prevents deployment today)
 * Source: aggregation of all canonical modules
 */
const p0Blockers: ControlTowerStatus = {
  status: "9 P0 BLOCKERS — none resolvable by code alone",
  evidence: [
    "1. No executed legal framework (all contracts DRAFT, 0 SIGNED)",
    "2. No regulatory approval (all 8 jurisdictions SEED_DATA/UNKNOWN)",
    "3. No bank engaged (0 banks contracted, 17 contract sections ALL DRAFT)",
    "4. No qualified custodian (custody framework is DESIGN-TIME)",
    "5. No external validation of ANY legal/accounting/prudential classification",
    "6. $0 starting cash ($4.7M is DESIGN-TIME, not funded)",
    "7. 0 FTE filled (40.75 FTE required)",
    "8. 0/15 pilot gates passed (no gate passes on code/tests alone)",
    "9. MTQ legal classification PENDING_VALIDATION (no external legal opinion)",
  ].join("; "),
  timestamp: NOW,
  owner: "COO + CTO + external counsel",
  nextAction: "Each P0 requires an EXTERNAL decision (legal counsel, regulator, bank, custodian, or funder)",
};

/**
 * 4. CURRENT GATE STATUS
 * Source: pilot-gate-framework.ts
 */
const gateStatus: ControlTowerStatus = {
  status: "0/15 gates PASSED (all PENDING or BLOCKED)",
  evidence: "pilot-gate-framework.ts: canPassWithImplementationOnly() = false. Pilot A: 8 areas PENDING. Pilot B: BLOCKED (6 legal/accounting prerequisites unmet). No gate can pass on code/tests alone.",
  timestamp: NOW,
  owner: "COO",
  nextAction: "Each gate requires evidence-based institutional validation (not implementation)",
};

/**
 * 5. LEGAL STATUS
 * Source: pbc-legal-enforceability.ts, failure-resolution-legal-conditionality.ts
 */
const legalStatus: ControlTowerStatus = {
  status: "PENDING_EXTERNAL_VALIDATION — no legal opinion obtained",
  evidence: "pbc-legal-enforceability.ts: 14 fields, 6 failure states. PBC counts as AvailableBacking ONLY when ALL 14 evidence predicates exist (0 exist). failure-resolution-legal-conditionality.ts: 6 forbidden assumptions NOT conditionalized (BLOCKING_REMEDIATION).",
  timestamp: NOW,
  owner: "COO + external legal counsel",
  nextAction: "Engage external legal counsel for PBC enforceability opinion + failure-resolution conditionality",
};

/**
 * 6. REGULATORY STATUS
 * Source: jurisdiction-truth-model.ts
 */
const regulatoryStatus: ControlTowerStatus = {
  status: "ALL jurisdictions SEED_DATA or UNKNOWN (UNKNOWN = CONSERVATIVE_BLOCK)",
  evidence: "jurisdiction-truth-model.ts: 8 seeded jurisdictions, ALL start as SEED_DATA or UNKNOWN. CNY/CNH not classified. No jurisdiction has PUBLIC_MATERIAL_TRIAGE or RESTRICTED status. UNKNOWN = NOT ALLOWED per PROMPT 41.",
  timestamp: NOW,
  owner: "COO + regulatory counsel",
  nextAction: "Triage public regulatory material for each jurisdiction (8 jurisdictions require evidence packages)",
};

/**
 * 7. BANK ENGAGEMENT STATUS
 * Source: bank-contracting-package.ts
 */
const bankEngagement: ControlTowerStatus = {
  status: "0 banks engaged (17 contract sections ALL DRAFT, 0 SIGNED)",
  evidence: "bank-contracting-package.ts: 17 sections, ALL status=DRAFT. No contract may become SIGNED without actual executed evidence. bank-economic-incentive-model.ts: 12 factors, founding-bank status PENDING.",
  timestamp: NOW,
  owner: "COO",
  nextAction: "Identify + engage founding bank (requires completed legal framework first)",
};

/**
 * 8. CUSTODY/BACKING STATUS
 * Source: reserve-domains.ts, reserve-coverage-logic.ts
 */
const custodyBacking: ControlTowerStatus = {
  status: "NO QUALIFIED CUSTODIAN — gold in Strategic Resilience (NOT settlement backing)",
  evidence: "reserve-domains.ts: 2 domains. Gold moved to STRATEGIC_RESILIENCE_RESERVE (countsTowardSettlementBacking=false). SETTLEMENT_LIQUIDITY domain has no qualified custodian. reserve-coverage-logic.ts: coverageRatio computed but backed by NO physical custody evidence.",
  timestamp: NOW,
  owner: "COO + custody counsel",
  nextAction: "Engage qualified custodian (requires legal framework + regulatory clarity first)",
};

/**
 * 9. TECHNICAL ASSURANCE STATUS
 * Source: technical-evidence-classification.ts
 */
const technicalAssurance: ControlTowerStatus = {
  status: "HTTP 200 ≠ production readiness — 42 forbidden equivalences enforced",
  evidence: "technical-evidence-classification.ts: 10 evidence classes. HTTP 200 / page render / API response / unit test pass / integration test pass = FORBIDDEN as proof of production readiness. 213 API routes respond, but this is NOT institutional readiness.",
  timestamp: NOW,
  owner: "CTO",
  nextAction: "Technical assurance is DESIGN-TIME. No action advances institutional readiness without external validation.",
};

/**
 * 10. COMMERCIAL STATUS
 * Source: institutional-pricing-architecture.ts, institutional-gtm-framework.ts
 */
const commercialStatus: ControlTowerStatus = {
  status: "0 commercial pricing set (49 prices ALL PENDING) — no bank contacted",
  evidence: "institutional-pricing-architecture.ts: 7 fee types × 7 stages = 49 records, ALL PENDING. FEE_INDEPENDENCE_RULE enforced (fees cannot influence controls). institutional-gtm-framework.ts: 9 GTM states, ALL targets RESEARCHED, no bank contacted.",
  timestamp: NOW,
  owner: "COO",
  nextAction: "Commercial pricing requires bank engagement (which requires legal framework first)",
};

/**
 * 11. EVIDENCE COMPLETENESS
 * Source: institutional-evidence-fabric.ts
 */
const evidenceCompleteness: ControlTowerStatus = {
  status: "SIMULATED / ILLUSTRATIVE — 0 INSTITUTIONALLY_VERIFIED evidence packages",
  evidence: "institutional-evidence-fabric.ts: 15-field portable evidence package. 3 access levels (PUBLIC/INSTITUTIONAL/AUDIT). SHA-256 commitments. BUT: 0 evidence packages have INSTITUTIONALLY_VERIFIED status. All current evidence is SIMULATED or ILLUSTRATIVE.",
  timestamp: NOW,
  owner: "CTO + external auditor",
  nextAction: "Independent institutional audit required to elevate evidence from SIMULATED → INSTITUTIONALLY_VERIFIED",
};

/**
 * 12. CASH/BUDGET STATUS
 * Source: institutionalization-operating-plan.ts
 */
const cashBudget: ControlTowerStatus = {
  status: "$0 starting cash — $4.7M is DESIGN-TIME (not funded) — 0 FTE filled",
  evidence: "institutionalization-operating-plan.ts: DESIGN_TIME_FUNDING_RULE enforces $4.7M = DESIGN-TIME. startingCash = $0. 40.75 FTE required across 11 roles, 0 filled. SPEND_JUSTIFICATION_RULE: every spend must link to gate/risk/evidence.",
  timestamp: NOW,
  owner: "COO + funder",
  nextAction: "Secure institutional funding (requires legal framework + regulatory clarity to justify investment)",
};

/**
 * 13. NEXT CRITICAL ACTION
 */
const nextCriticalAction: ControlTowerStatus = {
  status: "Engage external legal counsel for PBC enforceability opinion",
  evidence: "The P0 blocker chain: legal framework → regulatory clarity → bank engagement → custody → commercial → operations. The FIRST link (legal) must be resolved before any subsequent link can advance. No code change advances this.",
  timestamp: NOW,
  owner: "COO",
  nextAction: "Select + retain external legal counsel (international banking + digital asset specialization)",
};

/**
 * 14. BLOCKED ACTIONS
 */
const blockedActions: ControlTowerStatus = {
  status: "6 actions BLOCKED by pending external decisions",
  evidence: [
    "BLOCKED: Bank engagement (requires legal framework)",
    "BLOCKED: Custodian selection (requires regulatory clarity)",
    "BLOCKED: Commercial pricing (requires bank engagement)",
    "BLOCKED: Insurance procurement (requires legal entity + custody)",
    "BLOCKED: Pilot A activation (requires evidence-based gate passage)",
    "BLOCKED: Pilot B activation (requires 6 legal/accounting prerequisites)",
  ].join("; "),
  timestamp: NOW,
  owner: "COO",
  nextAction: "Unblock the first action (legal framework) — all others chain from it",
};

/**
 * 15. REQUIRED EXTERNAL DECISION
 */
const requiredExternalDecision: ControlTowerStatus = {
  status: "5 external decisions required — NONE can be made internally",
  evidence: [
    "1. LEGAL COUNSEL: PBC enforceability opinion (external law firm)",
    "2. REGULATOR: jurisdiction-by-jisdiction authorization (8 jurisdictions)",
    "3. BANK: founding bank commitment (institutional counterparty)",
    "4. CUSTODIAN: qualified custody arrangement (regulated custodian)",
    "5. FUNDER: institutional capital commitment ($4.7M+ DESIGN-TIME → funded)",
  ].join("; "),
  timestamp: NOW,
  owner: "COO (facilitates) — external authorities (decide)",
  nextAction: "The COO cannot make any of these decisions. The Founder must authorize engagement with each external authority.",
};

/* ------------------------------------------------------------------ */
/*  15-Item Founder/COO View                                          */
/* ------------------------------------------------------------------ */

export const FOUNDER_VIEW: ControlTowerItem[] = [
  { id: 1, label: "Current Release", ...currentRelease },
  { id: 2, label: "Current Institutional Phase", ...currentPhase },
  { id: 3, label: "P0 Blockers", ...p0Blockers },
  { id: 4, label: "Current Gate Status", ...gateStatus },
  { id: 5, label: "Legal Status", ...legalStatus },
  { id: 6, label: "Regulatory Status", ...regulatoryStatus },
  { id: 7, label: "Bank Engagement Status", ...bankEngagement },
  { id: 8, label: "Custody/Backing Status", ...custodyBacking },
  { id: 9, label: "Technical Assurance Status", ...technicalAssurance },
  { id: 10, label: "Commercial Status", ...commercialStatus },
  { id: 11, label: "Evidence Completeness", ...evidenceCompleteness },
  { id: 12, label: "Cash/Budget Status", ...cashBudget },
  { id: 13, label: "Next Critical Action", ...nextCriticalAction },
  { id: 14, label: "Blocked Actions", ...blockedActions },
  { id: 15, label: "Required External Decision", ...requiredExternalDecision },
];

/* ------------------------------------------------------------------ */
/*  10 Drill-Down Domains                                              */
/* ------------------------------------------------------------------ */

export const DRILL_DOWNS: DrillDownDomain[] = [
  {
    domain: "LEGAL",
    label: "Legal",
    status: "PENDING_EXTERNAL_VALIDATION",
    evidence: "pbc-legal-enforceability.ts (14 fields, 6 failure states, 0 evidence predicates met) + failure-resolution-legal-conditionality.ts (6 forbidden assumptions, BLOCKING_REMEDIATION) + bank-contracting-package.ts (17 sections ALL DRAFT) + institutional-external-identity.ts (3 PENDING_ENTITY_IDENTITY)",
    timestamp: NOW,
    owner: "COO + external legal counsel",
    nextAction: "Engage external legal counsel for PBC enforceability + failure-resolution conditionality + contract execution",
    blockers: [
      "No external legal opinion on PBC enforceability",
      "6 forbidden assumptions not conditionalized (BLOCKING_REMEDIATION)",
      "0/17 contract sections SIGNED (all DRAFT)",
      "3 institutional identity items PENDING (email, domain, website)",
      "MTQ legal classification PENDING_VALIDATION",
      "Sharia/AAOIFI compliance PENDING_EXTERNAL_VALIDATION",
    ],
    evidenceRefs: [
      "pbc-legal-enforceability.ts:14 fields",
      "failure-resolution-legal-conditionality.ts:6 assumptions",
      "bank-contracting-package.ts:17 sections",
      "institutional-external-identity.ts:8 standards",
      "sharia-aaoifi-governance.ts:PENDING",
    ],
  },
  {
    domain: "REGULATORY",
    label: "Regulatory",
    status: "ALL jurisdictions SEED_DATA or UNKNOWN",
    evidence: "jurisdiction-truth-model.ts: 8 jurisdictions, ALL SEED_DATA or UNKNOWN. CNY/CNH unclassified. UNKNOWN = CONSERVATIVE_BLOCK (NOT ALLOWED). No jurisdiction has triaged public regulatory material.",
    timestamp: NOW,
    owner: "COO + regulatory counsel",
    nextAction: "Triage public regulatory material for each of 8 jurisdictions",
    blockers: [
      "0/8 jurisdictions have triaged regulatory material",
      "CNY/CNH classification UNKNOWN",
      "No regulator engagement in any jurisdiction",
      "No sandbox/admission application filed",
      "UNKNOWN jurisdictions = CONSERVATIVE_BLOCK (cannot operate)",
    ],
    evidenceRefs: ["jurisdiction-truth-model.ts:8 states", "mtq-economic-definition.ts:permissioned"],
  },
  {
    domain: "BANK",
    label: "Bank Engagement",
    status: "0 banks engaged — 17 contract sections ALL DRAFT",
    evidence: "bank-contracting-package.ts: 17 sections ALL DRAFT. bank-economic-incentive-model.ts: 12 factors, founding-bank PENDING. bank-onboarding-training-framework.ts: 11 modules DRAFT. bank-value-model.ts: sample $157.1M ILLUSTRATIVE.",
    timestamp: NOW,
    owner: "COO",
    nextAction: "Identify + engage founding bank (requires legal framework first)",
    blockers: [
      "0 banks contracted (17 sections ALL DRAFT)",
      "0 banks onboarded (11 training modules DRAFT)",
      "Founding-bank status PENDING",
      "Bank value model $157.1M = ILLUSTRATIVE (not validated)",
      "No bank has been contacted (GTM ALL RESEARCHED)",
    ],
    evidenceRefs: ["bank-contracting-package.ts:17", "bank-economic-incentive-model.ts:12", "bank-onboarding-training-framework.ts:11"],
  },
  {
    domain: "TECHNICAL",
    label: "Technical Assurance",
    status: "HTTP 200 ≠ production readiness — 42 forbidden equivalences",
    evidence: "technical-evidence-classification.ts: 10 evidence classes. 213 API routes respond. 17 adversarial tests PASS locally (0 on Vercel serverless). Dynamic Groq model discovery implemented. BUT: none of this constitutes institutional readiness.",
    timestamp: NOW,
    owner: "CTO",
    nextAction: "Technical assurance is DESIGN-TIME. No technical action advances institutional readiness.",
    blockers: [
      "HTTP 200 / page render / API response = FORBIDDEN as proof of production readiness",
      "Unit test pass / integration test pass = FORBIDDEN as proof",
      "17 adversarial tests: 17/17 local, 0/17 Vercel serverless (limitation)",
      "Brain consensus: 2/6 models respond (groq+openrouter) — not institutional validation",
      "No external technical audit performed",
    ],
    evidenceRefs: ["technical-evidence-classification.ts:10 classes", "mithqal-brain.ts:6 providers"],
  },
  {
    domain: "SECURITY",
    label: "Security & Risk",
    status: "17 risks ALL OPEN (qualitative only) — 7 insurance categories ALL DESIGNED",
    evidence: "enterprise-risk-register.ts: 17 risks, 14 fields each, ALL OPEN, qualitative only. insurance-risk-transfer-framework.ts: 7 categories, ALL DESIGNED (0 QUOTED/BOUND/ACTIVE). NO_SUBSTITUTE_RULE enforced.",
    timestamp: NOW,
    owner: "CTO + risk officer",
    nextAction: "Quantify risks + procure insurance (requires legal entity + custody first)",
    blockers: [
      "17/17 risks OPEN (0 mitigated, 0 closed)",
      "7/7 insurance categories DESIGNED (0 QUOTED, 0 BOUND, 0 ACTIVE)",
      "No external security audit performed",
      "No penetration test by external firm",
      "Insurance ≠ substitute for controls (NO_SUBSTITUTE_RULE)",
    ],
    evidenceRefs: ["enterprise-risk-register.ts:17 risks", "insurance-risk-transfer-framework.ts:7 categories"],
  },
  {
    domain: "ACCOUNTING",
    label: "Accounting / Prudential / Tax",
    status: "ALL 10 areas PENDING_EXTERNAL_VALIDATION",
    evidence: "accounting-prudential-tax-framework.ts: 10 classification areas, ALL PENDING_EXTERNAL_VALIDATION. 5-stage decision matrix (DESIGN_HYPOTHESIS → COUNSEL → ACCOUNTING → PRUDENTIAL → EXTERNAL). 0 areas have reached EXTERNAL stage.",
    timestamp: NOW,
    owner: "COO + external accounting firm",
    nextAction: "Engage external accounting firm for 10-area classification",
    blockers: [
      "10/10 accounting areas PENDING_EXTERNAL_VALIDATION",
      "0 areas have external accounting opinion",
      "0 prudential classifications validated",
      "0 tax opinions obtained",
      "DESIGN_HYPOTHESIS → EXTERNAL pipeline: 0 areas past DESIGN_HYPOTHESIS",
    ],
    evidenceRefs: ["accounting-prudential-tax-framework.ts:10 areas", "DECISION_MATRIX:5 stages"],
  },
  {
    domain: "LIQUIDITY",
    label: "Liquidity / Custody / Backing",
    status: "NO qualified custodian — gold NOT settlement backing",
    evidence: "reserve-domains.ts: 2 domains. Gold in STRATEGIC_RESILIENCE (countsTowardSettlementBacking=false). SETTLEMENT_LIQUIDITY has no qualified custodian. Emergency capacity: settlementBackingImpact=0 (anti-double-counting). reserve-coverage-logic.ts: coverageRatio computed but unbacked.",
    timestamp: NOW,
    owner: "COO + custody counsel",
    nextAction: "Engage qualified custodian (requires legal + regulatory first)",
    blockers: [
      "No qualified custodian engaged",
      "Gold in Strategic Resilience (NOT settlement backing)",
      "coverageRatio = computed but backed by NO physical custody evidence",
      "Emergency capacity NOT double-counted (settlementBackingImpact=0) — but capacity = 0",
      "No attestation of physical gold reserves",
    ],
    evidenceRefs: ["reserve-domains.ts:2 domains", "reserve-coverage-logic.ts:9 factors"],
  },
  {
    domain: "COMMERCIAL",
    label: "Commercial / Pricing / GTM",
    status: "0 commercial pricing set — 49 prices ALL PENDING — 0 banks contacted",
    evidence: "institutional-pricing-architecture.ts: 7×7=49 prices ALL PENDING. FEE_INDEPENDENCE_RULE enforced. institutional-gtm-framework.ts: 9 states, ALL RESEARCHED. competitive-compatibility-framework.ts: 7 competitors, ALL dependency=false.",
    timestamp: NOW,
    owner: "COO",
    nextAction: "Commercial pricing requires bank engagement (which requires legal framework first)",
    blockers: [
      "49/49 commercial prices PENDING (0 set)",
      "0 banks contacted (GTM ALL RESEARCHED)",
      "No bank has been engaged for pricing discussion",
      "Fee structure is DESIGN-TIME only",
      "No competitive moat claimed (NO_SUPERIORITY_RULE)",
    ],
    evidenceRefs: ["institutional-pricing-architecture.ts:49", "institutional-gtm-framework.ts:9 states"],
  },
  {
    domain: "OPERATIONS",
    label: "Operations / Team / Funding",
    status: "$0 cash — $4.7M DESIGN-TIME — 0 FTE filled",
    evidence: "institutionalization-operating-plan.ts: 11 roles, 40.75 FTE required, 0 filled. $4.7M = DESIGN_TIME (not funded). startingCash = $0. SPEND_JUSTIFICATION_RULE enforced. bank-onboarding-training-framework.ts: 11 modules DRAFT.",
    timestamp: NOW,
    owner: "COO + funder",
    nextAction: "Secure institutional funding (requires legal + regulatory clarity)",
    blockers: [
      "$0 starting cash ($4.7M is DESIGN-TIME, not funded)",
      "0/40.75 FTE filled (11 role categories empty)",
      "0/11 onboarding training modules finalized (all DRAFT)",
      "No operational team exists",
      "No operational policies approved by external authority",
    ],
    evidenceRefs: ["institutionalization-operating-plan.ts:11 roles", "DESIGN_TIME_FUNDING_RULE"],
  },
  {
    domain: "EVIDENCE",
    label: "Evidence Completeness",
    status: "SIMULATED / ILLUSTRATIVE — 0 INSTITUTIONALLY_VERIFIED",
    evidence: "institutional-evidence-fabric.ts: 15-field package, 3 access levels, SHA-256 commitments. BUT: 0 packages have INSTITUTIONALLY_VERIFIED status. All current evidence is SIMULATED or ILLUSTRATIVE. 6 BLOCKING_REMEDIATION items from contradiction sweep.",
    timestamp: NOW,
    owner: "CTO + external auditor",
    nextAction: "Independent institutional audit to elevate evidence from SIMULATED → INSTITUTIONALLY_VERIFIED",
    blockers: [
      "0 evidence packages INSTITUTIONALLY_VERIFIED",
      "All evidence is SIMULATED or ILLUSTRATIVE",
      "6 BLOCKING_REMEDIATION items unresolved (contradiction sweep)",
      "No independent audit performed",
      "No regulatory evidence submitted to any authority",
    ],
    evidenceRefs: ["institutional-evidence-fabric.ts:15 fields", "contradiction-sweep-report.ts:6 BLOCKING"],
  },
];

/* ------------------------------------------------------------------ */
/*  Primary Question + Deployment Blockers                            */
/* ------------------------------------------------------------------ */

export const PRIMARY_QUESTION = "What prevents MITHQAL from being institutionally deployable today?";

export const DEPLOYMENT_BLOCKERS = [
  "No executed legal framework — all contracts DRAFT, 0 SIGNED",
  "No regulatory approval — all 8 jurisdictions SEED_DATA/UNKNOWN",
  "No bank engaged — 0 banks contracted",
  "No qualified custodian — custody framework is DESIGN-TIME",
  "No external validation — 0 legal/accounting/prudential classifications externally validated",
  "No funding — $0 cash, $4.7M is DESIGN-TIME",
  "No team — 0 FTE filled (40.75 required)",
  "No pilot — 0/15 gates passed (no gate passes on code alone)",
  "No MTQ validation — legal classification PENDING_VALIDATION",
];

/* ------------------------------------------------------------------ */
/*  Full Control Tower Data                                           */
/* ------------------------------------------------------------------ */

export const CONTROL_TOWER_DATA: ControlTowerData = {
  primaryQuestion: PRIMARY_QUESTION,
  deploymentBlockers: DEPLOYMENT_BLOCKERS,
  founderView: FOUNDER_VIEW,
  drillDowns: DRILL_DOWNS,
  release: {
    version: "v25.3.2",
    commit: "b62da5a0f0bf",
    date: "2026-10-01T06:51:00Z",
    status: "APPROVED_CANDIDATE_FOR_CONTROLLED_TESTING — NOT PRODUCTION-AUTHORIZED",
  },
  honestState: {
    productionAuthorized: false,
    legalClassificationsPending: true,
    contractsDraft: true,
    fundingDesignTime: true,
    fteFilled: 0,
    pilotGatesPassed: 0,
  },
};

/**
 * HONEST-STATE CERTIFICATION:
 *   - productionAuthorized = false (NOT PRODUCTION-AUTHORIZED)
 *   - legalClassificationsPending = true (ALL PENDING_EXTERNAL_VALIDATION)
 *   - contractsDraft = true (0 SIGNED)
 *   - fundingDesignTime = true ($4.7M = DESIGN-TIME, $0 cash)
 *   - fteFilled = 0 (40.75 required)
 *   - pilotGatesPassed = 0 (15 required)
 *
 * NO VANITY METRICS:
 *   - No "X% complete" (meaningless for institutional readiness)
 *   - No aggregation of incompatible dimensions
 *   - Binary state: NOT_DEPLOYABLE + specific blockers
 *
 * INTERNAL SOFTWARE COMPLETENESS ≠ INSTITUTIONAL READINESS:
 *   - 213 API routes respond → NOT institutional readiness
 *   - 17/17 tests pass locally → NOT institutional readiness
 *   - Brain consensus HIGH → NOT institutional readiness
 *   - HTTP 200 → NOT institutional readiness (P42 forbidden equivalence)
 *
 * NOT PRODUCTION-AUTHORIZED.
 */

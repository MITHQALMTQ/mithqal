/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — G1 PILOT-JURISDICTION LEGAL PACK (v25.3.2 FROZEN)
 * ════════════════════════════════════════════════════════════════════════
 *
 * GATE G1: PILOT-JURISDICTION LEGAL ANALYSIS
 *
 * G0 STATUS: G0_FAIL (entity not legally established — but the G1 legal
 * pack can be PREPARED while G0 is being resolved. G1 cannot PASS until
 * G0 PASSES. This pack prepares the legal questions for counsel.)
 *
 * OBJECTIVE:
 *   Evaluate candidate jurisdictions against 13 factors.
 *   Select ONE candidate for first legal review.
 *   Selection is a PROJECT DECISION, not a legal conclusion.
 *
 * THE SYSTEM REMAINS JURISDICTION_PENDING until external counsel
 * evidence is received. No jurisdiction is selected as a legal conclusion.
 *
 * DO NOT select a jurisdiction by intuition.
 * DO NOT treat a project decision as a legal conclusion.
 * DO NOT claim regulatory clearance.
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type MatrixCell = "FACT" | "SOURCE" | "UNKNOWN" | "LEGAL_QUESTION" | "REQUIRED_COUNSEL" | "DECISION";

export interface JurisdictionFactor {
  factorId: string;
  label: string;
  description: string;
}

export interface JurisdictionCandidate {
  jurisdictionId: string;
  label: string;
  seedStatus: string;     // from jurisdiction-truth-model.ts
  factorAssessment: { factorId: string; cell: MatrixCell; content: string; source: string }[];
  projectDecisionScore: number; // 0-100, DESIGN-TIME only (not legal feasibility)
  projectDecisionRationale: string;
}

export interface LegalQuestion {
  questionId: string;
  topic: string;
  question: string;
  context: string;
  whyItMatters: string;
  currentAnswer: string;  // "JURISDICTION_PENDING — requires external counsel"
}

export interface G1Report {
  gateId: string;
  gateLabel: string;
  objective: string;
  g0Status: string;
  factors: JurisdictionFactor[];
  candidates: JurisdictionCandidate[];
  selectedJurisdiction: string;
  selectionType: string;  // "PROJECT_DECISION (not a legal conclusion)"
  selectionRationale: string;
  legalQuestions: LegalQuestion[];
  jurisdictionStatus: string;  // "JURISDICTION_PENDING"
  passCriteria: {
    legalClassificationObtained: boolean;
    externallyValidated: boolean;
    counselEngaged: boolean;
  };
  honestState: {
    productionAuthorized: boolean;
    noJurisdictionSelectedAsLegalConclusion: boolean;
    systemRemainsJurisdictionPending: boolean;
    noIntuitionBasedSelection: boolean;
  };
  finalStatements: {
    whatIsKnown: string[];
    whatIsUnknown: string[];
    whatCounselMustAnswer: string[];
    whatMustHappenBeforeG2: string[];
  };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  13 Evaluation Factors                                              */
/* ------------------------------------------------------------------ */

export const FACTORS: JurisdictionFactor[] = [
  { factorId: "F01", label: "Legal Classification Feasibility", description: "Can MTQ be classified under existing legal categories (commodity, security, payment instrument, e-money, other) in this jurisdiction?" },
  { factorId: "F02", label: "Licensing Perimeter", description: "What licenses/authorizations are required to operate a permissioned settlement system? Is there a sandbox/innovation pathway?" },
  { factorId: "F03", label: "Bank Participation Feasibility", description: "Can a bank legally participate as a settlement counterparty? What are the prudential implications for the bank?" },
  { factorId: "F04", label: "Settlement-Rail Accessibility", description: "What settlement rails exist (RTGS, CBDC, correspondent banking)? Can MITHQAL connect to them via the MBG gateway?" },
  { factorId: "F05", label: "Custody Structure", description: "What custody structures are legally recognized? Can a PBC (Protected Backing Cell) be enforced?" },
  { factorId: "F06", label: "MTQ Issuance/Redemption Structure", description: "If MTQ is ever activated, what are the legal requirements for issuance and redemption? Who can be the obligor?" },
  { factorId: "F07", label: "Cross-Border Implications", description: "What are the cross-border settlement implications? Are there capital controls or FX restrictions?" },
  { factorId: "F08", label: "Data Requirements", description: "What data residency, privacy, and protection requirements apply? GDPR/PDPA equivalents?" },
  { factorId: "F09", label: "Sanctions and AML Obligations", description: "What sanctions screening and AML/CFT obligations apply to a settlement system operator?" },
  { factorId: "F10", label: "Insolvency Treatment", description: "How are settlement obligations and reserve assets treated in insolvency? Is bankruptcy remoteness achievable?" },
  { factorId: "F11", label: "Enforceability of Backing Arrangements", description: "Can the PBC (14 fields, 6 failure states) be legally enforced? Are segregation requirements recognized?" },
  { factorId: "F12", label: "Institutional Pilot Pathway", description: "Is there a regulatory sandbox, innovation hub, or pilot program that MITHQAL could enter?" },
  { factorId: "F13", label: "Cost and Execution Feasibility", description: "What are the legal costs, timeline, and complexity of obtaining the necessary approvals?" },
];

/* ------------------------------------------------------------------ */
/*  8 Candidate Jurisdictions (from jurisdiction-truth-model.ts)      */
/* ------------------------------------------------------------------ */

const UNKNOWN_ASSESSMENT = (factorId: string) => ({
  factorId,
  cell: "UNKNOWN" as MatrixCell,
  content: "No triage of public regulatory material has been performed. jurisdiction-truth-model.ts: status = SEED_DATA or UNKNOWN. UNKNOWN = CONSERVATIVE_BLOCK (NOT ALLOWED).",
  source: "jurisdiction-truth-model.ts",
});

export const CANDIDATES: JurisdictionCandidate[] = [
  {
    jurisdictionId: "AE",
    label: "United Arab Emirates",
    seedStatus: "SEED_DATA",
    factorAssessment: FACTORS.map(f => {
      if (f.factorId === "F12") return { factorId: f.factorId, cell: "SOURCE" as MatrixCell, content: "CBUAE has established digital sandbox/innovation initiatives. DIFC and ADGM free zones have common law frameworks with digital asset regulations.", source: "Public regulatory material (not triaged)" };
      if (f.factorId === "F05") return { factorId: f.factorId, cell: "SOURCE" as MatrixCell, content: "UAE is a major gold trading hub. DIFC has custody regulations. ADGM has digital asset custody frameworks.", source: "Public regulatory material (not triaged)" };
      if (f.factorId === "F07") return { factorId: f.factorId, cell: "LEGAL_QUESTION" as MatrixCell, content: "UAE has cross-border payment frameworks but CBUAE capital control requirements need counsel review.", source: "Public regulatory material (not triaged)" };
      return UNKNOWN_ASSESSMENT(f.factorId);
    }),
    projectDecisionScore: 68,
    projectDecisionRationale: "PROJECT DECISION (not legal conclusion): UAE selected as highest-priority candidate based on DESIGN-TIME factors: (1) CBUAE digital sandbox exists, (2) DIFC/ADGM common law + digital asset frameworks, (3) major gold trading hub (relevant to custody/backing), (4) corridor candidates (AE-SG, AE-EG, AE-IN) have AE as sender, (5) the designed bank-facing counterparty has UAE operating context. Actual legal feasibility = UNKNOWN until counsel is engaged.",
  },
  {
    jurisdictionId: "SG",
    label: "Singapore",
    seedStatus: "SEED_DATA",
    factorAssessment: FACTORS.map(f => {
      if (f.factorId === "F02") return { factorId: f.factorId, cell: "SOURCE" as MatrixCell, content: "MAS Payment Services Act defines licensing perimeter (PSN/PSL/DPT). Digital Payment Token licensing framework exists.", source: "Public regulatory material (not triaged)" };
      if (f.factorId === "F12") return { factorId: f.factorId, cell: "SOURCE" as MatrixCell, content: "MAS regulatory sandbox exists with express approval pathway. FTE (FinTech Entity) framework available.", source: "Public regulatory material (not triaged)" };
      if (f.factorId === "F08") return { factorId: f.factorId, cell: "SOURCE" as MatrixCell, content: "Singapore PDPA (Personal Data Protection Act) is well-documented. Data residency requirements exist.", source: "Public regulatory material (not triaged)" };
      return UNKNOWN_ASSESSMENT(f.factorId);
    }),
    projectDecisionScore: 65,
    projectDecisionRationale: "PROJECT DECISION: SG is a strong second candidate. MAS has the clearest digital asset licensing perimeter (Payment Services Act). Strong legal framework (common law). Major banking hub. However, UAE scored higher due to gold trading hub relevance + corridor alignment.",
  },
  {
    jurisdictionId: "SA",
    label: "Saudi Arabia",
    seedStatus: "SEED_DATA",
    factorAssessment: FACTORS.map(f => UNKNOWN_ASSESSMENT(f.factorId)),
    projectDecisionScore: 40,
    projectDecisionRationale: "PROJECT DECISION: SA is a candidate due to GCC cross-border corridor potential + Sharia alignment potential. However, less public regulatory material available on digital asset frameworks. SAMA sandbox less documented than MAS/CBUAE.",
  },
  {
    jurisdictionId: "IN",
    label: "India",
    seedStatus: "UNKNOWN",
    factorAssessment: FACTORS.map(f => {
      if (f.factorId === "F07") return { factorId: f.factorId, cell: "LEGAL_QUESTION" as MatrixCell, content: "India has capital controls (FEMA). Cross-border settlement implications need counsel review. INR convertibility restrictions.", source: "Public regulatory material (not triaged)" };
      return UNKNOWN_ASSESSMENT(f.factorId);
    }),
    projectDecisionScore: 30,
    projectDecisionRationale: "PROJECT DECISION: IN is a candidate due to high corridor pain (remittance volume) but classified as UNKNOWN (CONSERVATIVE_BLOCK) in jurisdiction-truth-model.ts. Capital controls + FEMA make legal feasibility uncertain.",
  },
  {
    jurisdictionId: "CN",
    label: "China",
    seedStatus: "SEED_DATA",
    factorAssessment: FACTORS.map(f => {
      if (f.factorId === "F07") return { factorId: f.factorId, cell: "LEGAL_QUESTION" as MatrixCell, content: "CNY/CNH distinction critical. Onshore CNY has capital controls. Offshore CNH has different rules. CNY/CNH classification UNVERIFIED in jurisdiction-truth-model.ts.", source: "jurisdiction-truth-model.ts:CNY/CNH unclassified" };
      return UNKNOWN_ASSESSMENT(f.factorId);
    }),
    projectDecisionScore: 25,
    projectDecisionRationale: "PROJECT DECISION: CN is a candidate due to high corridor volume but CNY/CNH capital controls + the unclassified status make it a lower priority for FIRST legal review. Better suited for a later corridor.",
  },
  {
    jurisdictionId: "US",
    label: "United States",
    seedStatus: "SEED_DATA",
    factorAssessment: FACTORS.map(f => {
      if (f.factorId === "F01") return { factorId: f.factorId, cell: "LEGAL_QUESTION" as MatrixCell, content: "US has complex multi-agency framework (SEC/CFTC/FinCEN/state regulators). MTQ classification depends on Howey test (security?) + money transmission laws.", source: "Public regulatory material (not triaged)" };
      if (f.factorId === "F02") return { factorId: f.factorId, cell: "LEGAL_QUESTION" as MatrixCell, content: "US money transmission licensing is state-by-state (MTL). Federal framework (OCC/Fed) for bank participation. No federal digital asset sandbox.", source: "Public regulatory material (not triaged)" };
      return UNKNOWN_ASSESSMENT(f.factorId);
    }),
    projectDecisionScore: 35,
    projectDecisionRationale: "PROJECT DECISION: US has complex multi-agency framework + state-by-state licensing. Higher cost + longer timeline for first legal review. The designed entity (JOZOUR_LLC_NJ) has NJ (New Jersey) context — but this is a formation question for G0, not a jurisdiction selection for G1.",
  },
  {
    jurisdictionId: "GB",
    label: "United Kingdom",
    seedStatus: "SEED_DATA",
    factorAssessment: FACTORS.map(f => {
      if (f.factorId === "F12") return { factorId: f.factorId, cell: "SOURCE" as MatrixCell, content: "FCA regulatory sandbox exists. UK has digital asset framework (Money Laundering Regulations + FCA crypto registration).", source: "Public regulatory material (not triaged)" };
      return UNKNOWN_ASSESSMENT(f.factorId);
    }),
    projectDecisionScore: 45,
    projectDecisionRationale: "PROJECT DECISION: GB has FCA sandbox + common law framework. However, post-Brexit regulatory uncertainty + lower corridor relevance (AE-GB not in pilot candidates) make it a secondary option.",
  },
  {
    jurisdictionId: "EU",
    label: "European Union",
    seedStatus: "SEED_DATA",
    factorAssessment: FACTORS.map(f => {
      if (f.factorId === "F08") return { factorId: f.factorId, cell: "SOURCE" as MatrixCell, content: "EU GDPR is well-documented. MiCA (Markets in Crypto-Assets) regulation provides digital asset framework.", source: "Public regulatory material (not triaged)" };
      return UNKNOWN_ASSESSMENT(f.factorId);
    }),
    projectDecisionScore: 42,
    projectDecisionRationale: "PROJECT DECISION: EU has MiCA + GDPR but is a multi-jurisdictional bloc (complexity). Lower corridor relevance. Better as a secondary expansion market.",
  },
];

/* ------------------------------------------------------------------ */
/*  Selected Jurisdiction (PROJECT DECISION)                           */
/* ------------------------------------------------------------------ */

export const SELECTED_JURISDICTION = "AE";
export const SELECTION_TYPE = "PROJECT_DECISION (not a legal conclusion)";
export const SELECTION_RATIONALE =
  "UAE (AE) selected as the first candidate for legal review based on DESIGN-TIME factors: " +
  "(1) CBUAE digital sandbox/innovation initiatives exist, " +
  "(2) DIFC/ADGM common law frameworks with digital asset regulations, " +
  "(3) UAE is a major gold trading hub (relevant to custody/backing), " +
  "(4) Corridor candidates (AE-SG, AE-EG, AE-IN) have AE as sender, " +
  "(5) The designed bank-facing counterparty has UAE operating context. " +
  "This is a PROJECT DECISION, NOT a legal conclusion. " +
  "The actual legal feasibility is UNKNOWN until external counsel is engaged. " +
  "The system remains JURISDICTION_PENDING.";

/* ------------------------------------------------------------------ */
/*  15 Legal Questions for Counsel                                     */
/* ------------------------------------------------------------------ */

export const LEGAL_QUESTIONS: LegalQuestion[] = [
  { questionId: "LQ-01", topic: "MTQ Classification", question: "What is the legal classification of MTQ under UAE law? Is it a commodity, security, payment instrument, e-money, virtual asset, or other category?", context: "mtq-economic-definition.ts: MTQ = 'permissioned, institutional, closed-loop settlement unit'. The classification determines which regulatory regime applies.", whyItMatters: "The classification determines: licensing requirements, prudential treatment, disclosure obligations, and whether MTQ can be used in settlement.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-02", topic: "MITHQAL Role", question: "What is MITHQAL's legal role under UAE law? Is it a settlement system operator, a payment service provider, a financial intermediary, a technology provider, or something else?", context: "MITHQAL coordinates settlement but does not legally settle. definitive-authority-model.ts: MITHQAL's role is NORMATIVE_AUTHORITY (what policy permits).", whyItMatters: "The role determines MITHQAL's regulatory obligations, licensing requirements, and liability scope.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-03", topic: "Bank Role", question: "What is the bank's legal role when participating in MITHQAL? Is the bank a settlement counterparty, a service provider, an agent, or something else?", context: "bank-contracting-package.ts: 17 sections define the bank's role but ALL are DRAFT. The bank's prudential treatment depends on its role classification.", whyItMatters: "The bank's role determines: capital treatment, regulatory reporting, and whether the bank needs specific authorization to participate.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-04", topic: "Obligor Identity", question: "Who is the legal obligor for settlement obligations? Is it the contracting entity, the operating entity, or a separate obligor entity?", context: "pilot-b-mtq-lifecycle.ts: IDENTIFIED_OBLIGOR = PENDING_EXTERNAL. institutional-settlement-obligation-registry.ts: NO_LEGAL_OBLIGOR → NO_INSTITUTIONAL_OBLIGATION.", whyItMatters: "The obligor identity determines who is legally liable for settlement obligations and who participants can claim against.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-05", topic: "Redemption Obligation", question: "What is the legal nature of the redemption obligation? Is it a contractual obligation, a regulatory obligation, or a fiduciary obligation?", context: "mtq-redemption-value-consistency.ts: ONE canonical redemption framework = PENDING. No executed redemption agreement exists.", whyItMatters: "The redemption obligation's legal nature determines: enforceability, priority in insolvency, and regulatory treatment.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-06", topic: "Custody", question: "What custody structures are legally recognized under UAE law for settlement assets? Can a qualified custodian hold bank money and/or gold in a segregated account for MITHQAL?", context: "reserve-domains.ts: 2 domains. No qualified custodian engaged. pbc-legal-enforceability.ts: 0/14 evidence predicates met.", whyItMatters: "The custody structure determines: asset protection in insolvency, regulatory treatment of held assets, and enforceability of backing arrangements.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-07", topic: "Protected Backing", question: "Can a Protected Backing Cell (PBC) arrangement be legally enforced under UAE law? What are the requirements for segregation, bankruptcy remoteness, and third-party verification?", context: "pbc-legal-enforceability.ts: 14 fields, 6 failure states. PBC counts as AvailableBacking ONLY when ALL 14 evidence predicates exist (0 exist).", whyItMatters: "The PBC enforceability determines whether backing assets are protected in insolvency and whether MITHQAL can claim backing coverage.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-08", topic: "Insolvency Treatment", question: "How are MITHQAL settlement obligations and reserve assets treated in insolvency under UAE law? Is bankruptcy remoteness achievable for PBC-protected assets?", context: "failure-resolution-legal-conditionality.ts: 6 forbidden assumptions. MITHQAL NEVER implies ownership/legal perfection/bankruptcy remoteness.", whyItMatters: "Insolvency treatment determines: participant recovery in failure, asset segregation enforceability, and regulatory capital implications.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-09", topic: "Licensing Perimeter", question: "What licenses, authorizations, or registrations does MITHQAL need to operate a permissioned settlement system under UAE law? Is there a sandbox/innovation pathway?", context: "jurisdiction-truth-model.ts: AE = SEED_DATA. No regulatory application filed. No sandbox admission.", whyItMatters: "The licensing perimeter determines: cost, timeline, regulatory obligations, and whether MITHQAL can operate without a full license during pilot.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-10", topic: "Cross-Border Settlement", question: "What are the cross-border settlement implications under UAE law? Are there capital controls, FX restrictions, or reporting obligations for cross-border settlement via MITHQAL?", context: "corridor-pain-index-operationalized.ts: 5 candidates (AE-SG, AE-EG, SA-IN, AE-IN, CN-AE). Pilot A: AE→SG corridor.", whyItMatters: "Cross-border treatment determines: which corridors are feasible, what reporting is required, and whether capital controls block settlement.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-11", topic: "Accounting/Prudential Implications", question: "What are the accounting and prudential implications for the bank participating in MITHQAL? How are settlement obligations, MTQ (if activated), and custody arrangements treated for capital adequacy?", context: "accounting-prudential-tax-framework.ts: 10 areas ALL PENDING_EXTERNAL_VALIDATION. 0 at EXTERNAL stage.", whyItMatters: "Prudential treatment determines: capital impact on the bank, regulatory reporting, and whether the bank can participate within its risk appetite.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-12", topic: "Sharia Implications", question: "Are there Sharia compliance implications for MITHQAL settlement under UAE law? If the bank requires Sharia compliance, what are the requirements and who must provide the Sharia opinion?", context: "sharia-aaoifi-governance.ts: PENDING_EXTERNAL_VALIDATION. SHARIA_CERTIFIED/SHARIA_APPROVED prohibited until independent evidence. 3 prohibited claims.", whyItMatters: "Sharia compliance may be required by UAE-based banks. The requirements determine: structure constraints, advisory board composition, and certification costs.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-13", topic: "Data/Privacy Requirements", question: "What data residency, privacy, and protection requirements apply to MITHQAL under UAE law? Where can transaction data be stored and processed?", context: "institutional-data-governance.ts: 15×7 matrix, 28 PENDING cells. runtime-infrastructure-map.ts: data in Turso (AWS us-east-1) + Vercel.", whyItMatters: "Data requirements determine: where infrastructure must be located, what data can leave the jurisdiction, and what consent/disclosure is required.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-14", topic: "Reporting Obligations", question: "What regulatory reporting obligations does MITHQAL have under UAE law? What must be reported to CBUAE, to the Financial Intelligence Unit, and to other authorities?", context: "regulatory-replay-engine.ts: 12-field decision context, READ-ONLY. But no live transactions to report yet.", whyItMatters: "Reporting obligations determine: operational overhead, system requirements for reporting, and compliance cost.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
  { questionId: "LQ-15", topic: "Wind-Down and Participant Migration", question: "What is the legal framework for winding down MITHQAL operations under UAE law? How are participant positions migrated? What happens to settlement obligations and reserve assets in wind-down?", context: "failure-resolution-legal-conditionality.ts: COORDINATION_RULE ('system may coordinate; must not invent legal rights'). settlement-continuity-fabric.ts: 9 events × 7 stages, NO_BYPASS_RULE.", whyItMatters: "Wind-down treatment determines: participant protection in failure, regulatory expectations for resolution, and the legal framework for migrating to an alternative system.", currentAnswer: "JURISDICTION_PENDING — requires external counsel" },
];

/* ------------------------------------------------------------------ */
/*  G1 Report                                                          */
/* ------------------------------------------------------------------ */

export function getG1Report(): G1Report {
  return {
    gateId: "G1",
    gateLabel: "Pilot-Jurisdiction Legal Analysis",
    objective: "Evaluate candidate jurisdictions against 13 factors. Select ONE candidate for first legal review. Selection is a PROJECT DECISION, not a legal conclusion.",
    g0Status: "G0_FAIL (entity not legally established — G1 pack prepared for when G0 is resolved. G1 cannot PASS until G0 PASSES.)",
    factors: FACTORS,
    candidates: CANDIDATES,
    selectedJurisdiction: SELECTED_JURISDICTION,
    selectionType: SELECTION_TYPE,
    selectionRationale: SELECTION_RATIONALE,
    legalQuestions: LEGAL_QUESTIONS,
    jurisdictionStatus: "JURISDICTION_PENDING",
    passCriteria: {
      legalClassificationObtained: false,
      externallyValidated: false,
      counselEngaged: false,
    },
    honestState: {
      productionAuthorized: false,
      noJurisdictionSelectedAsLegalConclusion: true,
      systemRemainsJurisdictionPending: true,
      noIntuitionBasedSelection: true,
    },
    finalStatements: {
      whatIsKnown: [
        "8 jurisdictions seeded (AE, SA, SG, IN, CN, US, GB, EU) — ALL SEED_DATA or UNKNOWN",
        "UAE (AE) selected as PROJECT DECISION for first legal review (score: 68/100, design-time only)",
        "13 evaluation factors defined with comparison matrix (FACT/SOURCE/UNKNOWN/LEGAL_QUESTION/REQUIRED_COUNSEL/DECISION)",
        "15 specific legal questions prepared for external counsel",
        "SG (65/100) is the strongest second candidate (MAS Payment Services Act, regulatory sandbox)",
        "UAE has DIFC/ADGM common law frameworks + CBUAE digital sandbox (public regulatory material, NOT triaged)",
      ],
      whatIsUnknown: [
        "ALL legal classification feasibility = UNKNOWN (no counsel engaged)",
        "ALL licensing perimeters = UNKNOWN (no regulatory application filed)",
        "ALL bank participation feasibility = UNKNOWN (no bank engaged)",
        "ALL custody enforceability = UNKNOWN (no custodian engaged)",
        "ALL insolvency treatment = UNKNOWN (no counsel opinion)",
        "ALL cross-border implications = UNKNOWN (no triage performed)",
        "The system remains JURISDICTION_PENDING",
      ],
      whatCounselMustAnswer: [
        "LQ-01: MTQ legal classification (commodity? security? payment instrument? e-money? other?)",
        "LQ-02: MITHQAL's legal role (settlement system operator? payment service provider? other?)",
        "LQ-03: Bank's legal role (counterparty? service provider? agent?)",
        "LQ-04: Obligor identity (which entity is the legal obligor?)",
        "LQ-05: Redemption obligation legal nature (contractual? regulatory? fiduciary?)",
        "LQ-06: Custody structures legally recognized under UAE law",
        "LQ-07: PBC enforceability under UAE law (segregation, bankruptcy remoteness)",
        "LQ-08: Insolvency treatment of settlement obligations and reserve assets",
        "LQ-09: Licensing perimeter (what licenses are needed? sandbox pathway?)",
        "LQ-10: Cross-border settlement implications (capital controls? FX restrictions?)",
        "LQ-11: Accounting/prudential implications for the bank",
        "LQ-12: Sharia compliance implications (if required by the bank)",
        "LQ-13: Data/privacy requirements (data residency? consent? disclosure?)",
        "LQ-14: Reporting obligations (to CBUAE? FIU? other authorities?)",
        "LQ-15: Wind-down and participant migration framework",
      ],
      whatMustHappenBeforeG2: [
        "1. G0 must PASS (entity legally established — currently G0_FAIL)",
        "2. External legal counsel must be engaged for the selected jurisdiction (AE)",
        "3. Counsel must answer ALL 15 legal questions (LQ-01 through LQ-15)",
        "4. MTQ legal classification must be obtained (LQ-01)",
        "5. The jurisdiction must reach LEGAL_REVIEW or INSTITUTIONALLY_VALIDATED status (from SEED_DATA)",
        "6. Only then can G2 (Regulatory Perimeter) begin",
      ],
    },
    summary:
      `G1 PILOT-JURISDICTION LEGAL PACK. ${CANDIDATES.length} candidate jurisdictions evaluated against ${FACTORS.length} factors. ` +
      `Selected: ${SELECTED_JURISDICTION} (PROJECT DECISION, not legal conclusion, score: ${CANDIDATES.find(c => c.jurisdictionId === SELECTED_JURISDICTION)?.projectDecisionScore}/100). ` +
      `${LEGAL_QUESTIONS.length} legal questions prepared for counsel. ` +
      `System status: JURISDICTION_PENDING. G0 status: G0_FAIL (G1 cannot PASS until G0 PASSES). ` +
      `NOT PRODUCTION-AUTHORIZED. No regulatory clearance claimed.`,
  };
}

export const G1_META = {
  module: "g1-pilot-jurisdiction-legal-pack",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: "2026-10-01T14:53:00Z",
  honestState: "NOT PRODUCTION-AUTHORIZED — JURISDICTION_PENDING",
  frozenArchitecture: true,
  factorCount: FACTORS.length,
  candidateCount: CANDIDATES.length,
  legalQuestionCount: LEGAL_QUESTIONS.length,
  selectedJurisdiction: SELECTED_JURISDICTION,
  jurisdictionStatus: "JURISDICTION_PENDING",
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  Architecture FROZEN. This is a READ-ONLY legal analysis framework.
//  No architecture modified. No jurisdiction selected as legal conclusion.
//
//  G0 STATUS: G0_FAIL (entity not legally established).
//  G1 STATUS: JURISDICTION_PENDING (no counsel engaged, no legal opinion).
//
//  SELECTION: UAE (AE) — PROJECT DECISION based on design-time factors.
//  NOT a legal conclusion. Actual legal feasibility = UNKNOWN.
//
//  DO NOT:
//    - Select a jurisdiction by intuition (selection is evidence-based)
//    - Treat a project decision as a legal conclusion
//    - Claim regulatory clearance
//    - Infer legal status from the blueprint
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════

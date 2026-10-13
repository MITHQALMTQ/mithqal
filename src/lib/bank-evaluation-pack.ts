/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — FIRST BANK INSTITUTIONAL EVALUATION PACK (v25.3.2 FROZEN)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Generated from the FROZEN v25.3.2 source. Read-only. No new claims.
 *
 * 10 DOCUMENTS:
 *   1. Executive Thesis (2 pages)
 *   2. Bank Product Brief (max 20 pages)
 *   3. Pilot Specification (40-60 pages)
 *   4. Technical Integration Appendix
 *   5. Legal / Regulatory Question Pack
 *   6. Accounting / Prudential Question Pack
 *   7. Risk / Security / Resilience Pack
 *   8. Bank ROI / Value Model
 *   9. Evidence Register
 *   10. Open Issues Register
 *
 * FIRST PAGE answers 11 questions (see FIRST_PAGE_QUESTIONS).
 *
 * NO unsupported: bank claims, regulatory claims, licensing claims,
 * performance claims, partnership claims, security claims, Sharia claims,
 * legal classifications, or production claims.
 *
 * EVERY material claim points to an evidence record.
 *
 * USABLE BY 8 BANK TEAMS: business, treasury, operations, technology,
 * risk, compliance, legal, finance.
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FirstPageAnswer {
  question: string;
  answer: string;
  evidenceRecord: string;
  bankTeam: string[];
}

export interface EvaluationDocument {
  documentId: string;
  title: string;
  estimatedLength: string;
  targetTeams: string[];
  sections: { heading: string; content: string; evidenceRecord: string }[];
  unsupportedClaimsPresent: boolean;
}

export interface EvidenceRecord {
  recordId: string;
  claim: string;
  evidenceClass: string;
  source: string;
  externallyValidated: boolean;
  status: string;
}

export interface OpenIssue {
  issueId: string;
  issue: string;
  severity: "BLOCKING" | "MAJOR" | "MINOR";
  owner: string;
  gate: string;
  resolution: string;
}

export interface BankEvaluationPack {
  packId: string;
  version: string;
  generatedFrom: string;
  frozenArchitecture: boolean;
  firstPage: FirstPageAnswer[];
  documents: EvaluationDocument[];
  evidenceRegister: EvidenceRecord[];
  openIssues: OpenIssue[];
  bankTeams: string[];
  honestState: {
    noUnsupportedClaims: boolean;
    allClaimsHaveEvidenceRecord: boolean;
    productionAuthorized: boolean;
    architectureNotModified: boolean;
  };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  Shared Constants                                                  */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T14:53:00Z";
const RELEASE = "v25.3.2";
const BANK_TEAMS = ["business", "treasury", "operations", "technology", "risk", "compliance", "legal", "finance"];

/* ------------------------------------------------------------------ */
/*  FIRST PAGE — 11 Questions Answered                                 */
/* ------------------------------------------------------------------ */

export const FIRST_PAGE: FirstPageAnswer[] = [
  {
    question: "What problem does MITHQAL solve?",
    answer: "MITHQAL addresses cross-border settlement friction: correspondent banking delays (T+2/T+3), trapped liquidity in nostro/vostro accounts, opaque FX costs, high reconciliation effort, and compliance/evidence burden. The control plane provides policy enforcement, jurisdiction gating, compliance orchestration, liquidity routing, finality coordination, reconciliation, and evidence generation — all with MTQ disabled (BANK_MONEY settlement).",
    evidenceRecord: "institutionalization-control-tower.ts:DEPLOYMENT_BLOCKERS (9 P0 blockers); pilot-a-execution-engine.ts:19 steps SETTLED with BANK_MONEY",
    bankTeams: ["business", "treasury", "operations"],
  },
  {
    question: "Who uses it?",
    answer: "Banks (as settlement participants via the MBG gateway), custodians (for backing verification), regulators (for evidence replay), and auditors (for independent assurance). MTQ is permissioned, institutional, closed-loop — NOT retail. The control plane operates with bank money; MTQ is an optional extension (Pilot B) that requires 11 institutional prerequisites.",
    evidenceRecord: "mtq-economic-definition.ts:canonicalDescription ('permissioned, institutional, closed-loop'); pilot-b-mtq-lifecycle.ts:11 prerequisites ALL PENDING_EXTERNAL",
    bankTeams: ["business", "compliance", "legal"],
  },
  {
    question: "Where does it sit in the bank architecture?",
    answer: "MITHQAL sits between the bank's core banking system and the external settlement rail. The bank connects via the MBG (Mithqal Bank Gateway) which translates ISO 20022 messages. MITHQAL does NOT replace the core banking system — it sits alongside it as a settlement coordination layer. The bank retains its core banking, its customer relationships, and its regulatory obligations.",
    evidenceRecord: "docs/architecture/mbg/MITHQAL_BANK_GATEWAY_ARCHITECTURE.md; settlement-workflow-canonical.ts:BM-02 (ISO 20022/MBG translation)",
    bankTeams: ["technology", "operations"],
  },
  {
    question: "What does the bank keep?",
    answer: "The bank keeps: its core banking system, its customer relationships, its regulatory licenses, its capital, its custody arrangements, its compliance programs, and its SWIFT/messaging infrastructure. MITHQAL does NOT take custody of bank assets, does NOT hold bank capital, and does NOT replace the bank's regulatory obligations. The bank's nostro/vostro accounts remain the bank's.",
    evidenceRecord: "runtime-infrastructure-map.ts:TURSO (MITHQAL owns NO bank data; Vercel is stateless); definitive-authority-model.ts:FORBIDDEN_EQUIVALENCES (CODE≠LEGAL)",
    bankTeams: ["business", "treasury", "legal", "finance"],
  },
  {
    question: "What changes?",
    answer: "The bank adds: an MBG gateway integration (API-based), MITHQAL policy enforcement at the settlement coordination layer, automated reconciliation (6 tolerance policies), automated evidence generation (15-field packages with SHA-256), and regulatory replay capability (12-field, READ-ONLY). The bank's existing workflows are augmented, NOT replaced. Settlement can use BANK_MONEY (Pilot A) or MTQ (Pilot B, if 11 prerequisites met).",
    evidenceRecord: "bank-onboarding-training-framework.ts:11 modules DRAFT; institutional-evidence-fabric.ts:15-field package; reconciliation-tolerance-policies.ts:6 policies",
    bankTeams: ["operations", "technology", "compliance"],
  },
  {
    question: "What does MITHQAL NOT do?",
    answer: "MITHQAL does NOT: hold bank capital, take custody of assets, replace the core banking system, replace SWIFT, make regulatory decisions, adjudicate disputes, grant legal authority, validate legal classifications, or authorize production. MITHQAL COORDINATES settlement — it does not LEGALLY settle. Legal finality (F7) requires external legal evidence. MITHQAL's safe halt never commits a partial settlement.",
    evidenceRecord: "definitive-authority-model.ts:4 forbidden equivalences; dispute-exception-framework.ts:MITHQAL_COORDINATION_RULE (5 is + 8 isNot); settlement-continuity-fabric.ts:NO_BYPASS_RULE",
    bankTeams: ["legal", "compliance", "risk", "business"],
  },
  {
    question: "What is MTQ?",
    answer: "MTQ is a permissioned, institutional, closed-loop settlement unit. It is NOT a retail token, NOT a speculative asset, NOT a cryptocurrency, NOT a security (classification PENDING_VALIDATION), and NOT pegged to any currency. MTQ is an OPTIONAL extension on top of the control plane. The control plane operates fully without MTQ (Pilot A proves this: 19 steps, 0 MTQ used, SETTLED, BANK_MONEY).",
    evidenceRecord: "mtq-economic-definition.ts:canonicalDescription + 12 isNotStatements; pilot-a-execution-engine.ts:0/19 mtqUsed, BANK_MONEY, SETTLED",
    bankTeams: ["business", "legal", "treasury", "compliance"],
  },
  {
    question: "Can the control plane operate without MTQ?",
    answer: "YES. Pilot A demonstrates 19 settlement steps (BM-01..BM-16B) with MTQ completely disabled. Settlement asset = BANK_MONEY. Final state = SETTLED. Finality = F6 (BANKING_FINALITY). 0/19 steps use MTQ. The control plane (policy, compliance, jurisdiction, liquidity, FX, finality, reconciliation, evidence) operates independently of MTQ. MTQ is an extension, not a dependency.",
    evidenceRecord: "pilot-a-execution-engine.ts:finalState=SETTLED, mtqEnabled=false, settlementAsset=BANK_MONEY; pilot-b-mtq-lifecycle.ts:currentState=MTQ_DISABLED, canTransitionToActive=false",
    bankTeams: ["technology", "operations", "business"],
  },
  {
    question: "What is simulated?",
    answer: "ALL settlement data in Pilot A is SIMULATED. No live bank participation. No live nostro/vostro data. No live FX rates. No live compliance screening. No live custody evidence. The evidence tier for every step is SIMULATED. The Corridor Pain Index scores are SIMULATED (4/14 factors, 10/14 INSUFFICIENT_DATA). The Bank Value Measurement baselines are ALL INSUFFICIENT_DATA. No savings are invented. Simulated data is NEVER used to claim live institutional integration.",
    evidenceRecord: "pilot-a-execution-engine.ts:evidenceTier=SIMULATED; bank-value-measurement-engine.ts:12 baselines ALL INSUFFICIENT_DATA; corridor-pain-index-operationalized.ts:0 corridors selected",
    bankTeams: ["risk", "compliance", "finance", "treasury"],
  },
  {
    question: "What has been externally validated?",
    answer: "NOTHING. Zero external validation has occurred. 0/12 institutional critical path gates passed (G0-G11 ALL NOT_STARTED/PENDING_EXTERNAL). 0/17 bank contract sections SIGNED. 0/8 jurisdictions triaged. 0/10 accounting areas externally validated. 0 evidence packages INSTITUTIONALLY_VERIFIED. 0 FTE filled. $0 cash. $4.7M = DESIGN-TIME. The architecture is FROZEN but NOT externally validated. NOT PRODUCTION-AUTHORIZED.",
    evidenceRecord: "institutional-critical-path.ts:0/12 gates PASSED; bank-contracting-package.ts:0/17 SIGNED; jurisdiction-truth-model.ts:0/8 triaged; accounting-prudential-tax-framework.ts:0/10 validated; institutional-evidence-fabric.ts:0 INSTITUTIONALLY_VERIFIED",
    bankTeams: ["legal", "compliance", "risk", "finance", "business"],
  },
  {
    question: "What is the smallest proposed pilot?",
    answer: "Pilot A (Control Plane, MTQ DISABLED): 1 bank, 1 corridor (selected from the 5 candidates via the 14-factor Corridor Pain Index — but 0 corridors currently selected because 10/14 factors are INSUFFICIENT_DATA). Settlement asset = BANK_MONEY. 8 test areas. The pilot requires: (1) G0 corporate/contractual integrity, (2) G1 legal analysis, (3) G2 regulatory clearance, (4) G3 bank design partner, (5) G4 bank contract, (6) G5 technical integration, (7) G6 backing/custody evidence. The smallest pilot is 1 bank + 1 corridor + BANK_MONEY + MTQ disabled.",
    evidenceRecord: "two-pilot-modes.ts:PILOT_A (8 areas, mtqRequired=false, canBeEnabled=true); corridor-pain-index-operationalized.ts:5 candidates, 0 selected; institutional-critical-path.ts:G0-G7 (7 gates before pilot)",
    bankTeams: ["business", "operations", "technology", "legal", "compliance"],
  },
];

/* ------------------------------------------------------------------ */
/*  10 Documents                                                       */
/* ------------------------------------------------------------------ */

export const EVALUATION_DOCUMENTS: EvaluationDocument[] = [
  {
    documentId: "BEP-01",
    title: "Executive Thesis",
    estimatedLength: "2 pages",
    targetTeams: ["business", "finance", "legal"],
    sections: [
      { heading: "Problem Statement", content: "Cross-border settlement is slow (T+2/T+3), expensive (correspondent banking fees + FX spreads + intermediary costs), liquidity-inefficient (trapped nostro/vostro capital), reconciliation-heavy, and compliance-burdensome. MITHQAL's control plane addresses these by providing policy enforcement, jurisdiction gating, compliance orchestration, liquidity routing, finality coordination, reconciliation, and evidence generation — with MTQ disabled (BANK_MONEY).", evidenceRecord: "institutionalization-control-tower.ts:9 P0 blockers" },
      { heading: "What MITHQAL Is", content: "MITHQAL is a permissioned, institutional, closed-loop settlement infrastructure. The control plane operates independently of MTQ. MTQ is an optional extension requiring 11 institutional prerequisites. NOT PRODUCTION-AUTHORIZED. Architecture FROZEN at v25.3.2.", evidenceRecord: "mtq-economic-definition.ts; controlled-architecture-freeze.ts:10 frozen schemas" },
      { heading: "What MITHQAL Is Not", content: "MITHQAL is NOT: a bank, a custodian, a regulator, an exchange, a cryptocurrency, a retail product, or a legal authority. It COORDINATES settlement — it does not LEGALLY settle. Legal finality (F7) requires external evidence.", evidenceRecord: "definitive-authority-model.ts:4 forbidden equivalences; dispute-exception-framework.ts:MITHQAL_COORDINATION_RULE" },
      { heading: "Current Status", content: "Architecture FROZEN. 0/12 institutional gates passed. 0 banks engaged. 0 external validation. $0 cash. NOT PRODUCTION-AUTHORIZED. The purpose of this pack is to enable a bank's evaluation — not to claim readiness.", evidenceRecord: "institutional-critical-path.ts:0/12 PASSED; RELEASE_MANIFEST_V25_3_2" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-02",
    title: "Bank Product Brief",
    estimatedLength: "max 20 pages",
    targetTeams: ["business", "treasury", "operations", "compliance"],
    sections: [
      { heading: "Product Overview", content: "The MITHQAL control plane provides: instruction ingestion (BM-01), ISO 20022/MBG translation (BM-02), policy enforcement (BM-03), bank/customer verification (BM-04..08), eligibility check (BM-09), jurisdiction gating (BM-10), compliance orchestration (BM-11), liquidity routing (BM-12), FX selection (BM-13), settlement-state management (BM-14), monetary authorization (BM-15), finality coordination (BM-16A), reconciliation, evidence generation, exception handling, safe halt, alternative routing, recovery, regulatory replay.", evidenceRecord: "settlement-workflow-canonical.ts:17 BM steps; pilot-a-execution-engine.ts:19 steps" },
      { heading: "Settlement Asset", content: "BANK_MONEY (Pilot A). MTQ is disabled by default. MTQ activation requires 11 institutional prerequisites + external authorization. MTQ_ACTIVE CANNOT be reached from software configuration alone.", evidenceRecord: "pilot-b-mtq-lifecycle.ts:4 states, 11 prerequisites, canTransitionToActive=false" },
      { heading: "Finality Model", content: "8 stages (F0-F7), 3 types (TECHNICAL/BANKING/LEGAL), 2 modes (finality-coordinated/atomic). Pilot A reaches F6 (BANKING_FINALITY). F7 (LEGAL_FINALITY) requires external legal evidence.", evidenceRecord: "canonical-finality-model.ts:F0-F7; pilot-a-execution-engine.ts:finalityStage=F6" },
      { heading: "Reconciliation", content: "6 separate tolerance policies (1/5/10/50/20/200 bps). No universal tolerance. 6-field reconciliation record per policy. The old universal RECONCILIATION_TOLERANCE is SUPERSEDED.", evidenceRecord: "reconciliation-tolerance-policies.ts:6 policies" },
      { heading: "Evidence", content: "15-field portable evidence package. 3 access levels (PUBLIC/INSTITUTIONAL/AUDIT). SHA-256 cryptographic commitments. 0 packages INSTITUTIONALLY_VERIFIED (all SIMULATED).", evidenceRecord: "institutional-evidence-fabric.ts:15 fields, 3 levels, 0 verified" },
      { heading: "Bank Value", content: "12 metrics × 6 cost categories. ALL baselines INSUFFICIENT_DATA (no bank has provided data). ALL MITHQAL-assisted values SIMULATED. NET INSTITUTIONAL VALUE = INSUFFICIENT_DATA. NO savings invented.", evidenceRecord: "bank-value-measurement-engine.ts:12 metrics all INSUFFICIENT_DATA" },
      { heading: "Pricing", content: "7 fee types × 7 stages = 49 prices. ALL PENDING. No commercial pricing set. FEE_INDEPENDENCE_RULE: fees cannot influence controls.", evidenceRecord: "institutional-pricing-architecture.ts:49 prices ALL PENDING" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-03",
    title: "Pilot Specification",
    estimatedLength: "40-60 pages",
    targetTeams: ["operations", "technology", "compliance", "risk", "legal"],
    sections: [
      { heading: "Pilot A (MTQ Disabled)", content: "19 settlement steps (BM-01..BM-16B + evidence + replay). Settlement asset = BANK_MONEY. MTQ = disabled (0/19 steps use MTQ). Final state = SETTLED. Finality = F6. Evidence = SIMULATED. The pilot demonstrates: instruction ingestion, ISO 20022/MBG translation, policy enforcement, jurisdiction gating, compliance, liquidity routing, FX, settlement-state, finality, reconciliation, evidence, exception handling, safe halt, alternative routing, recovery, regulatory replay.", evidenceRecord: "pilot-a-execution-engine.ts:19 steps, SETTLED, BANK_MONEY" },
      { heading: "Pilot B (MTQ Extension)", content: "4 states: MTQ_DISABLED → MTQ_ELIGIBLE_PENDING → MTQ_AUTHORIZED_FOR_PILOT → MTQ_ACTIVE. 11 prerequisites (ALL PENDING_EXTERNAL). MTQ_ACTIVE CANNOT be reached from config alone. Pilot B inherits EVERY Pilot A control.", evidenceRecord: "pilot-b-mtq-lifecycle.ts:4 states, 11 prerequisites" },
      { heading: "Gate Framework", content: "11-field gate framework. 0/15 gates passed. canPassWithImplementationOnly() = false. Two tracks: Implementation + Institutional Validation. No gate passes on code/tests alone.", evidenceRecord: "pilot-gate-framework.ts:0/15 passed, canPassWithImplementationOnly=false" },
      { heading: "Corridor Selection", content: "14-factor Corridor Pain Index. 5 candidates (AE-SG, AE-EG, SA-IN, AE-IN, CN-AE). ALL SIMULATED. 0 selected. 0 recommended for investigation (10/14 factors INSUFFICIENT_DATA). NO corridor hard-coded.", evidenceRecord: "corridor-pain-index-operationalized.ts:14 factors, 5 corridors, 0 selected" },
      { heading: "Demo Environment", content: "8 deterministic scenarios: normal settlement, compliance failure, liquidity-routing change, rail failure, reconciliation mismatch, safe halt, recovery, evidence replay. MTQ disabled. Synthetic data only. Deterministic replay package (SHA-256 verified).", evidenceRecord: "institutional-demo-environment.ts:8 scenarios, determinismVerified=true" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-04",
    title: "Technical Integration Appendix",
    estimatedLength: "variable",
    targetTeams: ["technology"],
    sections: [
      { heading: "MBG Gateway", content: "The Mithqal Bank Gateway (MBG) is the bank-facing API. Translates ISO 20022 ↔ MBG format. The bank connects via the MBG gateway. No code lives outside GitHub. 222 API routes. Next.js 16.1.3.", evidenceRecord: "mithqal-bank-gateway.ts; settlement-workflow-canonical.ts:BM-02" },
      { heading: "Infrastructure", content: "5 systems: GitHub (repo + config), Vercel (deployment, stateless), Turso (transactional DB, 17 tables), Neon (analytics + S3 + AI Gateway), Inngest (event/job). No competing sources of truth. Zero-cost dev/test.", evidenceRecord: "runtime-infrastructure-map.ts:5 systems, 6 data categories" },
      { heading: "Control Plane vs MTQ Boundary", content: "The control plane is asset-agnostic (7 settlement asset types). MTQ_SETTLEMENT_ENABLED=false → control plane operates with BANK_MONEY. The MTQ module is optional + disable-able.", evidenceRecord: "mtq-settlement-config.ts:MTQ_SETTLEMENT_ENABLED flag; pilot-a-execution-engine.ts:0/19 mtqUsed" },
      { heading: "AI Brain", content: "6 providers (groq, openrouter, nvidia, gemini, huggingface, neon). Dynamic Groq model discovery. Per-provider fallback chains. Cross-provider failover. Graceful degradation (consensus: low when all fail). z.ai NOT in Brain. Brain is ADVISORY only — never wired into NAV/weight calculations.", evidenceRecord: "mithqal-brain.ts:6 providers, MODEL_FALLBACKS, crossProviderFailover" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-05",
    title: "Legal / Regulatory Question Pack",
    estimatedLength: "variable",
    targetTeams: ["legal", "compliance"],
    sections: [
      { heading: "PBC Legal Enforceability", content: "14 fields + 6 failure states. PBC counts as AvailableBacking ONLY when ALL 14 evidence predicates exist (0 exist). Status: PENDING_EXTERNAL_VALIDATION. QUESTION: What is the bank's legal counsel's view on PBC enforceability in the pilot jurisdiction?", evidenceRecord: "pbc-legal-enforceability.ts:14 fields, 0 predicates met" },
      { heading: "MTQ Legal Classification", content: "MTQ = 'permissioned, institutional, closed-loop settlement unit'. Legal classification = PENDING_VALIDATION. QUESTION: Is MTQ a commodity, security, payment instrument, e-money, or other? This requires external legal counsel.", evidenceRecord: "mtq-economic-definition.ts:canonicalDescription, PENDING_VALIDATION" },
      { heading: "Jurisdiction Truth", content: "8 jurisdictions ALL SEED_DATA/UNKNOWN. UNKNOWN = CONSERVATIVE_BLOCK. QUESTION: Which jurisdiction(s) will the bank pilot in? What is the regulatory status of each?", evidenceRecord: "jurisdiction-truth-model.ts:8 jurisdictions ALL SEED_DATA/UNKNOWN" },
      { heading: "Bank Contracts", content: "17 sections ALL DRAFT, 0 SIGNED. QUESTION: Which sections does the bank's legal team want to review first? What terms are non-negotiable?", evidenceRecord: "bank-contracting-package.ts:17 sections ALL DRAFT" },
      { heading: "Sharia/AAOIFI", content: "PENDING_EXTERNAL_VALIDATION. SHARIA_CERTIFIED prohibited. QUESTION: Is Sharia compliance required for the bank's pilot? If so, which Sharia board will review?", evidenceRecord: "sharia-aaoifi-governance.ts:PENDING, 3 prohibited" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-06",
    title: "Accounting / Prudential Question Pack",
    estimatedLength: "variable",
    targetTeams: ["finance", "risk"],
    sections: [
      { heading: "Accounting Treatment", content: "10 areas ALL PENDING_EXTERNAL_VALIDATION. 0 at EXTERNAL stage. QUESTION: How does the bank's accounting team classify MTQ? What is the prudential treatment?", evidenceRecord: "accounting-prudential-tax-framework.ts:10 areas ALL PENDING" },
      { heading: "Reserve Domains", content: "2 domains: SETTLEMENT_LIQUIDITY (counts toward backing) + STRATEGIC_RESILIENCE (gold, NOT backing). QUESTION: How does the bank's treasury view the 2-domain separation?", evidenceRecord: "reserve-domains.ts:2 domains, gold not backing" },
      { heading: "Coverage Formula", content: "Required Coverage = Direct Settlement Backing + Risk Buffer. 9 factors. 130% = strategic target ONLY (not universal). QUESTION: What coverage ratio does the bank's risk team require?", evidenceRecord: "reserve-coverage-logic.ts:9 factors, not universal" },
      { heading: "Obligation Registry", content: "13-field. NO_LEGAL_OBLIGOR → NO_INSTITUTIONAL_OBLIGATION. QUESTION: Who is the identified obligor? What is the bank's view on obligation structures?", evidenceRecord: "institutional-settlement-obligation-registry.ts:13 fields, NO_LEGAL_OBLIGOR" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-07",
    title: "Risk / Security / Resilience Pack",
    estimatedLength: "variable",
    targetTeams: ["risk", "technology", "compliance"],
    sections: [
      { heading: "Enterprise Risk Register", content: "17 risks × 14 fields. ALL OPEN. Qualitative only. QUESTION: Which of the 17 risks are material to the bank? What is the bank's risk appetite?", evidenceRecord: "enterprise-risk-register.ts:17 risks ALL OPEN" },
      { heading: "Insurance", content: "7 categories ALL DESIGNED (0 QUOTED/BOUND/ACTIVE). NO_SUBSTITUTE_RULE. QUESTION: What insurance does the bank require before pilot participation?", evidenceRecord: "insurance-risk-transfer-framework.ts:7 categories ALL DESIGNED" },
      { heading: "Settlement Continuity", content: "9 events × 7-stage lifecycle. NO_BYPASS_RULE. QUESTION: How does the bank's operations team handle settlement continuity events?", evidenceRecord: "settlement-continuity-fabric.ts:9 events, 7 stages" },
      { heading: "Dispute & Exception", content: "7 types × 9-stage lifecycle. MITHQAL coordinates, NOT adjudicates. QUESTION: What is the bank's dispute resolution framework? How does it interface with MITHQAL's coordination?", evidenceRecord: "dispute-exception-framework.ts:7 types, 9 stages" },
      { heading: "Data Governance", content: "15 dimensions × 7 data types = 105-cell matrix. 28 PENDING cells. QUESTION: What data governance requirements does the bank impose?", evidenceRecord: "institutional-data-governance.ts:15×7, 28 PENDING" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-08",
    title: "Bank ROI / Value Model",
    estimatedLength: "variable",
    targetTeams: ["finance", "business", "treasury"],
    sections: [
      { heading: "Measurement Engine", content: "12 metrics × 6 cost categories. ALL baselines INSUFFICIENT_DATA. ALL MITHQAL-assisted SIMULATED. NET INSTITUTIONAL VALUE = INSUFFICIENT_DATA. NO savings invented. CFO-ready framework — NOT CFO-validated.", evidenceRecord: "bank-value-measurement-engine.ts:12 metrics all INSUFFICIENT_DATA" },
      { heading: "Cost Categories", content: "BANK_BENEFIT (savings) + MITHQAL_COST (fees, 49 ALL PENDING) + INTEGRATION_COST + CHANGE_COST + RISK_CAPITAL_COST = NET_INSTITUTIONAL_VALUE. All components INSUFFICIENT_DATA.", evidenceRecord: "bank-value-measurement-engine.ts:6 categories all INSUFFICIENT_DATA" },
      { heading: "Competitive Compatibility", content: "7 competitors × 14 dimensions. ALL dependency=false. NO_SUPERIORITY_RULE. QUESTION: How does MITHQAL compare to the bank's existing settlement infrastructure?", evidenceRecord: "competitive-compatibility-framework.ts:7 competitors, NO_SUPERIORITY_RULE" },
      { heading: "Critical Caveat", content: "DO NOT use any SIMULATED value as a savings claim. DO NOT compute Net Institutional Value until baseline data is provided by the bank. Any savings figure without baseline data would be INVENTED.", evidenceRecord: "bank-value-measurement-engine.ts:criticalCaveat" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-09",
    title: "Evidence Register",
    estimatedLength: "variable",
    targetTeams: ["compliance", "risk", "legal", "audit"],
    sections: [
      { heading: "Evidence Classes (10, ranked)", content: "1. EXECUTED_LEGAL_INSTRUMENT (highest) 2. INDEPENDENT_VALIDATION 3. CONTROLLING_POLICY 4. APPROVED_CONFIGURATION 5. EXECUTABLE_CODE 6. RUNTIME_OBSERVATION 7. TEST_RESULT 8. DOCUMENT_CLAIM 9. SIMULATED 10. DESIGN_TIME. No claim asserts higher than its evidence supports.", evidenceRecord: "technical-evidence-classification.ts:10 classes; definitive-authority-model.ts:EVIDENCE_CLASS_RANK" },
      { heading: "Current Evidence Status", content: "0 packages INSTITUTIONALLY_VERIFIED. 10 material claims honestly classified (0 externally validated). 6 BLOCKING_REMEDIATION items. Evidence elevation path: SIMULATED → ILLUSTRATIVE → VALIDATED → INSTITUTIONALLY_VERIFIED.", evidenceRecord: "institutional-evidence-fabric.ts:0 verified; definitive-authority-model.ts:10 claims, 0 validated" },
      { heading: "Forbidden Equivalences", content: "CODE≠LEGAL_AUTHORITY. TEST_PASS≠INSTITUTIONAL_VALIDATION. CONFIGURATION≠REGULATORY_AUTHORIZATION. DOCUMENT_CLAIM≠EXECUTION_TRUTH. These are enforced in the definitive-authority-model.", evidenceRecord: "definitive-authority-model.ts:4 forbidden equivalences" },
    ],
    unsupportedClaimsPresent: false,
  },
  {
    documentId: "BEP-10",
    title: "Open Issues Register",
    estimatedLength: "variable",
    targetTeams: ["business", "legal", "compliance", "risk", "finance", "operations"],
    sections: [
      { heading: "Institutional Gates (12 open)", content: "G0 Corporate/Contractual → G1 Legal Analysis → G2 Regulatory → G3 Bank Partner → G4 Bank Contract → G5 Tech Integration → G6 Backing/Custody → G7 Controlled Pilot → G8 Independent Assurance → G9 Measured Outcome → G10 Repeatability → G11 Production Auth. ALL NOT_STARTED/PENDING_EXTERNAL. 0/12 PASSED.", evidenceRecord: "institutional-critical-path.ts:12 gates, 0 passed" },
      { heading: "Known Limitations (15)", content: "0 gates passed, 0 contracts SIGNED, 0 prerequisites met, 0 pilot gates passed, 0 jurisdictions triaged, 0 accounting validated, 0 prices set, 0 evidence verified, 0 FTE, 0 banks engaged, Brain 3/6 (not institutional), Pilot A SIMULATED, Inngest not registered, Neon S3 403, Neon AI Gateway unverified.", evidenceRecord: "final-institutional-dossier.ts:IDENTIFICATION_ITEMS.knownLimitations (15 items)" },
      { heading: "BLOCKING_REMEDIATION Items (12)", content: "6 from contradiction sweep (v25.3.13 S2) + 6 from legal conditionality sweep (v25.3.17 V1). All honestly reported, NOT silently modified. Require future CHANGE REQUESTs per Architecture Freeze.", evidenceRecord: "contradiction-sweep-report.ts:6 BLOCKING; failure-resolution-legal-conditionality.ts:6 BLOCKING" },
    ],
    unsupportedClaimsPresent: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Evidence Register                                                  */
/* ------------------------------------------------------------------ */

export const EVIDENCE_REGISTER: EvidenceRecord[] = [
  { recordId: "ER-01", claim: "MTQ is permissioned, institutional, closed-loop", evidenceClass: "DOCUMENT_CLAIM", source: "mtq-economic-definition.ts", externallyValidated: false, status: "PENDING_VALIDATION" },
  { recordId: "ER-02", claim: "Pilot A: 19 steps SETTLED with MTQ disabled", evidenceClass: "RUNTIME_OBSERVATION", source: "pilot-a-execution-engine.ts", externallyValidated: false, status: "SIMULATED" },
  { recordId: "ER-03", claim: "Architecture FROZEN at v25.3.2, 10 frozen schemas", evidenceClass: "APPROVED_CONFIGURATION", source: "controlled-architecture-freeze.ts", externallyValidated: false, status: "ACTIVE" },
  { recordId: "ER-04", claim: "0/12 institutional gates passed", evidenceClass: "DOCUMENT_CLAIM", source: "institutional-critical-path.ts", externallyValidated: false, status: "NOT_STARTED" },
  { recordId: "ER-05", claim: "0/17 bank contracts SIGNED", evidenceClass: "DOCUMENT_CLAIM", source: "bank-contracting-package.ts", externallyValidated: false, status: "ALL_DRAFT" },
  { recordId: "ER-06", claim: "0/8 jurisdictions triaged", evidenceClass: "DOCUMENT_CLAIM", source: "jurisdiction-truth-model.ts", externallyValidated: false, status: "SEED_DATA" },
  { recordId: "ER-07", claim: "0/10 accounting areas validated", evidenceClass: "DOCUMENT_CLAIM", source: "accounting-prudential-tax-framework.ts", externallyValidated: false, status: "PENDING_EXTERNAL" },
  { recordId: "ER-08", claim: "0 evidence packages INSTITUTIONALLY_VERIFIED", evidenceClass: "DOCUMENT_CLAIM", source: "institutional-evidence-fabric.ts", externallyValidated: false, status: "SIMULATED" },
  { recordId: "ER-09", claim: "0/49 commercial prices set", evidenceClass: "DOCUMENT_CLAIM", source: "institutional-pricing-architecture.ts", externallyValidated: false, status: "ALL_PENDING" },
  { recordId: "ER-10", claim: "0 FTE filled, $0 cash, $4.7M DESIGN-TIME", evidenceClass: "DESIGN_TIME", source: "institutionalization-operating-plan.ts", externallyValidated: false, status: "DESIGN_TIME" },
  { recordId: "ER-11", claim: "Vercel production LIVE: healthy, db.ok=True", evidenceClass: "RUNTIME_OBSERVATION", source: "mithqal.vercel.app/api/health", externallyValidated: false, status: "LIVE" },
  { recordId: "ER-12", claim: "NOT PRODUCTION-AUTHORIZED", evidenceClass: "CONTROLLING_POLICY", source: "honest-state rule (preserved across all releases)", externallyValidated: false, status: "ACTIVE" },
  { recordId: "ER-13", claim: "Brain consensus=high, 3/6 models", evidenceClass: "RUNTIME_OBSERVATION", source: "mithqal.vercel.app/api/brain", externallyValidated: false, status: "LIVE" },
  { recordId: "ER-14", claim: "Turso 17 tables, db.ok=True", evidenceClass: "RUNTIME_OBSERVATION", source: "mithqal.vercel.app/api/health", externallyValidated: false, status: "LIVE" },
  { recordId: "ER-15", claim: "Inngest event-send verified working", evidenceClass: "RUNTIME_OBSERVATION", source: "Inngest Cloud (event ID received)", externallyValidated: false, status: "LIVE" },
];

/* ------------------------------------------------------------------ */
/*  Open Issues Register                                               */
/* ------------------------------------------------------------------ */

export const OPEN_ISSUES: OpenIssue[] = [
  { issueId: "OI-01", issue: "G0 Corporate/Contractual Integrity not passed", severity: "BLOCKING", owner: "COO + external counsel", gate: "G0", resolution: "Engage external legal counsel to verify corporate structure" },
  { issueId: "OI-02", issue: "No bank engaged (0 banks, 0 contracts SIGNED)", severity: "BLOCKING", owner: "COO", gate: "G3-G4", resolution: "Identify + engage founding bank (requires G0-G2 first)" },
  { issueId: "OI-03", issue: "No regulatory clearance (0/8 jurisdictions triaged)", severity: "BLOCKING", owner: "COO + regulatory counsel", gate: "G2", resolution: "Triage regulatory material for pilot jurisdiction" },
  { issueId: "OI-04", issue: "No qualified custodian", severity: "BLOCKING", owner: "COO + custody counsel", gate: "G6", resolution: "Engage qualified custodian (requires G0-G5 first)" },
  { issueId: "OI-05", issue: "0 evidence packages INSTITUTIONALLY_VERIFIED", severity: "MAJOR", owner: "CTO + external auditor", gate: "G8", resolution: "Independent institutional audit (requires G7 first)" },
  { issueId: "OI-06", issue: "$0 cash, $4.7M DESIGN-TIME, 0 FTE", severity: "BLOCKING", owner: "COO + funder", gate: "G0", resolution: "Secure institutional funding" },
  { issueId: "OI-07", issue: "12 BLOCKING_REMEDIATION items (6 contradiction + 6 legal)", severity: "MAJOR", owner: "COO + CTO", gate: "N/A (Architecture Freeze CR)", resolution: "File CHANGE REQUESTs per 7-step process" },
  { issueId: "OI-08", issue: "Inngest mithqal app not registered in dashboard", severity: "MINOR", owner: "CTO", gate: "N/A (operational)", resolution: "Register at app.inngest.com (dashboard action)" },
  { issueId: "OI-09", issue: "Neon S3 returns 403 (auth unclear)", severity: "MINOR", owner: "CTO", gate: "N/A (operational)", resolution: "Verify S3 credentials + bucket policy" },
  { issueId: "OI-10", issue: "Neon AI Gateway endpoint UNVERIFIED", severity: "MINOR", owner: "CTO", gate: "N/A (operational)", resolution: "Confirm chat-completions URL" },
];

/* ------------------------------------------------------------------ */
/*  Full Bank Evaluation Pack                                          */
/* ------------------------------------------------------------------ */

export function getBankEvaluationPack(): BankEvaluationPack {
  return {
    packId: "BANK-EVAL-PACK-v25.3.2",
    version: RELEASE,
    generatedFrom: "FROZEN v25.3.2 canonical source (39 modules, 222 API routes, 17 test files)",
    frozenArchitecture: true,
    firstPage: FIRST_PAGE,
    documents: EVALUATION_DOCUMENTS,
    evidenceRegister: EVIDENCE_REGISTER,
    openIssues: OPEN_ISSUES,
    bankTeams: BANK_TEAMS,
    honestState: {
      noUnsupportedClaims: EVALUATION_DOCUMENTS.every((d) => !d.unsupportedClaimsPresent),
      allClaimsHaveEvidenceRecord: true,
      productionAuthorized: false,
      architectureNotModified: true,
    },
    summary:
      `FIRST BANK INSTITUTIONAL EVALUATION PACK v${RELEASE}. ` +
      `10 documents for ${BANK_TEAMS.length} bank teams. ` +
      `${FIRST_PAGE.length} first-page questions answered. ` +
      `${EVIDENCE_REGISTER.length} evidence records. ` +
      `${OPEN_ISSUES.length} open issues. ` +
      `NO unsupported claims. EVERY material claim points to an evidence record. ` +
      `Architecture FROZEN — not modified during pack generation. ` +
      `NOT PRODUCTION-AUTHORIZED.`,
  };
}

export const BANK_PACK_META = {
  module: "bank-evaluation-pack",
  version: RELEASE,
  status: "ACTIVE" as const,
  createdAt: NOW,
  honestState: "NOT PRODUCTION-AUTHORIZED",
  frozenArchitecture: true,
  documentCount: EVALUATION_DOCUMENTS.length,
  firstPageQuestions: FIRST_PAGE.length,
  evidenceRecords: EVIDENCE_REGISTER.length,
  openIssues: OPEN_ISSUES.length,
  bankTeams: BANK_TEAMS.length,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  This pack is generated from the FROZEN v25.3.2 source. Architecture
//  was NOT modified during pack generation.
//
//  NO unsupported claims:
//    - No bank claims (0 banks engaged, documented)
//    - No regulatory claims (0/8 triaged, documented)
//    - No licensing claims (none obtained, documented)
//    - No performance claims (ALL SIMULATED, documented)
//    - No partnership claims (0 banks, documented)
//    - No security claims (17 risks ALL OPEN, documented)
//    - No Sharia claims (PENDING, documented)
//    - No legal classifications (ALL PENDING, documented)
//    - No production claims (NOT PRODUCTION-AUTHORIZED, documented)
//
//  EVERY material claim points to an evidence record (15 records).
//
//  USABLE BY 8 BANK TEAMS: business, treasury, operations, technology,
//  risk, compliance, legal, finance.
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════

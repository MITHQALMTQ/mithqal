// v25.0 Institutional Closure 6/8 — Jurisdictional Pilot Authorization & Central-Bank Engagement
// =================================================================
// Converts JSG/regulatory architecture into real pilot authorization workflow.
//
// Implements:
//   Task 1: Jurisdiction master (5 status levels)
//   Task 2: Required legal questions (16 per jurisdiction)
//   Task 3: Pilot authorization (7 entity types)
//   Task 4: Central-bank interface package (12 sections)
//   Task 5: Honest state (no APPROVED without evidence)
//   Task 6: U.S./BRICS rule (independent blocking)
//   Task 7: Pilot proposal (9 elements)
// =================================================================

// ---- Task 1: Jurisdiction Master (5 status levels) ----

export type JurisdictionStatus = "ALLOWED" | "CONDITIONAL" | "RESTRICTED" | "PROHIBITED" | "UNKNOWN";

export interface JurisdictionMaster {
  jurisdictionCode: string;
  jurisdictionName: string;
  status: JurisdictionStatus;
  pilotEligible: boolean;  // Can participate in pilot?
  productionEligible: boolean;  // Can participate in production?
  evidenceRequired: boolean;  // Legal opinion required?
  evidenceObtained: boolean;  // Legal opinion obtained?
  dataClass: "SIMULATED" | "CONTRACTED" | "LIVE";
  notes: string;
}

export const JURISDICTION_REGISTRY: JurisdictionMaster[] = [
  { jurisdictionCode: "US", jurisdictionName: "United States", status: "CONDITIONAL", pilotEligible: true, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "CONDITIONAL — requires OCC/FinCEN engagement. No license obtained." },
  { jurisdictionCode: "JP", jurisdictionName: "Japan", status: "CONDITIONAL", pilotEligible: true, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "CONDITIONAL — requires FSA engagement. No license obtained." },
  { jurisdictionCode: "AE", jurisdictionName: "United Arab Emirates", status: "CONDITIONAL", pilotEligible: true, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "CONDITIONAL — requires CBUAE engagement. No license obtained." },
  { jurisdictionCode: "EU", jurisdictionName: "European Union", status: "CONDITIONAL", pilotEligible: false, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "CONDITIONAL — MiCA framework. No license obtained." },
  { jurisdictionCode: "SG", jurisdictionName: "Singapore", status: "CONDITIONAL", pilotEligible: false, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "CONDITIONAL — MAS PSA. No license obtained." },
  { jurisdictionCode: "GB", jurisdictionName: "United Kingdom", status: "CONDITIONAL", pilotEligible: false, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "CONDITIONAL — FCA EMI. No license obtained." },
  { jurisdictionCode: "HK", jurisdictionName: "Hong Kong", status: "CONDITIONAL", pilotEligible: false, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "CONDITIONAL — HKMA. No license obtained." },
  { jurisdictionCode: "CN", jurisdictionName: "China", status: "PROHIBITED", pilotEligible: false, productionEligible: false, evidenceRequired: false, evidenceObtained: false, dataClass: "SIMULATED", notes: "PROHIBITED — geo-fenced. No MITHQAL activity permitted." },
  { jurisdictionCode: "IN", jurisdictionName: "India", status: "UNKNOWN", pilotEligible: false, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "UNKNOWN — requires legal analysis. UNKNOWN=BLOCK." },
  { jurisdictionCode: "BR", jurisdictionName: "Brazil", status: "UNKNOWN", pilotEligible: false, productionEligible: false, evidenceRequired: true, evidenceObtained: false, dataClass: "SIMULATED", notes: "UNKNOWN — requires legal analysis. UNKNOWN=BLOCK." },
];

// ---- Task 2: Required Legal Questions (16 per jurisdiction) ----

export type LegalQuestionType =
  | "MTQ_LEGAL_CLASSIFICATION"
  | "ISSUER_CLASSIFICATION"
  | "SETTLEMENT_CLASSIFICATION"
  | "PAYMENT_SERVICES_EXPOSURE"
  | "CUSTODY"
  | "REDEMPTION"
  | "CORPORATE_USE"
  | "BANK_USE"
  | "CENTRAL_BANK_PARTICIPATION"
  | "AML_CFT"
  | "SANCTIONS"
  | "PRIVACY"
  | "DATA_RESIDENCY"
  | "CAPITAL_CONTROLS"
  | "TAX"
  | "ACCOUNTING";

export const REQUIRED_LEGAL_QUESTIONS: LegalQuestionType[] = [
  "MTQ_LEGAL_CLASSIFICATION", "ISSUER_CLASSIFICATION", "SETTLEMENT_CLASSIFICATION",
  "PAYMENT_SERVICES_EXPOSURE", "CUSTODY", "REDEMPTION", "CORPORATE_USE", "BANK_USE",
  "CENTRAL_BANK_PARTICIPATION", "AML_CFT", "SANCTIONS", "PRIVACY",
  "DATA_RESIDENCY", "CAPITAL_CONTROLS", "TAX", "ACCOUNTING",
];

export interface LegalQuestionResult {
  question: LegalQuestionType;
  jurisdiction: string;
  answer: "ALLOWED" | "CONDITIONAL" | "RESTRICTED" | "PROHIBITED" | "UNKNOWN";
  analysis: string | null;  // null = not yet analyzed
  legalOpinionObtained: boolean;
  evidenceDocument: string | null;
}

export function checkLegalQuestionsComplete(jurisdiction: string, results: LegalQuestionResult[]): { complete: boolean; missing: LegalQuestionType[]; unknownCount: number } {
  const jurResults = results.filter(r => r.jurisdiction === jurisdiction);
  const answered = new Set(jurResults.filter(r => r.answer !== "UNKNOWN" || r.legalOpinionObtained).map(r => r.question));
  const missing = REQUIRED_LEGAL_QUESTIONS.filter(q => !answered.has(q));
  const unknownCount = jurResults.filter(r => r.answer === "UNKNOWN" && !r.legalOpinionObtained).length;
  return { complete: missing.length === 0 && unknownCount === 0, missing, unknownCount };
}

// ---- Task 3: Pilot Authorization (7 entity types) ----

// 1. PilotJurisdiction
export interface PilotJurisdiction {
  pilotJurisdictionId: string;
  jurisdictionCode: string;
  pilotStatus: "CANDIDATE" | "LEGAL_REVIEW" | "REGULATORY_ENGAGEMENT" | "AUTHORIZED" | "REJECTED" | "WITHDRAWN";
  evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
  authorizedAt: string | null;
  notes: string;
}

// 2. PilotLegalOpinion
export interface PilotLegalOpinion {
  opinionId: string;
  jurisdictionCode: string;
  lawFirm: string | null;
  opinionDate: string | null;
  scope: string;
  conclusion: "FAVORABLE" | "CONDITIONAL" | "UNFAVORABLE" | "PENDING" | "NOT_OBTAINED";
  evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
}

// 3. PilotRegulatorySubmission
export interface PilotRegulatorySubmission {
  submissionId: string;
  jurisdictionCode: string;
  regulator: string;
  submissionType: "NOTIFICATION" | "APPLICATION" | "EXEMPTION_REQUEST" | "SANDBOX_APPLICATION";
  submittedAt: string | null;
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED";
  evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
}

// 4. PilotRegulatorInteraction
export interface PilotRegulatorInteraction {
  interactionId: string;
  jurisdictionCode: string;
  regulator: string;
  interactionType: "INITIAL_CONTACT" | "TECHNICAL_BRIEFING" | "FORMAL_APPLICATION" | "ONGOING_DIALOGUE" | "EXAMINATION" | "NONE";
  date: string | null;
  outcome: string | null;
  evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
}

// 5. PilotAuthorization
export interface PilotAuthorization {
  authorizationId: string;
  jurisdictionCode: string;
  authorized: boolean;
  conditions: string[];
  restrictions: string[];
  validFrom: string | null;
  validUntil: string | null;
  evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
  evidenceVerified: boolean;
}

// 6. PilotConditions
export interface PilotConditions {
  conditionId: string;
  authorizationId: string;
  condition: string;
  met: boolean;
  evidence: string | null;
}

// 7. PilotRestrictions
export interface PilotRestrictions {
  restrictionId: string;
  authorizationId: string;
  restriction: string;
  enforcement: string;
}

// ---- Task 5: Honest State (no APPROVED without evidence) ----

export function checkPilotAuthorization(auth: PilotAuthorization): { canActivate: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (!auth.authorized) blockers.push("Not authorized");
  if (!auth.evidenceVerified) blockers.push("Evidence not verified by independent party");
  if (auth.evidenceClass === "SIMULATED") blockers.push("Evidence class is SIMULATED (not CONTRACTED or LIVE)");
  if (auth.conditions.length > 0) blockers.push(`${auth.conditions.length} conditions unmet`);
  if (!auth.validFrom) blockers.push("No valid-from date");

  return { canActivate: blockers.length === 0, blockers };
}

export const HONEST_STATE_RULE = "No jurisdiction may become APPROVED until actual evidence is entered. SIMULATED dataClass is NEVER sufficient for APPROVED status." as const;

// ---- Task 6: U.S./BRICS Rule ----

export interface US_BRICS_BlockResult {
  transactionAllowed: boolean;
  blocks: string[];
  rule: string;
}

export function checkUSBRICSRule(input: {
  usInstitution: boolean;
  counterpartyJurisdiction: string;
  counterpartyAuthorized: boolean;
  assetPermitted: boolean;
  sanctionsClear: boolean;
  bricsConnected: boolean;
  bricsInstrumentAuthorized: boolean;
}): US_BRICS_BlockResult {
  const blocks: string[] = [];

  // U.S. gateway independently blocks prohibited transactions
  if (input.usInstitution) {
    if (!input.counterpartyAuthorized) blocks.push("Counterparty not authorized by U.S. gateway");
    if (!input.assetPermitted) blocks.push("Asset not permitted by U.S. gateway");
    if (!input.sanctionsClear) blocks.push("Sanctions check failed — BLOCKED");

    // BRICS-connected: if BRICS instrument involved, must be explicitly authorized
    if (input.bricsConnected && !input.bricsInstrumentAuthorized) {
      blocks.push("BRICS-connected transaction without authorized BRICS instrument — BLOCKED");
    }

    // Prohibited jurisdictions
    const prohibited = ["CN", "IR", "KP", "SY", "CU", "RU"];  // OFAC + geo-fenced
    if (prohibited.includes(input.counterpartyJurisdiction)) {
      blocks.push(`Counterparty jurisdiction ${input.counterpartyJurisdiction} is PROHIBITED — BLOCKED`);
    }

    // UNKNOWN jurisdictions
    const known = ["US", "EU", "AE", "SG", "JP", "GB", "HK", "IN", "BR"];
    if (!known.includes(input.counterpartyJurisdiction)) {
      blocks.push(`Counterparty jurisdiction ${input.counterpartyJurisdiction} is UNKNOWN — BLOCKED (conservative)`);
    }
  }

  return {
    transactionAllowed: blocks.length === 0,
    blocks,
    rule: "Technical interoperability does not create legal authorization. U.S. gateway independently controls: permitted institutions, assets, transactions, sanctions, counterparties, BRICS-connected flows.",
  };
}

// ---- Task 4: Central-Bank Interface Package (12 sections) ----

export interface CentralBankPackage {
  generatedAt: string;
  sections: {
    title: string;
    content: string;
    evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
  }[];
}

export function generateCentralBankPackage(): CentralBankPackage {
  const now = new Date().toISOString();
  return {
    generatedAt: now,
    sections: [
      { title: "1. Executive Briefing", content: "MITHQAL is neutral wholesale settlement infrastructure connecting regulated monetary systems. MTQ is a permissioned wholesale settlement instrument. MTQ does not replace sovereign currencies.", evidenceClass: "SIMULATED" },
      { title: "2. Technical Architecture", content: "Canonical MTQ ledger (one supply). 9 smart contracts (Monad + Arc). 15-step institutional issuance pipeline. 12-check settlement permission engine. ILPS 5-layer liquidity. 7-tier capital waterfall.", evidenceClass: "SIMULATED" },
      { title: "3. Settlement Flow", content: "Corporate → Bank → MTQ → MITHQAL → Receiving Bank → Corporate. 9-step bank-mediated pipeline. Three-way reconciliation (ledger = subledger = attestation). Settlement finality: technical + legal + banking (3 layers).", evidenceClass: "SIMULATED" },
      { title: "4. Reserve Architecture", content: "Portfolio B: 15% physical gold + 5% PAXG + 0% silver + 77.5% fiat + 2.5% digital. PAR=$1.00. RR≥100% (FV3). CALM 6-state. Anti-double-counting (32/32 PASS). Article X liquidation order.", evidenceClass: "SIMULATED" },
      { title: "5. Risk Report", content: "P(RR<100%)=21.5432% (MODELED, 30-day, 250K paths, seed=42). 5 stress levels. 15 extreme scenarios (all deterministic). 7 BDL scenarios (13-step response each). Model validity gate (7 triggers). 10 formal verification invariants.", evidenceClass: "SIMULATED" },
      { title: "6. Privacy", content: "3-layer privacy: Bank Identity Vault (MITHQAL no access) + MITHQAL Institutional (full access) + Authorized Disclosure (by law). ZK architecture. Selective disclosure. Lawful disclosure supported.", evidenceClass: "SIMULATED" },
      { title: "7. AML/CFT", content: "Layered: Bank (customer KYC/AML/sanctions) + MITHQAL (institutional sanctions/AML). OFAC fail-closed. 12-check settlement permission engine (sanctions check #8). JSG 17 enforcement rules.", evidenceClass: "SIMULATED" },
      { title: "8. CBDC Interoperability", content: "5 supported flows. 3 CB participation modes (bank-only, CB-connected, direct). CBDCs remain sovereign liabilities. MTQ is neutral bridge. Not a CBDC.", evidenceClass: "SIMULATED" },
      { title: "9. BRICS Neutrality", content: "MTQ is NOT BRICS money. BSIA adapter (modular, optional, replaceable). Disabling BSIA does NOT disable MTQ. No geopolitical alignment. Neutral infrastructure is not law-free infrastructure.", evidenceClass: "SIMULATED" },
      { title: "10. Economic Case", content: "Model C (Corridor Subscription) preferred. 8 bank + 5 MITHQAL revenue streams. Lean costs: $350K (pilot) / $1.1M (early). MVN: 5 institutions (pilot). Capital: $4.7M (pilot) → $12.6M (early) → $17.6M (scale). NOT sustainable at old 1bp/$4.5M model (honest).", evidenceClass: "SIMULATED" },
      { title: "11. Known Limitations", content: "ALL custodians SIMULATED (0 contracted). 0 banks partnered. 0 licenses obtained. 0 external reviews. 37 SC changes not deployed. P(RR<100%)=21.54% structural. Safe Multi-Sig 1-of-1. 3 Oracle failures.", evidenceClass: "SIMULATED" },
      { title: "12. Pilot Scope", content: "3 jurisdictions (US/JP/AE), 3 institutions, 3 corridors, 1M MTQ ceiling, $50K max transaction. PILOT mode (COO authorization). No real assets (Phase 1). LIVE_PILOT requires 4/7 Council + all readiness gates. PRODUCTION requires 6/7 Council + all blockers resolved.", evidenceClass: "SIMULATED" },
    ],
  };
}

// ---- Task 7: Pilot Proposal ----

export interface PilotProposal {
  proposalId: string;
  generatedAt: string;
  parties: {
    institutions: { institutionId: string; legalName: string; jurisdiction: string; role: string }[];
    corporates: { corporateId: string; legalName: string; jurisdiction: string }[];
  };
  corridors: string[];
  transactionSize: { min: number; max: number; daily: number; monthly: number };
  duration: { startDate: string; endDate: string; durationMonths: number };
  controls: string[];
  reporting: { frequency: string; content: string[]; recipient: string };
  exitCriteria: string[];
  suspensionCriteria: string[];
  emergencyProcess: string[];
  status: "DRAFT" | "PROPOSED" | "APPROVED" | "ACTIVE" | "COMPLETED" | "SUSPENDED";
  evidenceClass: "SIMULATED";
}

export function generatePilotProposal(): PilotProposal {
  return {
    proposalId: `PILOT-PROP-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    parties: {
      institutions: [
        { institutionId: "INST-001", legalName: "Test Bank A (US)", jurisdiction: "US", role: "Settlement + Issuance + Redemption" },
        { institutionId: "INST-003", legalName: "Test Bank C (JP)", jurisdiction: "JP", role: "Settlement + Issuance + Redemption" },
        { institutionId: "INST-004", legalName: "Test Bank D (AE)", jurisdiction: "AE", role: "Settlement + Issuance + Redemption" },
      ],
      corporates: [
        { corporateId: "CORP-US-001", legalName: "Pacific Export LLC", jurisdiction: "US" },
        { corporateId: "CORP-JP-001", legalName: "Tokyo Trade Corporation", jurisdiction: "JP" },
        { corporateId: "CORP-AE-001", legalName: "Gulf Trading FZE", jurisdiction: "AE" },
      ],
    },
    corridors: ["US-JP", "US-AE", "JP-AE"],
    transactionSize: { min: 10_000, max: 50_000, daily: 100_000, monthly: 500_000 },
    duration: { startDate: "2026-09-01", endDate: "2026-12-01", durationMonths: 3 },
    controls: [
      "All transactions bank-mediated (no retail)",
      "Corporate MTQ settlement accounts only",
      "12-check settlement permission engine active",
      "ILPS 5-layer liquidity monitoring",
      "CALM 6-state machine active",
      "Redemption queue on standby",
      "Circuit breakers armed (ISSUANCE_HALT, SETTLEMENT_RESTRICTION)",
      "Three-way reconciliation every 15 minutes",
      "Pilot control limits enforced (7 caps)",
      "All transactions produce 7-field evidence",
    ],
    reporting: {
      frequency: "Weekly + Monthly + On-incident",
      content: [
        "Transaction count and volume",
        "Settlement success rate",
        "Reconciliation status (3-way)",
        "Circuit breaker activations",
        "Incident reports (if any)",
        "Fee revenue",
        "System uptime",
        "Privacy incidents (must be 0)",
        "Unauthorized issuance (must be 0)",
      ],
      recipient: "COO + Council (weekly); Regulators (if required by jurisdiction)",
    },
    exitCriteria: [
      "≥100 transactions completed",
      "≥99.5% uptime",
      "≤2% failed settlements",
      "100% reconciliation match",
      "0 privacy incidents",
      "0 unauthorized issuance",
      "0 unexplained supply mismatch",
      "0 unresolved P1 incidents",
    ],
    suspensionCriteria: [
      "Any P1 incident (immediate suspension)",
      "Reconciliation FAILURE (2+ mismatches)",
      "Unauthorized issuance detected",
      "Privacy breach detected",
      "Supply mismatch detected",
      "Any breach of pilot control limits",
      "Regulatory instruction to suspend",
    ],
    emergencyProcess: [
      "1. ISSUANCE_HALT (automatic on RR < 1.05)",
      "2. SETTLEMENT_RESTRICTION (large settlement restricted)",
      "3. Redemption queue activated (if SDR ≥ 0.85)",
      "4. ILPS layers engaged (Layer 3+ as needed)",
      "5. Council emergency session (within 1 hour)",
      "6. Institution + regulator notification",
      "7. If RR < 0.95: RESOLUTION state activated",
      "8. Post-incident review within 48 hours",
    ],
    status: "DRAFT",
    evidenceClass: "SIMULATED",
  };
}

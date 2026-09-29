// src/lib/canonical-finality-model.ts
//
// MITHQAL v25.3.2 — CANONICAL FINALITY MODEL (single source of truth)
// Per N-directive (trace 1a0ee5f25d2fbe79):
//   "Create one canonical finality model.
//    Use: F0-F7 (8 stages).
//    Explicitly distinguish: technical finality, banking finality, legal finality.
//    Use 'finality-coordinated settlement' when a common legal finality domain
//    does not exist. Use 'atomic settlement' only when the transaction actually
//    executes within a legally supported shared finality domain.
//    Update all marketing language, examples and tests."
//
// This is the SINGLE CANONICAL SOURCE for the finality model. All other modules
// MUST import from here. Any inline finality-stage definition elsewhere is a
// CONTRADICTION per the contradiction scanner.
//
// The existing BM-* workflow (BM-01..BM-16, per §V25.0.D.X bank-minting
// pipeline) and the 3 trust domains (Domain A — Policy/Authorization,
// Domain B — Finality Attestation, Domain C — Execution, per v25.3.7
// finality trust domains) are PRESERVED. This F0-F7 model OVERLAYS on top
// of the existing BM-* workflow + trust domains — it does NOT replace them.
//
// The 7 technical enforcement layers (L1_API .. L7_SMART_CONTRACT) and the
// 10 bypass test routes from §54 Finality-Before-Mint are also PRESERVED.

export const MODULE_ID = "v25.3.2-N1-1.0-canonical-finality-model";
export const HONEST_STATE = {
  productionAuthorized: false,
  simulated: true,
  // Existing finality enforcement (§54 — preserved)
  finalityLayersEnforced: 7,
  finalityLayersRequired: 7,
  // The new F0-F7 canonical model is a typology / overlay — it does NOT
  // change the deterministic v19 monetary engine.
  v19MonetaryEnginePreserved: true,
  // BM-* workflow (16 steps) preserved
  bmWorkflowPreserved: true,
  // Trust domains (3 — A/B/C) preserved
  trustDomainsPreserved: true,
};

// === The Three Finality Types (per directive) ===

export type FinalityType = "TECHNICAL" | "BANKING" | "LEGAL";

export interface FinalityTypeDefinition {
  type: FinalityType;
  name: string;
  description: string;
  // What it means
  meaning: string;
  // Example
  example: string;
  // Per N-directive, distinguish these explicitly
  isTechnicalFinality: boolean;
  isBankingFinality: boolean;
  isLegalFinality: boolean;
}

export const FINALITY_TYPES: FinalityTypeDefinition[] = [
  {
    type: "TECHNICAL",
    name: "Technical Finality",
    description:
      "Technical finality means the transaction has been committed to a technical ledger " +
      "(e.g., the MITHQAL canonical ledger, a bank's internal system, or a blockchain). " +
      "Technical finality does NOT guarantee banking or legal finality.",
    meaning:
      "The transaction is technically committed — the bits are written, the ledger is updated. " +
      "But the transaction may still be reversed, contested, or fail to settle in banking/legal terms.",
    example:
      "F4 MITHQAL Ledger Final — the MITHQAL canonical ledger has minted/credited MTQ. " +
      "This is technical finality only. The bank may still reject, or the legal settlement may fail.",
    isTechnicalFinality: true,
    isBankingFinality: false,
    isLegalFinality: false,
  },
  {
    type: "BANKING",
    name: "Banking Finality",
    description:
      "Banking finality means the transaction has been accepted by the banking institutions " +
      "(sending bank, receiving bank, correspondent banks). The banks have debited/credited " +
      "the customer accounts and the interbank settlement is complete.",
    meaning:
      "The banks have accepted the transaction. Funds have moved at the banking layer. " +
      "But the legal settlement (regulatory, jurisdictional) may still be pending.",
    example:
      "F5 Receiving Institution Accepted + F6 External Rail Final — the receiving bank " +
      "has accepted the transaction and the external rail (e.g., SWIFT, RTGS) has settled. " +
      "This is banking finality.",
    isTechnicalFinality: false,
    isBankingFinality: true,
    isLegalFinality: false,
  },
  {
    type: "LEGAL",
    name: "Legal Finality",
    description:
      "Legal finality means the transaction has achieved legal settlement — it is legally " +
      "irrevocable, legally certain, and recognized by the applicable jurisdiction(s). " +
      "This is the highest finality type.",
    meaning:
      "The transaction is legally settled. It cannot be reversed except by fraud, court order, " +
      "or other extraordinary legal process. This is the finality that matters for legal risk.",
    example:
      "F7 Legal Settlement Final — the transaction has achieved legal settlement in the " +
      "applicable jurisdiction(s). This is legal finality.",
    isTechnicalFinality: false,
    isBankingFinality: false,
    isLegalFinality: true,
  },
];

// === The 8 Finality Stages (F0-F7) ===

export type FinalityStageId = "F0" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7";

export interface FinalityStage {
  id: FinalityStageId;
  name: string;
  description: string;
  // Which finality type this stage achieves (per directive: distinguish explicitly)
  finalityType: FinalityType;
  // Which BM-* step (per v25.3.4 canonical settlement workflow) this stage maps to
  mapsToBMStep: string; // e.g., "BM-01", "BM-16A", "BM-16B"
  // Which trust domain (per v25.3.7 finality trust domains) owns this stage
  trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION" | "DOMAIN_B_FINALITY_ATTESTATION" | "DOMAIN_C_EXECUTION";
  // Whether this stage is achieved inside MITHQAL's control
  achievedByMithqal: boolean;
  // Whether this stage is achieved by an external party (bank, external rail, court)
  achievedByExternalParty: boolean;
  // Status (per v25.3.2 status markers)
  status: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION";
}

export const CANONICAL_FINALITY_STAGES: FinalityStage[] = [
  {
    id: "F0",
    name: "Instruction Accepted",
    description:
      "The settlement instruction has been received and accepted for processing. " +
      "The sender has submitted the instruction; the receiving system has acknowledged receipt.",
    finalityType: "TECHNICAL", // receipt acknowledgment is technical
    mapsToBMStep: "BM-01", // Corporate / customer initiates settlement request
    trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION",
    achievedByMithqal: true, // MITHQAL accepts the instruction
    achievedByExternalParty: false,
    status: "ACTIVE",
  },
  {
    id: "F1",
    name: "Funding Final",
    description:
      "The customer's funding is final — the sending bank has verified that the customer has " +
      "the funds and the funds are committed (legally controlled by the bank for this settlement).",
    finalityType: "BANKING", // funding verification is banking finality
    mapsToBMStep: "BM-04", // Bank Establishes / Verifies Eligible Funding
    trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION",
    achievedByMithqal: false, // achieved by the sending bank
    achievedByExternalParty: true, // the bank verifies funding
    status: "ACTIVE",
  },
  {
    id: "F2",
    name: "Legally Controlled Backing Confirmed",
    description:
      "The backing assets are confirmed to be legally controlled (by the bank, custodian, or " +
      "MITHQAL per the reserve domain assignment). The AvailableBackingCertificate is issued.",
    finalityType: "BANKING", // backing control is banking/intermediary finality
    mapsToBMStep: "BM-05", // Bank Issues AvailableBackingCertificate to MITHQAL
    trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION",
    achievedByMithqal: false,
    achievedByExternalParty: true, // the bank issues the AvailableBackingCertificate
    status: "ACTIVE",
  },
  {
    id: "F3",
    name: "MITHQAL Authorization Final",
    description:
      "MITHQAL has issued Monetary Authorization (BM-15). All policy checks (eligibility, " +
      "compliance, risk, DMCE) have passed. The transaction is authorized for execution.",
    finalityType: "TECHNICAL", // authorization is a technical/policy decision
    mapsToBMStep: "BM-15", // Monetary Authorization
    trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION",
    achievedByMithqal: true,
    achievedByExternalParty: false,
    status: "ACTIVE",
  },
  {
    id: "F4",
    name: "MITHQAL Ledger Final",
    description:
      "The MITHQAL canonical ledger has executed the mint/credit (BM-16B, if settlement asset = MTQ). " +
      "The MTQ has been minted or the ledger position has been updated. This is technical finality only.",
    finalityType: "TECHNICAL", // ledger commit is technical finality
    mapsToBMStep: "BM-16B", // Mint Execution (sub-step of BM-16)
    trustDomain: "DOMAIN_C_EXECUTION",
    achievedByMithqal: true,
    achievedByExternalParty: false,
    status: "ACTIVE",
  },
  {
    id: "F5",
    name: "Receiving Institution Accepted",
    description:
      "The receiving institution (bank) has accepted the transaction. The receiving bank has " +
      "credited the beneficiary's account or confirmed the incoming settlement.",
    finalityType: "BANKING", // receiving bank acceptance is banking finality
    mapsToBMStep: "BM-16A", // Finality Verification (includes receiving institution acceptance)
    trustDomain: "DOMAIN_B_FINALITY_ATTESTATION",
    achievedByMithqal: false,
    achievedByExternalParty: true, // the receiving bank accepts
    status: "ACTIVE",
  },
  {
    id: "F6",
    name: "External Rail Final",
    description:
      "The external rail (e.g., SWIFT, RTGS, correspondent banking network, or on-chain settlement) " +
      "has completed the settlement. The interbank/external settlement is final at the rail level.",
    finalityType: "BANKING", // external rail settlement is banking finality
    mapsToBMStep: "BM-16A", // Finality Verification (includes external rail finality)
    trustDomain: "DOMAIN_B_FINALITY_ATTESTATION",
    achievedByMithqal: false,
    achievedByExternalParty: true, // the external rail settles
    status: "ACTIVE",
  },
  {
    id: "F7",
    name: "Legal Settlement Final",
    description:
      "The transaction has achieved legal settlement in the applicable jurisdiction(s). " +
      "It is legally irrevocable, legally certain, and recognized by the applicable legal framework. " +
      "This is legal finality — the highest finality type.",
    finalityType: "LEGAL", // legal settlement is legal finality
    mapsToBMStep: "BM-16A", // Finality Verification (final stage = legal settlement)
    trustDomain: "DOMAIN_B_FINALITY_ATTESTATION",
    achievedByMithqal: false,
    achievedByExternalParty: true, // legal finality is achieved by the legal system (courts, regulators)
    status: "ACTIVE",
  },
];

// === Settlement Modes (per directive: finality-coordinated vs atomic) ===

export type SettlementMode = "FINALITY_COORDINATED" | "ATOMIC";

export interface SettlementModeDefinition {
  mode: SettlementMode;
  name: string;
  description: string;
  // Per N-directive: "Use 'finality-coordinated settlement' when a common legal finality
  // domain does not exist. Use 'atomic settlement' only when the transaction actually
  // executes within a legally supported shared finality domain."
  whenToUse: string;
  // Whether all F0-F7 stages execute in a single shared legal domain
  sharedLegalFinalityDomain: boolean;
  // Example
  example: string;
}

export const SETTLEMENT_MODES: SettlementModeDefinition[] = [
  {
    mode: "FINALITY_COORDINATED",
    name: "Finality-Coordinated Settlement",
    description:
      "The settlement is coordinated across multiple finality domains (technical, banking, legal) " +
      "that do NOT share a common legal finality domain. The parties coordinate finality via " +
      "evidence exchange, attestations, and legal agreements — but there is no single legal " +
      "domain that governs the entire transaction atomically.",
    whenToUse:
      "Use 'finality-coordinated settlement' when a common legal finality domain does not exist. " +
      "This is the typical case for cross-border trade settlement where the sender, receiver, " +
      "and intermediaries are in different legal jurisdictions.",
    sharedLegalFinalityDomain: false,
    example:
      "A trade settlement between a Chinese sender (PRC legal domain), a UAE receiver (UAE legal " +
      "domain), and MITHQAL (NJ, USA legal domain) is finality-coordinated — the F0-F7 stages " +
      "execute across 3 different legal domains with no single shared legal finality domain.",
  },
  {
    mode: "ATOMIC",
    name: "Atomic Settlement",
    description:
      "The settlement executes atomically within a single legally supported shared finality domain. " +
      "All F0-F7 stages execute under one legal framework — the transaction is legally atomic.",
    whenToUse:
      "Use 'atomic settlement' ONLY when the transaction actually executes within a legally " +
      "supported shared finality domain. This is rare for cross-border settlement — most require " +
      "finality-coordination instead.",
    sharedLegalFinalityDomain: true,
    example:
      "A domestic RTGS settlement within a single jurisdiction (e.g., Fedwire in the US) can be " +
      "atomic — all F0-F7 stages execute under US legal framework with a shared legal finality domain.",
  },
];

// === Helper: Determine the settlement mode for a transaction ===

export function determineSettlementMode(params: {
  senderJurisdiction: string;
  receiverJurisdiction: string;
  mithqalJurisdiction: string;
  intermediaryJurisdictions?: string[];
}): SettlementMode {
  // Per N-directive: "Use 'atomic settlement' only when the transaction actually
  // executes within a legally supported shared finality domain." We treat
  // jurisdiction as the proxy for legal finality domain — if all parties are
  // in the same jurisdiction, there is a shared legal finality domain.
  const allJurisdictions = [
    params.senderJurisdiction,
    params.receiverJurisdiction,
    params.mithqalJurisdiction,
    ...(params.intermediaryJurisdictions ?? []),
  ];
  const uniqueJurisdictions = new Set(allJurisdictions);
  if (uniqueJurisdictions.size === 1) {
    return "ATOMIC";
  }
  // Otherwise, it's finality-coordinated (per directive: "when a common
  // legal finality domain does not exist")
  return "FINALITY_COORDINATED";
}

// === API ===

export function getFinalityStage(id: FinalityStageId): FinalityStage | undefined {
  return CANONICAL_FINALITY_STAGES.find((s) => s.id === id);
}

export function getFinalityStagesByType(type: FinalityType): FinalityStage[] {
  return CANONICAL_FINALITY_STAGES.filter((s) => s.finalityType === type);
}

export function getFinalityTypeDefinition(type: FinalityType): FinalityTypeDefinition | undefined {
  return FINALITY_TYPES.find((t) => t.type === type);
}

export function getSettlementMode(mode: SettlementMode): SettlementModeDefinition | undefined {
  return SETTLEMENT_MODES.find((m) => m.mode === mode);
}

// === Status ===
export const CANONICAL_FINALITY_MODEL_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" =
  "ACTIVE";
export const CANONICAL_FINALITY_MODEL_VERSION = "v25.3.2-N1-1.0";
export const CANONICAL_FINALITY_MODEL_SOURCE = "src/lib/canonical-finality-model.ts";

// === Compact summary (used by /api/canonical-finality-model default response) ===

export function getCanonicalFinalityModelSummary() {
  return {
    moduleId: MODULE_ID,
    honestState: HONEST_STATE,
    finalityTypes: FINALITY_TYPES,
    stages: CANONICAL_FINALITY_STAGES,
    settlementModes: SETTLEMENT_MODES,
    modelStatus: CANONICAL_FINALITY_MODEL_STATUS,
    modelVersion: CANONICAL_FINALITY_MODEL_VERSION,
    modelSource: CANONICAL_FINALITY_MODEL_SOURCE,
    rule:
      "F0-F7 (8 stages): F0 Instruction Accepted → F1 Funding Final → F2 Legally Controlled Backing Confirmed → " +
      "F3 MITHQAL Authorization Final → F4 MITHQAL Ledger Final → F5 Receiving Institution Accepted → " +
      "F6 External Rail Final → F7 Legal Settlement Final. Three finality types: technical (F0, F3, F4), " +
      "banking (F1, F2, F5, F6), legal (F7). Use 'finality-coordinated settlement' when no shared legal " +
      "finality domain. Use 'atomic settlement' only when shared legal finality domain exists.",
    overlayRule:
      "F0-F7 OVERLAYS on top of the existing BM-01..BM-16 workflow (§V25.0.D.X) and the 3 trust " +
      "domains (A/B/C, v25.3.7). The deterministic v19 monetary engine is PRESERVED. Each F-stage " +
      "maps to exactly one BM-* step and one trust domain.",
  };
}

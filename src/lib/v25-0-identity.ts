// v25.0 — Canonical Identity & Participant Architecture
// =================================================================
// MITHQAL v25.0 transforms from participant-accessible reserve-backed
// settlement into PERMISSIONED WHOLESALE NEUTRAL SETTLEMENT INFRASTRUCTURE
// connecting regulated monetary systems across jurisdictions.
//
// §1 — Canonical Identity
// §2 — Participant Hierarchy (Class A-E)
// §6 — Neutrality Doctrine
// §10 — Core Value Proposition
// §28 — Canonical Terminology
// =================================================================

// ---- §1.1 MITHQAL Canonical Identity ----
export const MITHQAL_IDENTITY = {
  canonical: "A neutral wholesale institutional settlement infrastructure connecting regulated monetary systems across jurisdictions.",
  isNot: [
    "a central bank",
    "a commercial bank",
    "a sovereign currency issuer",
    "a retail payment platform",
    "an exchange",
    "a brokerage",
    "a market maker",
    "a lending institution",
    "a trade-finance institution",
    "an investment fund",
    "a wealth manager",
    "a DeFi protocol",
    "a speculative vehicle",
  ],
} as const;

// ---- §1.2 MTQ Canonical Definition ----
export const MTQ_DEFINITION = {
  canonical: "A permissioned wholesale settlement instrument used by approved regulated financial institutions and, where explicitly authorized, central banks or equivalent sovereign monetary authorities to transfer settlement value between participating monetary systems.",
  is: [
    "neutral",
    "wholesale",
    "settlement-focused",
    "reserve-disciplined",
    "auditable",
    "cryptographically secured",
    "institutionally traceable",
    "interoperable",
  ],
  isNot: [
    "a retail stablecoin",
    "a consumer payment coin",
    "a replacement for USD, JPY, EUR, AED or any sovereign currency",
    "a CBDC",
    "a sovereign liability",
    "an investment product",
    "an exchange-traded speculative instrument",
  ],
} as const;

// ---- §2 Participant Classes ----
export type ParticipantClass = "A" | "B" | "C" | "D" | "E";

export interface ParticipantClassDef {
  class: ParticipantClass;
  name: string;
  description: string;
  directMinting: boolean;
  directSettlement: boolean;
  capabilities: string[];
  authorizationRequired: "EXPLICIT_SOVEREIGN" | "REGULATORY" | "JURISDICTIONAL" | "NONE";
}

export const PARTICIPANT_CLASSES: ParticipantClassDef[] = [
  {
    class: "A",
    name: "Central Bank / Sovereign Monetary Authority",
    description: "Permitted only when explicitly authorized by the relevant authority and applicable legal framework.",
    directMinting: false,  // Even central banks go through institutional channels
    directSettlement: true,
    capabilities: [
      "wholesale settlement participation",
      "CBDC interoperability",
      "institutional settlement routing",
      "observation/reporting according to legal access rights",
    ],
    authorizationRequired: "EXPLICIT_SOVEREIGN",
  },
  {
    class: "B",
    name: "Regulated Commercial Bank",
    description: "Primary production participant.",
    directMinting: true,  // Through institutional issuance channels
    directSettlement: true,
    capabilities: [
      "MTQ settlement",
      "MTQ acquisition through approved institutional channels",
      "MTQ redemption through approved channels",
      "settlement routing",
      "institutional liquidity management",
      "transaction reporting",
    ],
    authorizationRequired: "REGULATORY",
  },
  {
    class: "C",
    name: "Approved Regulated Financial Institution",
    description: "Only where legally permitted. Capabilities explicitly scoped by jurisdiction and license.",
    directMinting: true,  // Conditional on jurisdiction
    directSettlement: true,
    capabilities: [
      "MTQ settlement (jurisdiction-scoped)",
      "MTQ acquisition (conditional)",
      "MTQ redemption (conditional)",
    ],
    authorizationRequired: "JURISDICTIONAL",
  },
  {
    class: "D",
    name: "Corporate / Trade Customer",
    description: "Corporate customers do NOT directly mint MTQ. They interact through their regulated bank.",
    directMinting: false,
    directSettlement: false,
    capabilities: [
      "indirect MTQ access via regulated institution",
      "trade settlement instruction via bank",
    ],
    authorizationRequired: "NONE",
  },
  {
    class: "E",
    name: "Individual / Retail Customer",
    description: "No direct MTQ minting. No direct wholesale settlement access. No unrestricted retail MTQ issuance.",
    directMinting: false,
    directSettlement: false,
    capabilities: [
      "no direct MTQ access",
      "retail access NOT part of core institutional architecture",
    ],
    authorizationRequired: "NONE",
  },
];

// ---- §3 Minting Model ----
export const MINTING_MODEL = {
  old: "Participant deposits assets and directly mints MTQ",
  new: "Only authorized institutional issuance channels may originate MTQ",
  rules: [
    "Only authorized institutional issuance channels may originate MTQ",
    "The customer may request a settlement service through its regulated institution",
    "The customer does not possess monetary issuance authority",
    "No MTQ may exist without corresponding verified reserve backing",
  ],
  prohibited: [
    "executive minting",
    "council minting",
    "emergency arbitrary minting",
    "treasury minting",
    "compensation minting",
    "operational funding minting",
    "governance minting",
    "promotional minting",
  ],
} as const;

// ---- §3.2 Institutional Issuance Pipeline ----
export const ISSUANCE_PIPELINE = [
  "Underlying Customer",
  "Regulated Bank / Approved Institution",
  "Institutional Issuance Request",
  "Institution Authentication",
  "Institutional Authority Check",
  "Eligible Reserve / Settlement Asset Verification",
  "Custody Verification",
  "NAV Calculation",
  "Reserve Ratio / Stress-RR / Constitutional Checks",
  "Proof of Reserves",
  "Proof of Solvency",
  "Deterministic Issuance Authorization",
  "Mint.sol",
  "MTQ.sol",
  "MTQ enters wholesale settlement layer",
] as const;

// ---- §4 KYC/KYB Architecture ----
export const KYC_ARCHITECTURE = {
  customerLevel: {
    responsible: "Regulated participating institution",
    functions: [
      "KYC",
      "KYB",
      "UBO identification",
      "AML/CFT",
      "source-of-funds/source-of-wealth checks where applicable",
      "sanctions screening",
      "transaction monitoring",
      "customer risk assessment",
    ],
  },
  mithqalLevel: {
    responsible: "MITHQAL",
    functions: [
      "institution identification",
      "institution authorization",
      "institution credential verification",
      "institutional permissions",
      "jurisdiction eligibility",
      "settlement instruction validation",
      "sanctions/jurisdiction controls required at the MITHQAL layer",
      "transaction integrity checks",
      "institutional auditability",
      "immutable settlement records",
    ],
  },
  principle: "The participating regulated institution knows its customer; MITHQAL knows and authorizes its participating institution and validates the institutional settlement transaction.",
  exception: "If applicable law requires MITHQAL to collect, verify, retain or disclose additional customer information, the architecture must support that requirement.",
} as const;

// ---- §5 Neutral Cross-Border Settlement Flow ----
export const SETTLEMENT_FLOW = {
  canonical: [
    "SOVEREIGN MONEY / CBDC A",
    "REGULATED INSTITUTION A",
    "MTQ",
    "MITHQAL NEUTRAL SETTLEMENT LAYER",
    "MTQ",
    "REGULATED INSTITUTION B",
    "SOVEREIGN MONEY / CBDC B",
  ],
  example: {
    scenario: "Japan importer purchases from U.S. exporter",
    flow: [
      "Japanese Importer",
      "Japanese Bank",
      "JPY / authorized Japanese settlement asset",
      "Institutional MTQ Conversion",
      "MTQ",
      "MITHQAL Settlement Layer",
      "MTQ",
      "U.S. Bank",
      "USD / authorized U.S. settlement asset",
      "U.S. Exporter",
    ],
    principle: "The importer and exporter do not need to become direct MTQ issuers. MITHQAL is the neutral middle settlement layer.",
  },
} as const;

// ---- §6 Neutrality Doctrine (immutable) ----
export const NEUTRALITY_DOCTRINE = {
  immutable: "MITHQAL shall not compete with sovereign monetary systems.",
  explicit: [
    "USD remains USD",
    "JPY remains JPY",
    "EUR remains EUR",
    "AED remains AED",
    "RMB remains RMB",
    "CBDCs remain liabilities of their issuing central banks",
    "MTQ does not replace domestic monetary systems",
    "MTQ does not establish monetary policy",
    "MITHQAL does not set sovereign interest rates",
    "MITHQAL does not attempt to displace any sovereign currency",
  ],
  strategicStatement: "MTQ exists between monetary systems, not instead of monetary systems.",
} as const;

// ---- §7 CBDC Interoperability Layer ----
export const CBDC_INTEROP = {
  name: "MITHQAL Neutral CBDC Interoperability Layer",
  supportedFlows: [
    "wholesale CBDC → MTQ → wholesale CBDC",
    "CBDC → MTQ → bank money",
    "bank money → MTQ → CBDC",
    "bank money → MTQ → bank money",
    "tokenized sovereign/cash-equivalent assets → MTQ → regulated destination settlement assets",
  ],
  principles: [
    "Do not require every country to adopt the same CBDC technology",
    "Do not require one sovereign currency to become the international settlement currency",
    "Use MTQ as the neutral institutional bridge",
  ],
} as const;

// ---- §8 Central-Bank Participation Model ----
export type CBParticipationMode = "BANK_ONLY" | "CB_CONNECTED" | "CB_DIRECT";

export const CB_PARTICIPATION_MODES: Record<CBParticipationMode, {
  name: string;
  description: string;
  authorizationRequired: boolean;
}> = {
  BANK_ONLY: {
    name: "Mode 1 — Bank-Only",
    description: "Commercial/regulated institutions interact with MTQ.",
    authorizationRequired: false,
  },
  CB_CONNECTED: {
    name: "Mode 2 — Central-Bank-Connected",
    description: "Banks settle through a central-bank or wholesale-CBDC interface.",
    authorizationRequired: true,
  },
  CB_DIRECT: {
    name: "Mode 3 — Direct Central-Bank Participation",
    description: "Available only where the relevant authority explicitly authorizes it.",
    authorizationRequired: true,
  },
};

// ---- §9 Institutional Traceability Model ----
export interface SettlementRecord {
  institutionalSender: string;
  institutionalReceiver: string;
  transactionId: string;
  timestamp: string;
  mtqAmount: number;
  settlementState: string;
  authorizationState: string;
  complianceState: string;
  reserveReference: string;
  cryptographicHash: string;
  validatorSignature: string;
  ledgerCommitment: string;
  jurisdiction: string;
  settlementChannel: string;
  finalityStatus: "PENDING" | "TECHNICAL_FINAL" | "LEGAL_FINAL" | "BANKING_FINAL";
}

export const TRACEABILITY = {
  tracePath: [
    "MTQ Transaction",
    "Participating Institution",
    "Institutional Reference",
    "Underlying Customer Transaction",
  ],
  accessRules: [
    "participating-institution rights",
    "regulator rights",
    "central-bank rights",
    "legal disclosure requirements",
  ],
  privacyRule: "MITHQAL should not expose sensitive customer information publicly. Access must be permissioned.",
} as const;

// ---- §10 Core Value Proposition ----
export const VALUE_PROPOSITION = {
  canonical: "MITHQAL combines digital settlement speed with regulated-money traceability and neutral cross-border interoperability.",
  pillars: {
    neutrality: "Does not compete with sovereign currencies.",
    speed: "Digital settlement with cryptographic finality and automated processing.",
    traceability: "Institutionally attributable, auditable, compliance-aware settlement.",
  },
} as const;

// ---- §13 Trading Language Redefinition ----
export const TRADING_LANGUAGE = {
  permitted: "Institutional reserve acquisition/rebalancing necessary to maintain the constitutional reserve.",
  prohibited: [
    "speculative trading",
    "return maximization",
    "market making",
    "order books",
    "brokerage",
    "exchange operation",
    "portfolio management for customers",
    "derivatives",
    "leverage",
    "yield farming",
  ],
  rule: "Reserve management exists to preserve settlement integrity, not to generate speculative profit.",
} as const;

// ---- §14 Redemption Flow ----
export const REDEMPTION_FLOW = [
  "Receiving Bank",
  "Redemption Instruction",
  "Institutional Validation",
  "MTQ Burn",
  "Reserve Claim Calculation",
  "Reserve Release",
  "Approved Banking / Settlement Rail",
  "Destination Institution",
] as const;

// ---- §22 Settlement Finality ----
export const FINALITY = {
  technical: "Cryptographic finality (blockchain confirmation)",
  legal: "Legal settlement finality (jurisdiction-dependent)",
  banking: "Banking-system finality (rail-dependent)",
  rule: "No blueprint section may imply that blockchain confirmation alone automatically determines legal finality in every jurisdiction.",
} as const;

// ---- §31 Required Final Blueprint Statement ----
export const CANONICAL_STATEMENT = "MITHQAL is a neutral wholesale settlement infrastructure connecting regulated monetary systems. MTQ is a permissioned wholesale settlement instrument used by authorized regulated financial institutions and, where explicitly permitted, central banks or sovereign monetary authorities. MTQ does not replace, compete with, or become a substitute for sovereign currencies or central-bank money. MITHQAL provides the neutral settlement layer between participating monetary systems, combining digital settlement speed with institutional traceability, compliance and cryptographic auditability. Customer-level KYC/KYB is primarily performed by regulated participating institutions, while MITHQAL governs institutional authorization, settlement integrity, jurisdictional controls and immutable settlement records. No MTQ may be issued without constitutionally verified reserve backing, and no participant or governance body may exercise discretionary monetary issuance authority.";

// ---- §28 Canonical Terminology ----
export const TERMINOLOGY = {
  preferred: [
    "Wholesale Settlement Instrument",
    "Neutral Settlement Layer",
    "Institutional Settlement",
    "Participating Institution",
    "Authorized Institution",
    "Institutional Issuance",
    "Settlement Gateway",
    "Regulated Monetary System",
    "Central-Bank-Authorized Participant",
    "Institutional Traceability",
    "Neutral Interoperability",
    "Settlement Corridor",
  ],
  avoid: [
    "consumer coin",
    "public minting",
    "retail stablecoin",
    "global currency",
    "replacement currency",
    "speculative asset",
    "exchange token",
    "investment token",
    "universal money",
    "permissionless issuance",
  ],
} as const;

// ---- Helper: check if a participant class can mint ----
export function canMint(participantClass: ParticipantClass): boolean {
  const def = PARTICIPANT_CLASSES.find(p => p.class === participantClass);
  return def?.directMinting ?? false;
}

// ---- Helper: check if a participant class can settle directly ----
export function canSettle(participantClass: ParticipantClass): boolean {
  const def = PARTICIPANT_CLASSES.find(p => p.class === participantClass);
  return def?.directSettlement ?? false;
}

// ---- Helper: get authorization requirement ----
export function getAuthRequirement(participantClass: ParticipantClass): string {
  const def = PARTICIPANT_CLASSES.find(p => p.class === participantClass);
  return def?.authorizationRequired ?? "NONE";
}

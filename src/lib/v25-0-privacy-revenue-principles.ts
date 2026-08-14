// v25.0 §14+§38+§8+§9+§39+§43 — Privacy Architecture + Revenue + Product Hierarchy + Principles
// =================================================================
// §14 — 3-Layer Privacy Architecture
// §15 — Zero-knowledge / cryptographic attestation
// §38 — Institutional privacy principle
// §8 — Bank revenue model
// §9 — MITHQAL Operating Company
// §29 — MITHQAL does not compete with banks
// §39 — Product hierarchy (9-layer stack)
// §43 — 10 Constitutional Principles
// =================================================================

// ---- §14 3-Layer Privacy Architecture ----
export const PRIVACY_ARCHITECTURE = {
  principle: "Privacy by default. Traceability by authorization. Disclosure by law.",
  layers: {
    layer1: {
      name: "Bank Identity Vault",
      holder: "The regulated bank",
      contains: [
        "legal customer identity",
        "UBO (ultimate beneficial owner)",
        "account details",
        "KYC/KYB documentation",
        "risk information",
        "transaction history (customer-level)",
      ],
      mithqalAccess: "NONE by default — bank retains customer identity",
    },
    layer2: {
      name: "MITHQAL Institutional Settlement Identity",
      holder: "MITHQAL",
      contains: [
        "bank ID (institutional, not customer)",
        "corporate reference (pseudonymous)",
        "KYC/AML status (attested, not detailed)",
        "sanctions status",
        "jurisdiction",
        "transaction class",
        "authorization state",
        "relevant limits",
      ],
      mithqalAccess: "FULL — institutional settlement data",
    },
    layer3: {
      name: "Authorized Disclosure",
      holder: "Regulator / Central Bank (with legal authority)",
      contains: [
        "underlying customer identity (where law permits)",
        "full transaction details",
        "account-level data",
      ],
      mithqalAccess: "DISCLOSURE BY LAW — only where local law requires or permits",
      flow: "regulator → authorized mechanism → bank → underlying customer data, or direct MITHQAL disclosure where local law requires",
    },
  },
} as const;

// ---- §15 Zero-Knowledge Architecture (real, not marketing) ----
export const ZK_ARCHITECTURE = {
  principle: "Do not make 'zero knowledge' a marketing term. Implement real privacy mechanisms where appropriate.",
  mechanisms: [
    "zero-knowledge proofs",
    "verifiable credentials",
    "cryptographic attestations",
    "encrypted identifiers",
    "selective disclosure",
    "policy-bound disclosure",
    "commitment structures",
  ],
  useCase: "MITHQAL should be able to verify 'This corporate is KYC-valid' without necessarily receiving the entire customer file.",
  legalException: "When law requires information to be available, the architecture must support lawful disclosure.",
} as const;

// ---- §8 Bank Revenue Model ----
export const BANK_REVENUE_MODEL = {
  principle: "Banks must be allowed to make money. Design the commercial model around bank economics.",
  bankRevenue: [
    "MTQ origination/service fee",
    "settlement fee",
    "redemption service fee",
    "FX spread/service fee",
    "treasury/liquidity services",
    "corporate settlement account fees",
    "API/connectivity fees",
    "reconciliation/reporting services",
    "institutional wallet administration",
  ],
  mithqalRevenue: [
    "issuance infrastructure fee",
    "settlement infrastructure fee",
    "redemption infrastructure fee",
    "institutional connectivity",
    "API infrastructure",
    "enterprise infrastructure",
    "compliance/attestation infrastructure",
    "network services",
  ],
  fundamentalRule: "Revenue must never influence monetary issuance. The sequence: legal eligibility → institutional authorization → reserve/funding verification → risk checks → issuance → fee accounting. NEVER: fee paid → MTQ issued.",
} as const;

// ---- §9 MITHQAL Operating Company ----
export const MITHQAL_OPERATING_COMPANY = {
  role: "MTQ Operating / Issuance Company — narrowly defined",
  operates: [
    "issuance infrastructure",
    "settlement infrastructure",
    "MTQ protocol",
    "institutional connectivity",
    "reserve administration",
    "proof systems",
    "operational systems",
  ],
  isNot: [
    "a bank",
    "the customer's primary banking relationship",
    "an FX dealer",
    "an exchange",
    "a broker",
  ],
  preserves: "Anti-platform doctrine from v24.2 (no exchange, no brokerage, no lending, no market making)",
} as const;

// ---- §29 MITHQAL does not compete with banks ----
export const NON_COMPETE_PRINCIPLE = {
  principle: "MITHQAL makes banks more useful, not less useful.",
  banksRetain: [
    "customers",
    "accounts",
    "KYC",
    "deposits",
    "FX",
    "treasury",
    "lending",
    "corporate services",
  ],
  mithqalProvides: [
    "neutral cross-border settlement",
    "potentially lower settlement friction",
    "more efficient reconciliation",
    "institutional MTQ infrastructure",
    "cross-CBDC interoperability",
  ],
  commercialStory: "MITHQAL + banks (economically aligned), not MITHQAL vs banks.",
} as const;

// ---- §28 MITHQAL is NOT the FX exchange ----
export const FX_BOUNDARY = {
  mithqal: "JPY → MTQ → USD settlement (neutral bridge)",
  banks: "JPY ↔ USD economic conversion / customer FX",
  boundary: "FX remains within regulated banking infrastructure. MITHQAL does not operate an FX exchange.",
} as const;

// ---- §39 Product Hierarchy (9-layer stack) ----
export const PRODUCT_HIERARCHY = [
  { layer: 1, name: "MITHQAL", description: "The institutional infrastructure." },
  { layer: 2, name: "MTQ", description: "The neutral settlement instrument." },
  { layer: 3, name: "MTQ Institutional Settlement Account", description: "Bank-linked corporate settlement position." },
  { layer: 4, name: "MITHQAL Issuance Engine", description: "Controlled issuance infrastructure." },
  { layer: 5, name: "MITHQAL Settlement Network", description: "Cross-border institutional settlement." },
  { layer: 6, name: "MITHQAL CBDC Interoperability Layer", description: "Wholesale-CBDC/bank interoperability." },
  { layer: 7, name: "MITHQAL Regulatory Policy Engine", description: "Jurisdiction controls." },
  { layer: 8, name: "MITHQAL Privacy / Attestation Layer", description: "ZK, credentials, selective disclosure." },
  { layer: 9, name: "MITHQAL Reserve Engine", description: "Reserves, solvency, liquidity and rebalancing." },
] as const;

// ---- §43 10 Constitutional Principles ----
export const TEN_PRINCIPLES = [
  {
    number: 1,
    name: "Neutrality",
    principle: "MTQ does not compete with sovereign money. It connects sovereign monetary systems.",
  },
  {
    number: 2,
    name: "Institutional Access",
    principle: "MTQ is a wholesale B2B settlement instrument accessed through regulated institutions.",
  },
  {
    number: 3,
    name: "Bank Partnership",
    principle: "Banks remain the customer gateway, compliance layer, security layer and commercial service provider.",
  },
  {
    number: 4,
    name: "Non-Discretionary Issuance",
    principle: "No MTQ is created without constitutionally verified backing and authorized institutional issuance.",
  },
  {
    number: 5,
    name: "Privacy",
    principle: "Customer information remains primarily within the regulated institution; MITHQAL uses minimum necessary information, cryptographic attestations and selective disclosure.",
  },
  {
    number: 6,
    name: "Traceability",
    principle: "Every institutional settlement is attributable and auditable subject to lawful access rights.",
  },
  {
    number: 7,
    name: "CBDC Neutrality",
    principle: "CBDCs remain sovereign liabilities; MTQ is the neutral settlement layer between them.",
  },
  {
    number: 8,
    name: "Regulatory Compatibility",
    principle: "MITHQAL does not circumvent law; it enforces jurisdiction-specific permissions and restrictions.",
  },
  {
    number: 9,
    name: "Monetary Integrity",
    principle: "Reserve integrity, liquidity, solvency and redemption remain constitutional priorities.",
  },
  {
    number: 10,
    name: "Institutional Economics",
    principle: "MITHQAL creates value by reducing settlement friction, risk and liquidity costs; banks remain economically incentivized participants.",
  },
] as const;

// ---- §41 Final Authority Matrix ----
export interface AuthorityMatrixEntry {
  actor: string;
  customerKYC: string;
  mtqIssuanceRequest: string;
  actualMint: string;
  holdMtq: string;
  transferMtq: string;
  redeemMtq: string;
  regulatoryVisibility: string;
}

export const AUTHORITY_MATRIX: AuthorityMatrixEntry[] = [
  {
    actor: "Individual (Retail)",
    customerKYC: "Bank",
    mtqIssuanceRequest: "No",
    actualMint: "No",
    holdMtq: "No direct wholesale position",
    transferMtq: "No direct wholesale",
    redeemMtq: "No",
    regulatoryVisibility: "Per local law",
  },
  {
    actor: "Corporate",
    customerKYC: "Bank",
    mtqIssuanceRequest: "Yes, through bank",
    actualMint: "No",
    holdMtq: "Yes, bank-linked settlement account",
    transferMtq: "Yes, through bank/institutional controls",
    redeemMtq: "Yes, through bank",
    regulatoryVisibility: "Per local law",
  },
  {
    actor: "Regulated Bank",
    customerKYC: "Yes",
    mtqIssuanceRequest: "Yes",
    actualMint: "Via authorized MITHQAL issuance path",
    holdMtq: "Yes",
    transferMtq: "Yes",
    redeemMtq: "Yes",
    regulatoryVisibility: "Yes",
  },
  {
    actor: "Central Bank",
    customerKYC: "As applicable",
    mtqIssuanceRequest: "Where authorized",
    actualMint: "Where authorized",
    holdMtq: "Yes, where authorized",
    transferMtq: "Yes, where authorized",
    redeemMtq: "Where authorized",
    regulatoryVisibility: "Yes",
  },
  {
    actor: "MITHQAL Operating Company",
    customerKYC: "No routine customer KYC",
    mtqIssuanceRequest: "Processes institutional request",
    actualMint: "Protocol/issuance engine",
    holdMtq: "Network/infrastructure role",
    transferMtq: "Settlement infrastructure",
    redeemMtq: "Infrastructure",
    regulatoryVisibility: "Lawful institutional access",
  },
];

// ---- §17 Regulatory observability wording ----
export const REGULATORY_OBSERVABILITY = {
  old: "Full central-bank control",
  new: "Full regulatory observability and control within legal authority",
  principle: "Each participating institution remains subject to the regulatory framework applicable in its jurisdiction, and MITHQAL enforces the permissions applicable to that institution and corridor.",
  observabilityScope: [
    "participating institutions",
    "corridors",
    "institutional settlement volumes",
    "systemic liquidity",
    "sanctions",
    "jurisdiction blocks",
    "institutional risk",
    "abnormal flows",
    "settlement health",
    "reserves where legally relevant",
  ],
  privacyRule: "Access to underlying corporate/customer identity should remain governed by legal authority. This avoids creating a global surveillance system.",
} as const;

// ---- §11 Correct jurisdictional language ----
export const JURISDICTIONAL_LANGUAGE = {
  avoid: "Do NOT say 'all banks are controlled by central banks'. Some jurisdictions have separate banking supervisors, payment regulators, financial-intelligence units, securities regulators, and data authorities.",
  correct: "Each participating institution remains subject to the regulatory framework applicable in its jurisdiction, and MITHQAL enforces the permissions applicable to that institution and corridor.",
} as const;

// ---- §30 Economic proposition ----
export const ECONOMIC_PROPOSITION = {
  principle: "Do not promise specific savings before pilots. Measure instead.",
  measure: [
    "settlement time",
    "settlement failure",
    "reconciliation cost",
    "correspondent handoffs",
    "trapped liquidity",
    "intraday liquidity requirements",
    "operational cost",
    "investigation time",
    "compliance-processing time",
    "transaction transparency",
  ],
  statement: "MITHQAL seeks to reduce the friction, settlement risk, liquidity cost and operational complexity of cross-border trade.",
  not: "MITHQAL creates economic growth automatically.",
} as const;

// ---- §44 Final COO Decision (locked architecture) ----
export const FINAL_ARCHITECTURE = {
  flow: "Corporate customer → regulated bank → bank-linked corporate MTQ settlement account → MITHQAL neutral wholesale settlement → receiving bank → corporate account.",
  roles: {
    mithqal: "neutral infrastructure",
    mtq: "neutral wholesale settlement instrument",
    banks: "customer gateway, compliance, security, liquidity and revenue partner",
    corporates: "beneficial institutional users/holders",
    centralBanks: "supervisory/settlement anchors where authorized",
    cbdcs: "sovereign monetary liabilities",
    zkPrivacy: "minimize unnecessary customer disclosure",
    mithqalLedger: "canonical institutional settlement record",
    proofOfLiabilities: "reconcile institutional MTQ positions",
    reserveEngine: "knows aggregate outstanding MTQ and rebalances accordingly",
    regulatoryEngine: "jurisdiction-by-jurisdiction enforcement",
  },
  prohibitions: [
    "No retail MTQ",
    "No exchange",
    "No brokerage",
    "No speculative trading",
    "No discretionary minting",
  ],
  keySentence: "Customers continue to use banks; banks use MITHQAL; MITHQAL uses MTQ to settle value between monetary systems.",
} as const;

// src/lib/mtq-economic-definition.ts
//
// MITHQAL v25.3.2 — CANONICAL MTQ ECONOMIC DEFINITION (single source of truth)
// Per K-directive (trace 1a0ede068b9def31):
//   "Create one canonical MTQ economic definition.
//    MTQ must be described consistently as: permissioned, institutional,
//    closed-loop settlement unit.
//    Do not describe it as: retail money, public cryptocurrency, investment
//    asset, yield token, governance token, speculative asset, public stablecoin.
//    Remove all contradictory USD-peg language.
//    PAR must be defined consistently as an accounting/denomination reference
//    unless a future jurisdiction-specific legal opinion establishes otherwise.
//    Do not claim legal classification, redemption guarantee, security status,
//    deposit status, or e-money status without external legal evidence."
//
// This is the SINGLE CANONICAL SOURCE for MTQ's economic identity. All other
// modules MUST import from here. Any inline MTQ economic description elsewhere
// is a CONTRADICTION per the contradiction scanner and must be removed or
// re-pointed to this source.

export const MTQ_ECONOMIC_DEFINITION = {
  canonicalDescription: "MTQ is a permissioned, institutional, closed-loop settlement unit.",
  canonicalDescriptionLong:
    "MTQ is a permissioned, institutional, closed-loop settlement unit issued by " +
    "MITHQAL (per Constitution v19.0 and the v25.3.2 remediation layer). MTQ is " +
    "available only to authorized institutional participants (banks, custodians, " +
    "and qualified institutions) via the MITHQAL Bank Gateway (MBG). MTQ is NOT " +
    "available to retail users. MTQ is NOT a public cryptocurrency. MTQ settles " +
    "inside the MITHQAL closed-loop institutional network.",

  // === What MTQ IS ===
  isStatement: [
    "Permissioned — only authorized institutional participants can hold/transact MTQ",
    "Institutional — designed for bank/custodian/qualified-institution use, not retail",
    "Closed-loop — settles inside the MITHQAL institutional network, not on public markets",
    "Settlement unit — purpose-built for wholesale cross-border trade settlement",
    "Optional — MTQ is one of 7 supported settlement asset types in the MITHQAL control plane (BANK_MONEY, CENTRAL_BANK_MONEY, RTGS, TOKENIZED_DEPOSITS, WHOLESALE_CBDC, MTQ, OTHER_LEGALLY_RECOGNIZED). The control plane is asset-agnostic and remains usable when MTQ is disabled (per v25.3.4 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary).",
    "Gold-anchored — per Constitution v19.0 §22, MTQ is gold-anchored. Its USD value (navM) moves with the gold price. Its purchasing power in any currency depends on BOTH gold's USD price AND the USD→currency FX rate (per v25.9 /api/mtq-purchasing-power).",
  ],

  // === What MTQ is NOT (explicit prohibitions per K-directive) ===
  isNotStatement: [
    "MTQ is NOT retail money",
    "MTQ is NOT a public cryptocurrency",
    "MTQ is NOT an investment asset",
    "MTQ is NOT a yield token (no staking, no farming, no yield — just settlement utility)",
    "MTQ is NOT a governance token",
    "MTQ is NOT a speculative asset",
    "MTQ is NOT a public stablecoin",
    "MTQ is NOT pegged to USD or any fiat currency (USD-peg language is forbidden)",
    "MTQ is NOT a sovereign currency",
    "MTQ is NOT a CBDC",
    "MTQ is NOT a BRICS currency",
    "MTQ is NOT an investment vehicle",
  ],

  // === PAR (canonical definition) ===
  parDefinition: {
    value: 1.0,
    description:
      "PAR = 1.00 is an accounting/denomination reference ONLY. It is used for " +
      "liability calculation (L = S × PAR where S = MTQ supply). PAR is NOT the " +
      "market price of MTQ, NOT a USD peg, NOT a promise of redemption into USD, " +
      "and NOT a redemption guarantee. PAR is a denomination convention that " +
      "may be superseded by a future jurisdiction-specific legal opinion.",
    isNot: [
      "PAR is NOT a USD peg",
      "PAR is NOT a market price",
      "PAR is NOT a redemption guarantee",
      "PAR is NOT a promise of redemption into USD",
      "PAR is NOT a stablecoin peg",
    ],
  },

  // === Legal classification (DO NOT CLAIM without evidence) ===
  legalClassification: {
    status: "PENDING_VALIDATION",
    rule:
      "MTQ's legal classification (deposit / e-money / stored-value / security / " +
      "commodity / payment token / digital asset) is NOT claimed without external " +
      "legal evidence. Per the v25.3.2 external legal evidence registry " +
      "(src/lib/external-legal-evidence.ts), no legal opinion has been obtained " +
      "yet. The AAOIFI Sharia attestation and Independent Audit Report are both " +
      "PENDING_VALIDATION. MITHQAL does NOT claim deposit status, e-money status, " +
      "security status, or any other legal classification until external legal " +
      "evidence is ACTIVE in the registry.",
    claimsForbidden: [
      "Do NOT claim MTQ is a 'deposit' without external legal evidence",
      "Do NOT claim MTQ is 'e-money' without external legal evidence",
      "Do NOT claim MTQ is a 'security' (or NOT a security) without external legal evidence",
      "Do NOT claim MTQ has 'redemption guarantee' without external legal evidence",
      "Do NOT claim MTQ is a 'stored-value instrument' without external legal evidence",
      "Do NOT claim MTQ is a 'payment token' without external legal evidence",
    ],
  },

  // === Source layers (per v25.3.2 authority hierarchy) ===
  sourceLayers: {
    economicDefinition: "v25.3.2 (this file — K-directive)",
    constitutionalAnchor: "Constitution v19.0 §22 (gold-anchored)",
    institutionalOperator: "JOZOUR Amendment §1.3 (8 constitutional principles)",
    capabilityBoundary: "v25.3.4 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE",
  },
};

// === API ===
export function getMTQCanonicalDescription(): string {
  return MTQ_ECONOMIC_DEFINITION.canonicalDescription;
}

export function getMTQCanonicalDescriptionLong(): string {
  return MTQ_ECONOMIC_DEFINITION.canonicalDescriptionLong;
}

export function getMTQIsStatements(): string[] {
  return MTQ_ECONOMIC_DEFINITION.isStatement;
}

export function getMTQIsNotStatements(): string[] {
  return MTQ_ECONOMIC_DEFINITION.isNotStatement;
}

export function getPARDefinition() {
  return MTQ_ECONOMIC_DEFINITION.parDefinition;
}

export function getLegalClassificationRule(): string {
  return MTQ_ECONOMIC_DEFINITION.legalClassification.rule;
}

// === Status (per v25.3.2 status markers) ===
export const MTQ_ECONOMIC_DEFINITION_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" = "ACTIVE";
export const MTQ_ECONOMIC_DEFINITION_VERSION = "v25.3.2-K2-1.0";
export const MTQ_ECONOMIC_DEFINITION_SOURCE = "src/lib/mtq-economic-definition.ts";

// ============================================================================
// §V25.2 — LEGAL OBLIGATION REGISTER (§49 / §74 / §91 companion)
// ============================================================================
// Infrastructure for tracking legal obligations across jurisdictions.
//
// This module is the EVIDENCE-INTAKE companion to the §49 legal-liability
// framework (`legal-liability-framework.ts`) and the §50 licensing matrix
// (`licensing-entity-matrix.ts`). Where those modules describe what the
// engineering team BELIEVES the legal characterization to be (clearly marked
// SPECULATIVE / PENDING OPINION), this register is the structured ledger into
// which REAL external-counsel opinions are recorded once they are obtained.
//
// CRITICAL PRINCIPLE (per §74 honest-state discipline):
//   The register is INFRASTRUCTURE — it is ready to accept real opinions but
//   is empty at time of writing. Every seeded entry defaults to
//   `OBLIGATION_PENDING`. The `opinionObtained` field on the honest-state
//   sub-record is ALWAYS `false` in seed data; only `registerOpinion()` —
//   invoked with verified external evidence — may set it to `true`.
//
// HONEST STATE (§74 — EXACT VALUES, do not mutate without directive):
//   REGISTER_IMPLEMENTED         = true
//   REGISTER_SEEDED              = true     (117 entries seeded)
//   OPINIONS_OBTAINED             = false    (no real opinion exists)
//   OBLIGATIONS_PENDING           = 117
//   OBLIGATIONS_OPINION_VERIFIED  = 0
//   VALIDATED_JURISDICTIONS       = 0
//   LICENSES_OBTAINED             = 0
//   PRODUCTION_AUTHORIZED         = false
//
// All entries are seeded as `OBLIGATION_PENDING`. No entry is seeded as
// `OPINION_ISSUED`, `OPINION_VERIFIED`, or any other state. To move an
// entry out of `OBLIGATION_PENDING`, an external law firm must be retained
// and an opinion artifact must be filed via `registerOpinion()`.
// ============================================================================

export const MODULE_ID = "v25.2-legal-obligation-register-1.0";
export const SECTION = 49;

// ----------------------------------------------------------------------------
// §49 — Types
// ----------------------------------------------------------------------------

export interface LegalObligation {
  /** Stable registry id, e.g. "LO-US-01" through "LO-HK-13". */
  id: string;
  /** ISO-3166-1 alpha-2 / canonical jurisdiction code. */
  jurisdiction: string;
  /** One of 13 obligation-type categories. */
  obligationType: LegalObligationType;
  /** Human-readable description of what the opinion must establish. */
  description: string;
  /** Which institutional validation gate(s) this obligation satisfies. */
  requiredFor: string;
  /** Current lifecycle status. Default: OBLIGATION_PENDING. */
  status: LegalObligationStatus;
  /** Evidence artifact (opinion / no-action / court order / regulator letter). */
  evidence: LegalEvidence | null;
  /** Law firm name (null until retained). */
  externalCounsel: string | null;
  /** ISO-8601 date the opinion was issued (null until issued). */
  opinionDate: string | null;
  /** Document reference for the opinion (null until issued). */
  opinionReference: string | null;
  /**
   * Honest-state sub-record. The `opinionObtained` field is ALWAYS `false`
   * in seed data; only `registerOpinion()` may set it to `true`, and only
   * when a verifiable evidence artifact is supplied.
   */
  honestState: {
    opinionObtained: false;
    evidenceVerified: false;
  };
}

export type LegalObligationType =
  | "LEGAL_NATURE_CLASSIFICATION"     // What is MTQ legally?
  | "OBLIGOR_IDENTIFICATION"          // Who owes the holder?
  | "HOLDER_RIGHTS"                   // What rights does the holder have?
  | "REDEMPTION_RIGHTS"               // Redemption terms
  | "SETTLEMENT_FINALITY"             // Finality under local law
  | "CREDITOR_TREATMENT"              // Insolvency treatment
  | "TRANSFERABILITY"                 // Can it be transferred?
  | "PLEDGEABILITY"                   // Can it be pledged?
  | "GOVERNING_LAW"                   // What law applies?
  | "DISPUTE_RESOLUTION"              // How are disputes resolved?
  | "LICENSING_CLASSIFICATION"        // What licenses are needed?
  | "TAX_CLASSIFICATION"              // How is it taxed?
  | "CROSS_BORDER_RECOGNITION";       // Is it recognized cross-border?

export type LegalObligationStatus =
  | "OBLIGATION_PENDING"              // Default — no opinion yet
  | "COUNSEL_RETAINED"                // Law firm engaged but no opinion yet
  | "OPINION_DRAFT"                   // Draft opinion in progress
  | "OPINION_ISSUED"                  // Opinion issued (but not yet verified)
  | "OPINION_VERIFIED"                // Independently verified
  | "OPINION_REJECTED";               // Opinion rejected (negative finding)

export interface LegalEvidence {
  type:
    | "LEGAL_OPINION"
    | "REGULATORY_NO_ACTION"
    | "COURT_ORDER"
    | "REGULATOR_LETTER";
  reference: string;
  date: string;
  counsel: string;
  summary: string;
}

// ----------------------------------------------------------------------------
// §50 — Canonical jurisdiction list (9 jurisdictions, mirrors §50 matrix)
// ----------------------------------------------------------------------------
//
// NB: `licensing-entity-matrix.ts` lists 8 jurisdictions (US, UAE, UK, EU,
// SINGAPORE, SWITZERLAND, HONG_KONG, KSA). This register uses the canonical
// ISO-style codes (US, EU, UK, CH, SG, AE, SA, JP, HK) — a 9-jurisdiction
// superset aligned with `legal-liability-framework.ts`, which already
// includes JP (Japan) as the 9th jurisdiction. The two notational systems
// describe the same population of jurisdictions; this register prefers ISO
// short codes for compactness in `LO-<JX>-<NN>` registry ids.
// ----------------------------------------------------------------------------

export const REGISTER_JURISDICTIONS = [
  "US",
  "EU",
  "UK",
  "CH",
  "SG",
  "AE",
  "SA",
  "JP",
  "HK",
] as const;

export const REGISTER_JURISDICTION_NAMES: Record<string, string> = {
  US: "United States",
  EU: "European Union / EEA",
  UK: "United Kingdom",
  CH: "Switzerland",
  SG: "Singapore",
  AE: "United Arab Emirates",
  SA: "Kingdom of Saudi Arabia",
  JP: "Japan",
  HK: "Hong Kong SAR",
};

// ----------------------------------------------------------------------------
// §49 — 13 obligation types (ordered)
// ----------------------------------------------------------------------------

export const OBLIGATION_TYPES: readonly LegalObligationType[] = [
  "LEGAL_NATURE_CLASSIFICATION",
  "OBLIGOR_IDENTIFICATION",
  "HOLDER_RIGHTS",
  "REDEMPTION_RIGHTS",
  "SETTLEMENT_FINALITY",
  "CREDITOR_TREATMENT",
  "TRANSFERABILITY",
  "PLEDGEABILITY",
  "GOVERNING_LAW",
  "DISPUTE_RESOLUTION",
  "LICENSING_CLASSIFICATION",
  "TAX_CLASSIFICATION",
  "CROSS_BORDER_RECOGNITION",
] as const;

// ----------------------------------------------------------------------------
// §49 — Description + gate-satisfaction templates per obligation type
// ----------------------------------------------------------------------------

interface ObligationTemplate {
  description: (jurisdiction: string) => string;
  requiredFor: string;
}

const OBLIGATION_TEMPLATES: Record<LegalObligationType, ObligationTemplate> = {
  LEGAL_NATURE_CLASSIFICATION: {
    description: (jx) =>
      `Classify the legal nature of MTQ under ${jx} law (deposit / e-money / stored-value / security / commodity / payment token / digital asset) — establish what MTQ legally IS in this jurisdiction.`,
    requiredFor: "G01 (pilot-jurisdiction legal opinion)",
  },
  OBLIGOR_IDENTIFICATION: {
    description: (jx) =>
      `Identify the legal obligor standing behind MTQ redemption under ${jx} law — establish whether the obligor is the issuing bank, the custodian, the foundation, or another entity, and confirm MITHQAL is NOT the obligor.`,
    requiredFor: "G01, G03 (bank contractual obligation framework)",
  },
  HOLDER_RIGHTS: {
    description: (jx) =>
      `Enumerate enforceable holder rights against the obligor under ${jx} law — redemption-at-PAR, segregation, claim priority, and any MiCA/UCC/FinSA/PSA-specific holder protections.`,
    requiredFor: "G01, G03 (bank contractual obligation framework)",
  },
  REDEMPTION_RIGHTS: {
    description: (jx) =>
      `Define redemption rights, frequency, conditions, and PAR treatment under ${jx} law — including any regulatory redemption windows (e.g., MAS SCS 5-business-day rule) and physical-bullion redemption terms.`,
    requiredFor: "G01, G03 (bank contractual obligation framework)",
  },
  SETTLEMENT_FINALITY: {
    description: (jx) =>
      `Confirm settlement finality characteristics of MTQ transfers under ${jx} payment-system law — including applicable CSDR/FedNow/SIC/CHAPS/Faster Payments/RTGS rules and chain-finality interaction.`,
    requiredFor: "G01, G09 (finality enforcement complete)",
  },
  CREDITOR_TREATMENT: {
    description: (jx) =>
      `Determine creditor ranking of MTQ holders on obligor insolvency under ${jx} insolvency law — preferential creditor, segregated-asset beneficiary, or ordinary unsecured creditor.`,
    requiredFor: "G01, G04 (default/resolution framework contractually validated)",
  },
  TRANSFERABILITY: {
    description: (jx) =>
      `Establish transferability rules, KYC/AML constraints, and any professional-holder restrictions applicable to MTQ under ${jx} law.`,
    requiredFor: "G01 (pilot-jurisdiction legal opinion)",
  },
  PLEDGEABILITY: {
    description: (jx) =>
      `Establish pledgeability and perfection requirements for MTQ as collateral under ${jx} law (e.g., UCC Article 9, OR art. 901, BGB §1274, Singapore Civil Law Act) — including obligor-consent requirements.`,
    requiredFor: "G01 (pilot-jurisdiction legal opinion)",
  },
  GOVERNING_LAW: {
    description: (jx) =>
      `Confirm the enforceability of the chosen governing-law election under ${jx} private-international-law rules — including Rome I / Hague Principles where applicable.`,
    requiredFor: "G01 (pilot-jurisdiction legal opinion)",
  },
  DISPUTE_RESOLUTION: {
    description: (jx) =>
      `Confirm dispute-resolution forum (courts / LCIA / SIAC / Swiss arbitration / HKIAC / DIFC-LCIA / etc.) and the enforceability of the chosen forum-selection clause under ${jx} law.`,
    requiredFor: "G01 (pilot-jurisdiction legal opinion)",
  },
  LICENSING_CLASSIFICATION: {
    description: (jx) =>
      `Identify required licenses and authorizations for MTQ issuance, distribution, custody, and secondary-market activity under ${jx} law — including banking-license, e-money, payment-services, CASP, MTL, BitLicense, or FinMA fintech-license regimes.`,
    requiredFor: "G02 (licensing/entity mapping validated)",
  },
  TAX_CLASSIFICATION: {
    description: (jx) =>
      `Characterize MTQ for tax purposes (VAT/GST/sales-tax, income tax, withholding tax, stamp duty) under ${jx} law — including treatment of mint/burn/redemption events and any crypto-asset-specific tax rules.`,
    requiredFor: "Tax compliance (cross-cutting; informs G02 + G19)",
  },
  CROSS_BORDER_RECOGNITION: {
    description: (jx) =>
      `Determine cross-border recognition of MTQ holder rights under ${jx} private-international-law rules — including enforcement of foreign judgments and arbitral awards relevant to MTQ.`,
    requiredFor: "G01, G19 (CBDC interoperability tested)",
  },
};

// ----------------------------------------------------------------------------
// §49 — Seed the register with 117 entries (9 jurisdictions × 13 obligation
//       types). ALL default to OBLIGATION_PENDING. NONE may be seeded in any
//       other status — by construction.
// ----------------------------------------------------------------------------

function makePendingObligation(
  jurisdiction: string,
  obligationType: LegalObligationType,
  index: number,
): LegalObligation {
  const template = OBLIGATION_TEMPLATES[obligationType];
  const id = `LO-${jurisdiction}-${String(index).padStart(2, "0")}`;
  return {
    id,
    jurisdiction,
    obligationType,
    description: template.description(jurisdiction),
    requiredFor: template.requiredFor,
    status: "OBLIGATION_PENDING",
    evidence: null,
    externalCounsel: null,
    opinionDate: null,
    opinionReference: null,
    // By construction: always (false, false) in seed data.
    honestState: {
      opinionObtained: false,
      evidenceVerified: false,
    },
  };
}

function buildSeedRegister(): LegalObligation[] {
  const entries: LegalObligation[] = [];
  for (const jurisdiction of REGISTER_JURISDICTIONS) {
    OBLIGATION_TYPES.forEach((obligationType, idx) => {
      entries.push(makePendingObligation(jurisdiction, obligationType, idx + 1));
    });
  }
  return entries;
}

export const LEGAL_OBLIGATION_REGISTER: LegalObligation[] = buildSeedRegister();

// ----------------------------------------------------------------------------
// §49 — Honest-state aggregation
// ----------------------------------------------------------------------------

export interface LegalObligationRegisterHonestState {
  REGISTER_IMPLEMENTED: true;
  REGISTER_SEEDED: true;
  OPINIONS_OBTAINED: false;
  OBLIGATIONS_TOTAL: number;
  OBLIGATIONS_PENDING: number;
  OBLIGATIONS_COUNSEL_RETAINED: number;
  OBLIGATIONS_OPINION_DRAFT: number;
  OBLIGATIONS_OPINION_ISSUED: number;
  OBLIGATIONS_OPINION_VERIFIED: number;
  OBLIGATIONS_OPINION_REJECTED: number;
  VALIDATED_JURISDICTIONS: 0;
  LICENSES_OBTAINED: 0;
  PRODUCTION_AUTHORIZED: false;
}

export function getLegalObligationRegisterHonestState(): LegalObligationRegisterHonestState {
  // Re-derive counts from the live register so callers always see the truth.
  // (All seeded entries are PENDING at construction; registerOpinion() may
  // advance some out of that state, but the field types below for
  // OPINIONS_OBTAINED / VALIDATED_JURISDICTIONS / LICENSES_OBTAINED /
  // PRODUCTION_AUTHORIZED remain LITERAL until an external evidence campaign
  // has actually occurred and the directive is amended.)
  const counts = {
    pending: LEGAL_OBLIGATION_REGISTER.filter((o) => o.status === "OBLIGATION_PENDING").length,
    counselRetained: LEGAL_OBLIGATION_REGISTER.filter((o) => o.status === "COUNSEL_RETAINED").length,
    draft: LEGAL_OBLIGATION_REGISTER.filter((o) => o.status === "OPINION_DRAFT").length,
    issued: LEGAL_OBLIGATION_REGISTER.filter((o) => o.status === "OPINION_ISSUED").length,
    verified: LEGAL_OBLIGATION_REGISTER.filter((o) => o.status === "OPINION_VERIFIED").length,
    rejected: LEGAL_OBLIGATION_REGISTER.filter((o) => o.status === "OPINION_REJECTED").length,
  };
  return {
    REGISTER_IMPLEMENTED: true,
    REGISTER_SEEDED: true,
    OPINIONS_OBTAINED: false, // LITERAL — no real opinion exists at time of writing
    OBLIGATIONS_TOTAL: LEGAL_OBLIGATION_REGISTER.length,
    OBLIGATIONS_PENDING: counts.pending,
    OBLIGATIONS_COUNSEL_RETAINED: counts.counselRetained,
    OBLIGATIONS_OPINION_DRAFT: counts.draft,
    OBLIGATIONS_OPINION_ISSUED: counts.issued,
    OBLIGATIONS_OPINION_VERIFIED: counts.verified,
    OBLIGATIONS_OPINION_REJECTED: counts.rejected,
    VALIDATED_JURISDICTIONS: 0, // LITERAL — no validated jurisdictions exist
    LICENSES_OBTAINED: 0,       // LITERAL — no licenses have been obtained
    PRODUCTION_AUTHORIZED: false, // LITERAL — production is NOT authorized
  };
}

// ----------------------------------------------------------------------------
// §49 — Evidence intake: `registerOpinion()`
// ----------------------------------------------------------------------------
//
// This function is the ONLY sanctioned path to advance an obligation out of
// `OBLIGATION_PENDING`. It accepts REAL external evidence (a LegalEvidence
// artifact with a non-empty reference, date, counsel, and summary) and
// advances the matching obligation to `OPINION_ISSUED`.
//
// It MUST NOT be called with synthetic / fake / placeholder evidence. The
// function performs structural validation; it cannot perform cryptographic
// verification of the opinion itself — that is a human / institutional
// responsibility (see `verifyOpinion()`).
//
// At time of writing this function is defined but NOT invoked — no opinion
// exists. It exists so the regulatory / legal-ops team can record real
// opinions once obtained without modifying code.
// ----------------------------------------------------------------------------

export interface RegisterOpinionInput {
  obligationId: string;
  externalCounsel: string;
  evidence: LegalEvidence;
  status?: LegalObligationStatus; // defaults to OPINION_ISSUED
}

export interface RegisterOpinionResult {
  ok: boolean;
  obligation: LegalObligation | null;
  error?: string;
}

export function registerOpinion(input: RegisterOpinionInput): RegisterOpinionResult {
  const obligation = LEGAL_OBLIGATION_REGISTER.find((o) => o.id === input.obligationId);
  if (!obligation) {
    return { ok: false, obligation: null, error: `Obligation not found: ${input.obligationId}` };
  }

  // Validate external counsel
  if (!input.externalCounsel || input.externalCounsel.trim().length < 2) {
    return { ok: false, obligation, error: "externalCounsel must be a non-empty law-firm name" };
  }

  // Validate evidence artifact
  const ev = input.evidence;
  if (!ev || !ev.reference || !ev.date || !ev.counsel || !ev.summary) {
    return { ok: false, obligation, error: "evidence must include {type,reference,date,counsel,summary}" };
  }
  // ISO-8601 date sanity check (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
    return { ok: false, obligation, error: "evidence.date must be ISO-8601 (YYYY-MM-DD)" };
  }

  const nextStatus: LegalObligationStatus = input.status ?? "OPINION_ISSUED";
  // Sanity: registered opinions may only land in these states.
  const allowed: LegalObligationStatus[] = [
    "COUNSEL_RETAINED",
    "OPINION_DRAFT",
    "OPINION_ISSUED",
    "OPINION_VERIFIED",
    "OPINION_REJECTED",
  ];
  if (!allowed.includes(nextStatus)) {
    return { ok: false, obligation, error: `status ${nextStatus} is not an opinion state` };
  }

  // Mutate the obligation in-place (the register is the single source of truth).
  obligation.externalCounsel = input.externalCounsel;
  obligation.evidence = ev;
  obligation.opinionDate = ev.date;
  obligation.opinionReference = ev.reference;
  obligation.status = nextStatus;

  // The honest-state sub-record is IMMUTABLE in the seed. The
  // `opinionObtained` flag may only transition to `true` once an opinion is
  // formally registered, and `evidenceVerified` only via `verifyOpinion()`.
  // We re-attach the honest-state record here reflecting the registered state.
  (obligation.honestState as {
    opinionObtained: boolean;
    evidenceVerified: boolean;
  }).opinionObtained =
    nextStatus === "OPINION_ISSUED" ||
    nextStatus === "OPINION_VERIFIED";
  (obligation.honestState as {
    opinionObtained: boolean;
    evidenceVerified: boolean;
  }).evidenceVerified = nextStatus === "OPINION_VERIFIED";

  return { ok: true, obligation };
}

/**
 * Independent verification step — accepts a verification artifact (the
 * identity of an independent validator + a verification date + a verification
 * reference) and advances the obligation from OPINION_ISSUED to
 * OPINION_VERIFIED. This is the second human / institutional step and the
 * ONLY path by which `evidenceVerified` may become `true`.
 *
 * Not invoked at time of writing — no opinion exists to verify.
 */
export interface VerifyOpinionInput {
  obligationId: string;
  validator: string;
  verificationReference: string;
  verificationDate: string;
}

export function verifyOpinion(input: VerifyOpinionInput): RegisterOpinionResult {
  const obligation = LEGAL_OBLIGATION_REGISTER.find((o) => o.id === input.obligationId);
  if (!obligation) {
    return { ok: false, obligation: null, error: `Obligation not found: ${input.obligationId}` };
  }
  if (obligation.status !== "OPINION_ISSUED") {
    return { ok: false, obligation, error: `Obligation ${obligation.id} is in ${obligation.status}, expected OPINION_ISSUED` };
  }
  if (!input.validator || !input.verificationReference || !input.verificationDate) {
    return { ok: false, obligation, error: "validator, verificationReference, and verificationDate are all required" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.verificationDate)) {
    return { ok: false, obligation, error: "verificationDate must be ISO-8601 (YYYY-MM-DD)" };
  }

  obligation.status = "OPINION_VERIFIED";
  (obligation.honestState as {
    opinionObtained: boolean;
    evidenceVerified: boolean;
  }).evidenceVerified = true;

  return { ok: true, obligation };
}

// ----------------------------------------------------------------------------
// §49 — Lookup helpers
// ----------------------------------------------------------------------------

export function getObligationById(id: string): LegalObligation | undefined {
  return LEGAL_OBLIGATION_REGISTER.find((o) => o.id === id);
}

export function getObligationsByJurisdiction(jurisdiction: string): LegalObligation[] {
  return LEGAL_OBLIGATION_REGISTER.filter((o) => o.jurisdiction === jurisdiction);
}

export function getObligationsByType(type: LegalObligationType): LegalObligation[] {
  return LEGAL_OBLIGATION_REGISTER.filter((o) => o.obligationType === type);
}

export function getObligationsByGate(gateId: string): LegalObligation[] {
  // gateId e.g. "G01", "G03", "G09", "G19"
  return LEGAL_OBLIGATION_REGISTER.filter((o) => o.requiredFor.includes(gateId));
}

// ----------------------------------------------------------------------------
// §49 — Report generator
// ----------------------------------------------------------------------------

export interface LegalObligationRegisterReport {
  moduleId: string;
  section: number;
  generatedAt: string;
  register: LegalObligation[];
  honestState: LegalObligationRegisterHonestState;
  jurisdictions: readonly string[];
  jurisdictionNames: Record<string, string>;
  obligationTypes: readonly LegalObligationType[];
  byJurisdiction: Record<string, { total: number; pending: number; opinionObtained: number; opinionVerified: number }>;
  byObligationType: Record<string, { total: number; pending: number; opinionObtained: number; opinionVerified: number }>;
  byGate: Record<string, { total: number; pending: number; opinionObtained: number; opinionVerified: number }>;
  principles: string[];
  disclaimer: string;
}

export function generateLegalObligationRegisterReport(): LegalObligationRegisterReport {
  const honestState = getLegalObligationRegisterHonestState();

  const byJurisdiction: LegalObligationRegisterReport["byJurisdiction"] = {};
  for (const jx of REGISTER_JURISDICTIONS) {
    const entries = getObligationsByJurisdiction(jx);
    byJurisdiction[jx] = {
      total: entries.length,
      pending: entries.filter((o) => o.status === "OBLIGATION_PENDING").length,
      opinionObtained: entries.filter((o) =>
        o.status === "OPINION_ISSUED" || o.status === "OPINION_VERIFIED",
      ).length,
      opinionVerified: entries.filter((o) => o.status === "OPINION_VERIFIED").length,
    };
  }

  const byObligationType: LegalObligationRegisterReport["byObligationType"] = {};
  for (const t of OBLIGATION_TYPES) {
    const entries = getObligationsByType(t);
    byObligationType[t] = {
      total: entries.length,
      pending: entries.filter((o) => o.status === "OBLIGATION_PENDING").length,
      opinionObtained: entries.filter((o) =>
        o.status === "OPINION_ISSUED" || o.status === "OPINION_VERIFIED",
      ).length,
      opinionVerified: entries.filter((o) => o.status === "OPINION_VERIFIED").length,
    };
  }

  // Gate-indexed rollups — covers G01, G02, G03, G04, G09, G19, "Tax compliance".
  const gates = ["G01", "G02", "G03", "G04", "G09", "G19", "Tax compliance"];
  const byGate: LegalObligationRegisterReport["byGate"] = {};
  for (const g of gates) {
    const entries = getObligationsByGate(g);
    byGate[g] = {
      total: entries.length,
      pending: entries.filter((o) => o.status === "OBLIGATION_PENDING").length,
      opinionObtained: entries.filter((o) =>
        o.status === "OPINION_ISSUED" || o.status === "OPINION_VERIFIED",
      ).length,
      opinionVerified: entries.filter((o) => o.status === "OPINION_VERIFIED").length,
    };
  }

  return {
    moduleId: MODULE_ID,
    section: SECTION,
    generatedAt: new Date().toISOString(),
    register: LEGAL_OBLIGATION_REGISTER,
    honestState,
    jurisdictions: REGISTER_JURISDICTIONS,
    jurisdictionNames: REGISTER_JURISDICTION_NAMES,
    obligationTypes: OBLIGATION_TYPES,
    byJurisdiction,
    byObligationType,
    byGate,
    principles: [
      "The register is INFRASTRUCTURE — ready for real opinions but empty.",
      "Every seeded obligation defaults to OBLIGATION_PENDING; no entry is seeded as OPINION_ISSUED or OPINION_VERIFIED.",
      "The `opinionObtained` flag is ALWAYS false in seed data; only `registerOpinion()` may set it true.",
      "The `evidenceVerified` flag is ALWAYS false in seed data; only `verifyOpinion()` may set it true.",
      "No code-only capability may be represented as institutionally validated (§94).",
      "No technical capability may be represented as legally authorized without evidence (§94).",
      "No production authorization until all defined legal, licensing, contractual, technical, risk, reconciliation and pilot gates are satisfied (§94).",
    ],
    disclaimer:
      "CONTROLLED INSTITUTIONAL DOCUMENT · NOT A LICENSE · NOT A LEGAL OPINION. " +
      "This register is INFRASTRUCTURE. All entries are OBLIGATION_PENDING. " +
      "Production is NOT authorized. No legal opinion has been obtained. " +
      "No jurisdiction has been validated. No license has been issued.",
  };
}

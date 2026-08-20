// ============================================================================
// §49 — MTQ LEGAL & ECONOMIC LIABILITY FRAMEWORK
// ============================================================================
// This module models the legal/economic liability characterization of the
// MTQ instrument across jurisdictions. It is the LEGAL-CHARACTERIZATION
// companion to the §V25.2 reserve mathematical specification in
// `mtq-final-reserve-spec.ts`.
//
// CRITICAL PRINCIPLE (per §74 honest-state discipline):
//   NEVER INVENT LEGAL CLASSIFICATIONS. Every jurisdiction begins life as
//   JURISDICTION_PENDING. Only an external, evidence-backed legal opinion
//   may transition a jurisdiction to LEGAL_OPINION_OBTAINED, and only an
//   external, evidence-backed validation may transition it to VALIDATED.
//   At time of writing, ZERO jurisdictions are validated.
//
// HONEST STATE (§74 — EXACT VALUES):
//   LEGAL_MODEL_DESIGNED             = true
//   LEGAL_REGISTRY_IMPLEMENTED       = true
//   LEGAL_OPINIONS_OBTAINED          = false
//   VALIDATED_JURISDICTIONS          = 0
//
// The text strings inside the registry's speculative legal-nature fields are
// clearly marked as PENDING OPINION. They reflect the engineering team's
// reading of public regulatory materials for triage only; they are NOT legal
// advice and MUST NOT be presented as a definitive classification.
// ============================================================================

export const MODULE_ID = "v25.2-legal-liability-framework-1.0";

/**
 * §49 — Legal classification state for a single jurisdiction.
 *
 * Lifecycle (one-way, evidence-gated):
 *   JURISDICTION_PENDING   → LEGAL_OPINION_OBTAINED  (requires an opinion artifact)
 *   LEGAL_OPINION_OBTAINED → VALIDATED                (requires external validation evidence)
 *
 * Default for every newly seeded jurisdiction is `JURISDICTION_PENDING`.
 * No jurisdiction may be seeded as `VALIDATED`. No jurisdiction may be seeded
 * as `LEGAL_OPINION_OBTAINED`. Both transitions require external evidence.
 */
export type LegalClassification =
  | "JURISDICTION_PENDING"
  | "LEGAL_OPINION_OBTAINED"
  | "VALIDATED";

/**
 * §49 — The 13 dimensions of MTQ legal & economic liability characterization.
 *
 * Every dimension is a free-text field whose contents, in the seeded
 * registry, are explicitly SPECULATIVE / PENDING OPINION. The shape exists
 * so that an obtained opinion can later populate each slot with
 * evidence-backed language without altering the interface.
 */
export interface MTQLegalLiability {
  /** Human-readable jurisdiction name (metadata; not a §49 dimension). */
  jurisdictionName: string;

  // ---- 13 legal/economic liability dimensions (§49) ----

  /**
   * 1. Jurisdiction — canonical jurisdiction code (ISO-3166-1 alpha-2 where
   *    applicable) AND the owning regulator / supervisory authority. Doubles
   *    as the registry key.
   */
  jurisdiction: string;
  /** 2. Legal nature — what the instrument legally IS in this jurisdiction. */
  legalNature: string;
  /** 3. Obligor — who stands behind the redemption promise. */
  obligor: string;
  /** 4. Holder rights — enforceable rights of the holder. */
  holderRights: string;
  /** 5. Redemption — redemption mechanism, frequency, conditions. */
  redemption: string;
  /** 6. Settlement finality — when an MTQ transfer becomes irrevocable. */
  settlementFinality: string;
  /** 7. Creditor treatment — whether/how the holder ranks as a creditor. */
  creditorTreatment: string;
  /** 8. Insolvency treatment — what happens to the holder on obligor insolvency. */
  insolvencyTreatment: string;
  /** 9. Transferability — may the instrument be freely transferred? */
  transferability: string;
  /** 10. Pledgeability — may the instrument be pledged as collateral? */
  pledgeability: string;
  /** 11. Governing law — substantive law chosen to govern the instrument. */
  governingLaw: string;
  /** 12. Dispute resolution — forum / arbitration / courts. */
  disputeResolution: string;
  /** 13. Licensing classification — what license regime applies to issuance. */
  licensingClassification: string;

  // ---- Classification + evidence state (§49 + §74) ----

  /** Current lifecycle classification. Default: JURISDICTION_PENDING. */
  classification: LegalClassification;
  /** Whether an external legal opinion has been obtained. Default: false. */
  legalOpinionsObtained: boolean;
  /** Whether the classification has been externally validated. Default: false. */
  validated: boolean;
  /** Free-form evidence ledger (opinion artifacts, validator identities, dates). */
  evidenceState: {
    legalOpinionArtifact: string | null;
    legalOpinionIssuer: string | null;
    legalOpinionDate: string | null;
    validationArtifact: string | null;
    validator: string | null;
    validationDate: string | null;
    notes: string;
  };
  /** Source attribution for the speculative text (always public-domain triage). */
  source: string;
  /** Date the registry entry was last touched (ISO-8601, design-time only). */
  lastReviewed: string;
}

// ----------------------------------------------------------------------------
// §74 — Honest-state fields (EXACT VALUES, do not mutate without directive)
// ----------------------------------------------------------------------------

export interface LegalLiabilityHonestState {
  LEGAL_MODEL_DESIGNED: true;
  LEGAL_REGISTRY_IMPLEMENTED: true;
  LEGAL_OPINIONS_OBTAINED: false;
  VALIDATED_JURISDICTIONS: 0;
}

/**
 * Returns the §74 honest-state field set. Values are LITERAL and IMMUTABLE
 * until an external legal-opinion campaign actually obtains opinions and a
 * subsequent external validation campaign actually validates jurisdictions.
 * At time of writing, neither has occurred.
 */
export function legalLiabilityHonestState(): LegalLiabilityHonestState {
  return {
    LEGAL_MODEL_DESIGNED: true,
    LEGAL_REGISTRY_IMPLEMENTED: true,
    LEGAL_OPINIONS_OBTAINED: false,
    VALIDATED_JURISDICTIONS: 0,
  };
}

// ----------------------------------------------------------------------------
// §49 — Jurisdiction Registry (8 jurisdictions, ALL JURISDICTION_PENDING)
// ----------------------------------------------------------------------------
//
// The text below is SPECULATIVE TRIAGE copy. It is the engineering team's
// reading of PUBLIC regulatory materials, written to make the registry
// concrete enough to be useful. It is NOT a legal opinion. Every field
// that would constitute a legal assertion is prefixed or suffixed with
// "PENDING OPINION" so that no downstream consumer can mistake it for one.
// ----------------------------------------------------------------------------

const SPECULATIVE_NOTE =
  "PENDING OPINION — speculative engineering triage, not legal advice.";

function pendingEvidenceState(notes: string): MTQLegalLiability["evidenceState"] {
  return {
    legalOpinionArtifact: null,
    legalOpinionIssuer: null,
    legalOpinionDate: null,
    validationArtifact: null,
    validator: null,
    validationDate: null,
    notes: `${SPECULATIVE_NOTE} ${notes}`,
  };
}

export const JURISDICTION_REGISTRY: Record<string, MTQLegalLiability> = {
  US: {
    jurisdiction: "US",
    jurisdictionName: "United States",
    legalNature: `PENDING OPINION — likely treated as a stored-value / settlement instrument (not a deposit, not a security). ${SPECULATIVE_NOTE}`,
    obligor: `PENDING OPINION — obligor is the issuing bank within the Protected Backing Cell, not MITHQAL. MITHQAL performs verification/governance only. ${SPECULATIVE_NOTE}`,
    holderRights: `PENDING OPINION — holder is expected to hold a contractual claim on the earmarked backing, enforceable against the obligor bank, not against MITHQAL. ${SPECULATIVE_NOTE}`,
    redemption: `PENDING OPINION — redemption in fiat at PAR expected via the obligor bank; physical-bullion redemption subject to custody/bank terms. ${SPECULATIVE_NOTE}`,
    settlementFinality: `PENDING OPINION — settlement finality expected to follow the underlying rail (FedNow/wire/stablecoin) and chain finality. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `PENDING OPINION — holder expected to rank as an unsecured creditor of the obligor absent a perfected security interest / segregation. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `PENDING OPINION — on obligor insolvency, holder expected to be an unsecured creditor unless backing is segregated/earmarked under applicable UCC / FDIC rules. ${SPECULATIVE_NOTE}`,
    transferability: `PENDING OPINION — transferability expected to be restricted to KYC/AML-vetted institutional counterparties. ${SPECULATIVE_NOTE}`,
    pledgeability: `PENDING OPINION — pledgeability expected to require obligor consent and perfection under UCC Article 9. ${SPECULATIVE_NOTE}`,
    governingLaw: `PENDING OPINION — governing law expected to be New York or the obligor bank's home US state. ${SPECULATIVE_NOTE}`,
    disputeResolution: `PENDING OPINION — disputes expected to be submitted to US federal/state courts or NY-seated arbitration. ${SPECULATIVE_NOTE}`,
    licensingClassification: `PENDING OPINION — issuance expected to require FinCEN MSB registration, state MTL coverage, and NYDFS BitLicense where applicable. ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      "US triage sources: FinCEN, SEC, CFTC, NYDFS public guidance (read-only)."
    ),
    source: "Public regulatory materials (triage only — not an opinion).",
    lastReviewed: "2026-02-01",
  },

  EU: {
    jurisdiction: "EU",
    jurisdictionName: "European Union / EEA",
    legalNature: `PENDING OPINION — under MiCA, an asset-referenced token (ART) or e-money token (EMT) classification is plausible; not a deposit. ${SPECULATIVE_NOTE}`,
    obligor: `PENDING OPINION — obligor is the authorized ART/EMT issuer within the Protected Backing Cell; MITHQAL is the governance/verification layer only. ${SPECULATIVE_NOTE}`,
    holderRights: `PENDING OPINION — holder is expected to hold a MiCA-art.17 claim against the issuer, including the right to be reimbursed at PAR. ${SPECULATIVE_NOTE}`,
    redemption: `PENDING OPINION — redemption at PAR expected on demand subject to MiCA thresholds and the issuer's terms. ${SPECULATIVE_NOTE}`,
    settlementFinality: `PENDING OPINION — settlement finality expected to follow CSDR / T+1 for cash legs and chain finality for token legs. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `PENDING OPINION — holder expected to rank ahead of ordinary unsecured creditors to the extent of the segregated reserve under MiCA art.48. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `PENDING OPINION — on issuer insolvency, segregated reserve expected to be excluded from the insolvency estate under MiCA art.48/55; remainder unsecured. ${SPECULATIVE_NOTE}`,
    transferability: `PENDING OPINION — transferability expected to MiCA-compliant professional holders; retail transferability depends on classification. ${SPECULATIVE_NOTE}`,
    pledgeability: `PENDING OPINION — pledgeability expected under national civil law (e.g. German BGB §1274) subject to issuer consent. ${SPECULATIVE_NOTE}`,
    governingLaw: `PENDING OPINION — governing law expected to be the law of the issuer's home Member State. ${SPECULATIVE_NOTE}`,
    disputeResolution: `PENDING OPINION — disputes expected in the courts of the issuer's home Member State; EU arbitration clauses plausible. ${SPECULATIVE_NOTE}`,
    licensingClassification: `PENDING OPINION — issuance expected to require EBA-authorized ART issuer authorization (MiCA Title III) and CASP authorization where applicable. ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      "EU triage sources: MiCA Regulation 2023/1114, EBA/ESMA public Q&As (read-only)."
    ),
    source: "Public regulatory materials (triage only — not an opinion).",
    lastReviewed: "2026-02-01",
  },

  UK: {
    jurisdiction: "UK",
    jurisdictionName: "United Kingdom",
    legalNature: `PENDING OPINION — likely treated as a regulated digital payment asset / e-money under UK regime; not a deposit. ${SPECULATIVE_NOTE}`,
    obligor: `PENDING OPINION — obligor is the FCA-registered issuer within the Protected Backing Cell; MITHQAL verifies/governs only. ${SPECULATIVE_NOTE}`,
    holderRights: `PENDING OPINION — holder expected to have a contractual reimbursement right at PAR against the issuer. ${SPECULATIVE_NOTE}`,
    redemption: `PENDING OPINION — redemption at PAR expected on demand subject to issuer terms and FCA rules. ${SPECULATIVE_NOTE}`,
    settlementFinality: `PENDING OPINION — settlement finality expected under UK CSDR-equivalent and chain finality. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `PENDING OPINION — holder expected to rank as a creditor, ahead to the extent of segregated backing under FCA safeguarding. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `PENDING OPINION — on issuer insolvency, safeguarded funds expected to be excluded from the estate under FCA safeguarding rules. ${SPECULATIVE_NOTE}`,
    transferability: `PENDING OPINION — transferability expected to be restricted to FCA-registered/KYC counterparties. ${SPECULATIVE_NOTE}`,
    pledgeability: `PENDING OPINION — pledgeability expected under English law subject to issuer consent and perfection. ${SPECULATIVE_NOTE}`,
    governingLaw: `PENDING OPINION — governing law expected to be English law. ${SPECULATIVE_NOTE}`,
    disputeResolution: `PENDING OPINION — disputes expected in English courts or LCIA arbitration. ${SPECULATIVE_NOTE}`,
    licensingClassification: `PENDING OPINION — issuance expected to require FCA crypto-asset registration and likely e-money / payment-systems authorization. ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      "UK triage sources: FCA Cryptoasset Register, e-money regs 2011, MLR 2017 (read-only)."
    ),
    source: "Public regulatory materials (triage only — not an opinion).",
    lastReviewed: "2026-02-01",
  },

  CH: {
    jurisdiction: "CH",
    jurisdictionName: "Switzerland",
    legalNature: `PENDING OPINION — likely classified as a qualifying Swiss stablecoin / tokenized payment instrument under FinSA, not a bank deposit. ${SPECULATIVE_NOTE}`,
    obligor: `PENDING OPINION — obligor is the FINMA-licensed issuer within the Protected Backing Cell; MITHQAL governs/verifies only. ${SPECULATIVE_NOTE}`,
    holderRights: `PENDING OPINION — holder expected to hold a contractual claim against the issuer; FinSA prospectus duties may apply. ${SPECULATIVE_NOTE}`,
    redemption: `PENDING OPINION — redemption at PAR expected subject to issuer terms and FINMA conditions. ${SPECULATIVE_NOTE}`,
    settlementFinality: `PENDING OPINION — settlement finality expected under Swiss FIA / SIC rules where applicable, else chain finality. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `PENDING OPINION — holder expected to rank as a preferential creditor to the extent of segregated backing under Swiss banking segregation. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `PENDING OPINION — on issuer insolvency, segregated backing expected to be protected under art. 37a Swiss Banking Act where bank-held. ${SPECULATIVE_NOTE}`,
    transferability: `PENDING OPINION — transferability expected to be limited to professional clients per FinSA. ${SPECULATIVE_NOTE}`,
    pledgeability: `PENDING OPINION — pledgeability expected under Swiss OR art. 901 (cession) subject to issuer consent. ${SPECULATIVE_NOTE}`,
    governingLaw: `PENDING OPINION — governing law expected to be Swiss substantive law. ${SPECULATIVE_NOTE}`,
    disputeResolution: `PENDING OPINION — disputes expected in Swiss courts or Zurich/Geneva-seated arbitration. ${SPECULATIVE_NOTE}`,
    licensingClassification: `PENDING OPINION — issuance expected to require FINMA authorization (bank-license or fintech-license) where the token is deposit-like. ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      "CH triage sources: FINMA guidance 2018/2021, FinSA, Swiss Banking Act (read-only)."
    ),
    source: "Public regulatory materials (triage only — not an opinion).",
    lastReviewed: "2026-02-01",
  },

  SG: {
    jurisdiction: "SG",
    jurisdictionName: "Singapore",
    legalNature: `PENDING OPINION — likely a single-currency stablecoin (SCS) under MAS SCS framework or a digital payment token, not a deposit. ${SPECULATIVE_NOTE}`,
    obligor: `PENDING OPINION — obligor is the MAS-licensed issuer within the Protected Backing Cell; MITHQAL verifies/governs only. ${SPECULATIVE_NOTE}`,
    holderRights: `PENDING OPINION — holder expected to hold a redemption-at-PAR claim against the issuer under MAS SCS conditions. ${SPECULATIVE_NOTE}`,
    redemption: `PENDING OPINION — redemption at PAR within 5 business days expected under MAS SCS framework. ${SPECULATIVE_NOTE}`,
    settlementFinality: `PENDING OPINION — settlement finality expected to follow MAS-designated payment systems or chain finality. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `PENDING OPINION — holder expected to be a preferential creditor to extent of segregated reserve under MAS SCS rules. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `PENDING OPINION — on issuer insolvency, segregated reserve expected to be held on trust / segregated per MAS SCS conditions. ${SPECULATIVE_NOTE}`,
    transferability: `PENDING OPINION — transferability expected to non-prohibited persons under MAS PD/PDPA rules. ${SPECULATIVE_NOTE}`,
    pledgeability: `PENDING OPINION — pledgeability expected under Singapore law subject to issuer consent. ${SPECULATIVE_NOTE}`,
    governingLaw: `PENDING OPINION — governing law expected to be Singapore law. ${SPECULATIVE_NOTE}`,
    disputeResolution: `PENDING OPINION — disputes expected in Singapore courts or SIAC arbitration. ${SPECULATIVE_NOTE}`,
    licensingClassification: `PENDING OPINION — issuance expected to require MAS SCS issuer approval and/or DPT license under the PSA. ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      "SG triage sources: MAS SCS framework 2023, PSA 2019 (read-only)."
    ),
    source: "Public regulatory materials (triage only — not an opinion).",
    lastReviewed: "2026-02-01",
  },

  AE: {
    jurisdiction: "AE",
    jurisdictionName: "United Arab Emirates",
    legalNature: `PENDING OPINION — likely a stored-value facility (SVF) / payment token under CBUAE regime; not a deposit. ${SPECULATIVE_NOTE}`,
    obligor: `PENDING OPINION — obligor is the CBUAE-licensed issuer within the Protected Backing Cell; MITHQAL verifies/governs only. ${SPECULATIVE_NOTE}`,
    holderRights: `PENDING OPINION — holder expected to have a reimbursement right at PAR against the issuer per CBUAE SVF rules. ${SPECULATIVE_NOTE}`,
    redemption: `PENDING OPINION — redemption at PAR expected subject to CBUAE SVF conditions and issuer terms. ${SPECULATIVE_NOTE}`,
    settlementFinality: `PENDING OPINION — settlement finality expected under CBUAE payment-systems rules or chain finality. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `PENDING OPINION — holder expected to be a preferential creditor to the extent of segregated backing per CBUAE rules. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `PENDING OPINION — on issuer insolvency, segregated backing expected to be segregated under CBUAE SVF rules; remainder unsecured. ${SPECULATIVE_NOTE}`,
    transferability: `PENDING OPINION — transferability expected to be restricted to KYC-cleared counterparties per UAE AML rules. ${SPECULATIVE_NOTE}`,
    pledgeability: `PENDING OPINION — pledgeability expected under UAE Civil Transactions Law / ADGM/DFSA commercial law subject to issuer consent. ${SPECULATIVE_NOTE}`,
    governingLaw: `PENDING OPINION — governing law expected to be UAE law (onshore) or ADGM/DFSA law (financial free zone). ${SPECULATIVE_NOTE}`,
    disputeResolution: `PENDING OPINION — disputes expected in UAE courts or DIFC/ADGM arbitration. ${SPECULATIVE_NOTE}`,
    licensingClassification: `PENDING OPINION — issuance expected to require CBUAE SVF license and/or VARA/ADGM virtual-asset authorization. ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      "AE triage sources: CBUAE SVF Regulation, VARA rulebook, ADGM FSRA (read-only)."
    ),
    source: "Public regulatory materials (triage only — not an opinion).",
    lastReviewed: "2026-02-01",
  },

  SA: {
    jurisdiction: "SA",
    jurisdictionName: "Saudi Arabia",
    legalNature: `PENDING OPINION — likely treated as a payment instrument / experimental stablecoin under SAMA sandbox; not a deposit. ${SPECULATIVE_NOTE}`,
    obligor: `PENDING OPINION — obligor is the SAMA-authorized issuer within the Protected Backing Cell; MITHQAL verifies/governs only. ${SPECULATIVE_NOTE}`,
    holderRights: `PENDING OPINION — holder expected to hold a reimbursement claim at PAR against the issuer; subject to SAMA sandbox terms. ${SPECULATIVE_NOTE}`,
    redemption: `PENDING OPINION — redemption at PAR expected subject to SAMA conditions; cross-border redemption restricted. ${SPECULATIVE_NOTE}`,
    settlementFinality: `PENDING OPINION — settlement finality expected under SAMA payment-systems rules or chain finality. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `PENDING OPINION — holder expected to be a preferential creditor to the extent of segregated backing; Shariah compliance expected. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `PENDING OPINION — on issuer insolvency, segregated backing expected to be ring-fenced per SAMA rules; remainder unsecured. ${SPECULATIVE_NOTE}`,
    transferability: `PENDING OPINION — transferability expected to be restricted to SAMA-cleared institutional counterparties. ${SPECULATIVE_NOTE}`,
    pledgeability: `PENDING OPINION — pledgeability expected under Saudi Civil Transactions Law subject to issuer consent and Shariah compliance. ${SPECULATIVE_NOTE}`,
    governingLaw: `PENDING OPINION — governing law expected to be Saudi Arabian law (Shariah-compliant). ${SPECULATIVE_NOTE}`,
    disputeResolution: `PENDING OPINION — disputes expected in Saudi courts or GCC Commercial Arbitration Centre. ${SPECULATIVE_NOTE}`,
    licensingClassification: `PENDING OPINION — issuance expected to require SAMA payment-services license and/or sandbox approval. ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      "SA triage sources: SAMA Payment Systems Law, sandbox rules (read-only)."
    ),
    source: "Public regulatory materials (triage only — not an opinion).",
    lastReviewed: "2026-02-01",
  },

  JP: {
    jurisdiction: "JP",
    jurisdictionName: "Japan",
    legalNature: `PENDING OPINION — likely a crypto-asset / electronically recorded monetary claim under the Payment Services Act; not a deposit. ${SPECULATIVE_NOTE}`,
    obligor: `PENDING OPINION — obligor is the JFSA-registered issuer within the Protected Backing Cell; MITHQAL verifies/governs only. ${SPECULATIVE_NOTE}`,
    holderRights: `PENDING OPINION — holder expected to hold a redemption claim at PAR against the issuer per PSA art. 3-3. ${SPECULATIVE_NOTE}`,
    redemption: `PENDING OPINION — redemption at PAR expected subject to issuer terms and JFSA conditions. ${SPECULATIVE_NOTE}`,
    settlementFinality: `PENDING OPINION — settlement finality expected under JFSA-designated payment systems or chain finality. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `PENDING OPINION — holder expected to be a preferential creditor to the extent of the issuer's segregated assets under PSA. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `PENDING OPINION — on issuer insolvency, segregated assets expected to be excluded from the bankruptcy estate under PSA trust rules. ${SPECULATIVE_NOTE}`,
    transferability: `PENDING OPINION — transferability expected to JFSA-cleared counterparties; transfers to sanctioned parties prohibited. ${SPECULATIVE_NOTE}`,
    pledgeability: `PENDING OPINION — pledgeability expected under Japanese Civil Code art. 364 (assignment) subject to issuer consent. ${SPECULATIVE_NOTE}`,
    governingLaw: `PENDING OPINION — governing law expected to be Japanese law. ${SPECULATIVE_NOTE}`,
    disputeResolution: `PENDING OPINION — disputes expected in Tokyo courts or JCAA arbitration. ${SPECULATIVE_NOTE}`,
    licensingClassification: `PENDING OPINION — issuance expected to require JFSA crypto-asset exchange registration and stablecoin-issuer authorization (PSA Title III-3). ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      "JP triage sources: Payment Services Act (2023 stablecoin amendments), JFSA guidelines (read-only)."
    ),
    source: "Public regulatory materials (triage only — not an opinion).",
    lastReviewed: "2026-02-01",
  },
};

// ----------------------------------------------------------------------------
// §49 — Registry query + lifecycle functions
// ----------------------------------------------------------------------------

/** Returns the default PENDING entry for an unknown jurisdiction. */
function pendingPlaceholder(code: string): MTQLegalLiability {
  return {
    jurisdiction: code.toUpperCase(),
    jurisdictionName: `Unknown jurisdiction (${code})`,
    legalNature: `JURISDICTION_PENDING — no entry seeded for ${code}. ${SPECULATIVE_NOTE}`,
    obligor: `JURISDICTION_PENDING — obligor not characterized. ${SPECULATIVE_NOTE}`,
    holderRights: `JURISDICTION_PENDING — holder rights not characterized. ${SPECULATIVE_NOTE}`,
    redemption: `JURISDICTION_PENDING — redemption framework not characterized. ${SPECULATIVE_NOTE}`,
    settlementFinality: `JURISDICTION_PENDING — settlement finality not characterized. ${SPECULATIVE_NOTE}`,
    creditorTreatment: `JURISDICTION_PENDING — creditor treatment not characterized. ${SPECULATIVE_NOTE}`,
    insolvencyTreatment: `JURISDICTION_PENDING — insolvency treatment not characterized. ${SPECULATIVE_NOTE}`,
    transferability: `JURISDICTION_PENDING — transferability not characterized. ${SPECULATIVE_NOTE}`,
    pledgeability: `JURISDICTION_PENDING — pledgeability not characterized. ${SPECULATIVE_NOTE}`,
    governingLaw: `JURISDICTION_PENDING — governing law not characterized. ${SPECULATIVE_NOTE}`,
    disputeResolution: `JURISDICTION_PENDING — dispute resolution not characterized. ${SPECULATIVE_NOTE}`,
    licensingClassification: `JURISDICTION_PENDING — licensing classification not characterized. ${SPECULATIVE_NOTE}`,
    classification: "JURISDICTION_PENDING",
    legalOpinionsObtained: false,
    validated: false,
    evidenceState: pendingEvidenceState(
      `No seeded registry entry for jurisdiction ${code}. Conservative pending placeholder returned.`
    ),
    source: "None — placeholder for unknown jurisdiction.",
    lastReviewed: "—",
  };
}

/**
 * §49 — Returns the registry entry for a jurisdiction, or a conservative
 * PENDING placeholder when the jurisdiction is not seeded. NEVER returns null;
 * NEVER returns an invented classification.
 */
export function getJurisdictionLegalStatus(jurisdiction: string): MTQLegalLiability {
  const code = jurisdiction.toUpperCase();
  return JURISDICTION_REGISTRY[code] ?? pendingPlaceholder(code);
}

/**
 * Shape of an external legal opinion artifact used to transition a
 * jurisdiction out of JURISDICTION_PENDING.
 */
export interface LegalOpinion {
  /** Opinion issuer (law firm / regulator). */
  issuer: string;
  /** ISO-8601 date the opinion was issued. */
  date: string;
  /** Stable identifier / URL / hash for the opinion artifact. */
  artifact: string;
  /** The 13-dimension opinion text, populated from the actual opinion. */
  dimensions: Omit<
    MTQLegalLiability,
    | "jurisdiction"
    | "jurisdictionName"
    | "classification"
    | "legalOpinionsObtained"
    | "validated"
    | "evidenceState"
    | "source"
    | "lastReviewed"
  >;
  /** Free-form notes from the opinion issuer. */
  notes: string;
}

/**
 * §49 — Registers an external legal opinion against a jurisdiction.
 *
 * Lifecycle rule:
 *   JURISDICTION_PENDING  →  LEGAL_OPINION_OBTAINED   (allowed when evidence provided)
 *   LEGAL_OPINION_OBTAINED → LEGAL_OPINION_OBTAINED   (idempotent refresh; no VALIDATED jump)
 *   VALIDATED              →  (no-op; validated jurisdictions cannot be reset by opinion)
 *
 * This function NEVER transitions to VALIDATED. Only `validateJurisdiction`
 * may do that, and only when validation evidence is provided.
 *
 * Returns the updated entry, or the existing entry unchanged if the opinion
 * is missing required fields or the jurisdiction is already VALIDATED.
 */
export function registerLegalOpinion(
  jurisdiction: string,
  opinion: Partial<LegalOpinion>
): MTQLegalLiability {
  const code = jurisdiction.toUpperCase();
  const current = JURISDICTION_REGISTRY[code] ?? pendingPlaceholder(code);

  // VALIDATED is terminal — opinion cannot reset it.
  if (current.classification === "VALIDATED") {
    return current;
  }

  // An opinion must carry at least an issuer, a date, and an artifact reference.
  const hasEvidence = Boolean(
    opinion.issuer && opinion.date && opinion.artifact
  );

  if (!hasEvidence) {
    // No evidence → stay PENDING (or current). Never invent.
    return current;
  }

  const updated: MTQLegalLiability = {
    ...current,
    ...(opinion.dimensions ?? {}),
    classification: "LEGAL_OPINION_OBTAINED",
    legalOpinionsObtained: true,
    // validated flag is preserved (false here, since VALIDATED is terminal).
    validated: current.validated,
    evidenceState: {
      legalOpinionArtifact: opinion.artifact ?? null,
      legalOpinionIssuer: opinion.issuer ?? null,
      legalOpinionDate: opinion.date ?? null,
      validationArtifact: current.evidenceState.validationArtifact,
      validator: current.evidenceState.validator,
      validationDate: current.evidenceState.validationDate,
      notes: opinion.notes ?? current.evidenceState.notes,
    },
    source: `External legal opinion: ${opinion.issuer} (${opinion.date}).`,
    lastReviewed: opinion.date ?? current.lastReviewed,
  };

  // Mutate the registry in-place so that subsequent reads see the new state.
  JURISDICTION_REGISTRY[code] = updated;
  return updated;
}

/**
 * Shape of external validation evidence used to transition a jurisdiction
 * to VALIDATED. Validation may only occur AFTER a legal opinion has been
 * registered (i.e. the jurisdiction is LEGAL_OPINION_OBTAINED).
 */
export interface ValidationEvidence {
  /** External validator identity (regulator / auditor / independent counsel). */
  validator: string;
  /** ISO-8601 date validation was completed. */
  date: string;
  /** Stable identifier / URL / hash for the validation artifact. */
  artifact: string;
  /** Free-form notes from the validator. */
  notes: string;
}

/**
 * §49 — Transitions a jurisdiction to VALIDATED using external validation
 * evidence. Only callable when:
 *   1. The jurisdiction is currently LEGAL_OPINION_OBTAINED.
 *   2. Validation evidence (validator + date + artifact) is provided.
 *
 * Returns the updated entry, or the existing entry unchanged when the
 * preconditions are not met. NEVER invents a validation.
 */
export function validateJurisdiction(
  jurisdiction: string,
  evidence: Partial<ValidationEvidence>
): MTQLegalLiability {
  const code = jurisdiction.toUpperCase();
  const current = JURISDICTION_REGISTRY[code] ?? pendingPlaceholder(code);

  // VALIDATED is terminal — idempotent return.
  if (current.classification === "VALIDATED") {
    return current;
  }

  // Validation requires a prior legal opinion.
  if (!current.legalOpinionsObtained) {
    return current;
  }

  const hasValidationEvidence = Boolean(
    evidence.validator && evidence.date && evidence.artifact
  );

  if (!hasValidationEvidence) {
    return current;
  }

  const updated: MTQLegalLiability = {
    ...current,
    classification: "VALIDATED",
    legalOpinionsObtained: true,
    validated: true,
    evidenceState: {
      ...current.evidenceState,
      validationArtifact: evidence.artifact ?? null,
      validator: evidence.validator ?? null,
      validationDate: evidence.date ?? null,
      notes: `${current.evidenceState.notes} | Validation: ${evidence.notes ?? ""}`,
    },
    source: `${current.source} | Validated by ${evidence.validator} (${evidence.date}).`,
    lastReviewed: evidence.date ?? current.lastReviewed,
  };

  JURISDICTION_REGISTRY[code] = updated;
  return updated;
}

/**
 * §49 — Returns all jurisdictions currently classified as JURISDICTION_PENDING.
 * At time of writing, this includes ALL 8 seeded jurisdictions.
 */
export function listPendingJurisdictions(): MTQLegalLiability[] {
  return Object.values(JURISDICTION_REGISTRY).filter(
    (entry) => entry.classification === "JURISDICTION_PENDING"
  );
}

/**
 * §49 — Returns all jurisdictions currently classified as VALIDATED.
 * At time of writing, this list is EMPTY (validatedCount = 0).
 */
export function listValidatedJurisdictions(): MTQLegalLiability[] {
  return Object.values(JURISDICTION_REGISTRY).filter(
    (entry) => entry.classification === "VALIDATED"
  );
}

/**
 * §49 — Returns a summary of holder rights for a jurisdiction. Until the
 * jurisdiction is VALIDATED, the summary is explicitly PENDING OPINION and
 * MUST NOT be presented as a definitive holder-rights characterization.
 */
export function holderRightsSummary(jurisdiction: string): {
  jurisdiction: string;
  classification: LegalClassification;
  holderRights: string;
  definitive: boolean;
} {
  const entry = getJurisdictionLegalStatus(jurisdiction);
  return {
    jurisdiction: entry.jurisdiction,
    classification: entry.classification,
    holderRights: entry.holderRights,
    definitive: entry.classification === "VALIDATED",
  };
}

/**
 * §49 — Returns the redemption framework for a jurisdiction. Until VALIDATED,
 * the framework is explicitly PENDING OPINION.
 */
export function redemptionFramework(jurisdiction: string): {
  jurisdiction: string;
  classification: LegalClassification;
  redemption: string;
  definitive: boolean;
} {
  const entry = getJurisdictionLegalStatus(jurisdiction);
  return {
    jurisdiction: entry.jurisdiction,
    classification: entry.classification,
    redemption: entry.redemption,
    definitive: entry.classification === "VALIDATED",
  };
}

/**
 * §49 — Returns the insolvency treatment for a jurisdiction. Until VALIDATED,
 * the treatment is explicitly PENDING OPINION.
 */
export function insolvencyTreatment(jurisdiction: string): {
  jurisdiction: string;
  classification: LegalClassification;
  insolvencyTreatment: string;
  definitive: boolean;
} {
  const entry = getJurisdictionLegalStatus(jurisdiction);
  return {
    jurisdiction: entry.jurisdiction,
    classification: entry.classification,
    insolvencyTreatment: entry.insolvencyTreatment,
    definitive: entry.classification === "VALIDATED",
  };
}

// ----------------------------------------------------------------------------
// §49 — Executive report
// ----------------------------------------------------------------------------

/** The 13 legal/economic liability dimensions, in canonical order. */
export const LEGAL_LIABILITY_DIMENSIONS = [
  "jurisdiction",
  "legalNature",
  "obligor",
  "holderRights",
  "redemption",
  "settlementFinality",
  "creditorTreatment",
  "insolvencyTreatment",
  "transferability",
  "pledgeability",
  "governingLaw",
  "disputeResolution",
  "licensingClassification",
] as const;

export interface LegalLiabilityReport {
  moduleId: typeof MODULE_ID;
  dimensions: readonly string[];
  jurisdictionRegistry: Record<string, MTQLegalLiability>;
  pendingCount: number;
  opinionObtainedCount: number;
  validatedCount: number;
  honestState: LegalLiabilityHonestState;
  principle: "Never invent legal classifications";
  finalStatus: string;
}

/**
 * §49 — Generates the executive legal-liability report.
 *
 * The `validatedCount` field is computed from the live registry state. At
 * time of writing it is 0. If it is ever > 0, it is because an external
 * validation campaign registered evidence via `validateJurisdiction`; this
 * module never auto-validates.
 */
export function generateLegalLiabilityReport(): LegalLiabilityReport {
  const all = Object.values(JURISDICTION_REGISTRY);
  const pendingCount = all.filter(
    (e) => e.classification === "JURISDICTION_PENDING"
  ).length;
  const opinionObtainedCount = all.filter(
    (e) => e.classification === "LEGAL_OPINION_OBTAINED"
  ).length;
  const validatedCount = all.filter(
    (e) => e.classification === "VALIDATED"
  ).length;

  // §74 honest-state: the DECLARED floor is 0 (no jurisdiction has been
  // externally validated at time of writing). The report's `validatedCount`
  // reflects the LIVE registry state — it is 0 in the freshly-loaded module
  // and may only become >0 when external evidence is registered via
  // `validateJurisdiction`. This module NEVER auto-validates.
  const declared = legalLiabilityHonestState();
  const liveValidated = validatedCount;

  const finalStatus =
    validatedCount === 0
      ? "LEGAL FRAMEWORK DESIGNED — ZERO JURISDICTIONS VALIDATED — PENDING EXTERNAL LEGAL OPINIONS"
      : `LEGAL FRAMEWORK DESIGNED — ${validatedCount} JURISDICTION(S) VALIDATED — REMAINING PENDING EXTERNAL OPINIONS`;

  return {
    moduleId: MODULE_ID,
    dimensions: LEGAL_LIABILITY_DIMENSIONS,
    jurisdictionRegistry: JURISDICTION_REGISTRY,
    pendingCount,
    opinionObtainedCount,
    validatedCount: liveValidated,
    honestState: declared,
    principle: "Never invent legal classifications",
    finalStatus,
  };
}

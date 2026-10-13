// src/lib/accounting-prudential-tax-framework.ts
//
// MITHQAL v25.3.16 — CANONICAL INSTITUTIONAL ACCOUNTING, PRUDENTIAL & TAX
// CLASSIFICATION FRAMEWORK (single source of truth)
// Per PROMPT 25:
//   "Add a canonical Institutional Accounting, Prudential & Tax Classification
//    Framework. Do NOT assert a classification that has not been independently
//    validated. Create explicit evidence-gated states for 10 areas. Create a
//    decision matrix: DESIGN HYPOTHESIS → COUNSEL VIEW → ACCOUNTING VIEW →
//    PRUDENTIAL VIEW → EXTERNAL VALIDATION. Every unresolved item must remain
//    PENDING_EXTERNAL_VALIDATION."

// === Evidence-Gated State (per directive: "Do NOT assert a classification
//     that has not been independently validated") ===

export type EvidenceGatedState =
  | "DESIGN_HYPOTHESIS" // the design assumes X, but no validation yet
  | "COUNSEL_VIEW" // legal counsel has provided a view (not yet externally validated)
  | "ACCOUNTING_VIEW" // accounting firm has provided a view (not yet externally validated)
  | "PRUDENTIAL_VIEW" // prudential regulator/advisor has provided a view
  | "EXTERNAL_VALIDATION" // independently validated by auditor/regulator
  | "PENDING_EXTERNAL_VALIDATION"; // unresolved — MUST remain in this state

// === The 10 Classification Areas (per directive) ===

export type ClassificationAreaId =
  | "MTQ_ASSET_LIABILITY_CLASSIFICATION"
  | "HOLDER_VS_ISSUER_EXPOSURE"
  | "REDEMPTION_OBLIGATION"
  | "BANK_INTERBANK_EXPOSURE"
  | "RESERVE_RECOGNITION"
  | "LIQUIDITY_TREATMENT"
  | "CAPITAL_RWA_IMPLICATIONS"
  | "SAFEGUARDING_TREATMENT"
  | "TAX_ACCOUNTING_TREATMENT"
  | "JURISDICTIONAL_TAX_TREATMENT";

// === Decision Matrix Entry (per directive) ===

export interface DecisionMatrixEntry {
  areaId: ClassificationAreaId;
  areaName: string;
  // DESIGN HYPOTHESIS — what the design assumes
  designHypothesis: string;
  // COUNSEL VIEW — what legal counsel says (PENDING if not obtained)
  counselView: {
    status: EvidenceGatedState;
    opinion?: string;
    counselReference?: string;
    counselDate?: string;
  };
  // ACCOUNTING VIEW — what the accounting firm says
  accountingView: {
    status: EvidenceGatedState;
    opinion?: string;
    accountingReference?: string;
    accountingDate?: string;
  };
  // PRUDENTIAL VIEW — what the prudential regulator/advisor says
  prudentialView: {
    status: EvidenceGatedState;
    opinion?: string;
    prudentialReference?: string;
    prudentialDate?: string;
  };
  // EXTERNAL VALIDATION — what the independent auditor/regulator says
  externalValidation: {
    status: EvidenceGatedState;
    opinion?: string;
    validationReference?: string;
    validationDate?: string;
    validator?: string;
  };
  // The current resolved state (the highest validated state achieved)
  currentState: EvidenceGatedState;
  // Whether this classification has been externally validated (true only if EXTERNAL_VALIDATION)
  isExternallyValidated: boolean;
  // Honest note
  honestNote: string;
}

// === The 10-Area Decision Matrix ===
// Per directive: "Do NOT assert a classification that has not been independently validated."
// All 10 areas start as PENDING_EXTERNAL_VALIDATION (honest — no classifications have been
// independently validated yet).

export const DECISION_MATRIX: DecisionMatrixEntry[] = [
  {
    areaId: "MTQ_ASSET_LIABILITY_CLASSIFICATION",
    areaName: "MTQ Asset/Liability Classification",
    designHypothesis:
      "MTQ is a permissioned, institutional, closed-loop settlement unit (per v25.3.5 mtq-economic-definition). Design assumes MTQ is NOT a deposit, NOT e-money, NOT a security, NOT a payment token — but this is a DESIGN HYPOTHESIS, not a legal classification.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Per PROMPT 25: 'Do NOT assert a classification that has not been independently validated.' MTQ's legal classification (deposit / e-money / stored-value / security / payment token / digital asset) has NOT been independently validated. Per v25.3.5 mtq-economic-definition, legalClassification.status = PENDING_VALIDATION. This framework DOES NOT assert a classification — it tracks the validation progress.",
  },
  {
    areaId: "HOLDER_VS_ISSUER_EXPOSURE",
    areaName: "Holder vs Issuer Exposure",
    designHypothesis:
      "Design assumes: holder exposure = settlement risk (MTQ not received); issuer exposure = redemption obligation (MTQ must be redeemed). These are design hypotheses, not validated classifications.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Holder vs issuer exposure classification requires independent legal + accounting validation. NOT yet validated.",
  },
  {
    areaId: "REDEMPTION_OBLIGATION",
    areaName: "Redemption Obligation",
    designHypothesis:
      "Design assumes: redemption obligor is determined by the legal structure of the underlying reserve category + jurisdiction (per v25.3.6 reserve domains + v25.3.9 obligation registry). This is a design hypothesis.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Redemption obligation classification requires independent legal validation. The obligation registry (v25.3.9) defines the STRUCTURE but not the LEGAL CLASSIFICATION of the redemption obligation. NOT yet validated.",
  },
  {
    areaId: "BANK_INTERBANK_EXPOSURE",
    areaName: "Bank/Interbank Exposure",
    designHypothesis:
      "Design assumes: bank exposure = counterparty risk to the participating bank; interbank exposure = settlement risk between banks via MITHQAL. These are design hypotheses.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Bank/interbank exposure classification requires independent prudential validation (e.g., Basel III treatment). NOT yet validated.",
  },
  {
    areaId: "RESERVE_RECOGNITION",
    areaName: "Reserve Recognition",
    designHypothesis:
      "Design assumes: reserves are recognized per v25.3.6 reserve domains (Settlement Liquidity vs Strategic Resilience Reserve). The design assumes reserves are NOT commingled and gold is in the resilience domain. These are design hypotheses.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Reserve recognition (whether assets qualify as 'reserves' under applicable accounting standards) requires independent accounting validation. NOT yet validated.",
  },
  {
    areaId: "LIQUIDITY_TREATMENT",
    areaName: "Liquidity Treatment",
    designHypothesis:
      "Design assumes: liquidity treatment follows v25.3.5 Required Coverage formula (Direct Settlement Backing + Risk Buffer) + v25.3.9 tolerance policies (6 separate). The design assumes HQLA classification is NOT asserted. These are design hypotheses.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Liquidity treatment (HQLA classification, LCR/NSFR treatment) requires independent prudential validation. NOT yet validated. The 130% strategic target (per v25.3.5) is NOT a regulatory requirement.",
  },
  {
    areaId: "CAPITAL_RWA_IMPLICATIONS",
    areaName: "Capital/RWA Implications",
    designHypothesis:
      "Design assumes: capital/RWA implications depend on MTQ's legal classification (which is PENDING). The design does NOT assert a specific RWA weight. This is a design hypothesis.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Capital/RWA implications require MTQ legal classification (which is PENDING) + independent prudential validation (Basel III RWA treatment). NOT yet validated.",
  },
  {
    areaId: "SAFEGUARDING_TREATMENT",
    areaName: "Safeguarding Treatment",
    designHypothesis:
      "Design assumes: safeguarding follows v25.3.6 reserve domains (assets are segregated, not commingled) + v25.3.9 obligation registry (insolvency treatment per obligation). These are design hypotheses.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Safeguarding treatment (whether assets are legally segregated, bankruptcy-remote) requires independent legal validation. NOT yet validated.",
  },
  {
    areaId: "TAX_ACCOUNTING_TREATMENT",
    areaName: "Tax/Accounting Treatment",
    designHypothesis:
      "Design assumes: tax/accounting treatment depends on MTQ's legal classification (which is PENDING). The design does NOT assert a specific tax treatment. This is a design hypothesis.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Tax/accounting treatment requires MTQ legal classification (which is PENDING) + independent tax counsel validation. NOT yet validated.",
  },
  {
    areaId: "JURISDICTIONAL_TAX_TREATMENT",
    areaName: "Jurisdictional Tax Treatment",
    designHypothesis:
      "Design assumes: jurisdictional tax treatment varies by jurisdiction (per v25.3.7 institutional operating model + v25.3.8 finality model settlement mode). The design does NOT assert a specific jurisdictional tax treatment. This is a design hypothesis.",
    counselView: { status: "PENDING_EXTERNAL_VALIDATION" },
    accountingView: { status: "PENDING_EXTERNAL_VALIDATION" },
    prudentialView: { status: "PENDING_EXTERNAL_VALIDATION" },
    externalValidation: { status: "PENDING_EXTERNAL_VALIDATION" },
    currentState: "PENDING_EXTERNAL_VALIDATION",
    isExternallyValidated: false,
    honestNote:
      "Jurisdictional tax treatment requires per-jurisdiction tax counsel validation. NOT yet validated for any jurisdiction.",
  },
];

// === API ===

export function getDecisionMatrixEntry(
  areaId: ClassificationAreaId
): DecisionMatrixEntry | undefined {
  return DECISION_MATRIX.find((e) => e.areaId === areaId);
}

export function getExternallyValidatedCount(): number {
  return DECISION_MATRIX.filter((e) => e.isExternallyValidated).length;
}

export function getPendingValidationCount(): number {
  return DECISION_MATRIX.filter(
    (e) => e.currentState === "PENDING_EXTERNAL_VALIDATION"
  ).length;
}

// === Status ===
export const FRAMEWORK_STATUS = "ACTIVE";
export const FRAMEWORK_VERSION = "v25.3.16-U1-1.0";
export const FRAMEWORK_SOURCE = "src/lib/accounting-prudential-tax-framework.ts";
export const CLASSIFICATION_AREA_COUNT = 10;

// === Honest State ===
export const NO_UNVALIDATED_ASSERTION_RULE =
  "Per PROMPT 25: 'Do NOT assert a classification that has not been independently validated.' All 10 classification areas are PENDING_EXTERNAL_VALIDATION. No classification is asserted.";
export const ALL_ITEMS_PENDING =
  "All 10 classification areas are PENDING_EXTERNAL_VALIDATION. 0 are EXTERNAL_VALIDATION. This is the honest state — no classifications have been independently validated yet.";

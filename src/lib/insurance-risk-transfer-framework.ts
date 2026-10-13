// src/lib/insurance-risk-transfer-framework.ts
//
// MITHQAL v25.3.18 — INSURANCE / RISK-TRANSFER FRAMEWORK (single source of truth)
// Per PROMPT 31:
//   "Create a structured insurance and contractual risk-transfer framework.
//    Evaluate, without assuming availability: cyber insurance, technology E&O,
//    crime/fidelity, D&O, custody/asset risks, business interruption, other.
//    For every category define: risk covered, excluded risk, insured party,
//    policy status, required limit, deductible/retention, jurisdiction,
//    broker/carrier evidence, contract dependency, validation state.
//    Use: DESIGNED -> QUOTED -> BOUND -> ACTIVE.
//    Never represent insurance as a substitute for legal segregation,
//    capital, liquidity or operational controls."
//
// CHANGE REQUEST: CR-2026-007 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine
//   - No existing functionality removed
//   - All insurance categories are evaluated WITHOUT assuming availability
//   - All categories are DESIGNED (none QUOTED/BOUND/ACTIVE) — honest state
//   - NO_SUBSTITUTE_RULE: insurance is NOT a substitute for legal segregation,
//     capital, liquidity or operational controls
// Cross-references prior canonical modules:
//   - v25.3.5 K2/K3 (reserve coverage logic + Required Coverage formula + Risk Buffer)
//   - v25.3.6 K4 (reserve domains — Settlement Liquidity vs Strategic Resilience + anti-double-counting)
//   - v25.3.7 M1 (institutional operating model — JOZOUR_LLC_NJ bank-facing counterparty)
//   - v25.3.7 M2 (finality trust domains — Domain A/B/C)
//   - v25.3.13 S1 (SettlementContinuityFabric — 9 events x 7-stage lifecycle)
//   - v25.3.15 T2 (Architecture Freeze — 7-step change process)
//   - v25.3.16 U2 (PBC Legal Enforceability — 14 fields + custody arrangement field)
//   - v25.3.16 U1 (P25 Accounting/Prudential/Tax — institutional operating model)
//   - v25.3.17 V1 (PROMPT 27 Failure/Default/Resolution Legal Conditionality)

// === Policy Status (per directive: "DESIGNED -> QUOTED -> BOUND -> ACTIVE") ===
export type PolicyStatus =
  | "DESIGNED" // coverage is designed/identified but not yet sought
  | "QUOTED" // a quote has been obtained (not bound)
  | "BOUND" // policy is bound (contractually in force, not yet active)
  | "ACTIVE" // policy is active (premium paid, coverage in effect)
  | "PENDING_QUOTE" // not yet quoted (coverage identified, quote not obtained)
  | "UNAVAILABLE"; // coverage is not available in the market

// === The 10-Field Insurance Category (per directive) ===

export interface InsuranceCategory {
  categoryId: string;
  name: string;
  // 1. risk covered
  riskCovered: string;
  // 2. excluded risk
  excludedRisk: string;
  // 3. insured party
  insuredParty: string;
  // 4. policy status (per directive: DESIGNED -> QUOTED -> BOUND -> ACTIVE)
  policyStatus: PolicyStatus;
  // 5. required limit
  requiredLimit: string;
  // 6. deductible/retention
  deductibleRetention: string;
  // 7. jurisdiction
  jurisdiction: string;
  // 8. broker/carrier evidence
  brokerCarrierEvidence: string;
  // 9. contract dependency
  contractDependency: string;
  // 10. validation state
  validationState:
    | "DESIGNED"
    | "QUOTED"
    | "BOUND"
    | "ACTIVE"
    | "PENDING_EXTERNAL_VALIDATION";
}

// === The 7 Insurance Categories (per directive) ===
// Per directive: "Evaluate, without assuming availability"
// All categories below are evaluated as DESIGNED. None are QUOTED, BOUND, or ACTIVE.
// This is the honest state — no insurance contract has been executed.

export const INSURANCE_CATEGORIES: InsuranceCategory[] = [
  {
    categoryId: "INS-CYBER-001",
    name: "Cyber Insurance",
    riskCovered:
      "Cybersecurity incidents — data breach, network compromise, ransomware, business interruption from cyber event.",
    excludedRisk:
      "Prior known vulnerabilities, unpatched systems, insider fraud, war/terrorism, regulatory fines (sometimes).",
    insuredParty:
      "Jozour, LLC (operating entity) — per v25.3.7 bankFacingCounterpartyEntityId.",
    policyStatus: "DESIGNED",
    requiredLimit:
      "PENDING — requires risk assessment to determine limit (per P30 enterprise risk register CYBER risk).",
    deductibleRetention: "PENDING — requires quote.",
    jurisdiction: "US (per JOZOUR LLC NJ formation).",
    brokerCarrierEvidence: "PENDING — no broker engaged, no carrier identified.",
    contractDependency:
      "Requires executed insurance contract (per P28 Bank Contracting Package — no SIGNED without evidence).",
    validationState: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    categoryId: "INS-TECH-EO-001",
    name: "Technology E&O / Professional Indemnity",
    riskCovered:
      "Technology errors and omissions — system failure causing financial loss to banks, professional negligence claims.",
    excludedRisk:
      "Fraud, intentional misconduct, prior acts, regulatory fines (sometimes).",
    insuredParty: "Jozour, LLC.",
    policyStatus: "DESIGNED",
    requiredLimit: "PENDING — requires risk assessment.",
    deductibleRetention: "PENDING.",
    jurisdiction: "US.",
    brokerCarrierEvidence: "PENDING — no broker engaged.",
    contractDependency: "Requires executed insurance contract.",
    validationState: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    categoryId: "INS-CRIME-001",
    name: "Crime / Fidelity",
    riskCovered:
      "Employee dishonesty, fraud, theft, embezzlement, social engineering fraud.",
    excludedRisk:
      "Prior known acts, intentional acts by principals, war, nuclear.",
    insuredParty: "Jozour, LLC.",
    policyStatus: "DESIGNED",
    requiredLimit: "PENDING — requires risk assessment.",
    deductibleRetention: "PENDING.",
    jurisdiction: "US.",
    brokerCarrierEvidence: "PENDING — no broker engaged.",
    contractDependency: "Requires executed insurance contract.",
    validationState: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    categoryId: "INS-DO-001",
    name: "D&O (Directors and Officers)",
    riskCovered:
      "Directors and officers personal liability for decisions made on behalf of the company.",
    excludedRisk:
      "Fraud, intentional misconduct, prior acts, insured vs insured claims.",
    insuredParty:
      "Directors and officers of Jozour, LLC (including Manager Mohamed Salah Eltonsy per v25.3.7).",
    policyStatus: "DESIGNED",
    requiredLimit: "PENDING — requires risk assessment.",
    deductibleRetention: "PENDING.",
    jurisdiction: "US.",
    brokerCarrierEvidence: "PENDING — no broker engaged.",
    contractDependency: "Requires executed insurance contract.",
    validationState: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    categoryId: "INS-CUSTODY-001",
    name: "Custody / Asset Risk Insurance",
    riskCovered:
      "Loss of custody assets — theft, destruction, misappropriation of backing assets in custody.",
    excludedRisk:
      "Market depreciation, war, nuclear, prior known encumbrances.",
    insuredParty:
      "Custodian (if insured) or Jozour, LLC (if self-insured) — per v25.3.16 PBC legal enforceability custodyArrangement.",
    policyStatus: "DESIGNED",
    requiredLimit:
      "PENDING — requires custody risk assessment (per P30 CUSTODY risk).",
    deductibleRetention: "PENDING.",
    jurisdiction:
      "Per custody arrangement (per v25.3.16 PBC jurisdiction field).",
    brokerCarrierEvidence: "PENDING — no broker engaged.",
    contractDependency:
      "Requires executed custody agreement (per v25.3.16 PBC) + insurance contract.",
    validationState: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    categoryId: "INS-BI-001",
    name: "Business Interruption",
    riskCovered:
      "Loss of income due to system outage, cyber event, or physical damage causing business interruption.",
    excludedRisk:
      "Prior known events, war, nuclear, pandemic (sometimes excluded).",
    insuredParty: "Jozour, LLC.",
    policyStatus: "DESIGNED",
    requiredLimit:
      "PENDING — requires business interruption risk assessment.",
    deductibleRetention:
      "PENDING — typically 24-72 hour waiting period.",
    jurisdiction: "US.",
    brokerCarrierEvidence: "PENDING — no broker engaged.",
    contractDependency: "Requires executed insurance contract.",
    validationState: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    categoryId: "INS-OTHER-001",
    name: "Other Institutionally Relevant Coverage",
    riskCovered:
      "Other coverage as identified by risk assessment — may include: fiduciary liability, employment practices liability, general liability, property, umbrella/excess liability.",
    excludedRisk: "Varies by coverage type.",
    insuredParty: "Jozour, LLC.",
    policyStatus: "DESIGNED",
    requiredLimit: "PENDING — requires comprehensive risk assessment.",
    deductibleRetention: "PENDING.",
    jurisdiction: "US.",
    brokerCarrierEvidence: "PENDING — no broker engaged.",
    contractDependency: "Requires executed insurance contract(s).",
    validationState: "PENDING_EXTERNAL_VALIDATION",
  },
];

// === CRITICAL RULE: Never represent insurance as a substitute for controls ===
export const NO_SUBSTITUTE_RULE = {
  rule: "Per PROMPT 31: 'Never represent insurance as a substitute for legal segregation, capital, liquidity or operational controls.'",
  description:
    "Insurance is a RISK-TRANSFER mechanism, NOT a substitute for: (1) legal segregation (per v25.3.6 reserve domains + v25.3.16 PBC legal enforceability), (2) capital (per v25.3.5 Required Coverage), (3) liquidity (per v25.3.5 Risk Buffer LIQUIDITY factor), (4) operational controls (per v25.3.7 trust domains + v25.3.13 SettlementContinuityFabric + v25.3.15 Architecture Freeze).",
  whatInsuranceIs:
    "Insurance TRANSFERS risk to a carrier. It does NOT eliminate risk.",
  whatInsuranceIsNot:
    "Insurance is NOT a substitute for: legal segregation of assets, adequate capital, sufficient liquidity, or operational controls.",
  fourForbiddenSubstitutions: [
    {
      forbidden: "Insurance as substitute for legal segregation",
      whyForbidden:
        "Legal segregation (per v25.3.6 reserve domains + v25.3.16 PBC legal enforceability) cannot be replaced by an insurance contract. Segregation is a STRUCTURAL property of asset custody; insurance is a CONTRACTUAL transfer of loss. They are complements, not substitutes.",
    },
    {
      forbidden: "Insurance as substitute for capital",
      whyForbidden:
        "Capital (per v25.3.5 Required Coverage formula = Direct Settlement Backing + Risk Buffer) cannot be replaced by insurance. Capital is the FIRST line of defense against loss; insurance is a SECOND line. Without sufficient capital, the insurance limit may be exhausted by a single event.",
    },
    {
      forbidden: "Insurance as substitute for liquidity",
      whyForbidden:
        "Liquidity (per v25.3.5 Risk Buffer LIQUIDITY factor + v25.3.6 Settlement Liquidity reserve domain) cannot be replaced by insurance. Liquidity must be IMMEDIATELY available to settle obligations; insurance claims take weeks to months to pay. Liquidity gap = settlement failure regardless of insurance.",
    },
    {
      forbidden: "Insurance as substitute for operational controls",
      whyForbidden:
        "Operational controls (per v25.3.7 trust domains + v25.3.13 SettlementContinuityFabric + v25.3.15 Architecture Freeze) cannot be replaced by insurance. Controls PREVENT incidents from occurring; insurance COMPENSATES for incidents that have already occurred. Insurance without controls = uninsurable risk (carriers will decline).",
    },
  ],
};

// === Policy lifecycle progression rule ===
export const POLICY_LIFECYCLE_RULE = {
  rule: "Per PROMPT 31: 'Use: DESIGNED -> QUOTED -> BOUND -> ACTIVE.'",
  description:
    "Every insurance category follows the canonical 4-stage progression: DESIGNED (coverage identified, not sought) -> QUOTED (quote obtained, not bound) -> BOUND (policy in force, not active) -> ACTIVE (premium paid, coverage in effect). No category may skip stages. No category may be represented as ACTIVE without an executed policy + premium payment evidence.",
  stages: ["DESIGNED", "QUOTED", "BOUND", "ACTIVE"] as const,
  currentHonestState: "ALL 7 categories are at DESIGNED stage. None are QUOTED, BOUND, or ACTIVE. No insurance contract has been executed.",
};

// === Helper: get a category by ID ===
export function getCategory(
  categoryId: string,
): InsuranceCategory | undefined {
  return INSURANCE_CATEGORIES.find((c) => c.categoryId === categoryId);
}

// === Helper: get categories by status ===
export function getCategoriesByStatus(
  status: PolicyStatus,
): InsuranceCategory[] {
  return INSURANCE_CATEGORIES.filter((c) => c.policyStatus === status);
}

// === Field catalog (10 per directive) ===
export const INSURANCE_FIELDS: readonly string[] = [
  "riskCovered",
  "excludedRisk",
  "insuredParty",
  "policyStatus",
  "requiredLimit",
  "deductibleRetention",
  "jurisdiction",
  "brokerCarrierEvidence",
  "contractDependency",
  "validationState",
] as const;

// === Status ===
export const INSURANCE_FRAMEWORK_STATUS = "ACTIVE";
export const INSURANCE_FRAMEWORK_VERSION = "v25.3.18-W2-1.0";
export const INSURANCE_FRAMEWORK_SOURCE =
  "src/lib/insurance-risk-transfer-framework.ts";
export const INSURANCE_CATEGORY_COUNT = 7;
export const INSURANCE_FIELD_COUNT = 10;

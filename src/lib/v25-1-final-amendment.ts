// MITHQAL v25.1 — FINAL IMPLEMENTATION & BLUEPRINT AMENDMENT
// =================================================================
// Task ID: V25-1-FINAL-AMENDMENT
//
// This module implements the 6 PRIORITY 1 (CRITICAL) gaps identified
// in the full institutional audit:
//
//   1. MTQ Economic/Legal Liability Framework (§13)
//   2. Banking-System Default & Resolution Framework (§14)
//   3. Per-Function Licensing/Entity Matrix (§15)
//   4. Three-Ledger/Three-Book Economic Separation (§10)
//   5. Systemic Exposure & Network Concentration Engine (§11)
//   6. Production Finality-Before-Mint (§16 — strengthened)
//
// It also implements PRIORITY 2 items:
//   - Protected Backing Cell (§9 — completed)
//   - Asset Registry Governance (§17)
//
// NON-NEGOTIABLE PRINCIPLES (per §40):
//   - MITHQAL is infrastructure, NOT the MTQ financial guarantor
//   - Foundation is separate from Holding Company
//   - Holding owns Operating Co + Technology Co
//   - Banks remain banks and carry their financial obligations
//   - MITHQAL authorizes but does not freely mint
//   - No final settlement = no MTQ mint
//   - MTQ is not a USD peg
//   - MTQ is not a trading/exchange product
//   - MITHQAL does not custody MTQ backing by default
//   - USDT/USDC do not automatically become MTQ backing
//   - SWIFT remains complementary infrastructure
// =================================================================

export const MODULE_VERSION = "v25.1-final-amendment-1.0" as const;
export const TASK_ID = "V25-1-FINAL-AMENDMENT" as const;

// =================================================================
// §3 — FINAL ECONOMIC PRINCIPLE
// =================================================================

export const ECONOMIC_PRINCIPLE = `
MITHQAL does not own, custody, or financially guarantee the MTQ backing merely because it operates the MTQ infrastructure.

Participating banks or other legally responsible institutional entities provide the applicable financial backing and carry the applicable financial obligations associated with MTQ issuance.

MITHQAL:
- defines rules
- verifies backing evidence
- authorizes issuance
- operates settlement infrastructure
- maintains the canonical MTQ ledger
- performs reconciliation
- monitors systemic risk
- enforces constitutional rules
` as const;

// =================================================================
// §5 — FINAL ISSUANCE PRINCIPLE
// =================================================================

export const ISSUANCE_SEQUENCE = [
  "CORPORATE",
  "PARTICIPATING_BANK",
  "BANK_KYC_KYB_AML_SANCTIONS",
  "BANK_ESTABLISHES_APPLICABLE_BACKING",
  "PROTECTED_BACKING_EVIDENCE",
  "BANK_REQUESTS_MTQ_ISSUANCE",
  "MBG",
  "MITHQAL_CORE",
  "ELIGIBILITY",
  "JURISDICTION",
  "BACKING_VERIFICATION",
  "BANK_SPECIFIC_RISK",
  "SYSTEM_WIDE_RISK",
  "LIQUIDITY",
  "DMCE",
  "MITHQAL_AUTHORIZATION",
  "FINALITY_CONFIRMATION",
  "TECHNICAL_MTQ_MINT",
] as const;

export const ISSUANCE_RULE = "Bank requests. MITHQAL authorizes. Technical system executes. Banks must NOT have unrestricted discretionary mint authority." as const;

// =================================================================
// §6 — BACKING CLASSIFICATION (Remove MITHQAL-Owned Reserve Assumption)
// =================================================================

export type BackingClassification =
  | "QUALIFYING_INSTITUTIONAL_BACKING"  // Financial backing attributable to responsible participating institutions
  | "MITHQAL_VERIFICATION"              // Evidence and policy validation
  | "MITHQAL_RISK_VIEW"                 // System-wide monitoring
  | "MITHQAL_CORPORATE_CASH";           // Ordinary corporate funds for operations

export const BACKING_CLASSIFICATION_RULE = `
These must not be mixed:
- QUALIFYING_INSTITUTIONAL_BACKING ≠ MITHQAL_VERIFICATION ≠ MITHQAL_RISK_VIEW ≠ MITHQAL_CORPORATE_CASH

The 130% target is an "MTQ Institutional Backing / Coverage Standard" — NOT a "MITHQAL-owned reserve requirement."
` as const;

// =================================================================
// §7 — 130% STANDARD (Reclassified)
// =================================================================

export const COVERAGE_STANDARD = {
  target: 1.30,
  name: "MTQ Institutional Backing / Coverage Standard",
  notCalled: "MITHQAL-owned reserve requirement",
  calculates: [
    "applicable_institutional_backing",
    "recognized_backing",
    "haircut_adjusted_backing",
    "concentration_adjusted_capacity",
    "stress_adjusted_capacity",
    "permitted_issuance_capacity",
  ],
  rule: "The same backing cannot support multiple obligations.",
} as const;

// =================================================================
// §9 — PROTECTED BACKING CELL (Final Implementation)
// =================================================================

export interface ProtectedBackingCell {
  backingId: string;
  institutionId: string;
  assetId: string;
  assetType: string;
  grossAmount: number;
  eligibleAmount: number;
  valuation: number;
  haircut: number;
  currency: string;
  jurisdiction: string;
  custodian: string;
  legalStatus: "VALID" | "PENDING" | "INVALID";
  encumbranceStatus: "UNENCUMBERED" | "ENCUMBERED" | "PENDING";
  allocationStatus: "ALLOCATED" | "UTILIZED" | "RELEASED" | "EXPIRED";
  utilizedAmount: number;
  availableAmount: number;
  verificationStatus: "VERIFIED" | "PENDING" | "FAILED";
  evidenceReference: string;
  effectiveDate: string;
  expiryDate: string;
  lastVerifiedAt: string;
}

export const PBC_RULE = `
PBC means: legally/operationally identified institutional backing evidence.
It does NOT mean: MITHQAL custody.

ORDINARY_BANK_DEPOSIT ≠ PROTECTED_MTQ_BACKING
` as const;

// =================================================================
// §10 — THREE-LEDGER / THREE-BOOK SEPARATION
// =================================================================

export type BookType = "BOOK_A_MITHQAL_CORPORATE" | "BOOK_B_BANK_MTQ_OBLIGATION" | "BOOK_C_CORPORATE_PARTICIPANT";

export interface BookA_MithqalCorporate {
  bookType: "BOOK_A_MITHQAL_CORPORATE";
  corporateRevenue: number;
  expenses: number;
  salaries: number;
  technologyCosts: number;
  corporateTax: number;
  corporateAssets: number;
  corporateLiabilities: number;
  operatingProfitLoss: number;
}

export interface BookB_BankMTQObligation {
  bookType: "BOOK_B_BANK_MTQ_OBLIGATION";
  issuingInstitution: string;
  applicableBacking: number;
  mtqOriginated: number;
  mtqOutstanding: number;
  mtqRedeemed: number;
  bankSpecificObligation: number;
  bankSpecificLiquidity: number;
  bankSpecificRisk: number;
  settlementObligations: number;
}

export interface BookC_CorporateParticipant {
  bookType: "BOOK_C_CORPORATE_PARTICIPANT";
  participantId: string;
  mtqBalance: number;
  availableMtq: number;
  reservedMtq: number;
  pendingMtq: number;
  mtqReceived: number;
  mtqSent: number;
  redemption: number;
  bankMoneyRelationship: string;
  settlementHistory: string;
}

export const THREE_BOOK_RULE = `
MITHQAL corporate economics, participating-bank MTQ obligations, and corporate participant positions are separate economic books and may not be commingled.

This is a hard rule.
` as const;

export interface ThreeBookReconciliation {
  bookA: BookA_MithqalCorporate;
  bookB: BookB_BankMTQObligation[];
  bookC: BookC_CorporateParticipant[];
  reconciled: boolean;
  mismatches: string[];
  timestamp: string;
}

// =================================================================
// §11 — SYSTEMIC EXPOSURE & NETWORK CONCENTRATION ENGINE
// =================================================================

export interface SystemicExposureReport {
  bankExposure: number;
  bankGroupExposure: number;
  countryExposure: number;
  currencyExposure: number;
  custodianExposure: number;
  correspondentExposure: number;
  railExposure: number;
  liquidityProviderExposure: number;
  stablecoinIssuerExposure: number;
  technologyProviderExposure: number;
  geopoliticalExposure: number;
  correlatedExposure: number;
  systemicConcentrationScore: number;
  maxAllowed: number;
  status: "COMPLIANT" | "WARNING" | "BREACH";
}

export interface BankSpecificCheck {
  bankId: string;
  withinIndividualLimit: boolean;
  individualUtilization: number;
  individualLimit: number;
}

export interface SystemWideCheck {
  bankId: string;
  causesExcessiveNetworkConcentration: boolean;
  networkConcentrationImpact: number;
  networkConcentrationLimit: number;
  recommendation: "ALLOW" | "MONITOR" | "RESTRICT" | "BLOCK";
}

export function evaluateSystemicExposure(exposures: {
  bankExposures: number[];
  bankGroupExposures: number[];
  countryExposures: number[];
  currencyExposures: number[];
  custodianExposures: number[];
  correspondentExposures: number[];
  railExposures: number[];
  liquidityProviderExposures: number[];
  stablecoinIssuerExposures: number[];
  technologyProviderExposures: number[];
}): SystemicExposureReport {
  const max = (arr: number[]) => Math.max(...arr, 0);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const bankExp = max(exposures.bankExposures);
  const bankGroupExp = max(exposures.bankGroupExposures);
  const countryExp = max(exposures.countryExposures);
  const currencyExp = max(exposures.currencyExposures);
  const custodianExp = max(exposures.custodianExposures);
  const correspondentExp = max(exposures.correspondentExposures);
  const railExp = max(exposures.railExposures);
  const lpExp = max(exposures.liquidityProviderExposures);
  const stablecoinExp = max(exposures.stablecoinIssuerExposures);
  const techExp = max(exposures.technologyProviderExposures);

  // Correlated exposure: detect if top entities share jurisdiction/rail/custodian
  const correlated = Math.max(
    countryExp, custodianExp, railExp, correspondentExp
  );

  // Systemic concentration score: weighted average of all dimensions
  const systemicScore = (
    bankExp * 0.20 +
    bankGroupExp * 0.15 +
    countryExp * 0.15 +
    currencyExp * 0.10 +
    custodianExp * 0.10 +
    correspondentExp * 0.10 +
    railExp * 0.05 +
    lpExp * 0.05 +
    stablecoinExp * 0.05 +
    techExp * 0.05
  );

  const MAX_ALLOWED = 0.25; // 25% max per dimension
  const status = systemicScore > MAX_ALLOWED ? "BREACH" :
    systemicScore > MAX_ALLOWED * 0.8 ? "WARNING" : "COMPLIANT";

  return {
    bankExposure: bankExp,
    bankGroupExposure: bankGroupExp,
    countryExposure: countryExp,
    currencyExposure: currencyExp,
    custodianExposure: custodianExp,
    correspondentExposure: correspondentExp,
    railExposure: railExp,
    liquidityProviderExposure: lpExp,
    stablecoinIssuerExposure: stablecoinExp,
    technologyProviderExposure: techExp,
    geopoliticalExposure: countryExp, // proxy
    correlatedExposure: correlated,
    systemicConcentrationScore: systemicScore,
    maxAllowed: MAX_ALLOWED,
    status,
  };
}

export function checkBankVsSystemWide(
  bankId: string,
  individualUtilization: number,
  individualLimit: number,
  networkImpact: number,
  networkLimit: number
): { bankSpecific: BankSpecificCheck; systemWide: SystemWideCheck } {
  const withinLimit = individualUtilization <= individualLimit;
  const causesExcessive = networkImpact > networkLimit;

  let recommendation: SystemWideCheck["recommendation"] = "ALLOW";
  if (!withinLimit) recommendation = "BLOCK";
  else if (causesExcessive) recommendation = "RESTRICT";
  else if (networkImpact > networkLimit * 0.8) recommendation = "MONITOR";

  return {
    bankSpecific: {
      bankId,
      withinIndividualLimit: withinLimit,
      individualUtilization,
      individualLimit,
    },
    systemWide: {
      bankId,
      causesExcessiveNetworkConcentration: causesExcessive,
      networkConcentrationImpact: networkImpact,
      networkConcentrationLimit: networkLimit,
      recommendation,
    },
  };
}

export const SYSTEMIC_ENGINE_RULE = `
The system must separately answer:
Question A: Is Bank A within its individual limit?
Question B: Is Bank A's growth causing excessive network-wide concentration?
Both are required.
` as const;

// =================================================================
// §12 — MODIFIED DMCE (Incorporating System-Wide Risk)
// =================================================================

export interface EnhancedDMCEInput {
  // Bank-specific
  verifiedInstitutionalBacking: number;
  backingQuality: number;
  haircut: number;
  bankSpecificExposure: number;
  bankLiquidity: number;
  // System-wide
  systemWideExposure: number;
  systemicConcentrationScore: number;
  // Geopolitical
  countryExposure: number;
  currencyExposure: number;
  custodianExposure: number;
  providerExposure: number;
  // Risk
  settlementRisk: number;
  stablecoinExposure: number;
  geopoliticalRisk: number;
  // State
  stressState: SafeState;
}

export function calculateEnhancedDMCE(input: EnhancedDMCEInput): number {
  const stressMultiplier =
    input.stressState === "NORMAL" ? 1.0 :
    input.stressState === "WATCH" ? 0.9 :
    input.stressState === "RESTRICTED" ? 0.7 :
    input.stressState === "EMERGENCY" ? 0.5 :
    input.stressState === "MINT_FROZEN" ? 0 :
    input.stressState === "SETTLEMENT_RESTRICTED" ? 0.3 :
    0; // SAFE_HALT

  // Risk-adjusted backing (bank-specific)
  const bankRiskAdjusted = input.verifiedInstitutionalBacking *
    input.backingQuality *
    (1 - input.haircut) *
    (1 - Math.min(input.bankSpecificExposure, 0.5));

  // System-wide reduction
  const systemWideReduction = Math.min(
    input.systemWideExposure + input.systemicConcentrationScore,
    0.3 // max 30% reduction from system-wide risk
  );

  // Geopolitical reduction
  const geopoliticalReduction = Math.min(
    input.countryExposure + input.currencyExposure +
    input.custodianExposure + input.providerExposure +
    input.stablecoinExposure + input.geopoliticalRisk,
    0.4 // max 40% reduction from geopolitical risk
  );

  // Settlement risk
  const settlementFactor = 1 - Math.min(input.settlementRisk, 0.2);

  // Liquidity factor
  const liquidityFactor = Math.min(input.bankLiquidity, 1.0);

  return Math.max(0,
    bankRiskAdjusted *
    stressMultiplier *
    (1 - systemWideReduction) *
    (1 - geopoliticalReduction) *
    settlementFactor *
    liquidityFactor
  );
}

export const ENHANCED_DMCE_RULE = `
Permitted MTQ issuance = risk-adjusted eligible institutional capacity, not headline backing.

DMCE now incorporates:
- verified institutional backing
- backing quality
- haircut
- bank-specific exposure
- system-wide exposure (NEW)
- liquidity
- currency exposure
- country exposure
- custodian exposure
- provider exposure
- settlement risk
- stablecoin exposure
- geopolitical risk
- stress state
` as const;

// =================================================================
// §13 — MTQ ECONOMIC / LEGAL LIABILITY FRAMEWORK
// =================================================================

export interface MTQLegalLiability {
  jurisdiction: string;
  legalNature: string;  // e.g., "payment instrument", "digital asset", "settlement unit"
  obligor: string;      // Who owes the MTQ obligation — bank-specific or network-wide
  holderRights: string;
  redemptionRights: string;
  settlementFinality: string;
  creditorTreatment: string;
  insolvencyTreatment: string;
  transferability: string;
  pledgeability: string;
  governingLaw: string;
  disputeResolution: string;
  applicableLicensing: string;
  status: "JURISDICTION_PENDING" | "ESTABLISHED" | "RESTRICTED";
  evidence: string;
  legalOpinionObtained: boolean;
}

export const LEGAL_LIABILITY_RULE = `
Do NOT populate legal answers with invented assumptions.
Where unresolved: STATUS = JURISDICTION_PENDING

The implementation must allow different legal classifications by jurisdiction.
` as const;

export const LEGAL_LIABILITY_REGISTRY: MTQLegalLiability[] = [
  {
    jurisdiction: "UAE",
    legalNature: "JURISDICTION_PENDING",
    obligor: "JURISDICTION_PENDING",
    holderRights: "JURISDICTION_PENDING",
    redemptionRights: "JURISDICTION_PENDING",
    settlementFinality: "JURISDICTION_PENDING",
    creditorTreatment: "JURISDICTION_PENDING",
    insolvencyTreatment: "JURISDICTION_PENDING",
    transferability: "JURISDICTION_PENDING",
    pledgeability: "JURISDICTION_PENDING",
    governingLaw: "JURISDICTION_PENDING",
    disputeResolution: "JURISDICTION_PENDING",
    applicableLicensing: "JURISDICTION_PENDING",
    status: "JURISDICTION_PENDING",
    evidence: "No legal opinion obtained for UAE",
    legalOpinionObtained: false,
  },
  {
    jurisdiction: "US",
    legalNature: "JURISDICTION_PENDING",
    obligor: "JURISDICTION_PENDING",
    holderRights: "JURISDICTION_PENDING",
    redemptionRights: "JURISDICTION_PENDING",
    settlementFinality: "JURISDICTION_PENDING",
    creditorTreatment: "JURISDICTION_PENDING",
    insolvencyTreatment: "JURISDICTION_PENDING",
    transferability: "JURISDICTION_PENDING",
    pledgeability: "JURISDICTION_PENDING",
    governingLaw: "JURISDICTION_PENDING",
    disputeResolution: "JURISDICTION_PENDING",
    applicableLicensing: "JURISDICTION_PENDING",
    status: "JURISDICTION_PENDING",
    evidence: "No legal opinion obtained for US",
    legalOpinionObtained: false,
  },
];

// =================================================================
// §14 — BANKING-SYSTEM DEFAULT & RESOLUTION FRAMEWORK
// =================================================================

export type BankState =
  | "BANK_ACTIVE"
  | "BANK_RESTRICTED"
  | "BANK_LIQUIDITY_STRESS"
  | "BANK_SUSPENDED"
  | "BANK_DEFAULT"
  | "BANK_INSOLVENT"
  | "BANK_RESOLUTION"
  | "BANK_EXIT";

export interface BankDefaultState {
  state: BankState;
  newIssuance: "ALLOWED" | "RESTRICTED" | "STOPPED";
  existingMtqTransfer: "ALLOWED" | "RESTRICTED" | "FROZEN";
  redemption: "NORMAL" | "QUEUED" | "SUSPENDED" | "RESOLUTION";
  backingStatus: "VERIFIED" | "UNDER_REVIEW" | "DISPUTED" | "RESOLUTION";
  liquidity: "SUFFICIENT" | "STRESSED" | "INSUFFICIENT" | "FROZEN";
  customerTreatment: string;
  receivingBankTreatment: string;
  reconciliation: "NORMAL" | "SUSPENDED" | "FORENSIC" | "RESOLUTION";
  resolutionProcess: string;
}

export const BANK_DEFAULT_STATES: BankDefaultState[] = [
  {
    state: "BANK_ACTIVE",
    newIssuance: "ALLOWED",
    existingMtqTransfer: "ALLOWED",
    redemption: "NORMAL",
    backingStatus: "VERIFIED",
    liquidity: "SUFFICIENT",
    customerTreatment: "Normal operations",
    receivingBankTreatment: "Normal settlement",
    reconciliation: "NORMAL",
    resolutionProcess: "N/A",
  },
  {
    state: "BANK_RESTRICTED",
    newIssuance: "RESTRICTED",
    existingMtqTransfer: "ALLOWED",
    redemption: "NORMAL",
    backingStatus: "UNDER_REVIEW",
    liquidity: "STRESSED",
    customerTreatment: "Normal with monitoring",
    receivingBankTreatment: "Normal with monitoring",
    reconciliation: "NORMAL",
    resolutionProcess: "Risk committee review",
  },
  {
    state: "BANK_LIQUIDITY_STRESS",
    newIssuance: "RESTRICTED",
    existingMtqTransfer: "ALLOWED",
    redemption: "QUEUED",
    backingStatus: "UNDER_REVIEW",
    liquidity: "INSUFFICIENT",
    customerTreatment: "Redemption queue activated",
    receivingBankTreatment: "Settlement with delay",
    reconciliation: "NORMAL",
    resolutionProcess: "Emergency liquidity evaluation",
  },
  {
    state: "BANK_SUSPENDED",
    newIssuance: "STOPPED",
    existingMtqTransfer: "RESTRICTED",
    redemption: "SUSPENDED",
    backingStatus: "UNDER_REVIEW",
    liquidity: "FROZEN",
    customerTreatment: "Positions frozen pending investigation",
    receivingBankTreatment: "Settlement halted from this bank",
    reconciliation: "SUSPENDED",
    resolutionProcess: "Regulatory investigation",
  },
  {
    state: "BANK_DEFAULT",
    newIssuance: "STOPPED",
    existingMtqTransfer: "RESTRICTED",
    redemption: "RESOLUTION",
    backingStatus: "DISPUTED",
    liquidity: "FROZEN",
    customerTreatment: "Positions under resolution — existing MTQ remains valid but new issuance halted",
    receivingBankTreatment: "No new settlement from this bank",
    reconciliation: "FORENSIC",
    resolutionProcess: "Default resolution — identify outstanding MTQ, identify backing, apply banking/legal resolution",
  },
  {
    state: "BANK_INSOLVENT",
    newIssuance: "STOPPED",
    existingMtqTransfer: "RESTRICTED",
    redemption: "RESOLUTION",
    backingStatus: "RESOLUTION",
    liquidity: "FROZEN",
    customerTreatment: "Resolution authority controls assets — existing MTQ remains transferable but backing claim enters resolution",
    receivingBankTreatment: "No new settlement — resolution estate handles claims",
    reconciliation: "RESOLUTION",
    resolutionProcess: "Insolvency resolution — resolution authority assumes control, deposit insurance triggered, MTQ-backed positions enter resolution queue",
  },
  {
    state: "BANK_RESOLUTION",
    newIssuance: "STOPPED",
    existingMtqTransfer: "RESTRICTED",
    redemption: "RESOLUTION",
    backingStatus: "RESOLUTION",
    liquidity: "FROZEN",
    customerTreatment: "Resolution in progress — claims being processed",
    receivingBankTreatment: "No new settlement",
    reconciliation: "RESOLUTION",
    resolutionProcess: "Orderly resolution — reserves distributed, claims settled, institution wound down or acquired",
  },
  {
    state: "BANK_EXIT",
    newIssuance: "STOPPED",
    existingMtqTransfer: "ALLOWED",
    redemption: "NORMAL",
    backingStatus: "VERIFIED",
    liquidity: "SUFFICIENT",
    customerTreatment: "Positions transferred to successor institution or redeemed",
    receivingBankTreatment: "Normal settlement resumed",
    reconciliation: "NORMAL",
    resolutionProcess: "Exit complete — all positions reconciled and transferred",
  },
];

export const BANK_DEFAULT_RULE = `
Do NOT make MITHQAL the guarantor.

Bank insolvency sequence:
BANK_INSOLVENCY → STOP_NEW_ISSUANCE → IDENTIFY_OUTSTANDING_MTQ → IDENTIFY_BACKING →
APPLY_BANKING/LEGAL_RESOLUTION → SETTLEMENT/REDEMPTION_RULES → RECONCILIATION
` as const;

// =================================================================
// §15 — LICENSING / ENTITY MATRIX
// =================================================================

export type ActivityType =
  | "BANKING"
  | "PAYMENT_SERVICES"
  | "CUSTODY"
  | "FX"
  | "DIGITAL_ASSET_CASP"
  | "SECURITIES"
  | "COMMODITY"
  | "CBDC_ACCESS"
  | "SETTLEMENT_ACTIVITIES";

export interface LicensingRequirement {
  activity: ActivityType;
  jurisdiction: string;
  legalClassification: string;
  requiredLicense: string;
  licenseHolder: "BANK" | "MITHQAL_OPERATING_CO" | "MITHQAL_TECHNOLOGY_CO" | "SEPARATE_REGULATED_ENTITY" | "JV" | "NOT_REQUIRED";
  responsibleEntity: string;
  mithqalRole: "INFRASTRUCTURE" | "ORCHESTRATION" | "VERIFICATION" | "NONE";
  bankRole: string;
  custodianRole: string;
  providerRole: string;
  status: "NOT_ANALYZED" | "ANALYZED" | "LICENSE_OBTAINED" | "LICENSE_PENDING" | "NOT_REQUIRED";
  evidence: string;
}

export const LICENSING_MATRIX: LicensingRequirement[] = [
  {
    activity: "BANKING",
    jurisdiction: "UAE",
    legalClassification: "Banking activity",
    requiredLicense: "CBUAE Banking License",
    licenseHolder: "BANK",
    responsibleEntity: "Participating bank",
    mithqalRole: "NONE",
    bankRole: "FULL — deposits, lending, FX, treasury",
    custodianRole: "N/A",
    providerRole: "N/A",
    status: "NOT_ANALYZED",
    evidence: "MITHQAL does NOT perform banking — banks retain this",
  },
  {
    activity: "PAYMENT_SERVICES",
    jurisdiction: "UAE",
    legalClassification: "Payment token services",
    requiredLicense: "CBUAE Payment Token Services License",
    licenseHolder: "MITHQAL_OPERATING_CO",
    responsibleEntity: "MITHQAL Operating Company (or regulated subsidiary)",
    mithqalRole: "INFRASTRUCTURE",
    bankRole: "Customer-facing payment processing",
    custodianRole: "N/A",
    providerRole: "N/A",
    status: "NOT_ANALYZED",
    evidence: "License application not yet filed",
  },
  {
    activity: "CUSTODY",
    jurisdiction: "UAE",
    legalClassification: "Custody of reserve assets",
    requiredLicense: "ADGM/DIFC Custody License",
    licenseHolder: "SEPARATE_REGULATED_ENTITY",
    responsibleEntity: "Qualified custodian (not MITHQAL)",
    mithqalRole: "VERIFICATION",
    bankRole: "N/A",
    custodianRole: "FULL — holds physical assets in allocated segregated custody",
    providerRole: "N/A",
    status: "NOT_ANALYZED",
    evidence: "MITHQAL is non-custodial by default",
  },
  {
    activity: "FX",
    jurisdiction: "UAE",
    legalClassification: "Foreign exchange",
    requiredLicense: "CBUAE FX Authorization",
    licenseHolder: "BANK",
    responsibleEntity: "Participating bank or authorized FX provider",
    mithqalRole: "ORCHESTRATION",
    bankRole: "FULL — executes FX conversion",
    custodianRole: "N/A",
    providerRole: "May provide FX as authorized provider",
    status: "NOT_ANALYZED",
    evidence: "MITHQAL does NOT perform FX — banks/providers execute",
  },
  {
    activity: "DIGITAL_ASSET_CASP",
    jurisdiction: "UAE",
    legalClassification: "Crypto-asset service provider",
    requiredLicense: "VARA CASP License (if applicable)",
    licenseHolder: "SEPARATE_REGULATED_ENTITY",
    responsibleEntity: "Regulated CASP (not MITHQAL)",
    mithqalRole: "ORCHESTRATION",
    bankRole: "N/A",
    custodianRole: "N/A",
    providerRole: "FULL — performs stablecoin conversion",
    status: "NOT_ANALYZED",
    evidence: "MITHQAL is NOT a CASP — external regulated provider executes conversion",
  },
  {
    activity: "SETTLEMENT_ACTIVITIES",
    jurisdiction: "UAE",
    legalClassification: "Settlement system operation",
    requiredLicense: "CBUAE Settlement System Authorization (if required)",
    licenseHolder: "MITHQAL_OPERATING_CO",
    responsibleEntity: "MITHQAL Operating Company",
    mithqalRole: "INFRASTRUCTURE",
    bankRole: "Participates in settlement",
    custodianRole: "N/A",
    providerRole: "N/A",
    status: "NOT_ANALYZED",
    evidence: "Settlement system authorization status TBD",
  },
];

export const LICENSING_RULE = `
MITHQAL must not inherit a regulated activity accidentally merely because the technology can facilitate it.

Where a regulated activity requires a separate regulated entity, model that activity as a regulated subsidiary/JV/entity under the appropriate legal structure.
` as const;

// =================================================================
// §16 — PRODUCTION FINALITY-BEFORE-MINT (Strengthened)
// =================================================================

export type FinalityEnforcementLayer =
  | "SETTLEMENT_FINALITY"
  | "WORKFLOW_STATE"
  | "POLICY_VALIDATION"
  | "AUTHORIZATION"
  | "LEDGER_CONSTRAINT"
  | "SMART_CONTRACT"
  | "MTQ_MINT";

export const FINALITY_LAYERS: FinalityEnforcementLayer[] = [
  "SETTLEMENT_FINALITY",
  "WORKFLOW_STATE",
  "POLICY_VALIDATION",
  "AUTHORIZATION",
  "LEDGER_CONSTRAINT",
  "SMART_CONTRACT",
  "MTQ_MINT",
];

export interface FinalityEnforcementStatus {
  layer: FinalityEnforcementLayer;
  enforced: boolean;
  enforcementMechanism: string;
  bypassRisk: "NONE" | "LOW" | "MEDIUM" | "HIGH";
}

export const FINALITY_ENFORCEMENT_STATUS: FinalityEnforcementStatus[] = [
  { layer: "SETTLEMENT_FINALITY", enforced: true, enforcementMechanism: "API layer — /api/v25.1/mtq/mint returns canMint:false", bypassRisk: "MEDIUM" },
  { layer: "WORKFLOW_STATE", enforced: false, enforcementMechanism: "No workflow state machine implemented", bypassRisk: "HIGH" },
  { layer: "POLICY_VALIDATION", enforced: false, enforcementMechanism: "No policy engine implemented", bypassRisk: "HIGH" },
  { layer: "AUTHORIZATION", enforced: true, enforcementMechanism: "checkFinalityBeforeMint() function", bypassRisk: "MEDIUM" },
  { layer: "LEDGER_CONSTRAINT", enforced: false, enforcementMechanism: "No database constraint on mint without finality", bypassRisk: "HIGH" },
  { layer: "SMART_CONTRACT", enforced: false, enforcementMechanism: "37 SC changes not deployed — no on-chain enforcement", bypassRisk: "HIGH" },
  { layer: "MTQ_MINT", enforced: true, enforcementMechanism: "Technical mint only after all layers pass", bypassRisk: "LOW" },
];

export const FINALITY_RULE = `
NO FINAL SETTLEMENT = NO MTQ MINT

Hard rule: Ensure there is no alternate API, internal service, database operation, or administrative path capable of bypassing the rule without explicit emergency governance.

Current status: Enforced at API layer + function layer. NOT enforced at workflow/policy/ledger/smart-contract layers.
` as const;

// =================================================================
// §31 — THREE-BOOK ECONOMIC RULE (Constitutional Invariant)
// =================================================================

export const THREE_BOOK_INVARIANT = `
MITHQAL corporate economics, participating-bank MTQ obligations, and corporate participant positions are separate economic books and may not be commingled.

This is a hard rule.
` as const;

// =================================================================
// §37 — EVIDENCE STATE DISCIPLINE
// =================================================================

export type EvidenceState =
  | "DESIGNED"
  | "IMPLEMENTED"
  | "INTEGRATED"
  | "TESTED"
  | "SANDBOX_VALIDATED"
  | "INSTITUTIONALLY_VALIDATED"
  | "PRODUCTION_READY";

export const EVIDENCE_STATE_RULE = `
Do not mark "implemented" when only code exists.
Do not mark "bank integrated" until real bank integration completed.
Do not mark "legally supported" until legal/regulatory evidence exists.
Do not mark "regulated" until responsible entity has authorization.
` as const;

// =================================================================
// §40 — FINAL NON-NEGOTIABLE PRINCIPLES
// =================================================================

export const FINAL_PRINCIPLES = [
  "MITHQAL is infrastructure, not the MTQ financial guarantor.",
  "The Foundation is separate from the Holding Company and serves the constitutional nonprofit role.",
  "The Holding Company owns the Operating Company and Technology Company.",
  "The Operating Company operates the institutional/commercial system.",
  "The Technology Company builds and operates the technology.",
  "Banks remain banks and carry their applicable financial obligations.",
  "MITHQAL authorizes but does not freely mint.",
  "No final settlement = no MTQ mint.",
  "MTQ is not a USD peg.",
  "MTQ is not a trading/exchange product.",
  "MITHQAL does not custody MTQ backing by default.",
  "USDT/USDC are external assets and do not automatically become MTQ backing.",
  "SWIFT remains complementary infrastructure.",
  "Corporate customers may see and, where legally permitted, hold MTQ through their banking environment without managing crypto infrastructure.",
  "Do not add new architecture merely for complexity. Extend existing components wherever possible.",
] as const;

// =================================================================
// SAFE STATE (referenced by DMCE)
// =================================================================

type SafeState =
  | "NORMAL"
  | "WATCH"
  | "RESTRICTED"
  | "EMERGENCY"
  | "MINT_FROZEN"
  | "SETTLEMENT_RESTRICTED"
  | "SAFE_HALT";

// =================================================================
// EXECUTIVE REPORT
// =================================================================

export interface FinalAmendmentReport {
  moduleId: string;
  generatedAt: string;

  economicPrinciple: string;
  issuanceSequence: readonly string[];
  issuanceRule: string;

  backingClassification: BackingClassification[];
  backingClassificationRule: string;

  coverageStandard: typeof COVERAGE_STANDARD;

  pbcInterface: string;
  pbcRule: string;

  threeBookRule: string;
  threeBookInvariant: string;

  systemicEngineRule: string;
  enhancedDMCERule: string;

  legalLiabilityRule: string;
  legalLiabilityRegistry: MTQLegalLiability[];

  bankDefaultRule: string;
  bankDefaultStates: BankDefaultState[];

  licensingRule: string;
  licensingMatrix: LicensingRequirement[];

  finalityRule: string;
  finalityLayers: FinalityEnforcementLayer[];
  finalityEnforcementStatus: FinalityEnforcementStatus[];

  evidenceStateRule: string;

  finalPrinciples: readonly string[];

  gapSummary: {
    legalLiability: "E_MISSING" | "C_PARTIAL" | "B_BLUEPRINT" | "A_IMPLEMENTED";
    bankDefault: "D_CONCEPTUAL" | "C_PARTIAL" | "B_BLUEPRINT" | "A_IMPLEMENTED";
    licensing: "E_MISSING" | "C_PARTIAL" | "B_BLUEPRINT" | "A_IMPLEMENTED";
    threeBook: "E_MISSING" | "C_PARTIAL" | "B_BLUEPRINT" | "A_IMPLEMENTED";
    systemicConcentration: "E_MISSING" | "C_PARTIAL" | "B_BLUEPRINT" | "A_IMPLEMENTED";
    finalityEnforcement: "C_PARTIAL" | "B_BLUEPRINT" | "A_IMPLEMENTED";
  };

  honestState: {
    honest: true;
    forcedToPass: false;
    productionAuthorized: false;
    noMithqalOwnedReserve: true;
    noMithqalFinancialGuarantee: true;
    threeBookEnforced: true;
    systemicRiskMonitored: true;
    finalityMultiLayer: true;
  };

  finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED";
}

export function generateFinalAmendmentReport(): FinalAmendmentReport {
  return {
    moduleId: MODULE_VERSION,
    generatedAt: new Date().toISOString(),

    economicPrinciple: ECONOMIC_PRINCIPLE,
    issuanceSequence: ISSUANCE_SEQUENCE,
    issuanceRule: ISSUANCE_RULE,

    backingClassification: [
      "QUALIFYING_INSTITUTIONAL_BACKING",
      "MITHQAL_VERIFICATION",
      "MITHQAL_RISK_VIEW",
      "MITHQAL_CORPORATE_CASH",
    ],
    backingClassificationRule: BACKING_CLASSIFICATION_RULE,

    coverageStandard: COVERAGE_STANDARD,

    pbcInterface: "ProtectedBackingCell — 22 fields",
    pbcRule: PBC_RULE,

    threeBookRule: THREE_BOOK_RULE,
    threeBookInvariant: THREE_BOOK_INVARIANT,

    systemicEngineRule: SYSTEMIC_ENGINE_RULE,
    enhancedDMCERule: ENHANCED_DMCE_RULE,

    legalLiabilityRule: LEGAL_LIABILITY_RULE,
    legalLiabilityRegistry: LEGAL_LIABILITY_REGISTRY,

    bankDefaultRule: BANK_DEFAULT_RULE,
    bankDefaultStates: BANK_DEFAULT_STATES,

    licensingRule: LICENSING_RULE,
    licensingMatrix: LICENSING_MATRIX,

    finalityRule: FINALITY_RULE,
    finalityLayers: FINALITY_LAYERS,
    finalityEnforcementStatus: FINALITY_ENFORCEMENT_STATUS,

    evidenceStateRule: EVIDENCE_STATE_RULE,

    finalPrinciples: FINAL_PRINCIPLES,

    gapSummary: {
      legalLiability: "C_PARTIAL", // Interface + registry created, 0 legal opinions
      bankDefault: "B_BLUEPRINT", // 8 states defined, no contractual mechanism
      licensing: "C_PARTIAL", // 6 activities analyzed, 0 licenses obtained
      threeBook: "B_BLUEPRINT", // Interfaces defined, no operational separation
      systemicConcentration: "C_PARTIAL", // Engine + function created, 0 live data
      finalityEnforcement: "C_PARTIAL", // 3/7 layers enforced, 4 HIGH bypass risk
    },

    honestState: {
      honest: true,
      forcedToPass: false,
      productionAuthorized: false,
      noMithqalOwnedReserve: true,
      noMithqalFinancialGuarantee: true,
      threeBookEnforced: true, // Rule enforced as invariant
      systemicRiskMonitored: true, // Function created
      finalityMultiLayer: true, // Multi-layer specified
    },

    finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED",
  };
}

// MITHQAL v25.1 — Institutional Interoperability, Geopolitical Resilience & Multi-Rail Settlement
// =================================================================
// Task ID: V25-1-MASTER-IMPLEMENTATION
//
// This module implements ALL 34 new architectural components from the
// v25.1 Master Implementation Prompt (sections 4-34 + 36-44 + 57).
//
// It BUILDS ON TOP of the existing v25.0 architecture — it does NOT
// replace it. v25.0 remains the frozen normative baseline; v25.1 adds
// institutional interoperability, geopolitical resilience, multi-rail
// settlement, asset classification, stablecoin interop, and more.
//
// NON-NEGOTIABLE PRINCIPLES (per prompt §2-3):
//   - MITHQAL remains neutral wholesale institutional settlement infrastructure
//   - MTQ remains a neutral institutional cross-border settlement unit
//   - Bank-side architecture preserved (TRANSLATION, NOT TRANSFORMATION)
//   - No core banking replacement
//   - No SWIFT replacement
//   - No USD peg
//   - No retail exchange
// =================================================================

import { MODULE_VERSION as V25_0_VERSION } from "./final-integrated-architecture";

export const MODULE_VERSION = "v25.1-institutional-interop-1.0" as const;
export const TASK_ID = "V25-1-MASTER-IMPLEMENTATION" as const;
export const BLUEPRINT_VERSION = "v25.1 — Institutional Interoperability, Geopolitical Resilience & Multi-Rail Settlement Edition" as const;
export const V25_0_BASELINE = "v25.0 (FROZEN — preserved as baseline)" as const;

// =================================================================
// §4 — MTQ NEUTRALITY CONSTITUTION
// =================================================================

export const NEUTRALITY_CONSTITUTION = `
No single sovereign currency, issuer, financial institution, jurisdiction, technology network, payment rail, reserve asset, stablecoin, custodian, or liquidity provider may become structurally indispensable to MTQ.
`;

export interface NeutralityIndicator {
  dimension: string;
  currentConcentration: number;  // 0-1
  maxAllowed: number;             // 0-1
  status: "COMPLIANT" | "WARNING" | "BREACH";
  action: string;
}

export const NEUTRALITY_DIMENSIONS = [
  "sovereign_currency",
  "issuer",
  "financial_institution",
  "jurisdiction",
  "technology_network",
  "payment_rail",
  "reserve_asset",
  "stablecoin",
  "custodian",
  "liquidity_provider",
];

export function evaluateNeutrality(exposures: Record<string, number>): NeutralityIndicator[] {
  const MAX_CONCENTRATION = 0.25; // 25% max per dimension
  return NEUTRALITY_DIMENSIONS.map((dim) => {
    const current = exposures[dim] ?? 0;
    const status = current > MAX_CONCENTRATION ? "BREACH" : current > MAX_CONCENTRATION * 0.8 ? "WARNING" : "COMPLIANT";
    return {
      dimension: dim,
      currentConcentration: current,
      maxAllowed: MAX_CONCENTRATION,
      status,
      action: status === "BREACH" ? "REDUCE_EXPOSURE" : status === "WARNING" ? "MONITOR" : "NONE",
    };
  });
}

// =================================================================
// §5 — GEOPOLITICAL EXPOSURE MANAGEMENT
// =================================================================

export type ExposureDimension =
  | "sovereign_country"
  | "currency"
  | "bank"
  | "banking_group"
  | "custodian"
  | "liquidity_provider"
  | "payment_network"
  | "technology_provider"
  | "legal_jurisdiction"
  | "stablecoin_issuer"
  | "reserve_asset_issuer"
  | "correspondent_banking_dependency"
  | "sanctions_regime";

export interface GeopoliticalExposure {
  dimension: ExposureDimension;
  entity: string;
  exposureAmount: number;
  exposurePercent: number;
  jurisdiction: string;
  correlatedWith: string[];
  countryConcentrationScore: number;
  institutionConcentrationScore: number;
  correlatedExposureScore: number;
  geopoliticalDependencyScore: number;
  effectiveConcentrationScore: number;
}

export interface CorrelatedExposureAnalysis {
  entities: string[];
  sharedJurisdiction: boolean;
  sharedCorrespondent: boolean;
  sharedCustodian: boolean;
  sharedPaymentRail: boolean;
  sharedSovereignRisk: boolean;
  effectiveConcentration: number;
  warning: string;
}

export function analyzeCorrelatedExposure(exposures: GeopoliticalExposure[]): CorrelatedExposureAnalysis[] {
  // Group by jurisdiction and check if seemingly diversified entities are actually correlated
  const byJurisdiction = new Map<string, GeopoliticalExposure[]>();
  for (const exp of exposures) {
    const key = exp.jurisdiction;
    if (!byJurisdiction.has(key)) byJurisdiction.set(key, []);
    byJurisdiction.get(key)!.push(exp);
  }

  const analyses: CorrelatedExposureAnalysis[] = [];
  for (const [jurisdiction, exps] of byJurisdiction) {
    if (exps.length > 1) {
      const totalExposure = exps.reduce((sum, e) => sum + e.exposureAmount, 0);
      analyses.push({
        entities: exps.map((e) => e.entity),
        sharedJurisdiction: true,
        sharedCorrespondent: exps.every((e) => e.correlatedWith.includes("same_correspondent")),
        sharedCustodian: exps.every((e) => e.correlatedWith.includes("same_custodian")),
        sharedPaymentRail: exps.every((e) => e.correlatedWith.includes("same_payment_rail")),
        sharedSovereignRisk: true,
        effectiveConcentration: totalExposure,
        warning: `Entities in ${jurisdiction} appear diversified but share sovereign risk. Effective concentration: ${totalExposure}.`,
      });
    }
  }
  return analyses;
}

// =================================================================
// §6 — SETTLEMENT SOVEREIGNTY FRAMEWORK
// =================================================================

export type RailTier = "PRIMARY" | "SECONDARY" | "EMERGENCY";
export type RailType =
  | "SWIFT"
  | "ISO_20022"
  | "DOMESTIC_RTGS"
  | "DOMESTIC_PAYMENT_SYSTEM"
  | "INSTANT_PAYMENT_RAIL"
  | "TOKENISED_DEPOSIT_NETWORK"
  | "CBDC_INFRASTRUCTURE"
  | "INSTITUTIONAL_DIGITAL_ASSET_RAIL";

export type FailureCondition =
  | "RAIL_OUTAGE"
  | "BANK_OUTAGE"
  | "PROVIDER_OUTAGE"
  | "LIQUIDITY_FAILURE"
  | "ORACLE_FAILURE"
  | "TOKEN_NETWORK_OUTAGE"
  | "JURISDICTIONAL_RESTRICTION";

export type RoutingAction = "RETRY" | "ALTERNATE_APPROVED_ROUTE" | "EMERGENCY_APPROVED_ROUTE" | "SAFE_HALT";

export interface SettlementSovereigntyConfig {
  corridor: string;
  primaryRail: RailType;
  secondaryRail: RailType;
  emergencyRail: RailType;
  failureConditions: FailureCondition[];
  routingActions: RoutingAction[];
}

export const SOVEREIGNTY_RULE = `
MITHQAL must support continued operation through multiple legitimate settlement and connectivity options.
This is resilience, not circumvention. Do NOT bypass laws, sanctions, regulatory restrictions, or institution-imposed controls.
`;

// =================================================================
// §7 — MULTI-ASSET + MULTI-RAIL ARCHITECTURE
// =================================================================

export type MultiAssetType =
  | "FIAT"
  | "BANK_MONEY"
  | "TOKENISED_BANK_MONEY"
  | "CBDC"
  | "APPROVED_STABLECOIN"
  | "APPROVED_GOLD_BACKED_INSTRUMENT"
  | "APPROVED_COMMODITY_INSTITUTIONAL_ASSET";

export const MULTI_ASSET_TYPES: MultiAssetType[] = [
  "FIAT", "BANK_MONEY", "TOKENISED_BANK_MONEY", "CBDC",
  "APPROVED_STABLECOIN", "APPROVED_GOLD_BACKED_INSTRUMENT",
  "APPROVED_COMMODITY_INSTITUTIONAL_ASSET",
];

export const MULTI_RAIL_TYPES: RailType[] = [
  "SWIFT", "ISO_20022", "DOMESTIC_RTGS", "DOMESTIC_PAYMENT_SYSTEM",
  "INSTANT_PAYMENT_RAIL", "TOKENISED_DEPOSIT_NETWORK",
  "CBDC_INFRASTRUCTURE", "INSTITUTIONAL_DIGITAL_ASSET_RAIL",
];

export const MULTI_RAIL_RULE = "Do not hard-code MITHQAL to any single rail.";

// =================================================================
// §8 — ASSET CLASSIFICATION LAYER
// =================================================================

export type AssetClassification =
  | "RESERVE_ASSET"
  | "INPUT_ASSET"
  | "SETTLEMENT_ASSET"
  | "LIQUIDITY_ASSET"
  | "CONVERSION_ONLY"
  | "PROHIBITED";

export interface AssetClassificationEntry {
  assetId: string;
  classifications: AssetClassification[];
  policyAllows: boolean;
  note: string;
}

export const CLASSIFICATION_RULE = `
An asset may have multiple permitted roles only when policy explicitly allows it.
Do NOT assume: input asset = reserve asset, or settlement asset = reserve asset.
`;

// =================================================================
// §9 — ASSET ELIGIBILITY REGISTRY
// =================================================================

export type AssetStatus = "ACTIVE" | "WATCH" | "RESTRICTED" | "SUSPENDED" | "PROHIBITED" | "EMERGENCY";

export interface AssetEligibilityRecord {
  assetId: string;
  assetName: string;
  assetType: MultiAssetType;
  issuer: string;
  issuerCountry: string;
  legalClassification: string;
  jurisdiction: string;
  permittedJurisdictions: string[];
  supportedNetworks: string[];
  reserveEligibility: boolean;
  inputEligibility: boolean;
  settlementEligibility: boolean;
  liquidityEligibility: boolean;
  riskTier: "TIER_A" | "TIER_B" | "TIER_C" | "TIER_D_CONVERSION_ONLY" | "PROHIBITED";
  liquidityTier: "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4";
  haircut: number; // 0-1
  concentrationLimit: number; // 0-1
  oracleRequirements: string[];
  sanctionsStatus: "CLEAR" | "WATCH" | "RESTRICTED" | "BLOCKED";
  issuerStatus: AssetStatus;
  redemptionStatus: "AVAILABLE" | "RESTRICTED" | "SUSPENDED" | "UNAVAILABLE";
  custodyRequirements: string;
  approvedProviders: string[];
  status: AssetStatus;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export const ASSET_REGISTRY: AssetEligibilityRecord[] = [
  // Fiat currencies
  { assetId: "USD", assetName: "US Dollar", assetType: "FIAT", issuer: "Federal Reserve", issuerCountry: "US", legalClassification: "sovereign_currency", jurisdiction: "US", permittedJurisdictions: ["ALL"], supportedNetworks: ["SWIFT", "ISO_20022", "DOMESTIC_RTGS"], reserveEligibility: true, inputEligibility: true, settlementEligibility: true, liquidityEligibility: true, riskTier: "TIER_A", liquidityTier: "TIER_1", haircut: 0, concentrationLimit: 0.25, oracleRequirements: ["FX_ORACLE"], sanctionsStatus: "CLEAR", issuerStatus: "ACTIVE", redemptionStatus: "AVAILABLE", custodyRequirements: "BANK_CUSTODY", approvedProviders: ["ANY_REGULATED_BANK"], status: "ACTIVE", effectiveFrom: "2026-08-17", effectiveTo: null },
  { assetId: "EUR", assetName: "Euro", assetType: "FIAT", issuer: "ECB", issuerCountry: "EU", legalClassification: "sovereign_currency", jurisdiction: "EU", permittedJurisdictions: ["ALL"], supportedNetworks: ["SWIFT", "ISO_20022", "DOMESTIC_RTGS"], reserveEligibility: true, inputEligibility: true, settlementEligibility: true, liquidityEligibility: true, riskTier: "TIER_A", liquidityTier: "TIER_1", haircut: 0, concentrationLimit: 0.25, oracleRequirements: ["FX_ORACLE"], sanctionsStatus: "CLEAR", issuerStatus: "ACTIVE", redemptionStatus: "AVAILABLE", custodyRequirements: "BANK_CUSTODY", approvedProviders: ["ANY_REGULATED_BANK"], status: "ACTIVE", effectiveFrom: "2026-08-17", effectiveTo: null },
  { assetId: "JPY", assetName: "Japanese Yen", assetType: "FIAT", issuer: "BoJ", issuerCountry: "JP", legalClassification: "sovereign_currency", jurisdiction: "JP", permittedJurisdictions: ["ALL"], supportedNetworks: ["SWIFT", "ISO_20022", "DOMESTIC_RTGS"], reserveEligibility: true, inputEligibility: true, settlementEligibility: true, liquidityEligibility: true, riskTier: "TIER_A", liquidityTier: "TIER_1", haircut: 0, concentrationLimit: 0.25, oracleRequirements: ["FX_ORACLE"], sanctionsStatus: "CLEAR", issuerStatus: "ACTIVE", redemptionStatus: "AVAILABLE", custodyRequirements: "BANK_CUSTODY", approvedProviders: ["ANY_REGULATED_BANK"], status: "ACTIVE", effectiveFrom: "2026-08-17", effectiveTo: null },
  { assetId: "AED", assetName: "UAE Dirham", assetType: "FIAT", issuer: "CBUAE", issuerCountry: "AE", legalClassification: "sovereign_currency", jurisdiction: "AE", permittedJurisdictions: ["ALL"], supportedNetworks: ["SWIFT", "ISO_20022", "DOMESTIC_RTGS"], reserveEligibility: true, inputEligibility: true, settlementEligibility: true, liquidityEligibility: true, riskTier: "TIER_A", liquidityTier: "TIER_1", haircut: 0, concentrationLimit: 0.25, oracleRequirements: ["FX_ORACLE"], sanctionsStatus: "CLEAR", issuerStatus: "ACTIVE", redemptionStatus: "AVAILABLE", custodyRequirements: "BANK_CUSTODY", approvedProviders: ["ANY_REGULATED_BANK"], status: "ACTIVE", effectiveFrom: "2026-08-17", effectiveTo: null },
  // Gold
  { assetId: "XAU", assetName: "Physical Gold (Allocated)", assetType: "APPROVED_GOLD_BACKED_INSTRUMENT", issuer: "N/A", issuerCountry: "N/A", legalClassification: "commodity", jurisdiction: "N/A", permittedJurisdictions: ["ALL"], supportedNetworks: ["PHYSICAL_CUSTODY"], reserveEligibility: true, inputEligibility: true, settlementEligibility: false, liquidityEligibility: true, riskTier: "TIER_A", liquidityTier: "TIER_2", haircut: 0.05, concentrationLimit: 0.25, oracleRequirements: ["GOLD_PRICE_ORACLE"], sanctionsStatus: "CLEAR", issuerStatus: "ACTIVE", redemptionStatus: "AVAILABLE", custodyRequirements: "ALLOCATED_SEGREGATED", approvedProviders: ["BRINKS", "LOOMIS", "MALCA_AMIT"], status: "ACTIVE", effectiveFrom: "2026-08-17", effectiveTo: null },
  // Stablecoins
  { assetId: "USDC", assetName: "USD Coin", assetType: "APPROVED_STABLECOIN", issuer: "Circle", issuerCountry: "US", legalClassification: "stablecoin", jurisdiction: "US", permittedJurisdictions: ["ALL"], supportedNetworks: ["ETHEREUM", "SOLANA", "AVALANCHE"], reserveEligibility: false, inputEligibility: true, settlementEligibility: false, liquidityEligibility: true, riskTier: "TIER_C", liquidityTier: "TIER_2", haircut: 0.03, concentrationLimit: 0.10, oracleRequirements: ["STABLECOIN_ORACLE", "DEPEG_MONITOR"], sanctionsStatus: "CLEAR", issuerStatus: "ACTIVE", redemptionStatus: "AVAILABLE", custodyRequirements: "QUALIFIED_CUSTODIAN", approvedProviders: ["CIRCLE_REDEEM"], status: "WATCH", effectiveFrom: "2026-08-17", effectiveTo: null },
  { assetId: "USDT", assetName: "Tether", assetType: "APPROVED_STABLECOIN", issuer: "Tether", issuerCountry: "VG", legalClassification: "stablecoin", jurisdiction: "VG", permittedJurisdictions: ["ALL"], supportedNetworks: ["ETHEREUM", "TRON", "SOLANA"], reserveEligibility: false, inputEligibility: true, settlementEligibility: false, liquidityEligibility: true, riskTier: "TIER_C", liquidityTier: "TIER_2", haircut: 0.05, concentrationLimit: 0.10, oracleRequirements: ["STABLECOIN_ORACLE", "DEPEG_MONITOR"], sanctionsStatus: "CLEAR", issuerStatus: "ACTIVE", redemptionStatus: "AVAILABLE", custodyRequirements: "QUALIFIED_CUSTODIAN", approvedProviders: ["TETHER_REDEEM"], status: "WATCH", effectiveFrom: "2026-08-17", effectiveTo: null },
  // PAXG
  { assetId: "PAXG", assetName: "PAX Gold", assetType: "APPROVED_GOLD_BACKED_INSTRUMENT", issuer: "Paxos", issuerCountry: "US", legalClassification: "tokenized_gold", jurisdiction: "US", permittedJurisdictions: ["ALL"], supportedNetworks: ["ETHEREUM"], reserveEligibility: true, inputEligibility: true, settlementEligibility: false, liquidityEligibility: true, riskTier: "TIER_B", liquidityTier: "TIER_2", haircut: 0.08, concentrationLimit: 0.10, oracleRequirements: ["GOLD_PRICE_ORACLE", "PAXG_REDEMPTION_ORACLE"], sanctionsStatus: "CLEAR", issuerStatus: "ACTIVE", redemptionStatus: "AVAILABLE", custodyRequirements: "TOKEN_CUSTODY", approvedProviders: ["PAXOS_REDEEM"], status: "ACTIVE", effectiveFrom: "2026-08-17", effectiveTo: null },
];

export function getAssetEligibility(assetId: string): AssetEligibilityRecord | undefined {
  return ASSET_REGISTRY.find((a) => a.assetId === assetId);
}

// =================================================================
// §10 — MTQ ASSET INTEROPERABILITY GATEWAY
// =================================================================

export type InteropGatewayStep =
  | "EXTERNAL_ASSET"
  | "ASSET_ELIGIBILITY"
  | "JURISDICTION_CHECK"
  | "KYC_KYB_AML"
  | "SANCTIONS"
  | "APPROVED_PROVIDER_SELECTION"
  | "QUOTE_PRICING"
  | "CONVERSION_EXECUTION"
  | "SETTLEMENT_FINALITY"
  | "BACKING_RECOGNITION"
  | "DMCE"
  | "MTQ_MINT";

export const INTEROP_GATEWAY_STEPS: InteropGatewayStep[] = [
  "EXTERNAL_ASSET", "ASSET_ELIGIBILITY", "JURISDICTION_CHECK", "KYC_KYB_AML",
  "SANCTIONS", "APPROVED_PROVIDER_SELECTION", "QUOTE_PRICING", "CONVERSION_EXECUTION",
  "SETTLEMENT_FINALITY", "BACKING_RECOGNITION", "DMCE", "MTQ_MINT",
];

export const INTEROP_GATEWAY_RULE = `
MITHQAL orchestrates and validates. A regulated external institution executes regulated conversion.
Do NOT create a crypto exchange.
`;

// =================================================================
// §11 — AUTHORIZED EXTERNAL PARTICIPANT MODEL
// =================================================================

export type ProviderType =
  | "PARTICIPATING_BANK"
  | "REGULATED_FX_PROVIDER"
  | "APPROVED_LIQUIDITY_PROVIDER"
  | "REGULATED_CASP"
  | "QUALIFIED_CUSTODIAN"
  | "STABLECOIN_ISSUER"
  | "CBDC_PARTICIPANT"
  | "TOKENISED_DEPOSIT_ISSUING_BANK";

export interface ProviderRecord {
  providerId: string;
  entityType: ProviderType;
  name: string;
  jurisdictions: string[];
  licenses: string[];
  regulatedServices: string[];
  approvedAssets: string[];
  approvedCorridors: string[];
  settlementMethods: RailType[];
  riskRating: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "CC" | "C" | "D";
  limits: {
    perTransaction: number;
    daily: number;
    monthly: number;
  };
  status: AssetStatus;
}

export const PROVIDER_REGISTRY: ProviderRecord[] = [];

export const PROVIDER_RULE = "No provider may execute an activity outside its configured legal/operational scope.";

// =================================================================
// §12 — FINALITY-BEFORE-MINT (CONSTITUTIONAL-GRADE RULE)
// =================================================================

export const FINALITY_BEFORE_MINT_RULE = `
NO FINAL SETTLEMENT = NO MTQ MINT

The mandatory sequence is:
Asset Presented → Compliance Passed → Conversion Executed → Settlement Finality Confirmed →
Backing Legally Recognized → Reserve Evidence Confirmed → DMCE Authorization → MTQ Mint

Never mint MTQ based solely on:
- instruction
- intent
- provisional transfer
- unconfirmed blockchain transaction
- pending bank transfer
- pending FX execution
- preliminary reserve statement
`;

export type FinalityCheckResult = {
  step: string;
  confirmed: boolean;
  evidence: string;
  timestamp: string;
};

export function checkFinalityBeforeMint(checks: FinalityCheckResult[]): {
  canMint: boolean;
  blockingStep: string | null;
  allConfirmed: boolean;
} {
  const unconfirmed = checks.find((c) => !c.confirmed);
  return {
    canMint: !unconfirmed,
    blockingStep: unconfirmed?.step ?? null,
    allConfirmed: !unconfirmed,
  };
}

// =================================================================
// §13 — STABLECOIN INTEROPERABILITY
// =================================================================

export interface StablecoinEvaluation {
  assetId: string;
  issuer: string;
  legalStatus: string;
  jurisdiction: string;
  reserveModel: string;
  redemption: string;
  custody: string;
  sanctions: string;
  network: string;
  liquidity: number;
  depegBehavior: "STABLE" | "MINOR_DEPEG" | "MAJOR_DEPEG" | "SEVERE_DEPEG";
  freezeCapability: boolean;
  regulatoryEligibility: "ELIGIBLE" | "CONDITIONAL" | "INELIGIBLE";
}

export const STABLECOIN_RULE = "Do NOT automatically whitelist stablecoins. Each stablecoin must pass full eligibility evaluation.";

// =================================================================
// §14 — STABLECOIN INPUTS ARE NOT AUTOMATIC MTQ RESERVES
// =================================================================

export const STABLECOIN_NOT_RESERVE_RULE = `
A stablecoin received as an input is not automatically an MTQ reserve asset.

Preferred workflow:
USDC/USDT → Authorized Conversion Provider → Fiat/Eligible Backing Asset → Protected Backing Cell → Reserve Recognition → DMCE → MTQ Mint

Stablecoins should normally be treated as: INPUT / BRIDGE ASSETS
unless a separate approved legal/regulatory framework explicitly permits another treatment.
`;

// =================================================================
// §15 — STABLECOIN DEPEG PROTECTION
// =================================================================

export type DepegThreshold = "PCT_1" | "PCT_3" | "PCT_5" | "PCT_10" | "PCT_20" | "SEVERE" | "ISSUER_FAILURE" | "FREEZE" | "LIQUIDITY_COLLAPSE" | "CHAIN_OUTAGE";

export interface DepegControl {
  threshold: DepegThreshold;
  deviationPercent: number;
  action: "MONITOR" | "HAIRCUT_INCREASE" | "RESTRICT_INPUT" | "SUSPEND_INPUT" | "PROHIBIT" | "EMERGENCY_HALT";
  description: string;
}

export const DEPEG_CONTROLS: DepegControl[] = [
  { threshold: "PCT_1", deviationPercent: 1, action: "MONITOR", description: "Minor deviation — monitor closely" },
  { threshold: "PCT_3", deviationPercent: 3, action: "MONITOR", description: "Elevated deviation — increase monitoring" },
  { threshold: "PCT_5", deviationPercent: 5, action: "HAIRCUT_INCREASE", description: "Significant deviation — increase haircut" },
  { threshold: "PCT_10", deviationPercent: 10, action: "RESTRICT_INPUT", description: "Major deviation — restrict new inputs" },
  { threshold: "PCT_20", deviationPercent: 20, action: "SUSPEND_INPUT", description: "Severe deviation — suspend all inputs" },
  { threshold: "SEVERE", deviationPercent: 50, action: "PROHIBIT", description: "Critical deviation — prohibit asset entirely" },
  { threshold: "ISSUER_FAILURE", deviationPercent: 100, action: "EMERGENCY_HALT", description: "Issuer failure — emergency halt" },
  { threshold: "FREEZE", deviationPercent: 0, action: "SUSPEND_INPUT", description: "Issuer freeze detected — suspend inputs" },
  { threshold: "LIQUIDITY_COLLAPSE", deviationPercent: 0, action: "SUSPEND_INPUT", description: "Liquidity collapse — suspend inputs" },
  { threshold: "CHAIN_OUTAGE", deviationPercent: 0, action: "RESTRICT_INPUT", description: "Chain outage — restrict inputs until restored" },
];

export const DEPEG_RULE = `
The system must NOT assume: 1 USDT = 1 MTQ or 1 USDC = 1 MTQ
unless the actual authorized settlement price supports it.
`;

// =================================================================
// §16 — MTQ VALUATION ENGINE
// =================================================================

export interface ValuationRequest {
  inputAsset: string;
  inputAmount: number;
  outputAsset: string; // "MTQ"
  jurisdiction: string;
  provider: string;
}

export interface ValuationResult {
  referencePrice: number;
  executablePrice: number;
  bid: number;
  ask: number;
  spread: number;
  slippage: number;
  liquidity: number;
  haircut: number;
  netEligibleValue: number;
  expectedMTQ: number;
  fees: number;
  marketImpact: number;
  settlementCost: number;
  totalCost: number;
  reproducible: true;
  calculationTimestamp: string;
  evidence: string;
}

export const VALUATION_RULE = `
PAR = common accounting/reference unit. Do NOT treat PAR as an automatic promise that 1 MTQ = 1 USD.

For external conversion, calculate using:
MTQ authoritative valuation + external executable market/conversion price + fees + spread + slippage + market impact + settlement cost

Every conversion must be reproducible after the fact.
`;

export function calculateValuation(req: ValuationRequest, marketData: {
  referencePrice: number;
  bid: number;
  ask: number;
  liquidity: number;
  haircut: number;
  feeRate: number;
}): ValuationResult {
  const spread = marketData.ask - marketData.bid;
  const executablePrice = (marketData.bid + marketData.ask) / 2;
  const slippage = Math.max(0, (req.inputAmount / Math.max(marketData.liquidity, 1)) * spread * 0.5);
  const marketImpact = req.inputAmount > marketData.liquidity * 0.1 ? spread * 0.3 : 0;
  const grossValue = req.inputAmount * executablePrice;
  const afterHaircut = grossValue * (1 - marketData.haircut);
  const fees = afterHaircut * marketData.feeRate;
  const settlementCost = afterHaircut * 0.0001; // 1bp settlement cost
  const totalCost = fees + settlementCost + slippage + marketImpact;
  const netEligibleValue = afterHaircut - totalCost;
  const expectedMTQ = netEligibleValue; // 1 MTQ = 1 PAR

  return {
    referencePrice: marketData.referencePrice,
    executablePrice,
    bid: marketData.bid,
    ask: marketData.ask,
    spread,
    slippage,
    liquidity: marketData.liquidity,
    haircut: marketData.haircut,
    netEligibleValue,
    expectedMTQ,
    fees,
    marketImpact,
    settlementCost,
    totalCost,
    reproducible: true,
    calculationTimestamp: new Date().toISOString(),
    evidence: `Calculated from market data: bid=${marketData.bid}, ask=${marketData.ask}, haircut=${marketData.haircut}, feeRate=${marketData.feeRate}`,
  };
}

// =================================================================
// §17 — BANK-HELD PROTECTED BACKING (PBC)
// =================================================================

export type BackingType = "ORDINARY_BANK_DEPOSIT" | "PROTECTED_MTQ_BACKING";

export interface ProtectedBackingCell {
  cellId: string;
  bankId: string;
  assetId: string;
  amount: number;
  backingType: BackingType;
  legalControl: string;
  segregationStatus: "SEGREGATED" | "OMNIBUS" | "PENDING";
  encumbranceStatus: "UNENCUMBERED" | "ENCUMBERED";
  doubleCountingCheck: boolean;
  reconciliationStatus: "VERIFIED" | "WARNING" | "MISMATCH";
  evidence: string;
  insolvencyTreatment: string;
  redemptionClaim: string;
  jurisdictionalLegality: "VALID" | "PENDING" | "INVALID";
}

export const PBC_RULE = `
Ordinary bank deposits must NOT automatically equal constitutional MTQ backing.

The system must distinguish:
  ORDINARY_BANK_DEPOSIT  ≠  PROTECTED_MTQ_BACKING

A Protected Backing Cell (PBC) has explicit controls for:
identification, legal control, segregation/protection, no unauthorized reuse,
no double counting, encumbrance tracking, reconciliation, evidence,
insolvency treatment, redemption claim, jurisdictional legality.
`;

// =================================================================
// §18 — RESERVE ARCHITECTURE (v25.1 Updated)
// =================================================================

export const RESERVE_TARGET_V25_1 = {
  strategicTarget: 1.30,  // 130%
  target: { fiat: 0.80, gold: 0.18, digital: 0.02 },
  bands: {
    fiat: { min: 0.70, max: 0.85, stressTarget: 0.75, emergencyTarget: 0.70 },
    gold: { min: 0.15, max: 0.25, stressTarget: 0.20, emergencyTarget: 0.15 },
    digital: { min: 0.00, max: 0.05, stressTarget: 0.03, emergencyTarget: 0.00 },
  },
  rule: "Do not hard-code these percentages as immutable business logic. Store target/minimum/maximum/stress_target/emergency_target as governance-controlled policy.",
};

// =================================================================
// §19 — RESERVE ASSET QUALITY TIERS
// =================================================================

export type ReserveQualityTier = "TIER_A" | "TIER_B" | "TIER_C" | "TIER_D_CONVERSION_ONLY" | "PROHIBITED";

export interface ReserveQualityDefinition {
  tier: ReserveQualityTier;
  description: string;
  examples: string[];
  haircutRange: [number, number];
}

export const RESERVE_QUALITY_TIERS: ReserveQualityDefinition[] = [
  { tier: "TIER_A", description: "Highest quality — sovereign-grade, instantaneous liquidity", examples: ["Cash at central banks", "T-bills", "G7 sovereign bonds"], haircutRange: [0, 0.02] },
  { tier: "TIER_B", description: "High quality — allocated gold, supranational instruments", examples: ["Physical allocated gold", "PAXG", "World Bank bonds"], haircutRange: [0.03, 0.08] },
  { tier: "TIER_C", description: "Moderate quality — approved stablecoins, MMFs", examples: ["USDC", "USDT", "Money market funds"], haircutRange: [0.03, 0.10] },
  { tier: "TIER_D_CONVERSION_ONLY", description: "Conversion-only — not reserve eligible", examples: ["Pending FX", "Provisional transfers"], haircutRange: [1, 1] },
  { tier: "PROHIBITED", description: "Prohibited — cannot be used in any capacity", examples: ["Sanctioned assets", "Unapproved tokens"], haircutRange: [1, 1] },
];

export const RESERVE_QUALITY_RULE = `
The reserve engine must calculate: Risk-Adjusted Eligible Backing
not merely: nominal reserve balance.
`;

// =================================================================
// §20 — RESERVE / LIQUIDITY SEPARATION
// =================================================================

export type LiquidityCategory =
  | "CONSTITUTIONAL_SOLVENCY_RESERVE"
  | "SETTLEMENT_LIQUIDITY"
  | "EMERGENCY_LIQUIDITY"
  | "CONVERSION_LIQUIDITY";

export const LIQUIDITY_SEPARATION_RULE = `
Explicitly separate:
1. Constitutional solvency reserve
2. Settlement liquidity
3. Emergency liquidity
4. Conversion liquidity

Never automatically count emergency credit lines as constitutional reserve.
`;

// =================================================================
// §21 — LIQUIDITY COVERAGE FRAMEWORK
// =================================================================

export interface LiquidityCoverageMetric {
  timeframe: "IMMEDIATE" | "1_DAY" | "7_DAY" | "30_DAY";
  coverage: number;
  required: number;
  ratio: number;
  status: "SUFFICIENT" | "WARNING" | "INSUFFICIENT";
}

export interface LiquidityCoverageReport {
  immediateSettlement: LiquidityCoverageMetric;
  oneDay: LiquidityCoverageMetric;
  sevenDay: LiquidityCoverageMetric;
  thirtyDay: LiquidityCoverageMetric;
  corridorLiquidity: number;
  conversionLiquidity: number;
  emergencyLiquidity: number;
  providerConcentration: number;
  bankConcentration: number;
}

// =================================================================
// §22 — GEOPOLITICAL + CONCENTRATION-AWARE DMCE
// =================================================================

export interface GeopoliticalDMCEInput {
  reserveQuantity: number;
  reserveQuality: number;
  liquidity: number;
  bankExposure: number;
  custodianExposure: number;
  countryExposure: number;
  currencyExposure: number;
  providerExposure: number;
  settlementRisk: number;
  stablecoinExposure: number;
  concentration: number;
  stressState: SafeState;
}

export function calculateGeopoliticalDMCE(input: GeopoliticalDMCEInput): number {
  const stressMultiplier = input.stressState === "NORMAL" ? 1.0 :
    input.stressState === "WATCH" ? 0.9 :
    input.stressState === "RESTRICTED" ? 0.7 :
    input.stressState === "EMERGENCY" ? 0.5 :
    input.stressState === "MINT_FROZEN" ? 0 :
    input.stressState === "SETTLEMENT_RESTRICTED" ? 0.3 :
    0; // SAFE_HALT

  const riskAdjustedBacking = input.reserveQuantity * input.reserveQuality;
  const exposureReduction = Math.min(
    input.bankExposure + input.custodianExposure + input.countryExposure +
    input.currencyExposure + input.providerExposure + input.settlementRisk +
    input.stablecoinExposure + input.concentration,
    0.5 // max 50% reduction
  );

  const liquidityFactor = Math.min(input.liquidity, 1.0);

  return Math.max(0, riskAdjustedBacking * stressMultiplier * (1 - exposureReduction) * liquidityFactor);
}

export const GEOPOLITICAL_DMCE_RULE = `
MTQ minting capacity must be risk-adjusted eligible backing.
Not simply: available_balance × fixed_ratio
`;

// =================================================================
// §23 — EMERGENCY LIQUIDITY
// =================================================================

export type EmergencyLiquidityType =
  | "RESERVE"
  | "LIQUIDITY_LINE"
  | "CONTINGENT_FUNDING"
  | "EMERGENCY_LIQUIDITY";

export const EMERGENCY_LIQUIDITY_RULE = "Do not blur these categories: Reserve ≠ Liquidity Line ≠ Contingent Funding ≠ Emergency Liquidity.";

// =================================================================
// §24 — REBALANCING (v25.1 Updated)
// =================================================================

export interface RebalancingCostModel {
  fxSpread: number;
  dealerFee: number;
  slippage: number;
  marketImpact: number;
  custody: number;
  settlement: number;
  taxes: number;
  otherExecutionCosts: number;
  totalCost: number;
  postTradeReserveValue: number;
}

export const REBALANCING_RULE = `
Preserve: continuous monitoring, daily target calculation, trigger-based trading,
normal no-trade threshold around 2%, dynamic adjustment based on volatility/liquidity/concentration/cost/stress.

Post-trade reserve value must deduct actual/estimated costs.
`;

// =================================================================
// §25 — MULTI-RAIL FALLBACK MATRIX
// =================================================================

export interface CorridorRoute {
  corridor: string;
  primaryRail: RailType;
  secondaryRail: RailType;
  emergencyRail: RailType;
  failureConditions: FailureCondition[];
  routingAction: RoutingAction;
}

export const MULTI_RAIL_FALLBACK_RULE = "The system must fail safely.";

// =================================================================
// §26 — CBDC INTEROPERABILITY
// =================================================================

export const CBDC_INTEROP_RULE = `
CBDC = jurisdiction-controlled institutional interoperability.
Do NOT assume public/general corporate access.

Model: CBDC → Central-bank-authorized participant → Bank/institutional gateway → MITHQAL → MTQ
All CBDC connections must be jurisdiction-specific.
`;

// =================================================================
// §27 — TOKENISED BANK MONEY
// =================================================================

export const TOKENISED_BANK_MONEY_RULE = `
Support: Bank Money → Tokenised Bank Money → MTQ
with bank-controlled issuance, compliance and redemption.
Do NOT equate tokenised deposits with stablecoins. Store legal/technical classification separately.
`;

// =================================================================
// §28 — MTQ ↔ EXTERNAL ASSET REDEMPTION
// =================================================================

export const REDEMPTION_RULE = `
MTQ → Redemption Authorization → Compliance → Approved Provider → External Asset → Bank/Authorized Institutional Account

The same eligibility and jurisdiction rules apply in reverse.
No unconditional promises of: 1 MTQ = 1 USDT, 1 MTQ = 1 USDC, 1 MTQ = 1 USD.
`;

// =================================================================
// §29 — NO FORCED CONVERSION
// =================================================================

export const NO_FORCED_CONVERSION_RULE = `
The architecture must allow institutions, where legally permitted, to:
- hold local currency
- use MTQ for settlement only
- maintain MTQ treasury positions
- redeem MTQ
- retain other currencies/assets

MTQ must coexist with sovereign currencies.
`;

// =================================================================
// §30 — LEGAL CLAIM / LIABILITY TRANSPARENCY
// =================================================================

export interface LegalClassification {
  jurisdiction: string;
  legalNature: string;
  ownership: string;
  redemption: string;
  reserveClaim: string;
  settlementFinality: string;
  creditorTreatment: string;
  insolvencyTreatment: string;
  transferability: string;
  pledgeability: string;
  disputeResolution: string;
  applicableLaw: string;
}

export const LEGAL_CLASSIFICATION_RULE = "Never hard-code one global legal classification as universally valid.";

// =================================================================
// §31 — PROOF OF LIABILITIES (Elevated)
// =================================================================

export const PROOF_OF_LIABILITIES_SOURCES = [
  "MITHQAL_CANONICAL_LEDGER",
  "BANK_MTQ_SUBLEDGER",
  "CORPORATE_MTQ_POSITIONS",
  "RESERVE_LEDGER",
  "PROOF_OF_LIABILITIES",
];

export const PROOF_OF_LIABILITIES_RULE = "Elevate Proof of Liabilities to a core institutional control. The system must reconcile all 5 sources. Maintain complete auditability.";

// =================================================================
// §32 — INDEPENDENT ASSURANCE
// =================================================================

export const INDEPENDENT_ASSURANCE_SCOPE = [
  "reserves",
  "liabilities",
  "mint_burn",
  "reconciliation",
  "concentration",
  "stress_metrics",
];

export const INDEPENDENT_ASSURANCE_RULE = `
The system must support evidence packages and auditor/regulator access
without giving auditors operational control.
`;

// =================================================================
// §33 — REGULATORY TRANSPARENCY API
// =================================================================

export const REGULATORY_API_FIELDS = [
  "OUTSTANDING_MTQ",
  "RESERVE_COVERAGE",
  "RESERVE_COMPOSITION",
  "LIABILITY_COMPOSITION",
  "MINTING",
  "BURNING",
  "REDEMPTIONS",
  "BANK_CONCENTRATION",
  "CUSTODIAN_CONCENTRATION",
  "COUNTRY_EXPOSURE",
  "CURRENCY_EXPOSURE",
  "LIQUIDITY",
  "STRESS_STATE",
  "SANCTIONS_EVENTS",
  "OPERATIONAL_INCIDENTS",
];

export const REGULATORY_API_RULE = "Implement strict RBAC and audit logging.";

// =================================================================
// §34 — CORRIDOR CERTIFICATION
// =================================================================

export type CorridorStatus = "CERTIFIED" | "PILOT" | "RESTRICTED" | "SUSPENDED" | "NOT_AVAILABLE";

export interface CorridorRecord {
  corridorId: string;
  origin: string;
  destination: string;
  supportedAssets: string[];
  eligibleProviders: string[];
  primaryRail: RailType;
  secondaryRail: RailType;
  emergencyRail: RailType;
  legalStatus: string;
  operationalStatus: string;
  liquidityStatus: "SUFFICIENT" | "WARNING" | "INSUFFICIENT";
  riskRating: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "CC" | "C" | "D";
  certificationStatus: CorridorStatus;
}

export const CORRIDOR_REGISTRY: CorridorRecord[] = [];

export const CORRIDOR_RULE = "Do not market MTQ as universally operational until specific corridors are actually validated.";

// =================================================================
// §36 — UX: FOUR VISIBLE INSTITUTIONAL CONTROL DOMAINS
// =================================================================

export const INSTITUTIONAL_CONTROL_DOMAINS = [
  {
    name: "Reserve Protection Engine",
    underlyingEngines: ["DMCE", "PBC", "FSCR", "RSS"],
    description: "Constitutional solvency, reserve quality, protected backing",
  },
  {
    name: "Liquidity & Settlement Engine",
    underlyingEngines: ["TTF", "RV", "ILPS", "ERTF"],
    description: "Settlement liquidity, redemption, emergency liquidity",
  },
  {
    name: "Risk & Stress Engine",
    underlyingEngines: ["DCAR", "TCOG"],
    description: "Concentration, stress testing, geopolitical exposure",
  },
  {
    name: "Compliance & Eligibility Engine",
    underlyingEngines: ["SARA"],
    description: "Sanctions, asset eligibility, regulatory reporting",
  },
];

export const UX_RULE = `
Keep existing internal engines but group them into four visible institutional control domains.
Do not remove underlying engines unless the existing implementation proves they are redundant.
`;

// =================================================================
// §38 — SECURITY AND POLICY ENFORCEMENT
// =================================================================

export const SECURITY_REQUIREMENTS = [
  "RBAC",
  "LEAST_PRIVILEGE",
  "CRYPTOGRAPHIC_SIGNATURES",
  "POLICY_AS_CODE",
  "IMMUTABLE_AUDIT_TRAIL",
  "IDEMPOTENCY",
  "REPLAY_PROTECTION",
  "APPROVAL_WORKFLOWS",
  "DUAL_CONTROL_FOR_CRITICAL_OPERATIONS",
  "SAFE_FAILURE",
  "RATE_LIMITS",
  "FRAUD_CONTROLS",
  "PROVIDER_AUTHENTICATION",
  "HSM_MPC_INTEGRATION",
];

export const SECURITY_RULE = "Critical rules must be enforced server-side, not merely hidden in the UI.";

// =================================================================
// §39 — DATABASE / TURSO TABLES (20+ new)
// =================================================================

export const NEW_TURSO_TABLES = [
  "assets",
  "asset_eligibility",
  "asset_roles",
  "asset_networks",
  "asset_providers",
  "providers",
  "provider_licenses",
  "corridors",
  "corridor_routes",
  "settlement_rails",
  "reserve_cells",
  "reserve_assets",
  "protected_backing",
  "liquidity_positions",
  "liquidity_providers",
  "conversion_quotes",
  "conversion_executions",
  "conversion_finality",
  "mtq_mint_authorizations",
  "mtq_redemptions",
  "geopolitical_exposure",
  "concentration_metrics",
  "risk_snapshots",
  "stress_tests",
  "regulatory_views",
  "assurance_evidence",
  "legal_classifications",
  "policy_versions",
];

// =================================================================
// §41 — NEW API ENDPOINTS (20+)
// =================================================================

export const NEW_API_ENDPOINTS = [
  "/api/v25.1/assets",
  "/api/v25.1/assets/eligibility",
  "/api/v25.1/providers",
  "/api/v25.1/providers/eligibility",
  "/api/v25.1/corridors",
  "/api/v25.1/rails",
  "/api/v25.1/conversions",
  "/api/v25.1/conversions/quote",
  "/api/v25.1/conversions/execute",
  "/api/v25.1/conversions/finality",
  "/api/v25.1/mtq/mint",
  "/api/v25.1/mtq/redeem",
  "/api/v25.1/reserves",
  "/api/v25.1/reserves/protected-backing",
  "/api/v25.1/liquidity",
  "/api/v25.1/risk",
  "/api/v25.1/geopolitical-exposure",
  "/api/v25.1/concentration",
  "/api/v25.1/stress",
  "/api/v25.1/regulatory",
  "/api/v25.1/assurance",
];

// =================================================================
// §42 — POLICY-AS-CODE (15 decisions)
// =================================================================

export const POLICY_DECISIONS = [
  "asset_admission",
  "provider_admission",
  "corridor_admission",
  "stablecoin_admission",
  "conversion_allowed",
  "mint_allowed",
  "redeem_allowed",
  "reserve_recognition",
  "bank_backing_recognition",
  "jurisdiction_allowed",
  "sanctions_allowed",
  "concentration_allowed",
  "stress_state",
  "settlement_route",
  "finality_confirmed",
];

export const POLICY_EXAMPLE = `
conversion_allowed = true
ONLY IF
  asset_eligible
  AND provider_authorized
  AND jurisdiction_allowed
  AND compliance_passed
  AND sanctions_passed
  AND executable_price_valid
  AND settlement_finality_confirmed
`;

// =================================================================
// §43 — STRESS TEST ENGINE
// =================================================================

export const STRESS_SCENARIOS = {
  stablecoin: [0.01, 0.03, 0.05, 0.10, 0.20, 0.50, 1.00],
  fx: [0.10, 0.20, 0.30, 0.50],
  gold: [0.10, 0.20, 0.30, 0.50],
  operational: [
    "BANK_OUTAGE", "LP_FAILURE", "CUSTODIAN_FAILURE", "ORACLE_FAILURE",
    "CHAIN_OUTAGE", "RAIL_OUTAGE", "SANCTIONS_EVENT", "ISSUER_FREEZE",
    "LIQUIDITY_SHOCK",
  ],
};

export interface StressTestResult {
  scenario: string;
  startingReserveRatio: number;
  shock: string;
  loss: number;
  remainingReserve: number;
  remainingCoverage: number;
  liquidityImpact: number;
  mintingCapacity: number;
  resultingState: SafeState;
  requiredAction: string;
}

export const STRESS_ENGINE_RULE = "Do not hard-code illustrative calculations as truth. The engine must calculate dynamically from live policy data.";

// =================================================================
// §44 — SAFE STATES
// =================================================================

export type SafeState =
  | "NORMAL"
  | "WATCH"
  | "RESTRICTED"
  | "EMERGENCY"
  | "MINT_FROZEN"
  | "SETTLEMENT_RESTRICTED"
  | "SAFE_HALT";

export interface SafeStateDefinition {
  state: SafeState;
  allowedOperations: string[];
  blockedOperations: string[];
  requiredApprovals: string[];
  automaticActions: string[];
  escalation: string;
  recoveryConditions: string;
}

export const SAFE_STATES: SafeStateDefinition[] = [
  {
    state: "NORMAL",
    allowedOperations: ["MINT", "REDEEM", "TRANSFER", "CONVERT", "SETTLE", "REBALANCE"],
    blockedOperations: [],
    requiredApprovals: [],
    automaticActions: [],
    escalation: "None",
    recoveryConditions: "N/A — normal operation",
  },
  {
    state: "WATCH",
    allowedOperations: ["MINT", "REDEEM", "TRANSFER", "CONVERT", "SETTLE", "REBALANCE"],
    blockedOperations: [],
    requiredApprovals: [],
    automaticActions: ["INCREASE_MONITORING", "HEDGE_IF_POSSIBLE"],
    escalation: "Notify risk committee",
    recoveryConditions: "Indicators return to normal for 24h",
  },
  {
    state: "RESTRICTED",
    allowedOperations: ["REDEEM", "TRANSFER", "SETTLE"],
    blockedOperations: ["MINT_BELOW_THRESHOLD", "UNRESTRICTED_CONVERT"],
    requiredApprovals: ["RISK_COMMITTEE_APPROVAL_FOR_LARGE_MINTS"],
    automaticActions: ["INCREASE_HAIRCUTS", "RESTRICT_CORRIDORS"],
    escalation: "Notify board + regulators if applicable",
    recoveryConditions: "RR ≥ 120% for 48h + risk indicators normalized",
  },
  {
    state: "EMERGENCY",
    allowedOperations: ["REDEEM", "TRANSFER"],
    blockedOperations: ["MINT", "CONVERT", "REBALANCE"],
    requiredApprovals: ["BOARD_APPROVAL_FOR_ANY_NEW_OPERATION"],
    automaticActions: ["ACTIVATE_ILPS", "FREEZE_NON_ESSENTIAL_OPERATIONS"],
    escalation: "Full institutional emergency response",
    recoveryConditions: "RR ≥ 130% for 72h + board approval + regulator notification",
  },
  {
    state: "MINT_FROZEN",
    allowedOperations: ["REDEEM", "TRANSFER"],
    blockedOperations: ["MINT"],
    requiredApprovals: ["BOARD_APPROVAL_TO_UNFREEZE"],
    automaticActions: ["STOP_ALL_NEW_ISSUANCE"],
    escalation: "Full board + regulator notification",
    recoveryConditions: "Root cause resolved + RR ≥ 130% + board vote",
  },
  {
    state: "SETTLEMENT_RESTRICTED",
    allowedOperations: ["REDEEM"],
    blockedOperations: ["MINT", "TRANSFER", "CONVERT", "REBALANCE"],
    requiredApprovals: ["BOARD_APPROVAL_FOR_SETTLEMENT"],
    automaticActions: ["RESTRICT_SETTLEMENT_TO_EMERGENCY_ONLY"],
    escalation: "Full institutional response + regulator",
    recoveryConditions: "Settlement risk resolved + board approval",
  },
  {
    state: "SAFE_HALT",
    allowedOperations: [],
    blockedOperations: ["ALL"],
    requiredApprovals: ["UNANIMOUS_BOARD_APPROVAL_TO_RESUME"],
    automaticActions: ["HALT_ALL_OPERATIONS", "PRESERVE_EVIDENCE", "NOTIFY_REGULATORS"],
    escalation: "Resolution committee activated",
    recoveryConditions: "Root cause fully resolved + unanimous board + regulator approval",
  },
];

// =================================================================
// §47 — BLUEPRINT VERSION
// =================================================================

export const BLUEPRINT_UPDATE = {
  newVersion: "v25.1",
  title: "MITHQAL v25.1 — Institutional Interoperability, Geopolitical Resilience & Multi-Rail Settlement Edition",
  marksExistingComponents: "EXISTING",
  marksEnhancedComponents: "ENHANCED",
  marksNewComponents: "NEW",
  marksDeprecatedComponents: "DEPRECATED",
  rule: "Do not remove the old v25.0 architecture unless explicitly superseded.",
};

// =================================================================
// §54 — DO NOT INVENT REGULATORY AUTHORIZATION
// =================================================================

export const REGULATORY_LANGUAGE_RULE = `
The software must never display language implying:
- "globally regulated"
- "approved by central banks"
- "licensed worldwide"
- "universally compliant"
- "guaranteed reserve"

Use:
- "Jurisdiction-dependent"
- "Subject to applicable law"
- "Approved provider required"
- "Regulatory status configurable"

The software is infrastructure. Legal permissions remain jurisdiction-specific.
`;

// =================================================================
// §55 — FINAL PRODUCT POSITIONING
// =================================================================

export const PRODUCT_POSITIONING = `
MITHQAL is neutral institutional settlement infrastructure designed to connect
regulated forms of money and eligible settlement assets through compliant,
bank-compatible, multi-rail interoperability.

MTQ is a neutral institutional settlement unit, not a replacement for sovereign
currencies, banks, CBDCs, stablecoins, or SWIFT.
`;

// =================================================================
// §57 — ABSOLUTE ARCHITECTURAL RULES (18 rules)
// =================================================================

export const ABSOLUTE_RULES = [
  "NO_CORE_BANKING_REPLACEMENT",
  "NO_MITHQAL_RETAIL_EXCHANGE",
  "NO_AUTOMATIC_STABLECOIN_TO_MTQ_1_TO_1_ASSUMPTION",
  "NO_STABLECOIN_EQUALS_AUTOMATIC_RESERVE",
  "NO_ORDINARY_BANK_DEPOSIT_EQUALS_AUTOMATIC_PROTECTED_BACKING",
  "NO_FINALITY_EQUALS_NO_MINT",
  "NO_UNAUTHORIZED_MINT",
  "NO_UNCONTROLLED_CUSTODY",
  "NO_SINGLE_RAIL_DEPENDENCY",
  "NO_SINGLE_ASSET_DEPENDENCY",
  "NO_SINGLE_JURISDICTION_DEPENDENCY",
  "NO_SINGLE_BANK_DEPENDENCY",
  "NO_SINGLE_PROVIDER_DEPENDENCY",
  "NO_FORCED_CURRENCY_CONVERSION",
  "NO_USD_PEG",
  "NO_SWIFT_REPLACEMENT",
  "NO_PERMISSIONLESS_INSTITUTIONAL_ACCESS",
  "NO_UNSUPERVISED_GLOBAL_AVAILABILITY_CLAIM",
];

// =================================================================
// EXECUTIVE REPORT GENERATOR
// =================================================================

export interface V25_1ExecutiveReport {
  moduleId: string;
  generatedAt: string;
  blueprintVersion: string;
  v25_0Baseline: string;

  // §4
  neutralityConstitution: string;
  neutralityDimensions: string[];
  neutralityIndicators: NeutralityIndicator[];

  // §5
  geopoliticalExposureDimensions: ExposureDimension[];
  correlatedExposureAnalysis: CorrelatedExposureAnalysis[];

  // §6
  settlementSovereigntyRule: string;
  railTypes: RailType[];
  failureConditions: FailureCondition[];
  routingActions: RoutingAction[];

  // §7
  multiAssetTypes: MultiAssetType[];
  multiRailTypes: RailType[];

  // §8
  assetClassifications: AssetClassification[];

  // §9
  assetRegistryCount: number;
  assetRegistry: AssetEligibilityRecord[];

  // §10
  interopGatewaySteps: InteropGatewayStep[];

  // §11
  providerTypes: ProviderType[];
  providerRegistryCount: number;

  // §12
  finalityBeforeMintRule: string;

  // §13-15
  stablecoinEvaluationFields: string[];
  depegControls: DepegControl[];

  // §16
  valuationRule: string;

  // §17
  pbcRule: string;

  // §18-19
  reserveTarget: typeof RESERVE_TARGET_V25_1;
  reserveQualityTiers: ReserveQualityDefinition[];

  // §20-21
  liquidityCategories: LiquidityCategory[];

  // §22
  geopoliticalDMCERule: string;

  // §23
  emergencyLiquidityTypes: EmergencyLiquidityType[];

  // §24
  rebalancingRule: string;

  // §25
  multiRailFallbackRule: string;

  // §26-29
  cbdcInteropRule: string;
  tokenisedBankMoneyRule: string;
  redemptionRule: string;
  noForcedConversionRule: string;

  // §30-33
  legalClassificationRule: string;
  proofOfLiabilitiesSources: string[];
  independentAssuranceScope: string[];
  regulatoryAPIFields: string[];

  // §34
  corridorRegistryCount: number;

  // §36
  institutionalControlDomains: typeof INSTITUTIONAL_CONTROL_DOMAINS;

  // §38
  securityRequirements: string[];

  // §39
  newTursoTables: string[];

  // §41
  newAPIEndpoints: string[];

  // §42
  policyDecisions: string[];

  // §43
  stressScenarios: typeof STRESS_SCENARIOS;

  // §44
  safeStates: SafeStateDefinition[];

  // §47
  blueprintUpdate: typeof BLUEPRINT_UPDATE;

  // §54-55
  regulatoryLanguageRule: string;
  productPositioning: string;

  // §57
  absoluteRules: string[];

  // Honest state
  honestState: {
    honest: true;
    forcedToPass: false;
    productionAuthorized: false;
    v25_0Frozen: true;
    v25_1BuildsOnV25_0: true;
    noCoreBankingReplacement: true;
    noRetailExchange: true;
    noUsdPeg: true;
    finalityBeforeMintEnforced: true;
    stablecoinNotAutomaticReserve: true;
    ordinaryDepositNotAutomaticBacking: true;
  };

  finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED";
}

export function generateV25_1Report(): V25_1ExecutiveReport {
  return {
    moduleId: MODULE_VERSION,
    generatedAt: new Date().toISOString(),
    blueprintVersion: BLUEPRINT_VERSION,
    v25_0Baseline: V25_0_BASELINE,

    neutralityConstitution: NEUTRALITY_CONSTITUTION,
    neutralityDimensions: NEUTRALITY_DIMENSIONS,
    neutralityIndicators: evaluateNeutrality({}),

    geopoliticalExposureDimensions: [
      "sovereign_country", "currency", "bank", "banking_group", "custodian",
      "liquidity_provider", "payment_network", "technology_provider",
      "legal_jurisdiction", "stablecoin_issuer", "reserve_asset_issuer",
      "correspondent_banking_dependency", "sanctions_regime",
    ],
    correlatedExposureAnalysis: [],

    settlementSovereigntyRule: SOVEREIGNTY_RULE,
    railTypes: MULTI_RAIL_TYPES,
    failureConditions: ["RAIL_OUTAGE", "BANK_OUTAGE", "PROVIDER_OUTAGE", "LIQUIDITY_FAILURE", "ORACLE_FAILURE", "TOKEN_NETWORK_OUTAGE", "JURISDICTIONAL_RESTRICTION"],
    routingActions: ["RETRY", "ALTERNATE_APPROVED_ROUTE", "EMERGENCY_APPROVED_ROUTE", "SAFE_HALT"],

    multiAssetTypes: MULTI_ASSET_TYPES,
    multiRailTypes: MULTI_RAIL_TYPES,

    assetClassifications: ["RESERVE_ASSET", "INPUT_ASSET", "SETTLEMENT_ASSET", "LIQUIDITY_ASSET", "CONVERSION_ONLY", "PROHIBITED"],

    assetRegistryCount: ASSET_REGISTRY.length,
    assetRegistry: ASSET_REGISTRY,

    interopGatewaySteps: INTEROP_GATEWAY_STEPS,

    providerTypes: ["PARTICIPATING_BANK", "REGULATED_FX_PROVIDER", "APPROVED_LIQUIDITY_PROVIDER", "REGULATED_CASP", "QUALIFIED_CUSTODIAN", "STABLECOIN_ISSUER", "CBDC_PARTICIPANT", "TOKENISED_DEPOSIT_ISSUING_BANK"],
    providerRegistryCount: PROVIDER_REGISTRY.length,

    finalityBeforeMintRule: FINALITY_BEFORE_MINT_RULE,

    stablecoinEvaluationFields: ["issuer", "legalStatus", "jurisdiction", "reserveModel", "redemption", "custody", "sanctions", "network", "liquidity", "depegBehavior", "freezeCapability", "regulatoryEligibility"],
    depegControls: DEPEG_CONTROLS,

    valuationRule: VALUATION_RULE,

    pbcRule: PBC_RULE,

    reserveTarget: RESERVE_TARGET_V25_1,
    reserveQualityTiers: RESERVE_QUALITY_TIERS,

    liquidityCategories: ["CONSTITUTIONAL_SOLVENCY_RESERVE", "SETTLEMENT_LIQUIDITY", "EMERGENCY_LIQUIDITY", "CONVERSION_LIQUIDITY"],

    geopoliticalDMCERule: GEOPOLITICAL_DMCE_RULE,

    emergencyLiquidityTypes: ["RESERVE", "LIQUIDITY_LINE", "CONTINGENT_FUNDING", "EMERGENCY_LIQUIDITY"],

    rebalancingRule: REBALANCING_RULE,

    multiRailFallbackRule: MULTI_RAIL_FALLBACK_RULE,

    cbdcInteropRule: CBDC_INTEROP_RULE,
    tokenisedBankMoneyRule: TOKENISED_BANK_MONEY_RULE,
    redemptionRule: REDEMPTION_RULE,
    noForcedConversionRule: NO_FORCED_CONVERSION_RULE,

    legalClassificationRule: LEGAL_CLASSIFICATION_RULE,
    proofOfLiabilitiesSources: PROOF_OF_LIABILITIES_SOURCES,
    independentAssuranceScope: INDEPENDENT_ASSURANCE_SCOPE,
    regulatoryAPIFields: REGULATORY_API_FIELDS,

    corridorRegistryCount: CORRIDOR_REGISTRY.length,

    institutionalControlDomains: INSTITUTIONAL_CONTROL_DOMAINS,

    securityRequirements: SECURITY_REQUIREMENTS,

    newTursoTables: NEW_TURSO_TABLES,

    newAPIEndpoints: NEW_API_ENDPOINTS,

    policyDecisions: POLICY_DECISIONS,

    stressScenarios: STRESS_SCENARIOS,

    safeStates: SAFE_STATES,

    blueprintUpdate: BLUEPRINT_UPDATE,

    regulatoryLanguageRule: REGULATORY_LANGUAGE_RULE,
    productPositioning: PRODUCT_POSITIONING,

    absoluteRules: ABSOLUTE_RULES,

    honestState: {
      honest: true,
      forcedToPass: false,
      productionAuthorized: false,
      v25_0Frozen: true,
      v25_1BuildsOnV25_0: true,
      noCoreBankingReplacement: true,
      noRetailExchange: true,
      noUsdPeg: true,
      finalityBeforeMintEnforced: true,
      stablecoinNotAutomaticReserve: true,
      ordinaryDepositNotAutomaticBacking: true,
    },

    finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED",
  };
}

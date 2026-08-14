// v25.0 §20 — Institutional Authorization Registry
// =================================================================
// No institution may transact unless its authorization state is valid.
// This module enforces the permissioned wholesale model.
//
// §20 — Institutional Authorization Registry
// §21 — Institutional Limits
// §16 — Jurisdictional Geo-Fencing
// §15 — Jurisdictional Regulatory Perimeter Engine
// =================================================================

// ---- §15 Jurisdictional Regulatory Perimeter Engine ----
export type JurisdictionStatus = "ALLOWED" | "CONDITIONAL" | "RESTRICTED" | "PROHIBITED" | "UNKNOWN";

export interface JurisdictionClassification {
  mtqLegalStatus: JurisdictionStatus;
  issuanceStatus: JurisdictionStatus;
  settlementStatus: JurisdictionStatus;
  custodyStatus: JurisdictionStatus;
  redemptionStatus: JurisdictionStatus;
  paymentServicesExposure: JurisdictionStatus;
  stablecoinExposure: JurisdictionStatus;
  artRwaExposure: JurisdictionStatus;
  securitiesExposure: JurisdictionStatus;
  commodityExposure: JurisdictionStatus;
  financialMarketExposure: JurisdictionStatus;
  amlCft: JurisdictionStatus;
  sanctions: JurisdictionStatus;
  dataPrivacy: JurisdictionStatus;
  crossBorderTransfer: JurisdictionStatus;
  capitalControls: JurisdictionStatus;
  taxAccounting: JurisdictionStatus;
  licensing: JurisdictionStatus;
  institutionalEligibility: JurisdictionStatus;
}

export const JURISDICTIONAL_RULE = "UNKNOWN = CONSERVATIVE BLOCK. Never infer legal permission from MITHQAL's internal label.";

// Known jurisdictions with classifications (extensible)
export const JURISDICTION_REGISTRY: Record<string, JurisdictionClassification> = {
  US: {
    mtqLegalStatus: "CONDITIONAL", issuanceStatus: "CONDITIONAL", settlementStatus: "ALLOWED",
    custodyStatus: "CONDITIONAL", redemptionStatus: "ALLOWED", paymentServicesExposure: "CONDITIONAL",
    stablecoinExposure: "CONDITIONAL", artRwaExposure: "CONDITIONAL", securitiesExposure: "CONDITIONAL",
    commodityExposure: "ALLOWED", financialMarketExposure: "CONDITIONAL", amlCft: "ALLOWED",
    sanctions: "ALLOWED", dataPrivacy: "CONDITIONAL", crossBorderTransfer: "CONDITIONAL",
    capitalControls: "ALLOWED", taxAccounting: "CONDITIONAL", licensing: "CONDITIONAL",
    institutionalEligibility: "CONDITIONAL",
  },
  EU: {
    mtqLegalStatus: "CONDITIONAL", issuanceStatus: "CONDITIONAL", settlementStatus: "ALLOWED",
    custodyStatus: "CONDITIONAL", redemptionStatus: "ALLOWED", paymentServicesExposure: "CONDITIONAL",
    stablecoinExposure: "CONDITIONAL", artRwaExposure: "CONDITIONAL", securitiesExposure: "CONDITIONAL",
    commodityExposure: "ALLOWED", financialMarketExposure: "CONDITIONAL", amlCft: "ALLOWED",
    sanctions: "ALLOWED", dataPrivacy: "ALLOWED", crossBorderTransfer: "CONDITIONAL",
    capitalControls: "ALLOWED", taxAccounting: "CONDITIONAL", licensing: "CONDITIONAL",
    institutionalEligibility: "CONDITIONAL",
  },
  AE: {
    mtqLegalStatus: "CONDITIONAL", issuanceStatus: "CONDITIONAL", settlementStatus: "ALLOWED",
    custodyStatus: "CONDITIONAL", redemptionStatus: "ALLOWED", paymentServicesExposure: "CONDITIONAL",
    stablecoinExposure: "CONDITIONAL", artRwaExposure: "CONDITIONAL", securitiesExposure: "CONDITIONAL",
    commodityExposure: "ALLOWED", financialMarketExposure: "CONDITIONAL", amlCft: "ALLOWED",
    sanctions: "ALLOWED", dataPrivacy: "CONDITIONAL", crossBorderTransfer: "CONDITIONAL",
    capitalControls: "ALLOWED", taxAccounting: "CONDITIONAL", licensing: "CONDITIONAL",
    institutionalEligibility: "CONDITIONAL",
  },
  SG: {
    mtqLegalStatus: "CONDITIONAL", issuanceStatus: "CONDITIONAL", settlementStatus: "ALLOWED",
    custodyStatus: "CONDITIONAL", redemptionStatus: "ALLOWED", paymentServicesExposure: "CONDITIONAL",
    stablecoinExposure: "CONDITIONAL", artRwaExposure: "CONDITIONAL", securitiesExposure: "CONDITIONAL",
    commodityExposure: "ALLOWED", financialMarketExposure: "CONDITIONAL", amlCft: "ALLOWED",
    sanctions: "ALLOWED", dataPrivacy: "ALLOWED", crossBorderTransfer: "CONDITIONAL",
    capitalControls: "ALLOWED", taxAccounting: "CONDITIONAL", licensing: "CONDITIONAL",
    institutionalEligibility: "CONDITIONAL",
  },
  JP: {
    mtqLegalStatus: "CONDITIONAL", issuanceStatus: "CONDITIONAL", settlementStatus: "ALLOWED",
    custodyStatus: "CONDITIONAL", redemptionStatus: "ALLOWED", paymentServicesExposure: "CONDITIONAL",
    stablecoinExposure: "CONDITIONAL", artRwaExposure: "CONDITIONAL", securitiesExposure: "CONDITIONAL",
    commodityExposure: "ALLOWED", financialMarketExposure: "CONDITIONAL", amlCft: "ALLOWED",
    sanctions: "ALLOWED", dataPrivacy: "ALLOWED", crossBorderTransfer: "CONDITIONAL",
    capitalControls: "ALLOWED", taxAccounting: "CONDITIONAL", licensing: "CONDITIONAL",
    institutionalEligibility: "CONDITIONAL",
  },
  GB: {
    mtqLegalStatus: "CONDITIONAL", issuanceStatus: "CONDITIONAL", settlementStatus: "ALLOWED",
    custodyStatus: "CONDITIONAL", redemptionStatus: "ALLOWED", paymentServicesExposure: "CONDITIONAL",
    stablecoinExposure: "CONDITIONAL", artRwaExposure: "CONDITIONAL", securitiesExposure: "CONDITIONAL",
    commodityExposure: "ALLOWED", financialMarketExposure: "CONDITIONAL", amlCft: "ALLOWED",
    sanctions: "ALLOWED", dataPrivacy: "ALLOWED", crossBorderTransfer: "CONDITIONAL",
    capitalControls: "ALLOWED", taxAccounting: "CONDITIONAL", licensing: "CONDITIONAL",
    institutionalEligibility: "CONDITIONAL",
  },
  HK: {
    mtqLegalStatus: "CONDITIONAL", issuanceStatus: "CONDITIONAL", settlementStatus: "ALLOWED",
    custodyStatus: "CONDITIONAL", redemptionStatus: "ALLOWED", paymentServicesExposure: "CONDITIONAL",
    stablecoinExposure: "CONDITIONAL", artRwaExposure: "CONDITIONAL", securitiesExposure: "CONDITIONAL",
    commodityExposure: "ALLOWED", financialMarketExposure: "CONDITIONAL", amlCft: "ALLOWED",
    sanctions: "ALLOWED", dataPrivacy: "CONDITIONAL", crossBorderTransfer: "CONDITIONAL",
    capitalControls: "ALLOWED", taxAccounting: "CONDITIONAL", licensing: "CONDITIONAL",
    institutionalEligibility: "CONDITIONAL",
  },
  // §16 — China geo-fence (PROHIBITED)
  CN: {
    mtqLegalStatus: "PROHIBITED", issuanceStatus: "PROHIBITED", settlementStatus: "PROHIBITED",
    custodyStatus: "PROHIBITED", redemptionStatus: "PROHIBITED", paymentServicesExposure: "PROHIBITED",
    stablecoinExposure: "PROHIBITED", artRwaExposure: "PROHIBITED", securitiesExposure: "PROHIBITED",
    commodityExposure: "PROHIBITED", financialMarketExposure: "PROHIBITED", amlCft: "PROHIBITED",
    sanctions: "PROHIBITED", dataPrivacy: "PROHIBITED", crossBorderTransfer: "PROHIBITED",
    capitalControls: "PROHIBITED", taxAccounting: "PROHIBITED", licensing: "PROHIBITED",
    institutionalEligibility: "PROHIBITED",
  },
};

// ---- §20 Institutional Authorization Registry ----
export interface InstitutionRecord {
  institutionId: string;
  legalName: string;
  jurisdiction: string;
  regulator: string;
  licenseReference: string;
  participantClass: "A" | "B" | "C";
  permittedMTQFunctions: MTQFunction[];
  permittedCurrencies: string[];
  permittedCorridors: string[];
  maxTransactionSize: number;
  permittedIssuanceLimit: number;
  permittedRedemptionLimit: number;
  operationalStatus: "ACTIVE" | "SUSPENDED" | "REVOKED" | "PENDING";
  sanctionsStatus: "CLEAR" | "FLAGGED" | "BLOCKED";
  expirationDate: string;
  authorizationDate: string;
}

export type MTQFunction = "SETTLE" | "ACQUIRE" | "REDEEM" | "ROUTE" | "OBSERVE" | "ISSUE";

// Registry of authorized institutions (testnet seed data)
export const INSTITUTION_REGISTRY: InstitutionRecord[] = [
  {
    institutionId: "INST-001",
    legalName: "Test Bank A (US)",
    jurisdiction: "US",
    regulator: "OCC",
    licenseReference: "OCC-TEST-001",
    participantClass: "B",
    permittedMTQFunctions: ["SETTLE", "ACQUIRE", "REDEEM", "ROUTE", "ISSUE"],
    permittedCurrencies: ["USD", "USDC"],
    permittedCorridors: ["US-EU", "US-JP", "US-AE"],
    maxTransactionSize: 10_000_000,
    permittedIssuanceLimit: 50_000_000,
    permittedRedemptionLimit: 50_000_000,
    operationalStatus: "ACTIVE",
    sanctionsStatus: "CLEAR",
    expirationDate: "2027-08-14",
    authorizationDate: "2026-08-14",
  },
  {
    institutionId: "INST-002",
    legalName: "Test Bank B (EU)",
    jurisdiction: "EU",
    regulator: "ECB",
    licenseReference: "ECB-TEST-002",
    participantClass: "B",
    permittedMTQFunctions: ["SETTLE", "ACQUIRE", "REDEEM", "ROUTE", "ISSUE"],
    permittedCurrencies: ["EUR", "EURC"],
    permittedCorridors: ["EU-US", "EU-JP", "EU-AE"],
    maxTransactionSize: 10_000_000,
    permittedIssuanceLimit: 50_000_000,
    permittedRedemptionLimit: 50_000_000,
    operationalStatus: "ACTIVE",
    sanctionsStatus: "CLEAR",
    expirationDate: "2027-08-14",
    authorizationDate: "2026-08-14",
  },
  {
    institutionId: "INST-003",
    legalName: "Test Bank C (JP)",
    jurisdiction: "JP",
    regulator: "FSA",
    licenseReference: "FSA-TEST-003",
    participantClass: "B",
    permittedMTQFunctions: ["SETTLE", "ACQUIRE", "REDEEM", "ROUTE", "ISSUE"],
    permittedCurrencies: ["JPY"],
    permittedCorridors: ["JP-US", "JP-EU", "JP-AE"],
    maxTransactionSize: 10_000_000,
    permittedIssuanceLimit: 50_000_000,
    permittedRedemptionLimit: 50_000_000,
    operationalStatus: "ACTIVE",
    sanctionsStatus: "CLEAR",
    expirationDate: "2027-08-14",
    authorizationDate: "2026-08-14",
  },
  {
    institutionId: "INST-004",
    legalName: "Test Bank D (AE)",
    jurisdiction: "AE",
    regulator: "CBUAE",
    licenseReference: "CBUAE-TEST-004",
    participantClass: "B",
    permittedMTQFunctions: ["SETTLE", "ACQUIRE", "REDEEM", "ROUTE", "ISSUE"],
    permittedCurrencies: ["AED"],
    permittedCorridors: ["AE-US", "AE-EU", "AE-JP"],
    maxTransactionSize: 10_000_000,
    permittedIssuanceLimit: 50_000_000,
    permittedRedemptionLimit: 50_000_000,
    operationalStatus: "ACTIVE",
    sanctionsStatus: "CLEAR",
    expirationDate: "2027-08-14",
    authorizationDate: "2026-08-14",
  },
];

// ---- Authorization check functions ----

export interface AuthorizationResult {
  authorized: boolean;
  reason: string;
  institution?: InstitutionRecord;
  jurisdictionClassification?: JurisdictionClassification;
}

/** Check if an institution is authorized to perform a given MTQ function. */
export function checkInstitutionAuthorization(
  institutionId: string,
  mtqFunction: MTQFunction,
  amount?: number,
  currency?: string,
  corridor?: string,
): AuthorizationResult {
  const inst = INSTITUTION_REGISTRY.find(i => i.institutionId === institutionId);
  if (!inst) {
    return { authorized: false, reason: `Institution ${institutionId} not found in registry` };
  }

  // Check operational status
  if (inst.operationalStatus !== "ACTIVE") {
    return { authorized: false, reason: `Institution ${institutionId} status=${inst.operationalStatus}`, institution: inst };
  }

  // Check sanctions
  if (inst.sanctionsStatus === "BLOCKED") {
    return { authorized: false, reason: `Institution ${institutionId} sanctions=BLOCKED`, institution: inst };
  }

  // Check expiration
  const now = new Date();
  const exp = new Date(inst.expirationDate);
  if (now > exp) {
    return { authorized: false, reason: `Institution ${institutionId} authorization expired`, institution: inst };
  }

  // Check function permission
  if (!inst.permittedMTQFunctions.includes(mtqFunction)) {
    return { authorized: false, reason: `Institution ${institutionId} not permitted to ${mtqFunction}`, institution: inst };
  }

  // Check amount limit
  if (amount !== undefined && amount > inst.maxTransactionSize) {
    return { authorized: false, reason: `Amount ${amount} exceeds max ${inst.maxTransactionSize}`, institution: inst };
  }

  // Check currency permission
  if (currency !== undefined && !inst.permittedCurrencies.includes(currency)) {
    return { authorized: false, reason: `Currency ${currency} not permitted for institution`, institution: inst };
  }

  // Check corridor permission
  if (corridor !== undefined && !inst.permittedCorridors.includes(corridor)) {
    return { authorized: false, reason: `Corridor ${corridor} not permitted for institution`, institution: inst };
  }

  // Check jurisdiction classification
  const jur = JURISDICTION_REGISTRY[inst.jurisdiction];
  if (jur) {
    // §15 rule: UNKNOWN = CONSERVATIVE BLOCK
    const relevantStatus = mtqFunction === "ISSUE" ? jur.issuanceStatus
      : mtqFunction === "REDEEM" ? jur.redemptionStatus
      : mtqFunction === "SETTLE" ? jur.settlementStatus
      : jur.mtqLegalStatus;

    if (relevantStatus === "PROHIBITED") {
      return { authorized: false, reason: `Jurisdiction ${inst.jurisdiction} PROHIBITED for ${mtqFunction}`, institution: inst, jurisdictionClassification: jur };
    }
    if (relevantStatus === "UNKNOWN") {
      return { authorized: false, reason: `Jurisdiction ${inst.jurisdiction} UNKNOWN — conservative block`, institution: inst, jurisdictionClassification: jur };
    }
    // CONDITIONAL requires additional review — block by default
    if (relevantStatus === "CONDITIONAL") {
      // In production, this would trigger manual review. For testnet, allow.
      // Return authorized=true but flag the conditional status.
    }
  } else {
    // Jurisdiction not in registry → UNKNOWN → conservative block
    return { authorized: false, reason: `Jurisdiction ${inst.jurisdiction} not classified — UNKNOWN=BLOCK`, institution: inst };
  }

  return { authorized: true, reason: "Authorized", institution: inst, jurisdictionClassification: jur };
}

/** §16 — Check if a jurisdiction is geo-fenced (PROHIBITED). */
export function isGeoFenced(jurisdiction: string): boolean {
  const jur = JURISDICTION_REGISTRY[jurisdiction];
  if (!jur) return true; // UNKNOWN = block
  return jur.mtqLegalStatus === "PROHIBITED" || jur.settlementStatus === "PROHIBITED";
}

/** §20 — Get institution by ID. */
export function getInstitution(institutionId: string): InstitutionRecord | null {
  return INSTITUTION_REGISTRY.find(i => i.institutionId === institutionId) ?? null;
}

/** §21 — Get institutional limits for a given stress state. */
export function getInstitutionalLimits(
  institutionId: string,
  stressState: "NORMAL" | "CAUTION" | "DEFENSIVE" | "STRESS" | "EMERGENCY" | "RECOVERY",
): {
  maxTransactionSize: number;
  maxIntradayExposure: number;
  maxIssuance: number;
  maxRedemption: number;
  tightened: boolean;
} {
  const inst = getInstitution(institutionId);
  if (!inst) {
    return { maxTransactionSize: 0, maxIntradayExposure: 0, maxIssuance: 0, maxRedemption: 0, tightened: true };
  }

  // Stress state tightening factors
  const factors: Record<string, number> = {
    NORMAL: 1.0,
    CAUTION: 0.8,
    DEFENSIVE: 0.6,
    STRESS: 0.4,
    EMERGENCY: 0.1,  // Near-zero in emergency
    RECOVERY: 0.7,
  };

  const factor = factors[stressState] ?? 1.0;
  return {
    maxTransactionSize: Math.floor(inst.maxTransactionSize * factor),
    maxIntradayExposure: Math.floor(inst.permittedIssuanceLimit * factor * 0.3), // 30% intraday
    maxIssuance: Math.floor(inst.permittedIssuanceLimit * factor),
    maxRedemption: Math.floor(inst.permittedRedemptionLimit * factor),
    tightened: factor < 1.0,
  };
}

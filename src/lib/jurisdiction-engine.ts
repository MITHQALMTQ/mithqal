// v24.2 §29-30 — Jurisdictional Regulatory Compliance Engine + China Geo-Fence
// =================================================================
// Version-controlled jurisdiction matrix with per-jurisdiction:
//   MTQ legal status, stablecoin status, custody, AML/KYC, sanctions
//
// China geo-fence: block crypto/stablecoin activity where prohibited
// =================================================================

export type JurisdictionStatus = "ALLOWED" | "CONDITIONAL" | "RESTRICTED" | "PROHIBITED" | "UNKNOWN";

export interface JurisdictionRecord {
  code: string;
  name: string;
  mtqStatus: JurisdictionStatus;
  stablecoinStatus: JurisdictionStatus;
  custodyStatus: JurisdictionStatus;
  redemptionStatus: JurisdictionStatus;
  licensingRequired: string;
  amlKycRequired: boolean;
  sanctionsCheck: boolean;
  taxTreatment: string;
  dataRequirements: string;
  settlementStatus: JurisdictionStatus;
  tokenTradingRestricted: boolean;
  geoFenced: boolean;
  effectiveDate: string;
  source: string;
  reviewDate: string;
}

export const JURISDICTION_MATRIX: Record<string, JurisdictionRecord> = {
  US: {
    code: "US", name: "United States",
    mtqStatus: "CONDITIONAL", stablecoinStatus: "ALLOWED", custodyStatus: "CONDITIONAL",
    redemptionStatus: "CONDITIONAL", licensingRequired: "FinCEN MSB + State MTL + NYDFS BitLicense (NY)",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "Property (IRS)",
    dataRequirements: "BSA reporting, FinCEN CTR/SAR", settlementStatus: "CONDITIONAL",
    tokenTradingRestricted: false, geoFenced: false,
    effectiveDate: "2026-08-12", source: "FinCEN, SEC, CFTC, NYDFS", reviewDate: "2026-11-12",
  },
  EU: {
    code: "EU", name: "European Union/EEA",
    mtqStatus: "CONDITIONAL", stablecoinStatus: "CONDITIONAL", custodyStatus: "CONDITIONAL",
    redemptionStatus: "CONDITIONAL", licensingRequired: "MiCA CASP/ART issuer authorization (EBA)",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "Member state discretion",
    dataRequirements: "GDPR, AMLR, DORA, TFR (Travel Rule)", settlementStatus: "CONDITIONAL",
    tokenTradingRestricted: false, geoFenced: false,
    effectiveDate: "2026-08-12", source: "MiCA, EBA, ESMA", reviewDate: "2026-11-12",
  },
  UK: {
    code: "UK", name: "United Kingdom",
    mtqStatus: "CONDITIONAL", stablecoinStatus: "CONDITIONAL", custodyStatus: "CONDITIONAL",
    redemptionStatus: "CONDITIONAL", licensingRequired: "FCA crypto-asset registration",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "Capital gains",
    dataRequirements: "UK GDPR, MLR 2017", settlementStatus: "CONDITIONAL",
    tokenTradingRestricted: false, geoFenced: false,
    effectiveDate: "2026-08-12", source: "FCA, HMRC", reviewDate: "2026-11-12",
  },
  AE: {
    code: "AE", name: "United Arab Emirates",
    mtqStatus: "CONDITIONAL", stablecoinStatus: "CONDITIONAL", custodyStatus: "CONDITIONAL",
    redemptionStatus: "CONDITIONAL", licensingRequired: "VARA FRVA license + CBUAE Stored Value Facility",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "VAT on transactions",
    dataRequirements: "UAE Data Protection Law", settlementStatus: "CONDITIONAL",
    tokenTradingRestricted: false, geoFenced: false,
    effectiveDate: "2026-08-12", source: "VARA, CBUAE, ADGM", reviewDate: "2026-11-12",
  },
  SA: {
    code: "SA", name: "Saudi Arabia",
    mtqStatus: "RESTRICTED", stablecoinStatus: "RESTRICTED", custodyStatus: "RESTRICTED",
    redemptionStatus: "RESTRICTED", licensingRequired: "SAMA payment-services license",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "Zakat applicable",
    dataRequirements: "Saudi PDPL", settlementStatus: "RESTRICTED",
    tokenTradingRestricted: true, geoFenced: false,
    effectiveDate: "2026-08-12", source: "SAMA", reviewDate: "2026-11-12",
  },
  SG: {
    code: "SG", name: "Singapore",
    mtqStatus: "CONDITIONAL", stablecoinStatus: "CONDITIONAL", custodyStatus: "CONDITIONAL",
    redemptionStatus: "CONDITIONAL", licensingRequired: "MAS DPT (Digital Payment Token) license",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "Goods and Services Tax",
    dataRequirements: "PDPA", settlementStatus: "CONDITIONAL",
    tokenTradingRestricted: false, geoFenced: false,
    effectiveDate: "2026-08-12", source: "MAS", reviewDate: "2026-11-12",
  },
  HK: {
    code: "HK", name: "Hong Kong",
    mtqStatus: "CONDITIONAL", stablecoinStatus: "CONDITIONAL", custodyStatus: "CONDITIONAL",
    redemptionStatus: "CONDITIONAL", licensingRequired: "HKMA SVF license + SFC Type 1/9",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "Profits tax",
    dataRequirements: "PDPO", settlementStatus: "CONDITIONAL",
    tokenTradingRestricted: false, geoFenced: false,
    effectiveDate: "2026-08-12", source: "HKMA, SFC", reviewDate: "2026-11-12",
  },
  JP: {
    code: "JP", name: "Japan",
    mtqStatus: "CONDITIONAL", stablecoinStatus: "CONDITIONAL", custodyStatus: "CONDITIONAL",
    redemptionStatus: "CONDITIONAL", licensingRequired: "JFSA crypto-asset exchange registration",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "Miscellaneous income",
    dataRequirements: "APPI", settlementStatus: "CONDITIONAL",
    tokenTradingRestricted: false, geoFenced: false,
    effectiveDate: "2026-08-12", source: "JFSA, FSA", reviewDate: "2026-11-12",
  },
  AU: {
    code: "AU", name: "Australia",
    mtqStatus: "CONDITIONAL", stablecoinStatus: "CONDITIONAL", custodyStatus: "CONDITIONAL",
    redemptionStatus: "CONDITIONAL", licensingRequired: "AUSTRAC registration + ASIC",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "CGT",
    dataRequirements: "Privacy Act 1988", settlementStatus: "CONDITIONAL",
    tokenTradingRestricted: false, geoFenced: false,
    effectiveDate: "2026-08-12", source: "AUSTRAC, ASIC", reviewDate: "2026-11-12",
  },
  CN: {
    code: "CN", name: "China (People's Republic of)",
    mtqStatus: "PROHIBITED", stablecoinStatus: "PROHIBITED", custodyStatus: "PROHIBITED",
    redemptionStatus: "PROHIBITED", licensingRequired: "N/A — crypto activity prohibited",
    amlKycRequired: true, sanctionsCheck: true, taxTreatment: "N/A",
    dataRequirements: "PIPL, DSL", settlementStatus: "PROHIBITED",
    tokenTradingRestricted: true, geoFenced: true,
    effectiveDate: "2026-08-12", source: "PBOC, CSRC, 2021 crypto ban", reviewDate: "2026-11-12",
  },
};

export function getJurisdiction(code: string): JurisdictionRecord | null {
  return JURISDICTION_MATRIX[code.toUpperCase()] || null;
}

export function isGeoFenced(code: string): boolean {
  const j = getJurisdiction(code);
  return j?.geoFenced ?? true; // Unknown → conservative block
}

export function isActivityAllowed(code: string, activity: "mtq" | "stablecoin" | "custody" | "redemption" | "settlement"): boolean {
  const j = getJurisdiction(code);
  if (!j) return false; // Unknown → blocked

  const statusMap: Record<string, JurisdictionStatus> = {
    mtq: j.mtqStatus,
    stablecoin: j.stablecoinStatus,
    custody: j.custodyStatus,
    redemption: j.redemptionStatus,
    settlement: j.settlementStatus,
  };

  const status = statusMap[activity];
  return status === "ALLOWED" || status === "CONDITIONAL";
}

export function checkChinaGeoFence(ipCountryCode: string): { blocked: boolean; reason: string } {
  const j = getJurisdiction(ipCountryCode);
  if (!j) {
    return { blocked: true, reason: `Unknown jurisdiction (${ipCountryCode}) — conservative block` };
  }
  if (j.geoFenced) {
    return { blocked: true, reason: `${j.name}: crypto/stablecoin activity prohibited by law` };
  }
  return { blocked: false, reason: "Access permitted" };
}

// ============================================================================
// §V25.2 — LICENSING / ENTITY MATRIX (§50 of the master COO/CTO directive)
// ============================================================================
// This module implements the Licensing / Entity Matrix required by §50 of the
// master directive. For every (financial activity × jurisdiction) pair it maps:
//
//   Activity  →  Jurisdiction  →  Legal Activity
//                                  →  Required License / Authorization
//                                  →  Responsible Entity
//                                  →  MITHQAL Role
//                                  →  Bank Role
//                                  →  Custodian Role
//                                  →  Liquidity Provider Role
//                                  →  Status / Evidence
//
// SCOPE: 9 financial activities × 8 jurisdictions = 72 matrix entries.
//
// CRITICAL PRINCIPLE (honest-state alignment with §74):
//   Technical implementation is NOT regulatory authorization.
//   A working payment rail, custody smart contract, FX bridge, settlement
//   engine, or CASP integration is NOT a license. MITHQAL may ENGINEER a
//   regulated activity, but may not OPERATE it (and may not represent it as
//   operative) until the participating regulated entity has obtained the
//   required authorization from the competent regulator in that jurisdiction.
//
// HONEST STATE (§74 — exact values):
//   - licensingMatrixImplemented = true   (the matrix itself is fully built)
//   - licensesObtained            = 0      (no real license exists anywhere)
//
// No license, registration, or authorization has been obtained by MITHQAL,
// JOZOUR LLC (the current operating entity, New Jersey), or any planned
// commercial subsidiary (Foundation / Holding / Operations Ltd. / Markets Ltd.
// / Technology Co.) in ANY of the 8 jurisdictions × 9 activities catalogued
// below. Every entry defaults to status = "REQUIRED_NOT_OBTAINED" and
// evidence = "NONE".
//
// Where this module conflicts with the older `LicensingRequirement` shape in
// `src/lib/v25-1-final-amendment.ts`, this module is the controlling §V25.2
// specification per the §49 blueprint conflict reconciliation directive: the
// v25.1 status set ("NOT_ANALYZED" / "ANALYZED" / "LICENSE_OBTAINED" / ...) is
// superseded here by the v25.2 status set
// ("REQUIRED_NOT_OBTAINED" / "PENDING_APPLICATION" / "OBTAINED" / "EXEMPT" /
// "PROHIBITED") and the matrix is expanded from 6 activities × 1 jurisdiction
// to 9 activities × 8 jurisdictions.
// ============================================================================

export const MODULE_ID = "v25.2-licensing-entity-matrix-1.0";

// ----------------------------------------------------------------------------
// §50.1 — Financial activities (9)
// ----------------------------------------------------------------------------

/**
 * The 9 financial activities assessed by the licensing matrix.
 * These are the activities the MITHQAL architecture must either (a) operate
 * under a license, (b) orchestrate on behalf of a licensed counterparty, or
 * (c) explicitly refrain from conducting.
 */
export type FinancialActivity =
  | "banking"
  | "payment-services"
  | "custody"
  | "fx"
  | "digital-asset-casp"
  | "securities"
  | "commodity"
  | "cbdc-access"
  | "settlement-activities";

/** Canonical, ordered list of the 9 assessed activities. */
export const ACTIVITIES: readonly FinancialActivity[] = [
  "banking",
  "payment-services",
  "custody",
  "fx",
  "digital-asset-casp",
  "securities",
  "commodity",
  "cbdc-access",
  "settlement-activities",
] as const;

// ----------------------------------------------------------------------------
// §50.2 — Jurisdictions (8)
// ----------------------------------------------------------------------------

/**
 * The 8 jurisdictions in which each activity is assessed.
 * Selection rationale: US (JOZOUR LLC home jurisdiction + Federal Reserve /
 * NYDFS ecosystem), UAE (AED peg + CBUAE/VARA), UK (FCA + BoE), EU (ECB +
 * MiCAR), Singapore (MAS), Switzerland (FINMA + SNB), Hong Kong (HKMA + SFC),
 * and KSA (SAMA + CMA, GCC peg counterpart to AED).
 */
export const JURISDICTIONS = [
  "US",
  "UAE",
  "UK",
  "EU",
  "SINGAPORE",
  "SWITZERLAND",
  "HONG_KONG",
  "KSA",
] as const;

export type Jurisdiction = (typeof JURISDICTIONS)[number];

// ----------------------------------------------------------------------------
// §50.3 — Entity roles (8)
// ----------------------------------------------------------------------------

/**
 * The 8 institutional roles MITHQAL coordinates with across the architecture.
 * - MITHQAL: the verification/orchestration layer (non-financial-guarantor).
 * - BANK: licensed depository institution.
 * - CUSTODIAN: qualified, segregated-asset custodian.
 * - LIQUIDITY_PROVIDER: authorized market-maker / provider of on-tap liquidity.
 * - FOUNDATION: planned MITHQAL Foundation (constitutional steward).
 * - OPERATING_CO: planned Operations Ltd. (regulated operating subsidiary).
 * - TECHNOLOGY_CO: planned Technology Co. (non-regulated tech subsidiary).
 * - HOLDING_CO: planned Holding Company (intermediate parent).
 *
 * NOTE: Only MITHQAL exists today as an architectural function; the JOZOUR LLC
 * (New Jersey) entity operates the platform. All other commercial entities are
 * PLANNED per the organizational roadmap and do not yet exist.
 */
export type EntityRole =
  | "MITHQAL"
  | "BANK"
  | "CUSTODIAN"
  | "LIQUIDITY_PROVIDER"
  | "FOUNDATION"
  | "OPERATING_CO"
  | "TECHNOLOGY_CO"
  | "HOLDING_CO";

// ----------------------------------------------------------------------------
// §50.4 — License lifecycle status
// ----------------------------------------------------------------------------

/**
 * Lifecycle status of a licensing requirement.
 *
 * - REQUIRED_NOT_OBTAINED: License is required and has NOT been obtained. This
 *   is the DEFAULT state for every matrix entry at module initialization.
 * - PENDING_APPLICATION: License is required, an application has been filed
 *   with the regulator, and the regulator has not yet granted authorization.
 * - OBTAINED: License has been granted by the competent regulator AND verifiable
 *   evidence (regulator URL, certificate reference, register entry) exists.
 * - EXEMPT: The regulator has formally confirmed the activity is exempt from
 *   licensing in that jurisdiction (still requires written evidence).
 * - PROHIBITED: The activity is legally prohibited in that jurisdiction and
 *   MITHQAL must not facilitate it.
 */
export type LicensingStatus =
  | "REQUIRED_NOT_OBTAINED"
  | "PENDING_APPLICATION"
  | "OBTAINED"
  | "EXEMPT"
  | "PROHIBITED";

/** Default status for any matrix entry that has not been explicitly transitioned. */
export const DEFAULT_LICENSING_STATUS: LicensingStatus = "REQUIRED_NOT_OBTAINED";

/** Default evidence string. "NONE" means no license evidence exists at all. */
export const DEFAULT_EVIDENCE = "NONE" as const;

// ----------------------------------------------------------------------------
// §50.5 — Licensing matrix entry shape
// ----------------------------------------------------------------------------

/**
 * A single cell of the Activity × Jurisdiction licensing matrix.
 * Every field is non-nullable; the absence of a license is represented by
 * `status = "REQUIRED_NOT_OBTAINED"` and `evidence = "NONE"`, never by
 * undefined / null.
 */
export interface LicensingMatrixEntry {
  /** Financial activity (one of 9). */
  activity: FinancialActivity;
  /** Jurisdiction in which the activity would be conducted (one of 8). */
  jurisdiction: Jurisdiction;
  /** Legal classification of the activity in that jurisdiction. */
  legalActivity: string;
  /**
   * License / authorization text as would be required by the regulator.
   * Realistic and specific, but NEVER claims a license has been obtained —
   * that fact is captured only in `status`.
   */
  requiredLicense: string;
  /** Entity that bears responsibility for obtaining the license. */
  responsibleEntity: EntityRole;
  /**
   * MITHQAL's role in the activity. ALWAYS a non-financial-guarantor role:
   * one of "NONE", "VERIFICATION", "ORCHESTRATION", "INFRASTRUCTURE".
   * NEVER "GUARANTOR" or "FINANCIAL_GUARANTOR" — MITHQAL does not guarantee
   * any regulated activity's outcome or any reserve shortfall.
   */
  mithqalRole: string;
  /** Bank's role in the activity (or "Not directly involved"). */
  bankRole: string;
  /** Custodian's role in the activity (or "Not directly involved"). */
  custodianRole: string;
  /** Liquidity provider's role in the activity (or "Not directly involved"). */
  liquidityProviderRole: string;
  /** License lifecycle status. Default REQUIRED_NOT_OBTAINED. */
  status: LicensingStatus;
  /** Evidence of license (regulator URL, certificate ref, register entry). Default "NONE". */
  evidence: string;
}

// ----------------------------------------------------------------------------
// §50.6 — Per-activity role & license templates
// ----------------------------------------------------------------------------
// The mithqalRole strings below are constant per activity. They are
// deliberately verbose to make the non-financial-guarantor position explicit
// in the exported data. The requiredLicense text varies per jurisdiction and
// is jurisdiction-specific (the regulator name, the statute, the license class
// all change by jurisdiction).
//
// mithqalRole INVARIANT: the set of allowed MITHQAL roles is
//   { "NONE", "VERIFICATION", "ORCHESTRATION", "INFRASTRUCTURE" }.
//   "GUARANTOR" and "FINANCIAL_GUARANTOR" are PROHIBITED — enforced by
//   `assertMithqalRoleInvariant()` below.

const ALLOWED_MITHQAL_ROLES = new Set<string>([
  "NONE",
  "VERIFICATION",
  "ORCHESTRATION",
  "INFRASTRUCTURE",
]);

interface ActivityTemplate {
  /** Human-readable legal classification of the activity. */
  legalActivity: string;
  /** Entity responsible for obtaining the license. */
  responsibleEntity: EntityRole;
  /** MITHQAL's role — must be a member of ALLOWED_MITHQAL_ROLES. */
  mithqalRole: string;
  /** Bank's role description (jurisdiction-independent). */
  bankRole: string;
  /** Custodian's role description (jurisdiction-independent). */
  custodianRole: string;
  /** Liquidity provider's role description (jurisdiction-independent). */
  liquidityProviderRole: string;
  /** Per-jurisdiction required-license text. Must cover all 8 jurisdictions. */
  requiredLicenseByJurisdiction: Record<Jurisdiction, string>;
}

const ACTIVITY_TEMPLATES: Record<FinancialActivity, ActivityTemplate> = {
  banking: {
    legalActivity:
      "Taking deposits / extending credit / treasury & deposit banking",
    responsibleEntity: "BANK",
    mithqalRole:
      "NONE — MITHQAL does not perform banking; licensed banks retain the activity",
    bankRole:
      "FULL — licensed depository institution conducts all deposit, credit, and treasury activity",
    custodianRole:
      "Not directly involved (banks custody own deposits under separate authorization)",
    liquidityProviderRole: "Not directly involved",
    requiredLicenseByJurisdiction: {
      US: "Federal or state banking charter + BSA authorization (OCC / Federal Reserve / state DFI)",
      UAE: "CBUAE Commercial Banking License (Federal Decree-Law No. 14/2018)",
      UK: "PRA Banking Authorization (CRR firm) + FCA permissions",
      EU: "ECB SSM Banking Authorization (CRD VI / CRR 3)",
      SINGAPORE: "MAS Full Bank or Wholesale Bank License (Banking Act 1970)",
      SWITZERLAND: "FINMA Banking License (Banking Act of 1934, as amended)",
      HONG_KONG: "HKMA Licensed Bank (Banking Ordinance, Cap. 155)",
      KSA: "SAMA Banking License (Banking Control Law, Royal Decree M/5)",
    },
  },

  "payment-services": {
    legalActivity:
      "Money transmission / payment services / stored-value / payment account operation",
    responsibleEntity: "OPERATING_CO",
    mithqalRole:
      "INFRASTRUCTURE — MITHQAL engineers the payment rail; the regulated OPERATING_CO obtains the license and operates the service",
    bankRole: "Customer-facing payment processing and bank-side settlement",
    custodianRole:
      "Holds settlement-account balances (not customer-facing funds movement)",
    liquidityProviderRole:
      "Intraday liquidity provision for payment cycles (where authorized)",
    requiredLicenseByJurisdiction: {
      US: "FinCEN MSB registration + state-by-state Money Transmitter Licenses (BSA)",
      UAE: "CBUAE Stored Value Facility (SVF) License (RPB)",
      UK: "FCA Authorized Payment Institution or EMI Authorization (PSRs 2017)",
      EU: "EMI or PI License under PSD2 (transposing into PSD3 / PSR1)",
      SINGAPORE: "MAS Major Payment Institution License (PSN02, Payment Services Act)",
      SWITZERLAND: "FINMA FinTech License or Bank-type license for payment services",
      HONG_KONG: "HKMA Stored Value Facility (SVF) License (SVFSA)",
      KSA: "SAMA Payment Service Provider License (PSP Rules)",
    },
  },

  custody: {
    legalActivity:
      "Safekeeping / segregation / allocated custody of reserve assets (fiat, bullion, securities, digital)",
    responsibleEntity: "CUSTODIAN",
    mithqalRole:
      "VERIFICATION — MITHQAL verifies bank-side earmarked/allocation and reconciliation proofs; it does NOT itself custody assets",
    bankRole:
      "Holds the protected backing cell as a segregated, earmarked allocation (bank-side custody, not MITHQAL custody)",
    custodianRole:
      "FULL — qualified custodian holds assets in allocated, segregated, bankruptcy-remote custody; provides proof-of-reserves",
    liquidityProviderRole: "Not directly involved",
    requiredLicenseByJurisdiction: {
      US: "Trust Company charter (state) or SEC adviser-custody compliance under Rule 206(4)-2",
      UAE: "CBUAE Custody Authorization / ADGM or DIFC Custody License",
      UK: "FCA Custody & Safekeeping Authorization (CASS rules)",
      EU: "CSDR Authorized CSD or MiCAR CASP Custody (for digital assets)",
      SINGAPORE: "MAS Capital Markets Services License — Custody Services (SFA)",
      SWITZERLAND: "FINMA Custodian Bank License (Banking Act)",
      HONG_KONG: "SFC Type 1 (Dealing) + Custody authorization (SFO)",
      KSA: "CMA Custody Services Authorization (CML)",
    },
  },

  fx: {
    legalActivity:
      "Foreign-exchange dealing / conversion / spot & forward FX execution",
    responsibleEntity: "BANK",
    mithqalRole:
      "ORCHESTRATION — MITHQAL orchestrates FX execution flow; banks or authorized FX providers execute trades under their own license",
    bankRole:
      "FULL — licensed bank or authorized FX dealer executes the FX conversion and bears market & counterparty risk",
    custodianRole: "Settles resulting balances (no direct FX dealing role)",
    liquidityProviderRole:
      "May act as authorized FX liquidity provider (PSP / ECN) under its own license",
    requiredLicenseByJurisdiction: {
      US: "NFA membership + CFTC FCM registration or state Money Transmitter License (for retail FX)",
      UAE: "CBUAE FX Authorization (Retail FX Rules where retail clients are served)",
      UK: "FCA Authorized Payment Institution with FX scope (or Investment Firm for FX derivatives)",
      EU: "EMI/PI License with FX scope under PSD2 (or MiFID II for FX derivatives)",
      SINGAPORE: "MAS Major Payment Institution License — Merchant FX (PSN02)",
      SWITZERLAND: "FINMA Bank License (FX dealing treated as banking activity)",
      HONG_KONG: "HKMA Authorized Institution (AI) status for FX dealing",
      KSA: "SAMA Authorized FX Dealer License (SAMA FX Rules)",
    },
  },

  "digital-asset-casp": {
    legalActivity:
      "Crypto-asset service provider (CASP) — exchange, transfer, custody, or issuance of crypto-assets",
    responsibleEntity: "OPERATING_CO",
    mithqalRole:
      "INFRASTRUCTURE — MITHQAL engineers the digital-asset rail; the regulated OPERATING_CO obtains the CASP license and operates the service",
    bankRole:
      "May hold fiat-side settlement accounts; (where permitted) may provide banking to the CASP",
    custodianRole:
      "Qualified custodian for digital-asset holdings (where the CASP does not self-custody)",
    liquidityProviderRole:
      "Authorized stablecoin / digital-asset liquidity provider (DRQS-qualified)",
    requiredLicenseByJurisdiction: {
      US: "FinCEN MSB registration + state MTLs; NYDFS BitLicense if NY-resident customers are served",
      UAE: "VARA VASP License (or ADGM / DCCA equivalent, depending on the Free Zone)",
      UK: "FCA Cryptoasset Registration under MLRs 2017 (as amended)",
      EU: "MiCAR CASP Authorization (Regulation (EU) 2023/1114)",
      SINGAPORE: "MAS Digital Payment Token (DPT) Service License (PSN02)",
      SWITZERLAND: "FINMA FinSA License (Bank or FinTech authorization for digital assets)",
      HONG_KONG: "SFC VATP License under the VATP regime (effective June 2023)",
      KSA: "CMA Crypto-Asset Activities Rules (note: several CASP activities are prohibited)",
    },
  },

  securities: {
    legalActivity:
      "Dealing in / arranging deals in / advising on securities (incl. tokenized securities)",
    responsibleEntity: "OPERATING_CO",
    mithqalRole:
      "INFRASTRUCTURE — MITHQAL engineers the securities orchestration layer; the regulated OPERATING_CO obtains the dealing/advising license",
    bankRole: "May underwrite or place securities under its own license",
    custodianRole:
      "CSD / registrar custody of securities (incl. tokenized securities where eligible)",
    liquidityProviderRole:
      "Authorized market-maker / liquidity provider for secondary-market liquidity",
    requiredLicenseByJurisdiction: {
      US: "SEC Broker-Dealer registration (FINRA member) + ATS registration under Reg. ATS (where applicable)",
      UAE: "SCA Financial Activities License (Securities & Commodities Authority)",
      UK: "FCA Investment Firm Authorization under MiFID II (IFD/IFR)",
      EU: "MiFID II Investment Firm Authorization (IFD/IFR, transposed nationally)",
      SINGAPORE: "MAS Capital Markets Services License — Dealing in Capital Markets Products",
      SWITZERLAND: "FINMA Securities Dealer License (FinSA / FinSO)",
      HONG_KONG: "SFC Type 1 (Dealing in Securities) License (SFO)",
      KSA: "CMA Authorized Person License (CML)",
    },
  },

  commodity: {
    legalActivity:
      "Commodity dealing / arranging commodity-derivative trades / operating a commodity market",
    responsibleEntity: "OPERATING_CO",
    mithqalRole:
      "INFRASTRUCTURE — MITHQAL engineers commodity orchestration; the regulated OPERATING_CO obtains the commodity-dealing license",
    bankRole:
      "May deal in commodity derivatives under separate banking-license scope",
    custodianRole:
      "Holds commodity warehouse receipts / tokenized commodity positions",
    liquidityProviderRole:
      "Authorized commodity liquidity provider / market-maker",
    requiredLicenseByJurisdiction: {
      US: "CFTC registration (FCM / CTA / CPO) + NFA membership (Commodity Exchange Act)",
      UAE: "SCA Commodity Activities License (or ADGM / DIFC equivalent)",
      UK: "FCA Authorized Firm scope for Commodity Derivatives (MiFID II)",
      EU: "MiFID II Commodity Derivatives Authorization (RTS 20 / RTS 21 position limits)",
      SINGAPORE: "MAS Recognized Market Operator (RMO) or CMS License (commodity derivatives)",
      SWITZERLAND: "FINMA Securities Dealer License (where commodity derivatives are in scope)",
      HONG_KONG: "SFC Type 2 (Dealing in Futures Contracts) and/or Type 11 (where applicable)",
      KSA: "CMA Commodity Activities Authorization (CML)",
    },
  },

  "cbdc-access": {
    legalActivity:
      "Access to / participation in central-bank money settlement infrastructure (CBDC, RTGS, instant-payment rails)",
    responsibleEntity: "BANK",
    mithqalRole:
      "NONE — MITHQAL has no direct CBDC access; only central-bank-eligible settlement banks participate in CBDC rails",
    bankRole:
      "FULL — settlement bank with central-bank master account / RTGS / CBDC participation rights",
    custodianRole:
      "Supports segregated settlement-account balances; no direct CBDC access",
    liquidityProviderRole:
      "Intraday liquidity provision to settlement banks (where authorized)",
    requiredLicenseByJurisdiction: {
      US: "Federal Reserve Master Account access (FedNow / Fedwire) — Fed-licensed institution only",
      UAE: "CBUAE mBridge / Digital Dirham participant status (CBUAE-approved settlement bank)",
      UK: "Bank of England Settlement Bank status (RTGS / CHAPS access)",
      EU: "ECB TIPS / TARGET2 (T2) participant status (Eurosystem-eligible settlement bank)",
      SINGAPORE: "MAS MEPS+ / Project Orchid / Ubin+ participant (MAS-approved settlement bank)",
      SWITZERLAND: "SNB SIC system participant status (SNB-licensed settlement bank)",
      HONG_KONG: "HKMA e-HKD / Project mBridge participant (HKMA-approved settlement bank)",
      KSA: "SAMA Project mBridge / SARIE participant (SAMA-approved settlement bank)",
    },
  },

  "settlement-activities": {
    legalActivity:
      "Operation of / participation in a securities, payment, or digital-asset settlement system",
    responsibleEntity: "OPERATING_CO",
    mithqalRole:
      "ORCHESTRATION — MITHQAL orchestrates settlement finality workflow; the regulated OPERATING_CO operates the system under its own license",
    bankRole:
      "Settlement bank providing central-bank money settlement legs (where applicable)",
    custodianRole:
      "CSD / token-registry custody for delivery legs of DvP / PvP settlement",
    liquidityProviderRole:
      "Settlement liquidity provider for time-critical settlement windows",
    requiredLicenseByJurisdiction: {
      US: "FRB Settlement Account access / DTC participant / NSS for Treasury settlement",
      UAE: "CBUAE Settlement System Authorization (or DFM / ADX clearing participant)",
      UK: "Bank of England Settlement Bank status + CREST participant (for securities settlement)",
      EU: "ECB T2 / T2S / TIPS participant status (Central Securities Depositories Regulation)",
      SINGAPORE: "MAS Electronic Payment System (MEPS+) participant + CDP clearing",
      SWITZERLAND: "SIC System participant (SNB-licensed) + SIX SIS clearing participant",
      HONG_KONG: "HKMA CHATS participant + CMU clearing participant",
      KSA: "SAMA SARIE participant + mada clearing (where applicable)",
    },
  },
};

// ----------------------------------------------------------------------------
// §50.7 — The matrix itself (9 activities × 8 jurisdictions = 72 entries)
// ----------------------------------------------------------------------------
// Built by composing each activity's template with each jurisdiction. Every
// entry starts at status="REQUIRED_NOT_OBTAINED" and evidence="NONE". The
// `LICENSING_MATRIX` const reference is exported for read-only access; the
// internal `_MATRIX` mutable array is what registerLicenseObtained() mutates.
// (Both names point to the same backing array — see export section.)

function buildMatrix(): LicensingMatrixEntry[] {
  const out: LicensingMatrixEntry[] = [];
  for (const activity of ACTIVITIES) {
    const tpl = ACTIVITY_TEMPLATES[activity];
    for (const jurisdiction of JURISDICTIONS) {
      out.push({
        activity,
        jurisdiction,
        legalActivity: tpl.legalActivity,
        requiredLicense: tpl.requiredLicenseByJurisdiction[jurisdiction],
        responsibleEntity: tpl.responsibleEntity,
        mithqalRole: tpl.mithqalRole,
        bankRole: tpl.bankRole,
        custodianRole: tpl.custodianRole,
        liquidityProviderRole: tpl.liquidityProviderRole,
        status: DEFAULT_LICENSING_STATUS,
        evidence: DEFAULT_EVIDENCE,
      });
    }
  }
  return out;
}

const _MATRIX: LicensingMatrixEntry[] = buildMatrix();

/**
 * The §50 Licensing / Entity Matrix.
 *
 * 9 activities × 8 jurisdictions = 72 entries.
 * Every entry defaults to status="REQUIRED_NOT_OBTAINED" and evidence="NONE".
 * The array is intentionally NOT frozen so that `registerLicenseObtained`
 * can mutate entries in place (transitioning status to OBTAINED when real
 * evidence is supplied). Until such evidence is supplied, the array
 * represents the honest state: 0 licenses obtained.
 */
export const LICENSING_MATRIX: LicensingMatrixEntry[] = _MATRIX;

// ----------------------------------------------------------------------------
// §50.8 — Query / mutation API
// ----------------------------------------------------------------------------

/**
 * Returns the single matrix entry for a given (activity, jurisdiction) pair.
 * Throws if the pair is not in the matrix (every valid pair should resolve).
 */
export function getLicensingEntry(
  activity: FinancialActivity,
  jurisdiction: Jurisdiction,
): LicensingMatrixEntry {
  const entry = _MATRIX.find(
    (e) => e.activity === activity && e.jurisdiction === jurisdiction,
  );
  if (!entry) {
    throw new Error(
      `[${MODULE_ID}] no matrix entry for activity="${activity}" jurisdiction="${jurisdiction}"`,
    );
  }
  return entry;
}

/** Returns all matrix entries for a given activity (one per jurisdiction, 8 total). */
export function listByActivity(activity: FinancialActivity): LicensingMatrixEntry[] {
  return _MATRIX.filter((e) => e.activity === activity);
}

/** Returns all matrix entries for a given jurisdiction (one per activity, 9 total). */
export function listByJurisdiction(jurisdiction: Jurisdiction): LicensingMatrixEntry[] {
  return _MATRIX.filter((e) => e.jurisdiction === jurisdiction);
}

/**
 * Transition a matrix entry to OBTAINED status.
 *
 * HONEST-STATE RULE: this function ONLY mutates state when a non-empty
 * `evidence` string is provided. An empty / whitespace-only evidence argument
 * is rejected (returns null) and the matrix entry is left unchanged. The
 * module's default exported state therefore remains licensesObtained = 0.
 *
 * Evidence should be a verifiable reference: a regulator register URL, a
 * license/certificate number, or a public-record citation. "We built it" is
 * NOT evidence — technical implementation is not regulatory authorization.
 *
 * @returns the updated entry, or `null` if the (activity, jurisdiction) pair
 *          was not found or the evidence argument was empty.
 */
export function registerLicenseObtained(
  activity: FinancialActivity,
  jurisdiction: Jurisdiction,
  evidence: string,
): LicensingMatrixEntry | null {
  if (!evidence || evidence.trim().length === 0) {
    // No evidence provided → do NOT transition. licensesObtained stays 0.
    return null;
  }
  const entry = _MATRIX.find(
    (e) => e.activity === activity && e.jurisdiction === jurisdiction,
  );
  if (!entry) {
    return null;
  }
  entry.status = "OBTAINED";
  entry.evidence = evidence.trim();
  return entry;
}

/**
 * Count of matrix entries with status = OBTAINED.
 * Returns 0 in the default module state (no real evidence supplied).
 */
export function countLicensesObtained(): number {
  return _MATRIX.filter((e) => e.status === "OBTAINED").length;
}

/**
 * Assess whether a financial activity may proceed in a given jurisdiction.
 *
 * An activity may proceed ONLY if:
 *   - status === "OBTAINED" (real license evidence on file), OR
 *   - status === "EXEMPT" (regulator has formally confirmed exemption).
 *
 * It may NOT proceed if status is REQUIRED_NOT_OBTAINED, PENDING_APPLICATION,
 * or PROHIBITED. Technical implementation alone NEVER authorizes an activity
 * to proceed.
 *
 * @returns an object with `mayProceed` and the human-readable `reason`.
 */
export function assessActivityLegality(
  activity: FinancialActivity,
  jurisdiction: Jurisdiction,
): { mayProceed: boolean; reason: string; status: LicensingStatus } {
  const entry = getLicensingEntry(activity, jurisdiction);
  switch (entry.status) {
    case "OBTAINED":
      return {
        mayProceed: true,
        reason: `License obtained (evidence: ${entry.evidence}). Activity may proceed.`,
        status: entry.status,
      };
    case "EXEMPT":
      return {
        mayProceed: true,
        reason: `Activity is formally exempt (evidence: ${entry.evidence}). Activity may proceed within exemption scope.`,
        status: entry.status,
      };
    case "PROHIBITED":
      return {
        mayProceed: false,
        reason: `Activity is prohibited in ${jurisdiction}. MITHQAL must not facilitate it.`,
        status: entry.status,
      };
    case "PENDING_APPLICATION":
      return {
        mayProceed: false,
        reason: `Application pending in ${jurisdiction}. Activity may NOT proceed until license is granted.`,
        status: entry.status,
      };
    case "REQUIRED_NOT_OBTAINED":
    default:
      return {
        mayProceed: false,
        reason: `License required but NOT obtained in ${jurisdiction}. Required: ${entry.requiredLicense}. Technical implementation is NOT authorization.`,
        status: entry.status,
      };
  }
}

/**
 * Returns MITHQAL's role for a given activity.
 *
 * MITHQAL's role is ALWAYS a non-financial-guarantor role:
 *   one of { "NONE", "VERIFICATION", "ORCHESTRATION", "INFRASTRUCTURE" }.
 * MITHQAL NEVER guarantees any regulated activity's outcome or any reserve
 * shortfall — that invariant is asserted at module-load by
 * `assertMithqalRoleInvariant()`.
 */
export function mithqalRoleForActivity(activity: FinancialActivity): string {
  const entry = listByActivity(activity)[0];
  if (!entry) {
    throw new Error(`[${MODULE_ID}] no matrix entries for activity="${activity}"`);
  }
  return entry.mithqalRole;
}

// ----------------------------------------------------------------------------
// §50.9 — Honest state (§74)
// ----------------------------------------------------------------------------

/**
 * Honest-state snapshot for §74 alignment. EXACT field names and values:
 *   - licensingMatrixImplemented = true   (the matrix is fully built: 72 entries)
 *   - licensesObtained            = 0      (no license has been obtained anywhere)
 *
 * `licensesObtained` is computed live from the matrix so that any future call
 * to `registerLicenseObtained` with real evidence would update this field.
 * In the default exported state, it is always 0.
 */
export function licensingHonestState(): {
  licensingMatrixImplemented: true;
  licensesObtained: number;
} {
  return {
    licensingMatrixImplemented: true,
    licensesObtained: countLicensesObtained(),
  };
}

// ----------------------------------------------------------------------------
// §50.10 — Invariants (asserted at module load)
// ----------------------------------------------------------------------------

/**
 * Asserts the matrix invariant: every entry must satisfy
 *   1. status ∈ LicensingStatus
 *   2. evidence is a non-empty string (default "NONE")
 *   3. mithqalRole ∈ ALLOWED_MITHQAL_ROLES  (never "GUARANTOR" / "FINANCIAL_GUARANTOR")
 *   4. matrix size == 9 × 8 == 72
 *   5. every (activity, jurisdiction) pair is present exactly once
 *   6. default-state check: licensesObtained == 0 at module load
 *
 * Runs once on module import. Throws if any invariant is violated.
 */
function assertMithqalRoleInvariant(): void {
  // (1) size
  if (_MATRIX.length !== ACTIVITIES.length * JURISDICTIONS.length) {
    throw new Error(
      `[${MODULE_ID}] matrix size ${_MATRIX.length} != expected ${ACTIVITIES.length * JURISDICTIONS.length}`,
    );
  }
  // (2) unique (activity, jurisdiction) pairs
  const seen = new Set<string>();
  for (const e of _MATRIX) {
    const key = `${e.activity}|${e.jurisdiction}`;
    if (seen.has(key)) {
      throw new Error(`[${MODULE_ID}] duplicate matrix entry: ${key}`);
    }
    seen.add(key);
  }
  // (3) all (activity, jurisdiction) pairs present
  for (const a of ACTIVITIES) {
    for (const j of JURISDICTIONS) {
      if (!seen.has(`${a}|${j}`)) {
        throw new Error(`[${MODULE_ID}] missing matrix entry: ${a}|${j}`);
      }
    }
  }
  // (4) per-entry invariants
  for (const e of _MATRIX) {
    if (typeof e.evidence !== "string" || e.evidence.length === 0) {
      throw new Error(
        `[${MODULE_ID}] entry ${e.activity}|${e.jurisdiction} has empty evidence`,
      );
    }
    // MITHQAL role invariant: extract the role prefix (the part before " — ")
    // and verify it is an allowed non-financial-guarantor role.
    const rolePrefix = e.mithqalRole.split(" — ")[0]?.trim() ?? "";
    if (!ALLOWED_MITHQAL_ROLES.has(rolePrefix)) {
      throw new Error(
        `[${MODULE_ID}] entry ${e.activity}|${e.jurisdiction} has forbidden mithqalRole "${e.mithqalRole}" (prefix "${rolePrefix}" not in allowed set; GUARANTOR / FINANCIAL_GUARANTOR prohibited)`,
      );
    }
    // (5) default-state check: at module load every status must be REQUIRED_NOT_OBTAINED
    if (e.status !== "REQUIRED_NOT_OBTAINED") {
      throw new Error(
        `[${MODULE_ID}] entry ${e.activity}|${e.jurisdiction} initialized with non-default status "${e.status}"`,
      );
    }
  }
  // (6) honest-state default: licensesObtained == 0 at module load
  const obtained = countLicensesObtained();
  if (obtained !== 0) {
    throw new Error(
      `[${MODULE_ID}] invariant violated: licensesObtained = ${obtained} at module load (expected 0)`,
    );
  }
}

assertMithqalRoleInvariant();

// ----------------------------------------------------------------------------
// §50.11 — Executive report
// ----------------------------------------------------------------------------

/**
 * The §50 licensing-matrix executive report. Surfaces the full matrix, the
 * honest state, the controlling principle, and the final status banner.
 *
 * `finalStatus` is intentionally amber/not-authorized: the matrix is built
 * (implemented) but zero licenses are obtained, so the architecture has NO
 * regulatory authorization to operate any of the 9 activities in any of the
 * 8 jurisdictions.
 */
export function generateLicensingMatrixReport(): {
  moduleId: string;
  activities: readonly FinancialActivity[];
  jurisdictions: readonly Jurisdiction[];
  matrixEntries: LicensingMatrixEntry[];
  licensesObtained: number;
  honestState: ReturnType<typeof licensingHonestState>;
  principle: string;
  finalStatus: string;
} {
  return {
    moduleId: MODULE_ID,
    activities: ACTIVITIES,
    jurisdictions: JURISDICTIONS,
    matrixEntries: _MATRIX,
    licensesObtained: countLicensesObtained(),
    honestState: licensingHonestState(),
    principle:
      "Technical implementation is NOT regulatory authorization. A working payment rail, custody smart contract, FX bridge, settlement engine, or CASP integration is NOT a license. MITHQAL may engineer a regulated activity, but may not operate it (and may not represent it as operative) until the participating regulated entity obtains the required authorization from the competent regulator in that jurisdiction.",
    finalStatus:
      "IMPLEMENTED BLUEPRINT — 0 LICENSES OBTAINED — NOT REGULATORY-AUTHORIZED — NOT PRODUCTION-AUTHORIZED",
  };
}

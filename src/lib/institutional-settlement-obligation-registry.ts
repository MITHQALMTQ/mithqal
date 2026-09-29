// src/lib/institutional-settlement-obligation-registry.ts
//
// MITHQAL v25.3.2 — CANONICAL INSTITUTIONAL SETTLEMENT OBLIGATION REGISTRY
// (single source of truth)
//
// Per O-directive (trace 1a0ee793ba929555):
//   "Create a canonical Institutional Settlement Obligation Registry.
//    Each obligation must contain: issuer, legal obligor, beneficiary,
//    backing cell, redemption institution, jurisdiction, governing law,
//    finality domain, acceptance status, redemption status, resolution
//    status, insolvency treatment, evidence reference.
//    Enforce: NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION.
//    Make this registry usable independently of MTQ."
//
// This is the SINGLE CANONICAL SOURCE for institutional settlement
// obligations. It is distinct from (and complementary to):
//
//   - `src/lib/legal-obligation-register.ts` (§49) — that is the
//     external-counsel OPINION INTAKE register (tracks which jurisdictions
//     still need a legal opinion filed). It is empty of opinions.
//     This registry tracks the OBLIGATIONS themselves (the binding
//     promises to settle), not the opinions about them.
//
//   - `src/lib/institutional-evidence-fabric.ts` (v25.3.8) — that is the
//     15-field portable evidence package generator. This registry's
//     field 13 (evidenceReference) LINKS to a specific evidence package
//     via its `transactionId` + `cryptographicCommitment`.
//
//   - `src/lib/canonical-finality-model.ts` (v25.3.8) — that defines the
//     F0-F7 finality stages. This registry's field 8 (finalityDomain)
//     records where on that ladder an obligation currently sits.
//
// The registry is MTQ-INDEPENDENT — it can track obligations for ANY
// settlement asset (bank money, CBDC, RTGS, tokenized deposits, wholesale
// CBDC, MTQ, or other legally recognized settlement assets per the
// v25.3.4 control-plane boundary). If you set
// `finalityDomain.settlementAssetType = "MTQ"`, you get MTQ obligations.
// If you set it to `"BANK_MONEY"`, you get bank-money obligations. If you
// don't filter, the registry returns ALL obligations regardless of asset.
//
// HONEST SCOPE NOTE (per v25.3.9 demo scope):
//   The obligation store is in-memory (Map). This is sufficient for the
//   v25.3.9 controlled-test release. Production deployment requires a
//   durable database table (e.g., a Prisma model `InstitutionalSettlementObligation`
//   with the 13-field shape below). DO NOT use the in-memory store for
//   production settlement — it does not survive process restarts and is
//   not shared across serverless function instances.

// === Status Types ===

export type AcceptanceStatus =
  | "PENDING_ACCEPTANCE"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type RedemptionStatus =
  | "NOT_REDEEMABLE_YET"
  | "REDEEMABLE"
  | "REDEMPTION_REQUESTED"
  | "REDEMPTION_IN_PROGRESS"
  | "REDEEMED"
  | "REDEMPTION_BLOCKED"
  | "REDEMPTION_DEFAULTED";

export type ResolutionStatus =
  | "ACTIVE"
  | "RESOLVED"
  | "IN_RESOLUTION"
  | "DEFAULTED"
  | "RESTRUCTURED"
  | "WRITTEN_OFF";

export type InsolvencyTreatment =
  | "SEPARATED"  // obligation is segregated from insolvency estate
  | "PARI_PASSU"  // obligation ranks pari passu with other claims
  | "SUBORDINATED"  // obligation is subordinated
  | "SUPERSEDED"  // obligation is superseded by another
  | "PENDING_LEGAL_VERIFICATION";  // insolvency treatment not yet verified

// === The 13-Field Institutional Settlement Obligation ===

export interface InstitutionalSettlementObligation {
  // 1. Issuer — the entity that issued the obligation
  issuer: {
    entityId: string;  // e.g., "BANK_CN_ICBC"
    legalName: string;
    bankFacingCounterpartyEntityId?: string;  // per v25.3.7 (if issuer is a bank)
  };

  // 2. Legal obligor — the entity legally obligated to fulfill the obligation
  // CRITICAL: Per directive, "NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION"
  // If legalObligor is null/empty/SUPERSEDED, the obligation CANNOT be
  // registered (validateObligation() rejects; registerObligation() refuses
  // to store).
  legalObligor: {
    entityId: string;
    legalName: string;
    legalClassification: string;  // e.g., "BANK", "CUSTODIAN", "MITHQAL_FOUNDATION"
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION" | "SUPERSEDED";
  };

  // 3. Beneficiary — the entity entitled to receive the settlement
  beneficiary: {
    entityId: string;
    legalName: string;
    accountReference?: string;  // hashed account reference (no PII)
  };

  // 4. Backing cell — the specific backing cell that backs this obligation
  // (per v25.3.6 reserve domains + v25.3.5 Required Coverage formula)
  backingCell: {
    cellId: string;  // unique backing cell identifier
    reserveDomain: "SETTLEMENT_LIQUIDITY" | "STRATEGIC_RESILIENCE";  // per v25.3.6
    assetClass: string;  // BANK_MONEY, CENTRAL_BANK_MONEY, etc.
    backingValueUsd: number;
    backingValueCurrency: string;  // ISO 4217 code
  };

  // 5. Redemption institution — the institution that handles redemption
  redemptionInstitution: {
    entityId: string;
    legalName: string;
    institutionType: "BANK" | "CUSTODIAN" | "MITHQAL" | "CENTRAL_BANK" | "OTHER";
  };

  // 6. Jurisdiction — the legal jurisdiction governing the obligation
  jurisdiction: {
    primaryJurisdiction: string;  // ISO 3166-1 alpha-2
    secondaryJurisdictions?: string[];  // additional jurisdictions
    settlementMode: "FINALITY_COORDINATED" | "ATOMIC";  // per v25.3.8
  };

  // 7. Governing law — the specific law that governs the obligation
  governingLaw: {
    legalSystem: string;  // e.g., "US-NJ", "UK", "UAE", "PRC"
    specificLaw: string;  // e.g., "UCC Article 4A", "PSD2", "UAE Commercial Transactions Law"
    verificationStatus: "ACTIVE" | "PENDING_LEGAL_VERIFICATION";
  };

  // 8. Finality domain — the finality stage (per v25.3.8 canonical finality model)
  finalityDomain: {
    currentStage: "F0" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7";
    finalityType: "TECHNICAL" | "BANKING" | "LEGAL";
    settlementAssetType: string;  // per v25.3.4 (BANK_MONEY, CB_MONEY, MTQ, etc.)
  };

  // 9. Acceptance status — whether the obligation has been accepted
  acceptanceStatus: AcceptanceStatus;

  // 10. Redemption status — the redemption lifecycle status
  redemptionStatus: RedemptionStatus;

  // 11. Resolution status — the resolution/insolvency lifecycle status
  resolutionStatus: ResolutionStatus;

  // 12. Insolvency treatment — how the obligation is treated in insolvency
  insolvencyTreatment: InsolvencyTreatment;

  // 13. Evidence reference — link to the Institutional Evidence Fabric
  // (per v25.3.8). The evidence package contains the 15-field portable
  // package; field 9 of that package is `legalObligationId` which closes
  // the loop back to this registry.
  evidenceReference: {
    evidencePackageTransactionId: string;  // links to /api/evidence-fabric?transactionId=X
    cryptographicCommitment: string;  // SHA-256 commitment from the evidence package
  };

  // === Metadata (not counted among the 13 obligation fields per directive) ===
  obligationId: string;  // unique obligation identifier (e.g., "OBL-2026-001")
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  status: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION";  // per v25.3.2 status markers
}

// === THE REGISTRY ===
// In-memory store for v25.3.9 demo. Production = database (Prisma model
// `InstitutionalSettlementObligation` with the 13-field shape above).
const obligationStore = new Map<string, InstitutionalSettlementObligation>();

// === NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION Enforcement ===
//
// Per directive: "Enforce: NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION"
//
// This rule is ABSOLUTE. If the legalObligor field is null, empty, or has
// verificationStatus === "SUPERSEDED", the obligation CANNOT be registered.
// `registerObligation()` refuses to store such an obligation and returns a
// validation failure describing exactly which sub-rule was violated.

export interface ObligationValidationResult {
  valid: boolean;
  errors: string[];
  rule: string;
}

export function validateObligation(
  obligation: Partial<InstitutionalSettlementObligation>
): ObligationValidationResult {
  const errors: string[] = [];

  // Rule: NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION
  if (!obligation.legalObligor) {
    errors.push(
      "NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION: legalObligor field is required. Obligation cannot be registered without a legal obligor."
    );
  } else {
    if (
      !obligation.legalObligor.entityId ||
      obligation.legalObligor.entityId.trim() === ""
    ) {
      errors.push(
        "NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION: legalObligor.entityId is empty. Obligation cannot be registered without a legal obligor entity ID."
      );
    }
    if (
      !obligation.legalObligor.legalName ||
      obligation.legalObligor.legalName.trim() === ""
    ) {
      errors.push("legalObligor.legalName is required.");
    }
    if (obligation.legalObligor.verificationStatus === "SUPERSEDED") {
      errors.push(
        "NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION: legalObligor.verificationStatus is SUPERSEDED. The legal obligor is no longer active. Obligation cannot be registered."
      );
    }
  }

  // Validate all 13 required fields are present
  const requiredFields: (keyof InstitutionalSettlementObligation)[] = [
    "issuer",
    "legalObligor",
    "beneficiary",
    "backingCell",
    "redemptionInstitution",
    "jurisdiction",
    "governingLaw",
    "finalityDomain",
    "acceptanceStatus",
    "redemptionStatus",
    "resolutionStatus",
    "insolvencyTreatment",
    "evidenceReference",
  ];
  for (const field of requiredFields) {
    if (!obligation[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    rule: "NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION (per O-directive). If legalObligor is null, empty, or SUPERSEDED, the obligation CANNOT be registered.",
  };
}

// === Register an obligation ===

export function registerObligation(
  obligation: InstitutionalSettlementObligation
): {
  success: boolean;
  obligationId?: string;
  validation?: ObligationValidationResult;
  error?: string;
} {
  // Validate first (enforces NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION)
  const validation = validateObligation(obligation);
  if (!validation.valid) {
    return {
      success: false,
      validation,
      error:
        "Obligation validation failed. See validation.errors for details.",
    };
  }

  // Store the obligation
  obligationStore.set(obligation.obligationId, obligation);
  return { success: true, obligationId: obligation.obligationId };
}

// === Retrieve an obligation ===

export function getObligation(
  obligationId: string
): InstitutionalSettlementObligation | undefined {
  return obligationStore.get(obligationId);
}

// === List all obligation IDs ===

export function listObligations(): string[] {
  return Array.from(obligationStore.keys());
}

// === MTQ-Independent: filter obligations by settlement asset type ===
//
// Per directive: "Make this registry usable independently of MTQ."
// The registry can filter obligations by ANY settlement asset type.
// If settlementAssetType = "MTQ", returns MTQ obligations.
// If settlementAssetType = "BANK_MONEY", returns bank money obligations.
// If no filter is applied at the API layer, the registry returns ALL
// obligations regardless of settlement asset.

export function getObligationsBySettlementAsset(
  settlementAssetType: string
): InstitutionalSettlementObligation[] {
  return Array.from(obligationStore.values()).filter(
    (o) => o.finalityDomain.settlementAssetType === settlementAssetType
  );
}

export function getObligationsByBeneficiary(
  beneficiaryEntityId: string
): InstitutionalSettlementObligation[] {
  return Array.from(obligationStore.values()).filter(
    (o) => o.beneficiary.entityId === beneficiaryEntityId
  );
}

export function getObligationsByLegalObligor(
  legalObligorEntityId: string
): InstitutionalSettlementObligation[] {
  return Array.from(obligationStore.values()).filter(
    (o) => o.legalObligor.entityId === legalObligorEntityId
  );
}

// === Module-level metadata ===
export const OBLIGATION_REGISTRY_STATUS:
  | "ACTIVE"
  | "SUPERSEDED"
  | "HISTORICAL"
  | "PENDING_VALIDATION" = "ACTIVE";
export const OBLIGATION_REGISTRY_VERSION = "v25.3.2-O1-1.0";
export const OBLIGATION_REGISTRY_SOURCE =
  "src/lib/institutional-settlement-obligation-registry.ts";

// === Field count (13 fields per directive) ===
export const OBLIGATION_FIELD_COUNT = 13;
export const OBLIGATION_FIELDS = [
  "issuer",
  "legalObligor",
  "beneficiary",
  "backingCell",
  "redemptionInstitution",
  "jurisdiction",
  "governingLaw",
  "finalityDomain",
  "acceptanceStatus",
  "redemptionStatus",
  "resolutionStatus",
  "insolvencyTreatment",
  "evidenceReference",
] as const;

// === Enforcement Rule (canonical constant) ===
export const NO_LEGAL_OBLIGOR_RULE =
  "NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION";

// === Supported settlement asset types (per v25.3.4 boundary) ===
// Registry is MTQ-independent: works for ALL these asset types and
// for any future legally recognized settlement asset type that may be
// added without requiring a registry change.
export const SUPPORTED_SETTLEMENT_ASSET_TYPES = [
  "BANK_MONEY",
  "CENTRAL_BANK_MONEY",
  "RTGS",
  "TOKENIZED_DEPOSITS",
  "WHOLESALE_CBDC",
  "MTQ",
  "OTHER_LEGALLY_RECOGNIZED",
] as const;

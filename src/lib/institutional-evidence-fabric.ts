// src/lib/institutional-evidence-fabric.ts
//
// MITHQAL v25.3.2 — INSTITUTIONAL EVIDENCE FABRIC (single source of truth)
// Per N-directive (trace 1a0ee5f25d2fbe79):
//   "Create a first-class Institutional Evidence Fabric.
//    Every material transaction must generate a portable evidence package
//    containing: transaction ID, parties, policy version, compliance state,
//    sanctions state, risk result, liquidity decision, backing evidence,
//    legal obligation ID, finality state, authorization, reconciliation result,
//    exceptions, timestamps, cryptographic commitments.
//    Create APIs to retrieve the evidence package without exposing
//    unauthorized confidential information."
//
// This is the SINGLE CANONICAL SOURCE for the Institutional Evidence Fabric.
// All material transactions MUST generate a portable evidence package via
// generateEvidencePackage().
//
// HONEST SCOPE NOTE (per v25.3.8 demo scope):
//   The evidence store is in-memory (Map). This is sufficient for the
//   v25.3.8 controlled-test release. Production deployment requires a
//   durable database table (e.g., Prisma model `EvidencePackage` with the
//   15-field shape below). DO NOT use the in-memory store for production
//   settlement — it does not survive process restarts and is not shared
//   across serverless function instances.

import { createHash } from "crypto";

// === The 15-Field Portable Evidence Package ===

export interface EvidencePackage {
  // 1. Transaction ID
  transactionId: string;

  // 2. Parties (sender, receiver, intermediaries — public identifiers only, no PII)
  parties: {
    senderInstitutionId: string;       // bank identifier (e.g., "BANK_CN_ICBC")
    receiverInstitutionId: string;     // bank identifier (e.g., "BANK_AE_FAB")
    senderCustomerReference?: string;  // hashed customer reference (no PII)
    receiverCustomerReference?: string;
    intermediaryInstitutionIds?: string[];
  };

  // 3. Policy version (which policy registry version was active)
  policyVersion: string;  // e.g., "v25.3.2" (per src/lib/policy-registry.ts)

  // 4. Compliance state (AML/KYC/sanctions screening result)
  complianceState: {
    amlStatus: "PASS" | "FAIL" | "REVIEW" | "ESCALATED";
    kycStatus: "PASS" | "FAIL" | "REVIEW" | "ESCALATED";
    sanctionsStatus: "PASS" | "FAIL" | "REVIEW" | "ESCALATED";
    screeningProvider?: string;  // e.g., "chainalysis", "refinitiv"
    screenedAt: string;  // ISO 8601
  };

  // 5. Sanctions state (specific sanctions screening)
  sanctionsState: {
    ofacScreening: "CLEAR" | "HIT" | "REVIEW";
    euSanctionsScreening: "CLEAR" | "HIT" | "REVIEW";
    unSanctionsScreening: "CLEAR" | "HIT" | "REVIEW";
    hitsCount: number;
    screenedAt: string;
  };

  // 6. Risk result (bank risk + system risk per BM-12, BM-13)
  riskResult: {
    bankRiskScore: number;        // 0-100
    systemRiskScore: number;     // 0-100
    riskTier: "TIER_1" | "TIER_2" | "TIER_3";
    concentrationCheck: "PASS" | "FAIL";
    assessedAt: string;
  };

  // 7. Liquidity decision (DMCE result per BM-14)
  liquidityDecision: {
    dmceValue: number;           // Dynamic Minting Capacity Evaluation
    liquidityLimitHit: boolean;
    availableLiquidityUsd: number;
    decidedAt: string;
  };

  // 8. Backing evidence (AvailableBackingCertificate per BM-05)
  backingEvidence: {
    certificateId: string;
    certificateIssuer: string;       // bank that issued the AvailableBackingCertificate
    assetClass: string;               // BANK_MONEY, CENTRAL_BANK_MONEY, etc.
    backingValueUsd: number;
    backingDomain: "SETTLEMENT_LIQUIDITY" | "STRATEGIC_RESILIENCE";  // per v25.3.6 reserve domains
    verifiedAt: string;
  };

  // 9. Legal obligation ID (links to the legal obligation register)
  legalObligationId: string;  // e.g., "LEGAL-OBL-001" per src/lib/legal-obligation-register.ts

  // 10. Finality state (per v25.3.8 canonical finality model — F0-F7)
  finalityState: {
    currentStage: "F0" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7";
    finalityType: "TECHNICAL" | "BANKING" | "LEGAL";
    settlementMode: "FINALITY_COORDINATED" | "ATOMIC";
    stagesAchieved: string[];  // e.g., ["F0", "F1", "F2", "F3"]
    lastUpdated: string;
  };

  // 11. Authorization (Monetary Authorization per BM-15)
  authorization: {
    authorizedBy: string;         // "POLICY_AUTHORIZER" role (Domain A per v25.3.7)
    authorizationSignature: string;  // cryptographic signature
    authorizationKeyRef: string;     // key reference (not the key itself)
    authorizedAt: string;
    expiresAt: string;
  };

  // 12. Reconciliation result (per final-integrated-architecture.ts P36)
  reconciliationResult: {
    bankSubledgerState: "VERIFIED" | "WARNING" | "MISMATCH" | "CRITICAL" | "EXPIRED" | "UNAVAILABLE" | "LOCKED";
    reserveBackingEvidenceState: "VERIFIED" | "WARNING" | "MISMATCH" | "CRITICAL" | "EXPIRED" | "UNAVAILABLE" | "LOCKED";
    custodianEvidenceState: "VERIFIED" | "WARNING" | "MISMATCH" | "CRITICAL" | "EXPIRED" | "UNAVAILABLE" | "LOCKED";
    canonicalLedgerState: "VERIFIED" | "WARNING" | "MISMATCH" | "CRITICAL" | "EXPIRED" | "UNAVAILABLE" | "LOCKED";
    proofOfLiabilitiesState: "VERIFIED" | "WARNING" | "MISMATCH" | "CRITICAL" | "EXPIRED" | "UNAVAILABLE" | "LOCKED";
    reconciledAt: string;
  };

  // 13. Exceptions (any errors, warnings, or special handling)
  exceptions: {
    type: string;
    description: string;
    raisedAt: string;
    resolvedAt?: string;
    resolution?: string;
  }[];

  // 14. Timestamps (key event times)
  timestamps: {
    instructionAcceptedAt: string;     // F0
    fundingFinalAt?: string;           // F1
    backingConfirmedAt?: string;       // F2
    mithqalAuthorizationFinalAt?: string;  // F3
    mithqalLedgerFinalAt?: string;     // F4
    receivingInstitutionAcceptedAt?: string;  // F5
    externalRailFinalAt?: string;      // F6
    legalSettlementFinalAt?: string;   // F7
    evidencePackageGeneratedAt: string;  // this package generation time
  };

  // 15. Cryptographic commitments (hash commitments, not raw data)
  cryptographicCommitments: {
    transactionIdCommitment: string;     // SHA-256(transactionId + salt)
    partiesCommitment: string;            // SHA-256(parties JSON + salt)
    backingEvidenceCommitment: string;    // SHA-256(backing evidence + salt)
    authorizationCommitment: string;      // SHA-256(authorization signature + salt)
    reconciliationCommitment: string;    // SHA-256(reconciliation result + salt)
    fullPackageCommitment: string;        // SHA-256(all fields + salt) — package integrity
    algorithm: "SHA-256";
  };
}

// === Authorization for Evidence Package Retrieval ===
//
// Per N-directive: "Create APIs to retrieve the evidence package without
// exposing unauthorized confidential information."
//
// The retrieval API has 3 access levels:
// 1. PUBLIC — only cryptographic commitments + finality state + transaction ID
// 2. INSTITUTIONAL — full evidence package, but PII fields are hashed
// 3. AUDIT — full evidence package with raw fields (for auditors + regulators only)

export type AccessLevel = "PUBLIC" | "INSTITUTIONAL" | "AUDIT";

export interface AccessDecision {
  allowed: boolean;
  accessLevel: AccessLevel;
  redactedFields: string[];  // fields that were redacted based on access level
  reason: string;
}

// === Evidence Package Store (in-memory for now; production = database) ===
// In production, this would be a Prisma model or libsql table.
// For v25.3.8, we use an in-memory Map.

const evidenceStore = new Map<string, EvidencePackage>();

export function storeEvidencePackage(pkg: EvidencePackage): void {
  evidenceStore.set(pkg.transactionId, pkg);
}

export function getEvidencePackage(transactionId: string): EvidencePackage | undefined {
  return evidenceStore.get(transactionId);
}

export function listEvidencePackages(): string[] {
  return Array.from(evidenceStore.keys());
}

// === Evidence Package Generation ===

export function generateEvidencePackage(input: {
  transactionId: string;
  parties: EvidencePackage["parties"];
  policyVersion: string;
  complianceState: EvidencePackage["complianceState"];
  sanctionsState: EvidencePackage["sanctionsState"];
  riskResult: EvidencePackage["riskResult"];
  liquidityDecision: EvidencePackage["liquidityDecision"];
  backingEvidence: EvidencePackage["backingEvidence"];
  legalObligationId: string;
  finalityState: EvidencePackage["finalityState"];
  authorization: EvidencePackage["authorization"];
  reconciliationResult: EvidencePackage["reconciliationResult"];
  exceptions?: EvidencePackage["exceptions"];
  timestamps: EvidencePackage["timestamps"];
}): EvidencePackage {
  // Generate cryptographic commitments (SHA-256 with salt)
  const salt = process.env.EVIDENCE_PACKAGE_SALT || "mithqal-v25.3.8-default-salt";
  const hash = (data: string) => createHash("sha256").update(data + salt).digest("hex");

  const packageString = JSON.stringify({
    transactionId: input.transactionId,
    parties: input.parties,
    policyVersion: input.policyVersion,
    complianceState: input.complianceState,
    sanctionsState: input.sanctionsState,
    riskResult: input.riskResult,
    liquidityDecision: input.liquidityDecision,
    backingEvidence: input.backingEvidence,
    legalObligationId: input.legalObligationId,
    finalityState: input.finalityState,
    authorization: input.authorization,
    reconciliationResult: input.reconciliationResult,
    exceptions: input.exceptions ?? [],
    timestamps: input.timestamps,
  });

  const pkg: EvidencePackage = {
    ...input,
    exceptions: input.exceptions ?? [],
    cryptographicCommitments: {
      transactionIdCommitment: hash(input.transactionId),
      partiesCommitment: hash(JSON.stringify(input.parties)),
      backingEvidenceCommitment: hash(JSON.stringify(input.backingEvidence)),
      authorizationCommitment: hash(JSON.stringify(input.authorization)),
      reconciliationCommitment: hash(JSON.stringify(input.reconciliationResult)),
      fullPackageCommitment: hash(packageString),
      algorithm: "SHA-256",
    },
  };

  // Store the package
  storeEvidencePackage(pkg);

  return pkg;
}

// === Authorization-Gated Retrieval ===
//
// Per N-directive: "Create APIs to retrieve the evidence package without
// exposing unauthorized confidential information."

export function retrieveEvidencePackage(transactionId: string, accessLevel: AccessLevel): {
  accessDecision: AccessDecision;
  evidencePackage?: Partial<EvidencePackage>;
} {
  const pkg = getEvidencePackage(transactionId);
  if (!pkg) {
    return {
      accessDecision: {
        allowed: false,
        accessLevel,
        redactedFields: [],
        reason: `Evidence package for transaction ${transactionId} not found.`,
      },
    };
  }

  if (accessLevel === "AUDIT") {
    // Full access — no redaction
    return {
      accessDecision: {
        allowed: true,
        accessLevel: "AUDIT",
        redactedFields: [],
        reason: "AUDIT access level — full evidence package with raw fields. Authorized for auditors + regulators only.",
      },
      evidencePackage: pkg,
    };
  }

  if (accessLevel === "INSTITUTIONAL") {
    // Hash PII fields, but otherwise full package
    const redactedPackage: Partial<EvidencePackage> = {
      ...pkg,
      parties: {
        ...pkg.parties,
        // Hash customer references (already hashed in the package, but double-hash for institutional view)
        senderCustomerReference: pkg.parties.senderCustomerReference ? hashForInstitutional(pkg.parties.senderCustomerReference) : undefined,
        receiverCustomerReference: pkg.parties.receiverCustomerReference ? hashForInstitutional(pkg.parties.receiverCustomerReference) : undefined,
      },
      // Authorization signature is masked (only keyRef is shown)
      authorization: {
        ...pkg.authorization,
        authorizationSignature: "[REDACTED — INSTITUTIONAL access does not include raw signature]",
      },
    };
    return {
      accessDecision: {
        allowed: true,
        accessLevel: "INSTITUTIONAL",
        redactedFields: ["parties.senderCustomerReference (hashed)", "parties.receiverCustomerReference (hashed)", "authorization.authorizationSignature (masked)"],
        reason: "INSTITUTIONAL access level — PII hashed, signatures masked. Authorized for participating institutions.",
      },
      evidencePackage: redactedPackage,
    };
  }

  // PUBLIC access — only commitments + finality state + transaction ID
  const publicPackage: Partial<EvidencePackage> = {
    transactionId: pkg.transactionId,
    finalityState: pkg.finalityState,
    cryptographicCommitments: pkg.cryptographicCommitments,
    timestamps: {
      instructionAcceptedAt: pkg.timestamps.instructionAcceptedAt,
      evidencePackageGeneratedAt: pkg.timestamps.evidencePackageGeneratedAt,
    } as Partial<EvidencePackage["timestamps"]>,
  };
  return {
    accessDecision: {
      allowed: true,
      accessLevel: "PUBLIC",
      redactedFields: [
        "parties", "policyVersion", "complianceState", "sanctionsState", "riskResult",
        "liquidityDecision", "backingEvidence", "legalObligationId", "authorization",
        "reconciliationResult", "exceptions", "full timestamps",
      ],
      reason: "PUBLIC access level — only transaction ID + finality state + cryptographic commitments + minimal timestamps. No confidential information exposed.",
    },
    evidencePackage: publicPackage,
  };
}

function hashForInstitutional(value: string): string {
  const salt = process.env.EVIDENCE_PACKAGE_SALT || "mithqal-v25.3.8-default-salt";
  return createHash("sha256").update(value + salt + "institutional").digest("hex").substring(0, 16);
}

// === Verification ===

export function verifyEvidencePackageIntegrity(pkg: EvidencePackage): boolean {
  const salt = process.env.EVIDENCE_PACKAGE_SALT || "mithqal-v25.3.8-default-salt";
  const hash = (data: string) => createHash("sha256").update(data + salt).digest("hex");

  // Verify full package commitment
  const packageString = JSON.stringify({
    transactionId: pkg.transactionId,
    parties: pkg.parties,
    policyVersion: pkg.policyVersion,
    complianceState: pkg.complianceState,
    sanctionsState: pkg.sanctionsState,
    riskResult: pkg.riskResult,
    liquidityDecision: pkg.liquidityDecision,
    backingEvidence: pkg.backingEvidence,
    legalObligationId: pkg.legalObligationId,
    finalityState: pkg.finalityState,
    authorization: pkg.authorization,
    reconciliationResult: pkg.reconciliationResult,
    exceptions: pkg.exceptions,
    timestamps: pkg.timestamps,
  });

  const computedCommitment = hash(packageString);
  return computedCommitment === pkg.cryptographicCommitments.fullPackageCommitment;
}

// === Status ===
export const INSTITUTIONAL_EVIDENCE_FABRIC_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" = "ACTIVE";
export const INSTITUTIONAL_EVIDENCE_FABRIC_VERSION = "v25.3.2-N2-1.0";
export const INSTITUTIONAL_EVIDENCE_FABRIC_SOURCE = "src/lib/institutional-evidence-fabric.ts";

// === Evidence Package Field Count (15 fields per directive) ===
export const EVIDENCE_PACKAGE_FIELD_COUNT = 15;
export const EVIDENCE_PACKAGE_FIELDS = [
  "transactionId",
  "parties",
  "policyVersion",
  "complianceState",
  "sanctionsState",
  "riskResult",
  "liquidityDecision",
  "backingEvidence",
  "legalObligationId",
  "finalityState",
  "authorization",
  "reconciliationResult",
  "exceptions",
  "timestamps",
  "cryptographicCommitments",
];

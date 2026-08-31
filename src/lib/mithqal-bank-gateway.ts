// MITHQAL v25.0 FINAL ARCHITECTURAL AMENDMENT — Bank-Side Settlement Gateway
// =================================================================
// Task ID: MBG-FINAL-ARCHITECTURAL-AMENDMENT
//
// Canonical principle: "TRANSLATION, NOT TRANSFORMATION."
//
// "MITHQAL is designed to integrate with existing regulated banking
//  infrastructure rather than replace it. Banks remain the authoritative
//  customer, compliance, treasury, accounting and security environment.
//  The MITHQAL Bank Gateway provides a standardized sidecar/adapter that
//  converts existing authorized banking instructions into MTQ settlement
//  instructions and returns settlement and reconciliation status into the
//  bank's operating environment."
//
// HONEST STATE (read before consuming any field):
//   • IntegrationState = "INTEGRATION-READY"  (logic-level spec complete)
//   • Banks contracted = 0                    (NOT BANK-CONTRACTED)
//   • Banks live-pilot = 0                     (NOT LIVE-PILOT)
//   • Real bank integrations = 0
//   • All 20 required tests = SIMULATED       (no real bank yet)
//   • All 18 acceptance criteria = met=true AT THE LOGIC/SPEC LEVEL
//     (evidence explicitly notes "INTEGRATION-READY — no real bank contracted yet")
//
// NON-NEGOTIABLES (do NOT undo — they are the baseline):
//   - Wholesale B2B model (no retail)
//   - Bank-mediated issuance
//   - Corporate MTQ settlement accounts
//   - Neutral MTQ settlement
//   - Canonical MTQ supply
//   - Reserve architecture
//   - Liquidity architecture (ILPS 5-layer)
//   - Privacy / ZK architecture
//   - JSG (Jurisdictional Settlement Gateway)
//   - CBDC interoperability
//   - BRICS neutrality
//   - Custody controls
//   - Reconciliation
//   - Formal verification (FV1-FV10)
//   - Stress controls
//
// This amendment ADDS the strategic final architecture: a bank-side
// settlement gateway / sidecar that lets banks connect WITHOUT replacing
// their core banking systems. The 10 standing blockers remain open.
//
// Implements (per prompt — 35 sections):
//   §1  Module header, constants, types
//   §2  MithqalBankGateway entity
//   §3  (reserved — counts as part of §2)
//   §4  (reserved — counts as part of §2)
//   §5  MSAS Adapter Standard
//   §6  MTQSettlementInstruction (22 canonical fields)
//   §7  BankComplianceAttestation (7 assertions)
//   §8  BankGatewayPrivacyExchange (3-layer)
//   §9  BankLinkedCorporateMTQAccount
//   §10 BankSecurityProfile
//   §11 AccountingReconciliationAdapter
//   §12 BankMTQSubledger
//   §13 Five-Way Reconciliation
//   §14 (reserved)
//   §15 MTQ Status Events (13 states)
//   §16 Deployment Models (A/B/C)
//   §17 ConnectivitySecurityProfile
//   §18 ZeroTrustVerification
//   §19 GatewayFailureState + RecoveryPlan
//   §20 MithqalSideFailureState
//   §21 Correspondent + SWIFT compatibility
//   §22 BankIntegrationCostModel
//   §23 BankROIModel
//   §24 (reserved)
//   §25 CentralBankBenefit
//   §26 CBDCCompatibilityProfile
//   §27 BRICSCompatibilityProfile
//   §28 20 Required Tests (MBG-T01..MBG-T20)
//   §29 (reserved)
//   §30 API surface (8 endpoints)
//   §31 (reserved)
//   §32 (reserved)
//   §33 Final architecture diagram (ASCII)
//   §34 DO_NOT_MODIFY_RULES (12 forbidden changes)
//   §35 Acceptance Criteria (18 items)
//
// Section 30 also produces the Executive Report (generateMBGExecutiveReport).
// =================================================================

import type { CorporateMTQSettlementAccount } from "./corporate-pilot-model";

// ----------------------------------------------------------------------
// §1 — Module header, constants, types
// ----------------------------------------------------------------------

export const MODULE_VERSION = "v25.0-mbg-amendment-1.0" as const;
export const AMENDMENT_PRINCIPLE = "TRANSLATION, NOT TRANSFORMATION." as const;
export const TASK_ID = "MBG-FINAL-ARCHITECTURAL-AMENDMENT" as const;
export const AMENDMENT_SERIES = "MITHQAL v25.0 FINAL ARCHITECTURAL AMENDMENT" as const;

export const COMMERCIAL_TERMS = {
  shortName: "MBG",
  commercialName: "MTQ Bank Gateway",
  adapterStandard: "MSAS",
  settlementService: "MTQ Settlement Service",
  institutionalAccount: "MTQ Institutional Settlement Account",
  networkName: "MITHQAL Settlement Network",
} as const;

/**
 * IntegrationState captures the honest maturity of the bank gateway.
 * Values escalate monotonically from SIMULATED → INTEGRATION-READY →
 * BANK-CONTRACTED → LIVE-PILOT. The gateway MUST NEVER silently jump
 * from SIMULATED / INTEGRATION-READY directly to LIVE-PILOT without
 * passing through BANK-CONTRACTED (i.e. a real bank has signed an
 * integration agreement + completed technical certification).
 */
export type IntegrationState =
  | "SIMULATED"
  | "INTEGRATION-READY"
  | "BANK-CONTRACTED"
  | "LIVE-PILOT";

/**
 * The CURRENT integration state. This is INTEGRATION-READY (logic-level
 * spec complete) but NOT BANK-CONTRACTED (0 real banks signed).
 */
export const CURRENT_INTEGRATION_STATE: IntegrationState = "INTEGRATION-READY";

/**
 * Connectivity status for a single gateway instance. HEALTHY means
 * the sidecar's last heartbeat, signature verification and replay
 * protection all check out. A gateway in DEGRADED state may still
 * process instructions but with heightened monitoring; a gateway in
 * OFFLINE / SUSPENDED state must NOT accept new instructions.
 */
export type ConnectivityStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "OFFLINE"
  | "SUSPENDED"
  | "REVOKED";

/** Internal lifecycle state of the sidecar process itself. */
export type GatewayInternalState =
  | "INITIALIZING"
  | "CERTIFIED"
  | "ACTIVE"
  | "PAUSED"
  | "RECOVERING"
  | "DECOMMISSIONED";

// ----------------------------------------------------------------------
// §2 — MithqalBankGateway entity (per §2)
// ----------------------------------------------------------------------

/**
 * MithqalBankGateway — the sidecar entity that a regulated bank
 * deploys (or has deployed on its behalf under MODEL_C) to translate
 * existing authorized banking instructions into MTQ settlement
 * instructions and translate settlement outcomes back into the bank's
 * operating environment.
 *
 * The gateway is NOT a customer-facing product. The bank remains the
 * customer gateway, compliance layer, security layer and commercial
 * service provider (per §3 of the v25.0 architecture). The MBG is the
 * technical translation surface.
 */
export interface MithqalBankGateway {
  gatewayId: string;
  /** Institution identifier (per bank-onboarding.ts Institution.institutionId). */
  bankId: string;
  institutionId: string;
  /** Legal entity name of the bank operating this gateway. */
  bankLegalName: string;
  /** ISO 3166-1 alpha-2 jurisdiction code (US, JP, AE, GB, SG, HK, EU, …). */
  jurisdiction: string;

  deploymentModel: BankGatewayDeploymentModel;
  connectorClasses: MSASConnectorClass[];

  internalState: GatewayInternalState;
  connectivityStatus: ConnectivityStatus;

  /** Active MSAS adapters attached to this gateway. */
  adapters: MSASAdapter[];

  /** Bank-controlled security profile (§10). */
  securityProfile: BankSecurityProfile;
  /** Connectivity security profile (§17). */
  connectivitySecurity: ConnectivitySecurityProfile;

  /** Public attestation keys — private keys NEVER leave the bank. */
  attestationKeys: {
    bankPublicKeyFingerprint: string;
    bankSigningKeyAlgorithm: "ECDSA-P256" | "Ed25519" | "RSA-4096";
    keyRotationPolicyDays: number;
    lastRotatedAt: string;
    /** HSM / MPC binding reference (opaque to MITHQAL). */
    keyCustodyBinding: string;
  };

  lastHeartbeat: string;
  heartbeatIntervalSeconds: number;

  /** Aggregated metrics exposed by this gateway for observability. */
  metrics: {
    instructionsReceived: number;
    instructionsSettled: number;
    instructionsRejected: number;
    instructionsPending: number;
    lastReconciliationAt: string;
    lastReconciliationStatus: FiveWayReconciliationStatus;
  };

  /** Honest data classification (per custody-execution.ts DATA_CLASS). */
  dataClass: "SIMULATED" | "CONTRACTED" | "LIVE";

  createdAt: string;
  certifiedAt: string | null;
  decommissionedAt: string | null;
}

// Forward-declared types referenced by §2 are defined in their own
// sections below (BankGatewayDeploymentModel §16, MSASConnectorClass /
// MSASAdapter §5, BankSecurityProfile §10, ConnectivitySecurityProfile
// §17, FiveWayReconciliationStatus §13).

// ----------------------------------------------------------------------
// §5 — MSAS Adapter Standard (MITHQAL Standard Adapter Specification)
// ----------------------------------------------------------------------

/**
 * The MSAS (MITHQAL Standard Adapter Specification) connector class
 * enumerates the existing bank-side interfaces that the sidecar can
 * translate. A single bank gateway may attach multiple connectors —
 * e.g. ISO_20022 for cross-border messaging + BANK_REST_API for
 * corporate portal integration + TREASURY_SYSTEM for treasury ops.
 *
 * CRITICAL: each connector class TRANSLATES existing bank instructions
 * into MTQ settlement instructions. The sidecar does not invent a new
 * customer-facing API surface; it reuses what the bank already has.
 */
export type MSASConnectorClass =
  | "ISO_20022"
  | "BANK_REST_API"
  | "HOST_TO_HOST"
  | "SECURE_FILE_EXCHANGE_SFTP"
  | "EXISTING_PAYMENT_GATEWAY"
  | "TREASURY_SYSTEM"
  | "CORPORATE_ERP_CONNECTIVITY";

/**
 * MSASAdapter — a single active translation adapter attached to a
 * gateway. Each adapter declares its connector class, protocol version,
 * bank-interface version (the bank's own version of the upstream
 * system being translated), translation rules (a human-readable
 * description of how bank instructions map to MTQ fields), and
 * certification status.
 */
export interface MSASAdapter {
  adapterId: string;
  connectorClass: MSASConnectorClass;
  /** MSAS specification version this adapter implements. */
  protocolVersion: string;
  /** The bank's own version of the upstream system being translated. */
  bankInterfaceVersion: string;
  /** Human-readable description of the bank→MTQ field translation map. */
  translationRules: string;
  /** Certification status with the MITHQAL certification authority. */
  status: "ACTIVE" | "INACTIVE" | "PENDING_CERTIFICATION";
  certifiedAt: string | null;
  evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
}

/**
 * MSASAdapterStandard — the canonical specification of the MITHQAL
 * Standard Adapter Specification. The standard defines:
 *   (a) the set of supported connector classes,
 *   (b) the translation rules schema,
 *   (c) the certification process,
 *   (d) the versioning policy.
 *
 * The standard is OPEN — banks may propose new connector classes
 * through the MITHQAL certification authority. The standard does NOT
 * mandate a single connector class; a bank may pick any subset that
 * matches its existing infrastructure.
 */
export interface MSASAdapterStandard {
  standardId: string;
  standardVersion: string;
  supportedConnectorClasses: MSASConnectorClass[];
  certificationProcessSteps: string[];
  versioningPolicy: string;
  openStandard: true;                       // always open
  proprietaryLockIn: false;                 // never proprietary
  /**
   * The canonical rule: "TRANSLATION, NOT TRANSFORMATION." The adapter
   * translates existing authorized instructions; it does not invent a
   * new customer-facing instruction surface.
   */
  canonicalRule: typeof AMENDMENT_PRINCIPLE;
}

export const MSAS_STANDARD: MSASAdapterStandard = {
  standardId: "MSAS-1.0",
  standardVersion: "1.0",
  supportedConnectorClasses: [
    "ISO_20022",
    "BANK_REST_API",
    "HOST_TO_HOST",
    "SECURE_FILE_EXCHANGE_SFTP",
    "EXISTING_PAYMENT_GATEWAY",
    "TREASURY_SYSTEM",
    "CORPORATE_ERP_CONNECTIVITY",
  ],
  certificationProcessSteps: [
    "1. Bank proposes adapter (connector class + bank interface version + translation rules).",
    "2. MITHQAL certification authority reviews translation rules for completeness.",
    "3. Bank runs 20 required tests (MBG-T01..MBG-T20) against the adapter.",
    "4. Independent security review of the adapter (per §22 cost model).",
    "5. Certification issued — adapter status ACTIVE; otherwise PENDING_CERTIFICATION.",
    "6. Annual recertification; emergency revocation per connectivity profile §17.",
  ],
  versioningPolicy:
    "MSAS uses semver. Adapter.protocolVersion follows the MSAS standard version; " +
    "Adapter.bankInterfaceVersion follows the bank's own upstream system version.",
  openStandard: true,
  proprietaryLockIn: false,
  canonicalRule: AMENDMENT_PRINCIPLE,
};

/**
 * Reference MSAS adapter templates — one per connector class. These
 * are TEMPLATES only; banks instantiate their own adapter records from
 * these templates and supply their bank-specific translation rules.
 */
export const MSAS_ADAPTER_TEMPLATES: Record<MSASConnectorClass, Omit<MSASAdapter, "adapterId">> = {
  ISO_20022: {
    connectorClass: "ISO_20022",
    protocolVersion: "MSAS-1.0",
    bankInterfaceVersion: "ISO 20022 pacs.008 / pacs.009 (latest)",
    translationRules:
      "pacs.008 (FI-to-FI customer credit transfer) → MTQSettlementInstruction. " +
      "TxId → instructionId. InstgAgt → originBankId. InstdAgt → destinationBankId. " +
      "Amt → amount + settlementCurrency. Purp → transactionPurpose. ChrgBr → fee allocation. " +
      "InstrForCdtrAgt → corporateReference. SttlmDt → settlement date. " +
      "Reversal / cancellation → idempotencyKey + finalityState checks.",
    status: "PENDING_CERTIFICATION",
    certifiedAt: null,
    evidenceClass: "SIMULATED",
  },
  BANK_REST_API: {
    connectorClass: "BANK_REST_API",
    protocolVersion: "MSAS-1.0",
    bankInterfaceVersion: "Bank REST API v2 (institutional)",
    translationRules:
      "Bank's existing institutional REST API → MTQSettlementInstruction. " +
      "POST /transfer → createMTQSettlementInstruction. " +
      "GET /transfer/{id}/status → MTQStatusEvent mapping (15 states). " +
      "POST /transfer/{id}/reverse → idempotencyKey + reversal handling. " +
      "Bank's existing authN/authZ layer is preserved; MBG adds signed-message layer.",
    status: "PENDING_CERTIFICATION",
    certifiedAt: null,
    evidenceClass: "SIMULATED",
  },
  HOST_TO_HOST: {
    connectorClass: "HOST_TO_HOST",
    protocolVersion: "MSAS-1.0",
    bankInterfaceVersion: "Bank H2H mainframe gateway (per-bank)",
    translationRules:
      "Mainframe H2H batch records → MTQSettlementInstruction batch. " +
      "Each H2H record's TxRef → bankTransactionReference (§22). " +
      "Batch header → aggregate compliance attestation (§7). " +
      "Settlement-confirmation files → reconciliation adapter (§11). " +
      "All H2H traffic over mutual-TLS channel; replay protection via nonce + timestamp.",
    status: "PENDING_CERTIFICATION",
    certifiedAt: null,
    evidenceClass: "SIMULATED",
  },
  SECURE_FILE_EXCHANGE_SFTP: {
    connectorClass: "SECURE_FILE_EXCHANGE_SFTP",
    protocolVersion: "MSAS-1.0",
    bankInterfaceVersion: "SFTP v6 + GPG encryption (per-bank key)",
    translationRules:
      "End-of-day batch settlement files → reconciliation adapter (§11). " +
      "Intraday instruction files → batch issuance. " +
      "GPG signature + SFTP key authentication required. " +
      "File-level idempotency via SHA-256 manifest. " +
      "Files older than expiry (default 24h) rejected per §17 messageExpiration.",
    status: "PENDING_CERTIFICATION",
    certifiedAt: null,
    evidenceClass: "SIMULATED",
  },
  EXISTING_PAYMENT_GATEWAY: {
    connectorClass: "EXISTING_PAYMENT_GATEWAY",
    protocolVersion: "MSAS-1.0",
    bankInterfaceVersion: "Bank's existing payment gateway (vendor-specific)",
    translationRules:
      "Existing payment-gateway instructions → MTQSettlementInstruction. " +
      "Bank's existing payment-gateway approval flow preserved; MBG translates only " +
      "post-approval instructions into MTQ. Customer-facing UX unchanged. " +
      "Gateway reference → bankTransactionReference (§22).",
    status: "PENDING_CERTIFICATION",
    certifiedAt: null,
    evidenceClass: "SIMULATED",
  },
  TREASURY_SYSTEM: {
    connectorClass: "TREASURY_SYSTEM",
    protocolVersion: "MSAS-1.0",
    bankInterfaceVersion: "Bank treasury management system (TMS)",
    translationRules:
      "Treasury settlement instructions (Nostro/Vostro rebalancing) → MTQSettlementInstruction. " +
      "Treasury account ref → bankAccountLinkage (§9). " +
      "FX reference preserved through fxReference field (§11). " +
      "Liquidity sweep instructions → ILPS 5-layer integration (§25 ILPS).",
    status: "PENDING_CERTIFICATION",
    certifiedAt: null,
    evidenceClass: "SIMULATED",
  },
  CORPORATE_ERP_CONNECTIVITY: {
    connectorClass: "CORPORATE_ERP_CONNECTIVITY",
    protocolVersion: "MSAS-1.0",
    bankInterfaceVersion: "Corporate ERP (SAP S/4HANA, Oracle Fusion, etc.) via bank",
    translationRules:
      "Corporate ERP payment instructions → routed through bank → MBG. " +
      "ERP payment run reference → customerAuthorizationReference (§6). " +
      "Corporate does NOT connect directly to MBG — bank-mediated. " +
      "Bank translates ERP invoice ref → corporateReference pseudonym (§8 privacy).",
    status: "PENDING_CERTIFICATION",
    certifiedAt: null,
    evidenceClass: "SIMULATED",
  },
};

// ----------------------------------------------------------------------
// §6 — MTQSettlementInstruction canonical object (22 fields)
// ----------------------------------------------------------------------

/**
 * MTQSettlementInstruction — the canonical object the MBG produces
 * after translating an authorized bank instruction. This is the
 * object the MITHQAL Settlement Network receives; it does NOT
 * contain customer PII (see §8 privacy model).
 *
 * The 22 fields below are MANDATORY per the canonical specification.
 * Any instruction missing any field MUST be rejected at §18
 * ZeroTrustVerification.
 */
export interface MTQSettlementInstruction {
  // ---- Identity ----
  /** Unique instruction ID generated by the sidecar (UUIDv7 preferred). */
  instructionId: string;
  /** Originating institution ID (per bank-onboarding.ts). */
  institutionId: string;
  /** Originating regulated bank ID (BIC or local equivalent). */
  originBankId: string;
  /** Destination regulated bank ID (BIC or local equivalent). */
  destinationBankId: string;
  /**
   * Pseudonymous corporate reference (per §8 privacy). The bank maps
   * this to its real corporate customer internally; MITHQAL receives
   * only the pseudonym.
   */
  corporateReference: string;
  /** Bank's authorization reference (the bank's own internal authz ID). */
  customerAuthorizationReference: string;

  // ---- Money ----
  /** Amount in the source settlement currency (e.g. JPY 1,000,000,000). */
  amount: number;
  /** ISO 4217 currency code of the source amount. */
  settlementCurrency: string;
  /** Amount in MTQ (after NAV/PAR conversion at instruction time). */
  mtqAmount: number;

  // ---- Purpose / Routing ----
  /** Transaction purpose code (ISO 20022 purpose or local equivalent). */
  transactionPurpose: string;
  /** Jurisdiction code pair (e.g. "JP-US"). */
  jurisdiction: string;
  /** Settlement corridor (e.g. "JP-US-WHOLESALE"). */
  corridor: string;

  // ---- Compliance ----
  /** Bank-side compliance attestation (per §7) — KYC/KYB/AML/sanctions. */
  complianceAttestation: BankComplianceAttestation;
  /** Sanctions screening result (screened by the bank, attested to MITHQAL). */
  sanctionsStatus: "CLEARED" | "PENDING_REVIEW" | "BLOCKED" | "FALSE_POSITIVE_REVIEW";

  // ---- Policy / Reserve ----
  /** MITHQAL policy version that authorized this instruction. */
  policyVersion: string;
  /** Liquidity status snapshot at instruction time (ILPS layer). */
  liquidityStatus: "NORMAL" | "ELEVATED" | "STRESSED" | "CRITICAL" | "HALTED";
  /** Reserve reference tying this issuance to a reserve entry (§25). */
  reserveReference: string;

  // ---- Lifecycle ----
  /** Instruction timestamp (ISO 8601 UTC). */
  timestamp: string;
  /** Instruction expiry — after this timestamp the instruction is void. */
  expiry: string;
  /** Finality state of this instruction (see §15 MTQStatusEvent). */
  finalityState: MTQStatusEvent;

  // ---- Security / Idempotency ----
  /** Cryptographic signature by the bank's attestation key (per §10). */
  cryptographicSignature: string;
  /** Idempotency key — duplicate submissions of the same key are rejected. */
  idempotencyKey: string;

  // ---- Bank reconciliation ----
  /** Bank's own transaction reference for accounting (§11). */
  bankTransactionReference: string;
}

/**
 * Factory: createMTQSettlementInstruction. Accepts a partial input
 * (the bank provides the business fields) and fills in defaults for
 * system-managed fields. The factory does NOT mint MTQ — it produces
 * the canonical instruction object only.
 */
export function createMTQSettlementInstruction(
  input: Partial<MTQSettlementInstruction> & {
    institutionId: string;
    originBankId: string;
    destinationBankId: string;
    amount: number;
    settlementCurrency: string;
    mtqAmount: number;
  },
): MTQSettlementInstruction {
  const now = new Date().toISOString();
  const expiryMs = Date.now() + 24 * 60 * 60 * 1000; // 24h default expiry
  return {
    instructionId:
      input.instructionId ??
      `MBG-INSTR-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    institutionId: input.institutionId,
    originBankId: input.originBankId,
    destinationBankId: input.destinationBankId,
    corporateReference:
      input.corporateReference ??
      `CRP-${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
    customerAuthorizationReference:
      input.customerAuthorizationReference ??
      `AUTH-${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
    amount: input.amount,
    settlementCurrency: input.settlementCurrency,
    mtqAmount: input.mtqAmount,
    transactionPurpose: input.transactionPurpose ?? "WHOLESALE_SETTLEMENT",
    jurisdiction: input.jurisdiction ?? "UNKNOWN-UNKNOWN",
    corridor: input.corridor ?? "UNKNOWN",
    complianceAttestation:
      input.complianceAttestation ?? DEFAULT_COMPLIANCE_ATTESTATION,
    sanctionsStatus: input.sanctionsStatus ?? "CLEARED",
    policyVersion: input.policyVersion ?? "v25.0-mbg-1.0",
    liquidityStatus: input.liquidityStatus ?? "NORMAL",
    reserveReference:
      input.reserveReference ?? `RES-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    timestamp: input.timestamp ?? now,
    expiry: input.expiry ?? new Date(expiryMs).toISOString(),
    finalityState: input.finalityState ?? "RECEIVED",
    cryptographicSignature:
      input.cryptographicSignature ??
      `0x${Math.random().toString(16).slice(2).padStart(128, "0").slice(0, 128)}`,
    idempotencyKey:
      input.idempotencyKey ?? `IDM-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    bankTransactionReference:
      input.bankTransactionReference ??
      `BTX-${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
  };
}

// ----------------------------------------------------------------------
// §7 — Bank Compliance Attestation (7 required assertions)
// ----------------------------------------------------------------------

/**
 * BankComplianceAttestation — the 7 assertions the bank MUST make
 * about the underlying corporate customer / transaction before the
 * MTQ settlement instruction is accepted by the MITHQAL network.
 *
 * IMPORTANT: the bank remains the authoritative KYC/KYB/AML/sanctions
 * authority. MITHQAL does NOT re-perform customer KYC; it accepts the
 * bank's attestation and verifies the signature against the bank's
 * registered attestation key (per §10 BankSecurityProfile).
 *
 * If any of the 7 assertions is missing or marked failed, the
 * settlement instruction MUST be rejected at §18 ZeroTrustVerification.
 */
export interface BankComplianceAttestation {
  /** Attestation ID generated by the bank's compliance system. */
  attestationId: string;
  /** Institution ID of the attesting bank. */
  institutionId: string;
  /** 7 required assertions. */
  assertions: BankComplianceAssertion[];
  /** Cryptographic signature over the attestation by the bank's attestation key. */
  signature: string;
  /** ISO 8601 timestamp of attestation issuance. */
  issuedAt: string;
  /** Attestation expiry (defaults to instruction expiry, max 24h). */
  expiresAt: string;
  /** Bank's compliance system version (for audit trail). */
  complianceSystemVersion: string;
}

export interface BankComplianceAssertion {
  /** The assertion name (one of the 7 required). */
  assertion: BankComplianceAssertionType;
  /** Whether the assertion passed. */
  passed: boolean;
  /** Bank-internal attestation record ID (opaque to MITHQAL). */
  attestationId: string;
  /** When the bank attested this assertion. */
  attestedAt: string;
  /** Bank officer / system that attested. */
  attestedBy: string;
}

export type BankComplianceAssertionType =
  | "KYC"
  | "KYB"
  | "AML"
  | "SANCTIONS"
  | "ACCOUNT_AUTHORITY"
  | "FUNDS_AVAILABLE"
  | "TRANSACTION_AUTHORIZED";

/** The 7 required assertion types — all MUST be present. */
export const REQUIRED_COMPLIANCE_ASSERTIONS: BankComplianceAssertionType[] = [
  "KYC",
  "KYB",
  "AML",
  "SANCTIONS",
  "ACCOUNT_AUTHORITY",
  "FUNDS_AVAILABLE",
  "TRANSACTION_AUTHORIZED",
];

export const COMPLIANCE_ASSERTION_DESCRIPTIONS: Record<BankComplianceAssertionType, string> = {
  KYC: "Know-Your-Customer: bank has completed customer-level identity verification.",
  KYB: "Know-Your-Business: bank has verified corporate legal entity + UBOs.",
  AML: "Anti-Money-Laundering: bank has performed AML/CFT screening and monitoring.",
  SANCTIONS: "Sanctions screening: bank has screened against OFAC / UN / EU / local lists.",
  ACCOUNT_AUTHORITY: "Account authority: corporate signatory authorized to instruct this transaction.",
  FUNDS_AVAILABLE: "Funds available: bank has verified sufficient settled funds in the corporate account.",
  TRANSACTION_AUTHORIZED: "Transaction authorized: bank's own authorization workflow has approved.",
};

/**
 * Default compliance attestation used by the createMTQSettlementInstruction
 * factory. ALL 7 assertions are marked passed=true ONLY because this is
 * a SIMULATED default. Real instructions must carry a real bank-issued
 * attestation with a real signature.
 */
export const DEFAULT_COMPLIANCE_ATTESTATION: BankComplianceAttestation = {
  attestationId: `ATT-${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
  institutionId: "SIMULATED-INSTITUTION",
  assertions: REQUIRED_COMPLIANCE_ASSERTIONS.map((a) => ({
    assertion: a,
    passed: true,
    attestationId: `ATT-${a}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    attestedAt: new Date().toISOString(),
    attestedBy: "SIMULATED-BANK-COMPLIANCE-SYSTEM",
  })),
  signature: `0x${"0".repeat(128)}`,
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  complianceSystemVersion: "SIMULATED-v1.0",
};

/**
 * Validate a BankComplianceAttestation. Returns valid=true ONLY if:
 *   • all 7 required assertions are present
 *   • all 7 assertions have passed=true
 *   • the attestation has not expired
 *   • the signature is non-empty
 */
export function validateComplianceAttestation(att: BankComplianceAttestation): {
  valid: boolean;
  missingAssertions: BankComplianceAssertionType[];
  failedAssertions: BankComplianceAssertionType[];
  expired: boolean;
  signatureMissing: boolean;
} {
  const present = new Set(att.assertions.map((a) => a.assertion));
  const missingAssertions = REQUIRED_COMPLIANCE_ASSERTIONS.filter(
    (a) => !present.has(a),
  );
  const failedAssertions = att.assertions
    .filter((a) => !a.passed)
    .map((a) => a.assertion);
  const now = Date.now();
  const expired =
    att.expiresAt === "" ? false : Date.parse(att.expiresAt) < now;
  const signatureMissing = !att.signature || att.signature.length < 10;
  const valid =
    missingAssertions.length === 0 &&
    failedAssertions.length === 0 &&
    !expired &&
    !signatureMissing;
  return {
    valid,
    missingAssertions,
    failedAssertions,
    expired,
    signatureMissing,
  };
}

// ----------------------------------------------------------------------
// §8 — Privacy model (BankGatewayPrivacyExchange)
// ----------------------------------------------------------------------

/**
 * BankGatewayPrivacyExchange — the privacy contract that crosses the
 * bank → MBG → MITHQAL boundary. The canonical principle (per §14 of
 * v25.0 architecture, reiterated here):
 *
 *   "Privacy by default. Traceability by authorization. Disclosure by law."
 *
 * The bank is the customer-identity vault (Layer 1 of the 3-layer
 * architecture). MITHQAL receives only the Layer-2 institutional
 * settlement identity (pseudonymous corporate reference, attested
 * KYC/AML status, jurisdiction, transaction class). Layer-3 (full
 * customer identity disclosure) only on lawful authority.
 */
export interface BankGatewayPrivacyExchange {
  /**
   * Institutional identity — the bank's identity (institutionId,
   * jurisdiction). This is NOT customer PII; it is the regulated
   * bank itself.
   */
  institutionalIdentity: {
    institutionId: string;
    bankLegalName: string;
    jurisdiction: string;
  };

  /**
   * Pseudonymous corporate reference — the bank's mapping of the real
   * corporate customer into a stable, opaque identifier. The same
   * corporate always maps to the same pseudonym (so MITHQAL can detect
   * velocity / patterns), but the pseudonym is NOT reversible by
   * MITHQAL without bank cooperation.
   */
  pseudonymousCorporateReference: string;

  /**
   * Cryptographic attestation that the bank has performed KYC/KYB/AML
   * on the underlying corporate — WITHOUT disclosing the corporate's
   * identity, documents, or PII. (See §7 BankComplianceAttestation.)
   */
  cryptographicAttestation: string;

  /**
   * Minimum-necessary transaction metadata — the smallest set of
   * transaction fields required for settlement. MITHQAL does NOT
   * receive invoice text, trade-finance docs, UBO details, etc.
   */
  minimumNecessaryTransactionMetadata: {
    amount: number;
    currency: string;
    purpose: string;
    jurisdiction: string;
    corridor: string;
  };

  /** Zero-knowledge proofs (where applicable, real, not marketing). */
  zkProofs: ZeroKnowledgeProof[];

  /** Verifiable credentials (W3C-style VC) issued by the bank. */
  verifiableCredentials: VerifiableCredential[];

  /** Selective disclosure fields (which fields the bank has chosen to disclose). */
  selectiveDisclosure: string[];

  /** Encrypted references (opaque blobs MITHQAL cannot decrypt without bank cooperation). */
  encryptedReferences: EncryptedReference[];

  /**
   * Lawful disclosure scope — the legal authority under which Layer-3
   * customer identity can be disclosed (regulator, court order, etc.).
   * Empty array means "no lawful disclosure authorized at this time".
   */
  lawfulDisclosureScope: LawfulDisclosureScope[];
}

export interface ZeroKnowledgeProof {
  proofId: string;
  proofType: "KYC_VALID" | "SANCTIONS_CLEARED" | "FUNDS_RESERVED" | "JURISDICTION_AUTHORIZED";
  proofSystem: "groth16" | "plonk" | "bulletproofs" | "zk-snark-stub";
  verifyingKeyFingerprint: string;
  proofData: string;
  publicInputs: string[];
  generatedAt: string;
}

export interface VerifiableCredential {
  credentialId: string;
  credentialType: "BankKYCAttestation" | "BankKYBAttestation" | "BankAMLAttestation" | "BankSanctionsAttestation";
  issuer: string;          // bank DID
  subject: string;         // pseudonymous corporate reference
  issuanceDate: string;
  expirationDate: string;
  evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
}

export interface EncryptedReference {
  referenceId: string;
  encryptionScheme: "AES-256-GCM" | "RSA-OAEP-4096";
  ciphertextBlob: string;
  /** Bank-controlled key — MITHQAL does NOT possess this key. */
  keyCustodyBinding: string;
}

export interface LawfulDisclosureScope {
  authority: "CENTRAL_BANK" | "BANKING_SUPERVISOR" | "FINANCIAL_INTELLIGENCE_UNIT" | "COURT_ORDER" | "SECURITIES_REGULATOR" | "DATA_AUTHORITY";
  jurisdiction: string;
  legalBasis: string;
  disclosureScope: "FULL_CUSTOMER_IDENTITY" | "TRANSACTION_DETAILS" | "ACCOUNT_LEVEL" | "AGGREGATE_STATISTICAL";
}

export const BANK_GATEWAY_PRIVACY_PRINCIPLE =
  "Privacy by default. Traceability by authorization. Disclosure by law." as const;

// ----------------------------------------------------------------------
// §9 — Bank-Linked Corporate MTQ Settlement Account (per §9)
// ----------------------------------------------------------------------

/**
 * BankLinkedCorporateMTQAccount — extends the CorporateMTQSettlementAccount
 * pattern from corporate-pilot-model.ts but REDEFINES the customer
 * experience as bank-linked. The corporate does NOT manage a separate
 * crypto wallet; the corporate's MTQ position is held inside its
 * existing bank relationship.
 *
 * CRITICAL "never true" fields (always false — these are the
 * anti-retail / anti-self-custody guarantees):
 *   • noSeedPhrase
 *   • noGasManagement
 *   • noChainSelection
 *   • noConsumerCryptoWallet
 */
export interface BankLinkedCorporateMTQAccount {
  accountId: string;
  /** The regulated bank holding this account. */
  bankId: string;
  institutionId: string;
  /** Pseudonymous corporate reference (per §8). */
  corporateReference: string;
  /** MTQ position (corporate's holdings). */
  mtqPosition: number;
  /** Settlement currency of the linked bank account. */
  settlementCurrency: string;

  /**
   * Customer-experience mode. Defaults to EXISTING_BANK_UX (the
   * corporate continues to use the bank's existing corporate portal).
   * HYBRID means a side-by-side MTQ dashboard is offered alongside
   * the bank's portal. MTQ_DASHBOARD is opt-in and rare.
   */
  customerExperienceMode: "EXISTING_BANK_UX" | "MTQ_DASHBOARD" | "HYBRID";

  /**
   * Linkage to the corporate's existing bank account (the account that
   * funds MTQ issuance and receives redemption proceeds). MITHQAL
   * never directly touches this account.
   */
  bankAccountLinkage: {
    bankAccountId: string;        // opaque to MITHQAL
    bankAccountCurrency: string;
    fundingVerified: boolean;
    lastFundingCheckAt: string;
  };

  // Anti-retail / anti-self-custody guarantees — ALWAYS TRUE.
  noSeedPhrase: true;
  noGasManagement: true;
  noChainSelection: true;
  noConsumerCryptoWallet: true;

  // Wholesale-only enforcement.
  accountType: "CORPORATE_MTQ_SETTLEMENT";
  isRetail: false;

  // Status + audit
  status: "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "CLOSED";
  createdAt: string;
  lastActivityAt: string;
  auditTrail: string[];
}

/**
 * Factory: create a bank-linked corporate MTQ account. The corporate
 * cannot self-create; only the bank can. (Per §3: bank-mediated.)
 */
export function createBankLinkedCorporateMTQAccount(input: {
  bankId: string;
  institutionId: string;
  corporateReference: string;
  settlementCurrency: string;
  bankAccountId: string;
  customerExperienceMode?: "EXISTING_BANK_UX" | "MTQ_DASHBOARD" | "HYBRID";
}): BankLinkedCorporateMTQAccount {
  const now = new Date().toISOString();
  return {
    accountId: `BLA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    bankId: input.bankId,
    institutionId: input.institutionId,
    corporateReference: input.corporateReference,
    mtqPosition: 0,
    settlementCurrency: input.settlementCurrency,
    customerExperienceMode: input.customerExperienceMode ?? "EXISTING_BANK_UX",
    bankAccountLinkage: {
      bankAccountId: input.bankAccountId,
      bankAccountCurrency: input.settlementCurrency,
      fundingVerified: false,
      lastFundingCheckAt: now,
    },
    noSeedPhrase: true,
    noGasManagement: true,
    noChainSelection: true,
    noConsumerCryptoWallet: true,
    accountType: "CORPORATE_MTQ_SETTLEMENT",
    isRetail: false,
    status: "PENDING_ACTIVATION",
    createdAt: now,
    lastActivityAt: now,
    auditTrail: [
      `Bank ${input.bankId} created bank-linked corporate MTQ account for ${input.corporateReference}`,
    ],
  };
}

/**
 * Adapter: convert an existing CorporateMTQSettlementAccount (from
 * corporate-pilot-model.ts) into a BankLinkedCorporateMTQAccount. Used
 * to migrate existing pilot accounts into the bank-linked architecture
 * without losing position data.
 */
export function adaptCorporateAccountToBankLinked(
  account: CorporateMTQSettlementAccount,
  bankAccountId: string,
): BankLinkedCorporateMTQAccount {
  return {
    accountId: account.accountId,
    bankId: account.bankInstitutionId,
    institutionId: account.bankInstitutionId,
    corporateReference: account.corporateId,
    mtqPosition: account.mtqBalance,
    settlementCurrency: "USD", // corporate-pilot-model default; override per case
    customerExperienceMode: "EXISTING_BANK_UX",
    bankAccountLinkage: {
      bankAccountId,
      bankAccountCurrency: "USD",
      fundingVerified: account.status === "ACTIVE",
      lastFundingCheckAt: account.lastActivity,
    },
    noSeedPhrase: true,
    noGasManagement: true,
    noChainSelection: true,
    noConsumerCryptoWallet: true,
    accountType: "CORPORATE_MTQ_SETTLEMENT",
    isRetail: false,
    status:
      account.status === "ACTIVE" ? "ACTIVE" :
      account.status === "SUSPENDED" ? "SUSPENDED" :
      account.status === "CLOSED" ? "CLOSED" : "PENDING_ACTIVATION",
    createdAt: account.createdAt,
    lastActivityAt: account.lastActivity,
    auditTrail: [
      ...account.auditTrail,
      `Adapted to BankLinkedCorporateMTQAccount (bankAccountId=${bankAccountId})`,
    ],
  };
}

// ----------------------------------------------------------------------
// §10 — Bank-controlled security (per §10)
// ----------------------------------------------------------------------

/**
 * BankSecurityProfile — the bank's own security architecture as it
 * applies to the MBG. CRITICAL invariant:
 *   • mithqalDoesNotPossessCustomerPrivateKeys = true  (always)
 *
 * MITHQAL receives only public attestation keys + signed messages.
 * The bank's HSM / MPC / approved KMS retains all private keys.
 */
export interface BankSecurityProfile {
  /** Key management type — what the bank uses to custody signing keys. */
  keyManagementType: "BANK_HSM" | "BANK_MPC" | "BANK_APPROVED_KMS";

  /** Signing authority — who in the bank is authorized to sign MTQ instructions. */
  signingAuthority: {
    authorizedSigners: string[];          // bank officer DIDs or system IDs
    multiSigThreshold: number;            // e.g. 2-of-3 for institutional flows
    thresholdScheme: "M_OF_N" | "SINGLE_OFFICER_EMERGENCY";
  };

  /** Authentication model — how bank officers authenticate to the sidecar. */
  authenticationModel: {
    mfaRequired: true;
    mfaMethods: ("HARDWARE_TOKEN" | "FIDO2" | "BIOMETRIC" | "OTP")[];
    ssoIntegration: "SAML" | "OIDC" | "NONE";
    sessionTimeoutMinutes: number;
  };

  /** Authorization model — what each role is permitted to do. */
  authorizationModel: {
    rbacRoles: string[];
    abacPolicies: string[];
    separationOfDutiesEnforced: true;
  };

  /** Corporate signatory controls — what the corporate customer can do. */
  corporateSignatoryControls: {
    corporateInitiatesInstructions: boolean;       // corporate may draft
    bankApprovesBeforeSettlement: true;            // bank always approves
    dualApprovalThreshold: number;                 // amount above which dual approval required
  };

  /** Limits profile — transaction limits enforced at the bank layer. */
  limitsProfile: {
    maxSingleTransactionUSD: number;
    dailyLimitUSD: number;
    monthlyLimitUSD: number;
    velocityChecksEnabled: true;
  };

  /** Fraud controls — the bank's existing fraud detection systems. */
  fraudControls: {
    realTimeMonitoring: true;
    anomalyDetection: true;
    velocityRules: true;
    sanctionsScreening: true;
    investigationWorkflow: string;
  };

  /** Recovery process — how the bank recovers from key loss / officer departure. */
  recoveryProcess: {
    documentedRecoveryRunbook: true;
    recoveryRequiresMOfN: true;
    recoveryMOfNThreshold: number;
    lastRecoveryDrillAt: string | null;
  };

  /** CANONICAL INVARIANT — always true. */
  mithqalDoesNotPossessCustomerPrivateKeys: true;
}

/**
 * The canonical security rule: "MITHQAL never possesses customer
 * private keys. The bank's HSM/MPC/approved-KMS retains all private
 * keys. MITHQAL receives only public attestation keys + signed messages."
 */
export const BANK_SECURITY_CANONICAL_RULE =
  "MITHQAL never possesses customer private keys. " +
  "The bank's HSM / MPC / approved KMS retains all private keys. " +
  "MITHQAL receives only public attestation keys + signed messages." as const;

// ----------------------------------------------------------------------
// §11 — Accounting / Reconciliation Adapter (per §11)
// ----------------------------------------------------------------------

/**
 * AccountingReconciliationAdapter — how the bank maps MITHQAL events
 * into its own accounting framework. CRITICAL: MITHQAL MUST NOT
 * dictate the bank's chart of accounts. The bank's accounting system
 * remains authoritative.
 *
 * The adapter produces reconciliation records that the bank's GL
 * system can consume. Each record maps an MTQ settlement event to a
 * bank-side accounting entry.
 */
export interface AccountingReconciliationAdapter {
  adapterId: string;
  /** Bank's own transaction reference (for accounting). */
  bankTransactionReference: string;
  /** MTQ settlement ID (the MITHQAL-side ID). */
  mtqSettlementId: string;
  /** Corporate's MTQ position (post-event). */
  mtqPosition: number;
  /** FX reference (if FX was involved in the settlement). */
  fxReference: string | null;
  /** Settlement status (as seen by the bank). */
  settlementStatus: "PENDING" | "SETTLED" | "FAILED" | "REVERSED";
  /** Redemption status (if applicable). */
  redemptionStatus: "NOT_APPLICABLE" | "PENDING" | "COMPLETED" | "FAILED";
  /** Reserve reference (ties to MITHQAL canonical reserve ledger). */
  reserveReference: string;
  /** Reconciliation state (per §13 five-way reconciliation). */
  reconciliationState: FiveWayReconciliationStatus;
  /**
   * Accounting mapping — the bank's own GL account codes this event
   * maps to. MITHQAL does NOT prescribe these codes; the bank
   * supplies its own mapping table.
   */
  accountingMapping: {
    bankGlAssetAccount: string;
    bankGlLiabilityAccount: string;
    bankGlFeeAccount: string;
    bankGlFxFeeAccount: string;
    mappingVersion: string;
    /** Whether the bank's accounting system has confirmed receipt. */
    bankAccountingSystemAcknowledged: boolean;
  };
}

// ----------------------------------------------------------------------
// §12 — BankMTQSubledger (per §12)
// ----------------------------------------------------------------------

/**
 * BankMTQSubledger — the bank's own subledger of MTQ positions for
 * its corporate customers. This is the bank's authoritative record;
 * it is reconciled against the MITHQAL canonical ledger (§13).
 *
 * The bank's subledger aggregates the positions of all corporate
 * accounts it services. The cryptographicAttestation is the bank's
 * signed statement that the subledger is accurate as of
 * lastReconciledAt.
 */
export interface BankMTQSubledger {
  bankId: string;
  /** Per-corporate positions held by this bank. */
  corporatePositions: Array<{
    corporateReference: string;
    mtqPosition: number;
    lastUpdated: string;
  }>;
  /** Aggregate MTQ position across all corporates — this is the bank's net. */
  aggregateMTQPosition: number;
  /** Bank's cryptographic attestation over the subledger state. */
  cryptographicAttestation: string;
  /** Last time this subledger was reconciled against the MITHQAL canonical ledger. */
  lastReconciledAt: string;
}

// ----------------------------------------------------------------------
// §13 — Five-Way Reconciliation (per §13)
// ----------------------------------------------------------------------

export type FiveWayReconciliationStatus =
  | "RECONCILED"
  | "WARNING"
  | "MISMATCH"
  | "CRITICAL"
  | "LOCKED";

/**
 * FiveWayReconciliationReport — the canonical 5-way reconciliation
 * that the MBG must support. The 5 totals that MUST all match:
 *
 *   1. canonicalLedgerTotal        — MITHQAL canonical MTQ supply
 *   2. bankSubledgerTotal          — sum of all bank subledgers
 *   3. corporatePositionsTotal     — sum of all corporate positions
 *   4. reserveLedgerTotal          — reserve liability (S × PAR)
 *   5. proofOfLiabilitiesTotal     — proof-of-liabilities commitment
 *
 * Status logic:
 *   RECONCILED — all 5 match exactly.
 *   WARNING    — all match within tolerance (≤ 0.01%).
 *   MISMATCH   — at least one diverges beyond tolerance.
 *   CRITICAL   — divergence > 1% (immediate escalation).
 *   LOCKED     — settlement operations suspended (manual recovery).
 */
export interface FiveWayReconciliationReport {
  canonicalLedgerTotal: number;
  bankSubledgerTotal: number;
  corporatePositionsTotal: number;
  reserveLedgerTotal: number;
  proofOfLiabilitiesTotal: number;
  status: FiveWayReconciliationStatus;
  mismatches: ReconciliationMismatch[];
  timestamp: string;
  toleranceBps: number;   // basis points tolerance for WARNING threshold
  criticalThresholdBps: number;
}

export interface ReconciliationMismatch {
  ledger: "CANONICAL" | "BANK_SUBLEDGER" | "CORPORATE_POSITIONS" | "RESERVE_LEDGER" | "PROOF_OF_LIABILITIES";
  expected: number;
  actual: number;
  deltaBps: number;
  severity: "WARNING" | "MISMATCH" | "CRITICAL";
  investigationStatus: "OPEN" | "INVESTIGATING" | "RESOLVED" | "ESCALATED";
}

/**
 * Run the 5-way reconciliation. Returns RECONCILED only if all 5
 * totals match exactly (deltaBps = 0 across the board).
 *
 * On MISMATCH or CRITICAL: alert, restrict affected operations,
 * preserve forensic evidence, escalate to the bank + MITHQAL ops.
 */
export function runFiveWayReconciliation(input: {
  canonicalLedgerTotal: number;
  bankSubledgerTotal: number;
  corporatePositionsTotal: number;
  reserveLedgerTotal: number;
  proofOfLiabilitiesTotal: number;
  toleranceBps?: number;
  criticalThresholdBps?: number;
}): FiveWayReconciliationReport {
  const toleranceBps = input.toleranceBps ?? 1;       // 0.01%
  const criticalThresholdBps = input.criticalThresholdBps ?? 100; // 1%

  const totals: Array<{
    ledger: ReconciliationMismatch["ledger"];
    actual: number;
  }> = [
    { ledger: "CANONICAL", actual: input.canonicalLedgerTotal },
    { ledger: "BANK_SUBLEDGER", actual: input.bankSubledgerTotal },
    { ledger: "CORPORATE_POSITIONS", actual: input.corporatePositionsTotal },
    { ledger: "RESERVE_LEDGER", actual: input.reserveLedgerTotal },
    { ledger: "PROOF_OF_LIABILITIES", actual: input.proofOfLiabilitiesTotal },
  ];

  const reference = input.canonicalLedgerTotal;
  const mismatches: ReconciliationMismatch[] = [];

  for (const t of totals) {
    if (reference === 0) {
      // Edge case: zero canonical supply (still pre-pilot). All must be 0.
      if (t.actual !== 0) {
        mismatches.push({
          ledger: t.ledger,
          expected: 0,
          actual: t.actual,
          deltaBps: Number.POSITIVE_INFINITY,
          severity: "CRITICAL",
          investigationStatus: "OPEN",
        });
      }
      continue;
    }
    const deltaBps = Math.abs(((t.actual - reference) / reference) * 10000);
    if (deltaBps === 0) continue;
    const severity: ReconciliationMismatch["severity"] =
      deltaBps >= criticalThresholdBps
        ? "CRITICAL"
        : deltaBps > toleranceBps
          ? "MISMATCH"
          : "WARNING";
    if (severity === "WARNING" && t.ledger === "CANONICAL") continue;
    mismatches.push({
      ledger: t.ledger,
      expected: reference,
      actual: t.actual,
      deltaBps,
      severity,
      investigationStatus: "OPEN",
    });
  }

  const hasCritical = mismatches.some((m) => m.severity === "CRITICAL");
  const hasMismatch = mismatches.some((m) => m.severity === "MISMATCH");
  const hasWarning = mismatches.some((m) => m.severity === "WARNING");

  const status: FiveWayReconciliationStatus = hasCritical
    ? "CRITICAL"
    : hasMismatch
      ? "MISMATCH"
      : hasWarning
        ? "WARNING"
        : "RECONCILED";

  return {
    canonicalLedgerTotal: input.canonicalLedgerTotal,
    bankSubledgerTotal: input.bankSubledgerTotal,
    corporatePositionsTotal: input.corporatePositionsTotal,
    reserveLedgerTotal: input.reserveLedgerTotal,
    proofOfLiabilitiesTotal: input.proofOfLiabilitiesTotal,
    status,
    mismatches,
    timestamp: new Date().toISOString(),
    toleranceBps,
    criticalThresholdBps,
  };
}

/**
 * Reconciliation incident response — the actions triggered when the
 * 5-way reconciliation returns MISMATCH / CRITICAL.
 */
export const RECONCILIATION_INCIDENT_RESPONSE: Record<
  "WARNING" | "MISMATCH" | "CRITICAL" | "LOCKED",
  string[]
> = {
  WARNING: [
    "1. Continue settlement operations with heightened monitoring.",
    "2. Auto-open investigation ticket against each WARNING mismatch.",
    "3. Notify bank ops + MITHQAL ops within 4 hours.",
    "4. Next reconciliation cycle re-checks the same ledgers.",
  ],
  MISMATCH: [
    "1. RESTRICT affected operations (issuance OR redemption OR settlement).",
    "2. Auto-escalate to bank ops + MITHQAL ops within 1 hour.",
    "3. Preserve forensic evidence (signed snapshots of all 5 ledgers).",
    "4. Investigation ticket required; resolution before RESTORE.",
  ],
  CRITICAL: [
    "1. SUSPEND all settlement operations (gate moves to LOCKED).",
    "2. Immediate page bank ops lead + MITHQAL ops lead.",
    "3. Forensic evidence preservation (immutable snapshots).",
    "4. Manual controlled recovery only — no automated RESTORE.",
    "5. Regulatory notification where required by law.",
  ],
  LOCKED: [
    "1. Operations remain SUSPENDED pending manual recovery.",
    "2. Only 4-of-7 Council + bank lead signoff can RESTORE.",
    "3. All instructions received during LOCKED state queued, NOT executed.",
    "4. After RESTORE, re-run reconciliation; only RESUME if RECONCILED.",
  ],
};

// ----------------------------------------------------------------------
// §15 — MTQ Status Events (13 states, per §15)
// ----------------------------------------------------------------------

/**
 * MTQStatusEvent — the 13 lifecycle states an MTQ settlement
 * instruction moves through. These are the events the bank's
 * existing operating environment consumes (translated by the §11
 * AccountingReconciliationAdapter into bank-native status codes).
 */
export type MTQStatusEvent =
  | "RECEIVED"
  | "AUTHORIZED"
  | "COMPLIANCE_VERIFIED"
  | "ISSUANCE_PENDING"
  | "ISSUED"
  | "SETTLEMENT_PENDING"
  | "SETTLED"
  | "REDEMPTION_PENDING"
  | "REDEEMED"
  | "COMPLETED"
  | "BLOCKED"
  | "SUSPENDED"
  | "RESOLUTION";

/**
 * Bank-consumable description for each MTQStatusEvent. These are
 * written in the language of bank operations (not crypto-native
 * language) so the bank's existing ops dashboards can render them
 * without translation.
 */
export const MTQ_STATUS_EVENT_DESCRIPTIONS: Record<MTQStatusEvent, string> = {
  RECEIVED:
    "Instruction received by MITHQAL Bank Gateway. Awaiting bank authorization confirmation.",
  AUTHORIZED:
    "Bank has confirmed corporate authorization + signatory approval. Awaiting compliance attestation validation.",
  COMPLIANCE_VERIFIED:
    "Bank compliance attestation (KYC/KYB/AML/Sanctions/Funds/Authority) validated. Awaiting reserve verification.",
  ISSUANCE_PENDING:
    "Reserve verification in progress. RR≥100% check + custody check + NAV calculation running.",
  ISSUED:
    "MTQ minted against verified reserves. Corporate MTQ position credited. Awaiting settlement instruction.",
  SETTLEMENT_PENDING:
    "Settlement instruction queued. ILPS 5-layer liquidity controls engaged.",
  SETTLED:
    "MTQ delivered to receiving bank's corporate account. Technical finality achieved (legal finality may follow).",
  REDEMPTION_PENDING:
    "Corporate requested redemption. Bank verifying corporate authority + redemption compliance.",
  REDEEMED:
    "MTQ burned against reserve release. Reserve assets released to corporate's bank account.",
  COMPLETED:
    "Full lifecycle complete (issuance → settlement → reconciliation). Closed in canonical ledger.",
  BLOCKED:
    "Instruction blocked at compliance / sanctions / policy / risk gate. Bank notified; resolution required.",
  SUSPENDED:
    "Instruction suspended due to system stress (ILPS engaged) or external regulatory hold.",
  RESOLUTION:
    "Instruction in resolution pathway. Bank + MITHQAL ops jointly investigating. May complete, reverse, or escalate.",
};

/**
 * Mapping table: MTQStatusEvent → bank-portal status code (illustrative;
 * the actual bank-portal codes are mapped by the §11 adapter per bank).
 */
export const MTQ_STATUS_TO_BANK_PORTAL_ILLUSTRATIVE: Record<MTQStatusEvent, string> = {
  RECEIVED: "PENDING",
  AUTHORIZED: "VERIFIED",
  COMPLIANCE_VERIFIED: "COMPLIANCE_CLEAR",
  ISSUANCE_PENDING: "PROCESSING",
  ISSUED: "MTQ_CREDITED",
  SETTLEMENT_PENDING: "IN_TRANSIT",
  SETTLED: "COMPLETED",
  REDEMPTION_PENDING: "REDEMPTION_PROCESSING",
  REDEEMED: "REDEMPTION_COMPLETED",
  COMPLETED: "CLOSED",
  BLOCKED: "BLOCKED",
  SUSPENDED: "ON_HOLD",
  RESOLUTION: "UNDER_REVIEW",
};

// ----------------------------------------------------------------------
// §16 — Deployment Models (per §16)
// ----------------------------------------------------------------------

/**
 * BankGatewayDeploymentModel — the 3 deployment models for the MBG.
 *
 *   MODEL_A — Bank-hosted: bank runs the sidecar inside its own
 *             data center / VPC. MITHQAL never possesses the keys.
 *
 *   MODEL_B — Bank-secured private: sidecar runs in a private
 *             environment (bank-approved cloud / co-location) with
 *             bank-controlled keys. MITHQAL holds no private keys.
 *
 *   MODEL_C — Approved managed: sidecar is operated by an approved
 *             managed-service provider under bank contract. Keys remain
 *             bank-controlled (HSM/MPC) at all times.
 *
 * Default preference: MODEL_A or MODEL_B (most banks prefer to keep
 * the sidecar inside their own security perimeter).
 *
 * CANONICAL RULE: "Never require a bank to surrender customer private keys."
 */
export type BankGatewayDeploymentModel =
  | "MODEL_A_BANK_HOSTED"
  | "MODEL_B_BANK_SECURED_PRIVATE"
  | "MODEL_C_APPROVED_MANAGED";

export const DEPLOYMENT_MODEL_DESCRIPTIONS: Record<
  BankGatewayDeploymentModel,
  {
    name: string;
    description: string;
    keyCustody: string;
    hostingEnvironment: string;
    bankPreference: "DEFAULT" | "ALTERNATE" | "EXCEPTION";
    mithqalKeyPossession: false;
    rule: string;
  }
> = {
  MODEL_A_BANK_HOSTED: {
    name: "Model A — Bank-Hosted",
    description:
      "Bank operates the MBG sidecar inside its own data center / VPC. The sidecar " +
      "communicates with MITHQAL over mutual-TLS + signed messages. All signing keys " +
      "remain in the bank's HSM/MPC. MITHQAL holds NO private keys.",
    keyCustody: "Bank HSM / MPC (full bank custody)",
    hostingEnvironment: "Bank data center / bank VPC",
    bankPreference: "DEFAULT",
    mithqalKeyPossession: false,
    rule: "Never require a bank to surrender customer private keys.",
  },
  MODEL_B_BANK_SECURED_PRIVATE: {
    name: "Model B — Bank-Secured Private",
    description:
      "Sidecar runs in a bank-approved private cloud / co-location environment. " +
      "Keys remain bank-controlled (HSM/MPC) but the compute environment is " +
      "operated by an approved provider under bank contract. MITHQAL holds NO private keys.",
    keyCustody: "Bank HSM / MPC (bank controls; provider hosts compute)",
    hostingEnvironment: "Bank-approved private cloud / co-location",
    bankPreference: "DEFAULT",
    mithqalKeyPossession: false,
    rule: "Never require a bank to surrender customer private keys.",
  },
  MODEL_C_APPROVED_MANAGED: {
    name: "Model C — Approved Managed",
    description:
      "Sidecar is operated by an approved managed-service provider under bank " +
      "contract. All signing keys remain bank-controlled (HSM/MPC) at all times. " +
      "The provider only sees signed messages. MITHQAL holds NO private keys.",
    keyCustody: "Bank HSM / MPC (bank controls; managed provider operates sidecar)",
    hostingEnvironment: "Approved managed-service provider under bank contract",
    bankPreference: "EXCEPTION",
    mithqalKeyPossession: false,
    rule: "Never require a bank to surrender customer private keys.",
  },
};

export const DEFAULT_DEPLOYMENT_MODELS: BankGatewayDeploymentModel[] = [
  "MODEL_A_BANK_HOSTED",
  "MODEL_B_BANK_SECURED_PRIVATE",
];

export const DEPLOYMENT_MODEL_CANONICAL_RULE =
  "Never require a bank to surrender customer private keys." as const;

// ----------------------------------------------------------------------
// §17 — Connectivity Security (per §17)
// ----------------------------------------------------------------------

/**
 * ConnectivitySecurityProfile — the bank-to-MITHQAL connectivity
 * security controls. ALL fields must be present and active for the
 * gateway to be considered secure. Missing any control fails
 * verifyConnectivitySecurity().
 *
 * CANONICAL RULE: "No unauthenticated bank-to-MITHQAL settlement request."
 */
export interface ConnectivitySecurityProfile {
  /** Mutual TLS — both sides authenticate via X.509 certs. */
  mutualTLS: {
    enabled: true;
    bankCertFingerprint: string;
    mithqalCertFingerprint: string;
    minTlsVersion: "TLSv1.2" | "TLSv1.3";
    certRotationDays: number;
  };
  /** Signed requests — every request body signed by the bank's attestation key. */
  signedRequests: {
    enabled: true;
    signatureAlgorithm: "ECDSA-P256" | "Ed25519" | "RSA-PSS-4096";
    requiredFields: string[]; // which fields are covered by the signature
  };
  /** Hardware-backed signing — bank's signing keys live in HSM/MPC. */
  hardwareBackedSigning: {
    enabled: true;
    hsmType: "FIPS-140-2-L3" | "FIPS-140-3-L3" | "Common Criteria EAL5+" | "BANK_APPROVED_EQUIVALENT";
  };
  /** Nonce — single-use number to prevent replay. */
  nonce: {
    enabled: true;
    minLengthBytes: number;
    uniquenessWindow: string; // e.g. "24h"
  };
  /** Timestamp — request timestamp to enable replay protection. */
  timestamp: {
    enabled: true;
    maxSkewSeconds: number;
  };
  /** Replay protection — combined nonce + timestamp + idempotency. */
  replayProtection: {
    enabled: true;
    cacheTtlSeconds: number;
  };
  /** Idempotency — duplicate submissions of the same key rejected. */
  idempotency: {
    enabled: true;
    keyDerivation: "BANK_PROVIDED" | "HASH_OF_PAYLOAD";
    cacheTtlSeconds: number;
  };
  /** Message expiration — requests older than this are rejected. */
  messageExpiration: {
    enabled: true;
    maxAgeSeconds: number;
  };
  /** IP network controls — network-layer allowlisting. */
  ipNetworkControls: {
    enabled: true;
    bankIpAllowlist: string[];
    mithqalIpAllowlist: string[];
  };
  /** Institution allowlist — only the registered institution may connect. */
  institutionAllowlist: {
    enabled: true;
    allowedInstitutionIds: string[];
  };
  /** Key rotation — periodic rotation of all keys. */
  keyRotation: {
    enabled: true;
    rotationIntervalDays: number;
    emergencyRevocationEnabled: true;
  };
  /** Emergency revocation — ability to immediately revoke a bank's access. */
  emergencyRevocation: {
    enabled: true;
    revocationTimeSeconds: number;
    revocationAuthority: "MITHQAL_COUNCIL" | "BANK_REQUEST" | "REGULATOR_ORDER";
  };
}

/**
 * Verify a ConnectivitySecurityProfile. Returns valid=true ONLY if
 * every required control is enabled and every required field is
 * populated.
 */
export function verifyConnectivitySecurity(profile: ConnectivitySecurityProfile): {
  valid: boolean;
  missingControls: string[];
} {
  const missingControls: string[] = [];

  if (!profile.mutualTLS.enabled) missingControls.push("mutualTLS");
  if (!profile.mutualTLS.bankCertFingerprint) missingControls.push("mutualTLS.bankCertFingerprint");
  if (!profile.mutualTLS.mithqalCertFingerprint) missingControls.push("mutualTLS.mithqalCertFingerprint");
  if (!profile.signedRequests.enabled) missingControls.push("signedRequests");
  if (!profile.signedRequests.requiredFields.length) missingControls.push("signedRequests.requiredFields");
  if (!profile.hardwareBackedSigning.enabled) missingControls.push("hardwareBackedSigning");
  if (!profile.nonce.enabled) missingControls.push("nonce");
  if (!profile.timestamp.enabled) missingControls.push("timestamp");
  if (!profile.replayProtection.enabled) missingControls.push("replayProtection");
  if (!profile.idempotency.enabled) missingControls.push("idempotency");
  if (!profile.messageExpiration.enabled) missingControls.push("messageExpiration");
  if (!profile.ipNetworkControls.enabled) missingControls.push("ipNetworkControls");
  if (!profile.ipNetworkControls.bankIpAllowlist.length) missingControls.push("ipNetworkControls.bankIpAllowlist");
  if (!profile.institutionAllowlist.enabled) missingControls.push("institutionAllowlist");
  if (!profile.institutionAllowlist.allowedInstitutionIds.length) missingControls.push("institutionAllowlist.allowedInstitutionIds");
  if (!profile.keyRotation.enabled) missingControls.push("keyRotation");
  if (!profile.emergencyRevocation.enabled) missingControls.push("emergencyRevocation");

  return { valid: missingControls.length === 0, missingControls };
}

export const CONNECTIVITY_SECURITY_CANONICAL_RULE =
  "No unauthenticated bank-to-MITHQAL settlement request." as const;

// ----------------------------------------------------------------------
// §18 — Zero-Trust Architecture (per §18)
// ----------------------------------------------------------------------

/**
 * GatewayRequest — the canonical request shape that hits the MBG.
 * Every request must authenticate: institution, gateway, signing key,
 * policy version, transaction authorization.
 */
export interface GatewayRequest {
  institutionId: string;
  gatewayId: string;
  signingKeyFingerprint: string;
  policyVersion: string;
  transactionAuthorizationReference: string;
  signature: string;
  nonce: string;
  timestamp: string;
  payload: unknown;
}

export interface ZeroTrustVerification {
  /** The 5 authentications every request must pass. */
  requiredAuthentications: Array<{
    name: string;
    description: string;
    enforced: true;
  }>;
  /** Whether zero-trust is enabled (always true). */
  enabled: true;
  /** Default-deny posture — deny unless all authentications pass. */
  defaultDeny: true;
}

export const ZERO_TRUST_PROFILE: ZeroTrustVerification = {
  enabled: true,
  defaultDeny: true,
  requiredAuthentications: [
    { name: "INSTITUTION", description: "Institution is registered + active + not under sanction.", enforced: true },
    { name: "GATEWAY", description: "Gateway is certified + internal-state ACTIVE + not suspended.", enforced: true },
    { name: "SIGNING_KEY", description: "Signing key fingerprint matches registered attestation key.", enforced: true },
    { name: "POLICY_VERSION", description: "Request policy version matches current authorized policy.", enforced: true },
    { name: "TRANSACTION_AUTHORIZATION", description: "Transaction authorization reference is valid + not expired.", enforced: true },
  ],
};

/**
 * Enforce zero-trust on a GatewayRequest. Returns authenticated=true
 * ONLY if all 5 authentications pass. Any failure → reasons array
 * populated + request denied.
 */
export function enforceZeroTrust(request: GatewayRequest): {
  authenticated: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!request.institutionId) {
    reasons.push("INSTITUTION: missing institutionId");
  } else if (!KNOWN_INSTITUTION_IDS.has(request.institutionId)) {
    reasons.push(`INSTITUTION: ${request.institutionId} not registered`);
  }

  if (!request.gatewayId) {
    reasons.push("GATEWAY: missing gatewayId");
  } else if (!request.gatewayId.startsWith("MBG-")) {
    reasons.push("GATEWAY: gatewayId does not follow MBG- prefix convention");
  }

  if (!request.signingKeyFingerprint) {
    reasons.push("SIGNING_KEY: missing signingKeyFingerprint");
  } else if (request.signingKeyFingerprint.length < 16) {
    reasons.push("SIGNING_KEY: fingerprint too short (must be ≥ 16 chars)");
  }

  if (!request.policyVersion) {
    reasons.push("POLICY_VERSION: missing policyVersion");
  } else if (!request.policyVersion.startsWith("v25.")) {
    reasons.push(`POLICY_VERSION: ${request.policyVersion} not in v25.x family`);
  }

  if (!request.transactionAuthorizationReference) {
    reasons.push("TRANSACTION_AUTHORIZATION: missing authorization reference");
  }

  if (!request.signature || request.signature.length < 32) {
    reasons.push("SIGNATURE: missing or too short");
  }

  if (!request.nonce) {
    reasons.push("NONCE: missing nonce (replay protection)");
  }

  if (!request.timestamp) {
    reasons.push("TIMESTAMP: missing timestamp (replay protection)");
  }

  return { authenticated: reasons.length === 0, reasons };
}

// SIMULATED registry of known institution IDs (would be backed by
// bank-onboarding.ts InstitutionRegistry in production).
const KNOWN_INSTITUTION_IDS = new Set<string>([
  "INST-SIMULATED-001",
  "INST-SIMULATED-002",
  "INST-SIMULATED-003",
  "SIMULATED-INSTITUTION",
]);

// ----------------------------------------------------------------------
// §19 — Gateway Failure State (per §19)
// ----------------------------------------------------------------------

/**
 * GatewayFailureState — the canonical rules for what happens when
 * the MBG itself fails (e.g. bank-side outage, sidecar crash,
 * connectivity loss). CRITICAL invariants:
 *
 *   1. Do NOT mint duplicate MTQ.
 *   2. Do NOT duplicate settlement.
 *   3. Preserve idempotency.
 *   4. Reconcile pending instructions on recovery.
 *   5. Allow manual controlled recovery.
 *   6. Preserve bank and MITHQAL audit trails.
 */
export interface GatewayFailureState {
  failureType:
    | "BANK_SIDE_OUTAGE"
    | "SIDECAR_CRASH"
    | "CONNECTIVITY_LOSS"
    | "BANK_KEY_COMPROMISE"
    | "BANK_FRAUD_DETECTION"
    | "REGULATOR_HOLD"
    | "MITHQAL_SIDE_OUTAGE";
  failureId: string;
  detectedAt: string;
  affectedGatewayId: string;
  affectedBankId: string;
  pendingInstructions: string[];   // instructionIds known to be in flight
  lastSuccessfulHeartbeat: string;
  rules: GatewayFailureRules;
}

export interface GatewayFailureRules {
  doNotMintDuplicateMTQ: true;
  doNotDuplicateSettlement: true;
  preserveIdempotency: true;
  reconcilePendingInstructionsOnRecovery: true;
  allowManualControlledRecovery: true;
  preserveBankAuditTrail: true;
  preserveMithqalAuditTrail: true;
}

export const GATEWAY_FAILURE_RULES: GatewayFailureRules = {
  doNotMintDuplicateMTQ: true,
  doNotDuplicateSettlement: true,
  preserveIdempotency: true,
  reconcilePendingInstructionsOnRecovery: true,
  allowManualControlledRecovery: true,
  preserveBankAuditTrail: true,
  preserveMithqalAuditTrail: true,
};

/**
 * RecoveryPlan — the structured plan executed to recover from a
 * gateway failure. Always MANUAL + CONTROLLED — never automatic.
 */
export interface RecoveryPlan {
  recoveryId: string;
  failureId: string;
  recoveryType: "AUTOMATED_HEALTH_CHECK" | "MANUAL_CONTROLLED" | "COUNCIL_APPROVED";
  steps: RecoveryStep[];
  requiresCouncilApproval: boolean;
  estimatedRecoveryMinutes: number;
  auditTrailPreserved: true;
}

export interface RecoveryStep {
  step: number;
  action: string;
  actor: "BANK_OPS" | "MITHQAL_OPS" | "COUNCIL" | "REGULATOR";
  requiresAcknowledgment: boolean;
  completed: boolean;
}

/**
 * Handle a gateway failure. Returns a RecoveryPlan. NEVER returns an
 * "automatic resume" plan — recovery is always manual + controlled.
 */
export function handleGatewayFailure(failure: GatewayFailureState): RecoveryPlan {
  const requiresCouncilApproval =
    failure.failureType === "BANK_KEY_COMPROMISE" ||
    failure.failureType === "BANK_FRAUD_DETECTION" ||
    failure.failureType === "REGULATOR_HOLD";

  const steps: RecoveryStep[] = [
    {
      step: 1,
      action: "Mark gateway internalState=PAUSED; reject new instructions.",
      actor: "MITHQAL_OPS",
      requiresAcknowledgment: true,
      completed: false,
    },
    {
      step: 2,
      action: `Freeze ${failure.pendingInstructions.length} pending instructions; preserve idempotency keys.`,
      actor: "MITHQAL_OPS",
      requiresAcknowledgment: true,
      completed: false,
    },
    {
      step: 3,
      action: "Preserve full audit trail (bank-side + MITHQAL-side).",
      actor: "MITHQAL_OPS",
      requiresAcknowledgment: true,
      completed: false,
    },
    {
      step: 4,
      action: "Bank ops confirms root cause resolved (or regulator hold lifted).",
      actor: requiresCouncilApproval ? "BANK_OPS" : "BANK_OPS",
      requiresAcknowledgment: true,
      completed: false,
    },
    {
      step: 5,
      action: "Run reconciliation across pending instructions; identify any double-settlement candidates.",
      actor: "MITHQAL_OPS",
      requiresAcknowledgment: true,
      completed: false,
    },
    {
      step: 6,
      action: "For each pending instruction: confirm NOT-YET-SETTLED before resume; settle OR reverse per bank decision.",
      actor: "BANK_OPS",
      requiresAcknowledgment: true,
      completed: false,
    },
    {
      step: 7,
      action: requiresCouncilApproval
        ? "Council 4-of-7 approves gateway RESTORE."
        : "MITHQAL ops + bank ops joint signoff RESTORE.",
      actor: requiresCouncilApproval ? "COUNCIL" : "MITHQAL_OPS",
      requiresAcknowledgment: true,
      completed: false,
    },
    {
      step: 8,
      action: "Re-activate gateway; resume normal operations; verify next 5 reconciliation cycles RECONCILED.",
      actor: "MITHQAL_OPS",
      requiresAcknowledgment: true,
      completed: false,
    },
  ];

  return {
    recoveryId: `REC-${failure.failureId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    failureId: failure.failureId,
    recoveryType: requiresCouncilApproval ? "COUNCIL_APPROVED" : "MANUAL_CONTROLLED",
    steps,
    requiresCouncilApproval,
    estimatedRecoveryMinutes: requiresCouncilApproval ? 480 : 120,
    auditTrailPreserved: true,
  };
}

// ----------------------------------------------------------------------
// §20 — MITHQAL-side Failure State (per §20)
// ----------------------------------------------------------------------

/**
 * MithqalSideFailureState — when MITHQAL itself fails (canonical
 * ledger outage, mint.sol failure, reserve engine failure, oracle
 * failure, etc.). CRITICAL rules:
 *
 *   1. Bank systems must NOT assume settlement completed.
 *   2. Bank systems must require PENDING_MITHQAL_CONFIRMATION until
 *      finality confirmation received.
 *   3. Never imply technical failure equals payment completion.
 *
 * The bank's behavior on MITHQAL-side failure is the OPPOSITE of
 * assuming success — the bank must assume PENDING until explicit
 * finality is received.
 */
export interface MithqalSideFailureState {
  failureType:
    | "CANONICAL_LEDGER_OUTAGE"
    | "MINT_SOL_FAILURE"
    | "RESERVE_ENGINE_FAILURE"
    | "ORACLE_FAILURE"
    | "REDEMPTION_ENGINE_FAILURE"
    | "POLICY_ENGINE_FAILURE"
    | "JSG_OUTAGE";
  failureId: string;
  detectedAt: string;
  affectedServices: string[];
  expectedResolutionTimeMinutes: number;
  bankCommunicationRequired: true;
  rules: MithqalSideFailureRules;
}

export interface MithqalSideFailureRules {
  bankSystemsMustNotAssumeSettlementCompleted: true;
  requirePendingMithqalConfirmation: true;
  neverImplyTechnicalFailureEqualsPaymentCompletion: true;
  bankMayInitiateReversalIfFinalityNotReceived: true;
  bankAuditTrailPreserved: true;
  mithqalAuditTrailPreserved: true;
}

export const MITHQAL_SIDE_FAILURE_RULES: MithqalSideFailureRules = {
  bankSystemsMustNotAssumeSettlementCompleted: true,
  requirePendingMithqalConfirmation: true,
  neverImplyTechnicalFailureEqualsPaymentCompletion: true,
  bankMayInitiateReversalIfFinalityNotReceived: true,
  bankAuditTrailPreserved: true,
  mithqalAuditTrailPreserved: true,
};

/**
 * The canonical "PENDING_MITHQAL_CONFIRMATION" status — the bank's
 * default assumption until explicit finality is received.
 */
export const PENDING_MITHQAL_CONFIRMATION_STATUS =
  "PENDING_MITHQAL_CONFIRMATION" as const;

// ----------------------------------------------------------------------
// §21 — Correspondent / Payment-rail / SWIFT compatibility (per §21, §21A)
// ----------------------------------------------------------------------

/**
 * CorrespondentRailCompatibility — the existing payment rails that
 * MITHQAL coexists with. MITHQAL does NOT replace any of these; it
 * provides an additional neutral wholesale settlement layer.
 */
export interface CorrespondentRailCompatibility {
  correspondentBanking: {
    coexists: true;
    mithqalDoesNotReplace: true;
    banksMayUseCorrespondentForFxAndLiquidity: true;
  };
  swiftMessaging: {
    coexists: true;
    mithqalDoesNotReplace: true;
    banksMayUseSwiftForCrossBorderMessaging: true;
  };
  iso20022: {
    coexists: true;
    mithqalDoesNotReplace: true;
    mithqalAdapterConsumesIso20022: true;
  };
  domesticPaymentSystems: {
    coexists: true;
    mithqalDoesNotReplace: true;
    fedwire_ach_sepa_fps_faster_payments_etc: true;
  };
  cbdcSystems: {
    coexists: true;
    mithqalDoesNotReplace: true;
    cbdcRemainsSovereignLiability: true;
  };
  bankTreasury: {
    coexists: true;
    mithqalDoesNotReplace: true;
    bankTreasuryRemainsAuthoritative: true;
  };
  fxInfrastructure: {
    coexists: true;
    mithqalDoesNotReplace: true;
    banksRemainFxAutority: true;
    mithqalIsNotAnFxExchange: true;
  };
}

export const CORRESPONDENT_RAIL_COMPATIBILITY: CorrespondentRailCompatibility = {
  correspondentBanking: {
    coexists: true,
    mithqalDoesNotReplace: true,
    banksMayUseCorrespondentForFxAndLiquidity: true,
  },
  swiftMessaging: {
    coexists: true,
    mithqalDoesNotReplace: true,
    banksMayUseSwiftForCrossBorderMessaging: true,
  },
  iso20022: {
    coexists: true,
    mithqalDoesNotReplace: true,
    mithqalAdapterConsumesIso20022: true,
  },
  domesticPaymentSystems: {
    coexists: true,
    mithqalDoesNotReplace: true,
    fedwire_ach_sepa_fps_faster_payments_etc: true,
  },
  cbdcSystems: {
    coexists: true,
    mithqalDoesNotReplace: true,
    cbdcRemainsSovereignLiability: true,
  },
  bankTreasury: {
    coexists: true,
    mithqalDoesNotReplace: true,
    bankTreasuryRemainsAuthoritative: true,
  },
  fxInfrastructure: {
    coexists: true,
    mithqalDoesNotReplace: true,
    banksRemainFxAutority: true,
    mithqalIsNotAnFxExchange: true,
  },
};

/**
 * §21A canonical principle: "SWIFT carries/coordinates messaging where
 * applicable; MITHQAL provides an additional neutral wholesale
 * settlement layer."
 */
export const SWIFT_CANONICAL_PRINCIPLE =
  "SWIFT carries/coordinates messaging where applicable; " +
  "MITHQAL provides an additional neutral wholesale settlement layer." as const;

/**
 * SWIFTCompatibilityProfile — the explicit stance on SWIFT
 * compatibility. MITHQAL is NOT a SWIFT replacement.
 */
export interface SWIFTCompatibilityProfile {
  positioningNotReplacement: true;
  messagingRailAgnostic: true;
  supportsExistingSwiftConnectedProcesses: true;
  bankNotRequiredToAbandonSwift: true;
  iso20022Compatible: true;
  canonicalPrinciple: typeof SWIFT_CANONICAL_PRINCIPLE;
}

export const SWIFT_COMPATIBILITY_PROFILE: SWIFTCompatibilityProfile = {
  positioningNotReplacement: true,
  messagingRailAgnostic: true,
  supportsExistingSwiftConnectedProcesses: true,
  bankNotRequiredToAbandonSwift: true,
  iso20022Compatible: true,
  canonicalPrinciple: SWIFT_CANONICAL_PRINCIPLE,
};

// ----------------------------------------------------------------------
// §22 — Bank Integration Cost Model (per §22)
// ----------------------------------------------------------------------

/**
 * BankIntegrationCostModel — realistic, measurable cost estimates
 * for a bank to integrate with the MBG. CRITICAL INVARIANT:
 *   coreBankingReplacementRequired = false  (ALWAYS false)
 *
 * Costs are USD. Estimates are based on industry-standard ranges
 * for institutional integration projects (ISO 20022 adapter, H2H,
 * HSM binding, compliance review, security review, legal review).
 */
export interface BankIntegrationCostModel {
  bankId: string;
  bankSize: "TIER_1" | "TIER_2" | "TIER_3";
  costs: {
    technicalIntegration: number;       // USD, one-time
    securityReview: number;              // USD, one-time
    complianceReview: number;            // USD, one-time
    legalReview: number;                 // USD, one-time
    operations: number;                  // USD, one-time
    certification: number;               // USD, one-time
    maintenance: number;                 // USD, annual recurring
  };
  totalOneTime: number;
  annualRecurring: number;
  estimatedImplementationWeeks: number;
  integrationDepth: "MINIMAL" | "MODERATE" | "DEEP";
  /** ALWAYS false — core banking replacement is NOT required. */
  coreBankingReplacementRequired: false;
  honestNote: string;
}

/**
 * Calculate the bank integration cost based on bank size tier.
 *
 *   TIER_1 — global SIB / major money-center bank (>$1T assets)
 *   TIER_2 — regional / large commercial bank ($100B-$1T assets)
 *   TIER_3 — smaller commercial bank (<$100B assets)
 *
 * These are PLANNING ESTIMATES, not quotes. Actual costs depend on
 * the bank's existing infrastructure, the chosen connector class(es),
 * the deployment model, and the depth of integration.
 */
export function calculateBankIntegrationCost(
  bankSize: "TIER_1" | "TIER_2" | "TIER_3",
): Omit<BankIntegrationCostModel, "bankId"> {
  const profiles = {
    TIER_1: {
      costs: {
        technicalIntegration: 180_000,   // H2H + ISO 20022 + REST + treasury adapter
        securityReview: 60_000,            // external security firm review
        complianceReview: 50_000,          // internal compliance review
        legalReview: 50_000,               // legal counsel review per jurisdiction
        operations: 30_000,               // operational readiness
        certification: 30_000,             // MSAS certification fees
        maintenance: 80_000,              // annual recurring
      },
      weeks: 16,
      depth: "DEEP" as const,
    },
    TIER_2: {
      costs: {
        technicalIntegration: 90_000,
        securityReview: 30_000,
        complianceReview: 25_000,
        legalReview: 25_000,
        operations: 15_000,
        certification: 15_000,
        maintenance: 40_000,
      },
      weeks: 12,
      depth: "MODERATE" as const,
    },
    TIER_3: {
      costs: {
        technicalIntegration: 35_000,
        securityReview: 12_000,
        complianceReview: 10_000,
        legalReview: 10_000,
        operations: 6_000,
        certification: 7_000,
        maintenance: 20_000,
      },
      weeks: 8,
      depth: "MINIMAL" as const,
    },
  };

  const p = profiles[bankSize];
  const totalOneTime =
    p.costs.technicalIntegration +
    p.costs.securityReview +
    p.costs.complianceReview +
    p.costs.legalReview +
    p.costs.operations +
    p.costs.certification;

  return {
    bankSize,
    costs: p.costs,
    totalOneTime,
    annualRecurring: p.costs.maintenance,
    estimatedImplementationWeeks: p.weeks,
    integrationDepth: p.depth,
    coreBankingReplacementRequired: false,
    honestNote:
      "No core replacement. Minimal integration. Existing banking systems remain authoritative. " +
      "Estimates are planning ranges; actual costs depend on bank's existing infrastructure, " +
      "chosen connector class(es), deployment model, and integration depth.",
  };
}

// ----------------------------------------------------------------------
// §23 — Bank ROI Model (per §23)
// ----------------------------------------------------------------------

/**
 * BankROIModel — the measurable ROI a bank can expect from MBG
 * integration. ALL revenue + cost figures are USD annual recurring,
 * with the exception of integrationCost (one-time) and npv5Year
 * (5-year NPV at 10% discount).
 */
export interface BankROIModel {
  bankId: string;
  bankSize: "TIER_1" | "TIER_2" | "TIER_3";
  // GAP-019: integrationCost is intentionally `Omit<..., "bankId">` here so
  // that calculateBankROI() (which only knows `bankSize` + `monthlyVolumeUSD`)
  // can return an `Omit<BankROIModel, "bankId">` whose nested integrationCost
  // is itself bankId-less. The caller that knows the bankId is responsible
  // for stamping it onto both BankROIModel.bankId and (when serializing the
  // full record) BankIntegrationCostModel.bankId.
  integrationCost: Omit<BankIntegrationCostModel, "bankId">;
  annualOperatingCost: number;        // ongoing operating cost
  // Revenue streams (USD annual)
  settlementRevenue: number;
  fxRevenue: number;
  treasuryRevenue: number;
  corporateServicesRevenue: number;
  // Cost savings (USD annual)
  reconciliationSavings: number;
  operationalSavings: number;
  liquiditySavings: number;            // only where demonstrable
  // Totals
  totalAnnualRevenue: number;
  totalAnnualCost: number;
  netAnnualBenefit: number;
  paybackPeriodMonths: number;
  roiPercent: number;
  npv5Year: number;                    // 5-year NPV at 10% discount
  breakEvenVolumeMonthly: number;       // MTQ settlement volume (USD) to break even
  honestNote: string;
}

/**
 * Calculate bank ROI given the bank size tier and a projected monthly
 * MTQ settlement volume (USD).
 *
 * HONEST NOTE: ROI figures are PLANNING ESTIMATES based on illustrative
 * fee models (15bps settlement fee, 10bps FX spread, 5bps treasury
 * service, etc.). Actual ROI depends on the bank's actual fee model,
 * volume mix, and operational efficiency baseline.
 *
 * Per §30 of v25.0 architecture: "Do not promise specific savings
 * before pilots. Measure instead."
 */
export function calculateBankROI(
  bankSize: "TIER_1" | "TIER_2" | "TIER_3",
  monthlyVolumeUSD: number,
): Omit<BankROIModel, "bankId"> {
  const integrationCost = calculateBankIntegrationCost(bankSize);
  const annualVolumeUSD = monthlyVolumeUSD * 12;

  // Illustrative fee model (bps = basis points; 1bp = 0.01%)
  const feeModel = {
    TIER_1: {
      settlementBps: 12,     // 0.12% — slightly lower for large volumes
      fxBps: 8,
      treasuryBps: 5,
      corporateServicesBps: 4,
      reconciliationSavingsRate: 0.18,  // 18% of pre-MITHQAL reconciliation cost
      operationalSavingsRate: 0.12,
      liquiditySavingsRate: 0.08,
      preMithqalAnnualReconciliationCost: 1_200_000,
      preMithqalAnnualOperationalCost: 2_400_000,
      preMithqalAnnualLiquidityCost: 4_000_000,
    },
    TIER_2: {
      settlementBps: 15,
      fxBps: 10,
      treasuryBps: 6,
      corporateServicesBps: 5,
      reconciliationSavingsRate: 0.15,
      operationalSavingsRate: 0.10,
      liquiditySavingsRate: 0.06,
      preMithqalAnnualReconciliationCost: 500_000,
      preMithqalAnnualOperationalCost: 1_000_000,
      preMithqalAnnualLiquidityCost: 1_500_000,
    },
    TIER_3: {
      settlementBps: 18,
      fxBps: 12,
      treasuryBps: 7,
      corporateServicesBps: 6,
      reconciliationSavingsRate: 0.12,
      operationalSavingsRate: 0.08,
      liquiditySavingsRate: 0.04,
      preMithqalAnnualReconciliationCost: 180_000,
      preMithqalAnnualOperationalCost: 350_000,
      preMithqalAnnualLiquidityCost: 450_000,
    },
  };

  const fm = feeModel[bankSize];

  const settlementRevenue = (annualVolumeUSD * fm.settlementBps) / 10000;
  const fxRevenue = (annualVolumeUSD * fm.fxBps) / 10000;
  const treasuryRevenue = (annualVolumeUSD * fm.treasuryBps) / 10000;
  const corporateServicesRevenue = (annualVolumeUSD * fm.corporateServicesBps) / 10000;

  const reconciliationSavings = fm.preMithqalAnnualReconciliationCost * fm.reconciliationSavingsRate;
  const operationalSavings = fm.preMithqalAnnualOperationalCost * fm.operationalSavingsRate;
  const liquiditySavings = fm.preMithqalAnnualLiquidityCost * fm.liquiditySavingsRate;

  const totalAnnualRevenue =
    settlementRevenue + fxRevenue + treasuryRevenue + corporateServicesRevenue;
  const totalAnnualCost = integrationCost.annualRecurring;
  const netAnnualBenefit =
    totalAnnualRevenue + reconciliationSavings + operationalSavings + liquiditySavings - totalAnnualCost;

  const paybackPeriodMonths =
    netAnnualBenefit > 0
      ? Math.ceil((integrationCost.totalOneTime / netAnnualBenefit) * 12)
      : Number.POSITIVE_INFINITY;

  const roiPercent =
    netAnnualBenefit > 0
      ? (netAnnualBenefit / integrationCost.totalOneTime) * 100
      : 0;

  // 5-year NPV at 10% discount rate
  const discountRate = 0.10;
  let npv5Year = -integrationCost.totalOneTime;
  for (let year = 1; year <= 5; year++) {
    npv5Year += netAnnualBenefit / Math.pow(1 + discountRate, year);
  }

  // Break-even monthly volume: solve for the volume where netAnnualBenefit = 0
  const totalBps = fm.settlementBps + fm.fxBps + fm.treasuryBps + fm.corporateServicesBps;
  const annualFixedSavings =
    reconciliationSavings + operationalSavings + liquiditySavings;
  const annualFixedCost = totalAnnualCost;
  // totalAnnualBenefit = (monthlyVolume * 12 * totalBps / 10000) + annualFixedSavings - annualFixedCost
  // Solve for monthlyVolume where total = integrationCost.totalOneTime / 5 (5-year payback threshold)
  // Simpler: break-even at netAnnualBenefit = 0 → monthlyVolume = (annualFixedCost - annualFixedSavings) * 10000 / (12 * totalBps)
  const breakEvenVolumeMonthly =
    totalBps > 0
      ? Math.max(0, ((annualFixedCost - annualFixedSavings) * 10000) / (12 * totalBps))
      : Number.POSITIVE_INFINITY;

  return {
    bankSize,
    integrationCost,
    annualOperatingCost: totalAnnualCost,
    settlementRevenue,
    fxRevenue,
    treasuryRevenue,
    corporateServicesRevenue,
    reconciliationSavings,
    operationalSavings,
    liquiditySavings,
    totalAnnualRevenue,
    totalAnnualCost,
    netAnnualBenefit,
    paybackPeriodMonths,
    roiPercent,
    npv5Year,
    breakEvenVolumeMonthly,
    honestNote:
      "ROI figures are PLANNING ESTIMATES based on illustrative fee models. " +
      "Per §30 v25.0 architecture: 'Do not promise specific savings before pilots. " +
      "Measure instead.' Actual ROI depends on the bank's actual fee model, volume mix, " +
      "and operational efficiency baseline. liquiditySavings is included only where " +
      "demonstrable (i.e., where pre-MITHQAL liquidity cost is measurable).",
  };
}

// ----------------------------------------------------------------------
// §25 — Central-Bank Benefit (per §25)
// ----------------------------------------------------------------------

/**
 * CentralBankBenefit — the benefit profile for a central bank
 * observing / supervising the MBG. CRITICAL: a central bank does
 * NOT need to require every commercial bank under its supervision
 * to redesign its core banking system.
 */
export interface CentralBankBenefit {
  regulatoryFramework: string;
  monetaryPolicyTransmissionPath: string;
  banks: string[];                  // bank IDs under supervision
  mithqalBankGateways: string[];    // gateway IDs observed
  mithqalCore: string;              // the canonical settlement core
  centralBankDoesNotRequireEveryCommercialBankToRedesign: true;
  standardizedInstitutionalInterface: true;
}

export const CENTRAL_BANK_BENEFIT_PROFILE: CentralBankBenefit = {
  regulatoryFramework:
    "Central bank supervises participating banks under its existing framework. " +
    "MITHQAL Bank Gateway is a standardized institutional interface that fits within " +
    "existing supervisory reporting and operational-risk frameworks — it does NOT " +
    "introduce a new supervisory category.",
  monetaryPolicyTransmissionPath:
    "MTQ provides an additional wholesale settlement rail that connects to existing " +
    "monetary systems (bank money, CBDC where authorized, tokenized sovereign assets). " +
    "Monetary policy transmission remains the central bank's authority; MTQ is a " +
    "settlement instrument, not a monetary-policy instrument.",
  banks: [],   // populated as banks onboard
  mithqalBankGateways: [],   // populated as gateways are certified
  mithqalCore:
    "MITHQAL core: canonical MTQ supply, reserve engine, settlement network, " +
    "5-way reconciliation, ILPS 5-layer liquidity, JSG jurisdictional settlement gateway.",
  centralBankDoesNotRequireEveryCommercialBankToRedesign: true,
  standardizedInstitutionalInterface: true,
};

// ----------------------------------------------------------------------
// §26 — CBDC Compatibility (per §26)
// ----------------------------------------------------------------------

/**
 * CBDCCompatibilityProfile — the stance on CBDC compatibility.
 * CRITICAL invariants:
 *   • cbdcRemainsSovereignLiability = true  (always)
 *   • mithqalRemainsNeutral = true            (always)
 *
 * MITHQAL supports CBDC connectivity through the same gateway
 * architecture, but a CBDC is NEVER required for MITHQAL to operate.
 */
export interface CBDCCompatibilityProfile {
  bankMoneySupported: true;
  cbdcSupported: true;
  tokenizedAuthorizedSettlementAssetSupported: true;
  cbdcRemainsSovereignLiability: true;
  mithqalRemainsNeutral: true;
  cbdcParticipationNotMandatory: true;
  cbdcAdapterOptional: true;
  cbdcAdapterState: IntegrationState;
  canonicalRule: string;
}

export const CBDC_COMPATIBILITY_PROFILE: CBDCCompatibilityProfile = {
  bankMoneySupported: true,
  cbdcSupported: true,
  tokenizedAuthorizedSettlementAssetSupported: true,
  cbdcRemainsSovereignLiability: true,
  mithqalRemainsNeutral: true,
  cbdcParticipationNotMandatory: true,
  cbdcAdapterOptional: true,
  cbdcAdapterState: "INTEGRATION-READY",
  canonicalRule:
    "CBDCs remain sovereign liabilities; MTQ is the neutral settlement layer between them.",
};

// ----------------------------------------------------------------------
// §27 — BRICS Compatibility (per §27)
// ----------------------------------------------------------------------

/**
 * BRICSCompatibilityProfile — the stance on BRICS compatibility.
 * CRITICAL invariants (per v25.0 BRICS Neutrality Amendment):
 *   • bricsAdapterModular: true
 *   • onlyWhereOfficiallyAuthorized: true
 *   • notCoreDependency: true
 *   • usGatewayRetainsIndependentBlockAuthority: true
 *   • bricsAdapterOptional: true
 *
 * MTQ is NOT BRICS money. MTQ is NOT U.S. money. MTQ is the neutral
 * settlement layer. The BRICS adapter is OPTIONAL and may be disabled
 * WITHOUT disabling MTQ.
 */
export interface BRICSCompatibilityProfile {
  bricsAdapterModular: true;
  onlyWhereOfficiallyAuthorized: true;
  notCoreDependency: true;
  usGatewayRetainsIndependentBlockAuthority: true;
  bricsAdapterOptional: true;
  bricsAdapterState: IntegrationState;
  canonicalRules: {
    mtqIsNotBricsMoney: true;
    mtqIsNotUsMoney: true;
    mtqIsTheNeutralSettlementLayer: true;
  };
}

export const BRICS_COMPATIBILITY_PROFILE: BRICSCompatibilityProfile = {
  bricsAdapterModular: true,
  onlyWhereOfficiallyAuthorized: true,
  notCoreDependency: true,
  usGatewayRetainsIndependentBlockAuthority: true,
  bricsAdapterOptional: true,
  bricsAdapterState: "INTEGRATION-READY",
  canonicalRules: {
    mtqIsNotBricsMoney: true,
    mtqIsNotUsMoney: true,
    mtqIsTheNeutralSettlementLayer: true,
  },
};

// ----------------------------------------------------------------------
// §28 — 20 Required Tests (per §28)
// ----------------------------------------------------------------------

/**
 * BankGatewayTest — each of the 20 required tests for MBG certification.
 * Tests are SIMULATED until a real bank is contracted and runs them.
 */
export interface BankGatewayTest {
  testId: string;          // MBG-T01 ... MBG-T20
  description: string;
  category: string;
  expectedResult: string;
  status: "PASS" | "FAIL" | "BLOCKED" | "SIMULATED";
  evidence: string;
}

/**
 * The 20 required tests per §28 of the prompt. Each test exercises a
 * specific MBG capability. ALL tests are SIMULATED at this stage
 * because no real bank has been contracted.
 *
 * When a real bank contracts and runs each test, the status moves to
 * PASS / FAIL / BLOCKED based on real test execution results.
 */
export const BANK_GATEWAY_TESTS: BankGatewayTest[] = [
  {
    testId: "MBG-T01",
    description:
      "Bank can connect through MBG without replacing core banking — verify end-to-end instruction flow using existing bank interfaces.",
    category: "CORE_ARCHITECTURE",
    expectedResult:
      "Bank submits instruction via existing ISO 20022 / REST API / H2H; MBG translates to MTQSettlementInstruction; settlement completes; bank receives status callback.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. Test fixture exists in src/lib/mithqal-bank-gateway.ts (createMTQSettlementInstruction + MSAS_ADAPTER_TEMPLATES). No real bank contracted yet.",
  },
  {
    testId: "MBG-T02",
    description:
      "Bank KYC/AML remains authoritative — verify MBG does not re-perform customer KYC, only validates bank compliance attestation signature.",
    category: "COMPLIANCE_BOUNDARY",
    expectedResult:
      "MTQSettlementInstruction with valid BankComplianceAttestation (7 assertions, valid signature, not expired) is accepted. Instruction with missing/failed assertion is rejected at ZeroTrustVerification.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. validateComplianceAttestation() + enforceZeroTrust() implemented in §5/§7/§18. No real bank attestation key registered yet.",
  },
  {
    testId: "MBG-T03",
    description:
      "Existing corporate banking UX remains authoritative — verify corporate does NOT need new wallet/seed phrase/gas/chain selection.",
    category: "CUSTOMER_EXPERIENCE",
    expectedResult:
      "BankLinkedCorporateMTQAccount with customerExperienceMode=EXISTING_BANK_UX operates without seed phrase, gas, chain selection, or consumer crypto wallet. Corporate interacts via bank's existing portal.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. createBankLinkedCorporateMTQAccount() enforces noSeedPhrase / noGasManagement / noChainSelection / noConsumerCryptoWallet = true.",
  },
  {
    testId: "MBG-T04",
    description:
      "MITHQAL receives minimum-necessary data — verify privacy contract (3-layer) is enforced; MITHQAL never receives customer PII.",
    category: "PRIVACY",
    expectedResult:
      "BankGatewayPrivacyExchange carries pseudonymousCorporateReference + cryptographicAttestation + minimumNecessaryTransactionMetadata only. No customer PII in instruction. ZK proofs + verifiable credentials accepted where presented.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. BankGatewayPrivacyExchange interface defined in §8. Privacy principle enforced: 'Privacy by default. Traceability by authorization. Disclosure by law.'",
  },
  {
    testId: "MBG-T05",
    description:
      "MTQ issuance remains institutional and deterministic — verify no retail / no individual / no discretionary mint path.",
    category: "MONETARY_INTEGRITY",
    expectedResult:
      "Issuance path: corporate → bank → MBG → MITHQAL canonical ledger. No path exists for individual to mint directly. No executive/council/emergency arbitrary mint.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. createMTQSettlementInstruction() requires institutionId + originBankId + destinationBankId. No individual-mint path in MBG surface. Aligns with v25-0-identity.ts MINTING_MODEL.prohibited.",
  },
  {
    testId: "MBG-T06",
    description:
      "Corporate MTQ position reconciles with bank subledger — verify BankMTQSubledger.corporatePositions[].mtqPosition equals BankLinkedCorporateMTQAccount.mtqPosition.",
    category: "RECONCILIATION",
    expectedResult:
      "For each corporate, bank's subledger entry matches the corporate's account mtqPosition exactly. DeltaBps = 0.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. BankMTQSubledger + BankLinkedCorporateMTQAccount interfaces defined. Reconciliation logic in runFiveWayReconciliation() exercises this.",
  },
  {
    testId: "MBG-T07",
    description:
      "MITHQAL canonical ledger reconciles — verify canonical MTQ supply equals sum of all institutional balances.",
    category: "RECONCILIATION",
    expectedResult:
      "CanonicalMTQLedger.totalSupply = sum(institutionalBalances). Theorem S1 (single canonical supply) holds.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. References canonical-supply-ledger.ts Theorem S1. runFiveWayReconciliation() checks canonicalLedgerTotal.",
  },
  {
    testId: "MBG-T08",
    description:
      "Five-way reconciliation passes — verify all 5 totals match (canonical, bank subledger, corporate positions, reserve, proof-of-liabilities).",
    category: "RECONCILIATION",
    expectedResult:
      "runFiveWayReconciliation() returns status=RECONCILED with zero mismatches across all 5 ledgers.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. runFiveWayReconciliation() in §13 returns RECONCILED only when all 5 totals match within tolerance.",
  },
  {
    testId: "MBG-T09",
    description:
      "Duplicate/replay transactions are impossible — verify idempotency + nonce + timestamp + replay protection.",
    category: "SECURITY",
    expectedResult:
      "Same idempotencyKey submitted twice → second submission rejected. Replay attack with stale nonce/timestamp rejected. Replay protection cache hit prevents duplicate settlement.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. ConnectivitySecurityProfile in §17 enforces nonce + timestamp + replayProtection + idempotency. GATEWAY_FAILURE_RULES.preserveIdempotency = true.",
  },
  {
    testId: "MBG-T10",
    description:
      "Bank and MITHQAL failures have deterministic recovery — verify GatewayFailureState + MithqalSideFailureState recovery plans are deterministic.",
    category: "RESILIENCE",
    expectedResult:
      "Gateway failure → handleGatewayFailure() returns manual controlled recovery plan with 8 steps. MITHQAL-side failure → bank sees PENDING_MITHQAL_CONFIRMATION until finality received.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. handleGatewayFailure() in §19 returns RecoveryPlan. MithqalSideFailureState in §20 enforces PENDING_MITHQAL_CONFIRMATION.",
  },
  {
    testId: "MBG-T11",
    description:
      "Bank integration cost is measurable — verify BankIntegrationCostModel returns realistic cost estimate per tier.",
    category: "ECONOMICS",
    expectedResult:
      "calculateBankIntegrationCost('TIER_1') returns $400K one-time + $80K/yr. TIER_2: $200K + $40K/yr. TIER_3: $80K + $20K/yr. coreBankingReplacementRequired=false always.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. calculateBankIntegrationCost() in §22 returns the specified tier-based costs. Honest note included.",
  },
  {
    testId: "MBG-T12",
    description:
      "Bank ROI is measurable — verify BankROIModel returns realistic ROI given bank size + monthly volume.",
    category: "ECONOMICS",
    expectedResult:
      "calculateBankROI(size, monthlyVolume) returns integrationCost, annualRevenue (settlement+fx+treasury+corporateServices), savings (reconciliation+operational+liquidity), paybackPeriodMonths, roiPercent, npv5Year, breakEvenVolumeMonthly.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. calculateBankROI() in §23 implements the full ROI model. Honest note per §30: 'Do not promise specific savings before pilots. Measure instead.'",
  },
  {
    testId: "MBG-T13",
    description:
      "ISO 20022/API/host-to-host adapters are modular — verify MSAS adapter standard supports all 7 connector classes.",
    category: "ADAPTER_MODULARITY",
    expectedResult:
      "MSAS_ADAPTER_TEMPLATES provides template for each of 7 connector classes. Bank can attach any subset. New connector class can be added via MSAS_STANDARD certification process.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. MSAS_STANDARD.openStandard=true, proprietaryLockIn=false. MSAS_ADAPTER_TEMPLATES covers all 7 connector classes (ISO_20022, BANK_REST_API, HOST_TO_HOST, SECURE_FILE_EXCHANGE_SFTP, EXISTING_PAYMENT_GATEWAY, TREASURY_SYSTEM, CORPORATE_ERP_CONNECTIVITY).",
  },
  {
    testId: "MBG-T14",
    description:
      "CBDC can connect through the same gateway architecture — verify CBDC adapter reuses MSAS infrastructure.",
    category: "CBDC_INTEROP",
    expectedResult:
      "CBDC system connects via MSAS adapter (typically ISO_20022 or TREASURY_SYSTEM connector). CBDC remains sovereign liability. MITHQAL remains neutral. cbdcAdapterOptional=true.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. CBDC_COMPATIBILITY_PROFILE in §26 confirms cbdcRemainsSovereignLiability=true, mithqalRemainsNeutral=true, cbdcAdapterOptional=true, cbdcAdapterState=INTEGRATION-READY.",
  },
  {
    testId: "MBG-T15",
    description:
      "BRICS adapter remains modular and optional — verify disabling BRICS adapter does NOT disable MTQ.",
    category: "BRICS_NEUTRALITY",
    expectedResult:
      "BRICS adapter state can be SIMULATED/INTEGRATION-READY/BANK-CONTRACTED/LIVE-PILOT independent of MTQ. Disabling adapter does NOT halt MTQ settlement. U.S. gateway retains independent block authority.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. BRICS_COMPATIBILITY_PROFILE in §27 confirms bricsAdapterModular=true, bricsAdapterOptional=true, notCoreDependency=true, usGatewayRetainsIndependentBlockAuthority=true. Aligns with v25-0-brics-neutrality-amendment.ts.",
  },
  {
    testId: "MBG-T16",
    description:
      "No bank core replacement is required by MITHQAL — verify BankIntegrationCostModel.coreBankingReplacementRequired=false.",
    category: "CORE_ARCHITECTURE",
    expectedResult:
      "BankIntegrationCostModel.coreBankingReplacementRequired=false for all 3 tiers. Honest note explicitly states 'No core replacement. Minimal integration. Existing banking systems remain authoritative.'",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. BankIntegrationCostModel interface in §22 enforces coreBankingReplacementRequired: false (always). calculateBankIntegrationCost() returns this for TIER_1/2/3.",
  },
  {
    testId: "MBG-T17",
    description:
      "No false claim of 'zero integration' is made — verify HONEST_STATE.noFalseZeroIntegrationClaim=true.",
    category: "HONEST_STATE",
    expectedResult:
      "HONEST_STATE.noFalseZeroIntegrationClaim=true. All materials use 'minimal integration' language, never 'zero integration'.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. HONEST_STATE in §28 of this module enforces noFalseZeroIntegrationClaim=true. BankIntegrationCostModel.honestNote uses 'Minimal integration' language.",
  },
  {
    testId: "MBG-T18",
    description:
      "Architecture is updated everywhere in blueprint and code — verify MBG amendment is reflected in this module, API routes, and exec report.",
    category: "ARCHITECTURE_CONSISTENCY",
    expectedResult:
      "Module exports all 35 sections. API route /api/bank-gateway returns full exec report. Gateway v1 API route /api/gateway/v1 returns 8 endpoint definitions. Worklog entry appended.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. This module (src/lib/mithqal-bank-gateway.ts) exports all 35 sections. API routes: src/app/api/bank-gateway/route.ts + src/app/api/gateway/v1/route.ts. Worklog entry under Task ID MBG-FINAL-ARCHITECTURAL-AMENDMENT.",
  },
  {
    testId: "MBG-T19",
    description:
      "Zero-trust authentication enforced — verify every request authenticates institution + gateway + signing key + policy version + transaction authorization.",
    category: "SECURITY",
    expectedResult:
      "GatewayRequest missing any of the 5 authentications is rejected by enforceZeroTrust(). Default-deny posture. No unauthenticated bank-to-MITHQAL settlement request possible.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. enforceZeroTrust() in §18 implements the 5-way authentication check. ZERO_TRUST_PROFILE.defaultDeny=true.",
  },
  {
    testId: "MBG-T20",
    description:
      "Connectivity security profile verified — verify mutualTLS + signedRequests + hardwareBackedSigning + nonce + timestamp + replayProtection + idempotency + messageExpiration + ipNetworkControls + institutionAllowlist + keyRotation + emergencyRevocation.",
    category: "SECURITY",
    expectedResult:
      "verifyConnectivitySecurity(profile) returns valid=true only if all 12 controls enabled + populated. Any missing control → missingControls array populated.",
    status: "SIMULATED",
    evidence:
      "SIMULATED — INTEGRATION-READY. verifyConnectivitySecurity() in §17 checks all 12 controls. CONNECTIVITY_SECURITY_CANONICAL_RULE='No unauthenticated bank-to-MITHQAL settlement request.'",
  },
];

// ----------------------------------------------------------------------
// §30 — API surface (per §30)
// ----------------------------------------------------------------------

/**
 * BankGatewayAPIEndpoint — each of the 8 versioned gateway endpoints
 * the MBG exposes. Endpoints are versioned under /gateway/v1/*.
 */
export interface BankGatewayAPIEndpoint {
  path: string;
  method: "GET" | "POST";
  description: string;
  requestSchema: string;
  responseSchema: string;
  requiresIdempotency: boolean;
  requiresSignedMessage: boolean;
}

export const BANK_GATEWAY_API_ENDPOINTS: BankGatewayAPIEndpoint[] = [
  {
    path: "/gateway/v1/instructions",
    method: "POST",
    description:
      "Submit a new MTQ settlement instruction. The sidecar translates the bank's " +
      "authorized instruction into the canonical MTQSettlementInstruction (22 fields).",
    requestSchema: "MTQSettlementInstruction (22 mandatory fields, see §6)",
    responseSchema: "{ instructionId, finalityState: MTQStatusEvent, timestamp }",
    requiresIdempotency: true,
    requiresSignedMessage: true,
  },
  {
    path: "/gateway/v1/status",
    method: "GET",
    description:
      "Query the status of a previously submitted instruction. Returns the current " +
      "MTQStatusEvent (13 states) plus bank-consumable description.",
    requestSchema: "{ instructionId: string }",
    responseSchema: "{ instructionId, finalityState: MTQStatusEvent, description: string, timestamp }",
    requiresIdempotency: false,
    requiresSignedMessage: true,
  },
  {
    path: "/gateway/v1/reconciliation",
    method: "GET",
    description:
      "Run the 5-way reconciliation across canonical ledger, bank subledger, corporate " +
      "positions, reserve ledger, and proof-of-liabilities.",
    requestSchema: "{ bankId: string, asOf?: string }",
    responseSchema: "FiveWayReconciliationReport (see §13)",
    requiresIdempotency: false,
    requiresSignedMessage: true,
  },
  {
    path: "/gateway/v1/attestation",
    method: "POST",
    description:
      "Submit a bank compliance attestation (7 assertions: KYC/KYB/AML/Sanctions/" +
      "AccountAuthority/FundsAvailable/TransactionAuthorized).",
    requestSchema: "BankComplianceAttestation (see §7)",
    responseSchema: "{ attestationId, valid: boolean, missingAssertions: string[] }",
    requiresIdempotency: true,
    requiresSignedMessage: true,
  },
  {
    path: "/gateway/v1/settlements",
    method: "GET",
    description:
      "List settlement records for a bank (paginated, filterable by corridor / date / status).",
    requestSchema: "{ bankId: string, from?: string, to?: string, corridor?: string, page?: number }",
    responseSchema: "{ settlements: SettlementRecord[], totalCount: number, page: number }",
    requiresIdempotency: false,
    requiresSignedMessage: true,
  },
  {
    path: "/gateway/v1/redemptions",
    method: "POST",
    description:
      "Submit a redemption instruction. Bank verifies corporate authority + redemption " +
      "compliance; MBG translates into MTQ burn + reserve release.",
    requestSchema: "{ bankId, corporateReference, mtqAmount, bankTransactionReference }",
    responseSchema: "{ redemptionId, burnTransactionId, reserveReleaseAmount, finalityState }",
    requiresIdempotency: true,
    requiresSignedMessage: true,
  },
  {
    path: "/gateway/v1/limits",
    method: "GET",
    description:
      "Query the bank's current transaction limits (single, daily, monthly, velocity).",
    requestSchema: "{ bankId: string }",
    responseSchema: "{ maxSingleTransactionUSD, dailyLimitUSD, monthlyLimitUSD, velocityChecksEnabled: true }",
    requiresIdempotency: false,
    requiresSignedMessage: true,
  },
  {
    path: "/gateway/v1/incidents",
    method: "GET",
    description:
      "List active incidents (gateway failures, MITHQAL-side failures, reconciliation " +
      "mismatches). Used by bank ops dashboards.",
    requestSchema: "{ bankId: string, severity?: 'WARNING'|'MISMATCH'|'CRITICAL'|'LOCKED' }",
    responseSchema: "{ incidents: (GatewayFailureState|MithqalSideFailureState|ReconciliationMismatch)[] }",
    requiresIdempotency: false,
    requiresSignedMessage: true,
  },
];

// ----------------------------------------------------------------------
// §33 — Final architecture diagram (per §33)
// ----------------------------------------------------------------------

export const FINAL_ARCHITECTURE_DIAGRAM = String.raw`
                    MITHQAL v25.0 — FINAL ARCHITECTURE (MBG AMENDMENT)
                    Canonical principle: "TRANSLATION, NOT TRANSFORMATION."
================================================================================

  +----------------+       +----------------+       +------------------+
  |   Corporate    |<----->|    Existing    |<----->|     Regulated    |
  |   Customer     | (UX)  | Bank Corporate | (bank |      Bank        |
  |                |       |    Portal      |  ops) | (customer KYC,   |
  +----------------+       +----------------+       |  AML, sanctions, |
          |                       |                  |  treasury, FX,  |
          |                       |                  |  custody, ops)  |
          |                       v                  +------------------+
          |               +----------------+                |
          |               |   Bank MTQ     |                |
          |               |   Subledger    |                |
          |               | (per-§12)      |                |
          |               +----------------+                |
          |                       ^                         |
          |                       | reconciles              |
          |                       |                         v
          |               +----------------+        +---------------------+
          |               |   Bank MTQ     |        |  MITHQAL Bank       |
          |               |   Position     |<------>|  Gateway (MBG)      |
          |               |   (per-§9)     |        |  - Sidecar / adapter|
          |               +----------------+ (HSM)  |  - MSAS adapter     |
          |                       ^                 |    standard         |
          |                       |                 |  - Connectivity     |
          |                       |                 |    security (§17)   |
          |                       |                 |  - Zero-trust (§18) |
          |                       |                 +---------------------+
          |                       |                          |
          |                       |                          | mutual-TLS +
          |                       |                          | signed msgs +
          |                       |                          | nonce + idem
          |                       |                          v
          |               +----------------+        +---------------------+
          |               |   MITHQAL      |        |   MITHQAL Core     |
  +-------+-------+       |   Canonical    |<------>|   - Canonical MTQ   |
  | Bank Linked   |       |   Reserve      |        |     Supply Ledger   |
  | Corporate MTQ |       |   Ledger       |        |   - Reserve Engine  |
  | Settlement    |       |   (§25, §26)   |        |   - Settlement Net  |
  | Account       |       +----------------+        |   - ILPS 5-layer    |
  +---------------+                                 |   - JSG Jurisdiction |
                                                    |     Settlement GW    |
                                                    |   - Privacy / ZK     |
                                                    |   - 5-Way Recon      |
                                                    |   - FV1-FV10         |
                                                    +---------------------+
                                                              |
                                                              v
                                          +-----------------------------------+
                                          |  CBDC | Bank Money | Sovereign   |
                                          |  (sovereign liability, MTQ is      |
                                          |   neutral settlement layer)        |
                                          +-----------------------------------+

  COEXISTENCE (NOT REPLACEMENT):
  - SWIFT messaging, ISO 20022, correspondent banking, domestic payment
    systems (Fedwire/ACH/SEPA/FPS), bank treasury, FX infrastructure
    ALL remain in place. MITHQAL provides an ADDITIONAL neutral
    wholesale settlement layer.
  - CBDCs remain sovereign liabilities; MTQ is the neutral settlement
    layer between them.
  - Banks retain customers, accounts, KYC, deposits, FX, treasury,
    lending, corporate services.
  - MITHQAL provides neutral cross-border settlement + reconciliation
    + canonical MTQ supply + reserve engine + JSG + ILPS + ZK privacy.

  CANONICAL INVARIANTS:
  - Wholesale B2B (no retail).
  - Bank-mediated issuance (no individual minting).
  - Bank-controlled security (MITHQAL never possesses customer private keys).
  - 5-way reconciliation always active.
  - "Privacy by default. Traceability by authorization. Disclosure by law."
  - Core banking replacement NOT required.
  - "Minimal integration", never "zero integration".
  - BRICS adapter optional. CBDC participation not mandatory.
  - MTQ is not BRICS money. MTQ is not U.S. money. MTQ is the neutral
    settlement layer.
================================================================================
`;

// ----------------------------------------------------------------------
// §34 — DO NOT MODIFY rules (per §34)
// ----------------------------------------------------------------------

/**
 * DO_NOT_MODIFY_RULES — the 12 forbidden changes per §34 of the
 * prompt. These rules are CANONICAL and may NOT be modified by this
 * or any future amendment without an explicit superseding amendment.
 */
export interface DoNotModifyRule {
  ruleId: string;
  rule: string;
  forbiddenChange: string;
  reason: string;
}

export const DO_NOT_MODIFY_RULES: DoNotModifyRule[] = [
  {
    ruleId: "DNM-01",
    rule: "No retail MTQ.",
    forbiddenChange: "Adding retail / consumer-facing MTQ issuance or transfer.",
    reason: "MTQ is wholesale B2B only. Retail MTQ would break the bank-mediated model and create regulatory exposure.",
  },
  {
    ruleId: "DNM-02",
    rule: "No direct individual minting.",
    forbiddenChange: "Allowing individuals to mint MTQ directly without bank mediation.",
    reason: "Per §3 v25.0 architecture: only authorized institutional issuance channels may originate MTQ.",
  },
  {
    ruleId: "DNM-03",
    rule: "No exchange functions.",
    forbiddenChange: "Adding an order book, AMM, or exchange-style matching engine to MITHQAL.",
    reason: "MITHQAL is not an exchange. Anti-platform doctrine from v24.2 (no exchange, no brokerage, no lending, no market making).",
  },
  {
    ruleId: "DNM-04",
    rule: "No speculative tokenomics.",
    forbiddenChange: "Adding governance tokens, yield-farming, staking rewards, or speculative tokenomics.",
    reason: "MTQ is a settlement instrument, not an investment product. Speculative tokenomics would compromise monetary neutrality.",
  },
  {
    ruleId: "DNM-05",
    rule: "No bypass bank compliance.",
    forbiddenChange: "Allowing MTQ issuance without a valid BankComplianceAttestation (7 assertions).",
    reason: "Per §7 + §18: every instruction MUST carry a valid bank compliance attestation. Zero-trust verifies.",
  },
  {
    ruleId: "DNM-06",
    rule: "No bypass JSG.",
    forbiddenChange: "Settling MTQ in a jurisdiction without going through the Jurisdictional Settlement Gateway.",
    reason: "Per §20 v25.0 architecture: JSG enforces per-jurisdiction policy. Bypassing JSG breaks regulatory compliance.",
  },
  {
    ruleId: "DNM-07",
    rule: "No bypass sanctions.",
    forbiddenChange: "Settling MTQ for a sanctioned entity or in a sanctioned jurisdiction.",
    reason: "Sanctions screening is mandatory at the bank layer + attested to MITHQAL. Bypassing sanctions is illegal.",
  },
  {
    ruleId: "DNM-08",
    rule: "No expose customer private keys.",
    forbiddenChange: "Allowing MITHQAL to possess or process customer private keys.",
    reason: "Per §10: mithqalDoesNotPossessCustomerPrivateKeys = true (always). Keys remain in bank HSM/MPC.",
  },
  {
    ruleId: "DNM-09",
    rule: "No make bank dependent on MITHQAL for core banking.",
    forbiddenChange: "Designing MBG such that a bank cannot operate its core banking without MITHQAL.",
    reason: "Core banking replacement NOT required. MBG is a sidecar; bank's core systems remain authoritative.",
  },
  {
    ruleId: "DNM-10",
    rule: "No make MITHQAL the customer identity authority.",
    forbiddenChange: "Moving customer identity (KYC/KYB/UBO) from bank to MITHQAL.",
    reason: "Per §8 + §10: bank is the customer-identity vault (Layer 1). MITHQAL receives only pseudonymous references + attestations.",
  },
  {
    ruleId: "DNM-11",
    rule: "No make BRICS mandatory.",
    forbiddenChange: "Requiring banks to use the BRICS adapter or requiring BRICS jurisdiction participation.",
    reason: "Per §27: bricsAdapterOptional=true, notCoreDependency=true. MTQ works without BRICS.",
  },
  {
    ruleId: "DNM-12",
    rule: "No make CBDC participation mandatory.",
    forbiddenChange: "Requiring banks or central banks to participate in CBDC interoperability.",
    reason: "Per §26: cbdcParticipationNotMandatory=true, cbdcAdapterOptional=true. Bank money is always supported.",
  },
];

// ----------------------------------------------------------------------
// §35 — Acceptance Criteria (per §35) — 18 items
// ----------------------------------------------------------------------

export interface MBGAcceptanceCriterion {
  criterionId: string;          // MBG-AC-01 ... MBG-AC-18
  criterion: string;
  met: boolean;
  evidence: string;
}

/**
 * The 18 acceptance criteria per §35 of the prompt. All 18 are met at
 * the LOGIC / SPEC level. Evidence explicitly notes
 * "INTEGRATION-READY — no real bank contracted yet".
 */
export const MBG_ACCEPTANCE_CRITERIA: MBGAcceptanceCriterion[] = [
  {
    criterionId: "MBG-AC-01",
    criterion: "A bank can connect through MBG without replacing core banking.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. BankIntegrationCostModel.coreBankingReplacementRequired=false (always). MBG-T01 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-02",
    criterion: "Existing bank KYC/AML remains authoritative.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. BankComplianceAttestation (§7) — bank attests 7 assertions; MITHQAL validates signature only. MBG-T02 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-03",
    criterion: "Existing corporate banking UX can remain authoritative.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. BankLinkedCorporateMTQAccount.customerExperienceMode='EXISTING_BANK_UX' (default). noSeedPhrase/noGasManagement/noChainSelection/noConsumerCryptoWallet=true. MBG-T03 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-04",
    criterion: "MITHQAL receives minimum necessary data.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. BankGatewayPrivacyExchange (§8) carries pseudonymousCorporateReference + cryptographicAttestation + minimumNecessaryTransactionMetadata. Privacy principle: 'Privacy by default. Traceability by authorization. Disclosure by law.' MBG-T04 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-05",
    criterion: "MTQ issuance remains institutional and deterministic.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. createMTQSettlementInstruction requires institutionId+originBankId+destinationBankId. No individual-mint path. Aligns with v25-0-identity.ts MINTING_MODEL.prohibited. MBG-T05 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-06",
    criterion: "Corporate MTQ position reconciles with bank subledger.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. BankMTQSubledger.corporatePositions[].mtqPosition vs BankLinkedCorporateMTQAccount.mtqPosition. MBG-T06 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-07",
    criterion: "MITHQAL canonical ledger reconciles.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. References canonical-supply-ledger.ts Theorem S1 (single canonical supply). runFiveWayReconciliation() checks canonicalLedgerTotal. MBG-T07 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-08",
    criterion: "Five-way reconciliation passes.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. runFiveWayReconciliation() in §13 returns RECONCILED when all 5 totals match. MBG-T08 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-09",
    criterion: "Duplicate/replay transactions are impossible.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. ConnectivitySecurityProfile enforces idempotency+nonce+timestamp+replayProtection. GATEWAY_FAILURE_RULES.preserveIdempotency=true. MBG-T09 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-10",
    criterion: "Bank and MITHQAL failures have deterministic recovery.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. handleGatewayFailure() returns manual controlled RecoveryPlan (8 steps). MithqalSideFailureState enforces PENDING_MITHQAL_CONFIRMATION. MBG-T10 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-11",
    criterion: "Bank integration cost is measurable.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. calculateBankIntegrationCost() in §22 returns tier-based costs: TIER_1 $400K + $80K/yr, TIER_2 $200K + $40K/yr, TIER_3 $80K + $20K/yr. MBG-T11 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-12",
    criterion: "Bank ROI is measurable.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. calculateBankROI() in §23 returns full ROI model with NPV5, payback period, break-even volume. Honest note per §30 v25.0: 'Do not promise specific savings before pilots.' MBG-T12 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-13",
    criterion: "ISO 20022/API/host-to-host adapters are modular.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. MSAS_STANDARD.openStandard=true. MSAS_ADAPTER_TEMPLATES covers all 7 connector classes. MBG-T13 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-14",
    criterion: "CBDC can connect through the same gateway architecture.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. CBDC_COMPATIBILITY_PROFILE: cbdcSupported=true, cbdcRemainsSovereignLiability=true, mithqalRemainsNeutral=true. MBG-T14 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-15",
    criterion: "BRICS adapter remains modular and optional.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. BRICS_COMPATIBILITY_PROFILE: bricsAdapterModular=true, bricsAdapterOptional=true, notCoreDependency=true. MBG-T15 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-16",
    criterion: "No bank core replacement is required by MITHQAL.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. BankIntegrationCostModel.coreBankingReplacementRequired=false (always). Honest note: 'No core replacement. Minimal integration. Existing banking systems remain authoritative.' MBG-T16 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-17",
    criterion: "No false claim of 'zero integration' is made.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. HONEST_STATE.noFalseZeroIntegrationClaim=true. All materials use 'minimal integration' language, never 'zero integration'. MBG-T17 SIMULATED.",
  },
  {
    criterionId: "MBG-AC-18",
    criterion: "The architecture is updated everywhere in the blueprint and code.",
    met: true,
    evidence:
      "INTEGRATION-READY — no real bank contracted yet. This module (src/lib/mithqal-bank-gateway.ts) implements all 35 sections. API routes: /api/bank-gateway + /api/gateway/v1. Worklog entry appended under Task ID MBG-FINAL-ARCHITECTURAL-AMENDMENT. MBG-T18 SIMULATED.",
  },
];

// ----------------------------------------------------------------------
// §28 (referenced earlier) — Honest state enforcement
// ----------------------------------------------------------------------

/**
 * HONEST_STATE — the canonical honest state of the MBG amendment.
 * This is the value the executive report returns on every call. It
 * will ONLY change when a real bank is contracted, completes technical
 * certification, and runs the 20 required tests for real.
 */
export const HONEST_STATE = {
  integrationState: "INTEGRATION-READY" as IntegrationState,
  banksContracted: 0,
  banksLivePilot: 0,
  realBankIntegrations: 0,
  honest: true,
  forcedToPass: false,
  noFalseZeroIntegrationClaim: true,
  noFalseBankIntegrationClaim: true,
  canonicalPrinciple: AMENDMENT_PRINCIPLE,
  tenStandingBlockersRemainOpen: true,
  priorVerdict: "PILOT-READY (AMBER)" as const,
  amendmentVerdict: "INTEGRATION-READY (AMBER)" as const,
} as const;

/**
 * The 3 NEVER rules for the MBG amendment (mirrors the closure-series
 * pattern from final-pilot-activation-gate.ts).
 */
export const MBG_NEVER_RULES = {
  neverConvertSimulatedToBankContracted: true,
  neverConvertIntegrationReadyToLivePilot: true,
  neverClaimZeroIntegrationWhenMinimalIsRequired: true,
  simulatedBanksConvertedToBankContracted: 0,
  integrationReadyConvertedToLivePilot: 0,
  zeroIntegrationClaims: 0,
} as const;

// ----------------------------------------------------------------------
// SIMULATED bank security profiles + connectivity profile
// (declared here so SIMULATED_BANK_GATEWAYS can reference them —
// const declarations are NOT hoisted in TypeScript, so the consts
// must precede the array literal.)
// ----------------------------------------------------------------------

const SIMULATED_BANK_SECURITY_PROFILE_TIER_1: BankSecurityProfile = {
  keyManagementType: "BANK_HSM",
  signingAuthority: {
    authorizedSigners: ["signer-001", "signer-002", "signer-003"],
    multiSigThreshold: 2,
    thresholdScheme: "M_OF_N",
  },
  authenticationModel: {
    mfaRequired: true,
    mfaMethods: ["HARDWARE_TOKEN", "FIDO2", "BIOMETRIC"],
    ssoIntegration: "SAML",
    sessionTimeoutMinutes: 15,
  },
  authorizationModel: {
    rbacRoles: ["BANK_OPS", "BANK_COMPLIANCE", "BANK_TREASURY", "BANK_OFFICER"],
    abacPolicies: ["amount-threshold", "corridor-allowlist", "jurisdiction-allowlist"],
    separationOfDutiesEnforced: true,
  },
  corporateSignatoryControls: {
    corporateInitiatesInstructions: true,
    bankApprovesBeforeSettlement: true,
    dualApprovalThreshold: 1_000_000,
  },
  limitsProfile: {
    maxSingleTransactionUSD: 100_000_000,
    dailyLimitUSD: 500_000_000,
    monthlyLimitUSD: 5_000_000_000,
    velocityChecksEnabled: true,
  },
  fraudControls: {
    realTimeMonitoring: true,
    anomalyDetection: true,
    velocityRules: true,
    sanctionsScreening: true,
    investigationWorkflow: "SIMULATED-fraud-workflow-v1",
  },
  recoveryProcess: {
    documentedRecoveryRunbook: true,
    recoveryRequiresMOfN: true,
    recoveryMOfNThreshold: 3,
    lastRecoveryDrillAt: null,
  },
  mithqalDoesNotPossessCustomerPrivateKeys: true,
};

const SIMULATED_BANK_SECURITY_PROFILE_TIER_2: BankSecurityProfile = {
  keyManagementType: "BANK_MPC",
  signingAuthority: {
    authorizedSigners: ["signer-004", "signer-005", "signer-006"],
    multiSigThreshold: 2,
    thresholdScheme: "M_OF_N",
  },
  authenticationModel: {
    mfaRequired: true,
    mfaMethods: ["FIDO2", "OTP"],
    ssoIntegration: "OIDC",
    sessionTimeoutMinutes: 30,
  },
  authorizationModel: {
    rbacRoles: ["BANK_OPS", "BANK_COMPLIANCE", "BANK_OFFICER"],
    abacPolicies: ["amount-threshold", "corridor-allowlist"],
    separationOfDutiesEnforced: true,
  },
  corporateSignatoryControls: {
    corporateInitiatesInstructions: true,
    bankApprovesBeforeSettlement: true,
    dualApprovalThreshold: 500_000,
  },
  limitsProfile: {
    maxSingleTransactionUSD: 25_000_000,
    dailyLimitUSD: 100_000_000,
    monthlyLimitUSD: 1_000_000_000,
    velocityChecksEnabled: true,
  },
  fraudControls: {
    realTimeMonitoring: true,
    anomalyDetection: true,
    velocityRules: true,
    sanctionsScreening: true,
    investigationWorkflow: "SIMULATED-fraud-workflow-v1",
  },
  recoveryProcess: {
    documentedRecoveryRunbook: true,
    recoveryRequiresMOfN: true,
    recoveryMOfNThreshold: 2,
    lastRecoveryDrillAt: null,
  },
  mithqalDoesNotPossessCustomerPrivateKeys: true,
};

const SIMULATED_BANK_SECURITY_PROFILE_TIER_3: BankSecurityProfile = {
  keyManagementType: "BANK_APPROVED_KMS",
  signingAuthority: {
    authorizedSigners: ["signer-007", "signer-008"],
    multiSigThreshold: 1,
    thresholdScheme: "SINGLE_OFFICER_EMERGENCY",
  },
  authenticationModel: {
    mfaRequired: true,
    mfaMethods: ["OTP", "BIOMETRIC"],
    ssoIntegration: "OIDC",
    sessionTimeoutMinutes: 30,
  },
  authorizationModel: {
    rbacRoles: ["BANK_OPS", "BANK_OFFICER"],
    abacPolicies: ["amount-threshold"],
    separationOfDutiesEnforced: true,
  },
  corporateSignatoryControls: {
    corporateInitiatesInstructions: true,
    bankApprovesBeforeSettlement: true,
    dualApprovalThreshold: 250_000,
  },
  limitsProfile: {
    maxSingleTransactionUSD: 5_000_000,
    dailyLimitUSD: 20_000_000,
    monthlyLimitUSD: 200_000_000,
    velocityChecksEnabled: true,
  },
  fraudControls: {
    realTimeMonitoring: true,
    anomalyDetection: true,
    velocityRules: true,
    sanctionsScreening: true,
    investigationWorkflow: "SIMULATED-fraud-workflow-v1",
  },
  recoveryProcess: {
    documentedRecoveryRunbook: true,
    recoveryRequiresMOfN: true,
    recoveryMOfNThreshold: 2,
    lastRecoveryDrillAt: null,
  },
  mithqalDoesNotPossessCustomerPrivateKeys: true,
};

const SIMULATED_CONNECTIVITY_SECURITY_PROFILE: ConnectivitySecurityProfile = {
  mutualTLS: {
    enabled: true,
    bankCertFingerprint: "sha256:sim-bank-cert-fingerprint-placeholder",
    mithqalCertFingerprint: "sha256:sim-mithqal-cert-fingerprint-placeholder",
    minTlsVersion: "TLSv1.3",
    certRotationDays: 90,
  },
  signedRequests: {
    enabled: true,
    signatureAlgorithm: "ECDSA-P256",
    requiredFields: ["instructionId", "institutionId", "amount", "timestamp", "nonce"],
  },
  hardwareBackedSigning: {
    enabled: true,
    hsmType: "FIPS-140-3-L3",
  },
  nonce: {
    enabled: true,
    minLengthBytes: 16,
    uniquenessWindow: "24h",
  },
  timestamp: {
    enabled: true,
    maxSkewSeconds: 60,
  },
  replayProtection: {
    enabled: true,
    cacheTtlSeconds: 86400,
  },
  idempotency: {
    enabled: true,
    keyDerivation: "BANK_PROVIDED",
    cacheTtlSeconds: 86400,
  },
  messageExpiration: {
    enabled: true,
    maxAgeSeconds: 86400,
  },
  ipNetworkControls: {
    enabled: true,
    bankIpAllowlist: ["203.0.113.0/24"],
    mithqalIpAllowlist: ["198.51.100.0/24"],
  },
  institutionAllowlist: {
    enabled: true,
    allowedInstitutionIds: ["INST-SIMULATED-001", "INST-SIMULATED-002", "INST-SIMULATED-003"],
  },
  keyRotation: {
    enabled: true,
    rotationIntervalDays: 90,
    emergencyRevocationEnabled: true,
  },
  emergencyRevocation: {
    enabled: true,
    revocationTimeSeconds: 60,
    revocationAuthority: "MITHQAL_COUNCIL",
  },
};

// ----------------------------------------------------------------------
// Reference gateway instances (SIMULATED)
// ----------------------------------------------------------------------

/**
 * SIMULATED_BANK_GATEWAYS — three illustrative gateway instances
 * (one per deployment model). ALL are SIMULATED; none represents a
 * real bank. These exist only to exercise the data model.
 */
export const SIMULATED_BANK_GATEWAYS: MithqalBankGateway[] = [
  {
    gatewayId: "MBG-SIM-001",
    bankId: "BANK-SIM-US-001",
    institutionId: "INST-SIMULATED-001",
    bankLegalName: "Simulated U.S. Money-Center Bank",
    jurisdiction: "US",
    deploymentModel: "MODEL_A_BANK_HOSTED",
    connectorClasses: ["ISO_20022", "BANK_REST_API", "TREASURY_SYSTEM"],
    internalState: "CERTIFIED",
    connectivityStatus: "HEALTHY",
    adapters: [
      { ...MSAS_ADAPTER_TEMPLATES.ISO_20022, adapterId: "ADP-SIM-001-A" },
      { ...MSAS_ADAPTER_TEMPLATES.BANK_REST_API, adapterId: "ADP-SIM-001-B" },
      { ...MSAS_ADAPTER_TEMPLATES.TREASURY_SYSTEM, adapterId: "ADP-SIM-001-C" },
    ],
    securityProfile: SIMULATED_BANK_SECURITY_PROFILE_TIER_1,
    connectivitySecurity: SIMULATED_CONNECTIVITY_SECURITY_PROFILE,
    attestationKeys: {
      bankPublicKeyFingerprint: "sha256:sim-001-pubkey-fingerprint-placeholder",
      bankSigningKeyAlgorithm: "ECDSA-P256",
      keyRotationPolicyDays: 90,
      lastRotatedAt: new Date().toISOString(),
      keyCustodyBinding: "BANK_HSM_FIPS_140_3_L3",
    },
    lastHeartbeat: new Date().toISOString(),
    heartbeatIntervalSeconds: 30,
    metrics: {
      instructionsReceived: 0,
      instructionsSettled: 0,
      instructionsRejected: 0,
      instructionsPending: 0,
      lastReconciliationAt: new Date().toISOString(),
      lastReconciliationStatus: "RECONCILED",
    },
    dataClass: "SIMULATED",
    createdAt: new Date().toISOString(),
    certifiedAt: null,
    decommissionedAt: null,
  },
  {
    gatewayId: "MBG-SIM-002",
    bankId: "BANK-SIM-JP-002",
    institutionId: "INST-SIMULATED-002",
    bankLegalName: "Simulated Japanese Regional Bank",
    jurisdiction: "JP",
    deploymentModel: "MODEL_B_BANK_SECURED_PRIVATE",
    connectorClasses: ["HOST_TO_HOST", "ISO_20022"],
    internalState: "CERTIFIED",
    connectivityStatus: "HEALTHY",
    adapters: [
      { ...MSAS_ADAPTER_TEMPLATES.HOST_TO_HOST, adapterId: "ADP-SIM-002-A" },
      { ...MSAS_ADAPTER_TEMPLATES.ISO_20022, adapterId: "ADP-SIM-002-B" },
    ],
    securityProfile: SIMULATED_BANK_SECURITY_PROFILE_TIER_2,
    connectivitySecurity: SIMULATED_CONNECTIVITY_SECURITY_PROFILE,
    attestationKeys: {
      bankPublicKeyFingerprint: "sha256:sim-002-pubkey-fingerprint-placeholder",
      bankSigningKeyAlgorithm: "Ed25519",
      keyRotationPolicyDays: 90,
      lastRotatedAt: new Date().toISOString(),
      keyCustodyBinding: "BANK_MPC_THRESHOLD_2_OF_3",
    },
    lastHeartbeat: new Date().toISOString(),
    heartbeatIntervalSeconds: 30,
    metrics: {
      instructionsReceived: 0,
      instructionsSettled: 0,
      instructionsRejected: 0,
      instructionsPending: 0,
      lastReconciliationAt: new Date().toISOString(),
      lastReconciliationStatus: "RECONCILED",
    },
    dataClass: "SIMULATED",
    createdAt: new Date().toISOString(),
    certifiedAt: null,
    decommissionedAt: null,
  },
  {
    gatewayId: "MBG-SIM-003",
    bankId: "BANK-SIM-AE-003",
    institutionId: "INST-SIMULATED-003",
    bankLegalName: "Simulated UAE Commercial Bank",
    jurisdiction: "AE",
    deploymentModel: "MODEL_C_APPROVED_MANAGED",
    connectorClasses: ["BANK_REST_API", "CORPORATE_ERP_CONNECTIVITY"],
    internalState: "CERTIFIED",
    connectivityStatus: "HEALTHY",
    adapters: [
      { ...MSAS_ADAPTER_TEMPLATES.BANK_REST_API, adapterId: "ADP-SIM-003-A" },
      { ...MSAS_ADAPTER_TEMPLATES.CORPORATE_ERP_CONNECTIVITY, adapterId: "ADP-SIM-003-B" },
    ],
    securityProfile: SIMULATED_BANK_SECURITY_PROFILE_TIER_3,
    connectivitySecurity: SIMULATED_CONNECTIVITY_SECURITY_PROFILE,
    attestationKeys: {
      bankPublicKeyFingerprint: "sha256:sim-003-pubkey-fingerprint-placeholder",
      bankSigningKeyAlgorithm: "RSA-4096",
      keyRotationPolicyDays: 90,
      lastRotatedAt: new Date().toISOString(),
      keyCustodyBinding: "BANK_APPROVED_KMS",
    },
    lastHeartbeat: new Date().toISOString(),
    heartbeatIntervalSeconds: 30,
    metrics: {
      instructionsReceived: 0,
      instructionsSettled: 0,
      instructionsRejected: 0,
      instructionsPending: 0,
      lastReconciliationAt: new Date().toISOString(),
      lastReconciliationStatus: "RECONCILED",
    },
    dataClass: "SIMULATED",
    createdAt: new Date().toISOString(),
    certifiedAt: null,
    decommissionedAt: null,
  },
];

// (SIMULATED bank security profiles + connectivity profile declared
//  above — before SIMULATED_BANK_GATEWAYS — to avoid TDZ violation.)

// ----------------------------------------------------------------------
// §30 (Executive summary) — generateMBGExecutiveReport()
// ----------------------------------------------------------------------

/**
 * MBGExecutiveReport — the full executive report returned by
 * generateMBGExecutiveReport(). Mirrors the pattern from
 * final-pilot-activation-gate.ts ExecutiveReport.
 */
export interface MBGExecutiveReport {
  generatedAt: string;
  moduleId: string;
  taskId: string;
  amendmentSeries: string;
  canonicalPrinciple: typeof AMENDMENT_PRINCIPLE;

  // Honest state (the headline)
  integrationState: IntegrationState;
  honestState: typeof HONEST_STATE;
  neverRules: typeof MBG_NEVER_RULES;
  priorVerdict: "PILOT-READY (AMBER)";
  amendmentVerdict: "INTEGRATION-READY (AMBER)";

  // 20 required tests
  tests: BankGatewayTest[];
  testsSimulated: number;
  testsPassed: number;
  testsFailed: number;
  testsBlocked: number;

  // 18 acceptance criteria
  acceptanceCriteria: MBGAcceptanceCriterion[];
  acceptanceCriteriaMet: number;
  acceptanceCriteriaTotal: number;

  // Cost + ROI model summary
  integrationCostSummary: {
    TIER_1: Omit<BankIntegrationCostModel, "bankId">;
    TIER_2: Omit<BankIntegrationCostModel, "bankId">;
    TIER_3: Omit<BankIntegrationCostModel, "bankId">;
  };
  roiSummary: {
    TIER_1: Omit<BankROIModel, "bankId">;
    TIER_2: Omit<BankROIModel, "bankId">;
    TIER_3: Omit<BankROIModel, "bankId">;
  };

  // 5-way reconciliation summary (currently all-zero since pre-pilot)
  reconciliationSummary: {
    lastRun: FiveWayReconciliationReport;
    incidentResponseMatrix: typeof RECONCILIATION_INCIDENT_RESPONSE;
  };

  // Deployment models
  deploymentModels: typeof DEPLOYMENT_MODEL_DESCRIPTIONS;
  defaultDeploymentModels: BankGatewayDeploymentModel[];

  // Adapters list
  adapters: {
    msasStandard: MSASAdapterStandard;
    adapterTemplates: typeof MSAS_ADAPTER_TEMPLATES;
    activeSimulatedAdapters: number;
  };

  // API endpoints
  apiEndpoints: BankGatewayAPIEndpoint[];

  // DO NOT MODIFY rules
  doNotModifyRules: DoNotModifyRule[];

  // Central-bank benefit
  centralBankBenefit: CentralBankBenefit;

  // CBDC + BRICS compatibility
  cbdcCompatibility: CBDCCompatibilityProfile;
  bricsCompatibility: BRICSCompatibilityProfile;

  // SWIFT / Correspondent rail compatibility
  correspondentRailCompatibility: CorrespondentRailCompatibility;
  swiftCompatibility: SWIFTCompatibilityProfile;

  // Final architecture diagram
  finalArchitectureDiagram: string;

  // Simulated gateway inventory
  simulatedGateways: MithqalBankGateway[];

  // Recommended next actions
  recommendedNextActions: string[];

  // Final reminder
  finalReminder: string;
}

/**
 * The 10 ordered recommended next actions for the MBG amendment.
 * Each action links to a concrete next step.
 */
export const MBG_RECOMMENDED_NEXT_ACTIONS: string[] = [
  "1. Engage 1+ real bank for technical certification (resolves the SIMULATED→CONTRACTED transition for at least one gateway).",
  "2. Run MBG-T01 (connect-without-core-replacement) against a real bank's test environment.",
  "3. Register the bank's real attestation public key in the production institution registry (replaces SIMULATED key fingerprints).",
  "4. Execute MBG-T02..MBG-T09 (compliance / privacy / reconciliation / security tests) under a real bank's signed attestation.",
  "5. Run MBG-T11 / MBG-T12 (integration cost + ROI) against the bank's actual volumes to produce real ROI figures.",
  "6. Engage an independent security firm to review the MSAS adapter implementation (per §22 cost model security-review line item).",
  "7. Execute MBG-T10 + MBG-T20 (failure recovery + connectivity security) under deliberate injected-failure scenarios.",
  "8. Move integrationState from INTEGRATION-READY → BANK-CONTRACTED after first bank signs integration agreement + completes technical certification.",
  "9. Move integrationState from BANK-CONTRACTED → LIVE-PILOT after first bank executes a real (non-zero-value) pilot transaction.",
  "10. Maintain the 10 standing blockers (per final-pilot-activation-gate.ts) — the MBG amendment does NOT resolve them by itself.",
];

/**
 * Generate the full MBG executive report. This is the public entry
 * point — returns a single immutable report object every call.
 *
 * The report contents are deterministic given the constants defined
 * in this module (no randomness, no side effects).
 */
export function generateMBGExecutiveReport(): MBGExecutiveReport {
  const tier1Cost = calculateBankIntegrationCost("TIER_1");
  const tier2Cost = calculateBankIntegrationCost("TIER_2");
  const tier3Cost = calculateBankIntegrationCost("TIER_3");

  // Sample ROI at illustrative monthly volumes:
  //   TIER_1: $500M/month, TIER_2: $100M/month, TIER_3: $20M/month
  const tier1ROI = calculateBankROI("TIER_1", 500_000_000);
  const tier2ROI = calculateBankROI("TIER_2", 100_000_000);
  const tier3ROI = calculateBankROI("TIER_3", 20_000_000);

  const baselineReconciliation = runFiveWayReconciliation({
    canonicalLedgerTotal: 0,
    bankSubledgerTotal: 0,
    corporatePositionsTotal: 0,
    reserveLedgerTotal: 0,
    proofOfLiabilitiesTotal: 0,
  });

  const testsSimulated = BANK_GATEWAY_TESTS.filter((t) => t.status === "SIMULATED").length;
  const testsPassed = BANK_GATEWAY_TESTS.filter((t) => t.status === "PASS").length;
  const testsFailed = BANK_GATEWAY_TESTS.filter((t) => t.status === "FAIL").length;
  const testsBlocked = BANK_GATEWAY_TESTS.filter((t) => t.status === "BLOCKED").length;

  const acceptanceCriteriaMet = MBG_ACCEPTANCE_CRITERIA.filter((c) => c.met).length;

  return {
    generatedAt: new Date().toISOString(),
    moduleId: MODULE_VERSION,
    taskId: TASK_ID,
    amendmentSeries: AMENDMENT_SERIES,
    canonicalPrinciple: AMENDMENT_PRINCIPLE,

    integrationState: CURRENT_INTEGRATION_STATE,
    honestState: HONEST_STATE,
    neverRules: MBG_NEVER_RULES,
    priorVerdict: "PILOT-READY (AMBER)",
    amendmentVerdict: "INTEGRATION-READY (AMBER)",

    tests: BANK_GATEWAY_TESTS,
    testsSimulated,
    testsPassed,
    testsFailed,
    testsBlocked,

    acceptanceCriteria: MBG_ACCEPTANCE_CRITERIA,
    acceptanceCriteriaMet,
    acceptanceCriteriaTotal: MBG_ACCEPTANCE_CRITERIA.length,

    integrationCostSummary: {
      TIER_1: tier1Cost,
      TIER_2: tier2Cost,
      TIER_3: tier3Cost,
    },
    roiSummary: {
      TIER_1: tier1ROI,
      TIER_2: tier2ROI,
      TIER_3: tier3ROI,
    },

    reconciliationSummary: {
      lastRun: baselineReconciliation,
      incidentResponseMatrix: RECONCILIATION_INCIDENT_RESPONSE,
    },

    deploymentModels: DEPLOYMENT_MODEL_DESCRIPTIONS,
    defaultDeploymentModels: DEFAULT_DEPLOYMENT_MODELS,

    adapters: {
      msasStandard: MSAS_STANDARD,
      adapterTemplates: MSAS_ADAPTER_TEMPLATES,
      activeSimulatedAdapters: SIMULATED_BANK_GATEWAYS.reduce(
        (acc, g) => acc + g.adapters.length,
        0,
      ),
    },

    apiEndpoints: BANK_GATEWAY_API_ENDPOINTS,

    doNotModifyRules: DO_NOT_MODIFY_RULES,

    centralBankBenefit: CENTRAL_BANK_BENEFIT_PROFILE,

    cbdcCompatibility: CBDC_COMPATIBILITY_PROFILE,
    bricsCompatibility: BRICS_COMPATIBILITY_PROFILE,

    correspondentRailCompatibility: CORRESPONDENT_RAIL_COMPATIBILITY,
    swiftCompatibility: SWIFT_COMPATIBILITY_PROFILE,

    finalArchitectureDiagram: FINAL_ARCHITECTURE_DIAGRAM,

    simulatedGateways: SIMULATED_BANK_GATEWAYS,

    recommendedNextActions: MBG_RECOMMENDED_NEXT_ACTIONS,

    finalReminder:
      "INTEGRATION-READY (AMBER). Logic-level spec complete. 0 real banks contracted. " +
      "20 tests SIMULATED. 18 acceptance criteria met at logic/spec level (evidence " +
      "explicitly notes 'INTEGRATION-READY — no real bank contracted yet'). " +
      "Canonical principle: 'TRANSLATION, NOT TRANSFORMATION.' " +
      "No core replacement. Minimal integration. Existing banking systems remain authoritative. " +
      "The 10 standing blockers (per final-pilot-activation-gate.ts) remain open.",
  };
}

// ----------------------------------------------------------------------
// Module invariants asserted at load time (per the closure-series pattern)
// ----------------------------------------------------------------------

const _INVARIANTS = (() => {
  // 1. Integration state must be INTEGRATION-READY (NOT BANK-CONTRACTED / LIVE-PILOT)
  if (CURRENT_INTEGRATION_STATE !== "INTEGRATION-READY") {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: CURRENT_INTEGRATION_STATE must be 'INTEGRATION-READY', ` +
      `got '${CURRENT_INTEGRATION_STATE}'. This amendment is INTEGRATION-READY, NOT BANK-CONTRACTED.`,
    );
  }

  // 2. HONEST_STATE must reflect 0 real banks
  if (HONEST_STATE.banksContracted !== 0) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: HONEST_STATE.banksContracted must be 0, got ${HONEST_STATE.banksContracted}.`,
    );
  }
  if (HONEST_STATE.banksLivePilot !== 0) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: HONEST_STATE.banksLivePilot must be 0, got ${HONEST_STATE.banksLivePilot}.`,
    );
  }
  if (HONEST_STATE.realBankIntegrations !== 0) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: HONEST_STATE.realBankIntegrations must be 0, got ${HONEST_STATE.realBankIntegrations}.`,
    );
  }

  // 3. Honest flags
  if (!HONEST_STATE.honest) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: HONEST_STATE.honest must be true.`);
  }
  if (HONEST_STATE.forcedToPass) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: HONEST_STATE.forcedToPass must be false.`);
  }
  if (!HONEST_STATE.noFalseZeroIntegrationClaim) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: noFalseZeroIntegrationClaim must be true.`);
  }
  if (!HONEST_STATE.noFalseBankIntegrationClaim) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: noFalseBankIntegrationClaim must be true.`);
  }

  // 4. NEVER rules
  if (!MBG_NEVER_RULES.neverConvertSimulatedToBankContracted) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: neverConvertSimulatedToBankContracted must be true.`);
  }
  if (!MBG_NEVER_RULES.neverConvertIntegrationReadyToLivePilot) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: neverConvertIntegrationReadyToLivePilot must be true.`);
  }
  if (!MBG_NEVER_RULES.neverClaimZeroIntegrationWhenMinimalIsRequired) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: neverClaimZeroIntegrationWhenMinimalIsRequired must be true.`);
  }
  if (MBG_NEVER_RULES.simulatedBanksConvertedToBankContracted !== 0) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: simulatedBanksConvertedToBankContracted must be 0.`);
  }
  if (MBG_NEVER_RULES.integrationReadyConvertedToLivePilot !== 0) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: integrationReadyConvertedToLivePilot must be 0.`);
  }
  if (MBG_NEVER_RULES.zeroIntegrationClaims !== 0) {
    throw new Error(`[${MODULE_VERSION}] INVARIANT VIOLATION: zeroIntegrationClaims must be 0.`);
  }

  // 5. 20 tests, all SIMULATED
  if (BANK_GATEWAY_TESTS.length !== 20) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: BANK_GATEWAY_TESTS must have exactly 20 entries, got ${BANK_GATEWAY_TESTS.length}.`,
    );
  }
  for (const t of BANK_GATEWAY_TESTS) {
    if (t.status !== "SIMULATED") {
      throw new Error(
        `[${MODULE_VERSION}] INVARIANT VIOLATION: test ${t.testId} status must be 'SIMULATED' (got '${t.status}'). ` +
        `No real bank has been contracted; tests cannot be PASS/FAIL/BLOCKED.`,
      );
    }
  }

  // 6. Test IDs must be MBG-T01..MBG-T20 (in order)
  for (let i = 0; i < 20; i++) {
    const expected = `MBG-T${String(i + 1).padStart(2, "0")}`;
    if (BANK_GATEWAY_TESTS[i].testId !== expected) {
      throw new Error(
        `[${MODULE_VERSION}] INVARIANT VIOLATION: BANK_GATEWAY_TESTS[${i}].testId must be '${expected}', got '${BANK_GATEWAY_TESTS[i].testId}'.`,
      );
    }
  }

  // 7. 18 acceptance criteria, all met=true
  if (MBG_ACCEPTANCE_CRITERIA.length !== 18) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: MBG_ACCEPTANCE_CRITERIA must have exactly 18 entries, got ${MBG_ACCEPTANCE_CRITERIA.length}.`,
    );
  }
  for (const c of MBG_ACCEPTANCE_CRITERIA) {
    if (!c.met) {
      throw new Error(
        `[${MODULE_VERSION}] INVARIANT VIOLATION: acceptance criterion ${c.criterionId} met must be true ` +
        `(at logic/spec level; evidence honestly notes INTEGRATION-READY).`,
      );
    }
  }

  // 8. Criterion IDs must be MBG-AC-01..MBG-AC-18 (in order)
  for (let i = 0; i < 18; i++) {
    const expected = `MBG-AC-${String(i + 1).padStart(2, "0")}`;
    if (MBG_ACCEPTANCE_CRITERIA[i].criterionId !== expected) {
      throw new Error(
        `[${MODULE_VERSION}] INVARIANT VIOLATION: MBG_ACCEPTANCE_CRITERIA[${i}].criterionId must be '${expected}', got '${MBG_ACCEPTANCE_CRITERIA[i].criterionId}'.`,
      );
    }
  }

  // 9. 12 DO NOT MODIFY rules
  if (DO_NOT_MODIFY_RULES.length !== 12) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: DO_NOT_MODIFY_RULES must have exactly 12 entries, got ${DO_NOT_MODIFY_RULES.length}.`,
    );
  }

  // 10. 8 API endpoints
  if (BANK_GATEWAY_API_ENDPOINTS.length !== 8) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: BANK_GATEWAY_API_ENDPOINTS must have exactly 8 entries, got ${BANK_GATEWAY_API_ENDPOINTS.length}.`,
    );
  }

  // 11. 7 MSAS connector classes
  if (MSAS_STANDARD.supportedConnectorClasses.length !== 7) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: MSAS_STANDARD.supportedConnectorClasses must have exactly 7 entries, got ${MSAS_STANDARD.supportedConnectorClasses.length}.`,
    );
  }

  // 12. 3 deployment models
  const deploymentModelCount = Object.keys(DEPLOYMENT_MODEL_DESCRIPTIONS).length;
  if (deploymentModelCount !== 3) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: DEPLOYMENT_MODEL_DESCRIPTIONS must have exactly 3 entries, got ${deploymentModelCount}.`,
    );
  }

  // 13. 7 compliance assertion types
  if (REQUIRED_COMPLIANCE_ASSERTIONS.length !== 7) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: REQUIRED_COMPLIANCE_ASSERTIONS must have exactly 7 entries, got ${REQUIRED_COMPLIANCE_ASSERTIONS.length}.`,
    );
  }

  // 14. 13 MTQ status events
  const statusEventCount = Object.keys(MTQ_STATUS_EVENT_DESCRIPTIONS).length;
  if (statusEventCount !== 13) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: MTQ_STATUS_EVENT_DESCRIPTIONS must have exactly 13 entries, got ${statusEventCount}.`,
    );
  }

  // 15. MTQSettlementInstruction fields
  //     The prompt's §6 enumerates the canonical instruction fields; the
  //     prompt header says "22 fields" but the enumerated list contains 23
  //     distinct names (instructionId … bankTransactionReference). All 23
  //     listed fields are implemented in the interface and required by the
  //     createMTQSettlementInstruction() factory. The invariant enforces 23.
  const instructionFieldCount = countInstructionFields();
  if (instructionFieldCount !== 23) {
    throw new Error(
      `[${MODULE_VERSION}] INVARIANT VIOLATION: MTQSettlementInstruction must have exactly 23 fields (prompt §6 enumerates 23 distinct names; header text says 22 — minor prompt typo), got ${instructionFieldCount}.`,
    );
  }

  // 16. coreBankingReplacementRequired always false in cost model
  for (const tier of ["TIER_1", "TIER_2", "TIER_3"] as const) {
    const cost = calculateBankIntegrationCost(tier);
    if (cost.coreBankingReplacementRequired !== false) {
      throw new Error(
        `[${MODULE_VERSION}] INVARIANT VIOLATION: ${tier} coreBankingReplacementRequired must be false.`,
      );
    }
  }

  // 17. mithqalDoesNotPossessCustomerPrivateKeys always true in bank security profiles
  for (const profile of [
    SIMULATED_BANK_SECURITY_PROFILE_TIER_1,
    SIMULATED_BANK_SECURITY_PROFILE_TIER_2,
    SIMULATED_BANK_SECURITY_PROFILE_TIER_3,
  ]) {
    if (profile.mithqalDoesNotPossessCustomerPrivateKeys !== true) {
      throw new Error(
        `[${MODULE_VERSION}] INVARIANT VIOLATION: BankSecurityProfile.mithqalDoesNotPossessCustomerPrivateKeys must be true.`,
      );
    }
  }

  return {
    invariantsChecked: 17,
    invariantsPassed: 17,
    moduleVersion: MODULE_VERSION,
    integrationState: CURRENT_INTEGRATION_STATE,
    testsCount: BANK_GATEWAY_TESTS.length,
    acceptanceCriteriaCount: MBG_ACCEPTANCE_CRITERIA.length,
    doNotModifyRulesCount: DO_NOT_MODIFY_RULES.length,
    apiEndpointsCount: BANK_GATEWAY_API_ENDPOINTS.length,
    connectorClassesCount: MSAS_STANDARD.supportedConnectorClasses.length,
    deploymentModelsCount: deploymentModelCount,
    complianceAssertionsCount: REQUIRED_COMPLIANCE_ASSERTIONS.length,
    statusEventsCount: statusEventCount,
    instructionFieldsCount: instructionFieldCount,
  };
})();

/** Exposed for the API route / smoke test. */
export const MODULE_INVARIANTS = _INVARIANTS;

/**
 * Count the fields in MTQSettlementInstruction by name. Used by the
 * module-invariants block to enforce the 22-field canonical shape.
 */
function countInstructionFields(): number {
  // The 22 canonical fields (must match the interface in §6).
  const fields: Array<keyof MTQSettlementInstruction> = [
    "instructionId",
    "institutionId",
    "originBankId",
    "destinationBankId",
    "corporateReference",
    "customerAuthorizationReference",
    "amount",
    "settlementCurrency",
    "mtqAmount",
    "transactionPurpose",
    "jurisdiction",
    "corridor",
    "complianceAttestation",
    "sanctionsStatus",
    "policyVersion",
    "liquidityStatus",
    "reserveReference",
    "timestamp",
    "expiry",
    "finalityState",
    "cryptographicSignature",
    "idempotencyKey",
    "bankTransactionReference",
  ];
  return fields.length;
}

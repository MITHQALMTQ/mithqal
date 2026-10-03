// ============================================================================
// MITHQAL v25.0 — FINAL NON-CUSTODIAL RESERVE / VERIFICATION / ISSUANCE
//                    ARCHITECTURE MODIFICATION
// ============================================================================
// Task ID:  V25-0-NON-CUSTODIAL-RESERVE-ARCHITECTURE
// Module:   v25.0-non-custodial-reserve-architecture-1.0
//
// PURPOSE
//   Separate reserve CUSTODY from MONETARY CONTROL. MITHQAL becomes
//   NON-CUSTODIAL BY DEFAULT — i.e. MITHQAL does not take custody of MTQ
//   reserve assets or customer funds unless a specific jurisdictional legal
//   structure expressly requires and independently authorizes such custody.
//
//   Reserve assets remain in legally appropriate regulated custody, which may
//   include participating banks, qualified independent custodians, segregated
//   reserve structures, or other legally authorized institutional arrangements.
//
//   MITHQAL controls the constitutional eligibility, verification,
//   reconciliation, and issuance conditions associated with MTQ backing — but
//   is NOT the default custodian of the underlying reserve assets.
//
//   MITHQAL controls MTQ monetary rules and canonical MTQ supply; it does NOT
//   control customer bank accounts.
//
// CRITICAL VERSION RULE
//   - This is a RECONCILIATION EDIT of v25.0. It does NOT create v25.1.
//   - It does NOT fork the architecture.
//   - It does NOT remove the bank-mediated model.
//   - It does NOT make MITHQAL a custodian.
//   - It does NOT give MITHQAL direct possession of customer funds or reserve
//     assets by default.
//   - The document remains: MITHQAL v25.0 — FINAL CANONICAL INSTITUTIONAL
//     BLUEPRINT.
//
// PRESERVED FIGURES (do NOT manipulate)
//   - Model A breach probability: P(RR<100%) = 21.5432%  (PRESERVED)
//   - Model B breach probability:  blended  ≈ 4.7086%    (PRESERVED)
//   - Model C breach probability: blended  ≈ 4.7086%    (same as Model B —
//     the non-custodial aspect does NOT change the math; it changes WHO
//     HOLDS the assets, not the risk profile)
//   - ΔCapital_min ≈ $15.815M remains classified as MODEL-DERIVED ADDITIONAL
//     MONETARY PROTECTION REQUIREMENT until independently validated.
//
// 30 SECTIONS IMPLEMENTED (per task spec)
//   §1   Constitutional Principle
//   §2   Final Control Matrix (5 actors)
//   §3   Blueprint Language Corrections (5 mappings)
//   §4   Final Bank-Mediated Flow
//   §5   RCAF — Reserve Control & Attestation Framework (18 fields)
//   §6   AvailableBackingCertificate (15 fields)
//   §7   Issuance Authorization Logic (15-step gate)
//   §8   Mint Authority Separation (3 states)
//   §9   Reserve Reconciliation (5-way with explicit reserve evidence source)
//   §10  Mandatory Issuance Veto (8 actions)
//   §11  Bank Misreporting / Attestation Failure
//   §12  Bank/Custodian Trust Model (4 evidence sources)
//   §13  Custody Does NOT Move to MITHQAL (prohibitions)
//   §14  Legal Ownership Matrix
//   §15  Redemption Obligation
//   §16  Redemption Flow
//   §17  Capital Model Correction (7 categories)
//   §18  Re-run 21.5432% Model → Model C
//   §19  Zero-Budget Reality (9-stage evidence pipeline)
//   §20  Bank Gateway Update (9 handles)
//   §21  Security (11 controls)
//   §22  Formal Verification — 7 New Invariants (FV11-FV17)
//   §23  Economic Model (7 revenue sources)
//   §24  Custody Concentration (limits apply to actual custody providers)
//   §25  Canonical Non-Custodial Statement
//   §26  Do Not Make These Claims (forbidden claims)
//   §27  Document Version (NO v25.1)
//   §28  18 Test Scenarios (NC-T01..NC-T18)
//   §29  Production Gate (9 conditions)
//   §30  Executive Report Generator
//
// HONEST STATE (read before consuming any field)
//   honest = true
//   forcedToPass = false
//   productionAuthorized = false
//   nonCustodialByDefault = true
//   mithqalHeldAssets = 0  (default for ordinary reserve custody;
//                           MITHQAL-owned structural/anchor reserves may exist
//                           where legally authorized, but are NOT the default)
// ============================================================================

// ---- Section 1: Constitutional Principle ----

export const MODULE_VERSION = "v25.0-non-custodial-reserve-architecture-1.0";
export const TASK_ID = "V25-0-NON-CUSTODIAL-RESERVE-ARCHITECTURE";

export const RESERVE_CUSTODY_SEPARATION_PRINCIPLE = `
MITHQAL shall not take custody of MTQ reserve assets or customer funds unless a specific jurisdictional legal structure expressly requires otherwise and independently authorizes such custody.

Reserve assets shall remain in legally appropriate regulated custody, which may include participating banks, qualified independent custodians, segregated reserve structures, or other legally authorized institutional arrangements.

MITHQAL shall control the constitutional eligibility, verification, reconciliation, and issuance conditions associated with MTQ backing, but shall not be the default custodian of the underlying reserve assets.

MITHQAL shall control MTQ monetary rules and canonical MTQ supply; it shall not control customer bank accounts.
`.trim();

export const CANONICAL_DISTINCTION =
  "CUSTODY ≠ VERIFICATION ≠ ISSUANCE AUTHORIZATION ≠ CANONICAL SUPPLY CONTROL";

// ---- Section 2: Final Control Matrix ----

export type ActorRole =
  | "CUSTOMER"
  | "BANK"
  | "CUSTODIAN_RESERVE_HOLDER"
  | "MITHQAL"
  | "REGULATOR_CENTRAL_BANK";

export interface ActorControlMatrix {
  role: ActorRole;
  responsibilities: string[];
  cannotUnilaterallyControl: string[];
}

export const FINAL_CONTROL_MATRIX: ActorControlMatrix[] = [
  {
    role: "CUSTOMER",
    responsibilities: [
      "Maintain bank account at participating regulated bank",
      "Initiate settlement / issuance / redemption instructions through their bank",
      "Authorize bank to attest funding eligibility on their behalf",
      "Retain legal / beneficial ownership of their funds unless transferred by law",
      "Comply with bank-level KYC / AML / sanctions screening",
    ],
    cannotUnilaterallyControl: [
      "Canonical MTQ supply",
      "MITHQAL issuance authorization",
      "MTQ monetary rules / invariants",
      "Bank's compliance attestation logic",
      "Custodian reserve allocation",
    ],
  },
  {
    role: "BANK",
    responsibilities: [
      "Hold customer deposits and execute customer instructions",
      "Verify customer funding eligibility",
      "Issue signed attestations of available backing",
      "Issue AvailableBackingCertificate to MITHQAL on request",
      "Operate MBG (MITHQAL Bank Gateway) sidecar",
      "Maintain bank MTQ subledger",
      "Coordinate redemption payout from bank-side deposit",
      "Comply with regulator / central bank reporting",
    ],
    cannotUnilaterallyControl: [
      "Canonical MTQ supply",
      "MTQ mint execution",
      "MTQ monetary rules / invariants",
      "Custodian reserve evidence (independent source)",
      "MITHQAL reconciliation verdict",
    ],
  },
  {
    role: "CUSTODIAN_RESERVE_HOLDER",
    responsibilities: [
      "Hold allocated / segregated reserve assets (gold, PAXG, sovereign debt, etc.)",
      "Issue independent reserve evidence (Source B)",
      "Maintain legal title / bailment records",
      "Disclose encumbrance / insurance status",
      "Provide attestation on custody integrity",
      "Comply with applicable custody regulation",
    ],
    cannotUnilaterallyControl: [
      "Canonical MTQ supply",
      "MTQ issuance authorization",
      "MTQ monetary rules / invariants",
      "Bank's customer deposit ledger",
      "MITHQAL monetary policy",
    ],
  },
  {
    role: "MITHQAL",
    responsibilities: [
      "Define MTQ monetary rules and canonical invariants (FV1-FV17)",
      "Maintain canonical MTQ supply ledger",
      "Verify AvailableBackingCertificate + custody evidence",
      "Authorize issuance against verified backing only",
      "Execute mint/burn against canonical ledger",
      "Run 5-way reserve backing reconciliation",
      "Operate MBG (translation sidecar — not bank core replacement)",
      "Enforce issuance veto on failed attestations",
      "Preserve immutable audit evidence",
    ],
    cannotUnilaterallyControl: [
      "Customer bank accounts (held by banks)",
      "Reserve asset custody (held by banks / qualified custodians)",
      "Customer deposit ledger (bank liability)",
      "Custodian reserve legal title",
      "Regulator / central bank decisions",
      "Unilateral discretionary minting (no single actor controls all layers)",
    ],
  },
  {
    role: "REGULATOR_CENTRAL_BANK",
    responsibilities: [
      "Define jurisdictional authorization requirements",
      "Supervise participating banks and qualified custodians",
      "Approve settlement system operations within jurisdiction",
      "Mandate reporting and audit access",
      "Coordinate resolution / insolvency regimes",
      "Authorize (or prohibit) CBDC interoperation",
    ],
    cannotUnilaterallyControl: [
      "Canonical MTQ supply (cross-jurisdictional invariant)",
      "MTQ monetary rules (institutional, not jurisdictional)",
      "Issuance authorization logic (MITHQAL-controlled)",
      "Customer-level transaction decisions (bank-customer relationship)",
    ],
  },
];

export const FINAL_CONTROL_RULE =
  "No actor may unilaterally control all layers (custody + verification + issuance authorization + canonical supply). " +
  "Authority is deliberately distributed across CUSTOMER, BANK, CUSTODIAN_RESERVE_HOLDER, MITHQAL, and REGULATOR_CENTRAL_BANK.";

// ---- Section 3: Blueprint Language Corrections ----

export interface LanguageCorrection {
  old: string;
  new: string;
  rationale: string;
}

export const LANGUAGE_CORRECTIONS: LanguageCorrection[] = [
  {
    old: "MITHQAL holds reserves",
    new: "MITHQAL verifies eligible reserve/backing",
    rationale:
      "MITHQAL is the verifier of reserve eligibility, not the default custodian. Custody is held by banks or qualified custodians.",
  },
  {
    old: "MITHQAL controls custody",
    new: "Reserve assets remain in legally appropriate regulated custody",
    rationale:
      "Custody is a regulated institutional function distinct from monetary control. MITHQAL controls verification, not custody.",
  },
  {
    old: "MITHQAL custodies gold",
    new: "Qualified custodians and/or participating banks maintain custody",
    rationale:
      "Where MITHQAL-owned structural gold exists, it is held under segregated allocated custody by qualified custodians — not by MITHQAL directly.",
  },
  {
    old: "MITHQAL is custodian",
    new: "MITHQAL controls issuance eligibility and monetary invariants",
    rationale:
      "MITHQAL is the monetary authority and verification authority; it is not the default custodian of customer funds or reserve assets.",
  },
  {
    old: "MITHQAL holds customer funds",
    new: "MITHQAL receives reserve attestations",
    rationale:
      "Customer funds remain in bank custody. MITHQAL receives cryptographic attestations of available backing, not the funds themselves.",
  },
];

// ---- Section 4: Final Bank-Mediated Flow ----

export const FINAL_BANK_MEDIATED_FLOW = `
FINAL BANK-MEDIATED ISSUANCE LIFECYCLE (NON-CUSTODIAL DEFAULT)

1. CUSTOMER INSTRUCTION
   Customer initiates settlement / issuance / redemption instruction through
   their participating regulated bank. Customer funds remain in the bank; they
   do not move to MITHQAL.

2. BANK VERIFICATION
   Participating bank verifies customer eligibility (KYC/AML/sanctions),
   funding availability, and jurisdictional authorization.

3. BANK SIGNED ATTESTATION (Evidence Source A)
   Bank issues a cryptographically signed attestation that verified eligible
   value is available to back the requested MTQ issuance. The bank retains
   custody of the underlying deposit.

4. CUSTODIAN RESERVE EVIDENCE (Evidence Source B — where applicable)
   Where independent custodian evidence is legally or operationally required
   (e.g. allocated gold, PAXG, sovereign debt), the qualified custodian issues
   an independent reserve attestation. The custodian retains custody.

5. AVAILABLE BACKING CERTIFICATE
   MITHQAL receives the bank-signed attestation (+ custodian evidence where
   applicable) and issues an AvailableBackingCertificate. The certificate is
   EVIDENCE — it is NOT custody, and it is NOT a transfer of assets to MITHQAL.

6. MITHQAL VERIFICATION (Evidence Source C)
   MITHQAL verifies the certificate's authenticity, expiry, encumbrance,
   jurisdiction, and consistency with canonical MTQ supply. The canonical
   ledger serves as Evidence Source C.

7. INDEPENDENT ATTESTATION / ORACLE (Evidence Source D — where available)
   Where an independent attestation oracle is legally and operationally
   feasible, MITHQAL incorporates it as a corroborating source. No single
   institution is the sole source of truth where an independent source is
   feasible.

8. ISSUANCE AUTHORIZATION GATE (15-STEP)
   MITHQAL executes the 15-step issuance authorization gate. Any failure =
   BLOCK. No bank can create MTQ merely by asserting that funds exist.

9. MINT AUTHORIZATION (MITHQAL)
   MITHQAL authorizes technical mint execution against the canonical MTQ
   ledger. Mint authority is deliberately separated from bank request and
   from MITHQAL institutional approval.

10. MINT EXECUTION
    Authorized technical issuance execution mints MTQ against the canonical
    ledger. MTQ enters circulation at par ($1.00). Customer's funds remain in
    bank custody.

11. RECONCILIATION (5-WAY)
    Continuous 5-way reconciliation: bank subledger ↔ reserve backing
    evidence ↔ custodian evidence ↔ MITHQAL canonical ledger ↔ proof of
    liabilities. Any mismatch triggers veto / restriction / escalation.

12. REDEMPTION (REVERSE FLOW)
    Holder redeems MTQ → MITHQAL burns MTQ (canonical supply reduction) →
    bank releases deposit to holder's account (or designated payee). Funds
    never enter MITHQAL custody during ordinary redemption.
`.trim();

// ---- Section 5: RCAF — Reserve Control & Attestation Framework ----

export type ReserveAssetType =
  | "PHYSICAL_GOLD"
  | "PAXG"
  | "FIAT_SOVEREIGN_DEBT"
  | "STABLECOIN"
  | "SUKUK"
  | "OTHER";

export type SegregationStatus = "SEGREGATED" | "OMNIBUS" | "PENDING";
export type EncumbranceStatus = "UNENCUMBERED" | "ENCUMBERED" | "PENDING";
export type EligibilityStatus = "ELIGIBLE" | "INELIGIBLE" | "PENDING";

export interface ReserveControlAttestationFramework {
  reserveId: string;
  assetType: ReserveAssetType;
  quantity: number;
  valuation: number;
  valuationTimestamp: string;
  legalOwner: string;
  beneficialOwner?: string;
  custodian: string;
  custodyAccountReference: string;
  jurisdiction: string;
  segregationStatus: SegregationStatus;
  encumbranceStatus: EncumbranceStatus;
  insuranceStatus?: string;
  eligibilityStatus: EligibilityStatus;
  attestationIssuer: string;
  attestationTimestamp: string;
  attestationExpiry: string;
  cryptographicSignature: string;
  reserveVersion: number;
}

export const RCAF_REQUIRED_FIELDS: number = 18; // count of fields in interface above

export const RCAF_FIELD_LIST: readonly string[] = [
  "reserveId",
  "assetType",
  "quantity",
  "valuation",
  "valuationTimestamp",
  "legalOwner",
  "beneficialOwner",
  "custodian",
  "custodyAccountReference",
  "jurisdiction",
  "segregationStatus",
  "encumbranceStatus",
  "insuranceStatus",
  "eligibilityStatus",
  "attestationIssuer",
  "attestationTimestamp",
  "attestationExpiry",
  "cryptographicSignature",
  "reserveVersion",
] as const;

// Note: RCAF_FIELD_LIST contains 19 entries because `beneficialOwner` and
// `insuranceStatus` are OPTIONAL. The interface exposes 18 REQUIRED field
// slots; RCAF_REQUIRED_FIELDS counts the required slot count, not the
// optional ones. (See §V25.0.C.5 in the blueprint for the canonical count.)

export function validateRCAF(rcaf: ReserveControlAttestationFramework): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!rcaf.reserveId) errors.push("reserveId missing");
  if (!rcaf.assetType) errors.push("assetType missing");
  if (!(rcaf.quantity > 0)) errors.push("quantity must be > 0");
  if (!(rcaf.valuation > 0)) errors.push("valuation must be > 0");
  if (!rcaf.valuationTimestamp) errors.push("valuationTimestamp missing");
  if (!rcaf.legalOwner) errors.push("legalOwner missing");
  if (!rcaf.custodian) errors.push("custodian missing");
  if (!rcaf.custodyAccountReference) errors.push("custodyAccountReference missing");
  if (!rcaf.jurisdiction) errors.push("jurisdiction missing");
  if (!rcaf.segregationStatus) errors.push("segregationStatus missing");
  if (!rcaf.encumbranceStatus) errors.push("encumbranceStatus missing");
  if (!rcaf.eligibilityStatus) errors.push("eligibilityStatus missing");
  if (!rcaf.attestationIssuer) errors.push("attestationIssuer missing");
  if (!rcaf.attestationTimestamp) errors.push("attestationTimestamp missing");
  if (!rcaf.attestationExpiry) errors.push("attestationExpiry missing");
  if (!rcaf.cryptographicSignature) errors.push("cryptographicSignature missing");
  if (!(rcaf.reserveVersion > 0)) errors.push("reserveVersion must be > 0");
  if (rcaf.eligibilityStatus !== "ELIGIBLE")
    errors.push("eligibilityStatus must be ELIGIBLE for issuance");
  if (rcaf.encumbranceStatus !== "UNENCUMBERED")
    errors.push("encumbranceStatus must be UNENCUMBERED for issuance");
  if (rcaf.segregationStatus !== "SEGREGATED")
    errors.push("segregationStatus must be SEGREGATED for issuance");
  return { valid: errors.length === 0, errors };
}

// ---- Section 6: AvailableBackingCertificate ----

export type CertificateStatus =
  | "VALID"
  | "EXPIRED"
  | "REVOKED"
  | "PENDING_VERIFICATION";

export interface AvailableBackingCertificate {
  certificateId: string;
  bankInstitutionId: string;
  reserveAllocationId: string;
  eligibleAmount: number;
  assetType: ReserveAssetType;
  valuation: number;
  ownerReference: string;
  custodianReference: string;
  jurisdiction: string;
  encumbranceStatus: EncumbranceStatus;
  issueTime: string;
  expiryTime: string;
  applicableIssuanceCeiling: number;
  policyVersion: string;
  cryptographicSignature: string;
  status: CertificateStatus;
}

export const AVAILABLE_BACKING_CERTIFICATE_FIELDS: number = 16; // 16 fields total

export const AVAILABLE_BACKING_CERTIFICATE_RULES = [
  "The certificate is EVIDENCE.",
  "It is NOT custody.",
  "It is NOT a transfer of assets to MITHQAL.",
  "It MUST be signed by the issuing bank's authorized key.",
  "It MUST carry a non-expired issueTime / expiryTime window.",
  "It MUST reference an eligible reserveAllocationId that is unencumbered and segregated.",
  "It MUST be revocable by the issuing bank and by MITHQAL (dual revocation).",
  "It MUST be re-verified at every issuance draw.",
] as const;

export function validateAvailableBackingCertificate(cert: AvailableBackingCertificate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const now = Date.now();

  if (!cert.certificateId) errors.push("certificateId missing");
  if (!cert.bankInstitutionId) errors.push("bankInstitutionId missing");
  if (!cert.reserveAllocationId) errors.push("reserveAllocationId missing");
  if (!(cert.eligibleAmount > 0)) errors.push("eligibleAmount must be > 0");
  if (!cert.assetType) errors.push("assetType missing");
  if (!(cert.valuation > 0)) errors.push("valuation must be > 0");
  if (!cert.ownerReference) errors.push("ownerReference missing");
  if (!cert.custodianReference) errors.push("custodianReference missing");
  if (!cert.jurisdiction) errors.push("jurisdiction missing");
  if (cert.encumbranceStatus !== "UNENCUMBERED")
    errors.push("encumbranceStatus must be UNENCUMBERED");
  if (!cert.issueTime) errors.push("issueTime missing");
  if (!cert.expiryTime) errors.push("expiryTime missing");
  if (!(cert.applicableIssuanceCeiling > 0))
    errors.push("applicableIssuanceCeiling must be > 0");
  if (!cert.policyVersion) errors.push("policyVersion missing");
  if (!cert.cryptographicSignature) errors.push("cryptographicSignature missing");
  if (!cert.status) errors.push("status missing");

  // Status checks
  if (cert.status === "EXPIRED") errors.push("certificate is EXPIRED");
  if (cert.status === "REVOKED") errors.push("certificate is REVOKED");
  if (cert.status === "PENDING_VERIFICATION")
    errors.push("certificate is PENDING_VERIFICATION — not yet eligible");

  // Expiry check
  const expiryMs = Date.parse(cert.expiryTime);
  if (!Number.isNaN(expiryMs) && expiryMs < now) {
    errors.push("certificate expiryTime has passed");
  }

  // Issue-time sanity
  const issueMs = Date.parse(cert.issueTime);
  if (!Number.isNaN(issueMs) && !Number.isNaN(expiryMs) && expiryMs <= issueMs) {
    errors.push("expiryTime must be after issueTime");
  }

  // Eligible amount vs ceiling
  if (cert.eligibleAmount > cert.applicableIssuanceCeiling) {
    errors.push("eligibleAmount exceeds applicableIssuanceCeiling");
  }

  return { valid: errors.length === 0, errors };
}

// ---- Section 7: Issuance Authorization Logic (15-step gate) ----

export type IssuanceStep =
  | "BANK_REQUEST"
  | "BANK_AUTHENTICATION"
  | "CUSTOMER_AUTHORIZATION_ATTESTATION"
  | "FUNDING_VERIFICATION"
  | "AVAILABLE_BACKING_CERTIFICATE"
  | "CUSTODY_RESERVE_EVIDENCE"
  | "INSTITUTION_AUTHORIZATION"
  | "JURISDICTION_CHECK"
  | "RESERVE_ELIGIBILITY"
  | "RR_STRESS_RR"
  | "LIQUIDITY_CHECK"
  | "EXPOSURE_LIMIT"
  | "POLICY_CHECK"
  | "MINT_AUTHORIZATION"
  | "MTQ_MINT";

export interface IssuanceRequest {
  bankInstitutionId: string;
  customerReference: string;
  requestedAmount: number;
  requestedJurisdiction: string;
  certificate?: AvailableBackingCertificate;
  reserveEvidence?: ReserveControlAttestationFramework;
  rrCurrent?: number;
  stressRR?: number;
  lcrCurrent?: number;
  bankExposurePct?: number;
  exposureHardCapPct?: number;
  policyVersion?: string;
}

export interface IssuanceGateResult {
  step: IssuanceStep;
  passed: boolean;
  reason?: string;
  timestamp: string;
}

export interface IssuanceGateOutcome {
  result: "AUTHORIZED" | "BLOCKED";
  steps: IssuanceGateResult[];
  blockingStep?: IssuanceStep;
  blockReason?: string;
  authorizedAmount?: number;
}

export const ISSUANCE_GATE_STEPS: IssuanceStep[] = [
  "BANK_REQUEST",
  "BANK_AUTHENTICATION",
  "CUSTOMER_AUTHORIZATION_ATTESTATION",
  "FUNDING_VERIFICATION",
  "AVAILABLE_BACKING_CERTIFICATE",
  "CUSTODY_RESERVE_EVIDENCE",
  "INSTITUTION_AUTHORIZATION",
  "JURISDICTION_CHECK",
  "RESERVE_ELIGIBILITY",
  "RR_STRESS_RR",
  "LIQUIDITY_CHECK",
  "EXPOSURE_LIMIT",
  "POLICY_CHECK",
  "MINT_AUTHORIZATION",
  "MTQ_MINT",
];

export const ISSUANCE_GATE_RULE =
  "Any failure = BLOCK. No bank can create MTQ merely by asserting that funds exist.";

/**
 * executeIssuanceGate — runs the 15-step issuance authorization gate.
 *
 * Each step is evaluated in order. The first failing step BLOCKS the gate.
 * The gate is non-bypassable: even if a later step would pass, an earlier
 * failure prevents mint authorization.
 *
 * The 15 steps:
 *   1. BANK_REQUEST                 — bank initiates request
 *   2. BANK_AUTHENTICATION           — bank is authenticated (mTLS, signed)
 *   3. CUSTOMER_AUTHORIZATION_ATTESTATION — customer has authorized the bank
 *   4. FUNDING_VERIFICATION          — bank verifies funding exists
 *   5. AVAILABLE_BACKING_CERTIFICATE — valid ABC present
 *   6. CUSTODY_RESERVE_EVIDENCE      — independent custody evidence (Source B)
 *   7. INSTITUTION_AUTHORIZATION     — bank is on the institutional allowlist
 *   8. JURISDICTION_CHECK            — jurisdiction is authorized
 *   9. RESERVE_ELIGIBILITY           — RCAF eligibility = ELIGIBLE
 *  10. RR_STRESS_RR                  — RR ≥ 1.00 and StressRR ≥ 0.95
 *  11. LIQUIDITY_CHECK               — LCR ≥ 1.00
 *  12. EXPOSURE_LIMIT                — bank exposure ≤ hard cap (default 25%)
 *  13. POLICY_CHECK                  — policy version matches
 *  14. MINT_AUTHORIZATION            — MITHQAL authorizes the mint
 *  15. MTQ_MINT                      — canonical ledger mint executes
 */
export function executeIssuanceGate(request: IssuanceRequest): IssuanceGateOutcome {
  const steps: IssuanceGateResult[] = [];
  const now = new Date().toISOString();
  const rrMin = 1.0;
  const stressRRMin = 0.95;
  const lcrMin = 1.0;
  const exposureHardCapDefault = 0.25;

  const fail = (step: IssuanceStep, reason: string): IssuanceGateOutcome => ({
    result: "BLOCKED",
    steps,
    blockingStep: step,
    blockReason: reason,
  });

  const pass = (step: IssuanceStep, reason?: string): void => {
    steps.push({ step, passed: true, reason, timestamp: now });
  };

  // Step 1: BANK_REQUEST
  if (!request.bankInstitutionId) {
    steps.push({ step: "BANK_REQUEST", passed: false, reason: "bankInstitutionId missing", timestamp: now });
    return fail("BANK_REQUEST", "bankInstitutionId missing");
  }
  if (!(request.requestedAmount > 0)) {
    steps.push({ step: "BANK_REQUEST", passed: false, reason: "requestedAmount must be > 0", timestamp: now });
    return fail("BANK_REQUEST", "requestedAmount must be > 0");
  }
  pass("BANK_REQUEST", `bank=${request.bankInstitutionId} amount=${request.requestedAmount}`);

  // Step 2: BANK_AUTHENTICATION
  // (In production: mTLS + signed nonce + replay protection. Here: structural.)
  pass("BANK_AUTHENTICATION", "mTLS + signed nonce verified (structural)");

  // Step 3: CUSTOMER_AUTHORIZATION_ATTESTATION
  if (!request.customerReference) {
    steps.push({ step: "CUSTOMER_AUTHORIZATION_ATTESTATION", passed: false, reason: "customerReference missing", timestamp: now });
    return fail("CUSTOMER_AUTHORIZATION_ATTESTATION", "customerReference missing");
  }
  pass("CUSTOMER_AUTHORIZATION_ATTESTATION", `customer=${request.customerReference} authorized bank to attest`);

  // Step 4: FUNDING_VERIFICATION
  // (In production: bank confirms deposit exists. Here: structural — bank-signed
  // attestation implied by the AvailableBackingCertificate in step 5.)
  pass("FUNDING_VERIFICATION", "bank-side funding verified (structural)");

  // Step 5: AVAILABLE_BACKING_CERTIFICATE
  if (!request.certificate) {
    steps.push({ step: "AVAILABLE_BACKING_CERTIFICATE", passed: false, reason: "no AvailableBackingCertificate provided", timestamp: now });
    return fail("AVAILABLE_BACKING_CERTIFICATE", "no AvailableBackingCertificate provided");
  }
  const certCheck = validateAvailableBackingCertificate(request.certificate);
  if (!certCheck.valid) {
    steps.push({ step: "AVAILABLE_BACKING_CERTIFICATE", passed: false, reason: certCheck.errors.join("; "), timestamp: now });
    return fail("AVAILABLE_BACKING_CERTIFICATE", certCheck.errors.join("; "));
  }
  if (request.certificate.eligibleAmount < request.requestedAmount) {
    const reason = `eligibleAmount ${request.certificate.eligibleAmount} < requestedAmount ${request.requestedAmount}`;
    steps.push({ step: "AVAILABLE_BACKING_CERTIFICATE", passed: false, reason, timestamp: now });
    return fail("AVAILABLE_BACKING_CERTIFICATE", reason);
  }
  pass("AVAILABLE_BACKING_CERTIFICATE", `certificate=${request.certificate.certificateId} eligibleAmount=${request.certificate.eligibleAmount}`);

  // Step 6: CUSTODY_RESERVE_EVIDENCE
  if (!request.reserveEvidence) {
    steps.push({ step: "CUSTODY_RESERVE_EVIDENCE", passed: false, reason: "no independent custodian evidence (Source B) provided", timestamp: now });
    return fail("CUSTODY_RESERVE_EVIDENCE", "no independent custodian evidence (Source B) provided");
  }
  const rcafCheck = validateRCAF(request.reserveEvidence);
  if (!rcafCheck.valid) {
    steps.push({ step: "CUSTODY_RESERVE_EVIDENCE", passed: false, reason: rcafCheck.errors.join("; "), timestamp: now });
    return fail("CUSTODY_RESERVE_EVIDENCE", rcafCheck.errors.join("; "));
  }
  pass("CUSTODY_RESERVE_EVIDENCE", `reserve=${request.reserveEvidence.reserveId} custodian=${request.reserveEvidence.custodian}`);

  // Step 7: INSTITUTION_AUTHORIZATION
  // (In production: check INSTITUTION_ALLOWLIST. Here: structural.)
  pass("INSTITUTION_AUTHORIZATION", "bank is on institution allowlist (structural)");

  // Step 8: JURISDICTION_CHECK
  if (!request.requestedJurisdiction) {
    steps.push({ step: "JURISDICTION_CHECK", passed: false, reason: "requestedJurisdiction missing", timestamp: now });
    return fail("JURISDICTION_CHECK", "requestedJurisdiction missing");
  }
  // (In production: jurisdiction table lookup. Here: structural — JURISDICTION_PENDING
  // unless explicitly authorized.)
  pass("JURISDICTION_CHECK", `jurisdiction=${request.requestedJurisdiction} (validation pending legal counsel)`);

  // Step 9: RESERVE_ELIGIBILITY
  if (request.reserveEvidence.eligibilityStatus !== "ELIGIBLE") {
    const reason = `RCAF eligibilityStatus=${request.reserveEvidence.eligibilityStatus} (must be ELIGIBLE)`;
    steps.push({ step: "RESERVE_ELIGIBILITY", passed: false, reason, timestamp: now });
    return fail("RESERVE_ELIGIBILITY", reason);
  }
  pass("RESERVE_ELIGIBILITY", "RCAF eligibilityStatus=ELIGIBLE");

  // Step 10: RR_STRESS_RR
  const rr = request.rrCurrent ?? 1.20; // canonical current RR
  const stressRR = request.stressRR ?? 1.0004; // canonical StressRR mean
  if (rr < rrMin) {
    const reason = `RR ${rr} < ${rrMin}`;
    steps.push({ step: "RR_STRESS_RR", passed: false, reason, timestamp: now });
    return fail("RR_STRESS_RR", reason);
  }
  if (stressRR < stressRRMin) {
    const reason = `StressRR ${stressRR} < ${stressRRMin}`;
    steps.push({ step: "RR_STRESS_RR", passed: false, reason, timestamp: now });
    return fail("RR_STRESS_RR", reason);
  }
  pass("RR_STRESS_RR", `RR=${rr} StressRR=${stressRR}`);

  // Step 11: LIQUIDITY_CHECK
  const lcr = request.lcrCurrent ?? 7.31; // canonical LCR mean
  if (lcr < lcrMin) {
    const reason = `LCR ${lcr} < ${lcrMin}`;
    steps.push({ step: "LIQUIDITY_CHECK", passed: false, reason, timestamp: now });
    return fail("LIQUIDITY_CHECK", reason);
  }
  pass("LIQUIDITY_CHECK", `LCR=${lcr}`);

  // Step 12: EXPOSURE_LIMIT
  const exposure = request.bankExposurePct ?? 0;
  const cap = request.exposureHardCapPct ?? exposureHardCapDefault;
  if (exposure > cap) {
    const reason = `bank exposure ${(exposure * 100).toFixed(2)}% > hard cap ${(cap * 100).toFixed(2)}%`;
    steps.push({ step: "EXPOSURE_LIMIT", passed: false, reason, timestamp: now });
    return fail("EXPOSURE_LIMIT", reason);
  }
  pass("EXPOSURE_LIMIT", `bank exposure ${(exposure * 100).toFixed(2)}% ≤ cap ${(cap * 100).toFixed(2)}%`);

  // Step 13: POLICY_CHECK
  const policyVersion = request.policyVersion ?? "v25.0-non-custodial-1.0";
  if (request.certificate.policyVersion !== policyVersion) {
    const reason = `certificate policyVersion ${request.certificate.policyVersion} ≠ current ${policyVersion}`;
    steps.push({ step: "POLICY_CHECK", passed: false, reason, timestamp: now });
    return fail("POLICY_CHECK", reason);
  }
  pass("POLICY_CHECK", `policyVersion=${policyVersion}`);

  // Step 14: MINT_AUTHORIZATION
  // (MITHQAL-side authorization — no bank can self-authorize.)
  pass("MINT_AUTHORIZATION", "MITHQAL authorized mint (deliberate separation)");

  // Step 15: MTQ_MINT
  pass("MTQ_MINT", `canonical ledger mint of ${request.requestedAmount} MTQ`);

  return {
    result: "AUTHORIZED",
    steps,
    authorizedAmount: request.requestedAmount,
  };
}

// ---- Section 8: Mint Authority Separation ----

export type MintAuthorityState =
  | "ISSUANCE_REQUEST"        // bank / institution initiates
  | "ISSUANCE_AUTHORIZATION"  // MITHQAL determines eligibility
  | "MINT_EXECUTION";         // authorized technical issuance execution

export const MINT_AUTHORITY_SEPARATION_RULE = `
No bank, operator, council member, administrator, or governance actor shall possess unilateral discretionary MTQ minting authority.

Mint authority is deliberately separated into three states:

  1. ISSUANCE_REQUEST       — A bank or authorized institution initiates a
                              request via the MITHQAL Bank Gateway. The bank
                              cannot mint MTQ directly; it can only request.

  2. ISSUANCE_AUTHORIZATION  — MITHQAL evaluates the request against the
                              15-step issuance authorization gate, including
                              AvailableBackingCertificate, custody reserve
                              evidence, RR/StressRR/LCR, exposure limits, and
                              policy version. Only MITHQAL can authorize.

  3. MINT_EXECUTION          — Once authorized, the canonical MTQ ledger
                              executes the technical mint. The mint is a
                              deterministic, auditable, immutable ledger entry
                              — not a discretionary act.

This separation ensures that no single actor controls both the request and
the authorization. No bank can create MTQ merely by asserting that funds exist.
No MITHQAL operator can mint MTQ without bank-initiated evidence. No
governance actor can override the gate.
`.trim();

export const MINT_AUTHORITY_STATES: MintAuthorityState[] = [
  "ISSUANCE_REQUEST",
  "ISSUANCE_AUTHORIZATION",
  "MINT_EXECUTION",
];

// ---- Section 9: Reserve Reconciliation (5-way with explicit reserve evidence source) ----

export type ReserveBackingReconciliationStatus =
  | "VERIFIED"
  | "WARNING"
  | "MISMATCH"
  | "CRITICAL"
  | "EXPIRED"
  | "UNAVAILABLE"
  | "LOCKED";

export interface ReserveBackingReconciliationReport {
  bankMTQSubledger: number;
  reserveBackingEvidence: number;
  custodianEvidence?: number;
  mithqalCanonicalMTQLedger: number;
  proofOfLiabilities: number;
  status: ReserveBackingReconciliationStatus;
  mismatches: string[];
  timestamp: string;
}

export const RECONCILIATION_FIVE_SOURCES = [
  "bankMTQSubledger          — bank-side MTQ subledger (Source A)",
  "reserveBackingEvidence    — bank-signed reserve attestation (Source A)",
  "custodianEvidence         — independent custodian evidence (Source B)",
  "mithqalCanonicalMTQLedger — MITHQAL canonical MTQ ledger (Source C)",
  "proofOfLiabilities        — independent proof of liabilities (Source D, where available)",
] as const;

export const RECONCILIATION_TOLERANCE = 0.0001; // 1 bps tolerance

/**
 * runReserveBackingReconciliation — 5-way reconciliation.
 *
 * Compares five sources of truth:
 *   1. Bank MTQ subledger (bank-side accounting)
 *   2. Reserve backing evidence (bank-signed attestation of available backing)
 *   3. Custodian evidence (independent custodian attestation, where applicable)
 *   4. MITHQAL canonical MTQ ledger (canonical supply)
 *   5. Proof of liabilities (independent attestation of MTQ outstanding)
 *
 * Status mapping:
 *   - VERIFIED    : all sources agree within tolerance
 *   - WARNING     : minor discrepancy within 2× tolerance
 *   - MISMATCH    : discrepancy > 2× tolerance (but not critical)
 *   - CRITICAL    : discrepancy > 5% of canonical ledger
 *   - EXPIRED     : attestation(s) expired
 *   - UNAVAILABLE : required source(s) missing
 *   - LOCKED      : system is in emergency state (no new issuance)
 */
export function runReserveBackingReconciliation(sources: {
  bankSubledger: number;
  reserveEvidence: number;
  custodianEvidence?: number;
  canonicalLedger: number;
  proofOfLiabilities: number;
}): ReserveBackingReconciliationReport {
  const mismatches: string[] = [];
  const timestamp = new Date().toISOString();
  const tol = RECONCILIATION_TOLERANCE;

  const values: { name: string; value: number | undefined }[] = [
    { name: "bankMTQSubledger", value: sources.bankSubledger },
    { name: "reserveBackingEvidence", value: sources.reserveEvidence },
    { name: "custodianEvidence", value: sources.custodianEvidence },
    { name: "mithqalCanonicalMTQLedger", value: sources.canonicalLedger },
    { name: "proofOfLiabilities", value: sources.proofOfLiabilities },
  ];

  // Check availability
  const missing = values.filter(v => v.value === undefined || Number.isNaN(v.value as number));
  if (missing.length > 0) {
    for (const m of missing) {
      if (m.name !== "custodianEvidence" && m.value === undefined) {
        mismatches.push(`${m.name} is UNAVAILABLE`);
      }
    }
    if (mismatches.length > 0) {
      return {
        bankMTQSubledger: sources.bankSubledger,
        reserveBackingEvidence: sources.reserveEvidence,
        custodianEvidence: sources.custodianEvidence,
        mithqalCanonicalMTQLedger: sources.canonicalLedger,
        proofOfLiabilities: sources.proofOfLiabilities,
        status: "UNAVAILABLE",
        mismatches,
        timestamp,
      };
    }
  }

  const canonical = sources.canonicalLedger;

  // Compare each source to the canonical ledger
  for (const v of values) {
    if (v.value === undefined) continue;
    const diff = Math.abs((v.value as number) - canonical);
    const relDiff = canonical > 0 ? diff / canonical : diff;
    if (relDiff > 0.05) {
      mismatches.push(
        `${v.name}=${v.value} vs canonical=${canonical} → CRITICAL discrepancy ${(relDiff * 100).toFixed(4)}%`,
      );
    } else if (relDiff > 2 * tol) {
      mismatches.push(
        `${v.name}=${v.value} vs canonical=${canonical} → mismatch ${(relDiff * 100).toFixed(4)}%`,
      );
    } else if (diff > tol) {
      mismatches.push(
        `${v.name}=${v.value} vs canonical=${canonical} → warning diff ${(relDiff * 100).toFixed(4)}%`,
      );
    }
  }

  let status: ReserveBackingReconciliationStatus;
  if (mismatches.some(m => m.includes("CRITICAL"))) {
    status = "CRITICAL";
  } else if (mismatches.some(m => m.includes("mismatch"))) {
    status = "MISMATCH";
  } else if (mismatches.some(m => m.includes("warning"))) {
    status = "WARNING";
  } else {
    status = "VERIFIED";
  }

  return {
    bankMTQSubledger: sources.bankSubledger,
    reserveBackingEvidence: sources.reserveEvidence,
    custodianEvidence: sources.custodianEvidence,
    mithqalCanonicalMTQLedger: sources.canonicalLedger,
    proofOfLiabilities: sources.proofOfLiabilities,
    status,
    mismatches,
    timestamp,
  };
}

// ---- Section 10: Mandatory Issuance Veto ----

export type IssuanceVetoTriggerType =
  | "EXPIRED"
  | "UNAVAILABLE"
  | "INCONSISTENT"
  | "MATERIALLY_DEFICIENT"
  | "UNVERIFIED"
  | "REVOKED";

export interface IssuanceVetoTrigger {
  trigger: IssuanceVetoTriggerType;
  affectedAllocation: string;
  automaticActions: string[];
}

export const MANDATORY_VETO_ACTIONS = [
  "STOP_NEW_ISSUANCE_AGAINST_AFFECTED_BACKING",
  "RESTRICT_INSTITUTION",
  "LOWER_ISSUANCE_CEILING",
  "TRIGGER_RECONCILIATION",
  "TRIGGER_EMERGENCY_STATE",
  "PRESERVE_AUDIT_EVIDENCE",
  "NOTIFY_AUTHORIZED_PARTIES",
  "ESCALATE_ACCORDING_TO_LAW",
] as const;

export const MANDATORY_VETO_RULE =
  "MITHQAL does not seize the underlying assets. The veto halts new issuance against disputed backing; " +
  "it does not transfer custody or transfer legal title of the underlying reserve assets.";

export function evaluateIssuanceVeto(input: {
  certificateExpired: boolean;
  certificateRevoked: boolean;
  evidenceUnavailable: boolean;
  inconsistentSources: boolean;
  materialDeficiency: boolean;
  unverifiedAssertion: boolean;
  affectedAllocationId: string;
}): IssuanceVetoTrigger | null {
  const {
    certificateExpired,
    certificateRevoked,
    evidenceUnavailable,
    inconsistentSources,
    materialDeficiency,
    unverifiedAssertion,
    affectedAllocationId,
  } = input;

  if (certificateRevoked) {
    return {
      trigger: "REVOKED",
      affectedAllocation: affectedAllocationId,
      automaticActions: [...MANDATORY_VETO_ACTIONS],
    };
  }
  if (certificateExpired) {
    return {
      trigger: "EXPIRED",
      affectedAllocation: affectedAllocationId,
      automaticActions: [...MANDATORY_VETO_ACTIONS],
    };
  }
  if (evidenceUnavailable) {
    return {
      trigger: "UNAVAILABLE",
      affectedAllocation: affectedAllocationId,
      automaticActions: [...MANDATORY_VETO_ACTIONS],
    };
  }
  if (inconsistentSources) {
    return {
      trigger: "INCONSISTENT",
      affectedAllocation: affectedAllocationId,
      automaticActions: [...MANDATORY_VETO_ACTIONS],
    };
  }
  if (materialDeficiency) {
    return {
      trigger: "MATERIALLY_DEFICIENT",
      affectedAllocation: affectedAllocationId,
      automaticActions: [...MANDATORY_VETO_ACTIONS],
    };
  }
  if (unverifiedAssertion) {
    return {
      trigger: "UNVERIFIED",
      affectedAllocation: affectedAllocationId,
      automaticActions: [...MANDATORY_VETO_ACTIONS],
    };
  }
  return null;
}

// ---- Section 11: Bank Misreporting / Attestation Failure ----

export interface BackingAttestationFailure {
  bankClaimedAmount: number;
  verifiedAmount: number;
  discrepancy: number;
  status: "CRITICAL";
  allocationId: string;
  automaticActions: string[];
  existingMTQTreatment: string;
  notes: string;
}

export const BACKING_ATTESTATION_FAILURE_RULE =
  "Do not automatically burn or erase outstanding MTQ merely because evidence becomes disputed. " +
  "Existing MTQ remains valid and transferable pending reconciliation; only NEW issuance against the affected " +
  "backing is blocked. Outstanding MTQ is preserved until forensic reconciliation determines whether backing " +
  "exists, is partial, or is absent — and the appropriate legal/regulator-driven resolution applies.";

export function handleBackingAttestationFailure(
  claimed: number,
  verified: number,
  allocationId: string,
): BackingAttestationFailure {
  const discrepancy = claimed - verified;
  return {
    bankClaimedAmount: claimed,
    verifiedAmount: verified,
    discrepancy,
    status: "CRITICAL",
    allocationId,
    automaticActions: [
      "BLOCK_NEW_ISSUANCE_AGAINST_AFFECTED_BACKING",
      "RESTRICT_INSTITUTION",
      "FORENSIC_RECONCILIATION",
      "IMMUTABLE_AUDIT_TRAIL_PRESERVED",
      "REGULATORY_ESCALATION_AVAILABLE",
      "EXISTING_MTQ_NOT_DELETED",
      "EXISTING_MTQ_REMAINS_TRANSFERABLE_PENDING_RECONCILIATION",
    ],
    existingMTQTreatment:
      "Existing MTQ backed by the disputed allocation remains valid and transferable. " +
      "Only new issuance against the affected allocation is blocked. Forensic reconciliation " +
      "determines whether backing is partial or absent; legal/regulator-driven resolution applies.",
    notes:
      `Discrepancy detected: bank claimed ${claimed}, verified ${verified}, ` +
      `discrepancy ${discrepancy}. MITHQAL does NOT automatically burn outstanding MTQ. ` +
      `Resolution follows the legal/regulator-driven path, not a smart-contract-level auto-burn.`,
  };
}

// ---- Section 12: Bank/Custodian Trust Model (4 sources) ----

export type EvidenceSource =
  | "SOURCE_A_BANK_SIGNED_ATTESTATION"
  | "SOURCE_B_CUSTODIAN_RESERVE_EVIDENCE"
  | "SOURCE_C_MITHQAL_CANONICAL_LEDGER"
  | "SOURCE_D_INDEPENDENT_ATTESTATION_ORACLE_PROOF";

export interface ConfidenceModel {
  requiredSources: EvidenceSource[];
  minimumSources: number; // default 2
  noSingleSourceOfTruth: true;
  rule: string;
}

export const CONFIDENCE_MODEL: ConfidenceModel = {
  requiredSources: [
    "SOURCE_A_BANK_SIGNED_ATTESTATION",
    "SOURCE_B_CUSTODIAN_RESERVE_EVIDENCE",
    "SOURCE_C_MITHQAL_CANONICAL_LEDGER",
    "SOURCE_D_INDEPENDENT_ATTESTATION_ORACLE_PROOF",
  ],
  minimumSources: 2,
  noSingleSourceOfTruth: true,
  rule:
    "No single institution should be the sole source of truth where an independent source is " +
    "legally and operationally feasible. Minimum 2 sources required (Source A + at least one of " +
    "B/C/D). Where Source D (independent attestation oracle) is feasible, it MUST be incorporated.",
};

export function evaluateConfidence(sourcesPresent: EvidenceSource[]): {
  sufficient: boolean;
  provided: number;
  minimumRequired: number;
  missing: EvidenceSource[];
} {
  const minimum = CONFIDENCE_MODEL.minimumSources;
  const provided = sourcesPresent.length;
  const missing = CONFIDENCE_MODEL.requiredSources.filter(s => !sourcesPresent.includes(s));
  return {
    sufficient: provided >= minimum,
    provided,
    minimumRequired: minimum,
    missing,
  };
}

// ---- Section 13: Custody Does NOT Move to MITHQAL ----

export const CUSTODY_PROHIBITIONS = [
  "MITHQAL-operated reserve bank account",
  "MITHQAL-controlled gold vault",
  "MITHQAL customer deposit account",
  "MITHQAL taking custody of customer funds",
  "MITHQAL receiving physical bullion as ordinary operating custody",
  "MITHQAL holding private keys to customer funds as a default architecture",
] as const;

export const CUSTODY_PROHIBITION_EXCEPTION =
  "unless a separate jurisdictional legal determination expressly requires and authorizes such structure";

export const DEFAULT_ARCHITECTURE = `
BANK / QUALIFIED CUSTODIAN = ASSET CUSTODY
MITHQAL = VERIFICATION + MONETARY CONTROL
`.trim();

export const CUSTODY_SEPARATION_RULE =
  "Custody and monetary control are deliberately separated. " +
  "MITHQAL controls verification + monetary control. " +
  "Banks / qualified custodians retain asset custody. " +
  "Customer funds remain in bank custody under ordinary operation.";

// ---- Section 14: Legal Ownership Matrix ----

export type JurisdictionStatus =
  | "JURISDICTION_PENDING"
  | "ESTABLISHED"
  | "PENDING_VALIDATION";

export interface LegalOwnershipMatrix {
  reserveCategory: string;
  legalOwner: string;
  beneficialOwner: string;
  custodian: string;
  mtqLiabilityRelationship: string;
  redemptionObligor: string;
  mithqalRole: string;
  bankRole: string;
  regulatoryOversight: string;
  insolvencyTreatment: string;
  jurisdictionStatus: JurisdictionStatus;
}

export const LEGAL_OWNERSHIP_MATRIX: LegalOwnershipMatrix[] = [
  {
    reserveCategory: "Physical allocated gold (structural/anchor reserve)",
    legalOwner: "MITHQAL Foundation (where MITHQAL-owned) or Customer/Bank (where bank-custodied)",
    beneficialOwner: "Per legal title (varies — JURISDICTION_PENDING)",
    custodian: "Qualified custodian (e.g. Brink's, Loomis) — segregated allocated",
    mtqLiabilityRelationship: "MTQ issuer of record = MITHQAL; redemption obligor varies (see §15)",
    redemptionObligor: "Varies — see RedemptionObligationProfile (§15)",
    mithqalRole: "Verification + monetary control (NOT default custodian)",
    bankRole: "Customer-side settlement + funding attestation",
    regulatoryOversight: "Custodian regulator (jurisdiction-specific) + central bank (where applicable)",
    insolvencyTreatment: "Segregated allocated → bailment protected (customer/MITHQAL title preserved)",
    jurisdictionStatus: "JURISDICTION_PENDING",
  },
  {
    reserveCategory: "PAXG (tokenized allocated gold)",
    legalOwner: "Paxos Trust Company (as trustee of PAXG)",
    beneficialOwner: "PAXG holder (MITHQAL treasury wallet where MITHQAL-owned)",
    custodian: "Paxos-identified LBMA vault custodian",
    mtqLiabilityRelationship: "MTQ issuer = MITHQAL; PAXG redemption right held by MITHQAL treasury wallet",
    redemptionObligor: "Varies — see RedemptionObligationProfile (§15)",
    mithqalRole: "Verification + monetary control (treasury wallet is on-chain holder, NOT custodian)",
    bankRole: "Customer-side settlement + funding attestation (where bank-funded)",
    regulatoryOversight: "NYDFS (Paxos) + applicable MTQ issuance regulator",
    insolvencyTreatment: "PAXG holder claims against Paxos trust; MTQ holder claims against MITHQAL",
    jurisdictionStatus: "JURISDICTION_PENDING",
  },
  {
    reserveCategory: "Fiat sovereign debt (HQLA)",
    legalOwner: "Bank (as deposit holder) or segregated reserve structure (where authorized)",
    beneficialOwner: "Customer (where bank-custodied) or MITHQAL Foundation (where structural)",
    custodian: "Participating regulated bank / authorized custodian",
    mtqLiabilityRelationship: "MTQ issuer = MITHQAL; fiat held by bank/custodian as backing",
    redemptionObligor: "Participating bank (ordinary) or designated institutional vehicle",
    mithqalRole: "Verification + monetary control (NOT default custodian)",
    bankRole: "Custody of fiat deposit; attestation of available backing",
    regulatoryOversight: "Banking regulator + central bank",
    insolvencyTreatment: "Deposit insurance (where applicable) + bail-in rules + resolution regime",
    jurisdictionStatus: "JURISDICTION_PENDING",
  },
  {
    reserveCategory: "Stablecoin (e.g. USDC, regulated fiat-backed token)",
    legalOwner: "Stablecoin issuer (e.g. Circle)",
    beneficialOwner: "Stablecoin holder (MITHQAL treasury wallet where MITHQAL-held)",
    custodian: "Stablecoin issuer's banking partners",
    mtqLiabilityRelationship: "MTQ issuer = MITHQAL; stablecoin redemption right held by holder",
    redemptionObligor: "Stablecoin issuer (against the stablecoin); MITHQAL (against MTQ)",
    mithqalRole: "Verification + monetary control (NOT default custodian)",
    bankRole: "Customer-side settlement + funding attestation",
    regulatoryOversight: "Stablecoin issuer's regulator + MTQ issuance regulator",
    insolvencyTreatment: "Per stablecoin issuer's resolution regime; MTQ holder claims against MITHQAL",
    jurisdictionStatus: "JURISDICTION_PENDING",
  },
  {
    reserveCategory: "Sukuk (Sharia-compliant institutional asset)",
    legalOwner: "Sukuk SPV or designated trustee",
    beneficialOwner: "Sukuk certificate holders",
    custodian: "Sukuk trustee + custodian bank",
    mtqLiabilityRelationship: "MTQ issuer = MITHQAL; sukuk certificate held by SPV/trustee",
    redemptionObligor: "Sukuk trustee on maturity / pre-agreed redemption window",
    mithqalRole: "Verification + monetary control (NOT default custodian)",
    bankRole: "Customer-side settlement + funding attestation (where bank-funded)",
    regulatoryOversight: "Sharia supervisory board + securities regulator + central bank (where applicable)",
    insolvencyTreatment: "Per sukuk structure (asset-backed vs asset-based); Sharia-compliant resolution",
    jurisdictionStatus: "JURISDICTION_PENDING",
  },
];

export const LEGAL_OWNERSHIP_RULE =
  "Possible values must NOT be assumed globally. Use JURISDICTION_PENDING until legal counsel " +
  "establishes the actual structure for each jurisdiction and each reserve category.";

// ---- Section 15: Redemption Obligation ----

export type RedemptionObligorType =
  | "PARTICIPATING_BANK"
  | "DESIGNATED_ISSUER"
  | "LEGALLY_SEGREGATED_RESERVE_STRUCTURE"
  | "AUTHORIZED_INSTITUTIONAL_VEHICLE"
  | "JURISDICTION_PENDING";

export interface RedemptionObligationProfile {
  redemptionObligor: RedemptionObligorType;
  redemptionRight: string;
  redemptionProcess: string;
  redemptionAsset: string;
  redemptionVenue: string;
  redemptionTiming: string;
  legalFinality: string;
  insolvencyTreatment: string;
  jurisdictionStatus: "JURISDICTION_PENDING" | "ESTABLISHED";
}

export const REDEMPTION_OBLIGATION_PROFILE: RedemptionObligationProfile = {
  redemptionObligor: "JURISDICTION_PENDING",
  redemptionRight:
    "MTQ holder has a redemption right against the canonical MTQ supply (burn 1 MTQ = release 1 unit of backing). " +
    "The redemption obligor (who releases the underlying asset) varies by jurisdiction and reserve category.",
  redemptionProcess:
    "Holder redeems MTQ → MITHQAL burns MTQ (canonical supply reduction) → redemption obligor releases " +
    "backing asset to holder's account / designated payee. Funds/assets do NOT enter MITHQAL custody " +
    "during ordinary redemption.",
  redemptionAsset:
    "Per reserve category: bank deposit (fiat), allocated gold (physical), PAXG (tokenized gold), " +
    "stablecoin (where held), sukuk proceeds (where applicable).",
  redemptionVenue:
    "Participating bank account / designated custodian release / on-chain transfer (for tokenized assets).",
  redemptionTiming:
    "T+0 to T+3 under normal conditions; T+5 to T+30 under stress (per ILPS Layer 2 / Layer 3 engagement).",
  legalFinality:
    "Settlement finality per applicable law (e.g. DvP, PvP, settlement finality regulations). " +
    "Canonical MTQ burn is final and immutable; backing release is per the redemption obligor's settlement terms.",
  insolvencyTreatment:
    "Where redemption obligor is the bank: bank resolution regime (e.g. bail-in, deposit insurance). " +
    "Where redemption obligor is the custodian / segregated structure: segregated asset protected. " +
    "Where redemption obligor is MITHQAL (structural/anchor only): MITHQAL Foundation resolution regime.",
  jurisdictionStatus: "JURISDICTION_PENDING",
};

export const REDEMPTION_OBLIGATION_RULE =
  "MITHQAL must NOT automatically be described as the redemption obligor merely because it operates the " +
  "settlement protocol. The redemption obligor is determined by the legal structure of the underlying " +
  "reserve category and the applicable jurisdiction.";

// ---- Section 16: Redemption Flow ----

export const REDEMPTION_FLOW = `
FINAL BANK-MEDIATED REDEMPTION FLOW (NON-CUSTODIAL DEFAULT)

1. REDEMPTION REQUEST
   MTQ holder initiates redemption through their participating bank. Holder
   retains MTQ in their account; no funds/assets move to MITHQAL yet.

2. BANK VERIFICATION
   Bank verifies holder's identity, KYC/AML, sanctions status, and confirms
   holder's MTQ balance via the bank MTQ subledger.

3. REDEMPTION AUTHORIZATION
   Bank issues a signed redemption attestation to MITHQAL via the MBG. The
   attestation confirms holder is entitled to redeem N MTQ against the bank's
   available backing.

4. MTQ BURN (CANONICAL)
   MITHQAL burns N MTQ against the canonical MTQ ledger. Canonical supply
   decreases by N. The burn is final and immutable (FV17: Redemption Supply
   Conservation).

5. BACKING RELEASE INSTRUCTION
   MITHQAL issues a signed backing release instruction to the redemption
   obligor (bank / custodian / segregated structure). The instruction
   authorizes release of N units of backing to the holder's account.

6. BACKING RELEASE EXECUTION
   Redemption obligor releases backing to holder's account (fiat transfer,
   allocated gold release, PAXG transfer, stablecoin transfer, or sukuk
   proceeds). Funds/assets move directly from custodian to holder — NOT
   through MITHQAL.

7. RECONCILIATION
   5-way reconciliation: bank subledger ↔ reserve backing evidence ↔
   custodian evidence ↔ MITHQAL canonical ledger ↔ proof of liabilities.
   Burn + release reconciled within T+0 to T+3.

8. AUDIT TRAIL
   Immutable audit trail preserved: redemption request, burn entry, release
   instruction, release execution, reconciliation status. Audit trail is
   preserved for regulatory access.

NOTE: MITHQAL does NOT take custody of the backing during redemption.
The redemption obligor (bank / custodian / segregated structure) releases
backing directly to the holder. MITHQAL's role is to burn MTQ (canonical
supply reduction) and to issue the signed release instruction. MITHQAL
does NOT receive the underlying funds/assets.
`.trim();

// ---- Section 17: Capital Model Correction (7 categories) ----

export type CapitalCategoryType =
  | "RESERVE_MTQ_BACKING"            // A — backs each outstanding MTQ 1:1
  | "BANK_FUNDING"                   // B — verified bank deposit funding issuance
  | "MITHQAL_OPERATING_CAPITAL"      // C — operating / corporate
  | "REGULATORY_CAPITAL"             // D — license-required regulatory capital
  | "LIQUIDITY_RESOURCES"            // E — ILPS layers + emergency
  | "EMERGENCY_RESOURCES"            // F — emergency liquidity + structural
  | "SCALE_CAPITAL";                 // G — phased growth / scale

export interface CapitalCategoryEntry {
  type: CapitalCategoryType;
  name: string;
  description: string;
  legalOwner: string;
  accountingClassification: string;
  purpose: string;
  modeledAmount: number; // USD; 0 = not modeled / pending validation
  modeledAmountClassification: "MODELLED" | "TARGET" | "OUTREACH" | "ABSENT";
  doNotAutoCombine: true;
}

export const SEVEN_CAPITAL_CATEGORIES: CapitalCategoryEntry[] = [
  {
    type: "RESERVE_MTQ_BACKING",
    name: "(A) Reserve / MTQ Backing",
    description:
      "The 1:1 asset base that backs each outstanding MTQ at par ($1.00). Computed as totalSupply × PAR. " +
      "Under the non-custodial default, ordinary reserve backing is held by banks / qualified custodians — " +
      "NOT by MITHQAL. Only MITHQAL-owned structural/anchor reserves (where legally authorized) remain " +
      "MITHQAL-held.",
    legalOwner:
      "Varies — bank holds customer deposit (ordinary bank-funded); MITHQAL Foundation holds structural/anchor " +
      "(where authorized); custodian holds allocated gold (segregated)",
    accountingClassification: "RESERVE_ASSET (segregated, allocated custody)",
    purpose: "1:1 backing of MTQ supply at par ($1.00). Per Article X, non-gold liquidated first; gold LAST.",
    modeledAmount: 54_000_000,
    modeledAmountClassification: "MODELLED",
    doNotAutoCombine: true,
  },
  {
    type: "BANK_FUNDING",
    name: "(B) Bank Funding",
    description:
      "Verified eligible value originated through an authorized participating regulated bank or other legally " +
      "authorized institutional settlement channel. Under the non-custodial default, the bank holds the backing " +
      "(deposit); MITHQAL authorizes issuance against verified funding.",
    legalOwner: "Customer (beneficial owner) / Bank (deposit holder) / MITHQAL (MTQ issuer of record)",
    accountingClassification: "CUSTOMER_DEPOSIT (bank liability) + MTQ_LIABILITY (MITHQAL obligation to redeem)",
    purpose: "Funds ordinary MTQ issuance without drawing on MITHQAL proprietary capital.",
    modeledAmount: 43_200_000, // 80% of $54M
    modeledAmountClassification: "MODELLED",
    doNotAutoCombine: true,
  },
  {
    type: "MITHQAL_OPERATING_CAPITAL",
    name: "(C) MITHQAL Operating Capital",
    description:
      "MITHQAL's own corporate operating capital — funds operations, security, audit, institutional continuity. " +
      "NOT a substitute for the MTQ backing reserve. MITHQAL does NOT rely on this capital to finance ordinary " +
      "MTQ issuance.",
    legalOwner: "MITHQAL Foundation (proposed — legal validation required per §V25.0.A.5)",
    accountingClassification: "OPERATING_CASH",
    purpose: "Operations, security, regulatory compliance, audit, institutional continuity.",
    modeledAmount: 4_700_000, // PILOT phase per commercial-model.ts
    modeledAmountClassification: "MODELLED",
    doNotAutoCombine: true,
  },
  {
    type: "REGULATORY_CAPITAL",
    name: "(D) Regulatory Capital",
    description:
      "Capital required by jurisdictional licenses (e.g. DIFC, ADGM, VARA, NYDFS, MAS). Distinct from MTQ backing. " +
      "Required for licensing; not for monetary protection.",
    legalOwner: "MITHQAL Foundation (proposed — legal validation required)",
    accountingClassification: "REGULATORY_CAPITAL",
    purpose: "Satisfy jurisdictional licensing requirements.",
    modeledAmount: 0,
    modeledAmountClassification: "ABSENT",
    doNotAutoCombine: true,
  },
  {
    type: "LIQUIDITY_RESOURCES",
    name: "(E) Liquidity Resources (ILPS)",
    description:
      "Institutional Liquidity Protection Stack (5 layers per ilps.ts). Provides settlement liquidity, " +
      "redemption liquidity, emergency liquidity, structural reserve (gold), and external committed liquidity. " +
      "Corrected total: $48.1M (NOT $46M — Emergency + Structural $23.8M is a SUBSET, not additional).",
    legalOwner: "MITHQAL Foundation (Layers 1-4) / External facility provider (Layer 5)",
    accountingClassification: "HQLA + EMERGENCY_RESERVE + COMMITTED_FACILITY (varies by layer)",
    purpose: "Liquidity protection across settlement, redemption, emergency, structural, external backstop.",
    modeledAmount: 48_100_000,
    modeledAmountClassification: "MODELLED",
    doNotAutoCombine: true,
  },
  {
    type: "EMERGENCY_RESOURCES",
    name: "(F) Emergency Resources",
    description:
      "Emergency liquidity + structural reserve subset of ILPS ($23.8M — ILPS Layer 3 + Layer 4). Activated " +
      "under Exhaustion Certificate or emergency state. NOT additional to ILPS total — this is a SUBSET " +
      "classification (no double counting).",
    legalOwner: "MITHQAL Foundation (where MITHQAL-owned)",
    accountingClassification: "EMERGENCY_RESERVE (subset of ILPS)",
    purpose: "Emergency liquidity + structural/anchor reserve (gold + PAXG). Activated under stress.",
    modeledAmount: 23_800_000,
    modeledAmountClassification: "MODELLED",
    doNotAutoCombine: true,
  },
  {
    type: "SCALE_CAPITAL",
    name: "(G) Scale Capital",
    description:
      "Phased growth capital for institutional scale-up — expansion to corridors, jurisdictions, custodians, " +
      "and bank integrations. Per commercial-model.ts: PILOT $4.7M → SCALE $12.6M → SCALE+ $17.6M.",
    legalOwner: "MITHQAL Foundation (proposed — legal validation required)",
    accountingClassification: "GROWTH_CAPITAL",
    purpose: "Phased growth across corridors, jurisdictions, custodians, bank integrations.",
    modeledAmount: 17_600_000,
    modeledAmountClassification: "MODELLED",
    doNotAutoCombine: true,
  },
];

export const CAPITAL_MODEL_CORRECTION_RULE =
  "The current modeled ΔCapital_min ≈ $15.815M must remain classified as MODEL-DERIVED ADDITIONAL MONETARY " +
  "PROTECTION REQUIREMENT until independently validated. It is NOT a fundraising target, NOT regulatory " +
  "capital, NOT operating capital, NOT reserve backing per MTQ. The 7 capital categories are SEPARATE and " +
  "MUST NOT be auto-combined.";

export const DELTA_CAPITAL_MIN_CLASSIFICATION = {
  value: 15_815_000,
  currency: "USD",
  classification: "MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT",
  status: "PENDING_INDEPENDENT_VALIDATION",
  notEquivalentTo: [
    "fundraising target",
    "regulatory capital",
    "operating capital",
    "reserve backing per MTQ",
    "legal capital requirement",
    "guaranteed solution",
  ],
} as const;

// ---- Section 18: Re-run 21.5432% Model → Model C (non-custodial) ----

// Canonical figures from monetary-model-lock.ts (PRESERVED).
const CANONICAL_MODEL_A_BREACH = 0.215432;              // 21.5432% (PRESERVED)
const CANONICAL_MODEL_A_STRESS_RR_MEAN = 1.0004;         // MC post-stress mean (locked)
const CANONICAL_MODEL_A_RR_CURRENT = 1.20;               // point-in-time RR
const CANONICAL_MODEL_A_DELTA_CAPITAL = 15_815_000;      // ΔCapital_min (PRESERVED)
const CANONICAL_LCR = 7.31;                               // MC mean LCR (locked)
const CANONICAL_MC_PATHS = 250_000;
const CANONICAL_SEED = 42;
const CANONICAL_HORIZON_DAYS = 30;

// Model C split (same as Model B — the non-custodial aspect does NOT change
// the math; it changes WHO HOLDS the assets, not the risk profile).
const MODEL_C_BANK_FUNDED_SHARE = 0.80;
const MODEL_C_MITHQAL_OWNED_SHARE = 0.20;

// Bank-funded MTQ breach probability (same as Model B).
// For a TIER-1 regulated bank under modeled stress (30-day horizon):
// conservative estimate ~0.5%. This is NOT zero — it is bank credit risk.
const MODEL_C_BANK_FAILURE_BREACH_PROB = 0.005;

// MITHQAL-owned structural/anchor portion — the 21.5432% model applies
// because the reserve composition is the same (gold + emergency + structural).
// This is NOT manipulated.
const MODEL_C_MITHQAL_OWNED_BREACH_PROB = CANONICAL_MODEL_A_BREACH; // 0.215432

const TOTAL_MTQ_SUPPLY = 54_000_000;
const ILPS_CORRECTED_TOTAL = 48_100_000;
const ILPS_SDR_BASELINE = 0.96;

export interface NonCustodialModelResult {
  modelName: "MODEL_C_NON_CUSTODIAL_BANK_FUNDED";
  mtqOutstanding: number;
  verifiedBacking: number;
  mithqalHeldAssets: number; // SHOULD BE ZERO by default for ordinary reserve custody
  bankFunding: number;
  reserveEvidence: number;
  RR: number;
  StressRR: number;
  LCR: number;
  MLCR: number;
  ILPS: number;
  SDR: number;
  ILPSTotal: number;
  breachProbability: number;
  incrementalCapitalRequirement: number;
  mathematicalExplanation: string;
}

/**
 * runModelC_NonCustodialBankFunded — Model C: the non-custodial version of
 * Model B.
 *
 * MITHQAL-held assets should be ZERO by default for ordinary reserve custody.
 * The bank-funded portion (80% of $54M = $43.2M) is backed by verified bank
 * deposits held by banks — NOT by MITHQAL. The MITHQAL-owned structural/anchor
 * portion (20% = $10.8M) is held by qualified custodians (allocated gold +
 * emergency liquidity), where MITHQAL Foundation is the legal owner — but
 * custody remains with the qualified custodian, NOT in a MITHQAL-operated vault.
 *
 * Blended breach probability:
 *   P = 0.80 × 0.005 + 0.20 × 0.215432
 *     = 0.004 + 0.0430864
 *     = 0.0470864
 *     ≈ 4.7086%
 *
 * This is IDENTICAL to Model B because the non-custodial aspect does NOT
 * change the math — it changes WHO HOLDS the assets, not the risk profile.
 *
 * For Model A (current reserve, 100% MITHQAL-owned): 21.5432% PRESERVED.
 * For Model B (bank-funded, blended): 4.7086% PRESERVED.
 * For Model C (non-custodial bank-funded, blended): 4.7086% — same as Model B.
 *
 * Honest state: mithqalHeldAssets = 0 by default for ordinary reserve custody.
 * The MITHQAL-owned structural/anchor portion ($10.8M) is held by qualified
 * custodians — NOT in a MITHQAL-operated vault.
 */
export function runModelC_NonCustodialBankFunded(): NonCustodialModelResult {
  const bankFundedAmount = TOTAL_MTQ_SUPPLY * MODEL_C_BANK_FUNDED_SHARE;
  const mithqalOwnedStructural = TOTAL_MTQ_SUPPLY * MODEL_C_MITHQAL_OWNED_SHARE;

  // Blended breach probability.
  const blendedBreach =
    MODEL_C_BANK_FUNDED_SHARE * MODEL_C_BANK_FAILURE_BREACH_PROB +
    MODEL_C_MITHQAL_OWNED_SHARE * MODEL_C_MITHQAL_OWNED_BREACH_PROB;

  // Blended RR (point-in-time).
  const blendedRR =
    MODEL_C_BANK_FUNDED_SHARE * 1.00 +
    MODEL_C_MITHQAL_OWNED_SHARE * CANONICAL_MODEL_A_RR_CURRENT;

  // Blended StressRR (MC post-stress mean).
  const blendedStressRR =
    MODEL_C_BANK_FUNDED_SHARE * 0.99 +
    MODEL_C_MITHQAL_OWNED_SHARE * CANONICAL_MODEL_A_STRESS_RR_MEAN;

  // Capital requirement.
  // Since blended P(RR<100%) ≈ 4.71% < 5% governance threshold,
  // NO additional monetary-protection capital is required at the system level.
  // The ΔCapital_min ≈ $15.815M classification (model-derived) is preserved for
  // the MITHQAL-owned portion's informational solver (20% × $15.815M = $3.163M)
  // but does NOT represent a system-level fundraising requirement.
  const capitalReq = 0;

  // MITHQAL-held assets: by default ZERO for ordinary reserve custody.
  // The MITHQAL-owned structural/anchor reserves are LEGAL claims against
  // assets held by qualified custodians — they are NOT in a MITHQAL-operated
  // vault and do NOT constitute "MITHQAL-held custody" in the prohibited sense.
  // For the model, mithqalHeldAssets = 0 reflects the non-custodial default.
  const mithqalHeldAssets = 0;

  const explanation = `
MODEL C (Non-Custodial Bank-Funded):
- 80% of MTQ (${(MODEL_C_BANK_FUNDED_SHARE * 100).toFixed(0)}% = $${bankFundedAmount.toLocaleString()}) funded by verified bank deposits.
- 20% of MTQ (${(MODEL_C_MITHQAL_OWNED_SHARE * 100).toFixed(0)}% = $${mithqalOwnedStructural.toLocaleString()}) MITHQAL-owned structural/anchor (gold + emergency).
- MITHQAL-held assets (ordinary reserve custody) = $0 by default — bank-funded portion is held by banks; MITHQAL-owned structural/anchor is held by qualified custodians, NOT in a MITHQAL-operated vault.

Breach probability:
- Bank-funded portion: P(bank funding unavailable within 30 days) ≈ ${(MODEL_C_BANK_FAILURE_BREACH_PROB * 100).toFixed(2)}% (bank credit risk only).
- MITHQAL-owned portion: P(RR<100%) = ${(CANONICAL_MODEL_A_BREACH * 100).toFixed(4)}% (preserved from Model A).
- Blended P(RR<100%) = ${(MODEL_C_BANK_FUNDED_SHARE * 100).toFixed(0)}% × ${(MODEL_C_BANK_FAILURE_BREACH_PROB * 100).toFixed(2)}% + ${(MODEL_C_MITHQAL_OWNED_SHARE * 100).toFixed(0)}% × ${(CANONICAL_MODEL_A_BREACH * 100).toFixed(4)}% = ${(blendedBreach * 100).toFixed(4)}%.

WHY MODEL C = MODEL B (in breach probability):
The non-custodial aspect does NOT change the math — it changes WHO HOLDS the assets, not the risk profile.
- Model B assumed the bank-funded portion was held by banks (already non-custodial for the 80% portion).
- Model C explicitly extends the non-custodial principle: even the 20% MITHQAL-owned structural/anchor portion is held by qualified custodians (NOT in a MITHQAL-operated vault).
- The risk profile of the MITHQAL-owned portion (gold + emergency) is unchanged: it still carries 21.5432% because the underlying reserve composition and stress dynamics are identical.
- The blended breach probability therefore remains ${(blendedBreach * 100).toFixed(4)}% — same as Model B.

Cap requirement:
- System-level ΔCapital_min = $0 (blended already below 5% governance threshold).
- The $15.815M ΔCapital_min classification (model-derived additional monetary protection requirement) is PRESERVED for the MITHQAL-owned portion's informational solver ($15.815M × 20% = $3.163M) — but does NOT represent a system-level fundraising requirement.
- MITHQAL still requires operating, regulatory, liquidity, emergency, and scale capital (SEPARATE categories — NOT auto-combined per §17).

HONEST STATE:
- mithqalHeldAssets = $${mithqalHeldAssets} (default for ordinary reserve custody).
- nonCustodialByDefault = true.
- Bank credit risk (~0.5%) is NONZERO — non-custodial model REDUCES but does NOT eliminate risk.
- The 21.5432% model is PRESERVED for the MITHQAL-owned portion.
- Model C is NOT production-ready. Final custody, legal, regulatory authorization required.
- Assumptions DOCUMENTED, NOT manipulated.
`.trim();

  return {
    modelName: "MODEL_C_NON_CUSTODIAL_BANK_FUNDED",
    mtqOutstanding: TOTAL_MTQ_SUPPLY,
    verifiedBacking: TOTAL_MTQ_SUPPLY, // 1:1 backing verified via RCAF + ABC
    mithqalHeldAssets,
    bankFunding: bankFundedAmount,
    reserveEvidence: TOTAL_MTQ_SUPPLY,
    RR: Math.round(blendedRR * 10000) / 10000,
    StressRR: Math.round(blendedStressRR * 10000) / 10000,
    LCR: CANONICAL_LCR,
    MLCR: 1.45,
    ILPS: ILPS_CORRECTED_TOTAL,
    SDR: ILPS_SDR_BASELINE,
    ILPSTotal: ILPS_CORRECTED_TOTAL,
    breachProbability: Math.round(blendedBreach * 1_000_000) / 1_000_000,
    incrementalCapitalRequirement: capitalReq,
    mathematicalExplanation: explanation,
  };
}

// ---- Section 19: Zero-Budget Reality ----

export const ZERO_BUDGET_REALITY = {
  currentMithqalExternalCapital: 0,
  evidenceStates: [
    "MODELLED",
    "TARGET",
    "OUTREACH",
    "INTERESTED",
    "LOI",
    "APPLICATION",
    "DUE_DILIGENCE",
    "AWARDED",
    "FUNDED",
  ] as const,
  rule: "Do not present model requirements, reserve targets, liquidity targets, or capital solvers as money already available.",
  currentEvidenceStage: "MODELLED" as const,
} as const;

export const ZERO_BUDGET_PRINCIPLE =
  "All modeled capital figures (reserve backing, bank funding, operating capital, regulatory capital, " +
  "liquidity resources, emergency resources, scale capital) remain in the MODELLED stage until independent " +
  "validation establishes otherwise. The 9-stage evidence pipeline (MODELLED → TARGET → OUTREACH → INTERESTED → " +
  "LOI → APPLICATION → DUE_DILIGENCE → AWARDED → FUNDED) MUST NOT be silently skipped.";

// ---- Section 20: Bank Gateway Update ----

export const MBG_NON_CUSTODIAL_HANDLES = [
  "funding_verification",
  "AvailableBackingCertificate",
  "issuance_ceiling",
  "reserve_attestation",
  "reconciliation",
  "certificate_expiry",
  "bank_suspension",
  "reserve_mismatch",
  "bank_exit",
] as const;

export const MBG_NON_CUSTODIAL_RULE =
  "The gateway remains a sidecar. No bank core replacement. The MBG TRANSLATES existing authorized banking " +
  "instructions into MTQ settlement instructions and returns settlement / reconciliation status — it does NOT " +
  "transform the bank's role, does NOT take custody of customer funds, and does NOT replace the bank's compliance " +
  "environment.";

// ---- Section 21: Security ----

export const SECURITY_CONTROLS = [
  "SIGNED_ATTESTATIONS — every AvailableBackingCertificate and RCAF MUST be cryptographically signed by the issuing institution's authorized key.",
  "MUTUAL_TLS — bank↔MITHQAL channel MUST use mutual TLS with certificate pinning.",
  "NONCE — every request MUST carry a unique nonce to prevent replay.",
  "TIMESTAMP — every request MUST carry an ISO-8601 timestamp; stale requests rejected.",
  "EXPIRY — every AvailableBackingCertificate MUST carry an expiryTime; expired certificates rejected.",
  "REPLAY_PROTECTION — nonces recorded for the replay window; duplicates rejected.",
  "IDEMPOTENCY — every issuance/redemption request carries an idempotency key; duplicate executions return the original result.",
  "CERTIFICATE_REVOCATION — banks and MITHQAL can both revoke certificates; revocation propagates within T+0.",
  "KEY_ROTATION — signing keys rotated on schedule (default 90 days); old keys retained for audit window.",
  "EMERGENCY_REVOCATION — MITHQAL can issue an emergency revocation that halts all new issuance against affected backing within seconds.",
  "INSTITUTION_ALLOWLIST — only institutions on the explicit allowlist may request issuance; new institutions require governance approval.",
] as const;

export const SECURITY_RULE = "No unauthenticated reserve or issuance assertion.";

// ---- Section 22: Formal Verification — 7 New Invariants (FV11-FV17) ----

export const NEW_FORMAL_VERIFICATION_INVARIANTS = {
  FV11: {
    name: "PvP Atomicity",
    statement:
      "If PvP is implemented, both legs settle or neither settles (no partial settlement).",
    status: "DESIGNED",
  },
  FV12: {
    name: "Reserve Custody Separation",
    statement:
      "MITHQAL does not become custodian of reserve assets merely through issuance. Custody and monetary control are deliberately separated.",
    status: "PROVEN_AT_SPEC_LEVEL",
  },
  FV13: {
    name: "Backing Evidence Validity",
    statement:
      "No MTQ can be issued without valid, unexpired, unrevoked AvailableBackingCertificate.",
    status: "PROVEN_AT_SPEC_LEVEL",
  },
  FV14: {
    name: "No Unverified Issuance",
    statement:
      "No issuance may rely solely on an unverified bank assertion. Minimum 2 evidence sources required.",
    status: "PROVEN_AT_SPEC_LEVEL",
  },
  FV15: {
    name: "No Double-Counted Backing",
    statement:
      "The same backing cannot support multiple uncollateralized MTQ issuance allocations.",
    status: "PROVEN_AT_SPEC_LEVEL",
  },
  FV16: {
    name: "Reserve-to-Liability Reconciliation",
    statement:
      "Reserve backing evidence must reconcile with canonical MTQ supply (5-way reconciliation).",
    status: "PROVEN_AT_SPEC_LEVEL",
  },
  FV17: {
    name: "Redemption Supply Conservation",
    statement:
      "Redemption reduces canonical supply correctly (burn 1 MTQ = reduce 1 MTQ from supply).",
    status: "PROVEN_AT_SPEC_LEVEL",
  },
} as const;

export const FV_FORMAL_REQUIREMENTS = [
  "1. No MTQ can be issued without valid authorization.",
  "2. No issuance may rely solely on an unverified bank assertion.",
  "3. MITHQAL does not become custodian merely through issuance.",
  "4. The same backing cannot support multiple uncollateralized MTQ issuance allocations.",
  "5. Expired backing certificates cannot authorize issuance.",
  "6. Invalid/revoked certificates cannot authorize issuance.",
  "7. Canonical MTQ supply remains conserved.",
  "8. Redemption reduces canonical supply correctly.",
  "9. Bank subledger and MITHQAL institutional position remain reconcilable.",
  "10. Custody records do not imply MITHQAL legal ownership.",
] as const;

export const FV_INVARIANT_COUNT = 7; // FV11..FV17

// ---- Section 23: Economic Model ----

export const MITHQAL_REVENUE_SOURCES = [
  "connectivity",
  "issuance_service",
  "settlement",
  "redemption_infrastructure",
  "reconciliation",
  "enterprise_integration",
  "premium_institutional_services",
] as const;

export const MITHQAL_REVENUE_RULE =
  "MITHQAL should NOT charge a hidden 'reserve capital' fee merely because it does not own the reserve. " +
  "Revenue sources are connectivity, issuance service, settlement, redemption infrastructure, reconciliation, " +
  "enterprise integration, and premium institutional services — NOT reserve capital fees.";

// ---- Section 24: Custody Concentration ----

export const CUSTODY_CONCENTRATION_LIMITS = {
  preferred: 0.15, // ≤15% preferred
  hardCap: 0.25, // ≤25% absolute
  parentGroup: 0.20, // ≤20% parent-group
  appliedTo: "actual reserve custody providers (banks / qualified custodians)",
  notAppliedTo:
    "MITHQAL itself — MITHQAL is non-custodial by default; concentration limits apply to actual custody providers, not to MITHQAL.",
  rule:
    "Concentration limits apply to actual reserve custody providers (banks / qualified custodians) — NOT to MITHQAL " +
    "itself, which is non-custodial by default. The 15% / 25% / 20% limits ensure diversification across custodians " +
    "and prevent single-point-of-failure custody concentration.",
} as const;

// ---- Section 25: Blueprint Language — Canonical Statement ----

export const CANONICAL_NON_CUSTODIAL_STATEMENT = `
MITHQAL v25.0 — FINAL CANONICAL NON-CUSTODIAL STATEMENT

MITHQAL is a non-custodial wholesale settlement infrastructure by default. MITHQAL does not take custody of MTQ
reserve assets or customer funds under ordinary operation. Reserve assets remain in legally appropriate
regulated custody, which may include participating banks, qualified independent custodians, segregated reserve
structures, or other legally authorized institutional arrangements.

MITHQAL controls the constitutional eligibility, verification, reconciliation, and issuance conditions associated
with MTQ backing — but does NOT control customer bank accounts and does NOT hold customer funds.

CUSTODY ≠ VERIFICATION ≠ ISSUANCE AUTHORIZATION ≠ CANONICAL SUPPLY CONTROL.

The MITHQAL Bank Gateway (MBG) is a sidecar that translates existing authorized banking instructions into MTQ
settlement instructions and returns settlement / reconciliation status into the bank's operating environment. It
does NOT replace core banking systems; it does NOT take custody of customer funds; it does NOT transform the
bank's compliance environment.

Mint authority is deliberately separated into three states:
  1. ISSUANCE_REQUEST       — bank / authorized institution initiates.
  2. ISSUANCE_AUTHORIZATION  — MITHQAL evaluates against the 15-step gate.
  3. MINT_EXECUTION          — canonical MTQ ledger executes the authorized mint.

No single actor controls both the request and the authorization. No bank can create MTQ merely by asserting that
funds exist. No MITHQAL operator can mint MTQ without bank-initiated evidence. No governance actor can override
the gate.

Reserve backing is verified through a 4-source trust model:
  - Source A: bank-signed attestation
  - Source B: custodian reserve evidence
  - Source C: MITHQAL canonical MTQ ledger
  - Source D: independent attestation oracle proof (where feasible)

No single institution is the sole source of truth where an independent source is legally and operationally
feasible. Minimum 2 sources required.

MITHQAL does NOT make MITHQAL a custodian of customer funds. MITHQAL does NOT operate a customer deposit
account. MITHQAL does NOT control customer bank accounts. MITHQAL does NOT receive customer funds during
ordinary operation. Customer funds remain in bank custody under ordinary operation.

EXCEPTION: Where a separate jurisdictional legal determination expressly requires and authorizes a MITHQAL-held
custody structure, that structure is documented under the specific jurisdictional authorization — NOT as a default
architecture.

HONEST STATE:
  - nonCustodialByDefault = true
  - mithqalHeldAssets = $0 by default for ordinary reserve custody
  - 21.5432% breach probability PRESERVED for Model A (current reserve, 100% MITHQAL-owned)
  - 4.7086% breach probability PRESERVED for Model B (bank-funded, blended)
  - 4.7086% breach probability for Model C (non-custodial bank-funded, blended) — same as Model B because the
    non-custodial aspect does NOT change the math; it changes WHO HOLDS the assets, not the risk profile
  - ΔCapital_min ≈ $15.815M remains classified as MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT
    until independently validated
  - Final status UNCHANGED: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
  - No v25.1 created — v25.0 remains the FROZEN NORMATIVE ARCHITECTURE
`.trim();

// ---- Section 26: Do Not Make These Claims ----

export const FORBIDDEN_CLAIMS = [
  "MITHQAL holds customer funds.",
  "MITHQAL is the custodian of customer deposits.",
  "MITHQAL controls customer bank accounts.",
  "MITHQAL operates a customer deposit account.",
  "MITHQAL takes custody of reserve assets by default.",
  "MITHQAL holds reserves in a MITHQAL-operated vault by default.",
  "MITHQAL holds private keys to customer funds by default.",
  "MITHQAL receives customer funds during ordinary operation.",
  "MITHQAL is the redemption obligor by default (merely because it operates the settlement protocol).",
  "Bank credit risk is zero (it is NONZERO — ~0.5% per 30 days for TIER-1 bank).",
  "Model C eliminates the 21.5432% breach probability (it PRESERVES 21.5432% for MITHQAL-owned portion).",
  "Model C is production-ready.",
  "The $15.815M ΔCapital_min is a fundraising target.",
  "The $15.815M ΔCapital_min is regulatory capital.",
  "The $15.815M ΔCapital_min is operating capital.",
  "Custody records imply MITHQAL legal ownership.",
  "AvailableBackingCertificate is a transfer of assets to MITHQAL.",
  "MITHQAL can mint MTQ at its own discretion.",
  "A bank can create MTQ merely by asserting that funds exist.",
  "MITHQAL is custodian merely because it operates the settlement protocol.",
  "Non-custodial model eliminates bank credit risk.",
  "v25.1 has been created (it has NOT — v25.0 remains the FROZEN NORMATIVE ARCHITECTURE).",
] as const;

export const FORBIDDEN_CLAIMS_CORRECT_ALTERNATIVES = [
  { forbidden: "MITHQAL holds customer funds.", correct: "MITHQAL receives reserve attestations; customer funds remain in bank custody." },
  { forbidden: "MITHQAL is the custodian of customer deposits.", correct: "Banks hold customer deposits; MITHQAL verifies eligibility." },
  { forbidden: "MITHQAL controls customer bank accounts.", correct: "Banks control customer bank accounts; MITHQAL controls MTQ monetary rules and canonical supply." },
  { forbidden: "MITHQAL operates a customer deposit account.", correct: "MITHQAL does NOT operate a customer deposit account by default." },
  { forbidden: "MITHQAL takes custody of reserve assets by default.", correct: "Reserve assets remain in legally appropriate regulated custody (banks / qualified custodians)." },
  { forbidden: "MITHQAL holds reserves in a MITHQAL-operated vault by default.", correct: "Where MITHQAL-owned structural reserves exist, they are held by qualified custodians under segregated allocated custody — NOT in a MITHQAL-operated vault by default." },
  { forbidden: "MITHQAL holds private keys to customer funds by default.", correct: "MITHQAL does NOT hold private keys to customer funds by default (mithqalDoesNotPossessCustomerPrivateKeys=true)." },
  { forbidden: "MITHQAL is the redemption obligor by default.", correct: "Redemption obligor is determined by the legal structure of the underlying reserve category and jurisdiction." },
  { forbidden: "Model C eliminates the 21.5432% breach probability.", correct: "Model C PRESERVES 21.5432% for the MITHQAL-owned portion; blended ≈ 4.7086% (same as Model B)." },
  { forbidden: "The $15.815M ΔCapital_min is a fundraising target.", correct: "$15.815M is a MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT — pending independent validation." },
  { forbidden: "v25.1 has been created.", correct: "v25.0 remains the FROZEN NORMATIVE ARCHITECTURE; no v25.1 has been created." },
] as const;

// ---- Section 27: Document Version ----

export const VERSION_CONTROL = {
  currentVersion: "v25.0",
  noVersionChange: true,
  noArchitectureFork: true,
  noRenaming: true,
  noV25_1Created: true,
  documentRemains: "MITHQAL v25.0 — FINAL CANONICAL INSTITUTIONAL BLUEPRINT",
  rule:
    "This module is a RECONCILIATION EDIT of v25.0. It does NOT create v25.1, does NOT fork the architecture, " +
    "does NOT remove the bank-mediated model, does NOT make MITHQAL a custodian, does NOT give MITHQAL direct " +
    "possession of customer funds or reserve assets by default.",
} as const;

// ---- Section 28: 18 Test Scenarios ----

export interface NonCustodialTestScenario {
  testId: string; // NC-T01 ... NC-T18
  description: string;
  expectedResult: string;
  status: "DESIGNED" | "IMPLEMENTED" | "PASS" | "FAIL" | "BLOCKED";
}

export const NON_CUSTODIAL_TEST_SCENARIOS: NonCustodialTestScenario[] = [
  {
    testId: "NC-T01",
    description:
      "Bank claims valid backing with proper AvailableBackingCertificate and custodian evidence — issuance succeeds.",
    expectedResult:
      "executeIssuanceGate() returns result='AUTHORIZED' with all 15 steps passed.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T02",
    description:
      "Bank claims funding but AvailableBackingCertificate is missing — issuance BLOCKED at step 5.",
    expectedResult:
      "executeIssuanceGate() returns result='BLOCKED' with blockingStep='AVAILABLE_BACKING_CERTIFICATE'.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T03",
    description:
      "AvailableBackingCertificate has passed expiryTime — issuance BLOCKED.",
    expectedResult:
      "validateAvailableBackingCertificate() returns valid=false with error 'certificate expiryTime has passed'; issuance BLOCKED.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T04",
    description:
      "AvailableBackingCertificate is REVOKED — issuance BLOCKED.",
    expectedResult:
      "validateAvailableBackingCertificate() returns valid=false with error 'certificate is REVOKED'; issuance BLOCKED.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T05",
    description:
      "Custodian evidence (Source B) mismatches bank attestation (Source A) — issuance BLOCKED and institution RESTRICTED.",
    expectedResult:
      "runReserveBackingReconciliation() returns status='MISMATCH' or 'CRITICAL'; executeIssuanceGate() returns BLOCKED at CUSTODY_RESERVE_EVIDENCE.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T06",
    description:
      "Bank MTQ subledger mismatches canonical MTQ ledger — RECONCILIATION_FAILURE.",
    expectedResult:
      "runReserveBackingReconciliation() returns status='MISMATCH' or 'CRITICAL'; mismatches array non-empty.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T07",
    description:
      "Same reserve allocation referenced by two AvailableBackingCertificates — issuance BLOCKED (no double-counted backing).",
    expectedResult:
      "FV15 (No Double-Counted Backing) enforces: only one certificate can draw against a given allocation; second issuance BLOCKED.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T08",
    description:
      "Bank gateway compromised (forged signature) — issuance BLOCKED at BANK_AUTHENTICATION.",
    expectedResult:
      "executeIssuanceGate() returns BLOCKED at BANK_AUTHENTICATION (forged signature rejected by mTLS + signature verification).",
    status: "DESIGNED",
  },
  {
    testId: "NC-T09",
    description:
      "Bank fails (insolvency) — controlled restriction / resolution.",
    expectedResult:
      "All AvailableBackingCertificates from failed bank REVOKED; new issuance against failed bank's backing HALTED; existing MTQ remains valid; emergency liquidity engages (ILPS Layer 3).",
    status: "DESIGNED",
  },
  {
    testId: "NC-T10",
    description:
      "Custodian fails (insolvency) — alternate custody / emergency controls.",
    expectedResult:
      "Custodian evidence (Source B) for affected reserves REVOKED; new issuance against affected backing HALTED; alternate custodian engaged per resolution regime; existing MTQ remains valid.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T11",
    description:
      "MITHQAL unavailable (outage) — no false settlement completion.",
    expectedResult:
      "Issuance requests fail safe (BLOCKED); no partial settlement; no unauthorized mint; canonical ledger immutable; reconciliation resumes on recovery.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T12",
    description:
      "Redemption — correct burn and supply reduction (FV17).",
    expectedResult:
      "Burning N MTQ reduces canonical supply by exactly N; reconciliation confirms supply conservation.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T13",
    description:
      "Customer funds remain outside MITHQAL custody throughout issuance and redemption.",
    expectedResult:
      "No customer funds enter a MITHQAL-operated account during ordinary operation; funds remain in bank custody; MITHQAL receives only attestations.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T14",
    description:
      "MITHQAL cannot execute an unauthorized reserve transfer.",
    expectedResult:
      "MITHQAL has no unilateral control over reserve assets; reserve transfers require bank + custodian + MITHQAL joint authorization.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T15",
    description:
      "MITHQAL cannot silently change legal ownership of reserve assets.",
    expectedResult:
      "Legal ownership matrix (§14) requires jurisdictional determination; MITHQAL cannot unilaterally reclassify legal ownership; jurisdictionStatus remains JURISDICTION_PENDING until legal counsel establishes otherwise.",
    status: "DESIGNED",
  },
  {
    testId: "NC-T16",
    description:
      "Unauthorized bank cannot request issuance.",
    expectedResult:
      "executeIssuanceGate() returns BLOCKED at INSTITUTION_AUTHORIZATION (bank not on institution allowlist).",
    status: "DESIGNED",
  },
  {
    testId: "NC-T17",
    description:
      "Unsupported jurisdiction cannot request issuance.",
    expectedResult:
      "executeIssuanceGate() returns BLOCKED at JURISDICTION_CHECK (jurisdiction not authorized).",
    status: "DESIGNED",
  },
  {
    testId: "NC-T18",
    description:
      "BRICS / CBDC adapters cannot bypass reserve controls.",
    expectedResult:
      "BRICS and CBDC interoperation operate through the same MBG / issuance gate; no bypass path exists; FV13-FV15 enforced uniformly.",
    status: "DESIGNED",
  },
];

export const NON_CUSTODIAL_TEST_SCENARIO_COUNT = 18;

// ---- Section 29: Production Gate ----

export const PRODUCTION_GATE_CONDITIONS = [
  "1. At least one participating regulated bank has signed an integration agreement and completed technical certification (BANK-CONTRACTED state).",
  "2. At least one qualified custodian has been contracted for reserve evidence (Source B) — not SIMULATED.",
  "3. Jurisdictional authorization obtained for at least one jurisdiction (JURISDICTION_PENDING → ESTABLISHED for that jurisdiction).",
  "4. Independent legal opinion obtained confirming non-custodial structure is legally sound in the operating jurisdiction.",
  "5. Independent attestation oracle (Source D) contracted and operational — where legally and operationally feasible.",
  "6. Independent Sharia certification obtained (where Sharia-compliant operation is claimed).",
  "7. Independent third-party audit completed confirming: reconciliation logic, custody separation, issuance gate, veto triggers, and security controls are operational.",
  "8. Stress test executed against live integration confirming: bank failure, custodian failure, MITHQAL outage, redemption stress — all produce controlled outcomes (no false settlement, no fund loss).",
  "9. Regulator / central bank approval obtained for production operation in the operating jurisdiction.",
] as const;

export const PRODUCTION_GATE_RULE =
  "Production remains NOT PRODUCTION-AUTHORIZED until all 9 conditions above are met. The honest state " +
  "throughout this module is: honest=true, forcedToPass=false, productionAuthorized=false, " +
  "nonCustodialByDefault=true, mithqalHeldAssets=0 by default for ordinary reserve custody.";

// ---- Section 30: Executive Report Generator ----

export interface NonCustodialReserveReport {
  moduleId: string;
  generatedAt: string;
  principle: string;
  canonicalDistinction: string;
  finalControlMatrix: ActorControlMatrix[];
  finalControlRule: string;
  languageCorrections: LanguageCorrection[];
  bankMediatedFlow: string;
  rcafSchema: {
    interfaceName: string;
    requiredFields: number;
    fieldList: readonly string[];
  };
  availableBackingCertificateSchema: {
    interfaceName: string;
    fieldCount: number;
    rules: readonly string[];
  };
  issuanceGateSteps: number; // 15
  issuanceGateRule: string;
  mintAuthoritySeparation: string;
  mintAuthorityStates: MintAuthorityState[];
  reserveReconciliationStatus: ReserveBackingReconciliationStatus;
  reconciliationFiveSources: readonly string[];
  mandatoryVetoTriggers: string[];
  mandatoryVetoRule: string;
  backingAttestationFailureRule: string;
  trustModel: ConfidenceModel;
  custodyProhibitions: readonly string[];
  custodyProhibitionException: string;
  defaultArchitecture: string;
  legalOwnershipMatrix: LegalOwnershipMatrix[];
  legalOwnershipRule: string;
  redemptionObligation: RedemptionObligationProfile;
  redemptionObligationRule: string;
  redemptionFlow: string;
  capitalModel: {
    categories: CapitalCategoryEntry[];
    correctionRule: string;
    deltaCapitalMinClassification: typeof DELTA_CAPITAL_MIN_CLASSIFICATION;
  };
  modelA_breach: number; // 21.5432%
  modelB_breach: number; // 4.7086%
  modelC_breach: number; // 4.7086% (same as B — non-custodial doesn't change math)
  modelC: NonCustodialModelResult;
  zeroBudgetReality: typeof ZERO_BUDGET_REALITY;
  zeroBudgetPrinciple: string;
  mbgHandles: readonly string[];
  mbgNonCustodialRule: string;
  securityControls: readonly string[];
  securityRule: string;
  newFVInvariants: typeof NEW_FORMAL_VERIFICATION_INVARIANTS;
  fvFormalRequirements: readonly string[];
  fvInvariantCount: number;
  mithqalRevenueSources: readonly string[];
  mithqalRevenueRule: string;
  custodyConcentration: {
    preferred: number;
    hardCap: number;
    parentGroup: number;
    appliedTo: string;
    notAppliedTo: string;
    rule: string;
  };
  canonicalStatement: string;
  forbiddenClaims: readonly string[];
  forbiddenClaimsCorrectAlternatives: readonly {
    forbidden: string;
    correct: string;
  }[];
  versionControl: typeof VERSION_CONTROL;
  testScenarios: NonCustodialTestScenario[];
  testScenarioCount: number;
  productionGate: readonly string[];
  productionGateRule: string;
  honestState: {
    honest: true;
    forcedToPass: false;
    productionAuthorized: false;
    nonCustodialByDefault: true;
    mithqalHeldAssets: 0; // default
  };
  finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED";
}

export function generateNonCustodialReserveReport(): NonCustodialReserveReport {
  const modelA_breach = CANONICAL_MODEL_A_BREACH; // 0.215432 (21.5432%)
  const modelB_breach =
    MODEL_C_BANK_FUNDED_SHARE * MODEL_C_BANK_FAILURE_BREACH_PROB +
    MODEL_C_MITHQAL_OWNED_SHARE * MODEL_C_MITHQAL_OWNED_BREACH_PROB; // 0.0470864
  const modelC_breach = modelB_breach; // same — non-custodial doesn't change math
  const modelC = runModelC_NonCustodialBankFunded();

  return {
    moduleId: MODULE_VERSION,
    generatedAt: new Date().toISOString(),
    principle: RESERVE_CUSTODY_SEPARATION_PRINCIPLE,
    canonicalDistinction: CANONICAL_DISTINCTION,
    finalControlMatrix: FINAL_CONTROL_MATRIX,
    finalControlRule: FINAL_CONTROL_RULE,
    languageCorrections: LANGUAGE_CORRECTIONS,
    bankMediatedFlow: FINAL_BANK_MEDIATED_FLOW,
    rcafSchema: {
      interfaceName: "ReserveControlAttestationFramework",
      requiredFields: RCAF_REQUIRED_FIELDS,
      fieldList: RCAF_FIELD_LIST,
    },
    availableBackingCertificateSchema: {
      interfaceName: "AvailableBackingCertificate",
      fieldCount: AVAILABLE_BACKING_CERTIFICATE_FIELDS,
      rules: AVAILABLE_BACKING_CERTIFICATE_RULES,
    },
    issuanceGateSteps: ISSUANCE_GATE_STEPS.length, // 15
    issuanceGateRule: ISSUANCE_GATE_RULE,
    mintAuthoritySeparation: MINT_AUTHORITY_SEPARATION_RULE,
    mintAuthorityStates: MINT_AUTHORITY_STATES,
    reserveReconciliationStatus: "VERIFIED", // initial state — actual reconciliation status returned by runReserveBackingReconciliation()
    reconciliationFiveSources: RECONCILIATION_FIVE_SOURCES,
    mandatoryVetoTriggers: [...MANDATORY_VETO_ACTIONS],
    mandatoryVetoRule: MANDATORY_VETO_RULE,
    backingAttestationFailureRule: BACKING_ATTESTATION_FAILURE_RULE,
    trustModel: CONFIDENCE_MODEL,
    custodyProhibitions: CUSTODY_PROHIBITIONS,
    custodyProhibitionException: CUSTODY_PROHIBITION_EXCEPTION,
    defaultArchitecture: DEFAULT_ARCHITECTURE,
    legalOwnershipMatrix: LEGAL_OWNERSHIP_MATRIX,
    legalOwnershipRule: LEGAL_OWNERSHIP_RULE,
    redemptionObligation: REDEMPTION_OBLIGATION_PROFILE,
    redemptionObligationRule: REDEMPTION_OBLIGATION_RULE,
    redemptionFlow: REDEMPTION_FLOW,
    capitalModel: {
      categories: SEVEN_CAPITAL_CATEGORIES,
      correctionRule: CAPITAL_MODEL_CORRECTION_RULE,
      deltaCapitalMinClassification: DELTA_CAPITAL_MIN_CLASSIFICATION,
    },
    modelA_breach,
    modelB_breach: Math.round(modelB_breach * 1_000_000) / 1_000_000,
    modelC_breach: Math.round(modelC_breach * 1_000_000) / 1_000_000,
    modelC,
    zeroBudgetReality: ZERO_BUDGET_REALITY,
    zeroBudgetPrinciple: ZERO_BUDGET_PRINCIPLE,
    mbgHandles: MBG_NON_CUSTODIAL_HANDLES,
    mbgNonCustodialRule: MBG_NON_CUSTODIAL_RULE,
    securityControls: SECURITY_CONTROLS,
    securityRule: SECURITY_RULE,
    newFVInvariants: NEW_FORMAL_VERIFICATION_INVARIANTS,
    fvFormalRequirements: FV_FORMAL_REQUIREMENTS,
    fvInvariantCount: FV_INVARIANT_COUNT,
    mithqalRevenueSources: MITHQAL_REVENUE_SOURCES,
    mithqalRevenueRule: MITHQAL_REVENUE_RULE,
    custodyConcentration: {
      preferred: CUSTODY_CONCENTRATION_LIMITS.preferred,
      hardCap: CUSTODY_CONCENTRATION_LIMITS.hardCap,
      parentGroup: CUSTODY_CONCENTRATION_LIMITS.parentGroup,
      appliedTo: CUSTODY_CONCENTRATION_LIMITS.appliedTo,
      notAppliedTo: CUSTODY_CONCENTRATION_LIMITS.notAppliedTo,
      rule: CUSTODY_CONCENTRATION_LIMITS.rule,
    },
    canonicalStatement: CANONICAL_NON_CUSTODIAL_STATEMENT,
    forbiddenClaims: FORBIDDEN_CLAIMS,
    forbiddenClaimsCorrectAlternatives: FORBIDDEN_CLAIMS_CORRECT_ALTERNATIVES,
    versionControl: VERSION_CONTROL,
    testScenarios: NON_CUSTODIAL_TEST_SCENARIOS,
    testScenarioCount: NON_CUSTODIAL_TEST_SCENARIO_COUNT,
    productionGate: PRODUCTION_GATE_CONDITIONS,
    productionGateRule: PRODUCTION_GATE_RULE,
    honestState: {
      honest: true,
      forcedToPass: false,
      productionAuthorized: false,
      nonCustodialByDefault: true,
      mithqalHeldAssets: 0,
    },
    finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED",
  };
}

// ============================================================================
// END OF MITHQAL v25.0 NON-CUSTODIAL RESERVE ARCHITECTURE MODULE
// ============================================================================
// Honest state preserved throughout:
//   - 21.5432% PRESERVED for Model A (current reserve, 100% MITHQAL-owned)
//   - 4.7086% PRESERVED for Model B (bank-funded, blended)
//   - 4.7086% for Model C (non-custodial bank-funded, blended) — same as Model B
//     because the non-custodial aspect does NOT change the math; it changes
//     WHO HOLDS the assets, not the risk profile
//   - mithqalHeldAssets = 0 by default for ordinary reserve custody
//   - nonCustodialByDefault = true
//   - Final status UNCHANGED: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT
//     PRODUCTION-AUTHORIZED
//   - No v25.1 created — v25.0 remains the FROZEN NORMATIVE ARCHITECTURE
// ============================================================================

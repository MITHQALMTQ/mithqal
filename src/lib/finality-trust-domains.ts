// src/lib/finality-trust-domains.ts
//
// MITHQAL v25.3.2 — CANONICAL FINALITY TRUST DOMAINS (single source of truth)
// Per M-directive (trace 1a0ee14af343a085):
//   "Refactor the finality architecture into three trust domains:
//    - Domain A — Policy & Authorization: Eligibility, compliance, risk, DMCE, monetary authorization.
//    - Domain B — Finality Attestation: Independent finality proof/oracle.
//    - Domain C — Execution: Deterministic ledger/mint execution.
//    Separate: keys, privileged credentials, deployment permissions, operational roles, audit evidence.
//    Keep the existing seven technical enforcement layers, but stop describing them as seven
//    independently owned institutional controls.
//    Add tests for cross-domain compromise and privilege escalation."
//
// This is the SINGLE CANONICAL SOURCE for the three trust domains. All other
// modules MUST import from here. Any inline trust-domain definition elsewhere
// is a CONTRADICTION per the contradiction scanner.

// === The Three Trust Domains ===

export type TrustDomainId =
  | "DOMAIN_A_POLICY_AUTHORIZATION"
  | "DOMAIN_B_FINALITY_ATTESTATION"
  | "DOMAIN_C_EXECUTION";

export interface TrustDomainKeyConfig {
  keyType: string; // e.g., "POLICY_SIGNING_KEY", "ATTESTATION_ORACLE_KEY", "EXECUTION_MINT_KEY"
  custodyEntity: string; // who holds the key (internal entity)
  rotationCadence: string; // e.g., "90 days", "30 days", "1 year"
  hsmRequirement: boolean; // hardware security module required?
}

export interface TrustDomainRole {
  roleName: string; // e.g., "POLICY_AUTHORIZER", "ATTESTATION_ORACLE", "MINT_EXECUTOR"
  domainId: TrustDomainId;
  permissions: string[]; // list of permissions
  cannotAccessDomains: TrustDomainId[]; // domains this role CANNOT access (cross-domain isolation)
}

export interface TrustDomain {
  id: TrustDomainId;
  name: string;
  description: string;
  purpose: string;
  // What this domain owns
  ownsKeys: TrustDomainKeyConfig[];
  ownsRoles: TrustDomainRole[];
  ownsCredentials: string[]; // privileged credential names
  ownsDeploymentPermissions: string[]; // deployment actions this domain can perform
  ownsAuditEvidence: string[]; // audit evidence types this domain produces
  // Cross-domain isolation rules
  cannotAccessDomains: TrustDomainId[]; // domains this domain CANNOT access
  // Status (per v25.3.2 status markers)
  status: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION";
}

// === Domain A — Policy & Authorization ===
//
// Per M-directive: "Eligibility, compliance, risk, DMCE and monetary authorization."
//
// This domain owns:
// - Eligibility checks (BM-09)
// - Compliance screening (AML/KYC/sanctions)
// - Risk assessment (BM-12 Bank Risk, BM-13 System Risk)
// - DMCE — Dynamic Minting Capacity Evaluation (BM-14)
// - Monetary Authorization (BM-15)
//
// This domain does NOT own:
// - Finality attestation (Domain B's job)
// - Mint execution (Domain C's job)
//
// Keys in this domain: POLICY_SIGNING_KEY (used to sign monetary authorizations)
// Role: POLICY_AUTHORIZER (cannot access Domain B or C keys)
export const DOMAIN_A_POLICY_AUTHORIZATION: TrustDomain = {
  id: "DOMAIN_A_POLICY_AUTHORIZATION",
  name: "Domain A — Policy & Authorization",
  description:
    "Owns eligibility, compliance, risk, DMCE, and monetary authorization. " +
    "This domain signs Monetary Authorization (BM-15) but does NOT execute mint or " +
    "attest finality. Cross-domain isolation: cannot access Domain B (attestation) " +
    "or Domain C (execution) keys or roles.",
  purpose: "Policy decisions + monetary authorization (BM-09 through BM-15)",
  ownsKeys: [
    {
      keyType: "POLICY_SIGNING_KEY",
      custodyEntity: "Jozour, LLC (Operating) — future: MITHQAL Foundation",
      rotationCadence: "90 days",
      hsmRequirement: true,
    },
  ],
  ownsRoles: [
    {
      roleName: "POLICY_AUTHORIZER",
      domainId: "DOMAIN_A_POLICY_AUTHORIZATION",
      permissions: [
        "evaluate_eligibility (BM-09)",
        "verify_compliance (BM-03 equivalent at MITHQAL)",
        "assess_bank_risk (BM-12)",
        "assess_system_risk (BM-13)",
        "compute_dmce (BM-14)",
        "issue_monetary_authorization (BM-15)",
      ],
      cannotAccessDomains: ["DOMAIN_B_FINALITY_ATTESTATION", "DOMAIN_C_EXECUTION"],
    },
  ],
  ownsCredentials: ["POLICY_SIGNING_KEY", "ELIGIBILITY_DB_READ", "COMPLIANCE_DB_READ"],
  ownsDeploymentPermissions: [
    "deploy_policy_rules",
    "deploy_dmce_parameters",
    "deploy_risk_thresholds",
  ],
  ownsAuditEvidence: [
    "monetary_authorization_records (BM-15)",
    "dmce_computation_logs (BM-14)",
    "eligibility_decisions (BM-09)",
    "compliance_screening_results (BM-03)",
    "risk_assessment_reports (BM-12, BM-13)",
  ],
  cannotAccessDomains: ["DOMAIN_B_FINALITY_ATTESTATION", "DOMAIN_C_EXECUTION"],
  status: "ACTIVE",
};

// === Domain B — Finality Attestation ===
//
// Per M-directive: "Independent finality proof/oracle."
//
// This domain owns:
// - Finality verification (BM-16A)
// - Independent oracle (gold/silver price attestation)
// - Finality proof generation
//
// This domain does NOT own:
// - Policy decisions (Domain A's job)
// - Mint execution (Domain C's job)
//
// CRITICAL: This domain MUST be independent from Domain A and Domain C to ensure
// finality attestation is not compromised by policy or execution.
//
// Keys in this domain: ATTESTATION_ORACLE_KEY (used to sign finality proofs)
// Role: ATTESTATION_ORACLE (cannot access Domain A or C keys)
export const DOMAIN_B_FINALITY_ATTESTATION: TrustDomain = {
  id: "DOMAIN_B_FINALITY_ATTESTATION",
  name: "Domain B — Finality Attestation",
  description:
    "Independent finality proof/oracle. Owns BM-16A (Finality Verification) + the " +
    "oracle that attests to gold/silver prices + reserve composition. MUST be " +
    "independent from Domain A (policy) and Domain C (execution) to ensure finality " +
    "is not compromised. Cross-domain isolation: cannot access Domain A or C keys.",
  purpose: "Independent finality attestation (BM-16A) + oracle proofs",
  ownsKeys: [
    {
      keyType: "ATTESTATION_ORACLE_KEY",
      custodyEntity: "Independent Oracle Operator (TBD — PENDING_LEGAL_VERIFICATION)",
      rotationCadence: "30 days",
      hsmRequirement: true,
    },
    {
      keyType: "FINALITY_PROOF_SIGNING_KEY",
      custodyEntity: "Independent Finality Committee (TBD — PENDING_LEGAL_VERIFICATION)",
      rotationCadence: "90 days",
      hsmRequirement: true,
    },
  ],
  ownsRoles: [
    {
      roleName: "ATTESTATION_ORACLE",
      domainId: "DOMAIN_B_FINALITY_ATTESTATION",
      permissions: [
        "fetch_oracle_prices (gold, silver, FX)",
        "verify_finality_conditions (BM-16A)",
        "sign_finality_proof",
        "publish_finality_attestation",
      ],
      cannotAccessDomains: ["DOMAIN_A_POLICY_AUTHORIZATION", "DOMAIN_C_EXECUTION"],
    },
    {
      roleName: "FINALITY_VERIFIER",
      domainId: "DOMAIN_B_FINALITY_ATTESTATION",
      permissions: ["verify_finality_proof", "audit_finality_attestation"],
      cannotAccessDomains: ["DOMAIN_A_POLICY_AUTHORIZATION", "DOMAIN_C_EXECUTION"],
    },
  ],
  ownsCredentials: [
    "ATTESTATION_ORACLE_KEY",
    "FINALITY_PROOF_SIGNING_KEY",
    "ORACLE_DATA_FEED_READ",
  ],
  ownsDeploymentPermissions: [
    "deploy_oracle_endpoints",
    "deploy_finality_verification_rules",
  ],
  ownsAuditEvidence: [
    "finality_attestation_records (BM-16A)",
    "oracle_price_attestations",
    "finality_proof_signatures",
    "oracle_data_feed_logs",
  ],
  cannotAccessDomains: ["DOMAIN_A_POLICY_AUTHORIZATION", "DOMAIN_C_EXECUTION"],
  status: "ACTIVE",
};

// === Domain C — Execution ===
//
// Per M-directive: "Deterministic ledger/mint execution."
//
// This domain owns:
// - Mint execution (BM-16B) — only if settlement asset = MTQ
// - Canonical ledger updates
// - MTQ supply adjustments
//
// This domain does NOT own:
// - Policy decisions (Domain A's job)
// - Finality attestation (Domain B's job)
//
// CRITICAL: This domain executes ONLY after Domain A issues Monetary Authorization
// AND Domain B attests finality. Cross-domain isolation prevents unauthorized mint.
//
// Keys in this domain: EXECUTION_MINT_KEY (used to sign mint transactions)
// Role: MINT_EXECUTOR (cannot access Domain A or B keys)
export const DOMAIN_C_EXECUTION: TrustDomain = {
  id: "DOMAIN_C_EXECUTION",
  name: "Domain C — Execution",
  description:
    "Deterministic ledger/mint execution. Owns BM-16B (Mint Execution) — only runs " +
    "if settlement asset = MTQ. Executes ONLY after Domain A issues Monetary Authorization " +
    "(BM-15) AND Domain B attests finality (BM-16A). Cross-domain isolation prevents " +
    "unauthorized mint.",
  purpose: "Deterministic ledger/mint execution (BM-16B) — only if settlement asset = MTQ",
  ownsKeys: [
    {
      keyType: "EXECUTION_MINT_KEY",
      custodyEntity: "Jozour, LLC (Operating) — future: MITHQAL Technology Entity",
      rotationCadence: "90 days",
      hsmRequirement: true,
    },
    {
      keyType: "DEPLOYER_PRIVATE_KEY",
      custodyEntity: "Jozour, LLC (Operating) — gated by CRON_SECRET",
      rotationCadence: "90 days",
      hsmRequirement: false, // software key, gated by CRON_SECRET
    },
  ],
  ownsRoles: [
    {
      roleName: "MINT_EXECUTOR",
      domainId: "DOMAIN_C_EXECUTION",
      permissions: [
        "execute_mint (BM-16B) — only after BM-15 + BM-16A pass",
        "update_canonical_ledger",
        "adjust_mtq_supply",
      ],
      cannotAccessDomains: [
        "DOMAIN_A_POLICY_AUTHORIZATION",
        "DOMAIN_B_FINALITY_ATTESTATION",
      ],
    },
  ],
  ownsCredentials: [
    "EXECUTION_MINT_KEY",
    "DEPLOYER_PRIVATE_KEY",
    "CANONICAL_LEDGER_WRITE",
  ],
  ownsDeploymentPermissions: [
    "deploy_mint_contract",
    "deploy_canonical_ledger_updates",
  ],
  ownsAuditEvidence: [
    "mint_execution_records (BM-16B)",
    "canonical_ledger_updates",
    "mtq_supply_adjustments",
    "deployer_key_usage_logs",
  ],
  cannotAccessDomains: [
    "DOMAIN_A_POLICY_AUTHORIZATION",
    "DOMAIN_B_FINALITY_ATTESTATION",
  ],
  status: "ACTIVE",
};

// === The Three Trust Domains (canonical array) ===
export const TRUST_DOMAINS: TrustDomain[] = [
  DOMAIN_A_POLICY_AUTHORIZATION,
  DOMAIN_B_FINALITY_ATTESTATION,
  DOMAIN_C_EXECUTION,
];

// === Cross-Domain Isolation Rules ===
export const CROSS_DOMAIN_ISOLATION_RULES = {
  // Rule 1: Each domain has its OWN keys (no shared keys)
  noSharedKeys: {
    rule: "Each trust domain has its OWN keys. No key is shared across domains.",
    reason:
      "Per M-directive: 'Separate keys.' Each domain's keys are custody-separated and " +
      "rotation-independent. A compromise of one domain's keys does NOT compromise the others.",
    enforcement:
      "TrustDomain.ownsKeys is domain-specific. No key type appears in 2+ domains.",
  },
  // Rule 2: Each domain has its OWN privileged credentials
  noSharedCredentials: {
    rule: "Each trust domain has its OWN privileged credentials. No credential is shared.",
    reason: "Per M-directive: 'Separate privileged credentials.'",
    enforcement:
      "TrustDomain.ownsCredentials is domain-specific. No credential appears in 2+ domains.",
  },
  // Rule 3: Each domain has its OWN deployment permissions
  noSharedDeployment: {
    rule: "Each trust domain has its OWN deployment permissions. No deployment action is shared.",
    reason: "Per M-directive: 'Separate deployment permissions.'",
    enforcement: "TrustDomain.ownsDeploymentPermissions is domain-specific.",
  },
  // Rule 4: Each domain has its OWN operational roles
  noSharedRoles: {
    rule: "Each trust domain has its OWN operational roles. A role in one domain CANNOT access another domain.",
    reason: "Per M-directive: 'Separate operational roles.'",
    enforcement:
      "TrustDomainRole.cannotAccessDomains lists domains the role CANNOT access.",
  },
  // Rule 5: Each domain produces its OWN audit evidence
  noSharedAuditEvidence: {
    rule: "Each trust domain produces its OWN audit evidence. Audit evidence is domain-attributed.",
    reason: "Per M-directive: 'Separate audit evidence.'",
    enforcement: "TrustDomain.ownsAuditEvidence is domain-specific.",
  },
  // Rule 6: Domain C cannot execute without Domain A authorization + Domain B attestation
  executionRequiresAuthorizationAndAttestation: {
    rule: "Domain C (Execution) cannot execute without Domain A (Monetary Authorization, BM-15) + Domain B (Finality Attestation, BM-16A).",
    reason:
      "This is the cross-domain check: Domain C's mint execution (BM-16B) requires BOTH " +
      "Domain A's authorization AND Domain B's attestation. No single domain can mint alone.",
    enforcement:
      "BM-16B handler must verify BM-15 signature (Domain A) + BM-16A signature (Domain B) before executing.",
  },
};

// === Seven Technical Enforcement Layers (PRESERVED but NOT described as 7 institutional controls) ===
//
// Per M-directive: "Keep the existing seven technical enforcement layers, but stop
// describing them as seven independently owned institutional controls."
//
// The 7 technical enforcement layers are PRESERVED as technical controls, but they
// are NOT 7 independently owned institutional controls. They are technical enforcement
// mechanisms that operate WITHIN the three trust domains.

export const SEVEN_TECHNICAL_ENFORCEMENT_LAYERS = {
  description:
    "The seven technical enforcement layers are PRESERVED as technical controls. " +
    "However, per M-directive, they are NOT seven independently owned institutional " +
    "controls. They are technical enforcement mechanisms that operate WITHIN the " +
    "three trust domains (A: Policy/Authorization, B: Finality Attestation, C: Execution).",
  layers: [
    {
      id: "L1",
      name: "Institution Authorization",
      trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION" as TrustDomainId,
      isIndependentlyOwned: false,
    },
    {
      id: "L2",
      name: "Customer KYC/KYB",
      trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION" as TrustDomainId,
      isIndependentlyOwned: false,
    },
    {
      id: "L3",
      name: "AML/Sanctions Screening",
      trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION" as TrustDomainId,
      isIndependentlyOwned: false,
    },
    {
      id: "L4",
      name: "AvailableBackingCertificate Verification",
      trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION" as TrustDomainId,
      isIndependentlyOwned: false,
    },
    {
      id: "L5",
      name: "Reserve Evidence Verification (RCAF)",
      trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION" as TrustDomainId,
      isIndependentlyOwned: false,
    },
    {
      id: "L6",
      name: "Finality Attestation",
      trustDomain: "DOMAIN_B_FINALITY_ATTESTATION" as TrustDomainId,
      isIndependentlyOwned: false,
    },
    {
      id: "L7",
      name: "Canonical Mint Execution",
      trustDomain: "DOMAIN_C_EXECUTION" as TrustDomainId,
      isIndependentlyOwned: false,
    },
  ],
  // CRITICAL: Per M-directive, these are NOT 7 independently owned institutional controls
  isSevenIndependentlyOwnedInstitutionalControls: false,
  // They are technical enforcement layers within the 3 trust domains
  isTechnicalEnforcementWithinThreeTrustDomains: true,
};

// === API ===

export function getTrustDomain(id: TrustDomainId): TrustDomain | undefined {
  return TRUST_DOMAINS.find((d) => d.id === id);
}

export function getTrustDomainForRole(roleName: string): TrustDomain | undefined {
  return TRUST_DOMAINS.find((d) => d.ownsRoles.some((r) => r.roleName === roleName));
}

export function getTrustDomainForKey(keyType: string): TrustDomain | undefined {
  return TRUST_DOMAINS.find((d) => d.ownsKeys.some((k) => k.keyType === keyType));
}

// Cross-domain access check: can role X in domain D1 access domain D2?
export function canRoleAccessDomain(
  roleName: string,
  targetDomainId: TrustDomainId
): boolean {
  const sourceDomain = getTrustDomainForRole(roleName);
  if (!sourceDomain) return false;
  const role = sourceDomain.ownsRoles.find((r) => r.roleName === roleName);
  if (!role) return false;
  // Check cannotAccessDomains
  if (role.cannotAccessDomains.includes(targetDomainId)) return false;
  return true;
}

// === Status ===
export const TRUST_DOMAINS_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" =
  "ACTIVE";
export const TRUST_DOMAINS_VERSION = "v25.3.2-M2-1.0";
export const TRUST_DOMAINS_SOURCE = "src/lib/finality-trust-domains.ts";

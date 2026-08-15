# MITHQAL Bank Security Guide

> **File:** MITHQAL_BANK_SECURITY_GUIDE.md
> **Task ID:** MBG-DOCUMENTATION
> **Source module:** `src/lib/mithqal-bank-gateway.ts` (§10 BankSecurityProfile, §17 ConnectivitySecurityProfile, §18 ZeroTrustVerification, §19 GatewayFailureState, §20 MithqalSideFailureState)
> **Document version:** v25.0-mbg-amendment-1.0
> **Honest state declaration:** **INTEGRATION-READY — 0 banks contracted.**
> **Canonical principle:** *"TRANSLATION, NOT TRANSFORMATION."*

---

## Table of Contents

1. [Security Philosophy — Bank-Controlled, Zero-Trust, Defense in Depth](#1-security-philosophy--bank-controlled-zero-trust-defense-in-depth)
2. [Bank-Controlled Key Management (BANK_HSM / BANK_MPC / BANK_APPROVED_KMS)](#2-bank-controlled-key-management-bank_hsm--bank_mpc--bank_approved_kms)
3. [Connectivity Security — 12 Mandatory Controls](#3-connectivity-security--12-mandatory-controls)
4. [Zero-Trust Architecture — Every Request Authenticates](#4-zero-trust-architecture--every-request-authenticates)
5. [Bank-Controlled Signing Authority + Corporate Signatory Controls](#5-bank-controlled-signing-authority--corporate-signatory-controls)
6. [Limits Profile (Per-Transaction / Daily / Weekly / Corridor-Specific)](#6-limits-profile-per-transaction--daily--weekly--corridor-specific)
7. [Fraud Controls (Bank-Side + MITHQAL-Side)](#7-fraud-controls-bank-side--mithqal-side)
8. [Recovery Process (HSM Failure, Key Compromise, Gateway Failure, MITHQAL Failure)](#8-recovery-process-hsm-failure-key-compromise-gateway-failure-mithqal-failure)
9. [Gateway Failure State Handling](#9-gateway-failure-state-handling)
10. [MITHQAL-Side Failure Handling (PENDING_MITHQAL_CONFIRMATION)](#10-mithqal-side-failure-handling-pending_mithqal_confirmation)
11. [Emergency Revocation Procedures](#11-emergency-revocation-procedures)
12. [Security Audit Requirements](#12-security-audit-requirements)
13. [Deployment Model Security (MODEL_A / MODEL_B / MODEL_C)](#13-deployment-model-security-model_a--model_b--model_c)
14. [Incident Response Playbook](#14-incident-response-playbook)

---

## 1. Security Philosophy — Bank-Controlled, Zero-Trust, Defense in Depth

### 1.1 The Three Pillars

The MITHQAL Bank Gateway (MBG) security architecture rests on three pillars:

```
                  +-----------------------+
                  | 1. Bank-Controlled    |
                  |    Security           |
                  | (keys stay at bank)   |
                  +-----------------------+
                            |
                            v
                  +-----------------------+
                  | 2. Zero-Trust          |
                  |    Architecture       |
                  | (every request        |
                  |  authenticates)       |
                  +-----------------------+
                            |
                            v
                  +-----------------------+
                  | 3. Defense in Depth    |
                  |    (12 connectivity   |
                  |     controls + 5-way  |
                  |     reconciliation)   |
                  +-----------------------+
```

### 1.2 Pillar 1 — Bank-Controlled Security

The canonical invariant, hard-typed in the source module:

```typescript
mithqalDoesNotPossessCustomerPrivateKeys: true;   // ALWAYS TRUE
```

This is a literal type, not a runtime flag. The type system forbids setting it to `false`. The bank's HSM / MPC / approved KMS retains all private keys; MITHQAL receives only public attestation key fingerprints + signed messages.

**The canonical rule (§10 of source):**

> *"MITHQAL never possesses customer private keys. The bank's HSM / MPC / approved KMS retains all private keys. MITHQAL receives only public attestation keys + signed messages."*

### 1.3 Pillar 2 — Zero-Trust Architecture

The MBG enforces zero-trust on every request (§18 of source). Every request must pass 5 authentications:

1. **INSTITUTION** — institution is registered + active + not under sanction.
2. **GATEWAY** — gateway is certified + `internalState = ACTIVE` + not suspended.
3. **SIGNING_KEY** — signing key fingerprint matches registered attestation key.
4. **POLICY_VERSION** — request policy version matches current authorized policy.
5. **TRANSACTION_AUTHORIZATION** — transaction authorization reference is valid + not expired.

Default-deny posture: deny unless all 5 authentications pass.

### 1.4 Pillar 3 — Defense in Depth

The MBG applies 12 mandatory connectivity security controls (§17 of source) plus the 5-way reconciliation (§13 of source) plus the gateway failure recovery plan (§19) plus the MITHQAL-side failure handling (§20). Each layer independently catches different classes of attack.

### 1.5 What "Bank-Controlled" Means Practically

| Function | Bank controls | MITHQAL controls |
|---|---|---|
| Signing keys (private) | Bank HSM / MPC / approved KMS | Nothing — never sees private keys |
| Signing keys (public) | Bank publishes fingerprints | MITHQAL verifies signatures against registered fingerprints |
| Authentication (MFA / SSO) | Bank officer MFA, SSO, RBAC | MITHQAL receives signed messages only |
| Authorization (RBAC / ABAC) | Bank's existing authorization model | MITHQAL adds zero-trust layer on top |
| Limits / velocity | Bank's limits profile | MITHQAL enforces at gateway layer |
| Fraud detection | Bank's existing fraud monitoring | MITHQAL adds network-level anomaly detection |
| Recovery | Bank's documented runbook | MITHQAL adds `RecoveryPlan` execution |
| Emergency revocation | Bank may request revocation | MITHQAL council / regulator may also trigger |

---

## 2. Bank-Controlled Key Management (BANK_HSM / BANK_MPC / BANK_APPROVED_KMS)

### 2.1 The Three Key Management Types

The `BankSecurityProfile.keyManagementType` field accepts three values:

```typescript
keyManagementType: "BANK_HSM" | "BANK_MPC" | "BANK_APPROVED_KMS";
```

| Type | Description | Typical use |
|---|---|---|
| `BANK_HSM` | Hardware Security Module — single-tenant or multi-tenant HSM appliance (FIPS-140-2 L3 / FIPS-140-3 L3 / Common Criteria EAL5+). | Tier-1 money-center banks with mature HSM infrastructure. |
| `BANK_MPC` | Multi-Party Computation — threshold signature scheme where multiple parties (bank officers, key custodians) jointly sign without any single party seeing the full private key. | Tier-1 / Tier-2 banks requiring M-of-N signing authority. |
| `BANK_APPROVED_KMS` | Bank-approved cloud Key Management Service (AWS KMS, Azure Key Vault, Google Cloud KMS, HashiCorp Vault) — bank retains key custody; cloud provider hosts the KMS infrastructure. | Tier-2 / Tier-3 banks using cloud-based key management. |

### 2.2 What All Three Types Have in Common

Regardless of which type the bank chooses:

1. **Private keys never leave the bank's custody.** MITHQAL receives only public key fingerprints.
2. **Signing happens inside the bank's controlled environment.** The MBG sidecar sends unsigned payloads to the bank's HSM / MPC / KMS; the bank's key management system signs and returns the signature.
3. **Key rotation is bank-controlled.** The bank decides the rotation interval (default 90 days); MITHQAL enforces the rotation policy.
4. **Emergency revocation is bank-initiated.** The bank may request immediate revocation; MITHQAL council / regulator may also trigger.

### 2.3 BANK_HSM (Hardware Security Module)

The bank deploys an HSM appliance (FIPS-140-2 L3 / FIPS-140-3 L3 / Common Criteria EAL5+) in its own data center. The MBG sidecar communicates with the HSM via PKCS#11 or vendor-specific API.

```
+----------------+        unsigned payload        +----------------+
| MBG sidecar    |  ============================> | Bank HSM       |
|                |                                | (FIPS-140-3 L3)|
+----------------+  <============================ +----------------+
                    signature (signed inside HSM)
```

**Pros:**
- Maximum control — keys never leave the bank's physical premises.
- Compliance — FIPS-140-3 L3 / Common Criteria EAL5+ are recognized by all major regulators.
- Performance — HSMs are optimized for signing throughput.

**Cons:**
- Capital expenditure — HSMs are expensive ($10K-$100K per appliance).
- Operational overhead — bank must operate, monitor, and back up the HSM.

**Best for:** Tier-1 money-center banks with mature HSM infrastructure.

### 2.4 BANK_MPC (Multi-Party Computation)

The bank uses MPC (e.g. Torus, Fireblocks, Curve, or self-hosted MPC) to distribute the signing key across multiple parties. No single party can sign alone; the threshold (e.g. 2-of-3) must be met.

```
+----------+   +----------+   +----------+
| Signer 1 |   | Signer 2 |   | Signer 3 |
| (HSM-A)  |   | (HSM-B)  |   | (HSM-C)  |
+----------+   +----------+   +----------+
      |              |              |
      v              v              v
   +---------------------------------+
   | MPC protocol (2-of-3 threshold)|
   +---------------------------------+
                  |
                  v
        signature (signed via MPC)
```

**Pros:**
- No single point of failure — losing one signer does not compromise the key.
- Distributed trust — multiple bank officers must approve signing.
- Cryptographic guarantee — even if one HSM is compromised, the key remains secure.

**Cons:**
- Complexity — MPC protocols are harder to operate than single HSM.
- Performance — MPC signing is slower than direct HSM signing.
- Vendor lock-in — bank must choose an MPC vendor or self-host.

**Best for:** Tier-1 / Tier-2 banks requiring M-of-N signing authority.

### 2.5 BANK_APPROVED_KMS (Bank-Approved Cloud Key Management Service)

The bank uses a cloud-based KMS (AWS KMS, Azure Key Vault, Google Cloud KMS, HashiCorp Vault) that the bank has approved for institutional use. The bank retains key custody; the cloud provider hosts the KMS infrastructure.

```
+----------------+        unsigned payload        +----------------+
| MBG sidecar    |  ============================> | Bank-approved  |
|                |                                | cloud KMS      |
+----------------+  <============================ +----------------+
                    signature (signed inside KMS)
                            |
                            v
                   +-----------------+
                   | Bank retains    |
                   | key custody     |
                   | (KMS policy)    |
                   +-----------------+
```

**Pros:**
- Lower capital expenditure — pay-per-use pricing.
- Easier operations — cloud provider operates the KMS.
- Elasticity — scale signing throughput up/down as needed.

**Cons:**
- Cloud dependency — bank relies on cloud provider availability.
- Compliance verification — bank must verify the KMS meets its compliance requirements.
- Data sovereignty — bank must verify the KMS respects its data-sovereignty requirements.

**Best for:** Tier-2 / Tier-3 banks using cloud-based key management.

### 2.6 The Canonical Rule

```typescript
export const BANK_SECURITY_CANONICAL_RULE =
  "MITHQAL never possesses customer private keys. " +
  "The bank's HSM / MPC / approved KMS retains all private keys. " +
  "MITHQAL receives only public attestation keys + signed messages." as const;
```

This rule is enforced structurally:

- The `MithqalBankGateway.attestationKeys` field carries only public-key fingerprints + algorithm + rotation policy + key custody binding. It has no field for private keys.
- The module-load invariant `_INVARIANTS` verifies that all 3 SIMULATED `BankSecurityProfile` instances have `mithqalDoesNotPossessCustomerPrivateKeys = true`.
- The `DO_NOT_MODIFY_RULES[DNM-08]` rule explicitly forbids "Allowing MITHQAL to possess or process customer private keys."

---

## 3. Connectivity Security — 12 Mandatory Controls

The `ConnectivitySecurityProfile` (§17 of source) defines 12 mandatory security controls. All 12 must be enabled and populated for the gateway to be considered secure. The `verifyConnectivitySecurity(profile)` function returns `valid = false` if any control is missing.

### 3.1 The 12 Controls

| # | Control | Purpose | Key fields |
|---|---|---|---|
| 1 | **Mutual TLS** | Both sides authenticate via X.509 certs. | `bankCertFingerprint`, `mithqalCertFingerprint`, `minTlsVersion` (TLSv1.2 / TLSv1.3), `certRotationDays` |
| 2 | **Signed requests** | Every request body signed by bank's attestation key. | `signatureAlgorithm` (ECDSA-P256 / Ed25519 / RSA-PSS-4096), `requiredFields` |
| 3 | **Hardware-backed signing** | Bank's signing keys live in HSM / MPC. | `hsmType` (FIPS-140-2-L3 / FIPS-140-3-L3 / Common Criteria EAL5+ / BANK_APPROVED_EQUIVALENT) |
| 4 | **Nonce** | Single-use number to prevent replay. | `minLengthBytes` (16+), `uniquenessWindow` (24h) |
| 5 | **Timestamp** | Request timestamp for replay protection. | `maxSkewSeconds` (60) |
| 6 | **Replay protection** | Combined nonce + timestamp + idempotency. | `cacheTtlSeconds` (86400) |
| 7 | **Idempotency** | Duplicate submissions of same key rejected. | `keyDerivation` (BANK_PROVIDED / HASH_OF_PAYLOAD), `cacheTtlSeconds` |
| 8 | **Message expiration** | Requests older than max age rejected. | `maxAgeSeconds` (86400) |
| 9 | **IP network controls** | Network-layer allowlisting. | `bankIpAllowlist`, `mithqalIpAllowlist` |
| 10 | **Institution allowlist** | Only registered institution may connect. | `allowedInstitutionIds` |
| 11 | **Key rotation** | Periodic rotation of all keys. | `rotationIntervalDays` (90), `emergencyRevocationEnabled` |
| 12 | **Emergency revocation** | Ability to immediately revoke bank's access. | `revocationTimeSeconds` (60), `revocationAuthority` (MITHQAL_COUNCIL / BANK_REQUEST / REGULATOR_ORDER) |

### 3.2 The Verification Function

```typescript
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
```

### 3.3 The Canonical Rule

```typescript
export const CONNECTIVITY_SECURITY_CANONICAL_RULE =
  "No unauthenticated bank-to-MITHQAL settlement request." as const;
```

### 3.4 Default Values (SIMULATED Profile)

The source module's `SIMULATED_CONNECTIVITY_SECURITY_PROFILE` provides reference defaults:

```typescript
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
```

### 3.5 Why 12 (Not Fewer)

Each control addresses a distinct threat vector:

| Control | Threat addressed |
|---|---|
| Mutual TLS | Man-in-the-middle (MITM) attacks, impersonation |
| Signed requests | Tampering, repudiation |
| Hardware-backed signing | Key exfiltration from commodity compute |
| Nonce | Replay attacks |
| Timestamp | Stale request attacks, clock-skew exploits |
| Replay protection | Combined replay + nonce reuse attacks |
| Idempotency | Duplicate submission (network retry, double-click) |
| Message expiration | Stale message processing (delayed delivery) |
| IP network controls | Unauthorized IP access, DDoS |
| Institution allowlist | Unauthorized institution access |
| Key rotation | Long-term key compromise |
| Emergency revocation | Active compromise, regulator action |

Removing any single control leaves a gap. The MBG enforces all 12 by design.

---

## 4. Zero-Trust Architecture — Every Request Authenticates

### 4.1 The Zero-Trust Posture

The MBG enforces zero-trust on every request (§18 of source). The posture is **default-deny**: deny unless all 5 authentications pass.

```typescript
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
```

### 4.2 The 5 Authentications

Every `GatewayRequest` must pass all 5 authentications:

```typescript
export interface GatewayRequest {
  institutionId: string;                          // 1. INSTITUTION
  gatewayId: string;                              // 2. GATEWAY
  signingKeyFingerprint: string;                  // 3. SIGNING_KEY
  policyVersion: string;                            // 4. POLICY_VERSION
  transactionAuthorizationReference: string;       // 5. TRANSACTION_AUTHORIZATION
  signature: string;
  nonce: string;
  timestamp: string;
  payload: unknown;
}
```

### 4.3 The Enforcement Function

```typescript
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
```

### 4.4 The Default-Deny Posture

If `authenticated = false`, the request is denied. There is no "warn and allow" path — failed authentication means denial.

### 4.5 The Known Institution Registry

The `KNOWN_INSTITUTION_IDS` set is currently SIMULATED:

```typescript
const KNOWN_INSTITUTION_IDS = new Set<string>([
  "INST-SIMULATED-001",
  "INST-SIMULATED-002",
  "INST-SIMULATED-003",
  "SIMULATED-INSTITUTION",
]);
```

In production, this is backed by `bank-onboarding.ts` `InstitutionRegistry`. Only institutions that have completed bank-onboarding are registered.

---

## 5. Bank-Controlled Signing Authority + Corporate Signatory Controls

### 5.1 Signing Authority

The `BankSecurityProfile.signingAuthority` field defines who in the bank is authorized to sign MTQ instructions:

```typescript
signingAuthority: {
  authorizedSigners: string[];          // bank officer DIDs or system IDs
  multiSigThreshold: number;            // e.g. 2-of-3 for institutional flows
  thresholdScheme: "M_OF_N" | "SINGLE_OFFICER_EMERGENCY";
}
```

### 5.2 Threshold Schemes

| Scheme | Description | Typical use |
|---|---|---|
| `M_OF_N` | M-of-N threshold — requires M of N authorized signers to approve. Default for institutional flows. | Tier-1 / Tier-2 banks. Default 2-of-3. |
| `SINGLE_OFFICER_EMERGENCY` | Single-officer emergency signing — one authorized signer can sign in emergency. Used only for smaller banks with simpler authority structures. | Tier-3 banks. |

### 5.3 SIMULATED Profiles (Per Tier)

The source module provides 3 SIMULATED signing authority profiles:

| Tier | Signers | Threshold | Scheme |
|---|---|---|---|
| TIER_1 | 3 signers | 2-of-3 | M_OF_N |
| TIER_2 | 3 signers | 2-of-3 | M_OF_N |
| TIER_3 | 2 signers | 1-of-2 | SINGLE_OFFICER_EMERGENCY |

### 5.4 Authentication Model

```typescript
authenticationModel: {
  mfaRequired: true;
  mfaMethods: ("HARDWARE_TOKEN" | "FIDO2" | "BIOMETRIC" | "OTP")[];
  ssoIntegration: "SAML" | "OIDC" | "NONE";
  sessionTimeoutMinutes: number;
}
```

| Tier | MFA methods | SSO | Session timeout |
|---|---|---|---|
| TIER_1 | HARDWARE_TOKEN, FIDO2, BIOMETRIC | SAML | 15 minutes |
| TIER_2 | FIDO2, OTP | OIDC | 30 minutes |
| TIER_3 | OTP, BIOMETRIC | OIDC | 30 minutes |

### 5.5 Authorization Model

```typescript
authorizationModel: {
  rbacRoles: string[];
  abacPolicies: string[];
  separationOfDutiesEnforced: true;
}
```

RBAC roles per tier (SIMULATED):

| Tier | RBAC roles | ABAC policies |
|---|---|---|
| TIER_1 | BANK_OPS, BANK_COMPLIANCE, BANK_TREASURY, BANK_OFFICER | amount-threshold, corridor-allowlist, jurisdiction-allowlist |
| TIER_2 | BANK_OPS, BANK_COMPLIANCE, BANK_OFFICER | amount-threshold, corridor-allowlist |
| TIER_3 | BANK_OPS, BANK_OFFICER | amount-threshold |

`separationOfDutiesEnforced = true` is mandatory — the same person cannot both initiate and approve a transaction.

### 5.6 Corporate Signatory Controls

```typescript
corporateSignatoryControls: {
  corporateInitiatesInstructions: boolean;       // corporate may draft
  bankApprovesBeforeSettlement: true;            // bank always approves
  dualApprovalThreshold: number;                 // amount above which dual approval required
}
```

| Tier | Corporate initiates | Bank approves before settlement | Dual approval threshold |
|---|---|---|---|
| TIER_1 | true | true | $1,000,000 |
| TIER_2 | true | true | $500,000 |
| TIER_3 | true | true | $250,000 |

The corporate customer may draft instructions, but the bank always approves before settlement. For amounts above the dual-approval threshold, two bank officers must approve.

---

## 6. Limits Profile (Per-Transaction / Daily / Weekly / Corridor-Specific)

### 6.1 The Limits Profile

```typescript
limitsProfile: {
  maxSingleTransactionUSD: number;
  dailyLimitUSD: number;
  monthlyLimitUSD: number;
  velocityChecksEnabled: true;
}
```

### 6.2 SIMULATED Limits Per Tier

| Tier | Max single | Daily | Monthly |
|---|---|---|---|
| TIER_1 | $100,000,000 | $500,000,000 | $5,000,000,000 |
| TIER_2 | $25,000,000 | $100,000,000 | $1,000,000,000 |
| TIER_3 | $5,000,000 | $20,000,000 | $200,000,000 |

### 6.3 Velocity Checks

`velocityChecksEnabled = true` is mandatory. The bank's existing velocity rules (e.g. max N transactions per minute, max M transactions per hour) apply.

### 6.4 Corridor-Specific Limits

The `MTQSettlementInstruction.corridor` field (e.g. "JP-US-WHOLESALE") allows corridor-specific limits. The bank may configure different limits for different corridors (e.g. higher limits for domestic wholesale corridors, lower limits for cross-border corridors to higher-risk jurisdictions).

### 6.5 Enforcement Layer

Limits are enforced at the bank layer (in the bank's existing payment gateway) AND at the MBG layer (in the sidecar's pre-settlement check). The MBG rejects instructions that exceed the configured limits, even if the bank's existing gateway accepted them.

### 6.6 API Endpoint

The `/gateway/v1/limits` endpoint (one of the 8 API endpoints) returns the bank's current limits:

```http
GET /gateway/v1/limits HTTP/1.1
Host: mbg.bankxx00.example
Authorization: Bearer <OAuth2 token>
X-MBG-Signature: <bank's signature>
```

Response:

```json
{
  "maxSingleTransactionUSD": 100000000,
  "dailyLimitUSD": 500000000,
  "monthlyLimitUSD": 5000000000,
  "velocityChecksEnabled": true
}
```

---

## 7. Fraud Controls (Bank-Side + MITHQAL-Side)

### 7.1 The Bank's Existing Fraud Controls

The `BankSecurityProfile.fraudControls` field references the bank's existing fraud controls:

```typescript
fraudControls: {
  realTimeMonitoring: true;
  anomalyDetection: true;
  velocityRules: true;
  sanctionsScreening: true;
  investigationWorkflow: string;
}
```

The bank's existing fraud monitoring, anomaly detection, velocity rules, sanctions screening, and investigation workflow remain authoritative. The MBG does NOT replace them.

### 7.2 MITHQAL-Side Fraud Controls

MITHQAL adds network-level anomaly detection on top:

- **Cross-bank pattern detection** — detect patterns across multiple banks (e.g. sudden volume spikes across multiple corporate customers at different banks).
- **Corridor anomaly detection** — detect unusual activity in specific corridors (e.g. sudden volume spike in a sanctioned-jurisdiction corridor).
- **Reserve drain detection** — detect unusual reserve depletion patterns.
- **Reconciliation anomaly detection** — detect reconciliation mismatches that may indicate fraud.

### 7.3 The Two-Layer Fraud Model

```
+-----------------------+        +-----------------------+
| Bank-side fraud       |        | MITHQAL-side fraud    |
| controls              |        | controls              |
+-----------------------+        +-----------------------+
| Real-time monitoring  |        | Cross-bank patterns   |
| Anomaly detection    |        | Corridor anomalies    |
| Velocity rules        |        | Reserve drain         |
| Sanctions screening   |        | Reconciliation anom.  |
| Investigation workflow|        |                       |
+-----------------------+        +-----------------------+
         |                                |
         v                                v
+-------------------------------------------------+
| Combined fraud signal                           |
| (bank's existing + MITHQAL network-level)       |
+-------------------------------------------------+
                     |
                     v
+-------------------------------------------------+
| Bank's investigation workflow                    |
| (bank remains authoritative for investigation) |
+-------------------------------------------------+
```

The bank remains the authoritative investigator. MITHQAL provides network-level signals that the bank can incorporate into its investigation workflow.

---

## 8. Recovery Process (HSM Failure, Key Compromise, Gateway Failure, MITHQAL Failure)

### 8.1 The Bank's Documented Recovery Runbook

```typescript
recoveryProcess: {
  documentedRecoveryRunbook: true;
  recoveryRequiresMOfN: true;
  recoveryMOfNThreshold: number;
  lastRecoveryDrillAt: string | null;
}
```

| Tier | M-of-N threshold | Last drill (SIMULATED) |
|---|---|---|
| TIER_1 | 3-of-N | null (no drill run yet) |
| TIER_2 | 2-of-N | null (no drill run yet) |
| TIER_3 | 2-of-N | null (no drill run yet) |

### 8.2 Recovery Scenarios

#### 8.2.1 HSM Failure

If the bank's HSM fails:

1. The MBG sidecar cannot sign new instructions (signature generation fails).
2. The gateway `internalState` moves to `PAUSED`; new instructions are rejected.
3. The bank's HSM failover procedure activates (backup HSM or HSM cluster).
4. Once the backup HSM is online and key material is restored, the gateway `internalState` moves back to `ACTIVE`.
5. Pending instructions are processed using the restored HSM.

**Time to recover:** Typically 1-4 hours, depending on the bank's HSM failover procedures.

#### 8.2.2 Key Compromise

If the bank's signing key is compromised:

1. The bank initiates emergency revocation (`emergencyRevocation.revocationAuthority = "BANK_REQUEST"`).
2. MITHQAL council confirms revocation within 60 seconds.
3. The compromised key is added to the revocation list; signatures from this key are no longer accepted.
4. The bank generates a new signing key inside its HSM / MPC.
5. The new key's public fingerprint is registered with MITHQAL.
6. The gateway `internalState` moves back to `ACTIVE`.
7. Pending instructions are re-signed with the new key and resubmitted (with new idempotency keys).

**Time to recover:** 4-8 hours (bank key generation + council approval + re-registration + re-signing).

#### 8.2.3 Gateway Failure

If the MBG sidecar itself fails (e.g. crash, network loss):

1. The `GatewayFailureState` is created (§19 of source).
2. `handleGatewayFailure(failure)` returns an 8-step `RecoveryPlan`.
3. The recovery plan is **manual controlled** (never automatic).
4. For `BANK_KEY_COMPROMISE` / `BANK_FRAUD_DETECTION` / `REGULATOR_HOLD`, council approval is required.

**Time to recover:** 2 hours (manual controlled) or 8 hours (council approved).

#### 8.2.4 MITHQAL-Side Failure

If MITHQAL itself fails (canonical ledger outage, mint.sol failure, reserve engine failure, oracle failure, etc.):

1. The `MithqalSideFailureState` is created (§20 of source).
2. Bank systems default to `PENDING_MITHQAL_CONFIRMATION`.
3. **Bank systems must NOT assume settlement completed.**
4. The bank may initiate reversal if finality is not received within the expected time window.
5. MITHQAL ops resolves the failure; bank systems re-query finality.

**Time to recover:** Depends on failure type. MITHQAL commits to communication throughout.

### 8.3 Recovery Drills

The bank must conduct recovery drills:

- **HSM failover drill** — simulate HSM failure; verify backup HSM activates within 4 hours.
- **Key compromise drill** — simulate key compromise; verify emergency revocation + new key generation within 8 hours.
- **Gateway failure drill** — simulate gateway crash; verify 8-step `RecoveryPlan` executes within 2 hours.
- **MITHQAL-side outage drill** — simulate canonical ledger outage; verify bank defaults to `PENDING_MITHQAL_CONFIRMATION`.

`lastRecoveryDrillAt` should be updated after each drill. Currently SIMULATED (null) because no real bank has conducted drills.

---

## 9. Gateway Failure State Handling

### 9.1 GatewayFailureState

```typescript
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
```

### 9.2 The 7 Failure Types

| Failure type | Description | Council approval required? |
|---|---|---|
| `BANK_SIDE_OUTAGE` | Bank's existing systems outage (e.g. core banking system down). | No |
| `SIDECAR_CRASH` | The MBG sidecar process crashed. | No |
| `CONNECTIVITY_LOSS` | Network loss between bank and MITHQAL. | No |
| `BANK_KEY_COMPROMISE` | Bank's signing key compromised. | Yes |
| `BANK_FRAUD_DETECTION` | Bank's fraud monitoring detected fraud. | Yes |
| `REGULATOR_HOLD` | Regulator placed a hold on the bank. | Yes |
| `MITHQAL_SIDE_OUTAGE` | MITHQAL itself failed. | No |

### 9.3 GatewayFailureRules (Canonical Invariants)

```typescript
export interface GatewayFailureRules {
  doNotMintDuplicateMTQ: true;
  doNotDuplicateSettlement: true;
  preserveIdempotency: true;
  reconcilePendingInstructionsOnRecovery: true;
  allowManualControlledRecovery: true;
  preserveBankAuditTrail: true;
  preserveMithqalAuditTrail: true;
}
```

All 7 rules are hard-typed `true` — they cannot be set to `false`.

### 9.4 The 7 Critical Invariants

1. **Do NOT mint duplicate MTQ.** Even if the gateway fails mid-settlement, no duplicate MTQ is minted.
2. **Do NOT duplicate settlement.** A pending instruction is settled exactly once.
3. **Preserve idempotency.** Idempotency keys are preserved across failure and recovery.
4. **Reconcile pending instructions on recovery.** After recovery, all pending instructions are reconciled.
5. **Allow manual controlled recovery.** Recovery is never automatic — always manual controlled.
6. **Preserve bank audit trail.** Bank-side audit trail is preserved.
7. **Preserve MITHQAL audit trail.** MITHQAL-side audit trail is preserved.

### 9.5 The 8-Step Recovery Plan

`handleGatewayFailure(failure)` returns an 8-step `RecoveryPlan`:

| Step | Action | Actor |
|---|---|---|
| 1 | Mark gateway `internalState = PAUSED`; reject new instructions. | MITHQAL_OPS |
| 2 | Freeze pending instructions; preserve idempotency keys. | MITHQAL_OPS |
| 3 | Preserve full audit trail (bank-side + MITHQAL-side). | MITHQAL_OPS |
| 4 | Bank ops confirms root cause resolved (or regulator hold lifted). | BANK_OPS |
| 5 | Run reconciliation across pending instructions; identify any double-settlement candidates. | MITHQAL_OPS |
| 6 | For each pending instruction: confirm NOT-YET-SETTLED before resume; settle OR reverse per bank decision. | BANK_OPS |
| 7 | Council 4-of-7 approves gateway RESTORE (only for `BANK_KEY_COMPROMISE` / `BANK_FRAUD_DETECTION` / `REGULATOR_HOLD`); otherwise MITHQAL ops + bank ops joint signoff. | COUNCIL / MITHQAL_OPS |
| 8 | Re-activate gateway; resume normal operations; verify next 5 reconciliation cycles `RECONCILED`. | MITHQAL_OPS |

### 9.6 Estimated Recovery Time

| Scenario | Estimated recovery time |
|---|---|
| Manual controlled (no council) | 120 minutes (2 hours) |
| Council-approved (key compromise / fraud / regulator) | 480 minutes (8 hours) |

### 9.7 Audit Trail Preservation

Both bank-side and MITHQAL-side audit trails are preserved across failure and recovery. The `RecoveryPlan.auditTrailPreserved: true` invariant is hard-typed.

---

## 10. MITHQAL-Side Failure Handling (PENDING_MITHQAL_CONFIRMATION)

### 10.1 MithqalSideFailureState

```typescript
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
```

### 10.2 The 7 MITHQAL-Side Failure Types

| Failure type | Description |
|---|---|
| `CANONICAL_LEDGER_OUTAGE` | MITHQAL canonical MTQ supply ledger is down. |
| `MINT_SOL_FAILURE` | The minting smart contract (mint.sol) is failing. |
| `RESERVE_ENGINE_FAILURE` | The reserve engine (RR ≥ 100% verification) is failing. |
| `ORACLE_FAILURE` | Oracle (NAV / PAR / FX feed) is failing. |
| `REDEMPTION_ENGINE_FAILURE` | The redemption engine is failing. |
| `POLICY_ENGINE_FAILURE` | The policy engine (version authorization) is failing. |
| `JSG_OUTAGE` | Jurisdictional Settlement Gateway is down. |

### 10.3 The Critical Rules

```typescript
export interface MithqalSideFailureRules {
  bankSystemsMustNotAssumeSettlementCompleted: true;
  requirePendingMithqalConfirmation: true;
  neverImplyTechnicalFailureEqualsPaymentCompletion: true;
  bankMayInitiateReversalIfFinalityNotReceived: true;
  bankAuditTrailPreserved: true;
  mithqalAuditTrailPreserved: true;
}
```

### 10.4 The Three Critical Rules

1. **Bank systems must NOT assume settlement completed.** A technical failure does NOT mean the payment completed.
2. **Bank systems must require `PENDING_MITHQAL_CONFIRMATION`** until explicit finality confirmation received.
3. **Never imply technical failure equals payment completion.** A timeout is NOT a success.

### 10.5 PENDING_MITHQAL_CONFIRMATION

```typescript
export const PENDING_MITHQAL_CONFIRMATION_STATUS =
  "PENDING_MITHQAL_CONFIRMATION" as const;
```

This is the bank's default assumption during a MITHQAL-side failure. The bank's status query returns `PENDING_MITHQAL_CONFIRMATION` (not `SETTLED`) until explicit finality is received.

### 10.6 Bank's Reversal Authority

```typescript
bankMayInitiateReversalIfFinalityNotReceived: true;
```

If finality is not received within a reasonable time window (e.g. 30 minutes), the bank may initiate reversal. This protects the bank from being stuck waiting indefinitely.

### 10.7 Why This Matters

The opposite of "assume failure means completion" is "assume failure means failure" — which can lead to banks assuming transactions failed when they actually succeeded, then re-submitting, causing duplicate settlement. The MBG's design prevents both:

- Never assume failure = completion (prevents false positives).
- Idempotency keys prevent duplicate settlement on re-submission (prevents false negatives).
- The 5-way reconciliation catches any actual duplicate.

---

## 11. Emergency Revocation Procedures

### 11.1 EmergencyRevocation

```typescript
emergencyRevocation: {
  enabled: true;
  revocationTimeSeconds: 60;     // 60 seconds to revoke
  revocationAuthority: "MITHQAL_COUNCIL" | "BANK_REQUEST" | "REGULATOR_ORDER";
}
```

### 11.2 The Three Revocation Authorities

| Authority | Description |
|---|---|
| `MITHQAL_COUNCIL` | The MITHQAL council (4-of-7 quorum) revokes the bank's access. Used for systemic risk events. |
| `BANK_REQUEST` | The bank itself requests revocation (e.g. after detecting key compromise or fraud). |
| `REGULATOR_ORDER` | A regulator orders revocation (e.g. after supervisory action against the bank). |

### 11.3 The 60-Second SLA

Emergency revocation completes within 60 seconds of initiation. The bank's signing key is added to the revocation list; signatures from this key are no longer accepted.

### 11.4 What Happens After Revocation

1. The bank's gateway `internalState` moves to `SUSPENDED`.
2. All pending instructions are frozen (not executed).
3. The 8-step `RecoveryPlan` is initiated (council approval required for `BANK_KEY_COMPROMISE` / `BANK_FRAUD_DETECTION` / `REGULATOR_HOLD`).
4. After recovery, the bank generates a new signing key, registers it, and resumes normal operations.

### 11.5 Annual Recertification

Adapters must be recertified annually. The recertification verifies that the adapter still conforms to the current MSAS standard version, that the bank's upstream interface has not drifted, and that the 20 tests still pass.

If recertification fails, the adapter status moves to `INACTIVE`. Emergency revocation is not required — the adapter simply stops accepting new instructions until recertification passes.

---

## 12. Security Audit Requirements

### 12.1 Independent Security Review

Per §22 cost model `securityReview` line item, an independent security firm (not the bank, not MITHQAL) reviews the adapter implementation:

| Tier | Security review cost |
|---|---|
| TIER_1 | $60,000 |
| TIER_2 | $30,000 |
| TIER_3 | $12,000 |

### 12.2 What the Security Review Covers

- **MSAS adapter implementation** — verify the translation rules are correctly implemented.
- **Connectivity security profile** — verify all 12 controls are correctly configured.
- **Key management** — verify the bank's HSM / MPC / KMS setup.
- **Zero-trust verification** — verify the 5-authentication check is correctly enforced.
- **Replay protection** — verify nonce + timestamp + idempotency caching.
- **Failure recovery** — verify the 8-step `RecoveryPlan` executes correctly.
- **Audit trail preservation** — verify audit trails are preserved across failures.

### 12.3 Annual Security Audit

After the initial security review, the bank must conduct annual security audits:

- Re-test all 12 connectivity security controls.
- Re-test the 5-authentication zero-trust check.
- Re-test the 8-step recovery plan with a real drill.
- Re-test the 5-way reconciliation.
- Verify key rotation has been performed on schedule.
- Verify no deviations from the documented security profile.

### 12.4 Audit Trail Requirements

Both bank-side and MITHQAL-side audit trails must be preserved for the regulatory retention period (typically 7 years for financial institutions):

- Every instruction submitted (with full `MTQSettlementInstruction` payload).
- Every status query (with full response).
- Every reconciliation cycle (with full 5-way reconciliation report).
- Every incident (with full `GatewayFailureState` / `MithqalSideFailureState` + `RecoveryPlan`).
- Every key rotation (with old + new key fingerprints + timestamps).
- Every emergency revocation (with authority + timestamp + reason).

---

## 13. Deployment Model Security (MODEL_A / MODEL_B / MODEL_C)

### 13.1 MODEL_A — Bank-Hosted (DEFAULT)

**Security profile:**
- Bank operates the MBG sidecar inside its own data center / VPC.
- All signing keys remain in the bank's HSM (on-prem).
- MITHQAL holds NO private keys.

**Security implications:**
- Maximum control — bank has full physical + logical control.
- Maximum compliance — meets the strictest data-sovereignty requirements.
- Operational overhead — bank must operate + monitor the sidecar.

**Best for:** Tier-1 money-center banks with mature on-prem infrastructure.

### 13.2 MODEL_B — Bank-Secured Private (DEFAULT)

**Security profile:**
- Sidecar runs in a bank-approved private cloud / co-location environment.
- Keys remain bank-controlled (HSM / MPC) but the compute environment is operated by an approved provider under bank contract.
- MITHQAL holds NO private keys.

**Security implications:**
- Bank retains key custody (HSM / MPC).
- Compute environment operated by approved provider — bank verifies provider's security certifications (SOC 2 Type II, ISO 27001, PCI DSS where applicable).
- Cloud elasticity — scale up/down as needed.

**Best for:** Tier-1 / Tier-2 banks wanting cloud elasticity without giving up key custody.

### 13.3 MODEL_C — Approved Managed (EXCEPTION)

**Security profile:**
- Sidecar operated by an approved managed-service provider under bank contract.
- All signing keys remain bank-controlled (HSM / MPC) at all times.
- The provider only sees signed messages — never private keys.
- MITHQAL holds NO private keys.

**Security implications:**
- Bank retains key custody (HSM / MPC).
- Managed provider operates sidecar — bank verifies provider's security certifications + contractual obligations.
- Bank must verify the managed provider meets the bank's security requirements.
- Higher operational risk (reliance on third party).

**Best for:** Tier-3 banks lacking sidecar operations capability but still requiring bank-controlled keys.

### 13.4 Cross-Model Canonical Rule

Regardless of model:

```typescript
export const DEPLOYMENT_MODEL_CANONICAL_RULE =
  "Never require a bank to surrender customer private keys." as const;
```

No deployment model — past, present, or future — may violate this rule. This is enforced by `BankSecurityProfile.mithqalDoesNotPossessCustomerPrivateKeys: true` (a literal type, not a runtime value).

### 13.5 Security Comparison Table

| Aspect | MODEL_A | MODEL_B | MODEL_C |
|---|---|---|---|
| Key custody | Bank HSM (on-prem) | Bank HSM / MPC (bank-controlled, provider-hosted compute) | Bank HSM / MPC (bank-controlled, managed provider operates sidecar) |
| Compute environment | Bank data center / bank VPC | Bank-approved private cloud / co-location | Approved managed-service provider |
| Bank preference | DEFAULT | DEFAULT | EXCEPTION |
| MITHQAL key possession | false (always) | false (always) | false (always) |
| Operational overhead | High (bank operates sidecar) | Medium (provider operates compute; bank operates keys) | Low (managed provider operates sidecar + compute; bank operates keys) |
| Compliance complexity | Lowest (full bank control) | Medium (provider certifications + bank controls) | Highest (managed provider contracts + bank controls) |

---

## 14. Incident Response Playbook

### 14.1 Incident Severity Levels

| Severity | Definition | Response time |
|---|---|---|
| SEV-1 (Critical) | Active compromise, regulator action, settlement halt. | Immediate (within 60 seconds) |
| SEV-2 (High) | Reconciliation `CRITICAL` or `LOCKED`; gateway failure affecting live transactions. | Within 1 hour |
| SEV-3 (Medium) | Reconciliation `MISMATCH`; gateway `DEGRADED`. | Within 4 hours |
| SEV-4 (Low) | Reconciliation `WARNING`; cert expiry < 30 days. | Within 24 hours |

### 14.2 Incident Response Flow

```
+----------+    +----------+    +----------+    +----------+    +----------+
| Detect   | -> | Triage   | -> | Respond  | -> | Recover   | -> | Postmortem|
+----------+    +----------+    +----------+    +----------+    +----------+
  Monitor         Severity        Mitigate        Restore          Root cause
  alerts          assignment      (revocation,    (RecoveryPlan)   analysis
                  (SEV-1..4)       restrict,       execution        + remediation
                                  suspend)                          + prevention
```

### 14.3 SEV-1 Playbook (Critical)

1. **Detection** — automated monitoring detects active compromise, regulator action, or settlement halt.
2. **Triage** — on-call SRE assigns SEV-1; pages bank ops lead + MITHQAL ops lead + council chair.
3. **Respond** — initiate emergency revocation (60 seconds); suspend affected gateway(s).
4. **Recover** — execute 8-step `RecoveryPlan` (council-approved for key compromise / fraud / regulator).
5. **Postmortem** — within 7 days, written postmortem covering root cause, timeline, remediation, prevention.

### 14.4 SEV-2 Playbook (High)

1. **Detection** — reconciliation returns `CRITICAL` or `LOCKED`; OR gateway failure affects live transactions.
2. **Triage** — on-call SRE assigns SEV-2; pages bank ops lead + MITHQAL ops lead.
3. **Respond** — RESTRICT affected operations; preserve forensic evidence; auto-escalate within 1 hour.
4. **Recover** — execute 8-step `RecoveryPlan` (manual controlled); restore gateway after reconciliation `RECONCILED`.
5. **Postmortem** — within 14 days, written postmortem.

### 14.5 SEV-3 Playbook (Medium)

1. **Detection** — reconciliation returns `MISMATCH`; OR gateway `DEGRADED`.
2. **Triage** — on-call SRE assigns SEV-3; notifies bank ops + MITHQAL ops within 4 hours.
3. **Respond** — RESTRICT affected operations (issuance OR redemption OR settlement); preserve forensic evidence.
4. **Recover** — investigate mismatch; resolve root cause; restore affected operations after reconciliation `RECONCILED`.
5. **Postmortem** — within 30 days, written postmortem.

### 14.6 SEV-4 Playbook (Low)

1. **Detection** — reconciliation returns `WARNING`; OR cert expiry < 30 days.
2. **Triage** — automated ticket assigned; notify bank ops + MITHQAL ops within 24 hours.
3. **Respond** — continue settlement operations with heightened monitoring; investigate warning.
4. **Recover** — resolve root cause; verify next reconciliation cycle `RECONCILED`.
5. **Postmortem** — within 90 days, brief postmortem (or skipped if root cause is trivial, e.g. cert renewal).

### 14.7 Communication Protocols

| Severity | Internal comms | External comms |
|---|---|---|
| SEV-1 | Immediate page (bank ops + MITHQAL ops + council) | Regulator notification within 24 hours (where required by law) |
| SEV-2 | Within 1 hour (bank ops + MITHQAL ops) | Customer communication if live transactions affected |
| SEV-3 | Within 4 hours (bank ops + MITHQAL ops) | No external comms |
| SEV-4 | Within 24 hours (ticket assignment) | No external comms |

### 14.8 Forensic Evidence Preservation

For SEV-1 and SEV-2 incidents, the following forensic evidence is preserved:

- Signed snapshots of all 5 reconciliation ledgers (canonical, bank subledger, corporate positions, reserve, proof-of-liabilities).
- Full audit trail of all instructions in the affected time window.
- Gateway metrics (instructionsReceived / Settled / Rejected / Pending).
- Connectivity security state (mTLS cert fingerprints, IP allowlist, key fingerprints).
- Recovery plan execution log (each of the 8 steps with actor + timestamp + acknowledgment).

Evidence is preserved for the regulatory retention period (typically 7 years).

---

## Appendix A — Cross-References

| Topic | Document |
|---|---|
| MBG architecture (canonical) | `docs/architecture/mbg/MITHQAL_BANK_GATEWAY_ARCHITECTURE.md` |
| Adapter standard (MSAS) | `docs/architecture/mbg/MITHQAL_ADAPTER_STANDARD_MSAS.md` |
| Bank integration playbook | `docs/architecture/mbg/MITHQAL_BANK_INTEGRATION_GUIDE.md` |
| Reconciliation architecture | `docs/architecture/mbg/MITHQAL_BANK_RECONCILIATION_GUIDE.md` |
| Bank ROI / cost model | `docs/architecture/mbg/MITHQAL_BANK_ROI_MODEL.md` |
| Corporate user flow | `docs/architecture/mbg/MITHQAL_CORPORATE_USER_FLOW.md` |
| Source module | `src/lib/mithqal-bank-gateway.ts` (§10, §17, §18, §19, §20) |
| BankSecurityProfile | §10 of source module |
| ConnectivitySecurityProfile | §17 of source module |
| ZeroTrustVerification | §18 of source module |
| GatewayFailureState | §19 of source module |
| MithqalSideFailureState | §20 of source module |
| DO_NOT_MODIFY rules | §34 of source module (12 rules, including DNM-08 no customer private keys) |
| Final pilot activation gate | `docs/verification/v25-0-final-pilot-activation-gate.md` |

## Appendix B — Security Control Quick-Reference

```
BANK-CONTROLLED (always):
  - Signing keys (private) → bank HSM / MPC / approved KMS
  - Customer identity (KYC/KYB/UBO) → bank
  - Compliance (AML/sanctions) → bank
  - Authentication (MFA/SSO/RBAC) → bank
  - Limits / velocity → bank
  - Fraud detection → bank (existing) + MITHQAL (network-level)

MITHQAL-ENFORCED (always):
  - Zero-trust 5-authentication check (default-deny)
  - 12 connectivity security controls (all mandatory)
  - 5-way reconciliation (RECONCILED / WARNING / MISMATCH / CRITICAL / LOCKED)
  - Gateway failure 7 invariants (no duplicate MTQ, etc.)
  - MITHQAL-side failure rules (PENDING_MITHQAL_CONFIRMATION)
  - Emergency revocation (60 seconds)
  - Audit trail preservation (bank + MITHQAL)

CANONICAL INVARIANTS (hard-typed, never false):
  - mithqalDoesNotPossessCustomerPrivateKeys = true
  - coreBankingReplacementRequired = false
  - separationOfDutiesEnforced = true
  - bankApprovesBeforeSettlement = true
  - velocityChecksEnabled = true
  - doNotMintDuplicateMTQ = true
  - doNotDuplicateSettlement = true
  - preserveIdempotency = true
  - reconcilePendingInstructionsOnRecovery = true
  - allowManualControlledRecovery = true
  - preserveBankAuditTrail = true
  - preserveMithqalAuditTrail = true
  - bankSystemsMustNotAssumeSettlementCompleted = true
  - requirePendingMithqalConfirmation = true
  - neverImplyTechnicalFailureEqualsPaymentCompletion = true
```

---

*End of MITHQAL_BANK_SECURITY_GUIDE.md — v25.0-mbg-amendment-1.0 — INTEGRATION-READY, 0 banks contracted.*

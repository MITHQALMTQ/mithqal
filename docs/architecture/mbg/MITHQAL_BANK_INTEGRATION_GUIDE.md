# MITHQAL Bank Integration Guide

> **File:** MITHQAL_BANK_INTEGRATION_GUIDE.md
> **Task ID:** MBG-DOCUMENTATION
> **Source module:** `src/lib/mithqal-bank-gateway.ts` (3,969 lines — the source of truth)
> **Document version:** v25.0-mbg-amendment-1.0
> **Honest state declaration:** **INTEGRATION-READY — 0 banks contracted.**
> **Canonical principle:** *"TRANSLATION, NOT TRANSFORMATION."*

---

## Table of Contents

1. [Integration Philosophy](#1-integration-philosophy)
2. [Pre-Integration Checklist](#2-pre-integration-checklist)
3. [The 6-Phase Integration Journey](#3-the-6-phase-integration-journey)
4. [Phase 1 — Discovery](#4-phase-1--discovery)
5. [Phase 2 — Design](#5-phase-2--design)
6. [Phase 3 — Build](#6-phase-3--build)
7. [Phase 4 — Test](#7-phase-4--test)
8. [Phase 5 — UAT](#8-phase-5--uat)
9. [Phase 6 — Production](#9-phase-6--production)
10. [Integration Timeline by Bank Tier](#10-integration-timeline-by-bank-tier)
11. [Bank Responsibilities](#11-bank-responsibilities)
12. [MITHQAL Responsibilities](#12-mithqal-responsibilities)
13. [Common Integration Pitfalls + How to Avoid Them](#13-common-integration-pitfalls--how-to-avoid-them)
14. [Honest State](#14-honest-state)

---

## 1. Integration Philosophy

### 1.1 The Three Sentences

The MITHQAL Bank Gateway integration philosophy is captured in three sentences, repeated throughout the source module and this documentation:

```
No core replacement.
Minimal integration.
Existing banking systems remain authoritative.
```

These are not slogans. They are enforced invariants:

- `coreBankingReplacementRequired: false` is a hard-typed invariant on the `BankIntegrationCostModel` interface (§22 of source). A module-load assertion verifies it for all three bank tiers (TIER_1, TIER_2, TIER_3).
- "Minimal integration" is the required language. The 7 cost components (technical integration, security review, compliance review, legal review, operations, certification, maintenance) are real costs — but they are additive to the bank's existing operations, not replacements for them.
- `noFalseZeroIntegrationClaim: true` is enforced by `HONEST_STATE`. Any material that uses the phrase "zero integration" violates the canonical principle.

### 1.2 What "Minimal Integration" Means

"Minimal integration" means the bank does **not** have to:

1. **Replace its core banking system.** The bank's core banking system (deposits, lending, treasury, accounting) remains authoritative.
2. **Re-perform customer KYC.** The bank's existing KYC/KYB/AML/sanctions screening remains authoritative; MITHQAL validates the bank's signed attestation only.
3. **Surrender key custody.** Bank keys stay in bank HSM/MPC; MITHQAL receives only public key fingerprints + signed messages.
4. **Adopt a new customer UX.** The corporate customer's existing bank corporate portal remains authoritative (default `customerExperienceMode = "EXISTING_BANK_UX"`).
5. **Abandon SWIFT / ISO 20022 / correspondent banking.** All existing rails coexist with MTQ (see §21 of source).
6. **Replace its accounting / GL.** The bank's chart of accounts remains authoritative; MITHQAL events are mapped to bank GL accounts via the `AccountingReconciliationAdapter` (§11 of source).
7. **Take a stance on BRICS or CBDC.** Both adapters are optional and modular; the bank's MTQ settlement works without either.

### 1.3 What "Minimal Integration" Does NOT Mean

| Misreading | Truth |
|---|---|
| "Zero integration" | No — the bank must complete the 6-phase integration journey (Discovery → Design → Build → Test → UAT → Production). |
| "Plug and play" | No — the bank must select connectors, configure security profiles, run the 20 required tests, and pass independent security review. |
| "Free" | No — the bank incurs real costs (TIER_1: $400K + $80K/yr; TIER_2: $200K + $40K/yr; TIER_3: $80K + $20K/yr). |
| "No compliance work" | No — the bank must continue its existing compliance work and provide signed `BankComplianceAttestation` for every instruction. |
| "No security work" | No — the bank must configure the full 12-control `ConnectivitySecurityProfile` (§17 of source). |

### 1.4 Why This Philosophy Matters

Most distributed-ledger / tokenized-settlement projects fail at the bank adoption stage because they require the bank to (a) replace core systems, (b) surrender key custody, or (c) become a node on someone else's network. Each of these is a non-starter for a regulated institution.

The "minimal integration" philosophy removes all three blockers:

| Blocker | MBG answer |
|---|---|
| "Don't replace my core banking" | MBG is a sidecar; bank keeps core systems authoritative. |
| "Don't take my keys" | Keys stay in bank HSM/MPC; MITHQAL sees only signed messages. |
| "Don't make me a node on your network" | Bank is not a node; it connects via MSAS adapter to a gateway that talks to MITHQAL canonical core. |

---

## 2. Pre-Integration Checklist

Before a bank begins integration, the following prerequisites must be met.

### 2.1 Bank Eligibility

| Criterion | Requirement | Source |
|---|---|---|
| Regulatory status | Bank must be a regulated bank (or regulated non-bank financial institution eligible for wholesale settlement) in its home jurisdiction. | `bank-onboarding.ts` Institution entity |
| Bank size tier | Bank must self-classify as TIER_1 (>$1T assets), TIER_2 ($100B-$1T), or TIER_3 (<$100B). Tier affects cost model and integration timeline. | `BankIntegrationCostModel.bankSize` |
| Jurisdiction | Bank's jurisdiction must be supported by the Jurisdictional Settlement Gateway (JSG). Currently supported: US, JP, AE, GB, SG, HK, EU (and growing). | `MithqalBankGateway.jurisdiction` |
| Existing infrastructure | Bank must have at least one of the 7 MSAS connector classes in production (ISO 20022 gateway, institutional REST API, H2H, SFTP, payment gateway, TMS, ERP integration). | `MSASConnectorClass[]` |

### 2.2 Regulatory Status

| Required | Notes |
|---|---|
| Active banking license in home jurisdiction | Verified by the bank-onboarding process. |
| AML / sanctions program in place | Bank's existing program; MITHQAL accepts bank-signed attestation. |
| Privacy / data protection compliance (GDPR / equivalent) | Bank's existing compliance; MITHQAL does not store customer PII. |
| Cybersecurity framework (NIST / ISO 27001 / equivalent) | Bank's existing framework; MBG adds zero-trust layer. |

### 2.3 Technical Readiness

| Required | Notes |
|---|---|
| HSM (Hardware Security Module) or MPC (Multi-Party Computation) | For bank-controlled signing keys. FIPS-140-2 L3 / FIPS-140-3 L3 / Common Criteria EAL5+ / bank-approved equivalent. |
| Public key infrastructure (PKI) | For mutual-TLS to MITHQAL. Bank issues / rotates its own X.509 certs. |
| SFTP server (if using `SECURE_FILE_EXCHANGE_SFTP` connector) | SFTP v6 + GPG encryption. |
| ISO 20022 gateway (if using `ISO_20022` connector) | Any ISO 20022-compliant gateway (SWIFT gpi, Equinor, etc.). |
| Institutional REST API (if using `BANK_REST_API` connector) | Existing bank REST API with OAuth2 / mTLS authentication. |
| Treasury management system (if using `TREASURY_SYSTEM` connector) | SWIFT MT300 / MT202 capable. |
| Corporate ERP integration (if using `CORPORATE_ERP_CONNECTIVITY` connector) | SAP S/4HANA, Oracle Fusion, Workday, or equivalent. |
| Network ACL capability | For IP allowlist enforcement (bank + MITHQAL IPs). |
| Observability stack | For gateway metrics, reconciliation reports, incident dashboards. |

### 2.4 Organizational Readiness

| Required | Notes |
|---|---|
| Executive sponsorship (CTO / CIO / Head of Treasury) | Required for 8-16 week integration timeline. |
| Compliance officer engagement | For compliance attestation design + signing process. |
| Security officer engagement | For connectivity security profile + key management design. |
| Operations team | For gateway monitoring, incident response, recovery drills. |
| Legal counsel | For integration agreement + jurisdictional review. |

### 2.5 Pre-Integration Self-Assessment Checklist

Before contacting MITHQAL, the bank should self-assess:

- [ ] We have an active banking license in our home jurisdiction.
- [ ] We have classified our bank size tier (TIER_1 / TIER_2 / TIER_3).
- [ ] We have identified the MSAS connector classes we want to use (subset of the 7).
- [ ] We have an HSM / MPC for bank-controlled signing keys.
- [ ] We have a PKI for mutual-TLS.
- [ ] We have identified the upstream systems we will connect to the MBG.
- [ ] We have executive sponsorship for the integration timeline.
- [ ] We have compliance, security, and operations stakeholders identified.
- [ ] We have legal counsel for the integration agreement.
- [ ] We have a budget allocation matching our tier's cost model.

---

## 3. The 6-Phase Integration Journey

```
+----------+    +----------+    +----------+    +----------+    +----------+    +------------+
| Phase 1  | -> | Phase 2  | -> | Phase 3  | -> | Phase 4  | -> | Phase 5  | -> | Phase 6    |
| Discovery|    | Design   |    | Build    |    | Test     |    | UAT      |    | Production |
+----------+    +----------+    +----------+    +----------+    +----------+    +------------+
  Week 1-2       Week 3-4        Week 5-10       Week 11-13       Week 14-15       Week 16+
  Technical      Interface       Gateway         Integration      User             Cutover
  scoping +      mapping +       deployment +    tests +          acceptance +     plan +
  connector      MSAS adapter    connector       security tests   reconciliation   monitoring +
  selection +    configuration + impl +          + 20 MBG tests + validation +     incident
  deployment     security        key             performance      status           response +
  model          profile         management      tests            translation +    DR
                 design          setup                            end-to-end
                                                                 payment flow
```

### 3.1 Phase Durations (Indicative)

| Phase | Tier-1 | Tier-2 | Tier-3 |
|---|---|---|---|
| Phase 1 — Discovery | 2 weeks | 1.5 weeks | 1 week |
| Phase 2 — Design | 2 weeks | 1.5 weeks | 1 week |
| Phase 3 — Build | 6 weeks | 4 weeks | 3 weeks |
| Phase 4 — Test | 3 weeks | 3 weeks | 2 weeks |
| Phase 5 — UAT | 2 weeks | 1.5 weeks | 1 week |
| Phase 6 — Production cutover | 1 week | 0.5 week | 0 week (overlaps with UAT exit) |
| **Total** | **16 weeks** | **12 weeks** | **8 weeks** |

> **Note:** These are planning estimates. Actual durations depend on the bank's existing infrastructure, chosen connector classes, deployment model, and integration depth. See §10 for details.

### 3.2 Phase Gate Criteria

Each phase has explicit exit criteria. The bank cannot skip phases; the integration journey is sequential.

| Phase | Exit criteria |
|---|---|
| Discovery → Design | Connector classes selected, deployment model selected, technical scoping document signed. |
| Design → Build | Interface mapping approved, MSAS adapter configuration signed off, security profile designed. |
| Build → Test | Gateway deployed, connector implemented, key management setup complete, smoke test passing. |
| Test → UAT | All 20 MBG tests passing in test environment, security review complete, performance tests passed. |
| UAT → Production | User acceptance signed off, reconciliation validated, end-to-end payment flow demonstrated, cutover plan approved. |
| Production | Live pilot transaction executed successfully, monitoring operational, incident response tested. |

---

## 4. Phase 1 — Discovery

### 4.1 Objectives

- Understand the bank's existing infrastructure.
- Identify which MSAS connector classes match the bank's existing systems.
- Select the deployment model (MODEL_A / MODEL_B / MODEL_C).
- Scope the technical integration effort.

### 4.2 Activities

#### 4.2.1 Technical Scoping

The bank's technical team + MITHQAL integration engineer conduct a joint scoping session:

1. **Inventory existing upstream systems** — list every system the bank uses that could feed instructions to the MBG (ISO 20022 gateway, REST API, H2H, SFTP, payment gateway, TMS, ERP integration).
2. **Map each upstream system to an MSAS connector class** — verify which of the 7 classes apply.
3. **Identify the bank's HSM / MPC infrastructure** — verify FIPS-140-2 L3 / FIPS-140-3 L3 / Common Criteria EAL5+ / bank-approved equivalent.
4. **Identify the bank's PKI** — verify mutual-TLS capability.
5. **Identify the bank's observability stack** — verify gateway metrics + reconciliation reports can be consumed.
6. **Identify the bank's compliance system** — verify the bank's existing KYC / AML / sanctions screening can produce the 7 required compliance assertions.

#### 4.2.2 Connector Selection

The bank selects a subset of the 7 MSAS connector classes. A typical selection:

| Bank profile | Typical connectors |
|---|---|
| Tier-1 money-center bank | `ISO_20022` + `BANK_REST_API` + `TREASURY_SYSTEM` + `HOST_TO_HOST` |
| Tier-2 regional commercial bank | `ISO_20022` + `BANK_REST_API` + `EXISTING_PAYMENT_GATEWAY` |
| Tier-3 smaller commercial bank | `BANK_REST_API` + `CORPORATE_ERP_CONNECTIVITY` |

The selection is documented in `MithqalBankGateway.connectorClasses[]`:

```typescript
connectorClasses: ["ISO_20022", "BANK_REST_API", "TREASURY_SYSTEM"],
```

#### 4.2.3 Deployment Model Selection

The bank selects one of the three deployment models:

| Model | When to choose |
|---|---|
| `MODEL_A_BANK_HOSTED` | Bank has mature on-prem infrastructure + strict data-sovereignty requirements. Default for Tier-1 money-center banks. |
| `MODEL_B_BANK_SECURED_PRIVATE` | Bank wants cloud elasticity without giving up key custody. Default for most banks. |
| `MODEL_C_APPROVED_MANAGED` | Bank lacks sidecar operations capability but still requires bank-controlled keys. Reserved for smaller banks. |

All three models enforce the canonical rule: **"Never require a bank to surrender customer private keys."**

#### 4.2.4 Technical Scoping Document

The Discovery phase produces a signed technical scoping document that includes:

- Selected connector classes
- Selected deployment model
- Identified upstream systems
- HSM / MPC / PKI inventory
- Compliance system inventory
- Observability stack inventory
- Estimated integration timeline (per tier)
- Estimated integration cost (per `BankIntegrationCostModel`)

### 4.3 Exit Criteria

- [ ] Connector classes selected (subset of 7)
- [ ] Deployment model selected (A / B / C)
- [ ] Technical scoping document signed by bank CTO / CIO
- [ ] Estimated timeline and budget approved

---

## 5. Phase 2 — Design

### 5.1 Objectives

- Map the bank's existing upstream interfaces to the canonical `MTQSettlementInstruction` fields.
- Configure the MSAS adapter (translation rules).
- Design the bank-controlled security profile.
- Design the connectivity security profile.

### 5.2 Activities

#### 5.2.1 Interface Mapping

For each selected connector class, the bank + MITHQAL engineer produce a field-by-field mapping:

| Connector class | Mapping table |
|---|---|
| `ISO_20022` | pacs.008 fields → MTQSettlementInstruction fields (see Adapter Standard doc §6) |
| `BANK_REST_API` | Bank REST API request fields → MTQSettlementInstruction fields (see Adapter Standard doc §8) |
| `HOST_TO_HOST` | H2H batch record fields → MTQSettlementInstruction fields (see Adapter Standard doc §7) |
| `SECURE_FILE_EXCHANGE_SFTP` | SFTP file format → batch MTQSettlementInstruction (see Adapter Standard doc §9) |
| `EXISTING_PAYMENT_GATEWAY` | Payment gateway approval flow → post-approval MTQSettlementInstruction |
| `TREASURY_SYSTEM` | SWIFT MT300 / MT202 → MTQSettlementInstruction (see Adapter Standard doc §10) |
| `CORPORATE_ERP_CONNECTIVITY` | SAP IDOC / Oracle XML / Workday SOAP → MTQSettlementInstruction (see Adapter Standard doc §11) |

The mapping is documented in the adapter's `translationRules` field.

#### 5.2.2 MSAS Adapter Configuration

The bank instantiates an `MSASAdapter` record for each selected connector class:

```typescript
const adapter: MSASAdapter = {
  adapterId: "ADP-BANKXX00-001",
  connectorClass: "ISO_20022",
  protocolVersion: "MSAS-1.0",
  bankInterfaceVersion: "ISO 20022 pacs.008 v9.5",
  translationRules: "pacs.008 → MTQSettlementInstruction (detailed mapping table attached)",
  status: "PENDING_CERTIFICATION",
  certifiedAt: null,
  evidenceClass: "SIMULATED",   // → CONTRACTED after Phase 5, → LIVE after Phase 6
};
```

#### 5.2.3 Security Profile Design

The bank designs its `BankSecurityProfile` (§10 of source):

- `keyManagementType` — `BANK_HSM` / `BANK_MPC` / `BANK_APPROVED_KMS`
- `signingAuthority` — authorized signers, multi-sig threshold, threshold scheme
- `authenticationModel` — MFA methods, SSO integration, session timeout
- `authorizationModel` — RBAC roles, ABAC policies, separation of duties
- `corporateSignatoryControls` — corporate can initiate, bank approves before settlement, dual approval threshold
- `limitsProfile` — max single / daily / monthly transaction USD, velocity checks
- `fraudControls` — real-time monitoring, anomaly detection, sanctions screening
- `recoveryProcess` — documented runbook, M-of-N recovery, last drill date

The canonical invariant `mithqalDoesNotPossessCustomerPrivateKeys: true` is enforced.

#### 5.2.4 Connectivity Security Profile Design

The bank designs its `ConnectivitySecurityProfile` (§17 of source) covering all 12 controls:

1. Mutual TLS (bank cert + MITHQAL cert + min TLS version + cert rotation)
2. Signed requests (algorithm + required fields)
3. Hardware-backed signing (HSM type)
4. Nonce (length + uniqueness window)
5. Timestamp (max skew)
6. Replay protection (cache TTL)
7. Idempotency (key derivation + cache TTL)
8. Message expiration (max age)
9. IP network controls (bank IP allowlist + MITHQAL IP allowlist)
10. Institution allowlist
11. Key rotation (interval + emergency revocation enabled)
12. Emergency revocation (time + authority)

The `verifyConnectivitySecurity(profile)` function in source module validates that all 12 controls are enabled and populated.

### 5.3 Exit Criteria

- [ ] Interface mapping approved for each selected connector class
- [ ] MSAS adapter configurations documented
- [ ] `BankSecurityProfile` designed and signed off by bank security officer
- [ ] `ConnectivitySecurityProfile` designed and signed off by bank security officer
- [ ] Compliance attestation design approved by bank compliance officer

---

## 6. Phase 3 — Build

### 6.1 Objectives

- Deploy the MBG gateway (sidecar).
- Implement the selected MSAS adapters.
- Set up bank-controlled key management (HSM / MPC).
- Configure connectivity security (mutual-TLS, signing, IP allowlists).
- Run smoke tests.

### 6.2 Activities

#### 6.2.1 Gateway Deployment

The MBG sidecar is deployed according to the selected deployment model:

| Model | Deployment steps |
|---|---|
| `MODEL_A_BANK_HOSTED` | Bank provisions VM / container in its own data center / VPC. MITHQAL provides the sidecar image + configuration templates. Bank's operations team deploys + monitors. |
| `MODEL_B_BANK_SECURED_PRIVATE` | Bank provisions VM / container in bank-approved private cloud / co-location. Managed cloud provider hosts compute; bank retains key custody. |
| `MODEL_C_APPROVED_MANAGED` | Approved managed-service provider provisions + operates sidecar under bank contract. Bank retains key custody; managed provider sees only signed messages. |

The gateway instance is registered:

```typescript
const gateway: MithqalBankGateway = {
  gatewayId: "MBG-BANKXX00-001",
  bankId: "BANKXX00",
  institutionId: "INST-...",
  bankLegalName: "Bank XX",
  jurisdiction: "US",
  deploymentModel: "MODEL_A_BANK_HOSTED",
  connectorClasses: ["ISO_20022", "BANK_REST_API", "TREASURY_SYSTEM"],
  internalState: "INITIALIZING",
  connectivityStatus: "HEALTHY",
  adapters: [/* MSAS adapter instances */],
  securityProfile: {/* designed in Phase 2 */},
  connectivitySecurity: {/* designed in Phase 2 */},
  attestationKeys: {
    bankPublicKeyFingerprint: "sha256:...",
    bankSigningKeyAlgorithm: "ECDSA-P256",
    keyRotationPolicyDays: 90,
    lastRotatedAt: "<timestamp>",
    keyCustodyBinding: "BANK_HSM_FIPS_140_3_L3",
  },
  // ... metrics, dataClass, etc.
};
```

#### 6.2.2 Connector Implementation

For each selected connector class, the bank implements (or configures) the adapter:

- `ISO_20022` — configure the bank's ISO 20022 gateway to route pacs.008 messages to the MBG sidecar. Add the proprietary `BankComplianceAttestation` extension to the pacs.008 schema.
- `BANK_REST_API` — implement the bank's REST API client that posts to the MBG's `/gateway/v1/instructions` endpoint.
- `HOST_TO_HOST` — implement the H2H batch file producer that generates the batch file format the MBG consumes.
- `SECURE_FILE_EXCHANGE_SFTP` — configure the SFTP server + GPG key for file exchange with the MBG.
- `EXISTING_PAYMENT_GATEWAY` — configure the existing payment gateway to forward post-approval instructions to the MBG.
- `TREASURY_SYSTEM` — configure the TMS to emit SWIFT MT300 / MT202 messages to the MBG.
- `CORPORATE_ERP_CONNECTIVITY` — configure the corporate ERP integration layer to route payment runs through the bank (which then forwards to the MBG).

#### 6.2.3 Key Management Setup

The bank sets up its HSM / MPC for signing keys:

1. Generate the bank's attestation key pair inside the HSM / MPC. Private key never leaves the HSM / MPC.
2. Export the public key fingerprint to the MBG sidecar.
3. Configure the MBG to verify signatures against the bank's public key.
4. Set up key rotation policy (default 90 days).
5. Configure emergency revocation capability (default 60 seconds).

#### 6.2.4 Connectivity Security Configuration

The bank configures the 12 connectivity security controls:

1. Mutual-TLS — issue / install bank X.509 cert; install MITHQAL X.509 cert on the MBG sidecar.
2. Signed requests — configure the MBG to require signed request bodies.
3. Hardware-backed signing — verify HSM / MPC binding.
4. Nonce — configure nonce generation (16+ byte random per request).
5. Timestamp — configure clock sync (NTP) with max skew 60 seconds.
6. Replay protection — configure cache TTL (24 hours).
7. Idempotency — configure idempotency key derivation (BANK_PROVIDED or HASH_OF_PAYLOAD).
8. Message expiration — configure max age (24 hours).
9. IP network controls — configure bank IP allowlist + MITHQAL IP allowlist.
10. Institution allowlist — register the bank's institution ID.
11. Key rotation — schedule key rotation (90 days).
12. Emergency revocation — test emergency revocation (60 seconds).

#### 6.2.5 Smoke Test

After deployment, the bank runs a smoke test:

```bash
# Submit a SIMULATED test instruction
curl -X POST https://mbg.bankxx00.example/gateway/v1/instructions \
  -H "Authorization: Bearer <OAuth2 token>" \
  -H "X-MBG-Signature: <bank's signature>" \
  -H "X-MBG-Nonce: <16-byte random hex>" \
  -H "X-MBG-Timestamp: <ISO 8601 UTC>" \
  -H "X-MBG-Idempotency-Key: <UUID>" \
  -H "X-MBG-Policy-Version: v25.0-mbg-1.0" \
  -d @test-instruction.json
```

Expected response: HTTP 202 with `finalityState: "RECEIVED"`.

### 6.3 Exit Criteria

- [ ] Gateway deployed and registered
- [ ] All selected MSAS adapters implemented
- [ ] Key management setup complete (HSM / MPC binding verified)
- [ ] All 12 connectivity security controls configured
- [ ] Smoke test passing (SIMULATED instruction submitted + RECEIVED response received)
- [ ] Gateway `internalState` moved from `INITIALIZING` to `CERTIFIED`

---

## 7. Phase 4 — Test

### 7.1 Objectives

- Run the 20 required MBG tests (`MBG-T01` … `MBG-T20`).
- Run integration tests (bank-side + MITHQAL-side).
- Run security tests (penetration testing, key compromise drills).
- Run performance tests (throughput, latency under load).

### 7.2 Activities

#### 7.2.1 The 20 Required MBG Tests

The 20 tests are defined in `BANK_GATEWAY_TESTS` (§28 of source). Each test exercises a specific MBG capability:

| Test ID | Category | Description |
|---|---|---|
| `MBG-T01` | CORE_ARCHITECTURE | Bank connects through MBG without replacing core banking. |
| `MBG-T02` | COMPLIANCE_BOUNDARY | Bank KYC/AML remains authoritative. |
| `MBG-T03` | CUSTOMER_EXPERIENCE | Existing corporate banking UX remains authoritative. |
| `MBG-T04` | PRIVACY | MITHQAL receives minimum-necessary data. |
| `MBG-T05` | MONETARY_INTEGRITY | MTQ issuance remains institutional and deterministic. |
| `MBG-T06` | RECONCILIATION | Corporate MTQ position reconciles with bank subledger. |
| `MBG-T07` | RECONCILIATION | MITHQAL canonical ledger reconciles. |
| `MBG-T08` | RECONCILIATION | Five-way reconciliation passes. |
| `MBG-T09` | SECURITY | Duplicate/replay transactions are impossible. |
| `MBG-T10` | RESILIENCE | Bank and MITHQAL failures have deterministic recovery. |
| `MBG-T11` | ECONOMICS | Bank integration cost is measurable. |
| `MBG-T12` | ECONOMICS | Bank ROI is measurable. |
| `MBG-T13` | ADAPTER_MODULARITY | ISO 20022/API/host-to-host adapters are modular. |
| `MBG-T14` | CBDC_INTEROP | CBDC can connect through the same gateway architecture. |
| `MBG-T15` | BRICS_NEUTRALITY | BRICS adapter remains modular and optional. |
| `MBG-T16` | CORE_ARCHITECTURE | No bank core replacement is required. |
| `MBG-T17` | HONEST_STATE | No false claim of "zero integration" is made. |
| `MBG-T18` | ARCHITECTURE_CONSISTENCY | Architecture is updated everywhere in blueprint and code. |
| `MBG-T19` | SECURITY | Zero-trust authentication enforced. |
| `MBG-T20` | SECURITY | Connectivity security profile verified. |

Each test's status moves from `SIMULATED` to `PASS` / `FAIL` / `BLOCKED` based on real test execution.

#### 7.2.2 Integration Tests

The bank runs end-to-end integration tests:

- **Instruction submission** — submit a test instruction through each connector class; verify it appears on the MITHQAL canonical ledger.
- **Status query** — query the status of a submitted instruction; verify the 13-state `MTQStatusEvent` lifecycle.
- **Reconciliation** — run the 5-way reconciliation; verify `RECONCILED` status with all-zero totals (pre-pilot baseline).
- **Reversal** — submit a reversal request; verify the reversal flow.

#### 7.2.3 Security Tests

The bank + an independent security firm conduct:

- **Penetration testing** — attempt to bypass zero-trust verification (5 authentications).
- **Replay attack testing** — submit the same instruction with the same nonce twice; verify the second is rejected.
- **Key compromise drill** — simulate bank key compromise; verify emergency revocation (60 seconds).
- **Gateway failure drill** — simulate gateway failure; verify the 8-step `RecoveryPlan` executes correctly.

#### 7.2.4 Performance Tests

The bank runs performance tests to verify the gateway can handle expected load:

| Metric | Tier-1 target | Tier-2 target | Tier-3 target |
|---|---|---|---|
| Throughput | 1000 instructions/minute | 200 instructions/minute | 50 instructions/minute |
| Latency (p50) | < 500 ms | < 800 ms | < 1200 ms |
| Latency (p99) | < 2000 ms | < 3000 ms | < 5000 ms |
| Reconciliation time (5-way) | < 60 seconds | < 120 seconds | < 300 seconds |

### 7.3 Exit Criteria

- [ ] All 20 MBG tests passing (`status = "PASS"`)
- [ ] Integration tests passing (instruction submission, status query, reconciliation, reversal)
- [ ] Security tests passing (penetration, replay, key compromise, gateway failure)
- [ ] Performance tests meeting tier-specific targets
- [ ] Independent security review report signed (per §22 cost model `securityReview` line item)
- [ ] Adapter `evidenceClass` moved from `SIMULATED` to `CONTRACTED`

---

## 8. Phase 5 — UAT

### 8.1 Objectives

- User acceptance testing with bank operations + compliance + treasury stakeholders.
- Validate reconciliation against the bank's real GL.
- Validate status translation into the bank's existing portal.
- Demonstrate end-to-end payment flow.

### 8.2 Activities

#### 8.2.1 User Acceptance

Bank operations, compliance, and treasury stakeholders test the gateway:

- **Operations team** — verify gateway metrics, incident dashboards, reconciliation reports.
- **Compliance team** — verify the `BankComplianceAttestation` signing process; verify the 7 assertions are correctly populated.
- **Treasury team** — verify the FX reference preservation through `fxReference`; verify Nostro/Vostro reconciliation.
- **Corporate banking team** — verify the corporate customer's existing portal shows the MTQ settlement position.

#### 8.2.2 Reconciliation Validation

The bank runs the 5-way reconciliation against its real GL:

1. **Canonical ledger total** — MITHQAL canonical MTQ supply.
2. **Bank subledger total** — sum of all bank's MTQ positions.
3. **Corporate positions total** — sum of all corporate MTQ positions held by the bank.
4. **Reserve ledger total** — reserve liability (S × PAR).
5. **Proof-of-liabilities total** — proof-of-liabilities commitment.

All 5 totals must match exactly (`deltaBps = 0`) for the reconciliation to return `RECONCILED`.

#### 8.2.3 Status Translation Validation

The bank validates the `MTQStatusEvent → bank-portal status code` mapping:

| MTQStatusEvent | Bank portal code (illustrative) |
|---|---|
| `RECEIVED` | `PENDING` |
| `AUTHORIZED` | `VERIFIED` |
| `COMPLIANCE_VERIFIED` | `COMPLIANCE_CLEAR` |
| `ISSUANCE_PENDING` | `PROCESSING` |
| `ISSUED` | `MTQ_CREDITED` |
| `SETTLEMENT_PENDING` | `IN_TRANSIT` |
| `SETTLED` | `COMPLETED` |
| `REDEMPTION_PENDING` | `REDEMPTION_PROCESSING` |
| `REDEEMED` | `REDEMPTION_COMPLETED` |
| `COMPLETED` | `CLOSED` |
| `BLOCKED` | `BLOCKED` |
| `SUSPENDED` | `ON_HOLD` |
| `RESOLUTION` | `UNDER_REVIEW` |

The bank's existing corporate portal renders these codes; the corporate customer sees a familiar status progression.

#### 8.2.4 End-to-End Payment Flow

The bank demonstrates an end-to-end payment flow:

1. Corporate customer initiates a payment in the bank's existing corporate portal.
2. Bank's existing systems perform KYC, AML, sanctions, account authority, funds availability.
3. Bank's existing authorization completes.
4. MBG translates the authorized instruction into an `MTQSettlementInstruction`.
5. MITHQAL canonical ledger mints MTQ against verified reserves.
6. MTQ settles through the MITHQAL settlement network.
7. Receiving bank's MBG receives the MTQ credit; posts to its bank MTQ subledger.
8. Receiving corporate sees the position in its existing bank corporate portal.
9. Bank's `AccountingReconciliationAdapter` maps the MTQ event to the bank's GL accounts.
10. 5-way reconciliation returns `RECONCILED`.

### 8.3 Exit Criteria

- [ ] User acceptance signed off by operations, compliance, treasury, corporate banking
- [ ] Reconciliation validated against bank's real GL (5-way RECONCILED)
- [ ] Status translation validated into bank's existing portal
- [ ] End-to-end payment flow demonstrated successfully
- [ ] Adapter `evidenceClass` ready to move to `LIVE` (after Phase 6 first live transaction)

---

## 9. Phase 6 — Production

### 9.1 Objectives

- Execute the cutover plan.
- Establish monitoring + incident response.
- Test disaster recovery.
- Execute the first live pilot transaction.

### 9.2 Activities

#### 9.2.1 Cutover Plan

The cutover plan documents:

1. **Pre-cutover checklist** — all Phase 5 exit criteria met, cutover plan approved by bank CTO + MITHQAL ops lead.
2. **Cutover window** — typically a weekend maintenance window (Saturday 02:00-06:00 bank-local time).
3. **Cutover steps**:
   - Freeze new instruction submission (gateway `internalState = PAUSED`).
   - Drain pending instructions (wait for all in-flight to settle or queue).
   - Switch gateway `internalState = ACTIVE` for production.
   - Switch adapter `evidenceClass = LIVE`.
   - Begin live instruction submission.
4. **Post-cutover verification** — first 5 transactions reconciled; first 5 reconciliation cycles `RECONCILED`.

#### 9.2.2 Monitoring

The bank establishes monitoring:

- **Gateway heartbeat** — every 30 seconds; alert if missed.
- **Gateway metrics** — `instructionsReceived`, `instructionsSettled`, `instructionsRejected`, `instructionsPending`; alert on rejection rate > threshold.
- **Reconciliation status** — every cycle; alert on `MISMATCH` / `CRITICAL` / `LOCKED`.
- **Connectivity security** — alert on mTLS cert expiry < 30 days, key rotation overdue, IP allowlist change.
- **Incident dashboard** — `/gateway/v1/incidents` endpoint (one of the 8 API endpoints).

#### 9.2.3 Incident Response

The bank + MITHQAL ops jointly establish the incident response playbook:

| Incident type | Response |
|---|---|
| Gateway failure (`GatewayFailureState`) | `handleGatewayFailure(failure)` returns 8-step manual controlled `RecoveryPlan`. Council approval required for `BANK_KEY_COMPROMISE` / `BANK_FRAUD_DETECTION` / `REGULATOR_HOLD`. |
| MITHQAL-side failure (`MithqalSideFailureState`) | Bank systems default to `PENDING_MITHQAL_CONFIRMATION` until explicit finality received. Never imply technical failure = payment completion. |
| Reconciliation `MISMATCH` | RESTRICT affected operations; auto-escalate within 1 hour; preserve forensic evidence. |
| Reconciliation `CRITICAL` | SUSPEND all settlement operations; immediate page bank ops lead + MITHQAL ops lead; manual controlled recovery only. |
| Reconciliation `LOCKED` | 4-of-7 Council + bank lead signoff to RESTORE. |

#### 9.2.4 Disaster Recovery

The bank tests disaster recovery:

- **Gateway failure drill** — simulate gateway crash; verify 8-step recovery plan executes.
- **HSM failure drill** — simulate HSM failure; verify bank's documented recovery runbook executes; M-of-N recovery.
- **Key compromise drill** — simulate key compromise; verify emergency revocation (60 seconds); verify council-approved recovery.
- **MITHQAL-side outage drill** — simulate canonical ledger outage; verify bank defaults to `PENDING_MITHQAL_CONFIRMATION`.

#### 9.2.5 First Live Pilot Transaction

The bank executes the first live (non-zero-value) pilot transaction:

1. Corporate customer initiates a real payment through the bank's existing portal.
2. Bank's existing systems authorize the payment.
3. MBG translates to `MTQSettlementInstruction`.
4. MITHQAL canonical ledger mints MTQ against verified reserves.
5. MTQ settles through the MITHQAL settlement network.
6. Receiving bank's MBG receives the MTQ credit.
7. 5-way reconciliation returns `RECONCILED`.

On successful execution, the integration state moves from `BANK-CONTRACTED` to `LIVE-PILOT`.

### 9.3 Exit Criteria

- [ ] Cutover plan executed successfully
- [ ] Monitoring operational (heartbeat, metrics, reconciliation, connectivity security, incidents)
- [ ] Incident response playbook tested (gateway failure, MITHQAL-side failure, reconciliation mismatch)
- [ ] Disaster recovery tested (gateway, HSM, key compromise, MITHQAL outage)
- [ ] First live pilot transaction executed successfully
- [ ] Integration state moved from `BANK-CONTRACTED` to `LIVE-PILOT`

---

## 10. Integration Timeline by Bank Tier

The integration timeline varies by bank tier. The `calculateBankIntegrationCost(bankSize)` function in §22 of source returns tier-specific estimates.

### 10.1 Tier-1 (Global SIB / Major Money-Center Bank > $1T Assets)

| Property | Value |
|---|---|
| Estimated implementation weeks | 16 weeks |
| Integration depth | DEEP |
| Total one-time cost | $400,000 |
| Annual recurring (maintenance) | $80,000 |
| Typical connectors | `ISO_20022` + `BANK_REST_API` + `TREASURY_SYSTEM` + `HOST_TO_HOST` (4 connectors) |
| Typical deployment model | `MODEL_A_BANK_HOSTED` (on-prem) |

**Cost breakdown:**

| Component | Tier-1 cost |
|---|---|
| Technical integration | $180,000 |
| Security review | $60,000 |
| Compliance review | $50,000 |
| Legal review | $50,000 |
| Operations | $30,000 |
| Certification | $30,000 |
| Maintenance (annual) | $80,000 |
| **Total one-time** | **$400,000** |
| **Annual recurring** | **$80,000** |

### 10.2 Tier-2 (Regional / Large Commercial Bank $100B-$1T Assets)

| Property | Value |
|---|---|
| Estimated implementation weeks | 12 weeks |
| Integration depth | MODERATE |
| Total one-time cost | $200,000 |
| Annual recurring (maintenance) | $40,000 |
| Typical connectors | `ISO_20022` + `BANK_REST_API` + `EXISTING_PAYMENT_GATEWAY` (3 connectors) |
| Typical deployment model | `MODEL_B_BANK_SECURED_PRIVATE` (bank-approved private cloud) |

**Cost breakdown:**

| Component | Tier-2 cost |
|---|---|
| Technical integration | $90,000 |
| Security review | $30,000 |
| Compliance review | $25,000 |
| Legal review | $25,000 |
| Operations | $15,000 |
| Certification | $15,000 |
| Maintenance (annual) | $40,000 |
| **Total one-time** | **$200,000** |
| **Annual recurring** | **$40,000** |

### 10.3 Tier-3 (Smaller Commercial Bank < $100B Assets)

| Property | Value |
|---|---|
| Estimated implementation weeks | 8 weeks |
| Integration depth | MINIMAL |
| Total one-time cost | $80,000 |
| Annual recurring (maintenance) | $20,000 |
| Typical connectors | `BANK_REST_API` + `CORPORATE_ERP_CONNECTIVITY` (2 connectors) |
| Typical deployment model | `MODEL_C_APPROVED_MANAGED` (managed-service provider) |

**Cost breakdown:**

| Component | Tier-3 cost |
|---|---|
| Technical integration | $35,000 |
| Security review | $12,000 |
| Compliance review | $10,000 |
| Legal review | $10,000 |
| Operations | $6,000 |
| Certification | $7,000 |
| Maintenance (annual) | $20,000 |
| **Total one-time** | **$80,000** |
| **Annual recurring** | **$20,000** |

### 10.4 The Honest Note

```typescript
honestNote:
  "No core replacement. Minimal integration. Existing banking systems remain authoritative. " +
  "Estimates are planning ranges; actual costs depend on bank's existing infrastructure, " +
  "chosen connector class(es), deployment model, and integration depth.",
```

These are **planning estimates**, not quotes. Actual costs depend on:

- The bank's existing infrastructure (which systems need adaptation)
- The chosen connector classes (more connectors = more integration work)
- The deployment model (MODEL_C has additional managed-service provider costs)
- The integration depth (MINIMAL / MODERATE / DEEP)

---

## 11. Bank Responsibilities

The bank retains authoritative ownership of:

| Function | Bank responsibility | Why it stays at the bank |
|---|---|---|
| **Customer identity (KYC/KYB/UBO)** | Full customer identity vault | Bank is the customer-identity authority (Layer 1 of privacy model). MITHQAL receives only pseudonymous references. |
| **Compliance (AML/sanctions)** | Authoritative AML/sanctions screening + monitoring + escalation | Bank's existing compliance program; MITHQAL validates bank-signed attestation only. |
| **Customer deposits / accounts** | Customer deposits, accounts, lending, corporate services | Bank retains customer relationship; MITHQAL never touches customer deposits. |
| **FX** | FX authority | MITHQAL is not an FX exchange; banks remain FX authority. |
| **Treasury** | Treasury authority (Nostro/Vostro, FX, liquidity sweeps) | Bank treasury remains authoritative for bank-side liquidity. |
| **Accounting / GL** | Bank's chart of accounts, GL, fee accounts, FX fee accounts | MITHQAL does NOT prescribe the bank's chart of accounts. |
| **Customer UX / portal** | Existing bank corporate portal | Default `customerExperienceMode = "EXISTING_BANK_UX"`. |
| **Key custody** | Bank HSM / MPC / approved KMS | `mithqalDoesNotPossessCustomerPrivateKeys = true` is an enforced invariant. |
| **Authentication** | Bank officer MFA, SSO, RBAC, separation of duties | Bank's existing authentication model; MBG adds zero-trust layer. |
| **Limits / velocity** | Bank-side limits (per-transaction, daily, monthly, velocity) | Bank's existing limits profile; MBG enforces at gateway layer. |
| **Fraud detection** | Bank's existing fraud monitoring, investigation, escalation | Bank's existing fraud controls; MBG adds network-level anomaly detection. |
| **Recovery** | Bank's documented recovery runbook, M-of-N recovery | Bank's existing recovery process; MBG adds `RecoveryPlan` execution. |
| **Existing rails** | SWIFT, ISO 20022, correspondent banking, domestic payment systems, CBDC participation | All existing rails coexist with MTQ. |
| **BRICS posture** | Bank's own BRICS posture (only where officially authorized) | BRICS adapter is optional and modular. |

### 11.1 What the Bank Must Continue Doing

The bank does not stop doing anything it currently does. The MBG adds an additional settlement layer; it does not replace existing operations.

### 11.2 What the Bank Must Add

The bank must add:

1. The MBG sidecar (deployed per chosen deployment model).
2. The MSAS adapter instances (one per selected connector class).
3. The bank-controlled key management (HSM / MPC) for the new attestation keys.
4. The compliance attestation signing process (for the 7 required assertions).
5. The `AccountingReconciliationAdapter` mapping (bank GL account codes for MTQ events).
6. The corporate customer's bank-linked MTQ settlement account (per §9 of source).

These are additive — they do not replace any existing bank operation.

---

## 12. MITHQAL Responsibilities

MITHQAL provides:

| Function | MITHQAL responsibility |
|---|---|
| **Institutional authorization** | Authorize registered institutions to participate in the MITHQAL settlement network. |
| **MTQ issuance** | Canonical MTQ supply, mint/burn lifecycle, against verified reserves. |
| **Settlement** | Neutral wholesale settlement layer — MTQ settlement network. |
| **Canonical ledger** | Authoritative canonical MTQ supply ledger (Theorem S1 — single canonical supply). |
| **Reserve engine** | Reserve verification (RR ≥ 100%), reserve ledger. |
| **Reconciliation** | 5-way reconciliation engine (canonical / bank subledger / corporate positions / reserve / proof-of-liabilities). |
| **JSG** | Jurisdictional Settlement Gateway — per-jurisdiction policy enforcement. |
| **ILPS** | 5-layer liquidity controls (NORMAL / ELEVATED / STRESSED / CRITICAL / HALTED). |
| **Privacy / ZK** | ZK proof verification, selective disclosure support, verifiable credential validation. |
| **CBDC neutrality** | Neutral settlement layer between CBDCs (CBDCs remain sovereign liabilities). |
| **MSAS standard** | Open standard for adapter specification + certification process. |
| **API surface** | 8 versioned gateway endpoints under `/gateway/v1/*`. |
| **Honest state enforcement** | INTEGRATION-READY / BANK-CONTRACTED / LIVE-PILOT state machine with NEVER rules. |

### 12.1 What MITHQAL Does NOT Do

- ❌ Customer KYC / KYB / UBO (bank's responsibility)
- ❌ Customer PII storage (never receives customer PII)
- ❌ Bank key custody (`mithqalDoesNotPossessCustomerPrivateKeys = true`)
- ❌ Bank GL / chart of accounts (bank's responsibility)
- ❌ FX (banks remain FX authority; MITHQAL is not an FX exchange)
- ❌ Customer deposits / lending / corporate services (bank's responsibility)
- ❌ Customer UX / portal (default `EXISTING_BANK_UX`)
- ❌ SWIFT messaging (SWIFT carries messaging; MITHQAL provides settlement)
- ❌ BRICS mandating (BRICS adapter is optional)
- ❌ CBDC mandating (CBDC participation is optional)

---

## 13. Common Integration Pitfalls + How to Avoid Them

### 13.1 Pitfall 1 — Skipping the Discovery Phase

**Symptom:** Bank wants to jump straight to Build ("we know what we want, just deploy it").

**Why it fails:** Without Discovery, the bank may not have identified all relevant upstream systems, may have misjudged the deployment model, may have under-estimated the integration depth.

**How to avoid:** Insist on the full 6-phase journey. Discovery is the cheapest phase (1-2 weeks); skipping it costs much more later.

### 13.2 Pitfall 2 — Choosing the Wrong Deployment Model

**Symptom:** Bank chooses `MODEL_C_APPROVED_MANAGED` because it sounds easiest, then discovers the managed-service provider cannot meet the bank's data-sovereignty requirements.

**Why it fails:** `MODEL_C` is an EXCEPTION, not a default. Most banks should choose `MODEL_A` or `MODEL_B`.

**How to avoid:** Default to `MODEL_A` (bank-hosted) or `MODEL_B` (bank-secured private). Only choose `MODEL_C` if the bank genuinely lacks sidecar operations capability.

### 13.3 Pitfall 3 — Selecting Too Many Connector Classes

**Symptom:** Bank selects all 7 connector classes "for completeness", then discovers it cannot certify all of them within the integration timeline.

**Why it fails:** Each connector class requires its own certification (translation rules review + 20 tests + independent security review). More connectors = more work.

**How to avoid:** Start with the minimum subset that covers the bank's primary flows (typically 2-3 connectors). Add more in subsequent phases.

### 13.4 Pitfall 4 — Not Involving Compliance Early

**Symptom:** Bank's compliance team is brought in late (Phase 4 or 5), then discovers the `BankComplianceAttestation` design doesn't match the bank's existing compliance process.

**Why it fails:** Compliance must be involved in Phase 2 (Design) to design the attestation signing process.

**How to avoid:** Include compliance officer in Phase 1 Discovery; have compliance sign off on the Phase 2 design.

### 13.5 Pitfall 5 — Treating the 12 Connectivity Security Controls as Optional

**Symptom:** Bank tries to skip some of the 12 controls (e.g. "we already have mTLS, we don't need IP allowlisting").

**Why it fails:** `verifyConnectivitySecurity(profile)` returns `valid = false` if any of the 12 controls is missing or unpopulated. The gateway will not accept instructions.

**How to avoid:** All 12 controls are mandatory. Plan to implement all 12 in Phase 3 (Build).

### 13.6 Pitfall 6 — Underestimating the Independent Security Review

**Symptom:** Bank treats the independent security review as a formality, then fails certification because the review found issues.

**Why it fails:** The independent security review (per §22 cost model `securityReview` line item) is a real review by an external security firm. It can find issues.

**How to avoid:** Budget the security review cost (Tier-1: $60K, Tier-2: $30K, Tier-3: $12K). Plan for the review to take 2-4 weeks. Be prepared to remediate findings before certification.

### 13.7 Pitfall 7 — Assuming the 5-Way Reconciliation Will Pass on Day One

**Symptom:** Bank runs the 5-way reconciliation in Phase 4 (Test), gets `MISMATCH`, panics.

**Why it fails:** The 5-way reconciliation requires all 5 totals to match exactly (`deltaBps = 0`). This requires careful alignment between the bank's subledger, corporate positions, reserve ledger, and proof-of-liabilities.

**How to avoid:** Plan for reconciliation validation in Phase 5 (UAT), not Phase 4. Expect to spend 1-2 weeks aligning the 5 totals.

### 13.8 Pitfall 8 — Using "Zero Integration" Language

**Symptom:** Bank's marketing materials describe the MBG as "zero integration" or "plug and play".

**Why it fails:** `noFalseZeroIntegrationClaim = true` is an enforced invariant. The MBG requires "minimal integration", not "zero integration".

**How to avoid:** Always use "minimal integration" language. Never use "zero integration". This is enforced by `MBG_NEVER_RULES.neverClaimZeroIntegrationWhenMinimalIsRequired`.

### 13.9 Pitfall 9 — Skipping the Disaster Recovery Drill

**Symptom:** Bank goes to Production without testing disaster recovery, then discovers the recovery plan doesn't work when a real incident occurs.

**Why it fails:** Disaster recovery is not theoretical. The 8-step `RecoveryPlan` (§19 of source) must be tested with a real drill.

**How to avoid:** Schedule disaster recovery drills in Phase 6 (Production). Test gateway failure, HSM failure, key compromise, MITHQAL-side outage.

### 13.10 Pitfall 10 — Forgetting the 10 Standing Blockers

**Symptom:** Bank assumes that completing the 6-phase integration journey resolves the 10 standing blockers (per `final-pilot-activation-gate.ts`).

**Why it fails:** The MBG amendment does NOT resolve the 10 standing blockers. They remain open.

**How to avoid:** Be transparent with the bank about the 10 standing blockers. The MBG integration moves the integration state from `INTEGRATION-READY` to `BANK-CONTRACTED` to `LIVE-PILOT`. It does NOT move the v25.0 architecture from `PILOT-READY` to `PRODUCTION-READY`.

---

## 14. Honest State

### 14.1 The Headline

```
IntegrationState = "INTEGRATION-READY"
Banks contracted = 0
Banks live-pilot = 0
Real bank integrations = 0
All 20 required tests = SIMULATED
All 18 acceptance criteria = met=true AT THE LOGIC/SPEC LEVEL
```

### 14.2 What This Guide Is

This guide describes the integration journey a bank **would** take. It does not describe an integration journey that has actually happened. No real bank has completed any of the 6 phases. No real bank has run any of the 20 tests. No real bank has signed an integration agreement.

### 14.3 What This Guide Is NOT

| Possible misreading | Truth |
|---|---|
| "Banks can plug and play" | No — banks must complete the 6-phase integration journey. |
| "Live pilot is imminent" | No — moving to `BANK-CONTRACTED` requires a real bank to sign + certify. |
| "Tests have passed" | No — all 20 tests are `SIMULATED`. They will move to `PASS` / `FAIL` / `BLOCKED` only when a real bank runs them. |
| "The 10 standing blockers are resolved" | No — the MBG amendment does NOT resolve the 10 standing blockers. |

### 14.4 The Three NEVER Rules

```
neverConvertSimulatedToBankContracted         = true
neverConvertIntegrationReadyToLivePilot       = true
neverClaimZeroIntegrationWhenMinimalIsRequired = true
```

The integration state will ONLY move from `INTEGRATION-READY` to `BANK-CONTRACTED` when a real bank signs an integration agreement + completes technical certification. It will ONLY move from `BANK-CONTRACTED` to `LIVE-PILOT` when that bank executes a real (non-zero-value) pilot transaction.

### 14.5 The Final Reminder

> *INTEGRATION-READY (AMBER). Logic-level spec complete. 0 real banks contracted. 20 tests SIMULATED. 18 acceptance criteria met at logic/spec level (evidence explicitly notes 'INTEGRATION-READY — no real bank contracted yet'). Canonical principle: 'TRANSLATION, NOT TRANSFORMATION.' No core replacement. Minimal integration. Existing banking systems remain authoritative. The 10 standing blockers (per `final-pilot-activation-gate.ts`) remain open.*

---

## Appendix A — Cross-References

| Topic | Document |
|---|---|
| MBG architecture (canonical) | `docs/architecture/mbg/MITHQAL_BANK_GATEWAY_ARCHITECTURE.md` |
| Adapter standard (MSAS) | `docs/architecture/mbg/MITHQAL_ADAPTER_STANDARD_MSAS.md` |
| Bank security guide | `docs/architecture/mbg/MITHQAL_BANK_SECURITY_GUIDE.md` |
| Reconciliation architecture | `docs/architecture/mbg/MITHQAL_BANK_RECONCILIATION_GUIDE.md` |
| Bank ROI / cost model | `docs/architecture/mbg/MITHQAL_BANK_ROI_MODEL.md` |
| Corporate user flow | `docs/architecture/mbg/MITHQAL_CORPORATE_USER_FLOW.md` |
| Source module | `src/lib/mithqal-bank-gateway.ts` (3,969 lines) |
| Cost model function | `calculateBankIntegrationCost(bankSize)` in source module §22 |
| 20 required tests | `BANK_GATEWAY_TESTS` in source module §28 |
| 18 acceptance criteria | `MBG_ACCEPTANCE_CRITERIA` in source module §35 |
| API endpoint discovery | `/api/gateway/v1` (8 endpoints) |
| Final pilot activation gate | `docs/verification/v25-0-final-pilot-activation-gate.md` |

## Appendix B — Integration Quick-Reference Card

```
Phase 1 — Discovery (1-2 weeks)
  - Inventory upstream systems
  - Select MSAS connector classes (subset of 7)
  - Select deployment model (MODEL_A / MODEL_B / MODEL_C)
  - Sign technical scoping document

Phase 2 — Design (1-2 weeks)
  - Map upstream interfaces to MTQSettlementInstruction fields
  - Configure MSAS adapters
  - Design BankSecurityProfile
  - Design ConnectivitySecurityProfile (12 controls)

Phase 3 — Build (3-6 weeks)
  - Deploy MBG sidecar
  - Implement MSAS adapters
  - Set up HSM / MPC key management
  - Configure 12 connectivity security controls
  - Smoke test (SIMULATED instruction)

Phase 4 — Test (2-3 weeks)
  - Run 20 MBG tests (MBG-T01..MBG-T20)
  - Run integration tests
  - Run security tests (penetration, replay, key compromise, gateway failure)
  - Run performance tests
  - Independent security review

Phase 5 — UAT (1-2 weeks)
  - User acceptance (operations, compliance, treasury, corporate banking)
  - Reconciliation validation (5-way RECONCILED)
  - Status translation validation
  - End-to-end payment flow demonstration

Phase 6 — Production (1 week + ongoing)
  - Cutover plan
  - Monitoring + incident response
  - Disaster recovery drills
  - First live pilot transaction
```

---

*End of MITHQAL_BANK_INTEGRATION_GUIDE.md — v25.0-mbg-amendment-1.0 — INTEGRATION-READY, 0 banks contracted.*

# MITHQAL Bank Gateway — Canonical Architecture

> **File:** MITHQAL_BANK_GATEWAY_ARCHITECTURE.md
> **Task ID:** MBG-DOCUMENTATION
> **Source module:** `src/lib/mithqal-bank-gateway.ts` (3,969 lines — the source of truth)
> **Document version:** v25.0-mbg-amendment-1.0
> **Honest state declaration:** **INTEGRATION-READY — 0 banks contracted.**
> **Canonical principle:** *"TRANSLATION, NOT TRANSFORMATION."*

---

## Table of Contents

1. [The Canonical Principle](#1-the-canonical-principle)
2. [Architectural Overview — What MBG Is, What It Is NOT](#2-architectural-overview--what-mbg-is-what-it-is-not)
3. [The Canonical Architecture Diagram](#3-the-canonical-architecture-diagram)
4. [Component Breakdown](#4-component-breakdown)
5. [What MITHQAL Provides vs What the Bank Keeps](#5-what-mithqal-provides-vs-what-the-bank-keeps)
6. [Deployment Models (MODEL_A / MODEL_B / MODEL_C)](#6-deployment-models-model_a--model_b--model_c)
7. [Central-Bank Benefit Architecture (§25)](#7-central-bank-benefit-architecture-25)
8. [CBDC Compatibility (§26)](#8-cbdc-compatibility-26)
9. [BRICS Compatibility (§27 — Modular, Optional, Not Core Dependency)](#9-brics-compatibility-27--modular-optional-not-core-dependency)
10. [SWIFT Compatibility — Not SWIFT Replacement (§21A)](#10-swift-compatibility--not-swift-replacement-21a)
11. [Correspondent / Payment-Rail Coexistence (§21)](#11-correspondent--payment-rail-coexistence-21)
12. ["DO NOT MODIFY" Rules — 12 Forbidden Changes (§34)](#12-do-not-modify-rules--12-forbidden-changes-34)
13. [Honest State Declaration](#13-honest-state-declaration)

---

## 1. The Canonical Principle

> **"TRANSLATION, NOT TRANSFORMATION."**

This is the single architectural rule that governs the entire MITHQAL Bank Gateway (MBG) amendment. Every interface, every connector, every deployment model, every security control exists to *translate* between two existing worlds — the bank's existing authorized banking instructions and the MITHQAL canonical settlement ledger — and **never to transform** either of them.

### 1.1 What "Translation" Means

The MBG accepts instructions in formats banks already speak — ISO 20022 `pacs.008`, bank-proprietary REST APIs, mainframe host-to-host (H2H) batch records, SFTP settlement files, treasury management system (TMS) outputs, corporate ERP payment runs — and produces a canonical `MTQSettlementInstruction` (see §6 of the source module) that the MITHQAL core understands.

```
BANK SIDE                                MITHQAL SIDE
+--------------------------+             +--------------------------+
| Existing bank           |  translate  | Canonical                |
| instruction (pacs.008,   |  ========>  | MTQSettlementInstruction |
| REST, H2H, SFTP, TMS,    |  <=======   | (22 canonical fields)     |
| ERP payment run)         |  translate  |                          |
+--------------------------+             +--------------------------+
        |                                       |
        v                                       v
+--------------------------+             +--------------------------+
| Bank's existing          |             | MITHQAL canonical ledger |
| operating environment    |             | (settlement + reserve +   |
| (KYC, AML, GL, treasury) |             |  reconciliation engine)   |
+--------------------------+             +--------------------------+
```

### 1.2 What "Not Transformation" Means

The MBG must never:

- **Replace the bank's core banking system.** `coreBankingReplacementRequired` is hard-typed to `false` in the `BankIntegrationCostModel` interface (§22 of source). This is enforced by a module-load invariant (see `_INVARIANTS` in source).
- **Take over the bank's compliance function.** The bank remains the authoritative KYC/KYB/AML/sanctions authority; MITHQAL only validates the bank's signed attestation (see §7 `BankComplianceAttestation`).
- **Possess customer private keys.** `mithqalDoesNotPossessCustomerPrivateKeys` is hard-typed to `true` in `BankSecurityProfile` (§10 of source).
- **Become the customer identity authority.** Customer identity lives at the bank (Layer 1 of the privacy model — see §8 `BankGatewayPrivacyExchange`).
- **Invent a new customer-facing API surface.** The MSAS adapter standard reuses what the bank already exposes; it does not invent a new consumer UX.

> **Note:** The MBG is sometimes described informally as "MITHQAL for banks." That phrasing is acceptable *only* if it is paired with the canonical principle. Without "TRANSLATION, NOT TRANSFORMATION," the shorthand misleads — it implies MITHQAL becomes a bank product, which it does not.

### 1.3 Why This Principle Matters Strategically

Most distributed-ledger / tokenized-settlement projects fail at the bank adoption stage because they require the bank to (a) replace core systems, (b) surrender key custody, or (c) become a node on someone else's network. Each of these is a non-starter for a regulated institution.

The translation principle removes all three blockers:

| Blocker | Translation answer |
|---|---|
| "Don't replace my core banking" | MBG is a sidecar; bank keeps core systems authoritative. |
| "Don't take my keys" | Keys stay in bank HSM/MPC; MITHQAL sees only signed messages. |
| "Don't make me a node on your network" | Bank is not a node; it connects via MSAS adapter to a gateway that talks to MITHQAL canonical core. |

The 12 DO NOT MODIFY rules in §34 of the source module (and §12 of this document) exist to make this principle durable against future amendments.

---

## 2. Architectural Overview — What MBG Is, What It Is NOT

### 2.1 What MBG IS

The **MITHQAL Bank Gateway (MBG)** is a standardized sidecar / adapter that a regulated bank deploys (or has deployed on its behalf under MODEL_C) to:

1. **Translate** existing authorized banking instructions into canonical `MTQSettlementInstruction` objects.
2. **Return** MTQ settlement status and reconciliation state into the bank's operating environment in formats the bank's existing systems already understand.
3. **Enforce** zero-trust authentication on every bank→MITHQAL request.
4. **Preserve** bank-side security (HSM/MPC key custody, RBAC, MFA, separation of duties).
5. **Coexist** with SWIFT, ISO 20022, correspondent banking, domestic payment systems, CBDCs, bank treasury, and FX infrastructure — it does not replace any of them.

### 2.2 What MBG Is NOT

| Claim | Reality |
|---|---|
| ❌ A consumer-facing product | MBG is wholesale B2B; corporate customers interact through their *existing* bank corporate portal. |
| ❌ A core banking replacement | `coreBankingReplacementRequired = false` is an enforced invariant. |
| ❌ A SWIFT replacement | `positioningNotReplacement = true` in `SWIFTCompatibilityProfile` (§21A). |
| ❌ A CBDC | MTQ is the neutral settlement layer; CBDCs remain sovereign liabilities. |
| ❌ A BRICS instrument | MTQ is not BRICS money; the BRICS adapter is optional and modular. |
| ❌ An FX exchange | `mithqalIsNotAnFxExchange = true` in `CorrespondentRailCompatibility` (§21). |
| ❌ A settlement layer that takes custody of bank customer funds | The bank retains customer deposits, accounts, treasury, FX, lending, corporate services. |
| ❌ An autonomous decision-maker | Every settlement instruction requires bank authorization + compliance attestation; MITHQAL never originates a customer-facing transaction. |
| ❌ A "zero integration" promise | All materials use **"minimal integration"** language — `noFalseZeroIntegrationClaim = true` is enforced. |

### 2.3 The Five Architectural Invariants

These are the non-negotiables documented in the module header (§1 of source):

```
1. Wholesale B2B (no retail).
2. Bank-mediated issuance (no individual minting).
3. Bank-controlled security (MITHQAL never possesses customer private keys).
4. 5-way reconciliation always active.
5. "Privacy by default. Traceability by authorization. Disclosure by law."
```

Plus the three operational rules that govern the integration lifecycle:

```
6. Core banking replacement NOT required.
7. "Minimal integration", never "zero integration".
8. BRICS adapter optional. CBDC participation not mandatory.
```

And the two monetary-neutrality rules:

```
9. MTQ is not BRICS money. MTQ is not U.S. money.
   MTQ is the neutral settlement layer.
10. CBDCs remain sovereign liabilities; MTQ is the neutral settlement
    layer between them.
```

### 2.4 Module-Level Source of Truth

The single TypeScript module `src/lib/mithqal-bank-gateway.ts` (3,969 lines) is the canonical source. It exports:

- **35 sections** of the v25.0 FINAL ARCHITECTURAL AMENDMENT prompt (§1, §2, §5, §6, §7, §8, §9, §10, §11, §12, §13, §15, §16, §17, §18, §19, §20, §21, §21A, §22, §23, §25, §26, §27, §28, §30, §33, §34, §35, plus executive report generator and honest-state enforcement).
- **20 required tests** `MBG-T01` … `MBG-T20` (all `SIMULATED`).
- **18 acceptance criteria** `MBG-AC-01` … `MBG-AC-18` (all `met=true` at logic/spec level; evidence notes "INTEGRATION-READY — no real bank contracted yet").
- **12 DO NOT MODIFY rules** `DNM-01` … `DNM-12`.
- **8 API endpoints** under `/gateway/v1/*`.
- **17 module-load invariants** asserted at runtime.

---

## 3. The Canonical Architecture Diagram

The diagram below is the verbatim ASCII produced by the source module's `FINAL_ARCHITECTURE_DIAGRAM` constant (§33 of source). It is the single authoritative visual reference for the MBG amendment.

```
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
```

### 3.1 End-to-End Flow (Corporate → Bank → MBG → MITHQAL Core → MTQ → Receiving Bank → Corporate)

Read the diagram left-to-right and back:

1. **Corporate customer** logs into its existing bank corporate portal (the bank's existing UX — not a MITHQAL UX).
2. **Bank's existing systems** handle KYC, AML, sanctions screening, account authority, funds availability, and produce an authorized payment instruction.
3. **MBG sidecar** translates that authorized instruction into a canonical `MTQSettlementInstruction` and signs it with the bank's HSM/MPC-backed attestation key.
4. The signed instruction traverses a mutual-TLS + signed-message + nonce + idempotency-key channel into the **MITHQAL Core**.
5. **MITHQAL Core** validates the bank's compliance attestation (7 assertions — see §7), verifies the reserve (RR ≥ 100%), mints MTQ against verified reserves, settles through the MITHQAL settlement network, and posts the canonical ledger entry.
6. **Receiving bank's MBG** receives the MTQ credit, posts it to its own Bank MTQ Subledger, and credits the receiving corporate's bank-linked MTQ settlement account (§9).
7. The **receiving corporate** sees the position appear in its existing bank corporate portal.

### 3.2 The Diagram's Three Layers

The diagram groups the components into three horizontal layers:

| Layer | Components | Owner |
|---|---|---|
| **Customer layer** | Corporate Customer, Bank Corporate Portal, Bank-Linked Corporate MTQ Settlement Account | Bank + corporate |
| **Institutional layer** | Regulated Bank, Bank MTQ Subledger, Bank MTQ Position, MITHQAL Bank Gateway (MBG) | Bank + MITHQAL jointly |
| **Settlement-core layer** | MITHQAL Canonical Reserve Ledger, MITHQAL Core (Canonical Supply / Reserve Engine / Settlement Net / ILPS / JSG / Privacy / 5-Way Recon / FV1-FV10) | MITHQAL |

The settlement-core layer is sovereign-neutral. The institutional layer is bank-joint. The customer layer remains the bank's customer relationship — MITHQAL never directly touches the corporate customer.

---

## 4. Component Breakdown

The MBG module exposes six first-class components. Each is summarized here with its source-module section reference.

### 4.1 MithqalBankGateway (§2)

The sidecar entity itself. A regulated bank deploys (or has deployed on its behalf under MODEL_C) one or more `MithqalBankGateway` instances.

```typescript
export interface MithqalBankGateway {
  gatewayId: string;
  bankId: string;
  institutionId: string;
  bankLegalName: string;
  jurisdiction: string;                         // ISO 3166-1 alpha-2

  deploymentModel: BankGatewayDeploymentModel;  // A / B / C
  connectorClasses: MSASConnectorClass[];       // subset of 7 classes

  internalState: GatewayInternalState;          // INITIALIZING | CERTIFIED | ACTIVE | PAUSED | RECOVERING | DECOMMISSIONED
  connectivityStatus: ConnectivityStatus;       // HEALTHY | DEGRADED | OFFLINE | SUSPENDED | REVOKED

  adapters: MSASAdapter[];                       // active translation adapters
  securityProfile: BankSecurityProfile;         // bank-controlled (§10)
  connectivitySecurity: ConnectivitySecurityProfile; // §17

  attestationKeys: {
    bankPublicKeyFingerprint: string;           // public key only — private never leaves bank
    bankSigningKeyAlgorithm: "ECDSA-P256" | "Ed25519" | "RSA-4096";
    keyRotationPolicyDays: number;
    lastRotatedAt: string;
    keyCustodyBinding: string;                  // opaque to MITHQAL
  };

  lastHeartbeat: string;
  heartbeatIntervalSeconds: number;

  metrics: {
    instructionsReceived: number;
    instructionsSettled: number;
    instructionsRejected: number;
    instructionsPending: number;
    lastReconciliationAt: string;
    lastReconciliationStatus: FiveWayReconciliationStatus;
  };

  dataClass: "SIMULATED" | "CONTRACTED" | "LIVE";
  createdAt: string;
  certifiedAt: string | null;
  decommissionedAt: string | null;
}
```

**Key invariants enforced:**

- `attestationKeys` carries only public key fingerprints + algorithm + rotation policy. Private keys live in the bank's HSM/MPC.
- `dataClass` escalation follows the closure-series pattern: `SIMULATED` → `CONTRACTED` → `LIVE`. The state can never jump from `SIMULATED` directly to `LIVE` (enforced by `MBG_NEVER_RULES.neverConvertSimulatedToBankContracted` and `neverConvertIntegrationReadyToLivePilot`).

### 4.2 MSAS — MITHQAL Standard Adapter Specification (§5)

The MSAS is the *open standard* that defines how bank-specific interfaces connect to the MBG. The standard supports **7 connector classes**:

| # | Connector class | Typical use |
|---|---|---|
| 1 | `ISO_20022` | Cross-border FI-to-FI messaging (pacs.008, pacs.009, pain.001, camt.054, camt.056). |
| 2 | `BANK_REST_API` | Bank's existing institutional REST API for corporate portal integration. |
| 3 | `HOST_TO_HOST` | Mainframe H2H batch records for settlement files. |
| 4 | `SECURE_FILE_EXCHANGE_SFTP` | SFTP + GPG end-of-day batch settlement files. |
| 5 | `EXISTING_PAYMENT_GATEWAY` | Bank's existing payment gateway (vendor-specific). |
| 6 | `TREASURY_SYSTEM` | Treasury management system (TMS) — Nostro/Vostro rebalancing, FX references. |
| 7 | `CORPORATE_ERP_CONNECTIVITY` | Corporate ERP (SAP S/4HANA, Oracle Fusion, Workday) — routed through bank. |

The standard is **open** (`openStandard = true`) and **never proprietary** (`proprietaryLockIn = false`). Banks may propose new connector classes through the MITHQAL certification authority (see `MSAS_STANDARD.certificationProcessSteps`).

> **See also:** `docs/architecture/mbg/MITHQAL_ADAPTER_STANDARD_MSAS.md` for the full adapter specification.

### 4.3 MTQSettlementInstruction (§6)

The canonical 22-field object the MBG produces after translating an authorized bank instruction. This is what MITHQAL Core receives — it contains *no customer PII*.

The 22 fields (the prompt header says "22 fields"; the source module enforces 23 because the enumerated list contains 23 distinct names — a minor prompt typo documented in the module's `_INVARIANTS` block):

| Group | Fields |
|---|---|
| Identity (6) | `instructionId`, `institutionId`, `originBankId`, `destinationBankId`, `corporateReference` (pseudonymous), `customerAuthorizationReference` |
| Money (3) | `amount`, `settlementCurrency`, `mtqAmount` |
| Purpose / Routing (3) | `transactionPurpose`, `jurisdiction`, `corridor` |
| Compliance (2) | `complianceAttestation` (§7 — 7 assertions), `sanctionsStatus` (CLEARED / PENDING_REVIEW / BLOCKED / FALSE_POSITIVE_REVIEW) |
| Policy / Reserve (3) | `policyVersion`, `liquidityStatus` (NORMAL / ELEVATED / STRESSED / CRITICAL / HALTED), `reserveReference` |
| Lifecycle (3) | `timestamp`, `expiry` (default 24h), `finalityState` (one of 13 MTQStatusEvent values) |
| Security / Idempotency (2) | `cryptographicSignature`, `idempotencyKey` |
| Bank reconciliation (1) | `bankTransactionReference` |

The `createMTQSettlementInstruction(input)` factory fills system-managed fields (instructionId, idempotencyKey, timestamp, expiry, reserveReference, cryptographicSignature placeholder) and accepts the business fields from the bank's translation adapter.

### 4.4 BankMTQSubledger (§12)

The bank's own subledger of MTQ positions for its corporate customers. This is the bank's authoritative record — it is reconciled against the MITHQAL canonical ledger (see §13 Five-Way Reconciliation).

```typescript
export interface BankMTQSubledger {
  bankId: string;
  corporatePositions: Array<{
    corporateReference: string;        // pseudonymous
    mtqPosition: number;
    lastUpdated: string;
  }>;
  aggregateMTQPosition: number;          // bank's net MTQ position
  cryptographicAttestation: string;      // bank's signed statement of accuracy
  lastReconciledAt: string;
}
```

The subledger aggregates per-corporate positions into a single bank-aggregate number, signed by the bank's attestation key. MITHQAL reconciles this against (a) the canonical ledger, (b) per-corporate positions, (c) reserve ledger, (d) proof-of-liabilities — see §13.

### 4.5 AccountingReconciliationAdapter (§11)

How MITHQAL events map into the bank's own accounting framework. **MITHQAL does NOT dictate the bank's chart of accounts.** The bank's accounting system remains authoritative; the adapter only produces reconciliation records the bank's GL can consume.

```typescript
export interface AccountingReconciliationAdapter {
  adapterId: string;
  bankTransactionReference: string;       // bank's own GL reference
  mtqSettlementId: string;                // MITHQAL-side ID
  mtqPosition: number;                    // corporate's post-event position
  fxReference: string | null;              // if FX was involved
  settlementStatus: "PENDING" | "SETTLED" | "FAILED" | "REVERSED";
  redemptionStatus: "NOT_APPLICABLE" | "PENDING" | "COMPLETED" | "FAILED";
  reserveReference: string;
  reconciliationState: FiveWayReconciliationStatus;

  accountingMapping: {
    bankGlAssetAccount: string;            // bank-defined, NOT MITHQAL-defined
    bankGlLiabilityAccount: string;
    bankGlFeeAccount: string;
    bankGlFxFeeAccount: string;
    mappingVersion: string;
    bankAccountingSystemAcknowledged: boolean;
  };
}
```

The `accountingMapping` block is the bank's own GL account codes — MITHQAL never prescribes these. The bank supplies its own mapping table; the adapter just records which GL accounts a given MTQ event touches.

### 4.6 BankSecurityProfile (§10)

The bank's own security architecture as it applies to the MBG. The canonical invariant is hard-typed:

```typescript
mithqalDoesNotPossessCustomerPrivateKeys: true;   // ALWAYS TRUE
```

The profile carries:

- `keyManagementType`: `BANK_HSM` | `BANK_MPC` | `BANK_APPROVED_KMS`
- `signingAuthority`: authorized signers, multi-sig threshold, threshold scheme (`M_OF_N` or `SINGLE_OFFICER_EMERGENCY`)
- `authenticationModel`: MFA required, MFA methods (HARDWARE_TOKEN / FIDO2 / BIOMETRIC / OTP), SSO integration (SAML / OIDC / NONE), session timeout
- `authorizationModel`: RBAC roles, ABAC policies, separation of duties enforced
- `corporateSignatoryControls`: corporate can initiate, bank approves before settlement, dual approval threshold
- `limitsProfile`: max single / daily / monthly transaction USD, velocity checks enabled
- `fraudControls`: real-time monitoring, anomaly detection, velocity rules, sanctions screening, investigation workflow
- `recoveryProcess`: documented runbook, M-of-N recovery required, last recovery drill date

> **See also:** `docs/architecture/mbg/MITHQAL_BANK_SECURITY_GUIDE.md` for the full security guide.

---

## 5. What MITHQAL Provides vs What the Bank Keeps

This is the most important table in the entire MBG amendment. It defines the boundary between the two institutions.

### 5.1 The Boundary Table

| Function | MITHQAL provides | Bank keeps |
|---|---|---|
| **Customer identity (KYC/KYB/UBO)** | Pseudonymous corporate reference + cryptographic attestation only | Full customer identity vault (Layer 1 of the privacy model) |
| **Compliance (AML/sanctions)** | Validation of bank-signed `BankComplianceAttestation` (7 assertions) | Authoritative AML/sanctions screening + monitoring + escalation |
| **Settlement instrument** | Canonical MTQ supply, mint/burn lifecycle, neutral settlement layer | — |
| **Reserve custody** | Reserve engine, reserve ledger, RR ≥ 100% enforcement | — |
| **Liquidity** | ILPS 5-layer liquidity controls (NORMAL/ELEVATED/STRESSED/CRITICAL/HALTED) | Bank treasury remains authoritative for bank-side liquidity |
| **Reconciliation** | 5-way reconciliation engine (canonical / bank subledger / corporate positions / reserve / proof-of-liabilities) | Bank MTQ subledger remains the bank's authoritative record |
| **Accounting / GL** | MITHQAL canonical ledger events | Bank's chart of accounts, GL, fee accounts, FX fee accounts |
| **FX** | — | Bank remains FX authority; MITHQAL is not an FX exchange |
| **Treasury** | — | Bank treasury remains authoritative for Nostro/Vostro, FX, liquidity sweeps |
| **Customer deposits / accounts** | — | Bank retains deposits, accounts, lending, corporate services |
| **Customer UX / portal** | (Optional) MTQ dashboard view if `customerExperienceMode = HYBRID` or `MTQ_DASHBOARD` | Existing bank corporate portal (default `EXISTING_BANK_UX`) |
| **Key custody** | Public attestation key fingerprints only | Bank HSM / MPC / approved KMS retains all private keys |
| **Authentication** | Zero-trust verification (5 authentications per request) | Bank officer MFA, SSO, RBAC, separation of duties |
| **Limits / velocity** | Settlement-network-level limits | Bank-side limits (per-transaction, daily, monthly, velocity) |
| **Fraud detection** | Network-level anomaly detection | Bank's existing fraud monitoring, investigation, escalation |
| **Recovery** | `RecoveryPlan` execution (manual controlled, council-approved for key compromise) | Bank's documented recovery runbook, M-of-N recovery |
| **JSG (jurisdiction)** | Jurisdictional Settlement Gateway enforcement | Bank jurisdictional compliance remains authoritative |
| **Privacy / ZK** | ZK proof verification, selective disclosure support, verifiable credential validation | Bank-issued ZK proofs, verifiable credentials, encrypted references |
| **CBDC** | Neutral settlement layer between CBDCs | CBDC participation (optional, not mandatory) |
| **BRICS** | — (modular, optional adapter) | Bank's own BRICS posture (only where officially authorized) |
| **SWIFT messaging** | — (MITHQAL is not a SWIFT replacement) | Bank's existing SWIFT connectivity remains |

### 5.2 The "Translation Surface"

The MBG's entire job is to translate *across* this boundary. The translation surface is narrow by design:

- **Inbound:** bank's authorized instruction (pacs.008 / REST / H2H / SFTP / TMS / ERP) → canonical `MTQSettlementInstruction`.
- **Outbound:** MTQ `finalityState` (one of 13 states) → bank-consumable status code + reconciliation record.

Everything else — KYC, AML, GL, treasury, deposits, lending, FX, customer UX — stays on the bank side. MITHQAL never crosses into those domains.

### 5.3 Why This Boundary Matters for Bank Adoption

A bank CTO reading this table can immediately answer the three adoption questions:

1. **"Do I have to give up customer identity?"** No. Customer identity stays at the bank.
2. **"Do I have to give up my GL?"** No. The bank maps MITHQAL events to its own GL accounts; MITHQAL never prescribes the chart of accounts.
3. **"Do I have to give up my keys?"** No. `mithqalDoesNotPossessCustomerPrivateKeys = true` is an enforced invariant.

---

## 6. Deployment Models (MODEL_A / MODEL_B / MODEL_C)

The MBG supports three deployment models, each with the same canonical rule: **"Never require a bank to surrender customer private keys."**

### 6.1 MODEL_A_BANK_HOSTED (DEFAULT)

The bank operates the MBG sidecar inside its own data center / VPC. The sidecar communicates with MITHQAL over mutual-TLS + signed messages. All signing keys remain in the bank's HSM/MPC. MITHQAL holds NO private keys.

| Property | Value |
|---|---|
| Key custody | Bank HSM / MPC (full bank custody) |
| Hosting environment | Bank data center / bank VPC |
| Bank preference | **DEFAULT** |
| MITHQAL key possession | `false` (always) |

**Best for:** Tier-1 money-center banks with mature on-prem infrastructure and strict data-sovereignty requirements.

### 6.2 MODEL_B_BANK_SECURED_PRIVATE (DEFAULT)

The sidecar runs in a bank-approved private cloud / co-location environment. Keys remain bank-controlled (HSM/MPC) but the compute environment is operated by an approved provider under bank contract. MITHQAL holds NO private keys.

| Property | Value |
|---|---|
| Key custody | Bank HSM / MPC (bank controls; provider hosts compute) |
| Hosting environment | Bank-approved private cloud / co-location |
| Bank preference | **DEFAULT** |
| MITHQAL key possession | `false` (always) |

**Best for:** Tier-1 / Tier-2 banks that want cloud elasticity without giving up key custody. This is the recommended model for most banks.

### 6.3 MODEL_C_APPROVED_MANAGED (EXCEPTION)

The sidecar is operated by an approved managed-service provider under bank contract. All signing keys remain bank-controlled (HSM/MPC) at all times. The provider only sees signed messages. MITHQAL holds NO private keys.

| Property | Value |
|---|---|
| Key custody | Bank HSM / MPC (bank controls; managed provider operates sidecar) |
| Hosting environment | Approved managed-service provider under bank contract |
| Bank preference | **EXCEPTION** |
| MITHQAL key possession | `false` (always) |

**Best for:** Tier-3 banks or smaller commercial banks that lack in-house sidecar operations capability but still require bank-controlled keys.

### 6.4 Default Preference

```typescript
export const DEFAULT_DEPLOYMENT_MODELS: BankGatewayDeploymentModel[] = [
  "MODEL_A_BANK_HOSTED",
  "MODEL_B_BANK_SECURED_PRIVATE",
];
```

The MBG recommends MODEL_A or MODEL_B for the majority of banks. MODEL_C is reserved for banks that lack sidecar operations capability but still want bank-controlled keys.

### 6.5 Canonical Rule Across All Three Models

```typescript
export const DEPLOYMENT_MODEL_CANONICAL_RULE =
  "Never require a bank to surrender customer private keys." as const;
```

This rule applies identically to all three models. No deployment model — past, present, or future — may violate it. This is enforced by `BankSecurityProfile.mithqalDoesNotPossessCustomerPrivateKeys: true` (a literal type, not a runtime value).

---

## 7. Central-Bank Benefit Architecture (§25)

The central-bank benefit profile documents how a central bank observes / supervises the MBG. The critical invariant:

> **A central bank does NOT need to require every commercial bank under its supervision to redesign its core banking system.**

### 7.1 The CentralBankBenefit Profile

```typescript
export interface CentralBankBenefit {
  regulatoryFramework: string;
  monetaryPolicyTransmissionPath: string;
  banks: string[];                  // bank IDs under supervision
  mithqalBankGateways: string[];    // gateway IDs observed
  mithqalCore: string;              // the canonical settlement core
  centralBankDoesNotRequireEveryCommercialBankToRedesign: true;
  standardizedInstitutionalInterface: true;
}
```

### 7.2 Regulatory Framework

> *"Central bank supervises participating banks under its existing framework. MITHQAL Bank Gateway is a standardized institutional interface that fits within existing supervisory reporting and operational-risk frameworks — it does NOT introduce a new supervisory category."*

The MBG is explicitly positioned as a **standardized institutional interface**, not a new supervisory category. This is the answer to the central-bank objection: "I don't want to supervise a new type of entity." There is no new entity to supervise — only a new translation interface at banks you already supervise.

### 7.3 Monetary Policy Transmission Path

> *"MTQ provides an additional wholesale settlement rail that connects to existing monetary systems (bank money, CBDC where authorized, tokenized sovereign assets). Monetary policy transmission remains the central bank's authority; MTQ is a settlement instrument, not a monetary-policy instrument."*

This is critical: **MTQ is not a monetary-policy instrument.** The central bank's monetary policy authority is unchanged. MTQ provides an additional wholesale settlement rail — it does not replace central-bank money, does not replace reserve requirements, and does not create a parallel monetary base.

### 7.4 What the Central Bank Does NOT Have to Do

| Common concern | MBG answer |
|---|---|
| "Do I have to mandate every commercial bank to redesign core banking?" | No. `centralBankDoesNotRequireEveryCommercialBankToRedesign = true`. |
| "Do I have to create a new supervisory category?" | No. The MBG fits within existing supervisory reporting. |
| "Does MTQ replace my CBDC?" | No. CBDCs remain sovereign liabilities (see §8). |
| "Does MTQ affect my monetary policy transmission?" | No. MTQ is a settlement instrument, not a monetary-policy instrument. |
| "Does MTQ require me to take a stance on BRICS?" | No. BRICS adapter is optional (see §9). |

---

## 8. CBDC Compatibility (§26)

The MBG's stance on CBDC compatibility is governed by two hard invariants:

```
cbdcRemainsSovereignLiability = true   (always)
mithqalRemainsNeutral = true           (always)
```

### 8.1 CBDCCompatibilityProfile

```typescript
export interface CBDCCompatibilityProfile {
  bankMoneySupported: true;
  cbdcSupported: true;
  tokenizedAuthorizedSettlementAssetSupported: true;
  cbdcRemainsSovereignLiability: true;
  mithqalRemainsNeutral: true;
  cbdcParticipationNotMandatory: true;
  cbdcAdapterOptional: true;
  cbdcAdapterState: IntegrationState;       // currently INTEGRATION-READY
  canonicalRule: string;
}
```

### 8.2 Canonical Rule

> *"CBDCs remain sovereign liabilities; MTQ is the neutral settlement layer between them."*

### 8.3 What This Means Practically

| Question | Answer |
|---|---|
| Does a bank need a CBDC to use MTQ? | No. `bankMoneySupported = true`. Bank money is always supported. |
| Can a CBDC connect through the MBG? | Yes, via the MSAS adapter (typically `ISO_20022` or `TREASURY_SYSTEM` connector class). |
| Does MTQ replace a CBDC? | No. CBDCs remain sovereign liabilities; MTQ is the neutral settlement layer between them. |
| Is CBDC participation mandatory? | No. `cbdcParticipationNotMandatory = true`. |
| Is the CBDC adapter required? | No. `cbdcAdapterOptional = true`. |
| Is the CBDC adapter ready? | It is `INTEGRATION-READY` (logic-level spec complete). No real CBDC integration has been contracted. |

### 8.4 Why Neutrality Matters

If MTQ were tied to a specific CBDC, it would become a political instrument — a U.S.-CBDC-backed MTQ would conflict with BRICS jurisdictions; a BRICS-CBDC-backed MTQ would conflict with U.S. jurisdiction. Neutrality is what allows MTQ to operate across jurisdictions without taking a side.

This is enforced structurally: `cbdcRemainsSovereignLiability` is a literal `true` type, not a runtime flag. The MBG cannot accidentally "absorb" a CBDC into MTQ — the type system forbids it.

---

## 9. BRICS Compatibility (§27 — Modular, Optional, Not Core Dependency)

The BRICS compatibility profile enforces the v25.0 BRICS Neutrality Amendment. The canonical invariants:

```
bricsAdapterModular: true
onlyWhereOfficiallyAuthorized: true
notCoreDependency: true
usGatewayRetainsIndependentBlockAuthority: true
bricsAdapterOptional: true
```

### 9.1 BRICSCompatibilityProfile

```typescript
export interface BRICSCompatibilityProfile {
  bricsAdapterModular: true;
  onlyWhereOfficiallyAuthorized: true;
  notCoreDependency: true;
  usGatewayRetainsIndependentBlockAuthority: true;
  bricsAdapterOptional: true;
  bricsAdapterState: IntegrationState;       // currently INTEGRATION-READY
  canonicalRules: {
    mtqIsNotBricsMoney: true;
    mtqIsNotUsMoney: true;
    mtqIsTheNeutralSettlementLayer: true;
  };
}
```

### 9.2 The Three Canonical Rules

1. **MTQ is not BRICS money.** Disabling the BRICS adapter does NOT disable MTQ.
2. **MTQ is not U.S. money.** The U.S. gateway retains independent block authority, but MTQ itself is jurisdiction-neutral.
3. **MTQ is the neutral settlement layer.** This is the singular statement of monetary neutrality.

### 9.3 What "Optional" Means Practically

A bank in a non-BRICS jurisdiction (e.g. a U.S. money-center bank) can deploy the MBG with the BRICS adapter **disabled**. The MBG will continue to operate normally — MTQ settlement still works, reconciliation still works, the 5-way reconciliation still runs. The BRICS adapter is a *module*, not a *dependency*.

The corollary: a bank in a BRICS jurisdiction where BRICS participation is officially authorized can enable the BRICS adapter. The MBG will route BRICS-eligible transactions through that adapter. The U.S. gateway retains independent block authority — it can refuse to settle transactions it considers out-of-policy, regardless of BRICS adapter state.

### 9.4 Why This Matters for Adoption

Banks operate across geopolitical fault lines. A bank in a U.S.-aligned jurisdiction cannot be forced to use a BRICS instrument. A bank in a BRICS jurisdiction cannot be cut off from settlement options because of U.S. sanctions on the underlying rail. Neutrality — enforced structurally — is what makes the MBG adoptable across both sides.

---

## 10. SWIFT Compatibility — Not SWIFT Replacement (§21A)

The MBG's stance on SWIFT is unambiguous:

```typescript
export const SWIFT_CANONICAL_PRINCIPLE =
  "SWIFT carries/coordinates messaging where applicable; " +
  "MITHQAL provides an additional neutral wholesale settlement layer." as const;
```

### 10.1 SWIFTCompatibilityProfile

```typescript
export interface SWIFTCompatibilityProfile {
  positioningNotReplacement: true;
  messagingRailAgnostic: true;
  supportsExistingSwiftConnectedProcesses: true;
  bankNotRequiredToAbandonSwift: true;
  iso20022Compatible: true;
  canonicalPrinciple: typeof SWIFT_CANONICAL_PRINCIPLE;
}
```

### 10.2 What This Means

| Question | Answer |
|---|---|
| Does a bank have to abandon SWIFT to use MTQ? | No. `bankNotRequiredToAbandonSwift = true`. |
| Does MTQ replace SWIFT messaging? | No. SWIFT carries messaging; MTQ provides settlement. |
| Is MTQ ISO 20022 compatible? | Yes. The MSAS `ISO_20022` adapter class consumes pacs.008 / pacs.009 / pain.001 / camt.054 / camt.056. |
| Does MTQ break existing SWIFT-connected processes? | No. `supportsExistingSwiftConnectedProcesses = true`. |

### 10.3 The Messaging-vs-Settlement Distinction

SWIFT is a *messaging* network — it carries payment instructions between correspondent banks. MTQ is a *settlement* network — it actually moves value (canonical MTQ units) against verified reserves.

These are different layers. A bank can use SWIFT for messaging and MTQ for settlement. A bank can use MTQ for both (if it adopts the MSAS adapter for messaging too). A bank can use MTQ for neither — the MBG coexists with all existing rails.

> **Note:** The MBG does NOT claim to be faster than SWIFT, cheaper than SWIFT, or superior to SWIFT. The MBG claims to provide an *additional* settlement layer. Comparative claims belong in commercial materials — never in architectural documents.

---

## 11. Correspondent / Payment-Rail Coexistence (§21)

The MBG coexists with — does not replace — the entire existing payment-rail ecosystem.

### 11.1 CorrespondentRailCompatibility

```typescript
export interface CorrespondentRailCompatibility {
  correspondentBanking: { coexists: true; mithqalDoesNotReplace: true;
    banksMayUseCorrespondentForFxAndLiquidity: true; };
  swiftMessaging: { coexists: true; mithqalDoesNotReplace: true;
    banksMayUseSwiftForCrossBorderMessaging: true; };
  iso20022: { coexists: true; mithqalDoesNotReplace: true;
    mithqalAdapterConsumesIso20022: true; };
  domesticPaymentSystems: { coexists: true; mithqalDoesNotReplace: true;
    fedwire_ach_sepa_fps_faster_payments_etc: true; };
  cbdcSystems: { coexists: true; mithqalDoesNotReplace: true;
    cbdcRemainsSovereignLiability: true; };
  bankTreasury: { coexists: true; mithqalDoesNotReplace: true;
    bankTreasuryRemainsAuthoritative: true; };
  fxInfrastructure: { coexists: true; mithqalDoesNotReplace: true;
    banksRemainFxAutority: true; mithqalIsNotAnFxExchange: true; };
}
```

### 11.2 Coexistence Table

| Existing rail | Coexists | MITHQAL replaces? | Bank retains authority? |
|---|---|---|---|
| Correspondent banking | ✅ | ❌ | Banks may use correspondent for FX + liquidity |
| SWIFT messaging | ✅ | ❌ | Banks may use SWIFT for cross-border messaging |
| ISO 20022 | ✅ | ❌ | MSAS adapter consumes ISO 20022 (pacs.008/009, pain.001, camt.054/056) |
| Domestic payment systems (Fedwire/ACH/SEPA/FPS/Faster Payments) | ✅ | ❌ | Banks retain domestic rails |
| CBDC systems | ✅ | ❌ | CBDCs remain sovereign liabilities |
| Bank treasury | ✅ | ❌ | Bank treasury remains authoritative |
| FX infrastructure | ✅ | ❌ | Banks remain FX authority; MITHQAL is not an FX exchange |

### 11.3 Why Coexistence Is Strategic

A bank that adopts MTQ does not have to abandon anything. It can layer MTQ on top of its existing infrastructure:

- Continue using SWIFT for messaging → use MTQ for settlement on top.
- Continue using correspondent banking for FX → use MTQ for the settlement leg.
- Continue using Fedwire for domestic → use MTQ for cross-border wholesale.
- Continue using ISO 20022 → the MSAS adapter consumes it directly.

This is the operational meaning of "TRANSLATION, NOT TRANSFORMATION." The bank's existing rails continue to do what they do; the MBG translates the bank's existing authorized instructions into MTQ settlement.

---

## 12. "DO NOT MODIFY" Rules — 12 Forbidden Changes (§34)

The 12 DO NOT MODIFY rules are the canonical constraints on future amendments. They are cataloged in `DO_NOT_MODIFY_RULES` (DNM-01 … DNM-12) and may NOT be modified by this or any future amendment without an explicit superseding amendment.

| ID | Rule | Forbidden change | Reason |
|---|---|---|---|
| DNM-01 | No retail MTQ. | Adding retail / consumer-facing MTQ issuance or transfer. | MTQ is wholesale B2B only. Retail would break the bank-mediated model + create regulatory exposure. |
| DNM-02 | No direct individual minting. | Allowing individuals to mint MTQ directly without bank mediation. | Only authorized institutional issuance channels may originate MTQ. |
| DNM-03 | No exchange functions. | Adding an order book, AMM, or exchange-style matching engine. | MITHQAL is not an exchange. Anti-platform doctrine (no exchange, no brokerage, no lending, no market making). |
| DNM-04 | No speculative tokenomics. | Adding governance tokens, yield-farming, staking rewards, speculative tokenomics. | MTQ is a settlement instrument, not an investment product. Speculative tokenomics would compromise monetary neutrality. |
| DNM-05 | No bypass bank compliance. | Allowing MTQ issuance without a valid `BankComplianceAttestation` (7 assertions). | Every instruction MUST carry a valid bank compliance attestation. Zero-trust verifies. |
| DNM-06 | No bypass JSG. | Settling MTQ in a jurisdiction without going through the Jurisdictional Settlement Gateway. | JSG enforces per-jurisdiction policy. Bypassing JSG breaks regulatory compliance. |
| DNM-07 | No bypass sanctions. | Settling MTQ for a sanctioned entity or in a sanctioned jurisdiction. | Sanctions screening is mandatory at the bank layer + attested to MITHQAL. Bypassing sanctions is illegal. |
| DNM-08 | No expose customer private keys. | Allowing MITHQAL to possess or process customer private keys. | `mithqalDoesNotPossessCustomerPrivateKeys = true` (always). Keys remain in bank HSM/MPC. |
| DNM-09 | No make bank dependent on MITHQAL for core banking. | Designing MBG such that a bank cannot operate its core banking without MITHQAL. | Core banking replacement NOT required. MBG is a sidecar; bank's core systems remain authoritative. |
| DNM-10 | No make MITHQAL the customer identity authority. | Moving customer identity (KYC/KYB/UBO) from bank to MITHQAL. | Bank is the customer-identity vault (Layer 1). MITHQAL receives only pseudonymous references + attestations. |
| DNM-11 | No make BRICS mandatory. | Requiring banks to use the BRICS adapter or requiring BRICS jurisdiction participation. | `bricsAdapterOptional = true`, `notCoreDependency = true`. MTQ works without BRICS. |
| DNM-12 | No make CBDC participation mandatory. | Requiring banks or central banks to participate in CBDC interoperability. | `cbdcParticipationNotMandatory = true`, `cbdcAdapterOptional = true`. Bank money is always supported. |

### 12.1 Why These Rules Exist

Each rule exists because the v25.0 architecture has been deliberately constrained to fit *inside* the existing regulatory and operational perimeter of regulated banking. Violating any rule would push MITHQAL outside that perimeter — into retail, into exchange, into speculative tokenomics, into sanctions evasion, into key custody, into core-banking replacement, into identity authority, into BRICS mandating, into CBDC mandating.

Each of those is a category error that would invalidate the entire architectural thesis: that MITHQAL is a *neutral wholesale settlement layer* that *translates* existing banking instructions without transforming them.

### 12.2 How These Rules Are Enforced

The rules are enforced at three layers:

1. **Type system** — invariants like `mithqalDoesNotPossessCustomerPrivateKeys: true` are literal types, not runtime flags. They cannot be set to `false` without changing the type signature.
2. **Module-load invariants** — the `_INVARIANTS` IIFE in the source module asserts 17 invariants at load time. If any fails, the module throws.
3. **Acceptance criteria** — the 18 acceptance criteria (`MBG-AC-01` … `MBG-AC-18`) each map to one of these rules. If a rule is violated, the corresponding criterion flips to `met = false`.

---

## 13. Honest State Declaration

This document, like the source module it describes, is explicitly honest about the maturity of the MBG.

### 13.1 The Headline

```
IntegrationState = "INTEGRATION-READY"
Banks contracted = 0
Banks live-pilot = 0
Real bank integrations = 0
All 20 required tests = SIMULATED
All 18 acceptance criteria = met=true AT THE LOGIC/SPEC LEVEL
```

### 13.2 The Three NEVER Rules

```
neverConvertSimulatedToBankContracted         = true
neverConvertIntegrationReadyToLivePilot       = true
neverClaimZeroIntegrationWhenMinimalIsRequired = true
```

The MBG will ONLY move from `INTEGRATION-READY` to `BANK-CONTRACTED` when a real bank signs an integration agreement + completes technical certification. It will ONLY move from `BANK-CONTRACTED` to `LIVE-PILOT` when that bank executes a real (non-zero-value) pilot transaction.

### 13.3 What "INTEGRATION-READY" Means

`INTEGRATION-READY` means the logic-level specification is complete: every interface, every invariant, every test case, every acceptance criterion is defined and consistent. It does **not** mean:

- ❌ A real bank has been contracted.
- ❌ A real bank has run the 20 tests.
- ❌ A real bank has signed an integration agreement.
- ❌ A real bank has executed a live pilot transaction.
- ❌ The architecture is "production-ready."

### 13.4 What "INTEGRATION-READY" Does NOT Mean

| Possible misreading | Truth |
|---|---|
| "Zero integration" | No — "minimal integration" is required. The 7 cost components (technical integration, security review, compliance review, legal review, operations, certification, maintenance) are real costs. |
| "Banks can plug and play" | No — banks must complete the 6-phase integration journey (Discovery → Design → Build → Test → UAT → Production). |
| "Live pilot is imminent" | No — moving to `BANK-CONTRACTED` requires a real bank to sign + certify. |
| "Tests have passed" | No — all 20 tests are `SIMULATED`. They will move to `PASS` / `FAIL` / `BLOCKED` only when a real bank runs them. |

### 13.5 The Final Reminder

The source module ends with this reminder, which this document echoes:

> *INTEGRATION-READY (AMBER). Logic-level spec complete. 0 real banks contracted. 20 tests SIMULATED. 18 acceptance criteria met at logic/spec level (evidence explicitly notes 'INTEGRATION-READY — no real bank contracted yet'). Canonical principle: 'TRANSLATION, NOT TRANSFORMATION.' No core replacement. Minimal integration. Existing banking systems remain authoritative. The 10 standing blockers (per `final-pilot-activation-gate.ts`) remain open.*

### 13.6 The 10 Standing Blockers

The MBG amendment does NOT resolve the 10 standing blockers documented in `final-pilot-activation-gate.ts`. Those blockers remain open. The MBG amendment ADDS the strategic final architecture (bank-side settlement sidecar) on top of the existing closure series; it does not close the closure series.

For the canonical blocker list, see `docs/verification/v25-0-FINAL-PRODUCTION-GATE-EXECUTIVE-SIGNOFF.md`.

---

## Appendix A — Cross-References

| Topic | Document |
|---|---|
| Adapter standard (MSAS) | `docs/architecture/mbg/MITHQAL_ADAPTER_STANDARD_MSAS.md` |
| Bank integration playbook | `docs/architecture/mbg/MITHQAL_BANK_INTEGRATION_GUIDE.md` |
| Bank security guide | `docs/architecture/mbg/MITHQAL_BANK_SECURITY_GUIDE.md` |
| Reconciliation architecture | `docs/architecture/mbg/MITHQAL_BANK_RECONCILIATION_GUIDE.md` |
| Bank ROI / cost model | `docs/architecture/mbg/MITHQAL_BANK_ROI_MODEL.md` |
| Corporate user flow | `docs/architecture/mbg/MITHQAL_CORPORATE_USER_FLOW.md` |
| Source module | `src/lib/mithqal-bank-gateway.ts` (3,969 lines) |
| Executive report API | `src/app/api/bank-gateway/route.ts` |
| Versioned gateway API discovery | `src/app/api/gateway/v1/route.ts` |
| Final pilot activation gate | `docs/verification/v25-0-final-pilot-activation-gate.md` |
| v25.0 comprehensive final audit | `docs/verification/v25-0-COMPREHENSIVE-FINAL-AUDIT.md` |

## Appendix B — Glossary

| Term | Definition |
|---|---|
| **MBG** | MITHQAL Bank Gateway — the sidecar / adapter entity a bank deploys. |
| **MSAS** | MITHQAL Standard Adapter Specification — the open standard defining 7 connector classes. |
| **MTQ** | The neutral wholesale settlement unit minted by the MITHQAL canonical ledger against verified reserves. |
| **MTQSettlementInstruction** | The canonical 22-field object the MBG produces after translating an authorized bank instruction. |
| **BankMTQSubledger** | The bank's own authoritative subledger of MTQ positions for its corporate customers. |
| **5-Way Reconciliation** | The canonical reconciliation across canonical ledger, bank subledger, corporate positions, reserve ledger, and proof-of-liabilities. |
| **JSG** | Jurisdictional Settlement Gateway — enforces per-jurisdiction policy. |
| **ILPS** | Intraday Liquidity Pressure Score — 5-layer liquidity control (NORMAL / ELEVATED / STRESSED / CRITICAL / HALTED). |
| **FV1–FV10** | The 10 formal verification theorems the v25.0 architecture enforces. |
| **DNM** | "DO NOT MODIFY" — one of the 12 forbidden-change rules. |
| **MODEL_A** | Bank-hosted deployment (bank data center / bank VPC). |
| **MODEL_B** | Bank-secured private deployment (bank-approved private cloud / co-location). |
| **MODEL_C** | Approved managed deployment (managed-service provider under bank contract). |

---

*End of MITHQAL_BANK_GATEWAY_ARCHITECTURE.md — v25.0-mbg-amendment-1.0 — INTEGRATION-READY, 0 banks contracted.*

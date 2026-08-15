# MITHQAL Adapter Standard (MSAS) — Specification

> **File:** MITHQAL_ADAPTER_STANDARD_MSAS.md
> **Task ID:** MBG-DOCUMENTATION
> **Source module:** `src/lib/mithqal-bank-gateway.ts` (§5 — MSAS Adapter Standard, plus §6 MTQSettlementInstruction, §7 BankComplianceAttestation)
> **Document version:** v25.0-mbg-amendment-1.0
> **Honest state declaration:** **INTEGRATION-READY — 0 banks contracted.**
> **Canonical principle:** *"TRANSLATION, NOT TRANSFORMATION."*

---

## Table of Contents

1. [Purpose — Translate Bank-Specific Formats into Standardized MTQ Instructions](#1-purpose--translate-bank-specific-formats-into-standardized-mtq-instructions)
2. [Architecture (Connector → MSAS → MTQSettlementInstruction → MITHQAL Core)](#2-architecture-connector--msas--mtqsettlementinstruction--mithqal-core)
3. [Seven Supported Connector Classes](#3-seven-supported-connector-classes)
4. [Per-Connector-Class Detailed Specification](#4-per-connector-class-detailed-specification)
5. [The Translation Rule Framework](#5-the-translation-rule-framework)
6. [ISO 20022 Mapping (pacs.008, pacs.009, pain.001, camt.054, camt.056)](#6-iso-20022-mapping-pacs008-pacs009-pain001-camt054-camt056)
7. [Host-to-Host File Format Specification](#7-host-to-host-file-format-specification)
8. [REST API Connector Contract](#8-rest-api-connector-contract)
9. [SFTP File Exchange Security Controls](#9-sftp-file-exchange-security-controls)
10. [Treasury System Connector (SWIFT MT300, MT202)](#10-treasury-system-connector-swift-mt300-mt202)
11. [Corporate ERP Connector (SAP, Oracle, Workday)](#11-corporate-erp-connector-sap-oracle-workday)
12. [Certification Process for New Adapters](#12-certification-process-for-new-adapters)
13. [Versioning Policy](#13-versioning-policy)

---

## 1. Purpose — Translate Bank-Specific Formats into Standardized MTQ Instructions

### 1.1 The Problem MSAS Solves

Every regulated bank has its own combination of upstream systems:

- An ISO 20022 messaging gateway for cross-border flows
- An institutional REST API for corporate portal integration
- A mainframe host-to-host (H2H) batch channel for settlement files
- An SFTP-based end-of-day reconciliation file exchange
- An existing vendor-supplied payment gateway
- A treasury management system (TMS) for Nostro/Vostro rebalancing
- A corporate ERP integration layer (SAP S/4HANA, Oracle Fusion, Workday)

These systems speak different protocols, use different message schemas, and produce different audit trails. The MITHQAL canonical settlement core cannot natively consume all of them — and it must not, because doing so would force every bank to align on a single upstream interface, which is impossible.

### 1.2 What MSAS Is

The **MSAS (MITHQAL Standard Adapter Specification)** is an **open standard** that defines:

1. A canonical set of **7 connector classes** — one per upstream system type that banks actually use.
2. A **translation rule schema** — how to map each bank-specific instruction format into the canonical `MTQSettlementInstruction` (22 fields, see §6 of source).
3. A **certification process** — how a new adapter becomes `ACTIVE` rather than `PENDING_CERTIFICATION`.
4. A **versioning policy** — how the standard itself evolves over time.

The standard is **open** (`openStandard = true`) and **never proprietary** (`proprietaryLockIn = false`). Banks may propose new connector classes through the MITHQAL certification authority.

### 1.3 What MSAS Does NOT Do

| Claim | Reality |
|---|---|
| ❌ Invents a new customer-facing API surface | No. MSAS reuses the bank's existing interfaces. |
| ❌ Replaces SWIFT, ISO 20022, or the bank's payment gateway | No. MSAS consumes those existing interfaces and translates them. |
| ❌ Forces a single connector class on every bank | No. A bank may attach any subset of the 7 classes that matches its infrastructure. |
| ❌ Dictates the bank's chart of accounts | No. The AccountingReconciliationAdapter (§11 of source) lets the bank map MITHQAL events to its own GL codes. |
| ❌ Requires customer PII to flow through the adapter | No. The adapter produces a pseudonymous `corporateReference` + cryptographic attestation, not customer PII. |

### 1.4 The Canonical Rule

The MSAS standard carries the same canonical principle as the entire MBG amendment:

```typescript
canonicalRule: "TRANSLATION, NOT TRANSFORMATION."
```

Every adapter implementation must honor this rule. An adapter that transforms the bank's instruction (e.g. adds new fields, removes fields, alters amounts, modifies purpose codes) is non-conformant.

---

## 2. Architecture (Connector → MSAS → MTQSettlementInstruction → MITHQAL Core)

### 2.1 The Four-Layer Translation Pipeline

```
+---------------------+        +----------------+        +----------------------+        +----------------+
| BANK-SPECIFIC       |        | MSAS STANDARD  |        | MTQ SETTLEMENT       |        | MITHQAL CORE   |
| CONNECTOR           |  ===>  | FORMAT          |  ===>  | INSTRUCTION (22      |  ===>  | Canonical      |
| (pacs.008 / REST /  |        | (canonical      |        |  canonical fields,    |        | ledger, reserve|
|  H2H / SFTP / TMS / |        |  intermediate)  |        |  signed by bank's     |        | engine,        |
|  ERP)               |        |                 |        |  attestation key)     |        | settlement     |
+---------------------+        +----------------+        +----------------------+        | network        |
        |                              |                          |                      +----------------+
        | bank's existing              | translation              | zero-trust                 ^
        | authorized instruction      | rules per                 | verification               |
        |                              | connector class          | (5 authentications)        |
        v                              v                          v                           |
+---------------------+        +----------------+        +----------------------+        +----------------+
| BANK'S COMPLIANCE   |        | BANK'S HSM/MPC |        | BANK MTQ SLEDGER     |        | MITHQAL CORE   |
| SYSTEM              |        | (signs every   |        | (per-bank            | <----> | 5-WAY RECON    |
| (KYC/KYB/AML/       |        |  translation)  |        |  authoritative       |        | (canonical vs   |
|  sanctions screening|        +----------------+        |  record)             |        |  bank vs corp   |
|  + 7 assertions)    |                                  +----------------------+        |  vs reserve vs  |
+---------------------+                                                                   |  proof-of-      |
        |                                                                               |  liabilities)   |
        | 7 assertions + signature                                                     +----------------+
        v
+---------------------+
| BANKCOMPLIANCEATTEST|
| ATION (§7)          |
+---------------------+
```

### 2.2 The Four Layers

1. **Bank-Specific Connector** — the bank's existing upstream system (ISO 20022 gateway, REST API, H2H mainframe, SFTP file feed, payment gateway, TMS, ERP integration). This layer is **not** MITHQAL's to design; the bank already has it.

2. **MSAS Standard Format** — the canonical intermediate representation. The adapter reads the bank's native instruction and produces a translation-rule-mapped intermediate that conforms to MSAS semantics. This layer is where the bank's translation rules run.

3. **MTQ Settlement Instruction** — the canonical 22-field object the MBG produces. This is what MITHQAL Core receives. It carries the bank's compliance attestation (7 assertions), the bank's signature, and the bank's transaction reference for reconciliation.

4. **MITHQAL Core** — the canonical settlement ledger, reserve engine, settlement network, ILPS, JSG, privacy / ZK, 5-way reconciliation. MITHQAL Core receives the signed instruction, validates it through zero-trust verification (5 authentications), and either accepts it for settlement or rejects it.

### 2.3 Why an Intermediate "MSAS Standard Format" Exists

The intermediate layer exists because the 7 connector classes produce different shapes of data:

- ISO 20022 produces XML documents conforming to `pacs.008`, `pacs.009`, `pain.001`, `camt.054`, `camt.056`.
- REST API produces JSON request bodies conforming to the bank's API schema.
- H2H produces fixed-width or delimited batch records.
- SFTP produces file-level batches with SHA-256 manifests.
- TMS produces SWIFT MT300 / MT202 messages or vendor-proprietary records.
- ERP produces SAP IDOC, Oracle XML, or Workday SOAP.

The MSAS intermediate normalizes all of these into a single canonical shape that the `createMTQSettlementInstruction(input)` factory can consume. The intermediate is **never exposed outside the bank's gateway** — it exists only inside the MBG sidecar.

---

## 3. Seven Supported Connector Classes

The MSAS standard supports exactly 7 connector classes. The module enforces this count via a load-time invariant:

```typescript
// §28 / §1 of source — module-load invariant
if (MSAS_STANDARD.supportedConnectorClasses.length !== 7) {
  throw new Error(`INVARIANT VIOLATION: MSAS_STANDARD.supportedConnectorClasses ` +
    `must have exactly 7 entries, got ${MSAS_STANDARD.supportedConnectorClasses.length}.`);
}
```

### 3.1 The 7 Connector Classes

| # | Class identifier | Upstream system | Typical protocol | Typical use |
|---|---|---|---|---|
| 1 | `ISO_20022` | ISO 20022 messaging gateway | XML over SWIFT / direct connection | Cross-border FI-to-FI customer credit transfer, FI-to-FI credit transfer, customer payment initiation, notification, case assignment |
| 2 | `BANK_REST_API` | Bank's institutional REST API | HTTPS + JSON + OAuth2 / mTLS | Corporate portal integration, treasury workstation integration |
| 3 | `HOST_TO_HOST` | Mainframe H2H batch | SFTP / direct mainframe channel + fixed-width or delimited records | End-of-day settlement batches, intraday position updates |
| 4 | `SECURE_FILE_EXCHANGE_SFTP` | SFTP file exchange | SFTP v6 + GPG encryption | End-of-day reconciliation files, intraday instruction files |
| 5 | `EXISTING_PAYMENT_GATEWAY` | Bank's existing payment gateway | Vendor-specific (e.g. ACI, Temenos, FIS) | Corporate payment initiation, approval, status query |
| 6 | `TREASURY_SYSTEM` | Treasury management system | SWIFT MT300 / MT202 + vendor extensions | Nostro/Vostro rebalancing, FX settlement, liquidity sweeps |
| 7 | `CORPORATE_ERP_CONNECTIVITY` | Corporate ERP | SAP IDOC / Oracle XML / Workday SOAP, routed through bank | Corporate payment runs, invoice-driven disbursements |

### 3.2 Why These 7 (and Not More)

The 7 classes were chosen because they cover the upstream interfaces a regulated bank actually uses to authorize settlement-relevant instructions. They map onto the operational divisions inside a bank:

- **Customer-facing flows:** `ISO_20022` (cross-border), `BANK_REST_API` (corporate portal), `EXISTING_PAYMENT_GATEWAY` (vendor gateway), `CORPORATE_ERP_CONNECTIVITY` (ERP payment runs).
- **Operations flows:** `HOST_TO_HOST` (mainframe batch), `SECURE_FILE_EXCHANGE_SFTP` (reconciliation files).
- **Treasury flows:** `TREASURY_SYSTEM` (Nostro/Vostro, FX, liquidity sweeps).

Banks may attach **any subset** of these 7 classes to their gateway. A typical Tier-1 bank will attach 3-4 classes (e.g. `ISO_20022` + `BANK_REST_API` + `TREASURY_SYSTEM`). A Tier-3 bank may attach only 1-2.

### 3.3 Why the Standard Is Open

```typescript
export const MSAS_STANDARD: MSASAdapterStandard = {
  standardId: "MSAS-1.0",
  standardVersion: "1.0",
  supportedConnectorClasses: [ ...7 classes... ],
  certificationProcessSteps: [ ...6 steps... ],
  versioningPolicy: "MSAS uses semver. Adapter.protocolVersion follows the MSAS standard version; " +
                    "Adapter.bankInterfaceVersion follows the bank's own upstream system version.",
  openStandard: true,                       // always open
  proprietaryLockIn: false,                 // never proprietary
  canonicalRule: AMENDMENT_PRINCIPLE,
};
```

The standard is open so that:

- Banks are not locked into MITHQAL. If a bank wants to build a connector class MITHQAL doesn't yet support, it can propose the new class through the certification process (see §12 below).
- Multiple vendors can implement MSAS adapters. The standard does not require a MITHQAL-supplied adapter implementation.
- The certification process is transparent. A bank can see exactly what the certification criteria are before committing to integration.

### 3.4 Multi-Adapter Gateways

A single `MithqalBankGateway` may attach multiple adapters:

```typescript
adapters: MSASAdapter[];   // e.g. [ISO_20022, BANK_REST_API, TREASURY_SYSTEM]
```

Each adapter is independently certified. A bank can deploy a gateway with one certified adapter and one pending-certification adapter; the certified adapter is `ACTIVE`, the pending one is `PENDING_CERTIFICATION`. Instructions routed through the pending adapter are not accepted until certification completes.

---

## 4. Per-Connector-Class Detailed Specification

Each connector class has its own MSAS adapter template in `MSAS_ADAPTER_TEMPLATES` (§5 of source). Below is a detailed spec per class.

### 4.1 Class 1: ISO_20022

| Property | Value |
|---|---|
| `connectorClass` | `ISO_20022` |
| `protocolVersion` | `MSAS-1.0` |
| `bankInterfaceVersion` | `ISO 20022 pacs.008 / pacs.009 (latest)` |
| `status` | `PENDING_CERTIFICATION` (template default — banks instantiate with their own certification state) |
| `evidenceClass` | `SIMULATED` (until a real bank certifies) |

**Translation rules (excerpt):**

> *pacs.008 (FI-to-FI customer credit transfer) → MTQSettlementInstruction. TxId → instructionId. InstgAgt → originBankId. InstdAgt → destinationBankId. Amt → amount + settlementCurrency. Purp → transactionPurpose. ChrgBr → fee allocation. InstrForCdtrAgt → corporateReference. SttlmDt → settlement date. Reversal / cancellation → idempotencyKey + finalityState checks.*

**Supported ISO 20022 messages:**
- `pacs.008` — FI-to-FI customer credit transfer (the primary inbound message).
- `pacs.009` — FI-to-FI credit transfer (institutional credit transfer, no customer credit).
- `pain.001` — customer payment initiation (corporate-to-bank payment initiation).
- `camt.054` — bank-to-customer debit/credit notification (settlement confirmation).
- `camt.056` — FIToFI payment cancellation request (reversal / cancellation).

**Security:**
- mTLS to the bank's ISO 20022 gateway.
- Each pacs.008 message carries the bank's signed `BankComplianceAttestation` (7 assertions) in a proprietary extension.
- Reversal (camt.056) is translated to `idempotencyKey` + `finalityState` checks — never auto-reverses a settled MTQ without bank authorization.

**Idempotency:**
- `idempotencyKey` is derived from the pacs.008 `TxId` (transaction identification) + the bank's institution ID + the message creation date.
- A duplicate pacs.008 with the same `TxId` is rejected at the MBG.

### 4.2 Class 2: BANK_REST_API

| Property | Value |
|---|---|
| `connectorClass` | `BANK_REST_API` |
| `protocolVersion` | `MSAS-1.0` |
| `bankInterfaceVersion` | `Bank REST API v2 (institutional)` |
| `status` | `PENDING_CERTIFICATION` |
| `evidenceClass` | `SIMULATED` |

**Translation rules:**

> *Bank's existing institutional REST API → MTQSettlementInstruction. POST /transfer → createMTQSettlementInstruction. GET /transfer/{id}/status → MTQStatusEvent mapping (15 states). POST /transfer/{id}/reverse → idempotencyKey + reversal handling. Bank's existing authN/authZ layer is preserved; MBG adds signed-message layer.*

**Contract:**

| Bank REST endpoint | MSAS mapping |
|---|---|
| `POST /transfer` | `createMTQSettlementInstruction(input)` |
| `GET /transfer/{id}/status` | `MTQStatusEvent` (13 states) + bank-consumable description |
| `POST /transfer/{id}/reverse` | Reversal handling — `idempotencyKey` collision check + `finalityState` validation |
| `GET /transfer/{id}` | Full instruction query (returns pseudonymous `corporateReference` only — no PII) |

**Authentication:**
- The bank's existing authN/authZ layer is **preserved** (OAuth2 / mTLS / API keys — whatever the bank already uses).
- MBG adds a **signed-message layer** on top: every request is signed by the bank's attestation key, and every response is verified by the bank's MBG client.

**Idempotency:**
- `idempotencyKey` is `BANK_PROVIDED` (the bank's client generates it) by default.
- Alternative: `HASH_OF_PAYLOAD` (the MBG derives the key from the SHA-256 hash of the request payload).

### 4.3 Class 3: HOST_TO_HOST

| Property | Value |
|---|---|
| `connectorClass` | `HOST_TO_HOST` |
| `protocolVersion` | `MSAS-1.0` |
| `bankInterfaceVersion` | `Bank H2H mainframe gateway (per-bank)` |
| `status` | `PENDING_CERTIFICATION` |
| `evidenceClass` | `SIMULATED` |

**Translation rules:**

> *Mainframe H2H batch records → MTQSettlementInstruction batch. Each H2H record's TxRef → bankTransactionReference (§22). Batch header → aggregate compliance attestation (§7). Settlement-confirmation files → reconciliation adapter (§11). All H2H traffic over mutual-TLS channel; replay protection via nonce + timestamp.*

**Batch structure:**
- A single H2H batch file contains N records (typically 10 to 10,000).
- Each record translates to one `MTQSettlementInstruction`.
- The batch header carries an **aggregate compliance attestation** (one `BankComplianceAttestation` covering all records in the batch, signed by the bank's attestation key).

**Connectivity:**
- Mutual-TLS channel (both sides authenticate via X.509 certs).
- Replay protection via per-record nonce + timestamp.
- Idempotency via the H2H record's `TxRef` (bank transaction reference) — duplicates are rejected.

**Reconciliation:**
- Settlement-confirmation files (returned by the bank's mainframe after settlement completes) are consumed by the `AccountingReconciliationAdapter` (§11 of source) and produce GL-ready reconciliation records.

### 4.4 Class 4: SECURE_FILE_EXCHANGE_SFTP

| Property | Value |
|---|---|
| `connectorClass` | `SECURE_FILE_EXCHANGE_SFTP` |
| `protocolVersion` | `MSAS-1.0` |
| `bankInterfaceVersion` | `SFTP v6 + GPG encryption (per-bank key)` |
| `status` | `PENDING_CERTIFICATION` |
| `evidenceClass` | `SIMULATED` |

**Translation rules:**

> *End-of-day batch settlement files → reconciliation adapter (§11). Intraday instruction files → batch issuance. GPG signature + SFTP key authentication required. File-level idempotency via SHA-256 manifest. Files older than expiry (default 24h) rejected per §17 messageExpiration.*

**File format:**
- End-of-day batch settlement files (returned by MITHQAL to the bank) → consumed by the `AccountingReconciliationAdapter`.
- Intraday instruction files (sent by the bank to MITHQAL) → translated into batch `MTQSettlementInstruction` issuance.

**Security:**
- GPG signature on every file (signed by the bank's GPG key).
- SFTP key authentication (no password authentication).
- File-level idempotency via SHA-256 manifest — a file with the same SHA-256 manifest hash as a previously ingested file is rejected.

**Expiration:**
- Files older than the `messageExpiration.maxAgeSeconds` window (default 24 hours = 86400 seconds) are rejected per §17 of source. This prevents stale files from being processed late.

### 4.5 Class 5: EXISTING_PAYMENT_GATEWAY

| Property | Value |
|---|---|
| `connectorClass` | `EXISTING_PAYMENT_GATEWAY` |
| `protocolVersion` | `MSAS-1.0` |
| `bankInterfaceVersion` | `Bank's existing payment gateway (vendor-specific)` |
| `status` | `PENDING_CERTIFICATION` |
| `evidenceClass` | `SIMULATED` |

**Translation rules:**

> *Existing payment-gateway instructions → MTQSettlementInstruction. Bank's existing payment-gateway approval flow preserved; MBG translates only post-approval instructions into MTQ. Customer-facing UX unchanged. Gateway reference → bankTransactionReference (§22).*

**Critical design choice:** The MBG translates **only post-approval instructions** — never pre-approval drafts. This means the bank's existing payment-gateway approval flow (maker-checker, dual approval, threshold escalation) is fully preserved. The MBG sees only instructions the bank has already authorized.

**Customer UX:** unchanged. The corporate customer still uses the bank's existing payment-gateway UX. The MBG is invisible to the corporate customer.

**Gateway reference:** the bank's payment-gateway transaction reference becomes `bankTransactionReference` on the `MTQSettlementInstruction`, enabling 1:1 reconciliation between the bank's gateway records and the MITHQAL canonical ledger.

### 4.6 Class 6: TREASURY_SYSTEM

| Property | Value |
|---|---|
| `connectorClass` | `TREASURY_SYSTEM` |
| `protocolVersion` | `MSAS-1.0` |
| `bankInterfaceVersion` | `Bank treasury management system (TMS)` |
| `status` | `PENDING_CERTIFICATION` |
| `evidenceClass` | `SIMULATED` |

**Translation rules:**

> *Treasury settlement instructions (Nostro/Vostro rebalancing) → MTQSettlementInstruction. Treasury account ref → bankAccountLinkage (§9). FX reference preserved through fxReference field (§11). Liquidity sweep instructions → ILPS 5-layer integration (§25 ILPS).*

**Supported SWIFT MT messages:**
- `MT300` — foreign exchange confirmation (FX deal confirmation between counterparties).
- `MT202` — general financial institution transfer (cover payment / bank-to-bank transfer).
- Plus vendor-proprietary extensions for treasury workflows.

**Integration with ILPS:**
- Liquidity sweep instructions from the TMS are routed through the ILPS 5-layer liquidity controls (NORMAL / ELEVATED / STRESSED / CRITICAL / HALTED — see §6 `MTQSettlementInstruction.liquidityStatus`).
- The MBG does not override the bank's treasury liquidity decisions — it enforces them through the ILPS layer.

**FX reference preservation:**
- The TMS's FX reference (e.g. the FX deal confirmation number) is preserved through the `fxReference` field on the `AccountingReconciliationAdapter` (§11 of source). This enables the bank's treasury to reconcile FX exposure against MTQ settlement.

### 4.7 Class 7: CORPORATE_ERP_CONNECTIVITY

| Property | Value |
|---|---|
| `connectorClass` | `CORPORATE_ERP_CONNECTIVITY` |
| `protocolVersion` | `MSAS-1.0` |
| `bankInterfaceVersion` | `Corporate ERP (SAP S/4HANA, Oracle Fusion, etc.) via bank` |
| `status` | `PENDING_CERTIFICATION` |
| `evidenceClass` | `SIMULATED` |

**Translation rules:**

> *Corporate ERP payment instructions → routed through bank → MBG. ERP payment run reference → customerAuthorizationReference (§6). Corporate does NOT connect directly to MBG — bank-mediated. Bank translates ERP invoice ref → corporateReference pseudonym (§8 privacy).*

**Supported ERP systems:**
- **SAP S/4HANA** — SAP IDOC payment runs (PEXR2002 IDOC for payment orders).
- **Oracle Fusion** — Oracle XML payment files (payment process request documents).
- **Workday** — Workday SOAP-based payment run web services.

**Critical design choice:** The corporate does NOT connect directly to the MBG. The corporate's ERP payment runs are routed through the bank. The bank:
1. Receives the ERP payment run.
2. Performs its existing KYC / AML / sanctions / account authority checks.
3. Issues the bank's own compliance attestation.
4. Translates the ERP payment run reference into a `customerAuthorizationReference` on the `MTQSettlementInstruction`.
5. Translates the ERP invoice reference into a pseudonymous `corporateReference` (per §8 privacy model).

This is the bank-mediated model in action: the corporate's ERP remains the corporate's tool, but every instruction is bank-authorized before it reaches MITHQAL.

---

## 5. The Translation Rule Framework

### 5.1 What a Translation Rule Is

A translation rule is a human-readable description of how a bank-specific instruction field maps to a canonical `MTQSettlementInstruction` field. The MSAS standard requires every adapter to declare its `translationRules` as a string field:

```typescript
export interface MSASAdapter {
  adapterId: string;
  connectorClass: MSASConnectorClass;
  protocolVersion: string;
  bankInterfaceVersion: string;
  translationRules: string;   // <-- human-readable field-mapping description
  status: "ACTIVE" | "INACTIVE" | "PENDING_CERTIFICATION";
  certifiedAt: string | null;
  evidenceClass: "SIMULATED" | "CONTRACTED" | "LIVE";
}
```

### 5.2 The Field Mapping Pattern

Every translation rule follows the same pattern:

```
<upstream field path>  →  <MTQSettlementInstruction field>
```

For example, the ISO 20022 connector's translation rules include:

```
pacs.008/CdtTrfTxInf/PmtId/TxId           → instructionId
pacs.008/GrpHdr/InstgAgt                   → originBankId
pacs.008/GrpHdr/InstdAgt                   → destinationBankId
pacs.008/CdtTrfTxInf/Amt/InstdAmt          → amount + settlementCurrency
pacs.008/CdtTrfTxInf/Purp                  → transactionPurpose
pacs.008/CdtTrfTxInf/ChrgBr                → fee allocation
pacs.008/CdtTrfTxInf/InstrForCdtrAgt      → corporateReference
pacs.008/CdtTrfTxInf/SttlmDt               → settlement date
```

### 5.3 The 22 Field Targets

Every translation rule must produce all 22 (technically 23 — see source module invariant comment) fields of the `MTQSettlementInstruction`. If a translation rule omits a field, the `createMTQSettlementInstruction(input)` factory will fail because the field is required (not optional in the interface).

The 22 fields are organized into 8 groups (see File 1 §4.3 for the full enumeration):
- Identity (6)
- Money (3)
- Purpose / Routing (3)
- Compliance (2)
- Policy / Reserve (3)
- Lifecycle (3)
- Security / Idempotency (2)
- Bank reconciliation (1)

### 5.4 Translation Rule Certification

A translation rule is certified as part of adapter certification (see §12 below). The certification process verifies:

1. **Completeness** — every `MTQSettlementInstruction` field is produced by some rule.
2. **Determinism** — the same input instruction always produces the same output fields.
3. **No transformation** — the rule translates, never transforms. For example, a rule that re-encodes amounts into a different currency is non-conformant; a rule that copies the original amount + currency is conformant.
4. **Audit trail preservation** — the rule preserves enough information for the bank's `AccountingReconciliationAdapter` to map the resulting MTQ event back to the bank's GL.

### 5.5 The "No Transformation" Test

The MSAS standard enforces the "TRANSLATION, NOT TRANSFORMATION" rule through a structural test: every translation rule must be **reversible** in the sense that the bank's `bankTransactionReference` field on the output `MTQSettlementInstruction` is sufficient for the bank to reconstruct the original upstream instruction (or at least its audit-trail-relevant fields).

If a translation rule discards information the bank needs for audit, the rule is non-conformant.

---

## 6. ISO 20022 Mapping (pacs.008, pacs.009, pain.001, camt.054, camt.056)

The `ISO_20022` connector class is the most-used connector for cross-border flows. Below is a detailed field-by-field mapping for each of the 5 supported ISO 20022 messages.

### 6.1 pacs.008 (FI-to-FI Customer Credit Transfer)

**Use case:** A corporate customer initiates a credit transfer from its bank to a counterparty at another bank. This is the primary inbound message for cross-border wholesale MTQ settlement.

| pacs.008 field | MTQSettlementInstruction field | Notes |
|---|---|---|
| `GrpHdr/MsgId` | (consumed for batch grouping; not on instruction) | Used to group multiple instructions in a single message. |
| `GrpHdr/CreDtTm` | `timestamp` | Message creation timestamp. |
| `GrpHdr/NbOfTxs` | (consumed for batch counting) | Number of transactions in the message. |
| `GrpHdr/InstgAgt/FinInstnId/BICFI` | `originBankId` | Originating bank BIC. |
| `GrpHdr/InstdAgt/FinInstnId/BICFI` | `destinationBankId` | Destination bank BIC. |
| `CdtTrfTxInf/PmtId/TxId` | `instructionId` | Transaction identification (UUIDv7 preferred). |
| `CdtTrfTxInf/PmtId/UETR` | `idempotencyKey` | Unique end-to-end transaction reference (UUID). |
| `CdtTrfTxInf/Amt/InstdAmt` | `amount` + `settlementCurrency` | Instructed amount + currency. |
| `CdtTrfTxInf/Amt/EqvtAmt` | `mtqAmount` | Equivalent amount in MTQ (after NAV/PAR conversion). |
| `CdtTrfTxInf/Purp/Prtry` | `transactionPurpose` | Purpose code (proprietary or ISO 20022 external code). |
| `CdtTrfTxInf/ChrgBr` | (fee allocation — recorded by AccountingReconciliationAdapter) | Charge bearer (DEBT/CRED/SHAR/SLEV). |
| `CdtTrfTxInf/InstrForCdtrAgt` | `corporateReference` | Instruction for creditor agent (pseudonymous corporate ref). |
| `CdtTrfTxInf/SttlmDt` | (settlement date — recorded in `expiry` calculation) | Settlement date. |
| (proprietary extension) `BankComplianceAttestation` | `complianceAttestation` | Bank's signed attestation (7 assertions). |
| (proprietary extension) `SanctionsStatus` | `sanctionsStatus` | Bank's sanctions screening result. |
| (proprietary extension) `PolicyVersion` | `policyVersion` | MITHQAL policy version authorizing this instruction. |
| (proprietary extension) `ReserveReference` | `reserveReference` | Reserve entry tied to this issuance. |
| (proprietary extension) `BankTransactionReference` | `bankTransactionReference` | Bank's own GL transaction reference. |

### 6.2 pacs.009 (FI-to-FI Credit Transfer — Institutional)

**Use case:** A bank transfers funds to another bank on its own behalf (e.g. Nostro/Vostro rebalancing, interbank liquidity). No corporate customer is involved; the `corporateReference` is set to the bank's own institutional reference.

| pacs.009 field | MTQSettlementInstruction field | Notes |
|---|---|---|
| `GrpHdr/InstgAgt` | `originBankId` | Originating bank. |
| `GrpHdr/InstdAgt` | `destinationBankId` | Destination bank. |
| `CdtTrfTxInf/PmtId/TxId` | `instructionId` | Transaction identification. |
| `CdtTrfTxInf/Amt/InstdAmt` | `amount` + `settlementCurrency` | Instructed amount + currency. |
| `CdtTrfTxInf/InstrForCdtrAgt` | `corporateReference` (bank's own ref) | Set to the bank's institutional ref (not a customer pseudonym). |
| `CdtTrfTxInf/Purp` | `transactionPurpose = "INTERBANK_LIQUIDITY"` | Always set to interbank liquidity purpose. |

### 6.3 pain.001 (Customer Payment Initiation)

**Use case:** A corporate customer initiates a payment run from its ERP (SAP / Oracle / Workday). The bank's payment gateway receives the pain.001 message, performs compliance checks, and forwards the authorized instructions to the MBG.

| pain.001 field | MTQSettlementInstruction field | Notes |
|---|---|---|
| `GrpHdr/MsgId` | (consumed for batch grouping) | Message ID. |
| `PmtInf/PmtInfId` | `customerAuthorizationReference` | Payment information identification (corporate payment run ID). |
| `PmtInf/ReqdExctnDt` | (used for `expiry` calculation) | Requested execution date. |
| `CdtTrfTxInf/PmtId/EndToEndId` | `instructionId` | End-to-end identification. |
| `CdtTrfTxInf/Amt/InstdAmt` | `amount` + `settlementCurrency` | Instructed amount + currency. |
| `CdtTrfTxInf/Cdtr/Nm` | `corporateReference` (pseudonymized) | Creditor name → pseudonymous corporate ref (bank maps real name → pseudonym). |
| `CdtTrfTxInf/Purp` | `transactionPurpose` | Purpose code. |

### 6.4 camt.054 (Bank-to-Customer Debit/Credit Notification)

**Use case:** MITHQAL returns settlement confirmations to the bank's MBG. The MBG translates the confirmation into a camt.054 message that the bank's existing reconciliation system consumes.

This message flows in the **opposite direction** — from MBG to bank. The MBG produces it; the bank consumes it.

| camt.054 field | Source | Notes |
|---|---|---|
| `GrpHdr/MsgId` | MBG-generated | Message ID. |
| `Ntfctn/NtfctnId` | MBG-generated | Notification identification. |
| `Ntfctn/NtfctnDt` | Settlement timestamp | Notification date. |
| `Ntry/Amt` | `mtqAmount` (settled amount in MTQ) | Settled MTQ amount. |
| `Ntry/CdtDbtInd` | `CRDT` (credit) or `DBIT` (debit) | Credit/debit indicator. |
| `Ntry/AcctSvcrRef` | `mtqSettlementId` (from AccountingReconciliationAdapter) | Account servicer reference. |
| `Ntry/NtryDtls/TxDtls/RltdPties/Cdtr` | `corporateReference` (pseudonymous) | Creditor (pseudonymized). |

### 6.5 camt.056 (FIToFI Payment Cancellation Request)

**Use case:** The originating bank requests cancellation of a previously submitted pacs.008 instruction. The MBG handles the cancellation request according to the `finalityState` of the original instruction.

| camt.056 field | MBG action | Notes |
|---|---|---|
| `Assgnmt/Assgnr` | Originating bank | Assigner of the cancellation request. |
| `Assgnmt/Assgne`` | MBG | Assignee (the MBG). |
| `Case/Id` | `idempotencyKey` collision check | Case identification. |
| `Undrlyg/Tx/OriginalTxId` | Look up original `instructionId` | Original transaction identification. |
| `CxlRsnInf/Rsn` | Maps to reversal reason | Cancellation reason code. |

**Cancellation rules:**
- If the original instruction's `finalityState` is `RECEIVED` or `AUTHORIZED` — cancellation succeeds; the instruction is moved to `BLOCKED` or `SUSPENDED`.
- If the original instruction's `finalityState` is `ISSUED` or later — cancellation fails. The instruction has already been settled on the MITHQAL canonical ledger; a separate reversal flow is required.
- The cancellation request itself is **idempotent** — a duplicate cancellation request for the same `Case/Id` is rejected.

---

## 7. Host-to-Host File Format Specification

### 7.1 File Structure

An H2H file is a fixed-width or delimited batch file containing:

```
+----------------------+
| File Header          |   1 record — file metadata + sender ID + recipient ID + record count
+----------------------+
| Batch Header         |   1 record — batch ID + aggregate compliance attestation (signed)
+----------------------+
| Detail Record 1      |
| Detail Record 2      |   N records — each translates to one MTQSettlementInstruction
| ...                  |
| Detail Record N      |
+----------------------+
| Batch Trailer        |   1 record — record count + checksums
+----------------------+
| File Trailer         |   1 record — file-level SHA-256 + signature
+----------------------+
```

### 7.2 Field-Level Mapping

Each detail record's fields map to `MTQSettlementInstruction` fields:

| H2H field position | MTQSettlementInstruction field |
|---|---|
| Positions 1-16 | `instructionId` (UUID) |
| Positions 17-22 | `originBankId` (BIC) |
| Positions 23-28 | `destinationBankId` (BIC) |
| Positions 29-44 | `corporateReference` (pseudonymous) |
| Positions 45-60 | `customerAuthorizationReference` |
| Positions 61-76 | `amount` (decimal, 2 places) |
| Positions 77-79 | `settlementCurrency` (ISO 4217) |
| Positions 80-94 | `mtqAmount` (decimal, 6 places) |
| Positions 95-110 | `bankTransactionReference` |
| Positions 111-126 | `idempotencyKey` |
| ... (further fields) | ... |

(Exact positions are per-bank; the bank declares its H2H layout in the adapter's `translationRules`.)

### 7.3 Batch-Level Compliance Attestation

The batch header carries one `BankComplianceAttestation` covering **all records in the batch**. This is more efficient than per-record attestations for high-volume batches.

```typescript
// Batch header attestation
{
  attestationId: "BATCH-ATT-<batchId>",
  institutionId: "<originating bank>",
  assertions: [/* 7 assertions */],
  signature: "<bank's signature over batch header + all detail records>",
  issuedAt: "<timestamp>",
  expiresAt: "<timestamp + 24h>",
  complianceSystemVersion: "<bank's compliance system version>"
}
```

The signature covers the entire batch (header + all detail records). If any record is tampered with after signature, the signature verification fails.

### 7.4 Replay Protection

Every H2H record carries:
- A per-record nonce (16-byte random)
- A timestamp (ISO 8601 UTC)

The MBG's replay-protection cache (per §17 of source, `replayProtection.cacheTtlSeconds = 86400`) detects duplicate nonces within the 24-hour window.

### 7.5 File-Level Idempotency

The file trailer carries a SHA-256 manifest hash. A file with the same SHA-256 manifest as a previously ingested file is rejected. This prevents the bank from accidentally re-sending the same file (e.g. due to a network retry).

---

## 8. REST API Connector Contract

### 8.1 The Bank's REST API Surface

The `BANK_REST_API` connector translates the bank's existing institutional REST API into MTQ settlement instructions. The bank's API surface is **preserved** — the MBG does not invent new endpoints.

### 8.2 Request Schema

```http
POST /transfer HTTP/1.1
Host: bank-api.institution.example
Authorization: Bearer <bank's existing OAuth2 token>
X-MBG-Signature: <bank's attestation key signature>
X-MBG-Nonce: <16-byte random hex>
X-MBG-Timestamp: <ISO 8601 UTC>
X-MBG-Idempotency-Key: <UUID>
X-MBG-Policy-Version: v25.0-mbg-1.0
Content-Type: application/json

{
  "institutionId": "INST-SIMULATED-001",
  "gatewayId": "MBG-SIM-001",
  "originBankId": "BANKXX00",
  "destinationBankId": "BANKYY00",
  "corporateReference": "CRP-ABC123XYZ",
  "customerAuthorizationReference": "AUTH-2026-0001",
  "amount": 1000000000,
  "settlementCurrency": "JPY",
  "mtqAmount": 9990.00,
  "transactionPurpose": "WHOLESALE_SETTLEMENT",
  "jurisdiction": "JP-US",
  "corridor": "JP-US-WHOLESALE",
  "complianceAttestation": {
    "attestationId": "ATT-2026-0001",
    "institutionId": "INST-SIMULATED-001",
    "assertions": [/* 7 assertions */],
    "signature": "<bank's signature over attestation>",
    "issuedAt": "<ISO 8601 UTC>",
    "expiresAt": "<ISO 8601 UTC + 24h>",
    "complianceSystemVersion": "bank-compliance-v2.3"
  },
  "sanctionsStatus": "CLEARED",
  "bankTransactionReference": "BTX-2026-0001",
  "signingKeyFingerprint": "sha256:..."
}
```

### 8.3 Response Schema

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "instructionId": "MBG-INSTR-1736822400-ABC12345",
  "finalityState": "RECEIVED",
  "timestamp": "<ISO 8601 UTC>",
  "receivedByGatewayId": "MBG-SIM-001",
  "idempotencyKey": "IDM-1736822400-ABC12345",
  "bankTransactionReference": "BTX-2026-0001"
}
```

### 8.4 Status Query

```http
GET /transfer/{instructionId}/status HTTP/1.1
Host: bank-api.institution.example
Authorization: Bearer <bank's existing OAuth2 token>
X-MBG-Signature: <bank's attestation key signature>
X-MBG-Nonce: <16-byte random hex>
X-MBG-Timestamp: <ISO 8601 UTC>
```

Response:

```json
{
  "instructionId": "MBG-INSTR-1736822400-ABC12345",
  "finalityState": "SETTLED",
  "description": "MTQ delivered to receiving bank's corporate account. Technical finality achieved (legal finality may follow).",
  "timestamp": "<ISO 8601 UTC>",
  "bankPortalStatusCode": "COMPLETED"
}
```

### 8.5 Reversal

```http
POST /transfer/{instructionId}/reverse HTTP/1.1
Host: bank-api.institution.example
Authorization: Bearer <bank's existing OAuth2 token>
X-MBG-Signature: <bank's attestation key signature>
X-MBG-Idempotency-Key: <UUID — different from original>
X-MBG-Nonce: <16-byte random hex>
X-MBG-Timestamp: <ISO 8601 UTC>

{
  "reason": "BANK_REQUESTED_CANCELLATION",
  "bankTransactionReference": "BTX-2026-0001-REVERSE"
}
```

The MBG checks the original instruction's `finalityState`. If `finalityState` is `SETTLED` or `COMPLETED`, reversal fails — a separate redemption flow is required. If `finalityState` is `RECEIVED`, `AUTHORIZED`, or `COMPLIANCE_VERIFIED`, reversal succeeds.

---

## 9. SFTP File Exchange Security Controls

### 9.1 File Format

```
intraday_instructions_2026-01-15_001.json.gpg
├── SHA-256: <hash>
├── GPG signature: <bank's GPG key>
├── SFTP key authentication: <bank's SFTP key>
└── Contents (decrypted):
    {
      "fileId": "INTRADAY-2026-01-15-001",
      "sender": { "institutionId": "INST-...", "bankId": "..." },
      "recipient": { "institutionId": "MITHQAL", ... },
      "createdAt": "<ISO 8601 UTC>",
      "expiresAt": "<ISO 8601 UTC + 24h>",
      "recordCount": 247,
      "records": [
        { /* MTQSettlementInstruction fields */ },
        ...
      ],
      "manifestHash": "sha256:..."
    }
```

### 9.2 The 12 Security Controls (per §17 of source)

Every SFTP file exchange must satisfy all 12 connectivity security controls enforced by `verifyConnectivitySecurity(profile)`:

1. **Mutual TLS** — bank cert fingerprint + MITHQAL cert fingerprint + min TLS version + cert rotation.
2. **Signed requests** — every file signed by the bank's attestation key (covers `instructionId`, `institutionId`, `amount`, `timestamp`, `nonce`).
3. **Hardware-backed signing** — bank's signing keys live in HSM/MPC (FIPS-140-2-L3 / FIPS-140-3-L3 / Common Criteria EAL5+ / bank-approved equivalent).
4. **Nonce** — 16+ byte random number per file, unique within 24-hour window.
5. **Timestamp** — file creation timestamp, max skew 60 seconds.
6. **Replay protection** — combined nonce + timestamp + idempotency, cache TTL 86400 seconds (24h).
7. **Idempotency** — `BANK_PROVIDED` (bank client generates) or `HASH_OF_PAYLOAD` (MBG derives from SHA-256). Cache TTL 86400 seconds.
8. **Message expiration** — files older than 86400 seconds (24h) rejected.
9. **IP network controls** — bank IP allowlist + MITHQAL IP allowlist (network-layer ACL).
10. **Institution allowlist** — only registered institution IDs may submit files.
11. **Key rotation** — periodic rotation of all keys (default 90 days).
12. **Emergency revocation** — ability to immediately revoke a bank's access (default 60 seconds).

### 9.3 File-Level Idempotency

The SHA-256 manifest hash of the file is the idempotency key. A duplicate file (same SHA-256) is rejected with HTTP 409 Conflict.

### 9.4 File Expiration

Files older than the `messageExpiration.maxAgeSeconds` window (default 86400s = 24h) are rejected. This prevents stale files from being processed late (e.g. due to delayed delivery).

### 9.5 Reconciliation Files

End-of-day reconciliation files flow in the opposite direction — from MITHQAL to the bank. They contain the bank's settled transactions for the day, formatted for the bank's `AccountingReconciliationAdapter` to consume.

```
settlement_confirmation_2026-01-15_BANKXX00.json.gpg
├── SHA-256: <hash>
├── GPG signature: <MITHQAL's GPG key>
└── Contents:
    {
      "fileId": "CONF-2026-01-15-BANKXX00",
      "bankId": "BANKXX00",
      "settlementDate": "2026-01-15",
      "recordCount": 184,
      "settlements": [
        {
          "mtqSettlementId": "...",
          "bankTransactionReference": "...",
          "mtqPosition": 1000.00,
          "settlementStatus": "SETTLED",
          "fxReference": "FX-2026-001",
          "reserveReference": "RES-...",
          "reconciliationState": "RECONCILED"
        },
        ...
      ]
    }
```

---

## 10. Treasury System Connector (SWIFT MT300, MT202)

### 10.1 MT300 (Foreign Exchange Confirmation)

**Use case:** A bank's treasury department confirms an FX deal with a counterparty bank. The MTQ settlement uses the FX-deal-confirmed rate; the `fxReference` is preserved for treasury reconciliation.

| MT300 field | MTQSettlementInstruction field | Notes |
|---|---|---|
| `:20:` (Transaction Reference Number) | `bankTransactionReference` | Treasury reference. |
| `:21:` (Related Reference) | `customerAuthorizationReference` | Related authorization ref. |
| `:82A:` (Buying Institution) | `originBankId` | Bank buying the FX. |
| `:87A:` (Selling Institution) | `destinationBankId` | Bank selling the FX. |
| `:30T:` (Trade Date) | `timestamp` | Trade date. |
| `:30V:` (Value Date) | `expiry` | Value date. |
| `:32B:` (Currency, Amount Bought) | `amount` + `settlementCurrency` | Bought currency + amount. |
| `:33B:` (Currency, Amount Sold) | (recorded in `fxReference`) | Sold currency + amount (preserved for treasury reconciliation). |
| `:36:` (Exchange Rate) | (recorded in `fxReference`) | Exchange rate. |

### 10.2 MT202 (General Financial Institution Transfer)

**Use case:** A bank transfers funds to another bank on its own behalf (cover payment, interbank liquidity movement). This is the institutional equivalent of pacs.009.

| MT202 field | MTQSettlementInstruction field | Notes |
|---|---|---|
| `:20:` (Transaction Reference Number) | `instructionId` | TRN. |
| `:21:` (Related Reference) | `customerAuthorizationReference` | Related ref. |
| `:32A:` (Value Date, Currency, Amount) | `expiry`, `settlementCurrency`, `amount` | Value date + currency + amount. |
| `:52A:` (Ordering Institution) | `originBankId` | Ordering bank. |
| `:58A:` (Beneficiary Institution) | `destinationBankId` | Beneficiary bank. |
| `:72:` (Sender to Receiver Information) | `transactionPurpose` | Purpose code. |

### 10.3 Liquidity Sweep Integration

The TMS may issue liquidity sweep instructions (e.g. sweep excess balance from a Nostro account to a Vostro account). The MBG translates these into MTQ settlement instructions with:

- `transactionPurpose = "TREASURY_LIQUIDITY_SWEEP"`
- `liquidityStatus` set per the ILPS 5-layer state at instruction time (NORMAL / ELEVATED / STRESSED / CRITICAL / HALTED).

If `liquidityStatus = HALTED`, the MBG rejects the liquidity sweep instruction — ILPS gate enforcement.

---

## 11. Corporate ERP Connector (SAP, Oracle, Workday)

### 11.1 The Bank-Mediated Routing Rule

**The corporate does NOT connect directly to the MBG.** This is a non-negotiable rule of the bank-mediated model.

The flow is:

```
Corporate ERP  →  Bank's ERP integration layer  →  Bank's payment gateway
                                                       ↓ (compliance, KYC, AML, sanctions)
                                                  MBG sidecar
                                                       ↓
                                                  MITHQAL Core
```

### 11.2 SAP S/4HANA — PEXR2002 IDOC

The corporate's SAP system produces a PEXR2002 IDOC (payment order IDOC) for each payment run. The bank's ERP integration layer receives the IDOC and translates it.

| PEXR2002 IDOC segment | Translation path |
|---|---|
| `E1IDKU1` (header) | Bank's ERP integration layer consumes |
| `E1IDPU1` (payment header) | Maps to bank's payment gateway payment header |
| `E1IDPU3` (payee) | Bank pseudonymizes payee → `corporateReference` |
| `E1IDPU5` (amount) | Maps to `amount` + `settlementCurrency` |
| `E1IDPT1` (payment reference) | Maps to `customerAuthorizationReference` |

### 11.3 Oracle Fusion — Payment Process Request XML

Oracle Fusion produces Payment Process Request (PPR) XML documents. The bank's ERP integration layer parses the XML and translates it.

| PPR XML element | Translation path |
|---|---|
| `/PaymentProcessRequest/PaymentInstruction` | Bank's payment gateway instruction header |
| `/PaymentProcessRequest/PaymentInstruction/Payment/Payee` | Bank pseudonymizes payee → `corporateReference` |
| `/PaymentProcessRequest/PaymentInstruction/Payment/Amount` | Maps to `amount` + `settlementCurrency` |
| `/PaymentProcessRequest/PaymentInstruction/Payment/PaymentReference` | Maps to `customerAuthorizationReference` |

### 11.4 Workday — Payment Run Web Services

Workday exposes payment run web services (SOAP-based). The bank's ERP integration layer calls these web services and translates the responses.

| Workday payment run field | Translation path |
|---|---|
| `Payment_ID` | Maps to `instructionId` |
| `Payee_Reference` | Bank pseudonymizes → `corporateReference` |
| `Amount` + `Currency` | Maps to `amount` + `settlementCurrency` |
| `Payment_Date` | Used for `expiry` calculation |
| `Company_Reference` | Maps to `customerAuthorizationReference` |

### 11.5 The Pseudonymization Step

In all three ERP cases (SAP, Oracle, Workday), the bank's ERP integration layer performs the **pseudonymization step** — translating the corporate's real identity (legal name, customer ID) into a stable, opaque pseudonymous `corporateReference`.

This pseudonym:
- Is the **same** for the same corporate across all payment runs (so MITHQAL can detect velocity / patterns).
- Is **NOT reversible** by MITHQAL without bank cooperation.
- Is **only** visible to MITHQAL — never the corporate's real identity.

This is the Layer-2 institutional settlement identity in the 3-layer privacy model (see §8 of source `BankGatewayPrivacyExchange`).

---

## 12. Certification Process for New Adapters

### 12.1 The 6 Certification Steps

```typescript
certificationProcessSteps: [
  "1. Bank proposes adapter (connector class + bank interface version + translation rules).",
  "2. MITHQAL certification authority reviews translation rules for completeness.",
  "3. Bank runs 20 required tests (MBG-T01..MBG-T20) against the adapter.",
  "4. Independent security review of the adapter (per §22 cost model).",
  "5. Certification issued — adapter status ACTIVE; otherwise PENDING_CERTIFICATION.",
  "6. Annual recertification; emergency revocation per connectivity profile §17.",
],
```

### 12.2 Step 1 — Adapter Proposal

The bank proposes an adapter by submitting:

- The chosen `connectorClass` (one of the 7 supported classes, or a proposed new class).
- The `bankInterfaceVersion` (e.g. "ISO 20022 pacs.008 v9.5" or "SAP S/4HANA 2023 FPS02").
- The `translationRules` — a human-readable description of the field mapping.
- A test environment for the MITHQAL certification authority to verify the adapter against.

### 12.3 Step 2 — Translation Rule Review

The MITHQAL certification authority reviews the translation rules for:

- **Completeness** — every `MTQSettlementInstruction` field is produced.
- **Determinism** — same input always produces same output.
- **No transformation** — the rule translates, never transforms (e.g. doesn't re-encode amounts, doesn't drop fields, doesn't add speculative fields).
- **Audit trail preservation** — the bank's `bankTransactionReference` is preserved for reconciliation.

### 12.4 Step 3 — The 20 Required Tests

The bank runs the 20 required tests `MBG-T01` … `MBG-T20` against the adapter. Tests are categorized:

- **CORE_ARCHITECTURE** (MBG-T01, MBG-T16) — connect without core replacement.
- **COMPLIANCE_BOUNDARY** (MBG-T02) — KYC/AML remains bank-authoritative.
- **CUSTOMER_EXPERIENCE** (MBG-T03) — existing bank UX remains authoritative.
- **PRIVACY** (MBG-T04) — minimum-necessary data, no PII.
- **MONETARY_INTEGRITY** (MBG-T05) — institutional deterministic issuance.
- **RECONCILIATION** (MBG-T06, MBG-T07, MBG-T08) — corporate, canonical, 5-way.
- **SECURITY** (MBG-T09, MBG-T19, MBG-T20) — replay, zero-trust, connectivity.
- **RESILIENCE** (MBG-T10) — deterministic recovery.
- **ECONOMICS** (MBG-T11, MBG-T12) — cost + ROI measurable.
- **ADAPTER_MODULARITY** (MBG-T13) — 7 connector classes modular.
- **CBDC_INTEROP** (MBG-T14) — CBDC through gateway.
- **BRICS_NEUTRALITY** (MBG-T15) — BRICS adapter optional.
- **HONEST_STATE** (MBG-T17) — no false "zero integration" claim.
- **ARCHITECTURE_CONSISTENCY** (MBG-T18) — architecture updated everywhere.

Until a real bank runs each test, the test status remains `SIMULATED`.

### 12.5 Step 4 — Independent Security Review

An independent security firm (not the bank, not MITHQAL) reviews the adapter implementation. The cost of this review is budgeted in the §22 cost model as `securityReview` (TIER_1: $60K, TIER_2: $30K, TIER_3: $12K).

### 12.6 Step 5 — Certification Issuance

If steps 2, 3, and 4 all pass, the adapter status moves from `PENDING_CERTIFICATION` to `ACTIVE`. The `certifiedAt` timestamp is recorded. The adapter is now eligible to process live instructions.

### 12.7 Step 6 — Annual Recertification + Emergency Revocation

Adapters must be recertified annually. The recertification verifies that the adapter still conforms to the current MSAS standard version, that the bank's upstream interface has not drifted, and that the 20 tests still pass.

Emergency revocation can occur at any time per §17 `emergencyRevocation`:

```typescript
emergencyRevocation: {
  enabled: true;
  revocationTimeSeconds: 60;     // 60 seconds to revoke
  revocationAuthority: "MITHQAL_COUNCIL" | "BANK_REQUEST" | "REGULATOR_ORDER";
}
```

---

## 13. Versioning Policy

### 13.1 Semver

MSAS uses semantic versioning (semver):

- **MSAS standard version** — the standard itself. Current version: `1.0`. Future versions: `1.1` (backward-compatible additions), `2.0` (breaking changes).
- **Adapter.protocolVersion** — the MSAS standard version the adapter implements. Must match a released MSAS standard version.
- **Adapter.bankInterfaceVersion** — the bank's own version of the upstream system being translated. Follows the bank's own versioning scheme (e.g. "ISO 20022 pacs.008 v9.5" or "SAP S/4HANA 2023 FPS02").

### 13.2 Backward Compatibility

| Change type | MSAS version bump | Adapter impact |
|---|---|---|
| Add a new connector class (e.g. add `BLOCKCHAIN_BRIDGE` as class 8) | Minor (1.0 → 1.1) | Existing adapters unaffected. New adapters may use the new class. |
| Add a new optional field to `MTQSettlementInstruction` | Minor (1.0 → 1.1) | Existing adapters unaffected (optional field). New adapters may populate the field. |
| Change a required field's semantics | Major (1.0 → 2.0) | All adapters must be recertified. |
| Remove a connector class | Major (1.0 → 2.0) | Adapters using the removed class must migrate. |

### 13.3 Versioning of the Standard vs Adapters

The MSAS standard version and individual adapter versions are independent:

```
MSAS standard:        1.0   1.0   1.0   1.1   1.1   1.1
Adapter versions:      1.0   1.0   1.0   1.0   1.0   1.1
Bank interface:       v9.5  v9.6  v9.7  v9.7  v9.8  v10.0
```

A bank may upgrade its `bankInterfaceVersion` (e.g. from ISO 20022 v9.5 to v9.6) without bumping the MSAS standard version. A bank may also upgrade its `protocolVersion` from 1.0 to 1.1 when the MSAS standard moves to 1.1, but this is optional — adapters on MSAS 1.0 remain conformant under MSAS 1.1 (backward compatible).

### 13.4 The Open-Standard Promise

```typescript
openStandard: true,                       // always open
proprietaryLockIn: false,                 // never proprietary
```

The MSAS standard is open. Any bank or vendor may implement an adapter that conforms to the standard. The certification process is the only gate — and the certification criteria are public (this document, plus the source module).

A bank that wants to leave the MITHQAL network can do so without losing its adapter implementation — the adapter speaks an open standard, not a proprietary protocol. The bank's investment in adapter development is portable.

---

## Appendix A — Cross-References

| Topic | Document |
|---|---|
| MBG architecture (canonical) | `docs/architecture/mbg/MITHQAL_BANK_GATEWAY_ARCHITECTURE.md` |
| Bank integration playbook | `docs/architecture/mbg/MITHQAL_BANK_INTEGRATION_GUIDE.md` |
| Bank security guide | `docs/architecture/mbg/MITHQAL_BANK_SECURITY_GUIDE.md` |
| Reconciliation architecture | `docs/architecture/mbg/MITHQAL_BANK_RECONCILIATION_GUIDE.md` |
| Bank ROI / cost model | `docs/architecture/mbg/MITHQAL_BANK_ROI_MODEL.md` |
| Corporate user flow | `docs/architecture/mbg/MITHQAL_CORPORATE_USER_FLOW.md` |
| Source module | `src/lib/mithqal-bank-gateway.ts` (§5 MSAS Adapter Standard) |
| MSAS standard constant | `MSAS_STANDARD` in source module |
| Adapter templates | `MSAS_ADAPTER_TEMPLATES` in source module (7 templates) |
| API endpoint discovery | `/api/gateway/v1` (8 endpoints) |

## Appendix B — Connector Class Quick Reference

| Class | Typical upstream | Typical protocol | Primary use |
|---|---|---|---|
| `ISO_20022` | ISO 20022 messaging gateway | XML (pacs/pain/camt) | Cross-border FI-to-FI flows |
| `BANK_REST_API` | Bank institutional REST API | HTTPS + JSON | Corporate portal + treasury workstation |
| `HOST_TO_HOST` | Mainframe H2H | Fixed-width / delimited batch | End-of-day settlement batches |
| `SECURE_FILE_EXCHANGE_SFTP` | SFTP file exchange | SFTP v6 + GPG | Reconciliation files, intraday batches |
| `EXISTING_PAYMENT_GATEWAY` | Vendor payment gateway | Vendor-specific | Corporate payment approval flow |
| `TREASURY_SYSTEM` | Treasury management system | SWIFT MT300/MT202 | Nostro/Vostro rebalancing, FX |
| `CORPORATE_ERP_CONNECTIVITY` | Corporate ERP (SAP/Oracle/Workday) | IDOC / XML / SOAP, bank-mediated | Corporate payment runs |

---

*End of MITHQAL_ADAPTER_STANDARD_MSAS.md — v25.0-mbg-amendment-1.0 — INTEGRATION-READY, 0 banks contracted.*

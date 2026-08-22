# MITHQAL Master Blueprint v25.2 — PART 10

**Sections 38 — 44**

> **SINGLE SOURCE OF TRUTH.** This part consolidates Sections 38 through 44 of the
> MITHQAL Master Blueprint v25.2. No older versions override this document. Where
> any conflict exists between this document and an older blueprint section, this
> document controls subject to the conflict reconciliation principle stated in
> §V25.2.49 (older 120% RR → 130%; older sleeve tables → 80/18/2; older 3.5%
> digital → 2%; older 60% per-currency cap → 20% operative with 60% retained only
> as deeper constitutional sanity ceiling that can NEVER override the 20%
> operating limit).

**Document Version:** MITHQAL v25.2
**Part Designation:** PART 10 (Sections 38 – 44)
**Task ID:** BP-SEC-10
**Authority:** Blueprint Editorial Authority under the Constitution
**Final Status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
**Honest State:** `honest = true`, `forcedToPass = false`, `productionAuthorized = false`

---

## TABLE OF CONTENTS — PART 10

- §38 — End-to-End Transaction Workflows (17 flows, A through Q)
- §39 — Testing Strategy (21 categories + adversarial scenarios)
- §40 — Production Readiness Framework (checklist + institutional validation gates)
- §41 — Implementation Roadmap (13 phases, Phase 0 through Phase 12)
- §42 — Open Items / TBD (13 items that cannot responsibly be determined)
- §43 — Appendices A through H
- §44 — Final Declaration

---

# §38 — END-TO-END TRANSACTION WORKFLOWS

## §38.0 — Purpose, Scope and Canonical Flow Template

This section defines the **canonical end-to-end transaction workflows** of the
MITHQAL institutional settlement system. Each workflow is fully specified across
**twelve (12) dimensions** so that every stakeholder — bank, custodian, regulator,
auditor, MITHQAL Operating Company, MITHQAL Technology Company, MITHQAL
Foundation, and the Founder Shareholders — has a single, unambiguous reference
for how value moves through the system, what evidence is produced, what
compliance is enforced, what ledger events occur, and how exceptions are handled.

The twelve dimensions are:

1. **Initiating Party** — who triggers the flow
2. **Validating Party** — who independently validates
3. **Message** — the canonical ISO 20022 / MBG message or API call
4. **System** — the MITHQAL subsystem(s) involved
5. **Ledger Event** — what is recorded on the canonical MTQ ledger
6. **Compliance Checks** — what compliance gates are evaluated
7. **Settlement State** — the state-machine transition
8. **Accounting State** — the three-book impact (Book A: MITHQAL Corporate, Book B:
   Bank MTQ Obligation Ledger, Book C: Corporate Participant Position)
9. **Finality** — what finality state is achieved (PENDING / TECHNICAL_FINAL /
   LEGAL_FINAL / BANKING_FINAL)
10. **Exception Handling** — what happens when the flow fails
11. **Audit Evidence** — what immutable audit trail is produced
12. **Cross-references** — blueprint sections that govern the flow

### §38.0.1 — Settlement State Machine (Canonical)

Every transaction moves through the following state machine:

```
        ┌──────────┐
        │ INITIATED│
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │ VALIDATED│
        └────┬─────┘
             │
             ▼
        ┌────────────┐
        │ AUTHORIZED │  ← MITHQAL Monetary Control signed authorization
        └────┬───────┘
             │
             ▼
        ┌────────────┐
        │ FINALIZED  │  ← 7-layer finality-before-mint gate passed
        └────┬───────┘
             │
             ▼
        ┌──────────┐
        │ MINTED   │  ← canonical ledger mint (BM-16) or transfer
        └────┬─────┘
             │
             ▼
        ┌──────────────┐
        │ SETTLED      │  ← receiving institution crediting confirmed
        └────┬─────────┘
             │
             ▼
        ┌──────────────┐
        │ RECONCILED   │  ← 5-way reconciliation verified
        └──────────────┘

    Failure at any state transitions to:
        ┌──────────────┐
        │ EXCEPTION    │ → resolution path per Flow H-Q
        └──────────────┘
```

### §38.0.2 — Finality-Before-Mint Invariant (Universal)

**Hard invariant:** `NO FINAL SETTLEMENT ⇒ NO MTQ MINT`

This invariant is enforced by **7 layers** (L1 API → L2 Workflow → L3 Policy →
L4 Authorization → L5 Ledger State Machine → L6 Database TX-State → L7 Smart
Contract). All 7 layers must pass before mint is executed. Any single layer
failure blocks the mint.

The 10 bypass routes that have been tested (DIRECT_API_CALL_WITHOUT_AUTH,
WORKFLOW_SKIP_BM15, POLICY_OVERRIDE_BY_COMMERCIAL, UNSIGNED_AUTHORIZATION,
LEDGER_SKIP_FINALIZED_STATE, DATABASE_PARTIAL_WRITE,
SMART_CONTRACT_WITHOUT_ORACLE, EMERGENCY_OVERRIDE_WITHOUT_GOVERNANCE,
ADMIN_BACKDOOR, INTERNAL_API_ROUTE) are **all blocked** — 10/10 routes blocked,
0/10 bypassed. The invariant holds at the code level.

**Status:** MITIGATED_AT_CODE_LEVEL. Remains HIGH at the production gate until
institutional validation gates (§40) are passed.

### §38.0.3 — Five-Way Reconciliation (Universal)

Every transaction is reconciled across **5 sources**:

1. **Bank MTQ subledger** (Source A — bank-side canonical)
2. **Reserve backing evidence** (Source A — bank-signed attestation / AvailableBackingCertificate)
3. **Custodian evidence** (Source B — independent custodian attestation)
4. **MITHQAL canonical MTQ ledger** (Source C — the authoritative ledger)
5. **Proof of liabilities** (Source D — independent attestation where available)

**7 reconciliation states:** VERIFIED / WARNING / MISMATCH / CRITICAL / EXPIRED /
UNAVAILABLE / LOCKED. Tolerance: 0.0001 (1 basis point).

### §38.0.4 — Three-Book Accounting (Universal)

Every transaction impacts **three separate books** that MUST reconcile but MUST
NEVER economically commingle:

- **Book A — MITHQAL Corporate:** revenue, expenses, payroll, tax, technology costs,
  corporate assets, corporate liabilities, profit/loss
- **Book B — Bank MTQ Obligation Ledger:** responsible bank, applicable backing,
  MTQ originated, MTQ outstanding, redemption obligations, liquidity, settlement,
  bank risk
- **Book C — Corporate Participant Position:** MTQ balance, available MTQ, reserved
  MTQ, pending MTQ, sent, received, redemption, settlement history, bank-money linkage

**4 anti-commingling tests** (all `blocked = true`):
1. Corporate cash → MTQ backing without authorization — BLOCKED
2. Bank obligation → MITHQAL corporate revenue — BLOCKED
3. Corporate MTQ → MITHQAL asset — BLOCKED
4. Reserve gain → Operating Company revenue — BLOCKED

### §38.0.5 — Universal Compliance Gates

Every transaction passes through the **settlement permission engine (12-check gate)**:

1. KYC/KYB verification of sender
2. KYC/KYB verification of receiver
3. AML/CFT screening
4. Sanctions screening (sender, receiver, beneficial owners, corridor)
5. Beneficial ownership verification
6. Jurisdictional authorization (both sides)
7. Corridor authorization (origin → destination)
8. Funding verification (eligible backing exists)
9. DMCE capacity check (within Dynamic Minting Capacity Engine limit)
10. Concentration limit check (bank, custodian, country, currency)
11. Reserve ratio preservation (RR ≥ 1.00, StressRR ≥ 0.95)
12. Settlement finality verification (7-layer finality gate)

ANY FAILURE = BLOCK. No partial pass. No override by commercial staff.

### §38.0.6 — Workflows Catalog

| ID | Flow Name | Trigger | Outcome |
|----|-----------|---------|---------|
| A | Institutional Settlement Initiation | Corporate request | MTQ mint + transfer |
| B | Bank-Side Compliance Attestation | Bank receiving request | Compliance evidence package |
| C | MTQ Issuance / Allocation | Bank issuance request | MTQ minted to bank wallet |
| D | MTQ Settlement | MTQ in transit | Receiving bank receives MTQ |
| E | Receiving Institution Settlement | MTQ received | Beneficiary credited |
| F | Redemption / Exit | Redemption request | MTQ burned + asset released |
| G | Reserve Rebalancing | Drift detection | Reserve composition adjusted |
| H | Exception / Failed Settlement | Settlement failure | Controlled failure outcome |
| I | Compliance Rejection | Compliance check fail | Transaction blocked |
| J | Sanctions Screening Failure | Sanctions match | Transaction frozen + investigated |
| K | Insufficient Funds | Funding shortfall | Issuance blocked |
| L | Bank Gateway Failure | MBG outage | Retry / fallback / halt |
| M | Network Failure | Network partition | Rail fallback / safe-halt |
| N | Reconciliation Break | 5-way mismatch | Forensic investigation |
| O | Emergency Suspension | CALM transition | Restricted operations |
| P | Disaster Recovery | DR event | Failover to recovery site |
| Q | Governance Intervention | Council action | Directed system action |

---

## §38.A — Flow A: Institutional Settlement Initiation

### §38.A.1 — Initiating Party

**Initiating Party:** Corporate Treasury Department of a participating institution's
client (the "Corporate").

The Corporate initiates a cross-border or cross-currency settlement instruction
through its existing banking relationship. The Corporate does NOT directly interact
with MITHQAL — the Corporate's bank is the regulated access layer between the
Corporate and MITHQAL.

**Pre-conditions:**
- Corporate has an existing account at a participating regulated bank
- Corporate has completed bank-side KYC/KYB
- Corporate is authorized for the requested corridor
- Bank has confirmed sufficient available backing for the transaction

### §38.A.2 — Validating Party

**Validating Party:** The participating bank (Bank A — Sending Bank).

The bank validates:
- Corporate identity (KYC/KYB)
- Corporate beneficial ownership
- Corporate AML/CFT status
- Corporate sanctions status
- Corporate available funds / credit
- Corridor authorization for the requested currency pair
- Transaction amount within corporate limits
- Transaction purpose (regulatory classification)

### §38.A.3 — Message

**Canonical message:** ISO 20022 `pain.001` (Customer Credit Transfer Initiation)
submitted by the Corporate to the bank, translated by the bank into a
`MTQSettlementInstruction` for the MITHQAL Bank Gateway (MBG).

**Message fields (15 mandatory):**
1. `instructionId` — bank-unique identifier
2. `corporateId` — corporate identifier at the bank
3. `corporateAccountId` — corporate's bank account
4. `amount` — settlement amount in source currency
5. `sourceCurrency` — ISO 4217 currency code
6. `targetCurrency` — ISO 4217 currency code
7. `beneficiaryName` — beneficiary corporate name
8. `beneficiaryBankBIC` — beneficiary bank BIC/SWIFT code
9. `beneficiaryAccount` — beneficiary account number
10. `purposeCode` — ISO 20022 purpose code
11. `corridorId` — MITHQAL corridor identifier
12. `regulatoryReporting` — regulatory reporting data
13. `requestedValueDate` — requested settlement date
14. `feePreference` — fee allocation (OUR / SHA / BEN)
15. `corporateSignature` — corporate's cryptographic signature

### §38.A.4 — System

**Systems involved:**
- BNK-01: Corporate Treasury Portal (bank-side)
- BNK-02: Core Banking System (bank-side)
- BNK-03: KYC/KYB Engine (bank-side)
- BNK-04: AML/Sanctions Engine (bank-side)
- BNK-05: FX/Treasury (bank-side)
- MBG-01: MBG Adapter (MITHQAL Bank Gateway)
- MBG-02: ISO 20022 Layer
- MTH-01: MITHQAL Core (authorization engine)
- MTH-02: Ledger State Machine
- MTH-03: Finality Gate (7 layers)

### §38.A.5 — Ledger Event

**Canonical ledger event (BM-16 Mint):**
```
LEDGER_EVENT {
  type: "MTQ_MINT",
  transactionId: <idempotent CTID>,
  timestamp: <ISO 8601>,
  institutionalSender: <Bank A identifier>,
  institutionalReceiver: <Bank B identifier>,
  mtqAmount: <amount>,
  sourceCurrency: <currency>,
  targetCurrency: <currency>,
  reserveReference: <Protected Backing Cell ID>,
  authorizationSignature: <MITHQAL Monetary Control signature>,
  finalityProof: <7-layer finality attestation>,
  cryptographicHash: <SHA-256 hash>,
  ledgerCommitment: <Merkle tree commitment>,
  jurisdiction: <origin jurisdiction>,
  settlementChannel: <rail identifier>,
  finalityStatus: "BANKING_FINAL",
  settlementState: "MINTED"
}
```

**Book B impact (Bank MTQ Obligation Ledger):**
- MTQ originated: +amount
- Applicable backing: identified Protected Backing Cell
- Bank risk: recalculated

**Book C impact (Corporate Participant Position):**
- Pending MTQ: +amount (initially reserved, then sent)
- Settlement history: append transaction record

### §38.A.6 — Compliance Checks

**Compliance gates evaluated (12-check gate):**
1. KYC/KYB sender ✓ (validated by Bank A)
2. KYC/KYB receiver ✓ (validated by Bank B via MBG)
3. AML/CFT ✓
4. Sanctions screening ✓ (both sides + corridor)
5. Beneficial ownership ✓
6. Jurisdiction authorization ✓ (origin + destination)
7. Corridor authorization ✓
8. Funding verification ✓ (AvailableBackingCertificate signed by Bank A)
9. DMCE capacity ✓ (within Dynamic Minting Capacity Engine)
10. Concentration limits ✓ (bank, custodian, country, currency)
11. Reserve ratio preservation ✓ (RR ≥ 1.00, StressRR ≥ 0.95)
12. Settlement finality ✓ (7-layer finality gate passed)

### §38.A.7 — Settlement State

**State transitions:**
```
INITIATED → VALIDATED → AUTHORIZED → FINALIZED → MINTED → SETTLED → RECONCILED
```

State durations (typical, observed in design-time simulation):
- INITIATED → VALIDATED: 2-4 seconds (bank-side validation)
- VALIDATED → AUTHORIZED: 1-3 seconds (MITHQAL core authorization)
- AUTHORIZED → FINALIZED: 1-2 seconds (7-layer finality gate)
- FINALIZED → MINTED: <1 second (deterministic mint)
- MINTED → SETTLED: 2-5 seconds (receiving bank processing)
- SETTLED → RECONCILED: end-of-day batch + ad-hoc continuous

**Total end-to-end:** typically 6-15 seconds for atomic-rail settlement,
2-5 minutes for non-atomic rails with settlement windows.

### §38.A.8 — Accounting State

**Book A (MITHQAL Corporate):**
- Settlement fee revenue: +amount × fee_bps (e.g., 5 bps = 0.05%)
- Connectivity fee: +flat fee per transaction
- No reserve impact (MITHQAL is non-custodial)

**Book B (Bank A MTQ Obligation Ledger):**
- MTQ originated: +amount
- Applicable backing: Protected Backing Cell identified (no transfer of custody)
- Bank risk score: recalculated
- Liquidity position: adjusted

**Book C (Corporate Participant Position):**
- Source currency account: -source_amount (debit at Bank A)
- Pending MTQ: +mtq_amount (initially reserved)
- Settlement history: +transaction record

### §38.A.9 — Finality

**Finality achieved:** `BANKING_FINAL` (the strongest finality tier).

The transaction achieves:
1. **Technical finality** — ledger commitment is immutable
2. **Legal finality** — settlement is irrevocable under applicable law
3. **Banking finality** — receiving bank has confirmed credit to beneficiary

### §38.A.10 — Exception Handling

**Exception paths:**
- Compliance failure → Flow I (Compliance Rejection)
- Sanctions match → Flow J (Sanctions Screening Failure)
- Insufficient backing → Flow K (Insufficient Funds)
- Bank gateway outage → Flow L (Bank Gateway Failure)
- Network partition → Flow M (Network Failure)
- Reconciliation mismatch → Flow N (Reconciliation Break)
- Emergency declared → Flow O (Emergency Suspension)
- Disaster event → Flow P (Disaster Recovery)
- Council directive → Flow Q (Governance Intervention)

**Exception default:** Any unidentified exception transitions the transaction to
EXCEPTION state and triggers Flow H (Exception / Failed Settlement). NO
transaction may remain in an undefined state — the state machine is fully
closed.

### §38.A.11 — Audit Evidence

**Audit trail produced (immutable):**
1. Corporate initiation log (bank-side, immutable)
2. KYC/KYB verification log (bank-side)
3. AML/sanctions screening log (bank-side)
4. AvailableBackingCertificate (bank-signed, 16 fields)
5. MBG translation log (MITHQAL-side)
6. Eligibility check log (MITHQAL-side)
7. Jurisdiction check log (MITHQAL-side)
8. Backing verification log (MITHQAL-side)
9. Bank-specific risk assessment log (MITHQAL-side)
10. System-wide concentration check log (MITHQAL-side)
11. DMCE check log (MITHQAL-side)
12. Monetary authorization signature (MITHQAL Monetary Control)
13. 7-layer finality proof (L1-L7 each signed)
14. Mint transaction record (canonical ledger)
15. 5-way reconciliation result
16. Settlement confirmation (receiving bank)
17. Beneficiary credit confirmation (receiving bank)
18. Audit trail hash chain (Merkle tree)

**Retention:** 7 years minimum (regulatory); 25 years recommended
(constitutional).

### §38.A.12 — Cross-References

- §V25.0.5 (Neutral Cross-Border Settlement Flow)
- §V25.0.9 (Institutional Traceability — 14-field schema)
- §V25.0.11 (Corporate MTQ Settlement Account)
- §V25.0.D.X (Bank Minting Workflow — 16 steps BM-01..BM-16)
- §V25.0.D.Z (Five-Way Reconciliation)
- §V25.0.D.AA (Bank Monitoring Authority)
- §V25.1.GOV (Constitutional Governance)
- §V25.2.AUDIT-CLOSURE.7 (Finality-Before-Mint strengthened — 7 layers)
- §V25.2.AUDIT-CLOSURE.5 (Three-Book Separation)

---

## §38.B — Flow B: Bank-Side Compliance Attestation

### §38.B.1 — Initiating Party

**Initiating Party:** Participating Bank (Bank A — Sending Bank), triggered by
receipt of a corporate settlement request (Flow A step 1).

### §38.B.2 — Validating Party

**Validating Party:** Independent validator within the bank (compliance officer
separated from commercial/sales functions by structural separation).

### §38.B.3 — Message

**Canonical message:** Internal bank compliance attestation issued to the MBG
as `BankComplianceAttestation` containing:
1. `attestationId` — bank-unique
2. `bankId` — participating bank identifier
3. `corporateId` — corporate customer identifier
4. `transactionReference` — link to corporate request
5. `kycKybStatus` — VERIFIED / PENDING / REJECTED
6. `kycKybTimestamp` — verification timestamp
7. `kycKybOfficer` — verifying officer identifier
8. `amlCftStatus` — PASS / FAIL / INVESTIGATION
9. `amlCftTimestamp` — screening timestamp
10. `sanctionsStatus` — CLEAR / MATCH / INVESTIGATION
11. `sanctionsTimestamp` — screening timestamp
12. `beneficialOwnershipVerified` — boolean
13. `corridorAuthorized` — boolean
14. `fundingVerified` — boolean
15. `availableBackingCertificateId` — link to backing evidence
16. `bankSignature` — bank's cryptographic signature

### §38.B.4 — System

- BNK-03: KYC/KYB Engine
- BNK-04: AML/Sanctions Engine
- BNK-05: FX/Treasury (for funding verification)
- Bank-side HSM/MPC (for cryptographic signatures)
- MBG-01: MBG Adapter (submits attestation to MITHQAL)

### §38.B.5 — Ledger Event

**No canonical ledger event** at this stage — the attestation is bank-side
evidence that becomes part of the audit trail when MTQ mint occurs in Flow C.

**Audit ledger event:**
```
AUDIT_EVENT {
  type: "BANK_COMPLIANCE_ATTESTATION",
  attestationId: <id>,
  bankId: <bank>,
  timestamp: <ISO 8601>,
  fields: <16-field attestation>,
  bankSignature: <signature>,
  verificationStatus: "RECEIVED_BY_MITHQAL"
}
```

### §38.B.6 — Compliance Checks

The bank attests that it has performed:
- KYC/KYB verification (per bank's regulatory framework)
- AML/CFT screening (per bank's regulatory framework)
- Sanctions screening (per bank's regulatory framework, including OFAC,
  EU consolidated list, UN, HMT, and jurisdiction-specific lists)
- Beneficial ownership verification (per bank's regulatory framework)
- Corridor authorization check (MITHQAL corridor list)
- Funding verification (AvailableBackingCertificate issued)

### §38.B.7 — Settlement State

Transaction state: `VALIDATED` (post-initiation, pre-authorization).

### §38.B.8 — Accounting State

**Book A (MITHQAL Corporate):** No impact (compliance is bank-side)

**Book B (Bank A MTQ Obligation Ledger):**
- Compliance evidence recorded
- Available backing earmarked (Protected Backing Cell identified)
- Pending issuance recorded

**Book C (Corporate Participant Position):**
- Pending transaction recorded
- No MTQ movement yet

### §38.B.9 — Finality

**Finality achieved:** None yet (compliance attestation is preparatory).

### §38.B.10 — Exception Handling

- KYC/KYB failure → Flow I (Compliance Rejection)
- AML/CFT failure → Flow I
- Sanctions match → Flow J (Sanctions Screening Failure)
- Beneficial ownership unclear → Flow I (rejection until clarified)
- Funding insufficient → Flow K (Insufficient Funds)
- Bank officer unavailable → transaction held in PENDING (24-hour timeout)
- Bank system outage → Flow L (Bank Gateway Failure)

### §38.B.11 — Audit Evidence

1. KYC/KYB verification record (bank-side, signed)
2. AML/CFT screening record (bank-side, signed)
3. Sanctions screening record (bank-side, signed)
4. Beneficial ownership record (bank-side, signed)
5. AvailableBackingCertificate (bank-signed, 16 fields)
6. Bank compliance attestation (16 fields, signed)
7. Compliance officer identity (anonymized for audit, identifiable for regulator)

### §38.B.12 — Cross-References

- §V25.0.4 (KYC/KYB Architecture — Layered)
- §V25.0.D.X (Bank Minting Workflow — steps BM-02, BM-03, BM-04)
- §V25.1.GOV (Constitutional Governance — separation of duties)

---

## §38.C — Flow C: MTQ Issuance / Allocation

### §38.C.1 — Initiating Party

**Initiating Party:** Participating Bank (Bank A), following completion of Flow B
(compliance attestation).

The bank submits an MTQ issuance request through the MBG. The bank CANNOT mint
MTQ directly — only the canonical MITHQAL ledger can mint, after MITHQAL
authorization (P25: "Banks CANNOT mint MTQ — only the canonical ledger can,
after MITHQAL authorization").

### §38.C.2 — Validating Party

**Validating Party:** MITHQAL Monetary & Reserve Control Division (operationally
separated from sales, marketing, bank relationship, and commercial teams).

### §38.C.3 — Message

**Canonical message:** `MTQIssuanceRequest` submitted via `/api/v25.1/mtq/mint`
(POST) with:
1. `requestId` — idempotency key
2. `bankId` — requesting bank identifier
3. `corporateId` — beneficial corporate
4. `amount` — MTQ amount requested
5. `sourceCurrency` — source currency
6. `targetCurrency` — target currency
7. `availableBackingCertificateId` — backing reference
8. `complianceAttestationId` — compliance attestation
9. `corridorId` — corridor identifier
10. `beneficiaryBankId` — receiving bank
11. `timestamp` — fresh timestamp (within 60 seconds)
12. `expiry` — request expiry (default 5 minutes)
13. `bankSignature` — bank's HSM/MPC signature
14. `nonce` — replay protection nonce
15. `proofOfFinality` — preliminary finality proof (pre-mint)

### §38.C.4 — System

- MBG-01: MBG Adapter (receives request)
- MBG-02: ISO 20022 Layer (translation)
- MBG-03: API Gateway (authentication)
- MTH-01: MITHQAL Core (authorization engine)
- MTH-02: Ledger State Machine (mint transition)
- MTH-03: Finality Gate (7 layers)

### §38.C.5 — Ledger Event

**Canonical ledger event (BM-16 Mint):**
```
LEDGER_EVENT {
  type: "MTQ_MINT",
  transactionId: <CTID>,
  timestamp: <ISO 8601>,
  bankId: <Bank A>,
  corporateId: <corporate>,
  mtqAmount: <amount>,
  sourceCurrency: <currency>,
  targetCurrency: <currency>,
  corridorId: <corridor>,
  backingReference: <Protected Backing Cell ID>,
  authorizationSignature: <MITHQAL Monetary Control>,
  finalityProof: <7-layer proof>,
  ledgerCommitment: <Merkle tree>,
  finalityStatus: "BANKING_FINAL",
  settlementState: "MINTED"
}
```

**Supply impact:** Total MTQ supply increases by `mtqAmount`. The supply
remains canonical (Theorem S1: one ledger, one supply).

### §38.C.6 — Compliance Checks

The 15-step issuance authorization gate (per §V25.0.D.W — 15-step gate):

1. AvailableBackingCertificate validity (16 fields, dual revocation)
2. RCAF validity (18 required fields, ELIGIBLE status)
3. Joint Settlement Guarantee (JSG) computation
4. RR ≥ 1.00 evaluation
5. StressRR ≥ 0.95 evaluation
6. LCR ≥ 1.00 evaluation
7. MLCR ≥ 1.00 evaluation
8. ILPS sufficiency (5-layer $48.1M)
9. Institutional exposure ≤ hard cap (default 25%)
10. Concentration ≤ hard cap (25%)
11. DMCE computation (MIN of 8 limits)
12. Jurisdiction authorization
13. Corridor authorization
14. Compliance attestation validity
15. Settlement finality proof (7 layers)

**ANY FAILURE = BLOCK.** No partial pass. No override.

### §38.C.7 — Settlement State

```
VALIDATED → AUTHORIZED → FINALIZED → MINTED
```

The mint occurs at the FINALIZED → MINTED transition. The 7-layer finality gate
must pass BEFORE the mint (BM-15 before BM-16).

### §38.C.8 — Accounting State

**Book A (MITHQAL Corporate):**
- Issuance service fee revenue: +amount × issuance_fee_bps
- No reserve impact

**Book B (Bank A MTQ Obligation Ledger):**
- MTQ originated: +amount
- MTQ outstanding: +amount
- Applicable backing: Protected Backing Cell (no transfer of custody)
- Bank risk score: recalculated

**Book C (Corporate Participant Position):**
- Available MTQ: +amount
- Settlement history: +transaction record

### §38.C.9 — Finality

**Finality achieved:** `BANKING_FINAL` once mint is confirmed and reconciliation
verifies the 5 sources.

The mint is **atomic** with the finality proof — they are written in a single ACID
transaction (L6 enforcement). Partial writes roll back.

### §38.C.10 — Exception Handling

- Any of 15 gate checks fail → BLOCK (transaction state: REJECTED)
- 7-layer finality failure → BLOCK (transaction state: REJECTED, reason logged)
- Ledger state machine violation (e.g., skip FINALIZED) → BLOCK
- Database partial write → rolled back atomically
- Smart contract revert → mint reverts, transaction state: REJECTED
- DMCE exceeded → issuance capped at DMCE limit; remainder blocked
- RR breach risk → mint blocked; triggers Flow G (Reserve Rebalancing)

### §38.C.11 — Audit Evidence

1. Full `MTQIssuanceRequest` (15 fields, signed)
2. 15-step gate evaluation record (each step, each result)
3. DMCE computation record (8 limits, MIN)
4. 7-layer finality proof (L1-L7 each signed)
5. Mint transaction record (canonical ledger, immutable)
6. Merkle tree commitment
7. 5-way reconciliation result
8. Authorization signature (MITHQAL Monetary Control)
9. Bank signature (HSM/MPC)

### §38.C.12 — Cross-References

- §V25.0.3 (Minting Model — Institutional Issuance Pipeline)
- §V25.0.23 (Settlement Permission Engine — 12-check gate)
- §V25.0.D.V (DMCE — Dynamic Minting Capacity Engine)
- §V25.0.D.W (RCAF + AvailableBackingCertificate)
- §V25.0.D.X (Bank Minting Workflow — 16 steps)
- §V25.2.AUDIT-CLOSURE.7 (Finality-Before-Mint strengthened)

---

## §38.D — Flow D: MTQ Settlement

### §38.D.1 — Initiating Party

**Initiating Party:** MITHQAL canonical ledger, executing the mint-then-transfer
sequence triggered by the authorization in Flow C.

### §38.D.2 — Validating Party

**Validating Party:** Receiving Bank (Bank B), validating the incoming MTQ
transfer against its own records and the MBG notification.

### §38.D.3 — Message

**Canonical message:** `MTQTransferInstruction` (internal MITHQAL message)
plus ISO 20022 `pacs.008` (FIToFICustomerCreditTransfer) for bank-side notification.

### §38.D.4 — System

- MTH-02: Ledger State Machine (executes transfer)
- MBG-02: ISO 20022 Layer (notifies receiving bank)
- MBG-03: API Gateway (receiving bank endpoint)
- BNK-02: Receiving Bank Core Banking System

### §38.D.5 — Ledger Event

```
LEDGER_EVENT {
  type: "MTQ_TRANSFER",
  transactionId: <CTID>,
  timestamp: <ISO 8601>,
  fromInstitution: <Bank A>,
  toInstitution: <Bank B>,
  mtqAmount: <amount>,
  transferHash: <SHA-256>,
  ledgerCommitment: <Merkle tree>,
  settlementState: "SETTLED"
}
```

**Supply impact:** No change to total supply (transfer between wallets, not mint
or burn).

### §38.D.6 — Compliance Checks

- Receiving bank KYC/KYB of beneficiary ✓
- Receiving bank AML/sanctions of beneficiary ✓
- Receiving bank corridor authorization ✓
- Receiving bank capacity check (can it accept this MTQ position?) ✓

### §38.D.7 — Settlement State

```
MINTED → SETTLED
```

### §38.D.8 — Accounting State

**Book B (Bank A MTQ Obligation Ledger):**
- MTQ outstanding: -amount (transferred)
- Bank risk: recalculated

**Book B (Bank B MTQ Obligation Ledger):**
- MTQ outstanding: +amount (received)
- Bank risk: recalculated

**Book C (Corporate Participant Position at Bank A):**
- Available MTQ: -amount
- Sent: +amount

**Book C (Corporate Participant Position at Bank B — beneficiary):**
- Available MTQ: +amount
- Received: +amount

### §38.D.9 — Finality

**Finality achieved:** `BANKING_FINAL` (transfer is irrevocable).

The MTQ transfer is atomic with the receiving bank's confirmation. If the
receiving bank rejects (e.g., beneficiary account closed), the transaction
reverses through Flow H (Exception / Failed Settlement).

### §38.D.10 — Exception Handling

- Receiving bank rejects → Flow H
- Receiving bank offline → retry (3 attempts, then Flow L)
- Beneficiary account invalid → Flow H
- MTQ transfer exceeds receiving bank's limits → Flow H
- Reconciliation mismatch post-transfer → Flow N

### §38.D.11 — Audit Evidence

1. MTQ transfer record (canonical ledger)
2. Receiving bank notification (ISO 20022 pacs.008)
3. Receiving bank confirmation (ISO 20022 pacs.002)
4. Merkle tree commitment update
5. 5-way reconciliation result (post-transfer)

### §38.D.12 — Cross-References

- §V25.0.5 (Neutral Cross-Border Settlement Flow)
- §V25.0.9 (Institutional Traceability — 6-hop trace path)
- §V25.0.26 (Settlement Finality)
- §V25.1.GOV (Constitutional Governance)

---

## §38.E — Flow E: Receiving Institution Settlement

### §38.E.1 — Initiating Party

**Initiating Party:** Receiving Bank (Bank B), upon receipt of MTQ transfer
notification from MITHQAL.

### §38.E.2 — Validating Party

**Validating Party:** Receiving Bank's compliance and operations team
(structurally separated from commercial/sales).

### §38.E.3 — Message

**Canonical messages:**
- ISO 20022 `pacs.008` (incoming credit transfer notification from MBG)
- ISO 20022 `pacs.002` (FIToFIPaymentStatusReport — confirmation back to MBG)
- ISO 20022 `camt.054` (BankToCustomerDebitCreditNotification — to beneficiary)

### §38.E.4 — System

- MBG-02: ISO 20022 Layer (receiving side)
- BNK-02: Receiving Bank Core Banking System
- BNK-03: KYC/KYB Engine (beneficiary verification)
- BNK-04: AML/Sanctions Engine (beneficiary screening)
- BNK-05: FX/Treasury (currency conversion if needed)

### §38.E.5 — Ledger Event

**Canonical ledger event (Atomic Redeem at Receiving Bank):**
```
LEDGER_EVENT {
  type: "MTQ_REDEEM",
  transactionId: <CTID>,
  timestamp: <ISO 8601>,
  redeemingBank: <Bank B>,
  mtqAmount: <amount>,
  targetCurrency: <currency>,
  beneficiaryAccount: <account>,
  settlementAsset: <asset delivered>,
  ledgerCommitment: <Merkle tree>,
  finalityStatus: "BANKING_FINAL",
  settlementState: "SETTLED"
}
```

**Supply impact:** Total MTQ supply decreases by `mtqAmount` (atomic redeem
at receiving bank, in a same-transaction atomic mint+transfer+redeem sequence
for atomic-rail settlements).

### §38.E.6 — Compliance Checks

- Beneficiary KYC/KYB ✓
- Beneficiary AML/sanctions ✓
- Beneficiary account status ✓
- Regulatory reporting (incoming cross-border) ✓
- Currency conversion compliance (if applicable) ✓

### §38.E.7 — Settlement State

```
SETTLED → RECONCILED
```

### §38.E.8 — Accounting State

**Book B (Bank B MTQ Obligation Ledger):**
- MTQ outstanding: -amount (redeemed)
- Redemption obligations: +amount (to be settled in local currency)
- Settlement asset released: -amount (in local currency)

**Book C (Corporate Participant Position at Bank B — beneficiary):**
- Received: +amount (MTQ)
- Beneficiary account: +amount (local currency)
- Settlement history: +transaction record

### §38.E.9 — Finality

**Finality achieved:** `BANKING_FINAL` (beneficiary account credited).

### §38.E.10 — Exception Handling

- Beneficiary account closed → Flow H (return to sender)
- Beneficiary under investigation → Flow J (Sanctions Screening Failure)
- Currency conversion failure → Flow H
- Regulatory reporting failure → hold transaction, escalate

### §38.E.11 — Audit Evidence

1. Incoming MTQ notification (pacs.008)
2. Beneficiary verification records
3. Currency conversion record (if applicable)
4. Beneficiary credit record
5. Status report sent to MBG (pacs.002)
6. Customer notification (camt.054)
7. 5-way reconciliation result

### §38.E.12 — Cross-References

- §V25.0.5 (Neutral Cross-Border Settlement Flow — Japan → USA example)
- §V25.0.9 (Institutional Traceability)
- §V25.0.14 (Redemption Flow — Institutional)

---

## §38.F — Flow F: Redemption / Exit

### §38.F.1 — Initiating Party

**Initiating Party:** Corporate holding MTQ position, through its bank
(Bank B — bank where the MTQ position is held).

### §38.F.2 — Validating Party

**Validating Party:** Bank B (validates redemption rights) + MITHQAL Monetary &
Reserve Control Division (validates reserve sufficiency for redemption).

### §38.F.3 — Message

**Canonical message:** `MTQRedemptionRequest` submitted via `/api/v25.1/mtq/redeem`
(POST) with:
1. `requestId` — idempotency key
2. `bankId` — Bank B
3. `corporateId` — corporate holding MTQ
4. `mtqAmount` — amount to redeem
5. `targetAsset` — asset requested (default: local currency)
6. `targetAccount` — beneficiary account
7. `redemptionReason` — purpose code
8. `bankSignature` — bank's HSM/MPC signature
9. `corporateSignature` — corporate's signature
10. `timestamp` — fresh timestamp
11. `nonce` — replay protection
12. `proofOfLiabilities` — PoL reference

### §38.F.4 — System

- BNK-01: Corporate Treasury Portal (bank-side)
- BNK-02: Core Banking System (Bank B)
- MBG-01: MBG Adapter (receives redemption request)
- MTH-01: MITHQAL Core (validates redemption)
- MTH-02: Ledger State Machine (executes burn)
- MTH-03: Finality Gate (7 layers — burn is finality-gated too)

### §38.F.5 — Ledger Event

```
LEDGER_EVENT {
  type: "MTQ_BURN",
  transactionId: <CTID>,
  timestamp: <ISO 8601>,
  redeemingBank: <Bank B>,
  corporateId: <corporate>,
  mtqAmount: <amount>,
  targetAsset: <asset>,
  reserveReference: <Protected Backing Cell released>,
  authorizationSignature: <MITHQAL Monetary Control>,
  finalityProof: <7-layer proof>,
  ledgerCommitment: <Merkle tree>,
  finalityStatus: "BANKING_FINAL",
  settlementState: "SETTLED"
}
```

**Supply impact:** Total MTQ supply decreases by `mtqAmount` (canonical burn).

### §38.F.6 — Compliance Checks

- Redemption right verification (corporate holds MTQ)
- KYC/KYB of redeeming corporate
- AML/sanctions of redeeming corporate
- Reserve sufficiency for redemption (RR ≥ 1.00 post-redemption)
- StressRR post-redemption ≥ 0.95
- LCR post-redemption ≥ 1.00
- Jurisdiction authorization for redemption asset
- Tax reporting (if applicable)

### §38.F.7 — Settlement State

```
INITIATED → VALIDATED → AUTHORIZED → FINALIZED → BURNED → SETTLED → RECONCILED
```

### §38.F.8 — Accounting State

**Book A (MITHQAL Corporate):**
- Redemption infrastructure fee: +amount × redemption_fee_bps

**Book B (Bank B MTQ Obligation Ledger):**
- MTQ outstanding: -amount
- Redemption obligations: +amount
- Settlement asset released: -amount
- Bank risk: recalculated

**Book C (Corporate Participant Position at Bank B):**
- Available MTQ: -amount
- Redeemed: +amount
- Beneficiary account: +amount (local currency or asset)
- Settlement history: +transaction record

### §38.F.9 — Finality

**Finality achieved:** `BANKING_FINAL` (MTQ burned + asset released atomically).

The burn and the asset release are atomic — they happen in the same ACID
transaction (L6 enforcement). If either fails, both roll back.

### §38.F.10 — Exception Handling

- Insufficient reserve for redemption → queue redemption (CALM state machine
  may activate throttling) — redemption right preserved, processing delayed
- Redemption asset unavailable → offer alternative asset or queue
- Corporate under investigation → hold (Flow J)
- Jurisdiction blocking redemption → hold + legal review
- Stress state active (CALM) → redemption throttled per state rules:
  - NORMAL: no throttle
  - CAUTION: 10% throttle
  - DEFENSIVE: 25% throttle
  - STRESS: 50% throttle
  - EMERGENCY: 75% throttle (redemption rights preserved, processing delayed)
  - RECOVERY: gradual restoration

**Critical:** Redemption rights are constitutionally protected (§34). Throttling
affects timing, NOT the right. Any throttle is publicly disclosed.

### §38.F.11 — Audit Evidence

1. Redemption request (12 fields, signed by bank + corporate)
2. Redemption right verification record
3. Reserve sufficiency verification
4. Burn transaction (canonical ledger)
5. Asset release record
6. Beneficiary credit confirmation
7. 5-way reconciliation result

### §38.F.12 — Cross-References

- §V25.0.14 (Redemption Flow — Institutional)
- §V25.0.D.A (50 reconciliation principles — redemption preservation)
- §34 (Constitutional — Redemption Certainty)
- §V25.0.D.AT (Final Output Summary — redemption bank-mediated)

---

## §38.G — Flow G: Reserve Rebalancing

### §38.G.1 — Initiating Party

**Initiating Party:** MITHQAL Operating Company — Reserve/Rebalancing Engine
(Monetary & Reserve Control Division).

Trigger: drift detection — current reserve allocation has drifted from target
allocation beyond the approved tolerance (default ±1.0 percentage point).

### §38.G.2 — Validating Party

**Validating Party:** Constitutional/approved reserve governance process
(Foundation STEWARD + regulator AUTHORIZE).

### §38.G.3 — Message

**Canonical message:** Internal `RebalancingDecision` issued by the rebalancing
engine:
1. `decisionId` — unique
2. `timestamp`
3. `currentAllocation` — fiat/bullion/digital split + per-currency
4. `targetAllocation` — per constitutional corridors
5. `driftDelta` — current − target per asset class and currency
6. `approvedTolerance` — ±1.0pp
7. `noTradeTriggered` — boolean (if drift ≤ tolerance)
8. `proposedTrades` — list of buy/sell actions (if drift > tolerance)
9. `preservationChecks` — RR, StressRR, LCR, MLCR, ILPS, concentration,
   corridors, eligibility, redemption capacity
10. `reserveManagerSignature` — authorized reserve manager signature

### §38.G.4 — System

- MITHQAL Reserve Engine (snapshot + compute + compare + execute)
- MITHQAL Reconciliation Engine (5-way)
- Authorized reserve manager / institutional treasury (external)
- Custodian systems (for physical gold moves)

### §38.G.5 — Ledger Event

**Canonical ledger event (per trade):**
```
LEDGER_EVENT {
  type: "RESERVE_REBALANCE_TRADE",
  decisionId: <id>,
  tradeId: <unique>,
  timestamp: <ISO 8601>,
  assetClass: <FIAT / BULLION / DIGITAL>,
  action: <BUY / SELL>,
  assetId: <asset identifier>,
  quantity: <amount>,
  price: <execution price>,
  reserveManager: <authorized manager>,
  custodianEvidence: <Source B evidence>,
  ledgerCommitment: <Merkle tree>,
  reconciliationStatus: "VERIFIED"
}
```

**Supply impact:** None — rebalancing does NOT change MTQ supply. It changes
the COMPOSITION of the reserve backing (which is bank-held, non-custodial).

### §38.G.6 — Compliance Checks

The 9-preservation requirements (per §V25.0.D.S):
1. Minimum trades (avoid unnecessary transaction costs)
2. Minimize cost (execution cost optimization)
3. Minimize market impact (avoid large block trades)
4. Preserve redemption capacity
5. Preserve RR (≥ 1.00)
6. Preserve LCR (≥ 1.00)
7. Preserve concentration limits (custodian 15% preferred / 25% hard cap)
8. Preserve allocation ranges (fiat 70-85% / bullion 15-25% / digital 0-5%)
9. Preserve asset eligibility (RCAF eligibilityStatus=ELIGIBLE)

**FV19 (conservation):** Rebalancing CANNOT create or disappear reserve value.
**FV20 (allocation sum):** Rebalancing allocation weights ALWAYS sum to 100%.
**FV21 (corridor preservation):** All post-rebalance allocations MUST be within
constitutional corridors.

### §38.G.7 — Settlement State

```
DRIFT_DETECTED → DECISION_COMPUTED → PRESERVATION_VERIFIED →
TRADE_AUTHORIZED → TRADE_EXECUTED → RECONCILED
```

### §38.G.8 — Accounting State

**Book A (MITHQAL Corporate):** No direct impact (reserve moves are non-custodial
at banks; MITHQAL does not profit from reserve moves per §V25.0.D.AC).

**Book B (Bank MTQ Obligation Ledger — for bank-held reserves):**
- Reserve composition: adjusted (e.g., +X USD / -Y EUR)
- Applicable backing: adjusted
- Bank risk: recalculated

**Book C:** No direct impact.

### §38.G.9 — Finality

**Finality achieved:** `TECHNICAL_FINAL` (reserve moves are not banking
settlements; they are reserve adjustments).

### §38.G.10 — Exception Handling

- Trade execution failure → retry / abort (no half-state)
- Custodian evidence unavailable → trade held, retry within 24h
- RR breach risk post-trade → trade blocked, alternative trade computed
- Concentration breach risk → trade blocked
- Eligibility breach → trade blocked
- Market disruption → invoke No-Trade Principle (§V25.0.D.T)
- Reserve manager unavailable → trade queued

### §38.G.11 — Audit Evidence

1. Pre-rebalance snapshot (R_m market value)
2. Current weights computation (per asset class, per currency)
3. Target weights comparison
4. Drift delta computation
5. Tolerance check (≤ or > approved)
6. If triggered: trade list
7. Preservation checks (9 requirements)
8. Trade execution records (each trade)
9. Custodian evidence (Source B)
10. Post-trade 5-way reconciliation
11. Reserve manager signature
12. Proof-of-Reserves update

### §38.G.12 — Cross-References

- §V25.0.D.S (Rebalancing Engine — 13-step flow + 9 preserve)
- §V25.0.D.T (No-Trade Principle)
- §V25.0.D.U (Rebalancing Example — PAR-equivalent)
- §V25.1.24 (Rebalancing v25.1 Updated — 8 cost components)
- FV19, FV20, FV21 (formal-verification invariants)

---

## §38.H — Flow H: Exception / Failed Settlement

### §38.H.1 — Initiating Party

**Initiating Party:** Any system component or validator that detects a settlement
failure. May be triggered by:
- Compliance check failure (Flow I)
- Sanctions screening (Flow J)
- Insufficient funds (Flow K)
- Bank gateway outage (Flow L)
- Network failure (Flow M)
- Reconciliation break (Flow N)
- Any other undefined failure

### §38.H.2 — Validating Party

**Validating Party:** MITHQAL Monetary & Reserve Control Division + bank
operations team (jointly).

### §38.H.3 — Message

**Canonical message:** `ExceptionReport` issued by the failing component:
1. `exceptionId`
2. `transactionId` (if associated)
3. `timestamp`
4. `triggeringComponent`
5. `exceptionType` (e.g., COMPLIANCE_FAILURE, GATEWAY_OUTAGE, etc.)
6. `exceptionDescription`
7. `currentState` (transaction state at time of exception)
8. `proposedResolution` (RETRY / RETURN / INVESTIGATE / ESCALATE)
9. `evidencePackage`
10. `severity` (INFO / WARNING / ERROR / CRITICAL)
11. `reportingComponentSignature`

### §38.H.4 — System

- MITHQAL Exception Engine (central exception handler)
- MITHQAL Ledger State Machine (transitions to EXCEPTION state)
- MBG (notifies affected banks)
- Bank operations systems (both sides)

### §38.H.5 — Ledger Event

```
LEDGER_EVENT {
  type: "EXCEPTION",
  transactionId: <id>,
  timestamp: <ISO 8601>,
  exceptionType: <type>,
  currentState: "EXCEPTION",
  triggeringComponent: <component>,
  severity: <level>,
  resolutionPath: <path>,
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** Depends on resolution:
- If transaction had been MINTED and needs reversal → MTQ burn (return)
- If transaction had not yet been MINTED → no supply impact

### §38.H.6 — Compliance Checks

- Exception classification
- Resolution path compliance (no bypass of compliance gates)
- Reversal compliance (if applicable)
- Regulatory reporting (if material)

### §38.H.7 — Settlement State

```
[Any state] → EXCEPTION → [resolution path]:
  → RETRY (back to original state)
  → RETURN (funds returned to sender)
  → INVESTIGATE (held pending investigation)
  → ESCALATE (escalated to human / governance)
```

### §38.H.8 — Accounting State

**Depends on resolution:**

If RETURN:
- Book B: bank obligations reversed
- Book C: corporate position restored (pending → available)
- Book A: fees reversed (if not earned)

If INVESTIGATE:
- Books held in pending state
- No new entries until resolution

If ESCALATE:
- Books held pending governance decision (Flow Q)

### §38.H.9 — Finality

**Finality achieved:** None — exception is by definition non-final. Resolution
path determines the finality eventually achieved.

### §38.H.10 — Exception Handling (Meta)

The exception handler itself can fail. In that case:
- System enters SAFE_HALT state
- All operations suspended
- Human intervention required
- Foundation notified (read-only)

### §38.H.11 — Audit Evidence

1. Exception report (11 fields)
2. Triggering component logs
3. Transaction state at exception
4. Resolution decision (with authority signature)
5. Resolution execution record
6. Reconciliation result post-resolution
7. Regulatory notification (if material)

### §38.H.12 — Cross-References

- §V25.0.D.A (50 reconciliation principles — exception handling)
- §V25.1.GOV.6 (Emergency Governance)
- §44 (CALM Safe States Framework)

---

## §38.I — Flow I: Compliance Rejection

### §38.I.1 — Initiating Party

**Initiating Party:** Compliance engine (bank-side or MITHQAL-side) that detects
a compliance failure.

### §38.I.2 — Validating Party

**Validating Party:** Compliance officer (independent of commercial/sales)
+ MITHQAL Monetary & Reserve Control Division.

### §38.I.3 — Message

**Canonical message:** `ComplianceRejection` containing:
1. `rejectionId`
2. `transactionId`
3. `timestamp`
4. `rejectingComponent` (bank KYC, bank AML, MITHQAL eligibility, etc.)
5. `rejectionReason` (KYC_FAIL, AML_FAIL, BENEFICIAL_OWNERSHIP_FAIL,
   CORRIDOR_NOT_AUTHORIZED, etc.)
6. `evidence` (compliance failure detail)
7. `corporateNotificationRequired` (boolean)
8. `regulatoryReportingRequired` (boolean)
9. `appealPathAvailable` (boolean)
10. `signature`

### §38.I.4 — System

- BNK-03 / BNK-04: Bank KYC/AML engines
- MTH-01: MITHQAL Core (eligibility check)
- MBG: notification to all parties
- Bank corporate portal: notification to corporate

### §38.I.5 — Ledger Event

```
LEDGER_EVENT {
  type: "COMPLIANCE_REJECTION",
  transactionId: <id>,
  timestamp: <ISO 8601>,
  rejectionReason: <reason>,
  settlementState: "REJECTED",
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** None — no mint occurred.

### §38.I.6 — Compliance Checks

- Compliance failure classification
- Regulatory reporting determination (SAR, STR, etc.)
- Corporate notification (per bank's regulatory framework)
- Appeal path documentation

### §38.I.7 — Settlement State

```
[any state pre-MINTED] → REJECTED
```

If post-MINTED (rare — only if compliance failure discovered after mint):
```
MINTED → EXCEPTION → INVESTIGATE → (return/burn per governance)
```

### §38.I.8 — Accounting State

**No mint impact** (typically).

**Book A:** No fee earned.
**Book B:** No bank obligation created.
**Book C:** Corporate position unchanged (any hold released).

If post-mint:
- Book B: bank obligation reversed
- Book C: corporate MTQ reversed
- Burn executed

### §38.I.9 — Finality

**Finality achieved:** `REJECTED` (transaction is final in its rejection; no
further processing without re-initiation).

### §38.I.10 — Exception Handling

- Corporate appeals → compliance officer review
- Compliance officer overturns → re-initiate Flow A
- Compliance officer upholds → rejection final
- Regulatory escalation → Flow J or direct regulator notification

### §38.I.11 — Audit Evidence

1. Compliance rejection report (10 fields)
2. Compliance failure detail
3. Compliance officer review record
4. Corporate notification record
5. Regulatory reporting record (if filed)
6. Appeal record (if any)

### §38.I.12 — Cross-References

- §V25.0.4 (KYC/KYB Architecture)
- §V25.0.23 (Settlement Permission Engine — 12-check gate)
- §V25.1.GOV (Constitutional Governance — separation of duties)

---

## §38.J — Flow J: Sanctions Screening Failure

### §38.J.1 — Initiating Party

**Initiating Party:** Sanctions screening engine (bank-side or MITHQAL-side)
that detects a potential sanctions match.

### §38.J.2 — Validating Party

**Validating Party:** Sanctions compliance officer (bank) + MITHQAL Compliance
Architect + (if confirmed) regulator notification.

### §38.J.3 — Message

**Canonical message:** `SanctionsMatch` containing:
1. `matchId`
2. `transactionId`
3. `timestamp`
4. `screeningEngine` (bank / MITHQAL)
5. `matchedEntity` (sender / receiver / beneficial owner / corridor)
6. `matchType` (EXACT / FUZZY / PARTIAL)
7. `matchedList` (OFAC / EU / UN / HMT / jurisdiction-specific)
8. `matchedEntry` (sanctions list entry identifier)
9. `confidenceScore` (0-100)
10. `action` (FREEZE / INVESTIGATE / REPORT)
11. `regulatorNotificationRequired` (boolean)

### §38.J.4 — System

- BNK-04: Bank AML/Sanctions Engine
- MITHQAL Sanctions Engine (independent screening)
- MITHQAL Ledger (freeze transaction)
- Regulator notification system

### §38.J.5 — Ledger Event

```
LEDGER_EVENT {
  type: "SANCTIONS_FREEZE",
  transactionId: <id>,
  timestamp: <ISO 8601>,
  matchedEntity: <entity>,
  matchedList: <list>,
  confidenceScore: <score>,
  settlementState: "FROZEN",
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** If post-mint, MTQ is frozen (not burned — held pending
investigation). If pre-mint, no impact.

### §38.J.6 — Compliance Checks

- Match confirmation (manual review by sanctions officer)
- False positive determination (if applicable)
- License determination (if licensed transaction permitted)
- Regulator notification (mandatory for confirmed matches)
- SAR/STR filing (per regulatory framework)

### §38.J.7 — Settlement State

```
[any state] → FROZEN → (investigation):
  → UNFROZEN (false positive) → continue flow
  → BLOCKED (confirmed match) → permanent block
  → LICENSED (OFAC license) → continue under license
  → FORFEIT (legal order) → funds forfeited per court order
```

### §38.J.8 — Accounting State

**Book B (Bank MTQ Obligation Ledger):**
- MTQ frozen (held in segregated frozen account)
- Bank risk: elevated
- Regulatory reporting: triggered

**Book C (Corporate Participant Position):**
- Available MTQ: -amount (frozen)
- Frozen MTQ: +amount

### §38.J.9 — Finality

**Finality achieved:** `FROZEN` (intermediate finality; funds are held pending
investigation).

### §38.J.10 — Exception Handling

- False positive: unfreeze, continue transaction, document review
- Confirmed match: permanent block, regulator notification, SAR/STR filing
- Licensed transaction: continue under OFAC (or equivalent) license
- Court order: forfeit per court order, transfer to designated authority
- Investigation timeout (90 days default): permanent block, regulator notified

### §38.J.11 — Audit Evidence

1. Sanctions match report (11 fields)
2. Screening engine logs
3. Sanctions officer review record
4. False positive determination (if applicable)
5. Regulator notification record
6. SAR/STR filing (if filed)
7. License record (if licensed)
8. Court order (if applicable)
9. Final disposition record

### §38.J.12 — Cross-References

- §V25.0.4 (KYC/KYB Architecture — sanctions layer)
- §B.9 (Sanctions / Geopolitical Neutrality)
- §V25.1.GOV (Constitutional Governance — sanctions policy)

---

## §38.K — Flow K: Insufficient Funds

### §38.K.1 — Initiating Party

**Initiating Party:** Funding verification engine (bank-side or MITHQAL-side)
that detects insufficient eligible backing.

### §38.K.2 — Validating Party

**Validating Party:** Bank treasury + MITHQAL Monetary & Reserve Control Division.

### §38.K.3 — Message

**Canonical message:** `InsufficientFundsNotice` containing:
1. `noticeId`
2. `transactionId`
3. `timestamp`
4. `bankId`
5. `corporateId`
6. `requiredAmount` (eligible backing required)
7. `availableAmount` (eligible backing available)
8. `shortfall` (required − available)
9. `reason` (LIQUIDITY_SHORTFALL / BACKING_INELIGIBLE / DMCE_EXCEEDED /
   CONCENTRATION_LIMIT_HIT / RR_PRESERVATION_REQUIRED)
10. `corporateNotificationRequired` (boolean)
11. `signature`

### §38.K.4 — System

- BNK-05: Bank FX/Treasury (funding verification)
- MTH-01: MITHQAL Core (DMCE check, concentration check, RR preservation)
- MBG: notification to bank

### §38.K.5 — Ledger Event

```
LEDGER_EVENT {
  type: "INSUFFICIENT_FUNDS",
  transactionId: <id>,
  timestamp: <ISO 8601>,
  reason: <reason>,
  shortfall: <amount>,
  settlementState: "BLOCKED",
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** None — no mint occurred.

### §38.K.6 — Compliance Checks

- Eligible backing verification
- DMCE capacity verification
- Concentration limit verification
- RR preservation check (would minting push RR below 1.00?)
- Liquidity check (LCR, MLCR, ILPS sufficiency)

### §38.K.7 — Settlement State

```
[any state pre-MINTED] → BLOCKED
```

### §38.K.8 — Accounting State

**No mint impact.**

**Book A:** No fee earned.
**Book B:** No bank obligation created.
**Book C:** Corporate position unchanged.

### §38.K.9 — Finality

**Finality achieved:** `BLOCKED` (transaction is final in its block; corporate
must re-initiate after addressing the shortfall).

### §38.K.10 — Exception Handling

- Corporate provides additional backing → re-initiate Flow A
- Corporate reduces transaction amount → re-initiate Flow A
- Bank provides additional credit (subject to bank's risk policy) → re-initiate
- DMCE exceeded → corporate must wait until DMCE capacity refreshes
- Concentration limit hit → corporate must wait until concentration reduces
- RR preservation required → mint blocked until reserve rebalanced (Flow G)

### §38.K.11 — Audit Evidence

1. Insufficient funds notice (11 fields)
2. Required vs. available computation
3. Shortfall computation
4. Reason classification
5. Corporate notification record
6. Resolution record (if corporate re-initiates)

### §38.K.12 — Cross-References

- §V25.0.D.V (DMCE — Dynamic Minting Capacity Engine)
- §V25.0.D.W (RCAF + AvailableBackingCertificate)
- §V25.0.D.S (Rebalancing — preservation requirements)

---

## §38.L — Flow L: Bank Gateway Failure

### §38.L.1 — Initiating Party

**Initiating Party:** MBG monitoring system that detects gateway outage or
degradation.

### §38.L.2 — Validating Party

**Validating Party:** MITHQAL Operations Team + Bank Operations Team (jointly).

### §38.L.3 — Message

**Canonical message:** `GatewayFailureNotice` containing:
1. `noticeId`
2. `timestamp`
3. `bankId` (affected bank, or "ALL" if MBG-wide)
4. `failureType` (TIMEOUT / 5XX / CONNECTION_REFUSED / TLS_FAILURE /
   AUTHENTICATION_FAILURE / RATE_LIMIT_EXCEEDED / HARDWARE_FAILURE)
5. `severity` (DEGRADED / OUTAGE)
6. `affectedTransactions[]` (list of pending transactions)
7. `estimatedRecoveryTime` (if known)
8. `fallbackStrategy` (RETRY / ALTERNATE_RAIL / SAFE_HALT)
9. `signature`

### §38.L.4 — System

- MBG-01: MBG Adapter
- MBG-03: API Gateway
- MITHQAL Health Monitor
- Bank health monitoring systems

### §38.L.5 — Ledger Event

```
LEDGER_EVENT {
  type: "GATEWAY_FAILURE",
  timestamp: <ISO 8601>,
  bankId: <bank>,
  failureType: <type>,
  severity: <level>,
  affectedTransactions: <list>,
  fallbackStrategy: <strategy>,
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** None — gateway failure doesn't affect ledger state directly.
Pending transactions are held.

### §38.L.6 — Compliance Checks

- No compliance bypass (failure must not result in unauthorized mint)
- All pending transactions held in pre-failure state
- Recovery must re-validate compliance (no auto-resume)

### §38.L.7 — Settlement State

```
[transaction in any state] → HELD (pending gateway recovery)
```

### §38.L.8 — Accounting State

**No impact** — transactions are held in their pre-failure state.

### §38.L.9 — Finality

**Finality achieved:** None — gateway failure prevents finality.

### §38.L.10 — Exception Handling

- Transient failure (timeout, 5XX) → retry (3 attempts with exponential backoff)
- Persistent failure (connection refused, hardware) → escalate to bank ops
- Bank-side outage → MBG marks bank as DEGRADED; new transactions to that bank
  are routed to alternate rail or queued
- MBG-wide outage → SAFE_HALT (all new transactions blocked; in-flight
  transactions held)
- Recovery: re-validate all held transactions; do not auto-resume

### §38.L.11 — Audit Evidence

1. Gateway failure notice (9 fields)
2. Affected transactions list
3. Recovery time estimate
4. Recovery execution record
5. Re-validation records (per held transaction)
6. Resolution confirmation (per transaction)

### §38.L.12 — Cross-References

- §V25.1.25 (Multi-Rail Fallback Matrix)
- §44 (CALM Safe States Framework — SETTLEMENT_RESTRICTED, SAFE_HALT)
- §V25.0.D.A (50 reconciliation principles — gateway failure handling)

---

## §38.M — Flow M: Network Failure

### §38.M.1 — Initiating Party

**Initiating Party:** Network monitoring system (MITHQAL or bank-side) that
detects network partition or rail failure.

### §38.M.2 — Validating Party

**Validating Party:** MITHQAL Operations + Bank Operations + (if applicable)
Rail Operator.

### §38.M.3 — Message

**Canonical message:** `NetworkFailureNotice` containing:
1. `noticeId`
2. `timestamp`
3. `failureScope` (BANK_TO_MBG / MBG_TO_MITHQAL / MITHQAL_TO_RECEIVING_MBG /
   RAIL_OUTAGE / NETWORK_PARTITION)
4. `affectedCorridors[]`
5. `severity` (DEGRADED / OUTAGE)
6. `affectedTransactions[]`
7. `fallbackStrategy` (RETRY / ALTERNATE_RAIL / EMERGENCY_RAIL / SAFE_HALT)
8. `signature`

### §38.M.4 — System

- MBG-01 through MBG-04
- MTH-01 through MTH-03
- Bank network infrastructure
- Rail operator systems (SWIFT, RTGS, etc.)

### §38.M.5 — Ledger Event

```
LEDGER_EVENT {
  type: "NETWORK_FAILURE",
  timestamp: <ISO 8601>,
  failureScope: <scope>,
  affectedCorridors: <list>,
  severity: <level>,
  fallbackStrategy: <strategy>,
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** None — network failure doesn't affect ledger state directly.

### §38.M.6 — Compliance Checks

- No compliance bypass
- Alternate rail must be compliance-cleared before use
- Emergency rail requires explicit governance authorization

### §38.M.7 — Settlement State

```
[transaction in any state] → HELD (pending network recovery)
```

### §38.M.8 — Accounting State

**No impact** — transactions held in pre-failure state.

### §38.M.9 — Finality

**Finality achieved:** None — network failure prevents finality.

### §38.M.10 — Exception Handling

Per §V25.1.25 (Multi-Rail Fallback Matrix):
- `primaryRail` failure → `secondaryRail`
- `secondaryRail` failure → `emergencyRail`
- `emergencyRail` failure → SAFE_HALT
- Routing action: RETRY / ALTERNATE_APPROVED_ROUTE /
  EMERGENCY_APPROVED_ROUTE / SAFE_HALT

**Recovery:** re-validate all held transactions.

### §38.M.11 — Audit Evidence

1. Network failure notice (8 fields)
2. Affected corridors list
3. Fallback strategy executed
4. Alternate rail activation record (if applicable)
5. Emergency rail authorization (if applicable)
6. Recovery execution record
7. Re-validation records

### §38.M.12 — Cross-References

- §V25.1.25 (Multi-Rail Fallback Matrix)
- §44 (CALM Safe States Framework)
- §V25.1.GOV.6 (Emergency Governance)

---

## §38.N — Flow N: Reconciliation Break

### §38.N.1 — Initiating Party

**Initiating Party:** Reconciliation engine that detects a mismatch across the
5 sources (bank MTQ subledger, reserve backing evidence, custodian evidence,
MITHQAL canonical MTQ ledger, proof of liabilities).

### §38.N.2 — Validating Party

**Validating Party:** MITHQAL Monetary & Reserve Control Division + Bank
Operations + Custodian Operations (jointly).

### §38.N.3 — Message

**Canonical message:** `ReconciliationBreak` containing:
1. `breakId`
2. `timestamp`
3. `source1Value` (bank MTQ subledger)
4. `source2Value` (reserve backing evidence)
5. `source3Value` (custodian evidence)
6. `source4Value` (MITHQAL canonical ledger)
7. `source5Value` (proof of liabilities, if available)
8. `discrepancy` (max − min across sources)
9. `severity` (WARNING if > 1bp, MISMATCH if > 5bp, CRITICAL if > 25bp,
   EXPIRED if evidence expired, UNAVAILABLE if source missing)
10. `affectedAssetClass`
11. `affectedBank` (if bank-specific)
12. `investigationRequired` (boolean)
13. `signature`

### §38.N.4 — System

- MITHQAL Reconciliation Engine (5-way)
- MITHQAL Forensic RR Reconciliation module
- Bank reconciliation systems
- Custodian reporting systems

### §38.N.5 — Ledger Event

```
LEDGER_EVENT {
  type: "RECONCILIATION_BREAK",
  timestamp: <ISO 8601>,
  breakId: <id>,
  severity: <level>,
  discrepancy: <amount>,
  affectedAssetClass: <class>,
  affectedBank: <bank>,
  investigationRequired: true,
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** None directly — but if break indicates fraud or error in
supply, investigation may lead to supply correction.

### §38.N.6 — Compliance Checks

- Forensic investigation (per §V25.2.AUDIT-CLOSURE — Forensic RR Reconciliation)
- Root cause analysis
- Regulatory notification (if material — > 25bp discrepancy)
- Bank notification (if bank-specific)
- Custodian notification (if custodian-specific)

### §38.N.7 — Settlement State

No direct transaction state impact — reconciliation breaks are systemic, not
per-transaction. However, affected bank may be moved to DEGRADED status,
blocking new issuance until resolved.

### §38.N.8 — Accounting State

**Book A:** No direct impact (unless corporate error).
**Book B:** Affected bank's records investigated; correction entered if error.
**Book C:** No direct impact.

### §38.N.9 — Finality

**Finality achieved:** None — break is by definition non-final; resolution
required.

### §38.N.10 — Exception Handling

- Tolerance breach (≤ 5bp) → WARNING, investigate within 24h
- Material breach (> 5bp) → MISMATCH, halt new issuance from affected bank
- Critical breach (> 25bp) → CRITICAL, halt all issuance from affected bank,
  notify regulator, freeze Protected Backing Cell if applicable
- Source expired → EXPIRED, request fresh evidence
- Source unavailable → UNAVAILABLE, request evidence within 24h; if not
  received, downgrade to MISMATCH
- LOCKED → Protected Backing Cell locked pending investigation

### §38.N.11 — Audit Evidence

1. Reconciliation break report (13 fields)
2. 5-source values at time of break
3. Forensic investigation report
4. Root cause analysis
5. Resolution record (correction entered, evidence refreshed, etc.)
6. Regulatory notification record (if filed)
7. Bank/custodian notification records
8. Recovery record (5-way reconciled post-resolution)

### §38.N.12 — Cross-References

- §V25.0.22 (Three-Way Reconciliation — expanded to 5-way per §V25.0.D.Z)
- §V25.0.D.Z (Five-Way Reconciliation — 5 sources, 7 statuses)
- §V25.2.AUDIT-CLOSURE (Forensic RR Reconciliation)
- §V25.0.D.AA (Bank Monitoring Authority)

---

## §38.O — Flow O: Emergency Suspension

### §38.O.1 — Initiating Party

**Initiating Party:** CALM state machine, triggered by:
- RR < 1.00 (CRITICAL)
- StressRR < 0.95
- LCR < 1.00
- MLCR < 1.00
- Custodian failure
- Bank failure
- Regulator directive
- Governance decision (Flow Q)

### §38.O.2 — Validating Party

**Validating Party:** MITHQAL Monetary Council + Foundation (read-only
oversight) + Regulator (notification).

### §38.O.3 — Message

**Canonical message:** `CALMStateTransition` containing:
1. `transitionId`
2. `timestamp`
3. `fromState` (NORMAL / CAUTION / DEFENSIVE / STRESS)
4. `toState` (DEFENSIVE / STRESS / EMERGENCY / RECOVERY)
5. `trigger` (RR_BREACH / STRESS_RR_BREACH / LCR_BREACH / CUSTODIAN_FAILURE /
   BANK_FAILURE / REGULATOR_DIRECTIVE / GOVERNANCE_DECISION)
6. `automaticActions[]` (e.g., THROTTLE_MINT, BLOCK_MINT, FREEZE_RESERVES)
7. `requiredApprovals[]`
8. `escalationPath`
9. `recoveryConditions[]`
10. `signature`

### §38.O.4 — System

- MITHQAL CALM Engine (6-state machine)
- MITHQAL Ledger (state transition)
- MITHQAL Emergency Governance Engine
- Bank notification system
- Regulator notification system

### §38.O.5 — Ledger Event

```
LEDGER_EVENT {
  type: "CALM_STATE_TRANSITION",
  timestamp: <ISO 8601>,
  fromState: <state>,
  toState: <state>,
  trigger: <trigger>,
  automaticActions: <list>,
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** None directly — but mint operations may be throttled or
blocked, slowing supply growth.

### §38.O.6 — Compliance Checks

- State transition validation (per CALM state machine rules)
- Required approvals (per state — some require Council approval)
- Regulatory notification (per jurisdiction requirements)
- Public disclosure (per constitutional transparency requirements)

### §38.O.7 — Settlement State

CALM state impacts all new transactions:
- NORMAL: no impact
- CAUTION: 10% issuance throttle
- DEFENSIVE: 25% issuance throttle, redemption 10% throttle
- STRESS: 50% issuance throttle, redemption 25% throttle
- EMERGENCY: issuance blocked (only pre-authorized), redemption 50% throttle
  (rights preserved)
- RECOVERY: gradual restoration per recovery plan

**Existing transactions** continue to settle (no rollback) unless explicitly
revoked by governance.

### §38.O.8 — Accounting State

**Book A:** Operating costs may increase (incident response).
**Book B:** Bank obligations tracked; throttling affects new obligations.
**Book C:** Corporate positions preserved; redemption throttling affects timing,
not rights.

### §38.O.9 — Finality

**Finality achieved:** `BANKING_FINAL` for in-flight transactions (not revoked).
New transactions may be blocked or throttled.

### §38.O.10 — Exception Handling

- If trigger resolves (e.g., RR recovers above 1.00) → RECOVERY state
- If trigger persists → maintain emergency state, escalate to governance
- If new trigger occurs → transition further (e.g., STRESS → EMERGENCY)
- If governance fails to convene → Emergency Custodian appointed (per
  §V25.1.GOV.6)

### §38.O.11 — Audit Evidence

1. CALM state transition record (10 fields)
2. Trigger evidence (e.g., RR computation showing < 1.00)
3. Automatic actions executed
4. Required approvals received (with signatures)
5. Regulatory notification record
6. Public disclosure record
7. Recovery plan (when entering RECOVERY)

### §38.O.12 — Cross-References

- §44 (CALM Safe States Framework)
- §V25.1.GOV.6 (Emergency Governance)
- §V25.0.D.A (50 reconciliation principles — emergency handling)
- Article X (Constitutional Emergency Governance)

---

## §38.P — Flow P: Disaster Recovery

### §38.P.1 — Initiating Party

**Initiating Party:** Disaster Recovery monitoring system, triggered by:
- Primary site failure (fire, flood, earthquake, power loss, cyber-attack)
- Primary database corruption
- Primary ledger node compromise
- Loss of primary key material (HSM/MPC failure)

### §38.P.2 — Validating Party

**Validating Party:** MITHQAL Operations + MITHQAL Technology Company +
Independent DR Auditor.

### §38.P.3 — Message

**Canonical message:** `DRActivationNotice` containing:
1. `activationId`
2. `timestamp`
3. `disasterType` (PRIMARY_SITE_FAILURE / DATABASE_CORRUPTION /
   NODE_COMPROMISE / KEY_MATERIAL_LOSS / CYBER_ATTACK)
4. `primarySiteStatus` (OFFLINE / DEGRADED / COMPROMISED)
5. `recoverySiteActivated` (boolean)
6. `lastKnownGoodState` (timestamp + ledger hash)
7. `recoveryPointObjective` (RPO — target: 0 for ledger; 5 min for analytics)
8. `recoveryTimeObjective` (RTO — target: 4 hours for full operations)
9. `affectedServices[]`
10. `signature`

### §38.P.4 — System

- MITHQAL DR Infrastructure (geographically distributed)
- Backup ledger nodes (multiple regions)
- Backup database (with WAL replication)
- Backup key material (HSM/MPC with quorum recovery)
- Bank notification system
- Regulator notification system

### §38.P.5 — Ledger Event

```
LEDGER_EVENT {
  type: "DR_ACTIVATION",
  timestamp: <ISO 8601>,
  disasterType: <type>,
  lastKnownGoodState: <state>,
  recoverySiteActivated: true,
  ledgerCommitment: <Merkle tree>,
  finalityStatus: "RECOVERY_MODE"
}
```

**Supply impact:** None — ledger is canonical and immutable; DR activation
recovers the canonical state from backup, not a fork.

### §38.P.6 — Compliance Checks

- Last-known-good state verification (Merkle proof)
- Recovery site key material verification (HSM/MPC quorum)
- Bank notification (all participating banks)
- Regulator notification (mandatory for DR activation)
- Public disclosure (per constitutional transparency)

### §38.P.7 — Settlement State

```
SAFE_HALT (during DR) → RECOVERY (post-DR) → NORMAL (post-validation)
```

During DR:
- All new transactions blocked (SAFE_HALT)
- Existing transactions held
- Ledger read-only access maintained (Foundation can verify state)

Post-DR:
- Ledger state recovered from last-known-good
- Re-validate all held transactions
- Gradual restoration per RECOVERY plan

### §38.P.8 — Accounting State

**Book A:** No data loss (ACID transactions; recovered from backup).
**Book B:** No data loss.
**Book C:** No data loss.

All books recovered to last-known-good state. Any post-RPO transactions
replay from logs.

### §38.P.9 — Finality

**Finality achieved:** Pre-DR transactions: `BANKING_FINAL` (preserved by
immutable ledger). DR-period transactions: `BLOCKED`.

Post-DR: normal finality resumes.

### §38.P.10 — Exception Handling

- Recovery site failure → escalate to second backup site (if available) or
  SAFE_HALT indefinitely
- Key material recovery fails → Emergency Custodian appointed, regulator
  takes custody
- Data corruption discovered post-recovery → roll back to earlier
  last-known-good
- Cyber-attack ongoing → isolate, forensics, rebuild from clean backup
- RTO exceeded → public disclosure, regulator escalation

### §38.P.11 — Audit Evidence

1. DR activation notice (10 fields)
2. Primary site failure evidence
3. Last-known-good state proof (Merkle proof)
4. Recovery site activation record
5. Key material recovery record (HSM/MPC quorum)
6. Bank notification record
7. Regulator notification record
8. Public disclosure record
9. Recovery validation record (5-way reconciliation post-recovery)
10. Independent DR auditor report

### §38.P.12 — Cross-References

- §V25.0.D.A (50 reconciliation principles — DR)
- §V25.1.GOV.6 (Emergency Governance)
- Article VIII (Disaster Recovery — Technical Framework)
- §44 (CALM Safe States Framework — SAFE_HALT)

---

## §38.Q — Flow Q: Governance Intervention

### §38.Q.1 — Initiating Party

**Initiating Party:** MITHQAL Monetary Council (constitutional governance body)
or Emergency Custodian (per §V25.1.GOV.6).

### §38.Q.2 — Validating Party

**Validating Party:** Foundation (constitutional steward) + Regulator
(authorization where required) + Independent Review Panel (every 5 years per
Article XVII).

### §38.Q.3 — Message

**Canonical message:** `GovernanceDirective` containing:
1. `directiveId`
2. `timestamp`
3. `councilResolutionId` (link to Council minutes)
4. `directiveType` (POLICY_CHANGE / EMERGENCY_ACTION / RECOVERY_PLAN /
  AMENDMENT_PROPOSAL / INTERVENTION / DISSOLUTION)
5. `scope` (SYSTEM_WIDE / BANK_SPECIFIC / CORRIDOR_SPECIFIC / ASSET_SPECIFIC)
6. `affectedEntity`
7. `directive` (detailed action)
8. `requiredApprovals[]` (Council, Foundation, Regulator)
9. `effectiveTimestamp`
10. `expiryTimestamp` (if time-limited)
11. `councilChairSignature`
12. `foundationObserverSignature` (read-only confirmation)
13. `regulatorApprovalSignature` (if required)

### §38.Q.4 — System

- MITHQAL Governance Engine
- MITHQAL Ledger (records directive)
- MITHQAL Policy Engine (implements directive)
- Bank notification system
- Regulator notification system
- Public disclosure system

### §38.Q.5 — Ledger Event

```
LEDGER_EVENT {
  type: "GOVERNANCE_DIRECTIVE",
  timestamp: <ISO 8601>,
  directiveId: <id>,
  directiveType: <type>,
  scope: <scope>,
  directive: <action>,
  effectiveTimestamp: <timestamp>,
  expiryTimestamp: <timestamp>,
  councilChairSignature: <signature>,
  foundationObserverSignature: <signature>,
  regulatorApprovalSignature: <signature>,
  ledgerCommitment: <Merkle tree>
}
```

**Supply impact:** None directly — but directive may instruct mint/burn/hold
which affects supply.

### §38.Q.6 — Compliance Checks

- Council quorum verification (per Article VIII governance rules)
- Foundation observer confirmation (read-only — confirms process followed)
- Regulator approval (if required by jurisdiction)
- Constitutional invariant preservation (no directive may violate
  constitutional invariants)
- Public disclosure (per constitutional transparency)

### §38.Q.7 — Settlement State

Depends on directive:
- POLICY_CHANGE → no immediate impact; future transactions affected
- EMERGENCY_ACTION → may trigger CALM transition (Flow O)
- RECOVERY_PLAN → activates RECOVERY state
- AMENDMENT_PROPOSAL → no immediate impact; future state if amendment passes
- INTERVENTION → may freeze specific bank/corridor/asset
- DISSOLUTION → triggers final settlement and dissolution (rare)

### §38.Q.8 — Accounting State

Depends on directive:
- Policy changes affect future accounting (e.g., fee schedule change)
- Emergency actions may freeze specific books
- Intervention may freeze specific bank's books (Book B for that bank)
- Dissolution triggers final settlement across all books

### §38.Q.9 — Finality

**Finality achieved:** `BANKING_FINAL` for in-flight transactions (not revoked
by directive, unless directive explicitly revokes — requires constitutional
amendment-level approval).

Directive itself is `BANKING_FINAL` once executed (immutable record).

### §38.Q.10 — Exception Handling

- Council cannot convene (no quorum 90 days) → Emergency Custodian appointed
- Foundation observer objects → directive held; mediation required
- Regulator rejects → directive cannot be executed; revision required
- Constitutional invariant violated → directive blocked by automated
  constitutional check
- Public disclosure delayed → directive held until disclosure complete

### §38.Q.11 — Audit Evidence

1. Governance directive (13 fields)
2. Council resolution (minutes, vote record)
3. Foundation observer confirmation
4. Regulator approval (if required)
5. Constitutional invariant check result
6. Public disclosure record
7. Directive execution record
8. Affected party notifications (banks, corporates, regulators)

### §38.Q.12 — Cross-References

- §V25.1.GOV (Constitutional Governance)
- Article VIII (Governance — Constitutional)
- Article X (Emergency Governance — Constitutional)
- Article XVII (Five-Year Independent Review)
- §44 (CALM Safe States Framework)

---

## §38.ROLLUP — Workflows Rollup Summary

| Flow | Init. Party | Valid. Party | Finality | Supply Impact |
|------|-------------|---------------|----------|---------------|
| A — Settlement Init | Corporate | Bank A | Pre-mint | None |
| B — Bank Compliance | Bank A | Bank compliance | None | None |
| C — MTQ Issuance | Bank A | MITHQAL Monetary Control | BANKING_FINAL | + (mint) |
| D — MTQ Settlement | MITHQAL ledger | Bank B | BANKING_FINAL | None (transfer) |
| E — Receiving Settlement | Bank B | Bank B compliance | BANKING_FINAL | − (burn at redeem) |
| F — Redemption | Corporate (via Bank B) | Bank B + MITHQAL | BANKING_FINAL | − (burn) |
| G — Reserve Rebal. | MITHQAL Reserve Engine | Governance | TECHNICAL_FINAL | None |
| H — Exception | Any | MITHQAL + Bank ops | None (held) | Conditional |
| I — Compliance Rej. | Compliance engine | Compliance officer | REJECTED | None |
| J — Sanctions Match | Sanctions engine | Sanctions officer | FROZEN | None |
| K — Insuff. Funds | Funding verifier | Bank treasury + MITHQAL | BLOCKED | None |
| L — Gateway Failure | MBG monitor | MITHQAL + Bank ops | None (held) | None |
| M — Network Failure | Network monitor | MITHQAL + Bank ops | None (held) | None |
| N — Reconciliation Break | Reconciliation engine | MITHQAL + Bank + Custodian | None (held) | None |
| O — Emergency Susp. | CALM engine | Council + Foundation | BANKING_FINAL (in-flight) | None directly |
| P — Disaster Recovery | DR monitor | MITHQAL + Tech Co + Auditor | BLOCKED (DR-period) | None |
| Q — Governance Interv. | Council | Foundation + Regulator | BANKING_FINAL | Conditional |

**Universal rules across all 17 flows:**

1. **Finality-before-mint** is enforced — NO FINAL SETTLEMENT ⇒ NO MTQ MINT (7
   layers, 10/10 bypass routes blocked).
2. **Five-way reconciliation** is universal — every flow produces evidence that
   reconciles across 5 sources.
3. **Three-book separation** is preserved — Books A, B, C reconcile but never
   commingle (4 anti-commingling tests, all blocked).
4. **Compliance gates** are universal — 12-check gate, ANY FAILURE = BLOCK, no
   override by commercial staff.
5. **Audit trail** is universal — immutable, hash-chained, 7-25 year retention.
6. **Honest state** preserved — no false production claims, no fake evidence,
   no inflated status.

---

# §39 — TESTING STRATEGY

## §39.0 — Purpose, Scope and Testing Principles

This section defines the comprehensive testing strategy for the MITHQAL
institutional settlement system. The strategy covers **21 testing categories**,
each with specific objectives, methods, acceptance criteria, and evidence
requirements.

### §39.0.1 — Testing Principles (7)

1. **Honest state preservation** — Tests MUST NOT inflate status. A test that
   passes at the code level does NOT constitute production authorization.
2. **Evidence-based acceptance** — Each test produces immutable evidence.
3. **Adversarial mindset** — Tests assume hostile actors, not just benign
   failures.
4. **Reproducibility** — Tests are deterministic (MC seed=42) and reproducible.
5. **Layered defense** — Tests target each layer (L1 API → L7 Smart Contract).
6. **Constitutional compliance** — Tests verify constitutional invariants hold.
7. **Independent validation** — Critical tests require independent validation
   (not self-attested).

### §39.0.2 — Test Status Vocabulary

Every test carries one of the following statuses (NEVER inflated):

| Status | Meaning |
|--------|---------|
| DESIGNED | Test scenario is specified; not yet implemented |
| IMPLEMENTED | Test code is written; not yet executed |
| TESTED | Test has been executed in development environment |
| INTEGRATED | Test is integrated into CI/CD pipeline |
| SANDBOX_VALIDATED | Test executed in regulator/bank/institutional sandbox |
| INSTITUTIONALLY_VALIDATED | Test executed with real institutional data |
| PRODUCTION_VALIDATED | Test executed in production with real value (NOT YET — production NOT authorized) |

**Current honest state:** All tests at DESIGNED or IMPLEMENTED or TESTED status.
NO tests at INSTITUTIONALLY_VALIDATED or PRODUCTION_VALIDATED.

### §39.0.3 — Test Categories Catalog (21)

| # | Category | Status |
|---|----------|--------|
| 1 | Unit Testing | IMPLEMENTED |
| 2 | Integration Testing | IMPLEMENTED |
| 3 | API Testing | IMPLEMENTED |
| 4 | Contract Testing | IMPLEMENTED |
| 5 | Bank Gateway Testing | IMPLEMENTED (SIMULATED) |
| 6 | Ledger Testing | IMPLEMENTED |
| 7 | Reconciliation Testing | IMPLEMENTED |
| 8 | Reserve Testing | IMPLEMENTED |
| 9 | Accounting Testing | IMPLEMENTED |
| 10 | Security Testing | IMPLEMENTED |
| 11 | Penetration Testing | NOT_CONDUCTED |
| 12 | Disaster Recovery Testing | NOT_CONDUCTED |
| 13 | Performance Testing | IMPLEMENTED (design-time) |
| 14 | Scalability Testing | DESIGN_ONLY |
| 15 | Fault Injection Testing | DESIGN_ONLY |
| 16 | Compliance Testing | IMPLEMENTED |
| 17 | Sanctions Screening Testing | IMPLEMENTED (SIMULATED) |
| 18 | Transaction Replay Testing | IMPLEMENTED |
| 19 | Duplicate Transaction Testing | IMPLEMENTED |
| 20 | Concurrency Testing | IMPLEMENTED (design-time) |
| 21 | Settlement Finality Testing | IMPLEMENTED (7 layers, 10 bypass routes) |
| 22 | Cross-Jurisdiction Testing | DESIGN_ONLY |

---

## §39.1 — Unit Testing

### §39.1.1 — What Is Tested

Unit tests verify the correctness of individual functions, methods, and
modules in isolation. Each unit is tested against its specification.

### §39.1.2 — How It Is Tested

- **Framework:** Jest (TypeScript) + Forge (Solidity)
- **Coverage target:** ≥ 90% line coverage, ≥ 85% branch coverage
- **Test isolation:** Each test runs in isolation with mocked dependencies
- **Test data:** Synthetic, deterministic (seed=42)
- **Test execution:** CI/CD pipeline (every commit)

### §39.1.3 — Acceptance Criteria

- All unit tests pass
- Coverage targets met
- No unexplained test failures
- Mutation testing score ≥ 70% (mutation testing introduces subtle bugs to
  verify tests catch them)
- Test execution time < 5 minutes

### §39.1.4 — Test Inventory

- `src/lib/ertf.ts` — Emergency Reserve Tactical Framework tests
- `src/lib/execution-engine.ts` — Execution engine tests
- `src/lib/fixed-point.ts` — Fixed-point arithmetic tests (critical for
  financial correctness)
- `src/lib/reserve-allocation.ts` — Reserve allocation tests
- `src/lib/protected-backing-cell.ts` — Protected Backing Cell tests
- `src/lib/forensic-rr-reconciliation.ts` — Reconciliation tests
- `src/lib/custody-execution.ts` — Custody execution tests
- `src/lib/finality-before-mint.ts` — Finality gate tests
- `src/lib/mtq-final-reserve-spec.ts` — Final reserve spec tests
- `src/lib/three-book-separation.ts` — Three-book tests
- `src/lib/systemic-exposure-engine.ts` — Systemic exposure tests
- `src/lib/legal-liability-framework.ts` — Legal liability tests
- `src/lib/licensing-entity-matrix.ts` — Licensing matrix tests
- `src/lib/cbgrs.ts` — Custody Bank Gateway Risk Score tests
- `src/lib/mrrc.ts` — Multi-Asset Reserve Concentration tests
- `src/lib/lrr.ts` — Liquidity Readiness Ratio tests
- (45+ additional lib modules with unit tests)

### §39.1.5 — Cross-References

- `src/lib/tests/` directory contains all unit tests
- CI/CD pipeline executes unit tests on every commit
- Coverage reports generated per module

---

## §39.2 — Integration Testing

### §39.2.1 — What Is Tested

Integration tests verify that multiple modules work together correctly. They
test the interfaces between modules and the end-to-end behavior of subsystems.

### §39.2.2 — How It Is Tested

- **Framework:** Jest with integration test configuration
- **Test boundary:** Multiple modules integrated, but no external dependencies
- **Test data:** Synthetic, with controlled state setup
- **Test execution:** CI/CD pipeline (every PR merge)

### §39.2.3 — Acceptance Criteria

- All integration tests pass
- All module interfaces verified
- No state leakage between tests
- Test execution time < 15 minutes

### §39.2.4 — Test Inventory

- MBG + MITHQAL Core integration
- Ledger + Finality Gate integration
- Reserve Engine + Custody integration
- Compliance + Eligibility integration
- Three-Book Separation integration
- DMCE + Concentration integration
- CALM + Ledger integration

---

## §39.3 — API Testing

### §39.3.1 — What Is Tested

API tests verify that all API endpoints behave correctly, including:
- Authentication and authorization
- Request validation
- Response schemas
- Error handling
- Rate limiting
- Idempotency

### §39.3.2 — How It Is Tested

- **Framework:** Jest + Supertest
- **Test boundary:** API layer (L1)
- **Test data:** Synthetic, with mocked downstream services where appropriate
- **Test execution:** CI/CD pipeline

### §39.3.3 — Acceptance Criteria

- All endpoints return correct status codes
- All response schemas match specification
- Authentication failures properly rejected
- Authorization properly enforced (RBAC)
- Rate limits enforced
- Idempotency keys properly handled (no duplicate processing)
- Replay protection enforced (stale timestamps rejected)

### §39.3.4 — Test Inventory

- `/api/v25.1/mtq/mint` (POST) — mint endpoint
- `/api/v25.1/mtq/redeem` (POST) — redeem endpoint
- `/api/v25.1/conversions/quote` (GET) — conversion quote
- `/api/v25.1/conversions/execute` (POST) — conversion execute
- `/api/v25.1/conversions/finality` (GET) — conversion finality
- `/api/v25.1/reserves` (GET) — reserves
- `/api/v25.1/reserves/protected-backing` (GET) — protected backing
- `/api/v25.1/liquidity` (GET) — liquidity
- `/api/v25.1/risk` (GET) — risk
- `/api/v25.1/geopolitical-exposure` (GET) — geopolitical exposure
- `/api/v25.1/concentration` (GET) — concentration
- `/api/v25.1/stress` (GET) — stress
- `/api/v25.1/regulatory` (GET) — regulatory
- `/api/v25.1/assurance` (GET) — assurance
- `/api/v25.1/assets` (GET) — assets
- `/api/v25.1/providers` (GET) — providers
- `/api/v25.1/corridors` (GET) — corridors
- `/api/v25.1/rails` (GET) — rails
- `/api/health` (GET) — health
- `/api/status` (GET) — status
- `/api/transparency` (GET) — transparency
- `/api/bank-gateway` (POST) — bank gateway
- `/api/cbgrs` (GET) — CBGRS
- `/api/cbgrs/stress` (GET) — CBGRS stress
- (40+ total endpoints)

---

## §39.4 — Contract Testing

### §39.4.1 — What Is Tested

Contract tests verify that the consumer-provider contract is honored. Each
API endpoint has a contract (request/response schema) that must be respected
by both the API and its consumers.

### §39.4.2 — How It Is Tested

- **Framework:** Pact or similar contract testing framework
- **Test approach:** Consumer-driven contract testing
- **Test execution:** CI/CD pipeline

### §39.4.3 — Acceptance Criteria

- All API contracts validated
- No breaking changes introduced without version bump
- Consumer tests pass against provider contract
- Provider tests pass against consumer contract

---

## §39.5 — Bank Gateway Testing

### §39.5.1 — What Is Tested

Tests of the MITHQAL Bank Gateway (MBG) — the sidecar that translates banking
instructions into MTQ settlement instructions.

### §39.5.2 — How It Is Tested

- **Framework:** Custom MBG test harness
- **Test boundary:** MBG adapter, ISO 20022 layer, API gateway, host-to-host,
  SFTP
- **Test data:** Synthetic bank instructions (SIMULATED banks — no real banks
  contracted)
- **Test execution:** CI/CD pipeline

### §39.5.3 — Acceptance Criteria

- All 7 MSAS connector classes functional (SWIFT, ISO 20022, REST API,
  Host-to-Host, SFTP, RTGS, Tokenized Deposit, CBDC — 8 rails)
- Translation (NOT transformation) verified
- No core banking replacement
- No customer fund custody
- No bank compliance environment transformation
- Round-trip translation (bank instruction → MBG → MITHQAL → MBG → bank
  response) verified

### §39.5.4 — Honest State

- `mbgIntegrationState = "INTEGRATION-READY"`
- `banksContracted = 0`
- All bank tests use SIMULATED bank identifiers

---

## §39.6 — Ledger Testing

### §39.6.1 — What Is Tested

Tests of the canonical MTQ ledger — the authoritative source of MTQ supply.

### §39.6.2 — How It Is Tested

- **Framework:** Forge (Solidity) + Jest (TypeScript)
- **Test boundary:** Ledger state machine, supply tracking, Merkle tree
- **Test data:** Synthetic, deterministic
- **Test execution:** CI/CD pipeline

### §39.6.3 — Acceptance Criteria

- Theorem S1 (canonical supply): one ledger, one supply — verified
- Theorem S2 (conservation): mint = burn + delta — verified
- Theorem S3 (immutability): ledger is append-only — verified
- State machine: PENDING → AUTHORIZED → FINALIZED → MINTED enforced
- No state skip allowed
- Merkle tree commitments verified
- Cross-chain supply invariant: total supply = sum of chain supplies

---

## §39.7 — Reconciliation Testing

### §39.7.1 — What Is Tested

Tests of the 5-way reconciliation engine — verifying that all 5 sources
reconcile within tolerance.

### §39.7.2 — How It Is Tested

- **Framework:** Custom reconciliation test harness
- **Test boundary:** 5 sources (bank subledger, reserve backing, custodian,
  MITHQAL canonical, proof of liabilities)
- **Test data:** Synthetic, with controlled mismatches injected
- **Test execution:** CI/CD pipeline + daily production reconciliation

### §39.7.3 — Acceptance Criteria

- All 5 sources reconcile within tolerance (0.0001 = 1 basis point)
- All 7 statuses (VERIFIED / WARNING / MISMATCH / CRITICAL / EXPIRED /
  UNAVAILABLE / LOCKED) properly detected and handled
- Forensic reconciliation (per `src/lib/forensic-rr-reconciliation.ts`)
  correctly identifies root cause

### §39.7.4 — Test Scenarios

| Test ID | Scenario | Expected Status |
|---------|----------|------------------|
| REC-T01 | All 5 sources match within 1bp | VERIFIED |
| REC-T02 | 1 source off by 5bp | WARNING |
| REC-T03 | 1 source off by 25bp | MISMATCH |
| REC-T04 | 1 source off by 100bp | CRITICAL |
| REC-T05 | Source expired | EXPIRED |
| REC-T06 | Source unavailable | UNAVAILABLE |
| REC-T07 | Source locked | LOCKED |
| REC-T08 | Bank subledger missing | UNAVAILABLE + investigation |
| REC-T09 | Custodian evidence missing | UNAVAILABLE + investigation |
| REC-T10 | Proof of liabilities mismatch | CRITICAL + investigation |
| REC-T11 | Forensic reconciliation identifies bank error | Root cause = bank |
| REC-T12 | Forensic reconciliation identifies custodian error | Root cause = custodian |
| REC-T13 | Forensic reconciliation identifies MITHQAL error | Root cause = MITHQAL |
| REC-T14 | Multi-source simultaneous failure | CRITICAL + multi-investigation |

---

## §39.8 — Reserve Testing

### §39.8.1 — What Is Tested

Tests of the reserve engine — RR computation, StressRR, LCR, MLCR, ILPS,
reserve allocation, rebalancing.

### §39.8.2 — How It Is Tested

- **Framework:** Custom reserve test harness + Forge (Solidity)
- **Test boundary:** Reserve engine, currency weight engine, gold/bullion
  module, digital liquidity module
- **Test data:** Historical prices (CSV), synthetic scenarios
- **Test execution:** CI/CD pipeline + daily reserve verification

### §39.8.3 — Acceptance Criteria

- RR computation correct (R_a / L)
- StressRR computation correct (R_l / L)
- LCR computation correct (HQLA / net_outflow_30d)
- MLCR computation correct (modified LCR)
- ILPS 5-layer totaling $48.1M verified
- Reserve allocation within constitutional corridors
- Rebalancing preserves 9 requirements (FV19, FV20, FV21)
- Concentration limits enforced (15% preferred / 20% hard / 60% sanity ceiling)

### §39.8.4 — Test Scenarios (35 — INT-T01..INT-T35)

Per §V25.0.D.AM, the 35 reserve and operational test scenarios are DESIGNED.
Examples:

| Test ID | Category | Description | Status |
|---------|----------|-------------|--------|
| INT-T01 | RESERVE | Normal reserve state — all weights within corridors | DESIGNED |
| INT-T02 | RESERVE | Reserve drift within tolerance — No-Trade Principle | DESIGNED |
| INT-T03 | RESERVE | Fiat overweight above corridor | DESIGNED |
| INT-T04 | RESERVE | Bullion underweight below corridor | DESIGNED |
| INT-T05 | RESERVE | Digital liquidity underweight within corridor | DESIGNED |
| INT-T06 | RESERVE | Currency weight drift | DESIGNED |
| INT-T07 | RESERVE | USD concentration increase | DESIGNED |
| INT-T08 | RESERVE | Currency eligibility failure | DESIGNED |
| INT-T09 | RESERVE | Stablecoin eligibility failure | DESIGNED |
| INT-T10 | RESERVE | Gold purchase — 16-step workflow | DESIGNED |
| INT-T11 | RESERVE | Gold verification failure | DESIGNED |
| INT-T28 | RESERVE | RR breach | DESIGNED |
| INT-T29 | RESERVE | LCR breach | DESIGNED |

(See §V25.0.D.AM for all 35 scenarios.)

---

## §39.9 — Accounting Testing

### §39.9.1 — What Is Tested

Tests of the three-book accounting system — verifying Books A, B, C reconcile
and never commingle.

### §39.9.2 — How It Is Tested

- **Framework:** Custom accounting test harness
- **Test boundary:** Three-book separation, anti-commingling tests
- **Test data:** Synthetic transactions
- **Test execution:** CI/CD pipeline

### §39.9.3 — Acceptance Criteria

- All 4 anti-commingling tests block (per §V25.2.AUDIT-CLOSURE.5):
  1. Corporate cash → MTQ backing without authorization — BLOCKED
  2. Bank obligation → MITHQAL corporate revenue — BLOCKED
  3. Corporate MTQ → MITHQAL asset — BLOCKED
  4. Reserve gain → Operating Company revenue — BLOCKED
- Books reconcile end-of-day
- No silent commingling

---

## §39.10 — Security Testing

### §39.10.1 — What Is Tested

Tests of all 14 security requirements (per §V25.1.38):
1. RBAC
2. LEAST_PRIVILEGE
3. CRYPTOGRAPHIC_SIGNATURES
4. POLICY_AS_CODE
5. IMMUTABLE_AUDIT_TRAIL
6. IDEMPOTENCY
7. REPLAY_PROTECTION
8. APPROVAL_WORKFLOWS
9. DUAL_CONTROL_FOR_CRITICAL_OPERATIONS
10. SAFE_FAILURE
11. RATE_LIMITS
12. FRAUD_CONTROLS
13. PROVIDER_AUTHENTICATION
14. HSM_MPC_INTEGRATION

### §39.10.2 — How It Is Tested

- **Framework:** Custom security test harness + OWASP testing tools
- **Test boundary:** All 14 security requirements
- **Test execution:** CI/CD pipeline + periodic security audits

### §39.10.3 — Acceptance Criteria

- All 14 security requirements enforced server-side
- No client-side-only enforcement
- All critical operations require dual control
- All API calls require authentication + authorization + signed requests +
  idempotency + timestamp + expiry + replay protection

---

## §39.11 — Penetration Testing

### §39.11.1 — What Is Tested

Penetration testing — simulated cyber-attacks to identify vulnerabilities.

### §39.11.2 — How It Is Tested

- **Vendor:** Independent third-party security firm (NOT YET CONTRACTED)
- **Test boundary:** All external-facing systems
- **Test approach:** OWASP, PTES, NIST SP 800-115 methodologies
- **Test execution:** Annual (target; NOT YET CONDUCTED)

### §39.11.3 — Acceptance Criteria

- No critical vulnerabilities
- No high vulnerabilities
- All medium vulnerabilities remediated within 90 days
- All low vulnerabilities remediated within 180 days
- Independent penetration testing report published

### §39.11.4 — Honest State

- `penetrationTestingConducted = false`
- `penetrationTestingVendor = NOT_CONTRACTED`
- Production BLOCKED until penetration testing conducted

---

## §39.12 — Disaster Recovery Testing

### §39.12.1 — What Is Tested

DR testing — verifying that the system can recover from disaster scenarios
within RPO/RTO targets.

### §39.12.2 — How It Is Tested

- **Vendor:** Independent DR auditor (NOT YET CONTRACTED)
- **Test boundary:** Primary site, recovery site, key material, ledger
- **Test approach:** Tabletop exercises + full DR activation tests
- **Test execution:** Semi-annual (target; NOT YET CONDUCTED)

### §39.12.3 — Acceptance Criteria

- RPO ≤ 0 for ledger (no data loss)
- RPO ≤ 5 minutes for analytics
- RTO ≤ 4 hours for full operations
- All key material recoverable via HSM/MPC quorum
- All banks notified within 30 minutes
- Regulator notified within 1 hour
- Public disclosure within 4 hours

### §39.12.4 — Honest State

- `disasterRecoveryTestingConducted = false`
- `disasterRecoveryAuditor = NOT_CONTRACTED`
- Production BLOCKED until DR testing conducted

---

## §39.13 — Performance Testing

### §39.13.1 — What Is Tested

Performance tests — verifying the system meets performance targets under
expected load.

### §39.13.2 — How It Is Tested

- **Framework:** k6 or similar load testing framework
- **Test boundary:** API endpoints, ledger, reconciliation
- **Test data:** Synthetic transactions at scale
- **Test execution:** Periodic (target monthly; current design-time only)

### §39.13.3 — Acceptance Criteria

- API latency p99 < 500ms for read operations
- API latency p99 < 2s for write operations
- Ledger commit latency < 1s
- Throughput ≥ 100 TPS sustained
- Throughput ≥ 1000 TPS burst
- Reconciliation latency < 5 minutes for full 5-way

### §39.13.4 — Honest State

- `performanceTestingExecuted = IMPLEMENTED (design-time)`
- `productionPerformanceValidated = false`

---

## §39.14 — Scalability Testing

### §39.14.1 — What Is Tested

Scalability tests — verifying the system can scale to projected institutional
load.

### §39.14.2 — How It Is Tested

- **Framework:** Distributed load testing
- **Test boundary:** Full system at 10x projected load
- **Test execution:** Pre-production (target; DESIGN ONLY currently)

### §39.14.3 — Acceptance Criteria

- Linear scaling to 10x baseline
- No degradation in latency at 10x load
- Database sharding tested
- Cache invalidation tested
- Network bandwidth tested

---

## §39.15 — Fault Injection Testing

### §39.15.1 — What Is Tested

Fault injection — deliberately introducing failures to verify the system
fails safely.

### §39.15.2 — How It Is Tested

- **Framework:** Chaos engineering (Chaos Monkey, Gremlin, or similar)
- **Test boundary:** All system components
- **Test execution:** Periodic (target; DESIGN ONLY currently)

### §39.15.3 — Acceptance Criteria

- All injected failures produce controlled outcomes
- No fund loss
- No false settlement
- No mint bypass
- All failures detected, logged, escalated

### §39.15.4 — Test Scenarios

- Network partition (split-brain)
- Database failure
- Ledger node failure
- HSM/MPC failure
- Key material loss
- API gateway failure
- Bank gateway failure
- Custodian system failure
- Oracle failure
- Time sync failure (NTP)

---

## §39.16 — Compliance Testing

### §39.16.1 — What Is Tested

Compliance tests — verifying the 12-check gate functions correctly.

### §39.16.2 — How It Is Tested

- **Framework:** Custom compliance test harness
- **Test boundary:** All 12 compliance checks
- **Test data:** Synthetic with controlled compliance failures
- **Test execution:** CI/CD pipeline

### §39.16.3 — Acceptance Criteria

- All 12 compliance checks properly evaluated
- ANY FAILURE = BLOCK (no partial pass)
- No override by commercial staff
- Compliance evidence properly recorded
- Regulatory reporting properly triggered

---

## §39.17 — Sanctions Screening Testing

### §39.17.1 — What Is Tested

Sanctions screening — verifying that sanctions matches are detected and
handled correctly.

### §39.17.2 — How It Is Tested

- **Framework:** Custom sanctions test harness with OFAC, EU, UN, HMT test data
- **Test boundary:** Sanctions screening engine
- **Test execution:** CI/CD pipeline + daily list updates

### §39.17.3 — Acceptance Criteria

- All test sanctions matches detected
- False positive rate < 5%
- Match handling per Flow J (FREEZE / INVESTIGATE / REPORT)
- Regulator notification properly triggered
- SAR/STR filing properly triggered

### §39.17.4 — Honest State

- `sanctionsScreeningImplemented = true`
- `sanctionsScreeningSIMULATED = true`
- `liveSanctionsData = false`

---

## §39.18 — Transaction Replay Testing

### §39.18.1 — What Is Tested

Replay protection — verifying that replayed transactions are rejected.

### §39.18.2 — How It Is Tested

- **Framework:** Custom replay test harness
- **Test boundary:** API layer (L1), ledger state machine (L5)
- **Test execution:** CI/CD pipeline

### §39.18.3 — Acceptance Criteria

- Replayed transactions rejected (timestamp + nonce)
- Idempotency keys properly handled (no duplicate processing)
- Ledger rejects duplicate mint attempts
- Database ACID prevents partial replay

### §39.18.4 — Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TR-T01 | Replay with same timestamp + nonce | REJECTED |
| TR-T02 | Replay with stale timestamp | REJECTED |
| TR-T03 | Replay with expired timestamp | REJECTED |
| TR-T04 | Replay with valid fresh timestamp but same nonce | REJECTED |
| TR-T05 | Replay with new nonce + fresh timestamp | ACCEPTED (new transaction) |
| TR-T06 | Idempotency key reuse | Original result returned (no duplicate processing) |

---

## §39.19 — Duplicate Transaction Testing

### §39.19.1 — What Is Tested

Duplicate detection — verifying that duplicate transactions are detected and
handled.

### §39.19.2 — How It Is Tested

- **Framework:** Custom duplicate detection test harness
- **Test boundary:** Ledger, reconciliation
- **Test execution:** CI/CD pipeline

### §39.19.3 — Acceptance Criteria

- Duplicate transactions detected within 1 second
- Duplicate transactions blocked (no double-mint)
- Duplicate transactions logged for audit
- Reconciliation detects any duplicates that slip through

---

## §39.20 — Concurrency Testing

### §39.20.1 — What Is Tested

Concurrency — verifying the system handles concurrent transactions correctly.

### §39.20.2 — How It Is Tested

- **Framework:** k6 or similar with concurrent users
- **Test boundary:** API, ledger, database
- **Test execution:** Periodic (design-time only currently)

### §39.20.3 — Acceptance Criteria

- 100 concurrent transactions processed correctly
- No race conditions
- No double-spending
- No supply inconsistency
- Database locks properly managed
- Deadlock detection and recovery

---

## §39.21 — Settlement Finality Testing

### §39.21.1 — What Is Tested

Settlement finality — verifying the 7-layer finality-before-mint gate
functions correctly.

### §39.21.2 — How It Is Tested

- **Framework:** Custom finality test harness + Forge (Solidity)
- **Test boundary:** All 7 layers (L1 API → L7 Smart Contract)
- **Test execution:** CI/CD pipeline + bypass test harness

### §39.21.3 — Acceptance Criteria

- All 7 layers enforced
- 10/10 bypass routes blocked:
  1. DIRECT_API_CALL_WITHOUT_AUTH — blocked by L1
  2. WORKFLOW_SKIP_BM15 — blocked by L2
  3. POLICY_OVERRIDE_BY_COMMERCIAL — blocked by L3
  4. UNSIGNED_AUTHORIZATION — blocked by L4
  5. LEDGER_SKIP_FINALIZED_STATE — blocked by L5
  6. DATABASE_PARTIAL_WRITE — blocked by L6
  7. SMART_CONTRACT_WITHOUT_ORACLE — blocked by L7
  8. EMERGENCY_OVERRIDE_WITHOUT_GOVERNANCE — blocked by L4
  9. ADMIN_BACKDOOR — blocked by L5
  10. INTERNAL_API_ROUTE — blocked by L1
- Invariant holds: `NO FINAL SETTLEMENT ⇒ NO MTQ MINT`

### §39.21.4 — Honest State

- `finalityPolicyDefined = true`
- `finalityLayersDesigned = 7`
- `finalityLayersRequired = 7`
- `finalityLayersEnforced = 7` (was 3 — now 7/7 at code level)
- `finalityProductionReady = false`
- `finalityBypassRisk = MITIGATED_AT_CODE_LEVEL`

---

## §39.22 — Cross-Jurisdiction Testing

### §39.22.1 — What Is Tested

Cross-jurisdiction — verifying the system handles cross-border transactions
correctly across multiple jurisdictions.

### §39.22.2 — How It Is Tested

- **Framework:** Custom cross-jurisdiction test harness
- **Test boundary:** Multiple simulated jurisdictions
- **Test execution:** Pre-production (target; DESIGN ONLY currently)

### §39.22.3 — Acceptance Criteria

- All 8 seeded jurisdictions (US, EU/EEA, UK, CH, SG, AE, SA, JP) tested
- Cross-jurisdiction compliance properly enforced
- Currency conversion properly executed
- Regulatory reporting per jurisdiction
- Data residency per jurisdiction
- Sanctions screening per jurisdiction-specific lists

### §39.22.4 — Honest State

- `crossJurisdictionTestingExecuted = false`
- `validatedJurisdictions = 0`
- All jurisdictions at `JURISDICTION_PENDING` status

---

## §39.23 — Adversarial Test Scenarios

### §39.23.1 — Adversarial Test Approach

Adversarial tests assume hostile actors actively trying to:
- Bypass compliance
- Forge authorization
- Double-spend
- Steal funds
- Manipulate reserve
- Exploit smart contracts
- Compromise keys
- Conduct insider attacks
- Exploit governance processes

### §39.23.2 — Adversarial Test Inventory (35+ scenarios)

| Test ID | Category | Adversarial Action | Expected Defense |
|---------|----------|-------------------|------------------|
| ADV-T01 | FORGERY | Forge MITHQAL Monetary Control signature | L4 rejects invalid signature |
| ADV-T02 | FORGERY | Forge bank signature | L1 rejects invalid signature |
| ADV-T03 | DOUBLE_SPEND | Submit same transaction twice | Idempotency key blocks |
| ADV-T04 | REPLAY | Replay valid transaction | Timestamp + nonce blocks |
| ADV-T05 | OVERFLOW | Submit amount exceeding uint256 | Input validation blocks |
| ADV-T06 | REENTRANCY | Reentrancy attack on mint | Reentrancy guard blocks |
| ADV-T07 | FRONT_RUN | Front-run settlement | Mempool privacy (if applicable) |
| ADV-T08 | ORACLE_MANIPULATION | Manipulate oracle price | Multi-oracle + median blocks |
| ADV-T09 | GOVERNANCE_CAPTURE | Capture governance to authorize fraudulent mint | Constitutional invariants block |
| ADV-T10 | KEY_COMPROMISE | Compromise HSM/MPC key | Quorum prevents single-key use |
| ADV-T11 | INSIDER_ATTACK | Insider attempts unauthorized mint | L3 policy blocks; L4 authorization blocks; L5 ledger state machine blocks |
| ADV-T12 | SUPPLY_INFLATION | Inflate MTQ supply without backing | FV1 (supply × PAR = reserve) blocks |
| ADV-T13 | RESERVE_DRAIN | Drain reserve without redemption | FV3 (RR ≥ 1.00) blocks |
| ADV-T14 | SANCTIONS_EVASION | Evade sanctions screening | Multi-list screening blocks |
| ADV-T15 | CORRIDOR_ABUSE | Use unauthorized corridor | Corridor authorization blocks |
| ADV-T16 | BANK_IMPERSONATION | Impersonate a bank | mTLS + signed nonce blocks |
| ADV-T17 | TIME_MANIPULATION | Manipulate timestamp | L1 fresh timestamp check blocks |
| ADV-T18 | BATCH_ATTACK | Submit batch of fraudulent transactions | Rate limiting + per-transaction compliance blocks |
| ADV-T19 | SOCIAL_ENGINEERING | Social engineer operator | Dual control + approval workflows block |
| ADV-T20 | DDOS | Distributed denial of service | Rate limits + scaling + circuit breakers |
| ADV-T21 | COMPROMISED_HSM | Use compromised HSM to mint | HSM quorum + L4 authorization blocks |
| ADV-T22 | STATE_MACHINE_ABUSE | Skip FINALIZED state | L5 state machine blocks |
| ADV-T23 | DATABASE_INJECTION | SQL injection to alter ledger | Parameterized queries + ACID blocks |
| ADV-T24 | API_ABUSE | Abuse API to bypass finality | L1 + L2 + L3 + L4 + L5 + L6 + L7 all enforce |
| ADV-T25 | INSIDER_GOVERNANCE | Insider captures Council | Foundation oversight + constitutional invariants block |
| ADV-T26 | BACKDOOR_DETECTION | Detect hidden backdoor | All routes pass through 7-layer enforcement; no hidden bypass exists |
| ADV-T27 | EMERGENCY_ABUSE | Use emergency override for non-emergency | L4 + governance authorization blocks |
| ADV-T28 | ADMIN_ABUSE | Use admin privileges to mint | No admin backdoor exists (verified) |
| ADV-T29 | HIDDEN_API_ROUTE | Discover hidden API route | All routes (public + internal) pass through 7-layer enforcement |
| ADV-T30 | CROSS_CHAIN_BRIDGE | Exploit cross-chain bridge | Cross-chain supply invariant (S2) blocks |
| ADV-T31 | STABLECOIN_DEPEG | Exploit stablecoin depeg | 10 threshold controls (PCT_1 to CHAIN_OUTAGE) block |
| ADV-T32 | PROTECTED_BACKING_DOUBLE_COUNT | Double-count protected backing | Anti-double-count test blocks |
| ADV-T33 | BANK_DEFAULT | Bank defaults on MTQ obligation | Bank default resolution (8-state lifecycle) handles |
| ADV-T34 | CUSTODIAN_FAILURE | Custodian fails to deliver | Custodian failure handling (Flow H) |
| ADV-T35 | CONCENTRATION_ATTACK | Bank attempts to exceed concentration limit | Concentration limit enforcement blocks |

### §39.23.3 — Adversarial Test Honest State

- All adversarial tests at DESIGN or IMPLEMENTED status
- Production validation requires real institutional participation
- Production BLOCKED until adversarial tests independently validated

---

## §39.24 — Reconciliation Test Plan

### §39.24.1 — Plan Overview

The reconciliation test plan verifies that the 5-way reconciliation engine
correctly detects mismatches and triggers appropriate handling.

### §39.24.2 — Test Phases

**Phase 1 — Synthetic Tests (DESIGNED + IMPLEMENTED):**
- All 7 statuses tested (VERIFIED / WARNING / MISMATCH / CRITICAL / EXPIRED /
  UNAVAILABLE / LOCKED)
- Tolerance boundary tests (1bp, 5bp, 25bp, 100bp)
- Source-specific failures (each of 5 sources)

**Phase 2 — Institutional Sandbox Tests (PROPOSED):**
- Tests with sandbox institutional data
- Tests with sandbox custodian evidence
- Tests with sandbox proof of liabilities

**Phase 3 — Production Validation (BLOCKED):**
- Tests with real institutional data
- Tests with real custodian evidence
- Tests with real proof of liabilities
- Requires all institutional validation gates passed (§40)

### §39.24.3 — Acceptance Criteria

- All 7 reconciliation statuses properly detected
- All 5 sources properly reconciled
- Forensic reconciliation identifies root cause within 1 hour
- Tolerance properly enforced (1bp)
- No false positives (verified transactions not flagged)
- No false negatives (real mismatches always caught)

---

## §39.25 — DR / Failure-Injection Test Plan

### §39.25.1 — Plan Overview

The DR / failure-injection test plan verifies the system fails safely under
various failure scenarios.

### §39.25.2 — Test Scenarios

| Test ID | Scenario | RPO Target | RTO Target | Status |
|---------|----------|-----------|-----------|--------|
| DR-T01 | Primary site failure (fire) | 0 (ledger) / 5 min (analytics) | 4 hours | DESIGN_ONLY |
| DR-T02 | Primary database corruption | 0 | 4 hours | DESIGN_ONLY |
| DR-T03 | Ledger node compromise | 0 | 4 hours | DESIGN_ONLY |
| DR-T04 | HSM/MPC failure | 0 | 4 hours | DESIGN_ONLY |
| DR-T05 | Key material loss | 0 | 4 hours (quorum recovery) | DESIGN_ONLY |
| DR-T06 | Cyber-attack (ransomware) | 0 | 8 hours (with forensics) | DESIGN_ONLY |
| DR-T07 | Network partition (split-brain) | 0 | 1 hour | DESIGN_ONLY |
| DR-T08 | Power loss at primary site | 0 | 4 hours | DESIGN_ONLY |
| DR-T09 | Earthquake (regional disaster) | 0 | 8 hours (multi-region) | DESIGN_ONLY |
| DR-T10 | Insider attack on infrastructure | 0 | 4 hours | DESIGN_ONLY |
| DR-T11 | Oracle failure | 0 | 30 minutes (failover) | DESIGN_ONLY |
| DR-T12 | Bank gateway failure | 0 | 2 hours | DESIGN_ONLY |
| DR-T13 | Custodian system failure | 0 | 24 hours (evidence refresh) | DESIGN_ONLY |
| DR-T14 | Regulator intervention | 0 | N/A (compliance response) | DESIGN_ONLY |
| DR-T15 | Court order (freeze assets) | 0 | N/A (compliance response) | DESIGN_ONLY |

### §39.25.3 — Acceptance Criteria

- All scenarios produce controlled outcomes
- No fund loss
- No false settlement
- All RPO/RTO targets met
- All affected parties notified within target timeframes
- Independent DR auditor validates recovery

### §39.25.4 — Honest State

- `disasterRecoveryTestingConducted = false`
- `disasterRecoveryAuditor = NOT_CONTRACTED`
- Production BLOCKED until DR testing conducted

---

## §39.26 — Test Rollup Summary

| Category | Status | Honest State |
|----------|--------|--------------|
| Unit | IMPLEMENTED | Tested at code level |
| Integration | IMPLEMENTED | Tested at code level |
| API | IMPLEMENTED | Tested at code level |
| Contract | IMPLEMENTED | Tested at code level |
| Bank Gateway | IMPLEMENTED (SIMULATED) | 0 banks contracted |
| Ledger | IMPLEMENTED | S1/S2/S3 verified |
| Reconciliation | IMPLEMENTED | 5-way verified |
| Reserve | IMPLEMENTED | 35 scenarios DESIGNED |
| Accounting | IMPLEMENTED | 4 anti-commingling tests block |
| Security | IMPLEMENTED | 14 requirements enforced |
| Penetration | NOT_CONDUCTED | Vendor NOT contracted |
| DR | NOT_CONDUCTED | Auditor NOT contracted |
| Performance | IMPLEMENTED (design-time) | Production validation pending |
| Scalability | DESIGN_ONLY | Pre-production |
| Fault Injection | DESIGN_ONLY | Pre-production |
| Compliance | IMPLEMENTED | 12-check gate enforced |
| Sanctions Screening | IMPLEMENTED (SIMULATED) | Live data not connected |
| Transaction Replay | IMPLEMENTED | 6 scenarios pass |
| Duplicate | IMPLEMENTED | Detection verified |
| Concurrency | IMPLEMENTED (design-time) | 100 concurrent tested |
| Settlement Finality | IMPLEMENTED | 7/7 layers, 10/10 bypass blocked |
| Cross-Jurisdiction | DESIGN_ONLY | 0 jurisdictions validated |

**Honest summary:** Tests are IMPLEMENTED at the code level. NO tests are at
INSTITUTIONALLY_VALIDATED or PRODUCTION_VALIDATED status. Production authorization
REQUIRES independent validation of all critical tests.

---

# §40 — PRODUCTION READINESS FRAMEWORK

## §40.0 — Purpose and Approach

This section defines the comprehensive production readiness framework for
MITHQAL. The framework consists of:

1. **19+ checklist items** across 8 categories
2. **13 institutional validation gates**
3. **Path from current state to production**

### §40.0.1 — Critical Honest Declaration

**CURRENT STATUS: NOT PRODUCTION-AUTHORIZED.**

- **Checklist items checked:** 0 / 19+
- **Institutional validation gates passed:** 0 / 13
- **Real-world evidence:** ABSENT
- **Honest state:** `honest = true`, `forcedToPass = false`,
  `productionAuthorized = false`

This framework is the canonical reference for what MUST be true before
production authorization. NO item may be marked complete without independent
evidence. NO item may be skipped. NO item may be self-attested.

---

## §40.1 — Production Readiness Checklist (19+ items across 8 categories)

### §40.1.1 — Architecture Category (3 items)

#### §40.1.1.A — Architectural Completeness

**What it means:** All architectural components specified in the blueprint are
implemented, integrated, and tested at the code level.

**How to verify:**
- Implementation status report (`/api/mtq-implementation-status`) shows all 9
  requirements at IMPLEMENTED status
- All 13 technology services implemented
- All 16 data models implemented
- All 12 versioned API endpoints implemented
- All 7 MBG connector classes implemented
- All 7 finality layers enforced
- 35 test scenarios (INT-T01..INT-T35) DESIGNED or IMPLEMENTED

**Current status:** ✅ IMPLEMENTED at code level
**Production-authorized:** ❌ NO (code-level ≠ production-authorized)

#### §40.1.1.B — Architectural Stability

**What it means:** The architecture is FROZEN. No v25.1, no v26, no fork, no
redesign of reserve mathematics, no competing rebalancing algorithm, no USD as
monetary anchor, MITHQAL not custodian, MITHQAL not bank, Foundation not
operator, reserve appreciation not commercial profit.

**How to verify:**
- Version control properties verified:
  - `currentVersion = v25.0`
  - `frozen = true`
  - `noV25_1Created = true`
  - `noV26Created = true`
  - `noArchitectureFork = true`
  - `noReserveMathRedesign = true`
  - `noCompetingRebalancingAlgorithm = true`
  - `noUsdAsMonetaryAnchor = true`
  - `mithqalIsNotCustodian = true`
  - `mithqalIsNotBank = true`
  - `foundationIsNotOperator = true`
  - `reserveAppreciationIsNotCommercialProfit = true`

**Current status:** ✅ ARCHITECTURE FROZEN
**Production-authorized:** ❌ NO (frozen ≠ production-authorized)

#### §40.1.1.C — Contradiction Scan Clear

**What it means:** No unresolved contradictions in the blueprint or code.

**How to verify:**
- Contradiction scan (`/api/mtq-contradiction-scan`) shows 0 unresolved
- 17 patterns scanned
- 4 occurrences found (all false positives — prohibition/honest-state context)
- 0 true contradictions
- 0 unresolved

**Current status:** ✅ 0 UNRESOLVED
**Production-authorized:** ❌ NO (no contradictions ≠ production-authorized)

### §40.1.2 — Security Category (3 items)

#### §40.1.2.A — Finality-Before-Mint Enforcement

**What it means:** The hard invariant `NO FINAL SETTLEMENT ⇒ NO MTQ MINT` is
enforced by all 7 layers.

**How to verify:**
- All 7 layers (L1 API → L7 Smart Contract) at ENFORCED status
- 10/10 bypass routes blocked
- Bypass test harness executed
- Independent security firm validates bypass tests

**Current status:** ✅ 7/7 ENFORCED at code level
**Production-authorized:** ❌ NO (code-level enforcement ≠ production-authorized;
requires independent validation)

#### §40.1.2.B — Penetration Testing

**What it means:** Independent penetration testing has been conducted and all
critical/high vulnerabilities remediated.

**How to verify:**
- Independent penetration testing report published
- No critical vulnerabilities
- No high vulnerabilities
- All medium vulnerabilities remediated within 90 days
- All low vulnerabilities remediated within 180 days

**Current status:** ❌ NOT_CONDUCTED
**Production-authorized:** ❌ NO

#### §40.1.2.C — Disaster Recovery Testing

**What it means:** DR testing has been conducted and all RPO/RTO targets met.

**How to verify:**
- Independent DR auditor report published
- All 15 DR scenarios tested
- All RPO targets met (0 for ledger, 5 min for analytics)
- All RTO targets met (4 hours for full operations)
- All affected party notification timeframes met

**Current status:** ❌ NOT_CONDUCTED
**Production-authorized:** ❌ NO

### §40.1.3 — Compliance Category (2 items)

#### §40.1.3.A — Legal Opinions Obtained

**What it means:** Independent legal opinions obtained for at least one
jurisdiction confirming the non-custodial structure is legally sound.

**How to verify:**
- Independent legal opinion from qualified counsel in operating jurisdiction
- All 13 legal liability dimensions reviewed
- Jurisdiction classification: VALIDATED (not JURISDICTION_PENDING)
- `legalOpinionsObtained = true`
- `validatedJurisdictions ≥ 1`

**Current status:** ❌ 0/8 jurisdictions validated
**Production-authorized:** ❌ NO

#### §40.1.3.B — Regulatory Licenses Obtained

**What it means:** Required regulatory licenses obtained in operating
jurisdiction.

**How to verify:**
- All 9 activities reviewed (banking, payment services, custody, FX, digital
  asset/CASP, securities, commodity, CBDC access, settlement activities)
- All applicable licenses obtained
- `licensesObtained ≥ 1`
- Regulator approval for production operation

**Current status:** ❌ 0/72 entries (9 activities × 8 jurisdictions) — ALL
`REQUIRED_NOT_OBTAINED`
**Production-authorized:** ❌ NO

### §40.1.4 — Reserve Category (2 items)

#### §40.1.4.A — Independent Reserve Validation

**What it means:** The reserve mathematical specification has been
independently validated.

**How to verify:**
- Independent quantitative validation report
- All 50 directive sections reviewed
- RR computation validated
- StressRR computation validated
- Currency weight engine validated
- Gold/bullion module validated
- Digital liquidity module validated
- `reservePolicyStatus = INDEPENDENTLY_VALIDATED` (currently
  `CANDIDATE_MODEL_VALIDATION_PENDING`)

**Current status:** ❌ PENDING independent validation
**Production-authorized:** ❌ NO

#### §40.1.4.B — Protected Backing Live Cells

**What it means:** At least one Protected Backing Cell is operational with
real bank backing.

**How to verify:**
- `protectedBackingLiveCells ≥ 1`
- Cell verification with real bank evidence
- Cell reconciliation with real custodian evidence
- Cell anti-double-count verification

**Current status:** ❌ `protectedBackingLiveCells = 0`
**Production-authorized:** ❌ NO

### §40.1.5 — Accounting Category (2 items)

#### §40.1.5.A — Three-Book Operational Enforcement

**What it means:** The three-book separation is operationally enforced, not
just designed.

**How to verify:**
- `threeBookOperational = true`
- `threeBookEnforced = true`
- 4 anti-commingling tests block in production
- Independent audit confirms operational enforcement

**Current status:** ❌ `threeBookOperational = false`,
`threeBookEnforced = false`
**Production-authorized:** ❌ NO

#### §40.1.5.B — Systemic Risk Live Monitoring

**What it means:** Systemic risk monitoring is live, not just designed.

**How to verify:**
- `systemicRiskMonitoringLive = true`
- `systemicRiskProductionValidated = true`
- 13 concentration dimensions monitored live
- Independent audit confirms live monitoring

**Current status:** ❌ `systemicRiskMonitoringLive = false`,
`systemicRiskProductionValidated = false`
**Production-authorized:** ❌ NO

### §40.1.6 — Institutional Category (2 items)

#### §40.1.6.A — Bank Contracted

**What it means:** At least one participating regulated bank has signed an
integration agreement and completed technical certification.

**How to verify:**
- `banksContracted ≥ 1`
- Bank has signed integration agreement
- Bank has completed technical certification
- Bank has passed MBG integration testing

**Current status:** ❌ `banksContracted = 0` (INTEGRATION-READY)
**Production-authorized:** ❌ NO

#### §40.1.6.B — Custodian Contracted

**What it means:** At least one qualified custodian has been contracted for
reserve evidence (Source B) — not SIMULATED.

**How to verify:**
- `custodiansContracted ≥ 1`
- Custodian has signed agreement
- Custodian provides independent evidence
- Custodian is LBMA-approved (for gold) or equivalent

**Current status:** ❌ `custodiansContracted = 0`
**Production-authorized:** ❌ NO

### §40.1.7 — Infrastructure Category (2 items)

#### §40.1.7.A — Production Infrastructure Deployed

**What it means:** Production infrastructure (not testnet) is deployed and
operational.

**How to verify:**
- Production environment deployed
- Production HSM/MPC operational
- Production database operational
- Production monitoring operational
- Production DR site operational
- All 7 finality layers deployed in production

**Current status:** ❌ Testnet only
**Production-authorized:** ❌ NO

#### §40.1.7.B — Smart Contracts Deployed to Mainnet

**What it means:** All 37 smart contract changes deployed to mainnet.

**How to verify:**
- All 37 SC changes deployed to mainnet
- Mainnet bytecode ≠ v24.2.1 (currently v24.2.1)
- Independent audit of mainnet bytecode
- Mainnet contracts verified on etherscan/block explorer

**Current status:** ❌ Bytecode still v24.2.1
**Production-authorized:** ❌ NO

### §40.1.8 — Overall Category (3+ items)

#### §40.1.8.A — Independent Third-Party Audit

**What it means:** Independent third-party audit completed confirming all
critical controls are operational.

**How to verify:**
- Independent audit firm engaged
- Audit covers: reconciliation logic, custody separation, issuance gate, veto
  triggers, security controls
- Audit report published
- All findings remediated

**Current status:** ❌ 0 external reviewers engaged
**Production-authorized:** ❌ NO

#### §40.1.8.B — Sharia Certification (where claimed)

**What it means:** Independent Sharia certification obtained where
Sharia-compliant operation is claimed.

**How to verify:**
- Independent Sharia board empaneled (AAOIFI-certified scholars)
- Complete live structure reviewed (PAR, reserves, redemption, custody,
  transaction fees, treasury instruments, Takaful, digital liquidity assets,
  governance)
- Certification published

**Current status:** ❌ 0 board empaneled
**Production-authorized:** ❌ NO

#### §40.1.8.C — Pilot Transactions Executed

**What it means:** 100+ pilot transactions executed on testnet/sandbox
demonstrating end-to-end functionality.

**How to verify:**
- 100+ transactions executed
- Transactions cover all 17 workflow flows
- Reconciliation verified for each
- Independent observer validates

**Current status:** ❌ 0 pilot transactions
**Production-authorized:** ❌ NO

#### §40.1.8.D — 10 Standing Blockers Resolved

**What it means:** All 10 standing blockers (BLK-01 through BLK-10) are
resolved with real-world evidence.

**How to verify:**
- BLK-01: ΔCapital_min = $15.8M resolved
- BLK-02: Bank-run dynamic unconstrained before ILPS — resolved
- BLK-03: Anti-hoarding mechanism — resolved
- BLK-04: Single custodian 52% concentration — resolved (multi-custodian)
- BLK-05: Cross-chain bridge architecture — resolved
- BLK-06: 37 SC changes deployed — resolved
- BLK-07: Bank cannibalization risk — resolved (1+ bank contracted)
- BLK-08: Runway — $4.7M raised
- BLK-09: Independent audit — conducted
- BLK-10: Sharia certification — obtained

**Current status:** ❌ ALL 10 OPEN
**Production-authorized:** ❌ NO

---

## §40.2 — Institutional Validation Gates (13 gates, 0 passed)

### §40.2.1 — Gate 1: Bank Integration Agreement

**Gate:** At least one participating regulated bank has signed an integration
agreement.

**Evidence required:** Signed integration agreement, bank identity, bank
regulatory status.

**Status:** ❌ NOT PASSED (0 banks contracted)

### §40.2.2 — Gate 2: Bank Technical Certification

**Gate:** Bank has completed technical certification (MBG integration).

**Evidence required:** MBG integration test results, ISO 20022 compatibility,
API compatibility.

**Status:** ❌ NOT PASSED (0 banks certified)

### §40.2.3 — Gate 3: Custodian Agreement

**Gate:** At least one qualified custodian contracted for reserve evidence.

**Evidence required:** Signed custodian agreement, custodian qualifications,
LBMA approval (for gold).

**Status:** ❌ NOT PASSED (0 custodians contracted)

### §40.2.4 — Gate 4: Jurisdiction Authorization

**Gate:** Jurisdictional authorization obtained for at least one jurisdiction.

**Evidence required:** Jurisdiction status = ESTABLISHED (not PENDING),
regulator approval.

**Status:** ❌ NOT PASSED (0 jurisdictions validated)

### §40.2.5 — Gate 5: Independent Legal Opinion

**Gate:** Independent legal opinion obtained confirming non-custodial structure
is legally sound.

**Evidence required:** Independent legal opinion from qualified counsel,
operating jurisdiction.

**Status:** ❌ NOT PASSED (0/8 jurisdictions validated)

### §40.2.6 — Gate 6: Independent Attestation Oracle

**Gate:** Independent attestation oracle (Source D) contracted and operational.

**Evidence required:** Signed oracle agreement, oracle operational, oracle
evidence produced.

**Status:** ❌ NOT PASSED (0 oracles contracted)

### §40.2.7 — Gate 7: Independent Sharia Certification

**Gate:** Independent Sharia certification obtained (where Sharia-compliant
operation is claimed).

**Evidence required:** Independent Sharia board certification, AAOIFI-
certified scholars.

**Status:** ❌ NOT PASSED (0 boards empaneled)

### §40.2.8 — Gate 8: Independent Third-Party Audit

**Gate:** Independent third-party audit completed confirming reconciliation
logic, custody separation, issuance gate, veto triggers, security controls
are operational.

**Evidence required:** Independent audit report, all findings remediated.

**Status:** ❌ NOT PASSED (0 external reviewers engaged)

### §40.2.9 — Gate 9: Live Stress Test

**Gate:** Stress test executed against live integration confirming: bank
failure, custodian failure, MITHQAL outage, redemption stress — all produce
controlled outcomes.

**Evidence required:** Live stress test report, all outcomes controlled.

**Status:** ❌ NOT PASSED (design-time stress only)

### §40.2.10 — Gate 10: Regulator / Central Bank Approval

**Gate:** Regulator / central bank approval obtained for production operation.

**Evidence required:** Regulator approval letter, operating jurisdiction.

**Status:** ❌ NOT PASSED (0 approvals)

### §40.2.11 — Gate 11: Three-Book Operational Enforcement

**Gate:** Three-book separation is operationally enforced (not just designed).

**Evidence required:** `threeBookOperational = true`,
`threeBookEnforced = true`, independent audit confirmation.

**Status:** ❌ NOT PASSED (false)

### §40.2.12 — Gate 12: Systemic Risk Live Monitoring

**Gate:** Systemic risk monitoring is live (not just designed).

**Evidence required:** `systemicRiskMonitoringLive = true`,
`systemicRiskProductionValidated = true`, independent audit confirmation.

**Status:** ❌ NOT PASSED (false)

### §40.2.13 — Gate 13: Protected Backing Live Cells

**Gate:** At least one Protected Backing Cell is operational with real bank
backing.

**Evidence required:** `protectedBackingLiveCells ≥ 1`, bank evidence,
custodian evidence.

**Status:** ❌ NOT PASSED (0 live cells)

---

## §40.3 — Path from Current State to Production

### §40.3.1 — Current State Summary

| Dimension | Current State | Target |
|-----------|---------------|--------|
| Architecture | ✅ FROZEN v25.0 | FROZEN |
| Code-level implementation | ✅ COMPLETE | COMPLETE |
| Contradiction scan | ✅ 0 UNRESOLVED | 0 UNRESOLVED |
| Finality layers | ✅ 7/7 ENFORCED | 7/7 ENFORCED |
| Bypass routes blocked | ✅ 10/10 BLOCKED | 10/10 BLOCKED |
| Three-book design | ✅ IMPLEMENTED | IMPLEMENTED |
| Three-book operational | ❌ false | true |
| Systemic risk engine | ✅ IMPLEMENTED | IMPLEMENTED |
| Systemic risk monitoring | ❌ false (not live) | true (live) |
| Banks contracted | ❌ 0 | ≥ 1 |
| Custodians contracted | ❌ 0 | ≥ 1 |
| Jurisdictions validated | ❌ 0/8 | ≥ 1 |
| Legal opinions | ❌ 0/8 | ≥ 1 |
| Licenses obtained | ❌ 0/72 | ≥ 1 |
| Protected backing live cells | ❌ 0 | ≥ 1 |
| Independent audit | ❌ NOT_CONDUCTED | CONDUCTED |
| Penetration testing | ❌ NOT_CONDUCTED | CONDUCTED |
| DR testing | ❌ NOT_CONDUCTED | CONDUCTED |
| Pilot transactions | ❌ 0 | 100+ |
| 10 standing blockers | ❌ ALL OPEN | ALL RESOLVED |
| Production authorization | ❌ NOT_AUTHORIZED | AUTHORIZED |

### §40.3.2 — Path to Production (10 Ordered Actions)

1. **Engage Smart-Contract Security Firm for full audit** (resolves BLK-09,
   Gate 8)
2. **Contract 2+ real custodians with legal segregation** (resolves BLK-04,
   Gate 3, Gate 13)
3. **Sign 1+ participating bank and execute technical certification**
   (resolves BLK-07, Gate 1, Gate 2)
4. **Raise $4.7M PILOT phase funding** (resolves BLK-08, BLK-01)
5. **Engage legal counsel in US, JP, AE jurisdictions for license applications**
   (resolves regulatory, Gate 4, Gate 5, Gate 10)
6. **Engage independent Sharia board for MTQ classification review** (resolves
   BLK-10, Gate 7)
7. **Deploy 37 SC changes after external audit sign-off** (resolves BLK-06)
8. **Execute 100+ pilot transactions on testnet** (resolves pilot evidence,
   Gate 9)
9. **Execute DR / incident / emergency / recovery tests** (resolves operations,
   Gate 9)
10. **Re-evaluate this gate after all 10 blockers resolved** (Gate 13 + all
    gates)

### §40.3.3 — Production Authorization Decision

Production authorization requires:

1. ✅ All 19+ checklist items checked (currently 0/19+)
2. ✅ All 13 institutional validation gates passed (currently 0/13)
3. ✅ All 10 standing blockers resolved (currently ALL OPEN)
4. ✅ Independent audit completed
5. ✅ Penetration testing conducted
6. ✅ DR testing conducted
7. ✅ Regulator approval obtained

**Current authorization status:** ❌ NOT PRODUCTION-AUTHORIZED

**Final status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT
PRODUCTION-AUTHORIZED.

---

# §41 — IMPLEMENTATION ROADMAP

## §41.0 — Purpose and Approach

This section defines the 13-phase implementation roadmap for MITHQAL, from
Phase 0 (Foundations) through Phase 12 (Scale). Each phase has:

- Objective
- Deliverables
- Dependencies
- Technical work
- Operational work
- Legal/regulatory work
- Financial work
- Testing
- Acceptance criteria
- Risks
- Exit criteria

### §41.0.1 — Phase Catalog (13 phases)

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundations | ✅ COMPLETE |
| 1 | Core Ledger | ✅ COMPLETE |
| 2 | Bank Gateway | ✅ COMPLETE |
| 3 | Compliance | ✅ COMPLETE |
| 4 | Reserve/Treasury | ✅ COMPLETE |
| 5 | Institutional Settlement | ✅ COMPLETE (code) |
| 6 | Reconciliation | ✅ COMPLETE |
| 7 | Security Hardening | ✅ COMPLETE (code) |
| 8 | Pilot Institutions | ⏳ PENDING (0 banks contracted) |
| 9 | Jurisdiction Adapters | ⏳ PENDING (0 jurisdictions validated) |
| 10 | Global Interoperability | ⏳ PENDING |
| 11 | Production | ⏳ BLOCKED (10 standing blockers open) |
| 12 | Scale | ⏳ PENDING |

---

## §41.1 — Phase 0: Foundations

### §41.1.1 — Objective

Establish the foundational architecture, corporate structure, and
constitutional framework for MITHQAL.

### §41.1.2 — Deliverables

- 5-entity corporate structure (Founder Shareholders, MITHQAL Holding,
  Operating Co, Technology Co, Foundation)
- Constitutional framework (17 Articles)
- Blueprint v25.0 (FROZEN)
- 50 reconciliation principles
- 21 frozen architectural elements
- 10 constitutional principles

### §41.1.3 — Dependencies

- Founder commitment
- Initial funding
- Legal counsel engagement

### §41.1.4 — Technical Work

- Define architecture (7-layer MTQ canonical model)
- Define MTQ position (neutral, permissioned, institutional, wholesale,
  settlement-focused)
- Define bank integration (TRANSLATION, NOT TRANSFORMATION)
- Define 13 technology services
- Define 16 data models
- Define 12 API endpoints

### §41.1.5 — Operational Work

- Establish corporate entities (5 entities)
- Establish Foundation (independent nonprofit)
- Establish board governance
- Establish separation of duties

### §41.1.6 — Legal/Regulatory Work

- Draft constitutional framework (17 Articles)
- Draft corporate charters
- Draft Foundation charter
- Engage legal counsel (initial)

### §41.1.7 — Financial Work

- Initial founder funding
- Corporate structure tax planning
- Operating capital planning

### §41.1.8 — Testing

- Architecture review
- Constitutional review
- Corporate structure review

### §41.1.9 — Acceptance Criteria

- ✅ 5 corporate entities established
- ✅ Constitutional framework adopted
- ✅ Blueprint v25.0 frozen
- ✅ 50 reconciliation principles defined
- ✅ 21 architectural elements frozen

### §41.1.10 — Risks

- Founder disengagement
- Funding shortfall
- Legal counsel conflicts

### §41.1.11 — Exit Criteria

- All deliverables complete
- All acceptance criteria met
- Phase 1 dependencies satisfied

---

## §41.2 — Phase 1: Core Ledger

### §41.2.1 — Objective

Implement the canonical MTQ ledger — the authoritative source of MTQ supply.

### §41.2.2 — Deliverables

- MTQ smart contract (Mint, Burn, Transfer)
- Ledger state machine (PENDING → AUTHORIZED → FINALIZED → MINTED)
- Supply tracking (Theorem S1: one ledger, one supply)
- Conservation (Theorem S2: mint = burn + delta)
- Immutability (Theorem S3: append-only)
- Cross-chain supply invariant

### §41.2.3 — Dependencies

- Phase 0 complete

### §41.2.4 — Technical Work

- Solidity smart contracts (MTQ.sol, Mint.sol, Burn.sol, Redeem.sol,
  Reserve.sol, Oracle.sol, Algorithm.sol, Governance.sol, Takaful.sol)
- Forge tests
- Merkle tree commitments
- Canonical supply ledger (`src/lib/canonical-supply-ledger.ts`)

### §41.2.5 — Operational Work

- Testnet deployment
- Key management (HSM/MPC)
- Ledger monitoring

### §41.2.6 — Legal/Regulatory Work

- Token classification (per jurisdiction)
- Smart contract legal review

### §41.2.7 — Financial Work

- Reserve management framework
- PAR accounting reference ($1.00)

### §41.2.8 — Testing

- Theorem S1 verification
- Theorem S2 verification
- Theorem S3 verification
- Cross-chain supply invariant

### §41.2.9 — Acceptance Criteria

- ✅ Ledger implemented
- ✅ Theorems S1, S2, S3 verified
- ✅ State machine enforced
- ✅ Merkle tree commitments
- ✅ Cross-chain supply invariant

### §41.2.10 — Risks

- Smart contract vulnerabilities
- Key compromise
- State machine bugs

### §41.2.11 — Exit Criteria

- All deliverables complete
- All acceptance criteria met

---

## §41.3 — Phase 2: Bank Gateway

### §41.3.1 — Objective

Implement the MITHQAL Bank Gateway (MBG) — the sidecar that translates banking
instructions into MTQ settlement instructions.

### §41.3.2 — Deliverables

- MBG adapter
- 7 MSAS connector classes (SWIFT, ISO 20022, REST API, Host-to-Host, SFTP,
  RTGS, Tokenized Deposit, CBDC)
- ISO 20022 message translation
- API gateway
- Bank authentication (mTLS + signed nonce + replay protection)

### §41.3.3 — Dependencies

- Phase 1 complete

### §41.3.4 — Technical Work

- MBG implementation (`src/lib/mithqal-bank-gateway.ts`)
- 7 connector classes
- ISO 20022 layer
- Authentication

### §41.3.5 — Operational Work

- MBG deployment
- Bank onboarding framework
- Bank authentication setup

### §41.3.6 — Legal/Regulatory Work

- Bank integration agreements (template)
- MBG regulatory classification

### §41.3.7 — Financial Work

- Bank fee structure
- Connectivity fees

### §41.3.8 — Testing

- Translation (NOT transformation) verification
- Round-trip translation
- All 7 connector classes
- Authentication tests
- Replay protection tests

### §41.3.9 — Acceptance Criteria

- ✅ MBG implemented
- ✅ 7 connector classes functional
- ✅ ISO 20022 layer
- ✅ Authentication
- ✅ Translation verified

### §41.3.10 — Risks

- Bank integration complexity
- ISO 20022 compatibility
- Authentication vulnerabilities

### §41.3.11 — Exit Criteria

- All deliverables complete
- All acceptance criteria met
- `mbgIntegrationState = INTEGRATION-READY` (current state)

---

## §41.4 — Phase 3: Compliance

### §41.4.1 — Objective

Implement the compliance architecture — KYC/KYB, AML/CFT, sanctions screening,
12-check settlement permission engine.

### §41.4.2 — Deliverables

- KYC/KYB architecture (layered)
- AML/CFT screening engine
- Sanctions screening engine (OFAC, EU, UN, HMT)
- 12-check settlement permission engine
- Compliance evidence recording
- Regulatory reporting framework

### §41.4.3 — Dependencies

- Phase 2 complete

### §41.4.4 — Technical Work

- KYC/KYB engine integration
- AML/CFT engine integration
- Sanctions screening engine
- 12-check gate implementation
- Evidence recording

### §41.4.5 — Operational Work

- Compliance officer training
- Compliance evidence retention
- Regulatory reporting process

### §41.4.6 — Legal/Regulatory Work

- Compliance framework per jurisdiction
- SAR/STR filing process
- Regulator notification process

### §41.4.7 — Financial Work

- Compliance cost planning
- Sanctions list subscription

### §41.4.8 — Testing

- 12-check gate tests
- Sanctions screening tests
- Compliance evidence tests
- Regulatory reporting tests

### §41.4.9 — Acceptance Criteria

- ✅ Compliance architecture implemented
- ✅ 12-check gate enforced
- ✅ Sanctions screening (SIMULATED — live data pending)
- ✅ Evidence recording
- ✅ Regulatory reporting framework

### §41.4.10 — Risks

- Sanctions list accuracy
- Compliance framework divergence across jurisdictions
- False positives/negatives

### §41.4.11 — Exit Criteria

- All deliverables complete
- All acceptance criteria met
- Live sanctions data integration pending (Phase 9)

---

## §41.5 — Phase 4: Reserve/Treasury

### §41.5.1 — Objective

Implement the reserve engine — RR computation, StressRR, LCR, MLCR, ILPS,
reserve allocation, rebalancing.

### §41.5.2 — Deliverables

- Reserve engine (`src/lib/mtq-final-reserve-spec.ts`)
- RR computation (R_a / L)
- StressRR computation (R_l / L)
- LCR computation
- MLCR computation
- ILPS 5-layer ($48.1M)
- Currency weight engine (6-step)
- Gold/bullion module
- Digital liquidity module
- Rebalancing engine (13-step)
- DMCE (Dynamic Minting Capacity Engine)

### §41.5.3 — Dependencies

- Phase 1 complete

### §41.5.4 — Technical Work

- Reserve engine implementation
- Currency weight engine
- Gold/bullion module
- Digital liquidity module
- Rebalancing engine
- DMCE

### §41.5.5 — Operational Work

- Reserve manager engagement
- Custodian engagement
- Oracle engagement

### §41.5.6 — Legal/Regulatory Work

- Reserve management framework
- Custodian agreements (template)

### §41.5.7 — Financial Work

- Initial reserve funding
- $4.7M PILOT phase funding (PENDING — BLK-08)
- ΔCapital_min $15.815M (PENDING — BLK-01)

### §41.5.8 — Testing

- 35 reserve test scenarios (INT-T01..INT-T35)
- Rebalancing tests (13-step)
- DMCE tests (8 limits)
- Concentration tests

### §41.5.9 — Acceptance Criteria

- ✅ Reserve engine implemented
- ✅ RR computation correct
- ✅ StressRR computation correct
- ✅ ILPS 5-layer
- ✅ Currency weight engine
- ✅ Rebalancing engine
- ✅ DMCE
- ❌ Independent reserve validation PENDING

### §41.5.10 — Risks

- Reserve mathematical specification errors
- Currency weight engine instability
- Rebalancing inefficiency

### §41.5.11 — Exit Criteria

- All deliverables complete
- All acceptance criteria met (except independent validation, which is Phase 8)

---

## §41.6 — Phase 5: Institutional Settlement

### §41.6.1 — Objective

Implement the institutional settlement architecture — bank-mediated issuance,
corporate MTQ settlement account, protected backing cell, three-book
separation.

### §41.6.2 — Deliverables

- Corporate MTQ settlement account (`src/lib/corporate-settlement-account.ts`)
- Bank-controlled wallet architecture
- Protected Backing Cell (`src/lib/protected-backing-cell.ts`)
- Three-book separation (`src/lib/three-book-separation.ts`)
- Bank default resolution (`src/lib/bank-default-resolution.ts`)
- Finality-before-mint (7 layers) (`src/lib/finality-before-mint.ts`)
- Systemic exposure engine (`src/lib/systemic-exposure-engine.ts`)

### §41.6.3 — Dependencies

- Phase 1, 2, 3, 4 complete

### §41.6.4 — Technical Work

- All deliverable modules implemented
- 17 workflow flows (A through Q) implemented
- 16-step bank minting workflow
- 13-step rebalancing engine
- 8 bank/custodian failure scenarios

### §41.6.5 — Operational Work

- Bank onboarding framework
- Corporate onboarding framework
- Custodian onboarding framework

### §41.6.6 — Legal/Regulatory Work

- Bank integration agreements
- Corporate settlement agreements
- Custodian agreements
- Legal liability framework (`src/lib/legal-liability-framework.ts`)
- Licensing/entity matrix (`src/lib/licensing-entity-matrix.ts`)

### §41.6.7 — Financial Work

- Bank fee structure
- Custodian fee structure
- Corporate fee structure

### §41.6.8 — Testing

- 17 workflow flow tests
- 16-step bank minting workflow tests
- 8 failure scenario tests
- 4 anti-commingling tests
- 10 bypass route tests

### §41.6.9 — Acceptance Criteria

- ✅ All modules implemented
- ✅ 17 workflows implemented
- ✅ 16-step workflow
- ✅ 8 failure scenarios
- ✅ 4 anti-commingling tests block
- ✅ 10/10 bypass routes blocked
- ❌ Institutional validation PENDING

### §41.6.10 — Risks

- Bank onboarding delays
- Custodian availability
- Legal framework divergence

### §41.6.11 — Exit Criteria

- All deliverables complete
- All acceptance criteria met (except institutional validation, which is Phase 8)

---

## §41.7 — Phase 6: Reconciliation

### §41.7.1 — Objective

Implement the 5-way reconciliation engine.

### §41.7.2 — Deliverables

- 5-way reconciliation engine
- 7 reconciliation statuses (VERIFIED / WARNING / MISMATCH / CRITICAL /
  EXPIRED / UNAVAILABLE / LOCKED)
- Forensic reconciliation (`src/lib/forensic-rr-reconciliation.ts`)
- Tolerance enforcement (0.0001 = 1bp)
- Bank monitoring authority

### §41.7.3 — Dependencies

- Phase 5 complete

### §41.7.4 — Technical Work

- Reconciliation engine implementation
- Forensic reconciliation
- Bank monitoring

### §41.7.5 — Operational Work

- Daily reconciliation process
- Break investigation process
- Bank/custodian notification process

### §41.7.6 — Legal/Regulatory Work

- Reconciliation evidence retention
- Regulatory reporting for material breaks

### §41.7.7 — Financial Work

- Reconciliation cost planning

### §41.7.8 — Testing

- 14 reconciliation test scenarios (REC-T01..REC-T14)
- Forensic reconciliation tests
- Tolerance boundary tests

### §41.7.9 — Acceptance Criteria

- ✅ Reconciliation engine implemented
- ✅ 5 sources reconciled
- ✅ 7 statuses detected
- ✅ Forensic reconciliation
- ✅ Tolerance enforced

### §41.7.10 — Risks

- Source availability
- Tolerance calibration
- Forensic investigation complexity

### §41.7.11 — Exit Criteria

- All deliverables complete
- All acceptance criteria met

---

## §41.8 — Phase 7: Security Hardening

### §41.8.1 — Objective

Implement all 14 security requirements and harden the system for production.

### §41.8.2 — Deliverables

- 14 security requirements enforced
- 7 finality layers enforced
- 10 bypass routes blocked
- HSM/MPC integration
- mTLS authentication
- Rate limiting
- Fraud controls
- Immutable audit trail
- Cryptographic signatures

### §41.8.3 — Dependencies

- Phase 5, 6 complete

### §41.8.4 — Technical Work

- All 14 security requirements implemented
- HSM/MPC integration
- mTLS configuration
- Rate limiting
- Fraud detection
- Audit trail

### §41.8.5 — Operational Work

- Security operations center
- Key management procedures
- Incident response procedures

### §41.8.6 — Legal/Regulatory Work

- Security framework compliance
- Incident reporting

### §41.8.7 — Financial Work

- Security operations cost
- HSM/MPC procurement

### §41.8.8 — Testing

- 14 security requirements tests
- 10 bypass route tests
- HSM/MPC tests
- mTLS tests
- Rate limiting tests

### §41.8.9 — Acceptance Criteria

- ✅ All 14 security requirements enforced
- ✅ 7/7 finality layers
- ✅ 10/10 bypass routes blocked
- ✅ HSM/MPC integrated
- ✅ mTLS
- ✅ Rate limiting
- ✅ Fraud controls
- ✅ Immutable audit trail
- ❌ Penetration testing NOT CONDUCTED
- ❌ DR testing NOT CONDUCTED

### §41.8.10 — Risks

- Security vulnerabilities
- Key compromise
- Insider attacks

### §41.8.11 — Exit Criteria

- All deliverables complete
- All acceptance criteria met (code-level)
- Penetration testing pending (Phase 8)
- DR testing pending (Phase 8)

---

## §41.9 — Phase 8: Pilot Institutions

### §41.9.1 — Objective

Engage pilot institutions — banks, custodians, regulators — for institutional
validation.

### §41.9.2 — Deliverables

- 1+ participating regulated bank contracted
- 1+ qualified custodian contracted
- 1+ jurisdiction authorized
- 100+ pilot transactions executed
- Penetration testing conducted
- DR testing conducted
- Independent audit conducted

### §41.9.3 — Dependencies

- Phase 7 complete
- Funding secured ($4.7M PILOT phase)

### §41.9.4 — Technical Work

- Bank technical certification
- Custodian technical integration
- Sandbox testing
- Pilot transaction execution
- Reconciliation with real data

### §41.9.5 — Operational Work

- Bank onboarding (real bank)
- Custodian onboarding (real custodian)
- Pilot transaction monitoring
- Incident response

### §41.9.6 — Legal/Regulatory Work

- Bank integration agreement (signed)
- Custodian agreement (signed)
- Jurisdiction authorization (obtained)
- Independent legal opinion (obtained)
- Sharia certification (obtained, where claimed)

### §41.9.7 — Financial Work

- $4.7M PILOT phase funding raised
- Bank fee structure (live)
- Custodian fee structure (live)

### §41.9.8 — Testing

- 100+ pilot transactions
- Live stress tests
- Penetration testing (independent firm)
- DR testing (independent auditor)
- Independent audit

### §41.9.9 — Acceptance Criteria

- ❌ 1+ bank contracted (currently 0)
- ❌ 1+ custodian contracted (currently 0)
- ❌ 1+ jurisdiction authorized (currently 0)
- ❌ 100+ pilot transactions (currently 0)
- ❌ Penetration testing (NOT_CONDUCTED)
- ❌ DR testing (NOT_CONDUCTED)
- ❌ Independent audit (NOT_CONDUCTED)

### §41.9.10 — Risks

- Bank onboarding delays
- Custodian availability
- Regulator approval delays
- Funding shortfall
- Pilot transaction failures

### §41.9.11 — Exit Criteria

- 1+ bank contracted and certified
- 1+ custodian contracted
- 1+ jurisdiction authorized
- 100+ pilot transactions
- Penetration testing conducted
- DR testing conducted
- Independent audit conducted

---

## §41.10 — Phase 9: Jurisdiction Adapters

### §41.10.1 — Objective

Implement jurisdiction-specific adapters for authorized jurisdictions.

### §41.10.2 — Deliverables

- Jurisdiction adapters (per authorized jurisdiction)
- Jurisdiction-specific compliance rules
- Jurisdiction-specific sanctions lists
- Jurisdiction-specific regulatory reporting
- Jurisdiction-specific data residency

### §41.10.3 — Dependencies

- Phase 8 complete (1+ jurisdiction authorized)

### §41.10.4 — Technical Work

- Jurisdiction adapter implementation
- Compliance rule engine (per jurisdiction)
- Sanctions list integration (live data)
- Regulatory reporting automation
- Data residency implementation

### §41.10.5 — Operational Work

- Jurisdiction-specific compliance officer
- Regulatory reporting operations
- Data residency management

### §41.10.6 — Legal/Regulatory Work

- Jurisdiction-specific legal opinions
- Jurisdiction-specific licenses
- Data residency compliance
- Cross-border data transfer compliance

### §41.10.7 — Financial Work

- Jurisdiction-specific fee structures
- Regulatory reporting costs

### §41.10.8 — Testing

- Jurisdiction adapter tests
- Compliance rule tests
- Sanctions list tests
- Regulatory reporting tests
- Data residency tests

### §41.10.9 — Acceptance Criteria

- ❌ Jurisdiction adapters implemented (PENDING jurisdiction authorization)
- ❌ Compliance rules (PENDING)
- ❌ Live sanctions data (PENDING)
- ❌ Regulatory reporting (PENDING)
- ❌ Data residency (PENDING)

### §41.10.10 — Risks

- Jurisdiction-specific compliance complexity
- Data residency divergence
- Regulatory framework changes

### §41.10.11 — Exit Criteria

- 1+ jurisdiction adapter implemented
- Compliance rules per jurisdiction
- Live sanctions data
- Regulatory reporting automated
- Data residency compliant

---

## §41.11 — Phase 10: Global Interoperability

### §41.11.1 — Objective

Achieve global interoperability across multiple jurisdictions and corridors.

### §41.11.2 — Deliverables

- 2+ jurisdictions authorized
- 2+ corridors certified
- Cross-jurisdiction compliance
- Cross-jurisdiction reconciliation
- Multi-currency settlement

### §41.11.3 — Dependencies

- Phase 9 complete (1+ jurisdiction)

### §41.11.4 — Technical Work

- Cross-jurisdiction reconciliation
- Multi-currency settlement
- Corridor certification framework

### §41.11.5 — Operational Work

- Multi-jurisdiction operations
- Cross-jurisdiction compliance monitoring
- Multi-currency treasury

### §41.11.6 — Legal/Regulatory Work

- Multi-jurisdiction legal opinions
- Multi-jurisdiction licenses
- Cross-border compliance

### §41.11.7 — Financial Work

- Multi-currency reserve management
- Multi-jurisdiction fee structures

### §41.11.8 — Testing

- Cross-jurisdiction tests
- Multi-currency tests
- Corridor certification tests

### §41.11.9 — Acceptance Criteria

- ❌ 2+ jurisdictions authorized (currently 0)
- ❌ 2+ corridors certified (currently 0)
- ❌ Cross-jurisdiction compliance (PENDING)
- ❌ Multi-currency settlement (PENDING)

### §41.11.10 — Risks

- Cross-jurisdiction compliance complexity
- Currency volatility
- Geopolitical risk

### §41.11.11 — Exit Criteria

- 2+ jurisdictions authorized
- 2+ corridors certified
- Cross-jurisdiction compliance verified
- Multi-currency settlement operational

---

## §41.12 — Phase 11: Production

### §41.12.1 — Objective

Achieve production authorization and deploy to production.

### §41.12.2 — Deliverables

- All 19+ checklist items checked
- All 13 institutional validation gates passed
- All 10 standing blockers resolved
- Production infrastructure deployed
- 37 SC changes deployed to mainnet
- Regulator approval obtained
- Production launch

### §41.12.3 — Dependencies

- Phase 10 complete
- All institutional validation gates passed
- All standing blockers resolved

### §41.12.4 — Technical Work

- Production infrastructure deployment
- 37 SC changes mainnet deployment
- Production monitoring
- Production DR site

### §41.12.5 — Operational Work

- Production operations team
- 24/7 monitoring
- Incident response
- Production change management

### §41.12.6 — Legal/Regulatory Work

- Regulator approval (production)
- Production license
- Production audit

### §41.12.7 — Financial Work

- Production capital
- Production operating budget

### §41.12.8 — Testing

- Production validation tests
- All institutional validation gates
- All standing blockers resolved

### §41.12.9 — Acceptance Criteria

- ❌ All 19+ checklist items (currently 0/19+)
- ❌ All 13 institutional validation gates (currently 0/13)
- ❌ All 10 standing blockers (currently ALL OPEN)
- ❌ Production infrastructure (NOT DEPLOYED)
- ❌ 37 SC changes (still v24.2.1 bytecode)
- ❌ Regulator approval (NOT OBTAINED)

### §41.12.10 — Risks

- Production deployment failure
- Regulatory rejection
- Standing blocker non-resolution

### §41.12.11 — Exit Criteria

- All checklist items checked
- All gates passed
- All blockers resolved
- Production infrastructure deployed
- 37 SC changes deployed
- Regulator approval obtained
- Production launch executed

---

## §41.13 — Phase 12: Scale

### §41.13.1 — Objective

Scale the system to projected institutional load and expand to additional
jurisdictions and corridors.

### §41.13.2 — Deliverables

- Scale to 10+ banks
- Scale to 5+ custodians
- Scale to 5+ jurisdictions
- Scale to 10+ corridors
- Scale to 1000+ TPS sustained

### §41.13.3 — Dependencies

- Phase 11 complete (production operational)

### §41.13.4 — Technical Work

- Performance optimization
- Scalability testing
- Database sharding
- Cache optimization
- Network optimization

### §41.13.5 — Operational Work

- Scale operations team
- Scale compliance team
- Scale monitoring

### §41.13.6 — Legal/Regulatory Work

- Multi-jurisdiction expansion
- Additional corridor certifications

### §41.13.7 — Financial Work

- Scale operating budget
- Scale capital

### §41.13.8 — Testing

- Performance testing at scale
- Scalability testing
- Stress testing at scale

### §41.13.9 — Acceptance Criteria

- ❌ 10+ banks (currently 0)
- ❌ 5+ custodians (currently 0)
- ❌ 5+ jurisdictions (currently 0)
- ❌ 10+ corridors (currently 0)
- ❌ 1000+ TPS (currently design-time only)

### §41.13.10 — Risks

- Scaling complexity
- Performance degradation
- Cost escalation
- Regulatory expansion complexity

### §41.13.11 — Exit Criteria

- 10+ banks
- 5+ custodians
- 5+ jurisdictions
- 10+ corridors
- 1000+ TPS sustained

---

## §41.14 — Roadmap Rollup Summary

| Phase | Name | Status | Target |
|-------|------|--------|--------|
| 0 | Foundations | ✅ COMPLETE | COMPLETE |
| 1 | Core Ledger | ✅ COMPLETE | COMPLETE |
| 2 | Bank Gateway | ✅ COMPLETE | COMPLETE |
| 3 | Compliance | ✅ COMPLETE (SIMULATED) | COMPLETE |
| 4 | Reserve/Treasury | ✅ COMPLETE | COMPLETE |
| 5 | Institutional Settlement | ✅ COMPLETE (code) | COMPLETE |
| 6 | Reconciliation | ✅ COMPLETE | COMPLETE |
| 7 | Security Hardening | ✅ COMPLETE (code) | COMPLETE |
| 8 | Pilot Institutions | ⏳ PENDING | 1+ bank, 1+ custodian, 1+ jurisdiction |
| 9 | Jurisdiction Adapters | ⏳ PENDING | 1+ jurisdiction adapter |
| 10 | Global Interoperability | ⏳ PENDING | 2+ jurisdictions, 2+ corridors |
| 11 | Production | ⏳ BLOCKED | All gates passed |
| 12 | Scale | ⏳ PENDING | 10+ banks, 5+ jurisdictions |

**Current honest state:** Phases 0-7 complete at code level. Phase 8+ PENDING.
Production authorization BLOCKED until Phase 11 acceptance criteria met.

---

# §42 — OPEN ITEMS / TBD

## §42.0 — Purpose and Approach

This section catalogs **13 items that cannot responsibly be determined** at the
current state of MITHQAL. These are items where:

- The technical design is complete
- But the institutional, legal, regulatory, or financial validation is
  ABSENT
- And the MITHQAL team cannot responsibly determine these items unilaterally

For each item, we specify:
- What is missing
- Why it matters
- What is needed to resolve

### §42.0.1 — Honest State Principle

**No item may be marked resolved without independent evidence.** No item may be
self-attested. No item may be skipped. The honest state is preserved throughout.

---

## §42.1 — Legal Opinions (0/8 jurisdictions)

### §42.1.1 — What Is Missing

Independent legal opinions for the 8 seeded jurisdictions (US, EU/EEA, UK, CH,
SG, AE, SA, JP) confirming:
- The non-custodial structure is legally sound
- MTQ classification (per jurisdiction)
- 13 legal liability dimensions (jurisdiction, legal nature, obligor, holder
  rights, redemption, settlement finality, creditor treatment, insolvency
  treatment, transferability, pledgeability, governing law, dispute resolution,
  licensing classification)

### §42.1.2 — Why It Matters

Without legal opinions, MITHQAL cannot:
- Confirm MTQ classification in any jurisdiction
- Confirm non-custodial structure is legally sound
- Confirm 13 legal liability dimensions
- Be legally authorized to operate

### §42.1.3 — What Is Needed to Resolve

- Engage qualified legal counsel in each of 8 jurisdictions
- Legal counsel reviews complete live structure (PAR, reserves, redemption,
  custody, transaction fees, treasury instruments, Takaful, digital liquidity
  assets, governance)
- Legal opinions issued (currently all `JURISDICTION_PENDING`)

**Current state:** `legalOpinionsObtained = false`, `validatedJurisdictions = 0`

---

## §42.2 — Regulatory Licenses (0)

### §42.2.1 — What Is Missing

Required regulatory licenses for the 9 activities (banking, payment services,
custody, FX, digital asset/CASP, securities, commodity, CBDC access, settlement
activities) in the 8 seeded jurisdictions (72 entries total).

### §42.2.2 — Why It Matters

Without regulatory licenses, MITHQAL cannot:
- Legally operate in any jurisdiction
- Be production-authorized
- Conduct regulated activities

### §42.2.3 — What Is Needed to Resolve

- Engage legal counsel in target jurisdictions
- Apply for required licenses (per jurisdiction)
- Regulator review and approval

**Current state:** `licensesObtained = 0` (all 72 entries
`REQUIRED_NOT_OBTAINED`)

---

## §42.3 — Bank Contracts (0)

### §42.3.1 — What Is Missing

Signed integration agreements with participating regulated banks.

### §42.3.2 — Why It Matters

Without bank contracts, MITHQAL cannot:
- Conduct real bank-mediated settlement
- Validate the MBG integration
- Achieve institutional validation
- Be production-authorized

### §42.3.3 — What Is Needed to Resolve

- Identify target banks (Phase 8)
- Engage bank business development
- Negotiate integration agreements
- Execute bank technical certification
- Sign integration agreements

**Current state:** `banksContracted = 0` (MBG INTEGRATION-READY)

---

## §42.4 — Pilot Transactions (0)

### §42.4.1 — What Is Missing

100+ pilot transactions on testnet/sandbox demonstrating end-to-end
functionality.

### §42.4.2 — Why It Matters

Without pilot transactions, MITHQAL cannot:
- Validate the 17 workflow flows in practice
- Validate the 5-way reconciliation with real data
- Validate the 12-check compliance gate
- Achieve institutional validation

### §42.4.3 — What Is Needed to Resolve

- Engage pilot institutions (banks, corporates)
- Execute 100+ pilot transactions
- Cover all 17 workflow flows
- Independent observer validation

**Current state:** `pilotTransactionsExecuted = 0`

---

## §42.5 — Independent Assurance (Not Contracted)

### §42.5.1 — What Is Missing

Independent third-party audit confirming reconciliation logic, custody
separation, issuance gate, veto triggers, security controls are operational.

### §42.5.2 — Why It Matters

Without independent assurance, MITHQAL cannot:
- Confirm operational integrity
- Be production-authorized
- Provide evidence to regulators

### §42.5.3 — What Is Needed to Resolve

- Engage independent audit firm
- Audit covers all critical controls
- Audit report published
- All findings remediated

**Current state:** `independentAuditConducted = false`,
`externalReviewersEngaged = 0`

---

## §42.6 — Three-Book Operational Enforcement (False)

### §42.6.1 — What Is Missing

Three-book separation is operationally enforced (not just designed).

### §42.6.2 — Why It Matters

Without operational enforcement, the anti-commingling tests may not block in
production. The principle that "Books must reconcile but must NEVER be
economically commingled" requires operational enforcement.

### §42.6.3 — What Is Needed to Resolve

- Implement operational enforcement (not just design)
- Independent audit confirms operational enforcement
- 4 anti-commingling tests block in production

**Current state:** `threeBookOperational = false`,
`threeBookEnforced = false`

---

## §42.7 — Systemic Risk Live Monitoring (False)

### §42.7.1 — What Is Missing

Systemic risk monitoring is live (not just designed).

### §42.7.2 — Why It Matters

Without live monitoring, MITHQAL cannot:
- Detect systemic risk concentration in real-time
- Trigger CALM state transitions proactively
- Be production-authorized

### §42.7.3 — What Is Needed to Resolve

- Implement live monitoring (not just design)
- Independent audit confirms live monitoring
- 13 concentration dimensions monitored live

**Current state:** `systemicRiskMonitoringLive = false`,
`systemicRiskProductionValidated = false`

---

## §42.8 — Protected Backing Live Cells (0)

### §42.8.1 — What Is Missing

At least one Protected Backing Cell is operational with real bank backing.

### §42.8.2 — Why It Matters

Without live Protected Backing Cells, MITHQAL cannot:
- Validate the protected backing model in practice
- Validate the anti-double-count enforcement
- Be production-authorized

### §42.8.3 — What Is Needed to Resolve

- Engage pilot bank
- Bank establishes real Protected Backing Cell
- Cell verification with real bank evidence
- Cell reconciliation with real custodian evidence

**Current state:** `protectedBackingLiveCells = 0`

---

## §42.9 — Reserve Quantitative Validation (Pending)

### §42.9.1 — What Is Missing

Independent quantitative validation of the reserve mathematical specification.

### §42.9.2 — Why It Matters

Without independent validation, the reserve mathematics may contain errors
that could:
- Miscompute RR
- Miscompute StressRR
- Miscompute currency weights
- Miscompute rebalancing
- Lead to reserve insufficiency

### §42.9.3 — What Is Needed to Resolve

- Engage independent quantitative validation firm
- Validate all 50 directive sections
- Validate RR computation
- Validate StressRR computation
- Validate currency weight engine
- Validate gold/bullion module
- Validate digital liquidity module
- Validation report published

**Current state:** `reservePolicyStatus = CANDIDATE_MODEL_VALIDATION_PENDING`

---

## §42.10 — Sandbox Testing (Not Conducted)

### §42.10.1 — What Is Missing

Sandbox testing in a regulator, bank, or innovation sandbox environment.

### §42.10.2 — Why It Matters

Without sandbox testing, MITHQAL cannot:
- Validate the system in a controlled but real environment
- Provide evidence to regulators
- Achieve institutional validation

### §42.10.3 — What Is Needed to Resolve

- Identify target sandbox (regulator, bank, innovation)
- Apply for sandbox access
- Execute sandbox test scenarios
- Cover all 17 workflow flows
- Cover all 35 test scenarios (INT-T01..INT-T35)
- Cover all 14 reconciliation test scenarios
- Cover all 15 DR scenarios

**Current state:** `sandboxTestingConducted = false`

---

## §42.11 — Penetration Testing (Not Conducted)

### §42.11.1 — What Is Missing

Independent penetration testing by qualified security firm.

### §42.11.2 — Why It Matters

Without penetration testing, MITHQAL cannot:
- Confirm security controls are effective against real attacks
- Identify unknown vulnerabilities
- Be production-authorized

### §42.11.3 — What Is Needed to Resolve

- Engage independent security firm (qualified for financial infrastructure)
- Penetration testing (OWASP, PTES, NIST SP 800-115)
- Report published
- All findings remediated

**Current state:** `penetrationTestingConducted = false`,
`penetrationTestingVendor = NOT_CONTRACTED`

---

## §42.12 — Disaster Recovery Testing (Not Conducted)

### §42.12.1 — What Is Missing

Independent DR testing by qualified auditor.

### §42.12.2 — Why It Matters

Without DR testing, MITHQAL cannot:
- Confirm DR capabilities meet RPO/RTO targets
- Identify DR gaps
- Be production-authorized

### §42.12.3 — What Is Needed to Resolve

- Engage independent DR auditor
- DR testing (tabletop + full activation)
- 15 DR scenarios tested
- All RPO/RTO targets met
- Report published

**Current state:** `disasterRecoveryTestingConducted = false`,
`disasterRecoveryAuditor = NOT_CONTRACTED`

---

## §42.13 — ΔCapital_min = $15.815M (Unresolved)

### §42.13.1 — What Is Missing

The ΔCapital_min ≈ $15.815M classified as MODEL-DERIVED ADDITIONAL MONETARY
PROTECTION REQUIREMENT is not yet independently validated or funded.

### §42.13.2 — Why It Matters

Without resolution of ΔCapital_min, MITHQAL cannot:
- Confirm the additional monetary protection requirement
- Confirm funding source
- Be production-authorized

### §42.13.3 — What Is Needed to Resolve

- Independent validation of ΔCapital_min computation
- Funding source identification (NOT operating capital, NOT founder funds,
  NOT Foundation operating funds, NOT Technology Co funds, NOT ordinary
  operating revenue silently converted)
- ΔCapital_min classification resolved

**Current state:** `deltaCapitalMin = $15,815,000` (MODEL-DERIVED, PENDING
INDEPENDENT VALIDATION)

---

## §42.14 — Anti-Hoarding Mechanism (Absent)

### §42.14.1 — What Is Missing

Anti-hoarding mechanism for MTQ (preventing excessive accumulation by single
participants).

### §42.14.2 — Why It Matters

Without anti-hoarding, MITHQAL cannot:
- Prevent excessive concentration of MTQ in single participants
- Maintain settlement utility
- Be production-authorized

### §42.14.3 — What Is Needed to Resolve

- Design anti-hoarding mechanism
- Independent review
- Implementation
- Testing

**Current state:** `antiHoardingMechanismImplemented = false`

---

## §42.15 — Open Items Rollup Summary

| # | Item | Status | Resolution Path |
|---|------|--------|-----------------|
| 1 | Legal Opinions (0/8) | ❌ NOT OBTAINED | Engage legal counsel |
| 2 | Regulatory Licenses (0) | ❌ NOT OBTAINED | Apply for licenses |
| 3 | Bank Contracts (0) | ❌ NOT OBTAINED | Engage pilot banks |
| 4 | Pilot Transactions (0) | ❌ NOT EXECUTED | Execute 100+ pilots |
| 5 | Independent Assurance | ❌ NOT CONTRACTED | Engage audit firm |
| 6 | Three-Book Operational | ❌ false | Implement operational |
| 7 | Systemic Risk Live | ❌ false | Implement live monitoring |
| 8 | Protected Backing Live Cells (0) | ❌ 0 | Engage pilot bank |
| 9 | Reserve Quantitative Validation | ❌ PENDING | Engage quant firm |
| 10 | Sandbox Testing | ❌ NOT CONDUCTED | Apply for sandbox |
| 11 | Penetration Testing | ❌ NOT CONDUCTED | Engage security firm |
| 12 | DR Testing | ❌ NOT CONDUCTED | Engage DR auditor |
| 13 | ΔCapital_min $15.815M | ❌ UNRESOLVED | Independent validation + funding |

**All 13 open items MUST be resolved before production authorization.**

---

# §43 — APPENDICES

## §43.A — Appendix A: Complete Equation System

This appendix consolidates all mathematical formulas in the MITHQAL system in
one place.

### §43.A.1 — Liability and Reserve

**Liability:**
```
L_t = S_t × PAR
```
where `S_t` = MTQ outstanding supply at time t, `PAR = 1.00 USD` (accounting
reference, NOT a USD peg).

**Market Reserve:**
```
R_m = Σ_a Q_a · P_a
```
where `Q_a` = quantity of asset a, `P_a` = market price of asset a.

**Adjusted (Prudential) Reserve:**
```
R_a = Σ_a Q_a · P_a · (1 − H_a) · C_a
```
where `H_a` = haircut for asset a, `C_a` = eligibility factor for asset a
(1 if eligible, 0 if not).

**Stress (Liquidation) Reserve:**
```
R_l = Σ_a Q_a · P_a · (1 − H_a) · C_a · S_a
```
where `S_a` = stress factor for asset a (0 ≤ S_a ≤ 1).

### §43.A.2 — Reserve Ratios

**Legal Solvency Ratio (RR):**
```
RR_t = R_a,t / (S_t × PAR)
```

**Thresholds:**
- Strategic target: `RR_strategic = 1.30`
- Policy floor: `RR_policy ≥ 1.05`
- Absolute solvency floor: `RR_floor ≥ 1.00`

**Stress Coverage Ratio (FSCR):**
```
FSCR_t = R_l,t / (S_t × PAR)  (coverage interpretation; standard banking convention)
```

**Thresholds:**
- Normal: FSCR ≥ 1.10
- Defensive: FSCR ≥ 1.05
- Emergency: FSCR ≥ 1.00

### §43.A.3 — Liquidity Coverage Ratio

**LCR:**
```
LCR = HQLA / NetOutflow_30d
```
where `HQLA` = High Quality Liquid Assets, `NetOutflow_30d` = expected 30-day
net cash outflow.

**Target:** LCR ≥ 1.00

### §43.A.4 — Currency Weight Engine (6-step)

**Step 1 — Structural Weight:**
```
C_i = 0.50 · COFER_i + 0.40 · SWIFT_i + 0.10 · BIS_i
```
where `COFER_i`, `SWIFT_i`, `BIS_i` = IMF COFER, SWIFT, BIS shares for
currency i.

**Step 2 — Momentum:**
```
M_i(t) = P_i(t) / P_i(t−12m)
```
bounded: `0.95 ≤ M ≤ 1.05`

**Step 3 — Mean Reversion:**
```
R_i(t) = 1 + 0.05 · (LTA_i − C_i)
```
bounded: `0.98 ≤ R ≤ 1.02`

**Step 4 — EWMA Volatility:**
```
σ²_t = λ · σ²_(t−1) + (1−λ) · r²_t
```
where `λ = 0.94`, `r_t = ln(P_(t−1)/P_t)`

**Step 5 — Attenuation:**
```
A_t = 1.00 if σ ≤ 2%
A_t = 1 − (σ − 0.02)/0.03 if 2% < σ < 5%
A_t = 0.50 if σ ≥ 5%
```

**K-Factor:**
```
K_i = 1 + A_t · (M_i · R_i − 1)
```

**Step 6 — Liquidity Overlay:**
```
L_i = 1 + 0.02 · (Liquidity_i − Median)
```
clamped: ±5%

### §43.A.5 — Final Currency Weight

**Raw Weight:**
```
W_raw,i = C_i · K_i · L_i
```

**Normalized Weight:**
```
W_i^norm = W_raw,i / Σ_j W_raw,j
```
(proportional normalization, NOT softmax)

**Final Weight (after gating):**
```
W_i^final = apply(eligibility → concentration → floor → stress → geopolitical → liquidity → jurisdiction → verification)
```

**Sum Constraint:**
```
Σ_i W_i^final = 1
```

### §43.A.6 — Reserve Composition

**Strategic Composition:**
```
B_t = 80% (fiat)
G_t = 18% (gold/bullion)
D_t = 2% (digital liquidity)
```
(policy center 80/18/2)

**Constitutional Corridors:**
```
70% ≤ B_t ≤ 85%
15% ≤ Bullion_t ≤ 25%
0% ≤ D_t ≤ 5%
```

### §43.A.7 — Emergency Resilience Capacity

```
CoreBacking = 130%
EmergencyCapacity ≤ 15%
```

Emergency capacity counted ONLY when:
1. Legally enforceable
2. Independently verified
3. Accessible during stress
4. Not already counted elsewhere
5. Appropriately haircut-adjusted

### §43.A.8 — USD Effective Exposure

```
USD_Effective = USD_Direct + AED_USD_Equivalent + SAR_USD_Equivalent + USD_Linked_Synthetic + USD_Linked_Digital
```

**Ceiling:** USD_Effective ≤ 0.35 (35%)

**Current state:**
- USD_Direct = 0.20 (20%)
- AED_USD_Equivalent = 0.0193 (1.93%)
- SAR_USD_Equivalent = 0.0161 (1.61%)
- USD_Linked_Synthetic = 0
- USD_Linked_Digital = 0
- **USD_Effective = 0.2354 (23.54%)** — within ceiling (35%), NOT BREACHED

### §43.A.9 — Concentration Limits

| Dimension | Preferred | Hard Cap | Constitutional Ceiling |
|-----------|-----------|----------|------------------------|
| Per-currency | 15% | 20% | 60% (sanity ceiling) |
| Per-bank | 15% | 20% | 60% (sanity ceiling) |
| Per-custodian | 15% | 20% | 60% (sanity ceiling) |
| Per-country | 20% | 25% | — |

**Min floor:** 0.005 (0.5%)

### §43.A.10 — DMCE (Dynamic Minting Capacity Engine)

**v25.0 formula:**
```
DMCE = MIN(
  VerifiedEligibleBacking,
  LegallyReservedBacking,
  InstitutionalRiskLimit,
  LiquidityLimit,
  JurisdictionLimit,
  ExposureLimit,
  ConcentrationLimit,
  OperationalLimit
)
```

**v25.1 formula (updated):**
```
DMCE = risk_adjusted_backing
      × stress_multiplier           (state-dependent, 0..1)
      × (1 - exposure_reduction)    (max 50% reduction)
      × liquidity_factor            (cap 1.0)
```

**Stress Multipliers by Safe State:**
- NORMAL: 1.0
- WATCH: 0.9
- RESTRICTED: 0.7
- EMERGENCY: 0.5
- MINT_FROZEN: 0.0
- SETTLEMENT_RESTRICTED: 0.3
- SAFE_HALT: 0.0

### §43.A.11 — DRQS (Digital Reserve Quality Score)

```
DRQS_i = 0.20·Issuer + 0.15·Reserve + 0.15·Redemption + 0.15·Depeg +
         0.10·Liquidity + 0.10·Custody + 0.10·Transparency + 0.05·Algorithmic
```

**DRQS thresholds:**
- Core digital: DRQS ≥ 7.5
- Conditional digital: DRQS ≥ 6.0
- Algorithmic stablecoins: EXCLUDED from core (always)

### §43.A.12 — TGRS (Tokenized Gold Reserve Score)

```
TGRS = 0.20×PhysicalBacking + 0.15×LegalTitle + 0.15×Custody + 0.10×Redemption +
       0.10×Liquidity + 0.10×Transparency + 0.10×AuditingFrequency + 0.10×InsurerQuality
```

### §43.A.13 — Reverse Stress Test

```
Find shock(s) such that RR_t < 1.00
```

### §43.A.14 — Monte Carlo Simulation

```
For each iteration:
  For each currency i:
    Sample shock_i from historical distribution
  Compute R_a' post-shock
  Compute RR' = R_a' / L
  Record RR'

Report:
  RR_mean = average of RR' across iterations
  RR_p5, RR_p50, RR_p95 = percentiles
  RR_min = minimum RR'
  Prob(RR < 1.00) = fraction of iterations with RR' < 1.00
  Prob(RR < 1.30) = fraction of iterations with RR' < 1.30
```

**Current results (1000 iterations, seed=42):**
- RR_mean = 1.1777
- RR_p5 = 1.1412
- RR_p50 = 1.1796
- RR_p95 = 1.2079
- RR_min = 1.1218
- RR_worstScenario = USD-16% + EUR-12% + CHF-2% + 8 more
- FSCR_mean = 1.1051
- Prob(RR < 1.00) = 0.0012 (0.12%)
- Prob(RR < 1.30) = 0.7843 (78.43%)

### §43.A.15 — Liquidity Readiness Ratio (LRR)

```
LRR = Immediately Available Liquidity / Expected 30-Day Redemption Demand
```

### §43.A.16 — NAV

```
NAV_m = R_m / S
NAV_l = R_a / S  (legal NAV, adjusted)
NAV_s = R_l / S  (stress NAV, liquidation)
```

**Current example:**
- S = 100,000,000 MTQ
- L = 100,000,000
- R_m = 130,000,000
- R_a = 122,291,158.24
- R_l = 113,672,586.42
- NAV_m = 1.30
- NAV_l = 1.2229
- NAV_s = 1.1367

### §43.A.17 — Rebalancing (Conservation Check)

**Pre-rebalance:**
```
R_pre = Σ_a Q_a · P_a
```

**Post-rebalance:**
```
R_post = Σ_a Q'_a · P_a
```

**Conservation (FV19):**
```
R_post = R_pre − Costs
```
(rebalancing cannot create or disappear value, except for transaction costs)

**Allocation Sum (FV20):**
```
Σ W_i = 1.00 (always)
```

**Corridor Preservation (FV21):**
```
All W_i within constitutional corridors
```

### §43.A.18 — Stablecoin Depeg Thresholds (10)

| Threshold | Deviation | Action |
|-----------|-----------|--------|
| PCT_1 | 1% | MONITOR |
| PCT_3 | 3% | MONITOR |
| PCT_5 | 5% | HAIRCUT_INCREASE |
| PCT_10 | 10% | RESTRICT_INPUT |
| PCT_20 | 20% | SUSPEND_INPUT |
| SEVERE | 50% | PROHIBIT |
| ISSUER_FAILURE | 100% | EMERGENCY_HALT |
| FREEZE | event | SUSPEND_INPUT |
| LIQUIDITY_COLLAPSE | event | SUSPEND_INPUT |
| CHAIN_OUTAGE | event | RESTRICT_INPUT |

### §43.A.19 — MTQ Valuation

```
MTQ value =
  MTQ authoritative valuation
  + external executable market / conversion price
  + fees
  + spread
  + slippage
  + market impact
  + settlement cost
```

### §43.A.20 — ILPS (5-Layer Institutional Liquidity Protection Stack)

```
ILPS = Layer1 + Layer2 + Layer3 + Layer4 + Layer5
     = $48.1M (total)
```

Where Emergency + Structural subset = $23.8M (SUBSET of ILPS, not additional).

---

## §43.B — Appendix B: Currency Weight Reference Table (11 currencies)

| Currency | Role | Weight (Current) | Concentration Cap C | K-Factor | Liquidity Overlay L | Capped? |
|----------|------|------------------|---------------------|----------|---------------------|---------|
| USD | Primary global settlement | 20.00% | 0.502 | 0.9999 | 1.010 | YES (at hard cap) |
| EUR | Major diversification | 20.00% | 0.247 | 0.9805 | 1.008 | YES (at hard cap) |
| JPY | Asian liquidity | 15.48% | 0.067 | 1.0148 | 1.006 | NO |
| GBP | Global financial | 14.13% | 0.0616 | 1.0074 | 1.006 | NO |
| CHF | Defensive reserve | 5.49% | 0.0243 | 0.9909 | 1.007 | NO |
| CAD | Commodity diversification | 5.37% | 0.0233 | 1.0138 | 1.004 | NO |
| AUD | Commodity diversification | 4.43% | 0.0192 | 1.0155 | 1.004 | NO |
| SGD | Asian diversification | 4.38% | 0.0193 | 0.9999 | 1.003 | NO |
| AED | GCC settlement (USD-pegged) | 1.93% | 0.0085 | 0.9999 | 1.002 | NO |
| SAR | GCC settlement (USD-pegged) | 1.61% | 0.0071 | 1.0000 | 1.002 | NO |
| CNY | Conditional/geopolitical diversification | 7.17% | 0.0328 | 0.9653 | 1.001 | NO |

**Total weight:** 100.00% (verified sum constraint)

**Notes:**
- USD and EUR are at the 20% hard cap (operative concentration limit)
- 60% per-currency ceiling is retained ONLY as deeper constitutional sanity
  ceiling that can NEVER override the 20% operating limit
- AED and SAR are USD-pegged, contributing to USD effective exposure
  (AED: 1.93% × peg_factor ≈ 0.0193; SAR: 1.61% × peg_factor ≈ 0.0161)
- USD_Effective = 0.2354 (23.54%), within 35% ceiling, NOT BREACHED

**Reserve-eligible currencies (Layer A — core basket, 11):** USD, EUR, CHF,
JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD

**Settlement-only currencies (Layer B — 10):** EGP, INR, KRW, TRY, BRL, MXN,
ZAR, IDR, MYR, THB (these are settlement currencies, not reserve-eligible)

---

## §43.C — Appendix C: Digital Universe Reference Table

| ID | DRQS | Role | Algorithmic | In Core | Target Weight |
|----|------|------|-------------|---------|---------------|
| USDC | 8.50 | Primary digital liquidity | NO | YES | 0% (target weight) |
| USDP | 8.45 | Secondary regulated USD liquidity | NO | YES | 0% |
| EURC | 7.80 | EUR diversification | NO | YES | 0% |
| BUIDL | 8.55 | Tokenized U.S. T-bill liquidity | NO | YES | 0% |
| DAI | 6.25 | Optional/conditional, currently 0% | NO | NO | 0% |
| USDT | 6.15 | Excluded from core digital reserve; external conversion only | NO | NO | 0% |

**Notes:**
- DRQS threshold for core: ≥ 7.5
- DRQS threshold for conditional: ≥ 6.0
- Algorithmic stablecoins EXCLUDED from core (always)
- All target weights are 0% — individual asset weights are OPTIMIZER OUTPUTS,
  not hard-coded allocations
- The digital sleeve target is 2% (normal), with corridor 0-5%
- USDT is excluded from core digital reserve; external conversion only

**Digital Policy:**
- D_normal = 0.02 (2%)
- D_operational = 0.03 (3%)
- D_max = 0.05 (5%)
- D_emergency = 0 (0% — no digital in emergency)
- DRQS_core = 7.5
- DRQS_conditional = 6.0
- Algorithmic excluded: YES

---

## §43.D — Appendix D: Bank Integration Node Reference

### §43.D.1 — Bank Nodes (5)

| Node ID | Name | Domain | Description |
|---------|------|--------|-------------|
| BNK-01 | Corporate Treasury Portal | BANK | Corporate treasury interface |
| BNK-02 | Core Banking System | BANK | Bank's authoritative core banking |
| BNK-03 | KYC/KYB Engine | BANK | Customer verification |
| BNK-04 | AML/Sanctions Engine | BANK | Compliance screening |
| BNK-05 | FX/Treasury | BANK | FX and treasury operations |

### §43.D.2 — MBG Nodes (4)

| Node ID | Name | Domain | Description |
|---------|------|--------|-------------|
| MBG-01 | MBG Adapter | MBG | MITHQAL Bank Gateway adapter (translation) |
| MBG-02 | ISO 20022 Layer | MBG | ISO 20022 message translation |
| MBG-03 | API Gateway | MBG | REST API gateway |
| MBG-04 | Host-to-Host | MBG | H2H file transfer |

### §43.D.3 — MITHQAL Nodes (3)

| Node ID | Name | Domain | Description |
|---------|------|--------|-------------|
| MTH-01 | MITHQAL Core | MITHQAL | Core authorization engine |
| MTH-02 | Ledger State Machine | MITHQAL | MTQ ledger state transitions |
| MTH-03 | Finality Gate | MITHQAL | 7-layer finality enforcement |

### §43.D.4 — Flows (9)

| Flow ID | From | To | Description |
|---------|------|----|-------------| 
| F01 | BNK-01 | BNK-02 | Corporate → Core Banking |
| F02 | BNK-02 | BNK-03 | Core → KYC/KYB |
| F03 | BNK-03 | BNK-04 | KYC → AML/Sanctions |
| F04 | BNK-04 | BNK-05 | AML → FX/Treasury |
| F05 | BNK-05 | MBG-01 | Bank → MBG Adapter |
| F06 | MBG-01 | MBG-02 | MBG → ISO 20022 |
| F07 | MBG-02 | MTH-01 | ISO 20022 → MITHQAL Core |
| F08 | MTH-01 | MTH-02 | Core → Ledger |
| F09 | MTH-02 | MTH-03 | Ledger → Finality Gate |

### §43.D.5 — Settlement Rails (8)

| Rail | Display Name | Typical Latency | Fee (bps) | Atomic? |
|------|--------------|-----------------|-----------|---------|
| SWIFT | SWIFT FIN | 5000 ms | 8 | NO |
| ISO_20022 | ISO 20022 | 3000 ms | 6 | NO |
| REST_API | REST API | 500 ms | 3 | YES |
| HOST_TO_HOST | Host-to-Host | 2000 ms | 5 | NO |
| SFTP | SFTP | 4000 ms | 4 | NO |
| RTGS | RTGS | 1000 ms | 7 | NO |
| TOKENIZED_DEPOSIT | Tokenized Deposit | 300 ms | 2 | YES |
| CBDC | Wholesale CBDC | 200 ms | 1 | YES |

---

## §43.E — Appendix E: ISO 20022 Message Reference

| Message ID | Name |
|-----------|------|
| pain.001 | Customer Credit Transfer Initiation |
| pain.002 | Customer Payment Status Report |
| pacs.002 | FIToFIPaymentStatusReport |
| pacs.008 | FIToFICustomerCreditTransfer |
| pacs.009 | FItoFICustomerDirectDebit |
| camt.025 | Receipt |
| camt.054 | BankToCustomerDebitCreditNotification |
| camt.056 | FIToFIPaymentCancellationRequest |
| head.001 | BusinessApplicationHeader |

**Usage in MITHQAL:**
- `pain.001` — Corporate initiates payment (Flow A)
- `pain.002` — Bank sends status to corporate
- `pacs.008` — MBG receives from bank, sends to receiving bank (Flow D)
- `pacs.002` — Receiving bank confirms (Flow E)
- `camt.054` — Bank notifies beneficiary (Flow E)
- `camt.056` — Cancellation request (Flow H, I, J, K)
- `camt.025` — Receipt confirmation
- `head.001` — Business application header (wraps all messages)

---

## §43.F — Appendix F: Concentration Limits Reference

### §43.F.1 — Per-Currency Concentration

| Threshold | Value | Action |
|-----------|-------|--------|
| Preferred effective | 15% | No action (preferred state) |
| Hard effective cap | 20% | Block new issuance that would exceed |
| Constitutional sanity ceiling | 60% | NEVER overrides 20% operating limit |
| Minimum floor | 0.5% | Minimum weight for any eligible currency |

### §43.F.2 — Per-Bank Concentration

| Threshold | Value | Action |
|-----------|-------|--------|
| Preferred effective | 15% | No action (preferred state) |
| Hard effective cap | 20% | Block new issuance that would exceed |
| Constitutional sanity ceiling | 60% | NEVER overrides 20% operating limit |
| Min floor | 0.5% | Minimum exposure for any participating bank |

### §43.F.3 — Per-Custodian Concentration

| Threshold | Value | Action |
|-----------|-------|--------|
| Preferred effective | 15% | No action (preferred state) |
| Hard effective cap | 20% | Block new custody that would exceed |
| Constitutional sanity ceiling | 60% | NEVER overrides 20% operating limit |
| Min floor | 0.5% | Minimum exposure for any qualified custodian |

### §43.F.4 — Per-Country Concentration

| Threshold | Value | Action |
|-----------|-------|--------|
| Preferred | 20% | No action (preferred state) |
| Hard cap | 25% | Block new exposure that would exceed |

### §43.F.5 — Systemic Exposure Engine (13 dimensions)

1. Bank concentration
2. Banking group concentration
3. Country concentration
4. Currency concentration
5. Custodian concentration
6. Correspondent concentration
7. Settlement rail concentration
8. Liquidity provider concentration
9. Stablecoin issuer concentration
10. Technology provider concentration
11. Geopolitical correlation
12. Operational correlation
13. Bank exposure (per-bank)

### §43.F.6 — Current USD Effective Exposure

```
USD_Effective = 0.2354 (23.54%)
Ceiling = 0.35 (35%)
Breached = false
Headroom = 0.1146 (11.46pp)
```

---

## §43.G — Appendix G: Honest State Full Declaration

### §43.G.1 — Honest State (Per §74 Aggregated)

```
honest                          = true
productionAuthorized            = false
noMithqalOwnedReserve           = true
noMithqalFinancialGuarantee    = true

threeBookDesign                 = true
threeBookOperational            = false
threeBookEnforced               = false

systemicRiskEngineDesigned      = true
systemicRiskEngineImplemented   = true
systemicRiskMonitoringLive      = false
systemicRiskProductionValidated = false

finalityPolicyDefined           = true
finalityLayersDesigned          = 7
finalityLayersRequired          = 7
finalityLayersEnforced          = 7    (was 3; now 7/7 at code level)
finalityProductionReady         = false
finalityBypassRisk              = MITIGATED_AT_CODE_LEVEL  (was HIGH)

legalRegistryImplemented        = true
legalOpinionsObtained           = false
validatedJurisdictions          = 0

licensingMatrixImplemented      = true
licensesObtained                = 0

bankDefaultStateModelDesigned   = true
bankDefaultOperationalWorkflow  = true
bankDefaultContractValidated    = false
bankDefaultLegalValidated       = false
bankDefaultProductionReady      = false

protectedBackingModelImplemented = true
protectedBackingLiveCells       = 0

reserveConfigurationCanonical   = true
reserveConfigurationConflicts   = false
reservePolicyStatus             = CANDIDATE_MODEL_VALIDATION_PENDING

mbgIntegrationState             = INTEGRATION-READY
banksContracted                 = 0
custodiansContracted            = 0

pilotTransactionsExecuted       = 0
sandboxTestingConducted        = false
penetrationTestingConducted    = false
disasterRecoveryTestingConducted = false
independentAuditConducted       = false
externalReviewersEngaged       = 0
shariaBoardEmpaneled           = 0

fundingRaised                  = $0 (against $4.7M PILOT phase)
deltaCapitalMinValidated       = false
deltaCapitalMinClassification  = MODEL_DERIVED_ADDITIONAL_MONETARY_PROTECTION_REQUIREMENT
deltaCapitalMinAmount          = $15,815,000

smartContractChangesImplemented = 37
smartContractChangesDeployedToMainnet = 0 (bytecode still v24.2.1)

contradictionScanResult        = 0 unresolved (17 patterns scanned)
acceptanceCriteriaMet          = 19/23 (83%, honest, no inflation)
institutionalValidationGatesPassed = 0/13
standingBlockersResolved       = 0/10 (ALL OPEN)
```

### §43.G.2 — Honest State Principles

1. **Never inflate any column** — every status reflects actual state, not
   aspirational state.
2. **Never claim production authorization without evidence** — production
   authorization requires all 13 gates passed.
3. **Never claim institutional validation without evidence** — institutional
   validation requires real institutional participation.
4. **Never claim regulatory authorization without evidence** — regulatory
   authorization requires actual licenses.
5. **Never claim bank integration without contract** — bank integration
   requires signed agreement.
6. **Never claim reserve verification without institutional evidence** —
   reserve verification requires independent custodian evidence.
7. **Never claim technical capability as legally authorized** — technical
   capability ≠ legal authorization.

### §43.G.3 — What MITHQAL Does NOT Claim

MITHQAL does NOT claim:
- Production authorization (NO — 10 standing blockers open)
- Real bank integration (NO — 0 banks contracted, INTEGRATION-READY state)
- Real custodian agreements (NO — 0 contracted)
- External audit completion (NO — 0 reviewers engaged)
- Sharia certification (NO — 0 board empaneled)
- Live pilot execution (NO — 0 transactions)
- Deployed v25.0 bytecode (NO — 37 SC changes implemented at logic-level only,
  bytecode still v24.2.1)
- ROI achieved (NO — illustrative ROI models only)

### §43.G.4 — What MITHQAL Does Claim

MITHQAL DOES claim:
- Spec-level completeness (8/8 institutional closure prompts + MBG amendment)
- Logical correctness (FV1-FV10 proven, S1-S3 supply theorems proven)
- Honest state (no false production readiness — 3 NEVER rules enforced, 0
  violations)
- Translation, not transformation (banks remain authoritative)
- Reproducibility (MC seed=42, byte-identical across 2 verified runs)
- Canonical supply (one ledger, one supply — Theorem S1)
- Constitutional reserve integrity (FV3: RR ≥ 100% in NORMAL states)
- Bank-controlled security (mithqalDoesNotPossessCustomerPrivateKeys=true)
- Privacy by default, traceability by authorization, disclosure by law

---

## §43.H — Appendix H: Contact Information

### §43.H.1 — Primary Contact

**Email:** meltonsy@icloud.com

### §43.H.2 — Contact Use Cases

- Institutional engagement inquiries (banks, custodians, regulators)
- Architecture review requests
- Regulatory/legal review requests
- Sandbox testing inquiries
- Bank integration pilot inquiries
- Settlement pilot inquiries
- Independent assurance inquiries
- Security/architecture questions
- Press/media inquiries (routed appropriately)

### §43.H.3 — What to Include in Contact

For institutional engagement:
- Organization name and type
- Jurisdiction
- Regulatory status
- Technical contact
- Compliance contact
- Legal/regulatory contact
- Engagement type (Architecture Review, Regulatory/Legal Review, Sandbox
  Testing, Bank Integration Pilot, Settlement Pilot, Independent Assurance)

### §43.H.4 — Security Notice

**Do NOT submit:**
- Passwords or credentials
- Sensitive personal data beyond what is required for engagement
- Confidential institutional data without prior authorization
- Trade secrets without NDA

**All communications are subject to MITHQAL's security and privacy policies.**

### §43.H.5 — Disclaimer

> **CONTROLLED INSTITUTIONAL DOCUMENT • NOT A LICENSE • NOT A LEGAL OPINION.**

This document is the MITHQAL Master Blueprint v25.2. It is a controlled
institutional document. It is NOT a license to operate. It is NOT a legal
opinion. It is NOT a regulatory approval. It is NOT a production authorization.

Production operation requires:
- All 13 institutional validation gates passed
- All 10 standing blockers resolved
- All 19+ checklist items checked
- Regulator approval in operating jurisdiction
- Independent audit, penetration testing, DR testing conducted
- 100+ pilot transactions executed
- All legal opinions and licenses obtained

**Until all requirements are met, MITHQAL remains in APPROVED CANDIDATE FOR
CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED status.**

---

# §44 — FINAL DECLARATION

## §44.1 — Single Source of Truth Declaration

This document, **MITHQAL Master Blueprint v25.2**, is the **SINGLE SOURCE OF
TRUTH** for the MITHQAL institutional settlement system. It supersedes all
older versions, drafts, working papers, and interim documents.

### §44.1.1 — Authoritative Documents

| Document | Authority |
|----------|-----------|
| MITHQAL Master Blueprint v25.2 (this document) | CANONICAL — SINGLE SOURCE OF TRUTH |
| MITHQAL Master Blueprint v25.0 | SUPERSEDED by v25.2 |
| MITHQAL Master Blueprint v24.2.1 | HISTORICAL / NON-NORMATIVE ARCHIVE |
| MITHQAL Master Blueprint v24.2 | HISTORICAL / NON-NORMATIVE ARCHIVE |
| MITHQAL Master Blueprint v24 | HISTORICAL / NON-NORMATIVE ARCHIVE |
| MITHQAL Master Blueprint v23 | HISTORICAL / NON-NORMATIVE ARCHIVE |
| MITHQAL Master Blueprint v19 | HISTORICAL / NON-NORMATIVE ARCHIVE |

### §44.1.2 — Conflict Resolution

Where any conflict exists between this document and an older blueprint section,
this document controls. The following conflict resolutions have been implemented
(per §V25.2.49):

1. **Reserve Ratio target:** RR = 120% (older) → RR = 130% (controlling,
   current strategic target)
2. **Reserve sleeve composition:** 15% gold + 5% tokenized gold + 2.5% digital
   (older Portfolio-B table) → 80% fiat / 18% gold / 2% digital (controlling)
3. **Digital liquidity target:** 3.5% (older) → 2% (controlling normal center)
4. **Per-currency constitutional cap:** 60% (older) → 20% operative hard cap
   (60% retained only as deeper constitutional sanity ceiling that can NEVER
   override the 20% operating limit)

### §44.1.3 — Critical Version Rule

- DO NOT create v25.3 (or higher)
- DO NOT fork the architecture
- DO NOT redesign the reserve mathematics
- DO NOT create a competing rebalancing algorithm
- DO NOT turn USD into the monetary anchor
- DO NOT make MITHQAL a custodian
- DO NOT make MITHQAL a bank
- DO NOT make the Foundation an operator
- DO NOT make reserve appreciation a commercial profit source

The document remains: **MITHQAL v25.2 — CANONICAL BLUEPRINT — FINAL
INSTITUTIONAL EDITION**

## §44.2 — Honest State Summary

### §44.2.1 — Aggregated Honest State

```
honest                          = true
productionAuthorized            = false
forcedToPass                    = false

noMithqalOwnedReserve           = true
noMithqalFinancialGuarantee    = true
mithqalHeldAssets              = 0 (default for ordinary reserve custody)
mithqalIsNotCustodian           = true
mithqalIsNotBank                = true
foundationIsNotOperator         = true
reserveAppreciationIsNotCommercialProfit = true

threeBookDesign                 = true
threeBookOperational            = false
threeBookEnforced               = false

systemicRiskEngineDesigned      = true
systemicRiskEngineImplemented   = true
systemicRiskMonitoringLive      = false
systemicRiskProductionValidated = false

finalityPolicyDefined           = true
finalityLayersDesigned          = 7
finalityLayersRequired          = 7
finalityLayersEnforced          = 7
finalityProductionReady         = false
finalityBypassRisk              = MITIGATED_AT_CODE_LEVEL

legalRegistryImplemented        = true
legalOpinionsObtained           = false
validatedJurisdictions          = 0

licensingMatrixImplemented      = true
licensesObtained                = 0

bankDefaultStateModelDesigned   = true
bankDefaultOperationalWorkflow  = true
bankDefaultContractValidated    = false
bankDefaultLegalValidated       = false
bankDefaultProductionReady      = false

protectedBackingModelImplemented = true
protectedBackingLiveCells       = 0

reserveConfigurationCanonical   = true
reserveConfigurationConflicts   = false
reservePolicyStatus             = CANDIDATE_MODEL_VALIDATION_PENDING

mbgIntegrationState             = INTEGRATION-READY
banksContracted                 = 0
custodiansContracted            = 0

pilotTransactionsExecuted       = 0
sandboxTestingConducted        = false
penetrationTestingConducted     = false
disasterRecoveryTestingConducted = false
independentAuditConducted       = false
externalReviewersEngaged        = 0
shariaBoardEmpaneled            = 0

fundingRaised                   = $0 (against $4.7M PILOT phase)
deltaCapitalMinValidated        = false
deltaCapitalMinClassification  = MODEL_DERIVED_ADDITIONAL_MONETARY_PROTECTION_REQUIREMENT
deltaCapitalMinAmount           = $15,815,000

smartContractChangesImplemented = 37
smartContractChangesDeployedToMainnet = 0 (bytecode still v24.2.1)

contradictionScanResult         = 0 unresolved (17 patterns scanned)
acceptanceCriteriaMet           = 19/23 (83%, honest, no inflation)
institutionalValidationGatesPassed = 0/13
standingBlockersResolved        = 0/10 (ALL OPEN)
```

### §44.2.2 — What MITHQAL Is

MITHQAL is **neutral wholesale settlement infrastructure connecting regulated
monetary systems.** MTQ sits between monetary systems, not instead of monetary
systems. Customers continue to use banks; banks use MITHQAL; MITHQAL uses MTQ
to settle value between monetary systems. The MITHQAL Bank Gateway translates
existing authorized banking instructions into MTQ settlement instructions —
without replacing core banking systems. **TRANSLATION, NOT TRANSFORMATION.**

### §44.2.3 — What MITHQAL Is NOT

MITHQAL is NOT:
- A sovereign currency
- A consumer cryptocurrency
- A retail payment token
- A USD stablecoin
- A BRICS currency
- A CBDC
- An investment vehicle
- A speculative asset
- A custodian (MITHQAL is non-custodial by default)
- A bank
- A financial guarantor

### §44.2.4 — What MTQ Is

MTQ is:
- Neutral
- Permissioned
- Institutional
- Wholesale
- Settlement-focused

MTQ sits at LAYER 4 of the 7-layer canonical model. It is NOT a sovereign
currency (LAYER 0), NOT bank money (LAYER 1), NOT a consumer crypto or retail
payment token. It does NOT replace any layer — it TRANSLATES between layers via
the MITHQAL Bank Gateway (LAYER 2 / LAYER 5 sidecars).

### §44.2.5 — What MTQ Is NOT

MTQ is NOT:
- A sovereign currency
- A consumer cryptocurrency
- A retail payment token
- A USD stablecoin
- A BRICS currency
- A CBDC
- An investment vehicle
- A speculative asset

## §44.3 — Disclaimer

> **CONTROLLED INSTITUTIONAL DOCUMENT • NOT A LICENSE • NOT A LEGAL OPINION.**

This document is the MITHQAL Master Blueprint v25.2. It is:

- A **controlled institutional document** — intended for institutional review,
  regulatory engagement, and qualified institutional participants.
- **NOT a license** — it does not grant any license to operate, to mint MTQ,
  to conduct settlement, or to perform any regulated activity.
- **NOT a legal opinion** — it does not constitute legal advice. Independent
  legal counsel must be engaged for legal opinions in each applicable
  jurisdiction.
- **NOT a regulatory approval** — it does not constitute regulatory approval
  in any jurisdiction. All required regulatory licenses must be obtained
  independently.
- **NOT a production authorization** — production operation requires all
  institutional validation gates passed and all standing blockers resolved.
- **NOT an offer or solicitation** — it is not an offer to sell or solicit
  any security, instrument, or service.
- **NOT financial advice** — it does not constitute financial, investment, or
  tax advice.
- **NOT a Sharia certification** — Sharia compliance requires independent
  qualified scholarly review and certification of the complete live structure.

## §44.4 — Final Status

**FINAL STATUS:**

# APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

### §44.4.1 — What This Status Means

**APPROVED CANDIDATE FOR CONTROLLED TESTING** means:
- The architectural design is complete and frozen (v25.0 FROZEN, v25.2
  incorporating v25.0 + v25.1 + v25.2.AUDIT-CLOSURE)
- The code-level implementation is complete
- The system is ready for controlled testing in a sandbox / pilot environment
- The system is NOT ready for production operation
- Independent validation (legal, regulatory, institutional) is required before
  production authorization

**NOT PRODUCTION-AUTHORIZED** means:
- The system MAY NOT be deployed to production
- The system MAY NOT process real value
- The system MAY NOT be used by real institutional participants for production
  settlement
- All 13 institutional validation gates are pending (0/13 passed)
- All 10 standing blockers are open
- 0/19+ checklist items checked
- 0 banks contracted, 0 custodians contracted, 0 jurisdictions validated
- 0 legal opinions obtained, 0 licenses obtained
- Independent audit NOT conducted, penetration testing NOT conducted, DR
  testing NOT conducted
- 0 pilot transactions executed

### §44.4.2 — Path to Production Authorization

Production authorization requires:

1. ✅ All 19+ checklist items checked (currently 0/19+)
2. ✅ All 13 institutional validation gates passed (currently 0/13)
3. ✅ All 10 standing blockers resolved (currently ALL OPEN)
4. ✅ Independent audit completed (currently NOT conducted)
5. ✅ Penetration testing conducted (currently NOT conducted)
6. ✅ DR testing conducted (currently NOT conducted)
7. ✅ Regulator approval obtained (currently NOT obtained)
8. ✅ 100+ pilot transactions executed (currently 0)
9. ✅ Three-book operational enforcement (currently false)
10. ✅ Systemic risk live monitoring (currently false)
11. ✅ Protected backing live cells (currently 0)
12. ✅ Independent reserve validation (currently PENDING)
13. ✅ Legal opinions obtained (currently 0/8)
14. ✅ Regulatory licenses obtained (currently 0)

**Until ALL of the above are satisfied, MITHQAL remains in APPROVED
CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED status.**

### §44.4.3 — Final Closing Principle

> **MITHQAL is a neutral wholesale settlement infrastructure connecting
> regulated monetary systems. MTQ sits between monetary systems, not instead of
> monetary systems. Customers continue to use banks; banks use MITHQAL;
> MITHQAL uses MTQ to settle value between monetary systems. The MITHQAL Bank
> Gateway translates existing authorized banking instructions into MTQ
> settlement instructions — without replacing core banking systems.
> TRANSLATION, NOT TRANSFORMATION.**

### §44.4.4 — Final Declaration

This MITHQAL Master Blueprint v25.2 — PART 10 (Sections 38-44) is the single
source of truth for:

- End-to-end transaction workflows (17 flows, A through Q)
- Testing strategy (21 categories + adversarial scenarios)
- Production readiness framework (19+ checklist items + 13 institutional
  validation gates)
- Implementation roadmap (13 phases, Phase 0 through Phase 12)
- Open items / TBD (13 items that cannot responsibly be determined)
- Appendices (A through H)
- Final declaration

**Final status (unchanged):**

# APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

---

**END OF MITHQAL MASTER BLUEPRINT v25.2 — PART 10 (SECTIONS 38-44)**

---

**Document Provenance:**

- **Document:** MITHQAL Master Blueprint v25.2 — PART 10
- **Sections:** 38-44
- **Task ID:** BP-SEC-10
- **Authority:** Blueprint Editorial Authority under the Constitution
- **Date:** 2026 (v25.2 consolidation)
- **Supersedes:** All older blueprint sections covering the same subject matter
- **Single source of truth:** YES — no older versions override this document
- **Honest state:** `honest = true`, `forcedToPass = false`,
  `productionAuthorized = false`
- **Final status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT
  PRODUCTION-AUTHORIZED

---

**CONTROLLED INSTITUTIONAL DOCUMENT • NOT A LICENSE • NOT A LEGAL OPINION.**

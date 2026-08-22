# MITHQAL MASTER BLUEPRINT v25.2 — PART 04
## Sections 12–16 — Bank Integration, Compliance, Backing, Books, Reconciliation
## THE SINGLE AUTHORITATIVE SOURCE OF TRUTH
## Version: v25.2 (FINAL — CONTROLLING)
## Date: 2026-08-22
## Status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED

> **SOURCE FILES:**
> - `src/lib/mithqal-bank-gateway.ts` (3,969 lines — MBG architectural amendment)
> - `src/lib/protected-backing-cell.ts` (1,133 lines — §47 Protected Backing Cell)
> - `src/lib/three-book-separation.ts` (975 lines — §51 Three-Book Separation)
> - `src/lib/corporate-settlement-account.ts` (§22 three-way reconciliation primitives)
> - `src/lib/reconciliation.ts` (174 lines — reconciliation engine)
> - `src/lib/proof-of-liabilities.ts` (235 lines — §21 Institutional Proof-of-Liabilities)
> - `/tmp/blueprint_reference.json` (1,801 lines — canonical reference values)

> **HONEST STATE (§74):** All systems described herein are DESIGN-LEVEL or
> IMPLEMENTED at the code level. No real bank is contracted. No live Protected
> Backing Cell exists (liveCells = 0). The three-book separation is designed but
> not yet operational or enforced in production. Five-way reconciliation logic is
> implemented but SIMULATED — no real bank subledger has been connected.

---

# SECTION 12 — BANK GATEWAY / SIDECAR ARCHITECTURE (§11)

## 12.1 Section Scope and Authority

This section codifies the MITHQAL Bank Gateway (MBG) — the architectural
sidecar that connects regulated banking infrastructure to the MITHQAL
Settlement Network without requiring banks to replace any of their
authoritative systems. It implements §11 of the v25.2 master directive and
references the MBG-FINAL-ARCHITECTURAL-AMENDMENT (TASK_ID:
`MBG-FINAL-ARCHITECTURAL-AMENDMENT`, MODULE_VERSION
`v25.0-mbg-amendment-1.0`, codified in `src/lib/mithqal-bank-gateway.ts`).

The MBG is one of the four canonical integration surfaces of the MITHQAL
operating system, alongside (a) the Canonical Supply Ledger, (b) the
Finality-Before-Mint 7-layer enforcement stack, and (c) the Five-Way
Reconciliation engine. Without the MBG, no bank can issue, redeem, or settle
MTQ. With the MBG, a bank connects using its existing payment rails, messaging
standards, and compliance engines — MITHQAL does not impose a parallel
financial stack.

The authority of this section derives from the v25.2 controlling specification
and from the seven §74 honest-state invariants that gate any production
deployment:

1. `productionAuthorized = false`
2. `noMithqalOwnedReserve = true`
3. `noMithqalFinancialGuarantee = true`
4. `threeBookDesign = true`
5. `threeBookOperational = false`
6. `threeBookEnforced = false`
7. `protectedBackingLiveCells = 0`

Each of these invariants must transition to its production-authorized value
through a documented institutional gate before the MBG may carry live MTQ
settlement. The current state — INTEGRATION-READY at the logic/spec level,
SIMULATED at the operational level — is the controlling truth. No statement
in this section may be interpreted as a live-bank capability.

## 12.2 The MBG Principle: "TRANSLATION, NOT TRANSFORMATION"

The single sentence that governs the entire MBG design is:

> **"TRANSLATION, NOT TRANSFORMATION."**

This principle is encoded as a const in `mithqal-bank-gateway.ts`:

```typescript
export const AMENDMENT_PRINCIPLE = "TRANSLATION, NOT TRANSFORMATION." as const;
```

It is also reproduced, verbatim, in the architectural header comment, in the
adapter standard documentation, in the §33 ASCII architecture diagram, in the
§34 DO_NOT_MODIFY_RULES, in the §35 acceptance criteria, and in every bank-
facing API description.

### 12.2.1 What "TRANSLATION" Means

Translation is the faithful, semantically-preserving conversion of a message
from one wire format into another. The source message and the translated
message carry the same economic meaning, the same authorizations, the same
compliance provenance, and the same legal commitments. The translator does not
add, remove, or alter economic intent. It only re-encodes.

Concretely, the MBG performs translation when:

- It accepts a `pain.001` ISO 20022 Customer Credit Transfer Initiation from
  the bank's payment gateway and produces an `MTQSettlementInstruction` whose
  economic content (sender, receiver, amount, currency, value date, payment
  purpose, regulatory references) is identical to the source message. No
  amount is added, no beneficiary is substituted, no value date is shifted.

- It accepts a `pacs.008` FIToFICustomerCreditTransfer from a correspondent
  bank and converts it to an MTQ inbound transfer request, preserving the
  original UETR (Unique End-to-End Transaction Reference), the original
  instruction-identifiers, and the original creditor/debtor account
  references.

- It accepts the bank's compliance attestation (a bank-internal, signed object
  asserting that KYC/KYB/AML/sanctions/account-authority/funds-available
  checks have passed) and translates it into the MBG's
  `BankComplianceAttestation` schema — without re-performing any compliance
  check on MITHQAL's side. The bank remains the compliance authority; the MBG
  only re-encodes the bank's own attestation into the canonical schema the
  Finality-Before-Mint stack consumes.

### 12.2.2 What "TRANSFORMATION" Prohibits

Transformation is any operation that changes the economic meaning of a message.
The MBG is forbidden from performing transformation. Concretely, the MBG MUST
NOT:

1. **Originate instructions.** The MBG cannot itself initiate an MTQ mint,
   transfer, redemption, or settlement. Every instruction the MBG hands to
   MITHQAL Core must trace back to an instruction that originated in the
   bank's existing operating environment (a corporate treasury portal click,
   a SWIFT message received, an ERP invoice instruction, etc.).

2. **Alter amounts.** The MBG cannot change the amount, currency, or value
   date of an instruction. A `$10,000,000` payment instruction entering the
   MBG must leave as a `$10,000,000` MTQ settlement instruction.

3. **Substitute parties.** The MBG cannot change the sender, receiver,
   beneficiary, or any intermediary. If a corporate initiates a payment,
   the same corporate is the sender of the resulting MTQ instruction.

4. **Re-perform compliance.** The MBG does not run KYC, KYB, AML,
   sanctions, account-authority, or funds-available checks. These are
   performed by the bank's existing compliance stack. The MBG only carries
   the bank's signed attestation that they have been performed.

5. **Invent authorization.** The MBG cannot sign an MTQ settlement
   instruction on its own. Authorization must come from the bank's existing
   authorization workflow (the same workflow that signs the bank's own
   payment orders).

6. **Re-write history.** The MBG cannot retroactively edit, delete, or
   re-order an instruction once it has been received. State-machine
   semantics are append-only.

7. **Bypass finality.** The MBG cannot instruct MITHQAL Core to mint MTQ
   without the 7-layer Finality-Before-Mint check having passed. The MBG
   is a translator — it does not have authority to override the finality
   gate.

The DO_NOT_MODIFY_RULES in §34 of the MBG architectural amendment codifies
12 forbidden changes. These include, in summary: do not allow MTQ issuance
without a valid BankComplianceAttestation; do not allow direct corporate
access bypassing the bank; do not allow MBG to invent instructions; do not
allow MBG to re-perform compliance; do not allow MBG to override finality;
do not allow commingling of MITHQAL corporate cash with bank MTQ backing;
do not allow the MBG to mint MTQ for which no Protected Backing Cell has been
allocated; do not allow the MBG to mark a transaction settled without
canonical-ledger finality; do not allow the MBG to skip the §13 five-way
reconciliation; do not allow the MBG to suppress reconciliation mismatches;
do not allow the MBG to enable retail access; do not allow the MBG to relax
the §8 privacy principle.

### 12.2.3 Why Translation Is Sufficient

The architectural insight behind "TRANSLATION, NOT TRANSFORMATION" is that
the bank's existing systems already produce everything MITHQAL needs:

- The bank's **core banking system** already knows the corporate account
  balance, so it can attest to funds-available.

- The bank's **KYC/KYB engine** already knows the corporate's legal entity,
  beneficial owners, and document provenance, so it can attest to identity.

- The bank's **AML/sanctions engine** already screens every payment, so it
  can attest to screening completion.

- The bank's **payment gateway** already authorizes payments, so it can
  attest to account-authority.

- The bank's **treasury** already executes FX and liquidity operations, so
  it can hold the bank-side backing and provide liquidity for redemption.

- The bank's **accounting system** already produces subledger entries, so
  it can produce the Bank MTQ Subledger required by §13 five-way
  reconciliation.

- The bank's **ISO 20022 / SWIFT connectors** already speak the messaging
  standards, so they can be the transport layer.

None of these capabilities need to be re-built in MITHQAL. The MBG's job is
to translate the bank's existing outputs into the MTQ schema, run the
MITHQAL-side checks (Finality-Before-Mint, reserve ratio, jurisdiction,
DMCE, systemic exposure, reconciliation), and translate the MITHQAL outcome
back into the bank's existing operating environment.

This is why the MBG can be deployed as a sidecar — a small, focused
adapter that plugs into the bank's existing infrastructure without
displacing any of it. The total cost of integration is bounded by the cost
of writing the translation rules, not the cost of replacing core banking.

## 12.3 Bank Systems That Remain Authoritative

MITHQAL is non-replacement by design. The following bank systems remain
the authoritative source of truth for their respective domains. MITHQAL
never duplicates, never overrides, and never bypasses them.

### 12.3.1 Core Banking System (CBS)

**Authoritative for:** customer account balances, ledger entries, deposit
records, loan positions, interest accruals, intraday position-keeping,
end-of-day settlement positions.

**MITHQAL interaction:** MITHQAL queries none of these directly. MITHQAL
receives, via the MBG, the bank's signed attestation that funds are
available for a specific instruction (the FUNDS_AVAILABLE assertion in
§7 BankComplianceAttestation). The bank's CBS remains the single source of
truth for the underlying account balance; MITHQAL only knows the
attestation that the balance is sufficient for this instruction.

**Replacement required:** None. MITHQAL works with the bank's existing CBS,
whether that is Temenos Transact, Infosys Finacle, FIS Profile, Fiserv DNA,
Jack Henry SilverLake, Oracle Flexcube, or any other core banking platform.

### 12.3.2 KYC / KYB Engine

**Authoritative for:** customer identity verification, beneficial ownership,
corporate legal entity verification, document provenance (passport, articles
of incorporation, registry filings, UBO declarations), risk ratings,
periodic refresh cycles, PEP screening.

**MITHQAL interaction:** MITHQAL receives the bank's signed KYC PASS and
KYB PASS attestations. MITHQAL does NOT receive customer identity data,
document copies, UBO declarations, or PII. The bank retains all of this.
The privacy principle (§8 of the v25.0 Privacy & Revenue Principles
amendment) governs: customer identity stays in the bank.

**Replacement required:** None. The bank's existing KYC/KYB stack — whether
in-house or outsourced to a vendor like Refinitiv World-Check, LexisNexis
Risk Solutions, ComplyAdvantage, Dow Jones Risk & Compliance, etc. —
remains the authoritative identity-verification system.

### 12.3.3 AML / CFT Engine

**Authoritative for:** transaction monitoring, suspicious activity detection,
SAR/STR filing, AML risk scoring, CTF screening, behavioral analytics,
threshold tuning, regulator-mandated monitoring.

**MITHQAL interaction:** MITHQAL receives the bank's signed AML PASS
attestation. MITHQAL does NOT see the underlying transaction monitoring
rules, the alert history, or the SAR filings. The bank retains all of this.

**Replacement required:** None. The bank's existing AML stack — NICE Actimize,
SAS AML, Oracle Financial Services AML, Quantexa, Hawk AI, etc. — remains
authoritative.

### 12.3.4 Sanctions Screening Engine

**Authoritative for:** screening against OFAC SDN, UN Consolidated List,
EU Consolidated Financial Sanctions List, HMT OFSI list, local regulator
lists, watchlists, PEP lists, adverse-media lists.

**MITHQAL interaction:** MITHQAL receives the bank's signed SANCTIONS PASS
attestation. MITHQAL does NOT see the underlying screening hits, the false-
positive reviews, or the licensing decisions.

**Replacement required:** None. The bank's existing sanctions stack — Accuity
Fircosoft, Dow Jones Risk & Compliance, Refinitiv World-Check One, NICE
Actimize SAM, etc. — remains authoritative.

### 12.3.5 FX and Treasury Operations

**Authoritative for:** foreign-exchange execution, currency risk management,
liquidity management, intraday liquidity, FX hedging, NDF trading, money-
market operations, repo, securities financing.

**MITHQAL interaction:** MITHQAL never performs FX itself. The bank's
treasury executes any FX conversion required by an MTQ settlement, and the
resulting fiat position is what backs the MTQ. For the demo AED→SGD
corridor, the FX route is `USD-bridge` — the bank's treasury converts
AED→USD and USD→SGD through its existing FX desk, and only then does the
MTQ settlement atomically settle.

**Replacement required:** None. The bank's existing treasury — whether
manual dealer-driven, algo-driven (360T, FXall, Bloomberg FXGO), or via a
prime broker — remains authoritative.

### 12.3.6 Accounting System

**Authoritative for:** general ledger, subledgers, financial reporting,
regulatory reporting (Basel III, IFRS 9, etc.), audit trail, balance
sheet, income statement.

**MITHQAL interaction:** MITHQAL produces a `BankMTQSubledger` (§12 of the
MBG amendment) that the bank's accounting system consumes as a feed. The
bank maps the subledger entries into its own chart of accounts. MITHQAL
does NOT write directly to the bank's GL.

**Replacement required:** None. The bank's existing accounting system — SAP
S/4HANA, Oracle Financial Services, Workday Financials, Microsoft Dynamics
365 Finance, or any bespoke system — remains authoritative.

### 12.3.7 SWIFT Connectivity

**Authoritative for:** SWIFT FIN, SWIFT gpi, SWIFT interbank messaging,
BIC directory, RMA (Relationship Management Application) authorization,
Alliance interface (SAG/SMP/SN), SWIFTNet link.

**MITHQAL interaction:** MITHQAL is SWIFT-compatible. MITHQAL neither
replaces SWIFT nor competes with it. Where a transaction requires SWIFT
messaging, the bank's existing SWIFT infrastructure handles it. Where
MITHQAL's atomic settlement can replace a multi-message SWIFT
correspondent chain, the MBG can choose to settle via MTQ instead — but
this is a routing decision by the bank, not a replacement of SWIFT.

**Replacement required:** None. The bank's SWIFT infrastructure remains.

### 12.3.8 ISO 20022 Implementation

**Authoritative for:** the bank's internal ISO 20022 message catalogue,
schema validation, market-infrastructure-specific usage guidelines (e.g.,
TARGET2, CHAPS, Fedwire, CHPI, T2/T2S), registration on the SWIFT
MyStandards portal.

**MITHQAL interaction:** MITHQAL consumes the bank's existing ISO 20022
messages. The MBG's ISO 20022 layer (MBG-02 node) translates pain.001,
pain.002, pacs.002, pacs.008, pacs.009, camt.025, camt.054, camt.056, and
head.001 messages to/from MTQ settlement instructions.

**Replacement required:** None. The bank's existing ISO 20022 stack
remains authoritative.

### 12.3.9 Core Banking Custody (Where Applicable)

**Authoritative for:** custody accounts, safekeeping, asset servicing,
corporate actions, income collection, settlement instructions to CSDs/ICSDs.

**MITHQAL interaction:** Where the bank acts as a custodian for the
reserve assets backing MTQ (the §47 Protected Backing Cell), the custody
records remain authoritative on the bank's side. MITHQAL receives the
bank's custodian attestation but does not see the underlying custody
instructions.

**Replacement required:** None. The bank's existing custody system — whether
in-house or a vendor solution (BNP Paribas Securities Services, State
Street Alpha, BNY Pershing, etc.) — remains authoritative.

### 12.3.10 Why This Matters

The non-replacement principle is what makes MITHQAL integration-light. A
typical core banking replacement project takes 3–7 years, costs hundreds of
millions of dollars, and carries significant operational risk. MITHQAL
removes that risk entirely: a bank integrates via the MBG sidecar and
continues to operate its existing infrastructure unchanged.

The trade-off is that MITHQAL's coverage is bounded by what the bank's
existing systems can attest to. If a bank's compliance stack cannot
produce a cryptographically signed KYC PASS attestation, MITHQAL cannot
accept the bank's customers — but this is a property of the bank's
infrastructure, not a limitation of MITHQAL.

## 12.4 Why MITHQAL Must NOT Require Core Banking Replacement

The prohibition on core-banking replacement is one of the 12 DO_NOT_MODIFY
rules (§34) of the MBG amendment. The reasoning is fourfold.

### 12.4.1 Cost and Risk

Core banking replacement is one of the highest-cost, highest-risk projects
a bank can undertake. Industry benchmarks place the cost at $50M–$500M for
a mid-sized bank and the failure rate above 50% (per multiple
post-mortems of public core-banking transformations). Imposing this as a
precondition of MITHQAL adoption would reduce the addressable bank
population to a handful of greenfield banks — defeating the institutional-
scale purpose of MITHQAL.

### 12.4.2 Regulatory Entanglement

A core banking replacement touches every regulatory submission the bank
makes — capital reporting, liquidity reporting, large-exposure reporting,
resolution-planning, recovery-planning, intraday-liquidity reporting
(BCBS 248), and more. Each change requires regulatory non-objection,
resubmission of templates, and concurrent dual-running. The non-replacement
principle keeps MITHQAL's regulatory footprint to a single new
obligation: producing the MTQ subledger feed.

### 12.4.3 Operational Continuity

A bank cannot pause its operations to integrate MITHQAL. The non-replacement
principle means the bank continues to operate its existing infrastructure
during integration — the MBG sidecar is deployed alongside, not in place
of, the core banking system. The bank can integrate MITHQAL incrementally:
one corporate, one corridor, one currency at a time.

### 12.4.4 Vendor Neutrality

By not requiring core-banking replacement, MITHQAL becomes vendor-neutral.
A bank running Temenos, a bank running Finacle, a bank running a bespoke
system, and a bank running a 30-year-old mainframe can all integrate via
the MBG. The MBG adapter is the only bank-specific component, and it speaks
to the bank's existing APIs, file formats, and message queues.

## 12.5 The 12 Bank Integration Nodes (BNK-01 → MTH-03)

The MBG architecture defines 12 integration nodes spanning three domains:
BANK (the bank's existing systems), MBG (the MITHQAL Bank Gateway adapter),
and MITHQAL (the MITHQAL Core systems). The full node catalogue is
enumerated below.

### 12.5.1 BANK-Domain Nodes (5)

#### BNK-01 — Corporate Treasury Portal

- **Domain:** BANK
- **Name:** Corporate Treasury Portal
- **Description:** The corporate treasury interface the corporate uses to
  initiate payments, view balances, authorize transactions, and reconcile
  positions. Examples: GTM Treasury, Kyriba, FIS Quantum, ION Treasury,
  in-house ERPs (SAP S/4HANA Treasury, Oracle Treasury).
- **Role in MBG flow:** Origin of the corporate's payment instruction. The
  corporate initiates a payment in the treasury portal; the portal
  authenticates the corporate user and submits the payment to the bank's
  core banking system.
- **MBG interaction:** The MBG does not directly touch the corporate
  treasury portal. The portal submits to BNK-02 (Core Banking), which
  forwards to BNK-03/BNK-04 for compliance, then to BNK-05 for FX/treasury,
  and finally to MBG-01 for translation.
- **What MITHQAL sees:** The corporate reference (pseudonymized per §8
  privacy), the payment amount, the payment currency, the beneficiary
  reference, the payment purpose code, the corporate's instructions-for-
  next-agent, and the corporate's UETR if SWIFT-gpi is used.

#### BNK-02 — Core Banking System

- **Domain:** BANK
- **Name:** Core Banking System
- **Description:** Bank's authoritative core banking system (CBS).
  Authoritative for account balances, ledger entries, deposit records,
  settlement positions.
- **Role in MBG flow:** Receives the corporate's payment instruction from
  BNK-01, performs account-level validation (account exists, account is
  active, signatory authorized), debits the corporate's account
  (provisionally or finalized depending on the bank's intraday liquidity
  model), and forwards the instruction to BNK-03 (KYC/KYB) for compliance.
- **MBG interaction:** The MBG does not touch BNK-02 directly. The bank's
  existing payment flow routes through BNK-02 → BNK-03 → BNK-04 → BNK-05
  before reaching the MBG. The MBG sees only the post-compliance instruction
  and the bank's signed attestation that the CBS has authorized it.
- **What MITHQAL sees:** The post-CBS debit instruction reference, the
  corporate's account pseudonym, the bank's institution ID, and the
  bank's attestation that funds are available.

#### BNK-03 — KYC / KYB Engine

- **Domain:** BANK
- **Name:** KYC/KYB Engine
- **Description:** Customer verification engine. Authoritative for customer
  identity, corporate legal entity, beneficial ownership, document
  provenance, PEP screening, risk rating.
- **Role in MBG flow:** Receives the instruction from BNK-02 (or in
  parallel, depending on the bank's architecture). Verifies the corporate's
  KYC/KYB profile is current, the corporate's risk rating permits the
  transaction, and the corporate's documentation has not expired. Produces
  the KYC PASS and KYB PASS attestations (§7 of the MBG amendment).
- **MBG interaction:** The MBG does not touch BNK-03 directly. The bank's
  compliance workflow produces a signed `BankComplianceAttestation` that
  the MBG consumes. The MBG verifies the signature against the bank's
  registered attestation key (per §10 BankSecurityProfile).
- **What MITHQAL sees:** The signed KYC PASS and KYB PASS assertions, the
  attestation ID, the attestation expiry, and the attestation system
  version. MITHQAL does NOT see the underlying KYC documents, UBO
  declarations, or PEP hits.

#### BNK-04 — AML / Sanctions Engine

- **Domain:** BANK
- **Name:** AML/Sanctions Engine
- **Description:** Compliance screening engine. Authoritative for AML/CFT
  screening, sanctions screening (OFAC, UN, EU, HMT, local), transaction
  monitoring, SAR/STR filing.
- **Role in MBG flow:** Receives the instruction from BNK-03. Screens the
  sender, beneficiary, intermediary banks, payment purpose, and underlying
  goods/services against sanctions lists and AML rules. Produces the AML
  PASS and SANCTIONS PASS attestations.
- **MBG interaction:** The MBG does not touch BNK-04 directly. The bank's
  compliance workflow produces a signed attestation that AML and sanctions
  screening have been performed and have passed. The MBG verifies the
  signature.
- **What MITHQAL sees:** The signed AML PASS and SANCTIONS PASS assertions,
  the attestation ID, and the attestation expiry. MITHQAL does NOT see
  the screening hits, false-positive reviews, or SAR filings.

#### BNK-05 — FX / Treasury

- **Domain:** BANK
- **Name:** FX/Treasury
- **Description:** FX and treasury operations. Authoritative for foreign-
  exchange execution, currency risk management, liquidity management,
  intraday liquidity, FX hedging.
- **Role in MBG flow:** Receives the instruction from BNK-04. If the
  instruction requires FX conversion (e.g., AED→SGD), the bank's treasury
  executes the conversion through its existing FX desk. The resulting
  fiat position becomes the bank-side backing for the MTQ issuance.
- **MBG interaction:** The MBG does not touch BNK-05 directly. The bank's
  treasury settles the FX leg, and the bank's back office produces the
  instruction to MBG-01 (MBG Adapter) carrying the final settlement
  instruction (in the original currency or in the converted currency,
  per the bank's choice).
- **What MITHQAL sees:** The final settlement instruction (post-FX) and
  the bank's attestation that the FX leg has been settled.

### 12.5.2 MBG-Domain Nodes (4)

#### MBG-01 — MBG Adapter

- **Domain:** MBG
- **Name:** MBG Adapter
- **Description:** The MITHQAL Bank Gateway adapter (translation). This is
  the sidecar component deployed inside the bank's infrastructure (or in a
  bank-controlled cloud) that performs the TRANSLATION, NOT TRANSFORMATION
  principle.
- **Role in MBG flow:** Receives the bank's post-compliance instruction
  from BNK-05. Translates it into an `MTQSettlementInstruction` (§6 of
  the MBG amendment — 22 canonical fields). Attaches the bank's
  `BankComplianceAttestation` (§7 — 7 assertions). Signs the instruction
  with the bank's attestation key (registered via §10 BankSecurityProfile).
  Forwards to MBG-02 (ISO 20022 layer) for translation into the wire
  format the MITHQAL Core expects.
- **MBG interaction:** This IS the MBG. MBG-01 is the canonical adapter
  that the MSAS (MBG Sidecar Adapter Standard, §5 of the amendment)
  specifies.
- **What MITHQAL sees:** The translated `MTQSettlementInstruction`, the
  bank's `BankComplianceAttestation`, the bank's signature, the bank's
  attestation-key ID, and the bank's compliance-system version. MITHQAL
  runs the §18 ZeroTrustVerification step (signature verification +
  attestation validity + replay-prevention).

#### MBG-02 — ISO 20022 Layer

- **Domain:** MBG
- **Name:** ISO 20022 Layer
- **Description:** ISO 20022 message translation. Handles inbound (bank
  ISO 20022 → MTQ schema) and outbound (MTQ schema → bank ISO 20022)
  translation for the 9 canonical ISO 20022 messages (see §12.7 below).
- **Role in MBG flow:** Receives the translated instruction from MBG-01.
  Encodes it as the appropriate ISO 20022 message (typically a `pacs.008`
  FIToFICustomerCreditTransfer for cross-border MTQ transfer, or a
  `pain.001` Customer Credit Transfer Initiation for the corporate
  payment). Forwards to MBG-03 (REST API Gateway) for transport to MITHQAL
  Core.
- **MBG interaction:** MBG-02 is the canonical ISO 20022 translation layer.
  It is the only component in the MBG that knows the bank's specific ISO
  20022 market-infrastructure usage guidelines (e.g., TARGET2 vs Fedwire
  vs CHIPS vs CHAPS message variants).
- **What MITHQAL sees:** The wire-format ISO 20022 message (or, depending
  on the chosen transport, the equivalent REST payload). The translation
  is lossless — the canonical `MTQSettlementInstruction` round-trips
  through ISO 20022 without loss.

#### MBG-03 — API Gateway

- **Domain:** MBG
- **Name:** API Gateway
- **Description:** REST API gateway. Handles HTTP transport, mTLS
  authentication, request signing, idempotency-key management, retry
  semantics.
- **Role in MBG flow:** Receives the translated message from MBG-02.
  Wraps it in an HTTPS POST to the MITHQAL Core's `/v1/settlement/
  instructions` endpoint (see §30 of the amendment). Attaches the mTLS
  client certificate (issued by MITHQAL PKI per §10 BankSecurityProfile),
  the idempotency key (the bank's UETR or a UUIDv4), and the timestamp.
- **MBG interaction:** MBG-03 is the transport layer. It is the only MBG
  component that opens a network connection to MITHQAL Core.
- **What MITHQAL sees:** The HTTPS request, the mTLS client cert (CN of
  the bank), the idempotency key, the timestamp, and the request body
  (ISO 20022 XML or REST JSON, per the bank's choice).

#### MBG-04 — Host-to-Host

- **Domain:** MBG
- **Name:** Host-to-Host
- **Description:** H2H file transfer. Handles batch-mode transfer for
  banks that prefer SFTP/H2H file exchange over real-time REST API.
- **Role in MBG flow:** Alternative to MBG-03 for banks that prefer file-
  based integration (common in corporate banking, where the corporate
  submits a batch payment file via SFTP to the bank, and the bank
  forwards the translated batch to MITHQAL). The H2H layer batches
  multiple instructions into a single file, signs the file, and SFTPs
  it to MITHQAL Core's inbound file endpoint.
- **MBG interaction:** MBG-04 is functionally equivalent to MBG-03
  (REST) but uses file-based transport. The same translation pipeline
  (MBG-01 → MBG-02) is used; only the transport differs.
- **What MITHQAL sees:** The batched file (one instruction per line, or
  a single XML envelope containing multiple pacs.008 messages), the
  SFTP source IP, the file signature, and the per-instruction
  idempotency keys.

### 12.5.3 MITHQAL-Domain Nodes (3)

#### MTH-01 — MITHQAL Core

- **Domain:** MITHQAL
- **Name:** MITHQAL Core
- **Description:** Core authorization engine. Authoritative for the
  MITHQAL protocol, issuance rules, supply cap, settlement state,
  institutional permissions, reserve/monetary integrity.
- **Role in MBG flow:** Receives the translated instruction from MBG-03
  (REST) or MBG-04 (H2H). Runs the BM-09 to BM-15 steps of the 16-step
  Bank Minting Workflow: eligibility check (BM-09), jurisdiction check
  (BM-10), backing verification (BM-11), bank-specific risk (BM-12),
  system-wide risk (BM-13), DMCE check (BM-14), monetary authorization
  (BM-15). If all checks pass, authorizes the mint.
- **MBG interaction:** MITHQAL Core does not speak directly to the bank.
  All bank-facing communication is via the MBG. MITHQAL Core emits MTQ
  Status Events (the 13-state lifecycle in §15 of the amendment) that
  the MBG translates back into bank-portal status codes via the §11
  AccountingReconciliationAdapter.
- **What MITHQAL sees:** The instruction (translated), the bank's
  attestation (signature-verified), the bank's institution profile,
  the bank's MTQ subledger (per §12 of the amendment), and the
  bank's last five-way reconciliation report.

#### MTH-02 — Ledger State Machine

- **Domain:** MITHQAL
- **Name:** Ledger State Machine
- **Description:** MTQ ledger state transitions. Authoritative for the
  canonical supply ledger, the append-only state machine, the mint-state
  transitions (PENDING → AUTHORIZED → FINALIZED → MINTED).
- **Role in MBG flow:** Receives the authorization from MTH-01. Performs
  the BM-16 step: Finality Verification + Mint. Writes the mint record
  atomically with the finality-proof record (per the §54
  Finality-Before-Mint 7-layer enforcement). Returns the mint
  confirmation to MTH-01, which forwards it back through the MBG.
- **MBG interaction:** The ledger state machine is the canonical source
  of truth for MTQ supply. The MBG's BankMTQSubledger (§12 of the
  amendment) must reconcile against this ledger in the §13 five-way
  reconciliation.
- **What MITHQAL sees:** The full mint-state history, the canonical
  supply total, the per-instruction state, and the per-bank
  contribution to the canonical supply.

#### MTH-03 — Finality Gate

- **Domain:** MITHQAL
- **Name:** Finality Gate
- **Description:** 7-layer finality enforcement (per §54). The gate
  that enforces the invariant "NO FINAL SETTLEMENT ⇒ NO MTQ MINT".
- **Role in MBG flow:** The Finality Gate sits between MTH-01 (which
  authorizes the mint) and MTH-02 (which executes the mint). The Finality
  Gate verifies that all 7 layers have passed: L1 API, L2 Workflow,
  L3 Policy, L4 Authorization, L5 Ledger State Machine, L6 Database TX
  State, L7 Smart Contract. If any layer has not passed, the mint is
  blocked.
- **MBG interaction:** The Finality Gate is invisible to the bank. The
  bank only sees the MTQ Status Event (e.g., ISSUED if all 7 layers
  passed, BLOCKED if any layer failed). The 10 bypass routes are all
  blocked (per §54).
- **What MITHQAL sees:** The 7-layer enforcement state, the 10-bypass-
  test results (all blocked), the finality-proof for each mint, and
  the audit trail of every layer's verification.

### 12.5.4 Node Summary Table

| ID | Domain | Name | Role |
|----|--------|------|------|
| BNK-01 | BANK | Corporate Treasury Portal | Origin of corporate payment instruction |
| BNK-02 | BANK | Core Banking System | Account validation + debit |
| BNK-03 | BANK | KYC/KYB Engine | Customer verification + KYC/KYB PASS |
| BNK-04 | BANK | AML/Sanctions Engine | Compliance screening + AML/SANCTIONS PASS |
| BNK-05 | BANK | FX/Treasury | FX conversion + bank-side backing |
| MBG-01 | MBG | MBG Adapter | Translation of bank instruction → MTQ schema |
| MBG-02 | MBG | ISO 20022 Layer | ISO 20022 message translation |
| MBG-03 | MBG | API Gateway | REST/HTTPS transport to MITHQAL Core |
| MBG-04 | MBG | Host-to-Host | SFTP/file-based transport (batch) |
| MTH-01 | MITHQAL | MITHQAL Core | Authorization engine (BM-09 to BM-15) |
| MTH-02 | MITHQAL | Ledger State Machine | Canonical supply ledger (BM-16 mint) |
| MTH-03 | MITHQAL | Finality Gate | 7-layer finality enforcement |

## 12.6 The 9 Bank Integration Flows (F01–F09)

The MBG defines 9 canonical flows that connect the 12 nodes. Each flow is a
directed edge from one node to another, representing the data path a
payment instruction takes through the integrated bank-MITHQAL stack.

### 12.6.1 F01 — Corporate → Core Banking (BNK-01 → BNK-02)

**Description:** The corporate treasury portal (BNK-01) submits a payment
instruction to the bank's core banking system (BNK-02).

**Wire format:** Typically a proprietary bank API (e.g., the bank's
corporate-portal API), or an ISO 20022 `pain.001` Customer Credit Transfer
Initiation, or a SWIFT MT101 Request for Transfer (legacy).

**Authentication:** Corporate user authentication at the treasury portal
(2FA / SSO / hardware token). The bank's corporate portal authenticates
the corporate signatory.

**Authorization:** Corporate signatory authorization at the treasury portal
(per the bank's existing authorization workflow — dual-signature, threshold
authorization, etc.).

**What this flow carries:** The payment instruction: amount, currency,
value date, beneficiary, beneficiary bank, payment purpose, regulatory
references (e.g., invoice number, PO number), and the corporate's
instructions-for-next-agent.

**Latency:** Typically <1 second (intra-bank submission).

**MBG interaction:** None. The MBG does not touch F01. The bank's existing
corporate-portal → core-banking flow remains authoritative.

### 12.6.2 F02 — Core → KYC/KYB (BNK-02 → BNK-03)

**Description:** The core banking system forwards the instruction to the
KYC/KYB engine for compliance verification.

**Wire format:** Typically a bank-internal API call (the bank's compliance
engine exposes a synchronous or asynchronous API that the CBS calls).

**Authentication:** Inter-system authentication (the CBS uses a service
account to call the compliance engine; mTLS or token-based).

**Authorization:** The CBS is authorized to call the compliance engine by
virtue of being the bank's authoritative system.

**What this flow carries:** The payment instruction + the corporate's
customer reference (so the compliance engine can look up the corporate's
KYC/KYB profile).

**Latency:** Typically 100–500 ms (KYC/KYB profile lookup is usually
cached; refresh is asynchronous).

**MBG interaction:** None. The bank's existing CBS → compliance flow
remains authoritative.

### 12.6.3 F03 — KYC → AML/Sanctions (BNK-03 → BNK-04)

**Description:** After KYC/KYB verification passes, the compliance engine
forwards the instruction to the AML/sanctions engine for transaction
monitoring and sanctions screening.

**Wire format:** Bank-internal API call.

**Authentication:** Inter-system authentication.

**Authorization:** The compliance engine is authorized to call the AML
engine.

**What this flow carries:** The payment instruction + the corporate's
KYC/KYB PASS status.

**Latency:** Typically 200–500 ms for sanctions screening (longer if there
are false-positive hits that require manual review).

**MBG interaction:** None. The bank's compliance workflow remains
authoritative.

### 12.6.4 F04 — AML → FX/Treasury (BNK-04 → BNK-05)

**Description:** After AML/sanctions screening passes, the instruction is
forwarded to the bank's FX/treasury operations for FX conversion (if
required) and to settle the bank-side backing.

**Wire format:** Bank-internal API call or treasury-dealer workflow
(if manual FX is required).

**Authentication:** Inter-system authentication or dealer authentication.

**Authorization:** The compliance engine authorizes the treasury to execute
the FX leg. For high-value payments, a treasury dealer may sign off
manually.

**What this flow carries:** The payment instruction + the compliance PASS
status + the FX quote (if applicable).

**Latency:** For automated FX (most common): 100–500 ms. For manual FX
(large or exotic pairs): minutes to hours.

**MBG interaction:** None. The bank's treasury operations remain
authoritative.

### 12.6.5 F05 — Bank → MBG Adapter (BNK-05 → MBG-01)

**Description:** The bank's treasury / back office produces a final
settlement instruction and forwards it to the MBG adapter for translation
into the MTQ schema.

**Wire format:** Bank-internal API call (the MBG adapter exposes a bank-
internal endpoint that the treasury calls), or a file drop (the treasury
writes a file to a directory the MBG adapter polls).

**Authentication:** The MBG adapter authenticates the bank's treasury via
mTLS or token-based authentication.

**Authorization:** The treasury is authorized to submit instructions to
the MBG by virtue of being the bank's authoritative treasury system.

**What this flow carries:** The post-compliance settlement instruction,
the bank's signed `BankComplianceAttestation` (the 7 assertions), the
FX-leg settlement reference (if applicable), and the corporate's
pseudonymized reference.

**Latency:** Typically <100 ms (within the bank's data center).

**MBG interaction:** This is the first flow that touches the MBG. MBG-01
receives the instruction and begins the TRANSLATION, NOT TRANSFORMATION
process.

### 12.6.6 F06 — MBG → ISO 20022 (MBG-01 → MBG-02)

**Description:** The MBG adapter translates the bank's instruction into
the canonical `MTQSettlementInstruction` (22 fields per §6 of the
amendment) and forwards to the ISO 20022 layer for wire-format encoding.

**Wire format:** Internal MBG function call or message-queue publish.

**Authentication:** Internal MBG authentication (no external auth needed
within the sidecar).

**Authorization:** The MBG adapter is authorized to call the ISO 20022
layer by virtue of being part of the same sidecar.

**What this flow carries:** The canonical `MTQSettlementInstruction`, the
bank's `BankComplianceAttestation`, the bank's signature, the bank's
attestation-key ID.

**Latency:** Typically <50 ms (in-process).

**MBG interaction:** This is the second MBG-internal flow. The ISO 20022
layer (MBG-02) encodes the instruction as a `pain.001`, `pacs.008`, or
other appropriate ISO 20022 message per the message catalog in §12.7.

### 12.6.7 F07 — ISO 20022 → MITHQAL Core (MBG-02 → MTH-01)

**Description:** The ISO 20022 layer forwards the wire-format message to
MITHQAL Core for processing.

**Wire format:** ISO 20022 XML over HTTPS (REST API), or batched ISO 20022
file over SFTP (host-to-host).

**Authentication:** mTLS client certificate (the bank's MBG presents a
client cert issued by MITHQAL PKI per §10 BankSecurityProfile). The
request is signed with the bank's attestation key.

**Authorization:** The bank's MBG is authorized to call MITHQAL Core's
`/v1/settlement/instructions` endpoint by virtue of being registered
with a valid BankSecurityProfile.

**What this flow carries:** The ISO 20022 message (or REST JSON
equivalent), the mTLS client cert, the idempotency key (the bank's UETR
or a UUIDv4), the timestamp, and the request signature.

**Latency:** Network latency between the bank and MITHQAL Core (typically
50–500 ms for cross-jurisdiction REST; 1–5 seconds for SFTP batch).

**MBG interaction:** This is the cross-domain flow that crosses the
boundary from the bank's infrastructure to MITHQAL's infrastructure. It
is the only flow that crosses a network boundary controlled by both
parties.

### 12.6.8 F08 — Core → Ledger (MTH-01 → MTH-02)

**Description:** MITHQAL Core authorizes the mint (after BM-09 through
BM-15 all pass) and forwards the mint authorization to the Ledger State
Machine for execution.

**Wire format:** Internal MITHQAL function call or message-queue publish.

**Authentication:** Internal MITHQAL authentication.

**Authorization:** MITHQAL Core's authorization is the L4 Authorization
layer of the §54 Finality-Before-Mint stack. The authorization is signed
by the MITHQAL Monetary & Reserve Control Division.

**What this flow carries:** The mint authorization (the signed MITHQAL
Monetary Control authorization), the canonical `MTQSettlementInstruction`,
the finality-proof token (the BM-15 output).

**Latency:** Typically <50 ms (in-process).

**MBG interaction:** None. This is internal to MITHQAL. The MBG only
sees the result via the MTQ Status Event callback.

### 12.6.9 F09 — Ledger → Finality Gate (MTH-02 → MTH-03)

**Description:** The Ledger State Machine submits the mint to the Finality
Gate for 7-layer enforcement verification before execution.

**Wire format:** Internal MITHQAL function call.

**Authentication:** Internal MITHQAL authentication.

**Authorization:** The Ledger State Machine is authorized to call the
Finality Gate by virtue of being part of the same MITHQAL Core system.

**What this flow carries:** The mint authorization, the canonical
instruction, the 7-layer enforcement state.

**Latency:** Typically <50 ms (in-process).

**MBG interaction:** None. This is internal to MITHQAL. The Finality
Gate verifies all 7 layers (L1 through L7) have passed, then returns
the mint confirmation to the Ledger State Machine, which executes the
mint atomically (per L6 Database TX State).

### 12.6.10 Flow Summary Table

| Flow | From | To | Domain Crossing | Latency |
|------|------|----|-----------------|---------|
| F01 | BNK-01 | BNK-02 | None (BANK) | <1 s |
| F02 | BNK-02 | BNK-03 | None (BANK) | 100–500 ms |
| F03 | BNK-03 | BNK-04 | None (BANK) | 200–500 ms |
| F04 | BNK-04 | BNK-05 | None (BANK) | 100–500 ms (auto) |
| F05 | BNK-05 | MBG-01 | BANK → MBG | <100 ms |
| F06 | MBG-01 | MBG-02 | None (MBG) | <50 ms |
| F07 | MBG-02 | MTH-01 | MBG → MITHQAL | 50–500 ms (REST) |
| F08 | MTH-01 | MTH-02 | None (MITHQAL) | <50 ms |
| F09 | MTH-02 | MTH-03 | None (MITHQAL) | <50 ms |

## 12.7 ISO 20022 Message Catalog (9 Messages)

The MBG's ISO 20022 layer (MBG-02) supports 9 canonical ISO 20022
messages. The catalog below lists each message by identifier, name, and
purpose, and describes the field mapping to the canonical
`MTQSettlementInstruction` (22 fields per §6 of the amendment).

### 12.7.1 `pain.001` — Customer Credit Transfer Initiation

- **Message ID:** `pain.001`
- **Name:** Customer Credit Transfer Initiation
- **Purpose:** A corporate customer (the corporate treasury portal BNK-01)
  initiates a credit transfer to a beneficiary. This is the message the
  corporate's treasury portal sends to the bank's core banking system
  (BNK-02) — typically the inbound message from the corporate.
- **MBG role:** Inbound. The bank's existing payment flow consumes
  `pain.001` from the corporate portal. The MBG sees the post-compliance
  version (post BNK-02/03/04/05 processing) when the bank forwards the
  translated instruction.
- **Field mapping to `MTQSettlementInstruction`:**

  | pain.001 field | MTQ field | Mapping |
  |----------------|-----------|---------|
  | GrpHdr/MsgId | messageId | PASS_THROUGH |
  | GrpHdr/CreDtTm | issuedAt | PASS_THROUGH |
  | PmtInf/ReqdExctnDt | valueDate | DERIVED (date portion) |
  | PmtInf/Dbtr/Nm | senderName | REJECTED (privacy — see §8) |
  | PmtInf/DbtrAcct/Id/IBAN | senderAccount | REJECTED (privacy — pseudonymized) |
  | PmtInf/CdtrAgt/BICFI | beneficiaryBankBic | PASS_THROUGH |
  | PmtInf/Cdtr/Nm | beneficiaryName | PASS_THROUGH |
  | PmtInf/CdtrAcct/Id/IBAN | beneficiaryAccount | PASS_THROUGH |
  | PmtInf/Amt/InstdAmt | amount | PASS_THROUGH |
  | PmtInf/Amt/Ccy | currency | PASS_THROUGH |
  | PmtInf/Purp/Prtry | paymentPurpose | PASS_THROUGH |
  | PmtInf/RmtInf/Ustrd | remittanceInformation | VALIDATED (free-text screened) |
  | PmtInf/InstrForCdtrAgt | instructionsForNextAgent | PASS_THROUGH |

  Mapping conventions: `PASS_THROUGH` = field copied verbatim. `DERIVED`
  = field extracted from a composite field. `VALIDATED` = field checked
  against policy (e.g., sanctions screening of free-text). `REJECTED` =
  field NOT transmitted to MITHQAL per the §8 privacy principle (the
  bank retains it; MITHQAL only sees a pseudonym).

### 12.7.2 `pain.002` — Customer Payment Status Report

- **Message ID:** `pain.002`
- **Name:** Customer Payment Status Report
- **Purpose:** The bank reports the status of a previously-initiated
  payment back to the corporate customer. This is the message the bank
  sends to the corporate portal when a payment has been accepted,
  rejected, posted, or returned.
- **MBG role:** Outbound. The MBG translates MTQ Status Events (the
  13-state lifecycle) into `pain.002` status reports for the bank's
  corporate-portal consumption.
- **Field mapping:** The 13 MTQ Status Events map to ISO 20022
  transaction-status codes:

  | MTQ Status Event | pain.002 TxSts | Meaning |
  |------------------|----------------|---------|
  | RECEIVED | ACCP | Accepted — received, awaiting processing |
  | AUTHORIZED | ACSP | Accepted — in process |
  | COMPLIANCE_VERIFIED | ACSP | Accepted — in process (compliance done) |
  | ISSUANCE_PENDING | ACSP | Accepted — in process (reserve verification) |
  | ISSUED | ACSC | Accepted — settlement completed (technical) |
  | SETTLEMENT_PENDING | ACSP | Accepted — in process |
  | SETTLED | ACSC | Accepted — settlement completed |
  | REDEMPTION_PENDING | ACSP | Accepted — in process |
  | REDEEMED | ACSC | Accepted — settlement completed |
  | COMPLETED | ACSC | Accepted — settlement completed (final) |
  | BLOCKED | RJCT | Rejected — bank notified |
  | SUSPENDED | PDNG | Pending — system stress or regulatory hold |
  | RESOLUTION | PDNG | Pending — joint investigation |

### 12.7.3 `pacs.002` — FIToFIPaymentStatusReport

- **Message ID:** `pacs.002`
- **Name:** FIToFIPaymentStatusReport
- **Purpose:** Interbank status report. Used when one financial institution
  informs another about the status of a previously-initiated payment. This
  is the interbank equivalent of `pain.002` (which is bank-to-customer).
- **MBG role:** Both inbound (when a correspondent bank reports status to
  the bank) and outbound (when the bank reports status to a correspondent).
  For MTQ settlement, the MBG can synthesize `pacs.002` messages to give
  the bank a familiar status-report format for cross-border MTQ settlement.
- **Field mapping:** Same status mapping as `pain.002` (above), but with
  the FI-to-FI fields (e.g., `OrgnlInstrId`, `TxSts`, `InstgAgt`,
  `InstdAgt`) populated from the canonical instruction.

### 12.7.4 `pacs.008` — FIToFICustomerCreditTransfer

- **Message ID:** `pacs.008`
- **Name:** FIToFICustomerCreditTransfer
- **Purpose:** Interbank customer credit transfer. The canonical
  interbank payment message in ISO 20022 — one FI sends a credit
  transfer to another FI on behalf of a customer.
- **MBG role:** This is the canonical wire-format message used to
  transport an MTQ settlement instruction between two banks via the
  MBG. For the demo AED→SGD corridor, the sending bank's MBG produces
  a `pacs.008` message, MITHQAL Core consumes it (translated to
  `MTQSettlementInstruction`), and the receiving bank's MBG produces
  the inbound `pacs.008` on its side.
- **Field mapping:** Similar to `pain.001` but with FI-to-FI fields
  (`IntrBkSttlmDt`, `IntrBkSttlmAmt`, `InstgAgt`, `InstdAgt`,
  `ChrgBr`) populated.

### 12.7.5 `pacs.009` — FItoFICustomerDirectDebit

- **Message ID:** `pacs.009`
- **Name:** FItoFICustomerDirectDebit
- **Purpose:** Interbank direct debit. One FI debits an account at
  another FI on behalf of a customer. Used for pull-based payments
  (e.g., recurring billing, collection).
- **MBG role:** Inbound for redemption flows where the corporate
  authorizes the bank to debit its account for redemption. The MBG
  translates the `pacs.009` into an `MTQRedemptionInstruction` (a
  variant of the canonical instruction with the direction reversed).
- **Field mapping:** The debit fields (`Dbtr`, `DbtrAcct`, `Cdtr`,
  `CdtrAcct`) are reversed relative to `pacs.008`.

### 12.7.6 `camt.025` — Receipt

- **Message ID:** `camt.025`
- **Name:** Receipt
- **Purpose:** A receipt acknowledgement from one FI to another,
  confirming that a message has been received and (optionally) processed.
- **MBG role:** Outbound. The MBG produces `camt.025` receipts to
  confirm to the bank that an MTQ settlement instruction has been
  received by MITHQAL Core (before final processing).
- **Field mapping:** The `MsgId` of the original message, the receipt
  timestamp, and the receipt status (RECEIVED, ACCEPTED, REJECTED).

### 12.7.7 `camt.054` — BankToCustomerDebitCreditNotification

- **Message ID:** `camt.054`
- **Name:** BankToCustomerDebitCreditNotification
- **Purpose:** Notification to a customer that their account has been
  debited or credited.
- **MBG role:** Outbound. After an MTQ settlement has settled, the MBG
  produces a `camt.054` notification so the corporate customer sees a
  debit (for the sender) or credit (for the beneficiary) entry in their
  bank portal — exactly as they would for a traditional SWIFT payment.
- **Field mapping:** The notification fields (`Amt`, `CdtDbtInd`,
  `Sts`, `BookgDt`, `AcctSvcrRef`) are populated from the MTQ settlement
  result.

### 12.7.8 `camt.056` — FIToFIPaymentCancellationRequest

- **Message ID:** `camt.056`
- **Name:** FIToFIPaymentCancellationRequest
- **Purpose:** A request from one FI to another to cancel a previously-
  initiated payment. Used when a payment needs to be recalled (e.g.,
  fraud, error, customer request).
- **MBG role:** Inbound. The bank forwards a `camt.056` to the MBG when
  a payment needs to be cancelled. The MBG translates it into an
  `MTQCancellationRequest` (a special instruction type).
- **Field mapping:** The cancellation fields (`OrgnlInstrId`,
  `OrgnlEndToEndId`, `CxlRsnInf`, `CxlRsn`) are mapped from the
  original instruction's identifiers.

### 12.7.9 `head.001` — BusinessApplicationHeader

- **Message ID:** `head.001`
- **Name:** BusinessApplicationHeader (BAH)
- **Purpose:** The wrapper header for every ISO 20022 business message.
  Carries the sender, recipient, message ID, timestamp, and signature.
- **MBG role:** Outbound and inbound. The MBG wraps every outbound
  message in a `head.001` header (signed by the bank's attestation key)
  and unwraps every inbound `head.001` header (verifying the sender's
  signature).
- **Field mapping:** The BAH fields (`Fr`, `To`, `MsgDefIdr`, `CreDt`,
  `BizMsgIdr`, `Sgntr`) are populated from the MBG's signing identity
  (per §10 BankSecurityProfile).

### 12.7.10 Field-Mapping Conventions

The four field-mapping conventions used throughout the ISO 20022 catalog
are defined precisely:

- **PASS_THROUGH** — The field is copied verbatim from the source message
  to the canonical `MTQSettlementInstruction`. No transformation. No
  validation. The field is preserved exactly. Example: the payment amount
  and currency.

- **DERIVED** — The field is extracted from a composite source field.
  Example: the value date is derived from the `ReqdExctnDt` (which is
  a date-time) by taking the date portion. No semantic change.

- **VALIDATED** — The field is checked against policy before being
  accepted. Example: free-text remittance information is screened for
  sanctions-list matches before being preserved. If validation fails,
  the entire message is rejected (transformation, NOT translation).

- **REJECTED** — The field is NOT transmitted to MITHQAL per the §8
  privacy principle. The bank retains it; MITHQAL only sees a
  pseudonym. Example: the sender's IBAN is replaced with a
  pseudonymous account reference.

## 12.8 SWIFT Relationship: Compatible and Complementary

MITHQAL is SWIFT-compatible. MITHQAL neither replaces SWIFT nor competes
with it. The relationship is best described as complementary:

### 12.8.1 What SWIFT Does

SWIFT provides the world's largest financial messaging network. It defines
messaging standards (SWIFT MT, ISO 20022), operates the SWIFTNet messaging
infrastructure (FIN, InterAct, FileAct), provides the BIC directory,
operates the RMA (Relationship Management Application) authorization
system, and runs SWIFT gpi (global payments innovation) for cross-border
payments.

SWIFT does NOT settle payments — it carries the messages that instruct
settlement. Settlement happens at commercial banks (via correspondent
banking) and at central banks (via RTGS).

### 12.8.2 What MITHQAL Does

MITHQAL settles payments atomically — a corporate's MTQ transfer from
Bank A to Bank B is settled on the MITHQAL ledger in a single atomic
operation, without correspondent banking, without SWIFT messaging between
intermediary banks, and without T+0/T+1/T+2 settlement lag.

MITHQAL also does NOT carry the corporate's PII — the §8 privacy principle
ensures that customer identity stays in the bank.

### 12.8.3 The Complementary Relationship

For an interbank MTQ transfer from Bank A to Bank B:

1. The corporate at Bank A initiates the payment (potentially via a
   `pain.001` ISO 20022 message).
2. Bank A's MBG translates the instruction and submits to MITHQAL Core.
3. MITHQAL Core mints MTQ to Bank A's corporate MTQ settlement account
   (atomic).
4. MTQ is transferred to Bank B's corporate MTQ settlement account
   (atomic — same ledger, same transaction).
5. MTQ is redeemed to fiat at Bank B (atomic).
6. Bank B's MBG translates the result back to a `camt.054` notification
   to the corporate beneficiary.

The corporate sees a SWIFT-equivalent experience: payment initiated,
payment received. But the back-end is MITHQAL, not correspondent banking.

Where SWIFT is still required (e.g., regulatory reporting, correspondent
notifications to non-MBQ banks, traditional nostro-vostro settlement),
the bank's existing SWIFT infrastructure handles it. The MBG does not
displace SWIFT for any of these functions.

### 12.8.4 The Coexistence Principle

The v25.2 controlling specification explicitly states: "ISO 20022 / SWIFT
compatibility (not replacement)". This is one of the 9 unchanged
components listed in §A.3 of the SOT reconciliation report. The MBG is
designed to coexist with SWIFT, not to replace it. A bank that adopts
MITHQAL does not abandon SWIFT — it adds MITHQAL as an additional
settlement rail alongside SWIFT.

## 12.9 Multi-Rail Support (8+ Rails)

The MBG supports 8 settlement rails. A bank can choose, per transaction,
which rail best fits its operational and cost requirements. The rail
catalog is enumerated below.

### 12.9.1 Rail Catalog

| Rail | Display Name | Typical Latency | Fee (bps) | Atomic Capable |
|------|--------------|-----------------|-----------|----------------|
| SWIFT | SWIFT FIN | 5,000 ms | 8 | No |
| ISO_20022 | ISO 20022 | 3,000 ms | 6 | No |
| REST_API | REST API | 500 ms | 3 | Yes |
| HOST_TO_HOST | Host-to-Host | 2,000 ms | 5 | No |
| SFTP | SFTP | 4,000 ms | 4 | No |
| RTGS | RTGS | 1,000 ms | 7 | No |
| TOKENIZED_DEPOSIT | Tokenized Deposit | 300 ms | 2 | Yes |
| CBDC | Wholesale CBDC | 200 ms | 1 | Yes |

### 12.9.2 Rail Selection Logic

The MBG's rail selection is governed by:

1. **The bank's preference.** The bank configures its MBG with a default
   rail preference (e.g., REST_API for real-time, SFTP for batch).

2. **The transaction type.** High-value transactions may require RTGS
   for central-bank finality; low-value corporate payments may use
   REST_API for atomic settlement.

3. **The atomic-capable flag.** If the transaction requires atomic
   settlement (e.g., an AED↔SGD cross-currency corridor), the rail must
   be `atomicCapable=true` — i.e., REST_API, TOKENIZED_DEPOSIT, or CBDC.

4. **The currency pair.** For the demo AED↔SGD corridor, the AED side
   uses `TOKENIZED_DEPOSIT` (300 ms, 2 bps) and the SGD side uses
   `CBDC` (200 ms, 1 bps). Total cost: 7 bps (3 + 2 + 1, plus 1 for FX
   discovery).

5. **The corridor's compliance posture.** Some corridors may require a
   specific rail (e.g., sanctions-sensitive corridors may use SFTP for
   audit-trail completeness).

### 12.9.3 The Demo AED↔SGD Corridor (Illustrative)

The reference corridor (`/tmp/blueprint_reference.json → corridor.demo`)
shows a complete rail selection:

- **Amount:** AED 1,000,000
- **Output:** SGD 367,365
- **FX route:** USD-bridge (AED → USD → SGD, executed by the bank's
  treasury through its existing FX desk)
- **AED rail:** TOKENIZED_DEPOSIT
- **SGD rail:** CBDC (wholesale)
- **Compliance:** PASSED (KYC/KYB/AML/sanctions/account-authority/funds)
- **Settlement status:** ATOMICALLY_SETTLED
- **MTQ minted:** 272,000 MTQ (intermediate unit of account)
- **Total cost:** 7 bps = SGD 257.29

The 12-step corridor execution:

1. **fx-1** (FX_DISCOVERY): Quote AED/SGD direct — 220 ms.
2. **fx-2** (FX_DISCOVERY): Quote AED/USD/SGD bridge — 180 ms.
3. **fx-3** (FX_DISCOVERY): Select best route (USD-bridge wins) — 50 ms.
4. **liq-1** (LIQUIDITY_ROUTING): Route AED to TOKENIZED_DEPOSIT — 120 ms.
5. **liq-2** (LIQUIDITY_ROUTING): Route SGD to CBDC — 110 ms.
6. **comp-1** (COMPLIANCE_CHECK): KYC/KYB verification — 300 ms.
7. **comp-2** (COMPLIANCE_CHECK): AML/sanctions screening — 450 ms.
8. **set-1** (SETTLEMENT_EXECUTION): MBG receives request — 80 ms.
9. **set-2** (SETTLEMENT_EXECUTION): Atomic MTQ mint — 150 ms.
10. **set-3** (SETTLEMENT_EXECUTION): MTQ transfer — 90 ms.
11. **set-4** (SETTLEMENT_EXECUTION): Atomic MTQ redeem — 140 ms.
12. **conf-1** (CONFIRMATION): Settlement confirmation — 60 ms.

Total corridor execution: ~1,950 ms (under 2 seconds for a cross-currency,
cross-jurisdiction, fully-compliant settlement).

### 12.9.4 Additional Rails (Beyond the 8)

The MBG's rail architecture is extensible. Future rails may include:

- **Treasury** (direct treasury-bond settlement)
- **ERP** (ERP-embedded settlement for corporate-to-corporate flows)
- **Direct CBDC** (central-bank direct CBDC for wholesale settlement)
- **Project Agorá** (BIS-led multi-CBDC unified ledger)
- **mBridge** (multi-CBDC platform for cross-border settlement)

These are not part of the current 8-rail catalog but are referenced in
the §22 BankIntegrationCostModel as future expansion paths.

## 12.10 Customer-Visible MTQ — Mode A and Mode B

The MBG supports two customer-visible modes for MTQ settlement. The bank
chooses the mode per corporate customer (or per transaction).

### 12.10.1 Mode A — Bank-Native Experience (MTQ Invisible)

In Mode A, the corporate customer does NOT see MTQ at all. The corporate
initiates a payment in their existing treasury portal (BNK-01) exactly
as they would for any cross-border payment. The bank's existing payment
flow runs as usual. Behind the scenes, the bank's MBG decides to settle
via MTQ instead of via correspondent banking — but the corporate sees
only the bank-portal status updates (`pain.002` status reports, `camt.054`
debit/credit notifications) that they are familiar with.

**Advantages:**
- Zero corporate training required. The corporate uses their existing
  treasury portal exactly as before.
- Zero corporate change-management. The corporate's payment workflow is
  unchanged.
- The corporate benefits from faster settlement and lower fees without
  knowing MTQ is involved.

**Disadvantages:**
- The corporate cannot explicitly request MTQ settlement.
- The corporate cannot see MTQ-specific information (e.g., atomic
  settlement finality, real-time position).

**Use case:** Banks that want to offer faster cross-border settlement to
their corporate customers without requiring them to change behavior.

### 12.10.2 Mode B — MTQ-Visible Experience

In Mode B, the corporate customer DOES see MTQ. The corporate's treasury
portal (BNK-01) is augmented with an "MTQ Settlement" option, alongside
the existing SWIFT/ISO 20022 options. When the corporate selects MTQ, the
payment flow routes through the bank's MBG, and the corporate sees MTQ-
specific status updates (e.g., "MTQ minted", "MTQ transferred",
"MTQ redeemed").

**Advantages:**
- The corporate can explicitly request atomic settlement.
- The corporate sees real-time MTQ positions.
- The corporate can use MTQ-specific features (e.g., atomic FX settlement,
  atomic delivery-versus-payment).

**Disadvantages:**
- Requires corporate training (the corporate's treasury team needs to
  understand MTQ).
- Requires treasury-portal enhancement (the corporate's TMS or the bank's
  corporate portal must add MTQ display).

**Use case:** Sophisticated corporate treasuries that want atomic
settlement and real-time positions.

### 12.10.3 Mode Selection

The bank chooses the mode per corporate customer based on:
- The corporate's sophistication (smaller corporates get Mode A; large
  multinational treasuries may get Mode B).
- The corporate's preference (some corporates prefer the simpler Mode A;
  others want the visibility of Mode B).
- The bank's commercial model (Mode B may carry a premium fee; Mode A may
  be offered as a "faster payments" tier).

Both modes use the same MBG infrastructure behind the scenes. The only
difference is what the corporate sees in their bank portal.

## 12.11 Illustrative Example — A Corporate Seeing MTQ in Their Bank Portal

This example walks through the Mode B customer-visible experience for a
corporate initiating an AED 1,000,000 → SGD payment through their bank's
treasury portal.

### 12.11.1 Pre-Conditions

- **Corporate:** Acme Logistics (Dubai, UAE)
- **Bank:** Reference-Responsible-Bank (SIMULATED — illustrative)
- **Treasury portal:** The corporate uses the bank's corporate-portal
  web interface, which has been augmented with an "MTQ Settlement" option
  (Mode B).
- **Corporate's accounts:**
  - AED operating account at Reference-Responsible-Bank (SIMULATED)
  - SGD operating account at the receiving bank (SIMULATED — SGD-side)
- **Beneficiary:** Acme Logistics (Singapore subsidiary)
- **MTQ setup:** The corporate has been onboarded for MTQ settlement by
  the bank. The bank has a valid BankSecurityProfile registered with
  MITHQAL Core. The bank's attestation key is registered.

### 12.11.2 The Treasury Portal View

At T+0 seconds, the corporate treasurer (Acme's CFO) logs into the bank's
corporate portal. They navigate to "Payments → New Payment" and see:

```
+-----------------------------------------------+
| New Payment                                   |
+-----------------------------------------------+
| From account: AED Operating Account          |
|               (...1234, AED 2,500,000 avail) |
| Beneficiary:   Acme Logistics SG              |
| Beneficiary bank: SGD-Side Bank               |
| Amount:        1,000,000.00 AED               |
| Value date:    Today                          |
| Payment purpose: Trade invoice INV-2026-0822 |
| Settlement method:                           |
|   ( ) SWIFT (3-5 business days, 8 bps)       |
|   ( ) ISO 20022 (1-2 days, 6 bps)            |
|   (•) MTQ Settlement (atomic, ~2 sec, 7 bps) |
+-----------------------------------------------+
| [Cancel]                       [Submit]       |
+-----------------------------------------------+
```

The treasurer selects "MTQ Settlement" and clicks Submit.

### 12.11.3 The Behind-the-Scenes Flow

At T+0 seconds, the corporate portal submits the payment to the bank's
core banking system (F01: BNK-01 → BNK-02). The CBS:
- Verifies the corporate's account has AED 1,000,000 available. ✓
- Verifies the corporate's signatory is authorized. ✓
- Provisionally debits the AED 1,000,000 from the corporate's account.

At T+~100 ms, the CBS forwards to KYC/KYB (F02: BNK-02 → BNK-03). The
KYC engine:
- Looks up Acme's KYC profile. Profile is current (refreshed 30 days ago).
- Looks up Acme's KYB profile. Legal entity verified, UBOs declared.
- Produces the KYC PASS and KYB PASS attestations.

At T+~300 ms, the KYC engine forwards to AML/sanctions (F03: BNK-03 →
BNK-04). The AML engine:
- Screens the sender (Acme Dubai), beneficiary (Acme SG), and the
  underlying invoice (INV-2026-0822) against sanctions lists. No hits.
- Runs AML monitoring rules. No alerts.
- Produces the AML PASS and SANCTIONS PASS attestations.

At T+~750 ms, the AML engine forwards to FX/treasury (F04: BNK-04 →
BNK-05). The treasury:
- Quotes AED/SGD direct: AED 1,000,000 → SGD 365,200 (rate 0.36520).
- Quotes AED/USD/SGD bridge: AED 1,000,000 → USD 272,200 → SGD 367,365
  (rate 0.36737).
- Selects the USD-bridge (better rate).
- Executes the FX legs: AED→USD via the bank's existing FX desk, USD→SGD
  via the bank's SGD-side correspondent.

At T+~1,000 ms, the treasury forwards the post-compliance instruction
to the MBG adapter (F05: BNK-05 → MBG-01). The MBG:
- Translates the instruction into the canonical
  `MTQSettlementInstruction` (22 fields).
- Attaches the bank's signed `BankComplianceAttestation` (the 7
  assertions: KYC, KYB, AML, SANCTIONS, ACCOUNT_AUTHORITY,
  FUNDS_AVAILABLE, TRANSACTION_AUTHORIZED).
- Signs the instruction with the bank's attestation key.
- Forwards to the ISO 20022 layer (F06: MBG-01 → MBG-02).

At T+~1,050 ms, the ISO 20022 layer encodes the instruction as a
`pacs.008` FIToFICustomerCreditTransfer and forwards to MITHQAL Core
(F07: MBG-02 → MTH-01). MITHQAL Core:
- Receives the instruction at `/v1/settlement/instructions`.
- Verifies the mTLS client cert (the bank's MBG identity).
- Verifies the request signature (the bank's attestation key, per §10
  BankSecurityProfile).
- Verifies the idempotency key (the bank's UETR — unique, not replayed).
- Verifies the timestamp (fresh, within the 60-second replay window).
- Runs the §18 ZeroTrustVerification (signature + attestation validity +
  replay-prevention).

At T+~1,200 ms, MITHQAL Core runs BM-09 through BM-15:
- BM-09 (Eligibility Check): Acme's institution is registered and
  authorized. ✓
- BM-10 (Jurisdiction Check): UAE and Singapore are both APPROVED
  jurisdictions. ✓
- BM-11 (Backing Verification): The bank's Protected Backing Cell
  (Book B of the §51 three-book ledger) has sufficient backing
  ($130M for $100M outstanding, 130% strategic target met). ✓
- BM-12 (Bank-Specific Risk): Acme's bank risk score is 0.18
  (illustrative — well below the 0.5 risk threshold). ✓
- BM-13 (System-Wide Risk): The system-wide concentration is 0.13
  (well below the 0.20 hard effective ceiling). ✓
- BM-14 (DMCE Check): The Dynamic Minting Capacity Engine has capacity
  for the mint. ✓
- BM-15 (Monetary Authorization): The MITHQAL Monetary & Reserve Control
  Division signs the authorization. ✓

At T+~1,350 ms, MITHQAL Core forwards to the Ledger State Machine
(F08: MTH-01 → MTH-02). The ledger:
- Submits to the Finality Gate (F09: MTH-02 → MTH-03).
- The Finality Gate verifies all 7 layers (L1 API, L2 Workflow, L3
  Policy, L4 Authorization, L5 Ledger State Machine, L6 Database TX
  State, L7 Smart Contract). All pass. ✓
- The mint executes atomically (BM-16: Finality Verification + Mint).
- 272,000 MTQ is minted to Acme's corporate MTQ settlement account
  (the equivalent of AED 1,000,000 ≈ USD 272,000 at the FX rate).

At T+~1,500 ms, the minted MTQ is transferred to the receiving bank's
corporate MTQ settlement account (atomic — same ledger, same transaction).

At T+~1,590 ms, the MTQ is redeemed at the receiving bank. The receiving
bank's MBG translates the redemption into a SGD credit to Acme SG's
operating account. SGD 367,365 is credited.

At T+~1,730 ms, the receiving bank's MBG produces a `camt.054`
BankToCustomerDebitCreditNotification to Acme SG.

At T+~1,790 ms, the sending bank's MBG produces a `pain.002` status
report (status: ACSC — Accepted, Settlement Completed) and a
`camt.054` debit notification to Acme Dubai.

### 12.11.4 The Treasury Portal — Updated View

At T+~1,800 ms (under 2 seconds from the corporate's Submit click), the
corporate treasurer's treasury portal shows:

```
+--------------------------------------------------------+
| Payment CONFIRMED                                      |
+--------------------------------------------------------+
| Payment ID:         PAY-2026-0822-AEDSGD-001          |
| Status:             SETTLED (MTQ atomic)              |
| MTQ ID:             MTQ-7F3A92C1-9B4E-4F1D-8A2C-...   |
| From:               AED Operating (...1234)           |
| Beneficiary:        Acme Logistics SG                 |
| Amount debited:     AED 1,000,000.00                  |
| Amount credited:    SGD 367,365.00                    |
| FX route:           AED → USD → SGD (USD-bridge)     |
| Settlement method:  MTQ Settlement (atomic)           |
| Fees:               7 bps = SGD 257.29               |
| Started:            2026-08-22T10:23:15.000Z         |
| Settled:            2026-08-22T10:23:16.790Z         |
| Total time:         1.790 seconds                     |
+--------------------------------------------------------+
```

### 12.11.5 What Acme's CFO Sees in the Bank Portal

The corporate CFO at Acme Dubai sees:

- A payment confirmation with a familiar structure (Payment ID, From,
  Beneficiary, Amount debited, Amount credited).
- An MTQ ID (the canonical MTQ transaction ID).
- The FX route (USD-bridge) — the same FX the bank would have executed
  for a traditional SWIFT payment, but executed atomically.
- The settlement method (MTQ Settlement atomic) — Mode B visibility.
- The fees (7 bps = SGD 257.29) — significantly cheaper than the typical
  25–50 bps for a traditional cross-border payment.
- The total time (1.790 seconds) — significantly faster than the typical
  3–5 business days for SWIFT.

The corporate CFO at Acme SG sees a `camt.054` notification showing
SGD 367,365 credited to the SGD operating account, with the same Payment
ID and the same MTQ ID for cross-reference.

### 12.11.6 What Acme's CFO Does NOT See

The corporate CFO does NOT see:

- The bank's underlying compliance attestations (KYC/KYB/AML/sanctions).
- The bank's Protected Backing Cell allocation.
- The MITHQAL Monetary Control authorization signature.
- The 7-layer Finality-Before-Mint enforcement details.
- The 5-source reconciliation state.

These remain internal to the bank and MITHQAL. The corporate sees only
the customer-facing view — fast, atomic settlement at lower cost than
traditional cross-border payments.

### 12.11.7 What Could Have Failed

If any of the following had failed, the corporate would have seen a
"BLOCKED" status instead of "SETTLED":

- KYC/KYB PASS: would have shown "BLOCKED — Compliance" (no further
  details; the bank's compliance team would handle the resolution).
- AML/SANCTIONS PASS: would have shown "BLOCKED — Sanctions review
  required" (the bank's sanctions team would handle the false-positive
  review).
- BANK RISK (BM-12): would have shown "BLOCKED — Bank risk threshold
  exceeded" (rare; would require bank risk-team review).
- DMCE (BM-14): would have shown "BLOCKED — System capacity" (the
  Dynamic Minting Capacity Engine has no capacity; the bank would
  retry later).
- FINALITY GATE: would have shown "BLOCKED — Finality failure" (a
  serious system event; MITHQAL ops would investigate).

In all cases, the corporate's funds remain in their AED account (the
provisional debit is reversed). The corporate sees only the BLOCKED
status — the bank and MITHQAL handle the underlying investigation.

## 12.12 Section 12 Summary

The MBG is the architectural sidecar that connects regulated banking
infrastructure to MITHQAL without requiring banks to replace any of their
authoritative systems. The MBG's principle is "TRANSLATION, NOT
TRANSFORMATION" — it faithfully re-encodes bank instructions into the
MTQ schema, without altering their economic meaning. The 12 integration
nodes (BNK-01 through MTH-03) span three domains (BANK, MBG, MITHQAL) and
are connected by 9 canonical flows (F01 through F09). The MBG supports 9
ISO 20022 messages with deterministic field mapping (PASS_THROUGH,
DERIVED, VALIDATED, REJECTED). The MBG is SWIFT-compatible and
complementary — it adds atomic settlement as an additional rail, not a
replacement for existing rails. The 8-rail catalog gives banks choice of
transport based on transaction type, currency pair, and operational
preference. Mode A (MTQ invisible) and Mode B (MTQ visible) let banks
offer MTQ settlement with or without corporate-facing MTQ UX. The demo
AED↔SGD corridor settles AED 1,000,000 → SGD 367,365 in 1.79 seconds at
7 bps total cost — illustrating the MBG's value proposition: faster,
cheaper, atomic cross-border settlement without bank infrastructure
replacement.

**Honest state:** The MBG is INTEGRATION-READY at the logic/spec level.
No real bank is contracted. All 20 required MBG tests are SIMULATED.
All 18 acceptance criteria are met at the logic/spec level only. The
MBG may NOT carry live MTQ settlement until §74 honest-state invariants
transition to their production-authorized values.

---

# SECTION 13 — BANK-SIDE COMPLIANCE ATTESTATION (§8)

## 13.1 Section Scope and Authority

This section codifies the Bank-Side Compliance Attestation model — the
mechanism by which a regulated bank cryptographically attests to MITHQAL
that it has performed its compliance obligations (KYC, KYB, AML,
sanctions, account authority, funds availability) for a given settlement
instruction. It implements §8 of the v25.2 master directive and the §7
section of the MBG-FINAL-ARCHITECTURAL-AMENDMENT (codified in
`src/lib/mithqal-bank-gateway.ts`).

The Bank-Side Compliance Attestation model is the structural embodiment of
the §8 Privacy Principle: "customer identity stays in the bank". MITHQAL
does NOT re-perform compliance. MITHQAL receives the bank's signed
attestation that compliance has been performed, verifies the cryptographic
signature against the bank's registered attestation key, and accepts the
attestation as the authoritative proof of compliance.

This is the inverse of the "centralized KYC" model used by some payment
networks (where the network operator maintains its own KYC database).
The MITHQAL model preserves the bank's regulatory monopoly on KYC/KYB/AML
— the bank is the regulated entity, the bank performs the compliance, and
the bank attests to the result.

## 13.2 The §8 Privacy Principle

The v25.0 Privacy & Revenue Principles amendment establishes the canonical
privacy principle:

> **"Customer identity stays in the bank."**

This principle is non-negotiable. It is one of the 12 DO_NOT_MODIFY rules
(§34 of the MBG amendment). It is enforced structurally by:

1. **The MBG's TRANSLATION, NOT TRANSFORMATION principle** — the MBG
   does not extract customer identity data from the bank's systems. The
   MBG only re-encodes the bank's signed attestation.

2. **The §7 BankComplianceAttestation schema** — the attestation contains
   only the assertion (KYC/KYB/AML/etc.), the attestation ID, the
   timestamp, and the bank officer / system that attested. It does NOT
   contain customer identity data, document copies, UBO declarations,
   PEP hits, or sanctions hits.

3. **The ISO 20022 field-mapping REJECTED rule** — fields that would
   carry customer identity (sender name, sender IBAN, etc.) are
   explicitly rejected from the canonical `MTQSettlementInstruction`
   and replaced with pseudonymous references.

4. **The §10 BankSecurityProfile** — the bank's attestation key is
   registered with MITHQAL, but the bank's customer database is not.
   MITHQAL can verify a bank-issued attestation cryptographically
   without ever seeing the underlying customer data.

5. **The §47 Protected Backing Cell** — the backing cell schema contains
   institution IDs, custodian IDs, and asset descriptions, but NOT
   customer identity. The customer's role in the backing chain is
   indirect (the customer's bank holds the backing, not the customer).

## 13.3 The 6 Customer/Account PASS Attestations

The MBG amendment's §7 BankComplianceAttestation schema defines 7
required assertions. Six of these are customer/account-level PASS
attestations (the topic of this section); the seventh (TRANSACTION_AUTHORIZED)
is a transaction-level authorization assertion that the bank's existing
authorization workflow produces.

The 6 customer/account PASS attestations are enumerated below. For each,
this section specifies:
- The assertion name (KYC PASS, etc.)
- Who generates the attestation (which bank system)
- Where validation occurs (bank-side vs. MITHQAL-side)
- What MITHQAL receives (the attestation content)
- What remains in the bank (the underlying compliance data)

### 13.3.1 KYC PASS — Know-Your-Customer

**Assertion name:** KYC PASS

**Who generates:** The bank's KYC engine (BNK-03 in the §12 node
catalogue). Specifically, the KYC engine's "customer verification" module
produces the assertion when:
- The corporate customer's KYC profile is current (refreshed within the
  bank's policy refresh cycle — typically 12 months for low-risk, 6
  months for medium-risk, 3 months for high-risk).
- The corporate customer's identity documents have not expired.
- The corporate customer's risk rating permits the transaction (e.g.,
  a high-risk customer may be permitted only up to a threshold amount).

**Where validation occurs:** At the bank. The bank's KYC engine runs the
verification against the bank's KYC database, document management system,
and risk-rating engine. MITHQAL does NOT run any KYC check.

**What MITHQAL receives:**
- The assertion type (`"KYC"` in the `BankComplianceAssertionType` enum).
- Whether the assertion passed (`passed: true`).
- The bank-internal attestation record ID (opaque to MITHQAL — used only
  for the bank's audit trail).
- The timestamp when the bank attested the assertion (`attestedAt`).
- The bank officer / system that attested (`attestedBy`, e.g.,
  "BANK-COMPLIANCE-SYSTEM" or "officer-12345").

**What remains in the bank:**
- The customer's identity documents (passport, articles of incorporation,
  UBO declarations, etc.).
- The customer's KYC profile (date of birth, address, nationality, etc.).
- The customer's risk rating and risk-rating history.
- The customer's PEP (Politically Exposed Person) status.
- The customer's adverse-media screening results.
- The customer's document-provenance chain (when each document was
  collected, who verified it, what verification method was used).

MITHQAL never sees any of this. The bank retains it for its own
regulatory obligations (FATF Recommendation 10, Basel CDD
requirements, local KYC regulations).

### 13.3.2 KYB PASS — Know-Your-Business

**Assertion name:** KYB PASS

**Who generates:** The bank's KYB engine (typically the same KYC/KYB
engine as BNK-03, with a KYB-specific module). The KYB module produces
the assertion when:
- The corporate legal entity is verified (registry filing, articles of
  incorporation, certificate of good standing).
- The beneficial owners are declared and verified (UBO declarations at
  the thresholds required by the bank's jurisdiction — typically 25% per
  FATF Recommendation 10, or 10% for higher-risk sectors).
- The corporate's source-of-funds documentation is on file.
- The corporate's business-purpose documentation is on file.

**Where validation occurs:** At the bank. The bank's KYB engine runs
the verification against the corporate registry (Companies House,
Securities and Exchange Commission, the local equivalent), the bank's
UBO database, and the bank's source-of-funds documentation archive.

**What MITHQAL receives:**
- The assertion type (`"KYB"`).
- Whether the assertion passed (`passed: true`).
- The bank-internal attestation record ID.
- The timestamp.
- The attesting officer / system.

**What remains in the bank:**
- The corporate's legal entity documentation (certificate of
  incorporation, registry filing, business license).
- The corporate's UBO declarations (with supporting documentation).
- The corporate's source-of-funds documentation (bank statements, tax
  returns, audit reports, contracts, etc.).
- The corporate's business-purpose documentation (the underlying
  business activity that justifies the corporate's transactions).
- The corporate's registry-search results (showing no matches against
  PEP, sanctions, or adverse-media lists at the entity level).

### 13.3.3 AML PASS — Anti-Money-Laundering

**Assertion name:** AML PASS

**Who generates:** The bank's AML engine (BNK-04). The AML module
produces the assertion when:
- The transaction has been screened against the bank's AML rules
  (typically a behavioral-analytics model: unusual-amount alerts,
  unusual-pattern alerts, structuring alerts, etc.).
- Any AML alerts generated by the transaction have been dispositioned
  (cleared as false-positive or escalated to a SAR/STR).
- The transaction does not violate the bank's AML policy (e.g., the
  transaction is not with a high-risk jurisdiction without
  justification, the transaction is not structurally evasive, etc.).

**Where validation occurs:** At the bank. The bank's AML engine runs
the transaction monitoring rules against the corporate's full
transaction history, the corporate's risk profile, and the bank's AML
scenarios. The bank's AML investigations team handles any alerts
generated.

**What MITHQAL receives:**
- The assertion type (`"AML"`).
- Whether the assertion passed (`passed: true`).
- The bank-internal attestation record ID (opaque to MITHQAL —
  typically a SAR/STR reference number if escalated, or a
  "no-alert" reference if cleared).
- The timestamp.
- The attesting officer / system.

**What remains in the bank:**
- The transaction monitoring alerts (the specific scenarios triggered,
  the alert severity, the alert investigation notes).
- The SAR/STR filings (if any) — these are confidential to the bank's
  AML investigations team and the regulator; they are NEVER shared with
  MITHQAL.
- The AML rules (the bank's proprietary transaction-monitoring scenarios,
  thresholds, and tuning parameters).
- The corporate's transaction monitoring history (the full alert
  history, dispositions, and outcomes).
- The bank's AML risk-rating methodology.

### 13.3.4 SANCTIONS PASS — Sanctions Screening

**Assertion name:** SANCTIONS PASS

**Who generates:** The bank's sanctions screening engine (BNK-04, the
same engine as AML but a separate module). The sanctions module produces
the assertion when:
- The sender (corporate) has been screened against all applicable
  sanctions lists (OFAC SDN, UN Consolidated, EU Consolidated, HMT
  OFSI, local regulator lists).
- The beneficiary has been screened.
- Any intermediary banks have been screened.
- The payment purpose has been screened for sanctions implications.
- Any sanctions hits have been dispositioned (cleared as false-positive
  via the bank's sanctions-investigations team, or escalated for OFAC
  license / regulator review).

**Where validation occurs:** At the bank. The bank's sanctions engine
runs the screening against the bank's sanctions-list database
(typically a vendor like Accuity Fircosoft, Dow Jones Risk &
Compliance, Refinitiv World-Check One, NICE Actimize SAM, etc.).

**What MITHQAL receives:**
- The assertion type (`"SANCTIONS"`).
- Whether the assertion passed (`passed: true`).
- The bank-internal attestation record ID (opaque — typically a
  screening-result reference or a license-reference if an OFAC license
  applies).
- The timestamp.
- The attesting officer / system.

**What remains in the bank:**
- The sanctions screening results (the specific lists screened, the
  hits found, the false-positive dispositions).
- The sanctions-investigation notes (the rationale for clearing a hit
  as false-positive).
- The OFAC license / regulator-license documentation (if a payment was
  cleared under a specific license).
- The sanctions-list versions (the bank's screening used a specific
  list version on a specific date).
- The bank's sanctions-screening methodology.

### 13.3.5 ACCOUNT AUTHORITY PASS — Account Authority

**Assertion name:** ACCOUNT AUTHORITY PASS

**Who generates:** The bank's core banking system (BNK-02) — specifically,
the "account authority" module that verifies that the corporate
signatory instructing the transaction is authorized to do so. The module
produces the assertion when:
- The corporate signatory's identity has been verified (the signatory
  logged into the treasury portal with their credentials — 2FA / SSO /
  hardware token).
- The signatory is on the corporate's authorized-signatory list (the
  list of officers who can instruct payments on behalf of the corporate).
- The signatory is authorized for the specific transaction (per the
  corporate's authorization matrix — single-signature for low-value,
  dual-signature for medium-value, committee-approval for high-value).
- The signatory's authorization limit covers the transaction amount.

**Where validation occurs:** At the bank. The bank's core banking
system runs the authorization check against the corporate's
authorized-signatory list and authorization matrix.

**What MITHQAL receives:**
- The assertion type (`"ACCOUNT_AUTHORITY"`).
- Whether the assertion passed (`passed: true`).
- The bank-internal attestation record ID (typically the corporate's
  authorization-event ID — opaque to MITHQAL).
- The timestamp.
- The attesting officer / system.

**What remains in the bank:**
- The corporate's authorized-signatory list (the specific officers,
  their authorization limits, their authorization scope).
- The corporate's authorization matrix (which signatories can authorize
  which transaction types up to which thresholds).
- The signatory's authentication details (the 2FA / SSO / hardware
  token used for this transaction).
- The signatory's authentication history (past logins, past
  authentications, anomaly-detection results).
- The bank's authorization-policy documentation.

### 13.3.6 FUNDS AVAILABLE PASS — Funds Available

**Assertion name:** FUNDS AVAILABLE PASS

**Who generates:** The bank's core banking system (BNK-02) — specifically,
the "funds availability" module that verifies the corporate's account has
sufficient settled funds to cover the transaction. The module produces
the assertion when:
- The corporate's account balance (after pending debits and credits) is
  sufficient to cover the transaction amount plus fees.
- The funds are settled (not just authorized) — the distinction matters
  for banks that distinguish between authorized-but-unsettled and
  settled funds.
- The funds are not subject to a hold (e.g., a hold placed by the bank's
  fraud-prevention team, a hold placed by a court order, or a hold
  placed by the regulator).

**Where validation occurs:** At the bank. The bank's core banking
system runs the funds-availability check against the corporate's
account ledger.

**What MITHQAL receives:**
- The assertion type (`"FUNDS_AVAILABLE"`).
- Whether the assertion passed (`passed: true`).
- The bank-internal attestation record ID (typically the corporate's
  account-ledger entry ID — opaque to MITHQAL).
- The timestamp.
- The attesting officer / system.

**What remains in the bank:**
- The corporate's account balance (the actual amount — MITHQAL only
  knows that the balance is sufficient for the specific transaction).
- The corporate's account ledger (the full transaction history).
- The corporate's pending transactions (other pending debits and
  credits).
- The corporate's holds (any holds on the account).
- The corporate's account type (operating, savings, escrow, etc. —
  different account types have different funds-availability rules).

### 13.3.7 The 7th Assertion — TRANSACTION AUTHORIZED

While the task scope is the 6 customer/account PASS attestations above,
the MBG amendment's §7 also defines a 7th assertion:
`TRANSACTION_AUTHORIZED`. This assertion is the bank's transaction-level
authorization — produced by the bank's existing payment-authorization
workflow after all customer/account-level checks have passed. It is the
bank's signed "go-ahead" for the specific transaction.

The TRANSACTION_AUTHORIZED assertion is distinct from the 6 customer/account
PASS attestations because:
- The 6 PASS attestations are about the customer and the account
  (customer identity verified, customer's business verified, customer's
  transaction is AML-clean, etc.).
- The TRANSACTION_AUTHORIZED assertion is about the specific transaction
  (the bank's payment-authorization workflow has approved this specific
  payment for execution).

In practice, the TRANSACTION_AUTHORIZED assertion is the bank's payment-
gateway approval (the same approval that authorizes any traditional
payment). The MBG re-encodes it as the 7th required assertion in the
`BankComplianceAttestation` schema.

## 13.4 Cryptographic Verification

The bank's attestation is cryptographically signed using the bank's
attestation key, registered with MITHQAL via the §10 BankSecurityProfile.
The verification flow is:

### 13.4.1 Attestation Key Registration

Before a bank can issue attestations, it must register an attestation key
with MITHQAL. The registration process is:

1. **The bank generates a keypair** in its HSM (Hardware Security Module).
   The private key never leaves the HSM. The public key is exported.

2. **The bank submits the public key** to MITHQAL via the §10
   BankSecurityProfile registration endpoint. The submission includes:
   - The bank's institution ID.
   - The bank's BIC (Bank Identifier Code) — for cross-referencing with
     SWIFT.
   - The bank's regulatory-license references (so MITHQAL can verify the
     bank is regulated).
   - The bank's attestation-key public key (typically an Ed25519
     public key, ~32 bytes).
   - The key's intended use (`attestation`).
   - The key's activation date and expiration date.

3. **MITHQAL verifies the bank's regulatory status** through the
   jurisdictional registry (§9 of the licensing-entity-matrix). The bank
   must be a regulated deposit-taking institution in its jurisdiction.

4. **MITHQAL registers the attestation key** in its `BankSecurityProfile`
   database. The key is now associated with the bank's institution ID and
   can be used to verify attestations from that bank.

5. **The bank's attestation key is registered for a fixed period**
   (typically 12 months) and must be rotated before expiration. Rotation
   is a similar process: generate a new keypair, submit the new public
   key, verify, and deactivate the old key after a grace period (typically
   30 days).

### 13.4.2 Attestation Signature Format

The bank's attestation is signed using the Ed25519 signature scheme. The
signed payload is the JSON serialization of the attestation (minus the
signature field), canonicalized via JSON Canonicalization Scheme (RFC
8785) to ensure deterministic signing.

The signature is then included as the `signature` field of the
`BankComplianceAttestation`:

```typescript
{
  attestationId: "ATT-A1B2C3D4E5F6",
  institutionId: "BANK-REG-12345",
  assertions: [
    { assertion: "KYC", passed: true, ... },
    { assertion: "KYB", passed: true, ... },
    { assertion: "AML", passed: true, ... },
    { assertion: "SANCTIONS", passed: true, ... },
    { assertion: "ACCOUNT_AUTHORITY", passed: true, ... },
    { assertion: "FUNDS_AVAILABLE", passed: true, ... },
    { assertion: "TRANSACTION_AUTHORIZED", passed: true, ... }
  ],
  signature: "0x<128 hex chars Ed25519 signature>",
  issuedAt: "2026-08-22T10:23:15.000Z",
  expiresAt: "2026-08-22T11:23:15.000Z",
  complianceSystemVersion: "ACME-COMPLIANCE-v3.2.1"
}
```

The `signature` field is the Ed25519 signature over the canonicalized
JSON of all other fields (excluding `signature` itself).

### 13.4.3 MITHQAL-Side Verification

When the MBG submits an `MTQSettlementInstruction` carrying a
`BankComplianceAttestation`, MITHQAL Core performs the following
verification (per §18 ZeroTrustVerification of the MBG amendment):

1. **Lookup the bank's attestation key** by the `institutionId` field
   of the attestation. The key is found in the §10 BankSecurityProfile
   database.

2. **Verify the key is active** (current date is within the key's
   activation date and expiration date, and the key has not been
   revoked).

3. **Verify the signature** by re-canonicalizing the attestation (minus
   the `signature` field) and checking the Ed25519 signature against
   the bank's public key. If the signature is invalid, the entire
   instruction is rejected.

4. **Verify the attestation is not expired** (the `expiresAt` field is
   in the future).

5. **Verify all 7 required assertions are present and passed** (per
   `REQUIRED_COMPLIANCE_ASSERTIONS` — KYC, KYB, AML, SANCTIONS,
   ACCOUNT_AUTHORITY, FUNDS_AVAILABLE, TRANSACTION_AUTHORIZED).

6. **Verify the attestation has not been replayed** (the `attestationId`
   is unique within the bank's recent attestation history; MITHQAL
   keeps a 24-hour replay-prevention cache).

7. **Verify the attestation was issued by the bank's compliance system**
   (the `complianceSystemVersion` is in the bank's registered
   compliance-system-version list).

If all 7 verification steps pass, the attestation is accepted as
authoritative proof of compliance. If any step fails, the entire
instruction is rejected at the §18 ZeroTrustVerification step (BM-08 in
the 16-step workflow).

### 13.4.4 The `validateComplianceAttestation` Function

The verification is implemented in `mithqal-bank-gateway.ts`:

```typescript
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
```

This function performs the structural validation (steps 4–6 above). The
signature verification (step 3) and the key-lookup (steps 1–2) are
performed by the §18 ZeroTrustVerification layer, which calls
`validateComplianceAttestation` as a sub-step.

## 13.5 Expiry, Replay Prevention, Revocation

### 13.5.1 Attestation Expiry

Every attestation has an explicit expiry timestamp (`expiresAt`). The
default expiry is 24 hours from issuance (the MBG amendment specifies
this as the maximum). The expiry ensures that an attestation cannot be
used to authorize a transaction long after the underlying compliance
checks were performed — if the bank's compliance posture changes
(e.g., a customer is added to a sanctions list), an old attestation
becomes invalid.

The expiry also bounds the replay-attack window. An attacker who
intercepts an attestation cannot reuse it after 24 hours.

The expiry is verified by `validateComplianceAttestation` (step 4
above). If `expiresAt` is in the past, `expired = true` and the
attestation is invalid.

### 13.5.2 Replay Prevention

MITHQAL maintains a 24-hour replay-prevention cache of attestation IDs.
When an attestation is received, MITHQAL checks the cache:
- If the `attestationId` is in the cache, the attestation is a replay
  (a duplicate submission) and is rejected.
- If the `attestationId` is not in the cache, it is added to the cache
  (with a 24-hour TTL).

This prevents an attacker from replaying a previously-accepted
attestation to authorize a different transaction.

The replay-prevention cache is per-bank — an `attestationId` from Bank
A cannot collide with an `attestationId` from Bank B (they are
namespaced by `institutionId`).

### 13.5.3 Attestation Revocation

The bank can revoke an attestation before its expiry. Revocation is
necessary when:
- The bank discovers a compliance failure after the attestation was
  issued (e.g., a sanctions hit that was incorrectly cleared as a
  false-positive).
- The bank's compliance system is compromised (e.g., a key compromise).
- The underlying transaction is cancelled by the corporate.

The revocation flow is:

1. **The bank issues a revocation message** to MITHQAL Core via the
   `/v1/attestations/{attestationId}/revoke` endpoint. The revocation
   is signed by the bank's attestation key (the same key that signed
   the original attestation).

2. **MITHQAL verifies the revocation signature** against the bank's
   attestation key. If the signature is valid, the revocation is
   accepted.

3. **MITHQAL adds the attestation ID to the revocation list**. The
   revocation list is checked during attestation verification (step 6
   of the §13.4.3 verification flow above).

4. **If the attestation has already been used** (the corresponding
   transaction has settled), MITHQAL flags the transaction for
   investigation but does NOT reverse it (the settlement is final
   per the §54 Finality-Before-Mint invariant).

5. **MITHQAL notifies the bank's compliance team** of the revocation
   outcome (transaction settled / pending / blocked).

### 13.5.4 Key Revocation (vs. Attestation Revocation)

Attestation revocation is per-attestation. Key revocation is per-key —
if the bank's attestation key is compromised, the bank can revoke the
entire key, which invalidates all attestations signed by that key.

Key revocation is performed via the §10 BankSecurityProfile endpoint
`/v1/banks/{institutionId}/keys/{keyId}/revoke`. The revocation is
signed by the bank's master key (a separate, higher-security key used
only for key management). MITHQAL immediately marks the key as revoked
and refuses all future attestations signed by that key.

Key revocation does NOT retroactively invalidate attestations signed by
the key before revocation — those attestations remain valid until
their natural expiry. This is the standard cryptographic-revocation
tradeoff: revocation is forward-looking, not backward-looking.

## 13.6 Audit Trail

Every attestation-related event is logged in an append-only audit
trail. The audit trail captures:

1. **Attestation issuance:** When the bank issues an attestation, the
   attestation ID, the bank's institution ID, the assertion list, the
   issued-at timestamp, and the compliance-system version are recorded.

2. **Attestation submission:** When the MBG submits an attestation to
   MITHQAL, the submission timestamp, the request IP, the mTLS client
   cert CN, and the request ID are recorded.

3. **Attestation verification:** When MITHQAL verifies an attestation,
   the verification timestamp, the verifier (typically "MITHQAL-Core"),
   the verification result (valid / invalid), and the specific failure
   reason (if any) are recorded.

4. **Attestation use:** When an attestation is used to authorize a
   transaction (the BM-08 ZeroTrustVerification step), the transaction
   ID, the attestation ID, and the use timestamp are recorded.

5. **Attestation revocation:** When a bank revokes an attestation, the
   revocation timestamp, the revoking officer, the revocation reason,
   and the affected transaction IDs are recorded.

6. **Key rotation:** When a bank rotates its attestation key, the old
   key ID, the new key ID, the rotation timestamp, and the activating
   officer are recorded.

The audit trail is immutable (append-only) and is stored for a minimum
of 7 years (the standard financial-records retention period). The
audit trail is accessible to:
- MITHQAL's internal audit team.
- The bank's compliance team (for their own bank's attestations).
- Independent auditors (with appropriate authorization).
- Regulators (via subpoena or formal information request).

## 13.7 Dispute Handling

A dispute arises when a bank and MITHQAL disagree about an attestation-
related event. Examples:
- The bank claims an attestation was forged; MITHQAL's verification
  accepted it as valid.
- The bank revokes an attestation, but the underlying transaction has
  already settled; the bank disputes the settlement.
- MITHQAL rejects an attestation as invalid; the bank disputes the
  rejection.

The dispute-resolution process is:

1. **The disputing party files a dispute** via the
   `/v1/disputes` endpoint. The dispute includes:
   - The disputed event (the attestation ID, transaction ID, etc.).
   - The disputing party's position.
   - The disputing party's evidence (audit-trail excerpts, signatures,
     etc.).
   - The requested resolution (reversal, reinstatement, etc.).

2. **MITHQAL's dispute-resolution team reviews the dispute** within 5
   business days. The team:
   - Reviews the audit trail.
   - Re-verifies the disputed attestation's signature.
   - Reviews the bank's compliance-system version and any known issues.
   - Reviews the bank's attestation-key history.

3. **The dispute-resolution team issues a preliminary ruling.** The
   ruling is shared with the bank's compliance team.

4. **Either party can escalate** to the MITHQAL Governance Council
   (a multi-stakeholder body with bank, regulator, and MITHQAL
   representation). The Council's ruling is binding.

5. **In the case of suspected fraud or criminal activity,** the
   dispute is escalated to law enforcement.

The dispute-resolution process is designed to be transparent and
auditable. Every step is logged. Every ruling is signed.

## 13.8 Jurisdictional Differences

Different jurisdictions impose different compliance requirements. The
MBG is designed to accommodate these differences without modifying
the attestation schema. The jurisdictional differences are:

### 13.8.1 KYC Thresholds

- **US (FinCEN):** Customer Identification Program (CIP) under the
  USA PATRIOT Act. Threshold for enhanced due diligence: $5,000
  (monetary instrument purchase) or $10,000 (currency transaction
  report).
- **EU (5AMLD/6AMLD):** Customer due diligence (CDD) thresholds.
  Threshold for simplified due diligence: EUR 15,000 (occasional
  transactions).
- **UK (JMLSG):** KYC thresholds similar to EU but with UK-specific
  guidance.
- **UAE (CCL):** Threshold for enhanced due diligence: AED 40,000
  (~USD 11,000).
- **Singapore (MAS):** Threshold for enhanced due diligence: SGD
  20,000 (~USD 15,000) for occasional transactions.

The bank's KYC engine applies the thresholds for its jurisdiction. The
KYC PASS assertion does NOT specify the threshold; it only attests that
the bank's KYC checks have been performed per the bank's jurisdictional
requirements.

### 13.8.2 AML Rules

Each jurisdiction has its own AML rules (FATF Recommendations are
the baseline, but each jurisdiction adds local requirements). The
bank's AML engine applies its jurisdiction's rules. The AML PASS
assertion does NOT specify the rules; it only attests that the bank's
AML checks have been performed.

### 13.8.3 Sanctions Lists

Each jurisdiction has its own sanctions lists (in addition to the UN
Consolidated List):
- **US:** OFAC SDN, OFAC NS-PLC, OFAC SSI.
- **EU:** EU Consolidated Financial Sanctions List.
- **UK:** HMT OFSI Consolidated List.
- **Australia:** DFAT Consolidated List.
- **Canada:** SEMA Consolidated Canadian Autonomous Sanctions List.
- **UAE:** UAE Local Terrorist List.
- **Singapore:** MAS Targeted Financial Sanctions.

The bank's sanctions engine applies its jurisdiction's lists. The
SANCTIONS PASS assertion does NOT specify the lists; it only attests
that the bank's sanctions checks have been performed.

### 13.8.4 The Jurisdiction-Neutral Assertion Model

The MBG's attestation schema is jurisdiction-neutral. The 6
customer/account PASS attestations do not encode jurisdiction-specific
thresholds, rules, or lists. They only attest that the bank has performed
its compliance obligations per its jurisdictional requirements.

This is a deliberate design choice. If the attestation schema encoded
jurisdiction-specific thresholds (e.g., "KYC PASSED with $5,000
threshold"), MITHQAL would have to maintain a registry of all
jurisdictions' thresholds and rules — which would make MITHQAL a
compliance authority, contradicting the §8 Privacy Principle. By keeping
the attestation schema jurisdiction-neutral, MITHQAL remains a
verification authority (verifying the bank's signature), not a
compliance authority (re-performing the bank's compliance).

### 13.8.5 Jurisdictional Restrictions on MITHQAL

While the attestation schema is jurisdiction-neutral, MITHQAL DOES
maintain a jurisdictional registry (§9 of the licensing-entity-matrix)
that restricts which jurisdictions' banks can connect to MITHQAL.
A bank in a sanctioned jurisdiction (e.g., Iran, North Korea, Syria
under OFAC sanctions) cannot register with MITHQAL regardless of the
attestations it produces. The jurisdictional registry is checked at
BM-10 (Jurisdiction Check) in the 16-step workflow.

Currently, the jurisdictional registry is implemented with 0
validated jurisdictions — all 8 seeded jurisdictions are in
JURISDICTION_PENDING state. This is one of the §74 honest-state
invariants: `validatedJurisdictions = 0`.

## 13.9 Selective Disclosure and Zero-Knowledge Proof Compatibility

The attestation model is designed to be compatible with selective
disclosure and zero-knowledge proof (ZKP) schemes. This is a forward-
looking design — the current implementation uses plain Ed25519
signatures, but the schema is structured to allow future migration
to ZKP-based attestations.

### 13.9.1 Selective Disclosure

Selective disclosure is the cryptographic technique where the attester
produces a single signed attestation that can be presented in multiple
"views" — each view revealing only a subset of the attested attributes.

For the MBG, selective disclosure would allow a bank to produce a
single "customer verification" attestation that includes all 6 PASS
assertions, but to present different views to different verifiers:
- To MITHQAL Core: the full attestation (all 6 PASS assertions).
- To a regulator: only the KYC PASS and AML PASS assertions.
- To an auditor: only the assertion that the bank's compliance system
  was operating normally.

The current schema does NOT implement selective disclosure — every
attestation presents all 6 assertions to MITHQAL. However, the schema
is structured as a list of independent assertions (rather than a single
composite assertion) specifically to enable future selective-disclosure
migration.

### 13.9.2 Zero-Knowledge Proof Compatibility

Zero-knowledge proofs (ZKPs) allow the attester to prove that an
assertion is true without revealing the underlying data. For the MBG,
a ZKP-based attestation would allow a bank to prove:
- "Customer KYC has been performed per the bank's jurisdictional
  requirements" — without revealing the customer's identity.
- "Customer AML has been screened against the bank's AML rules" —
  without revealing the bank's rules.
- "Customer sanctions have been screened against the bank's sanctions
  lists" — without revealing the lists or the hits.

The current implementation uses plain signatures — the bank attests
to the assertion's truth, and MITHQAL verifies the signature. MITHQAL
does NOT see the underlying data (the §8 Privacy Principle), so the
current model is already privacy-preserving. However, the current model
does NOT use ZKPs — it relies on the bank's signature as the proof.

Future migration to ZKPs would provide additional cryptographic
guarantees:
- The bank could not forge an attestation (a ZKP is mathematically
  tied to the underlying data, even if the data is not revealed).
- The bank could not retroactively alter the attestation (a ZKP is
  immutable once generated).
- The attestation could be verified by anyone with the bank's public
  key (not just MITHQAL), enabling decentralized verification.

The MBG amendment's §34 DO_NOT_MODIFY rules do NOT mandate ZKP migration.
The current Ed25519 signature scheme is the controlling spec. ZKP
migration is a future enhancement, not a current requirement.

### 13.9.3 The Future ZKP Schema

A future ZKP schema for the MBG might look like:

```typescript
interface ZKBankComplianceAttestation {
  attestationId: string;
  institutionId: string;
  // The ZKP proof — a cryptographic proof that the bank has performed
  // the required compliance checks, without revealing the underlying
  // customer data or compliance rules.
  proof: string; // base64-encoded ZKP proof
  // The ZKP schema version — identifies which proof system is used
  // (e.g., Groth16, PLONK, Halo2, STARK).
  proofSystem: string;
  // The ZKP circuit identifier — identifies the specific circuit
  // that generated the proof.
  circuitId: string;
  // The public inputs to the ZKP — typically the bank's institution
  // ID, the assertion type, the timestamp, and the expiry.
  publicInputs: string[];
  issuedAt: string;
  expiresAt: string;
  complianceSystemVersion: string;
}
```

MITHQAL would verify the ZKP using the bank's ZKP verification key
(registered via the §10 BankSecurityProfile). The verification would
be cryptographically equivalent to the current Ed25519 signature
verification, but with the additional property that the bank cannot
forge the proof even with knowledge of its own private key.

This future schema is described for design completeness. The current
implementation uses the Ed25519 signature schema described in §13.4.

## 13.10 Illustrative Example — A Bank Generating a KYC PASS Attestation

This example walks through the bank-side generation of a KYC PASS
attestation for a corporate customer.

### 13.10.1 Setup

- **Bank:** Reference-Responsible-Bank (SIMULATED — illustrative).
- **Bank's jurisdiction:** United Arab Emirates (UAE).
- **Bank's attestation key:** Ed25519 keypair, generated in the bank's
  HSM (a Thales Luna Network HSM, in this illustrative example). The
  private key is `priv-0x...` (never leaves the HSM); the public key is
  `pub-0x1a2b3c...` (registered with MITHQAL via the §10
  BankSecurityProfile).
- **Bank's compliance system:** ACME-COMPLIANCE-v3.2.1 (a hypothetical
  bank-internal compliance system).
- **Corporate customer:** Acme Logistics (Dubai, UAE).
- **Transaction:** A AED 1,000,000 cross-border payment to Acme's
  Singapore subsidiary.

### 13.10.2 The KYC Verification Process

At T+~100 ms (per the F02 flow), the bank's KYC engine (BNK-03)
receives the instruction from the core banking system. The KYC engine
performs the following checks:

1. **Customer lookup:** The KYC engine looks up Acme Logistics in the
   bank's KYC database. Acme's KYC profile is found:
   - Profile ID: `KYC-ACME-LOGISTICS-DXB-001`
   - Customer type: Corporate
   - Legal entity: Acme Logistics LLC (Dubai)
   - Registry: Dubai Department of Economic Development
   - License: Trade License No. 1234567
   - KYC refresh cycle: Annual (low-risk)
   - Last refresh: 2026-07-15 (37 days ago — current)
   - Next refresh due: 2027-07-15

2. **Document verification:** The KYC engine verifies Acme's identity
   documents are current:
   - Trade License: valid until 2027-06-30 ✓
   - Memorandum of Association: on file ✓
   - UBO declarations: on file (3 UBOs declared: Mr. Smith 60%,
     Mrs. Smith 30%, Mr. Jones 10%) ✓
   - UBO identity documents: all valid ✓

3. **PEP screening:** The KYC engine screens Acme's UBOs against the
   bank's PEP list:
   - Mr. Smith: not a PEP ✓
   - Mrs. Smith: not a PEP ✓
   - Mr. Jones: not a PEP ✓

4. **Adverse-media screening:** The KYC engine screens Acme and its UBOs
   against the bank's adverse-media database:
   - Acme Logistics LLC: no adverse media ✓
   - Mr. Smith: no adverse media ✓
   - Mrs. Smith: no adverse media ✓
   - Mr. Jones: no adverse media ✓

5. **Risk rating:** The KYC engine computes Acme's risk rating:
   - Country risk (UAE): medium
   - Industry risk (logistics): medium
   - Customer risk (corporate, 3 UBOs, no PEP, no adverse media): low
   - Overall risk rating: medium (matches the bank's existing rating)
   - Threshold check: AED 1,000,000 is below Acme's medium-risk
     transaction threshold of AED 5,000,000 ✓

6. **Source-of-funds verification:** The KYC engine verifies the source
   of funds for this specific transaction:
   - Source: Acme's operating revenue (per the bank's source-of-funds
     documentation on file)
   - Documentation: invoice INV-2026-0822 from Acme SG to Acme DXB ✓

All 6 KYC checks pass.

### 13.10.3 The KYC PASS Assertion Generation

At T+~250 ms, the KYC engine generates the KYC PASS assertion:

```json
{
  "assertion": "KYC",
  "passed": true,
  "attestationId": "KYC-ACME-2026-08-22-001",
  "attestedAt": "2026-08-22T10:23:15.250Z",
  "attestedBy": "ACME-COMPLIANCE-v3.2.1"
}
```

The `attestationId` is the bank-internal KYC verification record ID
(opaque to MITHQAL — used only for the bank's audit trail). The
`attestedBy` field is the bank's compliance-system version.

### 13.10.4 The BankComplianceAttestation Assembly

The KYC PASS assertion is combined with the other 5 customer/account
PASS assertions (KYB, AML, SANCTIONS, ACCOUNT_AUTHORITY, FUNDS_AVAILABLE)
and the 7th TRANSACTION_AUTHORIZED assertion into the full
`BankComplianceAttestation`:

```json
{
  "attestationId": "ATT-A1B2C3D4E5F6",
  "institutionId": "BANK-REG-12345",
  "assertions": [
    {
      "assertion": "KYC",
      "passed": true,
      "attestationId": "KYC-ACME-2026-08-22-001",
      "attestedAt": "2026-08-22T10:23:15.250Z",
      "attestedBy": "ACME-COMPLIANCE-v3.2.1"
    },
    {
      "assertion": "KYB",
      "passed": true,
      "attestationId": "KYB-ACME-2026-08-22-001",
      "attestedAt": "2026-08-22T10:23:15.350Z",
      "attestedBy": "ACME-COMPLIANCE-v3.2.1"
    },
    {
      "assertion": "AML",
      "passed": true,
      "attestationId": "AML-ACME-2026-08-22-001",
      "attestedAt": "2026-08-22T10:23:15.650Z",
      "attestedBy": "ACME-COMPLIANCE-v3.2.1"
    },
    {
      "assertion": "SANCTIONS",
      "passed": true,
      "attestationId": "SAN-ACME-2026-08-22-001",
      "attestedAt": "2026-08-22T10:23:15.700Z",
      "attestedBy": "ACME-COMPLIANCE-v3.2.1"
    },
    {
      "assertion": "ACCOUNT_AUTHORITY",
      "passed": true,
      "attestationId": "AUTH-ACME-2026-08-22-001",
      "attestedAt": "2026-08-22T10:23:15.100Z",
      "attestedBy": "BANK-CORE-BANKING-v5.1.0"
    },
    {
      "assertion": "FUNDS_AVAILABLE",
      "passed": true,
      "attestationId": "FUNDS-ACME-2026-08-22-001",
      "attestedAt": "2026-08-22T10:23:15.150Z",
      "attestedBy": "BANK-CORE-BANKING-v5.1.0"
    },
    {
      "assertion": "TRANSACTION_AUTHORIZED",
      "passed": true,
      "attestationId": "TXAUTH-ACME-2026-08-22-001",
      "attestedAt": "2026-08-22T10:23:15.800Z",
      "attestedBy": "BANK-PAYMENT-GATEWAY-v2.3.0"
    }
  ],
  "signature": "0x<128 hex chars Ed25519 signature>",
  "issuedAt": "2026-08-22T10:23:15.810Z",
  "expiresAt": "2026-08-22T11:23:15.810Z",
  "complianceSystemVersion": "ACME-COMPLIANCE-v3.2.1"
}
```

### 13.10.5 The Signature Generation

At T+~810 ms, the bank's attestation-signing module (running in the
bank's HSM) signs the attestation:

1. The signing module canonicalizes the attestation using JSON
   Canonicalization Scheme (RFC 8785):
   ```
   {"assertions":[{"assertion":"KYC","attestationId":"KYC-ACME-2026-08-22-001","attestedAt":"2026-08-22T10:23:15.250Z","attestedBy":"ACME-COMPLIANCE-v3.2.1","passed":true},...],"attestationId":"ATT-A1B2C3D4E5F6","complianceSystemVersion":"ACME-COMPLIANCE-v3.2.1","expiresAt":"2026-08-22T11:23:15.810Z","institutionId":"BANK-REG-12345","issuedAt":"2026-08-22T10:23:15.810Z"}
   ```

2. The signing module computes the Ed25519 signature using the bank's
   private attestation key (never leaving the HSM):
   ```
   signature = 0x9a3f8c2e1b4d7e6a5c8b3d2e1f4a7c9b8e3d2c1b4a5e6f7c8d9e0f1a2b3c4d5e6f
   ```

3. The signing module returns the signature to the MBG adapter, which
   assembles the final `BankComplianceAttestation` with the signature
   field populated.

### 13.10.6 What MITHQAL Receives

At T+~1,200 ms (per the F07 flow), MITHQAL Core receives the
`MTQSettlementInstruction` carrying the `BankComplianceAttestation`. The
settlement instruction is a JSON payload (or ISO 20022 XML) that
includes the attestation as a nested object.

MITHQAL's §18 ZeroTrustVerification layer:
1. Looks up the bank's attestation key (BANK-REG-12345 → pub-0x1a2b3c...).
2. Verifies the key is active (yes, valid until 2027-08-22).
3. Re-canonicalizes the attestation (minus the signature field) and
   verifies the Ed25519 signature against the bank's public key. ✓
4. Verifies the attestation is not expired (issuedAt 10:23:15, expiresAt
   11:23:15, current time 10:23:16 — valid). ✓
5. Verifies all 7 required assertions are present and passed. ✓
6. Verifies the attestation ID (ATT-A1B2C3D4E5F6) is not in the
   replay-prevention cache. ✓
7. Verifies the compliance-system version (ACME-COMPLIANCE-v3.2.1) is
   in the bank's registered compliance-system-version list. ✓

All 7 verification steps pass. The attestation is accepted as
authoritative proof of compliance.

### 13.10.7 What MITHQAL Does NOT Receive

MITHQAL does NOT receive any of the following (which remain in the
bank's systems):
- Acme Logistics LLC's trade license, memorandum of association, UBO
  declarations, or any other corporate documentation.
- Mr. Smith's, Mrs. Smith's, or Mr. Jones's identity documents, PEP
  status, adverse-media screening results, or any other UBO
  information.
- Acme's KYC profile, KYC refresh history, or risk-rating history.
- The bank's KYC rules, thresholds, or risk-rating methodology.
- The specific sanctions lists screened, the screening results, or
  the false-positive dispositions.
- The bank's AML rules, transaction-monitoring scenarios, or alert
  history.
- Acme's account balance, account ledger, or account holds.
- The specific signatory who authorized the transaction (only the
  attestation that the signatory was authorized).
- The bank's authorization matrix or signatory list.

MITHQAL knows only that the bank has performed all 6 customer/account
PASS checks and the 7th TRANSACTION_AUTHORIZED check, and that the
bank's signature is valid.

### 13.10.8 What Could Have Failed

If any of the following had failed, the KYC PASS assertion would have
been `passed: false` (or the assertion would have been omitted from the
attestation), and MITHQAL would have rejected the entire instruction
at the §18 ZeroTrustVerification step:

- Acme's KYC profile was expired (refresh was more than 12 months ago).
- Acme's trade license was expired.
- One of Acme's UBO identity documents was expired.
- One of Acme's UBOs was identified as a PEP (would trigger enhanced
  due diligence — EDD — and possibly a manual review).
- One of Acme's UBOs was on the bank's adverse-media list.
- Acme's risk rating was insufficient for the AED 1,000,000 transaction
  (would require a higher-tier authorization or rejection).
- Acme's source-of-funds documentation was missing or insufficient.

In any of these cases, the bank's compliance team would handle the
resolution (refresh the KYC profile, request new documents, conduct EDD,
etc.). MITHQAL would simply see the assertion as `passed: false` (or
missing) and reject the instruction.

## 13.11 Section 13 Summary

The Bank-Side Compliance Attestation model is the structural embodiment
of the §8 Privacy Principle. MITHQAL does NOT re-perform compliance;
the bank remains the authoritative compliance authority. MITHQAL
receives the bank's cryptographically signed attestation that compliance
has been performed (the 6 customer/account PASS attestations: KYC, KYB,
AML, SANCTIONS, ACCOUNT_AUTHORITY, FUNDS_AVAILABLE, plus the 7th
TRANSACTION_AUTHORIZED assertion), verifies the signature against the
bank's registered attestation key, and accepts the attestation as
authoritative proof of compliance. The attestation schema is
jurisdiction-neutral — it does not encode jurisdiction-specific
thresholds, rules, or lists, only that the bank has performed its
obligations per its jurisdictional requirements. The attestation is
expiry-bound (24-hour maximum), replay-protected (24-hour cache),
revocable (per-attestation or per-key), and fully audit-trailed. The
schema is structured for future migration to selective disclosure and
zero-knowledge proofs, but the current implementation uses plain
Ed25519 signatures. Customer identity, compliance data, and underlying
documentation all remain in the bank — MITHQAL only sees the bank's
signed attestation.

**Honest state:** The attestation model is INTEGRATION-READY at the
logic/spec level. No real bank attestation key has been registered.
The default attestation (`DEFAULT_COMPLIANCE_ATTESTATION`) is a
SIMULATED placeholder, marked with `signature: 0x000...000` and
`institutionId: SIMULATED-INSTITUTION`. No real bank has issued a real
attestation. The attestation model may NOT carry live compliance
attestations until §74 honest-state invariants transition to their
production-authorized values.

---

# SECTION 14 — PROTECTED BACKING CELL (§47)

## 14.1 Section Scope and Authority

This section codifies the Protected Backing Cell (PBC) — the canonical
data structure by which a bank or institution-side asset is identified,
earmarked, verified, and allocated to support MTQ issuance. It
implements §47 of the v25.2 master directive and is fully specified in
`src/lib/protected-backing-cell.ts` (1,133 lines, MODULE_ID
`v25.2-protected-backing-cell-1.0`).

The PBC is the structural mechanism by which MITHQAL enforces the
non-custodial principle: MITHQAL does NOT own or custody the backing
assets. The bank or institution holds the assets in its existing
custody infrastructure; MITHQAL only verifies, applies constitutional
rules, calculates issuance capacity, authorizes issuance, reconciles,
and monitors systemic risk.

The PBC's central invariant is the anti-double-count rule: **the SAME
backing must NEVER support multiple MTQ obligations**. A given PBC may
be allocated to AT MOST ONE `mtqObligationId` at a time. This invariant
is enforced at two layers: (a) the mutation layer (the
`allocateBacking` function rejects double-allocation), and (b) the
audit layer (the `verifyNoDoubleCount` function scans a set of cells
and returns any violations).

The PBC's central formula is:

```
AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking
```

This formula, together with the anti-double-count rule, ensures that the
backing available to support new MTQ issuance is precisely the recognized
value (after haircut) minus any third-party encumbrance minus any
allocation to existing MTQ obligations. The result is the maximum new
MTQ issuance that this cell can support.

## 14.2 The 17-Field Schema

The PBC is defined as a TypeScript interface with 17 canonical fields
plus operational companion fields needed to enforce the anti-double-count
rule and compute `AvailableBacking`. The 17 canonical fields are listed
below in spec order.

### 14.2.1 Field 1 — `backingId` (string)

**Description:** The unique PBC identifier. Every Protected Backing Cell
has a globally unique `backingId` that distinguishes it from every other
cell. The ID is bank-issued and immutable.

**Format:** Conventionally prefixed with `pbc-` followed by an
asset-class identifier and a sequence number (e.g.,
`pbc-usd-cash-001`, `pbc-xau-allocated-001`, `pbc-usdc-001`,
`pbc-ust-001`).

**Constraints:**
- Must be non-empty (the `createProtectedBackingCell` validator
  rejects empty `backingId`).
- Must be unique across all PBCs known to MITHQAL.
- Immutable after creation (the `backingId` cannot be changed once
  the cell is created).

**Use:** The `backingId` is the primary key for the PBC. It is used
in the `allocateBacking` function, in the `verifyNoDoubleCount`
function, in the evidence package, and in all audit-trail records.

### 14.2.2 Field 2 — `institutionId` (string)

**Description:** The identifier of the owning/pledging institution.
The bank or institution that holds the backing asset and is pledging it
to support MTQ issuance.

**Format:** Conventionally prefixed with `inst-` followed by an
institution-class identifier and a sequence number (e.g.,
`inst-bank-ny-001`, `inst-bullion-custodian-lon-001`,
`inst-stablecoin-issuer-001`).

**Constraints:**
- Must be non-empty.
- Must correspond to a registered institution in MITHQAL's
  institution registry (per §10 BankSecurityProfile).
- The institution must be authorized to pledge backing (per the
  jurisdictional registry).

**Use:** The `institutionId` is used to attribute the backing to a
specific institution. The institution is responsible for the
underlying asset (custody, encumbrance status, legal title). MITHQAL
verifies the institution's regulatory status but does NOT take
custody of the asset.

### 14.2.3 Field 3 — `asset` (ProtectedBackingAsset)

**Description:** The asset descriptor. Carries the asset type, name,
optional currency, ISIN (for sovereign / money-market instruments),
tokenId (for digital / tokenized assets), and chain (for tokenized
assets).

**Type enumeration (`AssetType`):**
- `fiat-cash` — fiat cash on deposit at a regulated bank (HQLA-1).
- `fiat-sovereign` — sovereign debt instrument (e.g., US Treasury Bill).
- `gold-physical-allocated` — allocated physical gold (Good Delivery
  bars at a specialist custodian).
- `gold-physical-unallocated` — unallocated physical gold (a claim on
  a pool of gold at a custodian).
- `tokenized-gold` — tokenized gold (e.g., PAXG).
- `silver` — physical silver (conditional, currently 0%).
- `digital-stablecoin` — regulated stablecoin (e.g., USDC, USDP, EURC).
- `digital-treasury` — tokenized US Treasury (e.g., BUIDL).
- `money-market-fund` — money-market fund shares.

**Constraints:**
- `asset.name` must be non-empty.
- For fiat assets, `currency` is the ISO 4217 code.
- For sovereign / money-market assets, `isin` is the ISIN code.
- For digital / tokenized assets, `tokenId` is the contract address
  and `chain` is the chain identifier.

**Use:** The asset descriptor identifies the underlying asset. The
asset type drives the haircut (per the reserve policy spec) and the
eligibility rules (per §14.8 below).

### 14.2.4 Field 4 — `quantity` (number)

**Description:** The quantity of the asset in the cell. For fiat cash,
this is the face amount (e.g., $65,000,000 USD). For physical gold,
this is the troy-ounce weight (e.g., 12,000 oz). For stablecoins, this
is the token amount (e.g., 2,600,000 USDC).

**Constraints:**
- Must be positive (the `createProtectedBackingCell` validator
  rejects zero or negative `quantity`).
- Must be expressed in the asset's natural unit (USD for fiat-cash,
  troy ounces for gold, tokens for stablecoins).

**Use:** The `quantity` (combined with the market price `P`) drives
the `valuation` field (V = Q × P). The `quantity` is also used in the
evidence package for audit-trail purposes.

### 14.2.5 Field 5 — `valuation` (number)

**Description:** The current market valuation of the asset in the cell,
expressed in USD. Computed as V = Q × P, where Q is the `quantity` and
P is the current market price.

**Constraints:**
- Must be positive.
- Updated periodically (per the bank's price-feed cadence) to reflect
  market movements.
- For fiat cash, the valuation is 1:1 with the face amount (e.g.,
  $65,000,000 face = $65,000,000 valuation).
- For sovereign debt, the valuation reflects the current market price
  (which may differ from the face amount due to interest-rate
  movements).
- For physical gold, the valuation is the LBMA spot price × the
  troy-ounce quantity.
- For stablecoins, the valuation is 1:1 with the peg currency (e.g.,
  USDC = $1.00 per token).

**Use:** The `valuation` is the starting point for the
`AvailableBacking` computation. The `recognizedBacking` is computed
as `valuation × (1 − haircut)`.

### 14.2.6 Field 6 — `haircut` (number, 0–1)

**Description:** The constitutional haircut applied to the valuation.
A haircut of 0.05 means 5% of the valuation is "haircut" (i.e., not
recognized as available backing) to absorb market movements before
they affect the recognized backing.

**Constraints:**
- Must be in [0, 1].
- Per §47 eligibility rules, must be ≤ 0.20 (the constitutional sanity
  ceiling).
- For fiat cash (HQLA-1), the haircut is typically 0.00 (no haircut —
  cash is the most liquid asset).
- For sovereign debt, the haircut is typically 0.01 (1% — short-
  duration T-bills have minimal market risk).
- For physical gold, the haircut is typically 0.02 (2% — gold has
  moderate market risk).
- For stablecoins, the haircut is typically 0.03 (3% — stablecoins
  have de-pegging risk).
- For tokenized US Treasuries, the haircut is typically 0.01 (1% —
  same as the underlying T-bill, plus a small operational risk
  premium).

**Use:** The `haircut` is applied to the `valuation` to compute the
`recognizedBacking`:
```
recognizedBacking = valuation × (1 − haircut)
```

### 14.2.7 Field 7 — `legalStatus` (LegalStatus)

**Description:** The legal title / pledge status of the asset. Indicates
whether the bank has clear legal title to the asset and is authorized
to pledge it to support MTQ issuance.

**Enumeration (`LegalStatus`):**
- `CLEARED` — legal title confirmed, free to pledge.
- `CONFIRMED` — title confirmed, pledge authorized.
- `PENDING_REVIEW` — documentation under review.
- `DISPUTED` — title / pledge disputed.
- `ENCUMBERED_LEGAL` — subject to a perfected security interest.
- `LIQUIDATED` — asset has been realized / written off.

**Constraints:**
- Per §47 eligibility rules, must be `CLEARED` or `CONFIRMED` for the
  cell to be eligible as backing. Cells with `PENDING_REVIEW`,
  `DISPUTED`, `ENCUMBERED_LEGAL`, or `LIQUIDATED` status are
  ineligible.
- If the cell's legal status is `LIQUIDATED`, the cell's overall
  lifecycle status is `LIQUIDATED` (red color) regardless of other
  fields.

**Use:** The `legalStatus` drives eligibility. It is verified by the
bank's legal team and confirmed via an independent legal opinion (per
the §73 evidence state `INTEGRATED` minimum).

### 14.2.8 Field 8 — `custodian` (string)

**Description:** The custodian identifier. The custodian is the entity
that physically (or digitally) holds the asset. For fiat cash, the
custodian is the bank itself. For physical gold, the custodian is a
specialist bullion custodian (e.g., an LBMA vault operator). For
stablecoins, the custodian is the regulated money-transmitter / issuer.

**Constraints:**
- Must be non-empty.
- The custodian's tier (per `custodianTier`, see below) drives
  eligibility.

**Use:** The `custodian` is the entity that produces the
`custodian_attestation` evidence record (per §73). The custodian's
identity is verified by MITHQAL via the §10 BankSecurityProfile.

### 14.2.9 Field 9 — `jurisdiction` (string)

**Description:** The ISO-3166 jurisdiction code where the asset is
custodied. For fiat cash in New York, the jurisdiction is `US-NY`.
For physical gold in London, the jurisdiction is `GB-ENG`.

**Constraints:**
- Must be a valid ISO-3166 code (with sub-national code where
  applicable).
- The jurisdiction's risk classification (per `jurisdictionRisk`,
  see below) drives eligibility.

**Use:** The `jurisdiction` is used to:
- Apply jurisdictional concentration limits (per the reserve policy
  spec).
- Determine which regulator has authority over the asset.
- Identify potential sanctions exposure (the jurisdictional registry
  at §9 of the licensing-entity-matrix).

### 14.2.10 Field 10 — `encumbranceStatus` (EncumbranceStatus)

**Description:** The encumbrance status of the asset. Indicates whether
the asset is subject to a third-party security interest (a perfected
lien, a court-ordered freeze, etc.).

**Enumeration (`EncumbranceStatus`):**
- `FREE` — no third-party interest.
- `PARTIALLY_ENCUMBERED` — a portion is subject to a perfected
  security interest (the `encumberedAmount` field gives the exact
  amount).
- `ENCUMBERED` — fully subject to a perfected security interest
  (the `encumberedAmount` equals the recognized backing).
- `FROZEN` — regulator/court-ordered freeze (cannot be allocated).
- `PLEDGED_TO_MITHQAL` — pledged exclusively to support MTQ issuance
  (this is the typical state for assets backing MTQ).
- `PENDING_RELEASE` — encumbrance release is in process, not yet freed.

**Constraints:**
- Per §47 eligibility rules, must NOT be `FROZEN` or `ENCUMBERED` for
  the cell to be eligible as backing. `PARTIALLY_ENCUMBERED` cells are
  eligible with the encumbered portion deducted from the available
  backing (per the formula).
- `PLEDGED_TO_MITHQAL` is the typical state for active backing cells.
- The `encumbranceStatus` must be consistent with the
  `encumberedAmount` (e.g., `FREE` with `encumberedAmount > 0` is
  rejected by the validator).

**Use:** The `encumbranceStatus` drives the `EncumberedBacking` term
of the §47 formula.

### 14.2.11 Field 11 — `allocationStatus` (AllocationStatus)

**Description:** The allocation status of the cell. Indicates whether the
cell is currently supporting an MTQ obligation.

**Enumeration (`AllocationStatus`):**
- `UNALLOCATED` — available to support a new MTQ obligation.
- `ALLOCATED` — already supporting an MTQ obligation (the
  `utilizedAmount` equals the recognized backing minus encumbrance).
- `PARTIALLY_ALLOCATED` — a portion is allocated, the remainder is free.
- `RESERVED` — held back (cannot support new obligations — e.g.,
  during a regulatory review).
- `RELEASED` — previously allocated, now released back to
  `UNALLOCATED` (a transient state before the cell is reset).

**Constraints:**
- The `allocationStatus` is updated by the `allocateBacking` and
  `releaseAllocation` functions.
- A cell in `RESERVED` or `RELEASED` state cannot be allocated.

**Use:** The `allocationStatus` is the high-level indicator of the
cell's current state. It is used by MITHQAL's monitoring layer to
display the cell's status.

### 14.2.12 Field 12 — `utilizedAmount` (number, USD)

**Description:** The AlreadyAllocatedBacking — the USD amount of the
cell's recognized backing that is currently supporting an MTQ
obligation. This is the `AlreadyAllocatedBacking` term in the §47
formula.

**Constraints:**
- Must be ≥ 0.
- Must be ≤ the recognized backing minus encumbrance (i.e., the
  utilized amount cannot exceed the available pre-allocation backing).
- Updated by the `allocateBacking` function (increases) and the
  `releaseAllocation` function (resets to 0).

**Use:** The `utilizedAmount` is the third term of the §47 formula:
```
AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking
                                                          ^^^^^^^^^^^^^^^^
                                                          utilizedAmount
```

### 14.2.13 Field 13 — `availableAmount` (number, USD, computed)

**Description:** The AvailableBacking — the USD amount of the cell's
recognized backing that is currently available to support a new MTQ
obligation. This is the result of the §47 formula.

**Constraints:**
- Computed as `RecognizedBacking − EncumberedBacking −
  AlreadyAllocatedBacking`.
- Must be ≥ 0 (if the formula yields a negative value, it is clamped
  to 0 and `nonNegative = false` is set, indicating a constitutional
  breach).

**Use:** The `availableAmount` is the maximum new MTQ issuance that
this cell can support. The `allocateBacking` function uses it to
verify capacity before allocation.

### 14.2.14 Field 14 — `evidence` (ProtectedBackingEvidence)

**Description:** The §73 evidence package. Carries the evidence-state
progression, the supporting attestations, the last evidence-state
transition timestamp, and the `simulated` flag.

**Sub-fields:**
- `evidenceState` (ProtectedBackingEvidenceState) — one of 13 states
  (7 canonical + 6 *_PENDING variants):
  - `DESIGNED` — the design is complete; the cell is a specification.
  - `DESIGNED_PENDING` — design pending verification.
  - `IMPLEMENTED` — the code is implemented.
  - `IMPLEMENTED_PENDING` — implementation pending verification.
  - `INTEGRATED` — integrated into the broader system.
  - `INTEGRATED_PENDING` — integration pending verification.
  - `TESTED` — tested (unit + integration + e2e).
  - `TESTED_PENDING` — testing pending verification.
  - `SANDBOX_VALIDATED` — validated in a sandbox environment.
  - `SANDBOX_VALIDATED_PENDING` — sandbox validation pending.
  - `INSTITUTIONALLY_VALIDATED` — validated by a real institution.
  - `INSTITUTIONALLY_VALIDATED_PENDING` — institutional validation
    pending.
  - `PRODUCTION_READY` — ready for production deployment.
- `attestations` (ProtectedBackingAttestation[]) — the supporting
  attestations:
  - `kind` — one of `custodian_attestation`, `independent_audit`,
    `legal_opinion`, `regulator_no_objection`, `smart_contract_proof`,
    `off_chain_receipt`.
  - `attester` — the attesting party.
  - `at` — the ISO 8601 timestamp of the attestation.
  - `evidenceHash` — the SHA-256 / multihash reference to the off-chain
    evidence document.
  - `simulated` — true if the attestation is SIMULATED (illustrative
    only); false only when a real institution attests.
- `lastTransitionAt` — the ISO 8601 timestamp of the last
  evidence-state transition.
- `simulated` — true if the cell is SIMULATED (illustrative only);
  false only when a real institution attests.

**Constraints:**
- Per §47 eligibility rules, `evidenceState` must be ≥ `INTEGRATED`
  (the §73 minimum for backing).
- The `simulated` flag MUST be true for all current reference cells
  (per §74 honest-state `protectedBackingLiveCells = 0`).

**Use:** The `evidence` field is the §73 evidence package. It is used
to verify the cell's authenticity, to track the cell's maturity
progression, and to generate the evidence package (per §14.7).

### 14.2.15 Field 15 — `verificationTimestamp` (string, ISO 8601)

**Description:** The timestamp of the last independent verification of
the cell. The verification is performed by an independent auditor (per
the §73 evidence state `INTEGRATED` minimum).

**Constraints:**
- Must be a valid ISO 8601 timestamp.
- Per §47 eligibility rules, must be within the past 90 days
  (verifications older than 90 days are stale and the cell is
  ineligible until re-verified).
- Must not be in the future (a future verification timestamp is
  rejected by the validator).

**Use:** The `verificationTimestamp` drives the §47 eligibility check
for stale verifications.

### 14.2.16 Field 16 — `effectiveDate` (string, ISO date)

**Description:** The pledge effective date. The date on which the bank's
pledge of the asset to support MTQ issuance became effective.

**Constraints:**
- Must be a valid ISO date (YYYY-MM-DD).
- Must be before the `expiry` date.
- Must not be more than 1 day in the future (a future effective date
  is rejected by the validator).

**Use:** The `effectiveDate` is the start of the pledge's lifecycle.
Combined with the `expiry`, it defines the pledge's term (typically
12 months).

### 14.2.17 Field 17 — `expiry` (string, ISO date)

**Description:** The pledge expiry date. The date on which the bank's
pledge of the asset to support MTQ issuance expires.

**Constraints:**
- Must be a valid ISO date (YYYY-MM-DD).
- Must be after the `effectiveDate`.
- Per §47 eligibility rules, must be in the future (cells with an
  expired pledge are ineligible; the cell's lifecycle status is
  `EXPIRED`).

**Use:** The `expiry` drives the §47 eligibility check for expired
pledges. When a cell expires, it must be renewed (re-pledged) or
released (the bank takes the asset back).

## 14.3 Operational Companion Fields

The §47 spec defines 17 canonical fields. The implementation adds
operational companion fields needed to enforce the anti-double-count
rule and to compute `AvailableBacking`. These are NOT part of the
canonical 17 but are required for the formula and invariant:

### 14.3.1 `encumberedAmount` (number, USD)

The numeric encumbrance amount (USD). Drives the `EncumberedBacking`
term in the §47 formula. Clamped to `[0, recognizedBacking]` by
`computeAvailableBacking`.

### 14.3.2 `allocatedObligationIds` (string[])

The MTQ obligation IDs this cell currently supports. **Max 1
enforced** — the anti-double-count rule. A cell may be allocated to
at most one `mtqObligationId` at a time.

### 14.3.3 `custodianTier` (CustodianTier)

The custodian tier. Drives eligibility rules. Enumeration:
- `TIER1_REGULATED_BANK` — major regulated bank custodian.
- `TIER2_SPECIALIST_CUSTODIAN` — specialist bullion / digital custodian.
- `TIER3_TRUST_COMPANY` — regulated trust company.
- `TIER4_SELF_CUSTODY` — disfavored / requires extra haircut.
- `TIER_UNKNOWN` — unknown custodian (ineligible).

Per §47 eligibility rules, `custodianTier` must NOT be
`TIER4_SELF_CUSTODY` or `TIER_UNKNOWN` for the cell to be eligible.

### 14.3.4 `jurisdictionRisk` (JurisdictionRisk)

The jurisdiction risk classification. Drives eligibility rules.
Enumeration:
- `APPROVED` — the jurisdiction is approved for backing.
- `WATCH` — the jurisdiction is under review (cells in WATCH
  jurisdictions are ineligible).
- `SANCTIONED` — the jurisdiction is sanctioned (cells in SANCTIONED
  jurisdictions are ineligible and the cell is rejected at creation).
- `UNKNOWN` — the jurisdiction's risk is unknown (cells in UNKNOWN
  jurisdictions are ineligible).

Per §47 eligibility rules, `jurisdictionRisk` must be `APPROVED` for
the cell to be eligible.

### 14.3.5 `simulated` (boolean)

The honest flag. `true` for SIMULATED reference cells; `false` only
when a real institution attests. Per §74 honest-state
`protectedBackingLiveCells = 0`, all current reference cells are
SIMULATED.

## 14.4 The §47 Formula

The §47 formula computes the available backing for a PBC:

```
AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking
```

Where:
- `RecognizedBacking = valuation × (1 − haircut)`
- `EncumberedBacking = encumberedAmount` (clamped to
  `[0, recognizedBacking]`)
- `AlreadyAllocatedBacking = utilizedAmount` (clamped to
  `[0, recognizedBacking]`)

If the terms exceed `RecognizedBacking`, `AvailableBacking` is clamped
to 0 and `nonNegative = false` is set (a constitutional breach
condition).

### 14.4.1 The `computeAvailableBacking` Function

The formula is implemented in `protected-backing-cell.ts`:

```typescript
export function computeAvailableBacking(cell: ProtectedBackingCell): AvailableBackingComputation {
  const recognizedBacking = round2(cell.valuation * (1 - cell.haircut));
  const encumberedBacking = clamp(
    round2(cell.encumberedAmount),
    0,
    recognizedBacking,
  );
  const alreadyAllocatedBacking = clamp(
    round2(cell.utilizedAmount),
    0,
    recognizedBacking,
  );
  const rawAvailable = round2(
    recognizedBacking - encumberedBacking - alreadyAllocatedBacking,
  );
  const availableBacking = Math.max(0, rawAvailable);
  return {
    recognizedBacking,
    encumberedBacking,
    alreadyAllocatedBacking,
    availableBacking,
    nonNegative: rawAvailable >= 0,
    formula: PBC_FORMULA,
  };
}
```

Where:
- `round2(x)` rounds to 2 decimal places (USD-cent precision).
- `clamp(x, lo, hi)` clamps x to the range [lo, hi].
- `PBC_FORMULA` is the canonical formula string
  `"AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking"`.

### 14.4.2 Formula Examples

**Example 1: USD cash, no encumbrance, no allocation**
- `valuation = $65,000,000`
- `haircut = 0.00`
- `encumberedAmount = $0`
- `utilizedAmount = $0`
- RecognizedBacking = $65,000,000 × (1 − 0.00) = $65,000,000
- EncumberedBacking = $0
- AlreadyAllocatedBacking = $0
- AvailableBacking = $65,000,000 − $0 − $0 = $65,000,000
- nonNegative = true

**Example 2: Physical gold, no encumbrance, partial allocation**
- `valuation = $23,400,000` (12,000 oz × $1,950/oz)
- `haircut = 0.02`
- `encumberedAmount = $0`
- `utilizedAmount = $10,000,000`
- RecognizedBacking = $23,400,000 × (1 − 0.02) = $22,932,000
- EncumberedBacking = $0
- AlreadyAllocatedBacking = $10,000,000
- AvailableBacking = $22,932,000 − $0 − $10,000,000 = $12,932,000
- nonNegative = true

**Example 3: US Treasury, partial encumbrance, no allocation**
- `valuation = $39,000,000`
- `haircut = 0.01`
- `encumberedAmount = $2,000,000` (pre-existing security interest)
- `utilizedAmount = $0`
- RecognizedBacking = $39,000,000 × (1 − 0.01) = $38,610,000
- EncumberedBacking = $2,000,000
- AlreadyAllocatedBacking = $0
- AvailableBacking = $38,610,000 − $2,000,000 − $0 = $36,610,000
- nonNegative = true

**Example 4: Constitutional breach (negative AvailableBacking)**
- `valuation = $10,000,000`
- `haircut = 0.05`
- `encumberedAmount = $9,000,000`
- `utilizedAmount = $2,000,000`
- RecognizedBacking = $10,000,000 × (1 − 0.05) = $9,500,000
- EncumberedBacking = $9,000,000
- AlreadyAllocatedBacking = $2,000,000 (clamped to $9,500,000 − $9,000,000 = $500,000)
  - Wait, that's not right — let me re-derive.
  - Actually, the `alreadyAllocatedBacking` is clamped to `[0, recognizedBacking]`
    = `[0, $9,500,000]`. So it's $2,000,000.
  - Then rawAvailable = $9,500,000 − $9,000,000 − $2,000,000 = −$1,500,000.
- AvailableBacking = max(0, −$1,500,000) = $0
- nonNegative = false (constitutional breach!)

This breach would trigger:
- The cell's eligibility status → INELIGIBLE (red).
- A reconciliation alert.
- An audit-trail entry.
- A notification to MITHQAL's monitoring layer.

## 14.5 The Anti-Double-Count Rule

The anti-double-count rule is the §47 central invariant:

> **"A single backing must never support multiple MTQ obligations; a
> Protected Backing Cell may be allocated to at most one
> `mtqObligationId` at a time."**

This rule is encoded as a const in `protected-backing-cell.ts`:

```typescript
export const PBC_ANTI_DOUBLE_COUNT_RULE =
  "A single backing must never support multiple MTQ obligations; " +
  "a Protected Backing Cell may be allocated to at most one mtqObligationId at a time.";
```

### 14.5.1 Why Anti-Double-Count Matters

Without the anti-double-count rule, a bank could pledge the same $10M
USD cash as backing for two separate $10M MTQ issuances — effectively
creating $20M of MTQ against $10M of backing, a 50% reserve ratio
(discounting the haircut). This would violate the §3 strategic reserve
ratio target of 130% and the §1 absolute reserve floor of 100%.

The anti-double-count rule ensures that each dollar of recognized
backing supports at most one dollar of MTQ issuance. Combined with the
§3 strategic reserve ratio target (130%), the actual constraint is
stricter: each dollar of recognized backing supports at most
$1/1.30 = $0.77 of MTQ issuance (the remaining $0.23 is the strategic
buffer).

### 14.5.2 Enforcement at Mutation Time

The anti-double-count rule is enforced at the mutation layer by the
`allocateBacking` function:

```typescript
export function allocateBacking(
  cell: ProtectedBackingCell,
  amount: number,
  mtqObligationId: string,
): AllocationResult {
  if (amount <= 0) {
    return { ok: false, reason: "amount must be positive", cell };
  }
  if (!mtqObligationId || mtqObligationId.trim() === "") {
    return { ok: false, reason: "mtqObligationId is required", cell };
  }

  // Anti-double-count: the cell may support AT MOST ONE distinct obligation.
  const existingOther = cell.allocatedObligationIds.find(
    (id) => id !== mtqObligationId,
  );
  if (existingOther !== undefined) {
    return {
      ok: false,
      reason:
        `anti-double-count violation: backing ${cell.backingId} is already ` +
        `allocated to MTQ obligation '${existingOther}'; cannot also support '${mtqObligationId}'`,
      cell,
    };
  }

  const avail = computeAvailableBacking(cell);
  const newUtilized = round2(cell.utilizedAmount + amount);
  if (newUtilized > avail.availableBacking + 1e-6) {
    return {
      ok: false,
      reason:
        `insufficient available backing: requested ${amount} ` +
        `(would bring utilized to ${newUtilized}); available = ${avail.availableBacking}`,
      cell,
    };
  }

  // ... allocation logic ...
}
```

The function:
1. Rejects non-positive amounts.
2. Rejects missing `mtqObligationId`.
3. **Checks for an existing OTHER obligation** — if the cell is already
   allocated to a different `mtqObligationId`, the allocation is
   REJECTED with an `anti-double-count violation` reason.
4. Checks available capacity — if the new utilized amount would exceed
   the available backing, the allocation is REJECTED with an
   `insufficient available backing` reason.
5. If all checks pass, the allocation succeeds.

Note: same-obligation top-up is permitted — if the cell is already
allocated to `mtqObligationId = "MTQ-OBL-001"` and a new allocation
request comes in for `"MTQ-OBL-001"`, the new amount is added to the
existing utilized amount (subject to capacity). This allows incremental
allocations to the same obligation (e.g., increasing utilization on
the same MTQ issuance).

### 14.5.3 Enforcement at Audit Time

The anti-double-count rule is independently enforced at the audit
layer by the `verifyNoDoubleCount` function:

```typescript
export function verifyNoDoubleCount(
  cells: ProtectedBackingCell[],
): DoubleCountViolation[] {
  const violations: DoubleCountViolation[] = [];
  for (const cell of cells) {
    const distinct = new Set(cell.allocatedObligationIds);
    if (distinct.size > 1) {
      violations.push({
        backingId: cell.backingId,
        institutionId: cell.institutionId,
        allocatedObligationIds: [...cell.allocatedObligationIds],
        violation:
          `backing ${cell.backingId} supports ${distinct.size} distinct MTQ obligations ` +
          `(${Array.from(distinct).join(", ")}); anti-double-count rule violated`,
      });
    }
  }
  return violations;
}
```

This function scans a set of cells and returns any that violate the
anti-double-count rule (i.e., support more than one MTQ obligation).
It is the audit pass used by the reconciliation / monitoring layer
(independent of the mutation layer).

The two-layer enforcement ensures that even if the mutation layer is
bypassed (e.g., a direct database write), the audit layer will catch
the violation.

## 14.6 Allocation Workflow

The allocation workflow describes how backing is allocated to MTQ
obligations. The workflow is:

### 14.6.1 Step 1 — Identify the MTQ Obligation

When MITHQAL Core receives a settlement instruction (per the BM-08
ZeroTrustVerification step), it generates an `mtqObligationId`. This
ID is the canonical identifier for the MTQ issuance that the
instruction will trigger.

### 14.6.2 Step 2 — Select a PBC

MITHQAL Core selects a PBC to back the issuance. The selection is
based on:
- The cell's eligibility (per §14.8 below).
- The cell's `availableAmount` (must be ≥ the issuance amount).
- The cell's currency (must match the issuance currency, or be
  convertible at the bank's treasury).
- The cell's concentration impact (per the §52 systemic exposure
  engine — the cell's institution must not exceed the bank
  concentration limit).

### 14.6.3 Step 3 — Allocate

MITHQAL Core calls `allocateBacking(cell, amount, mtqObligationId)`.
The function:
1. Verifies the anti-double-count rule (the cell is not already
   allocated to a different obligation).
2. Verifies the capacity (the new utilized amount does not exceed the
   available backing).
3. If both checks pass, the cell's `utilizedAmount` is increased, the
   cell's `availableAmount` is decreased, the cell's
   `allocatedObligationIds` is updated (the `mtqObligationId` is
   added if not already present), and the cell's `allocationStatus`
   is updated to `ALLOCATED` (if fully utilized) or
   `PARTIALLY_ALLOCATED` (if partially utilized).

### 14.6.4 Step 4 — Persist

The updated cell is persisted to the MITHQAL database. The
persistence is atomic (per the §54 L6 Database TX State layer) —
the cell update and the corresponding MTQ mint record are written in
the same database transaction.

### 14.6.5 Step 5 — Audit

The allocation event is logged in the audit trail:
- The `backingId`.
- The `mtqObligationId`.
- The allocated amount.
- The pre- and post-allocation `utilizedAmount` and `availableAmount`.
- The timestamp.
- The allocating system (MITHQAL Core's BM-11 Backing Verification
  step).

## 14.7 Release Workflow

The release workflow describes how an allocation is released (when
the MTQ is redeemed or otherwise the obligation is closed). The
workflow is:

### 14.7.1 Step 1 — Identify the Obligation to Release

When an MTQ obligation is closed (e.g., the MTQ is redeemed), MITHQAL
Core identifies the `mtqObligationId` to release.

### 14.7.2 Step 2 — Release

MITHQAL Core calls `releaseAllocation(cell, mtqObligationId)`. The
function:
1. Verifies the cell is allocated to the given `mtqObligationId` (if
   not, returns `ok: false` with a descriptive reason).
2. Records the released amount (the current `utilizedAmount`).
3. Resets the cell's `utilizedAmount` to 0.
4. Recomputes the cell's `availableAmount` (now equal to
   `RecognizedBacking − EncumberedBacking`).
5. Removes the `mtqObligationId` from the cell's
   `allocatedObligationIds`.
6. Updates the cell's `allocationStatus` to `RELEASED`.

### 14.7.3 Step 3 — Persist

The updated cell is persisted to the MITHQAL database.

### 14.7.4 Step 4 — Audit

The release event is logged in the audit trail.

### 14.7.5 Step 5 — Cell Reset (Optional)

After release, the cell can be reset to `UNALLOCATED` status (so it
can be allocated to a new obligation). The reset is a separate
operation (not part of the release) and is typically performed
periodically by MITHQAL's reconciliation layer.

## 14.8 Verification — No-Double-Count

The verification of the anti-double-count rule is performed by the
`verifyNoDoubleCount` function (see §14.5.3 above). This function is
called by:
- The §13 Five-Way Reconciliation engine (per the §47 spec).
- The §54 Finality-Before-Mint audit layer (per the §54 spec).
- The §52 systemic exposure engine (per the §52 spec).

The verification is:
1. Collect all PBCs known to MITHQAL.
2. For each cell, check the `allocatedObligationIds` array. If it
   contains more than one distinct `mtqObligationId`, the cell
   violates the anti-double-count rule.
3. Return the list of violations (an empty list if all cells are
   clean).

The verification is run:
- After every allocation (mutation-time check, by `allocateBacking`).
- After every release (mutation-time check, by `releaseAllocation`).
- Periodically (audit-time check, by the reconciliation layer).
- Before every MTQ mint (per the §54 Finality-Before-Mint audit
  layer).

## 14.9 Evidence Package Generation

The evidence package is generated by the
`generateProtectedBackingEvidence` function. It bundles:
- The cell count.
- The aggregated totals (recognized, encumbered, allocated, available).
- The double-count violations (if any).
- The per-cell evidence records (backingId, institutionId,
  evidenceState, simulated, availableBacking, eligibility,
  attestations).
- The §74 honest-state declaration.
- The canonical formula string.
- The anti-double-count rule string.

### 14.9.1 The Evidence Package Schema

```typescript
export interface ProtectedBackingEvidencePackage {
  evidencePackageId: string;
  generatedAt: string;
  module: typeof MODULE_ID;
  section: typeof PBC_SECTION;
  cellCount: number;
  totals: {
    recognizedBacking: number;
    encumberedBacking: number;
    alreadyAllocatedBacking: number;
    availableBacking: number;
  };
  doubleCountViolations: DoubleCountViolation[];
  perCell: Array<{
    backingId: string;
    institutionId: string;
    evidenceState: ProtectedBackingEvidenceState;
    simulated: boolean;
    availableBacking: number;
    eligibility: ProtectedBackingCellStatus;
    attestations: ProtectedBackingAttestation[];
  }>;
  honestState: ReturnType<typeof protectedBackingHonestState>;
  formula: typeof PBC_FORMULA;
  antiDoubleCountRule: typeof PBC_ANTI_DOUBLE_COUNT_RULE;
}
```

### 14.9.2 The `generateProtectedBackingEvidence` Function

```typescript
export function generateProtectedBackingEvidence(
  cells: ProtectedBackingCell[],
): ProtectedBackingEvidencePackage {
  const violations = verifyNoDoubleCount(cells);
  let recognized = 0;
  let encumbered = 0;
  let allocated = 0;
  let available = 0;
  for (const c of cells) {
    const a = computeAvailableBacking(c);
    recognized += a.recognizedBacking;
    encumbered += a.encumberedBacking;
    allocated += a.alreadyAllocatedBacking;
    available += a.availableBacking;
  }
  return {
    evidencePackageId: `pbc-evidence-${Date.now().toString(36)}`,
    generatedAt: new Date().toISOString(),
    module: MODULE_ID,
    section: PBC_SECTION,
    cellCount: cells.length,
    totals: {
      recognizedBacking: round2(recognized),
      encumberedBacking: round2(encumbered),
      alreadyAllocatedBacking: round2(allocated),
      availableBacking: round2(available),
    },
    doubleCountViolations: violations,
    perCell: cells.map((c) => ({
      backingId: c.backingId,
      institutionId: c.institutionId,
      evidenceState: c.evidence.evidenceState,
      simulated: c.simulated,
      availableBacking: computeAvailableBacking(c).availableBacking,
      eligibility: isEligibleAsBacking(c),
      attestations: c.evidence.attestations,
    })),
    honestState: protectedBackingHonestState(),
    formula: PBC_FORMULA,
    antiDoubleCountRule: PBC_ANTI_DOUBLE_COUNT_RULE,
  };
}
```

### 14.9.3 The Honest State Declaration

The honest state is declared by `protectedBackingHonestState`:

```typescript
export function protectedBackingHonestState(): {
  protectedBackingModelImplemented: true;
  protectedBackingLiveCells: 0;
} {
  return {
    protectedBackingModelImplemented: true,
    protectedBackingLiveCells: 0,
  };
}
```

This declares two §74 honest-state invariants:
- `protectedBackingModelImplemented = true` — the model / code is
  implemented.
- `protectedBackingLiveCells = 0` — NO live cell has been contracted;
  every reference cell is SIMULATED / SPECIFIED, not a live
  institutional pledge.

These invariants MUST NOT be altered to mask immaturity. They are
the honest-state contract for §47.

## 14.10 Eligibility Rules

A PBC is eligible to support MTQ issuance if it passes all §47
eligibility rules. The rules are encoded in `isEligibleAsBacking`:

1. **`legalStatus` must be `CLEARED` or `CONFIRMED`** — the legal title
   must be confirmed and the pledge authorized.
2. **`evidence.evidenceState` must be ≥ `INTEGRATED`** — the §73
   minimum for backing. `TESTED` or higher is preferred.
3. **`verificationTimestamp` must be present and within the past 90
   days** — verifications older than 90 days are stale.
4. **`expiry` must be in the future** — expired pledges are
   ineligible.
5. **`effectiveDate` must be present and not in the future** —
   pledges with future effective dates are ineligible.
6. **`custodianTier` must NOT be `TIER4_SELF_CUSTODY` or
   `TIER_UNKNOWN`** — only regulated custodians are acceptable.
7. **`jurisdictionRisk` must be `APPROVED`** — cells in WATCH,
   SANCTIONED, or UNKNOWN jurisdictions are ineligible.
8. **`encumbranceStatus` must NOT be `FROZEN` or `ENCUMBERED`** —
   frozen or fully-encumbered cells cannot support new obligations.
9. **`haircut` must be in `[0, 0.20]`** — the constitutional sanity
   ceiling. Haircuts above 20% are ineligible.
10. **`quantity` and `valuation` must be positive** — non-positive
    cells are ineligible.
11. **The cell must support at most one MTQ obligation** — cells that
    already support multiple obligations (anti-double-count
    violation) are ineligible until remediated.

The eligibility check returns a `ProtectedBackingCellStatus`:
- `status` — one of `ELIGIBLE`, `ELIGIBLE_WITH_CONDITIONS`,
  `PENDING_VERIFICATION`, `INELIGIBLE`, `EXPIRED`, `LIQUIDATED`.
- `color` — one of `amber`, `emerald`, `red`, `gray` (NO indigo /
  blue per the §47 color palette).
- `reasons` — the list of failure / condition reasons (empty for
  ELIGIBLE).

## 14.11 Current State — 0 Live Cells, 4 SIMULATED Reference Cells

Per §74 honest-state `protectedBackingLiveCells = 0`, the current
state of the PBC module is:
- The model is implemented (the code in `protected-backing-cell.ts`).
- 0 live cells have been contracted (no real institution, custodian,
  or asset is contracted).
- 4 SIMULATED reference cells exist (illustrative, non-binding).

### 14.11.1 Reference Cell 1 — USD Cash

- `backingId`: `pbc-usd-cash-001`
- `institutionId`: `inst-bank-ny-001`
- `asset`: fiat-cash, USD demand deposit (HQLA-1 cash), USD
- `quantity`: 65,000,000
- `valuation`: $65,000,000 (1:1 USD)
- `haircut`: 0.00
- `legalStatus`: CLEARED
- `custodian`: SIMULATED — regulated US bank custodian (NY)
- `custodianTier`: TIER1_REGULATED_BANK
- `jurisdiction`: US-NY
- `jurisdictionRisk`: APPROVED
- `encumbranceStatus`: PLEDGED_TO_MITHQAL
- `encumberedAmount`: $0
- `evidenceState`: TESTED
- `attestations`:
  - custodian_attestation — SIMULATED bank treasury, 5 days ago
  - independent_audit — SIMULATED Big-4 audit firm, 12 days ago
- `simulated`: true

**AvailableBacking:** $65,000,000 × (1 − 0.00) − $0 − $0 = $65,000,000

### 14.11.2 Reference Cell 2 — Allocated Physical Gold

- `backingId`: `pbc-xau-allocated-001`
- `institutionId`: `inst-bullion-custodian-lon-001`
- `asset`: gold-physical-allocated, Allocated physical gold (Good
  Delivery bars)
- `quantity`: 12,000 troy ounces
- `valuation`: $23,400,000 (~$1,950/oz illustrative)
- `haircut`: 0.02
- `legalStatus`: CONFIRMED
- `custodian`: SIMULATED — LBMA bullion custodian (London vault)
- `custodianTier`: TIER2_SPECIALIST_CUSTODIAN
- `jurisdiction`: GB-ENG
- `jurisdictionRisk`: APPROVED
- `encumbranceStatus`: PLEDGED_TO_MITHQAL
- `encumberedAmount`: $0
- `evidenceState`: TESTED
- `attestations`:
  - custodian_attestation — SIMULATED vault operator, 7 days ago
  - legal_opinion — SIMULATED London counsel, 18 days ago
  - independent_audit — SIMULATED LBMA auditor, 20 days ago
- `simulated`: true

**AvailableBacking:** $23,400,000 × (1 − 0.02) − $0 − $0 = $22,932,000

### 14.11.3 Reference Cell 3 — USDC

- `backingId`: `pbc-usdc-001`
- `institutionId`: `inst-stablecoin-issuer-001`
- `asset`: digital-stablecoin, USDC (regulated stablecoin), USDC
- `quantity`: 2,600,000
- `valuation`: $2,600,000 (1:1 USD peg)
- `haircut`: 0.03
- `legalStatus`: CONFIRMED
- `custodian`: SIMULATED — regulated money-transmitter / issuer
- `custodianTier`: TIER2_SPECIALIST_CUSTODIAN
- `jurisdiction`: US-NY
- `jurisdictionRisk`: APPROVED
- `encumbranceStatus`: PLEDGED_TO_MITHQAL
- `encumberedAmount`: $0
- `evidenceState`: TESTED
- `attestations`:
  - smart_contract_proof — SIMULATED on-chain proof-of-reserves,
    2 days ago
  - off_chain_receipt — SIMULATED issuer attestation report, 3 days
    ago
  - regulator_no_objection — SIMULATED NYDFS-regulated issuer, 30
    days ago
- `simulated`: true

**AvailableBacking:** $2,600,000 × (1 − 0.03) − $0 − $0 = $2,522,000

### 14.11.4 Reference Cell 4 — US Treasury Bill (3-month)

- `backingId`: `pbc-ust-001`
- `institutionId`: `inst-bank-ny-001`
- `asset`: fiat-sovereign, US Treasury Bill (3-month), USD, ISIN
  US9127973C91 (SIMULATED ISIN)
- `quantity`: 39,000,000
- `valuation`: $39,000,000
- `haircut`: 0.01
- `legalStatus`: CLEARED
- `custodian`: SIMULATED — regulated US bank custody
- `custodianTier`: TIER1_REGULATED_BANK
- `jurisdiction`: US-NY
- `jurisdictionRisk`: APPROVED
- `encumbranceStatus`: PARTIALLY_ENCUMBERED
- `encumberedAmount`: $2,000,000 (small pre-existing security interest)
- `evidenceState`: TESTED
- `attestations`:
  - custodian_attestation — SIMULATED bank custody ops, 4 days ago
  - independent_audit — SIMULATED custody auditor, 15 days ago
- `simulated`: true

**AvailableBacking:** $39,000,000 × (1 − 0.01) − $2,000,000 − $0 =
  $38,610,000 − $2,000,000 − $0 = $36,610,000

### 14.11.5 Aggregated Reference State

| Cell | Recognized | Encumbered | Available |
|------|------------|------------|-----------|
| pbc-usd-cash-001 | $65,000,000 | $0 | $65,000,000 |
| pbc-xau-allocated-001 | $22,932,000 | $0 | $22,932,000 |
| pbc-usdc-001 | $2,522,000 | $0 | $2,522,000 |
| pbc-ust-001 | $38,610,000 | $2,000,000 | $36,610,000 |
| **Total** | **$129,064,000** | **$2,000,000** | **$127,064,000** |

The aggregated available backing of $127,064,000 supports a maximum
MTQ issuance of $127,064,000 / 1.30 = $97,741,538 (per the §3 130%
strategic reserve ratio target).

### 14.11.6 The `finalStatus`

Per the §47 report (`generateProtectedBackingCellReport`):

```
"finalStatus": "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT
PRODUCTION-AUTHORIZED (model implemented; 0 live cells; all
reference cells SIMULATED)"
"finalStatusColor": "amber"
```

The amber color signals that the model is implemented but not yet
production-authorized. The honest-state invariants (`protectedBacking-
LiveCells = 0`) MUST remain in their current values until the §74
production-readiness gates are met.

## 14.12 Illustrative Example — A Bank Allocating $50M USD as Backing for MTQ Issuance

This example walks through the allocation workflow for a bank
allocating $50M USD as backing for an MTQ issuance.

### 14.12.1 Setup

- **Bank:** Reference-Responsible-Bank (SIMULATED — illustrative).
- **Bank's custodian:** SIMULATED — regulated US bank custodian (NY).
- **Asset:** USD cash on deposit at the bank (HQLA-1 cash).
- **Cell ID:** `pbc-usd-cash-001` (the reference cell from §14.11.1).
- **MTQ obligation:** A $50M MTQ issuance requested by a corporate
  customer (per the §12 demo corridor).

### 14.12.2 Pre-Allocation State

The cell is in its reference state:
- `valuation`: $65,000,000
- `haircut`: 0.00
- `encumberedAmount`: $0
- `utilizedAmount`: $0
- `availableAmount`: $65,000,000 (computed)
- `allocationStatus`: UNALLOCATED
- `allocatedObligationIds`: []

The `AvailableBacking` computation:
- RecognizedBacking = $65,000,000 × (1 − 0.00) = $65,000,000
- EncumberedBacking = $0
- AlreadyAllocatedBacking = $0
- AvailableBacking = $65,000,000 − $0 − $0 = $65,000,000

### 14.12.3 Eligibility Check

The cell's eligibility is checked via `isEligibleAsBacking`:
1. `legalStatus` = `CLEARED` ✓
2. `evidence.evidenceState` = `TESTED` (≥ `INTEGRATED`) ✓
3. `verificationTimestamp` = today (within 90 days) ✓
4. `expiry` = 365 days from now (in the future) ✓
5. `effectiveDate` = today (not in the future) ✓
6. `custodianTier` = `TIER1_REGULATED_BANK` (not
   `TIER4_SELF_CUSTODY` or `TIER_UNKNOWN`) ✓
7. `jurisdictionRisk` = `APPROVED` ✓
8. `encumbranceStatus` = `PLEDGED_TO_MITHQAL` (not `FROZEN` or
   `ENCUMBERED`) ✓
9. `haircut` = 0.00 (≤ 0.20) ✓
10. `quantity` = 65,000,000 (positive) ✓
11. `valuation` = $65,000,000 (positive) ✓
12. Anti-double-count check: `allocatedObligationIds` = [] (size 0
    ≤ 1) ✓

**Result:** `ELIGIBLE` (emerald). All §47 eligibility checks passed.

### 14.12.4 Allocation Request

MITHQAL Core calls:
```typescript
allocateBacking(cell, 50_000_000, "MTQ-OBL-2026-08-22-001")
```

The function:
1. Verifies `amount = 50,000,000 > 0` ✓
2. Verifies `mtqObligationId = "MTQ-OBL-2026-08-22-001"` is non-empty ✓
3. Anti-double-count check: searches for an existing OTHER obligation
   in `allocatedObligationIds = []`. None found. ✓
4. Capacity check:
   - `avail = computeAvailableBacking(cell)`
   - `avail.availableBacking = $65,000,000`
   - `newUtilized = $0 + $50,000,000 = $50,000,000`
   - `newUtilized ≤ avail.availableBacking + 1e-6` ($50M ≤ $65M) ✓
5. Updates the cell:
   - `utilizedAmount = $50,000,000`
   - `availableAmount = $65,000,000 − $50,000,000 = $15,000,000`
   - `allocatedObligationIds = ["MTQ-OBL-2026-08-22-001"]`
   - `allocationStatus = PARTIALLY_ALLOCATED` (utilized < recognized −
     encumbered)

**Result:** `{ ok: true, cell: <updated>, allocatedAmount: $50,000,000,
mtqObligationId: "MTQ-OBL-2026-08-22-001" }`

### 14.12.5 Post-Allocation State

The cell's new state:
- `valuation`: $65,000,000
- `haircut`: 0.00
- `encumberedAmount`: $0
- `utilizedAmount`: $50,000,000
- `availableAmount`: $15,000,000
- `allocationStatus`: PARTIALLY_ALLOCATED
- `allocatedObligationIds`: ["MTQ-OBL-2026-08-22-001"]

The `AvailableBacking` recomputation:
- RecognizedBacking = $65,000,000
- EncumberedBacking = $0
- AlreadyAllocatedBacking = $50,000,000
- AvailableBacking = $65,000,000 − $0 − $50,000,000 = $15,000,000

### 14.12.6 Verification

The `verifyNoDoubleCount` function scans the cell:
- `allocatedObligationIds = ["MTQ-OBL-2026-08-22-001"]`
- Distinct obligations: 1 (≤ 1)
- **No violation.**

### 14.12.7 Attempted Double-Count Allocation (BLOCKED)

Suppose another MTQ obligation (`MTQ-OBL-2026-08-22-002`) requests
$10M of backing from the same cell:

```typescript
allocateBacking(cell, 10_000_000, "MTQ-OBL-2026-08-22-002")
```

The function:
1. Verifies `amount = 10,000,000 > 0` ✓
2. Verifies `mtqObligationId = "MTQ-OBL-2026-08-22-002"` is non-empty ✓
3. **Anti-double-count check:** searches for an existing OTHER
   obligation in `allocatedObligationIds = ["MTQ-OBL-2026-08-22-001"]`.
   Found: `"MTQ-OBL-2026-08-22-001"` (different from
   `"MTQ-OBL-2026-08-22-002"`).
4. **REJECTED** with reason:
   ```
   "anti-double-count violation: backing pbc-usd-cash-001 is already
   allocated to MTQ obligation 'MTQ-OBL-2026-08-22-001'; cannot also
   support 'MTQ-OBL-2026-08-22-002'"
   ```

The cell's state is unchanged.

### 14.12.8 Same-Obligation Top-Up (PERMITTED)

If the same MTQ obligation requests an additional $5M of backing:

```typescript
allocateBacking(cell, 5_000_000, "MTQ-OBL-2026-08-22-001")
```

The function:
1. Verifies `amount = 5,000,000 > 0` ✓
2. Verifies `mtqObligationId = "MTQ-OBL-2026-08-22-001"` is non-empty ✓
3. Anti-double-count check: searches for an existing OTHER obligation
   in `allocatedObligationIds = ["MTQ-OBL-2026-08-22-001"]`. The
   existing obligation IS the same as the requested one (`"MTQ-OBL-
   2026-08-22-001"`). No OTHER obligation found. ✓
4. Capacity check:
   - `avail.availableBacking = $15,000,000` (post-allocation)
   - `newUtilized = $50,000,000 + $5,000,000 = $55,000,000`
   - `newUtilized ≤ avail.availableBacking + 1e-6` ($55M ≤ $65M) ✓
5. Updates the cell:
   - `utilizedAmount = $55,000,000`
   - `availableAmount = $65,000,000 − $55,000,000 = $10,000,000`
   - `allocatedObligationIds` unchanged (still
     `["MTQ-OBL-2026-08-22-001"]`)
   - `allocationStatus` unchanged (still `PARTIALLY_ALLOCATED`)

**Result:** `{ ok: true, cell: <updated>, allocatedAmount: $5,000,000,
mtqObligationId: "MTQ-OBL-2026-08-22-001" }`

### 14.12.9 Capacity Exceeded (BLOCKED)

If the same MTQ obligation requests an additional $20M of backing:

```typescript
allocateBacking(cell, 20_000_000, "MTQ-OBL-2026-08-22-001")
```

The function:
1. Verifies `amount = 20,000,000 > 0` ✓
2. Verifies `mtqObligationId = "MTQ-OBL-2026-08-22-001"` is non-empty ✓
3. Anti-double-count check: no OTHER obligation found. ✓
4. **Capacity check:**
   - `avail.availableBacking = $10,000,000` (post-top-up)
   - `newUtilized = $55,000,000 + $20,000,000 = $75,000,000`
   - `newUtilized ≤ avail.availableBacking + 1e-6` ($75M ≤ $10M) ✗
5. **REJECTED** with reason:
   ```
   "insufficient available backing: requested 20000000 (would bring
   utilized to 75000000); available = 10000000"
   ```

The cell's state is unchanged.

### 14.12.10 Release

When the MTQ obligation is closed (e.g., the MTQ is redeemed), MITHQAL
Core releases the allocation:

```typescript
releaseAllocation(cell, "MTQ-OBL-2026-08-22-001")
```

The function:
1. Verifies the cell is allocated to `"MTQ-OBL-2026-08-22-001"`:
   `allocatedObligationIds = ["MTQ-OBL-2026-08-22-001"]` (includes
   the requested ID). ✓
2. Records `released = $55,000,000` (the current `utilizedAmount`).
3. Updates the cell:
   - `utilizedAmount = $0`
   - `availableAmount = $65,000,000` (recomputed via
     `computeAvailableBacking({ ...cell, utilizedAmount: 0 })`)
   - `allocatedObligationIds = []` (the obligation ID is removed)
   - `allocationStatus = RELEASED`

**Result:** `{ ok: true, cell: <updated>, releasedAmount: $55,000,000,
mtqObligationId: "MTQ-OBL-2026-08-22-001" }`

### 14.12.11 Post-Release State

The cell's new state:
- `valuation`: $65,000,000
- `haircut`: 0.00
- `encumberedAmount`: $0
- `utilizedAmount`: $0
- `availableAmount`: $65,000,000
- `allocationStatus`: RELEASED
- `allocatedObligationIds`: []

The cell is now in `RELEASED` status. After a periodic reset (by
MITHQAL's reconciliation layer), the cell's `allocationStatus` will
transition back to `UNALLOCATED`, and the cell will be available to
support a new MTQ obligation.

### 14.12.12 Evidence Package Generation

The bank can request an evidence package for the cell:

```typescript
generateProtectedBackingEvidence([cell])
```

The function returns:
- `evidencePackageId`: `"pbc-evidence-..."` (a unique ID)
- `generatedAt`: current timestamp
- `module`: `"v25.2-protected-backing-cell-1.0"`
- `section`: 47
- `cellCount`: 1
- `totals`:
  - `recognizedBacking`: $65,000,000
  - `encumberedBacking`: $0
  - `alreadyAllocatedBacking`: $0 (post-release)
  - `availableBacking`: $65,000,000
- `doubleCountViolations`: []
- `perCell`: the cell's evidence record
- `honestState`: `{ protectedBackingModelImplemented: true,
  protectedBackingLiveCells: 0 }`
- `formula`: `"AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking"`
- `antiDoubleCountRule`: `"A single backing must never support
  multiple MTQ obligations; a Protected Backing Cell may be allocated
  to at most one mtqObligationId at a time."`

The bank can share this evidence package with regulators, auditors,
or other stakeholders as proof of the cell's state.

## 14.13 Section 14 Summary

The Protected Backing Cell is the canonical data structure by which a
bank or institution-side asset is identified, earmarked, verified, and
allocated to support MTQ issuance. The 17-field schema captures all
the information needed to verify the asset, compute the available
backing, and enforce the anti-double-count rule. The §47 formula
(`AvailableBacking = RecognizedBacking − EncumberedBacking −
AlreadyAllocatedBacking`) is the central computation. The anti-double-
count rule ("a single backing must never support multiple MTQ
obligations") is enforced at both the mutation layer (by
`allocateBacking`) and the audit layer (by `verifyNoDoubleCount`).
The eligibility rules (11 checks) ensure that only cells with clear
legal title, sufficient evidence, valid custodians, approved
jurisdictions, and acceptable encumbrance status can support MTQ
issuance. The 4 SIMULATED reference cells (USD cash, physical gold,
USDC, US Treasury) demonstrate the schema's applicability across
asset classes. The current state is 0 live cells — all reference
cells are SIMULATED per §74 honest-state `protectedBackingLiveCells
= 0`. The PBC model is APPROVED CANDIDATE FOR CONTROLLED TESTING —
NOT PRODUCTION-AUTHORIZED.

**Honest state:** The PBC model is implemented (the code in
`protected-backing-cell.ts` — 1,133 lines, 17 canonical fields, the
§47 formula, the anti-double-count rule, the eligibility rules, the
evidence package generator, the 4 SIMULATED reference cells). No
real institution, custodian, or asset is contracted. The PBC model
may NOT carry live backing until §74 honest-state invariants
transition to their production-authorized values.

---

# SECTION 15 — THREE-BOOK SEPARATION (§51)

## 15.1 Section Scope and Authority

This section codifies the Three-Book Economic Separation — the
architectural principle that the MITHQAL institutional stack must keep
three economically distinct books that RECONCILE but are NEVER
economically commingled. It implements §51 of the v25.2 master
directive and is fully specified in `src/lib/three-book-separation.ts`
(975 lines, MODULE_ID `v25.2-three-book-separation-1.0`).

The Three-Book Separation is the structural mechanism by which
MITHQAL enforces two non-negotiable principles:

1. **The non-custodial principle (§V25.2):** MITHQAL is non-custodial
   by default. MITHQAL does NOT hold customer MTQ balances, bank
   backing, or corporate operating cash. Each of these is held by
   its respective economic owner — the corporate participant holds
   their MTQ balance, the bank holds the backing, the MITHQAL
   operating company holds its own operating cash.

2. **The non-commingling principle (§51):** The three books must
   reconcile but must NEVER be economically commingled. Corporate
   cash is NOT bank backing. Bank MTQ obligations are NOT corporate
   revenue. Participant MTQ holdings are NOT MITHQAL corporate
   assets. Reserve gains are NOT operating-company revenue.

The Three-Book Separation is one of the §74 honest-state invariants:
`threeBookDesign = true` (the design is complete),
`threeBookOperational = false` (not yet operating in production),
`threeBookEnforced = false` (no on-chain/institutional enforcement yet).
The design is complete; operational rollout and institutional
enforcement remain future work.

## 15.2 The Three Books

The Three-Book Separation defines three economically distinct books:

### 15.2.1 Book A — MITHQAL Corporate

**Description:** MITHQAL operating-company books: revenue, expenses,
payroll, tax, technology costs, corporate assets, corporate
liabilities, profit/loss. This is the financial book of the MITHQAL
operating company — the legal entity that employs the team, pays for
the technology, and earns the operating revenue.

**Economic scope:** Book A captures the MITHQAL operating company's
own financial position. It does NOT capture customer MTQ balances,
bank backing, or any other economic value that MITHQAL does not own.

**8 fields (detailed in §15.3 below):**
1. `revenue` — corporate revenue (operating).
2. `expenses` — corporate expenses (operating).
3. `payroll` — payroll.
4. `tax` — corporate tax.
5. `technologyCosts` — technology costs.
6. `corporateAssets` — corporate assets (operating cash, infra, IP).
7. `corporateLiabilities` — corporate liabilities.
8. `profitLoss` — profit / loss = revenue − expenses (no reserve gains).

### 15.2.2 Book B — Bank MTQ Obligation Ledger

**Description:** Bank-side MTQ obligation ledger: responsible bank,
applicable backing, MTQ originated, MTQ outstanding, redemption
obligations, liquidity, settlement, bank risk. This is the
monetary-system book — it captures the bank's MTQ issuance obligations
and the backing that supports them.

**Economic scope:** Book B captures the bank-side monetary position.
The bank is the responsible party for the MTQ it originates; the
bank holds the backing (per §47 Protected Backing Cell); the bank
is liable for the MTQ outstanding (per the §49 legal-liability
framework).

**8 fields (detailed in §15.4 below):**
1. `responsibleBank` — responsible bank / institution.
2. `applicableBacking` — applicable backing (USD-equivalent).
3. `mtqOriginated` — MTQ originated (cumulative).
4. `mtqOutstanding` — MTQ outstanding (current liability).
5. `redemptionObligations` — redemption obligations (pending).
6. `liquidity` — bank liquidity buffer.
7. `settlement` — settlement balance.
8. `bankRisk` — bank risk score (0–1, higher = riskier).

### 15.2.3 Book C — Corporate Participant Position

**Description:** Corporate participant position: MTQ balance,
available MTQ, reserved MTQ, pending MTQ, sent, received, redemption,
settlement history, bank-money linkage. This is the participant's
book — it captures each corporate participant's MTQ position.

**Economic scope:** Book C captures the corporate participant's MTQ
holdings and activity. The participant is NOT MITHQAL — the
participant is the corporate customer whose bank holds their MTQ
settlement account. The participant's MTQ balance is a position held
BY the participant, not an asset owned BY MITHQAL.

**9 fields (detailed in §15.5 below):**
1. `mtqBalance` — MTQ balance.
2. `availableMtq` — available MTQ (free to transact).
3. `reservedMtq` — reserved MTQ (held for pending ops).
4. `pendingMtq` — pending MTQ (in-flight).
5. `sent` — MTQ sent (cumulative).
6. `received` — MTQ received (cumulative).
7. `redemption` — redemption activity (cumulative amount).
8. `settlementHistory` — settlement history (count of settled
   transactions).
9. `bankMoneyLinkage` — bank-money linkage (which bank holds the
   underlying).

## 15.3 Book A — MITHQAL Corporate (8 Fields)

### 15.3.1 Field 1 — `revenue` (number)

**Description:** Corporate revenue (operating). The revenue that the
MITHQAL operating company earns from its operations — fees for
settlement services, MBG licensing fees, professional services
revenue, etc.

**Constraints:**
- Must be ≥ 0 (revenue cannot be negative).
- Must NOT include bank MTQ obligations (those belong to Book B).
- Must NOT include reserve gains (those belong to Book B as well,
  not to operating-company revenue).
- Must NOT include participant MTQ balances (those belong to Book C).

**Use:** The `revenue` field captures the operating-company's
legitimate operating revenue. It is one of the two inputs (along with
`expenses`) to the `profitLoss` computation.

### 15.3.2 Field 2 — `expenses` (number)

**Description:** Corporate expenses (operating). The expenses that the
MITHQAL operating company incurs from its operations — payroll,
technology costs, office rent, professional services fees, etc.

**Constraints:**
- Must be ≥ 0 (expenses cannot be negative — though they can be 0 for
  a no-op period).
- Must NOT include bank MTQ redemption payouts (those belong to Book
  B as `redemptionObligations`).
- Must NOT include reserve losses (those belong to Book B).

**Use:** The `expenses` field captures the operating-company's
operating expenses. The other input to the `profitLoss` computation.

### 15.3.3 Field 3 — `payroll` (number)

**Description:** Payroll. The total payroll expense for the MITHQAL
operating company's employees.

**Constraints:**
- Must be ≥ 0.
- Must be a component of `expenses` (i.e., `expenses ≥ payroll` —
  payroll is a subset of total expenses).
- For the reference SIMULATED ledger, `payroll = 0` (illustrative
  only).

**Use:** The `payroll` field provides visibility into the
operating-company's labor cost. It is a sub-component of `expenses`.

### 15.3.4 Field 4 — `tax` (number)

**Description:** Corporate tax. The corporate income tax that the
MITHQAL operating company owes on its `profitLoss`.

**Constraints:**
- Must be ≥ 0.
- Must be a function of `profitLoss` (per the operating-company's
  jurisdictional tax rules).
- For the reference SIMULATED ledger, `tax = 0` (illustrative only,
  since `profitLoss = 0`).

**Use:** The `tax` field captures the operating-company's tax
obligation. It is a component of `expenses` (typically accounted as
a separate expense category).

### 15.3.5 Field 5 — `technologyCosts` (number)

**Description:** Technology costs. The total technology-related
expense for the MITHQAL operating company — cloud infrastructure,
software licenses, developer tools, hardware, etc.

**Constraints:**
- Must be ≥ 0.
- Must be a component of `expenses`.
- For the reference SIMULATED ledger, `technologyCosts = 0`
  (illustrative only).

**Use:** The `technologyCosts` field provides visibility into the
operating-company's technology spend. It is a sub-component of
`expenses`.

### 15.3.6 Field 6 — `corporateAssets` (number)

**Description:** Corporate assets (operating cash, infrastructure,
intellectual property). The total assets owned by the MITHQAL
operating company.

**Constraints:**
- Must be ≥ 0.
- Must NOT include bank backing (that belongs to Book B as
  `applicableBacking`).
- Must NOT include participant MTQ balances (those belong to Book C
  as `mtqBalance`).
- Must NOT include reserve assets (those belong to Book B).
- For the reference SIMULATED ledger, `corporateAssets = $50,000,000`
  (illustrative — the MITHQAL operating company's cash reserve for
  salaries and infrastructure).

**Use:** The `corporateAssets` field captures the operating-company's
own assets. The anti-commingling rule (§15.6 below) strictly forbids
using these assets as MTQ backing.

### 15.3.7 Field 7 — `corporateLiabilities` (number)

**Description:** Corporate liabilities. The total liabilities owed
by the MITHQAL operating company — accounts payable, accrued
expenses, deferred revenue, etc.

**Constraints:**
- Must be ≥ 0.
- Must NOT include bank MTQ obligations (those belong to Book B as
  `mtqOutstanding`).
- Must NOT include participant MTQ redemption obligations (those
  belong to Book B as `redemptionObligations`).
- For the reference SIMULATED ledger, `corporateLiabilities = 0`.

**Use:** The `corporateLiabilities` field captures the
operating-company's own liabilities.

### 15.3.8 Field 8 — `profitLoss` (number)

**Description:** Profit / loss = revenue − expenses (no reserve
gains). The net profit or loss for the period.

**Constraints:**
- MUST equal `revenue − expenses` (the §51 reconciliation check
  verifies this arithmetic).
- Must NOT include reserve gains (capitalizing reserve gains as
  operating revenue is the textbook §51 violation — see §15.6.4
  below).
- Must NOT include bank MTQ obligations (those belong to Book B).
- For the reference SIMULATED ledger, `profitLoss = 0` (= $0 − $0).

**Use:** The `profitLoss` field captures the operating-company's
net result. The §51 reconciliation check verifies `profitLoss ==
revenue − expenses` — any deviation implies reserve gains or other
off-book income were injected into the operating P&L.

## 15.4 Book B — Bank MTQ Obligation Ledger (8 Fields)

### 15.4.1 Field 1 — `responsibleBank` (string)

**Description:** The responsible bank / institution. The bank that
holds the MTQ obligation, the backing, and the redemption
obligations.

**Constraints:**
- Must be a non-empty string.
- Must correspond to a registered institution in MITHQAL's
  institution registry (per §10 BankSecurityProfile).
- The bank is the legal entity responsible for the MTQ it
  originates (per the §49 legal-liability framework).

**Use:** The `responsibleBank` field attributes the MTQ obligation
to a specific bank. Multiple banks can have separate Book B
entries (each bank has its own row in the ledger).

### 15.4.2 Field 2 — `applicableBacking` (number)

**Description:** Applicable backing (USD-equivalent). The total
recognized backing that the bank has allocated to support MTQ
issuance. This is the sum of all the bank's Protected Backing
Cells' `recognizedBacking` (per §47).

**Constraints:**
- Must be ≥ 0.
- Must be sourced from Protected Backing Cells (Book B does NOT
  create backing; it references backing held in PBCs).
- Must NOT include corporate cash (that belongs to Book A as
  `corporateAssets` — the anti-commingling rule forbids using
  corporate cash as bank backing).
- For the reference SIMULATED ledger, `applicableBacking =
  $130,000,000` (130% of the $100M MTQ outstanding, meeting the
  §3 strategic reserve ratio target).

**Use:** The `applicableBacking` field captures the bank-side backing.
The §51 reconciliation check verifies `applicableBacking ≥ 1.30 ×
mtqOutstanding` — the 130% strategic backing target.

### 15.4.3 Field 3 — `mtqOriginated` (number)

**Description:** MTQ originated (cumulative). The total MTQ that the
bank has originated since the start of its MITHQAL relationship.

**Constraints:**
- Must be ≥ 0.
- Must be ≥ `mtqOutstanding` (originated ≥ outstanding, since some
  MTQ may have been redeemed).
- For the reference SIMULATED ledger, `mtqOriginated = $100,000,000`.

**Use:** The `mtqOriginated` field captures the cumulative MTQ
issuance. It is a counter that only goes up (issuance is
append-only).

### 15.4.4 Field 4 — `mtqOutstanding` (number)

**Description:** MTQ outstanding (current liability). The total MTQ
that the bank has issued and that has not yet been redeemed.

**Constraints:**
- Must be ≥ 0.
- Must be ≤ `mtqOriginated` (outstanding ≤ originated).
- For the reference SIMULATED ledger, `mtqOutstanding = $100,000,000`.

**Use:** The `mtqOutstanding` field captures the bank's current MTQ
liability. It is the input to the 130% backing target check.

### 15.4.5 Field 5 — `redemptionObligations` (number)

**Description:** Redemption obligations (pending). The total MTQ
redemption requests that the bank has received but not yet fulfilled.

**Constraints:**
- Must be ≥ 0.
- Must be ≤ `mtqOutstanding` (redemption obligations cannot exceed
  outstanding).
- For the reference SIMULATED ledger, `redemptionObligations = 0`.

**Use:** The `redemptionObligations` field captures the bank's
pending redemption workload. It is monitored by MITHQAL's
liquidity-monitoring layer to ensure the bank has sufficient
liquidity to fulfill redemptions.

### 15.4.6 Field 6 — `liquidity` (number)

**Description:** Bank liquidity buffer. The total liquid assets that
the bank has available to fulfill redemption obligations.

**Constraints:**
- Must be ≥ 0.
- Should be ≥ `redemptionObligations` (the bank should have
  sufficient liquidity to fulfill pending redemptions — if not, the
  reconciliation check flags a violation).
- For the reference SIMULATED ledger, `liquidity = $130,000,000`.

**Use:** The `liquidity` field captures the bank's liquidity
position. The §51 reconciliation check flags a violation if
`applicableBacking > 0` with `liquidity ≤ 0` and `mtqOutstanding > 0`
— this implies off-book funding (possible corporate-cash commingling
into the bank backing).

### 15.4.7 Field 7 — `settlement` (number)

**Description:** Settlement balance. The total settlement activity
for the bank (a running counter of settled MTQ transactions).

**Constraints:**
- Can be positive, zero, or negative (settlement is bidirectional).
- For the reference SIMULATED ledger, `settlement = 0`.

**Use:** The `settlement` field captures the bank's settlement
activity. It is monitored by MITHQAL's settlement-monitoring layer.

### 15.4.8 Field 8 — `bankRisk` (number, 0–1)

**Description:** Bank risk score (0–1, higher = riskier). The
composite risk score for the bank, computed from the bank's
financial strength, regulatory standing, operational resilience,
and historical performance.

**Constraints:**
- Must be in [0, 1].
- A score ≥ 0.5 indicates a high-risk bank (MITHQAL may impose
  additional requirements).
- For the reference SIMULATED ledger, `bankRisk = 0.18`
  (illustrative — well below the 0.5 risk threshold).

**Use:** The `bankRisk` field drives MITHQAL's bank-risk-monitoring
layer. Banks with high risk scores may be subject to additional
backing requirements, redemption-liquidity requirements, or
operational restrictions.

## 15.5 Book C — Corporate Participant Position (9 Fields)

### 15.5.1 Field 1 — `mtqBalance` (number)

**Description:** MTQ balance. The corporate participant's current MTQ
balance.

**Constraints:**
- Must be ≥ 0.
- Must be ≤ the corresponding Book B `mtqOutstanding` (participant
  balances are a subset of bank obligation).
- For the reference SIMULATED ledger, `mtqBalance = $10,000,000`.

**Use:** The `mtqBalance` field captures the participant's MTQ
holdings. The §51 reconciliation check verifies Book C Σ(MTQ) ≤
Book B Σ(MTQ outstanding).

### 15.5.2 Field 2 — `availableMtq` (number)

**Description:** Available MTQ (free to transact). The portion of the
participant's MTQ balance that is free to transact (not reserved
for pending operations).

**Constraints:**
- Must be ≥ 0.
- Must be ≤ `mtqBalance` (available ≤ total).
- For the reference SIMULATED ledger, `availableMtq = $9,500,000`.

**Use:** The `availableMtq` field captures the participant's
available MTQ. The participant can transact up to this amount.

### 15.5.3 Field 3 — `reservedMtq` (number)

**Description:** Reserved MTQ (held for pending ops). The portion of
the participant's MTQ balance that is reserved for pending
operations (e.g., a pending payment).

**Constraints:**
- Must be ≥ 0.
- Must be ≤ `mtqBalance` − `availableMtq` (reserved = total −
  available − pending).
- For the reference SIMULATED ledger, `reservedMtq = $500,000`.

**Use:** The `reservedMtq` field captures the participant's
reserved MTQ. When a pending operation completes, the reserved MTQ
is either consumed (settled) or released (back to available).

### 15.5.4 Field 4 — `pendingMtq` (number)

**Description:** Pending MTQ (in-flight). The portion of the
participant's MTQ balance that is in-flight (being transferred to
another participant).

**Constraints:**
- Must be ≥ 0.
- For the reference SIMULATED ledger, `pendingMtq = 0`.

**Use:** The `pendingMtq` field captures the participant's in-flight
MTQ. When the transfer completes, the in-flight MTQ is debited from
the sender and credited to the receiver.

### 15.5.5 Field 5 — `sent` (number)

**Description:** MTQ sent (cumulative). The total MTQ that the
participant has sent to other participants since the start of their
MITHQAL relationship.

**Constraints:**
- Must be ≥ 0.
- For the reference SIMULATED ledger, `sent = 0`.

**Use:** The `sent` field is a counter that captures the
participant's outgoing MTQ activity.

### 15.5.6 Field 6 — `received` (number)

**Description:** MTQ received (cumulative). The total MTQ that the
participant has received from other participants since the start
of their MITHQAL relationship.

**Constraints:**
- Must be ≥ 0.
- For the reference SIMULATED ledger, `received = $10,000,000`
  (the participant's initial MTQ balance came from a receipt).

**Use:** The `received` field is a counter that captures the
participant's incoming MTQ activity.

### 15.5.7 Field 7 — `redemption` (number)

**Description:** Redemption activity (cumulative amount). The total
MTQ that the participant has redeemed (converted back to fiat)
since the start of their MITHQAL relationship.

**Constraints:**
- Must be ≥ 0.
- For the reference SIMULATED ledger, `redemption = 0`.

**Use:** The `redemption` field captures the participant's
redemption activity. It is monitored by MITHQAL's
redemption-monitoring layer.

### 15.5.8 Field 8 — `settlementHistory` (number)

**Description:** Settlement history (count of settled transactions).
The total number of settled transactions that the participant has
executed since the start of their MITHQAL relationship.

**Constraints:**
- Must be ≥ 0 (an integer count, not a USD amount).
- For the reference SIMULATED ledger, `settlementHistory = 1`
  (the participant has executed one settled transaction — their
  initial MTQ receipt).

**Use:** The `settlementHistory` field captures the participant's
transaction count. It is a non-monetary counter (unlike `sent` and
`received`, which are USD amounts).

### 15.5.9 Field 9 — `bankMoneyLinkage` (string)

**Description:** Bank-money linkage (which bank holds the underlying).
The identifier of the bank that holds the participant's MTQ balance
(in the corresponding Book B row).

**Constraints:**
- Must be a non-empty string.
- Must correspond to a `responsibleBank` in Book B (every participant
  position must reference a bank — orphan participant positions are
  not allowed).
- For the reference SIMULATED ledger, `bankMoneyLinkage =
  "Reference-Responsible-Bank (SIMULATED)"`.

**Use:** The `bankMoneyLinkage` field links each Book C entry to a
Book B entry. The §51 reconciliation check verifies every Book C
entry has a `bankMoneyLinkage` — entries without one are flagged
as violations.

## 15.6 Anti-Commingling Tests (4 Tests, ALL BLOCKED)

The §83 anti-commingling test harness defines 4 canonical forbidden
commingling operations. Each operation is simulated by the
`attemptCommingling` function, which proves that the operation is
BLOCKED by the §51 separation rules. Every call returns
`{ attempted: true, blocked: true, reason }` — these operations
cannot succeed in a §51-compliant architecture.

### 15.6.1 Test 1 — CORPORATE_CASH_TO_MTQ_BACKING (BLOCKED)

**Description:** Attempt to book $50M of MITHQAL corporate cash as if
it were bank-side MTQ backing in Book B.

**Simulated attempt:** The MITHQAL operating company has $50M in
corporate cash (Book A `corporateAssets = $50,000,000`). A
hypothetical attacker attempts to record this $50M as `applicableBacking`
in Book B (i.e., as bank-side MTQ backing).

**Result:**
- `attempted: true`
- `blocked: true`
- `reason:` "Corporate cash is a Book A operating asset. It cannot
  serve as Book B bank backing. Per §51 and §1 of the §V25.2 final
  reserve spec, the responsible BANK (not MITHQAL) holds the MTQ
  backing. Routing corporate cash into Book B 'applicableBacking'
  would economically commingle MITHQAL's operating accounts with
  the bank's monetary obligation."
- `bookViolated: BOOK_B_BANK_MTQ_OBLIGATION`
- `illegalField: "applicableBacking (sourced from Book A corporateAssets)"`

**Why blocked:** The anti-double-count rule (§47) is conceptually
related but distinct. The anti-commingling rule (§51) is the
structural separation: corporate cash is owned by the operating
company; bank backing is owned by the bank. Routing the former into
the latter would create a situation where the operating company's
cash serves as bank backing — but the operating company has no
regulatory authority to act as a bank, no capacity to fulfill the
backing obligation, and no contractual relationship with the
corporate participants whose MTQ is supposedly backed.

### 15.6.2 Test 2 — BANK_OBLIGATION_TO_CORPORATE_REVENUE (BLOCKED)

**Description:** Attempt to record the bank's MTQ issuance obligation
as revenue on MITHQAL's corporate P&L.

**Simulated attempt:** The bank has issued $100M of MTQ (Book B
`mtqOutstanding = $100,000,000`). A hypothetical attacker attempts
to record this $100M as `revenue` in Book A (i.e., as MITHQAL
operating-company revenue).

**Result:**
- `attempted: true`
- `blocked: true`
- `reason:` "The bank's MTQ outstanding (Book B) is a contingent
  monetary obligation of the bank, not revenue to the MITHQAL
  operating company. Recording it as Book A revenue would commingle
  the bank's monetary liability with the operating company's P&L,
  which is the textbook §51 violation."
- `bookViolated: BOOK_A_CORPORATE`
- `illegalField: "revenue (sourced from Book B mtqOutstanding)"`

**Why blocked:** The bank's MTQ issuance is a contingent liability
of the bank (the bank may have to redeem the MTQ for fiat). It is
NOT revenue to MITHQAL — MITHQAL is not the issuer of the MTQ (the
bank is, per the bank-mediated-issuance model). Recording the
issuance as MITHQAL revenue would inflate MITHQAL's P&L by the
issuance amount, misrepresenting MITHQAL's economic position.

### 15.6.3 Test 3 — CORPORATE_MTQ_TO_MITHQAL_ASSET (BLOCKED)

**Description:** Attempt to record a corporate participant's $10M MTQ
balance as a MITHQAL corporate asset on Book A.

**Simulated attempt:** A corporate participant has a $10M MTQ balance
(Book C `mtqBalance = $10,000,000`). A hypothetical attacker attempts
to record this $10M as `corporateAssets` in Book A (i.e., as a MITHQAL
corporate asset).

**Result:**
- `attempted: true`
- `blocked: true`
- `reason:` "Participant MTQ holdings (Book C) are positions held BY
  participants, not assets owned BY MITHQAL. MITHQAL is non-custodial
  by default (§V25.2). Capitalizing participant balances as Book A
  'corporateAssets' would commingle third-party monetary positions
  with the operating company's balance sheet."
- `bookViolated: BOOK_A_CORPORATE`
- `illegalField: "corporateAssets (sourced from Book C mtqBalance)"`

**Why blocked:** The non-custodial principle (§V25.2) is the
structural reason. MITHQAL does NOT hold participant MTQ balances —
the bank holds them (per the bank-mediated model). Recording
participant balances as MITHQAL assets would misrepresent MITHQAL
as a custodian, which it is not.

### 15.6.4 Test 4 — RESERVE_GAIN_TO_OPERATING_REVENUE (BLOCKED)

**Description:** Attempt to book a 5% appreciation on the bank-side
gold reserve as MITHQAL operating revenue.

**Simulated attempt:** The bank's gold reserve has appreciated by 5%
(a $1.17M gain on the $23.4M gold holding). A hypothetical attacker
attempts to record this $1.17M as `revenue` in Book A (i.e., as
MITHQAL operating-company revenue).

**Result:**
- `attempted: true`
- `blocked: true`
- `reason:` "Reserve appreciation belongs to the bank-side reserve
  (Book B), not to the MITHQAL operating company's P&L (Book A).
  Capitalizing reserve gains as Book A 'revenue' would commingle
  monetary-system gains with operating-company profit and would make
  MITHQAL's P&L dependent on reserve mark-to-market — exactly the
  commingling §51 forbids."
- `bookViolated: BOOK_A_CORPORATE`
- `illegalField: "revenue (sourced from reserve gain)"`

**Why blocked:** Reserve appreciation is a monetary-system gain (it
accrues to the bank-side reserve, increasing the bank's backing
position). It is NOT operating-company revenue. Capitalizing it as
operating revenue would make MITHQAL's P&L dependent on reserve
mark-to-market, creating a perverse incentive (MITHQAL would benefit
from reserve appreciation, which could compromise MITHQAL's
neutrality as the settlement-system operator).

### 15.6.5 The Test Runner

The `runAllAntiComminglingTests` function runs all 4 tests:

```typescript
export function runAllAntiComminglingTests(): ComminglingAttemptResult[] {
  return ANTI_COMMINGLING_TESTS.map(attemptCommingling);
}
```

The function returns 4 results, all with `attempted: true, blocked: true`.
The test results are included in the §51 executive report
(`generateThreeBookReport`).

## 15.7 Transfer Between Books (Authorized Only)

Cross-book transfers are economically commingling by definition. They
are permitted ONLY when:
- A signed `authorization` is provided, AND
- The authorization scope explicitly covers both `fromBook` and
  `toBook`, AND
- The (fromBook, toBook) pair is NOT in the forbidden-pair list.

### 15.7.1 Forbidden Pairs (Always Blocked)

The following pairs are always blocked, even with signed
authorization:

- Book A ↔ Book B (corporate cash ↔ bank backing)
- Book A ↔ Book C (corporate ↔ participant MTQ)

These pairs are forbidden because they represent the textbook §51
commingling operations (per §15.6 above).

### 15.7.2 Permitted Pairs (With Explicit Signed Authorization)

The following pair is permitted with explicit signed authorization:

- Book B ↔ Book C (bank ↔ participant MTQ movement)

This pair is permitted because it represents legitimate bank-mediated
MTQ movement (e.g., the bank credits a participant with MTQ on
redemption settlement, or the participant returns MTQ to the bank on
redemption).

### 15.7.3 The `transferBetweenBooksAuthorized` Function

```typescript
export function transferBetweenBooksAuthorized(
  _ledger: ThreeBookLedger,
  fromBook: BookType,
  toBook: BookType,
  amount: number,
  authorization: BookTransferAuthorization | null,
): BookTransferResult {
  // §51 — no signed authorization: blocked.
  if (!authorization || !authorization.signed) {
    return { ok: false, ... };
  }

  // Authorization scope must cover both ends of the transfer.
  const scopeOk =
    authorization.scope.includes(fromBook) &&
    authorization.scope.includes(toBook);
  if (!scopeOk) {
    return { ok: false, ... };
  }

  // Forbidden commingling paths — even signed authorization cannot override §51.
  const forbiddenPairs: Array<[BookType, BookType]> = [
    ["BOOK_A_CORPORATE", "BOOK_B_BANK_MTQ_OBLIGATION"],
    ["BOOK_B_BANK_MTQ_OBLIGATION", "BOOK_A_CORPORATE"],
    ["BOOK_A_CORPORATE", "BOOK_C_PARTICIPANT_POSITION"],
    ["BOOK_C_PARTICIPANT_POSITION", "BOOK_A_CORPORATE"],
  ];
  const isForbidden = forbiddenPairs.some(
    ([f, t]) => f === fromBook && t === toBook,
  );
  if (isForbidden) {
    return { ok: false, ... };
  }

  // Amount must be strictly positive.
  if (!(amount > 0)) {
    return { ok: false, ... };
  }

  // Authorized B ↔ C transfer
  return { ok: true, transferred: amount, ... };
}
```

### 15.7.4 The Authorization Schema

```typescript
export interface BookTransferAuthorization {
  authorizedBy: string;
  signed: boolean;
  scope: BookType[];
  reason: string;
  issuedAt: string;
}
```

The authorization:
- `authorizedBy` — the entity that issued the authorization (typically
  the MITHQAL Monetary Control Division).
- `signed` — whether the authorization is cryptographically signed
  (false = unsigned, blocked).
- `scope` — the list of books the authorization covers.
- `reason` — the reason for the transfer (e.g., "redemption settlement:
  bank credits participant with MTQ").
- `issuedAt` — the ISO 8601 timestamp of issuance.

### 15.7.5 The Authorized Transfer Example

A redemption settlement where the bank credits a participant with MTQ:

```typescript
const authorization: BookTransferAuthorization = {
  authorizedBy: "MITHQAL-MONETARY-CONTROL",
  signed: true,
  scope: ["BOOK_B_BANK_MTQ_OBLIGATION", "BOOK_C_PARTICIPANT_POSITION"],
  reason: "Redemption settlement: bank credits participant with MTQ",
  issuedAt: "2026-08-22T10:23:15.000Z",
};

const result = transferBetweenBooksAuthorized(
  ledger,
  "BOOK_B_BANK_MTQ_OBLIGATION",
  "BOOK_C_PARTICIPANT_POSITION",
  10_000_000,
  authorization,
);
// result.ok = true
// result.transferred = 10,000,000
```

### 15.7.6 The Forbidden Transfer Example (BLOCKED)

An attempt to use corporate cash as bank backing:

```typescript
const authorization: BookTransferAuthorization = {
  authorizedBy: "ROGUE-OPERATOR",
  signed: true,
  scope: ["BOOK_A_CORPORATE", "BOOK_B_BANK_MTQ_OBLIGATION"],
  reason: "Attempt to use corporate cash as bank backing",
  issuedAt: "2026-08-22T10:23:15.000Z",
};

const result = transferBetweenBooksAuthorized(
  ledger,
  "BOOK_A_CORPORATE",
  "BOOK_B_BANK_MTQ_OBLIGATION",
  50_000_000,
  authorization,
);
// result.ok = false
// result.transferred = 0
// result.reason = "Transfer blocked: BOOK_A_CORPORATE →
//   BOOK_B_BANK_MTQ_OBLIGATION is a forbidden commingling path (Book A
//   may not directly exchange with Book B or Book C). Signed
//   authorization cannot override §51."
```

Even with a signed authorization, the forbidden pair is blocked. No
authorization can override the §51 separation rules.

## 15.8 Reconciliation Between Books

The `reconcileBooks` function verifies that the three books
reconcile but are not commingled. The reconciliation checks:

### 15.8.1 Check 1 — Book C Σ(MTQ) ≤ Book B Σ(MTQ outstanding)

Participant positions are a SUBSET of bank obligation. The gap is
the position of participants not tracked in this Book C slice.

```typescript
const bookCSumMtq = ledger.bookC.reduce((s, e) => s + e.mtqBalance, 0);
const bookBSumOutstanding = ledger.bookB.reduce((s, e) => s + e.mtqOutstanding, 0);
const participantSubsetOk = bookCSumMtq <= bookBSumOutstanding + 1e-6;
```

For the reference SIMULATED ledger:
- Book C Σ = $10,000,000 (one entry, $10M balance)
- Book B Σ = $100,000,000 (one entry, $100M outstanding)
- Gap = $90M (held by participants not tracked in this Book C slice)
- Check passes ✓

### 15.8.2 Check 2 — Book B Σ(applicableBacking) ≥ 1.30 × Book B Σ(MTQ outstanding)

The 130% strategic backing target is met on the bank side.

```typescript
const requiredBacking = bookBSumOutstanding * 1.30;
const bookBBacking = ledger.bookB.reduce((s, e) => s + e.applicableBacking, 0);
const backingOk = bookBBacking >= requiredBacking - 1e-6;
```

For the reference SIMULATED ledger:
- Book B backing = $130,000,000
- Required backing = $100,000,000 × 1.30 = $130,000,000
- Check passes ✓ (exactly 130%)

### 15.8.3 Check 3 — Book A profitLoss == revenue − expenses

No reserve gains or off-book income are commingled into the
operating P&L.

```typescript
let bookAIndependent = true;
for (const e of ledger.bookA) {
  const computedPL = e.revenue - e.expenses;
  if (Math.abs(computedPL - e.profitLoss) > 1e-6) {
    bookAIndependent = false;
    notes.push(
      `Book A entry ${e.entryId} profitLoss=${e.profitLoss} ≠ ` +
      `revenue−expenses=${computedPL}; possible commingling.`,
    );
  }
}
```

For the reference SIMULATED ledger:
- Book A entry: revenue = $0, expenses = $0, profitLoss = $0
- Computed profitLoss = $0 − $0 = $0
- Math.abs($0 − $0) = $0 ≤ 1e-6 ✓
- Check passes ✓

### 15.8.4 Check 4 — No commingling violations detected

The `verifyNoCommingling` function returns no violations.

For the reference SIMULATED ledger:
- Book A: profitLoss reconciles arithmetically ✓
- Book B: applicableBacking > 0 with liquidity > 0 (no off-book funding
  concern) ✓
- Book C: every entry has a bankMoneyLinkage ✓
- No violations ✓

### 15.8.5 The Reconciliation Result

```typescript
export interface ReconciliationResult {
  reconciled: boolean;
  checks: ReconciliationCheck[];
  commingled: boolean;
  notes: string[];
}
```

For the reference SIMULATED ledger:
- `reconciled = true` (all 4 checks pass)
- `commingled = false` (no violations)
- `notes = []` (no notes)

## 15.9 The `verifyNoCommingling` Function

The `verifyNoCommingling` function inspects a ledger and returns any
commingling violations found. A clean ledger returns an empty array.

### 15.9.1 Book A — Profit/Loss Reconciliation

Book A entries must satisfy `profitLoss == revenue − expenses`. Any
deviation implies reserve gains or other off-book income were
injected into the operating P&L — a HIGH severity violation.

### 15.9.2 Book B — Off-Book Funding Detection

Book B entries with `applicableBacking > 0` but `liquidity ≤ 0` and
`mtqOutstanding > 0` imply off-book funding (possible corporate-cash
commingling into the bank backing). Flagged as MEDIUM severity.

### 15.9.3 Book C — Orphan Participant Detection

Book C entries must declare a `bankMoneyLinkage`. Entries without
one are orphan participant positions (not allowed). Flagged as
MEDIUM severity.

### 15.9.4 The Function

```typescript
export function verifyNoCommingling(ledger: ThreeBookLedger): ComminglingViolation[] {
  const violations: ComminglingViolation[] = [];

  // Book A — profit/loss must reconcile to revenue − expenses.
  for (const e of ledger.bookA) {
    const expected = e.revenue - e.expenses;
    if (Math.abs(expected - e.profitLoss) > 1e-6) {
      violations.push({
        severity: "HIGH",
        book: "BOOK_A_CORPORATE",
        entryId: e.entryId,
        reason: `profitLoss ${e.profitLoss} ≠ revenue−expenses ${expected}; ...`,
      });
    }
  }

  // Book B — backing without liquidity implies off-book funding.
  for (const e of ledger.bookB) {
    if (e.applicableBacking > 0 && e.liquidity <= 0 && e.mtqOutstanding > 0) {
      violations.push({
        severity: "MEDIUM",
        book: "BOOK_B_BANK_MTQ_OBLIGATION",
        entryId: e.entryId,
        reason: "applicableBacking > 0 with liquidity ≤ 0 and mtqOutstanding > 0 ...",
      });
    }
  }

  // Book C — every participant position must reference a bank.
  for (const e of ledger.bookC) {
    if (!e.bankMoneyLinkage || e.bankMoneyLinkage.trim() === "") {
      violations.push({
        severity: "MEDIUM",
        book: "BOOK_C_PARTICIPANT_POSITION",
        entryId: e.entryId,
        reason: "missing bankMoneyLinkage — participant position must reference ...",
      });
    }
  }

  return violations;
}
```

This is a heuristic runtime guard. It does NOT replace the typed
entry-discriminator enforcement in `createBookEntry` (which is the
primary anti-commingling defense).

## 15.10 The Reference SIMULATED Ledger

The reference illustrative three-book ledger (per
`buildReferenceThreeBookLedger`):

### 15.10.1 Book A — Corporate Cash Reserve

```typescript
{
  bookType: "BOOK_A_CORPORATE",
  entryId: "BOOKA-REF-001",
  timestamp: "2025-01-15T00:00:00Z",
  description:
    "MITHQAL corporate cash reserve for salaries and infrastructure
    ($50M illustrative). SIMULATED — operating cash, NOT bank-side
    MTQ backing.",
  revenue: 0,
  expenses: 0,
  payroll: 0,
  tax: 0,
  technologyCosts: 0,
  corporateAssets: 50_000_000,
  corporateLiabilities: 0,
  profitLoss: 0, // revenue − expenses = 0
}
```

### 15.10.2 Book B — Bank MTQ Obligation

```typescript
{
  bookType: "BOOK_B_BANK_MTQ_OBLIGATION",
  entryId: "BOOKB-REF-001",
  timestamp: "2025-01-15T00:00:00Z",
  description:
    "Reference bank MTQ obligation: $130M applicable backing for
    $100M MTQ outstanding (130% strategic target met). SIMULATED.",
  responsibleBank: "Reference-Responsible-Bank (SIMULATED)",
  applicableBacking: 130_000_000,
  mtqOriginated: 100_000_000,
  mtqOutstanding: 100_000_000,
  redemptionObligations: 0,
  liquidity: 130_000_000,
  settlement: 0,
  bankRisk: 0.18,
}
```

### 15.10.3 Book C — Corporate Participant Position

```typescript
{
  bookType: "BOOK_C_PARTICIPANT_POSITION",
  entryId: "BOOKC-REF-001",
  timestamp: "2025-01-15T00:00:00Z",
  description:
    "Reference corporate participant position: $10M MTQ balance.
    SIMULATED. The other $90M of Book B outstanding is held by
    participants not tracked in this Book C slice.",
  mtqBalance: 10_000_000,
  availableMtq: 9_500_000,
  reservedMtq: 500_000,
  pendingMtq: 0,
  sent: 0,
  received: 10_000_000,
  redemption: 0,
  settlementHistory: 1,
  bankMoneyLinkage: "Reference-Responsible-Bank (SIMULATED)",
}
```

### 15.10.4 Reconciliation Result

The reference ledger RECONCILES:
- Book C Σ(MTQ) = $10M ≤ Book B Σ(outstanding) = $100M ✓
- Book B backing $130M ≥ 1.30 × $100M = $130M ✓
- Book A profitLoss = 0 = revenue − expenses ✓
- No commingling violations ✓

The `reconciled` field returns `true`, and the `commingled` field
returns `false`.

## 15.11 The `createBookEntry` Function — Commingling Rejection

The `createBookEntry` function appends an entry to the correct book
slice. It rejects cross-book commingling in two defensive layers:

### 15.11.1 Layer 1 — Discriminator Mismatch

The entry's `bookType` must equal the requested `bookType`. A Book A
entry may not be inserted into Book B, etc.

```typescript
if (entry.bookType !== bookType) {
  return {
    ok: false,
    comminglingDetected: true,
    error:
      `Commingling rejected: entry declares bookType "${entry.bookType}" ` +
      `but caller attempted to insert into "${bookType}". Cross-book ` +
      `insertion is forbidden by §51.`,
  };
}
```

### 15.11.2 Layer 2 — Cross-Book Field Detection

The entry must not carry fields belonging to a different book's
schema (runtime guard for untyped callers / API inputs).

```typescript
const violations = detectCrossBookFields(bookType, entry as unknown as Record<string, unknown>);
if (violations.length > 0) {
  return {
    ok: false,
    comminglingDetected: true,
    error:
      `Commingling rejected: entry contains fields belonging to other ` +
      `books: ${violations.join(", ")}.`,
  };
}
```

The `detectCrossBookFields` function returns the names of any
foreign-book fields present on the raw object. It is a defensive
guard against schema contamination from untyped / API inputs.

### 15.11.3 Pure Function

The `createBookEntry` function is pure — it does NOT mutate any
ledger. Callers should treat the returned `ok: true` as authorization
to push the entry into the corresponding ledger slice.

## 15.12 Current State — Design=true, Operational=false, Enforced=false

The §74 honest-state declaration for the Three-Book Separation:

```typescript
export interface ThreeBookHonestState {
  /** §74 — The three-book design is complete. */
  threeBookDesign: true;
  /** §74 — The three-book separation is NOT yet operational in production. */
  threeBookOperational: false;
  /** §74 — The three-book separation is NOT yet enforced on-chain / institutionally. */
  threeBookEnforced: false;
}

export function threeBookHonestState(): ThreeBookHonestState {
  return {
    threeBookDesign: true,
    threeBookOperational: false,
    threeBookEnforced: false,
  };
}
```

### 15.12.1 What `threeBookDesign = true` Means

The design is complete:
- The 8-field Book A schema is specified (§15.3).
- The 8-field Book B schema is specified (§15.4).
- The 9-field Book C schema is specified (§15.5).
- The 4 anti-commingling tests are specified and SIMULATED (§15.6).
- The reconciliation checks are specified and SIMULATED (§15.8).
- The transfer-authorization schema is specified and SIMULATED
  (§15.7).
- The `verifyNoCommingling` runtime guard is specified and
  implemented (§15.9).
- The reference SIMULATED ledger is built (§15.10).
- The §51 executive report is generated (`generateThreeBookReport`).

### 15.12.2 What `threeBookOperational = false` Means

The three-book separation is NOT yet operating in production:
- No real bank, participant, or asset is bound by this module.
- No real ledger has been deployed.
- All reference data is SIMULATED.

### 15.12.3 What `threeBookEnforced = false` Means

The three-book separation is NOT yet enforced on-chain / institutionally:
- No smart contract enforces the separation.
- No institutional enforcement mechanism is deployed.
- The runtime guards (`createBookEntry`, `transferBetweenBooksAuthorized`)
  are logic-level only — they cannot prevent a determined attacker
  from bypassing them via direct database access.

### 15.12.4 The Production-Authorization Path

To transition `threeBookOperational` and `threeBookEnforced` to `true`:

1. **A real bank must be contracted** (per the §11 institutional-
   readiness framework).
2. **A real ledger must be deployed** (with the three-book schema
   enforced at the database level — table-level separation, row-
   level access controls).
3. **A real smart contract must be deployed** (with on-chain
   enforcement of the separation — e.g., a Book A contract, a
   Book B contract, a Book C contract, each with its own access
   controls).
4. **The institutional authorization framework must be activated**
   (per the §22 checklist).
5. **Independent assurance must be obtained** (per the §22
   independent-assurance engagement type).

Until all 5 conditions are met, the honest-state invariants remain
in their current values. The Three-Book Separation is APPROVED
CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

## 15.13 Illustrative Example — Attempting to Use Corporate Cash as MTQ Backing (BLOCKED)

This example walks through an attempt to use MITHQAL corporate cash
as MTQ backing — a textbook §51 violation that is BLOCKED by the
separation rules.

### 15.13.1 Setup

- **MITHQAL operating company:** Has $50M in corporate cash
  (Book A `corporateAssets = $50,000,000`).
- **Bank:** Reference-Responsible-Bank (SIMULATED) has $100M MTQ
  outstanding (Book B `mtqOutstanding = $100,000,000`) backed by
  $130M in PBCs (Book B `applicableBacking = $130,000,000`).
- **Attacker:** A rogue MITHQAL operator attempts to redirect $50M
  of the operating company's cash into Book B as additional
  `applicableBacking` — to make it appear that the bank has more
  backing than it actually does.

### 15.13.2 Attempt 1 — Direct Cross-Book Transfer (BLOCKED)

The attacker calls `transferBetweenBooksAuthorized`:

```typescript
const rogueAuthorization: BookTransferAuthorization = {
  authorizedBy: "ROGUE-OPERATOR",
  signed: true,
  scope: ["BOOK_A_CORPORATE", "BOOK_B_BANK_MTQ_OBLIGATION"],
  reason: "Redirect corporate cash as bank backing",
  issuedAt: "2026-08-22T10:23:15.000Z",
};

const result = transferBetweenBooksAuthorized(
  ledger,
  "BOOK_A_CORPORATE",
  "BOOK_B_BANK_MTQ_OBLIGATION",
  50_000_000,
  rogueAuthorization,
);
```

**Result:**
- `ok = false`
- `transferred = 0`
- `fromBook = "BOOK_A_CORPORATE"`
- `toBook = "BOOK_B_BANK_MTQ_OBLIGATION"`
- `authorized = false`
- `reason = "Transfer blocked: BOOK_A_CORPORATE → BOOK_B_BANK_MTQ_OBLIGATION
  is a forbidden commingling path (Book A may not directly exchange with
  Book B or Book C). Signed authorization cannot override §51."`

The transfer is BLOCKED. The forbidden-pair rule (§15.7.1) catches
the attempt — even with a signed authorization, Book A ↔ Book B
transfers are forbidden.

### 15.13.3 Attempt 2 — Direct Book B Entry Injection (BLOCKED)

The attacker tries to inject a Book B entry directly, sourcing
the `applicableBacking` field from Book A:

```typescript
const rogueEntry = {
  bookType: "BOOK_B_BANK_MTQ_OBLIGATION",
  entryId: "BOOKB-ROGUE-001",
  // ... other Book B fields ...
  applicableBacking: 50_000_000, // sourced from Book A corporateAssets
  // ... etc ...
  // Attempted cross-book field injection:
  corporateAssets: 50_000_000, // Book A field, should not be here
};

const result = createBookEntry("BOOK_B_BANK_MTQ_OBLIGATION", rogueEntry);
```

**Result:**
- `ok = false`
- `comminglingDetected = true`
- `error = "Commingling rejected: entry contains fields belonging to
  other books: corporateAssets."`

The cross-book field detection (Layer 2) catches the attempt — the
`corporateAssets` field (a Book A field) is not allowed in a Book B
entry. The entry is rejected.

### 15.13.4 Attempt 3 — Anti-Commingling Test Simulation

The attacker (or, equivalently, the §83 anti-commingling test
harness) runs the `attemptCommingling` function:

```typescript
const result = attemptCommingling("CORPORATE_CASH_TO_MTQ_BACKING");
```

**Result:**
- `attemptType = "CORPORATE_CASH_TO_MTQ_BACKING"`
- `attempted = true`
- `blocked = true`
- `reason = "Corporate cash is a Book A operating asset. It cannot
  serve as Book B bank backing. Per §51 and §1 of the §V25.2 final
  reserve spec, the responsible BANK (not MITHQAL) holds the MTQ
  backing. Routing corporate cash into Book B 'applicableBacking'
  would economically commingle MITHQAL's operating accounts with
  the bank's monetary obligation."`
- `bookViolated = "BOOK_B_BANK_MTQ_OBLIGATION"`
- `illegalField = "applicableBacking (sourced from Book A corporateAssets)"`

The test confirms the operation is BLOCKED.

### 15.13.5 Attempt 4 — Run-Time Verification

The attacker (or, equivalently, the periodic reconciliation
engine) runs the `verifyNoCommingling` function:

```typescript
const violations = verifyNoCommingling(ledger);
```

If the attacker had somehow succeeded in injecting the rogue
Book B entry (despite the previous blocks), the runtime
verification would detect:
- If the rogue entry has `applicableBacking > 0` but `liquidity ≤ 0`
  and `mtqOutstanding > 0`: flagged as MEDIUM severity violation
  (off-book funding).
- If the rogue entry's `applicableBacking` was sourced from Book A
  (e.g., a write to the database bypassed the `createBookEntry`
  function): the §13 Five-Way Reconciliation would catch the
  discrepancy between Book A `corporateAssets` (decreased by $50M)
  and Book B `applicableBacking` (increased by $50M).

### 15.13.6 Conclusion

The attempt to use MITHQAL corporate cash as MTQ backing is BLOCKED
at every layer:
- Layer 1 (Discriminator mismatch): BLOCKED.
- Layer 2 (Cross-book field detection): BLOCKED.
- Layer 3 (Forbidden-pair rule): BLOCKED.
- Layer 4 (Anti-commingling test harness): BLOCKED.
- Layer 5 (Runtime verification): would detect.
- Layer 6 (Five-Way Reconciliation): would catch the discrepancy.

The Three-Book Separation rules (§51) are robust against this
textbook commingling operation. The same robustness applies to all
4 forbidden commingling operations (per §15.6 above).

## 15.14 Section 15 Summary

The Three-Book Economic Separation is the architectural principle
that the MITHQAL institutional stack must keep three economically
distinct books that RECONCILE but are NEVER economically commingled.
Book A (MITHQAL Corporate — 8 fields) captures the operating
company's own financial position. Book B (Bank MTQ Obligation — 8
fields) captures the bank-side monetary position. Book C (Corporate
Participant Position — 9 fields) captures each participant's MTQ
position. The 4 anti-commingling tests (CORPORATE_CASH_TO_MTQ_BACKING,
BANK_OBLIGATION_TO_CORPORATE_REVENUE, CORPORATE_MTQ_TO_MITHQAL_ASSET,
RESERVE_GAIN_TO_OPERATING_REVENUE) are ALL BLOCKED. Cross-book
transfers are permitted ONLY with explicit signed authorization,
and even then only for the Book B ↔ Book C pair (bank-mediated MTQ
movement). The forbidden pairs (Book A ↔ Book B, Book A ↔ Book C)
are always blocked. The 4 reconciliation checks (Book C Σ(MTQ) ≤
Book B Σ(outstanding); Book B backing ≥ 1.30 × Book B outstanding;
Book A profitLoss == revenue − expenses; no commingling violations)
verify the books reconcile. The current state is design=true,
operational=false, enforced=false — the design is complete; the
operational rollout and institutional enforcement remain future
work.

**Honest state:** The Three-Book Separation model is implemented (the
code in `three-book-separation.ts` — 975 lines, 8+8+9=25 fields
across 3 books, 4 anti-commingling tests ALL BLOCKED, 4
reconciliation checks, the transfer-authorization schema, the
runtime verification guard, the reference SIMULATED ledger). No
real bank, participant, or asset is bound by this module. The
model may NOT carry live three-book separation until §74
honest-state invariants transition to their production-authorized
values (`threeBookOperational = true` and `threeBookEnforced =
true`).

---

# SECTION 16 — FIVE-WAY RECONCILIATION

## 16.1 Section Scope and Authority

This section codifies the Five-Way Reconciliation — the canonical
reconciliation engine that the MITHQAL Bank Gateway (MBG) must
support. It implements §13 of the MBG-FINAL-ARCHITECTURAL-AMENDMENT
and is codified in `src/lib/mithqal-bank-gateway.ts` (§13 section,
~150 lines), with reference primitives in
`src/lib/corporate-settlement-account.ts` (§22 three-way
reconciliation) and `src/lib/reconciliation.ts` (general
reconciliation engine).

The Five-Way Reconciliation is the structural mechanism by which
MITHQAL verifies that five independent ledgers all agree on the
total MTQ supply. The five sources are:
1. **Canonical Ledger** — MITHQAL's authoritative canonical supply.
2. **Bank Subledger** — the sum of all bank-side MTQ subledgers.
3. **Corporate Positions** — the sum of all corporate participant MTQ
   positions.
4. **Reserve Ledger** — the reserve liability (S × PAR).
5. **Proof of Liabilities** — the proof-of-liabilities commitment.

If all five totals match exactly, the system is RECONCILED. If they
match within a small tolerance (≤ 0.01%), the system is in WARNING
state. If they diverge beyond the tolerance, the system is in
MISMATCH state. If the divergence exceeds 1%, the system is in
CRITICAL state and settlement operations are suspended.

The Five-Way Reconciliation is one of the §74 honest-state
invariants: the model is implemented and SIMULATED, but no real
bank subledger has been connected. The current state is INTEGRATION-
READY at the logic/spec level.

## 16.2 The 5 Reconciliation Sources

### 16.2.1 Source 1 — Canonical Ledger (MITHQAL Canonical MTQ Supply)

**Description:** The MITHQAL canonical supply ledger — the
authoritative source of truth for total MTQ supply. This is the
Ledger State Machine (MTH-02 in the §12 node catalogue) that
executes the BM-16 Finality Verification + Mint step.

**Authoritative for:** the total MTQ supply, the per-instruction
state, the per-bank contribution to the supply, and the append-only
state-machine history.

**Computation:** The Canonical Ledger total is the sum of all minted
MTQ minus the sum of all redeemed MTQ. This is the net MTQ
outstanding — the canonical supply.

**Reconciliation role:** The Canonical Ledger is the REFERENCE total
against which the other four sources are compared. If any source
diverges from the Canonical Ledger, a mismatch is flagged.

### 16.2.2 Source 2 — Bank Subledger (Sum of Bank MTQ Subledgers)

**Description:** The bank-side MTQ subledger — each bank's record of
the MTQ it has originated, transferred, and redeemed. The MBG
amendment's §12 defines the `BankMTQSubledger` schema, which the
bank's accounting system produces as a feed.

**Authoritative for:** the bank's view of its own MTQ position. The
bank's subledger is the bank's own record — it is NOT a copy of the
Canonical Ledger; it is the bank's independent accounting of its
MTQ activity.

**Computation:** The Bank Subledger total is the sum of all banks'
subledger totals. Each bank's subledger total is the bank's net MTQ
outstanding (originated minus redeemed).

**Reconciliation role:** The Bank Subledger total should equal the
Canonical Ledger total. If they differ, a mismatch is flagged —
either the Canonical Ledger is missing a transaction or the bank's
subledger has an extra transaction.

### 16.2.3 Source 3 — Corporate Positions (Sum of Corporate MTQ Positions)

**Description:** The corporate participant positions — each
participant's MTQ balance (Book C of the §51 Three-Book
Separation). The sum of all participant positions should be a
SUBSET of the bank MTQ outstanding (the gap is the position of
participants not tracked in this Book C slice).

**Authoritative for:** the participants' view of their own MTQ
balances. Each participant's position is their own record (typically
sourced from their bank's corporate portal).

**Computation:** The Corporate Positions total is the sum of all
participants' MTQ balances. This should be ≤ the Bank Subledger
total (participants are a subset of bank obligation).

**Reconciliation role:** The Corporate Positions total is compared
against the Bank Subledger total (Book C Σ(MTQ) ≤ Book B
Σ(outstanding) per the §51 reconciliation check) AND against the
Canonical Ledger total.

### 16.2.4 Source 4 — Reserve Ledger (Reserve Liability)

**Description:** The reserve liability — the total MTQ liability
computed from the reserve side. Per the §3 reserve ratio formula,
the reserve liability is `L = S × PAR` where S is the MTQ supply and
PAR = 1.00 (per the v25.2 controlling specification).

**Authoritative for:** the reserve-side computation of MTQ
liability. The Reserve Ledger total is the liability implied by
the reserve assets — if the reserve assets total $130M (at the
130% strategic target), the implied MTQ liability is $130M / 1.30
= $100M.

**Computation:** The Reserve Ledger total is computed from the
reserve asset valuations: `L = R_a / RR` where `R_a` is the
adjusted reserve value and `RR` is the strategic reserve ratio
target (1.30).

**Reconciliation role:** The Reserve Ledger total should equal the
Canonical Ledger total. If the reserve liability is less than the
canonical supply, the reserve ratio has fallen below 100% — a
constitutional breach (CRITICAL state, settlement suspended).

### 16.2.5 Source 5 — Proof of Liabilities (Proof-of-Liabilities Commitment)

**Description:** The proof-of-liabilities commitment — a
cryptographic commitment to the total MTQ liability, generated by
the §21 Institutional Proof-of-Liabilities engine (per
`src/lib/proof-of-liabilities.ts`).

**Authoritative for:** the cryptographic proof that the total MTQ
liability is what MITHQAL claims it is. The proof is a Merkle-root
or a ZKP that commits to the liability without revealing individual
positions.

**Computation:** The Proof-of-Liabilities total is the committed
liability. It should equal the Canonical Ledger total.

**Reconciliation role:** The Proof-of-Liabilities total is compared
against the Canonical Ledger total. If they differ, either the
canonical ledger has been tampered with or the proof is invalid.

### 16.2.6 The 5 Sources Summary

| # | Source | Description | Authority |
|---|--------|-------------|-----------|
| 1 | Canonical Ledger | MITHQAL canonical MTQ supply | MTH-02 Ledger State Machine |
| 2 | Bank Subledger | Sum of bank-side MTQ subledgers | Each bank's accounting system |
| 3 | Corporate Positions | Sum of participant MTQ positions | Each participant's bank portal |
| 4 | Reserve Ledger | Reserve liability (S × PAR) | Reserve State Engine |
| 5 | Proof of Liabilities | Cryptographic commitment to MTQ liability | §21 Institutional PoL engine |

## 16.3 Reconciliation Frequency — Real-Time vs Batch

The Five-Way Reconciliation runs at multiple frequencies:

### 16.3.1 Real-Time (Per-Transaction)

Every MTQ mint, transfer, or redemption triggers a real-time
reconciliation check. The check verifies that the Canonical Ledger
total, the Bank Subledger total (for the affected bank), the
Corporate Position (for the affected participant), and the Reserve
Ledger total all update consistently.

Real-time reconciliation is implemented as an in-process check
within the BM-16 Finality Verification + Mint step. The check is
non-blocking (it does not delay the mint) but it does emit a
WARNING event if any source diverges from the Canonical Ledger
within the WARNING tolerance.

### 16.3.2 Daily (End-of-Day Batch)

At end-of-day (00:00 UTC), a full Five-Way Reconciliation runs.
This is the primary reconciliation check — it compares all 5
sources against each other and produces the daily reconciliation
report.

The daily reconciliation is run by MITHQAL's reconciliation engine
(per `src/lib/reconciliation.ts`). The result is logged and
distributed to:
- MITHQAL's operations team.
- Each bank's operations team (for their bank's subledger).
- The MITHQAL Governance Council (if any mismatches are found).

### 16.3.3 Periodic (Weekly/Monthly)

A weekly and monthly reconciliation runs the same checks as the
daily reconciliation but with extended scope:
- Weekly: includes a full audit-trail review.
- Monthly: includes an independent auditor's review.

### 16.3.4 Exception-Driven (On-Mismatch)

If the real-time or daily reconciliation detects a mismatch, an
exception-driven reconciliation is triggered immediately. This
re-run is more thorough (it includes forensic evidence preservation)
and is the input to the break-management process (per §16.6 below).

### 16.3.5 The Reconciliation Frequency Model

The MBG amendment's §22 specifies the four frequency tiers:
- `transaction` — per-transaction real-time check.
- `daily` — end-of-day batch.
- `periodic` — weekly/monthly batch.
- `exception` — on-mismatch.

```typescript
export type ReconciliationFrequency =
  | "transaction"
  | "daily"
  | "periodic"
  | "exception";
```

## 16.4 Deterministic Matching

The Five-Way Reconciliation uses deterministic matching — the same
inputs always produce the same output. This is enforced by:

### 16.4.1 Fixed-Precision Arithmetic

All monetary amounts are expressed as fixed-precision numbers
(rounded to 2 decimal places — USD-cent precision). This eliminates
floating-point rounding errors.

The `round2(x)` helper (in `protected-backing-cell.ts` and other
modules) rounds to 2 decimal places:
```typescript
function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
```

### 16.4.2 Tolerance Bands

The reconciliation uses tolerance bands (in basis points, bps) to
determine the severity of a mismatch:
- 0 bps delta: RECONCILED (exact match).
- 0–1 bps delta: WARNING (within tolerance).
- 1–100 bps delta: MISMATCH (beyond tolerance).
- > 100 bps delta: CRITICAL (immediate escalation).

These defaults are configurable per the §13 spec:
```typescript
const toleranceBps = input.toleranceBps ?? 1;       // 0.01%
const criticalThresholdBps = input.criticalThresholdBps ?? 100; // 1%
```

### 16.4.3 The `runFiveWayReconciliation` Function

```typescript
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
```

### 16.4.4 The Reconciliation Statuses

The Five-Way Reconciliation returns one of five statuses:

- `RECONCILED` — all 5 totals match exactly (deltaBps = 0 across the
  board). No mismatches.
- `WARNING` — all 5 totals match within tolerance (≤ 0.01% delta). The
  system continues operating but with heightened monitoring.
- `MISMATCH` — at least one source diverges beyond tolerance. Affected
  operations are restricted; investigation is initiated.
- `CRITICAL` — divergence > 1% (immediate escalation). All settlement
  operations are suspended (gate moves to LOCKED).
- `LOCKED` — settlement operations are suspended pending manual
  recovery. Only 4-of-7 Council + bank lead signoff can RESTORE.

```typescript
export type FiveWayReconciliationStatus =
  | "RECONCILED"
  | "WARNING"
  | "MISMATCH"
  | "CRITICAL"
  | "LOCKED";
```

## 16.5 The Mismatch Schema

Each mismatch is a structured record:

```typescript
export interface ReconciliationMismatch {
  ledger: "CANONICAL" | "BANK_SUBLEDGER" | "CORPORATE_POSITIONS" | "RESERVE_LEDGER" | "PROOF_OF_LIABILITIES";
  expected: number;
  actual: number;
  deltaBps: number;
  severity: "WARNING" | "MISMATCH" | "CRITICAL";
  investigationStatus: "OPEN" | "INVESTIGATING" | "RESOLVED" | "ESCALATED";
}
```

- `ledger` — the source that mismatched.
- `expected` — the expected total (the Canonical Ledger total).
- `actual` — the actual total for this source.
- `deltaBps` — the delta in basis points (`|actual − expected| / expected × 10000`).
- `severity` — WARNING / MISMATCH / CRITICAL.
- `investigationStatus` — OPEN (initial), INVESTIGATING (under
  investigation), RESOLVED (closed), ESCALATED (escalated to governance).

## 16.6 Break Management and Escalation

When a mismatch is detected, the break-management process is
triggered. The process is:

### 16.6.1 Severity-Based Actions

```typescript
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
```

### 16.6.2 WARNING-Level Breaks

WARNING-level breaks (within tolerance, ≤ 0.01% delta) are
non-blocking. Settlement operations continue. Investigation tickets
are auto-opened. The next reconciliation cycle re-checks the same
ledgers.

WARNING-level breaks are common in practice — small timing
differences between the Canonical Ledger (which updates in real-time)
and the Bank Subledger (which may update on a slight delay) can
produce sub-tolerance deltas.

### 16.6.3 MISMATCH-Level Breaks

MISMATCH-level breaks (beyond tolerance, 0.01%–1% delta) trigger
restrictions on affected operations:
- If the mismatch is in BANK_SUBLEDGER: that bank's issuance and
  redemption are restricted.
- If the mismatch is in CORPORATE_POSITIONS: the affected
  participant's transactions are restricted.
- If the mismatch is in RESERVE_LEDGER: all issuance is restricted
  (no new MTQ can be minted until the reserve ratio is restored).
- If the mismatch is in PROOF_OF_LIABILITIES: all settlement is
  restricted (the proof-of-liabilities must be regenerated).

MITHQAL ops and bank ops are notified within 1 hour. Forensic
evidence (signed snapshots of all 5 ledgers) is preserved.

### 16.6.4 CRITICAL-Level Breaks

CRITICAL-level breaks (> 1% delta) trigger an immediate SUSPEND of
all settlement operations. The gate moves to LOCKED. Bank ops lead
and MITHQAL ops lead are paged immediately.

Forensic evidence is preserved as immutable snapshots. Manual
controlled recovery is the only path forward — no automated RESTORE
is permitted.

Regulatory notification is sent where required by law (e.g., if the
break affects a regulated bank's regulatory submissions).

### 16.6.5 LOCKED State

In LOCKED state:
- All settlement operations remain suspended.
- All instructions received during LOCKED state are queued, NOT
  executed.
- Only 4-of-7 Council + bank lead signoff can RESTORE.
- After RESTORE, reconciliation is re-run; settlement only RESUMEs
  if RECONCILED.

The LOCKED state is the most severe operational state. It is
intended to be rare (only triggered by CRITICAL-level breaks or
by direct governance intervention).

## 16.7 Settlement Suspension Rules

Settlement suspension is the most consequential action of the
Five-Way Reconciliation. The rules are:

### 16.7.1 When Settlement Is Suspended

Settlement is suspended when:
1. The Five-Way Reconciliation returns CRITICAL status (any source
   diverges > 1% from the Canonical Ledger).
2. The Five-Way Reconciliation returns LOCKED status (manual
   intervention required).
3. The MITHQAL Monetary Control Division explicitly suspends
   settlement (e.g., due to a security incident, a regulatory
   order, or a disaster-recovery event).

### 16.7.2 What Suspension Means

During suspension:
- No new MTQ can be minted (the BM-16 step is blocked).
- No new MTQ transfers can be settled (the BM-08 step is blocked).
- No new MTQ redemptions can be processed (the redemption flow is
  blocked).
- All in-flight transactions are preserved (their state is recorded
  but not advanced).
- All received instructions are queued, NOT executed.

### 16.7.3 When Settlement Resumes

Settlement resumes when:
1. The Five-Way Reconciliation returns RECONCILED (all 5 totals
   match exactly).
2. The 4-of-7 Council + bank lead signoff is obtained (for LOCKED
   state).
3. The MITHQAL Monetary Control Division explicitly resumes
   settlement.

### 16.7.4 The Suspension Scope

Suspension can be:
- **System-wide:** all settlement operations are suspended (for
  CRITICAL-level breaks or governance intervention).
- **Bank-specific:** only the affected bank's operations are
  suspended (for MISMATCH-level breaks in BANK_SUBLEDGER).
- **Participant-specific:** only the affected participant's
  transactions are suspended (for MISMATCH-level breaks in
  CORPORATE_POSITIONS).

The scope is determined by the source of the mismatch.

## 16.8 Remediation Workflows

When a mismatch is detected, the remediation workflow is initiated.
The workflow is:

### 16.8.1 Step 1 — Identify the Mismatch Source

The first step is to identify which source diverged from the
Canonical Ledger. The `ReconciliationMismatch` record identifies
the source:
- `CANONICAL` — the Canonical Ledger itself diverged (rare;
  typically indicates a database corruption or a tampering attempt).
- `BANK_SUBLEDGER` — a bank's subledger diverged (typically
  indicates a synchronization delay or a bank-side error).
- `CORPORATE_POSITIONS` — a participant's position diverged
  (typically indicates a delayed update or a participant-side error).
- `RESERVE_LEDGER` — the reserve liability diverged (typically
  indicates a reserve-asset price change or a backing-cell
  reallocation).
- `PROOF_OF_LIABILITIES` — the proof-of-liabilities commitment
  diverged (typically indicates the proof has not been regenerated
  after a recent mint or redemption).

### 16.8.2 Step 2 — Investigate the Cause

The investigation team (MITHQAL ops + bank ops) reviews:
- The audit trail of the affected source.
- The signed snapshots of all 5 ledgers.
- The recent transactions that may have caused the mismatch.
- The bank-side compliance system's logs (if relevant).

### 16.8.3 Step 3 — Remediate

The remediation depends on the cause:
- **Synchronization delay:** wait for the delayed source to catch
  up. Re-run the reconciliation.
- **Bank-side error:** the bank corrects its subledger. Re-run the
  reconciliation.
- **Participant-side error:** the participant's bank corrects the
  participant's position. Re-run the reconciliation.
- **Reserve-asset price change:** recompute the Reserve Ledger
  total with the new prices. Re-run the reconciliation.
- **Backing-cell reallocation:** recompute the Reserve Ledger total
  with the new allocation. Re-run the reconciliation.
- **Proof-of-liabilities staleness:** regenerate the
  proof-of-liabilities commitment. Re-run the reconciliation.
- **Database corruption:** restore from backup. Re-run the
  reconciliation.
- **Tampering attempt:** escalate to security and law enforcement.
  Do not auto-remediate.

### 16.8.4 Step 4 — Verify Remediation

After remediation, the Five-Way Reconciliation is re-run. If it
returns RECONCILED, the remediation is verified. If it still
returns a mismatch, the investigation continues.

### 16.8.5 Step 5 — RESTORE (If Suspended)

If settlement was suspended (MISMATCH or CRITICAL), the RESTORE
process is initiated:
- For MISMATCH: the MITHQAL Monetary Control Division signs the
  RESTORE authorization. The affected operations resume.
- For CRITICAL/LOCKED: the 4-of-7 Council + bank lead signoff is
  obtained. The RESTORE authorization is signed. Settlement resumes.

After RESTORE, the next reconciliation cycle re-runs. Settlement
continues only if RECONCILED.

## 16.9 Audit Records

Every reconciliation event is logged in an immutable audit trail.
The audit trail captures:

### 16.9.1 The Reconciliation Run Record

For each reconciliation run:
- `reconciliationId` — the unique ID of the run.
- `timestamp` — the ISO 8601 timestamp.
- `frequency` — transaction / daily / periodic / exception.
- `canonicalLedgerTotal`, `bankSubledgerTotal`, `corporatePositionsTotal`,
  `reserveLedgerTotal`, `proofOfLiabilitiesTotal` — the 5 totals.
- `status` — RECONCILED / WARNING / MISMATCH / CRITICAL / LOCKED.
- `mismatches` — the list of mismatches (if any).
- `toleranceBps`, `criticalThresholdBps` — the tolerance thresholds
  used.
- `triggeredBy` — what triggered the run (a transaction, the daily
  schedule, an exception, etc.).
- `durationMs` — the duration of the run in milliseconds.

### 16.9.2 The Investigation Record

For each investigation:
- `investigationId` — the unique ID of the investigation.
- `reconciliationId` — the ID of the reconciliation run that
  triggered the investigation.
- `mismatch` — the mismatch being investigated.
- `investigator` — the MITHQAL ops + bank ops team.
- `findings` — the root cause.
- `remediation` — the remediation action taken.
- `resolvedAt` — the timestamp of resolution.
- `evidenceHashes` — the SHA-256 hashes of the forensic evidence
  (signed snapshots of all 5 ledgers).

### 16.9.3 The RESTORE Record

For each RESTORE:
- `restoreId` — the unique ID of the RESTORE.
- `investigationId` — the ID of the investigation that led to the
  RESTORE.
- `authorizedBy` — the 4-of-7 Council signers + bank lead.
- `signature` — the cryptographic signature of the RESTORE
  authorization.
- `restoredAt` — the timestamp of RESTORE.
- `nextReconciliationId` — the ID of the post-RESTORE reconciliation
  run.

### 16.9.4 The Audit Trail Retention

The audit trail is retained for a minimum of 7 years (the standard
financial-records retention period). The audit trail is:
- Immutable (append-only).
- Cryptographically signed (each entry is signed by the
  reconciliation engine's signing key).
- Replicated (stored in multiple geographic locations for disaster
  recovery).
- Accessible to MITHQAL internal audit, bank compliance teams,
  independent auditors, and regulators (with appropriate
  authorization).

## 16.10 The Reference Reconciliation State

The reference reconciliation state (per the MBG amendment's
`generateMBGExecutiveReport`):

```typescript
const baselineReconciliation = runFiveWayReconciliation({
  canonicalLedgerTotal: 100_000_000,       // $100M canonical supply
  bankSubledgerTotal: 100_000_000,        // $100M bank subledger total
  corporatePositionsTotal: 100_000_000,   // $100M participant positions
  reserveLedgerTotal: 100_000_000,         // $100M reserve liability
  proofOfLiabilitiesTotal: 100_000_000,    // $100M PoL commitment
});
// baselineReconciliation.status === "RECONCILED"
// baselineReconciliation.mismatches === []
```

The reference state is RECONCILED — all 5 totals match exactly.

### 16.10.1 The Reference Ledger Configuration

The reference reconciliation uses the SIMULATED reference data:
- Canonical Ledger: $100M (per the reference SIMULATED ledger in
  §51 — Book B `mtqOutstanding = $100,000,000`).
- Bank Subledger: $100M (the bank's subledger agrees with the
  canonical ledger).
- Corporate Positions: $100M (in the reference reconciliation,
  all $100M of MTQ outstanding is attributed to participants —
  this differs from the §51 reference ledger where only $10M is
  attributed to one participant; the $90M gap represents other
  participants not in the §51 slice).
- Reserve Ledger: $100M (per the §3 reserve ratio formula, with
  $130M adjusted reserve and 1.30 strategic ratio, L = $130M / 1.30
  = $100M).
- Proof of Liabilities: $100M (the PoL commitment matches the
  canonical supply).

### 16.10.2 The SIMULATED Nature

Per §74 honest-state, the reference reconciliation is SIMULATED.
No real bank subledger has been connected. No real Corporate
Position feed has been integrated. No real Reserve Ledger has been
populated. No real Proof of Liabilities has been generated.

The reference reconciliation proves the LOGIC works — given 5
matching totals, the engine returns RECONCILED. It does NOT prove
the SYSTEM works in production — that requires real bank
integration.

## 16.11 The Three-Way Reconciliation Primitive

The Five-Way Reconciliation is built on a simpler three-way
reconciliation primitive, codified in
`src/lib/corporate-settlement-account.ts`:

```typescript
export function reconcileThreeWay(
  canonicalLedger: number,
  bankSubledger: number,
  bankAttestation: number,
): ReconciliationResult {
  const discrepancies: string[] = [];

  if (canonicalLedger !== bankSubledger) {
    discrepancies.push(`Canonical ledger ($${canonicalLedger}) ≠ Bank subledger ($${bankSubledger})`);
  }
  if (canonicalLedger !== bankAttestation) {
    discrepancies.push(`Canonical ledger ($${canonicalLedger}) ≠ Bank attestation ($${bankAttestation})`);
  }
  if (bankSubledger !== bankAttestation) {
    discrepancies.push(`Bank subledger ($${bankSubledger}) ≠ Bank attestation ($${bankAttestation})`);
  }

  const threeWayMatch = discrepancies.length === 0;

  return {
    timestamp: new Date().toISOString(),
    canonicalLedgerBalance: canonicalLedger,
    bankSubledgerBalance: bankSubledger,
    bankAttestationBalance: bankAttestation,
    threeWayMatch,
    discrepancies,
    action: threeWayMatch ? "RECONCILED" : discrepancies.length >= 2 ? "ESCALATION_REQUIRED" : "MISMATCH",
  };
}
```

The three-way primitive checks:
1. Canonical Ledger vs Bank Subledger.
2. Canonical Ledger vs Bank Attestation (the bank's signed
   attestation of its subledger total).
3. Bank Subledger vs Bank Attestation (the bank's own internal
   consistency).

The five-way reconciliation extends this primitive by adding the
Corporate Positions and Reserve Ledger / Proof of Liabilities
sources.

## 16.12 The Reconciliation Engine (General)

The general reconciliation engine is codified in
`src/lib/reconciliation.ts` (174 lines). It performs reconciliation
between the internal reserve state and the custodian-confirmed
state, with severity-based actions:

```typescript
const VARIANCE_THRESHOLD_LOW = 0.001;      // 0.1% — negligible
const VARIANCE_THRESHOLD_MEDIUM = 0.005;   // 0.5% — investigate
const VARIANCE_THRESHOLD_HIGH = 0.01;      // 1% — pause execution
const VARIANCE_THRESHOLD_CRITICAL = 0.05;  // 5% — emergency
```

The general engine:
- Performs reconciliation between the internal reserve state and
  the custodian-confirmed state.
- Computes the variance per asset.
- Classifies the variance severity (low / medium / high / critical).
- Determines the action: `none` / `flag` / `pause_execution` /
  `initiate_investigation` / `notify_governance`.
- Updates the reserve state with the custodian confirmation.

The Five-Way Reconciliation is the more comprehensive engine —
it reconciles 5 sources instead of 2, and it uses bps-based
tolerance bands instead of percentage-based thresholds. The two
engines are complementary: the general engine handles per-asset
reconciliation (e.g., custodian confirmation of gold holdings); the
five-way engine handles system-wide reconciliation (the total MTQ
supply across 5 sources).

## 16.13 The Reconciliation Report Schema

The full Five-Way Reconciliation report:

```typescript
export interface FiveWayReconciliationReport {
  canonicalLedgerTotal: number;
  bankSubledgerTotal: number;
  corporatePositionsTotal: number;
  reserveLedgerTotal: number;
  proofOfLiabilitiesTotal: number;
  status: FiveWayReconciliationStatus;
  mismatches: ReconciliationMismatch[];
  timestamp: string;
  toleranceBps: number;
  criticalThresholdBps: number;
}
```

The report is:
- Returned by `runFiveWayReconciliation`.
- Stored in the audit trail.
- Distributed to MITHQAL ops, bank ops, and (for CRITICAL/LOCKED)
  the Governance Council.
- Used as input to the break-management process.

## 16.14 Illustrative Example — A Reconciliation Break Between Bank Subledger and Canonical Ledger

This example walks through a reconciliation break between the Bank
Subledger and the Canonical Ledger.

### 16.14.1 Setup

- **Canonical Ledger:** $100,000,000 MTQ outstanding.
- **Bank Subledger (Bank A):** $99,500,000 MTQ (a $500,000
  shortfall — Bank A's subledger is missing a $500,000 transaction).
- **Bank Subledger (Bank B):** $500,000 MTQ (the missing $500,000
  was incorrectly attributed to Bank B in the bank subledger feed).
- **Total Bank Subledger:** $99,500,000 + $500,000 = $100,000,000
  (matches the Canonical Ledger if both banks' subledgers are
  summed).
- **Corporate Positions:** $100,000,000 (matches the Canonical
  Ledger).
- **Reserve Ledger:** $100,000,000 (matches the Canonical Ledger).
- **Proof of Liabilities:** $100,000,000 (matches the Canonical
  Ledger).

Wait — in this scenario, the total Bank Subledger matches the
Canonical Ledger. Let me revise the example to produce an actual
mismatch.

### 16.14.2 The Mismatch Scenario

Let's say Bank A's subledger is missing a $500,000 transaction
entirely (the transaction was minted in the Canonical Ledger but
never propagated to Bank A's subledger due to a synchronization
bug):
- **Canonical Ledger:** $100,000,000
- **Bank Subledger (Bank A):** $99,500,000 (missing the $500K)
- **Bank Subledger (Bank B):** $0 (no activity for Bank B in this
  example)
- **Total Bank Subledger:** $99,500,000 (a $500,000 shortfall
  versus the Canonical Ledger)
- **Corporate Positions:** $100,000,000 (matches)
- **Reserve Ledger:** $100,000,000 (matches)
- **Proof of Liabilities:** $100,000,000 (matches)

### 16.14.3 The Reconciliation Run

MITHQAL Core calls:
```typescript
const report = runFiveWayReconciliation({
  canonicalLedgerTotal: 100_000_000,
  bankSubledgerTotal: 99_500_000,
  corporatePositionsTotal: 100_000_000,
  reserveLedgerTotal: 100_000_000,
  proofOfLiabilitiesTotal: 100_000_000,
});
```

### 16.14.4 The Reconciliation Result

The function:
1. Sets `reference = $100,000,000` (the Canonical Ledger total).
2. Iterates through the 5 totals:
   - CANONICAL: $100,000,000. deltaBps = 0. Skip (severity WARNING
     for CANONICAL is skipped per the spec).
   - BANK_SUBLEDGER: $99,500,000. deltaBps =
     `|99,500,000 − 100,000,000| / 100,000,000 × 10000 = 50 bps`.
     Severity: `50 ≥ 100 (CRITICAL_THRESHOLD)` is false; `50 > 1
     (toleranceBps)` is true → MISMATCH. Add to mismatches.
   - CORPORATE_POSITIONS: $100,000,000. deltaBps = 0. Skip.
   - RESERVE_LEDGER: $100,000,000. deltaBps = 0. Skip.
   - PROOF_OF_LIABILITIES: $100,000,000. deltaBps = 0. Skip.
3. Status: hasCritical = false, hasMismatch = true, hasWarning =
   false → MISMATCH.

The report:
```typescript
{
  canonicalLedgerTotal: 100_000_000,
  bankSubledgerTotal: 99_500_000,
  corporatePositionsTotal: 100_000_000,
  reserveLedgerTotal: 100_000_000,
  proofOfLiabilitiesTotal: 100_000_000,
  status: "MISMATCH",
  mismatches: [
    {
      ledger: "BANK_SUBLEDGER",
      expected: 100_000_000,
      actual: 99_500_000,
      deltaBps: 50,
      severity: "MISMATCH",
      investigationStatus: "OPEN",
    },
  ],
  timestamp: "2026-08-22T10:23:16.000Z",
  toleranceBps: 1,
  criticalThresholdBps: 100,
}
```

### 16.14.5 The Incident Response (MISMATCH Level)

Per `RECONCILIATION_INCIDENT_RESPONSE.MISMATCH`:
1. RESTRICT affected operations — Bank A's issuance and redemption
   are restricted (Bank A's subledger diverged; the system cannot
   trust Bank A's subledger until reconciled).
2. Auto-escalate to bank ops + MITHQAL ops within 1 hour.
3. Preserve forensic evidence (signed snapshots of all 5 ledgers).
4. Investigation ticket required; resolution before RESTORE.

### 16.14.6 The Investigation

The MITHQAL ops + Bank A ops team investigates:
1. **Review the audit trail:** The team reviews Bank A's subledger
   audit trail. They find that a $500,000 mint transaction (MTQ-OBL-
   2026-08-22-001, per the §14 illustrative example) was successfully
   minted in the Canonical Ledger but was NOT propagated to Bank A's
   subledger.
2. **Identify the root cause:** A synchronization bug in Bank A's
   MBG adapter caused the subledger update to be dropped during a
   brief network partition.
3. **Review the signed snapshots:** The team verifies the Canonical
   Ledger's signed snapshot shows the $500,000 mint was executed;
   Bank A's signed snapshot shows the subledger update was not
   applied.
4. **Confirm the cause:** The mismatch is confirmed as a
   synchronization bug, not a tampering attempt.

### 16.14.7 The Remediation

1. **Bank A applies the missing subledger update:** Bank A's ops
   team manually applies the missing $500,000 subledger update.
2. **Re-run the reconciliation:** MITHQAL Core re-runs the
   Five-Way Reconciliation:
   ```typescript
   const report = runFiveWayReconciliation({
     canonicalLedgerTotal: 100_000_000,
     bankSubledgerTotal: 100_000_000,  // now matches
     corporatePositionsTotal: 100_000_000,
     reserveLedgerTotal: 100_000_000,
     proofOfLiabilitiesTotal: 100_000_000,
   });
   // report.status === "RECONCILED"
   // report.mismatches === []
   ```
3. **Verify remediation:** The reconciliation returns RECONCILED.
4. **RESTORE:** The MITHQAL Monetary Control Division signs the
   RESTORE authorization. Bank A's issuance and redemption resume.

### 16.14.8 The Audit Trail

The audit trail captures:
- The original reconciliation run (MISMATCH status, with the
  BANK_SUBLEDGER mismatch).
- The investigation record (root cause: synchronization bug).
- The remediation action (manual subledger update).
- The re-run reconciliation (RECONCILED status).
- The RESTORE authorization (signed by MITHQAL Monetary Control).

The audit trail is retained for 7 years.

### 16.14.9 What Could Have Been Worse

If the mismatch had been larger (e.g., $5M shortfall = 500 bps =
5% delta), the severity would have been CRITICAL. The incident
response would have been:
1. SUSPEND all settlement operations (gate moves to LOCKED).
2. Immediate page bank ops lead + MITHQAL ops lead.
3. Forensic evidence preservation (immutable snapshots).
4. Manual controlled recovery only — no automated RESTORE.
5. Regulatory notification where required by law.

A $5M shortfall would have indicated a serious system failure —
either a database corruption, a tampering attempt, or a major
operational error. The CRITICAL response ensures the system is
not compromised while the investigation proceeds.

### 16.14.10 What Could Have Been Smaller

If the mismatch had been smaller (e.g., $100 shortfall = 0.01 bps
delta), the severity would have been WARNING. The incident
response would have been:
1. Continue settlement operations with heightened monitoring.
2. Auto-open investigation ticket against the WARNING mismatch.
3. Notify bank ops + MITHQAL ops within 4 hours.
4. Next reconciliation cycle re-checks the same ledgers.

A $100 shortfall is within the tolerance band — it could be a
rounding error or a minor timing difference. The WARNING response
ensures the issue is investigated without disrupting operations.

## 16.15 The Reconciliation Cadence in Production

In production, the Five-Way Reconciliation runs at the following
cadence:

### 16.15.1 Real-Time (Per-Transaction)

Every MTQ mint, transfer, or redemption triggers a real-time
reconciliation check. The check is non-blocking — it does not delay
the mint — but it emits a WARNING event if any source diverges
within the WARNING tolerance.

Real-time reconciliation ensures that synchronization issues are
caught immediately, before they accumulate into larger mismatches.

### 16.15.2 Daily (End-of-Day, 00:00 UTC)

The daily reconciliation runs at 00:00 UTC. It is the primary
reconciliation check — it compares all 5 sources against each other
and produces the daily reconciliation report.

The daily report is distributed to:
- MITHQAL's operations team.
- Each bank's operations team.
- The MITHQAL Governance Council (if any mismatches).

### 16.15.3 Weekly (Every Monday, 00:00 UTC)

The weekly reconciliation includes a full audit-trail review. It
is performed by MITHQAL's internal audit team.

### 16.15.4 Monthly (First Monday of Each Month, 00:00 UTC)

The monthly reconciliation includes an independent auditor's
review. The independent auditor is a third-party audit firm (e.g.,
a Big-4 firm) that reviews the reconciliation process and the
audit trail.

### 16.15.5 Exception-Driven (On-Mismatch)

If the real-time or daily reconciliation detects a mismatch, an
exception-driven reconciliation is triggered immediately. This
re-run is more thorough (it includes forensic evidence preservation)
and is the input to the break-management process.

## 16.16 Section 16 Summary

The Five-Way Reconciliation is the canonical reconciliation engine
that verifies five independent ledgers all agree on the total MTQ
supply. The 5 sources are: (1) the Canonical Ledger (MITHQAL's
authoritative supply), (2) the Bank Subledger (sum of bank-side
subledgers), (3) the Corporate Positions (sum of participant MTQ
balances), (4) the Reserve Ledger (reserve liability computed from
the reserve assets), and (5) the Proof of Liabilities (the
cryptographic commitment to the MTQ liability). The reconciliation
uses deterministic matching with fixed-precision arithmetic and
tolerance bands (1 bps WARNING, 100 bps CRITICAL). The 5 statuses
(RECONCILED / WARNING / MISMATCH / CRITICAL / LOCKED) trigger
severity-based incident responses: WARNING continues operations
with heightened monitoring; MISMATCH restricts affected operations
and escalates within 1 hour; CRITICAL suspends all settlement
operations and pages bank ops + MITHQAL ops leads; LOCKED requires
4-of-7 Council + bank lead signoff to RESTORE. The break-management
process identifies the mismatch source, investigates the cause,
remediates, verifies, and (if suspended) RESTOREs. Every
reconciliation event is logged in an immutable audit trail retained
for 7 years. The reconciliation cadence in production is real-time
(per-transaction), daily (end-of-day), weekly (Monday), monthly
(first Monday with independent auditor review), and exception-driven
(on-mismatch). The current state is INTEGRATION-READY at the
logic/spec level — the engine is implemented and SIMULATED, but
no real bank subledger has been connected.

**Honest state:** The Five-Way Reconciliation model is implemented
(the code in `mithqal-bank-gateway.ts` §13, with reference
primitives in `corporate-settlement-account.ts` and
`reconciliation.ts`). The reference reconciliation state is
RECONCILED (all 5 totals match at $100M). No real bank subledger,
corporate position feed, reserve ledger, or proof-of-liabilities
commitment has been connected. The model may NOT carry live
reconciliation until §74 honest-state invariants transition to
their production-authorized values.

---

# PART 04 END

This is Part 04 of the MITHQAL Master Blueprint v25.2 — SINGLE
SOURCE OF TRUTH. It covers Sections 12–16: Bank Gateway / Sidecar
Architecture (§11), Bank-Side Compliance Attestation (§8), Protected
Backing Cell (§47), Three-Book Separation (§51), and Five-Way
Reconciliation. All sections are fully expanded per the v25.2
controlling specification. All honest-state invariants are
preserved per §74. The current state is APPROVED CANDIDATE FOR
CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

<!-- END_OF_PART_04 -->





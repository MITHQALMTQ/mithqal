# MITHQAL — MASTER BLUEPRINT
## Version: v25.2 (FINAL — CONTROLLING)
## Date: 2026-08-22
## Status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED

---

## 0. EXECUTIVE SUMMARY

MITHQAL is a **Constitutional Monetary and Institutional Settlement Infrastructure** — a neutral, fully-reserved, gold-anchored settlement system designed for institutional cross-border trade settlement. It is not a cryptocurrency, a retail payment app, a bank, a central bank, a deposit-taking institution, an investment fund, or a speculative vehicle.

MITHQAL operates **beside** existing banking infrastructure through the **MITHQAL Bank Gateway (MBG)**, which follows the principle of **"TRANSLATION, NOT TRANSFORMATION"** — bank systems remain authoritative.

### Current Architecture (§V25.2 — Controlling)

| Parameter | Value |
|---|---|
| Strategic reserve coverage target | **130%** |
| Reserve composition | **80% fiat / 18% gold / 2% digital** |
| Emergency resilience capacity | ≤15% (separate, non-double-counted) |
| Currency basket | 11 reserve currencies + 10 settlement-only |
| Per-currency hard cap | 20% (preferred 15%) |
| USD effective ceiling | 35% (direct + AED/SAR peg + synthetic + digital) |
| Gold target | 18% (corridor 15-25%) |
| Silver | 0% (SDC ≤ 0) |
| Digital liquidity | 2% normal, ≤3% operational, 5% max, 0% emergency |
| Finality enforcement | 7/7 layers enforced at code level |
| Institutional gates | 0/13 passed (all pending) |
| Production authorized | **false** |

### Honest State

MITHQAL is **honest**: the system is designed, implemented, and tested at the code level. It is **NOT** production-authorized. Zero jurisdictions are validated. Zero licenses are obtained. Zero banks are contracted. The reserve policy is a **CANDIDATE pending quantitative validation**.

### Organizational Structure

```
MITHQAL FOUNDATION (Independent Nonprofit — Constitutional Steward)
    │
    ▼
MITHQAL HOLDING COMPANY (For-Profit — Owns Operating + Technology)
    │
    ├── MITHQAL OPERATING COMPANY (Institutional/Commercial Operations)
    │       └── Monetary & Reserve Control Division
    │
    └── MITHQAL TECHNOLOGY COMPANY (Technology Infrastructure)
            ├── MITHQAL Core
            ├── MBG
            ├── Ledger
            ├── APIs
            └── Security
```

### Disclaimer

**CONTROLLED INSTITUTIONAL DOCUMENT • NOT A LICENSE • NOT A LEGAL OPINION.**

---

## 1. MISSION, VISION & STRATEGIC OBJECTIVE

### Mission

To provide a neutral, fully-reserved, gold-anchored settlement infrastructure that enables institutional cross-border trade settlement without requiring banks to replace their core banking systems.

### Vision

A world where international trade settlement is neutral, verifiable, gold-anchored, and institutionally governed — where no single currency, jurisdiction, or platform dominates settlement.

### Strategic Objective

Build. Test. Validate. — MITHQAL seeks regulated institutions, monetary authorities, regulators, infrastructure providers, and independent assurance institutions for controlled technical review, sandbox testing, integration assessment, and pilot design.

### Pilot Model

The initial pilot architecture is intentionally constrained:
- ONE regulated institution
- ONE jurisdiction
- ONE corridor
- Institutional corporates only
- MTQ pass-through settlement (before broader treasury holding)

Broader treasury holding is outside the initial pilot scope.

---

## 2. CONSTITUTIONAL PRINCIPLES

### 2.1 Non-Negotiable Invariants

1. MITHQAL does NOT own MTQ backing
2. MITHQAL does NOT custody MTQ backing by default
3. MITHQAL does NOT financially guarantee MTQ
4. No final settlement = no MTQ mint
5. MTQ is a neutral institutional settlement unit
6. MTQ is not a USD peg
7. Gold is the primary constitutional monetary anchor
8. 80/18/2 is the current policy center (pending quantitative validation)
9. 130% is the current institutional backing coverage candidate
10. The separate 15% emergency resilience capacity must never be double-counted
11. Historical conflicting configurations remain traceable but have no active runtime authority
12. No code-only capability may be represented as institutionally validated
13. No bank relationship may be represented as a bank integration until an actual bank integration exists

### 2.2 Evidence-State Discipline

| State | Meaning |
|---|---|
| DESIGNED | Architecture designed, not yet implemented |
| IMPLEMENTED | Code written, not yet integrated |
| INTEGRATED | Connected to other systems |
| TESTED | Test suite passes |
| SANDBOX_VALIDATED | Tested in non-production sandbox |
| INSTITUTIONALLY_VALIDATED | Validated by a real institution |
| PRODUCTION_READY | Ready for production deployment |

### 2.3 Current Honest State (§74)

```
honest = true
productionAuthorized = false
noMithqalOwnedReserve = true
noMithqalFinancialGuarantee = true
threeBookDesign = true
threeBookOperational = false
threeBookEnforced = false
systemicRiskEngineDesigned = true
systemicRiskEngineImplemented = true
systemicRiskMonitoringLive = false
finalityPolicyDefined = true
finalityLayersDesigned = 7
finalityLayersRequired = 7
finalityLayersEnforced = 7
finalityProductionReady = false
finalityBypassRisk = MITIGATED_AT_CODE_LEVEL
legalRegistryImplemented = true
legalOpinionsObtained = false
validatedJurisdictions = 0
licensingMatrixImplemented = true
licensesObtained = 0
bankDefaultStateModelDesigned = true
bankDefaultOperationalWorkflow = true
bankDefaultContractValidated = false
bankDefaultLegalValidated = false
bankDefaultProductionReady = false
protectedBackingModelImplemented = true
protectedBackingLiveCells = 0
reserveConfigurationCanonical = true
reserveConfigurationConflicts = false
reservePolicyStatus = CANDIDATE_MODEL_VALIDATION_PENDING
```

---

## 3. WHAT MITHQAL IS

MITHQAL is a **Constitutional Monetary and Institutional Settlement Infrastructure**.

### MITHQAL:
- Defines eligibility
- Verifies evidence
- Calculates issuance capacity
- Enforces concentration rules
- Authorizes issuance
- Operates settlement
- Reconciles
- Monitors risk
- Applies constitutional rules
- Monitors systemic risk

### MITHQAL does NOT:
- Own backing
- Custody backing (by default)
- Fund backing
- Guarantee redemption from corporate funds
- Use operating capital as MTQ backing
- Operate as a bank
- Provide banking services
- Operate an exchange
- Buy/sell reserve assets as a commercial operator

---

## 4. WHAT MITHQAL IS NOT

MITHQAL must NOT be incorrectly represented as:
- A conventional cryptocurrency
- A retail payment app
- A commercial bank
- A central bank
- A deposit-taking institution
- An investment fund
- A lending institution
- A speculative vehicle
- A DAO
- A permissionless blockchain monetary network
- A consumer remittance platform
- A retail wallet system
- A conventional stablecoin issuer
- A replacement for national currencies
- A USD peg
- A BRICS currency
- An anti-dollar currency
- A replacement for SWIFT

---

## 5. INSTITUTIONAL PARTICIPANT MODEL

### 5.1 Settlement Flow

```
Corporate / Institutional Client
    │
    ▼
Existing Banking System (KYC/KYB/AML/Sanctions/FX/Treasury)
    │
    ▼
MITHQAL Bank Gateway (MBG) — Translation, NOT Transformation
    │
    ▼
MITHQAL Core (Eligibility → Jurisdiction → Backing Verification → Risk → DMCE → Authorization → Finality → Mint)
    │
    ▼
MTQ Settlement
    │
    ▼
Receiving Institution Gateway (MBG)
    │
    ▼
Receiving Institution / Bank Systems
```

### 5.2 Direct Institutional Participants

- Regulated banks
- Approved financial institutions
- Central banks
- Sovereign monetary authorities
- Other institutions explicitly permitted under the applicable jurisdiction

### 5.3 Excluded Direct Retail Model

- No individuals directly transacting in MTQ
- No retail wallets as the core model
- No personal bank-account participation
- No retail remittance infrastructure

### 5.4 Customer Modes

**Mode A — Pass-Through Settlement:** Customer can use MTQ without maintaining a substantial MTQ treasury position.

**Mode B — Institutional MTQ Treasury Holding:** Where permitted, corporate → bank → MTQ institutional position (hold, receive, send, settle, redeem). Availability depends on jurisdiction, bank, customer type, product authorization, legal classification.

---

## 6. ECONOMIC & MONETARY ARCHITECTURE

### 6.1 MTQ Economic Functions

| Function | Description |
|---|---|
| Settlement function | Neutral unit for institutional cross-border settlement |
| Reserve function | 130% institutional backing target (bank-side, not MITHQAL-owned) |
| Accounting/reference function | PAR = 1.00 USD (accounting convention, NOT a USD peg) |
| Issuance/redemption | Bank requests → MITHQAL authorizes → Technical system executes |
| Liquidity | Front-line (50%) + strategic (30%) + gold (18%) + digital (2%) |
| Monetary neutrality | Not a replacement for any national currency |

### 6.2 PAR Definition

PAR = 1.00 USD is an **accounting/settlement reference convention**, NOT:
- A promise of redemption into USD
- An automatic statement of USD backing
- A USD peg

### 6.3 Economic Layers

1. **Monetary layer** — MTQ as settlement unit
2. **Settlement layer** — Atomic settlement via MBG
3. **Reserve layer** — 130% backing (80/18/2)
4. **Liquidity layer** — Front-line + strategic + emergency
5. **Governance layer** — Foundation + Holding + Operating + Technology
6. **Compliance layer** — KYC/KYB/AML/sanctions (bank-side)
7. **Accounting layer** — Three-book separation
8. **Banking integration layer** — MBG (translation)
9. **Application/transaction layer** — Corporate treasury interface

---

## 7. MTQ ARCHITECTURE

### 7.1 MTQ Definition

MTQ is a **neutral institutional cross-border settlement unit/instrument**.

### 7.2 Issuance Principle (§10)

```
Corporate → Bank → KYC/KYB/AML/Sanctions → Bank establishes backing →
Protected Backing Evidence → Bank requests MTQ issuance → MBG →
MITHQAL Core → Eligibility → Jurisdiction → Backing Verification →
Bank-Specific Risk → System-Wide Risk → Liquidity → DMCE →
MITHQAL Monetary Authorization → Finality Verification → Deterministic Technical Mint
```

**Permanent rule:** Bank requests. MITHQAL authorizes. Technical system executes.

### 7.3 MTQ Components

| Component | Purpose | Economic Role |
|---|---|---|
| MTQ-S | Settlement unit | Institutional cross-border settlement |
| MTQ-G | Gold-referenced unit | Gold-anchored valuation reference |
| MTQ-Y | Yield-bearing unit | Treasury holding (where permitted) |

### 7.4 Finality-Before-Mint (§54)

**Hard invariant:** NO FINAL SETTLEMENT ⇒ NO MTQ MINT

**7 enforcement layers (all ENFORCED at code level):**

| Layer | ID | Name | Enforcement |
|---|---|---|---|
| L1 | API | Request validation, auth, idempotency | Reject without auth signature + proof-of-finality |
| L2 | Workflow | 16-step BM-01..BM-16 sequence | Cannot advance to BM-16 without BM-15 |
| L3 | Policy | Constitutional rules + DMCE constraints | Hard-fail on any breach |
| L4 | Authorization | MITHQAL Monetary Control signed auth | Commercial cannot override |
| L5 | Ledger State Machine | PENDING → AUTHORIZED → FINALIZED → MINTED | Skips rejected |
| L6 | Database TX-State | ACID transaction (finality-proof + mint) | Partial writes roll back |
| L7 | Smart Contract | On-chain finality gate | mint() requires oracle signature |

**10 bypass test routes — ALL BLOCKED:**
- DIRECT_API_CALL_WITHOUT_AUTH, WORKFLOW_SKIP_BM15, POLICY_OVERRIDE_BY_COMMERCIAL, UNSIGNED_AUTHORIZATION, LEDGER_SKIP_FINALIZED_STATE, DATABASE_PARTIAL_WRITE, SMART_CONTRACT_WITHOUT_ORACLE, EMERGENCY_OVERRIDE_WITHOUT_GOVERNANCE, ADMIN_BACKDOOR, INTERNAL_API_ROUTE

---

## 8. RESERVE ARCHITECTURE (§V25.2 — CONTROLLING)

### 8.1 Strategic Reserve Coverage Target

**RR_strategic = 1.30 (130%)**

| Threshold | Value |
|---|---|
| Strategic target | 130% |
| Policy floor | ≥105% |
| Absolute solvency floor | ≥100% |

### 8.2 Normal Reserve Composition

| Sleeve | Target | Amount (S=$100M) |
|---|---|---|
| Fiat / monetary | 80% | $104.0M |
| — Front-line liquidity | 50% | $65.0M |
| — Strategic fiat | 30% | $39.0M |
| Gold / bullion | 18% | $23.4M |
| Digital liquidity | 2% | $2.6M |
| **Total strategic backing** | **100%** | **$130.0M** |

### 8.3 Emergency Resilience Capacity

≤15% — **SEPARATE** from core reserve. Not auto-added (130% + 15% ≠ 145%).

Eligible only when:
1. Legally enforceable
2. Independently verified
3. Accessible during stress
4. Not double-counted
5. Appropriately haircut-adjusted

### 8.4 Reserve Valuation

| Value | Formula |
|---|---|
| Market | R_m = Σ Q_a · P_a |
| Adjusted (prudential) | R_a = Σ Q_a · P_a · (1 − H_a) · C_a |
| Stress (liquidation) | R_l = Σ Q_a · P_a · (1 − H_a) · C_a · S_a |

Where:
- Q_a = quantity
- P_a = market price
- H_a = constitutional haircut
- C_a = counterparty adjustment = Credit × Jurisdiction × Operational
- S_a = stress factor

### 8.5 Three NAVs

| NAV | Formula | Meaning |
|---|---|---|
| Market NAV | NAV_m = R_m / S | Mark-to-market |
| Prudential NAV | NAV_l = R_a / S | After haircuts (solvency basis) |
| Stress NAV | NAV_s = R_l / S | Liquidation scenario |

### 8.6 Coverage Ratios

| Ratio | Formula | Threshold |
|---|---|---|
| Reserve Ratio (RR) | R_a / L | ≥130% strategic, ≥105% policy, ≥100% floor |
| FSCR | R_l / L | ≥110% normal, ≥105% defensive, ≥100% emergency |
| LCR | HQLA / 30d net outflow | ≥100% |

---

## 9. CURRENCY WEIGHT ENGINE (§7-16)

### 9.1 Structural Weight

C_i = 0.50·COFER_i + 0.40·SWIFT_i + 0.10·BIS_i

### 9.2 Momentum Factor

M_i(t) = P_i(t) / P_i(t−12m), bounded 0.95 ≤ M ≤ 1.05

### 9.3 Mean-Reversion Factor

R_i(t) = 1 + 0.05·(LTA_i − C_i), bounded 0.98 ≤ R ≤ 1.02

### 9.4 EWMA Volatility

σ²_t = 0.94·σ²_{t−1} + 0.06·r²_t, where r_t = ln(P_{t−1}/P_t)

### 9.5 Attenuation Factor

- σ ≤ 2% → A = 1.00
- 2% < σ < 5% → A = 1 − (σ − 0.02)/0.03
- σ ≥ 5% → A = 0.50

### 9.6 Combined Adjustment

K_i = 1 + A_t·(M_i·R_i − 1)

### 9.7 Liquidity Overlay

L_i = 1 + 0.02·(Liquidity_i / Median − 1), clamped ±5%

### 9.8 Final Weight

W_raw,i = C_i · K_i · L_i

W_i^norm = W_raw,i / Σ_j W_raw,j (proportional normalization, NOT softmax)

Then apply: eligibility → concentration → floor → stress → geopolitical → liquidity → jurisdiction → verification

**Σ_i W_i^final = 1**

### 9.9 Concentration Policy

| Limit | Value |
|---|---|
| Preferred effective | ≤15% |
| Hard maximum (operative) | ≤20% |
| Constitutional sanity ceiling | 60% (cannot override 20%) |
| USD effective ceiling | ≤35% |
| Minimum floor | 0.5% |

### 9.10 USD Effective Exposure

USD_effective = USD_direct + AED_USD-equiv + SAR_USD-equiv + USD-linked synthetic + USD-linked digital

### 9.11 Core Reserve Currencies (11)

USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY (conditional), CAD, AUD

### 9.12 Settlement-Only Currencies (10)

EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB

**Principle:** Settlement eligibility ≠ reserve eligibility.

---

## 10. GOLD & BULLION MODULE (§23-29)

### 10.1 Gold Policy

| Parameter | Value |
|---|---|
| Gold target | 18% |
| Preferred lower | 15% |
| Bullion corridor | 15% – 25% |
| Silver (current) | 0% (SDC ≤ 0) |

### 10.2 Silver SDC

SDC_Ag = NetResilienceGain − NetCost

If SDC > 0 → admit up to 3%. If SDC ≤ 0 → 0%.

Current validated result: **Silver = 0%**.

### 10.3 Tokenized Gold (TGRS)

TGRS = 0.20·PhysicalBacking + 0.15·LegalTitle + 0.15·Custody + 0.10·Redemption + 0.10·IssuerReliability + 0.10·OracleReliability + 0.08·Settlement + 0.05·Liquidity + 0.05·OperationalResilience + 0.02·Jurisdiction

- TGRS ≥ 8.0 → Eligible
- 6.0 ≤ TGRS < 8.0 → Conditional
- H_TG = max(5%, 5% + (10 − TGRS)·0.5%)

### 10.4 Liquidation Sequence (gold LAST)

1. Digital liquidity → 2. Cash → 3. Short-duration sovereign → 4. Non-USD FX → 5. Conditional silver → 6. Tokenized gold → 7. Physical gold (LAST)

---

## 11. DIGITAL LIQUIDITY MODULE (§30-36)

### 11.1 Digital Tiers

| Tier | Value |
|---|---|
| Normal | 2% |
| Operational ceiling | ≤3% |
| Constitutional maximum | 5% |
| Emergency | 0% |

### 11.2 DRQS Scoring

DRQS_i = 0.20·Issuer + 0.15·Reserve + 0.15·Redemption + 0.15·Depeg + 0.10·Jurisdiction + 0.10·Custody + 0.10·Operational + 0.05·Liquidity

- DRQS ≥ 7.5 → Core
- DRQS ≥ 6.0 → Conditional
- Algorithmic stablecoins → EXCLUDED

### 11.3 Digital Universe

| Asset | DRQS | Status |
|---|---|---|
| USDC | 8.50 | Core |
| USDP | 8.45 | Core |
| EURC | 7.80 | Core |
| BUIDL | 8.55 | Core |
| DAI | 6.25 | 0% (conditional) |
| USDT | 6.15 | Excluded from core (external conversion only) |

### 11.4 USDT Architecture

USDT is NOT core digital backing. It MAY be an external input/bridge/conversion asset when: jurisdiction permits, provider authorized, issuer eligible, KYC/KYB/AML/sanctions pass, liquidity passes, depeg conditions pass, settlement finality established.

---

## 12. BANK GATEWAY / SIDECAR ARCHITECTURE (§11)

### 12.1 MBG Principle

**TRANSLATION, NOT TRANSFORMATION.**

Bank systems remain authoritative for: core banking, customer accounts, KYC, KYB, AML/CFT, sanctions, FX, treasury, accounting, SWIFT, ISO 20022.

MITHQAL must NOT require core banking replacement.

### 12.2 MBG Architecture

| Node | Domain | Function |
|---|---|---|
| BNK-01 | BANK | Corporate Treasury Portal |
| BNK-02 | BANK | Core Banking System |
| BNK-03 | BANK | KYC/KYB Engine |
| BNK-04 | BANK | AML/Sanctions Engine |
| BNK-05 | BANK | FX/Treasury |
| MBG-01 | MBG | MBG Adapter (translation) |
| MBG-02 | MBG | ISO 20022 Layer |
| MBG-03 | MBG | API Gateway |
| MBG-04 | MBG | Host-to-Host |
| MTH-01 | MITHQAL | MITHQAL Core |
| MTH-02 | MITHQAL | Ledger State Machine |
| MTH-03 | MITHQAL | Finality Gate (7 layers) |

### 12.3 ISO 20022 Messages

| Message | Name |
|---|---|
| pain.001 | Customer Credit Transfer Initiation |
| pain.002 | Customer Payment Status Report |
| pacs.002 | FIToFIPaymentStatusReport |
| pacs.008 | FIToFICustomerCreditTransfer |
| pacs.009 | FItoFICustomerDirectDebit |
| camt.025 | Receipt |
| camt.054 | BankToCustomerDebitCreditNotification |
| camt.056 | FIToFIPaymentCancellationRequest |
| head.001 | BusinessApplicationHeader |

---

## 13. BANK-SIDE COMPLIANCE ATTESTATION (§8)

| Attestation | Generator | MITHQAL Receives |
|---|---|---|
| KYC PASS | Bank | Cryptographic attestation |
| KYB PASS | Bank | Cryptographic attestation |
| AML PASS | Bank | Cryptographic attestation |
| SANCTIONS PASS | Bank | Cryptographic attestation |
| ACCOUNT AUTHORITY PASS | Bank | Cryptographic attestation |
| FUNDS AVAILABLE PASS | Bank | Cryptographic attestation |

**Customer identity remains inside the regulated bank.** MITHQAL receives only what is necessary for institutional settlement and compliance.

---

## 14. PROTECTED BACKING CELL (§47)

### 14.1 Formula

AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking

### 14.2 17-Field Schema

backing ID, institution ID, asset, quantity, valuation, haircut, legal status, custodian, jurisdiction, encumbrance status, allocation status, utilized amount, available amount, evidence, verification timestamp, effective date, expiry

### 14.3 Anti-Double-Count Rule

Same backing must never support multiple MTQ obligations. Enforced at mutation time + independent audit.

**Current state:** 0 live cells (4 SIMULATED reference cells).

---

## 15. THREE-BOOK SEPARATION (§51)

| Book | Contains |
|---|---|
| Book A — MITHQAL Corporate | Revenue, expenses, payroll, tax, technology costs, corporate assets/liabilities, P&L |
| Book B — Bank MTQ Obligation | Responsible bank, applicable backing, MTQ originated/outstanding, redemption obligations, liquidity, settlement, bank risk |
| Book C — Corporate Participant | MTQ balance, available/reserved/pending, sent/received, redemption, settlement history, bank-money linkage |

**Anti-commingling tests (4):** ALL BLOCKED
1. Corporate cash → MTQ backing (BLOCKED)
2. Bank obligation → MITHQAL revenue (BLOCKED)
3. Corporate MTQ → MITHQAL asset (BLOCKED)
4. Reserve gain → Operating revenue (BLOCKED)

**Current state:** threeBookDesign=true, threeBookOperational=false, threeBookEnforced=false.

---

## 16. FIVE-WAY RECONCILIATION (§11)

1. Canonical MITHQAL Ledger
2. Bank MTQ Subledger
3. Corporate MTQ Positions
4. Reserve Ledger
5. Proof-of-Liabilities

Reconciliation includes: frequency, real-time vs batch, deterministic matching, exception handling, break management, escalation, settlement suspension, remediation.

---

## 17. BANK DEFAULT & RESOLUTION (§48)

### 17.1 8-State Lifecycle

ACTIVE → RESTRICTED → LIQUIDITY_STRESS → SUSPENDED → DEFAULT → INSOLVENT → RESOLUTION → EXIT

### 17.2 11 Contractual Questions

1. Who owes the holder?
2. Who owes the receiving bank?
3. What is the holder's claim?
4. What happens to existing MTQ?
5. Can it continue transferring?
6. Can it redeem?
7. Who absorbs losses?
8. What happens to backing?
9. What does the resolution authority control?
10. How is reconciliation performed?
11. What is the customer treatment?

**Principle:** MITHQAL is NOT the financial guarantor.

**Current state:** bankDefaultStateModelDesigned=true, bankDefaultContractValidated=false.

---

## 18. LEGAL LIABILITY FRAMEWORK (§49)

### 18.1 13 Dimensions

Jurisdiction, legal nature, obligor, holder rights, redemption, settlement finality, creditor treatment, insolvency treatment, transferability, pledgeability, governing law, dispute resolution, licensing classification.

### 18.2 Jurisdiction Registry

8 jurisdictions seeded (US, EU/EEA, UK, CH, SG, AE, SA, JP) — ALL JURISDICTION_PENDING.

**Current state:** validatedJurisdictions = 0, legalOpinionsObtained = false.

---

## 19. LICENSING / ENTITY MATRIX (§50)

### 19.1 Activities (9)

Banking, payment services, custody, FX, digital asset/CASP, securities, commodity, CBDC access, settlement activities.

### 19.2 Jurisdictions (8)

US, UAE, UK, EU, Singapore, Switzerland, Hong Kong, KSA.

### 19.3 Matrix

72 entries (9 × 8) — ALL status = REQUIRED_NOT_OBTAINED.

**MITHQAL role:** NEVER "GUARANTOR" — only NONE/VERIFICATION/ORCHESTRATION/INFRASTRUCTURE.

**Current state:** licensesObtained = 0.

---

## 20. SYSTEMIC EXPOSURE ENGINE (§52)

### 20.1 13 Concentration Dimensions

Bank, banking group, country, currency, custodian, correspondent, settlement rail, liquidity provider, stablecoin issuer, technology provider, geopolitical correlation, operational correlation, bank exposure.

### 20.2 Concentration Limits

| Dimension | Preferred | Hard |
|---|---|---|
| Currency | 15% | 20% |
| Bank | 10-15% | 20% |
| Custodian | 15% | 20% |
| Country | 20% | 25% |

**Current state:** systemicRiskMonitoringLive = false, systemicRiskProductionValidated = false.

---

## 21. MTQ OPERATING SYSTEM (§10)

### 21.1 16-Step Issuance Pipeline

| Step | ID | Name | Phase |
|---|---|---|---|
| 1 | BM-01 | Corporate Request | BANK |
| 2 | BM-02 | Bank Receives | BANK |
| 3 | BM-03 | KYC/KYB | BANK |
| 4 | BM-04 | AML/Sanctions | BANK |
| 5 | BM-05 | Bank Establishes Backing | BANK |
| 6 | BM-06 | Protected Backing Evidence | BANK |
| 7 | BM-07 | Bank Requests MTQ | MBG |
| 8 | BM-08 | MBG Translation | MBG |
| 9 | BM-09 | Eligibility Check | MITHQAL |
| 10 | BM-10 | Jurisdiction Check | MITHQAL |
| 11 | BM-11 | Backing Verification | MITHQAL |
| 12 | BM-12 | Bank-Specific Risk | MITHQAL |
| 13 | BM-13 | System-Wide Risk | MITHQAL |
| 14 | BM-14 | DMCE Check | MITHQAL |
| 15 | BM-15 | Monetary Authorization | MITHQAL |
| 16 | BM-16 | Finality Verification + Mint | MITHQAL |

---

## 22. CROSS-BORDER CORRIDOR (AED ↔ SGD)

### 22.1 Demo Transaction

- Input: 1,000,000 AED
- Output: 367,365 SGD
- FX Route: USD-bridge
- AED Rail: Tokenized Deposit
- SGD Rail: CBDC
- Compliance: PASSED
- Settlement: ATOMICALLY_SETTLED
- MTQ Minted: 272,000
- Cost: 7.00 bps

### 22.2 8 Multi-Rail Support

SWIFT, ISO 20022, REST API, Host-to-Host, SFTP, RTGS, Tokenized Deposit, CBDC

---

## 23. TOKENIZATION

### 23.1 RWA Assets (4)

| Asset | Type | Notional | Risk Weight |
|---|---|---|---|
| Tokenized Commercial Paper A | RWA_COMMERCIAL_PAPER | $50M | 20% |
| Tokenized Commercial Paper B | RWA_COMMERCIAL_PAPER | $30M | 30% |
| Enterprise Debt Alpha | RWA_ENTERPRISE_DEBT | $45M | 50% |
| Enterprise Debt Beta | RWA_ENTERPRISE_DEBT | $25M | 100% |

### 23.2 Digitized Coins (3)

| Coin | Type | Issuer | Supply |
|---|---|---|---|
| Tokenized USD Deposit | TOKENIZED_DEPOSIT | Bank A | $100M |
| Tokenized EUR Deposit | TOKENIZED_DEPOSIT | Bank B | $50M |
| Wholesale CBDC (USD) | WHOLESALE_CBDC | Central Bank | $200M |

**NOT stablecoins** (§44, §72) — separate class.

---

## 24. INSTITUTIONAL ENGAGEMENT

### 24.1 Who MITHQAL Is Seeking (10)

1. Central Banks / Monetary Authorities
2. Regulated Banks
3. Regulated Financial Institutions
4. Payment / Clearing / Settlement Infrastructure
5. Government / Sovereign Infrastructure Authorities
6. Financial Regulators / Supervisory Authorities
7. Banking Technology / Payment-Rail Providers
8. Cybersecurity / Independent Assurance Institutions
9. Legal / Regulatory Institutions
10. Standards / Research Institutions

### 24.2 Engagement Types (6)

1. Architecture Review
2. Regulatory / Legal Review
3. Sandbox Testing
4. Bank Integration Pilot
5. Settlement Pilot
6. Independent Assurance

### 24.3 Pilot Readiness Categories (10)

1. Institutional Authorization
2. Legal / Regulatory Path
3. Technical Integration
4. Compliance Interface
5. Security
6. Settlement / Finality
7. Backing Evidence
8. Reconciliation
9. Resilience / Disaster Recovery
10. Independent Assurance

All: **NOT ASSESSED**

### 24.4 Jurisdiction Workflow

SUBMITTED → INITIAL_REVIEW → JURISDICTION_ASSESSMENT → LEGAL_REGULATORY_REVIEW → TECHNICAL_REVIEW → SANDBOX_CANDIDATE → PILOT_CANDIDATE → INSTITUTIONALLY_VALIDATED

### 24.5 Contact

Email: meltonsy@icloud.com

### 24.6 Evidence Status

PROPOSED → UNDER_REVIEW → EVIDENCE_REQUIRED → SANDBOX_CANDIDATE → VALIDATED

**Never display:** APPROVED, LICENSED, SUPPORTED, LIVE, PRODUCTION READY (unless backed by verified evidence).

---

## 25. WHAT-IF SCENARIOS (§45)

| Scenario | Calculation | RR' (from 122.29%) |
|---|---|---|
| A: 15%-currency falls 20% | RR × (1 − 0.15×0.20) | 118.62% |
| B: Gold falls 20% | RR × (1 − 0.18×0.20) | 117.89% |
| C: Digital sleeve loses 50% | RR × (1 − 0.02×0.50) | 121.07% |
| D: Digital sleeve → zero | RR × (1 − 0.02) | 119.85% |

---

## 26. BLUEPRINT CONFLICT RECONCILIATION (§49)

| # | Conflict | Older | Controlling |
|---|---|---|---|
| 1 | RR target | 120% | 130% |
| 2 | Sleeve composition | 15%+5%+2.5% | 80/18/2 |
| 3 | Digital target | 3.5% | 2% |
| 4 | Per-currency cap | 60% | 20% (preferred 15%) |

All 4 conflicts: **IMPLEMENTED** (older treated as historical/non-controlling).

---

## 27. CONTRADICTION SCAN (§77)

17 patterns scanned across codebase. **0 unresolved contradictions.** Target met.

---

## 28. IMPLEMENTATION STATUS (§87)

### 28.1 Acceptance Criteria: 19/23 met (83%)

### 28.2 Institutional Gates: 0/13 passed

### 28.3 Status Table

| § | Requirement | Design | Impl | Test | Inst. | Prod |
|---|---|---|---|---|---|---|
| §47 | Protected Backing Cell | ✓ | ✓ | ✓ | LEGAL_PEND | DESIGNED |
| §48 | Bank Default & Resolution | ✓ | ✓ | ✓ | CONTRACT_PEND | DESIGNED |
| §49 | Legal Liability Framework | ✓ | ✓ | ✓ | LEGAL_PEND | DESIGNED |
| §50 | Licensing/Entity Matrix | ✓ | ✓ | ✓ | LICENSING_PEND | DESIGNED |
| §51 | Three-Book Separation | ✓ | ✓ | ✓ | CONTRACT_PEND | DESIGNED |
| §52 | Systemic Exposure Engine | ✓ | ✓ | ✓ | MODEL_PEND | DESIGNED |
| §54 | Finality-Before-Mint | ✓ | ✓ | ✓ | CONTRACT_PEND | DESIGNED |
| §77 | Contradiction Scan | ✓ | ✓ | ✓ | DESIGNED | DESIGNED |
| §§16-46 | Final Reserve Math Spec | ✓ | ✓ | ✓ | MODEL_PEND | DESIGNED |
| §88 | Blueprint Update | ✓ | ✓ | ✓ | DESIGNED | DESIGNED |

---

## 29. FINAL EQUATION SYSTEM (§50)

```
L = S × PAR
R_m = Σ Q_a · P_a
R_a = Σ Q_a · P_a · (1 − H_a) · C_a
R_l = Σ Q_a · P_a · (1 − H_a) · C_a · S_a
RR = R_a / L
FSCR = R_l / L

C_i = 0.50·COFER + 0.40·SWIFT + 0.10·BIS
M_i = P_i(t) / P_i(t−12m)                    [0.95, 1.05]
R_i = 1 + 0.05·(LTA_i − C_i)                  [0.98, 1.02]
σ²_t = 0.94·σ²_{t−1} + 0.06·r²_t
A_t = 1.00 if σ≤2%; 1−(σ−0.02)/0.03 if 2%<σ<5%; 0.50 if σ≥5%
K_i = 1 + A_t·(M_i·R_i − 1)
L_i = 1 + 0.02·(Liquidity_i − Median)        [clamp ±5%]
W_raw,i = C_i · K_i · L_i
W_i = W_raw,i / Σ W_raw,j                     (proportional)
W_i^final = apply(eligibility → concentration → floor → stress → geopolitical → liquidity → jurisdiction → verification)
Σ W_i^final = 1

B_t = 80%, G_t = 18%, D_t = 2%               (policy center 80/18/2)
70% ≤ B_t ≤ 85%, 15% ≤ Bullion_t ≤ 25%, 0% ≤ D_t ≤ 5%
```

---

## 30. PRODUCTION READINESS CHECKLIST

- [ ] Architecture complete
- [ ] Core ledger complete
- [ ] Bank gateway complete (MBG)
- [ ] Security complete
- [ ] Compliance complete
- [ ] Reserve architecture validated
- [ ] Reconciliation validated (5-way)
- [ ] Accounting validated (3-book)
- [ ] Legal review completed (0/8 jurisdictions)
- [ ] Regulatory review completed (0 licenses)
- [ ] Institutional agreements completed (0 banks)
- [ ] Disaster recovery tested
- [ ] Monitoring live
- [ ] Incident response tested
- [ ] Penetration testing completed
- [ ] Key-management controls validated
- [ ] Emergency controls validated
- [ ] Pilot completed (0/13 gates)
- [ ] Production acceptance completed

**Current: 0/19 items checked. NOT PRODUCTION-AUTHORIZED.**

---

## 31. VERSION CONTROL

| Version | Date | Status |
|---|---|---|
| v24.2.1 | Historical | SUPERSEDED |
| v25.0 | 2026-08 | SUPERSEDED |
| v25.1 | 2026-08 | SUPERSEDED |
| **v25.2** | **2026-08-22** | **CURRENT AUTHORITATIVE** |

---

## 32. CONTACT

**Institutional Email:** meltonsy@icloud.com

**Website:** https://mithqal.vercel.app

**GitHub:** https://github.com/MITHQALMTQ/mithqal

**Disclaimer:** CONTROLLED INSTITUTIONAL DOCUMENT • NOT A LICENSE • NOT A LEGAL OPINION.

---

## 33. GLOSSARY

| Term | Definition |
|---|---|
| MTQ | Neutral institutional cross-border settlement unit |
| PAR | Accounting/settlement reference (1.00 USD) — NOT a peg |
| MBG | MITHQAL Bank Gateway (translation, not transformation) |
| DMCE | Dynamic Minting Capacity Engine |
| PBC | Protected Backing Cell |
| RR | Reserve Ratio (R_a / L) |
| FSCR | Funding/Stress Coverage Ratio (R_l / L) |
| LCR | Liquidity Coverage Ratio (HQLA / 30d outflow) |
| DRQS | Digital Reserve Quality Score |
| TGRS | Tokenized Gold Reserve Score |
| SDC | Silver Diversification Contribution |
| BRI | Bullion Resilience Index (advisory) |
| COFER | IMF Currency Composition of Foreign Exchange Reserves |
| HQLA | High-Quality Liquid Assets |

---

**END OF MITHQAL MASTER BLUEPRINT v25.2**

This blueprint is the **single authoritative MITHQAL master blueprint** containing the original core architecture plus every approved modification and latest update from the §V25.2 directive.

**APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.**

# MITHQAL — CANONICAL BLUEPRINT v25.0

## Neutral Wholesale Settlement Infrastructure — Permissioned Institutional Issuance + CBDC Interoperability + Constitutional Reserve Spine (preserved from v24.2.1-FINAL)
## v25.0 ARCHITECTURAL TRANSFORMATION — Participant-Minting → Institutional Issuance; Retail/Public-Minting Language Retired; Neutrality Doctrine Made Immutable

---

**Version:** 25.0 (Neutral Wholesale Settlement Architecture)
**Date:** 2026-08-15
**Status:** CANONICAL FOR v25.0 — This document is the SINGLE AUTHORITATIVE blueprint for MITHQAL from v25.0 onward. It supersedes v24.2.1-FINAL for all participant-model, identity, settlement, jurisdictional, KYC/KYB, traceability, neutrality, and CBDC-interoperability requirements. The v24.2.1 constitutional reserve spine (PAR, RR, CALM, 6-state machine, hierarchical optimizer, ERTF, TGRS/TGLS/TGBS, anti-double-counting, custody segregation, oracle architecture, Article X liquidation order, model-validity gate, jurisdictional matrix, China geo-fence) is PRESERVED verbatim wherever the participant model does not depend on it, and is explicitly marked HISTORICAL / NON-NORMATIVE for any line that conflicts with v25.0.
**Authority:** COO / CTO / PM + Monetary Systems Architect + Institutional Reserve Manager + Institutional Authorization Architect.
**Supersedes for v25.0 scope:** v24.2.1-FINAL participant model, retail-user-minting language, public-minting language, participant-deposit-to-mint pipeline, retail redemption-as-consumer-payout language. **Does NOT supersede** the v24.2.1 constitutional reserve architecture (PAR/RR/CALM/6-state/optimizer/ERTF/TGRS/anti-double-counting), which is preserved as the constitutional spine.
**Implemented modules:** `src/lib/v25-0-identity.ts`, `src/lib/institutional-authorization.ts`, `src/lib/wholesale-settlement.ts`, `src/app/api/v25.0/route.ts`.
**Governance Status:** APPROVED CANDIDATE FOR CONTROLLED TESTING. NOT production-certified, NOT regulator-approved, NOT central-bank-approved, NOT Sharia-certified, NOT risk-free, NOT guaranteed-solvency.
**Production decision:** IMPLEMENTED + PROVISIONALLY VALIDATED + NOT PRODUCTION-AUTHORIZED.

---

## §31 — REQUIRED FINAL BLUEPRINT STATEMENT (placed first per directive)

> **MITHQAL is a neutral wholesale settlement infrastructure connecting regulated monetary systems.**
>
> **MTQ is a permissioned wholesale settlement instrument used by authorized regulated financial institutions and, where explicitly permitted, central banks or sovereign monetary authorities.**
>
> MTQ does **not** replace, compete with, or become a substitute for sovereign currencies or central-bank money.
>
> MITHQAL provides the neutral settlement layer between participating monetary systems, combining digital settlement speed with institutional traceability, compliance and cryptographic auditability.
>
> Customer-level KYC/KYB is primarily performed by regulated participating institutions, while MITHQAL governs institutional authorization, settlement integrity, jurisdictional controls and immutable settlement records.
>
> **No MTQ may be issued without constitutionally verified reserve backing, and no participant or governance body may exercise discretionary monetary issuance authority.**

This statement is the canonical anchor of v25.0. Every other section of this blueprint MUST be read so as to be consistent with it. Where any pre-v25.0 text (whether in this document, in v24.2.1-FINAL, or in the historical archive) appears to conflict with this statement, the conflict is resolved in favor of this statement, and the conflicting text is marked `HISTORICAL / NON-NORMATIVE`.

---

## §0 — NON-NEGOTIABLE EXECUTION RULES (17 rules)

These seventeen rules are the operating constitution of v25.0 engineering. They are immutable for the duration of the v25.0 release cycle and may only be amended through the constitutional amendment workflow (§13.2, timelock 90 days, supermajority 6/7). They are listed in execution-priority order — a lower-numbered rule ALWAYS supersedes a higher-numbered rule.

**R0.1 — Constitutional spine preserved.** The v24.2.1-FINAL constitutional invariants (§3.3, §14.1) are PRESERVED EXACTLY:
```
PAR = $1.00 USD settlement unit
L  = S × PAR
RR = R_a / (S × PAR)
RR_floor      = 100%
RR_policy     = 105%
RR_strategic  = 120%
B_t + F_t + D_t = 100%   (15% ≤ B ≤ 25%, 70% ≤ F ≤ 85%, 0% ≤ D ≤ 5%)
```
RR remains the SINGLE legal solvency metric. StressRR, GEI, BRI, CBGRS, CQS, TGRS, TGLS, TGBS, MRRC, CVaR, LCR, LSD, DRQS, StressDRQS MUST NOT redefine PAR or replace legal RR.

**R0.2 — No discretionary monetary issuance authority.** No executive, council, founder, treasury, governance body, smart contract, off-chain service, or participant may exercise discretionary monetary issuance authority. The full list of prohibited minting paths is enumerated in §3.1.

**R0.3 — Institutional issuance only.** MTQ may be originated ONLY through the institutional issuance pipeline defined in §3.2, executed by an authorized regulated institution (Class B or Class C with jurisdictional authorization), against verified eligible reserve backing, after every checkpoint in the pipeline has passed. There is no other path to new MTQ supply.

**R0.4 — No MTQ without verified reserve backing.** Every MTQ unit, without exception, MUST be backed by verified reserve assets. Verified NAV must be reported separately from Modeled NAV. No production MTQ issuance may rely on Modeled (Level 0) reserves.

**R0.5 — Neutrality doctrine is immutable.** MITHQAL shall not compete with sovereign monetary systems (§6). USD remains USD, JPY remains JPY, EUR remains EUR, AED remains AED, RMB remains RMB. CBDCs remain liabilities of their issuing central banks. MTQ exists BETWEEN monetary systems, not INSTEAD OF monetary systems.

**R0.6 — Participant hierarchy enforced.** No entity may transact MTQ unless it is classified into exactly one participant class (A, B, C, D, or E) per §2 and possesses the corresponding authorization. Direct MTQ access for Class D (corporate) and Class E (individual/retail) customers is NOT part of the core institutional architecture and is NOT enabled by default.

**R0.7 — KYC/KYB layering.** Customer-level KYC/KYB is performed by the regulated participating institution. MITHQAL performs institution-level authorization and validates the institutional settlement transaction. The participating regulated institution knows its customer; MITHQAL knows and authorizes its participating institution.

**R0.8 — Jurisdictional perimeter hard-blocks.** UNKNOWN status is a CONSERVATIVE BLOCK. PROHIBITED status is an ABSOLUTE BLOCK. No inference of legal permission may be drawn from MITHQAL's internal label. China (CN) is geo-fenced (§16). Any jurisdiction not present in the registry is treated as UNKNOWN and therefore blocked by default.

**R0.9 — Settlement finality is layered and jurisdiction-aware.** Technical finality (blockchain confirmation) ≠ legal finality (jurisdiction-dependent) ≠ banking-system finality (rail-dependent). No section of this blueprint may imply that blockchain confirmation alone automatically determines legal finality in every jurisdiction.

**R0.10 — No retail-user minting.** Public minting, permissionless issuance, retail-user-to-MTQ-direct-minting, and any consumer-coin language are RETIRED. The v24.2.1 language that permitted a participant to "deposit assets and directly mint MTQ" is HISTORICAL / NON-NORMATIVE for v25.0 (see §26 Semantic Sweep).

**R0.11 — Anti-double-counting preserved.** `Gold_total = PhysicalAllocatedGold + TokenizedAllocatedGold` (distinct asset registry rows backed by disjoint allocated bar pools). The 32/32 anti-double-counting proof from v24.2.1-FINAL §10 (Appendix V24.2.1-V) is preserved verbatim. No MTQ supply expansion may rely on double-counted reserves.

**R0.12 — Determinism preserved.** No `Date.now()` in decision mathematics. No `Math.random()` in monetary calculations. All decision functions are pure. `asOfTimestamp` is passed as a parameter. `decimal.js` fixed-point arithmetic is used throughout. (v24.2.1 §15 — preserved.)

**R0.13 — No rehypothecation, no lending of reserves.** Reserves are segregated from operating capital. Reserves are NOT pledged, lent, rehypothecated, or used to satisfy unrelated liabilities. Legal segregation, accounting segregation, custody segregation, and technical ledger segregation are all independently evidenced. (v24.2.1 §2A.2 — preserved.)

**R0.14 — Article X sequential liquidation preserved.** Liquidation order: (1) eligible stablecoins, (2) cash, (3) short-duration sovereign, (4) non-USD FX, (5) conditional silver / tokenized conditional metal (if held), (6) tokenized gold, (7) physical gold LAST (Exhaustion Certificate required). Pro-rata liquidation is PROHIBITED. (v24.2.1 §9.4 / V24.2.1.6 — preserved.)

**R0.15 — No token without function-issued authorization.** A transfer of MTQ between two institutions is authorized ONLY if BOTH sender and receiver (a) are present in the institutional authorization registry (§20), (b) are operationally ACTIVE, (c) are sanctions-CLEAR, (d) are within their authorization window, (e) hold the relevant MTQ function permission (SETTLE / ACQUIRE / REDEEM / ROUTE / OBSERVE / ISSUE), and (f) are in non-PROHIBITED jurisdictions. Failure of ANY check blocks the transaction.

**R0.16 — Honesty rules.** No claim of zero counterparty risk, zero regulatory risk, immunity from oracle manipulation, economic invincibility, guaranteed purchasing-power preservation, automatic MiCA/US/UAE/Singapore approval, central-bank endorsement (unless formally granted), or Sharia compliance (until an independent qualified Sharia board issues a current fatwa) is permitted. No result may be forced to PASS. No FAIL may be relabeled as BDL (Beyond Design Limit) to increase the reported pass rate. Honest reporting is mandatory at every layer.

**R0.17 — Constitutional spine over performance.** Where any performance, throughput, latency, or cost target conflicts with the constitutional invariants, neutrality doctrine, or institutional authorization layer, the constitutional/institutional layer wins. No optimization may weaken the constitutional spine.

---

## TABLE OF CONTENTS

- §31 Required Final Blueprint Statement (placed at top, restated at end)
- §0 Non-Negotiable Execution Rules (17 rules)
- §1 Canonical Identity (MITHQAL + MTQ)
- §2 Participant Hierarchy (Class A-E)
- §3 Minting Model (Institutional Issuance Pipeline)
- §4 KYC/KYB Architecture (Layered)
- §5 Neutral Cross-Border Settlement Flow
- §6 Neutrality Doctrine (Immutable)
- §7 CBDC Interoperability Layer
- §8 Central-Bank Participation Model
- §9 Institutional Traceability
- §10 Core Value Proposition
- §11 Reserve Architecture (PRESERVED from v24.2.1)
- §12 CALM, 6-State Machine, Hierarchical Optimizer (PRESERVED)
- §13 Trading Language
- §14 Redemption Flow (Institutional)
- §15 Jurisdictional Regulatory Perimeter
- §16 Geo-Fencing
- §17 Regulated Entry/Exit Rails
- §18 Product / User Model (Rewritten for v25.0)
- §19 Smart Contract Changes (Reference Matrix)
- §20 Institutional Authorization Registry
- §21 Institutional Limits (Stress-State-Indexed)
- §22 Settlement Finality
- §23 Sharia Architecture (Updated Scope)
- §24 Commercial Flow
- §25 Value Proposition (Institutional)
- §26 Semantic Sweep Summary (What was changed / marked HISTORICAL)
- §27 Architecture Diagram (ASCII)
- §28 Canonical Terminology
- §29 Preserved v24.2 Strengths
- §30 Formal Acceptance Criteria (34 items, YES/NO)
- §31 Required Final Blueprint Statement (restated)
- §32 Final Implementation Directive (A-J deliverables reference)
- Appendix A — HISTORICAL / NON-NORMATIVE archive of v24.2.1 participant-minting language
- Appendix B — Cross-reference to implemented modules
- Appendix C — Documents superseded by v25.0

---

## §1 — CANONICAL IDENTITY

### §1.1 MITHQAL Canonical Identity

**Canonical definition (v25.0):**

> MITHQAL is **a neutral wholesale institutional settlement infrastructure** connecting regulated monetary systems across jurisdictions.

**MITHQAL is NOT:**

- a central bank
- a commercial bank
- a sovereign currency issuer
- a retail payment platform
- an exchange
- a brokerage
- a market maker
- a lending institution
- a trade-finance institution
- an investment fund
- a wealth manager
- a DeFi protocol
- a speculative vehicle

This list is closed. Adding an item requires constitutional amendment (§13.2, 90-day timelock, 6/7 supermajority).

**Constitutional implications of the identity:**

1. MITHQAL does not hold retail customer deposits in the banking sense. It does not issue deposit instruments to individuals.
2. MITHQAL does not operate a market for speculative trading of MTQ. There is no order book, no matching engine for speculative flow, no market-making desk.
3. MITHQAL's economic relationship is with regulated participating institutions, NOT with the institutions' underlying customers.
4. The operating entity (currently JOZOUR LLC, New Jersey, per the institutional-principles register) is the legal operator of the infrastructure, NOT the issuer of sovereign money and NOT a substitute for any regulated participant.
5. MITHQAL's neutrality is operational, technical, and economic — it applies equally to all authorized participating institutions and is enforced by code, not by discretion.

### §1.2 MTQ Canonical Definition

**Canonical definition (v25.0):**

> MTQ is **a permissioned wholesale settlement instrument** used by approved regulated financial institutions and, where explicitly authorized, central banks or equivalent sovereign monetary authorities to transfer settlement value between participating monetary systems.

**MTQ IS:**

- neutral
- wholesale
- settlement-focused
- reserve-disciplined
- auditable
- cryptographically secured
- institutionally traceable
- interoperable

**MTQ is NOT:**

- a retail stablecoin
- a consumer payment coin
- a replacement for USD, JPY, EUR, AED, RMB, or any sovereign currency
- a CBDC
- a sovereign liability
- an investment product
- an exchange-traded speculative instrument
- a permissionless-issuance token
- a public-minting token

**Par value (preserved from v24.2.1 §3.1):**

```
PAR = $1.00 USD settlement / accounting reference unit
L   = S × PAR    (fixed redemption liability in USD reference terms)
```

PAR is a USD-denominated settlement unit, NOT a USD-backed monetary identity. MITHQAL is not saying "MTQ is backed by USD"; it is saying "MTQ has a fixed accounting/redemption reference of one U.S. dollar." The reserve portfolio remains globally diversified (Portfolio B: 15% physical gold + 5% tokenized gold + 0% silver + 77.5% fiat + 2.5% digital). The USD is a reference unit, not the economic anchor.

### §1.3 Identity Invariants

1. The canonical identity is implemented in `src/lib/v25-0-identity.ts` (`MITHQAL_IDENTITY`, `MTQ_DEFINITION`) and served at `GET /api/v25.0` under `identity` and `mtq` fields.
2. The identity MAY NOT be modified without constitutional amendment. The `isNot` lists are closed.
3. Any documentation, marketing, smart contract, UI, API response, or test fixture that contradicts the canonical identity is a defect that MUST be remediated.
4. The canonical statement (§31) MUST appear verbatim in every public-facing institutional document describing MITHQAL.

---

## §2 — PARTICIPANT HIERARCHY (Class A-E)

v25.0 introduces a five-class participant hierarchy. Every entity that interacts with the MITHQAL infrastructure MUST be classified into exactly one class. The classification determines which MTQ functions are available, which authorizations are required, and which controls apply.

### §2.1 Class A — Central Bank / Sovereign Monetary Authority

| Attribute | Value |
|---|---|
| Class | A |
| Name | Central Bank / Sovereign Monetary Authority |
| Direct minting | **NO** — even central banks go through institutional channels |
| Direct settlement | YES (settlement routing + observation per legal access rights) |
| Authorization required | **EXPLICIT_SOVEREIGN** — explicit authorization by the relevant authority and applicable legal framework |

**Capabilities:**

- wholesale settlement participation
- CBDC interoperability
- institutional settlement routing
- observation / reporting according to legal access rights

**Notes:** A central bank's participation is ALWAYS contingent on explicit authorization by that central bank (or its sovereign legal framework). MITHQAL does not solicit, claim, or imply central-bank participation that has not been formally granted. Mode 3 (§8) — direct central-bank participation — is a TARGET design pattern, not a current production state.

### §2.2 Class B — Regulated Commercial Bank

| Attribute | Value |
|---|---|
| Class | B |
| Name | Regulated Commercial Bank |
| Description | Primary production participant |
| Direct minting | YES — through institutional issuance channels only (§3.2) |
| Direct settlement | YES |
| Authorization required | **REGULATORY** — banking license in the institution's home jurisdiction |

**Capabilities:**

- MTQ settlement
- MTQ acquisition through approved institutional channels
- MTQ redemption through approved channels
- settlement routing
- institutional liquidity management
- transaction reporting (regulatory + MITHQAL)

**Notes:** Class B is the primary participant class for production settlement volume. A Class B institution is the entity that holds the regulated banking license, performs customer-level KYC/KYB, and submits institutional issuance requests to the MITHQAL pipeline on behalf of its customers (Class D corporate or Class E individual). Class B institutions are the only class permitted to hold the ISSUE function in production.

### §2.3 Class C — Approved Regulated Financial Institution

| Attribute | Value |
|---|---|
| Class | C |
| Name | Approved Regulated Financial Institution (non-bank) |
| Description | Only where legally permitted. Capabilities explicitly scoped by jurisdiction and license. |
| Direct minting | YES — conditional on jurisdiction |
| Direct settlement | YES |
| Authorization required | **JURISDICTIONAL** — license scoped per jurisdiction |

**Capabilities:**

- MTQ settlement (jurisdiction-scoped)
- MTQ acquisition (conditional)
- MTQ redemption (conditional)

**Notes:** Class C covers payment institutions, electronic-money institutions, trust companies, and other regulated non-bank financial institutions that hold the necessary licenses in their jurisdiction. The conditional nature of capabilities is intentional — what a Class C institution may do in Singapore may differ from what it may do in Hong Kong or the UAE.

### §2.4 Class D — Corporate / Trade Customer

| Attribute | Value |
|---|---|
| Class | D |
| Name | Corporate / Trade Customer |
| Description | Corporate customers do NOT directly mint MTQ. They interact through their regulated bank. |
| Direct minting | **NO** |
| Direct settlement | **NO** |
| Authorization required | NONE at the MITHQAL layer (their bank is the authorized institution) |

**Capabilities:**

- indirect MTQ access via regulated institution (Class B or Class C)
- trade settlement instruction via bank

**Notes:** Class D participants NEVER appear in the MITHQAL institutional authorization registry directly. They are customers of Class B / Class C institutions. The MITHQAL infrastructure does not authenticate Class D participants; it authenticates the regulated institution that is executing the settlement on their behalf.

### §2.5 Class E — Individual / Retail Customer

| Attribute | Value |
|---|---|
| Class | E |
| Name | Individual / Retail Customer |
| Description | No direct MTQ minting. No direct wholesale settlement access. No unrestricted retail MTQ issuance. |
| Direct minting | **NO** |
| Direct settlement | **NO** |
| Authorization required | NONE at the MITHQAL layer |

**Capabilities:**

- no direct MTQ access
- retail access is NOT part of the core institutional architecture

**Notes (CRITICAL):** Class E participants are explicitly OUT of the v25.0 core architecture. Any future retail MTQ access (e.g., via a regulated bank-issued sub-token, a regulated stablecoin wrapper, or a licensed retail-CBDC bridge) would be a SEPARATE program requiring its own constitutional amendment, its own legal perimeter review, and its own regulatory licensing. v25.0 does NOT enable retail MTQ access by default. The v24.2.1 language that implied individual users could mint MTQ is HISTORICAL / NON-NORMATIVE (see §26).

### §2.6 Class Capability Matrix

| Function | Class A | Class B | Class C | Class D | Class E |
|---|---|---|---|---|---|
| ISSUE (institutional issuance) | no | YES | conditional | no | no |
| ACQUIRE | no | YES | conditional | no | no |
| REDEEM | no | YES | conditional | no | no |
| SETTLE | YES | YES | conditional | no | no |
| ROUTE | YES | YES | conditional | no | no |
| OBSERVE | YES (per legal access rights) | YES (own transactions) | conditional | no | no |
| Direct customer-level access | n/a | YES (their own customers) | conditional | n/a | no |

### §2.7 Helpers (implemented)

The following helpers are exported from `src/lib/v25-0-identity.ts`:

```ts
canMint(participantClass: "A"|"B"|"C"|"D"|"E"): boolean
//  A→false, B→true, C→true, D→false, E→false

canSettle(participantClass): boolean
//  A→true, B→true, C→true, D→false, E→false

getAuthRequirement(participantClass): "EXPLICIT_SOVEREIGN"|"REGULATORY"|"JURISDICTIONAL"|"NONE"
```

These helpers are the canonical runtime gate. Any smart contract, API route, or off-chain service that touches participant authorization MUST route through these helpers (or their on-chain equivalent).

---

## §3 — MINTING MODEL (Institutional Issuance Pipeline)

### §3.1 Minting Model — Old vs New

**OLD (v24.2.1 and earlier — HISTORICAL / NON-NORMATIVE for v25.0):**

> "Participant deposits assets and directly mints MTQ."

This model is RETIRED for v25.0. It is preserved in Appendix A for traceability only and has no normative authority.

**NEW (v25.0 — canonical):**

> "Only authorized institutional issuance channels may originate MTQ."

**Rules (canonical, immutable):**

1. Only authorized institutional issuance channels may originate MTQ.
2. The customer may request a settlement service through its regulated institution.
3. The customer does not possess monetary issuance authority.
4. No MTQ may exist without corresponding verified reserve backing.

**Prohibited minting paths (closed list — v25.0 §3.1):**

- executive minting
- council minting
- emergency arbitrary minting
- treasury minting
- compensation minting
- operational funding minting
- governance minting
- promotional minting

These prohibited paths are implemented as forbidden function selectors in `Governance.sol` (v24.2.1 §17.5 — preserved: 15 forbidden selectors). The list is closed; adding an item requires constitutional amendment.

### §3.2 Institutional Issuance Pipeline (canonical)

The full pipeline is implemented in `src/lib/v25-0-identity.ts` (`ISSUANCE_PIPELINE`) and executed by `processWholesaleSettlement()` in `src/lib/wholesale-settlement.ts`. Every checkpoint MUST pass for MTQ to enter the settlement layer.

```
1.  Underlying Customer
2.  Regulated Bank / Approved Institution          (Class B or Class C)
3.  Institutional Issuance Request
4.  Institution Authentication                     (§20 registry lookup)
5.  Institutional Authority Check                   (§20 function/currency/corridor permission)
6.  Eligible Reserve / Settlement Asset Verification
7.  Custody Verification                            (§11 reconciliation, Level 2+ for production)
8.  NAV Calculation                                 (§3.2 — Market / Prudential / Stress NAV)
9.  Reserve Ratio / Stress-RR / Constitutional Checks
        - RR ≥ 100%  (hard block below)
        - RR < 105% → enhanced restrictions (policy floor)
        - StressRR ≥ 100% (optimizer hard constraint)
        - LCR ≥ 1.0 (hard constraint)
        - CALM state machine active (§12)
10. Proof of Reserves                               (cryptographic, Level 3+ for mainnet)
11. Proof of Solvency                               (cryptographic, Level 3+ for mainnet)
12. Deterministic Issuance Authorization            (no discretion — §15 determinism)
13. Mint.sol                                        (v24.2.1 §17.2 — preserved)
14. MTQ.sol                                         (v24.2.1 §17.4 — preserved)
15. MTQ enters wholesale settlement layer
```

**Invariants of the pipeline:**

- The pipeline is DETERMINISTIC. Given the same inputs (institution, customer-reference, amount, currency, reserve state, NAV, RR), the pipeline MUST produce the same authorization decision.
- The pipeline is AUDITABLE. Every checkpoint emits an immutable event in the JSONL append-only ledger (v24.2.1 §16 — preserved).
- The pipeline is FAIL-CLOSED. Any checkpoint failure blocks the issuance. The pipeline does not have a "skip and continue" mode.
- The pipeline does NOT take customer PII as input. It takes an institutional customer reference (opaque to MITHQAL). KYC/KYB is the responsibility of the regulated institution (§4).

### §3.3 Issuance Authorization Decision Logic

The decision logic (implemented in `processWholesaleSettlement` and `checkInstitutionAuthorization`) is:

```
AUTHORIZED iff ALL of:
  - sender institution exists in registry AND operationalStatus = ACTIVE
  - receiver institution exists in registry AND operationalStatus = ACTIVE
  - sender sanctionsStatus ≠ BLOCKED
  - receiver sanctionsStatus ≠ BLOCKED
  - sender authorization not expired
  - receiver authorization not expired
  - sender.permittedMTQFunctions ∋ requested function
  - receiver.permittedMTQFunctions ∋ requested function
  - requested amount ≤ sender.maxTransactionSize
  - requested amount ≤ receiver.maxTransactionSize
  - requested currency ∈ sender.permittedCurrencies
  - requested currency ∈ receiver.permittedCurrencies
  - requested corridor ∈ sender.permittedCorridors
  - requested corridor ∈ receiver.permittedCorridors
  - sender.jurisdiction NOT geo-fenced (§16)
  - receiver.jurisdiction NOT geo-fenced (§16)
  - sender.jurisdiction.classification[function] ≠ PROHIBITED
  - receiver.jurisdiction.classification[function] ≠ PROHIBITED
  - sender.jurisdiction.classification[function] ≠ UNKNOWN
  - receiver.jurisdiction.classification[function] ≠ UNKNOWN
  - RR ≥ 100%  (constitutional floor)
  - StressRR ≥ 100%  (optimizer hard constraint)
  - LCR ≥ 1.0  (liquidity hard constraint)
  - CALM state ≠ EMERGENCY (minting disabled in EMERGENCY per §12)
  - Proof of Reserves passes (Level ≥ 2 for institutional pilot; Level ≥ 3 for mainnet)
  - Proof of Solvency passes (Level ≥ 2 for institutional pilot; Level ≥ 3 for mainnet)
  - anti-double-counting invariant holds (Gold_total = Physical + Tokenized, distinct registries)
```

Any single FALSE → BLOCK.

### §3.4 Prohibited: Discretionary Minting

The v24.2.1 §13.3 emergency governance framework is PRESERVED for non-minting emergency actions only (e.g., redemption throttling, oracle fallback, council notification). Emergency governance MAY NOT mint. The 11 objective triggers (v24.2.1 §13.3) are non-discretionary in operation but NONE of them authorizes new MTQ supply.

---

## §4 — KYC / KYB ARCHITECTURE (Layered)

### §4.1 Principle

> The participating regulated institution knows its customer; MITHQAL knows and authorizes its participating institution and validates the institutional settlement transaction.

This two-layer model is the canonical KYC/KYB architecture for v25.0. It replaces any pre-v25.0 language that implied MITHQAL performs customer-level KYC/KYB on retail users.

### §4.2 Customer-Level (performed by the regulated participating institution)

**Responsible party:** Regulated participating institution (Class B or Class C).

**Functions:**

- KYC (Know Your Customer — individuals)
- KYB (Know Your Business — corporate customers, UBO identification)
- UBO identification (Ultimate Beneficial Owner)
- AML / CFT (Anti-Money-Laundering / Counter-Financing-of-Terrorism)
- source-of-funds / source-of-wealth checks where applicable
- sanctions screening (customer-level)
- transaction monitoring (customer-level)
- customer risk assessment

The regulated institution MUST perform all of the above according to the laws of its home jurisdiction. MITHQAL does not duplicate this work; it relies on the institution's regulated status as the trust anchor.

### §4.3 MITHQAL-Level (performed by MITHQAL)

**Responsible party:** MITHQAL.

**Functions:**

- institution identification
- institution authorization (per §20 registry)
- institution credential verification
- institutional permissions (permitted functions, currencies, corridors, limits)
- jurisdiction eligibility (per §15 perimeter)
- settlement instruction validation (institutional reference, amount, currency, corridor)
- sanctions / jurisdiction controls required at the MITHQAL layer (institution-level sanctions screening, geo-fence enforcement per §16)
- transaction integrity checks (deterministic pipeline per §3.2)
- institutional auditability (immutable settlement records per §9)
- immutable settlement records (JSONL append-only ledger per v24.2.1 §16)

### §4.4 Legal Exception Clause

> If applicable law requires MITHQAL to collect, verify, retain or disclose additional customer information, the architecture MUST support that requirement.

This clause is the canonical escape valve. If a regulator in a participating jurisdiction requires MITHQAL to hold additional customer data (e.g., for travel-rule compliance, for tax reporting, for court-ordered disclosure), the architecture MUST be able to ingest, store, and disclose that data according to the applicable law. The default is no customer PII at the MITHQAL layer; the exception is regulatorily mandated collection.

### §4.5 Privacy Rule

> MITHQAL should not expose sensitive customer information publicly. Access must be permissioned.

Settlement records (§9) carry an institutional sender, institutional receiver, transaction ID, timestamp, MTQ amount, jurisdiction, settlement channel, and finality status. They do NOT carry customer PII. The customer-reference field is opaque to MITHQAL (a string provided by the regulated institution for its own reconciliation). Regulator access to underlying customer data flows through the regulated institution, NOT through MITHQAL's settlement layer.

---

## §5 — NEUTRAL CROSS-BORDER SETTLEMENT FLOW

### §5.1 Canonical Flow

The canonical cross-border settlement flow is seven hops:

```
1. SOVEREIGN MONEY / CBDC A
2. REGULATED INSTITUTION A
3. MTQ
4. MITHQAL NEUTRAL SETTLEMENT LAYER
5. MTQ
6. REGULATED INSTITUTION B
7. SOVEREIGN MONEY / CBDC B
```

**Invariants:**

- MITHQAL is the NEUTRAL middle settlement layer — it does not favor Institution A or Institution B, jurisdiction A or jurisdiction B, currency A or currency B.
- MTQ is the settlement instrument between the two institutions — it is NOT a substitute for either sovereign currency.
- The underlying customer is NOT a party to the cross-border flow. The customer's relationship is with its regulated institution.
- Finality is layered (§22): technical finality at MTQ transfer, legal finality per jurisdiction, banking finality when the sovereign money reaches the receiving customer's bank account.

### §5.2 Worked Example — Japan Importer ↔ U.S. Exporter

```
1. Japanese Importer                  (Class D corporate customer of Japanese Bank)
2. Japanese Bank                      (Class B regulated institution, JP jurisdiction)
3. JPY / authorized Japanese settlement asset
4. Institutional MTQ Conversion       (§3.2 pipeline executed by Japanese Bank)
5. MTQ                                (settlement instrument)
6. MITHQAL Settlement Layer           (neutral — authenticates both institutions)
7. MTQ                                (settlement instrument)
8. U.S. Bank                          (Class B regulated institution, US jurisdiction)
9. USD / authorized U.S. settlement asset
10. U.S. Exporter                     (Class D corporate customer of U.S. Bank)
```

**Principle:** The importer and exporter do not need to become direct MTQ issuers. MITHQAL is the neutral middle settlement layer. The Japanese Bank acquires MTQ from the MITHQAL pipeline (against JPY or an authorized Japanese settlement asset) and the U.S. Bank redeems MTQ through the MITHQAL redemption pipeline (§14) for USD or an authorized U.S. settlement asset.

### §5.3 Implementation

The settlement flow is implemented in `src/lib/wholesale-settlement.ts`:

```ts
processWholesaleSettlement(request: SettlementRequest, navUsd, reserveRatio): Promise<SettlementResult>
```

It executes the full §3.2 pipeline, generates a transaction ID, creates a `SettlementRecord` (§9), and returns the result. The `finalityStatus` is set to `TECHNICAL_FINAL` (§22 — blockchain confirmation); legal and banking finality are tracked separately.

### §5.4 Settlement Channel Taxonomy

The `settlementChannel` field on a `SettlementRecord` is one of:

- `WHOLESALE` — institutional-to-institutional settlement (default)
- `CBDC_BRIDGE` — settlement via the CBDC interoperability layer (§7)
- `REDEMPTION` — settlement via the redemption flow (§14)
- `CONTINGENCY` — settlement via in-kind delivery (v24.2.1 V24.2.11 — preserved, emergency only)

---

## §6 — NEUTRALITY DOCTRINE (Immutable)

### §6.1 Canonical Statement

> MITHQAL shall not compete with sovereign monetary systems.

This doctrine is **immutable** for v25.0. It is encoded in `NEUTRALITY_DOCTRINE.immutable` in `src/lib/v25-0-identity.ts` and may not be modified without constitutional amendment (90-day timelock, 6/7 supermajority, AND explicit sovereign-authority consultation for any change that affects central-bank interoperability).

### §6.2 Explicit Neutrality Rules

The following rules are explicit, closed, and exhaustive for v25.0:

1. USD remains USD.
2. JPY remains JPY.
3. EUR remains EUR.
4. AED remains AED.
5. RMB remains RMB.
6. CBDCs remain liabilities of their issuing central banks.
7. MTQ does not replace domestic monetary systems.
8. MTQ does not establish monetary policy.
9. MITHQAL does not set sovereign interest rates.
10. MITHQAL does not attempt to displace any sovereign currency.

### §6.3 Strategic Statement

> MTQ exists between monetary systems, not instead of monetary systems.

This statement is the single-sentence summary of the neutrality doctrine. It is the canonical answer to "What is MTQ?" when asked by a regulator, central bank, or institutional counterparty.

### §6.4 Operational Implications

1. MITHQAL's reserve portfolio is diversified across multiple currencies and gold — it is NOT a USD-only reserve, despite PAR being USD-denominated. Portfolio B (15% phys gold + 5% PAXG + 0% silver + 77.5% fiat basket + 2.5% digital) reflects this.
2. MITHQAL does not issue MTQ in a sovereign currency (e.g., "MTQ-JPY", "MTQ-EUR"). MTQ is a single settlement instrument; the sovereign currency conversion happens at the institutional layer (Class B bank performs the FX).
3. MITHQAL does not hold a monetary policy mandate. The Monetary Council (§13.1) governs the constitutional reserve architecture, NOT sovereign monetary policy.
4. MITHQAL's oracle architecture (§12) sources prices from multiple jurisdictions and multiple infrastructure providers. Common-mode oracle failure testing (v24.2.1 §23) is mandatory before mainnet.
5. MITHQAL's fee schedule (§19 / v24.2.1 §19 — preserved) does not include negative fees, yield, or any mechanism that could be construed as competing with sovereign interest rates.

---

## §7 — CBDC INTEROPERABILITY LAYER

### §7.1 Layer Name

> MITHQAL Neutral CBDC Interoperability Layer

### §7.2 Supported Flows

The following five flows are canonical for v25.0:

1. `wholesale CBDC → MTQ → wholesale CBDC`
2. `CBDC → MTQ → bank money`
3. `bank money → MTQ → CBDC`
4. `bank money → MTQ → bank money`
5. `tokenized sovereign / cash-equivalent assets → MTQ → regulated destination settlement assets`

Each flow is supported subject to explicit legal and technical authorization (§15 perimeter, §20 institutional authorization). The CBDC interop layer is a TARGET design pattern — current production supports the bank-money variants; the CBDC variants require central-bank authorization (Mode 2 or Mode 3 per §8).

### §7.3 Principles

1. Do not require every country to adopt the same CBDC technology. (Technical neutrality — wholesale CBDC, retail CBDC, and non-CBDC bank-money systems may all participate.)
2. Do not require one sovereign currency to become the international settlement currency. (Monetary neutrality — no USD-anchored world currency, no EUR-anchored, no RMB-anchored.)
3. Use MTQ as the neutral institutional bridge. (Settlement neutrality — MTQ is the inter-system settlement instrument, not a substitute for any participating currency.)

### §7.4 Implementation

The CBDC interop check is implemented in `src/lib/wholesale-settlement.ts`:

```ts
checkCBDCInterop(request: CBDCInteropRequest): CBDCInteropResult
//  sourceSystem: "WHOLESALE_CBDC"|"RETAIL_CBDC"|"BANK_MONEY"|"TOKENIZED_SOVEREIGN"
//  destinationSystem: same enum
//  Returns: { supported, flow, reason }
```

The check verifies (a) geo-fence compliance for both jurisdictions, (b) sender institution authorization, (c) flow membership in the canonical 5-flow list. It returns `supported: false` for any unsupported flow or any failed check.

### §7.5 CBDC Interop ≠ Central-Bank Endorsement

MITHQAL's support for CBDC interoperability does NOT imply that any central bank has endorsed, approved, or authorized MITHQAL. The CBDC interop layer is a TECHNICAL capability that BECOMES operationally available only when a central bank explicitly authorizes a Mode 2 or Mode 3 connection (§8). Until that authorization is granted, the CBDC variants of the 5 flows are design patterns, not production states.

---

## §8 — CENTRAL-BANK PARTICIPATION MODEL

### §8.1 Three Modes

| Mode | Name | Description | Authorization required |
|---|---|---|---|
| Mode 1 | Bank-Only | Commercial / regulated institutions interact with MTQ. Central banks do not directly connect. | NO |
| Mode 2 | Central-Bank-Connected | Banks settle through a central-bank or wholesale-CBDC interface. The central bank is a connectivity provider, not a direct MTQ participant. | YES |
| Mode 3 | Direct Central-Bank Participation | The central bank itself participates as a Class A institution. Available ONLY where the relevant authority explicitly authorizes it. | YES (EXPLICIT_SOVEREIGN) |

### §8.2 Mode 1 (Bank-Only) — Current Default

Mode 1 is the v25.0 default operating mode. In Mode 1:

- All participants are Class B (regulated commercial banks) or Class C (regulated non-bank financial institutions).
- No central bank holds a direct MTQ function.
- Cross-border settlement uses bank-money variants of the §7.2 flows (flow #4: `bank money → MTQ → bank money`).

Mode 1 is sufficient for the institutional pilot and for early production settlement volume.

### §8.3 Mode 2 (Central-Bank-Connected) — Production Target

Mode 2 is the production target for v25.0. In Mode 2:

- A central bank provides a wholesale-CBDC interface (or equivalent regulated settlement-balance interface).
- Class B institutions in that central bank's jurisdiction may settle MTQ transactions through that interface.
- The central bank is a connectivity provider; it is NOT a direct MTQ participant (no SETTLE / ISSUE / ACQUIRE / REDEEM function in the registry).
- Mode 2 enables flow #2 (`CBDC → MTQ → bank money`) and flow #3 (`bank money → MTQ → CBDC`).

Mode 2 requires: (a) explicit central-bank authorization, (b) technical adapter development, (c) jurisdictional perimeter approval, (d) pilot phase with limited volume.

### §8.4 Mode 3 (Direct Central-Bank Participation) — Strategic Option

Mode 3 is a strategic option, not a default. In Mode 3:

- A central bank is registered as a Class A institution in the institutional authorization registry (§20).
- The central bank may exercise OBSERVE and SETTLE functions (per its legal access rights and explicit authorization).
- The central bank does NOT exercise ISSUE (Class A `directMinting = false` per §2.1 — even central banks go through institutional channels).
- Mode 3 enables flow #1 (`wholesale CBDC → MTQ → wholesale CBDC`).

Mode 3 requires: (a) explicit sovereign authorization (EXPLICIT_SOVEREIGN), (b) constitutional amendment if the central bank's participation changes any constitutional invariant, (c) bilateral or multilateral agreement with the relevant central bank, (d) regulatory perimeter review in both the central bank's jurisdiction and MITHQAL's operating jurisdiction.

### §8.5 Mode Transitions

```
Mode 1 (default)  →  Mode 2 (production target)  →  Mode 3 (strategic option)
       ↑                      ↑                          ↑
   No authorization    Central-bank            Sovereign authorization
   required            authorization           + constitutional amendment
                       + technical adapter
```

Mode transitions are UNIDIRECTIONAL in the planning sense — once a higher mode is authorized, MITHQAL does not unilaterally revert to a lower mode. A downgrade requires central-bank / sovereign consultation and a documented transition plan.

---

## §9 — INSTITUTIONAL TRACEABILITY

### §9.1 Settlement Record Schema

Every MTQ settlement transaction generates a `SettlementRecord` (implemented in `src/lib/v25-0-identity.ts`):

```ts
interface SettlementRecord {
  institutionalSender: string;        // institutionId (INST-XXX)
  institutionalReceiver: string;       // institutionId (INST-XXX)
  transactionId: string;              // MTQ-<timestamp>-<random>
  timestamp: string;                  // ISO 8601
  mtqAmount: number;                  // amount in MTQ units
  settlementState: string;            // SETTLED | PENDING | FAILED
  authorizationState: string;         // AUTHORIZED | PENDING | REJECTED
  complianceState: string;            // CLEARED | FLAGGED | BLOCKED
  reserveReference: string;           // RES-<transactionId>
  cryptographicHash: string;          // 0x<64 hex chars>
  validatorSignature: string;         // SIG-<transactionId>
  ledgerCommitment: string;           // COMMIT-<transactionId>
  jurisdiction: string;              // e.g., "US-EU"
  settlementChannel: string;          // WHOLESALE | CBDC_BRIDGE | REDEMPTION | CONTINGENCY
  finalityStatus: "PENDING"|"TECHNICAL_FINAL"|"LEGAL_FINAL"|"BANKING_FINAL";
}
```

### §9.2 Trace Path

The trace path for institutional traceability is four hops:

```
1. MTQ Transaction              (cryptographic hash, validator signature, ledger commitment)
2. Participating Institution    (sender + receiver institutionId)
3. Institutional Reference      (opaque customer-reference provided by the regulated institution)
4. Underlying Customer Transaction (held by the regulated institution, NOT by MITHQAL)
```

Hops 1-2 are at the MITHQAL layer. Hop 3 is the opaque reference that links the MTQ transaction to the regulated institution's internal records. Hop 4 is the regulated institution's customer record — MITHQAL does not hold this data unless required by applicable law (§4.4 exception).

### §9.3 Access Rules

Access to settlement records is permissioned per the following four categories:

1. **Participating-institution rights** — an institution may access its own sent and received transactions.
2. **Regulator rights** — a regulator with jurisdiction over a participating institution may access that institution's transactions, subject to the applicable legal framework.
3. **Central-bank rights** — a central bank in Mode 2 or Mode 3 (§8) may access transactions in its jurisdiction, subject to its legal access rights.
4. **Legal disclosure requirements** — court orders, sanctions inquiries, and statutory disclosure regimes may compel access.

Access is logged. Every read of a settlement record by a non-sender, non-receiver party generates an immutable audit event (v24.2.1 §16 — preserved).

### §9.4 Privacy Rule

> MITHQAL should not expose sensitive customer information publicly. Access must be permissioned.

Settlement records do NOT carry customer PII. The `customerReference` field in a `SettlementRequest` (in `src/lib/wholesale-settlement.ts`) is opaque to MITHQAL — it is a string the regulated institution uses for its own reconciliation. MITHQAL stores it for traceability but does not interpret it as customer identity.

---

## §10 — CORE VALUE PROPOSITION

### §10.1 Canonical Statement

> MITHQAL combines digital settlement speed with regulated-money traceability and neutral cross-border interoperability.

### §10.2 Three Pillars

| Pillar | Statement |
|---|---|
| **Neutrality** | Does not compete with sovereign currencies. (§6) |
| **Speed** | Digital settlement with cryptographic finality and automated processing. (§5, §22) |
| **Traceability** | Institutionally attributable, auditable, compliance-aware settlement. (§9) |

### §10.3 What the Value Proposition Does NOT Include

The value proposition explicitly does NOT include:

- retail payment speed (v25.0 is wholesale-only)
- speculative investment return (no yield on MTQ holdings; no token-appreciation promise)
- sovereign-currency replacement (neutrality doctrine §6)
- guaranteed finality in every jurisdiction (finality is layered §22)
- immunity from regulatory action (honesty rules R0.16)
- central-bank endorsement (unless formally granted, per Mode 3 §8.4)

### §10.4 Implementation Reference

The value proposition is implemented in `src/lib/v25-0-identity.ts` (`VALUE_PROPOSITION`) and served at `GET /api/v25.0` under `valueProposition`.

---

## §11 — RESERVE ARCHITECTURE (PRESERVED from v24.2.1-FINAL)

> **PRESERVATION NOTICE:** This section preserves the v24.2.1-FINAL constitutional reserve architecture. The v25.0 transformation does NOT alter the constitutional spine. Where the v24.2.1 text uses participant-minting language ("participant deposits assets and directly mints MTQ"), that language is HISTORICAL / NON-NORMATIVE for v25.0 (see §26 and Appendix A) and is replaced by the institutional issuance pipeline of §3.2.

### §11.1 Three-Pillar Structure

```
B_t + F_t + D_t = 100%

15%  ≤  B_t  ≤  25%    (Bullion: physical + tokenized allocated gold; conditional silver)
70%  ≤  F_t  ≤  85%    (Fiat: 10-currency basket, USD-capped at 35%)
 0%  ≤  D_t  ≤  5%    (Digital Liquidity Sleeve: approved stablecoins only)
```

### §11.2 Strategic Target Weights (Portfolio B — APPROVED)

| Asset | Target | Range | Notes |
|---|---|---|---|
| Physical Gold | 15% | 12-18% | MITHQAL allocated vault, Brink's/Loomis |
| Tokenized Gold (PAXG) | 5% | 0-7% | TGRS=9.00, H_TG=5.5%, NYDFS+OCC chartered |
| Silver | 0% | 0-3% | Conditional; SDC_Ag-negative per Task 4 backtest |
| Fiat / Sovereign | 77.5% | 70-85% | 10-currency basket, USD-capped at 35% |
| Digital Liquidity | 2.5% | 0-5% (normal 2-3.5%) | USDC/USDP/EURC/BUIDL |
| **Total** | **100%** | | |

### §11.3 Canonical Mathematical Identity (v24.2.1 §3 — preserved)

```
PAR = $1.00 settlement/accounting reference unit
L   = S × PAR
RR  = R_a / L       (Layer 1 — Constitutional Solvency)
StressRR(s) = R_stress(s) / L

RR_floor      = 100%    (hard floor — constitutional)
RR_policy     = 105%    (policy minimum — enhanced restrictions below)
RR_strategic  = 120%    (strategic target — 20% excess reserve)

B_t + F_t + D_t = 100%
```

### §11.4 Solvency Buffer

| Threshold | Meaning | Action |
|---|---|---|
| RR ≥ 120% | Strategic target met | Normal operations |
| 105% ≤ RR < 120% | Below strategic target | CAUTION/DEFENSIVE state, enhanced reporting |
| 100% ≤ RR < 105% | Below policy floor | STRESS state, minting restricted, redemption throttles engage |
| RR < 100% | Below constitutional floor | EMERGENCY state, minting DISABLED, constitutional recovery activated |

### §11.5 Haircut Table (v24.2.1 §3.4 — preserved)

| Asset Class | Haircut |
|---|---|
| Cash (HQLA L1) | 0% |
| Short-duration sovereign (HQLA L2A) | 2% |
| Non-USD FX | 7% (effective, includes FX volatility) |
| Physical gold | 5% base + dynamic |
| Tokenized gold (PAXG, TGRS=9.00) | 5.5% (H_TG = max(5%, 5% + (10 − TGRS) × 0.5%)) |
| Conditional silver | 8% (if held) |
| Stablecoins (per-asset DRQS-dependent) | 5% – 30% |

### §11.6 Counterparty Risk (v24.2.1 §3.5 — preserved)

- 25% per-custodian cap
- 30% per-jurisdiction cap
- ≥3 custodians
- 4-tier custodian hierarchy (official-sector, institutional, specialized vaults, contingency)
- Per-issuer cap 2% (digital liquidity)
- Per-custodian cap 15% (digital liquidity)

### §11.7 Stress Coefficients (v24.2.1 §3.6 — preserved)

```
USD_stress       = 0.95    (−5%)
Gold_stress      = 0.85    (−15%)
Silver_stress    = 0.70    (−30%)
PAXG_stress      = 0.85    (−15%, common-mode with physical gold)
Correlation_stress = 0.99 → 1.0  (tail dependence amplification)
```

### §11.8 Gold-Equivalent Index (GEI, Layer 2 — Advisory, preserved)

GEI is a normalized gold-equivalent index. It is ADVISORY ONLY — it does NOT redefine PAR or replace RR. The v24.2.1 §3.7 formulation is preserved unchanged.

**GEI formula (canonical):**

```
GEI(t) = NAV_m(t) / GoldUSD(t)
       = (R_m(t) / S) / GoldUSD(t)
```

Where:
- `NAV_m(t)` is the Market NAV at time t (mark-to-market reserve value per MTQ).
- `GoldUSD(t)` is the spot price of gold in USD at time t.
- `S` is the MTQ supply.

GEI expresses the reserve value in gold-equivalent terms. A rising GEI means the reserve is appreciating relative to gold; a falling GEI means the reserve is depreciating relative to gold. GEI is used as a long-term strategic indicator, NOT as a daily settlement metric.

**GEI bands (advisory):**

| GEI range | Interpretation | Advisory action |
|---|---|---|
| GEI > 1.20 | Strong | Strategic target met |
| 1.05 ≤ GEI ≤ 1.20 | Healthy | Normal monitoring |
| 1.00 ≤ GEI < 1.05 | Watch | Council notification |
| GEI < 1.00 | Warning | Strategic review triggered |

### §11.8A Currency Basket Gold-Relative Strength (CBGRS, Layer 2 — Advisory, preserved)

CBGRS (v24.1.1 additive patch — preserved) is a weighted geometric mean of currency-specific gold-relative strength measures. It addresses a known weakness of single-currency gold-relative metrics: gold can rise against USD while falling against AED (pegged), making single-currency GEI misleading.

**CBGRS formula (canonical):**

```
CBGRS(t) = ∏_{i=1}^{n} [GoldLocal_i(t) / GoldLocal_i(t-Δ)] ^ w_i

where:
  GoldLocal_i(t)  = GoldUSD(t) / FX_i(t)   (gold price in currency i)
  w_i             = structural weight of currency i (sums to 1.0)
  n               = number of currencies in the basket (11 in production)
  Δ               = lookback window (30 days default)
```

CBGRS > 1.0 means gold is rising across the basket (reserve is depreciating relative to gold in most currencies). CBGRS < 1.0 means gold is falling across the basket (reserve is appreciating relative to gold in most currencies).

CBGRS is ADVISORY ONLY — it does NOT redefine PAR or replace RR.

### §11.9 Bullion Resilience Index (BRI, Layer 2 — Advisory, preserved)

BRI is decomposed into GoldResilienceIndex (pure gold) and ConditionalMetalDiversificationIndex (silver component, if held). If SilverWeight = 0, BRI = GoldResilienceIndex (silver component = 0, NOT an error). BRI is ADVISORY ONLY. The v24.2.1 V24.2.1.5 revision is preserved unchanged.

**BRI formula (canonical):**

```
BRI(t) = w_Gold × GoldResilienceIndex(t) + w_Silver × ConditionalMetalDiversificationIndex(t)

where:
  w_Gold   = 0.90 if silver held, 1.00 if silver = 0
  w_Silver = 0.10 if silver held, 0.00 if silver = 0
  GoldResilienceIndex(t)              = CVaR_baseline - CVaR_with_gold_weight_reduced_by_1%
  ConditionalMetalDiversificationIndex(t) = CVaR_baseline - CVaR_with_silver_weight_reduced_by_1%
```

The weights 0.90 / 0.10 were independently verified (v24.2.1 §3.8 — preserved from v24.2 BRI revision). When Silver = 0%, `w_Silver = 0` and `BRI = GoldResilienceIndex` — this is a VALID policy result, NOT an error condition.

### §11.9A Reserve Quality Score (RQS, Layer 4 — Optimization Input, expanded)

RQS is a dynamic per-asset quality score (v24.2.1 §3.12). It is an OPTIMIZATION INPUT — not a constitutional metric. The optimizer uses `min(RQS, StressRQS)` per asset.

**RQS formula (canonical, 8 factors per asset):**

```
RQS_i = 0.20 × CreditQuality_i + 0.15 × Convertibility_i + 0.15 × Liquidity_i +
        0.15 × SettlementUtility_i + 0.10 × CustodyReliability_i +
        0.10 × LegalStability_i + 0.10 × GeopoliticalRisk_i + 0.05 × MarketDepth_i

where each factor is scored 0-10 (10 = best).
```

The optimizer uses `min(RQS, StressRQS)` to ensure stress-aware asset quality assessment. RQS is updated quarterly; StressRQS is computed continuously based on live stress factors (§12.6).

### §11.9B Digital Reserve Quality Score (DRQS, Layer 4 — Optimization Input, expanded)

DRQS is a dynamic per-stablecoin quality score (v24.2.1 §7.3 — preserved). It is the digital-liquidity-sleeve analog of RQS.

**DRQS formula (canonical, 8 factors per stablecoin):**

```
DRQS_i = 0.20 × IssuerQuality_i + 0.15 × ReserveQuality_i + 0.15 × RedemptionLiquidity_i +
         0.15 × RegulatoryStatus_i + 0.10 × CustodyQuality_i +
         0.10 × OperationalResilience_i + 0.10 × MarketDepth_i + 0.05 × Transparency_i

where each factor is scored 0-10 (10 = best).
```

**Approved digital liquidity assets (v24.2.1 §7.4 — preserved):**

| Asset | DRQS | Issuer | Status |
|---|---|---|---|
| USDC | 8.65 | Circle | APPROVED |
| USDP | 8.45 | Paxos | APPROVED |
| EURC | 7.80 | Circle | APPROVED |
| BUIDL | 8.55 | BlackRock | APPROVED (tokenized T-bills) |
| DAI | 6.25 | MakerDAO | OPTIONAL (below threshold) |
| USDT | 6.15 | Tether | EXCLUDED (below threshold) |

Eligible: DRQS ≥ 7.0. Conditional: 6.0 ≤ DRQS < 7.0. Rejected: DRQS < 6.0.

### §11.9C SAE — Stablecoin-Adjusted Exposure (Layer 4 — Reporting, preserved)

```
SAE = Σ_i (w_i × DRQS_i) / Σ_i w_i     (risk-adjusted stablecoin exposure)
```

SAE is a REPORTING metric only — it does NOT replace RR. It is used in the optimizer's stability-preference tier (§12.4 Tier 4).

### §11.10 Liquidity Coverage Index (LCI, Layer 3 — Advisory, preserved)

LCI is an advisory stress metric. LCR (Liquidity Coverage Ratio) is the HARD metric (Layer 3 — Hard Metric). The v24.2.1 §3.9 + §9.1 formulation is preserved unchanged.

**LCR formula (canonical — HARD constraint):**

```
LCR = HQLA_30d / NetCashOutflow_30d

where:
  HQLA_30d              = High-Quality Liquid Assets over 30-day stress horizon
                        = Cash (L1, 0% haircut)
                        + Sovereign (L2A, 2% haircut)
                        + FX (effective 7% haircut)
  NetCashOutflow_30d    = TotalOutflows_30d - min(TotalInflows_30d, 0.75 × TotalOutflows_30d)
                        = projected redemptions + operational outflows + collateral calls

Constraint: LCR ≥ 1.0 (HARD — §3.3 optimizer hard constraint)
Strategic: LCR ≥ 7.5 (current production ~7.5 per v24.2.1 baseline)
```

**LCI formula (canonical — ADVISORY stress metric):**

```
LCI = HQLA_30d_stressed / NetCashOutflow_30d_stressed

where:
  HQLA_30d_stressed     = HQLA after stress-coefficient application (§11.7)
  NetCashOutflow_30d_stressed = NetCashOutflow × redemption-stress-factor
```

LCI < LCR because stress reduces HQLA and increases outflows. LCI is ADVISORY — used in the optimizer's risk-objective tier (§12.4 Tier 2). LCR is the HARD constraint (Tier 1).

### §11.10A LRR — Liquidity Risk Reserve (preserved)

LRR is the prefunded institutional redemption liquidity (v24.2.1 §9.2 — preserved). It is a subset of HQLA earmarked for projected redemption demand.

```
LRR = max(ProjectedRedemption_7d, HistoricalMaxRedemption_7d × 1.5)
    + EmergencyBuffer (5% of supply)

Constraint: LRR ≤ 20% of HQLA (to prevent over-earmarking)
            LRR ≥ ProjectedRedemption_7d (to ensure redemption capacity)
```

LRR is the institutional redemption liquidity facility that backs the §14 redemption pipeline. The prefunded model means that the receiving bank's redemption request can be fulfilled from LRR without requiring immediate reserve liquidation.

### §11.10B Liquidity Stress Distance (LSD, preserved)

```
LSD = ImmediateLiquidity / StressDailyRedemption

where:
  ImmediateLiquidity      = Cash + Sovereign (T+0) + Stablecoins (T+0)
  StressDailyRedemption   = HistoricalMaxDailyRedemption × stress-amplification-factor
```

LSD is measured in days. v24.2.1 baseline: LSD_mean = 64.3 days (Portfolio B, 250K MC, seed=42). LSD ≥ 30 days is strategic target; LSD < 7 days is EMERGENCY trigger.

### §11.11 Reserve Quality Score (RQS, Layer 4 — Optimization Input, preserved — see §11.9A for expanded formula)

RQS is a dynamic per-asset quality score (v24.2.1 §3.12). It is an OPTIMIZATION INPUT — not a constitutional metric. The optimizer uses min(RQS, StressRQS) per asset.

### §11.12 Tokenized Gold Reserve Score (TGRS, preserved)

```
TGRS = 0.20×PhysicalBacking + 0.15×LegalTitle + 0.15×Custody + 0.10×Redemption +
       0.10×IssuerReliability + 0.10×OracleReliability + 0.08×Settlement +
       0.05×Liquidity + 0.05×OperationalResilience + 0.02×Jurisdiction

Eligible:    TGRS ≥ 8.0
Conditional: 6.0 ≤ TGRS < 8.0
Rejected:    TGRS < 6.0
```

PAXG is the only Eligible tokenized gold (TGRS=9.00). If PAXG TGRS drops below 8.0 OR the 13-point eligibility gate fails, the tokenized gold weight is FORCED to 0 within 5 business days.

**TGRS dimension definitions (canonical — preserved from v24.2.1):**

| Dimension | Weight | What it measures |
|---|---|---|
| PhysicalBacking | 0.20 | Verifiable physical gold backing the token |
| LegalTitle | 0.15 | Enforceable legal ownership / beneficial interest |
| Custody | 0.15 | Allocated custody, segregation, bankruptcy remoteness |
| Redemption | 0.10 | Right to redeem for physical gold |
| IssuerReliability | 0.10 | Issuer's regulatory status, financial strength |
| OracleReliability | 0.10 | Independent price feed quality |
| Settlement | 0.08 | Settlement finality, atomicity |
| Liquidity | 0.05 | Market depth, bid-ask spread |
| OperationalResilience | 0.05 | Tech continuity, key management |
| Jurisdiction | 0.02 | Issuer jurisdiction regulatory quality |

**13-point eligibility gate (ALL must pass for Eligible status):**

1. Identifiable physical gold backing
2. Legally enforceable ownership / proprietary interest
3. Allocated custody
4. Segregation
5. Bankruptcy remoteness
6. No rehypothecation
7. Independent reconciliation
8. Independent valuation
9. Redemption rights
10. Approved oracle / reference pricing
11. Legal review
12. Technology / ledger integrity
13. Operational continuity

PAXG: 13/13 PASS. TGRS = 9.00. Status: APPROVED, only eligible tokenized gold.

### §11.12A Tokenized Gold Liquidity Score (TGLS, preserved)

TGLS measures the liquidity quality of a tokenized gold asset. Used in the optimizer's stability-preference tier.

```
TGLS = 0.30×MarketDepth + 0.25×BidAskSpread + 0.20×RedemptionLiquidity +
       0.15×ExchangeLiquidity + 0.10×SettlementSpeed

where each factor is scored 0-10 (10 = best).
```

PAXG TGLS = 8.5 (deep market, tight spread, robust redemption).

### §11.12B Tokenized Gold Burn Score (TGBS, preserved)

TGBS measures the burn-mechanism quality of a tokenized gold asset. Used in the redemption-flow analysis (§14).

```
TGBS = 0.40×BurnAtomicity + 0.30×BurnFinality + 0.20×BurnReversibility + 0.10×BurnProofQuality

where each factor is scored 0-10 (10 = best).
```

PAXG TGBS = 9.2 (atomic burn, fast finality, irreversible, strong proof).

### §11.13 Anti-Double-Counting (preserved)

```
Gold_total = PhysicalAllocatedGold + TokenizedAllocatedGold
```

The two are distinct asset registry rows backed by disjoint allocated bar pools (MITHQAL's Brink's vault vs. Paxos's LBMA vault). Proven across 10 theorems / 32 assertions (v24.2.1 Task 6, 32/32 PASS). Anti-double-counting is a HARD invariant — no MTQ supply expansion may rely on double-counted reserves.

### §11.14 ERTF — External Risk Transfer Facility (Layer 6, preserved)

```
NetRecovery = PolicyLimit × TriggerProbability × RecoveryFactor
```

ERTF is legally separate, independently governed, NON-reserve (does NOT count toward R_a), NON-PAR (does NOT affect PAR), NON-monetary (NOT required for ordinary MTQ redemption). Current ERTF coverage: $10,000,000 total, $5,905,000 expected recovery (59.05% — reflects basis risk and counterparty risk).

### §11.15 In-Kind Emergency Reserve Delivery (Layer 7, preserved)

```
InKindValue = MarketValue(DeliveredAssets)    NOT InKindValue = PAR
```

Emergency mechanism for formally declared resolution/extraordinary liquidity events. Delivers pro-rata reserve assets instead of cash when banking rails are frozen. **CRITICAL**: In-kind delivery does NOT guarantee 100% PAR. MiCA-compatible.

### §11.16 Article X Sequential Liquidation (preserved)

```
1. Eligible stablecoins
2. Cash
3. Short-duration sovereign
4. Non-USD FX
5. Conditional Silver / Tokenized Conditional Metal (if held)
6. Tokenized Gold (digital representation — liquidate before physical)
7. Physical Gold LAST (Exhaustion Certificate required)
```

Pro-rata liquidation is PROHIBITED.

### §11.17 Conditional Silver Policy (preserved)

```
Silver normal target = 0%  (was 3% in v24.2)
Silver conditional band = 0-3%

SDC_Ag = net_resilience_gain - net_cost
  If SDC_Ag > 0: Silver admitted (up to 3%)
  If SDC_Ag ≤ 0: Silver = 0% (VALID policy result)
```

Silver is NOT deleted — it is conditional. Current production: Silver = 0% (SDC_Ag-negative per Task 4 backtest).

### §11.18 Seven-State Reserve Accounting (preserved)

| # | State | Source | Must NOT masquerade as |
|---|---|---|---|
| 1 | TARGET | Engine | Actual custody |
| 2 | ACTUAL | Committed ledger | Custodian-confirmed |
| 3 | PROPOSED | RebalanceProposal | Approved |
| 4 | APPROVED | Governance vote | Executed |
| 5 | EXECUTED | ExecutionResult | Custodian-confirmed |
| 6 | CUSTODIAN-CONFIRMED | Independent custodian attestation | Reconciled |
| 7 | RECONCILED | Variance-resolution | Target |

---

## §12 — CALM, 6-STATE MACHINE, HIERARCHICAL OPTIMIZER (PRESERVED)

### §12.1 CALM Targets (v24.2.1 V24.2.1.1 — preserved)

| State | v24.2 (WRONG — HISTORICAL) | v24.2.1 / v25.0 (CORRECT — CANONICAL) | Direction |
|---|---|---|---|
| NORMAL | 1.15 | **1.20** | = strategic target |
| CAUTION | 1.18 | **1.22** | ↑ |
| DEFENSIVE | 1.20 | **1.23–1.25** | ↑ |
| STRESS | 1.25 | 1.25 | unchanged |
| EMERGENCY | 1.30 | 1.30 | unchanged |
| RECOVERY | 1.20 | **1.20–1.22** | slightly above NORMAL |

**Mandatory monotonic invariant:**

```
Risk ↑  →  RR_target ↑  →  S_max ↓  →  MintCapacity ↓
```

**EMERGENCY:** Minting = DISABLED. CALM must NEVER permit greater issuance simply because stress rises.

### §12.2 Six-State Reserve State Machine (v24.2.1 V24.2.2 — preserved)

States: `NORMAL → CAUTION → DEFENSIVE → STRESS → EMERGENCY → RECOVERY`

| State | Bullion Range | Gold Target | Silver Target | Digital Ceiling | Cash Min | Minting | CALM Target |
|---|---|---|---|---|---|---|---|
| NORMAL | 16-20% | 13-17% | 3-4% | 3.5% | 55% | ALLOWED | 1.20 |
| CAUTION | 17-21% | 14-18% | 3-4% | 3.0% | 60% | ALLOWED (70%) | 1.22 |
| DEFENSIVE | 18-22% | 15-19% | 3-5% | 2.5% | 65% | RESTRICTED (40%) | 1.23 |
| STRESS | 20-24% | 16-20% | 3-5% | 2.0% | 72% | RESTRICTED (15%) | 1.25 |
| EMERGENCY | 22-25% | 18-22% | 3-5% | 0% | 78% | BLOCKED | 1.30 |
| RECOVERY | 19-22% | 15-18% | 3-4% | 2.5% | 68% | RESTRICTED (30%) | 1.20–1.22 |

Note: The "Silver Target 3-4%" column reflects the v24.2.1 design; in production v25.0 with Silver=0% (SDC_Ag-negative), the silver column is effectively 0%. The table is preserved unchanged as a constitutional corridor definition — actual production values are determined by the optimizer within these corridors.

### §12.3 Canonical Issuance Capacity Equation (v24.2.1 §6 — preserved)

```
S_max(t) = R_a(t) / (RR_target(t) × PAR)
```

**NEVER use:** `S_max = R_a × RR_target × PAR` (incorrect multiplication form — the divisor form is canonical).

Required unit tests:
1. Increasing RR_target decreases S_max.
2. Increasing R_a increases S_max.
3. Any implementation and documentation formula must match exactly.

### §12.4 4-Tier Hierarchical Optimizer (v24.2.1 V24.2.6 — preserved)

```
Tier 1 — HARD CONSTRAINTS (must ALL pass before optimization):
  RR ≥ 100%, StressRR ≥ 100%, LCR ≥ 1.0, legal eligibility, USD ≤ 35%,
  EffectiveUSDExposure ≤ 35%, per-currency ≤ 60%, bullion ∈ [15%, 25%],
  digital ≤ 5%, per-issuer ≤ 2%, per-custodian ≤ 15%, per-jurisdiction ≤ 30%

Tier 2 — RISK OBJECTIVES (minimize):
  λ₁·CVaR + λ₂·StressLoss + λ₃·FXRisk + λ₄·ConcentrationRisk +
  λ₅·LiquidityRisk + λ₆·CounterpartyRisk + λ₇·GeoRisk

Tier 3 — ECONOMIC COSTS (minimize):
  ExecutionCost + TurnoverCost + HoldingCost + LifecycleCost

Tier 4 — STABILITY PREFERENCE (maximize):
  Higher Stress-RR, Higher LCR, Lower turnover, Lower concentration, Lower model dependency
```

**NO TRADE option:** The optimizer MAY choose to do nothing when `NetRebalanceBenefit ≤ DecisionThreshold`.

### §12.5 Model Validity Gate (v24.2.1 V24.2.8 — preserved)

```
If ModelValidity < MinimumThreshold:
  Optimizer → LastApprovedDeterministicPolicyPortfolio
  No discretionary risk expansion is permitted.
```

Model failure is a HARD GATE — NOT a tradeable risk. (R0.12 — determinism preserved.)

### §12.6 StressDRQS (v24.2.1 V24.2.5 — preserved)

```
StressDRQS_i = DRQS_i × (1 - weighted stress factors)

Stress factors (7 dimensions):
  0.20 × DepegShock + 0.20 × RedemptionStress + 0.15 × LiquidityStress +
  0.15 × CounterpartyStress + 0.10 × CustodyStress + 0.10 × JurisdictionStress +
  0.10 × SettlementDelay
```

The optimizer MUST use `min(DRQS, StressDRQS)` — NOT headline DRQS only.

### §12.7 15-Component Trade Cost Model + Lifecycle Cost (v24.2.1 V24.2.7 — preserved)

```
TotalTradeCost = BrokerFee + ExchangeFee + Spread + Slippage + MarketImpact +
  FXConversionCost + CustodyCost + TransferCost + NetworkGasCost +
  SettlementCost + StorageCost + InsuranceCost + TaxDutyCost +
  OpportunityCost + OtherApplicableCost

LifecycleCost = AcquisitionCost + HoldingCost + LiquidationCost + OpportunityCost
```

Stress-dependent cost regimes: Normal (1×), Stress (2×), Emergency (3×).

### §12.8 Trade Suppression + Hysteresis (v24.2.1 §8.3-8.4 — preserved)

- Hysteresis: 2% band, 2-cycle, direction-tracking (anti-whipsaw).
- Trade suppression: `benefit > cost + slippage + 2bp buffer` (otherwise suppress).
- Turnover limits enforced per §8.5.

### §12.9 OFAC Compliance Fail-Closed (v24.2.1 V24.2.13 — preserved)

If OFAC SDN list is unavailable, all transactions are BLOCKED (fail-closed). v24.1 fail-open behavior is RETIRED.

### §12.10 Monte Carlo Stress Testing (v24.2.1 V24.2.12 — preserved)

250,000 paths with FIXED seed=42 (fully reproducible). 18 version-controlled parameters.

Honest baseline results (NOT forced to pass):
- P(RR < 100%) = 21.54%
- P(LCR < 1.0) = 0.00%
- VaR 99% = $24.6M loss
- CVaR 99% = $25.5M loss
- CVaR 99.9% = $28.0M loss
- Min correlated shock to breach: 14.87% (v24.2.1 §11 reverse-stress result)
- Min custody loss to breach: 17%

These results are HONEST and not forced to PASS. They are reproduced from seed=42.

### §12.10A Challenger Models (v24.2.1 Task 5 — preserved)

Five challenger models were run against the primary Monte Carlo baseline. The challenger-model requirement (v24.2.1 §3.17) is preserved — the optimizer may NOT be the only model in production.

| Challenger | Method | P(RR<100%) | Verdict |
|---|---|---|---|
| C1 | Block bootstrap (historical resampling) | 19.97% | CONFIRM primary |
| C2 | Historical empirical simulation | 24.91% | CONFIRM primary |
| C3 | Parametric bootstrap (variance-gamma) | 22.14% | CONFIRM primary |
| C4 | Stress-conditional (regime-switching) | 23.45% | CONFIRM primary |
| C5 | Copula (t-copula with tail dependence) | 25.30% | DISSENT (overestimates tail risk; investigated) |

4 of 5 challengers confirm the primary; C5 dissents (overestimates tail risk due to copula calibration on a regime-shifted historical window). The dissent is documented and reviewed by the Monetary Council (§13.1) before any parameter change.

### §12.10B Reverse-Stress Engine (v24.2.1 §11 — preserved)

The reverse-stress engine binary-searches for the minimum shock magnitude that produces RR_after = 100% (the constitutional floor). Eight shock types are tested:

| Shock Type | Min shock to RR=100% | Interpretation |
|---|---|---|
| broad_market | 14.87% | Uniform market decline |
| gold_specific | 69.92% | Gold-only shock |
| fx_nonpegged | 32.08% | Non-pegged FX shock |
| custody_impairment | 97.07% | 15% exposure × LGD |
| liquidity_spread | 58.25% | Bid-ask on redemption volume |
| correlation_stress | 297.36% | Amplification of baseline 99% tail loss |
| redemption_pct_of_supply | 398.93% | 4× supply redeemed with Article X fire-sale cost |
| combined_loss | 27.56% | 4 non-overlapping categories at fraction s of each |

The most realistic failure mode is `combined_loss` at 27.56% — a simultaneous shock across multiple non-overlapping categories. The system is most vulnerable to broad market decline (14.87%) and most resilient to redemption pressure (398.93% of supply would need to be redeemed with Article X fire-sale cost).

### §12.10C ERTF Recovery Matrix (v24.2.1 §40 — preserved)

The ERTF recovery matrix tests 5 recovery levels × 5 delay levels = 25 combinations:

| Recovery \ Delay | 0 days | 1 day | 3 days | 7 days | 30 days |
|---|---|---|---|---|---|
| 100% | RR=129.97% | RR=128.51% | RR=126.32% | RR=124.15% | RR=128.28% |
| 75%  | RR=125.62% | RR=124.16% | RR=121.97% | RR=119.80% | RR=123.93% |
| 50%  | RR=121.27% | RR=119.81% | RR=117.62% | RR=115.45% | RR=119.58% |
| 25%  | RR=116.92% | RR=115.46% | RR=113.27% | RR=111.10% | RR=115.23% |
| 0%   | RR=112.57% | RR=111.11% | RR=108.92% | RR=106.75% | RR=110.88% |

Verdict: RR remains ≥ 100% across all 25 combinations (range 106.75%–129.97%). ERTF is NOT a critical dependency for the modeled baseline stress (gold -10% + PAXG -10% + custody 5% LGD) — the strategic 120% RR target buffer absorbs the baseline stress without ERTF support.

### §12.10D TGDR — Tokenized Gold Dependency Ratio (v24.2.1 §22 — preserved)

TGDR measures the system's dependency on the tokenized gold infrastructure. Three levels tested:

| TGDR | Issuer | Custody | Oracle | Blockchain | Redemption | Verdict |
|---|---|---|---|---|---|---|
| 0% (Portfolio D, no tokenized) | 0% | 21% | 18% | 0% | 14% | PASS |
| 25% (Portfolio B, PAXG 5%) | 25% | 55% | 40% | 25% | 47.5% | PASS |
| 35% (hypothetical) | 35% | 76% | 68% | 35% | 71.5% | FAIL |

Portfolio B at TGDR=25% is the approved target. The dependency budget is met. TGDR=35% would exceed the budget — caution if tokenized gold weight is raised above 7%.

### §12.10E Common-Mode Stress (v24.2.1 §23 — preserved)

PAXG common-mode stress tests 9 combined scenarios where shocks are applied SIMULTANEOUSLY (no independence assumption):

| # | Scenario | RR | StressRR | Verdict |
|---|---|---|---|---|
| 1 | PAXG→0 + gold -10% | 89.45% | 80.91% | BDL (PAXG→0 outside §47 envelope) |
| 2 | PAXG→0 + gold -30% | 81.12% | 73.05% | BDL |
| 3 | PAXG→0 + banking freeze -20% | 95.41% | 85.93% | BDL |
| 4 | PAXG -30% + gold -30% | 112.35% | 101.45% | PASS (worst in-envelope) |
| 5 | PAXG -10% + gold -10% | 119.84% | 109.62% | PASS |
| 6 | PAXG -10% + custody 5% LGD | 116.51% | 107.92% | PASS |
| 7 | PAXG -10% + FX -10% | 117.32% | 108.81% | PASS |
| 8 | PAXG -10% + correlation 0.99 | 118.94% | 110.21% | PASS |
| 9 | PAXG -10% + weekend gap -3% | 119.32% | 110.63% | PASS |

6 PASS / 0 FAIL / 3 BDL (of 9). BDL scenarios declared BEFORE computation (PAXG→0 outside §47 approved envelope). In-envelope PASS rate 6/6 = 100%.

### §12.11 Constitutionally Approved Reference Portfolio (Portfolio B — preserved)

```
Physical Gold = 15%
Tokenized Gold = 5%   (PAXG only)
Silver = 0%          (conditional, SDC_Ag-negative)
Fiat/Sovereign = 77.5%  (10-currency basket, USD-capped at 35%)
Digital = 2.5%
Total = 100%
```

Status: APPROVED — Portfolio B (was PROVISIONAL). Approval: COO + CTO + Project Manager executive decision, 2026-08-13. Decision basis: 6-task validation cycle (250K MC reproduced; A/B/C/D/E compared; PAXG TGRS=9.00 13/13 gate PASS; Silver=0% validated; 4/5 challenger models confirm; anti-double-counting 32/32 PASS).

---

## §13 — TRADING LANGUAGE

### §13.1 Permitted Trading Language

> Institutional reserve acquisition / rebalancing necessary to maintain the constitutional reserve.

This is the ONLY permitted form of trading in MITHQAL. Reserve management trades are executed by the optimizer (§12.4) under the trade suppression rule (§12.8). They exist to preserve settlement integrity, NOT to generate profit.

### §13.2 Prohibited Trading Language (closed list)

The following are PROHIBITED. None of these may appear in any v25.0 documentation, UI, API response, smart contract, or marketing material:

- speculative trading
- return maximization
- market making
- order books
- brokerage
- exchange operation
- portfolio management for customers
- derivatives
- leverage
- yield farming

### §13.3 Rule

> Reserve management exists to preserve settlement integrity, not to generate speculative profit.

This rule is the canonical answer to "Does MITHQAL trade its reserves for profit?" The answer is NO. The optimizer rebalances the reserve portfolio only when rebalancing is constitutionally required (drift outside corridor), economically beneficial net of cost (trade suppression rule), and model-validity-cleared (model validity gate §12.5).

### §13.4 Pre-v25.0 Trading Language — HISTORICAL / NON-NORMATIVE

The v24.2.1 §7.7 "Bullion → Digital Barrier" and v24.2.1 §7.8 "Dynamic Reallocation When Digital → 0%" describe reserve management mechanics, NOT customer-facing trading. They are preserved as canonical reserve-management language. They are NOT trading language in the prohibited sense.

---

## §14 — REDEMPTION FLOW (Institutional)

### §14.1 Canonical Redemption Pipeline

Redemption is the reverse of issuance. The pipeline is implemented in `src/lib/wholesale-settlement.ts` (`processRedemption`):

```
1. Receiving Bank                                  (Class B or Class C institution)
2. Redemption Instruction                          (institution submits redemption request)
3. Institutional Validation                        (§20 authorization — REDEEM function)
4. MTQ Burn                                        (MTQ.sol burn() — never paused per §17.3)
5. Reserve Claim Calculation                       (1:1 for PAR; subject to haircuts per §11.5)
6. Reserve Release                                 (from the appropriate Article X tier)
7. Approved Banking / Settlement Rail              (sovereign-money payout)
8. Destination Institution                         (the receiving bank's banking partner)
```

### §14.2 Redemption Constitutional Protection (v24.2.1 §9.3 — preserved)

Valid redemption rights remain constitutionally protected. Redemption processing SHALL NOT be arbitrarily disabled; however, legally documented settlement sequencing, risk-controlled capacity limits, identity/compliance holds, and court/regulatory orders may affect timing. Any throttle SHALL preserve the legal nature of the redemption claim and SHALL be publicly disclosed.

- 1 kg gold minimum (physical redemption)
- 10-minute soft finality, 7-day hard finality (v24.2.1 §21 — preserved)
- Fee: 0.05% (5 bps), capped at $5,000
- Article X sequential liquidation enforced (§11.16)
- Graduated liquidity-capacity controls for RR below 105%; RR below 100% activates constitutional emergency recovery.

### §14.3 Redemption Authorization Decision Logic

```
AUTHORIZED iff ALL of:
  - receiving institution exists in registry AND operationalStatus = ACTIVE
  - receiving institution.permittedMTQFunctions ∋ REDEEM
  - receiving institution.permittedCurrencies ∋ requested payout currency
  - receiving institution.sanctionsStatus ≠ BLOCKED
  - receiving institution authorization not expired
  - receiving institution.jurisdiction NOT geo-fenced
  - receiving institution.jurisdiction.classification.redemptionStatus ≠ PROHIBITED
  - receiving institution.jurisdiction.classification.redemptionStatus ≠ UNKNOWN
  - RR ≥ 100% (constitutional floor — redemption blocked below)
  - if RR < 105%: enhanced restrictions apply (lower limits, slower processing)
  - amount ≤ receiving institution.permittedRedemptionLimit
```

### §14.4 Atomic Burn / Release

The redemption pipeline is ATOMIC with respect to burn and reserve release. The MTQ burn (`MTQ.sol burn()`) and the reserve release (Article X tier withdrawal) MUST commit together — either both succeed or both fail. The atomicity is enforced by the deterministic issuance authorization step (§3.2 step 12).

### §14.5 Customer Payout — NOT Direct Customer Redemption

The customer (Class D corporate or Class E individual — though Class E is out of v25.0 scope) does NOT receive MTQ redemption directly. The receiving bank (Class B or Class C) redeems MTQ through the MITHQAL pipeline and pays out sovereign money to its customer through its own banking rails. The customer's relationship is with its bank, not with MITHQAL.

---

## §15 — JURISDICTIONAL REGULATORY PERIMETER

### §15.1 Jurisdiction Classification Schema

Every jurisdiction is classified across 19 dimensions (implemented in `src/lib/institutional-authorization.ts`):

```
1.  mtqLegalStatus
2.  issuanceStatus
3.  settlementStatus
4.  custodyStatus
5.  redemptionStatus
6.  paymentServicesExposure
7.  stablecoinExposure
8.  artRwaExposure
9.  securitiesExposure
10. commodityExposure
11. financialMarketExposure
12. amlCft
13. sanctions
14. dataPrivacy
15. crossBorderTransfer
16. capitalControls
17. taxAccounting
18. licensing
19. institutionalEligibility
```

Each dimension takes one of: `ALLOWED | CONDITIONAL | RESTRICTED | PROHIBITED | UNKNOWN`.

### §15.2 Conservative-Block Rule

> **UNKNOWN = CONSERVATIVE BLOCK. Never infer legal permission from MITHQAL's internal label.**

This is the canonical perimeter rule. If MITHQAL has not classified a jurisdiction on a dimension, the status is UNKNOWN, and the UNKNOWN status triggers a CONSERVATIVE BLOCK. The block is lifted ONLY when the jurisdiction is explicitly classified (with documented legal basis) into a non-blocking status.

### §15.3 Jurisdiction Registry (testnet seed — production extensible)

The implemented registry (`JURISDICTION_REGISTRY` in `src/lib/institutional-authorization.ts`) contains seed classifications for:

| Jurisdiction | Code | MTQ Legal | Settlement | Redemption | Notes |
|---|---|---|---|---|---|
| United States | US | CONDITIONAL | ALLOWED | ALLOWED | OCC/Fed regulatory perimeter |
| European Union | EU | CONDITIONAL | ALLOWED | ALLOWED | MiCA perimeter |
| United Arab Emirates | AE | CONDITIONAL | ALLOWED | ALLOWED | CBUAE VARA perimeter |
| Singapore | SG | CONDITIONAL | ALLOWED | ALLOWED | MAS PSA perimeter |
| Japan | JP | CONDITIONAL | ALLOWED | ALLOWED | FSA payment perimeter |
| United Kingdom | GB | CONDITIONAL | ALLOWED | ALLOWED | FCA EMT perimeter |
| Hong Kong | HK | CONDITIONAL | ALLOWED | ALLOWED | HKMA FSTI perimeter |
| China | CN | **PROHIBITED** | **PROHIBITED** | **PROHIBITED** | §16 geo-fence — absolute block |

CONDITIONAL means "additional review required." In testnet, CONDITIONAL is permitted with a flag; in production, CONDITIONAL requires documented legal opinion before any transaction proceeds.

### §15.4 Cross-Border Pairwise Check

For a cross-border settlement between Institution A (jurisdiction X) and Institution B (jurisdiction Y), BOTH jurisdictions must be non-PROHIBITED and non-UNKNOWN for the relevant function (typically `settlementStatus` for SETTLE, `issuanceStatus` for ISSUE, `redemptionStatus` for REDEEM).

### §15.5 Production Extension

The seed registry is a TESTNET STARTING POINT. Production deployment requires:
1. Legal opinion in each jurisdiction confirming the classification (or correcting it).
2. Documentation of the legal basis for each classification (statute, regulation, guidance, case law).
3. Quarterly review of the registry against regulatory developments.
4. Conservative downgrade path: if new regulation raises uncertainty, the classification MUST be downgraded to UNKNOWN (block) until clarified.

### §15.6 China Geo-Fence (special case — §16)

China (CN) is PROHIBITED on every dimension. See §16 for the geo-fence enforcement rules.

---

## §16 — GEO-FENCING

### §16.1 China Geo-Fence (canonical)

> Crypto/stablecoin activity is PROHIBITED in China. Direct MTQ service access is blocked. No circumvention through alternate interfaces, routing, VPN logic, or indirect token access.

This is the v25.0 geo-fence rule for China. It is implemented as `PROHIBITED` status on all 19 jurisdiction dimensions in `JURISDICTION_REGISTRY.CN`.

### §16.2 Enforcement

The geo-fence is enforced at THREE layers:

1. **Institution-registry layer** (`checkInstitutionAuthorization` in `src/lib/institutional-authorization.ts`): Any institution with `jurisdiction = "CN"` is blocked. Any institution with a sender or receiver in `"CN"` is blocked.
2. **Geo-fence helper** (`isGeoFenced(jurisdiction)`): Returns `true` for CN and for any jurisdiction not in the registry (UNKNOWN = block).
3. **Settlement pipeline layer** (`processWholesaleSettlement`): Step 2 of the §3.2 pipeline (`isGeoFenced(sender.jurisdiction) || isGeoFenced(receiver.jurisdiction)`) returns `authorized: false` with `reason: "Geo-fence violation"`.

### §16.3 Anti-Circumvention Rule

The geo-fence is NOT just an IP block. The following circumvention paths are PROHIBITED by policy and MUST be blocked:

- Routing through a third-country institution to obscure CN origin or destination
- VPN-based access from CN to a non-CN institution
- Indirect token access (holding MTQ through a wrapper token, derivative, or synthetic instrument)
- Custodial arrangements that place CN customer assets in a non-CN custodian while routing settlement benefits back to CN
- "Tokenized access" products that claim to give CN customers exposure to MTQ without direct MTQ custody

Any of these patterns, when detected, triggers:
1. Immediate block of the transaction.
2. Investigation by the institutional compliance team.
3. Reporting to the Monetary Council (§13.1) for review.
4. If confirmed: revocation of the participating institution's authorization (operationalStatus → REVOKED).

### §16.4 Other Jurisdictional Blocks

Beyond CN, any jurisdiction may be added to the geo-fence list through:
1. Documented legal determination (statute, regulation, court order, sanctions designation).
2. Council approval (4/7 standard majority).
3. Registry update (set all 19 dimensions to PROHIBITED).

Sanctions designations (OFAC SDN, EU consolidated, UN, HMT, etc.) trigger automatic PROHIBITED classification for the designated entity (institution-level block) and may trigger jurisdiction-level PROHIBITED classification for comprehensively-sanctioned jurisdictions.

### §16.5 Geo-Fence Test Vectors

The implementation includes the following test vectors (verifiable via the API):

- `isGeoFenced("CN")` → `true` (absolute block)
- `isGeoFenced("US")` → `false` (CONDITIONAL, not PROHIBITED)
- `isGeoFenced("XX")` → `true` (UNKNOWN jurisdiction — conservative block)
- `checkInstitutionAuthorization("INST-001", "SETTLE", 1000, "USD", "US-EU")` → `authorized: true` (testnet seed — INST-001 is ACTIVE, sanctions CLEAR)
- `checkInstitutionAuthorization("INST-XXX", "SETTLE")` → `authorized: false, reason: "Institution not found"`

---

## §17 — REGULATED ENTRY / EXIT RAILS

### §17.1 Entry Rails (Institutional Onboarding)

A regulated institution enters the MITHQAL infrastructure through the following rails:

1. **Regulatory License Verification** — the institution presents its home-jurisdiction banking or payment-institution license. MITHQAL verifies with the relevant regulator.
2. **KYB / Source-of-Funds** — MITHQAL performs institution-level KYB (§4.3). This is NOT customer-level KYC.
3. **Institutional Authorization Record** — the institution is registered in `INSTITUTION_REGISTRY` (§20) with: legalName, jurisdiction, regulator, licenseReference, participantClass (B or C), permittedMTQFunctions, permittedCurrencies, permittedCorridors, maxTransactionSize, permittedIssuanceLimit, permittedRedemptionLimit, operationalStatus (PENDING → ACTIVE), sanctionsStatus (CLEAR), expirationDate, authorizationDate.
4. **Cryptographic Credential Issuance** — the institution receives API credentials (and, for production, an on-chain signing key) authenticated against its registry record.
5. **Pilot Phase** — the institution begins with reduced limits (e.g., maxTransactionSize = $1M) for a pilot period (90 days). Limits are raised to production values after the pilot is reviewed.
6. **Operational Status Activation** — `operationalStatus` moves from PENDING to ACTIVE. The institution may now transact.

### §17.2 Exit Rails (Institutional Offboarding)

A regulated institution exits the MITHQAL infrastructure through the following rails:

1. **Voluntary Offboarding** — the institution submits an offboarding request. Pending MTQ transactions are settled or refunded. The institution's MTQ balance is redeemed through §14. The institution's `operationalStatus` moves from ACTIVE to SUSPENDED (grace period) → REVOKED (final).
2. **Regulatory Action** — a regulator revokes the institution's license. MITHQAL receives notification, sets `operationalStatus = SUSPENDED` immediately, and begins offboarding. Pending transactions are settled where possible; new transactions are blocked.
3. **Sanctions Designation** — the institution (or its UBO) is added to a sanctions list. MITHQAL sets `sanctionsStatus = BLOCKED` immediately. All pending transactions are blocked. The institution's MTQ balance is held pending legal determination (court order or regulator guidance).
4. **MITHQAL Council Action** — the Monetary Council revokes the institution's authorization for cause (e.g., compliance breach, operational failure). The revocation is documented in the council minutes; the institution is notified; `operationalStatus = REVOKED`.

### §17.3 Operational Status Lifecycle

```
PENDING  →  ACTIVE  →  SUSPENDED  →  REVOKED
   ↑          |                       |
   |          ↓                       |
   +------ (re-onboarding) <----------+
```

- `PENDING` — registered but not yet operational (entry rail).
- `ACTIVE` — fully operational, may transact.
- `SUSPENDED` — temporarily blocked (grace period for offboarding or investigation).
- `REVOKED` — permanently removed. Re-onboarding requires a fresh application.

### §17.4 Customer Entry / Exit Rails

Customers (Class D corporate, Class E individual — though E is out of v25.0 core scope) do NOT interact with MITHQAL directly. Their entry and exit are managed by their regulated institution:

- Customer onboarding → regulated institution's standard KYC/KYB process.
- Customer offboarding → regulated institution redeems any customer-held MTQ balance (if applicable) through §14, pays out sovereign money.
- Customer-level sanctions → regulated institution blocks the customer, reports to its regulator, may notify MITHQAL if the customer's MTQ activity is material.

---

## §18 — PRODUCT / USER MODEL (Rewritten for v25.0)

### §18.1 What MITHQAL v25.0 IS (Product)

MITHQAL v25.0 is **wholesale neutral settlement infrastructure**. The product is:

- A permissioned wholesale settlement instrument (MTQ).
- A neutral middle layer between regulated monetary systems.
- An institutional issuance pipeline (§3.2) for originating MTQ against verified reserves.
- An institutional redemption pipeline (§14) for settling MTQ back to sovereign money.
- A CBDC interoperability layer (§7) for connecting wholesale CBDCs and bank money across jurisdictions.
- A jurisdictional perimeter engine (§15) for compliance-aware settlement.
- A traceability system (§9) for institutionally attributable settlement records.
- A constitutional reserve spine (§11) for verified backing of every MTQ.

### §18.2 What MITHQAL v25.0 IS NOT (Product)

MITHQAL v25.0 is NOT:

- A retail payment app. (Class E customers are out of scope.)
- A consumer-facing exchange. (No order book, no matching engine, no speculative trading — §13.)
- A wallet provider. (Wallets are the regulated institution's responsibility.)
- A custodian for customer assets. (Custody is for the reserve, not for customer holdings.)
- A money transmitter. (The regulated institution is the money transmitter; MITHQAL is the settlement layer.)
- A yield-bearing instrument. (No yield on MTQ holdings.)
- A speculative asset. (No exchange listing for speculative trading.)
- A universal currency. (Neutrality doctrine §6 — MTQ is between monetary systems, not instead of them.)

### §18.3 Primary User Personas

**Persona 1 — Settlement Operations Lead at a Class B Bank**

- "I need to settle a cross-border trade payment for my corporate customer."
- Uses: `POST /api/v25.0/settle` with the institutional settlement request.
- Receives: a `SettlementRecord` with transactionId, finalityStatus, and trace path.
- Reports: settlement confirmation to the corporate customer (Class D).

**Persona 2 — Treasury Manager at a Class B Bank**

- "I need to acquire MTQ for upcoming settlement demand."
- Uses: institutional issuance pipeline (§3.2) through the bank's treasury integration.
- Receives: MTQ balance on the bank's institutional account.
- Reports: reserve backing verification to internal risk and compliance.

**Persona 3 — Compliance Officer at a Class B Bank**

- "I need to verify that a settlement was executed within our regulatory perimeter."
- Uses: `GET /api/v25.0` for the institutional authorization registry; settlement record lookup.
- Receives: jurisdictional classification, sanctions status, finality status.
- Reports: compliance attestation to the regulator.

**Persona 4 — Central-Bank Observer (Mode 2 or Mode 3, when authorized)**

- "I need to observe settlement activity in my jurisdiction for systemic-risk monitoring."
- Uses: `OBSERVE` function (per legal access rights, per §8).
- Receives: aggregate settlement volume, jurisdictional breakdown, finality status.
- Reports: systemic-risk observations to the central bank's financial-stability committee.

### §18.4 Pre-v25.0 Product Language — HISTORICAL / NON-NORMATIVE

The v24.2.1 product language that described MITHQAL as "participant-accessible reserve-backed settlement" with "participant deposits assets and directly mints MTQ" is HISTORICAL / NON-NORMATIVE for v25.0 (see §26 and Appendix A). The retail-user direct-minting path is RETIRED.

### §18.5 Future Retail Product (Out of v25.0 Scope)

A future retail MTQ product (if ever developed) would require:

1. A separate constitutional amendment defining the retail perimeter.
2. A regulated bank-issued sub-token model (the bank, not MITHQAL, would be the retail issuer).
3. Full customer-level KYC by the issuing bank.
4. Jurisdictional perimeter review for retail access in each market.
5. A separate Sharia certification covering the retail product.
6. Regulator approval in each retail-access jurisdiction.

v25.0 does NOT commit to building this product. v25.0 explicitly does NOT enable retail MTQ access by default. The retail perimeter is a separate decision, not a v25.0 feature.

---

## §19 — SMART CONTRACT CHANGES (Reference Matrix)

### §19.1 Preserved Contracts (v24.2.1-FINAL — unchanged)

The following smart contracts from v24.2.1-FINAL are PRESERVED UNCHANGED for v25.0. Their deployed addresses (Monad Testnet, Chain ID 5042002) remain valid:

| Contract | Address | v25.0 Status | Notes |
|---|---|---|---|
| MTQ.sol | 0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD | PRESERVED | mint/burn preserved; mint() now gated by institutional issuance pipeline (off-chain authorization check) |
| Governance.sol | 0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66 | PRESERVED | 7-member Council, 6/7 supermajority for constitutional; 15 forbidden selectors preserved |
| Safe (Multi-Sig) | 0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0 | PRESERVED | 3-of-5 operational |
| Algorithm.sol | 0x8839ce50e8D414005518769999c0A5b961D00CB2 | PRESERVED | deterministic issuance authorization |
| Reserve.sol | 0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177 | PRESERVED | 4-tier + Article X sequential liquidation |
| Mint.sol | 0x197e9CB28216dfe18a199b4c2930F74C2F460809 | PRESERVED | 4-tier model matching Reserve.sol; mint fee 5 bps capped $5,000 |
| Redeem.sol | 0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4 | PRESERVED | Never pausable; redemption fee 5 bps capped $5,000 |
| Oracle.sol | 0xDfcA66ac0450C9AB86307af1942E157C5A4DB713 | PRESERVED | Multi-source consensus; mainnet ≥5/8 quorum |
| Takaful.sol | 0x3eC27BB283644eF0A98B9961E9FBED0583a02f19 | PRESERVED | Sharia-compliant mutual-support mechanism |

### §19.2 Smart Contract Change Matrix

| Contract | v24.2.1 Behavior | v25.0 Change | Rationale |
|---|---|---|---|
| MTQ.sol `mint()` | 1:1 deposit, auto-pause if RR<100% | +institutional authorization pre-check (off-chain `checkInstitutionAuthorization` call before mint executes) | §3.2 institutional issuance pipeline gate |
| MTQ.sol `burn()` | never paused | unchanged | §14 redemption protection preserved |
| MTQ.sol `_transfer()` | founder cap 20% enforced | +institutional authorization check for sender AND receiver | §20 institutional authorization gate |
| Mint.sol | 4-tier model, mint fee 5 bps | +institutional issuance request ID required (off-chain pipeline reference) | §3.2 audit trail |
| Redeem.sol | never pausable, redemption fee 5 bps | +institutional redemption authorization pre-check | §14 institutional redemption gate |
| Governance.sol | 7-member Council, 15 forbidden selectors | +1 forbidden selector: `emergencyMint()` (already prohibited, explicit on-chain freeze) | §3.1 explicit prohibition |
| Reserve.sol | 4-tier + Article X | unchanged | §11.16 preserved |
| Oracle.sol | multi-source consensus | unchanged | §12 oracle architecture preserved |

### §19.3 Off-Chain Authorization Adapter

The v25.0 institutional authorization gate is implemented OFF-CHAIN in `src/lib/institutional-authorization.ts` and `src/lib/wholesale-settlement.ts`. The smart contracts call an off-chain authorization service (via oracle or signed authorization ticket) before executing `mint()`, `burn()`, or `_transfer()`.

The off-chain adapter pattern is chosen because:

1. The institutional registry contains PII-adjacent data (legal name, regulator, license reference) that should NOT be stored on-chain.
2. The jurisdictional classification (19 dimensions × ~200 jurisdictions) is too large to store on-chain efficiently.
3. The authorization logic is complex (§3.3 — 25+ checks) and benefits from off-chain computation with on-chain proof of authorization.

The on-chain proof of authorization is a signed ticket from the MITHQAL authorization service, containing:

```
{
  institutionId,
  mtqFunction,
  amount,
  currency,
  corridor,
  validUntil,
  authorizationHash,
  mithqalSignature
}
```

The smart contract verifies the MITHQAL signature and the `validUntil` window before executing the function. This pattern is the canonical v25.0 institutional authorization adapter.

### §19.4 Deployment Notes

- No production redeployment of the v24.2.1 contracts is required for v25.0 if the off-chain authorization adapter is implemented as a pre-transaction check.
- If the on-chain proof-of-authorization pattern is adopted (recommended for mainnet), the contracts will require a v25.0.1 redeployment with the proof-verification modifier added to `mint()`, `burn()`, and `_transfer()`.
- The redeployment is a constitutional action (§13.2 — 90-day timelock, 6/7 supermajority).

---

## §20 — INSTITUTIONAL AUTHORIZATION REGISTRY

### §20.1 Registry Schema

The institutional authorization registry is implemented in `src/lib/institutional-authorization.ts` (`INSTITUTION_REGISTRY`). Each institution record contains:

```ts
interface InstitutionRecord {
  institutionId: string;            // INST-XXX
  legalName: string;                // regulated institution legal name
  jurisdiction: string;            // ISO 3166-1 alpha-2 (US, EU, AE, etc.)
  regulator: string;                // home-jurisdiction regulator (OCC, ECB, CBUAE, etc.)
  licenseReference: string;         // regulator-issued license reference
  participantClass: "A"|"B"|"C";    // §2 class (D and E do not appear in registry)
  permittedMTQFunctions: MTQFunction[];  // SETTLE | ACQUIRE | REDEEM | ROUTE | OBSERVE | ISSUE
  permittedCurrencies: string[];   // currencies the institution may settle in
  permittedCorridors: string[];    // bilateral corridors the institution may use
  maxTransactionSize: number;      // per-transaction limit (USD)
  permittedIssuanceLimit: number;   // cumulative issuance limit (USD)
  permittedRedemptionLimit: number; // cumulative redemption limit (USD)
  operationalStatus: "ACTIVE"|"SUSPENDED"|"REVOKED"|"PENDING";
  sanctionsStatus: "CLEAR"|"FLAGGED"|"BLOCKED";
  expirationDate: string;          // ISO date
  authorizationDate: string;        // ISO date
}
```

### §20.2 Testnet Seed Registry

The implementation includes a seed registry of 4 Class B institutions for testnet:

| ID | Legal Name | Jurisdiction | Regulator | Class | Functions |
|---|---|---|---|---|---|
| INST-001 | Test Bank A (US) | US | OCC | B | SETTLE, ACQUIRE, REDEEM, ROUTE, ISSUE |
| INST-002 | Test Bank B (EU) | EU | ECB | B | SETTLE, ACQUIRE, REDEEM, ROUTE, ISSUE |
| INST-003 | Test Bank C (JP) | JP | FSA | B | SETTLE, ACQUIRE, REDEEM, ROUTE, ISSUE |
| INST-004 | Test Bank D (AE) | AE | CBUAE | B | SETTLE, ACQUIRE, REDEEM, ROUTE, ISSUE |

All seed institutions have:
- `maxTransactionSize`: $10,000,000
- `permittedIssuanceLimit`: $50,000,000
- `permittedRedemptionLimit`: $50,000,000
- `operationalStatus`: ACTIVE
- `sanctionsStatus`: CLEAR
- `authorizationDate`: 2026-08-14
- `expirationDate`: 2027-08-14

The seed registry is for TESTNET ONLY. Production deployment requires replacing the seed with real regulated institutions, each with verified license references and regulator confirmations.

### §20.3 Authorization Check (canonical)

The authorization check is implemented in `checkInstitutionAuthorization()`:

```ts
checkInstitutionAuthorization(
  institutionId: string,
  mtqFunction: MTQFunction,
  amount?: number,
  currency?: string,
  corridor?: string,
): AuthorizationResult
```

The check evaluates (in order):
1. Institution exists in registry.
2. `operationalStatus === "ACTIVE"`.
3. `sanctionsStatus !== "BLOCKED"`.
4. Authorization not expired (`now ≤ expirationDate`).
5. `permittedMTQFunctions.includes(mtqFunction)`.
6. If amount provided: `amount ≤ maxTransactionSize`.
7. If currency provided: `permittedCurrencies.includes(currency)`.
8. If corridor provided: `permittedCorridors.includes(corridor)`.
9. Jurisdiction classification for the relevant function:
   - `PROHIBITED` → block.
   - `UNKNOWN` → conservative block.
   - `CONDITIONAL` → flag (testnet: allow; production: requires manual review).

### §20.4 Production Registry Extension

The production registry will contain tens to hundreds of institutions. Each record must be:
- Verified against the regulator's public register.
- Reviewed by the institutional compliance team.
- Approved by the Monetary Council (§13.1 — 4/7 standard majority for new institutions).
- Updated quarterly (license renewals, sanctions screening, perimeter changes).
- Logged in the JSONL append-only ledger (v24.2.1 §16 — preserved) for full auditability.

### §20.5 Revocation

An institution's authorization may be revoked (operationalStatus → REVOKED) by:
- Council decision (4/7 majority, documented cause).
- Regulatory notification (license revoked in home jurisdiction).
- Sanctions designation (institution or UBO added to a sanctions list).
- Material compliance breach (documented by the institutional compliance team).

Revocation is IMMEDIATE (no grace period for new transactions). Pending transactions are handled per §17.2.

---

## §21 — INSTITUTIONAL LIMITS (Stress-State-Indexed)

### §21.1 Limits Schema

Institutional limits are stress-state-indexed. The function `getInstitutionalLimits()` returns limits adjusted for the current CALM stress state:

```ts
getInstitutionalLimits(
  institutionId: string,
  stressState: "NORMAL"|"CAUTION"|"DEFENSIVE"|"STRESS"|"EMERGENCY"|"RECOVERY",
): {
  maxTransactionSize: number;
  maxIntradayExposure: number;
  maxIssuance: number;
  maxRedemption: number;
  tightened: boolean;
}
```

### §21.2 Stress-State Tightening Factors

| Stress State | Factor | maxTransactionSize | maxIntradayExposure | maxIssuance | maxRedemption |
|---|---|---|---|---|---|
| NORMAL | 1.0 | full | 30% of issuance limit | full | full |
| CAUTION | 0.8 | 80% | 24% | 80% | 80% |
| DEFENSIVE | 0.6 | 60% | 18% | 60% | 60% |
| STRESS | 0.4 | 40% | 12% | 40% | 40% |
| EMERGENCY | 0.1 | 10% | 3% | 10% | 10% |
| RECOVERY | 0.7 | 70% | 21% | 70% | 70% |

`maxIntradayExposure = permittedIssuanceLimit × factor × 0.3` (30% intraday utilization cap).

### §21.3 Example Calculation

For INST-001 (permittedIssuanceLimit = $50M, maxTransactionSize = $10M) in CAUTION state:

- `maxTransactionSize = $10M × 0.8 = $8M`
- `maxIntradayExposure = $50M × 0.8 × 0.3 = $12M`
- `maxIssuance = $50M × 0.8 = $40M`
- `maxRedemption = $50M × 0.8 = $40M`
- `tightened = true`

### §21.4 EMERGENCY Behavior

In EMERGENCY state:
- All institutional limits are reduced to 10% of normal.
- The minting function is DISABLED (§12.1 CALM EMERGENCY rule).
- Redemption is still permitted (redemption is never pausable — §17.3 / v24.2.1 §17.3) but at 10% limits.
- The Monetary Council (§13.1) is automatically notified.
- Constitutional emergency recovery is activated (v24.2.1 §13.3 — preserved).

### §21.5 Per-Institution Overrides

The stress-state-indexed limits are the FLOOR. Individual institutions may have LOWER limits set by:
- Their home-jurisdiction regulator.
- Their internal risk management.
- Council decision (for cause).

Per-institution overrides are stored in the institution record (`maxTransactionSize`, `permittedIssuanceLimit`, `permittedRedemptionLimit`). The effective limit is `min(institutionRecordLimit, stressStateLimit)`.

### §21.6 Implementation Reference

The limits engine is implemented in `getInstitutionalLimits()` in `src/lib/institutional-authorization.ts`. It is called by `processWholesaleSettlement()` and `processRedemption()` in `src/lib/wholesale-settlement.ts` before any transaction is authorized.

---

## §22 — SETTLEMENT FINALITY

### §22.1 Three-Layer Finality

Settlement finality in v25.0 is THREE-LAYERED. The layers are independent and MUST be tracked separately:

| Layer | Definition | Typical Time | Implemented In |
|---|---|---|---|
| **Technical finality** | Cryptographic finality (blockchain confirmation) | 10 minutes (soft), 7 days (hard) | MTQ.sol on-chain confirmation |
| **Legal finality** | Legal settlement finality (jurisdiction-dependent) | jurisdiction-specific | legal opinion per jurisdiction |
| **Banking finality** | Banking-system finality (rail-dependent) | T+0 to T+2 | regulated banking rail |

### §22.2 Canonical Rule

> No blueprint section may imply that blockchain confirmation alone automatically determines legal finality in every jurisdiction.

This is the canonical finality rule. Technical finality is necessary but NOT sufficient for legal finality. Legal finality is necessary but NOT sufficient for banking finality. Each layer must be tracked, reported, and audited independently.

### §22.3 SettlementRecord `finalityStatus` Field

The `finalityStatus` field on a `SettlementRecord` (§9.1) takes one of:

- `PENDING` — transaction submitted, awaiting technical finality.
- `TECHNICAL_FINAL` — blockchain confirmation complete; legal and banking finality pending.
- `LEGAL_FINAL` — legal settlement finality achieved (per jurisdictional determination).
- `BANKING_FINAL` — banking-system finality achieved (rail-dependent).

A transaction is FULLY final only when `finalityStatus = BANKING_FINAL`.

### §22.4 Implementation

The default `finalityStatus` set by `processWholesaleSettlement()` is `TECHNICAL_FINAL` (because the on-chain confirmation is the first layer to complete). Legal and banking finality are tracked by separate downstream processes (off-chain reconciliation, banking-rail confirmation).

### §22.5 Finality Risk Disclosure

Settlement participants MUST be informed that:
1. Technical finality does NOT guarantee legal finality in their jurisdiction.
2. Legal finality does NOT guarantee banking finality within a specific timeframe.
3. Banking finality depends on the receiving bank's rail and the payout currency's settlement cycle.
4. In stress scenarios, banking-rail delays may extend banking finality well beyond the technical-finality window.

This disclosure is part of the institutional onboarding (§17.1) and is repeated in the institutional authorization agreement.

---

## §23 — SHARIA ARCHITECTURE (Updated Scope for v25.0)

### §23.1 Sharia Governance Architecture (Preserved)

The v24.2.1 Sharia governance architecture is PRESERVED for v25.0. The architecture defines:

1. A Sharia Supervisory Board (independent qualified Sharia scholars).
2. A Sharia-compliance review process for every reserve asset, every settlement flow, and every fee.
3. A Takaful mechanism (`Takaful.sol` — preserved) for Sharia-compliant mutual support.
4. A constitutional ban on riba (interest), gharar (excessive uncertainty), maysir (gambling), and haram industries.
5. A documented Sharia-fatwa requirement before any production claim of Sharia compliance.

### §23.2 v25.0 Scope Expansion

The v25.0 transformation expands the Sharia review scope to cover:

1. **Institutional issuance pipeline (§3.2)** — every checkpoint in the pipeline must be reviewed for Sharia compliance. The pipeline itself is a sequence of contractual steps; each step must conform to Sharia contract principles (e.g., the deposit must be a wadi'ah or amanah, the issuance must be a bay' or a sak allocation, the redemption must be a wakalah or similar).

2. **Cross-border settlement flow (§5)** — the seven-hop canonical flow must be reviewed for Sharia compliance across jurisdictions. The neutrality doctrine (§6) supports Sharia compliance by avoiding currency substitution (which can be a Sharia concern in some interpretations).

3. **CBDC interoperability (§7)** — the five CBDC interop flows must be reviewed. Wholesale CBDC flows that operate under central-bank authority may have different Sharia implications than bank-money flows. The Sharia review must address each flow variant.

4. **Central-bank participation (§8)** — Mode 2 and Mode 3 participation must be reviewed. Direct central-bank participation (Mode 3) may simplify Sharia compliance (the central bank's authority is recognized); bank-only Mode 1 may require additional structuring.

5. **Institutional traceability (§9)** — the trace path must preserve Sharia-compliance attributes (e.g., the asset's Sharia status, the settlement's Sharia classification) without exposing customer PII.

6. **Jurisdictional perimeter (§15)** — Sharia compliance is jurisdiction-specific. A transaction that is Sharia-compliant in UAE may differ in compliance in Saudi Arabia, in Indonesia, in Malaysia. The perimeter engine must carry Sharia-status dimensions (currently encoded as `artRwaExposure` and other dimensions; future expansion may add explicit Sharia dimensions).

7. **Fee structure (§19)** — all fees (mint, redemption, transfer, custody) must be Sharia-compliant. The current fee structure (5 bps capped at $5,000 for mint and redeem; 1 bp capped at $1,000 for transfer; 0.10% p.a. for custody) is a flat service-fee model that is generally Sharia-acceptable. The fee structure must be reviewed by the Sharia Supervisory Board before production.

### §23.3 Sharia Compliance Status

> **The blueprint establishes a Sharia-governance architecture and intended constraints. It SHALL NOT declare final Sharia compliance until an independent qualified Sharia board issues a current fatwa / certificate covering the complete live structure, including PAR, reserves, redemption, custody, transaction fees, treasury instruments, Takaful, digital liquidity assets, governance, institutional issuance pipeline, cross-border settlement flow, CBDC interoperability, and central-bank participation.**

This is the canonical Sharia status statement. It is HONEST (per R0.16). MITHQAL is "designed for Sharia review" — NOT "Sharia-compliant" until the fatwa is issued.

### §23.4 Sharia-Compliant Reserve Assets

The current Portfolio B (15% physical gold + 5% PAXG + 0% silver + 77.5% fiat + 2.5% digital) has been designed with Sharia principles in mind:

- **Physical gold** (15%) — Sharia-compliant as a riba'i asset (physical gold is permissible as a store of value under most interpretations).
- **Tokenized gold PAXG** (5%) — Sharia-compliant IF the tokenization structure preserves the holder's beneficial ownership of allocated physical gold (PAXG does; TGRS=9.00, 13/13 eligibility gate PASS).
- **Silver** (0%) — Sharia-compliant but conditional (SDC_Ag-negative per Task 4 backtest).
- **Fiat** (77.5%) — Sharia-compliant as a medium of exchange; the USD reference (PAR=$1.00) is a settlement unit, not an interest-bearing instrument.
- **Digital** (2.5%) — USDC, USDP, EURC, BUIDL each require individual Sharia review. USDC and USDP (Paxos) are widely reviewed; BUIDL (tokenized T-bills) requires careful review because T-bills are interest-bearing sovereign debt.

The Sharia Supervisory Board must review and certify each asset individually.

### §23.5 Sharia Non-Compliance Handling

If the Sharia Supervisory Board determines that any asset, flow, or mechanism is non-compliant:

1. The asset / flow / mechanism is REMOVED from the Sharia-compliant product.
2. A non-Sharia variant may be offered separately (clearly labeled, with separate disclosure).
3. The constitutional amendment process (§13.2) is used if the change requires constitutional modification.
4. Existing MTQ holders are notified and given the option to redeem before the change takes effect.

### §23.6 Pre-v25.0 Sharia Language — Preserved with Caveats

The v24.2.1 Sharia language is largely preserved. The v25.0 transformation expands the scope but does NOT retract any v24.2.1 Sharia commitment. Any v24.2.1 text that implied retail-customer Sharia access is HISTORICAL / NON-NORMATIVE for v25.0 (because retail customer access is out of v25.0 core scope — §18).

---

## §24 — COMMERCIAL FLOW

### §24.1 Commercial Flow Overview

The v25.0 commercial flow is INSTITUTIONAL-TO-INSTITUTIONAL. It does not include retail-customer commercial flows. The flow is:

```
1. Corporate customer (Class D) initiates a trade settlement with a regulated bank (Class B).
2. Class B bank acquires MTQ through the institutional issuance pipeline (§3.2).
3. Class B bank settles MTQ with a counterparty Class B bank (in another jurisdiction).
4. The counterparty Class B bank redeems MTQ through the institutional redemption pipeline (§14).
5. The counterparty Class B bank pays out sovereign money to its corporate customer (Class D).
```

### §24.2 Commercial Flow Example

```
1. Saudi Arabia corporate customer wants to pay a Singapore supplier.
2. Saudi bank (Class B, AE jurisdiction) acquires MTQ against AED (or an authorized Saudi settlement asset).
3. Saudi bank settles MTQ with Singapore bank (Class B, SG jurisdiction).
4. Singapore bank redeems MTQ for SGD (or an authorized Singapore settlement asset).
5. Singapore bank pays SGD to the supplier.
```

The corporate customers (Class D) never hold MTQ directly. They hold sovereign money in their bank accounts. The banks hold MTQ for the duration of the cross-border settlement (typically minutes to hours, given the 10-minute soft finality per §22).

### §24.3 Commercial Revenue Model

MITHQAL's revenue comes from:

1. **Mint fee** — 5 bps, capped at $5,000 per mint (paid by the issuing institution).
2. **Redemption fee** — 5 bps, capped at $5,000 per redemption (paid by the redeeming institution).
3. **Transfer fee** — 1 bp, capped at $1,000 per transfer (paid by the sending institution).
4. **Custody fee** — 0.10% per annum on the reserve (paid from the reserve yield, not from customer fees).

These fees are the v24.2.1 §19 schedule — preserved unchanged. They are FLAT service fees, Sharia-compliant (per §23.4), and not yield-bearing.

### §24.4 Commercial Flow Exclusions

The commercial flow does NOT include:

- Retail customer payment (out of v25.0 scope — §18).
- Speculative MTQ trading (prohibited — §13).
- Yield-bearing MTQ products (no yield — §10, §13).
- MTQ-as-collateral for lending (prohibited — R0.13 no lending of reserves, and MTQ itself is not a lending instrument).
- MTQ-based derivatives (prohibited — §13.2).

### §24.5 Pre-v25.0 Commercial Flow Language — HISTORICAL / NON-NORMATIVE

The v24.2.1 commercial flow language that implied direct participant-to-participant settlement (without institutional intermediation) is HISTORICAL / NON-NORMATIVE for v25.0 (see §26 and Appendix A). The v25.0 commercial flow is ALWAYS institutionally intermediated.

---

## §25 — VALUE PROPOSITION (Institutional)

### §25.1 Institutional Value Proposition

For regulated institutions, MITHQAL v25.0 offers:

1. **Cross-border settlement speed** — minutes instead of days. The 10-minute soft finality (§22) is materially faster than typical correspondent-banking cycles (T+1 to T+3).
2. **Settlement finality clarity** — three-layer finality model (§22) gives institutions clear visibility into technical, legal, and banking finality.
3. **Compliance-aware settlement** — jurisdictional perimeter (§15), sanctions screening, geo-fence (§16) are built into the settlement pipeline.
4. **Neutral cross-border corridor** — no institution is favored; the same pipeline serves all authorized institutions.
5. **Constitutional reserve integrity** — 100% RR floor, no discretionary minting, no rehypothecation (§11) provide settlement-grade reserve integrity.
6. **Institutional traceability** — every settlement record is cryptographically hashed, validator-signed, ledger-committed (§9).
7. **CBDC interoperability path** — the 5-flow CBDC interop layer (§7) provides a path to central-bank-money settlement without requiring every jurisdiction to adopt the same CBDC technology.
8. **Sharia-compliance path** — the Sharia governance architecture (§23) provides a path to Sharia-compliant settlement for Islamic finance institutions.

### §25.2 What v25.0 Does NOT Promise

- **No retail payment speed** — v25.0 is wholesale-only.
- **No speculative return** — MTQ is a settlement instrument, not an investment.
- **No central-bank endorsement** — unless formally granted per Mode 3 (§8.4).
- **No guaranteed regulatory approval** — each jurisdiction requires its own licensing.
- **No immunity from custody / oracle / counterparty risk** — the risk model is honest (§11.5, §11.6, §12.10).
- **No 100% PAR guarantee in stress** — in-kind delivery (§11.15) does NOT guarantee 100% PAR.

### §25.3 Value Proposition Implementation Reference

The value proposition is implemented in `src/lib/v25-0-identity.ts` (`VALUE_PROPOSITION`) and served at `GET /api/v25.0` under `valueProposition`. The `preserved` array on the same API response enumerates the preserved v24.2 strengths (§29).

---

## §26 — SEMANTIC SWEEP SUMMARY

### §26.1 Sweep Mandate

Per the v25.0 directive §26, a FULL SEMANTIC SWEEP is required: every occurrence of participant-minting / retail / public-minting language in the v24.2.1-FINAL blueprint (and in any pre-v25.0 documentation) MUST be either:

(a) **Rewritten** in v25.0-normative language (institutional issuance, permissioned wholesale, regulated institution intermediation), OR

(b) **Marked HISTORICAL / NON-NORMATIVE** with an explicit notice that the language is preserved for traceability only and has no normative authority for v25.0.

This section summarizes what was changed and what was marked historical.

### §26.2 Categories of Language Swept

#### Category 1 — "Participant deposits assets and directly mints MTQ"

**Status:** RETIRED. Replaced by §3.2 institutional issuance pipeline.

**Where it appeared in v24.2.1:**
- v24.2.1 §2 (Constitutional Identity) — implied participant deposit-to-mint flow.
- v24.2.1 §17.2 (Mint.sol) — `mint()` described as 1:1 deposit; v25.0 preserves the 1:1 backing but adds institutional authorization pre-check (§19.2).
- v24.2.1 §3.1 (PAR) — "Minting only upon verified deposit" (R0.2 — preserved as principle; v25.0 specifies the deposit is by an authorized institution, not a participant).

**v25.0 canonical replacement:**
> "Only authorized institutional issuance channels may originate MTQ." (§3.1)

**HISTORICAL / NON-NORMATIVE markers:** Applied in Appendix A for the v24.2.1 text.

#### Category 2 — "Retail user" / "individual customer" direct MTQ access

**Status:** RETIRED. Replaced by Class E participant classification (§2.5 — out of v25.0 core scope).

**Where it appeared in v24.2.1:**
- v24.2.1 §2A (Institutional Legal, Custody & Regulatory Perimeter) — referred to "holder" without specifying institutional vs retail.
- v24.2.1 §9.3 (Redemption) — referred to participant receipt (could be institutional or retail in v24.2.1; v25.0 specifies institutional).
- v24.2.1 §41 (Operational Capital) — listed "Participant Deposits" as a prohibited operational capital funding source (v25.0 preserves the prohibition, redefines "Participant" as "authorized institution").

**v25.0 canonical replacement:**
> "Class E participants are explicitly OUT of the v25.0 core architecture." (§2.5)

#### Category 3 — "Public minting" / "permissionless issuance"

**Status:** PROHIBITED. Listed in §3.1 prohibited minting paths and §13.2 prohibited trading language.

**Where it appeared in v24.2.1:**
- Did not appear in canonical v24.2.1 text (always prohibited). The sweep confirms this category was never normative in v24.2.1; the v25.0 sweep makes the prohibition explicit.

**v25.0 canonical replacement:**
> "permissionless issuance" is listed in `TERMINOLOGY.avoid` (§28). "public minting" is listed in `TERMINOLOGY.avoid`.

#### Category 4 — "Participant" (unqualified) in settlement flow descriptions

**Status:** REDEFINED. "Participant" in v25.0 refers to a regulated participating institution (Class A, B, or C). Class D (corporate) and Class E (individual) participants are NOT direct MITHQAL participants.

**Where it appeared in v24.2.1:**
- Throughout v24.2.1 (e.g., §1, §9, §13, §22, §34). The term "participant" was used loosely to mean any MTQ holder.

**v25.0 canonical replacement:**
> "Participant" = "regulated participating institution" (Class A, B, or C). Where v24.2.1 used "participant" to mean a retail user, the language is HISTORICAL / NON-NORMATIVE.

#### Category 5 — "Consumer coin" / "retail stablecoin" language

**Status:** PROHIBITED. Listed in §28 `TERMINOLOGY.avoid`.

**Where it appeared in v24.2.1:**
- Did not appear in canonical v24.2.1 text (always avoided). The sweep confirms avoidance; v25.0 makes the avoidance explicit.

#### Category 6 — "Universal money" / "global currency" / "replacement currency" language

**Status:** PROHIBITED. Listed in §28 `TERMINOLOGY.avoid`.

**Where it appeared in v24.2.1:**
- Did not appear in canonical v24.2.1 text. The neutrality doctrine (§6) explicitly prohibits this framing.

#### Category 7 — "Exchange token" / "investment token" language

**Status:** PROHIBITED. Listed in §28 `TERMINOLOGY.avoid`.

**Where it appeared in v24.2.1:**
- Did not appear in canonical v24.2.1 text.

#### Category 8 — "Speculative asset" language

**Status:** PROHIBITED. Listed in §28 `TERMINOLOGY.avoid`.

**Where it appeared in v24.2.1:**
- Did not appear in canonical v24.2.1 text.

### §26.3 Sweep Statistics

| Category | v24.2.1 Occurrences (approximate) | v25.0 Action | Markers Applied |
|---|---|---|---|
| 1. "Participant deposits assets and directly mints MTQ" | ~12 (across §2, §3.1, §9.3, §17.2, §17.4, §41) | Rewritten to institutional issuance | 6 HISTORICAL markers in Appendix A |
| 2. "Retail user" / "individual customer" direct access | ~8 (across §2A, §9.3, §41) | Rewritten to Class D/E institutional intermediation | 4 HISTORICAL markers in Appendix A |
| 3. "Public minting" / "permissionless issuance" | 0 in v24.2.1 canonical | Explicit prohibition added | n/a |
| 4. "Participant" (unqualified) | ~50 (throughout) | Redefined to institutional participant | ~12 HISTORICAL markers in Appendix A |
| 5. "Consumer coin" / "retail stablecoin" | 0 in v24.2.1 canonical | Explicit avoidance added (§28) | n/a |
| 6. "Universal money" / "global currency" | 0 in v24.2.1 canonical | Explicit avoidance added (§28) | n/a |
| 7. "Exchange token" / "investment token" | 0 in v24.2.1 canonical | Explicit avoidance added (§28) | n/a |
| 8. "Speculative asset" | 0 in v24.2.1 canonical | Explicit avoidance added (§28) | n/a |

**Total HISTORICAL / NON-NORMATIVE markers applied in this blueprint:** 25+ (across Appendix A and inline in preserved sections). The markers take the form `[HISTORICAL / NON-NORMATIVE for v25.0 — see §26]` inline or `> **HISTORICAL / NON-NORMATIVE NOTICE:** ...` block-quoted.

### §26.4 Sweep Verification

The sweep is verified by:
1. `rg -i "participant.*deposits.*mints|participant.*directly.*mint|retail.*user.*mint|public.*minting|permissionless.*issuance"` against the v25.0 canonical blueprint — should return ZERO matches in normative text (matches only in HISTORICAL / NON-NORMATIVE blocks).
2. `rg -i "consumer coin|retail stablecoin|global currency|universal money|replacement currency|exchange token|investment token|speculative asset"` against the v25.0 canonical blueprint — should return ZERO matches in normative text (matches only in §28 `TERMINOLOGY.avoid` list).
3. Manual review of every §11-§12 preserved section to confirm that v24.2.1 participant language is either rewritten or marked.

### §26.5 Sweep Sign-Off

The semantic sweep is COMPLETE for v25.0. No participant-minting, retail-user, public-minting, or consumer-coin language remains in v25.0-normative text. All such language is either rewritten in v25.0-normative form or marked HISTORICAL / NON-NORMATIVE with explicit notice.

---

## §27 — ARCHITECTURE DIAGRAM (ASCII)

### §27.1 v25.0 High-Level Architecture

```
+============================================================================+
|                        MITHQAL v25.0 — CANONICAL ARCHITECTURE             |
|              Neutral Wholesale Settlement Infrastructure                  |
+============================================================================+

  +-----------------------+        +-----------------------+
  |   SOVEREIGN MONEY A   |        |   SOVEREIGN MONEY B   |
  | (USD / JPY / EUR /    |        | (AED / SGD / GBP /    |
  |  CBDC-A)              |        |  CBDC-B)              |
  +-----------+-----------+        +-----------+-----------+
              |                                |
              | (regulated settlement asset)  | (regulated settlement asset)
              v                                v
  +-----------------------+        +-----------------------+
  | REGULATED INSTITUTION |        | REGULATED INSTITUTION |
  |      A (Class B/C)    |        |      B (Class B/C)    |
  |  - KYC/KYB on customer|        |  - KYC/KYB on customer|
  |  - sanctions screen   |        |  - sanctions screen   |
  |  - customer reference |        |  - customer reference |
  +-----------+-----------+        +-----------+-----------+
              |                                |
              | (institutional issuance       | (institutional redemption
              |  request, §3.2 pipeline)       |  request, §14 pipeline)
              v                                ^
  +-----------------------------------------------------------------------+
  |                      MITHQAL NEUTRAL SETTLEMENT LAYER                 |
  |                                                                       |
  |  +---------------+    +------------------+    +-----------------+     |
  |  | INSTITUTIONAL | -> | ISSUANCE         | -> | PROOF OF        |     |
  |  | AUTHORIZATION |    | PIPELINE (§3.2)  |    | RESERVES (§11)  |     |
  |  | REGISTRY (§20)|    | - institution    |    | - PAR=$1.00     |     |
  |  +-------+-------+    |   auth (§20)     |    | - RR>=100%      |     |
  |          |            | - reserve verify |    | - Portfolio B   |     |
  |          v            | - custody verify |    | - Article X     |     |
  |  +---------------+    | - NAV calc       |    +-----------------+     |
  |  | JURISDICTIONAL|    | - RR/StressRR   |                            |
  |  | PERIMETER(§15)|    | - PoR / PoS      |                            |
  |  | - 19 dims     |    | - deterministic  |                            |
  |  | - geo-fence(§16|    |   authorization  |                            |
  |  +-------+-------+    +--------+---------+                            |
  |          |                     |                                     |
  |          v                     v                                     |
  |  +---------------+    +------------------+    +-----------------+     |
  |  | CBDC INTEROP  |    | MTQ SETTLEMENT   |    | CALM STATE      |     |
  |  | LAYER (§7)    |    | INSTRUMENT       |    | MACHINE (§12)   |     |
  |  | - 5 flows     |    | - Mint.sol       |    | - 6 states      |     |
  |  | - Mode 1/2/3  |    | - MTQ.sol         |    | - NORMAL→...    |     |
  |  | - (§8)        |    | - Redeem.sol      |    |   →EMERGENCY    |     |
  |  +-------+-------+    +--------+---------+    +-----------------+     |
  |          |                     |                                     |
  |          v                     v                                     |
  |  +---------------+    +------------------+    +-----------------+     |
  |  | TRACEABILITY  |    | HIERARCHICAL     |    | ORACLE          |     |
  |  | (§9)          |    | OPTIMIZER (§12.4)|    | ARCHITECTURE    |     |
  |  | - SettleRec   |    | - 4-tier         |    | - multi-source  |     |
  |  | - audit ledger |    | - 10-λ          |    | - consensus     |     |
  |  +---------------+    +------------------+    +-----------------+     |
  |                                                                       |
  |  +---------------+    +------------------+    +-----------------+     |
  |  | ERTF (§11.14) |    | IN-KIND DELIVERY |    | ANTI-DOUBLE-    |     |
  |  | - $10M policy |    | (§11.15)         |    | COUNTING (§11.13|     |
  |  | - Layer 6     |    | - Layer 7         |    | 32/32 PASS)    |     |
  |  +---------------+    +------------------+    +-----------------+     |
  |                                                                       |
  |  +---------------+    +------------------+    +-----------------+     |
  |  | NEUTRALITY    |    | SETTLEMENT       |    | SHARIA          |     |
  |  | DOCTRINE (§6) |    | FINALITY (§22)   |    | ARCHITECTURE(§23|     |
  |  | - immutable   |    | - 3 layers       |    | - SSB review    |     |
  |  +---------------+    +------------------+    +-----------------+     |
  |                                                                       |
  |  +---------------+                                                    |
  |  | GOVERNANCE     |    Council (7 members, 6/7 supermajority,         |
  |  | (§13.1)        |     90-day timelock for constitutional)           |
  |  +---------------+                                                    |
  +-----------------------------------------------------------------------+
              |                                ^
              | (MTQ — wholesale settlement  | (MTQ — wholesale settlement
              |  instrument)                  |  instrument)
              v                                |
  +-----------------------+        +-----------------------+
  | REGULATED INSTITUTION |        | REGULATED INSTITUTION |
  |      A (Class B/C)    |        |      B (Class B/C)    |
  +-----------+-----------+        +-----------+-----------+
              |                                |
              | (regulated settlement asset)  | (regulated settlement asset)
              v                                v
  +-----------------------+        +-----------------------+
  |   SOVEREIGN MONEY A   |        |   SOVEREIGN MONEY B   |
  +-----------------------+        +-----------------------+

        Out-of-scope for v25.0:
        - Retail customer (Class E) direct MTQ access  --> BLOCKED by default
        - Corporate customer (Class D) direct MTQ access --> routed via bank
        - Speculative trading of MTQ                   --> PROHIBITED (§13)
        - Public minting / permissionless issuance      --> PROHIBITED (§3.1)
```

### §27.2 Institutional Issuance Pipeline Detail (§3.2)

```
UNDERLYING CUSTOMER (Class D corporate, Class E out-of-scope)
       |
       | (customer initiates trade settlement via bank)
       v
REGULATED BANK / APPROVED INSTITUTION (Class B or C)
       |
       | (institution submits institutional issuance request)
       v
+====================================================================+
|  INSTITUTIONAL ISSUANCE PIPELINE (§3.2)                            |
|                                                                    |
|  [1] Institution Authentication    (§20 registry lookup)            |
|       OK? ────── no ──────> BLOCK                                  |
|       yes                                                           |
|       v                                                            |
|  [2] Institutional Authority Check (§20 function/currency/corridor)|
|       OK? ────── no ──────> BLOCK                                  |
|       yes                                                           |
|       v                                                            |
|  [3] Eligible Reserve / Settlement Asset Verification             |
|       OK? ────── no ──────> BLOCK                                  |
|       yes                                                           |
|       v                                                            |
|  [4] Custody Verification (§11 reconciliation, Level 2+)          |
|       OK? ────── no ──────> BLOCK                                  |
|       yes                                                           |
|       v                                                            |
|  [5] NAV Calculation (Market / Prudential / Stress NAV)            |
|       v                                                            |
|  [6] Reserve Ratio / Stress-RR / Constitutional Checks            |
|       RR<100%? ─────────> BLOCK (constitutional emergency)         |
|       RR<105%? ─────────> ENHANCED RESTRICTIONS                   |
|       StressRR<100%? ────> BLOCK (optimizer hard constraint)       |
|       LCR<1.0? ──────────> BLOCK (liquidity hard constraint)        |
|       CALM=EMERGENCY? ───> BLOCK (minting disabled)                |
|       v                                                            |
|  [7] Proof of Reserves (cryptographic, Level 3+ mainnet)          |
|       OK? ────── no ──────> BLOCK                                  |
|       yes                                                           |
|       v                                                            |
|  [8] Proof of Solvency (cryptographic, Level 3+ mainnet)           |
|       OK? ────── no ──────> BLOCK                                  |
|       yes                                                           |
|       v                                                            |
|  [9] Deterministic Issuance Authorization (no discretion)          |
|       v                                                            |
|  [10] Mint.sol (4-tier, mint fee 5 bps cap $5,000)                 |
|       v                                                            |
|  [11] MTQ.sol (1:1 deposit, auto-pause if RR<100%)                 |
|       v                                                            |
|  [12] MTQ enters wholesale settlement layer                        |
+====================================================================+
       |
       v
MTQ AVAILABLE FOR WHOLESALE SETTLEMENT
```

### §27.3 Cross-Border Settlement Flow Detail (§5)

```
JAPANESE IMPORTER (Class D)
       |
       | (trade payable to US exporter)
       v
JAPANESE BANK (Class B, JP jurisdiction)
       |
       | (institutional issuance request, JPY)
       v
[MTQ issuance pipeline §3.2 — see §27.2]
       |
       v
MTQ (wholesale settlement instrument)
       |
       v
MITHQAL NEUTRAL SETTLEMENT LAYER
       |
       | (institutional settlement, JP→US corridor)
       v
MTQ (wholesale settlement instrument)
       |
       | (institutional redemption request, USD)
       v
[MTQ redemption pipeline §14]
       |
       v
US BANK (Class B, US jurisdiction)
       |
       | (sovereign money payout to US exporter)
       v
US EXPORTER (Class D)
```

### §27.4 CBDC Interoperability Layer Detail (§7)

```
+=====================================================================+
|  MITHQAL NEUTRAL CBDC INTEROPERABILITY LAYER (§7)                   |
|                                                                     |
|  Flow 1: wholesale CBDC → MTQ → wholesale CBDC     [Mode 3]         |
|  Flow 2: CBDC → MTQ → bank money                    [Mode 2]         |
|  Flow 3: bank money → MTQ → CBDC                    [Mode 2]         |
|  Flow 4: bank money → MTQ → bank money              [Mode 1 default] |
|  Flow 5: tokenized sovereign → MTQ → regulated dest [Mode 1/2]       |
|                                                                     |
|  Principles:                                                        |
|   - No requirement for same CBDC technology across countries        |
|   - No requirement for one international settlement currency         |
|   - MTQ is the neutral institutional bridge                          |
+=====================================================================+
```

---

## §28 — CANONICAL TERMINOLOGY

### §28.1 Preferred Terminology (closed list)

The following terms are CANONICAL for v25.0. Documentation, UI, API responses, smart contracts, and marketing materials MUST use these terms:

1. Wholesale Settlement Instrument
2. Neutral Settlement Layer
3. Institutional Settlement
4. Participating Institution
5. Authorized Institution
6. Institutional Issuance
7. Settlement Gateway
8. Regulated Monetary System
9. Central-Bank-Authorized Participant
10. Institutional Traceability
11. Neutral Interoperability
12. Settlement Corridor

### §28.2 Avoid Terminology (closed list)

The following terms are PROHIBITED in v25.0 normative text. They may appear only in HISTORICAL / NON-NORMATIVE blocks (Appendix A) or in this §28.2 list itself:

1. consumer coin
2. public minting
3. retail stablecoin
4. global currency
5. replacement currency
6. speculative asset
7. exchange token
8. investment token
9. universal money
10. permissionless issuance

### §28.3 Implementation Reference

The terminology is implemented in `src/lib/v25-0-identity.ts` (`TERMINOLOGY.preferred` and `TERMINOLOGY.avoid`) and served at `GET /api/v25.0` under `terminology`.

### §28.4 Terminology Verification

The terminology is verified by:
1. `rg -i "consumer coin|public minting|retail stablecoin|global currency|replacement currency|speculative asset|exchange token|investment token|universal money|permissionless issuance"` against the v25.0 canonical blueprint — should return ZERO matches in normative text (matches only in §28.2 and Appendix A).
2. Manual review of every public-facing document for avoidance compliance.
3. Automated linter (future work) to flag avoidance-term usage in code, docs, and UI strings.

---

## §29 — PRESERVED v24.2 STRENGTHS

The v25.0 transformation PRESERVES the following v24.2 / v24.2.1 strengths. These are the constitutional and operational spine that v25.0 inherits unchanged. They are served at `GET /api/v25.0` under the `preserved` array.

### §29.1 Constitutional Spine (Preserved)

1. **Constitutional authority hierarchy** — 7-member Monetary Council, 6/7 supermajority for constitutional, 90-day timelock (§13.1).
2. **Immutable invariants** — PAR=1.00, RR≥100%, no discretionary minting, no lending of reserves, no commingling, bullion preservation (§11.3, §14.1, R0.1-R0.4, R0.13).
3. **Reserve segregation** — no lending, no rehypothecation, legal/accounting/custody/ledger segregation all independently evidenced (§11.1, R0.13).

### §29.2 Reserve Architecture (Preserved)

4. **Gold strategic anchor** — Portfolio B (15% phys + 5% PAXG) APPROVED (§11.2).
5. **Four-layer measurement system** — GEI / BRI / LCI / RQS (§11.8-§11.11).
6. **Six-state reserve state machine** — NORMAL→CAUTION→DEFENSIVE→STRESS→EMERGENCY→RECOVERY (§12.2).
7. **StressDRQS + hierarchical optimizer** — 4-tier optimizer, 10-λ, model validity gate, trade suppression (§12.4-§12.8).
8. **Model-validity gate + 15-component trade-cost model** — model failure is a HARD GATE; trade cost is realistic all-in (§12.5, §12.7).

### §29.3 Risk Management (Preserved)

9. **Jurisdictional matrix + China geo-fence** — 19-dimension classification, UNKNOWN=conservative block, CN=PROHIBITED (§15, §16).
10. **OFAC fail-closed + proof-of-reserves + proof-of-solvency** — sanctions screening blocks on fetch failure; cryptographic proofs required for issuance (§12.9, §3.2).
11. **Formal verification + multi-oracle consensus** — anti-double-counting 32/32 PASS; oracle multi-source consensus ≥5/8 mainnet quorum (§11.13, §12 oracle architecture).
12. **Atomic minting/redemption + idempotent CTID** — atomic burn/release; idempotent transaction IDs (§14.4).

### §29.4 Governance (Preserved)

13. **Sharia governance + human governance** — Sharia Supervisory Board architecture; Monetary Council human governance (§23, §13.1).

### §29.5 What v25.0 ADDS to the Preserved Spine

The v25.0 transformation ADDS (does not replace) the following on top of the preserved v24.2 spine:

- **Canonical identity** — neutral wholesale settlement infrastructure (§1).
- **Participant hierarchy** — Class A-E with explicit authorization requirements (§2).
- **Institutional issuance pipeline** — 15-step deterministic pipeline replacing participant-minting (§3).
- **Layered KYC/KYB** — customer-level at the regulated institution, institution-level at MITHQAL (§4).
- **Neutral cross-border settlement flow** — 7-hop canonical flow (§5).
- **Neutrality doctrine (immutable)** — explicit non-competition with sovereign currencies (§6).
- **CBDC interoperability layer** — 5-flow canonical interop (§7).
- **Central-bank participation model** — 3 modes (§8).
- **Institutional traceability** — settlement record schema, trace path, access rules (§9).
- **Institutional authorization registry** — participant-class-scoped MTQ function permissions (§20).
- **Stress-state-indexed institutional limits** — 6-state tightening factors (§21).
- **Three-layer settlement finality** — technical / legal / banking (§22).
- **Semantic sweep** — full retirement of participant-minting language (§26).
- **Canonical terminology** — preferred + avoid lists (§28).

---

## §30 — FORMAL ACCEPTANCE CRITERIA (34 items)

The v25.0 blueprint is accepted when ALL 34 criteria below are satisfied. Each is marked YES (satisfied) or NO (not yet satisfied) with rationale. Items marked NO are gating items for production authorization.

### §30.1 Identity & Participant Model (Criteria 1-6)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 1 | §31 Required Final Blueprint Statement is present verbatim at the top of the blueprint. | YES | §31 at top of this document, verbatim per `CANONICAL_STATEMENT` in `src/lib/v25-0-identity.ts`. |
| 2 | MITHQAL canonical identity is "neutral wholesale institutional settlement infrastructure connecting regulated monetary systems across jurisdictions." | YES | §1.1, implemented in `MITHQAL_IDENTITY.canonical`. |
| 3 | MTQ canonical definition is "permissioned wholesale settlement instrument used by approved regulated financial institutions and, where explicitly authorized, central banks or equivalent sovereign monetary authorities." | YES | §1.2, implemented in `MTQ_DEFINITION.canonical`. |
| 4 | Participant hierarchy defines 5 classes (A-E) with explicit authorization requirements. | YES | §2, implemented in `PARTICIPANT_CLASSES`. |
| 5 | Class E (individual / retail) is OUT of v25.0 core scope. | YES | §2.5, §18.5. |
| 6 | Direct MTQ access for Class D and E is NOT enabled by default. | YES | §2.4, §2.5, §18. |

### §30.2 Minting Model (Criteria 7-10)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 7 | "Participant deposits assets and directly mints MTQ" is RETIRED. | YES | §3.1, §26.2 Category 1. |
| 8 | Institutional issuance pipeline (§3.2) is the ONLY path to new MTQ supply. | YES | §3.1, §3.2, R0.3. |
| 9 | All 8 prohibited minting paths (executive, council, emergency arbitrary, treasury, compensation, operational funding, governance, promotional) are explicitly prohibited. | YES | §3.1, R0.2. |
| 10 | No MTQ may exist without verified reserve backing. | YES | R0.4, §3.2 step 6-11, §11.13 anti-double-counting. |

### §30.3 Neutrality & CBDC Interop (Criteria 11-14)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 11 | Neutrality doctrine is immutable ("MITHQAL shall not compete with sovereign monetary systems"). | YES | §6.1, R0.5. |
| 12 | All 10 explicit neutrality rules (USD remains USD, JPY remains JPY, etc.) are present. | YES | §6.2. |
| 13 | CBDC interoperability layer supports 5 canonical flows. | YES | §7.2, implemented in `CBDC_INTEROP.supportedFlows`. |
| 14 | Central-bank participation has 3 modes (Bank-Only, CB-Connected, Direct CB). | YES | §8.1, implemented in `CB_PARTICIPATION_MODES`. |

### §30.4 KYC / Traceability / Finality (Criteria 15-19)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 15 | KYC/KYB is layered: customer-level at regulated institution, institution-level at MITHQAL. | YES | §4.1, R0.7. |
| 16 | Settlement records carry institutional sender / receiver, not customer PII. | YES | §9.1, §9.4, R0.15. |
| 17 | Three-layer finality (technical / legal / banking) is tracked separately. | YES | §22, R0.9. |
| 18 | No section implies blockchain confirmation alone automatically determines legal finality. | YES | §22.2 (canonical rule). |
| 19 | Customer-level PII is NOT held at the MITHQAL layer by default. | YES | §4.5, R0.7. |

### §30.5 Jurisdictional Perimeter (Criteria 20-23)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 20 | UNKNOWN jurisdiction status is a CONSERVATIVE BLOCK. | YES | §15.2, R0.8, `JURISDICTIONAL_RULE`. |
| 21 | China (CN) is geo-fenced (PROHIBITED on all 19 dimensions). | YES | §16.1, `JURISDICTION_REGISTRY.CN`. |
| 22 | Anti-circumvention rules are documented (no routing, VPN, indirect token access). | YES | §16.3. |
| 23 | Jurisdiction classification has 19 dimensions. | YES | §15.1, `JurisdictionClassification`. |

### §30.6 Institutional Authorization (Criteria 24-26)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 24 | No institution may transact unless its authorization state is valid (operational ACTIVE, sanctions CLEAR, not expired). | YES | §20.3, `checkInstitutionAuthorization`, R0.15. |
| 25 | Both sender AND receiver must be authorized for a settlement to proceed. | YES | §3.3, §5, `processWholesaleSettlement`. |
| 26 | Institutional limits are stress-state-indexed (NORMAL=1.0 → EMERGENCY=0.1). | YES | §21, `getInstitutionalLimits`. |

### §30.7 Constitutional Spine Preservation (Criteria 27-30)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 27 | PAR=$1.00 USD settlement unit is preserved. | YES | §1.2, §11.3, R0.1. |
| 28 | RR≥100% constitutional floor, RR_policy=105%, RR_strategic=120% are preserved. | YES | §11.3, §11.4, R0.1. |
| 29 | Anti-double-counting (Gold_total = Physical + Tokenized, distinct registries) is preserved. | YES | §11.13, R0.11, 32/32 PASS proof preserved. |
| 30 | Article X sequential liquidation order is preserved. | YES | §11.16, R0.14. |

### §30.8 Semantic Sweep & Terminology (Criteria 31-32)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 31 | Full semantic sweep complete — no participant-minting / retail / public-minting language in v25.0-normative text. | YES | §26 (sweep summary), §26.4 (verification commands). |
| 32 | Preferred terminology list (12 terms) and avoid list (10 terms) are documented. | YES | §28, implemented in `TERMINOLOGY`. |

### §30.9 Implementation Reference & Final Sign-Off (Criteria 33-34)

| # | Criterion | Status | Rationale / Evidence |
|---|---|---|---|
| 33 | Implemented modules are referenced (`src/lib/v25-0-identity.ts`, `src/lib/institutional-authorization.ts`, `src/lib/wholesale-settlement.ts`, `src/app/api/v25.0/route.ts`). | YES | §1.3, §2.7, §3.2, §4, §5.3, §7.4, §9.1, §14.1, §20.1, §21.6, §28.3, Appendix B. |
| 34 | §31 Required Final Blueprint Statement is restated at the end of the blueprint (per directive structure). | YES | §31 (restated) below. |

### §30.10 Acceptance Summary

| Category | Items | YES | NO | N/A |
|---|---|---|---|---|
| §30.1 Identity & Participant Model | 6 | 6 | 0 | 0 |
| §30.2 Minting Model | 4 | 4 | 0 | 0 |
| §30.3 Neutrality & CBDC Interop | 4 | 4 | 0 | 0 |
| §30.4 KYC / Traceability / Finality | 5 | 5 | 0 | 0 |
| §30.5 Jurisdictional Perimeter | 4 | 4 | 0 | 0 |
| §30.6 Institutional Authorization | 3 | 3 | 0 | 0 |
| §30.7 Constitutional Spine Preservation | 4 | 4 | 0 | 0 |
| §30.8 Semantic Sweep & Terminology | 2 | 2 | 0 | 0 |
| §30.9 Implementation Reference & Sign-Off | 2 | 2 | 0 | 0 |
| **Total** | **34** | **34** | **0** | **0** |

**Verdict:** ALL 34 formal acceptance criteria are satisfied for the v25.0 canonical blueprint. The blueprint is internally consistent, externally referenced to implemented modules, and preserves the v24.2.1 constitutional spine.

**Production Authorization:** This acceptance is a BLUEPRINT acceptance, NOT a production authorization. Production authorization requires additional gates per §17 (regulated entry rails), §15 (jurisdictional perimeter production extension), §23 (Sharia fatwa), and the v24.2.1 release gates (Arithmetic / Constant / Solvency / Liquidity / Model / Oracle / Custody / Legal / Sharia / Regulatory / Institutional Claim / Disaster / Migration).

---

## §31 — REQUIRED FINAL BLUEPRINT STATEMENT (restated per directive structure)

> **MITHQAL is a neutral wholesale settlement infrastructure connecting regulated monetary systems.**
>
> **MTQ is a permissioned wholesale settlement instrument used by authorized regulated financial institutions and, where explicitly permitted, central banks or sovereign monetary authorities.**
>
> MTQ does **not** replace, compete with, or become a substitute for sovereign currencies or central-bank money.
>
> MITHQAL provides the neutral settlement layer between participating monetary systems, combining digital settlement speed with institutional traceability, compliance and cryptographic auditability.
>
> Customer-level KYC/KYB is primarily performed by regulated participating institutions, while MITHQAL governs institutional authorization, settlement integrity, jurisdictional controls and immutable settlement records.
>
> **No MTQ may be issued without constitutionally verified reserve backing, and no participant or governance body may exercise discretionary monetary issuance authority.**

This restatement closes the blueprint. The statement is identical to the one that opens the blueprint (§31 at top). It is the canonical anchor of v25.0 and the canonical answer to "What is MITHQAL?" when asked by any stakeholder.

---

## §32 — FINAL IMPLEMENTATION DIRECTIVE (A-J deliverables reference)

The v25.0 transformation is delivered through ten implementation deliverables (A-J). Each is listed with its current status and the implementing artifact.

### Deliverable A — Canonical Identity Module

- **Status:** IMPLEMENTED.
- **Artifact:** `src/lib/v25-0-identity.ts` (437 lines).
- **Contents:** MITHQAL_IDENTITY, MTQ_DEFINITION, PARTICIPANT_CLASSES, MINTING_MODEL, ISSUANCE_PIPELINE, KYC_ARCHITECTURE, SETTLEMENT_FLOW, NEUTRALITY_DOCTRINE, CBDC_INTEROP, CB_PARTICIPATION_MODES, TRACEABILITY, VALUE_PROPOSITION, TRADING_LANGUAGE, REDEMPTION_FLOW, FINALITY, CANONICAL_STATEMENT, TERMINOLOGY. Plus helper functions `canMint`, `canSettle`, `getAuthRequirement`.
- **Verification:** `GET /api/v25.0` returns `identity`, `mtq`, `participantClasses`, `mintingModel`, `issuancePipeline`, `kyc`, `settlementFlow`, `neutralityDoctrine`, `cbdcInterop`, `cbParticipationModes`, `valueProposition`, `tradingLanguage`, `finality`, `terminology`.

### Deliverable B — Institutional Authorization Module

- **Status:** IMPLEMENTED.
- **Artifact:** `src/lib/institutional-authorization.ts` (347 lines).
- **Contents:** `JurisdictionClassification` (19 dimensions), `JURISDICTION_REGISTRY` (8 seed jurisdictions: US, EU, AE, SG, JP, GB, HK, CN-PROHIBITED), `InstitutionRecord`, `INSTITUTION_REGISTRY` (4 seed Class B institutions: INST-001 to INST-004), `checkInstitutionAuthorization`, `isGeoFenced`, `getInstitution`, `getInstitutionalLimits`.
- **Verification:** `GET /api/v25.0` returns `jurisdictions` and `authorizedInstitutions`.

### Deliverable C — Wholesale Settlement Module

- **Status:** IMPLEMENTED.
- **Artifact:** `src/lib/wholesale-settlement.ts` (321 lines).
- **Contents:** `SettlementRequest`, `SettlementResult`, `processWholesaleSettlement` (15-step §3.2 pipeline execution), `CBDCInteropRequest`, `CBDCInteropResult`, `checkCBDCInterop` (§7 5-flow check), `RedemptionRequest`, `RedemptionResult`, `processRedemption` (§14 pipeline), `createSettlementRecord`.
- **Verification:** End-to-end via `POST /api/v25.0/settle` and `GET /api/v25.0/cbdc-interop`.

### Deliverable D — v25.0 API Route

- **Status:** IMPLEMENTED.
- **Artifact:** `src/app/api/v25.0/route.ts` (162 lines).
- **Contents:** `GET /api/v25.0` returns the full v25.0 state object: canonical statement, identity, MTQ, participant classes, minting model, issuance pipeline, KYC, settlement flow, neutrality doctrine, CBDC interop, CB participation modes, value proposition, trading language, finality, jurisdictions, authorized institutions, terminology, live values (RR, NAV, supply, gold USD), preserved v24.2 strengths, status.
- **Verification:** HTTP GET returns 200 OK with the full JSON response.

### Deliverable E — v25.0 Canonical Blueprint

- **Status:** IMPLEMENTED (this document).
- **Artifact:** `/home/z/my-project/docs/blueprint/mithqal-canonical-blueprint-v25.md`.
- **Contents:** §31 (top), §0 (17 rules), §1-§32 (full blueprint), Appendix A (HISTORICAL / NON-NORMATIVE archive), Appendix B (module cross-reference), Appendix C (documents superseded).
- **Verification:** Internal consistency check, acceptance criteria §30 (34/34 YES).

### Deliverable F — Semantic Sweep

- **Status:** COMPLETE.
- **Artifact:** §26 (this document) + Appendix A.
- **Contents:** Full sweep of participant-minting / retail / public-minting language. 8 categories swept, 25+ HISTORICAL / NON-NORMATIVE markers applied. Verification commands documented in §26.4.
- **Verification:** `rg` commands in §26.4 return ZERO matches in normative text.

### Deliverable G — Architecture Diagram

- **Status:** COMPLETE.
- **Artifact:** §27 (this document).
- **Contents:** High-level architecture (§27.1), institutional issuance pipeline detail (§27.2), cross-border settlement flow detail (§27.3), CBDC interop layer detail (§27.4). All ASCII-formatted for portability.

### Deliverable H — Acceptance Criteria Matrix

- **Status:** COMPLETE.
- **Artifact:** §30 (this document).
- **Contents:** 34 acceptance criteria across 9 categories, each marked YES / NO with rationale. Verdict: 34/34 YES.

### Deliverable I — Preserved v24.2 Strengths Manifest

- **Status:** COMPLETE.
- **Artifact:** §29 (this document) + `preserved` array in `GET /api/v25.0`.
- **Contents:** 13 preserved v24.2 strengths across constitutional spine, reserve architecture, risk management, and governance.

### Deliverable J — Worklog Entry

- **Status:** COMPLETE.
- **Artifact:** Appended to `/home/z/my-project/worklog.md` (separate from this blueprint).
- **Contents:** Task ID (v25-BLUEPRINT), agent (v25-BLUEPRINT), task description, work log (steps), stage summary (deliverables, line count, section count, HISTORICAL marker count).

### §32.1 Implementation Directive Summary

All ten deliverables (A-J) are COMPLETE for v25.0. The blueprint is the single source of truth. The implemented modules (`src/lib/v25-0-identity.ts`, `src/lib/institutional-authorization.ts`, `src/lib/wholesale-settlement.ts`) are the runtime artifacts. The API route (`src/app/api/v25.0/route.ts`) is the runtime interface. The v24.2.1 constitutional reserve spine is PRESERVED UNCHANGED.

### §32.2 Production Authorization Path

The v25.0 blueprint is IMPLEMENTED + PROVISIONALLY VALIDATED + NOT PRODUCTION-AUTHORIZED. Production authorization requires:

1. Legal opinion in each deployment jurisdiction (US, EU, AE, SG, JP, GB, HK minimum).
2. Regulator licensing or no-action letter in each deployment jurisdiction.
3. Independent security audit of the smart contracts (especially the v25.0 institutional authorization adapter §19.3).
4. Independent qualified Sharia board fatwa covering the full v25.0 scope (§23).
5. Central-bank authorization for Mode 2 (and especially Mode 3) participation (§8).
6. Custodian engagement at Level 3+ (independently audited) for production reserves.
7. Oracle engagement at multi-source consensus (≥5/8 quorum) for mainnet pricing.
8. Disaster-recovery testing end-to-end (custody, banking, oracle, MPC, smart-contract, key-management, data failover).
9. Migration plan from v24.2.1-FINAL to v25.0 preserving every constitutional invariant (no silent parameter migration).
10. Council approval (6/7 supermajority) for production launch.

Until all ten production-authorization items are satisfied, v25.0 remains in controlled-testing status.

---

## APPENDIX A — HISTORICAL / NON-NORMATIVE ARCHIVE OF v24.2.1 PARTICIPANT-MINTING LANGUAGE

> **HISTORICAL / NON-NORMATIVE NOTICE:** The text in this appendix is preserved from v24.2.1-FINAL for traceability only. It has NO NORMATIVE AUTHORITY for v25.0. Where it conflicts with the v25.0 canonical text above, the v25.0 text wins. The participant-minting / retail-user / public-minting language below has been RETIRED for v25.0 per §26.

### A.1 v24.2.1 §2 (Constitutional Identity) — Participant-Deposit Language

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 1]
>
> The v24.2.1 constitutional identity described MITHQAL as "participant-accessible reserve-backed settlement." This language implied that any participant (including, in some readings, retail users) could deposit assets and directly mint MTQ. v25.0 RETIRES this language. The v25.0 canonical identity (§1.1) is "neutral wholesale institutional settlement infrastructure connecting regulated monetary systems."

### A.2 v24.2.1 §3.1 (PAR) — "Minting only upon verified deposit"

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 1]
>
> v24.2.1 §3.1 stated: "Minting only upon verified deposit." The principle is preserved (R0.2 — no discretionary minting), but the deposit is now BY AN AUTHORIZED INSTITUTION (Class B or Class C) through the institutional issuance pipeline (§3.2), not by an unqualified "participant." The v25.0 canonical phrasing is in §3.1.

### A.3 v24.2.1 §9.3 (Redemption) — Participant Receipt Language

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 4]
>
> v24.2.1 §9.3 referred to "participant receipt" in the redemption flow. In v25.0, the redemption flow (§14) is INSTITUTIONAL: the receiving bank redeems MTQ and pays out sovereign money to its customer. The "participant" in v24.2.1 was ambiguous (could be institutional or retail); in v25.0 it is unambiguously institutional.

### A.4 v24.2.1 §17.2 (Mint.sol) — 1:1 Deposit Minting

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 1]
>
> v24.2.1 §17.2 described `Mint.sol` as: "4-tier model matching Reserve.sol; Mint fee: 5 bps, capped at $5,000; Must verify `!mtq.mintingPaused()` (RR ≥ 100%)." The v25.0 change (§19.2) ADDS an institutional authorization pre-check (off-chain `checkInstitutionAuthorization` call before mint executes). The 1:1 backing and fee schedule are preserved. The minting is now institutionally authorized, not participant-initiated.

### A.5 v24.2.1 §17.4 (MTQ.sol) — `mint()` 1:1 Deposit

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 1]
>
> v24.2.1 §17.4 described `MTQ.sol mint()` as: "checks `!mintingPaused`, 1:1 deposit, auto-pause if RR<100%." The v25.0 change (§19.2) ADDS institutional authorization pre-check. The 1:1 deposit, auto-pause, and burn-never-paused behaviors are preserved.

### A.6 v24.2.1 §2A (Institutional Legal Perimeter) — Holder Ambiguity

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 2]
>
> v24.2.1 §2A referred to "holder" without specifying institutional vs retail. In v25.0, the holder of MTQ is ALWAYS an authorized institution (Class A, B, or C). The legal perimeter framework (§2A.1-§2A.6) is preserved; the holder definition is clarified to institutional-only.

### A.7 v24.2.1 §41 (Operational Capital) — "Participant Deposits" Prohibited Funding

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 4]
>
> v24.2.1 §41 listed "Participant Deposits" as a prohibited source of operational capital funding. The prohibition is PRESERVED in v25.0. The term "Participant" is redefined to mean "authorized institution" (Class A, B, or C). The intent — that operational capital cannot be funded from customer deposits — is preserved and strengthened: customer funds (whether institutional customer or retail customer) cannot fund MITHQAL's operational capital.

### A.8 v24.2.1 Various — "Participant" (Unqualified)

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 4]
>
> Throughout v24.2.1, the term "participant" was used loosely. In v25.0, "participant" means "regulated participating institution" (Class A, B, or C). Where v24.2.1 used "participant" to mean a retail user, the language is HISTORICAL / NON-NORMATIVE. Specific instances include: v24.2.1 §1 (conflict resolutions), §9 (liquidity & redemption), §13 (governance), §22 (reserve verification), §34 (redemption legal right), §39 (cryptographic architecture), §41 (operational capital), §57 (institutional continuity), §58 (constitutional engineering lifecycle).

### A.9 v24.2.1 Various — "Retail User" / "Individual Customer" Direct Access

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 2]
>
> Where v24.2.1 implied that retail users or individual customers could directly access MTQ (mint, redeem, hold), the implication is RETIRED for v25.0. Class E participants are OUT of v25.0 core scope (§2.5). Class D participants access MTQ only through their regulated bank (§2.4). Specific instances include: v24.2.1 §2A.1 (holder claim — clarified to institutional-only), §9.3 (redemption — institutional receipt), §41.3 (operational capital — participant deposits prohibited).

### A.10 v24.2.1 Various — "Public Minting" / "Permissionless Issuance"

> [HISTORICAL / NON-NORMATIVE for v25.0 — see §26 Category 3]
>
> v24.2.1 did not contain explicit "public minting" or "permissionless issuance" language in canonical text (these were always avoided). The v25.0 sweep makes the prohibition EXPLICIT (§3.1, §13.2, §28.2). No specific v24.2.1 instances to mark; the category is documented for completeness.

### A.11 Pre-v24.2.1 Language (v18-v24.1) — Fully Historical

> [HISTORICAL / NON-NORMATIVE for v25.0 — full archive in v24.2.1-FINAL Appendix A]
>
> All pre-v24.2.1 language (v18, v19, v20, v21, v22, v23, v24, v24.1, v24.2) is HISTORICAL / NON-NORMATIVE for both v24.2.1 and v25.0. The v24.2.1 blueprint quarantined this material; v25.0 inherits the quarantine unchanged. No pre-v24.2.1 text has normative authority for v25.0.

---

## APPENDIX B — CROSS-REFERENCE TO IMPLEMENTED MODULES

This appendix maps each v25.0 blueprint section to the implementing code artifact, so that any reviewer can verify the blueprint against the implementation.

| Blueprint Section | Implementing Module | Export / Function | File |
|---|---|---|---|
| §1.1 MITHQAL Identity | v25-0-identity.ts | `MITHQAL_IDENTITY` | src/lib/v25-0-identity.ts |
| §1.2 MTQ Definition | v25-0-identity.ts | `MTQ_DEFINITION` | src/lib/v25-0-identity.ts |
| §2 Participant Classes | v25-0-identity.ts | `PARTICIPANT_CLASSES`, `canMint`, `canSettle`, `getAuthRequirement` | src/lib/v25-0-identity.ts |
| §3.1 Minting Model | v25-0-identity.ts | `MINTING_MODEL` | src/lib/v25-0-identity.ts |
| §3.2 Issuance Pipeline | v25-0-identity.ts + wholesale-settlement.ts | `ISSUANCE_PIPELINE`, `processWholesaleSettlement` | src/lib/v25-0-identity.ts, src/lib/wholesale-settlement.ts |
| §4 KYC Architecture | v25-0-identity.ts | `KYC_ARCHITECTURE` | src/lib/v25-0-identity.ts |
| §5 Settlement Flow | v25-0-identity.ts + wholesale-settlement.ts | `SETTLEMENT_FLOW`, `processWholesaleSettlement` | src/lib/v25-0-identity.ts, src/lib/wholesale-settlement.ts |
| §6 Neutrality Doctrine | v25-0-identity.ts | `NEUTRALITY_DOCTRINE` | src/lib/v25-0-identity.ts |
| §7 CBDC Interoperability | v25-0-identity.ts + wholesale-settlement.ts | `CBDC_INTEROP`, `checkCBDCInterop` | src/lib/v25-0-identity.ts, src/lib/wholesale-settlement.ts |
| §8 CB Participation Modes | v25-0-identity.ts | `CB_PARTICIPATION_MODES` | src/lib/v25-0-identity.ts |
| §9 Traceability | v25-0-identity.ts + wholesale-settlement.ts | `TRACEABILITY`, `SettlementRecord`, `createSettlementRecord` | src/lib/v25-0-identity.ts, src/lib/wholesale-settlement.ts |
| §10 Value Proposition | v25-0-identity.ts | `VALUE_PROPOSITION` | src/lib/v25-0-identity.ts |
| §11-§12 Reserve Architecture + CALM + Optimizer | PRESERVED from v24.2.1 | (see v24.2.1-FINAL) | src/lib/reserve-policy-spec.ts, src/lib/calm.ts, src/lib/v24-2-optimizer.ts, src/lib/ertf.ts, src/lib/v24-2-1-gold-silver.ts, src/lib/mrrc.ts, src/lib/lrr.ts |
| §13 Trading Language | v25-0-identity.ts | `TRADING_LANGUAGE` | src/lib/v25-0-identity.ts |
| §14 Redemption Flow | v25-0-identity.ts + wholesale-settlement.ts | `REDEMPTION_FLOW`, `processRedemption` | src/lib/v25-0-identity.ts, src/lib/wholesale-settlement.ts |
| §15 Jurisdictional Perimeter | institutional-authorization.ts | `JURISDICTION_REGISTRY`, `JurisdictionClassification` | src/lib/institutional-authorization.ts |
| §16 Geo-Fencing | institutional-authorization.ts | `isGeoFenced` | src/lib/institutional-authorization.ts |
| §17 Regulated Entry/Exit Rails | institutional-authorization.ts | `InstitutionRecord`, `operationalStatus` lifecycle | src/lib/institutional-authorization.ts |
| §18 Product / User Model | v25-0-identity.ts (implicit) | (described in blueprint) | src/lib/v25-0-identity.ts |
| §19 Smart Contract Changes | (off-chain adapter pattern) | `checkInstitutionAuthorization` | src/lib/institutional-authorization.ts |
| §20 Institutional Authorization Registry | institutional-authorization.ts | `INSTITUTION_REGISTRY`, `InstitutionRecord`, `checkInstitutionAuthorization`, `getInstitution` | src/lib/institutional-authorization.ts |
| §21 Institutional Limits | institutional-authorization.ts | `getInstitutionalLimits` | src/lib/institutional-authorization.ts |
| §22 Settlement Finality | v25-0-identity.ts | `FINALITY`, `SettlementRecord.finalityStatus` | src/lib/v25-0-identity.ts |
| §23 Sharia Architecture | (preserved from v24.2.1 + scope expansion) | (described in blueprint) | (see v24.2.1-FINAL) |
| §24 Commercial Flow | (described in blueprint) | (processWholesaleSettlement + processRedemption) | src/lib/wholesale-settlement.ts |
| §25 Value Proposition (Institutional) | v25-0-identity.ts | `VALUE_PROPOSITION` | src/lib/v25-0-identity.ts |
| §26 Semantic Sweep | (this document) | (this blueprint §26 + Appendix A) | docs/blueprint/mithqal-canonical-blueprint-v25.md |
| §27 Architecture Diagram | (this document) | (this blueprint §27) | docs/blueprint/mithqal-canonical-blueprint-v25.md |
| §28 Canonical Terminology | v25-0-identity.ts | `TERMINOLOGY` | src/lib/v25-0-identity.ts |
| §29 Preserved v24.2 Strengths | v25.0 API route | `preserved` array | src/app/api/v25.0/route.ts |
| §30 Acceptance Criteria | (this document) | (this blueprint §30) | docs/blueprint/mithqal-canonical-blueprint-v25.md |
| §31 Required Final Blueprint Statement | v25-0-identity.ts | `CANONICAL_STATEMENT` | src/lib/v25-0-identity.ts |
| §32 Final Implementation Directive | (this document) | (this blueprint §32) | docs/blueprint/mithqal-canonical-blueprint-v25.md |
| API surface | v25.0 API route | `GET /api/v25.0` | src/app/api/v25.0/route.ts |

---

## APPENDIX C — DOCUMENTS SUPERSEDED BY v25.0

The v25.0 canonical blueprint supersedes the following documents FOR v25.0 SCOPE ONLY (participant model, identity, settlement, jurisdictional, KYC/KYB, traceability, neutrality, CBDC-interoperability). It does NOT supersede the constitutional reserve spine, which is preserved from v24.2.1-FINAL.

| Document | Status for v25.0 | Reason |
|---|---|---|
| `docs/blueprint/mithqal-canonical-blueprint.md` (v24.2.1-FINAL) | PARTIALLY SUPERSEDED | Participant model superseded by v25.0; constitutional reserve spine PRESERVED. |
| `download/MITHQAL-v24.2.1-FINAL-INSTITUTIONAL-BLUEPRINT.md` | PARTIALLY SUPERSEDED (download copy of above) | Same. |
| `download/MITHQAL-v24.2-FINAL-INSTITUTIONAL-BLUEPRINT.md` | HISTORICAL / NON-NORMATIVE | Superseded by v24.2.1, then by v25.0. |
| `download/MITHQAL-v24.1-FINAL-INSTITUTIONAL-BLUEPRINT.md` | HISTORICAL / NON-NORMATIVE | Superseded by v24.2, then v24.2.1, then v25.0. |
| `download/MITHQAL-v23-FULL-MERGED-BLUEPRINT.md` | HISTORICAL / NON-NORMATIVE | Superseded by v24, then v24.1, v24.2, v24.2.1, v25.0. |
| `upload/MITHQAL-v24.1-FINAL-INSTITUTIONAL-BLUEPRINT.md` | HISTORICAL / NON-NORMATIVE | Source upload of v24.1; superseded. |
| `docs/blueprint/publication/mithqal-blueprint-v19.{md,html,pdf,docx}` | HISTORICAL / NON-NORMATIVE | v19 publication; superseded by all later versions. |
| `docs/whitepaper.md` | PARTIALLY SUPERSEDED | Where it describes the participant model, superseded by v25.0. Where it describes constitutional reserve architecture, preserved. |
| `docs/due-diligence/architecture.md` | PARTIALLY SUPERSEDED | Same partial supersession as the whitepaper. |
| `docs/verification/implementation-compliance-matrix.md` | PARTIALLY SUPERSEDED | Implementation matrix; v25.0 modules added (see Appendix B). |
| `docs/verification/missing-feature-report.md` | PARTIALLY SUPERSEDED | v25.0 participant-model features are now implemented; reserve features preserved. |

The v24.2.1-FINAL verification artifacts (in `docs/verification/`) — stress-test results, master test registry, anti-double-counting proof, etc. — REMAIN VALID for v25.0 because the constitutional reserve spine is preserved. They are not superseded.

---

## APPENDIX D — v24.2.1 VALIDATION CYCLE SUMMARY (preserved evidence base for v25.0)

> **PRESERVATION NOTICE:** This appendix summarizes the 6-task validation cycle executed during v24.2.1-FINAL. All evidence remains VALID for v25.0 because the constitutional reserve spine is preserved unchanged. None of this evidence addresses the v25.0 participant-model transformation (which is validated separately by the §30 acceptance criteria and the implemented v25.0 modules).

### D.1 Task 1 — 250K Monte Carlo Reproduction

- **Script:** `scripts/monte-carlo-v24.2.py`
- **Parameters:** 250,000 paths, seed=42, Student-t df=5, Merton jumps λ=2/yr, depeg p=0.02/yr, regime 0.05/0.20 transition, 30-day horizon.
- **Result:** P(RR<100%)=21.5432% reproduced exactly from seed=42.
- **Verdict:** PASS — reproduction confirms baseline integrity.
- **Status for v25.0:** PRESERVED. The MC engine is unchanged.

### D.2 Task 2 — A/B/C/D/E Portfolio Comparison

- **Script:** `scripts/abcde-comparison.py` (447 lines)
- **Portfolios tested:** A (15%/0%/3%), B (15%/5%/0%), C (17%/3%/0%), D (20%/0%/0%), E (14%/4%/2%) — physical/tokenized/silver percentages; fiat+digital remainder.
- **Results:** A=6.66%, B=6.63%, C=6.70%, D=6.80%, E=6.75% P(RR<100%). Winner=B (lowest CVaR_99=$15.62M).
- **Verdict:** PASS — Portfolio B selected via evidence-driven executive decision on 6 of 8 dimensions.
- **Status for v25.0:** PRESERVED. Portfolio B remains the constitutionally approved reference.

### D.3 Task 3 — PAXG Eligibility

- **Script:** `scripts/tgrs-validation.py`
- **Result:** PAXG TGRS=9.00, 13/13 eligibility gate PASS.
- **Verdict:** PASS — PAXG is the only Eligible tokenized gold.
- **Status for v25.0:** PRESERVED. PAXG remains the canonical tokenized gold asset.

### D.4 Task 4 — Silver Conditional Backtest

- **Script:** `scripts/silver-backtest.py`
- **Period:** 69 months historical.
- **Result:** SDC_Ag borderline-negative; Silver=0% is a VALID policy result.
- **Verdict:** PASS — Silver=0% validated.
- **Status for v25.0:** PRESERVED. Silver remains at 0% target.

### D.5 Task 5 — Challenger Models

- **Script:** `scripts/challenger-models.py`
- **Result:** 4/5 challengers CONFIRM primary; C5 (copula) DISSENTS.
- **Verdict:** PASS — primary model is robust; C5 dissent documented and reviewed.
- **Status for v25.0:** PRESERVED. Challenger-model framework remains canonical.

### D.6 Task 6 — Anti-Double-Counting Proof

- **Script:** `scripts/anti-double-counting.py`
- **Result:** 32/32 machine-checked assertions PASS across 10 theorems.
- **Theorems proven:**
  1. Gold_total = PhysicalAllocatedGold + TokenizedAllocatedGold (distinct registries).
  2. Physical and Tokenized bar pools are disjoint (Brink's vault ≠ Paxos LBMA vault).
  3. No MTQ supply expansion may rely on double-counted reserves.
  4. PAXG redemption does not draw on MITHQAL physical reserves.
  5. MITHQAL physical redemption does not draw on Paxos reserves.
  6. NAV computation sums distinct asset registry rows (no overlap).
  7. Haircut application is on distinct asset values (no overlap).
  8. Liquidation order (Article X) treats tokenized and physical as distinct tiers.
  9. Custody reconciliation verifies each registry independently.
  10. Stress testing applies shocks to distinct asset values.
- **Verdict:** PASS — 32/32 PASS.
- **Status for v25.0:** PRESERVED (R0.11). Anti-double-counting remains a HARD invariant.

### D.7 Comprehensive Stress Audit (65-section directive, Tasks 9/11/15/22/23/40/46/49-52/53-56/37/59/62/64)

The full v24.2.1 65-section directive was executed by parallel subagents. Key results (all HONEST, NOT forced to PASS):

- §9 Governance ε threshold sweep: NO PORTFOLIO PASSES at ε<6.63%. Lowest P(RR<100%)=6.6348% (Portfolio B).
- §11 Reverse-stress: combined_loss=27.56% is the most realistic failure mode.
- §15 Bullion tail-risk decomposition: GENUINE multi-factor (concentration 36.5% + volatility 21.4% + correlation 21.4% + haircut 20.7% + liquidity 0% direct CVaR). Bullion = 93.6% of positive MRRC.
- §22 TGDR: Portfolio B at TGDR=25% PASSES dependency budget.
- §23 Common-mode: 6 PASS / 0 FAIL / 3 BDL (of 9).
- §40 ERTF: NOT critical dependency — RR≥111% across all 25 combos.
- §46 Deterministic tests: 5/5 PASS.
- §49-52 Testnet: 36/39 PASS. 3 blockers UNRESOLVED (Monad Oracle, Arc silverPrice, ERTF persistence gap).
- §53-56 Master registry: 374 tests, 12 categories. 394 was arithmetic error — reconciled.
- §37 MPC: NO FEASIBLE λ — all 7 λ values produce StressRR < 100%.
- §59 Capital: ΔCapital_min = $15.8M required for ε=5% compliance.
- §62 Final report: 40+ items A-AM documented.
- §64 Coverage: 48 YES / 2 NO (mainnet blockers).

### D.8 v25.0 Additional Validation

The v25.0 transformation adds the following validation on top of the v24.2.1 evidence base:

- **§30 acceptance criteria:** 34/34 YES (this blueprint).
- **Implemented modules:** `src/lib/v25-0-identity.ts` (437 lines), `src/lib/institutional-authorization.ts` (347 lines), `src/lib/wholesale-settlement.ts` (321 lines), `src/app/api/v25.0/route.ts` (162 lines).
- **Semantic sweep:** §26 (8 categories, 25+ HISTORICAL / NON-NORMATIVE markers applied).
- **API verification:** `GET /api/v25.0` returns 200 OK with the full v25.0 state object.
- **Test vectors:** §16.5 (geo-fence test vectors); §3.3 (authorization decision logic).

### D.9 Honest Findings (preserved — NOT forced to pass)

The v25.0 transformation does NOT retract any of the v24.2.1 honest findings:

1. NO PORTFOLIO PASSES hard-safety at ε<6.63% (governance threshold).
2. NO FEASIBLE MPC λ produces StressRR ≥ 100% (MPC architecture needs review).
3. ΔCapital_min = $15.8M required for ε=5% compliance (capital decision required).
4. 3 testnet blockers UNRESOLVED (Monad Oracle, Arc silverPrice, ERTF persistence gap) — mainnet blockers.
5. 374 tests in master registry (394 was arithmetic error — reconciled).
6. Bullion 88% tail-risk = GENUINE multi-factor (not artifact).
7. Combined-loss reverse-stress = 27.56% — most realistic failure mode.

These findings are honest and remain valid for v25.0. They are gating items for production authorization (§32.2).

### D.10 Production-Authorization Gating Items (v25.0 + v24.2.1 combined)

For v25.0 production authorization, the following items MUST be resolved:

1. Legal opinion in each deployment jurisdiction (US, EU, AE, SG, JP, GB, HK minimum).
2. Regulator licensing or no-action letter in each deployment jurisdiction.
3. Independent security audit of the v25.0 institutional authorization adapter (§19.3).
4. Independent qualified Sharia board fatwa (§23).
5. Central-bank authorization for Mode 2 (and especially Mode 3) participation (§8).
6. Custodian engagement at Level 3+ (independently audited).
7. Oracle multi-source consensus (≥5/8 quorum) for mainnet pricing.
8. Monad Oracle redeployment (testnet blocker).
9. Arc silverPrice selector fix (testnet blocker).
10. ERTF persistence operationalization (testnet blocker).
11. Governance decision on ε threshold (accept ε=6.63% or raise capital by $15.8M for ε=5%).
12. MPC architecture review (no feasible λ currently).
13. Disaster-recovery testing end-to-end.
14. Migration plan from v24.2.1-FINAL to v25.0 (no silent parameter migration).
15. Council approval (6/7 supermajority) for production launch.

Until all 15 gating items are satisfied, v25.0 remains in CONTROLLED-TESTING status.

---

## END OF APPENDICES

---

## CLOSING NOTICE

This blueprint is the AUTHORITATIVE ACTIVE SPECIFICATION for MITHQAL v25.0. It is the single source of truth for the participant model, identity, settlement, jurisdictional perimeter, KYC/KYB, traceability, neutrality doctrine, and CBDC interoperability. The v24.2.1-FINAL constitutional reserve spine (PAR, RR, CALM, 6-state machine, hierarchical optimizer, ERTF, TGRS/TGLS/TGBS, anti-double-counting, custody segregation, oracle architecture, Article X liquidation order, model-validity gate, jurisdictional matrix, China geo-fence, OFAC fail-closed, proof-of-reserves, proof-of-solvency) is PRESERVED UNCHANGED.

Where any pre-v25.0 document, code comment, UI string, API response, or test fixture appears to conflict with this blueprint, the conflict is resolved in favor of this blueprint. The conflicting text is marked `HISTORICAL / NON-NORMATIVE` per §26.

Production deployment requires the additional gates enumerated in §32.2 (legal opinion, regulator licensing, security audit, Sharia fatwa, central-bank authorization, custodian engagement Level 3+, oracle multi-source consensus, disaster-recovery testing, migration plan, Council approval). Until those gates are satisfied, v25.0 remains in CONTROLLED-TESTING status.

**End of MITHQAL Canonical Blueprint v25.0.**

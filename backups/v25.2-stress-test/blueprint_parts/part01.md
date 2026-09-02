<!-- PART 01 — SECTIONS 0-4 -->
<!-- MITHQAL MASTER BLUEPRINT v25.2 — SINGLE SOURCE OF TRUTH -->
<!-- This part contains Sections 0-4: Executive Summary, Mission/Vision/Strategic
     Objective, Constitutional Principles, What MITHQAL Is, What MITHQAL Is Not -->

---

# MITHQAL MASTER BLUEPRINT — PART 01
## Sections 0 — 4 — Foundation, Identity, Constitution & Boundaries

**Version:** 25.2
**Document Type:** Single Source of Truth — Fully Expanded Canonical Blueprint
**Classification:** Institutional — For Regulated Financial Entities & Authorized Participants
**Authority:** COO + CTO + CFO + Project Manager + Monetary Systems Architect + Institutional Reserve Manager + Legal/Regulatory Architecture Lead
**Status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
**Status Color:** AMBER
**Part Scope:** Sections 0, 1, 2, 3, 4
**Pilot Model:** ONE REGULATED INSTITUTION · ONE JURISDICTION · ONE CORRIDOR
**Contact:** meltonsy@icloud.com

> **CONTROLLED INSTITUTIONAL DOCUMENT · NOT A LICENSE · NOT A LEGAL OPINION.**
> This document is a design-time architectural specification. It is not a license to
> operate, a regulatory clearance, a legal opinion, a bank contract, a custody agreement,
> an investment prospectus, or a financial guarantee. No representation herein may be
> treated as institutional validation, regulatory authorization, banking integration, or
> production readiness. All such validations require independent institutional evidence.

---

## TABLE OF CONTENTS — PART 01

- **Section 0 — Executive Summary**
  - 0.0 Preamble
  - 0.1 MITHQAL at a Glance
  - 0.2 Principal Architectural Statement
  - 0.3 The Single Most Important Architectural Principle
  - 0.4 The Locked Commercial Flow
  - 0.5 Canonical Identity
  - 0.6 Key Parameters Table (Controlling v25.2 Values)
  - 0.7 Reserve Composition Summary
  - 0.8 Currency & Settlement Universe Summary
  - 0.9 Finality-Before-Mint Summary
  - 0.10 Organizational Structure (5 Entities)
  - 0.11 Honest State Declaration (Aggregated)
  - 0.12 Implementation Status Summary
  - 0.13 Pilot-Readiness Summary
  - 0.14 Disclaimer

- **Section 1 — Mission, Vision & Strategic Objective**
  - 1.0 Section Purpose
  - 1.1 Mission Statement
  - 1.2 Vision Statement
  - 1.3 Strategic Objective — Build. Test. Validate.
  - 1.4 Strategic Pillars
  - 1.5 Pilot Model (9-Step Flow)
  - 1.6 Scope Constraint
  - 1.7 Engagement Discipline

- **Section 2 — Constitutional Principles**
  - 2.0 Section Purpose
  - 2.1 Invariant #1 — No Discretionary Minting
  - 2.2 Invariant #2 — No Final Settlement ⇒ No MTQ Mint
  - 2.3 Invariant #3 — MITHQAL Does Not Own, Custody, or Financially Guarantee MTQ Backing
  - 2.4 Invariant #4 — PAR-Referenced (Not USD-Pegged)
  - 2.5 Invariant #5 — Gold Is the Primary Constitutional Bullion Anchor
  - 2.6 Invariant #6 — 80/18/2 Reserve Composition Policy Center
  - 2.7 Invariant #7 — 130% Institutional Backing Target
  - 2.8 Invariant #8 — 15% Emergency Resilience Capacity Is Separate and Never Double-Counted
  - 2.9 Invariant #9 — 20% Hard Effective Concentration Limit
  - 2.10 Invariant #10 — MTQ Is a Neutral Institutional Settlement Unit
  - 2.11 Invariant #11 — USDT Is Not Normal Core Digital Backing
  - 2.12 Invariant #12 — Three-Book Economic Separation
  - 2.13 Invariant #13 — No Speculative Trading of Reserves
  - 2.14 Invariant #14 — No Sanctions or Control Circumvention
  - 2.15 Invariant #15 — Jurisdiction-Specific Authorization Required
  - 2.16 Invariant #16 — No Code-Only Capability Represented as Institutionally Validated
  - 2.17 Invariant #17 — No Production Authorization Until All Defined Gates Satisfied
  - 2.18 Evidence-State Discipline (7 States)
  - 2.19 Current Honest State — Full §74 Declaration
  - 2.20 Conflict Resolution Discipline
  - 2.21 Authority Matrix Summary

- **Section 3 — What MITHQAL Is**
  - 3.0 Section Purpose
  - 3.1 Canonical Definition
  - 3.2 The Ten Things MITHQAL Does
  - 3.3 The Three-Actor Rule (Bank Requests. MITHQAL Authorizes. Technical System Executes.)
  - 3.4 Full Settlement Flow Diagram (16-Step Bank Minting Workflow)
  - 3.5 Architectural Node Inventory
  - 3.6 Canonical Flow (Cross-Border)
  - 3.7 Worked Example: AED → SGD Corridor
  - 3.8 Five-Way Reconciliation Model
  - 3.9 Settlement Finality Model (7-Layer Enforcement)
  - 3.10 Three-Book Economic Separation

- **Section 4 — What MITHQAL Is Not**
  - 4.0 Section Purpose
  - 4.1 Prohibited Description Discipline
  - 4.2 MITHQAL Is Not a Cryptocurrency
  - 4.3 MITHQAL Is Not a Retail Application
  - 4.4 MITHQAL Is Not a Bank
  - 4.5 MITHQAL Is Not a Stablecoin
  - 4.6 MITHQAL Is Not USD-Pegged
  - 4.7 MITHQAL Is Not a Sovereign Currency
  - 4.8 MITHQAL Is Not a CBDC
  - 4.9 MITHQAL Is Not a Central Bank
  - 4.10 MITHQAL Is Not an Exchange
  - 4.11 MITHQAL Is Not a Brokerage
  - 4.12 MITHQAL Is Not a Market Maker
  - 4.13 MITHQAL Is Not a Lender
  - 4.14 MITHQAL Is Not an Investment Manager
  - 4.15 MITHQAL Is Not a Wealth Manager
  - 4.16 MITHQAL Is Not a Trade-Finance Institution
  - 4.17 MITHQAL Is Not a DeFi Protocol
  - 4.18 MITHQAL Is Not a Speculative Vehicle
  - 4.19 MITHQAL Is Not a Custodian (by Default)
  - 4.20 MITHQAL Is Not a SWIFT Replacement
  - 4.21 MITHQAL Is Not a Bank-Core Replacement
  - 4.22 MITHQAL Is Not a Sovereign Reserve Asset Holder
  - 4.23 MITHQAL Is Not a Financial Guarantor
  - 4.24 MITHQAL Is Not a Government Authority
  - 4.25 MITHQAL Is Not Sanctions-Evasion Infrastructure
  - 4.26 MITHQAL Is Not an Anonymity Network
  - 4.27 MITHQAL Is Not a Token-Issuance-for-Profit Scheme
  - 4.28 Prohibited Descriptions Reference Table
  - 4.29 Permitted-vs-Prohibited Language Matrix
  - 4.30 Marketing Discipline & Boundary Enforcement

---

# SECTION 0 — EXECUTIVE SUMMARY

## 0.0 Preamble

This document is the Single Source of Truth for the MITHQAL architecture. It is a
controlled institutional blueprint that defines, with full mathematical and operational
specificity, the neutral wholesale settlement infrastructure operated by the MITHQAL
Operating Company under the supervision of the MITHQAL Foundation. The architecture
described herein is the intended production architecture; nothing in this document is
a placeholder, an aspiration, or an unimplemented design fiction. Where a capability
is designed but not yet institutionally validated, this is stated explicitly in the
Honest State Declaration (§0.11) and in the Implementation Status Summary (§0.12).
Where a value is a policy target rather than a realized operating value, this is
stated explicitly.

MITHQAL exists for one reason: to provide regulated monetary systems with a neutral,
reserve-disciplined, cryptographically auditable settlement layer that sits *between*
monetary systems — never *instead of* monetary systems. Every line of this
blueprint is in service of that single architectural commitment.

The architecture is **APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT
PRODUCTION-AUTHORIZED**. This status is not a marketing phrase; it is a constitutional
declaration. It binds every agent, contractor, employee, partner, institution, and
reviewer of this document. Until each of the 13 institutional validation gates
defined in §V25.2.AUDIT-CLOSURE.10 has been satisfied by independent institutional
evidence, no representation of MITHQAL may claim production authorization, banking
integration, regulatory clearance, custody readiness, or institutional validation.

## 0.1 MITHQAL at a Glance

| Property | Value |
|----------|-------|
| **Identity** | Neutral wholesale institutional settlement infrastructure connecting regulated monetary systems across jurisdictions |
| **Settlement Instrument** | MTQ — a permissioned wholesale settlement instrument, not a cryptocurrency, not a stablecoin, not a sovereign currency |
| **Reserve Architecture** | 130% institutional backing target, composed of 80% fiat / 18% gold-centered bullion / 2% digital liquidity, with a separate non-double-counted 15% emergency resilience capacity |
| **Reserve Ratio Target (RR)** | 130% (institutional backing / coverage policy candidate) |
| **Policy Floor (RR)** | 105% (policy defensive level) |
| **Absolute Solvency Floor (RR)** | 100% (constitutional; never breachable in production) |
| **Reserve Composition Corridor** | 70% ≤ Fiat ≤ 85% · 15% ≤ Bullion ≤ 25% · 0% ≤ Digital ≤ 5% |
| **Per-Currency Hard Effective Cap** | 20% (preferred effective 15%; constitutional sanity ceiling 60% retained only as deeper non-overriding cap) |
| **USD Effective Exposure Ceiling** | 35% |
| **Per-Currency Minimum Floor** | 0.5% (preferred effective for designated currencies) |
| **Core Reserve Currencies (11)** | USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD |
| **Settlement Currencies (10)** | EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB (and other qualified currencies) |
| **Gold Target** | 18% (preferred lower 15%; operational upper zone 21–22%; bullion corridor 15–25%) |
| **Silver** | Conditional, currently 0% (conditional maximum 3%) |
| **Digital Liquidity (Normal)** | 2% (operational 3%; max 5%; emergency 0%) |
| **Digital Liquidity DRQS Core Threshold** | 7.5 (DRQS conditional 6.0; algorithmic stablecoins excluded) |
| **Core Digital Liquidity Candidates** | USDC, USDP, EURC, BUIDL (currently 0% weight — optimizer outputs) |
| **Excluded from Core Digital Backing** | USDT (external interoperability/conversion asset only); DAI (currently 0% weight) |
| **Algorithmic Stablecoins** | Excluded from core digital reserve |
| **Finality-Before-Mint Enforcement** | 7 layers enforced at code level; 10 of 10 bypass routes blocked; risk MITIGATED_AT_CODE_LEVEL |
| **Bank Minting Workflow** | 16 steps (BM-01 corporate request → BM-16 finality verification + deterministic mint) |
| **Pilot Model** | ONE REGULATED INSTITUTION · ONE JURISDICTION · ONE CORRIDOR |
| **Pilot Scope Boundary** | Broader treasury holding is outside the initial pilot scope |
| **Organizational Structure** | 5 entities: Founder Shareholders → MITHQAL Holding → [Operating Co · Technology Co] · Foundation (independent nonprofit) |
| **Current Operating Entity** | JOZOUR LLC (New Jersey) — until the planned MITHQAL Holding structure is legally formed |
| **Acceptance Criteria Met** | 19 of 23 (83%) — honestly reported, no inflation |
| **Institutional Validation Gates Passed** | 0 of 13 (all pending) |
| **Production Authorized** | FALSE |
| **Final Status** | APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED |
| **Final Status Color** | AMBER |
| **Honest State** | `honest = true` |
| **Reserve Policy Status** | CANDIDATE_MODEL_VALIDATION_PENDING |
| **Reserve Configuration Canonical** | TRUE (no unresolved conflicts) |
| **Contact** | meltonsy@icloud.com |
| **Document Disclaimer** | CONTROLLED INSTITUTIONAL DOCUMENT · NOT A LICENSE · NOT A LEGAL OPINION |

## 0.2 Principal Architectural Statement

> **MITHQAL is a neutral wholesale settlement infrastructure connecting regulated
> monetary systems. MTQ is a permissioned wholesale settlement instrument used by
> authorized regulated financial institutions and, where explicitly permitted, central
> banks or sovereign monetary authorities. MTQ does not replace, compete with, or
> become a substitute for sovereign currencies or central-bank money. MITHQAL
> provides the neutral settlement layer between participating monetary systems,
> combining digital settlement speed with institutional traceability, compliance
> and cryptographic auditability. Customer-level KYC/KYB is primarily performed by
> regulated participating institutions, while MITHQAL governs institutional
> authorization, settlement integrity, jurisdictional controls and immutable
> settlement records. No MTQ may be issued without constitutionally verified reserve
> backing, and no participant or governance body may exercise discretionary monetary
> issuance authority.**

This statement is binding on all MITHQAL communications, all partner representations,
all institutional engagements, and all internal documentation. Any deviation from
this statement in any external or internal communication constitutes a
constitutional breach requiring immediate correction.

## 0.3 The Single Most Important Architectural Principle

> **MTQ sits between monetary systems, not instead of monetary systems.**

This principle is the architectural north star of MITHQAL. It means, in operational
terms:

1. USD remains USD. MITHQAL does not absorb, replace, or subordinate the U.S. Dollar.
2. EUR remains EUR. MITHQAL does not absorb, replace, or subordinate the Euro.
3. JPY remains JPY. MITHQAL does not absorb, replace, or subordinate the Japanese Yen.
4. AED remains AED. MITHQAL does not absorb, replace, or subordinate the UAE Dirham.
5. CNY remains CNY. MITHQAL does not absorb, replace, or subordinate the Chinese Yuan.
6. CBDCs remain liabilities of their issuing central banks. MITHQAL does not become another CBDC.
7. Sovereign money remains sovereign money. MITHQAL provides only the settlement bridge.
8. MITHQAL does not set monetary policy. MITHQAL does not set sovereign interest rates.
9. MITHQAL does not displace any sovereign currency in any jurisdiction.
10. MITHQAL does not become the international settlement currency. MTQ is a settlement instrument, not a reserve currency.

## 0.4 The Locked Commercial Flow

> **Customers continue to use banks; banks use MITHQAL; MITHQAL uses MTQ to settle
> value between monetary systems.**

This is the canonical commercial flow of MITHQAL. It cannot be inverted, shortcut, or
bypassed:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Customer    │ ──> │     Bank      │ ──> │    MITHQAL    │ ──> │  Receiving    │
│  (Corporate)  │     │ (Regulated)   │     │  Core Engine  │     │     Bank      │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
                              │                     │                     │
                              ▼                     ▼                     ▼
                       Requests issuance      Authorizes mint          Redeems MTQ
                       via MBG gateway        (deterministic)          for sovereign
                                              per finality rules       currency
```

Customers do not mint MTQ. Customers do not hold MTQ directly. Customers do not
interact with the MITHQAL Core Engine. Banks mediate the customer relationship and
request MTQ issuance on behalf of their corporate clients; MITHQAL authorizes the
issuance deterministically; the technical system executes the mint atomically with
finality proof. Receiving banks redeem MTQ for sovereign settlement assets through
the same controlled pipeline.

## 0.5 Canonical Identity

### 0.5.1 MITHQAL

**MITHQAL IS:** a neutral wholesale institutional settlement infrastructure connecting
regulated monetary systems across jurisdictions.

**MITHQAL IS:** constitutional, reserve-disciplined, cryptographically auditable,
institutionally attributable, jurisdictionally aware, settlement-final, anti-speculative,
non-custodial (by default), neutral across monetary systems, neutral across
jurisdictions, neutral across geopolitical blocs, and strictly separation-of-duty
enforcing.

**MITHQAL IS NOT:** a central bank, a commercial bank, a sovereign currency issuer,
a retail payment platform, an exchange, a brokerage, a market maker, a lending
institution, a trade-finance institution, an investment fund, a wealth manager,
a DeFi protocol, a speculative vehicle, a custodian (by default), a SWIFT replacement,
a bank-core replacement, or a financial guarantor.

### 0.5.2 MTQ

**MTQ IS:** a permissioned wholesale settlement instrument used by approved
regulated financial institutions and, where explicitly authorized, central banks
or equivalent sovereign monetary authorities to transfer settlement value between
participating monetary systems.

**MTQ IS:** neutral, wholesale, settlement-focused, reserve-disciplined, auditable,
cryptographically secured, institutionally traceable, interoperable, PAR-referenced,
gold-anchored, jurisdiction-aware, and finality-gated.

**MTQ IS NOT:** a retail stablecoin, a consumer payment coin, a replacement for
USD/JPY/EUR/AED or any sovereign currency, a CBDC, a sovereign liability, an
investment product, an exchange-traded speculative instrument, a USD-pegged token,
an algorithmic stablecoin, or a yield-bearing instrument.

## 0.6 Key Parameters Table — Controlling v25.2 Values

The table below is the controlling parameter set for the entire MITHQAL architecture.
Where any internal or external document states a value different from this table,
the value in this table controls. Historical configurations are traceable but have
no active runtime authority.

### 0.6.1 Reserve & Solvency Parameters

| # | Parameter | Symbol | Value | Notes |
|---|-----------|--------|-------|-------|
| 1 | PAR | PAR | 1.00 | Constitutional unit; never repegged; never floated |
| 2 | Reserve Ratio Target | RR | 130% | Institutional backing/coverage policy candidate |
| 3 | RR Policy Floor | RR_floor | 105% | Defensive level — policy alert |
| 4 | RR Absolute Floor | RR_abs | 100% | Constitutional solvency floor — never breachable in production |
| 5 | RR Current (design-time reference) | RR_ref | 122.29% | Design-time demonstration value from canonical example reserve |
| 6 | FSCR Normal Threshold | FSCR_n | 110% | Normal stress coverage level |
| 7 | FSCR Defensive Threshold | FSCR_d | 105% | Defensive stress coverage level |
| 8 | FSCR Emergency Threshold | FSCR_e | 100% | Emergency stress coverage level |
| 9 | FSCR Current (design-time reference) | FSCR_ref | 113.67% | Design-time demonstration value |
| 10 | LCR Target | LCR_t | 100% | Liquidity Coverage Ratio target |
| 11 | LCR Current (design-time reference) | LCR_ref | 130% | Adequate |
| 12 | Market NAV | NAV_m | 1.30 | R_m / L (design-time demonstration) |
| 13 | Adjusted NAV | NAV_a | 1.2229 | R_a / L (design-time demonstration) |
| 14 | Stress NAV | NAV_s | 1.1367 | R_l / L (design-time demonstration) |
| 15 | Emergency Resilience Capacity | E | 15% | Separate, never double-counted |
| 16 | Reserve Policy Status | — | CANDIDATE_MODEL_VALIDATION_PENDING | Pending quantitative validation |
| 17 | Reserve Configuration Canonical | — | TRUE | No unresolved configuration conflicts |
| 18 | Non-Custodial by Default | — | TRUE | MITHQAL-held assets = 0 by default |
| 19 | No MITHQAL-Owned Reserve | — | TRUE | MITHQAL does not own reserve assets |
| 20 | No MITHQAL Financial Guarantee | — | TRUE | MITHQAL is NOT a financial guarantor |

### 0.6.2 Reserve Composition Parameters

| # | Parameter | Symbol | Value | Notes |
|---|-----------|--------|-------|-------|
| 1 | Fiat Sleeve (Normal) | B_t | 80% | Policy center |
| 2 | Gold/Bullion Sleeve (Normal) | G_t | 18% | Policy center |
| 3 | Digital Sleeve (Normal) | D_t | 2% | Policy center |
| 4 | Fiat Corridor | B_min / B_max | 70% / 85% | Operating range |
| 5 | Bullion Corridor | Bull_min / Bull_max | 15% / 25% | Operating range |
| 6 | Digital Corridor | D_min / D_max | 0% / 5% | Operating range |
| 7 | Gold Target | G_target | 18% | Within bullion corridor |
| 8 | Gold Preferred Lower | G_low | 15% | Preferred floor |
| 9 | Gold Operational Upper Zone | G_op | 21–22% | Operational upper bound (not breach alarm) |
| 10 | Silver Current | S_t | 0% | Conditional, currently zero |
| 11 | Silver Conditional Maximum | S_max | 3% | Conditional cap |
| 12 | Digital Normal | D_n | 2% | Policy center |
| 13 | Digital Operational | D_op | 3% | Operational tolerance |
| 14 | Digital Max | D_max | 5% | Hard cap |
| 15 | Digital Emergency | D_em | 0% | Emergency state target |
| 16 | DRQS Core Threshold | DRQS_c | 7.5 | Core digital liquidity eligibility |
| 17 | DRQS Conditional Threshold | DRQS_cond | 6.0 | Conditional digital liquidity eligibility |
| 18 | Algorithmic Stablecoins | — | EXCLUDED | Not permitted in core digital reserve |

### 0.6.3 Concentration Parameters

| # | Parameter | Value | Notes |
|---|-----------|-------|-------|
| 1 | Per-Currency Preferred Effective | 15% | Preferred limit |
| 2 | Per-Currency Hard Effective | 20% | Operative hard cap |
| 3 | Per-Currency Constitutional Sanity Ceiling | 60% | Deeper non-overriding sanity cap |
| 4 | USD Effective Ceiling | 35% | Hard USD exposure ceiling |
| 5 | Per-Currency Minimum Floor | 0.5% | Preferred effective for designated currencies |
| 6 | Per-Bank Preferred Effective | 15% | Bank exposure preferred limit |
| 7 | Per-Bank Hard Effective | 20% | Bank exposure hard cap |
| 8 | Per-Custodian Preferred Effective | 15% | Custodian exposure preferred limit |
| 9 | Per-Custodian Hard Effective | 20% | Custodian exposure hard cap |
| 10 | Per-Country Preferred Effective | 20% | Country exposure preferred limit |
| 11 | Per-Country Hard Effective | 25% | Country exposure hard cap |
| 12 | Systemic Concentration Dimensions | 13 | Bank, banking group, country, currency, custodian, correspondent, settlement rail, liquidity provider, stablecoin issuer, technology provider, geopolitical correlation, operational correlation, bank exposure |

### 0.6.4 Currency Universe Parameters

| # | Parameter | Value | Notes |
|---|-----------|-------|-------|
| 1 | Core Reserve Currencies (count) | 11 | USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD |
| 2 | Settlement Currencies (count) | 10 | EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB (+ other qualified) |
| 3 | Total Distinct Currencies (current) | 21 | Core reserve + settlement |
| 4 | USD Direct Weight | 20.00% | Capped at hard effective ceiling |
| 5 | EUR Weight | 20.00% | Capped at hard effective ceiling |
| 6 | JPY Weight | 15.48% | Optimizer-derived |
| 7 | GBP Weight | 14.13% | Optimizer-derived |
| 8 | CHF Weight | 5.49% | Optimizer-derived |
| 9 | CAD Weight | 5.37% | Optimizer-derived |
| 10 | AUD Weight | 4.43% | Optimizer-derived |
| 11 | SGD Weight | 4.38% | Optimizer-derived |
| 12 | AED Weight | 1.93% | Optimizer-derived |
| 13 | SAR Weight | 1.61% | Optimizer-derived |
| 14 | CNY Weight | 7.17% | Optimizer-derived (non-reserve offshore RMB proxies) |
| 15 | USD Effective Exposure | 23.54% | Direct USD (20%) + AED-USD-linked (1.93%) + SAR-USD-linked (1.61%) |
| 16 | USD Effective Ceiling | 35% | Not breached |

### 0.6.5 Finality & Enforcement Parameters

| # | Parameter | Value | Notes |
|---|-----------|-------|-------|
| 1 | Finality Invariant | NO FINAL SETTLEMENT ⇒ NO MTQ MINT | Constitutional hard invariant |
| 2 | Finality Layers Designed | 7 | Required enforcement depth |
| 3 | Finality Layers Required | 7 | Constitutional minimum |
| 4 | Finality Layers Enforced | 7 | All 7 at code level |
| 5 | Finality Bypass Routes Total | 10 | Tested adversarial routes |
| 6 | Finality Bypass Routes Blocked | 10 | All blocked |
| 7 | Finality Bypass Routes Bypassed | 0 | Invariant holds |
| 8 | Finality Bypass Risk | MITIGATED_AT_CODE_LEVEL | Was HIGH; remains HIGH at production gate until institutional validation |
| 9 | Finality Production Ready | FALSE | Pending institutional validation |
| 10 | Ledger State Machine | PENDING → AUTHORIZED → FINALIZED → MINTED | Append-only; skips rejected |

### 0.6.6 Workflow Parameters

| # | Parameter | Value | Notes |
|---|-----------|-------|-------|
| 1 | Bank Minting Workflow Steps | 16 | BM-01 through BM-16 |
| 2 | Bank Minting Phases | 3 | BANK (BM-01..06), MBG (BM-07..08), MITHQAL (BM-09..16) |
| 3 | Institutional Issuance Pipeline Steps | 15 | Detailed in §3 |
| 4 | Three-Way Reconciliation Sources | 3 | MITHQAL ledger · Bank subledger · Signed bank attestation |
| 5 | Five-Way Reconciliation Sources | 5 | Bank subledger · Reserve backing evidence · Custodian evidence · Canonical ledger · Proof of liabilities |
| 6 | Reconciliation States | 7 | VERIFIED / WARNING / MISMATCH / CRITICAL / EXPIRED / UNAVAILABLE / LOCKED |
| 7 | Settlement Record Schema Fields | 14 | Per §V25.0.9 |
| 8 | Six-Hop Trace Path | 6 | Customer → Bank → MITHQAL → MTQ → Receiving Bank → Beneficiary |

### 0.6.7 Organizational Parameters

| # | Parameter | Value | Notes |
|---|-----------|-------|-------|
| 1 | Final Corporate Structure Entities | 5 | Founder Shareholders · Holding · Operating · Technology · Foundation |
| 2 | For-Profit Entities | 4 | Founder Shareholders · Holding · Operating · Technology |
| 3 | Non-Profit Entities | 1 | Foundation (independent nonprofit) |
| 4 | Foundation Oversight | READ-ONLY | 7 dashboard fields, no mint, no override |
| 5 | Operating Co Responsibilities | 15 + Monetary & Reserve Control Division | Operationally separated from commercial |
| 6 | Technology Co Services | 13 | Detailed in §V25.0.D.AJ |
| 7 | Foundation Responsibilities | 11 SHALL · 8 SHALL NOT | Read-only aggregate oversight |
| 8 | Mint Authority Separation | ISSUANCE_REQUEST → ISSUANCE_AUTHORIZATION → MINT_EXECUTION | No single actor controls both request and authorization |
| 9 | Authority Matrix | 7 × 17 | 7 actors × 17 functions — no ambiguous ownership |
| 10 | Current Operating Entity | JOZOUR LLC (New Jersey) | Until planned MITHQAL Holding is legally formed |

### 0.6.8 Validation & Status Parameters

| # | Parameter | Value | Notes |
|---|-----------|-------|-------|
| 1 | Acceptance Criteria Total | 23 | Defined in §V25.2.AUDIT-CLOSURE.9 |
| 2 | Acceptance Criteria Met | 19 | 83% — honestly reported |
| 3 | Institutional Validation Gates Total | 13 | Defined in §91 / §V25.2.AUDIT-CLOSURE |
| 4 | Institutional Validation Gates Passed | 0 | All pending |
| 5 | Licenses Obtained | 0 | Of 72 licensing matrix entries (9 activities × 8 jurisdictions) |
| 6 | Validated Jurisdictions | 0 | Of 8 seeded jurisdictions (US, EU/EEA, UK, CH, SG, AE, SA, JP) |
| 7 | Legal Opinions Obtained | FALSE | None obtained |
| 8 | Bank Contracts Signed | FALSE | None signed |
| 9 | Custodian Contracts Signed | FALSE | None signed |
| 10 | Asset Contracts Signed | FALSE | None signed |
| 11 | Live Oracle Feeds | FALSE | Design-time reference values only |
| 12 | Protected Backing Live Cells | 0 | 4 SIMULATED reference cells only |
| 13 | Three-Book Design | TRUE | Implemented at code level |
| 14 | Three-Book Operational | FALSE | Not yet operational |
| 15 | Three-Book Enforced | FALSE | Not yet enforced in production |
| 16 | Systemic Risk Monitoring Live | FALSE | Engine implemented; not live |
| 17 | Systemic Risk Production Validated | FALSE | Pending validation |
| 18 | Production Authorized | FALSE | Not authorized |
| 19 | Honest State | TRUE | All disclosures honest |
| 20 | Contradiction Scan Unresolved | 0 | 17 patterns scanned, 0 unresolved |

## 0.7 Reserve Composition Summary

The MITHQAL reserve architecture is a single, unified reserve composed of three
sleeves (fiat, bullion, digital) plus a separate emergency resilience capacity.
The composition is governed by the constitutionally fixed 80/18/2 policy center,
operating within the constitutional corridors (70/85, 15/25, 0/5).

### 0.7.1 Policy Center & Corridors

```
                    ┌─────────────────────────────────────────────┐
                    │        MITHQAL UNIFIED RESERVE (100%)        │
                    ├─────────────────────────────────────────────┤
                    │                                             │
                    │  ┌─────────────────────────────────────┐    │
                    │  │   FIAT SLEEVE (B_t = 80%)           │    │
                    │  │   Corridor: 70% ≤ B_t ≤ 85%         │    │
                    │  │   11 Core Currencies:               │    │
                    │  │   USD · EUR · CHF · JPY · GBP ·     │    │
                    │  │   SGD · AED · SAR · CNY · CAD · AUD │    │
                    │  └─────────────────────────────────────┘    │
                    │                                             │
                    │  ┌─────────────────────────────────────┐    │
                    │  │   BULLION SLEEVE (G_t = 18%)        │    │
                    │  │   Corridor: 15% ≤ Bull_t ≤ 25%     │    │
                    │  │   Gold primary: target 18%          │    │
                    │  │   Gold preferred lower: 15%          │    │
                    │  │   Gold operational upper: 21–22%    │    │
                    │  │   Silver conditional: max 3%         │    │
                    │  │   Silver current: 0%                 │    │
                    │  └─────────────────────────────────────┘    │
                    │                                             │
                    │  ┌─────────────────────────────────────┐    │
                    │  │   DIGITAL SLEEVE (D_t = 2%)          │    │
                    │  │   Corridor: 0% ≤ D_t ≤ 5%            │    │
                    │  │   DRQS Core Threshold: 7.5           │    │
                    │  │   Algorithmic: EXCLUDED             │    │
                    │  │   Candidates (current weight 0%):   │    │
                    │  │   USDC · USDP · EURC · BUIDL        │    │
                    │  │   External conversion only: USDT    │    │
                    │  └─────────────────────────────────────┘    │
                    │                                             │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │  EMERGENCY RESILIENCE CAPACITY (E = 15%)    │
                    │  SEPARATE · NON-DOUBLE-COUNTED              │
                    │  Never included in RR computation           │
                    │  Invoked only under explicit emergency      │
                    │  governance authorization                  │
                    └─────────────────────────────────────────────┘
```

### 0.7.2 Three-Layer Reserve Valuation

| Layer | Symbol | Formula | Purpose |
|-------|--------|---------|---------|
| Market Reserve | R_m | Σ_a Q_a · P_a | Mark-to-market valuation |
| Adjusted Reserve | R_a | Σ_a Q_a · P_a · (1 − H_a) · C_a | Haircut + structural adjustment |
| Stress Reserve | R_l | Σ_a Q_a · P_a · (1 − H_a) · C_a · S_a | Stress scenario valuation |

Where:
- Q_a = quantity of asset a
- P_a = market price of asset a
- H_a = haircut applied to asset a
- C_a = structural weight coefficient
- S_a = stress multiplier

The Reserve Ratio (RR) is computed as `RR = R_a / L` where L = S × PAR (liability).
The Full Stress Coverage Ratio (FSCR) is computed as `FSCR = R_l / L`.

## 0.8 Currency & Settlement Universe Summary

### 0.8.1 Core Reserve Currencies (11)

These are the 11 currencies eligible for inclusion in the fiat sleeve of the unified
reserve. Their weights are not hard-coded; they are computed by the Currency Weight
Engine through the six-step normalization process (structural importance, momentum,
mean reversion, volatility attenuation, liquidity overlay, concentration).

| Rank | Currency | Current Weight | C (Structural) | K (Momentum) | L (Liquidity) | Capped? |
|------|----------|---------------:|----------------:|-------------:|---------------:|---------|
| 1 | USD | 20.00% | 0.5020 | 0.9999 | 1.010 | YES (at 20% hard cap) |
| 2 | EUR | 20.00% | 0.2470 | 0.9805 | 1.008 | YES (at 20% hard cap) |
| 3 | JPY | 15.48% | 0.0670 | 1.0148 | 1.006 | NO |
| 4 | GBP | 14.13% | 0.0616 | 1.0074 | 1.006 | NO |
| 5 | CHF | 5.49% | 0.0243 | 0.9909 | 1.007 | NO |
| 6 | CAD | 5.37% | 0.0233 | 1.0138 | 1.004 | NO |
| 7 | AUD | 4.43% | 0.0192 | 1.0155 | 1.004 | NO |
| 8 | SGD | 4.38% | 0.0193 | 0.9999 | 1.003 | NO |
| 9 | AED | 1.93% | 0.0085 | 0.9999 | 1.002 | NO |
| 10 | SAR | 1.61% | 0.0071 | 0.9999 | 1.002 | NO |
| 11 | CNY | 7.17% | 0.0328 | 0.9653 | 1.001 | NO |

USD Effective Exposure = Direct USD (20%) + AED-USD-linked (1.93%) + SAR-USD-linked
(1.61%) = 23.54%, below the 35% USD Effective Ceiling.

### 0.8.2 Settlement / Conversion Currencies (10)

These currencies are eligible as settlement/conversion currencies but are NOT core
reserve currencies. They may be used at the edges of the MITHQAL settlement
network (e.g., corporate pays in EGP, MTQ settles the value, beneficiary receives
in INR) but they do not back MTQ issuance as reserve assets.

| Currency | Country | Use |
|----------|---------|-----|
| EGP | Egypt | Settlement / conversion |
| INR | India | Settlement / conversion |
| KRW | South Korea | Settlement / conversion |
| TRY | Türkiye | Settlement / conversion |
| BRL | Brazil | Settlement / conversion |
| MXN | Mexico | Settlement / conversion |
| ZAR | South Africa | Settlement / conversion |
| IDR | Indonesia | Settlement / conversion |
| MYR | Malaysia | Settlement / conversion |
| THB | Thailand | Settlement / conversion |

Additional qualified settlement currencies may be admitted through the Currency
Lifecycle process (admission, monitoring, suspension, removal, re-admission)
detailed in §V25.2.9.

### 0.8.3 Digital Liquidity Universe

| Asset | DRQS | Role | Algorithmic | In Core | Target Weight |
|-------|-----:|------|:-----------:|:-------:|--------------:|
| USDC | 8.50 | Primary digital liquidity | NO | YES | 0% (optimizer output) |
| USDP | 8.45 | Secondary regulated USD liquidity | NO | YES | 0% (optimizer output) |
| EURC | 7.80 | EUR diversification | NO | YES | 0% (optimizer output) |
| BUIDL | 8.55 | Tokenized U.S. T-bill liquidity | NO | YES | 0% (optimizer output) |
| DAI | 6.25 | Optional / conditional, currently 0% | NO | NO | 0% |
| USDT | 6.15 | Excluded from core digital reserve; external conversion only | NO | NO | 0% |

Algorithmic stablecoins are EXCLUDED from the core digital reserve. The Digital
Reserve Quality Score (DRQS) Core threshold is 7.5; the Conditional threshold is 6.0.

## 0.9 Finality-Before-Mint Summary

The constitutional invariant `NO FINAL SETTLEMENT ⇒ NO MTQ MINT` is enforced by
seven independent layers. No single layer can authorize a mint; all seven must
pass for a mint to occur. The system has been adversarially tested against ten
distinct bypass routes; all ten are blocked, and the invariant holds.

### 0.9.1 Seven-Layer Enforcement Stack

| Layer | Name | Enforcement Mechanism | Code Status |
|------:|------|----------------------|-------------|
| L1 | API | Reject any mint request lacking valid auth signature, idempotency key, fresh timestamp, and proof-of-finality token | ENFORCED |
| L2 | Workflow Engine | 16-step Bank Minting Workflow BM-01..BM-16; cannot advance to BM-16 (mint) without BM-15 (finality verification) passing | ENFORCED |
| L3 | Policy Engine | Constitutional rules + DMCE constraints + concentration + eligibility + jurisdiction; hard-fail on any breach | ENFORCED |
| L4 | MITHQAL Monetary Authorization | MITHQAL Monetary & Reserve Control Division authorization (separated from commercial/sales); commercial cannot override | ENFORCED |
| L5 | Ledger State Machine | MTQ ledger mint-state transition guard: PENDING → AUTHORIZED → FINALIZED → MINTED; skips rejected; append-only | ENFORCED |
| L6 | Database TX-State Protection | ACID transactional constraint; mint + finality-proof written atomically; partial writes roll back | ENFORCED |
| L7 | Smart Contract / Authoritative Settlement Control | On-chain finality gate (where applicable); MTQ mint contract requires finality oracle attestation; TESTNET-deployed | ENFORCED |

### 0.9.2 Adversarial Bypass Test Harness

| # | Route | Expected Blocked By | Blocked? |
|---|-------|---------------------|----------|
| 1 | DIRECT_API_CALL_WITHOUT_AUTH | L1_API | YES |
| 2 | WORKFLOW_SKIP_BM15 | L2_WORKFLOW | YES |
| 3 | POLICY_OVERRIDE_BY_COMMERCIAL | L3_POLICY | YES |
| 4 | UNSIGNED_AUTHORIZATION | L4_AUTHORIZATION | YES |
| 5 | LEDGER_SKIP_FINALIZED_STATE | L5_LEDGER_STATE_MACHINE | YES |
| 6 | DATABASE_PARTIAL_WRITE | L6_DATABASE_TX_STATE | YES |
| 7 | SMART_CONTRACT_WITHOUT_ORACLE | L7_SMART_CONTRACT | YES |
| 8 | EMERGENCY_OVERRIDE_WITHOUT_GOVERNANCE | L4_AUTHORIZATION | YES |
| 9 | ADMIN_BACKDOOR | L5_LEDGER_STATE_MACHINE | YES (no admin backdoor exists) |
| 10 | INTERNAL_API_ROUTE | L1_API | YES (all routes pass through same enforcement) |

Total: 10/10 routes blocked, 0 bypassed, invariant holds. Finality Bypass Risk:
**MITIGATED_AT_CODE_LEVEL**. Finality Production Ready: FALSE (pending
institutional validation).

## 0.10 Organizational Structure (5 Entities)

MITHQAL operates under a five-entity corporate structure. Four entities are
for-profit and one is an independent nonprofit. The structure enforces strict
separation of duties, with the Foundation providing only read-only aggregate
oversight and the Operating Company's Monetary & Reserve Control Division
operationally separated from commercial bank relationship management.

```
                    ┌─────────────────────────────────┐
                    │       FOUNDER SHAREHOLDERS       │
                    │       (for-profit, top)          │
                    └────────────────┬─────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │       MITHQAL HOLDING            │
                    │       (for-profit parent)        │
                    │       Owns 100% of subsidiaries  │
                    └─────┬─────────────────────┬───────┘
                          │                     │
                          ▼                     ▼
       ┌──────────────────────────────┐  ┌──────────────────────────────┐
       │   MITHQAL OPERATING CO.      │  │   MITHQAL TECHNOLOGY CO.     │
       │   (for-profit operator)      │  │   (for-profit technology)     │
       │                              │  │                              │
       │   • Bank Gateway operations  │  │   • MITHQAL Core engine      │
       │   • Bank relationships       │  │   • MBG software stack        │
       │   • Institutional onboarding │  │   • APIs / SDKs / adapters   │
       │   • Reconciliation workflow  │  │   • ZK / privacy tech         │
       │   • Regulatory compliance    │  │   • Security / key mgmt       │
       │   • Audit / evidence         │  │   • Settlement software       │
       │   • Monetary & Reserve       │  │   • Reconciliation software  │
       │     Control Division         │  │   • IP / patents              │
       │     (operationally separated)│  │                              │
       └──────────────────────────────┘  └──────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │       MITHQAL FOUNDATION         │
                    │       (independent nonprofit)    │
                    │                                  │
                    │   • READ-ONLY aggregate oversight│
                    │   • 7 dashboard fields           │
                    │   • 11 SHALL / 8 SHALL NOT       │
                    │   • CANNOT mint, authorize,     │
                    │     buy, sell, transfer,         │
                    │     or override                  │
                    └─────────────────────────────────┘
```

### 0.10.1 Founder Shareholders

| Property | Value |
|----------|-------|
| **Type** | For-Profit |
| **Parent** | None |
| **Children** | MITHQAL Holding |
| **Legal Status** | PROPOSED (until MITHQAL Holding is legally formed) |
| **Responsibilities** | Provide initial capitalization to MITHQAL Holding; receive dividends/distributions per shareholder agreement; benefit from corporate enterprise value appreciation (subject to legal structure); maintain shareholder governance rights per corporate charter |
| **Cannot Do** | Receive reserve appreciation as commercial profit; receive customer deposits; receive reserve assets; receive Foundation assets; receive unauthorized MTQ; receive proprietary reserve trading gains; direct operational decisions of subsidiaries; override canonical MTQ monetary rules; authorize individual MTQ issuance requests |

### 0.10.2 MITHQAL Holding (for-profit parent)

| Property | Value |
|----------|-------|
| **Type** | For-Profit |
| **Parent** | Founder Shareholders |
| **Children** | MITHQAL Operating Co., MITHQAL Technology Co. |
| **Legal Status** | PROPOSED |
| **Responsibilities** | Own 100% of Operating and Technology subsidiary equity; hold corporate enterprise value; receive dividends from subsidiaries; corporate governance oversight; strategic capital allocation; corporate compliance; phased capital deployment (PILOT $4.7M / SCALE $12.6M / SCALE+ $17.6M) |
| **Cannot Do** | Mint MTQ; authorize individual MTQ issuance requests; hold customer deposits; hold reserve assets directly; operate Foundation activities; override canonical MTQ monetary invariants; silently convert operating capital into reserve backing |

### 0.10.3 MITHQAL Operating Company (for-profit operator)

| Property | Value |
|----------|-------|
| **Type** | For-Profit |
| **Parent** | MITHQAL Holding |
| **Children** | None |
| **Legal Status** | PROPOSED |
| **Responsibilities** | Operate MBG institutional side; bank relationship management (commercial); institutional onboarding; reconciliation workflow operations; customer/institutional support; regulatory compliance operations; audit/evidence preservation; **Monetary & Reserve Control Division (operationally separated)**; earn transparent infrastructure fees (8 categories); coordinate with Foundation on constitutional oversight; maintain corporate operating capital (separate from reserves); coordinate bank integration/onboarding/certification |
| **Cannot Do** | Mint MTQ at its own discretion; approve reserve sufficiency for its own bank clients (separation of duties); profit from gold appreciation/speculative trading/reserve spread/proprietary price movements; receive customer deposits as custodian; hold reserve assets in MITHQAL-operated vault by default; silently convert operating capital into reserve backing; override canonical MTQ monetary invariants; authorize MTQ issuance without AvailableBackingCertificate + custodian evidence |

### 0.10.4 MITHQAL Technology Company (for-profit technology provider)

| Property | Value |
|----------|-------|
| **Type** | For-Profit |
| **Parent** | MITHQAL Holding |
| **Children** | None |
| **Legal Status** | PROPOSED |
| **Responsibilities** | Own and operate MITHQAL Core (canonical settlement engine); own and operate MBG software stack; own and operate MSAS; own and operate APIs/SDKs/adapters; own and operate settlement/reconciliation software; own and operate ZK/privacy technology; own and operate security systems/cryptographic key management infrastructure; own and operate data persistence layer; own and operate monitoring/observability stack; own IP/patents; provide technology services to Operating Co under intercompany agreement; maintain SOC 2 / ISO 27001 / equivalent certifications |
| **Cannot Do** | Mint MTQ; authorize MTQ issuance; hold customer deposits; hold reserve assets; make discretionary monetary decisions; access bank subledger customer data without authorization; convert technology operating revenue into reserve backing |

### 0.10.5 MITHQAL Foundation (independent nonprofit)

| Property | Value |
|----------|-------|
| **Type** | Non-Profit (independent) |
| **Parent** | None (legally independent of Holding) |
| **Children** | None |
| **Legal Status** | PROPOSED |
| **Responsibilities** | Constitutional preservation; aggregate oversight of monetary invariants; oversight of MITHQAL's adherence to the constitution; review of audit reports; review of reconciliation evidence; coordination with regulators on constitutional matters; publication of constitutional disclosures; safeguarding of the canonical blueprint |
| **Foundation SHALL (11)** | Preserve the canonical blueprint; publish quarterly constitutional reports; verify PAR is not repegged; verify no discretionary minting; verify reserve segregation; verify gold anchor; verify no retail participation; verify jurisdictional geo-fencing; verify no sanctions circumvention; verify no speculative trading; verify evidence-state discipline |
| **Foundation SHALL NOT (8)** | Mint MTQ; authorize MTQ issuance; buy or sell reserve assets; transfer reserve assets; override canonical monetary rules; direct operational decisions of Operating/Technology Co; receive customer deposits; receive reserve assets |
| **Foundation Dashboard** | READ-ONLY, 7 fields: Total MTQ Outstanding · Total Verified Reserve · RR · FSCR · LCR · Concentration Heatmap · Evidence Status |

### 0.10.6 Mint Authority Separation

The mint authority is deliberately separated into three sequential stages, each
controlled by a different actor:

| Stage | Actor | Action |
|-------|-------|--------|
| ISSUANCE_REQUEST | Bank (Class B/C) | Submit institutional issuance request via MBG |
| ISSUANCE_AUTHORIZATION | MITHQAL Monetary & Reserve Control Division (Operating Co, separated from commercial) | Authorize issuance based on VerifiedEligibleBacking, LegallyReservedBacking, InstitutionalRiskLimit, LiquidityLimit, JurisdictionLimit, ExposureLimit, ConcentrationLimit, OperationalLimit |
| MINT_EXECUTION | Canonical ledger (Technology Co) | Execute deterministic mint atomically with finality proof |

No single actor controls both request and authorization. No commercial team member
can approve reserve sufficiency for their own bank clients.

## 0.11 Honest State Declaration (Aggregated)

The following is the full, honest, aggregated state of MITHQAL as of the
publication of this blueprint. Every field is binding. Every `false` is binding.
Every `0` is binding. No field may be inflated, rounded, or represented as
anything other than its true value.

```
honest                              = true
productionAuthorized                = false
noMithqalOwnedReserve               = true
noMithqalFinancialGuarantee         = true

threeBookDesign                     = true
threeBookOperational                = false
threeBookEnforced                   = false

systemicRiskEngineDesigned          = true
systemicRiskEngineImplemented      = true
systemicRiskMonitoringLive         = false
systemicRiskProductionValidated    = false

finalityPolicyDefined               = true
finalityLayersDesigned              = 7
finalityLayersRequired              = 7
finalityLayersEnforced              = 7
finalityProductionReady             = false
finalityBypassRisk                  = MITIGATED_AT_CODE_LEVEL

legalRegistryImplemented            = true
legalOpinionsObtained               = false
validatedJurisdictions              = 0

licensingMatrixImplemented          = true
licensesObtained                    = 0

bankDefaultStateModelDesigned       = true
bankDefaultOperationalWorkflow      = true
bankDefaultContractValidated        = false
bankDefaultLegalValidated           = false
bankDefaultProductionReady          = false

protectedBackingModelImplemented    = true
protectedBackingLiveCells           = 0

reserveConfigurationCanonical       = true
reserveConfigurationConflicts       = false
reservePolicyStatus                 = CANDIDATE_MODEL_VALIDATION_PENDING
```

**designTimeSpec** = true. **liveOracleFeeds** = false. **bankContracted** = false.
**providerContracted** = false. **assetContracted** = false.

All reserve inputs (COFER shares, FX prices, gold spot, DRQS scores) are
**policy reference values** for design-time demonstration, **not** live oracle
feeds. No real bank/provider/asset is contracted.

## 0.12 Implementation Status Summary

The implementation status is reported honestly and never inflated. The table
below reflects the status of each implemented requirement as of the publication
of this blueprint.

| § | Requirement | Design | Impl | Integ | Test | Inst. Val. | Prod |
|---|-------------|:------:|:----:|:-----:|:----:|:----------:|:----:|
| §47 | Protected Backing Cell (17-field, AvailableBacking formula, anti-double-count) | ✓ | ✓ | ✓ | ✓ | LEGAL_VALIDATION_PENDING | DESIGNED |
| §48 | Bank Default & Resolution (8-state lifecycle, 11 contractual questions) | ✓ | ✓ | ✓ | ✓ | CONTRACT_VALIDATION_PENDING | DESIGNED |
| §49 | Legal Liability Framework (13 dimensions, jurisdiction registry) | ✓ | ✓ | ✓ | ✓ | LEGAL_VALIDATION_PENDING | DESIGNED |
| §50 | Licensing / Entity Matrix (9 activities × 8 jurisdictions = 72 entries) | ✓ | ✓ | ✓ | ✓ | LICENSING_VALIDATION_PENDING | DESIGNED |
| §51 | Three-Book Economic Separation (Book A/B/C, 4 anti-commingling tests) | ✓ | ✓ | ✓ | ✓ | CONTRACT_VALIDATION_PENDING | DESIGNED |
| §52 | Systemic Exposure Engine (13 dimensions, bank-vs-system-wide) | ✓ | ✓ | ✓ | ✓ | MODEL_VALIDATION_PENDING | DESIGNED |
| §54 | Finality-Before-Mint (7 layers, 10 bypass tests) | ✓ | ✓ | ✓ | ✓ | CONTRACT_VALIDATION_PENDING | DESIGNED |
| §77 | Contradiction Scan (17 patterns, 0 unresolved) | ✓ | ✓ | ✓ | ✓ | DESIGNED | DESIGNED |
| §§16-46 | Final Reserve Mathematical Specification (130% / 80-18-2 / engine) | ✓ | ✓ | ✓ | ✓ | MODEL_VALIDATION_PENDING | DESIGNED |

**Status column legend:**
- **Design / Impl / Integ / Test** = `IMPLEMENTED` (✓) means the design/implementation/integration/testing has been completed at code level.
- **Inst. Val.** = Institutional Validation. Values: `LEGAL_VALIDATION_PENDING`, `CONTRACT_VALIDATION_PENDING`, `LICENSING_VALIDATION_PENDING`, `MODEL_VALIDATION_PENDING`, `DESIGNED`.
- **Prod** = Production. Values: `DESIGNED` (designed but not production-authorized). All entries are `DESIGNED`.

### 0.12.1 Module Inventory

| Module | Section | Lines | Evidence |
|--------|---------|------:|---------|
| `src/lib/protected-backing-cell.ts` | §47 | 1,133 | 4 SIMULATED reference cells · anti-double-count enforced at mutation + audit · protectedBackingLiveCells=0 |
| `src/lib/bank-default-resolution.ts` | §48 | 1,044 | 8 states fully configured · 11 contractual questions · bankDefaultContractValidated=false · MITHQAL NOT guarantor |
| `src/lib/legal-liability-framework.ts` | §49 | 724 | 8 jurisdictions seeded ALL JURISDICTION_PENDING · VALIDATED_JURISDICTIONS=0 · LEGAL_OPINIONS_OBTAINED=false |
| `src/lib/licensing-entity-matrix.ts` | §50 | 784 | 72 entries ALL REQUIRED_NOT_OBTAINED · licensesObtained=0 · MITHQAL role never GUARANTOR |
| `src/lib/three-book-separation.ts` | §51 | 975 | 3 books · 4 anti-commingling tests ALL blocked · threeBookOperational=false · threeBookEnforced=false |
| `src/lib/systemic-exposure-engine.ts` | §52 | 1,295 | 13 dimensions · systemicRiskMonitoringLive=false · systemicRiskProductionValidated=false |
| `src/lib/finality-before-mint.ts` | §54 | ~280 | 7/7 layers enforced at code level · 10/10 bypass routes blocked · finalityProductionReady=false · bypassRisk MITIGATED_AT_CODE_LEVEL |
| `src/lib/contradiction-scan.ts` | §77 | ~280 | 17 patterns scanned · 0 unresolved contradictions · static code scan (not runtime assertion) |
| `src/lib/mtq-final-reserve-spec.ts` | §§16-46 | 1,234 | 50 directive sections · all 4 §49 conflicts reconciled · reservePolicyStatus=CANDIDATE_MODEL_VALIDATION_PENDING |
| `src/lib/implementation-status-report.ts` | §87 | ~290 | 9 requirements · 19/23 acceptance criteria met · 0/13 gates passed |
| **Total new library code** | | **~5,805** | |

Plus 9 API routes (~120 lines) and 1 dashboard (~430 lines).

### 0.12.2 Verification Results

- All 9 API endpoints return HTTP 200 (verified).
- Dashboard fully renders in browser (11/11 section checks `true` — verified).
- §77 contradiction scan: 0 unresolved (target met).
- §54 finality: 7/7 layers enforced, 10/10 bypass routes blocked.
- §87 acceptance: 19/23 criteria met (83%, honest).

## 0.13 Pilot-Readiness Summary

MITHQAL is in the **APPROVED CANDIDATE FOR CONTROLLED TESTING** phase. The pilot
model is the smallest viable institutional test of the architecture. It is
deliberately scoped to **one regulated institution, one jurisdiction, one corridor**
to ensure that every constitutional invariant can be tested in a controlled
environment before any expansion.

### 0.13.1 Pilot Readiness Categories

| # | Category | Status |
|---|----------|--------|
| 1 | Institutional Authorization | NOT_ASSESSED |
| 2 | Legal / Regulatory Path | NOT_ASSESSED |
| 3 | Technical Integration | NOT_ASSESSED |
| 4 | Compliance Interface | NOT_ASSESSED |
| 5 | Security | NOT_ASSESSED |
| 6 | Settlement / Finality | NOT_ASSESSED |
| 7 | Backing Evidence | NOT_ASSESSED |
| 8 | Reconciliation | NOT_ASSESSED |
| 9 | Resilience / Disaster Recovery | NOT_ASSESSED |
| 10 | Independent Assurance | NOT_ASSESSED |

All ten readiness categories are NOT_ASSESSED. No category may be marked
otherwise without independent institutional evidence.

### 0.13.2 Institutional Engagement Status

All institutional engagements are in the **PROPOSED** status. No institution
is onboarded. No jurisdiction is validated. No corridor is approved. No sandbox
test has been executed with a real institution.

| Engagement Type | Status |
|-----------------|--------|
| Architecture Review | PROPOSED |
| Regulatory / Legal Review | PROPOSED |
| Sandbox Testing | PROPOSED |
| Bank Integration Pilot | PROPOSED |
| Settlement Pilot | PROPOSED |
| Independent Assurance | PROPOSED |

### 0.13.3 Evidence Status Ladder

Every institutional claim, evidence artifact, and validation step must progress
through the following evidence ladder. No status may be skipped.

| Status | Meaning |
|--------|---------|
| PROPOSED | Architecture proposes the engagement; no institution has responded. |
| UNDER_REVIEW | An institution has begun reviewing; no commitment implied. |
| EVIDENCE_REQUIRED | Evidence has been requested; not yet produced. |
| SANDBOX_CANDIDATE | Identified as potential sandbox testing candidate; not validated. |
| VALIDATED | Validated through documented institutional review. Requires authorized institutional evidence. |

No MITHQAL claim may be presented as VALIDATED without authorized institutional
evidence in hand. The current highest evidence status anywhere in the MITHQAL
architecture is **PROPOSED**.

## 0.14 Disclaimer

> **CONTROLLED INSTITUTIONAL DOCUMENT · NOT A LICENSE · NOT A LEGAL OPINION.**

This document is the MITHQAL Master Blueprint v25.2. It is a design-time
architectural specification. It is not:

- A license to operate in any jurisdiction.
- A regulatory clearance, classification, or authorization.
- A legal opinion on the status of MTQ in any jurisdiction.
- A bank contract, custody agreement, or institutional onboarding document.
- An investment prospectus, offering memorandum, or solicitation of investment.
- A financial guarantee of any kind.
- A representation of production readiness.
- A representation of institutional validation.
- A representation of regulatory approval.

No representation in this document may be treated as institutional validation,
regulatory authorization, banking integration, custody readiness, or production
authorization. All such validations require independent institutional evidence.

The architecture described herein is a candidate model. Its values — including
130% backing target, 80/18/2 composition, 20% concentration cap, 35% USD
ceiling, 7/7 finality enforcement, and 0/13 institutional gates — are design-time
reference values. They have not been institutionally validated. They are not
production-normative until institutional validation gates are satisfied.

MITHQAL is currently operated by **JOZOUR LLC (New Jersey)** until the planned
MITHQAL Holding corporate structure is legally formed. JOZOUR LLC is NOT the
institution, NOT the reserve owner, NOT the reserve custodian, and NOT the
constitutional authority. The MITHQAL Holding, Operating, Technology, and
Foundation entities described in §0.10 are PROPOSED entities. Their legal
formation is contingent on the pilot progressing to a stage that warrants
corporate structuring.

For institutional engagement: **meltonsy@icloud.com**.

---

# SECTION 1 — MISSION, VISION & STRATEGIC OBJECTIVE

## 1.0 Section Purpose

This section defines the mission, vision, and strategic objective of MITHQAL. It
establishes the institutional purpose that every architectural decision, every
code change, every institutional engagement, and every operational procedure
must serve. It also defines the pilot model through which the architecture will
be validated, and the scope constraint that bounds the initial deployment.

The mission, vision, and strategic objective are constitutional. They cannot be
amended, reinterpreted, or set aside by any governance body, commercial pressure,
regulatory inquiry, or operational convenience. Any architectural change that
would compromise the mission, vision, or strategic objective is by definition
unconstitutional and must be rejected.

## 1.1 Mission Statement

> **The mission of MITHQAL is to provide regulated monetary systems with a neutral,
> reserve-disciplined, cryptographically auditable settlement layer that sits
> between monetary systems — never instead of monetary systems — enabling
> regulated financial institutions to settle value across jurisdictions with
> institutional traceability, jurisdictional compliance, and absolute
> settlement finality, without ever displacing, substituting for, or competing
> with sovereign currencies or central-bank money.**

### 1.1.1 Mission Decomposition

The mission statement contains seven binding commitments. Each is non-negotiable.

#### Commitment 1 — Neutrality
MITHQAL is neutral. It does not favor one monetary system over another. It does
not favor one jurisdiction over another. It does not favor one geopolitical bloc
over another. USD remains USD. JPY remains JPY. EUR remains EUR. AED remains AED.
CNY remains CNY. CBDCs remain liabilities of their issuing central banks. MITHQAL
provides the settlement bridge between these systems; it does not become another
system.

#### Commitment 2 — Reserve Discipline
MITHQAL is reserve-disciplined. No MTQ may be issued without constitutionally
verified reserve backing. The reserve architecture is governed by the 130%
institutional backing target, the 80/18/2 composition policy, the 20% hard
effective concentration cap, the 35% USD effective ceiling, the 15% emergency
resilience capacity (separate, non-double-counted), and the gold anchor. These
values are policy candidates pending institutional quantitative validation; they
are not optional design choices.

#### Commitment 3 — Cryptographic Auditability
MITHQAL is cryptographically auditable. Every MTQ transaction is
institutionally attributable. Every reserve claim is cryptographically
verifiable. Every mint is gated by a seven-layer finality enforcement stack.
Every reconciliation is five-way: bank subledger, reserve backing evidence,
custodian evidence, canonical ledger, proof of liabilities. No transaction is
anonymous. No transaction is unauditable.

#### Commitment 4 — Settlement Layer
MITHQAL is a settlement layer, not a currency, not a platform, not a bank, not
an exchange. It sits *between* monetary systems, transferring settlement value
between them through the MTQ settlement instrument. The commercial flow is
locked: customers use banks; banks use MITHQAL; MITHQAL uses MTQ to settle
value between monetary systems.

#### Commitment 5 — Institutional Traceability
MITHQAL is institutionally traceable. Every settlement transaction has a
fourteen-field settlement record schema. Every transaction has a six-hop trace
path: Customer → Bank Account Transaction ID → Bank Institutional Settlement ID
→ MITHQAL Settlement ID → MTQ Transaction Hash → Receiving Bank Settlement ID
→ Beneficiary Account. No transaction is untraceable.

#### Commitment 6 — Jurisdictional Compliance
MITHQAL is jurisdictionally compliant. Every jurisdiction has its own
regulatory perimeter. Every jurisdiction requires explicit licensing and
authorization. UNKNOWN status is a conservative block — never inferred legal
permission. Geo-fencing is fail-closed. Sanctions circumvention is
prohibited. There is no jurisdictional exemption.

#### Commitment 7 — No Sovereign Displacement
MITHQAL never displaces, substitutes for, or competes with sovereign currencies
or central-bank money. MTQ is a permissioned wholesale settlement instrument,
not a sovereign currency, not a CBDC, not a stablecoin, not a USD replacement.
This commitment is the architectural north star, and it cannot be qualified,
relaxed, or reinterpreted.

## 1.2 Vision Statement

> **The vision of MITHQAL is to become the neutral institutional settlement
> fabric of the regulated global financial system — a constitutionally governed,
> mathematically transparent, cryptographically enforced settlement layer that
> regulated financial institutions and sovereign monetary authorities can use to
> settle value across jurisdictions without ceding monetary sovereignty, without
> adopting any single sovereign currency as the international settlement unit,
> and without compromising on institutional traceability, regulatory compliance,
> or settlement finality.**

### 1.2.1 Vision Decomposition

The vision statement describes the future MITHQAL intends to inhabit. The vision
is not the present state. The present state is captured in the Honest State
Declaration (§0.11). The vision describes the institutional destination toward
which every architectural decision should aim.

#### Vision Element 1 — Neutral Settlement Fabric
MITHQAL intends to be the neutral settlement fabric, not a competing monetary
system, not a platform, not a bank. "Fabric" means a layer that other regulated
institutions use, not a layer that competes with them.

#### Vision Element 2 — Constitutionally Governed
MITHQAL is governed by a constitution. The constitution is not a code of conduct;
it is a set of invariants that the architecture must enforce, and that no
governance body may amend. The constitution is documented in Section 2 of this
blueprint.

#### Vision Element 3 — Mathematically Transparent
MITHQAL's reserve mathematics are transparent. Every formula is published.
Every parameter is documented. Every computation is reproducible. There is
no proprietary reserve math. There is no opaque risk model. The architecture
is auditable by any qualified institution.

#### Vision Element 4 — Cryptographically Enforced
MITHQAL's invariants are not just documented; they are cryptographically enforced.
The seven-layer finality enforcement stack is the architectural expression of
this commitment. The ledger state machine is append-only. The smart contract
mint function requires a finality oracle attestation. The database transaction
wraps the mint and the finality proof atomically.

#### Vision Element 5 — Cross-Jurisdictional
MITHQAL is cross-jurisdictional. It does not privilege one jurisdiction. It
respects every jurisdiction's regulatory perimeter. It geo-fences jurisdictions
where MTQ issuance, settlement, or crypto activity is prohibited. It enforces
sanctions compliance.

#### Vision Element 6 — Sovereign Monetary Sovereignty Preserved
MITHQAL never asks a sovereign to cede monetary sovereignty. Sovereign
currencies remain sovereign currencies. Central-bank money remains central-bank
money. MTQ is the settlement instrument *between* monetary systems.

#### Vision Element 7 — No Single Sovereign as International Settlement Unit
MITHQAL does not require any single sovereign currency to become the
international settlement unit. The 11-currency reserve basket diversifies
exposure. The 35% USD effective ceiling is the architectural expression of this
commitment. No single sovereign currency may dominate the reserve.

#### Vision Element 8 — Institutional Traceability, Compliance, Finality
The three pillars of the MITHQAL value proposition: traceability (every
transaction is attributable), compliance (every transaction is jurisdictionally
cleared), finality (every settlement is final, irreversible, and atomic).

## 1.3 Strategic Objective — Build. Test. Validate.

The strategic objective of MITHQAL is captured in three words:

> **Build. Test. Validate.**

These three words are not a slogan. They are a sequential, non-skippable
methodology that governs every aspect of the MITHQAL project lifecycle.

### 1.3.1 BUILD

**BUILD** means constructing the architecture in conformance with the constitution.
Building includes:

1. Implementing every constitutional invariant in code.
2. Implementing the seven-layer finality enforcement stack.
3. Implementing the currency weight engine, gold policy, digital liquidity policy,
   concentration limits, jurisdiction registry, licensing matrix, three-book
   separation, systemic exposure engine, protected backing cell, bank default
   resolution framework, legal liability framework, and contradiction scan.
4. Implementing the 16-step Bank Minting Workflow (BM-01 through BM-16).
5. Implementing the five-way reconciliation model.
6. Implementing the 7-state ledger state machine (PENDING → AUTHORIZED →
   FINALIZED → MINTED).
7. Implementing the 9 smart contracts (MTQ, Mint, Redeem, Reserve, Governance,
   Algorithm, Oracle, Safe, Takaful) on testnet.
8. Implementing the 12 versioned API endpoints (/gateway/v1/*).
9. Implementing the 13 technology services.
10. Implementing the 35 integrated test scenarios (INT-T01 .. INT-T35).

Building does NOT mean:
- Deploying to production.
- Onboarding real institutions.
- Processing real customer funds.
- Replacing any existing payment system.
- Making any production-normative claim.

### 1.3.2 TEST

**TEST** means adversarially validating the architecture against its constitution.
Testing includes:

1. Running the 10 finality bypass route tests (all 10 must be blocked).
2. Running the 4 anti-commingling tests (all 4 must be blocked).
3. Running the 17 contradiction pattern scans (0 unresolved).
4. Running the 35 integrated test scenarios (INT-T01 .. INT-T35).
5. Running the 9 smart contract audits (15 CRITICAL, 15 HIGH, 7 MEDIUM changes
   tracked).
6. Running the 5 what-if reserve scenarios (currency fall, gold fall, digital
   sleeve loss, digital sleeve zero, combined).
7. Running the Monte Carlo simulation (1,000 iterations, RR distribution
   analysis).
8. Running the 5 stress shocks (Gold -20%, USD -10%, Currency -15%, Digital
   -50%, Combined).
9. Running the 10 institutional engagement readiness checks (all currently
   NOT_ASSESSED).

Testing does NOT mean:
- Claiming production readiness from passing tests.
- Skipping institutional validation.
- Substituting code-level testing for institutional review.
- Representing tests as institutional validation.

### 1.3.3 VALIDATE

**VALIDATE** means obtaining independent institutional evidence that the
architecture satisfies each of the 13 institutional validation gates. Validation
includes:

1. Obtaining legal opinions on MTQ classification in each target jurisdiction
   (currently 0 of 8 seeded jurisdictions have legal opinions).
2. Obtaining required licenses in each target jurisdiction (currently 0 of 72
   licensing matrix entries have licenses obtained).
3. Signing bank contracts with regulated financial institutions (currently 0
   signed).
4. Signing custodian contracts (currently 0 signed).
5. Signing asset contracts (currently 0 signed).
6. Onboarding live oracle feeds (currently 0 live).
7. Activating the three-book separation in production (currently designed but
   not operational or enforced).
8. Activating systemic risk monitoring (currently designed and implemented but
   not live).
9. Activating protected backing live cells (currently 0 live cells, 4 SIMULATED
   reference cells only).
10. Validating bank default contracts (currently contract validation pending).
11. Validating bank default legal framework (currently legal validation pending).
12. Validating reserve policy model (currently CANDIDATE_MODEL_VALIDATION_PENDING).
13. Satisfying finality production readiness (currently FALSE — pending
    institutional validation).

Validation does NOT mean:
- Skipping any gate.
- Substituting MITHQAL's internal assessment for institutional review.
- Accepting "implicit" approval.
- Treating the absence of explicit prohibition as permission.

### 1.3.4 Sequential Discipline

The three stages are sequential. No stage may be skipped. No stage may be
compressed. No stage may be conflated with another.

```
┌─────────┐     ┌─────────┐     ┌──────────┐
│  BUILD  │ ──> │  TEST   │ ──> │ VALIDATE │
└─────────┘     └─────────┘     └──────────┘
   Code          Adversarial    Independent
   in            validation     institutional
   conformance   against        evidence
   with          constitution   per 13 gates
   constitution
```

Current stage: TEST (mostly complete; some BUILD items remain in progress).
Next stage: VALIDATE (not begun; 0/13 gates passed).

### 1.3.5 Build. Test. Validate. as a Marketing Discipline

The three-word strategic objective is also a marketing discipline. No external
communication may claim more than the current stage warrants. Specifically:

- While in BUILD, no claim of testing success may be made.
- While in TEST, no claim of institutional validation may be made.
- While in VALIDATE, no claim of production authorization may be made until
  all 13 gates are passed.

The current MITHQAL public-facing status is: **APPROVED CANDIDATE FOR
CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED**.

## 1.4 Strategic Pillars

The MITHQAL strategy rests on six strategic pillars. Each pillar is
constitutionally required; none may be set aside.

### 1.4.1 Pillar 1 — Constitutional Discipline

Every architectural decision must conform to the constitution (Section 2 of this
blueprint). The constitution is composed of 17 non-negotiable invariants. Where
a commercial opportunity would require violating an invariant, the opportunity
is rejected. Where a regulatory regime would require violating an invariant,
the regime is not entered. Where a partner would require violating an invariant,
the partnership is not formed.

### 1.4.2 Pillar 2 — Institutional Partnership

MITHQAL operates only through regulated institutional partners. There is no
retail customer. There is no direct consumer access. There is no unrestricted
minting. There is no bypass route. Every MTQ transaction has a regulated
financial institution on each side: the sending institution and the receiving
institution. Customers reach MTQ only through their banks.

### 1.4.3 Pillar 3 — Reserve Integrity

The MITHQAL reserve is the foundation of MTQ's settlement integrity. The reserve
architecture is governed by the 130% backing target, the 80/18/2 composition,
the 20% concentration cap, the 35% USD ceiling, the gold anchor, the
non-custodial default, the three-book separation, the protected backing cell
model, and the five-way reconciliation. No reserve claim may be represented as
verified without institutional evidence. No reserve asset may be silently
reallocated.

### 1.4.4 Pillar 4 — Cryptographic Enforcement

MITHQAL's invariants are not just documented; they are cryptographically
enforced. The seven-layer finality enforcement stack, the append-only ledger
state machine, the ACID database transaction constraints, the smart contract
finality oracle attestation, the cryptographic bank attestation, and the
zero-knowledge proof systems together enforce the constitution at the code level.
A breach of the constitution would require a simultaneous breach of multiple
independent enforcement layers.

### 1.4.5 Pillar 5 — Jurisdictional Compliance

MITHQAL respects every jurisdiction's regulatory perimeter. It does not claim
exemption. It does not claim automatic approval. It does not infer permission
from internal labels. UNKNOWN status is a conservative block. Geo-fencing is
fail-closed. Sanctions circumvention is prohibited. Each jurisdiction requires
explicit licensing and authorization. The licensing matrix documents 72 entries
(9 activities × 8 jurisdictions); 0 licenses have been obtained; all 72 are
REQUIRED_NOT_OBTAINED.

### 1.4.6 Pillar 6 — Honest Disclosure

MITHQAL discloses its true state. It does not inflate. It does not imply. It
does not suggest. The Honest State Declaration (§0.11) is binding. The
implementation status report (§0.12) is binding. The pilot-readiness summary
(§0.13) is binding. Every `false`, every `0`, every `NOT_ASSESSED` is binding.
No code-only capability may be represented as institutionally validated. No
technical capability may be represented as legally authorized without evidence.
No bank relationship may be represented as a bank integration until an actual
bank integration exists. No reserve claim may be represented as verified
without institutional evidence. No production authorization until the defined
legal, licensing, contractual, technical, risk, reconciliation and pilot gates
are satisfied.

## 1.5 Pilot Model (9-Step Flow)

The pilot model is the smallest viable institutional test of the MITHQAL
architecture. It is deliberately scoped to ensure that every constitutional
invariant can be tested in a controlled environment before any expansion.

### 1.5.1 The Nine Pilot Flow Stages

The pilot proceeds through nine sequential stages. Each stage must be completed
before the next stage begins. No stage may be skipped.

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 1                                                       │
   │  ONE REGULATED INSTITUTION                                     │
   │  A single regulated financial institution sponsors the pilot.  │
   │  The institution is named, contracted, and authorized.         │
   └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 2                                                       │
   │  ONE JURISDICTION                                              │
   │  The pilot operates in a single jurisdiction where the         │
   │  institution is licensed and where MITHQAL has obtained        │
   │  any required licensing/authorization.                        │
   └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 3                                                       │
   │  ONE CORRIDOR                                                  │
   │  The pilot operates a single settlement corridor between       │
   │  two monetary endpoints (e.g., AED → SGD).                    │
   └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 4                                                       │
   │  INSTITUTIONAL CORPORATES                                      │
   │  A small number of institutional corporate customers           │
   │  (corporates that already bank with the sponsor institution)   │
   │  are onboarded as the underlying customers for the pilot.     │
   └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 5                                                       │
   │  CONTROLLED TEST ENVIRONMENT                                   │
   │  The pilot operates in a non-production sandbox or test        │
   │  environment, isolated from production banking systems.       │
   └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 6                                                       │
   │  MTQ PASS-THROUGH SETTLEMENT                                   │
   │  MTQ is used as the pass-through settlement instrument:        │
   │  sovereign money in → MTQ settlement → sovereign money out.   │
   │  No MTQ is held speculatively; no MTQ is minted without       │
   │  final settlement.                                             │
   └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 7                                                       │
   │  RECONCILIATION                                                │
   │  Five-way reconciliation is performed and evidence is         │
   │  produced: bank subledger, reserve backing evidence,          │
   │  custodian evidence, canonical ledger, proof of liabilities.  │
   └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 8                                                       │
   │  SECURITY / RESILIENCE TESTING                                 │
   │  Adversarial security testing, penetration testing,           │
   │  disaster recovery testing, and failure-injection testing     │
   │  are performed and evidence is produced.                      │
   └─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  STAGE 9                                                       │
   │  INDEPENDENT / INSTITUTIONAL REVIEW                            │
   │  An independent third party (regulator, auditor, or           │
   │  assurance provider) reviews the pilot evidence and          │
   │  produces an institutional review report.                      │
   └─────────────────────────────────────────────────────────────────┘
```

### 1.5.2 Pilot Flow Stage Detail

| Stage | Name | Sponsor | Output |
|-------|------|---------|--------|
| 1 | ONE REGULATED INSTITUTION | MITHQAL + Institution | Signed pilot authorization agreement |
| 2 | ONE JURISDICTION | MITHQAL + Regulator | Licensing/classification opinion |
| 3 | ONE CORRIDOR | MITHQAL + Sending/Receiving institutions | Corridor specification (currency pair, rails, finality mechanism) |
| 4 | INSTITUTIONAL CORPORATES | Sponsor Bank + Corporate customers | KYC/KYB completed; corporate settlement accounts opened |
| 5 | CONTROLLED TEST ENVIRONMENT | MITHQAL + Sponsor Bank | Sandbox environment provisioned; synthetic data prepared |
| 6 | MTQ PASS-THROUGH SETTLEMENT | MITHQAL + Sponsor Bank | Settlement execution records; finality evidence |
| 7 | RECONCILIATION | MITHQAL + Sponsor Bank + Custodian | Five-way reconciliation reports (7 states: VERIFIED/WARNING/MISMATCH/CRITICAL/EXPIRED/UNAVAILABLE/LOCKED) |
| 8 | SECURITY / RESILIENCE TESTING | Independent security firm | Penetration test report; DR test report; failure-injection report |
| 9 | INDEPENDENT / INSTITUTIONAL REVIEW | Regulator / Auditor / Assurance provider | Institutional review report; sign-off record |

### 1.5.3 Pilot Stage Discipline

- No stage may be skipped.
- No stage may be declared complete without producing the required output.
- Stage 9 (Independent / Institutional Review) is the only stage whose output
  can confer institutional validation. All prior stages produce evidence; Stage
  9 produces validation.
- Stage 9 cannot be performed by MITHQAL itself. The reviewer must be an
  independent third party.
- A pilot that has not completed Stage 9 is not validated.

### 1.5.4 Pilot Acceptance Criteria

The pilot is accepted when all 33 institutional readiness checklist items are
satisfied. The 33 items are organized in 11 categories:

| Category | Items |
|----------|------:|
| Institutional (1–7) | 7 |
| Regulatory (8–11) | 4 |
| Technical (12–16) | 5 |
| Settlement (17–19) | 3 |
| Compliance (20–22) | 3 |
| Assurance (23–24) | 2 |
| Security (25–27) | 3 |
| Reconciliation (28) | 1 |
| Privacy (29) | 1 |
| Resilience (30) | 1 |
| Authorization (31–33) | 3 |
| **Total** | **33** |

Each item must declare met=true only when independent evidence is present.
Currently, all 33 items are NOT_ASSESSED.

## 1.6 Scope Constraint

The initial MITHQAL pilot is explicitly bounded:

> **Broader treasury holding is outside the initial pilot scope.**

This single sentence defines the perimeter of the pilot. It means:

1. MITHQAL is not, in the pilot, a general-purpose treasury management platform.
2. MITHQAL is not, in the pilot, a sovereign wealth fund.
3. MITHQAL is not, in the pilot, a corporate treasury optimization tool.
4. MITHQAL is not, in the pilot, a multi-currency cash management platform.
5. MITHQAL is not, in the pilot, an asset management platform.

What the pilot IS:

1. A pass-through settlement test for a single corridor.
2. A test of the 16-step Bank Minting Workflow.
3. A test of the seven-layer finality enforcement stack.
4. A test of the five-way reconciliation model.
5. A test of the protected backing cell model.
6. A test of the three-book economic separation.
7. A test of the systemic exposure engine.
8. A test of the bank default resolution framework (in simulation, not in real
   bank default).
9. A test of the legal liability framework (against the sponsoring jurisdiction).
10. A test of the licensing/entity matrix (against the sponsoring jurisdiction).

### 1.6.1 Scope Boundary Enforcement

The scope boundary is enforced at three levels:

#### Enforcement Level 1 — Contractual
The pilot authorization agreement between MITHQAL and the sponsor institution
explicitly states that broader treasury holding is outside the pilot scope.
Any attempt to expand the pilot beyond the agreed scope requires a contract
amendment, which requires governance approval.

#### Enforcement Level 2 — Technical
The pilot environment is configured to reject settlement instructions that
exceed the agreed corridor, the agreed volume, the agreed corporate customer
list, and the agreed settlement amounts. The MBG adapter enforces these
constraints.

#### Enforcement Level 3 — Operational
The Operating Company's Monetary & Reserve Control Division is operationally
separated from commercial bank relationship management. Commercial staff cannot
approve scope expansions. The Monetary & Reserve Control Division can refuse any
settlement that exceeds the pilot scope, regardless of commercial pressure.

### 1.6.2 Why the Scope Is Bounded

The pilot scope is bounded for three reasons:

#### Reason 1 — Constitutional Validation Precedes Expansion
Before MITHQAL can expand to broader treasury holding, the constitution must be
validated in the smallest viable institutional test. Skipping the pilot to expand
directly to broader treasury holding would risk constitutional failure at scale.

#### Reason 2 — Risk Containment
Broader treasury holding would expose MITHQAL to a wider range of risks: market
risk, credit risk, liquidity risk, operational risk, and reputational risk. The
pilot scope is deliberately narrow to ensure that any failure can be contained
and remediated without systemic impact.

#### Reason 3 — Regulatory Discipline
Regulators are more likely to authorize a narrow, controlled pilot than a broad,
open-ended deployment. The pilot scope is the smallest scope that allows the
architecture to be tested; expanding beyond this scope without regulatory
authorization would be unconstitutional.

## 1.7 Engagement Discipline

MITHQAL engages institutions through a disciplined six-type engagement model.
Every engagement is in the **PROPOSED** status until independent institutional
evidence elevates it.

### 1.7.1 Engagement Types (6)

| # | Engagement Type | Purpose |
|---|-----------------|---------|
| 1 | Architecture Review | Review the MITHQAL architecture alongside institutional infrastructure to assess compatibility, boundary design and integration feasibility |
| 2 | Regulatory / Legal Review | Evaluate classification, licensing perimeter, liability chain and jurisdiction-specific requirements |
| 3 | Sandbox Testing | Conduct controlled testing in a regulator, bank, innovation sandbox or equivalent non-production environment |
| 4 | Bank Integration Pilot | Evaluate MBG integration through API, ISO 20022, host-to-host, SFTP, treasury and ERP interfaces where applicable |
| 5 | Settlement Pilot | Controlled institutional testing under the initial one-institution / one-jurisdiction / one-corridor model |
| 6 | Independent Assurance | Review security, finality, reconciliation, resilience, evidence and controls |

### 1.7.2 Engagement Discipline Rules

1. Every engagement is documented in a written agreement before it begins.
2. Every engagement is scoped to the architecture's current state (no claims of
   production readiness may be made during engagements).
3. Every engagement produces evidence that is reviewed by the MITHQAL
   Foundation's read-only oversight function.
4. Every engagement's evidence is treated as design-time reference material
   until an independent institutional review elevates it to validated status.
5. No engagement may be represented as institutional validation until Stage 9
   of the pilot flow is complete.

### 1.7.3 Institutional Type Universe (10)

MITHQAL engages with ten institutional types:

| # | Type | Description |
|---|------|-------------|
| 1 | CENTRAL_BANK | Central banks / monetary authorities |
| 2 | REGULATED_BANK | Regulated banks |
| 3 | FINANCIAL_INSTITUTION | Regulated financial institutions (non-bank) |
| 4 | PAYMENT_INFRASTRUCTURE | Payment / clearing / settlement infrastructure operators |
| 5 | GOVERNMENT_AUTHORITY | Government / sovereign infrastructure authorities |
| 6 | REGULATOR_SUPERVISOR | Financial regulators / supervisory authorities |
| 7 | TECHNOLOGY_PROVIDER | Banking technology / payment-rail providers |
| 8 | CYBERSECURITY_ASSURANCE | Cybersecurity / independent assurance institutions |
| 9 | LEGAL_REGULATORY | Legal / regulatory institutions |
| 10 | STANDARDS_RESEARCH | Standards / research institutions |

Every institutional type has its own engagement discipline, appropriate
engagement types, and security notice. No institution is described as a
"partner" of MITHQAL. Institutions are "institutions MITHQAL is seeking to
engage" — never "partners."

### 1.7.4 What MITHQAL Will Not Promise

In any institutional engagement, MITHQAL will not promise:

1. Licensing
2. Regulatory approval
3. Funding
4. Liquidity
5. Custody
6. Financial guarantees
7. Institutional authorization
8. Production deployment

These are not promises MITHQAL can make. They are institutional decisions that
must be made by the relevant authorities, regulated institutions, and independent
reviewers. MITHQAL's role is to provide accurate architecture information and
support the institutional review process.

### 1.7.5 What MITHQAL Provides

In any institutional engagement, MITHQAL provides 20 documented review artifacts:

1. Technical Architecture Package
2. Bank Boundary Architecture
3. MBG Integration Model
4. API / Schema Documentation
5. MTQSettlementInstruction
6. Issuance State Machine
7. Finality-Before-Mint Control Specification
8. Protected Backing Cell Model
9. Three-Book Separation Model
10. Five-Way Reconciliation Model
11. Security Architecture
12. Privacy Architecture
13. Resilience and Failure Semantics
14. Sandbox Test Scenarios
15. Adversarial Test Scenarios
16. Reconciliation Test Plan
17. DR / Failure-Injection Test Plan
18. Pilot Acceptance Criteria
19. Institutional Readiness Framework
20. Jurisdiction-Specific Integration Assessment

These are MITHQAL review artifacts/templates. They are not approved by any
institution. They are subject to readiness and formal agreement.

---

# SECTION 2 — CONSTITUTIONAL PRINCIPLES

## 2.0 Section Purpose

This section is the constitution of MITHQAL. It defines the non-negotiable
invariants that the architecture must enforce, and that no governance body,
commercial pressure, regulatory inquiry, or operational convenience may set
aside. The constitution is not a code of conduct; it is the set of architectural
constraints that distinguish MITHQAL from a cryptocurrency, a stablecoin, a
bank, an exchange, or any other financial platform.

The constitution is composed of:

1. **17 non-negotiable invariants** (§2.1 through §2.17), each binding in
   production and in test.
2. **Evidence-state discipline** (§2.18), defining the seven states through
   which every capability must progress before it may be claimed.
3. **Current honest state declaration** (§2.19), the full §74 declaration
   with all 30+ fields.
4. **Conflict resolution discipline** (§2.20), the rule for resolving
   conflicts between historical configurations and current policy.
5. **Authority matrix summary** (§2.21), the canonical ownership of every
   architectural function.

The constitution is the highest authority in MITHQAL. Below it are: the strategic
objective (Build. Test. Validate.), the mission, the vision, the architectural
specifications, the operational procedures, the code, the institutional
engagements, and the commercial arrangements. Every layer below the constitution
must conform to the constitution. Where any lower layer conflicts with the
constitution, the constitution prevails.

## 2.1 Invariant #1 — No Discretionary Minting

> **No MTQ may exist without corresponding verified reserve backing. No
> participant or governance body may exercise discretionary monetary issuance
> authority.**

### 2.1.1 Statement

MTQ is a permissioned wholesale settlement instrument. It is issued only through
the canonical 16-step Bank Minting Workflow (BM-01 through BM-16), only after
finality verification (BM-15) has passed, only after the seven-layer finality
enforcement stack has authorized the mint, and only against verified reserve
backing documented in a Protected Backing Cell.

### 2.1.2 Prohibited Minting Types

The following types of minting are PROHIBITED. Each is a constitutional breach.

| # | Type | Status |
|---|------|--------|
| 1 | Executive minting | ❌ PROHIBITED |
| 2 | Council minting | ❌ PROHIBITED |
| 3 | Emergency arbitrary minting | ❌ PROHIBITED |
| 4 | Treasury minting | ❌ PROHIBITED |
| 5 | Compensation minting | ❌ PROHIBITED |
| 6 | Operational funding minting | ❌ PROHIBITED |
| 7 | Governance minting | ❌ PROHIBITED |
| 8 | Promotional minting | ❌ PROHIBITED |

### 2.1.3 Enforcement

The invariant is enforced by the seven-layer finality enforcement stack (§0.9).
No single layer can authorize a mint; all seven must pass. The mint authority is
deliberately separated into three stages (ISSUANCE_REQUEST → ISSUANCE_AUTHORIZATION
→ MINT_EXECUTION), and no single actor controls both request and authorization.

### 2.1.4 Revenue Sequence Rule

Revenue must never influence monetary issuance. The sequence is:

1. Legal eligibility
2. Institutional authorization
3. Reserve/funding verification
4. Risk checks
5. Issuance
6. Fee accounting

NEVER: Fee paid → MTQ issued. The fee accounting is the last step, not the first.

### 2.1.5 Scope of Application

This invariant applies in production, in sandbox, in testnet, in integration
tests, in unit tests, and in any environment where MTQ is minted. The invariant
is not relaxed for testing. The invariant is not relaxed for emergencies. The
invariant is not relaxed for any actor.

## 2.2 Invariant #2 — No Final Settlement ⇒ No MTQ Mint

> **NO FINAL SETTLEMENT ⇒ NO MTQ MINT.**

### 2.2.1 Statement

MTQ is a settlement instrument. It is minted only to settle a final
transaction. No MTQ may be minted in anticipation of a future settlement. No
MTQ may be minted without a corresponding final settlement instruction. No MTQ
may be minted "just in case" or "for liquidity."

### 2.2.2 Final Settlement Definition

A final settlement is a settlement instruction that has:

1. Passed all compliance checks (KYC, KYB, AML, sanctions).
2. Been translated (not transformed) by the MBG adapter.
3. Been authenticated by the API layer.
4. Passed all eligibility, jurisdiction, and backing verification checks at
   the MITHQAL Core.
5. Passed all bank-specific and system-wide risk checks.
6. Passed the Dynamic Minting Capacity Engine (DMCE) check.
7. Been authorized by the MITHQAL Monetary & Reserve Control Division.
8. Been recorded in the ledger state machine as FINALIZED (not PENDING, not
   AUTHORIZED).
9. Been verified by the finality oracle (where applicable).
10. Been written to the database with the finality proof.

### 2.2.3 Seven-Layer Enforcement

| Layer | Name | Enforcement |
|------:|------|-------------|
| L1 | API | Reject mint request without proof-of-finality token |
| L2 | Workflow | BM-15 finality verification must pass before BM-16 mint |
| L3 | Policy | DMCE + concentration + eligibility + jurisdiction checks hard-fail |
| L4 | Authorization | MITHQAL Monetary Control signed authorization (commercial cannot override) |
| L5 | Ledger State Machine | PENDING → AUTHORIZED → FINALIZED → MINTED; skips rejected |
| L6 | Database TX-State | ACID transaction wraps finality-proof + mint atomically; partial writes roll back |
| L7 | Smart Contract | mint() requires finality oracle signature; TESTNET-deployed |

### 2.2.4 Adversarial Test Result

10 of 10 bypass routes blocked, 0 bypassed, invariant holds. Finality Bypass
Risk: MITIGATED_AT_CODE_LEVEL.

### 2.2.5 Production Readiness

Finality Production Ready: FALSE (pending institutional validation). The
invariant is enforced at code level but not yet validated in production.

## 2.3 Invariant #3 — MITHQAL Does Not Own, Custody, or Financially Guarantee MTQ Backing

> **MITHQAL does not own, custody, or financially guarantee MTQ backing. The
> reserve assets that back MTQ are owned by the participating institutions and
> held by qualified custodians. MITHQAL verifies backing evidence; MITHQAL does
> not take custody of backing assets.**

### 2.3.1 Statement

MITHQAL is non-custodial by default. MITHQAL-held assets = 0 by default.
MITHQAL is not a financial guarantor. MITHQAL does not assume the credit risk
of the participating institutions. MITHQAL does not assume the credit risk of
the custodians. MITHQAL does not assume the market risk of the reserve assets.

### 2.3.2 Reserve Custody Principle

The reserve custody principle is non-custodial by default. The custody
prohibitions are:

1. Custody of reserve assets does NOT move to MITHQAL by default.
2. Customer deposits do NOT move to MITHQAL.
3. Bank reserves do NOT move to MITHQAL.
4. Custodian assets do NOT move to MITHQAL.
5. The Operating Company does NOT operate a vault by default.
6. The Foundation does NOT hold reserve assets.

### 2.3.3 AvailableBackingCertificate Is Evidence, Not Custody

The AvailableBackingCertificate (ABC) is evidence of backing — not a transfer
of assets to MITHQAL. The ABC has 16 fields:

1. backing_id
2. institution_id
3. asset
4. quantity
5. valuation
6. haircut
7. legal_status
8. custodian
9. jurisdiction
10. encumbrance_status
11. allocation_status
12. utilized_amount
13. available_amount
14. evidence
15. verification_timestamp
16. effective_date / expiry

The ABC is a cryptographic attestation from the custodian (and verified by
MITHQAL and possibly an independent third party) that the backing exists and is
available. It is not a transfer of the asset to MITHQAL.

### 2.3.4 Reserve Control & Attestation Framework (RCAF)

The RCAF requires 18 mandatory fields per backing cell. The RCAF is documented
in §V25.0.C.5 of the canonical blueprint. The RCAF enforces:

1. Legal ownership remains with the institution.
2. Custody remains with the qualified custodian.
3. MITHQAL verifies evidence, not custody.
4. The 4-source trust model (Bank + Custodian + MITHQAL + Independent) — minimum
   2 sources required where independent source is feasible.
5. Anti-double-count: Same backing must never support multiple MTQ obligations.

### 2.3.5 Honest State

- `noMithqalOwnedReserve = true`
- `noMithqalFinancialGuarantee = true`
- `protectedBackingModelImplemented = true`
- `protectedBackingLiveCells = 0` (4 SIMULATED reference cells only)

## 2.4 Invariant #4 — PAR-Referenced (Not USD-Pegged)

> **MTQ is PAR-referenced, not USD-pegged. PAR = 1.00 (constitutional unit,
> never repegged, never floated). MTQ is a neutral institutional settlement unit,
> not a USD peg.**

### 2.4.1 Statement

MTQ is referenced to a constitutional unit called PAR. PAR = 1.00. PAR is not a
peg to USD. PAR is not a peg to any sovereign currency. PAR is the constitutional
unit of MTQ settlement value.

The liability L of the MITHQAL system is computed as `L = S × PAR`, where S is
the total MTQ supply. The reserve ratio is computed as `RR = R_a / L`.

### 2.4.2 USD Effective Exposure

The USD effective exposure is the sum of:

- Direct USD weight (currently 20.00%)
- AED-USD-linked equivalent (currently 1.93%)
- SAR-USD-linked equivalent (currently 1.61%)
- USD-linked synthetic (currently 0%)
- USD-linked digital (currently 0%)

Current USD Effective Exposure = 23.54%, below the 35% USD Effective Ceiling.

### 2.4.3 Why Not USD-Pegged

A USD peg would mean:
- MTQ's value tracks USD regardless of reserve composition.
- USD volatility becomes MTQ volatility.
- USD monetary policy becomes MTQ monetary policy.
- The 11-currency diversification is nullified.
- The 35% USD ceiling is meaningless.

This is unconstitutional. MTQ is PAR-referenced; the reserve composition is what
gives MTQ its value, not a peg to any sovereign currency.

### 2.4.4 Nomenclature Discipline

- **DO NOT say:** "USD-backed"
- **DO say:** "PAR-referenced, with a multi-currency reserve including USD"
- **DO NOT say:** "Pegged to USD"
- **DO say:** "Reserve-disciplined settlement unit"
- **DO NOT say:** "USD-pegged stablecoin"
- **DO say:** "Permissioned wholesale settlement instrument"

## 2.5 Invariant #5 — Gold Is the Primary Constitutional Bullion Anchor

> **Gold is the primary constitutional monetary anchor. Bullion is institutionally
> allocated and segregated. Silver is conditional and currently 0%.**

### 2.5.1 Statement

The bullion sleeve of the MITHQAL reserve is anchored by physical gold. Gold
is institutionally allocated and segregated. Gold is not tokenized-gold-substituted
unless explicitly conditional. Gold is not paper-gold. Gold is not unallocated
gold. Gold is allocated physical bullion held by qualified custodians.

### 2.5.2 Gold Policy Parameters

| Parameter | Value |
|-----------|-------|
| Gold target | 18% |
| Gold preferred lower | 15% |
| Gold operational upper zone | 21–22% |
| Bullion corridor | 15% ≤ Bullion ≤ 25% |
| Silver conditional max | 3% |
| Silver current | 0% |

### 2.5.3 Gold Acquisition Workflow

Gold acquisition follows a 16-step workflow that ensures institutional
allocation and segregation. The workflow is documented in §V25.0.D.Q of the
canonical blueprint.

### 2.5.4 Tokenized Gold Treatment

Tokenized gold is a conditional separate exposure, NOT auto-added to the 18%
gold sleeve. Tokenized gold is admitted only when it satisfies:

1. Allocation and segregation are cryptographically verifiable.
2. The issuer is a qualified regulated entity.
3. The token represents direct ownership of allocated physical gold.
4. The token is redeemable for physical gold.

Tokenized gold that fails any of these criteria is not admitted to the reserve.

### 2.5.5 Silver Treatment

Silver is conditional. Silver is currently 0%. Silver may be admitted up to a
conditional maximum of 3% when:

1. Gold is at or above its preferred lower (15%).
2. Silver satisfies the same allocation and segregation requirements as gold.
3. The Operating Company's Monetary & Reserve Control Division approves the
   silver allocation.

## 2.6 Invariant #6 — 80/18/2 Reserve Composition Policy Center

> **The reserve composition policy center is 80% fiat / 18% gold-centered
> bullion / 2% digital liquidity. The operating corridors are 70-85% fiat,
> 15-25% bullion, 0-5% digital.**

### 2.6.1 Statement

The reserve is composed of three sleeves: fiat (80%), bullion (18%), and digital
liquidity (2%). These percentages are the policy center. The operating corridors
allow the sleeves to vary within constitutional bounds: fiat 70-85%, bullion
15-25%, digital 0-5%.

### 2.6.2 Why These Percentages

- **80% fiat:** Provides the liquid, multi-currency diversification needed for
  settlement operations. The 11-currency fiat basket (USD, EUR, CHF, JPY, GBP,
  SGD, AED, SAR, CNY, CAD, AUD) provides broad exposure to the global reserve
  currencies.
- **18% gold:** Provides the constitutional bullion anchor. Gold is the
  monetary anchor that has held value across millennia. The 18% target
  balances the need for monetary stability against the need for liquidity.
- **2% digital:** Provides the operational digital liquidity needed for
  atomic settlement on tokenized rails. The 2% sleeve is deliberately small to
  contain digital-specific risk.

### 2.6.3 Conflict Reconciliation

This invariant resolves four historical conflicts:

| Conflict | Resolution |
|----------|------------|
| RR target (120% vs 130%) | 130% is current controlling target. |
| Reserve sleeve composition (15% gold + 5% tokenized gold + 2.5% digital etc. vs 80/18/2) | 80/18/2 is controlling. Tokenized gold is conditional separate exposure, not auto-added to 18%. |
| Digital liquidity target (3.5% hard-coded vs 2% normal) | 2% is the normal center; individual asset weights are OPTIMIZER OUTPUTS, not hard-coded allocations. |
| Per-currency constitutional cap (60% vs 15%/20%) | 20% is operative hard effective exposure limit. 60% retained only as deeper constitutional sanity cap that can NEVER override the 20% operating limit. |

### 2.6.4 Conflict Resolution Discipline

When a historical configuration conflicts with the current policy center, the
current policy center controls. Historical configurations are traceable but
have no active runtime authority. The conflict reconciliation is documented in
§V25.2.16 of the canonical blueprint.

### 2.6.5 Honest State

- `reserveConfigurationCanonical = true`
- `reserveConfigurationConflicts = false`
- `reservePolicyStatus = CANDIDATE_MODEL_VALIDATION_PENDING`

The 80/18/2 composition is a candidate model pending institutional quantitative
validation. It is the controlling policy center, but it is not yet validated as
production-normative.

## 2.7 Invariant #7 — 130% Institutional Backing Target

> **The institutional backing/coverage policy candidate is 130%. The policy
> floor is 105%. The absolute solvency floor is 100%. These values are
> candidates pending institutional quantitative validation.**

### 2.7.1 Statement

The Reserve Ratio (RR) target is 130%. This means that for every unit of MTQ
liability (L = S × PAR), the adjusted reserve (R_a) should be at least 1.30 × L.
The policy floor is 105%; if RR falls below 105%, the system enters a defensive
state. The absolute solvency floor is 100%; if RR falls below 100%, the system
is constitutionally insolvent and all minting must halt.

### 2.7.2 RR Computation

```
RR = R_a / L
   = Σ_a Q_a · P_a · (1 − H_a) · C_a / (S × PAR)
```

Where:
- Q_a = quantity of asset a
- P_a = market price of asset a
- H_a = haircut applied to asset a
- C_a = structural weight coefficient
- S = total MTQ supply
- PAR = 1.00

### 2.7.3 Design-Time Reference Example

For a liability L = $100,000,000:

| Quantity | Value |
|----------|-------|
| Market Reserve (R_m) | $130,000,000 |
| Adjusted Reserve (R_a) | $122,291,158.24 |
| Stress Reserve (R_l) | $113,672,586.42 |
| Market NAV (NAV_m) | 1.30 |
| Adjusted NAV (NAV_a) | 1.2229 |
| Stress NAV (NAV_s) | 1.1367 |
| Reserve Ratio (RR) | 122.29% (DEFENSIVE — below 130% target, above 105% floor) |
| FSCR | 113.67% (NORMAL) |
| LCR | 130% (ADEQUATE) |

### 2.7.4 Why 130%

The 130% target provides:

1. A 30% buffer above the absolute solvency floor (100%).
2. Resilience to a single currency fall of 20% (RR would drop to ~118.6%, still
   above 100% solvency).
3. Resilience to a gold fall of 20% (RR would drop to ~117.9%, still above 100%
   solvency).
4. Resilience to the digital sleeve going to zero (RR would drop to ~119.8%,
   still above 100% solvency).

### 2.7.5 Honest State

- `RR_target = 130%` (policy candidate)
- `RR_policyFloor = 105%` (policy defensive level)
- `RR_absoluteFloor = 100%` (constitutional; never breachable)
- `RR_current (design-time reference) = 122.29%` (DEFENSIVE)
- `reservePolicyStatus = CANDIDATE_MODEL_VALIDATION_PENDING`

## 2.8 Invariant #8 — 15% Emergency Resilience Capacity Is Separate and Never Double-Counted

> **There is a separate 15% emergency resilience capacity. This capacity is
> separate from the 130% backing target. It is never included in RR computation.
> It is invoked only under explicit emergency governance authorization. It is
> never double-counted.**

### 2.8.1 Statement

The emergency resilience capacity is 15%. It is a separate buffer that is not
included in the adjusted reserve (R_a) used to compute RR. It is held in
highly liquid, high-quality assets (e.g., sovereign bonds, central-bank
reserves). It is invoked only when:

1. RR falls below the 105% policy floor.
2. The Operating Company's Monetary & Reserve Control Division declares an
   emergency.
3. The Foundation's read-only oversight function is notified.
4. The emergency invocation is fully auditable.

### 2.8.2 Anti-Double-Count

The emergency capacity must never be double-counted. It is NOT included in:

1. The 130% RR target.
2. The 80/18/2 composition.
3. The adjusted reserve (R_a).
4. The stress reserve (R_l).
5. The FSCR.
6. The LCR HQLA.

The emergency capacity is a separate buffer that can be deployed only under
emergency conditions.

### 2.8.3 Honest State

- `emergency = 15%` (separate, non-double-counted)
- `RR_current = 122.29%` (does NOT include emergency capacity)
- `FSCR_current = 113.67%` (does NOT include emergency capacity)

## 2.9 Invariant #9 — 20% Hard Effective Concentration Limit

> **The per-currency hard effective exposure limit is 20%. The preferred
> effective limit is 15%. The constitutional sanity ceiling is 60%, retained
> only as a deeper non-overriding cap. The USD effective ceiling is 35%.**

### 2.9.1 Statement

No single currency may exceed 20% of the adjusted reserve. This includes
direct holdings and USD-linked equivalents (AED, SAR). The preferred effective
limit is 15%; the optimizer targets this level when possible. The constitutional
sanity ceiling of 60% is retained only as a deeper sanity cap that can NEVER
override the 20% operating limit.

### 2.9.2 Why 20%

The 20% cap:

1. Diversifies currency risk across the 11-currency basket.
2. Prevents any single sovereign currency from dominating the reserve.
3. Prevents USD dominance (the 35% USD ceiling further constrains USD
   exposure).
4. Aligns with the spirit of the IMF SDR composition discipline.

### 2.9.3 Concentration Dimensions (13)

The 20% cap is one of 13 systemic concentration dimensions:

1. Bank
2. Banking group
3. Country
4. Currency
5. Custodian
6. Correspondent
7. Settlement rail
8. Liquidity provider
9. Stablecoin issuer
10. Technology provider
11. Geopolitical correlation
12. Operational correlation
13. Bank exposure

Each dimension has its own preferred and hard limits. The systemic exposure
engine (§V25.0.D.AE) evaluates all 13 dimensions before any mint is authorized.

### 2.9.4 Concentration Limits

| Dimension | Preferred Effective | Hard Effective |
|-----------|--------------------:|---------------:|
| Currency | 15% | 20% |
| Bank | 15% | 20% |
| Custodian | 15% | 20% |
| Country | 20% | 25% |
| USD Effective | — | 35% |

### 2.9.5 Honest State

- `systemicRiskEngineDesigned = true`
- `systemicRiskEngineImplemented = true`
- `systemicRiskMonitoringLive = false`
- `systemicRiskProductionValidated = false`

## 2.10 Invariant #10 — MTQ Is a Neutral Institutional Settlement Unit

> **MTQ is a neutral institutional settlement unit, not a USD peg, not a
> stablecoin, not a cryptocurrency, not a sovereign currency, not a CBDC, not
> an investment asset. MTQ sits between monetary systems, not instead of
> monetary systems.**

### 2.10.1 Statement

MTQ is a permissioned wholesale settlement instrument. It is used by approved
regulated financial institutions and, where explicitly authorized, central
banks or equivalent sovereign monetary authorities to transfer settlement value
between participating monetary systems. MTQ is neutral: it does not favor one
monetary system over another.

### 2.10.2 Neutrality Doctrine

The neutrality doctrine (§V25.0.6) is immutable:

1. USD remains USD.
2. JPY remains JPY.
3. EUR remains EUR.
4. AED remains AED.
5. CNY remains CNY.
6. CBDCs remain liabilities of their issuing central banks.
7. MTQ does not replace domestic monetary systems.
8. MTQ does not establish monetary policy.
9. MITHQAL does not set sovereign interest rates.
10. MITHQAL does not attempt to displace any sovereign currency.

### 2.10.3 Prohibited Descriptions

MTQ must NEVER be described as:

1. A USD peg
2. A stablecoin
3. A cryptocurrency
4. A sovereign currency
5. A replacement currency
6. A global currency
7. A USD replacement
8. A CBDC replacement
9. An investment asset
10. A speculative instrument

### 2.10.4 Permitted Descriptions

MTQ MUST be described as:

1. A permissioned wholesale settlement instrument
2. A neutral institutional settlement unit
3. A reserve-disciplined settlement instrument
4. A PAR-referenced settlement instrument
5. A gold-anchored settlement instrument
6. A jurisdiction-aware settlement instrument
7. A finality-gated settlement instrument

## 2.11 Invariant #11 — USDT Is Not Normal Core Digital Backing

> **USDT (Tether) is an external interoperability/conversion asset, not current
> core digital backing. USDT is excluded from the core digital reserve.**

### 2.11.1 Statement

USDT is not admitted to the core digital reserve. USDT may be used at the edges
of the MITHQAL settlement network for external interoperability and conversion
purposes only. USDT is not a reserve asset. USDT does not back MTQ issuance.

### 2.11.2 Core Digital Liquidity Universe

The core digital liquidity universe consists of assets that satisfy:

1. DRQS ≥ 7.5 (Core threshold) or DRQS ≥ 6.0 (Conditional threshold)
2. NOT algorithmic
3. NOT USDT

Current core candidates: USDC, USDP, EURC, BUIDL (all currently 0% weight,
target weights are optimizer outputs).

### 2.11.3 Algorithmic Stablecoin Exclusion

Algorithmic stablecoins are EXCLUDED from the core digital reserve. The
exclusion is unconditional. Algorithmic stablecoins include any token whose
value is maintained by an algorithmic mechanism rather than by direct reserve
backing.

### 2.11.4 Honest State

- `algorithmicExcluded = true`
- `USDT in core = false`
- `USDT role = "Excluded from core digital reserve; external conversion only"`

## 2.12 Invariant #12 — Three-Book Economic Separation

> **MITHQAL maintains three economically separated books: Book A (MITHQAL
> Corporate), Book B (Bank MTQ Obligation Ledger), and Book C (Corporate
> Participant Position). Books must reconcile but must NEVER be economically
> commingled.**

### 2.12.1 Statement

The three-book economic separation (§V25.0.D.5) is constitutional. The three
books are:

#### Book A — MITHQAL Corporate (8 fields)
1. Revenue
2. Expenses
3. Payroll
4. Tax
5. Technology costs
6. Corporate assets
7. Corporate liabilities
8. Profit/loss

#### Book B — Bank MTQ Obligation Ledger (8 fields)
1. Responsible bank
2. Applicable backing
3. MTQ originated
4. MTQ outstanding
5. Redemption obligations
6. Liquidity
7. Settlement
8. Bank risk

#### Book C — Corporate Participant Position (9 fields)
1. MTQ balance
2. Available MTQ
3. Reserved MTQ
4. Pending MTQ
5. Sent
6. Received
7. Redemption
8. Settlement history
9. Bank-money linkage

### 2.12.2 Anti-Commingling Tests

Four anti-commingling tests are enforced. ALL must be blocked:

| # | Test | Status |
|---|------|--------|
| 1 | Corporate cash → MTQ backing without authorization | BLOCKED |
| 2 | Bank obligation → MITHQAL corporate revenue | BLOCKED |
| 3 | Corporate MTQ → MITHQAL asset | BLOCKED |
| 4 | Reserve gain → Operating Company revenue | BLOCKED |

### 2.12.3 Honest State

- `threeBookDesign = true`
- `threeBookOperational = false`
- `threeBookEnforced = false`

The three books are designed at code level but not yet operational or enforced
in production. This is honestly disclosed.

## 2.13 Invariant #13 — No Speculative Trading of Reserves

> **Reserve management exists to preserve settlement integrity, not to generate
> speculative profit. Speculative trading, return maximization, market making,
> order books, brokerage, exchange operation, portfolio management for customers,
> derivatives, leverage, and yield farming are PROHIBITED.**

### 2.13.1 Statement

The MITHQAL reserve is not a trading portfolio. It is a settlement backing
pool. The reserve may be rebalanced to maintain the constitutional composition
(80/18/2 within corridors), but it may not be traded for speculative profit.

### 2.13.2 Permitted Reserve Operations

The following reserve operations are permitted:

1. Institutional reserve acquisition/rebalancing necessary to maintain the
   constitutional reserve.
2. Rebalancing to bring the reserve back into the constitutional corridors.
3. Currency lifecycle management (admission, monitoring, suspension, removal,
   re-admission).
4. Gold acquisition (16-step workflow).
5. Redemption of MTQ for sovereign settlement assets.

### 2.13.3 Prohibited Reserve Operations

The following reserve operations are PROHIBITED:

1. Speculative trading
2. Return maximization
3. Market making
4. Order books
5. Brokerage
6. Exchange operation
7. Portfolio management for customers
8. Derivatives
9. Leverage
10. Yield farming

### 2.13.4 No-Trade Principle

The No-Trade Principle (§V25.0.D.R) is constitutional: "Reserve management
exists to preserve settlement integrity, not to generate speculative profit."

### 2.13.5 Honest State

- `noSpeculativeTrading = true`
- `reserveRebalancingOnly = true`

## 2.14 Invariant #14 — No Sanctions or Control Circumvention

> **MITHQAL shall not create any mechanism intended to circumvent sanctions,
> capital controls, payment restrictions, crypto prohibitions, geo-fencing, or
> other jurisdictional requirements.**

### 2.14.1 Statement

MITHQAL respects every jurisdiction's sanctions regime, capital controls,
payment restrictions, crypto prohibitions, geo-fencing, and other jurisdictional
requirements. There is no sanctions circumvention. There is no capital control
circumvention. There is no payment restriction circumvention. There is no
crypto prohibition circumvention. There is no geo-fencing circumvention.

### 2.14.2 Prohibited Circumvention Mechanisms

The following circumvention mechanisms are PROHIBITED:

1. VPN circumvention
2. Alternate routing designed to evade jurisdictional rules
3. Hidden interfaces
4. Indirect access designed to evade law
5. Straw-man participants
6. Shell-company masking
7. Mixed-asset obfuscation
8. Privacy-tech used to evade compliance (privacy-tech used for legitimate
   privacy is permitted; privacy-tech used to evade compliance is prohibited)

### 2.14.3 China Geo-Fence

The China geo-fence is the canonical example of MITHQAL's geo-fencing discipline.
MTQ issuance, settlement, and crypto activity are PROHIBITED in China. The same
approach is implemented for ANY jurisdiction where MTQ issuance, settlement, or
crypto activity is prohibited.

### 2.14.4 Sanctions Screening

Every MTQ transaction is screened against:

1. The UN Security Council Consolidated List
2. The OFAC SDN List
3. The EU Consolidated List
4. The HM Treasury Sanctions List
5. Any other applicable sanctions list

Sanctions screening is performed at the bank level (the bank knows its customer)
and at the MITHQAL Core level (institutional sanctions screening).

### 2.14.5 Honest State

- `noSanctionsCircumvention = true`
- `geoFencingFailClosed = true`
- `chinaGeoFenced = true`

## 2.15 Invariant #15 — Jurisdiction-Specific Authorization Required

> **Each jurisdiction requires explicit licensing and authorization. MITHQAL
> does not claim automatic approval under any jurisdiction's law. MITHQAL does
> not claim exemption from jurisdictional regulation. UNKNOWN status is a
> conservative block — never inferred legal permission.**

### 2.15.1 Statement

Every jurisdiction in which MITHQAL operates requires explicit licensing and
authorization. MITHQAL does not claim automatic approval. MITHQAL does not claim
exemption. MITHQAL does not infer permission from internal labels. UNKNOWN
status is a conservative block.

### 2.15.2 Jurisdiction Status Values

| Status | Action |
|--------|--------|
| ALLOWED | Proceed |
| CONDITIONAL | Require additional review |
| RESTRICTED | Apply restrictions |
| PROHIBITED | BLOCK |
| UNKNOWN | **CONSERVATIVE BLOCK** |

### 2.15.3 Critical Rule

> **UNKNOWN = CONSERVATIVE BLOCK. Never infer legal permission from MITHQAL's
> internal label.**

### 2.15.4 Current Jurisdiction Registry

| Jurisdiction | MTQ Legal | Settlement | Geo-Fenced |
|--------------|-----------|------------|------------|
| US | CONDITIONAL | ALLOWED | No |
| EU | CONDITIONAL | ALLOWED | No |
| AE | CONDITIONAL | ALLOWED | No |
| SG | CONDITIONAL | ALLOWED | No |
| JP | CONDITIONAL | ALLOWED | No |
| GB | CONDITIONAL | ALLOWED | No |
| HK | CONDITIONAL | ALLOWED | No |
| CN | **PROHIBITED** | **PROHIBITED** | **YES** |

### 2.15.5 Honest State

- `validatedJurisdictions = 0`
- `legalOpinionsObtained = false`
- `licensesObtained = 0`

The 8 jurisdictions seeded in the registry are all JURISDICTION_PENDING. Every
legal-nature field is prefixed "PENDING OPINION —". Unknown jurisdictions return
a conservative PENDING placeholder (never null, never invented).

## 2.16 Invariant #16 — No Code-Only Capability Represented as Institutionally Validated

> **No code-only capability may be represented as institutionally validated.
> No technical capability may be represented as legally authorized without
> evidence. No bank relationship may be represented as a bank integration until
> an actual bank integration exists. No reserve claim may be represented as
> verified without institutional evidence.**

### 2.16.1 Statement

Code implementation is necessary but not sufficient for institutional validation.
Code that passes all tests is still not institutionally validated. Code that
passes all tests and is reviewed by MITHQAL is still not institutionally
validated. Code that passes all tests, is reviewed by MITHQAL, and is reviewed
by a friendly auditor is still not institutionally validated.

Institutional validation requires:

1. Independent institutional evidence.
2. Review by a qualified, independent third party.
3. Production of a written institutional review report.
4. Sign-off by the reviewing institution's authorized signatories.

### 2.16.2 Evidence-State Discipline

Every capability must progress through seven evidence states (§2.18). No state
may be skipped. No state may be claimed without the required evidence.

### 2.16.3 Code-Only Capabilities Currently

The following capabilities are implemented at code level but NOT institutionally
validated:

1. Protected Backing Cell (1,133 lines, 4 SIMULATED reference cells)
2. Bank Default & Resolution (1,044 lines, 8 states configured, 11 contractual
   questions PENDING)
3. Legal Liability Framework (724 lines, 8 jurisdictions ALL
   JURISDICTION_PENDING)
4. Licensing/Entity Matrix (784 lines, 72 entries ALL REQUIRED_NOT_OBTAINED)
5. Three-Book Separation (975 lines, 4 anti-commingling tests blocked)
6. Systemic Exposure Engine (1,295 lines, monitoring not live)
7. Finality-Before-Mint (7/7 layers enforced, 10/10 bypass routes blocked)
8. Contradiction Scan (17 patterns scanned, 0 unresolved)
9. Final Reserve Mathematical Specification (1,234 lines, all conflicts reconciled)

Each of these capabilities is honest about its current state. None claims
institutional validation. None claims production readiness. None claims legal
authorization.

### 2.16.4 Honest State

- `honest = true`
- `productionAuthorized = false`
- `noMithqalOwnedReserve = true`
- `noMithqalFinancialGuarantee = true`
- `bankDefaultContractValidated = false`
- `bankDefaultLegalValidated = false`
- `bankDefaultProductionReady = false`

## 2.17 Invariant #17 — No Production Authorization Until All Defined Gates Satisfied

> **No production authorization until the defined legal, licensing, contractual,
> technical, risk, reconciliation and pilot gates are satisfied. All 13
> institutional validation gates must be passed before production authorization
> may be claimed.**

### 2.17.1 Statement

Production authorization is not a MITHQAL decision. It is the outcome of
satisfying all 13 institutional validation gates. Each gate requires independent
institutional evidence. No gate may be self-certified.

### 2.17.2 The 13 Institutional Validation Gates

| # | Gate | Current Status |
|---|------|----------------|
| 1 | Legal opinions obtained (per jurisdiction) | 0 of 8 jurisdictions |
| 2 | Required licenses obtained (per jurisdiction × activity) | 0 of 72 entries |
| 3 | Bank contracts signed | 0 signed |
| 4 | Custodian contracts signed | 0 signed |
| 5 | Asset contracts signed | 0 signed |
| 6 | Live oracle feeds activated | 0 live |
| 7 | Three-book separation operational & enforced | Designed, not operational/enforced |
| 8 | Systemic risk monitoring live | Designed & implemented, not live |
| 9 | Protected backing live cells | 0 live (4 SIMULATED reference) |
| 10 | Bank default contract validated | Pending |
| 11 | Bank default legal framework validated | Pending |
| 12 | Reserve policy model validated | CANDIDATE_MODEL_VALIDATION_PENDING |
| 13 | Finality production ready | FALSE (pending institutional validation) |

### 2.17.3 Honest State

- `institutionalValidationGatesPassed = 0 of 13`
- `productionAuthorized = false`
- `finalStatus = APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED`

### 2.17.4 Gate Discipline

Each gate has its own evidence requirement. No gate may be marked passed
without the required evidence in hand. The evidence must be:

1. Produced by an independent, qualified third party.
2. Reviewed and signed by the reviewing institution's authorized signatories.
3. Archived in the MITHQAL evidence ledger.
4. Available for inspection by the Foundation's read-only oversight function.

## 2.18 Evidence-State Discipline (7 States)

Every MITHQAL capability must progress through seven evidence states. No state
may be skipped. No state may be claimed without the required evidence.

### 2.18.1 The Seven Evidence States

| # | State | Meaning |
|---|-------|---------|
| 1 | DESIGNED | The capability is designed and documented. No code exists yet. |
| 2 | IMPLEMENTED | The capability is implemented in code. Code passes internal unit tests. |
| 3 | INTEGRATED | The capability is integrated with other MITHQAL capabilities. Integration tests pass. |
| 4 | TESTED | The capability passes adversarial tests. Bypass tests, contradiction scans, and stress tests are clean. |
| 5 | SANDBOX_VALIDATED | The capability is validated in a sandbox environment with synthetic data. Sandbox validation does not authorize production. |
| 6 | INSTITUTIONALLY_VALIDATED | The capability is validated by an independent qualified institution. Institutional validation evidence is in hand. |
| 7 | PRODUCTION_READY | The capability is ready for production deployment. All gates are passed. |

### 2.18.2 State Discipline

- **DESIGNED → IMPLEMENTED:** Requires code that compiles and passes unit tests.
- **IMPLEMENTED → INTEGRATED:** Requires integration with other capabilities and passing integration tests.
- **INTEGRATED → TESTED:** Requires adversarial test passing, including bypass tests, contradiction scans, and stress tests.
- **TESTED → SANDBOX_VALIDATED:** Requires sandbox testing with synthetic data. Sandbox validation does not authorize production.
- **SANDBOX_VALIDATED → INSTITUTIONALLY_VALIDATED:** Requires independent institutional evidence. This is the first state that requires a third party.
- **INSTITUTIONALLY_VALIDATED → PRODUCTION_READY:** Requires all 13 institutional validation gates to be passed.

### 2.18.3 Current State of Each Capability

| Capability | Design | Impl | Integ | Test | Sandbox | Inst. Val. | Prod Ready |
|------------|:------:|:----:|:-----:|:----:|:-------:|:----------:|:----------:|
| Protected Backing Cell | ✓ | ✓ | ✓ | ✓ | SIMULATED | LEGAL_PEND | DESIGNED |
| Bank Default & Resolution | ✓ | ✓ | ✓ | ✓ | SIMULATED | CONTRACT_PEND | DESIGNED |
| Legal Liability Framework | ✓ | ✓ | ✓ | ✓ | SIMULATED | LEGAL_PEND | DESIGNED |
| Licensing/Entity Matrix | ✓ | ✓ | ✓ | ✓ | SIMULATED | LICENSING_PEND | DESIGNED |
| Three-Book Separation | ✓ | ✓ | ✓ | ✓ | SIMULATED | CONTRACT_PEND | DESIGNED |
| Systemic Exposure Engine | ✓ | ✓ | ✓ | ✓ | SIMULATED | MODEL_PEND | DESIGNED |
| Finality-Before-Mint | ✓ | ✓ | ✓ | ✓ | TESTNET | CONTRACT_PEND | DESIGNED |
| Contradiction Scan | ✓ | ✓ | ✓ | ✓ | — | DESIGNED | DESIGNED |
| Final Reserve Math Spec | ✓ | ✓ | ✓ | ✓ | SIMULATED | MODEL_PEND | DESIGNED |

The Finality-Before-Mint capability is at the TESTNET sandbox state — the only
capability that has progressed to on-chain testnet deployment. No capability
has progressed to INSTITUTIONALLY_VALIDATED.

### 2.18.4 State Discipline Enforcement

The state of each capability is enforced by:

1. The Implementation Status Report (`src/lib/implementation-status-report.ts`)
2. The §87 status report (§V25.2.AUDIT-CLOSURE.9)
3. The §74 honest state declaration (§V25.2.AUDIT-CLOSURE.10)
4. The Foundation's read-only oversight function

No capability may claim a higher state than its true state. The state is
binding on all internal and external communications.

## 2.19 Current Honest State — Full §74 Declaration

The following is the full §74 honest state declaration. Every field is binding.
Every `false` is binding. Every `0` is binding. No field may be inflated,
rounded, or represented as anything other than its true value.

```
# ============================================================================
# §74 HONEST STATE DECLARATION — FULL
# ============================================================================

# Overall honesty
honest                                  = true
productionAuthorized                    = false

# Reserve ownership
noMithqalOwnedReserve                   = true
noMithqalFinancialGuarantee             = true

# Three-book separation
threeBookDesign                         = true
threeBookOperational                    = false
threeBookEnforced                       = false

# Systemic risk
systemicRiskEngineDesigned              = true
systemicRiskEngineImplemented          = true
systemicRiskMonitoringLive             = false
systemicRiskProductionValidated        = false

# Finality
finalityPolicyDefined                   = true
finalityLayersDesigned                  = 7
finalityLayersRequired                  = 7
finalityLayersEnforced                  = 7
finalityProductionReady                 = false
finalityBypassRisk                      = MITIGATED_AT_CODE_LEVEL

# Legal
legalRegistryImplemented                = true
legalOpinionsObtained                   = false
validatedJurisdictions                  = 0

# Licensing
licensingMatrixImplemented              = true
licensesObtained                        = 0

# Bank default
bankDefaultStateModelDesigned           = true
bankDefaultOperationalWorkflow          = true
bankDefaultContractValidated            = false
bankDefaultLegalValidated              = false
bankDefaultProductionReady              = false

# Protected backing
protectedBackingModelImplemented        = true
protectedBackingLiveCells              = 0

# Reserve configuration
reserveConfigurationCanonical           = true
reserveConfigurationConflicts           = false
reservePolicyStatus                     = CANDIDATE_MODEL_VALIDATION_PENDING

# Design-time specification
designTimeSpec                          = true
liveOracleFeeds                        = false
bankContracted                          = false
providerContracted                     = false
assetContracted                         = false

# Final status
finalStatus                             = APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
finalStatusColor                        = AMBER

# Acceptance criteria (§87/§90)
acceptanceCriteriaTotal                 = 23
acceptanceCriteriaMet                   = 19
acceptanceCriteriaPct                   = 83%

# Institutional validation gates (§91)
institutionalValidationGatesTotal       = 13
institutionalValidationGatesPassed     = 0

# Contradiction scan (§77)
contradictionPatternsTotal              = 17
contradictionPatternsUnresolved         = 0

# Finality bypass tests (§54/§84)
finalityBypassRoutesTotal               = 10
finalityBypassRoutesBlocked             = 10
finalityBypassRoutesBypassed            = 0
finalityInvariantHolds                  = true
```

### 2.19.1 Field-by-Field Explanation

#### honest = true
MITHQAL discloses its true state. Every disclosure in this blueprint is honest.
No claim is inflated. No claim is implied. No claim is suggested.

#### productionAuthorized = false
MITHQAL is NOT authorized for production deployment. No MTQ has been minted in
production. No real bank is contracted. No real custodian is contracted. No real
asset is contracted.

#### noMithqalOwnedReserve = true
MITHQAL does not own reserve assets. The reserve assets that back MTQ are owned
by the participating institutions and held by qualified custodians. MITHQAL
verifies backing evidence; MITHQAL does not take custody of backing assets.

#### noMithqalFinancialGuarantee = true
MITHQAL is not a financial guarantor. MITHQAL does not assume the credit risk
of the participating institutions. MITHQAL does not assume the credit risk of
the custodians. MITHQAL does not assume the market risk of the reserve assets.

#### threeBookDesign = true
The three-book economic separation is designed at code level. The three books
(MITHQAL Corporate, Bank MTQ Obligation Ledger, Corporate Participant Position)
are implemented with their full field sets.

#### threeBookOperational = false
The three-book separation is not yet operational. It is implemented but not
deployed in production.

#### threeBookEnforced = false
The three-book separation is not yet enforced. The four anti-commingling tests
are blocked at code level, but they are not yet enforced in production.

#### systemicRiskEngineDesigned = true
The systemic exposure engine (13 dimensions) is designed at code level.

#### systemicRiskEngineImplemented = true
The systemic exposure engine is implemented in code. It can evaluate all 13
concentration dimensions.

#### systemicRiskMonitoringLive = false
The systemic risk monitoring is not live. The engine exists, but it is not
receiving live institutional data.

#### systemicRiskProductionValidated = false
The systemic risk engine has not been validated in production.

#### finalityPolicyDefined = true
The finality policy is defined: NO FINAL SETTLEMENT ⇒ NO MTQ MINT.

#### finalityLayersDesigned = 7
Seven finality enforcement layers are designed.

#### finalityLayersRequired = 7
Seven finality enforcement layers are required (constitutional minimum).

#### finalityLayersEnforced = 7
All seven finality enforcement layers are enforced at code level. This was
previously 3; it is now 7 of 7 at code level.

#### finalityProductionReady = false
The finality enforcement is not yet ready for production. It is enforced at
code level but not yet validated in production.

#### finalityBypassRisk = MITIGATED_AT_CODE_LEVEL
The finality bypass risk is mitigated at the code level. This was previously
HIGH; it is now MITIGATED_AT_CODE_LEVEL. The risk remains HIGH at the production
gate until institutional validation.

#### legalRegistryImplemented = true
The legal liability framework registry is implemented at code level. Eight
jurisdictions are seeded.

#### legalOpinionsObtained = false
No legal opinions have been obtained. Every legal-nature field is prefixed
"PENDING OPINION —".

#### validatedJurisdictions = 0
Zero jurisdictions have been validated. All 8 seeded jurisdictions are
JURISDICTION_PENDING.

#### licensingMatrixImplemented = true
The licensing/entity matrix is implemented at code level. 72 entries are
seeded (9 activities × 8 jurisdictions).

#### licensesObtained = 0
Zero licenses have been obtained. All 72 entries are REQUIRED_NOT_OBTAINED.

#### bankDefaultStateModelDesigned = true
The bank default state model is designed at code level. Eight states are fully
configured (ACTIVE → RESTRICTED → LIQUIDITY_STRESS → SUSPENDED → DEFAULT →
INSOLVENT → RESOLUTION → EXIT).

#### bankDefaultOperationalWorkflow = true
The bank default operational workflow is implemented. For each state, 9
behaviors are defined.

#### bankDefaultContractValidated = false
The bank default contracts have not been validated. The 11 contractual questions
are all PENDING.

#### bankDefaultLegalValidated = false
The bank default legal framework has not been validated.

#### bankDefaultProductionReady = false
The bank default framework is not yet ready for production.

#### protectedBackingModelImplemented = true
The protected backing cell model is implemented at code level. The 17-field
schema is complete. The AvailableBacking formula is implemented. Anti-double-count
is enforced.

#### protectedBackingLiveCells = 0
Zero protected backing cells are live. Only 4 SIMULATED reference cells exist.

#### reserveConfigurationCanonical = true
The reserve configuration is canonical. There are no unresolved configuration
conflicts.

#### reserveConfigurationConflicts = false
There are no configuration conflicts. All four historical conflicts have been
reconciled.

#### reservePolicyStatus = CANDIDATE_MODEL_VALIDATION_PENDING
The reserve policy is a candidate model pending institutional quantitative
validation. The 130% target, 80/18/2 composition, 20% cap, 35% USD ceiling, and
15% emergency capacity are policy candidates, not yet validated as
production-normative.

#### designTimeSpec = true
This blueprint is a design-time specification.

#### liveOracleFeeds = false
No live oracle feeds are activated. All reserve inputs (COFER shares, FX prices,
gold spot, DRQS scores) are policy reference values for design-time demonstration.

#### bankContracted = false
No real bank is contracted.

#### providerContracted = false
No real provider is contracted.

#### assetContracted = false
No real asset is contracted.

#### finalStatus = APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
This is the binding final status of MITHQAL.

#### finalStatusColor = AMBER
The status color is AMBER (not GREEN, not RED).

#### acceptanceCriteriaTotal = 23
There are 23 defined acceptance criteria.

#### acceptanceCriteriaMet = 19
Nineteen of 23 acceptance criteria are met (83%). This is honestly reported,
no inflation.

#### institutionalValidationGatesTotal = 13
There are 13 institutional validation gates.

#### institutionalValidationGatesPassed = 0
Zero of 13 institutional validation gates have been passed. All are pending.

#### contradictionPatternsTotal = 17
There are 17 contradiction patterns scanned.

#### contradictionPatternsUnresolved = 0
Zero contradiction patterns are unresolved. Four occurrences were found; all
four were false positives (prohibition/honest-state context).

#### finalityBypassRoutesTotal = 10
Ten finality bypass routes were tested.

#### finalityBypassRoutesBlocked = 10
All ten bypass routes were blocked.

#### finalityBypassRoutesBypassed = 0
Zero bypass routes were bypassed.

#### finalityInvariantHolds = true
The finality invariant (NO FINAL SETTLEMENT ⇒ NO MTQ MINT) holds.

## 2.20 Conflict Resolution Discipline

When a historical configuration conflicts with the current policy center, the
current policy center controls. Historical configurations are traceable but
have no active runtime authority.

### 2.20.1 The Four Reconciled Conflicts

| Conflict ID | Conflict | Older Position | Controlling Position | Resolution |
|-------------|----------|----------------|----------------------|------------|
| Conflict-1 | Reserve Ratio target | RR = 120% | RR = 130% | Implement 130% as current strategic target. Older 120% treated as historical/non-controlling. |
| Conflict-2 | Reserve sleeve composition | 15% gold + 5% tokenized gold + 2.5% digital etc. (detailed Portfolio-B table) | 80% fiat / 18% gold / 2% digital | Implement 80/18/2 as controlling. Do NOT implement both. Tokenized gold is conditional separate exposure, not auto-added to 18%. |
| Conflict-3 | Digital liquidity target | USDC 2% + USDP 0.5% + EURC 0.5% + BUIDL 0.5% = 3.5% | Digital normal = 2% | 2% is the normal center; individual asset weights are OPTIMIZER OUTPUTS, not hard-coded allocations. |
| Conflict-4 | Per-currency constitutional cap | 60% per-currency ceiling | Preferred effective = 15%, Hard effective = 20% | 20% is the operative hard effective exposure limit. Old 60% retained ONLY as deeper constitutional sanity cap that can NEVER override the 20% operating limit. |

### 2.20.2 Resolution Principles

The conflict resolution discipline is governed by 50 reconciliation principles
(§V25.0.D.B). Key principles include:

1. **P1 — Current policy controls.** When historical and current configurations
   conflict, the current configuration is controlling.
2. **P2 — Historical is traceable.** Historical configurations remain in the
   blueprint for traceability but have no active runtime authority.
3. **P3 — No double implementation.** Do NOT implement both the historical and
   current configurations; implement only the current configuration.
4. **P4 — Tokenized gold is conditional.** Tokenized gold is a conditional
   separate exposure, not auto-added to the 18% gold sleeve.
5. **P5 — Asset weights are optimizer outputs.** Individual asset weights are
   computed by the optimizer, not hard-coded.
6. **P6 — The 60% sanity ceiling is non-overriding.** The 60% per-currency
   ceiling is retained only as a deeper constitutional sanity cap that can
   NEVER override the 20% operating limit.
7. **P7 — Historical parameters may be referenced.** Historical parameters may
   be referenced in design discussions, but they may not be implemented.

### 2.20.3 Honest State

- `reserveConfigurationCanonical = true`
- `reserveConfigurationConflicts = false`

All four historical conflicts have been reconciled. The current policy center
is controlling. Historical configurations are traceable but have no active
runtime authority.

## 2.21 Authority Matrix Summary

The MITHQAL authority matrix defines the canonical ownership of every
architectural function. There is no ambiguous ownership. There is no overlap.
There is no gap.

### 2.21.1 The Seven Actors

| # | Actor | Role |
|---|-------|------|
| 1 | Founder Shareholders | Provide initial capitalization; receive dividends; shareholder governance |
| 2 | MITHQAL Holding | Owns 100% of subsidiaries; holds corporate enterprise value; corporate governance |
| 3 | MITHQAL Operating Company | Operates MBG; bank relationships; reconciliation; compliance; Monetary & Reserve Control Division |
| 4 | MITHQAL Technology Company | Owns MITHQAL Core; MBG software; APIs; security; IP |
| 5 | MITHQAL Foundation | READ-ONLY aggregate oversight; constitutional preservation |
| 6 | Sponsor Bank (Class B) | Requests MTQ issuance; provides customer KYC; provides backing evidence |
| 7 | Custodian | Holds reserve assets; provides custody evidence |

### 2.21.2 The Seventeen Functions

| # | Function | Owner |
|---|----------|-------|
| 1 | Mint MTQ | Technology Company (canonical ledger) |
| 2 | Authorize MTQ issuance | Operating Company (Monetary & Reserve Control Division) |
| 3 | Request MTQ issuance | Sponsor Bank (Class B) |
| 4 | Hold customer deposits | Sponsor Bank |
| 5 | Hold reserve assets | Custodian |
| 6 | Verify backing evidence | Operating Company (Monetary & Reserve Control Division) |
| 7 | Set monetary policy | NO ACTOR (sovereign prerogative) |
| 8 | Set sovereign interest rates | NO ACTOR (sovereign prerogative) |
| 9 | Override canonical monetary rules | NO ACTOR (constitutional) |
| 10 | Authorize emergency capacity invocation | Operating Company + Foundation (joint) |
| 11 | Publish constitutional reports | Foundation |
| 12 | Operate MBG software | Technology Company |
| 13 | Operate MBG institutional side | Operating Company |
| 14 | Receive dividends | Holding (from Operating/Technology Co) → Founder Shareholders |
| 15 | Receive corporate enterprise value | Holding |
| 16 | Receive customer funds | Sponsor Bank (NEVER MITHQAL) |
| 17 | Receive reserve assets | Custodian (NEVER MITHQAL by default) |

### 2.21.3 Authority Separation Discipline

The authority matrix enforces strict separation of duties:

- The actor that requests MTQ issuance (Sponsor Bank) is not the actor that
  authorizes MTQ issuance (Operating Company's Monetary & Reserve Control
  Division).
- The actor that authorizes MTQ issuance is not the actor that executes the
  mint (Technology Company's canonical ledger).
- The actor that holds customer deposits (Sponsor Bank) is not the actor that
  holds reserve assets (Custodian).
- The actor that holds reserve assets (Custodian) is not the actor that
  verifies backing evidence (Operating Company).
- The actor that owns corporate enterprise value (Holding) is not the actor
  that operates the business (Operating Company, Technology Company).
- The actor that provides constitutional oversight (Foundation) is read-only
  and cannot mint, authorize, buy, sell, transfer, or override.

### 2.21.4 No Contradictory Authority

The following phrases are PROHIBITED in MITHQAL communications:

1. "MITHQAL mints MTQ at its discretion."
2. "The Foundation authorizes MTQ issuance."
3. "The Holding Company holds reserve assets."
4. "The Technology Company has financial authority."
5. "The Operating Company trades reserves for profit."
6. "MITHQAL holds customer deposits."
7. "MITHQAL is a financial guarantor."
8. "MITHQAL sets monetary policy."
9. "MITHQAL overrides canonical monetary rules."
10. "MITHQAL receives customer funds."
11. "MITHQAL holds reserve assets by default."
12. "MITHQAL has a discretionary mint authority."
13. "Historical reserve parameters override current policy."

### 2.21.5 Authority Matrix Honest State

- `authorityMatrix = 7 × 17` (7 actors × 17 functions, no ambiguous ownership)
- `mintAuthoritySeparated = true` (ISSUANCE_REQUEST → ISSUANCE_AUTHORIZATION → MINT_EXECUTION)
- `commercialCannotOverridePolicy = true`
- `foundationReadOnly = true`

---

# SECTION 3 — WHAT MITHQAL IS

## 3.0 Section Purpose

This section defines what MITHQAL is, in positive terms. Where Section 4
defines what MITHQAL is NOT, this section defines what MITHQAL IS. The two
sections are complementary: together, they establish the precise identity of
MITHQAL, distinguish it from every adjacent financial architecture, and
provide the canonical language that every internal and external communication
must use.

This section is the canonical reference for:

1. The definition of MITHQAL.
2. The ten things MITHQAL does.
3. The three-actor rule.
4. The full settlement flow diagram.
5. The architectural node inventory.
6. The canonical cross-border flow.
7. A worked example corridor.
8. The five-way reconciliation model.
9. The settlement finality model.
10. The three-book economic separation.

## 3.1 Canonical Definition

> **MITHQAL is a Constitutional Monetary and Institutional Settlement
> Infrastructure. It is a neutral wholesale institutional settlement
> infrastructure connecting regulated monetary systems across jurisdictions.
> MTQ is a permissioned wholesale settlement instrument used by authorized
> regulated financial institutions and, where explicitly permitted, central
> banks or sovereign monetary authorities. MTQ does not replace, compete with,
> or become a substitute for sovereign currencies or central-bank money.
> MITHQAL provides the neutral settlement layer between participating monetary
> systems, combining digital settlement speed with institutional traceability,
> compliance and cryptographic auditability. Customer-level KYC/KYB is
> primarily performed by regulated participating institutions, while MITHQAL
> governs institutional authorization, settlement integrity, jurisdictional
> controls and immutable settlement records. No MTQ may be issued without
> constitutionally verified reserve backing, and no participant or governance
> body may exercise discretionary monetary issuance authority.**

### 3.1.1 Definition Decomposition

The canonical definition contains nine binding assertions. Each is non-negotiable.

#### Assertion 1 — Constitutional
MITHQAL is constitutional. It is governed by a set of non-negotiable invariants
(Section 2 of this blueprint). The constitution is not a code of conduct; it is
the set of architectural constraints that distinguish MITHQAL from adjacent
financial architectures.

#### Assertion 2 — Monetary
MITHQAL is monetary. It deals with monetary value, monetary settlement, and
monetary reserves. It does not deal with securities settlement, commodities
trading, or trade finance. It is a monetary settlement infrastructure.

#### Assertion 3 — Institutional
MITHQAL is institutional. It serves regulated financial institutions, not
retail customers. It serves central banks (where explicitly authorized), not
individuals. It serves sovereign monetary authorities, not speculators.

#### Assertion 4 — Settlement Infrastructure
MITHQAL is settlement infrastructure. It is not a currency, not a platform, not
a bank, not an exchange. It is the infrastructure through which regulated
financial institutions settle value across jurisdictions.

#### Assertion 5 — Neutral
MITHQAL is neutral. It does not favor one monetary system over another. It
does not favor one jurisdiction over another. It does not favor one geopolitical
bloc over another.

#### Assertion 6 — Wholesale
MITHQAL is wholesale. It does not serve retail customers. It does not process
retail payments. It serves regulated financial institutions at the wholesale
level.

#### Assertion 7 — Cross-Jurisdictional
MITHQAL is cross-jurisdictional. It connects monetary systems across
jurisdictions. It respects every jurisdiction's regulatory perimeter. It
geo-fences jurisdictions where MTQ issuance, settlement, or crypto activity is
prohibited.

#### Assertion 8 — Reserve-Disciplined
MITHQAL is reserve-disciplined. No MTQ may be issued without constitutionally
verified reserve backing. The reserve architecture is governed by the 130%
backing target, the 80/18/2 composition, the 20% concentration cap, the 35%
USD ceiling, the gold anchor, and the non-custodial default.

#### Assertion 9 — Cryptographically Auditable
MITHQAL is cryptographically auditable. Every MTQ transaction is
institutionally attributable. Every reserve claim is cryptographically
verifiable. Every mint is gated by a seven-layer finality enforcement stack.

### 3.1.2 MTQ Canonical Definition

MTQ is the permissioned wholesale settlement instrument used within the MITHQAL
settlement infrastructure. MTQ IS:

- Neutral (across monetary systems, jurisdictions, geopolitical blocs)
- Wholesale (institutional, not retail)
- Settlement-focused (a settlement instrument, not a currency, not an
  investment)
- Reserve-disciplined (issued only against verified reserve backing)
- Auditable (cryptographically attributable)
- Cryptographically secured (every transaction is signed and verified)
- Institutionally traceable (every transaction has a 14-field settlement record)
- Interoperable (across CBDCs, tokenized deposits, bank money, payment rails)
- PAR-referenced (not USD-pegged)
- Gold-anchored (gold is the primary constitutional bullion anchor)
- Jurisdiction-aware (every transaction is jurisdictionally cleared)
- Finality-gated (no MTQ minted without final settlement)

MTQ IS NOT:

- A retail stablecoin
- A consumer payment coin
- A replacement for USD/JPY/EUR/AED or any sovereign currency
- A CBDC
- A sovereign liability
- An investment product
- An exchange-traded speculative instrument
- A USD-pegged token
- An algorithmic stablecoin
- A yield-bearing instrument

### 3.1.3 Required Final Blueprint Statement

The following statement is required to appear, verbatim, in every MITHQAL
blueprint, whitepaper, institutional engagement document, and external
communication that describes MITHQAL:

> **MITHQAL is a neutral wholesale settlement infrastructure connecting
> regulated monetary systems. MTQ is a permissioned wholesale settlement
> instrument used by authorized regulated financial institutions and, where
> explicitly permitted, central banks or sovereign monetary authorities. MTQ
> does not replace, compete with, or become a substitute for sovereign
> currencies or central-bank money. MITHQAL provides the neutral settlement
> layer between participating monetary systems, combining digital settlement
> speed with institutional traceability, compliance and cryptographic
> auditability. Customer-level KYC/KYB is primarily performed by regulated
> participating institutions, while MITHQAL governs institutional authorization,
> settlement integrity, jurisdictional controls and immutable settlement records.
> No MTQ may be issued without constitutionally verified reserve backing, and
> no participant or governance body may exercise discretionary monetary
> issuance authority.**

## 3.2 The Ten Things MITHQAL Does

MITHQAL does ten things. It does not do anything else. Any capability outside
these ten things is unconstitutional.

### 3.2.1 MITHQAL Defines Eligibility

MITHQAL defines which institutions are eligible to participate in the MITHQAL
settlement network. Eligibility is determined by:

1. Regulatory license (Class B banks, Class C regulated financial institutions)
2. Jurisdiction (the institution's jurisdiction must be ALLOWED or CONDITIONAL)
3. Sanctions status (the institution must be CLEAR)
4. Operational status (the institution must be ACTIVE)
5. Authorization (the institution must have a valid authorization record)

MITHQAL does NOT define which customers are eligible. Customer eligibility is
determined by the participating institution (the bank knows its customer).

### 3.2.2 MITHQAL Verifies Evidence

MITHQAL verifies backing evidence. MITHQAL does NOT custody backing assets
(non-custodial by default). MITHQAL verifies:

1. The AvailableBackingCertificate (16 fields) provided by the bank
2. The custody attestation provided by the custodian
3. The institutional authorization record
4. The jurisdiction classification
5. The sanctions status
6. The exposure/concentration compliance

MITHQAL uses a 4-source trust model (Bank + Custodian + MITHQAL + Independent).
Minimum 2 sources are required where independent source is feasible. No single
source of truth.

### 3.2.3 MITHQAL Calculates Issuance Capacity

MITHQAL calculates the Dynamic Minting Capacity Engine (DMCE) value for each
mint request. DMCE = MIN of:

1. VerifiedEligibleBacking
2. LegallyReservedBacking
3. InstitutionalRiskLimit
4. LiquidityLimit
5. JurisdictionLimit
6. ExposureLimit
7. ConcentrationLimit
8. OperationalLimit

DMCE is the canonical policy/control concept. It is not a fixed legal formula
until independently validated. The mint amount cannot exceed DMCE.

### 3.2.4 MITHQAL Authorizes Issuance

MITHQAL authorizes MTQ issuance through the Monetary & Reserve Control Division
of the Operating Company. This division is operationally separated from
commercial bank relationship management. Commercial staff cannot approve reserve
sufficiency for their own bank clients.

The authorization is granted only after all of the following checks pass:

1. Eligibility check
2. Jurisdiction check
3. Backing verification
4. Bank-specific risk assessment
5. System-wide concentration check
6. DMCE check
7. Finality verification

### 3.2.5 MITHQAL Executes Deterministic Mint

MITHQAL executes a deterministic mint through the canonical ledger (operated
by the Technology Company). The mint is:

1. Deterministic (same inputs → same outputs)
2. Idempotent (a unique CTID — correlated transaction ID — prevents duplicate
   mints)
3. Atomic (mint + finality proof are written atomically in an ACID database
   transaction)
4. Append-only (the ledger state machine is append-only)
5. Finality-gated (the mint cannot occur without final settlement)

### 3.2.6 MITHQAL Maintains the Ledger State Machine

MITHQAL maintains the canonical MTQ ledger state machine. The state machine
is:

- PENDING → AUTHORIZED → FINALIZED → MINTED

Skips are rejected. The state machine is append-only. The state machine is
enforced by the L5 ledger state machine finality enforcement layer.

### 3.2.7 MITHQAL Enforces Jurisdictional Controls

MITHQAL enforces jurisdictional controls through the Jurisdictional Regulatory
Perimeter Engine (§V25.0.15). For each jurisdiction, 19 classifications are
evaluated:

1. MTQ legal status
2. Issuance
3. Settlement
4. Custody
5. Redemption
6. Payment services
7. Stablecoin
8. ART/RWA
9. Securities
10. Commodity
11. Financial market
12. AML/CFT
13. Sanctions
14. Data privacy
15. Cross-border transfer
16. Capital controls
17. Tax/accounting
18. Licensing
19. Institutional eligibility

UNKNOWN status is a conservative block. Geo-fencing is fail-closed.

### 3.2.8 MITHQAL Provides Institutional Traceability

MITHQAL provides institutional traceability through the 14-field Settlement
Record Schema:

1. institutionalSender
2. institutionalReceiver
3. transactionId (idempotent CTID)
4. timestamp (ISO 8601)
5. mtqAmount
6. settlementState
7. authorizationState
8. complianceState
9. reserveReference
10. cryptographicHash
11. validatorSignature
12. ledgerCommitment
13. jurisdiction
14. settlementChannel
15. finalityStatus (PENDING / TECHNICAL_FINAL / LEGAL_FINAL / BANKING_FINAL)

The six-hop trace path is:
```
Customer → Bank Account Transaction ID → Bank Institutional Settlement ID →
MITHQAL Settlement ID → MTQ Transaction Hash → Receiving Bank Settlement ID →
Beneficiary Account
```

### 3.2.9 MITHQAL Operates the Five-Way Reconciliation

MITHQAL operates the five-way reconciliation model:

1. Bank subledger (what the bank attributes to corporate customers)
2. Reserve backing evidence (AvailableBackingCertificate from custodian)
3. Custodian evidence (custody attestation)
4. Canonical ledger (what MTQ actually exists, on-chain)
5. Proof of liabilities (institutional positions)

Reconciliation has 7 states:

1. VERIFIED (all 5 sources agree)
2. WARNING (minor discrepancy, within tolerance)
3. MISMATCH (discrepancy exceeds tolerance)
4. CRITICAL (severe discrepancy, escalation required)
5. EXPIRED (evidence is stale)
6. UNAVAILABLE (evidence is missing)
7. LOCKED (reconciliation is frozen pending investigation)

### 3.2.10 MITHQAL Provides Cryptographic Settlement Finality

MITHQAL provides cryptographic settlement finality through the seven-layer
finality enforcement stack:

1. L1 — API layer (rejects requests without proof-of-finality token)
2. L2 — Workflow engine (BM-15 must pass before BM-16)
3. L3 — Policy engine (DMCE + concentration + eligibility + jurisdiction)
4. L4 — MITHQAL Monetary Authorization (signed authorization, commercial
   cannot override)
5. L5 — Ledger State Machine (PENDING → AUTHORIZED → FINALIZED → MINTED)
6. L6 — Database TX-State Protection (ACID transaction wraps mint + finality
   proof atomically)
7. L7 — Smart Contract (mint() requires finality oracle signature)

Settlement finality states:

1. PENDING (settlement initiated, not yet final)
2. TECHNICAL_FINAL (technical settlement complete, legal/banking finality
   pending)
3. LEGAL_FINAL (legal settlement complete, banking finality pending)
4. BANKING_FINAL (full settlement finality — irreversible, atomic)

## 3.3 The Three-Actor Rule

> **Bank requests. MITHQAL authorizes. Technical system executes.**

### 3.3.1 Statement

The three-actor rule is the canonical mint authority separation. Three distinct
actors participate in every MTQ mint, each with a distinct role:

| Actor | Role | Cannot Do |
|-------|------|-----------|
| Bank (Class B/C) | Requests MTQ issuance via MBG | Cannot authorize its own request; cannot execute the mint |
| MITHQAL Monetary & Reserve Control Division (Operating Co, separated) | Authorizes MTQ issuance based on DMCE + 7 checks | Cannot execute the mint; cannot request issuance for its own commercial clients |
| Canonical Ledger (Technology Co) | Executes deterministic mint atomically with finality proof | Cannot authorize issuance; cannot initiate a mint |

### 3.3.2 Why Three Actors

The three-actor rule prevents any single actor from controlling both the request
and the authorization of a mint. This is the canonical mint authority separation
(P24 in the 50 reconciliation principles).

If the bank could authorize its own request, the bank could mint unlimited MTQ.
If the Operating Company's commercial staff could authorize issuance for their
own bank clients, the Operating Company could mint MTQ to inflate its own
revenue. If the canonical ledger could initiate a mint, the ledger could mint
MTQ without authorization.

The three-actor rule prevents all three failure modes.

### 3.3.3 Mint Authority Separation Stages

The mint authority is separated into three sequential stages:

#### Stage 1 — ISSUANCE_REQUEST
- Actor: Bank (Class B/C)
- Action: Submit institutional issuance request via MBG
- Output: An authenticated, idempotent issuance request with a CTID

#### Stage 2 — ISSUANCE_AUTHORIZATION
- Actor: MITHQAL Monetary & Reserve Control Division (Operating Co, operationally separated from commercial)
- Action: Authorize issuance based on:
  - VerifiedEligibleBacking
  - LegallyReservedBacking
  - InstitutionalRiskLimit
  - LiquidityLimit
  - JurisdictionLimit
  - ExposureLimit
  - ConcentrationLimit
  - OperationalLimit
- Output: A signed authorization record

#### Stage 3 — MINT_EXECUTION
- Actor: Canonical ledger (Technology Co)
- Action: Execute deterministic mint atomically with finality proof
- Output: A minted MTQ with a finality proof, written in an ACID transaction

### 3.3.4 Enforcement

The three-actor rule is enforced by:

1. The MBG adapter (only banks can submit issuance requests)
2. The L4 Authorization layer (only signed MITHQAL Monetary Control authorization
   can authorize issuance)
3. The L5 Ledger State Machine (only the canonical ledger can execute mints)
4. The L6 Database TX-State Protection (mint + finality proof are written
   atomically)
5. The L7 Smart Contract (mint() requires finality oracle signature)

No single actor controls both request and authorization. No single actor
controls both authorization and execution. No single actor controls both
request and execution.

## 3.4 Full Settlement Flow Diagram (16-Step Bank Minting Workflow)

The Bank Minting Workflow (BM-01 through BM-16) is the canonical flow by which
MTQ is minted. The workflow has 16 steps divided across three phases: BANK
(BM-01..BM-06), MBG (BM-07..BM-08), and MITHQAL (BM-09..BM-16).

### 3.4.1 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BANK PHASE                                     │
│                       (BM-01 through BM-06)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BM-01  Corporate Request                                               │
│         Corporate initiates settlement request                          │
│              │                                                          │
│              ▼                                                          │
│  BM-02  Bank Receives                                                   │
│         Participating bank receives request                             │
│              │                                                          │
│              ▼                                                          │
│  BM-03  KYC/KYB                                                         │
│         Know Your Customer / Business verification                      │
│              │                                                          │
│              ▼                                                          │
│  BM-04  AML/Sanctions                                                   │
│         Anti-money laundering and sanctions screening                   │
│              │                                                          │
│              ▼                                                          │
│  BM-05  Bank Establishes Backing                                        │
│         Bank establishes applicable backing                             │
│              │                                                          │
│              ▼                                                          │
│  BM-06  Protected Backing Evidence                                      │
│         Backing evidence generated (AvailableBackingCertificate)        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MBG PHASE                                      │
│                       (BM-07 through BM-08)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BM-07  Bank Requests MTQ                                               │
│         Bank requests MTQ issuance via MBG                              │
│              │                                                          │
│              ▼                                                          │
│  BM-08  MBG Translation                                                 │
│         MBG translates (not transforms) bank request                    │
│         • MBG Adapter                                                    │
│         • ISO 20022 Layer                                                │
│         • API Gateway / Host-to-Host                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MITHQAL PHASE                                    │
│                       (BM-09 through BM-16)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BM-09  Eligibility Check                                               │
│         MITHQAL Core checks eligibility                                 │
│              │                                                          │
│              ▼                                                          │
│  BM-10  Jurisdiction Check                                              │
│         Jurisdiction verification                                       │
│              │                                                          │
│              ▼                                                          │
│  BM-11  Backing Verification                                             │
│         Backing verification                                             │
│              │                                                          │
│              ▼                                                          │
│  BM-12  Bank-Specific Risk                                              │
│         Bank-specific risk assessment                                    │
│              │                                                          │
│              ▼                                                          │
│  BM-13  System-Wide Risk                                                │
│         System-wide concentration check (13 dimensions)                  │
│              │                                                          │
│              ▼                                                          │
│  BM-14  DMCE Check                                                       │
│         Dynamic Minting Capacity Engine                                  │
│         MIN(8 limits)                                                    │
│              │                                                          │
│              ▼                                                          │
│  BM-15  Monetary Authorization                                          │
│         MITHQAL Monetary Control authorizes                              │
│         (L4 — separated from commercial)                                  │
│              │                                                          │
│              ▼                                                          │
│  BM-16  Finality Verification + Mint                                     │
│         Finality verified (7 layers) → deterministic mint                │
│         (atomic with finality proof)                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4.2 Workflow Steps in Detail

| Step | ID | Name | Description | Phase | Enforcement Layer |
|------|----|------|-------------|-------|-------------------|
| 1 | BM-01 | Corporate Request | Corporate initiates settlement request | BANK | — |
| 2 | BM-02 | Bank Receives | Participating bank receives request | BANK | — |
| 3 | BM-03 | KYC/KYB | Know Your Customer / Business verification | BANK | — |
| 4 | BM-04 | AML/Sanctions | Anti-money laundering and sanctions screening | BANK | — |
| 5 | BM-05 | Bank Establishes Backing | Bank establishes applicable backing | BANK | — |
| 6 | BM-06 | Protected Backing Evidence | Backing evidence generated | BANK | — |
| 7 | BM-07 | Bank Requests MTQ | Bank requests MTQ issuance via MBG | MBG | — |
| 8 | BM-08 | MBG Translation | MBG translates (not transforms) bank request | MBG | — |
| 9 | BM-09 | Eligibility Check | MITHQAL Core checks eligibility | MITHQAL | L3 |
| 10 | BM-10 | Jurisdiction Check | Jurisdiction verification | MITHQAL | L3 |
| 11 | BM-11 | Backing Verification | Backing verification | MITHQAL | L3 |
| 12 | BM-12 | Bank-Specific Risk | Bank-specific risk assessment | MITHQAL | L3 |
| 13 | BM-13 | System-Wide Risk | System-wide concentration check | MITHQAL | L3 |
| 14 | BM-14 | DMCE Check | Dynamic Minting Capacity Engine | MITHQAL | L3 |
| 15 | BM-15 | Monetary Authorization | MITHQAL Monetary Control authorizes | MITHQAL | L4 |
| 16 | BM-16 | Finality Verification + Mint | Finality verified → deterministic mint | MITHQAL | L1-L7 |

### 3.4.3 Phase Discipline

The three phases are sequential. The BANK phase cannot be skipped. The MBG
phase cannot be skipped. The MITHQAL phase cannot be skipped. Within each
phase, the steps are sequential and cannot be skipped.

The L2 Workflow Engine enforces the BM-01..BM-16 sequence. The workflow state
machine cannot advance to BM-16 (mint) without BM-15 (finality verification)
passing.

### 3.4.4 Revenue Sequence Rule

Within the workflow, the revenue sequence rule (§2.1.4) is enforced:

1. Legal eligibility (BM-09)
2. Institutional authorization (BM-15)
3. Reserve/funding verification (BM-11)
4. Risk checks (BM-12, BM-13, BM-14)
5. Issuance (BM-16)
6. Fee accounting (after BM-16)

NEVER: Fee paid → MTQ issued.

## 3.5 Architectural Node Inventory

The MITHQAL architecture is composed of 12 canonical nodes organized in three
domains: BANK, MBG, and MITHQAL.

### 3.5.1 BANK Domain Nodes (5)

| Node ID | Name | Description |
|---------|------|-------------|
| BNK-01 | Corporate Treasury Portal | Corporate treasury interface |
| BNK-02 | Core Banking System | Bank's authoritative core banking |
| BNK-03 | KYC/KYB Engine | Customer verification |
| BNK-04 | AML/Sanctions Engine | Compliance screening |
| BNK-05 | FX/Treasury | FX and treasury operations |

### 3.5.2 MBG Domain Nodes (4)

| Node ID | Name | Description |
|---------|------|-------------|
| MBG-01 | MBG Adapter | MITHQAL Bank Gateway adapter (translation) |
| MBG-02 | ISO 20022 Layer | ISO 20022 message translation |
| MBG-03 | API Gateway | REST API gateway |
| MBG-04 | Host-to-Host | H2H file transfer |

### 3.5.3 MITHQAL Domain Nodes (3)

| Node ID | Name | Description |
|---------|------|-------------|
| MTH-01 | MITHQAL Core | Core authorization engine |
| MTH-02 | Ledger State Machine | MTQ ledger state transitions |
| MTH-03 | Finality Gate | 7-layer finality enforcement |

### 3.5.4 Node Flow

The nine canonical flows between nodes are:

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

## 3.6 Canonical Flow (Cross-Border)

The canonical cross-border settlement flow is:

```
SOVEREIGN MONEY / CBDC A
       │
       ▼
REGULATED INSTITUTION A (Sending Bank)
       │
       ▼
      MTQ
       │
       ▼
MITHQAL NEUTRAL SETTLEMENT LAYER
       │
       ▼
      MTQ
       │
       ▼
REGULATED INSTITUTION B (Receiving Bank)
       │
       ▼
SOVEREIGN MONEY / CBDC B
```

### 3.6.1 Cross-Border Flow Discipline

1. Sovereign money in (e.g., JPY) → Sovereign money out (e.g., USD).
2. The MTQ settlement leg is between the two regulated institutions.
3. The customer on each side interacts only with their bank.
4. The bank on each side interacts with the MITHQAL settlement layer.
5. The MITHQAL settlement layer authorizes the mint (sending side) and the
   redeem (receiving side).
6. The mint and the redeem are atomic; the burn + release are atomic.
7. Every step is recorded in the 14-field Settlement Record.
8. Every transaction is traceable through the six-hop trace path.

### 3.6.2 Japan → USA Worked Example

| Step | Actor | Action |
|------|-------|--------|
| 1 | Japanese Importer | Requests $10M payment via Japanese Bank |
| 2 | Japanese Bank (Class B) | Validates KYC/AML/funding |
| 3 | Japanese Bank | Submits institutional issuance request to MITHQAL |
| 4 | MITHQAL | Authenticates institution + jurisdiction + corridor |
| 5 | MITHQAL | Reserve verification + NAV + RR checks |
| 6 | MITHQAL Canonical Ledger | Executes mint (deterministic, idempotent CTID) |
| 7 | MITHQAL Settlement Layer | MTQ transferred to U.S. Bank |
| 8 | U.S. Bank (Class B) | Burns MTQ for USD reserve release |
| 9 | U.S. Bank | Credits USD to U.S. Exporter |

The Japanese Importer pays JPY; the U.S. Exporter receives USD; the settlement
between the two banks is denominated in MTQ. JPY remains JPY; USD remains USD;
MTQ is the settlement instrument between them.

## 3.7 Worked Example: AED → SGD Corridor

This worked example illustrates a controlled cross-currency settlement. The
example is design-time only — no real funds were transferred. All values are
from the canonical example corridor.

### 3.7.1 Corridor Parameters

| Parameter | Value |
|-----------|-------|
| Sender currency | AED |
| Receiver currency | SGD |
| Amount sent | 1,000,000 AED |
| Amount received | 367,365 SGD |
| FX route | USD-bridge |
| AED rail | TOKENIZED_DEPOSIT |
| SGD rail | CBDC |
| Compliance | PASSED |
| Settlement status | ATOMICALLY_SETTLED |
| MTQ minted | 272,000 MTQ |
| Total cost | 7 bps |
| Total cost (SGD) | 257.29 SGD |

### 3.7.2 Corridor Steps

The corridor is executed in 12 steps across 4 stages:

#### Stage 1 — FX_DISCOVERY (3 steps)

| Step ID | Name | Description | Status | Duration |
|---------|------|-------------|--------|----------|
| fx-1 | Quote AED/SGD direct | Request direct AED→SGD quote | SUCCESS | 220 ms |
| fx-2 | Quote AED/USD/SGD bridge | Request USD-bridge quote | SUCCESS | 180 ms |
| fx-3 | Select best route | Pick cheaper route (USD-bridge wins) | SUCCESS | 50 ms |

#### Stage 2 — LIQUIDITY_ROUTING (2 steps)

| Step ID | Name | Description | Status | Duration |
|---------|------|-------------|--------|----------|
| liq-1 | Route AED to TOKENIZED_DEPOSIT | Select AED liquidity pool | SUCCESS | 120 ms |
| liq-2 | Route SGD to CBDC | Select SGD liquidity pool | SUCCESS | 110 ms |

#### Stage 3 — COMPLIANCE_CHECK (2 steps)

| Step ID | Name | Description | Status | Duration |
|---------|------|-------------|--------|----------|
| comp-1 | KYC/KYB verification | Sender/receiver identity verification | SUCCESS | 300 ms |
| comp-2 | AML/sanctions screening | AML/CFT + sanctions check | SUCCESS | 450 ms |

#### Stage 4 — SETTLEMENT_EXECUTION (4 steps)

| Step ID | Name | Description | Status | Duration |
|---------|------|-------------|--------|----------|
| set-1 | MBG receives request | MBG translates bank request | SUCCESS | 80 ms |
| set-2 | Atomic MTQ mint | Mint 272,000 MTQ (atomic) | SUCCESS | 150 ms |
| set-3 | MTQ transfer | Transfer MTQ to receiving bank | SUCCESS | 90 ms |
| set-4 | Atomic MTQ redeem | Redeem MTQ → SGD at receiving bank | SUCCESS | 140 ms |

#### Stage 5 — CONFIRMATION (1 step)

| Step ID | Name | Description | Status | Duration |
|---------|------|-------------|--------|----------|
| conf-1 | Settlement confirmation | Both banks receive confirmation | SUCCESS | 60 ms |

Total corridor execution time: ~2,050 ms (just over 2 seconds).

### 3.7.3 Corridor Discipline

1. The corridor is denominated in MTQ for the settlement leg.
2. The mint and the redeem are atomic (set-2 + set-4).
3. The total cost is 7 bps (257.29 SGD on a 367,365 SGD settlement).
4. The corridor is compliance-checked on both sides.
5. Both banks receive confirmation.
6. The settlement is ATOMICALLY_SETTLED — irreversible, final, atomic.

## 3.8 Five-Way Reconciliation Model

The five-way reconciliation model is the canonical mechanism by which MITHQAL
verifies that the canonical ledger, the bank subledger, the reserve backing
evidence, the custodian evidence, and the proof of liabilities all agree.

### 3.8.1 The Five Sources

| Source | Description |
|--------|-------------|
| 1. Canonical MITHQAL Ledger | What MTQ actually exists (on-chain) |
| 2. Bank Institutional Subledger | What the bank attributes to corporate customers |
| 3. Reserve Backing Evidence | AvailableBackingCertificate from custodian |
| 4. Custodian Evidence | Custody attestation from qualified custodian |
| 5. Proof of Liabilities | Institutional positions |

### 3.8.2 The Reconciliation Rule

```
MITHQAL ledger = Bank subledger = Reserve backing = Custodian evidence = Proof of liabilities
IF mismatch → reconciliation failure → escalation → restrictions
```

### 3.8.3 The Seven Reconciliation States

| State | Meaning |
|-------|---------|
| VERIFIED | All 5 sources agree |
| WARNING | Minor discrepancy, within tolerance |
| MISMATCH | Discrepancy exceeds tolerance |
| CRITICAL | Severe discrepancy, escalation required |
| EXPIRED | Evidence is stale |
| UNAVAILABLE | Evidence is missing |
| LOCKED | Reconciliation is frozen pending investigation |

### 3.8.4 The Four-Source Trust Model

The four-source trust model is used to verify each piece of evidence:

1. Bank (provides the AvailableBackingCertificate)
2. Custodian (provides the custody attestation)
3. MITHQAL (verifies the evidence)
4. Independent (third-party verification where feasible)

Minimum 2 sources are required where independent source is feasible. No single
source of truth.

### 3.8.5 Anti-Double-Count

Anti-double-count is enforced at two levels:

1. **Mutation time:** `allocateBacking` rejects cross-obligation allocations.
2. **Independent audit:** `verifyNoDoubleCount` independently verifies.

Same backing must never support multiple MTQ obligations.

### 3.8.6 Reconciliation Outputs

For each reconciliation, the model produces:

1. A reconciliation state (one of the seven above)
2. A reconciliation report
3. An evidence package
4. An escalation record (if state is MISMATCH, CRITICAL, EXPIRED,
   UNAVAILABLE, or LOCKED)

### 3.8.7 Honest State

- `fiveWayReconciliationDesigned = true`
- `fiveWayReconciliationImplemented = true`
- `fiveWayReconciliationOperational = false` (no live institutional data)
- `reconciliationBreaksDetected = 0` (no live data, no breaks)

## 3.9 Settlement Finality Model (7-Layer Enforcement)

The settlement finality model is the seven-layer enforcement stack that
enforces the constitutional invariant `NO FINAL SETTLEMENT ⇒ NO MTQ MINT`.

### 3.9.1 The Seven Layers

| Layer | Name | Description | Enforcement Mechanism | Code Status |
|------:|------|-------------|----------------------|-------------|
| L1 | API Layer | Request validation, authentication, idempotency, timestamp, expiry, replay protection | Reject any mint request lacking valid auth signature, idempotency key, fresh timestamp, and proof-of-finality token | ENFORCED |
| L2 | Workflow Engine | 16-step Bank Minting Workflow BM-01..BM-16 | Workflow state machine cannot advance to BM-16 (mint) without BM-15 (finality verification) passing | ENFORCED |
| L3 | Policy Engine | Constitutional rules + DMCE constraints + concentration + eligibility + jurisdiction | Policy engine evaluates all DMCE limits before authorizing mint; hard-fail on any breach | ENFORCED |
| L4 | MITHQAL Monetary Authorization | MITHQAL Monetary & Reserve Control Division authorization (separated from commercial/sales) | Mint requires signed authorization from MITHQAL Monetary Control; commercial teams cannot override | ENFORCED |
| L5 | Ledger / State Machine | MTQ ledger mint-state transition guard (PENDING → AUTHORIZED → FINALIZED → MINTED) | Ledger rejects any mint-state transition that skips FINALIZED; state machine is append-only | ENFORCED |
| L6 | Database / Authoritative TX-State Protection | ACID transactional constraint; mint + finality-proof written atomically | Database transaction wraps (finality-proof INSERT + mint INSERT) atomically; partial writes roll back | ENFORCED |
| L7 | Smart Contract / Authoritative Settlement Control | On-chain finality gate (where applicable) — MTQ mint contract requires finality oracle attestation | Smart contract mint() requires valid finality oracle signature; TESTNET-deployed only | ENFORCED (testnet) |

### 3.9.2 The Adversarial Bypass Test Harness

Ten bypass routes are tested adversarially. All ten are blocked.

| # | Route | Description | Expected Blocked By | Blocked? | Reason |
|---|-------|-------------|---------------------|----------|--------|
| 1 | DIRECT_API_CALL_WITHOUT_AUTH | Call mint API directly without authentication signature | L1_API | YES | L1 API layer rejects requests lacking valid auth signature + idempotency key + fresh timestamp |
| 2 | WORKFLOW_SKIP_BM15 | Skip BM-15 finality verification and jump to BM-16 mint | L2_WORKFLOW | YES | L2 workflow state machine enforces BM-01..BM-16 sequence; cannot advance without BM-15 passing |
| 3 | POLICY_OVERRIDE_BY_COMMERCIAL | Commercial/sales team overrides DMCE policy to allow mint | L3_POLICY | YES | L3 policy engine is structurally separated from commercial teams; commercial has no override authority |
| 4 | UNSIGNED_AUTHORIZATION | Mint without signed MITHQAL Monetary Control authorization | L4_AUTHORIZATION | YES | L4 requires cryptographically signed authorization from MITHQAL Monetary & Reserve Control Division |
| 5 | LEDGER_SKIP_FINALIZED_STATE | Transition ledger state PENDING → MINTED directly, skipping FINALIZED | L5_LEDGER_STATE_MACHINE | YES | L5 ledger state machine only allows PENDING → AUTHORIZED → FINALIZED → MINTED; skips rejected |
| 6 | DATABASE_PARTIAL_WRITE | Write mint record without corresponding finality-proof record (partial transaction) | L6_DATABASE_TX_STATE | YES | L6 ACID transaction wraps both writes atomically; partial writes roll back |
| 7 | SMART_CONTRACT_WITHOUT_ORACLE | Call smart contract mint() without valid finality oracle attestation | L7_SMART_CONTRACT | YES | L7 smart contract mint() requires valid finality oracle signature; reverts without it |
| 8 | EMERGENCY_OVERRIDE_WITHOUT_GOVERNANCE | Invoke emergency override without explicit constitutional/emergency authorization | L4_AUTHORIZATION | YES | Emergency overrides require explicit constitutional/emergency governance authorization and are fully auditable |
| 9 | ADMIN_BACKDOOR | Use admin/backdoor route to mint without finality | L5_LEDGER_STATE_MACHINE | YES | No admin backdoor exists; ledger state machine is append-only and enforces the sequence for ALL callers |
| 10 | INTERNAL_API_ROUTE | Use hidden internal API route to bypass the public mint flow | L1_API | YES | All routes (public + internal) pass through the same 7-layer enforcement; no hidden bypass exists |

### 3.9.3 Finality Bypass Risk

- Total routes tested: 10
- Blocked: 10
- Bypassed: 0
- Invariant holds: YES
- Finality Bypass Risk: MITIGATED_AT_CODE_LEVEL
- Finality Production Ready: FALSE (pending institutional validation)

### 3.9.4 Settlement Finality States

The settlement finality model has four states:

| State | Meaning | Irreversibility |
|-------|---------|-----------------|
| PENDING | Settlement initiated, not yet final | Reversible |
| TECHNICAL_FINAL | Technical settlement complete, legal/banking finality pending | Technical-irreversible |
| LEGAL_FINAL | Legal settlement complete, banking finality pending | Legal-irreversible |
| BANKING_FINAL | Full settlement finality — irreversible, atomic | Fully irreversible |

The progression is: PENDING → TECHNICAL_FINAL → LEGAL_FINAL → BANKING_FINAL.
No step may be skipped. The settlement is not "final" until BANKING_FINAL.

## 3.10 Three-Book Economic Separation

The three-book economic separation is the constitutional mechanism by which
MITHQAL prevents economic commingling between corporate, bank MTQ obligation,
and corporate participant positions.

### 3.10.1 The Three Books

#### Book A — MITHQAL Corporate (8 fields)

| # | Field |
|---|-------|
| 1 | Revenue |
| 2 | Expenses |
| 3 | Payroll |
| 4 | Tax |
| 5 | Technology costs |
| 6 | Corporate assets |
| 7 | Corporate liabilities |
| 8 | Profit/loss |

#### Book B — Bank MTQ Obligation Ledger (8 fields)

| # | Field |
|---|-------|
| 1 | Responsible bank |
| 2 | Applicable backing |
| 3 | MTQ originated |
| 4 | MTQ outstanding |
| 5 | Redemption obligations |
| 6 | Liquidity |
| 7 | Settlement |
| 8 | Bank risk |

#### Book C — Corporate Participant Position (9 fields)

| # | Field |
|---|-------|
| 1 | MTQ balance |
| 2 | Available MTQ |
| 3 | Reserved MTQ |
| 4 | Pending MTQ |
| 5 | Sent |
| 6 | Received |
| 7 | Redemption |
| 8 | Settlement history |
| 9 | Bank-money linkage |

### 3.10.2 Anti-Commingling Tests

Four anti-commingling tests are enforced. ALL must be blocked.

| # | Test | Status |
|---|------|--------|
| 1 | Corporate cash → MTQ backing without authorization | BLOCKED |
| 2 | Bank obligation → MITHQAL corporate revenue | BLOCKED |
| 3 | Corporate MTQ → MITHQAL asset | BLOCKED |
| 4 | Reserve gain → Operating Company revenue | BLOCKED |

### 3.10.3 Reconciliation Rule

The three books must reconcile but must NEVER be economically commingled:

- Book A total = MITHQAL corporate P&L
- Book B total = total MTQ outstanding (across all banks)
- Book C total = total corporate participant positions (across all corporates)
- Book B total = Book C total (every MTQ has a corporate participant; every
  corporate participant's MTQ is recorded in a bank's Book B)

### 3.10.4 Honest State

- `threeBookDesign = true` (designed at code level)
- `threeBookOperational = false` (not yet operational)
- `threeBookEnforced = false` (not yet enforced in production)

---

# SECTION 4 — WHAT MITHQAL IS NOT

## 4.0 Section Purpose

This section defines what MITHQAL is NOT. It is the negative-space complement
to Section 3 (What MITHQAL Is). Together, the two sections establish the precise
identity of MITHQAL and distinguish it from every adjacent financial
architecture.

The negative space is as binding as the positive space. Every prohibited
description in this section is a constitutional prohibition. Any communication
(internal or external) that describes MITHQAL using prohibited language is a
constitutional breach requiring immediate correction.

## 4.1 Prohibited Description Discipline

Every prohibited description in this section carries the same weight as a
constitutional invariant. The discipline is:

1. **No prohibited description may appear in any MITHQAL communication.**
   This includes blueprints, whitepapers, institutional engagement documents,
   marketing materials, internal memos, code comments, and verbal
   communications.

2. **No prohibited description may be implied.** Implication is as binding as
   explicit statement. If a reasonable reader would infer a prohibited
   description from the language used, the language is prohibited.

3. **No prohibited description may be suggested.** Suggestion is as binding as
   implication. If a reasonable reader would infer a prohibited description from
   the context, the context is prohibited.

4. **No prohibited description may be used "for marketing purposes."** Marketing
   discipline is constitutional. There is no marketing exception.

5. **No prohibited description may be used "for technical accuracy."** Technical
   accuracy does not require prohibited descriptions. The canonical language
   is both technically accurate and constitutionally compliant.

## 4.2 MITHQAL Is Not a Cryptocurrency

### 4.2.1 Prohibited Description

MITHQAL is NOT a cryptocurrency. MTQ is NOT a cryptocurrency.

### 4.2.2 Why Not

A cryptocurrency is:

- Permissionless (anyone can participate)
- Anonymous (or pseudonymous)
- Decentralized (no central authority)
- Speculative (price fluctuates freely)
- Retail (anyone can hold, transfer, trade)

MITHQAL is the opposite:

- Permissioned (only authorized regulated institutions can participate)
- Institutionally attributable (every transaction is attributable)
- Centralized (MITHQAL Operating Company operates the canonical ledger)
- Reserve-disciplined (PAR-referenced, not speculative)
- Wholesale (no retail participation)

### 4.2.3 Permitted Language

- "Permissioned wholesale settlement instrument"
- "Reserve-disciplined settlement unit"
- "Institutional settlement infrastructure"

### 4.2.4 Prohibited Language

- "Cryptocurrency"
- "Crypto"
- "Digital currency" (when used to imply cryptocurrency)
- "Token" (when used to imply cryptocurrency)
- "Coin" (when used to imply cryptocurrency)

## 4.3 MITHQAL Is Not a Retail Application

### 4.3.1 Prohibited Description

MITHQAL is NOT a retail application. MTQ is NOT a retail payment instrument.

### 4.3.2 Why Not

A retail application:

- Serves individual consumers
- Processes retail payments
- Provides consumer-facing UX
- Allows direct consumer onboarding
- Operates at retail transaction sizes

MITHQAL is the opposite:

- Serves regulated financial institutions (wholesale)
- Processes wholesale settlements
- Provides institution-facing APIs (MBG)
- Allows only institutional onboarding (Class A/B/C)
- Operates at institutional transaction sizes

### 4.3.3 The Class E Hard Boundary

Direct retail participation is PROHIBITED. Retail customers (Class E) cannot
directly mint, hold, transfer, or redeem MTQ.

### 4.3.4 Permitted Language

- "Wholesale institutional settlement"
- "Bank-to-bank settlement infrastructure"
- "Institutional-only settlement layer"

## 4.4 MITHQAL Is Not a Bank

### 4.4.1 Prohibited Description

MITHQAL is NOT a bank. MITHQAL does NOT take deposits. MITHQAL does NOT make
loans. MITHQAL does NOT operate a banking license.

### 4.4.2 Why Not

A bank:

- Takes customer deposits
- Makes loans
- Holds a banking license
- Operates under banking regulation
- Maintains fractional reserves
- Provides retail banking services

MITHQAL is the opposite:

- Does NOT take deposits (banks do; MITHQAL does not)
- Does NOT make loans (constitutional prohibition)
- Does NOT hold a banking license (MITHQAL may hold other licenses, but not
  banking)
- Operates as a settlement infrastructure provider
- Maintains 130% reserves (not fractional)
- Provides wholesale settlement services (not retail banking)

### 4.4.3 Anti-Platform Doctrine

MITHQAL is neutral wholesale settlement infrastructure. Period. MITHQAL is not
an exchange, a brokerage, a market maker, a bank, a lender, an investment
manager, a DeFi platform, or a retail payment platform.

### 4.4.4 Permitted Language

- "Settlement infrastructure provider"
- "Wholesale settlement layer"
- "Institutional settlement infrastructure"

## 4.5 MITHQAL Is Not a Stablecoin

### 4.5.1 Prohibited Description

MITHQAL is NOT a stablecoin. MTQ is NOT a stablecoin.

### 4.5.2 Why Not

A stablecoin is:

- A cryptocurrency designed to maintain a stable value relative to a reference
  asset (usually USD)
- Issued by a private entity
- Backed by reserves (in theory)
- Traded on cryptocurrency exchanges
- Available to retail customers
- Often USD-pegged

MITHQAL is the opposite:

- A permissioned wholesale settlement instrument (not a cryptocurrency)
- Issued by an institutional settlement infrastructure (not a private stablecoin
  issuer)
- Backed by a diversified 11-currency + gold + digital reserve (not USD-only)
- Not traded on cryptocurrency exchanges (institutional-only)
- Not available to retail customers (wholesale-only)
- PAR-referenced, not USD-pegged

### 4.5.3 The Distinction

MTQ is sometimes confused with stablecoins because both are "digital" and both
are "backed." The distinction is fundamental:

| Property | Stablecoin | MTQ |
|----------|-----------|-----|
| Permissioning | Permissionless | Permissioned (institutional-only) |
| Reference | USD peg | PAR (constitutional unit) |
| Backing | USD reserves | 11-currency + gold + digital |
| Availability | Retail | Wholesale (Class B/C institutions) |
| Exchange-listed | Yes | No |
| Settlement-only | No (also a speculative asset) | Yes (settlement-only) |

### 4.5.4 Permitted Language

- "Permissioned wholesale settlement instrument"
- "Reserve-disciplined settlement unit"
- "PAR-referenced settlement instrument"

## 4.6 MITHQAL Is Not USD-Pegged

### 4.6.1 Prohibited Description

MITHQAL is NOT USD-pegged. MTQ is NOT USD-pegged.

### 4.6.2 Why Not

A USD peg would mean:

- MTQ's value tracks USD regardless of reserve composition
- USD volatility becomes MTQ volatility
- USD monetary policy becomes MTQ monetary policy
- The 11-currency diversification is nullified
- The 35% USD ceiling is meaningless
- MTQ becomes a substitute for USD (violating Invariant #4)

This is unconstitutional.

### 4.6.3 The PAR Reference

MTQ is PAR-referenced. PAR = 1.00. PAR is the constitutional unit of MTQ
settlement value. PAR is not a peg to USD. PAR is not a peg to any sovereign
currency.

### 4.6.4 The USD Effective Ceiling

The USD effective exposure ceiling is 35%. The current USD effective exposure
is 23.54% (Direct USD 20% + AED-USD-linked 1.93% + SAR-USD-linked 1.61%).
The ceiling is not breached. The ceiling enforces diversification.

### 4.6.5 Permitted Language

- "PAR-referenced"
- "Multi-currency reserve"
- "Diversified reserve composition"

### 4.6.6 Prohibited Language

- "USD-pegged"
- "Pegged to USD"
- "USD-backed"
- "Stable against USD"

## 4.7 MITHQAL Is Not a Sovereign Currency

### 4.7.1 Prohibited Description

MITHQAL is NOT a sovereign currency. MTQ is NOT a sovereign currency. MITHQAL
does NOT replace, compete with, or become a substitute for any sovereign
currency.

### 4.7.2 Why Not

A sovereign currency is:

- Issued by a sovereign monetary authority (central bank)
- Legal tender in the issuing jurisdiction
- Backed by the full faith and credit of the sovereign
- Used for monetary policy
- Used for retail payments

MTQ is the opposite:

- Issued by an institutional settlement infrastructure (not a central bank)
- Not legal tender in any jurisdiction
- Backed by a diversified institutional reserve (not sovereign credit)
- Not used for monetary policy
- Not used for retail payments

### 4.7.3 The Neutrality Doctrine

The neutrality doctrine (§V25.0.6) is immutable:

1. USD remains USD.
2. JPY remains JPY.
3. EUR remains EUR.
4. AED remains AED.
5. CNY remains CNY.
6. CBDCs remain liabilities of their issuing central banks.
7. MTQ does not replace domestic monetary systems.
8. MTQ does not establish monetary policy.
9. MITHQAL does not set sovereign interest rates.
10. MITHQAL does not attempt to displace any sovereign currency.

### 4.7.4 Permitted Language

- "Permissioned wholesale settlement instrument"
- "Settlement unit between monetary systems"
- "Institutional settlement infrastructure"

## 4.8 MITHQAL Is Not a CBDC

### 4.8.1 Prohibited Description

MITHQAL is NOT a CBDC. MTQ is NOT a CBDC. MTQ is NOT a CBDC replacement.

### 4.8.2 Why Not

A CBDC (Central Bank Digital Currency) is:

- Issued by a central bank
- A direct liability of the central bank
- Legal tender in the issuing jurisdiction
- Sovereign money in digital form

MTQ is the opposite:

- Issued by an institutional settlement infrastructure (not a central bank)
- Not a direct liability of any central bank
- Not legal tender in any jurisdiction
- Not sovereign money

### 4.8.3 CBDC Interoperability

MITHQAL supports CBDC interoperability. MITHQAL supports five flows:

1. wholesale CBDC → MTQ → wholesale CBDC
2. CBDC → MTQ → bank money
3. bank money → MTQ → CBDC
4. bank money → MTQ → bank money
5. tokenized sovereign/cash-equivalent assets → MTQ → regulated destination settlement assets

But MITHQAL itself is NOT a CBDC. CBDCs remain liabilities of their issuing
central banks. MTQ is the bridge between CBDCs, not another CBDC.

### 4.8.4 Permitted Language

- "CBDC interoperability layer"
- "Bridge between CBDCs"
- "Cross-CBDC settlement infrastructure"

## 4.9 MITHQAL Is Not a Central Bank

### 4.9.1 Prohibited Description

MITHQAL is NOT a central bank. MITHQAL does NOT set monetary policy. MITHQAL
does NOT set sovereign interest rates.

### 4.9.2 Why Not

A central bank:

- Issues sovereign currency
- Sets monetary policy
- Sets interest rates
- Acts as lender of last resort
- Manages foreign exchange reserves
- Supervises commercial banks

MITHQAL is the opposite:

- Does NOT issue sovereign currency (MTQ is a settlement instrument, not a
  sovereign currency)
- Does NOT set monetary policy
- Does NOT set interest rates
- Does NOT act as lender of last resort
- Does NOT manage foreign exchange reserves (it manages a settlement backing
  pool, which is different)
- Does NOT supervise commercial banks

### 4.9.3 Central Bank Participation

Central banks may participate in MITHQAL as Class A participants, but only when
explicitly authorized by the relevant authority and applicable legal framework.
Even central banks go through institutional channels; they do not directly
mint MTQ.

### 4.9.4 Permitted Language

- "Settlement infrastructure provider"
- "Institutional settlement layer"
- "Wholesale settlement infrastructure"

## 4.10 MITHQAL Is Not an Exchange

### 4.10.1 Prohibited Description

MITHQAL is NOT an exchange. MITHQAL does NOT operate an order book. MITHQAL
does NOT match buyers and sellers.

### 4.10.2 Why Not

An exchange:

- Matches buyers and sellers
- Operates an order book
- Provides price discovery
- Facilitates speculation
- Lists assets for trading

MITHQAL is the opposite:

- Does NOT match buyers and sellers (banks transact directly)
- Does NOT operate an order book
- Does NOT provide price discovery (FX is provided by banks)
- Does NOT facilitate speculation (constitutional prohibition)
- Does NOT list assets for trading

### 4.10.3 FX Boundary

MITHQAL should NOT become the global FX exchange. MITHQAL provides the
settlement bridge; regulated institutions provide local monetary conversion.
FX is performed by banks, not by MITHQAL.

### 4.10.4 Permitted Language

- "Settlement infrastructure"
- "Settlement bridge"
- "Institutional settlement layer"

## 4.11 MITHQAL Is Not a Brokerage

### 4.11.1 Prohibited Description

MITHQAL is NOT a brokerage. MITHQAL does NOT execute trades on behalf of
clients.

### 4.11.2 Why Not

A brokerage:

- Executes trades on behalf of clients
- Charges commissions on trades
- Provides investment advice
- Holds client assets in brokerage accounts
- Facilitates speculative trading

MITHQAL is the opposite:

- Does NOT execute trades (banks do)
- Does NOT charge commissions on trades (MITHQAL charges settlement fees)
- Does NOT provide investment advice
- Does NOT hold client assets (custodians do)
- Does NOT facilitate speculative trading (constitutional prohibition)

### 4.11.3 Permitted Language

- "Settlement infrastructure provider"
- "Institutional settlement layer"

## 4.12 MITHQAL Is Not a Market Maker

### 4.12.1 Prohibited Description

MITHQAL is NOT a market maker. MITHQAL does NOT provide bid/ask quotes. MITHQAL
does NOT maintain inventory for trading.

### 4.12.2 Why Not

A market maker:

- Provides bid/ask quotes
- Maintains inventory for trading
- Profits from bid/ask spread
- Provides liquidity for speculative trading

MITHQAL is the opposite:

- Does NOT provide bid/ask quotes
- Does NOT maintain inventory for trading (MITHQAL maintains a settlement
  backing pool, which is different)
- Does NOT profit from bid/ask spread
- Does NOT provide liquidity for speculative trading

### 4.12.3 Reserve vs. Inventory

The MITHQAL reserve is a settlement backing pool, NOT a trading inventory.
The reserve is held to back MTQ issuance, not to be traded for profit.

### 4.12.4 Permitted Language

- "Settlement backing pool"
- "Reserve-disciplined settlement infrastructure"

## 4.13 MITHQAL Is Not a Lender

### 4.13.1 Prohibited Description

MITHQAL is NOT a lender. MITHQAL does NOT make loans. MITHQAL does NOT extend
credit.

### 4.13.2 Why Not

A lender:

- Makes loans
- Extends credit
- Charges interest on loans
- Takes credit risk
- Operates under lending regulation

MITHQAL is the opposite:

- Does NOT make loans (constitutional prohibition)
- Does NOT extend credit
- Does NOT charge interest on loans (MITHQAL charges settlement fees, not
  loan interest)
- Does NOT take credit risk (MITHQAL is not a financial guarantor)
- Does NOT operate under lending regulation

### 4.13.3 Permitted Language

- "Settlement infrastructure"
- "Institutional settlement layer"

## 4.14 MITHQAL Is Not an Investment Manager

### 4.14.1 Prohibited Description

MITHQAL is NOT an investment manager. MITHQAL does NOT manage investments on
behalf of clients.

### 4.14.2 Why Not

An investment manager:

- Manages investments on behalf of clients
- Charges investment management fees
- Provides investment advice
- Operates under investment management regulation
- Maximizes returns for clients

MITHQAL is the opposite:

- Does NOT manage investments (the reserve is a settlement backing pool, not
  an investment portfolio)
- Does NOT charge investment management fees
- Does NOT provide investment advice
- Does NOT operate under investment management regulation
- Does NOT maximize returns (the reserve is managed for settlement integrity,
  not for return)

### 4.14.3 Permitted Language

- "Settlement infrastructure"
- "Reserve management for settlement integrity"

## 4.15 MITHQAL Is Not a Wealth Manager

### 4.15.1 Prohibited Description

MITHQAL is NOT a wealth manager. MITHQAL does NOT provide wealth management
services.

### 4.15.2 Why Not

A wealth manager:

- Provides wealth management services to high-net-worth individuals
- Manages client portfolios
- Provides financial planning
- Charges wealth management fees
- Operates under wealth management regulation

MITHQAL is the opposite:

- Does NOT provide wealth management services
- Does NOT manage client portfolios
- Does NOT provide financial planning
- Does NOT charge wealth management fees
- Does NOT operate under wealth management regulation

### 4.15.3 Permitted Language

- "Settlement infrastructure"
- "Institutional settlement layer"

## 4.16 MITHQAL Is Not a Trade-Finance Institution

### 4.16.1 Prohibited Description

MITHQAL is NOT a trade-finance institution. MITHQAL does NOT issue letters of
credit. MITHQAL does NOT provide trade finance.

### 4.16.2 Why Not

A trade-finance institution:

- Issues letters of credit
- Provides trade finance
- Facilitates international trade transactions
- Charges trade finance fees
- Operates under trade finance regulation

MITHQAL is the opposite:

- Does NOT issue letters of credit
- Does NOT provide trade finance
- Does NOT facilitate trade transactions (MITHQAL settles the underlying value;
  trade finance is a separate matter)
- Does NOT charge trade finance fees
- Does NOT operate under trade finance regulation

### 4.16.3 Permitted Language

- "Settlement infrastructure"
- "Institutional settlement layer"

## 4.17 MITHQAL Is Not a DeFi Protocol

### 4.17.1 Prohibited Description

MITHQAL is NOT a DeFi (Decentralized Finance) protocol. MITHQAL does NOT
provide decentralized financial services.

### 4.17.2 Why Not

A DeFi protocol:

- Is decentralized
- Is permissionless
- Is anonymous (or pseudonymous)
- Provides speculative yield
- Operates without institutional oversight
- Is governed by token holders

MITHQAL is the opposite:

- Is centralized (operated by MITHQAL Operating Company)
- Is permissioned (institutional-only)
- Is institutionally attributable
- Does NOT provide speculative yield (constitutional prohibition)
- Operates under institutional oversight
- Is governed by a corporate structure (5 entities) and a constitution

### 4.17.3 Permitted Language

- "Permissioned institutional settlement infrastructure"
- "Constitutionally governed settlement layer"

## 4.18 MITHQAL Is Not a Speculative Vehicle

### 4.18.1 Prohibited Description

MITHQAL is NOT a speculative vehicle. MTQ is NOT a speculative instrument.
MITHQAL does NOT optimize for token price.

### 4.18.2 Why Not

A speculative vehicle:

- Has a freely fluctuating price
- Is traded on exchanges
- Provides speculative return
- Optimizes for token price
- Attracts speculative capital

MITHQAL is the opposite:

- Has a PAR-referenced value (not freely fluctuating)
- Is NOT traded on exchanges (institutional-only)
- Does NOT provide speculative return
- Does NOT optimize for token price (constitutional prohibition)
- Does NOT attract speculative capital

### 4.18.3 No Speculative Token-Price Optimization

DO NOT introduce speculative token-price optimization. MTQ is a settlement
instrument, not a speculative token. The price of MTQ is not a design variable;
the value of MTQ is derived from the reserve.

### 4.18.4 Permitted Language

- "Settlement instrument"
- "Reserve-disciplined settlement unit"

## 4.19 MITHQAL Is Not a Custodian (by Default)

### 4.19.1 Prohibited Description

MITHQAL is NOT a custodian (by default). MITHQAL does NOT hold reserve assets
by default. MITHQAL is non-custodial by default.

### 4.19.2 Why Not

A custodian:

- Holds assets on behalf of clients
- Operates under custody regulation
- Charges custody fees
- Maintains segregated accounts
- Provides custody attestations

MITHQAL is the opposite:

- Does NOT hold reserve assets by default (non-custodial by default)
- Does NOT operate under custody regulation (custodians do)
- Does NOT charge custody fees (custodians do)
- Does NOT maintain segregated accounts (custodians do)
- Does NOT provide custody attestations (custodians do; MITHQAL verifies
  custodian attestations)

### 4.19.3 The Custody Prohibitions

The custody prohibitions (§V25.0.C) are:

1. Custody of reserve assets does NOT move to MITHQAL by default.
2. Customer deposits do NOT move to MITHQAL.
3. Bank reserves do NOT move to MITHQAL.
4. Custodian assets do NOT move to MITHQAL.
5. The Operating Company does NOT operate a vault by default.
6. The Foundation does NOT hold reserve assets.

### 4.19.4 Permitted Language

- "Non-custodial by default"
- "Evidence verification, not custody"
- "Reserve backing held by qualified custodians"

## 4.20 MITHQAL Is Not a SWIFT Replacement

### 4.20.1 Prohibited Description

MITHQAL is NOT a SWIFT replacement. MITHQAL does NOT replace SWIFT.

### 4.20.2 Why Not

SWIFT is a messaging network for interbank financial messages. MITHQAL is a
settlement infrastructure. The two are different layers of the financial
stack:

- SWIFT provides messaging (the "plumbing" for instructions)
- MITHQAL provides settlement (the actual transfer of value)

MITHQAL may interoperate with SWIFT (via ISO 20022 messages), but MITHQAL does
not replace SWIFT. SWIFT remains SWIFT; MITHQAL is the settlement layer that
sits on top of (or alongside) the messaging layer.

### 4.20.3 SWIFT Position

SWIFT is confirmed as a canonical messaging standard for interbank financial
messages. MITHQAL supports ISO 20022 messaging (pain.001, pain.002, pacs.002,
pacs.008, pacs.009, camt.025, camt.054, camt.056, head.001). MITHQAL may use
SWIFT as a messaging transport for ISO 20022 messages.

### 4.20.4 Permitted Language

- "Settlement infrastructure (uses SWIFT/ISO 20022 for messaging)"
- "Settlement layer that interoperates with SWIFT"
- "Cross-jurisdictional settlement infrastructure"

## 4.21 MITHQAL Is Not a Bank-Core Replacement

### 4.21.1 Prohibited Description

MITHQAL is NOT a bank-core replacement. MITHQAL does NOT replace bank core
banking systems.

### 4.21.2 Why Not

A bank core banking system:

- Manages customer deposits
- Processes retail payments
- Maintains customer accounts
- Processes loans
- Provides retail banking UX

MITHQAL is the opposite:

- Does NOT manage customer deposits (banks do)
- Does NOT process retail payments (banks do)
- Does NOT maintain customer accounts (banks do)
- Does NOT process loans (banks do)
- Does NOT provide retail banking UX (banks do)

MITHQAL is the settlement layer *between* banks, not a replacement for any
bank's internal systems.

### 4.21.3 MBG Adapter

The MBG (MITHQAL Bank Gateway) adapter is a TRANSLATION layer, not a
TRANSFORMATION layer. MBG translates bank requests into MITHQAL format; MBG
does not transform the bank's core banking system.

### 4.21.4 Permitted Language

- "Settlement infrastructure (interoperates with bank core banking systems)"
- "Settlement layer between banks"
- "MBG translation layer"

## 4.22 MITHQAL Is Not a Sovereign Reserve Asset Holder

### 4.22.1 Prohibited Description

MITHQAL is NOT a sovereign reserve asset holder. MITHQAL does NOT hold sovereign
reserves. MITHQAL does NOT manage foreign exchange reserves on behalf of any
sovereign.

### 4.22.2 Why Not

A sovereign reserve asset holder:

- Holds foreign exchange reserves on behalf of a sovereign
- Manages sovereign wealth
- Operates under sovereign authority
- Is typically a central bank or sovereign wealth fund

MITHQAL is the opposite:

- Does NOT hold sovereign reserves (MITHQAL does not own reserve assets by
  default)
- Does NOT manage sovereign wealth
- Does NOT operate under sovereign authority (MITHQAL is a private
  institutional infrastructure)
- Is NOT a central bank or sovereign wealth fund

### 4.22.3 The Distinction

The MITHQAL reserve is a settlement backing pool, NOT a sovereign reserve.
The MITHQAL reserve backs MTQ issuance; it is not a sovereign's foreign
exchange reserve.

### 4.22.4 Permitted Language

- "Settlement backing pool"
- "Reserve-disciplined settlement infrastructure"

## 4.23 MITHQAL Is Not a Financial Guarantor

### 4.23.1 Prohibited Description

MITHQAL is NOT a financial guarantor. MITHQAL does NOT guarantee MTQ. MITHQAL
does NOT guarantee bank obligations. MITHQAL does NOT guarantee custodian
obligations.

### 4.23.2 Why Not

A financial guarantor:

- Guarantees the obligations of others
- Takes credit risk on behalf of the guaranteed party
- Charges guarantee fees
- Operates under guarantee regulation

MITHQAL is the opposite:

- Does NOT guarantee MTQ (MTQ is backed by the reserve, not by a MITHQAL
  guarantee)
- Does NOT guarantee bank obligations (banks are responsible for their own
  obligations)
- Does NOT guarantee custodian obligations (custodians are responsible for
  their own obligations)
- Does NOT charge guarantee fees
- Does NOT operate under guarantee regulation

### 4.23.3 The Bank Default Principle

In the event of a bank default, MITHQAL is NOT the financial guarantor. The
bank default resolution framework (§48) defines the 8-state lifecycle
(ACTIVE → RESTRICTED → LIQUIDITY_STRESS → SUSPENDED → DEFAULT → INSOLVENT →
RESOLUTION → EXIT) and the 11 contractual questions that must be answered
before the framework is contractually validated.

### 4.23.4 Permitted Language

- "Settlement infrastructure (not a financial guarantor)"
- "Reserve-disciplined settlement layer (does not guarantee bank obligations)"

## 4.24 MITHQAL Is Not a Government Authority

### 4.24.1 Prohibited Description

MITHQAL is NOT a government authority. MITHQAL does NOT exercise governmental
power. MITHQAL does NOT issue regulations.

### 4.24.2 Why Not

A government authority:

- Exercises governmental power
- Issues regulations
- Enforces laws
- Operates under sovereign authority
- Is part of the government

MITHQAL is the opposite:

- Does NOT exercise governmental power
- Does NOT issue regulations
- Does NOT enforce laws (it enforces its own constitutional rules, but it does
  not enforce sovereign laws)
- Does NOT operate under sovereign authority
- Is NOT part of the government

### 4.24.3 Permitted Language

- "Private institutional settlement infrastructure"
- "Constitutionally governed settlement layer"

## 4.25 MITHQAL Is Not Sanctions-Evasion Infrastructure

### 4.25.1 Prohibited Description

MITHQAL is NOT sanctions-evasion infrastructure. MITHQAL does NOT circumvent
sanctions. MITHQAL does NOT facilitate sanctions evasion.

### 4.25.2 Why Not

Sanctions evasion infrastructure:

- Facilitates evasion of sanctions
- Provides anonymity for sanctioned actors
- Enables circumvention of capital controls
- Provides alternate routing designed to evade law

MITHQAL is the opposite:

- Does NOT facilitate sanctions evasion (constitutional prohibition)
- Does NOT provide anonymity (every transaction is institutionally
  attributable)
- Does NOT enable circumvention of capital controls (constitutional prohibition)
- Does NOT provide alternate routing designed to evade law (constitutional
  prohibition)

### 4.25.3 Sanctions Screening

Every MTQ transaction is screened against:

1. The UN Security Council Consolidated List
2. The OFAC SDN List
3. The EU Consolidated List
4. The HM Treasury Sanctions List
5. Any other applicable sanctions list

### 4.25.4 Geo-Fencing

Geo-fencing is fail-closed. China is geo-fenced. Any jurisdiction where MTQ
issuance, settlement, or crypto activity is prohibited is geo-fenced.

### 4.25.5 Permitted Language

- "Sanctions-compliant settlement infrastructure"
- "Jurisdiction-aware settlement layer"

## 4.26 MITHQAL Is Not an Anonymity Network

### 4.26.1 Prohibited Description

MITHQAL is NOT an anonymity network. MITHQAL does NOT provide anonymous
transactions. MITHQAL does NOT provide untraceable transactions.

### 4.26.2 Why Not

An anonymity network:

- Provides anonymous transactions
- Provides untraceable transactions
- Enables anonymous value transfer
- Operates without institutional oversight

MITHQAL is the opposite:

- Does NOT provide anonymous transactions (every transaction is
  institutionally attributable)
- Does NOT provide untraceable transactions (every transaction has a 14-field
  Settlement Record and a 6-hop trace path)
- Does NOT enable anonymous value transfer (every transaction has a
  regulated institution on each side)
- Does NOT operate without institutional oversight (MITHQAL is operated by
  the Operating Company and overseen by the Foundation)

### 4.26.3 Privacy vs. Anonymity

MITHQAL provides privacy, NOT anonymity. Privacy means that transaction
details are visible only to authorized parties (the sending bank, the
receiving bank, MITHQAL, the regulator with lawful access rights). Anonymity
means that transaction details are visible to no one. MITHQAL provides privacy;
MITHQAL does NOT provide anonymity.

### 4.26.4 Zero-Knowledge Proofs

MITHQAL may use zero-knowledge proofs (ZKPs) to verify sufficient backing
without revealing individual balances. ZKPs are a privacy technology, NOT an
anonymity technology. ZKPs protect the privacy of legitimate institutional
information; they do NOT enable anonymous transactions.

### 4.26.5 Permitted Language

- "Privacy-preserving settlement infrastructure"
- "Institutionally attributable settlement layer"
- "Cryptographically auditable settlement infrastructure"

## 4.27 MITHQAL Is Not a Token-Issuance-for-Profit Scheme

### 4.27.1 Prohibited Description

MITHQAL is NOT a token-issuance-for-profit scheme. MITHQAL does NOT issue MTQ
to generate profit. MITHQAL does NOT profit from MTQ issuance.

### 4.27.2 Why Not

A token-issuance-for-profit scheme:

- Issues tokens to generate profit
- Profits from token issuance
- Uses token issuance as a revenue source
- Maximizes token issuance

MITHQAL is the opposite:

- Does NOT issue MTQ to generate profit (MTQ is issued only to settle final
  transactions)
- Does NOT profit from MTQ issuance (MITHQAL earns transparent infrastructure
  fees, not issuance profits)
- Does NOT use token issuance as a revenue source (issuance is a settlement
  operation, not a revenue operation)
- Does NOT maximize token issuance (issuance is demand-driven, not
  profit-driven)

### 4.27.3 The Revenue Sequence Rule

The revenue sequence rule (§2.1.4) is:

1. Legal eligibility
2. Institutional authorization
3. Reserve/funding verification
4. Risk checks
5. Issuance
6. Fee accounting

Fee accounting is the LAST step, not the first. The fee does not drive the
issuance; the issuance is driven by the settlement need.

### 4.27.4 Permitted Language

- "Demand-driven settlement infrastructure"
- "Transparent infrastructure fee model"
- "Settlement infrastructure (not an issuance-for-profit scheme)"

## 4.28 Prohibited Descriptions Reference Table

The table below summarizes the prohibited descriptions and their permitted
alternatives.

| # | Prohibited Description | Permitted Alternative |
|---|----------------------|----------------------|
| 1 | Cryptocurrency | Permissioned wholesale settlement instrument |
| 2 | Retail application | Wholesale institutional settlement |
| 3 | Bank | Settlement infrastructure provider |
| 4 | Stablecoin | Permissioned wholesale settlement instrument |
| 5 | USD-pegged | PAR-referenced |
| 6 | Sovereign currency | Permissioned wholesale settlement instrument |
| 7 | CBDC | Permissioned wholesale settlement instrument (CBDC interoperability layer) |
| 8 | Central bank | Settlement infrastructure provider |
| 9 | Exchange | Settlement infrastructure |
| 10 | Brokerage | Settlement infrastructure provider |
| 11 | Market maker | Settlement infrastructure provider |
| 12 | Lender | Settlement infrastructure |
| 13 | Investment manager | Settlement infrastructure |
| 14 | Wealth manager | Settlement infrastructure |
| 15 | Trade-finance institution | Settlement infrastructure |
| 16 | DeFi protocol | Permissioned institutional settlement infrastructure |
| 17 | Speculative vehicle | Settlement instrument |
| 18 | Custodian (by default) | Non-custodial by default |
| 19 | SWIFT replacement | Settlement infrastructure (uses SWIFT for messaging) |
| 20 | Bank-core replacement | Settlement infrastructure (interoperates with bank core banking) |
| 21 | Sovereign reserve asset holder | Settlement backing pool |
| 22 | Financial guarantor | Settlement infrastructure (not a financial guarantor) |
| 23 | Government authority | Private institutional settlement infrastructure |
| 24 | Sanctions-evasion infrastructure | Sanctions-compliant settlement infrastructure |
| 25 | Anonymity network | Privacy-preserving settlement infrastructure |
| 26 | Token-issuance-for-profit scheme | Demand-driven settlement infrastructure |

## 4.29 Permitted-vs-Prohibited Language Matrix

The matrix below provides the full permitted-vs-prohibited language reference.

### 4.29.1 Identity Language

| Topic | Prohibited | Permitted |
|-------|-----------|-----------|
| What MITHQAL is | Cryptocurrency, stablecoin, bank, exchange | Neutral wholesale settlement infrastructure |
| What MTQ is | Cryptocurrency, stablecoin, USD-pegged token | Permissioned wholesale settlement instrument |
| Reference | USD-pegged, pegged to USD | PAR-referenced, reserve-disciplined |
| Backing | USD-backed, USD reserves | Multi-currency + gold + digital reserve |
| Availability | Retail, anyone can use | Wholesale, institutional-only |
| Trading | Traded on exchanges, speculative | Settlement-only, not traded |

### 4.29.2 Operational Language

| Topic | Prohibited | Permitted |
|-------|-----------|-----------|
| Custody | MITHQAL holds the assets | Non-custodial by default; custodian holds the assets |
| Guarantee | MITHQAL guarantees MTQ | MTQ is backed by the reserve; MITHQAL is not a guarantor |
| Issuance | MITHQAL mints at its discretion | MITHQAL authorizes mints based on the 16-step workflow |
| Trading | MITHQAL trades for profit | Reserve management exists to preserve settlement integrity |
| Privacy | Anonymous transactions | Privacy-preserving, institutionally attributable |
| Sanctions | Sanctions circumvention | Sanctions-compliant; geo-fenced; fail-closed |

### 4.29.3 Institutional Language

| Topic | Prohibited | Permitted |
|-------|-----------|-----------|
| Partners | "Partner" of MITHQAL | "Institution MITHQAL is seeking to engage" |
| Approval | Approved by regulators | PROPOSED for institutional review |
| Validation | Validated by institutions | PROPOSED for institutional validation |
| Production | Production-ready, live | APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED |
| Integration | Bank integration | PROPOSED bank integration (subject to formal agreement) |
| Licensing | Licensed in jurisdiction | REQUIRED_NOT_OBTAINED (in most jurisdictions) |

### 4.29.4 Reserve Language

| Topic | Prohibited | Permitted |
|-------|-----------|-----------|
| Ownership | MITHQAL owns the reserve | Institutions own the reserve; MITHQAL verifies evidence |
| Composition | Hard-coded allocation | Optimizer-derived weights within constitutional corridors |
| Gold | Tokenized gold substitutes for physical | Gold is institutionally allocated physical bullion; tokenized gold is conditional |
| Digital | Algorithmic stablecoins admitted | Algorithmic stablecoins EXCLUDED; DRQS ≥ 7.5 for core |
| USD | USD-backed, USD-pegged | 11-currency diversified reserve; 35% USD ceiling |

## 4.30 Marketing Discipline & Boundary Enforcement

Marketing discipline is constitutional. There is no marketing exception. Every
prohibited description in this section applies to marketing materials with the
same force as it applies to technical specifications.

### 4.30.1 Marketing Discipline Rules

1. **No prohibited description may appear in any marketing material.** This
   includes websites, whitepapers, pitch decks, social media, conference
   presentations, and verbal pitches.

2. **No implication of a prohibited description may appear in any marketing
   material.** Implication is as binding as explicit statement.

3. **No suggestion of a prohibited description may appear in any marketing
   material.** Suggestion is as binding as implication.

4. **No marketing material may claim production authorization.** The current
   status is APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT
   PRODUCTION-AUTHORIZED.

5. **No marketing material may claim institutional validation.** The current
   institutional validation status is 0 of 13 gates passed.

6. **No marketing material may claim bank integration.** No bank is
   contracted; no bank is integrated.

7. **No marketing material may claim regulatory approval.** No license is
   obtained; no jurisdiction is validated.

8. **No marketing material may claim reserve verification.** No live oracle
   feeds; no protected backing live cells; no bank contracts; no custodian
   contracts; no asset contracts.

9. **No marketing material may use the word "partner" to describe an
   institution.** Institutions are "institutions MITHQAL is seeking to engage,"
   never "partners."

10. **No marketing material may use the word "APPROVED" except in the
    forbidden-values warning.** The only approved status is APPROVED CANDIDATE
    FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

### 4.30.2 Boundary Enforcement

The marketing discipline is enforced by:

1. **Pre-publication review:** Every marketing material is reviewed by the
   Operating Company's compliance function before publication.
2. **Periodic audit:** The Foundation's read-only oversight function audits
   marketing materials periodically.
3. **Contradiction scan:** The contradiction scan (§77) scans all source files
   for 17 prohibited patterns. Currently 0 unresolved.
4. **Honest state enforcement:** The §74 honest state declaration is binding on
   all marketing materials.
5. **Forbidden values:** The forbidden-values warning (above) lists the values
   that may not appear in any marketing material except in the warning itself.

### 4.30.3 Forbidden Values Warning

The following values may NOT appear in any marketing material except in this
warning itself:

1. "APPROVED" (except in the status "APPROVED CANDIDATE FOR CONTROLLED
   TESTING — NOT PRODUCTION-AUTHORIZED")
2. "PRODUCTION-AUTHORIZED" (except in negation)
3. "PRODUCTION-READY" (except as a state that has not been reached)
4. "VALIDATED" (except as a state that has not been reached)
5. "LICENSED" (except in negation)
6. "INTEGRATED" (when describing a bank relationship, except in negation)
7. "PARTNER" (except in the disclaimer context)
8. "LIVE" (when describing reserve backing, oracle feeds, or institutional
   data, except in negation)
9. "CRYPTOCURRENCY" (except in negation)
10. "STABLECOIN" (except in negation)
11. "USD-PEGGED" (except in negation)
12. "GUARANTEED" (when describing MTQ or bank obligations, except in negation)

### 4.30.4 The Honest Marketing Standard

The honest marketing standard is:

> **Every marketing material must disclose the true state of MITHQAL. The true
> state is: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT
> PRODUCTION-AUTHORIZED. 0 of 13 institutional validation gates passed. 0
> licenses obtained. 0 bank contracts signed. 0 custodian contracts signed. 0
> asset contracts signed. 0 live oracle feeds. 0 protected backing live
> cells. 0 validated jurisdictions. 0 legal opinions obtained.**

Any marketing material that does not disclose this state is in constitutional
breach.

### 4.30.5 The Boundary Enforcement Summary

The MITHQAL identity boundaries are:

1. MITHQAL is a neutral wholesale settlement infrastructure.
2. MTQ is a permissioned wholesale settlement instrument.
3. MTQ is PAR-referenced, not USD-pegged.
4. MTQ is reserve-disciplined, not speculative.
5. MTQ is wholesale, not retail.
6. MTQ is permissioned, not permissionless.
7. MTQ is institutionally attributable, not anonymous.
8. MTQ is settlement-only, not a currency substitute.
9. MITHQAL is non-custodial by default.
10. MITHQAL is not a financial guarantor.
11. MITHQAL is not a bank, not an exchange, not a brokerage, not a market
    maker, not a lender, not an investment manager, not a wealth manager, not
    a trade-finance institution, not a DeFi protocol, not a speculative
    vehicle.
12. MITHQAL is not a SWIFT replacement, not a bank-core replacement.
13. MITHQAL is not a sovereign reserve asset holder.
14. MITHQAL is not a government authority.
15. MITHQAL is not sanctions-evasion infrastructure.
16. MITHQAL is not an anonymity network.
17. MITHQAL is not a token-issuance-for-profit scheme.

These boundaries are constitutional. They cannot be amended, waived, or
overridden by any governance body, commercial pressure, regulatory inquiry, or
operational convenience. Any communication that violates these boundaries is a
constitutional breach requiring immediate correction.

---

**END OF PART 01 — SECTIONS 0-4**

<!-- PART 01 — END -->

---

## APPENDIX 01.A — Part 01 Reference Summary

This appendix summarizes the controlling values used throughout Part 01. All
values are from the canonical MITHQAL v25.2 reference.

### Reserve Architecture

| Parameter | Value |
|-----------|-------|
| PAR | 1.00 |
| RR target | 130% |
| RR policy floor | 105% |
| RR absolute floor | 100% |
| Fiat sleeve (normal) | 80% (corridor 70–85%) |
| Bullion sleeve (normal) | 18% (corridor 15–25%) |
| Digital sleeve (normal) | 2% (corridor 0–5%) |
| Emergency resilience capacity | 15% (separate, non-double-counted) |
| Per-currency hard effective cap | 20% |
| Per-currency preferred effective | 15% |
| Per-currency constitutional sanity ceiling | 60% (non-overriding) |
| USD effective ceiling | 35% |
| Per-currency minimum floor | 0.5% |

### Currency Universe

| Category | Count | Currencies |
|----------|------:|------------|
| Core reserve | 11 | USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD |
| Settlement / conversion | 10 | EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB |

### Finality Enforcement

| Parameter | Value |
|-----------|-------|
| Finality invariant | NO FINAL SETTLEMENT ⇒ NO MTQ MINT |
| Finality layers | 7 of 7 enforced at code level |
| Bypass routes tested | 10 |
| Bypass routes blocked | 10 |
| Bypass routes bypassed | 0 |
| Finality bypass risk | MITIGATED_AT_CODE_LEVEL |
| Finality production ready | FALSE |

### Organizational Structure

| Entity | Type | Role |
|-------|------|------|
| Founder Shareholders | For-profit | Provide initial capitalization |
| MITHQAL Holding | For-profit parent | Owns 100% of subsidiaries |
| MITHQAL Operating Company | For-profit operator | Operates MBG; Monetary & Reserve Control Division |
| MITHQAL Technology Company | For-profit technology | Owns MITHQAL Core; IP; security |
| MITHQAL Foundation | Non-profit | READ-ONLY aggregate oversight |

### Honest State Summary

| Field | Value |
|-------|-------|
| honest | true |
| productionAuthorized | false |
| noMithqalOwnedReserve | true |
| noMithqalFinancialGuarantee | true |
| threeBookDesign | true |
| threeBookOperational | false |
| threeBookEnforced | false |
| finalityLayersEnforced | 7 |
| finalityProductionReady | false |
| legalOpinionsObtained | false |
| validatedJurisdictions | 0 |
| licensesObtained | 0 |
| bankDefaultContractValidated | false |
| protectedBackingLiveCells | 0 |
| reservePolicyStatus | CANDIDATE_MODEL_VALIDATION_PENDING |
| acceptanceCriteriaMet | 19 of 23 (83%) |
| institutionalValidationGatesPassed | 0 of 13 |

### Final Status

> **APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.**

---

## APPENDIX 01.B — Part 01 Cross-Reference Table

The following table cross-references Part 01 sections to the canonical
blueprint sections and source modules.

| Part 01 Section | Canonical § | Source Module | Lines |
|----------------|-------------|---------------|------:|
| §0 — Executive Summary | §§0, 87, 88, 91, 94, V25.2.AUDIT-CLOSURE.9-13 | `src/lib/implementation-status-report.ts` | ~290 |
| §1 — Mission, Vision & Strategic Objective | §§V25.0.0-V25.0.10, 22, V25.2.AUDIT-CLOSURE | `src/lib/institutional/types.ts` | 399 |
| §2 — Constitutional Principles | §§47-54, 74, 77, 87, 91, 94, V25.2.AUDIT-CLOSURE | All P1 modules | ~5,805 |
| §3 — What MITHQAL Is | §§V25.0.1-V25.0.9, V25.2.0-V25.2.17 | `src/lib/v25-0-identity.ts`, `src/lib/mtq-final-reserve-spec.ts` | 1,234+ |
| §4 — What MITHQAL Is Not | §§V25.0.0 (Rule 0.3, 0.4, 0.13), V25.0.13, 77, 94 | `src/lib/contradiction-scan.ts` | ~280 |

---

## APPENDIX 01.C — Part 01 Change Log

| Date | Change | Authority |
|------|--------|-----------|
| v25.2 publication | Initial publication of Part 01 (Sections 0-4) as Single Source of Truth | COO + CTO + CFO + PM + MSA + IRM + LRA |
| v25.2 audit closure | Reconciliation of all P1 critical-gap frameworks; honest state aggregated; 7/7 finality enforced; 0/13 gates passed | COO + CTO + Institutional Governance Auditor |

---

**END OF PART 01 — MITHQAL MASTER BLUEPRINT v25.2 — SECTIONS 0-4**

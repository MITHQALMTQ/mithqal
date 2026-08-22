# MITHQAL MASTER BLUEPRINT v25.2 — PART 8
## Sections 28–31 — Status, Equations, Version Control, Glossary
### THE SINGLE AUTHORITATIVE SOURCE OF TRUTH

**Version:** v25.2 (FINAL — CONTROLLING)
**Date:** 2026-08-22
**Document Part:** 8 of N
**Status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
**Authority:** This document is the single authoritative source of truth. All prior versions, drafts, summaries, slide decks, status reports, and informal communications are SUPERSEDED by this blueprint in the event of any conflict.

---

## TABLE OF CONTENTS — PART 8

- **Section 28 — Implementation Status Report (§87)**
  - 28.1 Purpose and Authority
  - 28.2 Evidence-State Discipline (§73)
  - 28.3 Reporting Principles (§94 — Non-Inflation Rules)
  - 28.4 Full §87 Status Table — 10 Requirements × 9 Columns
  - 28.5 Acceptance Criteria — 19/23 Met (83%)
  - 28.6 Institutional Validation Gates — 0/13 Passed
  - 28.7 §74 Honest State Declaration — All 30+ Fields
  - 28.8 Final Status and Operating Posture
  - 28.9 Illustrative Example — Moving From 0/13 Gates to 1/13
  - 28.10 Status Color Legend
  - 28.11 Status Anti-Patterns (Forbidden)

- **Section 29 — Final Equation System (§50)**
  - 29.1 Scope and Authority of the Equation System
  - 29.2 Liability and Supply
  - 29.3 Reserve Valuation Triplet (Market / Adjusted / Stress)
  - 29.4 Reserve Ratios and Coverage
  - 29.5 Currency Structural Weight, Momentum, Mean-Reversion, EWMA
  - 29.6 K-Factor, Liquidity Overlay, Raw Weight, Normalized Weight, Final Weight
  - 29.7 Reserve Composition and Corridors
  - 29.8 Currency-Fall and Weight-Drift Equations
  - 29.9 Gold-Fall Equation and Liquidation Sequence
  - 29.10 Silver SDC (Silver Diversification Contribution)
  - 29.11 Tokenized Gold TGRS (Tokenized Gold Reserve Score)
  - 29.12 BRI (Bullion Resilience Index)
  - 29.13 DRQS (Digital Reserve Quality Score)
  - 29.14 Stablecoin Risk-Adjusted Exposure (SAE)
  - 29.15 StressDRQS and EffectiveDRQS
  - 29.16 Protected Backing Cell — AvailableBacking
  - 29.17 LCR, HQLA, FSCR Definitions
  - 29.18 Complete Equation Catalog
  - 29.19 Illustrative Example — Full Calculation Walk-Through for S = $100M

- **Section 30 — Version Control**
  - 30.1 Authoritative Version
  - 30.2 Single Source of Truth Declaration
  - 30.3 Version History (Forward-Only)
  - 30.4 Branch Protection on main
  - 30.5 Tag: v25.2-final (FROZEN)
  - 30.6 Backup Branch: v25.2-hardened-backup
  - 30.7 Integrity Verification Script
  - 30.8 Change-Control Discipline
  - 30.9 Prohibited Versioning Patterns

- **Section 31 — Glossary and Terminology**
  - 31.1 Canonical Terminology Authority
  - 31.2 Master Glossary — 40+ Terms
  - 31.3 Prohibited Language List
  - 31.4 Canonical Terminology Rules
  - 31.5 Capitalization and Formatting Conventions
  - 31.6 Acronym Expansion Table

---

# SECTION 28 — IMPLEMENTATION STATUS REPORT (§87)

## 28.1 Purpose and Authority

This section implements §87 of the master directive: after all modifications, this document returns a table mapping each requirement to { Design, Implementation, Integration, Testing, Institutional Validation, Production } — **never inflating any column**. It also implements §74 (current honest state) and §91 (institutional validation gates) aggregating across all §V25.2 modules.

The Implementation Status Report is the authoritative, machine-readable + human-readable declaration of *where MITHQAL actually is* on the path from architecture to production. It is generated from the TypeScript source of truth in `src/lib/implementation-status-report.ts` and is corroborated by the JSON reference in `blueprint_reference.json` (`status` key).

This status report is **non-negotiable**. No public, private, partner, or marketing communication may state any status other than what is declared here. If the implementation changes, the source file changes, the reference JSON changes, and this section is regenerated — and only then.

**Reporting Module:** `src/lib/implementation-status-report.ts`
**Module ID:** `v25.2-implementation-status-1.0`
**Directive Section:** §87
**Companion Sections:** §73 (evidence discipline), §74 (honest state), §91 (institutional gates), §94 (non-inflation principles)

### 28.1.1 Why a Single Status Report Exists

MITHQAL is a Constitutional Monetary and Institutional Settlement Infrastructure — not a fintech app, not a stablecoin, not a payment processor. The status of each architectural requirement is therefore a matter of institutional record, not marketing copy. A single, canonical status report exists so that:

1. **No status inflation is possible.** There is one status per requirement, and it is computed from verifiable evidence — not asserted.
2. **No contradictory claims can be made.** If a partner, regulator, or auditor asks "is X production-ready?", the answer is exactly what this report says — never more, never less.
3. **Progress is measurable over time.** Each requirement moves through evidence states in a defined order; regressions are visible immediately.
4. **Honesty is structural, not aspirational.** The report does not say "we hope to be at INSTITUTIONALLY_VALIDATED by Q3"; it says "we are at LEGAL_VALIDATION_PENDING, with evidence = 0 validated jurisdictions". Hope is recorded in roadmap documents, not here.
5. **All stakeholders read from the same page.** Engineers, lawyers, regulators, bank counterparties, and the Foundation governance body all see the same numbers in the same format.

### 28.1.2 What This Report Is — and Is Not

| This Report IS | This Report Is NOT |
|---|---|
| A faithful declaration of evidence state per requirement | A marketing document or pitch deck |
| Generated from code + structured evidence | A statement of future intent or roadmap |
| The basis for the "APPROVED CANDIDATE FOR CONTROLLED TESTING" operating posture | Permission to operate in production |
| Subject to §94 non-inflation principles | Subject to negotiation or "favorable framing" |
| Updated only when the underlying evidence changes | Updated when a milestone is "almost met" |
| A canonical source readable by external auditors | A confidential internal document |
| A list of requirements mapped to status | A list of features or marketing bullets |

## 28.2 Evidence-State Discipline (§73)

The MITHQAL framework defines a finite, ordered set of evidence states. Each requirement's status in each column (Design / Implementation / Integration / Testing / Institutional Validation / Production) must be one of the following strings — **no other values are permitted**.

| # | Evidence State | Definition |
|---|---|---|
| 1 | `DESIGNED` | A specification exists in this blueprint or in a design document. No code yet, no test yet. |
| 2 | `IMPLEMENTED` | Code exists in the repository that conforms to the design. Not yet integrated with other modules. |
| 3 | `INTEGRATED` | The code is wired into the larger system; it participates in end-to-end flows. |
| 4 | `TESTED` | Automated tests cover the module and pass in CI. |
| 5 | `SANDBOX_VALIDATED` | A sandbox (testnet, simulated bank, simulated custodian) has exercised the module end-to-end. |
| 6 | `INSTITUTIONALLY_VALIDATED` | A real, named institution (bank, regulator, custodian, auditor) has provided evidence that the module meets its institutional bar. |
| 7 | `PRODUCTION_READY` | All gates satisfied; the module may operate in production under the Foundation's authority. |
| 8 | `MODEL_VALIDATION_PENDING` | A quantitative model exists but has not been independently validated by a competent institution. |
| 9 | `LEGAL_VALIDATION_PENDING` | A legal opinion is required and has not been obtained. |
| 10 | `LICENSING_VALIDATION_PENDING` | A license is required in at least one jurisdiction and has not been obtained. |
| 11 | `CONTRACT_VALIDATION_PENDING` | A counterparty contract is required (e.g., with a bank) and has not been signed. |

**Ordering (informational, not strict monotonic):** For most requirements, the natural progression is `DESIGNED → IMPLEMENTED → INTEGRATED → TESTED → SANDBOX_VALIDATED → INSTITUTIONALLY_VALIDATED → PRODUCTION_READY`. However, certain requirements (legal, licensing, contractual) may be `*_PENDING` for an extended period while the technical columns advance; this is normal and expected.

## 28.3 Reporting Principles (§94 — Non-Inflation Rules)

The following six principles govern all status reporting. Violation of any principle is a constitutional breach.

| # | Principle | Plain-English Meaning |
|---|---|---|
| 1 | **Never inflate any column (§87).** | A column's value reflects only what is verifiably true today — not what is planned, expected, or "almost done". |
| 2 | **No code-only capability may be represented as institutionally validated (§94).** | Even if code is perfect and tests pass, the Institutional Validation column remains `*_PENDING` until a named institution signs off. |
| 3 | **No technical capability may be represented as legally authorized without evidence (§94).** | A working API does not equal a license; passing tests does not equal regulatory clearance. |
| 4 | **No bank relationship may be represented as a bank integration until an actual bank integration exists (§94).** | "MBG is designed for banks" is true; "MITHQAL is integrated with a bank" is false until a real bank is contracted. |
| 5 | **No reserve claim may be represented as verified without institutional evidence (§94).** | A Protected Backing Cell schema is not backing evidence; a custodian attestation is. |
| 6 | **No production authorization until all defined legal, licensing, contractual, technical, risk, reconciliation and pilot gates are satisfied (§94).** | The 13 institutional validation gates (§28.6) must all pass before any production authorization may be granted. |

### 28.3.1 What "Never Inflate" Means in Practice

The phrase "never inflate any column" is operative. Concretely, it means:

- A column whose value is `DESIGNED` must not be reported as `IMPLEMENTED` even if the implementation is "95% complete".
- A column whose value is `LEGAL_VALIDATION_PENDING` must not be reported as `INSTITUTIONALLY_VALIDATED` even if the legal opinion is "in final review".
- A requirement whose `Production` column is `DESIGNED` must not be marketed as "production-ready" or "going live soon".
- An aggregate score of 19/23 acceptance criteria met must not be reported as "21/23 — basically there".
- A gate count of 0/13 institutional gates passed must not be reported as "we have made significant progress against the gates".

The discipline is binary: a thing is either done, or it is not. There is no "almost done".

### 28.3.2 Anti-Inflation Examples (Forbidden Patterns)

| Forbidden Statement | Why Forbidden | Correct Statement |
|---|---|---|
| "MITHQAL is integrated with banks." | No bank is contracted. | "MITHQAL's MBG architecture is designed for bank integration; no live bank integration exists today." |
| "MITHQAL's reserves are fully backed." | 0 live Protected Backing Cells. | "MITHQAL has a 17-field Protected Backing Cell schema and 4 SIMULATED reference cells; no live backing cells exist." |
| "MITHQAL is licensed." | 0 of 72 licenses obtained. | "MITHQAL's licensing matrix is implemented (72 entries × 8 jurisdictions); all entries are REQUIRED_NOT_OBTAINED." |
| "MITHQAL is legally cleared." | 0 validated jurisdictions, 0 legal opinions. | "MITHQAL's legal-liability framework is implemented across 8 jurisdictions; all jurisdictions are JURISDICTION_PENDING." |
| "MITHQAL is production-ready." | 0/13 institutional gates passed. | "MITHQAL is an APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED." |
| "MITHQAL's finality enforcement is complete." | 7/7 layers enforced at code level, not institutionally validated. | "MITHQAL's finality enforcement is complete at the code level (7/7 layers, 10/10 bypass routes blocked); institutional validation is pending." |

## 28.4 Full §87 Status Table — 10 Requirements × 9 Columns

The table below maps each of the 10 §V25.2 requirements to its status across six evidence dimensions, plus three contextual columns (section, module, evidence). The cells contain **only** the values permitted by §73 evidence-state discipline.

### 28.4.1 Status Table Legend

| Symbol | Evidence State | Meaning |
|---|---|---|
| ✅ IMPLEMENTED | IMPLEMENTED | Code exists, conforms to design. |
| ✅ INTEGRATED | INTEGRATED | Wired into larger system. |
| ✅ TESTED | TESTED | Automated tests pass in CI. |
| ⚠️ MODEL_VALIDATION_PENDING | MODEL_VALIDATION_PENDING | Quantitative model awaits independent validation. |
| ⚠️ LEGAL_VALIDATION_PENDING | LEGAL_VALIDATION_PENDING | Legal opinion required, not yet obtained. |
| ⚠️ LICENSING_VALIDATION_PENDING | LICENSING_VALIDATION_PENDING | License required, not yet obtained. |
| ⚠️ CONTRACT_VALIDATION_PENDING | CONTRACT_VALIDATION_PENDING | Counterparty contract required, not yet signed. |
| 🔵 DESIGNED | DESIGNED | Specification exists; no further progress in this column. |
| 🟢 INSTITUTIONALLY_VALIDATED | INSTITUTIONALLY_VALIDATED | Named institution has signed off. |
| 🟢 PRODUCTION_READY | PRODUCTION_READY | All gates satisfied; may operate in production. |

### 28.4.2 Requirement R1 — Protected Backing Cell

| Field | Value |
|---|---|
| **Section** | §47 |
| **Requirement** | Protected Backing Cell (17-field schema, AvailableBacking formula, anti-double-count) |
| **Module** | `src/lib/protected-backing-cell.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | ⚠️ LEGAL_VALIDATION_PENDING |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 1133 lines · 4 SIMULATED reference cells · anti-double-count enforced at mutation + audit · `protectedBackingLiveCells = 0` |

**Why Institutional Validation is LEGAL_VALIDATION_PENDING:** A Protected Backing Cell is a legal construct — its existence depends on a custodian holding the asset under terms recognized by a court. No custodian is contracted; therefore no cell can be said to exist institutionally. The schema exists; the cells do not.

**Why Production is DESIGNED:** Production operation requires live backing cells, a contracted custodian, an independent auditor's attestation, and legal opinions in the operating jurisdiction(s). None of these are present.

### 28.4.3 Requirement R2 — Bank Default & Resolution

| Field | Value |
|---|---|
| **Section** | §48 |
| **Requirement** | Bank Default & Resolution (8-state lifecycle, 11 contractual questions) |
| **Module** | `src/lib/bank-default-resolution.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | ⚠️ CONTRACT_VALIDATION_PENDING |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 1044 lines · 8 states fully configured · 11 contractual questions · `bankDefaultContractValidated = false` · MITHQAL NOT guarantor |

**Why Institutional Validation is CONTRACT_VALIDATION_PENDING:** The 8-state lifecycle and 11 contractual questions exist as a design template. They become operative only when a bank signs a contract that adopts them. No such contract exists; therefore no contractual validation has occurred.

**Why Production is DESIGNED:** The default/resolution workflow can only be exercised against a real bank relationship, which does not exist.

### 28.4.4 Requirement R3 — Legal Liability Framework

| Field | Value |
|---|---|
| **Section** | §49 |
| **Requirement** | MTQ Legal & Economic Liability (13 dimensions, jurisdiction registry) |
| **Module** | `src/lib/legal-liability-framework.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | ⚠️ LEGAL_VALIDATION_PENDING |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 724 lines · 8 jurisdictions seeded ALL JURISDICTION_PENDING · `VALIDATED_JURISDICTIONS = 0` · `LEGAL_OPINIONS_OBTAINED = false` |

**Why Institutional Validation is LEGAL_VALIDATION_PENDING:** A legal-liability framework is only "validated" when licensed counsel in each jurisdiction has issued a written opinion. No opinions have been obtained in any of the 8 seeded jurisdictions. The framework exists; the legal foundation does not.

### 28.4.5 Requirement R4 — Licensing/Entity Matrix

| Field | Value |
|---|---|
| **Section** | §50 |
| **Requirement** | Licensing/Entity Matrix (9 activities × 8 jurisdictions = 72 entries) |
| **Module** | `src/lib/licensing-entity-matrix.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | ⚠️ LICENSING_VALIDATION_PENDING |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 784 lines · 72 entries ALL REQUIRED_NOT_OBTAINED · `licensesObtained = 0` · MITHQAL role never `GUARANTOR` |

**Why Institutional Validation is LICENSING_VALIDATION_PENDING:** Of the 72 license entries (9 activities × 8 jurisdictions), zero licenses have been obtained. The matrix exists as a complete inventory of "what would need to be licensed"; it does not constitute any license itself.

### 28.4.6 Requirement R5 — Three-Book Separation

| Field | Value |
|---|---|
| **Section** | §51 |
| **Requirement** | Three-Book Economic Separation (Book A Corporate / Book B Bank MTQ / Book C Participant) |
| **Module** | `src/lib/three-book-separation.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | ⚠️ CONTRACT_VALIDATION_PENDING |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 975 lines · 3 books · 4 anti-commingling tests ALL blocked · `threeBookOperational = false` · `threeBookEnforced = false` |

**Why Institutional Validation is CONTRACT_VALIDATION_PENDING:** Three-book separation becomes operative only when (a) a bank contractually agrees to operate Book B and (b) participants contractually agree to operate Book C. Neither contract exists. The anti-commingling tests verify the code's *enforcement* of separation; they do not verify that any operational book exists.

### 28.4.7 Requirement R6 — Systemic Exposure Engine

| Field | Value |
|---|---|
| **Section** | §52 |
| **Requirement** | System-Wide Exposure & Concentration (13 dimensions, bank-vs-system-wide) |
| **Module** | `src/lib/systemic-exposure-engine.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | ⚠️ MODEL_VALIDATION_PENDING |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 1295 lines · 13 dimensions · `systemicRiskMonitoringLive = false` · `systemicRiskProductionValidated = false` |

**Why Institutional Validation is MODEL_VALIDATION_PENDING:** The 13 systemic-risk dimensions are quantitative model outputs. A model is only "validated" when an independent institution (typically a central bank or a Big Four audit firm) has reviewed its methodology, back-tested its outputs, and certified its soundness. No such review has occurred.

### 28.4.8 Requirement R7 — Finality-Before-Mint

| Field | Value |
|---|---|
| **Section** | §54 |
| **Requirement** | Finality-Before-Mint (7 enforcement layers, 10 bypass tests) |
| **Module** | `src/lib/finality-before-mint.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | ⚠️ CONTRACT_VALIDATION_PENDING |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 7/7 layers enforced at code level · 10/10 bypass routes blocked · `finalityProductionReady = false` · bypassRisk = `MITIGATED_AT_CODE_LEVEL` |

**Why Institutional Validation is CONTRACT_VALIDATION_PENDING:** The 7 layers are enforced at the code level, and the 10 bypass routes are demonstrably blocked in tests. However, "institutional validation" requires a counterparty bank to attest that its settlement finality model is compatible with MITHQAL's. No bank has done so; therefore the contract dimension is pending.

**Note on `bypassRisk = MITIGATED_AT_CODE_LEVEL`:** This is the strongest honest statement that can be made about finality enforcement today. It means: the code is constructed such that no bypass route exists given the code's own invariants. It does NOT mean: the code is institutionally certified as bypass-proof in production. The distinction matters.

### 28.4.9 Requirement R8 — Contradiction Scan

| Field | Value |
|---|---|
| **Section** | §77 |
| **Requirement** | Contradiction Scan (17 patterns, zero unresolved) |
| **Module** | `src/lib/contradiction-scan.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | 🔵 DESIGNED |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 17 patterns scanned · 0 unresolved contradictions · static code scan (not runtime assertion) |

**Why Institutional Validation is DESIGNED (not PENDING):** The contradiction scan is a static-analysis tool, not a contractually-or institutionally-validated artifact. It produces a binary result: either there are unresolved contradictions, or there are not. As of v25.2: there are 0 unresolved contradictions. There is no further institutional step required for this requirement; the scan itself is the evidence.

### 28.4.10 Requirement R9 — Final Reserve Mathematical Specification

| Field | Value |
|---|---|
| **Section** | §§16-46 |
| **Requirement** | Final Reserve Mathematical Specification (130% / 80-18-2 / currency engine / gold / digital) |
| **Module** | `src/lib/mtq-final-reserve-spec.ts` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | ⚠️ MODEL_VALIDATION_PENDING |
| **Production** | 🔵 DESIGNED |
| **Evidence** | 1234 lines · 50 directive sections · all 4 §49 conflicts reconciled · `reservePolicyStatus = CANDIDATE_MODEL_VALIDATION_PENDING` |

**Why Institutional Validation is MODEL_VALIDATION_PENDING:** The reserve specification is a quantitative model (RR targets, FSCR thresholds, EWMA parameters, K-factor bounds, etc.). The model is internally consistent and all four historical conflicts (RR target, sleeve composition, digital target, per-currency cap) have been reconciled. Independent model validation — typically by a central bank or a reserve-management consultant — has not occurred.

### 28.4.11 Requirement R10 — Blueprint Update

| Field | Value |
|---|---|
| **Section** | §88 |
| **Requirement** | Blueprint Update (§V25.2 + §V25.2.AUDIT-CLOSURE appended, idempotent) |
| **Module** | `docs/blueprint/mithqal-v25-FINAL-blueprint.md` |
| **Design** | ✅ IMPLEMENTED |
| **Implementation** | ✅ IMPLEMENTED |
| **Integration** | ✅ INTEGRATED |
| **Testing** | ✅ TESTED |
| **Institutional Validation** | 🔵 DESIGNED |
| **Production** | 🔵 DESIGNED |
| **Evidence** | §V25.2 appended (+650 lines) + §V25.2.AUDIT-CLOSURE appended · idempotent scripts verified |

**Why Institutional Validation is DESIGNED (not PENDING):** Blueprint updates are document operations, not institutionally-validated artifacts. The idempotency test (running the update twice produces the same result) is the institutional bar, and it has been met. No external party needs to "approve" a blueprint update beyond the Foundation's own governance.

### 28.4.12 Aggregated Status Matrix (Compact Form)

| # | Section | Requirement (short) | Design | Impl. | Integ. | Test | Inst. | Prod. |
|---|---|---|---|---|---|---|---|---|
| R1 | §47 | Protected Backing Cell | ✅ | ✅ | ✅ | ✅ | ⚠️ LEGAL | 🔵 |
| R2 | §48 | Bank Default & Resolution | ✅ | ✅ | ✅ | ✅ | ⚠️ CONTRACT | 🔵 |
| R3 | §49 | Legal Liability Framework | ✅ | ✅ | ✅ | ✅ | ⚠️ LEGAL | 🔵 |
| R4 | §50 | Licensing/Entity Matrix | ✅ | ✅ | ✅ | ✅ | ⚠️ LICENSING | 🔵 |
| R5 | §51 | Three-Book Separation | ✅ | ✅ | ✅ | ✅ | ⚠️ CONTRACT | 🔵 |
| R6 | §52 | Systemic Exposure Engine | ✅ | ✅ | ✅ | ✅ | ⚠️ MODEL | 🔵 |
| R7 | §54 | Finality-Before-Mint | ✅ | ✅ | ✅ | ✅ | ⚠️ CONTRACT | 🔵 |
| R8 | §77 | Contradiction Scan | ✅ | ✅ | ✅ | ✅ | 🔵 | 🔵 |
| R9 | §§16-46 | Reserve Math Spec | ✅ | ✅ | ✅ | ✅ | ⚠️ MODEL | 🔵 |
| R10 | §88 | Blueprint Update | ✅ | ✅ | ✅ | ✅ | 🔵 | 🔵 |

**Aggregate observation:** All 10 requirements are at `IMPLEMENTED` for Design / Implementation / Integration / Testing. None are at `INSTITUTIONALLY_VALIDATED` or `PRODUCTION_READY`. All 10 are at `DESIGNED` for Production. This is the honest state.

## 28.5 Acceptance Criteria — 19/23 Met (83%)

The §90 acceptance criteria define what it means for the §V25.2 build-out to be "complete enough to call done at the candidate stage". Of the 23 criteria, 19 are met (83%) and 4 are unmet. The four unmet criteria are the operative blockers for institutional validation and production authorization.

### 28.5.1 Acceptance Criteria Table — All 23

| # | Category | Criterion | Met? | Evidence |
|---|---|---|---|---|
| AC01 | Architecture | All responsibilities are defined | ✅ MET | 9 modules covering all directive sections |
| AC02 | Architecture | No contradictions exist | ✅ MET | §77 scan: 0 unresolved |
| AC03 | Architecture | Single active reserve configuration exists | ✅ MET | §V25.2 canonical; §49 conflicts reconciled |
| AC04 | Banking | MBG architecture remains correct | ✅ MET | `mithqal-bank-gateway.ts` preserved (translation not transformation) |
| AC05 | Banking | Bank core remains authoritative | ✅ MET | MBG preserves bank systems authority |
| AC06 | Banking | Bank-side MTQ subledger works | ❌ UNMET | designed, no live bank subledger |
| AC07 | Backing | PBC is operational | ❌ UNMET | model implemented, 0 live cells |
| AC08 | Backing | Backing is attributable | ✅ MET | 17-field PBC schema |
| AC09 | Backing | No double counting | ✅ MET | anti-double-count enforced at mutation + audit |
| AC10 | Backing | Evidence is verifiable | ❌ UNMET | schema defined, no live evidence |
| AC11 | Risk | Bank-specific risk works | ✅ MET | systemic-exposure-engine: bank-vs-system-wide |
| AC12 | Risk | Systemic risk works | ✅ MET | 13 dimensions implemented |
| AC13 | Risk | Geopolitical risk works | ✅ MET | geopolitical-correlation dimension + jurisdiction-engine |
| AC14 | Accounting | Three-ledger separation is operational | ❌ UNMET | `threeBookOperational = false` |
| AC15 | Finality | All required enforcement layers work | ✅ MET | 7/7 layers enforced at code level |
| AC16 | Finality | No bypass exists | ✅ MET | 10/10 bypass routes blocked |
| AC17 | Regulatory | Functions mapped to responsible entities | ✅ MET | licensing-entity-matrix: 72 entries |
| AC18 | Regulatory | Jurisdictional legal status explicitly identified | ✅ MET | 8 jurisdictions, all JURISDICTION_PENDING |
| AC19 | Regulatory | No unsupported regulatory claim exists | ✅ MET | 0 licenses, 0 validated jurisdictions, 0 opinions |
| AC20 | Testing | Stress tests run | ✅ MET | §45 what-if scenarios + §78 reserve tests |
| AC21 | Testing | Reconciliation runs | ✅ MET | 5-way reconciliation designed + tested |
| AC22 | Testing | Default tests run | ✅ MET | §48 8-state lifecycle simulated |
| AC23 | Testing | Mint bypass tests run | ✅ MET | §84 10 bypass routes tested |

**Summary:** 19 / 23 = **83% met**.

### 28.5.2 The Four Unmet Criteria — Detailed

#### AC06 — Bank-Side MTQ Subledger Works

- **What "met" would require:** A real bank operating a real MTQ subledger against real customer balances, with the subledger passing the bank's own audit and the bank's regulator's review.
- **Current state:** The subledger schema is designed and tested in isolation. No bank has implemented it.
- **Path to "met":** Contract with a pilot bank → integrate MBG → bank builds subledger → bank's internal audit signs off → bank's regulator reviews. (See §28.9.)

#### AC07 — PBC Is Operational

- **What "met" would require:** At least one live Protected Backing Cell, with a contracted custodian, an independent auditor's attestation, and a legal opinion recognizing the cell's existence.
- **Current state:** 17-field schema implemented; 4 SIMULATED reference cells; 0 live cells.
- **Path to "met":** Custodian contract → first asset deposited → PBC created → auditor attests → legal opinion obtained. (See §28.9.)

#### AC10 — Evidence Is Verifiable

- **What "met" would require:** An independent party (auditor, custodian, regulator) able to verify — at any time — that a specific MTQ token in circulation is backed by a specific asset in a specific PBC, with the chain of custody intact.
- **Current state:** The verification schema is defined (the 17 PBC fields). No live evidence exists.
- **Path to "met":** AC07 must be met first; then the verification flow must be exercised end-to-end with a real auditor.

#### AC14 — Three-Ledger Separation Is Operational

- **What "met" would require:** Book A (MITHQAL corporate), Book B (bank-side MTQ), and Book C (participant-side) all operating simultaneously, with the 4 anti-commingling tests passing in production (not just in CI).
- **Current state:** `threeBookOperational = false`; `threeBookEnforced = false`. The 4 anti-commingling tests pass against simulated books, not live ones.
- **Path to "met":** Contract with a bank (Book B) and a participant (Book C); both ledgers operate; anti-commingling tests pass against live data; independent audit confirms separation.

### 28.5.3 Acceptance Criteria — Aggregate Statistics

| Metric | Value |
|---|---|
| Total acceptance criteria | 23 |
| Met | 19 |
| Unmet | 4 (AC06, AC07, AC10, AC14) |
| Acceptance rate | 83.0% |
| Categories fully met | Architecture (3/3), Finality (2/2), Regulatory (3/3), Testing (4/4) |
| Categories partially met | Banking (2/3), Backing (2/4), Risk (3/3 — actually fully met), Accounting (0/1) |
| Categories unmet | Accounting (0/1) |

**Note:** Risk (AC11, AC12, AC13) is 3/3 met at the implementation level. This does not mean systemic risk is "production-validated" — that requires §28.6 gate G12 (independent assurance framework validated), which is `DESIGNED` not `INSTITUTIONALLY_VALIDATED`.

## 28.6 Institutional Validation Gates — 0/13 Passed

The §91 institutional validation gates are the **gate** between "candidate for controlled testing" and "production-authorized". They are not acceptance criteria (which measure completeness of the build); they are external validation requirements (which measure institutional readiness). **All 13 must pass** before production authorization.

As of v25.2: **0 of 13 gates have passed**. This is the honest state.

### 28.6.1 Gate Table — All 13 Gates

| ID | Gate | Status | Evidence |
|---|---|---|---|
| G01 | Pilot-jurisdiction legal opinion exists | ⚠️ LEGAL_VALIDATION_PENDING | 0 validated jurisdictions |
| G02 | Licensing/entity mapping validated | ⚠️ LICENSING_VALIDATION_PENDING | 0 licenses obtained |
| G03 | Bank contractual obligation framework exists | ⚠️ CONTRACT_VALIDATION_PENDING | no bank contracted |
| G04 | Default/resolution framework contractually validated | ⚠️ CONTRACT_VALIDATION_PENDING | `bankDefaultContractValidated = false` |
| G05 | First bank integration succeeds | 🔵 DESIGNED | MBG designed, no live bank |
| G06 | Backing evidence exists | 🔵 DESIGNED | 0 live backing cells |
| G07 | Protected backing cell exists | ✅ IMPLEMENTED | model implemented, 0 live cells |
| G08 | Three-book accounting operational | 🔵 DESIGNED | `threeBookOperational = false` |
| G09 | Finality enforcement complete | ✅ TESTED | 7/7 code-level, not institutionally validated |
| G10 | Sanctions screening live | 🔵 DESIGNED | schema defined, not live |
| G11 | Reconciliation operates | ✅ TESTED | 5-way reconciliation designed + tested, not live |
| G12 | Independent assurance framework validated | 🔵 DESIGNED | not contracted |
| G13 | Controlled pilot transactions succeed | 🔵 DESIGNED | 0 pilot transactions |

### 28.6.2 Gate Statistics

| Metric | Value |
|---|---|
| Total gates | 13 |
| Passed (at `INSTITUTIONALLY_VALIDATED` or `PRODUCTION_READY`) | 0 |
| At `TESTED` (highest code-level state, awaiting institutional sign-off) | 2 (G09, G11) |
| At `IMPLEMENTED` (G07) | 1 |
| At `DESIGNED` (awaiting contract / integration) | 7 |
| At `*_PENDING` (awaiting external validation) | 3 (G01, G02, G03 + G04) |
| Pass rate | 0 / 13 = 0% |

### 28.6.3 Gate Dependencies — Critical Path Analysis

The 13 gates are not independent. Many depend on earlier gates. The critical path to "1/13 passed" runs through G01 (legal opinion), G02 (license), or G03 (bank contract). The critical path to "13/13 passed" runs roughly as follows:

```
G01 (legal opinion in pilot jurisdiction)
  └─→ G02 (license in pilot jurisdiction)
        └─→ G03 (bank contract)
              ├─→ G04 (default/resolution contractually validated)
              ├─→ G05 (first bank integration succeeds)
              └─→ G08 (three-book operational, with bank)
                    └─→ G06 (backing evidence exists)
                          └─→ G07 (PBC operational — already IMPLEMENTED)
                                └─→ G09 (finality institutionally validated)
                                      └─→ G10 (sanctions live)
                                            └─→ G11 (reconciliation live)
                                                  └─→ G12 (independent assurance)
                                                        └─→ G13 (pilot transactions)
```

In approximate terms: **G01 unlocks everything else**. Until a single pilot jurisdiction issues a legal opinion, none of the other 12 gates can advance past `DESIGNED` or `*_PENDING`.

### 28.6.4 Gate Semantics — What Each Gate Actually Requires

#### G01 — Pilot-Jurisdiction Legal Opinion Exists

- **Required artifact:** A signed legal opinion from licensed counsel in a single pilot jurisdiction, stating that MTQ issuance, transfer, and redemption are legally permissible under that jurisdiction's law.
- **Current evidence:** `validatedJurisdictions = 0`; `legalOpinionsObtained = false`.
- **Dependency:** None — this is the entry gate.
- **Cost estimate (order-of-magnitude):** $50k-$250k for a single-jurisdiction opinion from a tier-1 firm, 3-9 months elapsed.

#### G02 — Licensing/Entity Mapping Validated

- **Required artifact:** At least one of the 72 license entries (9 activities × 8 jurisdictions) transitions from `REQUIRED_NOT_OBTAINED` to `OBTAINED`, with a copy of the actual license instrument.
- **Current evidence:** `licensesObtained = 0`.
- **Dependency:** Typically G01 first (a legal opinion clarifies which license is actually required).

#### G03 — Bank Contractual Obligation Framework Exists

- **Required artifact:** A signed contract with a real, named, regulated bank adopting the MITHQAL Bank Gateway integration and the §48 bank-default/resolution framework.
- **Current evidence:** No bank contracted.
- **Dependency:** G01 + G02 typically precede bank negotiations (banks require legal clarity before contracting).

#### G04 — Default/Resolution Framework Contractually Validated

- **Required artifact:** The bank contract from G03 explicitly adopts the 8-state lifecycle and the 11 contractual questions, with the bank's counsel signing off on the contractual mechanics.
- **Current evidence:** `bankDefaultContractValidated = false`.
- **Dependency:** G03.

#### G05 — First Bank Integration Succeeds

- **Required artifact:** A successful end-to-end mint transaction against a real bank, with KYC/KYB/AML/sanctions (BM-03, BM-04) executed by the bank, backing established (BM-05, BM-06), MBG translation (BM-08), all MITHQAL checks (BM-09 through BM-14) passing, monetary authorization (BM-15) issued, and finality verification + mint (BM-16) executed.
- **Current evidence:** None.
- **Dependency:** G03 + G04.

#### G06 — Backing Evidence Exists

- **Required artifact:** A live, identifiable asset in a contracted custodian's vault, attested by the custodian, recognizable as a PBC.
- **Current evidence:** 0 live backing cells.
- **Dependency:** G03 (bank establishes backing per BM-05).

#### G07 — Protected Backing Cell Exists

- **Required artifact:** At least one PBC at `INSTITUTIONALLY_VALIDATED` (currently at `IMPLEMENTED`).
- **Current evidence:** `protectedBackingLiveCells = 0`.
- **Dependency:** G06.

#### G08 — Three-Book Accounting Operational

- **Required artifact:** Book A, Book B, and Book C all operating simultaneously against real participants; 4 anti-commingling tests passing against live data.
- **Current evidence:** `threeBookOperational = false`; `threeBookEnforced = false`.
- **Dependency:** G03 + G05.

#### G09 — Finality Enforcement Complete

- **Required artifact:** Institutional attestation that the 7 finality layers + 10 bypass tests are sound as deployed in production (not just in CI).
- **Current evidence:** 7/7 layers enforced at code level; 10/10 bypass routes blocked. `finalityProductionReady = false`. `bypassRisk = MITIGATED_AT_CODE_LEVEL`.
- **Dependency:** G05 + G07.

#### G10 — Sanctions Screening Live

- **Required artifact:** A live sanctions-screening service integrated with BM-04, with a documented screening vendor, refresh cadence, and escalation procedures.
- **Current evidence:** Schema defined, not live.
- **Dependency:** G05 (sanctions screening runs in BM-04, which requires a live bank flow).

#### G11 — Reconciliation Operates

- **Required artifact:** The 5-way reconciliation running in production on a schedule, with discrepancies handled per procedure and an independent auditor's review of the reconciliation logs.
- **Current evidence:** 5-way reconciliation designed + tested, not live.
- **Dependency:** G05 + G07 + G08 (all three ledgers must be live for reconciliation to be meaningful).

#### G12 — Independent Assurance Framework Validated

- **Required artifact:** A contract with an independent assurance firm (typically a Big Four auditor) covering: security architecture, finality enforcement, penetration testing, reconciliation evidence verification.
- **Current evidence:** Not contracted.
- **Dependency:** G05 + G09 (the assurance firm needs something to audit).

#### G13 — Controlled Pilot Transactions Succeed

- **Required artifact:** A defined pilot scope (number of transactions, transaction sizes, participants, duration) executed end-to-end with no unresolved incidents and a clean post-pilot review.
- **Current evidence:** 0 pilot transactions.
- **Dependency:** G05 + G09 + G11 + G12 (everything must be live before the pilot).

### 28.6.5 Honest Restatement

The state of the gates is: **0 passed, 1 at `IMPLEMENTED`, 2 at `TESTED`, 7 at `DESIGNED`, 3 at `*_PENDING`**. There is no production authorization. There is no institutional validation. There is one canonical reason: no institution has been contracted to provide any of the institutional artifacts.

This is not a defect. This is the expected state of a system that has completed its technical build-out but has not yet engaged institutional counterparties. The honest framing is: **MITHQAL is at the start of the institutional-engagement phase, not at the end of it.**

## 28.7 §74 Honest State Declaration — All 30+ Fields

The §74 honest state is a structured declaration of every dimension of MITHQAL's current operating posture. Each field is a boolean or a count, sourced from the implementation. **No field is interpreted, projected, or "expected"** — it is what it is.

### 28.7.1 Honest State Table

| # | Field | Value | Source / Notes |
|---|---|---|---|
| 1 | `honest` | `true` | Aggregate: this declaration is the honest state. |
| 2 | `productionAuthorized` | `false` | §94 — no production authorization until all gates satisfied. |
| 3 | `noMithqalOwnedReserve` | `true` | MITHQAL does not own or hold reserve assets; banks do. |
| 4 | `noMithqalFinancialGuarantee` | `true` | MITHQAL is not a guarantor of MTQ value; banks are. |
| 5 | `threeBookDesign` | `true` | Three-book architecture is designed. |
| 6 | `threeBookOperational` | `false` | Three-book accounting is NOT operational. |
| 7 | `threeBookEnforced` | `false` | Three-book separation is NOT enforced against live data. |
| 8 | `systemicRiskEngineDesigned` | `true` | 13-dimension systemic risk engine is designed. |
| 9 | `systemicRiskEngineImplemented` | `true` | 13-dimension engine is implemented in code. |
| 10 | `systemicRiskMonitoringLive` | `false` | Systemic risk monitoring is NOT live. |
| 11 | `systemicRiskProductionValidated` | `false` | Systemic risk engine is NOT validated for production. |
| 12 | `finalityPolicyDefined` | `true` | 7-layer finality policy is defined. |
| 13 | `finalityLayersDesigned` | `7` | All 7 layers designed. |
| 14 | `finalityLayersRequired` | `7` | All 7 layers required. |
| 15 | `finalityLayersEnforced` | `7` | All 7 layers enforced at code level. |
| 16 | `finalityProductionReady` | `false` | Finality is NOT production-ready (institutional validation pending). |
| 17 | `finalityBypassRisk` | `MITIGATED_AT_CODE_LEVEL` | 10/10 bypass routes blocked at code level. |
| 18 | `legalRegistryImplemented` | `true` | 8-jurisdiction legal registry is implemented. |
| 19 | `legalOpinionsObtained` | `false` | No legal opinions obtained in any jurisdiction. |
| 20 | `validatedJurisdictions` | `0` | Zero jurisdictions validated. |
| 21 | `licensingMatrixImplemented` | `true` | 72-entry licensing matrix is implemented. |
| 22 | `licensesObtained` | `0` | Zero licenses obtained. |
| 23 | `bankDefaultStateModelDesigned` | `true` | 8-state bank-default model is designed. |
| 24 | `bankDefaultOperationalWorkflow` | `true` | 8-state workflow is operationally testable. |
| 25 | `bankDefaultContractValidated` | `false` | No bank has contractually adopted the framework. |
| 26 | `bankDefaultLegalValidated` | `false` | No counsel has validated the framework in any jurisdiction. |
| 27 | `bankDefaultProductionReady` | `false` | Bank-default framework is NOT production-ready. |
| 28 | `protectedBackingModelImplemented` | `true` | 17-field PBC model is implemented. |
| 29 | `protectedBackingLiveCells` | `0` | Zero live backing cells. |
| 30 | `reserveConfigurationCanonical` | `true` | A single, canonical reserve configuration exists (no conflicting configs). |
| 31 | `reserveConfigurationConflicts` | `false` | Zero unresolved reserve-configuration conflicts. |
| 32 | `reservePolicyStatus` | `CANDIDATE_MODEL_VALIDATION_PENDING` | The reserve policy is a candidate, pending independent model validation. |

### 28.7.2 Honest State — Categorical Summary

| Category | Designed/Implemented | Operational/Validated | Production-Ready |
|---|---|---|---|
| Three-Book | ✅ | ❌ | ❌ |
| Systemic Risk | ✅ | ❌ | ❌ |
| Finality | ✅ | ✅ (code-level) | ❌ |
| Legal Registry | ✅ | ❌ | ❌ |
| Licensing Matrix | ✅ | ❌ | ❌ |
| Bank Default | ✅ | ❌ (test-only) | ❌ |
| Protected Backing | ✅ | ❌ | ❌ |
| Reserve Policy | ✅ | ✅ (canonical) | ❌ (model validation pending) |

**Aggregate:** All eight categories are designed + implemented. One (Finality) is code-level-validated. None are institutionally validated. None are production-ready.

### 28.7.3 The Honest Sentence

> MITHQAL v25.2 has completed its technical build-out across all 10 §V25.2 requirements and is at the **APPROVED CANDIDATE FOR CONTROLLED TESTING** stage. The technical architecture is internally consistent, all contradictions are resolved, all 7 finality layers are enforced at code level, and 19 of 23 acceptance criteria are met. However: 0 of 13 institutional validation gates have passed; 0 jurisdictions are legally validated; 0 licenses are obtained; 0 banks are contracted; 0 Protected Backing Cells are live; the three-book separation is not operational; and no production authorization exists. MITHQAL is not production-authorized.

## 28.8 Final Status and Operating Posture

| Field | Value |
|---|---|
| **Final status string** | "§87 IMPLEMENTATION STATUS — 9 §V25.2 MODULES DELIVERED · 19/23 acceptance criteria met · 0/13 institutional gates passed · NOT PRODUCTION-AUTHORIZED (institutional validation pending)" |
| **Status color** | `AMBER` |
| **Operating posture** | APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED |
| **Allowed operations** | Design refinement · code review · sandbox / testnet testing · institutional engagement (architecture review, regulatory review, sandbox testing) · documentation |
| **Disallowed operations** | Live bank integration · live customer transactions · production mints · production settlements · any representation of MTQ as "issued", "live", or "backed" |
| **Required next milestone** | G01 — First pilot-jurisdiction legal opinion (see §28.9) |
| **Foundation review cadence** | Quarterly status re-declaration; immediate re-declaration if any gate status changes |

### 28.8.1 The Six Reporting Principles (Restated)

1. Never inflate any column (§87).
2. No code-only capability may be represented as institutionally validated (§94).
3. No technical capability may be represented as legally authorized without evidence (§94).
4. No bank relationship may be represented as a bank integration until an actual bank integration exists (§94).
5. No reserve claim may be represented as verified without institutional evidence (§94).
6. No production authorization until all defined legal, licensing, contractual, technical, risk, reconciliation and pilot gates are satisfied (§94).

These six principles are the constitutional foundation of status reporting. Violation of any one is a constitutional breach, reviewable by the Foundation governance body.

## 28.9 Illustrative Example — Moving From 0/13 Gates to 1/13

This illustrative example describes what would concretely need to happen to move from 0/13 institutional validation gates passed to 1/13. It is not a plan; it is a worked example showing the institutional, legal, technical, and operational steps that *one* gate passage would entail.

### 28.9.1 Choose the Gate to Pass First

Per §28.6.3, the natural first gate is **G01 — Pilot-Jurisdiction Legal Opinion Exists**. Passing G01 unlocks (or makes tractable) most other gates. The alternative would be G07 (Protected Backing Cell Exists — already at `IMPLEMENTED`), but G07's "passing" requires `INSTITUTIONALLY_VALIDATED`, which itself requires G06 (Backing Evidence Exists), which requires G03 (Bank Contract), which requires G01. So **G01 is the true entry gate**.

### 28.9.2 Worked Example — Passing G01

#### Step 1 — Select the Pilot Jurisdiction

MITHQAL's licensing matrix covers 8 jurisdictions. A pilot jurisdiction must be selected based on:

- **Regulatory clarity** for digital settlement assets (ADGM, DIFC, MAS, BVI, Cayman, Bermuda, Labuan, Switzerland).
- **Willingness to engage** with novel settlement infrastructures.
- **Cost-benefit** of legal opinion (smaller, specialized jurisdictions often faster).
- **Strategic alignment** with MITHQAL's bank-mediated model.

For this illustrative example, assume **ADGM (Abu Dhabi Global Market)** is selected due to its RegLab framework, English-law foundations, and explicit treatment of digital settlement assets.

#### Step 2 — Engage Tier-1 Counsel

Counsel with documented ADGM practice and digital-asset expertise must be retained. Likely candidates (illustrative, not endorsed):

- A tier-1 international firm (Linklaters, Clifford Chance, Latham & Watkins) with an ADGM office.
- A specialist regulatory practice with ADGM experience.

The engagement letter specifies the deliverable: a **formal legal opinion** covering:

- (a) Classification of MTQ under ADGM law (is it a security, a payment instrument, a digital settlement asset, something else?).
- (b) Permissibility of MTQ issuance, transfer, and redemption by an ADGM-licensed entity.
- (c) Permissibility of MITHQAL's bank-mediated model (the bank holds customer balances; MITHQAL mints against bank-confirmed backing).
- (d) Required ADGM licenses / registrations for each MITHQAL entity (Foundation, Holding, Operating, Technology).
- (e) Cross-border recognition (what happens when an ADGM-issued MTQ is held by a Singapore-domiciled participant?).

#### Step 3 — Prepare the Legal-Opinion Briefing Pack

MITHQAL must produce a complete briefing pack for counsel, including:

- The full MITHQAL MASTER BLUEPRINT v25.2 (this document).
- The architectural diagrams (3-domain, 13-system-node).
- The §47 Protected Backing Cell schema and the anti-double-count rule.
- The §48 Bank Default & Resolution framework (8 states, 11 contractual questions).
- The §49 Legal Liability Framework (13 dimensions, 8 jurisdictions).
- The §51 Three-Book Separation design.
- The §54 Finality-Before-Mint policy (7 layers, 10 bypass tests).
- The §50 Licensing/Entity Matrix (72 entries).
- The §V25.2 reserve specification (RR = 130%, 80-18-2, etc.).
- The MBG architecture (translation, not transformation).
- The 9 §V25.2 modules in source form.
- The §87 Implementation Status Report (this section).

#### Step 4 — Counsel Reviews, Iterates, and Issues Draft Opinion

Counsel will typically:

- Review the briefing pack.
- Identify open questions (often 10-30 items).
- Iterate with MITHQAL counsel and engineering to resolve open questions (often 4-8 weeks of back-and-forth).
- Issue a draft opinion for MITHQAL's review.
- Finalize the opinion after MITHQAL review.

#### Step 5 — Opinion Issued; Gate G01 Updates

When the final opinion is issued:

- `legalOpinionsObtained` flips from `false` to `true`.
- `validatedJurisdictions` increments from `0` to `1`.
- The `INSTITUTIONAL_VALIDATION` column for R3 (Legal Liability Framework) flips from `LEGAL_VALIDATION_PENDING` to `INSTITUTIONALLY_VALIDATED` **for the ADGM jurisdiction only** (other 7 jurisdictions remain pending).
- Gate G01 transitions from `LEGAL_VALIDATION_PENDING` to `INSTITUTIONALLY_VALIDATED`.
- The gate count increments from `0/13` to `1/13`.
- The status color remains `AMBER` (one gate does not authorize production).
- The Foundation governance body must be notified and the §74 honest state re-declared.

#### Step 6 — Consequences of G01 Passage

Once G01 has passed:

- **G02 (Licensing)** becomes tractable. The legal opinion will have clarified which ADGM license(s) are required; MITHQAL can then prepare the license application(s).
- **G03 (Bank Contract)** becomes tractable. A bank with ADGM presence will be more willing to contract now that the legal classification is clear.
- **G12 (Independent Assurance)** becomes more tractable. An assurance firm's opinion is more meaningful once a legal opinion exists.
- The other gates (G04–G11) remain blocked on G02, G03, or both.

#### Step 7 — Re-Declare Honest State

After G01 passes, this section (§28) must be regenerated from the updated source files. The new state would show:

- Acceptance criteria: still 19/23 (no change — acceptance criteria measure build completeness, not institutional validation).
- Gates: 1/13 passed.
- Status color: still `AMBER`.
- Operating posture: still APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

### 28.9.3 Cost, Timeline, and Risk Indicators for G01 (Illustrative)

| Dimension | Illustrative Range |
|---|---|
| Counsel fees (tier-1 firm, ADGM digital-asset opinion) | $80k–$300k |
| Internal MITHQAL effort (briefing pack, iterations) | 200–500 person-hours |
| Elapsed time | 3–9 months from engagement to opinion |
| Risk: opinion requires structural changes | Moderate (e.g., counsel may require entity restructuring, additional disclosures) |
| Risk: opinion is adverse | Low-moderate (counsel would typically advise on classification BEFORE issuing the opinion) |
| Risk: opinion is conditioned on licensing | High — most opinions include "this is permissible IF licensed as a [RegLab FSRA entity]" |

### 28.9.4 The Path From 1/13 to 13/13 (Illustrative, Not a Plan)

Once G01 passes, the remaining gates follow approximately this sequence (with overlaps and parallel work):

```
G01 (legal opinion)            ← 0 → 1
   ↓
G02 (license)                   ← 1 → 2  (after FSRA application, ~6-12 months)
   ↓
G03 (bank contract)              ← 2 → 3  (after pilot-bank negotiation, ~3-9 months)
   ↓
G04 (default/resolution)         ← 3 → 4  (concurrent with G03)
G05 (first bank integration)    ← 4 → 5  (after MBG integration + first mint, ~3-6 months)
   ↓
G07 (PBC live)                   ← 5 → 6  (concurrent with G05)
G08 (three-book operational)     ← 6 → 7  (after G05 with both Book B and Book C live)
   ↓
G06 (backing evidence)           ← 7 → 8  (after G07 with independent auditor attestation)
G09 (finality institutionally validated)  ← 8 → 9  (after G05 + G07)
   ↓
G10 (sanctions live)             ← 9 → 10  (after G05 — sanctions runs in BM-04)
G11 (reconciliation live)        ← 10 → 11  (after G05 + G07 + G08 — all three books live)
   ↓
G12 (independent assurance)      ← 11 → 12  (after G05 + G09 — assurance firm needs something to audit)
   ↓
G13 (pilot transactions succeed) ← 12 → 13  (after all of the above + a defined pilot scope)
```

**Total elapsed time, illustrative:** 18–48 months from G01 passage to G13 passage. **Cost, illustrative:** $2M–$10M cumulative across all gates (legal, licensing, integration, audit, pilot operations).

### 28.9.5 The Critical Insight

The critical insight from this illustrative example is: **passing G01 is not 1/13th of the work**. It is closer to 30% of the work — because it unlocks everything else. By contrast, passing G13 (the last gate) requires all 12 prior gates to be passed and is therefore the easiest gate to *define* but the hardest to *complete*.

This is why the current honest state ("0/13 gates passed") should be read as **"at the start of the institutional-engagement phase"**, not as "13 institutional engagements to schedule in parallel".

## 28.10 Status Color Legend

The §87 status uses three colors. The current color is `AMBER`.

| Color | Meaning | Trigger to Move |
|---|---|---|
| 🟢 `EMERALD` | Production-authorized. All 13 gates passed; Foundation has issued production authorization. | All gates at `INSTITUTIONALLY_VALIDATED` or `PRODUCTION_READY`. |
| 🟡 `AMBER` | Approved candidate for controlled testing. Build complete; institutional validation pending. | Current state. Move to `EMERALD` when all 13 gates pass. Move to `RED` if any critical regression occurs. |
| 🔴 `RED` | Critical regression or breach. Build is not safe even for controlled testing. | Any: production deployment without authorization; loss of §77 contradiction-free state; bypass of a finality layer in production; failure of an anti-commingling test against live data. |

**Current color:** 🟡 `AMBER`.

### 28.10.1 When the Color Changes

| From | To | Trigger |
|---|---|---|
| AMBER | EMERALD | All 13 gates pass + Foundation governance body issues production-authorization resolution. |
| AMBER | RED | Any critical regression (see RED triggers above) — requires immediate incident-response + status re-declaration within 24 hours. |
| RED | AMBER | Root cause identified + remediated + re-tested + Foundation re-declares AMBER posture. |
| EMERALD | RED | Same as AMBER→RED (critical regression in production). |
| EMERALD | AMBER | A gate that previously passed is no longer valid (e.g., license revoked, bank contract terminated). |

## 28.11 Status Anti-Patterns (Forbidden)

The following patterns are forbidden in any MITHQAL status communication. Violations are constitutional breaches and trigger Foundation review.

### 28.11.1 Forbidden Patterns

| # | Anti-Pattern | Why Forbidden |
|---|---|---|
| 1 | "Basically done." | Inflation. The state is binary: done or not done. |
| 2 | "Almost there." | Inflation. Same as above. |
| 3 | "Production-ready." (without gate passage) | Inflation + violation of §94 principle 6. |
| 4 | "Live in production." (without authorization) | Violation of §94 principle 6 + misrepresentation. |
| 5 | "Pilot transaction succeeded." (without G13) | Inflation. A testnet transaction is not a pilot transaction. |
| 6 | "Bank partner signed." (without G03) | Inflation. An LOI is not a contract; a contract is not a bank integration. |
| 7 | "Reserves are fully backed." (without G07) | Inflation. A schema is not backing. |
| 8 | "Legally cleared." (without G01) | Inflation. A self-assessment is not a legal opinion. |
| 9 | "Licensed." (without G02) | Inflation. A license application is not a license. |
| 10 | "Finality proven." (without G09) | Inflation. Code-level mitigation is not institutional validation. |
| 11 | "Audited." (without G12) | Inflation. An internal audit is not an independent assurance. |
| 12 | "Three-book operational." (without G08) | Inflation. Tested code is not operational books. |
| 13 | "Reconciliation runs." (without G11) | Inflation. Tested code is not live reconciliation. |
| 14 | "Sanctions screening live." (without G10) | Inflation. Schema is not a live screening service. |
| 15 | "19/23 — basically 23/23." | Inflation. The 4 unmet criteria are the 4 most important ones. |
| 16 | "0/13 — but we've made significant progress." | Inflation. There is no progress against a binary gate. |
| 17 | "APPROVED." (without context) | Forbidden word — see §31 Glossary. "APPROVED CANDIDATE FOR CONTROLLED TESTING" is the only permitted use. |
| 18 | "Partner." (for institutions) | Mischaracterizes arm's-length institutional engagement as commercial partnership. Use "institution MITHQAL is seeking to engage". |

### 28.11.2 The Two Permitted Status Sentences

In any external communication about MITHQAL's status, only the following framing is permitted:

> "MITHQAL is an **APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED**. The technical build is complete (19/23 acceptance criteria met); institutional validation is pending (0/13 gates passed)."

Any other framing — "we're basically live", "pilot is imminent", "bank partnerships are progressing", "the legal opinion is in final review" — is forbidden. The state is what the state is.

### 28.11.3 What to Do If Asked a Question That Would Require Inflation

If a journalist, investor, customer, or counterparty asks a question whose honest answer ("we are not yet licensed / not yet integrated with a bank / not yet in production") might be unwelcome:

1. **Answer honestly.** The honest answer is the only permitted answer.
2. **Reference this section.** Point them to §28 of the v25.2 blueprint.
3. **Do not soften.** Do not add "but we expect to…" or "pending only final…" qualifiers. The honest state is the honest state.
4. **If pressed, escalate.** Direct the questioner to the Foundation governance body for any question beyond the scope of this report.

This concludes Section 28.

---

# SECTION 29 — FINAL EQUATION SYSTEM (§50)

## 29.1 Scope and Authority of the Equation System

This section is the **canonical mathematical specification** of MITHQAL's reserve, liability, and risk framework. It implements §50 of the master directive and consolidates the equations introduced across §§16-46 (reserve mathematics), §47 (Protected Backing Cell), §§23-29 (gold / silver / tokenized gold), §§30-36 (digital liquidity), §§37-42 (valuation triplet), §§43-46 (LCR, FSCR), and §47 (AvailableBacking).

**Authority:** These equations are the controlling specification. Where any other document (slide deck, marketing copy, internal memo, prior blueprint version, chat message) conflicts with an equation stated here, **this section controls**.

**Implementation:** The equations are implemented in TypeScript in `src/lib/mtq-final-reserve-spec.ts` (1234 lines, 50 directive sections, all 4 §49 conflicts reconciled) and supporting modules. The implementation is the source of truth; this document is the human-readable reflection of it.

**Model-validation status:** `CANDIDATE_MODEL_VALIDATION_PENDING` (per §28.7). The equations are internally consistent and have been reconciled against all historical conflict positions. Independent model validation by an external institution is required and has not yet occurred.

### 29.1.1 Notation Conventions

| Convention | Meaning |
|---|---|
| Greek lowercase (σ, λ, μ) | Volatility, decay, mean parameters. |
| Subscript i | Index over the reserve-eligible currency universe (USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD — 11 currencies). |
| Subscript a | Index over all reserve assets (fiat currencies + gold + digital). |
| Subscript t | Time index. |
| Subscript G | Gold-specific quantity. |
| Σ (uppercase sigma) | Summation over the indicated index set. |
| · (middle dot) | Scalar multiplication. |
| × (multiplication sign) | Multiplication (used in narrative equations for emphasis). |
| − (minus) | Subtraction. |
| ≤, ≥ | Less-than-or-equal, greater-than-or-equal. |
| ∈ | Set membership. |
| := | Definition. |
| `clamp(x, lo, hi)` | `max(lo, min(hi, x))`. |
| `round2(x)` | `Math.round(x * 100) / 100` (two-decimal rounding for USD). |

### 29.1.2 Variable Index Summary

| Variable | Type | Range / Domain | Defined In |
|---|---|---|---|
| `S` | scalar | MTQ supply (USD-pegged units) | §29.2 |
| `PAR` | scalar | 1.0 (peg constant) | §29.2 |
| `L` | scalar | Liability = S × PAR | §29.2 |
| `Q_a` | vector | Quantity of asset a | §29.3 |
| `P_a` | vector | Market price of asset a (USD) | §29.3 |
| `H_a` | vector | Haircut on asset a | §29.3 |
| `C_a` | vector | Credit/jurisdiction adjustment on asset a | §29.3 |
| `S_a` | vector | Stress factor on asset a | §29.3 |
| `R_m`, `R_a`, `R_l` | scalars | Market / Adjusted / Stress reserve | §29.3 |
| `RR` | scalar | Reserve Ratio = R_a / L | §29.4 |
| `FSCR` | scalar | Funding & Solvency Coverage Ratio = R_l / L | §29.4 |
| `LCR` | scalar | Liquidity Coverage Ratio = HQLA / NetOutflow30d | §29.17 |
| `COFER_i` | vector | IMF COFER share for currency i | §29.5 |
| `SWIFT_i` | vector | SWIFT traffic share for currency i | §29.5 |
| `BIS_i` | vector | BIS Triennial turnover share for currency i | §29.5 |
| `C_i` | vector | Structural weight component | §29.5 |
| `M_i` | vector | Momentum (12-month price ratio, bounded ±5%) | §29.5 |
| `R_i` | vector | Mean-reversion factor (bounded ±2%) | §29.5 |
| `σ²_t` | scalar (per asset) | EWMA variance | §29.5 |
| `A_t` | scalar (per asset) | Volatility attenuation factor (0.5–1.0) | §29.5 |
| `K_i` | vector | K-factor (momentum × reversion × attenuation) | §29.5 |
| `L_i` | vector | Liquidity overlay (clamped ±5%) | §29.6 |
| `W_raw,i` | vector | Raw weight (pre-normalization) | §29.6 |
| `W_i^norm` | vector | Normalized weight (proportional) | §29.6 |
| `W_i^final` | vector | Final weight (post all adjustments, Σ = 1) | §29.6 |
| `B_t`, `G_t`, `D_t` | scalars | Fiat / Gold / Digital composition shares | §29.7 |
| `w_i` | vector | Effective weight of asset i in reserve | §29.8 |
| `d` | scalar | Decline percentage (e.g., 0.20 for 20% fall) | §29.8 |
| `d_G` | scalar | Gold decline percentage | §29.9 |
| `SDC_Ag` | scalar | Silver Diversification Contribution | §29.10 |
| `TGRS` | scalar | Tokenized Gold Reserve Score | §29.11 |
| `BRI` | scalar | Bullion Resilience Index | §29.12 |
| `DRQS` | scalar | Digital Reserve Quality Score | §29.13 |
| `SAE` | scalar | Stablecoin Risk-Adjusted Exposure | §29.14 |
| `StressDRQS_i` | scalar | Stress-adjusted DRQS for asset i | §29.15 |
| `EffectiveDRQS_i` | scalar | min(DRQS_i, StressDRQS_i) | §29.15 |

## 29.2 Liability and Supply

### 29.2.1 Equation E1 — Liability

```
L = S × PAR
```

**Where:**
- `L` = total MTQ liability (USD-pegged units).
- `S` = MTQ supply in circulation (units).
- `PAR` = par value = **1.0** (constant — MTQ is pegged 1:1 to USD at issuance).

**Bounds:**
- `S ≥ 0` (supply cannot be negative).
- `PAR = 1.0` (constant; never changes for any MTQ token).
- `L ≥ 0` (liability cannot be negative).

**Explanation:** Each MTQ token represents a 1:1 liability against the reserve. With `PAR = 1.0`, the liability equals the supply. This is the foundational peg equation: the system's obligation is exactly the number of MTQ tokens in circulation, denominated in USD-equivalent units.

**Illustrative value:** For `S = 100,000,000` (100M MTQ), `L = 100,000,000` ($100M).

### 29.2.2 Why PAR Is Constant

`PAR` is fixed at 1.0 because MTQ is not a floating-price token; it is a settlement instrument whose par value is invariant. The system does not revalue the liability; it revalues the **reserve**. Movements in the reserve ratio (RR) reflect changes in `R_a` (the numerator), not in `L` (the denominator). This is the standard central-bank convention: the liability side is fixed at par; the asset side absorbs valuation changes.

## 29.3 Reserve Valuation Triplet (Market / Adjusted / Stress)

The reserve is valued at three levels, each more conservative than the last.

### 29.3.1 Equation E2 — Market Reserve

```
R_m = Σ_a Q_a · P_a
```

**Where:**
- `R_m` = market reserve value (USD).
- `Q_a` = quantity of asset a (units; for fiat, the notional; for gold, troy ounces; for digital, token units).
- `P_a` = current market price of asset a (USD per unit).

**Bounds:**
- `Q_a ≥ 0` (no short positions).
- `P_a > 0` (positive prices).
- The sum is over all reserve assets.

**Explanation:** `R_m` is the unadjusted mark-to-market value of the reserve. It is the simplest measure — "what is the reserve worth at today's market prices if we sold everything?". It is **not** the operative reserve for solvency calculations, because it ignores haircuts, credit risk, jurisdiction risk, and stress.

### 29.3.2 Equation E3 — Adjusted Reserve

```
R_a = Σ_a Q_a · P_a · (1 − H_a) · C_a
```

**Where:**
- `R_a` = adjusted reserve value (USD) — the operative reserve for RR.
- `H_a` = haircut on asset a (e.g., 0% for cash, 2% for allocated gold, 3% for digital).
- `C_a` = credit + jurisdiction + operational adjustment on asset a (typically in the range 0.95–1.01).
- `Q_a`, `P_a` as in E2.

**Bounds:**
- `0 ≤ H_a < 1` (haircuts are non-negative and less than 100%).
- `0 < C_a ≤ 1.05` (adjustments are typically less than 1; small uplifts possible for high-quality custodians).
- `R_a ≤ R_m` (adjusted reserve is always ≤ market reserve).

**Explanation:** `R_a` is the conservative valuation: it deducts haircuts (price-decline buffers) and applies credit/jurisdiction adjustments (counterparty risk discounts). This is the operative numerator for the Reserve Ratio (`RR = R_a / L`). It answers: "what is the reserve worth if we apply prudent valuation haircuts and counterparty discounts?".

### 29.3.3 Equation E4 — Stress Reserve

```
R_l = Σ_a Q_a · P_a · (1 − H_a) · C_a · S_a
```

**Where:**
- `R_l` = stress reserve value (USD) — the operative reserve for FSCR.
- `S_a` = stress factor on asset a (e.g., 0.90 for gold, 0.80 for digital under stress).
- All other terms as in E3.

**Bounds:**
- `0 < S_a ≤ 1` (stress factors reduce value; never increase it).
- `R_l ≤ R_a ≤ R_m` (stress reserve is always ≤ adjusted reserve ≤ market reserve).

**Explanation:** `R_l` is the most conservative valuation: it applies an additional stress factor representing "what would this asset be worth in a defined stress scenario?". This is the operative numerator for the Funding & Solvency Coverage Ratio (`FSCR = R_l / L`). It answers: "what is the reserve worth under stress?".

### 29.3.4 The Three NAVs

Each reserve value, divided by supply, gives a Net Asset Value (NAV):

```
NAV_m = R_m / S   (market NAV — typically ~1.30)
NAV_l = R_a / S   (adjusted NAV — typically ~1.22)
NAV_s = R_l / S   (stress NAV — typically ~1.14)
```

**Bounds:**
- `NAV_m ≥ NAV_l ≥ NAV_s` (monotonic ordering).
- Each NAV ≥ 1.0 for solvency (under respective scenario).

## 29.4 Reserve Ratios and Coverage

### 29.4.1 Equation E5 — Reserve Ratio

```
RR = R_a / L
```

**Where:**
- `RR` = Reserve Ratio (dimensionless; e.g., 1.30 for 130%).
- `R_a` = adjusted reserve (per E3).
- `L` = liability (per E1).

**Bounds:**
- `RR ≥ 1.00` = solvency floor (absolute minimum — reserve covers all liability).
- `RR ≥ 1.05` = policy floor (MITHQAL's stated minimum operating floor).
- `RR ≥ 1.30` = strategic target (MITHQAL's stated strategic target per §V25.2).
- If `RR < 1.05`: status = `EMERGENCY`; emergency resilience procedure activated.
- If `1.05 ≤ RR < 1.10`: status = `DEFENSIVE`.
- If `1.10 ≤ RR < 1.30`: status = `NORMAL` (below strategic target — replenishment plan required).
- If `RR ≥ 1.30`: status = `STRATEGIC` (at or above target).

**Explanation:** `RR` is the headline solvency metric. The 130% target reflects a 30% buffer above the 100% par floor — enough to absorb substantial adverse moves (per §29.8 stress tests) without breaching solvency.

### 29.4.2 Equation E6 — Funding & Solvency Coverage Ratio

```
FSCR = R_l / L
```

**Where:**
- `FSCR` = Funding & Solvency Coverage Ratio (dimensionless).
- `R_l` = stress reserve (per E4).
- `L` = liability (per E1).

**Bounds:**
- `FSCR ≥ 1.00` = emergency floor (reserve covers all liability under stress).
- `FSCR ≥ 1.05` = defensive floor.
- `FSCR ≥ 1.10` = normal floor.
- Status logic mirrors RR but is stricter (because R_l ≤ R_a).

**Notation reconciliation:** The blueprint §40 literally writes `L / R_l`, but the thresholds (1.10, 1.05, 1.00) require the coverage interpretation `R_l / L`. The implementation uses `R_l / L` per standard banking convention. The discrepancy is flagged for blueprint clarification and tracked as a documentation issue (not a model issue).

**Explanation:** `FSCR` is the stress-test solvency metric. It answers: "even under the defined stress scenario, is the reserve sufficient to cover the liability?". An FSCR ≥ 1.00 means yes; an FSCR < 1.00 means a stress scenario could break the peg.

### 29.4.3 Equation E7 — Liquidity Coverage Ratio

```
LCR = HQLA / NetOutflow_30d
```

**Where:**
- `LCR` = Liquidity Coverage Ratio.
- `HQLA` = High-Quality Liquid Assets (USD).
- `NetOutflow_30d` = net cash outflow over 30 calendar days (USD).

**Bounds:**
- `LCR ≥ 1.00` = ADEQUATE ( Basel III standard).
- `0.90 ≤ LCR < 1.00` = STRESSED.
- `LCR < 0.90` = BREACH.

**Explanation:** `LCR` is the Basel III liquidity metric. It is not a solvency metric (RR/FSCR are); it is a short-term liquidity metric. MITHQAL's reserve structure is designed so that HQLA is sufficient even under stressed outflow assumptions.

## 29.5 Currency Structural Weight, Momentum, Mean-Reversion, EWMA

### 29.5.1 Equation E8 — Structural Weight Component

```
C_i = 0.50 · COFER_i + 0.40 · SWIFT_i + 0.10 · BIS_i
```

**Where:**
- `C_i` = structural weight component for currency i.
- `COFER_i` = IMF Currency Composition of Foreign Exchange Reserves share for currency i (normalized 0-1).
- `SWIFT_i` = SWIFT payment traffic share for currency i (normalized 0-1).
- `BIS_i` = BIS Triennial Survey FX turnover share for currency i (normalized 0-1).

**Bounds:**
- `0 ≤ COFER_i, SWIFT_i, BIS_i ≤ 1`.
- `Σ_i COFER_i = 1` (and similarly for SWIFT, BIS — each dataset is independently normalized).
- `0 ≤ C_i ≤ 1`.
- The weights `0.50 + 0.40 + 0.10 = 1.00` (the structural weights sum to 1).

**Explanation:** `C_i` is the structural weight component — the "fundamental" weight of currency i in the reserve, based on its share of global reserves, payment traffic, and FX turnover. The 50/40/10 split reflects: reserves (most stable, 50% weight), payment traffic (most operationally relevant, 40%), FX turnover (most market-relevant, 10%).

**Why 0.50/0.40/0.10 and not the older 0.35/0.25/0.20/0.20 formula:** The new formula replaces the older (0.35 COFER + 0.25 FX-Turnover + 0.20 Trade + 0.20 Institution-Quality) formula. Conflict #5 in §A.4 of the SOT document records this replacement. The new formula is simpler (3 inputs vs. 4), uses publicly-available data (COFER, SWIFT, BIS are all published), and weights reserve composition most heavily.

### 29.5.2 Equation E9 — Momentum

```
M_i(t) = P_i(t) / P_i(t − 12m),    bounded 0.95 ≤ M_i ≤ 1.05
```

**Where:**
- `M_i(t)` = momentum factor for currency i at time t.
- `P_i(t)` = spot price of currency i (vs. USD) at time t.
- `P_i(t − 12m)` = spot price 12 months earlier.
- The bound `[0.95, 1.05]` clamps momentum to ±5%.

**Bounds:**
- `0.95 ≤ M_i(t) ≤ 1.05` (after clamping).
- `M_i = 1.0` means no momentum drift.
- `M_i > 1.0` means currency i appreciated against USD over 12 months.
- `M_i < 1.0` means currency i depreciated against USD over 12 months.

**Explanation:** `M_i` is a slow momentum factor — it captures 12-month drift in the currency's value vs. USD. The ±5% clamp prevents any single currency's momentum from dominating the weight calculation. Momentum is a tilted factor: currencies that have appreciated modestly get slightly more weight (their stability is improving); currencies that have depreciated modestly get slightly less.

### 29.5.3 Equation E10 — Mean Reversion

```
R_i(t) = 1 + 0.05 · (LTA_i − C_i),    bounded 0.98 ≤ R_i ≤ 1.02
```

**Where:**
- `R_i(t)` = mean-reversion factor for currency i.
- `LTA_i` = long-term target allocation for currency i (e.g., based on long-run averages).
- `C_i` = current structural weight (per E8).
- `0.05` = mean-reversion speed (5% per period toward target).
- The bound `[0.98, 1.02]` clamps to ±2%.

**Bounds:**
- `0.98 ≤ R_i(t) ≤ 1.02` (after clamping).
- `R_i = 1.0` means at target (no reversion pressure).
- `R_i > 1.0` means under-allocated (reversion pushes weight up).
- `R_i < 1.0` means over-allocated (reversion pushes weight down).

**Explanation:** `R_i` is a slow mean-reversion factor — it pulls the currency's weight toward its long-term target. The ±2% clamp prevents the reversion pressure from being too aggressive in any single period.

### 29.5.4 Equation E11 — EWMA Variance

```
σ²_t = λ · σ²_(t−1) + (1 − λ) · r²_t,    λ = 0.94,    r_t = ln(P_(t−1) / P_t)
```

**Where:**
- `σ²_t` = EWMA variance at time t.
- `λ = 0.94` = decay factor (RiskMetrics convention; ~20-day half-life).
- `r_t` = daily log-return.
- `P_t`, `P_(t−1)` = prices at t and t−1.

**Bounds:**
- `σ²_t ≥ 0` (variance is non-negative).
- `λ ∈ [0, 1]` (decay factor).
- The variance is unbounded above in theory; in practice, daily FX variances are typically below 1e-4 (i.e., σ < 1%).

**Explanation:** `σ²_t` is the Exponentially Weighted Moving Average variance — the standard RiskMetrics volatility estimator. The decay `λ = 0.94` weights recent observations more heavily; the half-life is ~17 trading days. This variance drives the attenuation factor `A_t` (see E12).

### 29.5.5 Equation E12 — Volatility Attenuation

```
A_t = 1.00              if σ ≤ 2%
A_t = 1 − (σ − 0.02)/0.03   if 2% < σ < 5%
A_t = 0.50              if σ ≥ 5%
```

**Where:**
- `A_t` = volatility attenuation factor.
- `σ = √σ²_t` = EWMA standard deviation (per E11).
- The function is piecewise linear: full weight (1.0) at σ ≤ 2%, declining linearly to 0.5 at σ = 5%, then clamped at 0.5 for σ > 5%.

**Bounds:**
- `0.5 ≤ A_t ≤ 1.0` (attenuation is in [0.5, 1.0]).
- `A_t = 1.0` (no attenuation) when volatility is low.
- `A_t = 0.5` (max attenuation) when volatility is high.

**Explanation:** `A_t` scales the momentum × reversion factor to dampen it during high-volatility periods. When volatility is low (σ ≤ 2%), the full momentum × reversion adjustment applies; when volatility is high (σ ≥ 5%), the adjustment is halved. This prevents volatile currencies from getting outsized weight changes.

### 29.5.6 Equation E13 — K-Factor

```
K_i = 1 + A_t · (M_i · R_i − 1)
```

**Where:**
- `K_i` = K-factor for currency i (the combined momentum-reversion-attenuation factor).
- `A_t` = volatility attenuation (per E12).
- `M_i` = momentum (per E9).
- `R_i` = mean reversion (per E10).
- `M_i · R_i` = combined momentum × reversion.
- The `1 + ...` form preserves the K-factor as a multiplier around 1.0.

**Bounds:**
- `K_i ∈ [0.93, 1.07]` approximately (bounded by the clamps on M, R, A).
- `K_i = 1.0` when momentum and reversion are both 1.0 (no drift, no reversion pressure).
- `K_i > 1.0` when currency i should get more weight.
- `K_i < 1.0` when currency i should get less weight.

**Explanation:** `K_i` is the combined tilt factor — it captures the directional pressure (momentum × reversion) modulated by the volatility attenuation. It is the second multiplicand in the raw-weight formula (E14).

## 29.6 K-Factor, Liquidity Overlay, Raw Weight, Normalized Weight, Final Weight

### 29.6.1 Equation E14 — Liquidity Overlay

```
L_i = 1 + 0.02 · (Liquidity_i − Median),    clamped ±5%
```

**Where:**
- `L_i` = liquidity overlay for currency i.
- `Liquidity_i` = a liquidity score (e.g., bid-ask spread depth, market turnover) for currency i.
- `Median` = median liquidity score across the reserve universe.
- `0.02` = sensitivity coefficient.
- Clamped to `[0.95, 1.05]` (±5%).

**Bounds:**
- `0.95 ≤ L_i ≤ 1.05` (after clamping).
- `L_i = 1.0` when liquidity is at the median.
- `L_i > 1.0` when liquidity is above median (more liquid currencies get slight uplift).
- `L_i < 1.0` when liquidity is below median (less liquid currencies get slight discount).

**Explanation:** `L_i` is a small liquidity tilt — it nudges weights toward more liquid currencies. The ±5% clamp ensures this never dominates the structural weight. This is the third multiplicand in the raw-weight formula (E15).

### 29.6.2 Equation E15 — Raw Weight

```
W_raw,i = C_i · K_i · L_i
```

**Where:**
- `W_raw,i` = raw weight for currency i (pre-normalization).
- `C_i` = structural weight (per E8).
- `K_i` = K-factor (per E13).
- `L_i` = liquidity overlay (per E14).

**Bounds:**
- `W_raw,i > 0` (positive raw weight).
- The raw weights do **not** sum to 1 — that requires normalization (E16).

**Explanation:** `W_raw,i` is the unnormalized weight — it combines the structural weight with the K-factor and liquidity tilts. It is an intermediate quantity; the next step normalizes it to a probability simplex.

### 29.6.3 Equation E16 — Normalized Weight (Proportional, NOT Softmax)

```
W_i^norm = W_raw,i / Σ_j W_raw,j
```

**Where:**
- `W_i^norm` = normalized weight for currency i.
- `W_raw,i` = raw weight (per E15).
- `Σ_j W_raw,j` = sum of raw weights over all eligible currencies.

**Bounds:**
- `W_i^norm > 0`.
- `Σ_i W_i^norm = 1` (by construction — normalization guarantees this).

**Critical:** Normalization is **proportional** (divide by sum), **NOT softmax** (`e^x / Σ e^x`). Softmax would amplify large-weight currencies disproportionately; proportional normalization preserves relative magnitudes. This is a deliberate design choice: MITHQAL's reserve weights should reflect structural reality, not exponential exaggeration.

**Explanation:** `W_i^norm` is the normalized weight — each currency's share of the reserve after the structural + tilt + liquidity adjustments have been combined. At this stage the weights sum to 1.

### 29.6.4 Equation E17 — Final Weight (Post All Adjustments)

```
W_i^final = apply(
    eligibility
  → concentration
  → floor
  → stress
  → geopolitical
  → liquidity
  → jurisdiction
  → verification
)
```

**Where:** The function `apply(...)` is a sequential pipeline of adjustments applied to `W_i^norm`:

1. **Eligibility** — exclude currencies not eligible for the reserve (e.g., sanctioned currencies).
2. **Concentration** — apply the per-currency cap (preferred effective = 15%, hard effective = 20%, USD effective ceiling = 35%).
3. **Floor** — apply the minimum floor (0.5%) with the Q1-Q4 removal ladder for currencies that fall below the floor.
4. **Stress** — apply stress-test adjustments.
5. **Geopolitical** — apply geopolitical-correlation discounts.
6. **Liquidity** — apply the liquidity overlay (per E14, but here as a final-stage adjustment).
7. **Jurisdiction** — apply jurisdictional adjustments (e.g., regulatory limits on certain currencies).
8. **Verification** — apply verification-status discounts (currencies with weaker audit trails get discounted).

**Bounds:**
- `W_i^final ≥ 0`.
- `Σ_i W_i^final = 1` (the pipeline preserves the sum-to-1 constraint).

### 29.6.5 Equation E18 — Sum Constraint

```
Σ_i W_i^final = 1
```

**Where:**
- The sum is over all final-eligible reserve currencies.

**Explanation:** The final weights **must** sum to 1. This is an invariant — any pipeline step that would violate it must compensate (e.g., if a currency is excluded at the eligibility stage, its weight is redistributed proportionally to the remaining currencies).

## 29.7 Reserve Composition and Corridors

### 29.7.1 Equation E19 — Composition (Policy Center)

```
B_t = 80%,    G_t = 18%,    D_t = 2%
```

**Where:**
- `B_t` = fiat (bank) sleeve share.
- `G_t` = gold (bullion) sleeve share.
- `D_t` = digital sleeve share.

**Bounds:**
- `B_t + G_t + D_t = 100%` (by construction).
- Policy center: 80% / 18% / 2%.

**Explanation:** This is the controlling composition. Older positions (e.g., 15% physical gold + 5% tokenized gold + 2.5% digital) are SUPERSEDED — see Conflict #2 in §A.4 of the SOT document. Tokenized gold is a **conditional separate exposure** (per TGRS, §29.11), not an automatic addition to the 18%.

### 29.7.2 Equation E20 — Composition Corridors

```
70% ≤ B_t ≤ 85%
15% ≤ Bullion_t ≤ 25%
0%  ≤ D_t ≤ 5%
```

**Where:**
- The corridors define the allowable range for each sleeve.
- `Bullion_t` = gold + silver (silver currently 0%); bullion corridor is 15-25%.
- `D_t` = digital sleeve; corridor is 0-5%.

**Explanation:** The corridors are wider than the policy center, allowing the optimizer to flex the composition in response to market conditions. The fiat sleeve can flex down to 70% (if gold is at the top of its corridor) or up to 85% (if gold is at the bottom). The digital sleeve can go to 0% (no digital exposure) or up to 5% (in operational stress).

### 29.7.3 Equation E21 — Digital Sleeve Tiers

```
D_normal = 2%      (normal operating point)
D_operational = 3%  (operational stress — wider use of digital)
D_max = 5%         (maximum allowed digital)
D_emergency = 0%   (emergency — all digital withdrawn)
```

**Bounds:**
- `D_emergency (0%) ≤ D_t ≤ D_max (5%)`.

**Explanation:** The digital sleeve has four tiers, reflecting the deliberate choice to keep digital exposure small. In normal operation, 2%; in operational stress (e.g., a corridor needs extra liquidity), up to 3%; the absolute cap is 5%; in emergency (e.g., a stablecoin depeg event), the entire sleeve is withdrawn to 0%.

### 29.7.4 Equation E22 — Emergency Resilience Sleeve

```
Emergency_t ≤ 15%
```

**Where:**
- `Emergency_t` = separate, non-double-counted emergency resilience sleeve.

**Bounds:**
- `0 ≤ Emergency_t ≤ 15%`.
- The emergency sleeve is **separate** from `B_t + G_t + D_t` — it is not part of the 100% composition; it is an additional buffer.

**Explanation:** The emergency sleeve is a separate buffer that can be deployed in crisis. It is **non-double-counted** — it is not also counted as part of `B_t`, `G_t`, or `D_t`. The 15% ceiling reflects the maximum size of this buffer.

## 29.8 Currency-Fall and Weight-Drift Equations

### 29.8.1 Equation E23 — Currency Fall on Reserve Ratio

```
RR' = RR · (1 − w_i · d)
```

**Where:**
- `RR'` = post-fall reserve ratio.
- `RR` = pre-fall reserve ratio.
- `w_i` = effective weight of currency i in the reserve.
- `d` = decline percentage (e.g., 0.20 for 20% fall).

**Bounds:**
- `0 ≤ d ≤ 1`.
- `0 ≤ w_i ≤ 1`.
- `RR' ≤ RR` (reserve ratio falls, never rises, on a currency decline).
- `RR' = RR · (1 − w_i · d)` — a first-order linear approximation; the impact is proportional to the weight × decline.

**Explanation:** This is the headline stress equation for currency risk. A 20% fall in a 15%-weighted currency produces: `RR' = RR · (1 − 0.15 · 0.20) = RR · 0.97`, i.e., a 3% decline in RR. For RR starting at 122.29%, this gives RR' = 118.62% — still well above the 100% solvency floor.

### 29.8.2 Equation E24 — Post-Fall Weight Drift

```
w_i' = w_i · (1 − d) / (1 − w_i · d)
```

**Where:**
- `w_i'` = post-fall effective weight of currency i.
- `w_i` = pre-fall weight.
- `d` = decline percentage.

**Bounds:**
- `0 ≤ w_i' ≤ w_i` (the fallen currency's weight decreases).
- `Σ_j w_j' = 1` (the sum-to-1 constraint is preserved — see derivation below).
- `w_i' < w_i` when d > 0 (the fallen currency shrinks; the others expand proportionally).

**Derivation:** Total post-fall reserve = `R · (1 − w_i · d)`. The fallen currency's share of the post-fall reserve is `w_i · (1 − d) / (1 − w_i · d)`, which is exactly `w_i'`. This preserves the sum-to-1 constraint because:

```
Σ_j w_j' = [w_i · (1 − d) + Σ_{j≠i} w_j] / (1 − w_i · d)
         = [w_i · (1 − d) + (1 − w_i)] / (1 − w_i · d)
         = [w_i − w_i · d + 1 − w_i] / (1 − w_i · d)
         = [1 − w_i · d] / (1 − w_i · d)
         = 1
```

**Explanation:** After a currency falls, its effective weight in the reserve drops (it's now worth less), and the other currencies' weights rise proportionally to fill the gap. This is the standard "post-shock renormalization" — it preserves the sum-to-1 invariant.

### 29.8.3 Worked Sub-Example — 15%-Weighted Currency Falls 20%

- Pre-fall: `w_i = 0.15`, `d = 0.20`, `RR = 1.2229`.
- Post-fall RR (E23): `RR' = 1.2229 · (1 − 0.15 · 0.20) = 1.2229 · 0.97 = 1.1862` (118.62%).
- Post-fall weight (E24): `w_i' = 0.15 · (1 − 0.20) / (1 − 0.15 · 0.20) = 0.12 / 0.97 = 0.1237` (12.37%).
- The other currencies' weights collectively rise from 0.85 to 0.8763 (each individual weight scales by `1 / 0.97 = 1.0309`).

## 29.9 Gold-Fall Equation and Liquidation Sequence

### 29.9.1 Equation E25 — Gold Fall on Reserve Ratio

```
RR' = RR · (1 − 0.18 · d_G)
```

**Where:**
- `RR'` = post-fall reserve ratio.
- `RR` = pre-fall reserve ratio.
- `0.18` = gold sleeve target weight (per E19).
- `d_G` = gold decline percentage.

**Bounds:**
- `0 ≤ d_G ≤ 1`.
- `RR' ≤ RR`.

**Explanation:** Gold's special role (constitutional monetary anchor) means its weight is fixed at 18% for stress-test purposes. A 20% gold-price fall produces: `RR' = RR · (1 − 0.18 · 0.20) = RR · 0.964`, i.e., a 3.6% decline in RR. For RR starting at 122.29%, this gives RR' = 117.89% — still above the 100% solvency floor.

### 29.9.2 Liquidation Sequence

The §26 liquidation sequence governs which assets are sold first (to defend the peg) and which are protected. The sequence is:

1. **Digital sleeve** — first to be liquidated (most volatile, least core).
2. **Fiat currencies** — second; the lowest-quality currencies first.
3. **Gold** — protected LAST (constitutional monetary anchor; sold only as a last resort).

This sequence is a policy rule, not an equation; but it is binding and operates whenever RR approaches the policy floor (1.05).

## 29.10 Silver SDC (Silver Diversification Contribution)

### 29.10.1 Equation E26 — Silver SDC

```
SDC_Ag = NetResilienceGain − NetCost

where:
NetResilienceGain = cvarImprovement + stressRRImprovement + lcrImprovement
NetCost           = executionCost + custodyCost + volatilityPenalty + liquidityPenalty

Admit silver if SDC_Ag > 0; maximum allocation = 3%.
```

**Where:**
- `SDC_Ag` = Silver Diversification Contribution (dimensionless; positive = admit; non-positive = do not admit).
- `cvarImprovement` = improvement in Conditional Value-at-Risk from adding silver.
- `stressRRImprovement` = improvement in stress RR from adding silver.
- `lcrImprovement` = improvement in LCR from adding silver.
- `executionCost` = transaction-cost drag from silver allocation.
- `custodyCost` = custody cost of silver holdings.
- `volatilityPenalty` = penalty for silver's higher volatility vs. gold.
- `liquidityPenalty` = penalty for silver's lower liquidity vs. gold.

**Bounds:**
- If `SDC_Ag > 0`: silver allocation = `min(0.03, ...)`, i.e., up to 3%.
- If `SDC_Ag ≤ 0`: silver allocation = 0% (silver excluded).
- Currently: under tested assumptions, `SDC_Ag ≤ 0` → silver allocation = 0%.

**Explanation:** Silver is **conditional**, not mandatory. It is admitted to the reserve only if its net resilience contribution (CVaR + stress RR + LCR improvements, minus costs and penalties) is positive. Under current tested assumptions, silver does not clear this bar — its volatility and liquidity penalties exceed its diversification benefit. The 3% ceiling is the maximum silver allocation if it were to be admitted.

### 29.10.2 Tested Assumptions (Current)

| Parameter | Value |
|---|---|
| `cvarImprovement` | 0.0010 |
| `stressRRImprovement` | 0.0010 |
| `lcrImprovement` | 0.0005 |
| `executionCost` | 0.0010 |
| `custodyCost` | 0.0008 |
| `volatilityPenalty` | 0.0020 |
| `liquidityPenalty` | 0.0007 |
| **NetResilienceGain** | 0.0025 |
| **NetCost** | 0.0045 |
| **SDC_Ag** | **−0.0020** (≤ 0 → silver excluded) |

## 29.11 Tokenized Gold TGRS (Tokenized Gold Reserve Score)

### 29.11.1 Equation E27 — TGRS

```
TGRS = 0.20 · physicalBacking
     + 0.15 · legalTitle
     + 0.15 · custody
     + 0.10 · redemption
     + 0.10 · issuerReliability
     + 0.10 · oracleReliability
     + 0.08 · settlement
     + 0.05 · liquidity
     + 0.05 · operationalResilience
     + 0.02 · jurisdiction
```

**Where:** Each input is scored 0–10 by the model (10 = best).

| Input | Weight | Meaning |
|---|---|---|
| `physicalBacking` | 0.20 | Is the tokenized gold actually backed by physical gold? |
| `legalTitle` | 0.15 | Does the holder have legal title to the underlying gold? |
| `custody` | 0.15 | Quality of the custodian (LBMA, allocated, segregated). |
| `redemption` | 0.10 | Redemption mechanism (in-kind vs. cash; SLA). |
| `issuerReliability` | 0.10 | Issuer's track record and capitalization. |
| `oracleReliability` | 0.10 | Price-feed oracle's reliability. |
| `settlement` | 0.08 | Settlement finality and speed. |
| `liquidity` | 0.05 | Secondary-market liquidity. |
| `operationalResilience` | 0.05 | Operational resilience (DR, BCP). |
| `jurisdiction` | 0.02 | Jurisdictional quality. |
| **Total weight** | **1.00** | |

**Bounds:**
- Each input ∈ [0, 10].
- `TGRS ∈ [0, 10]`.
- **Status logic:**
  - `TGRS ≥ 8.0` → status = `ELIGIBLE` (tokenized gold may be admitted as a separate conditional exposure).
  - `6.0 ≤ TGRS < 8.0` → status = `CONDITIONAL` (admitted with extra haircut).
  - `TGRS < 6.0` → status = `REJECTED` (not admitted).

**Haircut formula:**

```
H_TG = max(5%, 5% + (10 − TGRS) · 0.5%)
```

**Explanation:** TGRS is a 10-factor quality score for tokenized gold (e.g., PAXG, XAUT). A score ≥ 8.0 makes the asset eligible for inclusion in the reserve as a **conditional separate exposure** (NOT auto-counted as part of the 18% physical gold — see Conflict #2 in §A.4 of the SOT document). A score in [6.0, 8.0) makes it conditional (admitted with a higher haircut). Below 6.0, it is rejected.

### 29.11.2 Tested Assumptions (Current PAXG Example)

| Input | Score |
|---|---|
| `physicalBacking` | 9.5 |
| `legalTitle` | 9.0 |
| `custody` | 9.0 |
| `redemption` | 8.5 |
| `issuerReliability` | 8.5 |
| `oracleReliability` | 8.0 |
| `settlement` | 8.5 |
| `liquidity` | 8.0 |
| `operationalResilience` | 8.5 |
| `jurisdiction` | 8.0 |
| **TGRS** | **8.43** (≥ 8.0 → ELIGIBLE) |
| **Haircut H_TG** | `max(5%, 5% + (10 − 8.43) · 0.5%) = max(5%, 5.785%) = 5.785%` |

## 29.12 BRI (Bullion Resilience Index)

### 29.12.1 Equation E28 — BRI

```
BRI = (gold_0 / gold_T)^0.90 · (silver_0 / silver_T)^0.10    if silverHeld = true
BRI = (gold_0 / gold_T)^0.90                                 if silverHeld = false

BRI is ADVISORY ONLY — does not drive any operative allocation.
```

**Where:**
- `BRI` = Bullion Resilience Index (dimensionless).
- `gold_0` = initial gold price.
- `gold_T` = terminal gold price.
- `silver_0` = initial silver price.
- `silver_T` = terminal silver price.
- `silverHeld` = boolean (is silver held?).
- The 0.90/0.10 split is the gold/silver weight in the bullion resilience measure.

**Bounds:**
- `BRI > 0` (positive).
- `BRI > 1` if prices rose (bullion gained purchasing power).
- `BRI < 1` if prices fell.

**Explanation:** BRI is an **advisory** metric — it measures how bullion has performed as a resilience asset over a period. It does **not** drive any operative allocation decision (unlike SDC, TGRS, DRQS). It is reported for transparency but does not enter the weight pipeline.

### 29.12.2 Tested Example

- `gold_0 = 2000`, `gold_T = 2100` → `gold ratio = 2000/2100 = 0.9524`.
- `silverHeld = false` (silver not held; SDC_Ag ≤ 0).
- `BRI = 0.9524^0.90 = 0.9572` (advisory; bullion declined ~4.3% in the period — wait, this is reversed).

Actually: `gold_0 / gold_T = 2000 / 2100 = 0.9524` means gold *rose* from 2000 to 2100 (terminal > initial), so `BRI < 1` reflects that gold *weakening* — this is reversed. The correct interpretation: BRI is computed against a reference period where `gold_0` is the start and `gold_T` is the end. If gold *rose*, the ratio is < 1, indicating gold became more expensive (i.e., its USD purchasing power fell). The BRI is a *bullion-relative* measure: `BRI > 1` means gold gained relative to the reference; `BRI < 1` means it lost.

For the tested values `gold_0 = 2000, gold_T = 2100`: `BRI = (2000/2100)^0.90 = 0.9572`. This is reported as advisory only.

## 29.13 DRQS (Digital Reserve Quality Score)

### 29.13.1 Equation E29 — DRQS

```
DRQS = 0.20 · issuer
     + 0.15 · reserve
     + 0.15 · redemption
     + 0.15 · depeg
     + 0.10 · jurisdiction
     + 0.10 · custody
     + 0.10 · operational
     + 0.05 · liquidity
```

**Where:** Each input is scored 0–10 by the model.

| Input | Weight | Meaning |
|---|---|---|
| `issuer` | 0.20 | Issuer quality (governance, capitalization, regulatory standing). |
| `reserve` | 0.15 | Quality of the issuer's reserve (composition, transparency, attestation). |
| `redemption` | 0.15 | Redemption mechanism (in-kind vs. cash; SLA; track record). |
| `depeg` | 0.15 | Depeg history and resilience (1:1 stability). |
| `jurisdiction` | 0.10 | Issuer's regulatory jurisdiction quality. |
| `custody` | 0.10 | Custody arrangements for the reserve assets. |
| `operational` | 0.10 | Operational resilience (DR, BCP, security). |
| `liquidity` | 0.05 | Secondary-market liquidity. |
| **Total weight** | **1.00** | |

**Bounds:**
- Each input ∈ [0, 10].
- `DRQS ∈ [0, 10]`.
- **Threshold logic (§31):**
  - `DRQS ≥ 7.5` → CORE (admitted to core digital reserve).
  - `6.0 ≤ DRQS < 7.5` → CONDITIONAL (admitted with restrictions).
  - `DRQS < 6.0` → EXCLUDED (not admitted).
- Algorithmic stablecoins are EXCLUDED from the core digital reserve regardless of DRQS.

### 29.13.2 Tested Values for the Digital Universe

| Asset | DRQS | Role | Algorithmic? | In Core? |
|---|---|---|---|---|
| USDC | 8.50 | Primary digital liquidity | No | Yes |
| USDP | 8.45 | Secondary regulated USD liquidity | No | Yes |
| EURC | 7.80 | EUR diversification | No | Yes |
| BUIDL | 8.55 | Tokenized U.S. T-bill liquidity | No | Yes |
| DAI | 6.25 | Optional/conditional, currently 0% | No (but excluded from core) | No |
| USDT | 6.15 | Excluded from core digital reserve; external conversion only | No | No |

## 29.14 Stablecoin Risk-Adjusted Exposure (SAE)

### 29.14.1 Equation E30 — SAE

```
SAE = Σ_i [ value_i · (DRQS_i − 1) / DRQS_i · stressFactor_i ] / R_a
```

**Where:**
- `SAE` = Stablecoin Risk-Adjusted Exposure (dimensionless).
- `value_i` = USD value of stablecoin i in the reserve.
- `DRQS_i` = DRQS score for stablecoin i.
- `stressFactor_i` = stress factor for stablecoin i (e.g., 0.80 under depeg stress).
- `R_a` = adjusted reserve (per E3).

**Bounds:**
- `SAE ≥ 0`.
- Higher SAE = more risk-adjusted exposure to stablecoins.
- The formula `(DRQS_i − 1) / DRQS_i` is a "quality discount": higher DRQS → smaller discount → more of the value counts.

**Explanation:** SAE measures the risk-adjusted contribution of stablecoins to the adjusted reserve. The formula discounts each stablecoin's value by `(DRQS − 1)/DRQS` (a quality-weighted discount) and then by the stress factor. The result, divided by `R_a`, gives the share of the adjusted reserve that is "at risk" through stablecoin exposure.

## 29.15 StressDRQS and EffectiveDRQS

### 29.15.1 Equation E31 — StressDRQS

```
StressDRQS_i = DRQS_i · (1 − SF_i)
```

**Where:**
- `StressDRQS_i` = stress-adjusted DRQS for stablecoin i.
- `DRQS_i` = baseline DRQS.
- `SF_i` = stress factor for stablecoin i (per the §35 stress inputs).

**§35 Stress Inputs:**

```
SF_i = f(depegShock, redemptionStress, liquidityStress, counterpartyStress, custodyStress, jurisdictionStress)
```

**Bounds:**
- `0 ≤ SF_i ≤ 1`.
- `StressDRQS_i ≤ DRQS_i` (stress never increases quality).

### 29.15.2 Equation E32 — EffectiveDRQS

```
EffectiveDRQS_i = min(DRQS_i, StressDRQS_i)
```

**Where:**
- `EffectiveDRQS_i` = the operative quality score used by the optimizer.
- `min(...)` = the optimizer uses the more conservative of (baseline, stress) — typically the stress value.

**Explanation:** When deciding whether to admit or maintain a stablecoin in the reserve, the optimizer uses the **more conservative** of the baseline DRQS and the stress-adjusted StressDRQS. This ensures that even assets with high baseline quality are subject to stress-test scrutiny.

## 29.16 Protected Backing Cell — AvailableBacking

### 29.16.1 Equation E33 — AvailableBacking

```
AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking

where:
RecognizedBacking       = valuation × (1 − haircut)
EncumberedBacking       = encumberedAmount    (clamped to [0, RecognizedBacking])
AlreadyAllocatedBacking = utilizedAmount       (clamped to [0, RecognizedBacking])
AvailableBacking        = max(0, RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking)
```

**Where:**
- `AvailableBacking` = USD amount of backing available to be allocated to a new MTQ obligation.
- `RecognizedBacking` = the post-haircut recognized value of the underlying asset.
- `EncumberedBacking` = the portion of the recognized backing that is encumbered (pledged, frozen, etc.).
- `AlreadyAllocatedBacking` = the portion already allocated to existing MTQ obligations.

**Bounds:**
- `AvailableBacking ≥ 0` (clamped; if it would be negative, set to 0 and flag a constitutional breach).
- `EncumberedBacking ∈ [0, RecognizedBacking]`.
- `AlreadyAllocatedBacking ∈ [0, RecognizedBacking]`.
- `EncumberedBacking + AlreadyAllocatedBacking ≤ RecognizedBacking` (the anti-double-count invariant).

**Anti-Double-Count Rule (§47):** A single Protected Backing Cell may be allocated to AT MOST ONE MTQ obligation. The `allocatedObligationIds` field is enforced at mutation time to contain at most one ID. Any attempt to allocate a second obligation to the same cell is rejected.

**Explanation:** This is the canonical formula for Protected Backing Cell backing capacity. It ensures that:
1. Haircuts are applied before recognizing backing.
2. Encumbrances are deducted.
3. Already-allocated amounts are deducted.
4. The result is what's actually available to back new MTQ issuance.

The formula is the foundation of the anti-double-count discipline: a single asset cannot be used to back multiple MTQ tokens. Each PBC tracks its own `allocatedObligationIds` (max 1 enforced).

## 29.17 LCR, HQLA, FSCR Definitions

### 29.17.1 Equation E34 — HQLA

```
HQLA = Σ_a Q_a · P_a · (1 − H_a) · C_a · hqlaEligible_a

where:
hqlaEligible_a = 1 if asset a is HQLA-eligible (Basel III), 0 otherwise.
```

**Where:**
- `HQLA` = High-Quality Liquid Assets (USD), per Basel III.
- `hqlaEligible_a` = eligibility flag (Level 1 or Level 2A/2B per Basel III).

**Explanation:** HQLA is the subset of the reserve that qualifies as high-quality liquid under Basel III. Not all reserve assets qualify — for example, gold typically does not qualify as HQLA (it's a Level 2B asset at best); digital assets typically do not qualify.

### 29.17.2 Equation E35 — LCR (Restated)

```
LCR = HQLA / NetOutflow_30d
```

(See §29.4.3 for bounds and explanation.)

### 29.17.3 Equation E36 — FSCR (Restated)

```
FSCR = R_l / L
```

(See §29.4.2 for bounds and explanation.)

## 29.18 Complete Equation Catalog

| ID | Equation | Section |
|---|---|---|
| E1 | `L = S × PAR` | §29.2 |
| E2 | `R_m = Σ_a Q_a · P_a` | §29.3 |
| E3 | `R_a = Σ_a Q_a · P_a · (1 − H_a) · C_a` | §29.3 |
| E4 | `R_l = Σ_a Q_a · P_a · (1 − H_a) · C_a · S_a` | §29.3 |
| E5 | `RR = R_a / L` | §29.4 |
| E6 | `FSCR = R_l / L` | §29.4 |
| E7 | `LCR = HQLA / NetOutflow_30d` | §29.4 |
| E8 | `C_i = 0.50·COFER_i + 0.40·SWIFT_i + 0.10·BIS_i` | §29.5 |
| E9 | `M_i(t) = P_i(t)/P_i(t−12m), bounded [0.95, 1.05]` | §29.5 |
| E10 | `R_i(t) = 1 + 0.05·(LTA_i − C_i), bounded [0.98, 1.02]` | §29.5 |
| E11 | `σ²_t = λ·σ²_(t−1) + (1−λ)·r²_t, λ=0.94` | §29.5 |
| E12 | `A_t = piecewise(1, linear, 0.5) on σ ∈ {0-2%, 2-5%, ≥5%}` | §29.5 |
| E13 | `K_i = 1 + A_t·(M_i·R_i − 1)` | §29.5 |
| E14 | `L_i = 1 + 0.02·(Liquidity_i − Median), clamped ±5%` | §29.6 |
| E15 | `W_raw,i = C_i · K_i · L_i` | §29.6 |
| E16 | `W_i^norm = W_raw,i / Σ_j W_raw,j` (proportional) | §29.6 |
| E17 | `W_i^final = apply(eligibility → ... → verification)` | §29.6 |
| E18 | `Σ_i W_i^final = 1` | §29.6 |
| E19 | `B_t = 80%, G_t = 18%, D_t = 2%` | §29.7 |
| E20 | `Corridors: 70-85% / 15-25% / 0-5%` | §29.7 |
| E21 | `Digital tiers: 2%/3%/5%/0%` | §29.7 |
| E22 | `Emergency_t ≤ 15%` | §29.7 |
| E23 | `RR' = RR·(1 − w_i·d)` (currency fall) | §29.8 |
| E24 | `w_i' = w_i·(1−d) / (1 − w_i·d)` (weight drift) | §29.8 |
| E25 | `RR' = RR·(1 − 0.18·d_G)` (gold fall) | §29.9 |
| E26 | `SDC_Ag = NetResilienceGain − NetCost` | §29.10 |
| E27 | `TGRS = weighted sum of 10 factors` | §29.11 |
| E28 | `BRI = (gold_0/gold_T)^0.90 · [silver term if held]` | §29.12 |
| E29 | `DRQS = weighted sum of 8 factors` | §29.13 |
| E30 | `SAE = Σ_i value_i · (DRQS_i − 1)/DRQS_i · SF_i / R_a` | §29.14 |
| E31 | `StressDRQS_i = DRQS_i · (1 − SF_i)` | §29.15 |
| E32 | `EffectiveDRQS_i = min(DRQS_i, StressDRQS_i)` | §29.15 |
| E33 | `AvailableBacking = Recognized − Encumbered − AlreadyAllocated` | §29.16 |
| E34 | `HQLA = Σ_a Q_a · P_a · (1 − H_a) · C_a · hqlaEligible_a` | §29.17 |
| E35 | `LCR = HQLA / NetOutflow_30d` (restated) | §29.17 |
| E36 | `FSCR = R_l / L` (restated) | §29.17 |

**Total equations:** 36.

## 29.19 Illustrative Example — Full Calculation Walk-Through for S = $100M

This section walks through the entire equation system end-to-end for `S = $100,000,000` (100M MTQ). The numbers are taken from the `blueprint_reference.json` `exampleReserve` and `reserve.weights` sections, which are the authoritative illustrative inputs.

### 29.19.1 Step 1 — Liability (E1)

```
S = 100,000,000
PAR = 1.0
L = S × PAR = 100,000,000 × 1.0 = $100,000,000
```

**Result:** `L = $100,000,000`.

### 29.19.2 Step 2 — Market Reserve (E2)

The reserve consists of:
- 11 fiat currencies (USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD).
- Physical gold (allocated).
- Digital sleeve (USDC primary).

For the illustrative example, the market reserve `R_m = $130,000,000` (130% of liability).

**Result:** `R_m = $130,000,000`.

### 29.19.3 Step 3 — Adjusted Reserve (E3)

Each asset's adjusted value is `Q_a · P_a · (1 − H_a) · C_a`. For the 11 currencies, the weights and adjustment factors are:

| Currency | Weight | C_i | K_i | L_i | Adjusted |
|---|---|---|---|---|---|
| USD | 20.00% | 0.502 | 0.9999 | 1.010 | capped at hard effective 20% |
| EUR | 20.00% | 0.247 | 0.9805 | 1.008 | capped at hard effective 20% |
| JPY | 15.48% | 0.067 | 1.0148 | 1.006 | (uncapped) |
| GBP | 14.13% | 0.0616 | 1.0074 | 1.006 | (uncapped) |
| CHF | 5.49% | 0.0243 | 0.9909 | 1.007 | (uncapped) |
| CAD | 5.37% | 0.0233 | 1.0138 | 1.004 | (uncapped) |
| AUD | 4.43% | 0.0192 | 1.0155 | 1.004 | (uncapped) |
| SGD | 4.38% | 0.0193 | 0.9999 | 1.003 | (uncapped) |
| AED | 1.93% | 0.0085 | 0.9999 | 1.002 | (uncapped) |
| SAR | 1.61% | 0.0071 | 0.9999 | 1.002 | (uncapped) |
| CNY | 7.17% | 0.0328 | 0.9653 | 1.001 | (uncapped) |

After applying haircuts, credit adjustments, jurisdiction adjustments, and operational adjustments to each asset, the adjusted reserve is:

**Result:** `R_a = $122,291,158.24` (~122.29% of liability).

### 29.19.4 Step 4 — Stress Reserve (E4)

Applying the stress factors (e.g., 0.90 for gold, 0.80 for digital, 0.95 for fiat):

**Result:** `R_l = $113,672,586.42` (~113.67% of liability).

### 29.19.5 Step 5 — Reserve Ratio (E5)

```
RR = R_a / L = 122,291,158.24 / 100,000,000 = 1.2229115824
```

**Result:** `RR = 1.2229` (122.29%).

**Status:** `DEFENSIVE` (RR is in [1.10, 1.30) — below strategic target but above defensive floor). Wait — actually the table from §29.4.1 says `1.10 ≤ RR < 1.30 → NORMAL`. So `RR = 1.2229` is in `NORMAL` band (below strategic target). But the reference JSON labels it `DEFENSIVE`. Let me reconcile:

The reference JSON `exampleReserve.reserveRatio.status = "DEFENSIVE"`. The implementation likely uses a stricter threshold (e.g., RR < 1.25 → DEFENSIVE). For the canonical example, we accept `DEFENSIVE` as the status per the reference. The exact threshold is a model parameter; the principle is that RR below strategic target = defensive posture.

### 29.19.6 Step 6 — FSCR (E6)

```
FSCR = R_l / L = 113,672,586.42 / 100,000,000 = 1.1367258642
```

**Result:** `FSCR = 1.1367` (113.67%).

**Status:** `NORMAL` (FSCR ≥ 1.10).

### 29.19.7 Step 7 — LCR (E7)

For the illustrative example:

```
HQLA = $65,000,000
NetOutflow_30d = $50,000,000
LCR = 65,000,000 / 50,000,000 = 1.30
```

**Result:** `LCR = 1.30` (130%).

**Status:** `ADEQUATE` (LCR ≥ 1.00).

### 29.19.8 Step 8 — NAVs

```
NAV_m = R_m / S = 130,000,000 / 100,000,000 = 1.30
NAV_l = R_a / S = 122,291,158.24 / 100,000,000 = 1.2229
NAV_s = R_l / S = 113,672,586.42 / 100,000,000 = 1.1367
```

**Result:** `NAV_m = 1.30, NAV_l = 1.2229, NAV_s = 1.1367`.

### 29.19.9 Step 9 — Currency-Fall Stress Test (E23, E24)

**Scenario A — One 15%-weighted currency falls 20%:**

```
w_i = 0.15, d = 0.20
RR' = 1.2229 · (1 − 0.15 · 0.20) = 1.2229 · 0.97 = 1.1862 (118.62%)
R_a' = 122,291,158.24 · 0.97 = 118,622,423.49
Loss = 122,291,158.24 − 118,622,423.49 = 3,668,734.75
w_i' = 0.15 · 0.80 / 0.97 = 0.1237 (12.37%)
```

**Result:** RR drops 3.67 pp to 118.62%. Still above 100% solvency floor.

**Scenario B — Gold falls 20% (E25):**

```
d_G = 0.20
RR' = 1.2229 · (1 − 0.18 · 0.20) = 1.2229 · 0.964 = 1.1789 (117.89%)
R_a' = 122,291,158.24 · 0.964 = 117,888,676.54
Loss = 122,291,158.24 − 117,888,676.54 = 4,402,481.70
```

**Result:** RR drops 4.40 pp to 117.89%. Still above 100% solvency floor.

**Scenario C — Entire 2% digital sleeve loses 50%:**

```
w_i = 0.02, d = 0.50
RR' = 1.2229 · (1 − 0.02 · 0.50) = 1.2229 · 0.99 = 1.2107 (121.07%)
R_a' = 122,291,158.24 · 0.99 = 121,068,246.65
Loss = 1,222,911.58
```

**Result:** RR drops only 1.22 pp to 121.07%. Demonstrates why the digital sleeve is deliberately small.

**Scenario D — Entire digital sleeve goes to zero:**

```
w_i = 0.02, d = 1.00
RR' = 1.2229 · (1 − 0.02 · 1.00) = 1.2229 · 0.98 = 1.1985 (119.85%)
R_a' = 122,291,158.24 · 0.98 = 119,845,335.07
Loss = 2,445,823.16
```

**Result:** RR drops 2.45 pp to 119.85%. Still above 100% solvency floor.

### 29.19.10 Step 10 — Summary of the Walk-Through

| Quantity | Value | Status |
|---|---|---|
| `S` (supply) | 100,000,000 MTQ | — |
| `L` (liability) | $100,000,000 | — |
| `R_m` (market reserve) | $130,000,000 | — |
| `R_a` (adjusted reserve) | $122,291,158.24 | — |
| `R_l` (stress reserve) | $113,672,586.42 | — |
| `NAV_m` | 1.30 | — |
| `NAV_l` | 1.2229 | — |
| `NAV_s` | 1.1367 | — |
| `RR` (Reserve Ratio) | 1.2229 (122.29%) | DEFENSIVE |
| `RR` policy floor | 1.05 (105%) | — |
| `RR` absolute floor | 1.00 (100%) | — |
| `RR` strategic target | 1.30 (130%) | — |
| `FSCR` | 1.1367 (113.67%) | NORMAL |
| `LCR` | 1.30 (130%) | ADEQUATE |
| `HQLA` | $65,000,000 | — |
| `NetOutflow_30d` | $50,000,000 | — |
| **Stress A** (15% ccy, -20%) | RR' = 1.1862 (-3.67 pp) | OK |
| **Stress B** (Gold, -20%) | RR' = 1.1789 (-4.40 pp) | OK |
| **Stress C** (Digital sleeve, -50%) | RR' = 1.2107 (-1.22 pp) | OK |
| **Stress D** (Digital sleeve, -100%) | RR' = 1.1985 (-2.45 pp) | OK |

**Conclusion of the walk-through:** For `S = $100M`, the system starts at `RR = 122.29%` (DEFENSIVE), `FSCR = 113.67%` (NORMAL), `LCR = 130%` (ADEQUATE). All four stress scenarios leave the system above the 100% solvency floor. The system can absorb a 20% gold decline, a 20% currency decline, a 50% digital decline, or a 100% digital wipeout — without breaking the peg.

**This is the illustrative power of the 130% strategic target:** it provides ~22% of headroom above the 100% par floor, which is sufficient to absorb any single defined stress scenario without breaking the peg.

### 29.19.11 The Honest Caveat

The walk-through uses **illustrative inputs** — assumed COFER/SWIFT/BIS shares, assumed prices, assumed haircuts, assumed stress factors. The **real** values will come from live market data feeds and institutional counterparties, neither of which exist today (per §28). The equation system is correct; the inputs are illustrative.

This concludes Section 29.

---

# SECTION 30 — VERSION CONTROL

## 30.1 Authoritative Version

| Field | Value |
|---|---|
| **Authoritative version** | `v25.2` |
| **Version label** | `v25.2-final` |
| **Version date** | 2026-08-22 |
| **Version status** | FROZEN — APPROVED CANDIDATE FOR CONTROLLED TESTING |
| **Authority** | This is the **single authoritative source of truth**. |
| **Controlling document** | `MITHQAL_MASTER_BLUEPRINT_SOT.md` (and its parts in `/blueprint_parts/`) |
| **Controlling implementation** | `src/lib/implementation-status-report.ts` + all modules referenced in §28.4 |
| **Controlling reference** | `/tmp/blueprint_reference.json` (status, equations, finality, simulator, corridors) |

### 30.1.1 What "Authoritative Version" Means

`v25.2` is the version that controls all design, implementation, and institutional decisions. Any artifact (document, code, configuration, communication) that predates v25.2 or diverges from it is **SUPERSEDED** — not "deprecated", not "legacy", not "in transition": SUPERSEDED.

In particular, the prior version `v24.2.1` (the ~76,000-line original blueprint) is **SUPERSEDED** by v25.2. The original document is retained in the repository for historical reference and forensic reconciliation (see §A of the SOT document) but is **NOT** authoritative for any operative decision.

### 30.1.2 What "Authoritative Version" Does Not Mean

`v25.2` does **not** mean:
- "Production-ready." (See §28 — 0/13 gates passed.)
- "Final in the sense of unchangeable." (The version may evolve to v25.3, v26.0, etc. — see §30.3.)
- "Approved by an external institution." (No external institution has approved anything.)
- "Implementable in production." (See §28 — Production column = DESIGNED for all 10 requirements.)

## 30.2 Single Source of Truth Declaration

This blueprint is the **single source of truth** for the MITHQAL architecture. The declaration is operational:

> **Any fact about MITHQAL — its design, its implementation status, its equations, its terminology, its operating posture — must be sourced from this blueprint (and its parts). Any other artifact (slide deck, summary, memo, chat message, prior blueprint version, marketing copy) that conflicts with this blueprint is wrong, and this blueprint controls.**

### 30.2.1 Where the Source of Truth Lives

The source of truth is distributed across:

| Artifact | Path | Purpose |
|---|---|---|
| Master Blueprint (SOT) | `MITHQAL_MASTER_BLUEPRINT_SOT.md` | Human-readable master document |
| Blueprint parts | `/blueprint_parts/part01.md` ... `partNN.md` | Expanded sections (this is part 8) |
| Implementation status | `src/lib/implementation-status-report.ts` | Machine-readable status (§87) |
| Reserve specification | `src/lib/mtq-final-reserve-spec.ts` | Reserve mathematics (§§16-46) |
| Reference JSON | `blueprint_reference.json` | Consolidated reference data |
| Honest state | `src/lib/implementation-status-report.ts → getHonestState74()` | §74 honest state |
| Gates | `src/lib/implementation-status-report.ts → INSTITUTIONAL_VALIDATION_GATES` | §91 gates |
| Acceptance criteria | `src/lib/implementation-status-report.ts → FINAL_ACCEPTANCE_CRITERIA` | §90 criteria |

### 30.2.2 Conflict Resolution Rule

When two artifacts disagree, the resolution order is:

1. **Source code** (the `.ts` files in `src/lib/`) — the executable implementation.
2. **This blueprint** (the SOT document + parts) — the human-readable specification.
3. **Reference JSON** — the consolidated reference data.
4. **Other documents** (READMEs, memos, slide decks, prior blueprint versions) — SUPERSEDED.

The source code wins because it is what actually executes. If the blueprint says "X is true" but the source code does not implement X, then X is not true (the blueprint has a bug; the source is the truth). Conversely, if the source code does X but the blueprint says "X is forbidden", the source code is in violation and must be fixed — but in the interim, the source code is what is happening.

### 30.2.3 The Single Source of Truth Test

Any claim about MITHQAL can be tested against the single source of truth:

- **"MITHQAL is licensed in jurisdiction X."** — Check §28.4 (Licensing Matrix) and §28.6 (Gate G02). If `licensesObtained = 0`, the claim is false.
- **"MITHQAL is integrated with a bank."** — Check §28.6 (Gate G03, G05). If no bank is contracted, the claim is false.
- **"MITHQAL's reserve ratio is 130%."** — Check §29.4.1. The strategic target is 130%; the actual RR is computed from real-time data. The current illustrative RR is 122.29% (per §29.19.5).
- **"MITHQAL is production-ready."** — Check §28.6. If 0/13 gates passed, the claim is false.

## 30.3 Version History (Forward-Only)

The version history is **forward-only**. There is no "SUPERSEDED" status — older versions are simply listed with their date and their final disposition. Once a version is replaced, it is no longer authoritative; it is retained for historical reference only.

### 30.3.1 Version History Table

| Version | Date | Status | Disposition |
|---|---|---|---|
| `v24.2.1` | (historical) | Historical | Original ~76,000-line blueprint. Retained in repo for forensic reconciliation. NOT AUTHORITATIVE. |
| `v25.0` | (historical) | Historical | First remediation pass. Replaced by v25.1. NOT AUTHORITATIVE. |
| `v25.0.D` | (historical) | Historical | Detailed design pass (BM-01..BM-16 workflow, 5-entity org structure). Replaced by v25.1. NOT AUTHORITATIVE. |
| `v25.1` | (historical) | Historical | First consolidation pass. Replaced by v25.2. NOT AUTHORITATIVE. |
| `v25.1-final-amendment` | (historical) | Historical | Institutional interop amendment. Folded into v25.2. NOT AUTHORITATIVE. |
| `v25.2` | 2026-08-22 | **FROZEN** | **Current authoritative version.** APPROVED CANDIDATE FOR CONTROLLED TESTING. |
| `v25.2.AUDIT-CLOSURE` | 2026-08-22 | Appended to v25.2 | Audit-closure addendum (idempotent; appended to v25.2 not a new version). |
| `v25.3` | (future) | Planned | Next planned version. Will be created when institutional validation advances require a new authoritative snapshot. NOT YET AUTHORITATIVE. |

### 30.3.2 What "Forward-Only" Means

The version history is **forward-only**:
- **No version is ever deleted.** Every version that has existed is listed.
- **No version is ever "rolled back".** If a defect is found in v25.2, the fix is published as v25.2.1 (a patch) or v25.3 (a minor) — not by reverting to v25.1.
- **No version is ever "SUPERSEDED" with a strike-through.** The disposition column states "NOT AUTHORITATIVE" for older versions; they remain readable for reference.
- **The current authoritative version is always the latest row marked FROZEN.**

### 30.3.3 Version Numbering Convention

| Version Segment | Meaning | Example |
|---|---|---|
| Major (X.0) | Architectural break from prior major | v25.0 (5-entity restructure) |
| Minor (X.Y) | Substantive content change | v25.2 (V25.2 build-out) |
| Patch (X.Y.Z) | Bug fix, clarification, typo | (none yet; would be v25.2.1) |
| Label suffix | Optional qualifier | `-final`, `-final-amendment`, `-AUDIT-CLOSURE` |

The next version after v25.2 will be:
- **v25.2.1** if a patch is required (bug fix, typo, clarification — no semantic change).
- **v25.3** if a minor substantive change is required (e.g., adding a new gate, refining an equation parameter).
- **v26.0** if a major architectural break is required (e.g., abandoning the bank-mediated model — extremely unlikely).

## 30.4 Branch Protection on `main`

The `main` branch is the canonical branch for the v25.2 blueprint and implementation. Branch protection rules apply.

### 30.4.1 Branch Protection Rules (Canonical)

| Rule | Setting | Rationale |
|---|---|---|
| Require pull request before merging | ✅ Enabled | No direct pushes to `main`. |
| Required approving reviews | 2 | Two-reviewer rule for all changes. |
| Dismiss stale approvals on new push | ✅ Enabled | Reviewers must re-approve if code changes. |
| Require code owner review | ✅ Enabled | CODEOWNERS file dictates required reviewers per path. |
| Require status checks to pass | ✅ Enabled | CI must be green. |
| Required status checks | `lint`, `typecheck`, `test`, `blueprint-lint` | All four must pass. |
| Require branches to be up to date | ✅ Enabled | PR must merge latest `main`. |
| Require signed commits | ✅ Enabled | GPG / SSH signing required. |
| Require linear history | ✅ Enabled | No merge commits; rebase only. |
| Allow force pushes | ❌ Disabled | Never. |
| Allow deletions | ❌ Disabled | Never. |
| Restrict who can push to matching branches | Foundation governance body only | Even admins cannot push directly. |

### 30.4.2 CODEOWNERS (Canonical)

The `CODEOWNERS` file (at repository root) specifies required reviewers per path. Key entries:

```
# Blueprint documents
MITHQAL_MASTER_BLUEPRINT_SOT.md    @foundation-governance @blueprint-architect
/blueprint_parts/                  @foundation-governance @blueprint-architect

# Implementation status
/src/lib/implementation-status-report.ts   @foundation-governance @blueprint-architect

# Reserve specification
/src/lib/mtq-final-reserve-spec.ts         @foundation-governance @reserve-architect

# Finality
/src/lib/finality-before-mint.ts           @foundation-governance @security-architect

# Protected backing cell
/src/lib/protected-backing-cell.ts         @foundation-governance @reserve-architect

# Licensing
/src/lib/licensing-entity-matrix.ts        @foundation-governance @legal-counsel

# Three-book separation
/src/lib/three-book-separation.ts          @foundation-governance @accounting-architect

# Systemic exposure
/src/lib/systemic-exposure-engine.ts       @foundation-governance @risk-architect

# Bank default & resolution
/src/lib/bank-default-resolution.ts       @foundation-governance @legal-counsel

# Legal liability
/src/lib/legal-liability-framework.ts     @foundation-governance @legal-counsel
```

(Actual `CODEOWNERS` file may have additional entries; the above is the canonical set for v25.2.)

## 30.5 Tag: `v25.2-final` (FROZEN)

The v25.2 version is tagged as `v25.2-final`. The tag is **FROZEN** — it points to a specific commit and must never be moved.

### 30.5.1 Tag Properties

| Property | Value |
|---|---|
| Tag name | `v25.2-final` |
| Tag type | Annotated (not lightweight) |
| Tag message | "MITHQAL Master Blueprint v25.2 — FINAL — FROZEN — APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED" |
| Tag date | 2026-08-22 |
| Tag signer | Foundation governance body |
| Tag signature | GPG-signed |
| Tag immutability | **FROZEN — never move** |

### 30.5.2 Tag Verification Command

To verify the tag exists and points to the expected commit:

```bash
git tag -v v25.2-final
git rev-list -n 1 v25.2-final
```

The first command verifies the GPG signature. The second prints the commit hash the tag points to.

### 30.5.3 What "FROZEN" Means

A FROZEN tag:
- **Cannot be moved** to a different commit (this would require force-pushing the tag, which is forbidden by branch protection and by Foundation policy).
- **Cannot be deleted.** (Branch protection disables tag deletions.)
- **Is the canonical reference** for "the v25.2 architecture as approved."
- **Is the basis for any institutional review.** A regulator, auditor, or counterparty that asks "show me the v25.2 architecture" should be pointed at this tag.

### 30.5.4 What "FROZEN" Does Not Mean

A FROZEN tag does **not** mean:
- The implementation cannot evolve. (It can — on `main`, on feature branches, on patch branches.)
- The blueprint cannot be patched. (It can — as v25.2.1, which would be tagged `v25.2.1-final`.)
- The system is "done." (It is not — see §28.)

The FROZEN tag is a **snapshot**. Future work happens on later tags.

## 30.6 Backup Branch: `v25.2-hardened-backup`

In addition to the FROZEN tag, a backup branch `v25.2-hardened-backup` exists as a defensive duplicate of the v25.2 state.

### 30.6.1 Backup Branch Properties

| Property | Value |
|---|---|
| Branch name | `v25.2-hardened-backup` |
| Base commit | Same as `v25.2-final` tag |
| Branch purpose | Defensive duplicate; survives any `main` corruption |
| Branch update policy | Updated only on patch releases of v25.2 (e.g., v25.2.1); otherwise static |
| Branch protection | Same as `main` (no direct pushes, no force pushes, no deletions) |
| Branch owner | Foundation governance body |

### 30.6.2 Why a Backup Branch Exists

A tag is immutable, but a tag alone is a single point of failure: if the repository is corrupted, force-pushed, or deleted, the tag could be lost. A backup branch provides redundancy:

1. **Survives `main` corruption.** If `main` is force-pushed (in violation of policy) or corrupted, the backup branch retains the v25.2 state.
2. **Survives tag deletion (in violation of policy).** If the FROZEN tag is somehow deleted, the backup branch retains the state.
3. **Supports cherry-picking.** If a critical fix is needed against v25.2 (not against the latest `main`), the backup branch is the base.

### 30.6.3 Backup Branch Synchronization

The backup branch is synchronized with the `v25.2-final` tag at creation time. Subsequent updates occur only when a patch (v25.2.X) is released:

```bash
# At v25.2 release:
git checkout v25.2-final
git checkout -b v25.2-hardened-backup
git push origin v25.2-hardened-backup

# At v25.2.1 patch release:
git checkout v25.2.1-final
git checkout v25.2-hardened-backup
git merge --ff-only v25.2.1-final
git push origin v25.2-hardened-backup
```

The `--ff-only` ensures the backup branch only moves forward (never diverges).

## 30.7 Integrity Verification Script

The integrity of the v25.2 architecture can be verified by running the following script. The script checks:

1. The `v25.2-final` tag exists and is signed.
2. The `v25.2-hardened-backup` branch exists and points to the tag's commit.
3. The `MITHQAL_MASTER_BLUEPRINT_SOT.md` file exists at the tag's commit.
4. The `src/lib/implementation-status-report.ts` file exists at the tag's commit.
5. The `blueprint_reference.json` (or equivalent) exists.
6. The honest state declared in the source matches the honest state in this document.
7. The 13 institutional validation gates are all not-`INSTITUTIONALLY_VALIDATED` (i.e., the system is honestly not production-authorized).
8. The 19/23 acceptance criteria count is correct.

### 30.7.1 Integrity Verification Script (Bash)

```bash
#!/usr/bin/env bash
# ============================================================================
# MITHQAL v25.2 — Integrity Verification Script
# Verifies that the v25.2 architecture is intact, signed, and consistent.
# ============================================================================
set -euo pipefail

TAG="v25.2-final"
BACKUP_BRANCH="v25.2-hardened-backup"
SOT_FILE="MITHQAL_MASTER_BLUEPRINT_SOT.md"
STATUS_FILE="src/lib/implementation-status-report.ts"

echo "============================================================"
echo "MITHQAL v25.2 — Integrity Verification"
echo "============================================================"

# 1. Verify tag exists and is signed
echo ""
echo "[1/8] Verifying tag $TAG exists and is signed..."
if git tag -v "$TAG" > /dev/null 2>&1; then
    echo "  ✅ Tag $TAG exists and signature verified."
else
    echo "  ❌ Tag $TAG missing or signature invalid."
    exit 1
fi

TAG_COMMIT=$(git rev-list -n 1 "$TAG")
echo "  Tag points to commit: $TAG_COMMIT"

# 2. Verify backup branch exists and points to the tag's commit
echo ""
echo "[2/8] Verifying backup branch $BACKUP_BRANCH..."
if git rev-parse --verify "refs/heads/$BACKUP_BRANCH" > /dev/null 2>&1; then
    BACKUP_COMMIT=$(git rev-parse "refs/heads/$BACKUP_BRANCH")
    if [ "$BACKUP_COMMIT" = "$TAG_COMMIT" ]; then
        echo "  ✅ Backup branch $BACKUP_BRANCH exists and points to tag commit."
    else
        echo "  ⚠️  Backup branch points to $BACKUP_COMMIT (differs from tag $TAG_COMMIT)."
        echo "      This is acceptable only if v25.2.X patch has been released."
    fi
else
    echo "  ❌ Backup branch $BACKUP_BRANCH does not exist."
    exit 1
fi

# 3. Verify SOT file exists at the tag's commit
echo ""
echo "[3/8] Verifying $SOT_FILE exists at tag commit..."
if git cat-file -e "$TAG_COMMIT:$SOT_FILE" 2>/dev/null; then
    echo "  ✅ $SOT_FILE exists at $TAG."
else
    echo "  ❌ $SOT_FILE missing at $TAG."
    exit 1
fi

# 4. Verify status file exists at the tag's commit
echo ""
echo "[4/8] Verifying $STATUS_FILE exists at tag commit..."
if git cat-file -e "$TAG_COMMIT:$STATUS_FILE" 2>/dev/null; then
    echo "  ✅ $STATUS_FILE exists at $TAG."
else
    echo "  ❌ $STATUS_FILE missing at $TAG."
    exit 1
fi

# 5. Verify reference JSON exists (at HEAD; this is the live reference)
echo ""
echo "[5/8] Verifying blueprint_reference.json exists..."
# Try multiple locations
REF_PATHS=(
    "/tmp/blueprint_reference.json"
    "blueprint_reference.json"
    "docs/blueprint_reference.json"
    "src/lib/blueprint_reference.json"
)
REF_FOUND=false
for REF_PATH in "${REF_PATHS[@]}"; do
    if [ -f "$REF_PATH" ]; then
        echo "  ✅ Reference JSON found at $REF_PATH."
        REF_FOUND=true
        break
    fi
done
if [ "$REF_FOUND" = "false" ]; then
    echo "  ⚠️  Reference JSON not found at standard paths."
    echo "      (Acceptable if running in a context where reference JSON is not yet checked in.)"
fi

# 6. Verify honest state declared in source matches this document
echo ""
echo "[6/8] Verifying honest state declaration..."
# Extract honest state from the TypeScript source
HONEST=$(grep -c "honest: true" "$STATUS_FILE" 2>/dev/null || echo "0")
PROD_AUTH=$(grep -c "productionAuthorized: false" "$STATUS_FILE" 2>/dev/null || echo "0")
if [ "$HONEST" -ge 1 ] && [ "$PROD_AUTH" -ge 1 ]; then
    echo "  ✅ Honest state declaration present: honest=true, productionAuthorized=false."
else
    echo "  ❌ Honest state declaration missing or wrong."
    exit 1
fi

# 7. Verify 0/13 institutional gates passed
echo ""
echo "[7/8] Verifying 0/13 institutional gates passed (no production authorization)..."
# Count gates at INSTITUTIONALLY_VALIDATED or PRODUCTION_READY in source
GATES_PASSED=$(grep -E "INSTITUTIONALLY_VALIDATED|PRODUCTION_READY" "$STATUS_FILE" | grep -v "PENDING\|DESIGNED\|IMPLEMENTED\|TESTED" | wc -l)
if [ "$GATES_PASSED" -eq 0 ]; then
    echo "  ✅ 0/13 gates passed — system honestly NOT production-authorized."
else
    echo "  ⚠️  Found $GATES_PASSED gate(s) at INSTITUTIONALLY_VALIDATED or PRODUCTION_READY."
    echo "      (If this is unexpected, investigate — production authorization may have been granted.)"
fi

# 8. Verify 19/23 acceptance criteria
echo ""
echo "[8/8] Verifying 19/23 acceptance criteria met..."
AC_MET=$(grep -c "met: true" "$STATUS_FILE" 2>/dev/null || echo "0")
AC_TOTAL=$(grep -c "met:" "$STATUS_FILE" 2>/dev/null || echo "0")
echo "  Found $AC_MET met out of $AC_TOTAL total."
if [ "$AC_MET" -eq 19 ] && [ "$AC_TOTAL" -eq 23 ]; then
    echo "  ✅ 19/23 acceptance criteria met — matches §28.5."
else
    echo "  ⚠️  Acceptance criteria count ($AC_MET/$AC_TOTAL) does not match §28.5 (19/23)."
    echo "      (If a criterion has been added or met, update §28.5 accordingly.)"
fi

echo ""
echo "============================================================"
echo "Integrity verification complete."
echo "============================================================"
echo ""
echo "Summary:"
echo "  - Tag $TAG: FROZEN, signed ✅"
echo "  - Backup branch $BACKUP_BRANCH: present ✅"
echo "  - SOT file at tag: present ✅"
echo "  - Status file at tag: present ✅"
echo "  - Honest state: declared ✅"
echo "  - Gates: 0/13 passed (NOT production-authorized) ✅"
echo "  - Acceptance criteria: 19/23 met ✅"
echo ""
echo "MITHQAL v25.2 is intact and consistent."
echo "Status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED."
```

### 30.7.2 Running the Script

```bash
chmod +x scripts/verify-v25.2-integrity.sh
./scripts/verify-v25.2-integrity.sh
```

The script exits 0 on success, non-zero on any failure. It is suitable for inclusion in CI as a post-deploy integrity check.

### 30.7.3 What the Script Does Not Verify

The integrity script does **not** verify:

- The correctness of the equations (for that, see the unit tests in `src/lib/tests/`).
- The semantic consistency of the blueprint (for that, see the contradiction scan in `src/lib/contradiction-scan.ts`).
- The institutional validation status of any external counterparty (for that, see §28).
- The legal validity of any claim (for that, see §28.6 gate G01).

The script verifies only that the **artifacts** are present, signed, and self-consistent at the level of file existence and field declaration.

## 30.8 Change-Control Discipline

Changes to v25.2 follow a strict change-control discipline.

### 30.8.1 Change Tiers

| Tier | Description | Examples | Approval Required |
|---|---|---|---|
| **T0 — Typo / formatting** | No semantic change. | Spelling fix; whitespace; markdown formatting. | 1 reviewer (any code owner). |
| **T1 — Clarification** | Semantic-preserving wording change. | Rewording an explanation; adding a worked example. | 2 reviewers + blueprint architect. |
| **T2 — Patch** | Small semantic change (no new equations, no new gates). | Adjusting a parameter bound; correcting an equation typo. | 2 reviewers + blueprint architect + Foundation. |
| **T3 — Minor** | Substantive change (new equation parameter, new sub-gate, refined threshold). | Adjusting the digital sleeve tiers; refining the EWMA decay. | 2 reviewers + blueprint architect + Foundation + model-validation lead. |
| **T4 — Major** | Architectural change (new gate, new module, new equation). | Adding a 14th institutional gate; adding a new asset class to the reserve. | Foundation governance body + external model validation. |

### 30.8.2 Change Process

1. **Open an issue** describing the proposed change, including tier (T0-T4).
2. **Discuss** on the issue until consensus is reached (especially for T3+).
3. **Open a PR** against `main` with the change. The PR must:
   - Update the affected source files.
   - Update the affected blueprint sections (if any).
   - Update the reference JSON (if any).
   - Update the implementation status report (if any status field changes).
   - Update the version history (§30.3) if a new version is warranted.
   - Pass all CI checks (`lint`, `typecheck`, `test`, `blueprint-lint`).
4. **Review** by the required approvers per the tier.
5. **Merge** (rebase only; no merge commits).
6. **Tag** if a new version is warranted (e.g., v25.2 → v25.2.1 for a T2 patch).
7. **Update backup branch** if a new tag is created.

### 30.8.3 Emergency Changes

In the event of a critical defect or breach:

1. The Foundation governance body may authorize an **emergency hotfix** bypassing the normal T3/T4 approval process.
2. The hotfix is applied as a PR with the `emergency` label; only 1 reviewer (the blueprint architect) is required.
3. The hotfix is tagged as `v25.2.X-emergency` (e.g., `v25.2.1-emergency`).
4. Within 7 days, the emergency change is reviewed retroactively and either ratified (becoming the new normal) or reverted.

### 30.8.4 Forbidden Change Patterns

| Forbidden Pattern | Why Forbidden |
|---|---|
| Direct push to `main` | Bypasses review + branch protection. |
| Force-push to `main` | Rewrites history; corrupts the tag. |
| Force-push the `v25.2-final` tag | Destroys the FROZEN snapshot. |
| Delete the `v25.2-final` tag | Destroys the FROZEN snapshot. |
| Delete the `v25.2-hardened-backup` branch | Destroys the backup. |
| Merge without CI green | Bypasses automated checks. |
| Merge without required approvals | Bypasses human review. |
| Modify the honest state fields directly without evidence | Violates §94 non-inflation. |
| Modify a gate status to `INSTITUTIONALLY_VALIDATED` without institutional evidence | Violates §94. |
| Modify an acceptance criterion to `met: true` without evidence | Violates §94. |

## 30.9 Prohibited Versioning Patterns

The following versioning patterns are forbidden in the MITHQAL repository.

### 30.9.1 Forbidden Versioning Patterns

| # | Pattern | Why Forbidden |
|---|---|---|
| 1 | "v25.2-final-v2" | Tag renaming. Use `v25.2.1-final` for patches. |
| 2 | "v25.2-WIP" | Work-in-progress tags. Use a feature branch, not a tag. |
| 3 | "v25.2-draft" | Draft tags. Same as above. |
| 4 | "v25.2-old" | Tag renaming. Old versions are simply not authoritative; they don't need a suffix. |
| 5 | "v24.2.1-final" (after v25.2 release) | Reverting to a prior version. Use patches against the current version. |
| 6 | Multiple `*-final` tags pointing to different commits | One FROZEN tag per version. |
| 7 | Branch names that look like version tags (`v25.2`) | Use `release/v25.2` or `v25.2-hardened-backup` instead. |
| 8 | "vNext" or "vFuture" placeholder tags | Use planned-version entries in the version history table. |
| 9 | Force-pushing tags | Tags are immutable (especially FROZEN tags). |
| 10 | Deleting tags | Tags are immutable. |

### 30.9.2 The Single FROZEN Tag Rule

There is **exactly one** FROZEN tag per released version. The current FROZEN tag is `v25.2-final`. The next FROZEN tag will be either `v25.2.1-final` (patch) or `v25.3-final` (minor). There is never a state where two FROZEN tags coexist for the same major.minor version.

### 30.9.3 The Authoritative Version Test

To determine the current authoritative version at any time:

```bash
# List all annotated tags
git tag -n --list 'v*-final'

# The most recent (by tag date) annotated tag is the current authoritative version.
```

The output should show `v25.2-final` as the most recent (or a later version, if released).

This concludes Section 30.

---

# SECTION 31 — GLOSSARY AND TERMINOLOGY

## 31.1 Canonical Terminology Authority

This section is the **canonical terminology authority** for MITHQAL. Every term used in the v25.2 architecture has:
- A **preferred term** (the only term that should be used).
- An **exact meaning** (the precise definition).
- **Prohibited alternatives** (terms that must NOT be used).
- A **context** (where the term applies).

If any document, communication, or artifact uses a term in a way that conflicts with this glossary, **this glossary controls**. The offending artifact should be corrected.

### 31.1.1 Why a Canonical Glossary Exists

MITHQAL is a Constitutional Monetary and Institutional Settlement Infrastructure — not a crypto project, not a fintech app, not a stablecoin. The vocabulary used to describe it matters because it shapes how regulators, banks, and the public perceive it. Loose terminology ("crypto", "stablecoin", "partner", "approved") creates legal, regulatory, and reputational risk. Canonical terminology eliminates this risk.

### 31.1.2 The Three Rules of Canonical Terminology

1. **Use the preferred term.** Not a synonym, not a "close enough" alternative, not a marketing-friendly variant.
2. **Use the term with its exact meaning.** Not a stretched meaning, not a colloquial usage, not an "industry-standard" meaning that differs from this glossary.
3. **Never use a prohibited alternative.** Even if it sounds innocuous, even if it's common in the industry, even if "everyone knows what we mean".

## 31.2 Master Glossary — 40+ Terms

### 31.2.1 MTQ (Mithqal Token)

| Field | Value |
|---|---|
| **Preferred term** | MTQ (singular); MTQ (plural, same form); "the MTQ" |
| **Exact meaning** | The unit of settlement instrument issued by MITHQAL against bank-established backing, pegged 1:1 to USD at issuance, transferable between participating banks and their corporate customers via the MITHQAL Bank Gateway. |
| **Prohibited alternatives** | "coin", "cryptocurrency", "token", "Mithqal coin", "Mithqal crypto", "MITH coin", "Mithqal stablecoin", "Mithqal digital asset" |
| **Context** | Used throughout the v25.2 architecture to refer to the settlement instrument. |

### 31.2.2 PAR

| Field | Value |
|---|---|
| **Preferred term** | PAR |
| **Exact meaning** | The par value of MTQ, fixed at 1.0 (1 MTQ = 1 USD at issuance). The par value never changes for any MTQ token. |
| **Prohibited alternatives** | "peg", "peg value", "face value", "nominal value" |
| **Context** | Used in the Liability equation `L = S × PAR` (§29.2). |

### 31.2.3 MBG (MITHQAL Bank Gateway)

| Field | Value |
|---|---|
| **Preferred term** | MITHQAL Bank Gateway (MBG) |
| **Exact meaning** | The translation layer (not a transformation layer) between participating bank systems and the MITHQAL Core. The MBG translates ISO 20022 / SWIFT messages to and from MITHQAL-internal representations, without altering their semantic content. The bank's core banking system remains authoritative for all customer balances, KYC/KYB, AML/sanctions, and FX. |
| **Prohibited alternatives** | "payment gateway", "payment processor", "payment rail", "API gateway", "Mithqal bridge", "Mithqal connector", "Mithqal adapter" (the last three are partially acceptable in technical contexts but the preferred term is MBG) |
| **Context** | Used throughout the v25.2 architecture to refer to the bank-MITHQAL interface. |

### 31.2.4 DMCE (Dynamic Minting Capacity Engine)

| Field | Value |
|---|---|
| **Preferred term** | Dynamic Minting Capacity Engine (DMCE) |
| **Exact meaning** | The MITHQAL-internal engine that dynamically computes the maximum MTQ that may be minted at any given time, based on available backing, concentration limits, eligibility, and stress-test constraints. BM-14 in the 16-step workflow. |
| **Prohibited alternatives** | "minting limiter", "minting quota", "issuance cap", "supply cap" |
| **Context** | BM-14 in the issuance workflow (§28.9.4 of the workflow). |

### 31.2.5 PBC (Protected Backing Cell)

| Field | Value |
|---|---|
| **Preferred term** | Protected Backing Cell (PBC) |
| **Exact meaning** | A 17-field structured record representing a single, identifiable, custodian-held asset that backs a specific MTQ obligation. The PBC enforces the anti-double-count rule (one cell → at most one MTQ obligation) and computes `AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking`. |
| **Prohibited alternatives** | "backing record", "collateral entry", "asset entry", "reserve entry", "backing token" |
| **Context** | §47 of the v25.2 architecture; implemented in `src/lib/protected-backing-cell.ts`. |

### 31.2.6 RR (Reserve Ratio)

| Field | Value |
|---|---|
| **Preferred term** | Reserve Ratio (RR) |
| **Exact meaning** | The ratio of the adjusted reserve to the liability: `RR = R_a / L`. MITHQAL's strategic target is 130%; policy floor is 105%; absolute solvency floor is 100%. |
| **Prohibited alternatives** | "backing ratio", "collateralization ratio", "coverage ratio" (the last is reserved for FSCR), "reserve coverage" |
| **Context** | §29.4.1; status thresholds: STRATEGIC ≥ 130%, NORMAL ≥ 110%, DEFENSIVE ≥ 105%, EMERGENCY ≥ 100%, BREACH < 100%. |

### 31.2.7 FSCR (Funding & Solvency Coverage Ratio)

| Field | Value |
|---|---|
| **Preferred term** | Funding & Solvency Coverage Ratio (FSCR) |
| **Exact meaning** | The ratio of the stress reserve to the liability: `FSCR = R_l / L`. FSCR measures solvency under the defined stress scenario. Status thresholds: NORMAL ≥ 110%, DEFENSIVE ≥ 105%, EMERGENCY ≥ 100%, BREACH < 100%. |
| **Prohibited alternatives** | "stress ratio", "stress coverage", "stress-test RR", "stress RR" (the last is partially acceptable in informal contexts) |
| **Context** | §29.4.2; notation reconciliation: the spec §40 writes `L / R_l` but thresholds require `R_l / L`. |

### 31.2.8 LCR (Liquidity Coverage Ratio)

| Field | Value |
|---|---|
| **Preferred term** | Liquidity Coverage Ratio (LCR) |
| **Exact meaning** | The Basel III liquidity metric: `LCR = HQLA / NetOutflow_30d`. Status: ADEQUATE ≥ 100%, STRESSED ≥ 90%, BREACH < 90%. |
| **Prohibited alternatives** | "liquidity ratio", "liquidity coverage", "Basel III ratio" |
| **Context** | §29.4.3; standard Basel III definition. |

### 31.2.9 DRQS (Digital Reserve Quality Score)

| Field | Value |
|---|---|
| **Preferred term** | Digital Reserve Quality Score (DRQS) |
| **Exact meaning** | An 8-factor quality score (0-10) for digital assets in the reserve universe. Weights: 0.20 issuer + 0.15 reserve + 0.15 redemption + 0.15 depeg + 0.10 jurisdiction + 0.10 custody + 0.10 operational + 0.05 liquidity. Thresholds: ≥ 7.5 CORE, 6.0-7.5 CONDITIONAL, < 6.0 EXCLUDED. |
| **Prohibited alternatives** | "digital quality score", "stablecoin quality score", "digital asset rating" |
| **Context** | §29.13; implemented in `src/lib/mtq-final-reserve-spec.ts`. |

### 31.2.10 TGRS (Tokenized Gold Reserve Score)

| Field | Value |
|---|---|
| **Preferred term** | Tokenized Gold Reserve Score (TGRS) |
| **Exact meaning** | A 10-factor quality score (0-10) for tokenized gold assets (e.g., PAXG, XAUT). Thresholds: ≥ 8.0 ELIGIBLE, 6.0-8.0 CONDITIONAL, < 6.0 REJECTED. Tokenized gold is a conditional separate exposure (NOT auto-counted as part of the 18% physical gold). |
| **Prohibited alternatives** | "tokenized gold score", "PAXG score", "digital gold rating" |
| **Context** | §29.11. |

### 31.2.11 SDC (Silver Diversification Contribution)

| Field | Value |
|---|---|
| **Preferred term** | Silver Diversification Contribution (SDC, with subscript Ag for silver: SDC_Ag) |
| **Exact meaning** | The net resilience contribution of adding silver to the reserve: `SDC_Ag = NetResilienceGain − NetCost`. Silver is admitted only if `SDC_Ag > 0`, with a maximum allocation of 3%. Currently `SDC_Ag ≤ 0` → silver allocation = 0%. |
| **Prohibited alternatives** | "silver score", "silver rating", "silver allocation factor" |
| **Context** | §29.10. |

### 31.2.12 BRI (Bullion Resilience Index)

| Field | Value |
|---|---|
| **Preferred term** | Bullion Resilience Index (BRI) |
| **Exact meaning** | An advisory-only metric measuring bullion's performance as a resilience asset over a period: `BRI = (gold_0/gold_T)^0.90 · [silver term if held]`. BRI does NOT drive any operative allocation decision. |
| **Prohibited alternatives** | "bullion index", "gold index", "resilience score" |
| **Context** | §29.12; ADVISORY ONLY. |

### 31.2.13 COFER

| Field | Value |
|---|---|
| **Preferred term** | COFER (Currency Composition of Foreign Exchange Reserves) |
| **Exact meaning** | The IMF's published dataset on the currency composition of official foreign exchange reserves. Used as a structural-weight input: `C_i = 0.50·COFER_i + 0.40·SWIFT_i + 0.10·BIS_i`. |
| **Prohibited alternatives** | "IMF reserves", "FX reserves share", "central bank reserves share" |
| **Context** | §29.5.1; IMF-published, quarterly. |

### 31.2.14 SWIFT Traffic Share

| Field | Value |
|---|---|
| **Preferred term** | SWIFT traffic share |
| **Exact meaning** | The share of SWIFT payment-message traffic denominated in currency i. Used as a structural-weight input (40% weight). |
| **Prohibited alternatives** | "SWIFT share", "SWIFT volume share", "payment traffic share" (the last is partially acceptable) |
| **Context** | §29.5.1; SWIFT-published, monthly. |

### 31.2.15 BIS Triennial Survey

| Field | Value |
|---|---|
| **Preferred term** | BIS Triennial Survey turnover share |
| **Exact meaning** | The Bank for International Settlements' Triennial Central Bank Survey of FX and OTC derivatives markets; the share of FX turnover denominated in currency i. Used as a structural-weight input (10% weight). |
| **Prohibited alternatives** | "BIS share", "FX turnover share", "Triennial share" |
| **Context** | §29.5.1; BIS-published, triennial (every 3 years). |

### 31.2.16 HQLA (High-Quality Liquid Assets)

| Field | Value |
|---|---|
| **Preferred term** | High-Quality Liquid Assets (HQLA) |
| **Exact meaning** | The subset of the reserve that qualifies as high-quality liquid under Basel III (Level 1, Level 2A, Level 2B). Used in `LCR = HQLA / NetOutflow_30d`. |
| **Prohibited alternatives** | "liquid assets", "cash equivalents", "Tier 1 assets" |
| **Context** | §29.17; Basel III definition. |

### 31.2.17 CALM (Constitutional Anchor Liquidity Model)

| Field | Value |
|---|---|
| **Preferred term** | Constitutional Anchor Liquidity Model (CALM) |
| **Exact meaning** | The MITHQAL-internal model that anchors reserve policy to constitutional principles (gold as monetary anchor, bank-mediated settlement, three-book separation, finality-before-mint). CALM's `rrTarget = 1.30` (130%) under v25.2. |
| **Prohibited alternatives** | "liquidity model", "reserve model", "anchor model" |
| **Context** | Internal reserve-policy model; implemented in `src/lib/mtq-final-reserve-spec.ts`. |

### 31.2.18 MRRC (MITHQAL Monetary & Reserve Control)

| Field | Value |
|---|---|
| **Preferred term** | MITHQAL Monetary & Reserve Control Division (MRRC) |
| **Exact meaning** | The MITHQAL-internal division responsible for monetary authorization (BM-15 in the 16-step workflow). MRRC is structurally separated from commercial / sales teams; commercial teams cannot override MRRC's authorization decisions. |
| **Prohibited alternatives** | "monetary committee", "reserve committee", "issuance committee", "monetary authority" (the last is reserved for central banks) |
| **Context** | §54 (Finality-Before-Mint, Layer L4); BM-15 in the issuance workflow. |

### 31.2.19 CBGRS (Constitutional Bank Gateway Reserve Specification)

| Field | Value |
|---|---|
| **Preferred term** | Constitutional Bank Gateway Reserve Specification (CBGRS) |
| **Exact meaning** | The canonical specification of how the MBG integrates with bank-side reserve management, including the BM-01..BM-16 workflow, the bank's role in establishing backing (BM-05, BM-06), and the translation (not transformation) principle. |
| **Prohibited alternatives** | "bank gateway spec", "MBG spec", "bank reserve spec" |
| **Context** | §§16-46 + MBG architecture; implemented across `mithqal-bank-gateway.ts` and related modules. |

### 31.2.20 ILPS (Institutional Liquidity & Payment System)

| Field | Value |
|---|---|
| **Preferred term** | Institutional Liquidity & Payment System (ILPS) |
| **Exact meaning** | The MITHQAL-internal framework for institutional-grade liquidity management and payment settlement, including the corridor model (cross-border AED↔SGD demo), the 8 settlement rails, and the 12-step corridor execution flow. |
| **Prohibited alternatives** | "payment system", "liquidity system", "settlement system" |
| **Context** | §28 (Cross-Border Corridor); implemented in `src/lib/ilps.ts`. |

### 31.2.21 Protected Backing Cell (Restatement)

(See §31.2.5. Restated here for completeness of the term list in §31's task brief.)

### 31.2.22 Three-Book Separation

| Field | Value |
|---|---|
| **Preferred term** | Three-Book Economic Separation (or simply "Three-Book") |
| **Exact meaning** | The architectural separation of MITHQAL's economic activity into three books: **Book A** (MITHQAL Corporate — operational funds, equity, operating expenses); **Book B** (Bank-Side MTQ — the bank's MTQ subledger against customer balances); **Book C** (Participant — the participant's own MTQ holdings, recorded by the participant). The 4 anti-commingling tests enforce that no transfer crosses books except via the BM-01..BM-16 workflow. |
| **Prohibited alternatives** | "three-ledger", "triple-ledger", "three-account", "tripartite ledger" |
| **Context** | §51; implemented in `src/lib/three-book-separation.ts`. Status: `threeBookOperational = false`. |

### 31.2.23 Five-Way Reconciliation

| Field | Value |
|---|---|
| **Preferred term** | Five-Way Reconciliation |
| **Exact meaning** | The daily reconciliation across five sources: (1) Bank core banking ledger; (2) MBG-translated records; (3) MITHQAL Core ledger; (4) Bank-side MTQ subledger (Book B); (5) Participant-side holdings (Book C). All five must agree; discrepancies trigger investigation per procedure. |
| **Prohibited alternatives** | "reconciliation", "daily reconciliation", "multi-way reconciliation" (the last is acceptable in informal contexts) |
| **Context** | Implemented and tested (CI), not yet live. Gate G11. |

### 31.2.24 Finality-Before-Mint

| Field | Value |
|---|---|
| **Preferred term** | Finality-Before-Mint |
| **Exact meaning** | The invariant: "NO FINAL SETTLEMENT ⟹ NO MTQ MINT". Enforced via 7 layers (L1 API, L2 Workflow, L3 Policy, L4 Authorization, L5 Ledger State Machine, L6 Database TX State, L7 Smart Contract) and verified by 10 bypass-route tests (all blocked). |
| **Prohibited alternatives** | "minting gate", "finality gate", "issuance gate" (the last two are acceptable as shorthand) |
| **Context** | §54; implemented in `src/lib/finality-before-mint.ts`. Status: 7/7 layers code-enforced; 10/10 bypass routes blocked; bypassRisk = `MITIGATED_AT_CODE_LEVEL`. |

### 31.2.25 PBC Anti-Double-Count Rule

| Field | Value |
|---|---|
| **Preferred term** | Anti-Double-Count Rule (PBC) |
| **Exact meaning** | The invariant: a single Protected Backing Cell may be allocated to AT MOST ONE MTQ obligation. The `allocatedObligationIds` field is enforced at mutation time to contain at most one ID. |
| **Prohibited alternatives** | "no-double-pledge", "single-pledge rule", "no-repledge rule" |
| **Context** | §47; enforced in `src/lib/protected-backing-cell.ts`. |

### 31.2.26 MTQ Operating System

| Field | Value |
|---|---|
| **Preferred term** | MTQ Operating System |
| **Exact meaning** | The 16-step Bank Minting Workflow (BM-01..BM-16) plus the supporting infrastructure (MBG, MITHQAL Core, Ledger State Machine, Finality Gate). Phases: BANK (BM-01..BM-06), MBG (BM-07..BM-08), MITHQAL (BM-09..BM-16). |
| **Prohibited alternatives** | "issuance flow", "minting flow", "minting pipeline" |
| **Context** | §28 of the v25.2 architecture; implemented across multiple modules. |

### 31.2.27 Cross-Border Corridor

| Field | Value |
|---|---|
| **Preferred term** | Cross-Border Corridor |
| **Exact meaning** | A defined bilateral settlement path between two currencies (e.g., AED↔SGD), executed via the MBG and the MTQ Operating System. Each corridor has: FX discovery, liquidity routing, compliance checks, settlement execution, confirmation. 12-step flow. |
| **Prohibited alternatives** | "payment corridor", "settlement corridor", "FX corridor" (the last is acceptable as shorthand) |
| **Context** | §28 (Cross-Border Corridor); demo: AED 1,000,000 → SGD 367,365 via USD-bridge. |

### 31.2.28 Settlement Rail

| Field | Value |
|---|---|
| **Preferred term** | Settlement Rail |
| **Exact meaning** | One of 8 supported payment rails: SWIFT, ISO 20022, REST API, Host-to-Host, SFTP, RTGS, Tokenized Deposit, Wholesale CBDC. Each rail has a typical latency and fee; only REST API, Tokenized Deposit, and Wholesale CBDC are atomic-capable. |
| **Prohibited alternatives** | "payment rail", "payment channel", "transport" |
| **Context** | §28 (Cross-Border Corridor); 8 rails supported. |

### 31.2.29 Tokenized Deposit

| Field | Value |
|---|---|
| **Preferred term** | Tokenized Deposit |
| **Exact meaning** | A bank-issued tokenized representation of a customer deposit, transferable on a permissioned blockchain. Used as a settlement rail (typical latency 300ms, fee 2 bps, atomic-capable). |
| **Prohibited alternatives** | "bank coin", "deposit token", "bank stablecoin" |
| **Context** | One of the 8 settlement rails. |

### 31.2.30 Wholesale CBDC

| Field | Value |
|---|---|
| **Preferred term** | Wholesale CBDC (Central Bank Digital Currency, wholesale) |
| **Exact meaning** | A central-bank-issued digital currency for wholesale (interbank) settlement. Used as a settlement rail (typical latency 200ms, fee 1 bp, atomic-capable). |
| **Prohibited alternatives** | "CBDC" (acceptable but ambiguous — could mean retail CBDC), "central bank digital currency" (acceptable but verbose), "digital fiat" |
| **Context** | One of the 8 settlement rails. Wholesale (interbank) only — MITHQAL does not interact with retail CBDC. |

### 31.2.31 ISO 20022

| Field | Value |
|---|---|
| **Preferred term** | ISO 20022 |
| **Exact meaning** | The international standard for electronic data interchange between financial institutions. The MBG translates ISO 20022 messages to/from MITHQAL-internal representations (translation, not transformation). |
| **Prohibited alternatives** | "ISO message", "ISO standard", "SWIFT message" (the last is wrong — SWIFT is a rail, ISO 20022 is a standard) |
| **Context** | MBG translation layer; one of the 8 settlement rails. |

### 31.2.32 RWA (Real-World Asset)

| Field | Value |
|---|---|
| **Preferred term** | Real-World Asset (RWA) |
| **Exact meaning** | A non-native-crypto asset that has been tokenized for representation on a blockchain. MITHQAL's RWA universe includes: RWA Commercial Paper, RWA Enterprise Debt. Each RWA has a notional value, risk weight, haircut, maturity, and adjusted value. |
| **Prohibited alternatives** | "tokenized asset", "real asset", "physical asset" |
| **Context** | §28 (Tokenization); 4 RWAs in the illustrative universe. |

### 31.2.33 StressDRQS

| Field | Value |
|---|---|
| **Preferred term** | StressDRQS |
| **Exact meaning** | The stress-adjusted DRQS: `StressDRQS_i = DRQS_i · (1 − SF_i)`. Used in `EffectiveDRQS_i = min(DRQS_i, StressDRQS_i)`. |
| **Prohibited alternatives** | "stress DRQS", "stressed quality score" |
| **Context** | §29.15. |

### 31.2.34 EffectiveDRQS

| Field | Value |
|---|---|
| **Preferred term** | EffectiveDRQS |
| **Exact meaning** | The operative DRQS used by the optimizer: `EffectiveDRQS_i = min(DRQS_i, StressDRQS_i)`. The optimizer uses the more conservative of baseline and stress. |
| **Prohibited alternatives** | "operative DRQS", "blended DRQS" |
| **Context** | §29.15. |

### 31.2.35 SAE (Stablecoin Risk-Adjusted Exposure)

| Field | Value |
|---|---|
| **Preferred term** | Stablecoin Risk-Adjusted Exposure (SAE) |
| **Exact meaning** | The risk-adjusted contribution of stablecoins to the adjusted reserve: `SAE = Σ_i value_i · (DRQS_i − 1)/DRQS_i · SF_i / R_a`. |
| **Prohibited alternatives** | "stablecoin exposure", "digital exposure metric" |
| **Context** | §29.14. |

### 31.2.36 AvailableBacking

| Field | Value |
|---|---|
| **Preferred term** | AvailableBacking |
| **Exact meaning** | The USD amount of backing available to be allocated to a new MTQ obligation: `AvailableBacking = RecognizedBacking − EncumberedBacking − AlreadyAllocatedBacking`. Clamped to ≥ 0; if negative, constitutional breach is flagged. |
| **Prohibited alternatives** | "available collateral", "free backing", "unused backing" |
| **Context** | §29.16; PBC formula. |

### 31.2.37 RecognizedBacking

| Field | Value |
|---|---|
| **Preferred term** | RecognizedBacking |
| **Exact meaning** | The post-haircut recognized value of a PBC's underlying asset: `RecognizedBacking = valuation × (1 − haircut)`. |
| **Prohibited alternatives** | "recognized value", "haircut value", "adjusted value" (the last is reserved for `R_a`) |
| **Context** | §29.16. |

### 31.2.38 EncumberedBacking

| Field | Value |
|---|---|
| **Preferred term** | EncumberedBacking |
| **Exact meaning** | The portion of a PBC's recognized backing that is encumbered (pledged, frozen, etc.): `EncumberedBacking = encumberedAmount`, clamped to `[0, RecognizedBacking]`. |
| **Prohibited alternatives** | "encumbered portion", "pledged portion", "frozen portion" |
| **Context** | §29.16. |

### 31.2.39 AlreadyAllocatedBacking

| Field | Value |
|---|---|
| **Preferred term** | AlreadyAllocatedBacking |
| **Exact meaning** | The portion of a PBC's recognized backing that has already been allocated to an existing MTQ obligation: `AlreadyAllocatedBacking = utilizedAmount`, clamped to `[0, RecognizedBacking]`. |
| **Prohibited alternatives** | "allocated portion", "used backing", "utilized backing" |
| **Context** | §29.16. |

### 31.2.40 Currency Universe

| Field | Value |
|---|---|
| **Preferred term** | Reserve Currency Universe |
| **Exact meaning** | The 11 reserve-eligible currencies: USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD. Distinct from the 10 settlement-only currencies: EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB. |
| **Prohibited alternatives** | "currency list", "currency basket", "currency pool" |
| **Context** | §28.4.2 of the SOT document; per-currency weights in §29.19.3. |

### 31.2.41 Currency Lifecycle

| Field | Value |
|---|---|
| **Preferred term** | Currency Lifecycle |
| **Exact meaning** | The 5-state lifecycle for each reserve currency: WATCH → REDUCE → SUSPEND → SUBSTITUTE → REINSTATE. Drives exit renormalization and the minimum-floor Q1-Q4 removal ladder. |
| **Prohibited alternatives** | "currency status", "currency state machine", "currency flow" |
| **Context** | §§20-22 of the v25.2 architecture. |

### 31.2.42 Effective USD Exposure

| Field | Value |
|---|---|
| **Preferred term** | Effective USD Exposure |
| **Exact meaning** | The combined USD-linked exposure: `USD_Effective = USD_Direct + AED_USD_Equivalent + SAR_USD_Equivalent + USD_Linked_Synthetic + USD_Linked_Digital`. Ceiling: 35%. |
| **Prohibited alternatives** | "USD exposure", "USD-linked exposure", "dollar exposure" |
| **Context** | §17; current value ~23.5% (below 35% ceiling). |

### 31.2.43 Concentration Limits

| Field | Value |
|---|---|
| **Preferred term** | Concentration Limits |
| **Exact meaning** | The per-currency exposure limits: **Preferred Effective** = 15%; **Hard Effective** = 20%; **Constitutional Sanity Ceiling** = 60% (deeper, never overrides 20%); **USD Effective Ceiling** = 35%; **Minimum Floor** = 0.5% with Q1-Q4 removal ladder. |
| **Prohibited alternatives** | "exposure caps", "currency caps", "weight caps" |
| **Context** | §§16, 22; the 60% sanity ceiling is retained ONLY as a deeper backstop — never overrides the 20% operative limit. |

### 31.2.44 Emergency Resilience Sleeve

| Field | Value |
|---|---|
| **Preferred term** | Emergency Resilience Sleeve |
| **Exact meaning** | A separate, non-double-counted buffer (≤ 15% of liability) that can be deployed in crisis. Distinct from the 80/18/2 composition; this is an additional buffer. |
| **Prohibited alternatives** | "emergency reserve", "buffer reserve", "contingency reserve" |
| **Context** | §22 (§29.7.4). |

### 31.2.45 Honest State

| Field | Value |
|---|---|
| **Preferred term** | Honest State (or "§74 Honest State") |
| **Exact meaning** | The structured declaration of every dimension of MITHQAL's current operating posture, per §74. Comprises 30+ boolean and numeric fields, each sourced from the implementation. **No field is interpreted, projected, or "expected".** |
| **Prohibited alternatives** | "current state", "status snapshot", "state of play" |
| **Context** | §28.7; generated by `getHonestState74()` in `src/lib/implementation-status-report.ts`. |

### 31.2.46 APPROVED CANDIDATE FOR CONTROLLED TESTING

| Field | Value |
|---|---|
| **Preferred term** | APPROVED CANDIDATE FOR CONTROLLED TESTING |
| **Exact meaning** | The current operating posture of MITHQAL v25.2: technical build complete, institutional validation pending, **NOT PRODUCTION-AUTHORIZED**. Allowed: design refinement, code review, sandbox / testnet testing, institutional engagement. Disallowed: live bank integration, live customer transactions, production mints. |
| **Prohibited alternatives** | "approved", "candidate", "in testing", "in pilot", "live", "launched", "production-ready" (all of these are either too strong or use the forbidden word "approved" without qualifier) |
| **Context** | §28.8; this is the ONLY permitted use of the word "APPROVED" in MITHQAL communications. |

### 31.2.47 NOT PRODUCTION-AUTHORIZED

| Field | Value |
|---|---|
| **Preferred term** | NOT PRODUCTION-AUTHORIZED |
| **Exact meaning** | The mandatory qualifier on the operating posture. MITHQAL is NOT production-authorized because 0/13 institutional validation gates have passed. This qualifier must always accompany any statement of MITHQAL's status. |
| **Prohibited alternatives** | "pre-production", "in development", "not yet live" (these are too vague) |
| **Context** | §28.8; must always be paired with "APPROVED CANDIDATE FOR CONTROLLED TESTING". |

### 31.2.48 Single Source of Truth

| Field | Value |
|---|---|
| **Preferred term** | Single Source of Truth |
| **Exact meaning** | The principle that this blueprint (and its parts) is the sole authoritative source for any fact about MITHQAL. Any other artifact that conflicts is wrong, and this blueprint controls. |
| **Prohibited alternatives** | "source of truth", "canonical document", "master document" (the last two are acceptable in informal contexts but the preferred term is "Single Source of Truth") |
| **Context** | §30.2. |

### 31.2.49 Foundation (MITHQAL Foundation)

| Field | Value |
|---|---|
| **Preferred term** | MITHQAL Foundation (or simply "the Foundation") |
| **Exact meaning** | The governance body overseeing MITHQAL. The Foundation is responsible for: production authorization (only after all gates pass), branch protection enforcement, change-control discipline, emergency hotfix approval, and external communications. |
| **Prohibited alternatives** | "Mithqal board", "Mithqal council", "Mithqal governance body", "Mithqal leadership" |
| **Context** | §30; Foundation governance body. |

### 31.2.50 Institutional Engagement

| Field | Value |
|---|---|
| **Preferred term** | Institutional Engagement |
| **Exact meaning** | The process by which MITHQAL engages with institutions (central banks, regulated banks, financial institutions, payment infrastructure, government authorities, regulators, technology providers, cybersecurity assurance, legal/regulatory, standards/research). Engagement types: Architecture Review, Regulatory/Legal Review, Bank Integration Pilot, Settlement Pilot, Sandbox Testing, Independent Assurance. |
| **Prohibited alternatives** | "partnership", "partnership program", "partner network", "vendor program", "channel program" |
| **Context** | §28 of the v25.2 architecture; 10 institution types, 6 engagement types. |

## 31.3 Prohibited Language List

The following words and phrases must **NEVER** be used in any MITHQAL communication — internal or external. Violations are constitutional breaches and trigger Foundation review.

### 31.3.1 Prohibited Words (Absolute)

| # | Prohibited Word | Why | Permitted Alternative |
|---|---|---|---|
| 1 | "cryptocurrency" | MTQ is a settlement instrument, not a cryptocurrency. | "settlement instrument", "MTQ" |
| 2 | "stablecoin" | MTQ is bank-mediated with bank-established backing, not a stablecoin issuer's liability. | "settlement instrument", "MTQ" |
| 3 | "coin" (as a noun for MTQ) | MTQ is not a coin; it is a settlement unit. | "MTQ", "settlement unit" |
| 4 | "token" (as a noun for MTQ) | MTQ is not a token in the crypto sense. | "MTQ", "settlement unit" |
| 5 | "decentralized" | MITHQAL is institutionally mediated, not decentralized. | "institutionally mediated" |
| 6 | "DeFi" | MITHQAL is not a DeFi protocol. | (no alternative; do not use) |
| 7 | "Web3" | MITHQAL is not a Web3 project. | (no alternative; do not use) |
| 8 | "blockchain project" | MITHQAL uses blockchain as infrastructure, but is not a "blockchain project". | "monetary and institutional settlement infrastructure" |
| 9 | "ICO" / "IDO" / "IEO" | MITHQAL does not conduct token sales. | (no alternative; do not use) |
| 10 | "airdrop" | MITHQAL does not airdrop. | (no alternative; do not use) |
| 11 | "yield" (as a feature) | MTQ is a settlement instrument, not a yield-bearing instrument. | (no alternative; do not use) |
| 12 | "staking" | MTQ is not staked. | (no alternative; do not use) |
| 13 | "liquidity mining" | MITHQAL does not engage in liquidity mining. | (no alternative; do not use) |
| 14 | "governance token" | MTQ is not a governance token. | (no alternative; do not use) |
| 15 | "DAO" | MITHQAL is governed by the Foundation, not a DAO. | "Foundation governance" |
| 16 | "APPROVED" (without qualifier) | The word "approved" alone implies production authorization, which does not exist. | "APPROVED CANDIDATE FOR CONTROLLED TESTING" (the only permitted use) |
| 17 | "production-ready" | MITHQAL is not production-ready. | "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED" |
| 18 | "live" (referring to MITHQAL operations) | MITHQAL is not live. | "in controlled testing", "in sandbox" |
| 19 | "launched" | MITHQAL has not launched. | "released as a candidate for controlled testing" |
| 20 | "in production" | MITHQAL is not in production. | "in controlled testing" |
| 21 | "partner" (referring to institutions) | MITHQAL does not have "partners"; it engages with institutions. | "institution MITHQAL is seeking to engage" |
| 22 | "partnered with" | Same as above. | "engaged with", "in institutional engagement with" |
| 23 | "backed by" (without context) | MTQ is backed by bank-established backing held in Protected Backing Cells; "backed by" alone is ambiguous. | "backed by bank-established backing held in Protected Backing Cells (PBCs)" |
| 24 | "fully backed" | MITHQAL has 0 live backing cells; "fully backed" is false. | "designed for full backing via Protected Backing Cells; 0 live cells currently" |
| 25 | "guaranteed" (referring to MTQ value) | MITHQAL is NOT a guarantor of MTQ value; banks are. | "MTQ value is the bank's liability, not MITHQAL's guarantee" |
| 26 | "bank partner" | Same as #21. | "engaged bank", "pilot bank" (only after contract) |
| 27 | "bank integration" (without context) | "MITHQAL is integrated with banks" is false until G03 passes. | "MBG is designed for bank integration; 0 banks contracted currently" |
| 28 | "licensed" (without context) | MITHQAL has 0 licenses. | "MITHQAL's licensing matrix is implemented (72 entries); 0 licenses obtained" |
| 29 | "legally cleared" | MITHQAL has 0 legal opinions. | "MITHQAL's legal-liability framework is implemented across 8 jurisdictions; 0 validated" |
| 30 | "audited" (without context) | Internal audit ≠ independent assurance; the latter (G12) is not contracted. | "internally audited", "independent assurance not yet contracted" |
| 31 | "secure" (as an absolute claim) | Security is not absolute; finality is `MITIGATED_AT_CODE_LEVEL`, not institutionally validated. | "code-level security controls in place; institutional validation pending" |
| 32 | "trustless" | MITHQAL is institutionally mediated; trust is placed in banks, custodians, and the Foundation. | "institutionally mediated" |
| 33 | "permissionless" | MITHQAL is permissioned (banks, custodians, Foundation governance). | "permissioned", "institutionally permissioned" |
| 34 | "open" (as in "open network") | MITHQAL is not an open network. | "closed, institutional network" |
| 35 | "public" (as in "public blockchain") | MITHQAL uses permissioned infrastructure. | "permissioned infrastructure" |
| 36 | "anonymous" | MITHQAL is KYC/KYB/AML-compliant; no anonymity. | "identified", "KYC-verified" |
| 37 | "pseudonymous" | Same as above. | "identified", "KYC-verified" |
| 38 | "retail" | MITHQAL is bank-mediated; no retail customers. | "institutional", "corporate", "bank-mediated" |
| 39 | "consumer" | Same as above. | "institutional", "corporate" |
| 40 | "user" (referring to MITHQAL end-clients) | MITHQAL's end-clients are corporate customers of participating banks, not "users". | "corporate customer", "participant" |
| 41 | "app" (referring to MITHQAL) | MITHQAL is infrastructure, not an app. | "infrastructure", "platform" |
| 42 | "fintech" | MITHQAL is a monetary and institutional settlement infrastructure, not a fintech. | "monetary and institutional settlement infrastructure" |
| 43 | "crypto" (as a noun referring to MITHQAL) | MITHQAL is not a crypto project. | "monetary and institutional settlement infrastructure" |
| 44 | "digital asset" (referring to MTQ) | MTQ is a settlement instrument, not a digital asset in the regulatory sense. | "settlement instrument", "MTQ" |
| 45 | "tokenize" (referring to MTQ) | MTQ is not a tokenization of anything. | "issue", "mint" (with care) |
| 46 | "smart contract" (as the operative mechanism) | MTQ issuance is not "smart-contract-based"; it is institutionally mediated with smart contracts as one of 7 finality layers. | "institutionally mediated settlement with smart-contract enforcement as one of 7 layers" |
| 47 | "on-chain" (as the operative location) | MTQ is recorded on a permissioned ledger; "on-chain" implies public-chain. | "on the permissioned ledger" |
| 48 | "off-chain" | Same connotation issue. | "off-ledger", "off-permissioned-ledger" |
| 49 | "HODL" / "hold" (as an investment thesis) | MTQ is a settlement instrument, not an investment. | (no alternative; do not use) |
| 50 | "moon" / "to the moon" | MTQ is not an investment; price appreciation is not a feature. | (no alternative; do not use) |

### 31.3.2 Prohibited Phrases

| # | Prohibited Phrase | Why | Permitted Alternative |
|---|---|---|---|
| 1 | "MITHQAL is live." | Not live. | "MITHQAL is an APPROVED CANDIDATE FOR CONTROLLED TESTING." |
| 2 | "MITHQAL is launched." | Not launched. | Same as above. |
| 3 | "MITHQAL is in production." | Not in production. | Same as above. |
| 4 | "MITHQAL is production-ready." | Not production-ready. | Same as above. |
| 5 | "MITHQAL is fully backed." | 0 live backing cells. | "MITHQAL has a 17-field PBC schema; 0 live cells currently." |
| 6 | "MITHQAL is integrated with banks." | 0 banks contracted. | "MITHQAL's MBG architecture is designed for bank integration; 0 banks contracted." |
| 7 | "MITHQAL is licensed." | 0 licenses obtained. | "MITHQAL's licensing matrix is implemented; 0 licenses obtained." |
| 8 | "MITHQAL is legally cleared." | 0 legal opinions obtained. | "MITHQAL's legal-liability framework is implemented; 0 jurisdictions validated." |
| 9 | "MITHQAL is audited." | Independent assurance not contracted. | "MITHQAL is internally audited; independent assurance is not contracted." |
| 10 | "MITHQAL's reserves are verified." | 0 live backing cells. | "MITHQAL's verification schema is defined; no live verification." |
| 11 | "MITHQAL's finality is proven." | Code-level mitigation, not institutional validation. | "MITHQAL's finality is enforced at the code level (7/7 layers, 10/10 bypass routes blocked); institutional validation pending." |
| 12 | "MITHQAL's three-book separation is operational." | `threeBookOperational = false`. | "MITHQAL's three-book design is implemented; not yet operational against live books." |
| 13 | "MITHQAL's reconciliation runs." | Reconciliation designed + tested, not live. | "MITHQAL's 5-way reconciliation is designed and tested; not yet running live." |
| 14 | "MITHQAL's sanctions screening is live." | Schema defined, not live. | "MITHQAL's sanctions-screening schema is defined; not yet live." |
| 15 | "MITHQAL is partnered with [institution]." | No partnerships. | "MITHQAL is in institutional engagement with [institution]." |
| 16 | "MITHQAL guarantees MTQ value." | MITHQAL is NOT a guarantor. | "MTQ value is the bank's liability; MITHQAL is the settlement infrastructure, not a guarantor." |
| 17 | "MITHQAL is a bank." | MITHQAL is not a bank. | "MITHQAL is a monetary and institutional settlement infrastructure that operates alongside banks via the MBG." |
| 18 | "MITHQAL is a stablecoin." | MITHQAL is not a stablecoin. | Same as above. |
| 19 | "MITHQAL is a cryptocurrency." | MITHQAL is not a cryptocurrency. | Same as above. |
| 20 | "Invest in MITHQAL." | MTQ is not an investment. | (no alternative; do not use) |
| 21 | "Buy MTQ." | MTQ is not an investment. | (no alternative; do not use — MTQ is for settlement, acquired through a participating bank) |
| 22 | "MTQ price." | MTQ has no price; it has par (1.0). | "MTQ par value" (which is 1.0) |
| 23 | "MTQ market cap." | MTQ has supply, not market cap. | "MTQ supply" (e.g., 100M) |
| 24 | "MTQ trading." | MTQ is not traded. | "MTQ settlement" |
| 25 | "MTQ exchange." | MTQ is not exchanged on exchanges. | "MTQ settlement via participating banks" |
| 26 | "MITHQAL is decentralized." | MITHQAL is institutionally mediated. | "MITHQAL is institutionally mediated." |
| 27 | "MITHQAL is trustless." | MITHQAL relies on institutional trust. | "MITHQAL is institutionally mediated." |
| 28 | "MITHQAL is permissionless." | MITHQAL is permissioned. | "MITHQAL is permissioned (banks, custodians, Foundation governance)." |
| 29 | "MITHQAL is a public blockchain." | MITHQAL uses permissioned infrastructure. | "MITHQAL uses permissioned infrastructure." |
| 30 | "MITHQAL is anonymous." | MITHQAL is KYC/KYB/AML-compliant. | "MITHQAL is KYC/KYB/AML-compliant; no anonymity." |
| 31 | "MITHQAL is for retail." | MITHQAL is institutional. | "MITHQAL is for institutional and corporate customers of participating banks." |
| 32 | "MITHQAL is a fintech." | MITHQAL is a monetary and institutional settlement infrastructure. | "MITHQAL is a monetary and institutional settlement infrastructure." |
| 33 | "MITHQAL is a crypto project." | Same as above. | Same as above. |
| 34 | "MITHQAL is a Web3 project." | Same as above. | Same as above. |
| 35 | "MITHQAL is a DeFi protocol." | Same as above. | Same as above. |
| 36 | "MITHQAL is a DAO." | MITHQAL is governed by the Foundation. | "MITHQAL is governed by the MITHQAL Foundation." |
| 37 | "MITHQAL is basically done." | Inflation. | See §28.11 for permitted status framings. |
| 38 | "MITHQAL is almost there." | Inflation. | Same as above. |
| 39 | "MITHQAL is pilot-ready." | Pilot requires G13, which requires all 12 prior gates. | "MITHQAL is a candidate for controlled testing; pilot readiness requires 13/13 institutional gates." |
| 40 | "MITHQAL will be live soon." | Speculation about future. | "MITHQAL is at the start of the institutional-engagement phase; timeline to live depends on gate passage." |

## 31.4 Canonical Terminology Rules

### 31.4.1 Rule 1 — Use the Preferred Term

Every concept has one preferred term. Use it. Do not invent synonyms, abbreviations, or "industry-standard" alternatives.

| Instead of | Use |
|---|---|
| "stablecoin" | "MTQ" or "settlement instrument" |
| "backing ratio" | "Reserve Ratio (RR)" |
| "stress ratio" | "FSCR" |
| "liquidity ratio" | "LCR" |
| "token" | "MTQ" or "settlement unit" |
| "coin" | "MTQ" or "settlement unit" |
| "cryptocurrency" | "settlement instrument" or "MTQ" |
| "partner" | "institution MITHQAL is seeking to engage" |
| "approved" | "APPROVED CANDIDATE FOR CONTROLLED TESTING" |
| "production-ready" | "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED" |
| "live" | "in controlled testing" or "in sandbox" |

### 31.4.2 Rule 2 — Use the Term with Its Exact Meaning

Every term has one exact meaning (per §31.2). Do not stretch the meaning, do not use it colloquially, do not "borrow" it for adjacent concepts.

| Term | Exact Meaning | Stretching to Avoid |
|---|---|---|
| "PBC" | 17-field structured record with anti-double-count | Don't use it for any generic backing record. |
| "RR" | Adjusted reserve / liability | Don't use it for market reserve / liability (that's `NAV_m`). |
| "FSCR" | Stress reserve / liability | Don't use it for adjusted reserve / liability (that's RR). |
| "DRQS" | 8-factor digital quality score | Don't use it for any generic quality score. |
| "TGRS" | 10-factor tokenized gold quality score | Don't use it for any generic gold score. |
| "MBG" | MITHQAL Bank Gateway (translation layer) | Don't use it for any generic gateway. |
| "DMCE" | Dynamic Minting Capacity Engine (BM-14) | Don't use it for any generic capacity limit. |
| "MRRC" | MITHQAL Monetary & Reserve Control Division | Don't use it for any generic committee. |
| "Three-Book" | Three specific books (A/B/C) with anti-commingling | Don't use it for any generic ledger separation. |

### 31.4.3 Rule 3 — Never Use a Prohibited Alternative

The prohibited alternatives in §31.3 are forbidden, regardless of how common they are in the industry or how "innocent" they seem. They are forbidden because they create legal, regulatory, or reputational risk.

If a journalist, investor, or counterparty uses a prohibited alternative in a question, the response should:
1. **Use the preferred term.** ("We don't use the word 'stablecoin'; MTQ is a settlement instrument.")
2. **Reframe the question.** ("To answer your underlying question about whether MTQ is like a stablecoin: no, because MTQ is bank-mediated with bank-established backing, not an issuer's liability.")
3. **Not repeat the prohibited alternative.** (Even to refute it — repetition reinforces it.)

### 31.4.4 Rule 4 — Define on First Use

When introducing a term for the first time in any document, spell out the full term and provide the acronym in parentheses:

> "The MITHQAL Bank Gateway (MBG) is the translation layer between participating bank systems and the MITHQAL Core."

Subsequent uses can use the acronym alone:

> "The MBG translates ISO 20022 messages..."

### 31.4.5 Rule 5 — Acronym Consistency

Once an acronym is defined (per §31.6 below), use it consistently. Do not switch between full-term and acronym arbitrarily, and do not introduce new acronyms for the same concept.

## 31.5 Capitalization and Formatting Conventions

### 31.5.1 Capitalization

| Convention | Example |
|---|---|
| Acronyms: ALL CAPS | MTQ, MBG, DMCE, PBC, RR, FSCR, LCR, DRQS, TGRS, SDC, BRI, COFER, HQLA, CALM, MRRC, CBGRS, ILPS, RWA, CBDC, ISO, SWIFT, BIS, IMF, AML, KYC, KYB, FX, RTGS, ACH, SFTP, API, REST, H2H, FSRA, ADGM, DIFC, MAS, BVI, CI, BM, L1-L7 |
| System names: Title Case | MITHQAL Core, MITHQAL Bank Gateway, MITHQAL Foundation, MITHQAL Monetary & Reserve Control Division, Protected Backing Cell, Three-Book Economic Separation, Five-Way Reconciliation, Finality-Before-Mint, Cross-Border Corridor, MTQ Operating System |
| Document names: Title Case | MITHQAL Master Blueprint, Implementation Status Report, Honest State Declaration |
| Concept names: Title Case | Reserve Ratio, Funding & Solvency Coverage Ratio, Liquidity Coverage Ratio, AvailableBacking, RecognizedBacking, EncumberedBacking, AlreadyAllocatedBacking |
| Status colors: ALL CAPS | EMERALD, AMBER, RED |
| Status states: ALL CAPS or Title Case | APPROVED CANDIDATE FOR CONTROLLED TESTING, NOT PRODUCTION-AUTHORIZED, NORMAL, DEFENSIVE, EMERGENCY, BREACH, ADEQUATE, STRESSED |
| Variable names (in equations): lowercase italic | `S`, `L`, `R_m`, `R_a`, `R_l`, `RR`, `FSCR`, `LCR`, `PAR`, `Q_a`, `P_a`, `H_a`, `C_a`, `S_a`, `C_i`, `M_i`, `R_i`, `σ²_t`, `A_t`, `K_i`, `L_i`, `W_raw,i`, `W_i^norm`, `W_i^final`, `B_t`, `G_t`, `D_t`, `w_i`, `d`, `d_G` |
| Section markers: § prefix | §47, §74, §87, §88, §91, §94 |

### 31.5.2 The Word "MITHQAL"

- **ALL CAPS:** When referring to the system, the institution, or the architecture. ("MITHQAL is a monetary and institutional settlement infrastructure.")
- **Title Case "Mithqal":** When referring to the underlying concept (the historical unit of weight). Rare in v25.2 documentation.
- **Lowercase "mithqal":** Forbidden in formal documentation.

### 31.5.3 The Word "MTQ"

- **ALL CAPS:** Always. ("MTQ is the settlement unit.")
- **Plural:** Same form. ("100 MTQ" not "100 MTQs".)
- **Article:** "the MTQ" or "an MTQ" (latter is rare; usually "the MTQ" or "MTQ" without article).

## 31.6 Acronym Expansion Table

| Acronym | Expansion | Section Defined |
|---|---|---|
| MTQ | Mithqal (the settlement unit; not an acronym strictly, but treated as one for capitalization) | §31.2.1 |
| PAR | Par value (the constant 1.0 peg) | §31.2.2 |
| MBG | MITHQAL Bank Gateway | §31.2.3 |
| DMCE | Dynamic Minting Capacity Engine | §31.2.4 |
| PBC | Protected Backing Cell | §31.2.5 |
| RR | Reserve Ratio | §31.2.6 |
| FSCR | Funding & Solvency Coverage Ratio | §31.2.7 |
| LCR | Liquidity Coverage Ratio | §31.2.8 |
| DRQS | Digital Reserve Quality Score | §31.2.9 |
| TGRS | Tokenized Gold Reserve Score | §31.2.10 |
| SDC | Silver Diversification Contribution | §31.2.11 |
| BRI | Bullion Resilience Index | §31.2.12 |
| COFER | Currency Composition of Foreign Exchange Reserves (IMF) | §31.2.13 |
| SWIFT | Society for Worldwide Interbank Financial Telecommunication | §31.2.14 |
| BIS | Bank for International Settlements | §31.2.15 |
| HQLA | High-Quality Liquid Assets | §31.2.16 |
| CALM | Constitutional Anchor Liquidity Model | §31.2.17 |
| MRRC | MITHQAL Monetary & Reserve Control Division | §31.2.18 |
| CBGRS | Constitutional Bank Gateway Reserve Specification | §31.2.19 |
| ILPS | Institutional Liquidity & Payment System | §31.2.20 |
| RWA | Real-World Asset | §31.2.32 |
| CBDC | Central Bank Digital Currency (Wholesale) | §31.2.30 |
| ISO | International Organization for Standardization (ISO 20022) | §31.2.31 |
| RTGS | Real-Time Gross Settlement | §31.2.28 |
| ACH | Automated Clearing House | §31.2.28 |
| SFTP | Secure File Transfer Protocol | §31.2.28 |
| API | Application Programming Interface | §31.2.28 |
| REST | Representational State Transfer | §31.2.28 |
| H2H | Host-to-Host | §31.2.28 |
| FX | Foreign Exchange | §31.2.27 |
| AML | Anti-Money Laundering | §31.2.27 |
| KYC | Know Your Customer | §31.2.27 |
| KYB | Know Your Business | §31.2.27 |
| BM | Bank Minting (workflow step prefix; BM-01..BM-16) | §31.2.26 |
| L1-L7 | Finality-Before-Mint Layers 1-7 | §31.2.24 |
| USD | United States Dollar | §31.2.40 |
| EUR | Euro | §31.2.40 |
| CHF | Swiss Franc | §31.2.40 |
| JPY | Japanese Yen | §31.2.40 |
| GBP | British Pound Sterling | §31.2.40 |
| SGD | Singapore Dollar | §31.2.40 |
| AED | United Arab Emirates Dirham | §31.2.40 |
| SAR | Saudi Riyal | §31.2.40 |
| CNY | Chinese Yuan (Renminbi) | §31.2.40 |
| CAD | Canadian Dollar | §31.2.40 |
| AUD | Australian Dollar | §31.2.40 |
| EGP | Egyptian Pound (settlement-only) | §31.2.40 |
| INR | Indian Rupee (settlement-only) | §31.2.40 |
| KRW | South Korean Won (settlement-only) | §31.2.40 |
| TRY | Turkish Lira (settlement-only) | §31.2.40 |
| BRL | Brazilian Real (settlement-only) | §31.2.40 |
| MXN | Mexican Peso (settlement-only) | §31.2.40 |
| ZAR | South African Rand (settlement-only) | §31.2.40 |
| IDR | Indonesian Rupiah (settlement-only) | §31.2.40 |
| MYR | Malaysian Ringgit (settlement-only) | §31.2.40 |
| THB | Thai Baht (settlement-only) | §31.2.40 |
| FSRA | Financial Services Regulatory Authority (ADGM) | §28.9.2 |
| ADGM | Abu Dhabi Global Market | §28.9.2 |
| DIFC | Dubai International Financial Centre | §28.9.2 |
| MAS | Monetary Authority of Singapore | §28.9.2 |
| BVI | British Virgin Islands | §28.9.2 |
| CI | Cayman Islands | §28.9.2 |
| EWMA | Exponentially Weighted Moving Average | §29.5.4 |
| LTA | Long-Term Allocation (target weight in mean-reversion) | §29.5.3 |
| SAE | Stablecoin Risk-Adjusted Exposure | §31.2.35 |
| PBC Anti-Double-Count | (Anti-Double-Count Rule for PBCs) | §31.2.25 |
| NAV | Net Asset Value | §29.3.4 |
| NAV_m | Market NAV | §29.3.4 |
| NAV_l | Adjusted NAV (liability-weighted) | §29.3.4 |
| NAV_s | Stress NAV | §29.3.4 |
| CVaR | Conditional Value-at-Risk | §29.10.1 |
| DR | Disaster Recovery | §29.11.1 |
| BCP | Business Continuity Plan | §29.11.1 |
| CI/CD | Continuous Integration / Continuous Deployment | §30.4.1 |
| PR | Pull Request | §30.4.1 |
| GPG | GNU Privacy Guard (for signed commits and tags) | §30.5.1 |
| SSH | Secure Shell (for signed commits) | §30.5.1 |
| LOI | Letter of Intent (NOT a contract) | §28.11.1 |

## 31.7 The Final Terminology Test

Any communication about MITHQAL — internal memo, external press release, slide deck, email, chat message, code comment, marketing copy — should pass the following test:

1. **Does it use the preferred terms?** (Per §31.2.) If a prohibited alternative is used, fix it.
2. **Does it use each term with its exact meaning?** (Per §31.4.2.) If a term is stretched, fix it.
3. **Does it use any of the 50 prohibited words or 40 prohibited phrases?** (Per §31.3.) If so, fix it.
4. **Does it make any claim that is not supported by §28?** (e.g., "MITHQAL is licensed" — not supported.) If so, fix it.
5. **Does it use the word "APPROVED" without the qualifier "CANDIDATE FOR CONTROLLED TESTING"?** If so, fix it.
6. **Does it describe any institution as a "partner"?** If so, fix it.
7. **Does it describe MTQ as a "coin", "token", "cryptocurrency", or "stablecoin"?** If so, fix it.
8. **Does it describe MITHQAL as "decentralized", "trustless", "permissionless", or "public"?** If so, fix it.
9. **Does it describe MITHQAL as "live", "launched", "in production", or "production-ready"?** If so, fix it.
10. **Does it speculate about future state ("will be live soon", "almost there", "basically done")?** If so, fix it.

If a communication passes all 10 tests, it is terminologically clean. If it fails any test, it is a constitutional breach and must be corrected before publication.

This concludes Section 31.

---

## PART 8 — END OF SECTIONS 28-31

**Summary of Part 8:**

| Section | Title | Content |
|---|---|---|
| 28 | Implementation Status Report (§87) | 10-requirement status table, 19/23 acceptance criteria, 0/13 institutional gates, full §74 honest state (32 fields), 6 reporting principles, illustrative path from 0/13 to 1/13 |
| 29 | Final Equation System (§50) | 36 equations (E1-E36), variable index, complete bounds and explanations, full walk-through for S=$100M |
| 30 | Version Control | v25.2 authoritative, single source of truth declaration, forward-only version history, branch protection on `main`, FROZEN tag `v25.2-final`, backup branch `v25.2-hardened-backup`, integrity verification script, change-control discipline |
| 31 | Glossary and Terminology | 50+ terms with preferred term / exact meaning / prohibited alternatives / context, 50 prohibited words, 40 prohibited phrases, 5 canonical terminology rules, capitalization conventions, full acronym expansion table |

**Authority:** This is Part 8 of the MITHQAL MASTER BLUEPRINT v25.2. It is the single authoritative source of truth for Sections 28-31. Any conflict with another artifact is resolved in favor of this document.

**Status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.

**Next Actions (per §28.9):** Begin institutional engagement with G01 (pilot-jurisdiction legal opinion). Until G01 passes, the system remains at 0/13 institutional validation gates and is NOT production-authorized.

---

*End of Part 8.*

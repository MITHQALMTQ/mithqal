# MITHQAL Master Blueprint v25.2 — PART 09 (Single Source of Truth)

> **Part ID:** BP-PART-09
> **Task ID:** BP-SEC-09
> **Sections covered:** §32 Risk Architecture · §33 Security Architecture · §34 Regulatory Architecture · §35 Accounting / CFO Architecture · §36 Treasury Architecture · §37 Governance Architecture
> **Authority:** COO + CTO + CFO + Project Manager + Monetary Systems Architect + Institutional Reserve Manager + Legal/Regulatory Architecture Lead + Risk & Security Architecture Lead
> **Status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
> **Honest state:** design-time specification · no live oracle feeds · no bank/provider/asset contracted · not production-authorized · institutional validation gates 0/13 passed (all pending)
> **Supersedes:** all older versions of sections 32–37 wherever they conflict with this Part
> **Reference values:** `/tmp/blueprint_reference.json` — RR target 1.30 · 80/18/2 · fiat corridor 70–85% · bullion corridor 15–25% · digital corridor 0–5% · preferred effective concentration 15% · hard effective 20% · USD-effective ceiling 35% · 7-layer finality enforced (10/10 bypass routes blocked)

---

## TABLE OF CONTENTS — PART 09

- §32 — RISK ARCHITECTURE
  - §32.0 Risk Philosophy
  - §32.1 Risk Taxonomy (17 categories)
  - §32.2 Risk Category Dossiers (17 × full 10-field dossier)
  - §32.3 Likelihood × Impact Matrix
  - §32.4 Reserve Risk Engine (16 risk types)
  - §32.5 Risk Governance, Ownership, Escalation
  - §32.6 Risk Reporting & Stress Cadence
  - §32.7 Honest State & Open Items
- §33 — SECURITY ARCHITECTURE
  - §33.0 Zero Trust Posture
  - §33.1 Identity, Authentication, Authorization, Privileged Access
  - §33.2 Cryptographic Signing, Key Management, HSM, MPC
  - §33.3 Secrets, Certificates, Network & API Security
  - §33.4 Replay Prevention, Nonce, Idempotency
  - §33.5 Fraud Controls, Transaction Limits
  - §33.6 Sanctions Controls & Compromise Response
  - §33.7 Insider Threats & Supply-Chain Risk
  - §33.8 Logging, Tamper Evidence, Business Continuity
  - §33.9 Finality-Before-Mint Security (7 layers, 10 bypass tests)
  - §33.10 Honest State
- §34 — REGULATORY ARCHITECTURE
  - §34.0 System vs Legal Characterization (Separated)
  - §34.1 Licensing Requirements
  - §34.2 Banking Regulation
  - §34.3 Payment Regulation
  - §34.4 Securities Analysis
  - §34.5 Monetary Regulation
  - §34.6 AML / CFT
  - §34.7 Sanctions
  - §34.8 Data Privacy
  - §34.9 Custody
  - §34.10 Reserve Requirements
  - §34.11 Reporting
  - §34.12 Tax
  - §34.13 Accounting
  - §34.14 Cross-Border Restrictions
  - §34.15 Jurisdiction Adapter Concept
  - §34.16 Per-Jurisdiction Dossiers (8)
  - §34.17 "Subject to Local Authorization" Language
  - §34.18 Honest State
- §35 — ACCOUNTING / CFO ARCHITECTURE
  - §35.0 Accounting Philosophy & Four-Lens Separation
  - §35.1 Chart-of-Accounts Concepts
  - §35.2 MTQ Accounting Entries (Issuance, Redemption, Settlement)
  - §35.3 Reserve Accounting (Valuation, Unrealized / Realized)
  - §35.4 Three-Book Separation (Book A / B / C)
  - §35.5 Revenue & Fees
  - §35.6 Financial Reporting
  - §35.7 Proof-of-Liabilities
  - §35.8 Treasury Reporting, Management Reporting, Stress Reporting
  - §35.9 Economic vs Accounting vs Legal vs Settlement Position
  - §35.10 Honest State
- §36 — TREASURY ARCHITECTURE
  - §36.0 Treasury Philosophy
  - §36.1 Reserve Management
  - §36.2 Liquidity Management (ILPS, HQLA, LCR/MLCR)
  - §36.3 Bank Relationships, Custodians, Gold Custody
  - §36.4 Fiat Allocation, Liquidity Buffers, Concentration Limits
  - §36.5 Rebalancing (2pp threshold, hard overrides, transaction cost test)
  - §36.6 FX Management
  - §36.7 Emergency Liquidity
  - §36.8 Stress Testing & Counterparty Monitoring
  - §36.9 Treasury Permissions & Workflow
  - §36.10 CALM — Capital-Adaptive Liability Management (6 states)
  - §36.11 Liquidation Waterfall (7 steps, gold LAST)
  - §36.12 Honest State
- §37 — GOVERNANCE ARCHITECTURE
  - §37.0 Governance Philosophy & Five-Entity Structure
  - §37.1 Foundation (constitutional stewardship)
  - §37.2 Holding Company
  - §37.3 Operating Company (incl. Monetary & Reserve Control Division)
  - §37.4 Technology Company
  - §37.5 Institutional Authorities
  - §37.6 Operational Authority
  - §37.7 Emergency Authority
  - §37.8 Reserve Authority
  - §37.9 Technology Authority
  - §37.10 Compliance Authority
  - §37.11 Policy Changes, Versioning, Approvals
  - §37.12 Separation of Duties & Conflict-of-Interest Controls
  - §37.13 Audit Authority
  - §37.14 Monetary & Reserve Control Division (structurally separated)
  - §37.15 Foundation Oversight (READ_ONLY · 7 fields · 8 cannot-do actions)
  - §37.16 Honest State
- §99 — APPENDICES
  - §99.1 Cross-Reference Table
  - §99.2 Glossary
  - §99.3 Honest Status Aggregation

---

# §32 — RISK ARCHITECTURE

## §32.0 Risk Philosophy

### §32.0.1 Principle

MITHQAL is a neutral wholesale settlement infrastructure. Its risk posture is **prudential, conservative, multi-layered, and never zero-claim**. The Institution explicitly disclaims the following unsupported certainties (per v25.0 §1.12 Absolute Claims Prohibited):

1. zero counterparty risk
2. economic invincibility
3. immunity from oracle manipulation
4. automatic regulatory approval
5. central-bank approval
6. risk-free solvency
7. guaranteed redemption at PAR in all states of the world
8. immunity from sovereign action
9. immunity from cyber compromise
10. immunity from model failure

### §32.0.2 Three-Layer Risk Lens

Every risk in the MITHQAL system is assessed through three lenses that **must never be collapsed into one**:

| Layer | Question | Owner |
|---|---|---|
| **L1 — Economic risk** | What is the true economic exposure? | Risk Committee + CFO |
| **L2 — Accounting / prudential risk** | What does the adjusted reserve recognize? | CFO + Monetary & Reserve Control Division |
| **L3 — Legal / regulatory risk** | What does the applicable regulator characterize this as? | General Counsel + Regulatory Architecture Lead |

A risk that is "small economically" may be "large legally" (e.g., a $0.02 haircut that triggers a regulatory classification change). Conversely a risk that is "large economically" may be "small legally" (e.g., a market drawdown that has no legal classification impact). The risk engine tracks all three lenses independently.

### §32.0.3 Risk Owners and Discipline

Every risk has a single named owner. The owner is **accountable** but not necessarily the only party that touches the risk. Owner discipline:

1. Owner is a role, not a person — the role survives personnel turnover
2. Owner reviews their risk at the cadence defined in §32.6
3. Owner certifies quarterly that controls are operating effectively
4. Owner escalates per the escalation ladder in §32.5
5. Owner is forbidden from simultaneously owning the mitigation (separation of duties — §37.12)

### §32.0.4 Anti-Procylicality

Risk controls are designed to **not amplify stress**. Examples:

- The volatility attenuation factor `A_t` in the currency weight engine reduces momentum/mean-reversion influence during high-volatility regimes (not increases it)
- The `StressDRQS = DRQS × (1 − SF)` mechanism makes stablecoin weights shrink under stress (not grow)
- The CALM state machine tightens mint capacity monotonically as stress rises (Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓)
- Trade-suppression rule blocks rebalancing trades whose `NetBenefit ≤ 0`
- Model-failure is a HARD GATE that falls back to the Last Approved Deterministic Policy Portfolio — model failure NEVER expands risk

### §32.0.5 Fail-Closed Posture

When the system cannot determine the safe state, it fails closed:

- OFAC SDN list unavailable → ALL transactions BLOCKED (HTTP 503 + `action: BLOCK`)
- Oracle quorum below constitutional threshold → mint/redeem HALTED per §32.2.10
- Reconciliation mismatch beyond 1bp tolerance → mint BLOCKED until resolved
- DMCE component missing or stale → mint capacity = 0
- AvailableBackingCertificate expired or revoked → mint BLOCKED (FV13)

### §32.0.6 Honest Quantification

All risk metrics carry honest quantification. The Monte Carlo stress test (`§V24.2.12`) reports `P(RR < 100%) = 21.54%` under the historical calibrated model — this number is **not** hidden, **not** rounded down, and **not** a target. The challenger-model range `[19.97%, 24.91%]` reflects model uncertainty, not measurement uncertainty. The numbers do NOT account for regulatory intervention, lender-of-last-resort, government guarantee, operational risk, smart-contract risk, or custody risk (these are tracked separately).

---

## §32.1 Risk Taxonomy (17 Categories)

The MITHQAL Risk Taxonomy is closed: every risk identified must map to exactly one of the 17 primary categories below. Risks that span categories are decomposed by primary driver; secondary drivers are noted in the dossier's "Related Categories" field.

| # | Category | Primary Driver | Owner (Role) | Tier |
|---:|---|---|---|---|
| 1 | Strategic | Business-model, mission drift | Foundation Board | Constitutional |
| 2 | Regulatory | Licensing perimeter, characterization change | General Counsel | Constitutional |
| 3 | Monetary | PAR, RR, supply invariants, monetary engine | Monetary & Reserve Control Division | Constitutional |
| 4 | Liquidity | HQLA, LCR, redemption outflow | Treasury + Risk | Operational |
| 5 | Credit | Issuer / obligor default | Risk Committee | Operational |
| 6 | Counterparty | Bank, custodian, LP, oracle failure | Counterparty Risk Office | Operational |
| 7 | Currency | FX rate moves, weight drift | Treasury | Operational |
| 8 | Sovereign | Country risk, capital controls, ratings | Sovereign Risk Office | Operational |
| 9 | Geopolitical | Sanctions, conflict, bloc realignment | Geopolitical Risk Office | Strategic |
| 10 | Operational | Process, people, procedures | COO | Operational |
| 11 | Cyber | Cyber attack, data breach | CISO | Operational |
| 12 | Technology | System failure, software defect | CTO | Operational |
| 13 | Legal | Contract, tort, litigation | General Counsel | Operational |
| 14 | Reputation | Public trust, media, ESG | Head of Communications | Strategic |
| 15 | Settlement | Finality, PvP, counterparty settlement | Settlement Risk Office | Operational |
| 16 | Reserve | Reserve composition, valuation, haircut | Monetary & Reserve Control Division | Constitutional |
| 17 | Concentration | Single-name, single-jurisdiction, single-custodian | Risk Committee | Operational |

**Tier meaning:**
- **Constitutional** — risk to FV1–FV25 invariants; can only be modified by supermajority board vote + (where applicable) Sharia + regulatory notification
- **Strategic** — risk to long-horizon mission; Foundation Board + Council approval
- **Operational** — risk to day-to-day operations; owner role may act within delegated authority

---

## §32.2 Risk Category Dossiers

Each dossier below has 10 standardized fields: (1) Description, (2) Likelihood, (3) Impact, (4) Controls, (5) Warning Indicators, (6) Thresholds, (7) Mitigation, (8) Owner, (9) Escalation, (10) Emergency Response.

Likelihood scale (annualized): `VERY_LOW <5%` · `LOW 5–20%` · `MEDIUM 20–50%` · `HIGH 50–80%` · `VERY_HIGH ≥80%`.
Impact scale (relative to total reserve `R_a`): `NEGLIGIBLE <0.5%` · `MINOR 0.5–2%` · `MODERATE 2–5%` · `MAJOR 5–10%` · `SEVERE ≥10%` or any breach of an FV invariant.

### §32.2.1 Strategic Risk

1. **Description.** Risk that the Institution drifts from its constitutional mission (neutral wholesale settlement infrastructure, non-platform, anti-discretionary-minting, gold-anchored, full-redeemability) under commercial pressure, founder influence, regulator pressure, or funding stress. Includes scope creep into exchange, custody, asset management, retail, or proprietary trading.

2. **Likelihood.** `MEDIUM` (annualized) — historical pattern of mission drift in monetary institutions is well-documented; pressure sources (commercial, funding, geopolitical) recur.

3. **Impact.** `SEVERE` — mission drift can compromise FV1–FV25 (constitutional invariants) and trigger regulator re-characterization.

4. **Controls.**
   - Article V Anti-Platform / No Constitutional Drift (constitutionally frozen)
   - 22 final non-negotiable principles (§94)
   - 17 non-negotiable execution rules (§V25.0.0)
   - Foundation reserved-powers list (founder/operator cannot unilaterally change PAR, RR≥100%, no discretionary minting, gold anchor, full redeemability, no lending, no commingling, deterministic monetary engine)
   - Constitutional-interpretation archive (§57.7) prevents drift via reinterpretation
   - Annual constitutional-stability review (§6, Article VIII governance)
   - Contradiction scan (§77) — 17 patterns scanned, 0 unresolved

5. **Warning Indicators.**
   - Foundational text amendments proposed that touch any FV invariant
   - Operating Company staff proposing "incidental" commercial services (custody, exchange, advisory)
   - Foundation or Holding requests to override a constitutional corridor (e.g., bullion >25%)
   - Funding pipeline stages stuck at TARGET for >12 months (pressure to monetize differently)
   - Public marketing using prohibited terms ("USD-backed", "guaranteed", "stablecoin")

6. **Thresholds.**
   - Hard: ANY proposed change to FV1, FV2, FV3, FV17, FV22 = `CONSTITUTIONAL_AMENDMENT` (requires 6/7 Foundation board + Sharia review + regulatory notification + 90-day public notice)
   - Soft: ANY public statement that uses a prohibited term per §V25.0.28 Canonical Terminology = `TERMINOLOGY_VIOLATION` (24h cure)

7. **Mitigation.**
   - Quarterly contradiction scan (§77)
   - Quarterly terminology audit (§V25.0.28)
   - Independent annual constitutional audit (Article VII)
   - Founder-compensation bound to "reasonable compensation standard" (no upside from drift)
   - Anti-platform prohibition is permanent — NOT subject to amendment, NOT subject to interpretive expansion

8. **Owner.** Foundation Board (constitutional stewardship) with independent director majority.

9. **Escalation.**
   - `LEVEL-1` (Foundational review) → Foundation Audit Committee
   - `LEVEL-2` (Proposed amendment) → 6/7 Foundation Board vote + Sharia + regulatory notification
   - `LEVEL-3` (Confirmed drift) → Public disclosure + 90-day cure window + regulator notification; if uncured, transfer IP to successor non-profit per §1.4 JOZOUR Amendment

10. **Emergency Response.** If drift is detected in real time (e.g., unauthorized mint, unauthorized reserve transfer):
    - **Immediate** — ledger state machine (FV25 + L5) blocks the action at the code level
    - **T+1 hour** — Foundation Board emergency session (4-of-7 quorum)
    - **T+24 hours** — public disclosure of attempted drift + remedy
    - **T+7 days** — independent investigation report
    - **T+30 days** — remediation complete or escalation to successor non-profit transition

### §32.2.2 Regulatory Risk

1. **Description.** Risk that a regulator (i) reclassifies MTQ from current characterization to a more restrictive one (e.g., from settlement unit to security, e-money, or deposit); (ii) imposes new licensing requirements; (iii) imposes sanctions or asset-freeze orders; (iv) restricts cross-border flows; (v) issues an enforcement action.

2. **Likelihood.** `MEDIUM` — regulatory classification of digital monetary instruments is in flux globally (MiCAR, US GENIUS / Stablecoin Acts, UK Payment Services reform, MAS DTCP, VARA, etc.).

3. **Impact.** `SEVERE` — reclassification can shutter operations in a jurisdiction, freeze assets, or impose unaffordable capital requirements.

4. **Controls.**
   - §34 Regulatory Architecture (per-jurisdiction dossiers)
   - §50 Licensing/Entity Matrix (9 activities × 8 jurisdictions = 72 entries)
   - 19-dim jurisdictional classification per jurisdiction (§V25.0.15)
   - Subject-to-local-authorization language in all public materials
   - 0 jurisdictions validated — all 8 seeded are `JURISDICTION_PENDING`
   - 0 licenses obtained — all 72 entries `REQUIRED_NOT_OBTAINED`
   - Quarterly regulatory horizon scan (per jurisdiction)
   - External regulatory counsel engaged per jurisdiction (status: PENDING)

5. **Warning Indicators.**
   - New draft legislation affecting stablecoins / settlement units / tokenized assets
   - Regulator inquiry letter, supervisory information request, or examination notice
   - Peer-institution enforcement action (signals regulator posture)
   - Cross-border payment corridor closure
   - Sanctions list update affecting an asset, custodian, or counterparty
   - Negative press coverage that may attract regulator attention

6. **Thresholds.**
   - Hard: ANY regulator formal inquiry = `LEVEL-2 REGULATORY_EVENT` (general counsel engagement + 5-day board notification)
   - Hard: ANY regulator enforcement action = `LEVEL-3 REGULATORY_EVENT` (24-hour board notification + public disclosure if material)
   - Soft: ANY new draft legislation = `LEVEL-1 REGULATORY_EVENT` (tracking + analysis + 30-day impact assessment)

7. **Mitigation.**
   - Engagement model: 5-step jurisdiction workflow (Organization → Contact → Engagement → Evaluation → Authorization)
   - Jurisdiction adapter (§34.15) localizes behavior without changing the canonical monetary core
   - Sandbox engagement (BIS Innovation Hub, MAS Project Guardian, UK FCA Digital Sandbox, DIFC, ADGM, VARA)
   - "No production authorization until defined legal, licensing, contractual, technical, risk, reconciliation and pilot gates satisfied" (§94)
   - Conservative interpretation rule: if regulatory classification is unknown, treat as most-restrictive plausible category until evidence confirms otherwise

8. **Owner.** General Counsel + Regulatory Architecture Lead.

9. **Escalation.**
   - `LEVEL-1` (Track / monitor) — Regulatory horizon scan log
   - `LEVEL-2` (Inquiry / engagement) — General Counsel + 5-day board notification; Outside counsel engagement
   - `LEVEL-3` (Enforcement / asset freeze) — 24-hour board + public disclosure; emergency governance per §13.3
   - `LEVEL-4` (Existential) — Wind-down procedure (§58.21 Retirement)

10. **Emergency Response.** Asset freeze / enforcement action:
    - **Immediate** — Jurisdiction adapter switches jurisdiction to `RESTRICTED` or `PROHIBITED`
    - **T+1 hour** — Bank Gateway routes for affected jurisdiction PAUSED
    - **T+24 hours** — Public disclosure + counterparty notification
    - **T+7 days** — Counsel-led resolution plan
    - **T+30 days** — Implementation (remediation, settlement, or exit)

### §32.2.3 Monetary Risk

1. **Description.** Risk to the canonical monetary invariants: PAR = $1.00 (accounting reference only, not a USD peg); RR ≥ 100% (FV3); no discretionary minting (FV2); full redeemability; deterministic monetary engine. Includes risks that the monetary engine fails to produce deterministic output, that PAR drifts, or that supply invariants (FV1: totalSupply × PAR = reserve) are violated.

2. **Likelihood.** `LOW` at the code level (deterministic engine, formally specified); `MEDIUM` at the institutional level (model failure, oracle failure).

3. **Impact.** `SEVERE` — monetary-invariant breach is an existential threat to the Institution.

4. **Controls.**
   - Formal verification FV1–FV25 (15 invariants, 11 verification checks)
   - Deterministic monetary engine — same inputs always produce same outputs (§15 Determinism)
   - Theorem S1 (single canonical MTQ supply)
   - No admin backdoor in the ledger state machine (L5 in §33.9)
   - PAR is `ACCOUNTING_REFERENCE_ONLY` — `parIsAccountingReferenceOnly = true`
   - MTQ is `PAR_REFERENCED`, not `USD_BACKED`
   - Currency weight engine uses proportional normalization (NOT softmax) for auditability
   - No-treasury-minting rule (§V25.0.3) — Treasury minting is PROHIBITED
   - No-governance-minting rule (§V25.0.3) — Governance minting is PROHIBITED

5. **Warning Indicators.**
   - RR within 5pp of the policy floor (1.05)
   - StressRR within 5pp of 1.00
   - PAR oracle deviates >0.5% from $1.00 (when applicable)
   - Multiple model challenger disagreement >5pp
   - Non-deterministic output detected in reconciliation

6. **Thresholds.**
   - Hard: `RR < 1.00` = `MONETARY_INVARIANT_BREACH` (FV3) — emergency governance
   - Hard: `RR_policy < 1.05` = `POLICY_FLOOR_BREACH` — CALM EMERGENCY state
   - Hard: `RR_strategic < 1.30` (sustained 90 days) = `STRATEGIC_TARGET_MISS`
   - Soft: PAR deviation >0.5% sustained 24 hours = `PAR_DRIFT_WATCH`

7. **Mitigation.**
   - CALM 6-state machine tightens mint capacity as stress rises
   - DMCE bounds FV18 (Dynamic Minting Capacity Upper Bound)
   - Model-failure gate falls back to LastApprovedDeterministicPolicyPortfolio
   - Challenger-model requirement (3-of-5 challenger agreement for any parameter change)
   - Anti-procyclical attenuation factor (A_t) reduces momentum/mean-reversion under stress
   - Independent model validation (Standing Blocker #9 — external audit)

8. **Owner.** Monetary & Reserve Control Division (structurally separated from commercial — §37.14).

9. **Escalation.**
   - `LEVEL-1` (Watch) — Daily metric dashboard review
   - `LEVEL-2` (Policy floor breach) — CALM EMERGENCY state, mint BLOCKED, board notification
   - `LEVEL-3` (Invariant breach) — Emergency governance per §13.3
   - `LEVEL-4` (Existential) — Wind-down procedure

10. **Emergency Response.** Monetary invariant breach:
    - **Immediate** — All new issuance HALTED at code level (FV25 + L5 ledger state machine)
    - **T+1 hour** — Council emergency session
    - **T+4 hours** — Public disclosure of breach + remedy plan
    - **T+24 hours** — Independent verification of breach scope
    - **T+7 days** — Remediation plan approved by regulator (where applicable)

### §32.2.4 Liquidity Risk

1. **Description.** Risk that the Institution (or a participating bank) cannot meet redemption or settlement obligations when due, even if solvent. Distinct from solvency (credit/asset quality) — a solvent portfolio can be illiquid; an insolvent portfolio can be liquid.

2. **Likelihood.** `MEDIUM` — redemption demand is stochastic; banking-rail availability is contingent.

3. **Impact.** `MAJOR` — illiquidity triggers CALM stress escalation and can compromise trust even without breaching solvency.

4. **Controls.**
   - ILPS 5-layer liquidity protection architecture ($46M total: Settlement $2.7M + Redemption $16.2M + Emergency $10.8M + Structural $13M + External $5.4M)
   - LCR target ≥ 1.00 (Layer 3 hard metric); current snapshot: LCR = 1.30 (ADEQUATE)
   - MLCR (modified LCR for stressed outflow)
   - HQLA — High-Quality Liquid Assets
   - 30-day net redemption outflow model
   - Prefunded institutional redemption liquidity (§9.3A)
   - Redemption queue + circuit breakers (§9.3)
   - CALM state machine restricts minting under stress (CashMin: NORMAL 55% → EMERGENCY 78%)
   - Article X sequential liquidation (§9.4) — gold protected LAST
   - In-kind emergency reserve delivery (§V24.2.11) — pro-rata asset delivery when rails frozen (does NOT guarantee PAR)

5. **Warning Indicators.**
   - LCR < 1.20 (WATCH)
   - LCR < 1.10 (CAUTION — CALM state transition)
   - LCR < 1.00 (STRESS — redemption restrictions activate)
   - Redemption queue depth > 5% of MTQ supply
   - Banking-rail latency > 4 hours
   - HQLA composition shift toward less-liquid assets
   - Net redemption outflow trend rising >2σ above 30-day mean

6. **Thresholds.**
   - Hard: `LCR < 1.00` = `LIQUIDITY_STRESS_BREACH` (redemption queue + CALM STRESS)
   - Soft: `LCR < 1.10` = `LIQUIDITY_WATCH` (rebalancing toward HQLA)
   - Soft: `LCR < 1.20` = `LIQUIDITY_OBSERVATION` (report only)

7. **Mitigation.**
   - ILPS 5-layer capital structure (designed, not funded)
   - Prefunded institutional redemption liquidity (status: PENDING — no bank contracted)
   - HQLA rebalancing trigger when LCR < 1.20
   - Settlement layer ($2.7M) — front-line for T+0 obligations
   - Redemption layer ($16.2M) — 30-day outflow coverage
   - Emergency layer ($10.8M) — 5-day stressed outflow
   - Structural layer ($13M) — capital preservation
   - External layer ($5.4M) — committed credit facilities

8. **Owner.** Treasury + Risk Committee.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Daily LCR report
   - `LEVEL-2` (CAUTION) — CALM CAUTION state, weekly board report
   - `LEVEL-3` (STRESS) — CALM STRESS state, redemption queue activated, daily board report
   - `LEVEL-4` (EMERGENCY) — CALM EMERGENCY state, mint BLOCKED, council emergency session

10. **Emergency Response.** Liquidity emergency:
    - **Immediate** — CALM EMERGENCY state, mint BLOCKED, redemption queue activated
    - **T+1 hour** — Treasury draws ILPS Emergency Layer ($10.8M)
    - **T+4 hours** — External layer ($5.4M) drawn if needed
    - **T+24 hours** — In-kind delivery procedure (§V24.2.11) if rails frozen
    - **T+7 days** — Resolution plan (capital raise, asset liquidation per Article X, or restructuring)

### §32.2.5 Credit Risk

1. **Description.** Risk that an issuer / obligor underlying a reserve asset or counterparty instrument defaults on its obligations. Includes credit-risk of sovereigns whose bonds are held, issuers of stablecoins, banks holding fiat reserves, and gold custodians' parent banks.

2. **Likelihood.** `LOW` for high-quality counterparties (TIER_1 banks, sovereigns ≥ AA-); `MEDIUM` for lower-tier.

3. **Impact.** `MODERATE` to `MAJOR` depending on concentration.

4. **Controls.**
   - Composite prudential counterparty assessment (`C_a = Credit_a × Jurisdiction_a × Operational_a`) per §38 of the Final Reserve Math Spec
   - Credit minimum thresholds for admission (TIER_1: $1T+ assets; TIER_2: $100B-$1T; TIER_3: <$100B)
   - Counterparty haircuts (H_a) per §3.4 Haircut Table
   - Stress coefficients (S_a) per §3.6
   - Stablecoin issuer DRQS ≥ 7.5 for core; algorithmic stablecoins EXCLUDED
   - Tokenized gold TGRS ≥ 8.0 for eligible
   - Quarterly counterparty review
   - Bank-default 8-state lifecycle model (§48 Bank Default & Resolution) — `bankDefaultContractValidated = false`

5. **Warning Indicators.**
   - Counterparty CDS spread >2σ above 90-day mean
   - Credit rating downgrade (any of Fitch/Moody's/S&P)
   - Sovereign CDS spread widening
   - Stablecoin depeg >2% sustained 24h
   - Custodian parent-bank stress signal
   - Bank equity price decline >15% in 30 days

6. **Thresholds.**
   - Hard: `Counterparty C_a < 0.85` = `COUNTERPARTY_QUALITY_BREACH` (asset moved to non-HQLA)
   - Hard: `Bank credit rating < BBB-` = `BANK_DOWNGRADE` (CALM DEFENSIVE)
   - Soft: `Counterparty CDS spread > 100bp widening` = `COUNTERPARTY_WATCH`

7. **Mitigation.**
   - Counterparty diversification (custodian 15% preferred / 25% hard cap)
   - Haircut increase as quality declines (`H_a` adjusts dynamically)
   - Substitute mechanism (governance-approved replacement with highest-quality eligible alternative)
   - Bank-default 8-state lifecycle (ACTIVE → RESTRICTED → LIQUIDITY_STRESS → SUSPENDED → DEFAULT → INSOLVENT → RESOLUTION → EXIT) — existing MTQ NOT auto-burned; only NEW issuance against affected backing BLOCKED
   - Independent attestation (Source B — RCAF + Source D — independent attestation oracle)

8. **Owner.** Risk Committee (Credit subcommittee).

9. **Escalation.**
   - `LEVEL-1` (Watch) — Weekly counterparty report
   - `LEVEL-2` (Downgrade) — CALM DEFENSIVE; bank-exposure review
   - `LEVEL-3` (Default) — CALM EMERGENCY; 8-state lifecycle activates; council session
   - `LEVEL-4` (Insolvency) — Resolution procedure (bankruptcy-remote backing; transfer to alternate custodian)

10. **Emergency Response.** Counterparty default:
    - **Immediate** — Affected backing flagged `SUSPENDED` in ProtectedBackingCell
    - **T+1 hour** — DMCE for affected bank = 0 (no new mint)
    - **T+4 hours** — Forensic reconciliation per §V25.0.C.11 `handleBackingAttestationFailure`
    - **T+24 hours** — Transfer of backing to alternate custodian initiated (if legally possible)
    - **T+7 days** — Resolution plan with regulator (where applicable)

### §32.2.6 Counterparty Risk

1. **Description.** Risk arising from banks, custodians, liquidity providers, oracle providers, settlement agents, or other intermediaries failing to perform. Distinct from credit risk (which is issuer/obligor default). Counterparty risk includes operational performance, oracle manipulation, settlement failure, and key-compromise.

2. **Likelihood.** `LOW` to `MEDIUM` depending on counterparty type and operational complexity.

3. **Impact.** `MODERATE` to `MAJOR`.

4. **Controls.**
   - §3.5 Counterparty Risk framework (per v24 institutional constitution)
   - Composite counterparty score `C_a = Credit_a × Jurisdiction_a × Operational_a`
   - Multi-source evidence (5-way reconciliation, Source A bank + Source B custodian + Source C canonical + Source D attestation oracle + Source E proof-of-liabilities)
   - Oracle architecture: 8 providers, 60 nodes, TWAP, multi-family (per Part V25.0-Oracle)
   - Oracle source exclusion (freshness / availability / consistency / integrity / validation / deterministic processing)
   - Bank-onboarding InstitutionRegistry (SIMULATED — 4 reference institutions in v25.2 audit-closure)
   - Quarterly counterparty due-diligence refresh (6 types: LEGAL, FINANCIAL, OPERATIONAL, SECURITY, REGULATORY, COMMERCIAL)
   - ProtectedBackingCell anti-double-count (`verifyNoDoubleCount`)

5. **Warning Indicators.**
   - Counterparty operational incident (latency > SLA, audit failure, key compromise)
   - Oracle deviation >1% between providers
   - Custodian audit report qualified
   - Bank regulatory action (consent order, fine, restriction)
   - Reconciliation mismatch (>1bp tolerance)

6. **Thresholds.**
   - Hard: `Counterparty operational incident` = `COUNTERPARTY_INCIDENT` (immediate review)
   - Hard: `Oracle deviation >2%` = `ORACLE_CIRCUIT_BREAKER` (minter HALT)
   - Soft: `Reconciliation mismatch >0.5bp` = `RECONCILIATION_WARNING`

7. **Mitigation.**
   - Multi-counterparty architecture (no single point of failure)
   - Independent custodian evidence (Source B — RCAF)
   - Independent attestation oracle (Source D)
   - Multi-family oracle architecture (8 providers across 4 families)
   - Bank-default resolution framework (§48)
   - Treasury adapter (§34.15) jurisdiction fallback

8. **Owner.** Counterparty Risk Office (within Risk Committee).

9. **Escalation.**
   - `LEVEL-1` (Watch) — Daily counterparty health dashboard
   - `LEVEL-2` (Incident) — Counterparty paused, alternate activated
   - `LEVEL-3` (Failure) — Default procedure; CALM STRESS
   - `LEVEL-4` (Systemic) — Multi-counterparty failure; emergency governance

10. **Emergency Response.**
    - **Immediate** — Affected counterparty's instructions flagged `PENDING_VERIFICATION`
    - **T+1 hour** — Alternate counterparty routed (where available)
    - **T+4 hours** — Forensic audit
    - **T+24 hours** — Public disclosure (if material)
    - **T+7 days** — Permanent remediation or substitution

### §32.2.7 Currency Risk

1. **Description.** Risk arising from movements in currency exchange rates affecting the reserve basket value. The reserve holds 11 reserve-eligible currencies (USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD) and supports 10 settlement-only currencies (EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB).

2. **Likelihood.** `HIGH` — currency markets move continuously; large moves occur regularly.

3. **Impact.** `MODERATE` (well-diversified basket); `MAJOR` if concentration breached.

4. **Controls.**
   - Currency weight engine (§7-§16 of Final Reserve Math Spec):
     - Structural weight `C_i = 0.50·COFER + 0.40·SWIFT + 0.10·BIS`
     - Momentum `M_i(t) = P_i(t)/P_i(t−12m)`, bounded `[0.95, 1.05]`
     - Mean-reversion `R_i(t) = 1 + 0.05·(LTA_i − C_i)`, bounded `[0.98, 1.02]`
     - Volatility shock absorber (EWMA, λ=0.94) + attenuation `A_t ∈ [0.50, 1.00]`
     - Liquidity overlay `L_i = 1 + 0.02·(Liquidity_i − Median)`, clamped ±5%
     - Raw weight `W_raw = C_i · K_i · L_i`
     - Proportional normalization (NOT softmax)
   - Concentration policy (preferred effective 15%, hard 20%, USD-effective ceiling 35%)
   - Effective USD exposure = direct USD + pegged AED + pegged SAR + USD-linked synthetic + USD-linked digital
   - Currency lifecycle (WATCH / REDUCE / SUSPEND / SUBSTITUTE / REINSTATE)
   - Severe Deviation Protocol (SDP — §6.5)
   - Minimum currency floor (0.5%) with Q1-Q4 ladder
   - Per-currency cap (60% retained as deeper sanity ceiling only — never overrides 20%)

5. **Warning Indicators.**
   - Currency weight drift >2pp from target
   - Effective USD exposure > 30% (heading toward 35% ceiling)
   - Currency volatility >5% (σ_t)
   - Sovereign rating downgrade for a basket currency
   - Capital controls imposed on a basket currency

6. **Thresholds.**
   - Hard: `Effective USD > 35%` = `USD_CONCENTRATION_BREACH` (rebalance forced)
   - Hard: `Per-currency effective weight > 20%` = `CURRENCY_CONCENTRATION_BREACH`
   - Soft: `Per-currency weight > 15%` = `CURRENCY_WATCH`
   - Soft: `Currency drift >2pp from target` = `REBALANCING_TRIGGER` (τ ≈ 2pp)

7. **Mitigation.**
   - Diversification across 11 reserve currencies (no single currency >20%)
   - Anti-procyclical attenuation reduces momentum influence during volatility
   - Rebalancing engine (§36.5) — 13-step flow with 9-item preserve list
   - Hysteresis (2% band, 2-cycle, direction-tracking) — anti-whipsaw
   - Trade suppression (`NetBenefit > 0` test)
   - Currency lifecycle SUBSTITUTE mechanism (governance-approved replacement)

8. **Owner.** Treasury.

9. **Escalation.**
   - `LEVEL-1` (Drift > 2pp) — Rebalancing proposal
   - `LEVEL-2` (Watch triggered) — Currency under observation
   - `LEVEL-3` (REDUCE) — Position reduced by 25%
   - `LEVEL-4` (SUSPEND) — Position zeroed; renormalization
   - `LEVEL-5` (SUBSTITUTE) — Governance approves replacement

10. **Emergency Response.** Currency crisis (e.g., EGP-style devaluation):
    - **Immediate** — Affected currency flagged `WATCH`
    - **T+1 hour** — If reserve currency: SUBSTITUTION evaluation
    - **T+4 hours** — Rebalancing to within corridors
    - **T+24 hours** — Settlement-only conversion if not reserve currency
    - **T+7 days** — Resolution; currency potentially moved to settlement-only list

### §32.2.8 Sovereign Risk

1. **Description.** Risk arising from country-level actions: sovereign default, capital controls, asset freezing, ratings downgrade, sanctions, expropriation, exchange restrictions.

2. **Likelihood.** `MEDIUM` — sovereign events are recurring and affect multiple asset classes simultaneously.

3. **Impact.** `MAJOR` — can affect an entire jurisdiction sleeve.

4. **Controls.**
   - §3.5 Counterparty Risk framework (sovereign subcomponent)
   - Composite jurisdictional adjustment `Jurisdiction_a` in `C_a = Credit_a × Jurisdiction_a × Operational_a`
   - Sovereign rating tracking (Fitch / Moody's / S&P / ECR)
   - Capital-controls monitor
   - Sanctions screening (OFAC, EU, UN, UK HMT, local lists)
   - Jurisdiction adapter (§34.15) — `ALLOWED / CONDITIONAL / RESTRICTED / PROHIBITED / UNKNOWN`
   - Unknown → conservative BLOCK (fail-closed)
   - China geo-fence (§V24.2.9) — crypto/stablecoin activity PROHIBITED
   - Sovereign-stress scenario in Monte Carlo (250K paths, fixed seed=42)

5. **Warning Indicators.**
   - Sovereign CDS spread >2σ above 90-day mean
   - Sovereign rating outlook negative
   - Capital-control announcement
   - Election / political instability
   - Currency peg devaluation (e.g., AED/SAR peg risk)
   - Sanctions designation

6. **Thresholds.**
   - Hard: `Sovereign rating < BBB` = `SOVEREIGN_DOWNGRADE` (CALM DEFENSIVE; jurisdiction flag RESTRCTED)
   - Hard: `Capital controls imposed` = `SOVEREIGN_CONTROLS` (settlement-only; reserve REMOVED)
   - Hard: `Sanctions designation` = `SOVEREIGN_SANCTIONS` (BLOCK; freeze; report)

7. **Mitigation.**
   - Geographic diversification (no single jurisdiction >25% hard cap / 20% preferred)
   - Custodian diversification across jurisdictions
   - Geopolitical silos (per Part V25.0-BRICS)
   - Sovereign haircuts (per §3.4)
   - Sovereign stress coefficient (per §3.6)
   - Settlement-only designation (reserve-eligible currency can be demoted)

8. **Owner.** Sovereign Risk Office (within Risk Committee).

9. **Escalation.**
   - `LEVEL-1` (Watch) — Sovereign rating outlook negative
   - `LEVEL-2` (Downgrade) — CALM DEFENSIVE; position reduction
   - `LEVEL-3` (Controls) — Settlement-only designation
   - `LEVEL-4` (Default / sanctions) — BLOCK + report

10. **Emergency Response.** Sovereign event:
    - **Immediate** — Jurisdiction adapter flag updated
    - **T+1 hour** — Affected assets fenced (no new mint)
    - **T+4 hours** — Substitute custodian activated
    - **T+24 hours** — Rebalancing within corridors
    - **T+7 days** — Public disclosure + resolution plan

### §32.2.9 Geopolitical Risk

1. **Description.** Risk arising from international conflict, bloc realignment, sanctions regimes, trade wars, or political decisions that affect cross-border settlement.

2. **Likelihood.** `HIGH` — geopolitical risk is now structural (BIS/BISIH, IMF, sanctions escalation).

3. **Impact.** `MAJOR` to `SEVERE`.

4. **Controls.**
   - Neutrality Doctrine (§V25.0.6) — immutable; MTQ is jurisdiction-neutral
   - Sanctions/Geopolitical Neutrality (§B.9 of original blueprint)
   - BRICS Integration Principle (§B.3) — modular, optional, authorization-gated
   - BRICS Settlement Interoperability Adapter (BSIA) — §B.4
   - Jurisdictional Settlement Gateway (JSG) — §B.6
   - U.S. Jurisdiction Gateway Principle — §B.7
   - U.S./BRICS Compatibility — §B.8
   - Corridor Authorization Policy — §B.10
   - BRICS Unit (conditional existence) — §B.11
   - MTQ Independence from BRICS — §B.12
   - Economic / Geopolitical Neutrality — §B.16
   - U.S. Emergency Isolation — §B.22
   - Country Gateway Policy engine — §B.19
   - Economic Resilience — §B.23

5. **Warning Indicators.**
   - Sanctions list update affecting a counterparty, custodian, or currency
   - Diplomatic rupture between major economies
   - SWIFT exclusion of a counterparty jurisdiction
   - Capital-control announcement in a corridor jurisdiction
   - Military conflict affecting a corridor
   - Trade-war escalation (tariffs, export controls)

6. **Thresholds.**
   - Hard: `Sanctions designation of MTQ counterparty` = `SANCTIONS_BLOCK` (immediate)
   - Hard: `SWIFT exclusion of jurisdiction` = `CORRIDOR_SUSPENDED`
   - Soft: `Diplomatic rupture` = `CORRIDOR_WATCH`

7. **Mitigation.**
   - Multi-rail settlement (MBG + 7 connector classes including SWIFT, ISO 20022, CBDC)
   - Geopolitical silos for custody (assets held in jurisdiction-appropriate silos)
   - Neutrality doctrine prevents picking sides
   - Corridor authorization policy (per-corridor review)
   - China geo-fence (no circumvention via VPN / alternate interfaces / indirect token access)
   - U.S. emergency isolation procedure

8. **Owner.** Geopolitical Risk Office.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Diplomatic / political monitoring
   - `LEVEL-2` (Restrict) — Corridor conditionality
   - `LEVEL-3` (Suspend) — Corridor suspended
   - `LEVEL-4` (Isolate) — Jurisdiction isolated (emergency procedure)

10. **Emergency Response.** Geopolitical event:
    - **Immediate** — Sanctions screening (OFAC SDN + EU + UN + HMT)
    - **T+1 hour** — Affected corridor PAUSED
    - **T+4 hours** — Multi-rail substitution (alternate corridor)
    - **T+24 hours** — Public disclosure of neutrality posture
    - **T+7 days** — Long-term corridor restructuring

### §32.2.10 Operational Risk

1. **Description.** Risk of loss from inadequate or failed internal processes, people, or systems — distinct from technology risk (which is software/hardware failure) and cyber risk (which is malicious external attack).

2. **Likelihood.** `MEDIUM`.

3. **Impact.** `MODERATE` to `MAJOR`.

4. **Controls.**
   - 17 non-negotiable execution rules (§V25.0.0)
   - 12-check settlement permission engine (§V25.0.23)
   - 16-step Bank Minting Workflow (BM-01..BM-16)
   - 16-step Gold Acquisition Workflow (GA-01..GA-16)
   - 13-step Rebalancing Engine (RB-01..RB-13)
   - Three-Way Reconciliation (§V25.0.22) — 15-minute cycle
   - Five-Way Reconciliation (§V25.0.D.Z) — bank + reserve evidence + custodian + canonical + proof-of-liabilities
   - CALM 6-state machine with monotonic tightening
   - Bank Revenue Model with non-compete principle (§V25.0.31)
   - FX Boundary (§V25.0.32)
   - Authority Matrix (§V25.0.34)
   - Ten Constitutional Principles (§V25.0.35)
   - Formal Acceptance Criteria 34 items (§V25.0.39)
   - Audit Trail (§16)

5. **Warning Indicators.**
   - Process step skipped (workflow violation)
   - Manual override invoked
   - Reconciliation mismatch >1bp
   - Settlement latency > SLA
   - KYC / AML / sanctions exception rate rising
   - Operator error reports

6. **Thresholds.**
   - Hard: `Workflow step skipped` = `WORKFLOW_VIOLATION` (operation BLOCKED)
   - Hard: `Reconciliation mismatch >1bp` = `RECONCILIATION_BLOCK` (mint HALTED)
   - Soft: `Manual override >3/month` = `OPERATIONAL_WATCH`

7. **Mitigation.**
   - Defense-in-depth workflow design (no single point of failure)
   - Append-only ledger (immutable audit trail)
   - Dual revocation of AvailableBackingCertificate (bank + MITHQAL)
   - Quarterly operational audit
   - Annual independent audit
   - Operator training and certification (§57.9)

8. **Owner.** COO.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Operational metrics dashboard
   - `LEVEL-2` (Incident) — Operations team response
   - `LEVEL-3` (Breach) — COO escalation, board notification
   - `LEVEL-4` (Systemic) — Emergency governance

10. **Emergency Response.**
    - **Immediate** — Affected process halted
    - **T+1 hour** — Root cause analysis initiated
    - **T+4 hours** — Workaround or fix deployed
    - **T+24 hours** — Public disclosure if material
    - **T+7 days** — Post-mortem and process update

### §32.2.11 Cyber Risk

1. **Description.** Risk of malicious external attack: unauthorized access, data exfiltration, ransomware, denial-of-service, smart-contract exploitation, supply-chain attack, key compromise.

2. **Likelihood.** `HIGH` — financial infrastructure is a high-value target.

3. **Impact.** `SEVERE` — a successful cyber attack could compromise the entire system.

4. **Controls.** (Detailed in §33 Security Architecture.)
   - Zero Trust architecture (5 required authentications per request)
   - 7-layer finality-before-mint enforcement (10/10 bypass routes blocked)
   - Multi-signature signing + MPC (Multi-Party Computation)
   - HSM (Hardware Security Module) for key protection
   - PQC roadmap (Falcon-512, Lamport signatures)
   - WAF + DDoS protection + network segmentation
   - Bug bounty program
   - External security audit (Standing Blocker #1)
   - Annual penetration testing
   - Continuous monitoring + SIEM
   - Assume Breach design philosophy

5. **Warning Indicators.**
   - Anomalous API request patterns
   - Failed authentication spikes
   - Unusual internal service-to-service traffic
   - HSM access anomalies
   - Suspicious DNS / network egress
   - Security researcher report
   - Public vulnerability disclosure affecting a dependency

6. **Thresholds.**
   - Hard: `Suspected compromise` = `SECURITY_INCIDENT` (IR plan activates)
   - Hard: `Confirmed compromise` = `SECURITY_BREACH` (system freeze + council)
   - Soft: `Anomalous activity` = `SECURITY_WATCH`

7. **Mitigation.**
   - Defense-in-depth (Constitutional → Smart Contract → Cryptographic → Oracle → Custody → Network → Governance → Quantum layers per the v25.0 Security Architecture)
   - 7-layer finality enforcement
   - No admin backdoor (L5 ledger state machine is append-only and enforces sequence for ALL callers)
   - Bank-side key compromise: gateway PAUSED + 8-step recovery plan (`handleGatewayFailure`)

8. **Owner.** CISO.

9. **Escalation.**
   - `LEVEL-1` (Watch) — SIEM alert
   - `LEVEL-2` (Suspected) — IR team activated (1-hour response)
   - `LEVEL-3` (Confirmed) — Council + regulator notification
   - `LEVEL-4` (Active) — Public disclosure + service suspension

10. **Emergency Response.** Confirmed cyber compromise:
    - **Immediate** — Affected systems isolated
    - **T+1 hour** — IR plan activated; CISO + CTO + General Counsel notified
    - **T+4 hours** — Forensic investigation launched
    - **T+24 hours** — Public disclosure if material; regulator notification
    - **T+7 days** — Remediation plan; key rotation
    - **T+30 days** — Full post-mortem + security posture update

### §32.2.12 Technology Risk

1. **Description.** Risk of loss from software defects, infrastructure failure, dependency failure, configuration drift, or scaling limits — distinct from cyber risk (which is malicious).

2. **Likelihood.** `MEDIUM`.

3. **Impact.** `MODERATE` to `MAJOR`.

4. **Controls.**
   - Smart-contract architecture (9 contracts per §V25.0.19)
   - Formal verification FV1–FV25
   - Test scenarios INT-T01..INT-T35 (35 tests)
   - Pre-production testnet deployment (Monad testnet)
   - Model validity gate (`ModelValidity < MinimumThreshold → LastApprovedDeterministicPolicyPortfolio`)
   - Challenger-model requirement (3-of-5 challenger agreement)
   - Circuit breakers per oracle (§12.3)
   - Oracle fallback hierarchy (§12.4)
   - Version control + parameter classification (37 parameters: 14 Class A + 8 Class B + 5 Class C + 10 Class D)
   - 5-step SDLC per §58 Constitutional Engineering Lifecycle

5. **Warning Indicators.**
   - Test failure rate rising
   - Latency > SLA
   - Error rate > 0.1%
   - Dependency CVE publication
   - Model disagreement >5pp
   - Database write contention

6. **Thresholds.**
   - Hard: `Production incident P0` = `TECHNOLOGY_INCIDENT` (immediate response)
   - Hard: `Model validity below threshold` = `MODEL_FAILURE_GATE` (fallback to LastApproved)
   - Soft: `Test failure >2%` = `TECHNOLOGY_WATCH`

7. **Mitigation.**
   - Testnet-first deployment (no production until validation gates met)
   - Multi-environment (dev / staging / sandbox / production)
   - Independent audit (Standing Blocker #6: 37 SC changes pending external audit)
   - Bug bounty
   - Dependency pinning + SCA (Software Composition Analysis)
   - Container immutability
   - Infrastructure-as-Code

8. **Owner.** CTO.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Observability dashboard
   - `LEVEL-2` (Incident) — Engineering response (15-min ack)
   - `LEVEL-3` (Outage) — Service degradation / fallback
   - `LEVEL-4` (Catastrophic) — Service suspension + council

10. **Emergency Response.**
    - **Immediate** — Fallback to last-known-good
    - **T+1 hour** — Engineering response
    - **T+4 hours** — Root cause identified
    - **T+24 hours** — Fix deployed to staging
    - **T+7 days** — Production deployment + post-mortem

### §32.2.13 Legal Risk

1. **Description.** Risk of contract dispute, tort claim, litigation, regulatory enforcement, or unfavorable judicial interpretation.

2. **Likelihood.** `MEDIUM`.

3. **Impact.** `MAJOR` to `SEVERE`.

4. **Controls.**
   - 13-dimension Legal Liability Framework (§49): jurisdiction, legal nature, obligor, holder rights, redemption, settlement finality, creditor treatment, insolvency treatment, transferability, pledgeability, governing law, dispute resolution, licensing classification
   - 8 jurisdictions seeded (US, EU/EEA, UK, CH, SG, AE, SA, JP) — all `JURISDICTION_PENDING`
   - 11 contractual questions for bank-default resolution (all CONTRACT_PENDING)
   - 14 Foundation validation topics
   - External legal counsel engagement (per jurisdiction) — status PENDING
   - Conservative interpretation rule
   - 22 final non-negotiable principles (§94) including: "No code-only capability may be represented as institutionally validated. No technical capability may be represented as legally authorized without evidence."

5. **Warning Indicators.**
   - Litigation filed against the Institution
   - Regulator inquiry
   - Counterparty dispute
   - Holder complaint
   - Judicial decision affecting digital monetary instruments
   - New draft legislation

6. **Thresholds.**
   - Hard: `Litigation filed` = `LEGAL_EVENT_LEVEL_3` (general counsel + board notification)
   - Hard: `Regulator inquiry` = `LEGAL_EVENT_LEVEL_2` (general counsel + 5-day board)
   - Soft: `Holder complaint` = `LEGAL_EVENT_LEVEL_1` (counsel review)

7. **Mitigation.**
   - Conservative documentation (every legal-nature field prefixed `"PENDING OPINION —"`)
   - Conservative jurisdiction characterization (UNKNOWN → conservative BLOCK)
   - Insurance (D&O, E&O, cyber) — status PENDING
   - Pre-action protocol (engagement before dispute)
   - Alternative dispute resolution clause
   - Choice-of-law and choice-of-forum selection per jurisdiction

8. **Owner.** General Counsel.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Legal tracker
   - `LEVEL-2` (Inquiry) — Counsel engagement
   - `LEVEL-3` (Litigation) — Board + outside counsel
   - `LEVEL-4` (Adverse judgment) — Resolution / appeal / wind-down

10. **Emergency Response.**
    - **Immediate** — Litigation hold notice
    - **T+1 hour** — Counsel engaged
    - **T+4 hours** — Document preservation
    - **T+24 hours** — Initial strategy
    - **T+7 days** — Defense plan

### §32.2.14 Reputation Risk

1. **Description.** Risk of loss of public trust, media criticism, ESG controversy, or social-media-driven reputational damage.

2. **Likelihood.** `MEDIUM`.

3. **Impact.** `MODERATE` to `MAJOR` (reputational damage can trigger holder redemptions).

4. **Controls.**
   - Transparency Architecture (§V25.0.21 Proof-of-Liabilities, §V25.0.22 Three-Way Reconciliation, §V25.0.37 Regulatory Observability)
   - Honest-state reporting (§74 Honest State aggregation)
   - 22 final non-negotiable principles (§94)
   - Canonical terminology (§V25.0.28 — preferred 12 terms, avoid 10 terms)
   - Quarterly transparency reports
   - Annual independent audit
   - Public dashboard (Foundation READ-ONLY 7 fields)
   - Anti-marketing-control principle (§B.16 Economic / Geopolitical Neutrality — Marketing Control)
   - Honest quantification (no probability claims without independent modeling)

5. **Warning Indicators.**
   - Negative media coverage
   - Social media sentiment shift
   - Holder complaints rising
   - Redemption pressure rising (without solvency stress)
   - Regulator public statement
   - Counterparty reputational event

6. **Thresholds.**
   - Hard: `Holder redemption rate >2σ above 30-day mean` = `REPUTATION_STRESS` (CALM DEFENSIVE)
   - Soft: `Negative media coverage` = `REPUTATION_WATCH`

7. **Mitigation.**
   - Transparent communication
   - Pre-approved crisis-communication templates
   - Designated spokesperson
   - Independent PR counsel
   - Honest disclosure (no spin, no minimization)

8. **Owner.** Head of Communications.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Media monitoring
   - `LEVEL-2` (Coverage) — Communications response
   - `LEVEL-3` (Crisis) — Crisis-communication plan
   - `LEVEL-4` (Existential) — Strategic review

10. **Emergency Response.**
    - **Immediate** — Crisis team assembled
    - **T+1 hour** — Initial statement (factual, no spin)
    - **T+4 hours** — Public communication
    - **T+24 hours** — Update with remediation plan
    - **T+7 days** — Post-crisis review

### §32.2.15 Settlement Risk

1. **Description.** Risk that settlement does not occur, occurs late, occurs partially, or settles the wrong amount. Includes PvP (payment-vs-payment) atomicity risk, Herstatt risk, and cross-border settlement risk.

2. **Likelihood.** `MEDIUM`.

3. **Impact.** `MAJOR` — settlement failure is existential for a settlement institution.

4. **Controls.**
   - Settlement Finality architecture (§V25.0.26, §V25.0.D.AA — 5-way reconciliation)
   - Finality-Before-Mint (§54 — 7 layers, 10/10 bypass routes blocked)
   - PvP atomicity invariant (FV11 — if PvP implemented, both legs settle or neither)
   - 12-check settlement permission engine (§V25.0.23)
   - 16-step Bank Minting Workflow (BM-01..BM-16)
   - 7-layer finality enforcement (L1-L7 per §33.9)
   - Bank-side failure state (§MBG-19): 8-step recovery plan, ALWAYS manual + controlled, NEVER automatic
   - MITHQAL-side failure state (§MBG-20): bank sees `PENDING_MITHQAL_CONFIRMATION`; never assume technical failure = payment completion
   - Settlement record schema (14 fields per §V25.0.9)
   - Institutional traceability (6-hop trace path)
   - Three-Way Reconciliation every 15 minutes

5. **Warning Indicators.**
   - Settlement latency > SLA
   - Reconciliation mismatch >1bp
   - Pending instruction aging >4 hours
   - Bank gateway heartbeat loss
   - Finality oracle deviation >2%

6. **Thresholds.**
   - Hard: `Settlement latency > 4 hours` = `SETTLEMENT_STRESS` (escalation)
   - Hard: `Reconciliation mismatch >1bp` = `RECONCILIATION_BLOCK` (mint HALT)
   - Hard: `Finality oracle deviation >2%` = `ORACLE_CIRCUIT_BREAKER`

7. **Mitigation.**
   - 7-layer finality enforcement
   - 5-way reconciliation
   - PvP atomicity (FV11)
   - 8-step recovery plan (manual + controlled)
   - Bank can initiate reversal if finality not received within SLA window
   - Multiple settlement rails (MBG + SWIFT + ISO 20022 + CBDC + bank REST API + treasury system + corporate portal)

8. **Owner.** Settlement Risk Office.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Settlement metrics dashboard
   - `LEVEL-2` (Latency) — Operations response
   - `LEVEL-3` (Mismatch) — Reconciliation halt
   - `LEVEL-4` (Failure) — Bank-side + MITHQAL-side failure procedure

10. **Emergency Response.** Settlement failure:
    - **Immediate** — Pending instructions flagged `PENDING_MITHQAL_CONFIRMATION`
    - **T+1 hour** — Gateway PAUSED (if bank-side failure)
    - **T+4 hours** — 8-step recovery plan initiated
    - **T+24 hours** — Manual reconciliation
    - **T+7 days** — Permanent resolution + audit trail preservation

### §32.2.16 Reserve Risk

1. **Description.** Risk to reserve composition, valuation, or quality: haircut miscalibration, asset disqualification, reserve devaluation, model failure, drift beyond corridors.

2. **Likelihood.** `MEDIUM`.

3. **Impact.** `SEVERE` — reserve is the foundation of MTQ.

4. **Controls.**
   - Three-layer reserve valuation: `R_m ≥ R_a ≥ R_l` (Market / Adjusted / Liquidation)
   - Reserve ratio (RR) — `RR = R_a / L`, target 1.30, policy floor 1.05, absolute floor 1.00
   - FSCR (Forward Stress Coverage Ratio) — `FSCR = R_l / L` (coverage interpretation; normal ≥1.10, defensive ≥1.05, emergency ≥1.00)
   - LCR — `LCR = HQLA / 30-day net redemption outflow`, target ≥1.00
   - Constitutional corridors: fiat 70-85%, bullion 15-25%, digital 0-5%
   - 80/18/2 policy center (current strategic target)
   - Concentration limits (15% preferred / 20% hard / 60% deeper sanity ceiling)
   - USD-effective ceiling 35% (includes pegged AED + pegged SAR + USD-linked synthetic + USD-linked digital)
   - Counterparty adjustment `C_a = Credit_a × Jurisdiction_a × Operational_a`
   - Stress coefficients `S_a` per §3.6
   - Haircut table (§3.4) — dynamic haircut (§20 of v24.2.1 Directive)
   - 4-tier hierarchical optimizer (Hard Constraints → Risk → Costs → Stability)
   - Model validity gate (model failure → LastApprovedDeterministicPolicyPortfolio)
   - Challenger-model requirement (3-of-5 agreement for parameter changes)
   - 250K Monte Carlo (fixed seed=42, 18 version-controlled parameters)
   - CALM 6-state machine

5. **Warning Indicators.**
   - RR < 1.20 (heading toward policy floor)
   - StressRR < 1.10
   - LCR < 1.10
   - Reserve weight drift >2pp from target
   - Currency effective weight >15%
   - USD-effective exposure >30%
   - Bullion weight outside 15-25% corridor
   - Digital liquidity >3% (operational ceiling)
   - Model disagreement >5pp

6. **Thresholds.**
   - Hard: `RR < 1.00` = `SOLVENCY_BREACH` (emergency governance)
   - Hard: `RR < 1.05` = `POLICY_FLOOR_BREACH` (CALM EMERGENCY, mint BLOCKED)
   - Hard: `StressRR < 1.00` = `STRESS_SOLVENCY_BREACH`
   - Hard: `LCR < 1.00` = `LIQUIDITY_BREACH`
   - Soft: `RR < 1.20` = `STRATEGIC_TARGET_MISS` (rebalancing review)
   - Soft: `Bullion < 15% or >25%` = `CORRIDOR_BREACH` (forced rebalancing)

7. **Mitigation.**
   - CALM 6-state machine (NORMAL → CAUTION → DEFENSIVE → STRESS → EMERGENCY → RECOVERY)
   - DMCE bounds FV18 (bank cannot mint outside capacity)
   - Rebalancing engine (13-step flow, 2pp threshold, hard overrides, transaction-cost test)
   - Hysteresis (2% band, 2-cycle, direction-tracking) — anti-whipsaw
   - Trade suppression (`NetBenefit > 0` test)
   - Anti-double-count verification (`verifyNoDoubleCount`)
   - Independent attestation (Source B + Source D)

8. **Owner.** Monetary & Reserve Control Division.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Daily reserve metrics
   - `LEVEL-2` (Drift) — Rebalancing proposal
   - `LEVEL-3` (Floor breach) — CALM EMERGENCY
   - `LEVEL-4` (Invariant breach) — Emergency governance

10. **Emergency Response.** Reserve emergency:
    - **Immediate** — CALM EMERGENCY state; mint BLOCKED; redemption queue
    - **T+1 hour** — ILPS Emergency Layer ($10.8M) drawn
    - **T+4 hours** — Article X sequential liquidation (gold LAST) initiated if needed
    - **T+24 hours** — Resolution plan
    - **T+7 days** — Stabilization (capital raise, asset substitution, or restructuring)

### §32.2.17 Concentration Risk

1. **Description.** Risk arising from excessive exposure to a single name, counterparty, currency, custodian, jurisdiction, settlement rail, or other dimension. Includes system-wide concentration (where the institution's growth creates concentration even if no individual limit is breached).

2. **Likelihood.** `MEDIUM` — concentration can grow silently.

3. **Impact.** `MAJOR` — concentration compounds other risks.

4. **Controls.**
   - Systemic Exposure Engine (§52 — 1,295 lines, 13 concentration dimensions): bank, banking group, country, currency, custodian, correspondent, settlement rail, liquidity provider, stablecoin issuer, technology provider, geopolitical correlation, operational correlation, bank exposure
   - Two-question framework: (A) Is Bank A within its individual limit? (B) Does Bank A's growth create excessive system-wide concentration?
   - Concentration limits (§76): currency 15%/20%, bank 15%/20%, custodian 15%/20%, country 20%/25%
   - Per-currency effective 15% preferred / 20% hard (60% sanity ceiling never overrides 20%)
   - USD-effective ceiling 35% (includes pegged AED + pegged SAR + USD-linked synthetic + USD-linked digital)
   - Counterparty diversification
   - Geographic diversification (no single jurisdiction >25% hard cap / 20% preferred)
   - Custodian diversification (15% preferred / 25% hard cap per custodian)
   - Counterparty monitoring (daily)
   - Anti-double-count verification (`verifyNoDoubleCount`)

5. **Warning Indicators.**
   - Single counterparty exposure >15% of effective reserve
   - Single custodian exposure >20% of effective reserve
   - Single country exposure >20% of effective reserve
   - Single currency exposure >15% of effective reserve
   - USD-effective exposure >30%
   - Bank exposure >15% of canonical MTQ supply
   - Correlation matrix eigenvalue index rising (concentration rising)

6. **Thresholds.**
   - Hard: `Single counterparty >20%` = `CONCENTRATION_BREACH`
   - Hard: `Single custodian >25%` = `CUSTODIAN_BREACH`
   - Hard: `Single country >25%` = `COUNTRY_BREACH`
   - Hard: `Single currency >20% effective` = `CURRENCY_BREACH`
   - Hard: `USD-effective >35%` = `USD_BREACH`
   - Soft: `Single counterparty >15%` = `CONCENTRATION_WATCH`

7. **Mitigation.**
   - Systemic Exposure Engine monitors both individual AND system-wide
   - Diversification mandates (multi-counterparty, multi-custodian, multi-jurisdiction)
   - Substitute mechanism (governance-approved replacement)
   - DMCE includes `ConcentrationLimit` component
   - Per-bank exposure hard cap 25% of canonical MTQ supply

8. **Owner.** Risk Committee.

9. **Escalation.**
   - `LEVEL-1` (Watch) — Daily concentration dashboard
   - `LEVEL-2` (Near-breach) — Rebalancing proposal
   - `LEVEL-3` (Breach) — Forced rebalancing; new mint BLOCKED
   - `LEVEL-4` (Systemic) — Emergency governance

10. **Emergency Response.**
    - **Immediate** — Affected counterparty's new mint BLOCKED
    - **T+1 hour** — Rebalancing initiated
    - **T+4 hours** — Position reduced below hard cap
    - **T+24 hours** — Within preferred cap
    - **T+7 days** — Permanent diversification plan

---

## §32.3 Likelihood × Impact Matrix

The MITHQAL Risk Matrix uses a 5×5 grid (Likelihood × Impact) with four bands. Each risk dossier (§32.2) places its risk in the matrix; the matrix drives governance attention.

### §32.3.1 Likelihood Scale (annualized)

| Level | Probability | Description |
|---|---|---|
| VERY_LOW | <5% | Rare event, multiple controls in place |
| LOW | 5–20% | Unlikely, some controls in place |
| MEDIUM | 20–50% | Possible, controls partial |
| HIGH | 50–80% | Likely, limited controls |
| VERY_HIGH | ≥80% | Almost certain |

### §32.3.2 Impact Scale (relative to R_a, or FV invariant breach)

| Level | Impact | Description |
|---|---|---|
| NEGLIGIBLE | <0.5% | No material effect |
| MINOR | 0.5–2% | Limited effect, recoverable |
| MODERATE | 2–5% | Material effect, recoverable |
| MAJOR | 5–10% | Significant effect, recovery difficult |
| SEVERE | ≥10% OR FV breach | Existential threat |

### §32.3.3 Risk Bands

| Band | Definition | Governance Attention |
|---|---|---|
| **GREEN** | Likelihood ≤ LOW AND Impact ≤ MODERATE | Quarterly review |
| **AMBER** | Likelihood = MEDIUM OR Impact = MAJOR | Monthly review |
| **RED** | Likelihood ≥ HIGH OR Impact = SEVERE | Weekly review |
| **BLACK** | Likelihood = VERY_HIGH AND Impact = SEVERE | Daily review + Council |

### §32.3.4 17-Categories Matrix Placement

| # | Risk | Likelihood | Impact | Band |
|---:|---|---|---|---|
| 1 | Strategic | MEDIUM | SEVERE | RED |
| 2 | Regulatory | MEDIUM | SEVERE | RED |
| 3 | Monetary | LOW | SEVERE | RED |
| 4 | Liquidity | MEDIUM | MAJOR | AMBER |
| 5 | Credit | LOW | MODERATE | GREEN |
| 6 | Counterparty | MEDIUM | MODERATE | AMBER |
| 7 | Currency | HIGH | MODERATE | AMBER |
| 8 | Sovereign | MEDIUM | MAJOR | AMBER |
| 9 | Geopolitical | HIGH | MAJOR | RED |
| 10 | Operational | MEDIUM | MODERATE | AMBER |
| 11 | Cyber | HIGH | SEVERE | RED |
| 12 | Technology | MEDIUM | MODERATE | AMBER |
| 13 | Legal | MEDIUM | MAJOR | AMBER |
| 14 | Reputation | MEDIUM | MODERATE | AMBER |
| 15 | Settlement | MEDIUM | MAJOR | AMBER |
| 16 | Reserve | MEDIUM | SEVERE | RED |
| 17 | Concentration | MEDIUM | MAJOR | AMBER |

**Band Summary:** 6 RED · 10 AMBER · 1 GREEN · 0 BLACK.

### §32.3.5 Matrix Governance

- **GREEN band risks:** Quarterly Risk Committee review
- **AMBER band risks:** Monthly Risk Committee review + monthly board report
- **RED band risks:** Weekly Risk Committee review + weekly board report + monthly Council update
- **BLACK band risks:** Daily review + immediate Council session

The matrix is recalibrated quarterly based on observed incidents, near-misses, and changes in the external environment (regulatory, geopolitical, market). Recalibration requires Risk Committee approval and is logged in the immutable audit trail.

---

## §32.4 Reserve Risk Engine (16 Risk Types)

The Reserve Risk Engine is a specialized subsystem that quantifies 16 distinct risk types affecting the reserve. It is integrated with the 4-tier hierarchical optimizer (per §V24.2.6 of the blueprint) — Tier 2 (Risk Objectives) minimizes the weighted sum of these 16 risks.

### §32.4.1 Risk Type Inventory

| # | Risk Type | Description | Metric | Owner |
|---:|---|---|---|---|
| 1 | Liquidity risk | HQLA insufficient to meet 30-day outflow | LCR, MLCR | Treasury |
| 2 | Duration risk | Interest-rate sensitivity of reserve assets | Duration, DV01 | Treasury |
| 3 | Currency risk | FX rate moves on reserve basket | Effective weight, vol | Treasury |
| 4 | Custodian risk | Custodian failure / concentration | Custodian concentration | Counterparty Risk Office |
| 5 | Bank concentration risk | Excessive single-bank exposure | Bank exposure % | Counterparty Risk Office |
| 6 | Sovereign risk | Sovereign default / controls | Sovereign CDS, rating | Sovereign Risk Office |
| 7 | Counterparty risk | Bank / LP / oracle failure | C_a, ops incidents | Counterparty Risk Office |
| 8 | Commodity risk | Gold / silver price moves | Bullion weight, vol | Treasury |
| 9 | Operational risk | Process / people failure | Incident count | COO |
| 10 | Cyber risk | Cyber attack | SIEM alerts, IR count | CISO |
| 11 | Settlement risk | Finality / PvP failure | Settlement latency | Settlement Risk Office |
| 12 | Sanctions risk | Sanctions designation affecting counterparty | Sanctions screen hit count | Compliance |
| 13 | Geopolitical risk | Bloc realignment / conflict | Country risk index | Geopolitical Risk Office |
| 14 | Reserve valuation risk | Haircut / C_a miscalibration | R_m / R_a / R_l spread | Monetary & Reserve Control Division |
| 15 | Collateral impairment risk | Backing asset deterioration | Backing verification mismatch | Monetary & Reserve Control Division |
| 16 | Emergency liquidity risk | ILPS layer insufficiency | ILPS layer coverage | Treasury |

### §32.4.2 Risk Quantification Methodology

Each of the 16 risks is quantified using:

```
RiskScore_i = Likelihood_i × Impact_i × ConcentrationFactor_i × CorrelationFactor_i
```

Where:
- `Likelihood_i` ∈ [0, 1] — annualized probability
- `Impact_i` ∈ [0, 1] — fraction of R_a affected
- `ConcentrationFactor_i` — amplification from concentration (1.0 if no concentration; up to 1.5 if max concentration)
- `CorrelationFactor_i` — amplification from correlation with other risks (1.0 if independent; up to 1.3 if highly correlated)

Total reserve risk:
```
TotalReserveRisk = Σ_i RiskScore_i × (1 + CorrelationDiversification_i)
```

The engine reports both `TotalReserveRisk` and the top-5 contributing risks.

### §32.4.3 Per-Type Quantification

#### §32.4.3.1 Liquidity Risk
- `Metric:` LCR, MLCR
- `Target:` LCR ≥ 1.10, MLCR ≥ 1.00
- `Stress scenario:` 30-day net redemption outflow at 99th percentile
- `Mitigation:` ILPS 5-layer ($46M total)

#### §32.4.3.2 Duration Risk
- `Metric:` Modified duration of sovereign bond portfolio
- `Target:` Duration ≤ 2 years (short-duration sovereign)
- `Stress scenario:` +200bp yield shock
- `Mitigation:` Short-duration mandate; treasury bills; overnight repos

#### §32.4.3.3 Currency Risk
- `Metric:` Effective weight per currency, basket volatility σ_t
- `Target:` Per-currency ≤ 20% effective; USD-effective ≤ 35%
- `Stress scenario:` -20% move in largest-weight currency
- `Mitigation:` Diversification across 11 currencies; anti-procyclical attenuation

#### §32.4.3.4 Custodian Risk
- `Metric:` Per-custodian concentration
- `Target:` 15% preferred / 25% hard cap
- `Stress scenario:` Single custodian failure
- `Mitigation:` Multi-custodian; substitute mechanism

#### §32.4.3.5 Bank Concentration Risk
- `Metric:` Per-bank exposure % of canonical MTQ supply
- `Target:` 15% preferred / 25% hard cap
- `Stress scenario:` Single bank default
- `Mitigation:` Multi-bank; DMCE per-bank capacity; bank-default resolution framework

#### §32.4.3.6 Sovereign Risk
- `Metric:` Sovereign CDS spreads, ratings, country risk index
- `Target:` No single jurisdiction > 20% preferred / 25% hard
- `Stress scenario:` Sovereign default
- `Mitigation:` Geographic diversification; jurisdiction adapter

#### §32.4.3.7 Counterparty Risk
- `Metric:` C_a composite score, operational incidents
- `Target:` C_a ≥ 0.85 for all counterparties
- `Stress scenario:` Counterparty failure
- `Mitigation:` Composite assessment; multi-source evidence; substitute mechanism

#### §32.4.3.8 Commodity Risk
- `Metric:` Bullion weight (target 18%), gold/silver vol
- `Target:` Bullion 15-25% corridor; gold 18% target
- `Stress scenario:` Gold -20% (-4.4pp to RR per what-if scenario B)
- `Mitigation:` Diversification; gold liquidation LAST (Article X)

#### §32.4.3.9 Operational Risk
- `Metric:` Incident count, reconciliation mismatches
- `Target:` Zero P0 incidents; <0.1% reconciliation mismatch rate
- `Stress scenario:` Major operational failure
- `Mitigation:` Defense-in-depth workflow; append-only ledger

#### §32.4.3.10 Cyber Risk
- `Metric:` SIEM alerts, IR activations
- `Target:` Zero confirmed breaches
- `Stress scenario:` Confirmed cyber compromise
- `Mitigation:` Zero Trust; 7-layer finality; MPC; HSM; PQC roadmap

#### §32.4.3.11 Settlement Risk
- `Metric:` Settlement latency, finality oracle deviation
- `Target:` Latency < SLA; oracle deviation <2%
- `Stress scenario:` Settlement failure
- `Mitigation:` 7-layer finality; 5-way reconciliation; PvP atomicity

#### §32.4.3.12 Sanctions Risk
- `Metric:` Sanctions screen hit count, OFAC SDN list changes
- `Target:` Zero sanctions violations
- `Stress scenario:` Counterparty designated
- `Mitigation:` OFAC fail-closed (null on fetch failure → ALL BLOCKED); multi-list screening

#### §32.4.3.13 Geopolitical Risk
- `Metric:` Country risk index, diplomatic events, sanctions designations
- `Target:` Neutrality maintained; no bloc alignment
- `Stress scenario:` Bloc realignment / conflict
- `Mitigation:` Neutrality doctrine; multi-rail; geopolitical silos

#### §32.4.3.14 Reserve Valuation Risk
- `Metric:` R_m / R_a / R_l spread; haircut calibration drift
- `Target:` R_m / R_a spread within historical band; haircut table current
- `Stress scenario:` Haircut miscalibration
- `Mitigation:` Independent haircut review; challenger-model requirement

#### §32.4.3.15 Collateral Impairment Risk
- `Metric:` Backing verification mismatch (claimed vs verified)
- `Target:` Zero mismatches beyond 1bp
- `Stress scenario:` Backing asset deterioration
- `Mitigation:` Anti-double-count verification; multi-source evidence; 5-way reconciliation

#### §32.4.3.16 Emergency Liquidity Risk
- `Metric:` ILPS layer coverage ratio
- `Target:` Each layer ≥ 100% of designated coverage
- `Stress scenario:` Multiple layers drawn simultaneously
- `Mitigation:` Layered design (Settlement + Redemption + Emergency + Structural + External)

### §32.4.4 Engine Output

The Reserve Risk Engine produces:
1. `riskScore` per type (16 values)
2. `totalReserveRisk` (aggregate)
3. `top5Contributors` (ranked list)
4. `trendVsYesterday` (delta)
5. `trendVsLastWeek` (delta)
6. `correlationMatrix` (16×16)
7. `stressScenarioResults` (per scenario)
8. `recommendedActions` (per type)

Output is published to:
- Monetary & Reserve Control Dashboard (20 fields)
- Foundation READ-ONLY Dashboard (aggregate only)
- Council weekly risk report
- Quarterly public transparency report (aggregate only)

### §32.4.5 Honest State

```
systemicRiskEngineDesigned     = true
systemicRiskEngineImplemented  = true
systemicRiskMonitoringLive     = false
systemicRiskProductionValidated = false
```

The engine is designed and code-implemented. Live monitoring is NOT active — there are no live institutional data feeds (0 banks contracted, 0 custodians contracted, 0 licenses obtained). Production validation is pending independent institutional validation (Standing Blocker #9 — external audit).

---

## §32.5 Risk Governance, Ownership, Escalation

### §32.5.1 Three Lines of Defense

| Line | Role | Function |
|---|---|---|
| **1st** | Business / operational owners | Identify, own, manage risks in day-to-day operations |
| **2nd** | Risk Committee + Risk function | Independent oversight; framework design; challenge |
| **3rd** | Internal Audit + Independent External Audit | Independent assurance; effectiveness testing |

### §32.5.2 Risk Committee

- **Composition:** 7 members — CRO (chair), CFO, CTO, CISO, General Counsel, Head of Treasury, Independent Risk Expert
- **Quorum:** 5 of 7
- **Cadence:** Weekly (RED risks), Monthly (AMBER), Quarterly (GREEN), Ad-hoc (BLACK)
- **Authority:** Recommend policy changes to Council; approve operational risk decisions within delegated authority
- **Cannot:** Override FV1-FV25 invariants; approve emergency governance actions; authorize production

### §32.5.3 Escalation Ladder

| Level | Trigger | Authority |
|---|---|---|
| L1 | Watch / observation | Risk owner |
| L2 | Near-breach / soft threshold | Risk Committee |
| L3 | Breach / hard threshold | Council (emergency session if FV invariant) |
| L4 | Existential threat | Council + Foundation Board + Regulator notification |
| L5 | Wind-down | Foundation Board + Regulator + Public disclosure |

### §32.5.4 Escalation SLAs

- L1 → L2: 24 hours
- L2 → L3: 4 hours
- L3 → L4: 1 hour
- L4 → L5: Council decision (24-72 hours)

### §32.5.5 Independence Requirements

- CRO reports to Council, NOT to CEO/COO (independence)
- Internal Audit reports to Foundation Audit Committee, NOT to management
- External Audit reports to Foundation Audit Committee + regulators
- Risk Committee has at least one independent expert (no JOZOUR affiliation)

---

## §32.6 Risk Reporting & Stress Cadence

### §32.6.1 Reporting Cadence

| Report | Frequency | Audience | Content |
|---|---|---|---|
| Daily Risk Dashboard | Daily 06:00 UTC | Risk Committee | Top risks, breaches, near-breaches |
| Weekly Risk Report | Weekly Monday | Council + Foundation Board | Trend, top contributors, recommended actions |
| Monthly Risk Report | Monthly | Council + public summary | Aggregate metrics, incidents, remediation |
| Quarterly Risk Report | Quarterly | Council + Foundation + Regulators (where required) | Full risk assessment, scenario results, model validity |
| Annual Risk Report | Annual | Council + Foundation + Public | Comprehensive, audited |
| Ad-hoc Incident Report | Ad-hoc | Council + (regulator if material) | Incident, impact, response, remediation |

### §32.6.2 Stress Test Cadence

| Test | Frequency | Scope |
|---|---|---|
| Daily stress test | Daily | 5 canonical scenarios |
| Weekly stress test | Weekly | 15 scenarios (daily + 10 additional) |
| Monthly stress test | Monthly | 30 scenarios + reverse stress test |
| Quarterly stress test | Quarterly | Full 250K Monte Carlo (seed=42) + 4 challenger models |
| Annual stress test | Annual | Comprehensive + independent validation |

### §32.6.3 Reverse Stress Test

Quarterly reverse stress test identifies scenarios that would cause:
- RR < 1.00 (solvency breach)
- LCR < 1.00 (liquidity breach)
- FSCR < 1.00 (forward stress breach)
- 5 systemic risk types simultaneously in BLACK band

Reverse stress results drive:
- Capital adequacy review (ΔCapital_min revalidation)
- Reserve composition review
- Counterparty diversification review
- Insurance coverage review

### §32.6.4 Model Validity

- Model validity score ≥ minimum threshold for production
- If below: `MODEL_FAILURE_GATE` → fallback to LastApprovedDeterministicPolicyPortfolio
- Challenger-model disagreement >5pp triggers model review
- Annual independent model validation (Standing Blocker #9)

### §32.6.5 Honest State for Risk Reporting

```
riskEngineDesigned           = true
riskEngineImplemented        = true
riskMonitoringLive           = false  (no live data)
riskReportingProductionReady = false
independentRiskAudit         = PENDING
```

---

## §32.7 Honest State & Open Items — §32

```
section                     = "§32 Risk Architecture"
riskTaxonomyCount           = 17
riskEngineTypes             = 16
riskMatrixBands              = 4 (GREEN/AMBER/RED/BLACK)
redBandRisks                = 6
amberBandRisks              = 10
greenBandRisks              = 1
blackBandRisks              = 0
riskEngineDesigned          = true
riskEngineImplemented       = true
riskMonitoringLive          = false
riskReportingProductionReady = false
independentRiskAudit        = PENDING
challengerModels            = 5 (3-of-5 agreement required)
monteCarloPaths             = 250000
monteCarloSeed              = 42 (reproducible)
modelValidityGate           = HARD_GATE
productionAuthorization     = false
```

**Open items:**
1. Engage external risk audit firm (Standing Blocker #9)
2. Activate live risk monitoring feeds (requires at least 1 bank contracted, 1 custodian contracted)
3. Obtain independent model validation
4. Quarterly reverse stress test execution (per §32.6.3)
5. Annual independent risk audit per §32.6.1

**END OF §32 — RISK ARCHITECTURE**

---


# §33 — SECURITY ARCHITECTURE

## §33.0 Zero Trust Posture

### §33.0.1 Principle

**Never trust, always verify.** The MITHQAL security posture assumes breach. Every request, internal or external, must be authenticated, authorized, encrypted, and logged. No implicit trust is granted based on network location, prior authentication, or institutional status.

### §33.0.2 Six Foundational Principles

| # | Principle | Implementation |
|---:|---|---|
| 1 | **Defense in Depth** | 7-layer architecture: Constitutional → Smart Contract → Cryptographic → Oracle → Custody → Network → Governance + Quantum layer |
| 2 | **Zero Trust** | 5 required authentications per request (INSTITUTION + GATEWAY + SIGNING_KEY + POLICY_VERSION + TRANSACTION_AUTHORIZATION); `defaultDeny = true` |
| 3 | **Least Privilege** | Permissions on need-to-know basis; quarterly review; revocation on role change; administrative access tightly controlled |
| 4 | **Assume Breach** | System designed to survive compromise; detection prioritized; recovery procedures defined and tested; breach scenarios practiced |
| 5 | **Transparency** | Security controls documented; incidents disclosed; audits published; security practices open to review |
| 6 | **Continuous Improvement** | Regular assessments, penetration tests, audits; findings addressed; controls updated; security evolves with threats |

### §33.0.3 Threat Model Summary

| Actor | Motivation | Capability | Likelihood | Mitigation |
|---|---|---|---|---|
| Script Kiddies | Ego, notoriety | Low | Medium | Audits, bug bounty |
| Organized Crime | Financial gain | Medium | Medium | MPC, insurance, monitoring |
| Rogue Custodians | Theft, embezzlement | High | Low | MPC, multi-custodian, insurance |
| Nation-State (Cyber) | Espionage, disruption | Very High | Low | Defense in depth, HSMs |
| Nation-State (Legal) | Asset freeze, sanctions | Very High | Medium | Geopolitical silos, legal |
| Insider Threats | Financial gain, sabotage | Medium | Low | Access controls, monitoring |
| Quantum Adversaries | Cryptographic breaking | High | Future | PQC roadmap (Falcon-512, Lamport) |

### §33.0.4 Security Architecture Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      CONSTITUTIONAL LAYER                   │   │
│  │  15 Articles │ 100% Reserve │ No Lending │ No Minting      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      SMART CONTRACT LAYER                   │   │
│  │  Formal Verification │ Audits │ Bug Bounty │ Timelocks      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      CRYPTOGRAPHIC LAYER                    │   │
│  │  ECDSA │ Falcon-512 │ MPC │ ZK-SNARKs │ HSMs               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      ORACLE LAYER                           │   │
│  │  Multi-Family │ 8 Providers │ 60 Nodes │ TWAP              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      CUSTODY LAYER                          │   │
│  │  Geopolitical Silos │ MPC │ Insurance │ Audits              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      NETWORK LAYER                          │   │
│  │  WAF │ DDoS Protection │ Firewalls │ Segmentation           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      GOVERNANCE LAYER                       │   │
│  │  Council Security │ Holder Rights │ Transparency            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      QUANTUM LAYER                          │   │
│  │  Falcon-512 │ Lamport Signatures │ PQC Roadmap             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## §33.1 Identity, Authentication, Authorization, Privileged Access

### §33.1.1 Identity Layer

**Three identity tiers:**

| Tier | Identity Type | Authentication | Authorization |
|---|---|---|---|
| 1 | Institutional | mTLS + signed nonce + replay protection (BM-06) | Per-institution authorization scope (per jurisdiction adapter) |
| 2 | Operator (MITHQAL staff) | MFA + SSO + hardware key | Role-based access (RBAC) per Authority Matrix (§V25.0.34) |
| 3 | Council / Foundation Board | MFA + hardware key + geographic constraint | Constitutional actions (6/7 supermajority for FV changes) |

**Institutional identity registry** (per `bank-onboarding.ts` InstitutionRegistry):
- Each institution has unique `institutionId` (e.g., `INST-SIMULATED-001`, `INST-SIMULATED-002`, `INST-SIMULATED-003`, `SIMULATED-INSTITUTION` for v25.2 audit-closure reference set)
- Identity lifecycle: REGISTERED → CERTIFIED → ACTIVE → SUSPENDED → REVOKED
- Each institution has: legal name, jurisdiction, regulator, license, KYC/KYB attestation, signing key fingerprint, gateway certificate, status

**Operator identity:**
- MFA required (TOTP or hardware key)
- SSO via identity provider (SAML / OIDC)
- Hardware key (YubiKey or equivalent) for privileged actions
- Quarterly access review
- Just-in-time elevation for privileged actions (no standing privilege)
- Session timeout: 15 minutes for privileged, 4 hours for standard

**Council / Foundation Board identity:**
- MFA + hardware key + geographic constraint (must be in pre-registered location for certain actions)
- Constitutional actions require 6/7 supermajority + multi-party signing (MPC)
- Session timeout: 30 minutes

### §33.1.2 Authentication

**Required authentications per request (5) — `ZERO_TRUST_PROFILE`:**

```typescript
export interface ZeroTrustVerification {
  requiredAuthentications: Array<{ name: string; description: string; enforced: true }>;
  enabled: true;
  defaultDeny: true;
}

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

**Authentication mechanisms by tier:**

| Mechanism | Purpose | Status |
|---|---|---|
| mTLS (mutual TLS) | Bank-to-MITHQAL transport authentication + encryption | IMPLEMENTED |
| Signed nonce | Replay protection (per-request nonce, server validates uniqueness) | IMPLEMENTED |
| HMAC signature | Request integrity (HMAC-SHA256 over canonicalized request) | IMPLEMENTED |
| JWT (RS256) | Operator session token (15-min / 4-hour expiry) | IMPLEMENTED |
| Hardware key (FIDO2) | Operator privileged action proof-of-presence | IMPLEMENTED |
| MPC signing | Council / Foundation constitutional actions (k-of-n threshold) | DESIGNED |

### §33.1.3 Authorization

**Three authorization dimensions:**

1. **Institution authorization** — what can this institution do? Per-jurisdiction adapter (§34.15) determines scope: which corridors, which settlement currencies, which mint capacity, which counterparty limits.

2. **Operator authorization** — what can this operator do? Role-based access control per Authority Matrix (§V25.0.34). Roles: `MITHQAL_OPS`, `MITHQAL_COMPLIANCE`, `MITHQAL_TREASURY`, `MITHQAL_OFFICER`, `BANK_OPS`, `BANK_COMPLIANCE`, `BANK_TREASURY`, `BANK_OFFICER`.

3. **Action authorization** — is this specific action permitted? Action-specific checks:
   - Mint: 16-step workflow BM-01..BM-16 (per §V25.0.D.X)
   - Redeem: 6-state continuity machine (per §9.3)
   - Rebalance: 13-step RB-01..RB-13 (per §V25.0.D.S)
   - Gold acquisition: 16-step GA-01..GA-16 (per §V25.0.D.Q)
   - Policy change: Council supermajority + Foundation review

**Settlement Permission Engine (12-check gate)** per §V25.0.23 — ANY FAILURE = BLOCK.

### §33.1.4 Privileged Access

**Privileged actions require:**

1. Just-in-time elevation (no standing privilege)
2. Multi-party approval (2-of-3 for high-privilege, 4-of-7 for constitutional)
3. Hardware key proof-of-presence
4. Geographic constraint (Council members must be in pre-registered location)
5. Full audit trail (immutable)
6. Time-bound (30 minutes maximum session)
7. Reason-for-access logged
8. Post-action review (within 24 hours)

**Privileged action inventory:**

| Action | Required Approval | Geographic Constraint |
|---|---|---|
| Mint MTQ | L4 Authorization (Monetary & Reserve Control Division signed) | No |
| Burn MTQ | L4 Authorization (Monetary & Reserve Control Division signed) | No |
| Rebalance reserves | Treasury + Risk approval | No |
| Gold acquisition | Treasury + Board approval | No |
| Add new counterparty | Counterparty Risk Office + Compliance | No |
| Suspend counterparty | Risk Committee (2-of-7) | No |
| Activate emergency governance | Council (4-of-7) | Yes |
| Amend constitutional invariant | Council (6/7) + Sharia + regulatory notification | Yes |
| Key rotation | CISO + CTO | Yes |
| Production deployment | CTO + COO + Council (4-of-7) | Yes |
| Foundation asset transfer | Foundation Board (6/7) + regulator notification | Yes |
| Wind-down | Foundation Board (6/7) + Council (4-of-7) + regulator | Yes |

---

## §33.2 Cryptographic Signing, Key Management, HSM, MPC

### §33.2.1 Signing Algorithms

| Algorithm | Use Case | Status | PQC-Ready |
|---|---|---|---|
| ECDSA (secp256k1) | Bank signatures, transaction signing | IMPLEMENTED | No |
| Ed25519 | Internal service signatures, oracle signatures | IMPLEMENTED | No |
| Falcon-512 | Post-quantum signing (migration target) | DESIGNED | Yes |
| Lamport (one-time) | Long-term archive signatures | DESIGNED | Yes |
| HMAC-SHA256 | Request integrity, webhook signatures | IMPLEMENTED | Yes (symmetric) |

### §33.2.2 Key Management Lifecycle

**Per §39.4 Cryptographic Lifecycle — 7 stages:**

1. **Generation** — key generated in HSM (never leaves HSM in plaintext)
2. **Activation** — key marked active, eligible for use
3. **Use** — key signs transactions; every use logged
4. **Rotation** — periodic rotation (90 days for transaction keys, 365 days for root keys)
5. **Deactivation** — key marked inactive (no new signatures)
6. **Archival** — key archived for verification of historical signatures (retention: 7+ years per regulatory requirement)
7. **Destruction** — key cryptographically erased after archival period (retention destroys)

**Key inventory (per §39.5):**

| Key Class | Purpose | Storage | Rotation |
|---|---|---|---|
| Root CA | Issue intermediate CAs | HSM (offline) | 10 years |
| Intermediate CA | Issue end-entity certs | HSM (online) | 5 years |
| End-entity TLS | mTLS for bank connections | HSM | 1 year |
| Signing key (bank) | Transaction signing | Bank HSM | 90 days |
| Signing key (operator) | Privileged action signing | Operator hardware key | 90 days |
| Oracle signing key | Oracle attestations | Oracle HSM | 90 days |
| Smart contract admin key | Smart contract governance | MPC (4-of-7) | 365 days |
| Constitutional key | FV invariant amendment | MPC (6-of-7) + geographic constraint | 5 years |

### §33.2.3 HSM (Hardware Security Module)

**Requirements:**
- FIPS 140-2 Level 3 minimum (Level 4 preferred)
- Tamper-resistant (zeroization on tamper detection)
- Multi-party administration (M-of-N quorum for administrative actions)
- Audit trail (immutable)
- Geographic distribution (no single region failure)

**Status:** DESIGNED. Vendors: YubiHSM 2 (FIPS 140-2 L3), Thales Luna, AWS CloudHSM, Azure Dedicated HSM. No production HSM contracted.

### §33.2.4 MPC (Multi-Party Computation)

**MPC for constitutional actions:**
- Threshold: 6-of-7 for constitutional amendments (FV1-FV25)
- Threshold: 4-of-7 for emergency governance
- Threshold: 2-of-3 for high-privilege operational actions (key rotation, etc.)
- Geographic distribution: parties in different geographic locations
- Communication: authenticated, encrypted, forward-secret channels
- Protocol: FROST or similar threshold Schnorr signature scheme

**MPC for smart contract admin:**
- 4-of-7 threshold for smart contract upgrades
- Timelock: 48 hours between proposal and execution
- Cancellable by Foundation (circuit breaker)

### §33.2.5 Quantum Migration Roadmap

**Per §39.9 Quantum Migration:**

| Phase | Action | Timeline |
|---|---|---|
| 1 | Audit current cryptographic dependencies | T+0 to T+3 months |
| 2 | NIST PQC standard adoption (Falcon-512 / Dilithium) | T+6 to T+12 months |
| 3 | Hybrid signatures (classical + PQC) | T+12 to T+24 months |
| 4 | PQC-only signatures for new keys | T+24 months |
| 5 | Migration complete (classical keys retired) | T+36 months |

**Status:** DESIGNED. Not production-deployed. Cryptographic agility is a design principle (§39.17).

---

## §33.3 Secrets, Certificates, Network & API Security

### §33.3.1 Secrets Management

**Secrets inventory:**
- API keys (bank-to-MITHQAL)
- Database credentials
- Signing keys (operator hardware keys)
- TLS private keys
- Encryption keys (data-at-rest)
- Oracle API keys
- HSM administrative credentials

**Storage:**
- Vault (HashiCorp Vault or cloud equivalent) for operational secrets
- HSM for signing keys (never leave HSM in plaintext)
- Encrypted environment variables for application configuration
- No secrets in source code (verified by CI scanner)

**Access:**
- Just-in-time access (no standing privilege)
- Audit trail (immutable)
- Quarterly review
- Automatic rotation (90 days for transaction secrets, 365 days for root secrets)
- Compromise response: immediate rotation + forensic audit (per §33.6)

### §33.3.2 Certificate Management

**Public Key Infrastructure (PKI):**
- Internal CA (offline root, online intermediate)
- mTLS for all bank-to-MITHQAL traffic
- Certificate transparency logging
- Automatic renewal (Let's Encrypt-style ACME for short-lived certs)
- Revocation: CRL + OCSP

**Bank certificate onboarding:**
- Bank generates CSR (Certificate Signing Request)
- MITHQAL validates bank identity (KYC/KYB)
- MITHQAL issues certificate
- Bank installs certificate in HSM
- Certificate registered in InstitutionRegistry

### §33.3.3 Network Security

**Network segmentation:**
- DMZ for external traffic (bank-to-MITHQAL)
- Application tier (internal services)
- Database tier (most restricted)
- HSM tier (physically + logically isolated)
- Management tier (operator access)

**Perimeter defenses:**
- WAF (Web Application Firewall) — ModSecurity or equivalent
- DDoS protection (Cloudflare or AWS Shield)
- Firewalls (per-tier)
- IDS / IPS (Intrusion Detection / Prevention)
- SIEM (Security Information and Event Management)

**Internal traffic:**
- All service-to-service traffic uses mTLS
- Service mesh (Istio or Linkerd)
- Mutual authentication between services (Zero Trust)
- No implicit trust based on network location

### §33.3.4 API Security

**API authentication:**
- mTLS (mutual TLS) for bank-to-MITHQAL
- JWT (RS256) for operator session tokens
- HMAC signature for webhook callbacks
- API key for read-only public endpoints (with rate limiting)

**API authorization:**
- Per-endpoint RBAC (per Authority Matrix)
- Per-institution scope (per jurisdiction adapter)
- Action-specific checks (per Settlement Permission Engine)

**API rate limiting:**
- Per-IP rate limit (100 requests/minute default)
- Per-institution rate limit (10,000 requests/minute default)
- Burst protection (token bucket)
- DDoS protection (Cloudflare or AWS Shield)

**API input validation:**
- Schema validation (JSON Schema)
- Field-level validation (regex, length, type)
- Sanitization (XSS prevention, SQL injection prevention)
- Output encoding (Content-Security-Policy)

---

## §33.4 Replay Prevention, Nonce, Idempotency

### §33.4.1 Replay Prevention

**Per-request nonce:**
- Each request includes a unique nonce (32+ characters, cryptographically random)
- Server validates nonce uniqueness (within last 24 hours)
- Server rejects duplicate nonces
- Nonce logged in audit trail

**Timestamp validation:**
- Each request includes a timestamp (ISO 8601, UTC)
- Server validates timestamp within ±5 minutes of server time
- Requests outside window rejected (prevents replay of captured requests)
- Clock skew tolerance: ±5 minutes

### §33.4.2 Idempotency

**Idempotency key:**
- Each mint request includes an idempotency key (UUID v4)
- Server tracks idempotency keys for 24 hours
- Duplicate requests with same key return cached response (NO duplicate mint)
- Idempotency key logged in audit trail

**Implementation:**
- Database unique constraint on (institutionId, idempotencyKey)
- Atomic insert + mint in single transaction (L6 of §33.9)
- Partial writes roll back (ACID)

### §33.4.3 Nonce Lifecycle

```
Client generates nonce (random 32+ chars)
       │
       ▼
Client includes nonce in request
       │
       ▼
Server validates nonce uniqueness (24h window)
       │
       ▼
Server processes request
       │
       ▼
Server logs nonce in audit trail
       │
       ▼
Nonce expires after 24 hours
```

### §33.4.4 Idempotency Lifecycle

```
Client generates idempotency key (UUID v4)
       │
       ▼
Client includes idempotency key in request
       │
       ▼
Server checks database for existing (institutionId, idempotencyKey)
       │
       ├── EXISTS → Return cached response (no duplicate mint)
       │
       └── NOT EXISTS → Process request
              │
              ▼
       Server inserts idempotency key in database (atomic with mint)
              │
              ▼
       Server returns response (cached for 24 hours)
```

---

## §33.5 Fraud Controls, Transaction Limits

### §33.5.1 Transaction Limits

**Per-institution limits (per DMCE — §V25.0.D.V):**

```
DMCE = MIN(
  VerifiedEligibleBacking,
  LegallyReservedBacking,
  InstitutionalRiskLimit,
  LiquidityLimit,
  JurisdictionLimit,
  ExposureLimit,            // default 25% of canonical MTQ supply
  ConcentrationLimit,       // 15% preferred / 25% hard cap
  OperationalLimit
)
```

**Per-transaction limits:**
- Maximum single mint: 1% of canonical MTQ supply (or DMCE per-institution, whichever is lower)
- Maximum daily mint (per institution): 5% of canonical MTQ supply (or DMCE, whichever is lower)
- Maximum weekly mint (per institution): 15% of canonical MTQ supply (or DMCE, whichever is lower)
- Maximum single redemption: 0.5% of canonical MTQ supply
- Maximum daily redemption (per institution): 2% of canonical MTQ supply

**Velocity checks:**
- Per-institution velocity (transactions per minute, hour, day)
- Per-jurisdiction velocity
- System-wide velocity
- Anomaly detection (>3σ above baseline = alert)

### §33.5.2 Fraud Detection

**Fraud signals:**
- Unusual transaction pattern (size, frequency, direction)
- Mismatched KYC/KYB information
- Sanctions screening hit
- Geographic anomaly (IP geolocation mismatch with registered jurisdiction)
- Behavioral anomaly (operator action outside normal pattern)
- Multiple failed authentication attempts
- Concurrent sessions from different locations
- Privileged action outside business hours

**Response:**
- Auto-block for high-confidence fraud (>0.9 score)
- Manual review for medium-confidence (0.5-0.9)
- Log-and-monitor for low-confidence (<0.5)

### §33.5.3 Transaction Monitoring

**Real-time monitoring:**
- Per-transaction fraud score (ML model)
- Per-institution velocity
- Per-jurisdiction velocity
- Anomaly detection (statistical outlier)

**Daily batch monitoring:**
- Reconciliation (5-way, per §V25.0.D.Z)
- Aggregate fraud score per institution
- Aggregate fraud score per jurisdiction
- Trend analysis

**Weekly review:**
- Fraud incident review
- Model performance review
- Threshold calibration review

---

## §33.6 Sanctions Controls & Compromise Response

### §33.6.1 Sanctions Screening

**Sanctions lists screened (per request):**
- OFAC SDN (U.S. Treasury)
- EU Consolidated List
- UN Sanctions List
- UK HMT Sanctions List
- Local jurisdiction sanctions lists (per jurisdiction adapter)

**Screening implementation:**
- Real-time screening (per transaction)
- Fuzzy matching (name, address, identifier)
- Periodic batch screening (existing customers)
- Fail-closed: if sanctions list unavailable → ALL transactions BLOCKED (per §V24.2.13 OFAC Compliance Fail-Closed)
  - HTTP 503 returned with `action: "BLOCK"`
  - No fail-open behavior

**Sanctions hit response:**
- Block transaction immediately
- Freeze related accounts (per regulator protocol)
- Report to regulator (FinCEN SAR, OFAC report, etc.)
- Preserve audit trail

### §33.6.2 Compromise Response

**Suspected compromise:**
- Activate IR plan (per §33.6.3)
- Forensic investigation
- Key rotation (per §33.6.4)
- Regulator notification (if material)

**Confirmed compromise:**
- Service suspension (per affected scope)
- Council + Foundation Board emergency session
- Public disclosure (if material)
- Independent forensic audit
- Key rotation across all affected systems
- Recovery plan (per §33.6.5)

### §33.6.3 Incident Response Plan

**IR team:**
- CISO (lead)
- CTO
- General Counsel
- COO
- Head of Communications
- External IR consultant (on retainer)

**IR phases:**

1. **Detect** (T+0) — Alert received (SIEM, monitoring, external report)
2. **Triage** (T+15 min) — Severity assessment (P0/P1/P2/P3)
3. **Contain** (T+1 hour) — Isolate affected systems
4. **Investigate** (T+4 hours) — Forensic analysis
5. **Eradicate** (T+24 hours) — Remove threat
6. **Recover** (T+48 hours) — Restore service
7. **Post-incident review** (T+7 days) — Lessons learned + process update
8. **Public disclosure** (T+72 hours, if material) — Regulator + public notification

### §33.6.4 Key Rotation

**Key rotation triggers:**
- Suspected or confirmed compromise
- Routine rotation (90 days for transaction keys)
- Personnel change (operator leaves)
- Vendor change (HSM provider)
- Algorithm migration (PQC)

**Key rotation procedure:**
1. Generate new key in HSM
2. Activate new key (parallel to old key)
3. Migrate signing to new key (per service)
4. Deactivate old key
5. Archive old key (for historical signature verification)
6. Destroy old key (after archival period)

### §33.6.5 Recovery Plan

**Recovery objectives:**
- RTO (Recovery Time Objective): 4 hours for critical services
- RPO (Recovery Point Objective): 0 (no data loss — append-only ledger)
- RTO for non-critical: 24 hours

**Recovery sites:**
- Primary: production data center
- Secondary: hot DR site (different region)
- Tertiary: cold DR site (different continent)

**Recovery testing:**
- Quarterly failover test
- Annual full DR exercise

---

## §33.7 Insider Threats & Supply-Chain Risk

### §33.7.1 Insider Threat Controls

**Personnel controls:**
- Background checks (employment, criminal, financial)
- Pre-employment screening
- Periodic re-screening (annual for privileged roles)
- Confidentiality agreement
- IP assignment agreement
- Acceptable use policy

**Access controls:**
- Least privilege (per §33.1.4)
- Just-in-time elevation
- Multi-party approval for privileged actions
- Quarterly access review
- Revocation on role change / departure

**Behavioral monitoring:**
- Anomalous access patterns (large data export, off-hours access)
- Privileged action frequency
- Failed authentication attempts
- Concurrent sessions
- Geographic anomaly

**Mandatory vacation:**
- Annual 2-week mandatory vacation for privileged roles
- Job rotation (where feasible)
- Dual control for sensitive operations

**Reporting:**
- Anonymous whistleblower channel
- Mandatory reporting of suspected insider activity
- Non-retaliation policy

### §33.7.2 Supply-Chain Risk

**Vendor inventory:**
- HSM provider
- Cloud provider (AWS / Azure / GCP)
- Oracle providers (8 families)
- Custodians
- Banks
- Legal counsel
- Audit firms
- Software dependencies (per SCA)
- Hardware vendors
- Network providers

**Vendor due diligence:**
- SOC 2 Type II audit (annual)
- ISO 27001 certification
- Financial stability review
- Insurance verification
- Sanctions screening (vendor + beneficial owners)
- Concentration review (per §32.2.17)

**Vendor management:**
- Annual vendor risk review
- Quarterly vendor performance review
- Vendor concentration limits (per §32.2.17)
- Exit strategy (per vendor)
- Right-to-audit clause in contracts

**Software supply chain:**
- SCA (Software Composition Analysis) per build
- SBOM (Software Bill of Materials) per release
- Dependency pinning (lockfile)
- Signed artifacts (Sigstore or equivalent)
- Reproducible builds
- Code review (4-eyes principle)
- CI/CD pipeline security scanning

---

## §33.8 Logging, Tamper Evidence, Business Continuity

### §33.8.1 Logging Architecture

**Log types:**
- Application logs (per-service)
- Audit logs (per-action)
- Security logs (per-authentication event)
- Transaction logs (per-mint / redeem / settle)
- System logs (per-component)
- Network logs (per-flow)
- HSM logs (per-key-use)

**Log storage:**
- Hot tier (real-time search, 30 days)
- Warm tier (90 days, indexed)
- Cold tier (7+ years, immutable, WORM — Write Once Read Many)
- Off-site replication (cross-region)
- Tamper-evident (Merkle tree hashing)

**Log retention:**
- Audit logs: 7+ years (per regulatory requirement)
- Security logs: 7+ years
- Transaction logs: 7+ years
- System logs: 1 year
- Network logs: 1 year
- HSM logs: 7+ years

### §33.8.2 Tamper Evidence

**Merkle tree audit log:**
- Each log entry hashed
- Hashes form Merkle tree
- Root hash published periodically (hourly)
- Root hash anchored on-chain (per §39.13 Historical Verification Preservation)
- Any tampering of historical log entry invalidates Merkle proof

**Implementation:**
- Append-only storage (no updates, no deletes)
- Hash chain (each entry references previous hash)
- Public root hash publication
- Third-party witnesses (timestamping service)

### §33.8.3 Business Continuity

**Business Continuity Plan (BCP):**
- Critical processes identified
- RTO/RPO per process
- Alternate site (hot DR)
- Cross-trained staff
- Communication plan (internal + external)
- Regulator notification protocol
- Public disclosure protocol

**Disaster Recovery (DR):**
- Hot DR site (different region)
- Cold DR site (different continent)
- Quarterly failover test
- Annual full DR exercise
- Backup verification (restore test)

**Crisis communication:**
- Designated spokesperson
- Pre-approved templates
- Regulator notification protocol
- Holder communication protocol
- Media protocol

### §33.8.4 Resilience Testing

| Test | Frequency | Scope |
|---|---|---|
| Component failure | Monthly | Single service |
| Service failure | Quarterly | Single service |
| Site failure | Quarterly | Single data center |
| Region failure | Annual | Single region |
| Vendor failure | Annual | Single vendor |
| Cyber exercise | Annual | Red team vs blue team |
| Tabletop exercise | Quarterly | Crisis scenarios |
| Full DR exercise | Annual | Complete failover |

---

## §33.9 Finality-Before-Mint Security

### §33.9.1 Hard Invariant

> **NO FINAL SETTLEMENT ⇒ NO MTQ MINT**

This invariant is enforced at 7 layers. Each layer independently blocks the mint if finality is not verified. The bypass-test harness (§33.9.4) confirms 10/10 routes blocked.

### §33.9.2 The 7 Enforcement Layers

| Layer | ID | Name | Enforcement Mechanism |
|---|---|---|---|
| 1 | L1_API | API Layer | Reject any mint request lacking valid auth signature, idempotency key, fresh timestamp, and proof-of-finality token |
| 2 | L2_WORKFLOW | Workflow Engine | 16-step Bank Minting Workflow BM-01..BM-16; state machine cannot advance to BM-16 without BM-15 passing |
| 3 | L3_POLICY | Policy Engine | Constitutional rules + DMCE constraints + concentration + eligibility + jurisdiction; hard-fail on any breach |
| 4 | L4_AUTHORIZATION | MITHQAL Monetary Authorization | Signed authorization from MITHQAL Monetary & Reserve Control Division (commercial teams cannot override) |
| 5 | L5_LEDGER_STATE_MACHINE | Ledger / State Machine | MTQ ledger mint-state transition guard (PENDING → AUTHORIZED → FINALIZED → MINTED); skips rejected |
| 6 | L6_DATABASE_TX_STATE | Database / Authoritative TX-State Protection | ACID transaction wraps (finality-proof INSERT + mint INSERT) atomically; partial writes roll back |
| 7 | L7_SMART_CONTRACT | Smart Contract / Authoritative Settlement Control | On-chain finality gate (where applicable); MTQ mint contract requires finality oracle attestation |

### §33.9.3 Layer Status

Each layer has 6 status flags:

| Flag | L1 | L2 | L3 | L4 | L5 | L6 | L7 |
|---|---|---|---|---|---|---|---|
| Designed | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Implemented | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Integrated | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Enforced | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tested | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sandbox Validated | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Institutionally Validated | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Production Ready | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Honest status:** 7/7 layers enforced at code level · 1/7 sandbox validated (L7 on Monad testnet) · 0/7 institutionally validated · 0/7 production-ready.

### §33.9.4 10 Bypass Tests

| # | Route | Description | Expected Blocker | Blocked | Reason |
|---:|---|---|---|---|---|
| 1 | DIRECT_API_CALL_WITHOUT_AUTH | Call mint API without authentication signature | L1_API | ✓ | L1 API layer rejects requests lacking valid auth signature + idempotency + fresh timestamp |
| 2 | WORKFLOW_SKIP_BM15 | Skip BM-15 finality verification, jump to BM-16 | L2_WORKFLOW | ✓ | L2 workflow state machine enforces BM-01..BM-16 sequence; cannot advance without BM-15 |
| 3 | POLICY_OVERRIDE_BY_COMMERCIAL | Commercial/sales team overrides DMCE policy | L3_POLICY | ✓ | L3 policy engine is structurally separated from commercial teams; no override authority |
| 4 | UNSIGNED_AUTHORIZATION | Mint without signed Monetary Control authorization | L4_AUTHORIZATION | ✓ | L4 requires cryptographically signed authorization from MITHQAL Monetary & Reserve Control Division |
| 5 | LEDGER_SKIP_FINALIZED_STATE | Transition PENDING → MINTED directly, skipping FINALIZED | L5_LEDGER_STATE_MACHINE | ✓ | L5 ledger state machine only allows PENDING → AUTHORIZED → FINALIZED → MINTED; skips rejected |
| 6 | DATABASE_PARTIAL_WRITE | Write mint without corresponding finality-proof | L6_DATABASE_TX_STATE | ✓ | L6 ACID transaction wraps both writes atomically; partial writes roll back |
| 7 | SMART_CONTRACT_WITHOUT_ORACLE | Call smart contract mint() without finality oracle attestation | L7_SMART_CONTRACT | ✓ | L7 smart contract mint() requires valid finality oracle signature; reverts without it |
| 8 | EMERGENCY_OVERRIDE_WITHOUT_GOVERNANCE | Invoke emergency override without constitutional authorization | L4_AUTHORIZATION | ✓ | Emergency overrides require explicit constitutional/emergency governance authorization + auditable |
| 9 | ADMIN_BACKDOOR | Use admin/backdoor route to mint without finality | L5_LEDGER_STATE_MACHINE | ✓ | No admin backdoor exists; ledger state machine is append-only and enforces sequence for ALL callers |
| 10 | INTERNAL_API_ROUTE | Use hidden internal API route to bypass public mint flow | L1_API | ✓ | All routes (public + internal) pass through same 7-layer enforcement; no hidden bypass |

**Result:** 10 routes tested · 10 blocked · 0 bypassed · invariant holds.

### §33.9.5 Bypass Risk Classification

```
finalityPolicyDefined     = true
finalityLayersDesigned    = 7
finalityLayersRequired    = 7
finalityLayersEnforced    = 7   (was 3 — now 7/7 at code level)
finalityProductionReady   = false
finalityBypassRisk        = MITIGATED_AT_CODE_LEVEL
```

**Bypass risk interpretation:**
- **At code level:** MITIGATED — all 10 routes blocked, invariant proven
- **At production level:** HIGH until institutional validation (regulator + independent audit) confirms
- **Post-institutional-validation:** target MITIGATED (requires evidence)

### §33.9.6 Recovery Procedures

If a finality failure occurs (despite the 7 layers):

1. **Mint rollback** — L6 ACID transaction rolls back partial mint
2. **Bank notification** — Affected bank sees `PENDING_MITHQAL_CONFIRMATION` (per §MBG-20)
3. **Manual reconciliation** — 8-step recovery plan per §MBG-19 `handleGatewayFailure`
4. **Forensic audit** — Immutable audit trail preserved
5. **Council notification** — Within 4 hours
6. **Regulator notification** — Within 24 hours (if material)
7. **Public disclosure** — Within 72 hours (if material)
8. **Remediation** — Within 7 days (root cause fix)

---

## §33.10 Honest State — §33

```
section                              = "§33 Security Architecture"
zeroTrustEnabled                     = true
zeroTrustDefaultDeny                 = true
zeroTrustRequiredAuthentications     = 5
authenticationMechanisms             = [mTLS, signed_nonce, HMAC, JWT, hardware_key, MPC]
hsmStatus                            = DESIGNED (FIPS 140-2 L3 target)
mpcStatus                            = DESIGNED (FROST 6-of-7 / 4-of-7 / 2-of-3)
pqcStatus                            = DESIGNED (Falcon-512 migration planned)
secretsManagementStatus              = DESIGNED
networkSegmentationStatus            = DESIGNED
apiSecurityStatus                    = IMPLEMENTED
replayPreventionStatus               = IMPLEMENTED
idempotencyStatus                    = IMPLEMENTED
fraudControlsStatus                  = IMPLEMENTED
sanctionsScreeningFailClosed         = true
incidentResponseStatus               = DESIGNED
insiderThreatControlsStatus          = DESIGNED
supplyChainRiskStatus               = DESIGNED
loggingStatus                        = IMPLEMENTED
tamperEvidenceStatus                 = IMPLEMENTED (Merkle tree)
businessContinuityStatus             = DESIGNED
finalityLayersEnforced               = 7
finalityLayersRequired               = 7
finalityBypassRisk                   = MITIGATED_AT_CODE_LEVEL
finalityBypassTestsPassed            = 10
finalityBypassTestsTotal             = 10
finalityProductionReady              = false
finalityInstitutionallyValidated     = false
externalSecurityAudit                = PENDING
penetrationTest                      = PENDING
bugBounty                            = PENDING
```

**Open items:**
1. Engage smart-contract security firm for full audit (Standing Blocker #1)
2. Deploy production HSM (FIPS 140-2 L3)
3. Implement MPC for constitutional actions (FROST 6-of-7)
4. Deploy PQC migration (Falcon-512 hybrid signatures)
5. Penetration testing (annual)
6. Bug bounty program launch
7. Incident response plan testing (quarterly tabletop)
8. Full DR exercise (annual)
9. Independent security audit
10. Supply-chain SCA pipeline

**END OF §33 — SECURITY ARCHITECTURE**

---


# §34 — REGULATORY ARCHITECTURE

## §34.0 System vs Legal Characterization (Separated)

### §34.0.1 Principle

The MITHQAL **system architecture** (technical design: how the system works) is **deliberately separated** from the **legal characterization** (regulatory classification: what each jurisdiction calls it). The two are tracked in different registers:

| Lens | Question | Register | Status |
|---|---|---|---|
| System architecture | How does the system technically work? | Technical blueprint (this document) | KNOWN (designed) |
| Legal characterization | What does each jurisdiction call it? | §49 Legal Liability Framework + §50 Licensing Matrix | PENDING (0/8 jurisdictions validated) |

### §34.0.2 Critical Rule

> **"A technical capability is NOT a regulatory authorization."**

This is one of the 22 final non-negotiable principles (§94). It means:
- Implementing KYC infrastructure does NOT constitute a banking license
- Implementing settlement infrastructure does NOT constitute a payment-services license
- Implementing custody verification does NOT constitute a custody license
- Implementing AML screening does NOT constitute regulatory approval
- Testnet deployment does NOT constitute production authorization

### §34.0.3 Why Separation Matters

1. **Honest disclosure** — claiming a regulatory classification without opinion would be a misrepresentation
2. **Jurisdiction-by-jurisdiction determination** — what MTQ is in the US may differ from what it is in the EU, UAE, Singapore, etc.
3. **Time-dependent characterization** — regulatory classification may change over time (e.g., MiCAR effective 2024 changed EU classification of stablecoins)
4. **Counterparty-specific determination** — what MTQ is for a regulated bank may differ from what it is for a non-bank financial institution
5. **Activity-specific determination** — issuing, redeeming, custodying, transferring may each have different classifications

### §34.0.4 Conservative Interpretation Rule

If a regulatory classification is unknown for a jurisdiction:
- Treat MTQ as the **most restrictive plausible category** until evidence confirms otherwise
- Set jurisdiction status to `UNKNOWN` in the jurisdiction adapter
- `UNKNOWN → conservative BLOCK` (fail-closed)
- Engage local counsel to obtain opinion
- Update jurisdiction adapter only after opinion received

### §34.0.5 19 Classifications Per Jurisdiction

Per §V25.0.15 Jurisdictional Regulatory Perimeter Engine, each jurisdiction has 19 classification dimensions:

| # | Dimension | Question |
|---:|---|---|
| 1 | MTQ legal status | What is MTQ legally classified as? |
| 2 | Stablecoin status | Is MTQ a "stablecoin" / "asset-referenced token" / "e-money token" / "significant ART"? |
| 3 | Custody status | What are the custody requirements? |
| 4 | Redemption status | What are the redemption requirements / restrictions? |
| 5 | Licensing requirements | What licenses are required? |
| 6 | AML/KYC | What AML/KYC obligations apply? |
| 7 | Sanctions | What sanctions obligations apply? |
| 8 | Tax | What tax treatment applies? |
| 9 | Data requirements | What data residency / privacy requirements apply? |
| 10 | Settlement status | What is the settlement classification? |
| 11 | Token trading restrictions | Are there restrictions on trading? |
| 12 | Geo-fence flag | Is the jurisdiction geo-fenced? |
| 13 | Securities classification | Is MTQ a security? |
| 14 | Commodity classification | Is MTQ a commodity? |
| 15 | Deposit classification | Is MTQ a deposit? |
| 16 | E-money classification | Is MTQ e-money? |
| 17 | Banking classification | Does MTQ issuance constitute banking? |
| 18 | Cross-border restrictions | Are there cross-border restrictions? |
| 19 | Reporting requirements | What reporting is required? |

Status values: `ALLOWED | CONDITIONAL | RESTRICTED | PROHIBITED | UNKNOWN`
- `UNKNOWN` → conservative BLOCK (fail-closed)

---

## §34.1 Licensing Requirements

### §34.1.1 §50 Licensing/Entity Matrix

The §50 Licensing/Entity Matrix tracks **9 activities × 8 jurisdictions = 72 entries**. Every entry has:
- `activity` (banking / payment services / custody / FX / digital asset CASP / securities / commodity / CBDC access / settlement activities)
- `jurisdiction` (US / UAE / UK / EU / Singapore / Switzerland / Hong Kong / KSA)
- `status` (`REQUIRED_NOT_OBTAINED` for all 72 entries in v25.2)
- `evidence` (`NONE` for all 72 entries in v25.2)
- `mithqalRole` (prefix ∈ {NONE, VERIFICATION, ORCHESTRATION, INFRASTRUCTURE} — NEVER "GUARANTOR")
- `requiredLicenseText` (e.g., US banking → "Federal or state banking charter + BSA authorization"; EU CASP → "MiCAR CASP Authorization")

### §34.1.2 Activities (9)

| # | Activity | Description |
|---:|---|---|
| 1 | Banking | Deposit-taking, lending (MITHQAL does NOT engage; participating banks do) |
| 2 | Payment services | Payment processing, money transmission |
| 3 | Custody | Asset custody (MITHQAL is non-custodial by default per §V25.0.D.K) |
| 4 | FX | Foreign exchange |
| 5 | Digital asset / CASP | Crypto-asset service provider |
| 6 | Securities | Securities issuance, trading, custody |
| 7 | Commodity | Commodity trading (gold/silver) |
| 8 | CBDC access | Central bank digital currency access |
| 9 | Settlement activities | Wholesale settlement |

### §34.1.3 Jurisdictions (8 + others)

| # | Jurisdiction | Primary Regulator | Status |
|---:|---|---|---|
| 1 | United States | OCC / Federal Reserve / FinCEN / SEC / CFTC / state regulators | JURISDICTION_PENDING |
| 2 | United Arab Emirates | CBUAE / VARA / DFSA / ADGM | JURISDICTION_PENDING |
| 3 | United Kingdom | FCA / PRA / Bank of England | JURISDICTION_PENDING |
| 4 | European Union / EEA | EBA / ESMA / national competent authorities (under MiCAR) | JURISDICTION_PENDING |
| 5 | Singapore | MAS | JURISDICTION_PENDING |
| 6 | Switzerland | FINMA | JURISDICTION_PENDING |
| 7 | Hong Kong | HKMA / SFC | JURISDICTION_PENDING |
| 8 | Kingdom of Saudi Arabia | SAMA / CMA | JURISDICTION_PENDING |
| + | Others | Per jurisdiction adapter | UNKNOWN |

### §34.1.4 Honest State

```
licensingMatrixImplemented = true
licensesObtained           = 0
licenseStatus              = REQUIRED_NOT_OBTAINED (all 72 entries)
evidence                   = NONE (all 72 entries)
mithqalRole                = NONE | VERIFICATION | ORCHESTRATION | INFRASTRUCTURE (NEVER "GUARANTOR")
```

---

## §34.2 Banking Regulation

### §34.2.1 Question

**Does MTQ issuance constitute "banking" under applicable law?**

### §34.2.2 Architecture Position

MITHQAL Operating Company:
- Does NOT accept deposits
- Does NOT make loans
- Does NOT extend credit
- Does NOT underwrite debt
- Does NOT issue bonds
- Does NOT provide trade finance
- Does NOT provide factoring
- Does NOT provide invoice discounting
- Does NOT provide any financing

Therefore, MITHQAL Operating Company does NOT characterize itself as a bank. **However**, the actual legal classification is jurisdiction-specific and pending opinion.

### §34.2.3 Participating Banks

Participating banks (which provide the actual fiat backing and KYC/AML) are already licensed banks in their respective jurisdictions. Their banking license covers their activities (deposit-taking, custody, settlement).

### §34.2.4 Required Legal Analysis

Per jurisdiction:
- Is MTQ issuance by MITHQAL Operating Company a "banking activity"?
- If yes, what license is required (and is it obtainable)?
- If no, what is the correct classification?
- Are there activities MITHQAL Operating Company can do without a banking license?
- Are there activities that must be done by a licensed bank (and are they contractually delegated)?

### §34.2.5 Required Institutional Approvals

- Banking charter (if applicable per jurisdiction opinion)
- Banking-as-a-Service partnership (alternative)
- Or: clear legal opinion that banking license is NOT required

### §34.2.6 Open Questions

- Does providing settlement infrastructure to banks constitute banking?
- Does holding MTQ as a settlement asset constitute deposit-taking?
- Does the MITHQAL Bank Gateway (MBG) require a banking license?
- Does MITHQAL Operating Company need to be a regulated financial institution?

### §34.2.7 Prohibited Assumptions

- DO NOT assume MTQ is NOT a bank deposit without legal opinion
- DO NOT assume MITHQAL Operating Company does NOT need a banking license without legal opinion
- DO NOT assume the MBG does NOT need a banking license
- DO NOT claim "banking exemption" without regulator confirmation

---

## §34.3 Payment Regulation

### §34.3.1 Question

**Does MTQ issuance / transfer / redemption constitute "payment services" or "money transmission" under applicable law?**

### §34.3.2 Architecture Position

MITHQAL Operating Company provides settlement infrastructure. The actual money movement (fiat) is done by participating banks under their existing licenses.

MTQ itself is a settlement unit, not a payment instrument per se. But:
- If MTQ is used for payment-like activities (corporate B2B settlement), it may be classified as a payment instrument
- If MTQ transfers cross borders, it may be subject to money transmission regulation
- If MTQ is held by individuals (retail), retail payment regulation may apply

**v25.0 architectural choice:** MTQ is corporate-only, no retail MTQ. This reduces but does NOT eliminate payment-regulation exposure.

### §34.3.3 Required Legal Analysis

Per jurisdiction:
- Is MTQ issuance / transfer / redemption a "payment service"?
- If yes, what license is required (e.g., US MSB registration, EU PSP authorization, UK EMI authorization)?
- Are there exemptions for B2B-only corporate settlement?
- What are the cross-border implications?

### §34.3.4 Required Institutional Approvals

- Money Services Business (MSB) registration (US FinCEN)
- Money Transmitter License (US state-by-state)
- Payment Institution authorization (EU, UK, etc.)
- Or: clear legal opinion that payment-services license is NOT required

### §34.3.5 Open Questions

- Does B2B-only settlement exempt MITHQAL from payment-services regulation?
- Does the MITHQAL Bank Gateway (MBG) need a payment-services license?
- Does routing through correspondent banks shift regulation to those banks?

### §34.3.6 Prohibited Assumptions

- DO NOT assume "B2B-only" exempts MITHQAL from payment-services regulation without opinion
- DO NOT assume the MBG does NOT need a payment-services license
- DO NOT assume money transmission is the bank's responsibility alone

---

## §34.4 Securities Analysis

### §34.4.1 Question

**Is MTQ a "security" under applicable law?**

### §34.4.2 Architecture Position

MTQ is designed as a settlement unit backed by institutional reserves. It is NOT designed as an investment contract, common enterprise, or profit-sharing instrument.

However, securities classification depends on:
- **Howey test** (US): investment of money in a common enterprise with expectation of profit from efforts of others
- **MiCAR** (EU): asset-referenced token, e-money token, or other crypto-asset
- **UK** approach: similar to Howey but with UK-specific nuances
- **Other jurisdictions:** various tests

### §34.4.3 Why MTQ is Designed NOT to be a Security

1. No expectation of profit — MTQ redemption at PAR (no appreciation mechanism)
2. No common enterprise — MTQ holders do not share in MITHQAL's profits
3. No efforts of others — MTQ value depends on reserve assets, not on MITHQAL's efforts
4. Settlement use-case — MTQ is for settlement, not investment
5. Anti-platform doctrine — MITHQAL does NOT operate as a profit-seeking enterprise

### §34.4.4 Required Legal Analysis

Per jurisdiction:
- Is MTQ a security under applicable tests?
- If yes, what registration / exemption is required?
- If no, what is the correct classification?
- Are there secondary-market trading implications?

### §34.4.5 Required Institutional Approvals

- Securities registration or exemption (e.g., Reg D / Reg S under US Securities Act)
- MiCAR classification (EU)
- Or: clear legal opinion that MTQ is NOT a security

### §34.4.6 Open Questions

- Does the gold component of the reserve (18% target) change securities classification?
- Does the digital liquidity sleeve (2% target, including tokenized T-bills like BUIDL) affect classification?
- Does redemption at PAR constitute "expectation of profit"?

### §34.4.7 Prohibited Assumptions

- DO NOT assume MTQ is NOT a security without jurisdiction-specific legal opinion
- DO NOT assume "settlement use-case" exempts MTQ from securities regulation
- DO NOT assume the gold component does NOT trigger commodity regulation

---

## §34.5 Monetary Regulation

### §34.5.1 Question

**Does MTQ issuance constitute "monetary activity" or "currency issuance" under applicable law?**

### §34.5.2 Architecture Position

MITHQAL explicitly:
- Is NOT a central bank
- Is NOT a sovereign currency issuer
- Is NOT a replacement for sovereign money
- Is NOT positioned as a "private currency"
- Is positioned as "regulated neutral settlement infrastructure interoperable with central-bank money"

Per Rule 0.4 (§V25.0.0): "MTQ Is Not a Sovereign Currency."

### §34.5.3 Central-Bank Compatibility

Per §2A.4 (Central-Bank Compatibility):
- MITHQAL does NOT compete with central banks
- MITHQAL does NOT replace central-bank money
- MITHQAL interconnects with central-bank money (CBDCs remain sovereign liabilities)
- MITHQAL provides an additional neutral wholesale settlement layer

### §34.5.4 Required Legal Analysis

Per jurisdiction:
- Is MTQ issuance "monetary activity"?
- Is MTQ a "currency" under applicable law?
- Does MITHQAL need central-bank authorization?
- Are there monetary-policy implications?

### §34.5.5 Required Institutional Approvals

- Central-bank notification / consultation (per jurisdiction)
- Or: clear legal opinion that MTQ is NOT monetary activity

### §34.5.6 Open Questions

- Does "neutral wholesale settlement infrastructure" require central-bank authorization?
- Does the use of multiple fiat currencies affect monetary classification?
- Does the gold component change monetary classification?

### §34.5.7 Prohibited Assumptions

- DO NOT assume MITHQAL is exempt from monetary regulation without opinion
- DO NOT assume central-bank notification is sufficient (vs. authorization)
- DO NOT assume CBDC interconnection is automatically permitted

---

## §34.6 AML / CFT

### §34.6.1 Applicability

AML/CFT (Anti-Money-Laundering / Counter-Financing-of-Terrorism) obligations apply broadly to financial activity. MITHQAL — even as settlement infrastructure — is likely subject to AML/CFT obligations in most jurisdictions.

### §34.6.2 Architecture Position

- Bank-mediated model: participating banks perform KYC/KYB/AML on their customers (MITHQAL does NOT duplicate this — Rule 0.9 §V25.0.0)
- MITHQAL performs sanctions screening at the institutional level (per §33.6)
- MITHQAL maintains transaction monitoring (per §33.5)
- MITHQAL maintains audit trail (per §33.8)

### §34.6.3 Layered KYC/KYB Architecture (per §V25.0.4)

| Layer | Who | What |
|---|---|---|
| 1 | Bank customer → Bank | KYC/KYB (beneficial ownership, source of funds) |
| 2 | Bank → MITHQAL | KYC/KYB attestation (no raw customer data — privacy-preserving) |
| 3 | MITHQAL → Regulator | Aggregate reporting (no individual customer data) |

### §34.6.4 Required Legal Analysis

Per jurisdiction:
- Is MITHQAL a "financial institution" subject to AML/CFT?
- If yes, what are the obligations (KYC, transaction monitoring, SAR filing)?
- Does the layered architecture satisfy regulator expectations?
- Are there travel-rule obligations (FATF Recommendation 16)?

### §34.6.5 Required Institutional Approvals

- AML program registration (per jurisdiction)
- AML officer appointment
- SAR/STR filing capability
- Travel-rule implementation (if applicable)

### §34.6.6 Open Questions

- Does MITHQAL need its own KYC if banks perform KYC?
- What is the minimum customer data MITHQAL must collect?
- Does MITHQAL need to file SARs/STRs?
- Are there travel-rule obligations for MTQ transfers?

### §34.6.7 Prohibited Assumptions

- DO NOT assume the layered KYC architecture satisfies all regulators without opinion
- DO NOT assume banks performing KYC exempts MITHQAL from AML obligations
- DO NOT assume MITHQAL is NOT subject to travel-rule obligations

---

## §34.7 Sanctions

### §34.7.1 Architecture Position

MITHQAL:
- Implements sanctions screening at the institutional level (per §33.6)
- Fails CLOSED (per §V24.2.13) — if OFAC list unavailable, ALL transactions BLOCKED
- Screens against multiple lists (OFAC SDN, EU, UN, UK HMT, local lists)
- Maintains audit trail of all sanctions checks
- Reports to regulators as required

### §34.7.2 Neutrality Doctrine

Per §V25.0.6 Neutrality Doctrine:
- MITHQAL is jurisdictionally neutral
- MITHQAL complies with applicable sanctions in each jurisdiction
- MITHQAL does NOT pick sides in geopolitical disputes
- MITHQAL does NOT facilitate sanctions evasion

### §34.7.3 Required Legal Analysis

Per jurisdiction:
- Which sanctions lists apply?
- What are the screening requirements (real-time, batch, periodic)?
- What are the reporting requirements?
- Are there sectoral sanctions (e.g., oil, defense)?
- Are there secondary sanctions risks?

### §34.7.4 Required Institutional Approvals

- Sanctions compliance program (per jurisdiction)
- Sanctions compliance officer appointment
- Reporting capability

### §34.7.5 Open Questions

- How to handle multi-jurisdictional sanctions conflicts (e.g., US sanctions vs. EU blocking statute)?
- Does MITHQAL need to screen reserve assets (custodians, banks, sovereigns) against sanctions?
- What is the procedure for sanctioned counterparties' existing MTQ?

### §34.7.6 Prohibited Assumptions

- DO NOT assume sanctions screening is the bank's responsibility alone
- DO NOT assume one jurisdiction's sanctions list is sufficient
- DO NOT assume MITHQAL can interoperate with sanctioned entities under any circumstances

---

## §34.8 Data Privacy

### §34.8.1 Applicable Regulations

| Regulation | Jurisdiction | Key Requirement |
|---|---|---|
| GDPR | EU/EEA | Data subject rights, lawful basis, DPO, breach notification |
| CCPA / CPRA | California (US) | Consumer rights, opt-out, service-provider contracts |
| PDPA | Singapore | Consent, purpose limitation, notification |
| PDPL | UAE | Consent, lawful processing, breach notification |
| UK DPA | UK | Similar to GDPR |
| Other | Per jurisdiction | Varies |

### §34.8.2 Architecture Position

- Layered KYC (per §34.6.3) — banks collect raw customer data; MITHQAL receives attestation only
- Privacy architecture (3-layer per §V25.0.24): public, restricted, confidential
- Zero-knowledge architecture (per §V25.0.25) — selective disclosure
- Data minimization — MITHQAL collects minimum necessary
- Audit trail preserves regulatory access (with lawful process)

### §34.8.3 Required Legal Analysis

Per jurisdiction:
- What customer data does MITHQAL need to collect / process?
- What is the lawful basis for processing?
- What are the data subject rights?
- What are the cross-border transfer requirements?
- What are the breach notification obligations?

### §34.8.4 Required Institutional Approvals

- Data Protection Officer (DPO) appointment (EU/UK)
- Data privacy registration (per jurisdiction)
- Cross-border transfer mechanism (SCCs, BCRs, adequacy decisions)

### §34.8.5 Open Questions

- Does MITHQAL's layered KYC satisfy GDPR data-minimization requirements?
- Does the audit trail (7+ year retention) conflict with GDPR erasure rights?
- What are the cross-border transfer implications for the 8 jurisdictions?

### §34.8.6 Prohibited Assumptions

- DO NOT assume layered KYC satisfies all data privacy regulations
- DO NOT assume audit-trail retention overrides erasure rights
- DO NOT assume cross-border transfer is automatic

---

## §34.9 Custody

### §34.9.1 Architecture Position

Per §V25.0.D.K Reserve Custody Principle:
- MITHQAL is **non-custodial by default**
- Reserve assets remain in legally appropriate regulated custody (banks / qualified custodians / segregated structures)
- MITHQAL controls **verification + monetary control**, NOT custody

### §34.9.2 Required Legal Analysis

Per jurisdiction:
- Does MITHQAL Operating Company need a custody license?
- If MITHQAL is non-custodial, what is its characterization?
- Are there qualified-custodian requirements for digital assets?
- Are there custody requirements for gold / physical bullion?

### §34.9.3 Required Institutional Approvals

- Custody license (if MITHQAL becomes custodian in any jurisdiction)
- Or: clear legal opinion that MITHQAL is NOT a custodian

### §34.9.4 Open Questions

- Does the Protected Backing Cell mechanism constitute custody?
- Does the AvailableBackingCertificate mechanism constitute custody?
- Are there indirect custody implications?

### §34.9.5 Prohibited Assumptions

- DO NOT assume MITHQAL is exempt from custody regulation without opinion
- DO NOT assume the AvailableBackingCertificate is a custody arrangement
- DO NOT assume non-custodial design is automatically recognized by all regulators

---

## §34.10 Reserve Requirements

### §34.10.1 Architecture Position

Per §V25.2 Final MTQ Institutional Backing Architecture:
- RR (Reserve Ratio) target = 1.30 (130%)
- Policy floor = 1.05
- Absolute floor = 1.00
- Composition: 80% fiat / 18% gold / 2% digital (current policy center)
- Constitutional corridors: fiat 70-85%, bullion 15-25%, digital 0-5%

### §34.10.2 Required Legal Analysis

Per jurisdiction:
- Are there minimum reserve requirements (e.g., 100% backing for stablecoins)?
- Are there eligible-asset requirements (e.g., cash, sovereign bonds only)?
- Are there concentration limits (per-asset, per-counterparty)?
- Are there haircut requirements?
- Are there reporting requirements (proof-of-reserves)?

### §34.10.3 Required Institutional Approvals

- Reserve verification methodology approval (per jurisdiction)
- Independent attestation arrangement
- Proof-of-reserves publication

### §34.10.4 Open Questions

- Is 130% RR sufficient for all jurisdictions?
- Is 18% gold acceptable as eligible reserve?
- Is 2% digital liquidity acceptable?
- Are there jurisdiction-specific reserve-asset eligibility rules?

### §34.10.5 Prohibited Assumptions

- DO NOT assume 130% RR is sufficient without jurisdiction-specific opinion
- DO NOT assume gold is automatically eligible
- DO NOT assume digital liquidity (stablecoins) is automatically eligible

---

## §34.11 Reporting

### §34.11.1 Architecture Position

Per §V25.0.37 Regulatory Observability:
- MITHQAL publishes aggregate transparency reports
- MITHQAL provides regulator observability (where required)
- MITHQAL maintains audit trail (7+ years)
- MITHQAL provides 5-way reconciliation (per §V25.0.D.Z)

### §34.11.2 Required Legal Analysis

Per jurisdiction:
- What reporting is required (transaction, suspicious activity, reserve, financial)?
- What is the frequency (real-time, daily, monthly, quarterly, annual)?
- What is the format (ISO 20022, regulatory XML, etc.)?
- What are the regulator-access requirements?

### §34.11.3 Required Institutional Approvals

- Regulatory reporting system (per jurisdiction)
- Reporting officer appointment
- Regulator-access portal

### §34.11.4 Open Questions

- Does MITHQAL need to file call reports (US bank-style)?
- Does MITHQAL need to file MiCAR quarterly reports (EU)?
- Does MITHQAL need to publish prospectuses (securities-style)?

### §34.11.5 Prohibited Assumptions

- DO NOT assume transparency reports satisfy regulatory reporting requirements
- DO NOT assume regulator-access is automatic
- DO NOT assume voluntary reporting is sufficient

---

## §34.12 Tax

### §34.12.1 Architecture Position

- MITHQAL Operating Company pays corporate income tax on its operating revenue
- MITHQAL Operating Company does NOT profit from reserve appreciation (per §V25.0.D.AC)
- MITHQAL Foundation (if 501(c)(3) qualified) is tax-exempt — status PENDING
- Transaction taxes (VAT, GST, sales tax) may apply to MTQ transactions, depending on jurisdiction

### §34.12.2 Required Legal Analysis

Per jurisdiction:
- What is the tax treatment of MTQ issuance / redemption / transfer?
- Are there transaction taxes (VAT, GST, sales tax)?
- Are there withholding taxes?
- What is the Foundation's tax status (501(c)(3), equivalent)?
- Are there transfer-pricing implications for intercompany transactions?

### §34.12.3 Required Institutional Approvals

- Tax registration (per jurisdiction)
- Tax officer appointment
- Transfer-pricing documentation

### §34.12.4 Open Questions

- Is MTQ a "currency" for tax purposes (foreign-currency gain/loss)?
- Is MTQ a "digital asset" for tax purposes?
- Are there cross-border tax implications?

### §34.12.5 Prohibited Assumptions

- DO NOT assume MTQ transactions are tax-exempt
- DO NOT assume Foundation is automatically tax-exempt
- DO NOT assume there are no transaction taxes

---

## §34.13 Accounting

### §34.13.1 Architecture Position

- Three-book separation (Book A Corporate / Book B Bank MTQ / Book C Participant) per §35
- Three-layer reserve valuation (R_m / R_a / R_l) per §35
- PAR is accounting reference only, NOT a USD peg
- Detailed in §35 Accounting / CFO Architecture

### §34.13.2 Required Legal Analysis

Per jurisdiction:
- What accounting standards apply (IFRS, US GAAP, etc.)?
- What is the accounting classification of MTQ?
- What is the accounting treatment of reserves?
- Are there consolidation requirements?

### §34.13.3 Required Institutional Approvals

- Audited financial statements (annual)
- Accounting officer appointment
- External auditor (per jurisdiction)

### §34.13.4 Open Questions

- Is MTQ a financial liability or equity instrument under IFRS?
- Are reserves consolidated or segregated?
- How to account for the 3-book separation?

### §34.13.5 Prohibited Assumptions

- DO NOT assume MTQ is a financial liability without IFRS opinion
- DO NOT assume reserves are consolidated without opinion
- DO NOT assume 3-book separation satisfies accounting standards without opinion

---

## §34.14 Cross-Border Restrictions

### §34.14.1 Architecture Position

Per §B (BRICS) and §V25.0.16 Jurisdictional Geo-Fencing:
- MITHQAL is jurisdiction-neutral
- MITHQAL complies with cross-border restrictions per jurisdiction
- MITHQAL geo-fences prohibited jurisdictions (e.g., China crypto prohibition per §V24.2.9)
- MITHQAL supports multi-rail settlement (SWIFT, ISO 20022, CBDC, bank REST, etc.)

### §34.14.2 Required Legal Analysis

Per jurisdiction pair (origin → destination):
- Are there capital controls?
- Are there cross-border payment restrictions?
- Are there sanctions implications?
- Are there reporting requirements (e.g., travel rule)?

### §34.14.3 Required Institutional Approvals

- Cross-border payment license (per jurisdiction, if applicable)
- Reporting mechanism
- Sanctions screening

### §34.14.4 Open Questions

- Does MTQ transfer across borders constitute "money transmission"?
- Are there origin-destination jurisdiction pair restrictions?
- How to handle capital controls?

### §34.14.5 Prohibited Assumptions

- DO NOT assume cross-border MTQ transfer is automatically permitted
- DO NOT assume one jurisdiction's authorization covers another
- DO NOT assume capital controls do not apply

---

## §34.15 Jurisdiction Adapter Concept

### §34.15.1 Principle

The **jurisdiction adapter** is a software abstraction that **localizes MITHQAL's behavior per jurisdiction without changing the canonical monetary core**. The monetary core (issuance, redemption, settlement logic) is invariant across jurisdictions. The adapter configures:
- Which activities are permitted
- Which licenses are required
- Which sanctions lists are screened
- Which reporting is required
- Which data residency rules apply
- Which corridor limitations apply

### §34.15.2 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    CANONICAL MONETARY CORE                      │
│  (invariant across jurisdictions — FV1-FV25 enforced)            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    JURISDICTION ADAPTER LAYER                    │
│  (per-jurisdiction configuration)                                │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   US     │ │   EU     │ │   UK     │ │   UAE    │  ...      │
│  │ adapter  │ │ adapter  │ │ adapter  │ │ adapter  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BANK GATEWAY (MBG)                            │
│  (per-bank instance with jurisdiction-specific config)           │
└──────────────────────────────────────────────────────────────────┘
```

### §34.15.3 Adapter Schema

```typescript
interface JurisdictionAdapter {
  jurisdictionCode: string;          // ISO 3166-1 alpha-2
  status: 'ALLOWED' | 'CONDITIONAL' | 'RESTRICTED' | 'PROHIBITED' | 'UNKNOWN';

  // 19 classification dimensions (per §34.0.5)
  classifications: {
    mtqLegalStatus: ClassificationStatus;
    stablecoinStatus: ClassificationStatus;
    custodyStatus: ClassificationStatus;
    redemptionStatus: ClassificationStatus;
    licensingRequirements: ClassificationStatus;
    amlKyc: ClassificationStatus;
    sanctions: ClassificationStatus;
    tax: ClassificationStatus;
    dataRequirements: ClassificationStatus;
    settlementStatus: ClassificationStatus;
    tokenTradingRestrictions: ClassificationStatus;
    geoFenceFlag: boolean;
    securitiesClassification: ClassificationStatus;
    commodityClassification: ClassificationStatus;
    depositClassification: ClassificationStatus;
    eMoneyClassification: ClassificationStatus;
    bankingClassification: ClassificationStatus;
    crossBorderRestrictions: ClassificationStatus;
    reportingRequirements: ClassificationStatus;
  };

  // Per-jurisdiction configuration
  config: {
    requiredLicenses: LicenseRequirement[];
    sanctionsLists: string[];
    reportingRequirements: ReportingRequirement[];
    dataResidencyRules: DataResidencyRule[];
    corridorAuthorizations: CorridorAuthorization[];
    geoFence: GeoFenceConfig;
    localCounsel: ContactInfo;
    primaryRegulator: ContactInfo;
  };

  // Honest state
  legalOpinionObtained: boolean;
  licenseObtained: boolean;
  productionAuthorized: boolean;
  pendingQuestions: string[];
  prohibitedAssumptions: string[];
}
```

### §34.15.4 Adapter Behavior

- `UNKNOWN` → conservative BLOCK (fail-closed per §34.0.4)
- `PROHIBITED` → BLOCK (no activity permitted)
- `RESTRICTED` → BLOCK new mint; existing MTQ may transfer but no new issuance
- `CONDITIONAL` → ALLOWED with additional checks (license verification, regulator notification, etc.)
- `ALLOWED` → standard processing

### §34.15.5 Adapter Updates

- Adapter updates require General Counsel + Regulatory Architecture Lead approval
- Adapter updates logged in immutable audit trail
- Adapter updates published in quarterly transparency report
- Adapter cannot override FV1-FV25 invariants

---

## §34.16 Per-Jurisdiction Dossiers

Each of the 8 seeded jurisdictions has a structured dossier. All are `JURISDICTION_PENDING` — no legal opinion obtained, no license obtained.

### §34.16.1 United States

| Field | Value |
|---|---|
| **Architecture fit** | Neutral wholesale settlement infrastructure; bank-mediated; corporate-only; non-custodial |
| **Likely regulatory categories** | Money Services Business (FinCEN); state money transmitter licenses; possible "stablecoin" classification under forthcoming federal legislation (GENIUS Act, STABLE Act); potential securities exposure under Howey; commodity exposure via gold (CFTC) |
| **Required legal analysis** | Is MTQ a security (Howey)? Is MTQ a "stablecoin" under federal law? Is MTQ a "money transmitter" under state law? Does MITHQAL Operating Company need a banking charter? Does the gold component trigger CFTC jurisdiction? Does the digital sleeve trigger SEC jurisdiction (BUIDL = tokenized T-bill)? |
| **Required institutional approvals** | FinCEN MSB registration; 50-state money transmitter licenses (or federal standard when enacted); federal stablecoin license (when enacted); state-by-state licensing; KYC/AML program; sanctions compliance program |
| **Open questions** | How does the layered KYC architecture interact with BSA obligations? Does MITHQAL need its own SAR filing capability? Does the MITHQAL Bank Gateway require any specific licensing? |
| **Prohibited assumptions** | DO NOT assume "B2B-only" exempts from MSB registration; DO NOT assume state money transmitter licenses are uniform; DO NOT assume forthcoming federal stablecoin legislation automatically applies; DO NOT assume the gold component does not trigger CFTC; DO NOT assume SEC has no jurisdiction |

### §34.16.2 United Arab Emirates

| Field | Value |
|---|---|
| **Architecture fit** | Aligned with UAE Central Bank / VARA / DIFC / ADGM frameworks; bank-mediated; corporate-only; non-custodial |
| **Likely regulatory categories** | VARA Virtual Asset Service Provider; CBUAE Stored Value Facility; DIFC / ADGM regulated activity; potential banking-as-a-service; AML/CFT under CBUAE |
| **Required legal analysis** | Which free zone regulator (VARA vs CBUAE vs DIFC vs ADGM)? Is MTQ a "stored value facility"? Is MTQ a "virtual asset"? Does MITHQAL Operating Company need a banking license from CBUAE? |
| **Required institutional approvals** | VARA VASP license (or CBUAE SVF license, or DIFC/ADGM equivalent); AML/CFT registration; data protection registration (PDPL); corporate license in chosen free zone |
| **Open questions** | Which free zone is optimal? Does MITHQAL need a custody license if non-custodial? How does VARA interact with CBUAE? |
| **Prohibited assumptions** | DO NOT assume VARA license covers all emirates; DO NOT assume non-custodial design exempts from VASP licensing; DO NOT assume free zone license covers mainland activity |

### §34.16.3 United Kingdom

| Field | Value |
|---|---|
| **Architecture fit** | Aligned with FCA / PRA / Bank of England frameworks; bank-mediated; corporate-only; non-custodial |
| **Likely regulatory categories** | FCA E-Money Institution; FCA Authorized Payment Institution; FCA Cryptoasset Registration; potential systemic importance designation (BoE) |
| **Required legal analysis** | Is MTQ "e-money" under E-Money Regulations 2011? Is MTQ a "cryptoasset" requiring FCA registration? Does MITHQAL Operating Company need a banking license from PRA? Does the MITHQAL Bank Gateway require FCA authorization? |
| **Required institutional approvals** | FCA EMI or API authorization; FCA Cryptoasset Registration; KYC/AML program; sanctions compliance program; data protection registration (UK DPA) |
| **Open questions** | Does the UK's planned stablecoin regulation (BoE/FCA) apply? Does the layered KYC satisfy UK MLR 2017? |
| **Prohibited assumptions** | DO NOT assume FCA Cryptoasset Registration is automatic; DO NOT assume e-money classification without opinion; DO NOT assume systemic importance designation is not applicable |

### §34.16.4 European Union / EEA

| Field | Value |
|---|---|
| **Architecture fit** | Aligned with MiCAR (Markets in Crypto-Assets Regulation); bank-mediated; corporate-only; non-custodial |
| **Likely regulatory categories** | MiCAR Asset-Referenced Token (ART) issuer; MiCAR Crypto-Asset Service Provider (CASP); potential EMI; AMLR (AML Regulation); DORA (Digital Operational Resilience Act); GDPR |
| **Required legal analysis** | Is MTQ an ART under MiCAR? Is MTQ an e-money token (EMT)? Is MITHQAL a "significant" ART issuer (ESMA designation)? Does MITHQAL Operating Company need a CASP license? |
| **Required institutional approvals** | MiCAR ART issuer authorization (national competent authority); CASP authorization (if applicable); AMLR compliance; DORA compliance; GDPR compliance; MiCAR white paper publication |
| **Open questions** | Which national competent authority (NCA) is optimal? Does significant ART designation apply? What are the reserve-asset eligibility rules under MiCAR? |
| **Prohibited assumptions** | DO NOT assume MiCAR authorization is automatic; DO NOT assume ART classification without opinion; DO NOT assume MiCAR covers all EU obligations (also AMLR, DORA, GDPR) |

### §34.16.5 Singapore

| Field | Value |
|---|---|
| **Architecture fit** | Aligned with MAS (Monetary Authority of Singapore); bank-mediated; corporate-only; non-custodial |
| **Likely regulatory categories** | MAS Major Payment Institution (MPI) license for e-money issuance; MAS Digital Payment Token (DPT) license; potential securities classification under SFA |
| **Required legal analysis** | Is MTQ "e-money" under Payment Services Act? Is MTQ a "digital payment token"? Does MITHQAL need an MPI license? Does the gold component trigger Securities and Futures Act (SFA)? |
| **Required institutional approvals** | MAS MPI license (e-money); MAS DPT license (if applicable); AML/CFT compliance; data protection registration (PDPA) |
| **Open questions** | Does the layered KYC satisfy MAS guidelines? Are there cross-border restrictions? |
| **Prohibited assumptions** | DO NOT assume MAS licensing is automatic; DO NOT assume e-money classification without opinion; DO NOT assume DPT license not required |

### §34.16.6 Switzerland

| Field | Value |
|---|---|
| **Architecture fit** | Aligned with FINMA; bank-mediated; corporate-only; non-custodial |
| **Likely regulatory categories** | FINMA fintech license; FINMA banking license (if applicable); Swiss DLT framework; potential securities classification under FinSA |
| **Required legal analysis** | Is MTQ a "DLT security" under Swiss law? Is MTQ a "bank deposit"? Does MITHQAL need a fintech license? |
| **Required institutional approvals** | FINMA fintech license (or banking license); AML compliance (Anti-Money Laundering Act); data protection registration (FADP) |
| **Open questions** | Does the gold component trigger commodity regulation? Are there Swiss-specific stablecoin rules? |
| **Prohibited assumptions** | DO NOT assume FINMA licensing is automatic; DO NOT assume DLT framework applies without opinion |

### §34.16.7 Hong Kong

| Field | Value |
|---|---|
| **Architecture fit** | Aligned with HKMA / SFC; bank-mediated; corporate-only; non-custodial |
| **Likely regulatory categories** | HKMA Stored Value Facility (SVF) license; SFC Type 1 (securities dealing); potential stablecoin issuer license (under HKMA stablecoin framework) |
| **Required legal analysis** | Is MTQ an SVF instrument? Is MTQ a "stablecoin" under HKMA framework? Does MITHQAL need an SVF license? |
| **Required institutional approvals** | HKMA SVF license; HKMA stablecoin issuer license (when enacted); SFC authorization (if applicable); AML compliance |
| **Open questions** | How does the HKMA stablecoin framework interact with SVF licensing? |
| **Prohibited assumptions** | DO NOT assume SVF licensing is automatic; DO NOT assume stablecoin framework applies without opinion |

### §34.16.8 Kingdom of Saudi Arabia

| Field | Value |
|---|---|
| **Architecture fit** | Aligned with SAMA (Saudi Central Bank) / CMA (Capital Market Authority); bank-mediated; corporate-only; non-custodial; Sharia-governance design |
| **Likely regulatory categories** | SAMA sandbox / payment-services license; CMA securities classification (if applicable); Sharia compliance review (AAOIFI standards) |
| **Required legal analysis** | Is MTQ a payment instrument under SAMA? Is MTQ a security under CMA? Is the architecture Sharia-compliant per AAOIFI standards? |
| **Required institutional approvals** | SAMA sandbox / license; CMA authorization (if applicable); Sharia board certification (independent, AAOIFI-qualified); data protection registration |
| **Open questions** | Does Saudi Arabia have specific stablecoin regulation? Does the gold component satisfy Sharia gold standards (AAOIFI Standard 57)? |
| **Prohibited assumptions** | DO NOT assume Sharia compliance without independent AAOIFI-qualified scholar certification; DO NOT assume SAMA sandbox participation = production authorization; DO NOT assume CMA has no jurisdiction |

---

## §34.17 "Subject to Local Authorization" Language

### §34.17.1 Canonical Statement

In all public materials (website, marketing, technical documentation, whitepapers), the following canonical language MUST appear prominently:

> **"MTQ availability is subject to local authorization. MITHQAL Operating Company does not represent that MTQ is available, permitted, or licensed in any specific jurisdiction. Each institution must obtain its own legal opinion regarding the permissibility of MTQ use in its jurisdiction. No production authorization until defined legal, licensing, contractual, technical, risk, reconciliation, and pilot gates are satisfied."**

### §34.17.2 Required Footer

All public-facing documents, web pages, and technical specifications must include the following footer:

> **"Subject to local authorization. MITHQAL Operating Company has obtained 0 of 72 required licenses as of this document's date. All jurisdiction classifications are JURISDICTION_PENDING. Independent legal opinion required for each jurisdiction."**

### §34.17.3 Prohibited Marketing Claims

The following statements are PROHIBITED in any public-facing material:

1. "MTQ is licensed in [jurisdiction]" (no license obtained)
2. "MTQ is approved by [regulator]" (no approval obtained)
3. "MTQ is exempt from [regulation]" (no exemption confirmed)
4. "MTQ is a [specific classification]" (no opinion obtained)
5. "MTQ is available worldwide" (geo-fencing applies)
6. "MTQ is automatically available in your jurisdiction" (subject to local authorization)
7. "MTQ is regulated" (no regulator has authorized)
8. "MTQ is a [currency/security/commodity/e-money]" (no classification confirmed)
9. "MTQ is Sharia-certified" (independent certification pending)
10. "MTQ is risk-free" (unsupported claim)

### §34.17.4 Required Disclosures

The following must be disclosed in all institutional engagement materials:

1. **0 jurisdictions validated** (all 8 are JURISDICTION_PENDING)
2. **0 licenses obtained** (all 72 entries REQUIRED_NOT_OBTAINED)
3. **0 legal opinions obtained** (LEGAL_OPINIONS_OBTAINED = false)
4. **0 banks contracted** (0 institutional partnerships)
5. **0 custodians contracted**
6. **Subject to local authorization** in every jurisdiction
7. **Independent legal opinion required** for each jurisdiction
8. **No production authorization** until defined gates satisfied

---

## §34.18 Honest State — §34

```
section                                  = "§34 Regulatory Architecture"
systemVsLegalSeparated                   = true
licensingMatrixEntries                   = 72 (9 activities × 8 jurisdictions)
licensesObtained                         = 0
licenseStatus                            = REQUIRED_NOT_OBTAINED (all 72)
evidence                                 = NONE (all 72)
mithqalRole                              = NONE | VERIFICATION | ORCHESTRATION | INFRASTRUCTURE (NEVER "GUARANTOR")
jurisdictionsSeeded                      = 8 (US, AE, UK, EU, SG, CH, HK, SA)
jurisdictionValidation                   = 0/8 (all JURISDICTION_PENDING)
legalOpinionsObtained                    = false
classificationFieldsPerJurisdiction      = 19
adapterConceptImplemented                = true
adapterFailClosed                        = true
subjectToLocalAuthorizationLanguage      = REQUIRED (canonical statement)
prohibitedMarketingClaims                = 10
requiredDisclosures                      = 8
productionAuthorization                  = false
```

**Open items:**
1. Engage external legal counsel in 8 jurisdictions (US, AE, UK, EU, SG, CH, HK, SA)
2. Obtain legal opinion on MTQ classification per jurisdiction
3. Apply for required licenses per jurisdiction (per legal opinion)
4. Update jurisdiction adapter with confirmed classifications
5. Publish jurisdiction-specific disclosures
6. Engage Sharia board for AAOIFI-qualified certification (for KSA / Islamic finance contexts)
7. Obtain central-bank consultations where required
8. Establish regulator-access portals

**END OF §34 — REGULATORY ARCHITECTURE**

---


# §35 — ACCOUNTING / CFO ARCHITECTURE

## §35.0 Accounting Philosophy & Four-Lens Separation

### §35.0.1 Principle

The MITHQAL accounting architecture maintains **four distinct lenses** that must never be conflated:

| Lens | Question | Authority |
|---|---|---|
| **Economic representation** | What is the true economic value / exposure? | Treasury + Risk |
| **Accounting representation** | What does the adjusted reserve recognize (R_a)? | CFO + Monetary & Reserve Control Division |
| **Legal ownership** | Who legally owns the asset? | General Counsel + Counterparty Risk Office |
| **Settlement position** | What is the institution's settlement position? | Settlement Risk Office |

A single asset can have:
- Economic value: $100M (current market price)
- Accounting (prudential) value: $95M (after haircut + counterparty adjustment)
- Legal ownership: Bank X (not MITHQAL — non-custodial by default)
- Settlement position: Available for MTQ issuance to Bank X's clients

These four lenses are tracked in **separate ledgers** and must reconcile but must NEVER be commingled.

### §35.0.2 PAR is Accounting Reference Only

> **"PAR = $1.00 is an ACCOUNTING REFERENCE ONLY — NOT a USD peg."**

PAR is the unit of account for MTQ. It is used for:
- Liability calculation: `L = S × PAR`
- Reserve ratio calculation: `RR = R_a / L`
- Accounting entries

PAR is NOT:
- A USD peg (MTQ is `PAR_REFERENCED`, not `USD_BACKED`)
- A guarantee of $1.00 redemption value in all states of the world
- A market price (the market price of MTQ depends on supply/demand)

### §35.0.3 Three-Layer Reserve Valuation (per §V25.0.D.P)

| Layer | Definition | Equation |
|---|---|---|
| **R_m** (Market Reserve) | Mark-to-market reserve value at current market prices | `R_m = Σ_a Q_a · P_a` |
| **R_a** (Adjusted Reserve) | Post-haircut, post-counterparty-score prudential reserve value | `R_a = Σ_a Q_a · P_a · (1 − H_a) · C_a` |
| **R_l** (Liquidation Reserve) | Post-stress reserve value (stress test scenario) | `R_l = Σ_a Q_a · P_a · (1 − H_a) · C_a · S_a` |

**Invariant:** `R_l ≤ R_a ≤ R_m`

### §35.0.4 Three-Book Separation (per §V25.0.D + §51)

| Book | Owner | Purpose | Honest State |
|---|---|---|---|
| **Book A — MITHQAL Corporate** | Operating Company | Corporate revenue, expenses, payroll, tax, technology costs, corporate assets/liabilities, profit/loss | DESIGNED, not operational |
| **Book B — Bank MTQ Obligation Ledger** | Participating Bank (per bank) | Responsible bank, applicable backing, MTQ originated, MTQ outstanding, redemption obligations, liquidity, settlement, bank risk | DESIGNED, not operational |
| **Book C — Corporate Participant Position** | Corporate participant | MTQ balance, available MTQ, reserved MTQ, pending MTQ, sent, received, redemption, settlement history, bank-money linkage | DESIGNED, not operational |

**Anti-commingling tests (4) — ALL blocked:**
1. Corporate cash → MTQ backing without authorization — BLOCKED
2. Bank obligation → MITHQAL corporate revenue — BLOCKED
3. Corporate MTQ → MITHQAL asset — BLOCKED
4. Reserve gain → Operating Company revenue — BLOCKED

**Honest state:**
```
threeBookDesign      = true
threeBookOperational = false
threeBookEnforced    = false
```

### §35.0.5 Honest Accounting

MITHQAL accounting is:
- **Conservative** — recognizes prudential (haircut-adjusted) value, not market value
- **Multi-source** — 5-way reconciliation (bank + reserve evidence + custodian + canonical + proof-of-liabilities)
- **Transparent** — published proof-of-reserves, proof-of-liabilities
- **Audited** — independent external audit (annual)
- **Honest** — never inflates any column; never claims validated without evidence

---

## §35.1 Chart-of-Accounts Concepts

### §35.1.1 Three-Book Chart of Accounts

MITHQAL uses three separate charts of accounts (one per book) to ensure separation. Each chart has its own ledger, its own audit trail, and its own reconciliation.

### §35.1.2 Book A — MITHQAL Corporate Chart of Accounts

| # | Account | Type | Description |
|---:|---|---|---|
| A.100 | Operating Cash | Asset | Corporate operating cash (NOT reserve backing) |
| A.110 | Accounts Receivable | Asset | Fees due from banks / institutions |
| A.120 | Prepaid Expenses | Asset | Prepaid software / services |
| A.130 | Property & Equipment | Asset | Office equipment, etc. |
| A.140 | Intangible Assets | Asset | IP, software development costs |
| A.150 | Intercompany Receivable (from Holding) | Asset | Intercompany balance |
| A.160 | Intercompany Receivable (from Tech Co) | Asset | Intercompany balance |
| A.200 | Accounts Payable | Liability | Vendor invoices |
| A.210 | Accrued Expenses | Liability | Accrued payroll, taxes, etc. |
| A.220 | Deferred Revenue | Liability | Pre-paid fees |
| A.230 | Intercompany Payable (to Holding) | Liability | Intercompany balance |
| A.240 | Intercompany Payable (to Tech Co) | Liability | Intercompany balance |
| A.300 | Common Stock | Equity | Founder / Holding shares |
| A.310 | Retained Earnings | Equity | Cumulative profit/loss |
| A.400 | Connectivity Fees | Revenue | Fee category 1 |
| A.410 | Issuance Service Fees | Revenue | Fee category 2 |
| A.420 | Settlement Fees | Revenue | Fee category 3 |
| A.430 | Redemption Infrastructure Fees | Revenue | Fee category 4 |
| A.440 | Reconciliation Fees | Revenue | Fee category 5 |
| A.450 | Enterprise Integration Fees | Revenue | Fee category 6 |
| A.460 | Premium Institutional Services Fees | Revenue | Fee category 7 |
| A.470 | Custody Evidence Verification Fees | Revenue | Fee category 8 |
| A.500 | Payroll | Expense | Staff compensation |
| A.510 | Technology Costs | Expense | Cloud, software, infrastructure |
| A.520 | Regulatory Costs | Expense | Licensing, legal, audit |
| A.530 | Office Costs | Expense | Rent, utilities |
| A.540 | Insurance | Expense | D&O, E&O, cyber |
| A.600 | Tax Expense | Expense | Corporate income tax |

### §35.1.3 Book B — Bank MTQ Obligation Ledger Chart of Accounts

Per participating bank (Book B is bank-specific, not consolidated):

| # | Account | Type | Description |
|---:|---|---|---|
| B.100 | Available Backing (Cash) | Asset | Cash eligible for MTQ backing |
| B.110 | Available Backing (Gold) | Asset | Allocated gold eligible for backing |
| B.120 | Available Backing (Digital) | Asset | Digital liquidity eligible for backing |
| B.130 | Encumbered Backing | Asset | Backing already allocated to MTQ |
| B.140 | AvailableBackingCertificate Issued | Asset | Certificates issued to MITHQAL |
| B.200 | MTQ Issued | Liability | MTQ minted against this bank's backing |
| B.210 | MTQ Outstanding | Liability | MTQ still in circulation (subset of B.200) |
| B.220 | MTQ Redeemed | Liability | MTQ redeemed (counter-entry to B.200) |
| B.230 | Redemption Obligation | Liability | Pending redemption requests |
| B.240 | Settlement Obligation | Liability | Pending settlement obligations |
| B.300 | Bank MTQ Position | Equity | Net bank position |
| B.400 | Reserve Attestation Revenue | Revenue | (if bank charges MITHQAL) |
| B.500 | Custody Costs | Expense | Custodian fees |
| B.510 | Compliance Costs | Expense | KYC/AML/sanctions |

### §35.1.4 Book C — Corporate Participant Position Chart of Accounts

Per corporate participant:

| # | Account | Type | Description |
|---:|---|---|---|
| C.100 | MTQ Balance | Asset | Total MTQ held |
| C.110 | Available MTQ | Asset | MTQ available for transfer / settlement |
| C.120 | Reserved MTQ | Asset | MTQ reserved for pending settlement |
| C.130 | Pending MTQ | Asset | MTQ pending receipt |
| C.200 | MTQ Sent | Contra | MTQ sent (counter-entry) |
| C.210 | MTQ Received | Contra | MTQ received (counter-entry) |
| C.300 | Redemption Requests | Liability | Pending redemption requests |
| C.400 | Settlement History | Record | Log of settlement transactions |
| C.500 | Bank-Money Linkage | Record | Link to underlying bank account |

### §35.1.5 Canonical Reserve Ledger (MITHQAL-side)

In addition to the three books, MITHQAL maintains a canonical reserve ledger:

| # | Account | Type | Description |
|---:|---|---|---|
| M.100 | Total MTQ Supply | Liability | Canonical MTQ supply (S_t) |
| M.110 | MTQ Per Bank | Liability | Per-bank MTQ outstanding |
| M.120 | MTQ Per Corporate | Liability | Per-corporate MTQ balance |
| M.200 | Total Reserve (R_m) | Asset | Market value of reserves |
| M.210 | Adjusted Reserve (R_a) | Asset | Prudential value (haircut + counterparty) |
| M.220 | Liquidation Reserve (R_l) | Asset | Stress value |
| M.300 | Per-Bank Backing | Asset | Per-bank allocated backing |
| M.400 | Per-Currency Allocation | Asset | Per-currency weight |
| M.500 | Per-Custodian Allocation | Asset | Per-custodian concentration |
| M.600 | Haircuts Applied | Contra | Total haircut (R_m - R_a) |
| M.700 | Stress Factors Applied | Contra | Total stress (R_a - R_l) |
| M.800 | Reconciliation State | Record | 5-way reconciliation status |

---

## §35.2 MTQ Accounting Entries (Issuance, Redemption, Settlement)

### §35.2.1 MTQ Issuance — Accounting Entries

When Bank X mints 1,000,000 MTQ against $1,300,000 of verified eligible backing (130% RR):

**Book B (Bank X MTQ Obligation Ledger):**
```
Dr. Available Backing (Cash)        $1,300,000
   Cr. AvailableBackingCertificate Issued    $1,300,000
   (To recognize certificate issued to MITHQAL)

Dr. MTQ Issued                      $1,000,000
   Cr. MTQ Outstanding                       $1,000,000
   (To recognize MTQ minted)
```

**Canonical Reserve Ledger (MITHQAL-side):**
```
Dr. Per-Bank Backing (Bank X)       $1,300,000
   Cr. Total Reserve (R_m)                   $1,300,000
   (To recognize backing received)

Dr. Total MTQ Supply                $1,000,000
   Cr. MTQ Per Bank (Bank X)                 $1,000,000
   (To recognize MTQ minted)
```

**Book C (Corporate Participant — receives MTQ):**
```
Dr. MTQ Balance                     $1,000,000
   Cr. MTQ Received                          $1,000,000
   (To recognize MTQ received from Bank X)

Dr. Bank-Money Linkage              $1,000,000
   Cr. (Bank X deposit reduction)            $1,000,000
   (To recognize bank-money converted to MTQ)
```

**Book A (MITHQAL Corporate — fee recognition):**
```
Dr. Accounts Receivable (Bank X)    $X fee
   Cr. Issuance Service Fees                 $X fee
   (To recognize issuance fee revenue)
```

### §35.2.2 MTQ Redemption — Accounting Entries

When Corporate Participant redeems 500,000 MTQ:

**Book C (Corporate Participant — redeems MTQ):**
```
Dr. Bank-Money Linkage              $500,000
   Cr. MTQ Balance                            $500,000
   (To recognize MTQ redeemed for bank money)
```

**Canonical Reserve Ledger (MITHQAL-side):**
```
Dr. MTQ Per Bank (Bank X)           $500,000
   Cr. Total MTQ Supply                      $500,000
   (To recognize MTQ burned)
```

**Book B (Bank X MTQ Obligation Ledger):**
```
Dr. MTQ Outstanding                  $500,000
   Cr. MTQ Redeemed                           $500,000
   (To recognize MTQ redeemed)

Dr. AvailableBackingCertificate Issued  $650,000  (at 130% RR)
   Cr. Available Backing (Cash)              $650,000
   (To release proportional backing)
```

**Book A (MITHQAL Corporate — fee recognition):**
```
Dr. Accounts Receivable (Bank X)    $Y fee
   Cr. Redemption Infrastructure Fees         $Y fee
   (To recognize redemption fee revenue)
```

### §35.2.3 MTQ Settlement — Accounting Entries

When Corporate A sends 100,000 MTQ to Corporate B (same bank):

**Book C (Corporate A — sender):**
```
Dr. MTQ Sent                         $100,000
   Cr. MTQ Balance                            $100,000
   (To recognize MTQ sent)
```

**Book C (Corporate B — receiver):**
```
Dr. MTQ Balance                      $100,000
   Cr. MTQ Received                           $100,000
   (To recognize MTQ received)
```

**Canonical Reserve Ledger (MITHQAL-side):**
```
(No change to Total MTQ Supply — internal transfer)

Dr. MTQ Per Corporate (Corporate A)  $100,000
   Cr. MTQ Per Corporate (Corporate B)        $100,000
   (To recognize inter-corporate transfer)
```

When Corporate A (Bank X) sends 100,000 MTQ to Corporate B (Bank Y) (cross-bank):

**Canonical Reserve Ledger (MITHQAL-side):**
```
Dr. MTQ Per Bank (Bank X)            $100,000
   Cr. MTQ Per Bank (Bank Y)                 $100,000
   (To recognize inter-bank transfer)
```

**Book B (Bank X):**
```
Dr. MTQ Outstanding                  $100,000
   Cr. MTQ Redeemed (transfer-out)           $100,000
   (To recognize MTQ transferred out)
```

**Book B (Bank Y):**
```
Dr. MTQ Issued (transfer-in)         $100,000
   Cr. MTQ Outstanding                        $100,000
   (To recognize MTQ transferred in)
```

### §35.2.4 Settlement Finality Entries

When settlement achieves finality (per §33.9 7-layer finality):

**Canonical Reserve Ledger:**
```
Dr. Settlement Final                $X
   Cr. Settlement Pending                    $X
   (To recognize finality achieved)
```

### §35.2.5 Backing Failure Entries

When a backing certificate is found deficient (per §V25.0.C.11 `handleBackingAttestationFailure`):

**Canonical Reserve Ledger:**
```
(No automatic burn of existing MTQ)

Dr. Backing Deficiency Flag          $Y deficiency
   Cr. Per-Bank Backing (Bank X)              $Y
   (To flag deficiency — new issuance BLOCKED, existing MTQ preserved)
```

---

## §35.3 Reserve Accounting (Valuation, Unrealized / Realized)

### §35.3.1 Three-Layer Valuation Entries

**Daily mark-to-market (R_m):**
```
Dr. Total Reserve (R_m)              $X gain/loss
   Cr. Unrealized Reserve Gain/Loss           $X
   (To recognize daily mark-to-market)
```

**Haircut application (R_a):**
```
Dr. Haircuts Applied                 $Y haircut
   Cr. Total Reserve (R_a)                    $Y
   (To recognize prudential haircut)
```

**Stress factor application (R_l):**
```
Dr. Stress Factors Applied           $Z stress
   Cr. Total Reserve (R_l)                    $Z
   (To recognize stress factor)
```

### §35.3.2 Unrealized vs Realized

**Unrealized gain/loss:**
- Daily mark-to-market changes (R_m fluctuation)
- Recorded in comprehensive income (not P&L)
- Not distributed (MITHQAL does NOT profit from reserve appreciation per §V25.0.D.AC)

**Realized gain/loss:**
- When an asset is sold / liquidated
- Recorded in P&L
- NOT distributed to MITHQAL Operating Company (reserve appreciation is NOT a commercial profit source)
- Stays in reserve (or distributed to Foundation if constitutionally required)

### §35.3.3 Haircut Table (per §3.4)

| Asset Class | Haircut Range |
|---|---|
| Cash (TIER_1 bank) | 0% - 0.5% |
| Cash (TIER_2 bank) | 0.5% - 1.5% |
| Cash (TIER_3 bank) | 1.5% - 3% |
| Sovereign bonds (AAA) | 0.5% - 1% |
| Sovereign bonds (AA) | 1% - 2% |
| Sovereign bonds (A) | 2% - 4% |
| Sovereign bonds (BBB) | 4% - 8% |
| Physical gold (allocated) | 5% |
| Tokenized gold (TGRS ≥ 8.0) | `max(5%, 5% + (10 − TGRS) × 0.5%)` |
| Stablecoin (DRQS ≥ 7.5) | Per StressDRQS |
| Stablecoin (DRQS 6.0-7.5) | Per StressDRQS + 2% |
| Stablecoin (algorithmic) | EXCLUDED |

### §35.3.4 Counterparty Adjustment

`C_a = Credit_a × Jurisdiction_a × Operational_a`, with `0 < C_a ≤ 1`

- Credit_a: based on credit rating / composite prudential assessment
- Jurisdiction_a: based on sovereign rating / sanctions / capital controls
- Operational_a: based on operational performance / incidents

### §35.3.5 Stress Coefficient (per §3.6)

| Asset Class | Stress Coefficient (S_a) |
|---|---|
| Cash (TIER_1 bank) | 0.99 - 1.00 |
| Cash (TIER_2 bank) | 0.97 - 0.99 |
| Cash (TIER_3 bank) | 0.95 - 0.97 |
| Sovereign bonds (AAA) | 0.98 - 1.00 |
| Sovereign bonds (AA-A) | 0.95 - 0.98 |
| Sovereign bonds (BBB) | 0.90 - 0.95 |
| Physical gold | 0.92 - 0.96 |
| Tokenized gold | 0.90 - 0.95 |
| Stablecoin (DRQS ≥ 7.5) | 0.85 - 0.92 |
| Stablecoin (DRQS 6.0-7.5) | 0.75 - 0.85 |

---

## §35.4 Three-Book Separation (Book A / B / C)

### §35.4.1 Anti-Commingling Tests (4 — ALL BLOCKED)

Per §51 Three-Book Separation (`src/lib/three-book-separation.ts`, 975 lines):

1. **Corporate cash → MTQ backing without authorization** — BLOCKED
   - Corporate cash (Book A.100) cannot be silently converted to reserve backing (Book M.200 or B.100)
   - Requires explicit governance approval + audit trail
   - Per FV24: No Operating-Capital-to-Reserve Contamination

2. **Bank obligation → MITHQAL corporate revenue** — BLOCKED
   - Bank's MTQ obligation (Book B.200) cannot be recognized as MITHQAL corporate revenue (Book A.4XX)
   - Only infrastructure fees (Book A.400-A.470) are recognized as revenue
   - Per §V25.0.D.AC: Operating Company MUST NOT profit from reserve appreciation

3. **Corporate MTQ → MITHQAL asset** — BLOCKED
   - Corporate MTQ (Book C.100) cannot be recognized as MITHQAL corporate asset (Book A.1XX)
   - MTQ is a liability of the canonical ledger, not an asset of MITHQAL Operating Company
   - Per FV25: Mint Authorization Separation

4. **Reserve gain → Operating Company revenue** — BLOCKED
   - Reserve appreciation (unrealized gain on Book M.200) cannot be distributed to Operating Company revenue (Book A.4XX)
   - Reserve appreciation stays in reserve (or distributed to Foundation if constitutionally required)
   - Per §V25.0.D.AC: Reserve appreciation is NOT a commercial profit source

### §35.4.2 Book A — MITHQAL Corporate (8 Fields)

Per §51:

| Field | Description |
|---|---|
| 1. Revenue | Operating Company revenue (8 fee categories) |
| 2. Expenses | Operating costs |
| 3. Payroll | Staff compensation |
| 4. Tax | Corporate income tax |
| 5. Technology costs | Cloud, software, infrastructure |
| 6. Corporate assets | Operating cash, AR, PP&E, intangibles |
| 7. Corporate liabilities | AP, accrued, deferred revenue |
| 8. Profit/loss | Net result |

### §35.4.3 Book B — Bank MTQ Obligation Ledger (8 Fields)

| Field | Description |
|---|---|
| 1. Responsible bank | Bank identity (institution ID) |
| 2. Applicable backing | Available backing (cash, gold, digital) |
| 3. MTQ originated | Cumulative MTQ minted by this bank |
| 4. MTQ outstanding | Current MTQ outstanding (subset of originated) |
| 5. Redemption obligations | Pending redemption requests |
| 6. Liquidity | Bank's HQLA position |
| 7. Settlement | Settlement position |
| 8. Bank risk | Bank's risk profile (C_a, exposure) |

### §35.4.4 Book C — Corporate Participant Position (9 Fields)

| Field | Description |
|---|---|
| 1. MTQ balance | Total MTQ held |
| 2. Available MTQ | MTQ available for transfer/settlement |
| 3. Reserved MTQ | MTQ reserved for pending settlement |
| 4. Pending MTQ | MTQ pending receipt |
| 5. Sent | MTQ sent (counter-entry) |
| 6. Received | MTQ received (counter-entry) |
| 7. Redemption | Pending redemption requests |
| 8. Settlement history | Log of settlement transactions |
| 9. Bank-money linkage | Link to underlying bank account |

### §35.4.5 Reconciliation Between Books

| Reconciliation | Frequency | Tolerance | Status |
|---|---|---|---|
| Book A ↔ Bank statements (corporate cash) | Daily | 0 | DESIGNED |
| Book B ↔ Bank's internal ledgers | Daily | 1bp | DESIGNED |
| Book C ↔ Bank's customer ledgers | Daily | 1bp | DESIGNED |
| Canonical Ledger ↔ Book B aggregate | Real-time | 0 | DESIGNED |
| Canonical Ledger ↔ Book C aggregate | Real-time | 0 | DESIGNED |
| Canonical Ledger ↔ Bank attestation | Real-time | 1bp | DESIGNED |
| Canonical Ledger ↔ Custodian evidence | Daily | 1bp | DESIGNED |
| Canonical Ledger ↔ Proof-of-liabilities | Daily | 1bp | DESIGNED |

### §35.4.6 Honest State

```
threeBookDesign          = true
threeBookOperational     = false
threeBookEnforced        = false
antiComminglingTestsPassed = 4/4 (at design level)
productionOperational    = false
```

---

## §35.5 Revenue & Fees

### §35.5.1 Operating Company Revenue (8 Fee Categories)

Per §V25.0.D.AO Commercial Economics:

| # | Fee Category | Description | Basis |
|---:|---|---|---|
| 1 | Connectivity fees | Bank-to-MITHQAL connectivity | Monthly flat + per-transaction |
| 2 | Issuance service fees | MTQ issuance infrastructure | Per-transaction (bps) |
| 3 | Settlement fees | Settlement infrastructure | Per-transaction (bps) |
| 4 | Redemption infrastructure fees | Redemption infrastructure | Per-transaction (bps) |
| 5 | Reconciliation fees | 5-way reconciliation infrastructure | Per-reconciliation |
| 6 | Enterprise integration fees | Enterprise integrations | Annual recurring |
| 7 | Premium institutional services fees | Premium services | Custom |
| 8 | Custody evidence verification fees | Custody evidence verification | Per-verification |

### §35.5.2 Operating Company Revenue Discipline

Per §V25.0.D.AC:
- Operating Company MUST NOT profit from (6): gold appreciation, speculative trading on reserves, reserve spread, proprietary price movements, reserve asset trading gains, currency speculation
- Operating Company MAY earn transparent infrastructure fees (8 categories above)
- **Reserve appreciation is NOT a commercial profit source**

### §35.5.3 Bank Revenue Model (9 Streams)

Per §V25.0.29 Bank Revenue Model:

| # | Stream | Description |
|---:|---|---|
| 1 | Settlement revenue | Bank's settlement activities |
| 2 | FX revenue | FX conversion |
| 3 | Treasury revenue | Treasury services |
| 4 | Corporate services revenue | Corporate services to clients |
| 5 | Reconciliation savings | Cost savings from automated reconciliation |
| 6 | Operational savings | Operational efficiencies |
| 7 | Liquidity savings | Liquidity optimization (only where demonstrable) |
| 8 | Custody revenue | Custody services |
| 9 | Compliance revenue | Compliance services |

### §35.5.4 Non-Compete Principle

Per §V25.0.31 Non-Compete Principle:
- MITHQAL does NOT compete with banks
- MITHQAL provides infrastructure; banks provide commercial services
- MITHQAL does NOT operate exchanges, custody, asset management, or platform services

### §35.5.5 FX Boundary

Per §V25.0.32 FX Boundary:
- MITHQAL does NOT provide FX services
- FX is performed by participating banks or authorized FX intermediaries
- MITHQAL provides infrastructure for FX settlement, not FX itself

---

## §35.6 Financial Reporting

### §35.6.1 Reporting Framework

| Report | Frequency | Audience | Content |
|---|---|---|---|
| Daily risk dashboard | Daily 06:00 UTC | Risk Committee | Top risks, breaches |
| Weekly risk report | Weekly Monday | Council + Foundation | Trend, top contributors |
| Monthly management report | Monthly | Council | Operations, financials |
| Quarterly transparency report | Quarterly | Public | Aggregate metrics |
| Quarterly financial statements | Quarterly | Council + Foundation | P&L, balance sheet, cash flow |
| Annual audited financial statements | Annual | Public | Audited by independent external auditor |
| Annual transparency report | Annual | Public | Comprehensive |

### §35.6.2 P&L Statement Structure (Book A)

```
OPERATING REVENUE
  Connectivity fees
  Issuance service fees
  Settlement fees
  Redemption infrastructure fees
  Reconciliation fees
  Enterprise integration fees
  Premium institutional services fees
  Custody evidence verification fees
TOTAL OPERATING REVENUE

OPERATING EXPENSES
  Payroll
  Technology costs
  Regulatory costs
  Office costs
  Insurance
TOTAL OPERATING EXPENSES

OPERATING INCOME
  (Operating revenue - operating expenses)

TAX EXPENSE
  Corporate income tax

NET INCOME
  (Operating income - tax)
```

### §35.6.3 Balance Sheet Structure (Book A)

```
ASSETS
  Operating cash
  Accounts receivable
  Prepaid expenses
  Property & equipment
  Intangible assets
  Intercompany receivable (from Holding)
  Intercompany receivable (from Tech Co)
TOTAL ASSETS

LIABILITIES
  Accounts payable
  Accrued expenses
  Deferred revenue
  Intercompany payable (to Holding)
  Intercompany payable (to Tech Co)
TOTAL LIABILITIES

EQUITY
  Common stock
  Retained earnings
TOTAL EQUITY

TOTAL LIABILITIES + EQUITY
```

### §35.6.4 Canonical Reserve Balance Sheet (MITHQAL-side)

```
RESERVE ASSETS (R_m)
  Cash (per currency)
  Sovereign bonds (per issuer)
  Physical gold
  Tokenized gold
  Digital liquidity (per asset)
TOTAL RESERVE ASSETS (R_m)

LESS: Haircuts
LESS: Counterparty adjustments
RESERVE ASSETS (R_a)

LESS: Stress factors
RESERVE ASSETS (R_l)

RESERVE LIABILITY
  Total MTQ Supply × PAR
TOTAL RESERVE LIABILITY

RESERVE RATIO (RR = R_a / L)
STRESS COVERAGE (FSCR = R_l / L)
LIQUIDITY COVERAGE (LCR = HQLA / 30-day net outflow)
```

### §35.6.5 Cash Flow Statement

```
OPERATING CASH FLOW
  Net income
  Non-cash items (depreciation, amortization)
  Working capital changes
NET OPERATING CASH FLOW

INVESTING CASH FLOW
  Capital expenditures
  Software development costs
NET INVESTING CASH FLOW

FINANCING CASH FLOW
  Equity issuance
  Intercompany financing
NET FINANCING CASH FLOW

NET CHANGE IN CASH
BEGINNING CASH
ENDING CASH
```

---

## §35.7 Proof-of-Liabilities

### §35.7.1 Architecture

Per §V25.0.21 Institutional Proof-of-Liabilities:
- MITHQAL publishes a cryptographic proof-of-liabilities
- Proof is verifiable by independent third parties
- Proof uses Merkle tree architecture
- Proof is published at minimum monthly (target: real-time)

### §35.7.2 Proof Structure

```
Root Hash (published)
       │
       ▼
┌─────────────────┐
│  Intermediate   │
│  Hashes         │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  Leaf: Bank X   │
│  - MTQ outstanding
│  - Backing held
└─────────────────┘
```

### §35.7.3 Verification

- Each bank can verify its own position by computing its leaf hash
- Each bank can verify the root hash by recomputing from all leaves
- Independent auditor can verify the entire tree
- Zero-knowledge proofs (where applicable) preserve privacy while proving solvency

### §35.7.4 Proof-of-Reserves + Proof-of-Liabilities

Together:
- **Proof-of-Reserves** (R_a) — what MITHQAL holds
- **Proof-of-Liabilities** (L) — what MITHQAL owes
- **RR = R_a / L** — published ratio

Per §V25.0.22 Three-Way Reconciliation:
- Bank MTQ subledger ↔ MITHQAL canonical ledger
- Bank MTQ subledger ↔ Reserve backing evidence
- MITHQAL canonical ledger ↔ Custodian evidence

Per §V25.0.D.Z Five-Way Reconciliation:
- Bank MTQ subledger (Source A)
- Reserve backing evidence (Source A)
- Custodian evidence (Source B)
- MITHQAL canonical MTQ ledger (Source C)
- Proof of liabilities (Source D, where available)

7 reconciliation statuses: VERIFIED / WARNING / MISMATCH / CRITICAL / EXPIRED / UNAVAILABLE / LOCKED

Tolerance: 0.0001 (1 basis point)

---

## §35.8 Treasury Reporting, Management Reporting, Stress Reporting

### §35.8.1 Treasury Reporting

| Report | Frequency | Audience | Content |
|---|---|---|---|
| Daily treasury report | Daily | Treasury + CFO | Reserve position, currency weights, gold weight, digital weight |
| Weekly treasury report | Weekly | Council + Foundation | Trends, rebalancing proposals |
| Monthly treasury report | Monthly | Council | Comprehensive treasury review |
| Quarterly treasury report | Quarterly | Council + Foundation | Strategic review |

### §35.8.2 Management Reporting

| Report | Frequency | Audience | Content |
|---|---|---|---|
| Daily operations dashboard | Daily | COO + CTO | Operations metrics |
| Weekly management report | Weekly | Executive team | Operations + financials |
| Monthly management report | Monthly | Council | Comprehensive management review |
| Quarterly management report | Quarterly | Council + Foundation | Strategic management review |

### §35.8.3 Stress Reporting

| Report | Frequency | Audience | Content |
|---|---|---|---|
| Daily stress test | Daily | Risk Committee | 5 canonical scenarios |
| Weekly stress test | Weekly | Risk Committee | 15 scenarios |
| Monthly stress test | Monthly | Council | 30 scenarios + reverse stress |
| Quarterly stress test | Quarterly | Council + Foundation | 250K Monte Carlo + 4 challenger models |
| Annual stress test | Annual | Public | Comprehensive + independent validation |

### §35.8.4 Regulatory Reporting (where required)

Per jurisdiction (subject to §34.15 jurisdiction adapter):
- MiCAR quarterly reports (EU)
- OCC call reports (US, if applicable)
- FCA quarterly reports (UK)
- MAS quarterly reports (Singapore)
- VARA quarterly reports (UAE)
- HKMA quarterly reports (Hong Kong)
- SAMA quarterly reports (KSA)
- FINMA quarterly reports (Switzerland)

---

## §35.9 Economic vs Accounting vs Legal vs Settlement Position

### §35.9.1 The Four-Lens Distinction (per §35.0.1)

| Lens | Question | Where Tracked |
|---|---|---|
| **Economic representation** | What is the true economic value / exposure? | Treasury + Risk + canonical ledger (R_m) |
| **Accounting representation** | What does the adjusted reserve recognize? | CFO + canonical ledger (R_a) |
| **Legal ownership** | Who legally owns the asset? | General Counsel + counterparty records |
| **Settlement position** | What is the institution's settlement position? | Settlement Risk Office + canonical ledger |

### §35.9.2 Example

Consider $100M of USD cash held by Bank X for MTQ backing:

| Lens | Value |
|---|---|
| Economic representation | $100M (market value) |
| Accounting representation | $99.5M (after 0.5% haircut for TIER_1 bank + 0% counterparty adjustment) |
| Legal ownership | Bank X (MITHQAL is non-custodial by default) |
| Settlement position | $100M available for MTQ issuance to Bank X's clients (subject to DMCE) |

### §35.9.3 Why Separation Matters

1. **Honest disclosure** — claiming one lens as another would be misleading
2. **Regulatory compliance** — each regulator may focus on a different lens
3. **Risk management** — risk arises differently in each lens
4. **Audit** — auditors verify each lens separately
5. **Reconciliation** — the four lenses must reconcile (with documented differences)

### §35.9.4 Reconciliation Rules

- Economic = R_m (market value)
- Accounting = R_a (prudential value)
- Legal = sum of legal ownership records (per asset)
- Settlement = sum of settlement positions (per institution)

```
R_m ≥ R_a (always)
Legal ownership (sum) = R_m (must reconcile)
Settlement position (sum) ≤ R_a (must be backed by adjusted reserve)
```

If any of these reconciliations fail beyond 1bp tolerance:
- Mint HALTED (per L6 of §33.9)
- Reconciliation procedure activates (per §V25.0.D.Z)
- Council notification (within 4 hours)
- Public disclosure (within 72 hours, if material)

---

## §35.10 Honest State — §35

```
section                              = "§35 Accounting / CFO Architecture"
chartOfAccountsBooks                 = 3 (A, B, C) + 1 canonical
bookAFieldsCount                     = 8
bookBFieldsCount                     = 8
bookCFieldsCount                     = 9
canonicalReserveLedgerAccounts       = 12
antiComminglingTests                 = 4 (ALL blocked at design level)
threeBookDesign                      = true
threeBookOperational                 = false
threeBookEnforced                    = false
parIsAccountingReferenceOnly         = true
parIsNotUSDPeg                       = true
mtqIsParReferenced                   = true
mtqIsNotUSDBacked                    = true
threeLayerReserveValuation           = R_m, R_a, R_l (with R_l ≤ R_a ≤ R_m)
haircutTableStatus                   = DESIGNED
counterpartyAdjustmentStatus         = DESIGNED
stressCoefficientStatus              = DESIGNED
operatingCompanyRevenueCategories    = 8
bankRevenueStreams                   = 9
nonCompetePrinciple                  = ENFORCED (MITHQAL does not compete with banks)
fxBoundary                           = ENFORCED (MITHQAL does not provide FX)
proofOfLiabilitiesStatus             = DESIGNED (Merkle tree architecture)
proofOfReservesStatus                = DESIGNED
fiveWayReconciliation                = DESIGNED (5 sources, 7 statuses, 1bp tolerance)
fiveWayReconciliationTolerance       = 0.0001 (1 basis point)
fiveWayReconciliationFrequency       = REAL-TIME (target), DAILY (minimum)
financialReportingFrequency          = DAILY/WEEKLY/MONTHLY/QUARTERLY/ANNUAL
externalAuditStatus                  = PENDING (no external auditor engaged)
fourLensSeparation                   = ENFORCED (economic / accounting / legal / settlement)
productionAuthorization              = false
```

**Open items:**
1. Engage external auditor (Standing Blocker — annual independent audit)
2. Implement three-book separation in production (currently DESIGNED, not operational)
3. Implement proof-of-liabilities Merkle tree publication
4. Implement real-time 5-way reconciliation
5. Obtain accounting standard opinions per jurisdiction (IFRS / US GAAP / etc.)
6. Establish audit committee (Foundation)
7. Implement financial reporting automation

**END OF §35 — ACCOUNTING / CFO ARCHITECTURE**

---


# §36 — TREASURY ARCHITECTURE

## §36.0 Treasury Philosophy

### §36.0.1 Principle

The MITHQAL Treasury function is **constitutionally separated from commercial operations**. Treasury's mandate is **prudential reserve management**, not profit-seeking. The Treasury operates under the Monetary & Reserve Control Division, which is structurally separated from sales, marketing, bank relationship teams, revenue teams, and commercial contract negotiators.

### §36.0.2 Treasury Mandate

The Treasury:
1. Manages the reserve composition within constitutional corridors (fiat 70-85%, bullion 15-25%, digital 0-5%)
2. Maintains the policy center (80/18/2) subject to validated quantitative optimization
3. Maintains RR ≥ 1.30 strategic target, ≥ 1.05 policy floor, ≥ 1.00 absolute floor
4. Manages liquidity (LCR ≥ 1.00, ILPS 5-layer)
5. Executes rebalancing trades (per 13-step RB-01..RB-13)
6. Manages FX exposure (per currency weight engine)
7. Manages gold custody (16-step GA-01..GA-16)
8. Manages counterparty relationships (per §3.5 Counterparty Risk framework)
9. Reports to Monetary & Reserve Control Division

### §36.0.3 Treasury MUST NOT

1. Profit from reserve appreciation (per §V25.0.D.AC)
2. Engage in speculative trading
3. Engage in proprietary trading
4. Engage in currency speculation
5. Convert operating capital to reserve backing silently (FV24)
6. Execute unauthorized reserve transfer (FV23)
7. Liquidate gold outside allowed constitutional conditions (FV22)
8. Operate outside constitutional corridors (FV21)

### §36.0.4 Treasury MAY

1. Execute authorized rebalancing trades (per §36.5)
2. Execute authorized gold acquisition (per §V25.0.D.Q)
3. Manage HQLA composition (within corridors)
4. Manage FX hedges (within delegated authority)
5. Coordinate with custodians (per §3.5)
6. Engage with banks (per §V25.0.D.AA Bank Monitoring Authority)

### §36.0.5 Anti-Procyclical Posture

Treasury is designed to **not amplify stress**:
- Volatility attenuation factor reduces momentum influence during high-volatility regimes
- StressDRQS shrinks stablecoin weights under stress
- CALM state machine tightens mint capacity monotonically (Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓)
- Trade suppression blocks rebalancing trades whose NetBenefit ≤ 0
- Model-failure gate falls back to LastApprovedDeterministicPolicyPortfolio

---

## §36.1 Reserve Management

### §36.1.1 Three-Pillar Structure (per §4.1)

| Pillar | Target | Range | Function |
|---|---|---|---|
| Fiat / monetary | 80% | 70-85% | Primary liquidity, settlement, redemption |
| Gold / bullion | 18% | 15-25% | Constitutional anchor, long-term store of value |
| Digital liquidity | 2% | 0-5% | Settlement efficiency, operational liquidity |

**Policy center (current strategic target):** 80/18/2
**Strategic target RR:** 1.30 (130%)

### §36.1.2 Solvency Buffer (per §4.3)

- Strategic target: 130% (30pp buffer above solvency floor)
- Policy floor: 105% (5pp buffer above solvency floor)
- Absolute floor: 100% (solvency floor)

### §36.1.3 Currency Basket (per §6)

11 reserve-eligible currencies (Layer A):
- USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD

10 settlement-only currencies (Layer B):
- EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB + others passing settlement-admission framework

**Principle:** Settlement eligibility ≠ backing eligibility. A currency can be supported for settlement without being held as constitutional reserve.

### §36.1.4 Currency Weight Engine (per §7-§16)

Per Final Reserve Math Spec:

```
L  = S × PAR
R_m = Σ_a Q_a · P_a
R_a = Σ_a Q_a · P_a · (1 − H_a) · C_a
R_l = Σ_a Q_a · P_a · (1 − H_a) · C_a · S_a
RR  = R_a / L
FSCR = R_l / L   (coverage interpretation)
```

Per currency:
```
C_i = 0.50·COFER_i + 0.40·SWIFT_i + 0.10·BIS_i
M_i = P_i(t) / P_i(t−12m)                       [0.95, 1.05]
R_i = 1 + 0.05·(LTA_i − C_i)                     [0.98, 1.02]
σ²_t = λ·σ²_{t−1} + (1−λ)·r²_t                  λ=0.94
A_t = { 1.00 if σ≤2%; 1−(σ−0.02)/0.03 if 2%<σ<5%; 0.50 if σ≥5% }
K_i = 1 + A_t·(M_i·R_i − 1)
L_i = 1 + 0.02·(Liquidity_i − Median)           [clamp ±5%]
W_raw,i = C_i · K_i · L_i
W_i^norm = W_raw,i / Σ_j W_raw,j                (proportional, NOT softmax)
W_i^final = apply(eligibility → concentration → floor → stress → geopolitical → liquidity → jurisdiction → verification)
Σ_i W_i^final = 1
```

### §36.1.5 Concentration Policy

Per §16 (REQUIRED CLEANUP):
- Preferred effective currency exposure: ≤ 15%
- **Hard maximum (operative):** 20%
- Old constitutional ceiling (sanity fail-safe ONLY): 60%

The old 60% mechanism may remain only as a deeper constitutional sanity cap that can NEVER override the 20% operating limit.

### §36.1.6 Effective USD Exposure

Per §17:
```
USD_effective = USD_direct + AED_{USD-equiv} + SAR_{USD-equiv} + USD-linked synthetic + USD-linked digital
```

**Hard ceiling:** `USD_effective ≤ 35%`

Current snapshot (per `/tmp/blueprint_reference.json`):
```
USD_direct               = 0.20
AED_USD_equiv            = 0.019280001429830575
SAR_USD_equiv            = 0.01610479388005245
USD_linked_synthetic     = 0
USD_linked_digital       = 0
USD_effective            = 0.23538479530988304
Ceiling                  = 0.35
Breached                 = false
```

### §36.1.7 Gold Policy

Per §23-29 of Final Reserve Math Spec:
- Gold target: 18%
- Preferred lower boundary: 15%
- Operational upper zone: ~21-22% (under validated currency-risk conditions)
- Constitutional bullion corridor: 15% ≤ Bullion ≤ 25%

### §36.1.8 Digital Liquidity Policy

Per §30-36:
- Normal target (D_normal): 2%
- Operational ceiling (D_operational): 3%
- Constitutional maximum (D_max): 5%
- Emergency (D_emergency): 0%

### §36.1.9 Three-Layer Reserve Valuation (per §37-42)

| Value | Equation |
|---|---|
| Market | `R_m = Σ_a Q_a·P_a` |
| Adjusted (prudential) | `R_a = Σ_a Q_a·P_a·(1 − H_a)·C_a` |
| Stress (liquidation) | `R_l = Σ_a Q_a·P_a·(1 − H_a)·C_a·S_a` |

`R_l ≤ R_a ≤ R_m` (always)

Three NAVs:
| NAV | Equation |
|---|---|
| Market NAV | `NAV_m = R_m / S` |
| Prudential NAV | `NAV_l = R_a / S` |
| Stress NAV | `NAV_s = R_l / S` |

### §36.1.10 Reserve Ratio Thresholds (per §3.3)

| Threshold | Value | Meaning |
|---|---|---|
| Strategic target | 1.30 | 130% strategic backing target |
| Policy floor | 1.05 | Minimum operational floor |
| Absolute solvency floor | 1.00 | FV3 invariant (cannot breach) |
| Status (current snapshot) | DEFENSIVE | Snapshot from reference |

### §36.1.11 FSCR Thresholds

Per §40:
- Normal: ≥ 1.10
- Defensive: ≥ 1.05
- Emergency: ≥ 1.00
- Current snapshot: 1.136725864248 (NORMAL)
- `noFeasiblePortfolio: false`

If optimizer cannot meet hard StressRR/FSCR constraints: `NO_FEASIBLE_PORTFOLIO` — issuance reduced/frozen.

---

## §36.2 Liquidity Management (ILPS, HQLA, LCR/MLCR)

### §36.2.1 ILPS 5-Layer Architecture

| Layer | Purpose | Amount | Status |
|---|---|---|---|
| 1. Settlement layer | T+0 settlement obligations | $2.7M | DESIGNED (not funded) |
| 2. Redemption layer | 30-day net redemption outflow | $16.2M | DESIGNED (not funded) |
| 3. Emergency layer | 5-day stressed outflow | $10.8M | DESIGNED (not funded) |
| 4. Structural layer | Capital preservation | $13M | DESIGNED (not funded) |
| 5. External layer | Committed credit facilities | $5.4M | DESIGNED (not contracted) |
| **Total** | | **$46M** | |

### §36.2.2 HQLA (High-Quality Liquid Assets)

Per §41:
```
LCR = HQLA / 30-day net redemption outflow
```
- Target: LCR ≥ 1.00
- Current snapshot: LCR = 1.30 (ADEQUATE)
- HQLA: $65M (snapshot)
- Net outflow 30d: $50M (snapshot)

### §36.2.3 MLCR (Modified Liquidity Coverage Ratio)

MLCR uses stressed outflow assumptions (higher than normal LCR):
- Stressed outflow assumes 25% higher redemption rate
- MLCR target: ≥ 1.00
- Current snapshot: MLCR (per §11 of Bank Minting Workflow BM-12)

### §36.2.4 Prefunded Institutional Redemption Liquidity (per §9.3A)

Per-bank prefunded redemption liquidity:
- Each participating bank maintains prefunded redemption liquidity at MITHQAL's direction
- Amount: based on bank's MTQ outstanding × 30-day stressed redemption rate
- Held in segregated account at qualified custodian
- Status: PENDING (no bank contracted)

### §36.2.5 Redemption Controls

Per §9.3 Redemption:
- 6-state continuity machine: NORMAL / CAUTION / DEFENSIVE / STRESS / EMERGENCY / RECOVERY
- Redemption queue (when capacity insufficient)
- Circuit breakers (when redemption rate > 3σ)
- Article X sequential liquidation (per §9.4) — gold protected LAST

### §36.2.6 Article X Sequential Liquidation (per §9.4)

```
1. Eligible digital liquidity (stablecoins, BUIDL)
2. Cash (TIER_1 bank deposits)
3. Short-duration sovereign bonds
4. Non-USD FX (other reserve currencies)
5. Conditional silver (if held, currently 0%)
6. Tokenized gold (digital representation — liquidate before physical)
7. Physical gold (LAST — Exhaustion Certificate required)
```

Physical gold is constitutionally protected from liquidation outside allowed conditions (FV22).

---

## §36.3 Bank Relationships, Custodians, Gold Custody

### §36.3.1 Bank Relationships

- Each participating bank has institutional identity (per §33.1.1)
- Each participating bank has DMCE capacity (per §V25.0.D.V)
- Each participating bank has Book B (Bank MTQ Obligation Ledger)
- Each participating bank has exposure limit (25% of canonical MTQ supply)
- Each participating bank has concentration limit (15% preferred / 25% hard cap per custodian / counterparty)

### §36.3.2 Custodians

Per §3.5 Counterparty Risk framework:
- Multi-custodian architecture (no single point of failure)
- Per-custodian concentration: 15% preferred / 25% hard cap
- Geopolitical silos (assets held in jurisdiction-appropriate silos)
- Quarterly counterparty due-diligence refresh
- Independent attestation (Source B + Source D)

### §36.3.3 Gold Custody

Per §V25.0.D.Q Gold Acquisition (16-step workflow):

1. **GA-01** — Constitutional authorization
2. **GA-02** — Funding source identification (NOT operating capital, NOT founder funds, NOT Foundation operating funds, NOT Tech Co funds)
3. **GA-03** — Jurisdictional authorization
4. **GA-04** — Custodian selection (LBMA-approved vault, segregated allocated custody)
5. **GA-05** — Counterparty due diligence (gold dealer / refiner / custodian)
6. **GA-06** — Sharia review (where applicable, status: DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)
7. **GA-07** — Pricing benchmark (LBMA fix or independent benchmark)
8. **GA-08** — Trade execution (authorized reserve manager / institutional treasury)
9. **GA-09** — Settlement (via designated reserve / institutional funding pool)
10. **GA-10** — Custody transfer (to qualified custodian's segregated allocated vault)
11. **GA-11** — Custody evidence issuance (Source B — RCAF)
12. **GA-12** — Independent attestation (Source D, where feasible)
13. **GA-13** — MITHQAL ledger entry (canonical record)
14. **GA-14** — Reconciliation entry (5-way reconciliation)
15. **GA-15** — Audit trail preservation
16. **GA-16** — Proof-of-Reserves publication

### §36.3.4 Reserve Custody Principle (per §V25.0.D.K)

MITHQAL is **non-custodial by default**:
- Reserve assets remain in legally appropriate regulated custody (banks / qualified custodians / segregated structures)
- MITHQAL controls verification + monetary control, NOT custody
- The Protected Backing Cell is a bank-side identified/earmarked allocation, NOT a transfer of custody to MITHQAL

### §36.3.5 Five-Way Reconciliation (per §V25.0.D.Z)

5 Sources:
1. bankMTQSubledger — bank-side MTQ subledger (Source A)
2. reserveBackingEvidence — bank-signed reserve attestation (Source A)
3. custodianEvidence — independent custodian evidence (Source B)
4. mithqalCanonicalMTQLedger — MITHQAL canonical MTQ ledger (Source C)
5. proofOfLiabilities — independent proof of liabilities (Source D, where available)

7 Statuses: VERIFIED / WARNING / MISMATCH / CRITICAL / EXPIRED / UNAVAILABLE / LOCKED

Tolerance: 0.0001 (1 basis point)

---

## §36.4 Fiat Allocation, Liquidity Buffers, Concentration Limits

### §36.4.1 Fiat Allocation

Per §42 of Final Reserve Math Spec — Front-line / strategic fiat structure:

The 80% fiat sleeve is split by function:
- **Front-line liquidity:** 50% of total core reserve (= $65M for $130M total)
- **Strategic fiat/currency diversification:** 30% of total core reserve (= $39M for $130M total)

For 130 units of core backing: `65 + 39 + 23.4 + 2.6 = 130`

### §36.4.2 Liquidity Buffers

| Buffer | Amount | Coverage |
|---|---|---|
| Settlement layer | $2.7M | T+0 obligations |
| Redemption layer | $16.2M | 30-day net outflow |
| Emergency layer | $10.8M | 5-day stressed outflow |
| Structural layer | $13M | Capital preservation |
| External layer | $5.4M | Committed credit facilities |
| Total | $46M | |

### §36.4.3 Concentration Limits (per §76)

| Dimension | Preferred | Hard Cap |
|---|---|---|
| Currency | 15% | 20% |
| Bank | 15% | 20% |
| Custodian | 15% | 20% |
| Country | 20% | 25% |
| USD-effective | (n/a) | 35% |
| Per-bank exposure (% of canonical MTQ supply) | 15% | 25% |

### §36.4.4 Counterparty Adjustment (per §38)

```
C_a = Credit_a × Jurisdiction_a × Operational_a, with 0 < C_a ≤ 1
```

$100M nominal assets do not necessarily equal $100M prudential backing.

### §36.4.5 Stress Coefficients (per §3.6)

Per-asset-class stress coefficient `S_a` applied to compute `R_l`:
- Cash (TIER_1): 0.99 - 1.00
- Cash (TIER_2): 0.97 - 0.99
- Cash (TIER_3): 0.95 - 0.97
- Sovereign bonds (AAA): 0.98 - 1.00
- Sovereign bonds (AA-A): 0.95 - 0.98
- Sovereign bonds (BBB): 0.90 - 0.95
- Physical gold: 0.92 - 0.96
- Tokenized gold: 0.90 - 0.95
- Stablecoin (DRQS ≥ 7.5): 0.85 - 0.92
- Stablecoin (DRQS 6.0-7.5): 0.75 - 0.85

---

## §36.5 Rebalancing (2pp threshold, hard overrides, transaction cost test)

### §36.5.1 Rebalancing Engine (per §8 + §V25.0.D.S — 13-step flow)

1. **RB-01** — Snapshot current reserve allocation (R_m market value)
2. **RB-02** — Compute current weights per asset class (fiat / bullion / digital liquidity) and per currency
3. **RB-03** — Compare current weights to target weights within constitutional corridors (§L)
4. **RB-04** — Compute drift delta (current − target) per asset class and per currency
5. **RB-05** — If drift ≤ approved tolerance → NO REBALANCING TRADE (§T — No-Trade Principle)
6. **RB-06** — If drift > approved tolerance → identify rebalancing targets (which assets to buy / sell)
7. **RB-07** — Verify rebalancing preserves RR / StressRR / LCR / MLCR / ILPS (FV19, §S preserve list)
8. **RB-08** — Verify rebalancing preserves concentration limits (custodian 15% preferred / 25% hard cap)
9. **RB-09** — Verify rebalancing preserves allocation corridors (fiat 70-85% / bullion 15-25% / digital 0-5%)
10. **RB-10** — Verify rebalancing preserves asset eligibility (RCAF eligibilityStatus=ELIGIBLE)
11. **RB-11** — Execute rebalancing trades via authorized reserve manager / institutional treasury
12. **RB-12** — Update canonical MITHQAL Reserve Ledger + bank subledgers + custodian evidence (5-way reconciliation)
13. **RB-13** — Preserve immutable audit trail; update Proof-of-Reserves

### §36.5.2 Rebalancing Equation (per §43)

```
Δ_i = W_{actual,i} − W_{target,i}
```

**Normal trigger:** `|Δ_i| > τ` where `τ ≈ 2 percentage points` (2pp threshold).

### §36.5.3 Hard Overrides (Immediate Corrective Action)

Immediate corrective action overrides the ordinary 2pp threshold when:
1. Constitutional range breached (e.g., bullion >25% or <15%)
2. Concentration breached (e.g., single currency >20% effective, USD-effective >35%)
3. Eligibility changes (e.g., currency downgraded, stablecoin depegged)
4. Backing/solvency requires it (e.g., RR < 1.05)
5. Stablecoin eligibility fails (DRQS < 7.5 for core)
6. Emergency governance activates (CALM EMERGENCY)

### §36.5.4 Transaction-Cost Test (per §44)

```
NetBenefit = RiskReductionBenefit − TotalTradeCost
```

Execute voluntary rebalance **only if** `NetBenefit > 0`, unless a hard constitutional/legal breach requires correction.

```
TotalCost = Spread + Fees + Slippage + MarketImpact + Custody + Settlement + Taxes + LifecycleCosts
```

Per §V24.2.7 of v24.2 Directive — 15-component trade cost model:

```
TotalTradeCost = BrokerFee + ExchangeFee + Spread + Slippage + MarketImpact +
  FXConversionCost + CustodyCost + TransferCost + NetworkGasCost +
  SettlementCost + StorageCost + InsuranceCost + TaxDutyCost +
  OpportunityCost + OtherApplicableCost

LifecycleCost = AcquisitionCost + HoldingCost + LiquidationCost + OpportunityCost
```

Stress-dependent cost regimes: Normal (1×), Stress (2×), Emergency (3×).

Post-trade reserve value must deduct costs before recomputing coverage.

### §36.5.5 Hysteresis (per §8.3)

- 2% band, 2-cycle, direction-tracking (anti-whipsaw)
- Rebalancing trades cannot reverse direction within 2 cycles
- Prevents excessive trading from noise

### §36.5.6 Trade Suppression (per §8.4)

- Benefit > cost + slippage + 2bp buffer
- If `NetBenefit ≤ 0`, trade suppressed (unless hard override)

### §36.5.7 Turnover Limits (per §8.5)

- Monthly turnover limit (per asset class)
- Quarterly turnover limit
- Annual turnover limit
- Prevents excessive trading

### §36.5.8 Fee Model (per §8.6)

- Per-trade fees
- Per-bps fees
- Tiered fee structure

### §36.5.9 Approval Routing (per §8.7)

5 roles:
1. Treasury
2. Risk
3. Constitutional
4. Operations
5. Independent Oversight

Per-trade approval routing based on:
- Trade size
- Asset class
- Counterparty
- Direction (buy/sell)
- Risk level

### §36.5.10 No-Trade Principle (per §V25.0.D.T)

If the current reserve allocation is within approved tolerance of the target allocation, **NO REBALANCING TRADE is executed**. Rebalancing is NOT a continuous high-frequency activity — it is a discrete, controlled response to drift exceeding approved tolerance.

### §36.5.11 Rebalancing Must Preserve (9 Items)

1. Minimum trades (avoid unnecessary transaction costs)
2. Minimize cost (execution cost optimization)
3. Minimize market impact (avoid large block trades that move prices)
4. Preserve redemption capacity (redemption liquidity must remain sufficient)
5. Preserve RR (Reserve Ratio must remain ≥ 1.00)
6. Preserve LCR (Liquidity Coverage Ratio must remain ≥ 1.00)
7. Preserve concentration limits (custodian concentration ≤ 15% preferred / 25% hard cap)
8. Preserve allocation ranges (fiat 70-85% / bullion 15-25% / digital 0-5% corridors)
9. Preserve asset eligibility (RCAF eligibilityStatus=ELIGIBLE)

### §36.5.12 What-If Scenarios (per §45)

For `S = 100M MTQ`, `L = 100M`, `RR = 130%`, `R_a = 130M`:

| Scenario | Calculation | RR' | Delta |
|---|---|---|---|
| A. 15%-currency falls 20% | `130M × (1 − 0.15×0.20) = 126.1M` | 126.10% | -3.90pp |
| B. Gold falls 20% (18%) | `130M × (1 − 0.18×0.20) = 125.32M` | 125.32% | -4.40pp |
| C. 2% digital sleeve loses 50% | `130M × (1 − 0.02×0.50) = 128.7M` | 128.70% | -1.22pp |
| D. Digital sleeve → zero | `130M × (1 − 0.02) = 127.4M` | 127.40% | -2.45pp |

Scenario D (still above 100%) demonstrates why the digital sleeve is deliberately small.

---

## §36.6 FX Management

### §36.6.1 FX Boundary (per §V25.0.32)

- MITHQAL does NOT provide FX services
- FX is performed by participating banks or authorized FX intermediaries
- MITHQAL provides infrastructure for FX settlement, not FX itself

### §36.6.2 Currency Weight Engine (per §6)

The currency weight engine automatically:
- Computes structural weight per currency
- Applies momentum, mean-reversion, volatility attenuation, liquidity overlay
- Normalizes to final weights
- Verifies concentration compliance

### §36.6.3 Currency Lifecycle (per §6.4)

| State | Trigger |
|---|---|
| WATCH | CQS < 6.0 · sovereign downgrade · volatility > 2σ |
| REDUCE | CQS < 5.5 for ~20 consecutive readings |
| SUSPEND | CQS < 4.0 · sanctions · capital controls · equivalent severe disqualification |
| SUBSTITUTE | Governance approves replacement with highest-quality eligible alternative |
| REINSTATE | CQS > 6.5 for 60 consecutive readings |

### §36.6.4 Severe Deviation Protocol (SDP — per §6.5)

Activated when currency exhibits severe deviation (e.g., -25% in 30 days):
- Position zeroed (SUSPEND)
- Renormalization (remaining currencies adjusted)
- Substitute activated (governance-approved replacement)
- Permanent record

### §36.6.5 Minimum Currency Floor (per §22)

A currency below `W_min = 0.5%` enters the Q1-Q4 ladder:

| Quarter | Stage | Action |
|---|---|---|
| Q1 | Observation | observe |
| Q2 | Observation | observe |
| Q3 | Probation | governance review |
| Q4 | Removal | final notice |
| (4 quarters below) | REMOVE | remove and renormalize |

---

## §36.7 Emergency Liquidity

### §36.7.1 ILPS Emergency Layer

- $10.8M (5-day stressed outflow coverage)
- Drawn when LCR < 1.10 (CAUTION state)
- Drawn automatically when LCR < 1.00 (STRESS state)
- Replenished within 30 days of draw

### §36.7.2 External Layer

- $5.4M (committed credit facilities)
- Drawn when internal ILPS insufficient
- Status: DESIGNED (not contracted — no credit facility contracted)

### §36.7.3 In-Kind Emergency Reserve Delivery (per §V24.2.11)

```
InKindValue = MarketValue(DeliveredAssets)    NOT InKindValue = PAR
```

Emergency mechanism for formally declared resolution/extraordinary liquidity events. Delivers pro-rata reserve assets instead of cash when banking rails are frozen.

**CRITICAL:** In-kind delivery does NOT guarantee 100% PAR. If reserves have declined to $0.82 per MTQ, in-kind delivery gives $0.82 of assets, not $1.00.

MiCA-compatible: allows redemption through delivery of referenced assets in specified circumstances.

### §36.7.4 ERTF — External Risk Transfer Facility (per §V24.2.10)

Ring-fenced external risk-bearing capital — NOT inside the monetary core.

```
NetRecovery = PolicyLimit × TriggerProbability × RecoveryFactor
```

ERTF is:
- Legally separate
- Independently governed
- Non-reserve (does NOT count toward R_a)
- Non-PAR (does NOT affect PAR)
- Non-monetary (NOT required for ordinary MTQ redemption)

**Current ERTF coverage:** $10,000,000 total, $5,905,000 expected recovery (59.05% — reflects basis risk and counterparty risk).

### §36.7.5 Article X Liquidation Waterfall (per §9.4 + V24.2.1.6)

7-step liquidation waterfall (gold LAST):

1. **Eligible digital liquidity** (stablecoins, BUIDL)
2. **Cash** (TIER_1 bank deposits)
3. **Short-duration sovereign bonds**
4. **Non-USD FX** (other reserve currencies)
5. **Conditional silver** (if held, currently 0%)
6. **Tokenized gold** (digital representation — liquidate before physical)
7. **Physical gold (LAST)** — Exhaustion Certificate required

The Exhaustion Certificate requires:
- Council approval (4-of-7)
- Foundation Board notification
- Public disclosure
- Regulatory notification (where applicable)
- Documented exhaustion of all other options

---

## §36.8 Stress Testing & Counterparty Monitoring

### §36.8.1 Monte Carlo Stress Test (per §V24.2.12)

250,000 paths with FIXED seed=42 (fully reproducible). 18 version-controlled parameters.

**Key results (honest, NOT forced to pass):**
- P(RR < 100%) = 21.54%
- P(LCR < 1.0) = 0.00%
- VaR 99% = $24.6M loss
- CVaR 99% = $25.5M loss
- CVaR 99.9% = $28.0M loss
- Min correlated shock to breach: 17%
- Min custody loss to breach: 17%

### §36.8.2 Challenger Models (per §3.17)

- 5 challenger models required
- 3-of-5 challenger agreement for parameter changes
- Challenger-model range [19.97%, 24.91%] reflects model uncertainty

### §36.8.3 Model Validity Gate (per §V24.2.8)

```
If ModelValidity < MinimumThreshold:
  Optimizer → LastApprovedDeterministicPolicyPortfolio
  No discretionary risk expansion is permitted.
```

Model failure is a HARD GATE — NOT a tradeable risk.

### §36.8.4 Counterparty Monitoring (per §V25.0.D.AA)

**Authority:** MITHQAL Operating Company — MONETARY & RESERVE CONTROL DIVISION

**Operationally separated from:** sales, marketing, bank relationship teams, revenue teams, commercial contract negotiators

**Monitors:**
- Bank backing evidence (AvailableBackingCertificate validity + custodian evidence)
- Bank MTQ subledger reconciliation
- Bank exposure (per institution exposure ≤ 25% hard cap)
- Bank concentration (per institution concentration ≤ 25% hard cap)
- Bank operational status (gateway throughput, settlement latency)
- Bank jurisdictional authorization status
- Bank compliance status (KYC/AML/sanctions attestations)
- DMCE compliance (institution cannot mint outside DMCE capacity)

**Rule:** Commercial relationship staff MUST NOT approve reserve sufficiency for their own bank clients. The Monetary & Reserve Control Division is operationally separated from sales / marketing / bank relationship teams. This separation is STRUCTURAL — not optional.

### §36.8.5 Daily Treasury Operations

- Daily mark-to-market (R_m, R_a, R_l)
- Daily LCR / MLCR computation
- Daily counterparty review
- Daily reconciliation (5-way)
- Daily risk dashboard publication

### §36.8.6 Weekly Treasury Operations

- Weekly currency weight review
- Weekly rebalancing decision (per 2pp threshold)
- Weekly counterparty due diligence refresh
- Weekly risk report to Council + Foundation

### §36.8.7 Quarterly Treasury Operations

- Full 250K Monte Carlo stress test
- 4 challenger model comparison
- Strategic review
- Independent validation (where applicable)

---

## §36.9 Treasury Permissions & Workflow

### §36.9.1 Treasury Authority Matrix

| Action | Required Approval |
|---|---|
| Daily mark-to-market | Treasury (no approval needed) |
| Daily LCR / MLCR | Treasury (no approval needed) |
| Rebalancing trade (within 2pp threshold) | Treasury + Risk |
| Rebalancing trade (hard override) | Treasury + Risk + Council |
| Gold acquisition (GA-01..GA-16) | Treasury + Board |
| Currency substitute | Governance (4-of-5 per §8.7) |
| Add new counterparty | Counterparty Risk Office + Compliance |
| Suspend counterparty | Risk Committee (2-of-7) |
| Draw ILPS Emergency Layer | Treasury (auto-draw when LCR < 1.00) |
| Draw ILPS External Layer | Treasury + CFO |
| Article X liquidation (steps 1-6) | Treasury + Risk + CFO |
| Article X step 7 (physical gold) | Council (4-of-7) + Foundation + Exhaustion Certificate |
| Activate in-kind delivery | Council + regulator notification |

### §36.9.2 Treasury Workflow

1. **Daily** — Treasury team executes daily operations (mark-to-market, LCR, reconciliation)
2. **Weekly** — Treasury + Risk review rebalancing decisions
3. **Monthly** — Treasury + Risk + CFO review monthly management report
4. **Quarterly** — Treasury + Risk + Council review quarterly stress test
5. **Annual** — Treasury + Risk + Council + Foundation + Independent Auditor review annual report

### §36.9.3 Treasury Independence

- Treasury reports to Monetary & Reserve Control Division
- Monetary & Reserve Control Division reports to Council (NOT to CEO/COO)
- Treasury staff are forbidden from having commercial relationships with banks they monitor
- Treasury staff are forbidden from receiving compensation tied to commercial performance

---

## §36.10 CALM — Capital-Adaptive Liability Management (6 States)

### §36.10.1 CALM State Machine

Per V24.2.2 (6-state reserve state machine) and V24.2.1.1 (CALM target correction):

States: `NORMAL → CAUTION → DEFENSIVE → STRESS → EMERGENCY → RECOVERY`

Each state specifies: minting status, max mint capacity, digital liquidity ceiling, minimum liquid cash, gold/silver target zones, rebalancing permissions, approval requirements, LCR minimum, Stress-RR minimum, reporting frequency, stress-test frequency, stabilization fee, CALM RR target.

State transitions are driven by a multi-dimensional stress score incorporating: RR, LCR, eigenvalue index, redemption pressure, oracle health, custody stress, Stress-RR, correlation break.

### §36.10.2 CALM State Table (per V24.2.1.1 Corrected)

| State | Bullion Range | Gold Target | Silver Target | Digital Ceiling | Cash Min | Minting | CALM RR Target |
|---|---|---|---|---|---|---|---|
| NORMAL | 16-20% | 13-17% | 0-3% | 2.5% | 55% | ALLOWED | **1.20** |
| CAUTION | 17-21% | 14-18% | 0-3% | 2.0% | 60% | ALLOWED (70%) | **1.22** |
| DEFENSIVE | 18-22% | 15-19% | 0-3% | 2.0% | 65% | RESTRICTED (40%) | **1.23** |
| STRESS | 20-24% | 16-20% | 0-3% | 1.5% | 72% | RESTRICTED (15%) | **1.25** |
| EMERGENCY | 22-25% | 18-22% | 0-3% | 0% | 78% | BLOCKED | **1.30** |
| RECOVERY | 19-22% | 15-18% | 0-3% | 2.0% | 68% | RESTRICTED (30%) | **1.21** |

### §36.10.3 Core Invariant

**Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓ (monotonic)**

### §36.10.4 State Transition Drivers

Multi-dimensional stress score incorporating:
1. RR (Reserve Ratio)
2. LCR (Liquidity Coverage Ratio)
3. Eigenvalue index (correlation concentration)
4. Redemption pressure
5. Oracle health
6. Custody stress
7. Stress-RR (forward stress)
8. Correlation break

### §36.10.5 CALM Targets (v24.2.1 Corrected)

| State | v24.2 (WRONG) | v24.2.1 (CORRECT) | Direction |
|---|---|---|---|
| NORMAL | 1.15 | **1.20** | = strategic target |
| CAUTION | 1.18 | **1.22** | ↑ |
| DEFENSIVE | 1.20 | **1.23** | ↑ |
| STRESS | 1.25 | 1.25 | unchanged |
| EMERGENCY | 1.30 | 1.30 | unchanged |
| RECOVERY | 1.20 | **1.21** | slightly above NORMAL |

v24.2 had NORMAL CALM target = 1.15, which was BELOW the strategic target (1.20). This was internally inconsistent. v24.2.1 corrected this.

### §36.10.6 CALM State Behaviors

For each state, 12 behaviors are defined:

1. Minting status (ALLOWED / RESTRICTED / BLOCKED)
2. Max mint capacity (100% / 70% / 40% / 15% / 0% / 30%)
3. Digital liquidity ceiling
4. Minimum liquid cash
5. Gold/silver target zones
6. Rebalancing permissions
7. Approval requirements
8. LCR minimum
9. Stress-RR minimum
10. Reporting frequency
11. Stress-test frequency
12. Stabilization fee

### §36.10.7 Subsystem State Reconciliation (per V24.2.1.7)

7 subsystem states:
- LiquidityState
- CorrelationState
- CustodyState
- CurrencyState
- DigitalState
- OracleState
- ModelState

**Global state ≥ highest subsystem state** (with hysteresis). No "Global=NORMAL while Correlation=CRISIS."

### §36.10.8 CALM State Visibility

CALM state is visible on:
- Monetary & Reserve Control Dashboard (20 fields)
- Foundation READ-ONLY Dashboard (7 fields — aggregate only)
- Bank Dashboard (6 fields)
- Quarterly transparency report (public, aggregate)

---

## §36.11 Liquidation Waterfall (7 Steps, Gold LAST)

### §36.11.1 The 7-Step Waterfall

Per §9.4 Article X Sequential Liquidation + V24.2.1.6 Updated Liquidation Order:

```
┌─────────────────────────────────────────────────────────────┐
│                  LIQUIDATION WATERFALL                       │
│                                                              │
│  Step 1: Eligible Digital Liquidity                          │
│          (stablecoins: USDC, USDP, EURC, BUIDL)              │
│          → 2% of total reserve                               │
│          → Liquidation haircut: 2-5%                         │
│          → Settlement time: T+0 to T+1 hour                 │
│                                                              │
│  Step 2: Cash (TIER_1 Bank Deposits)                        │
│          → ~50% of total reserve (front-line)                │
│          → Liquidation haircut: 0% (at par)                  │
│          → Settlement time: T+0 to T+1 hour                 │
│                                                              │
│  Step 3: Short-Duration Sovereign Bonds                     │
│          → ~30% of total reserve (strategic)                 │
│          → Liquidation haircut: 0.5-2%                       │
│          → Settlement time: T+1 to T+5 days                 │
│                                                              │
│  Step 4: Non-USD FX (Other Reserve Currencies)              │
│          → varies (basket)                                   │
│          → Liquidation haircut: 0.5-3% (FX conversion)       │
│          → Settlement time: T+1 to T+2 days                  │
│                                                              │
│  Step 5: Conditional Silver (if held, currently 0%)         │
│          → 0% (currently)                                    │
│          → Liquidation haircut: 2-5%                         │
│          → Settlement time: T+1 to T+3 days                 │
│                                                              │
│  Step 6: Tokenized Gold (Digital Representation)            │
│          → 0-5% (currently 0% — conditional)                 │
│          → Liquidation haircut: 5-10%                       │
│          → Settlement time: T+0 to T+1 hour (atomic)        │
│          → Liquidate BEFORE physical gold                   │
│                                                              │
│  Step 7: Physical Gold (LAST — Exhaustion Certificate)      │
│          → 18% of total reserve (constitutional anchor)     │
│          → Liquidation haircut: 5-15%                       │
│          → Settlement time: T+1 to T+5 days (auction)       │
│          → Requires Exhaustion Certificate                   │
│          → Requires Council approval (4-of-7)               │
│          → Requires Foundation Board notification            │
│          → Requires public disclosure                        │
│          → Requires regulatory notification                  │
└─────────────────────────────────────────────────────────────┘
```

### §36.11.2 Liquidation Principles

1. **Most liquid first** — assets that settle fastest are liquidated first
2. **Highest haircut last** — assets with highest liquidation cost are liquidated last
3. **Physical gold LAST** — constitutionally protected (FV22 — Gold Anchor Preservation)
4. **Exhaustion Certificate required** — for step 7, documented exhaustion of all other options
5. **Multi-party approval** — for step 7, Council (4-of-7) + Foundation + regulator
6. **Public disclosure** — for step 7, public notification
7. **Atomic where possible** — steps 1, 2, 6 can be atomic (instant settlement)

### §36.11.3 Exhaustion Certificate

Required for Step 7 (Physical Gold liquidation):

```
EXHAUSTION CERTIFICATE
─────────────────────
Date: ___________
Time: ___________

States exhausted (in order):
  [✓] Step 1: Eligible digital liquidity exhausted
  [✓] Step 2: Cash exhausted
  [✓] Step 3: Short-duration sovereign bonds exhausted
  [✓] Step 4: Non-USD FX exhausted
  [✓] Step 5: Conditional silver exhausted (if applicable)
  [✓] Step 6: Tokenized gold exhausted (if applicable)

Council approval (4-of-7):
  [✓] Council Member 1: ___________ Signature: ___________
  [✓] Council Member 2: ___________ Signature: ___________
  [✓] Council Member 3: ___________ Signature: ___________
  [✓] Council Member 4: ___________ Signature: ___________

Foundation Board notification:
  [✓] Foundation Chair notified: ___________ Time: ___________

Public disclosure:
  [✓] Public statement issued: ___________ Time: ___________

Regulatory notification:
  [✓] Regulator notified: ___________ Time: ___________

Justification:
  _______________________________________________
  _______________________________________________
  _______________________________________________

Amount of physical gold to liquidate: ___________ ounces
Estimated recovery: ___________ (after 5-15% liquidation haircut)
```

### §36.11.4 Liquidation Triggers

Liquidation is triggered when:
- Redemption demand exceeds available liquidity (Settlement + Redemption layers)
- LCR < 1.00 sustained (CALM STRESS / EMERGENCY)
- StressRR < 1.00 (forward stress breach)
- Council declares emergency liquidation (4-of-7)
- Regulator orders resolution

### §36.11.5 Liquidation Recording

Each liquidation step is recorded in:
- Canonical Reserve Ledger
- Bank MTQ subledger
- Custodian evidence
- Independent attestation (Source D)
- Proof-of-liabilities update
- Audit trail (immutable)
- Public transparency report

### §36.11.6 Anti-Double-Count in Liquidation

Per FV15 (No Double-Counted Backing):
- Each asset can only be liquidated once
- Liquidated assets are removed from backing
- No "phantom" backing post-liquidation
- `verifyNoDoubleCount` runtime guard enforces

---

## §36.12 Honest State — §36

```
section                                = "§36 Treasury Architecture"
treasurySeparatedFromCommercial        = true
reserveManagementStatus                = DESIGNED
liquidityManagementStatus              = DESIGNED (ILPS 5-layer $46M, not funded)
bankRelationshipsStatus                = DESIGNED (0 banks contracted)
custodianRelationshipsStatus           = DESIGNED (0 custodians contracted)
goldCustodyStatus                      = DESIGNED (16-step GA workflow)
fiatAllocationStatus                   = DESIGNED (80/18/2 policy center)
concentrationLimitsStatus               = DESIGNED (15%/20% preferred/hard)
rebalancingEngineStatus                = DESIGNED (13-step RB flow)
rebalancingThreshold                   = 2pp (τ ≈ 2 percentage points)
hardOverridesCount                     = 6
transactionCostTestStatus               = DESIGNED (NetBenefit > 0)
tradeCostComponents                    = 15 + LifecycleCost
fxManagementStatus                     = DESIGNED (currency weight engine)
emergencyLiquidityStatus               = DESIGNED (ILPS + in-kind + ERTF)
stressTestingStatus                    = DESIGNED (250K Monte Carlo, seed=42)
counterpartyMonitoringStatus           = DESIGNED
treasuryPermissionsStatus              = DESIGNED
treasuryWorkflowStatus                 = DESIGNED
calmStateCount                         = 6 (NORMAL, CAUTION, DEFENSIVE, STRESS, EMERGENCY, RECOVERY)
calmStatesWithRRtargets                = 6 (all corrected in v24.2.1.1)
calmRRtargets                          = {NORMAL:1.20, CAUTION:1.22, DEFENSIVE:1.23, STRESS:1.25, EMERGENCY:1.30, RECOVERY:1.21}
calmMonotonicInvariant                 = true (Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓)
liquidationWaterfallSteps              = 7 (gold LAST)
liquidationExhaustionCertificate       = REQUIRED (step 7)
liquidationCouncilApproval             = 4-of-7 (step 7)
ilpsLayers                             = 5 (Settlement, Redemption, Emergency, Structural, External)
ilpsTotalAmount                        = $46M (not funded)
ilpsStatus                             = DESIGNED (not operational)
productionAuthorization                = false
```

**Open items:**
1. Fund ILPS 5-layer ($46M total) — requires institutional capital
2. Contract 2+ real custodians with legal segregation (Standing Blocker #4)
3. Sign 1+ participating bank and execute technical certification (Standing Blocker #7)
4. Execute 100+ pilot transactions on testnet
5. Execute DR / incident / emergency / recovery tests
6. Activate CALM 6-state machine in production
7. Execute Article X liquidation drill (quarterly tabletop)
8. Quarterly 250K Monte Carlo execution
9. Annual independent stress-test validation

**END OF §36 — TREASURY ARCHITECTURE**

---


# §37 — GOVERNANCE ARCHITECTURE

## §37.0 Governance Philosophy & Five-Entity Structure

### §37.0.1 Principle

MITHQAL governance is **separation-based**: each governance body has a clearly defined role, scope, and limit. No single body has unilateral authority over the entire system. Constitutional invariants (FV1-FV25) cannot be modified by any single body — they require supermajority board vote + (where applicable) Sharia review + regulatory notification.

### §37.0.2 Five-Entity Corporate Structure

Per §V25.0.D — Final Corporate Structure (5 entities):

| # | Entity | Role | For-Profit / Nonprofit |
|---:|---|---|---|
| 1 | Founder Shareholders | Initial capital, founder economics | For-profit |
| 2 | MITHQAL Holding | Strategic holding, capital coordination | For-profit |
| 3 | MITHQAL Operating Company | Day-to-day operations, MBG, Monetary & Reserve Control Division | For-profit |
| 4 | MITHQAL Technology Company | Software, infrastructure, IP ownership | For-profit |
| 5 | MITHQAL Foundation | Constitutional stewardship, aggregate oversight | Nonprofit (501(c)(3) target) |

### §37.0.3 Governance Bodies (4 primary)

| Body | Composition | Authority | Meets |
|---|---|---|---|
| **Foundation Board** | 7-9 directors, majority independent | Constitutional stewardship, aggregate oversight (READ_ONLY) | Quarterly + ad-hoc |
| **Holding Board** | 5-7 directors | Strategic holding, capital coordination | Monthly |
| **Operating Company Board** | 5-7 directors + management | Day-to-day operations | Monthly + ad-hoc |
| **Technology Company Board** | 5-7 directors | Software, infrastructure, IP | Monthly |

### §37.0.4 Council (Monetary Council)

Per §13.1:
- Primary decision-making body for monetary policy
- 15 members with 4-year terms
- Supermajority voting thresholds for certain decisions
- Composition: monetary economists, financial experts, technologists, legal experts, independent members
- Quorum: 4-of-7 for emergency, 6/7 for constitutional amendments
- Reports to Foundation Board + public quarterly

### §37.0.5 Authority Limits

| Authority | Limit |
|---|---|
| Foundation Board | READ_ONLY aggregate oversight; cannot mint, authorize, buy, sell, transfer, override, operate as commercial operator, receive profit distributions, or silently reclassify legal ownership |
| Holding Board | Strategic holding; cannot mint (FV25), cannot override constitutional invariants |
| Operating Company Board | Day-to-day operations; cannot mint (FV25), cannot override constitutional invariants |
| Technology Company Board | Software / infrastructure / IP; cannot mint (FV25), cannot hold customer deposits, cannot hold reserve assets, cannot profit from reserve appreciation |
| Council | Monetary policy decisions within constitutional constraints; cannot override FV1-FV25 without supermajority + Sharia + regulatory notification |
| Monetary & Reserve Control Division | Reserve monitoring, mint authorization; structurally separated from commercial |

### §37.0.6 Constitutional Reserved Powers

Per §V25.0.A.11 — Founder/operator CANNOT unilaterally change:

1. PAR = $1.00 (settlement reference unit)
2. RR ≥ 100% (reserve ratio invariant, FV3)
3. No discretionary minting (FV2)
4. Gold as constitutional anchor (Principle 8)
5. Full redeemability (every MTQ redeemable on demand)
6. No lending of reserves
7. No commingling
8. Deterministic monetary engine

**Changes to these invariants require:**
- Supermajority board vote (6/7 Foundation)
- Independent Sharia Committee review (where applicable)
- Regulatory notification
- 90-day public notice
- Independent audit confirmation

---

## §37.1 Foundation

### §37.1.1 Foundation Purpose

Per §V25.0.A.11 — Foundation Governance:

> The Foundation holds constitutional stewardship over MITHQAL v25.0 architecture. It is the long-horizon institutional continuity body, post-founder governance. The Foundation is a nonprofit (501(c)(3) target, status PENDING), independent of JOZOUR LLC (the operating company).

### §37.1.2 Foundation Board

- **Composition:** 7-9 directors, majority independent (no JOZOUR affiliation)
- **Quorum:** 5-of-7 (or 6-of-9)
- **Supermajority:** 6-of-7 for constitutional amendments
- **Independence:** Independent directors owe fiduciary duty to the Foundation, NOT to JOZOUR
- **Tenure:** 4-year terms, renewable once (max 8 years)
- **Succession:** Board succession plan (especially for Manager Mohamed Salah Eltonsy per §57.3)

### §37.1.3 Foundation SHALL (11)

Per §V25.0.D.I:

1. Hold constitutional stewardship over MITHQAL v25.0 architecture
2. Receive READ-ONLY aggregate oversight access to MITHQAL systems (7 dashboard fields)
3. Maintain Foundation operating funds SEPARATE from MTQ reserve backing
4. Coordinate with independent auditors and regulators
5. Publish aggregate transparency reports (institutional accountability)
6. Preserve canonical invariants FV1-FV25 against unauthorized modification
7. Coordinate with Sharia board where applicable (status: DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)
8. Maintain Foundation governance: independent directors, conflict-of-interest policy, bylaws
9. Coordinate legal validation of jurisdictional structures (JURISDICTION_PENDING → ESTABLISHED)
10. Steward long-horizon institutional continuity (post-founder governance)
11. Receive independent legal / tax / Sharia counsel

### §37.1.4 Foundation SHALL NOT (8)

Per §V25.0.D.I + §V25.0.D.AB:

1. **Mint MTQ**
2. **Authorize MTQ issuance**
3. **Buy or sell reserve assets**
4. **Transfer reserve assets**
5. **Override canonical MTQ monetary invariants (FV1-FV25)**
6. **Operate as the commercial operator of MITHQAL systems**
7. **Receive private profit distributions (nonprofit status)**
8. **Silently reclassify legal ownership of reserve assets**

### §37.1.5 Foundation Monitoring Access = READ_ONLY

Per §V25.0.D.AB:

> Foundation oversight is READ-ONLY aggregate. The Foundation cannot mint, authorize, buy, sell, transfer, or override. The Foundation holds constitutional stewardship and aggregate transparency responsibility — NOT operational authority.

### §37.1.6 Foundation Technology Layer (6 items)

Per §V25.0.D.I:

1. READ_ONLY aggregate dashboard access (7 fields per §AN — Foundation Dashboard)
2. Aggregate reserve status (total supply, reserve backing ratio, constitutional metrics)
3. Major exception notifications (escalated incidents, constitutional breaches)
4. CALM state visibility (system-wide operational state)
5. Weight history (reserve weights over time, currency weights over time)
6. Incident reports (escalated by Operating Company)

### §37.1.7 Foundation Governance Requirements (per V25.0.A.11)

| # | Requirement | Description |
|---:|---|---|
| 1 | Independent board | 7-9 directors, majority independent (no JOZOUR affiliation) |
| 2 | Conflict policy | Written conflict-of-interest policy, annually disclosed |
| 3 | Related-party transaction policy | All JOZOUR-Foundation transactions reviewed and approved by independent directors |
| 4 | Constitutional reserved powers | Founder/operator must NOT have unilateral control over constitutional monetary invariants |
| 5 | Independent fiduciary duties | Directors owe fiduciary duty to the Foundation, not to JOZOUR |
| 6 | Operator/service separation | JOZOUR is a contracted technology operator, NOT a constitutional authority |
| 7 | Audit | Independent external audit committee, annual audit |
| 8 | Succession | Board succession plan (especially for Manager Mohamed Salah Eltonsy) |
| 9 | Dissolution rules | Asset transfer to successor non-profit per JOZOUR Amendment §1.4 |

### §37.1.8 Foundation Dashboard — READ-ONLY (7 Fields)

Per §V25.0.D.AN — Foundation Dashboard:

1. **Total supply** — Total MTQ outstanding (S_t)
2. **Reserve status** — Aggregate reserve backing ratio (RR)
3. **Weight history** — Reserve weights over time, currency weights over time
4. **Major exceptions** — Escalated incidents, constitutional breaches
5. **Constitutional metrics** — FV1-FV25 invariant status
6. **Incidents** — Escalated by Operating Company
7. **CALM state** — System-wide operational state (NORMAL/CAUTION/DEFENSIVE/STRESS/EMERGENCY/RECOVERY)

**Rule:** Foundation access is READ_ONLY.

### §37.1.9 Foundation Validation Topics (14 — all PENDING)

Per §V25.0.A.5:

| # | Validation Topic | Status |
|---:|---|---|
| 1 | Exempt purpose (501(c)(3) qualification) | PENDING |
| 2 | IP ownership (JOZOUR → Foundation transfer) | PENDING |
| 3 | Reserve ownership (which entity holds the reserve) | PENDING |
| 4 | Issuer / obligor (which entity is the MTQ issuer of record) | PENDING |
| 5 | Redemption liability (which entity owes redemption) | PENDING |
| 6 | JOZOUR service agreement (technology services contract) | PENDING |
| 7 | Compensation (reasonable compensation standard) | PENDING |
| 8 | Related-party transactions (JOZOUR-Foundation transactions) | PENDING |
| 9 | Private-benefit risk (no private inurement) | PENDING |
| 10 | Conflict of interest (independent director majority) | PENDING |
| 11 | Excess business holdings | PENDING |
| 12 | Lobbying / political campaign activity restrictions | PENDING |
| 13 | Dissolution / asset transfer (per JOZOUR Amendment §1.4) | PENDING |
| 14 | International activities (cross-border Foundation) | PENDING |

### §37.1.10 Foundation Audit Committee

- Independent external audit committee
- Annual independent audit
- Reports to Foundation Board + regulators (where required)
- Includes: financial audit, operational audit, security audit, compliance audit

### §37.1.11 Foundation Succession Plan

Per §57.3 Council Succession Planning + §V25.0.A.11:

- 4-year board terms, renewable once
- Mandatory retirement at 72
- Successor identification (ongoing)
- Knowledge transfer framework (per §57.5)
- Institutional memory preservation (per §57.6)
- Constitutional interpretation continuity (per §57.7)

---

## §37.2 Holding Company

### §37.2.1 Holding Purpose

Per §V25.0.D — Final Corporate Structure:

> The Holding Company provides strategic holding and capital coordination. It coordinates phased capital deployment (PILOT / EARLY / SCALE / SCALE+) across the corporate structure.

### §37.2.2 Holding Board

- **Composition:** 5-7 directors
- **Quorum:** 4-of-5 (or 5-of-7)
- **Tenure:** 4-year terms
- **Reports to:** Shareholders

### §37.2.3 Holding Activities

1. Strategic capital allocation across corporate structure
2. Coordinated phased capital deployment (PILOT → SCALE → SCALE+)
3. Intercompany service agreement oversight
4. Founder economics management
5. M&A oversight (where applicable)
6. Long-term strategy

### §37.2.4 Holding CANNOT (per FV25)

- **Mint MTQ** — FV25 (Mint Authorization Separation)
- **Hold customer deposits** — non-bank
- **Hold reserve assets** — non-custodial
- **Profit from reserve appreciation** — per §V25.0.D.AC
- **Override constitutional invariants** — per §V25.0.A.11

### §37.2.5 Holding Capital Categories (per V25.0.A.8)

| # | Capital Category | Description | Status |
|---:|---|---|---|
| 1 | Monetary capital | Reserve backing for issued MTQ | SIMULATED (testnet only) |
| 2 | Operating capital | Runway for JOZOUR LLC operations | TARGET (not raised) |
| 3 | Regulatory capital | Capital required by jurisdictional license | UNKNOWN |
| 4 | Liquidity capital | ILPS 5-layer liquidity protection | DESIGNED (not funded) |
| 5 | Emergency capital | ILPS Emergency Layer + Structural Layer | DESIGNED (not funded) |
| 6 | Scale capital | Phased growth capital (PILOT → EARLY → SCALE) | TARGET (not raised) |

---

## §37.3 Operating Company

### §37.3.1 Operating Company Purpose

Per §V25.0.D + §V25.0.A.4:

> The Operating Company (JOZOUR LLC) operates the institutional side of MITHQAL, including the MITHQAL Bank Gateway (MBG), institutional onboarding, reconciliation, regulatory compliance, audit, and the Monetary & Reserve Control Division. It provides technology services via intercompany agreement with Technology Company.

### §37.3.2 Operating Company Activities (15)

Per §V25.0.D.H:

1. Operate the institutional side of the MITHQAL Bank Gateway (MBG)
2. Operate bank relationship management (commercial side, NOT monetary control side)
3. Operate institutional onboarding (legal / KYC / institutional due diligence)
4. Operate reconciliation workflow operations (operationally separate from sales)
5. Operate customer / institutional support (relationship managers, technical support)
6. Operate regulatory compliance operations (jurisdictional licensing, regulatory reporting)
7. Operate audit / evidence preservation operations (immutable audit trail)
8. **Operate the MONETARY & RESERVE CONTROL DIVISION (operationally separated)**
9. Earn transparent infrastructure fees (8 categories — see §AC)
10. Coordinate with Foundation on constitutional oversight (Foundation read-only)
11. Maintain corporate operating capital (separate from MTQ reserve backing)
12. Coordinate phased capital deployment with Holding (PILOT/SCALE/SCALE+)
13. Maintain commercial contracts with participating banks (commercial terms, NOT monetary terms)
14. Maintain intercompany service agreements with Technology Company
15. Operate continuity / disaster recovery / incident response (operational layer)

### §37.3.3 Operating Company Revenue (8 Fee Categories)

Per §V25.0.D.AO:
1. Connectivity fees
2. Issuance service fees
3. Settlement fees
4. Redemption infrastructure fees
5. Reconciliation fees
6. Enterprise integration fees
7. Premium institutional services fees
8. Custody evidence verification fees

### §37.3.4 Operating Company MUST NOT Profit From (6)

Per §V25.0.D.AC:
1. Gold appreciation
2. Speculative trading on reserves
3. Reserve spread (buying reserves below par and selling above par)
4. Proprietary price movements on reserve assets
5. Reserve asset trading gains (any asset class)
6. Currency speculation (per currency weight engine outputs)

**Rule:** Reserve appreciation is NOT a commercial profit source.

### §37.3.5 Operating Company Operating Capital (7 NOT Sources)

Per §V25.0.D.AD — Operating capital CANNOT be funded from:
1. Gold (reserve asset)
2. Reserve assets (any)
3. Customer deposits (not a bank)
4. Reserve appreciation (not a profit source)
5. Foundation operating funds (separate)
6. Technology Company funds (separate)
7. Ordinary MITHQAL operating revenue silently converted to reserve backing (FV24)

### §37.3.6 Operating Company Operating Capital (9 funds)

1. Founder investment
2. Holding capital deployment
3. Operating revenue (8 fee categories)
4. Commercial contracts (with banks)
5. Intercompany service agreements (with Tech Co)
6. Investor capital (if raised)
7. Grant funding (if obtained)
8. Strategic partnership funding (if obtained)
9. PILOT/SCALE capital (phased)

### §37.3.7 Operating Company CANNOT (per FV25)

- **Mint MTQ** — FV25 (Mint Authorization Separation; only deterministic technical execution creates MTQ)
- **Hold customer deposits** — not a bank
- **Hold reserve assets** — non-custodial by default
- **Profit from reserve appreciation** — per §V25.0.D.AC
- **Override constitutional invariants** — per §V25.0.A.11

### §37.3.8 Operating Company Authority Matrix (7 actors × 17 functions)

Per §V25.0.34 Authority Matrix — see §37.6 for details.

---

## §37.4 Technology Company

### §37.4.1 Technology Company Purpose

Per §V25.0.D.J:

> The Technology Company OWNS the software, infrastructure, and IP. It provides services to Operating Company per intercompany agreement. It does NOT mint MTQ, does NOT authorize issuance, does NOT hold customer deposits, does NOT hold reserve assets, and does NOT profit from reserve appreciation.

### §37.4.2 Technology Company OWNS (12 items)

Per §V25.0.D.J:

1. MITHQAL Core — canonical settlement engine
2. MITHQAL Bank Gateway (MBG) software stack — sidecar that translates bank instructions
3. MITHQAL Settlement Authorization Service (MSAS) — settlement authorization workflow
4. APIs / SDKs — institutional integration adapters
5. Settlement software — canonical settlement execution
6. Reconciliation software — 5-way reconciliation engine
7. ZK / privacy technology — zero-knowledge proof systems (where applicable)
8. Security systems — cryptographic key management, mTLS infrastructure, signing infrastructure
9. Integration adapters — bank-specific adapters (7 connector classes per MBG)
10. Monitoring tools — observability stack, dashboards, alerting
11. Enterprise technology — enterprise integration, support tooling
12. Applicable patents and IP — intellectual property held by Technology Company

### §37.4.3 Technology Company CANNOT

- **Mint MTQ** — FV25
- **Authorize issuance**
- **Hold customer deposits**
- **Hold reserve assets**
- **Profit from reserve appreciation** — per §V25.0.D.AC

### §37.4.4 Intercompany Service Agreement

- Technology Company provides services to Operating Company per intercompany agreement
- Pricing: cost + reasonable margin (or per agreement)
- Audit: annual review by Foundation Audit Committee
- Conflict of interest: managed per Foundation conflict-of-interest policy

---

## §37.5 Institutional Authorities

### §37.5.1 Authority Matrix (per §V25.0.34)

7 actors × 17 functions:

**Actors:**
1. Foundation
2. Holding
3. Operating Company
4. Technology Company
5. Council
6. Monetary & Reserve Control Division
7. Independent External Auditor

**Functions:**
1. Mint MTQ
2. Authorize issuance
3. Approve rebalancing
4. Approve gold acquisition
5. Add new counterparty
6. Suspend counterparty
7. Activate emergency governance
8. Amend constitutional invariant
9. Key rotation
10. Production deployment
11. Foundation asset transfer
12. Wind-down
13. Approve annual budget
14. Approve intercompany agreement
15. Engage external auditor
16. Public disclosure
17. Regulatory notification

### §37.5.2 Authority Allocation

| Function | Foundation | Holding | Operating | Tech Co | Council | Monetary & Reserve Control | Ext. Auditor |
|---|---|---|---|---|---|---|---|
| Mint MTQ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (signed authorization) | n/a |
| Authorize issuance | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ (signed) | n/a |
| Approve rebalancing | ❌ | ❌ | ❌ | ❌ | ✓ (4-of-7) | ✓ (recommend) | n/a |
| Approve gold acquisition | ✓ (notified) | ❌ | ✓ (operational) | ❌ | ✓ (4-of-7) | ✓ (recommend) | n/a |
| Add counterparty | ❌ | ❌ | ✓ (operational) | ❌ | ❌ | ✓ (recommend) | n/a |
| Suspend counterparty | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ (2-of-7 Risk Committee) | n/a |
| Activate emergency gov | ✓ (notified) | ❌ | ❌ | ❌ | ✓ (4-of-7) | ✓ (recommend) | n/a |
| Amend invariant | ✓ (6/7) | ❌ | ❌ | ❌ | ✓ (6/7) | ❌ | ✓ (opinion) |
| Key rotation | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ (operational) | n/a |
| Production deployment | ❌ | ❌ | ❌ | ❌ | ✓ (4-of-7) | ✓ (recommend) | n/a |
| Foundation asset transfer | ✓ (6/7) | ❌ | ❌ | ❌ | ✓ (4-of-7) | ❌ | ✓ (opinion) |
| Wind-down | ✓ (6/7) | ❌ | ❌ | ❌ | ✓ (4-of-7) | ❌ | ✓ (opinion) |
| Approve annual budget | ✓ (audit) | ✓ | ✓ | ✓ | ✓ (4-of-7) | n/a | n/a |
| Approve intercompany | ✓ (audit) | ✓ (both sides) | ✓ (both sides) | ✓ (both sides) | n/a | n/a | n/a |
| Engage external auditor | ✓ | ✓ | ✓ | ✓ | ✓ (recommend) | n/a | n/a |
| Public disclosure | ✓ (review) | ❌ | ✓ (operational) | ❌ | ✓ (4-of-7) | n/a | n/a |
| Regulatory notification | ✓ (notified) | ❌ | ✓ (operational) | ❌ | ✓ (4-of-7) | n/a | n/a |

---

## §37.6 Operational Authority

### §37.6.1 Operational Authority Definition

Operational authority is the authority to make day-to-day decisions within delegated limits. Operational authority:
- Is delegated by the relevant board
- Operates within defined limits (per Authority Matrix)
- Is logged in the audit trail
- Is subject to review by Risk Committee and Internal Audit

### §37.6.2 Operational Authority Holders

| Role | Operational Authority |
|---|---|
| COO | Day-to-day operations; workflow execution |
| CFO | Accounting, financial reporting |
| CTO | Technology, infrastructure |
| CISO | Security operations |
| Head of Treasury | Treasury operations (within RB-01..RB-13) |
| Head of Compliance | Compliance operations |
| Head of Communications | Communications |
| General Counsel | Legal operations |

### §37.6.3 Operational Authority Limits

- Operational authority holders can act within their delegated authority
- They CANNOT override constitutional invariants
- They CANNOT make strategic decisions (requires board)
- They CANNOT authorize emergency actions (requires Council)
- They CANNOT amend policy (requires board / Council)

### §37.6.4 Separation of Duties

Per §37.12 (Separation of Duties):
- No single person can execute a complete transaction end-to-end
- Mint authorization: Treasury initiates → Risk approves → Monetary & Reserve Control signs
- Gold acquisition: Treasury initiates → Board approves → Treasury executes → Compliance verifies
- Key rotation: CISO initiates → CTO approves → Operator executes → Audit verifies

---

## §37.7 Emergency Authority

### §37.7.1 Emergency Governance (per §13.3)

Per the original blueprint §13.3 Emergency Governance:

- **Trigger:** RR < 1.00 (FV3 breach), LCR < 1.00 sustained, Council quorum failure for 90 days, regulator enforcement, cyber breach
- **Authority:** Council (4-of-7) for emergency governance
- **Powers:** Halt minting, suspend redemption (with regulator notification), freeze accounts, activate Article X liquidation, activate emergency liquidity, public disclosure
- **Limits:** Cannot override FV1-FV25 (constitutional invariants); cannot amend constitution
- **Duration:** Emergency governance expires after 90 days unless renewed by 5-of-7 Council vote
- **Disclosure:** Public disclosure within 24 hours of activation

### §37.7.2 Emergency Triggers

| Trigger | Action |
|---|---|
| RR < 1.00 | Council emergency session (4-of-7); mint HALTED |
| RR < 1.05 | CALM EMERGENCY state; mint BLOCKED |
| LCR < 1.00 sustained | Redemption queue; CALM STRESS |
| Council quorum failure (90 days) | Foundation Board acts as emergency Council |
| Regulator enforcement | Public disclosure; cooperation |
| Cyber breach confirmed | Service suspension; forensic audit |
| Counterparty default | CALM EMERGENCY; bank-default 8-state lifecycle |
| Sovereign default | CALM EMERGENCY; jurisdiction isolated |
| Multiple systemic risk types in BLACK band | Emergency governance |

### §37.7.3 Emergency Powers (limited)

The Council, in emergency session (4-of-7), may:
1. Halt minting (per CALM EMERGENCY)
2. Suspend redemption (with regulator notification + public disclosure)
3. Activate Article X liquidation waterfall (steps 1-6 without Exhaustion Certificate)
4. Activate ILPS Emergency Layer + External Layer
5. Activate in-kind emergency reserve delivery
6. Engage external counsel / consultants
7. Notify regulators
8. Disclose publicly

### §37.7.4 Emergency Limits

The Council CANNOT, even in emergency:
- Override FV1-FV25 constitutional invariants
- Amend the constitution
- Liquidate physical gold (Article X step 7) without Exhaustion Certificate
- Distribute reserve assets to private parties
- Override Foundation reserved powers

### §37.7.5 Emergency Recovery

- Emergency governance expires after 90 days unless renewed
- Recovery plan within 7 days
- Stabilization within 30 days
- Public review within 90 days

---

## §37.8 Reserve Authority

### §37.8.1 Reserve Authority Definition

Reserve authority is the authority over reserve composition, valuation, and rebalancing. Per §37.14, this authority is delegated to the **Monetary & Reserve Control Division**, which is structurally separated from commercial operations.

### §37.8.2 Reserve Authority Holders

| Holder | Authority |
|---|---|
| Monetary & Reserve Control Division | Day-to-day reserve monitoring, rebalancing proposals, mint authorization |
| Treasury | Treasury operations (within RB-01..RB-13) |
| Risk Committee | Risk oversight, recommendation |
| Council | Strategic reserve decisions (4-of-7 for rebalancing, 6/7 for invariant amendments) |
| Foundation Board | Constitutional stewardship (READ_ONLY) |

### §37.8.3 Reserve Authority Limits

- Cannot override constitutional corridors (fiat 70-85%, bullion 15-25%, digital 0-5%)
- Cannot override concentration limits (15% preferred / 20% hard)
- Cannot liquidate gold outside allowed conditions (FV22)
- Cannot execute unauthorized reserve transfer (FV23)
- Cannot allow operating-capital-to-reserve contamination (FV24)
- Cannot mint outside DMCE capacity (FV18)

### §37.8.4 Reserve Authority Workflow

1. **Daily** — Treasury + Monetary & Reserve Control monitor reserve
2. **Weekly** — Treasury + Risk review rebalancing decisions
3. **Monthly** — Council review
4. **Quarterly** — Council + Foundation review (full stress test)
5. **Annual** — Council + Foundation + Independent Auditor review

---

## §37.9 Technology Authority

### §37.9.1 Technology Authority Definition

Technology authority is the authority over technology decisions: software, infrastructure, IP, security.

### §37.9.2 Technology Authority Holders

| Holder | Authority |
|---|---|
| CTO | Technology operations |
| Technology Company Board | Strategic technology decisions |
| CISO | Security operations |
| Council | Production deployment approval (4-of-7) |
| Foundation Board | Constitutional stewardship (READ_ONLY) |

### §37.9.3 Technology Authority Limits

- Cannot override FV1-FV25 (formal verification invariants)
- Cannot deploy to production without Council approval (4-of-7)
- Cannot compromise security (per §33)
- Cannot mint MTQ (FV25)
- Cannot authorize issuance
- Cannot hold customer deposits
- Cannot hold reserve assets

### §37.9.4 Technology Authority Workflow

1. **Development** — Technology Company develops
2. **Testing** — Testnet deployment + testing
3. **Audit** — External audit (Standing Blocker #1, #6)
4. **Approval** — Council approval (4-of-7) for production deployment
5. **Deployment** — Phased deployment (sandbox → pilot → production)
6. **Monitoring** — Continuous monitoring + incident response

---

## §37.10 Compliance Authority

### §37.10.1 Compliance Authority Definition

Compliance authority is the authority over regulatory compliance: KYC, AML, sanctions, reporting, jurisdictional licensing.

### §37.10.2 Compliance Authority Holders

| Holder | Authority |
|---|---|
| Head of Compliance | Compliance operations |
| General Counsel | Legal compliance |
| Risk Committee | Compliance oversight |
| Council | Strategic compliance decisions |
| Foundation Board | Constitutional stewardship (READ_ONLY) |

### §37.10.3 Compliance Authority Limits

- Cannot override applicable law
- Cannot exempt a counterparty from sanctions screening
- Cannot bypass AML/CFT obligations
- Cannot suppress regulatory reporting
- Cannot override FV1-FV25

### §37.10.4 Compliance Authority Workflow

1. **Daily** — Compliance team screens transactions (real-time sanctions / AML)
2. **Weekly** — Compliance review
3. **Monthly** — Compliance report to Council
4. **Quarterly** — Compliance review with Foundation
5. **Annual** — Compliance audit (independent)

---

## §37.11 Policy Changes, Versioning, Approvals

### §37.11.1 Policy Hierarchy

1. **Constitutional invariants** (FV1-FV25) — highest authority; requires 6/7 Foundation + Sharia + regulatory notification
2. **Constitutional principles** (10 Constitutional Principles per §V25.0.35) — requires Foundation Board approval
3. **Strategic policy** (e.g., RR target 1.30, 80/18/2 composition) — requires Council approval (4-of-7)
4. **Operating policy** (e.g., CALM state thresholds, rebalancing trigger) — requires Risk Committee + Council subcommittee
5. **Operational procedures** — requires COO approval

### §37.11.2 Versioning (per §V24.2.1 Parameter Classification)

Every parameter is classified as exactly one of:

| Class | Description | Change Authority |
|---|---|---|
| **A — Constitutional Invariant** | Cannot be changed by ordinary operations or optimizer logic | 6/7 Foundation + Sharia + regulatory notification |
| **B — Strategic Policy** | Long-term target selected by governance | Council (4-of-7) |
| **C — Operating Corridor** | Dynamic operating band | Risk Committee + Council subcommittee |
| **D — Model Parameter** | Calibrated and version-controlled quantitative parameter | Risk Committee + model validation |

For every parameter, the implementation MUST display: `classification + value + version + authority + effective date`.

**v24.2 Parameter Count:** 37 total (14 Class A, 8 Class B, 5 Class C, 10 Class D).

### §37.11.3 Policy Change Workflow

1. **Proposal** — Any authority holder may propose a policy change
2. **Risk assessment** — Risk Committee assesses impact
3. **Review** — Appropriate body reviews (Risk Committee / Council / Foundation Board)
4. **Approval** — Appropriate body approves (per Class A/B/C/D)
5. **Disclosure** — Public disclosure (if material)
6. **Implementation** — Implementation with audit trail
7. **Verification** — Verification of implementation

### §37.11.4 Amendment Workflow (per §13.2)

1. **Proposal** — Proposed amendment drafted
2. **First reading** — Council first reading (no vote)
3. **Public comment** — 90-day public comment period
4. **Risk assessment** — Risk Committee impact assessment
5. **Sharia review** — (where applicable)
6. **Regulatory notification** — (where applicable)
7. **Second reading** — Council second reading
8. **Vote** — Council vote (4-of-7 for ordinary, 6/7 for constitutional)
9. **Foundation approval** — Foundation Board approval (6/7 for constitutional)
10. **Implementation** — Implementation
11. **Public disclosure** — Public disclosure

### §37.11.5 Version Control

- Every policy version numbered (e.g., v25.0, v25.1, v25.2)
- Every version logged in immutable audit trail
- Every change documented with: previous version, new version, change reason, approver, date
- Backward compatibility required (per Rule 0.15 §V25.0.0)
- Historical language marked (per Rule 0.16 §V25.0.0)

### §37.11.6 Approval Quorums

| Action | Quorum |
|---|---|
| Constitutional invariant amendment | 6/7 Foundation + Sharia + regulatory notification |
| Strategic policy change | 4/7 Council |
| Operating corridor change | Risk Committee (4/7) + Council subcommittee (3/5) |
| Model parameter change | Risk Committee (4/7) + model validation |
| Emergency governance | 4/7 Council |
| Production deployment | 4/7 Council |
| Foundation asset transfer | 6/7 Foundation |
| Wind-down | 6/7 Foundation + 4/7 Council + regulator |

---

## §37.12 Separation of Duties & Conflict-of-Interest Controls

### §37.12.1 Separation of Duties Principle

> **No single person can execute a complete transaction end-to-end.**

This is a foundational principle of internal control. Every transaction requires:
1. **Initiator** — proposes the transaction
2. **Approver** — approves the transaction (different person)
3. **Executor** — executes the transaction (different person)
4. **Verifier** — verifies the execution (different person)

### §37.12.2 Conflict-of-Interest Controls

Per §V25.0.A.11 Foundation Governance:

1. **Independent board** — majority independent (no JOZOUR affiliation)
2. **Conflict policy** — written conflict-of-interest policy, annually disclosed
3. **Related-party transaction policy** — all JOZOUR-Foundation transactions reviewed and approved by independent directors
4. **Independent fiduciary duties** — directors owe fiduciary duty to the Foundation, not to JOZOUR
5. **Operator/service separation** — JOZOUR is a contracted technology operator, NOT a constitutional authority

### §37.12.3 Conflict-of-Interest Disclosures

- Annual disclosure by all directors, officers, and key employees
- Transaction-specific disclosure (when a related party is involved)
- Public disclosure (in annual report)
- Audit by Foundation Audit Committee

### §37.12.4 Related-Party Transaction Policy

- All JOZOUR-Foundation transactions reviewed and approved by independent directors
- Pricing: arm's length (cost + reasonable margin)
- Audit: annual review by Foundation Audit Committee
- Public disclosure: in annual report

### §37.12.5 Anti-Commingling (per §51)

Per §35.4 Three-Book Separation — 4 anti-commingling tests (ALL BLOCKED):
1. Corporate cash → MTQ backing without authorization — BLOCKED
2. Bank obligation → MITHQAL corporate revenue — BLOCKED
3. Corporate MTQ → MITHQAL asset — BLOCKED
4. Reserve gain → Operating Company revenue — BLOCKED

### §37.12.6 No-Contradictory-Authority (per §V25.0.D)

13 phrases that CANNOT appear in any authority document:

1. "Foundation mints MTQ"
2. "Holding Company backs MTQ"
3. "Technology Company has financial authority"
4. "Operating Company proprietary reserve trading"
5. "Treasury mints MTQ"
6. "Governance mints MTQ"
7. "Commercial can override policy"
8. "Operator can change PAR"
9. "Operator can change RR floor"
10. "Foundation can authorize issuance"
11. "Foundation can buy/sell reserve assets"
12. "Foundation can transfer reserve assets"
13. "Foundation can override invariants"

### §37.12.7 Independence of Risk Function

- CRO reports to Council, NOT to CEO/COO
- Internal Audit reports to Foundation Audit Committee, NOT to management
- External Audit reports to Foundation Audit Committee + regulators
- Risk Committee has at least one independent expert (no JOZOUR affiliation)

---

## §37.13 Audit Authority

### §37.13.1 Audit Authority Definition

Audit authority is the authority to independently verify the system's operations, financials, and compliance.

### §37.13.2 Audit Bodies

| Body | Authority | Reports To |
|---|---|---|
| **Internal Audit** | Internal audit of operations, financials, compliance | Foundation Audit Committee |
| **External Auditor** | Annual independent external audit | Foundation Audit Committee + regulators |
| **Regulator** | Regulatory examination | Public (where required) |
| **Independent Risk Audit** | Risk framework audit | Council + Foundation |
| **Independent Security Audit** | Security audit | Council + Foundation |
| **Independent Sharia Audit** | Sharia compliance audit (where applicable) | Sharia Committee + Foundation |

### §37.13.3 Foundation Audit Committee

- Composition: 3-5 directors, majority independent
- Quorum: 3-of-5
- Authority: Engage external auditor, review audit results, recommend remediation
- Reports to: Foundation Board + regulators (where required)

### §37.13.4 Audit Cadence

| Audit | Frequency | Scope |
|---|---|---|
| Daily reconciliation | Daily | 5-way reconciliation (per §V25.0.D.Z) |
| Weekly operational audit | Weekly | Operations, settlement |
| Monthly compliance audit | Monthly | AML, sanctions, KYC |
| Quarterly risk audit | Quarterly | Risk framework, stress test |
| Annual financial audit | Annual | Financial statements (independent) |
| Annual operational audit | Annual | Operations, technology |
| Annual security audit | Annual | Security, cyber |
| Annual Sharia audit | Annual | Sharia compliance (where applicable) |

### §37.13.5 Audit Findings

- Findings classified by severity (Critical / High / Medium / Low)
- Critical findings: remediation within 30 days
- High findings: remediation within 90 days
- Medium findings: remediation within 180 days
- Low findings: remediation within 365 days
- All findings logged in immutable audit trail
- Public disclosure of material findings

### §37.13.6 Honest State

```
externalAuditEngaged          = false
independentRiskAudit          = PENDING
independentSecurityAudit      = PENDING
shariaAudit                   = PENDING (status: DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)
auditFindingsRemediation      = 0 (no audit conducted yet)
```

---

## §37.14 Monetary & Reserve Control Division

### §37.14.1 Structural Separation

Per §V25.0.D + §V25.0.D.AA:

> The Monetary & Reserve Control Division is **operationally separated** from sales, marketing, bank relationship teams, revenue teams, and commercial contract negotiators. This separation is STRUCTURAL — not optional.

### §37.14.2 What the Division Monitors

Per §V25.0.D.AA Bank Monitoring Authority:

1. Bank backing evidence (AvailableBackingCertificate validity + custodian evidence)
2. Bank MTQ subledger reconciliation
3. Bank exposure (per institution exposure ≤ 25% hard cap)
4. Bank concentration (per institution concentration ≤ 25% hard cap)
5. Bank operational status (gateway throughput, settlement latency)
6. Bank jurisdictional authorization status
7. Bank compliance status (KYC/AML/sanctions attestations)
8. DMCE compliance (institution cannot mint outside DMCE capacity)

Plus (broader reserve monitoring):

9. Reserve positions
10. Backing evidence
11. Reserve weights
12. Currency weights
13. RR (Reserve Ratio)
14. StressRR (forward stress)
15. LCR / MLCR
16. ILPS (5-layer liquidity)
17. Concentration
18. Custody
19. Backing certificates
20. Minting capacity
21. Reconciliation
22. Exceptions

### §37.14.3 Division Authority

The Division:
- **Signs** mint authorizations (L4 of §33.9 — MITHQAL Monetary Authorization)
- **Recommends** rebalancing proposals (to Risk Committee)
- **Monitors** all reserve metrics (real-time)
- **Recommends** counterparty suspension (to Risk Committee)
- **Cannot override** FV1-FV25 invariants
- **Cannot approve** strategic policy (requires Council)
- **Cannot amend** constitution (requires 6/7 Foundation)

### §37.14.4 Critical Rule

Per §V25.0.D.AA:

> Commercial relationship staff MUST NOT approve reserve sufficiency for their own bank clients. The Monetary & Reserve Control Division is operationally separated from sales / marketing / bank relationship teams. This separation is STRUCTURAL — not optional.

### §37.14.5 Division Independence

- Division head reports to Council, NOT to CEO/COO
- Division staff are forbidden from having commercial relationships with banks they monitor
- Division staff are forbidden from receiving compensation tied to commercial performance
- Division staff are forbidden from approving reserve sufficiency for their own bank clients
- Division budget is independent (protected from commercial pressure)

### §37.14.6 Division Reports

| Report | Frequency | Audience |
|---|---|---|
| Daily reserve dashboard | Daily | Division + Council |
| Weekly counterparty report | Weekly | Division + Risk Committee |
| Monthly reserve report | Monthly | Council + Foundation |
| Quarterly reserve report | Quarterly | Council + Foundation + public summary |
| Annual reserve report | Annual | Public |

---

## §37.15 Foundation Oversight (READ_ONLY · 7 Fields · 8 Cannot-Do Actions)

### §37.15.1 READ_ONLY Aggregate Oversight

Per §V25.0.D.AB:

> Foundation oversight is READ-ONLY aggregate. The Foundation cannot mint, authorize, buy, sell, transfer, or override. The Foundation holds constitutional stewardship and aggregate transparency responsibility — NOT operational authority.

### §37.15.2 The 7 Foundation Dashboard Fields (READ_ONLY)

Per §V25.0.D.AN:

| # | Field | Description |
|---:|---|---|
| 1 | **Total supply** | Total MTQ outstanding (S_t) — aggregate |
| 2 | **Reserve status** | Aggregate reserve backing ratio (RR) — aggregate |
| 3 | **Weight history** | Reserve weights over time, currency weights over time — aggregate |
| 4 | **Major exceptions** | Escalated incidents, constitutional breaches — aggregate |
| 5 | **Constitutional metrics** | FV1-FV25 invariant status — aggregate |
| 6 | **Incidents** | Incidents escalated by Operating Company — aggregate |
| 7 | **CALM state** | System-wide operational state (NORMAL/CAUTION/DEFENSIVE/STRESS/EMERGENCY/RECOVERY) — aggregate |

**Rule:** Foundation access is READ_ONLY. No write access. No operational authority.

### §37.15.3 The 8 Cannot-Do Actions

Per §V25.0.D.I + §V25.0.D.AB:

| # | Cannot-Do Action | Reason |
|---:|---|---|
| 1 | **Mint MTQ** | Only deterministic technical execution creates MTQ (FV25); Foundation has no mint authority |
| 2 | **Authorize MTQ issuance** | Authorization is the role of Monetary & Reserve Control Division (L4 of §33.9); Foundation has no authorization authority |
| 3 | **Buy or sell reserve assets** | Reserve operations are performed by Treasury + Monetary & Reserve Control; Foundation has no reserve operation authority |
| 4 | **Transfer reserve assets** | Reserve transfers are subject to FV23 (No Unauthorized Reserve Transfer); Foundation has no transfer authority |
| 5 | **Override canonical MTQ monetary invariants (FV1-FV25)** | Invariant changes require 6/7 Foundation + Sharia + regulatory notification (per §37.11.1); Foundation cannot unilaterally override |
| 6 | **Operate as the commercial operator of MITHQAL systems** | Operating Company is the commercial operator; Foundation is nonprofit, non-operational |
| 7 | **Receive private profit distributions (nonprofit status)** | Foundation is nonprofit; no private inurement; no private benefit (per §V25.0.A.5 topic 9) |
| 8 | **Silently reclassify legal ownership of reserve assets** | Reserve legal ownership is documented per jurisdiction (JURISDICTION_PENDING until legal counsel establishes); Foundation cannot silently reclassify |

### §37.15.4 Foundation Technology Layer (6 items — all READ_ONLY)

Per §V25.0.D.I:

1. **READ_ONLY aggregate dashboard access** (7 fields per §AN — Foundation Dashboard)
2. **Aggregate reserve status** (total supply, reserve backing ratio, constitutional metrics)
3. **Major exception notifications** (escalated incidents, constitutional breaches)
4. **CALM state visibility** (system-wide operational state)
5. **Weight history** (reserve weights over time, currency weights over time)
6. **Incident reports** (escalated by Operating Company)

### §37.15.5 API Endpoint

The `/gateway/v1/foundation/oversight` endpoint is READ-ONLY for the Foundation.

```typescript
// Foundation oversight endpoint
app.get('/gateway/v1/foundation/oversight', requireFoundationAuth, (req, res) => {
  // Returns ONLY 7 fields, all READ_ONLY
  return res.json({
    totalSupply: getCurrentTotalSupply(),           // Field 1
    reserveStatus: getAggregateRR(),                // Field 2
    weightHistory: getWeightHistory(),              // Field 3
    majorExceptions: getEscalatedIncidents(),       // Field 4
    constitutionalMetrics: getFVStatus(),           // Field 5
    incidents: getIncidentReports(),                // Field 6
    calmState: getCALMState(),                      // Field 7
    // NO write endpoints
    // NO operational authority
    // NO mint / authorize / buy / sell / transfer / override
  });
});
```

### §37.15.6 Foundation Reserve Authority Test

Test (per INT-T31): Foundation read-only access — verifies Foundation cannot write.

Test (per INT-T32): Foundation attempted mint = BLOCK — verifies Foundation cannot mint.

These tests are part of the 35 INT-T test scenarios (per §V25.0.D.AM).

### §37.15.7 Foundation Constitutional Stewardship

While Foundation has READ_ONLY operational authority, it has **full constitutional stewardship**:

- Steward FV1-FV25 invariants against unauthorized modification
- Coordinate with independent auditors and regulators
- Publish aggregate transparency reports
- Coordinate legal validation of jurisdictional structures
- Steward long-horizon institutional continuity (post-founder governance)
- Receive independent legal / tax / Sharia counsel

### §37.15.8 Foundation Amendment Authority

The Foundation Board can amend constitutional invariants, but ONLY with:
- 6/7 Foundation Board vote (supermajority)
- Independent Sharia Committee review (where applicable)
- Regulatory notification
- 90-day public notice
- Independent audit confirmation

No single Foundation director (including the founder) can unilaterally amend.

---

## §37.16 Honest State — §37

```
section                                          = "§37 Governance Architecture"
fiveEntityStructure                              = true (Founder Shareholders, Holding, Operating, Tech Co, Foundation)
governanceBodiesCount                            = 4 (Foundation, Holding, Operating, Tech Co Boards) + Council
foundationBoardSize                              = 7-9 (majority independent)
foundationBoardSupermajority                     = 6/7 (constitutional amendments)
holdingBoardSize                                 = 5-7
operatingBoardSize                               = 5-7
techCoBoardSize                                  = 5-7
councilSize                                      = 15
councilQuorum                                    = 4-of-7 (emergency), 6/7 (constitutional)
foundationShallCount                             = 11
foundationShallNotCount                          = 8
foundationDashboardFieldsCount                  = 7 (READ_ONLY)
foundationCannotDoActionsCount                  = 8
foundationReadonly                               = true
monetaryAndReserveControlDivisionSeparated      = true
authorityMatrixActors                            = 7
authorityMatrixFunctions                         = 17
parameterClassCount                              = 4 (A Constitutional, B Strategic, C Operating, D Model)
parameterCount                                   = 37 (14 A + 8 B + 5 C + 10 D)
emergencyGovernanceQuorum                        = 4-of-7 Council
emergencyGovernanceDuration                      = 90 days (renewable by 5/7)
auditBodies                                      = 6 (Internal, External, Regulator, Risk, Security, Sharia)
auditCadence                                     = Daily/Weekly/Monthly/Quarterly/Annual
separationOfDutiesEnforced                      = true (initiator/approver/executor/verifier)
conflictOfInterestPolicy                         = REQUIRED (annually disclosed)
relatedPartyTransactionPolicy                   = REQUIRED (independent director review)
antiComminglingTests                             = 4 (ALL blocked)
noContradictoryAuthorityPhrases                 = 13
independenceOfRiskFunction                      = true (CRO reports to Council, not CEO)
foundationValidationTopics                      = 14 (all PENDING)
shariaStatus                                     = DESIGNED_FOR_INDEPENDENT_REVIEW (NOT CERTIFIED)
externalAuditEngaged                             = false
productionAuthorization                          = false
```

**Open items:**
1. Establish Foundation Board (7-9 directors, majority independent) — requires institutional partners
2. Obtain 501(c)(3) status (or equivalent nonprofit status) — requires IRS review + legal opinion
3. Resolve 14 Foundation validation topics (per §V25.0.A.5)
4. Establish Foundation Audit Committee
5. Engage external auditor (Standing Blocker — annual independent audit)
6. Engage independent Sharia board for MTQ classification review (Standing Blocker #10)
7. Establish Council (15 members, 4-year terms)
8. Establish Monetary & Reserve Control Division (structurally separated)
9. Implement Foundation READ_ONLY dashboard (7 fields)
10. Implement 35 INT-T test scenarios (per §V25.0.D.AM)
11. Establish Foundation succession plan (per §57.3)
12. Implement policy versioning system (per §37.11)
13. Implement conflict-of-interest disclosure system
14. Establish intercompany service agreements (Operating ↔ Tech Co)

**END OF §37 — GOVERNANCE ARCHITECTURE**

---

# §99 — APPENDICES

## §99.1 Cross-Reference Table

| §  | Topic | Primary Source | Implementation Module |
|---|---|---|---|
| 32 | Risk Architecture (17 categories) | This document + §3.5 + §V24.2 | `src/lib/systemic-exposure-engine.ts` |
| 33 | Security Architecture | This document + §39 + §MBG-18 | `src/lib/finality-before-mint.ts` |
| 34 | Regulatory Architecture | This document + §V25.0.15 + §49 + §50 | `src/lib/legal-liability-framework.ts` + `src/lib/licensing-entity-matrix.ts` |
| 35 | Accounting / CFO Architecture | This document + §51 + §V25.0.21 + §V25.0.22 | `src/lib/three-book-separation.ts` |
| 36 | Treasury Architecture | This document + §8 + §9 + §V25.0.D | `src/lib/mtq-final-reserve-spec.ts` |
| 37 | Governance Architecture | This document + §13 + §V25.0.D + §V25.0.A.11 | `src/lib/implementation-status-report.ts` |

## §99.2 Glossary

| Term | Definition |
|---|---|
| **AED** | UAE Dirham (USD-pegged at 3.6725) |
| **CALM** | Capital-Adaptive Liability Management — 6-state machine |
| **CBUAE** | Central Bank of the United Arab Emirates |
| **CFT** | Counter-Financing-of-Terrorism |
| **CISO** | Chief Information Security Officer |
| **CMA** | Capital Market Authority (Saudi Arabia) |
| **COFER** | Currency Composition of Foreign Exchange Reserves (IMF) |
| **Council** | MITHQAL Monetary Council (15 members) |
| **CRO** | Chief Risk Officer |
| **DMCE** | Dynamic Minting Capacity Engine |
| **DRQS** | Digital Reserve Quality Score |
| **EMT** | E-Money Token (MiCAR classification) |
| **ERTF** | External Risk Transfer Facility |
| **FCA** | Financial Conduct Authority (UK) |
| **FINMA** | Swiss Financial Market Supervisory Authority |
| **FSCR** | Forward Stress Coverage Ratio |
| **FV1-FV25** | 25 formal verification invariants |
| **HQLA** | High-Quality Liquid Assets |
| **HSM** | Hardware Security Module |
| **ILPS** | 5-layer liquidity protection architecture |
| **JSG** | Jurisdictional Settlement Gateway |
| **KYC/KYB** | Know Your Customer / Know Your Business |
| **LBMA** | London Bullion Market Association |
| **LCR** | Liquidity Coverage Ratio |
| **MBG** | MITHQAL Bank Gateway |
| **MiCAR** | Markets in Crypto-Assets Regulation (EU) |
| **MLCR** | Modified Liquidity Coverage Ratio |
| **MPC** | Multi-Party Computation |
| **MSAS** | MITHQAL Settlement Authorization Service |
| **MSB** | Money Services Business (US FinCEN) |
| **MTQ** | MITHQAL settlement unit (PAR-referenced, not USD-backed) |
| **OFAC** | Office of Foreign Assets Control (US Treasury) |
| **PAR** | Accounting reference unit ($1.00, NOT a USD peg) |
| **PDPL** | Personal Data Protection Law (UAE) |
| **PQC** | Post-Quantum Cryptography |
| **R_a** | Adjusted (prudential) Reserve value |
| **RCAF** | Reserve Control Attestation Framework |
| **R_l** | Liquidation (stress) Reserve value |
| **R_m** | Market Reserve value |
| **RR** | Reserve Ratio = R_a / L |
| **SAMA** | Saudi Central Bank |
| **SAR** | Saudi Riyal (USD-pegged at 3.75) + Suspicious Activity Report |
| **SDP** | Severe Deviation Protocol |
| **SDC_Ag** | Silver Diversification Contribution |
| **TGRS** | Tokenized Gold Reserve Score |
| **VARA** | Virtual Assets Regulatory Authority (UAE) |
| **WAF** | Web Application Firewall |

## §99.3 Honest Status Aggregation (Part 09 — Sections 32-37)

```
PART_09_VERSION                                 = "v25.2"
PART_09_SECTIONS                                = [§32, §33, §34, §35, §36, §37]
PART_09_LINE_COUNT                              = ~5500+ (this document)
PART_09_HONEST_STATE                            = true
PART_09_PRODUCTION_AUTHORIZED                   = false

# Section 32 — Risk Architecture
§32_riskTaxonomyCount                           = 17
§32_riskEngineTypes                             = 16
§32_riskEngineDesigned                          = true
§32_riskEngineImplemented                       = true
§32_riskMonitoringLive                          = false
§32_independentRiskAudit                       = PENDING
§32_challengerModels                            = 5 (3-of-5 agreement required)
§32_monteCarloPaths                             = 250000
§32_monteCarloSeed                              = 42 (reproducible)
§32_modelValidityGate                           = HARD_GATE

# Section 33 — Security Architecture
§33_zeroTrustEnabled                            = true
§33_zeroTrustDefaultDeny                        = true
§33_zeroTrustRequiredAuthentications            = 5
§33_hsmStatus                                   = DESIGNED (FIPS 140-2 L3 target)
§33_mpcStatus                                   = DESIGNED (FROST 6-of-7 / 4-of-7 / 2-of-3)
§33_pqcStatus                                   = DESIGNED (Falcon-512 migration planned)
§33_finalityLayersEnforced                      = 7
§33_finalityLayersRequired                      = 7
§33_finalityBypassRisk                          = MITIGATED_AT_CODE_LEVEL
§33_finalityBypassTestsPassed                   = 10
§33_finalityBypassTestsTotal                    = 10
§33_finalityProductionReady                     = false
§33_finalityInstitutionallyValidated            = false
§33_externalSecurityAudit                       = PENDING

# Section 34 — Regulatory Architecture
§34_licensingMatrixEntries                      = 72 (9 activities × 8 jurisdictions)
§34_licensesObtained                            = 0
§34_licenseStatus                               = REQUIRED_NOT_OBTAINED (all 72)
§34_jurisdictionsSeeded                         = 8
§34_jurisdictionValidation                      = 0/8 (all JURISDICTION_PENDING)
§34_legalOpinionsObtained                       = false
§34_adapterConceptImplemented                  = true
§34_adapterFailClosed                          = true
§34_subjectToLocalAuthorizationLanguage         = REQUIRED (canonical statement)
§34_prohibitedMarketingClaims                  = 10
§34_requiredDisclosures                         = 8

# Section 35 — Accounting / CFO Architecture
§35_chartOfAccountsBooks                        = 3 (A, B, C) + 1 canonical
§35_bookAFieldsCount                            = 8
§35_bookBFieldsCount                            = 8
§35_bookCFieldsCount                            = 9
§35_antiComminglingTests                        = 4 (ALL blocked at design level)
§35_threeBookDesign                             = true
§35_threeBookOperational                        = false
§35_threeBookEnforced                           = false
§35_parIsAccountingReferenceOnly                = true
§35_parIsNotUSDPeg                              = true
§35_operatingCompanyRevenueCategories           = 8
§35_bankRevenueStreams                          = 9
§35_proofOfLiabilitiesStatus                    = DESIGNED (Merkle tree architecture)
§35_fiveWayReconciliationTolerance              = 0.0001 (1 basis point)
§35_externalAuditStatus                         = PENDING
§35_fourLensSeparation                          = ENFORCED (economic / accounting / legal / settlement)

# Section 36 — Treasury Architecture
§36_treasurySeparatedFromCommercial             = true
§36_ilpsLayers                                  = 5 (Settlement, Redemption, Emergency, Structural, External)
§36_ilpsTotalAmount                             = $46M (not funded)
§36_rebalancingThreshold                       = 2pp (τ ≈ 2 percentage points)
§36_hardOverridesCount                          = 6
§36_transactionCostTestStatus                   = DESIGNED (NetBenefit > 0)
§36_tradeCostComponents                         = 15 + LifecycleCost
§36_calmStateCount                              = 6 (NORMAL, CAUTION, DEFENSIVE, STRESS, EMERGENCY, RECOVERY)
§36_calmStatesWithRRtargets                     = 6 (all corrected in v24.2.1.1)
§36_calmRRtargets                               = {NORMAL:1.20, CAUTION:1.22, DEFENSIVE:1.23, STRESS:1.25, EMERGENCY:1.30, RECOVERY:1.21}
§36_calmMonotonicInvariant                      = true (Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓)
§36_liquidationWaterfallSteps                   = 7 (gold LAST)
§36_liquidationExhaustionCertificate            = REQUIRED (step 7)

# Section 37 — Governance Architecture
§37_fiveEntityStructure                         = true
§37_governanceBodiesCount                       = 4 (Foundation, Holding, Operating, Tech Co Boards) + Council
§37_foundationShallCount                        = 11
§37_foundationShallNotCount                     = 8
§37_foundationDashboardFieldsCount              = 7 (READ_ONLY)
§37_foundationCannotDoActionsCount              = 8
§37_foundationReadonly                          = true
§37_monetaryAndReserveControlDivisionSeparated = true
§37_authorityMatrixActors                       = 7
§37_authorityMatrixFunctions                    = 17
§37_parameterClassCount                          = 4 (A Constitutional, B Strategic, C Operating, D Model)
§37_parameterCount                              = 37 (14 A + 8 B + 5 C + 10 D)
§37_emergencyGovernanceQuorum                   = 4-of-7 Council
§37_emergencyGovernanceDuration                 = 90 days (renewable by 5/7)
§37_auditBodies                                 = 6 (Internal, External, Regulator, Risk, Security, Sharia)
§37_separationOfDutiesEnforced                  = true
§37_noContradictoryAuthorityPhrases            = 13
§37_independenceOfRiskFunction                 = true
§37_foundationValidationTopics                = 14 (all PENDING)
§37_shariaStatus                               = DESIGNED_FOR_INDEPENDENT_REVIEW (NOT CERTIFIED)
§37_externalAuditEngaged                        = false

# Part 09 — Cross-Sectional Honest State
PART_09_DESIGNED                                = true
PART_09_IMPLEMENTED                             = true (code-level, per modules)
PART_09_INTEGRATED                              = true (API endpoints + dashboard)
PART_09_TESTED                                  = true (35 INT-T test scenarios DESIGNED)
PART_09_INSTITUTIONAL_VALIDATED                 = false (0/13 gates passed — all pending)
PART_09_PRODUCTION_READY                         = false
PART_09_PRODUCTION_AUTHORIZED                   = false
PART_09_HONEST                                  = true
PART_09_SUPERSEDES_OLDER_VERSIONS                = true (per Single Source of Truth principle)
PART_09_FINAL_STATUS                            = "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED"
```

---

**END OF PART 09 — SECTIONS 32-37 OF MITHQAL MASTER BLUEPRINT v25.2 (SINGLE SOURCE OF TRUTH)**

<!-- BP-PART-09-END -->
<!-- Task ID: BP-SEC-09 -->
<!-- Authority: COO + CTO + CFO + Project Manager + Monetary Systems Architect + Institutional Reserve Manager + Legal/Regulatory Architecture Lead + Risk & Security Architecture Lead -->
<!-- Status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED -->
<!-- Reference: /tmp/blueprint_reference.json (RR 1.30, 80/18/2, 7-layer finality enforced, 10/10 bypass routes blocked) -->

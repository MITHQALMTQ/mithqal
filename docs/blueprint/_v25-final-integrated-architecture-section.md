# §V25.0 — FINAL INTEGRATED INSTITUTIONAL / BANKING / RESERVE / GOLD / REBALANCING ARCHITECTURE

> _This section is the final cross-section reconciliation of v25.0. It builds on top of §V25.0.A (Third-Party Audit Incorporation), §V25.0.B (Bank-Funded Issuance Model), and §V25.0.C (Non-Custodial Reserve Architecture). It does NOT create v25.1, does NOT fork the architecture, does NOT redesign the reserve mathematics, and does NOT create a competing rebalancing algorithm._

## §V25.0.D.0 — Purpose and Scope

This section reconciles the entire v25.0 architecture into one integrated blueprint covering: corporate structure, banking integration, MTQ position, reserve architecture, gold acquisition, rebalancing, custody, reconciliation, DMCE (Dynamic Minting Capacity Engine), dashboards, APIs, data models, tests, and 8 new formal-verification invariants (FV18-FV25).

**Critical Version Rule:**

- DO NOT create v25.1
- DO NOT create v26
- DO NOT fork the architecture
- DO NOT redesign the reserve mathematics
- DO NOT create a competing rebalancing algorithm
- DO NOT turn USD into the monetary anchor
- DO NOT make MITHQAL a custodian
- DO NOT make MITHQAL a bank
- DO NOT make the Foundation an operator
- DO NOT make reserve appreciation a commercial profit source
- The document remains: **MITHQAL v25.0 — CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION**

## §V25.0.D.A — Version Control

```
MODULE_VERSION        = "v25.0-final-integrated-architecture-1.0"
TASK_ID               = "V25-0-FINAL-INTEGRATED-ARCHITECTURE"
ARCHITECTURE_VERSION  = "v25.0 (FROZEN — no v25.1 created)"
BLUEPRINT_DESIGNATION = "MITHQAL v25.0 — CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION"
```

| Property | Value |
|----------|-------|
| `currentVersion` | `v25.0` |
| `frozen` | `true` |
| `noV25_1Created` | `true` |
| `noV26Created` | `true` |
| `noArchitectureFork` | `true` |
| `noReserveMathRedesign` | `true` |
| `noCompetingRebalancingAlgorithm` | `true` |
| `noUsdAsMonetaryAnchor` | `true` |
| `mithqalIsNotCustodian` | `true` |
| `mithqalIsNotBank` | `true` |
| `foundationIsNotOperator` | `true` |
| `reserveAppreciationIsNotCommercialProfit` | `true` |

## §V25.0.D.B — 50-Point Reconciliation Principles

The 50 reconciliation principles (P01..P50) constitute the audit checklist for the final integrated architecture:

1. **P01** — v25.0 is the FROZEN NORMATIVE ARCHITECTURE. No v25.1, no v26, no fork.
2. **P02** — The 21.5432% modeled constitutional reserve-breach probability is PRESERVED for Model A.
3. **P03** — The 4.7086% blended breach probability is PRESERVED for Model B and Model C.
4. **P04** — The $15.815M ΔCapital_min remains a MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT (pending independent validation).
5. **P05** — ILPS total is $48.1M (corrected); Emergency + Structural $23.8M is a SUBSET, not additional.
6. **P06** — MITHQAL is NON-CUSTODIAL BY DEFAULT.
7. **P07** — CUSTODY ≠ VERIFICATION ≠ ISSUANCE AUTHORIZATION ≠ CANONICAL SUPPLY CONTROL.
8. **P08** — The MBG is a SIDECAR that TRANSLATES banking instructions into MTQ settlement instructions; it does NOT TRANSFORM the bank's role.
9. **P09** — MTQ is a NEUTRAL, PERMISSIONED, INSTITUTIONAL, WHOLESALE, SETTLEMENT-FOCUSED instrument.
10. **P10** — USD is ONE ELIGIBLE CURRENCY among multiple — NOT the monetary anchor.
11. **P11** — PAR ($1.00) is an ACCOUNTING REFERENCE ONLY — NOT a USD peg.
12. **P12** — Use the term 'PAR-REFERENCED' — NOT 'USD-BACKED'.
13. **P13** — Reserve allocation moves within CONSTITUTIONAL CORRIDORS (fiat 70-85%, bullion 15-25%, digital liquidity 0-5%).
14. **P14** — Do NOT describe 76.5/20/3.5 as immutable constitutional percentages.
15. **P15** — Gold is the PRIMARY bullion anchor; silver is conditional (may be 0%); digital liquidity is subordinate (0-5%).
16. **P16** — Operational digital liquidity is for SETTLEMENT EFFICIENCY — NOT a monetary anchor.
17. **P17** — Three-layer reserve valuation: R_l ≤ R_a ≤ R_m (liquidation ≤ adjusted ≤ market).
18. **P18** — Rebalancing CANNOT create or disappear reserve value (FV19).
19. **P19** — Rebalancing allocation weights ALWAYS sum to 100% (FV20).
20. **P20** — Rebalancing MUST preserve RR, StressRR, LCR, MLCR, concentration limits, allocation corridors, asset eligibility, and redemption capacity.
21. **P21** — If allocation is within approved tolerance → NO REBALANCING TRADE (No-Trade Principle).
22. **P22** — Rebalancing uses PAR-equivalent units — denomination-neutral, NOT USD-denominated.
23. **P23** — Reserve acquisition uses the designated reserve/institutional funding pool — NOT operating capital, NOT founder personal funds, NOT Foundation operating funds, NOT Technology Company funds, NOT ordinary operating revenue silently converted.
24. **P24** — Mint authority is deliberately separated: ISSUANCE_REQUEST → ISSUANCE_AUTHORIZATION → MINT_EXECUTION.
25. **P25** — Banks CANNOT mint MTQ — only the canonical ledger can, after MITHQAL authorization.
26. **P26** — Foundation CANNOT mint, authorize, buy, sell, transfer, or override (read-only aggregate oversight).
27. **P27** — Holding CANNOT mint — it owns subsidiaries, receives dividends, holds enterprise value.
28. **P28** — Technology Company CANNOT mint — it owns software, infrastructure, IP.
29. **P29** — Operating Company CANNOT arbitrarily create MTQ — its commercial staff cannot approve reserve sufficiency for their own bank clients.
30. **P30** — Only deterministic technical execution (canonical ledger) creates MTQ — never discretionary governance action.
31. **P31** — DMCE = MIN(VerifiedEligibleBacking, LegallyReservedBacking, InstitutionalRiskLimit, LiquidityLimit, JurisdictionLimit, ExposureLimit, ConcentrationLimit, OperationalLimit).
32. **P32** — DMCE is the canonical policy/control concept; do NOT interpret as a fixed legal formula until independently validated.
33. **P33** — AvailableBackingCertificate is EVIDENCE — NOT custody, NOT a transfer of assets to MITHQAL.
34. **P34** — RCAF (Reserve Control & Attestation Framework) requires 18 mandatory fields per §V25.0.C.5.
35. **P35** — 15-step issuance authorization gate: ANY FAILURE = BLOCK.
36. **P36** — 5-way reconciliation — 7 states (VERIFIED/WARNING/MISMATCH/CRITICAL/EXPIRED/UNAVAILABLE/LOCKED).
37. **P37** — 4-source trust model (Bank + Custodian + MITHQAL + Independent); minimum 2 sources required.
38. **P38** — MITHQAL does NOT profit from gold appreciation, speculative trading, reserve spread, or proprietary price movements.
39. **P39** — MITHQAL MAY earn transparent infrastructure fees (8 categories).
40. **P40** — Operating capital is SEPARATE from constitutional reserve assets.
41. **P41** — 6 capital categories: (A) MTQ reserve/backing, (B) Bank funding, (C) MITHQAL operating, (D) Regulatory, (E) Liquidity, (F) Emergency — SEPARATE, doNotAutoCombine=true.
42. **P42** — Bank failure / custodian failure / gateway outage / reserve asset disqualification produce CONTROLLED outcomes — no false settlement, no fund loss.
43. **P43** — Foundation dashboard is READ-ONLY (7 fields); MITHQAL Monetary Control Dashboard (20 fields); Bank Dashboard (6 fields).
44. **P44** — 13 technology services.
45. **P45** — 12 versioned API endpoints (/gateway/v1/*) — all require authentication, authorization, signed requests, idempotency, timestamp, expiry, replay protection.
46. **P46** — FV18-FV25 are 8 NEW invariants.
47. **P47** — 35 integrated test scenarios (INT-T01..INT-T35).
48. **P48** — 7×17 authority matrix — no function may have ambiguous ownership.
49. **P49** — 44 acceptance criteria — each must declare met=true only when independent evidence is present.
50. **P50** — Final status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED. Honest state preserved throughout.

## §V25.0.D.C — Final Corporate Structure (5 Entities)

| Entity | Type | Parent | Children | Legal Status |
|--------|------|--------|----------|---------------|
| FOUNDER_SHAREHOLDERS | FOR_PROFIT | — | MITHQAL_HOLDING | PROPOSED |
| MITHQAL_HOLDING | FOR_PROFIT | FOUNDER_SHAREHOLDERS | OPERATING_CO, TECHNOLOGY_CO | PROPOSED |
| MITHQAL_OPERATING_CO | FOR_PROFIT | MITHQAL_HOLDING | — | PROPOSED |
| MITHQAL_TECHNOLOGY_CO | FOR_PROFIT | MITHQAL_HOLDING | — | PROPOSED |
| MITHQAL_FOUNDATION | NON_PROFIT | — | — | PROPOSED |

**FOUNDER_SHAREHOLDERS** receives:
- Dividends / distributions from MITHQAL Holding per shareholder agreement
- Enterprise value appreciation (subject to legal structure)
- Shareholder governance rights per corporate charter

**FOUNDER_SHAREHOLDERS** does NOT receive:
- Reserve appreciation
- Customer deposits
- Reserve assets
- Foundation assets
- Unauthorized MTQ
- Proprietary reserve trading gains
- Gold / bullion appreciation
- Speculative trading profits on reserves
- Reserve spread profits
- Proprietary price movement gains

**Corporate Structure Rule:** Five-entity structure: Founder Shareholders → MITHQAL Holding → Operating + Technology subsidiaries; MITHQAL Foundation is an INDEPENDENT nonprofit with read-only aggregate oversight. No entity combines custody + monetary control + commercial operations + constitutional oversight. Separation of duties is structural, not optional.

## §V25.0.D.D — Founder Economics

**Revenue Flow:**

```
BANK → MITHQAL Operating Company
MITHQAL Operating Company → Commercial revenue (transparent infrastructure fees)
Commercial revenue → Operating costs (personnel, technology, audit, security, compliance)
Operating costs net → Tax (per jurisdiction)
Tax net → Operating reserves (corporate operating reserve, distinct from MTQ reserve)
Operating reserves net → Corporate profit
Corporate profit → MITHQAL Holding (parent company)
MITHQAL Holding → Retained earnings + dividends to Founder Shareholders + enterprise value
```

**Rule:** Founder economics are CORPORATE, not RESERVE. The founder benefits from corporate enterprise value (operating company dividends, holding company retained earnings) — NOT from reserve appreciation, NOT from customer deposits, NOT from proprietary reserve trading. This separation is structural.

## §V25.0.D.E — MTQ Position (7-Layer Canonical Model)

| Layer | Description |
|-------|-------------|
| LAYER 0 | Sovereign / legal / central-bank framework |
| LAYER 1 | Bank money / CBDC / authorized monetary systems |
| LAYER 2 | MITHQAL Bank Gateway / Sidecar |
| LAYER 3 | MITHQAL Monetary + Settlement Control Layer |
| LAYER 4 | MTQ — Neutral Wholesale Settlement Instrument |
| LAYER 5 | Receiving Bank Gateway |
| LAYER 6 | Receiving Bank / local monetary settlement |

**MTQ IS:** neutral, permissioned, institutional, wholesale, settlement-focused.

**MTQ IS NOT:** sovereign currency, consumer cryptocurrency, retail payment token, USD stablecoin, BRICS currency, CBDC, investment vehicle, speculative asset.

**MTQ Position Rule:** MTQ is a NEUTRAL, PERMISSIONED, INSTITUTIONAL, WHOLESALE, SETTLEMENT-FOCUSED instrument that sits at LAYER 4 of the 7-layer canonical model. It is NOT a sovereign currency (LAYER 0), NOT bank money (LAYER 1), NOT a consumer crypto or retail payment token. It does NOT replace any layer — it TRANSLATES between layers via the MITHQAL Bank Gateway (LAYER 2 / LAYER 5 sidecars).

## §V25.0.D.F — Bank Integration — Final Canonical Model

**Canonical Principle: TRANSLATION, NOT TRANSFORMATION.**

The MBG TRANSLATES existing authorized banking instructions into MTQ settlement instructions and returns settlement / reconciliation status into the bank's operating environment. It does NOT replace core banking systems. It does NOT take custody of customer funds. It does NOT transform the bank's compliance environment. The bank's role, KYC/AML obligations, regulatory responsibilities, and customer relationships remain unchanged.

```
LAYER 0 — Sovereign / Legal / Central-Bank Framework
                              ▲ ▼
LAYER 1 — Bank Money / CBDC / Authorized Monetary Systems
                              ▲ ▼
LAYER 2 — MITHQAL Bank Gateway (MBG) / Sending Sidecar
  • Translates authorized banking instructions into MTQ settlement instructions
  • Returns settlement / reconciliation status to bank
  • Does NOT replace core banking systems
  • Does NOT take custody of customer funds
  • Does NOT transform the bank's compliance environment
                              ▲ ▼
LAYER 3 — MITHQAL Monetary + Settlement Control Layer
  • Enforces canonical MTQ monetary invariants (FV1-FV25)
  • Operates 15-step issuance authorization gate
  • Operates 5-way reserve backing reconciliation
  • Operates mint authority separation (3 states)
  • Computes DMCE — Dynamic Minting Capacity per institution
                              ▲ ▼
LAYER 4 — MTQ (Neutral Wholesale Settlement Instrument)
  • Canonical supply ledger
  • Permissioned institutional transfer
  • PAR-referenced (accounting reference only — NOT a USD peg)
  • Burn-on-redemption (canonical supply reduction)
                              ▲ ▼
LAYER 5 — Receiving Bank Gateway (MBG / Receiving Sidecar)
                              ▲ ▼
LAYER 6 — Receiving Bank / Local Monetary Settlement
```

## §V25.0.D.G — Bank Responsibilities

**BANK RESPONSIBILITIES (13):**

1. Hold customer deposits and execute customer instructions under applicable banking law
2. Verify customer eligibility (KYC, AML, sanctions screening, beneficial-ownership identification)
3. Issue cryptographically signed attestations of available backing (Evidence Source A)
4. Issue AvailableBackingCertificate to MITHQAL on issuance request
5. Operate the MITHQAL Bank Gateway (MBG) sidecar on the bank's side
6. Maintain the Bank MTQ Subledger (bank-side MTQ accounting)
7. Coordinate redemption payout from bank-side deposit (where bank is redemption obligor)
8. Comply with regulator / central bank reporting requirements
9. Disclose any encumbrance / insurance / segregation status truthfully
10. Maintain custody of customer funds (bank-side) — do NOT transfer to MITHQAL by default
11. Coordinate with qualified custodians for independent reserve evidence (Source B)
12. Maintain bank-side cryptographic key management (signing keys, rotation, revocation)
13. Comply with jurisdictional authorization requirements (JURISDICTION_PENDING → ESTABLISHED)

**BANK MAY (4):**

1. Issue AvailableBackingCertificate for verified eligible value held at the bank
2. Request MTQ issuance against verified backing through the 15-step gate
3. Coordinate with MITHQAL for reconciliation, settlement, and incident response
4. Earn transparent commercial compensation per bank-tier economic model (TIER_1/2/3)

**BANK MAY NOT (6):**

1. Mint MTQ directly (only the canonical ledger can, after MITHQAL authorization)
2. Create MTQ merely by asserting that funds exist (AvailableBackingCertificate required)
3. Take actions that violate canonical MTQ monetary invariants (FV1-FV25)
4. Use the same backing for multiple uncollateralized issuance allocations (FV15)
5. Bypass the 15-step issuance authorization gate
6. Override MITHQAL reconciliation verdict or veto

## §V25.0.D.H — Operating Company Responsibilities

**OPERATING CO RESPONSIBILITIES (15):**

1. Operate the institutional side of the MITHQAL Bank Gateway (MBG)
2. Operate bank relationship management (commercial side, NOT monetary control side)
3. Operate institutional onboarding (legal / KYC / institutional due diligence)
4. Operate reconciliation workflow operations (operationally separate from sales)
5. Operate customer / institutional support (relationship managers, technical support)
6. Operate regulatory compliance operations (jurisdictional licensing, regulatory reporting)
7. Operate audit / evidence preservation operations (immutable audit trail)
8. Operate the MONETARY & RESERVE CONTROL DIVISION (operationally separated)
9. Earn transparent infrastructure fees (8 categories — see §AC)
10. Coordinate with Foundation on constitutional oversight (Foundation read-only)
11. Maintain corporate operating capital (separate from MTQ reserve backing)
12. Coordinate phased capital deployment with Holding (PILOT/SCALE/SCALE+)
13. Maintain commercial contracts with participating banks (commercial terms, NOT monetary terms)
14. Maintain intercompany service agreements with Technology Company
15. Operate continuity / disaster recovery / incident response (operational layer)

**MONETARY & RESERVE CONTROL DIVISION:**

- Operationally separated from: sales, marketing, bank relationship teams, revenue teams, commercial contract negotiators
- Monitors: reserve positions, backing evidence, reserve weights, currency weights, RR, StressRR, LCR, MLCR, ILPS, concentration, custody, backing certificates, minting capacity, reconciliation, exceptions
- Rule: Commercial relationship staff MUST NOT approve reserve sufficiency for their own bank clients. This separation is STRUCTURAL — not optional.

## §V25.0.D.I — Foundation Responsibilities

**FOUNDATION SHALL (11):**

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

**FOUNDATION SHALL NOT (8):**

1. Mint MTQ
2. Authorize MTQ issuance
3. Buy or sell reserve assets
4. Transfer reserve assets
5. Override canonical MTQ monetary invariants (FV1-FV25)
6. Operate as the commercial operator of MITHQAL systems
7. Receive private profit distributions (nonprofit status)
8. Silently reclassify legal ownership of reserve assets

**FOUNDATION MONITORING ACCESS = READ_ONLY**

**Foundation Technology Layer (6 items):**

1. READ_ONLY aggregate dashboard access (7 fields per §AN)
2. Aggregate reserve status (total supply, reserve backing ratio, constitutional metrics)
3. Major exception notifications (escalated incidents, constitutional breaches)
4. CALM state visibility (system-wide operational state)
5. Weight history (reserve weights over time, currency weights over time)
6. Incident reports (escalated by Operating Company)

## §V25.0.D.J — Technology Company

**TECHNOLOGY CO OWNS (12 items):**

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

**Rule:** Technology Company OWNS the software, infrastructure, and IP. It does NOT mint MTQ, does NOT authorize issuance, does NOT hold customer deposits, does NOT hold reserve assets, and does NOT profit from reserve appreciation. Technology Company provides services to Operating Company per intercompany agreement.

## §V25.0.D.K — Reserve Custody Principle (NON-CUSTODIAL BY DEFAULT)

Reference: §V25.0.C — Non-Custodial Reserve Architecture.

MITHQAL is non-custodial by default. Reserve assets remain in legally appropriate regulated custody (banks / qualified custodians / segregated structures). MITHQAL controls verification + monetary control, NOT custody.

See: `src/lib/non-custodial-reserve-architecture.ts` — `CUSTODY_PROHIBITIONS` (6), `CUSTODY_SEPARATION_RULE`, `CANONICAL_NON_CUSTODIAL_STATEMENT`, `LEGAL_OWNERSHIP_MATRIX` (5 reserve categories), `REDEMPTION_OBLIGATION_PROFILE`.

## §V25.0.D.L — Reserve Architecture (Constitutional Corridors)

| Asset Class | Min | Max | Current Policy |
|-------------|-----|-----|----------------|
| FIAT | 70% | 85% | 76.5% |
| BULLION | 15% | 25% | 20.0% |
| DIGITAL_LIQUIDITY | 0% | 5% | 3.5% |
| TOTAL | — | — | 100% |

**Rule:** Do NOT describe 76.5/20/3.5 as immutable constitutional percentages. Actual allocations may move within the constitutional corridors (fiat 70-85%, bullion 15-25%, digital liquidity 0-5%). The current policy values (76.5% / 20% / 3.5%) are TARGET allocations within the corridors — not immutable.

## §V25.0.D.M — Currency Weighting (6-Step Engine)

1. Structural Weight
2. Momentum
3. Mean Reversion
4. Volatility Attenuation
5. Liquidity Overlay
6. Normalization

**Currency Weighting Rules:**

- `usdIsOneEligibleCurrency = true`
- `mtqIsNotUSDbacked = true`
- `parIsAccountingReferenceOnly = true`
- Use term: **PAR-REFERENCED**
- NOT use term: **USD-BACKED**

## §V25.0.D.N — Bullion Weighting

| Asset | Role | Status |
|-------|------|--------|
| Gold | PRIMARY bullion anchor | CONSTITUTIONAL (Gold Anchor Doctrine §14, §V25.0.A.2); liquidation LAST (Article X) |
| Silver | CONDITIONAL bullion component | May be 0%; inclusion requires jurisdictional + Sharia + liquidity preconditions |
| Digital Liquidity | SUBORDINATE operational liquidity | 0-5% (constitutional corridor); for settlement efficiency — NOT monetary anchor |

**Rule:** Gold is PRIMARY bullion anchor; silver is CONDITIONAL (may be 0%); digital liquidity is SUBORDINATE (0-5%). Gold cannot be liquidated outside allowed constitutional conditions (FV22).

## §V25.0.D.O — Operational Digital Liquidity

- **Range:** 0% to 5% (constitutional corridor)
- **Purpose:** settlement efficiency, operational liquidity, redemption liquidity (where authorized), short-horizon institutional settlement
- **Is NOT Monetary Anchor:** true

**Rule:** Operational digital liquidity is for SETTLEMENT EFFICIENCY — NOT a monetary anchor. It is subordinate to the bullion and fiat layers. It MUST remain within the 0-5% constitutional corridor. It is NOT a substitute for the gold anchor or the fiat layer. It does NOT change the canonical MTQ monetary model.

## §V25.0.D.P — Three-Layer Reserve Valuation

| Layer | Name | Definition |
|-------|------|------------|
| R_m | Market Reserve | mark-to-market reserve value at current market prices |
| R_a | Adjusted Reserve | post-haircut, post-counterparty-score prudential reserve value |
| R_l | Liquidation Reserve | post-stress reserve value (stress test scenario) |

**Invariant:** R_l ≤ R_a ≤ R_m

**Rule:** Three-layer reserve valuation: Market Reserve (R_m) ≥ Adjusted Reserve (R_a) ≥ Liquidation Reserve (R_l). The Adjusted Reserve reflects haircuts and counterparty scores; the Liquidation Reserve reflects stress scenarios. DMCE draws on R_a (prudential); ILPS draws on R_l (stress).

## §V25.0.D.Q — Gold Acquisition (16-Step Workflow)

1. **GA-01** — Constitutional authorization: gold acquisition is consistent with the Gold Anchor Doctrine (§14, §V25.0.A.2) and constitutional corridors (§L).
2. **GA-02** — Funding source identification: reserve/institutional funding pool identified (NOT operating capital, NOT founder funds, NOT Foundation operating funds, NOT Technology Co funds).
3. **GA-03** — Jurisdictional authorization: jurisdiction permits gold acquisition and custody under applicable law.
4. **GA-04** — Custodian selection: qualified custodian selected (LBMA-approved vault, segregated allocated custody).
5. **GA-05** — Counterparty due diligence: gold dealer / refiner / custodian due diligence completed.
6. **GA-06** — Sharia review (where applicable): independent Sharia board reviews transaction structure (status: DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED).
7. **GA-07** — Pricing benchmark: LBMA fix or independent benchmark established; price not manipulated.
8. **GA-08** — Trade execution: authorized reserve manager / institutional treasury executes acquisition.
9. **GA-09** — Settlement: settlement via designated reserve / institutional funding pool (NOT operating capital).
10. **GA-10** — Custody transfer: physical gold delivered to qualified custodian's segregated allocated vault.
11. **GA-11** — Custody evidence issuance: custodian issues independent reserve evidence (Source B — RCAF).
12. **GA-12** — Independent attestation: independent attestation oracle (Source D) corroborates, where feasible.
13. **GA-13** — MITHQAL ledger entry: MITHQAL Reserve Ledger records the acquisition (canonical record).
14. **GA-14** — Reconciliation entry: 5-way reconciliation updated (bank + reserve evidence + custodian + canonical + proof of liabilities).
15. **GA-15** — Audit trail preservation: immutable audit trail preserved for regulatory access.
16. **GA-16** — Proof-of-Reserves publication: aggregate Proof-of-Reserves updated (zero-knowledge where applicable).

## §V25.0.D.R — Who Pays for Reserve Acquisition

**Default Principles (6 NOTs):**

1. reserve acquisition uses the designated reserve/institutional funding pool
2. operating capital is NOT used
3. founder personal funds are NOT used
4. Foundation operating funds are NOT used
5. MITHQAL Technology Company funds are NOT used
6. ordinary MITHQAL operating revenue is NOT silently converted into reserve backing

- **Executor:** Authorized reserve manager / bank treasury / reserve vehicle
- **Owner/Obligor/Custody:** Must be explicitly documented by jurisdiction (JURISDICTION_PENDING until legal counsel establishes otherwise)

## §V25.0.D.S — Rebalancing Engine (13-Step Flow)

1. **RB-01** — Snapshot current reserve allocation (R_m market value).
2. **RB-02** — Compute current weights per asset class (fiat / bullion / digital liquidity) and per currency.
3. **RB-03** — Compare current weights to target weights within constitutional corridors (§L).
4. **RB-04** — Compute drift delta (current − target) per asset class and per currency.
5. **RB-05** — If drift ≤ approved tolerance → NO REBALANCING TRADE (§T — No-Trade Principle).
6. **RB-06** — If drift > approved tolerance → identify rebalancing targets (which assets to buy / sell).
7. **RB-07** — Verify rebalancing preserves RR / StressRR / LCR / MLCR / ILPS (FV19, §S preserve list).
8. **RB-08** — Verify rebalancing preserves concentration limits (custodian 15% preferred / 25% hard cap).
9. **RB-09** — Verify rebalancing preserves allocation corridors (fiat 70-85% / bullion 15-25% / digital 0-5%).
10. **RB-10** — Verify rebalancing preserves asset eligibility (RCAF eligibilityStatus=ELIGIBLE).
11. **RB-11** — Execute rebalancing trades via authorized reserve manager / institutional treasury.
12. **RB-12** — Update canonical MITHQAL Reserve Ledger + bank subledgers + custodian evidence (5-way reconciliation).
13. **RB-13** — Preserve immutable audit trail; update Proof-of-Reserves.

**REBALANCING MUST PRESERVE (9 items):**

1. minimum trades (avoid unnecessary transaction costs)
2. minimize cost (execution cost optimization)
3. minimize market impact (avoid large block trades that move prices)
4. preserve redemption capacity (redemption liquidity must remain sufficient)
5. preserve RR (Reserve Ratio must remain ≥ 1.00)
6. preserve LCR (Liquidity Coverage Ratio must remain ≥ 1.00)
7. preserve concentration limits (custodian concentration ≤ 15% preferred / 25% hard cap)
8. preserve allocation ranges (fiat 70-85% / bullion 15-25% / digital 0-5% corridors)
9. preserve asset eligibility (RCAF eligibilityStatus=ELIGIBLE)

## §V25.0.D.T — No-Trade Principle

If the current reserve allocation is within approved tolerance of the target allocation, NO REBALANCING TRADE is executed. Rebalancing is NOT a continuous high-frequency activity — it is a discrete, controlled response to drift exceeding approved tolerance. The No-Trade Principle avoids unnecessary transaction costs, market impact, and operational risk.

## §V25.0.D.U — Rebalancing Example (Denomination-Neutral, PAR-Equivalent)

Suppose the target reserve allocation is:
- Fiat layer: 76.5% (within 70-85% corridor)
- Bullion layer: 20.0% (within 15-25% corridor)
- Digital liquidity: 3.5% (within 0-5% corridor)

Suppose total reserve = 1,000,000 PAR-equivalent units (denomination-neutral; NOT USD-denominated).

| Asset Class | Target | Current Observed | Drift |
|-------------|--------|-------------------|-------|
| Fiat | 765,000 | 800,000 | +35,000 (+3.5pp overweight) |
| Bullion | 200,000 | 180,000 | -20,000 (-2.0pp underweight) |
| Digital | 35,000 | 20,000 | -15,000 (-1.5pp underweight) |

If approved tolerance = ±1.0pp:
- Fiat drift (+3.5pp) EXCEEDS tolerance → REBALANCING REQUIRED
- Bullion drift (-2.0pp) EXCEEDS tolerance → REBALANCING REQUIRED
- Digital drift (-1.5pp) EXCEEDS tolerance → REBALANCING REQUIRED

**Conservation check (FV19):**
- Pre-rebalance: 800,000 + 180,000 + 20,000 = 1,000,000 PAR-equivalent units
- Post-rebalance: 765,000 + 200,000 + 35,000 = 1,000,000 PAR-equivalent units
- CONSERVED ✓

**Allocation sum check (FV20):** 76.5% + 20.0% + 3.5% = 100.0% ✓

**Corridor preservation check (FV21):** All within corridors ✓

**NOTE:** All amounts are in PAR-equivalent units. PAR is an ACCOUNTING REFERENCE ONLY — it is NOT a USD peg. The rebalancing is denomination-neutral. USD is ONE ELIGIBLE CURRENCY among multiple.

## §V25.0.D.V — DMCE — Dynamic Minting Capacity Engine (KEY NEW DELIVERABLE)

**DMCE Formula:**

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

**Component Definitions:**

| Component | Definition |
|-----------|------------|
| VerifiedEligibleBacking | Verified eligible value backing at the institution (per AvailableBackingCertificate + custodian evidence) |
| LegallyReservedBacking | Legally reserved backing (post-jurisdictional-determination backing legally committed to MTQ) |
| InstitutionalRiskLimit | Institutional risk limit (per institution risk rating — TIER_1/2/3 — and counterparty score) |
| LiquidityLimit | Liquidity limit (per institution's available HQLA / LCR / ILPS contribution capacity) |
| JurisdictionLimit | Jurisdictional limit (per jurisdiction's authorization scope and regulatory cap) |
| ExposureLimit | Exposure limit (per institution's exposure hard cap — default 25% of canonical MTQ supply) |
| ConcentrationLimit | Concentration limit (per institution's concentration against custodian / parent-group limits — 15% preferred / 25% hard cap) |
| OperationalLimit | Operational limit (per institution's technical / operational capacity — gateway throughput, settlement latency, key-management readiness) |

**Rule:** The DMCE bounds FV18 (Dynamic Minting Capacity Upper Bound): a bank CANNOT mint outside its DMCE capacity. The DMCE is the canonical policy/control concept — NOT a fixed legal formula until independently validated.

## §V25.0.D.W — RCAF + AvailableBackingCertificate (REFERENCES — Not Duplicated)

**Reference:** §V25.0.C.5 (RCAF — 18 required fields) + §V25.0.C.6 (AvailableBackingCertificate — 16 fields) in `src/lib/non-custodial-reserve-architecture.ts`.

This module DOES NOT duplicate those definitions. Consumers should import:

```typescript
import {
  ReserveControlAttestationFramework,
  AvailableBackingCertificate,
  validateRCAF,
  validateAvailableBackingCertificate,
} from "@/lib/non-custodial-reserve-architecture";
```

**Rules:** AvailableBackingCertificate is EVIDENCE — NOT custody, NOT a transfer of assets to MITHQAL. The certificate MUST be signed by the issuing bank's authorized key, MUST carry a non-expired issueTime / expiryTime window, MUST reference an eligible reserveAllocationId that is unencumbered and segregated, MUST be revocable by the issuing bank AND by MITHQAL (dual revocation), and MUST be re-verified at every issuance draw.

## §V25.0.D.X — Bank Minting Workflow (16 Steps)

1. **BM-01** — Corporate / customer initiates settlement request with the bank.
2. **BM-02** — Bank verifies customer KYC / AML / sanctions / beneficial-ownership.
3. **BM-03** — Bank verifies funding availability (customer has verified eligible value).
4. **BM-04** — Bank issues AvailableBackingCertificate to MITHQAL (Evidence Source A — bank-signed).
5. **BM-05** — Bank requests MTQ issuance through the MBG (MITHQAL Bank Gateway sidecar).
6. **BM-06** — MBG authenticates the bank institution (mTLS + signed nonce + replay protection).
7. **BM-07** — MITHQAL verifies backing evidence (AvailableBackingCertificate + custodian evidence where applicable).
8. **BM-08** — MITHQAL issues / verifies AvailableBackingCertificate validity (16 fields, dual revocation).
9. **BM-09** — MITHQAL verifies reserve evidence (RCAF — 18 required fields, ELIGIBLE status).
10. **BM-10** — MITHQAL computes Joint Settlement Guarantee (JSG) per institution.
11. **BM-11** — MITHQAL evaluates RR ≥ 1.00 AND StressRR ≥ 0.95 (canonical thresholds).
12. **BM-12** — MITHQAL evaluates LCR ≥ 1.00 AND MLCR ≥ 1.00 AND ILPS sufficient (5-layer $48.1M).
13. **BM-13** — MITHQAL evaluates institutional exposure ≤ hard cap (default 25%) + concentration ≤ hard cap (25%).
14. **BM-14** — MITHQAL computes Dynamic Minting Capacity (DMCE) — MIN of 8 limits per §V.
15. **BM-15** — MITHQAL executes Mint Permission Engine (15-step issuance authorization gate — ANY FAILURE = BLOCK).
16. **BM-16** — Technical Mint Execution: canonical ledger mints MTQ; bank MTQ subledger updated; corporate MTQ settlement position updated.

## §V25.0.D.Y — Bank Backing Failure (REFERENCE)

Reference: §V25.0.C.11 — `handleBackingAttestationFailure(claimed, verified, allocationId)` in `src/lib/non-custodial-reserve-architecture.ts`.

**Rule:** Existing MTQ is NOT automatically burned. Only NEW issuance against the affected backing is BLOCKED. Forensic reconciliation + legal/regulator-driven resolution applies.

## §V25.0.D.Z — Five-Way Reconciliation (REFERENCE)

Reference: §V25.0.C.9 — `runReserveBackingReconciliation(sources)` in `src/lib/non-custodial-reserve-architecture.ts`.

**5 Sources:**

1. bankMTQSubledger — bank-side MTQ subledger (Source A)
2. reserveBackingEvidence — bank-signed reserve attestation (Source A)
3. custodianEvidence — independent custodian evidence (Source B)
4. mithqalCanonicalMTQLedger — MITHQAL canonical MTQ ledger (Source C)
5. proofOfLiabilities — independent proof of liabilities (Source D, where available)

**7 Statuses:** VERIFIED / WARNING / MISMATCH / CRITICAL / EXPIRED / UNAVAILABLE / LOCKED

**Tolerance:** 0.0001 (1 basis point)

## §V25.0.D.AA — Who Monitors the Banks

**Authority:** MITHQAL Operating Company — MONETARY & RESERVE CONTROL DIVISION

**Operationally separated from:** sales, marketing, bank relationship teams, revenue teams, commercial contract negotiators

**Monitors:**

- bank backing evidence (AvailableBackingCertificate validity + custodian evidence)
- bank MTQ subledger reconciliation
- bank exposure (per institution exposure ≤ 25% hard cap)
- bank concentration (per institution concentration ≤ 25% hard cap)
- bank operational status (gateway throughput, settlement latency)
- bank jurisdictional authorization status
- bank compliance status (KYC/AML/sanctions attestations)
- DMCE compliance (institution cannot mint outside DMCE capacity)

**Rule:** Commercial relationship staff MUST NOT approve reserve sufficiency for their own bank clients. The Monetary & Reserve Control Division is operationally separated from sales / marketing / bank relationship teams. This separation is STRUCTURAL — not optional.

## §V25.0.D.AB — Foundation Oversight

- **Access:** READ_ONLY
- **Scope:** Aggregate dashboard (7 fields per §AN — Foundation Dashboard)

**Cannot Do (8):**

1. mint MTQ
2. authorize MTQ issuance
3. buy / sell reserve assets
4. transfer reserve assets
5. override canonical MTQ monetary invariants
6. operate as the commercial operator
7. receive private profit distributions
8. silently reclassify legal ownership

**Rule:** Foundation oversight is READ-ONLY aggregate. The Foundation cannot mint, authorize, buy, sell, transfer, or override. The Foundation holds constitutional stewardship and aggregate transparency responsibility — NOT operational authority.

## §V25.0.D.AC — Gold/Reserve Revenue

**Operating Company MUST NOT profit from (6 items):**

1. gold appreciation
2. speculative trading on reserves
3. reserve spread (buying reserves below par and selling above par)
4. proprietary price movements on reserve assets
5. reserve asset trading gains (any asset class)
6. currency speculation (per currency weight engine outputs)

**Operating Company MAY earn transparent infrastructure fees (8 categories):**

1. connectivity fees
2. issuance service fees
3. settlement fees
4. redemption infrastructure fees
5. reconciliation fees
6. enterprise integration fees
7. premium institutional services fees
8. custody evidence verification fees

**Rule:** Reserve appreciation is NOT a commercial profit source.

## §V25.0.D.AD — Operating Capital

**Separate From:** constitutional reserve assets (MTQ backing)

**Cannot Be Funded From (7):**

1. gold
2. silver
3. reserve fiat
4. digital liquidity
5. participant deposits
6. minting proceeds
7. redemption assets

**Funds (9):**

1. personnel (operating company + technology company staff)
2. technology (infrastructure, software, security systems)
3. cybersecurity (security operations, key management, audits)
4. legal (counsel, regulatory, jurisdictional authorization)
5. audits (independent audit fees, attestation oracle fees)
6. insurance (operational, custody where applicable, D&O)
7. governance (Foundation governance, board, conflict-of-interest)
8. continuity (business continuity, disaster recovery)
9. DR (disaster recovery infrastructure, failover sites)

## §V25.0.D.AE — Capital Model (6 Categories)

| Letter | Category | Modeled Amount | Classification |
|--------|----------|----------------|----------------|
| A | MTQ Reserve / Backing | $54,000,000 | 1:1 backing of MTQ supply at par. Held by banks/custodians (non-custodial default). |
| B | Bank Funding | $43,200,000 | 80% of $54M — verified eligible value at participating regulated banks. |
| C | MITHQAL Operating Capital | $4,700,000 | PILOT phase per commercial-model.ts. Operating, not reserve. |
| D | Regulatory Capital | $0 | ABSENT — pending jurisdictional licensing. |
| E | Liquidity Resources (ILPS) | $48,100,000 | 5-layer ILPS — corrected from $46M. Emergency + Structural $23.8M is SUBSET. |
| F | Emergency Resources | $23,800,000 | SUBSET of ILPS (Layer 3 + Layer 4). Activated under Exhaustion Certificate. |

**ΔCapital_min ($15.815M):** Classified as MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT — PENDING_INDEPENDENT_VALIDATION. NOT equivalent to fundraising target / regulatory capital / operating capital / reserve backing per MTQ / legal capital requirement / guaranteed solution.

**Rule:** 6 capital categories — SEPARATE, `doNotAutoCombine=true`.

## §V25.0.D.AF — Gold/Currency/Reserve Nomenclature

**Use:**

- PAR-equivalent units (denomination-neutral accounting reference)
- reserve value (R_m market / R_a adjusted / R_l liquidation — §P)
- eligible currency (USD is ONE eligible currency among multiple)
- bullion (gold primary; silver conditional)
- fiat layer (sovereign debt, bank deposits, authorized monetary systems)
- dynamic currency weights (6-step engine per §M)
- constitutional corridors (fiat 70-85% / bullion 15-25% / digital 0-5%)
- non-custodial by default (per §V25.0.C)

**Avoid:**

- USD-denominated (use PAR-equivalent / denomination-neutral)
- USD-backed (use PAR-REFERENCED)
- USD peg (PAR is accounting reference only)
- immutable constitutional percentages (use constitutional corridors)
- monetary anchor for digital liquidity (digital liquidity is operational, not anchor)
- custodian for MITHQAL (MITHQAL is non-custodial by default)
- bank for MITHQAL (MITHQAL is not a bank; it operates settlement infrastructure)

## §V25.0.D.AG — Redemption

**Mediation:** Bank-mediated

**MITHQAL Role:** Burns MTQ (canonical supply reduction) + issues signed backing release instruction

**Redemption Obligor:** Varies by jurisdiction + reserve category — NOT automatically MITHQAL (per §V25.0.C.15)

**Candidates:**

- PARTICIPATING_BANK
- DESIGNATED_ISSUER
- LEGALLY_SEGREGATED_RESERVE_STRUCTURE
- AUTHORIZED_INSTITUTIONAL_VEHICLE
- JURISDICTION_PENDING

**Flow:**

1. Holder redeems MTQ through participating bank
2. Bank verifies holder identity + KYC + sanctions + MTQ balance
3. Bank issues signed redemption attestation to MITHQAL
4. MITHQAL burns N MTQ against canonical ledger (FV17)
5. MITHQAL issues signed backing release instruction to redemption obligor
6. Redemption obligor releases backing directly to holder (NOT through MITHQAL)
7. 5-way reconciliation confirms burn + release within T+0 to T+3
8. Immutable audit trail preserved

**Rule:** Redemption is bank-mediated. MITHQAL does NOT automatically become the redemption obligor.

## §V25.0.D.AH — Bank/Custodian Failure (8 Scenarios)

| Scenario ID | Name | Issuance | Minting Capacity | Settlement | Reserve Status | Redemption Path |
|-------------|------|----------|-------------------|------------|----------------|-----------------|
| FS-01 | BANK_FAILURE | BLOCKED | DMCE=0 | HELD | Source A UNAVAILABLE | Bank resolution regime |
| FS-02 | BANK_SUSPENSION | BLOCKED during suspension | DMCE=0 during suspension | Queued | Preserved | Queued / alternate bank |
| FS-03 | BANK_INSOLVENCY | BLOCKED permanently | DMCE=0 permanently | FAILED | Source A UNAVAILABLE | Bank resolution regime |
| FS-04 | BANK_LIQUIDITY_STRESS | RESTRICTED (lowered ceiling) | REDUCED | T+0→T+1/T+2 | Preserved | ILPS Layer 2 engages |
| FS-05 | GATEWAY_OUTAGE | BLOCKED during outage | DMCE=0 during outage | Queued | Preserved | Queued |
| FS-06 | CUSTODIAN_FAILURE | BLOCKED for affected reserves | Reduced | HELD | Source B UNAVAILABLE | Alternate custodian engaged |
| FS-07 | CUSTODIAN_SUSPENSION | BLOCKED during suspension | Reduced | HELD | Source B UNAVAILABLE | Queued / alternate custodian |
| FS-08 | RESERVE_ASSET_DISQUALIFICATION | BLOCKED for disqualified reserve | Reduced | HELD | DISQUALIFIED (INELIGIBLE) | Alternate backing if available |

**Rule:** 8 failure scenarios produce CONTROLLED outcomes — no false settlement, no fund loss. Existing MTQ is NOT automatically burned; only NEW issuance against affected backing is BLOCKED.

## §V25.0.D.AI — Technology Implementation (13 Services)

1. MonetaryReserveControlService
2. ReserveAllocationEngine
3. CurrencyWeightEngine
4. ReserveRebalancingEngine
5. ReserveAttestationService
6. AvailableBackingCertificateService
7. DynamicMintingCapacityEngine
8. MintPermissionEngine
9. BankMTQSubledgerService
10. FiveWayReconciliationService
11. CustodyEvidenceService
12. ProofOfReservesService
13. FoundationReadOnlyMonitoringService

**Rule:** Use existing components wherever possible. Do NOT duplicate functionality unnecessarily. Each service is owned by MITHQAL Technology Company and operated by MITHQAL Operating Company per intercompany agreement.

## §V25.0.D.AJ — Data Models (16 Models)

1. ReserveAsset
2. ReserveAllocation
3. ReserveWeight
4. ReserveTarget
5. ReserveAdjustment
6. ReserveRebalanceEvent
7. ReserveExecution
8. CustodyRecord
9. ReserveAttestation
10. AvailableBackingCertificate (REFERENCE — defined in non-custodial-reserve-architecture.ts)
11. BankMTQPosition
12. MintingCapacity
13. IssuanceRequest
14. IssuanceAuthorization
15. RedemptionRequest
16. ReconciliationResult
17. FoundationOversightSnapshot

(Note: The interface list contains 17 entries — entry #10 is a REFERENCE-only model defined in `non-custodial-reserve-architecture.ts`. The 16 NEW models are introduced by this module.)

## §V25.0.D.AK — API (12 Versioned Endpoints)

1. `/gateway/v1/instructions`
2. `/gateway/v1/attestation`
3. `/gateway/v1/backing-certificates`
4. `/gateway/v1/minting-capacity`
5. `/gateway/v1/reserves`
6. `/gateway/v1/rebalancing`
7. `/gateway/v1/reconciliation`
8. `/gateway/v1/custody`
9. `/gateway/v1/proof-of-reserves`
10. `/gateway/v1/redemptions`
11. `/gateway/v1/incidents`
12. `/gateway/v1/foundation/oversight`

**All endpoints require:**

- authentication (mTLS + signed requests)
- authorization (institution allowlist + role-based access control)
- signed requests (cryptographic signatures)
- idempotency (idempotency key per request)
- timestamp (ISO-8601; stale requests rejected)
- expiry (per-request expiryTime)
- replay protection (nonce recorded for replay window)

The `/gateway/v1/foundation/oversight` endpoint is READ-ONLY for the Foundation.

## §V25.0.D.AL — Formal Verification — FV11 through FV25 (15 Invariants)

| ID | Name | Statement | Status |
|----|------|-----------|--------|
| FV11 | PvP Atomicity | If PvP is implemented, both legs settle or neither settles (no partial settlement). | DESIGNED (ref §V25.0.C) |
| FV12 | Reserve Custody Separation | MITHQAL does not become custodian of reserve assets merely through issuance. Custody and monetary control are deliberately separated. | PROVEN_AT_SPEC_LEVEL (ref §V25.0.C) |
| FV13 | Backing Evidence Validity | No MTQ can be issued without valid, unexpired, unrevoked AvailableBackingCertificate. | PROVEN_AT_SPEC_LEVEL (ref §V25.0.C) |
| FV14 | No Unverified Issuance | No issuance may rely solely on an unverified bank assertion. Minimum 2 evidence sources required. | PROVEN_AT_SPEC_LEVEL (ref §V25.0.C) |
| FV15 | No Double-Counted Backing | The same backing cannot support multiple uncollateralized MTQ issuance allocations. | PROVEN_AT_SPEC_LEVEL (ref §V25.0.C) |
| FV16 | Reserve-to-Liability Reconciliation | Reserve backing evidence must reconcile with canonical MTQ supply (5-way reconciliation). | PROVEN_AT_SPEC_LEVEL (ref §V25.0.C) |
| FV17 | Redemption Supply Conservation | Redemption reduces canonical supply correctly (burn 1 MTQ = reduce 1 MTQ from supply). | PROVEN_AT_SPEC_LEVEL (ref §V25.0.C) |
| FV18 | Dynamic Minting Capacity Upper Bound | Bank cannot mint outside DMCE capacity. | DESIGNED (NEW) |
| FV19 | Reserve Rebalance Conservation | Rebalancing cannot create or disappear reserve value. | DESIGNED (NEW) |
| FV20 | Allocation Sum = 100% | Reserve allocation weights always sum to 100%. | DESIGNED (NEW) |
| FV21 | Constitutional Corridor Preservation | Allocations remain within constitutional corridors (70-85% fiat, 15-25% bullion, 0-5% digital). | DESIGNED (NEW) |
| FV22 | Gold Anchor Preservation | Gold cannot be liquidated outside allowed constitutional conditions. | DESIGNED (NEW) |
| FV23 | No Unauthorized Reserve Transfer | MITHQAL cannot execute unauthorized reserve transfer. | DESIGNED (NEW) |
| FV24 | No Operating-Capital-to-Reserve Contamination | Operating capital cannot be silently converted to reserve backing. | DESIGNED (NEW) |
| FV25 | Mint Authorization Separation | Foundation/Holding/Technology Co/Operating Co cannot mint. Only deterministic technical execution creates MTQ. | DESIGNED (NEW) |

**8 NEW invariants added (FV18-FV25).** Total FV count now 25 (FV1-FV10 existing + FV11-FV17 from §V25.0.C + FV18-FV25 from this module).

**11 Verification Checks:**

1. bank cannot mint outside capacity (FV18)
2. expired certificate cannot mint (FV13)
3. duplicated backing cannot mint twice (FV15)
4. reserve weights always reconcile (FV16)
5. rebalancing cannot create/disappear reserve value (FV19)
6. rebalancing cannot breach RR/LCR limits (FV19 + §S preserve list)
7. gold cannot be liquidated outside allowed constitutional conditions (FV22)
8. Foundation cannot mint (FV25 + §I)
9. Operating Company cannot arbitrarily create MTQ (FV25 + §H)
10. Holding cannot mint (FV25 + §C)
11. Technology Company cannot mint (FV25 + §J)

## §V25.0.D.AM — Testing — 35 Test Scenarios (INT-T01 .. INT-T35)

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
| INT-T12 | CUSTODY | Custody failure | DESIGNED |
| INT-T13 | REBALANCING | Rebalancing failure | DESIGNED |
| INT-T14 | REBALANCING | Rebalancing partial execution | DESIGNED |
| INT-T15 | REBALANCING | Market disruption | DESIGNED |
| INT-T16 | RESERVE | Reserve mismatch | DESIGNED |
| INT-T17 | BANKING | Bank backing deficiency | DESIGNED |
| INT-T18 | MINTING | Expired backing certificate | DESIGNED |
| INT-T19 | MINTING | Duplicate backing allocation | DESIGNED |
| INT-T20 | MINTING | Unauthorized issuance | DESIGNED |
| INT-T21 | MINTING | Bank exceeds DMCE capacity | DESIGNED |
| INT-T22 | BANKING | Gateway compromise | DESIGNED |
| INT-T23 | FAILURE | MITHQAL outage | DESIGNED |
| INT-T24 | FAILURE | Bank outage | DESIGNED |
| INT-T25 | REDEMPTION | Redemption event | DESIGNED |
| INT-T26 | REDEMPTION | Simultaneous redemption stress | DESIGNED |
| INT-T27 | GOVERNANCE | CALM transition | DESIGNED |
| INT-T28 | RESERVE | RR breach | DESIGNED |
| INT-T29 | RESERVE | LCR breach | DESIGNED |
| INT-T30 | BANKING | Five-way reconciliation mismatch | DESIGNED |
| INT-T31 | FOUNDATION | Foundation read-only access | DESIGNED |
| INT-T32 | FOUNDATION | Foundation attempted mint = BLOCK | DESIGNED |
| INT-T33 | GOVERNANCE | Holding attempted mint = BLOCK | DESIGNED |
| INT-T34 | GOVERNANCE | Technology Company attempted mint = BLOCK | DESIGNED |
| INT-T35 | GOVERNANCE | Operating Company manual mint attempt = BLOCK | DESIGNED |

## §V25.0.D.AN — Dashboards (3 Dashboards)

**MITHQAL Monetary Control Dashboard (20 fields):**

1. Total MTQ
2. Reserve Market Value
3. Adjusted Reserve
4. Liquidation Reserve
5. RR
6. StressRR
7. LCR
8. MLCR
9. ILPS
10. Reserve Weights
11. Currency Weights
12. Bullion
13. Digital Liquidity
14. Minting Capacity
15. Bank Exposure
16. Custodian Concentration
17. Rebalancing Status
18. Reconciliation
19. Certificates
20. Incidents

**Bank Dashboard (6 fields):**

1. Bank MTQ position
2. Minting Capacity
3. backing status
4. active certificates
5. settlement status
6. reconciliation status

**Foundation Dashboard — READ-ONLY (7 fields):**

1. total supply
2. reserve status
3. weight history
4. major exceptions
5. constitutional metrics
6. incidents
7. CALM state

**Rule:** Foundation access is READ_ONLY.

## §V25.0.D.AO — Commercial Economics

**Operating Company Revenue (9 sources):**

1. connectivity fees
2. issuance service fees
3. settlement fees
4. redemption infrastructure fees
5. reconciliation fees
6. enterprise integration fees
7. premium institutional services fees
8. custody evidence verification fees
9. infrastructure licensing fees

**Technology Company Revenue (4 sources):**

1. intercompany service fees (from Operating Company per intercompany agreement)
2. technology licensing fees
3. patent / IP licensing fees
4. professional services fees

**Holding Company:** Owns subsidiaries; receives dividends; holds enterprise value. Revenue = Dividends from Operating + Technology subsidiaries + retained earnings.

**Foundation:** Independent nonprofit — no private profit. Revenue = Foundation operating funds (separate from reserves); grants / donations where legally permitted.

**Rule:** Revenue is CORPORATE — not RESERVE. Reserve appreciation is NOT a commercial profit source.

## §V25.0.D.AP — Reconciliation Authority Matrix (7 Actors × 17 Functions)

| Function | Foundation | Holding | Operating Co | Tech Co | Bank | Custodian | Central Bank/Regulator |
|----------|------------|---------|--------------|---------|------|-----------|-----------------------|
| constitutional governance | STEWARD | NONE | EXECUTE | NONE | NONE | NONE | AUTHORIZE |
| commercial ownership | NONE | OWN | OPERATE | OPERATE | NONE | NONE | NONE |
| technology | READ_ONLY | OWN_SUBSIDIARY | OPERATE | OWN | INTEGRATE | NONE | REVIEW |
| patents | NONE | OWN_SUBSIDIARY | NONE | OWN | NONE | NONE | NONE |
| MTQ issuance rules | STEWARD | NONE | ENFORCE | IMPLEMENT | REQUEST | NONE | AUTHORIZE |
| mint authorization | NONE | NONE | EVALUATE | EXECUTE_DETERMINISTIC | NONE | NONE | NONE |
| customer KYC | NONE | NONE | NONE | NONE | EXECUTE | NONE | SUPERVISE |
| AML / sanctions | NONE | NONE | NONE | NONE | EXECUTE | EXECUTE | SUPERVISE |
| customer funds | NONE | NONE | NONE | NONE | HOLD | NONE | SUPERVISE |
| reserve custody | NONE | NONE | MONITOR | NONE | HOLD | HOLD | SUPERVISE |
| reserve verification | READ_ONLY_AGGREGATE | NONE | EXECUTE | IMPLEMENT | ATTEST | ATTEST | REVIEW |
| reserve rebalancing policy | STEWARD | NONE | EVALUATE | IMPLEMENT | NONE | NONE | REVIEW |
| reserve trade execution | NONE | NONE | MONITOR | NONE | EXECUTE | EXECUTE | SUPERVISE |
| MTQ settlement | READ_ONLY_AGGREGATE | NONE | OPERATE | IMPLEMENT | PARTICIPATE | NONE | SUPERVISE |
| redemption | READ_ONLY_AGGREGATE | NONE | OPERATE | IMPLEMENT | EXECUTE | EXECUTE | SUPERVISE |
| Proof of Reserves | READ_ONLY_AGGREGATE | NONE | OPERATE | IMPLEMENT | ATTEST | ATTEST | REVIEW |
| monitoring | READ_ONLY_AGGREGATE | OWN_SUBSIDIARY | OPERATE | IMPLEMENT | REPORT | REPORT | SUPERVISE |
| external assurance | COORDINATE | NONE | COORDINATE | NONE | PARTICIPATE | PARTICIPATE | AUTHORIZE |

**Rule:** No function may have ambiguous ownership.

## §V25.0.D.AQ — Gold/Rebalancing Authority Matrix

| Role | Who |
|------|-----|
| whoCalculates | MITHQAL Operating Company — Reserve/Rebalancing Engine (Monetary & Reserve Control Division) |
| whoApprovesPolicy | Constitutional/approved reserve governance process (Foundation STEWARD + regulator AUTHORIZE) |
| whoExecutesMarketTransaction | Authorized reserve manager / institutional treasury / legally designated reserve holder |
| whoCustodies | Qualified custodian / legally designated holder |
| whoVerifies | Independent evidence (Source B custodian + Source D oracle where available) + MITHQAL verification |
| whoRecords | MITHQAL Reserve Ledger (canonical) |
| whoPublishesProof | Proof-of-Reserves system (zero-knowledge where applicable) |
| whoOversees | Foundation read-only constitutional oversight + independent auditors + regulators as applicable |

**Rule:** No single role can unilaterally execute all 8 steps.

## §V25.0.D.AR — No Contradictory Authority (13 Phrases)

13 contradictory phrases are FORBIDDEN. The blueprint (as of v25.0 with §V25.0.A / §V25.0.B / §V25.0.C) does NOT contain any of these forbidden phrases (all `blueprintContains=false`). The corrections preserve the honest state throughout.

The complete list (with corrected language) is in `src/lib/final-integrated-architecture.ts` (`CONTRADICTORY_PHRASES_TO_CORRECT`).

## §V25.0.D.AS — Acceptance Criteria (44 Items)

44 acceptance criteria (AC-01..AC-44) — each declares `met=true` only when independent evidence is present. Honest state preserved: criteria are NOT marked `met=true` without evidence.

The complete table is in `src/lib/final-integrated-architecture.ts` (`FINAL_ACCEPTANCE_CRITERIA`).

## §V25.0.D.AT — Final Output Summary

The module exports `generateFinalIntegratedReport()` returning a `FinalIntegratedReport` containing:

- All 45 sections (A through AT)
- 5 corporate entities (Founder + Holding + Operating Co + Technology Co + Foundation)
- 7-layer MTQ model
- 13-step rebalancing flow
- 16-step gold acquisition workflow
- 16-step bank minting workflow
- DMCE formula (MIN of 8 limits)
- 13 technology services
- 16 data models
- 12 API endpoints
- 15 FV invariants (FV11-FV25; 8 NEW: FV18-FV25)
- 35 test scenarios (INT-T01..INT-T35)
- 3 dashboards (Monetary Control: 20 fields, Bank: 6 fields, Foundation read-only: 7 fields)
- 7×17 authority matrix
- 44 acceptance criteria
- 50 reconciliation principles
- Honest state preserved throughout
- Final status: **APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED**

The report is exposed at:

**GET `/api/final-integrated-architecture`**

```typescript
honestState: {
  honest: true,
  forcedToPass: false,
  productionAuthorized: false,
  nonCustodialByDefault: true,
  v25_0_Frozen: true,
  noV25_1Created: true
},
finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED"
```

## §V25.0.D.Closing — Closing Declaration

This final integrated reconciliation:

- **PRESERVES** the 21.5432% modeled constitutional reserve-breach probability for Model A.
- **PRESERVES** the 4.7086% blended breach probability for Model B and Model C.
- **PRESERVES** the ΔCapital_min ≈ $15.815M classification as MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT.
- **PRESERVES** the ILPS total of $48.1M (corrected; Emergency + Structural $23.8M is a SUBSET).
- **PRESERVES** the non-custodial default per §V25.0.C.
- **PRESERVES** the bank-funded issuance model per §V25.0.B.
- **PRESERVES** the third-party audit incorporation per §V25.0.A.
- **PRESERVES** the MBG / MSAS / 7 connector classes per existing `mithqal-bank-gateway.ts`.
- **PRESERVES** the canonical supply ledger theorems S1/S2/S3 per `canonical-supply-ledger.ts`.
- **PRESERVES** the 21.5432% monetary model lock per `monetary-model-lock.ts`.
- **INTRODUCES** 8 new formal-verification invariants (FV18-FV25).
- **INTRODUCES** the DMCE — Dynamic Minting Capacity Engine (MIN of 8 limits).
- **INTRODUCES** the 5-entity corporate structure (Founder + Holding + Operating Co + Technology Co + Foundation).
- **INTRODUCES** the 7-layer MTQ canonical model.
- **INTRODUCES** the 13-step rebalancing engine flow + 9 preservation requirements.
- **INTRODUCES** the 16-step gold acquisition workflow.
- **INTRODUCES** the 16-step bank minting workflow.
- **INTRODUCES** the 3-layer reserve valuation (R_m / R_a / R_l).
- **INTRODUCES** the constitutional corridors (fiat 70-85% / bullion 15-25% / digital 0-5%).
- **INTRODUCES** the 13 technology services.
- **INTRODUCES** the 16 data models.
- **INTRODUCES** the 12 versioned API endpoints.
- **INTRODUCES** the 35 integrated test scenarios.
- **INTRODUCES** the 3 dashboards (Monetary Control 20 + Bank 6 + Foundation 7).
- **INTRODUCES** the 7×17 authority matrix.
- **INTRODUCES** the 8 bank/custodian failure scenarios.
- **INTRODUCES** the 44 acceptance criteria.
- **INTRODUCES** the 50 reconciliation principles.
- **DOES NOT** create v25.1 — v25.0 remains the FROZEN NORMATIVE ARCHITECTURE.
- **DOES NOT** create v26.
- **DOES NOT** fork the architecture.
- **DOES NOT** redesign the reserve mathematics.
- **DOES NOT** create a competing rebalancing algorithm.
- **DOES NOT** turn USD into the monetary anchor.
- **DOES NOT** make MITHQAL a custodian.
- **DOES NOT** make MITHQAL a bank.
- **DOES NOT** make the Foundation an operator.
- **DOES NOT** make reserve appreciation a commercial profit source.

**Final status (unchanged):**
**APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.**

---

**END OF §V25.0 — FINAL INTEGRATED INSTITUTIONAL / BANKING / RESERVE / GOLD / REBALANCING ARCHITECTURE**

---

**END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION (WITH THIRD-PARTY AUDIT INCORPORATION + BANK-FUNDED ISSUANCE RECONCILIATION + NON-CUSTODIAL RESERVE ARCHITECTURE + FINAL INTEGRATED ARCHITECTURE)**

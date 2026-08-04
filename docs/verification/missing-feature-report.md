# MITHQAL v19.0 — Missing Feature Report
## Chief Constitutional Implementation Engineer · Independent Constitutional Compliance Auditor
### Task 12-a · Phase 3 — Zero-Gap Detection
### Date: 2026-08-26

**Blueprint source of truth:** `/home/z/my-project/docs/blueprint/blueprint.txt` (28,456 lines · 56 articles)

**Companion documents:**
- `implementation-compliance-matrix.md` — article-by-article traceability
- `divergence-report.md` — implementation-vs-blueprint divergences

**Priority legend:**
- **P0 — Critical** — Constitutional invariant violation or article-level missing functionality that blocks institutional operation
- **P1 — High** — Article-level missing functionality that materially impairs compliance but does not block operation
- **P2 — Medium** — Sub-article gap; partial implementation; cosmetic or non-blocking
- **P3 — Low** — Documentation, polish, or future-state item

**Effort legend (engineer-days):** S = ≤1 · M = 2-5 · L = 5-15 · XL = 15+

---

## P0 — CRITICAL GAPS (7)

### P0-1 · Article XIII — Liquidity Readiness Ratio (LRR) ENTIRELY MISSING
- **Blueprint:** Part 2 Article XIII, lines 7833-8024
- **Implementation:** none — searched `src/lib/` and `foundry/src/` for `LRR`, `liquidityReadiness`, `liquidity_readiness` — zero matches
- **Constitutional requirement:** `LRR = Immediately Available Liquidity ÷ Expected 30-Day Redemption Demand`, daily computation, 4 thresholds (Strong ≥ 1.2, Compliant ≥ 1.0, Marginal ≥ 0.9, Critical < 0.9), 95 % CI, 30/90/365-day trends, LRR under each of 20 Stress Lab scenarios, real-time monitoring with tiered alerts (1.2/1.1/1.0/0.9), historical retention (permanent), governance by Council, transparency disclosure in PoR
- **Files to create:**
  - `src/lib/liquidity-readiness-ratio.ts` — `computeLRR(immediateLiquidity, redemptionDemand)` + 4-tier classification + CI + trend
  - `src/app/api/lrr/route.ts` — GET endpoint exposing current LRR + history + scenarios
  - `foundry/src/LRR.sol` — on-chain LRR oracle (optional)
  - `src/components/lrr-dashboard.tsx` — UI card in transparency view
  - LRR alert hooks in `/api/proofs/publish` (record daily LRR)
- **Effort:** L (10 days)
- **Blocks:** Article VII expanded transparency #1 (Current LRR); Article X (Bullion Protection Rule's daily disclosure); Article XV (Stress Lab LRR-under-each-scenario)

### P0-2 · Article XVI — Constitutional Assumptions Register ENTIRELY MISSING
- **Blueprint:** Part 2 Article XVI, lines 8509-8764
- **Implementation:** `src/lib/v19-infrastructure.ts` §53.4 `CONSTANTS_REGISTRY` (version + lastUpdated + flat constants table) — partial; NO `AssumptionsRegister` table, NO per-simulation entry, NO 14 mandatory fields
- **Constitutional requirement:** Every simulation/stress test/validation/certification SHALL be recorded with: Random Seed, Input Assumptions, Economic Assumptions, Liquidity Assumptions, Correlation Assumptions, Market Conditions, Time Horizon, Confidence Level, Simulation Version, Software Version, Date, Author, Approval, Audit Signature. Immutable, auditable, binding (no simulation citable in governance without Register entry).
- **Files to create:**
  - `prisma/schema.prisma` — `AssumptionsRegisterEntry` model (14 fields + id + createdAt)
  - `src/lib/assumptions-register.ts` — `recordEntry()`, `getEntry()`, `verifyReproducibility()`
  - `src/app/api/assumptions-register/route.ts` — public GET (with pagination), auth-gated POST
  - `src/lib/tests/constitutional-stress-engine.ts` — instrument every Monte Carlo / CCAR run to record a Register entry
  - `src/app/api/proofs/publish/route.ts` — cite Register entry hash in daily PoR attestation
- **Effort:** L (8 days)
- **Blocks:** Article XI (Constitutional Risk Engineering reproducibility); Article XII (Constitutional Model Validation Framework stage artifacts); Article XIV (Reverse Stress Testing redesign recommendations)

### P0-3 · Article X — Exhaustion Certificate NOT Implemented
- **Blueprint:** Part 2 Article X, lines 7396-7484 (esp. "Every Gold liquidation event shall be accompanied by an Exhaustion Certificate signed by the Reserve Manager and ratified by the Risk Committee")
- **Implementation:** `src/lib/v19-infrastructure.ts` §34 `bullionProtectionCheck()` returns boolean `goldLiquidated` only — NO `ExhaustionCertificate` data structure, NO Reserve Manager signature, NO Risk Committee ratification, NO `Reserve.sol` refusal of Gold liquidation without certificate
- **Constitutional requirement:** Smart-contract enforcement — Reserve contract refuses Gold liquidation transactions unless Exhaustion Certificate is recorded; layered enforcement (smart-contract + operational + audit + disclosure + constitutional); personal accountability for Reserve Manager + Risk Committee Chair; mandatory restoration of Gold at Institution's expense
- **Files to create/modify:**
  - `foundry/src/Reserve.sol` — add `ExhaustionCertificate` struct (reserveManager signature, riskCommitteeChair signature, timestamp, exhausted tier balances, hash); refuse `withdrawReserve()` for `assetClass == gold` unless valid certificate recorded
  - `src/lib/exhaustion-certificate.ts` — off-chain certificate generator + verifier
  - `src/app/api/exhaustion-certificate/route.ts` — auth-gated POST (Reserve Manager) + ratification (Risk Committee Chair)
  - `prisma/schema.prisma` — `ExhaustionCertificate` model
  - `src/components/bullion-utilization.tsx` — UI disclosure of certificates
- **Effort:** XL (15+ days; touches smart contract + off-chain + governance + UI)
- **Blocks:** Article VII expanded transparency #4 (Bullion Utilization with Exhaustion Certificates); Invariant 5 (Bullion Preservation) enforcement

### P0-4 · Article VII — 8 Expanded Transparency Disclosures ENTIRELY MISSING
- **Blueprint:** Part 2 Article VII "Expanded Transparency Requirements" lines 6709-6874 (8 disclosures added in v19 Phase 9)
- **Implementation:** `/api/proofs/publish` publishes 7 numeric proofs (reserve_ratio, nav, basket_sum, duration, lcr, cri, por_hash) — NONE of the 8 expanded disclosures
- **Constitutional requirement (all 8 daily disclosures):**
  1. Current LRR with 95 % CI + 30/90/365-day trends + LRR under each of 20 Stress Lab scenarios
  2. Reserve Ladder (Immediate / Operational / Strategic / Constitutional Strategic Capital — Gold separately)
  3. Liquidity Waterfall (Tier 4 stablecoins → Tier 1 cash → Tier 2 sovereign → Tier 3 silver → Tier 3 gold with cumulative redemption capacity)
  4. Bullion Utilization (Gold/Silver liquidation events over trailing 30/90/365 days, each with Exhaustion Certificate)
  5. Stress Test Summary (NAV volatility, reserve ratio, LRR under each of 20 Stress Lab scenarios)
  6. Monte Carlo Results (probability of breach, survival rate, 95 % CI, simulation version, software version, Assumptions Register entry reference)
  7. Risk Dashboard (every constitutional tolerance Part 3 Art V + every invariant Part 2 Art I with status acceptable/elevated/critical)
  8. Institutional Metrics (total supply, total reserves, reserve ratio, PAR, NAV, participants, redemption/minting/transfer volumes, custody/jurisdiction/custodian composition, audit history, governance decisions)
- **Files to create:**
  - `src/app/api/transparency/route.ts` — extend response with `expandedTransparency` object containing all 8 disclosures
  - `src/components/transparency.tsx` — render 8 new cards/tables
  - `src/app/api/proofs/publish/route.ts` — record all 8 disclosures as separate proof types
  - `prisma/schema.prisma` — new `ExpandedDisclosure` model
- **Effort:** XL (15+ days; depends on P0-1 LRR, P0-2 Register, P0-3 Exhaustion Cert, P0-5 Stress Lab, P0-6 Reverse Stress)
- **Blocks:** Article VII (Proof of Reserves) constitutional compliance; institutional credibility

### P0-5 · Article XV — 20 Constitutional Stress Laboratory Scenarios MOSTLY MISSING
- **Blueprint:** Part 2 Article XV, lines 8187-8508 (20 named scenarios)
- **Implementation:** `src/lib/v19-infrastructure.ts` §40 `STRESS_SCENARIOS` lists 10 generic categories; `src/lib/tests/constitutional-stress-engine.ts` has 16-variable `StressConfig` but only 3 named scenarios (CCAR Severely Adverse, 2008 episode, 2020 episode). 17 of 20 named scenarios MISSING.
- **Constitutional requirement (20 named scenarios):** Global Recession · Hyperinflation · Currency Collapse · Gold Market Closure · Silver Market Closure · Commodity Crisis · SWIFT Outage · Capital Controls · Sanctions · Custodian Failure · Oracle Failure · Cyber Attack · Liquidity Freeze · Dealer Failure · Simultaneous Redemption Wave · Central Bank Crisis · Multiple Sovereign Defaults · Energy Crisis · Pandemic · Black Swan
- **Files to create:**
  - `src/lib/stress-lab-scenarios.ts` — `STRESS_LAB_SCENARIOS: StressScenario[]` with all 20 named scenarios (each with documented assumptions, expected NAV vol, expected RR, expected LRR)
  - `src/lib/tests/constitutional-stress-engine.ts` — `runAll20Scenarios()` function returning per-scenario results
  - `src/app/api/stress-lab/route.ts` — public GET returning all 20 scenario results
  - `src/components/stress-lab-results.tsx` — UI table with 20 rows
  - Annual Council review hook (calendar reminder + resolution proposal)
- **Effort:** L (10 days)
- **Blocks:** Article VII #5 (Stress Test Summary); Article XIII (LRR under each scenario); Article XIV (Reverse Stress)

### P0-6 · Article VIII (Layer 1) — Constitutional Risk Parameter Approval NOT Enforced
- **Blueprint:** Part 1 Article VIII (Governance), Phase 10 expansion: "Council approval required for every risk parameter, correlation assumption, simulation assumption, stress model, liquidity model, and mathematical constant"
- **Implementation:** `CONSTITUTIONAL_CONSTANTS` registry marks 1 of 27 constants as non-modifiable (`RR_min = 1.00`); 26 constants are theoretically modifiable via §43 amendment — but NO runtime gate prevents Council from amending them without "Constitutional Stability Certification" evidence
- **Constitutional requirement:** Every risk-parameter change requires (a) Monte Carlo evidence, (b) Stress Lab evidence, (c) Reverse Stress evidence, (d) Independent Verification, (e) Council supermajority (6/7), (f) 90-day timelock, (g) Constitutional Stability Certification instrument
- **Files to create/modify:**
  - `src/lib/constitutional-risk-parameter-approval.ts` — `proposeParameterChange()`, `attachEvidence()`, `requestCouncilApproval()`, `issueStabilityCertification()`
  - `foundry/src/Governance.sol` — extend `createConstitutionalProposal()` to require `evidenceHash` (Merkle root of Monte Carlo + Stress Lab + Reverse Stress results) for any proposal affecting §53 constants
  - `src/app/api/governance/risk-parameter/route.ts` — risk-parameter-specific proposal flow
- **Effort:** L (8 days)
- **Blocks:** Article XI (Risk Engineering binding on governance); Article XII (Model Validation Framework Constitutional Approval stage)

### P0-7 · Layer 2 Article I — Invariant 5 Divergence (Bullion Preservation vs. "No Redemption Suspension")
- **Blueprint:** Part 2 Article I Invariant 5 (v19 evolved): "Bullion Preservation — Gold shall only be liquidated after all constitutionally superior liquidity tiers have been exhausted, in accordance with the Reserve Liquidation Order established by Article X"
- **Implementation:** `foundry/src/MTQ.sol` line 13: "No redemption suspension: burn always works, redemption never pauses (Invariant 5)"; `foundry/src/Redeem.sol` line 14, 20, 85, 106, 116, 132: "Invariant 5" = "redemption never pauses"; `src/lib/constitution-data.ts` LAYER_2.articles[0] purpose: "no redemption suspension"
- **Constitutional violation:** The "no redemption suspension" guarantee exists in the blueprint at §45.2 (Redemption Rights, non-amendable) — NOT at Article I Invariant 5. v19 Invariant 5 is Bullion Preservation.
- **Fix required:**
  - `foundry/src/MTQ.sol` — re-label "Invariant 5" references as "§45.2 Redemption Rights"; add a new "Invariant 5 — Bullion Preservation" comment block
  - `foundry/src/Redeem.sol` — same re-labelling
  - `foundry/src/Algorithm.sol` — same re-labelling
  - `src/lib/constitution-data.ts` — update LAYER_2.articles[0] purpose to enumerate all 5 v19 invariants (100 % Reserve Ratio · No Discretionary Minting · No Lending · No Commingling · Bullion Preservation)
  - `foundry/src/Reserve.sol` — add Bullion Preservation enforcement (refuse Gold liquidation without Exhaustion Certificate — depends on P0-3)
  - `foundry/test/MTQInvariant.t.sol` — add test case for Invariant 5 (Bullion Preservation)
- **Effort:** M (3 days for re-labelling; P0-3 covers the enforcement part)
- **Blocks:** Constitutional semantic accuracy; auditor sign-off

---

## P1 — HIGH GAPS (12)

### P1-1 · Article XII — 8-Stage Model Validation Framework mostly missing
- **Blueprint:** Part 2 Article XII, lines 7691-7832
- **Implementation:** `src/lib/v19-infrastructure.ts` §52 `ENGINE_VERSIONS` (Stage 6 only); Foundry invariant tests (Stage 5 partial)
- **Missing stages:** Implementation Verification (line-by-line spec review), Independent Mathematical Review (external reviewer), Regression Testing (formal properties registry), Audit Trail (model-action log), Constitutional Approval (Council gate before activation)
- **Files to create:** `src/lib/model-validation-framework.ts` with `validateModel()` orchestrator for all 8 stages; `prisma/schema.prisma` `ModelValidationRecord` model; `src/app/api/model-validation/route.ts`
- **Effort:** L (10 days)

### P1-2 · Article XIV — 7 Reverse Stress Failure Modes mostly missing
- **Blueprint:** Part 2 Article XIV, lines 8025-8186
- **Implementation:** `src/lib/tests/constitutional-stress-engine.ts` Phase 6 `proveBullionProtection()` (proof-by-contradiction on bullion only)
- **Missing failure modes:** Liquidity Failure, Redemption Failure, Collateral Failure, Governance Failure, Operational Failure, Settlement Failure; Redesign Recommendations module
- **Files to create:** `src/lib/reverse-stress-testing.ts` with `reverseStressTest(failureMode)` for all 7 modes; `src/app/api/reverse-stress/route.ts`
- **Effort:** L (8 days)

### P1-3 · Article III (Layer 1) — Decision Hierarchy API missing
- **Blueprint:** Part 1 Article III, lines 419-636
- **Implementation:** Hierarchy described in constitution UI; smart-contract governance gates by role
- **Missing:** Runtime API exposing the full decision-hierarchy table (Constitution > Invariants > Council > Committees > Officers > Participants) with precedence, scope, override rules
- **Files to create:** `src/lib/decision-hierarchy.ts` data table; `src/app/api/decision-hierarchy/route.ts`
- **Effort:** S (1 day)

### P1-4 · Layer 3 Article I — Minimum Constitutional Buffer NOT enforced
- **Blueprint:** Part 3 Article I "Minimum Constitutional Buffer", lines 5410-5480
- **Implementation:** Code comment in `nav-compute.ts` line 46 says "raised to 8 % buffer (constitutional Monte Carlo optimal)" — but NO `MIN_CONSTITUTIONAL_BUFFER = 0.08` constant, NO ratchet mechanism, NO Council-only increase authority, NO automated check
- **Constitutional requirement:** Reserve Value ≥ Supply × PAR × 1.08 at all times; Council may increase but never decrease the 8 % floor; ratcheted upward only on the basis of Monte Carlo + Stress Lab evidence
- **Files to create:** `src/lib/min-constitutional-buffer.ts` constant + check; wire into `computeReserveRatio()` (`bufferCompliant: boolean` field); `foundry/src/Reserve.sol` on-chain check; amendment gate in `Governance.sol`
- **Effort:** M (3 days)

### P1-5 · Layer 3 Article I — Rebalancing Thresholds NOT enforced at runtime
- **Blueprint:** Part 3 Article I "Rebalancing Thresholds", lines 5280-5360
- **Implementation:** `src/lib/v19-infrastructure.ts` §29 `detectRebalanceTriggers()` uses a single `rebalanceThreshold` (default 2 %)
- **Missing tier-specific thresholds:** Tier 1: ±3 % deviation; Tier 2: ±3 %; Tier 3: ±3 %; Tier 4: ±2 %; Gold: ±5 %; Silver: ±5 %
- **Files to modify:** `src/lib/v19-infrastructure.ts` — extend `RebalanceContext` with `tierThresholds: Record<assetClass, number>`; update `detectRebalanceTriggers()` to use per-tier thresholds
- **Effort:** M (2 days)

### P1-6 · Layer 4 Article VIII — Disaster Recovery Framework MISSING
- **Blueprint:** Part 4 Article VIII, lines 21205-22171
- **Implementation:** `foundry/POST-QUANTUM-ROADMAP.md` + `BACKUP-AND-RECOVERY.md` + Emergency Custodian role only
- **Missing:** Custody-loss recovery procedure; cryptographic-failure recovery (key compromise); market-crash recovery (RR breach); governance-failure recovery (Council capture). No `DisasterRecovery` contract; no automated recovery playbooks; no periodic DR drill scheduler.
- **Files to create:** `src/lib/disaster-recovery.ts` with 4 recovery playbooks; `foundry/src/DisasterRecovery.sol`; `src/app/api/disaster-recovery/route.ts`; quarterly DR drill scheduler
- **Effort:** XL (15+ days)

### P1-7 · Layer 4 Article II — Post-Quantum Cryptography NOT implemented
- **Blueprint:** Part 4 Article II, lines 15969-16790
- **Implementation:** `foundry/POST-QUANTUM-ROADMAP.md` (documentation only); `src/lib/v19-infrastructure.ts` §39 uses HMAC for simulated signing
- **Missing:** Falcon-512 signature verification (2027 milestone); Lamport one-time signatures; dual-signature support period (2028); mandatory PQC (2029)
- **Files to create:** `foundry/src/PQCVerifier.sol` (Falcon-512 precompile wrapper); `src/lib/pqc-keys.ts`
- **Effort:** XL (15+ days; requires Solidity precompile support)

### P1-8 · Layer 4 Article IV — ISO 20022 / SWIFT / CBDC Interop MISSING
- **Blueprint:** Part 4 Article IV, lines 17793-18530
- **Implementation:** `foundry/src/MTQ.sol` (ERC-20 standard only)
- **Missing:** ISO 20022 messaging adapter; SWIFT integration layer; CBDC integration (Digital Dirham → mBridge → Digital Euro/Yuan/Dollar)
- **Files to create:** `src/lib/iso-20022.ts` message builder/parser; `src/app/api/iso-20022/route.ts`; CBDC adapter contracts
- **Effort:** XL (15+ days)

### P1-9 · Layer 4 Article III — Live Multi-Oracle Consensus NOT deployed
- **Blueprint:** Part 4 Article III, lines 16791-17792
- **Implementation:** `foundry/src/Oracle.sol` (single-provider ADMIN_ROLE-controlled); `foundry/src/MockOracle.sol` (single-provider mock); `src/lib/live-oracle.ts` (free public APIs: gold-api.com, open.er-api.com, CoinGecko)
- **Missing live integrations:** Chainlink, Pyth, Chronicle, RedStone (4 external oracle families); LBMA Direct Feed; Central Bank FX Feeds (BIS/ECB/Fed/BoE/BoJ); Internal Pricing Committee (7 members, 5/7 quorum, 75 % supermajority, 30-day max activation)
- **Files to create:** `foundry/src/MultiOracleConsensus.sol` aggregating 4+ external feeds with medianization + 2 % outlier exclusion + ≥ 5/8 quorum + 48-hour TWAP fallback; `src/lib/oracle-clients/{chainlink,pyth,chronicle,redstone}.ts`
- **Effort:** XL (15+ days; requires mainnet oracle subscriptions)

### P1-10 · Layer 5 Article IV — Compliance Execution MISSING
- **Blueprint:** Part 5 Article IV, lines 24488-25360
- **Implementation:** `src/lib/v19-infrastructure.ts` §48 `US_REGULATORY_FRAMEWORK` (10 items, mostly "pending"); `/api/brain/compliance` (AI KYC screening only)
- **Missing:** Sanctions screening API (OFAC SDN/SSI, UN, EU, UK, MAS, UAE); SAR/STR filing workflow; regulatory reporting (CTR, FBAR, Form 8938); audit-trail immutability (write-once ledger); compliance officer role
- **Files to create:** `src/lib/sanctions-screening.ts` with `screenAddress()`, `screenTransaction()`; `foundry/src/SanctionsRegistry.sol` on-chain frozen-funds ledger; `src/app/api/sar-str/route.ts`; `src/app/api/regulatory-report/route.ts`
- **Effort:** XL (15+ days)

### P1-11 · Layer 5 Article I — Tier-level Rebalancing NOT persisted
- **Blueprint:** Part 5 Article I, lines 22345-22931
- **Implementation:** `src/lib/v19-infrastructure.ts` §29 `detectRebalanceTriggers()` + `generateRebalancePlan()` (in-memory only)
- **Missing:** Daily rebalancing decision log (persisted); quarterly custody audit (scheduled); tier-level rebalancing thresholds (enforced at runtime)
- **Files to create:** `prisma/schema.prisma` `RebalanceDecision` model; `src/app/api/rebalance-log/route.ts`; quarterly cron scheduler
- **Effort:** M (5 days)

### P1-12 · Layer 4 Article I — 3 Smart Contracts MISSING from blueprint inventory
- **Blueprint:** Part 4 Article I contract inventory, lines 14821-14830 (lists 11 contracts)
- **Implementation:** 9 contracts deployed (`MTQ.sol`, `Mint.sol`, `Redeem.sol`, `Reserve.sol`, `Algorithm.sol`, `Governance.sol`, `Oracle.sol`, `Takaful.sol`, `MockOracle.sol`)
- **Missing contracts:**
  - `Registry.sol` — participant registry (Layer 5 Article III Participant Services)
  - `ProxyAdmin.sol` — upgrade administration (Layer 4 Article I §4 Upgradeability with Governance)
  - `Emergency.sol` — emergency protocols (Layer 1 Article X Emergency Governance on-chain)
- **Files to create:** 3 new Solidity contracts in `foundry/src/`; Foundry tests for each
- **Effort:** L (8 days)

---

## P2 — MEDIUM GAPS (18)

### P2-1 · Layer 2 Article VI — Macro Overlay module missing
- **Blueprint:** Part 2 Article VI Component 4 "Macro Overlays", lines 5997-6029
- **Implementation:** Only Shock Absorber (Component 5) implemented
- **Missing:** Macro Overlay activation conditions (5 % NAV deviation trigger, sustained currency volatility, Council approval, 30-day expiry, ±10 % cap); macro overlay publication flow
- **Files to create:** `src/lib/macro-overlay.ts` with `activateOverlay()`, `extendOverlay()`, `expireOverlay()`; `src/app/api/macro-overlay/route.ts`
- **Effort:** M (4 days)

### P2-2 · Layer 2 Article IV — Dynamic Correlation re-validation NOT enforced
- **Blueprint:** Part 2 Article IV "Dynamic Correlation Principle", lines 5303-5361
- **Implementation:** Gold-Silver correlation (`DEFAULT_GOLD_SILVER_CORR`) is a code constant in `constitutional-stress-engine.ts`
- **Missing:** Council approval for every correlation parameter change; drift alert (rolling correlation deviates from approved estimate); quarterly re-validation recorded in Constitutional Assumptions Register (depends on P0-2)
- **Files to create:** `src/lib/correlation-monitor.ts`; `src/app/api/correlation/route.ts`; quarterly cron
- **Effort:** M (5 days)

### P2-3 · Layer 2 Article XI — Independent Verification NOT formalized
- **Blueprint:** Part 2 Article XI technique 10, lines 7625-7654
- **Implementation:** Self-verification only (engineering team runs Monte Carlo)
- **Missing:** External reviewer signature; reproducibility verification from Register entry (depends on P0-2); `independentVerification` field in attestation
- **Effort:** M (3 days)

### P2-4 · Layer 2 Article XI — Simulation Governance NOT enforced
- **Blueprint:** Part 2 Article XI technique 11, lines 7655-7684
- **Implementation:** Engineering team runs simulations without Council oversight
- **Missing:** Council approval of scope/methodology/assumptions before each exercise; Council review of results; permanent retention of Council approval records
- **Files to create:** `src/app/api/simulation-governance/route.ts` (Council approval flow); wire into `constitutional-stress-engine.ts`
- **Effort:** M (3 days)

### P2-5 · Layer 2 Article XI — Deterministic Certification NOT formalized
- **Blueprint:** Part 2 Article XI technique 12, lines 7685-7710
- **Implementation:** Lyapunov stability and monotone convergence not formally proven
- **Missing:** `ConstitutionalStabilityCertification` instrument; mathematical proof artifacts; certification reference in `CONSTITUTIONAL_CONSTANTS`
- **Effort:** L (8 days; requires mathematician review)

### P2-6 · Layer 1 Article XI — Regulatory Adaptability tracking missing
- **Blueprint:** Part 1 Article XI, lines 2167-2420
- **Implementation:** `src/lib/v19-infrastructure.ts` §48 `US_REGULATORY_FRAMEWORK` static list
- **Missing:** Live regulatory-change-tracking API; quarterly compliance status review
- **Effort:** M (5 days)

### P2-7 · Layer 1 Article XVII — 5-Year Independent Review NOT scheduled
- **Blueprint:** Part 1 Article XVII, lines 3888-4223
- **Implementation:** 9-expert panel composition documented
- **Missing:** Scheduled trigger; operational review framework; public review archive
- **Effort:** M (4 days)

### P2-8 · Layer 3 Article II — Committee mandates NOT exposed via API
- **Blueprint:** Part 3 Article II, lines 10142-10897
- **Implementation:** Textual description in `constitution-data.ts`
- **Missing:** Runtime API exposing committee-specific decision thresholds, reporting cadence, binding-powers matrix
- **Effort:** M (3 days)

### P2-9 · Layer 3 Article IV — Sanctions screening API missing
- **Blueprint:** Part 3 Article IV, lines 11438-11904
- **Implementation:** "OFAC Sanctions Screening" listed as implemented in `US_REGULATORY_FRAMEWORK`
- **Missing:** Live sanctions-screening API; `screenAddress()` function; frozen-funds ledger; SAR/STR filing workflow
- **Effort:** L (8 days; overlaps with P1-10)

### P2-10 · Layer 3 Article VI — Maturity-stage tracking missing
- **Blueprint:** Part 3 Article VI, lines 12630-13221
- **Implementation:** 6 maturity stages described in `site-data.ts`
- **Missing:** Formation-stage requirements checklist API; automated stage-transition triggers
- **Effort:** M (4 days)

### P2-11 · Layer 3 Article VII — Review-cycle scheduler missing
- **Blueprint:** Part 3 Article VII, lines 13222-14040
- **Implementation:** Daily proof cadence + transaction log
- **Missing:** Quarterly independent-audit scheduler; annual comprehensive-review report generator; 5-year independent-review trigger
- **Effort:** M (5 days)

### P2-12 · Layer 3 Article VIII — Physical redemption (bullion delivery) pathway missing
- **Blueprint:** Part 3 Article VIII, lines 14041-14621
- **Implementation:** `foundry/src/Redeem.sol` `redeemForBurn()` (cash/stablecoin path only)
- **Missing:** `redeemPhysical()` function (1 kg gold / 100 g gold small / 100 kg silver minimums; 1-2 % processing + 1-3 % delivery + 1-2 % market premiums; physical delivery via custodian)
- **Files to create:** `foundry/src/Redeem.sol` add `redeemPhysical()`; `src/app/api/redeem/physical/route.ts`; `src/lib/physical-redemption.ts`
- **Effort:** L (7 days)

### P2-13 · Layer 4 Article II — Lamport one-time signatures missing
- **Blueprint:** Part 4 Article II, lines 15969-16790
- **Implementation:** 4-tier key hierarchy with HMAC (testnet)
- **Missing:** Lamport one-time signature scheme for emergency recovery
- **Effort:** M (5 days)

### P2-14 · Layer 4 Article V — Bug bounty programme not launched
- **Blueprint:** Part 4 Article V, lines 18531-19612
- **Implementation:** Multiple audit reports; Certora specs; Slither config
- **Missing:** Bug bounty programme (Immunefi/HackerOne); centralized defense-in-depth documentation; incident response runbook
- **Effort:** M (5 days to launch; ongoing operational)

### P2-15 · Layer 4 Article VII — Certora specs cover only 2 of 9 contracts
- **Blueprint:** Part 4 Article VII, lines 20549-21204
- **Implementation:** `foundry/certora/MTQ.spec`, `MockOracle.spec` (2 specs)
- **Missing:** Certora specs for `Mint.sol`, `Redeem.sol`, `Reserve.sol`, `Algorithm.sol`, `Governance.sol`, `Takaful.sol`, `Oracle.sol` (7 specs)
- **Effort:** L (10 days)

### P2-16 · Layer 5 Article III — Participant services (UBO/EDD/ongoing monitoring) missing
- **Blueprint:** Part 5 Article III, lines 23750-24487
- **Implementation:** Formation Committee intake + AI KYC screening + 2FA operator auth
- **Missing:** UBO identification; enhanced due diligence workflow; ongoing monitoring (periodic re-KYC); participant registry (`Registry.sol`)
- **Effort:** L (8 days)

### P2-17 · Layer 5 Article V — Technical operations runbook missing
- **Blueprint:** Part 5 Article V, lines 25361-26482
- **Implementation:** Health checks + status dashboard + rate limiting
- **Missing:** Incident response runbook; change-management workflow; SLA monitoring
- **Effort:** M (5 days)

### P2-18 · Layer 5 Article VII — Auto-generated reports missing
- **Blueprint:** Part 5 Article VII, lines 27350-28221
- **Implementation:** Daily proofs + transaction log + governance log + OpenAPI spec
- **Missing:** Quarterly risk-committee report auto-generator; annual comprehensive report auto-generator; council-decision archive queryable by date range
- **Effort:** M (5 days)

---

## P3 — LOW GAPS (8)

### P3-1 · Layer 1 Article IX — 20 % founder supply cap not enforced
- **Blueprint:** Part 1 Article IX, lines 1831-1994
- **Implementation:** Documented in `constitution-data.ts` only
- **Missing:** MTQ.sol transfer hook blocking founder+affiliates from holding > 20 % of circulating supply
- **Effort:** M (3 days)

### P3-2 · Layer 2 Article VI — Quarterly/Historical calculation records not centralized
- **Blueprint:** Part 2 Article VI "Engine Review and Evolution", lines 6079-6137
- **Implementation:** Engine version history in `ENGINE_VERSIONS`
- **Missing:** Quarterly performance review (Council); annual methodology review; 5-year independent review (Risk Panel)
- **Effort:** M (4 days)

### P3-3 · Layer 3 Article III — Custody fee (0.10 %/yr, monthly deduction) not automated
- **Blueprint:** Part 3 Article III "Custody Fee", lines 11145-11192
- **Implementation:** `CUSTODY_FEE_BPS_ANNUAL = 10` constant in `monetary-engine-v19.ts`
- **Missing:** Monthly cron to deduct custody fee from reserves
- **Effort:** S (1 day)

### P3-4 · Layer 4 Article VI — Vendor sunset review cron missing
- **Blueprint:** Part 4 Article VI §56.15, lines 19810-19915
- **Implementation:** `DEPENDENCY_SUNSET_INTERVAL_YEARS = 3` constant
- **Missing:** Automated cron that flags dependencies within 90 days of sunset for renewal review
- **Effort:** S (1 day)

### P3-5 · Layer 5 Article II — Indexer tx_hash on-chain verification
- **Blueprint:** Part 5 Article II, lines 22932-23749
- **Implementation:** `/api/mint`, `/api/redeem`, `/api/transfer` record `tx_hash` from client-submitted payload
- **Missing:** Backend `eth_getTransactionReceipt` verification of submitted tx_hash (from/to/amount match) before persisting
- **Effort:** M (3 days)

### P3-6 · Layer 1 Article XV — Unified success-metric scorecard missing
- **Blueprint:** Part 1 Article XV, lines 3261-3526
- **Implementation:** `/api/status` and `/api/proofs/latest` expose individual metrics
- **Missing:** Unified dashboard surfacing all 5 success-metric categories (reserve ratio, redemption finality, settlement neutrality, transparency cadence, governance integrity) as a single scorecard
- **Effort:** M (3 days)

### P3-7 · Layer 2 Article IX — Sharia Committee as runtime governance body
- **Blueprint:** Part 2 Article IX, lines 6931-7395
- **Implementation:** `SHARIA_REQUIREMENTS` constant + `Takaful.sol`
- **Missing:** On-chain `ShariaCommittee.sol` contract with binding ruling authority
- **Effort:** L (7 days)

### P3-8 · Layer 4 Article V — Bug bounty operational items
- **Blueprint:** Part 4 Article V, lines 18531-19612
- **Implementation:** Security documentation present
- **Missing:** Immunefi/HackerOne programme setup; payout schedule; disclosure policy
- **Effort:** M (5 days; operational)

---

## SUMMARY

| Priority | Count | Estimated Engineer-Days |
|---|---:|---:|
| **P0 — Critical** | 7 | 86+ (incl. P0-4 XL dependency) |
| **P1 — High** | 12 | 130+ |
| **P2 — Medium** | 18 | 95+ |
| **P3 — Low** | 8 | 27+ |
| **TOTAL** | **45 gaps** | **338+ engineer-days** |

### Top 5 highest-leverage gaps to close first:
1. **P0-1 LRR** (10 days) — unlocks P0-4 disclosures #1, #5
2. **P0-2 Assumptions Register** (8 days) — unlocks P0-4 disclosure #6, P1-1, P1-3, P2-3, P2-4
3. **P0-5 Stress Lab 20 scenarios** (10 days) — unlocks P0-4 disclosures #5, P1-2
4. **P0-3 Exhaustion Certificate** (15+ days) — unlocks P0-4 disclosure #4, P0-7 enforcement
5. **P0-7 Invariant 5 re-labelling** (3 days) — semantic correctness, auditor sign-off

Closing P0-1 + P0-2 + P0-3 + P0-5 + P0-7 (≈ 46 engineer-days) would unblock P0-4 (8 expanded disclosures, ≈ 15 days) — bringing the Institution to **Article VII full constitutional compliance** within ≈ 61 engineer-days.

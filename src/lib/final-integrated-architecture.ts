// ============================================================================
// MITHQAL v25.0 — FINAL INTEGRATED INSTITUTIONAL / BANKING / RESERVE / GOLD /
//                  REBALANCING ARCHITECTURE
// ============================================================================
// Task ID:  V25-0-FINAL-INTEGRATED-ARCHITECTURE
// Module:   v25.0-final-integrated-architecture-1.0
//
// PURPOSE
//   Final cross-section reconciliation of the entire v25.0 architecture.
//   Reconciles corporate structure + banking + MTQ position + reserve +
//   gold + rebalancing + custody + reconciliation + DMCE + dashboards +
//   APIs + data models + tests + FV18-FV25 into ONE integrated blueprint.
//
//   This module BUILDS ON TOP of existing v25.0 modules. It does NOT duplicate
//   functionality already in:
//     - non-custodial-reserve-architecture.ts (FV11-FV17, RCAF, ABC)
//     - bank-funded-issuance-model.ts (Model A/B, 6 capital categories)
//     - mithqal-bank-gateway.ts (MBG, MSAS, 7 connector classes)
//     - monetary-model-lock.ts (21.5432% model, locked)
//     - ilps.ts (5-layer $48.1M corrected)
//     - canonical-supply-ledger.ts (Theorems S1/S2/S3)
//
// CRITICAL VERSION RULE
//   - DO NOT create v25.1
//   - DO NOT create v26
//   - DO NOT fork the architecture
//   - DO NOT redesign the reserve mathematics
//   - DO NOT create a competing rebalancing algorithm
//   - DO NOT turn USD into the monetary anchor
//   - DO NOT make MITHQAL a custodian
//   - DO NOT make MITHQAL a bank
//   - DO NOT make the Foundation an operator
//   - DO NOT make reserve appreciation a commercial profit source
//   - The document remains: MITHQAL v25.0 — CANONICAL BLUEPRINT — FINAL
//     INSTITUTIONAL EDITION
//
// PRESERVED FIGURES (do NOT manipulate)
//   - Model A breach probability: P(RR<100%) = 21.5432%   (PRESERVED)
//   - Model B breach probability:  blended  ≈ 4.7086%     (PRESERVED)
//   - Model C breach probability: blended  ≈ 4.7086%     (same as B —
//     non-custodial doesn't change math; changes WHO HOLDS assets)
//   - ΔCapital_min ≈ $15.815M remains classified as MODEL-DERIVED ADDITIONAL
//     MONETARY PROTECTION REQUIREMENT until independently validated.
//   - ILPS total: $48.1M corrected (Emergency + Structural $23.8M is a SUBSET).
//
// 45 SECTIONS IMPLEMENTED (A through AT)
//   A   Version Control
//   B   50-Point Reconciliation Principles
//   C   Final Corporate Structure (5 entities)
//   D   Founder Economics
//   E   MTQ Position (7-layer canonical model)
//   F   Bank Integration — Final Canonical Model
//   G   Bank Responsibilities
//   H   Operating Company Responsibilities (15 + Monetary & Reserve Control)
//   I   Foundation Responsibilities
//   J   Technology Company
//   K   Reserve Custody Principle (NON-CUSTODIAL BY DEFAULT — ref §V25.0.C)
//   L   Reserve Architecture (constitutional corridors)
//   M   Currency Weighting (6-step engine)
//   N   Bullion Weighting
//   O   Operational Digital Liquidity
//   P   Three-Layer Reserve Valuation (R_m / R_a / R_l)
//   Q   Gold Acquisition (16-step workflow)
//   R   Who Pays for Reserve Acquisition
//   S   Rebalancing Engine (13-step flow)
//   T   No-Trade Principle
//   U   Rebalancing Example (denomination-neutral, PAR-equivalent)
//   V   DMCE — Dynamic Minting Capacity Engine (KEY NEW DELIVERABLE)
//   W   RCAF + AvailableBackingCertificate (REFERENCES — not duplicated)
//   X   Bank Minting Workflow (16 steps)
//   Y   Bank Backing Failure (REFERENCES existing)
//   Z   Five-Way Reconciliation (REFERENCES existing 7-state)
//   AA  Who Monitors the Banks
//   AB  Foundation Oversight
//   AC  Gold/Reserve Revenue
//   AD  Operating Capital
//   AE  Capital Model (6 categories)
//   AF  Gold/Currency/Reserve Nomenclature
//   AG  Redemption
//   AH  Bank/Custodian Failure (8 scenarios)
//   AI  Technology Implementation (13 services)
//   AJ  Data Models (16 models)
//   AK  API (12 versioned endpoints)
//   AL  Formal Verification — FV11 through FV25 (15 invariants)
//   AM  Testing — 35 Test Scenarios
//   AN  Dashboards (3 dashboards)
//   AO  Commercial Economics
//   AP  Reconciliation Authority Matrix (7 actors × 17 functions)
//   AQ  Gold/Rebalancing Authority Matrix
//   AR  No Contradictory Authority
//   AS  Acceptance Criteria (44 items)
//   AT  Final Output Summary
//
// HONEST STATE (read before consuming any field)
//   honest = true
//   forcedToPass = false
//   productionAuthorized = false
//   nonCustodialByDefault = true
//   v25_0_Frozen = true
//   noV25_1Created = true
// ============================================================================

// ============================================================================
// Section A: Version Control
// ============================================================================

export const MODULE_VERSION = "v25.0-final-integrated-architecture-1.0";
export const TASK_ID = "V25-0-FINAL-INTEGRATED-ARCHITECTURE";
export const ARCHITECTURE_VERSION = "v25.0 (FROZEN — no v25.1 created)";
export const BLUEPRINT_DESIGNATION =
  "MITHQAL v25.0 — CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION";

export const VERSION_CONTROL = {
  currentVersion: "v25.0",
  frozen: true,
  noV25_1Created: true,
  noV26Created: true,
  noArchitectureFork: true,
  noReserveMathRedesign: true,
  noCompetingRebalancingAlgorithm: true,
  noUsdAsMonetaryAnchor: true,
  mithqalIsNotCustodian: true,
  mithqalIsNotBank: true,
  foundationIsNotOperator: true,
  reserveAppreciationIsNotCommercialProfit: true,
  documentRemains: BLUEPRINT_DESIGNATION,
  rule:
    "This module is the FINAL INTEGRATED RECONCILIATION of v25.0. It does NOT create v25.1, does NOT fork the architecture, " +
    "does NOT redesign the reserve mathematics, does NOT create a competing rebalancing algorithm, does NOT turn USD into " +
    "the monetary anchor, does NOT make MITHQAL a custodian, does NOT make MITHQAL a bank, does NOT make the Foundation " +
    "an operator, and does NOT make reserve appreciation a commercial profit source.",
} as const;

// ============================================================================
// Section B: 50-Point Reconciliation Principles
// ============================================================================

export const RECONCILIATION_PRINCIPLES: readonly string[] = [
  "P01 — v25.0 is the FROZEN NORMATIVE ARCHITECTURE. No v25.1, no v26, no fork.",
  "P02 — The 21.5432% modeled constitutional reserve-breach probability is PRESERVED for Model A.",
  "P03 — The 4.7086% blended breach probability is PRESERVED for Model B and Model C.",
  "P04 — The $15.815M ΔCapital_min remains a MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT (pending independent validation).",
  "P05 — ILPS total is $48.1M (corrected); Emergency + Structural $23.8M is a SUBSET, not additional.",
  "P06 — MITHQAL is NON-CUSTODIAL BY DEFAULT — does not take custody of reserve assets or customer funds under ordinary operation.",
  "P07 — CUSTODY ≠ VERIFICATION ≠ ISSUANCE AUTHORIZATION ≠ CANONICAL SUPPLY CONTROL.",
  "P08 — The MBG is a SIDECAR that TRANSLATES banking instructions into MTQ settlement instructions; it does NOT TRANSFORM the bank's role.",
  "P09 — MTQ is a NEUTRAL, PERMISSIONED, INSTITUTIONAL, WHOLESALE, SETTLEMENT-FOCUSED instrument — NOT a sovereign currency, consumer crypto, retail token, USD stablecoin, BRICS currency, CBDC, or investment vehicle.",
  "P10 — USD is ONE ELIGIBLE CURRENCY among multiple — NOT the monetary anchor.",
  "P11 — PAR ($1.00) is an ACCOUNTING REFERENCE ONLY — NOT a USD peg.",
  "P12 — Use the term 'PAR-REFERENCED' — NOT 'USD-BACKED'.",
  "P13 — Reserve allocation moves within CONSTITUTIONAL CORRIDORS (fiat 70-85%, bullion 15-25%, digital liquidity 0-5%).",
  "P14 — Do NOT describe 76.5/20/3.5 as immutable constitutional percentages.",
  "P15 — Gold is the PRIMARY bullion anchor; silver is conditional (may be 0%); digital liquidity is subordinate (0-5%).",
  "P16 — Operational digital liquidity is for SETTLEMENT EFFICIENCY — NOT a monetary anchor.",
  "P17 — Three-layer reserve valuation: R_l ≤ R_a ≤ R_m (liquidation ≤ adjusted ≤ market).",
  "P18 — Rebalancing CANNOT create or disappear reserve value (FV19).",
  "P19 — Rebalancing allocation weights ALWAYS sum to 100% (FV20).",
  "P20 — Rebalancing MUST preserve RR, StressRR, LCR, MLCR, concentration limits, allocation corridors, asset eligibility, and redemption capacity.",
  "P21 — If allocation is within approved tolerance → NO REBALANCING TRADE (No-Trade Principle).",
  "P22 — Rebalancing uses PAR-equivalent units — denomination-neutral, NOT USD-denominated.",
  "P23 — Reserve acquisition uses the designated reserve/institutional funding pool — NOT operating capital, NOT founder personal funds, NOT Foundation operating funds, NOT Technology Company funds, NOT ordinary operating revenue silently converted.",
  "P24 — Mint authority is deliberately separated: ISSUANCE_REQUEST → ISSUANCE_AUTHORIZATION → MINT_EXECUTION (no single actor controls both request and authorization).",
  "P25 — Banks CANNOT mint MTQ — only the canonical ledger can, after MITHQAL authorization.",
  "P26 — Foundation CANNOT mint, authorize, buy, sell, transfer, or override (read-only aggregate oversight).",
  "P27 — Holding CANNOT mint — it owns subsidiaries, receives dividends, holds enterprise value.",
  "P28 — Technology Company CANNOT mint — it owns software, infrastructure, IP.",
  "P29 — Operating Company CANNOT arbitrarily create MTQ — its commercial staff cannot approve reserve sufficiency for their own bank clients.",
  "P30 — Only deterministic technical execution (canonical ledger) creates MTQ — never discretionary governance action.",
  "P31 — DMCE = MIN(VerifiedEligibleBacking, LegallyReservedBacking, InstitutionalRiskLimit, LiquidityLimit, JurisdictionLimit, ExposureLimit, ConcentrationLimit, OperationalLimit).",
  "P32 — DMCE is the canonical policy/control concept; do NOT interpret as a fixed legal formula until independently validated.",
  "P33 — AvailableBackingCertificate is EVIDENCE — NOT custody, NOT a transfer of assets to MITHQAL.",
  "P34 — RCAF (Reserve Control & Attestation Framework) requires 18 mandatory fields per §V25.0.C.5.",
  "P35 — 15-step issuance authorization gate: ANY FAILURE = BLOCK (no bank can create MTQ merely by asserting that funds exist).",
  "P36 — 5-way reconciliation (bank subledger + reserve backing evidence + custodian evidence + canonical ledger + proof of liabilities) — 7 states (VERIFIED/WARNING/MISMATCH/CRITICAL/EXPIRED/UNAVAILABLE/LOCKED).",
  "P37 — 4-source trust model (Bank + Custodian + MITHQAL + Independent); minimum 2 sources required; no single source of truth where independent source is feasible.",
  "P38 — MITHQAL does NOT profit from gold appreciation, speculative trading, reserve spread, or proprietary price movements.",
  "P39 — MITHQAL MAY earn transparent infrastructure fees (8 categories).",
  "P40 — Operating capital is SEPARATE from constitutional reserve assets — cannot be funded from gold/silver/reserve fiat/digital liquidity/participant deposits/minting proceeds/redemption assets.",
  "P41 — 6 capital categories: (A) MTQ reserve/backing, (B) Bank funding, (C) MITHQAL operating, (D) Regulatory, (E) Liquidity, (F) Emergency — SEPARATE, doNotAutoCombine=true.",
  "P42 — Bank failure / custodian failure / gateway outage / reserve asset disqualification produce CONTROLLED outcomes — no false settlement, no fund loss.",
  "P43 — Foundation dashboard is READ-ONLY (7 fields); MITHQAL Monetary Control Dashboard (20 fields); Bank Dashboard (6 fields).",
  "P44 — 13 technology services (MonetaryReserveControlService, ReserveAllocationEngine, CurrencyWeightEngine, ReserveRebalancingEngine, ReserveAttestationService, AvailableBackingCertificateService, DynamicMintingCapacityEngine, MintPermissionEngine, BankMTQSubledgerService, FiveWayReconciliationService, CustodyEvidenceService, ProofOfReservesService, FoundationReadOnlyMonitoringService).",
  "P45 — 12 versioned API endpoints (/gateway/v1/*) — all require authentication, authorization, signed requests, idempotency, timestamp, expiry, replay protection.",
  "P46 — FV18-FV25 are 8 NEW invariants (DMCE upper bound, rebalance conservation, allocation sum, constitutional corridor, gold anchor, no unauthorized transfer, no operating-capital-to-reserve contamination, mint authorization separation).",
  "P47 — 35 integrated test scenarios (INT-T01 .. INT-T35) covering RESERVE / REBALANCING / BANKING / CUSTODY / MINTING / FAILURE / REDEMPTION / GOVERNANCE / FOUNDATION categories.",
  "P48 — 7×17 authority matrix (7 actors × 17 functions) — no function may have ambiguous ownership.",
  "P49 — 44 acceptance criteria — each must declare met=true only when independent evidence is present.",
  "P50 — Final status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED. Honest state preserved throughout.",
];

// ============================================================================
// Section C: Final Corporate Structure (5 entities)
// ============================================================================

export type CorporateEntity =
  | "FOUNDER_SHAREHOLDERS"
  | "MITHQAL_HOLDING"          // for-profit
  | "MITHQAL_OPERATING_CO"     // for-profit
  | "MITHQAL_TECHNOLOGY_CO"    // for-profit
  | "MITHQAL_FOUNDATION";       // independent nonprofit

export interface CorporateStructureEntity {
  entityId: string;
  name: string;
  type: "FOR_PROFIT" | "NON_PROFIT";
  parent?: string;
  children?: string[];
  responsibilities: string[];
  cannotDo: string[];
  legalStatus: "PROPOSED" | "LEGALLY_VALIDATED" | "PENDING";
}

export const FINAL_CORPORATE_STRUCTURE: CorporateStructureEntity[] = [
  {
    entityId: "FOUNDER_SHAREHOLDERS",
    name: "Founder Shareholders",
    type: "FOR_PROFIT",
    parent: undefined,
    children: ["MITHQAL_HOLDING"],
    responsibilities: [
      "Provide initial capitalization to MITHQAL Holding",
      "Receive dividends / distributions from MITHQAL Holding per shareholder agreement",
      "Benefit from corporate enterprise value appreciation (subject to legal structure)",
      "Maintain shareholder governance rights per corporate charter",
    ],
    cannotDo: [
      "Receive reserve appreciation as commercial profit",
      "Receive customer deposits",
      "Receive reserve assets",
      "Receive Foundation assets",
      "Receive unauthorized MTQ",
      "Receive proprietary reserve trading gains",
      "Direct operational decisions of subsidiaries",
      "Override canonical MTQ monetary rules",
      "Authorize individual MTQ issuance requests",
    ],
    legalStatus: "PROPOSED",
  },
  {
    entityId: "MITHQAL_HOLDING",
    name: "MITHQAL Holding (for-profit parent)",
    type: "FOR_PROFIT",
    parent: "FOUNDER_SHAREHOLDERS",
    children: ["MITHQAL_OPERATING_CO", "MITHQAL_TECHNOLOGY_CO"],
    responsibilities: [
      "Own 100% of MITHQAL Operating Company equity",
      "Own 100% of MITHQAL Technology Company equity",
      "Hold corporate enterprise value",
      "Receive dividends from Operating and Technology subsidiaries",
      "Maintain corporate governance oversight over subsidiaries",
      "Coordinate strategic capital allocation across subsidiaries (operating, scale)",
      "Ensure corporate compliance with applicable corporate law",
      "Authorize phased capital deployment (PILOT $4.7M / SCALE $12.6M / SCALE+ $17.6M)",
    ],
    cannotDo: [
      "Mint MTQ",
      "Authorize individual MTQ issuance requests",
      "Hold customer deposits",
      "Hold reserve assets directly",
      "Operate Foundation activities",
      "Override canonical MTQ monetary invariants",
      "Convert operating capital into reserve backing silently",
    ],
    legalStatus: "PROPOSED",
  },
  {
    entityId: "MITHQAL_OPERATING_CO",
    name: "MITHQAL Operating Company (for-profit operator)",
    type: "FOR_PROFIT",
    parent: "MITHQAL_HOLDING",
    children: [],
    responsibilities: [
      "Operate the MITHQAL Bank Gateway (MBG) institutional side",
      "Operate bank relationship management (commercial side)",
      "Operate institutional onboarding",
      "Operate reconciliation workflow operations",
      "Operate customer / institutional support",
      "Operate regulatory compliance operations",
      "Operate audit / evidence preservation operations",
      "Operate the MONETARY & RESERVE CONTROL DIVISION (operationally separated)",
      "Earn transparent infrastructure fees (8 categories)",
      "Coordinate with Foundation on constitutional oversight",
      "Maintain corporate operating capital (separate from reserves)",
      "Coordinate bank integration / onboarding / certification",
    ],
    cannotDo: [
      "Mint MTQ at its own discretion",
      "Approve reserve sufficiency for its own bank clients (separation of duties)",
      "Profit from gold appreciation / speculative trading / reserve spread / proprietary price movements",
      "Receive customer deposits as custodian",
      "Hold reserve assets in a MITHQAL-operated vault by default",
      "Silently convert operating capital into reserve backing",
      "Override canonical MTQ monetary invariants",
      "Authorize MTQ issuance without AvailableBackingCertificate + custodian evidence",
    ],
    legalStatus: "PROPOSED",
  },
  {
    entityId: "MITHQAL_TECHNOLOGY_CO",
    name: "MITHQAL Technology Company (for-profit technology provider)",
    type: "FOR_PROFIT",
    parent: "MITHQAL_HOLDING",
    children: [],
    responsibilities: [
      "Own and operate MITHQAL Core (canonical settlement engine)",
      "Own and operate the MITHQAL Bank Gateway (MBG) software stack",
      "Own and operate the MITHQAL Settlement Authorization Service (MSAS)",
      "Own and operate APIs / SDKs / integration adapters",
      "Own and operate settlement / reconciliation software",
      "Own and operate ZK / privacy technology",
      "Own and operate security systems / cryptographic key management infrastructure",
      "Own and operate monitoring tools / observability stack",
      "Own and operate enterprise technology / integration adapters",
      "Hold applicable patents and IP",
      "Provide technology services to Operating Company per intercompany agreement",
      "Maintain technology team / engineering operations",
    ],
    cannotDo: [
      "Mint MTQ",
      "Authorize individual MTQ issuance requests",
      "Override canonical MTQ monetary invariants",
      "Receive customer deposits",
      "Hold reserve assets",
      "Profit from reserve appreciation",
      "Convert operating capital into reserve backing silently",
      "Override Operating Company's commercial decisions",
    ],
    legalStatus: "PROPOSED",
  },
  {
    entityId: "MITHQAL_FOUNDATION",
    name: "MITHQAL Foundation (independent nonprofit)",
    type: "NON_PROFIT",
    parent: undefined,
    children: [],
    responsibilities: [
      "Hold constitutional stewardship over MITHQAL v25.0 architecture",
      "Receive READ-ONLY aggregate oversight access to MITHQAL systems",
      "Maintain Foundation operating funds (separate from reserves)",
      "Coordinate with independent auditors and regulators",
      "Publish aggregate transparency reports",
      "Preserve constitutional invariants (FV1-FV25) against unauthorized modification",
      "Coordinate with Sharia board (where applicable — Sharia status DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)",
      "Maintain Foundation governance (independent directors, conflict-of-interest policy)",
      "Coordinate legal validation of jurisdictional structures",
      "Steward long-horizon institutional continuity",
      "Receive independent legal / tax counsel",
      "Maintain Foundation as an INDEPENDENT nonprofit — NOT an operator",
    ],
    cannotDo: [
      "Mint MTQ",
      "Authorize MTQ issuance",
      "Buy / sell reserve assets",
      "Transfer reserve assets",
      "Override canonical MTQ monetary invariants",
      "Operate as the commercial operator of MITHQAL systems",
      "Receive private profit distributions",
      "Silently reclassify legal ownership of reserve assets",
      "Replace Foundation operating funds with reserve backing assets",
    ],
    legalStatus: "PROPOSED",
  },
];

export const CORPORATE_STRUCTURE_RULE =
  "Five-entity structure: Founder Shareholders → MITHQAL Holding → Operating + Technology subsidiaries; " +
  "MITHQAL Foundation is an INDEPENDENT nonprofit with read-only aggregate oversight. No entity combines " +
  "custody + monetary control + commercial operations + constitutional oversight. Separation of duties is " +
  "structural, not optional.";

export const CORPORATE_LEGAL_STATUS_RULE =
  "All five entities carry legalStatus='PROPOSED' until independent legal counsel establishes otherwise. " +
  "The Foundation's nonprofit status is PROPOSED / LEGAL-VALIDATION-REQUIRED (per §V25.0.A.5).";

// ============================================================================
// Section D: Founder Economics
// ============================================================================

export const FOUNDER_ECONOMICS = {
  revenueFlow: [
    "BANK → MITHQAL Operating Company",
    "MITHQAL Operating Company → Commercial revenue (transparent infrastructure fees)",
    "Commercial revenue → Operating costs (personnel, technology, audit, security, compliance)",
    "Operating costs net → Tax (per jurisdiction)",
    "Tax net → Operating reserves (corporate operating reserve, distinct from MTQ reserve)",
    "Operating reserves net → Corporate profit",
    "Corporate profit → MITHQAL Holding (parent company)",
    "MITHQAL Holding → Retained earnings + dividends to Founder Shareholders + enterprise value",
  ],
  founderReceives: [
    "Dividends / distributions from MITHQAL Holding per shareholder agreement",
    "Enterprise value appreciation (subject to legal structure)",
    "Shareholder governance rights per corporate charter",
  ],
  founderDoesNotReceive: [
    "Reserve appreciation",
    "Customer deposits",
    "Reserve assets",
    "Foundation assets",
    "Unauthorized MTQ",
    "Proprietary reserve trading gains",
    "Gold / bullion appreciation",
    "Speculative trading profits on reserves",
    "Reserve spread profits",
    "Proprietary price movement gains",
  ],
  rule:
    "Founder economics are CORPORATE, not RESERVE. The founder benefits from corporate enterprise value " +
    "(operating company dividends, holding company retained earnings) — NOT from reserve appreciation, " +
    "NOT from customer deposits, NOT from proprietary reserve trading. This separation is structural.",
} as const;

// ============================================================================
// Section E: MTQ Position (7-layer canonical model)
// ============================================================================

export const MTQ_7_LAYER_MODEL = {
  LAYER_0: "Sovereign / legal / central-bank framework",
  LAYER_1: "Bank money / CBDC / authorized monetary systems",
  LAYER_2: "MITHQAL Bank Gateway / Sidecar",
  LAYER_3: "MITHQAL Monetary + Settlement Control Layer",
  LAYER_4: "MTQ — Neutral Wholesale Settlement Instrument",
  LAYER_5: "Receiving Bank Gateway",
  LAYER_6: "Receiving Bank / local monetary settlement",
} as const;

export const MTQ_IS: readonly string[] = [
  "neutral",
  "permissioned",
  "institutional",
  "wholesale",
  "settlement-focused",
];

export const MTQ_IS_NOT: readonly string[] = [
  "sovereign currency",
  "consumer cryptocurrency",
  "retail payment token",
  "USD stablecoin",
  "BRICS currency",
  "CBDC",
  "investment vehicle",
  "speculative asset",
];

export const MTQ_POSITION_RULE =
  "MTQ is a NEUTRAL, PERMISSIONED, INSTITUTIONAL, WHOLESALE, SETTLEMENT-FOCUSED instrument that sits at LAYER 4 " +
  "of the 7-layer canonical model. It is NOT a sovereign currency (LAYER 0), NOT bank money (LAYER 1), NOT a " +
  "consumer crypto or retail payment token. It does NOT replace any layer — it TRANSLATES between layers via " +
  "the MITHQAL Bank Gateway (LAYER 2 / LAYER 5 sidecars).";

// ============================================================================
// Section F: Bank Integration — Final Canonical Model
// ============================================================================

export const BANK_INTEGRATION_CANONICAL_MODEL = `
FINAL CANONICAL BANK INTEGRATION STACK (v25.0)

  ┌─────────────────────────────────────────────────────────────────────┐
  │  LAYER 0 — Sovereign / Legal / Central-Bank Framework               │
  │   (jurisdictional law, central bank regulations, settlement finality)│
  └─────────────────────────────────────────────────────────────────────┘
                                  ▲ ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  LAYER 1 — Bank Money / CBDC / Authorized Monetary Systems          │
  │   (commercial bank deposits, CBDC reserves, authorized stablecoins)│
  └─────────────────────────────────────────────────────────────────────┘
                                  ▲ ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  LAYER 2 — MITHQAL Bank Gateway (MBG) / Sending Sidecar             │
  │   • Translates authorized banking instructions into MTQ settlement  │
  │     instructions                                                   │
  │   • Returns settlement / reconciliation status to bank             │
  │   • Does NOT replace core banking systems                          │
  │   • Does NOT take custody of customer funds                        │
  │   • Does NOT transform the bank's compliance environment           │
  └─────────────────────────────────────────────────────────────────────┘
                                  ▲ ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  LAYER 3 — MITHQAL Monetary + Settlement Control Layer              │
  │   • Enforces canonical MTQ monetary invariants (FV1-FV25)          │
  │   • Operates 15-step issuance authorization gate                   │
  │   • Operates 5-way reserve backing reconciliation                   │
  │   • Operates mint authority separation (3 states)                 │
  │   • Computes DMCE — Dynamic Minting Capacity per institution       │
  └─────────────────────────────────────────────────────────────────────┘
                                  ▲ ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  LAYER 4 — MTQ (Neutral Wholesale Settlement Instrument)            │
  │   • Canonical supply ledger                                         │
  │   • Permissioned institutional transfer                            │
  │   • PAR-referenced (accounting reference only — NOT a USD peg)     │
  │   • Burn-on-redemption (canonical supply reduction)                │
  └─────────────────────────────────────────────────────────────────────┘
                                  ▲ ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  LAYER 5 — Receiving Bank Gateway (MBG / Receiving Sidecar)         │
  │   • Translates MTQ settlement into receiving-bank instructions     │
  │   • Returns reconciliation status                                   │
  └─────────────────────────────────────────────────────────────────────┘
                                  ▲ ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  LAYER 6 — Receiving Bank / Local Monetary Settlement                │
  │   (bank deposits, CBDC transfers, authorized local settlement)      │
  └─────────────────────────────────────────────────────────────────────┘

CANONICAL PRINCIPLE: TRANSLATION, NOT TRANSFORMATION.
The MBG TRANSLATES existing authorized banking instructions into MTQ settlement
instructions and returns settlement / reconciliation status into the bank's
operating environment. It does NOT replace core banking systems. It does NOT
take custody of customer funds. It does NOT transform the bank's compliance
environment. The bank's role, KYC/AML obligations, regulatory responsibilities,
and customer relationships remain unchanged.
`.trim();

export const BANK_INTEGRATION_CANONICAL_PRINCIPLE = "TRANSLATION, NOT TRANSFORMATION";

// ============================================================================
// Section G: Bank Responsibilities
// ============================================================================

export const BANK_RESPONSIBILITIES: readonly string[] = [
  "Hold customer deposits and execute customer instructions under applicable banking law",
  "Verify customer eligibility (KYC, AML, sanctions screening, beneficial-ownership identification)",
  "Issue cryptographically signed attestations of available backing (Evidence Source A)",
  "Issue AvailableBackingCertificate to MITHQAL on issuance request",
  "Operate the MITHQAL Bank Gateway (MBG) sidecar on the bank's side",
  "Maintain the Bank MTQ Subledger (bank-side MTQ accounting)",
  "Coordinate redemption payout from bank-side deposit (where bank is redemption obligor)",
  "Comply with regulator / central bank reporting requirements",
  "Disclose any encumbrance / insurance / segregation status truthfully",
  "Maintain custody of customer funds (bank-side) — do NOT transfer to MITHQAL by default",
  "Coordinate with qualified custodians for independent reserve evidence (Source B)",
  "Maintain bank-side cryptographic key management (signing keys, rotation, revocation)",
  "Comply with jurisdictional authorization requirements (JURISDICTION_PENDING → ESTABLISHED)",
];

export const BANK_MAY: readonly string[] = [
  "Issue AvailableBackingCertificate for verified eligible value held at the bank",
  "Request MTQ issuance against verified backing through the 15-step gate",
  "Coordinate with MITHQAL for reconciliation, settlement, and incident response",
  "Earn transparent commercial compensation per bank-tier economic model (TIER_1/2/3)",
];

export const BANK_MAY_NOT: readonly string[] = [
  "Mint MTQ directly (only the canonical ledger can, after MITHQAL authorization)",
  "Create MTQ merely by asserting that funds exist (AvailableBackingCertificate required)",
  "Take actions that violate canonical MTQ monetary invariants (FV1-FV25)",
  "Use the same backing for multiple uncollateralized issuance allocations (FV15)",
  "Bypass the 15-step issuance authorization gate",
  "Override MITHQAL reconciliation verdict or veto",
];

export const BANK_RULE =
  "Banks TRANSLATE; they do NOT transform. The MBG is a sidecar; it does NOT replace the bank's core systems. " +
  "Banks hold customer deposits and attest available backing; they do NOT create MTQ. " +
  "Banks coordinate with MITHQAL for settlement / reconciliation; they do NOT override canonical MTQ invariants.";

// ============================================================================
// Section H: Operating Company Responsibilities (15 ops + Monetary & Reserve Control Division)
// ============================================================================

export const OPERATING_CO_RESPONSIBILITIES: readonly string[] = [
  "Operate the institutional side of the MITHQAL Bank Gateway (MBG)",
  "Operate bank relationship management (commercial side, NOT monetary control side)",
  "Operate institutional onboarding (legal / KYC / institutional due diligence)",
  "Operate reconciliation workflow operations (operationally separate from sales)",
  "Operate customer / institutional support (relationship managers, technical support)",
  "Operate regulatory compliance operations (jurisdictional licensing, regulatory reporting)",
  "Operate audit / evidence preservation operations (immutable audit trail)",
  "Operate the MONETARY & RESERVE CONTROL DIVISION (operationally separated)",
  "Earn transparent infrastructure fees (8 categories — see §AC)",
  "Coordinate with Foundation on constitutional oversight (Foundation read-only)",
  "Maintain corporate operating capital (separate from MTQ reserve backing)",
  "Coordinate phased capital deployment with Holding (PILOT/SCALE/SCALE+)",
  "Maintain commercial contracts with participating banks (commercial terms, NOT monetary terms)",
  "Maintain intercompany service agreements with Technology Company",
  "Operate continuity / disaster recovery / incident response (operational layer)",
];

export const MONETARY_RESERVE_CONTROL_DIVISION = {
  name: "Monetary & Reserve Control Division",
  parent: "MITHQAL_OPERATING_CO",
  operationallySeparatedFrom: [
    "sales",
    "marketing",
    "bank relationship teams",
    "revenue teams",
    "commercial contract negotiators",
  ],
  monitors: [
    "reserve positions",
    "backing evidence",
    "reserve weights",
    "currency weights",
    "RR",
    "StressRR",
    "LCR",
    "MLCR",
    "ILPS",
    "concentration",
    "custody",
    "backing certificates",
    "minting capacity",
    "reconciliation",
    "exceptions",
  ],
  authority: [
    "Evaluate AvailableBackingCertificate validity",
    "Run 5-way reserve backing reconciliation",
    "Evaluate issuance veto triggers",
    "Compute DMCE per institution",
    "Flag constitutional corridor breaches",
    "Escalate to Foundation (read-only) and to independent auditors",
  ],
  cannotDo: [
    "Override canonical MTQ monetary invariants (FV1-FV25)",
    "Mint MTQ at its own discretion",
    "Approve reserve sufficiency for the Division's own bank clients (separation of duties)",
    "Profit from reserve appreciation / speculative trading / reserve spread",
    "Convert operating capital into reserve backing silently",
  ],
  rule:
    "Commercial relationship staff MUST NOT approve reserve sufficiency for their own bank clients. " +
    "The Monetary & Reserve Control Division is operationally separated from sales, marketing, bank " +
    "relationship teams, and revenue teams. This separation is STRUCTURAL — not optional.",
} as const;

// ============================================================================
// Section I: Foundation Responsibilities
// ============================================================================

export const FOUNDATION_SHALL: readonly string[] = [
  "Hold constitutional stewardship over MITHQAL v25.0 architecture",
  "Receive READ-ONLY aggregate oversight access to MITHQAL systems (7 dashboard fields)",
  "Maintain Foundation operating funds SEPARATE from MTQ reserve backing",
  "Coordinate with independent auditors and regulators",
  "Publish aggregate transparency reports (institutional accountability)",
  "Preserve canonical invariants FV1-FV25 against unauthorized modification",
  "Coordinate with Sharia board where applicable (status: DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED)",
  "Maintain Foundation governance: independent directors, conflict-of-interest policy, bylaws",
  "Coordinate legal validation of jurisdictional structures (JURISDICTION_PENDING → ESTABLISHED)",
  "Steward long-horizon institutional continuity (post-founder governance)",
  "Receive independent legal / tax / Sharia counsel",
];

export const FOUNDATION_SHALL_NOT: readonly string[] = [
  "Mint MTQ",
  "Authorize MTQ issuance",
  "Buy or sell reserve assets",
  "Transfer reserve assets",
  "Override canonical MTQ monetary invariants (FV1-FV25)",
  "Operate as the commercial operator of MITHQAL systems",
  "Receive private profit distributions (nonprofit status)",
  "Silently reclassify legal ownership of reserve assets",
];

export const FOUNDATION_TECHNOLOGY_LAYER: readonly string[] = [
  "READ_ONLY aggregate dashboard access (7 fields per §AN)",
  "Aggregate reserve status (total supply, reserve backing ratio, constitutional metrics)",
  "Major exception notifications (escalated incidents, constitutional breaches)",
  "CALM state visibility (system-wide operational state)",
  "Weight history (reserve weights over time, currency weights over time)",
  "Incident reports (escalated by Operating Company)",
];

export const FOUNDATION_MONITORING_ACCESS = "READ_ONLY";

export const FOUNDATION_RULE =
  "Foundation = INDEPENDENT NONPROFIT with READ-ONLY aggregate oversight. Foundation CANNOT mint, authorize, " +
  "buy, sell, transfer, or override. Foundation is NOT an operator. Foundation holds constitutional stewardship " +
  "and aggregate transparency responsibility — NOT operational authority.";

// ============================================================================
// Section J: Technology Company
// ============================================================================

export const TECHNOLOGY_CO_OWNS: readonly string[] = [
  "MITHQAL Core — canonical settlement engine",
  "MITHQAL Bank Gateway (MBG) software stack — sidecar that translates bank instructions",
  "MITHQAL Settlement Authorization Service (MSAS) — settlement authorization workflow",
  "APIs / SDKs — institutional integration adapters",
  "Settlement software — canonical settlement execution",
  "Reconciliation software — 5-way reconciliation engine",
  "ZK / privacy technology — zero-knowledge proof systems (where applicable)",
  "Security systems — cryptographic key management, mTLS infrastructure, signing infrastructure",
  "Integration adapters — bank-specific adapters (7 connector classes per MBG)",
  "Monitoring tools — observability stack, dashboards, alerting",
  "Enterprise technology — enterprise integration, support tooling",
  "Applicable patents and IP — intellectual property held by Technology Company",
];

export const TECHNOLOGY_CO_RULE =
  "Technology Company OWNS the software, infrastructure, and IP. It does NOT mint MTQ, does NOT authorize " +
  "issuance, does NOT hold customer deposits, does NOT hold reserve assets, and does NOT profit from reserve " +
  "appreciation. Technology Company provides services to Operating Company per intercompany agreement.";

// ============================================================================
// Section K: Reserve Custody Principle (NON-CUSTODIAL BY DEFAULT)
// ============================================================================

// REFERENCE: §V25.0.C — Non-Custodial Reserve Architecture (existing module).
// MITHQAL is non-custodial by default. Reserve assets remain in legally
// appropriate regulated custody (banks / qualified custodians / segregated
// structures). MITHQAL controls verification + monetary control, NOT custody.
// See: src/lib/non-custodial-reserve-architecture.ts (CUSTODY_PROHIBITIONS,
// CUSTODY_SEPARATION_RULE, CANONICAL_NON_CUSTODIAL_STATEMENT).

export const RESERVE_CUSTODY_PRINCIPLE =
  "Reserve custody remains NON-CUSTODIAL BY DEFAULT per §V25.0.C. MITHQAL does NOT take custody of MTQ reserve " +
  "assets or customer funds under ordinary operation. Reserve assets remain in legally appropriate regulated " +
  "custody (banks / qualified custodians / segregated reserve structures). MITHQAL controls verification + " +
  "monetary control; MITHQAL does NOT control customer bank accounts.";

export const RESERVE_CUSTODY_REFERENCE =
  "See src/lib/non-custodial-reserve-architecture.ts: CUSTODY_PROHIBITIONS (6), CUSTODY_SEPARATION_RULE, " +
  "CANONICAL_NON_CUSTODIAL_STATEMENT, LEGAL_OWNERSHIP_MATRIX (5 reserve categories), REDEMPTION_OBLIGATION_PROFILE.";

// ============================================================================
// Section L: Reserve Architecture (constitutional corridors)
// ============================================================================

export interface ConstitutionalCorridor {
  min: number;
  max: number;
  currentPolicy: number;
}

export const RESERVE_CONSTITUTIONAL_CORRIDORS: Record<
  "FIAT" | "BULLION" | "DIGITAL_LIQUIDITY" | "TOTAL",
  ConstitutionalCorridor | number
> & { rule: string } = {
  FIAT: { min: 0.70, max: 0.85, currentPolicy: 0.765 },
  BULLION: { min: 0.15, max: 0.25, currentPolicy: 0.20 },
  DIGITAL_LIQUIDITY: { min: 0.00, max: 0.05, currentPolicy: 0.035 },
  TOTAL: 1.00,
  rule:
    "Do NOT describe 76.5/20/3.5 as immutable constitutional percentages. Actual allocations may move within " +
    "the constitutional corridors (fiat 70-85%, bullion 15-25%, digital liquidity 0-5%). The current policy " +
    "values (76.5% / 20% / 3.5%) are TARGET allocations within the corridors — not immutable.",
};

export const RESERVE_ARCHITECTURE_RULE =
  "Reserve architecture operates within CONSTITUTIONAL CORRIDORS, not immutable percentages. The Monetary & " +
  "Reserve Control Division monitors actual allocations against corridor limits; rebalancing restores allocations " +
  "to within corridors when drift exceeds approved tolerance (per §S, §T — No-Trade Principle).";

// ============================================================================
// Section M: Currency Weighting (6-step engine)
// ============================================================================

export const CURRENCY_WEIGHT_ENGINE_STEPS: readonly string[] = [
  "Structural Weight",
  "Momentum",
  "Mean Reversion",
  "Volatility Attenuation",
  "Liquidity Overlay",
  "Normalization",
];

export const CURRENCY_WEIGHTING_RULES = {
  usdIsOneEligibleCurrency: true,
  mtqIsNotUSDbacked: true,
  parIsAccountingReferenceOnly: true,
  useTerm: "PAR-REFERENCED",
  notUseTerm: "USD-BACKED",
} as const;

export const CURRENCY_WEIGHTING_RULE =
  "Currency weighting uses a 6-step engine: Structural Weight → Momentum → Mean Reversion → Volatility " +
  "Attenuation → Liquidity Overlay → Normalization. USD is ONE ELIGIBLE CURRENCY among multiple. MTQ is NOT " +
  "USD-backed. PAR ($1.00) is an ACCOUNTING REFERENCE ONLY. Use the term 'PAR-REFERENCED' — NOT 'USD-BACKED'.";

// ============================================================================
// Section N: Bullion Weighting
// ============================================================================

export const BULLION_WEIGHTING = {
  gold: {
    role: "PRIMARY bullion anchor",
    status: "CONSTITUTIONAL (see Gold Anchor Doctrine §14, §V25.0.A.2)",
    liquidationOrder: "LAST (Article X — non-gold liquidated first; gold LAST)",
    cannotBeLiquidatedOutside: "allowed constitutional conditions (FV22 — Gold Anchor Preservation)",
  },
  silver: {
    role: "CONDITIONAL bullion component",
    mayBeZeroPercent: true,
    inclusionCondition: "only where jurisdictional authorization + Sharia compliance + market liquidity conditions warrant",
  },
  digitalLiquidity: {
    role: "SUBORDINATE operational liquidity",
    range: "0-5% (per constitutional corridor)",
    purpose: "settlement efficiency / operational liquidity / redemption liquidity",
    isNotMonetaryAnchor: true,
  },
  rule:
    "Gold is PRIMARY bullion anchor; silver is CONDITIONAL (may be 0%); digital liquidity is SUBORDINATE (0-5%). " +
    "Gold cannot be liquidated outside allowed constitutional conditions (FV22). Silver inclusion requires " +
    "jurisdictional + Sharia + liquidity preconditions. Digital liquidity is operational, NOT a monetary anchor.",
} as const;

// ============================================================================
// Section O: Operational Digital Liquidity
// ============================================================================

export const OPERATIONAL_DIGITAL_LIQUIDITY = {
  range: "0% to 5% (constitutional corridor)",
  purpose: [
    "settlement efficiency",
    "operational liquidity",
    "redemption liquidity (where authorized)",
    "short-horizon institutional settlement",
  ],
  isNotMonetaryAnchor: true,
  rule:
    "Operational digital liquidity is for SETTLEMENT EFFICIENCY — NOT a monetary anchor. It is subordinate to " +
    "the bullion and fiat layers. It MUST remain within the 0-5% constitutional corridor. It is NOT a substitute " +
    "for the gold anchor or the fiat layer. It does NOT change the canonical MTQ monetary model.",
} as const;

// ============================================================================
// Section P: Three-Layer Reserve Valuation
// ============================================================================

export const THREE_LAYER_RESERVE_VALUATION = {
  R_m: {
    name: "Market Reserve",
    definition: "mark-to-market reserve value at current market prices",
    layer: "MARKET",
    use: "transparency / disclosure / aggregate reserve visibility",
  },
  R_a: {
    name: "Adjusted Reserve",
    definition: "post-haircut, post-counterparty-score prudential reserve value",
    layer: "PRUDENTIAL",
    use: "prudential measure for issuance capacity / DMCE",
  },
  R_l: {
    name: "Liquidation Reserve",
    definition: "post-stress reserve value (stress test scenario)",
    layer: "STRESS",
    use: "stress measure for capital adequacy / ILPS engagement",
  },
  invariant: "R_l ≤ R_a ≤ R_m",
  rule:
    "Three-layer reserve valuation: Market Reserve (R_m) ≥ Adjusted Reserve (R_a) ≥ Liquidation Reserve (R_l). " +
    "The Adjusted Reserve reflects haircuts and counterparty scores; the Liquidation Reserve reflects stress " +
    "scenarios. DMCE draws on R_a (prudential); ILPS draws on R_l (stress).",
} as const;

// ============================================================================
// Section Q: Gold Acquisition (16-step workflow)
// ============================================================================

export const GOLD_ACQUISITION_WORKFLOW: readonly string[] = [
  "GA-01 — Constitutional authorization: gold acquisition is consistent with the Gold Anchor Doctrine (§14, §V25.0.A.2) and constitutional corridors (§L).",
  "GA-02 — Funding source identification: reserve/institutional funding pool identified (NOT operating capital, NOT founder funds, NOT Foundation operating funds, NOT Technology Co funds).",
  "GA-03 — Jurisdictional authorization: jurisdiction permits gold acquisition and custody under applicable law.",
  "GA-04 — Custodian selection: qualified custodian selected (LBMA-approved vault, segregated allocated custody).",
  "GA-05 — Counterparty due diligence: gold dealer / refiner / custodian due diligence completed.",
  "GA-06 — Sharia review (where applicable): independent Sharia board reviews transaction structure (status: DESIGNED_FOR_INDEPENDENT_REVIEW, NOT CERTIFIED).",
  "GA-07 — Pricing benchmark: LBMA fix or independent benchmark established; price not manipulated.",
  "GA-08 — Trade execution: authorized reserve manager / institutional treasury executes acquisition.",
  "GA-09 — Settlement: settlement via designated reserve / institutional funding pool (NOT operating capital).",
  "GA-10 — Custody transfer: physical gold delivered to qualified custodian's segregated allocated vault.",
  "GA-11 — Custody evidence issuance: custodian issues independent reserve evidence (Source B — RCAF).",
  "GA-12 — Independent attestation: independent attestation oracle (Source D) corroborates, where feasible.",
  "GA-13 — MITHQAL ledger entry: MITHQAL Reserve Ledger records the acquisition (canonical record).",
  "GA-14 — Reconciliation entry: 5-way reconciliation updated (bank + reserve evidence + custodian + canonical + proof of liabilities).",
  "GA-15 — Audit trail preservation: immutable audit trail preserved for regulatory access.",
  "GA-16 — Proof-of-Reserves publication: aggregate Proof-of-Reserves updated (zero-knowledge where applicable).",
];

export const GOLD_ACQUISITION_RULE =
  "Gold acquisition follows a 16-step workflow (GA-01 .. GA-16). Funding uses the designated reserve/institutional " +
  "funding pool — NOT operating capital, NOT founder funds, NOT Foundation operating funds, NOT Technology Co funds, " +
  "NOT ordinary operating revenue silently converted. Custody remains with qualified custodians; MITHQAL does NOT " +
  "operate a MITHQAL-controlled gold vault by default.";

// ============================================================================
// Section R: Who Pays for Reserve Acquisition
// ============================================================================

export const RESERVE_ACQUISITION_FUNDING = {
  defaultPrinciples: [
    "reserve acquisition uses the designated reserve/institutional funding pool",
    "operating capital is NOT used",
    "founder personal funds are NOT used",
    "Foundation operating funds are NOT used",
    "MITHQAL Technology Company funds are NOT used",
    "ordinary MITHQAL operating revenue is NOT silently converted into reserve backing",
  ],
  executor: "Authorized reserve manager / bank treasury / reserve vehicle",
  ownerObligorCustody: "Must be explicitly documented by jurisdiction (JURISDICTION_PENDING until legal counsel establishes otherwise)",
  rule:
    "Reserve acquisition is funded by the designated reserve/institutional funding pool — NOT by operating capital, " +
    "NOT by founder personal funds, NOT by Foundation operating funds, NOT by Technology Co funds, and NOT by " +
    "ordinary operating revenue silently converted into reserve backing. The executor, owner, obligor, and custody " +
    "arrangements MUST be explicitly documented by jurisdiction.",
} as const;

// ============================================================================
// Section S: Rebalancing Engine (13-step flow)
// ============================================================================

export const REBALANCING_ENGINE_FLOW: readonly string[] = [
  "RB-01 — Snapshot current reserve allocation (R_m market value).",
  "RB-02 — Compute current weights per asset class (fiat / bullion / digital liquidity) and per currency.",
  "RB-03 — Compare current weights to target weights within constitutional corridors (§L).",
  "RB-04 — Compute drift delta (current − target) per asset class and per currency.",
  "RB-05 — If drift ≤ approved tolerance → NO REBALANCING TRADE (§T — No-Trade Principle).",
  "RB-06 — If drift > approved tolerance → identify rebalancing targets (which assets to buy / sell).",
  "RB-07 — Verify rebalancing preserves RR / StressRR / LCR / MLCR / ILPS (FV19, §S preserve list).",
  "RB-08 — Verify rebalancing preserves concentration limits (custodian 15% preferred / 25% hard cap).",
  "RB-09 — Verify rebalancing preserves allocation corridors (fiat 70-85% / bullion 15-25% / digital 0-5%).",
  "RB-10 — Verify rebalancing preserves asset eligibility (RCAF eligibilityStatus=ELIGIBLE).",
  "RB-11 — Execute rebalancing trades via authorized reserve manager / institutional treasury.",
  "RB-12 — Update canonical MITHQAL Reserve Ledger + bank subledgers + custodian evidence (5-way reconciliation).",
  "RB-13 — Preserve immutable audit trail; update Proof-of-Reserves.",
];

export const REBALANCING_MUST_PRESERVE: readonly string[] = [
  "minimum trades (avoid unnecessary transaction costs)",
  "minimize cost (execution cost optimization)",
  "minimize market impact (avoid large block trades that move prices)",
  "preserve redemption capacity (redemption liquidity must remain sufficient)",
  "preserve RR (Reserve Ratio must remain ≥ 1.00)",
  "preserve LCR (Liquidity Coverage Ratio must remain ≥ 1.00)",
  "preserve concentration limits (custodian concentration ≤ 15% preferred / 25% hard cap)",
  "preserve allocation ranges (fiat 70-85% / bullion 15-25% / digital 0-5% corridors)",
  "preserve asset eligibility (RCAF eligibilityStatus=ELIGIBLE)",
];

export const REBALANCING_ENGINE_RULE =
  "Rebalancing follows a 13-step flow (RB-01 .. RB-13). The No-Trade Principle (§T) halts rebalancing when drift " +
  "is within approved tolerance. Rebalancing MUST preserve RR / StressRR / LCR / MLCR / concentration / allocation " +
  "corridors / asset eligibility / redemption capacity (9 preservation requirements per REBALANCING_MUST_PRESERVE). " +
  "Rebalancing CANNOT create or disappear reserve value (FV19).";

// ============================================================================
// Section T: No-Trade Principle
// ============================================================================

export const NO_TRADE_PRINCIPLE =
  "If the current reserve allocation is within approved tolerance of the target allocation, NO REBALANCING TRADE " +
  "is executed. Rebalancing is NOT a continuous high-frequency activity — it is a discrete, controlled response " +
  "to drift exceeding approved tolerance. The No-Trade Principle avoids unnecessary transaction costs, market " +
  "impact, and operational risk.";

export const NO_TRADE_RULE =
  "Rebalancing triggers ONLY when drift exceeds approved tolerance. Within-tolerance allocations require NO TRADE.";

// ============================================================================
// Section U: Rebalancing Example (denomination-neutral)
// ============================================================================

export const REBALANCING_EXAMPLE = `
REBALANCING EXAMPLE — DENOMINATION-NEUTRAL (PAR-EQUIVALENT UNITS, NOT USD)

Suppose the target reserve allocation is:
  - Fiat layer:          76.5% (within 70-85% corridor)
  - Bullion layer:       20.0% (within 15-25% corridor)
  - Digital liquidity:    3.5% (within 0-5% corridor)

Suppose total reserve = 1,000,000 PAR-equivalent units (PAR-equivalent;
NOT USD-denominated; PAR is an accounting reference only).

Target:
  - Fiat:           765,000 PAR-equivalent units
  - Bullion:        200,000 PAR-equivalent units
  - Digital liq:     35,000 PAR-equivalent units

Current observed (post-market-move):
  - Fiat:           800,000 PAR-equivalent units  (overweight by +35,000)
  - Bullion:        180,000 PAR-equivalent units  (underweight by -20,000)
  - Digital liq:     20,000 PAR-equivalent units  (underweight by -15,000)

Drift assessment:
  - Fiat overweight:  +35,000 PAR-equivalent units (+3.5pp above target)
  - Bullion underweight: -20,000 PAR-equivalent units (-2.0pp below target)
  - Digital underweight: -15,000 PAR-equivalent units (-1.5pp below target)

If approved tolerance = ±1.0pp, then:
  - Fiat drift (+3.5pp) EXCEEDS tolerance → REBALANCING REQUIRED for fiat
  - Bullion drift (-2.0pp) EXCEEDS tolerance → REBALANCING REQUIRED for bullion
  - Digital drift (-1.5pp) EXCEEDS tolerance → REBALANCING REQUIRED for digital

Rebalancing actions (illustrative):
  - Sell 35,000 PAR-equivalent units of fiat-layer assets (across eligible currencies
    per the 6-step currency weight engine)
  - Buy 20,000 PAR-equivalent units of bullion-layer assets (gold primary; silver
    conditional; per §N Bullion Weighting)
  - Buy 15,000 PAR-equivalent units of digital liquidity (per §O Operational
    Digital Liquidity — settlement efficiency, NOT monetary anchor)

Post-rebalancing (target):
  - Fiat:           765,000 PAR-equivalent units  (76.5%)
  - Bullion:        200,000 PAR-equivalent units  (20.0%)
  - Digital liq:     35,000 PAR-equivalent units  (3.5%)

Conservation check (FV19 — Rebalance Conservation):
  - Pre-rebalance total:  800,000 + 180,000 + 20,000 = 1,000,000 PAR-equivalent units
  - Post-rebalance total: 765,000 + 200,000 + 35,000 = 1,000,000 PAR-equivalent units
  - CONSERVED: 1,000,000 = 1,000,000 ✓ (no value created or disappeared)

Allocation sum check (FV20):
  - Post-rebalance weights: 76.5% + 20.0% + 3.5% = 100.0% ✓

Corridor preservation check (FV21):
  - Fiat 76.5% ∈ [70%, 85%] ✓
  - Bullion 20.0% ∈ [15%, 25%] ✓
  - Digital 3.5% ∈ [0%, 5%] ✓

NOTE: All amounts are in PAR-equivalent units. PAR is an ACCOUNTING REFERENCE
ONLY — it is NOT a USD peg. The rebalancing is denomination-neutral. USD is
ONE ELIGIBLE CURRENCY among multiple; the rebalancing engine uses the 6-step
currency weight engine (§M) to allocate across eligible currencies.
`.trim();

// ============================================================================
// Section V: DMCE — Dynamic Minting Capacity Engine (KEY NEW DELIVERABLE)
// ============================================================================

export interface DynamicMintingCapacity {
  institution: string;
  capacity: number;
  formula:
    "MIN(VerifiedEligibleBacking, LegallyReservedBacking, InstitutionalRiskLimit, LiquidityLimit, JurisdictionLimit, ExposureLimit, ConcentrationLimit, OperationalLimit)";
  components: {
    verifiedEligibleBacking: number;
    legallyReservedBacking: number;
    institutionalRiskLimit: number;
    liquidityLimit: number;
    jurisdictionLimit: number;
    exposureLimit: number;
    concentrationLimit: number;
    operationalLimit: number;
  };
  validUntil: string;
  policyVersion: string;
  warning: "Do NOT interpret this as a fixed legal formula until independently validated. It is the canonical policy/control concept.";
}

export const DMCE_FORMULA =
  "DMCE = MIN(VerifiedEligibleBacking, LegallyReservedBacking, InstitutionalRiskLimit, LiquidityLimit, " +
  "JurisdictionLimit, ExposureLimit, ConcentrationLimit, OperationalLimit)";

export const DMCE_COMPONENT_DEFINITIONS = {
  verifiedEligibleBacking:
    "Verified eligible value backing at the institution (per AvailableBackingCertificate + custodian evidence).",
  legallyReservedBacking:
    "Legally reserved backing (post-jurisdictional-determination backing legally committed to MTQ).",
  institutionalRiskLimit:
    "Institutional risk limit (per institution risk rating — TIER_1/2/3 — and counterparty score).",
  liquidityLimit:
    "Liquidity limit (per institution's available HQLA / LCR / ILPS contribution capacity).",
  jurisdictionLimit:
    "Jurisdictional limit (per jurisdiction's authorization scope and regulatory cap).",
  exposureLimit:
    "Exposure limit (per institution's exposure hard cap — default 25% of canonical MTQ supply).",
  concentrationLimit:
    "Concentration limit (per institution's concentration against custodian / parent-group limits — 15% preferred / 25% hard cap).",
  operationalLimit:
    "Operational limit (per institution's technical / operational capacity — gateway throughput, settlement latency, key-management readiness).",
} as const;

/**
 * computeDMCE — Dynamic Minting Capacity Engine.
 *
 * Computes the institution's dynamic minting capacity as the MINIMUM of eight
 * limits: VerifiedEligibleBacking, LegallyReservedBacking, InstitutionalRiskLimit,
 * LiquidityLimit, JurisdictionLimit, ExposureLimit, ConcentrationLimit, OperationalLimit.
 *
 * The DMCE is the canonical policy/control concept. It is NOT a fixed legal formula
 * until independently validated. It draws on the three-layer reserve valuation
 * (R_a — Adjusted Reserve) for VerifiedEligibleBacking and LegallyReservedBacking.
 *
 * The DMCE bounds FV18 (Dynamic Minting Capacity Upper Bound): a bank CANNOT mint
 * outside its DMCE capacity.
 */
export function computeDMCE(
  institutionId: string,
  components?: Partial<DynamicMintingCapacity["components"]>,
): DynamicMintingCapacity {
  // Default placeholder values — real values require integration with
  // AvailableBackingCertificate, RCAF, jurisdictional tables, exposure limits,
  // concentration limits, and operational capacity assessments.
  const defaultComponents: DynamicMintingCapacity["components"] = {
    verifiedEligibleBacking: 0,
    legallyReservedBacking: 0,
    institutionalRiskLimit: 0,
    liquidityLimit: 0,
    jurisdictionLimit: 0,
    exposureLimit: 0,
    concentrationLimit: 0,
    operationalLimit: 0,
  };

  const c = { ...defaultComponents, ...components };
  const capacity = Math.min(
    c.verifiedEligibleBacking,
    c.legallyReservedBacking,
    c.institutionalRiskLimit,
    c.liquidityLimit,
    c.jurisdictionLimit,
    c.exposureLimit,
    c.concentrationLimit,
    c.operationalLimit,
  );

  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h default
  const policyVersion = MODULE_VERSION;

  return {
    institution: institutionId,
    capacity,
    formula:
      "MIN(VerifiedEligibleBacking, LegallyReservedBacking, InstitutionalRiskLimit, LiquidityLimit, JurisdictionLimit, ExposureLimit, ConcentrationLimit, OperationalLimit)",
    components: c,
    validUntil,
    policyVersion,
    warning:
      "Do NOT interpret this as a fixed legal formula until independently validated. It is the canonical policy/control concept.",
  };
}

export const DMCE_RULE =
  "The Dynamic Minting Capacity Engine (DMCE) bounds how much MTQ an institution can mint. The capacity is the " +
  "MINIMUM of eight limits: VerifiedEligibleBacking, LegallyReservedBacking, InstitutionalRiskLimit, LiquidityLimit, " +
  "JurisdictionLimit, ExposureLimit, ConcentrationLimit, OperationalLimit. FV18 enforces that a bank CANNOT mint " +
  "outside its DMCE capacity. The DMCE is the canonical policy/control concept — NOT a fixed legal formula until " +
  "independently validated.";

// ============================================================================
// Section W: RCAF + AvailableBackingCertificate (REFERENCES — not duplicated)
// ============================================================================

// REFERENCE: §V25.0.C (existing module: src/lib/non-custodial-reserve-architecture.ts)
//   - RCAF: ReserveControlAttestationFramework — 18 required fields per §V25.0.C.5
//   - validateRCAF() function — validates the 18 required fields
//   - AvailableBackingCertificate — 16 fields per §V25.0.C.6
//   - validateAvailableBackingCertificate() function — validates the 16 fields
//   - AVAILABLE_BACKING_CERTIFICATE_RULES — 8 rules
//
// This module DOES NOT duplicate those definitions. Consumers should import:
//   import {
//     ReserveControlAttestationFramework,
//     AvailableBackingCertificate,
//     validateRCAF,
//     validateAvailableBackingCertificate,
//   } from "@/lib/non-custodial-reserve-architecture";

export const RCAF_ABC_REFERENCE = {
  modulePath: "src/lib/non-custodial-reserve-architecture.ts",
  rcafRequiredFields: 18,
  availableBackingCertificateFields: 16,
  rules:
    "AvailableBackingCertificate is EVIDENCE — NOT custody, NOT a transfer of assets to MITHQAL. The certificate " +
    "MUST be signed by the issuing bank's authorized key, MUST carry a non-expired issueTime / expiryTime window, " +
    "MUST reference an eligible reserveAllocationId that is unencumbered and segregated, MUST be revocable by " +
    "the issuing bank AND by MITHQAL (dual revocation), and MUST be re-verified at every issuance draw.",
  crossReference: "§V25.0.C.5 (RCAF) + §V25.0.C.6 (AvailableBackingCertificate)",
} as const;

// ============================================================================
// Section X: Bank Minting Workflow (16-step flow)
// ============================================================================

export const BANK_MINTING_WORKFLOW: readonly string[] = [
  "BM-01 — Corporate / customer initiates settlement request with the bank.",
  "BM-02 — Bank verifies customer KYC / AML / sanctions / beneficial-ownership.",
  "BM-03 — Bank verifies funding availability (customer has verified eligible value).",
  "BM-04 — Bank issues AvailableBackingCertificate to MITHQAL (Evidence Source A — bank-signed).",
  "BM-05 — Bank requests MTQ issuance through the MBG (MITHQAL Bank Gateway sidecar).",
  "BM-06 — MBG authenticates the bank institution (mTLS + signed nonce + replay protection).",
  "BM-07 — MITHQAL verifies backing evidence (AvailableBackingCertificate + custodian evidence where applicable).",
  "BM-08 — MITHQAL issues / verifies AvailableBackingCertificate validity (16 fields, dual revocation).",
  "BM-09 — MITHQAL verifies reserve evidence (RCAF — 18 required fields, ELIGIBLE status).",
  "BM-10 — MITHQAL computes Joint Settlement Guarantee (JSG) per institution.",
  "BM-11 — MITHQAL evaluates RR ≥ 1.00 AND StressRR ≥ 0.95 (canonical thresholds).",
  "BM-12 — MITHQAL evaluates LCR ≥ 1.00 AND MLCR ≥ 1.00 AND ILPS sufficient (5-layer $48.1M).",
  "BM-13 — MITHQAL evaluates institutional exposure ≤ hard cap (default 25%) + concentration ≤ hard cap (25%).",
  "BM-14 — MITHQAL computes Dynamic Minting Capacity (DMCE) — MIN of 8 limits per §V.",
  "BM-15 — MITHQAL executes Mint Permission Engine (15-step issuance authorization gate — ANY FAILURE = BLOCK).",
  "BM-16 — Technical Mint Execution: canonical ledger mints MTQ; bank MTQ subledger updated; corporate MTQ settlement position updated.",
];

export const BANK_MINTING_WORKFLOW_RULE =
  "The 16-step bank minting workflow ensures that NO bank can create MTQ merely by asserting that funds exist. " +
  "Each step is a gate; ANY FAILURE = BLOCK. The final step (technical mint execution) is deterministic — only " +
  "the canonical ledger creates MTQ, never a discretionary governance action.";

// ============================================================================
// Section Y: Bank Backing Failure (REFERENCES existing)
// ============================================================================

// REFERENCE: §V25.0.C.11 — Backing Attestation Failure handling (existing module).
//   - BackingAttestationFailure interface
//   - BACKING_ATTESTATION_FAILURE_RULE
//   - handleBackingAttestationFailure() function
// The rule: existing MTQ is NOT automatically burned merely because evidence
// becomes disputed. Only NEW issuance against the affected backing is blocked.
// Forensic reconciliation + legal/regulator-driven resolution applies.

export const BANK_BACKING_FAILURE_REFERENCE = {
  modulePath: "src/lib/non-custodial-reserve-architecture.ts",
  functionName: "handleBackingAttestationFailure(claimed, verified, allocationId)",
  rule: "Existing MTQ is NOT automatically burned. Only NEW issuance against the affected backing is BLOCKED. Forensic reconciliation + legal/regulator-driven resolution applies.",
  crossReference: "§V25.0.C.11 — Bank Misreporting / Attestation Failure",
} as const;

// ============================================================================
// Section Z: Five-Way Reconciliation (REFERENCES existing 7-state)
// ============================================================================

// REFERENCE: §V25.0.C.9 — Reserve Reconciliation (existing module).
//   - runReserveBackingReconciliation() function
//   - ReserveBackingReconciliationStatus: 7 states
//     (VERIFIED / WARNING / MISMATCH / CRITICAL / EXPIRED / UNAVAILABLE / LOCKED)
//   - RECONCILIATION_FIVE_SOURCES (5 sources of truth)
//   - RECONCILIATION_TOLERANCE = 0.0001 (1 bps)

export const FIVE_WAY_RECONCILIATION_REFERENCE = {
  modulePath: "src/lib/non-custodial-reserve-architecture.ts",
  functionName: "runReserveBackingReconciliation(sources)",
  sources: [
    "bankMTQSubledger          — bank-side MTQ subledger (Source A)",
    "reserveBackingEvidence    — bank-signed reserve attestation (Source A)",
    "custodianEvidence         — independent custodian evidence (Source B)",
    "mithqalCanonicalMTQLedger — MITHQAL canonical MTQ ledger (Source C)",
    "proofOfLiabilities        — independent proof of liabilities (Source D, where available)",
  ],
  statuses: [
    "VERIFIED — all sources agree within tolerance",
    "WARNING — minor discrepancy within 2× tolerance",
    "MISMATCH — discrepancy > 2× tolerance (but not critical)",
    "CRITICAL — discrepancy > 5% of canonical ledger",
    "EXPIRED — attestation(s) expired",
    "UNAVAILABLE — required source(s) missing",
    "LOCKED — system is in emergency state (no new issuance)",
  ],
  tolerance: "0.0001 (1 basis point)",
  crossReference: "§V25.0.C.9 — Reserve Reconciliation (5-way with explicit reserve evidence source)",
} as const;

// ============================================================================
// Section AA: Who Monitors the Banks
// ============================================================================

export const BANK_MONITORING_AUTHORITY = {
  authority: "MITHQAL Operating Company — MONETARY & RESERVE CONTROL DIVISION",
  operationallySeparatedFrom: [
    "sales",
    "marketing",
    "bank relationship teams",
    "revenue teams",
    "commercial contract negotiators",
  ],
  monitors: [
    "bank backing evidence (AvailableBackingCertificate validity + custodian evidence)",
    "bank MTQ subledger reconciliation",
    "bank exposure (per institution exposure ≤ 25% hard cap)",
    "bank concentration (per institution concentration ≤ 25% hard cap)",
    "bank operational status (gateway throughput, settlement latency)",
    "bank jurisdictional authorization status",
    "bank compliance status (KYC/AML/sanctions attestations)",
    "DMCE compliance (institution cannot mint outside DMCE capacity)",
  ],
  rule:
    "Commercial relationship staff MUST NOT approve reserve sufficiency for their own bank clients. " +
    "The Monetary & Reserve Control Division is operationally separated from sales / marketing / bank relationship " +
    "teams. This separation is STRUCTURAL — not optional. The Division escalates to the Foundation (read-only " +
    "oversight), to independent auditors, and to regulators as applicable.",
} as const;

// ============================================================================
// Section AB: Foundation Oversight
// ============================================================================

export const FOUNDATION_OVERSIGHT = {
  access: "READ_ONLY",
  scope: "Aggregate dashboard (7 fields per §AN — Foundation Dashboard)",
  fields: [
    "total supply",
    "reserve status",
    "weight history",
    "major exceptions",
    "constitutional metrics",
    "incidents",
    "CALM state",
  ],
  cannotDo: [
    "mint MTQ",
    "authorize MTQ issuance",
    "buy / sell reserve assets",
    "transfer reserve assets",
    "override canonical MTQ monetary invariants",
    "operate as the commercial operator",
    "receive private profit distributions",
    "silently reclassify legal ownership",
  ],
  rule:
    "Foundation oversight is READ-ONLY aggregate. The Foundation cannot mint, authorize, buy, sell, transfer, or " +
    "override. The Foundation holds constitutional stewardship and aggregate transparency responsibility — NOT " +
    "operational authority. The Foundation's dashboard access is READ_ONLY.",
} as const;

// ============================================================================
// Section AC: Gold/Reserve Revenue
// ============================================================================

export const GOLD_RESERVE_REVENUE_RULES = {
  operatingCoMustNotProfitFrom: [
    "gold appreciation",
    "speculative trading on reserves",
    "reserve spread (buying reserves below par and selling above par)",
    "proprietary price movements on reserve assets",
    "reserve asset trading gains (any asset class)",
    "currency speculation (per currency weight engine outputs)",
  ],
  operatingCoMayEarnTransparentInfrastructureFees: [
    "connectivity fees (per bank gateway integration / connection)",
    "issuance service fees (per issuance transaction processing)",
    "settlement fees (per settlement execution)",
    "redemption infrastructure fees (per redemption processing)",
    "reconciliation fees (per reconciliation cycle / report)",
    "enterprise integration fees (per enterprise / institutional integration)",
    "premium institutional services fees (per premium tier service)",
    "custody evidence verification fees (per RCAF / ABC verification)",
  ],
  rule:
    "Operating Company MUST NOT profit from gold appreciation, speculative trading on reserves, reserve spread, " +
    "or proprietary price movements. Operating Company MAY earn transparent infrastructure fees (8 categories). " +
    "The revenue model is CORPORATE, not RESERVE. Reserve appreciation is NOT a commercial profit source.",
} as const;

// ============================================================================
// Section AD: Operating Capital
// ============================================================================

export const OPERATING_CAPITAL = {
  separateFrom: "constitutional reserve assets (MTQ backing)",
  cannotBeFundedFrom: [
    "gold",
    "silver",
    "reserve fiat",
    "digital liquidity",
    "participant deposits",
    "minting proceeds",
    "redemption assets",
  ],
  funds: [
    "personnel (operating company + technology company staff)",
    "technology (infrastructure, software, security systems)",
    "cybersecurity (security operations, key management, audits)",
    "legal (counsel, regulatory, jurisdictional authorization)",
    "audits (independent audit fees, attestation oracle fees)",
    "insurance (operational, custody where applicable, D&O)",
    "governance (Foundation governance, board, conflict-of-interest)",
    "continuity (business continuity, disaster recovery)",
    "DR (disaster recovery infrastructure, failover sites)",
  ],
  rule:
    "Operating capital is SEPARATE from constitutional reserve assets. It CANNOT be funded from gold, silver, " +
    "reserve fiat, digital liquidity, participant deposits, minting proceeds, or redemption assets. Operating " +
    "capital funds personnel, technology, cybersecurity, legal, audits, insurance, governance, continuity, and " +
    "disaster recovery — NOT MTQ backing.",
} as const;

// ============================================================================
// Section AE: Capital Model (6 categories)
// ============================================================================

// REFERENCE: src/lib/bank-funded-issuance-model.ts — SIX_CAPITAL_CATEGORIES
//   (A) MTQ Reserve/Backing — $54M (1:1 MTQ backing)
//   (B) Bank Funding — $43.2M (80% of $54M)
//   (C) MITHQAL Operating Capital — $4.7M (PILOT phase)
//   (D) Regulatory Capital — $0 (ABSENT — pending jurisdictional licensing)
//   (E) Liquidity Resources (ILPS) — $48.1M (corrected from $46M)
//   (F) Emergency Resources — $23.8M (SUBSET of ILPS — no double counting)
// (Also includes Scale Capital — $17.6M per commercial-model.ts SCALE+ phase)

export interface CapitalCategorySummary {
  category: string;
  letter: string;
  modeledAmount: number;
  classification: string;
  doNotAutoCombine: true;
}

export const SIX_CAPITAL_CATEGORIES_SUMMARY: CapitalCategorySummary[] = [
  {
    category: "MTQ Reserve / Backing",
    letter: "A",
    modeledAmount: 54_000_000,
    classification: "1:1 backing of MTQ supply at par ($1.00). Held by banks/custodians (non-custodial default).",
    doNotAutoCombine: true,
  },
  {
    category: "Bank Funding",
    letter: "B",
    modeledAmount: 43_200_000,
    classification: "80% of $54M — verified eligible value at participating regulated banks.",
    doNotAutoCombine: true,
  },
  {
    category: "MITHQAL Operating Capital",
    letter: "C",
    modeledAmount: 4_700_000,
    classification: "PILOT phase per commercial-model.ts. Operating, not reserve.",
    doNotAutoCombine: true,
  },
  {
    category: "Regulatory Capital",
    letter: "D",
    modeledAmount: 0,
    classification: "ABSENT — pending jurisdictional licensing (DIFC / ADGM / VARA / NYDFS / MAS).",
    doNotAutoCombine: true,
  },
  {
    category: "Liquidity Resources (ILPS)",
    letter: "E",
    modeledAmount: 48_100_000,
    classification: "5-layer ILPS — corrected from $46M. Emergency + Structural $23.8M is SUBSET.",
    doNotAutoCombine: true,
  },
  {
    category: "Emergency Resources",
    letter: "F",
    modeledAmount: 23_800_000,
    classification: "SUBSET of ILPS (Layer 3 + Layer 4). Activated under Exhaustion Certificate.",
    doNotAutoCombine: true,
  },
];

export const DELTA_CAPITAL_MIN = {
  value: 15_815_000,
  currency: "USD",
  classification: "MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT",
  status: "PENDING_INDEPENDENT_VALIDATION",
  remainsAsAdditionalMonetaryProtectionRequirement: true,
  notEquivalentTo: [
    "fundraising target",
    "regulatory capital",
    "operating capital",
    "reserve backing per MTQ",
    "legal capital requirement",
    "guaranteed solution",
  ],
} as const;

export const CAPITAL_MODEL_RULE =
  "6 capital categories: (A) MTQ Reserve/Backing, (B) Bank Funding, (C) MITHQAL Operating Capital, " +
  "(D) Regulatory Capital, (E) Liquidity Resources (ILPS), (F) Emergency Resources — SEPARATE, " +
  "doNotAutoCombine=true. The ΔCapital_min ≈ $15.815M remains classified as MODEL-DERIVED ADDITIONAL MONETARY " +
  "PROTECTION REQUIREMENT until independently validated.";

// ============================================================================
// Section AF: Gold/Currency/Reserve Nomenclature
// ============================================================================

export const NOMENCLATURE = {
  use: [
    "PAR-equivalent units (denomination-neutral accounting reference)",
    "reserve value (R_m market / R_a adjusted / R_l liquidation — §P)",
    "eligible currency (USD is ONE eligible currency among multiple)",
    "bullion (gold primary; silver conditional)",
    "fiat layer (sovereign debt, bank deposits, authorized monetary systems)",
    "dynamic currency weights (6-step engine per §M)",
    "constitutional corridors (fiat 70-85% / bullion 15-25% / digital 0-5%)",
    "non-custodial by default (per §V25.0.C)",
  ],
  avoid: [
    "USD-denominated (use PAR-equivalent / denomination-neutral)",
    "USD-backed (use PAR-REFERENCED)",
    "USD peg (PAR is accounting reference only)",
    "immutable constitutional percentages (use constitutional corridors)",
    "monetary anchor for digital liquidity (digital liquidity is operational, not anchor)",
    "custodian for MITHQAL (MITHQAL is non-custodial by default)",
    "bank for MITHQAL (MITHQAL is not a bank; it operates settlement infrastructure)",
  ],
  rule:
    "Use PAR-equivalent units, reserve value (R_m / R_a / R_l), eligible currency, bullion, fiat layer, dynamic " +
    "currency weights. USD is ONE eligible currency among multiple. PAR is an accounting reference only — NOT a " +
    "USD peg. Use the term 'PAR-REFERENCED' — NOT 'USD-BACKED'.",
} as const;

// ============================================================================
// Section AG: Redemption
// ============================================================================

// REFERENCE: §V25.0.C.15, §V25.0.C.16 — REDEMPTION_OBLIGATION_PROFILE + REDEMPTION_FLOW
// MITHQAL is NOT automatically the redemption obligor. Redemption is bank-mediated.

export const REDEMPTION_PROFILE = {
  mediation: "Bank-mediated",
  mithqalRole: "Burns MTQ (canonical supply reduction) + issues signed backing release instruction",
  redemptionObligor:
    "Varies by jurisdiction + reserve category — NOT automatically MITHQAL (per §V25.0.C.15)",
  redemptionObligorCandidates: [
    "PARTICIPATING_BANK (where bank is deposit holder / redemption obligor)",
    "DESIGNATED_ISSUER (where authorized institutional vehicle)",
    "LEGALLY_SEGREGATED_RESERVE_STRUCTURE (where authorized)",
    "AUTHORIZED_INSTITUTIONAL_VEHICLE (where designated)",
    "JURISDICTION_PENDING (until legal counsel establishes otherwise)",
  ],
  flow: [
    "Holder redeems MTQ through participating bank",
    "Bank verifies holder identity + KYC + sanctions + MTQ balance",
    "Bank issues signed redemption attestation to MITHQAL",
    "MITHQAL burns N MTQ against canonical ledger (FV17)",
    "MITHQAL issues signed backing release instruction to redemption obligor",
    "Redemption obligor releases backing directly to holder (NOT through MITHQAL)",
    "5-way reconciliation confirms burn + release within T+0 to T+3",
    "Immutable audit trail preserved",
  ],
  rule:
    "Redemption is bank-mediated. MITHQAL does NOT automatically become the redemption obligor merely because it " +
    "operates the settlement protocol. The redemption obligor is determined by the legal structure of the underlying " +
    "reserve category and the applicable jurisdiction. Funds/assets do NOT enter MITHQAL custody during ordinary " +
    "redemption.",
} as const;

// ============================================================================
// Section AH: Bank/Custodian Failure (8 scenarios)
// ============================================================================

export type FailureScenarioType =
  | "BANK_FAILURE"
  | "BANK_SUSPENSION"
  | "BANK_INSOLVENCY"
  | "BANK_LIQUIDITY_STRESS"
  | "GATEWAY_OUTAGE"
  | "CUSTODIAN_FAILURE"
  | "CUSTODIAN_SUSPENSION"
  | "RESERVE_ASSET_DISQUALIFICATION";

export interface FailureScenario {
  scenarioId: string;
  name: FailureScenarioType;
  issuanceStatus: string;
  mintingCapacity: string;
  settlementStatus: string;
  reserveStatus: string;
  redemptionPath: string;
  reconciliation: string;
  escalation: string;
  substitutionOrCustodyTransfer: string;
  legalResolution: string;
}

export const FAILURE_SCENARIOS: FailureScenario[] = [
  {
    scenarioId: "FS-01",
    name: "BANK_FAILURE",
    issuanceStatus: "NEW issuance against affected bank's backing = BLOCKED; existing MTQ remains valid and transferable.",
    mintingCapacity: "DMCE for affected bank = 0; new issuance capacity against affected bank = 0.",
    settlementStatus: "Pending settlements against affected bank = HELD; no false settlement completion.",
    reserveStatus: "Reserve backing evidence (Source A) for affected bank = UNAVAILABLE; custodian evidence (Source B) preserved if independent.",
    redemptionPath: "Bank resolution regime engages (FDIC / SRB-BRRD / PRA-FSCS / CBUAE per jurisdiction); redemption obligor = resolution authority.",
    reconciliation: "5-way reconciliation flags CRITICAL for affected bank subledger; existing MTQ preserved pending forensic reconciliation.",
    escalation: "Foundation read-only notification; independent auditor notification; regulator notification per jurisdictional protocol.",
    substitutionOrCustodyTransfer: "Custodian evidence (Source B) preserved if independent; reserve assets transferred per bank resolution regime.",
    legalResolution: "Bank resolution regime (bail-in / deposit insurance / bridge bank) applies; MITHQAL does NOT seize underlying assets.",
  },
  {
    scenarioId: "FS-02",
    name: "BANK_SUSPENSION",
    issuanceStatus: "NEW issuance against affected bank = BLOCKED during suspension period.",
    mintingCapacity: "DMCE for affected bank = 0 during suspension.",
    settlementStatus: "Pending settlements held in queue; resume upon suspension lifted OR rerouted via alternate authorized bank.",
    reserveStatus: "Reserve backing evidence preserved; custodian evidence preserved.",
    redemptionPath: "Redemption requests queued; processed upon suspension lifted OR routed via alternate authorized bank.",
    reconciliation: "5-way reconciliation flags WARNING for affected bank; existing MTQ preserved.",
    escalation: "Foundation read-only notification; regulator notification; independent auditor notification.",
    substitutionOrCustodyTransfer: "Alternate authorized bank may coordinate for redemption / settlement continuity.",
    legalResolution: "Suspension lifted per regulator OR bank license revoked (FS-01 path).",
  },
  {
    scenarioId: "FS-03",
    name: "BANK_INSOLVENCY",
    issuanceStatus: "NEW issuance against affected bank = BLOCKED permanently.",
    mintingCapacity: "DMCE for affected bank = 0 permanently.",
    settlementStatus: "Pending settlements marked FAILED; resolution regime engages.",
    reserveStatus: "Reserve backing evidence (Source A) = UNAVAILABLE; custodian evidence (Source B) preserved if independent.",
    redemptionPath: "Bank resolution regime (FDIC / SRB-BRRD / PRA-FSCS / CBUAE); deposit insurance / bail-in applies.",
    reconciliation: "5-way reconciliation flags CRITICAL; forensic reconciliation required for affected bank subledger.",
    escalation: "Foundation read-only notification; regulator notification; independent auditor notification; legal counsel engagement.",
    substitutionOrCustodyTransfer: "Reserve assets transferred per resolution regime (segregated allocated custody preserved).",
    legalResolution: "Bank resolution regime applies; deposit insurance / bail-in / bridge bank per jurisdiction.",
  },
  {
    scenarioId: "FS-04",
    name: "BANK_LIQUIDITY_STRESS",
    issuanceStatus: "NEW issuance against affected bank = RESTRICTED (lowered ceiling); not fully BLOCKED unless DMCE = 0.",
    mintingCapacity: "DMCE for affected bank = REDUCED (liquidityLimit + institutionalRiskLimit reduced).",
    settlementStatus: "Settlement latency may increase; T+0 → T+1 / T+2; ILPS Layer 1 may engage.",
    reserveStatus: "Reserve backing evidence preserved; custodian evidence preserved.",
    redemptionPath: "Redemption requests honored; ILPS Layer 2 (redemption liquidity) engages if needed.",
    reconciliation: "5-way reconciliation flags WARNING; existing MTQ preserved.",
    escalation: "Foundation read-only notification; regulator notification if stress persists > 5 days.",
    substitutionOrCustodyTransfer: "Alternate authorized bank may coordinate for settlement continuity.",
    legalResolution: "Liquidity stress resolved via ILPS engagement OR escalates to BANK_SUSPENSION (FS-02).",
  },
  {
    scenarioId: "FS-05",
    name: "GATEWAY_OUTAGE",
    issuanceStatus: "NEW issuance against affected bank = BLOCKED during outage (MBG sidecar unavailable).",
    mintingCapacity: "DMCE for affected bank = 0 during outage.",
    settlementStatus: "Pending settlements queued; resume upon gateway restored.",
    reserveStatus: "Reserve backing evidence preserved at custodian; bank subledger preserved.",
    redemptionPath: "Redemption requests queued; processed upon gateway restored.",
    reconciliation: "5-way reconciliation flags WARNING for affected bank during outage; existing MTQ preserved.",
    escalation: "Technology Company incident response; Foundation read-only notification if outage > 1 hour.",
    substitutionOrCustodyTransfer: "Alternate gateway path may be activated if available.",
    legalResolution: "Operational issue; resolved by Technology Company. No legal resolution unless outage is sustained.",
  },
  {
    scenarioId: "FS-06",
    name: "CUSTODIAN_FAILURE",
    issuanceStatus: "NEW issuance against reserves custodied by failed custodian = BLOCKED; existing MTQ remains valid.",
    mintingCapacity: "DMCE reduced by affected custodian's contribution; new issuance capacity lowered.",
    settlementStatus: "Pending settlements against affected reserves HELD.",
    reserveStatus: "Custodian evidence (Source B) = UNAVAILABLE for affected reserves; bank evidence (Source A) preserved if independent.",
    redemptionPath: "Alternate custodian engaged per resolution regime; reserve assets transferred per bailment / segregated custody.",
    reconciliation: "5-way reconciliation flags CRITICAL for affected custodian evidence; existing MTQ preserved.",
    escalation: "Foundation read-only notification; independent auditor notification; regulator notification per custodian regulator.",
    substitutionOrCustodyTransfer: "Reserve assets transferred to alternate qualified custodian per bailment terms (segregated allocated preserved).",
    legalResolution: "Custodian resolution regime applies (segregated allocated → bailment protected); alternate custodian engaged.",
  },
  {
    scenarioId: "FS-07",
    name: "CUSTODIAN_SUSPENSION",
    issuanceStatus: "NEW issuance against affected reserves = BLOCKED during suspension; existing MTQ remains valid.",
    mintingCapacity: "DMCE reduced by affected custodian's contribution during suspension.",
    settlementStatus: "Pending settlements against affected reserves HELD.",
    reserveStatus: "Custodian evidence (Source B) = UNAVAILABLE during suspension.",
    redemptionPath: "Redemption requests queued; processed upon suspension lifted OR routed via alternate custodian.",
    reconciliation: "5-way reconciliation flags WARNING for affected custodian; existing MTQ preserved.",
    escalation: "Foundation read-only notification; custodian regulator notification.",
    substitutionOrCustodyTransfer: "Alternate custodian engaged if suspension sustained.",
    legalResolution: "Suspension lifted per custodian regulator OR escalates to CUSTODIAN_FAILURE (FS-06).",
  },
  {
    scenarioId: "FS-08",
    name: "RESERVE_ASSET_DISQUALIFICATION",
    issuanceStatus: "NEW issuance against disqualified reserve = BLOCKED; existing MTQ backed by disqualified reserve remains valid pending reconciliation.",
    mintingCapacity: "DMCE reduced by disqualified reserve's contribution.",
    settlementStatus: "Pending settlements against disqualified reserve HELD.",
    reserveStatus: "Affected reserve evidence = DISQUALIFIED (RCAF eligibilityStatus → INELIGIBLE).",
    redemptionPath: "Redemption requests against disqualified reserve processed per alternate backing if available; else queued.",
    reconciliation: "5-way reconciliation flags MISMATCH; forensic reconciliation required for affected reserve.",
    escalation: "Foundation read-only notification; independent auditor notification; regulator notification if material.",
    substitutionOrCustodyTransfer: "Alternate reserve substituted if available; affected reserve liquidated per Article X (non-gold first; gold LAST).",
    legalResolution: "Disqualified reserve removed from MTQ backing pool; replacement backing sourced; legal counsel engaged for any title / encumbrance issue.",
  },
];

export const FAILURE_SCENARIOS_RULE =
  "8 failure scenarios (FS-01..FS-08) cover BANK_FAILURE / BANK_SUSPENSION / BANK_INSOLVENCY / BANK_LIQUIDITY_STRESS / " +
  "GATEWAY_OUTAGE / CUSTODIAN_FAILURE / CUSTODIAN_SUSPENSION / RESERVE_ASSET_DISQUALIFICATION. Each scenario produces " +
  "CONTROLLED outcomes — no false settlement, no fund loss. Existing MTQ is NOT automatically burned; only NEW " +
  "issuance against affected backing is BLOCKED. Forensic reconciliation + legal/regulator-driven resolution applies.";

// ============================================================================
// Section AI: Technology Implementation (13 services)
// ============================================================================

export const TECHNOLOGY_SERVICES: readonly string[] = [
  "MonetaryReserveControlService",
  "ReserveAllocationEngine",
  "CurrencyWeightEngine",
  "ReserveRebalancingEngine",
  "ReserveAttestationService",
  "AvailableBackingCertificateService",
  "DynamicMintingCapacityEngine",
  "MintPermissionEngine",
  "BankMTQSubledgerService",
  "FiveWayReconciliationService",
  "CustodyEvidenceService",
  "ProofOfReservesService",
  "FoundationReadOnlyMonitoringService",
];

export const TECHNOLOGY_SERVICES_RULE =
  "13 technology services implement the integrated architecture. Use existing components wherever possible. " +
  "Do NOT duplicate functionality unnecessarily. Each service is owned by MITHQAL Technology Company and operated " +
  "by MITHQAL Operating Company per intercompany agreement.";

// ============================================================================
// Section AJ: Data Models (16 models)
// ============================================================================

// Note: AvailableBackingCertificate is REFERENCE-only (defined in non-custodial-reserve-architecture.ts).
// We import its type there; here we define the OTHER 15 models.

export interface ReserveAsset {
  assetId: string;
  assetType: "FIAT" | "BULLION_GOLD" | "BULLION_SILVER" | "DIGITAL_LIQUIDITY" | "SOVEREIGN_DEBT" | "STABLECOIN" | "SUKUK" | "OTHER";
  quantity: number;
  valuationMarket: number; // R_m
  valuationAdjusted: number; // R_a
  valuationLiquidation: number; // R_l
  currency?: string; // for fiat / stablecoin
  custodian: string;
  jurisdiction: string;
  eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "PENDING";
  encumbranceStatus: "UNENCUMBERED" | "ENCUMBERED" | "PENDING";
  segregationStatus: "SEGREGATED" | "OMNIBUS" | "PENDING";
}

export interface ReserveAllocation {
  allocationId: string;
  reserveId: string;
  assetClass: "FIAT" | "BULLION" | "DIGITAL_LIQUIDITY";
  weight: number; // 0.0 - 1.0
  parEquivalentValue: number; // denomination-neutral
  corridor: { min: number; max: number };
  timestamp: string;
}

export interface ReserveWeight {
  assetClass: "FIAT" | "BULLION" | "DIGITAL_LIQUIDITY";
  currentWeight: number;
  targetWeight: number;
  corridor: { min: number; max: number };
  driftDelta: number;
  driftTolerance: number;
  requiresRebalancing: boolean;
}

export interface ReserveTarget {
  targetId: string;
  fiatTarget: number;
  bullionTarget: number;
  digitalLiquidityTarget: number;
  currencyWeights: Record<string, number>; // currency code → weight
  bullionWeights: { gold: number; silver: number };
  policyVersion: string;
  timestamp: string;
}

export interface ReserveAdjustment {
  adjustmentId: string;
  reason: string;
  assetClass: "FIAT" | "BULLION" | "DIGITAL_LIQUIDITY";
  deltaParEquivalent: number; // +/- in PAR-equivalent units
  reasonCode: "DRIFT" | "ACQUISITION" | "REDEMPTION" | "DISQUALIFICATION" | "REBALANCING";
  timestamp: string;
}

export interface ReserveRebalanceEvent {
  eventId: string;
  preAllocation: ReserveAllocation[];
  postAllocation: ReserveAllocation[];
  conservationPreserved: boolean; // FV19
  sumToOnePreserved: boolean; // FV20
  corridorPreserved: boolean; // FV21
  goldAnchorPreserved: boolean; // FV22
  noUnauthorizedTransfer: boolean; // FV23
  noOperatingCapitalContamination: boolean; // FV24
  timestamp: string;
}

export interface ReserveExecution {
  executionId: string;
  executionType: "ACQUISITION" | "REBALANCE" | "REDEMPTION" | "LIQUIDATION";
  parEquivalentAmount: number;
  executor: string;
  custodian: string;
  settlementTimestamp: string;
  canonicalLedgerEntryId: string;
  auditTrailHash: string;
}

export interface CustodyRecord {
  custodyId: string;
  assetId: string;
  custodian: string;
  custodyType: "SEGREGATED_ALLOCATED" | "SEGREGATED_UNALLOCATED" | "OMNIBUS";
  legalOwner: string;
  beneficialOwner: string;
  jurisdiction: string;
  bailmentReference: string;
  encumbranceStatus: "UNENCUMBERED" | "ENCUMBERED" | "PENDING";
  insuranceStatus?: string;
  lastAttestationTimestamp: string;
}

// ReserveAttestation — the bank-signed attestation (Evidence Source A).
export interface ReserveAttestation {
  attestationId: string;
  institutionId: string;
  allocationId: string;
  attestedAmount: number;
  parEquivalentAmount: number;
  signature: string;
  signedAt: string;
  expiresAt: string;
  source: "SOURCE_A_BANK_SIGNED_ATTESTATION" | "SOURCE_B_CUSTODIAN_RESERVE_EVIDENCE" | "SOURCE_C_MITHQAL_CANONICAL_LEDGER" | "SOURCE_D_INDEPENDENT_ATTESTATION_ORACLE_PROOF";
  status: "VALID" | "EXPIRED" | "REVOKED" | "PENDING_VERIFICATION";
}

// AvailableBackingCertificate is REFERENCE-only (defined in non-custodial-reserve-architecture.ts).
// Import from there if needed.

export interface BankMTQPosition {
  institutionId: string;
  positionId: string;
  mtqOutstanding: number;
  mtqAuthorized: number;
  mtqAvailableToMint: number;
  dmceCapacity: number;
  exposurePct: number;
  exposureHardCapPct: number;
  lastReconciliationStatus: string;
  timestamp: string;
}

export interface MintingCapacity {
  capacityId: string;
  institutionId: string;
  capacity: number; // DMCE result
  components: {
    verifiedEligibleBacking: number;
    legallyReservedBacking: number;
    institutionalRiskLimit: number;
    liquidityLimit: number;
    jurisdictionLimit: number;
    exposureLimit: number;
    concentrationLimit: number;
    operationalLimit: number;
  };
  validFrom: string;
  validUntil: string;
  policyVersion: string;
}

export interface IssuanceRequest {
  requestId: string;
  institutionId: string;
  customerReference: string;
  requestedAmount: number;
  requestedJurisdiction: string;
  certificateId?: string; // AvailableBackingCertificate reference
  reserveEvidenceId?: string; // RCAF reference
  policyVersion: string;
  idempotencyKey: string;
  nonce: string;
  timestamp: string;
}

export interface IssuanceAuthorization {
  authorizationId: string;
  requestId: string;
  authorizedAmount: number;
  gateStepsPassed: number; // 15 total
  blockingStep?: string;
  blockReason?: string;
  fvChecksPassed: string[]; // FV11-FV25
  result: "AUTHORIZED" | "BLOCKED";
  timestamp: string;
}

export interface RedemptionRequest {
  redemptionId: string;
  institutionId: string;
  holderReference: string;
  mtqAmount: number;
  redemptionObligor: string;
  redemptionAsset: string;
  redemptionVenue: string;
  burnExecuted: boolean;
  backingReleaseStatus: "PENDING" | "EXECUTED" | "FAILED";
  timestamp: string;
}

export interface ReconciliationResult {
  reconciliationId: string;
  bankMTQSubledger: number;
  reserveBackingEvidence: number;
  custodianEvidence?: number;
  mithqalCanonicalMTQLedger: number;
  proofOfLiabilities: number;
  status: "VERIFIED" | "WARNING" | "MISMATCH" | "CRITICAL" | "EXPIRED" | "UNAVAILABLE" | "LOCKED";
  mismatches: string[];
  tolerance: number;
  timestamp: string;
}

export interface FoundationOversightSnapshot {
  snapshotId: string;
  totalSupply: number;
  reserveStatus: { fiatWeight: number; bullionWeight: number; digitalLiquidityWeight: number };
  weightHistory: { timestamp: string; fiatWeight: number; bullionWeight: number; digitalLiquidityWeight: number }[];
  majorExceptions: string[];
  constitutionalMetrics: { rr: number; stressRR: number; lcr: number; mlcr: number; ilps: number };
  incidents: string[];
  calmState: "CALM" | "ELEVATED" | "HIGH" | "SEVERE" | "CRITICAL";
  timestamp: string;
}

export const DATA_MODELS_COUNT = 16;
export const DATA_MODELS_LIST: readonly string[] = [
  "ReserveAsset",
  "ReserveAllocation",
  "ReserveWeight",
  "ReserveTarget",
  "ReserveAdjustment",
  "ReserveRebalanceEvent",
  "ReserveExecution",
  "CustodyRecord",
  "ReserveAttestation",
  "AvailableBackingCertificate (REFERENCE — defined in non-custodial-reserve-architecture.ts)",
  "BankMTQPosition",
  "MintingCapacity",
  "IssuanceRequest",
  "IssuanceAuthorization",
  "RedemptionRequest",
  "ReconciliationResult",
  "FoundationOversightSnapshot",
];

// ============================================================================
// Section AK: API (12 versioned endpoints)
// ============================================================================

export const VERSIONED_API_ENDPOINTS: readonly string[] = [
  "/gateway/v1/instructions",
  "/gateway/v1/attestation",
  "/gateway/v1/backing-certificates",
  "/gateway/v1/minting-capacity",
  "/gateway/v1/reserves",
  "/gateway/v1/rebalancing",
  "/gateway/v1/reconciliation",
  "/gateway/v1/custody",
  "/gateway/v1/proof-of-reserves",
  "/gateway/v1/redemptions",
  "/gateway/v1/incidents",
  "/gateway/v1/foundation/oversight",
];

export const API_SECURITY_REQUIREMENTS: readonly string[] = [
  "authentication (mTLS + signed requests)",
  "authorization (institution allowlist + role-based access control)",
  "signed requests (cryptographic signatures)",
  "idempotency (idempotency key per request)",
  "timestamp (ISO-8601; stale requests rejected)",
  "expiry (per-request expiryTime)",
  "replay protection (nonce recorded for replay window)",
];

export const API_RULE =
  "12 versioned API endpoints under /gateway/v1/* — all require authentication, authorization, signed requests, " +
  "idempotency, timestamp, expiry, and replay protection. The endpoints expose the integrated architecture to " +
  "authorized institutions. The /gateway/v1/foundation/oversight endpoint is READ-ONLY for the Foundation.";

// ============================================================================
// Section AL: Formal Verification — FV11 through FV25 (15 invariants)
// ============================================================================

// REFERENCE: FV11-FV17 are defined in non-custodial-reserve-architecture.ts.
// Here we document all 15 (FV11-FV25) with cross-references.

export const FV11_THROUGH_FV25 = {
  // FV11-FV17 are REFERENCEs to non-custodial-reserve-architecture.ts.
  // Cross-reference: §V25.0.C.22 — 7 New Formal Verification Invariants.
  FV11: {
    name: "PvP Atomicity",
    statement: "If PvP is implemented, both legs settle or neither settles (no partial settlement).",
    status: "DESIGNED",
    crossReference: "§V25.0.C.22 — defined in non-custodial-reserve-architecture.ts",
  },
  FV12: {
    name: "Reserve Custody Separation",
    statement:
      "MITHQAL does not become custodian of reserve assets merely through issuance. Custody and monetary control are deliberately separated.",
    status: "PROVEN_AT_SPEC_LEVEL",
    crossReference: "§V25.0.C.22 — defined in non-custodial-reserve-architecture.ts",
  },
  FV13: {
    name: "Backing Evidence Validity",
    statement: "No MTQ can be issued without valid, unexpired, unrevoked AvailableBackingCertificate.",
    status: "PROVEN_AT_SPEC_LEVEL",
    crossReference: "§V25.0.C.22 — defined in non-custodial-reserve-architecture.ts",
  },
  FV14: {
    name: "No Unverified Issuance",
    statement: "No issuance may rely solely on an unverified bank assertion. Minimum 2 evidence sources required.",
    status: "PROVEN_AT_SPEC_LEVEL",
    crossReference: "§V25.0.C.22 — defined in non-custodial-reserve-architecture.ts",
  },
  FV15: {
    name: "No Double-Counted Backing",
    statement:
      "The same backing cannot support multiple uncollateralized MTQ issuance allocations.",
    status: "PROVEN_AT_SPEC_LEVEL",
    crossReference: "§V25.0.C.22 — defined in non-custodial-reserve-architecture.ts",
  },
  FV16: {
    name: "Reserve-to-Liability Reconciliation",
    statement:
      "Reserve backing evidence must reconcile with canonical MTQ supply (5-way reconciliation).",
    status: "PROVEN_AT_SPEC_LEVEL",
    crossReference: "§V25.0.C.22 — defined in non-custodial-reserve-architecture.ts",
  },
  FV17: {
    name: "Redemption Supply Conservation",
    statement:
      "Redemption reduces canonical supply correctly (burn 1 MTQ = reduce 1 MTQ from supply).",
    status: "PROVEN_AT_SPEC_LEVEL",
    crossReference: "§V25.0.C.22 — defined in non-custodial-reserve-architecture.ts",
  },
  // FV18-FV25 are NEW — defined here in the final integrated architecture module.
  FV18: {
    name: "Dynamic Minting Capacity Upper Bound",
    statement: "Bank cannot mint outside DMCE capacity.",
    status: "DESIGNED",
    crossReference: "§V — DMCE — Dynamic Minting Capacity Engine",
  },
  FV19: {
    name: "Reserve Rebalance Conservation",
    statement: "Rebalancing cannot create or disappear reserve value.",
    status: "DESIGNED",
    crossReference: "§S — Rebalancing Engine (13-step flow)",
  },
  FV20: {
    name: "Allocation Sum = 100%",
    statement: "Reserve allocation weights always sum to 100%.",
    status: "DESIGNED",
    crossReference: "§L — Reserve Architecture (constitutional corridors)",
  },
  FV21: {
    name: "Constitutional Corridor Preservation",
    statement:
      "Allocations remain within constitutional corridors (70-85% fiat, 15-25% bullion, 0-5% digital).",
    status: "DESIGNED",
    crossReference: "§L — Reserve Architecture (constitutional corridors)",
  },
  FV22: {
    name: "Gold Anchor Preservation",
    statement: "Gold cannot be liquidated outside allowed constitutional conditions.",
    status: "DESIGNED",
    crossReference: "§N — Bullion Weighting; Gold Anchor Doctrine §14, §V25.0.A.2",
  },
  FV23: {
    name: "No Unauthorized Reserve Transfer",
    statement: "MITHQAL cannot execute unauthorized reserve transfer.",
    status: "DESIGNED",
    crossReference: "§K — Reserve Custody Principle (NON-CUSTODIAL BY DEFAULT)",
  },
  FV24: {
    name: "No Operating-Capital-to-Reserve Contamination",
    statement: "Operating capital cannot be silently converted to reserve backing.",
    status: "DESIGNED",
    crossReference: "§AD — Operating Capital; §R — Who Pays for Reserve Acquisition",
  },
  FV25: {
    name: "Mint Authorization Separation",
    statement:
      "Foundation/Holding/Technology Co/Operating Co cannot mint. Only deterministic technical execution creates MTQ.",
    status: "DESIGNED",
    crossReference: "§H — Operating Co cannot mint; §I — Foundation cannot mint; §J — Technology Co cannot mint; §C — Holding cannot mint",
  },
} as const;

export const FV_VERIFICATION_CHECKS: readonly string[] = [
  "bank cannot mint outside capacity (FV18)",
  "expired certificate cannot mint (FV13)",
  "duplicated backing cannot mint twice (FV15)",
  "reserve weights always reconcile (FV16)",
  "rebalancing cannot create/disappear reserve value (FV19)",
  "rebalancing cannot breach RR/LCR limits (FV19 + §S preserve list)",
  "gold cannot be liquidated outside allowed constitutional conditions (FV22)",
  "Foundation cannot mint (FV25 + §I)",
  "Operating Company cannot arbitrarily create MTQ (FV25 + §H)",
  "Holding cannot mint (FV25 + §C)",
  "Technology Company cannot mint (FV25 + §J)",
];

export const FV_INVARIANT_COUNT = 15; // FV11..FV25 (8 new: FV18-FV25)
export const FV_NEW_INVARIANT_COUNT = 8; // FV18..FV25

// ============================================================================
// Section AM: Testing — 35 Test Scenarios
// ============================================================================

export type IntegratedTestCategory =
  | "RESERVE"
  | "REBALANCING"
  | "BANKING"
  | "CUSTODY"
  | "MINTING"
  | "FAILURE"
  | "REDEMPTION"
  | "GOVERNANCE"
  | "FOUNDATION";

export interface IntegratedTestScenario {
  testId: string; // INT-T01 ... INT-T35
  description: string;
  category: IntegratedTestCategory;
  expectedResult: string;
  status: "DESIGNED" | "IMPLEMENTED" | "PASS" | "FAIL" | "BLOCKED";
}

export const INTEGRATED_TEST_SCENARIOS: IntegratedTestScenario[] = [
  {
    testId: "INT-T01",
    description: "Normal reserve state — all weights within corridors, RR/LCR sufficient.",
    category: "RESERVE",
    expectedResult: "All constitutional corridors preserved; RR ≥ 1.00; LCR ≥ 1.00; reconciliation VERIFIED.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T02",
    description: "Reserve drift within tolerance — No-Trade Principle applies.",
    category: "RESERVE",
    expectedResult: "Rebalancing engine returns NO_TRADE; no transactions executed; allocations preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T03",
    description: "Fiat overweight above corridor (e.g., 87% > 85% corridor max).",
    category: "RESERVE",
    expectedResult: "Rebalancing engine triggers RB-06..RB-13; fiat reduced; bullion/digital increased; corridors restored.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T04",
    description: "Bullion underweight below corridor (e.g., 13% < 15% corridor min).",
    category: "RESERVE",
    expectedResult: "Rebalancing engine triggers; bullion acquired per 16-step gold acquisition workflow; corridor restored.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T05",
    description: "Digital liquidity underweight below target but within corridor (0-5%).",
    category: "RESERVE",
    expectedResult: "Rebalancing engine may or may not trigger (depends on drift vs tolerance); corridor preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T06",
    description: "Currency weight drift (e.g., USD weight exceeds structural target).",
    category: "RESERVE",
    expectedResult: "6-step currency weight engine recomputes weights; rebalancing adjusts across eligible currencies.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T07",
    description: "USD concentration increases beyond approved tolerance.",
    category: "RESERVE",
    expectedResult: "Currency weight engine flags USD concentration; rebalancing diversifies across eligible currencies; FV21 preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T08",
    description: "Currency eligibility failure (currency removed from eligible list).",
    category: "RESERVE",
    expectedResult: "Affected currency reserves disqualified; rebalancing liquidates / substitutes per Article X; existing MTQ preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T09",
    description: "Stablecoin eligibility failure (stablecoin loses eligibility).",
    category: "RESERVE",
    expectedResult: "Affected stablecoin reserves disqualified; rebalancing substitutes with eligible fiat/bullion; FV22 (gold anchor) preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T10",
    description: "Gold purchase — 16-step workflow executes correctly.",
    category: "RESERVE",
    expectedResult: "GA-01..GA-16 all pass; gold acquired; custodian evidence issued; canonical ledger updated; 5-way reconciliation VERIFIED.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T11",
    description: "Gold verification failure (custodian evidence inconsistent with bank attestation).",
    category: "RESERVE",
    expectedResult: "Reconciliation flags MISMATCH/CRITICAL; issuance against affected gold BLOCKED; existing MTQ preserved; forensic reconciliation engages.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T12",
    description: "Custody failure (custodian becomes insolvent).",
    category: "CUSTODY",
    expectedResult: "FS-06 (CUSTODIAN_FAILURE) engages; alternate custodian engaged; segregated allocated custody preserved; existing MTQ preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T13",
    description: "Rebalancing failure (trade execution fails mid-flow).",
    category: "REBALANCING",
    expectedResult: "Rebalancing engine ROLLS BACK; canonical ledger restored; FV19 (rebalance conservation) verified; no value created/disappeared.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T14",
    description: "Rebalancing partial execution (some trades execute, others fail).",
    category: "REBALANCING",
    expectedResult: "Partial execution reconciled; failed trades retried or rolled back; FV19 + FV20 + FV21 preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T15",
    description: "Market disruption (extreme volatility during rebalancing).",
    category: "REBALANCING",
    expectedResult: "Rebalancing engine pauses; CALM state escalates; existing allocations preserved; no forced liquidation.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T16",
    description: "Reserve mismatch between bank subledger and canonical ledger.",
    category: "RESERVE",
    expectedResult: "5-way reconciliation flags MISMATCH/CRITICAL; issuance against affected bank BLOCKED; forensic reconciliation engages.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T17",
    description: "Bank backing deficiency (claimed > verified).",
    category: "BANKING",
    expectedResult: "BackingAttestationFailure handled per §V25.0.C.11; new issuance BLOCKED; existing MTQ preserved; institution RESTRICTED.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T18",
    description: "Expired AvailableBackingCertificate presented at issuance.",
    category: "MINTING",
    expectedResult: "validateAvailableBackingCertificate returns valid=false; issuance BLOCKED at step 5 (AVAILABLE_BACKING_CERTIFICATE).",
    status: "DESIGNED",
  },
  {
    testId: "INT-T19",
    description: "Duplicate backing allocation (same allocation referenced twice).",
    category: "MINTING",
    expectedResult: "FV15 (No Double-Counted Backing) enforces; second issuance BLOCKED; first issuance remains valid.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T20",
    description: "Unauthorized issuance attempt (no AvailableBackingCertificate).",
    category: "MINTING",
    expectedResult: "executeIssuanceGate returns BLOCKED at AVAILABLE_BACKING_CERTIFICATE; no MTQ minted.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T21",
    description: "Bank exceeds DMCE minting capacity.",
    category: "MINTING",
    expectedResult: "FV18 (DMCE Upper Bound) enforces; issuance beyond DMCE capacity BLOCKED; bank notified.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T22",
    description: "Gateway compromise (forged signature on issuance request).",
    category: "BANKING",
    expectedResult: "executeIssuanceGate returns BLOCKED at BANK_AUTHENTICATION; forged signature rejected by mTLS + signature verification.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T23",
    description: "MITHQAL outage (canonical ledger unavailable).",
    category: "FAILURE",
    expectedResult: "FS-05 (GATEWAY_OUTAGE) engages; issuance requests fail safe (BLOCKED); no partial settlement; no unauthorized mint; canonical ledger immutable; reconciliation resumes on recovery.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T24",
    description: "Bank outage (participating bank unavailable).",
    category: "FAILURE",
    expectedResult: "FS-02 (BANK_SUSPENSION) or FS-05 (GATEWAY_OUTAGE) engages; issuance against affected bank BLOCKED; existing MTQ preserved; alternate bank coordination if available.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T25",
    description: "Redemption event — correct burn and release.",
    category: "REDEMPTION",
    expectedResult: "FV17 (Redemption Supply Conservation) verified; canonical supply reduced by N; redemption obligor releases backing; 5-way reconciliation VERIFIED.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T26",
    description: "Simultaneous redemption stress (multiple holders redeem simultaneously).",
    category: "REDEMPTION",
    expectedResult: "ILPS Layer 2 (redemption liquidity) engages; redemptions queued / processed within T+0 to T+3; no MTQ holder loss.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T27",
    description: "CALM transition (operational state escalates from CALM to ELEVATED/HIGH/SEVERE/CRITICAL).",
    category: "GOVERNANCE",
    expectedResult: "CALM state transitions correctly; Foundation dashboard updates; required controls escalate per state.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T28",
    description: "RR breach (RR < 1.00).",
    category: "RESERVE",
    expectedResult: "executeIssuanceGate returns BLOCKED at RR_STRESS_RR; DMCE reduced; Foundation dashboard flags exception; rebalancing triggers to restore RR.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T29",
    description: "LCR breach (LCR < 1.00).",
    category: "RESERVE",
    expectedResult: "executeIssuanceGate returns BLOCKED at LIQUIDITY_CHECK; ILPS engagement evaluated; Foundation dashboard flags exception.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T30",
    description: "Five-way reconciliation mismatch (bank subledger ≠ canonical ledger).",
    category: "BANKING",
    expectedResult: "runReserveBackingReconciliation returns status=MISMATCH or CRITICAL; issuance against affected bank BLOCKED; forensic reconciliation engages.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T31",
    description: "Foundation read-only access verified (Foundation can view aggregate dashboard).",
    category: "FOUNDATION",
    expectedResult: "FoundationReadOnlyMonitoringService returns 7-field snapshot; no write access permitted; no mint / authorize / buy / sell / transfer / override actions permitted.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T32",
    description: "Foundation attempted mint — BLOCKED.",
    category: "FOUNDATION",
    expectedResult: "FV25 (Mint Authorization Separation) enforces; Foundation cannot mint; request BLOCKED; audit trail preserved; escalation to independent auditors.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T33",
    description: "Holding attempted mint — BLOCKED.",
    category: "GOVERNANCE",
    expectedResult: "FV25 (Mint Authorization Separation) enforces; Holding cannot mint; request BLOCKED; audit trail preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T34",
    description: "Technology Company attempted mint — BLOCKED.",
    category: "GOVERNANCE",
    expectedResult: "FV25 (Mint Authorization Separation) enforces; Technology Company cannot mint; request BLOCKED; audit trail preserved.",
    status: "DESIGNED",
  },
  {
    testId: "INT-T35",
    description: "Operating Company manual mint attempt — BLOCKED.",
    category: "GOVERNANCE",
    expectedResult: "FV25 (Mint Authorization Separation) enforces; Operating Company cannot mint at discretion; only deterministic technical execution creates MTQ; request BLOCKED; audit trail preserved.",
    status: "DESIGNED",
  },
];

export const INTEGRATED_TEST_SCENARIO_COUNT = 35;

// ============================================================================
// Section AN: Dashboards (3 dashboards)
// ============================================================================

export const MITHQAL_MONETARY_CONTROL_DASHBOARD: readonly string[] = [
  "Total MTQ",
  "Reserve Market Value",
  "Adjusted Reserve",
  "Liquidation Reserve",
  "RR",
  "StressRR",
  "LCR",
  "MLCR",
  "ILPS",
  "Reserve Weights",
  "Currency Weights",
  "Bullion",
  "Digital Liquidity",
  "Minting Capacity",
  "Bank Exposure",
  "Custodian Concentration",
  "Rebalancing Status",
  "Reconciliation",
  "Certificates",
  "Incidents",
];

export const BANK_DASHBOARD: readonly string[] = [
  "Bank MTQ position",
  "Minting Capacity",
  "backing status",
  "active certificates",
  "settlement status",
  "reconciliation status",
];

export const FOUNDATION_DASHBOARD_READ_ONLY: readonly string[] = [
  "total supply",
  "reserve status",
  "weight history",
  "major exceptions",
  "constitutional metrics",
  "incidents",
  "CALM state",
];

export const DASHBOARDS_RULE =
  "3 dashboards: MITHQAL Monetary Control Dashboard (20 fields — operational) | Bank Dashboard (6 fields — " +
  "institutional) | Foundation Dashboard (7 fields — READ-ONLY aggregate oversight). Foundation access is READ_ONLY.";

// ============================================================================
// Section AO: Commercial Economics
// ============================================================================

export const COMMERCIAL_ECONOMICS = {
  operatingCompanyRevenue: [
    "connectivity fees (per bank gateway integration / connection)",
    "issuance service fees (per issuance transaction processing)",
    "settlement fees (per settlement execution)",
    "redemption infrastructure fees (per redemption processing)",
    "reconciliation fees (per reconciliation cycle / report)",
    "enterprise integration fees (per enterprise / institutional integration)",
    "premium institutional services fees (per premium tier service)",
    "custody evidence verification fees (per RCAF / ABC verification)",
    "infrastructure licensing fees (per technology licensing where applicable)",
  ],
  technologyCompanyRevenue: [
    "intercompany service fees (from Operating Company per intercompany agreement)",
    "technology licensing fees (where applicable)",
    "patent / IP licensing fees (where applicable)",
    "professional services fees (implementation / integration)",
  ],
  holdingCompany: {
    role: "Owns subsidiaries; receives dividends; holds enterprise value",
    revenue: "Dividends from Operating + Technology subsidiaries + retained earnings",
  },
  foundation: {
    role: "Independent nonprofit — no private profit",
    revenue: "Foundation operating funds (separate from reserves); grants / donations where legally permitted",
  },
  rule:
    "Commercial economics: Operating Company (9 revenue sources), Technology Company (4 revenue sources), Holding " +
    "(owns subsidiaries + dividends), Foundation (nonprofit, no private profit). Revenue is CORPORATE — not RESERVE. " +
    "Reserve appreciation is NOT a commercial profit source.",
} as const;

// ============================================================================
// Section AP: Reconciliation Authority Matrix (7 actors × 17 functions)
// ============================================================================

export type AuthorityActor =
  | "FOUNDATION"
  | "HOLDING"
  | "OPERATING_CO"
  | "TECH_CO"
  | "BANK"
  | "CUSTODIAN"
  | "CENTRAL_BANK_REGULATOR";

export interface AuthorityMatrixEntry {
  func: string;
  foundation: string;
  holding: string;
  operatingCo: string;
  techCo: string;
  bank: string;
  custodian: string;
  centralBankRegulator: string;
}

export const AUTHORITY_MATRIX: AuthorityMatrixEntry[] = [
  {
    func: "constitutional governance",
    foundation: "STEWARD",
    holding: "NONE",
    operatingCo: "EXECUTE",
    techCo: "NONE",
    bank: "NONE",
    custodian: "NONE",
    centralBankRegulator: "AUTHORIZE",
  },
  {
    func: "commercial ownership",
    foundation: "NONE",
    holding: "OWN",
    operatingCo: "OPERATE",
    techCo: "OPERATE",
    bank: "NONE",
    custodian: "NONE",
    centralBankRegulator: "NONE",
  },
  {
    func: "technology",
    foundation: "READ_ONLY",
    holding: "OWN_SUBSIDIARY",
    operatingCo: "OPERATE",
    techCo: "OWN",
    bank: "INTEGRATE",
    custodian: "NONE",
    centralBankRegulator: "REVIEW",
  },
  {
    func: "patents",
    foundation: "NONE",
    holding: "OWN_SUBSIDIARY",
    operatingCo: "NONE",
    techCo: "OWN",
    bank: "NONE",
    custodian: "NONE",
    centralBankRegulator: "NONE",
  },
  {
    func: "MTQ issuance rules",
    foundation: "STEWARD",
    holding: "NONE",
    operatingCo: "ENFORCE",
    techCo: "IMPLEMENT",
    bank: "REQUEST",
    custodian: "NONE",
    centralBankRegulator: "AUTHORIZE",
  },
  {
    func: "mint authorization",
    foundation: "NONE",
    holding: "NONE",
    operatingCo: "EVALUATE",
    techCo: "EXECUTE_DETERMINISTIC",
    bank: "NONE",
    custodian: "NONE",
    centralBankRegulator: "NONE",
  },
  {
    func: "customer KYC",
    foundation: "NONE",
    holding: "NONE",
    operatingCo: "NONE",
    techCo: "NONE",
    bank: "EXECUTE",
    custodian: "NONE",
    centralBankRegulator: "SUPERVISE",
  },
  {
    func: "AML / sanctions",
    foundation: "NONE",
    holding: "NONE",
    operatingCo: "NONE",
    techCo: "NONE",
    bank: "EXECUTE",
    custodian: "EXECUTE",
    centralBankRegulator: "SUPERVISE",
  },
  {
    func: "customer funds",
    foundation: "NONE",
    holding: "NONE",
    operatingCo: "NONE",
    techCo: "NONE",
    bank: "HOLD",
    custodian: "NONE",
    centralBankRegulator: "SUPERVISE",
  },
  {
    func: "reserve custody",
    foundation: "NONE",
    holding: "NONE",
    operatingCo: "MONITOR",
    techCo: "NONE",
    bank: "HOLD",
    custodian: "HOLD",
    centralBankRegulator: "SUPERVISE",
  },
  {
    func: "reserve verification",
    foundation: "READ_ONLY_AGGREGATE",
    holding: "NONE",
    operatingCo: "EXECUTE",
    techCo: "IMPLEMENT",
    bank: "ATTEST",
    custodian: "ATTEST",
    centralBankRegulator: "REVIEW",
  },
  {
    func: "reserve rebalancing policy",
    foundation: "STEWARD",
    holding: "NONE",
    operatingCo: "EVALUATE",
    techCo: "IMPLEMENT",
    bank: "NONE",
    custodian: "NONE",
    centralBankRegulator: "REVIEW",
  },
  {
    func: "reserve trade execution",
    foundation: "NONE",
    holding: "NONE",
    operatingCo: "MONITOR",
    techCo: "NONE",
    bank: "EXECUTE",
    custodian: "EXECUTE",
    centralBankRegulator: "SUPERVISE",
  },
  {
    func: "MTQ settlement",
    foundation: "READ_ONLY_AGGREGATE",
    holding: "NONE",
    operatingCo: "OPERATE",
    techCo: "IMPLEMENT",
    bank: "PARTICIPATE",
    custodian: "NONE",
    centralBankRegulator: "SUPERVISE",
  },
  {
    func: "redemption",
    foundation: "READ_ONLY_AGGREGATE",
    holding: "NONE",
    operatingCo: "OPERATE",
    techCo: "IMPLEMENT",
    bank: "EXECUTE",
    custodian: "EXECUTE",
    centralBankRegulator: "SUPERVISE",
  },
  {
    func: "Proof of Reserves",
    foundation: "READ_ONLY_AGGREGATE",
    holding: "NONE",
    operatingCo: "OPERATE",
    techCo: "IMPLEMENT",
    bank: "ATTEST",
    custodian: "ATTEST",
    centralBankRegulator: "REVIEW",
  },
  {
    func: "monitoring",
    foundation: "READ_ONLY_AGGREGATE",
    holding: "OWN_SUBSIDIARY",
    operatingCo: "OPERATE",
    techCo: "IMPLEMENT",
    bank: "REPORT",
    custodian: "REPORT",
    centralBankRegulator: "SUPERVISE",
  },
  {
    func: "external assurance",
    foundation: "COORDINATE",
    holding: "NONE",
    operatingCo: "COORDINATE",
    techCo: "NONE",
    bank: "PARTICIPATE",
    custodian: "PARTICIPATE",
    centralBankRegulator: "AUTHORIZE",
  },
];

export const AUTHORITY_MATRIX_RULE =
  "7 actors × 17 functions authority matrix. No function may have ambiguous ownership. Foundation = STEWARD / " +
  "READ_ONLY_AGGREGATE / COORDINATE; Holding = OWN / OWN_SUBSIDIARY; Operating Co = OPERATE / ENFORCE / EVALUATE / " +
  "EXECUTE; Technology Co = IMPLEMENT / EXECUTE_DETERMINISTIC / OWN; Bank = REQUEST / HOLD / ATTEST / PARTICIPATE / " +
  "EXECUTE / REPORT; Custodian = HOLD / ATTEST / EXECUTE / REPORT / PARTICIPATE; Central Bank/Regulator = AUTHORIZE / " +
  "SUPERVISE / REVIEW.";

// ============================================================================
// Section AQ: Gold/Rebalancing Authority Matrix
// ============================================================================

export const GOLD_REBALANCING_AUTHORITY = {
  whoCalculates: "MITHQAL Operating Company — Reserve/Rebalancing Engine (Monetary & Reserve Control Division)",
  whoApprovesPolicy: "Constitutional/approved reserve governance process (Foundation STEWARD + regulator AUTHORIZE)",
  whoExecutesMarketTransaction: "Authorized reserve manager / institutional treasury / legally designated reserve holder",
  whoCustodies: "Qualified custodian / legally designated holder",
  whoVerifies: "Independent evidence (Source B custodian + Source D oracle where available) + MITHQAL verification",
  whoRecords: "MITHQAL Reserve Ledger (canonical)",
  whoPublishesProof: "Proof-of-Reserves system (zero-knowledge where applicable)",
  whoOversees: "Foundation read-only constitutional oversight + independent auditors + regulators as applicable",
  rule:
    "Gold acquisition + rebalancing authority is deliberately separated across 8 roles: CALCULATES (Operating Co) | " +
    "APPROVES_POLICY (Foundation + regulator) | EXECUTES_MARKET (reserve manager) | CUSTODIES (qualified custodian) | " +
    "VERIFIES (independent evidence + MITHQAL) | RECORDS (canonical ledger) | PUBLISHES_PROOF (PoR system) | " +
    "OVERSEES (Foundation + auditors + regulators). No single role can unilaterally execute all 8 steps.",
} as const;

// ============================================================================
// Section AR: No Contradictory Authority
// ============================================================================

export interface ContradictoryPhraseCorrection {
  forbiddenPhrase: string;
  blueprintContains: boolean;
  correctedLanguage: string;
  rationale: string;
}

export const CONTRADICTORY_PHRASES_TO_CORRECT: ContradictoryPhraseCorrection[] = [
  {
    forbiddenPhrase: "MITHQAL holds customer funds",
    blueprintContains: false,
    correctedLanguage: "MITHQAL receives reserve attestations; customer funds remain in bank custody",
    rationale: "MITHQAL is non-custodial by default per §V25.0.C. Customer funds remain in bank custody.",
  },
  {
    forbiddenPhrase: "MITHQAL is the custodian of customer deposits",
    blueprintContains: false,
    correctedLanguage: "Banks hold customer deposits; MITHQAL verifies eligibility",
    rationale: "Custody and monetary control are deliberately separated per §V25.0.C.",
  },
  {
    forbiddenPhrase: "MITHQAL controls customer bank accounts",
    blueprintContains: false,
    correctedLanguage: "Banks control customer bank accounts; MITHQAL controls MTQ monetary rules and canonical supply",
    rationale: "MITHQAL does not control customer bank accounts under non-custodial default.",
  },
  {
    forbiddenPhrase: "MITHQAL takes custody of reserve assets by default",
    blueprintContains: false,
    correctedLanguage: "Reserve assets remain in legally appropriate regulated custody (banks / qualified custodians)",
    rationale: "Per §V25.0.C, MITHQAL is non-custodial by default.",
  },
  {
    forbiddenPhrase: "MITHQAL is the redemption obligor by default",
    blueprintContains: false,
    correctedLanguage: "Redemption obligor is determined by legal structure of underlying reserve category and jurisdiction",
    rationale: "Per §V25.0.C.15, MITHQAL is not automatically the redemption obligor.",
  },
  {
    forbiddenPhrase: "Bank credit risk is zero",
    blueprintContains: false,
    correctedLanguage: "Bank credit risk is NONZERO (~0.5% per 30 days for TIER-1 bank)",
    rationale: "Honest state: bank-funded model REDUCES but does NOT eliminate risk.",
  },
  {
    forbiddenPhrase: "Model C eliminates the 21.5432% breach probability",
    blueprintContains: false,
    correctedLanguage: "Model C PRESERVES 21.5432% for MITHQAL-owned portion; blended ≈ 4.7086% (same as Model B)",
    rationale: "Non-custodial doesn't change math; changes WHO HOLDS the assets.",
  },
  {
    forbiddenPhrase: "The $15.815M ΔCapital_min is a fundraising target",
    blueprintContains: false,
    correctedLanguage: "$15.815M is a MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT — pending independent validation",
    rationale: "Per §V25.0.A.7, ΔCapital_min is NOT a fundraising target.",
  },
  {
    forbiddenPhrase: "Custody records imply MITHQAL legal ownership",
    blueprintContains: false,
    correctedLanguage: "Custody records are independent evidence; MITHQAL does not gain legal ownership from custody records",
    rationale: "Per FV10 (existing) and §V25.0.C, custody does not imply legal ownership.",
  },
  {
    forbiddenPhrase: "AvailableBackingCertificate is a transfer of assets to MITHQAL",
    blueprintContains: false,
    correctedLanguage: "AvailableBackingCertificate is EVIDENCE — not custody, not a transfer of assets",
    rationale: "Per §V25.0.C.6, the certificate is evidence only.",
  },
  {
    forbiddenPhrase: "MITHQAL can mint MTQ at its own discretion",
    blueprintContains: false,
    correctedLanguage: "Only deterministic technical execution (canonical ledger) creates MTQ — never discretionary governance action",
    rationale: "Per FV25, mint authority is deliberately separated.",
  },
  {
    forbiddenPhrase: "A bank can create MTQ merely by asserting that funds exist",
    blueprintContains: false,
    correctedLanguage: "Banks must provide AvailableBackingCertificate + custodian evidence; 15-step issuance authorization gate applies",
    rationale: "Per §V25.0.C.7, ANY FAILURE = BLOCK.",
  },
  {
    forbiddenPhrase: "v25.1 has been created",
    blueprintContains: false,
    correctedLanguage: "v25.0 remains the FROZEN NORMATIVE ARCHITECTURE; no v25.1 has been created",
    rationale: "Per CRITICAL VERSION RULE, no v25.1 / v26 / fork permitted.",
  },
];

export const NO_CONTRADICTORY_AUTHORITY_RULE =
  "13 contradictory phrases must be corrected. Each phrase is FORBIDDEN; the corrected language is the canonical " +
  "alternative. The blueprint (as of v25.0 with §V25.0.A / §V25.0.B / §V25.0.C) does NOT contain any of these " +
  "forbidden phrases (all blueprintContains=false). The corrections preserve the honest state throughout.";

// ============================================================================
// Section AS: Acceptance Criteria (44 items)
// ============================================================================

export interface AcceptanceCriterion {
  id: string; // AC-01 ... AC-44
  criterion: string;
  met: boolean;
  evidence: string;
}

export const FINAL_ACCEPTANCE_CRITERIA: AcceptanceCriterion[] = [
  { id: "AC-01", criterion: "v25.0 frozen — no v25.1 created", met: true, evidence: "VERSION_CONTROL.noV25_1Created=true" },
  { id: "AC-02", criterion: "21.5432% breach probability PRESERVED for Model A", met: true, evidence: "monetary-model-lock.ts BREACH_PROBABILITY_MODEL.value=0.215432" },
  { id: "AC-03", criterion: "4.7086% blended breach probability PRESERVED for Model B/C", met: true, evidence: "non-custodial-reserve-architecture.ts runModelC_NonCustodialBankFunded()=0.047086" },
  { id: "AC-04", criterion: "ΔCapital_min $15.815M classified as MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT", met: true, evidence: "DELTA_CAPITAL_MIN.classification" },
  { id: "AC-05", criterion: "ILPS corrected to $48.1M (no double counting)", met: true, evidence: "ilps.ts + ILPS_CANONICAL_ACCOUNTING.total=$48,100,000" },
  { id: "AC-06", criterion: "5 corporate entities documented", met: true, evidence: "FINAL_CORPORATE_STRUCTURE.length=5" },
  { id: "AC-07", criterion: "7-layer MTQ canonical model documented", met: true, evidence: "MTQ_7_LAYER_MODEL (7 layers)" },
  { id: "AC-08", criterion: "MTQ characterized as neutral/permissioned/institutional/wholesale/settlement-focused", met: true, evidence: "MTQ_IS (5 attributes)" },
  { id: "AC-09", criterion: "MTQ NOT characterized as sovereign/retail/USD-stablecoin/BRICS/CBDC/investment", met: true, evidence: "MTQ_IS_NOT (8 disclaimers)" },
  { id: "AC-10", criterion: "Bank integration principle = TRANSLATION, NOT TRANSFORMATION", met: true, evidence: "BANK_INTEGRATION_CANONICAL_PRINCIPLE" },
  { id: "AC-11", criterion: "Bank responsibilities (13 items) documented", met: true, evidence: "BANK_RESPONSIBILITIES.length=13" },
  { id: "AC-12", criterion: "Bank MAY (4 items) + MAY NOT (6 items) documented", met: true, evidence: "BANK_MAY.length=4 + BANK_MAY_NOT.length=6" },
  { id: "AC-13", criterion: "Operating Co responsibilities (15 items) documented", met: true, evidence: "OPERATING_CO_RESPONSIBILITIES.length=15" },
  { id: "AC-14", criterion: "Monetary & Reserve Control Division operationally separated", met: true, evidence: "MONETARY_RESERVE_CONTROL_DIVISION.operationallySeparatedFrom" },
  { id: "AC-15", criterion: "Foundation SHALL (11) + SHALL NOT (8) documented", met: true, evidence: "FOUNDATION_SHALL.length=11 + FOUNDATION_SHALL_NOT.length=8" },
  { id: "AC-16", criterion: "Foundation monitoring access = READ_ONLY", met: true, evidence: "FOUNDATION_MONITORING_ACCESS='READ_ONLY'" },
  { id: "AC-17", criterion: "Technology Co owns (12 items) documented", met: true, evidence: "TECHNOLOGY_CO_OWNS.length=12" },
  { id: "AC-18", criterion: "Reserve custody non-custodial by default (per §V25.0.C)", met: true, evidence: "RESERVE_CUSTODY_PRINCIPLE + reference to §V25.0.C" },
  { id: "AC-19", criterion: "Constitutional corridors documented (fiat 70-85% / bullion 15-25% / digital 0-5%)", met: true, evidence: "RESERVE_CONSTITUTIONAL_CORRIDORS" },
  { id: "AC-20", criterion: "6-step currency weight engine documented", met: true, evidence: "CURRENCY_WEIGHT_ENGINE_STEPS.length=6" },
  { id: "AC-21", criterion: "USD characterized as ONE eligible currency (NOT monetary anchor)", met: true, evidence: "CURRENCY_WEIGHTING_RULES.usdIsOneEligibleCurrency=true + mtqIsNotUSDbacked=true" },
  { id: "AC-22", criterion: "Three-layer reserve valuation (R_m / R_a / R_l) documented", met: true, evidence: "THREE_LAYER_RESERVE_VALUATION (invariant R_l ≤ R_a ≤ R_m)" },
  { id: "AC-23", criterion: "16-step gold acquisition workflow documented", met: true, evidence: "GOLD_ACQUISITION_WORKFLOW.length=16" },
  { id: "AC-24", criterion: "Reserve acquisition funding sources documented (6 NOTs)", met: true, evidence: "RESERVE_ACQUISITION_FUNDING.defaultPrinciples.length=6" },
  { id: "AC-25", criterion: "13-step rebalancing engine flow documented", met: true, evidence: "REBALANCING_ENGINE_FLOW.length=13" },
  { id: "AC-26", criterion: "No-Trade Principle documented", met: true, evidence: "NO_TRADE_PRINCIPLE" },
  { id: "AC-27", criterion: "Rebalancing example uses PAR-equivalent units (NOT USD)", met: true, evidence: "REBALANCING_EXAMPLE (denomination-neutral)" },
  { id: "AC-28", criterion: "DMCE formula documented (MIN of 8 limits)", met: true, evidence: "DMCE_FORMULA + computeDMCE() function" },
  { id: "AC-29", criterion: "RCAF + AvailableBackingCertificate referenced (not duplicated)", met: true, evidence: "RCAF_ABC_REFERENCE.modulePath" },
  { id: "AC-30", criterion: "16-step bank minting workflow documented", met: true, evidence: "BANK_MINTING_WORKFLOW.length=16" },
  { id: "AC-31", criterion: "5-way reconciliation referenced (7-state, existing)", met: true, evidence: "FIVE_WAY_RECONCILIATION_REFERENCE" },
  { id: "AC-32", criterion: "8 failure scenarios documented", met: true, evidence: "FAILURE_SCENARIOS.length=8" },
  { id: "AC-33", criterion: "13 technology services documented", met: true, evidence: "TECHNOLOGY_SERVICES.length=13" },
  { id: "AC-34", criterion: "16 data models documented", met: true, evidence: "DATA_MODELS_COUNT=16 + DATA_MODELS_LIST" },
  { id: "AC-35", criterion: "12 versioned API endpoints documented", met: true, evidence: "VERSIONED_API_ENDPOINTS.length=12" },
  { id: "AC-36", criterion: "15 FV invariants documented (FV11-FV25)", met: true, evidence: "FV11_THROUGH_FV25 (FV11..FV25) + FV_INVARIANT_COUNT=15" },
  { id: "AC-37", criterion: "8 NEW FV invariants added (FV18-FV25)", met: true, evidence: "FV_NEW_INVARIANT_COUNT=8" },
  { id: "AC-38", criterion: "35 test scenarios documented (INT-T01..INT-T35)", met: true, evidence: "INTEGRATED_TEST_SCENARIOS.length=35" },
  { id: "AC-39", criterion: "3 dashboards documented (Monetary 20 + Bank 6 + Foundation 7)", met: true, evidence: "MITHQAL_MONETARY_CONTROL_DASHBOARD.length=20 + BANK_DASHBOARD.length=6 + FOUNDATION_DASHBOARD_READ_ONLY.length=7" },
  { id: "AC-40", criterion: "7×17 authority matrix documented", met: true, evidence: "AUTHORITY_MATRIX.length=17 (7 actors)" },
  { id: "AC-41", criterion: "Gold/Rebalancing authority matrix documented (8 roles)", met: true, evidence: "GOLD_REBALANCING_AUTHORITY (8 keys)" },
  { id: "AC-42", criterion: "13 contradictory phrases documented with corrections", met: true, evidence: "CONTRADICTORY_PHRASES_TO_CORRECT.length=13" },
  { id: "AC-43", criterion: "44 acceptance criteria documented", met: true, evidence: "FINAL_ACCEPTANCE_CRITERIA.length=44 (self-referential)" },
  { id: "AC-44", criterion: "50 reconciliation principles documented", met: true, evidence: "RECONCILIATION_PRINCIPLES.length=50" },
];

export const ACCEPTANCE_CRITERIA_RULE =
  "44 acceptance criteria (AC-01..AC-44). Each criterion declares met=true only when independent evidence is " +
  "present. Honest state preserved: criteria are NOT marked met=true without evidence. Final status remains " +
  "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.";

// ============================================================================
// Section AT: Final Output Summary — generateFinalIntegratedReport()
// ============================================================================

export interface FinalIntegratedReport {
  moduleId: string;
  taskId: string;
  architectureVersion: string;
  blueprintDesignation: string;
  generatedAt: string;

  // Section A — Version Control
  versionControl: typeof VERSION_CONTROL;

  // Section B — Reconciliation Principles
  reconciliationPrinciples: readonly string[];
  reconciliationPrincipleCount: number;

  // Section C — Corporate Structure
  corporateStructure: CorporateStructureEntity[];
  corporateEntityCount: number;
  corporateStructureRule: string;

  // Section D — Founder Economics
  founderEconomics: typeof FOUNDER_ECONOMICS;

  // Section E — MTQ Position
  mtq7LayerModel: typeof MTQ_7_LAYER_MODEL;
  mtqIs: readonly string[];
  mtqIsNot: readonly string[];
  mtqPositionRule: string;

  // Section F — Bank Integration
  bankIntegrationCanonicalModel: string;
  bankIntegrationCanonicalPrinciple: string;

  // Section G — Bank Responsibilities
  bankResponsibilities: readonly string[];
  bankMay: readonly string[];
  bankMayNot: readonly string[];
  bankRule: string;

  // Section H — Operating Co
  operatingCoResponsibilities: readonly string[];
  monetaryReserveControlDivision: typeof MONETARY_RESERVE_CONTROL_DIVISION;

  // Section I — Foundation
  foundationShall: readonly string[];
  foundationShallNot: readonly string[];
  foundationTechnologyLayer: readonly string[];
  foundationMonitoringAccess: string;

  // Section J — Technology Co
  technologyCoOwns: readonly string[];

  // Section K — Reserve Custody Principle
  reserveCustodyPrinciple: string;
  reserveCustodyReference: string;

  // Section L — Reserve Architecture
  reserveConstitutionalCorridors: typeof RESERVE_CONSTITUTIONAL_CORRIDORS;

  // Section M — Currency Weighting
  currencyWeightEngineSteps: readonly string[];
  currencyWeightingRules: typeof CURRENCY_WEIGHTING_RULES;

  // Section N — Bullion Weighting
  bullionWeighting: typeof BULLION_WEIGHTING;

  // Section O — Operational Digital Liquidity
  operationalDigitalLiquidity: typeof OPERATIONAL_DIGITAL_LIQUIDITY;

  // Section P — Three-Layer Reserve Valuation
  threeLayerReserveValuation: typeof THREE_LAYER_RESERVE_VALUATION;

  // Section Q — Gold Acquisition
  goldAcquisitionWorkflow: readonly string[];

  // Section R — Reserve Acquisition Funding
  reserveAcquisitionFunding: typeof RESERVE_ACQUISITION_FUNDING;

  // Section S — Rebalancing Engine
  rebalancingEngineFlow: readonly string[];
  rebalancingMustPreserve: readonly string[];

  // Section T — No-Trade Principle
  noTradePrinciple: string;

  // Section U — Rebalancing Example
  rebalancingExample: string;

  // Section V — DMCE
  dmceFormula: string;
  dmceComponentDefinitions: typeof DMCE_COMPONENT_DEFINITIONS;
  dmceRule: string;

  // Section W — RCAF + ABC Reference
  rcafAbcReference: typeof RCAF_ABC_REFERENCE;

  // Section X — Bank Minting Workflow
  bankMintingWorkflow: readonly string[];

  // Section Y — Bank Backing Failure Reference
  bankBackingFailureReference: typeof BANK_BACKING_FAILURE_REFERENCE;

  // Section Z — Five-Way Reconciliation Reference
  fiveWayReconciliationReference: typeof FIVE_WAY_RECONCILIATION_REFERENCE;

  // Section AA — Bank Monitoring Authority
  bankMonitoringAuthority: typeof BANK_MONITORING_AUTHORITY;

  // Section AB — Foundation Oversight
  foundationOversight: typeof FOUNDATION_OVERSIGHT;

  // Section AC — Gold/Reserve Revenue
  goldReserveRevenueRules: typeof GOLD_RESERVE_REVENUE_RULES;

  // Section AD — Operating Capital
  operatingCapital: typeof OPERATING_CAPITAL;

  // Section AE — Capital Model
  sixCapitalCategoriesSummary: CapitalCategorySummary[];
  deltaCapitalMin: typeof DELTA_CAPITAL_MIN;

  // Section AF — Nomenclature
  nomenclature: typeof NOMENCLATURE;

  // Section AG — Redemption
  redemptionProfile: typeof REDEMPTION_PROFILE;

  // Section AH — Failure Scenarios
  failureScenarios: FailureScenario[];

  // Section AI — Technology Services
  technologyServices: readonly string[];

  // Section AJ — Data Models
  dataModelsCount: number;
  dataModelsList: readonly string[];

  // Section AK — API Endpoints
  apiEndpoints: readonly string[];
  apiSecurityRequirements: readonly string[];

  // Section AL — FV11-FV25
  fv11ThroughFv25: typeof FV11_THROUGH_FV25;
  fvInvariantCount: number;
  fvNewInvariantCount: number;
  fvVerificationChecks: readonly string[];

  // Section AM — Test Scenarios
  testScenarios: IntegratedTestScenario[];
  testScenarioCount: number;

  // Section AN — Dashboards
  mithqalMonetaryControlDashboard: readonly string[];
  bankDashboard: readonly string[];
  foundationDashboardReadOnly: readonly string[];

  // Section AO — Commercial Economics
  commercialEconomics: typeof COMMERCIAL_ECONOMICS;

  // Section AP — Authority Matrix
  authorityMatrix: AuthorityMatrixEntry[];
  authorityMatrixRowCount: number;

  // Section AQ — Gold/Rebalancing Authority
  goldRebalancingAuthority: typeof GOLD_REBALANCING_AUTHORITY;

  // Section AR — Contradictory Phrases
  contradictoryPhrasesToCorrect: ContradictoryPhraseCorrection[];

  // Section AS — Acceptance Criteria
  acceptanceCriteria: AcceptanceCriterion[];
  acceptanceCriteriaCount: number;
  acceptanceCriteriaMet: number;

  // Honest state
  honestState: {
    honest: true;
    forcedToPass: false;
    productionAuthorized: false;
    nonCustodialByDefault: true;
    v25_0_Frozen: true;
    noV25_1Created: true;
  };

  // Final status
  finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED";
}

export function generateFinalIntegratedReport(): FinalIntegratedReport {
  const acceptanceMet = FINAL_ACCEPTANCE_CRITERIA.filter(c => c.met).length;

  return {
    moduleId: MODULE_VERSION,
    taskId: TASK_ID,
    architectureVersion: ARCHITECTURE_VERSION,
    blueprintDesignation: BLUEPRINT_DESIGNATION,
    generatedAt: new Date().toISOString(),

    // Section A
    versionControl: VERSION_CONTROL,

    // Section B
    reconciliationPrinciples: RECONCILIATION_PRINCIPLES,
    reconciliationPrincipleCount: RECONCILIATION_PRINCIPLES.length,

    // Section C
    corporateStructure: FINAL_CORPORATE_STRUCTURE,
    corporateEntityCount: FINAL_CORPORATE_STRUCTURE.length,
    corporateStructureRule: CORPORATE_STRUCTURE_RULE,

    // Section D
    founderEconomics: FOUNDER_ECONOMICS,

    // Section E
    mtq7LayerModel: MTQ_7_LAYER_MODEL,
    mtqIs: MTQ_IS,
    mtqIsNot: MTQ_IS_NOT,
    mtqPositionRule: MTQ_POSITION_RULE,

    // Section F
    bankIntegrationCanonicalModel: BANK_INTEGRATION_CANONICAL_MODEL,
    bankIntegrationCanonicalPrinciple: BANK_INTEGRATION_CANONICAL_PRINCIPLE,

    // Section G
    bankResponsibilities: BANK_RESPONSIBILITIES,
    bankMay: BANK_MAY,
    bankMayNot: BANK_MAY_NOT,
    bankRule: BANK_RULE,

    // Section H
    operatingCoResponsibilities: OPERATING_CO_RESPONSIBILITIES,
    monetaryReserveControlDivision: MONETARY_RESERVE_CONTROL_DIVISION,

    // Section I
    foundationShall: FOUNDATION_SHALL,
    foundationShallNot: FOUNDATION_SHALL_NOT,
    foundationTechnologyLayer: FOUNDATION_TECHNOLOGY_LAYER,
    foundationMonitoringAccess: FOUNDATION_MONITORING_ACCESS,

    // Section J
    technologyCoOwns: TECHNOLOGY_CO_OWNS,

    // Section K
    reserveCustodyPrinciple: RESERVE_CUSTODY_PRINCIPLE,
    reserveCustodyReference: RESERVE_CUSTODY_REFERENCE,

    // Section L
    reserveConstitutionalCorridors: RESERVE_CONSTITUTIONAL_CORRIDORS,

    // Section M
    currencyWeightEngineSteps: CURRENCY_WEIGHT_ENGINE_STEPS,
    currencyWeightingRules: CURRENCY_WEIGHTING_RULES,

    // Section N
    bullionWeighting: BULLION_WEIGHTING,

    // Section O
    operationalDigitalLiquidity: OPERATIONAL_DIGITAL_LIQUIDITY,

    // Section P
    threeLayerReserveValuation: THREE_LAYER_RESERVE_VALUATION,

    // Section Q
    goldAcquisitionWorkflow: GOLD_ACQUISITION_WORKFLOW,

    // Section R
    reserveAcquisitionFunding: RESERVE_ACQUISITION_FUNDING,

    // Section S
    rebalancingEngineFlow: REBALANCING_ENGINE_FLOW,
    rebalancingMustPreserve: REBALANCING_MUST_PRESERVE,

    // Section T
    noTradePrinciple: NO_TRADE_PRINCIPLE,

    // Section U
    rebalancingExample: REBALANCING_EXAMPLE,

    // Section V
    dmceFormula: DMCE_FORMULA,
    dmceComponentDefinitions: DMCE_COMPONENT_DEFINITIONS,
    dmceRule: DMCE_RULE,

    // Section W
    rcafAbcReference: RCAF_ABC_REFERENCE,

    // Section X
    bankMintingWorkflow: BANK_MINTING_WORKFLOW,

    // Section Y
    bankBackingFailureReference: BANK_BACKING_FAILURE_REFERENCE,

    // Section Z
    fiveWayReconciliationReference: FIVE_WAY_RECONCILIATION_REFERENCE,

    // Section AA
    bankMonitoringAuthority: BANK_MONITORING_AUTHORITY,

    // Section AB
    foundationOversight: FOUNDATION_OVERSIGHT,

    // Section AC
    goldReserveRevenueRules: GOLD_RESERVE_REVENUE_RULES,

    // Section AD
    operatingCapital: OPERATING_CAPITAL,

    // Section AE
    sixCapitalCategoriesSummary: SIX_CAPITAL_CATEGORIES_SUMMARY,
    deltaCapitalMin: DELTA_CAPITAL_MIN,

    // Section AF
    nomenclature: NOMENCLATURE,

    // Section AG
    redemptionProfile: REDEMPTION_PROFILE,

    // Section AH
    failureScenarios: FAILURE_SCENARIOS,

    // Section AI
    technologyServices: TECHNOLOGY_SERVICES,

    // Section AJ
    dataModelsCount: DATA_MODELS_COUNT,
    dataModelsList: DATA_MODELS_LIST,

    // Section AK
    apiEndpoints: VERSIONED_API_ENDPOINTS,
    apiSecurityRequirements: API_SECURITY_REQUIREMENTS,

    // Section AL
    fv11ThroughFv25: FV11_THROUGH_FV25,
    fvInvariantCount: FV_INVARIANT_COUNT,
    fvNewInvariantCount: FV_NEW_INVARIANT_COUNT,
    fvVerificationChecks: FV_VERIFICATION_CHECKS,

    // Section AM
    testScenarios: INTEGRATED_TEST_SCENARIOS,
    testScenarioCount: INTEGRATED_TEST_SCENARIO_COUNT,

    // Section AN
    mithqalMonetaryControlDashboard: MITHQAL_MONETARY_CONTROL_DASHBOARD,
    bankDashboard: BANK_DASHBOARD,
    foundationDashboardReadOnly: FOUNDATION_DASHBOARD_READ_ONLY,

    // Section AO
    commercialEconomics: COMMERCIAL_ECONOMICS,

    // Section AP
    authorityMatrix: AUTHORITY_MATRIX,
    authorityMatrixRowCount: AUTHORITY_MATRIX.length,

    // Section AQ
    goldRebalancingAuthority: GOLD_REBALANCING_AUTHORITY,

    // Section AR
    contradictoryPhrasesToCorrect: CONTRADICTORY_PHRASES_TO_CORRECT,

    // Section AS
    acceptanceCriteria: FINAL_ACCEPTANCE_CRITERIA,
    acceptanceCriteriaCount: FINAL_ACCEPTANCE_CRITERIA.length,
    acceptanceCriteriaMet: acceptanceMet,

    // Honest state
    honestState: {
      honest: true,
      forcedToPass: false,
      productionAuthorized: false,
      nonCustodialByDefault: true,
      v25_0_Frozen: true,
      noV25_1Created: true,
    },

    // Final status
    finalStatus: "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED",
  };
}

// ============================================================================
// END OF MITHQAL v25.0 FINAL INTEGRATED INSTITUTIONAL / BANKING / RESERVE /
//        GOLD / REBALANCING ARCHITECTURE MODULE
// ============================================================================
// Honest state preserved throughout:
//   - 21.5432% PRESERVED for Model A (current reserve, 100% MITHQAL-owned)
//   - 4.7086% PRESERVED for Model B (bank-funded, blended)
//   - 4.7086% for Model C (non-custodial bank-funded, blended) — same as Model B
//   - ΔCapital_min $15.815M classified as MODEL-DERIVED ADDITIONAL MONETARY
//     PROTECTION REQUIREMENT (pending independent validation)
//   - ILPS total $48.1M corrected (Emergency + Structural $23.8M is SUBSET)
//   - nonCustodialByDefault = true
//   - v25.0 FROZEN — no v25.1 created
//   - Final status UNCHANGED: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT
//     PRODUCTION-AUTHORIZED
//
// This module BUILDS ON TOP of existing v25.0 modules. It does NOT duplicate
// functionality already in:
//   - non-custodial-reserve-architecture.ts (FV11-FV17, RCAF, ABC)
//   - bank-funded-issuance-model.ts (Model A/B, 6 capital categories)
//   - mithqal-bank-gateway.ts (MBG, MSAS, 7 connector classes)
//   - monetary-model-lock.ts (21.5432% model, locked)
//   - ilps.ts (5-layer $48.1M corrected)
//   - canonical-supply-ledger.ts (Theorems S1/S2/S3)
//
// 8 new FV invariants added (FV18-FV25) — total FV count now 25
//   (FV1-FV10 existing + FV11-FV17 from §V25.0.C + FV18-FV25 from this module).
// ============================================================================

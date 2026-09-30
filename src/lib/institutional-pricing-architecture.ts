// src/lib/institutional-pricing-architecture.ts
//
// MITHQAL v25.3.20 — INSTITUTIONAL PRICING / COMMERCIAL MODEL ARCHITECTURE
// (single source of truth for 7 fee types × 7 price stages, SEPARATE from
//  the ROI engine and from all control-plane decisions)
//
// Per PROMPT 35 (verbatim):
//   "Create a canonical institutional pricing architecture separate from the
//    ROI engine.
//    Define:
//    implementation fee, connectivity fee, settlement fee,
//    reconciliation/evidence fee, enterprise integration fee,
//    support/service fee and optional institutional services.
//    For each define:
//    pricing unit, quoted price, negotiated price, contracted price,
//    invoiced price, collected price and repeatable revenue status.
//    Create rules ensuring commercial fees cannot influence:
//    MTQ issuance authorization, reserve decisions, risk decisions or
//    finality decisions.
//    No illustrative price may appear as current commercial pricing."
//
// CHANGE REQUEST: CR-2026-011 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.20
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - SEPARATE from the ROI engine (per v25.3.11 Q1 bank-value-model) —
//     pricing decisions do not feed bank-value calculations and vice versa
//   - SEPARATE from all control-plane decisions (per v25.3.6 J3
//     CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary) —
//     fee collection cannot influence MTQ issuance authorization,
//     reserve decisions, risk decisions, or finality decisions
//
// Cross-references prior canonical modules:
//   - v25.3.5 K2/K3 (MTQ economic definition 12 isNotStatements + reserve coverage)
//   - v25.3.6 K4 (reserve domains — Settlement Liquidity vs Strategic Resilience)
//   - v25.3.6 J3 (control-plane boundary — CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE)
//   - v25.3.7 M1/M2 (institutional operating model — JOZOUR_LLC_NJ + trust domains A/B/C)
//   - v25.3.8 N1 (canonical finality model F0-F7 — 8 stages + 3 finality types)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)
//   - v25.3.9 O2 (6 reconciliation tolerance policies)
//   - v25.3.10 P1 (Corridor Pain Index — 12 weighted factors)
//   - v25.3.10 P2 (two pilot modes — A control plane + B MTQ settlement)
//   - v25.3.11 Q1 (bank value model + 4 evidence status labels —
//     SIMULATED / ILLUSTRATIVE / VALIDATED / INSTITUTIONALLY_VERIFIED.
//     The pricing architecture is SEPARATE from the ROI engine defined here.)
//   - v25.3.11 Q2 (pilot gate framework — 15 default gates)
//   - v25.3.12 R1 (bank-facing document set)
//   - v25.3.12 R2 (RegulatoryReplayEngine — READ-ONLY)
//   - v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle)
//   - v25.3.14 T2 (Controlled Architecture Freeze — 10 frozen schemas)
//   - v25.3.15 T1 (Adversarial Tests — 17 tests, 17/17 passed)
//   - v25.3.16 U1 (P25 Accounting/Prudential/Tax — 10 classification areas)
//   - v25.3.16 U2 (P26 PBC Legal Enforceability — 14 fields + 6 failure states)
//   - v25.3.17 V1 (PROMPT 27 — 6 forbidden assumptions)
//   - v25.3.18 W1 (P28 Bank Contracting Package — 17 sections ALL DRAFT +
//     P29 Institutional External Identity — 8 standards)
//   - v25.3.18 W2 (P30 Enterprise Risk Register + P31 Insurance Framework)
//   - v25.3.19 X2 (P34 Competitive Compatibility Framework — 7 competitors × 14 dims)
//   - v25.3.19 X1 (P32 Data Governance + P33 Dispute & Exception Framework)
//
// HONEST-STATE RULES (per directive):
//   - "No illustrative price may appear as current commercial pricing."
//     (NO_ILLUSTRATIVE_AS_CURRENT_RULE — every price stage across all 7 fee
//      types is PENDING; no commercial pricing has been set with any bank)
//   - "commercial fees cannot influence: MTQ issuance authorization, reserve
//      decisions, risk decisions or finality decisions."
//     (FEE_INDEPENDENCE_RULE — pricing is a sibling subsystem that may NOT
//      read or write any control-plane decision state)

// ============================================================================
// TYPES
// ============================================================================

// 7 fee types per directive (verbatim list):
//   implementation fee, connectivity fee, settlement fee,
//   reconciliation/evidence fee, enterprise integration fee,
//   support/service fee and optional institutional services
export type FeeTypeId =
  | "IMPLEMENTATION_FEE"
  | "CONNECTIVITY_FEE"
  | "SETTLEMENT_FEE"
  | "RECONCILIATION_EVIDENCE_FEE"
  | "ENTERPRISE_INTEGRATION_FEE"
  | "SUPPORT_SERVICE_FEE"
  | "OPTIONAL_INSTITUTIONAL_SERVICES";

// 7 price stages per fee type per directive (verbatim list):
//   pricing unit, quoted price, negotiated price, contracted price,
//   invoiced price, collected price and repeatable revenue status
export type PriceStage =
  | "PRICING_UNIT"
  | "QUOTED_PRICE"
  | "NEGOTIATED_PRICE"
  | "CONTRACTED_PRICE"
  | "INVOICED_PRICE"
  | "COLLECTED_PRICE"
  | "REPEATABLE_REVENUE_STATUS";

// Honest price-status enum. Per directive: "No illustrative price may appear
// as current commercial pricing." Therefore every numeric stage value is
// PENDING — the architecture defines the SHAPE of pricing (units, decision
// points, evidence requirements) but no commercial price has been set.
export type PriceValueStatus =
  | "PENDING" // No commercial price set — default honest state for every stage
  | "QUOTED_PENDING_ACCEPTANCE" // Quote issued; awaiting bank response (FUTURE state — not yet reached)
  | "NEGOTIATED_PENDING_SIGNATURE" // Negotiation concluded; awaiting contract execution (FUTURE — not yet reached)
  | "CONTRACTED_PENDING_INVOICE" // Contract executed; awaiting invoice issuance (FUTURE — not yet reached)
  | "INVOICED_PENDING_COLLECTION" // Invoice issued; awaiting collection (FUTURE — not yet reached)
  | "COLLECTED"; // Funds received against invoice (FUTURE — not yet reached)

// Repeatable-revenue status (the 7th price stage). Per directive each fee
// type must declare its repeatable-revenue status. All start as
// PENDING_DETERMINATION because no commercial pricing has been set.
export type RepeatableRevenueStatus =
  | "PENDING_DETERMINATION" // Honest default — no commercial engagement
  | "ONE_TIME" // Fee is one-time (e.g., implementation fee typically)
  | "RECURRING_FIXED" // Fixed periodic fee (e.g., monthly/annual flat)
  | "RECURRING_VARIABLE" // Variable periodic fee (e.g., per-transaction, basis-points)
  | "HYBRID"; // Mix of fixed + variable components

// Schema for a single price stage on a single fee type
export interface PriceStageRecord {
  stage: PriceStage;
  // The natural unit in which this stage is expressed (e.g., "USD flat",
  // "bps per annum on settlement notional", "per-message USD",
  // "engineering-hours", "monthly USD"). The UNIT is structural metadata;
  // the numeric value below is PENDING until a commercial engagement occurs.
  unit: string;
  // The price value, expressed as a string to avoid IEEE-754 ambiguity.
  // Per NO_ILLUSTRATIVE_AS_CURRENT_RULE: every value is "PENDING" — no
  // illustrative price may appear as current commercial pricing.
  value: string; // "PENDING" for all 7×7 = 49 stage records (honest default)
  status: PriceValueStatus;
  // Required evidence to advance this stage out of PENDING (e.g.,
  // signed quote, executed MSA, executed SOW, issued invoice, bank
  // payment confirmation). Per W1 bank-contracting-package
  // NO_CONTRACT_WITHOUT_EVIDENCE_RULE.
  requiredEvidence: string;
  // Whether advancing this stage may feed back into control-plane
  // decisions. Always false per FEE_INDEPENDENCE_RULE.
  mayInfluenceControlPlane: false;
}

// Schema for a single fee type with all 7 price stages
export interface FeeTypeDefinition {
  feeTypeId: FeeTypeId;
  name: string;
  description: string;
  // Whether this fee is mandatory for institutional engagement or optional.
  // Per directive: 6 of 7 fee types are core pricing (implementation,
  // connectivity, settlement, reconciliation/evidence, enterprise
  // integration, support/service); the 7th is explicitly optional.
  optional: boolean;
  // Pricing-unit summary (re-stated from PRICING_UNIT stage for quick scan)
  pricingUnitSummary: string;
  // Default repeatable-revenue status (re-stated from REPEATABLE_REVENUE_STATUS
  // stage for quick scan). All PENDING_DETERMINATION per honest state.
  repeatableRevenueDefault: RepeatableRevenueStatus;
  // All 7 price stages in canonical order
  stages: PriceStageRecord[];
  // Cross-reference to ROI engine boundary (per Q1 bank-value-model):
  // explicit statement that this fee does NOT feed bank-value calculations
  // and bank-value calculations do NOT feed this fee's pricing decisions.
  separateFromRoiEngine: true;
  // Cross-reference to control-plane boundary (per J3):
  // explicit statement that this fee cannot influence control-plane decisions
  cannotInfluenceControlPlane: true;
}

// ============================================================================
// CRITICAL RULES (per directive)
// ============================================================================

// Rule 1: "commercial fees cannot influence: MTQ issuance authorization,
//          reserve decisions, risk decisions or finality decisions."
export const FEE_INDEPENDENCE_RULE = {
  ruleId: "FEE_INDEPENDENCE_RULE",
  rule:
    "Commercial fees cannot influence MTQ issuance authorization, reserve decisions, risk decisions or finality decisions. " +
    "The pricing architecture is SEPARATE from the ROI engine (per v25.3.11 bank-value-model) and from all control-plane decisions " +
    "(per v25.3.4 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE).",
  description:
    "Per PROMPT 35: 'Create rules ensuring commercial fees cannot influence: MTQ issuance authorization, reserve decisions, " +
    "risk decisions or finality decisions.' The pricing architecture is a SIBLING subsystem that may not read or write any " +
    "control-plane decision state. Fee collection status (PENDING → QUOTED → NEGOTIATED → CONTRACTED → INVOICED → COLLECTED) " +
    "MUST NOT propagate into MTQ authorization, reserve sizing, risk-threshold selection, or finality-stage progression (F0-F7 per v25.3.8 N1).",
  whatItForbids:
    "(1) Conditioning MTQ issuance authorization on fee payment status. " +
    "(2) Adjusting reserve coverage (per v25.3.5 K3 reserve-coverage-logic) based on fee schedule. " +
    "(3) Lowering risk thresholds (per v25.3.18 W2 enterprise-risk-register) for higher-fee counterparties. " +
    "(4) Accelerating finality-stage progression (per v25.3.8 N1 F0-F7) based on fee payment. " +
    "(5) Any data flow from the pricing subsystem into the control-plane (CONTROL_PLANE_CORE per v25.3.6 J3).",
  whatItPermits:
    "(1) Issuing quotes, negotiating, contracting, invoicing and collecting fees as a parallel commercial track. " +
    "(2) Recording fee payment status in the Institutional Evidence Fabric (per v25.3.8 N2) as evidence. " +
    "(3) Refusing to settle when contract preconditions are unmet (per W1 bank-contracting-package NO_CONTRACT_WITHOUT_EVIDENCE_RULE) — " +
    "this is a CONTRACT precondition, not a control-plane decision, and applies symmetrically regardless of fee amount. " +
    "(4) Suspending service for non-payment under contractual remedy — this is a contract remedy, NOT a control-plane override.",
  enforcement:
    "All 7 FeeTypeDefinition objects carry cannotInfluenceControlPlane = true. All 7×7 = 49 PriceStageRecord objects carry " +
    "mayInfluenceControlPlane = false. The pricing module exposes NO function that reads from or writes to the control-plane " +
    "(MTQ authorization, reserve, risk, finality). Runtime invariant check at module load.",
  controlPlaneDecisionsProtected: [
    "MTQ_ISSUANCE_AUTHORIZATION",
    "RESERVE_DECISIONS",
    "RISK_DECISIONS",
    "FINALITY_DECISIONS",
  ],
  siblingSubsystems: [
    "ROI engine (v25.3.11 Q1 bank-value-model) — SEPARATE",
    "Control plane (v25.3.6 J3 CONTROL_PLANE_CORE) — SEPARATE",
    "MTQ settlement module (v25.3.6 J3 MTQ_SETTLEMENT_MODULE) — SEPARATE",
    "Finality model (v25.3.8 N1 F0-F7) — SEPARATE",
    "Reserve coverage logic (v25.3.5 K3) — SEPARATE",
    "Enterprise risk register (v25.3.18 W2) — SEPARATE",
  ],
} as const;

// Rule 2: "No illustrative price may appear as current commercial pricing."
export const NO_ILLUSTRATIVE_AS_CURRENT_RULE = {
  ruleId: "NO_ILLUSTRATIVE_AS_CURRENT_RULE",
  rule:
    "No illustrative price may appear as current commercial pricing. All prices are PENDING — no commercial pricing has been set with any bank.",
  description:
    "Per PROMPT 35: 'No illustrative price may appear as current commercial pricing.' " +
    "The pricing architecture defines the SHAPE of pricing (units, decision points, evidence requirements, repeatable-revenue defaults) " +
    "but does NOT populate illustrative numeric values. Every PriceStageRecord.value across all 7 fee types × 7 price stages (49 records) " +
    "is the literal string 'PENDING'. Any future quote/negotiation/contract/invoice/collection MUST be backed by executed evidence " +
    "(per W1 NO_CONTRACT_WITHOUT_EVIDENCE_RULE) and recorded with an explicit PriceValueStatus transition.",
  whatItForbids:
    "(1) Publishing illustrative USD or bps numbers as if they were current commercial pricing. " +
    "(2) Presenting a 'sample quote' or 'reference price' as a bank's actual commercial pricing. " +
    "(3) Hard-coding a fee schedule (e.g., 'implementation fee = $X') that could be mistaken for an active commercial price. " +
    "(4) Reusing SIMULATED/ILLUSTRATIVE evidence (per Q1 evidence status labels) as VALIDATED commercial pricing.",
  whatItPermits:
    "(1) Defining the structural unit (USD flat, bps per annum, per-message USD, engineering-hours, monthly USD) without a numeric value. " +
    "(2) Recording future QUOTED / NEGOTIATED / CONTRACTED / INVOICED / COLLECTED values when supported by executed evidence. " +
    "(3) Internal modeling of pricing scenarios for design purposes — provided the output is clearly labeled ILLUSTRATIVE and " +
    "never surfaced as current commercial pricing.",
  enforcement:
    "All 49 PriceStageRecord.value fields are the literal string 'PENDING'. All 49 PriceStageRecord.status fields are 'PENDING'. " +
    "All 7 FeeTypeDefinition.repeatableRevenueDefault fields are 'PENDING_DETERMINATION'. " +
    "Runtime invariant check at module load scans every stage record and asserts value === 'PENDING' && status === 'PENDING'.",
  honestState:
    "All 7 fee types × 7 price stages × 1 value field = 49 PENDING values. " +
    "All 7 repeatable-revenue defaults = PENDING_DETERMINATION. " +
    "0 quoted prices. 0 negotiated prices. 0 contracted prices. 0 invoiced prices. 0 collected prices. " +
    "No commercial pricing has been set with any bank.",
  notAQuote:
    "Per PROMPT 35: 'No illustrative price may appear as current commercial pricing.' This module is a PRICING ARCHITECTURE " +
    "(structural shape), NOT a quote, NOT a price list, NOT a term sheet. Pricing decisions occur only inside an executed " +
    "bank engagement and are recorded per W1 bank-contracting-package.",
} as const;

// ============================================================================
// THE 7 PRICE STAGES (catalog for transparency / API surfacing)
// ============================================================================

export const PRICE_STAGES: PriceStage[] = [
  "PRICING_UNIT",
  "QUOTED_PRICE",
  "NEGOTIATED_PRICE",
  "CONTRACTED_PRICE",
  "INVOICED_PRICE",
  "COLLECTED_PRICE",
  "REPEATABLE_REVENUE_STATUS",
];

export const PRICE_STAGE_COUNT = PRICE_STAGES.length; // 7

// ============================================================================
// THE 7 FEE TYPES × 7 PRICE STAGES
// ============================================================================
//
// HONEST-STATE — every numeric price stage value is "PENDING". The
// architecture defines shape (units, decision points, evidence) — not
// commercial pricing. Per NO_ILLUSTRATIVE_AS_CURRENT_RULE.

export const FEE_TYPES: FeeTypeDefinition[] = [
  // --------------------------------------------------------------------
  // 1. IMPLEMENTATION FEE (mandatory)
  // --------------------------------------------------------------------
  {
    feeTypeId: "IMPLEMENTATION_FEE",
    name: "Implementation Fee",
    description:
      "One-time professional-services fee covering architectural review, integration scoping, " +
      "control-plane onboarding (per v25.3.6 J3 CONTROL_PLANE_CORE), evidence-fabric initialization " +
      "(per v25.3.8 N2), reconciliation-policy configuration (per v25.3.9 O2), and pilot gate setup " +
      "(per v25.3.11 Q2). Charged for the implementation engagement; does NOT unlock MTQ issuance " +
      "authorization (per FEE_INDEPENDENCE_RULE).",
    optional: false,
    pricingUnitSummary: "Engineering engagement unit (structure defined; value PENDING)",
    repeatableRevenueDefault: "PENDING_DETERMINATION",
    stages: [
      {
        stage: "PRICING_UNIT",
        unit: "Engineering engagement — scope expressed in work-streams + duration (weeks).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed Statement of Work (SOW) per W1 bank-contracting-package §3 — must be SIGNED before unit is contractually fixed.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "QUOTED_PRICE",
        unit: "USD flat — quoted against the SOW scope.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Issued quote document with SOW reference, valid through stated expiry; recorded in evidence fabric (per N2).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "NEGOTIATED_PRICE",
        unit: "USD flat — agreed between MITHQAL and bank after negotiation rounds.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Negotiation record + agreed term-sheet item (per W1 §7 commercial terms).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "CONTRACTED_PRICE",
        unit: "USD flat — fixed in executed MSA + SOW.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed MSA (per W1 §2) + executed SOW (per W1 §3); both must be SIGNED per NO_CONTRACT_WITHOUT_EVIDENCE_RULE.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "INVOICED_PRICE",
        unit: "USD flat — per invoice schedule (milestone-based or time-based).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued invoice referencing executed SOW milestone acceptance.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "COLLECTED_PRICE",
        unit: "USD flat — funds received against invoice.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Bank payment confirmation; recorded in evidence fabric (per N2). Does NOT unlock MTQ issuance (per FEE_INDEPENDENCE_RULE).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "REPEATABLE_REVENUE_STATUS",
        unit: "One-time per engagement (re-quoted on scope expansion).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Per-engagement SOW. Repeatable-revenue default = ONE_TIME (pending commercial determination).",
        mayInfluenceControlPlane: false,
      },
    ],
    separateFromRoiEngine: true,
    cannotInfluenceControlPlane: true,
  },

  // --------------------------------------------------------------------
  // 2. CONNECTIVITY FEE (mandatory)
  // --------------------------------------------------------------------
  {
    feeTypeId: "CONNECTIVITY_FEE",
    name: "Connectivity Fee",
    description:
      "Fee for connectivity between the bank's internal systems and the MITHQAL control-plane perimeter " +
      "(per v25.3.6 J3 CONTROL_PLANE_CORE) — covers API gateway access, mutual TLS certificate lifecycle, " +
      "message-queue subscription (per v25.3.12 R1 bank-facing document set), and message-throughput entitlement. " +
      "Does NOT influence MTQ issuance authorization, reserve, risk, or finality decisions (per FEE_INDEPENDENCE_RULE).",
    optional: false,
    pricingUnitSummary: "Per-environment entitlement unit (structure defined; value PENDING)",
    repeatableRevenueDefault: "PENDING_DETERMINATION",
    stages: [
      {
        stage: "PRICING_UNIT",
        unit: "Per environment (production / non-production) × throughput tier (messages/sec).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed connectivity order form per W1 §6 technical schedule — must be SIGNED before unit is contractually fixed.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "QUOTED_PRICE",
        unit: "USD per environment per month — quoted against tier.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued quote document with tier reference + throughput entitlement.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "NEGOTIATED_PRICE",
        unit: "USD per environment per month — agreed after negotiation.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Negotiation record + agreed term-sheet item (per W1 §7).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "CONTRACTED_PRICE",
        unit: "USD per environment per month — fixed in executed MSA + connectivity order form.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Executed MSA (per W1 §2) + executed connectivity order form (per W1 §6).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "INVOICED_PRICE",
        unit: "USD per environment per month — per invoice schedule (in-arrears or in-advance per contract).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued invoice referencing active connectivity entitlement.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "COLLECTED_PRICE",
        unit: "USD per environment per month — funds received against invoice.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Bank payment confirmation; recorded in evidence fabric (per N2).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "REPEATABLE_REVENUE_STATUS",
        unit: "Recurring fixed (monthly) + variable tier upgrades.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Per-environment entitlement. Repeatable-revenue default = RECURRING_FIXED (pending commercial determination).",
        mayInfluenceControlPlane: false,
      },
    ],
    separateFromRoiEngine: true,
    cannotInfluenceControlPlane: true,
  },

  // --------------------------------------------------------------------
  // 3. SETTLEMENT FEE (mandatory)
  // --------------------------------------------------------------------
  {
    feeTypeId: "SETTLEMENT_FEE",
    name: "Settlement Fee",
    description:
      "Fee for settlement-coordination services across MTQ settlement obligations (per v25.3.9 O1 obligation registry) — " +
      "covers finality-coordination workflow (per v25.3.8 N1 F0-F7), trust-domain orchestration (per v25.3.7 M2 domains A/B/C), " +
      "and reconciliation-evidence handling (per v25.3.9 O2). Charged per settlement obligation or per period; " +
      "does NOT influence MTQ issuance authorization or finality-stage progression (per FEE_INDEPENDENCE_RULE).",
    optional: false,
    pricingUnitSummary: "Per-settlement-obligation or per-period unit (structure defined; value PENDING)",
    repeatableRevenueDefault: "PENDING_DETERMINATION",
    stages: [
      {
        stage: "PRICING_UNIT",
        unit: "Per settlement obligation (count) or per period (monthly) — expressed as basis-points on settlement notional OR USD flat per obligation.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed settlement-services order form per W1 §6 — must be SIGNED before unit is contractually fixed.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "QUOTED_PRICE",
        unit: "bps per annum on settlement notional OR USD per obligation — quoted against expected volume.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued quote document with volume band reference.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "NEGOTIATED_PRICE",
        unit: "bps or USD per obligation — agreed after negotiation.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Negotiation record + agreed term-sheet item (per W1 §7).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "CONTRACTED_PRICE",
        unit: "bps or USD per obligation — fixed in executed MSA + settlement order form.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Executed MSA (per W1 §2) + executed settlement order form (per W1 §6).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "INVOICED_PRICE",
        unit: "USD per period — calculated from contracted bps × settled notional OR USD per obligation count.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Issued invoice with settlement-obligation count and/or aggregate notional (per O1 obligation registry).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "COLLECTED_PRICE",
        unit: "USD per period — funds received against invoice.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Bank payment confirmation; recorded in evidence fabric (per N2). Does NOT advance finality stage (per FEE_INDEPENDENCE_RULE).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "REPEATABLE_REVENUE_STATUS",
        unit: "Recurring variable (per-obligation or per-period bps/USD).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Per settlement obligation. Repeatable-revenue default = RECURRING_VARIABLE (pending commercial determination).",
        mayInfluenceControlPlane: false,
      },
    ],
    separateFromRoiEngine: true,
    cannotInfluenceControlPlane: true,
  },

  // --------------------------------------------------------------------
  // 4. RECONCILIATION / EVIDENCE FEE (mandatory)
  // --------------------------------------------------------------------
  {
    feeTypeId: "RECONCILIATION_EVIDENCE_FEE",
    name: "Reconciliation / Evidence Fee",
    description:
      "Fee for the Institutional Evidence Fabric (per v25.3.8 N2 — 15-field EvidencePackage + SHA-256 commitments) and " +
      "reconciliation tolerance policies (per v25.3.9 O2 — LEDGER_TO_LEDGER / BANK_ATTESTATION / CUSTODY_QUANTITY / " +
      "MARKET_VALUATION / FX_VALUATION / STRESSED_VALUATION). Covers evidence ingestion, attestation verification, " +
      "reconciliation-run execution, and audit-trail retention. Does NOT influence finality decisions (per FEE_INDEPENDENCE_RULE).",
    optional: false,
    pricingUnitSummary: "Per-evidence-package or per-reconciliation-run unit (structure defined; value PENDING)",
    repeatableRevenueDefault: "PENDING_DETERMINATION",
    stages: [
      {
        stage: "PRICING_UNIT",
        unit: "Per evidence package (count) or per reconciliation run (count) — expressed as USD per package OR USD per run.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed evidence-services order form per W1 §6 — must be SIGNED before unit is contractually fixed.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "QUOTED_PRICE",
        unit: "USD per package or per run — quoted against expected volume.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued quote document with volume band reference.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "NEGOTIATED_PRICE",
        unit: "USD per package or per run — agreed after negotiation.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Negotiation record + agreed term-sheet item (per W1 §7).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "CONTRACTED_PRICE",
        unit: "USD per package or per run — fixed in executed MSA + evidence-services order form.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Executed MSA (per W1 §2) + executed evidence-services order form (per W1 §6).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "INVOICED_PRICE",
        unit: "USD per period — calculated from contracted unit price × package/run count.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Issued invoice with package/run count (per N2 evidence fabric and O2 reconciliation policies).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "COLLECTED_PRICE",
        unit: "USD per period — funds received against invoice.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Bank payment confirmation; recorded in evidence fabric (per N2). Does NOT influence finality decisions (per FEE_INDEPENDENCE_RULE).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "REPEATABLE_REVENUE_STATUS",
        unit: "Recurring variable (per-package / per-run).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Per evidence package / reconciliation run. Repeatable-revenue default = RECURRING_VARIABLE (pending commercial determination).",
        mayInfluenceControlPlane: false,
      },
    ],
    separateFromRoiEngine: true,
    cannotInfluenceControlPlane: true,
  },

  // --------------------------------------------------------------------
  // 5. ENTERPRISE INTEGRATION FEE (mandatory)
  // --------------------------------------------------------------------
  {
    feeTypeId: "ENTERPRISE_INTEGRATION_FEE",
    name: "Enterprise Integration Fee",
    description:
      "Fee for enterprise-grade integrations beyond standard connectivity — covers custom adapter development for bank " +
      "core-banking systems, treasury management systems, SWIFT/ISO 20022 gateways (per v25.3.19 X2 competitive compatibility — " +
      "MITHQAL may ingest SWIFT message references; not a prerequisite for viability), ERP integrations, and bespoke " +
      "data-residency / jurisdictional configurations (per v25.3.4 jurisdiction-engine). Does NOT influence MTQ issuance, " +
      "reserve, risk, or finality decisions (per FEE_INDEPENDENCE_RULE).",
    optional: false,
    pricingUnitSummary: "Per-integration-deliverable unit (structure defined; value PENDING)",
    repeatableRevenueDefault: "PENDING_DETERMINATION",
    stages: [
      {
        stage: "PRICING_UNIT",
        unit: "Per integration deliverable — scope expressed in adapter/spec count + integration complexity tier.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed integration SOW per W1 §3 — must be SIGNED before unit is contractually fixed.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "QUOTED_PRICE",
        unit: "USD flat per integration deliverable — quoted against scope + complexity tier.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued quote document with deliverable list + complexity tier reference.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "NEGOTIATED_PRICE",
        unit: "USD flat per integration deliverable — agreed after negotiation.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Negotiation record + agreed term-sheet item (per W1 §7).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "CONTRACTED_PRICE",
        unit: "USD flat per integration deliverable — fixed in executed MSA + integration SOW.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Executed MSA (per W1 §2) + executed integration SOW (per W1 §3).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "INVOICED_PRICE",
        unit: "USD flat per integration deliverable — per invoice schedule (milestone-based).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued invoice referencing executed integration SOW milestone acceptance.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "COLLECTED_PRICE",
        unit: "USD flat per integration deliverable — funds received against invoice.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Bank payment confirmation; recorded in evidence fabric (per N2).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "REPEATABLE_REVENUE_STATUS",
        unit: "One-time per deliverable; recurring maintenance optional.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Per integration deliverable. Repeatable-revenue default = ONE_TIME (pending commercial determination).",
        mayInfluenceControlPlane: false,
      },
    ],
    separateFromRoiEngine: true,
    cannotInfluenceControlPlane: true,
  },

  // --------------------------------------------------------------------
  // 6. SUPPORT / SERVICE FEE (mandatory)
  // --------------------------------------------------------------------
  {
    feeTypeId: "SUPPORT_SERVICE_FEE",
    name: "Support / Service Fee",
    description:
      "Fee for ongoing operational support — covers incident-response SLA (per W1 §4 SLA section), " +
      "business-continuity participation (per v25.3.13 S1 SettlementContinuityFabric — MITHQAL coordinates, " +
      "does NOT adjudicate continuity events), technical support tier, change-management, and operational reporting. " +
      "Does NOT influence risk decisions or finality decisions (per FEE_INDEPENDENCE_RULE).",
    optional: false,
    pricingUnitSummary: "Per-period support-tier unit (structure defined; value PENDING)",
    repeatableRevenueDefault: "PENDING_DETERMINATION",
    stages: [
      {
        stage: "PRICING_UNIT",
        unit: "Per period (monthly/annual) × support tier (basic / standard / premium / enterprise).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed support order form per W1 §6 — must be SIGNED before unit is contractually fixed.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "QUOTED_PRICE",
        unit: "USD per period — quoted against support tier.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued quote document with support tier reference + SLA summary (per W1 §4).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "NEGOTIATED_PRICE",
        unit: "USD per period — agreed after negotiation.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Negotiation record + agreed term-sheet item (per W1 §7).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "CONTRACTED_PRICE",
        unit: "USD per period — fixed in executed MSA + support order form.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Executed MSA (per W1 §2) + executed support order form (per W1 §6) + executed SLA (per W1 §4).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "INVOICED_PRICE",
        unit: "USD per period — per invoice schedule (in-advance or in-arrears per contract).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued invoice referencing active support entitlement.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "COLLECTED_PRICE",
        unit: "USD per period — funds received against invoice.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Bank payment confirmation; recorded in evidence fabric (per N2). Does NOT influence risk decisions (per FEE_INDEPENDENCE_RULE).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "REPEATABLE_REVENUE_STATUS",
        unit: "Recurring fixed (per-period support entitlement).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Per-period support entitlement. Repeatable-revenue default = RECURRING_FIXED (pending commercial determination).",
        mayInfluenceControlPlane: false,
      },
    ],
    separateFromRoiEngine: true,
    cannotInfluenceControlPlane: true,
  },

  // --------------------------------------------------------------------
  // 7. OPTIONAL INSTITUTIONAL SERVICES (optional — per directive)
  // --------------------------------------------------------------------
  {
    feeTypeId: "OPTIONAL_INSTITUTIONAL_SERVICES",
    name: "Optional Institutional Services",
    description:
      "Optional fee for discretionary institutional services beyond the mandatory 6 fee types — covers custom analytics " +
      "(per v25.3.10 P1 Corridor Pain Index bespoke scoring), bespoke regulatory replay scenarios (per v25.3.12 R2 " +
      "RegulatoryReplayEngine — READ-ONLY), executive briefings, and advisory engagements. Per directive this fee is " +
      "OPTIONAL — banks may contract the 6 mandatory fee types without contracting this 7th. Does NOT influence any " +
      "control-plane decision (per FEE_INDEPENDENCE_RULE).",
    optional: true,
    pricingUnitSummary: "Per-service-engagement unit (structure defined; value PENDING)",
    repeatableRevenueDefault: "PENDING_DETERMINATION",
    stages: [
      {
        stage: "PRICING_UNIT",
        unit: "Per service engagement — scope expressed in deliverable count + engagement duration (weeks).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed optional-services SOW per W1 §3 — must be SIGNED before unit is contractually fixed. Optional: bank may decline without affecting other 6 fee types.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "QUOTED_PRICE",
        unit: "USD flat per engagement OR USD per deliverable — quoted against scope.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued quote document with deliverable list + duration reference.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "NEGOTIATED_PRICE",
        unit: "USD flat or per deliverable — agreed after negotiation.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Negotiation record + agreed term-sheet item (per W1 §7).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "CONTRACTED_PRICE",
        unit: "USD flat or per deliverable — fixed in executed optional-services SOW.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Executed MSA (per W1 §2) + executed optional-services SOW (per W1 §3). Optional — bank may contract without this SOW.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "INVOICED_PRICE",
        unit: "USD flat or per deliverable — per invoice schedule.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Issued invoice referencing executed optional-services SOW milestone acceptance.",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "COLLECTED_PRICE",
        unit: "USD flat or per deliverable — funds received against invoice.",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence: "Bank payment confirmation; recorded in evidence fabric (per N2).",
        mayInfluenceControlPlane: false,
      },
      {
        stage: "REPEATABLE_REVENUE_STATUS",
        unit: "One-time per engagement (recurring advisory optional).",
        value: "PENDING",
        status: "PENDING",
        requiredEvidence:
          "Per optional-services engagement. Repeatable-revenue default = ONE_TIME (pending commercial determination).",
        mayInfluenceControlPlane: false,
      },
    ],
    separateFromRoiEngine: true,
    cannotInfluenceControlPlane: true,
  },
];

// ============================================================================
// RUNTIME INVARIANTS (verified at module load — fail-fast if any directive
// is violated). These guard against accidental edits that would re-introduce
// an illustrative price or a control-plane influence path.
// ============================================================================

function assertAllPricesPending(): void {
  for (const feeType of FEE_TYPES) {
    if (feeType.stages.length !== 7) {
      throw new Error(
        `[institutional-pricing-architecture] Fee type ${feeType.feeTypeId} has ${feeType.stages.length} stages; expected 7 per directive.`,
      );
    }
    for (const stage of feeType.stages) {
      if (stage.value !== "PENDING") {
        throw new Error(
          `[institutional-pricing-architecture] NO_ILLUSTRATIVE_AS_CURRENT_RULE violation at ` +
            `${feeType.feeTypeId}.${stage.stage}: value === '${stage.value}' (expected 'PENDING'). ` +
            `Per PROMPT 35: 'No illustrative price may appear as current commercial pricing.'`,
        );
      }
      if (stage.status !== "PENDING") {
        throw new Error(
          `[institutional-pricing-architecture] NO_ILLUSTRATIVE_AS_CURRENT_RULE violation at ` +
            `${feeType.feeTypeId}.${stage.stage}: status === '${stage.status}' (expected 'PENDING').`,
        );
      }
      if (stage.mayInfluenceControlPlane !== false) {
        throw new Error(
          `[institutional-pricing-architecture] FEE_INDEPENDENCE_RULE violation at ` +
            `${feeType.feeTypeId}.${stage.stage}: mayInfluenceControlPlane !== false.`,
        );
      }
    }
    if (feeType.repeatableRevenueDefault !== "PENDING_DETERMINATION") {
      throw new Error(
        `[institutional-pricing-architecture] NO_ILLUSTRATIVE_AS_CURRENT_RULE violation at ` +
          `${feeType.feeTypeId}.repeatableRevenueDefault: '${feeType.repeatableRevenueDefault}' (expected 'PENDING_DETERMINATION').`,
      );
    }
    if (feeType.separateFromRoiEngine !== true) {
      throw new Error(
        `[institutional-pricing-architecture] FEE_INDEPENDENCE_RULE violation at ` +
          `${feeType.feeTypeId}: separateFromRoiEngine !== true. ` +
          `Per v25.3.11 Q1 bank-value-model: pricing is SEPARATE from the ROI engine.`,
      );
    }
    if (feeType.cannotInfluenceControlPlane !== true) {
      throw new Error(
        `[institutional-pricing-architecture] FEE_INDEPENDENCE_RULE violation at ` +
          `${feeType.feeTypeId}: cannotInfluenceControlPlane !== true.`,
      );
    }
  }
}

function assertFeeTypeCount(): void {
  if (FEE_TYPES.length !== 7) {
    throw new Error(
      `[institutional-pricing-architecture] Fee type count = ${FEE_TYPES.length}; expected 7 per directive.`,
    );
  }
  const expectedIds: FeeTypeId[] = [
    "IMPLEMENTATION_FEE",
    "CONNECTIVITY_FEE",
    "SETTLEMENT_FEE",
    "RECONCILIATION_EVIDENCE_FEE",
    "ENTERPRISE_INTEGRATION_FEE",
    "SUPPORT_SERVICE_FEE",
    "OPTIONAL_INSTITUTIONAL_SERVICES",
  ];
  for (let i = 0; i < expectedIds.length; i++) {
    if (FEE_TYPES[i].feeTypeId !== expectedIds[i]) {
      throw new Error(
        `[institutional-pricing-architecture] Fee type at index ${i} is ${FEE_TYPES[i].feeTypeId}; expected ${expectedIds[i]}.`,
      );
    }
  }
  const optionalCount = FEE_TYPES.filter((f) => f.optional).length;
  if (optionalCount !== 1) {
    throw new Error(
      `[institutional-pricing-architecture] Optional fee type count = ${optionalCount}; expected exactly 1 (OPTIONAL_INSTITUTIONAL_SERVICES).`,
    );
  }
  if (FEE_TYPES[6].optional !== true || FEE_TYPES[6].feeTypeId !== "OPTIONAL_INSTITUTIONAL_SERVICES") {
    throw new Error(
      `[institutional-pricing-architecture] Fee type #7 must be OPTIONAL_INSTITUTIONAL_SERVICES with optional = true.`,
    );
  }
}

// Validate on module load (fail-fast at runtime + import time)
assertFeeTypeCount();
assertAllPricesPending();

// ============================================================================
// HELPERS
// ============================================================================

export function getFeeType(id: FeeTypeId): FeeTypeDefinition | undefined {
  return FEE_TYPES.find((f) => f.feeTypeId === id);
}

export function getPriceStage(
  feeTypeId: FeeTypeId,
  stage: PriceStage,
): PriceStageRecord | undefined {
  const feeType = getFeeType(feeTypeId);
  if (!feeType) return undefined;
  return feeType.stages.find((s) => s.stage === stage);
}

export function getOptionalFeeTypes(): FeeTypeDefinition[] {
  return FEE_TYPES.filter((f) => f.optional);
}

export function getMandatoryFeeTypes(): FeeTypeDefinition[] {
  return FEE_TYPES.filter((f) => !f.optional);
}

// ============================================================================
// STATUS EXPORTS
// ============================================================================

export const PRICING_ARCHITECTURE_STATUS = "ACTIVE";
export const PRICING_ARCHITECTURE_VERSION = "v25.3.20-Y1-1.0";
export const PRICING_ARCHITECTURE_SOURCE =
  "src/lib/institutional-pricing-architecture.ts";
export const FEE_TYPE_COUNT = FEE_TYPES.length; // 7
export const PRICE_STAGE_COUNT_PER_FEE_TYPE = PRICE_STAGE_COUNT; // 7
export const TOTAL_PRICE_STAGE_RECORDS = FEE_TYPES.length * PRICE_STAGE_COUNT; // 49

// Honest-state summary — verified at runtime (not magic numbers)
export const PRICING_ARCHITECTURE_HONEST_STATE = {
  feeTypeCount: FEE_TYPE_COUNT,
  priceStageCountPerFeeType: PRICE_STAGE_COUNT_PER_FEE_TYPE,
  totalPriceStageRecords: TOTAL_PRICE_STAGE_RECORDS,
  allValuesPending: FEE_TYPES.every((f) =>
    f.stages.every((s) => s.value === "PENDING"),
  ),
  allStatusesPending: FEE_TYPES.every((f) =>
    f.stages.every((s) => s.status === "PENDING"),
  ),
  allRepeatableRevenuePending: FEE_TYPES.every(
    (f) => f.repeatableRevenueDefault === "PENDING_DETERMINATION",
  ),
  allCannotInfluenceControlPlane: FEE_TYPES.every(
    (f) => f.cannotInfluenceControlPlane === true,
  ),
  allMayNotInfluenceControlPlane: FEE_TYPES.every((f) =>
    f.stages.every((s) => s.mayInfluenceControlPlane === false),
  ),
  allSeparateFromRoiEngine: FEE_TYPES.every(
    (f) => f.separateFromRoiEngine === true,
  ),
  quotedPriceCount: 0,
  negotiatedPriceCount: 0,
  contractedPriceCount: 0,
  invoicedPriceCount: 0,
  collectedPriceCount: 0,
  optionalFeeTypeCount: getOptionalFeeTypes().length, // 1
  mandatoryFeeTypeCount: getMandatoryFeeTypes().length, // 6
  feeIndependenceRuleEnforced: true,
  noIllustrativeAsCurrentRuleEnforced: true,
  honestStatement:
    "All 7 fee types × 7 price stages × 1 value field = 49 PENDING values. All 7 repeatable-revenue defaults = PENDING_DETERMINATION. " +
    "0 quoted prices. 0 negotiated prices. 0 contracted prices. 0 invoiced prices. 0 collected prices. " +
    "No commercial pricing has been set with any bank.",
} as const;

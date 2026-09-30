// src/lib/mtq-redemption-value-consistency.ts
//
// MITHQAL v25.3.21 — CANONICAL MTQ REDEMPTION / VALUE CONSISTENCY
// (single source of truth for MTQ economic structure + redemption/value
//  semantics; eliminates the hidden contradiction where PAR implies one
//  value while redemption produces another)
//
// Per PROMPT 43 (verbatim):
//   "Resolve the full economic relationship between: PAR, MTQ denomination,
//    market/conversion value, redemption value, eligible backing, haircuts,
//    and reserve composition.
//    There must be exactly one canonical explanation of whether MTQ is:
//    a denomination/reference unit; a fixed-value settlement claim; a
//    variable-value redeemable claim; or another legally defined structure.
//    Do not leave a hidden contradiction where: PAR implies one value,
//    while redemption produces another value.
//    For any redemption mechanism based on a basket, haircut, FX conversion
//    or market valuation: define the exact calculation, pricing timestamp,
//    valuation source, haircut application, rounding, settlement currency,
//    and legal obligation.
//    Do not describe MTQ as 'not pegged' while other sections economically
//    imply a guaranteed fixed-dollar redemption.
//    Until external legal/accounting validation exists, mark the final
//    legal/economic classification: PENDING_EXTERNAL_VALIDATION."
//
// CHANGE REQUEST: CR-2026-019 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.21
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - Resolves the PAR/redemption/value relationship in ONE canonical place
//   - Does NOT introduce a hidden contradiction between PAR and redemption
//   - Does NOT claim fixed-dollar redemption while describing MTQ as "not pegged"
//   - Final legal/economic classification = PENDING_EXTERNAL_VALIDATION
//     (per directive — no external legal/accounting validation exists yet)
//
// Cross-references prior canonical modules (READ-ONLY, no code-level modification):
//   - v25.3.2 K2 (MTQ economic definition — canonical MTQ description:
//     "permissioned, institutional, closed-loop settlement unit")
//   - v25.3.2 K3 (reserve coverage logic — 9 risk buffer factors)
//   - v25.3.5 PAR definition (PAR = 1.00 accounting/denomination reference ONLY;
//     NOT a USD peg, NOT a market price, NOT a redemption guarantee)
//   - v25.3.6 K4 (reserve domains — Settlement Liquidity vs Strategic Resilience
//     + 3 anti-double-counting rules: goldNotSettlementBacking,
//     emergencyCapacityNotDoubleCounted, noCommingling)
//   - v25.3.6 K5 (Pilot 1 config — gold=0%, digital=0%)
//   - v25.3.8 N1 (canonical finality model F0-F7)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)
//   - v25.3.9 O2 (6 reconciliation tolerance policies — incl. FX_VALUATION=20bps)
//   - v25.3.14 T2 (Architecture Freeze — MTQ_DEFINITION frozen schema)
//   - v25.3.16 U1 (Accounting/Prudential/Tax Framework — 10 classification
//     areas, ALL PENDING_EXTERNAL_VALIDATION)
//   - v25.3.16 U2 (PBC Legal Enforceability — 14 fields + MITHQAL_VERIFICATION_RULE)

import { MTQ_ECONOMIC_DEFINITION } from "@/lib/mtq-economic-definition";

// ============================================================================
// TYPES
// ============================================================================

// The four candidate legal/economic structures per directive
export type MTQStructureCandidate =
  | "DENOMINATION_REFERENCE_UNIT"
  | "FIXED_VALUE_SETTLEMENT_CLAIM"
  | "VARIABLE_VALUE_REDEEMABLE_CLAIM"
  | "OTHER_LEGALLY_DEFINED_STRUCTURE"
  | "PENDING_EXTERNAL_VALIDATION";

// Reserve composition asset class (per v25.3.4 CONTROL_PLANE_CORE — 7 asset types)
export type ReserveAssetClass =
  | "BANK_MONEY"
  | "CENTRAL_BANK_MONEY"
  | "RTGS"
  | "TOKENIZED_DEPOSITS"
  | "WHOLESALE_CBDC"
  | "MTQ"
  | "OTHER_LEGALLY_RECOGNIZED"
  | "GOLD"
  | "DIGITAL_GOLD";

// Reserve domain (per v25.3.6 K4 — two-domain architecture)
export type ReserveDomain =
  | "SETTLEMENT_LIQUIDITY"
  | "STRATEGIC_RESILIENCE";

// Pricing source for redemption valuation (per O2 reconciliation tolerance
// policies — MARKET_VALUATION=50bps / FX_VALUATION=20bps)
export type PricingSource =
  | "INDEPENDENT_MARKET_DATA"
  | "CENTRAL_BANK_REFERENCE_RATE"
  | "INDEPENDENT_AUDITOR_ATTESTED"
  | "DESIGN_TIME_ILLUSTRATIVE";

// Settlement currency for redemption proceeds
export type SettlementCurrency = "USD" | "EUR" | "AED" | "CNY" | "XAU";

export interface RedemptionMechanismSpec {
  // The exact calculation formula (per directive)
  calculation: string;
  // The pricing timestamp (per directive — when the price is sampled)
  pricingTimestamp: string;
  // The valuation source (per directive — where the price comes from)
  valuationSource: PricingSource;
  // The haircut applied (per directive — in basis points)
  haircutBps: number;
  // How the haircut is applied (per directive)
  haircutApplication: string;
  // The rounding convention (per directive — e.g., round-half-up to 2 decimals)
  rounding: string;
  // The settlement currency (per directive)
  settlementCurrency: SettlementCurrency;
  // The legal obligation (per directive — what the issuer is contractually
  // obligated to deliver on redemption)
  legalObligation: string;
  // Whether this mechanism is currently active or PENDING (honest)
  status: "DESIGN_TIME" | "PENDING_EXTERNAL_VALIDATION" | "ACTIVE";
}

// ============================================================================
// CRITICAL RULE (per directive — verbatim)
// ============================================================================

export const NO_HIDDEN_CONTRADICTION_RULE = {
  ruleId: "NO_HIDDEN_CONTRADICTION_RULE",
  rule:
    "Per PROMPT 43: Do not leave a hidden contradiction where PAR implies " +
    "one value while redemption produces another value. Do not describe MTQ " +
    "as 'not pegged' while other sections economically imply a guaranteed " +
    "fixed-dollar redemption.",
  description:
    "PAR is an accounting/denomination reference (per v25.3.5 K2 canonical " +
    "MTQ economic definition). PAR = 1.00 is used for liability calculation " +
    "(L = S × PAR where S = MTQ supply). PAR is NOT a USD peg, NOT a market " +
    "price, and NOT a redemption guarantee. Redemption, where it occurs, " +
    "is computed by an explicit mechanism (basket / haircut / FX conversion / " +
    "market valuation) — NOT by PAR. This rule requires that every " +
    "redemption-value reference in the codebase resolves to the SAME " +
    "canonical mechanism defined in this module. Any section that implies " +
    "PAR = fixed-dollar redemption is a CONTRADICTION and must be removed.",
  whatItForbids: [
    "Implies that PAR = 1.00 means a redemption value of $1.00 USD",
    "Implies that PAR fixes the redemption proceeds in any fiat currency",
    "Describes MTQ as 'not pegged' in one section while another section implies a guaranteed fixed-dollar redemption",
    "Computes redemption value as max(market_value, par) — a hidden floor that recreates a peg",
    "Computes redemption value as par * adjustment_factor without defining the adjustment mechanism explicitly",
    "Treats PAR as a settlement guarantee (PAR is a denomination convention, not a guarantee)",
    "Describes PAR as a 'stablecoin peg' or 'USD peg' (USD-peg language is forbidden per K-directive)",
  ],
  whatItPermits: [
    "Uses PAR = 1.00 as the accounting/denomination reference for liability calculation (L = S × PAR)",
    "Uses PAR as a unit-of-account in the ledger (e.g., 100 MTQ = 100 units at PAR for ledger purposes)",
    "Defines redemption value via an explicit mechanism (basket / haircut / FX conversion / market valuation) — independent of PAR",
    "Describes MTQ as 'not pegged' PROVIDED no other section implies fixed-dollar redemption",
    "Carries forward the v25.3.2 K2 canonical description: 'permissioned, institutional, closed-loop settlement unit'",
  ],
  enforcement:
    "Runtime invariants (assertParIsNotPeg, " +
    "assertNoHiddenFixedDollarRedemption, assertOneCanonicalExplanation) " +
    "fail fast at module load if any contradiction is detected. The " +
    "canonical explanation in MTQ_REDEMPTION_VALUE_CONSISTENCY is the SINGLE " +
    "source of truth — any inline MTQ redemption/value description elsewhere " +
    "is a CONTRADICTION per the contradiction scanner (src/lib/contradiction-scan.ts).",
} as const;

// ============================================================================
// ONE CANONICAL ECONOMIC CLASSIFICATION (per directive)
// ============================================================================

// Per directive: "There must be exactly one canonical explanation of whether
// MTQ is: a denomination/reference unit; a fixed-value settlement claim; a
// variable-value redeemable claim; or another legally defined structure."
//
// Per directive: "Until external legal/accounting validation exists, mark
// the final legal/economic classification: PENDING_EXTERNAL_VALIDATION."
//
// HONEST STATE: Until external legal opinion + independent accounting opinion
// are obtained, MITHQAL does NOT commit to any of the four candidate
// structures. The canonical classification is PENDING_EXTERNAL_VALIDATION.

export const CANONICAL_MTQ_CLASSIFICATION = {
  // The single canonical classification (per directive)
  // PENDING_EXTERNAL_VALIDATION — no external legal/accounting validation yet
  canonicalClassification: "PENDING_EXTERNAL_VALIDATION" as MTQStructureCandidate,

  // The four candidate structures (per directive) — all candidates are
  // PENDING external legal/accounting opinion. None is currently claimed.
  candidates: {
    DENOMINATION_REFERENCE_UNIT: {
      description:
        "MTQ is a denomination/reference unit used for accounting and ledger " +
        "purposes (L = S × PAR where PAR = 1.00). Redemption, if any, occurs " +
        "via an explicit independent mechanism, not via PAR.",
      currentlyClaimed: false,
      pendingExternal: true,
    },
    FIXED_VALUE_SETTLEMENT_CLAIM: {
      description:
        "MTQ is a fixed-value settlement claim redeemable at a defined " +
        "fixed amount (e.g., $1.00 USD per MTQ). This structure would " +
        "constitute a peg and is INCOMPATIBLE with the K-directive " +
        "description of MTQ as 'not pegged'.",
      currentlyClaimed: false,
      pendingExternal: true,
      noteOnIncompatibility:
        "Claiming FIXED_VALUE_SETTLEMENT_CLAIM would contradict the K-directive " +
        "'USD-peg language is forbidden' rule. This candidate is documented for " +
        "completeness but cannot be the canonical classification unless the " +
        "K-directive is itself amended through the v25.3.15 Architecture Freeze " +
        "7-step change process.",
    },
    VARIABLE_VALUE_REDEEMABLE_CLAIM: {
      description:
        "MTQ is a variable-value redeemable claim where redemption proceeds " +
        "are computed by an explicit mechanism (basket / haircut / FX " +
        "conversion / market valuation) at the pricing timestamp. The " +
        "redemption value is NOT fixed and is NOT equal to PAR.",
      currentlyClaimed: false,
      pendingExternal: true,
    },
    OTHER_LEGALLY_DEFINED_STRUCTURE: {
      description:
        "MTQ is another legally defined structure (e.g., payment token, " +
        "stored-value instrument, commodity-backed unit) that does not fit " +
        "the three candidates above. The exact structure requires external " +
        "legal classification.",
      currentlyClaimed: false,
      pendingExternal: true,
    },
  },

  // The canonical explanation (per directive: "exactly one canonical explanation")
  canonicalExplanation:
    "MTQ is a permissioned, institutional, closed-loop settlement unit " +
    "(per v25.3.2 K2 canonical MTQ economic definition). MTQ's denomination " +
    "is recorded at PAR = 1.00 for accounting and ledger purposes only " +
    "(liability L = S × PAR where S = MTQ supply). PAR is NOT a USD peg, " +
    "NOT a market price, and NOT a redemption guarantee. The redemption " +
    "value of MTQ (if a redemption mechanism is contractually offered) is " +
    "computed by an explicit mechanism defined in REDEMPTION_MECHANISM: " +
    "backing-asset valuation at a defined pricing timestamp, FX-converted " +
    "to the settlement currency, haircut applied per the haircut schedule, " +
    "rounded per the rounding convention, settled in the declared settlement " +
    "currency. The redemption value is independent of PAR — PAR does NOT " +
    "imply any particular redemption value. Until external legal opinion + " +
    "independent accounting opinion are obtained, the final legal/economic " +
    "classification of MTQ (denomination/reference unit vs fixed-value " +
    "settlement claim vs variable-value redeemable claim vs other legally " +
    "defined structure) is PENDING_EXTERNAL_VALIDATION. MITHQAL does NOT " +
    "claim fixed-dollar redemption, does NOT claim a USD peg, and does NOT " +
    "describe MTQ as 'not pegged' in a way that implies a hidden " +
    "fixed-dollar floor elsewhere.",

  // Why this is the canonical classification (honest rationale)
  rationale:
    "Per v25.3.2 K-directive: MTQ is 'permissioned, institutional, " +
    "closed-loop settlement unit' and 'USD-peg language is forbidden'. " +
    "Per v25.3.5: PAR = 1.00 is an accounting/denomination reference ONLY " +
    "(NOT a USD peg, NOT a market price, NOT a redemption guarantee). " +
    "These two canonical definitions TOGETHER imply: MTQ is NOT a " +
    "fixed-value settlement claim (that would be a peg, contradicting " +
    "K-directive). MTQ may be a denomination/reference unit (with PAR " +
    "serving as the accounting convention) AND/OR a variable-value redeemable " +
    "claim (with redemption via an explicit basket/haircut/FX mechanism). " +
    "Per PROMPT 43: 'Until external legal/accounting validation exists, " +
    "mark the final legal/economic classification: " +
    "PENDING_EXTERNAL_VALIDATION.' MITHQAL has NOT obtained an external " +
    "legal opinion on MTQ's classification nor an independent accounting " +
    "opinion. Therefore the canonical classification is " +
    "PENDING_EXTERNAL_VALIDATION — none of the four candidates is currently " +
    "claimed. The canonical explanation above is honest about what is " +
    "established (denomination at PAR, redemption mechanism spec) and " +
    "what is pending (the final legal structure).",
} as const;

// ============================================================================
// PAR — canonical definition (extends v25.3.5 K2)
// ============================================================================

export const PAR_DEFINITION = {
  value: 1.0,
  description: MTQ_ECONOMIC_DEFINITION.parDefinition.description,
  whatPARis: [
    "PAR = 1.00 is the accounting/denomination reference for liability calculation",
    "PAR is used in the formula L = S × PAR where S = MTQ supply and L = total liabilities",
    "PAR is a denomination convention that may be superseded by a future jurisdiction-specific legal opinion",
  ],
  whatPARisNot: [
    ...MTQ_ECONOMIC_DEFINITION.parDefinition.isNot,
    "PAR is NOT a fixed-dollar redemption value",
    "PAR is NOT a floor on redemption proceeds",
    "PAR is NOT a ceiling on redemption proceeds",
    "PAR is NOT used in the redemption value calculation (redemption uses the explicit mechanism in REDEMPTION_MECHANISM)",
  ],
  liabilityFormula: "L = S × PAR (where S = MTQ supply, L = total liabilities at PAR)",
  redemptionFormula:
    "Redemption value is computed by REDEMPTION_MECHANISM — independent of PAR",
  // The CRITICAL assertion: PAR is NOT a redemption value
  parNotRedemptionValue:
    "PAR is the accounting/denomination reference. Redemption value is " +
    "computed by REDEMPTION_MECHANISM. These are DIFFERENT values. PAR " +
    "does NOT imply any particular redemption value. This eliminates the " +
    "hidden contradiction where PAR would imply one value while redemption " +
    "produces another.",
} as const;

// ============================================================================
// MTQ DENOMINATION
// ============================================================================

export const MTQ_DENOMINATION = {
  unit: "MTQ",
  parValue: 1.0,
  description:
    "MTQ is the denomination unit of the MITHQAL closed-loop institutional " +
    "settlement network. The denomination is recorded at PAR = 1.00 for " +
    "ledger/accounting purposes (L = S × PAR). The denomination is NOT a " +
    "price, NOT a peg, and NOT a redemption value.",
  availableTo: "Authorized institutional participants only (banks, custodians, qualified institutions)",
  // Per v25.3.2 K-directive: "MTQ is NOT retail money, MTQ is NOT a public cryptocurrency"
  retailAccess: false,
  // Per v25.3.2 K-directive: "MTQ is NOT an investment asset, NOT a speculative asset"
  retailInvestmentAccess: false,
  // Per v25.3.6 K5: Pilot 1 config has gold=0% digital=0% (Pilot 1 has no gold-backed MTQ in circulation)
  pilot1BackingActive: false,
} as const;

// ============================================================================
// MARKET / CONVERSION VALUE (per directive)
// ============================================================================

export const MARKET_CONVERSION_VALUE = {
  // Per directive: "market/conversion value"
  description:
    "The market/conversion value of MTQ is the price at which MTQ may be " +
    "observed trading in a permitted market or the conversion rate at which " +
    "MTQ may be converted into another asset inside the closed-loop network. " +
    "The market/conversion value is NOT fixed, NOT guaranteed, NOT equal " +
    "to PAR, and NOT a redemption value.",
  status: "DESIGN_TIME",
  honestNote:
    "MTQ does NOT trade on a public market (it is a closed-loop institutional " +
    "settlement unit per v25.3.2 K-directive). Therefore, there is no " +
    "observable public market price. Any 'conversion value' is determined " +
    "by the redemption mechanism (if contractually offered) or by bilateral " +
    "agreement between institutional participants inside the closed loop. " +
    "MITHQAL does NOT publish a market price for MTQ. Any price reference " +
    "is computed from the redemption mechanism and is ILLUSTRATIVE / " +
    "DESIGN-TIME until external accounting validation.",
  whatItIs: [
    "A reference value computed from the redemption mechanism at the pricing timestamp",
    "A bilateral conversion rate inside the closed-loop institutional network",
  ],
  whatItIsNot: [
    "A public market price (MTQ does not trade publicly)",
    "A guaranteed value (the redemption mechanism uses market valuation, haircut, and FX conversion)",
    "Equal to PAR (PAR is the accounting reference, not a price)",
    "Equal to the redemption value (redemption value is computed net of haircut and FX conversion)",
  ],
} as const;

// ============================================================================
// REDEMPTION VALUE (per directive)
// ============================================================================

export const REDEMPTION_VALUE = {
  description:
    "The redemption value of MTQ is the proceeds (in the settlement " +
    "currency) that the holder receives when redeeming MTQ through the " +
    "contractual redemption mechanism (if any is offered). The redemption " +
    "value is computed by REDEMPTION_MECHANISM — NOT by PAR, NOT by a " +
    "guaranteed fixed amount.",
  status: "DESIGN_TIME",
  honestNote:
    "The redemption value is computed by REDEMPTION_MECHANISM (below). " +
    "It is NOT a fixed dollar amount. It is NOT guaranteed. It is NOT " +
    "equal to PAR. It depends on: backing-asset valuation at the pricing " +
    "timestamp, FX conversion, haircut, rounding, and settlement currency. " +
    "Until the redemption mechanism is contractually offered by the issuing " +
    "entity AND an independent auditor has attested the calculation inputs, " +
    "the redemption value is DESIGN-TIME / PENDING_EXTERNAL_VALIDATION.",
  whatItIs: [
    "The proceeds paid to the holder on redemption, computed by REDEMPTION_MECHANISM",
    "Denominated in the settlement currency (USD/EUR/AED/CNY/XAU per the mechanism)",
  ],
  whatItIsNot: [
    "A fixed dollar amount (the mechanism uses market valuation + haircut + FX conversion)",
    "Equal to PAR (PAR is the accounting reference; redemption uses the explicit mechanism)",
    "Guaranteed (the mechanism depends on market valuation which fluctuates)",
    "A floor on value (no floor exists — the haircut can reduce proceeds below the gross asset value)",
    "A ceiling on value (no ceiling exists — the gross asset value can rise above any reference)",
  ],
} as const;

// ============================================================================
// ELIGIBLE BACKING (per directive + v25.3.6 K4 reserve domains)
// ============================================================================

export interface EligibleBackingAsset {
  assetClass: ReserveAssetClass;
  description: string;
  // Which reserve domain (per v25.3.6 K4 — Settlement Liquidity vs Strategic Resilience)
  reserveDomain: ReserveDomain;
  // Per v25.3.6 K4 anti-double-counting rules
  goldNotSettlementBacking: boolean;
  emergencyCapacityNotDoubleCounted: boolean;
  noCommingling: boolean;
  // Per v25.3.6 K5 Pilot 1 config
  activeInPilot1: boolean;
  status: "DESIGN_TIME" | "PENDING_EXTERNAL_VALIDATION" | "ACTIVE";
}

export const ELIGIBLE_BACKING: EligibleBackingAsset[] = [
  {
    assetClass: "BANK_MONEY",
    description:
      "Commercial bank money held at a qualifying bank in the institutional " +
      "network. Eligible backing when held by an authorized bank and " +
      "attested via AvailableBackingCertificate (per BM-05).",
    reserveDomain: "SETTLEMENT_LIQUIDITY",
    goldNotSettlementBacking: true,
    emergencyCapacityNotDoubleCounted: true,
    noCommingling: true,
    activeInPilot1: true,
    status: "DESIGN_TIME",
  },
  {
    assetClass: "CENTRAL_BANK_MONEY",
    description:
      "Central bank money held at a central bank (e.g., Federal Reserve, ECB, " +
      "PBoC). Eligible backing when held in a segregated account for MITHQAL " +
      "purposes.",
    reserveDomain: "SETTLEMENT_LIQUIDITY",
    goldNotSettlementBacking: true,
    emergencyCapacityNotDoubleCounted: true,
    noCommingling: true,
    activeInPilot1: false,
    status: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    assetClass: "RTGS",
    description:
      "Real-time gross settlement balances at a central bank. Eligible when " +
      "held in a segregated RTGS account for MITHQAL purposes.",
    reserveDomain: "SETTLEMENT_LIQUIDITY",
    goldNotSettlementBacking: true,
    emergencyCapacityNotDoubleCounted: true,
    noCommingling: true,
    activeInPilot1: false,
    status: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    assetClass: "TOKENIZED_DEPOSITS",
    description:
      "Tokenized bank deposits issued by a qualifying bank on a permissioned " +
      "chain. Eligible when issued under a verified tokenization framework.",
    reserveDomain: "SETTLEMENT_LIQUIDITY",
    goldNotSettlementBacking: true,
    emergencyCapacityNotDoubleCounted: true,
    noCommingling: true,
    activeInPilot1: false,
    status: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    assetClass: "WHOLESALE_CBDC",
    description:
      "Wholesale central bank digital currency issued by a central bank. " +
      "Eligible when issued by a central bank that has authorized MITHQAL " +
      "participation.",
    reserveDomain: "SETTLEMENT_LIQUIDITY",
    goldNotSettlementBacking: true,
    emergencyCapacityNotDoubleCounted: true,
    noCommingling: true,
    activeInPilot1: false,
    status: "PENDING_EXTERNAL_VALIDATION",
  },
  {
    assetClass: "GOLD",
    description:
      "Allocated physical gold held at an independent custodian (per " +
      "Constitution v19.0 §22 — gold-anchored). Per v25.3.6 K4 " +
      "goldNotSettlementBacking rule: gold is in the Strategic Resilience " +
      "domain, NOT in Settlement Liquidity. Per v25.3.6 K5 Pilot 1 config: " +
      "gold=0% — no gold backing active in Pilot 1.",
    reserveDomain: "STRATEGIC_RESILIENCE",
    goldNotSettlementBacking: true,
    emergencyCapacityNotDoubleCounted: true,
    noCommingling: true,
    activeInPilot1: false,
    status: "DESIGN_TIME",
  },
  {
    assetClass: "DIGITAL_GOLD",
    description:
      "Tokenized allocated gold issued by a qualified custodian on a " +
      "permissioned chain. Per v25.3.6 K4: digital gold follows the same " +
      "domain rule as physical gold (Strategic Resilience, not Settlement " +
      "Liquidity). Per v25.3.6 K5 Pilot 1 config: digital=0% — no digital " +
      "gold backing active in Pilot 1.",
    reserveDomain: "STRATEGIC_RESILIENCE",
    goldNotSettlementBacking: true,
    emergencyCapacityNotDoubleCounted: true,
    noCommingling: true,
    activeInPilot1: false,
    status: "DESIGN_TIME",
  },
];

// ============================================================================
// HAIRCUTS (per directive)
// ============================================================================

export interface HaircutScheduleEntry {
  assetClass: ReserveAssetClass;
  // The haircut in basis points (applied to gross asset value)
  haircutBps: number;
  // Per v25.3.9 O2 reconciliation tolerance — MARKET_VALUATION=50bps,
  // FX_VALUATION=20bps, STRESSED_VALUATION=200bps. Haircuts are distinct
  // from reconciliation tolerances — haircuts reduce the redemption proceeds;
  // tolerances are the acceptable variance between two independent measurements.
  rationale: string;
  status: "DESIGN_TIME" | "PENDING_EXTERNAL_VALIDATION" | "ACTIVE";
}

export const HAIRCUT_SCHEDULE: HaircutScheduleEntry[] = [
  {
    assetClass: "BANK_MONEY",
    haircutBps: 100,
    rationale:
      "Bank money haircut reflects counterparty credit risk on the holding " +
      "bank. DESIGN-TIME — bank-by-bank haircuts must be set per the bank's " +
      "credit standing (per v25.3.10 P1 Corridor Pain Index — credit rating " +
      "factor).",
    status: "DESIGN_TIME",
  },
  {
    assetClass: "CENTRAL_BANK_MONEY",
    haircutBps: 0,
    rationale:
      "Central bank money has zero credit risk; haircut is 0 bps in normal " +
      "conditions. DESIGN-TIME — haircut may be elevated during stress periods.",
    status: "DESIGN_TIME",
  },
  {
    assetClass: "RTGS",
    haircutBps: 0,
    rationale: "RTGS balances are central bank money; same rationale as CENTRAL_BANK_MONEY.",
    status: "DESIGN_TIME",
  },
  {
    assetClass: "TOKENIZED_DEPOSITS",
    haircutBps: 150,
    rationale:
      "Tokenized deposits carry the issuing bank's credit risk plus " +
      "blockchain/operational risk; haircut is elevated relative to bank " +
      "money. DESIGN-TIME — requires bank-by-bank calibration.",
    status: "DESIGN_TIME",
  },
  {
    assetClass: "WHOLESALE_CBDC",
    haircutBps: 0,
    rationale: "Wholesale CBDC is central bank liability; zero credit risk.",
    status: "DESIGN_TIME",
  },
  {
    assetClass: "GOLD",
    haircutBps: 300,
    rationale:
      "Physical gold carries price-volatility risk plus custody risk; " +
      "haircut reflects a conservative buffer. DESIGN-TIME — calibration " +
      "requires independent price-volatility analysis.",
    status: "DESIGN_TIME",
  },
  {
    assetClass: "DIGITAL_GOLD",
    haircutBps: 350,
    rationale:
      "Digital gold carries the same price-volatility risk as physical gold " +
      "plus tokenization-layer risk; haircut is elevated relative to physical " +
      "gold. DESIGN-TIME — calibration requires independent analysis.",
    status: "DESIGN_TIME",
  },
];

// ============================================================================
// RESERVE COMPOSITION (per directive + v25.3.6 K4 + K5 Pilot 1 config)
// ============================================================================

export const RESERVE_COMPOSITION = {
  // Per v25.3.6 K4 — two-domain architecture
  domains: {
    SETTLEMENT_LIQUIDITY: {
      description:
        "Assets backing the settlement function — bank money, central bank " +
        "money, RTGS, tokenized deposits, wholesale CBDC. Per v25.3.6 K4 " +
        "goldNotSettlementBacking rule: gold (physical or digital) is NOT " +
        "in Settlement Liquidity.",
      assetClasses: ["BANK_MONEY", "CENTRAL_BANK_MONEY", "RTGS", "TOKENIZED_DEPOSITS", "WHOLESALE_CBDC"] as ReserveAssetClass[],
    },
    STRATEGIC_RESILIENCE: {
      description:
        "Strategic resilience assets held as a non-double-counted buffer " +
        "per the v25.3.6 K4 emergencyCapacityNotDoubleCounted rule. Gold and " +
        "digital gold are in Strategic Resilience. Strategic Resilience " +
        "does NOT directly back MTQ redemption proceeds.",
      assetClasses: ["GOLD", "DIGITAL_GOLD"] as ReserveAssetClass[],
    },
  },
  // Per v25.3.6 K5 — Pilot 1 config
  pilot1Config: {
    goldPct: 0,
    digitalPct: 0,
    description:
      "Pilot 1 has gold=0% and digital=0% — no gold-backed MTQ in " +
      "circulation in Pilot 1. Pilot 1 is backed entirely by Settlement " +
      "Liquidity assets (bank money at qualifying banks).",
    status: "DESIGN_TIME",
  },
  // The composition MUST obey the 3 anti-double-counting rules per K4
  antiDoubleCountingRules: {
    goldNotSettlementBacking: true,
    emergencyCapacityNotDoubleCounted: true,
    noCommingling: true,
    description:
      "Per v25.3.6 K4 — gold does not back settlement liquidity; emergency " +
      "liquidity capacity is not double-counted between Settlement Liquidity " +
      "and Strategic Resilience; no commingling of MITHQAL backing assets " +
      "with operational or other-customer assets.",
  },
  // Honest state: no live reserves yet
  honestState: {
    compositionActive: false,
    description:
      "No live reserves have been constituted. Pilot 1 backing is " +
      "DESIGN-TIME. The first live reserves will be constituted when GATE-B3 " +
      "(ISSUANCE) and GATE-B4 (REDEMPTION) gates are passed per the v25.3.11 " +
      "Q2 pilot gate framework.",
    status: "DESIGN_TIME",
  },
} as const;

// ============================================================================
// REDEMPTION MECHANISM (per directive — exact calculation)
// ============================================================================

// Per directive: "For any redemption mechanism based on a basket, haircut, FX
// conversion or market valuation: define the exact calculation, pricing
// timestamp, valuation source, haircut application, rounding, settlement
// currency, and legal obligation."
//
// HONEST STATE: This is the canonical mechanism specification. The mechanism
// is NOT yet contractually offered by the issuing entity (Jozour, LLC or its
// successor). The mechanism is DESIGN-TIME / PENDING_EXTERNAL_VALIDATION.

export const REDEMPTION_MECHANISM: RedemptionMechanismSpec = {
  // The exact calculation (per directive)
  calculation:
    "redemptionValueUsd = SUM_over_backing_assets[" +
    "grossAssetValueUsd × (1 - haircutBps/10000) × FX_to_settlement_currency] " +
    "÷ totalOutstandingMTQSupply, then rounded per the rounding convention. " +
    "Step 1: For each eligible backing asset, take the gross asset value " +
    "denominated in its native currency (e.g., USD for bank money, XAU for " +
    "gold). Step 2: Apply the haircut per HAIRCUT_SCHEDULE for that asset " +
    "class. Step 3: FX-convert the haircut-adjusted value to the settlement " +
    "currency using the valuation source's rate at the pricing timestamp. " +
    "Step 4: Sum across all eligible backing assets. Step 5: Divide by the " +
    "total outstanding MTQ supply (S). Step 6: Round per the rounding " +
    "convention. NOTE: PAR is NOT used in this calculation. PAR is the " +
    "accounting/denomination reference, NOT a redemption value.",
  // The pricing timestamp (per directive)
  pricingTimestamp:
    "T-0 = the moment the redemption request is submitted. The pricing " +
    "timestamp is the valuation-source snapshot taken at the start of the " +
    "settlement window in which the redemption is processed (the 'pricing " +
    "cut-off'). The exact cut-off time is set by the redemption administrator " +
    "(Jozour, LLC or its successor) and is PENDING publication.",
  // The valuation source (per directive)
  valuationSource: "INDEPENDENT_MARKET_DATA",
  // The haircut applied (per directive — average across eligible assets)
  haircutBps: 100, // DESIGN-TIME weighted average; the per-asset haircuts are in HAIRCUT_SCHEDULE
  // How the haircut is applied (per directive)
  haircutApplication:
    "The haircut is applied PER ASSET CLASS to the gross asset value of " +
    "that asset BEFORE FX conversion. The per-asset haircuts are defined in " +
    "HAIRCUT_SCHEDULE (BANK_MONEY=100bps, CENTRAL_BANK_MONEY=0bps, RTGS=0bps, " +
    "TOKENIZED_DEPOSITS=150bps, WHOLESALE_CBDC=0bps, GOLD=300bps, " +
    "DIGITAL_GOLD=350bps). The aggregate haircut is the weighted average " +
    "across the actual backing composition at the pricing timestamp. " +
    "Haircuts are NOT applied to PAR (PAR is not used in the calculation). " +
    "Haircuts are NOT applied to FX rates.",
  // The rounding convention (per directive)
  rounding:
    "Round-half-up to 2 decimal places in the settlement currency. For " +
    "settlement in XAU (gold troy ounces), round-half-up to 4 decimal places. " +
    "Interim computations retain full floating-point precision; rounding is " +
    "applied only at the final step before settlement. Per v25.3.9 O2 " +
    "reconciliation tolerance policy FX_VALUATION=20bps — the rounded value " +
    "must be within 20bps of an independent FX-valuation check.",
  // The settlement currency (per directive)
  settlementCurrency: "USD",
  // The legal obligation (per directive)
  legalObligation:
    "The issuing entity (Jozour, LLC or its successor) is contractually " +
    "obligigated, upon a valid redemption request from an authorized " +
    "institutional holder, to deliver the computed redemption value in the " +
    "settlement currency. The exact contractual obligation is defined in the " +
    "Bank Contracting Package (per v25.3.18 W1 — 17 sections ALL DRAFT). " +
    "Until the Bank Contracting Package is executed with at least one bank " +
    "and an external legal opinion is obtained (per v25.3.2 I3 external legal " +
    "evidence registry — INDEPENDENT_AUDIT_REPORT is PENDING_VALIDATION), " +
    "the redemption mechanism is NOT contractually enforceable and is " +
    "DESIGN-TIME / PENDING_EXTERNAL_VALIDATION. The legal obligation is " +
    "defined for clarity but is NOT yet binding.",
  status: "DESIGN_TIME",
};

// ============================================================================
// CONSISTENCY ASSERTIONS (per directive — eliminate hidden contradiction)
// ============================================================================

export const CONSISTENCY_ASSERTIONS = [
  {
    assertionId: "PAR_NOT_PEG",
    assertion: "PAR is NOT a USD peg",
    evidence:
      "PAR_DEFINITION.whatPARisNot explicitly enumerates: 'PAR is NOT a USD peg', " +
      "'PAR is NOT a stablecoin peg'. MTQ_ECONOMIC_DEFINITION (v25.3.2 K2) " +
      "isStatement says 'Gold-anchored' (gold-anchored ≠ USD-pegged). " +
      "MTQ_ECONOMIC_DEFINITION isNotStatement says 'MTQ is NOT pegged to USD " +
      "or any fiat currency (USD-peg language is forbidden)'.",
    status: "ACTIVE",
  },
  {
    assertionId: "PAR_NOT_REDEMPTION_VALUE",
    assertion: "PAR is NOT the redemption value",
    evidence:
      "PAR_DEFINITION.parNotRedemptionValue states: 'PAR is the " +
      "accounting/denomination reference. Redemption value is computed by " +
      "REDEMPTION_MECHANISM. These are DIFFERENT values. PAR does NOT imply " +
      "any particular redemption value.' REDEMPTION_MECHANISM.calculation " +
      "explicitly notes: 'PAR is NOT used in this calculation. PAR is the " +
      "accounting/denomination reference, NOT a redemption value.'",
    status: "ACTIVE",
  },
  {
    assertionId: "NOT_PEGGED_NOT_IMPLYING_FIXED_DOLLAR",
    assertion:
      "MTQ is described as 'not pegged' AND no other section implies a guaranteed fixed-dollar redemption",
    evidence:
      "CANONICAL_MTQ_CLASSIFICATION.canonicalExplanation states: 'MITHQAL " +
      "does NOT claim fixed-dollar redemption, does NOT claim a USD peg, " +
      "and does NOT describe MTQ as \"not pegged\" in a way that implies a " +
      "hidden fixed-dollar floor elsewhere.' REDEMPTION_VALUE.whatItIsNot " +
      "explicitly enumerates: 'A fixed dollar amount', 'Equal to PAR'.",
    status: "ACTIVE",
  },
  {
    assertionId: "ONE_CANONICAL_EXPLANATION",
    assertion:
      "There is exactly one canonical explanation of MTQ's economic structure",
    evidence:
      "CANONICAL_MTQ_CLASSIFICATION.canonicalClassification = " +
      "PENDING_EXTERNAL_VALIDATION. The canonical explanation is in " +
      "CANONICAL_MTQ_CLASSIFICATION.canonicalExplanation (single field). " +
      "Any inline MTQ redemption/value description elsewhere is a " +
      "CONTRADICTION per the contradiction scanner.",
    status: "ACTIVE",
  },
  {
    assertionId: "PENDING_EXTERNAL_VALIDATION",
    assertion:
      "Final legal/economic classification is PENDING_EXTERNAL_VALIDATION",
    evidence:
      "CANONICAL_MTQ_CLASSIFICATION.canonicalClassification = " +
      "'PENDING_EXTERNAL_VALIDATION'. All 4 candidates have " +
      "currentlyClaimed=false and pendingExternal=true. Per PROMPT 43: " +
      "'Until external legal/accounting validation exists, mark the final " +
      "legal/economic classification: PENDING_EXTERNAL_VALIDATION.' " +
      "External legal evidence registry (src/lib/external-legal-evidence.ts) " +
      "shows AAOIFI Sharia attestation + Independent Audit Report are both " +
      "PENDING_VALIDATION.",
    status: "ACTIVE",
  },
  {
    assertionId: "REDEMPTION_MECHANISM_FULLY_SPECIFIED",
    assertion:
      "Redemption mechanism has exact calculation, pricing timestamp, valuation source, haircut application, rounding, settlement currency, and legal obligation",
    evidence:
      "REDEMPTION_MECHANISM has all 7 required fields per directive: " +
      "calculation, pricingTimestamp, valuationSource, haircutBps, " +
      "haircutApplication, rounding, settlementCurrency, legalObligation. " +
      "Status = DESIGN_TIME (honest — mechanism not yet contractually offered).",
    status: "ACTIVE",
  },
] as const;

// ============================================================================
// RUNTIME INVARIANTS (fail-fast at module load)
// ============================================================================

function assertParIsNotPeg(): void {
  const parNotList = PAR_DEFINITION.whatPARisNot;
  const hasNotPeg = parNotList.some((s) =>
    s.toLowerCase().includes("peg"),
  );
  if (!hasNotPeg) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: PAR_DEFINITION.whatPARisNot must explicitly state PAR is NOT a peg",
    );
  }
  if (PAR_DEFINITION.value !== 1.0) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: PAR_DEFINITION.value must be 1.0",
    );
  }
}

function assertNoHiddenFixedDollarRedemption(): void {
  // Per directive: "Do not describe MTQ as 'not pegged' while other sections
  // economically imply a guaranteed fixed-dollar redemption."
  const redemptionValueNotList = REDEMPTION_VALUE.whatItIsNot;
  const hasNoFixedDollar = redemptionValueNotList.some((s) =>
    s.toLowerCase().includes("fixed dollar"),
  );
  if (!hasNoFixedDollar) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: REDEMPTION_VALUE.whatItIsNot must explicitly reject 'A fixed dollar amount'",
    );
  }
  const hasParNotRedemption = PAR_DEFINITION.parNotRedemptionValue.length > 0;
  if (!hasParNotRedemption) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: PAR_DEFINITION.parNotRedemptionValue must be non-empty",
    );
  }
}

function assertOneCanonicalExplanation(): void {
  // Per directive: "There must be exactly one canonical explanation"
  if (typeof CANONICAL_MTQ_CLASSIFICATION.canonicalExplanation !== "string") {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: canonicalExplanation must be a single string",
    );
  }
  if (CANONICAL_MTQ_CLASSIFICATION.canonicalExplanation.length < 100) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: canonicalExplanation too short",
    );
  }
  // Verify the canonical classification is PENDING_EXTERNAL_VALIDATION
  if (
    CANONICAL_MTQ_CLASSIFICATION.canonicalClassification !==
    "PENDING_EXTERNAL_VALIDATION"
  ) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: canonicalClassification MUST be PENDING_EXTERNAL_VALIDATION per directive",
    );
  }
  // Verify all 4 candidates exist
  const candidateKeys = Object.keys(
    CANONICAL_MTQ_CLASSIFICATION.candidates,
  );
  const expectedCandidates = [
    "DENOMINATION_REFERENCE_UNIT",
    "FIXED_VALUE_SETTLEMENT_CLAIM",
    "VARIABLE_VALUE_REDEEMABLE_CLAIM",
    "OTHER_LEGALLY_DEFINED_STRUCTURE",
  ];
  for (const k of expectedCandidates) {
    if (!candidateKeys.includes(k)) {
      throw new Error(
        `MTQ Redemption/Value Consistency FATAL: missing candidate ${k}`,
      );
    }
  }
  // Verify no candidate is currently claimed (honest)
  for (const k of expectedCandidates) {
    const candidate = (CANONICAL_MTQ_CLASSIFICATION.candidates as Record<string, { currentlyClaimed: boolean }>)[k];
    if (candidate.currentlyClaimed) {
      throw new Error(
        `MTQ Redemption/Value Consistency FATAL: candidate ${k} must have currentlyClaimed=false (honest state per directive)`,
      );
    }
  }
}

function assertRedemptionMechanismFullySpecified(): void {
  const mech = REDEMPTION_MECHANISM;
  const requiredFields: (keyof RedemptionMechanismSpec)[] = [
    "calculation",
    "pricingTimestamp",
    "valuationSource",
    "haircutBps",
    "haircutApplication",
    "rounding",
    "settlementCurrency",
    "legalObligation",
  ];
  for (const f of requiredFields) {
    if (mech[f] === undefined || mech[f] === null) {
      throw new Error(
        `MTQ Redemption/Value Consistency FATAL: REDEMPTION_MECHANISM missing field ${f}`,
      );
    }
  }
  // Verify calculation explicitly notes that PAR is NOT used
  if (!mech.calculation.includes("PAR is NOT used")) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: REDEMPTION_MECHANISM.calculation must explicitly state PAR is NOT used",
    );
  }
  // Verify status is honest (DESIGN_TIME or PENDING_EXTERNAL_VALIDATION, NOT ACTIVE)
  if (mech.status === "ACTIVE") {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: REDEMPTION_MECHANISM.status MUST NOT be ACTIVE (no external validation obtained yet)",
    );
  }
}

function assertEligibleBackingObeysReserveDomains(): void {
  // Per v25.3.6 K4 — gold (physical + digital) must be in STRATEGIC_RESILIENCE,
  // NOT in SETTLEMENT_LIQUIDITY.
  for (const asset of ELIGIBLE_BACKING) {
    if (asset.assetClass === "GOLD" || asset.assetClass === "DIGITAL_GOLD") {
      if (asset.reserveDomain !== "STRATEGIC_RESILIENCE") {
        throw new Error(
          `MTQ Redemption/Value Consistency FATAL: ${asset.assetClass} must be in STRATEGIC_RESILIENCE per v25.3.6 K4 goldNotSettlementBacking rule`,
        );
      }
      if (!asset.goldNotSettlementBacking) {
        throw new Error(
          `MTQ Redemption/Value Consistency FATAL: ${asset.assetClass} must have goldNotSettlementBacking=true per K4`,
        );
      }
    } else {
      if (asset.reserveDomain !== "SETTLEMENT_LIQUIDITY") {
        throw new Error(
          `MTQ Redemption/Value Consistency FATAL: ${asset.assetClass} must be in SETTLEMENT_LIQUIDITY per K4`,
        );
      }
    }
    if (!asset.noCommingling) {
      throw new Error(
        `MTQ Redemption/Value Consistency FATAL: ${asset.assetClass} must have noCommingling=true per K4`,
      );
    }
    if (!asset.emergencyCapacityNotDoubleCounted) {
      throw new Error(
        `MTQ Redemption/Value Consistency FATAL: ${asset.assetClass} must have emergencyCapacityNotDoubleCounted=true per K4`,
      );
    }
  }
}

function assertPilot1ConfigHonest(): void {
  // Per v25.3.6 K5 — Pilot 1 config has gold=0% digital=0%
  if (RESERVE_COMPOSITION.pilot1Config.goldPct !== 0) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: Pilot 1 goldPct MUST be 0 per v25.3.6 K5",
    );
  }
  if (RESERVE_COMPOSITION.pilot1Config.digitalPct !== 0) {
    throw new Error(
      "MTQ Redemption/Value Consistency FATAL: Pilot 1 digitalPct MUST be 0 per v25.3.6 K5",
    );
  }
}

function assertAllEligibleBackingHonestState(): void {
  // Honest state — no eligible backing is currently ACTIVE
  for (const asset of ELIGIBLE_BACKING) {
    if (asset.status === "ACTIVE" && !asset.activeInPilot1) {
      throw new Error(
        `MTQ Redemption/Value Consistency FATAL: ${asset.assetClass} has status=ACTIVE but activeInPilot1=false (inconsistent honest state)`,
      );
    }
  }
}

assertParIsNotPeg();
assertNoHiddenFixedDollarRedemption();
assertOneCanonicalExplanation();
assertRedemptionMechanismFullySpecified();
assertEligibleBackingObeysReserveDomains();
assertPilot1ConfigHonest();
assertAllEligibleBackingHonestState();

// ============================================================================
// MODULE METADATA (per v25.3.2 _meta envelope convention)
// ============================================================================

export const MTQ_REDEMPTION_VALUE_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" =
  "ACTIVE";
export const MTQ_REDEMPTION_VALUE_VERSION = "v25.3.21-P43-1.0";
export const MTQ_REDEMPTION_VALUE_SOURCE =
  "src/lib/mtq-redemption-value-consistency.ts";

export const MTQ_REDEMPTION_VALUE_HONEST_STATE = {
  canonicalClassificationPending: true,
  noCandidateCurrentlyClaimed: true,
  redemptionMechanismNotContractuallyOffered: true,
  noLiveReservesConstituted: true,
  noFixedDollarRedemptionClaimed: true,
  parNotPeg: true,
  parNotRedemptionValue: true,
  noHiddenContradictionRuleEnforced: true,
  allEligibleBackingDesignTime: true,
  honestNote:
    "Per PROMPT 43: ONE canonical explanation of MTQ's economic structure. " +
    "The canonical classification is PENDING_EXTERNAL_VALIDATION — none of " +
    "the 4 candidates is currently claimed. PAR = 1.00 is the accounting " +
    "reference ONLY; redemption value is computed by REDEMPTION_MECHANISM " +
    "(explicit calculation, pricing timestamp, valuation source, haircut " +
    "application, rounding, settlement currency, legal obligation). " +
    "PAR is NOT a peg. PAR is NOT the redemption value. No section " +
    "describes MTQ as 'not pegged' while implying a guaranteed " +
    "fixed-dollar redemption. All eligible backing is DESIGN-TIME. " +
    "Pilot 1 has gold=0% and digital=0% per v25.3.6 K5. No external " +
    "legal opinion or independent accounting opinion has been obtained yet.",
} as const;

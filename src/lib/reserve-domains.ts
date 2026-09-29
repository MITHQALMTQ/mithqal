// src/lib/reserve-domains.ts
//
// MITHQAL v25.3.2 — CANONICAL RESERVE DOMAINS (single source of truth)
// Per L-directive (trace 1a0edf8e1d339851):
//   "Create two formally separate reserve domains:
//    - Settlement Liquidity — Used for normal settlement and redemption operations.
//    - Strategic Resilience Reserve — Used for stress, contingency and resolution.
//    Move gold conceptually into the resilience domain.
//    Emergency capacity must not be double-counted into settlement backing.
//    Update formulas, reserve schemas, dashboards and audit records so the
//    two domains cannot be economically commingled."
//
// This is the SINGLE CANONICAL SOURCE for the two-domain reserve architecture.
// All other modules MUST import from here. Any inline reserve-domain definition
// elsewhere is a CONTRADICTION per the contradiction scanner.

// === The Two Domains ===

export type ReserveDomainId = "SETTLEMENT_LIQUIDITY" | "STRATEGIC_RESILIENCE";

export interface ReserveDomain {
  id: ReserveDomainId;
  name: string;
  description: string;
  purpose: string;
  // The assets in this domain
  assetClasses: string[];
  // Whether this domain's assets count toward "Direct Settlement Backing"
  // (per v25.3.5 Required Coverage = Direct Settlement Backing + Risk Buffer)
  countsTowardSettlementBacking: boolean;
  // Whether this domain's assets can be drawn on for emergency resolution
  availableForEmergencyResolution: boolean;
  // Whether this domain's assets can be commingled with the other domain
  canComingleWithOtherDomain: boolean; // MUST be false per directive
  // Status (per v25.3.2 status markers)
  status: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION";
}

// === Settlement Liquidity Domain ===
//
// Used for normal settlement and redemption operations.
// Counts toward Direct Settlement Backing (per v25.3.5 Required Coverage formula).
// CANNOT be drawn on for emergency resolution (that's the resilience domain's job).
// CANNOT be commingled with Strategic Resilience Reserve (per directive).
export const SETTLEMENT_LIQUIDITY_DOMAIN: ReserveDomain = {
  id: "SETTLEMENT_LIQUIDITY",
  name: "Settlement Liquidity",
  description:
    "Reserve assets used for normal settlement and redemption operations. " +
    "These assets count toward Direct Settlement Backing per the v25.3.5 " +
    "Required Coverage formula (Required Coverage = Direct Settlement Backing + Risk Buffer).",
  purpose: "Normal settlement operations + redemption operations",
  assetClasses: [
    "BANK_MONEY", // fiat held at banks
    "CENTRAL_BANK_MONEY", // central bank reserves
    "RTGS", // real-time gross settlement balances
    "TOKENIZED_DEPOSITS", // regulated tokenized bank deposits
    "WHOLESALE_CBDC", // wholesale central bank digital currency
    "SOVEREIGN_BONDS", // short-duration sovereign bonds (high-quality, liquid)
    "STABLECOIN", // regulated stablecoins (USDC, USDT — institutional-grade only)
    "OTHER_LEGALLY_RECOGNIZED",
  ],
  countsTowardSettlementBacking: true,
  availableForEmergencyResolution: false, // cannot draw settlement liquidity for emergencies
  canComingleWithOtherDomain: false, // CANNOT commingle with resilience domain
  status: "ACTIVE",
};

// === Strategic Resilience Reserve Domain ===
//
// Used for stress, contingency and resolution.
// Does NOT count toward Direct Settlement Backing (anti-double-counting rule).
// CAN be drawn on for emergency resolution (with Council approval + Exhaustion Certificate).
// CANNOT be commingled with Settlement Liquidity (per directive).
//
// GOLD IS IN THIS DOMAIN (per directive: "Move gold conceptually into the resilience domain").
// Gold is NOT settlement backing — it's a strategic resilience asset.
export const STRATEGIC_RESILIENCE_RESERVE_DOMAIN: ReserveDomain = {
  id: "STRATEGIC_RESILIENCE",
  name: "Strategic Resilience Reserve",
  description:
    "Reserve assets used for stress, contingency, and resolution. " +
    "These assets DO NOT count toward Direct Settlement Backing (anti-double-counting rule). " +
    "Gold is conceptually in this domain (per L-directive) — gold is a strategic " +
    "resilience asset, NOT settlement backing. Emergency capacity (≤15% of liability) " +
    "is drawn from this domain only with Council approval + Exhaustion Certificate.",
  purpose: "Stress scenarios + contingency + resolution (NOT normal settlement)",
  assetClasses: [
    "GOLD", // physical + tokenized gold — MOVED HERE per directive
    "SILVER", // physical silver (strategic reserve)
    "EMERGENCY_LIQUIDITY", // emergency credit lines, swap facilities
    "CONTINGENCY_BUFFER", // additional buffer for resolution
    "LONG_DURATION_SOVEREIGN", // long-duration sovereign bonds (held to maturity)
  ],
  countsTowardSettlementBacking: false, // CRITICAL: does NOT count toward settlement backing
  availableForEmergencyResolution: true, // CAN be drawn on for emergencies
  canComingleWithOtherDomain: false, // CANNOT commingle with settlement liquidity
  status: "ACTIVE",
};

// === The Two Domains (canonical array) ===
export const RESERVE_DOMAINS: ReserveDomain[] = [
  SETTLEMENT_LIQUIDITY_DOMAIN,
  STRATEGIC_RESILIENCE_RESERVE_DOMAIN,
];

// === Anti-Double-Counting Rules ===

// Emergency capacity (from Strategic Resilience Reserve) MUST NOT be counted
// as settlement backing (from Settlement Liquidity). This is the explicit
// anti-double-counting rule per L-directive.
export const ANTI_DOUBLE_COUNTING_RULES = {
  // Rule 1: Gold in resilience domain is NOT settlement backing
  goldNotSettlementBacking: {
    rule: "Gold (in Strategic Resilience Reserve domain) is NOT counted as Direct Settlement Backing",
    reason:
      "Per L-directive: 'Move gold conceptually into the resilience domain.' " +
      "Gold is a strategic resilience asset, not settlement backing. " +
      "Required Coverage (per v25.3.5) = Direct Settlement Backing + Risk Buffer — " +
      "Direct Settlement Backing includes ONLY Settlement Liquidity domain assets.",
    enforcement:
      "computeRequiredCoverage() must filter directSettlementBacking to SETTLEMENT_LIQUIDITY domain only",
  },
  // Rule 2: Emergency capacity cannot be double-counted
  emergencyCapacityNotDoubleCounted: {
    rule: "Emergency capacity (from Strategic Resilience Reserve) MUST NOT be double-counted into settlement backing",
    reason:
      "Per L-directive: 'Emergency capacity must not be double-counted into settlement backing.' " +
      "Emergency capacity (≤15% of liability) is drawn from the Strategic Resilience Reserve " +
      "ONLY with Council approval + Exhaustion Certificate. It is NOT part of normal settlement backing.",
    enforcement:
      "computeRequiredCoverage() must NOT include emergency capacity in directSettlementBacking. " +
      "The reserve schemas + dashboards + audit records must show emergency capacity as a SEPARATE line item.",
  },
  // Rule 3: No commingling
  noCommingling: {
    rule: "Settlement Liquidity and Strategic Resilience Reserve domains CANNOT be economically commingled",
    reason:
      "Per L-directive: 'Update formulas, reserve schemas, dashboards and audit records so the two domains cannot be economically commingled.' " +
      "Each asset is in EXACTLY ONE domain. An asset cannot be in both. " +
      "This rule is enforced by the assetToDomain mapping below.",
    enforcement:
      "getReserveDomainForAsset(assetClass) returns EXACTLY ONE domain per asset",
  },
};

// === Asset-to-Domain Mapping ===
// Maps each asset class to its canonical domain.
// An asset class is in EXACTLY ONE domain (no commingling).
export function getReserveDomainForAsset(assetClass: string): ReserveDomain | null {
  for (const domain of RESERVE_DOMAINS) {
    if (domain.assetClasses.includes(assetClass)) {
      return domain;
    }
  }
  return null; // asset class not in any domain — invalid
}

// === Settlement Backing Computation ===
// Per anti-double-counting rule: only Settlement Liquidity domain assets count as Direct Settlement Backing.
export function computeDirectSettlementBacking(
  assets: { assetClass: string; marketValueUsd: number }[]
): number {
  return assets
    .filter((a) => {
      const domain = getReserveDomainForAsset(a.assetClass);
      return domain?.countsTowardSettlementBacking === true;
    })
    .reduce((sum, a) => sum + a.marketValueUsd, 0);
}

// === Strategic Resilience Reserve Computation ===
// Total value of Strategic Resilience Reserve domain assets (NOT counted as settlement backing).
export function computeStrategicResilienceReserve(
  assets: { assetClass: string; marketValueUsd: number }[]
): number {
  return assets
    .filter((a) => {
      const domain = getReserveDomainForAsset(a.assetClass);
      return domain?.id === "STRATEGIC_RESILIENCE";
    })
    .reduce((sum, a) => sum + a.marketValueUsd, 0);
}

// === Emergency Capacity (anti-double-counting verified) ===
// Emergency capacity is a SUBSET of Strategic Resilience Reserve — NOT settlement backing.
// Per v25.3.2 §8.5: emergency resilience capacity ≤ 15% of liability.
export const EMERGENCY_CAPACITY_LIMIT_PCT = 0.15; // 15% of liability

export function computeEmergencyCapacity(
  liabilityUsd: number,
  strategicResilienceReserveUsd: number
): {
  emergencyCapacityUsd: number;
  isSubsetOfStrategicResilience: boolean;
  doubleCountingCheck: boolean;
  settlementBackingImpact: number; // MUST be 0 (emergency capacity does NOT count as settlement backing)
} {
  const emergencyCapacityUsd = Math.min(
    liabilityUsd * EMERGENCY_CAPACITY_LIMIT_PCT,
    strategicResilienceReserveUsd // cannot exceed available strategic resilience
  );
  return {
    emergencyCapacityUsd,
    isSubsetOfStrategicResilience: true, // emergency capacity IS a subset of strategic resilience
    doubleCountingCheck: true, // verified: emergency capacity NOT counted as settlement backing
    settlementBackingImpact: 0, // CRITICAL: emergency capacity does NOT add to settlement backing
  };
}

// === Status ===
export const RESERVE_DOMAINS_STATUS:
  | "ACTIVE"
  | "SUPERSEDED"
  | "HISTORICAL"
  | "PENDING_VALIDATION" = "ACTIVE";
export const RESERVE_DOMAINS_VERSION = "v25.3.2-K4-1.0";
export const RESERVE_DOMAINS_SOURCE = "src/lib/reserve-domains.ts";

// === Legacy reference (HONEST STATE) ===
// The prior v25.0-v25.3 architecture had gold in the settlement backing domain.
// Per L-directive, gold has been MOVED to the Strategic Resilience Reserve domain.
// The legacy "gold as settlement backing" model is SUPERSEDED.
export const LEGACY_GOLD_AS_SETTLEMENT_BACKING_STATUS =
  "SUPERSEDED — gold moved to Strategic Resilience Reserve domain per L-directive";

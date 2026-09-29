// src/lib/pilot-1-config.ts
//
// MITHQAL v25.3.2 — CANONICAL PILOT 1 CONFIGURATION (single source of truth)
// Per L-directive (trace 1a0edf8e1d339851):
//   "Change Pilot 1 configuration:
//    - gold settlement backing = 0%
//    - digital reserve backing = 0%
//    Do not delete those capabilities from the architecture.
//    Mark them as: AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION
//    Pilot 1 must use only legally and operationally supportable
//    institutional settlement assets.
//    Update all pilot documentation, reserve configuration, examples,
//    DMCE rules, tests and UI."
//
// This is the SINGLE CANONICAL SOURCE for Pilot 1 reserve configuration.
// All other modules MUST import from here. Any inline Pilot 1 reserve
// configuration (gold weight, digital weight, fiat weight, asset list)
// defined elsewhere is a CONTRADICTION per the contradiction scanner.
//
// Cross-reference:
//   - src/lib/reserve-domains.ts (Agent K4) — defines the two reserve
//     domains (Settlement Liquidity vs Strategic Resilience Reserve).
//     Pilot 1 chooses weights WITHIN that architecture: gold moves to
//     Strategic Resilience Reserve (weight 0% in Settlement Liquidity),
//     and stablecoin (digital reserve backing) is marked
//     AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION.
//   - src/lib/mtq-economic-definition.ts (Agent K2) — MTQ is a
//     permissioned wholesale settlement instrument; Pilot 1 config
//     defines WHICH settlement assets back MTQ issuance in Pilot 1.
//   - src/lib/reserve-coverage-logic.ts (Agent K3) — Required Coverage
//     = Direct Settlement Backing + Risk Buffer. Pilot 1's ACTIVE
//     assets are what counts as Direct Settlement Backing in Pilot 1.

// === Pilot 1 Reserve Configuration ===

export type Pilot1AssetStatus =
  | "ACTIVE"
  | "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION"
  | "SUPERSEDED";

export interface Pilot1AssetConfig {
  assetClass: string;
  weight: number; // 0.0 - 1.0
  status: Pilot1AssetStatus;
  reason: string;
}

export const PILOT_1_RESERVE_CONFIG: Pilot1AssetConfig[] = [
  // === ACTIVE settlement assets (legally + operationally supportable) ===
  // Total ACTIVE weight = 1.00 (100%)
  {
    assetClass: "BANK_MONEY",
    weight: 0.5, // 50% — primary settlement asset
    status: "ACTIVE",
    reason:
      "Bank money is the primary legally-recognized settlement asset. Pilot 1 uses 50% bank money for settlement liquidity.",
  },
  {
    assetClass: "CENTRAL_BANK_MONEY",
    weight: 0.2, // 20% — central bank reserves
    status: "ACTIVE",
    reason:
      "Central bank money is the highest-quality settlement asset. Pilot 1 uses 20% CB money for settlement liquidity.",
  },
  {
    assetClass: "SOVEREIGN_BONDS",
    weight: 0.15, // 15% — short-duration sovereign bonds
    status: "ACTIVE",
    reason:
      "Short-duration sovereign bonds (T-bills, etc.) are highly liquid + legally certain. Pilot 1 uses 15% sovereign bonds.",
  },
  {
    assetClass: "RTGS",
    weight: 0.1, // 10% — RTGS balances
    status: "ACTIVE",
    reason:
      "Real-time gross settlement balances at central banks. Pilot 1 uses 10% RTGS.",
  },
  {
    assetClass: "TOKENIZED_DEPOSITS",
    weight: 0.05, // 5% — regulated tokenized bank deposits
    status: "ACTIVE",
    reason:
      "Regulated tokenized deposits (e.g., JPM Coin, etc.) are legally recognized settlement assets. Pilot 1 uses 5%.",
  },
  // === AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION (NOT deleted per directive) ===
  // Total AVAILABLE_FOR_FUTURE weight = 0.00 (0%) — capability PRESERVED, NOT active
  {
    assetClass: "GOLD",
    weight: 0.0, // 0% — gold NOT used in Pilot 1 settlement backing
    status: "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION",
    reason:
      "Per L-directive: 'gold settlement backing = 0%'. Gold is moved to the " +
      "Strategic Resilience Reserve domain (per Agent K4 — see src/lib/reserve-domains.ts). " +
      "The gold-as-settlement-backing capability is NOT deleted — it is marked " +
      "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION. A future validated configuration " +
      "(with external legal evidence + custodian verification) may re-enable gold as " +
      "settlement backing.",
  },
  {
    assetClass: "STABLECOIN", // digital reserve backing
    weight: 0.0, // 0% — stablecoins NOT used in Pilot 1 settlement backing
    status: "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION",
    reason:
      "Per L-directive: 'digital reserve backing = 0%'. Stablecoins (USDC, USDT) " +
      "are NOT used as Pilot 1 settlement backing. The digital-reserve-backing " +
      "capability is NOT deleted — it is marked AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION. " +
      "A future validated configuration (with regulatory clarity + custodian " +
      "verification) may re-enable stablecoins as settlement backing.",
  },
];

// === Pilot 1 Configuration Summary ===
//
// ACTIVE assets total weight = 1.00 (100%) — Pilot 1 is fully backed by
//   legally + operationally supportable institutional settlement assets.
// AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION assets total weight = 0.00 (0%)
//   — capabilities PRESERVED (not deleted per L-directive), but NOT active in
//   Pilot 1. They are gated behind a future validated configuration.
export const PILOT_1_CONFIG_SUMMARY = {
  // Active settlement assets (100% total weight)
  activeSettlementAssets: PILOT_1_RESERVE_CONFIG.filter(
    (a) => a.status === "ACTIVE",
  ),
  activeSettlementAssetsTotalWeight: PILOT_1_RESERVE_CONFIG.filter(
    (a) => a.status === "ACTIVE",
  ).reduce((sum, a) => sum + a.weight, 0), // should be 1.00 (100%)

  // AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION (0% weight but capability preserved)
  futureValidatedCapabilities: PILOT_1_RESERVE_CONFIG.filter(
    (a) => a.status === "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION",
  ),
  futureValidatedCapabilitiesTotalWeight: PILOT_1_RESERVE_CONFIG.filter(
    (a) => a.status === "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION",
  ).reduce((sum, a) => sum + a.weight, 0), // should be 0.00 (0%)

  // Pilot 1 uses only legally + operationally supportable institutional settlement assets
  rule:
    "Pilot 1 must use only legally and operationally supportable institutional " +
    "settlement assets. Per L-directive, gold + digital reserve backing are set " +
    "to 0% in Pilot 1. The capabilities are NOT deleted — they are marked " +
    "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION.",

  // Source
  source: "src/lib/pilot-1-config.ts",
  version: "v25.3.2-K5-1.0",
  status: "ACTIVE" as const,
};

// === API ===

export function getPilot1ActiveAssets(): Pilot1AssetConfig[] {
  return PILOT_1_RESERVE_CONFIG.filter((a) => a.status === "ACTIVE");
}

export function getPilot1FutureValidatedCapabilities(): Pilot1AssetConfig[] {
  return PILOT_1_RESERVE_CONFIG.filter(
    (a) => a.status === "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION",
  );
}

export function getPilot1AssetWeight(assetClass: string): number {
  const config = PILOT_1_RESERVE_CONFIG.find((a) => a.assetClass === assetClass);
  return config?.weight ?? 0;
}

export function isPilot1AssetActive(assetClass: string): boolean {
  const config = PILOT_1_RESERVE_CONFIG.find((a) => a.assetClass === assetClass);
  return config?.status === "ACTIVE";
}

// === Module-level metadata ===
export const PILOT_1_CONFIG_STATUS: "ACTIVE" = "ACTIVE";
export const PILOT_1_CONFIG_VERSION = "v25.3.2-K5-1.0";
export const PILOT_1_CONFIG_SOURCE = "src/lib/pilot-1-config.ts";

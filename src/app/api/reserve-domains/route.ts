import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  RESERVE_DOMAINS,
  SETTLEMENT_LIQUIDITY_DOMAIN,
  STRATEGIC_RESILIENCE_RESERVE_DOMAIN,
  ANTI_DOUBLE_COUNTING_RULES,
  getReserveDomainForAsset,
  computeDirectSettlementBacking,
  computeStrategicResilienceReserve,
  computeEmergencyCapacity,
  EMERGENCY_CAPACITY_LIMIT_PCT,
  RESERVE_DOMAINS_STATUS,
  RESERVE_DOMAINS_VERSION,
  RESERVE_DOMAINS_SOURCE,
  LEGACY_GOLD_AS_SETTLEMENT_BACKING_STATUS,
} from "@/lib/reserve-domains";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("reserve-domains", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const includeComputation = url.searchParams.get("compute") === "true";
  const liabilityUsd = parseFloat(
    url.searchParams.get("liabilityUsd") || "54000000"
  );

  const response: Record<string, unknown> = {
    _meta: {
      activeModel: "v25.3.2",
      domainsSource: RESERVE_DOMAINS_SOURCE,
      domainsVersion: RESERVE_DOMAINS_VERSION,
      status: RESERVE_DOMAINS_STATUS,
      legacyGoldStatus: LEGACY_GOLD_AS_SETTLEMENT_BACKING_STATUS,
      overrideRule:
        "Two formally separate reserve domains. Gold moved to Strategic Resilience Reserve. Emergency capacity NOT double-counted as settlement backing.",
    },
    domains: RESERVE_DOMAINS,
    antiDoubleCountingRules: ANTI_DOUBLE_COUNTING_RULES,
    emergencyCapacityLimitPct: EMERGENCY_CAPACITY_LIMIT_PCT,
  };

  if (includeComputation) {
    // Example computation with sample assets (Pilot 1 config: gold=0%, digital=0%)
    // — see Agent K5's work for the Pilot 1 config
    const sampleAssets = [
      { assetClass: "BANK_MONEY", marketValueUsd: 30000000 }, // $30M bank money
      { assetClass: "CENTRAL_BANK_MONEY", marketValueUsd: 10000000 }, // $10M CB money
      { assetClass: "SOVEREIGN_BONDS", marketValueUsd: 15000000 }, // $15M sovereign bonds
      { assetClass: "STABLECOIN", marketValueUsd: 5000000 }, // $5M stablecoin
      // NOTE: Gold is NOT in settlement backing (it's in Strategic Resilience Reserve)
      { assetClass: "GOLD", marketValueUsd: 10000000 }, // $10M gold (resilience)
      { assetClass: "SILVER", marketValueUsd: 2000000 }, // $2M silver (resilience)
    ];

    const directSettlementBacking = computeDirectSettlementBacking(sampleAssets);
    const strategicResilienceReserve =
      computeStrategicResilienceReserve(sampleAssets);
    const emergencyCapacity = computeEmergencyCapacity(
      liabilityUsd,
      strategicResilienceReserve
    );

    (response as Record<string, unknown>).computation = {
      sampleAssets,
      directSettlementBacking, // $60M (BANK_MONEY + CB_MONEY + SOVEREIGN_BONDS + STABLECOIN)
      strategicResilienceReserve, // $12M (GOLD + SILVER)
      emergencyCapacity, // { emergencyCapacityUsd, isSubsetOfStrategicResilience, ... }
      liabilityUsd,
      settlementBackingCoverageRatio: directSettlementBacking / liabilityUsd,
      note: "Gold + silver are NOT counted in directSettlementBacking (per anti-double-counting rule). Emergency capacity is a subset of strategic resilience, NOT settlement backing.",
    };
  }

  // touch unused imports to keep them as documentation hooks
  void SETTLEMENT_LIQUIDITY_DOMAIN;
  void STRATEGIC_RESILIENCE_RESERVE_DOMAIN;
  void getReserveDomainForAsset;

  return NextResponse.json(response);
}

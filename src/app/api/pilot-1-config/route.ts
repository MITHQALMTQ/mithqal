import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  PILOT_1_RESERVE_CONFIG,
  PILOT_1_CONFIG_SUMMARY,
  PILOT_1_CONFIG_STATUS,
  PILOT_1_CONFIG_VERSION,
  PILOT_1_CONFIG_SOURCE,
  getPilot1ActiveAssets,
  getPilot1FutureValidatedCapabilities,
  getPilot1AssetWeight,
  isPilot1AssetActive,
} from "@/lib/pilot-1-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("pilot-1-config", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const assetClassFilter = url.searchParams.get("assetClass");

  // Optional: ?assetClass=GOLD to inspect a single asset class
  if (assetClassFilter) {
    const config = PILOT_1_RESERVE_CONFIG.find(
      (a) => a.assetClass === assetClassFilter.toUpperCase(),
    );
    if (!config) {
      return NextResponse.json(
        {
          error: `Unknown assetClass: ${assetClassFilter}`,
          knownAssetClasses: PILOT_1_RESERVE_CONFIG.map((a) => a.assetClass),
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        configSource: PILOT_1_CONFIG_SOURCE,
        configVersion: PILOT_1_CONFIG_VERSION,
        status: PILOT_1_CONFIG_STATUS,
        overrideRule:
          "Pilot 1 uses ONLY legally + operationally supportable institutional settlement assets. Gold + digital reserve backing are 0% (AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION, NOT deleted).",
      },
      asset: config,
      weight: getPilot1AssetWeight(config.assetClass),
      isActive: isPilot1AssetActive(config.assetClass),
    });
  }

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      configSource: PILOT_1_CONFIG_SOURCE,
      configVersion: PILOT_1_CONFIG_VERSION,
      status: PILOT_1_CONFIG_STATUS,
      overrideRule:
        "Pilot 1 uses ONLY legally + operationally supportable institutional settlement assets. Gold + digital reserve backing are 0% (AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION, NOT deleted).",
      lDirectiveTrace: "1a0edf8e1d339851",
      crossReferences: {
        reserveDomains: "src/lib/reserve-domains.ts (Agent K4) — two-domain architecture",
        mtqEconomicDefinition:
          "src/lib/mtq-economic-definition.ts (Agent K2) — MTQ economic identity",
        reserveCoverageLogic:
          "src/lib/reserve-coverage-logic.ts (Agent K3) — Required Coverage formula",
      },
    },
    config: PILOT_1_RESERVE_CONFIG,
    summary: {
      activeSettlementAssetsTotalWeight:
        PILOT_1_CONFIG_SUMMARY.activeSettlementAssetsTotalWeight,
      futureValidatedCapabilitiesTotalWeight:
        PILOT_1_CONFIG_SUMMARY.futureValidatedCapabilitiesTotalWeight,
      rule: PILOT_1_CONFIG_SUMMARY.rule,
      source: PILOT_1_CONFIG_SUMMARY.source,
      version: PILOT_1_CONFIG_SUMMARY.version,
      status: PILOT_1_CONFIG_SUMMARY.status,
    },
    activeAssets: getPilot1ActiveAssets(),
    futureValidatedCapabilities: getPilot1FutureValidatedCapabilities(),
    rule: PILOT_1_CONFIG_SUMMARY.rule,
  });
}

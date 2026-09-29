import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  DEFAULT_RISK_BUFFER_FACTORS,
  computeRequiredCoverage,
  computeRiskBufferFor130PercentStrategicTarget,
  RESERVE_COVERAGE_LOGIC_STATUS,
  RESERVE_COVERAGE_LOGIC_VERSION,
  RESERVE_COVERAGE_LOGIC_SOURCE,
  LEGACY_130_PERCENT_STATUS,
} from "@/lib/reserve-coverage-logic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("reserve-coverage", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const settlementObligationValue = parseFloat(
    url.searchParams.get("settlementObligationValue") || "1000000"
  );
  const settlementAssetType =
    url.searchParams.get("settlementAssetType") || "MTQ";
  const directSettlementBacking = parseFloat(
    url.searchParams.get("directSettlementBacking") || "1000000"
  );
  const use130StrategicTarget =
    url.searchParams.get("strategicTarget") === "130";

  const factors = use130StrategicTarget
    ? computeRiskBufferFor130PercentStrategicTarget()
    : DEFAULT_RISK_BUFFER_FACTORS;

  const result = computeRequiredCoverage({
    settlementObligationValue,
    settlementAssetType,
    directSettlementBacking,
    riskBufferFactors: factors,
  });

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      coverageSource: RESERVE_COVERAGE_LOGIC_SOURCE,
      coverageVersion: RESERVE_COVERAGE_LOGIC_VERSION,
      status: RESERVE_COVERAGE_LOGIC_STATUS,
      legacy130Status: LEGACY_130_PERCENT_STATUS,
      overrideRule:
        "Universal 130% requirement REMOVED per K-directive. 130% retained only as strategic policy target/example. Constitutional floor (100%) is the actual universal requirement.",
    },
    formula: result.formula,
    inputs: {
      settlementObligationValue,
      settlementAssetType,
      directSettlementBacking,
      strategicTarget: use130StrategicTarget
        ? "130% example configuration"
        : "default (configurable factors)",
    },
    result,
    configurableRiskBufferFactors: DEFAULT_RISK_BUFFER_FACTORS.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      weight: f.weight,
      baselineBps: f.baselineBps,
      dynamicMultiplier: f.dynamicMultiplier,
    })),
  });
}

import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";
import { buildV23MetricsReport, type StablecoinPosition } from "@/lib/v23-metrics";
import { APPROVED_DIGITAL_ASSETS } from "@/lib/reserve-policy-spec";

/**
 * GET /api/v23-metrics — v23 Four-Layer advisory metrics report.
 *
 * Returns the full v23 advisory layer:
 *   - Layer 2: GEI, BRI (gold-relative strength)
 *   - Layer 3: LCI (liquidity coverage)
 *   - Layer 4: DRQS (8-factor), SE/SAE (exposure), depeg readings,
 *              stablecoin state machine, CQS state machine
 *
 * Constitutional boundary: NONE of these metrics change PAR or trigger
 * rebalancing. Only Layer 1 (RR) triggers constitutional action.
 *
 * All data sources are FREE (no API keys):
 *   - CoinGecko (stablecoin prices)
 *   - gold-api.com, open.er-api.com (via live-oracle)
 *   - Turso (historical price series)
 */
export async function GET() {
  try {
    const nav = await computeLiveNav();

    // Build stablecoin positions from the digital liquidity sleeve
    const approved = APPROVED_DIGITAL_ASSETS as Record<
      string,
      { peg: string; drqs: number; target: number; optional?: boolean }
    >;
    const positions: StablecoinPosition[] = Object.entries(approved)
      .filter(([, spec]) => spec.target > 0)
      .map(([asset, spec]) => ({
        asset,
        valueUsd: spec.target * nav.reserveAdjustedUsd,
        drqs: spec.drqs,
      }));

    const report = await buildV23MetricsReport({
      gei: nav.gei,
      bri: nav.bri,
      lci: nav.lci,
      rA: nav.reserveAdjustedUsd,
      stablecoinPositions: positions,
      eurUsdRate: nav.fxRates.EUR ? 1 / nav.fxRates.EUR : undefined,
    });

    return NextResponse.json({
      ...report,
      // Convenience: include the underlying NAV values for context
      nav: {
        navM: nav.navM,
        navL: nav.navL,
        reserveRatio: nav.reserveRatio,
        reserveAdjustedUsd: nav.reserveAdjustedUsd,
        usdConcentration: nav.usdConcentration,
        currencyConcentration: nav.currencyConcentration,
        pillarBreakdown: nav.pillarBreakdown,
      },
      spec: {
        fourLayer: {
          layer1: "Constitutional Solvency (RR) — ACTION",
          layer2: "Gold-Relative Strength (GEI + BRI) — ADVISORY",
          layer3: "Liquidity Protection (LCR + LCI) — ADVISORY",
          layer4: "Risk Dashboard (DRQS + SE + SAE + Depeg + CQS) — ADVISORY",
          onlyLayer1TriggersAction: true,
        },
        digitalLiquidity: {
          maxTotal: "5.0%",
          target: "3.5%",
          maxPerIssuer: "2.0%",
          minIssuers: 3,
          drqsCoreThreshold: 7.5,
          algorithmicExcluded: true,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to compute v23 metrics",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}

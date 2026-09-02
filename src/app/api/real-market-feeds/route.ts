import { NextResponse } from "next/server";
import {
  fetchRealMarketData,
  getDataFreshness,
  BASKET_CURRENCIES,
  COFER_LATEST_PUBLISHED_REFERENCE,
  SWIFT_LATEST_PUBLISHED_REFERENCE,
  BIS_TRIENNIAL_2022_REFERENCE,
  type RealMarketData,
} from "@/lib/real-market-feeds";

/**
 * GET /api/real-market-feeds
 *
 * Returns REAL market data from free, public, no-API-key sources:
 *
 *   - IMF COFER (currency composition of FX reserves)
 *       https://www.imf.org/external/datamapper/api/v1/COFER
 *   - BIS Triennial Survey 2022 (FX turnover shares) — latest published ref
 *       https://www.bis.org/statistics/rpfx19_fx.htm
 *   - SWIFT RMB Tracker — latest published reference constant
 *       https://www.swift.com/our-solutions/swift-rmb-tracker
 *   - VIX Index (CBOE) — live from Yahoo Finance
 *       https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX
 *   - Credit spread (BAA − AAA) — Yahoo ^BAA/^AAA, fallback to Moody's ref
 *       https://query1.finance.yahoo.com/v8/finance/chart/%5EBAA
 *   - 10-year Treasury yield (^TNX) — live from Yahoo (secondary indicator)
 *
 * Honest-state constraint (blueprint §V25.2):
 *   productionAuthorized = false
 *   institutionalGatesPassed = 0 / 13
 *   This endpoint does NOT claim real bank integrations or real legal
 *   opinions. Every data point records its source URL and fetch timestamp.
 *   If a source fails, the failure is recorded in `honestState.failedSources`
 *   and a clearly-marked reference constant is used as fallback. The data is
 *   NEVER fabricated — `honestState.dataFresh = false` whenever any source
 *   fails.
 *
 * Gold, silver, and FX rates are fetched live by the existing live-oracle /
 * multi-oracle modules; this endpoint imports those values to provide a
 * single consolidated real-data snapshot.
 */
export async function GET() {
  try {
    // Try to pull live gold/silver/FX from the existing modules (best-effort).
    let goldUsd: number | null = null;
    let silverUsd: number | null = null;
    let fxRates: Record<string, number> | null = null;
    let liveSources: string[] = [];

    try {
      const { getMultiOracleGoldPrice, getMultiOracleSilverPrice, getMultiOracleFxRates } =
        await import("@/lib/multi-oracle");
      const [gold, silver, fx] = await Promise.all([
        getMultiOracleGoldPrice().catch(() => null),
        getMultiOracleSilverPrice().catch(() => null),
        getMultiOracleFxRates().catch(() => null),
      ]);
      if (gold?.consensusPrice) {
        goldUsd = gold.consensusPrice;
        liveSources.push(`gold: multi-oracle(${gold.method})`);
      }
      if (silver?.consensusPrice) {
        silverUsd = silver.consensusPrice;
        liveSources.push(`silver: multi-oracle(${silver.method})`);
      }
      if (fx?.rates && Object.keys(fx.rates).length > 1) {
        fxRates = fx.rates;
        liveSources.push(`fx: multi-oracle(${fx.sources.length} sources)`);
      }
    } catch {
      // Multi-oracle unavailable; goldUsd/silverUsd/fxRates stay null —
      // the real-market-feeds module still returns COFER/SWIFT/BIS/VIX/spread.
    }

    const data: RealMarketData = await fetchRealMarketData({
      goldUsd,
      silverUsd,
      fxRates,
    });

    const freshness = getDataFreshness();

    return NextResponse.json({
      ...data,
      // Augment sources with the gold/silver/fx live sources if available
      sources: [...liveSources, ...data.sources],
      dataFreshness: freshness,
      basketCurrencies: BASKET_CURRENCIES,
      referenceConstants: {
        cofer: COFER_LATEST_PUBLISHED_REFERENCE,
        swift: SWIFT_LATEST_PUBLISHED_REFERENCE,
        bis: BIS_TRIENNIAL_2022_REFERENCE,
      },
      disclaimer:
        "Real market data from free public APIs. productionAuthorized=false per blueprint §V25.2. " +
        "Reference constants are the latest published values from each authority — " +
        "used only when the live API is unreachable or doesn't exist (SWIFT/BIS).",
      documentation: {
        imfCofer: "https://data.imf.org/COFER",
        bisTriennial: "https://www.bis.org/statistics/rpfx19_fx.htm",
        swiftRmbTracker: "https://www.swift.com/our-solutions/swift-rmb-tracker",
        yahooVix: "https://finance.yahoo.com/quote/%5EVIX",
        fredBaa: "https://fred.stlouisfed.org/series/BAA",
        fredAaa: "https://fred.stlouisfed.org/series/AAA",
      },
    });
  } catch (err) {
    console.error("[real-market-feeds] route error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch real market data",
        detail: err instanceof Error ? err.message : "unknown",
        honestState: {
          productionAuthorized: false,
          dataFresh: false,
          failedSources: ["route-handler"],
        },
      },
      { status: 500 },
    );
  }
}

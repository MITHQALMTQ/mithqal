import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getOracleSnapshot } from "@/lib/oracle-client";
import { riskMonitor, type CurrencyData } from "@/lib/mithqal-brain";

/**
 * GET /api/brain/risk — AI Risk Monitor (public, read-only).
 *
 * Fetches live currency data (gold/silver/stablecoin prices + reserve
 * ratio + NAV) and dispatches a risk-analysis prompt to the Brain's 3
 * upstream models in parallel. Returns a structured list of per-currency
 * risk assessments + the consensus level.
 *
 * Response:
 *   {
 *     risks: [{ currency, riskLevel, factors, recommendation }],
 *     consensus: "high" | "medium" | "low",
 *     models: [{ model, label, ok, confidence, latencyMs }],
 *     currencyData: CurrencyData,  // what was fed to the Brain
 *     timestamp: ISO string
 *   }
 *
 * Rate limit: 5 / minute / IP (matches the main brain endpoint).
 */
export async function GET(req: Request) {
  // Public, read-only — but rate-limited.
  const blocked = enforceRateLimit("brain-risk", req, 5, 60_000);
  if (blocked) return blocked;

  try {
    // ---- Fetch live currency data ----
    const oracle = await getOracleSnapshot();

    // The Brain needs NAV + reserve ratio too — these are computed by
    // the v19 monetary engine in /api/contract/info. Rather than
    // duplicate the engine here, we fetch the canonical snapshot via
    // an internal HTTP call (which preserves caching + observability).
    // If the internal fetch fails, we fall back to sensible defaults
    // so the Brain still runs.
    let navUsd = 1.0;
    let reserveRatio = 1.0;
    let supplyMtq = 50_000_000;
    try {
      const origin = new URL(req.url).origin;
      const res = await fetch(`${origin}/api/contract/info`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const info = (await res.json()) as {
          monetary?: {
            nav?: { market?: number };
            reserveRatio?: { ratio?: number };
          };
          contract?: { totalSupplyDisplay?: number };
        };
        if (typeof info.monetary?.nav?.market === "number") {
          navUsd = info.monetary.nav.market;
        }
        if (typeof info.monetary?.reserveRatio?.ratio === "number") {
          reserveRatio = info.monetary.reserveRatio.ratio;
        }
        if (typeof info.contract?.totalSupplyDisplay === "number") {
          supplyMtq = info.contract.totalSupplyDisplay;
        }
      }
    } catch (err) {
      console.warn("[brain/risk] contract/info fetch failed, using defaults:", err);
    }

    const currencyData: CurrencyData = {
      goldUsd: oracle.goldUsd,
      silverUsd: oracle.silverUsd,
      stablecoins: oracle.stablecoins,
      reserveRatio,
      navUsd,
      supplyMtq,
      source: oracle.source,
      timestamp: oracle.fetchedAt,
    };

    // ---- Dispatch to the Brain ----
    const { response, risks } = await riskMonitor(currencyData);

    return NextResponse.json({
      risks,
      consensus: response.consensus,
      models: response.models.map((m) => ({
        model: m.model,
        label: m.label,
        ok: m.ok,
        confidence: m.confidence,
        latencyMs: m.latencyMs,
        error: m.error,
      })),
      combinedAnswer: response.combinedAnswer,
      recommendations: response.recommendations,
      currencyData,
      timestamp: response.timestamp,
    });
  } catch (err) {
    console.error("brain risk monitor failed:", err);
    return NextResponse.json(
      {
        error: "Brain risk monitor failed.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

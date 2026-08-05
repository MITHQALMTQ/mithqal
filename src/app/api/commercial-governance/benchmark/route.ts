import { NextResponse } from "next/server";
import {
  computeBenchmarkPrice,
  type BenchmarkPrice,
  type BenchmarkSource,
} from "@/lib/commercial-governance";

/**
 * POST /api/commercial-governance/benchmark
 *
 * Computes the Constitutional Benchmark Price (CBP) from multiple sources
 * using a weighted-median consensus algorithm (Chapter XX §XX.5).
 *
 * Body:
 *   {
 *     asset: "gold" | "silver" | "sovereign" | "stablecoin" | "sukuk",
 *     sources: [{
 *       priceUsd: number,
 *       source: BenchmarkSource,        // "lbma" | "central_bank" | ...
 *       sourceDetail: string,
 *       confidenceScore: number          // 0-1
 *     }]
 *   }
 *
 * Returns: BenchmarkResult { benchmark, sources, method, consensusPrice, confidence }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (jsonErr) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body.", detail: jsonErr instanceof Error ? jsonErr.message : "unknown" },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const asset = data.asset as BenchmarkPrice["asset"] | undefined;
    const sourcesRaw = Array.isArray(data.sources) ? data.sources : null;

    const validAssets: BenchmarkPrice["asset"][] = ["gold", "silver", "sovereign", "stablecoin", "sukuk"];
    if (!asset || !validAssets.includes(asset)) {
      return NextResponse.json(
        { ok: false, error: `Invalid asset. Must be one of: ${validAssets.join(", ")}` },
        { status: 400 },
      );
    }
    if (!sourcesRaw || sourcesRaw.length === 0) {
      return NextResponse.json(
        { ok: false, error: "At least one benchmark source is required." },
        { status: 400 },
      );
    }

    const validSources: BenchmarkSource[] = ["lbma", "central_bank", "dealer_quote", "institutional_provider", "historical_execution"];
    const sources: BenchmarkPrice[] = sourcesRaw.map((s, i) => {
      const src = s as Record<string, unknown>;
      const priceUsd = Number(src.priceUsd);
      const source = src.source as BenchmarkSource;
      const sourceDetail = typeof src.sourceDetail === "string" ? src.sourceDetail : `source-${i}`;
      const confidenceScore = Number(src.confidenceScore);
      if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
        throw new Error(`Source ${i}: priceUsd must be a positive number`);
      }
      if (!validSources.includes(source)) {
        throw new Error(`Source ${i}: invalid source type "${source}". Valid: ${validSources.join(", ")}`);
      }
      if (!Number.isFinite(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
        throw new Error(`Source ${i}: confidenceScore must be in [0, 1]`);
      }
      return {
        asset,
        priceUsd,
        source,
        sourceDetail,
        timestamp: new Date().toISOString(),
        confidenceScore,
        calculation: "submitted-via-api",
        auditTrail: `api-submit:${source}`,
      };
    });

    const result = computeBenchmarkPrice(asset, sources);

    return NextResponse.json({
      ok: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[benchmark POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not compute benchmark price.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

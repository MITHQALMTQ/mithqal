import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";
import { computeLrr } from "@/lib/lrr";

/**
 * GET /api/lrr — Liquidity Readiness Ratio (Article XIII — Task 12-c P0-1).
 *
 * Public, unauthenticated snapshot of the Institution's LRR.
 *
 * Response shape (success — HTTP 200):
 *   {
 *     lrr: number,                    // headline LRR value
 *     threshold: "strong" | "compliant" | "marginal" | "critical",
 *     compliant: boolean,             // true if LRR ≥ 1.0
 *     strong: boolean,                // true if LRR ≥ 1.2
 *     confidenceInterval95: { lower: number, upper: number },
 *     components: {
 *       cash: number,
 *       stablecoin: number,
 *       sovereign: number,            // haircut-adjusted (× 0.98)
 *       immediatelyAvailableLiquidity: number,
 *       trailingAvg30d: number,
 *       trailingP9530d: number,
 *       stressImplied: number,
 *       expected30DayRedemptionDemand: number,
 *     },
 *     trend: {
 *       "30day": number[],            // 30 points
 *       "90day": number[],            // 90 points
 *       "365day": number[],           // 52 points (weekly resolution)
 *     },
 *     stressScenarios: [
 *       { id, slug, name, category, existential, lrr, pass, bullionProtectionPreserved },
 *       ... // 20 entries (one per Article XV scenario)
 *     ],
 *     alertLevel: "normal" | "reserve_management" | "risk_committee" |
 *                 "council" | "emergency",
 *     timestamp: "2025-...",          // ISO 8601
 *     source: "live-oracle-v19.0.9"
 *   }
 *
 * Response shape (error — HTTP 500):
 *   { error: "Could not compute LRR.", detail: "..." }
 *
 * The endpoint is PUBLIC (no auth) — Article XIII §Transparency mandates
 * "The LRR shall be disclosed in every Proof of Reserves publication."
 */
export async function GET(): Promise<Response> {
  try {
    // Fetch the unified live NAV once — `computeLrr()` accepts a
    // pre-fetched NavResult to avoid a duplicate oracle fetch.
    const nav = await computeLiveNav();
    const result = await computeLrr(nav);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[lrr] failed:", err);
    return NextResponse.json(
      {
        error: "Could not compute LRR.",
        detail: err instanceof Error ? err.message : "unknown error",
        timestamp: new Date().toISOString(),
        source: "live-oracle-v19.0.9",
      },
      { status: 500 },
    );
  }
}

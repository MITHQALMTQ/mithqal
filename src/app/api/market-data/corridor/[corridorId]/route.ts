// GET /api/market-data/corridor/[corridorId]
// Returns the 6 Corridor Pain Index dimensions per v26.0 §8.3.
//
// v26.0 §8.3 — Corridor Pain Index (CPI):
//   "CPI ranks corridors for investigation. Legal/regulatory permission, data
//    access and bank readiness are hard feasibility gates; high commercial
//    score cannot offset them. Version the index and tag each input
//    MEASURED, EXTERNAL_SOURCE, ASSUMED or UNKNOWN with source/date/sample/confidence."
//
// v26.0 §5.5 — Provenance labels are required on every dimension.
//
// Auth: PUBLIC (read-only). Rate-limited per IP.
import { NextResponse } from "next/server";
import { getCorridorPainInputs } from "@/lib/market-data";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ corridorId: string }> },
) {
  const block = enforceRateLimit("market-data-corridor", req, 30, 60_000);
  if (block) return block;

  const { corridorId } = await params;
  if (!corridorId || corridorId.length > 64) {
    return NextResponse.json(
      { error: "Invalid corridorId.", blueprint_ref: "v26.0 §8.3" },
      { status: 400 },
    );
  }

  try {
    const cpi = await getCorridorPainInputs(corridorId);
    return NextResponse.json(
      {
        endpoint: `/api/market-data/corridor/${corridorId}`,
        method: "GET",
        blueprint_ref: "v26.0 §8.3 (CPI) + §5.5 (provenance)",
        corridorId,
        dimensions: {
          settlementFriction: cpi.settlementFriction,
          economicCost: cpi.economicCost,
          liquidityTiming: cpi.liquidityTiming,
          dataIntegrationReadiness: cpi.dataIntegrationReadiness,
          failureBurden: cpi.failureBurden,
          strategicFit: cpi.strategicFit,
        },
        provenance: cpi.provenance,
        weights_notice:
          "A weighted 0–100 formula may be used only after owner-approved " +
          "weights/normalization rules are versioned (v26.0 §8.3). Do not " +
          "rank with false numerical certainty when critical inputs are UNKNOWN.",
        pilotA_notice:
          "Pilot A — most dimensions ASSUMED/UNKNOWN because no banks are contracted.",
      },
      { headers: { "X-Blueprint-Ref": "v26.0 §8.3" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Failed to compose CPI inputs.",
        detail: message,
        blueprint_ref: "v26.0 §8.3",
      },
      { status: 503 },
    );
  }
}

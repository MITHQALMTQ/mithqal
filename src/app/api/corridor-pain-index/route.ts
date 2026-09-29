import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  DEFAULT_PAIN_FACTORS,
  SAMPLE_CORRIDORS,
  computeCorridorPainScore,
  rankCorridorsByPain,
  selectFirstPilotCorridor,
  CORRIDOR_PAIN_INDEX_STATUS,
  CORRIDOR_PAIN_INDEX_VERSION,
  CORRIDOR_PAIN_INDEX_SOURCE,
  CORRIDOR_PAIN_INDEX_HONEST_STATE,
  NO_HARD_CODED_PILOT_RULE,
  type CandidateCorridor,
} from "@/lib/corridor-pain-index";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("corridor-pain-index", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const selectPilot = url.searchParams.get("selectPilot") === "true";
  const useSamples = url.searchParams.get("samples") === "true" || selectPilot;

  if (selectPilot) {
    // Select the first pilot corridor from the sample corridors
    const result = selectFirstPilotCorridor(SAMPLE_CORRIDORS);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: CORRIDOR_PAIN_INDEX_SOURCE,
        version: CORRIDOR_PAIN_INDEX_VERSION,
        status: CORRIDOR_PAIN_INDEX_STATUS,
        taskId: "P1",
        taskTrace: "1a0eec34b13085fd",
        noHardCodedPilotRule: NO_HARD_CODED_PILOT_RULE,
        honestState: CORRIDOR_PAIN_INDEX_HONEST_STATE,
      },
      firstPilotCorridor: result.corridor,
      allRankedCorridors: result.allRanked,
      rule: "First pilot corridor selected by highest pain score. NOT hard-coded. Per P-directive: 'Do not hard-code AED→EGP, SAR→INR or AED→SGD.'",
    });
  }

  if (useSamples) {
    // Return ranked sample corridors (without selecting pilot)
    const ranked = rankCorridorsByPain(SAMPLE_CORRIDORS);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: CORRIDOR_PAIN_INDEX_SOURCE,
        version: CORRIDOR_PAIN_INDEX_VERSION,
        status: CORRIDOR_PAIN_INDEX_STATUS,
        taskId: "P1",
        taskTrace: "1a0eec34b13085fd",
        honestState: CORRIDOR_PAIN_INDEX_HONEST_STATE,
      },
      corridors: ranked,
      count: ranked.length,
      factors: DEFAULT_PAIN_FACTORS,
      note: "Sample corridors for testing the scoring algorithm. NOT hard-coded as the pilot. The pilot is selected by the score.",
    });
  }

  // Default: return the schema + factors
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: CORRIDOR_PAIN_INDEX_SOURCE,
      version: CORRIDOR_PAIN_INDEX_VERSION,
      status: CORRIDOR_PAIN_INDEX_STATUS,
      taskId: "P1",
      taskTrace: "1a0eec34b13085fd",
      noHardCodedPilotRule: NO_HARD_CODED_PILOT_RULE,
      honestState: CORRIDOR_PAIN_INDEX_HONEST_STATE,
    },
    factorCount: DEFAULT_PAIN_FACTORS.length,
    factors: DEFAULT_PAIN_FACTORS,
    weightsSum: DEFAULT_PAIN_FACTORS.reduce((s, f) => s + f.weight, 0),
    rule: "Score candidate corridors using 12 factors. Use ?selectPilot=true to select the first pilot corridor (by highest pain score). Use ?samples=true to see ranked sample corridors. Per P-directive: NO hard-coded pilot corridors.",
  });
}

// POST /api/corridor-pain-index
// Score a custom corridor (operator-provided)
export async function POST(request: Request) {
  const rateLimited = enforceRateLimit("corridor-pain-index-post", request, 10, 60_000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    if (Array.isArray(body)) {
      // Score multiple corridors
      const scores = rankCorridorsByPain(body as CandidateCorridor[]);
      return NextResponse.json({
        _meta: {
          activeModel: "v25.3.2",
          source: CORRIDOR_PAIN_INDEX_SOURCE,
          version: CORRIDOR_PAIN_INDEX_VERSION,
          status: CORRIDOR_PAIN_INDEX_STATUS,
          taskId: "P1",
          taskTrace: "1a0eec34b13085fd",
        },
        corridors: scores,
        count: scores.length,
        rule: "Custom corridors ranked by pain score. NOT hard-coded. Per P-directive: 'Do not hard-code AED→EGP, SAR→INR or AED→SGD.'",
      });
    } else {
      // Score a single corridor
      const score = computeCorridorPainScore(body as CandidateCorridor);
      return NextResponse.json({
        _meta: {
          activeModel: "v25.3.2",
          source: CORRIDOR_PAIN_INDEX_SOURCE,
          version: CORRIDOR_PAIN_INDEX_VERSION,
          status: CORRIDOR_PAIN_INDEX_STATUS,
          taskId: "P1",
          taskTrace: "1a0eec34b13085fd",
        },
        corridor: score,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to compute pain score", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}

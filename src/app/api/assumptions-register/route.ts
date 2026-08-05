import { NextResponse } from "next/server";
import {
  recordAssumptions,
  getLatestAssumptions,
  listAssumptions,
  countAssumptions,
  type AssumptionsRegisterEntryInput,
} from "@/lib/assumptions-register";

/**
 * GET /api/assumptions-register — public transparency endpoint for the
 * Constitutional Assumptions Register (Article XVI — Task 12-c P0-2).
 *
 * Query params:
 *   ?limit=20   (how many recent entries to include; default 20, max 100)
 *
 * Response shape (success):
 *   {
 *     ok: true,
 *     latest: DecodedEntry | null,    // the most recent entry across all types
 *     entries: DecodedEntry[],         // most-recent-first list (≤ limit)
 *     count: number,                   // total entries in the Register
 *     generatedAt: string              // ISO 8601
 *   }
 *
 * Response shape (validation error):
 *   { ok: false, error: "...", detail: "..." } with HTTP 400
 *
 * Response shape (server error):
 *   { ok: false, error: "...", detail: "..." } with HTTP 500
 *
 * The endpoint is PUBLIC (no auth) — Article XVI §Reproducibility mandates
 * "any qualified reviewer shall be able to reproduce the simulation from
 * the Register entry alone."
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    let limit = 20;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(Math.floor(parsed), 100);
      }
    }

    const [latest, entries, count] = await Promise.all([
      getLatestAssumptions(),
      listAssumptions(limit),
      countAssumptions(),
    ]);

    return NextResponse.json({
      ok: true,
      latest,
      entries,
      count,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[assumptions-register GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load Assumptions Register entries.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/assumptions-register — record a new simulation's assumptions
 * (Article XVI — Task 12-c P0-2).
 *
 * Body: a full AssumptionsRegisterEntryInput object with all 14 mandatory
 * fields. The server validates all 14 fields are present (non-empty),
 * JSON-stringifies the structured sub-objects, and inserts an immutable
 * row in the AssumptionsRegister table.
 *
 * Per Article XVI §Mandatory Register Fields:
 *   1.  randomSeed             (number)
 *   2.  inputAssumptions       ({ dataSources, timePeriod, processingMethodology, notes? })
 *   3.  economicAssumptions    ({ gdpGrowthPct, inflationPct, interestRatePct, currencyRegime, justification? })
 *   4.  liquidityAssumptions   ({ redemptionVolume30d, marketDepthPerTrade, settlementTime, bidAskSpreadBps, justification? })
 *   5.  correlationAssumptions ({ goldSilverRho, methodology, revalidationCadence, others? })
 *   6.  marketConditions       ({ volatilityRegime, vix?, currencyVolatility, trendAssumption })
 *   7.  timeHorizon            (string)
 *   8.  confidenceLevel        (number — percent)
 *   9.  simulationVersion      (string)
 *  10.  softwareVersion        (string)
 *  11.  date                   (ISO 8601 string)
 *  12.  author                 (string)
 *  13.  approval               ({ body, date, reference? })
 *  14.  auditSignature         (string)
 *
 * Response shape (success — HTTP 201):
 *   { ok: true, entry: DecodedEntry }
 *
 * Response shape (validation error — HTTP 400):
 *   { ok: false, error: "...", detail: "..." }
 *
 * The endpoint is PUBLIC in testnet — production deployments should
 * require Constitutional-Council-member authentication (POST is a
 * governance-grade mutation of an immutable register).
 */
export async function POST(req: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (jsonErr) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON body.",
          detail: jsonErr instanceof Error ? jsonErr.message : "unknown",
        },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Body must be a JSON object." },
        { status: 400 },
      );
    }

    const entry = body as AssumptionsRegisterEntryInput;

    // `recordAssumptions()` validates all 14 mandatory fields are present
    // and non-empty, JSON-stringifies the structured sub-objects, and
    // inserts an immutable row.
    const recorded = await recordAssumptions(entry);

    return NextResponse.json(
      {
        ok: true,
        entry: recorded,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    const isValidation = message.startsWith("[assumptions-register] missing mandatory field");
    return NextResponse.json(
      {
        ok: false,
        error: isValidation
          ? "Missing mandatory Article XVI field."
          : "Could not record Assumptions Register entry.",
        detail: message,
      },
      { status: isValidation ? 400 : 500 },
    );
  }
}

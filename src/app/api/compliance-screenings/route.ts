import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * /api/compliance-screenings — AML/KYC/sanctions/PEP/adverse-media
 * screening records per /api/sanctions-screening + /api/compliance.
 * v25.8 architectural model per F1 gap analysis (closes gap #1). Backed
 * by the `ComplianceScreening` libsql table created idempotently in
 * `ensureV258Schema()` of src/lib/db.ts.
 *
 * GET — public, rate-limited (30 req/min per IP), list with filters:
 *   ?screeningType=aml|kyc|sanctions|pep|adverse-media
 *   ?result=clear|hit|review|escalated
 *   ?bankParticipantId=<cuid>
 *   ?limit=100  (max 500, default 100)
 *
 * POST — operator-only (CRON_SECRET-gated, same pattern as
 *   /api/oracle/update). Creates a new screening record. Required:
 *     - screeningType, inputValue, inputType, result
 *   Optional: bankParticipantId, screeningProvider, riskScore (0-100),
 *     matchCount, matchedEntities (JSON string), screenedBy, expiresAt,
 *     notes.
 *
 * Returns 200 on GET (with empty array if no rows). Returns 201 on POST
 * with the created record. Returns 503 if CRON_SECRET unset; 401 if the
 * `x-cron-secret` header doesn't match. Returns 400 on invalid body.
 */

export const dynamic = "force-dynamic"; // Prisma-backed route — never statically cached
export const runtime = "nodejs"; // Prisma needs Node (not Edge)

const VALID_SCREENING_TYPES = new Set([
  "aml",
  "kyc",
  "sanctions",
  "pep",
  "adverse-media",
]);

const VALID_RESULTS = new Set(["clear", "hit", "review", "escalated"]);

const VALID_INPUT_TYPES = new Set(["individual", "entity", "transaction"]);

export async function GET(req: Request) {
  const blocked = enforceRateLimit("compliance-screenings-get", req, 30, 60_000);
  if (blocked) return blocked;

  try {
    const url = new URL(req.url);
    const screeningType = url.searchParams.get("screeningType") ?? undefined;
    const result = url.searchParams.get("result") ?? undefined;
    const bankParticipantId = url.searchParams.get("bankParticipantId") ?? undefined;
    const limitParam = url.searchParams.get("limit");

    if (screeningType && !VALID_SCREENING_TYPES.has(screeningType)) {
      return NextResponse.json(
        {
          error: "Invalid ?screeningType filter.",
          validValues: Array.from(VALID_SCREENING_TYPES),
        },
        { status: 400 },
      );
    }
    if (result && !VALID_RESULTS.has(result)) {
      return NextResponse.json(
        {
          error: "Invalid ?result filter.",
          validValues: Array.from(VALID_RESULTS),
        },
        { status: 400 },
      );
    }

    let limit = 100;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(Math.floor(parsed), 500);
      }
    }

    const where: Record<string, string> = {};
    if (screeningType) where.screeningType = screeningType;
    if (result) where.result = result;
    if (bankParticipantId) where.bankParticipantId = bankParticipantId;

    const [screenings, total] = await Promise.all([
      db.complianceScreening.findMany({
        where,
        orderBy: { screenedAt: "desc" },
        take: limit,
      }),
      db.complianceScreening.count({
        where: screeningType || result
          ? { screeningType, result }
          : undefined,
      }),
    ]);

    return NextResponse.json({
      complianceScreenings: screenings,
      total,
      filter: Object.keys(where).length ? where : null,
      limit,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("compliance-screenings list failed:", err);
    return NextResponse.json(
      {
        error: "Could not load compliance screenings.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  // CRON_SECRET gate — operator-only.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      {
        error: "Service unavailable",
        detail:
          "CRON_SECRET not configured — compliance-screening creation endpoint is disabled until the operator provisions a cron secret",
      },
      { status: 503 },
    );
  }
  if (req.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json(
      { error: "unauthorized", detail: "missing or invalid x-cron-secret header" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // Required fields.
  const screeningType =
    typeof data.screeningType === "string" ? data.screeningType.trim() : "";
  if (!VALID_SCREENING_TYPES.has(screeningType)) {
    return NextResponse.json(
      {
        error: "Invalid screeningType.",
        validValues: Array.from(VALID_SCREENING_TYPES),
      },
      { status: 400 },
    );
  }
  const inputValue =
    typeof data.inputValue === "string" ? data.inputValue.trim() : "";
  if (!inputValue || inputValue.length > 500) {
    return NextResponse.json(
      { error: "inputValue is required (1-500 chars)." },
      { status: 400 },
    );
  }
  const inputType =
    typeof data.inputType === "string" ? data.inputType.trim() : "";
  if (!VALID_INPUT_TYPES.has(inputType)) {
    return NextResponse.json(
      {
        error: "Invalid inputType.",
        validValues: Array.from(VALID_INPUT_TYPES),
      },
      { status: 400 },
    );
  }
  const result =
    typeof data.result === "string" ? data.result.trim() : "";
  if (!VALID_RESULTS.has(result)) {
    return NextResponse.json(
      {
        error: "Invalid result.",
        validValues: Array.from(VALID_RESULTS),
      },
      { status: 400 },
    );
  }

  // Optional fields.
  const bankParticipantId =
    typeof data.bankParticipantId === "string" && data.bankParticipantId.trim()
      ? data.bankParticipantId.trim()
      : null;
  const screeningProvider =
    typeof data.screeningProvider === "string" && data.screeningProvider.trim()
      ? data.screeningProvider.trim().toLowerCase()
      : null;
  const riskScore =
    typeof data.riskScore === "number" && Number.isFinite(data.riskScore)
      ? Math.max(0, Math.min(Math.floor(data.riskScore), 100))
      : null;
  const matchCount =
    typeof data.matchCount === "number" && Number.isFinite(data.matchCount)
      ? Math.max(0, Math.floor(data.matchCount))
      : 0;
  const matchedEntities =
    typeof data.matchedEntities === "string" && data.matchedEntities.trim()
      ? data.matchedEntities.trim()
      : null;
  const screenedBy =
    typeof data.screenedBy === "string" && data.screenedBy.trim()
      ? data.screenedBy.trim()
      : null;
  const expiresAt =
    typeof data.expiresAt === "string" && data.expiresAt.trim()
      ? new Date(data.expiresAt)
      : null;
  if (expiresAt && isNaN(expiresAt.getTime())) {
    return NextResponse.json(
      { error: "expiresAt must be a valid ISO 8601 date string." },
      { status: 400 },
    );
  }
  const notes =
    typeof data.notes === "string" && data.notes.trim() ? data.notes.trim() : null;

  try {
    const created = await db.complianceScreening.create({
      data: {
        bankParticipantId,
        screeningType,
        screeningProvider,
        inputValue,
        inputType,
        result,
        riskScore,
        matchCount,
        matchedEntities,
        screenedBy,
        expiresAt,
        notes,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        complianceScreening: created,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("compliance-screening create failed:", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        error: "Could not create compliance screening.",
        detail: msg,
      },
      { status: 500 },
    );
  }
}

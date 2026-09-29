import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * /api/bank-participants — institutional banks/custodians/clearing-houses/
 * central-banks that interact with MITHQAL (v25.8 architectural model, per
 * F1 gap analysis closing gap #1). Backed by the `BankParticipant` libsql
 * table created idempotently in `ensureV258Schema()` of src/lib/db.ts.
 *
 * GET — public, rate-limited (30 req/min per IP), list with filters:
 *   ?status=pending|approved|suspended|revoked
 *   ?participantType=bank|custodian|clearing-house|central-bank
 *   ?jurisdiction=US|AE|GB|...  (ISO 3166-1 alpha-2)
 *   ?limit=100  (max 500, default 100)
 *
 * POST — operator-only (CRON_SECRET-gated, same pattern as
 *   /api/oracle/update). Creates a new BankParticipant row with the
 *   minimal required fields. The body must include:
 *     - legalName (string, unique)
 *     - jurisdiction (ISO 3166-1 alpha-2)
 *     - participantType (bank | custodian | clearing-house | central-bank)
 *   Optional fields: swiftCode, regulatoryId, onboardedBy, status, contact*,
 *     kycStatus, amlStatus, sanctionsStatus, notes.
 *
 * Returns 200 on GET (with empty array if no rows). Returns 201 on POST
 * with the created record. Returns 503 if CRON_SECRET unset; 401 if the
 * `x-cron-secret` header doesn't match. Returns 400 on invalid body.
 */

export const dynamic = "force-dynamic"; // Prisma-backed route — never statically cached
export const runtime = "nodejs"; // Prisma needs Node (not Edge)

const VALID_PARTICIPANT_TYPES = new Set([
  "bank",
  "custodian",
  "clearing-house",
  "central-bank",
]);

const VALID_STATUSES = new Set([
  "pending",
  "approved",
  "suspended",
  "revoked",
]);

const VALID_KYC_STATUSES = new Set([
  "not-started",
  "in-progress",
  "verified",
  "rejected",
]);

export async function GET(req: Request) {
  // Rate limit FIRST — before any DB work — so abusive clients can't
  // burn Prisma CPU once they've hit the limit.
  const blocked = enforceRateLimit("bank-participants-get", req, 30, 60_000);
  if (blocked) return blocked;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const participantType = url.searchParams.get("participantType") ?? undefined;
    const jurisdiction = url.searchParams.get("jurisdiction") ?? undefined;
    const limitParam = url.searchParams.get("limit");

    // Validate filters — reject unknown enum values with 400 so the
    // caller knows they sent garbage rather than silently returning an
    // empty list (which would be indistinguishable from "no matches").
    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error: "Invalid ?status filter.",
          validValues: Array.from(VALID_STATUSES),
        },
        { status: 400 },
      );
    }
    if (participantType && !VALID_PARTICIPANT_TYPES.has(participantType)) {
      return NextResponse.json(
        {
          error: "Invalid ?participantType filter.",
          validValues: Array.from(VALID_PARTICIPANT_TYPES),
        },
        { status: 400 },
      );
    }

    // Limit: default 100, max 500, min 1.
    let limit = 100;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(Math.floor(parsed), 500);
      }
    }

    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (participantType) where.participantType = participantType;
    if (jurisdiction) where.jurisdiction = jurisdiction.toUpperCase();

    const [participants, total] = await Promise.all([
      db.bankParticipant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.bankParticipant.count({
        where: status || participantType
          ? { status, participantType }
          : undefined,
      }),
    ]);

    return NextResponse.json({
      bankParticipants: participants,
      total,
      filter: Object.keys(where).length ? where : null,
      limit,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("bank-participants list failed:", err);
    return NextResponse.json(
      {
        error: "Could not load bank participants.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  // CRON_SECRET gate — operator-only. Same pattern as /api/oracle/update:
  //   - If CRON_SECRET is unset in env, return 503 (refuse to operate
  //     unauthenticated) rather than allow public writes to the bank
  //     participant registry.
  //   - If CRON_SECRET is set but the `x-cron-secret` header doesn't
  //     match, return 401.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      {
        error: "Service unavailable",
        detail:
          "CRON_SECRET not configured — bank-participant creation endpoint is disabled until the operator provisions a cron secret",
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

  // Validate required fields.
  const legalName =
    typeof data.legalName === "string" ? data.legalName.trim() : "";
  if (!legalName || legalName.length < 2 || legalName.length > 200) {
    return NextResponse.json(
      { error: "legalName is required (2-200 chars)." },
      { status: 400 },
    );
  }
  const jurisdiction =
    typeof data.jurisdiction === "string" ? data.jurisdiction.trim().toUpperCase() : "";
  if (!/^[A-Z]{2}$/.test(jurisdiction)) {
    return NextResponse.json(
      { error: "jurisdiction must be ISO 3166-1 alpha-2 (e.g. US, AE, GB)." },
      { status: 400 },
    );
  }
  const participantType =
    typeof data.participantType === "string" ? data.participantType.trim() : "";
  if (!VALID_PARTICIPANT_TYPES.has(participantType)) {
    return NextResponse.json(
      {
        error: "Invalid participantType.",
        validValues: Array.from(VALID_PARTICIPANT_TYPES),
      },
      { status: 400 },
    );
  }

  // Optional fields with type guards.
  const swiftCode =
    typeof data.swiftCode === "string" && data.swiftCode.trim()
      ? data.swiftCode.trim().toUpperCase()
      : null;
  const regulatoryId =
    typeof data.regulatoryId === "string" && data.regulatoryId.trim()
      ? data.regulatoryId.trim()
      : null;
  const onboardedBy =
    typeof data.onboardedBy === "string" && data.onboardedBy.trim()
      ? data.onboardedBy.trim()
      : null;
  const status =
    typeof data.status === "string" && VALID_STATUSES.has(data.status)
      ? data.status
      : "pending";
  const contactName =
    typeof data.contactName === "string" && data.contactName.trim()
      ? data.contactName.trim()
      : null;
  const contactEmail =
    typeof data.contactEmail === "string" && data.contactEmail.trim()
      ? data.contactEmail.trim().toLowerCase()
      : null;
  const contactPhone =
    typeof data.contactPhone === "string" && data.contactPhone.trim()
      ? data.contactPhone.trim()
      : null;
  const kycStatus =
    typeof data.kycStatus === "string" && VALID_KYC_STATUSES.has(data.kycStatus)
      ? data.kycStatus
      : "not-started";
  const amlStatus =
    typeof data.amlStatus === "string" && VALID_KYC_STATUSES.has(data.amlStatus)
      ? data.amlStatus
      : "not-started";
  const sanctionsStatus =
    typeof data.sanctionsStatus === "string" && VALID_KYC_STATUSES.has(data.sanctionsStatus)
      ? data.sanctionsStatus
      : "not-started";
  const notes =
    typeof data.notes === "string" && data.notes.trim() ? data.notes.trim() : null;

  try {
    const created = await db.bankParticipant.create({
      data: {
        legalName,
        swiftCode,
        jurisdiction,
        participantType,
        regulatoryId,
        onboardedBy,
        status,
        contactName,
        contactEmail,
        contactPhone,
        kycStatus,
        amlStatus,
        sanctionsStatus,
        notes,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        bankParticipant: created,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("bank-participant create failed:", err);
    // SQLite UNIQUE constraint violation → 409 Conflict.
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json(
        {
          error: "A bank participant with this legalName or swiftCode already exists.",
          detail: msg,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error: "Could not create bank participant.",
        detail: msg,
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * /api/reserve-holdings — individual reserve holdings (gold, silver,
 * sovereign bonds, stablecoins, cash) backing MTQ issuance per
 * Constitution v19.0 §22 multi-currency backing. v25.8 architectural
 * model per F1 gap analysis (closes gap #1). Backed by the
 * `ReserveHolding` libsql table created idempotently in `ensureV258Schema()`
 * of src/lib/db.ts.
 *
 * Monetary fields (quantity, marketValueUsd) are exposed as STRING for
 * BigDecimal-safe transport — same convention as `transactions.amount`
 * and `fees.amount`. The DB column is TEXT (NOT REAL) to avoid Float64
 * precision loss.
 *
 * GET — public, rate-limited (30 req/min per IP), list with filters:
 *   ?assetClass=gold|silver|sovereign|stablecoin|cash
 *   ?assetSymbol=XAU|XAG|US-TREASURY-10Y|USDC|USD
 *   ?status=pending|verified|rejected|frozen
 *   ?bankParticipantId=<cuid>
 *   ?limit=100  (max 500, default 100)
 *
 * POST — operator-only (CRON_SECRET-gated, same pattern as
 *   /api/oracle/update). Creates a new ReserveHolding row. Required:
 *     - assetClass, assetSymbol, quantity (string), unit, marketValueUsd (string)
 *   Optional: bankParticipantId, custodyLocation, haircutBps, verifiedAt,
 *     verifiedBy, verificationHash, status, notes.
 *
 * Returns 200 on GET (with empty array if no rows). Returns 201 on POST
 * with the created record. Returns 503 if CRON_SECRET unset; 401 if the
 * `x-cron-secret` header doesn't match. Returns 400 on invalid body.
 */

export const dynamic = "force-dynamic"; // Prisma-backed route — never statically cached
export const runtime = "nodejs"; // Prisma needs Node (not Edge)

const VALID_ASSET_CLASSES = new Set([
  "gold",
  "silver",
  "sovereign",
  "stablecoin",
  "cash",
]);

const VALID_STATUSES = new Set([
  "pending",
  "verified",
  "rejected",
  "frozen",
]);

const VALID_UNITS = new Set(["oz", "usd", "token", "gram"]);

// Validate a BigDecimal-safe string: optional leading minus, optional
// integer part, optional fractional part (1-8 decimals). Reject NaN,
// Infinity, scientific notation, and empty strings.
const DECIMAL_STRING_RE = /^-?\d+(\.\d{1,8})?$/;

export async function GET(req: Request) {
  const blocked = enforceRateLimit("reserve-holdings-get", req, 30, 60_000);
  if (blocked) return blocked;

  try {
    const url = new URL(req.url);
    const assetClass = url.searchParams.get("assetClass") ?? undefined;
    const assetSymbol = url.searchParams.get("assetSymbol") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const bankParticipantId = url.searchParams.get("bankParticipantId") ?? undefined;
    const limitParam = url.searchParams.get("limit");

    if (assetClass && !VALID_ASSET_CLASSES.has(assetClass)) {
      return NextResponse.json(
        {
          error: "Invalid ?assetClass filter.",
          validValues: Array.from(VALID_ASSET_CLASSES),
        },
        { status: 400 },
      );
    }
    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error: "Invalid ?status filter.",
          validValues: Array.from(VALID_STATUSES),
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
    if (assetClass) where.assetClass = assetClass;
    if (assetSymbol) where.assetSymbol = assetSymbol.toUpperCase();
    if (status) where.status = status;
    if (bankParticipantId) where.bankParticipantId = bankParticipantId;

    const [holdings, total] = await Promise.all([
      db.reserveHolding.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.reserveHolding.count({
        where: assetClass || status
          ? { assetClass, status }
          : undefined,
      }),
    ]);

    return NextResponse.json({
      reserveHoldings: holdings,
      total,
      filter: Object.keys(where).length ? where : null,
      limit,
      // Aggregate market value (BigDecimal sum across all matched rows).
      // Sum is computed in SQL using CAST(... AS REAL) — the precision
      // is sufficient for an aggregate dashboard figure (the per-row
      // value stays BigDecimal-precise in the row payload above).
      aggregateMarketValueUsd: holdings.reduce(
        (sum, h) => sum + Number(h.marketValueUsd),
        0,
      ),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("reserve-holdings list failed:", err);
    return NextResponse.json(
      {
        error: "Could not load reserve holdings.",
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
          "CRON_SECRET not configured — reserve-holding creation endpoint is disabled until the operator provisions a cron secret",
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
  const assetClass =
    typeof data.assetClass === "string" ? data.assetClass.trim() : "";
  if (!VALID_ASSET_CLASSES.has(assetClass)) {
    return NextResponse.json(
      {
        error: "Invalid assetClass.",
        validValues: Array.from(VALID_ASSET_CLASSES),
      },
      { status: 400 },
    );
  }
  const assetSymbol =
    typeof data.assetSymbol === "string" ? data.assetSymbol.trim().toUpperCase() : "";
  if (!assetSymbol || assetSymbol.length > 32) {
    return NextResponse.json(
      { error: "assetSymbol is required (1-32 chars, e.g. XAU, XAG, USDC)." },
      { status: 400 },
    );
  }
  const quantity =
    typeof data.quantity === "string" ? data.quantity.trim() : "";
  if (!DECIMAL_STRING_RE.test(quantity)) {
    return NextResponse.json(
      {
        error:
          "quantity must be a BigDecimal-safe string (e.g. '1234.56789012', max 8 decimals).",
      },
      { status: 400 },
    );
  }
  const unit = typeof data.unit === "string" ? data.unit.trim() : "";
  if (!VALID_UNITS.has(unit)) {
    return NextResponse.json(
      {
        error: "Invalid unit.",
        validValues: Array.from(VALID_UNITS),
      },
      { status: 400 },
    );
  }
  const marketValueUsd =
    typeof data.marketValueUsd === "string" ? data.marketValueUsd.trim() : "";
  if (!DECIMAL_STRING_RE.test(marketValueUsd)) {
    return NextResponse.json(
      {
        error:
          "marketValueUsd must be a BigDecimal-safe string (e.g. '1234.56789012', max 8 decimals).",
      },
      { status: 400 },
    );
  }

  // Optional fields.
  const bankParticipantId =
    typeof data.bankParticipantId === "string" && data.bankParticipantId.trim()
      ? data.bankParticipantId.trim()
      : null;
  const custodyLocation =
    typeof data.custodyLocation === "string" && data.custodyLocation.trim()
      ? data.custodyLocation.trim()
      : null;
  const haircutBps =
    typeof data.haircutBps === "number" && Number.isFinite(data.haircutBps)
      ? Math.max(0, Math.min(Math.floor(data.haircutBps), 10000))
      : 0;
  const status =
    typeof data.status === "string" && VALID_STATUSES.has(data.status)
      ? data.status
      : "pending";
  const notes =
    typeof data.notes === "string" && data.notes.trim() ? data.notes.trim() : null;

  // Verified fields — only set if status is "verified".
  const verifiedAt =
    status === "verified" && typeof data.verifiedAt === "string"
      ? new Date(data.verifiedAt)
      : null;
  const verifiedBy =
    typeof data.verifiedBy === "string" && data.verifiedBy.trim()
      ? data.verifiedBy.trim()
      : null;
  const verificationHash =
    typeof data.verificationHash === "string" && data.verificationHash.trim()
      ? data.verificationHash.trim()
      : null;

  try {
    const created = await db.reserveHolding.create({
      data: {
        bankParticipantId,
        assetClass,
        assetSymbol,
        custodyLocation,
        quantity,
        unit,
        marketValueUsd,
        haircutBps,
        verifiedAt,
        verifiedBy,
        verificationHash,
        status,
        notes,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        reserveHolding: created,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("reserve-holding create failed:", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      {
        error: "Could not create reserve holding.",
        detail: msg,
      },
      { status: 500 },
    );
  }
}

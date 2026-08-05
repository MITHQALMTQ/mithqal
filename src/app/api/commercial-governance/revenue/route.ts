import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";
import {
  createRevenueEntry,
  summarizeRevenue,
  REVENUE_CATEGORIES,
  type RevenueEntry,
  type EntityId,
  type RevenueCategory,
} from "@/lib/commercial-governance";

/**
 * /api/commercial-governance/revenue
 *   GET  — list all revenue entries + summary
 *   POST — record a new revenue entry
 *
 * Body (POST): { entity, category, amountUsd, description, transactionRef? }
 *
 * Chapter XX §XX.9 — every commercial revenue stream is recorded immutably
 * with the entity that earned it and the category that describes it.
 */
export async function GET(): Promise<Response> {
  try {
    const rs = await rawQuery(
      `SELECT * FROM "RevenueEntry" ORDER BY "timestamp" DESC LIMIT 500`,
      [],
    );
    const entries = rs.rows.map(rowToRevenueEntry);
    const summary = summarizeRevenue(entries);

    return NextResponse.json({
      ok: true,
      entries,
      summary,
      categories: REVENUE_CATEGORIES,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[revenue GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load revenue entries.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

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
    const entity = data.entity as EntityId | undefined;
    const category = data.category as RevenueCategory | undefined;
    const amountUsd = typeof data.amountUsd === "number" ? data.amountUsd : null;
    const description = typeof data.description === "string" ? data.description : null;
    const transactionRef =
      typeof data.transactionRef === "string" ? data.transactionRef : undefined;

    const validEntities: EntityId[] = ["foundation", "holding", "operations", "markets"];
    if (!entity || !validEntities.includes(entity)) {
      return NextResponse.json(
        { ok: false, error: `Invalid entity. Must be one of: ${validEntities.join(", ")}` },
        { status: 400 },
      );
    }
    const validCategories = REVENUE_CATEGORIES.map((c) => c.category);
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { ok: false, error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 },
      );
    }
    if (amountUsd == null || amountUsd <= 0) {
      return NextResponse.json({ ok: false, error: "amountUsd must be > 0" }, { status: 400 });
    }
    if (!description || description.length < 3) {
      return NextResponse.json(
        { ok: false, error: "description must be at least 3 characters" },
        { status: 400 },
      );
    }

    // Build the immutable entry via the governance engine
    const entry = createRevenueEntry(entity, category, amountUsd, description, transactionRef);

    await rawQuery(
      `INSERT INTO "RevenueEntry" ("id","entity","category","amountUsd","transactionRef","description","timestamp")
       VALUES (?,?,?,?,?,?,?)`,
      [entry.id, entry.entity, entry.category, entry.amountUsd, entry.transactionRef ?? null, entry.description, entry.timestamp],
    );

    return NextResponse.json(
      {
        ok: true,
        entry,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[revenue POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not record revenue entry.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

function rowToRevenueEntry(row: Record<string, unknown>): RevenueEntry {
  return {
    id: row.id as string,
    entity: row.entity as RevenueEntry["entity"],
    category: row.category as RevenueEntry["category"],
    amountUsd: Number(row.amountUsd),
    timestamp: row.timestamp as string,
    transactionRef: (row.transactionRef as string) ?? undefined,
    description: row.description as string,
  };
}

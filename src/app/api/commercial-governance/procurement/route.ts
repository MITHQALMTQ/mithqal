import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";
import {
  PROCUREMENT_STAGES,
  type ProcurementRecord,
  type ProcurementStage,
  type BenchmarkPrice,
} from "@/lib/commercial-governance";

/**
 * /api/commercial-governance/procurement
 *   GET  — list procurement records (most-recent first)
 *   POST — create a new procurement record (starts at stage "reserve_need")
 *
 * Body (POST): { asset, amountUsd, quantity }
 *
 * Chapter XX §XX.7 — every reserve procurement must follow the 12-stage
 * workflow. Stage 1 ("reserve_need") is set on creation; subsequent stages
 * are advanced via /procurement/[id]/advance.
 */
export async function GET(): Promise<Response> {
  try {
    const rs = await rawQuery(
      `SELECT * FROM "ProcurementRecord" ORDER BY "createdAt" DESC LIMIT 100`,
      [],
    );
    const records = rs.rows.map(rowToProcurementRecord);
    return NextResponse.json({
      ok: true,
      records,
      count: records.length,
      stages: PROCUREMENT_STAGES,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[procurement GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load procurement records.",
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
    const asset = typeof data.asset === "string" ? data.asset : null;
    const amountUsd = typeof data.amountUsd === "number" ? data.amountUsd : null;
    const quantity = typeof data.quantity === "number" ? data.quantity : null;

    const validAssets: BenchmarkPrice["asset"][] = ["gold", "silver", "sovereign", "stablecoin", "sukuk"];
    if (!asset || !validAssets.includes(asset as BenchmarkPrice["asset"])) {
      return NextResponse.json(
        { ok: false, error: `Invalid asset. Must be one of: ${validAssets.join(", ")}` },
        { status: 400 },
      );
    }
    if (amountUsd == null || amountUsd <= 0) {
      return NextResponse.json({ ok: false, error: "amountUsd must be > 0" }, { status: 400 });
    }
    if (quantity == null || quantity <= 0) {
      return NextResponse.json({ ok: false, error: "quantity must be > 0" }, { status: 400 });
    }

    const id = `PROC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const initialStage: ProcurementStage = "reserve_need";
    const stageHistory = JSON.stringify([
      { stage: "reserve_need", timestamp: now, status: "pending" as const },
    ]);

    await rawQuery(
      `INSERT INTO "ProcurementRecord" ("id","asset","amountUsd","quantity","currentStage","stageHistory","createdAt")
       VALUES (?,?,?,?,?,?,?)`,
      [id, asset, amountUsd, quantity, initialStage, stageHistory, now],
    );

    const rs = await rawQuery(
      `SELECT * FROM "ProcurementRecord" WHERE "id" = ?`,
      [id],
    );
    const record = rowToProcurementRecord(rs.rows[0]);

    return NextResponse.json(
      {
        ok: true,
        record,
        nextStageHint: "Advance via POST /api/commercial-governance/procurement/[id]/advance",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[procurement POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create procurement record.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

function rowToProcurementRecord(row: Record<string, unknown>): ProcurementRecord {
  return {
    id: row.id as string,
    asset: row.asset as ProcurementRecord["asset"],
    amountUsd: Number(row.amountUsd),
    quantity: Number(row.quantity),
    currentStage: row.currentStage as ProcurementRecord["currentStage"],
    stageHistory: JSON.parse((row.stageHistory as string) ?? "[]"),
    benchmark: row.benchmark ? JSON.parse(row.benchmark as string) : undefined,
    bestExecution: row.bestExecution ? JSON.parse(row.bestExecution as string) : undefined,
    dealer: (row.dealer as string) ?? undefined,
    executionPrice: row.executionPrice != null ? Number(row.executionPrice) : undefined,
    savings: row.savings != null ? Number(row.savings) : undefined,
    complianceResult: row.complianceResult
      ? JSON.parse(row.complianceResult as string)
      : undefined,
    auditId: (row.auditId as string) ?? undefined,
    createdAt: row.createdAt as string,
    completedAt: (row.completedAt as string) ?? undefined,
  };
}

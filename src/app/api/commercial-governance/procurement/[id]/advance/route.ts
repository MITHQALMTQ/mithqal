import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";
import {
  advanceProcurementStage,
  PROCUREMENT_STAGES,
  PROCUREMENT_STAGE_NAMES,
  type ProcurementRecord,
  type ProcurementStage,
} from "@/lib/commercial-governance";

/**
 * POST /api/commercial-governance/procurement/[id]/advance
 *
 * Advances a procurement record to the next stage in the 12-stage workflow
 * (Chapter XX §XX.7). Optional body:
 *   { nextStage?: ProcurementStage, data?: string }
 * If `nextStage` is omitted, advances to the next sequential stage.
 *
 * Returns the updated record with its full stage history.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;

    // Fetch the current record
    const rs = await rawQuery(
      `SELECT * FROM "ProcurementRecord" WHERE "id" = ?`,
      [id],
    );
    if (rs.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: `Procurement record ${id} not found` },
        { status: 404 },
      );
    }
    const record = rowToProcurementRecord(rs.rows[0]);

    // Parse optional body
    let nextStage: ProcurementStage | undefined;
    let data: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body === "object") {
        const b = body as Record<string, unknown>;
        if (typeof b.nextStage === "string") nextStage = b.nextStage as ProcurementStage;
        if (typeof b.data === "string") data = b.data;
      }
    } catch {
      // No body or invalid JSON — fall through to sequential advance
    }

    // Determine next stage if not provided
    if (!nextStage) {
      const currentIdx = PROCUREMENT_STAGES.indexOf(record.currentStage);
      if (currentIdx === -1 || currentIdx === PROCUREMENT_STAGES.length - 1) {
        return NextResponse.json(
          {
            ok: false,
            error: `Procurement is already at final stage ("${record.currentStage}"). Cannot advance further.`,
            record,
          },
          { status: 400 },
        );
      }
      nextStage = PROCUREMENT_STAGES[currentIdx + 1];
    }

    // Validate the requested stage
    if (!PROCUREMENT_STAGES.includes(nextStage)) {
      return NextResponse.json(
        { ok: false, error: `Invalid stage: ${nextStage}. Valid stages: ${PROCUREMENT_STAGES.join(", ")}` },
        { status: 400 },
      );
    }

    // Advance via the governance engine (validates sequential transition)
    const updated = advanceProcurementStage(record, nextStage, data);

    // Persist
    await rawQuery(
      `UPDATE "ProcurementRecord"
        SET "currentStage" = ?,
            "stageHistory" = ?,
            "completedAt" = ?
        WHERE "id" = ?`,
      [
        updated.currentStage,
        JSON.stringify(updated.stageHistory),
        updated.completedAt ?? null,
        id,
      ],
    );

    // Re-fetch the canonical row
    const rs2 = await rawQuery(
      `SELECT * FROM "ProcurementRecord" WHERE "id" = ?`,
      [id],
    );
    const refreshed = rowToProcurementRecord(rs2.rows[0]);

    return NextResponse.json({
      ok: true,
      record: refreshed,
      stageName: PROCUREMENT_STAGE_NAMES[refreshed.currentStage],
      stageIndex: PROCUREMENT_STAGES.indexOf(refreshed.currentStage) + 1,
      totalStages: PROCUREMENT_STAGES.length,
      isComplete: refreshed.currentStage === "archive",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[procurement advance] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not advance procurement stage.",
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

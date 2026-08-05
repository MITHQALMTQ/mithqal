import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";
import {
  verifyReserveOwnership,
  type ReserveOwnershipRecord,
} from "@/lib/commercial-governance";

/**
 * GET /api/commercial-governance/reserve-ownership
 *
 * Returns all reserve-ownership records and the constitutional verification
 * status (Chapter XX §XX.13).
 *
 * Reserve assets may ONLY be owned by the Markets entity acting on behalf
 * of the Institution. Any other owner is a constitutional violation.
 *
 * Public — discloses the reserve-ownership posture for transparency.
 */
export async function GET(): Promise<Response> {
  try {
    const rs = await rawQuery(
      `SELECT * FROM "ReserveOwnership" ORDER BY "assetClass" ASC`,
      [],
    );
    const records = rs.rows.map(rowToReserveOwnership);
    const verification = verifyReserveOwnership(records);

    const totalValueUsd = records.reduce((s, r) => s + r.valueUsd, 0);

    return NextResponse.json({
      ok: true,
      records,
      count: records.length,
      totalValueUsd,
      verification,
      timestamp: new Date().toISOString(),
      source: "commercial-governance-v20",
    });
  } catch (err) {
    console.error("[reserve-ownership GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load reserve ownership records.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

function rowToReserveOwnership(row: Record<string, unknown>): ReserveOwnershipRecord {
  return {
    assetClass: row.assetClass as ReserveOwnershipRecord["assetClass"],
    ownerEntity: row.ownerEntity as ReserveOwnershipRecord["ownerEntity"],
    custodian: row.custodian as string,
    amount: Number(row.amount),
    valueUsd: Number(row.valueUsd),
    verified: Boolean(row.verified),
    lastVerifiedAt: row.lastVerifiedAt as string,
  };
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveState } from "@/lib/testnet-engine";

// GET /api/testnet — derived reserve state + recent operations ledger.
export async function GET() {
  try {
    const ops = await db.testnetOperation.findMany({
      orderBy: { createdAt: "asc" },
      take: 1000,
    });
    const state = deriveState(ops);
    const recent = [...ops]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 25)
      .map((o) => ({
        id: o.id,
        type: o.type,
        amountUsd: o.amountUsd,
        mtq: o.mtq,
        participant: o.participant,
        nav: o.nav,
        reserveRatio: o.reserveRatio,
        porHash: o.porHash,
        createdAt: o.createdAt.toISOString(),
      }));
    return NextResponse.json({ ...state, operations: recent });
  } catch (err) {
    console.error("testnet state failed", err);
    return NextResponse.json({ error: "Could not load testnet state." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState } from "@/lib/testnet-engine";

// GET /api/testnet — derived reserve state + recent operations ledger +
// time-series chart data (supply, reserveRatio, NAV over time).
export async function GET() {
  try {
    await ensureSchema()
    const ops = await db.testnetOperation.findMany({
      orderBy: { createdAt: "asc" },
      take: 1000,
    });
    const state = deriveState(ops);

    // Build time-series for charts: replay ops in chronological order,
    // recording supply + ratio + NAV after each operation.
    const chartData: {
      index: number;
      time: string;
      supply: number;
      reserveRatio: number;
      nav: number;
      type: string;
    }[] = [];

    let runningSupply = 0;
    const chronological = [...ops].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Seed a "genesis" point at 0 if there are ops
    if (chronological.length > 0) {
      chartData.push({
        index: 0,
        time: new Date(chronological[0].createdAt.getTime() - 1000).toISOString(),
        supply: 0,
        reserveRatio: 100,
        nav: 1,
        type: "genesis",
      });
    }

    chronological.forEach((op, i) => {
      if (op.type === "mint") {
        runningSupply += op.mtq;
      } else {
        runningSupply -= op.mtq;
      }
      chartData.push({
        index: i + 1,
        time: op.createdAt.toISOString(),
        supply: runningSupply,
        reserveRatio: op.reserveRatio,
        nav: op.nav,
        type: op.type,
      });
    });

    const recent = chronological
      .slice()
      .reverse()
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

    return NextResponse.json({
      ...state,
      operations: recent,
      chartData,
    });
  } catch (err) {
    console.error("testnet state failed", err);
    return NextResponse.json({ error: "Could not load testnet state." }, { status: 500 });
  }
}

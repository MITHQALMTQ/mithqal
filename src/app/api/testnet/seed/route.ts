import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState, GENESIS } from "@/lib/testnet-engine";
import { getLiveOracleData } from "@/lib/live-oracle";
import { getOracleSnapshot } from "@/lib/oracle-client";

// POST /api/testnet/seed — seed a genesis deposit.
// Genesis mint: $50M deposit at NAV = $1.00 (initial state, no supply yet).
// After genesis, NAV = R_m / S = $50M / 50M MTQ = $1.00 (exact par).
// As gold prices change, NAV will drift from $1.00 (dynamic).
export async function POST() {
  try {
    await ensureSchema()
    const count = await db.testnetOperation.count();

    // Get live prices for dynamic revaluation
    const liveData = await getLiveOracleData();
    const oracleSnap = await getOracleSnapshot();
    const goldPrice = liveData.goldUsd;
    const silverPrice = oracleSnap.silverUsd > 0 ? oracleSnap.silverUsd : 58.76;

    if (count > 0) {
      const ops = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });
      const state = deriveState(ops, goldPrice, silverPrice);
      const recent = await recentOps();
      return NextResponse.json({ ok: true, seeded: false, state: { ...state, operations: recent } });
    }

    // Genesis: first mint at NAV = $1.00 (no supply → NAV defaults to 1.0)
    // Minted MTQ = Deposit / NAV = $50M / $1.00 = 50M MTQ
    const created = await db.testnetOperation.create({
      data: {
        type: "mint",
        amountUsd: GENESIS.amountUsd,
        mtq: GENESIS.amountUsd, // At genesis, NAV = $1.00, so mtq = deposit
        participant: GENESIS.participant,
        nav: 1.0,
        reserveRatio: 100,
        porHash: "",
      },
    });

    const ops = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });
    const state = deriveState(ops, goldPrice, silverPrice);
    await db.testnetOperation.update({
      where: { id: created.id },
      data: {
        nav: state.nav,
        reserveRatio: state.reserveRatio,
        porHash: state.porHash,
      },
    });

    const recent = await recentOps();
    return NextResponse.json({ ok: true, seeded: true, state: { ...state, operations: recent } });
  } catch (err) {
    console.error("testnet seed failed", err);
    return NextResponse.json({ error: "Seed failed." }, { status: 500 });
  }
}

async function recentOps() {
  const ops = await db.testnetOperation.findMany({ orderBy: { createdAt: "desc" }, take: 25 });
  return ops.map((o) => ({
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
}

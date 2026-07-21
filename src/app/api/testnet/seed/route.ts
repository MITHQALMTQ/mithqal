import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveState, GENESIS, PAR } from "@/lib/testnet-engine";

// POST /api/testnet/seed — seed a genesis deposit so the dashboard isn't
// empty on first visit. Idempotent: only inserts if the ledger is empty.
export async function POST() {
  try {
    const count = await db.testnetOperation.count();
    if (count > 0) {
      const ops = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });
      const state = deriveState(ops);
      const recent = await recentOps();
      return NextResponse.json({ ok: true, seeded: false, state: { ...state, operations: recent } });
    }

    const created = await db.testnetOperation.create({
      data: {
        type: "mint",
        amountUsd: GENESIS.amountUsd,
        mtq: GENESIS.amountUsd / PAR,
        participant: GENESIS.participant,
        nav: 0,
        reserveRatio: 0,
        porHash: "",
      },
    });

    const ops = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });
    const state = deriveState(ops);
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

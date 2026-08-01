import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState, computeRedemption } from "@/lib/testnet-engine";
import { getLiveOracleData } from "@/lib/live-oracle";
import { getOracleSnapshot } from "@/lib/oracle-client";

// POST /api/testnet/redeem — burn MTQ for proportional reserves.
// §36.3: Redemption Value = Burned MTQ × Current NAV
// NAV is DYNAMIC (§3.1: NAV_m = R_m / S) — NOT pegged to $1.
// If reserves > supply (NAV > $1), you get MORE dollars per MTQ.
// Redemption is NEVER suspended (constitutional invariant).
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const mtq = typeof data.mtq === "number" ? data.mtq : Number(data.mtq);
  const participant =
    typeof data.participant === "string" ? data.participant.trim().slice(0, 80) : "";

  if (!Number.isFinite(mtq) || mtq <= 0) {
    return NextResponse.json({ error: "mtq must be a positive number." }, { status: 400 });
  }
  if (!participant) {
    return NextResponse.json({ error: "participant label is required." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const ops = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });

    // Get live gold + silver prices for dynamic reserve revaluation
    const liveData = await getLiveOracleData();
    const oracleSnap = await getOracleSnapshot();
    const goldPrice = liveData.goldUsd;
    const silverPrice = oracleSnap.silverUsd > 0 ? oracleSnap.silverUsd : 58.76;

    const stateBefore = deriveState(ops, goldPrice, silverPrice);
    const outcome = computeRedemption(stateBefore, mtq);
    if (!outcome.valid) {
      return NextResponse.json({ error: outcome.reason }, { status: 400 });
    }

    const created = await db.testnetOperation.create({
      data: {
        type: "redeem",
        amountUsd: outcome.claimUsd,
        mtq,
        participant,
        nav: outcome.nav,
        reserveRatio: stateBefore.reserveRatio,
        porHash: "",
      },
    });

    const allOps = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });
    const stateAfter = deriveState(allOps, goldPrice, silverPrice);

    await db.testnetOperation.update({
      where: { id: created.id },
      data: {
        nav: stateAfter.nav,
        reserveRatio: stateAfter.reserveRatio,
        porHash: stateAfter.porHash,
      },
    });

    const recent = await recentOps();
    return NextResponse.json({
      ok: true,
      feeUsd: outcome.feeUsd,
      netUsd: outcome.netUsd,
      claimUsd: outcome.claimUsd,
      nav: outcome.nav,
      state: { ...stateAfter, operations: recent },
    });
  } catch (err) {
    console.error("testnet redeem failed", err);
    return NextResponse.json({ error: "Redemption failed." }, { status: 500 });
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

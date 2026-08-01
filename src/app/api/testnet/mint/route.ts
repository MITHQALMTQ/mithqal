import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState, canMint, computeMint } from "@/lib/testnet-engine";
import { getLiveOracleData } from "@/lib/live-oracle";
import { getOracleSnapshot } from "@/lib/oracle-client";

// POST /api/testnet/mint — mint MTQ against a verified reserve deposit.
// §36.2: Minted MTQ = (Deposit - Fee) / Current NAV
// NAV is DYNAMIC (§3.1: NAV_m = R_m / S) — NOT pegged to $1.
// If reserves > supply (ratio > 100%), NAV > $1 → you get FEWER MTQ per dollar.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const amountUsd = typeof data.amountUsd === "number" ? data.amountUsd : Number(data.amountUsd);
  const participant =
    typeof data.participant === "string" ? data.participant.trim().slice(0, 80) : "";

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return NextResponse.json({ error: "amountUsd must be a positive number." }, { status: 400 });
  }
  if (amountUsd > 1_000_000_000) {
    return NextResponse.json({ error: "amountUsd exceeds the 1B cap." }, { status: 400 });
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
    const guard = canMint(stateBefore);
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.reason ?? "Minting paused.", reserveRatio: stateBefore.reserveRatio },
        { status: 409 }
      );
    }

    // §36.2: Minted MTQ = (Deposit - Fee) / Current NAV
    const outcome = computeMint(stateBefore, amountUsd);
    if (!outcome.valid) {
      return NextResponse.json({ error: outcome.reason }, { status: 400 });
    }

    const created = await db.testnetOperation.create({
      data: {
        type: "mint",
        amountUsd,
        mtq: outcome.mtq,
        participant,
        nav: outcome.nav,
        reserveRatio: stateBefore.reserveRatio,
        porHash: "",
      },
    });

    // Recompute the post-op state with live prices
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
      netDepositUsd: outcome.netDepositUsd,
      mtq: outcome.mtq,
      nav: outcome.nav,
      state: { ...stateAfter, operations: recent },
    });
  } catch (err) {
    console.error("testnet mint failed", err);
    return NextResponse.json({ error: "Mint failed." }, { status: 500 });
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

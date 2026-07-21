import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveState, computeRedemption, PAR } from "@/lib/testnet-engine";

// POST /api/testnet/redeem — burn MTQ for proportional reserves.
// Redemption is NEVER suspended (constitutional invariant). A 0.05% fee
// is deducted from the claim.
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
    const ops = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });
    const stateBefore = deriveState(ops);
    const outcome = computeRedemption(stateBefore, mtq);
    if (!outcome.valid) {
      return NextResponse.json({ error: outcome.reason }, { status: 400 });
    }

    // Record the burn. amountUsd stored is the gross claim (pre-fee) so the
    // ledger reflects the proportional reserves removed; fee captured in
    // the response.
    const created = await db.testnetOperation.create({
      data: {
        type: "redeem",
        amountUsd: outcome.claimUsd,
        mtq,
        participant,
        nav: 0,
        reserveRatio: 0,
        porHash: "",
      },
    });

    const allOps = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });
    const stateAfter = deriveState(allOps);

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

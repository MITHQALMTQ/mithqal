import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveState, canMint, PAR } from "@/lib/testnet-engine";

// POST /api/testnet/mint — mint MTQ 1:1 against a verified (simulated)
// reserve deposit. Enforces the 100%+ reserve invariant: minting is paused
// if the reserve ratio is below 100%.
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
    const ops = await db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } });
    const stateBefore = deriveState(ops);
    const guard = canMint(stateBefore);
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.reason ?? "Minting paused.", reserveRatio: stateBefore.reserveRatio },
        { status: 409 }
      );
    }

    // 1 MTQ per $1 deposited at par.
    const mtq = amountUsd / PAR;

    const created = await db.testnetOperation.create({
      data: {
        type: "mint",
        amountUsd,
        mtq,
        participant,
        nav: 0, // placeholder; recompute below
        reserveRatio: 0,
        porHash: "",
      },
    });

    // Recompute the post-op state so we can persist the authoritative NAV,
    // reserve ratio and PoR hash on the operation itself (auditability).
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
    return NextResponse.json({ ok: true, state: { ...stateAfter, operations: recent } });
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

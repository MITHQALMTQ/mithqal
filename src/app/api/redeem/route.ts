import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { redemptionFee } from "@/lib/monetary-engine-v19";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/redeem — Record a redeem (burn) transaction.
 *
 * Constitutional context (§9 + §12 of v19.0):
 *   - Redemption is NEVER suspended (constitutional invariant). Even when
 *     minting is paused, holders can always burn MTQ for proportional
 *     reserves.
 *   - Redemption fee: 0.05% (5 bps), capped at $5,000 per Constitution §9.2.
 *
 * Trust model:
 *   - The backend never holds the redeemer's private key. The redeemer
 *     signs the burn transaction client-side via MetaMask (or cast send)
 *     and submits this endpoint with the resulting tx_hash AFTER the
 *     transaction is mined. The backend only persists the audit record.
 *
 * Request body:
 *   { mtqAmount: number, fromAddress: string, txHash: string, blockNumber?: number }
 *
 * Returns:
 *   { ok: true, txHash, type: "redeem", mtqAmount, fee, recorded: true }
 */
export async function POST(req: Request) {
  // Auth-gate: operator session required for now. Once the indexer is
  // fully permissionless, this gate can be relaxed to "any signed
  // message from fromAddress" (EIP-191) — but until then the operator
  // curates which redemptions get recorded.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Defense-in-depth rate limit.
  const blocked = enforceRateLimit("redeem", req, 60, 60_000); // 60/min/IP
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const mtqAmount =
    typeof data.mtqAmount === "number" ? data.mtqAmount : Number(data.mtqAmount);
  const fromAddress =
    typeof data.fromAddress === "string" ? data.fromAddress.trim() : "";
  const txHash = typeof data.txHash === "string" ? data.txHash.trim() : "";
  const blockNumber =
    typeof data.blockNumber === "number"
      ? data.blockNumber
      : typeof data.blockNumber === "string"
        ? Number(data.blockNumber)
        : undefined;

  // ---- Validation ----
  if (!Number.isFinite(mtqAmount) || mtqAmount <= 0) {
    return NextResponse.json({ error: "mtqAmount must be a positive number." }, { status: 400 });
  }
  if (mtqAmount > 1_000_000_000) {
    return NextResponse.json({ error: "mtqAmount exceeds the 1B sanity cap." }, { status: 400 });
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(fromAddress)) {
    return NextResponse.json(
      { error: "fromAddress must be a valid Ethereum address." },
      { status: 400 }
    );
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json(
      { error: "txHash must be a valid 0x-prefixed 32-byte hash." },
      { status: 400 }
    );
  }
  if (blockNumber !== undefined && (!Number.isFinite(blockNumber) || blockNumber < 0)) {
    return NextResponse.json(
      { error: "blockNumber must be a non-negative integer." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();

    // Testnet NAV is pinned at 1.0 (1 MTQ = 1 USD) — so the USD value of
    // the MTQ being redeemed is numerically equal to mtqAmount.
    const navUsd = 1.0;
    const claimUsd = mtqAmount * navUsd;

    // §9.2 — Redemption fee: 0.05% (5 bps), capped at $5,000.
    const fee = redemptionFee(claimUsd);

    // MTQ has 18 decimals.
    const amountWei = toWei(mtqAmount, 18);
    const feeWei = toWei(fee / navUsd, 18);

    // Fees table stores USD amounts with 8 decimals (matches MockOracle).
    const feeUsd8Dec = toFixedDecimals(fee, 8);

    // Redeem (burn): from the redeemer, to the zero address.
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    await db.transactions.create({
      data: {
        txHash,
        type: "redeem",
        fromAddress,
        toAddress: ZERO_ADDRESS,
        amount: amountWei,
        fee: feeWei,
        blockNumber: blockNumber ?? null,
      },
    });

    await db.fees.create({
      data: {
        txHash,
        feeType: "redeem",
        amount: feeUsd8Dec,
      },
    });

    return NextResponse.json({
      ok: true,
      txHash,
      type: "redeem",
      mtqAmount,
      claimUsd,
      nav: navUsd,
      fee,
      feeUsd8Dec,
      amountWei,
      feeWei,
      recorded: true,
    });
  } catch (err) {
    console.error("redeem record failed:", err);
    return NextResponse.json(
      {
        error: "Could not record redeem transaction.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

/**
 * Convert a decimal number to a fixed-decimal wei-style string using
 * string manipulation (avoids BigInt/Number precision limits).
 *
 *   toWei(1234.56, 18) -> "1234560000000000000000"
 *   toWei(0.05, 18)    -> "50000000000000000"
 */
function toWei(amount: number, decimals: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  // Use up to 6 fractional digits of input to avoid carrying float noise.
  const rounded = Math.round(abs * 1e6) / 1e6;
  const [wholeStr, fracStr = ""] = rounded.toString().split(".");
  const fracPadded = (fracStr + "0".repeat(decimals)).slice(0, decimals);
  const combined = (wholeStr + fracPadded).replace(/^0+(?=\d)/, "");
  return sign + (combined || "0");
}

/** Format a USD amount as a fixed-decimals string (e.g. 8 for fees table). */
function toFixedDecimals(amount: number, decimals: number): string {
  if (!Number.isFinite(amount)) return "0";
  const scaled = Math.round(amount * Math.pow(10, decimals));
  return scaled.toString();
}

import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { TRANSFER_FEE_CAP } from "@/lib/monetary-engine-v19";

/**
 * POST /api/transfer — Record a transfer (peer-to-peer MTQ movement).
 *
 * Constitutional context (§9.3 of v19.0):
 *   - Transfer fee: 0.01% (1 bps), capped at $1,000.
 *   - This is informational ONLY — the actual transfer happens on-chain
 *     via MetaMask (ERC-20 transfer). The backend simply records the
 *     resulting tx_hash after the transaction is mined.
 *
 * Trust model:
 *   - Public endpoint (no auth required — anyone with a wallet can
 *     transfer MTQ to anyone else).
 *   - Rate limited: 20 transfers per minute per IP (protects against
 *     spamming the indexer with bogus records).
 *   - The backend does NOT verify the tx_hash on-chain (yet). When the
 *     indexer is fully wired, it should call eth_getTransactionReceipt
 *     to confirm the tx is mined and the from/to/amount match before
 *     persisting. For now, the operator can spot-check via the explorer.
 *
 * Request body:
 *   { fromAddress: string, toAddress: string, amount: string (wei), txHash: string, blockNumber?: number }
 *
 * Returns:
 *   { ok: true, txHash, type: "transfer", amount, fee, recorded: true }
 */
export async function POST(req: Request) {
  // Public endpoint, but rate-limited (20 transfers/min/IP).
  const blocked = enforceRateLimit("transfer", req, 20, 60_000);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const fromAddress =
    typeof data.fromAddress === "string" ? data.fromAddress.trim() : "";
  const toAddress =
    typeof data.toAddress === "string" ? data.toAddress.trim() : "";
  const amount =
    typeof data.amount === "string" ? data.amount.trim() : "";
  const txHash = typeof data.txHash === "string" ? data.txHash.trim() : "";
  const blockNumber =
    typeof data.blockNumber === "number"
      ? data.blockNumber
      : typeof data.blockNumber === "string"
        ? Number(data.blockNumber)
        : undefined;

  // ---- Validation ----
  if (!/^0x[a-fA-F0-9]{40}$/.test(fromAddress)) {
    return NextResponse.json(
      { error: "fromAddress must be a valid Ethereum address." },
      { status: 400 }
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
    return NextResponse.json(
      { error: "toAddress must be a valid Ethereum address." },
      { status: 400 }
    );
  }
  if (fromAddress.toLowerCase() === toAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "fromAddress and toAddress must differ." },
      { status: 400 }
    );
  }
  if (!/^\d+$/.test(amount)) {
    return NextResponse.json(
      { error: "amount must be a non-negative integer wei string." },
      { status: 400 }
    );
  }
  if (amount === "0") {
    return NextResponse.json(
      { error: "amount must be greater than zero." },
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

    // Testnet NAV is pinned at 1.0 (1 MTQ = 1 USD).
    const navUsd = 1.0;

    // Convert wei amount to MTQ (18 decimals), then to USD.
    const amountBigInt = BigInt(amount);
    const mtqAmount = Number(amountBigInt) / 1e18;

    // §9.3 — Transfer fee: 0.01% (1 bps), capped at $1,000.
    // Informational only — the actual fee (if any) is collected on-chain
    // via the MTQ contract's transfer hook. We record it here so the
    // transparency dashboard can show the projected fee revenue.
    const feeUsd = Math.min(mtqAmount * navUsd * 0.0001, TRANSFER_FEE_CAP);

    // Convert USD fee to wei (treating 1 MTQ = 1 USD on testnet).
    const feeWei = feeUsd > 0 ? toWei(feeUsd / navUsd, 18) : "0";
    const feeUsd8Dec = toFixedDecimals(feeUsd, 8);

    await db.transactions.create({
      data: {
        txHash,
        type: "transfer",
        fromAddress,
        toAddress,
        amount,
        fee: feeWei,
        blockNumber: blockNumber ?? null,
      },
    });

    if (feeUsd > 0) {
      await db.fees.create({
        data: {
          txHash,
          feeType: "transfer",
          amount: feeUsd8Dec,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      txHash,
      type: "transfer",
      amount,
      mtqAmount,
      nav: navUsd,
      fee: feeUsd,
      feeUsd8Dec,
      feeWei,
      recorded: true,
    });
  } catch (err) {
    console.error("transfer record failed:", err);
    return NextResponse.json(
      {
        error: "Could not record transfer transaction.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

/**
 * Convert a decimal number to a fixed-decimal wei-style string using
 * string manipulation (avoids BigInt/Number precision limits).
 */
function toWei(amount: number, decimals: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
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

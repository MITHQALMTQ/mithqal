import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { redemptionFee } from "@/lib/monetary-engine-v19";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  computeLiveNav,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/nav-compute";

/**
 * POST /api/redeem — Record a redeem (burn) transaction.
 *
 * Constitutional context (§9 + §12 + §36.3 of v19.0.2):
 *   - §36.3: Redemption Value = Burned MTQ × Current NAV_m
 *     The NAV is DYNAMIC (§3.1: NAV_m = R_m / S) — NOT pinned to $1.00.
 *     With the v19.0.2 over-collateralized baseline (RR ≈ 102%), NAV_m is
 *     typically ~$1.04, so burning 1,000 MTQ yields ~$1,040 USD (or its
 *     equivalent in any of the 8 basket currencies, or gold/silver ounces).
 *   - §36.3: Redemption is NEVER suspended (constitutional invariant).
 *     Even when minting is paused (RR<100% or basket-verification failed),
 *     holders can always burn MTQ for proportional reserves. This route
 *     therefore does NOT check the minting-pause flag.
 *   - §36.3 multi-currency redemption: the USD claim can be paid out in any
 *     of the 8 basket currencies (USD/EUR/JPY/GBP/CNY/CHF/AUD/CAD) or in
 *     gold (XAU) / silver (XAG) ounces, at the redeemer's option.
 *   - §9.2 Redemption fee: 0.05% (5 bps), capped at $5,000.
 *
 * Trust model (testnet):
 *   - Public endpoint (no operator auth required for testnet simulation).
 *     The frontend submits a MetaMask-signed mock burn transaction and
 *     posts the resulting tx_hash here for the indexer to record.
 *   - Rate-limited to 10 redeems/min/IP.
 *   - On mainnet, this endpoint should require an EIP-191 signed message
 *     from `fromAddress` to authenticate the burn request before recording.
 *
 * Request body:
 *   {
 *     mtqAmount: number,      // MTQ to burn (18-decimal ERC-20 units, in MTQ)
 *     fromAddress: string,    // 0x-prefixed 20-byte Ethereum address (burner)
 *     txHash: string,         // 0x-prefixed 32-byte transaction hash
 *     currency?: string,      // optional payout currency (default "USD")
 *                             // one of: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD, XAU, XAG
 *     blockNumber?: number,   // optional chain block number
 *   }
 *
 * Returns:
 *   {
 *     ok: true, txHash, type: "redeem",
 *     mtqAmount, currency,    // echo of the burn + payout currency
 *     claimAmount,            // payout in requested currency
 *     claimUsd,               // USD-equivalent of the claim (live FX conversion)
 *     nav,                    // dynamic NAV_m used (≈ $1.04 at baseline, NOT $1.00)
 *     fee,                    // §9.2 redemption fee in USD
 *     fxRate,                 // FX rate used (foreign per USD), or null for USD/XAU/XAG
 *     goldUsd,                // live gold spot price (for transparency)
 *     reserveRatio,           // §4 reserve ratio (percentage)
 *     recorded: true
 *   }
 */
export async function POST(req: Request) {
  // Public endpoint (testnet simulation), but rate-limited (10 redeems/min/IP).
  // On mainnet: require EIP-191 signature from fromAddress for authentication.
  const blocked = enforceRateLimit("redeem", req, 10, 60_000);
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
  const currencyRaw =
    typeof data.currency === "string" ? data.currency.trim().toUpperCase() : "USD";
  const blockNumber =
    typeof data.blockNumber === "number"
      ? data.blockNumber
      : typeof data.blockNumber === "string"
        ? Number(data.blockNumber)
        : undefined;

  // ---- Validation ----
  if (!Number.isFinite(mtqAmount) || mtqAmount <= 0) {
    return NextResponse.json(
      { error: "mtqAmount must be a positive number." },
      { status: 400 }
    );
  }
  if (mtqAmount > 1_000_000_000_000) {
    return NextResponse.json(
      { error: "mtqAmount exceeds the 1T sanity cap." },
      { status: 400 }
    );
  }
  if (!currencyRaw || !isSupportedCurrency(currencyRaw)) {
    return NextResponse.json(
      {
        error: `currency must be one of: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD, XAU, XAG. Got: ${currencyRaw || "(empty)"}`,
      },
      { status: 400 }
    );
  }
  const currency = currencyRaw as SupportedCurrency;
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

    // ---- Fetch the LIVE dynamic NAV (§3.1, §36.3) ----
    // Previously pinned at $1.00 — this was the v19.0.2 critical bug.
    const navResult = await computeLiveNav();

    // §36.3 Redemption is NEVER suspended — do NOT check mintingPaused here.

    // ---- v20 Recommendation 2: Graduated Redemption Throttle ----
    // When RR ∈ [100%, 102%]: limit redemption to 5% of supply per 24h
    // When RR < 100%: limit redemption to 2% of supply per 24h
    // This is a RATE LIMITER, NOT a pause — §34 "redemption never paused" is preserved.
    const rr = navResult.reserveRatio;
    const supply = navResult.supply;
    let throttleLimitPct = 1.0; // 100% — no throttle when RR > 102%
    let throttleReason = "normal — no throttle (RR > 102%)";
    if (rr < 100) {
      throttleLimitPct = 0.02; // 2% of supply per 24h when RR < 100%
      throttleReason = `stress throttle (RR ${rr.toFixed(2)}% < 100%) — max 2% of supply per 24h`;
    } else if (rr < 102) {
      throttleLimitPct = 0.05; // 5% of supply per 24h when RR ∈ [100%, 102%]
      throttleReason = `elevated throttle (RR ${rr.toFixed(2)}% ∈ [100%, 102%]) — max 5% of supply per 24h`;
    }
    const maxRedeemPer24h = supply * throttleLimitPct;
    // Check cumulative redemptions in the last 24h (from DB)
    const recentRedemptions = await db.testnetOperation.findMany({
      where: { type: "redeem", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { mtq: true },
    }).catch(() => []);
    const cumulativeRedeemed = recentRedemptions.reduce((sum, r) => sum + (r.mtq || 0), 0);
    if (cumulativeRedeemed + mtqAmount > maxRedeemPer24h) {
      return NextResponse.json({
        error: `Redemption throttle active: ${throttleReason}. Cumulative 24h: ${cumulativeRedeemed.toFixed(2)} MTQ, requested: ${mtqAmount} MTQ, limit: ${maxRedeemPer24h.toFixed(0)} MTQ. Please retry later — redemption is never paused, only rate-limited during stress.`,
        throttleReason,
        cumulativeRedeemed,
        maxRedeemPer24h,
        rr: rr.toFixed(2),
      }, { status: 429 });
    }

    // ---- §36.3 Redemption formula: Claim = Burned MTQ × Current NAV ----
    const navUsd = navResult.navM; // dynamic market NAV (≈ $1.04 at baseline)
    const claimUsd = mtqAmount * navUsd;

    // ---- Convert USD claim to the requested payout currency (§36.3) ----
    // FX convention: fxRates[c] is "foreign currency units per 1 USD"
    // (e.g. EUR=0.87 means 1 USD = 0.87 EUR). So foreign = USD × fx.
    let claimAmount: number;
    let fxRateEcho: number | null;
    if (currency === "USD") {
      claimAmount = claimUsd;
      fxRateEcho = 1;
    } else if (currency === "XAU") {
      claimAmount = claimUsd / navResult.goldUsd; // USD → gold ounces
      fxRateEcho = null;
    } else if (currency === "XAG") {
      claimAmount = claimUsd / navResult.silverUsd; // USD → silver ounces
      fxRateEcho = null;
    } else {
      const fx = navResult.fxRates[currency];
      if (!fx || fx <= 0) {
        return NextResponse.json(
          { error: `Unsupported or unavailable currency: ${currency}` },
          { status: 400 }
        );
      }
      claimAmount = claimUsd * fx;
      fxRateEcho = fx;
    }

    if (!Number.isFinite(claimAmount) || claimAmount <= 0) {
      return NextResponse.json(
        { error: "Claim amount must be positive." },
        { status: 400 }
      );
    }

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
      currency,
      claimAmount,
      claimUsd,
      // Dynamic NAV used (NOT $1.00 — this is the v19.0.2 fix)
      nav: navUsd,
      // §9.2 fee
      fee,
      feeUsd8Dec,
      // wei strings (for on-chain parity)
      amountWei,
      feeWei,
      // FX transparency
      fxRate: fxRateEcho,
      goldUsd: navResult.goldUsd,
      silverUsd: navResult.silverUsd,
      // §4 reserve ratio (so the UI can show health)
      reserveRatio: navResult.reserveRatio,
      basketVerified: navResult.basketVerified,
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
  // Round to the requested decimals, then represent as integer string.
  const scaled = Math.round(amount * Math.pow(10, decimals));
  return scaled.toString();
}

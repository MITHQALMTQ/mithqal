import { NextResponse } from "next/server";
import { computeTgbs } from "@/lib/tokenized-gold-oracle";

/**
 * GET /api/v24.2.1/tgbs
 *
 * §18 — Tokenized Gold Basis Spread
 *   TGBS = (P_PAXGMarket − P_GoldNAV) / P_GoldNAV
 *
 * Uses the SEPARATED oracle architecture (§21):
 *   - Oracle A (GoldNAV): gold-api.com + goldprice.org → reserve accounting
 *   - Oracle B (PAXG market): CoinGecko pax-gold → TGBS / liquidity
 *
 * The reserve NEVER uses PAXG market price for valuation. TGBS monitors
 * market dislocation; a persistent severe spread + impaired redemption
 * MAY trigger PAXG suspension.
 */
export async function GET() {
  try {
    const tgbs = await computeTgbs();
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      version: "v24.2.1",
      section: "§18 — Tokenized Gold Basis Spread",
      formula: "TGBS = (P_PAXGMarket − P_GoldNAV) / P_GoldNAV",
      spread: tgbs.spread,
      spreadPct: tgbs.spreadPct,
      goldNavPrice: tgbs.goldNavPrice,
      paxgMarketPrice: tgbs.paxgMarketPrice,
      paxgAvailable: tgbs.paxgAvailable,
      state: tgbs.state,
      reason: tgbs.reason,
      bands: {
        normal: "< 0.5% absolute",
        elevated: "0.5% – 2% absolute",
        severe: "> 2% absolute (investigate suspension if persistent + impaired redemption)",
      },
      oracleArchitecture: "§21 separated: GoldNAV (reserve) ≠ PAXG market (TGBS)",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "TGBS computation failed", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

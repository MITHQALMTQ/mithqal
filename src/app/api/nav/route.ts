import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";

/**
 * GET /api/nav — The SINGLE source of truth for MTQ's live NAV.
 *
 * Every page and component that displays "1 MTQ = $X" MUST fetch from
 * this endpoint. This ensures price consistency across the entire site.
 *
 * Background (Task 5-a — Price Unification):
 *   Previously there were THREE divergent NAV computation paths:
 *     1. /api/contract/info       — used totalSupply=50M + ad-hoc §23 ratios
 *     2. /api/transparency        — used deriveState() (testnet simulator)
 *     3. /api/mint + /api/redeem  — used computeLiveNav() (54M supply, v19.0.2
 *                                   baseline composition)
 *   This produced three different "1 MTQ = $X" numbers across the site.
 *
 *   Now every caller reads from THIS endpoint (or directly from
 *   `computeLiveNav()` for the routes that already use it — mint, redeem,
 *   transfer, contract/info, transparency, stress-test-proof, public-site
 *   hero, testnet banner). The unified baseline is:
 *
 *     - Cash:        $29,250,000  (v19.0.2 §4 over-collateralization baseline)
 *     - Sovereign:   $13,500,000  (US T-bills ≤1yr)
 *     - Gold:        2,122.86 oz  (FIXED physical quantity, revalued at live P)
 *     - Silver:      36,758 oz    (FIXED physical quantity, revalued at live P)
 *     - Stablecoins: $2,700,000   (regulated USDC/USDT/DAI)
 *     - Supply:      54,000,000 MTQ
 *
 * Returns:
 *   {
 *     navM: number,          // §3.1 Market NAV (R_m / S) — the display price
 *     navL: number,          // §3.2 Prudential NAV (R_a / S)
 *     navStress: number,     // §3.3 Stress NAV (R_l / S)
 *     reserveRatio: number,  // §4 RR% (R_a / (S × PAR))
 *     goldUsd: number,       // Live gold spot (USD/oz)
 *     silverUsd: number,     // Live silver spot (USD/oz)
 *     fxRates: Record<string, number>,  // foreign currency units per 1 USD
 *     supply: number,        // MTQ supply used in NAV (54M)
 *     mintingPaused: boolean,
 *     basketVerified: boolean,
 *     reserveMarketUsd: number,   // R_m total
 *     reserveAdjustedUsd: number, // R_a total
 *     sources: string[],
 *     timestamp: string,
 *     source: "live-oracle-v19.0.2"
 *   }
 */
export async function GET() {
  try {
    const nav = await computeLiveNav();
    return NextResponse.json({
      navM: nav.navM,
      navL: nav.navL,
      navStress: nav.navStress,
      reserveRatio: nav.reserveRatio,
      goldUsd: nav.goldUsd,
      silverUsd: nav.silverUsd,
      fxRates: nav.fxRates,
      supply: nav.supply,
      mintingPaused: nav.mintingPaused,
      basketVerified: nav.basketVerified,
      reserveMarketUsd: nav.reserveMarketUsd,
      reserveAdjustedUsd: nav.reserveAdjustedUsd,
      sources: nav.sources,
      timestamp: new Date().toISOString(),
      source: "live-oracle-v23",
      // v23 Layer 2: Advisory metrics
      gei: nav.gei,
      bri: nav.bri,
      lci: nav.lci,
      gacr: nav.gacr,
      // v23: Concentration analysis
      usdConcentration: nav.usdConcentration,
      currencyConcentration: nav.currencyConcentration,
      pillarBreakdown: nav.pillarBreakdown,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to compute live NAV",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

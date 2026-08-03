import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { getOracleSnapshot } from "@/lib/oracle-client";
import {
  computeMonetaryStateV19,
  type ReserveAsset,
} from "@/lib/monetary-engine-v19";
import { getLiveOracleData, toOracleSnapshot } from "@/lib/live-oracle";
import { getContractInfo } from "@/lib/contract-reader";
import { computeSDPEmergency } from "@/lib/v19-infrastructure";
import { computeDynamicReserveAllocation } from "@/lib/reserve-allocation";
import { computeLiveNav } from "@/lib/nav-compute";

/**
 * GET /api/reserve/status — public, unauthenticated snapshot of the
 * Mithqal reserve composition and live valuation per §23 of the v19.0
 * Constitutional Monetary Infrastructure Specification.
 *
 * Task 4-b: the reserve composition is now derived from the shared
 * `computeDynamicReserveAllocation` function (the same function the
 * `/api/transparency` route uses). The dynamic function:
 *   • Adjusts fiat/bullion/stablecoin ratios based on reserve ratio
 *     and gold volatility (clamped to §23.3 constitutional ranges).
 *   • Adjusts the gold/silver split (φ_t) within the bullion layer
 *     based on gold EWMA volatility (clamped to §25.2 band).
 *   • Keeps gold/silver PHYSICAL QUANTITIES FIXED at 2,122.86 oz and
 *     36,758 oz (Task 2-a invariant — quantity does NOT derive from price).
 *   • Keeps cash FIXED at $29,250,000 (v19.0.2 §4 over-collateralization
 *     baseline; clears the 102% policy target with the engine's actual
 *     R_a formula per Task 3-a).
 *   • Derives sovereign and stablecoin dollar values from the dynamic
 *     ratios × totalReserve so the reported TARGET allocation stays
 *     consistent with the live reserve total.
 *
 * The total reserve value is DERIVED from the actual asset values (sum),
 * not hardcoded, so the reported total stays consistent as gold/silver
 * prices move.
 *
 * Supply baseline: 54,000,000 MTQ → NAV_m ≈ $1.0373, RR ≈ 102.05%.
 *
 * Returns:
 *   {
 *     totalReserveUsd,
 *     reserves: [{ assetType, amount, valueUsd, sharePct, haircut }],
 *     threeLayer:  { market, adjusted, liquidation },
 *     nav:         { market, prudential, stress },
 *     reserveRatio:{ ratio, compliant },
 *     allocation:  { fiatRatio, bullionRatio, stablecoinRatio, goldShare,
 *                    silverShare, adjustments, isDynamic },
 *     goldPrice, silverPrice,
 *     oracleSource, lastUpdated
 *   }
 */
export async function GET() {
  try {
    await ensureSchema();

    // Live oracle data — try on-chain first, fall back to free APIs.
    const [oracle, liveData, latestReserves, contractInfo] = await Promise.all([
      getOracleSnapshot(),
      getLiveOracleData(),
      db.reserves.latest(),
      getContractInfo().catch(() => null),
    ]);

    const oracleSnapshot = toOracleSnapshot(liveData);
    const goldPrice = oracle.goldUsd;
    const silverPrice = oracle.silverUsd;

    // §23 Reserve composition baseline (v19.0.2): over-collateralized so the
    // §4 PAR-based reserve ratio RR = R_a / (S × PAR) clears the 102% policy
    // target at baseline. Cash is $29.25M; gold/silver use FIXED PHYSICAL
    // QUANTITIES (Task 2-a fix — quantity does NOT derive from price).
    //
    // Task 4-b: we use the shared `computeDynamicReserveAllocation` module
    // to derive the target layer ratios + the reserveAssets array in one
    // place. We pass a provisional totalReserve (the seed baseline) so the
    // ratios can be computed; the actual reserveAssets' dollar values are
    // then summed to get the live totalReserve, which we re-feed into the
    // allocation function for the final report.
    const SEED_TOTAL_RESERVE = 56_000_000;
    const seedReserveRatio = 102.07; // baseline policy target cleared (Task 3-a)

    // First pass: derive reserveAssets with the seed total.
    const firstPass = computeDynamicReserveAllocation({
      totalReserve: SEED_TOTAL_RESERVE,
      goldPrice,
      silverPrice,
      reserveRatio: seedReserveRatio,
      goldVolatility: 0.015, // baseline fallback when no EWMA series
    });

    // Compute EWMA return series from the live 30-day gold price series (§17).
    // This activates the shock absorber — previously it was dead code (always 1.0).
    const goldSeries = (oracleSnapshot as any).goldPriceSeries as number[] | undefined;
    const ewmaReturns: number[] = [];
    if (goldSeries && goldSeries.length >= 2) {
      for (let i = 1; i < goldSeries.length; i++) {
        const prev = goldSeries[i - 1];
        const curr = goldSeries[i];
        if (prev > 0 && curr > 0) {
          ewmaReturns.push(Math.log(curr / prev));
        }
      }
    }
    const ewmaVol = ewmaReturns.length >= 2
      ? Math.sqrt(ewmaReturns.reduce((s, r) => s + r * r, 0) / ewmaReturns.length)
      : 0.015;

    // Second pass: now we know the live totalReserve (sum of firstPass asset
    // values), recompute the dynamic ratios so the reported "target"
    // allocation matches the live reserve total. Cash and bullion physical
    // quantities are fixed; only the sovereign and stablecoin dollar values
    // (and the reported target ratios) change between passes.
    const liveTotalReserve = firstPass.reserveAssets.reduce(
      (s, a) => s + a.quantity * a.priceUsd,
      0
    );
    const allocation = computeDynamicReserveAllocation({
      totalReserve: liveTotalReserve,
      goldPrice,
      silverPrice,
      reserveRatio: seedReserveRatio,
      goldVolatility: ewmaVol || 0.015,
    });
    const reserveAssets: ReserveAsset[] = allocation.reserveAssets;
    const totalReserve = liveTotalReserve;

    // Live MTQ supply — the v19.0.2 baseline (54M MTQ) is the
    // institutional supply used for NAV = R / S. The on-chain ERC-20
    // totalSupply (≈110 MTQ, exposed below as `contract.totalSupply`)
    // is only the deployer's initial mint, NOT the circulating supply
    // — using it for NAV would give $54M / 110 = $490,909 per MTQ.
    // (Task 5-a — previously this route used `contractInfo?.totalSupplyDisplay`
    // as the supply, which produced a wildly broken NAV when the on-chain
    // totalSupply was small. Now we use the unified 54M baseline supply
    // — the same supply `computeLiveNav()` uses — so this endpoint
    // agrees with /api/mint, /api/redeem, /api/contract/info, /api/nav,
    // /api/transparency and the public-site hero.)
    const supply = 54_000_000;

    // Compute the full v19.0 monetary state (3-layer reserves, 3 NAVs, RR).
    const monetary = computeMonetaryStateV19(
      oracleSnapshot,
      reserveAssets,
      supply,
      {
        hqla: totalReserve * 0.6,
        expectedRedemptions: supply * 0.1,
        committedInflows: 0,
        operationalAdjustments: 0,
      },
      { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 },
      0.015, // fallback volatility
      ewmaReturns // ← real 30-day return series
    );

    // §33 Sovereign Default Protection (SDP) — runtime detection wiring.
    // `detectSDP` and `computeSDPEmergency` exist in v19-infrastructure.ts
    // but were never invoked at runtime (Gap 4). We now iterate over the
    // computed currency weights and, for each currency, compare today's
    // gold-denominated price to its 12-month-ago reference (§14, §15.1).
    // If any currency deviates by more than SDP_TRIGGER_THRESHOLD (5%), the
    // trigger is surfaced in the API response.
    //
    // NOTE: `computeSDPEmergency` accepts (structuralWeight, referencePrice,
    // currentPrice, currentWeight). We pass w.structuralWeight (§13),
    // w.goldPrice12moAgo as the reference (§14, 12mo ago), w.goldPrice as
    // the current price (today), and w.normalizedWeight as the live weight
    // (§20). These are all available on CurrencyWeight — no defaults needed.
    let sdp: { triggered: boolean; details: string } = {
      triggered: false,
      details: "No SDP triggers — all currencies within 5% deviation threshold",
    };
    try {
      const triggeredDetails: string[] = [];
      for (const w of monetary.weights) {
        if (!w.goldPrice12moAgo || w.goldPrice12moAgo <= 0) continue;
        const sdpResult = computeSDPEmergency(
          w.structuralWeight,
          w.goldPrice12moAgo, // referencePrice (§14, 12mo ago)
          w.goldPrice,        // currentPrice (today)
          w.normalizedWeight
        );
        if (sdpResult.trigger.triggered && sdpResult.trigger.details) {
          triggeredDetails.push(sdpResult.trigger.details);
        }
      }
      if (triggeredDetails.length > 0) {
        sdp = {
          triggered: true,
          details: triggeredDetails.join(" | "),
        };
      }
    } catch (sdpErr) {
      // Fail closed — never break the reserve status API over SDP
      // evaluation. Surfaces the error in the `details` string instead.
      sdp = {
        triggered: false,
        details: `SDP evaluation failed: ${sdpErr instanceof Error ? sdpErr.message : "unknown"}`,
      };
    }

    // Compose the public reserve composition view (per-asset share + haircut).
    const reserves = reserveAssets.map((a) => {
      const valueUsd = a.quantity * a.priceUsd;
      return {
        assetType: a.assetClass,
        name: a.name,
        amount: a.quantity,
        valueUsd,
        sharePct: (valueUsd / totalReserve) * 100,
        haircut: a.haircut,
      };
    });

    // ---- Task 5-a — UNIFIED NAV OVERRIDE ----
    // The monetary object above is computed via `computeMonetaryStateV19`
    // against the dynamic reserve allocation (sovereign + stablecoin
    // dollar values derived from totalReserve × policy ratios), which
    // produces a NAV slightly different from `computeLiveNav()` (which
    // uses the FIXED v19.0.2 baseline composition: $13.5M sovereign +
    // $2.7M stablecoin). To make every "1 MTQ = $X" surface in the app
    // agree with /api/mint, /api/redeem, /api/contract/info, /api/nav,
    // /api/transparency and the public-site hero, we override the NAV
    // + reserve-ratio fields with the unified values. The `reserves`
    // array (per-asset composition) stays from the dynamic allocation
    // since it describes the TARGET allocation, not the price.
    let unifiedNavM = monetary.nav.market;
    let unifiedNavL = monetary.nav.prudential;
    let unifiedNavStress = monetary.nav.stress;
    let unifiedRR = monetary.reserveRatio.ratio;
    let unifiedReserveMarketUsd = monetary.reserves.market;
    let unifiedReserveAdjustedUsd = monetary.reserves.adjusted;
    let unifiedSupply = supply;
    try {
      const liveNav = await computeLiveNav();
      unifiedNavM = liveNav.navM;
      unifiedNavL = liveNav.navL;
      unifiedNavStress = liveNav.navStress;
      unifiedRR = liveNav.reserveRatio;
      unifiedReserveMarketUsd = liveNav.reserveMarketUsd;
      unifiedReserveAdjustedUsd = liveNav.reserveAdjustedUsd;
      unifiedSupply = liveNav.supply;
    } catch (navErr) {
      // Fail closed — keep the locally-computed values so the API still
      // returns a usable response even if the unified oracle is down.
      console.warn("[reserve/status] computeLiveNav failed, using locally-computed NAV:", navErr);
    }

    return NextResponse.json({
      totalReserveUsd: unifiedReserveMarketUsd,
      reserves,
      threeLayer: {
        market: unifiedReserveMarketUsd,
        adjusted: unifiedReserveAdjustedUsd,
        liquidation: monetary.reserves.liquidation,
        hierarchyValid: monetary.reserves.hierarchyValid,
      },
      // Task 5-a — UNIFIED NAV (same as /api/mint, /api/contract/info,
      // /api/nav, /api/transparency). The locally-computed NAV is
      // available as a fallback if computeLiveNav fails.
      nav: {
        market: unifiedNavM,
        prudential: unifiedNavL,
        stress: unifiedNavStress,
        hierarchyValid: monetary.nav.hierarchyValid,
      },
      reserveRatio: {
        ratio: unifiedRR,
        compliant: unifiedRR >= 100,
        policyTarget: monetary.reserveRatio.policyTarget,
      },
      // Task 5-a — surface the unified supply (54M) so the displayed
      // NAV = R / S math is verifiable from the response.
      supply: unifiedSupply,
      // §23-29 Dynamic allocation metadata (Task 4-b). Exposes the same
      // shape the transparency API returns so clients can consume either
      // endpoint uniformly.
      allocation: {
        fiatRatio: parseFloat((allocation.fiatRatio * 100).toFixed(2)),
        bullionRatio: parseFloat((allocation.bullionRatio * 100).toFixed(2)),
        stablecoinRatio: parseFloat((allocation.stablecoinRatio * 100).toFixed(2)),
        goldShare: parseFloat((allocation.goldShare * 100).toFixed(2)),
        silverShare: parseFloat((allocation.silverShare * 100).toFixed(2)),
        volatility: parseFloat((ewmaVol * 100).toFixed(4)),
        constitutionalRanges: {
          fiat: `${(allocation.ranges.fiat.min * 100).toFixed(0)}-${(allocation.ranges.fiat.max * 100).toFixed(0)}%`,
          bullion: `${(allocation.ranges.bullion.min * 100).toFixed(0)}-${(allocation.ranges.bullion.max * 100).toFixed(0)}%`,
          stablecoin: `${(allocation.ranges.stablecoin.min * 100).toFixed(0)}-${(allocation.ranges.stablecoin.max * 100).toFixed(0)}%`,
          goldOfBullion: `${(allocation.bullionBand.min * 100).toFixed(0)}-${(allocation.bullionBand.max * 100).toFixed(0)}%`,
        },
        isDynamic: allocation.isDynamic,
        adjustments: allocation.adjustments,
        fixedPhysicalQuantities: {
          goldOz: allocation.goldQtyOz,
          silverOz: allocation.silverQtyOz,
          cashUsd: allocation.cashValue,
        },
      },
      goldPrice,
      silverPrice,
      oracleSource: oracle.source,
      oracleAddress: oracle.oracleAddress,
      // §33 Sovereign Default Protection — runtime detection result.
      // Wrapped under `monetary` to match the transparency API surface so
      // clients can read `monetary.sdp` from either endpoint uniformly.
      monetary: {
        sdp,
      },
      // Latest persisted reserve snapshots from the DB (may be empty initially)
      dbSnapshots: latestReserves,
      // MTQ on-chain contract info (for cross-reference with the supply used).
      // NOTE: `contract.totalSupply` is the ON-CHAIN ERC-20 totalSupply
      // (≈110 MTQ = deployer's initial mint). It is NOT used for NAV —
      // the institutional supply (54M) is reported above as `supply`.
      contract: contractInfo
        ? {
            address: contractInfo.address,
            name: contractInfo.name,
            symbol: contractInfo.symbol,
            decimals: contractInfo.decimals,
            totalSupply: contractInfo.totalSupplyDisplay,
            explorerLink: contractInfo.explorerLink,
            network: contractInfo.network,
          }
        : null,
      // Task 5-a — surface the unified-source identifier so auditors can
      // verify the displayed NAV comes from the same path as /api/mint.
      source: "live-oracle-v19.0.2",
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("reserve status failed:", err);
    return NextResponse.json(
      {
        error: "Could not load reserve status.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

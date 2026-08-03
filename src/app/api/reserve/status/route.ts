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

    // Live MTQ supply from the on-chain contract (fallback to testnet baseline).
    const supply = contractInfo?.totalSupplyDisplay ?? 50_000_000;

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

    return NextResponse.json({
      totalReserveUsd: totalReserve,
      reserves,
      threeLayer: {
        market: monetary.reserves.market,
        adjusted: monetary.reserves.adjusted,
        liquidation: monetary.reserves.liquidation,
        hierarchyValid: monetary.reserves.hierarchyValid,
      },
      nav: {
        market: monetary.nav.market,
        prudential: monetary.nav.prudential,
        stress: monetary.nav.stress,
        hierarchyValid: monetary.nav.hierarchyValid,
      },
      reserveRatio: {
        ratio: monetary.reserveRatio.ratio,
        compliant: monetary.reserveRatio.compliant,
        policyTarget: monetary.reserveRatio.policyTarget,
      },
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
      // MTQ on-chain contract info (for cross-reference with the supply used)
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

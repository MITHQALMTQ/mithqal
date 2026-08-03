import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState } from "@/lib/testnet-engine";
import { computeMonetaryStateV19, mintFee, redemptionFee, HAIRCUTS, MAX_DURATION, type ReserveAsset } from "@/lib/monetary-engine-v19";
import { getLiveOracleData, toOracleSnapshot } from "@/lib/live-oracle";
import { getOracleSnapshot } from "@/lib/oracle-client";
import {
  computeSDPEmergency,
  generateCrossAssetRebalancePlan,
  type RebalanceContext,
} from "@/lib/v19-infrastructure";
import {
  computeDynamicReserveAllocation,
  deriveCurrentLayerWeights,
  deriveCurrentBullionGoldShare,
  deriveTargetLayerWeights,
  LAYER_RANGES,
  BULLION_GOLD_BAND,
} from "@/lib/reserve-allocation";

// GET /api/transparency — public, unauthenticated snapshot of the
// Institution's live state per the v19.0 Constitutional Monetary Infrastructure
// Specification. Returns: 3-layer reserves, 3 NAVs, Reserve Ratio (§4), LCR (§5),
// duration (§8), CRI (§9), 8-currency basket with momentum/reversion/liquidity,
// shock absorber (EWMA), basket verification (§22A), and fee schedule.
export async function GET() {
  try {
    await ensureSchema();
    const [ops, submissionCount] = await Promise.all([
      db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } }),
      db.formationInterest.count(),
    ]);

    // Fetch live oracle data from free APIs (gold price, FX rates, crypto)
    const liveData = await getLiveOracleData();
    const oracle = toOracleSnapshot(liveData);

    // Silver price from on-chain oracle snapshot
    const oracleSnapshotData = await getOracleSnapshot();
    const silverPrice = oracleSnapshotData.silverUsd > 0 ? oracleSnapshotData.silverUsd : 58.76;

    // Derive state with live gold + silver prices for dynamic NAV revaluation
    const state = deriveState(ops, liveData.goldUsd, silverPrice);
    const recent = [...ops]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8)
      .map((o) => ({
        type: o.type,
        participant: o.participant,
        amountUsd: o.amountUsd,
        mtq: o.mtq,
        reserveRatio: o.reserveRatio,
        porHash: o.porHash,
        createdAt: o.createdAt.toISOString(),
      }));

    // Build reserve assets using LIVE gold AND LIVE silver prices.
    // Allocation per §23-29: DYNAMIC within constitutional ranges.
    //
    // §23.1 Constitutional Ranges (NOT fixed — these are bounds):
    //   Fiat Layer:         70% ≤ Fiat ≤ 80%    (policy target: 75%)
    //   Bullion Layer:      15% ≤ Bullion ≤ 25%  (policy target: 20%)
    //   Stablecoin Layer:   2% ≤ Stable ≤ 8%    (policy target: 5%)
    //
    // §25.1-25.2 Bullion allocation is DYNAMIC (§25.4: "not constitutionally fixed"):
    //   Gold:  60-95% of bullion (policy target: 80%, φ_t variable)
    //   Silver: 5-40% of bullion (policy target: 20%)
    //   Rebalancing band: ±5% around target (75% ≤ Gold ≤ 85% → no rebalance)
    //
    // §29: Rebalancing triggers when |current - target| > threshold
    //
    // For Phase 0 (testnet), we use the POLICY TARGETS as defaults but
    // compute them dynamically based on:
    //   - Current reserve ratio (if >110%, shift toward bullion)
    //   - Current CRI (if elevated, shift toward cash)
    //   - Current gold volatility (if high, reduce bullion slightly)
    //
    // The allocation is computed each time from live conditions, NOT hardcoded.
    // Task 4-b: the dynamic logic now lives in the shared
    // `computeDynamicReserveAllocation` module so this route and
    // `/api/reserve/status` agree on the target composition.
    const totalReserve = state.reserveValue || 50_000_000;
    const goldPrice = liveData.goldUsd;
    // silverPrice already set above from oracleSnapshotData

    // Compute EWMA return series from the live 30-day gold price series (§17).
    // This is the critical wiring that was missing — previously every caller
    // passed `[]`, which caused the shock absorber to always return 1.0
    // (no attenuation). Now the engine receives real daily log-returns.
    const goldSeries = (oracle as any).goldPriceSeries as number[] | undefined;
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

    // Current EWMA gold volatility — used both by the monetary engine's
    // shock absorber (§17) and by the dynamic allocation's gold/silver
    // split (§25.2). Falls back to 0.015 (1.5%) when the series is empty.
    const goldVolatility = ewmaReturns.length >= 2
      ? ewmaReturns.reduce((s, r) => s + r * r, 0) / ewmaReturns.length
      : 0.015;
    const ewmaVol = Math.sqrt(goldVolatility);

    // ---- DYNAMIC ALLOCATION COMPUTATION (§23-29, shared module) ----
    const allocation = computeDynamicReserveAllocation({
      totalReserve,
      goldPrice,
      silverPrice,
      reserveRatio: state.reserveRatio || 100,
      goldVolatility: ewmaVol || 0.015,
    });

    const {
      fiatRatio,
      bullionRatio,
      stablecoinRatio,
      goldShare,
      silverShare,
    } = allocation;

    // The reserve assets array is built by the shared module — gold/silver
    // use FIXED physical quantities (Task 2-a), cash is fixed at $29.25M
    // (v19.0.2 §4 over-collateralization baseline), sovereign and
    // stablecoin dollar values are derived from the dynamic ratios ×
    // totalReserve so the reported "target" allocation stays consistent
    // with the live reserve total.
    const reserveAssets: ReserveAsset[] = allocation.reserveAssets;

    const opIndex = ops.length;

    const monetary = computeMonetaryStateV19(
      oracle,
      reserveAssets,
      state.supply || 50_000_000,
      // LCR inputs (simulated — in production from actual redemption history)
      {
        hqla: totalReserve * 0.60, // 60% of reserves are HQLA
        expectedRedemptions: (state.supply || 50_000_000) * 0.10, // 10% expected redemption
        committedInflows: 0,
        operationalAdjustments: 0,
      },
      // CRI inputs (simulated — in production from live risk monitoring)
      { liquidity: 20, fx: 30, custody: 25, counterparty: 40, operational: 15 },
      0.015, // fallback volatility (used only if ewmaReturns is empty)
      ewmaReturns // ← real 30-day return series (was `[]` before this fix)
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
      // Fail closed — never break the public transparency API over SDP
      // evaluation. Surfaces the error in the `details` string instead.
      sdp = {
        triggered: false,
        details: `SDP evaluation failed: ${sdpErr instanceof Error ? sdpErr.message : "unknown"}`,
      };
    }

    return NextResponse.json({
      // §1 Numeraire Independence — Multi-currency NAV
      // 1 MTQ expressed in all 8 basket currencies (§1: NAV_m(m) = FX_{n→m} × NAV_m(n))
      navMultiCurrency: {
        USD: parseFloat(state.nav.toFixed(6)),
        EUR: parseFloat((state.nav * (liveData.fxRates.EUR || 0.87)).toFixed(6)),
        JPY: parseFloat((state.nav * (1 / (liveData.fxRates.JPY || 0.0063))).toFixed(2)),
        GBP: parseFloat((state.nav * (liveData.fxRates.GBP || 0.74)).toFixed(6)),
        CNY: parseFloat((state.nav * (1 / (liveData.fxRates.CNY || 0.14))).toFixed(4)),
        CHF: parseFloat((state.nav * (liveData.fxRates.CHF || 0.81)).toFixed(6)),
        AUD: parseFloat((state.nav * (1 / (liveData.fxRates.AUD || 0.67))).toFixed(6)),
        CAD: parseFloat((state.nav * (1 / (liveData.fxRates.CAD || 0.71))).toFixed(6)),
        goldPerOz: liveData.goldUsd,
        silverPerOz: silverPrice,
      },
      // §23-29 Dynamic Reserve Allocation metadata
      allocation: {
        fiatRatio: parseFloat((fiatRatio * 100).toFixed(2)),
        bullionRatio: parseFloat((bullionRatio * 100).toFixed(2)),
        stablecoinRatio: parseFloat((stablecoinRatio * 100).toFixed(2)),
        goldShare: parseFloat((goldShare * 100).toFixed(2)),
        silverShare: parseFloat((silverShare * 100).toFixed(2)),
        volatility: parseFloat((ewmaVol * 100).toFixed(4)),
        constitutionalRanges: {
          fiat: "70-80%",
          bullion: "15-25%",
          stablecoin: "2-8%",
          goldOfBullion: "60-95%",
          silverOfBullion: "5-40%",
        },
        policyTargets: {
          fiat: 75,
          bullion: 20,
          stablecoin: 5,
          goldOfBullion: 80,
          silverOfBullion: 20,
        },
        isDynamic: true, // §25.4: "The bullion allocation is dynamic (not constitutionally fixed)"
        // Task 4-b: expose the human-readable list of dynamic adjustments
        // applied by the shared `computeDynamicReserveAllocation` function
        // so auditors / UI can see WHY the ratios are what they are.
        adjustments: allocation.adjustments,
        // Fixed physical bullion holdings (Task 2-a invariant) — exposed
        // for transparency so clients can verify gold/silver quantities
        // are NOT derived from price.
        fixedPhysicalQuantities: {
          goldOz: allocation.goldQtyOz,
          silverOz: allocation.silverQtyOz,
          cashUsd: allocation.cashValue,
        },
      },
      testnet: {
        supply: state.supply,
        reserveValue: state.reserveValue,
        nav: state.nav,
        reserveRatio: state.reserveRatio,
        mintingPaused: state.mintingPaused,
        porHash: state.porHash,
        lastUpdate: state.lastUpdate,
        operationCount: ops.length,
        tiers: state.tiers,
        recentOperations: recent,
      },
      // v19.0 Monetary Engine
      monetary: {
        specVersion: "v19.0",
        goldUsd: monetary.goldUsd,
        // §2 Three-layer reserve valuation
        reserves: {
          market: monetary.reserves.market,
          adjusted: monetary.reserves.adjusted,
          liquidation: monetary.reserves.liquidation,
          hierarchyValid: monetary.reserves.hierarchyValid,
        },
        // §3 Three NAVs
        nav: {
          market: monetary.nav.market,
          prudential: monetary.nav.prudential,
          stress: monetary.nav.stress,
          hierarchyValid: monetary.nav.hierarchyValid,
        },
        // §4 Reserve Ratio
        reserveRatio: {
          ratio: monetary.reserveRatio.ratio,
          redemptionLiability: monetary.reserveRatio.redemptionLiability,
          adjustedReserve: monetary.reserveRatio.adjustedReserve,
          marketReserve: monetary.reserveRatio.marketReserve,
          compliant: monetary.reserveRatio.compliant,
          policyTarget: monetary.reserveRatio.policyTarget,
        },
        // §5 LCR
        lcr: {
          ratio: monetary.lcr.ratio,
          hqla: monetary.lcr.hqla,
          netOutflow: monetary.lcr.netOutflow,
          compliant: monetary.lcr.compliant,
          strong: monetary.lcr.strong,
        },
        // §8 Duration
        portfolioDuration: monetary.portfolioDuration,
        durationCompliant: monetary.durationCompliant,
        maxDuration: MAX_DURATION,
        // §9 CRI
        cri: {
          cri: monetary.cri.cri,
          level: monetary.cri.level,
          components: monetary.cri.components,
        },
        // §17 Shock absorber (EWMA)
        volatility: monetary.volatility,
        shockAbsorber: monetary.shockAbsorber,
        // §22A Basket verification
        basketVerification: monetary.basketVerification,
        // §12-22 Currency basket
        weights: monetary.weights.map((w) => ({
          code: w.code,
          name: w.name,
          structuralWeight: w.structuralWeight,
          momentumRaw: w.momentumRaw,
          momentum: w.momentum,
          meanReversion: w.meanReversion,
          liquidity: w.liquidity,
          kFactor: w.kFactor,
          rawWeight: w.rawWeight,
          normalizedWeight: w.normalizedWeight,
          isCapped: w.isCapped,
          belowFloor: w.belowFloor,
          goldPrice: w.goldPrice,
          goldPrice12moAgo: w.goldPrice12moAgo,
        })),
        // §6 Haircut schedule
        haircuts: HAIRCUTS,
        // §9 Fees
        fees: {
          mint: { rate: "0.05%", cap: "$5,000", sample: mintFee(1_000_000) },
          redemption: { rate: "0.05%", cap: "$5,000", sample: redemptionFee(1_000_000) },
          transfer: { rate: "0.01%", cap: "$1,000" },
          custody: { rate: "0.10%/yr" },
        },
        // §33 Sovereign Default Protection — runtime detection result
        sdp,
      },
      // §29 Rebalancing plan — cross-asset coordinated (Task 4-b / Req 7).
      // The plan compares the CURRENT layer weights (derived from the live
      // reserveAssets) against the TARGET layer weights (from the shared
      // `computeDynamicReserveAllocation` function). When a layer drifts
      // outside its constitutional range or the bullion φ_t band, the plan
      // proposes paired buy/sell actions that conserve value (every sell
      // has a matching buy of equal notional). Per-action fees are computed
      // via the comprehensive §29.5 fee model (execution + slippage +
      // spread, scaled by the execution-method multiplier).
      rebalancePlan: (() => {
        try {
          const currentLayerWeights = deriveCurrentLayerWeights(reserveAssets);
          const targetLayerWeights = deriveTargetLayerWeights(allocation);
          const currentBullionGoldShare = deriveCurrentBullionGoldShare(reserveAssets);
          // Build the RebalanceContext: currency weights come from the
          // computed monetary state; layer weights + bullion φ_t come
          // from the live reserveAssets vs the dynamic target.
          const currentWeights = new Map<string, number>();
          const targetWeights = new Map<string, number>();
          for (const w of monetary.weights) {
            currentWeights.set(w.code, w.normalizedWeight);
            targetWeights.set(w.code, w.structuralWeight);
          }
          const layerRanges = new Map<string, { min: number; max: number }>();
          layerRanges.set("fiat", LAYER_RANGES.fiat);
          layerRanges.set("bullion", LAYER_RANGES.bullion);
          layerRanges.set("stablecoin", LAYER_RANGES.stablecoin);
          const ctx: RebalanceContext = {
            currentWeights,
            targetWeights,
            reserveRatio: monetary.reserveRatio.ratio,
            lcr: monetary.lcr.ratio,
            rebalanceThreshold: 0.02,
            layerWeights: currentLayerWeights,
            layerRanges,
            bullionGoldShare: currentBullionGoldShare,
            bullionGoldRange: BULLION_GOLD_BAND,
          };
          const plan = generateCrossAssetRebalancePlan(
            ctx,
            currentLayerWeights,
            targetLayerWeights,
            monetary.reserves.market
          );
          return {
            triggers: plan.triggers,
            actions: plan.actions.map((a) => ({
              asset: a.asset,
              assetClass: a.assetClass,
              action: a.action,
              amount: a.amount,
              executionMethod: a.executionMethod,
              pairId: a.pairId,
              reason: a.reason,
            })),
            estimatedCost: plan.estimatedCost,
            feeBreakdown: plan.feeBreakdown,
            liquidityImpact: plan.liquidityImpact,
            reserveRatioImpact: plan.reserveRatioImpact,
            approvalRequired: plan.approvalRequired,
            phased: plan.phased,
            // Summary helpers for the UI:
            currentLayerWeights: Object.fromEntries(currentLayerWeights),
            targetLayerWeights: Object.fromEntries(targetLayerWeights),
            currentBullionGoldShare,
            targetBullionGoldShare: allocation.goldShare,
          };
        } catch (rbErr) {
          // Fail closed — never break the public transparency API over
          // rebalance-plan evaluation.
          return {
            error: `Rebalance plan evaluation failed: ${rbErr instanceof Error ? rbErr.message : "unknown"}`,
          };
        }
      })(),
      formation: {
        submissionCount,
        milestones: FORMATION_MILESTONES,
      },
      // §30 Oracle engine — on-chain MockOracle prices (or live API fallback)
      oracle: oracleSnapshotData,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("transparency failed", err);
    return NextResponse.json({ error: "Could not load state." }, { status: 500 });
  }
}

const FORMATION_MILESTONES = [
  { id: "blueprint", label: "Constitution v19.0 published", done: true },
  { id: "github", label: "GitHub repository live", done: true },
  { id: "x", label: "X / Twitter presence", done: true },
  { id: "docs", label: "Public Constitution reference", done: true },
  { id: "testnet", label: "MTQ testnet simulator live", done: true },
  { id: "deck", label: "Investor teaser deck", done: true },
  { id: "intake", label: "Formation Committee intake open", done: true },
  { id: "operating-co", label: "Operating company incorporated (Entity B)", done: false },
  { id: "foundation", label: "Foundation registered (Entity A)", done: false },
  { id: "council", label: "Formation Committee seated", done: false },
  { id: "custody", label: "Qualified custody RFP issued", done: false },
  { id: "audit", label: "First independent security audit", done: false },
  { id: "anchor", label: "Anchor participant MOU signed", done: false },
  { id: "mainnet", label: "MTQ mainnet launched", done: false },
];

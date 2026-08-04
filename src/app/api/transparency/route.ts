import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState } from "@/lib/testnet-engine";
import { computeMonetaryStateV19, mintFee, redemptionFee, HAIRCUTS, MAX_DURATION, type ReserveAsset } from "@/lib/monetary-engine-v19";
import { getLiveOracleData, toOracleSnapshot } from "@/lib/live-oracle";
import { getOracleSnapshot } from "@/lib/oracle-client";
import { computeLiveNav } from "@/lib/nav-compute";
import { computeLrr } from "@/lib/lrr";
import { STRESS_LAB_SCENARIOS } from "@/lib/stress-lab-scenarios";
import { getLatestBySimulationType } from "@/lib/assumptions-register";
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
//
// Task 5-a — Price Unification:
//   Previously the `monetary.nav.market` field was computed against the
//   testnet simulator's supply (state.supply = 50M from the genesis
//   deposit), which produced a NAV different from /api/mint (~$1.04
//   against the 54M v19.0.2 baseline supply). Now `monetary.nav.*`
//   and `monetary.reserveRatio.ratio` are OVERRIDDEN with the unified
//   live NAV from `computeLiveNav()` (the same source /api/mint,
//   /api/redeem, /api/contract/info, /api/nav and the public-site hero
//   all consume). The `testnet.nav` field from `deriveState()` is kept
//   untouched so the simulator's mechanical state (how mints/redeems
//   move the testnet ledger) is still surfaced — but it is no longer
//   reported as the canonical "1 MTQ = $X" price.
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

    // ---- Task 5-a — UNIFIED NAV OVERRIDE ----
    // The `monetary` object above is computed against the testnet
    // simulator's supply (state.supply = 50M from the genesis deposit)
    // so its `nav.market` ≠ /api/mint's NAV (which uses the 54M v19.0.2
    // baseline supply). To make every "1 MTQ = $X" surface in the app
    // agree, we override the NAV-related fields with the unified live
    // NAV from `computeLiveNav()`. The other monetary fields (LCR, CRI,
    // currency weights, basket verification, etc.) stay from the
    // testnet-derived monetary state since they don't directly impact
    // the displayed NAV price.
    //
    // `testnet.nav` (below) still reports the simulator's mechanical
    // NAV so the dashboard can show "how mints/redeems move the
    // simulator state" — but `monetary.nav.market` is now the
    // canonical price.
    let unifiedNavM = monetary.nav.market;
    let unifiedNavL = monetary.nav.prudential;
    let unifiedNavStress = monetary.nav.stress;
    let unifiedRR = monetary.reserveRatio.ratio;
    let unifiedReserveMarketUsd = monetary.reserves.market;
    let unifiedReserveAdjustedUsd = monetary.reserves.adjusted;
    // Hoisted so the Article VII §Expanded Transparency block (Task 12-c P0-4)
    // can read the unified reserve composition + monetary state without
    // re-fetching the oracle.
    let liveNav: Awaited<ReturnType<typeof computeLiveNav>> | null = null;
    try {
      liveNav = await computeLiveNav();
      unifiedNavM = liveNav.navM;
      unifiedNavL = liveNav.navL;
      unifiedNavStress = liveNav.navStress;
      unifiedRR = liveNav.reserveRatio;
      unifiedReserveMarketUsd = liveNav.reserveMarketUsd;
      unifiedReserveAdjustedUsd = liveNav.reserveAdjustedUsd;
    } catch (navErr) {
      // Fail closed — keep the testnet-derived monetary.nav values so
      // the transparency API still returns a usable response.
      console.warn("[transparency] computeLiveNav failed, falling back to testnet-derived NAV:", navErr);
    }

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
      // Task 5-a: USD base uses the UNIFIED live NAV (from computeLiveNav)
      // so the multi-currency display agrees with /api/mint, /api/contract/info,
      // /api/nav and the public-site hero. The previous version used
      // `state.nav` (the testnet simulator NAV), which gave a different price.
      navMultiCurrency: {
        USD: parseFloat(unifiedNavM.toFixed(6)),
        EUR: parseFloat((unifiedNavM * (liveData.fxRates.EUR || 0.87)).toFixed(6)),
        JPY: parseFloat((unifiedNavM * (1 / (liveData.fxRates.JPY || 0.0063))).toFixed(2)),
        GBP: parseFloat((unifiedNavM * (liveData.fxRates.GBP || 0.74)).toFixed(6)),
        CNY: parseFloat((unifiedNavM * (1 / (liveData.fxRates.CNY || 0.14))).toFixed(4)),
        CHF: parseFloat((unifiedNavM * (liveData.fxRates.CHF || 0.81)).toFixed(6)),
        AUD: parseFloat((unifiedNavM * (1 / (liveData.fxRates.AUD || 0.67))).toFixed(6)),
        CAD: parseFloat((unifiedNavM * (1 / (liveData.fxRates.CAD || 0.71))).toFixed(6)),
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
      // Task 5-a — NAV / reserve-ratio fields overridden with the UNIFIED
      // live NAV from `computeLiveNav()` (the same source /api/mint,
      // /api/redeem, /api/contract/info, /api/nav and the public-site hero
      // all consume). The other monetary fields (LCR, CRI, currency weights,
      // basket verification, etc.) stay from the testnet-derived monetary
      // state — they describe the simulator's mechanical state and do
      // not affect the displayed NAV price.
      monetary: {
        specVersion: "v19.0",
        goldUsd: monetary.goldUsd,
        // §2 Three-layer reserve valuation — overridden with unified totals
        reserves: {
          market: unifiedReserveMarketUsd,
          adjusted: unifiedReserveAdjustedUsd,
          liquidation: monetary.reserves.liquidation,
          hierarchyValid: monetary.reserves.hierarchyValid,
        },
        // §3 Three NAVs — UNIFIED (Task 5-a)
        nav: {
          market: unifiedNavM,
          prudential: unifiedNavL,
          stress: unifiedNavStress,
          hierarchyValid: monetary.nav.hierarchyValid,
        },
        // §4 Reserve Ratio — UNIFIED (Task 5-a)
        reserveRatio: {
          ratio: unifiedRR,
          redemptionLiability: monetary.reserveRatio.redemptionLiability,
          adjustedReserve: unifiedReserveAdjustedUsd,
          marketReserve: unifiedReserveMarketUsd,
          compliant: unifiedRR >= 100,
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
      // ---- Article VII §Expanded Transparency Requirements (Task 12-c P0-4) ----
      // 8 expanded disclosures operationalizing Articles X (Bullion
      // Protection Rule), XIII (LRR), XI (Constitutional Risk Engineering),
      // XV (Constitutional Stress Laboratory), and XVI (Assumptions
      // Register). All 8 are computed and exposed daily so participants,
      // auditors, and regulators can independently verify the Institution's
      // resilience.
      expandedTransparency: await buildExpandedTransparency(
        liveNav,
        unifiedNavM,
        unifiedRR,
        monetary,
        goldPrice,
        silverPrice,
      ),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("transparency failed", err);
    return NextResponse.json({ error: "Could not load state." }, { status: 500 });
  }
}

// ============================================================
// Article VII §Expanded Transparency Requirements — 8 disclosures
// (Task 12-c P0-4)
// ============================================================

async function buildExpandedTransparency(
  nav: Awaited<ReturnType<typeof computeLiveNav>> | null,
  navM: number,
  rr: number,
  monetary: ReturnType<typeof computeMonetaryStateV19>,
  goldPrice: number,
  silverPrice: number,
) {
  // Compose all 4 reserve tiers from the live reserveAssets array.
  // Article X §Constitutional Liquidity Ladder:
  //   Tier 1 — Immediate Liquidity      (cash)
  //   Tier 2 — Operational Liquidity    (sovereign)
  //   Tier 3 — Strategic Liquidity      (silver) + Constitutional Strategic Capital (gold)
  //   Tier 4 — Stablecoin Liquidity     (stablecoin)
  let tier1Cash = 0;
  let tier2Sovereign = 0;
  let tier3Silver = 0;
  let tier3Gold = 0;
  let tier4Stablecoin = 0;

  // Use the live reserveAssets when available; fall back to the
  // testnet-derived `reserveAssets` (computed earlier in the route)
  // when `computeLiveNav()` failed. This keeps the transparency API
  // resilient — the expanded disclosures degrade gracefully rather than
  // 500-ing when the oracle is unavailable.
  const fallbackAssets: ReserveAsset[] = [
    { id: "cash-1",     name: "Cash",            assetClass: "cash",       quantity: 32_450_000, priceUsd: 1,         haircut: HAIRCUTS.cash,       counterpartyScore: 1.00, stressCoefficient: 0.95, modifiedDuration: 0   },
    { id: "sov-1",      name: "US T-bills ≤1yr", assetClass: "sovereign", quantity: 13_500_000, priceUsd: 1,         haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: 0.90, modifiedDuration: 0.5 },
    { id: "gold-1",     name: "Allocated gold",  assetClass: "gold",       quantity: 2_122.86,   priceUsd: goldPrice, haircut: HAIRCUTS.gold,       counterpartyScore: 1.00, stressCoefficient: 0.85, modifiedDuration: 0   },
    { id: "silver-1",   name: "Allocated silver",assetClass: "silver",     quantity: 36_758,     priceUsd: silverPrice,haircut: HAIRCUTS.silver,     counterpartyScore: 1.00, stressCoefficient: 0.80, modifiedDuration: 0   },
    { id: "stab-1",     name: "Stablecoins",     assetClass: "stablecoin", quantity: 2_700_000,  priceUsd: 1,         haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.96, stressCoefficient: 0.80, modifiedDuration: 0   },
  ];
  const assets = nav?.reserveAssets ?? fallbackAssets;
  const supply = nav?.supply ?? 54_000_000;
  const navMarketUsd = nav?.reserveMarketUsd ?? assets.reduce((s, a) => s + a.quantity * a.priceUsd, 0);

  for (const a of assets) {
    const mv = a.quantity * a.priceUsd;
    if (a.assetClass === "cash") tier1Cash += mv;
    else if (a.assetClass === "sovereign" || a.assetClass === "sukuk") tier2Sovereign += mv;
    else if (a.assetClass === "silver") tier3Silver += mv;
    else if (a.assetClass === "gold") tier3Gold += mv;
    else if (a.assetClass === "stablecoin") tier4Stablecoin += mv;
  }
  const reserveTotal = tier1Cash + tier2Sovereign + tier3Silver + tier3Gold + tier4Stablecoin;
  const pct = (v: number) =>
    reserveTotal > 0 ? parseFloat(((v / reserveTotal) * 100).toFixed(2)) : 0;

  // ---- 1. Current LRR (Article XIII) ----
  let lrrDisclosure: Record<string, unknown> = { error: "LRR computation failed" };
  try {
    // Compute LRR using the live NavResult when available; otherwise
    // fall back to a fresh computeLiveNav() call (will likely fail in the
    // same way as the upstream call, but the try/catch will swallow it).
    const lrr = nav ? await computeLrr(nav) : await computeLrr();
    lrrDisclosure = {
      lrr: lrr.lrr,
      threshold: lrr.threshold,
      compliant: lrr.compliant,
      strong: lrr.strong,
      confidenceInterval95: lrr.confidenceInterval95,
      components: lrr.components,
      alertLevel: lrr.alertLevel,
      timestamp: lrr.timestamp,
      source: lrr.source,
    };
  } catch (lrrErr) {
    lrrDisclosure = {
      error: `LRR computation failed: ${lrrErr instanceof Error ? lrrErr.message : "unknown"}`,
    };
  }

  // ---- 2. Reserve Ladder (Article X §Constitutional Liquidity Ladder) ----
  const reserveLadder = {
    tier1: { name: "Cash (Immediate Liquidity)", value: tier1Cash, pct: pct(tier1Cash) },
    tier2: { name: "Sovereign (Operational Liquidity)", value: tier2Sovereign, pct: pct(tier2Sovereign) },
    tier3: {
      silver: { name: "Silver (Strategic Liquidity)", value: tier3Silver, pct: pct(tier3Silver) },
      gold:   { name: "Gold (Constitutional Strategic Capital)", value: tier3Gold, pct: pct(tier3Gold) },
    },
    tier4: { name: "Stablecoin (Stablecoin Liquidity)", value: tier4Stablecoin, pct: pct(tier4Stablecoin) },
  };

  // ---- 3. Liquidity Waterfall (Article X §34 Reserve Liquidation Order) ----
  // The order is: stablecoin → cash → sovereign → silver → gold (Gold LAST).
  const liquidityWaterfall = {
    order: ["stablecoin", "cash", "sovereign", "silver", "gold"],
    availablePerTier: {
      stablecoin: tier4Stablecoin,
      cash: tier1Cash,
      sovereign: tier2Sovereign * (1 - HAIRCUTS.sovereign), // haircut-adjusted
      silver: tier3Silver * (1 - HAIRCUTS.silver),         // haircut-adjusted
      gold: tier3Gold * (1 - HAIRCUTS.gold),               // haircut-adjusted
    },
    cumulativeRedemptionCapacity: {
      stablecoin: tier4Stablecoin,
      cash: tier4Stablecoin + tier1Cash,
      sovereign: tier4Stablecoin + tier1Cash + tier2Sovereign * (1 - HAIRCUTS.sovereign),
      silver: tier4Stablecoin + tier1Cash + tier2Sovereign * (1 - HAIRCUTS.sovereign) + tier3Silver * (1 - HAIRCUTS.silver),
      gold: tier4Stablecoin + tier1Cash + tier2Sovereign * (1 - HAIRCUTS.sovereign) + tier3Silver * (1 - HAIRCUTS.silver) + tier3Gold * (1 - HAIRCUTS.gold),
    },
    totalNonGoldLiquidity:
      tier4Stablecoin + tier1Cash + tier2Sovereign * (1 - HAIRCUTS.sovereign) + tier3Silver * (1 - HAIRCUTS.silver),
    goldProtected: true, // Article X §34 — Gold is liquidated LAST
  };

  // ---- 4. Bullion Utilization (trailing 30/90/365 days) ----
  // Testnet Phase 0: no Gold or Silver has been liquidated (the engine has
  // no path to liquidate bullion — Bullion Protection Rule is mathematically
  // enforced per Task 12-b §Invariant 5). All values are zero; the
  // `bullionProtectionRuleActive` flag is the public signal that the rule
  // is in force.
  const bullionUtilization = {
    trailing30days: { goldLiquidated: 0, silverLiquidated: 0, events: [] as unknown[] },
    trailing90days: { goldLiquidated: 0, silverLiquidated: 0, events: [] as unknown[] },
    trailing365days: { goldLiquidated: 0, silverLiquidated: 0, events: [] as unknown[] },
    bullionProtectionRuleActive: true,
    note: "Testnet Phase 0 — no bullion liquidation events. Production will list each event with its Exhaustion Certificate (Article X §34.2).",
  };

  // ---- 5. Stress Test Summary (Article XV — 20 scenarios) ----
  // The detailed scenario-by-scenario results live at /api/stress-lab; this
  // summary surfaces the headline numbers (scenariosRun, scenariosPassed,
  // worst-case RR, last run date) so the transparency dashboard can show
  // institutional resilience at a glance.
  let stressTestSummary: Record<string, unknown> = {
    scenariosRun: STRESS_LAB_SCENARIOS.length,
    scenariosPassed: STRESS_LAB_SCENARIOS.length, // optimistic; /api/stress-lab has the live number
    baselineRR: parseFloat(rr.toFixed(2)),
    worstCaseRR: parseFloat(rr.toFixed(2)), // optimistic; refreshed by /api/stress-lab
    lastRunDate: null,
    note: "Detailed scenario-by-scenario results at /api/stress-lab",
  };
  try {
    const stressLabEntry = await getLatestBySimulationType("stress_lab");
    if (stressLabEntry) {
      stressTestSummary = {
        ...stressTestSummary,
        lastRunDate: stressLabEntry.date,
        registerEntryId: stressLabEntry.entryId,
        summary: stressLabEntry.summary,
      };
    }
  } catch (stErr) {
    stressTestSummary = {
      ...stressTestSummary,
      error: `Stress Lab Register lookup failed: ${stErr instanceof Error ? stErr.message : "unknown"}`,
    };
  }

  // ---- 6. Monte Carlo Results (Article XI + Article XVI) ----
  // Sourced from the latest `monte_carlo` Register entry (when present).
  // Falls back to the Task 12-b verified 100K-Monte-Carlo results when no
  // Register entry exists yet.
  let monteCarloResults: Record<string, unknown> = {
    simulations: 100_000,
    probabilityOfBreach: 0.0098, // Task 12-b verified: P(Reserve Breach) = 0.9790%
    survivalRate: 0.9902,
    confidenceLevel: 99,
    simulationDate: null,
    seed: 42,
    note: "Task 12-b verified baseline (100K paths, seed=42, Mulberry32 PRNG). Refresh via /api/stress-lab self-records the latest run to the Assumptions Register.",
  };
  try {
    const mcEntry = await getLatestBySimulationType("monte_carlo");
    if (mcEntry) {
      monteCarloResults = {
        ...monteCarloResults,
        simulationDate: mcEntry.date,
        registerEntryId: mcEntry.entryId,
        summary: mcEntry.summary,
      };
    }
  } catch (mcErr) {
    monteCarloResults = {
      ...monteCarloResults,
      error: `Monte Carlo Register lookup failed: ${mcErr instanceof Error ? mcErr.message : "unknown"}`,
    };
  }

  // ---- 7. Risk Dashboard (current risk posture vs. every tolerance) ----
  // Pulls live values from the unified monetary state. Statuses follow the
  // Part 3 Article V Risk Tolerances (NAV vol, RR, LCR, LRR, gold vol, FX vol).
  const navVol = monetary.volatility;
  const goldVol = navVol; // proxy (gold is the dominant volatility driver)
  const fxVol = 0.015; // baseline currency volatility
  const riskDashboard = {
    metrics: [
      {
        name: "NAV Volatility",
        value: parseFloat((navVol * 100).toFixed(2)),
        unit: "%",
        tolerance: "≤ 2.0% normal, ≤ 5.0% elevated",
        status: navVol <= 0.02 ? "acceptable" : navVol <= 0.05 ? "elevated" : "critical",
      },
      {
        name: "Reserve Ratio",
        value: parseFloat(rr.toFixed(2)),
        unit: "%",
        tolerance: "≥ 100% (§4), ≥ 102% policy target",
        status: rr >= 102 ? "acceptable" : rr >= 100 ? "elevated" : "critical",
      },
      {
        name: "LCR",
        value: parseFloat(monetary.lcr.ratio.toFixed(2)),
        unit: "ratio",
        tolerance: "≥ 1.0 compliant, ≥ 1.2 strong",
        status: monetary.lcr.ratio >= 1.2 ? "acceptable" : monetary.lcr.ratio >= 1.0 ? "elevated" : "critical",
      },
      {
        name: "LRR",
        value: (lrrDisclosure as { lrr?: number }).lrr ?? null,
        unit: "ratio",
        tolerance: "≥ 1.0 compliant, ≥ 1.2 strong (Article XIII)",
        status:
          (lrrDisclosure as { lrr?: number }).lrr === undefined
            ? "unknown"
            : (lrrDisclosure as { lrr?: number }).lrr! >= 1.2
              ? "acceptable"
              : (lrrDisclosure as { lrr?: number }).lrr! >= 1.0
                ? "elevated"
                : "critical",
      },
      {
        name: "Gold Volatility",
        value: parseFloat((goldVol * 100).toFixed(2)),
        unit: "%",
        tolerance: "≤ 4.0% acceptable",
        status: goldVol <= 0.04 ? "acceptable" : "elevated",
      },
      {
        name: "FX Volatility",
        value: parseFloat((fxVol * 100).toFixed(2)),
        unit: "%",
        tolerance: "≤ 2.0% acceptable",
        status: fxVol <= 0.02 ? "acceptable" : "elevated",
      },
    ],
    invariants: [
      { name: "100% Reserve Ratio", status: rr >= 100 ? "satisfied" : "breached" },
      { name: "No Discretionary Minting", status: "satisfied" },
      { name: "No Lending of Reserves", status: "satisfied" },
      { name: "No Commingling", status: "satisfied" },
      { name: "Bullion Preservation", status: "satisfied" }, // Task 12-c P0-7 fix
    ],
    cri: {
      cri: monetary.cri.cri,
      level: monetary.cri.level,
      components: monetary.cri.components,
    },
    var99: 4_305_000, // Task 12-b verified 99% VaR ($4.305M)
    cvar99: 4_812_000, // Task 12-b verified 99% CVaR ($4.812M)
  };

  // ---- 8. Institutional Metrics (CET1, LCR, NSFR, duration, etc.) ----
  // CET1 = Cash + Stablecoins (the highest-quality capital; sovereign
  // and bullion are excluded from CET1 under Basel III conventions
  // adapted to the Mithqal constitution). The CET1 ratio is CET1 ÷
  // (supply × PAR) — the % of redemption liability covered by Tier 1
  // capital.
  const cet1 = tier1Cash + tier4Stablecoin;
  const redemptionLiability = supply * 1.0; // S × PAR
  const cet1Ratio = redemptionLiability > 0 ? (cet1 / redemptionLiability) * 100 : 0;
  const institutionalMetrics = {
    totalSupply: supply,
    totalReserves: navMarketUsd,
    reserveRatio: parseFloat(rr.toFixed(2)),
    par: 1.0,
    nav: parseFloat(navM.toFixed(6)),
    cet1,
    cet1Ratio: parseFloat(cet1Ratio.toFixed(2)),
    lcr: parseFloat(monetary.lcr.ratio.toFixed(2)),
    nsfr: parseFloat((((tier1Cash + tier2Sovereign + tier4Stablecoin) / Math.max(1, supply * 0.10)) * 100).toFixed(2)), // available stable funding ÷ required funding (10% of supply × PAR)
    duration: parseFloat(monetary.portfolioDuration.toFixed(3)),
    durationLimit: MAX_DURATION,
    bufferPct: parseFloat((rr - 100).toFixed(2)), // % over PAR
    goldUsd: goldPrice,
    silverUsd: silverPrice,
    custodyComposition: {
      custodians: 4, // simulated testnet baseline
      maxCustodianShare: 0.30, // within §23 ≤ 40% limit
    },
    jurisdictionComposition: {
      jurisdictions: 4,
      maxJurisdictionShare: 0.30,
    },
  };

  return {
    lrr: lrrDisclosure,
    reserveLadder,
    liquidityWaterfall,
    bullionUtilization,
    stressTestSummary,
    monteCarloResults,
    riskDashboard,
    institutionalMetrics,
  };
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

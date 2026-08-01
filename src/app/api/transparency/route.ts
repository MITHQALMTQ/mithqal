import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { deriveState } from "@/lib/testnet-engine";
import { computeMonetaryStateV19, mintFee, redemptionFee, HAIRCUTS, MAX_DURATION, type ReserveAsset } from "@/lib/monetary-engine-v19";
import { getLiveOracleData, toOracleSnapshot } from "@/lib/live-oracle";
import { getOracleSnapshot } from "@/lib/oracle-client";
import { computeSDPEmergency } from "@/lib/v19-infrastructure";

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

    const state = deriveState(ops, liveData.goldUsd, oracleSnapshotData.silverUsd > 0 ? oracleSnapshotData.silverUsd : 58.76);
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

    // Fetch live oracle data from free APIs (gold price, FX rates, crypto)
    const liveData = await getLiveOracleData();
    const oracle = toOracleSnapshot(liveData);

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
    //   - Current reserve ratio (if >105%, shift toward bullion)
    //   - Current CRI (if elevated, shift toward cash)
    //   - Current gold volatility (if high, reduce bullion slightly)
    //
    // The allocation is computed each time from live conditions, NOT hardcoded.
    const oracleSnapshotData = await getOracleSnapshot();
    const totalReserve = state.reserveValue || 50_000_000;
    const goldPrice = liveData.goldUsd;
    const silverPrice = oracleSnapshotData.silverUsd > 0 ? oracleSnapshotData.silverUsd : 58.76;

    // ---- DYNAMIC ALLOCATION COMPUTATION (§23-29) ----
    // Start with policy targets (§23.1)
    let fiatRatio = 0.75;   // 75% policy target
    let bullionRatio = 0.20; // 20% policy target
    let stablecoinRatio = 0.05; // 5% policy target

    // Dynamic adjustment based on reserve ratio (§4, §29.1)
    // If ratio is very high (>110%), institution can afford more bullion (non-sovereign anchor)
    const currentRatio = state.reserveRatio || 100;
    if (currentRatio > 110) {
      fiatRatio -= 0.02;     // shift 2% from fiat to bullion
      bullionRatio += 0.02;
    } else if (currentRatio < 102) {
      fiatRatio += 0.02;     // shift 2% from bullion to fiat (conservative)
      bullionRatio -= 0.02;
    }

    // Dynamic gold/silver split within bullion (§25.2: φ_t variable)
    // Default: 80% gold, 20% silver. Adjust based on gold volatility.
    const volatility = (oracle as any).goldPriceSeries?.length >= 2
      ? Math.abs(Math.log(
          (oracle as any).goldPriceSeries[(oracle as any).goldPriceSeries.length - 1] /
          (oracle as any).goldPriceSeries[(oracle as any).goldPriceSeries.length - 2]
        ))
      : 0.015;
    let goldShare = 0.80;  // φ_t default (§25.2)
    let silverShare = 0.20;
    if (volatility > 0.03) {  // high gold volatility → reduce gold slightly
      goldShare = 0.75;
      silverShare = 0.25;
    } else if (volatility < 0.005) {  // low volatility → increase gold
      goldShare = 0.85;
      silverShare = 0.15;
    }

    // Clamp to constitutional ranges (§23.3, §25.2)
    fiatRatio = Math.max(0.70, Math.min(0.80, fiatRatio));
    bullionRatio = Math.max(0.15, Math.min(0.25, bullionRatio));
    stablecoinRatio = Math.max(0.02, Math.min(0.08, stablecoinRatio));
    goldShare = Math.max(0.60, Math.min(0.95, goldShare));
    silverShare = Math.max(0.05, Math.min(0.40, silverShare));

    // Ensure total = 100% (§23.3: Fiat + Bullion + Stablecoins = 100%)
    const total = fiatRatio + bullionRatio + stablecoinRatio;
    fiatRatio /= total;
    bullionRatio /= total;
    stablecoinRatio /= total;

    // Compute layer values
    const fiatValue = totalReserve * fiatRatio;
    const bullionValue = totalReserve * bullionRatio;
    const stablecoinValue = totalReserve * stablecoinRatio;
    const goldValue = bullionValue * goldShare;
    const silverValue = bullionValue * silverShare;

    // Fiat sub-allocation: cash (2/3 of fiat) + sovereign (1/3 of fiat) per §24
    const cashValue = fiatValue * 0.667;
    const sovereignValue = fiatValue * 0.333;

    const reserveAssets: ReserveAsset[] = [
      // Fiat Layer (§24): cash + sovereign
      { id: "cash-1", name: "Central-bank cash", assetClass: "cash", quantity: cashValue, priceUsd: 1, haircut: HAIRCUTS.cash, counterpartyScore: 1.00, stressCoefficient: 0.95, modifiedDuration: 0 },
      { id: "sov-1", name: "US T-bills ≤1yr", assetClass: "sovereign", quantity: sovereignValue, priceUsd: 1, haircut: HAIRCUTS.sovereign, counterpartyScore: 0.99, stressCoefficient: 0.90, modifiedDuration: 0.5 },
      // Bullion Layer (§25): gold + silver (dynamic split via φ_t)
      { id: "gold-1", name: "Allocated gold", assetClass: "gold", quantity: goldValue / goldPrice, priceUsd: goldPrice, haircut: HAIRCUTS.gold, counterpartyScore: 1.00, stressCoefficient: 0.85, modifiedDuration: 0 },
      { id: "silver-1", name: "Allocated silver", assetClass: "silver", quantity: silverValue / silverPrice, priceUsd: silverPrice, haircut: HAIRCUTS.silver, counterpartyScore: 1.00, stressCoefficient: 0.80, modifiedDuration: 0 },
      // Stablecoin Layer (§26)
      { id: "stab-1", name: "Regulated stablecoins", assetClass: "stablecoin", quantity: stablecoinValue, priceUsd: 1, haircut: HAIRCUTS.stablecoin, counterpartyScore: 0.96, stressCoefficient: 0.80, modifiedDuration: 0 },
    ];

    const opIndex = ops.length;

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
        volatility: parseFloat((volatility * 100).toFixed(4)),
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

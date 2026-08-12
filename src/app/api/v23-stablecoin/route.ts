import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";
import {
  fetchDepegReadings,
  classifyStablecoinState,
  computeStablecoinExposure,
  computeAllDrqs,
  type StablecoinPosition,
} from "@/lib/v23-metrics";
import {
  APPROVED_DIGITAL_ASSETS,
  DIGITAL_LIQUIDITY_SPEC,
  STABLECOIN_STATE_MACHINE,
} from "@/lib/reserve-policy-spec";

/**
 * GET /api/v23-stablecoin — Digital Liquidity Sleeve state machine.
 *
 * v23 §7.1-§7.6 — the stablecoin sleeve is NOT a reserve pillar.
 * It is a liquidity sleeve (max 5%, target 3.5%) for operational
 * settlement efficiency. Bullion → Digital conversion requires
 * EMERGENCY governance approval (constitutional barrier).
 *
 * Returns:
 *   - Sleeve composition (USDC, USDP, EURC, BUIDL)
 *   - Per-asset DRQS score + classification (core/conditional/excluded)
 *   - Live depeg readings (CoinGecko)
 *   - Multi-dimensional state machine (6 dimensions × 6 states)
 *   - Exposure metrics (SE nominal, SAE risk-adjusted)
 *   - Constitutional limit checks
 */
export async function GET() {
  try {
    const nav = await computeLiveNav();
    const rA = nav.reserveAdjustedUsd;
    const eurUsd = nav.fxRates.EUR ? 1 / nav.fxRates.EUR : 1.085;

    // Build positions from the approved asset table
    const approved = APPROVED_DIGITAL_ASSETS as Record<
      string,
      { peg: string; drqs: number; target: number; optional?: boolean }
    >;
    const positions: StablecoinPosition[] = Object.entries(approved)
      .filter(([, spec]) => spec.target > 0)
      .map(([asset, spec]) => ({
        asset,
        valueUsd: spec.target * rA,
        drqs: spec.drqs,
      }));

    // Depeg readings (live)
    const depegReadings = await fetchDepegReadings(eurUsd);

    // Per-asset state classification
    const states = depegReadings.map(r => ({
      ...classifyStablecoinState(r),
      drqs: approved[r.asset]?.drqs ?? 0,
      targetAllocation: approved[r.asset]?.target ?? 0,
      valueUsd: positions.find(p => p.asset === r.asset)?.valueUsd ?? 0,
    }));

    // Sleeve-level aggregate exposure
    const exposure = computeStablecoinExposure(positions, rA);

    // DRQS for all assets (including optional DAI)
    const drqsResults = computeAllDrqs();

    // Constitutional limit checks
    const totalSleevePct = exposure.se;
    const maxAllowed = DIGITAL_LIQUIDITY_SPEC.MAX_TOTAL * 100;
    const targetPct = DIGITAL_LIQUIDITY_SPEC.TARGET * 100;
    const withinMaxCap = totalSleevePct <= maxAllowed;
    const atOrBelowTarget = totalSleevePct <= targetPct + 0.01;

    // Bullion → Digital barrier (constitutional)
    const bullionDigitalBarrier = {
      rule: "Bullion → Digital conversion requires EMERGENCY governance",
      severity: "EMERGENCY_GOVERNANCE",
      rationale:
        "Bullion is the constitutional anchor; digital liquidity is operational. " +
        "Conversion from anchor to operational requires the highest governance severity.",
      currentBullionPct: nav.pillarBreakdown.bullion,
      currentDigitalPct: nav.pillarBreakdown.digital,
    };

    // Aggregate sleeve state (worst of all dimensions)
    const sleeveStateOrder = ["NORMAL", "WATCH", "REDUCE", "SUSPEND", "EMERGENCY_EXIT"] as const;
    let worstState: (typeof sleeveStateOrder)[number] = "NORMAL";
    for (const s of states) {
      if (s.actionRequired && s.state !== "NORMAL") {
        const idx = sleeveStateOrder.indexOf(
          s.state as (typeof sleeveStateOrder)[number],
        );
        if (idx > sleeveStateOrder.indexOf(worstState)) {
          worstState = sleeveStateOrder[idx];
        }
      }
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      sleeveState: worstState,
      composition: states.map(s => ({
        asset: s.asset,
        peg: s.peg,
        valueUsd: Math.round(s.valueUsd * 100) / 100,
        shareOfRa: rA > 0 ? (s.valueUsd / rA) * 100 : 0,
        targetAllocation: s.targetAllocation * 100,
        drqs: s.drqs,
        drqsClassification:
          s.drqs >= 7.5 ? "core" : s.drqs >= 6.0 ? "conditional" : "excluded",
        liveState: s.state,
        priceDev: s.dimensions.priceDev,
        reason: s.reason,
        actionRequired: s.actionRequired,
      })),
      exposure: {
        se: exposure.se,
        sae: exposure.sae,
        totalStablecoinUsd: exposure.totalStablecoinUsd,
        totalRiskAdjustedUsd: exposure.totalRiskAdjustedUsd,
        withinMaxCap,
        atOrBelowTarget,
        concentrationOk: exposure.concentrationOk,
      },
      drqs: drqsResults,
      depegReadings,
      bullionDigitalBarrier,
      constitutionalLimits: {
        maxTotal: `${maxAllowed.toFixed(1)}%`,
        target: `${targetPct.toFixed(1)}%`,
        maxPerIssuer: `${(DIGITAL_LIQUIDITY_SPEC.MAX_PER_ISSUER * 100).toFixed(1)}%`,
        minIssuers: DIGITAL_LIQUIDITY_SPEC.MIN_ISSUERS,
        drqsCoreThreshold: DIGITAL_LIQUIDITY_SPEC.DRQS_CORE_THRESHOLD,
        algorithmicExcluded: DIGITAL_LIQUIDITY_SPEC.ALGORITHMIC_EXCLUDED,
      },
      stateMachine: STABLECOIN_STATE_MACHINE,
      allWithinLimits: withinMaxCap && exposure.concentrationOk && worstState === "NORMAL",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to compute stablecoin sleeve state",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}

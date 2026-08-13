import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";
import { computeCbgrs } from "@/lib/cbgrs";
import { STATE_CORRIDORS, transitionState, getCurrentState } from "@/lib/reserve-state-engine";
import { computeMRRC, type AssetPosition } from "@/lib/mrrc";
import { computeCalm } from "@/lib/calm";
import {
  classifyCurrencyLifecycle,
  computeMultiDimRebalance,
  computeStressAwareTarget,
} from "@/lib/dynamic-rebalancer";

/**
 * GET /api/rebalancing-dashboard
 *
 * v24.1.1 Institutional Dynamic Reserve Rebalancing Dashboard.
 * Combines all components:
 *   - Reserve State Engine (5 states)
 *   - CALM (Capital-Adaptive Liability Management)
 *   - MRRC (Marginal Reserve Risk Contribution)
 *   - Multi-dimensional rebalancing (4D)
 *   - Gold-relative currency lifecycle
 *   - CBGRS
 *   - Stress-aware target portfolio
 *   - Explainability
 */
export async function GET() {
  try {
    const [nav, cbgrs] = await Promise.all([
      computeLiveNav(),
      computeCbgrs(),
    ]);

    const rr = nav.reserveRatio;
    const ra = nav.reserveAdjustedUsd;
    const supply = nav.supply;
    const par = 1.00;

    // Approximate LCR/LRR from nav data
    const hqla = ra * 0.80; // ~80% of R_a is HQLA
    const outflows = supply * par * 0.10; // 10% stress
    const lcr = hqla / outflows;
    const lrr = lcr; // simplified

    // 1. Reserve State Engine
    const stateResult = transitionState({
      rr,
      stressRR: rr * 0.85, // approximate stress-RR
      lcr,
      lrr,
      cbgrs: cbgrs.cbgrs,
      redemptionPressure: 0.1, // low
      oracleHealth: 0.9,
      custodyStress: 0.1,
    });

    // 2. CALM
    const calm = computeCalm({
      ra,
      supply,
      par,
      reserveState: stateResult.currentState,
      rr,
    });

    // 3. MRRC — build positions from currency concentration
    const positions: AssetPosition[] = [];
    for (const c of cbgrs.currencies) {
      const vol = c.currency === "USD" ? 0.05 : c.currency === "EUR" ? 0.07 : 0.08;
      positions.push({
        name: c.currency,
        weight: c.finalWeight,
        volatility: vol,
        expectedReturn: 0,
      });
    }
    // Add gold and silver
    positions.push({ name: "Gold", weight: 0.15, volatility: 0.15, expectedReturn: 0 });
    positions.push({ name: "Silver", weight: 0.05, volatility: 0.30, expectedReturn: 0 });
    const mrrc = computeMRRC(positions);

    // 4. Currency Lifecycle
    const lifecycleResults = cbgrs.currencies.map(c =>
      classifyCurrencyLifecycle({
        currency: c.currency,
        goldRelativeStrength: c.goldRelativeStrength,
        goldRelativeDepreciation: c.goldRelativeDepreciation,
        cqs: 7.0, // default
        convertibilityOk: true,
        sanctionsHit: false,
        custodyOk: true,
        settlementOk: true,
        liquidityOk: true,
        marketOpen: true,
      })
    );

    // 5. Multi-dimensional rebalancing
    const currentWeights: Record<string, number> = {};
    const targetWeights: Record<string, number> = {};
    for (const c of cbgrs.currencies) {
      currentWeights[c.currency] = c.finalWeight;
      // Normal target weights from v24.1.1
      const targets: Record<string, number> = {
        USD: 0.27, EUR: 0.195, CHF: 0.065, JPY: 0.065, GBP: 0.05,
        SGD: 0.04, AED: 0.03, SAR: 0.03, CNY: 0.02, CAD: 0.005, AUD: 0.005,
      };
      targetWeights[c.currency] = targets[c.currency] || 0;
    }

    // Stress-aware target (70% normal + 30% stress)
    const stressWeights = { ...targetWeights };
    // In stress: reduce CNY, increase CHF
    if (stressWeights.CNY) { stressWeights.CNY *= 0.5; }
    if (stressWeights.CHF) { stressWeights.CHF *= 1.3; }
    const robustTarget = computeStressAwareTarget({
      wNormal: targetWeights,
      wStress: stressWeights,
      lambda: 0.70,
    });

    const rebalance = computeMultiDimRebalance({
      currentCurrencyWeights: currentWeights,
      targetCurrencyWeights: robustTarget,
      currentCustodyAllocations: [
        { custodian: "Custodian-A", jurisdiction: "US", weight: 0.25, commonModeGroupId: "group1" },
        { custodian: "Custodian-B", jurisdiction: "CH", weight: 0.20, commonModeGroupId: "group2" },
        { custodian: "Custodian-C", jurisdiction: "GB", weight: 0.20, commonModeGroupId: "group3" },
        { custodian: "Custodian-D", jurisdiction: "SG", weight: 0.20, commonModeGroupId: "group4" },
        { custodian: "Custodian-E", jurisdiction: "US", weight: 0.15, commonModeGroupId: "group1" },
      ],
      targetMaxCustodianPct: 0.15,
      targetMaxJurisdictionPct: 0.30,
      rebalanceThreshold: 0.005,
    });

    // 6. Dashboard data
    return NextResponse.json({
      generatedAt: new Date().toISOString(),

      // Top level
      top: {
        totalReserve: 100,
        bullion: nav.pillarBreakdown.bullion,
        fiat: nav.pillarBreakdown.fiat,
        digital: nav.pillarBreakdown.digital,
      },

      // Solvency
      solvency: {
        rr,
        policyRR: 105,
        strategicRR: 120,
        stressRR: rr * 0.85,
        requiredRR: 100,
        calm,
      },

      // Liquidity
      liquidity: {
        lcr: Math.round(lcr * 100) / 100,
        lrr: Math.round(lrr * 100) / 100,
        prefundedLiquidity: "framework_ready",
      },

      // Reserve State
      reserveState: {
        current: stateResult.currentState,
        previous: stateResult.previousState,
        transitioned: stateResult.transitioned,
        reason: stateResult.reason,
        corridor: stateResult.corridor,
      },

      // Currency
      currencies: lifecycleResults.map((l, i) => ({
        currency: l.currency,
        lifecycleState: l.state,
        lifecycleReason: l.reason,
        currentWeight: cbgrs.currencies[i]?.finalWeight || 0,
        targetWeight: robustTarget[l.currency] || 0,
        cqs: 7.0,
        goldRelativeStrength: cbgrs.currencies[i]?.goldRelativeStrength || 1.0,
        goldRelativeDepreciation: cbgrs.currencies[i]?.goldRelativeDepreciation || 0,
        mrrc: mrrc.results.find(m => m.asset === l.currency)?.mrrc || 0,
        riskContributionPct: mrrc.results.find(m => m.asset === l.currency)?.riskContributionPct || 0,
      })),

      // Bullion
      bullion: {
        goldPct: nav.pillarBreakdown.bullion * 0.85,
        silverPct: nav.pillarBreakdown.bullion * 0.15,
        bullionPct: nav.pillarBreakdown.bullion,
        bri: nav.bri,
      },

      // Digital
      digital: {
        digitalPct: nav.pillarBreakdown.digital,
        target: 3.5,
        max: 5.0,
      },

      // CBGRS
      cbgrs: {
        value: cbgrs.cbgrs,
        arithmetic: cbgrs.cbgrsArithmetic,
        changeFromBase: cbgrs.changeFromBase,
      },

      // Custody
      custody: {
        custodians: [
          { name: "Custodian-A", weight: 0.25, jurisdiction: "US" },
          { name: "Custodian-B", weight: 0.20, jurisdiction: "CH" },
          { name: "Custodian-C", weight: 0.20, jurisdiction: "GB" },
          { name: "Custodian-D", weight: 0.20, jurisdiction: "SG" },
          { name: "Custodian-E", weight: 0.15, jurisdiction: "US" },
        ],
        jurisdictionConcentration: {
          US: 0.40,
          CH: 0.20,
          GB: 0.20,
          SG: 0.20,
        },
        commonModeScore: 0.25, // 25% common-mode (Custodian-A and E share US)
        maxCustodianPct: 0.25,
        maxJurisdictionPct: 0.40,
      },

      // Rebalancing
      rebalancing: {
        actions: rebalance.currencyActions,
        custodyActions: rebalance.custodyActions,
        jurisdictionActions: rebalance.jurisdictionActions,
        totalActions: rebalance.totalActions,
        estimatedCost: rebalance.estimatedTotalCost,
        riskReduction: rebalance.estimatedNetRiskReduction,
        maxSeverity: rebalance.maxSeverity,
        approvalRequired: rebalance.approvalRequired,
        explainability: rebalance.explainability,
        robustTarget,
        lambda: 0.70,
      },

      // MRRC
      mrrc: {
        cvar95: mrrc.cvar95,
        cvar99: mrrc.cvar99,
        results: mrrc.results,
      },

      // Stabilization fee
      stabilizationFee: {
        bps: calm.stabilizationFeeBps,
        state: stateResult.currentState,
      },

      // Nav context
      nav: {
        navM: nav.navM,
        navL: nav.navL,
        goldUsd: nav.goldUsd,
        silverUsd: nav.silverUsd,
        reserveMarketUsd: nav.reserveMarketUsd,
        reserveAdjustedUsd: nav.reserveAdjustedUsd,
      },

      // Defense hierarchy (§51)
      defenseHierarchy: [
        "1. Detect risk",
        "2. Rebalance reserves",
        "3. Improve liquidity",
        "4. Diversify custody",
        "5. Diversify jurisdictions",
        "6. Reduce digital risk",
        "7. Substitute failing currencies",
        "8. Restrict new issuance (CALM)",
        "9. Apply resilience contributions",
        "10. Only then: additional reserve capitalization",
      ],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to compute rebalancing dashboard", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";
import { computeCbgrs } from "@/lib/cbgrs";
import { transitionState } from "@/lib/reserve-state-engine";
import { computeCalm } from "@/lib/calm";
import { computeMRRC, type AssetPosition } from "@/lib/mrrc";
import { computeEigenvalueMonitor, buildCovarianceMatrix } from "@/lib/eigenvalue-monitor";
import { computeEffectiveCustodyRisk, getDefaultCustodyPositions } from "@/lib/effective-custody-risk";
import { computeErtf, getDefaultErtfInstruments } from "@/lib/ertf";
import { computeInKindDelivery, type ReserveAssetSlice } from "@/lib/in-kind-delivery";

/**
 * GET /api/v24.1.2/resilience-stack
 *
 * MITHQAL v24.1.2 — 7-Layer Capital-Efficient Resilience Architecture
 *
 * Layer 1 — Sovereign & Custody Isolation (15% cap, EffectiveCustodyRisk)
 * Layer 2 — Correlation & Tail-Risk Intelligence (eigenvalue, MRRC, Cornish-Fisher)
 * Layer 3 — Dynamic Reserve Rebalancing (4D: currency × asset × custodian × jurisdiction)
 * Layer 4 — Gold/Silver Crisis Balancing (15-25% dynamic bullion)
 * Layer 5 — Liquidity & CALM (dynamic digital, prefunded, corrected CALM)
 * Layer 6 — External Risk Transfer (ERTF — ring-fenced, non-reserve)
 * Layer 7 — In-Kind Emergency Reserve Delivery (pro-rata, market value NOT PAR)
 *
 * REJECTED from third-party proposal:
 *   - "Zero commercial default risk / 0% LGD" → replaced with EffectiveCustodyRisk
 *   - DEX synthetic derivatives → replaced with 3-level hedge hierarchy
 *   - MTQ-J inside monetary core → replaced with external ERTF
 *   - "Guaranteed 100% PAR in-kind" → replaced with market-value delivery
 *
 * CALM direction CORRECTED: Risk↑ → RR_target↑ → MintCapacity↓
 */
export async function GET() {
  try {
    const [nav, cbgrs] = await Promise.all([
      computeLiveNav(),
      computeCbgrs(),
    ]);

    const rr = nav.reserveRatio;
    const ra = nav.reserveAdjustedUsd;
    const rm = nav.reserveMarketUsd;
    const supply = nav.supply;
    const par = 1.00;
    const liability = supply * par;

    const hqla = ra * 0.80;
    const outflows = liability * 0.10;
    const lcr = hqla / outflows;

    // Reserve State
    const stateResult = transitionState({
      rr, stressRR: rr * 0.85, lcr, lrr: lcr,
      cbgrs: cbgrs.cbgrs, redemptionPressure: 0.1, oracleHealth: 0.9, custodyStress: 0.1,
    });

    // === LAYER 1: Sovereign & Custody Isolation ===
    const custodyPositions = getDefaultCustodyPositions();
    const custodyReport = computeEffectiveCustodyRisk(custodyPositions);

    // === LAYER 2: Correlation & Tail-Risk Intelligence ===
    // Build covariance matrix from currency volatilities
    const volatilities = [0.05, 0.07, 0.06, 0.08, 0.06, 0.05, 0.05, 0.04, 0.10, 0.06, 0.07, 0.15, 0.30];
    const n = volatilities.length;
    const correlations = Array(n).fill(0).map((_, i) =>
      Array(n).fill(0).map((_, j) => i === j ? 1.0 : 0.25)
    );
    const covMatrix = buildCovarianceMatrix(volatilities, correlations);
    const baselineLambda1 = volatilities.reduce((s, v) => s + v * v, 0) * 0.3; // approximate baseline
    const eigenvalueResult = computeEigenvalueMonitor({
      covarianceMatrix: covMatrix,
      baselineLambda1,
    });

    // MRRC
    const positions: AssetPosition[] = cbgrs.currencies.map(c => ({
      name: c.currency,
      weight: c.finalWeight,
      volatility: c.currency === "USD" ? 0.05 : c.currency === "EUR" ? 0.07 : 0.08,
      expectedReturn: 0,
    }));
    positions.push({ name: "Gold", weight: 0.15, volatility: 0.15, expectedReturn: 0 });
    positions.push({ name: "Silver", weight: 0.05, volatility: 0.30, expectedReturn: 0 });
    const mrrc = computeMRRC(positions);

    // === LAYER 5: CALM (corrected direction) ===
    const calm = computeCalm({ ra, supply, par, reserveState: stateResult.currentState, rr });

    // === LAYER 6: ERTF ===
    const ertfInstruments = getDefaultErtfInstruments();
    const ertf = computeErtf(ertfInstruments, ra);

    // === LAYER 7: In-Kind Delivery ===
    const reserveAssets: ReserveAssetSlice[] = [
      { asset: "USD Cash", weight: 0.20, marketValueUsd: rm * 0.20, deliveryEligible: true, deliveryForm: "Bank transfer" },
      { asset: "EUR Cash", weight: 0.15, marketValueUsd: rm * 0.15, deliveryEligible: true, deliveryForm: "Bank transfer" },
      { asset: "Gold (allocated)", weight: 0.15, marketValueUsd: rm * 0.15, deliveryEligible: true, deliveryForm: "Physical delivery (1kg min)" },
      { asset: "Silver (allocated)", weight: 0.05, marketValueUsd: rm * 0.05, deliveryEligible: true, deliveryForm: "Physical delivery" },
      { asset: "Sovereign T-bills", weight: 0.30, marketValueUsd: rm * 0.30, deliveryEligible: true, deliveryForm: "Security transfer" },
      { asset: "Stablecoins", weight: 0.035, marketValueUsd: rm * 0.035, deliveryEligible: false, deliveryForm: "N/A (not eligible for in-kind)" },
    ];
    const inKind = computeInKindDelivery({
      mtqAmount: 1000, // example: 1000 MTQ
      par,
      totalReserveValueUsd: rm,
      totalSupply: supply,
      assets: reserveAssets,
      reserveState: stateResult.currentState,
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      version: "v24.1.2",
      architectureName: "7-Layer Capital-Efficient Resilience Architecture",

      baseline: {
        rr, ra, rm, supply, liability, lcr: Math.round(lcr * 100) / 100,
        goldUsd: nav.goldUsd, silverUsd: nav.silverUsd,
        bullionPct: nav.pillarBreakdown.bullion,
        fiatPct: nav.pillarBreakdown.fiat,
        digitalPct: nav.pillarBreakdown.digital,
        cbgrs: cbgrs.cbgrs,
      },

      reserveState: {
        current: stateResult.currentState,
        previous: stateResult.previousState,
        reason: stateResult.reason,
        corridor: stateResult.corridor,
      },

      layers: {
        layer1_custody: {
          name: "Sovereign & Custody Isolation",
          custodyReport,
          hardCap: "15% per custodian",
          sovereignConditional: "0 ≤ CBExposure ≤ 50% (subject to legal availability)",
          rejectedClaim: "ZERO commercial default risk / 0% LGD is too absolute — residual risk always modeled",
          effectiveRiskFormula: "EffectiveCustodyRisk = Exposure × LGD × CommonMode × (1 - RecoveryFactor)",
        },

        layer2_correlation: {
          name: "Correlation & Tail-Risk Intelligence",
          eigenvalue: eigenvalueResult,
          mrrc: { cvar95: mrrc.cvar95, cvar99: mrrc.cvar99, topRiskContributors: mrrc.results.slice(0, 5) },
          rejectedApproach: "NO DEX synthetic derivatives as core hedge — conflicts with anti-speculation philosophy",
          hedgeHierarchy: [
            "Level A — Structural hedge: Rebalance Currency×Asset×Custody×Jurisdiction first",
            "Level B — Natural hedge: Increase gold, short-duration liquidity, uncorrelated reserves",
            "Level C — Regulated hedge: Only where necessary, through approved institutional entities (centrally cleared, bilateral)",
          ],
        },

        layer3_rebalancing: {
          name: "Dynamic Reserve Rebalancing",
          dimensions: ["Currency", "Asset Class", "Custodian", "Jurisdiction"],
          optimization: "CVaR + MRRC + CBGRS + CQS + Liquidity + ExecutionCost",
          stressAwareTarget: "W_robust = 0.70×W_normal + 0.30×W_stress",
          status: "Implemented (v24.1.1 — preserved)",
        },

        layer4_bullion: {
          name: "Gold/Silver Crisis Balancing",
          goldRole: "Strategic Anchor",
          silverRole: "Intermediate Reserve",
          bullionRange: "15-25% (dynamic within liquidity/Stress-RR constraints)",
          goldTarget: "15% (range 12-18%)",
          silverTarget: "5% (range 3-8%)",
          phiTarget: "85% gold / 15% silver",
          noExtraCapital: "Bullion adjusts within existing reserve — no additional capital needed",
        },

        layer5_liquidity_calm: {
          name: "Liquidity & CALM",
          normalDigital: "3.5%",
          stressDigitalRange: "4-5% (temporary, from fiat — not additional capital)",
          stablecoinStress: "Stablecoins → 0%; tokenized government/cash liquidity may remain",
          calm,
          calmDirectionCorrected: "Risk↑ → RR_target↑ → MintCapacity↓ (NEVER Risk↑ → MintCapacity↑)",
          crisisMint: "Mint = 0 in CRISIS state",
        },

        layer6_ertf: {
          name: "External Risk Transfer Facility",
          ertf,
          ringFenced: "Legally separate from monetary reserve",
          nonReserve: "Does NOT count toward R_a",
          nonPar: "Does NOT affect PAR",
          nonMonetary: "NOT required for ordinary MTQ redemption",
          parametricModeling: "NetRecovery = PolicyLimit × TriggerProbability × RecoveryFactor (NOT guaranteed T+0)",
        },

        layer7_inKind: {
          name: "In-Kind Emergency Reserve Delivery",
          inKind,
          rejectedClaim: "Guaranteed 100% PAR in-kind is mathematically impossible if reserves have declined",
          correctFormula: "InKindValue = MarketValue(DeliveredAssets), NOT InKindValue = PAR",
          micaCompatible: "MiCA allows redemption through delivery of referenced assets in specified circumstances",
        },
      },

      rejectedThirdPartyProposals: [
        {
          proposal: "Zero commercial default risk / 0% LGD",
          verdict: "REJECTED — too absolute",
          replacement: "EffectiveCustodyRisk with residual risk always modeled",
        },
        {
          proposal: "Automated synthetic derivatives as primary correlation hedge",
          verdict: "REJECTED — conflicts with anti-speculation/anti-rehypothecation philosophy",
          replacement: "3-level hedge hierarchy (structural → natural → regulated institutional only)",
        },
        {
          proposal: "MTQ-J first-loss tranche inside monetary core",
          verdict: "REJECTED — changes capital structure, turns MTQ into tranched investment product",
          replacement: "ERTF — external, ring-fenced, legally separate",
        },
        {
          proposal: "In-kind delivery guarantees 100% PAR",
          verdict: "REJECTED — mathematically impossible if reserves have declined",
          replacement: "In-kind at market value, not PAR",
        },
      ],

      defenseHierarchy: [
        "1. Detect risk (eigenvalue + CBGRS + MRRC)",
        "2. Rebalance reserves (Layer 3)",
        "3. Improve liquidity (Layer 5)",
        "4. Diversify custody (Layer 1 — 15% cap)",
        "5. Diversify jurisdictions (Layer 1)",
        "6. Reduce digital risk (Layer 5)",
        "7. Substitute failing currencies (Layer 3)",
        "8. Restrict new issuance (CALM — Layer 5)",
        "9. Apply resilience contributions (Layer 5 fees)",
        "10. Activate ERTF if needed (Layer 6 — external, ring-fenced)",
        "11. In-kind emergency delivery (Layer 7 — market value, NOT PAR)",
        "12. Only then: additional reserve capitalization (LAST RESORT)",
      ],

      principles: {
        resilience: "Resilience = prevention + diversification + risk transfer + liquidity + liability control + recovery",
        notEqual: "Resilience ≠ more permanent collateral",
        strategicTarget: "RR strategic = 120% (UNCHANGED — no permanent increase unless mathematically proven necessary)",
        reserveTotal: "B = F + D = 100% (UNCHANGED)",
        rrIsSolvency: "RR = R_a / (S × PAR) — SINGLE legal solvency metric",
        goldAnchor: "Gold = constitutional anchor (NOT a peg)",
        par: "PAR = $1.00 (UNCHANGED)",
      },

      status: "IMPLEMENTED — PENDING INDEPENDENT INSTITUTIONAL VALIDATION",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to compute resilience stack", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

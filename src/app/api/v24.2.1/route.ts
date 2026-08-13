import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";
import { computeCalm } from "@/lib/calm";
import { transitionStateV242, STATE_CONFIGS_V242 } from "@/lib/v24-2-state-machine";
import {
  computeTgrs,
  checkTokenizedGoldEligibility,
  evaluateSilverAdmission,
  computePhiT,
  computeRevisedBri,
  compareCandidates,
  computeGlobalState,
  CANDIDATE_PORTFOLIOS,
  LIQUIDATION_ORDER_V2421,
  type TgrsFactors,
  type TokenizedGoldEligibility,
  type SilverAdmissionInput,
} from "@/lib/v24-2-1-gold-silver";

/**
 * GET /api/v24.2.1
 *
 * MITHQAL v24.2.1 — Tokenized Allocated Gold + Conditional Silver + CALM Fix
 *
 * Key changes from v24.2:
 *   1. CALM targets corrected (NORMAL=1.20, not 1.15)
 *   2. Tokenized Allocated Gold layer added (TGRS, eligibility, haircut)
 *   3. Silver made conditional (0% normal, 0-3% conditional, SDC_Ag)
 *   4. φ_t rewritten (gold mandatory dominant)
 *   5. BRI revised (GoldResilienceIndex + ConditionalMetalDiversificationIndex)
 *   6. Liquidation order updated (tokenized gold before physical gold)
 *   7. Subsystem state reconciliation (7 subsystem states)
 *   8. A/B/C/D/E portfolio comparison
 */
export async function GET() {
  try {
    const nav = await computeLiveNav();
    const rr = nav.reserveRatio;
    const ra = nav.reserveAdjustedUsd;
    const rm = nav.reserveMarketUsd;
    const supply = nav.supply;
    const par = 1.00;
    const liability = supply * par;

    // CALM (v24.2.1 corrected targets)
    const stateResult = transitionStateV242({
      rr, stressRR: Math.max(rr * 0.90, 100),
      lcr: 7.0, lrr: 7.0, cbgrs: 0.96,
      eigenvalueIndex: 1.0, redemptionPressure: 0.1,
      oracleHealth: 0.9, custodyStress: 0.1, correlationBreak: 0,
    });

    const calmStateMap: Record<string, "NORMAL" | "ELEVATED" | "HIGH_STRESS" | "CRISIS" | "RECOVERY"> = {
      "NORMAL": "NORMAL", "CAUTION": "ELEVATED", "DEFENSIVE": "ELEVATED",
      "STRESS": "HIGH_STRESS", "EMERGENCY": "CRISIS", "RECOVERY": "RECOVERY",
    };
    const calm = computeCalm({
      ra, supply, par,
      reserveState: calmStateMap[stateResult.currentState] || "NORMAL",
      rr,
    });

    // Tokenized Gold — example TGRS for a hypothetical tokenized gold product
    const tgrsFactors: TgrsFactors = {
      physicalBacking: 9.5,    // Verified allocated physical gold
      legalTitle: 9.0,         // Strong legal title
      custody: 9.0,            // Allocated, segregated, bankruptcy-remote
      redemption: 8.5,         // Reliable redemption
      issuerReliability: 8.0,  // Established issuer
      oracleReliability: 8.5,  // Approved oracle
      settlement: 7.5,         // Good settlement
      liquidity: 7.0,          // Moderate secondary market
      operationalResilience: 8.0, // Good ops
      jurisdiction: 8.5,       // Good jurisdiction
    };
    const tgrs = computeTgrs(tgrsFactors);

    const tgEligibility: TokenizedGoldEligibility = {
      identifiablePhysicalBacking: true,
      legallyEnforceableOwnership: true,
      allocatedCustody: true,
      segregation: true,
      bankruptcyRemoteness: true,
      noRehypothecation: true,
      independentReconciliation: true,
      independentValuation: true,
      redemptionRights: true,
      approvedOraclePricing: true,
      legalReview: true,
      technologyLedgerIntegrity: true,
      operationalContinuity: true,
    };
    const tgEligibilityResult = checkTokenizedGoldEligibility(tgEligibility);

    // Silver Admission Test
    const silverInput: SilverAdmissionInput = {
      cvarWithSilver: 0.134, cvarWithoutSilver: 0.132,
      stressRRWithSilver: 99.5, stressRRWithoutSilver: 100.1,
      lcrWithSilver: 7.0, lcrWithoutSilver: 7.1,
      silverExecutionCostBps: 20, silverLiquidityDepth: 0.5,
      silverCustodyCost: 0.001, silverVolatility: 0.30,
    };
    const silverResult = evaluateSilverAdmission(silverInput);

    // φ_t (provisional: Model B — 15% physical + 5% tokenized + 0% silver)
    const phiT = computePhiT(0.15, 0.05, 0.0, 0.0);

    // Revised BRI
    const bri = computeRevisedBri(
      rm * 0.15, rm * 0.15, // gold unchanged
      rm * 0.0, rm * 0.0,   // silver = 0
      0.0,                   // silver weight = 0
    );

    // A/B/C/D/E Portfolio Comparison
    const candidates = compareCandidates(nav.goldUsd, nav.silverUsd, ra, liability);

    // Subsystem States
    const subsystemStates = {
      liquidityState: "NORMAL",
      correlationState: "CAUTION",
      custodyState: "NORMAL",
      currencyState: "NORMAL",
      digitalState: "NORMAL",
      oracleState: "NORMAL",
      modelState: "NORMAL",
    };
    const globalState = computeGlobalState(subsystemStates);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      version: "v24.2.1",
      amendmentName: "Tokenized Allocated Gold + Conditional Silver + CALM Fix",

      // §3 — Constitutional Invariants (PRESERVED)
      constitutional: {
        PAR: 1.00,
        RR_formula: "RR = R_a / (S × PAR)",
        RR_floor: "100%",
        RR_policy: "105%",
        RR_strategic: "120% (UNCHANGED — NOT replaced with 102%)",
        reserveConservation: "B + F + D = 100%",
        ranges: "Bullion 15-25%, Fiat 70-85%, Digital 0-5%",
      },

      // §5 — CALM Correction (v24.2.1 FIX)
      calm: {
        ...calm,
        correctedTargets: {
          NORMAL: "1.20 (was 1.15 — FIXED: now = strategic target)",
          CAUTION: "1.22 (was 1.18)",
          DEFENSIVE: "1.23 (was 1.20)",
          STRESS: "1.25 (unchanged)",
          EMERGENCY: "1.30 (unchanged)",
          RECOVERY: "1.21 (was 1.20)",
        },
        direction: "Risk↑ → RR_target↑ → S_max↓ → MintCapacity↓ (monotonic)",
        emergencyMinting: "BLOCKED",
      },

      // §10-16 — Tokenized Allocated Gold
      tokenizedGold: {
        identity: "Gold_total = PhysicalAllocatedGold + TokenizedAllocatedGold (NO double-counting)",
        tgrs,
        eligibility: tgEligibilityResult,
        haircutFormula: "H_TG = max(5%, 5% + (10 - TGRS) × 0.5%)",
        recommendedHaircut: tgrs.haircutRecommendation,
        dynamicRange: "Physical 10-20%, Tokenized 0-7%, Total bullion ≤25%",
        rejected: ["Unallocated claims", "Synthetic gold", "ETFs", "Derivatives", "Futures"],
        provisionalTarget: "Physical 15% + Tokenized 5% = Gold_total 20% (PENDING A/B validation)",
      },

      // §17-19 — Conditional Silver
      conditionalSilver: {
        policy: "Silver normal target = 0% (was 3% in v24.2)",
        conditionalRange: "0-3%",
        admissionTest: silverResult,
        sdcAgFormula: "SDC_Ag = net_resilience_gain - net_cost",
        validOutcome: "Silver = 0% is a VALID policy result if no diversification benefit",
      },

      // §20 — φ_t Rewrite
      phiT: {
        ...phiT,
        principle: "Gold is mandatory dominant. Silver is conditional. No fixed 75/25 requirement.",
        goldDominantThreshold: "≥70% gold share within bullion",
      },

      // §21 — BRI Revision
      bri: {
        ...bri,
        revision: "If SilverWeight=0, BRI = GoldResilienceIndex (silver component = 0, NOT an error)",
        advisory: "BRI remains ADVISORY ONLY — does NOT modify PAR/RR/minting/liquidation",
      },

      // §22 — Updated Liquidation Order
      liquidationOrder: LIQUIDATION_ORDER_V2421,

      // §33 — Subsystem State Reconciliation
      subsystemStates: {
        ...subsystemStates,
        globalState,
        principle: "GlobalState ≥ highest subsystem state (with hysteresis)",
      },

      // §37 — A/B/C/D/E Portfolio Comparison
      portfolioComparison: {
        candidates: CANDIDATE_PORTFOLIOS,
        results: candidates,
        winner: candidates.find(c => c.winner),
        selectionProtocol: "Winner selected by: highest StressRR → lowest CVaR → lowest model dependency. NOT by preference.",
      },

      // §53 — Provisional Strategic Reference
      provisionalPortfolio: {
        physicalGold: "15%",
        tokenizedGold: "5%",
        silver: "0% (conditional)",
        fiat: "77.5%",
        digital: "2.5%",
        total: "100%",
        status: "PROVISIONAL — PENDING A/B STRESS VALIDATION",
      },

      // §54 — Anti-Double-Counting
      antiDoubleCounting: {
        goldTotal: "PhysicalGold + TokenizedGold",
        silverTotal: "PhysicalSilver + TokenizedSilver",
        bullion: "GoldTotal + SilverTotal",
        totalReserve: "Bullion + Fiat + Digital = 100%",
        rule: "Tokenized metal underlying assets MUST NOT be added twice",
      },

      // §59 — Release Gates (v24.2.1 extended)
      releaseGates: {
        existing: "All v24.2 gates preserved",
        new: [
          "11. Tokenized Gold Gate — TGRS ≥ 8.0, eligibility passed, haircut validated",
          "12. Silver Conditionality Gate — SDC_Ag test run, admission decision documented",
          "13. Capital-Efficiency Gate — no permanent reserve increase without ΔCapital_min proof",
          "14. Reproducibility Gate — 250K MC reproduced from seed=42, baseline captured",
        ],
      },

      // Live values
      liveValues: {
        rr: nav.reserveRatio,
        ra, rm, supply, liability,
        goldUsd: nav.goldUsd,
        silverUsd: nav.silverUsd,
      },

      // Status
      status: "IMPLEMENTED / VALIDATION REQUIRED",
      productionDecision: "CONDITIONAL_GO",
      decisionReason: "v24.2.1 architecture implemented. CALM corrected. Tokenized gold framework ready. Silver conditional. A/B comparison run. Provisional portfolio pending validation. Institutional validation required.",

      // What's NOT changed
      preserved: [
        "PAR = $1.00",
        "RR = R_a / (S × PAR) — single legal solvency metric",
        "RR_strategic = 120% (NOT 102%)",
        "Constitutional ranges (Bullion 15-25%, Fiat 70-85%, Digital 0-5%)",
        "6-state reserve machine",
        "4-tier hierarchical optimizer",
        "StressDRQS",
        "Effective USD Exposure (≤30% target, ≤35% ceiling)",
        "ERTF (external, ring-fenced)",
        "In-kind delivery (market value, NOT PAR)",
        "OFAC fail-closed",
        "Jurisdictional matrix + China geo-fence",
        "ModelValidityGate",
      ],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to compute v24.2.1 state", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

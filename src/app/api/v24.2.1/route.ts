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
  monitorTgrs,
  enforceAntiDoubleCounting,
  computeTgls,
  computeDynamicHaircut,
  computeAttestationFreshness,
  runAllTokenizedGoldStress,
  PAXG_TGLS_FACTORS,
  PAXG_ATTESTATION_FRESHNESS,
  CANDIDATE_PORTFOLIOS,
  LIQUIDATION_ORDER_V2421,
  APPROVED_PORTFOLIO_B,
  TOKENIZED_GOLD_REGISTRY,
  CANONICAL_TOKENIZED_GOLD,
  type TgrsFactors,
  type TokenizedGoldEligibility,
  type SilverAdmissionInput,
} from "@/lib/v24-2-1-gold-silver";
import { computeTgbs, computeVtg } from "@/lib/tokenized-gold-oracle";

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

    // v25.0 FIX: CALM now uses v24.2 6-state machine directly (no mapping needed)
    const calmStateMap: Record<string, "NORMAL" | "CAUTION" | "DEFENSIVE" | "STRESS" | "EMERGENCY" | "RECOVERY"> = {
      "NORMAL": "NORMAL", "CAUTION": "CAUTION", "DEFENSIVE": "DEFENSIVE",
      "STRESS": "STRESS", "EMERGENCY": "EMERGENCY", "RECOVERY": "RECOVERY",
    };
    const calm = computeCalm({
      ra, supply, par,
      reserveState: calmStateMap[stateResult.currentState] || "NORMAL",
      rr,
    });

    // Tokenized Gold — VALIDATED PAXG scores (Task 3, 2026-08-13)
    // PAXG is the ONLY Eligible product. TGRS=9.00, 13/13 gate PASS.
    // All scores grounded in: NYDFS+OCC trust charter, monthly Withum attestation,
    // CertiK formal verification (98%), LBMA allocated vaults, published bar serials.
    const tgrsFactors: TgrsFactors = {
      physicalBacking: 9.5,    // LBMA-approved allocated bars, published serials
      legalTitle: 9.5,         // NYDFS trust charter #25379 — strongest legal title
      custody: 9.5,            // Allocated, segregated, bankruptcy-remote (Brink's vaults)
      redemption: 9.0,         // Reliable redemption (1 oz minimum, 0.02% fee)
      issuerReliability: 9.0,  // Paxos Trust Company — NYDFS-regulated, OCC-chartered
      oracleReliability: 8.5,  // Chainlink + Paxos API + independent attestation
      settlement: 8.5,         // ERC-20, 24/7 atomic settlement
      liquidity: 7.5,          // Deep secondary market (Coinbase, Kraken, Uniswap)
      operationalResilience: 8.5, // CertiK 98%, 5+ years operational
      jurisdiction: 9.5,       // US-regulated (NYDFS + OCC dual charter)
    };
    const tgrs = computeTgrs(tgrsFactors);

    const tgEligibility: TokenizedGoldEligibility = {
      identifiablePhysicalBacking: true,   // Published bar serial numbers
      legallyEnforceableOwnership: true,    // NYDFS trust charter
      allocatedCustody: true,               // Brink's allocated vaults
      segregation: true,                    // Bankruptcy-remote segregation
      bankruptcyRemoteness: true,           // Trust structure isolates from Paxos insolvency
      noRehypothecation: true,              // Prohibited by NYDFS charter
      independentReconciliation: true,      // Withum monthly attestation
      independentValuation: true,           // LBMA benchmark pricing
      redemptionRights: true,                // Physical delivery or cash redemption
      approvedOraclePricing: true,           // Chainlink + Paxos API
      legalReview: true,                    // NYDFS-approved legal opinion
      technologyLedgerIntegrity: true,       // CertiK 98% formal verification
      operationalContinuity: true,           // 5+ years, $500M+ AUM
    };
    const tgEligibilityResult = checkTokenizedGoldEligibility(tgEligibility);

    // TGRS Monitoring (fail-closed) — quarterly re-score of PAXG
    const tgrsMonitor = CANONICAL_TOKENIZED_GOLD
      ? monitorTgrs(CANONICAL_TOKENIZED_GOLD)
      : null;

    // Anti-double-counting runtime guard (Task 6)
    const antiDoubleCount = tgrsMonitor
      ? enforceAntiDoubleCounting(
          APPROVED_PORTFOLIO_B.physicalGold,
          APPROVED_PORTFOLIO_B.tokenizedGold,
          tgrsMonitor,
        )
      : null;

    // §17 — TGLS (Tokenized Gold Liquidity Score) — PAXG validated factors
    const tgls = computeTgls(PAXG_TGLS_FACTORS);

    // §18 — TGBS (Tokenized Gold Basis Spread) — live computation
    const tgbs = await computeTgbs();

    // §19 — V_TG valuation (Q_TG = effective tokenized weight × R_a / goldNav)
    // For reporting: assume R_a = $64.8M, tokenized weight = 5% → Q_TG ≈ 0.05 × 64.8M / goldNav
    const effectiveTokWeight = antiDoubleCount?.effectiveTokenizedWeight ?? APPROVED_PORTFOLIO_B.tokenizedGold;
    const qTg = (ra * effectiveTokWeight) / tgbs.goldNavPrice; // approximate oz
    const vtg = await computeVtg({
      quantity: qTg,
      haircut: CANONICAL_TOKENIZED_GOLD?.haircut ?? 0.055,
      confidenceFactor: PAXG_ATTESTATION_FRESHNESS().confidenceFactor,
    });

    // §20 — Dynamic haircut (using current risk inputs)
    const dynamicHaircut = computeDynamicHaircut({
      oracleRisk: tgbs.state === "NORMAL" ? 0.1 : tgbs.state === "ELEVATED" || tgbs.state === "SEVERE" ? 0.3 : 0.6,
      custodyRisk: 0.1,        // PAXG custody = Brink's allocated (low)
      legalRisk: 0.05,         // NYDFS chartered (low)
      redemptionRisk: 0.1,     // 1 oz min, T+1-T+2 (low-moderate)
      liquidityRisk: Math.max(0, (8.0 - tgls.score) / 4), // inverse of TGLS
      issuerRisk: 0.1,         // Paxos Trust Company (low)
      technologyRisk: 0.05,    // CertiK 98% (low)
      basisRisk: Math.min(1, Math.abs(tgbs.spread) / 0.05), // normalized to 5% = full
    });

    // §22 — Attestation freshness
    const attestationFreshness = PAXG_ATTESTATION_FRESHNESS();

    // §23 — Tokenized gold stress suite (16 scenarios)
    const tgStressResults = runAllTokenizedGoldStress(rr, effectiveTokWeight);

    // Silver Admission Test
    const silverInput: SilverAdmissionInput = {
      cvarWithSilver: 0.134, cvarWithoutSilver: 0.132,
      stressRRWithSilver: 99.5, stressRRWithoutSilver: 100.1,
      lcrWithSilver: 7.0, lcrWithoutSilver: 7.1,
      silverExecutionCostBps: 20, silverLiquidityDepth: 0.5,
      silverCustodyCost: 0.001, silverVolatility: 0.30,
    };
    const silverResult = evaluateSilverAdmission(silverInput);

    // φ_t (APPROVED Portfolio B — 15% physical + 5% tokenized PAXG + 0% silver)
    // Effective tokenized weight is 0.05 only if TGRS monitor says OK; else 0.
    const effectiveTokGold = antiDoubleCount?.effectiveTokenizedWeight ?? APPROVED_PORTFOLIO_B.tokenizedGold;
    const phiT = computePhiT(APPROVED_PORTFOLIO_B.physicalGold, effectiveTokGold, 0.0, 0.0);

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

      // §10-16 — Tokenized Allocated Gold (VALIDATED — PAXG admitted)
      tokenizedGold: {
        identity: "Gold_total = PhysicalAllocatedGold + TokenizedAllocatedGold (NO double-counting)",
        tgrs,
        eligibility: tgEligibilityResult,
        haircutFormula: "H_TG = max(5%, 5% + (10 - TGRS) × 0.5%) — static; §20 dynamic haircut computed separately",
        recommendedHaircut: tgrs.haircutRecommendation,
        dynamicRange: "Physical 10-20%, Tokenized 0-7%, Total bullion ≤25%",
        rejected: ["Unallocated claims", "Synthetic gold", "ETFs", "Derivatives", "Futures"],
        approvedTarget: "Physical 15% + Tokenized 5% (PAXG) = Gold_total 20% — APPROVED CANDIDATE",
        canonicalProduct: CANONICAL_TOKENIZED_GOLD,
        productRegistry: TOKENIZED_GOLD_REGISTRY,
        tgrsMonitor,
        antiDoubleCountGuard: antiDoubleCount,
        // §17 — TGLS (Tokenized Gold Liquidity Score)
        tgls: {
          score: tgls.score,
          classification: tgls.classification,
          recommendation: tgls.recommendation,
          factors: tgls.factors,
          note: "TGLS measures executable liquidity. TGRS measures reserve integrity. Separate scores — never combined.",
        },
        // §18 — TGBS (Tokenized Gold Basis Spread)
        tgbs: {
          spreadPct: tgbs.spreadPct,
          state: tgbs.state,
          reason: tgbs.reason,
          goldNavPrice: tgbs.goldNavPrice,
          paxgMarketPrice: tgbs.paxgMarketPrice,
          paxgAvailable: tgbs.paxgAvailable,
          formula: "TGBS = (P_PAXGMarket − P_GoldNAV) / P_GoldNAV",
          oracleArchitecture: "§21 separated: Oracle A (GoldNAV) for reserve accounting, Oracle B (PAXG market) for TGBS only",
        },
        // §19 — V_TG valuation
        vtg: {
          value: vtg.value,
          formula: vtg.formula,
          quantity: vtg.quantity,
          goldNavPrice: vtg.goldNavPrice,
          haircut: vtg.haircut,
          confidenceFactor: vtg.confidenceFactor,
          note: "Reserve uses GoldNAV (Oracle A), NOT PAXG market price. Prevents market dislocation from inflating reserve.",
        },
        // §20 — Dynamic haircut
        dynamicHaircut: {
          haircut: dynamicHaircut.haircut,
          formula: dynamicHaircut.formula,
          components: dynamicHaircut.components,
          h0: dynamicHaircut.h0,
          hMax: dynamicHaircut.hMax,
          note: "H_TG(t) = Clamp(H0 + α·Oracle + β·Custody + γ·Legal + δ·Redemption + ε·Liquidity + ζ·Issuer + η·Tech + θ·Basis, 0, H_max). All inputs normalized [0,1].",
        },
        // §22 — Attestation freshness
        attestationFreshness: {
          ageDays: attestationFreshness.ageDays,
          state: attestationFreshness.state,
          confidenceFactor: attestationFreshness.confidenceFactor,
          tgrsPenalty: attestationFreshness.tgrsPenalty,
          weightLimit: attestationFreshness.weightLimit,
          reason: attestationFreshness.reason,
          note: "TGRS declines as attestation becomes stale. SEVERELY_STALE → fail-closed (weight=0).",
        },
        // §23 — Tokenized gold stress suite
        stressSuite: {
          scenarios: tgStressResults.map(r => ({
            name: r.scenario.name,
            category: r.scenario.category,
            impairmentPct: r.scenario.impairmentPct,
            expectedAction: r.scenario.expectedAction,
            rrAfter: r.rrAfter,
            classification: r.classification,
            passed: r.passed,
            reason: r.reason,
            physicalGoldIntact: r.physicalGoldIntact,
            noDoubleCounting: r.noDoubleCounting,
          })),
          summary: {
            total: tgStressResults.length,
            pass: tgStressResults.filter(r => r.classification === "PASS").length,
            fail: tgStressResults.filter(r => r.classification === "FAIL").length,
            bdl: tgStressResults.filter(r => r.classification === "BDL").length,
          },
        },
        attestation: {
          issuer: "Paxos Trust Company",
          auditor: "Withum (monthly attestation)",
          regulatoryFramework: "PAXG eligibility evidence evaluated under MITHQAL's independent reserve eligibility framework. Paxos holds NYDFS trust charter #25379 and OCC federal trust charter — these are PAXG issuer credentials, NOT MITHQAL regulatory approvals.",
          formalVerification: "CertiK 98% (PAXG smart contract audit, independent of MITHQAL)",
          custody: "Brink's allocated LBMA vaults (PAXG issuer custody, NOT MITHQAL custody)",
          barSerials: "Published by Paxos (cross-verifiable against MITHQAL bar list for anti-double-counting)",
          disclaimer: "MITHQAL is NOT regulator-approved, NOT central-bank-approved, NOT risk-free. PAXG inclusion is based on MITHQAL's independent eligibility assessment and may be suspended if TGRS drops below threshold.",
        },
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

      // §53 — APPROVED Strategic Portfolio B (was PROVISIONAL, now APPROVED)
      approvedPortfolio: APPROVED_PORTFOLIO_B,

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

      // Status — §53/§59 governance wording (NOT "approved" / NOT "GO")
      status: "APPROVED CANDIDATE — PENDING INDEPENDENT PORTFOLIO VALIDATION",
      productionDecision: "IMPLEMENTED + PROVISIONALLY VALIDATED + PENDING INDEPENDENT INSTITUTIONAL VALIDATION",
      decisionReason: "v24.2.1 Portfolio B is the APPROVED CANDIDATE (COO+CTO+PM executive decision, 2026-08-13). 6-task validation complete: MC reproduced, A/B/C/D/E compared, PAXG TGRS=9.00 validated, silver=0% confirmed, 4/5 challengers confirm primary, anti-double-counting 32/32 PASS. GO/NO-GO is a deployment decision; economic optimality requires comparative validation. NOT production-certified, NOT regulator-approved, NOT central-bank-approved, NOT Sharia-certified, NOT risk-free, NOT guaranteed-solvency.",

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

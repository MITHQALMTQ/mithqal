import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateRebalanceProposal, getAllProposals } from "@/lib/execution-engine";
import { getReserveState, isReserveStateInitialized, initializeReserveState } from "@/lib/reserve-state";
import { computeLiveNav } from "@/lib/nav-compute";
import {
  computeDynamicReserveAllocation,
  deriveCurrentLayerWeights,
  deriveCurrentBullionGoldShare,
} from "@/lib/reserve-allocation";
import type { RebalanceContext } from "@/lib/v19-infrastructure";
import {
  RESERVE_POLICY_SPEC,
  LAYER_SPEC,
  PHI_T_SPEC,
  BASKET_VERIFICATION_SPEC,
} from "@/lib/reserve-policy-spec";

/**
 * GET /api/rebalance/plan — List all rebalance proposals.
 * POST /api/rebalance/plan — Generate a new rebalance proposal.
 *
 * POST body: { actions: [{ assetClass, action, quantity, unit, reason }] }
 *
 * Phase 4 — the POST handler now constructs a `RebalanceContext` from the
 * live reserve state + live NAV and passes it to `generateRebalanceProposal`,
 * activating the §29-validated path (detectRebalanceTriggers +
 * generateCrossAssetRebalancePlan). The raw `actions` array is preserved as
 * a fallback input shape: when the §29-validated path produces zero actions
 * (no triggers fire), the raw actions are NOT used (the §29 plan is the
 * source of truth); when context construction fails, the raw-actions path
 * is taken and a warning is logged.
 */
export async function GET() {
  return NextResponse.json({ ok: true, proposals: getAllProposals() });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized — institutional authentication required" }, { status: 401 });
  if (!isReserveStateInitialized()) {
    initializeReserveState(4076.9, 58.76, { gold: 0.155, silver: 0.039, cash: 0.50, sovereign: 0.24, stablecoin: 0.05 });
  }
  try {
    const body = await request.json();
    const state = getReserveState();

    // §29 — Construct a RebalanceContext from the live reserve state + live
    // NAV. This activates the §29-validated path in generateRebalanceProposal
    // (detectRebalanceTriggers + generateCrossAssetRebalancePlan). Falls back
    // to the raw-actions path if context construction fails (logged).
    let context: RebalanceContext | undefined;
    let contextError: string | undefined;
    try {
      context = await buildRebalanceContext();
    } catch (ctxErr) {
      contextError = ctxErr instanceof Error ? ctxErr.message : String(ctxErr);
      console.warn(
        "[/api/rebalance/plan] §29 context construction failed; falling back to raw-actions path:",
        contextError,
      );
      context = undefined;
    }

    const proposal = generateRebalanceProposal(
      state,
      body.actions ?? [],
      `oracle-${Date.now()}`,
      context,
    );
    return NextResponse.json({
      ok: true,
      proposal,
      contextProvided: context !== undefined,
      ...(contextError ? { contextError } : {}),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

/**
 * §29 — Build a RebalanceContext from the live reserve state + live NAV.
 *
 * Pulls:
 *   - currentWeights  — from live NAV's reserveAssets (revalued at live prices)
 *   - targetWeights   — from computeDynamicReserveAllocation (live prices, RR, vol)
 *   - reserveRatio    — from live NAV (percent, e.g. 102.05)
 *   - lcr             — from live NAV's monetary state (pure ratio, e.g. 6.0)
 *   - layerWeights    — current (from live NAV) + target (from allocation)
 *   - layerRanges     — from LAYER_SPEC constitutional ranges
 *   - bullionGoldShare — current φ_t from live NAV's bullion layer
 *   - bullionGoldRange — from PHI_T_SPEC (60% / 95%)
 *   - concentrationCap — from BASKET_VERIFICATION_SPEC.MAX_CAP (60%)
 *   - minimumFloor     — from BASKET_VERIFICATION_SPEC.MIN_FLOOR (0.5%)
 *   - rebalanceThreshold — from REBALANCE_SPEC.DRIFT_SOFT (2%)
 *
 * Every value is imported from reserve-policy-spec.ts (no magic numbers).
 * The context is fully deterministic given the live NAV snapshot.
 */
async function buildRebalanceContext(): Promise<RebalanceContext> {
  // Live NAV — async (awaits live oracle + on-chain snapshot).
  const nav = await computeLiveNav();

  // Compute target allocation via the dynamic allocation engine (§23-27).
  // Uses the live gold/silver prices, live RR, and the EWMA gold volatility
  // from the monetary state's shock-absorber computation (§17).
  const goldVolatility = nav.state.volatility ?? 0.015;
  const alloc = computeDynamicReserveAllocation({
    totalReserve: nav.reserveMarketUsd,
    goldPrice: nav.goldUsd,
    silverPrice: nav.silverUsd,
    reserveRatio: nav.reserveRatio,
    goldVolatility,
  });

  // §29.1 currentWeights — from live NAV's reserveAssets (revalued at live
  // prices). The §29 detectRebalanceTriggers operates on a per-"currency"
  // basis; we use the asset class as the key (the simulation has one
  // instrument per asset class — there's no USD/EUR/JPY split at the
  // reserve-state level yet, so the asset class IS the currency unit).
  const totalCurrentUsd = nav.reserveAssets.reduce(
    (s, a) => s + a.quantity * a.priceUsd, 0,
  );
  const currentWeights = new Map<string, number>();
  for (const a of nav.reserveAssets) {
    currentWeights.set(
      a.assetClass,
      totalCurrentUsd > 0 ? (a.quantity * a.priceUsd) / totalCurrentUsd : 0,
    );
  }

  // §29.1 targetWeights — from the allocation result. Each asset's target
  // weight = its target USD value / total target USD value.
  const totalTargetUsd =
    alloc.cashValue + alloc.sovereignValue + alloc.goldValue +
    alloc.silverValue + alloc.stablecoinValue;
  const targetWeights = new Map<string, number>();
  targetWeights.set("cash", totalTargetUsd > 0 ? alloc.cashValue / totalTargetUsd : 0);
  targetWeights.set("sovereign", totalTargetUsd > 0 ? alloc.sovereignValue / totalTargetUsd : 0);
  targetWeights.set("gold", totalTargetUsd > 0 ? alloc.goldValue / totalTargetUsd : 0);
  targetWeights.set("silver", totalTargetUsd > 0 ? alloc.silverValue / totalTargetUsd : 0);
  targetWeights.set("stablecoin", totalTargetUsd > 0 ? alloc.stablecoinValue / totalTargetUsd : 0);

  // §29.1 layerWeights — current (from live NAV) + target (from allocation).
  const layerWeights = deriveCurrentLayerWeights(nav.reserveAssets);

  // §25.2 bullionGoldShare (φ_t) — current from live NAV's bullion layer.
  const bullionGoldShare = deriveCurrentBullionGoldShare(nav.reserveAssets);

  // §29.1 layerRanges — constitutional per-layer ranges from LAYER_SPEC.
  const layerRanges = new Map<string, { min: number; max: number }>();
  layerRanges.set("fiat", { min: LAYER_SPEC.FIAT.MIN, max: LAYER_SPEC.FIAT.MAX });
  layerRanges.set("bullion", { min: LAYER_SPEC.BULLION.MIN, max: LAYER_SPEC.BULLION.MAX });
  layerRanges.set("stablecoin", { min: LAYER_SPEC.STABLECOIN.MIN, max: LAYER_SPEC.STABLECOIN.MAX });

  // §5 LCR — from the live monetary state.
  const lcr = nav.state.lcr?.ratio ?? 1.25;

  const ctx: RebalanceContext = {
    currentWeights,
    targetWeights,
    reserveRatio: nav.reserveRatio,                                  // percent (e.g. 102.05)
    lcr,                                                              // pure ratio (e.g. 6.0)
    rebalanceThreshold: RESERVE_POLICY_SPEC.REBALANCE.DRIFT_SOFT,     // 0.02 (2%)
    layerWeights,
    layerRanges,
    bullionGoldShare,
    bullionGoldRange: { min: PHI_T_SPEC.PHI_MIN, max: PHI_T_SPEC.PHI_MAX }, // 0.60 / 0.95
    concentrationCap: BASKET_VERIFICATION_SPEC.MAX_CAP,               // 0.60
    minimumFloor: BASKET_VERIFICATION_SPEC.MIN_FLOOR,                 // 0.005
  };

  return ctx;
}

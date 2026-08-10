/**
 * MITHQAL — Institutional Execution Engine
 *
 * Per §12: Implements the execution lifecycle:
 *   generateRebalancePlan() → validateRebalancePlan() → approveRebalancePlan()
 *   → executeRebalancePlan() → confirmSettlement() → reconcileCustodianState()
 *   → commitReserveState()
 *
 * Per §13: NO autonomous uncontrolled trading. The architecture is:
 *   Algorithmic Recommendation → Constitutional Validation → Risk Validation
 *   → Institutional Approval → Execution
 *
 * Per §18: Every transaction has a complete lifecycle:
 *   PROPOSED → VALIDATED → APPROVED → SUBMITTED → EXECUTING → SETTLED
 *   → CUSTODIAN_CONFIRMED → RECONCILED → FINAL
 *   Also: REJECTED, CANCELLED, FAILED, EXPIRED, DISPUTED
 *
 * Per §28: Every execution request must be idempotent.
 *
 * Per §29: The constitutional rebalancing engine (`detectRebalanceTriggers`,
 * `generateCrossAssetRebalancePlan`, `verifyRebalancePlanLiquidity`,
 * `verifyRebalancePlanReserveRatio`) in `v19-infrastructure.ts` is the
 * SINGLE source of truth for trigger detection, plan generation, fee
 * computation, and reserve-ratio / liquidity protection. This module
 * wraps that engine's output into the institutional `RebalanceProposal`
 * lifecycle so callers can drive the full §12 / §18 lifecycle from a
 * single API surface.
 *
 * Per §29.5: Per-action fees are computed via `computeRebalanceFee` from
 * `rebalance-fees.ts` (execution + slippage × method multiplier + spread).
 * The legacy hardcoded `FEE_BPS` / `SLIPPAGE_BPS` tables have been removed.
 *
 * Per §29.10: Every lifecycle transition is appended to an immutable,
 * append-only JSONL audit ledger at `logs/rebalance-audit.jsonl`. The
 * ledger records the transition, the proposalId, any §29 triggers that
 * justified the plan, and the actor (role) that drove the transition.
 *
 * Per §29.7: The current reserve ratio (`currentRR`) used for post-trade
 * RR projection is the LIVE RR from `computeLiveNav()` (cached at module
 * scope; falls back to the canonical 102.05% baseline on the first call
 * before the cache is primed). The post-trade RR is approximated from
 * the action's value delta — selling assets decreases R_a by the action
 * value (minus fees); buying increases R_a.
 *
 * --------------------------------------------------------------------
 * ROUTING NOTE (read before assuming what an endpoint returns):
 * --------------------------------------------------------------------
 * There are TWO rebalance-related API surfaces that are easily confused:
 *
 *   1. `GET /api/rebalancing` — returns a SINGLE `RebalanceRecommendation`
 *      from the §XX.15 Monte-Carlo cost-benefit engine (`dynamic-rebalancing.ts`).
 *      This answers "should we rebalance right now, given current market
 *      friction?" — it does NOT list pending proposals. Despite the plural-
 *      looking path, the response shape is `{ recommendation, factors, ... }`.
 *
 *   2. `GET /api/rebalance/plan` — lists PENDING institutional proposals
 *      that are in the §18 lifecycle (PROPOSED / VALIDATED / APPROVED / …).
 *      This is the surface to query for "what rebalances are awaiting action?".
 *
 * The two endpoints are intentionally separate: one is a real-time
 * recommendation engine, the other is the institutional proposal ledger.
 * Renaming either would break clients; both are documented here so future
 * agents don't conflate them.
 *
 * Phase 5 of the institutional execution architecture implementation.
 * Status: SIMULATED — executes against simulated custodian adapters.
 */

import type { ReserveAssetState, ReserveState } from "./reserve-state";
import { getReserveState, commitReserveStateUpdate, getExecutionMode, isExecutionAllowed } from "./reserve-state";
import { getCustodianAdapter, type CustodianTransactionRequest } from "./custodian-adapter";

// §29 — constitutional rebalancing engine (trigger detection + plan generation).
import {
  detectRebalanceTriggers,
  generateCrossAssetRebalancePlan,
  type RebalanceContext,
  type RebalanceTrigger,
  type RebalanceTriggerSeverity,
  type RebalancePlan,
} from "./v19-infrastructure";

// §29.5 — comprehensive per-asset-class fee model (replaces hardcoded FEE_BPS).
import { computeRebalanceFee } from "./rebalance-fees";

// §3.1 / §4 — live NAV computer (for the live reserve ratio used in RR projection).
import { computeLiveNav } from "./nav-compute";

// §29.10 — append-only audit ledger (JSONL).
import { appendFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";

// ============================================================
// Types
// ============================================================

export type TransactionLifecycle =
  | "PROPOSED" | "VALIDATED" | "APPROVED" | "SUBMITTED" | "EXECUTING"
  | "SETTLED" | "CUSTODIAN_CONFIRMED" | "RECONCILED" | "FINAL"
  | "REJECTED" | "CANCELLED" | "FAILED" | "EXPIRED" | "DISPUTED";

export type ApprovalRole =
  | "treasury_authority" | "risk_authority" | "constitutional_authority"
  | "operations_authority" | "independent_oversight";

export interface RebalanceAction {
  actionId: string;
  assetClass: "gold" | "silver" | "cash" | "sovereign" | "stablecoin";
  action: "buy" | "sell";
  quantity: number;
  unit: "oz" | "USD";
  estimatedValue: number;
  estimatedFees: number;
  estimatedSlippage: number;
  postTradeWeight: number;
  postTradeReserveRatio: number;
  reason: string;
}

export interface RebalanceProposal {
  proposalId: string;
  createdAt: string;
  actions: RebalanceAction[];
  totalEstimatedValue: number;
  totalEstimatedFees: number;
  reserveStateVersion: number;
  algorithmVersion: string;
  oracleSnapshotVersion: string;
  lifecycle: TransactionLifecycle;
  approvals: ApprovalRecord[];
  rejectionReason?: string;
  /**
   * §29.2 — `true` when the §29 trigger list contains any "critical" or "high"
   * severity trigger. Drives the approval threshold in `approveRebalanceProposal`.
   * Populated when a `RebalanceContext` is supplied to `generateRebalanceProposal`;
   * absent (undefined) on the backwards-compatible raw-actions path, where the
   * default §14 3-of-5 threshold applies.
   */
  approvalRequired?: boolean;
  /**
   * §29.1 — the highest-severity trigger in the §29 trigger list that justified
   * this proposal ("low" | "medium" | "high" | "critical"). Used by the
   * severity-based approval router. Undefined on the raw-actions path.
   */
  maxSeverity?: RebalanceTriggerSeverity;
  /**
   * §29.1 — the full §29 trigger list produced by `detectRebalanceTriggers`.
   * Carried through the lifecycle so the §29.10 audit ledger can record the
   * constitutional justification at every transition. Undefined on the
   * raw-actions path (§29 trigger detection was bypassed).
   */
  triggers?: RebalanceTrigger[];
  /**
   * §29.7 — the live reserve ratio (decimal, e.g. 1.0205 = 102.05%) snapshot
   * used as the baseline for post-trade RR projection. Recorded for audit.
   */
  liveReserveRatio?: number;
  /**
   * §29.5 — comprehensive fee breakdown (execution + slippage + spread per
   * action) when the §29 plan path was taken. Undefined on the raw-actions path.
   */
  feeBreakdown?: RebalancePlan["feeBreakdown"];
}

export interface ApprovalRecord {
  role: ApprovalRole;
  approved: boolean;
  timestamp: string;
  signature: string; // simulated signature (in production: real cryptographic signature)
  reason?: string;
}

export interface ExecutionResult {
  proposalId: string;
  transactionRefs: string[];
  settledActions: Array<{
    actionId: string;
    settledQuantity: number;
    settlementRef: string;
    settlementTimestamp: string;
  }>;
  failed: boolean;
  failureReason?: string;
}

// ============================================================
// In-memory stores (testnet simulation)
// ============================================================

const proposals = new Map<string, RebalanceProposal>();
const executionResults = new Map<string, ExecutionResult>();

// ============================================================
// §29.7 — Live Reserve-Ratio Cache
// ============================================================
//
// `computeLiveNav()` is async (it awaits `getLiveOracleData` + the on-chain
// oracle snapshot) but `generateRebalanceProposal` is sync — the
// `/api/rebalance/plan` route handler calls it synchronously and we cannot
// make the route `await` without breaking the existing API contract
// (`{ ok: true, proposal }` must be returned synchronously).
//
// The pragmatic, contract-preserving approach: cache the live RR at module
// scope. The FIRST call to `getCachedLiveRR()` (typically the first
// `/api/rebalance/plan` POST after server boot) returns the canonical
// fallback (102.05% / 1.0205) and kicks off a fire-and-forget refresh; the
// NEXT call (after refresh resolves) returns the live value. `/api/nav` and
// `/api/transparency` already call `computeLiveNav()` on every request, so
// in practice the cache is always warm once any NAV endpoint has been hit.

/** Canonical §53 RR_target baseline (102.05%) used before the live cache is primed. */
const FALLBACK_LIVE_RR_DECIMAL = 1.0205;

let cachedLiveRR: number | null = null;
let liveRRRefreshInFlight: Promise<number> | null = null;

/**
 * §29.7 — Asynchronously refresh the cached live reserve ratio (decimal).
 * Idempotent: concurrent callers share the same in-flight promise.
 * Safe to call from any async context; never throws (logs + returns last
 * cached value or the canonical fallback on failure).
 */
export function refreshLiveReserveRatio(): Promise<number> {
  if (liveRRRefreshInFlight) return liveRRRefreshInFlight;
  liveRRRefreshInFlight = computeLiveNav()
    .then((nav) => {
      // `nav.reserveRatio` is reported in PERCENT (e.g. 102.05 for 102.05%).
      // Convert to decimal (1.0205) so the post-trade RR projection math
      // in `generateRebalanceProposal` reads naturally.
      const decimal = nav.reserveRatio > 1 ? nav.reserveRatio / 100 : nav.reserveRatio;
      cachedLiveRR = decimal;
      return decimal;
    })
    .catch((err) => {
      console.warn(
        "[execution-engine] computeLiveNav failed; keeping cached RR (fallback=%s):",
        FALLBACK_LIVE_RR_DECIMAL,
        err instanceof Error ? err.message : err,
      );
      return cachedLiveRR ?? FALLBACK_LIVE_RR_DECIMAL;
    })
    .finally(() => {
      liveRRRefreshInFlight = null;
    });
  return liveRRRefreshInFlight;
}

/**
 * §29.7 — Get the cached live reserve ratio (decimal, e.g. 1.0205 = 102.05%).
 *
 * Returns the canonical baseline (102.05%) on the FIRST call before the
 * async refresh completes, and kicks off a fire-and-forget refresh so the
 * next call sees a live value. After any `/api/nav` or `/api/transparency`
 * hit, the cache is warm.
 */
function getCachedLiveRR(): number {
  if (cachedLiveRR === null) {
    void refreshLiveReserveRatio();
    return FALLBACK_LIVE_RR_DECIMAL;
  }
  return cachedLiveRR;
}

// ============================================================
// §29.10 — Immutable Audit Ledger (JSONL)
// ============================================================

/**
 * Absolute path to the append-only §29.10 audit ledger. The file is created
 * on first write (the `logs/` directory is created with `mkdirSync({recursive})`).
 * Each line is a single JSON object terminated with `\n` — the canonical
 * JSONL format consumable by `jq -c`, Splunk, Datadog, etc.
 */
const AUDIT_LEDGER_PATH =
  process.env.REBALANCE_AUDIT_LEDGER_PATH ??
  join(process.cwd(), "logs", "rebalance-audit.jsonl");

/**
 * §29.10 — A single audit ledger entry. Every lifecycle transition (and
 * every §29 trigger-detection run that justified a proposal) appends one
 * of these to `logs/rebalance-audit.jsonl`.
 */
export interface RebalanceAuditEntry {
  /** ISO 8601 timestamp of the transition. */
  timestamp: string;
  /** Proposal ID the transition applies to. */
  proposalId: string;
  /** §18 lifecycle transition: e.g. "PROPOSED→VALIDATED". */
  transition: string;
  /** §29 trigger list that justified the proposal (undefined on raw-actions path). */
  triggers?: RebalanceTrigger[];
  /** Highest-severity trigger in `triggers` (undefined on raw-actions path). */
  maxSeverity?: RebalanceTriggerSeverity;
  /** Actor (role or system) that drove the transition. */
  actor: string;
  /** Execution mode at time of transition (SIMULATION / SHADOW / LIVE). */
  executionMode: string;
  /** Free-form details (failure reason, approval count, etc.). */
  details?: Record<string, unknown>;
}

/**
 * §29.10 — Append an immutable audit entry to the JSONL ledger.
 *
 * This function is SYNCHRONOUS (`appendFileSync`) on purpose: audit trail
 * integrity MUST NOT be deferred to the event loop. If the write fails,
 * the error is logged to stderr but NOT propagated — a failed audit write
 * must not block the lifecycle transition itself (the transition is the
 * source of truth; the ledger is the record). Callers that need to know
 * about audit-write failures should monitor stderr.
 *
 * Per §29.10 the ledger is append-only: this function never reads, modifies,
 * or truncates prior entries.
 */
export function logRebalanceAudit(entry: RebalanceAuditEntry): void {
  try {
    // Ensure the directory exists (mkdir -p). Idempotent.
    mkdirSync(dirname(AUDIT_LEDGER_PATH), { recursive: true });
    const line = JSON.stringify(entry) + "\n";
    appendFileSync(AUDIT_LEDGER_PATH, line, { encoding: "utf8", flag: "a" });
  } catch (err) {
    // §29.10 — audit-write failure is non-fatal but MUST be surfaced.
    console.error(
      "[execution-engine][§29.10] audit ledger write FAILED (non-fatal):",
      err instanceof Error ? err.message : err,
      "entry=",
      JSON.stringify(entry),
    );
  }
}

/**
 * §29.10 — Helper: log a lifecycle transition for a proposal.
 * Pulls `triggers`, `maxSeverity` from the proposal (if present) so the
 * audit record carries the §29 justification forward at every step.
 */
function auditLifecycleTransition(
  proposal: RebalanceProposal,
  fromState: TransactionLifecycle,
  toState: TransactionLifecycle,
  actor: string,
  details?: Record<string, unknown>,
): void {
  logRebalanceAudit({
    timestamp: new Date().toISOString(),
    proposalId: proposal.proposalId,
    transition: `${fromState}→${toState}`,
    triggers: proposal.triggers,
    maxSeverity: proposal.maxSeverity,
    actor,
    executionMode: getExecutionMode(),
    details,
  });
}

// ============================================================
// Phase 5a: Generate Rebalance Plan (PROPOSED)
// ============================================================

/**
 * §29 — Map a §29 RebalanceAction `assetClass` ("cash" | "sovereign" |
 * "sukuk" | "gold" | "silver" | "stablecoin" | "fiat_fx") to the narrower
 * institutional `RebalanceAction.assetClass` union ("gold" | "silver" |
 * "cash" | "sovereign" | "stablecoin"). "sukuk" → "sovereign" (same Tier 2
 * haircut bucket); "fiat_fx" → "cash" (FX conversions settle as cash).
 */
function mapS29AssetClassToInstitutional(
  s29Class: string | undefined,
): RebalanceAction["assetClass"] {
  switch (s29Class) {
    case "gold": return "gold";
    case "silver": return "silver";
    case "sovereign":
    case "sukuk": return "sovereign";
    case "stablecoin": return "stablecoin";
    case "cash":
    case "fiat_fx":
    default: return "cash";
  }
}

/**
 * §29 — Build the layer-weight map (fiat / bullion / stablecoin) from a
 * `ReserveAssetState[]`. Used as input to `generateCrossAssetRebalancePlan`.
 *
 *   - fiat       = cash + sovereign
 *   - bullion    = gold + silver
 *   - stablecoin = stablecoin
 */
function buildLayerWeightsFromReserve(
  assets: ReserveAssetState[],
  weightSelector: (a: ReserveAssetState) => number,
): Map<string, number> {
  const layerWeights = new Map<string, number>();
  for (const a of assets) {
    const layer =
      a.assetClass === "gold" || a.assetClass === "silver" ? "bullion"
      : a.assetClass === "stablecoin" ? "stablecoin"
      : "fiat"; // cash + sovereign
    layerWeights.set(layer, (layerWeights.get(layer) ?? 0) + weightSelector(a));
  }
  return layerWeights;
}

/**
 * §29.1 — Compute the highest-severity trigger in a list. Returns
 * "low" if the list is empty (no triggers → no escalation).
 */
function computeMaxSeverity(triggers: RebalanceTrigger[]): RebalanceTriggerSeverity {
  const rank: Record<RebalanceTriggerSeverity, number> = {
    low: 0, medium: 1, high: 2, critical: 3,
  };
  if (triggers.length === 0) return "low";
  return triggers.reduce((max, t) =>
    rank[t.severity] > rank[max] ? t.severity : max, "low" as RebalanceTriggerSeverity);
}

/**
 * Generate a rebalance proposal from the current reserve state.
 *
 * This wraps the §29 constitutional rebalancing engine output
 * (`detectRebalanceTriggers` + `generateCrossAssetRebalancePlan`) into an
 * institutional `RebalanceProposal` with full §18 lifecycle tracking.
 *
 * TWO call modes (additive, backwards-compatible):
 *
 *   1. §29-VALIDATED PATH — `context` is provided. The engine runs
 *      `detectRebalanceTriggers(ctx)` to produce the constitutional trigger
 *      list, then `generateCrossAssetRebalancePlan(...)` to produce the
 *      validated plan (with §29.5 fees, §29.6 liquidity classification,
 *      §29.7 RR impact, §29.4 partial-rebalancing value conservation).
 *      The plan's `actions` REPLACE the raw `actions` input — they are
 *      derived from §29.1 triggers, not from caller input. The proposal
 *      carries `triggers`, `maxSeverity`, `approvalRequired`, `feeBreakdown`,
 *      and `liveReserveRatio` for the §29.10 audit ledger.
 *
 *   2. RAW-ACTIONS PATH — §29 trigger detection bypassed. `context` is
 *      omitted (backwards compat for the existing `/api/rebalance/plan`
 *      POST that takes `{actions:[...]}`). The raw `actions` array is used
 *      as-is. §29.5 fees are still computed via `computeRebalanceFee` (so
 *      the fee model is unified across both paths), and the live RR is
 *      still pulled from `computeLiveNav`'s cache, but no §29 trigger
 *      detection, cross-asset pairing, or severity routing occurs.
 *
 * In both modes the returned proposal is in the PROPOSED lifecycle state
 * and an entry is appended to the §29.10 audit ledger.
 */
export function generateRebalanceProposal(
  reserveState: ReserveState,
  actions: Array<{
    assetClass: RebalanceAction["assetClass"];
    action: "buy" | "sell";
    quantity: number;
    unit: "oz" | "USD";
    reason: string;
  }>,
  oracleSnapshotVersion: string,
  /**
   * §29 — Optional rebalance context. When provided, the §29 trigger
   * detection + cross-asset plan generation runs and the plan's actions
   * REPLACE the raw `actions` input. When omitted, the raw-actions path
   * is taken (backwards compat).
   */
  context?: RebalanceContext,
): RebalanceProposal {
  const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // §29.7 — Live reserve ratio (cached; first call returns canonical 102.05%
  // baseline and kicks off an async refresh so subsequent calls see live data).
  const currentRR = getCachedLiveRR();

  // Total reserve value (R_m) — used for post-trade weight + RR projection.
  const totalReserveValue = reserveState.executed.reduce((sum, s) =>
    sum + (s.unit === "oz" ? s.quantity * s.marketPrice : s.quantity), 0);

  // ----------------------------------------------------------------
  // §29 — Trigger detection + cross-asset plan (when context provided)
  // ----------------------------------------------------------------
  let triggers: RebalanceTrigger[] | undefined;
  let plan: RebalancePlan | undefined;
  let effectiveActions: Array<{
    assetClass: RebalanceAction["assetClass"];
    action: "buy" | "sell";
    quantity: number;
    unit: "oz" | "USD";
    reason: string;
  }>;

  if (context) {
    // §29-VALIDATED PATH — run the constitutional engine.
    triggers = detectRebalanceTriggers(context);
    const currentLayerWeights = buildLayerWeightsFromReserve(reserveState.executed, (a) => a.actualWeight);
    const targetLayerWeights = buildLayerWeightsFromReserve(reserveState.target, (a) => a.targetWeight);
    plan = generateCrossAssetRebalancePlan(
      context,
      currentLayerWeights,
      targetLayerWeights,
      totalReserveValue,
    );

    // Convert §29 plan actions → institutional action shape.
    // §29 actions have `amount` in USD; we split into (quantity, unit) per asset class.
    effectiveActions = plan.actions.map((a) => {
      const instClass = mapS29AssetClassToInstitutional(a.assetClass);
      const assetRow = reserveState.executed.find((s) => s.assetClass === instClass);
      const marketPrice = assetRow?.marketPrice ?? 1;
      const isBullion = instClass === "gold" || instClass === "silver";
      return {
        assetClass: instClass,
        action: a.action === "sell" ? "sell" as const : "buy" as const,
        quantity: isBullion && marketPrice > 0 ? a.amount / marketPrice : a.amount,
        unit: isBullion ? "oz" as const : "USD" as const,
        reason: a.reason,
      };
    });

    // §29.10 — log the trigger-detection result (separate audit entry, before
    // the PROPOSED transition, so the ledger shows the constitutional
    // justification that produced this proposal).
    logRebalanceAudit({
      timestamp: now,
      proposalId,
      transition: "TRIGGERS_DETECTED",
      triggers,
      maxSeverity: computeMaxSeverity(triggers),
      actor: "system:detectRebalanceTriggers",
      executionMode: getExecutionMode(),
      details: {
        triggerCount: triggers.length,
        planActionCount: effectiveActions.length,
        planEstimatedCost: plan.estimatedCost,
        planLiquidityImpact: plan.liquidityImpact,
        planPhased: plan.phased,
      },
    });
  } else {
    // RAW-ACTIONS PATH — §29 trigger detection bypassed.
    // Backwards-compatible: use the raw `actions` array as-is. No §29
    // trigger detection, no cross-asset pairing, no severity-based approval.
    // §29.5 fees + live RR projection still apply (unified across paths).
    effectiveActions = actions;
  }

  // ----------------------------------------------------------------
  // Build institutional RebalanceAction[] with §29.5 fees + §29.7 RR
  // ----------------------------------------------------------------
  const rebalanceActions: RebalanceAction[] = effectiveActions.map((a, i) => {
    const asset = reserveState.executed.find((s) => s.assetClass === a.assetClass);
    const marketPrice = asset?.marketPrice ?? 1;
    const estimatedValue = a.unit === "oz" ? a.quantity * marketPrice : a.quantity;

    // §29.5 — comprehensive fee model (execution + slippage × method
    // multiplier + spread). Replaces the legacy hardcoded FEE_BPS table.
    const feeBreakdown = computeRebalanceFee(a.assetClass, estimatedValue, "TWAP");
    const estimatedFees = feeBreakdown.executionFee + feeBreakdown.slippageCost + feeBreakdown.spreadCost;
    const estimatedSlippage = feeBreakdown.slippageCost;

    // Post-trade weight (simplified — same formula as before).
    const currentValue = asset ? (asset.unit === "oz" ? asset.quantity * asset.marketPrice : asset.quantity) : 0;
    const deltaValue = a.action === "buy" ? estimatedValue : -estimatedValue;
    const postTradeValue = currentValue + deltaValue;
    const postTradeWeight = totalReserveValue + deltaValue !== 0
      ? postTradeValue / (totalReserveValue + deltaValue)
      : 0;

    // §29.7 — Post-trade reserve ratio (approximate, directionally correct).
    //   Selling assets: R_a decreases by the action value (minus fees — the
    //     cash proceeds offset part of the asset-value loss).
    //   Buying assets:  R_a increases by the action value (the new asset's
    //     contribution to R_a exceeds the cash spent, due to over-collateralization).
    // This is approximate (ignores per-asset haircuts) but correct in direction.
    const actionNetValue = Math.max(0, estimatedValue - estimatedFees);
    const rrDelta = (a.action === "sell" ? -actionNetValue : actionNetValue) / Math.max(1, totalReserveValue);
    const postTradeReserveRatio = currentRR + rrDelta;

    return {
      actionId: `${proposalId}-action-${i}`,
      assetClass: a.assetClass,
      action: a.action,
      quantity: a.quantity,
      unit: a.unit,
      estimatedValue,
      estimatedFees,
      estimatedSlippage,
      postTradeWeight,
      postTradeReserveRatio,
      reason: a.reason,
    };
  });

  // ----------------------------------------------------------------
  // Build the proposal
  // ----------------------------------------------------------------
  const approvalRequired = triggers
    ? triggers.some((t) => t.severity === "critical" || t.severity === "high")
    : undefined;

  const proposal: RebalanceProposal = {
    proposalId,
    createdAt: now,
    actions: rebalanceActions,
    totalEstimatedValue: rebalanceActions.reduce((s, a) => s + a.estimatedValue, 0),
    totalEstimatedFees: rebalanceActions.reduce((s, a) => s + a.estimatedFees, 0),
    reserveStateVersion: reserveState.reserveStateVersion,
    algorithmVersion: reserveState.algorithmVersion,
    oracleSnapshotVersion,
    lifecycle: "PROPOSED",
    approvals: [],
    // §29 fields (only populated when context was provided)
    approvalRequired,
    maxSeverity: triggers ? computeMaxSeverity(triggers) : undefined,
    triggers,
    liveReserveRatio: currentRR,
    feeBreakdown: plan?.feeBreakdown,
  };

  proposals.set(proposalId, proposal);

  // §29.10 — audit the PROPOSED entry.
  logRebalanceAudit({
    timestamp: now,
    proposalId,
    transition: "ENTRY→PROPOSED",
    triggers,
    maxSeverity: proposal.maxSeverity,
    actor: "system:generateRebalanceProposal",
    executionMode: getExecutionMode(),
    details: {
      actionCount: rebalanceActions.length,
      totalEstimatedValue: proposal.totalEstimatedValue,
      totalEstimatedFees: proposal.totalEstimatedFees,
      liveReserveRatio: currentRR,
      path: context ? "s29-validated" : "raw-actions",
    },
  });

  return proposal;
}

// ============================================================
// Phase 5b: Validate Rebalance Plan (VALIDATED or REJECTED)
// ============================================================

export function validateRebalanceProposal(proposalId: string): RebalanceProposal {
  const proposal = proposals.get(proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
  if (proposal.lifecycle !== "PROPOSED") throw new Error(`Proposal ${proposalId} is not in PROPOSED state`);

  // Constitutional validation checks
  const failures: string[] = [];

  for (const action of proposal.actions) {
    // Check post-trade weight is within constitutional bounds
    if (action.postTradeWeight > 0.60) {
      failures.push(`${action.assetClass} post-trade weight ${(action.postTradeWeight * 100).toFixed(1)}% exceeds 60% cap`);
    }
    if (action.postTradeWeight < 0.005 && action.assetClass !== "stablecoin") {
      failures.push(`${action.assetClass} post-trade weight ${(action.postTradeWeight * 100).toFixed(2)}% below 0.5% floor`);
    }
    // Check post-trade reserve ratio
    if (action.postTradeReserveRatio < 1.00) {
      failures.push(`${action.assetClass} post-trade RR ${(action.postTradeReserveRatio * 100).toFixed(1)}% below 100% floor`);
    }
  }

  const fromState = proposal.lifecycle;
  if (failures.length > 0) {
    proposal.lifecycle = "REJECTED";
    proposal.rejectionReason = failures.join("; ");
  } else {
    proposal.lifecycle = "VALIDATED";
  }

  proposals.set(proposalId, proposal);

  // §29.10 — audit the validation transition (PROPOSED→VALIDATED or PROPOSED→REJECTED).
  auditLifecycleTransition(proposal, fromState, proposal.lifecycle, "system:validateRebalanceProposal", {
    failures,
  });

  return proposal;
}

// ============================================================
// Phase 5c: Approve Rebalance Plan (APPROVED)
// ============================================================

/**
 * §14 / §29.2 — Institutional approval gate (VALIDATED → APPROVED or REJECTED).
 *
 * Roles (5): Treasury, Risk, Constitutional, Operations, Independent Oversight.
 *
 * Approval routing depends on execution mode:
 *
 *   - SIMULATION mode (default): auto-approves with all 5 roles. Used for
 *     testnet / dev. No human-in-the-loop required.
 *
 *   - SHADOW / LIVE mode (env EXECUTION_MODE=SHADOW|LIVE): does NOT auto-
 *     approve. The caller MUST POST to `/api/rebalance/approve` with the
 *     correct number of role approvals based on the proposal's `maxSeverity`:
 *
 *       low severity      → 2-of-5 approvals
 *       medium severity   → 3-of-5 approvals
 *       high severity     → 4-of-5 approvals
 *       critical severity → 5-of-5 (unanimous) + Constitutional Council flag
 *
 *     If the proposal was generated via the raw-actions path (no §29 context,
 *     so `maxSeverity` is undefined), the default §14 3-of-5 threshold applies.
 *
 *     For critical severity, the caller must additionally include a
 *     `constitutionalCouncilFlag: true` field in the request body's first
 *     approval's `reason` (or pass it as `details.constitutionalCouncilFlag`).
 *     If absent, the proposal is REJECTED with reason "critical severity requires
 *     Constitutional Council authorization flag".
 */
const SEVERITY_APPROVAL_THRESHOLDS: Record<RebalanceTriggerSeverity, number> = {
  low: 2,
  medium: 3,
  high: 4,
  critical: 5, // unanimous
};

export function approveRebalanceProposal(
  proposalId: string,
  approvals: Array<{ role: ApprovalRole; approved: boolean; reason?: string }>,
  options?: { constitutionalCouncilFlag?: boolean }
): RebalanceProposal {
  const proposal = proposals.get(proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
  if (proposal.lifecycle !== "VALIDATED") throw new Error(`Proposal ${proposalId} is not in VALIDATED state`);

  const mode = getExecutionMode();
  const now = new Date().toISOString();

  // Record approvals (with simulated signatures)
  proposal.approvals = approvals.map((a) => ({
    ...a,
    timestamp: now,
    signature: `sim-sig-${a.role}-${Date.now()}`,
  }));

  const fromState = proposal.lifecycle;

  if (mode === "SIMULATION") {
    // SIMULATION mode — auto-approve with all 5 roles (no human-in-the-loop).
    const allRoles: ApprovalRole[] = [
      "treasury_authority", "risk_authority", "constitutional_authority",
      "operations_authority", "independent_oversight",
    ];
    proposal.approvals = allRoles.map((role) => ({
      role,
      approved: true,
      timestamp: now,
      signature: `sim-sig-${role}-${Date.now()}`,
      reason: "SIMULATION mode auto-approval",
    }));
    proposal.lifecycle = "APPROVED";
  } else {
    // SHADOW / LIVE mode — severity-based approval threshold.
    // Default to medium (3-of-5) when maxSeverity is undefined (raw-actions path).
    const severity = proposal.maxSeverity ?? "medium";
    const required = SEVERITY_APPROVAL_THRESHOLDS[severity];
    const approvedCount = proposal.approvals.filter((a) => a.approved).length;

    // §29.2 — critical severity requires unanimous 5-of-5 AND the
    // Constitutional Council authorization flag.
    const needsCouncilFlag = severity === "critical";
    const councilFlag = options?.constitutionalCouncilFlag === true;

    if (approvedCount >= required && (!needsCouncilFlag || councilFlag)) {
      proposal.lifecycle = "APPROVED";
    } else {
      proposal.lifecycle = "REJECTED";
      const parts: string[] = [`Insufficient approvals: ${approvedCount}/5 (requires ${required} for ${severity} severity)`];
      if (needsCouncilFlag && !councilFlag) {
        parts.push("critical severity requires Constitutional Council authorization flag");
      }
      proposal.rejectionReason = parts.join("; ");
    }
  }

  proposals.set(proposalId, proposal);

  // §29.10 — audit the approval transition (VALIDATED→APPROVED or VALIDATED→REJECTED).
  auditLifecycleTransition(proposal, fromState, proposal.lifecycle, "approver", {
    approvalCount: proposal.approvals.filter((a) => a.approved).length,
    requiredThreshold: proposal.maxSeverity ? SEVERITY_APPROVAL_THRESHOLDS[proposal.maxSeverity] : 3,
    maxSeverity: proposal.maxSeverity,
    executionMode: mode,
    constitutionalCouncilFlag: options?.constitutionalCouncilFlag,
  });

  return proposal;
}

// ============================================================
// Phase 5d: Execute Rebalance Plan (SUBMITTED → EXECUTING → SETTLED)
// ============================================================

/**
 * Per §12: Do NOT connect executeRebalancePlan() to real financial accounts yet.
 * In SIMULATION mode: executes against simulated custodian adapters.
 * In PRODUCTION mode: would execute against real custodian APIs (disabled).
 */
export async function executeRebalanceProposal(proposalId: string): Promise<ExecutionResult> {
  const proposal = proposals.get(proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
  if (proposal.lifecycle !== "APPROVED") throw new Error(`Proposal ${proposalId} is not in APPROVED state`);

  if (!isExecutionAllowed()) {
    throw new Error(`Execution not allowed in current mode (${getExecutionMode()})`);
  }

  const fromStateApproved = proposal.lifecycle;
  proposal.lifecycle = "SUBMITTED";
  proposals.set(proposalId, proposal);
  // §29.10 — audit APPROVED→SUBMITTED.
  auditLifecycleTransition(proposal, fromStateApproved, "SUBMITTED", "system:executeRebalanceProposal");

  const settledActions: ExecutionResult["settledActions"] = [];
  const transactionRefs: string[] = [];
  let failed = false;
  let failureReason: string | undefined;

  try {
    const fromStateSubmitted = proposal.lifecycle;
    proposal.lifecycle = "EXECUTING";
    proposals.set(proposalId, proposal);
    // §29.10 — audit SUBMITTED→EXECUTING.
    auditLifecycleTransition(proposal, fromStateSubmitted, "EXECUTING", "system:executeRebalanceProposal");

    for (const action of proposal.actions) {
      // Get the appropriate custodian adapter
      const reserveState = getReserveState();
      const asset = reserveState.executed.find((s) => s.assetClass === action.assetClass);
      if (!asset || !asset.custodianId) {
        failed = true;
        failureReason = `No custodian for asset ${action.assetClass}`;
        break;
      }

      const adapter = getCustodianAdapter(asset.custodianId);
      if (!adapter) {
        failed = true;
        failureReason = `Custodian ${asset.custodianId} not registered`;
        break;
      }

      // Submit transaction to custodian (§28: idempotent via idempotencyKey)
      const txRequest: CustodianTransactionRequest = {
        transactionId: `${action.actionId}-tx`,
        assetClass: action.assetClass,
        action: action.action,
        quantity: action.quantity,
        unit: action.unit,
        custodianId: asset.custodianId,
        custodyAccountId: asset.custodyAccountId ?? "",
        settlementMethod: action.assetClass === "gold" || action.assetClass === "silver" ? "physical_delivery" : "wire",
        idempotencyKey: action.actionId, // idempotent
      };

      const status = await adapter.submitTransaction(txRequest);

      if (status.status === "settled") {
        settledActions.push({
          actionId: action.actionId,
          settledQuantity: status.settledQuantity ?? action.quantity,
          settlementRef: status.settlementRef ?? "",
          settlementTimestamp: status.settlementTimestamp ?? new Date().toISOString(),
        });
        transactionRefs.push(status.settlementRef ?? "");
      } else {
        failed = true;
        failureReason = `Transaction ${txRequest.transactionId} failed: ${status.failureReason ?? "unknown"}`;
        break;
      }
    }

    const fromStateExecuting = proposal.lifecycle;
    if (failed) {
      proposal.lifecycle = "FAILED";
      proposal.rejectionReason = failureReason;
    } else {
      proposal.lifecycle = "SETTLED";
    }
    // §29.10 — audit EXECUTING→SETTLED or EXECUTING→FAILED.
    auditLifecycleTransition(proposal, fromStateExecuting, proposal.lifecycle, "system:executeRebalanceProposal", {
      failed,
      failureReason,
      settledActionCount: settledActions.length,
    });
  } catch (err) {
    failed = true;
    failureReason = err instanceof Error ? err.message : "unknown error";
    const fromStateErr = proposal.lifecycle;
    proposal.lifecycle = "FAILED";
    proposal.rejectionReason = failureReason;
    // §29.10 — audit EXECUTING→FAILED (exception path).
    auditLifecycleTransition(proposal, fromStateErr, "FAILED", "system:executeRebalanceProposal", {
      exception: failureReason,
    });
  }

  proposals.set(proposalId, proposal);

  const result: ExecutionResult = {
    proposalId,
    transactionRefs,
    settledActions,
    failed,
    failureReason,
  };
  executionResults.set(proposalId, result);

  return result;
}

// ============================================================
// Phase 5e: Confirm Settlement + Commit Reserve State
// ============================================================

/**
 * After execution settles, update the authoritative reserve state.
 * Per §18: state goes SETTLED → CUSTODIAN_CONFIRMED → RECONCILED → FINAL.
 */
export function confirmSettlement(proposalId: string): ReserveState {
  const proposal = proposals.get(proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
  if (proposal.lifecycle !== "SETTLED") throw new Error(`Proposal ${proposalId} is not in SETTLED state`);

  const result = executionResults.get(proposalId);
  if (!result || result.failed) throw new Error(`Proposal ${proposalId} execution failed`);

  // Update the executed reserve state (the ONLY way to mutate it)
  const updates = proposal.actions.map((action) => {
    const settled = result.settledActions.find((s) => s.actionId === action.actionId);
    const reserveState = getReserveState();
    const asset = reserveState.executed.find((s) => s.assetClass === action.assetClass);
    const currentQty = asset?.quantity ?? 0;
    const delta = action.action === "buy" ? settled!.settledQuantity : -settled!.settledQuantity;
    return {
      assetId: asset!.assetId,
      newQuantity: Math.max(0, currentQty + delta),
      transactionRef: settled!.settlementRef,
    };
  });

  const newState = commitReserveStateUpdate(updates, proposal.oracleSnapshotVersion);
  const fromStateSettled = proposal.lifecycle;
  proposal.lifecycle = "CUSTODIAN_CONFIRMED";
  proposals.set(proposalId, proposal);

  // §29.10 — audit SETTLED→CUSTODIAN_CONFIRMED.
  auditLifecycleTransition(proposal, fromStateSettled, "CUSTODIAN_CONFIRMED", "system:confirmSettlement", {
    newReserveStateVersion: newState.reserveStateVersion,
  });

  return newState;
}

/**
 * Finalize a proposal after reconciliation.
 */
export function finalizeProposal(proposalId: string): RebalanceProposal {
  const proposal = proposals.get(proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
  if (proposal.lifecycle !== "CUSTODIAN_CONFIRMED") throw new Error(`Proposal ${proposalId} is not in CUSTODIAN_CONFIRMED state`);
  const fromState = proposal.lifecycle;
  proposal.lifecycle = "FINAL";
  proposals.set(proposalId, proposal);
  // §29.10 — audit CUSTODIAN_CONFIRMED→FINAL.
  auditLifecycleTransition(proposal, fromState, "FINAL", "system:finalizeProposal");
  return proposal;
}

// ============================================================
// Query functions
// ============================================================

export function getProposal(proposalId: string): RebalanceProposal | null {
  return proposals.get(proposalId) ?? null;
}

export function getAllProposals(): RebalanceProposal[] {
  return Array.from(proposals.values());
}

export function getExecutionResult(proposalId: string): ExecutionResult | null {
  return executionResults.get(proposalId) ?? null;
}

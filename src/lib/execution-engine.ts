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
  exceedsExposureLimit,
  COUNTERPARTY_EXPOSURE_LIMITS,
  verifyRebalancePlanLiquidity,
  verifyRebalancePlanReserveRatio,
  type RebalanceContext,
  type RebalanceTrigger,
  type RebalanceTriggerSeverity,
  type RebalancePlan,
} from "./v19-infrastructure";

// §29.5 — comprehensive per-asset-class fee model (replaces hardcoded FEE_BPS).
import { computeRebalanceFee } from "./rebalance-fees";

// §3.1 / §4 — live NAV computer (for the live reserve ratio used in RR projection).
import { computeLiveNav } from "./nav-compute";

// Phase 4 — centralized machine-readable policy spec. SINGLE SOURCE OF TRUTH
// for all reserve policy limits. No magic numbers in the validation logic —
// every cap, threshold, and emergency override identifier flows from here.
import {
  CONCENTRATION_SPEC,
  TRADE_SUPPRESSION_SPEC,
  FEE_SPEC,
  TURNOVER_SPEC,
  RESERVE_POLICY_SPEC,
} from "./reserve-policy-spec";

// §29.10 — append-only audit ledger (JSONL).
import { appendFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { createHash } from "node:crypto";

// P1: State persistence layer (Turso-backed)
import { persistAllState, loadAllState, persistProposals, persistTurnoverRecords, persistHysteresisState } from "./state-persistence";

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
  /** §14 — Proposal expiry timestamp (ISO). Execution rejected after this. Default: createdAt + 7 days. */
  validUntil: string;
  /** §14 — Cryptographic hash binding to exact proposal parameters. Changing any material parameter invalidates the approval. */
  proposalHash: string;
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

// P1: Load persisted state on startup (fire-and-forget, non-blocking)
let _stateLoaded = false;
async function loadPersistedState() {
  if (_stateLoaded) return;
  _stateLoaded = true;
  try {
    const loaded = await loadAllState();
    if (loaded.proposals) {
      for (const [id, p] of loaded.proposals) proposals.set(id, p);
      console.log(`[execution-engine] loaded ${loaded.proposals.size} persisted proposals from Turso`);
    }
    if (loaded.turnoverRecords) {
      // Restore turnover records to the in-memory array
      turnoverRecords.push(...loaded.turnoverRecords);
      console.log(`[execution-engine] loaded ${loaded.turnoverRecords.length} persisted turnover records from Turso`);
    }
  } catch (err) {
    console.warn("[execution-engine] failed to load persisted state:", err instanceof Error ? err.message : err);
  }
}
void loadPersistedState();
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
let cachedLiveLcr: number | null = null;
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
      // Cache the LCR from the same computation (§5 — used by validateRebalanceProposal)
      if (nav.state?.lcr?.ratio) {
        cachedLiveLcr = nav.state.lcr.ratio;
      }
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

/**
 * §5 — Get the cached live LCR (ratio, e.g. 1.25 = 125%).
 * Returns the policy target (1.25) on the first call before the async
 * refresh completes. After any /api/nav hit, the cache is warm.
 */
function getCachedLiveLcr(): number {
  if (cachedLiveLcr === null) {
    void refreshLiveReserveRatio();
    return 1.25; // §5 policy target fallback
  }
  return cachedLiveLcr;
}

// ============================================================
// §14 — Proposal Hash Binding (P0 fix)
// ============================================================

/**
 * Compute a deterministic hash of the proposal's material parameters.
 * Binds the approval to the exact: proposal ID, actions (asset, side, quantity, value),
 * reserve state version, and oracle snapshot version.
 * Changing ANY material parameter produces a different hash, invalidating the approval.
 */
export function computeProposalHash(
  proposalId: string,
  actions: RebalanceAction[],
  reserveStateVersion: number,
  oracleSnapshotVersion: string,
): string {
  const material = JSON.stringify({
    proposalId,
    actions: actions.map(a => ({
      assetClass: a.assetClass,
      action: a.action,
      quantity: a.quantity,
      unit: a.unit,
      estimatedValue: a.estimatedValue,
    })),
    reserveStateVersion,
    oracleSnapshotVersion,
  });
  return createHash("sha256").update(material).digest("hex").slice(0, 32);
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
// Phase 4 — §10 Concentration Cap Runtime Gate
// ============================================================
//
// Per §10 (v19 addendum §4): the 7-tier counterparty exposure cap table is
// cumulative across tiers — a single counterparty that is simultaneously the
// largest issuer AND custodian is independently bound by Tier 1, Tier 2,
// AND Tier 3. The cap table is the SINGLE source of truth for counterparty
// exposure limits; this gate rejects any proposal whose post-trade portfolio
// would push a §10 group beyond its cap.
//
// The cap values are imported from `reserve-policy-spec.ts` CONCENTRATION_SPEC
// (re-exported via the v19-infrastructure.ts `COUNTERPARTY_EXPOSURE_LIMITS`
// array, which carries the per-tier metadata used by `exceedsExposureLimit`).
// NO magic numbers in this gate.

/**
 * §10 — Map an institutional `RebalanceAction.assetClass` to the currency
 * code used for per-currency / per-jurisdiction exposure grouping.
 *
 *   gold   → XAU
 *   silver → XAG
 *   cash / sovereign / stablecoin → USD (all USD-denominated in the simulation)
 */
function assetClassToCurrency(assetClass: RebalanceAction["assetClass"]): string {
  switch (assetClass) {
    case "gold": return "XAU";
    case "silver": return "XAG";
    default: return "USD";
  }
}

/**
 * §10 — Build the per-group exposure maps (in PERCENT — `exceedsExposureLimit`
 * expects 0..100) from a portfolio keyed by asset class.
 *
 * Three groupings (the simulation does not yet distinguish issuer from
 * custodian or jurisdiction from currency — we use the most restrictive
 * available mapping so the §10 invariant is enforced even with the
 * simplified data model):
 *
 *   - perCounterparty + perCustodian  → grouped by `custodianId`
 *   - perIssuer + perInfrastructure   → grouped by `assetClass`
 *   - perJurisdiction + perCurrency   → grouped by `assetClassToCurrency`
 */
function buildExposureMaps(
  portfolio: Map<RebalanceAction["assetClass"], number>,
  totalUsd: number,
  assetClassToCustodian: Map<RebalanceAction["assetClass"], string>,
): {
  perCustodian: Map<string, number>;
  perIssuer: Map<string, number>;
  perCurrency: Map<string, number>;
} {
  const perCustodian = new Map<string, number>();
  const perIssuer = new Map<string, number>();
  const perCurrency = new Map<string, number>();
  for (const [assetClass, valueUsd] of portfolio) {
    const pct = totalUsd > 0 ? (Math.max(0, valueUsd) / totalUsd) * 100 : 0;
    const custodian = assetClassToCustodian.get(assetClass) ?? "unknown";
    perCustodian.set(custodian, (perCustodian.get(custodian) ?? 0) + pct);
    perIssuer.set(assetClass, (perIssuer.get(assetClass) ?? 0) + pct);
    const currency = assetClassToCurrency(assetClass);
    perCurrency.set(currency, (perCurrency.get(currency) ?? 0) + pct);
  }
  return { perCustodian, perIssuer, perCurrency };
}

/**
 * §10 — Post-trade counterparty exposure gate.
 *
 * For each §10 tier (per-counterparty, per-custodian, per-issuer,
 * per-jurisdiction, per-infrastructure, per-currency — aggregate is skipped
 * because it is always 100% by construction), compute the post-trade
 * exposure per group and reject the proposal if any group exceeds its cap.
 *
 * Design note on pre-existing violations: the canonical simulation baseline
 * (cash $29M + sovereign $13.5M + stablecoin $2.7M ≈ 80% of total) is held
 * by a SINGLE simulated custodian (`sim-bank-01`), which already exceeds
 * the §10.2 per-custodian 25% cap. This is a known simulation simplification
 * (only 2 custodians vs CONCENTRATION_SPEC.MIN_CUSTODIANS=3). To avoid
 * blocking every proposal that touches the dominant custodian, this gate
 * uses the "worsening" rule: a trade is REJECTED only if it INCREASES the
 * exposure to an already-over-cap group (or pushes a previously-compliant
 * group over the cap). Trades that REDUCE an over-cap exposure are allowed
 * (the system should be free to rebalance toward compliance).
 *
 * The cap values come from `COUNTERPARTY_EXPOSURE_LIMITS` (which mirrors
 * `CONCENTRATION_SPEC`); the cross-check against `CONCENTRATION_SPEC` is
 * done at module load via the assertion below.
 */
function checkConcentrationCap(
  reserveState: ReserveState,
  actions: RebalanceAction[],
  totalReserveValue: number,
): { violations: string[] } {
  const violations: string[] = [];
  if (totalReserveValue <= 0) return { violations };

  // Pre-trade portfolio (assetClass → USD value) from executed state.
  const preTradePortfolio = new Map<RebalanceAction["assetClass"], number>();
  for (const a of reserveState.executed) {
    const v = a.unit === "oz" ? a.quantity * a.marketPrice : a.quantity;
    preTradePortfolio.set(
      a.assetClass as RebalanceAction["assetClass"],
      (preTradePortfolio.get(a.assetClass as RebalanceAction["assetClass"]) ?? 0) + v,
    );
  }

  // Post-trade portfolio: apply every action's buy/sell delta.
  const postTradePortfolio = new Map(preTradePortfolio);
  for (const action of actions) {
    const delta = action.action === "buy" ? action.estimatedValue : -action.estimatedValue;
    postTradePortfolio.set(
      action.assetClass,
      (postTradePortfolio.get(action.assetClass) ?? 0) + delta,
    );
  }

  const preTotal = Array.from(preTradePortfolio.values()).reduce(
    (s, v) => s + Math.max(0, v), 0,
  );
  const postTotal = Array.from(postTradePortfolio.values()).reduce(
    (s, v) => s + Math.max(0, v), 0,
  );
  if (postTotal <= 0) return { violations };

  // assetClass → custodianId lookup.
  const assetClassToCustodian = new Map<RebalanceAction["assetClass"], string>();
  for (const a of reserveState.executed) {
    assetClassToCustodian.set(
      a.assetClass as RebalanceAction["assetClass"],
      a.custodianId ?? "unknown",
    );
  }

  const preMaps = buildExposureMaps(preTradePortfolio, preTotal, assetClassToCustodian);
  const postMaps = buildExposureMaps(postTradePortfolio, postTotal, assetClassToCustodian);

  for (const limit of COUNTERPARTY_EXPOSURE_LIMITS) {
    if (limit.key === "aggregate") continue; // always 100% by construction
    let preMap: Map<string, number>;
    let postMap: Map<string, number>;
    if (limit.key === "per-counterparty" || limit.key === "per-custodian") {
      preMap = preMaps.perCustodian;
      postMap = postMaps.perCustodian;
    } else if (limit.key === "per-issuer" || limit.key === "per-infrastructure") {
      preMap = preMaps.perIssuer;
      postMap = postMaps.perIssuer;
    } else if (limit.key === "per-jurisdiction" || limit.key === "per-currency") {
      preMap = preMaps.perCurrency;
      postMap = postMaps.perCurrency;
    } else {
      continue;
    }
    for (const [group, postPct] of postMap) {
      const result = exceedsExposureLimit(postPct, limit);
      if (!result.exceeded) continue;
      const prePct = preMap.get(group) ?? 0;
      // §10 "worsening" rule — allow trades that REDUCE an already-over-cap
      // exposure (the system must remain free to rebalance toward §10
      // compliance). Reject only when the trade increases (or holds) the
      // over-cap exposure.
      if (postPct < prePct) continue;
      violations.push(
        `§10.${limit.tier} ${limit.name} breach: ${group} at ${postPct.toFixed(2)}% > cap ${limit.capPct}% (over by ${result.overBy.toFixed(2)}pp; pre-trade ${prePct.toFixed(2)}%)`,
      );
    }
  }
  return { violations };
}

// Compile-time cross-check: the v19-infrastructure cap table MUST agree with
// the centralized CONCENTRATION_SPEC. If they drift, this assertion fails at
// module load (a deliberate loud failure — the spec is the single source of
// truth and the two arrays must not diverge).
function _crossCheckConcentrationSpecAgreesWithV19Infrastructure(): void {
  const byKey = new Map(COUNTERPARTY_EXPOSURE_LIMITS.map((l) => [l.key, l.capPct / 100]));
  const expected: Record<string, number> = {
    "per-counterparty": CONCENTRATION_SPEC.PER_COUNTERPARTY,
    "per-custodian": CONCENTRATION_SPEC.PER_CUSTODIAN,
    "per-issuer": CONCENTRATION_SPEC.PER_ISSUER,
    "per-jurisdiction": CONCENTRATION_SPEC.PER_JURISDICTION,
    "per-infrastructure": CONCENTRATION_SPEC.PER_INFRASTRUCTURE,
    "per-currency": CONCENTRATION_SPEC.PER_CURRENCY,
    "aggregate": CONCENTRATION_SPEC.AGGREGATE,
  };
  for (const [key, expectedPct] of Object.entries(expected)) {
    const actualPct = byKey.get(key);
    if (actualPct === undefined) {
      throw new Error(`§10 cap-table drift: "${key}" missing from COUNTERPARTY_EXPOSURE_LIMITS`);
    }
    if (Math.abs(actualPct - expectedPct) > 1e-9) {
      throw new Error(
        `§10 cap-table drift: "${key}" capPct=${actualPct} in v19-infrastructure vs CONCENTRATION_SPEC=${expectedPct}`,
      );
    }
  }
}
_crossCheckConcentrationSpecAgreesWithV19Infrastructure();

// ============================================================
// Phase 4 — §29.6 Trade Suppression Rule (Phase 3 §6)
// ============================================================
//
// Per Phase 3 §6.1: do not execute a trade if
//
//     expected_benefit ≤ transaction_cost + slippage + market_impact + risk_buffer
//
// UNLESS an emergency constitutional condition exists (§33 SDP, §44
// Constitutional Emergency, or a Tier 3 trigger). The emergency override
// identifiers are imported from TRADE_SUPPRESSION_SPEC.EMERGENCY_OVERRIDES
// (sdp_triggered, constitutional_emergency, concentration_cap,
// reserve_ratio_breach, minimum_floor_breach). They are NOT §29 trigger
// types — they are conceptual labels for the conditions that bypass
// suppression. We bridge the two namespaces below.

/**
 * §29.6 — Map a §29 trigger type to a §29.6 emergency override identifier.
 * Returns `null` if the trigger type does not correspond to an override.
 */
const TRIGGER_TYPE_TO_OVERRIDE: Record<string, string> = {
  concentration_cap: "concentration_cap",
  minimum_floor: "minimum_floor_breach",
  reserve_ratio: "reserve_ratio_breach",
};

/**
 * §29.6 / Phase 3 §6.3 — Determine whether a proposal's triggers constitute
 * an emergency override that bypasses the trade suppression rule.
 *
 * Returns `true` if ANY of:
 *   - The proposal has a "critical" severity trigger (covers sdp_triggered +
 *     constitutional_emergency — both are Tier 3 emergencies by §33 / §44).
 *   - The proposal has a trigger whose type maps to one of
 *     TRADE_SUPPRESSION_SPEC.EMERGENCY_OVERRIDES (concentration_cap,
 *     minimum_floor, reserve_ratio).
 *
 * On the raw-actions path (no triggers), this returns `false` — suppression
 * applies normally because there is no constitutional justification to bypass.
 */
export function isEmergencyOverride(
  triggers: RebalanceTrigger[] | undefined,
): boolean {
  if (!triggers || triggers.length === 0) return false;
  const overrides = TRADE_SUPPRESSION_SPEC.EMERGENCY_OVERRIDES;
  for (const t of triggers) {
    if (t.severity === "critical") return true;
    const mapped = TRIGGER_TYPE_TO_OVERRIDE[t.type];
    if (mapped && (overrides as readonly string[]).includes(mapped)) return true;
  }
  return false;
}

/**
 * §29.6 / Phase 3 §6 — Trade suppression check.
 *
 * For each action, computes:
 *
 *   expected_benefit = |current_weight − target_weight| × totalReserveValue
 *   total_cost       = computeRebalanceFee(assetClass, tradeValue, method).totalCost
 *                      + market_impact_estimate
 *                      + RISK_BUFFER_BPS × tradeValue / 10_000
 *
 * If `expected_benefit ≤ total_cost` AND the proposal is NOT an emergency
 * override, the action is suppressed (Tier 1 — observe instead of trade).
 *
 * `market_impact_estimate` is set to the fee's `slippageCost` (the fee
 * model's market-impact estimate, per §29.5). This is intentionally
 * conservative — it effectively doubles the slippage component, biasing
 * toward NOT trading (per Phase 3 §6.2 "Conservative — biases toward NOT
 * trading"). A dedicated `estimateMarketImpact` function (Phase 2 §6.4)
 * can replace this proxy when implemented.
 */
function checkTradeSuppression(
  proposal: RebalanceProposal,
  reserveState: ReserveState,
  totalReserveValue: number,
): { suppressed: string[] } {
  // Emergency overrides bypass suppression entirely (Phase 3 §6.3).
  if (isEmergencyOverride(proposal.triggers)) {
    return { suppressed: [] };
  }
  const suppressed: string[] = [];
  const riskBufferBps = FEE_SPEC.RISK_BUFFER_BPS;

  for (const action of proposal.actions) {
    const asset = reserveState.executed.find((s) => s.assetClass === action.assetClass);
    const currentWeight = asset?.actualWeight ?? 0;
    const targetWeight = asset?.targetWeight ?? 0;
    const drift = Math.abs(currentWeight - targetWeight);

    // expected_benefit: drift reduction × portfolio value (Phase 3 §6.2).
    const expectedBenefit = drift * totalReserveValue;

    // total_cost: fee (execution + slippage + spread) + market impact + risk buffer.
    const fee = computeRebalanceFee(action.assetClass, action.estimatedValue, "TWAP");
    const marketImpactEstimate = fee.slippageCost; // conservative proxy (Phase 2 §6.4)
    const riskBufferUsd = (riskBufferBps * action.estimatedValue) / 10_000;
    const totalCost = fee.totalCost + marketImpactEstimate + riskBufferUsd;

    if (expectedBenefit <= totalCost) {
      suppressed.push(
        `§29.6 trade suppressed: ${action.assetClass} ${action.action} — expected benefit $${expectedBenefit.toFixed(2)} ≤ total cost $${totalCost.toFixed(2)} (fee $${fee.totalCost.toFixed(2)} + impact $${marketImpactEstimate.toFixed(2)} + risk buffer $${riskBufferUsd.toFixed(2)} at ${riskBufferBps}bps) — Tier 1 observe`,
      );
    }
  }
  return { suppressed };
}

// ============================================================
// Phase 4 — Invariant I-4 Weekly Turnover Tracker (3% cap per asset)
// ============================================================
//
// Per Invariant I-4 (Certora-proven): the weekly weight-change per asset
// MUST NOT exceed 3% (TURNOVER_SPEC.WEEKLY_CAP_PER_ASSET). The cap MAY be
// exceeded under a documented Tier 3 emergency (Phase 3 §1 property 9:
// "3% weekly cap may be exceeded under documented emergency — requires
// Council authorization + post-incident audit").
//
// Implementation: an in-memory Map records each EXECUTED trade's weight
// impact per asset with a timestamp. Before execution, we sum the historical
// weight changes for each asset in the last 7 days + the projected weight
// change from the pending proposal; if the total exceeds the cap and the
// proposal is NOT a Tier 3 emergency, REJECT with "weekly turnover cap
// exceeded for {asset}".
//
// DETERMINISM (§29.12): NO `Date.now()` is called in the decision logic.
// The check function takes `asOfTimestamp` as a required parameter; callers
// (the route handler) pass `Date.now()` explicitly. The record function
// also takes `asOfTimestamp` as a parameter. The in-memory Map is the
// operational cache; the §29.10 audit ledger is the canonical record.

interface TurnoverRecord {
  assetClass: RebalanceAction["assetClass"];
  /** Absolute weight change (always ≥ 0). Churning counts both ways. */
  weightChange: number;
  /** ms since epoch — passed by the caller, NOT Date.now(). */
  timestamp: number;
  proposalId: string;
}

/**
 * In-memory turnover tracker. Lost on restart — the §29.10 audit ledger is
 * the canonical record. Acceptable for SIMULATION mode.
 */
const turnoverRecords: TurnoverRecord[] = [];

/**
 * Idempotency set: a proposal's turnover impact is recorded at most once,
 * even if `recordTurnoverImpact` is called multiple times (defensive —
 * `executeRebalanceProposal` guards against double-execution via lifecycle
 * state, but this set is a belt-and-braces backstop).
 */
const recordedProposalIds = new Set<string>();

/**
 * Invariant I-4 — Check whether executing this proposal would exceed the
 * weekly turnover cap for any asset. Returns the list of violations
 * (empty if all clear).
 *
 * Per Phase 3 §1 property 9 / Invariant I-4: the 3% weekly cap MAY be
 * exceeded under a documented Tier 3 emergency. We treat
 * `proposal.maxSeverity === "critical"` as the Tier 3 emergency signal —
 * the §29.10 audit ledger captures the constitutional justification.
 */
function checkWeeklyTurnoverCap(
  proposal: RebalanceProposal,
  totalReserveValue: number,
  asOfTimestamp: number,
): { violations: string[] } {
  // Tier 3 emergency bypass (documented — the audit ledger carries the
  // critical-severity trigger that justifies the override).
  if (proposal.maxSeverity === "critical") {
    return { violations: [] };
  }

  const weeklyCap = TURNOVER_SPEC.WEEKLY_CAP_PER_ASSET; // 0.03
  const windowMs = TURNOVER_SPEC.WEEKLY_WINDOW_MS;      // 7 days
  const cutoff = asOfTimestamp - windowMs;

  // Project the absolute weight change per asset from this proposal.
  const projectedByAsset = new Map<RebalanceAction["assetClass"], number>();
  for (const action of proposal.actions) {
    if (totalReserveValue <= 0) continue;
    const weightChange = Math.abs(action.estimatedValue / totalReserveValue);
    projectedByAsset.set(
      action.assetClass,
      (projectedByAsset.get(action.assetClass) ?? 0) + weightChange,
    );
  }

  const violations: string[] = [];
  for (const [assetClass, projected] of projectedByAsset) {
    const historical = turnoverRecords
      .filter((r) => r.assetClass === assetClass && r.timestamp >= cutoff)
      .reduce((sum, r) => sum + r.weightChange, 0);
    const total = historical + projected;
    if (total > weeklyCap) {
      violations.push(
        `Invariant I-4 weekly turnover cap exceeded for ${assetClass}: ${(total * 100).toFixed(2)}% > ${(weeklyCap * 100).toFixed(0)}% cap (historical ${(historical * 100).toFixed(2)}% + projected ${(projected * 100).toFixed(2)}%)`,
      );
    }
  }
  return { violations };
}

/**
 * Invariant I-4 — Record the executed trade's weight impact per asset.
 * Called AFTER successful execution settles so subsequent proposals see
 * the updated turnover. Idempotent (see `recordedProposalIds`).
 */
function recordTurnoverImpact(
  proposal: RebalanceProposal,
  totalReserveValue: number,
  asOfTimestamp: number,
): void {
  if (recordedProposalIds.has(proposal.proposalId)) return;
  recordedProposalIds.add(proposal.proposalId);
  if (totalReserveValue <= 0) return;
  for (const action of proposal.actions) {
    const weightChange = Math.abs(action.estimatedValue / totalReserveValue);
    if (weightChange <= 0) continue;
    turnoverRecords.push({
      assetClass: action.assetClass,
      weightChange,
      timestamp: asOfTimestamp,
      proposalId: proposal.proposalId,
    });
  }
}

/**
 * Phase 4 — test/diagnostic helper: reset the in-memory turnover tracker.
 * Used by integration tests to establish a deterministic baseline. NOT
 * called by production code paths.
 */
export function _resetTurnoverTrackerForTests(): void {
  turnoverRecords.length = 0;
  recordedProposalIds.clear();
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
    validUntil: new Date(Date.parse(now) + 7 * 24 * 60 * 60 * 1000).toISOString(), // §14: 7-day expiry
    proposalHash: computeProposalHash(proposalId, rebalanceActions, reserveState.reserveStateVersion, oracleSnapshotVersion),
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
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso

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

  // §22A — post-trade weight bounds (use centralized spec, no magic numbers).
  const maxCap = RESERVE_POLICY_SPEC.BASKET_VERIFICATION.MAX_CAP;       // 0.60
  const minFloor = RESERVE_POLICY_SPEC.BASKET_VERIFICATION.MIN_FLOOR;   // 0.005
  // §4 — post-trade reserve ratio floor (PAR-based hard invariant).
  const rrHardFloor = RESERVE_POLICY_SPEC.RESERVE_RATIO.HARD_FLOOR;     // 1.00

  for (const action of proposal.actions) {
    // §22A — post-trade weight within constitutional bounds.
    if (action.postTradeWeight > maxCap) {
      failures.push(`${action.assetClass} post-trade weight ${(action.postTradeWeight * 100).toFixed(1)}% exceeds ${(maxCap * 100).toFixed(0)}% cap`);
    }
    if (action.postTradeWeight < minFloor && action.assetClass !== "stablecoin") {
      failures.push(`${action.assetClass} post-trade weight ${(action.postTradeWeight * 100).toFixed(2)}% below ${(minFloor * 100).toFixed(1)}% floor`);
    }
    // §4 — post-trade reserve ratio hard floor.
    if (action.postTradeReserveRatio < rrHardFloor) {
      failures.push(`${action.assetClass} post-trade RR ${(action.postTradeReserveRatio * 100).toFixed(1)}% below ${(rrHardFloor * 100).toFixed(0)}% floor`);
    }
  }

  // Phase 4 — §10 concentration cap runtime gate (7-tier counterparty
  // exposure cap table). Computed against the live reserve state + the
  // proposal's post-trade portfolio. Rejects trades that would push a §10
  // group beyond its cap (with the "worsening" rule documented above).
  const reserveState = getReserveState();
  const totalReserveValue = reserveState.executed.reduce(
    (sum, s) => sum + (s.unit === "oz" ? s.quantity * s.marketPrice : s.quantity),
    0,
  );
  const capCheck = checkConcentrationCap(reserveState, proposal.actions, totalReserveValue);
  failures.push(...capCheck.violations);

  // Phase 4 — §29.6 / Phase 3 §6 trade suppression check. Suppresses
  // individual actions whose expected benefit ≤ total cost (Tier 1 — observe
  // instead). Emergency overrides bypass suppression entirely (§6.3).
  const suppressionCheck = checkTradeSuppression(proposal, reserveState, totalReserveValue);
  failures.push(...suppressionCheck.suppressed);

  // ──────────────────────────────────────────────────────────────
  // FIX (adversarial certification finding #1 — CRITICAL):
  // Wire verifyRebalancePlanLiquidity + verifyRebalancePlanReserveRatio
  // into the execution gate. Previously these existed but were NEVER called.
  // A plan converting HQLA cash to non-HQLA gold could drop LCR below 1.0
  // without being rejected.
  // ──────────────────────────────────────────────────────────────

  // §29.6 — Liquidity Coverage Ratio verification.
  // Estimate the LCR impact: HQLA assets (cash, sovereign, stablecoin) sold
  // decrease the LCR numerator; HQLA bought increases it. Non-HQLA (gold,
  // silver) don't affect the HQLA numerator directly.
  const HQLA_CLASSES = new Set(["cash", "sovereign", "stablecoin"]);
  let hqlaDeltaUsd = 0;
  for (const action of proposal.actions) {
    if (!HQLA_CLASSES.has(action.assetClass)) continue;
    const actionValue = action.estimatedValue || 0;
    if (action.action === "sell") hqlaDeltaUsd -= actionValue;
    else if (action.action === "buy") hqlaDeltaUsd += actionValue;
  }
  // Current HQLA ≈ 60% of total reserve (same assumption as nav-compute.ts:219)
  const currentHqla = totalReserveValue * 0.60;
  const estimatedLcrDelta = currentHqla > 0 ? hqlaDeltaUsd / currentHqla : 0;
  // Get current LCR from the cached live state (fallback to 1.25 = policy target)
  const currentLcr = getCachedLiveLcr();
  // Build a minimal plan proxy for the verifier (it only reads plan.phased)
  const planProxy = { phased: proposal.actions.length > 3 } as RebalancePlan;
  const liquidityCheck = verifyRebalancePlanLiquidity(planProxy, currentLcr, estimatedLcrDelta);
  if (!liquidityCheck.allowed) {
    failures.push(liquidityCheck.reason);
  }

  // §29.7 — Reserve Ratio verification.
  // Estimate the RR impact: selling decreases R_a, buying increases it.
  // RR is in PERCENT (e.g. 102.05). Delta in percent.
  const currentRR = getCachedLiveRR() * 100; // convert decimal → percent
  let rrDeltaPercent = 0;
  for (const action of proposal.actions) {
    const actionValue = action.estimatedValue || 0;
    if (action.action === "sell") rrDeltaPercent -= (actionValue / totalReserveValue) * 100;
    else if (action.action === "buy") rrDeltaPercent += (actionValue / totalReserveValue) * 100;
  }
  const rrCheck = verifyRebalancePlanReserveRatio(planProxy, currentRR, rrDeltaPercent, false);
  if (!rrCheck.allowed) {
    failures.push(rrCheck.reason);
  }

  const fromState = proposal.lifecycle;
  if (failures.length > 0) {
    proposal.lifecycle = "REJECTED";
    proposal.rejectionReason = failures.join("; ");
  } else {
    proposal.lifecycle = "VALIDATED";
  }

  proposals.set(proposalId, proposal);
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso

  // §29.10 — audit the validation transition (PROPOSED→VALIDATED or PROPOSED→REJECTED).
  auditLifecycleTransition(proposal, fromState, proposal.lifecycle, "system:validateRebalanceProposal", {
    failures,
    concentrationCapViolations: capCheck.violations.length,
    tradeSuppressions: suppressionCheck.suppressed.length,
    liquidityCheck: { allowed: liquidityCheck.allowed, reason: liquidityCheck.reason, projectedLcr: currentLcr + estimatedLcrDelta },
    reserveRatioCheck: { allowed: rrCheck.allowed, reason: rrCheck.reason, projectedRR: currentRR + rrDeltaPercent },
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
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso

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
 *
 * Phase 4 — Invariant I-4 weekly turnover cap (3% per asset) is enforced
 * BEFORE execution. If the cumulative weight change for any asset in the
 * last 7 days + this proposal's projected weight change exceeds
 * TURNOVER_SPEC.WEEKLY_CAP_PER_ASSET and the proposal is NOT a Tier 3
 * emergency (maxSeverity !== "critical"), execution is REJECTED with
 * "weekly turnover cap exceeded for {asset}". The check uses an
 * `asOfTimestamp` parameter (NOT `Date.now()` in the decision logic —
 * §29.12 determinism); the default falls back to `Date.now()` so the
 * existing route handler that doesn't pass an options object continues
 * to work unchanged.
 */
export async function executeRebalanceProposal(
  proposalId: string,
  options?: { asOfTimestamp?: number },
): Promise<ExecutionResult> {
  const proposal = proposals.get(proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
  if (proposal.lifecycle !== "APPROVED") throw new Error(`Proposal ${proposalId} is not in APPROVED state`);

  // §14 — Check proposal expiry (validUntil). P0 fix: expired proposals cannot be executed.
  const asOf = options?.asOfTimestamp ?? Date.now();
  if (proposal.validUntil && asOf > Date.parse(proposal.validUntil)) {
    proposal.lifecycle = "EXPIRED";
    proposals.set(proposalId, proposal);
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso
    throw new Error(`Proposal ${proposalId} expired (validUntil: ${proposal.validUntil})`);
  }

  // §14 — Verify proposal hash integrity. P0 fix: detect tampering post-approval.
  const currentHash = computeProposalHash(proposal.proposalId, proposal.actions, proposal.reserveStateVersion, proposal.oracleSnapshotVersion);
  if (proposal.proposalHash && proposal.proposalHash !== currentHash) {
    proposal.lifecycle = "REJECTED";
    proposal.rejectionReason = "Proposal hash mismatch — parameters altered post-approval";
    proposals.set(proposalId, proposal);
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso
    throw new Error(`Proposal ${proposalId} hash mismatch — parameters were altered after approval`);
  }

  if (!isExecutionAllowed()) {
    throw new Error(`Execution not allowed in current mode (${getExecutionMode()})`);
  }

  // §29.12 — asOfTimestamp is caller-supplied for determinism. The default
  // `Date.now()` is a parameter value (NOT decision logic) — the actual
  // check function `checkWeeklyTurnoverCap` is pure: it uses only its
  // arguments.
  const asOfTimestamp = options?.asOfTimestamp ?? Date.now();

  // Phase 4 — Invariant I-4 pre-execution weekly turnover cap check.
  const reserveState = getReserveState();
  const totalReserveValue = reserveState.executed.reduce(
    (sum, s) => sum + (s.unit === "oz" ? s.quantity * s.marketPrice : s.quantity),
    0,
  );
  const turnoverCheck = checkWeeklyTurnoverCap(
    proposal, totalReserveValue, asOfTimestamp,
  );
  if (turnoverCheck.violations.length > 0) {
    const reason = `Invariant I-4 weekly turnover cap exceeded: ${turnoverCheck.violations.join("; ")}`;
    proposal.lifecycle = "FAILED";
    proposal.rejectionReason = reason;
    proposals.set(proposalId, proposal);
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso
    // §29.10 — audit the turnover-cap rejection (APPROVED→FAILED).
    auditLifecycleTransition(proposal, "APPROVED", "FAILED", "system:turnover-cap", {
      turnoverViolations: turnoverCheck.violations,
      asOfTimestamp,
    });
    const result: ExecutionResult = {
      proposalId,
      transactionRefs: [],
      settledActions: [],
      failed: true,
      failureReason: reason,
    };
    executionResults.set(proposalId, result);
    return result;
  }

  const fromStateApproved = proposal.lifecycle;
  proposal.lifecycle = "SUBMITTED";
  proposals.set(proposalId, proposal);
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso
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
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso
    // §29.10 — audit SUBMITTED→EXECUTING.
    auditLifecycleTransition(proposal, fromStateSubmitted, "EXECUTING", "system:executeRebalanceProposal");

    for (const action of proposal.actions) {
      // Get the appropriate custodian adapter
      const rs = getReserveState();
      const asset = rs.executed.find((s) => s.assetClass === action.assetClass);
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

    // Phase 4 — Invariant I-4: record the executed trade's weight impact
    // per asset so subsequent proposals see the updated turnover. Only
    // recorded on successful settlement (failed proposals don't churn the
    // portfolio). Idempotent via `recordedProposalIds`.
    if (!failed) {
      recordTurnoverImpact(proposal, totalReserveValue, asOfTimestamp);
  void persistTurnoverRecords(turnoverRecords).catch(() => {}); // P1: persist turnover to Turso
    }
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
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso

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
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso

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
  void persistProposals(proposals).catch(() => {}); // P1: persist to Turso
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

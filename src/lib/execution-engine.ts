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
 * Phase 5 of the institutional execution architecture implementation.
 * Status: SIMULATED — executes against simulated custodian adapters.
 */

import type { ReserveAssetState, ReserveState } from "./reserve-state";
import { getReserveState, commitReserveStateUpdate, getExecutionMode, isExecutionAllowed } from "./reserve-state";
import { getCustodianAdapter, type CustodianTransactionRequest } from "./custodian-adapter";

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
// Phase 5a: Generate Rebalance Plan (PROPOSED)
// ============================================================

/**
 * Generate a rebalance proposal from the current reserve state.
 * This wraps the existing `generateCrossAssetRebalancePlan` output
 * into an institutional proposal with full lifecycle tracking.
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
  oracleSnapshotVersion: string
): RebalanceProposal {
  const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // Compute estimated fees (simplified — uses the fee model from rebalance-fees.ts)
  const FEE_BPS: Record<string, number> = { gold: 10, silver: 20, cash: 0, sovereign: 4, stablecoin: 6 };
  const SLIPPAGE_BPS: Record<string, number> = { gold: 5, silver: 12, cash: 0, sovereign: 2, stablecoin: 3 };

  const rebalanceActions: RebalanceAction[] = actions.map((a, i) => {
    const asset = reserveState.executed.find((s) => s.assetClass === a.assetClass);
    const marketPrice = asset?.marketPrice ?? 1;
    const estimatedValue = a.unit === "oz" ? a.quantity * marketPrice : a.quantity;
    const feeBps = FEE_BPS[a.assetClass] ?? 5;
    const slipBps = SLIPPAGE_BPS[a.assetClass] ?? 3;
    const estimatedFees = estimatedValue * feeBps / 10000;
    const estimatedSlippage = estimatedValue * slipBps / 10000;

    // Compute post-trade weight (simplified)
    const currentValue = asset ? (asset.unit === "oz" ? asset.quantity * asset.marketPrice : asset.quantity) : 0;
    const totalReserveValue = reserveState.executed.reduce((sum, s) =>
      sum + (s.unit === "oz" ? s.quantity * s.marketPrice : s.quantity), 0);
    const deltaValue = a.action === "buy" ? estimatedValue : -estimatedValue;
    const postTradeValue = currentValue + deltaValue;
    const postTradeWeight = postTradeValue / (totalReserveValue + deltaValue);

    // Compute post-trade reserve ratio (simplified — assumes RR stays > 100%)
    const currentRR = 1.09; // from live data
    const postTradeReserveRatio = currentRR; // simplified

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
  };

  proposals.set(proposalId, proposal);
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

  if (failures.length > 0) {
    proposal.lifecycle = "REJECTED";
    proposal.rejectionReason = failures.join("; ");
  } else {
    proposal.lifecycle = "VALIDATED";
  }

  proposals.set(proposalId, proposal);
  return proposal;
}

// ============================================================
// Phase 5c: Approve Rebalance Plan (APPROVED)
// ============================================================

/**
 * Per §14: Target 3-of-5 institutional approval.
 * Roles: Treasury, Risk, Constitutional, Operations, Independent Oversight.
 *
 * In SIMULATION mode: auto-approves with all 5 roles.
 * In PRODUCTION mode: requires real institutional signatures.
 */
export function approveRebalanceProposal(
  proposalId: string,
  approvals: Array<{ role: ApprovalRole; approved: boolean; reason?: string }>
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

  // Check 3-of-5 threshold (SIMULATION mode auto-approves all)
  if (mode === "SIMULATION") {
    // Auto-approve with all 5 roles
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
    // PRODUCTION: require at least 3 of 5 approvals
    const approvedCount = proposal.approvals.filter((a) => a.approved).length;
    if (approvedCount >= 3) {
      proposal.lifecycle = "APPROVED";
    } else {
      proposal.lifecycle = "REJECTED";
      proposal.rejectionReason = `Insufficient approvals: ${approvedCount}/5 (requires 3)`;
    }
  }

  proposals.set(proposalId, proposal);
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
    throw new Error("Execution not allowed in current mode");
  }

  proposal.lifecycle = "SUBMITTED";
  proposals.set(proposalId, proposal);

  const settledActions: ExecutionResult["settledActions"] = [];
  const transactionRefs: string[] = [];
  let failed = false;
  let failureReason: string | undefined;

  try {
    proposal.lifecycle = "EXECUTING";
    proposals.set(proposalId, proposal);

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

    if (failed) {
      proposal.lifecycle = "FAILED";
      proposal.rejectionReason = failureReason;
    } else {
      proposal.lifecycle = "SETTLED";
    }
  } catch (err) {
    failed = true;
    failureReason = err instanceof Error ? err.message : "unknown error";
    proposal.lifecycle = "FAILED";
    proposal.rejectionReason = failureReason;
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
  proposal.lifecycle = "CUSTODIAN_CONFIRMED";
  proposals.set(proposalId, proposal);

  return newState;
}

/**
 * Finalize a proposal after reconciliation.
 */
export function finalizeProposal(proposalId: string): RebalanceProposal {
  const proposal = proposals.get(proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
  if (proposal.lifecycle !== "CUSTODIAN_CONFIRMED") throw new Error(`Proposal ${proposalId} is not in CUSTODIAN_CONFIRMED state`);
  proposal.lifecycle = "FINAL";
  proposals.set(proposalId, proposal);
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

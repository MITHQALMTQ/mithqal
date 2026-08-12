/**
 * MITHQAL — Reconciliation Engine
 *
 * Per §11: Creates three explicit views (Target, Actual, Custodian Verified)
 * and calculates: Custodian Variance = Internal Reserve State − Custodian Confirmed State
 *
 * Per §22: Design for transaction-level, daily, periodic, and exception-driven reconciliation.
 *
 * Per §20: If variance exceeds threshold → flag, stop, initiate reconciliation,
 * preserve evidence, notify governance, do not silently overwrite.
 *
 * Phase 6 of the institutional execution architecture implementation.
 * Status: SIMULATED — reconciles against simulated custodian adapters.
 */

import type { ReserveState, ReserveAssetState } from "./reserve-state";
import { getReserveState, commitCustodianConfirmation } from "./reserve-state";
import { getCustodianAdapter } from "./custodian-adapter";

// ============================================================
// Types
// ============================================================

export type ReconciliationFrequency = "transaction" | "daily" | "periodic" | "exception";

export interface ReconciliationResult {
  reconciliationId: string;
  timestamp: string;
  frequency: ReconciliationFrequency;
  matched: boolean;
  totalVariance: number;
  discrepancies: Array<{
    assetId: string;
    assetClass: string;
    internalQty: number;
    custodianQty: number;
    variance: number;
    varianceUsd: number;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  action: "none" | "flag" | "pause_execution" | "initiate_investigation" | "notify_governance";
  reserveStateVersion: number;
}

// ============================================================
// Constants
// ============================================================

// Per §20: variance thresholds
const VARIANCE_THRESHOLD_LOW = 0.001;      // 0.1% — negligible
const VARIANCE_THRESHOLD_MEDIUM = 0.005;   // 0.5% — investigate
const VARIANCE_THRESHOLD_HIGH = 0.01;      // 1% — pause execution
const VARIANCE_THRESHOLD_CRITICAL = 0.05;  // 5% — emergency

// ============================================================
// Reconciliation Engine
// ============================================================

/**
 * Perform a full reconciliation between the internal reserve state
 * and the custodian-confirmed state.
 *
 * Per §11: Custodian Variance = Internal Reserve State − Custodian Confirmed State
 */
export async function performReconciliation(
  frequency: ReconciliationFrequency = "daily"
): Promise<ReconciliationResult> {
  const reserveState = getReserveState();
  const reconciliationId = `recon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // Collect all custodian holdings
  const custodianAssets: ReserveAssetState[] = [];
  const discrepancies: ReconciliationResult["discrepancies"] = [];
  let totalVariance = 0;

  for (const asset of reserveState.executed) {
    if (!asset.custodianId) continue;

    const adapter = getCustodianAdapter(asset.custodianId);
    if (!adapter) {
      discrepancies.push({
        assetId: asset.assetId,
        assetClass: asset.assetClass,
        internalQty: asset.quantity,
        custodianQty: 0,
        variance: asset.quantity,
        varianceUsd: asset.unit === "oz" ? asset.quantity * asset.marketPrice : asset.quantity,
        severity: "critical",
      });
      continue;
    }

    // Query custodian holdings
    const holdings = await adapter.getHoldings(asset.custodyAccountId ?? "");
    const custodianAsset = holdings.assets.find((a) => a.assetId === asset.assetId);
    const custodianQty = custodianAsset?.quantity ?? 0;
    const variance = Math.abs(asset.quantity - custodianQty);
    const varianceUsd = variance * (asset.unit === "oz" ? asset.marketPrice : 1);

    // Build custodian-confirmed asset state
    custodianAssets.push({
      ...asset,
      quantity: custodianQty,
      dataSourceId: `custodian-${asset.custodianId}`,
      verificationTimestamp: now,
    });

    if (variance > VARIANCE_THRESHOLD_LOW) {
      let severity: "low" | "medium" | "high" | "critical" = "low";
      const variancePct = asset.quantity > 0 ? variance / asset.quantity : variance;
      if (variancePct >= VARIANCE_THRESHOLD_CRITICAL) severity = "critical";
      else if (variancePct >= VARIANCE_THRESHOLD_HIGH) severity = "high";
      else if (variancePct >= VARIANCE_THRESHOLD_MEDIUM) severity = "medium";

      discrepancies.push({
        assetId: asset.assetId,
        assetClass: asset.assetClass,
        internalQty: asset.quantity,
        custodianQty,
        variance,
        varianceUsd,
        severity,
      });
      totalVariance += varianceUsd;
    }
  }

  // Update the reserve state with custodian confirmation
  const updatedState = commitCustodianConfirmation(custodianAssets);

  // Determine action based on discrepancies
  let action: ReconciliationResult["action"] = "none";
  const hasHigh = discrepancies.some((d) => d.severity === "high" || d.severity === "critical");
  const hasMedium = discrepancies.some((d) => d.severity === "medium");

  if (discrepancies.some((d) => d.severity === "critical")) {
    action = "notify_governance";
  } else if (hasHigh) {
    action = "pause_execution";
  } else if (hasMedium) {
    action = "initiate_investigation";
  } else if (discrepancies.length > 0) {
    action = "flag";
  }

  return {
    reconciliationId,
    timestamp: now,
    frequency,
    matched: discrepancies.length === 0,
    totalVariance,
    discrepancies,
    action,
    reserveStateVersion: updatedState.reserveStateVersion,
  };
}

/**
 * Get the current reconciliation status.
 */
export function getReconciliationStatus(reserveState: ReserveState): {
  status: "verified" | "pending" | "exception" | "suspended";
  lastReconciliation: string | null;
  variance: number;
  needsReconciliation: boolean;
} {
  return {
    status: reserveState.reconciliationStatus,
    lastReconciliation: reserveState.lastReconciliation,
    variance: reserveState.custodianVariance,
    needsReconciliation: reserveState.reconciliationStatus === "pending" || reserveState.reconciliationStatus === "exception",
  };
}

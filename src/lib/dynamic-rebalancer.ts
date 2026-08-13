// v24.1.1 Gold-Relative Currency Lifecycle + Multi-Dimensional Rebalancer
// =================================================================
// Implements:
//   §16 — Gold-relative currency lifecycle (6 states)
//   §13 — Multi-dimensional rebalancing (4D: currency × asset × custodian × jurisdiction)
//   §23 — Stress-aware target portfolio (W_robust = λ×W_normal + (1-λ)×W_stress)
//   §22 — Rebalancing algorithm with cost-aware thresholds
// =================================================================

export type CurrencyLifecycleState =
  | "NORMAL" | "WATCH" | "REDUCE" | "SUSPEND" | "EXIT" | "REINSTATE";

export interface CurrencyLifecycleInput {
  currency: string;
  goldRelativeStrength: number; // G_i(t)
  goldRelativeDepreciation: number; // 1 - G_i(t)
  cqs: number;
  convertibilityOk: boolean;
  sanctionsHit: boolean;
  custodyOk: boolean;
  settlementOk: boolean;
  liquidityOk: boolean;
  marketOpen: boolean;
}

export interface CurrencyLifecycleResult {
  currency: string;
  state: CurrencyLifecycleState;
  reason: string;
  goldRelativeDepreciation: number;
  thresholds: {
    watch: number;
    reduce: number;
    suspend: number;
    exit: number;
  };
}

export function classifyCurrencyLifecycle(
  input: CurrencyLifecycleInput,
): CurrencyLifecycleResult {
  const dep = input.goldRelativeDepreciation;
  let state: CurrencyLifecycleState = "NORMAL";
  let reason = "All indicators normal";

  // Fundamental failure checks (override depreciation-based classification)
  if (input.sanctionsHit || !input.convertibilityOk || !input.custodyOk || !input.settlementOk || !input.marketOpen) {
    if (dep > 0.25 || input.cqs < 3.0) {
      state = "EXIT";
      reason = `Fundamental failure: sanctions=${input.sanctionsHit}, convertibility=${input.convertibilityOk}, custody=${input.custodyOk}, settlement=${input.settlementOk}`;
    } else {
      state = "SUSPEND";
      reason = `Fundamental stress: convertibility/custody/settlement impaired`;
    }
  } else if (input.cqs < 4.0) {
    state = "SUSPEND";
    reason = `CQS=${input.cqs.toFixed(2)} < 4.0 — critical quality failure`;
  } else if (dep > 0.25 && input.cqs < 5.0) {
    state = "EXIT";
    reason = `Depreciation=${(dep * 100).toFixed(1)}% > 25% AND CQS=${input.cqs.toFixed(2)} < 5.0 — fundamental failure`;
  } else if (dep > 0.15) {
    state = "SUSPEND";
    reason = `Depreciation=${(dep * 100).toFixed(1)}% > 15% — suspend pending risk confirmation`;
  } else if (dep > 0.10) {
    state = "REDUCE";
    reason = `Depreciation=${(dep * 100).toFixed(1)}% > 10% — reduce with confirmation`;
  } else if (dep > 0.05) {
    state = "WATCH";
    reason = `Depreciation=${(dep * 100).toFixed(1)}% > 5% — heightened monitoring`;
  }

  return {
    currency: input.currency,
    state,
    reason,
    goldRelativeDepreciation: dep,
    thresholds: { watch: 0.05, reduce: 0.10, suspend: 0.15, exit: 0.25 },
  };
}

// ---- Multi-Dimensional Rebalancing (§13) ----

export interface CustodyAllocation {
  custodian: string;
  jurisdiction: string;
  weight: number;    // fraction of total reserve
  commonModeGroupId: string; // for common-mode dependency detection
}

export interface MultiDimRebalanceInput {
  currentCurrencyWeights: Record<string, number>;
  targetCurrencyWeights: Record<string, number>;
  currentCustodyAllocations: CustodyAllocation[];
  targetMaxCustodianPct: number;    // e.g., 0.15 (15% max per custodian)
  targetMaxJurisdictionPct: number; // e.g., 0.30 (30% max per jurisdiction)
  rebalanceThreshold: number;       // e.g., 0.005 (0.5%)
}

export interface RebalanceAction {
  dimension: "currency" | "custodian" | "jurisdiction";
  asset: string;
  action: "increase" | "decrease" | "exit" | "enter";
  currentWeight: number;
  targetWeight: number;
  delta: number;
  reason: string;
  estimatedCost: number;  // in bps
  riskReduction: number;  // estimated CVaR reduction
}

export interface MultiDimRebalanceResult {
  currencyActions: RebalanceAction[];
  custodyActions: RebalanceAction[];
  jurisdictionActions: RebalanceAction[];
  totalActions: number;
  estimatedTotalCost: number;
  estimatedNetRiskReduction: number;
  maxSeverity: "LEVEL1" | "LEVEL2" | "LEVEL3" | "LEVEL4" | "LEVEL5";
  approvalRequired: boolean;
  explainability: string[];
  timestamp: string;
}

export function computeMultiDimRebalance(
  input: MultiDimRebalanceInput,
): MultiDimRebalanceResult {
  const currencyActions: RebalanceAction[] = [];
  const custodyActions: RebalanceAction[] = [];
  const jurisdictionActions: RebalanceAction[] = [];
  const explainability: string[] = [];

  // ---- 1. Currency dimension ----
  for (const [ccy, currentW] of Object.entries(input.currentCurrencyWeights)) {
    const targetW = input.targetCurrencyWeights[ccy] ?? 0;
    const delta = targetW - currentW;

    if (Math.abs(delta) > input.rebalanceThreshold) {
      const action: RebalanceAction = {
        dimension: "currency",
        asset: ccy,
        action: delta > 0 ? "increase" : (targetW === 0 ? "exit" : "decrease"),
        currentWeight: currentW,
        targetWeight: targetW,
        delta,
        reason: `Weight drift: ${ccy} ${(currentW * 100).toFixed(2)}% → ${(targetW * 100).toFixed(2)}% (Δ=${(delta * 100).toFixed(2)}%)`,
        estimatedCost: Math.abs(delta) * 700, // ~7 bps per 1% adjustment
        riskReduction: Math.abs(delta) * 0.002,
      };
      currencyActions.push(action);

      explainability.push(
        `${ccy} ${action.action}: ${(currentW * 100).toFixed(2)}% → ${(targetW * 100).toFixed(2)}% | ` +
        `Δ=${(delta * 100).toFixed(2)}% | Cost=${action.estimatedCost.toFixed(0)}bps | ` +
        `Risk reduction=${(action.riskReduction * 100).toFixed(2)}%`
      );
    }
  }

  // ---- 2. Custodian dimension ----
  const custodianTotals: Record<string, number> = {};
  for (const alloc of input.currentCustodyAllocations) {
    custodianTotals[alloc.custodian] = (custodianTotals[alloc.custodian] || 0) + alloc.weight;
  }

  for (const [custodian, total] of Object.entries(custodianTotals)) {
    if (total > input.targetMaxCustodianPct) {
      const target = input.targetMaxCustodianPct;
      custodyActions.push({
        dimension: "custodian",
        asset: custodian,
        action: "decrease",
        currentWeight: total,
        targetWeight: target,
        delta: target - total,
        reason: `Custodian concentration: ${custodian} at ${(total * 100).toFixed(1)}% > ${(input.targetMaxCustodianPct * 100).toFixed(1)}% cap`,
        estimatedCost: Math.abs(target - total) * 500,
        riskReduction: Math.abs(target - total) * 0.003,
      });
      explainability.push(
        `Custodian ${custodian}: ${(total * 100).toFixed(1)}% → ${(target * 100).toFixed(1)}% | ` +
        `Concentration risk reduction`
      );
    }
  }

  // ---- 3. Jurisdiction dimension ----
  const jurisdictionTotals: Record<string, number> = {};
  for (const alloc of input.currentCustodyAllocations) {
    jurisdictionTotals[alloc.jurisdiction] = (jurisdictionTotals[alloc.jurisdiction] || 0) + alloc.weight;
  }

  for (const [juris, total] of Object.entries(jurisdictionTotals)) {
    if (total > input.targetMaxJurisdictionPct) {
      jurisdictionActions.push({
        dimension: "jurisdiction",
        asset: juris,
        action: "decrease",
        currentWeight: total,
        targetWeight: input.targetMaxJurisdictionPct,
        delta: input.targetMaxJurisdictionPct - total,
        reason: `Jurisdiction concentration: ${juris} at ${(total * 100).toFixed(1)}% > ${(input.targetMaxJurisdictionPct * 100).toFixed(1)}% cap`,
        estimatedCost: Math.abs(input.targetMaxJurisdictionPct - total) * 400,
        riskReduction: Math.abs(input.targetMaxJurisdictionPct - total) * 0.002,
      });
      explainability.push(
        `Jurisdiction ${juris}: ${(total * 100).toFixed(1)}% → ${(input.targetMaxJurisdictionPct * 100).toFixed(1)}% | ` +
        `Geographic risk reduction`
      );
    }
  }

  // ---- Severity classification ----
  const hasExit = currencyActions.some(a => a.action === "exit");
  const hasSuspend = currencyActions.some(a => a.action === "exit" && a.reason.includes("fundamental"));
  const maxSeverity = hasSuspend ? "LEVEL5" : hasExit ? "LEVEL4" :
    custodyActions.length > 0 || jurisdictionActions.length > 0 ? "LEVEL2" :
    currencyActions.length > 0 ? "LEVEL1" : "LEVEL1";

  const allActions = [...currencyActions, ...custodyActions, ...jurisdictionActions];
  const estimatedTotalCost = allActions.reduce((s, a) => s + a.estimatedCost, 0);
  const estimatedNetRiskReduction = allActions.reduce((s, a) => s + a.riskReduction, 0);

  return {
    currencyActions,
    custodyActions,
    jurisdictionActions,
    totalActions: allActions.length,
    estimatedTotalCost: Math.round(estimatedTotalCost * 10) / 10,
    estimatedNetRiskReduction: Math.round(estimatedNetRiskReduction * 1e6) / 1e6,
    maxSeverity: maxSeverity as "LEVEL1" | "LEVEL2" | "LEVEL3" | "LEVEL4" | "LEVEL5",
    approvalRequired: maxSeverity !== "LEVEL1",
    explainability,
    timestamp: new Date().toISOString(),
  };
}

// ---- Stress-Aware Target Portfolio (§23) ----

export interface StressAwareTargetInput {
  wNormal: Record<string, number>;   // normal-state target weights
  wStress: Record<string, number>;   // stress-state target weights
  lambda: number;                     // 0-1, default 0.70
}

export function computeStressAwareTarget(
  input: StressAwareTargetInput,
): Record<string, number> {
  const lambda = input.lambda ?? 0.70;
  const result: Record<string, number> = {};

  const allCurrencies = new Set([...Object.keys(input.wNormal), ...Object.keys(input.wStress)]);

  for (const ccy of allCurrencies) {
    const wN = input.wNormal[ccy] ?? 0;
    const wS = input.wStress[ccy] ?? 0;
    result[ccy] = lambda * wN + (1 - lambda) * wS;
  }

  // Normalize to sum to 1
  const total = Object.values(result).reduce((s, w) => s + w, 0);
  if (total > 0) {
    for (const ccy of Object.keys(result)) {
      result[ccy] = Math.round((result[ccy] / total) * 1e8) / 1e8;
    }
  }

  return result;
}

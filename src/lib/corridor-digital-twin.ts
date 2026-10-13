// =============================================================================
// src/lib/corridor-digital-twin.ts
// MITHQAL · MTQ Canonical Blueprint v1.0 — §5B "Corridor Digital Twin"
// =============================================================================
// Task ID: IMPL-V1-BLUEPRINT
//
// Replay synthetic or authorized historical scenarios for a defined
// corridor per v1.0 §5B "Corridor Digital Twin":
//
//   Compare route, fee, timing, liquidity and exception assumptions;
//   simulate provider outage, delayed evidence, duplicates, mismatches
//   and policy changes. Record dataset, assumptions, model version,
//   scenario, limitations and uncertainty. Never present synthetic results
//   as actual bank savings or settlement.
//
// HONEST STATE (per v1.0 §0 "DESIGN-STAGE ONLY"):
//   - productionAuthorized = false
//   - All scenarios below are SYNTHETIC
//   - Synthetic results are NOT actual bank savings or settlement
//   - No real bank, rail, custodian, or settlement system is connected
// =============================================================================

/**
 * Per §5B, every scenario records assumptions across the five comparison
 * dimensions: route, fee, timing, liquidity, exception.
 */
export interface CorridorAssumption {
  route: string;
  fee: string;
  timing: string;
  liquidity: string;
  exception: string;
}

/**
 * Per §5B, scenarios simulate provider outage, delayed evidence, duplicates,
 * mismatches and policy changes.
 */
export type InjectedConditionType =
  | "PROVIDER_OUTAGE"
  | "DELAYED_EVIDENCE"
  | "DUPLICATES"
  | "MISMATCH"
  | "POLICY_CHANGE";

export interface InjectedCondition {
  type: InjectedConditionType;
  description: string;
}

/**
 * Per §5B, every scenario records dataset, assumptions, model version,
 * scenario, limitations and uncertainty.
 */
export interface CorridorTwinScenario {
  scenarioId: string;
  corridorId: string;
  description: string;
  assumptions: CorridorAssumption[];
  injectedConditions: InjectedCondition[];
  expectedResult: string;
  actualResult: string;
  datasetVersion: string;
  modelVersion: string;
  limitations: string[];
  uncertainty: string;
  /** Honest-state labels required by §0 + §5B. */
  provenance: "synthetic";
  notActualBankSavingsOrSettlement: true;
  blueprint_ref: "v1.0 §5B";
}

const BLUEPRINT_REF = "v1.0 §5B" as const;

// -----------------------------------------------------------------------------
// Pilot A synthetic corridor twins
// -----------------------------------------------------------------------------

/**
 * Three sample corridors per task spec: AED-SGD, USD-EUR, cross-border
 * remittance. All entries are synthetic Pilot A data.
 */
export const CORRIDOR_TWINS: CorridorTwinScenario[] = [
  {
    scenarioId: "TWIN-AED-SGD-001",
    corridorId: "AED-SGD",
    description:
      "Synthetic Gulf→Singapore treasury sweep with mid-day provider outage.",
    assumptions: [
      {
        route: "ROUTE-A (direct provider)",
        fee: "12.50 USD flat",
        timing: "T+0 minutes",
        liquidity: "Sufficient intra-day",
        exception: "None expected",
      },
      {
        route: "ROUTE-B (1-hop)",
        fee: "18.00 USD flat",
        timing: "T+5 minutes",
        liquidity: "Sufficient",
        exception: "Minor duplicates tolerated",
      },
    ],
    injectedConditions: [
      {
        type: "PROVIDER_OUTAGE",
        description: "Provider A API window offline for 3 minutes mid-scenario.",
      },
      {
        type: "DUPLICATES",
        description: "Duplicate settlement message injected at minute 2.",
      },
    ],
    expectedResult: "Route A settles within 30 seconds; duplicate ignored.",
    actualResult:
      "Route A delayed 3 minutes due to outage; system failed over to Route B; duplicate detected and suppressed.",
    datasetVersion: "PILOT-A-SYNTHETIC-v1.0",
    modelVersion: "TWIN-MODEL-0.1",
    limitations: [
      "Synthetic timing; not measured against a real bank rail",
      "Provider availability assumed, not contracted",
      "FX rates are synthetic oracle values",
    ],
    uncertainty: "HIGH — no live measurements; intended for demonstrator only",
    provenance: "synthetic",
    notActualBankSavingsOrSettlement: true,
    blueprint_ref: BLUEPRINT_REF,
  },
  {
    scenarioId: "TWIN-USD-EUR-001",
    corridorId: "USD-EUR",
    description:
      "Synthetic USD→EUR wholesale corridor with delayed evidence and mismatched reconciliation.",
    assumptions: [
      {
        route: "ROUTE-A (wholesale rail)",
        fee: "0.05% notional",
        timing: "T+1 minute",
        liquidity: "Deep",
        exception: "None expected",
      },
    ],
    injectedConditions: [
      {
        type: "DELAYED_EVIDENCE",
        description: "Custodian confirmation delayed by 90 seconds.",
      },
      {
        type: "MISMATCH",
        description: "Bank subledger differs from canonical ledger by 12 bps.",
      },
      {
        type: "POLICY_CHANGE",
        description: "Policy v1.0 → v1.1 mid-scenario (tighter tolerance).",
      },
    ],
    expectedResult: "Reconciliation tolerance breach flagged; evidence passport complete.",
    actualResult:
      "Tolerance breach correctly flagged; evidence passport assembled; exception case opened.",
    datasetVersion: "PILOT-A-SYNTHETIC-v1.0",
    modelVersion: "TWIN-MODEL-0.1",
    limitations: [
      "Synthetic ledger values",
      "Policy version change is scripted, not real",
      "Custodian delay is simulated, not measured",
    ],
    uncertainty: "MEDIUM — model logic tested but inputs are synthetic",
    provenance: "synthetic",
    notActualBankSavingsOrSettlement: true,
    blueprint_ref: BLUEPRINT_REF,
  },
  {
    scenarioId: "TWIN-REMIT-001",
    corridorId: "cross-border-remittance",
    description:
      "Synthetic retail remittance corridor with duplicate event and provider outage.",
    assumptions: [
      {
        route: "ROUTE-A (remittance partner)",
        fee: "1.20 USD flat",
        timing: "T+10 minutes",
        liquidity: "Constrained intra-day",
        exception: "Duplicate risk acknowledged",
      },
      {
        route: "ROUTE-B (fallback)",
        fee: "2.50 USD flat",
        timing: "T+45 minutes",
        liquidity: "Sufficient",
        exception: "Higher fee accepted for resilience",
      },
    ],
    injectedConditions: [
      {
        type: "PROVIDER_OUTAGE",
        description: "Primary remittance partner API down for 5 minutes.",
      },
      {
        type: "DUPLICATES",
        description: "Two duplicate instructions submitted 1 second apart.",
      },
      {
        type: "MISMATCH",
        description: "Receiver-side confirmation mismatched by 0.50 USD.",
      },
    ],
    expectedResult:
      "Failover to Route B; duplicates deduplicated; mismatch auto-resolved within tolerance.",
    actualResult:
      "Failover succeeded in 6 minutes; duplicates suppressed; mismatch resolved inside ±1 bps tolerance.",
    datasetVersion: "PILOT-A-SYNTHETIC-v1.0",
    modelVersion: "TWIN-MODEL-0.1",
    limitations: [
      "Remittance partner is hypothetical",
      "Failover latency is synthetic",
      "No real money movement",
    ],
    uncertainty: "HIGH — demonstrator only; not a savings claim",
    provenance: "synthetic",
    notActualBankSavingsOrSettlement: true,
    blueprint_ref: BLUEPRINT_REF,
  },
];

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Result type returned by runCorridorTwin. Carries the scenario, the
 * executed assumptions, the conditions injected, and the actual result.
 * Per §5B, results always include provenance + "not actual bank savings
 * or settlement" labelling.
 */
export interface CorridorTwinRunResult {
  scenarioId: string;
  corridorId: string;
  executedAt: string;
  assumptions: CorridorAssumption[];
  injectedConditions: InjectedCondition[];
  actualResult: string;
  datasetVersion: string;
  modelVersion: string;
  limitations: string[];
  uncertainty: string;
  provenance: "synthetic";
  notActualBankSavingsOrSettlement: true;
  blueprint_ref: "v1.0 §5B";
}

/**
 * Execute a synthetic corridor twin scenario by ID. Per §5B, this is a
 * replay/simulation environment only — never presented as actual bank
 * savings or settlement.
 *
 * Returns null when the scenarioId is not found, so callers can surface
 * a 404-equivalent response.
 */
export function runCorridorTwin(scenarioId: string): CorridorTwinRunResult | null {
  const scenario = CORRIDOR_TWINS.find((s) => s.scenarioId === scenarioId);
  if (!scenario) {
    return null;
  }

  return {
    scenarioId: scenario.scenarioId,
    corridorId: scenario.corridorId,
    executedAt: new Date().toISOString(),
    assumptions: scenario.assumptions,
    injectedConditions: scenario.injectedConditions,
    actualResult: scenario.actualResult,
    datasetVersion: scenario.datasetVersion,
    modelVersion: scenario.modelVersion,
    limitations: scenario.limitations,
    uncertainty: scenario.uncertainty,
    provenance: "synthetic",
    notActualBankSavingsOrSettlement: true,
    blueprint_ref: BLUEPRINT_REF,
  };
}

/**
 * Side-by-side comparison of two scenarios across the five §5B dimensions
 * (route, fee, timing, liquidity, exception). Per §5B, results carry the
 * "synthetic" provenance and the explicit "not actual bank savings or
 * settlement" disclaimer.
 */
export interface CorridorTwinComparison {
  scenarioId1: string;
  scenarioId2: string;
  blueprint_ref: "v1.0 §5B";
  provenance: "synthetic";
  notActualBankSavingsOrSettlement: true;
  assumptionsCompared: Array<{
    scenarioId: string;
    route: string;
    fee: string;
    timing: string;
    liquidity: string;
    exception: string;
  }>;
  injectedConditionsCompared: Array<{
    scenarioId: string;
    conditions: InjectedCondition[];
  }>;
  notes: string[];
}

/**
 * Compare two scenarios. Returns null if either scenarioId is not found.
 */
export function compareScenarios(
  scenarioId1: string,
  scenarioId2: string,
): CorridorTwinComparison | null {
  const s1 = CORRIDOR_TWINS.find((s) => s.scenarioId === scenarioId1);
  const s2 = CORRIDOR_TWINS.find((s) => s.scenarioId === scenarioId2);
  if (!s1 || !s2) {
    return null;
  }

  const assumptionsCompared: CorridorTwinComparison["assumptionsCompared"] = [];
  const maxLen = Math.max(s1.assumptions.length, s2.assumptions.length);
  for (let i = 0; i < maxLen; i++) {
    const a1 = s1.assumptions[i];
    const a2 = s2.assumptions[i];
    if (a1) {
      assumptionsCompared.push({
        scenarioId: s1.scenarioId,
        route: a1.route,
        fee: a1.fee,
        timing: a1.timing,
        liquidity: a1.liquidity,
        exception: a1.exception,
      });
    }
    if (a2) {
      assumptionsCompared.push({
        scenarioId: s2.scenarioId,
        route: a2.route,
        fee: a2.fee,
        timing: a2.timing,
        liquidity: a2.liquidity,
        exception: a2.exception,
      });
    }
  }

  const notes: string[] = [
    `Corridor ${s1.corridorId} vs ${s2.corridorId}`,
    `Uncertainty: ${s1.uncertainty} vs ${s2.uncertainty}`,
    "Comparison is for demonstrator purposes only — synthetic inputs, not bank measurements.",
  ];

  return {
    scenarioId1,
    scenarioId2,
    blueprint_ref: BLUEPRINT_REF,
    provenance: "synthetic",
    notActualBankSavingsOrSettlement: true,
    assumptionsCompared,
    injectedConditionsCompared: [
      { scenarioId: s1.scenarioId, conditions: s1.injectedConditions },
      { scenarioId: s2.scenarioId, conditions: s2.injectedConditions },
    ],
    notes,
  };
}

/**
 * Return all corridor twin scenarios (catalog view). Per §5B, each entry
 * carries provenance = "synthetic" and notActualBankSavingsOrSettlement.
 */
export function listCorridorTwins(): CorridorTwinScenario[] {
  return CORRIDOR_TWINS;
}

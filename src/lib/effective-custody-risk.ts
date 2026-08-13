// v24.1.2 Layer 1 — Effective Custody Risk Model
// =================================================================
// Replaces the raw 15% custody cap with a richer model:
//
//   EffectiveCustodyRisk = Exposure × LGD × CommonMode × (1 - RecoveryFactor)
//
// This does NOT claim "zero commercial default risk."
// Instead it models:
//   - Exposure: % of reserves held at this custodian
//   - LGD: Loss Given Default (0-1, never 0 — residual risk always exists)
//   - CommonMode: common-mode dependency factor (0-1)
//   - RecoveryFactor: expected recovery from insurance/legal (0-1)
//
// Direct/segregated institutional custody is designed to MINIMIZE
// commercial intermediary credit exposure, but residual legal,
// operational, and access risks remain separately modeled.
// =================================================================

export interface CustodyPosition {
  custodian: string;
  jurisdiction: string;
  exposure: number;        // fraction of total reserve (0-1)
  lgd: number;             // Loss Given Default (0-1, never 0)
  commonModeGroupId: string;
  recoveryFactor: number;  // expected recovery from insurance/legal (0-1)
  isDirectSovereign: boolean; // direct central-bank / sovereign custody
  isSegregated: boolean;   // bankruptcy-remote segregation
}

export interface EffectiveCustodyResult {
  custodian: string;
  jurisdiction: string;
  exposure: number;
  lgd: number;
  commonModeFactor: number;
  recoveryFactor: number;
  effectiveRisk: number;   // Exposure × LGD × CommonMode × (1-Recovery)
  isDirectSovereign: boolean;
  isSegregated: boolean;
  riskRating: "LOW" | "MODERATE" | "ELEVATED" | "HIGH";
}

export interface CustodyReport {
  positions: EffectiveCustodyResult[];
  totalEffectiveRisk: number;
  maxEffectiveRisk: number;
  commonModeGroups: { groupId: string; totalExposure: number; custodians: string[] }[];
  jurisdictionConcentration: Record<string, number>;
  hardCapCompliance: boolean;       // all ≤ 15%
  sovereignExposure: number;        // 0-50% conditional
  sovereignConditional: boolean;    // true = subject to legal availability
  recommendations: string[];
  timestamp: string;
}

const HARD_CAP = 0.15; // 15% hard cap per custodian
const SOVEREIGN_MAX = 0.50; // 0 ≤ CBExposure ≤ 50% conditional

export function computeEffectiveCustodyRisk(positions: CustodyPosition[]): CustodyReport {
  // Compute common-mode group exposures
  const groupMap: Record<string, { totalExposure: number; custodians: string[] }> = {};
  for (const p of positions) {
    if (!groupMap[p.commonModeGroupId]) {
      groupMap[p.commonModeGroupId] = { totalExposure: 0, custodians: [] };
    }
    groupMap[p.commonModeGroupId].totalExposure += p.exposure;
    groupMap[p.commonModeGroupId].custodians.push(p.custodian);
  }

  // Compute jurisdiction concentration
  const jurisdictionConc: Record<string, number> = {};
  for (const p of positions) {
    jurisdictionConc[p.jurisdiction] = (jurisdictionConc[p.jurisdiction] || 0) + p.exposure;
  }

  // Compute effective risk per custodian
  const results: EffectiveCustodyResult[] = [];
  let totalEffectiveRisk = 0;
  let maxEffectiveRisk = 0;
  let sovereignExposure = 0;

  for (const p of positions) {
    // Common-mode factor: if group exposure > 15%, increase common-mode factor
    const groupExposure = groupMap[p.commonModeGroupId].totalExposure;
    const commonModeFactor = groupExposure > HARD_CAP
      ? Math.min(1.0, groupExposure / HARD_CAP * 0.5)
      : 0.1; // 10% common-mode baseline

    const effectiveRisk = p.exposure * p.lgd * commonModeFactor * (1 - p.recoveryFactor);

    let riskRating: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" = "LOW";
    if (effectiveRisk > 0.03) riskRating = "HIGH";
    else if (effectiveRisk > 0.01) riskRating = "ELEVATED";
    else if (effectiveRisk > 0.003) riskRating = "MODERATE";

    results.push({
      custodian: p.custodian,
      jurisdiction: p.jurisdiction,
      exposure: p.exposure,
      lgd: p.lgd,
      commonModeFactor,
      recoveryFactor: p.recoveryFactor,
      effectiveRisk: Math.round(effectiveRisk * 1e8) / 1e8,
      isDirectSovereign: p.isDirectSovereign,
      isSegregated: p.isSegregated,
      riskRating,
    });

    totalEffectiveRisk += effectiveRisk;
    maxEffectiveRisk = Math.max(maxEffectiveRisk, effectiveRisk);

    if (p.isDirectSovereign) {
      sovereignExposure += p.exposure;
    }
  }

  // Check hard cap compliance
  const hardCapCompliance = results.every(r => r.exposure <= HARD_CAP + 1e-9);

  // Generate recommendations
  const recommendations: string[] = [];
  if (!hardCapCompliance) {
    const violators = results.filter(r => r.exposure > HARD_CAP);
    recommendations.push(`Reduce ${violators.map(v => v.custodian).join(", ")} to ≤15% hard cap`);
  }
  if (sovereignExposure > SOVEREIGN_MAX) {
    recommendations.push(`Sovereign exposure ${(sovereignExposure * 100).toFixed(1)}% > ${(SOVEREIGN_MAX * 100).toFixed(0)}% conditional max — verify legal availability`);
  }
  for (const [groupId, group] of Object.entries(groupMap)) {
    if (group.totalExposure > 0.20 && group.custodians.length > 1) {
      recommendations.push(`Common-mode group ${groupId}: ${(group.totalExposure * 100).toFixed(1)}% across ${group.custodians.join(", ")} — reduce common-mode dependency`);
    }
  }
  for (const [juris, conc] of Object.entries(jurisdictionConc)) {
    if (conc > 0.30) {
      recommendations.push(`Jurisdiction ${juris}: ${(conc * 100).toFixed(1)}% > 30% — diversify jurisdictions`);
    }
  }
  if (recommendations.length === 0) {
    recommendations.push("Custody architecture compliant — no actions needed");
  }

  return {
    positions: results.sort((a, b) => b.effectiveRisk - a.effectiveRisk),
    totalEffectiveRisk: Math.round(totalEffectiveRisk * 1e8) / 1e8,
    maxEffectiveRisk: Math.round(maxEffectiveRisk * 1e8) / 1e8,
    commonModeGroups: Object.entries(groupMap).map(([groupId, g]) => ({
      groupId,
      totalExposure: Math.round(g.totalExposure * 1e6) / 1e6,
      custodians: g.custodians,
    })),
    jurisdictionConcentration: Object.fromEntries(
      Object.entries(jurisdictionConc).map(([k, v]) => [k, Math.round(v * 1e6) / 1e6]),
    ),
    hardCapCompliance,
    sovereignExposure: Math.round(sovereignExposure * 1e6) / 1e6,
    sovereignConditional: true, // always conditional on legal availability
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Default custody positions for v24.1.2.
 * 15% hard cap per custodian, with effective custody risk modeling.
 * Sovereign/direct custody is conditional (0 ≤ CBExposure ≤ 50%).
 */
export function getDefaultCustodyPositions(): CustodyPosition[] {
  return [
    {
      custodian: "Custodian-A (Institutional Bank)",
      jurisdiction: "US",
      exposure: 0.15,
      lgd: 0.45,  // 45% LGD — never 0
      commonModeGroupId: "group-us-1",
      recoveryFactor: 0.30,
      isDirectSovereign: false,
      isSegregated: true,
    },
    {
      custodian: "Custodian-B (Swiss Vault)",
      jurisdiction: "CH",
      exposure: 0.15,
      lgd: 0.25,
      commonModeGroupId: "group-ch-1",
      recoveryFactor: 0.40,
      isDirectSovereign: false,
      isSegregated: true,
    },
    {
      custodian: "Custodian-C (UK Bank)",
      jurisdiction: "GB",
      exposure: 0.15,
      lgd: 0.40,
      commonModeGroupId: "group-gb-1",
      recoveryFactor: 0.35,
      isDirectSovereign: false,
      isSegregated: true,
    },
    {
      custodian: "Custodian-D (SG Bank)",
      jurisdiction: "SG",
      exposure: 0.15,
      lgd: 0.35,
      commonModeGroupId: "group-sg-1",
      recoveryFactor: 0.35,
      isDirectSovereign: false,
      isSegregated: true,
    },
    {
      custodian: "Custodian-E (UAE Bank)",
      jurisdiction: "AE",
      exposure: 0.15,
      lgd: 0.30,
      commonModeGroupId: "group-ae-1",
      recoveryFactor: 0.40,
      isDirectSovereign: false,
      isSegregated: true,
    },
    {
      custodian: "Direct Sovereign (conditional)",
      jurisdiction: "MULTI",
      exposure: 0.15,  // 15% initially — 0 ≤ CB ≤ 50% conditional
      lgd: 0.10,  // lower LGD for sovereign — but NOT 0
      commonModeGroupId: "group-sov-1",
      recoveryFactor: 0.60,
      isDirectSovereign: true,
      isSegregated: true,
    },
    {
      custodian: "Custodian-G (Bullion Vault)",
      jurisdiction: "CH",
      exposure: 0.10,
      lgd: 0.20,
      commonModeGroupId: "group-ch-1", // shares with Custodian-B
      recoveryFactor: 0.50,
      isDirectSovereign: false,
      isSegregated: true,
    },
  ];
}

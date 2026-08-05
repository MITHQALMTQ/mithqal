/**
 * MITHQAL Constitutional Multi-Custodian Architecture
 *
 * Chapter XX §XX.16 — Multi-Custodian Diversification Doctrine
 *
 * Replaces the single-custodian model with a diversified multi-custodian
 * architecture. No single custodian may hold more than 25% of total reserves;
 * no single jurisdiction more than 30%; minimum 3 active custodians.
 *
 * The engine:
 *   1. Evaluates custodian health (composite of rating, utilisation, insurance)
 *   2. Computes the target allocation across custodians (proportional to
 *      capacity × health, clamped to constitutional limits)
 *   3. Simulates a single-custodian failure and redistributes the exposure
 *      to surviving custodians (a key risk-management stress test)
 *
 * All USD values. All percentages in decimal (0.25 = 25%).
 */

// ============================================================
// §XX.16.1 — Custodian types & constitutional limits
// ============================================================

export interface Custodian {
  id: string;
  name: string;
  type: "bank" | "vault" | "trust";
  jurisdiction: string;
  healthScore: number;            // 0-100
  maxCapacity: number;            // Max USD capacity
  currentExposure: number;        // Current USD held
  concentrationPct: number;       // Current % of total
  insuranceCoverage: number;      // USD insured
  rating: string;                 // e.g. "AA+"
  status: "active" | "backup" | "emergency";
}

export interface CustodianAllocation {
  custodianId: string;
  allocationPct: number;          // Target allocation %
  currentPct: number;             // Current allocation %
  deviation: number;              // Current - target
  action: "rebalance" | "hold" | "increase" | "decrease";
}

export const CUSTODIAN_LIMITS = {
  maxSingleCustodian: 0.25,       // 25% max per custodian
  maxSingleJurisdiction: 0.30,    // 30% max per jurisdiction
  maxSingleVault: 0.30,           // 30% max per vault
  minCustodians: 3,               // Minimum 3 custodians
  rebalanceThreshold: 0.05,       // 5% deviation triggers review
} as const;

/**
 * §XX.16.1 Mapping from S&P-style rating to a 0-1 numeric strength score.
 * Used by `evaluateCustodianHealth` to weight rating in the composite score.
 */
export const RATING_STRENGTH: Record<string, number> = {
  "AAA": 1.00,
  "AA+": 0.95,
  "AA":  0.92,
  "AA-": 0.89,
  "A+":  0.85,
  "A":   0.82,
  "A-":  0.78,
  "BBB+":0.72,
  "BBB": 0.68,
  "BBB-":0.64,
  "BB+": 0.55,
  "BB":  0.50,
  "BB-": 0.45,
  "CCC": 0.30,
  "CC":  0.20,
  "C":   0.10,
  "D":   0.00,
};

// ============================================================
// §XX.16.2 — Health evaluation
// ============================================================

export interface CustodianHealthResult {
  healthy: boolean;
  alerts: string[];
  /** Per-custodian breakdown (audit / UI). */
  perCustodian: {
    id: string;
    name: string;
    compositeScore: number;       // 0-100
    utilisation: number;          // currentExposure / maxCapacity (0-1)
    insuranceCoverageRatio: number; // insurance / exposure (0-1+)
    ratingStrength: number;       // 0-1
    status: Custodian["status"];
    alerts: string[];
  }[];
  /** Aggregate diversification metrics. */
  diversification: {
    activeCount: number;
    jurisdictionCount: number;
    maxCustodianPct: number;      // largest single-custodian concentration
    maxJurisdictionPct: number;   // largest single-jurisdiction concentration
    herfindahlIndex: number;      // 0-1; 1 = single custodian; 0 = perfectly diversified
  };
}

/**
 * §XX.16.2 Evaluate the health of the entire custodian fleet.
 *
 * Composite score per custodian:
 *   40% rating strength (S&P-style mapping)
 *   25% utilisation headroom (lower utilisation = healthier)
 *   20% insurance coverage ratio (insurance / exposure)
 *   15% status bonus (active = 100; backup = 70; emergency = 30)
 *
 * A custodian is "unhealthy" if compositeScore < 60 OR utilisation > 0.95
 * OR insurance coverage < 0.80.
 *
 * The fleet is "healthy" if:
 *   - Active count ≥ 3 (constitutional minimum)
 *   - No custodian > 25% concentration
 *   - No jurisdiction > 30% concentration
 *   - No custodian flagged unhealthy
 */
export function evaluateCustodianHealth(
  custodians: Custodian[],
): CustodianHealthResult {
  const alerts: string[] = [];
  const perCustodian: CustodianHealthResult["perCustodian"] = [];

  const totalExposure = custodians.reduce((s, c) => s + c.currentExposure, 0);

  // Aggregate by jurisdiction
  const byJurisdiction = new Map<string, number>();
  for (const c of custodians) {
    byJurisdiction.set(
      c.jurisdiction,
      (byJurisdiction.get(c.jurisdiction) ?? 0) + c.currentExposure,
    );
  }

  for (const c of custodians) {
    const cAlerts: string[] = [];
    const utilisation = c.maxCapacity > 0 ? c.currentExposure / c.maxCapacity : 1;
    const insuranceRatio = c.currentExposure > 0
      ? c.insuranceCoverage / c.currentExposure
      : 1;
    const ratingStrength = RATING_STRENGTH[c.rating] ?? 0.5;
    const statusBonus = c.status === "active" ? 1.0
      : c.status === "backup" ? 0.70
      : 0.30;

    const composite =
      ratingStrength * 0.40 +
      (1 - Math.min(1, utilisation)) * 0.25 +
      Math.min(1, insuranceRatio) * 0.20 +
      statusBonus * 0.15;

    const compositeScore = Math.round(composite * 100);

    // Health flags
    if (compositeScore < 60) {
      cAlerts.push(`composite score ${compositeScore} < 60`);
    }
    if (utilisation > 0.95) {
      cAlerts.push(`utilisation ${(utilisation * 100).toFixed(1)}% > 95% (capacity breach imminent)`);
    }
    if (insuranceRatio < 0.80) {
      cAlerts.push(`insurance coverage ${(insuranceRatio * 100).toFixed(1)}% < 80% (under-insured)`);
    }
    if (c.concentrationPct > CUSTODIAN_LIMITS.maxSingleCustodian) {
      cAlerts.push(
        `concentration ${(c.concentrationPct * 100).toFixed(1)}% > ${CUSTODIAN_LIMITS.maxSingleCustodian * 100}% cap`,
      );
    }

    perCustodian.push({
      id: c.id,
      name: c.name,
      compositeScore,
      utilisation,
      insuranceCoverageRatio: insuranceRatio,
      ratingStrength,
      status: c.status,
      alerts: cAlerts,
    });
    alerts.push(...cAlerts.map((a) => `[${c.name}] ${a}`));
  }

  // Fleet-level checks
  const activeCount = custodians.filter((c) => c.status === "active").length;
  if (activeCount < CUSTODIAN_LIMITS.minCustodians) {
    alerts.push(
      `Active custodian count ${activeCount} < constitutional minimum ${CUSTODIAN_LIMITS.minCustodians}`,
    );
  }

  let maxCustodianPct = 0;
  for (const c of custodians) {
    maxCustodianPct = Math.max(maxCustodianPct, c.concentrationPct);
  }
  if (maxCustodianPct > CUSTODIAN_LIMITS.maxSingleCustodian) {
    alerts.push(
      `Max single-custodian concentration ${(maxCustodianPct * 100).toFixed(1)}% > ${CUSTODIAN_LIMITS.maxSingleCustodian * 100}% cap`,
    );
  }

  let maxJurisdictionPct = 0;
  for (const [juris, expo] of byJurisdiction) {
    const pct = totalExposure > 0 ? expo / totalExposure : 0;
    if (pct > maxJurisdictionPct) maxJurisdictionPct = pct;
    if (pct > CUSTODIAN_LIMITS.maxSingleJurisdiction) {
      alerts.push(
        `Jurisdiction ${juris} concentration ${(pct * 100).toFixed(1)}% > ${CUSTODIAN_LIMITS.maxSingleJurisdiction * 100}% cap`,
      );
    }
  }

  // Herfindahl-Hirschman Index (concentration measure)
  let hhi = 0;
  for (const c of custodians) {
    if (totalExposure > 0) {
      const share = c.currentExposure / totalExposure;
      hhi += share * share;
    }
  }

  return {
    healthy: alerts.length === 0,
    alerts,
    perCustodian,
    diversification: {
      activeCount,
      jurisdictionCount: byJurisdiction.size,
      maxCustodianPct,
      maxJurisdictionPct,
      herfindahlIndex: hhi,
    },
  };
}

// ============================================================
// §XX.16.3 — Target allocation computation
// ============================================================

/**
 * §XX.16.3 Compute the target allocation across custodians.
 *
 * Algorithm:
 *   1. Filter to active custodians (backup/emergency excluded from target).
 *   2. Compute raw weight = health × available_capacity.
 *   3. Clamp each weight to 25% of total (constitutional cap).
 *   4. Redistribute excess weight to remaining custodians (waterfill).
 *   5. Enforce jurisdiction cap (30%) similarly.
 *   6. Compute deviation from current and recommend action.
 *
 * @param totalReserves    Total reserve value in USD.
 * @param custodians       Available custodians.
 * @returns                Per-custodian allocation + action.
 */
export function computeCustodianAllocation(
  totalReserves: number,
  custodians: Custodian[],
): CustodianAllocation[] {
  if (totalReserves <= 0) {
    throw new Error("totalReserves must be > 0");
  }
  if (custodians.length === 0) {
    throw new Error("At least one custodian is required");
  }

  // Only active custodians count for target allocation
  const active = custodians.filter((c) => c.status === "active");
  if (active.length < CUSTODIAN_LIMITS.minCustodians) {
    throw new Error(
      `Constitutional minimum ${CUSTODIAN_LIMITS.minCustodians} active custodians required (got ${active.length})`,
    );
  }

  // ---- Step 1: raw weights (health × available capacity) ----
  const rawWeights = new Map<string, number>();
  for (const c of active) {
    const availableCapacity = Math.max(0, c.maxCapacity - c.currentExposure);
    const healthFactor = c.healthScore / 100;
    // Use sqrt(capacity) so smaller custodians aren't dominated
    rawWeights.set(c.id, healthFactor * Math.sqrt(availableCapacity + 1));
  }
  const totalRaw = Array.from(rawWeights.values()).reduce((s, v) => s + v, 0);

  // ---- Step 2: normalise to percentages ----
  let weights = new Map<string, number>();
  for (const [id, w] of rawWeights) {
    weights.set(id, totalRaw > 0 ? w / totalRaw : 1 / active.length);
  }

  // ---- Step 3: enforce per-custodian cap (waterfill redistribution) ----
  weights = enforceCap(weights, active, CUSTODIAN_LIMITS.maxSingleCustodian);

  // ---- Step 4: enforce per-jurisdiction cap ----
  weights = enforceJurisdictionCap(weights, active, CUSTODIAN_LIMITS.maxSingleJurisdiction);

  // ---- Step 5: compute deviation + action ----
  const allocations: CustodianAllocation[] = [];
  for (const c of custodians) {
    const targetPct = weights.get(c.id) ?? 0;
    const currentPct = totalReserves > 0 ? c.currentExposure / totalReserves : 0;
    const deviation = currentPct - targetPct;

    let action: CustodianAllocation["action"];
    if (targetPct === 0) {
      // Backup / emergency custodian — hold
      action = "hold";
    } else if (Math.abs(deviation) < CUSTODIAN_LIMITS.rebalanceThreshold) {
      action = "hold";
    } else if (deviation < 0) {
      action = "increase";
    } else {
      action = "decrease";
    }

    // If any active custodian needs a > 5% change, the whole fleet rebalances
    allocations.push({
      custodianId: c.id,
      allocationPct: targetPct,
      currentPct,
      deviation,
      action,
    });
  }

  // If any active needs rebalancing, flip all "hold" actions on active
  // custodians to "rebalance" to signal a coordinated fleet move
  const needsRebalance = allocations.some(
    (a) => Math.abs(a.deviation) >= CUSTODIAN_LIMITS.rebalanceThreshold,
  );
  if (needsRebalance) {
    for (const a of allocations) {
      const c = custodians.find((x) => x.id === a.custodianId);
      if (c && c.status === "active" && a.action === "hold") {
        a.action = "rebalance";
      }
    }
  }

  return allocations;
}

/**
 * Waterfill cap enforcement — iteratively clamp each weight to `cap` and
 * redistribute the excess to the remaining (under-cap) custodians.
 */
function enforceCap(
  weights: Map<string, number>,
  custodians: Custodian[],
  cap: number,
): Map<string, number> {
  const result = new Map(weights);
  // Iterate up to N times (converges quickly)
  for (let iter = 0; iter < custodians.length + 2; iter++) {
    let excess = 0;
    let remaining = 0;
    let totalUnder = 0;
    for (const [id, w] of result) {
      if (w > cap) {
        excess += w - cap;
        result.set(id, cap);
      } else {
        remaining += w;
      }
    }
    // Find remaining under-cap capacity
    for (const [id, w] of result) {
      if (w < cap) totalUnder += cap - w;
    }
    if (excess < 1e-9 || totalUnder < 1e-9) break;
    // Distribute excess proportionally to under-cap headroom
    for (const [id, w] of result) {
      if (w < cap) {
        const headroom = cap - w;
        result.set(id, w + excess * (headroom / totalUnder));
      }
    }
  }
  return result;
}

/**
 * Enforce jurisdiction cap — group custodians by jurisdiction, sum their
 * weights, and if a jurisdiction exceeds the cap, scale down all its
 * custodians proportionally and redistribute the excess to other
 * jurisdictions' custodians.
 */
function enforceJurisdictionCap(
  weights: Map<string, number>,
  custodians: Custodian[],
  cap: number,
): Map<string, number> {
  const result = new Map(weights);
  for (let iter = 0; iter < 5; iter++) {
    // Group by jurisdiction
    const byJuris = new Map<string, { ids: string[]; total: number }>();
    for (const c of custodians) {
      const w = result.get(c.id) ?? 0;
      const entry = byJuris.get(c.jurisdiction) ?? { ids: [], total: 0 };
      entry.ids.push(c.id);
      entry.total += w;
      byJuris.set(c.jurisdiction, entry);
    }
    let excess = 0;
    const overJuris: { juris: string; ids: string[]; scale: number }[] = [];
    for (const [juris, entry] of byJuris) {
      if (entry.total > cap) {
        const scale = cap / entry.total;
        excess += entry.total - cap;
        overJuris.push({ juris, ids: entry.ids, scale });
      }
    }
    if (excess < 1e-9) break;

    // Scale down over-cap jurisdictions
    for (const { ids, scale } of overJuris) {
      for (const id of ids) {
        result.set(id, (result.get(id) ?? 0) * scale);
      }
    }

    // Redistribute excess to under-cap jurisdictions' custodians
    const underCapCustodians: { id: string; headroom: number }[] = [];
    for (const [juris, entry] of byJuris) {
      if (entry.total < cap) {
        const headroom = cap - entry.total;
        // Distribute headroom proportionally to current weights within juris
        for (const id of entry.ids) {
          const w = result.get(id) ?? 0;
          const share = entry.total > 0 ? w / entry.total : 1 / entry.ids.length;
          underCapCustodians.push({ id, headroom: headroom * share });
        }
      }
    }
    const totalHeadroom = underCapCustodians.reduce((s, u) => s + u.headroom, 0);
    if (totalHeadroom < 1e-9) break;
    for (const { id, headroom } of underCapCustodians) {
      result.set(id, (result.get(id) ?? 0) + excess * (headroom / totalHeadroom));
    }
  }
  return result;
}

// ============================================================
// §XX.16.4 — Failure simulation
// ============================================================

export interface CustodianFailureSimulation {
  survived: boolean;               // true if remaining custodians can absorb
  redistribution: CustodianAllocation[];
  /** Total exposure that cannot be placed (0 if survived). */
  unplacedExposure: number;
  /** Maximum new concentration after redistribution. */
  maxNewConcentration: number;
  /** Per-surviving-custodian headroom consumed. */
  headroomConsumed: Record<string, number>;
  alerts: string[];
}

/**
 * §XX.16.4 Simulate the failure of a single custodian.
 *
 * The failed custodian's exposure is redistributed to surviving active
 * custodians proportionally to their available capacity × health, clamped
 * to the 25% per-custodian and 30% per-jurisdiction caps.
 *
 * If the surviving fleet cannot absorb the exposure (insufficient capacity
 * or caps would be breached), `survived = false` and `unplacedExposure`
 * reports the residual.
 *
 * This is a key institutional stress test (Dodd-Frank §165 single-counterparty
 * exposure limit analogue).
 *
 * @param custodians Full custodian list.
 * @param failedId   ID of the custodian assumed to fail.
 * @returns          Failure simulation result.
 */
export function simulateCustodianFailure(
  custodians: Custodian[],
  failedId: string,
): CustodianFailureSimulation {
  const failed = custodians.find((c) => c.id === failedId);
  if (!failed) {
    throw new Error(`Custodian ${failedId} not found`);
  }

  const alerts: string[] = [];
  const survivors = custodians.filter(
    (c) => c.id !== failedId && c.status === "active",
  );

  if (survivors.length === 0) {
    return {
      survived: false,
      redistribution: [],
      unplacedExposure: failed.currentExposure,
      maxNewConcentration: 1,
      headroomConsumed: {},
      alerts: [
        `CRITICAL: ${failed.name} failure leaves NO active custodians`,
        `Unplaced exposure: $${failed.currentExposure.toLocaleString()}`,
        "Constitutional emergency — convene Risk Committee immediately",
      ],
    };
  }

  // Total exposure after failure (excluding failed custodian)
  const remainingExposure = survivors.reduce((s, c) => s + c.currentExposure, 0);
  const newTotal = remainingExposure + failed.currentExposure;

  // Compute each survivor's capacity to absorb (available capacity × health)
  const absorbers = survivors.map((c) => {
    const available = Math.max(0, c.maxCapacity - c.currentExposure);
    const healthFactor = c.healthScore / 100;
    // Absorb capacity = available × health, but also limited by 25% cap
    const capAbsorb = Math.max(0, (CUSTODIAN_LIMITS.maxSingleCustodian * newTotal) - c.currentExposure);
    return {
      custodian: c,
      absorbCapacity: Math.min(available * healthFactor, capAbsorb),
    };
  });

  const totalAbsorbCapacity = absorbers.reduce((s, a) => s + a.absorbCapacity, 0);
  const unplacedExposure = Math.max(0, failed.currentExposure - totalAbsorbCapacity);

  if (unplacedExposure > 0) {
    alerts.push(
      `Insufficient capacity: $${unplacedExposure.toLocaleString()} cannot be placed without breaching caps`,
    );
  }

  // Redistribute proportionally to absorb capacity
  const redistribution: CustodianAllocation[] = [];
  const headroomConsumed: Record<string, number> = {};
  let maxNewConcentration = 0;

  for (const a of absorbers) {
    const share = totalAbsorbCapacity > 0 ? a.absorbCapacity / totalAbsorbCapacity : 0;
    const absorbed = Math.min(a.absorbCapacity, failed.currentExposure * share);
    const newExposure = a.custodian.currentExposure + absorbed;
    const newPct = newTotal > 0 ? newExposure / newTotal : 0;
    const oldPct = (remainingExposure + failed.currentExposure) > 0
      ? a.custodian.currentExposure / (remainingExposure + failed.currentExposure)
      : 0;

    maxNewConcentration = Math.max(maxNewConcentration, newPct);
    headroomConsumed[a.custodian.id] = a.custodian.maxCapacity > 0
      ? absorbed / a.custodian.maxCapacity
      : 0;

    redistribution.push({
      custodianId: a.custodian.id,
      allocationPct: newPct,
      currentPct: oldPct,
      deviation: newPct - oldPct,
      action: absorbed > 0 ? "increase" : "hold",
    });

    if (newPct > CUSTODIAN_LIMITS.maxSingleCustodian) {
      alerts.push(
        `[${a.custodian.name}] post-failure concentration ${(newPct * 100).toFixed(1)}% > ${(CUSTODIAN_LIMITS.maxSingleCustodian * 100)}% cap`,
      );
    }
  }

  // Check jurisdiction caps post-failure
  const byJuris = new Map<string, number>();
  for (const a of absorbers) {
    const share = totalAbsorbCapacity > 0 ? a.absorbCapacity / totalAbsorbCapacity : 0;
    const absorbed = Math.min(a.absorbCapacity, failed.currentExposure * share);
    const newExpo = a.custodian.currentExposure + absorbed;
    byJuris.set(
      a.custodian.jurisdiction,
      (byJuris.get(a.custodian.jurisdiction) ?? 0) + newExpo,
    );
  }
  for (const [juris, expo] of byJuris) {
    const pct = newTotal > 0 ? expo / newTotal : 0;
    if (pct > CUSTODIAN_LIMITS.maxSingleJurisdiction) {
      alerts.push(
        `Jurisdiction ${juris} post-failure concentration ${(pct * 100).toFixed(1)}% > ${(CUSTODIAN_LIMITS.maxSingleJurisdiction * 100)}% cap`,
      );
    }
  }

  if (survivors.length < CUSTODIAN_LIMITS.minCustodians) {
    alerts.push(
      `Post-failure active custodian count ${survivors.length} < constitutional minimum ${CUSTODIAN_LIMITS.minCustodians}`,
    );
  }

  return {
    survived: unplacedExposure === 0 && alerts.length === 0,
    redistribution,
    unplacedExposure,
    maxNewConcentration,
    headroomConsumed,
    alerts,
  };
}

// ============================================================
// §XX.16.5 — Default custodian fleet (institutional baseline)
// ============================================================

/**
 * §XX.16.5 Default institutional multi-custodian fleet.
 *
 * Reflects a geographically diversified, multi-jurisdictional custody
 * architecture (US, Switzerland, UK, Singapore). Used as the baseline
 * for `/api/custodians` GET when no live data is provided.
 */
export const DEFAULT_CUSTODIAN_FLEET: Custodian[] = [
  {
    id: "cust-jpm",
    name: "JPMorgan Custody",
    type: "bank",
    jurisdiction: "US",
    healthScore: 95,
    maxCapacity: 50_000_000,
    currentExposure: 12_500_000,
    concentrationPct: 0.20,
    insuranceCoverage: 25_000_000,
    rating: "AA-",
    status: "active",
  },
  {
    id: "cust-ubs",
    name: "UBS Swiss Custody",
    type: "bank",
    jurisdiction: "CH",
    healthScore: 92,
    maxCapacity: 40_000_000,
    currentExposure: 10_000_000,
    concentrationPct: 0.16,
    insuranceCoverage: 20_000_000,
    rating: "AA-",
    status: "active",
  },
  {
    id: "cust-loomis",
    name: "Loomis Zurich Vault",
    type: "vault",
    jurisdiction: "CH",
    healthScore: 88,
    maxCapacity: 30_000_000,
    currentExposure: 8_000_000,
    concentrationPct: 0.13,
    insuranceCoverage: 16_000_000,
    rating: "A+",
    status: "active",
  },
  {
    id: "cust-brinks",
    name: "Brink's London Vault",
    type: "vault",
    jurisdiction: "UK",
    healthScore: 87,
    maxCapacity: 35_000_000,
    currentExposure: 9_500_000,
    concentrationPct: 0.15,
    insuranceCoverage: 18_000_000,
    rating: "A+",
    status: "active",
  },
  {
    id: "cust-malca",
    name: "Malca-Amit Singapore",
    type: "vault",
    jurisdiction: "SG",
    healthScore: 84,
    maxCapacity: 25_000_000,
    currentExposure: 6_500_000,
    concentrationPct: 0.10,
    insuranceCoverage: 13_000_000,
    rating: "A",
    status: "active",
  },
  {
    id: "cust-state-street",
    name: "State Street Trust",
    type: "trust",
    jurisdiction: "US",
    healthScore: 90,
    maxCapacity: 45_000_000,
    currentExposure: 8_500_000,
    concentrationPct: 0.14,
    insuranceCoverage: 17_000_000,
    rating: "AA-",
    status: "backup",
  },
  {
    id: "cust-db",
    name: "Deutsche Bank Frankfurt",
    type: "bank",
    jurisdiction: "DE",
    healthScore: 78,
    maxCapacity: 30_000_000,
    currentExposure: 7_000_000,
    concentrationPct: 0.11,
    insuranceCoverage: 14_000_000,
    rating: "A",
    status: "backup",
  },
];

// ============================================================
// §XX.16.6 — Convenience helpers
// ============================================================

/**
 * §XX.16.6 Format the multi-custodian status as an audit-log line.
 */
export function formatCustodianSummary(
  health: CustodianHealthResult,
  allocations: CustodianAllocation[],
): string {
  return [
    `healthy=${health.healthy}`,
    `active=${health.diversification.activeCount}`,
    `jurisdictions=${health.diversification.jurisdictionCount}`,
    `maxCustodian=${(health.diversification.maxCustodianPct * 100).toFixed(1)}%`,
    `maxJurisdiction=${(health.diversification.maxJurisdictionPct * 100).toFixed(1)}%`,
    `HHI=${health.diversification.herfindahlIndex.toFixed(3)}`,
    `alerts=${health.alerts.length}`,
    `rebalanceActions=${allocations.filter((a) => a.action !== "hold").length}`,
  ].join(" | ");
}

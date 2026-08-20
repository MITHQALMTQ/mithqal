// ============================================================================
// §V25.2 §52 — SYSTEM-WIDE EXPOSURE & CONCENTRATION ENGINE
// ============================================================================
// This module implements §52 of the master directive: System-Wide Exposure
// & Concentration. It provides the 13-dimension concentration measurement
// framework and answers the two pivotal systemic-risk questions:
//
//   Question A: Is Bank A within its individual limit?
//   Question B: Does Bank A's growth create excessive system-wide
//                concentration?
//
// The engine produces:
//   - A SystemicExposureSnapshot — a cross-dimensional view of all
//     institutional exposures across 13 concentration dimensions.
//   - A per-bank BankVsSystemWideResult answering Questions A & B.
//   - A reference input bundle for the §3 DMCE engine (REFERENCE only —
//     this module does NOT recompute DMCE itself; DMCE is owned by the
//     canonical monetary engine in mtq-final-reserve-spec.ts).
//
// RELATIONSHIP TO OTHER MODULES:
//   - Consumes the §76 CONCENTRATION_LIMITS (preferred/hard exposure caps).
//   - Honors §74 honest-state disclosure: design + implementation complete,
//     live monitoring + production validation NOT claimed.
//
// HONEST STATE (per §74) — EXACT values:
//   systemicRiskEngineDesigned       = true
//   systemicRiskEngineImplemented    = true
//   systemicRiskMonitoringLive       = false   (NO live institutional data feeds)
//   systemicRiskProductionValidated  = false   (NO production deployment)
//
//   This is a DESIGN-TIME systemic exposure measurement engine. It operates
//   on declarative bank / custodian / provider / asset inputs (currently
//   SIMULATED reference data in buildReferenceSystemicSnapshot). It does NOT
//   poll live bank balances, live custodian holdings, or live oracle feeds.
//   Any live-monitoring claim would be dishonest and is therefore NOT made.
// ============================================================================

export const MODULE_ID = "v25.2-systemic-exposure-engine-1.0";
export const SPEC_VERSION = "v25.2 §52 System-Wide Exposure & Concentration";
export const DIRECTIVE_SECTION = "§52";
export const CONCENTRATION_DIMENSION_COUNT = 13;

// ----------------------------------------------------------------------------
// §52 — The 13 concentration dimensions
// ----------------------------------------------------------------------------
export type ConcentrationDimension =
  | "bank"
  | "banking-group"
  | "country"
  | "currency"
  | "custodian"
  | "correspondent"
  | "settlement-rail"
  | "liquidity-provider"
  | "stablecoin-issuer"
  | "technology-provider"
  | "geopolitical-correlation"
  | "operational-correlation"
  | "bank-exposure"; // §76 — also measured as a distinct dimension

export const ALL_DIMENSIONS: ConcentrationDimension[] = [
  "bank",
  "banking-group",
  "country",
  "currency",
  "custodian",
  "correspondent",
  "settlement-rail",
  "liquidity-provider",
  "stablecoin-issuer",
  "technology-provider",
  "geopolitical-correlation",
  "operational-correlation",
  "bank-exposure",
];

export type ExposureStatus = "within" | "near-breach" | "breach" | "unknown";

// ----------------------------------------------------------------------------
// §52 — Exposure bucket (per-entity measurement within a dimension)
// ----------------------------------------------------------------------------
export interface ExposureBucket {
  dimension: ConcentrationDimension;
  entityId: string;
  entityName: string;
  exposureAmount: number; // USD notional
  exposurePct: number; // share of total systemic exposure (0-1)
  preferredLimit: number; // preferred exposure cap (0-1)
  hardLimit: number; // hard exposure cap (0-1)
  status: ExposureStatus;
  metadata?: {
    parentGroup?: string;
    jurisdiction?: string;
    growthDelta?: number; // period-over-period exposure change (pp)
    correlatedDimensions?: string[];
    note?: string;
  };
}

// ----------------------------------------------------------------------------
// §52 — Systemic exposure snapshot (full 13-dimension view)
// ----------------------------------------------------------------------------
export interface SystemicExposureSnapshot {
  timestamp: string;
  dimensions: Record<ConcentrationDimension, ExposureBucket[]>;
  totalExposure: number;
  constraintsMet: boolean;
  violations: ExposureBucket[]; // hard-limit breaches
  nearBreaches: ExposureBucket[]; // preferred-limit breaches (under hard)
  concentrationScore: number; // 0-1 (HHI-style)
}

// ----------------------------------------------------------------------------
// §52 — Bank-vs-system-wide result (answers Questions A & B for one bank)
// ----------------------------------------------------------------------------
export interface BankVsSystemWideResult {
  bankId: string;
  bankName: string;
  // Question A — individual limit
  individualLimitOk: boolean;
  individualExposurePct: number;
  individualLimit: number;
  // Question B — system-wide concentration
  systemWideConcentrationOk: boolean;
  growthCreatesExcessConcentration: boolean;
  projectedExposurePct: number; // after applying growthDelta
  projectedSystemConcentrationScore: number;
  // Context
  details: string[];
  recommendation: string;
}

// ----------------------------------------------------------------------------
// §76 — CONCENTRATION LIMITS (preferred / hard caps)
// ----------------------------------------------------------------------------
// These are the controlling concentration caps referenced from §76. The
// preferred cap is the operational target; the hard cap is the absolute
// constitutional ceiling. Status "within" = ≤ preferred; "near-breach" =
// > preferred but ≤ hard; "breach" = > hard.
//
// Per the master directive, the preferred bank exposure range is 10-15%;
// we adopt the upper bound (15%) as the operational preferred threshold.
// ----------------------------------------------------------------------------
export const CONCENTRATION_LIMITS = {
  // Currency (§76) — preferred 15%, hard 20%
  preferredCurrencyExposure: 0.15,
  hardCurrencyExposure: 0.20,
  // Bank (§76) — preferred 10-15% (upper bound adopted), hard 20%
  preferredBankExposure: 0.15,
  hardBankExposure: 0.20,
  // Custodian (§76) — preferred 15%, hard 20%
  preferredCustodianExposure: 0.15,
  hardCustodianExposure: 0.20,
  // Country (§76) — preferred 20%, hard 25%
  preferredCountryExposure: 0.20,
  hardCountryExposure: 0.25,
  // Banking group — preferred 15%, hard 20% (parent consolidation, same
  // thresholds as bank to surface group-level concentration explicitly)
  preferredBankingGroupExposure: 0.15,
  hardBankingGroupExposure: 0.20,
  // Correspondent — preferred 15%, hard 20%
  preferredCorrespondentExposure: 0.15,
  hardCorrespondentExposure: 0.20,
  // Settlement rail — preferred 25%, hard 35% (rails are naturally concentrated)
  preferredSettlementRailExposure: 0.25,
  hardSettlementRailExposure: 0.35,
  // Liquidity provider — preferred 20%, hard 30%
  preferredLiquidityProviderExposure: 0.20,
  hardLiquidityProviderExposure: 0.30,
  // Stablecoin issuer — preferred 10%, hard 15% (issuer-level risk)
  preferredStablecoinIssuerExposure: 0.10,
  hardStablecoinIssuerExposure: 0.15,
  // Technology provider — preferred 15%, hard 20%
  preferredTechnologyProviderExposure: 0.15,
  hardTechnologyProviderExposure: 0.20,
  // Geopolitical correlation block — preferred 30%, hard 40%
  preferredGeopoliticalCorrelationExposure: 0.30,
  hardGeopoliticalCorrelationExposure: 0.40,
  // Operational correlation block — preferred 30%, hard 40%
  preferredOperationalCorrelationExposure: 0.30,
  hardOperationalCorrelationExposure: 0.40,
  // Bank-exposure dimension (§76) — preferred 10-15% (upper bound), hard 20%
  preferredBankExposureDimension: 0.15,
  hardBankExposureDimension: 0.20,
} as const;

/** Lookup preferred / hard limits for a given concentration dimension. */
export function limitsForDimension(
  d: ConcentrationDimension,
): { preferred: number; hard: number } {
  switch (d) {
    case "bank":
      return {
        preferred: CONCENTRATION_LIMITS.preferredBankExposure,
        hard: CONCENTRATION_LIMITS.hardBankExposure,
      };
    case "bank-exposure":
      return {
        preferred: CONCENTRATION_LIMITS.preferredBankExposureDimension,
        hard: CONCENTRATION_LIMITS.hardBankExposureDimension,
      };
    case "banking-group":
      return {
        preferred: CONCENTRATION_LIMITS.preferredBankingGroupExposure,
        hard: CONCENTRATION_LIMITS.hardBankingGroupExposure,
      };
    case "country":
      return {
        preferred: CONCENTRATION_LIMITS.preferredCountryExposure,
        hard: CONCENTRATION_LIMITS.hardCountryExposure,
      };
    case "currency":
      return {
        preferred: CONCENTRATION_LIMITS.preferredCurrencyExposure,
        hard: CONCENTRATION_LIMITS.hardCurrencyExposure,
      };
    case "custodian":
      return {
        preferred: CONCENTRATION_LIMITS.preferredCustodianExposure,
        hard: CONCENTRATION_LIMITS.hardCustodianExposure,
      };
    case "correspondent":
      return {
        preferred: CONCENTRATION_LIMITS.preferredCorrespondentExposure,
        hard: CONCENTRATION_LIMITS.hardCorrespondentExposure,
      };
    case "settlement-rail":
      return {
        preferred: CONCENTRATION_LIMITS.preferredSettlementRailExposure,
        hard: CONCENTRATION_LIMITS.hardSettlementRailExposure,
      };
    case "liquidity-provider":
      return {
        preferred: CONCENTRATION_LIMITS.preferredLiquidityProviderExposure,
        hard: CONCENTRATION_LIMITS.hardLiquidityProviderExposure,
      };
    case "stablecoin-issuer":
      return {
        preferred: CONCENTRATION_LIMITS.preferredStablecoinIssuerExposure,
        hard: CONCENTRATION_LIMITS.hardStablecoinIssuerExposure,
      };
    case "technology-provider":
      return {
        preferred: CONCENTRATION_LIMITS.preferredTechnologyProviderExposure,
        hard: CONCENTRATION_LIMITS.hardTechnologyProviderExposure,
      };
    case "geopolitical-correlation":
      return {
        preferred: CONCENTRATION_LIMITS.preferredGeopoliticalCorrelationExposure,
        hard: CONCENTRATION_LIMITS.hardGeopoliticalCorrelationExposure,
      };
    case "operational-correlation":
      return {
        preferred: CONCENTRATION_LIMITS.preferredOperationalCorrelationExposure,
        hard: CONCENTRATION_LIMITS.hardOperationalCorrelationExposure,
      };
    default:
      return { preferred: 0.15, hard: 0.20 };
  }
}

// ----------------------------------------------------------------------------
// §74 — HONEST STATE (4 EXACT fields)
// ----------------------------------------------------------------------------
export const SYSTEMIC_EXPOSURE_HONEST_STATE = {
  systemicRiskEngineDesigned: true,
  systemicRiskEngineImplemented: true,
  // CRITICAL: do NOT claim live monitoring with zero live institutional data.
  systemicRiskMonitoringLive: false,
  systemicRiskProductionValidated: false,
} as const;

/** Returns a fresh copy of the §74 honest-state disclosure. */
export function systemicExposureHonestState() {
  return { ...SYSTEMIC_EXPOSURE_HONEST_STATE };
}

// ----------------------------------------------------------------------------
// INPUT INTERFACES — declarative systemic exposure inputs
// ----------------------------------------------------------------------------
export interface SystemicBankInput {
  bankId: string;
  bankName: string;
  bankingGroup: string;
  country: string; // ISO-2 or short code
  currency: string;
  custodian?: string; // custodianId
  correspondent?: string;
  settlementRail?: string;
  liquidityProvider?: string;
  stablecoinIssuer?: string;
  technologyProvider?: string;
  exposureAmount: number; // USD notional exposure
  growthDelta?: number; // pp change period-over-period
  individualLimitPct?: number; // bank's own individual limit (default = hard bank cap)
  geopoliticalCorrelation?: "low" | "medium" | "high";
  operationalCorrelation?: "low" | "medium" | "high";
}

export interface SystemicAssetInput {
  assetId: string;
  assetName: string;
  currency: string;
  custodian?: string;
  stablecoinIssuer?: string;
  type: "fiat" | "gold" | "stablecoin" | "treasury" | "other";
  exposureAmount: number;
}

export interface SystemicCustodianInput {
  custodianId: string;
  custodianName: string;
  parentGroup: string;
  jurisdiction: string;
  technologyProvider?: string;
  exposureAmount: number;
  growthDelta?: number;
}

export interface SystemicProviderInput {
  providerId: string;
  providerName: string;
  providerType:
    | "liquidity-provider"
    | "technology-provider"
    | "settlement-rail"
    | "correspondent";
  exposureAmount: number;
  growthDelta?: number;
}

// ----------------------------------------------------------------------------
// INTERNAL HELPERS
// ----------------------------------------------------------------------------
function classifyStatus(
  exposurePct: number,
  preferred: number,
  hard: number,
): ExposureStatus {
  if (exposurePct > hard + 1e-9) return "breach";
  if (exposurePct > preferred + 1e-9) return "near-breach";
  return "within";
}

function makeBucket(
  dimension: ConcentrationDimension,
  entityId: string,
  entityName: string,
  exposureAmount: number,
  totalExposure: number,
  extra?: Partial<NonNullable<ExposureBucket["metadata"]>>,
): ExposureBucket {
  const { preferred, hard } = limitsForDimension(dimension);
  const exposurePct = totalExposure > 0 ? exposureAmount / totalExposure : 0;
  return {
    dimension,
    entityId,
    entityName,
    exposureAmount,
    exposurePct,
    preferredLimit: preferred,
    hardLimit: hard,
    status: classifyStatus(exposurePct, preferred, hard),
    metadata: extra,
  };
}

interface AggItem {
  value: string;
  name: string;
  amount: number;
  extra?: Partial<NonNullable<ExposureBucket["metadata"]>>;
}

function aggregate(
  items: AggItem[],
): Map<string, { name: string; amount: number; extra?: AggItem["extra"] }> {
  const m = new Map<string, { name: string; amount: number; extra?: AggItem["extra"] }>();
  for (const it of items) {
    const existing = m.get(it.value);
    if (existing) {
      existing.amount += it.amount;
      // preserve growthDelta if both items specify one (sum deltas)
      if (it.extra?.growthDelta !== undefined) {
        const prev = existing.extra?.growthDelta ?? 0;
        existing.extra = { ...(existing.extra ?? {}), growthDelta: prev + it.extra.growthDelta };
      }
    } else {
      m.set(it.value, { name: it.name, amount: it.amount, extra: it.extra });
    }
  }
  return m;
}

// ----------------------------------------------------------------------------
// §52 — evaluateSystemicExposure
// ----------------------------------------------------------------------------
/**
 * Computes the full 13-dimension systemic exposure snapshot.
 *
 * `totalExposure` is taken as the maximum single-dimension total (banks,
 * assets, custodians, providers). This represents the size of the
 * systemic reserve: in a well-formed system each dimension's exposure
 * total should approximate the same underlying reserve. Taking the max
 * guards against partial inputs and prevents artificial deflation of
 * concentration percentages when one input list is incomplete.
 */
export function evaluateSystemicExposure(
  banks: SystemicBankInput[],
  assets: SystemicAssetInput[],
  custodians: SystemicCustodianInput[],
  providers: SystemicProviderInput[],
): SystemicExposureSnapshot {
  const bankTotal = banks.reduce((s, b) => s + b.exposureAmount, 0);
  const assetTotal = assets.reduce((s, a) => s + a.exposureAmount, 0);
  const custodianTotal = custodians.reduce((s, c) => s + c.exposureAmount, 0);
  const providerTotal = providers.reduce((s, p) => s + p.exposureAmount, 0);
  const totalExposure = Math.max(
    bankTotal,
    assetTotal,
    custodianTotal,
    providerTotal,
    1, // guard against divide-by-zero
  );

  const dimensions = {} as Record<ConcentrationDimension, ExposureBucket[]>;
  for (const d of ALL_DIMENSIONS) dimensions[d] = [];

  // 1. bank — each bank's exposure
  for (const b of banks) {
    dimensions["bank"].push(
      makeBucket("bank", b.bankId, b.bankName, b.exposureAmount, totalExposure, {
        parentGroup: b.bankingGroup,
        jurisdiction: b.country,
        growthDelta: b.growthDelta,
      }),
    );
  }

  // 2. banking-group — banks aggregated by parent group.
  //    Sets metadata.parentGroup = the group name itself so cross-dimension
  //    correlation (bank ↔ banking-group) can match on parentGroup.
  const groupAgg = aggregate(
    banks.map((b) => ({
      value: b.bankingGroup,
      name: b.bankingGroup,
      amount: b.exposureAmount,
      extra: { parentGroup: b.bankingGroup, growthDelta: b.growthDelta } as AggItem["extra"],
    })),
  );
  for (const [k, v] of groupAgg) {
    dimensions["banking-group"].push(
      makeBucket("banking-group", k, v.name, v.amount, totalExposure, v.extra),
    );
  }

  // 3. country — banks by country (single source: bank's country attribute).
  //    Sets metadata.jurisdiction = the country code so cross-dimension
  //    correlation (bank ↔ country) can match on jurisdiction.
  //    Custodian jurisdictions are surfaced via the custodian dimension's
  //    metadata.jurisdiction field (used by correlatedExposure), NOT added
  //    here, to avoid double-counting the same reserve dollars.
  const countryItems: AggItem[] = banks.map((b) => ({
    value: b.country,
    name: b.country,
    amount: b.exposureAmount,
    extra: { jurisdiction: b.country, parentGroup: b.bankingGroup } as AggItem["extra"],
  }));
  const countryAgg = aggregate(countryItems);
  for (const [k, v] of countryAgg) {
    dimensions["country"].push(
      makeBucket("country", k, v.name, v.amount, totalExposure, v.extra),
    );
  }

  // 4. currency — assets by currency (single source: asset's currency).
  //    Banks' `currency` field is reserved as descriptive metadata; it is NOT
  //    summed into the currency dimension to avoid double-counting (the bank's
  //    holding IS the asset's currency).
  const currencyItems: AggItem[] = assets.map((a) => ({
    value: a.currency,
    name: a.currency,
    amount: a.exposureAmount,
  }));
  const currencyAgg = aggregate(currencyItems);
  for (const [k, v] of currencyAgg) {
    dimensions["currency"].push(
      makeBucket("currency", k, v.name, v.amount, totalExposure),
    );
  }

  // 5. custodian — custodians by exposureAmount (single source).
  //    Bank and asset `custodian` attributional fields are descriptive only;
  //    they're not summed here (the custodian's exposureAmount already
  //    represents the assets it holds).
  const custodianItems: AggItem[] = custodians.map((c) => ({
    value: c.custodianId,
    name: c.custodianName,
    amount: c.exposureAmount,
    extra: {
      parentGroup: c.parentGroup,
      jurisdiction: c.jurisdiction,
      growthDelta: c.growthDelta,
    },
  }));
  const custodianAgg = aggregate(custodianItems);
  for (const [k, v] of custodianAgg) {
    dimensions["custodian"].push(
      makeBucket("custodian", k, v.name, v.amount, totalExposure, v.extra),
    );
  }

  // 6. correspondent — banks by correspondent (single source).
  //    Sets metadata.parentGroup = the contributing bank's banking group so
  //    cross-dimension correlation can identify systemic linkage.
  const corrItems: AggItem[] = banks
    .filter((b) => !!b.correspondent)
    .map((b) => ({
      value: b.correspondent!,
      name: b.correspondent!,
      amount: b.exposureAmount,
      extra: { parentGroup: b.bankingGroup, jurisdiction: b.country } as AggItem["extra"],
    }));
  const corrAgg = aggregate(corrItems);
  for (const [k, v] of corrAgg) {
    dimensions["correspondent"].push(
      makeBucket("correspondent", k, v.name, v.amount, totalExposure, v.extra),
    );
  }

  // 7. settlement-rail — banks by settlementRail (single source).
  //    Sets metadata.parentGroup = the contributing bank's banking group.
  //    Providers of type settlement-rail are accepted for forward-compat
  //    (provider-direct counterparty exposure) but are NOT summed into bank
  //    attributional exposure to avoid double-counting.
  const railItems: AggItem[] = banks
    .filter((b) => !!b.settlementRail)
    .map((b) => ({
      value: b.settlementRail!,
      name: b.settlementRail!,
      amount: b.exposureAmount,
      extra: { parentGroup: b.bankingGroup, jurisdiction: b.country } as AggItem["extra"],
    }));
  const railAgg = aggregate(railItems);
  for (const [k, v] of railAgg) {
    dimensions["settlement-rail"].push(
      makeBucket("settlement-rail", k, v.name, v.amount, totalExposure, v.extra),
    );
  }

  // 8. liquidity-provider — banks by liquidityProvider (single source).
  //    Sets metadata.parentGroup = the contributing bank's banking group.
  const lpItems: AggItem[] = banks
    .filter((b) => !!b.liquidityProvider)
    .map((b) => ({
      value: b.liquidityProvider!,
      name: b.liquidityProvider!,
      amount: b.exposureAmount,
      extra: {
        parentGroup: b.bankingGroup,
        jurisdiction: b.country,
        growthDelta: b.growthDelta,
      } as AggItem["extra"],
    }));
  const lpAgg = aggregate(lpItems);
  for (const [k, v] of lpAgg) {
    dimensions["liquidity-provider"].push(
      makeBucket("liquidity-provider", k, v.name, v.amount, totalExposure, v.extra),
    );
  }

  // 9. stablecoin-issuer — assets by stablecoinIssuer (single source).
  const sciItems: AggItem[] = assets
    .filter((a) => !!a.stablecoinIssuer)
    .map((a) => ({
      value: a.stablecoinIssuer!,
      name: a.stablecoinIssuer!,
      amount: a.exposureAmount,
    }));
  const sciAgg = aggregate(sciItems);
  for (const [k, v] of sciAgg) {
    dimensions["stablecoin-issuer"].push(
      makeBucket("stablecoin-issuer", k, v.name, v.amount, totalExposure, v.extra),
    );
  }

  // 10. technology-provider — custodians by technologyProvider (single source).
  //     Sets metadata.parentGroup = the custodian's parent group and
  //     metadata.jurisdiction = the custodian's jurisdiction so cross-dimension
  //     correlation (custodian ↔ technology-provider) can match.
  //     Bank and provider `technologyProvider` attributional fields are
  //     descriptive only; they're not summed to avoid double-counting.
  const techItems: AggItem[] = custodians
    .filter((c) => !!c.technologyProvider)
    .map((c) => ({
      value: c.technologyProvider!,
      name: c.technologyProvider!,
      amount: c.exposureAmount,
      extra: {
        parentGroup: c.parentGroup,
        jurisdiction: c.jurisdiction,
      } as AggItem["extra"],
    }));
  const techAgg = aggregate(techItems);
  for (const [k, v] of techAgg) {
    dimensions["technology-provider"].push(
      makeBucket("technology-provider", k, v.name, v.amount, totalExposure, v.extra),
    );
  }

  // 11. geopolitical-correlation — banks grouped by correlation block
  const geoItems: AggItem[] = [];
  for (const b of banks) {
    const block = b.geopoliticalCorrelation ?? "low";
    geoItems.push({
      value: `geo-${block}`,
      name: `Geopolitical block: ${block}`,
      amount: b.exposureAmount,
    });
  }
  const geoAgg = aggregate(geoItems);
  for (const [k, v] of geoAgg) {
    dimensions["geopolitical-correlation"].push(
      makeBucket("geopolitical-correlation", k, v.name, v.amount, totalExposure),
    );
  }

  // 12. operational-correlation — banks grouped by correlation block
  const opItems: AggItem[] = [];
  for (const b of banks) {
    const block = b.operationalCorrelation ?? "low";
    opItems.push({
      value: `op-${block}`,
      name: `Operational block: ${block}`,
      amount: b.exposureAmount,
    });
  }
  const opAgg = aggregate(opItems);
  for (const [k, v] of opAgg) {
    dimensions["operational-correlation"].push(
      makeBucket("operational-correlation", k, v.name, v.amount, totalExposure),
    );
  }

  // 13. bank-exposure (§76) — same per-bank underlying data, but surfaced as
  //     a distinct dimension so §76 governance can apply separate thresholds
  //     for "individual bank exposure" vs the §52 bank concentration view.
  for (const b of banks) {
    dimensions["bank-exposure"].push(
      makeBucket("bank-exposure", b.bankId, b.bankName, b.exposureAmount, totalExposure, {
        parentGroup: b.bankingGroup,
        jurisdiction: b.country,
        growthDelta: b.growthDelta,
        note: "§76 bank-exposure dimension (preferred 10-15%, hard 20%)",
      }),
    );
  }

  // Collect violations and near-breaches across all dimensions
  const violations: ExposureBucket[] = [];
  const nearBreaches: ExposureBucket[] = [];
  for (const d of ALL_DIMENSIONS) {
    for (const b of dimensions[d]) {
      if (b.status === "breach") violations.push(b);
      else if (b.status === "near-breach") nearBreaches.push(b);
    }
  }
  const constraintsMet = violations.length === 0;

  // Build a partial snapshot for score computation
  const partial: SystemicExposureSnapshot = {
    timestamp: new Date().toISOString(),
    dimensions,
    totalExposure,
    constraintsMet,
    violations,
    nearBreaches,
    concentrationScore: 0, // computed below
  };
  const concentrationScore = computeSystemicConcentrationScore(partial);

  return { ...partial, concentrationScore };
}

// ----------------------------------------------------------------------------
// §52 — checkBankVsSystemWide (answers Questions A & B for one bank)
// ----------------------------------------------------------------------------
/**
 * For a single bank, answers:
 *   Question A: Is Bank A within its individual limit?
 *   Question B: Does Bank A's growth create excessive system-wide
 *                concentration?
 *
 * Question B is answered by projecting the bank's exposure forward by its
 * growthDelta and checking whether (a) the projected exposure breaches the
 * hard cap or preferred cap, and (b) the bank (or its parent group) already
 * appears in the snapshot's violation list.
 */
export function checkBankVsSystemWide(
  bankId: string,
  snapshot: SystemicExposureSnapshot,
): BankVsSystemWideResult {
  const bankBucket = snapshot.dimensions["bank"].find((b) => b.entityId === bankId);
  const details: string[] = [];

  if (!bankBucket) {
    return {
      bankId,
      bankName: "UNKNOWN",
      individualLimitOk: false,
      individualExposurePct: 0,
      individualLimit: CONCENTRATION_LIMITS.hardBankExposure,
      systemWideConcentrationOk: false,
      growthCreatesExcessConcentration: false,
      projectedExposurePct: 0,
      projectedSystemConcentrationScore: 0,
      details: [`Bank ${bankId} not found in snapshot — on-boarding required before systemic evaluation.`],
      recommendation: "On-board the bank before systemic evaluation can proceed.",
    };
  }

  // ---- Question A: individual limit --------------------------------------
  const individualLimit = bankBucket.hardLimit;
  const individualExposurePct = bankBucket.exposurePct;
  const individualLimitOk = individualExposurePct <= individualLimit + 1e-9;
  details.push(
    `Q-A: ${bankBucket.entityName} exposure ${(individualExposurePct * 100).toFixed(2)}% ` +
      `vs individual hard limit ${(individualLimit * 100).toFixed(2)}% → ` +
      `${individualLimitOk ? "OK (within limit)" : "BREACH (over limit)"}.`,
  );

  // ---- Question B: system-wide concentration -----------------------------
  // Find any violations that touch this bank or its parent group.
  const violationsForBank = snapshot.violations.filter(
    (v) =>
      v.entityId === bankId ||
      (v.metadata?.parentGroup && v.metadata.parentGroup === bankBucket.metadata?.parentGroup),
  );
  const systemWideConcentrationOk = violationsForBank.length === 0;

  // Project exposure after applying growthDelta (growthDelta in pp; convert to fraction)
  const growthDeltaPp = bankBucket.metadata?.growthDelta ?? 0;
  const projectedExposurePct = Math.max(
    0,
    individualExposurePct + growthDeltaPp / 100,
  );
  const wouldBreachHard = projectedExposurePct > individualLimit + 1e-9;
  const wouldBreachPreferred =
    projectedExposurePct > bankBucket.preferredLimit + 1e-9 && !wouldBreachHard;
  const growthCreatesExcessConcentration =
    wouldBreachHard || wouldBreachPreferred || violationsForBank.length > 0;

  // Projected system concentration score (heuristic upper bound):
  //   currentScore + (delta contribution normalized by total exposure)
  const projectedScore = Math.min(
    1,
    snapshot.concentrationScore +
      Math.max(0, growthDeltaPp / 100) * individualExposurePct * 0.5,
  );

  details.push(
    `Q-B: growth delta ${growthDeltaPp.toFixed(2)}pp → projected exposure ` +
      `${(projectedExposurePct * 100).toFixed(2)}% ` +
      `(current ${(individualExposurePct * 100).toFixed(2)}%).`,
  );
  details.push(
    `Q-B: system-wide violations touching this bank or its parent group: ${violationsForBank.length}.`,
  );
  if (wouldBreachHard) {
    details.push(
      `Q-B: projected exposure ${(projectedExposurePct * 100).toFixed(2)}% would breach HARD limit ` +
        `${(individualLimit * 100).toFixed(2)}% — growth creates excessive concentration.`,
    );
  } else if (wouldBreachPreferred) {
    details.push(
      `Q-B: projected exposure ${(projectedExposurePct * 100).toFixed(2)}% would breach PREFERRED limit ` +
        `${(bankBucket.preferredLimit * 100).toFixed(2)}% — growth creates excess concentration (advisory).`,
    );
  }
  if (violationsForBank.length > 0) {
    details.push(
      `Q-B: existing system-wide violations attributed to this bank/group: ` +
        violationsForBank.map((v) => `${v.dimension}:${v.entityId}`).join(", ") + ".",
    );
  }

  // ---- Recommendation -----------------------------------------------------
  let recommendation: string;
  if (!individualLimitOk) {
    recommendation =
      "REDUCE exposure to bank immediately — individual hard limit already breached.";
  } else if (wouldBreachHard) {
    recommendation =
      "HOLD growth — projected exposure would breach the system-wide hard cap.";
  } else if (wouldBreachPreferred) {
    recommendation =
      "MONITOR growth — projected exposure would exceed the preferred system-wide cap.";
  } else if (violationsForBank.length > 0) {
    recommendation =
      "REMEDIATE existing system-wide violations attributed to this bank/group before expanding exposure.";
  } else {
    recommendation = "Within limits; continue routine systemic monitoring.";
  }

  return {
    bankId,
    bankName: bankBucket.entityName,
    individualLimitOk,
    individualExposurePct,
    individualLimit,
    systemWideConcentrationOk,
    growthCreatesExcessConcentration,
    projectedExposurePct,
    projectedSystemConcentrationScore: projectedScore,
    details,
    recommendation,
  };
}

// ----------------------------------------------------------------------------
// §52 — enhancedDMCEInput (REFERENCE input for §3 DMCE engine)
// ----------------------------------------------------------------------------
export interface EnhancedDMCEInput {
  bankId: string;
  bankName: string;
  bankExposurePct: number;
  bankGrowthDelta: number; // pp
  bankHardLimit: number;
  bankPreferredLimit: number;
  systemConcentrationScore: number;
  systemWideViolations: number;
  systemWideNearBreaches: number;
  correlatedDimensions: Array<{
    dimension: ConcentrationDimension;
    entityId: string;
    exposurePct: number;
  }>;
  // CRITICAL NOTE: This is a REFERENCE input bundle to be consumed by the
  // canonical DMCE engine (mtq-final-reserve-spec.ts). This module does NOT
  // recompute DMCE itself; it only surfaces the systemic-risk inputs.
  note: string;
}

/**
 * Produces the systemic-risk reference inputs for the §3 DMCE engine.
 *
 * IMPORTANT: This is a REFERENCE bundle only. The DMCE (Dynamic Monetary
 * Control Equation) is owned by the canonical monetary engine in
 * `mtq-final-reserve-spec.ts`. This module surfaces the systemic-risk
 * context for DMCE to consume; it does NOT recompute DMCE itself.
 */
export function enhancedDMCEInput(
  snapshot: SystemicExposureSnapshot,
  bankId: string,
): EnhancedDMCEInput {
  const bankBucket = snapshot.dimensions["bank"].find((b) => b.entityId === bankId);
  if (!bankBucket) {
    return {
      bankId,
      bankName: "UNKNOWN",
      bankExposurePct: 0,
      bankGrowthDelta: 0,
      bankHardLimit: CONCENTRATION_LIMITS.hardBankExposure,
      bankPreferredLimit: CONCENTRATION_LIMITS.preferredBankExposure,
      systemConcentrationScore: snapshot.concentrationScore,
      systemWideViolations: snapshot.violations.length,
      systemWideNearBreaches: snapshot.nearBreaches.length,
      correlatedDimensions: [],
      note:
        "Bank not found in snapshot; DMCE receives zeroed systemic inputs. " +
        "This is a REFERENCE input for §3 DMCE — this module does NOT recompute DMCE.",
    };
  }
  // Find all dimension buckets that touch this bank's parent group or entity id.
  const correlated: EnhancedDMCEInput["correlatedDimensions"] = [];
  for (const d of ALL_DIMENSIONS) {
    if (d === "bank" || d === "bank-exposure") continue;
    for (const b of snapshot.dimensions[d]) {
      if (
        b.entityId === bankId ||
        (b.metadata?.parentGroup && b.metadata.parentGroup === bankBucket.metadata?.parentGroup)
      ) {
        correlated.push({
          dimension: d,
          entityId: b.entityId,
          exposurePct: b.exposurePct,
        });
      }
    }
  }
  return {
    bankId,
    bankName: bankBucket.entityName,
    bankExposurePct: bankBucket.exposurePct,
    bankGrowthDelta: bankBucket.metadata?.growthDelta ?? 0,
    bankHardLimit: bankBucket.hardLimit,
    bankPreferredLimit: bankBucket.preferredLimit,
    systemConcentrationScore: snapshot.concentrationScore,
    systemWideViolations: snapshot.violations.length,
    systemWideNearBreaches: snapshot.nearBreaches.length,
    correlatedDimensions: correlated,
    note:
      "REFERENCE input for §3 DMCE engine — this module does NOT recompute DMCE. " +
      "DMCE consumes these systemic-risk inputs alongside its canonical monetary inputs.",
  };
}

// ----------------------------------------------------------------------------
// §52 — detectConcentrationBreaches
// ----------------------------------------------------------------------------
/** Returns all hard-limit violations across the snapshot, sorted by exposure. */
export function detectConcentrationBreaches(
  snapshot: SystemicExposureSnapshot,
): ExposureBucket[] {
  return [...snapshot.violations].sort((a, b) => b.exposurePct - a.exposurePct);
}

// ----------------------------------------------------------------------------
// §52 — computeSystemicConcentrationScore
// ----------------------------------------------------------------------------
/**
 * Computes a single 0-1 score summarizing system-wide concentration.
 *
 * Uses a normalized Herfindahl-Hirschman Index (HHI) averaged across the 13
 * dimensions. For each dimension, HHI = sum of squared exposure percentages
 * (1.0 means one entity holds 100% in that dimension). The final score is
 * the average HHI across all populated dimensions. Higher = more concentrated.
 *
 * Interpretation:
 *   < 0.15  — diversified (low concentration)
 *   0.15-0.30 — moderate concentration
 *   > 0.30  — high concentration
 *   > 0.50  — extreme concentration (single entity or near-monopoly)
 */
export function computeSystemicConcentrationScore(
  snapshot: SystemicExposureSnapshot,
): number {
  let dimSum = 0;
  let dimCount = 0;
  for (const d of ALL_DIMENSIONS) {
    const buckets = snapshot.dimensions[d] || [];
    if (buckets.length === 0) continue;
    const hhi = buckets.reduce((s, b) => s + b.exposurePct * b.exposurePct, 0);
    dimSum += hhi;
    dimCount++;
  }
  if (dimCount === 0) return 0;
  return dimSum / dimCount; // 0-1
}

// ----------------------------------------------------------------------------
// §52 — correlatedExposure (detect cross-dimension correlation)
// ----------------------------------------------------------------------------
export interface CorrelatedExposureResult {
  dimensionA: ConcentrationDimension;
  dimensionB: ConcentrationDimension;
  correlated: Array<{
    entityAId: string;
    entityAName: string;
    entityBId: string;
    entityBName: string;
    sharedKey: string; // what made them correlated
    combinedExposurePct: number; // sum across both dimensions
  }>;
  note: string;
}

/**
 * Detects correlated exposure between two dimensions — e.g., the same
 * country appearing across bank + custodian + currency dimensions.
 *
 * Two buckets are "correlated" when they share an entityId, parentGroup,
 * or jurisdiction. Combined exposure > the hard limit in either dimension
 * indicates systemic correlation risk that warrants governance review.
 */
export function correlatedExposure(
  dimensionA: ConcentrationDimension,
  dimensionB: ConcentrationDimension,
  snapshot: SystemicExposureSnapshot,
): CorrelatedExposureResult {
  const bucketsA = snapshot.dimensions[dimensionA] || [];
  const bucketsB = snapshot.dimensions[dimensionB] || [];

  const correlated: CorrelatedExposureResult["correlated"] = [];
  for (const a of bucketsA) {
    for (const b of bucketsB) {
      const sharedKeys: string[] = [];
      if (a.entityId === b.entityId) sharedKeys.push(`entityId=${a.entityId}`);
      if (
        a.metadata?.parentGroup &&
        b.metadata?.parentGroup &&
        a.metadata.parentGroup === b.metadata.parentGroup
      ) {
        sharedKeys.push(`parentGroup=${a.metadata.parentGroup}`);
      }
      if (
        a.metadata?.jurisdiction &&
        b.metadata?.jurisdiction &&
        a.metadata.jurisdiction === b.metadata.jurisdiction
      ) {
        sharedKeys.push(`jurisdiction=${a.metadata.jurisdiction}`);
      }
      if (sharedKeys.length > 0) {
        correlated.push({
          entityAId: a.entityId,
          entityAName: a.entityName,
          entityBId: b.entityId,
          entityBName: b.entityName,
          sharedKey: sharedKeys.join(", "),
          combinedExposurePct: a.exposurePct + b.exposurePct,
        });
      }
    }
  }
  return {
    dimensionA,
    dimensionB,
    correlated: correlated.sort((x, y) => y.combinedExposurePct - x.combinedExposurePct),
    note:
      "Correlation detected via shared entityId, parentGroup, or jurisdiction. " +
      "Combined exposure > hard limit in either dimension indicates systemic correlation risk.",
  };
}

// ----------------------------------------------------------------------------
// §52 — buildReferenceSystemicSnapshot (SIMULATED illustrative inputs)
// ----------------------------------------------------------------------------
/**
 * Returns an illustrative SystemicExposureSnapshot built from SIMULATED
 * reference inputs. The snapshot intentionally includes at least one
 * near-breach and one actual breach to demonstrate the engine.
 *
 * SIMULATED DATA — NOT LIVE. No real bank/custodian/provider/asset is
 * contracted. Names are illustrative only.
 */
export function buildReferenceSystemicSnapshot(): {
  snapshot: SystemicExposureSnapshot;
  banks: SystemicBankInput[];
  assets: SystemicAssetInput[];
  custodians: SystemicCustodianInput[];
  providers: SystemicProviderInput[];
} {
  const banks: SystemicBankInput[] = [
    {
      bankId: "BANK-001",
      bankName: "Northern Anchor Bank",
      bankingGroup: "Mithqal-North-Africa-Group",
      country: "AE",
      currency: "USD",
      custodian: "CUST-A",
      correspondent: "CORR-1",
      settlementRail: "SWIFT",
      liquidityProvider: "LP-A",
      technologyProvider: "TECH-1",
      exposureAmount: 25_000_000,
      growthDelta: 3.0,
      individualLimitPct: 0.20,
      geopoliticalCorrelation: "high",
      operationalCorrelation: "medium",
    },
    {
      bankId: "BANK-002",
      bankName: "Sovereign Trust Bank",
      bankingGroup: "Sovereign-Asia-Group",
      country: "SA",
      currency: "SAR",
      custodian: "CUST-B",
      correspondent: "CORR-2",
      settlementRail: "CIPS",
      liquidityProvider: "LP-B",
      technologyProvider: "TECH-1",
      exposureAmount: 18_000_000, // 18% — near-breach (preferred 15%, hard 20%)
      growthDelta: 6.0,
      individualLimitPct: 0.20,
      geopoliticalCorrelation: "high",
      operationalCorrelation: "medium",
    },
    {
      bankId: "BANK-003",
      bankName: "Euro Reserve Custody",
      bankingGroup: "Euro-Reserve-Group",
      country: "CH",
      currency: "EUR",
      custodian: "CUST-C",
      correspondent: "CORR-1",
      settlementRail: "SWIFT",
      liquidityProvider: "LP-B",
      technologyProvider: "TECH-2",
      exposureAmount: 32_000_000, // 32% — BREACH (hard 20%)
      growthDelta: 1.0,
      individualLimitPct: 0.20,
      geopoliticalCorrelation: "low",
      operationalCorrelation: "low",
    },
    {
      bankId: "BANK-004",
      bankName: "Pacific Bridge Bank",
      bankingGroup: "Pacific-Finance-Group",
      country: "SG",
      currency: "SGD",
      custodian: "CUST-A",
      correspondent: "CORR-3",
      settlementRail: "SWIFT",
      liquidityProvider: "LP-A",
      technologyProvider: "TECH-1",
      exposureAmount: 25_000_000, // 25% — BREACH (hard 20%)
      growthDelta: 2.0,
      individualLimitPct: 0.20,
      geopoliticalCorrelation: "low",
      operationalCorrelation: "low",
    },
  ];

  const custodians: SystemicCustodianInput[] = [
    {
      custodianId: "CUST-A",
      custodianName: "Northern Custody Trust",
      parentGroup: "NC-Trust-Group",
      jurisdiction: "AE",
      technologyProvider: "TECH-1",
      exposureAmount: 48_000_000, // 48% — BREACH (hard 20%)
      growthDelta: 2.0,
    },
    {
      custodianId: "CUST-B",
      custodianName: "Sovereign Custody Corp",
      parentGroup: "SC-Corp-Group",
      jurisdiction: "SA",
      technologyProvider: "TECH-1",
      exposureAmount: 35_000_000, // 35% — BREACH (hard 20%)
      growthDelta: 4.0,
    },
    {
      custodianId: "CUST-C",
      custodianName: "Alpine Vault AG",
      parentGroup: "AV-AG-Group",
      jurisdiction: "CH",
      technologyProvider: "TECH-2",
      exposureAmount: 17_000_000, // 17% — near-breach (preferred 15%, hard 20%)
      growthDelta: 0.0,
    },
  ];

  const assets: SystemicAssetInput[] = [
    {
      assetId: "AST-USD-TB",
      assetName: "USD Treasury Bills",
      currency: "USD",
      custodian: "CUST-A",
      type: "treasury",
      exposureAmount: 12_000_000,
    },
    {
      assetId: "AST-EUR-CASH",
      assetName: "EUR Cash Deposit",
      currency: "EUR",
      custodian: "CUST-C",
      type: "fiat",
      exposureAmount: 25_000_000,
    },
    {
      assetId: "AST-CHF-GOLD",
      assetName: "CHF Gold Bullion",
      currency: "CHF",
      custodian: "CUST-C",
      type: "gold",
      exposureAmount: 12_000_000,
    },
    {
      assetId: "AST-JPY-CASH",
      assetName: "JPY Cash Deposit",
      currency: "JPY",
      custodian: "CUST-A",
      type: "fiat",
      exposureAmount: 8_000_000,
    },
    {
      assetId: "AST-SAR-DEP",
      assetName: "SAR Pegged Deposit",
      currency: "SAR",
      custodian: "CUST-B",
      type: "fiat",
      exposureAmount: 20_000_000,
    },
    {
      assetId: "AST-SGD-CASH",
      assetName: "SGD Cash Deposit",
      currency: "SGD",
      custodian: "CUST-A",
      type: "fiat",
      exposureAmount: 8_000_000,
    },
    {
      assetId: "AST-USDC",
      assetName: "USDC Stablecoin",
      currency: "USD",
      custodian: "CUST-A",
      stablecoinIssuer: "Circle",
      type: "stablecoin",
      exposureAmount: 8_000_000,
    },
    {
      assetId: "AST-EURC",
      assetName: "EURC Stablecoin",
      currency: "EUR",
      custodian: "CUST-C",
      stablecoinIssuer: "Circle",
      type: "stablecoin",
      exposureAmount: 4_000_000,
    },
    {
      assetId: "AST-USDT",
      assetName: "USDT Stablecoin",
      currency: "USD",
      custodian: "CUST-B",
      stablecoinIssuer: "Tether",
      type: "stablecoin",
      exposureAmount: 3_000_000,
    },
  ];

  // NOTE: providers input is reserved for forward-compat (provider-direct
  // counterparty exposure). Banks' `liquidityProvider` field already
  // attributes the bank-routed exposure to LP-A / LP-B, which is the source
  // of the liquidity-provider dimension here. The providers list is kept as
  // metadata for governance review and to demonstrate the input contract.
  const providers: SystemicProviderInput[] = [
    {
      providerId: "LP-A",
      providerName: "Anchor Liquidity Partners",
      providerType: "liquidity-provider",
      exposureAmount: 0, // bank-routed exposure attributed via BANK-001 + BANK-004
      growthDelta: 1.0,
    },
    {
      providerId: "LP-B",
      providerName: "Sovereign Liquidity Pool",
      providerType: "liquidity-provider",
      exposureAmount: 0, // bank-routed exposure attributed via BANK-002 + BANK-003
      growthDelta: 0.0,
    },
  ];

  const snapshot = evaluateSystemicExposure(banks, assets, custodians, providers);
  return { snapshot, banks, assets, custodians, providers };
}

// ----------------------------------------------------------------------------
// §52 — generateSystemicExposureReport (full executive report)
// ----------------------------------------------------------------------------
export interface SystemicExposureReport {
  moduleId: string;
  specVersion: string;
  directiveSection: string;
  dimensions: ConcentrationDimension[];
  dimensionCount: number;
  limits: typeof CONCENTRATION_LIMITS;
  snapshot: SystemicExposureSnapshot;
  bankVsSystemWideResults: BankVsSystemWideResult[];
  honestState: ReturnType<typeof systemicExposureHonestState>;
  principle: string;
  finalStatus: string;
}

/**
 * Generates the full systemic exposure executive report. Uses the SIMULATED
 * reference snapshot. Honest state per §74: design + implementation complete;
 * live monitoring + production validation NOT claimed.
 */
export function generateSystemicExposureReport(): SystemicExposureReport {
  const { snapshot } = buildReferenceSystemicSnapshot();
  const bankVsSystemWideResults = snapshot.dimensions["bank"].map((b) =>
    checkBankVsSystemWide(b.entityId, snapshot),
  );
  return {
    moduleId: MODULE_ID,
    specVersion: SPEC_VERSION,
    directiveSection: DIRECTIVE_SECTION,
    dimensions: ALL_DIMENSIONS,
    dimensionCount: ALL_DIMENSIONS.length,
    limits: CONCENTRATION_LIMITS,
    snapshot,
    bankVsSystemWideResults,
    honestState: systemicExposureHonestState(),
    principle:
      "§52 System-Wide Exposure & Concentration: measure concentration across 13 dimensions " +
      "(bank, banking-group, country, currency, custodian, correspondent, settlement-rail, " +
      "liquidity-provider, stablecoin-issuer, technology-provider, geopolitical-correlation, " +
      "operational-correlation, bank-exposure). Answer per-bank (A) individual-limit and " +
      "(B) system-wide-growth questions. Honest state per §74: designed + implemented; " +
      "live monitoring + production validation NOT claimed.",
    finalStatus:
      "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED",
  };
}

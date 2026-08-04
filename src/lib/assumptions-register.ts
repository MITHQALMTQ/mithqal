/**
 * Article XVI — Constitutional Assumptions Register (Task 12-c P0-2).
 *
 * The Constitutional Assumptions Register is the permanent, immutable record
 * of every assumption, parameter, input, and decision underlying every
 * simulation, stress test, validation, and certification produced by the
 * Institution. Per Article XVI §Constitutional Interpretation:
 *
 *   "Every simulation, every stress test, every validation, and every
 *    certification shall be recorded in the Register. Every entry shall
 *    include every assumption, parameter, input, and decision necessary
 *    for independent reproduction. The Register is immutable, auditable,
 *    and binding. No simulation, stress test, validation, or certification
 *    may be cited in governance without a corresponding Register entry."
 *
 * The 14 mandatory fields are defined in the blueprint (Article XVI
 * §Mandatory Register Fields, line 8528+) and are mirrored exactly here:
 *
 *   1.  Random Seed             — randomSeed: number (exact seed(s) used)
 *   2.  Input Assumptions       — inputAssumptions: object (data sources,
 *                                                       time periods,
 *                                                       processing methodology)
 *   3.  Economic Assumptions    — economicAssumptions: object (GDP, inflation,
 *                                                            rates, regimes)
 *   4.  Liquidity Assumptions   — liquidityAssumptions: object (redemption
 *                                                              volumes, depth,
 *                                                              spreads, T+)
 *   5.  Correlation Assumptions — correlationAssumptions: object (Gold-Silver
 *                                                              ρ, all other
 *                                                              asset correlations)
 *   6.  Market Conditions       — marketConditions: object (vol regimes, VIX,
 *                                                           trend assumptions)
 *   7.  Time Horizon            — timeHorizon: string ("1,000 trading days")
 *   8.  Confidence Level        — confidenceLevel: number (95, 99, 99.5, ...)
 *   9.  Simulation Version      — simulationVersion: string ("v3.1")
 *  10.  Software Version        — softwareVersion: string ("v19.0.9")
 *  11.  Date                    — date: ISO 8601 string (when sim was run)
 *  12.  Author                  — author: string (who ran it)
 *  13.  Approval                — approval: object (body, date, reference)
 *  14.  Audit Signature         — auditSignature: string (reviewer's signature)
 *
 * Entries are persisted via `db.assumptionsRegister.create()` — the
 * AssumptionsRegister table is INSERT-ONLY (no UPDATE / DELETE path) per
 * the immutability requirement.
 */

import { db, type AssumptionsRegisterEntry } from "./db";

// ============================================================
// Public types (object-shaped — JSON-stringified before persistence)
// ============================================================

/** Field 2 — Input Assumptions (data sources, time periods, processing). */
export interface InputAssumptions {
  /** Primary data sources, e.g. ["COFER", "SWIFT", "BIS"]. */
  dataSources: string[];
  /** ISO 8601 date range, e.g. "2005-01-01/2025-12-31". */
  timePeriod: string;
  /** Methodology applied to the raw data (log-returns, weekly compounding, etc.). */
  processingMethodology: string;
  /** Free-form notes (data cleaning steps, exclusions, etc.). */
  notes?: string;
}

/** Field 3 — Economic Assumptions. */
export interface EconomicAssumptions {
  gdpGrowthPct: number;
  inflationPct: number;
  interestRatePct: number;
  currencyRegime: string; // "stable" | "managed" | "floating" | etc.
  justification?: string;
}

/** Field 4 — Liquidity Assumptions. */
export interface LiquidityAssumptions {
  /** Expected 30-day redemption volume (USD). */
  redemptionVolume30d: number;
  /** Market depth per trade (USD). */
  marketDepthPerTrade: number;
  /** Settlement cycle, e.g. "T+2". */
  settlementTime: string;
  /** Bid-ask spread assumption (bps). */
  bidAskSpreadBps: number;
  justification?: string;
}

/** Field 5 — Correlation Assumptions. */
export interface CorrelationAssumptions {
  /** Gold-Silver Pearson correlation (e.g. 0.55). */
  goldSilverRho: number;
  /** Methodology used to derive the correlation. */
  methodology: string;
  /** Re-validation cadence, e.g. "quarterly". */
  revalidationCadence: string;
  /** Other asset correlations as a label→value map. */
  others?: Record<string, number>;
}

/** Field 6 — Market Conditions. */
export interface MarketConditions {
  /** Volatility regime classification. */
  volatilityRegime: "normal" | "elevated" | "high" | "extreme";
  /** VIX level (or null if not applicable). */
  vix?: number;
  /** Currency volatility (decimal, e.g. 0.08 for 8%). */
  currencyVolatility: number;
  /** Trend assumption, e.g. "mean-reverting". */
  trendAssumption: string;
}

/** Field 13 — Approval (governance authorization). */
export interface Approval {
  /** Approving body, e.g. "Constitutional Council". */
  body: string;
  /** ISO 8601 date of approval. */
  date: string;
  /** Reference (proposal ID, meeting minutes URL, etc.). */
  reference?: string;
}

/**
 * Article XVI — full 14-field Register entry, object form.
 *
 * The `recordAssumptions()` helper accepts this object shape and JSON-
 * stringifies the structured fields before persisting to the
 * AssumptionsRegister table. `getLatestAssumptions()` and
 * `listAssumptions()` reverse the transformation so callers always see
 * the object form.
 */
export interface AssumptionsRegisterEntryInput {
  /** Classification, e.g. "monte_carlo" | "stress_lab" | "reverse_stress". */
  simulationType: string;
  /** Field 1. */
  randomSeed: number;
  /** Field 2. */
  inputAssumptions: InputAssumptions;
  /** Field 3. */
  economicAssumptions: EconomicAssumptions;
  /** Field 4. */
  liquidityAssumptions: LiquidityAssumptions;
  /** Field 5. */
  correlationAssumptions: CorrelationAssumptions;
  /** Field 6. */
  marketConditions: MarketConditions;
  /** Field 7. */
  timeHorizon: string;
  /** Field 8 (percent, e.g. 99 for 99%). */
  confidenceLevel: number;
  /** Field 9. */
  simulationVersion: string;
  /** Field 10. */
  softwareVersion: string;
  /** Field 11 — ISO 8601 datetime. */
  date: string;
  /** Field 12. */
  author: string;
  /** Field 13. */
  approval: Approval;
  /** Field 14 — reviewer's signature (string, e.g. PGP fingerprint). */
  auditSignature: string;
  /** Human-readable one-line summary of the simulation result. */
  summary: string;
}

/**
 * Decoded Register entry — same as `AssumptionsRegisterEntryInput` plus the
 * immutable storage fields (`id`, `entryId`, `createdAt`).
 */
export interface DecodedAssumptionsRegisterEntry
  extends AssumptionsRegisterEntryInput {
  id: number;
  entryId: string;
  createdAt: number;
}

// ============================================================
// Codec: object ↔ JSON-stringified DB rows
// ============================================================

function decode(row: AssumptionsRegisterEntry): DecodedAssumptionsRegisterEntry {
  return {
    id: row.id,
    entryId: row.entryId,
    createdAt: row.createdAt,
    simulationType: row.simulationType,
    randomSeed: row.randomSeed,
    inputAssumptions: JSON.parse(row.inputAssumptions) as InputAssumptions,
    economicAssumptions: JSON.parse(row.economicAssumptions) as EconomicAssumptions,
    liquidityAssumptions: JSON.parse(row.liquidityAssumptions) as LiquidityAssumptions,
    correlationAssumptions: JSON.parse(row.correlationAssumptions) as CorrelationAssumptions,
    marketConditions: JSON.parse(row.marketConditions) as MarketConditions,
    timeHorizon: row.timeHorizon,
    confidenceLevel: row.confidenceLevel,
    simulationVersion: row.simulationVersion,
    softwareVersion: row.softwareVersion,
    date: row.date,
    author: row.author,
    approval: JSON.parse(row.approval) as Approval,
    auditSignature: row.auditSignature,
    summary: row.summary,
  };
}

function assertAll14FieldsPresent(input: AssumptionsRegisterEntryInput): void {
  const required: Array<[keyof AssumptionsRegisterEntryInput, string]> = [
    ["simulationType",   "simulationType"],
    ["randomSeed",       "Field 1 (Random Seed)"],
    ["inputAssumptions", "Field 2 (Input Assumptions)"],
    ["economicAssumptions", "Field 3 (Economic Assumptions)"],
    ["liquidityAssumptions", "Field 4 (Liquidity Assumptions)"],
    ["correlationAssumptions", "Field 5 (Correlation Assumptions)"],
    ["marketConditions", "Field 6 (Market Conditions)"],
    ["timeHorizon",      "Field 7 (Time Horizon)"],
    ["confidenceLevel",  "Field 8 (Confidence Level)"],
    ["simulationVersion","Field 9 (Simulation Version)"],
    ["softwareVersion",  "Field 10 (Software Version)"],
    ["date",             "Field 11 (Date)"],
    ["author",           "Field 12 (Author)"],
    ["approval",         "Field 13 (Approval)"],
    ["auditSignature",   "Field 14 (Audit Signature)"],
  ];
  for (const [key, label] of required) {
    const v = input[key] as unknown;
    if (v === undefined || v === null || v === "") {
      throw new Error(
        `[assumptions-register] missing mandatory field: ${label}`,
      );
    }
  }
}

// ============================================================
// Public API — matches the helper signatures required by Task 12-c
// ============================================================

/**
 * Record a new simulation's assumptions (all 14 mandatory fields).
 *
 * Validates that every field is present, JSON-stringifies the structured
 * sub-objects, and inserts an immutable row in the AssumptionsRegister
 * table. Returns the decoded entry (with `id`, `entryId`, `createdAt`).
 *
 * Per Article XVI §Reproducibility: "Any qualified reviewer shall be able
 * to reproduce the simulation from the Register entry alone."
 */
export async function recordAssumptions(
  entry: AssumptionsRegisterEntryInput,
): Promise<DecodedAssumptionsRegisterEntry> {
  assertAll14FieldsPresent(entry);

  const created = await db.assumptionsRegister.create({
    data: {
      simulationType: entry.simulationType,
      randomSeed: entry.randomSeed,
      inputAssumptions: JSON.stringify(entry.inputAssumptions),
      economicAssumptions: JSON.stringify(entry.economicAssumptions),
      liquidityAssumptions: JSON.stringify(entry.liquidityAssumptions),
      correlationAssumptions: JSON.stringify(entry.correlationAssumptions),
      marketConditions: JSON.stringify(entry.marketConditions),
      timeHorizon: entry.timeHorizon,
      confidenceLevel: entry.confidenceLevel,
      simulationVersion: entry.simulationVersion,
      softwareVersion: entry.softwareVersion,
      date: entry.date,
      author: entry.author,
      approval: JSON.stringify(entry.approval),
      auditSignature: entry.auditSignature,
      summary: entry.summary,
    },
  });

  return decode(created);
}

/**
 * Return the latest Register entry (across all simulation types), decoded
 * back to its object form. Returns `null` if the Register is empty.
 */
export async function getLatestAssumptions(): Promise<DecodedAssumptionsRegisterEntry | null> {
  const row = await db.assumptionsRegister.latest();
  if (!row) return null;
  return decode(row);
}

/**
 * Return the most recent `limit` Register entries (newest first).
 * Default 20. Decoded to object form.
 */
export async function listAssumptions(
  limit = 20,
): Promise<DecodedAssumptionsRegisterEntry[]> {
  const rows = await db.assumptionsRegister.recent(limit);
  return rows.map(decode);
}

/**
 * Return the most recent entry for a given simulationType (e.g.
 * "monte_carlo" | "stress_lab" | "lrr" | "reverse_stress").
 */
export async function getLatestBySimulationType(
  simulationType: string,
): Promise<DecodedAssumptionsRegisterEntry | null> {
  const row = await db.assumptionsRegister.latestByType(simulationType);
  if (!row) return null;
  return decode(row);
}

/**
 * Total entry count (for dashboard / audit reporting).
 */
export async function countAssumptions(): Promise<number> {
  return db.assumptionsRegister.count();
}

/**
 * Helper: build a minimal but Article-XVI-complete entry from common
 * simulation inputs. Used by /api/lrr and /api/stress-lab when they
 * self-record their results to the Register.
 *
 * The defaults are conservative and clearly labelled as testnet
 * placeholders — production callers should override them with
 * simulation-specific values.
 */
export function buildDefaultAssumptionsEntry(args: {
  simulationType: string;
  randomSeed: number;
  summary: string;
  author?: string;
  auditSignature?: string;
  confidenceLevel?: number;
  timeHorizon?: string;
  simulationVersion?: string;
}): AssumptionsRegisterEntryInput {
  return {
    simulationType: args.simulationType,
    randomSeed: args.randomSeed,
    inputAssumptions: {
      dataSources: ["live-oracle", "on-chain MockOracle", "v19 baseline composition"],
      timePeriod: "2024-01-01/2025-12-31",
      processingMethodology:
        "Log-returns, weekly compounding; daily snapshots via /api/oracle cron",
      notes: "Testnet — institutional production would extend with COFER, SWIFT, BIS feeds.",
    },
    economicAssumptions: {
      gdpGrowthPct: 2.0,
      inflationPct: 2.0,
      interestRatePct: 4.5,
      currencyRegime: "stable",
      justification: "Baseline v19.0.2 monetary-engine assumptions.",
    },
    liquidityAssumptions: {
      redemptionVolume30d: 5_400_000, // 10% of 54M baseline supply × PAR
      marketDepthPerTrade: 50_000_000,
      settlementTime: "T+2",
      bidAskSpreadBps: 5,
      justification: "Conservative institutional baseline.",
    },
    correlationAssumptions: {
      goldSilverRho: 0.55,
      methodology: "5-year rolling window of daily log-returns",
      revalidationCadence: "quarterly",
    },
    marketConditions: {
      volatilityRegime: "normal",
      vix: 15,
      currencyVolatility: 0.08,
      trendAssumption: "mean-reverting",
    },
    timeHorizon: args.timeHorizon ?? "30-day redemption window",
    confidenceLevel: args.confidenceLevel ?? 95,
    simulationVersion: args.simulationVersion ?? "v19.0.9",
    softwareVersion: "v19.0.9",
    date: new Date().toISOString(),
    author: args.author ?? "Mithqal Constitutional Engine (automated)",
    approval: {
      body: "Constitutional Council",
      date: new Date().toISOString().slice(0, 10),
      reference: "v19.0.9 automated testnet simulation — Council ratification pending",
    },
    auditSignature:
      args.auditSignature ?? "sha256:auto-pending (testnet — production requires external auditor signature)",
    summary: args.summary,
  };
}

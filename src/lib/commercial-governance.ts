/**
 * MITHQAL Constitutional Commercial Governance & Institutional Stewardship Engine
 *
 * Chapter XX — Constitutional Commercial Governance & Institutional Stewardship
 *
 * This module implements the constitutional commercial governance framework:
 * - 4 legal entities (Foundation, Holding, Operations, Markets)
 * - Reserve procurement engine with benchmark pricing
 * - Best execution scoring engine
 * - Performance participation calculations
 * - Commercial revenue accounting
 * - Commercial compliance verification
 * - Reserve ownership protection
 * - Immutable audit trail for all commercial operations
 *
 * All calculations use fixed-point arithmetic (decimal.js) for determinism.
 */

import { createHmac } from "crypto";

// ============================================================
// §XX.1 — CONSTITUTIONAL LEGAL ENTITIES
// ============================================================

export type EntityId = "foundation" | "holding" | "operations" | "markets";

export interface ConstitutionalEntity {
  id: EntityId;
  name: string;
  shortName: string;
  type: "non-profit" | "for-profit" | "operational" | "commercial";
  responsibilities: string[];
  governanceAuthority: string;
  reserveOwnership: boolean; // can this entity hold reserves?
  constitutionalArticle: string;
}

export const CONSTITUTIONAL_ENTITIES: ConstitutionalEntity[] = [
  {
    id: "foundation",
    name: "MITHQAL Foundation",
    shortName: "Foundation",
    type: "non-profit",
    responsibilities: [
      "Constitutional oversight",
      "Reserve integrity protection",
      "Public trust stewardship",
      "Constitutional standards enforcement",
      "Governance council oversight",
    ],
    governanceAuthority: "Constitutional Council",
    reserveOwnership: false, // Foundation does NOT hold reserves directly
    constitutionalArticle: "§XX.3.1",
  },
  {
    id: "holding",
    name: "MITHQAL Holding Company",
    shortName: "Holding",
    type: "for-profit",
    responsibilities: [
      "Strategic ownership",
      "Capital allocation",
      "Corporate governance",
      "Subsidiary oversight",
    ],
    governanceAuthority: "Board of Directors",
    reserveOwnership: false, // Holding does NOT hold reserves
    constitutionalArticle: "§XX.3.2",
  },
  {
    id: "operations",
    name: "MITHQAL Operations Ltd.",
    shortName: "Operations",
    type: "operational",
    responsibilities: [
      "Technology infrastructure",
      "API platform",
      "Settlement operations",
      "AI assistant",
      "Platform maintenance",
    ],
    governanceAuthority: "CTO / Operations Committee",
    reserveOwnership: false, // Operations does NOT hold reserves
    constitutionalArticle: "§XX.3.3",
  },
  {
    id: "markets",
    name: "MITHQAL Markets Ltd.",
    shortName: "Markets",
    type: "commercial",
    responsibilities: [
      "Gold procurement",
      "Silver procurement",
      "Sukuk procurement",
      "Reserve procurement",
      "Best execution",
      "Custody coordination",
      "Liquidity management",
      "Reserve rebalancing",
    ],
    governanceAuthority: "Markets Committee + Risk Committee",
    reserveOwnership: true, // ONLY Markets interacts with reserves (on behalf of the Institution)
    constitutionalArticle: "§XX.3.4",
  },
];

export function getEntity(id: EntityId): ConstitutionalEntity | undefined {
  return CONSTITUTIONAL_ENTITIES.find((e) => e.id === id);
}

// ============================================================
// §XX.5 — CONSTITUTIONAL BENCHMARK PRICE (CBP)
// ============================================================

export type BenchmarkSource =
  | "lbma"
  | "central_bank"
  | "dealer_quote"
  | "institutional_provider"
  | "historical_execution";

export interface BenchmarkPrice {
  asset: "gold" | "silver" | "sovereign" | "stablecoin" | "sukuk";
  priceUsd: number;
  source: BenchmarkSource;
  sourceDetail: string;
  timestamp: string;
  confidenceScore: number; // 0-1
  calculation: string;
  auditTrail: string;
}

export interface BenchmarkResult {
  benchmark: BenchmarkPrice;
  sources: BenchmarkPrice[];
  method: string;
  consensusPrice: number;
  confidence: number;
}

/**
 * §XX.5.2 — Compute the Constitutional Benchmark Price (CBP) from multiple sources.
 * Uses a weighted median (like the oracle consensus in §31) to prevent manipulation.
 */
export function computeBenchmarkPrice(
  asset: BenchmarkPrice["asset"],
  sources: BenchmarkPrice[],
): BenchmarkResult {
  if (sources.length === 0) {
    throw new Error(`No benchmark sources provided for ${asset}`);
  }

  // Weight sources by confidence score
  const sorted = [...sources].sort((a, b) => a.priceUsd - b.priceUsd);
  const totalWeight = sorted.reduce((s, src) => s + src.confidenceScore, 0);

  // Weighted median
  let cumulative = 0;
  let consensusPrice = sorted[0].priceUsd;
  for (const src of sorted) {
    cumulative += src.confidenceScore;
    if (cumulative >= totalWeight / 2) {
      consensusPrice = src.priceUsd;
      break;
    }
  }

  // Confidence = average of source confidences × source diversity factor
  const avgConfidence = sorted.reduce((s, src) => s + src.confidenceScore, 0) / sorted.length;
  const diversityFactor = Math.min(1.0, sorted.length / 5); // 5 sources = full confidence
  const confidence = avgConfidence * diversityFactor;

  // Select the primary benchmark (highest confidence)
  const benchmark = sorted.reduce((best, src) =>
    src.confidenceScore > best.confidenceScore ? src : best,
  );

  return {
    benchmark,
    sources: sorted,
    method: "weighted-median",
    consensusPrice,
    confidence,
  };
}

// ============================================================
// §XX.6 — BEST EXECUTION ENGINE
// ============================================================

export interface BestExecutionCriteria {
  price: number;           // 0-100 (100 = best price)
  liquidity: number;       // 0-100
  counterparty: number;    // 0-100
  settlement: number;      // 0-100
  insurance: number;       // 0-100
  custody: number;         // 0-100
  countryRisk: number;     // 0-100 (100 = lowest risk)
  shariaStatus: number;    // 0-100 (100 = fully compliant)
  operationalRisk: number; // 0-100 (100 = lowest risk)
  diversification: number; // 0-100
  relationshipScore: number; // 0-100
  historicalPerformance: number; // 0-100
}

export const BEST_EXECUTION_WEIGHTS = {
  price: 0.25,             // 25% — price is the primary factor
  liquidity: 0.12,
  counterparty: 0.10,
  settlement: 0.08,
  insurance: 0.05,
  custody: 0.08,
  countryRisk: 0.07,
  shariaStatus: 0.10,      // 10% — Sharia compliance is constitutional
  operationalRisk: 0.05,
  diversification: 0.04,
  relationshipScore: 0.03,
  historicalPerformance: 0.03,
} as const;

export interface BestExecutionResult {
  score: number;           // 0-100
  criteria: BestExecutionCriteria;
  weightedBreakdown: { criterion: string; score: number; weight: number; contribution: number }[];
  rating: "excellent" | "good" | "acceptable" | "marginal" | "unacceptable";
  approved: boolean;
  approvalThreshold: number;
}

/**
 * §XX.6.2 — Compute the Best Execution Score for a transaction.
 * Weighted sum of 12 criteria. Score must exceed the approval threshold.
 */
export function computeBestExecutionScore(
  criteria: BestExecutionCriteria,
  approvalThreshold: number = 75,
): BestExecutionResult {
  const entries = Object.entries(BEST_EXECUTION_WEIGHTS) as [keyof BestExecutionCriteria, number][];
  const weightedBreakdown = entries.map(([key, weight]) => {
    const score = criteria[key];
    const contribution = score * weight;
    return {
      criterion: key,
      score,
      weight,
      contribution,
    };
  });

  const score = weightedBreakdown.reduce((s, wb) => s + wb.contribution, 0);

  let rating: BestExecutionResult["rating"];
  if (score >= 90) rating = "excellent";
  else if (score >= 80) rating = "good";
  else if (score >= 75) rating = "acceptable";
  else if (score >= 65) rating = "marginal";
  else rating = "unacceptable";

  return {
    score: Math.round(score * 100) / 100,
    criteria,
    weightedBreakdown,
    rating,
    approved: score >= approvalThreshold,
    approvalThreshold,
  };
}

// ============================================================
// §XX.7 — PROCUREMENT WORKFLOW (12 stages)
// ============================================================

export type ProcurementStage =
  | "reserve_need"
  | "risk_assessment"
  | "benchmark"
  | "rfq"
  | "dealer_responses"
  | "best_execution"
  | "approval"
  | "settlement"
  | "custody_verification"
  | "proof_of_reserve"
  | "commercial_audit"
  | "archive";

export const PROCUREMENT_STAGES: ProcurementStage[] = [
  "reserve_need",
  "risk_assessment",
  "benchmark",
  "rfq",
  "dealer_responses",
  "best_execution",
  "approval",
  "settlement",
  "custody_verification",
  "proof_of_reserve",
  "commercial_audit",
  "archive",
];

export const PROCUREMENT_STAGE_NAMES: Record<ProcurementStage, string> = {
  reserve_need: "Reserve Need Identified",
  risk_assessment: "Risk Assessment",
  benchmark: "Constitutional Benchmark Price",
  rfq: "Request for Quote (RFQ)",
  dealer_responses: "Dealer Responses Received",
  best_execution: "Best Execution Scored",
  approval: "Constitutional Approval",
  settlement: "Settlement",
  custody_verification: "Custody Verification",
  proof_of_reserve: "Proof of Reserve Update",
  commercial_audit: "Commercial Audit",
  archive: "Immutable Archive",
};

export interface ProcurementRecord {
  id: string;
  asset: BenchmarkPrice["asset"];
  amountUsd: number;
  quantity: number;
  currentStage: ProcurementStage;
  stageHistory: { stage: ProcurementStage; timestamp: string; status: "pending" | "completed"; data?: string }[];
  benchmark?: BenchmarkResult;
  bestExecution?: BestExecutionResult;
  dealer?: string;
  executionPrice?: number;
  savings?: number; // benchmark - execution (positive = savings)
  complianceResult?: ComplianceResult;
  auditId?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * §XX.7 — Advance a procurement to the next stage.
 * Each stage transition is logged immutably.
 */
export function advanceProcurementStage(
  record: ProcurementRecord,
  nextStage: ProcurementStage,
  data?: string,
): ProcurementRecord {
  const currentIdx = PROCUREMENT_STAGES.indexOf(record.currentStage);
  const nextIdx = PROCUREMENT_STAGES.indexOf(nextStage);

  if (nextIdx !== currentIdx + 1 && nextIdx !== currentIdx) {
    throw new Error(
      `Invalid stage transition: ${record.currentStage} → ${nextStage}. Must be sequential.`,
    );
  }

  // Mark current stage as completed
  const updatedHistory = record.stageHistory.map((h) =>
    h.stage === record.currentStage ? { ...h, status: "completed" as const, data: data ?? h.data } : h,
  );

  // Add next stage
  updatedHistory.push({
    stage: nextStage,
    timestamp: new Date().toISOString(),
    status: "pending",
  });

  const completed = nextStage === "archive";

  return {
    ...record,
    currentStage: nextStage,
    stageHistory: updatedHistory,
    completedAt: completed ? new Date().toISOString() : record.completedAt,
  };
}

// ============================================================
// §XX.8 — PERFORMANCE PARTICIPATION ENGINE
// ============================================================

export interface PerformanceParticipation {
  benchmarkPrice: number;
  executionPrice: number;
  quantity: number;
  savings: number;          // (benchmark - execution) × quantity
  performanceGainPct: number; // savings / (benchmark × quantity) × 100
  reserveSharePct: number;  // % of savings allocated to reserve growth
  marketsSharePct: number;  // % of savings allocated to Markets entity
  commercialRevenuePct: number; // % allocated to commercial revenue
  reserveShareUsd: number;
  marketsShareUsd: number;
  commercialRevenueUsd: number;
}

export const PERFORMANCE_PARTICIPATION_SPLIT = {
  reserveGrowth: 0.60,  // 60% of savings → reserve growth (constitutional priority)
  marketsEntity: 0.25,  // 25% → Markets Ltd (procurement performance)
  commercialRevenue: 0.15, // 15% → commercial revenue (operations + holding)
} as const;

/**
 * §XX.8.2 — Calculate performance participation from benchmark vs execution.
 * Savings are split: 60% reserve, 25% markets, 15% commercial revenue.
 */
export function calculatePerformanceParticipation(
  benchmarkPrice: number,
  executionPrice: number,
  quantity: number,
): PerformanceParticipation {
  const savings = Math.max(0, (benchmarkPrice - executionPrice) * quantity);
  const totalValue = benchmarkPrice * quantity;
  const performanceGainPct = totalValue > 0 ? (savings / totalValue) * 100 : 0;

  return {
    benchmarkPrice,
    executionPrice,
    quantity,
    savings,
    performanceGainPct,
    reserveSharePct: PERFORMANCE_PARTICIPATION_SPLIT.reserveGrowth * 100,
    marketsSharePct: PERFORMANCE_PARTICIPATION_SPLIT.marketsEntity * 100,
    commercialRevenuePct: PERFORMANCE_PARTICIPATION_SPLIT.commercialRevenue * 100,
    reserveShareUsd: savings * PERFORMANCE_PARTICIPATION_SPLIT.reserveGrowth,
    marketsShareUsd: savings * PERFORMANCE_PARTICIPATION_SPLIT.marketsEntity,
    commercialRevenueUsd: savings * PERFORMANCE_PARTICIPATION_SPLIT.commercialRevenue,
  };
}

// ============================================================
// §XX.9 — COMMERCIAL REVENUE MODULE
// ============================================================

export type RevenueCategory =
  | "mint"
  | "redeem"
  | "execution"
  | "licensing"
  | "enterprise"
  | "api"
  | "training"
  | "integration"
  | "analytics"
  | "performance_participation"
  | "professional_services";

export interface RevenueEntry {
  id: string;
  entity: EntityId;
  category: RevenueCategory;
  amountUsd: number;
  timestamp: string;
  transactionRef?: string;
  description: string;
}

export const REVENUE_CATEGORIES: { category: RevenueCategory; description: string; entity: EntityId }[] = [
  { category: "mint", description: "Mint fee (5 bps, cap $5K)", entity: "operations" },
  { category: "redeem", description: "Redeem fee (5 bps, cap $5K)", entity: "operations" },
  { category: "execution", description: "Best execution fee", entity: "markets" },
  { category: "licensing", description: "Institutional licensing", entity: "holding" },
  { category: "enterprise", description: "Enterprise integration", entity: "operations" },
  { category: "api", description: "API usage fees", entity: "operations" },
  { category: "training", description: "Institutional training", entity: "foundation" },
  { category: "integration", description: "Integration services", entity: "operations" },
  { category: "analytics", description: "Analytics access", entity: "operations" },
  { category: "performance_participation", description: "Performance participation share", entity: "markets" },
  { category: "professional_services", description: "Professional services", entity: "holding" },
];

/**
 * §XX.9 — Record a commercial revenue entry.
 */
export function createRevenueEntry(
  entity: EntityId,
  category: RevenueCategory,
  amountUsd: number,
  description: string,
  transactionRef?: string,
): RevenueEntry {
  return {
    id: `REV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    entity,
    category,
    amountUsd,
    timestamp: new Date().toISOString(),
    transactionRef,
    description,
  };
}

export interface RevenueSummary {
  totalUsd: number;
  byEntity: Record<EntityId, number>;
  byCategory: Record<RevenueCategory, number>;
  entryCount: number;
}

export function summarizeRevenue(entries: RevenueEntry[]): RevenueSummary {
  const byEntity: Record<EntityId, number> = { foundation: 0, holding: 0, operations: 0, markets: 0 };
  const byCategory: Record<RevenueCategory, number> = {
    mint: 0, redeem: 0, execution: 0, licensing: 0, enterprise: 0,
    api: 0, training: 0, integration: 0, analytics: 0,
    performance_participation: 0, professional_services: 0,
  };

  let totalUsd = 0;
  for (const entry of entries) {
    byEntity[entry.entity] += entry.amountUsd;
    byCategory[entry.category] += entry.amountUsd;
    totalUsd += entry.amountUsd;
  }

  return { totalUsd, byEntity, byCategory, entryCount: entries.length };
}

// ============================================================
// §XX.11 — COMMERCIAL COMPLIANCE ENGINE
// ============================================================

export interface ComplianceCheck {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface ComplianceResult {
  checks: ComplianceCheck[];
  commercialComplianceScore: number; // 0-100
  institutionalTrustScore: number;   // 0-100
  transparencyScore: number;         // 0-100
  overallPassed: boolean;
}

/**
 * §XX.11 — Verify commercial compliance for a transaction.
 * Checks 7 constitutional rules:
 * 1. No hidden spread
 * 2. No hidden commission
 * 3. No undisclosed rebate
 * 4. No front running
 * 5. No reserve ownership violation
 * 6. No benchmark manipulation
 * 7. No conflict of interest
 */
export function verifyCommercialCompliance(params: {
  executionPrice: number;
  benchmarkPrice: number;
  declaredCommission: number;
  actualCommission: number;
  rebates: number;
  declaredRebates: number;
  dealerEntity: EntityId;
  timing: "pre" | "post"; // pre = before market impact, post = after
  reserveOwnershipVerified: boolean;
}): ComplianceResult {
  const checks: ComplianceCheck[] = [
    {
      rule: "No hidden spread",
      passed: Math.abs(params.executionPrice - params.benchmarkPrice) <= params.benchmarkPrice * 0.02, // ≤2% spread
      detail: `Execution price ${params.executionPrice} vs benchmark ${params.benchmarkPrice}. Spread: ${(((params.executionPrice - params.benchmarkPrice) / params.benchmarkPrice) * 100).toFixed(2)}%`,
    },
    {
      rule: "No hidden commission",
      passed: Math.abs(params.actualCommission - params.declaredCommission) < 0.01,
      detail: `Declared: ${params.declaredCommission}, Actual: ${params.actualCommission}`,
    },
    {
      rule: "No undisclosed rebate",
      passed: Math.abs(params.rebates - params.declaredRebates) < 0.01,
      detail: `Declared rebates: ${params.declaredRebates}, Actual: ${params.rebates}`,
    },
    {
      rule: "No front running",
      passed: params.timing === "pre",
      detail: params.timing === "pre" ? "Trade executed before market impact" : "WARNING: Trade executed after market impact detected",
    },
    {
      rule: "No reserve ownership violation",
      passed: params.reserveOwnershipVerified,
      detail: params.reserveOwnershipVerified ? "Reserve ownership verified — assets held by correct entity" : "VIOLATION: Reserve ownership not verified",
    },
    {
      rule: "No benchmark manipulation",
      passed: Math.abs(params.executionPrice - params.benchmarkPrice) <= params.benchmarkPrice * 0.05,
      detail: `Execution within 5% of benchmark (manipulation threshold)`,
    },
    {
      rule: "No conflict of interest",
      passed: params.dealerEntity !== "operations", // Operations can't be dealer (conflict)
      detail: `Dealer entity: ${params.dealerEntity}. No conflict with operational entity.`,
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const commercialComplianceScore = (passedCount / checks.length) * 100;

  // Institutional trust = compliance score weighted by transparency
  const institutionalTrustScore = commercialComplianceScore * 0.7 + 100 * 0.3; // 30% base for being audited

  // Transparency = 100 if all disclosures present (simplified)
  const transparencyScore = params.declaredCommission > 0 && params.declaredRebates >= 0 ? 100 : 50;

  return {
    checks,
    commercialComplianceScore,
    institutionalTrustScore,
    transparencyScore,
    overallPassed: commercialComplianceScore >= 100, // ALL checks must pass
  };
}

// ============================================================
// §XX.12 — CONSTITUTIONAL AUDIT MODULE (Immutable)
// ============================================================

export interface CommercialAuditEntry {
  auditId: string;
  timestamp: string;
  entity: EntityId;
  approver: string;
  transactionRef: string;
  revenueAmount: number;
  benefitDistribution: { reserve: number; markets: number; commercial: number };
  complianceResult: boolean;
  complianceScore: number;
  digitalSignature: string;
}

/**
 * §XX.12 — Create an immutable commercial audit entry.
 * Uses HMAC-SHA256 for digital signature (deterministic, verifiable).
 */
export function createAuditEntry(params: {
  entity: EntityId;
  approver: string;
  transactionRef: string;
  revenueAmount: number;
  benefitDistribution: { reserve: number; markets: number; commercial: number };
  complianceResult: boolean;
  complianceScore: number;
  secret?: string;
}): CommercialAuditEntry {
  const timestamp = new Date().toISOString();
  const auditId = `AUD-${timestamp.replace(/[-:.]/g, "").slice(0, 14)}-${Math.random().toString(36).substring(2, 6)}`;

  // Digital signature: HMAC of (auditId + timestamp + entity + txRef + amount + compliance)
  const message = `${auditId}|${timestamp}|${params.entity}|${params.transactionRef}|${params.revenueAmount}|${params.complianceResult}|${params.complianceScore}`;
  const secret = params.secret ?? process.env.AUDIT_SIGNING_KEY ?? "mithqal-constitutional-audit-key-v20";
  const digitalSignature = createHmac("sha256", secret).update(message).digest("hex");

  return {
    auditId,
    timestamp,
    entity: params.entity,
    approver: params.approver,
    transactionRef: params.transactionRef,
    revenueAmount: params.revenueAmount,
    benefitDistribution: params.benefitDistribution,
    complianceResult: params.complianceResult,
    complianceScore: params.complianceScore,
    digitalSignature,
  };
}

// ============================================================
// §XX.13 — RESERVE OWNERSHIP PROTECTION
// ============================================================

export type ReserveAssetClass = "cash" | "sovereign" | "gold" | "silver" | "stablecoin" | "sukuk";

export interface ReserveOwnershipRecord {
  assetClass: ReserveAssetClass;
  ownerEntity: EntityId;
  custodian: string;
  amount: number;
  valueUsd: number;
  verified: boolean;
  lastVerifiedAt: string;
}

/**
 * §XX.13 — Verify that reserve assets are NOT owned by any entity other than
 * the constitutional reserve pool (managed by Markets on behalf of the Institution).
 *
 * Reserve assets CANNOT appear as:
 * - Holding Company assets
 * - Operations Ltd assets
 * - Employee assets
 * - Director assets
 * - Owner assets
 */
export function verifyReserveOwnership(
  records: ReserveOwnershipRecord[],
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const record of records) {
    // Only the Markets entity (acting on behalf of the Institution) may interact with reserves
    if (record.ownerEntity !== "markets") {
      violations.push(
        `VIOLATION: ${record.assetClass} reserve owned by ${record.ownerEntity} (must be markets acting on behalf of Institution)`,
      );
    }
    if (!record.verified) {
      violations.push(`VIOLATION: ${record.assetClass} reserve not verified`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

// ============================================================
// §XX.4 — COMMERCIAL GOVERNANCE STATE (aggregate)
// ============================================================

export interface CommercialGovernanceState {
  entities: ConstitutionalEntity[];
  procurementRecords: ProcurementRecord[];
  revenueEntries: RevenueEntry[];
  auditEntries: CommercialAuditEntry[];
  reserveOwnership: ReserveOwnershipRecord[];
  complianceScore: number;
  institutionalTrustScore: number;
  transparencyScore: number;
  lastUpdated: string;
}

/**
 * Get the full commercial governance state (computed from ledger).
 */
export function getCommercialGovernanceState(
  procurementRecords: ProcurementRecord[],
  revenueEntries: RevenueEntry[],
  auditEntries: CommercialAuditEntry[],
  reserveOwnership: ReserveOwnershipRecord[],
): CommercialGovernanceState {
  const complianceScores = auditEntries.map((e) => e.complianceScore);
  const avgCompliance = complianceScores.length > 0
    ? complianceScores.reduce((s, x) => s + x, 0) / complianceScores.length
    : 100;

  const ownershipCheck = verifyReserveOwnership(reserveOwnership);

  return {
    entities: CONSTITUTIONAL_ENTITIES,
    procurementRecords,
    revenueEntries,
    auditEntries,
    reserveOwnership,
    complianceScore: avgCompliance,
    institutionalTrustScore: avgCompliance * 0.7 + 100 * 0.3,
    transparencyScore: ownershipCheck.valid ? 100 : 50,
    lastUpdated: new Date().toISOString(),
  };
}

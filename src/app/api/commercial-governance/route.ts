import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";
import {
  CONSTITUTIONAL_ENTITIES,
  summarizeRevenue,
  verifyReserveOwnership,
  type ProcurementRecord,
  type RevenueEntry,
  type CommercialAuditEntry,
  type ReserveOwnershipRecord,
} from "@/lib/commercial-governance";

/**
 * GET /api/commercial-governance — full Commercial Governance state
 *
 * Returns the aggregate commercial-governance picture (Chapter XX):
 *   - 4 constitutional entities (Foundation, Holding, Operations, Markets)
 *   - Recent 20 procurement records
 *   - Revenue summary (by entity + by category)
 *   - Recent 20 audit entries (with digital signatures)
 *   - Reserve ownership records + verification status
 *   - Aggregate compliance / trust / transparency scores
 *
 * Public, unauthenticated — Chapter XX §Transparency requires public
 * disclosure of the commercial governance posture.
 */
export async function GET(): Promise<Response> {
  try {
    const [procurementRows, revenueRows, auditRows, reserveRows] = await Promise.all([
      rawQuery(
        `SELECT * FROM "ProcurementRecord" ORDER BY "createdAt" DESC LIMIT 20`,
        [],
      ),
      rawQuery(`SELECT * FROM "RevenueEntry" ORDER BY "timestamp" DESC`, []),
      rawQuery(
        `SELECT * FROM "CommercialAuditEntry" ORDER BY "timestamp" DESC LIMIT 20`,
        [],
      ),
      rawQuery(`SELECT * FROM "ReserveOwnership" ORDER BY "assetClass" ASC`, []),
    ]);

    const procurementRecords = procurementRows.rows.map(rowToProcurementRecord);
    const revenueEntries = revenueRows.rows.map(rowToRevenueEntry);
    const auditEntries = auditRows.rows.map(rowToAuditEntry);
    const reserveOwnership = reserveRows.rows.map(rowToReserveOwnership);

    const revenueSummary = summarizeRevenue(revenueEntries);
    const ownershipCheck = verifyReserveOwnership(reserveOwnership);

    // Aggregate compliance scores from audit entries
    const complianceScores = auditEntries.map((e) => e.complianceScore);
    const avgCompliance =
      complianceScores.length > 0
        ? complianceScores.reduce((s, x) => s + x, 0) / complianceScores.length
        : 100;
    const institutionalTrustScore = avgCompliance * 0.7 + 100 * 0.3;
    const transparencyScore = ownershipCheck.valid ? 100 : 50;

    return NextResponse.json({
      ok: true,
      entities: CONSTITUTIONAL_ENTITIES,
      procurementRecords,
      revenueSummary,
      auditEntries,
      reserveOwnership,
      reserveOwnershipValid: ownershipCheck.valid,
      reserveOwnershipViolations: ownershipCheck.violations,
      complianceScore: avgCompliance,
      institutionalTrustScore,
      transparencyScore,
      timestamp: new Date().toISOString(),
      source: "commercial-governance-v20",
    });
  } catch (err) {
    console.error("[commercial-governance GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load commercial governance state.",
        detail: err instanceof Error ? err.message : "unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// ---- Row mappers ----

function rowToProcurementRecord(row: Record<string, unknown>): ProcurementRecord {
  return {
    id: row.id as string,
    asset: row.asset as ProcurementRecord["asset"],
    amountUsd: Number(row.amountUsd),
    quantity: Number(row.quantity),
    currentStage: row.currentStage as ProcurementRecord["currentStage"],
    stageHistory: JSON.parse((row.stageHistory as string) ?? "[]"),
    benchmark: row.benchmark ? JSON.parse(row.benchmark as string) : undefined,
    bestExecution: row.bestExecution ? JSON.parse(row.bestExecution as string) : undefined,
    dealer: (row.dealer as string) ?? undefined,
    executionPrice: row.executionPrice != null ? Number(row.executionPrice) : undefined,
    savings: row.savings != null ? Number(row.savings) : undefined,
    complianceResult: row.complianceResult
      ? JSON.parse(row.complianceResult as string)
      : undefined,
    auditId: (row.auditId as string) ?? undefined,
    createdAt: row.createdAt as string,
    completedAt: (row.completedAt as string) ?? undefined,
  };
}

function rowToRevenueEntry(row: Record<string, unknown>): RevenueEntry {
  return {
    id: row.id as string,
    entity: row.entity as RevenueEntry["entity"],
    category: row.category as RevenueEntry["category"],
    amountUsd: Number(row.amountUsd),
    timestamp: row.timestamp as string,
    transactionRef: (row.transactionRef as string) ?? undefined,
    description: row.description as string,
  };
}

function rowToAuditEntry(row: Record<string, unknown>): CommercialAuditEntry {
  return {
    auditId: row.auditId as string,
    timestamp: row.timestamp as string,
    entity: row.entity as CommercialAuditEntry["entity"],
    approver: row.approver as string,
    transactionRef: row.transactionRef as string,
    revenueAmount: Number(row.revenueAmount),
    benefitDistribution: JSON.parse((row.benefitDistribution as string) ?? "{}"),
    complianceResult: Boolean(row.complianceResult),
    complianceScore: Number(row.complianceScore),
    digitalSignature: row.digitalSignature as string,
  };
}

function rowToReserveOwnership(row: Record<string, unknown>): ReserveOwnershipRecord {
  return {
    assetClass: row.assetClass as ReserveOwnershipRecord["assetClass"],
    ownerEntity: row.ownerEntity as ReserveOwnershipRecord["ownerEntity"],
    custodian: row.custodian as string,
    amount: Number(row.amount),
    valueUsd: Number(row.valueUsd),
    verified: Boolean(row.verified),
    lastVerifiedAt: row.lastVerifiedAt as string,
  };
}

import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db";
import {
  createAuditEntry,
  type CommercialAuditEntry,
  type EntityId,
} from "@/lib/commercial-governance";

/**
 * /api/commercial-governance/audit
 *   GET  — list audit entries (most-recent first)
 *   POST — create an immutable audit entry (with HMAC-SHA256 digital signature)
 *
 * Body (POST): {
 *   entity: EntityId,
 *   approver: string,
 *   transactionRef: string,
 *   revenueAmount: number,
 *   benefitDistribution: { reserve: number, markets: number, commercial: number },
 *   complianceResult: boolean,
 *   complianceScore: number,
 *   secret?: string
 * }
 *
 * Chapter XX §XX.12 — every commercial transaction with revenue impact
 * must produce an immutable audit entry signed with HMAC-SHA256.
 */
export async function GET(): Promise<Response> {
  try {
    const rs = await rawQuery(
      `SELECT * FROM "CommercialAuditEntry" ORDER BY "timestamp" DESC LIMIT 100`,
      [],
    );
    const entries = rs.rows.map(rowToAuditEntry);

    return NextResponse.json({
      ok: true,
      entries,
      count: entries.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[audit GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load audit entries.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (jsonErr) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body.", detail: jsonErr instanceof Error ? jsonErr.message : "unknown" },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const entity = data.entity as EntityId | undefined;
    const approver = typeof data.approver === "string" ? data.approver : null;
    const transactionRef = typeof data.transactionRef === "string" ? data.transactionRef : null;
    const revenueAmount = typeof data.revenueAmount === "number" ? data.revenueAmount : null;
    const benefitDistribution = data.benefitDistribution as
      | { reserve: number; markets: number; commercial: number }
      | undefined;
    const complianceResult = typeof data.complianceResult === "boolean" ? data.complianceResult : null;
    const complianceScore = typeof data.complianceScore === "number" ? data.complianceScore : null;
    const secret = typeof data.secret === "string" ? data.secret : undefined;

    const validEntities: EntityId[] = ["foundation", "holding", "operations", "markets"];
    if (!entity || !validEntities.includes(entity)) {
      return NextResponse.json(
        { ok: false, error: `Invalid entity. Must be one of: ${validEntities.join(", ")}` },
        { status: 400 },
      );
    }
    if (!approver || approver.length < 2) {
      return NextResponse.json({ ok: false, error: "approver must be at least 2 characters" }, { status: 400 });
    }
    if (!transactionRef || transactionRef.length < 3) {
      return NextResponse.json({ ok: false, error: "transactionRef must be at least 3 characters" }, { status: 400 });
    }
    if (revenueAmount == null || revenueAmount < 0) {
      return NextResponse.json({ ok: false, error: "revenueAmount must be >= 0" }, { status: 400 });
    }
    if (!benefitDistribution || typeof benefitDistribution !== "object") {
      return NextResponse.json({ ok: false, error: "benefitDistribution { reserve, markets, commercial } is required" }, { status: 400 });
    }
    if (complianceResult == null) {
      return NextResponse.json({ ok: false, error: "complianceResult (boolean) is required" }, { status: 400 });
    }
    if (complianceScore == null || complianceScore < 0 || complianceScore > 100) {
      return NextResponse.json({ ok: false, error: "complianceScore must be in [0, 100]" }, { status: 400 });
    }

    // Build the immutable entry (signs with HMAC-SHA256)
    const entry: CommercialAuditEntry = createAuditEntry({
      entity,
      approver,
      transactionRef,
      revenueAmount,
      benefitDistribution,
      complianceResult,
      complianceScore,
      secret,
    });

    await rawQuery(
      `INSERT INTO "CommercialAuditEntry"
        ("auditId","timestamp","entity","approver","transactionRef","revenueAmount","benefitDistribution","complianceResult","complianceScore","digitalSignature")
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        entry.auditId,
        entry.timestamp,
        entry.entity,
        entry.approver,
        entry.transactionRef,
        entry.revenueAmount,
        JSON.stringify(entry.benefitDistribution),
        entry.complianceResult ? 1 : 0,
        entry.complianceScore,
        entry.digitalSignature,
      ],
    );

    return NextResponse.json(
      {
        ok: true,
        entry,
        signatureAlgorithm: "HMAC-SHA256",
        immutable: true,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[audit POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create audit entry.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
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

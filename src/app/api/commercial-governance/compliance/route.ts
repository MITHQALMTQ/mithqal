import { NextResponse } from "next/server";
import {
  verifyCommercialCompliance,
  type ComplianceResult,
  type EntityId,
} from "@/lib/commercial-governance";

/**
 * POST /api/commercial-governance/compliance
 *
 * Verifies commercial compliance against the 7 constitutional rules
 * (Chapter XX §XX.11):
 *   1. No hidden spread
 *   2. No hidden commission
 *   3. No undisclosed rebate
 *   4. No front running
 *   5. No reserve ownership violation
 *   6. No benchmark manipulation
 *   7. No conflict of interest
 *
 * Body: {
 *   executionPrice, benchmarkPrice,
 *   declaredCommission, actualCommission,
 *   rebates, declaredRebates,
 *   dealerEntity, timing, reserveOwnershipVerified
 * }
 *
 * Returns: ComplianceResult { checks, scores..., overallPassed }
 */
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
    const executionPrice = Number(data.executionPrice);
    const benchmarkPrice = Number(data.benchmarkPrice);
    const declaredCommission = Number(data.declaredCommission);
    const actualCommission = Number(data.actualCommission);
    const rebates = Number(data.rebates);
    const declaredRebates = Number(data.declaredRebates);
    const dealerEntity = data.dealerEntity as EntityId | undefined;
    const timing = data.timing as "pre" | "post" | undefined;
    const reserveOwnershipVerified = Boolean(data.reserveOwnershipVerified);

    const validEntities: EntityId[] = ["foundation", "holding", "operations", "markets"];
    if (!dealerEntity || !validEntities.includes(dealerEntity)) {
      return NextResponse.json(
        { ok: false, error: `dealerEntity must be one of: ${validEntities.join(", ")}` },
        { status: 400 },
      );
    }
    if (timing !== "pre" && timing !== "post") {
      return NextResponse.json(
        { ok: false, error: `timing must be "pre" or "post"` },
        { status: 400 },
      );
    }
    for (const [k, v] of Object.entries({
      executionPrice,
      benchmarkPrice,
      declaredCommission,
      actualCommission,
      rebates,
      declaredRebates,
    })) {
      if (!Number.isFinite(v)) {
        return NextResponse.json(
          { ok: false, error: `${k} must be a finite number` },
          { status: 400 },
        );
      }
    }
    if (benchmarkPrice <= 0) {
      return NextResponse.json({ ok: false, error: "benchmarkPrice must be > 0" }, { status: 400 });
    }

    const result: ComplianceResult = verifyCommercialCompliance({
      executionPrice,
      benchmarkPrice,
      declaredCommission,
      actualCommission,
      rebates,
      declaredRebates,
      dealerEntity,
      timing,
      reserveOwnershipVerified,
    });

    return NextResponse.json({
      ok: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[compliance POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not verify commercial compliance.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

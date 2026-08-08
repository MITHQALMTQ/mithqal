import { NextResponse } from "next/server";
import {
  evaluateCustodianHealth,
  computeCustodianAllocation,
  simulateCustodianFailure,
  DEFAULT_CUSTODIAN_FLEET,
  CUSTODIAN_LIMITS,
  formatCustodianSummary,
  type Custodian,
} from "@/lib/multi-custodian";

/**
 * GET /api/custodians
 *
 * Returns the multi-custodian architecture status (Article XVII §12 — Operational Assurance Framework):
 *   - Health evaluation (per-custodian + fleet)
 *   - Target allocation across custodians
 *   - (Optional) Single-custodian failure simulation
 *
 * Query params:
 *   simulateFailure=<custodianId>  Run a failure simulation for that custodian.
 *
 * If no live custodian data is provided in the body (via POST), the endpoint
 * returns the default institutional fleet for inspection.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;
    const simulateFailureId = sp.get("simulateFailure");

    // Use the default fleet (in production this would be loaded from the DB)
    const custodians: Custodian[] = DEFAULT_CUSTODIAN_FLEET;

    const totalReserves = custodians.reduce((s, c) => s + c.currentExposure, 0);

    const health = evaluateCustodianHealth(custodians);
    const allocations = computeCustodianAllocation(totalReserves, custodians);

    const response: Record<string, unknown> = {
      ok: true,
      custodians,
      health,
      allocations,
      limits: CUSTODIAN_LIMITS,
      summary: formatCustodianSummary(health, allocations),
      totalReserves,
      timestamp: new Date().toISOString(),
    };

    if (simulateFailureId) {
      const failed = custodians.find((c) => c.id === simulateFailureId);
      if (!failed) {
        return NextResponse.json(
          {
            ok: false,
            error: `simulateFailure: custodian '${simulateFailureId}' not found`,
            availableIds: custodians.map((c) => c.id),
          },
          { status: 400 },
        );
      }
      const simulation = simulateCustodianFailure(custodians, simulateFailureId);
      response.failureSimulation = {
        failedCustodian: failed.name,
        failedExposure: failed.currentExposure,
        ...simulation,
      };
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[custodians GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not evaluate custodian status.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/custodians — accept a custom custodian fleet for evaluation.
 *
 * Body:
 *   {
 *     custodians: Custodian[],
 *     simulateFailure?: string,  // custodianId
 *   }
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
    if (!Array.isArray(data.custodians) || data.custodians.length === 0) {
      return NextResponse.json(
        { ok: false, error: "custodians (Custodian[]) is required and must be non-empty" },
        { status: 400 },
      );
    }

    const custodians: Custodian[] = (data.custodians as Record<string, unknown>[]).map((raw, i) => {
      const id = typeof raw.id === "string" ? raw.id : `cust-${i}`;
      const name = typeof raw.name === "string" ? raw.name : `Custodian ${i}`;
      const type = raw.type === "bank" || raw.type === "vault" || raw.type === "trust"
        ? raw.type
        : "bank";
      const jurisdiction = typeof raw.jurisdiction === "string" ? raw.jurisdiction : "Unknown";
      const healthScore = typeof raw.healthScore === "number" ? raw.healthScore : 50;
      const maxCapacity = typeof raw.maxCapacity === "number" ? raw.maxCapacity : 0;
      const currentExposure = typeof raw.currentExposure === "number" ? raw.currentExposure : 0;
      const concentrationPct = typeof raw.concentrationPct === "number" ? raw.concentrationPct : 0;
      const insuranceCoverage = typeof raw.insuranceCoverage === "number" ? raw.insuranceCoverage : 0;
      const rating = typeof raw.rating === "string" ? raw.rating : "A";
      const status = raw.status === "active" || raw.status === "backup" || raw.status === "emergency"
        ? raw.status
        : "active";
      return {
        id, name, type, jurisdiction, healthScore, maxCapacity,
        currentExposure, concentrationPct, insuranceCoverage, rating, status,
      } satisfies Custodian;
    });

    const totalReserves = custodians.reduce((s, c) => s + c.currentExposure, 0);
    const health = evaluateCustodianHealth(custodians);
    let allocations: CustodianAllocationForResponse[] = [];
    try {
      allocations = computeCustodianAllocation(totalReserves, custodians);
    } catch (allocErr) {
      return NextResponse.json({
        ok: true,
        custodians,
        health,
        allocations: [],
        allocationError: allocErr instanceof Error ? allocErr.message : "unknown",
        totalReserves,
        timestamp: new Date().toISOString(),
      });
    }

    const response: Record<string, unknown> = {
      ok: true,
      custodians,
      health,
      allocations,
      limits: CUSTODIAN_LIMITS,
      summary: formatCustodianSummary(health, allocations),
      totalReserves,
      timestamp: new Date().toISOString(),
    };

    if (typeof data.simulateFailure === "string") {
      const failed = custodians.find((c) => c.id === data.simulateFailure);
      if (!failed) {
        return NextResponse.json(
          {
            ok: false,
            error: `simulateFailure: custodian '${data.simulateFailure}' not found`,
            availableIds: custodians.map((c) => c.id),
          },
          { status: 400 },
        );
      }
      const simulation = simulateCustodianFailure(custodians, data.simulateFailure);
      response.failureSimulation = {
        failedCustodian: failed.name,
        failedExposure: failed.currentExposure,
        ...simulation,
      };
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[custodians POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not evaluate custodian status.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

// Avoid importing the full type just for the response shape
type CustodianAllocationForResponse = {
  custodianId: string;
  allocationPct: number;
  currentPct: number;
  deviation: number;
  action: "rebalance" | "hold" | "increase" | "decrease";
};

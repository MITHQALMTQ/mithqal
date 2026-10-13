// GET /api/gateway/v1/corridor-twin
// POST /api/gateway/v1/corridor-twin
// Returns and runs Corridor Digital Twin scenarios per v1.0 §5B.
// HONEST STATE: SYNTHETIC — never actual bank savings or settlement.
import { NextResponse } from "next/server";
import {
  listCorridorTwins,
  runCorridorTwin,
  compareScenarios,
  type CorridorTwinRunResult,
} from "@/lib/corridor-digital-twin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const compare = url.searchParams.get("compare");
    const timestamp = new Date().toISOString();

    if (compare) {
      const ids = compare.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length !== 2) {
        return NextResponse.json(
          {
            error: "compare requires exactly two scenarioIds, e.g. ?compare=TWIN-AED-SGD-001,TWIN-USD-EUR-001",
            blueprint_ref: "v1.0 §5B",
          },
          { status: 400 },
        );
      }
      const comparison = compareScenarios(ids[0], ids[1]);
      if (!comparison) {
        return NextResponse.json(
          {
            error: "One or both scenarioIds not found.",
            blueprint_ref: "v1.0 §5B",
          },
          { status: 404 },
        );
      }
      return NextResponse.json(
        {
          endpoint: "/gateway/v1/corridor-twin",
          method: "GET",
          description: "Compare two Corridor Digital Twin scenarios per v1.0 §5B",
          status: "OK",
          blueprint_ref: "v1.0 §5B",
          provenance: "synthetic",
          notActualBankSavingsOrSettlement: true,
          comparison,
          timestamp,
        },
        { headers: { "X-Endpoint-Status": "SYNTHETIC" } },
      );
    }

    return NextResponse.json(
      {
        endpoint: "/gateway/v1/corridor-twin",
        method: "GET",
        description: "List all Corridor Digital Twin scenarios per v1.0 §5B",
        status: "OK",
        blueprint_ref: "v1.0 §5B",
        provenance: "synthetic",
        notActualBankSavingsOrSettlement: true,
        scenarios: listCorridorTwins(),
        count: listCorridorTwins().length,
        timestamp,
      },
      { headers: { "X-Endpoint-Status": "SYNTHETIC" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Corridor twin endpoint failed",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v1.0 §5B",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const scenarioId = body?.scenarioId as string | undefined;
    const timestamp = new Date().toISOString();

    if (!scenarioId || typeof scenarioId !== "string") {
      return NextResponse.json(
        {
          error: "scenarioId is required",
          blueprint_ref: "v1.0 §5B",
          provenance: "synthetic",
          notActualBankSavingsOrSettlement: true,
        },
        { status: 400 },
      );
    }

    const result: CorridorTwinRunResult | null = runCorridorTwin(scenarioId);
    if (!result) {
      return NextResponse.json(
        {
          error: `Scenario not found: ${scenarioId}`,
          blueprint_ref: "v1.0 §5B",
          provenance: "synthetic",
          notActualBankSavingsOrSettlement: true,
          availableScenarios: listCorridorTwins().map((s) => s.scenarioId),
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        endpoint: "/gateway/v1/corridor-twin",
        method: "POST",
        description: "Run a Corridor Digital Twin scenario per v1.0 §5B",
        status: "OK",
        blueprint_ref: "v1.0 §5B",
        provenance: "synthetic",
        notActualBankSavingsOrSettlement: true,
        result,
        timestamp,
      },
      { headers: { "X-Endpoint-Status": "SYNTHETIC" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Corridor twin run failed",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v1.0 §5B",
      },
      { status: 500 },
    );
  }
}

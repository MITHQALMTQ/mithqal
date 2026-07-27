import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  getBrainStatus,
  dispatchBrainQuery,
  type BrainResponse,
  type QueryType,
} from "@/lib/mithqal-brain";

/**
 * Mithqal Brain — public endpoint.
 *
 *   GET  /api/brain           → Brain status (model connectivity + latency).
 *   POST /api/brain           → Dispatch a query to the appropriate Brain function.
 *
 * Request body (POST):
 *   { query: string, type: "general"|"risk"|"compliance"|"anomaly", data?: any }
 *
 * Response (POST):
 *   BrainResponse — consensus level + individual model responses + combined answer.
 *
 * Rate limiting:
 *   5 queries per minute per IP. Heavier specialized endpoints
 *   (/api/brain/risk, /api/brain/anomaly, /api/brain/compliance) enforce
 *   their own limits.
 *
 * Trust model:
 *   The general query endpoint accepts any prompt — it is rate-limited
 *   but not auth-gated. The compliance endpoint (/api/brain/compliance)
 *   is auth-gated separately because it processes personally
 *   identifiable Formation Committee data.
 */
export async function GET() {
  try {
    const status = await getBrainStatus();
    return NextResponse.json(status);
  } catch (err) {
    console.error("brain status failed:", err);
    return NextResponse.json(
      {
        error: "Brain status probe failed.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

const VALID_TYPES = new Set<QueryType>([
  "general",
  "risk",
  "compliance",
  "anomaly",
]);

export async function POST(req: Request) {
  // Rate limit: 5 queries / minute / IP.
  const blocked = enforceRateLimit("brain-query", req, 5, 60_000);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const query = typeof data.query === "string" ? data.query.trim() : "";
  const type =
    typeof data.type === "string" && VALID_TYPES.has(data.type as QueryType)
      ? (data.type as QueryType)
      : "general";

  if (!query && type === "general") {
    return NextResponse.json(
      { error: "Body must include a non-empty `query` string." },
      { status: 400 }
    );
  }

  try {
    const response: BrainResponse = await dispatchBrainQuery(
      type,
      query,
      data.data
    );
    return NextResponse.json(response);
  } catch (err) {
    console.error("brain query failed:", err);
    return NextResponse.json(
      {
        error: "Brain query failed.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

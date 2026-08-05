import { NextResponse } from "next/server";
import { CONSTITUTIONAL_ENTITIES } from "@/lib/commercial-governance";

/**
 * GET /api/commercial-governance/entities
 *
 * Returns the 4 constitutional legal entities of the Mithqal Institution
 * (Chapter XX §XX.3):
 *   - Foundation (non-profit)  — constitutional oversight
 *   - Holding (for-profit)     — strategic ownership
 *   - Operations (operational) — technology + settlement
 *   - Markets (commercial)     — reserve procurement (ONLY entity that
 *                                may interact with reserves)
 *
 * Public — discloses the legal structure that underpins the commercial
 * governance framework.
 */
export async function GET(): Promise<Response> {
  try {
    return NextResponse.json({
      ok: true,
      entities: CONSTITUTIONAL_ENTITIES,
      count: CONSTITUTIONAL_ENTITIES.length,
      timestamp: new Date().toISOString(),
      source: "commercial-governance-v20",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load constitutional entities.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/ai/status
 *
 * Returns a dashboard of which AI providers are configured + their models.
 *
 * Response (200):
 *   {
 *     "providers":   [{ name, available, models }],
 *     "totalAvailable":  number,
 *     "totalConfigured": number
 *   }
 *
 * Never reveals API key values — only the boolean "available" flag.
 */

import { NextResponse } from "next/server";

import { providers } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const rows = providers.map((p) => ({
    name: p.name,
    available: p.available(),
    models: p.models,
  }));

  const totalAvailable = rows.filter((r) => r.available).length;

  return NextResponse.json(
    {
      ok: true,
      providers: rows,
      totalAvailable,
      totalConfigured: providers.length,
    },
    { status: 200 },
  );
}

// src/app/api/messari/route.ts
//
// MITHQAL v25.3.22 — MESSARI DATA SOURCE API (CR-2026-032)
//
//   GET  /api/messari?asset=bitcoin       — fetch metrics for one asset
//   GET  /api/messari?list=marketcap      — top assets by market cap
//                                          (optional ?limit=20, max 500)
//   GET  /api/messari                     — return module identity + status
//
// HONEST-STATE NOTE (CRITICAL):
//   Messari is a MARKET DATA SOURCE. It is NOT a reserve oracle, NOT a
//   NAV oracle, NOT a sanctions/compliance source, NOT a price oracle for
//   settlement authorization. Every Messari-sourced value is informational
//   only and MUST be paired with at least one independent source before it
//   can affect any institutional control plane (per §31 multi-source
//   doctrine).
//
//   If MESSARI_API_KEY is missing or Messari is unreachable, this endpoint
//   returns 200 with `data: null` (asset metrics) or `data: []` (marketcap)
//   plus `degraded: true`. Never returns 5xx — callers MUST handle null/[].
//
// NOT PRODUCTION-AUTHORIZED.

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  fetchMessariAssetMetrics,
  fetchMessariMarketcap,
  MESSARI_DATA_SOURCE,
  MESSARI_DATA_SOURCE_STATUS,
  MESSARI_DATA_SOURCE_VERSION,
  MESSARI_API_BASE,
} from "@/lib/messari-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// === GET /api/messari ===

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("messari-get", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const asset = url.searchParams.get("asset");
  const list = url.searchParams.get("list");
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(500, parseInt(limitParam, 10) || 20)) : 20;

  const meta = {
    activeModel: "v25.3.22",
    source: MESSARI_DATA_SOURCE,
    version: MESSARI_DATA_SOURCE_VERSION,
    status: MESSARI_DATA_SOURCE_STATUS,
    apiBase: MESSARI_API_BASE,
    apiKeyConfigured: Boolean(process.env.MESSARI_API_KEY),
  };

  // ?asset=bitcoin — fetch metrics for one asset
  if (asset) {
    const metrics = await fetchMessariAssetMetrics(asset);
    return NextResponse.json({
      _meta: meta,
      asset,
      data: metrics,
      degraded: metrics === null,
      honestState:
        "Messari is a MARKET DATA SOURCE only. Pair every Messari-sourced value with at least one independent source before any institutional use.",
    });
  }

  // ?list=marketcap — top assets by market cap
  if (list === "marketcap") {
    const assets = await fetchMessariMarketcap(limit);
    return NextResponse.json({
      _meta: meta,
      list: "marketcap",
      limit,
      data: assets,
      count: assets.length,
      degraded: assets.length === 0,
      honestState:
        "Messari is a MARKET DATA SOURCE only. Pair every Messari-sourced value with at least one independent source before any institutional use.",
    });
  }

  // Default: return module identity + status
  return NextResponse.json({
    _meta: meta,
    endpoints: {
      assetMetrics: "GET /api/messari?asset=bitcoin",
      marketcapList: "GET /api/messari?list=marketcap&limit=20",
    },
    rule:
      "Messari market data is informational only. It is NOT a reserve oracle, NOT a NAV oracle, NOT a sanctions/compliance source, NOT a settlement price oracle. No single-source institutional decision may use Messari as the sole input.",
    honestState:
      "If MESSARI_API_KEY is missing, fetchMessari* returns null/[]. No institutional operation depends on Messari availability (per §31 multi-source doctrine).",
  });
}

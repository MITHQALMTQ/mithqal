import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { computePurchasingPower } from "@/lib/purchasing-power";
import { mtqDisabledResponse } from "@/lib/mtq-settlement-config";

// ---- v25.3.2 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary ----
// This route is MTQ-specific (computes MTQ purchasing power in 8 currencies).
// When MTQ_SETTLEMENT_ENABLED = false, it returns 503 immediately.
// The control plane (/api/control-plane/*) remains operational.
// See docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md.

/**
 * GET /api/mtq-purchasing-power — MTQ priced in 8 currencies with 24h change.
 *
 * Per user directive (2026-09-29): "MTQ is purchasing power, not fixed to
 * any currency." The existing /api/nav returns navM as a USD number, which
 * could be misread as a USD-fix. In fact MTQ is gold-anchored (Constitution
 * v19.0 §22), and its purchasing power in any currency depends on BOTH
 * gold's USD price AND the USD→currency FX rate.
 *
 * This endpoint surfaces the purchasing-power view:
 *   - purchasingPower[currency] = navM × USD→currency rate
 *   - changes24h[currency] = FX rate change percent (from FRED DEX series)
 *   - purchasingPowerChanges24h[currency] = combined navM + FX change
 *
 * Data sources:
 *   - navM, navL, goldUsd, silverUsd: from src/lib/nav-compute.ts (the
 *     existing v19.0.2 monetary engine + multi-oracle consensus). NEVER
 *     re-computed here.
 *   - Gold/silver 24h change: from src/lib/live-oracle.ts (Turso daily
 *     snapshot, with conservative fallback during the first 30 days).
 *   - FX 24h change: from FRED (DEXUSEU, DEXJPUS, DEXUSUK, DEXCHUS,
 *     DEXSZUS, DEXUSAL, DEXCAUS). Each fetched with limit=2&sort_order=desc.
 *     If FRED_API_KEY is unset, the endpoint still works but changes24h
 *     degrades to 0 (clearly flagged in fredSource).
 *
 * Rate limited: 30 requests per minute per IP (enforceRateLimit).
 *
 * Runtime: nodejs (Prisma + fetch are Node primitives).
 * Caching: force-dynamic — never statically cached (live market data).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Add a per-request revalidate window so Next.js will not pre-render this
// at build time. The runtime fetch hits external APIs that update ~minutely.
export const revalidate = 0;

export async function GET(req: Request) {
  // v25.3.2: MTQ_SETTLEMENT_MODULE gate. When MTQ_SETTLEMENT_ENABLED = false,
  // return 503 immediately (the control plane remains usable — see
  // /api/control-plane/settlement-status). Checked BEFORE the rate limiter
  // so disabled-mode responses are not rate-limited.
  const mtqDisabled = mtqDisabledResponse();
  if (mtqDisabled) return mtqDisabled;

  // Rate limit: 30 requests per minute per IP.
  const limited = enforceRateLimit("mtq-purchasing-power-get", req, 30, 60_000);
  if (limited) return limited;

  try {
    const result = await computePurchasingPower();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "X-Data-Source": "live-oracle + FRED + open.er-api.com",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to compute MTQ purchasing power",
        detail: err instanceof Error ? err.message : "unknown",
        fredSource: process.env.FRED_API_KEY
          ? "Federal Reserve Economic Data (FRED) — fetch failed"
          : "FRED_API_KEY not set",
        fxSource: "open.er-api.com",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

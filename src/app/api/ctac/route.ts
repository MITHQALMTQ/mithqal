import { NextResponse } from "next/server";
import {
  computeCTAC,
  ASSET_CLASS_PROFILES,
  formatCTACSummary,
  type CTACAsset,
  type DealerQuote,
  type CTACParams,
} from "@/lib/ctac-engine";

/**
 * POST /api/ctac
 *
 * Computes the Constitutional Total Acquisition Cost (CTAC) for a proposed
 * reserve acquisition (Chapter XX §XX.14).
 *
 * Body:
 *   {
 *     asset: "gold" | "silver" | "sovereign" | "stablecoin",
 *     quantity: number,                  // oz for bullion, USD-face for fiat/stable
 *     benchmarkPrice: number,            // Constitutional Benchmark Price (per unit)
 *     dealerQuotes: DealerQuote[],       // ≥1 required, ≥3 recommended
 *     selectedDealer?: string,           // optional override
 *     holdingDays?: number,              // default 365
 *     fxRateCostPct?: number,            // default 0
 *     taxRatePct?: number,               // default 0
 *     dutyRatePct?: number,              // default asset-class typical
 *     liquidityTier?: number,            // default 1
 *     counterpartyRiskScore?: number,    // default selected dealer's
 *     marketDepthUsd?: number,           // default $50M
 *     oracleConfidence?: number,         // default 0.95
 *     custodyOnboardingFee?: number,     // default $2,500
 *     vaultOnboardingFee?: number,       // default $5,000 (bullion)
 *     settlementSystemFee?: number,      // default $250
 *     wireTransferFee?: number,          // default $35
 *     operationalProcessingFee?: number, // default $500
 *     administrativeFee?: number,        // default $250
 *     transportationFee?: number,        // default $1,500 (bullion)
 *   }
 *
 * Returns: CTACResult with all 25 components, recommendation, and audit hash.
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
    const asset = typeof data.asset === "string" ? (data.asset as CTACAsset) : null;
    const validAssets: CTACAsset[] = ["gold", "silver", "sovereign", "stablecoin"];
    if (!asset || !validAssets.includes(asset)) {
      return NextResponse.json(
        { ok: false, error: `Invalid asset. Must be one of: ${validAssets.join(", ")}` },
        { status: 400 },
      );
    }

    const quantity = typeof data.quantity === "number" ? data.quantity : null;
    const benchmarkPrice = typeof data.benchmarkPrice === "number" ? data.benchmarkPrice : null;
    if (quantity == null || quantity <= 0) {
      return NextResponse.json({ ok: false, error: "quantity must be > 0" }, { status: 400 });
    }
    if (benchmarkPrice == null || benchmarkPrice <= 0) {
      return NextResponse.json({ ok: false, error: "benchmarkPrice must be > 0" }, { status: 400 });
    }

    // Parse dealer quotes
    if (!Array.isArray(data.dealerQuotes) || data.dealerQuotes.length === 0) {
      return NextResponse.json(
        { ok: false, error: "dealerQuotes must be a non-empty array" },
        { status: 400 },
      );
    }
    const dealerQuotes: DealerQuote[] = [];
    for (let i = 0; i < data.dealerQuotes.length; i++) {
      const q = data.dealerQuotes[i] as Record<string, unknown>;
      if (!q || typeof q !== "object") {
        return NextResponse.json(
          { ok: false, error: `dealerQuotes[${i}] must be an object` },
          { status: 400 },
        );
      }
      const dealerName = typeof q.dealerName === "string" ? q.dealerName : null;
      const pricePerUnit = typeof q.pricePerUnit === "number" ? q.pricePerUnit : null;
      const availableQty = typeof q.availableQty === "number" ? q.availableQty : null;
      const counterpartyScore = typeof q.counterpartyScore === "number" ? q.counterpartyScore : null;
      const settlementHours = typeof q.settlementHours === "number" ? q.settlementHours : 24;
      if (!dealerName || pricePerUnit == null || pricePerUnit <= 0 || availableQty == null || counterpartyScore == null) {
        return NextResponse.json(
          { ok: false, error: `dealerQuotes[${i}] requires dealerName(string), pricePerUnit(>0), availableQty(number), counterpartyScore(0-1)` },
          { status: 400 },
        );
      }
      if (counterpartyScore < 0 || counterpartyScore > 1) {
        return NextResponse.json(
          { ok: false, error: `dealerQuotes[${i}].counterpartyScore must be in [0, 1]` },
          { status: 400 },
        );
      }
      dealerQuotes.push({ dealerName, pricePerUnit, availableQty, counterpartyScore, settlementHours });
    }

    // Build CTACParams with optional overrides
    const params: CTACParams = {
      asset,
      quantity,
      benchmarkPrice,
      dealerQuotes,
      selectedDealer: typeof data.selectedDealer === "string" ? data.selectedDealer : undefined,
      holdingDays: typeof data.holdingDays === "number" ? data.holdingDays : undefined,
      fxRateCostPct: typeof data.fxRateCostPct === "number" ? data.fxRateCostPct : undefined,
      taxRatePct: typeof data.taxRatePct === "number" ? data.taxRatePct : undefined,
      dutyRatePct: typeof data.dutyRatePct === "number" ? data.dutyRatePct : undefined,
      liquidityTier: typeof data.liquidityTier === "number" ? data.liquidityTier : undefined,
      counterpartyRiskScore: typeof data.counterpartyRiskScore === "number" ? data.counterpartyRiskScore : undefined,
      marketDepthUsd: typeof data.marketDepthUsd === "number" ? data.marketDepthUsd : undefined,
      oracleConfidence: typeof data.oracleConfidence === "number" ? data.oracleConfidence : undefined,
      custodyOnboardingFee: typeof data.custodyOnboardingFee === "number" ? data.custodyOnboardingFee : undefined,
      vaultOnboardingFee: typeof data.vaultOnboardingFee === "number" ? data.vaultOnboardingFee : undefined,
      settlementSystemFee: typeof data.settlementSystemFee === "number" ? data.settlementSystemFee : undefined,
      wireTransferFee: typeof data.wireTransferFee === "number" ? data.wireTransferFee : undefined,
      operationalProcessingFee: typeof data.operationalProcessingFee === "number" ? data.operationalProcessingFee : undefined,
      administrativeFee: typeof data.administrativeFee === "number" ? data.administrativeFee : undefined,
      transportationFee: typeof data.transportationFee === "number" ? data.transportationFee : undefined,
    };

    const result = computeCTAC(params);

    return NextResponse.json({
      ok: true,
      result,
      summary: formatCTACSummary(result),
      assetProfile: ASSET_CLASS_PROFILES[asset],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ctac POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not compute CTAC.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/ctac — return the CTAC engine metadata (asset profiles, schema).
 */
export async function GET(): Promise<Response> {
  return NextResponse.json({
    ok: true,
    engine: "Constitutional Total Acquisition Cost (CTAC)",
    chapter: "§XX.14",
    assetProfiles: ASSET_CLASS_PROFILES,
    componentCount: 25,
    endpoints: {
      compute: "POST /api/ctac with CTACParams body",
    },
    timestamp: new Date().toISOString(),
  });
}

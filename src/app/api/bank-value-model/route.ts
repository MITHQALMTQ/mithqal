import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  computeBankNetValue,
  SAMPLE_BASELINE,
  EVIDENCE_STATUS_LABELS,
  BANK_VALUE_MODEL_STATUS,
  BANK_VALUE_MODEL_VERSION,
  BANK_VALUE_MODEL_SOURCE,
  type BankBaselineData,
  type EvidenceStatus,
} from "@/lib/bank-value-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("bank-value-model", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const useSample = url.searchParams.get("sample") === "true";
  const evidenceStatus = (url.searchParams.get("evidenceStatus") || "SIMULATED") as EvidenceStatus;

  if (useSample) {
    // Compute with the ILLUSTRATIVE sample baseline
    const result = computeBankNetValue(SAMPLE_BASELINE, "ILLUSTRATIVE");
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: BANK_VALUE_MODEL_SOURCE,
        version: BANK_VALUE_MODEL_VERSION,
        status: BANK_VALUE_MODEL_STATUS,
        overrideRule: "Bank value model. Bank enters own baseline data. No hard-coded numbers. Every output carries evidence status label.",
      },
      result,
      evidenceStatusLabels: EVIDENCE_STATUS_LABELS,
    });
  }

  // Default: return the schema + formula
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: BANK_VALUE_MODEL_SOURCE,
      version: BANK_VALUE_MODEL_VERSION,
      status: BANK_VALUE_MODEL_STATUS,
      overrideRule: "Bank value model. Bank enters own baseline data. No hard-coded numbers. Every output carries evidence status label.",
      noHardCodedNumbersRule: "Per Q-directive: 'Do not hard-code illustrative 7bps or sub-2-second numbers as universal claims.' All inputs are bank-entered via POST.",
    },
    formula: "Bank Net Value = Liquidity Benefit + FX Benefit + Operational Savings + Compliance/Evidence Savings + Risk Value + New Revenue - Integration Cost - Operating Cost - Compliance Cost - Risk Capital Cost - Change Cost",
    evidenceStatusLabels: EVIDENCE_STATUS_LABELS,
    rule: "POST your bank's baseline data to compute Bank Net Value. Use ?sample=true for ILLUSTRATIVE example. Every output carries one of 4 evidence status labels: SIMULATED, ILLUSTRATIVE, VALIDATED, INSTITUTIONALLY_VERIFIED.",
  });
}

// POST /api/bank-value-model
// Bank enters its own baseline data

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit("bank-value-model-post", request, 10, 60_000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json() as BankBaselineData & { evidenceStatus?: EvidenceStatus };
    const evidenceStatus = body.evidenceStatus || "SIMULATED";

    // Compute Bank Net Value
    const result = computeBankNetValue(body, evidenceStatus);

    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: BANK_VALUE_MODEL_SOURCE,
        version: BANK_VALUE_MODEL_VERSION,
        status: BANK_VALUE_MODEL_STATUS,
      },
      result,
      evidenceStatusLabels: EVIDENCE_STATUS_LABELS,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to compute bank value", detail: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

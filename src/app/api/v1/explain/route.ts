import { NextResponse } from "next/server";
import { runConsensus } from "@/lib/ai";

/**
 * AI Exception Explanation endpoint — uses multi-provider consensus.
 *
 *   POST /api/v1/explain   → Generate an AI-assisted root-cause analysis
 *                            for a payment validation exception.
 *   GET  /api/v1/explain   → Health-check stub.
 *
 * Uses the 5-provider consensus system (GROQ + OpenRouter + NVIDIA + Gemini + HuggingFace).
 * If all providers fail, returns 503 with all error details.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ExplainRequest {
  exceptionId?: string;
  caseId?: string;
  code?: string;
  severity?: string;
  status?: string;
  owner?: string;
  reason?: string;
  action?: string;
}

const DISCLAIMER =
  "AI-assisted analysis — not a definitive diagnosis. Human review required.";

const SYSTEM_PROMPT = `You are a financial-operations assurance analyst for the MITHQAL Assurance platform.
You analyze payment validation exceptions and provide:
1. A clear explanation of WHY this exception likely occurred (root cause hypothesis)
2. The likely IMPACT if left unresolved
3. 3 concrete RECOMMENDED ACTIONS to resolve it, prioritized by likelihood of success

Be concise, professional, and specific. Use financial-operations terminology (CBPR+, ISO 20022, SWIFT gpi, LEI, AML/KYC).
Format your response as structured markdown with clear headings.
Always include the disclaimer that this is AI-assisted analysis, not a definitive diagnosis.`;

function buildUserPrompt(body: Required<ExplainRequest>): string {
  return `Analyze this payment validation exception:

- Exception ID: ${body.exceptionId}
- Case ID: ${body.caseId}
- Exception Code: ${body.code}
- Severity: ${body.severity}
- Current Status: ${body.status}
- Assigned Owner: ${body.owner}
- Reason: ${body.reason}
- Current Action: ${body.action}

Provide:
## Root Cause Hypothesis
(Why this exception likely occurred)

## Impact Assessment
(What happens if unresolved)

## Recommended Actions
1. (Highest priority action)
2. (Second priority)
3. (Third priority)

## Confidence
(Your confidence level in this analysis: LOW/MEDIUM/HIGH and why)`;
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      disclaimer: "AI explanation service unavailable.",
    },
    { status },
  );
}

export async function POST(request: Request) {
  let body: ExplainRequest;
  try {
    body = (await request.json()) as ExplainRequest;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  if (!body.code || !body.severity) {
    return errorResponse("Missing required fields: code, severity", 400);
  }

  const payload = {
    exceptionId: body.exceptionId ?? "UNKNOWN",
    caseId: body.caseId ?? "UNKNOWN",
    code: body.code,
    severity: body.severity,
    status: body.status ?? "OPEN",
    owner: body.owner ?? "UNASSIGNED",
    reason: body.reason ?? "Not provided",
    action: body.action ?? "None",
  };

  try {
    const result = await runConsensus({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(payload) },
      ],
    });

    if (!result.consensus) {
      const errorDetail = result.errors
        .map((e) => `${e.provider}: ${e.error.slice(0, 100)}`)
        .join("; ");
      return NextResponse.json(
        {
          ok: false,
          exceptionId: payload.exceptionId,
          error: `All AI providers failed. ${errorDetail}`,
          providers: result.providersUsed,
          strategy: result.strategy,
          disclaimer: "AI explanation service unavailable.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      exceptionId: payload.exceptionId,
      explanation: result.consensus,
      providers: result.providersUsed,
      strategy: result.strategy,
      responses: result.responses.map((r) => ({
        provider: r.provider,
        model: r.model,
        latencyMs: r.latencyMs,
        content: r.content.slice(0, 200),
      })),
      timestamp: new Date().toISOString(),
      disclaimer: DISCLAIMER,
    });
  } catch (error) {
    console.error("[api/v1/explain] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/v1/explain",
    method: "POST",
    description: "AI-powered exception explanation using multi-provider consensus (GROQ + OpenRouter + NVIDIA + Gemini + HuggingFace)",
  });
}

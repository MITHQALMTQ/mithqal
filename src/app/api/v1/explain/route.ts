import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/**
 * AI Exception Explanation endpoint (PHASE1D).
 *
 *   POST /api/v1/explain   → Generate an AI-assisted root-cause analysis
 *                            for a payment validation exception.
 *   GET  /api/v1/explain   → Health-check stub.
 *
 * Backend-only — the z-ai-web-dev-sdk MUST stay server-side (runtime = "nodejs").
 * No caching (force-dynamic) so each request gets a fresh analysis.
 *
 * Trust model:
 *   - Validates required fields (code, severity).
 *   - Returns a structured JSON envelope: { ok, exceptionId, explanation, ... }.
 *   - Always includes the AI disclaimer (assisted analysis, not a diagnosis).
 *   - On error, returns a 500 with the disclaimer preserved.
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

interface ExplainResponse {
  ok: boolean;
  exceptionId?: string;
  explanation?: string;
  model?: string;
  timestamp?: string;
  disclaimer: string;
  error?: string;
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

function errorResponse(
  message: string,
  status = 500,
): NextResponse<ExplainResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      disclaimer: "AI explanation service unavailable.",
    },
    { status },
  );
}

export async function POST(request: Request): Promise<NextResponse<ExplainResponse>> {
  let body: ExplainRequest;
  try {
    body = (await request.json()) as ExplainRequest;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  // Validate required fields
  if (!body.code || !body.severity) {
    return errorResponse(
      "Missing required fields: code, severity",
      400,
    );
  }

  // Coerce to required-shaped object for the prompt builder
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
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(payload) },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    // Defensive extraction — the SDK's return shape is `any`
    const explanation: string | undefined =
      response?.choices?.[0]?.message?.content ??
      response?.choices?.[0]?.delta?.content ??
      undefined;

    if (!explanation) {
      return errorResponse(
        "Model returned an empty response.",
        502,
      );
    }

    return NextResponse.json<ExplainResponse>({
      ok: true,
      exceptionId: payload.exceptionId,
      explanation,
      model: "z-ai",
      timestamp: new Date().toISOString(),
      disclaimer: DISCLAIMER,
    });
  } catch (error) {
    console.error("[api/v1/explain] error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

// Optional: GET endpoint returns a stub for health checks
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/v1/explain",
    method: "POST",
    description:
      "AI-powered exception explanation using z-ai-web-dev-sdk",
  });
}

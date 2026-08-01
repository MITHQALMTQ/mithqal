import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { complianceAssistant, type UserData } from "@/lib/mithqal-brain";

/**
 * POST /api/brain/compliance — AI Compliance Assistant (operator-only).
 *
 * Auth-gated: requires an authenticated operator session. The compliance
 * endpoint processes personally-identifiable Formation Committee data
 * (name + email + org + role) and submits it to the Brain's 3 upstream
 * LLMs for KYC screening. The public cannot reach this endpoint.
 *
 * Request body:
 *   { fullName: string, email: string, org?: string, role?: string,
 *     consent: true }
 *
 *   `consent: true` is REQUIRED. The Brain forwards the submitted PII
 *   (fullName / email / org / role) to 3 third-party LLM providers
 *   (Google Gemini, Groq, Hugging Face). The caller (the Brain UI in
 *   mithqal-brain.tsx) MUST surface a consent checkbox and only send
 *   `consent: true` when the operator has explicitly checked it. Any
 *   request without `consent: true` is rejected with HTTP 400.
 *
 * Response:
 *   {
 *     riskScore: number,        // 0..100, higher = riskier
 *     flags: string[],
 *     recommendation: "clear" | "review" | "escalate",
 *     consensus: "high" | "medium" | "low",
 *     models: [{ model, label, ok, confidence, latencyMs }],
 *     combinedAnswer: string,
 *     timestamp: ISO string,
 *     privacyNotice: string     // reminder that PII was forwarded
 *   }
 *
 * Rate limit: 5 / minute / IP — even authenticated operators are
 * rate-limited to prevent runaway cost from a misbehaving client.
 *
 * Privacy note:
 *   The Brain forwards the submitted PII to 3 third-party LLM providers
 *   (Google Gemini, Groq, Hugging Face). The endpoint REQUIRES explicit
 *   consent (`consent: true` in the request body) and the response carries
 *   a `privacyNotice` reminder. Operators should also disclose this in
 *   /legal/privacy and have a Data Processing Agreement (DPA) in place
 *   with each provider before mainnet.
 */
export async function POST(req: Request) {
  // ---- Auth gate (operator only) ----
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Compliance screening requires operator auth." },
      { status: 401 }
    );
  }

  // ---- Rate limit (5/min/IP even for operators) ----
  const blocked = enforceRateLimit("brain-compliance", req, 5, 60_000);
  if (blocked) return blocked;

  // ---- Parse + validate body ----
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // ---- Consent gate (RF-18) ----
  // The Brain forwards PII to 3 third-party LLM providers (Google Gemini,
  // Groq, Hugging Face). Explicit consent MUST be present and strictly
  // `true` before any PII is parsed or forwarded. Without it, reject
  // with HTTP 400 — do not echo the submitted fields back.
  if (data.consent !== true) {
    return NextResponse.json(
      {
        error: "Consent required",
        detail:
          "The Mithqal Brain forwards your submitted inquiry to up to three third-party LLM providers (Google Gemini, Groq, Hugging Face). Explicit consent is required. See /legal/privacy for details.",
      },
      { status: 400 }
    );
  }

  const fullName = typeof data.fullName === "string" ? data.fullName.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const org =
    typeof data.org === "string" && data.org.trim() ? data.org.trim() : undefined;
  const role =
    typeof data.role === "string" && data.role.trim() ? data.role.trim() : undefined;

  if (!fullName || fullName.length < 2) {
    return NextResponse.json(
      { error: "fullName is required (min 2 chars)." },
      { status: 400 }
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 }
    );
  }

  // ---- Dispatch to the Brain ----
  try {
    const user: UserData = { fullName, email, org, role };
    const { response, riskScore, flags, recommendation } =
      await complianceAssistant(user);

    return NextResponse.json({
      riskScore,
      flags,
      recommendation,
      consensus: response.consensus,
      models: response.models.map((m) => ({
        model: m.model,
        label: m.label,
        ok: m.ok,
        confidence: m.confidence,
        latencyMs: m.latencyMs,
        error: m.error,
      })),
      combinedAnswer: response.combinedAnswer,
      timestamp: response.timestamp,
      privacyNotice:
        "Your submitted inquiry (name, email, organization, role) was forwarded to up to three third-party LLM providers — Google Gemini, Groq, and Hugging Face — for analysis. See /legal/privacy for details.",
    });
  } catch (err) {
    console.error("brain compliance screening failed:", err);
    return NextResponse.json(
      {
        error: "Brain compliance screening failed.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

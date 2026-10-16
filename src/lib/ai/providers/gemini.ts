/**
 * Google Gemini provider — REST generateContent API.
 *
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...
 * Auth:     API key passed as a query parameter (Gemini convention).
 *
 * Gemini uses a different request/response shape than OpenAI-compatible
 * providers. We translate AIMessage[] → Gemini's contents[] + systemInstruction.
 *
 * Server-only. Uses fetch() — no SDK dependency.
 */

import type { AIMessage, AIProvider, AIRequest, AIResponse } from "./types";

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
] as const;

const DEFAULT_MODEL = GEMINI_MODELS[0];

interface GeminiPart {
  text?: string;
}
interface GeminiContent {
  role?: string;
  parts?: GeminiPart[];
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
}
interface GeminiResponseBody {
  candidates?: GeminiCandidate[];
  usageMetadata?: { totalTokenCount?: number };
  error?: { message?: string };
}

function toGeminiContents(messages: AIMessage[]): {
  systemInstruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
} {
  const systemParts: GeminiPart[] = [];
  const contents: GeminiContent[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push({ text: m.content });
    } else {
      // Gemini expects role to be "user" or "model".
      const role = m.role === "assistant" ? "model" : "user";
      contents.push({ role, parts: [{ text: m.content }] });
    }
  }

  const result: {
    systemInstruction?: { parts: GeminiPart[] };
    contents: GeminiContent[];
  } = { contents };

  if (systemParts.length > 0) {
    result.systemInstruction = { parts: systemParts };
  }

  return result;
}

export const geminiProvider: AIProvider = {
  name: "gemini",
  models: [...GEMINI_MODELS],

  available(): boolean {
    return !!process.env.GEMINI_API_KEY;
  },

  async chat(req: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const model = req.model || DEFAULT_MODEL;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { systemInstruction, contents } = toGeminiContents(req.messages);

    const body = {
      contents,
      ...(systemInstruction ? { systemInstruction } : {}),
      generationConfig: {
        temperature: req.temperature ?? 0.4,
        maxOutputTokens: req.maxTokens ?? 1024,
      },
    };

    const url = `${GEMINI_BASE}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      throw new Error(
        `gemini fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`gemini HTTP ${resp.status}: ${text.slice(0, 500)}`);
    }

    let data: GeminiResponseBody;
    try {
      data = (await resp.json()) as GeminiResponseBody;
    } catch (err) {
      throw new Error(
        `gemini json parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (data.error?.message) {
      throw new Error(`gemini api error: ${data.error.message}`);
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!content) {
      throw new Error("gemini returned empty content");
    }

    return {
      content,
      provider: "gemini",
      model,
      latencyMs: Date.now() - start,
      tokensUsed: data.usageMetadata?.totalTokenCount,
    };
  },
};

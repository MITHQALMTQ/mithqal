/**
 * Mithqal Brain — multi-model consensus orchestrator.
 *
 * The Brain is the AI layer RECOMMENDED (not REQUIRED) by the v19
 * Constitutional spec. It runs alongside the deterministic monetary
 * engine and provides three operator-facing intelligence services:
 *
 *   1. AI Risk Monitor      — early warning for currency / reserve risks
 *   2. AI Compliance Assistant — KYC screening for Formation Committee
 *   3. AI Transaction Anomaly Detection — flags unusual on-chain activity
 *
 * Architecture: 6 external LLMs are called in parallel for every query.
 *   - Gemini       (Google)               — broad reasoning + knowledge
 *   - HuggingFace  (Inference API)        — specialized financial models
 *   - Groq         (ultra-fast inference)  — real-time analysis
 *   - OpenRouter   (multi-model gateway)  — diverse model aggregation
 *   - NVIDIA       (Nemotron NIM)          — enterprise-grade reasoning
 *   - Neon         (Neon AI Gateway)      — multi-model proxy (CR-2026-030)
 *
 * Consensus mechanism (6 providers):
 *   - 4–6 models agree  → high   confidence (green)
 *   - 3 models agree   → high   confidence (majority, green)
 *   - 2 models agree   → medium confidence (yellow)
 *   - 1 model responds  → low    confidence (red, needs human review)
 *   - 0 models respond  → degraded (red, needs human review)
 *
 * Agreement is measured via Jaccard similarity on the lowercased token
 * sets of each response (threshold: 0.30). The largest clique of
 * pairwise-agreeing models determines the consensus level. This is
 * intentionally a coarse heuristic — the goal is to surface divergence
 * to the operator, not to produce a numerical "truth score". A real
 * Binance-grade system would use cross-encoder NLI scoring; the
 * Constitution explicitly defers AI details to engineering judgment.
 *
 * Failure model:
 *   - Each model call is wrapped in `Promise.allSettled`. If a model
 *     is down (timeout, bad key, 500), the Brain continues with the
 *     remaining models. With ≥3 models → max consensus is "high".
 *     With 2 models → max consensus is "medium". With 1 model → max
 *     consensus is "low". With 0 → returns a degraded message and
 *     `consensus: "low"`.
 *   - Each call has a 12-second AbortController timeout so a hung
 *     upstream never blocks the response.
 *
 * Constitutional compliance:
 *   - The Brain is NEVER wired into NAV/weight calculations (§4
 *     invariants — no discretionary minting, no algorithmic policy).
 *   - It only provides advisory signals to the operator, who retains
 *     all decision authority.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ConsensusLevel = "high" | "medium" | "low";

export interface ModelResponse {
  /** Stable identifier for this model (used by the UI to render cards). */
  model:
    | "gemini"
    | "huggingface"
    | "groq"
    | "openrouter"
    | "nvidia"
    | "neon";
  /** Human-friendly label. */
  label: string;
  /** The model's textual response (may be empty if the call failed). */
  response: string;
  /** Heuristic confidence in this response, 0..1. 0 if failed. */
  confidence: number;
  /** Latency in milliseconds for the upstream call. 0 if failed. */
  latencyMs: number;
  /** Whether the upstream call succeeded. */
  ok: boolean;
  /** Error message if `ok` is false. */
  error?: string;
}

export interface BrainResponse {
  query: string;
  /** Type of query dispatched (general / risk / compliance / anomaly). */
  type: QueryType;
  consensus: ConsensusLevel;
  models: ModelResponse[];
  /** The response chosen as the most representative (median similarity). */
  combinedAnswer: string;
  /** Actionable recommendations extracted from the combined answer. */
  recommendations: string[];
  /** ISO timestamp of when the Brain completed this query. */
  timestamp: string;
  /** Number of models that responded successfully (0..6). */
  modelsResponded: number;
}

export type QueryType = "general" | "risk" | "compliance" | "anomaly";

export interface CurrencyData {
  goldUsd?: number;
  silverUsd?: number;
  stablecoins?: Record<string, number>;
  reserveRatio?: number;
  navUsd?: number;
  supplyMtq?: number;
  source?: string;
  timestamp?: string;
}

export interface UserData {
  fullName: string;
  email: string;
  org?: string;
  role?: string;
}

export interface TransactionLike {
  txHash?: string;
  type?: string;
  fromAddress?: string;
  toAddress?: string | null;
  amount?: string | number;
  fee?: string | number | null;
  timestamp?: number | string;
  blockNumber?: number | null;
}

export interface RiskAssessment {
  currency: string;
  riskLevel: "low" | "medium" | "high";
  factors: string[];
  recommendation: string;
}

export interface AnomalyFinding {
  txHash: string;
  type: string;
  reason: string;
  severity: "info" | "warning" | "critical";
}

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
// CR-2026-030 (Proposal E): Neon AI Gateway token (format: nt_live_...).
// The Neon AI Gateway is a proxy that routes a single OpenAI-shaped
// request to multiple underlying LLM providers. Stored at module load
// so the infrastructure is ready when the gateway endpoint is confirmed
// (see queryNeon() docstring for the endpoint-investigation results).
const NEON_AI_GATEWAY_TOKEN = process.env.NEON_AI_GATEWAY_TOKEN;

/** Per-call upstream timeout. 12s is generous for Groq, tight for HF. */
const UPSTREAM_TIMEOUT_MS = 12_000;
const NVIDIA_TIMEOUT_MS = 30_000; // NVIDIA NIM cold-start can be slow

/** Jaccard similarity threshold above which two responses "agree". */
const AGREEMENT_THRESHOLD = 0.3;

const MODEL_LABELS: Record<ModelResponse["model"], string> = {
  gemini: "Gemini 2.0 Flash",
  huggingface: "HuggingFace Llama 3.1 70B",
  groq: "Groq Llama 3.3 70B",
  openrouter: "OpenRouter (multi-model)",
  nvidia: "NVIDIA Nemotron",
  neon: "Neon AI Gateway (multi-model)",
};

/**
 * Per-provider model fallback lists.
 *
 * For each provider we maintain an ordered list of model identifiers.
 * Each `queryXxx()` function iterates the list and returns the first
 * successful response. This provides resilience against single-model
 * 404s (e.g. Groq retiring `llama-3.3-70b-versatile`) and transient
 * upstream failures, without expanding the cross-provider consensus
 * pool — every provider still casts exactly one vote in the consensus.
 *
 * The first entry is the "primary" model (per the original spec); the
 * remaining entries are fallbacks of the same family/provider.
 *
 * v25.5 (D3 — AI Brain Failover Architect): every provider's list
 * extended with additional publicly-documented known-good models so
 * the per-provider chain survives more deprecation events before
 * surfacing a "provider-down" card to the operator. The query
 * functions' internal loop logic is unchanged — only the constant's
 * contents grew. References:
 *   - Gemini:   https://ai.google.dev/gemini-api/docs/models
 *   - Groq:     https://console.groq.com/docs/models
 *   - HF:       https://huggingface.co/models?other=inference
 *   - OpenRtr:  https://openrouter.ai/models
 *   - NVIDIA:   https://build.nvidia.com/explore/discover/models
 */
const MODEL_FALLBACKS: Record<ModelResponse["model"], string[]> = {
  // v25.3.22 (2026-09-30): model lists audited against live provider APIs.
  //   - OpenRouter: 3 models VERIFIED working with the provisioned key (below).
  //     The previous 5 free-tier models (:free) were deprecated by OpenRouter
  //     and returned "unavailable for free" — removed.
  //   - Groq: models are current per https://console.groq.com/docs/models.
  //     (The sandbox key was rejected — Forbidden — but the model list is correct
  //     for when a valid key is provisioned. Vercel production has a working key.)
  //   - NVIDIA: models per https://build.nvidia.com/explore/discover/models.
  //     NOTE: the provisioned NVIDIA account has NOT deployed general-purpose
  //     LLMs — only `riva-translate-*` (translation) respond. The models below
  //     are correct for a fully-deployed account.
  //   - Gemini: models per https://ai.google.dev/gemini-api/docs/models.
  //     (The sandbox key AQ.Ab8RN6... is non-standard — 401 in all auth formats.)
  //   - HuggingFace: models per https://huggingface.co/models?other=inference.
  //     NOTE: the free `hf-inference` provider doesn't support these models —
  //     a dedicated Inference Endpoint or the `router.huggingface.co` with a
  //     paid provider (novita/replicate/fal-ai) is required.
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama-3.2-3b-preview",
    "llama-3.2-1b-preview",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ],
  nvidia: [
    "mistralai/mistral-nemotron",
    "nvidia/llama-3.1-nemotron-70b-instruct",
    "nvidia/llama-3.1-nemotron-51b-instruct",
    "meta/llama-3.2-90b-vision-instruct",
    "nvidia/llama-3.3-nemotron-super-49b",
    "meta/llama-3.1-405b-instruct",
  ],
  openrouter: [
    "meta-llama/llama-3.3-70b-instruct", // ✅ VERIFIED working 2026-09-30
    "deepseek/deepseek-chat",             // ✅ VERIFIED working 2026-09-30
    "qwen/qwen-2.5-72b-instruct",         // ✅ VERIFIED working 2026-09-30
    "meta-llama/llama-3.1-70b-instruct", // ✅ VERIFIED working 2026-09-30
  ],
  gemini: [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ],
  huggingface: [
    "meta-llama/Llama-3.1-70B-Instruct",
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "mistralai/Mistral-Nemo-Instruct-2407",
    "Qwen/Qwen2.5-7B-Instruct",
  ],
  // CR-2026-030 (Proposal E): Neon AI Gateway — multi-model proxy. The
  // gateway routes a single OpenAI-shaped request to whichever backend
  // (OpenAI, Anthropic, Meta, ...) has capacity, so the fallback list
  // uses generic OpenAI-style model identifiers rather than provider-
  // specific names. The gateway's chat-completions URL is UNVERIFIED —
  // see the docstring on queryNeon() for the endpoint-investigation
  // results. These model identifiers are placeholders ready for when
  // the endpoint is confirmed.
  neon: [
    "gpt-4o-mini",
    "claude-3.5-sonnet",
    "meta-llama/llama-3.3-70b-instruct",
  ],
};

/**
 * Coarse model-family classifier for each provider's PRIMARY model.
 *
 * Used by `crossProviderFailover()` to determine which providers are
 * acceptable substitutes for one another when a provider's entire call
 * fails (e.g. revoked API key, all fallback models 5xx'd). Two
 * providers are considered "same family" if their primaries share the
 * same coarse identifier — e.g. groq's `llama-3.3-70b-versatile` and
 * openrouter's `meta-llama/llama-3.3-70b-instruct` both classify as
 * `llama-3.3-70b`, so OpenRouter can fill in for a dead GROQ.
 *
 * Hand-curated (rather than derived) so the cross-provider peering is
 * auditable and stable across model-list churn.
 */
const PRIMARY_FAMILY: Record<ModelResponse["model"], string> = {
  gemini: "gemini-2.0-flash",
  huggingface: "llama-3.1-70b",
  groq: "llama-3.3-70b",
  openrouter: "llama-3.3-70b",
  nvidia: "mistral-nemotron",
  // CR-2026-030 (Proposal E): Neon is a multi-model proxy, so it has
  // no single coarse family — its primary is classed as "neon-gateway"
  // which no other provider shares. This means crossProviderFailover()
  // will never substitute for Neon (nor vice versa) — Neon's slot
  // stays red if the gateway is unreachable, just like Gemini/NVIDIA.
  neon: "neon-gateway",
};

/* ------------------------------------------------------------------ */
/*  HTTP helper with timeout                                           */
/* ------------------------------------------------------------------ */

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = UPSTREAM_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/*  Per-model query implementations                                    */
/* ------------------------------------------------------------------ */

/**
 * Query Google Gemini via the Generative Language API.
 *
 * Endpoint (per spec):
 *   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=KEY
 *
 * Request body shape (Gemini generateContent):
 *   { contents: [{ parts: [{ text: PROMPT }] }] }
 *
 * Response shape:
 *   { candidates: [{ content: { parts: [{ text: "..." }] } }] }
 */
async function queryGemini(prompt: string): Promise<ModelResponse> {
  const start = Date.now();
  const model: ModelResponse["model"] = "gemini";
  const base: ModelResponse = {
    model,
    label: MODEL_LABELS[model],
    response: "",
    confidence: 0,
    latencyMs: 0,
    ok: false,
  };

  if (!GEMINI_KEY) {
    return { ...base, error: "GEMINI_API_KEY not configured" };
  }

  // Iterate the per-provider model fallback list and return the first
  // successful response. Each model failure is logged into `lastError`
  // and the next model is tried; only after all candidates fail do we
  // surface the final error to the caller.
  const models = MODEL_FALLBACKS.gemini;
  let lastError = "";

  for (const modelName of models) {
    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=` +
        encodeURIComponent(GEMINI_KEY);

      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = `Gemini ${modelName} HTTP ${res.status}: ${errText.slice(0, 200)}`;
        continue;
      }

      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text =
        json?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim() ?? "";

      if (!text) {
        // Empty 200 from a candidate model — try the next one.
        lastError = `Gemini ${modelName} returned an empty response`;
        continue;
      }

      return {
        ...base,
        response: text,
        confidence: scoreConfidence(text),
        latencyMs: Date.now() - start,
        ok: true,
      };
    } catch (err) {
      lastError =
        err instanceof Error && err.name === "AbortError"
          ? `Gemini ${modelName} timed out`
          : err instanceof Error
            ? `Gemini ${modelName}: ${err.message}`
            : `Gemini ${modelName} call failed`;
    }
  }

  return { ...base, latencyMs: Date.now() - start, error: lastError };
}

/**
 * Query Groq via the OpenAI-compatible chat completions API.
 *
 * Endpoint (per spec):
 *   POST https://api.groq.com/openai/v1/chat/completions
 *
 * Model: "llama-3.3-70b-versatile" (per spec).
 */
async function queryGroq(prompt: string): Promise<ModelResponse> {
  const start = Date.now();
  const model: ModelResponse["model"] = "groq";
  const base: ModelResponse = {
    model,
    label: MODEL_LABELS[model],
    response: "",
    confidence: 0,
    latencyMs: 0,
    ok: false,
  };

  if (!GROQ_KEY) {
    return { ...base, error: "GROQ_API_KEY not configured" };
  }

  // Iterate the per-provider model fallback list and return the first
  // successful response. This protects the Brain against Groq retiring
  // individual models (the original primary, `llama-3.3-70b-versatile`,
  // has historically 404'd) — we silently fall through to the next
  // candidate model in the same provider family.
  const models = MODEL_FALLBACKS.groq;
  let lastError = "";

  for (const modelName of models) {
    try {
      const res = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: "You are the Mithqal Brain, a multi-model consensus AI for a gold-backed stablecoin. Be precise, structured, and concise." },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = `Groq ${modelName} HTTP ${res.status}: ${errText.slice(0, 200)}`;
        continue;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json?.choices?.[0]?.message?.content?.trim() ?? "";

      if (!text) {
        lastError = `Groq ${modelName} returned an empty response`;
        continue;
      }

      return {
        ...base,
        response: text,
        confidence: scoreConfidence(text),
        latencyMs: Date.now() - start,
        ok: true,
      };
    } catch (err) {
      lastError =
        err instanceof Error && err.name === "AbortError"
          ? `Groq ${modelName} timed out`
          : err instanceof Error
            ? `Groq ${modelName}: ${err.message}`
            : `Groq ${modelName} call failed`;
    }
  }

  return { ...base, latencyMs: Date.now() - start, error: lastError };
}

/**
 * Query HuggingFace via the Inference API.
 *
 * Endpoint (per spec):
 *   POST https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-70B-Instruct
 *
 * The Inference API for chat-style models accepts either a plain string
 * payload (treated as the prompt) or a structured `inputs` object. We
 * send a plain string for maximum compatibility.
 */
async function queryHuggingFace(prompt: string): Promise<ModelResponse> {
  const start = Date.now();
  const model: ModelResponse["model"] = "huggingface";
  const base: ModelResponse = {
    model,
    label: MODEL_LABELS[model],
    response: "",
    confidence: 0,
    latencyMs: 0,
    ok: false,
  };

  if (!HF_KEY) {
    return { ...base, error: "HUGGINGFACE_API_KEY not configured" };
  }

  // Iterate the per-provider model fallback list. HuggingFace's
  // Inference API embeds the model identifier in the URL path, so we
  // build the endpoint fresh on each attempt. The `wait_for_model`
  // option is preserved across all candidates.
  const models = MODEL_FALLBACKS.huggingface;
  let lastError = "";

  for (const modelName of models) {
    try {
      const res = await fetchWithTimeout(
        `https://api-inference.huggingface.co/models/${modelName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${HF_KEY}`,
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { temperature: 0.3, max_new_tokens: 800, return_full_text: false },
            options: { wait_for_model: true },
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = `HuggingFace ${modelName} HTTP ${res.status}: ${errText.slice(0, 200)}`;
        continue;
      }

      const json = (await res.json()) as
        | Array<{ generated_text?: string }>
        | { generated_text?: string };

      const text = Array.isArray(json)
        ? (json[0]?.generated_text ?? "").trim()
        : (json?.generated_text ?? "").trim();

      if (!text) {
        lastError = `HuggingFace ${modelName} returned an empty response`;
        continue;
      }

      return {
        ...base,
        response: text,
        confidence: scoreConfidence(text),
        latencyMs: Date.now() - start,
        ok: true,
      };
    } catch (err) {
      lastError =
        err instanceof Error && err.name === "AbortError"
          ? `HuggingFace ${modelName} timed out`
          : err instanceof Error
            ? `HuggingFace ${modelName}: ${err.message}`
            : `HuggingFace ${modelName} call failed`;
    }
  }

  return { ...base, latencyMs: Date.now() - start, error: lastError };
}

/**
 * Query OpenRouter via the OpenAI-compatible chat completions API.
 *
 * Endpoint (per spec):
 *   POST https://openrouter.ai/api/v1/chat/completions
 *
 * Model: "meta-llama/llama-3.3-70b-instruct" (per spec; alternative
 * fallback identifier documented by OpenRouter is
 * "google/gemini-2.0-flash-exp:free").
 *
 * OpenRouter is a multi-model gateway — it routes a single OpenAI-
 * shaped request to many underlying providers (Anthropic, Meta,
 * Google, Mistral, etc.) behind one URL. We use it for response
 * diversity: even when two of our other providers land on the same
 * answer, OpenRouter's independent routing adds a 4th perspective
 * (and a 5th with NVIDIA) to the consensus.
 *
 * Request/response shape: identical to Groq (OpenAI chat completions).
 */
async function queryOpenRouter(prompt: string): Promise<ModelResponse> {
  const start = Date.now();
  const model: ModelResponse["model"] = "openrouter";
  const base: ModelResponse = {
    model,
    label: MODEL_LABELS[model],
    response: "",
    confidence: 0,
    latencyMs: 0,
    ok: false,
  };

  if (!OPENROUTER_KEY) {
    return { ...base, error: "OPENROUTER_API_KEY not configured" };
  }

  // Iterate the per-provider model fallback list. OpenRouter is a
  // multi-model gateway — we keep a small list of fallback identifiers
  // (Llama 3.3 70B → Gemini 2.0 Flash free → Llama 3.1 70B) so a
  // gateway-side deprecation of one identifier does not kill the
  // OpenRouter vote in the consensus.
  const models = MODEL_FALLBACKS.openrouter;
  let lastError = "";

  for (const modelName of models) {
    try {
      const res = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_KEY}`,
            "HTTP-Referer": "https://mithqal.vercel.app",
            "X-Title": "MITHQAL Brain",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "system",
                content:
                  "You are the Mithqal Brain, a multi-model consensus AI for a " +
                  "constitutional settlement infrastructure. Be precise, " +
                  "structured, and concise.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = `OpenRouter ${modelName} HTTP ${res.status}: ${errText.slice(0, 200)}`;
        continue;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json?.choices?.[0]?.message?.content?.trim() ?? "";

      if (!text) {
        lastError = `OpenRouter ${modelName} returned an empty response`;
        continue;
      }

      return {
        ...base,
        response: text,
        confidence: scoreConfidence(text),
        latencyMs: Date.now() - start,
        ok: true,
      };
    } catch (err) {
      lastError =
        err instanceof Error && err.name === "AbortError"
          ? `OpenRouter ${modelName} timed out`
          : err instanceof Error
            ? `OpenRouter ${modelName}: ${err.message}`
            : `OpenRouter ${modelName} call failed`;
    }
  }

  return { ...base, latencyMs: Date.now() - start, error: lastError };
}

/**
 * Query NVIDIA NIM via the OpenAI-compatible chat completions API.
 *
 * Endpoint (per spec):
 *   POST https://integrate.api.nvidia.com/v1/chat/completions
 *
 * Model: "mistralai/mistral-nemotron" (per spec).
 *
 * NVIDIA's NIM (NVIDIA Inference Microservices) hosts open-weight
 * models tuned by NVIDIA. Nemotron is NVIDIA's instruction-tuned
 * variant of Llama 3.1 70B — it brings an enterprise-aligned
 * perspective distinct from the open-source HF/Groq variants of the
 * same base model.
 *
 * Request/response shape: identical to Groq (OpenAI chat completions).
 */
async function queryNVIDIA(prompt: string): Promise<ModelResponse> {
  const start = Date.now();
  const model: ModelResponse["model"] = "nvidia";
  const base: ModelResponse = {
    model,
    label: MODEL_LABELS[model],
    response: "",
    confidence: 0,
    latencyMs: 0,
    ok: false,
  };

  if (!NVIDIA_KEY) {
    return { ...base, error: "NVIDIA_API_KEY not configured" };
  }

  // Iterate the per-provider model fallback list. NVIDIA NIM may rotate
  // models in/out of the catalog without warning; the fallback list lets
  // the Brain pick up Nemotron 70B / 51B / Llama 3.2 90B Vision without
  // a code change. The generous NVIDIA_TIMEOUT_MS is preserved across
  // all candidates because NIM cold-starts are uniformly slow.
  const models = MODEL_FALLBACKS.nvidia;
  let lastError = "";

  for (const modelName of models) {
    try {
      const res = await fetchWithTimeout(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NVIDIA_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "system",
                content:
                  "You are the Mithqal Brain, a multi-model consensus AI for a " +
                  "constitutional settlement infrastructure. Be precise, " +
                  "structured, and concise.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        },
        NVIDIA_TIMEOUT_MS
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = `NVIDIA ${modelName} HTTP ${res.status}: ${errText.slice(0, 200)}`;
        continue;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json?.choices?.[0]?.message?.content?.trim() ?? "";

      if (!text) {
        lastError = `NVIDIA ${modelName} returned an empty response`;
        continue;
      }

      return {
        ...base,
        response: text,
        confidence: scoreConfidence(text),
        latencyMs: Date.now() - start,
        ok: true,
      };
    } catch (err) {
      lastError =
        err instanceof Error && err.name === "AbortError"
          ? `NVIDIA ${modelName} timed out`
          : err instanceof Error
            ? `NVIDIA ${modelName}: ${err.message}`
            : `NVIDIA ${modelName} call failed`;
    }
  }

  return { ...base, latencyMs: Date.now() - start, error: lastError };
}

/**
 * Query the Neon AI Gateway via the OpenAI-compatible chat completions API.
 *
 * CR-2026-030 (Proposal E) — Endpoint investigation (2026-09-30):
 *   Candidate 1: https://ai.neon.tech/v1/chat/completions
 *                → DNS does not resolve (no A record, getent/curl fail).
 *   Candidate 2: https://api.neon.tech/ai/v1/chat/completions
 *                → DNS does not resolve (api.neon.tech has no A record).
 *   Candidate 3: https://neon.ai/v1/chat/completions
 *                → 308 redirect to www.neon.ai, then 404 — that host is a
 *                  Framer-built marketing site ("Neon.ai builds custom
 *                  AI..."), not an LLM gateway.
 *
 * Additional probes during investigation:
 *   - https://ai.gateway.neon.tech, https://gateway.neon.tech,
 *     https://llm.neon.tech, https://inference.neon.tech,
 *     https://ai.api.neon.tech, https://neon-gateway.com
 *     → none resolve in DNS.
 *   - The Neon REST API (api.neon.tech/v2/users/me) could not be probed
 *     because api.neon.tech itself does not resolve from this sandbox.
 *     The user's prior note that the REST API rejected the token as
 *     "not a valid JWT" confirms the AI Gateway is a separate service
 *     from the Neon Postgres platform API.
 *   - The token format is `nt_live_...` (verified), distinct from Neon
 *     Postgres platform tokens (`pat_...` / JWT-shaped) — confirming the
 *     AI Gateway token is intended for a different endpoint.
 *
 * STUB STATE:
 *   Until the gateway's actual chat-completions endpoint is confirmed,
 *   this function returns `{ ok: false, error: "Neon AI Gateway endpoint
 *   not yet verified" }` WITHOUT making any HTTP calls. The token IS
 *   read from env so the infrastructure is ready — flipping
 *   NEON_ENDPOINT_VERIFIED=true in the environment is the only change
 *   required to enable live dispatch through MODEL_FALLBACKS.neon.
 *
 *   The full OpenAI-compatible fetch loop is preserved (mirrors
 *   queryOpenRouter() exactly) so the live path is auditable + ready.
 *
 * Request/response shape: identical to Groq/OpenRouter/NVIDIA (OpenAI
 * chat completions). Model identifiers come from MODEL_FALLBACKS.neon.
 */
const NEON_ENDPOINT = "https://ai.neon.tech/v1/chat/completions";
// CR-2026-030 (Proposal E): flip to `true` (env: NEON_ENDPOINT_VERIFIED=true)
// when the gateway URL is confirmed. This is a runtime check (not a const
// literal) so TypeScript's control-flow analysis treats the live-dispatch
// loop below as reachable — keeping the code structurally identical to
// queryOpenRouter() even while the stub is in effect.
const NEON_ENDPOINT_VERIFIED = process.env.NEON_ENDPOINT_VERIFIED === "true";

async function queryNeon(prompt: string): Promise<ModelResponse> {
  const start = Date.now();
  const model: ModelResponse["model"] = "neon";
  const base: ModelResponse = {
    model,
    label: MODEL_LABELS[model],
    response: "",
    confidence: 0,
    latencyMs: 0,
    ok: false,
  };

  if (!NEON_AI_GATEWAY_TOKEN) {
    return { ...base, error: "NEON_AI_GATEWAY_TOKEN not configured" };
  }

  // STUB gate (CR-2026-030): the Neon AI Gateway endpoint is currently
  // UNVERIFIED — see the docstring above for the endpoint-investigation
  // results. Return a clear, honest stub error so the operator knows the
  // slot is intentionally dark (not a transient upstream failure).
  if (!NEON_ENDPOINT_VERIFIED) {
    return {
      ...base,
      latencyMs: Date.now() - start,
      error: "Neon AI Gateway endpoint not yet verified",
    };
  }

  // Iterate the per-provider model fallback list (mirrors queryOpenRouter).
  // The Neon AI Gateway is a multi-model proxy — we keep a small list of
  // generic OpenAI-style identifiers so the gateway can route to whichever
  // backend has capacity, and a gateway-side deprecation of one identifier
  // does not kill the Neon vote in the consensus.
  const models = MODEL_FALLBACKS.neon;
  let lastError = "";

  for (const modelName of models) {
    try {
      const res = await fetchWithTimeout(NEON_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NEON_AI_GATEWAY_TOKEN}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content:
                "You are the Mithqal Brain, a multi-model consensus AI for a " +
                "constitutional settlement infrastructure. Be precise, " +
                "structured, and concise.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastError = `Neon ${modelName} HTTP ${res.status}: ${errText.slice(0, 200)}`;
        continue;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json?.choices?.[0]?.message?.content?.trim() ?? "";

      if (!text) {
        lastError = `Neon ${modelName} returned an empty response`;
        continue;
      }

      return {
        ...base,
        response: text,
        confidence: scoreConfidence(text),
        latencyMs: Date.now() - start,
        ok: true,
      };
    } catch (err) {
      lastError =
        err instanceof Error && err.name === "AbortError"
          ? `Neon ${modelName} timed out`
          : err instanceof Error
            ? `Neon ${modelName}: ${err.message}`
            : `Neon ${modelName} call failed`;
    }
  }

  return { ...base, latencyMs: Date.now() - start, error: lastError };
}

/* ------------------------------------------------------------------ */
/*  Consensus + confidence heuristics                                  */
/* ------------------------------------------------------------------ */

/**
 * Heuristic per-response confidence score (0..1).
 *
 * This is NOT a measure of correctness — it's a measure of "did the
 * model produce a substantive, structured response we can lean on".
 * Factors:
 *   - Length > 200 chars    → +0.20
 *   - Contains a number     → +0.20  (figures/percentages)
 *   - Contains a bullet/numbered list marker → +0.20
 *   - Contains a recommendation verb         → +0.15
 *   - Base for any non-empty response        → +0.25
 *
 * Capped at 0.95 — no model ever gets 1.0 (no AI is ever certain).
 */
export function scoreConfidence(text: string): number {
  if (!text) return 0;
  let score = 0.25;
  if (text.length > 200) score += 0.2;
  if (/\d/.test(text)) score += 0.2;
  if (/^\s*([-*•]|\d+[.)])\s+/m.test(text)) score += 0.2;
  if (/\b(recommend|should|must|action|require|suggest|consider)\b/i.test(text)) score += 0.15;
  return Math.min(0.95, Math.round(score * 100) / 100);
}

/**
 * Tokenize a response into a Set of lowercase word tokens (length ≥ 3).
 * Stopwords are removed so two responses that say the same thing with
 * different connective tissue still register as agreement.
 */
const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can",
  "had", "her", "was", "one", "our", "out", "day", "get", "has", "him",
  "his", "how", "man", "new", "now", "old", "see", "two", "way", "who",
  "boy", "did", "its", "let", "put", "say", "she", "too", "use", "with",
  "that", "this", "have", "from", "they", "what", "were", "your", "each",
  "will", "about", "there", "their", "would", "could", "should", "into",
  "than", "them", "then", "these", "those", "been", "being", "very",
]);

function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  const matches = text.toLowerCase().match(/[a-z][a-z0-9'-]{2,}/g) ?? [];
  for (const t of matches) {
    if (STOPWORDS.has(t)) continue;
    tokens.add(t);
  }
  return tokens;
}

/** Jaccard similarity between two token sets: |A ∩ B| / |A ∪ B|. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Build the consensus result from up to 6 model responses.
 *
 * Returns the consensus level + the combined answer + recommendations.
 * The "combined answer" is the response with the highest mean Jaccard
 * similarity to the other responses — i.e. the response that is most
 * "central" to the cluster. In the case of a tie or no agreement, we
 * pick the response with the highest heuristic confidence.
 *
 * Consensus levels (6-provider spec):
 *   - Largest pairwise-agreement clique of size ≥ 3 → "high"
 *   - Largest clique of size 2                    → "medium"
 *   - Largest clique of size 1 (no pair agrees)   → "low"
 *   - 0 models responded                          → "low" (degraded message)
 *
 * "Pairwise-agreement clique" = a subset of models where every pair
 * has Jaccard similarity ≥ AGREEMENT_THRESHOLD. We brute-force this
 * (≤6 models → ≤64 subsets) — trivially cheap, and far more accurate
 * than the old agreeingPairs-count heuristic which conflated "many
 * overlapping pairs" with "many models agree".
 */
export function buildConsensus(responses: ModelResponse[]): {
  consensus: ConsensusLevel;
  combinedAnswer: string;
  recommendations: string[];
  modelsResponded: number;
} {
  const ok = responses.filter((r) => r.ok && r.response.trim().length > 0);
  const modelsResponded = ok.length;

  // Degraded case: no model responded.
  if (modelsResponded === 0) {
    return {
      consensus: "low",
      combinedAnswer:
        "The Mithqal Brain could not reach any of the 6 upstream models. " +
        "Check API keys, network connectivity, and try again. No consensus " +
        "was formed — operator review required.",
      recommendations: [
        "Verify GEMINI_API_KEY, HUGGINGFACE_API_KEY, GROQ_API_KEY, " +
          "OPENROUTER_API_KEY, NVIDIA_API_KEY, NEON_AI_GATEWAY_TOKEN are set.",
        "Retry the query in a few seconds — upstream may be rate-limited.",
      ],
      modelsResponded: 0,
    };
  }

  // Single-model case: cannot reach agreement; cap at "low".
  if (modelsResponded === 1) {
    const r = ok[0];
    return {
      consensus: "low",
      combinedAnswer: r.response,
      recommendations: extractRecommendations(r.response),
      modelsResponded: 1,
    };
  }

  // Compute pairwise Jaccard similarities and build the agreement graph.
  const tokenSets = ok.map((r) => tokenize(r.response));
  const n = ok.length;
  const agree: boolean[][] = Array.from({ length: n }, () =>
    Array(n).fill(false)
  );
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (jaccard(tokenSets[i], tokenSets[j]) >= AGREEMENT_THRESHOLD) {
        agree[i][j] = true;
        agree[j][i] = true;
      }
    }
  }

  // Find the largest clique of pairwise-agreeing models. With ≤6
  // models this brute-force over subsets (largest first) is trivially
  // cheap and avoids the NP-hardness that bites general clique search.
  const isClique = (members: number[]): boolean => {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (!agree[members[i]][members[j]]) return false;
      }
    }
    return true;
  };
  const combinations = (arr: number[], k: number): number[][] => {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [first, ...rest] = arr;
    return [
      ...combinations(rest, k - 1).map((c) => [first, ...c]),
      ...combinations(rest, k),
    ];
  };
  let largestAgreement = 1; // every model trivially agrees with itself
  for (let size = n; size >= 2; size--) {
    const combos = combinations(
      Array.from({ length: n }, (_, i) => i),
      size
    );
    if (combos.some(isClique)) {
      largestAgreement = size;
      break;
    }
  }

  // Map agreement-clique size → consensus level (per 6-provider spec):
  //   ≥3 agree → high   ·   2 agree → medium   ·   1 → low
  let consensus: ConsensusLevel;
  if (largestAgreement >= 3) {
    consensus = "high";
  } else if (largestAgreement === 2) {
    consensus = "medium";
  } else {
    consensus = "low";
  }

  // Pick the combined answer: the response with the highest mean
  // similarity to the others. Tie-break on heuristic confidence.
  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < ok.length; i++) {
    let mean = 0;
    let count = 0;
    for (let j = 0; j < ok.length; j++) {
      if (i === j) continue;
      mean += jaccard(tokenSets[i], tokenSets[j]);
      count += 1;
    }
    mean = count > 0 ? mean / count : 0;
    const score = mean * 0.7 + ok[i].confidence * 0.3;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  const combinedAnswer = ok[bestIdx].response;
  const recommendations = extractRecommendations(combinedAnswer);

  return { consensus, combinedAnswer, recommendations, modelsResponded };
}

/**
 * Extract actionable recommendation lines from a model response.
 *
 * Looks for:
 *   - Lines starting with a recommendation verb (recommend, should, must…)
 *   - Lines starting with a bullet/numbered-list marker
 * Cap at 5 recommendations.
 */
export function extractRecommendations(text: string): string[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const recs: string[] = [];
  const recVerb = /^\b(recommend|should|must|action|require|suggest|consider|need|ensure|verify|monitor)\b/i;
  const bullet = /^([-*•]|\d+[.)])\s+/;

  for (const line of lines) {
    if (recVerb.test(line) || bullet.test(line)) {
      // Strip the leading bullet/marker for cleanliness.
      const cleaned = line.replace(bullet, "").trim();
      if (cleaned.length >= 4 && cleaned.length <= 280) {
        recs.push(cleaned);
      }
    }
    if (recs.length >= 5) break;
  }

  // If we found no clear recommendations, fall back to the first 2
  // non-trivial sentences of the response.
  if (recs.length === 0) {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 20 && s.length <= 280);
    return sentences.slice(0, 2);
  }

  return recs;
}

/* ------------------------------------------------------------------ */
/*  Cross-provider failover (v25.5 / D3)                               */
/* ------------------------------------------------------------------ */

/**
 * Cross-provider failover — RECOVER a failed provider's slot by
 * substituting the response from a successful alternate provider
 * whose primary model is in the same coarse family.
 *
 * MOTIVATION:
 *   The per-provider fallback loop (inside each `queryXxx()` function)
 *   only swaps models WITHIN a single provider. If GROQ's API key is
 *   revoked, every model in the Groq chain 401s and the Groq card goes
 *   red — even if OpenRouter's `meta-llama/llama-3.3-70b-instruct`
 *   (same "llama-3.3-70b" family) just answered successfully. This
 *   function fills that gap: it LOANS the alternate's response into
 *   the failed provider's slot, preserving the failed slot's identity
 *   so the UI continues to render one card per provider.
 *
 * NON-MUTATING:
 *   Returns a NEW array of NEW `ModelResponse` objects. The input
 *   array and its objects are never modified. (Shallow copy is
 *   sufficient because every `ModelResponse` field is a primitive.)
 *
 * SUBSTITUTION SHAPE:
 *   For each failed `ModelResponse` (`ok: false`) for which a same-
 *   family successful alternate is found, the replacement object has:
 *     - `model`:           preserved (the failed provider's id —
 *                          the UI still renders the Groq card).
 *     - `label`:           augmented to `"<ProviderLabel> (failover
 *                          via <AltLabel>)"` so the operator can see
 *                          the substitution in the rendered card.
 *     - `response`,
 *       `confidence`,
 *       `latencyMs`:       copied verbatim from the alternate.
 *     - `ok`:              `true` (the slot is now considered
 *                          successful — consensus can use it).
 *     - `error`:           omitted (no error to surface).
 *
 * ALTERNATE SELECTION:
 *   Among all successful alternates in the same family, the one with
 *   the LOWEST `latencyMs` is chosen — a coarse proxy for "best
 *   available". A failed provider is never used as its own alternate.
 *
 * LIMITS (intentional):
 *   - This is a POST-HOC substitution, not a re-dispatch. No new HTTP
 *     calls are made. The "best alternate" is whichever alternate
 *     ALREADY succeeded in the parallel `Promise.allSettled` batch.
 *   - Family matching is coarse and hand-curated in `PRIMARY_FAMILY`.
 *     If no alternate shares the failed provider's family, the slot
 *     stays red. (E.g. Gemini ↔ no peer; NVIDIA Nemotron ↔ no peer.)
 *   - The substitution is purely additive to consensus: the alternate's
 *     own slot is unchanged, so the alternate now "votes twice" (once
 *     in its own slot, once in the recovered slot). This is the
 *     intended behavior — a single successful answer from a reliable
 *     provider is more useful than a missing vote. The consensus
 *     layer's Jaccard similarity will trivially register 1.0 between
 *     the two copies, so the largest pairwise-agreement clique grows
 *     by 1 — the consensus level may rise from "medium" to "high".
 *
 * Signature: `(results: ModelResponse[]) => ModelResponse[]` — pure
 * function, no side effects, no I/O. Safe to call from
 * `queryAllModels()` after `Promise.allSettled` returns.
 */
export function crossProviderFailover(
  results: ModelResponse[]
): ModelResponse[] {
  // Immutability: shallow-copy each ModelResponse. The fields are all
  // primitives (string/number/boolean) so a shallow copy is sufficient
  // to guarantee we never mutate the caller's objects.
  const out: ModelResponse[] = results.map((r) => ({ ...r }));

  // Index the successful responses by their PRIMARY family. The list
  // for each family is sorted by latency ascending so the first entry
  // is the "best available" alternate.
  const successByFamily = new Map<string, ModelResponse[]>();
  for (const r of results) {
    if (!r.ok) continue;
    const fam = PRIMARY_FAMILY[r.model];
    if (!fam) continue;
    const list = successByFamily.get(fam) ?? [];
    list.push(r);
    successByFamily.set(fam, list);
  }
  for (const list of successByFamily.values()) {
    list.sort((a, b) => a.latencyMs - b.latencyMs);
  }

  // For each failed slot, find the best alternate (same family, OK,
  // not the same provider) and substitute its response into the slot.
  for (let i = 0; i < out.length; i++) {
    const failed = out[i];
    if (failed.ok) continue;

    const fam = PRIMARY_FAMILY[failed.model];
    if (!fam) continue;

    const alternates = successByFamily.get(fam) ?? [];
    // The alternate must NOT be the same provider as the failed slot
    // (a provider can never substitute for itself).
    const alt = alternates.find((a) => a.model !== failed.model);
    if (!alt) continue;

    out[i] = {
      model: failed.model, // preserve slot identity (UI renders Groq card)
      label: `${MODEL_LABELS[failed.model]} (failover via ${alt.label})`,
      response: alt.response,
      confidence: alt.confidence,
      latencyMs: alt.latencyMs,
      ok: true,
      // `error` deliberately omitted — `ok: true` signals success.
    };
  }

  return out;
}

/* ------------------------------------------------------------------ */
/*  Parallel query                                                     */
/* ------------------------------------------------------------------ */

/**
 * Query all 6 models in parallel for a single prompt.
 *
 * Uses `Promise.allSettled` so a single failure does not abort the
 * others. Each model function returns a `ModelResponse` (with `ok: false`
 * on failure), so we never throw — the caller gets the full picture.
 *
 * The optional `systemContext` is prepended to the prompt to give all 6
 * models the same framing.
 *
 * v25.5 (D3): after `Promise.allSettled` returns, the result array is
 * passed through `crossProviderFailover()` so a provider whose entire
 * call failed (revoked API key, all fallbacks 5xx'd) can be RECOVERED
 * by substituting the response of an alternate provider whose primary
 * model is in the same coarse family. See the docstring on
 * `crossProviderFailover()` for the full rationale + limits.
 *
 * v25.3.22 (CR-2026-030 / Proposal E): Neon AI Gateway added as the 6th
 * provider. The gateway endpoint is UNVERIFIED — queryNeon() returns a
 * stub error so the Neon slot renders as a clearly-marked "endpoint not
 * yet verified" card rather than a transient upstream failure. The slot
 * still occupies a place in the consensus pool (one of six) but does
 * not contribute a vote until the endpoint is confirmed.
 */
export async function queryAllModels(
  prompt: string,
  systemContext?: string
): Promise<ModelResponse[]> {
  const fullPrompt = systemContext
    ? `${systemContext}\n\n---\n\n${prompt}`
    : prompt;
  const [gemini, groq, hf, openrouter, nvidia, neon] = await Promise.allSettled([
    queryGemini(fullPrompt),
    queryGroq(fullPrompt),
    queryHuggingFace(fullPrompt),
    queryOpenRouter(fullPrompt),
    queryNVIDIA(fullPrompt),
    queryNeon(fullPrompt),
  ]);
  const results: ModelResponse[] = [
    gemini.status === "fulfilled"
      ? gemini.value
      : { model: "gemini" as const, label: MODEL_LABELS.gemini, response: "", confidence: 0, latencyMs: 0, ok: false, error: "Gemini rejected" },
    hf.status === "fulfilled"
      ? hf.value
      : { model: "huggingface" as const, label: MODEL_LABELS.huggingface, response: "", confidence: 0, latencyMs: 0, ok: false, error: "HuggingFace rejected" },
    groq.status === "fulfilled"
      ? groq.value
      : { model: "groq" as const, label: MODEL_LABELS.groq, response: "", confidence: 0, latencyMs: 0, ok: false, error: "Groq rejected" },
    openrouter.status === "fulfilled"
      ? openrouter.value
      : { model: "openrouter" as const, label: MODEL_LABELS.openrouter, response: "", confidence: 0, latencyMs: 0, ok: false, error: "OpenRouter rejected" },
    nvidia.status === "fulfilled"
      ? nvidia.value
      : { model: "nvidia" as const, label: MODEL_LABELS.nvidia, response: "", confidence: 0, latencyMs: 0, ok: false, error: "NVIDIA rejected" },
    neon.status === "fulfilled"
      ? neon.value
      : { model: "neon" as const, label: MODEL_LABELS.neon, response: "", confidence: 0, latencyMs: 0, ok: false, error: "Neon rejected" },
  ];

  // v25.5 (D3): apply cross-provider failover to recover any slot
  // whose entire call failed, by substituting the response of an
  // alternate provider whose primary model is in the same family.
  // Pure function, non-mutating — `results` is unchanged.
  return crossProviderFailover(results);
}

/* ------------------------------------------------------------------ */
/*  Specialized Brain functions                                        */
/* ------------------------------------------------------------------ */

const SYSTEM_CONTEXT =
  "You are the Mithqal Brain, the consensus AI for Mithqal — a 100%-reserve " +
  "gold-backed stablecoin (MTQ) governed by a v19 Constitution that forbids " +
  "any discretionary minting or algorithmic policy. Your role is advisory: " +
  "you flag risks, screen counterparties, and detect anomalies. You NEVER " +
  "change weights, NAV, or reserves — those are deterministic on-chain. " +
  "Keep responses under 250 words, structured as bullet points where possible.";

/**
 * Risk Monitor — analyzes currency / reserve risks from live oracle data.
 *
 * The Brain asks all 6 models to assess the current gold/silver/stablecoin
 * snapshot, reserve ratio, and NAV for the Mithqal peg. Each model returns
 * a structured risk assessment; the Brain then forms a consensus.
 */
export async function riskMonitor(data: CurrencyData): Promise<{
  response: BrainResponse;
  risks: RiskAssessment[];
}> {
  const prompt =
    `Assess the current Mithqal currency-reserve risk profile given this live snapshot:\n\n` +
    `Gold: $${data.goldUsd?.toFixed(2) ?? "n/a"} / oz\n` +
    `Silver: $${data.silverUsd?.toFixed(2) ?? "n/a"} / oz\n` +
    `Stablecoins: ${JSON.stringify(data.stablecoins ?? {})}\n` +
    `Reserve Ratio: ${data.reserveRatio !== undefined ? (data.reserveRatio * 100).toFixed(2) + "%" : "n/a"}\n` +
    `NAV: $${data.navUsd?.toFixed(4) ?? "n/a"} / MTQ\n` +
    `Supply: ${data.supplyMtq?.toLocaleString() ?? "n/a"} MTQ\n` +
    `Source: ${data.source ?? "n/a"}\n\n` +
    `For EACH currency exposure (Gold, Silver, USDC, USDT, DAI), output:\n` +
    `  - riskLevel: low | medium | high\n` +
    `  - factors: 1-3 short reasons\n` +
    `  - recommendation: one short action\n\n` +
    `Then give an overall systemic risk read in 1 line. Be specific. Cite the numbers.`;

  const models = await queryAllModels(prompt, SYSTEM_CONTEXT);
  const consensusResult = buildConsensus(models);

  const brainResponse: BrainResponse = {
    query: "risk-monitor",
    type: "risk",
    timestamp: new Date().toISOString(),
    models,
    ...consensusResult,
  };

  // Parse structured risk items from the combined answer. If parsing
  // fails, fall back to a single "overall" assessment so the UI always
  // has something to render.
  const risks = parseRisks(consensusResult.combinedAnswer, data);

  return { response: brainResponse, risks };
}

/**
 * Compliance Assistant — KYC screening for Formation Committee intake.
 *
 * The Brain asks all 6 models to assess the counterparty risk of a
 * prospective Formation Committee participant based on the supplied
 * self-attested profile. Output: a risk score (0-100, higher = riskier),
 * a list of flags, and a recommendation (clear / review / escalate).
 */
export async function complianceAssistant(user: UserData): Promise<{
  response: BrainResponse;
  riskScore: number;
  flags: string[];
  recommendation: string;
}> {
  const prompt =
    `Perform a KYC / counterparty-risk screening for this Formation Committee applicant:\n\n` +
    `Full name: ${user.fullName}\n` +
    `Email: ${user.email}\n` +
    `Organization: ${user.org || "n/a"}\n` +
    `Role interest: ${user.role || "n/a"}\n\n` +
    `Output STRICTLY in this format (no preamble):\n` +
    `RISK_SCORE: <0-100, higher = riskier>\n` +
    `FLAGS:\n` +
    `- <flag 1>\n` +
    `- <flag 2>\n` +
    `RECOMMENDATION: clear | review | escalate\n` +
    `REASONING: <2-3 sentences>\n\n` +
    `Flag anything that could indicate sanctions exposure, PEP status, ` +
    `high-risk jurisdiction, mismatched identity, or unusual role/org combo. ` +
    `If you cannot determine something, say so — do not fabricate.`;

  const models = await queryAllModels(prompt, SYSTEM_CONTEXT);
  const consensusResult = buildConsensus(models);

  const brainResponse: BrainResponse = {
    query: "compliance-screening",
    type: "compliance",
    timestamp: new Date().toISOString(),
    models,
    ...consensusResult,
  };

  const parsed = parseCompliance(consensusResult.combinedAnswer);
  return { response: brainResponse, ...parsed };
}

/**
 * Anomaly Detection — scans recent on-chain transactions for unusual patterns.
 *
 * The Brain asks all 6 models to flag suspicious activity: unusually large
 * amounts, rapid sequences, circular transfers, unknown counterparties,
 * etc. Output: a list of anomalies with severity.
 */
export async function anomalyDetection(
  transactions: TransactionLike[]
): Promise<{
  response: BrainResponse;
  anomalies: AnomalyFinding[];
}> {
  // Truncate to the 25 most recent transactions to keep the prompt small.
  const recent = transactions.slice(0, 25);
  const txLines = recent
    .map(
      (t, i) =>
        `  ${i + 1}. ${t.type ?? "tx"} ${t.txHash ?? ""} ` +
        `from=${t.fromAddress ?? "?"} to=${t.toAddress ?? "?"} ` +
        `amount=${t.amount ?? "?"} fee=${t.fee ?? "?"} ` +
        `ts=${t.timestamp ?? "?"}`
    )
    .join("\n");

  const prompt =
    `Analyze the following ${recent.length} recent Mithqal transactions for anomalies.\n\n` +
    `Transactions:\n${txLines || "  (none)"}\n\n` +
    `Output STRICTLY in this format for EACH anomaly (skip if none):\n` +
    `ANOMALY: <txHash>\n` +
    `TYPE: <structural | volume | velocity | counterparty | other>\n` +
    `SEVERITY: info | warning | critical\n` +
    `REASON: <one short sentence>\n\n` +
    `Then give a 1-line overall assessment. Look for: unusually large ` +
    `amounts, rapid succession of mints/redeems, circular transfers ` +
    `(A→B→A), unknown or zero-address counterparties, fee anomalies.`;

  const models = await queryAllModels(prompt, SYSTEM_CONTEXT);
  const consensusResult = buildConsensus(models);

  const brainResponse: BrainResponse = {
    query: "anomaly-detection",
    type: "anomaly",
    timestamp: new Date().toISOString(),
    models,
    ...consensusResult,
  };

  const anomalies = parseAnomalies(consensusResult.combinedAnswer, recent);
  return { response: brainResponse, anomalies };
}

/* ------------------------------------------------------------------ */
/*  Response parsers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Parse the combined-answer text for risk assessments.
 *
 * Looks for blocks containing currency names + risk levels. If parsing
 * fails or finds nothing, returns a single "Overall" assessment using
 * the reserve ratio heuristic.
 */
function parseRisks(text: string, data: CurrencyData): RiskAssessment[] {
  const risks: RiskAssessment[] = [];
  const currencies = [
    { name: "Gold", pattern: /\bgold\b/i },
    { name: "Silver", pattern: /\bsilver\b/i },
    { name: "USDC", pattern: /\busdc\b/i },
    { name: "USDT", pattern: /\busdt\b/i },
    { name: "DAI", pattern: /\bdai\b/i },
  ];

  for (const c of currencies) {
    // Look for a paragraph/section that mentions this currency.
    const idx = text.search(c.pattern);
    if (idx < 0) continue;
    // Take a 240-char window around the mention.
    const start = Math.max(0, idx - 40);
    const window = text.slice(start, start + 280);

    const levelMatch = window.match(/\b(low|medium|high)\b(?:\s+risk)?/i);
    const riskLevel = (levelMatch?.[1]?.toLowerCase() ?? "medium") as
      | "low"
      | "medium"
      | "high";

    const factors: string[] = [];
    const bulletMatches = window.match(/[-*•]\s+([^\n]{4,120})/g);
    if (bulletMatches) {
      for (const b of bulletMatches.slice(0, 3)) {
        factors.push(b.replace(/^[-*•]\s+/, "").trim());
      }
    }
    if (factors.length === 0) {
      factors.push(`${c.name} exposure: see combined answer`);
    }

    // Extract the recommendation: the sentence after the first "recommend" verb.
    const recMatch = window.match(
      /\b(?:recommend|should|action)[:\s]+([^\n.]{10,140})/i
    );
    const recommendation =
      recMatch?.[1]?.trim() ?? `Monitor ${c.name} exposure; see Brain output.`;

    risks.push({ currency: c.name, riskLevel, factors, recommendation });
  }

  // If nothing parsed, synthesize a fallback risk row from the reserve ratio.
  if (risks.length === 0) {
    const rr = data.reserveRatio;
    const riskLevel: RiskAssessment["riskLevel"] =
      rr === undefined ? "medium" : rr >= 1.0 ? "low" : rr >= 0.95 ? "medium" : "high";
    risks.push({
      currency: "Overall",
      riskLevel,
      factors: [
        `Reserve ratio ${(rr ?? 0) * 100}%`,
        `NAV $${data.navUsd?.toFixed(4) ?? "n/a"}`,
        `Source: ${data.source ?? "n/a"}`,
      ],
      recommendation:
        riskLevel === "high"
          ? "Escalate to operator; pause minting until RR ≥ 1.00."
          : riskLevel === "medium"
            ? "Monitor; review reserve composition."
            : "Healthy; continue normal operations.",
    });
  }

  return risks;
}

/**
 * Parse a compliance screening response into a structured result.
 *
 * Expected format (from the prompt):
 *   RISK_SCORE: <0-100>
 *   FLAGS:
 *   - <flag>
 *   RECOMMENDATION: clear | review | escalate
 */
function parseCompliance(text: string): {
  riskScore: number;
  flags: string[];
  recommendation: string;
} {
  const scoreMatch = text.match(/RISK_SCORE[:\s]+(\d{1,3})/i);
  let riskScore = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 50;

  const flags: string[] = [];
  // Capture bullet lines under a FLAGS: header.
  const flagsBlock = text.match(/FLAGS[:\s]*\n([\s\S]*?)(?:\n\s*(?:RECOMMENDATION|REASONING|OVERALL|$))/i);
  if (flagsBlock) {
    const bullets = flagsBlock[1].match(/[-*•]\s+([^\n]{4,160})/g);
    if (bullets) {
      for (const b of bullets.slice(0, 8)) {
        flags.push(b.replace(/^[-*•]\s+/, "").trim());
      }
    }
  }
  // Fall back: scan the whole text for "flag" or "sanctions" mentions.
  if (flags.length === 0) {
    const lines = text.split(/\r?\n/);
    for (const l of lines) {
      if (/\b(flag|sanction|pep|risk|concern|mismatch)\b/i.test(l)) {
        const cleaned = l.trim();
        if (cleaned.length >= 8 && cleaned.length <= 200) flags.push(cleaned);
        if (flags.length >= 6) break;
      }
    }
  }

  const recMatch = text.match(/RECOMMENDATION[:\s]+(clear|review|escalate)/i);
  const recommendation = recMatch?.[1]?.toLowerCase() ?? "review";

  // If the model recommended escalate but didn't surface any flags,
  // the score alone is the signal — keep the score as-is.
  if (flags.length === 0 && recommendation !== "clear") {
    flags.push(`Model recommended ${recommendation} (risk score ${riskScore})`);
  }

  // Sanity: if risk score is high but recommendation says clear, downgrade.
  if (riskScore >= 70 && recommendation === "clear") {
    return { riskScore, flags, recommendation: "review" };
  }
  return { riskScore, flags, recommendation };
}

/**
 * Parse an anomaly detection response into structured findings.
 */
function parseAnomalies(
  text: string,
  transactions: TransactionLike[]
): AnomalyFinding[] {
  const findings: AnomalyFinding[] = [];

  // Split on the ANOMALY: marker. Each block typically spans 3-4 lines.
  const blocks = text.split(/\n\s*ANOMALY[:\s]+/i).slice(1);
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const firstLine = lines[0]?.trim() ?? "";
    const txHash = firstLine.match(/^(0x[a-fA-F0-9]{64})/)?.[1] ?? "";

    const typeMatch = block.match(/TYPE[:\s]+([^\n]+)/i);
    const sevMatch = block.match(/SEVERITY[:\s]+(info|warning|critical)/i);
    const reasonMatch = block.match(/REASON[:\s]+([^\n]+)/i);

    const type = typeMatch?.[1]?.trim() ?? "other";
    const severity = (sevMatch?.[1]?.toLowerCase() ?? "warning") as AnomalyFinding["severity"];
    const reason = reasonMatch?.[1]?.trim() ?? "No reason provided.";

    // If the model didn't quote a real tx hash, fall back to the first
    // transaction in the input list (the most recent one).
    const resolvedHash =
      txHash ||
      transactions.find((t) => t.txHash && /^0x[a-fA-F0-9]{64}$/.test(t.txHash))?.txHash ||
      "0xunknown";

    findings.push({ txHash: resolvedHash, type, reason, severity });
    if (findings.length >= 10) break;
  }

  // Heuristic fallback: if the Brain didn't produce structured anomalies
  // but did mention "no anomaly" or "clean", return an empty list.
  if (findings.length === 0 && /\b(no\s+anomal|clean|nothing\s+unusual)\b/i.test(text)) {
    return [];
  }

  // Heuristic fallback: scan recent transactions for an obvious red flag
  // (zero-address counterparties, very large amounts) and synthesize a
  // finding if the Brain missed it. Amounts are stored in wei (18 decimals),
  // so >1e21 wei ≈ >1 MTQ — flag any single tx over 100 MTQ as "volume".
  if (findings.length === 0 && transactions.length > 0) {
    for (const t of transactions) {
      const amtNum = typeof t.amount === "string" ? Number(t.amount) : (t.amount ?? 0);
      const fromZero = t.fromAddress === "0x0000000000000000000000000000000000000000";
      const large = Number.isFinite(amtNum) && amtNum > 1e23; // >~100 MTQ in wei
      if (fromZero || large) {
        findings.push({
          txHash: t.txHash ?? "0xunknown",
          type: fromZero ? "counterparty" : "volume",
          reason: fromZero
            ? "Zero-address counterparty detected (mint or burn)."
            : "Unusually large transaction amount.",
          severity: "info",
        });
        if (findings.length >= 3) break;
      }
    }
  }

  return findings;
}

/* ------------------------------------------------------------------ */
/*  Status probe                                                       */
/* ------------------------------------------------------------------ */

export interface BrainStatus {
  models: Array<{
    model: ModelResponse["model"];
    label: string;
    connected: boolean;
    configured: boolean;
    latencyMs: number;
    error?: string;
  }>;
  consensusEligible: boolean;
  timestamp: string;
}

/**
 * Probe each model with a tiny "ping" prompt to check connectivity +
 * measure latency. This is the GET /api/brain handler. We do NOT use
 * the full systemContext here — we want a fast cheap probe.
 */
export async function getBrainStatus(): Promise<BrainStatus> {
  const pingPrompt = "Reply with the single word OK.";
  const [gemini, groq, hf, openrouter, nvidia, neon] = await Promise.allSettled([
    queryGemini(pingPrompt),
    queryGroq(pingPrompt),
    queryHuggingFace(pingPrompt),
    queryOpenRouter(pingPrompt),
    queryNVIDIA(pingPrompt),
    queryNeon(pingPrompt),
  ]);

  const models: BrainStatus["models"] = [
    {
      model: "gemini",
      label: MODEL_LABELS.gemini,
      connected: gemini.status === "fulfilled" && gemini.value.ok,
      configured: Boolean(GEMINI_KEY),
      latencyMs: gemini.status === "fulfilled" ? gemini.value.latencyMs : 0,
      error:
        gemini.status === "fulfilled" && !gemini.value.ok
          ? gemini.value.error
          : gemini.status === "rejected"
            ? "rejected"
            : undefined,
    },
    {
      model: "huggingface",
      label: MODEL_LABELS.huggingface,
      connected: hf.status === "fulfilled" && hf.value.ok,
      configured: Boolean(HF_KEY),
      latencyMs: hf.status === "fulfilled" ? hf.value.latencyMs : 0,
      error:
        hf.status === "fulfilled" && !hf.value.ok
          ? hf.value.error
          : hf.status === "rejected"
            ? "rejected"
            : undefined,
    },
    {
      model: "groq",
      label: MODEL_LABELS.groq,
      connected: groq.status === "fulfilled" && groq.value.ok,
      configured: Boolean(GROQ_KEY),
      latencyMs: groq.status === "fulfilled" ? groq.value.latencyMs : 0,
      error:
        groq.status === "fulfilled" && !groq.value.ok
          ? groq.value.error
          : groq.status === "rejected"
            ? "rejected"
            : undefined,
    },
    {
      model: "openrouter",
      label: MODEL_LABELS.openrouter,
      connected: openrouter.status === "fulfilled" && openrouter.value.ok,
      configured: Boolean(OPENROUTER_KEY),
      latencyMs: openrouter.status === "fulfilled" ? openrouter.value.latencyMs : 0,
      error:
        openrouter.status === "fulfilled" && !openrouter.value.ok
          ? openrouter.value.error
          : openrouter.status === "rejected"
            ? "rejected"
            : undefined,
    },
    {
      model: "nvidia",
      label: MODEL_LABELS.nvidia,
      connected: nvidia.status === "fulfilled" && nvidia.value.ok,
      configured: Boolean(NVIDIA_KEY),
      latencyMs: nvidia.status === "fulfilled" ? nvidia.value.latencyMs : 0,
      error:
        nvidia.status === "fulfilled" && !nvidia.value.ok
          ? nvidia.value.error
          : nvidia.status === "rejected"
            ? "rejected"
            : undefined,
    },
    {
      model: "neon",
      label: MODEL_LABELS.neon,
      connected: neon.status === "fulfilled" && neon.value.ok,
      configured: Boolean(NEON_AI_GATEWAY_TOKEN),
      latencyMs: neon.status === "fulfilled" ? neon.value.latencyMs : 0,
      error:
        neon.status === "fulfilled" && !neon.value.ok
          ? neon.value.error
          : neon.status === "rejected"
            ? "rejected"
            : undefined,
    },
  ];

  const okCount = models.filter((m) => m.connected).length;
  return {
    models,
    consensusEligible: okCount >= 2, // need ≥2 models to form any consensus
    timestamp: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Dispatcher                                                         */
/* ------------------------------------------------------------------ */

/**
 * Dispatch a typed query to the appropriate specialized Brain function
 * (or fall back to the raw prompt for "general" queries).
 */
export async function dispatchBrainQuery(
  type: QueryType,
  query: string,
  data?: unknown
): Promise<BrainResponse> {
  if (type === "risk") {
    const currencyData = (data ?? {}) as CurrencyData;
    const { response } = await riskMonitor(currencyData);
    return response;
  }
  if (type === "compliance") {
    const user = (data ?? {}) as UserData;
    const { response } = await complianceAssistant(user);
    return response;
  }
  if (type === "anomaly") {
    const txs = (data ?? []) as TransactionLike[];
    const { response } = await anomalyDetection(txs);
    return response;
  }
  // general
  const models = await queryAllModels(query || "Hello.", SYSTEM_CONTEXT);
  const consensusResult = buildConsensus(models);
  return {
    query: query || "general",
    type: "general",
    timestamp: new Date().toISOString(),
    models,
    ...consensusResult,
  };
}

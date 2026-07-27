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
 * Architecture: 3 external LLMs are called in parallel for every query.
 *   - Gemini       (Google)            — broad reasoning + knowledge
 *   - HuggingFace  (Inference API)      — specialized financial models
 *   - Groq         (ultra-fast inference) — real-time analysis
 *
 * Consensus mechanism:
 *   - All 3 models agree  → high   confidence (green)
 *   - 2/3 models agree     → medium confidence (yellow)
 *   - All disagree         → low    confidence (red, needs human review)
 *
 * Agreement is measured via Jaccard similarity on the lowercased token
 * sets of each response (threshold: 0.30). This is intentionally a coarse
 * heuristic — the goal is to surface divergence to the operator, not to
 * produce a numerical "truth score". A real Binance-grade system would
 * use cross-encoder NLI scoring; the Constitution explicitly defers AI
 * details to engineering judgment.
 *
 * Failure model:
 *   - Each model call is wrapped in `Promise.allSettled`. If one model
 *     is down (timeout, bad key, 500), the Brain continues with the
 *     remaining models. With 2 models → max consensus is "medium". With
 *     1 model → max consensus is "low". With 0 → returns a degraded
 *     message and `consensus: "low"`.
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
  model: "gemini" | "huggingface" | "groq";
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
  /** Number of models that responded successfully (0..3). */
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

/** Per-call upstream timeout. 12s is generous for Groq, tight for HF. */
const UPSTREAM_TIMEOUT_MS = 12_000;

/** Jaccard similarity threshold above which two responses "agree". */
const AGREEMENT_THRESHOLD = 0.3;

const MODEL_LABELS: Record<ModelResponse["model"], string> = {
  gemini: "Gemini",
  huggingface: "HuggingFace",
  groq: "Groq",
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

  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
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
      const text = await res.text().catch(() => "");
      return {
        ...base,
        latencyMs: Date.now() - start,
        error: `Gemini HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
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
      return {
        ...base,
        latencyMs: Date.now() - start,
        ok: true,
        error: "Gemini returned an empty response",
      };
    }

    return {
      ...base,
      response: text,
      confidence: scoreConfidence(text),
      latencyMs: Date.now() - start,
      ok: true,
    };
  } catch (err) {
    return {
      ...base,
      latencyMs: Date.now() - start,
      error:
        err instanceof Error && err.name === "AbortError"
          ? "Gemini timed out"
          : err instanceof Error
            ? err.message
            : "Gemini call failed",
    };
  }
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
          model: "llama-3.3-70b-versatile",
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
      const text = await res.text().catch(() => "");
      return {
        ...base,
        latencyMs: Date.now() - start,
        error: `Groq HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      return {
        ...base,
        latencyMs: Date.now() - start,
        ok: true,
        error: "Groq returned an empty response",
      };
    }

    return {
      ...base,
      response: text,
      confidence: scoreConfidence(text),
      latencyMs: Date.now() - start,
      ok: true,
    };
  } catch (err) {
    return {
      ...base,
      latencyMs: Date.now() - start,
      error:
        err instanceof Error && err.name === "AbortError"
          ? "Groq timed out"
          : err instanceof Error
            ? err.message
            : "Groq call failed",
    };
  }
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

  try {
    const res = await fetchWithTimeout(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-70B-Instruct",
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
      const text = await res.text().catch(() => "");
      return {
        ...base,
        latencyMs: Date.now() - start,
        error: `HuggingFace HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as
      | Array<{ generated_text?: string }>
      | { generated_text?: string };

    const text = Array.isArray(json)
      ? (json[0]?.generated_text ?? "").trim()
      : (json?.generated_text ?? "").trim();

    if (!text) {
      return {
        ...base,
        latencyMs: Date.now() - start,
        ok: true,
        error: "HuggingFace returned an empty response",
      };
    }

    return {
      ...base,
      response: text,
      confidence: scoreConfidence(text),
      latencyMs: Date.now() - start,
      ok: true,
    };
  } catch (err) {
    return {
      ...base,
      latencyMs: Date.now() - start,
      error:
        err instanceof Error && err.name === "AbortError"
          ? "HuggingFace timed out"
          : err instanceof Error
            ? err.message
            : "HuggingFace call failed",
    };
  }
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
 * Build the consensus result from 3 model responses.
 *
 * Returns the consensus level + the combined answer + recommendations.
 * The "combined answer" is the response with the highest mean Jaccard
 * similarity to the other responses — i.e. the response that is most
 * "central" to the cluster. In the case of a tie or no agreement, we
 * pick the response with the highest heuristic confidence.
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
        "The Mithqal Brain could not reach any of the 3 upstream models. " +
        "Check API keys, network connectivity, and try again. No consensus " +
        "was formed — operator review required.",
      recommendations: [
        "Verify GEMINI_API_KEY, HUGGINGFACE_API_KEY, GROQ_API_KEY are set.",
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

  // Compute pairwise Jaccard similarities.
  const tokenSets = ok.map((r) => tokenize(r.response));
  const pairs: number[] = [];
  for (let i = 0; i < ok.length; i++) {
    for (let j = i + 1; j < ok.length; j++) {
      pairs.push(jaccard(tokenSets[i], tokenSets[j]));
    }
  }

  const agreeingPairs = pairs.filter((p) => p >= AGREEMENT_THRESHOLD).length;

  let consensus: ConsensusLevel;
  if (modelsResponded === 3) {
    if (agreeingPairs === 3) consensus = "high";
    else if (agreeingPairs >= 1) consensus = "medium";
    else consensus = "low";
  } else {
    // 2 models only — max consensus is "medium".
    consensus = agreeingPairs >= 1 ? "medium" : "low";
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
/*  Parallel query                                                     */
/* ------------------------------------------------------------------ */

/**
 * Query all 3 models in parallel for a single prompt.
 *
 * Uses `Promise.allSettled` so a single failure does not abort the
 * others. Each model function returns a `ModelResponse` (with `ok: false`
 * on failure), so we never throw — the caller gets the full picture.
 *
 * The optional `systemContext` is prepended to the prompt to give all 3
 * models the same framing.
 */
export async function queryAllModels(
  prompt: string,
  systemContext?: string
): Promise<ModelResponse[]> {
  const fullPrompt = systemContext
    ? `${systemContext}\n\n---\n\n${prompt}`
    : prompt;
  const [gemini, groq, hf] = await Promise.allSettled([
    queryGemini(fullPrompt),
    queryGroq(fullPrompt),
    queryHuggingFace(fullPrompt),
  ]);
  return [
    gemini.status === "fulfilled"
      ? gemini.value
      : { model: "gemini" as const, label: MODEL_LABELS.gemini, response: "", confidence: 0, latencyMs: 0, ok: false, error: "Gemini rejected" },
    hf.status === "fulfilled"
      ? hf.value
      : { model: "huggingface" as const, label: MODEL_LABELS.huggingface, response: "", confidence: 0, latencyMs: 0, ok: false, error: "HuggingFace rejected" },
    groq.status === "fulfilled"
      ? groq.value
      : { model: "groq" as const, label: MODEL_LABELS.groq, response: "", confidence: 0, latencyMs: 0, ok: false, error: "Groq rejected" },
  ];
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
 * The Brain asks all 3 models to assess the current gold/silver/stablecoin
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
 * The Brain asks all 3 models to assess the counterparty risk of a
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
 * The Brain asks all 3 models to flag suspicious activity: unusually large
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
  const [gemini, groq, hf] = await Promise.allSettled([
    queryGemini(pingPrompt),
    queryGroq(pingPrompt),
    queryHuggingFace(pingPrompt),
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

/**
 * Multi-provider consensus engine.
 *
 * Queries ALL available providers in parallel (Promise.allSettled), then
 * applies a similarity-based consensus strategy:
 *
 *   - 3+ providers agree (>=3 similar responses) → "unanimous"
 *   - exactly 2 providers agree                  → "majority"
 *   - only 1 succeeds                             → "single-fallback"
 *
 * "first-success" is returned when agreement checks are inconclusive but at
 * least one response is available (e.g. two providers disagree).
 *
 * Server-only. No external dependencies — uses fetch via providers.
 */

import { geminiProvider } from "./providers/gemini";
import { groqProvider } from "./providers/groq";
import { huggingfaceProvider } from "./providers/huggingface";
import { nvidiaProvider } from "./providers/nvidia";
import { openrouterProvider } from "./providers/openrouter";
import type {
  AIProvider,
  AIRequest,
  AIResponse,
  AIProviderError,
  ConsensusResult,
  ConsensusStrategy,
} from "./providers/types";

/** All providers, in the priority order consensus should prefer them. */
export const ALL_PROVIDERS: AIProvider[] = [
  groqProvider,
  openrouterProvider,
  nvidiaProvider,
  geminiProvider,
  huggingfaceProvider,
];

export interface ConsensusOptions {
  /** Minimum number of available providers required to attempt consensus. */
  minProviders?: number;
  /** Restrict the consensus run to a subset of provider names. */
  providers?: string[];
}

/**
 * Normalise a string for similarity comparison — lowercase, collapse
 * whitespace, strip punctuation. Returns a trimmed canonical form.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compare two responses for "agreement". Two responses agree if their
 * normalised forms share a Jaccard similarity above the threshold.
 *
 * We deliberately use a token-set Jaccard measure because providers often
 * paraphrase the same answer with slightly different wording.
 */
function isSimilar(a: string, b: string, threshold = 0.6): boolean {
  const na = normalize(a);
  const nb = normalize(b);

  // Fast path: identical normalised content.
  if (na === nb && na.length > 0) return true;

  const ta = new Set(na.split(" ").filter(Boolean));
  const tb = new Set(nb.split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return false;

  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection += 1;

  const union = ta.size + tb.size - intersection;
  return union > 0 && intersection / union >= threshold;
}

/**
 * Pick the consensus response + strategy from a set of successful responses.
 *
 * Returns the response text plus the strategy label and a hint about which
 * response object was chosen (so the caller can report its metadata).
 */
function resolveConsensus(
  successes: AIResponse[],
): { consensus: AIResponse; strategy: ConsensusStrategy } {
  if (successes.length === 1) {
    return { consensus: successes[0], strategy: "single-fallback" };
  }

  // Group responses by pairwise similarity.
  // Each response starts in its own group; merge groups whose representatives
  // are similar.
  const groups: number[][] = successes.map((_, i) => [i]);
  for (let i = 0; i < successes.length; i += 1) {
    for (let j = i + 1; j < successes.length; j += 1) {
      if (isSimilar(successes[i].content, successes[j].content)) {
        // Merge group containing i with group containing j.
        const gi = groups.findIndex((g) => g.includes(i));
        const gj = groups.findIndex((g) => g.includes(j));
        if (gi !== -1 && gj !== -1 && gi !== gj) {
          groups[gi] = groups[gi].concat(groups[gj]);
          groups.splice(gj, 1);
        }
      }
    }
  }

  // Find the largest group.
  let largest = groups[0];
  for (const g of groups) {
    if (g.length > largest.length) largest = g;
  }

  const largestSize = largest?.length ?? 0;

  // Prefer the fastest response in the largest group (lower latencyMs).
  const pickFromGroup = (group: number[]): AIResponse => {
    const sorted = [...group].sort(
      (a, b) => successes[a].latencyMs - successes[b].latencyMs,
    );
    return successes[sorted[0]];
  };

  if (largestSize >= 3) {
    return { consensus: pickFromGroup(largest), strategy: "unanimous" };
  }
  if (largestSize === 2) {
    return { consensus: pickFromGroup(largest), strategy: "majority" };
  }
  // No agreement but multiple responses — return first success by latency.
  const sortedAll = [...successes].sort((a, b) => a.latencyMs - b.latencyMs);
  return { consensus: sortedAll[0], strategy: "first-success" };
}

/**
 * Run a multi-provider consensus round.
 *
 * - Selects all available providers (filtered by `options.providers` if set).
 * - Enforces `options.minProviders` (default 1) — throws if fewer are ready.
 * - Fires every provider in parallel via Promise.allSettled().
 * - Resolves consensus using similarity-based grouping.
 *
 * Throws only if zero providers succeed AND we need at least one. The error
 * message will aggregate every provider failure.
 */
export async function runConsensus(
  req: AIRequest,
  options?: ConsensusOptions,
): Promise<ConsensusResult> {
  const minProviders = options?.minProviders ?? 1;

  let pool = ALL_PROVIDERS.filter((p) => p.available());

  if (options?.providers && options.providers.length > 0) {
    const wanted = new Set(options.providers.map((s) => s.toLowerCase()));
    pool = pool.filter((p) => wanted.has(p.name.toLowerCase()));
  }

  if (pool.length < minProviders) {
    throw new Error(
      `consensus requires at least ${minProviders} available providers, found ${pool.length}`,
    );
  }

  const settled = await Promise.allSettled(
    pool.map((p) => p.chat(req)),
  );

  const responses: AIResponse[] = [];
  const errors: AIProviderError[] = [];

  settled.forEach((s, idx) => {
    const provider = pool[idx].name;
    if (s.status === "fulfilled") {
      responses.push(s.value);
    } else {
      const reason = s.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason);
      errors.push({ provider, error: message });
    }
  });

  if (responses.length === 0) {
    const agg = errors
      .map((e) => `${e.provider}: ${e.error}`)
      .join("; ");
    throw new Error(`consensus failed — all providers errored. ${agg}`);
  }

  const { consensus, strategy } = resolveConsensus(responses);

  return {
    consensus: consensus.content,
    responses,
    errors,
    providersUsed: responses.map((r) => r.provider),
    strategy,
  };
}

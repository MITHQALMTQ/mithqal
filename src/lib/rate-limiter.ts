/**
 * MITHQAL — Token-bucket rate limiter (Phase 2 Security).
 *
 * Per §4.5 the API surface enforces a per-institution + per-route
 * token-bucket limit. The bucket capacity and refill rate depend on
 * the institution's tier:
 *   - STANDARD      → 100 rps (capacity 200, refill 100/s)
 *   - PREMIUM       → 500 rps (capacity 1000, refill 500/s)
 *   - ENTERPRISE    → 2000 rps (capacity 4000, refill 2000/s)
 *
 * When the bucket is empty the request is rejected with:
 *   - HTTP 429 Too Many Requests
 *   - `Retry-After: <seconds>`  (when the bucket will have ≥1 token)
 *   - `X-RateLimit-Limit: <capacity>`
 *   - `X-RateLimit-Remaining: 0`
 *   - `X-RateLimit-Reset: <epoch-seconds>` (when the bucket will
 *     refill to capacity)
 *
 * The bucket state is stored in the Turso `rate_limit_counters`
 * table (the ONLY Turso projection that is written by the app
 * directly — see `turso/schema.sql` table 7 + `docs/turso-policy.md`
 * §3 hard rule 1). Reads + writes use the libSQL client directly so
 * the rate limiter does not couple to the read-only `tursoRead()`
 * helper.
 *
 * Truth state: WIRED, NOT ENFORCED in the middleware chain. The
 * `checkRateLimit()` function is exported for the future middleware
 * to call; the pilot-permissive auth in `api-auth.ts` does not
 * invoke it yet.
 *
 * Fail-closed defaults: when the Turso client is unavailable, the
 * rate limiter returns `ok: true` (fail-open) because a hard rate
 * limit failure would lock every API user out. The status-bar
 * surfaces the Turso availability so an operator can intervene.
 */

import { createClient, type Client } from "@libsql/client";
import { logger } from "@/lib/logger";

export type InstitutionTier = "STANDARD" | "PREMIUM" | "ENTERPRISE";

export interface RateLimitConfig {
  capacity: number;
  refillRatePerSecond: number;
}

const TIER_CONFIG: Record<InstitutionTier, RateLimitConfig> = {
  STANDARD: { capacity: 200, refillRatePerSecond: 100 },
  PREMIUM: { capacity: 1_000, refillRatePerSecond: 500 },
  ENTERPRISE: { capacity: 4_000, refillRatePerSecond: 2_000 },
};

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  capacity: number;
  retryAfterSeconds: number;
  resetAtEpochSeconds: number;
  tier: InstitutionTier;
}

let client: Client | null = null;
let initWarned = false;

function getClient(): Client | null {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const token = process.env.TURSO_AUTH_TOKEN;
  try {
    if (url.startsWith("libsql://") || url.startsWith("wss://")) {
      if (!token) {
        if (!initWarned) {
          logger.warn(
            { url },
            "rate-limiter/TURSO_AUTH_TOKEN missing — fail-open until env vars are set.",
          );
          initWarned = true;
        }
        client = createClient({ url: "file:local.db" });
      } else {
        client = createClient({ url, authToken: token });
      }
    } else {
      client = createClient({ url });
    }
    return client;
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "rate-limiter/client construction failed",
    );
    return null;
  }
}

/**
 * Resolve the rate-limit tier for an institution. The mapping is
 * stored in the institutions.config JSONB column under
 * `config.rateLimitTier`. When the tier is absent, the default is
 * STANDARD. Pilot-tier elevation (PREMIUM / ENTERPRISE) requires a
 * signed contract that updates the institution's row.
 *
 * The pilot uses a global default (set via the
 * `MITHQAL_DEFAULT_RATE_LIMIT_TIER` env var) so demo deployments do
 * not need to seed the institutions table.
 */
export function resolveTier(institutionConfig: unknown): InstitutionTier {
  if (institutionConfig && typeof institutionConfig === "object") {
    const tier = (institutionConfig as { rateLimitTier?: string }).rateLimitTier;
    if (tier === "STANDARD" || tier === "PREMIUM" || tier === "ENTERPRISE") {
      return tier;
    }
  }
  const envDefault = process.env.MITHQAL_DEFAULT_RATE_LIMIT_TIER;
  if (envDefault === "PREMIUM" || envDefault === "ENTERPRISE" || envDefault === "STANDARD") {
    return envDefault;
  }
  return "STANDARD";
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check the rate limit for an institution + route. Returns:
 *   - { ok: true, remaining, ... } when the request is admitted;
 *     the bucket has been decremented.
 *   - { ok: false, retryAfterSeconds, ... } when the bucket is empty;
 *     the request is rejected with 429.
 *
 * The function reads + writes the `rate_limit_counters` Turso row.
 * When Turso is unavailable, the function returns `ok: true` and
 * logs a warning (fail-open per §3 fail-closed defaults — but only
 * for rate limiting; other modules fail closed).
 */
export async function checkRateLimit(
  institutionId: string,
  route: string,
  tier: InstitutionTier,
): Promise<RateLimitResult> {
  const config = TIER_CONFIG[tier];
  const nowMs = Date.now();
  const nowSec = nowSeconds();
  const rowId = `${institutionId}:${route}`;
  const c = getClient();

  // Fail-open when Turso is unavailable.
  if (!c) {
    return {
      ok: true,
      remaining: config.capacity,
      capacity: config.capacity,
      retryAfterSeconds: 0,
      resetAtEpochSeconds: nowSec + Math.ceil(config.capacity / config.refillRatePerSecond),
      tier,
    };
  }

  let tokens = config.capacity;
  let lastRefillMs = nowMs;

  try {
    const read = await c.execute({
      sql: "SELECT tokens, last_refill FROM rate_limit_counters WHERE id = ?",
      args: [rowId],
    });
    if (read.rows.length > 0) {
      const row = read.rows[0];
      if (row) {
        const storedTokens =
          typeof row.tokens === "number" ? row.tokens : Number(row.tokens);
        const storedLastRefill =
          typeof row.last_refill === "string"
            ? Date.parse(row.last_refill)
            : Number(row.last_refill);
        const elapsedMs = Math.max(
          0,
          nowMs - (Number.isFinite(storedLastRefill) ? storedLastRefill : nowMs),
        );
        const refillAmount = (elapsedMs / 1000) * config.refillRatePerSecond;
        tokens = Math.min(
          config.capacity,
          (Number.isFinite(storedTokens) ? storedTokens : config.capacity) + refillAmount,
        );
      }
    }
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), institutionId, route },
      "rate-limiter/read failed — failing open.",
    );
    return {
      ok: true,
      remaining: config.capacity,
      capacity: config.capacity,
      retryAfterSeconds: 0,
      resetAtEpochSeconds: nowSec + Math.ceil(config.capacity / config.refillRatePerSecond),
      tier,
    };
  }

  if (tokens < 1) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((1 - tokens) / config.refillRatePerSecond),
    );
    const resetAtEpochSeconds = nowSec + Math.ceil(config.capacity / config.refillRatePerSecond);
    logger.warn(
      { institutionId, route, tier, retryAfterSeconds },
      "rate-limit/rejected (bucket empty).",
    );
    return { ok: false, remaining: 0, capacity: config.capacity, retryAfterSeconds, resetAtEpochSeconds, tier };
  }

  const newTokens = tokens - 1;
  const projectedAt = new Date(nowMs).toISOString();
  const sourceCommit = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";

  try {
    // Upsert the new token count + last_refill timestamp.
    await c.execute({
      sql: `INSERT INTO rate_limit_counters
              (id, institution_id, route, tokens, capacity, refill_rate, last_refill, source_commit, projected_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              tokens = excluded.tokens,
              last_refill = excluded.last_refill,
              projected_at = excluded.projected_at,
              source_commit = excluded.source_commit`,
      args: [
        rowId,
        institutionId,
        route,
        newTokens,
        config.capacity,
        config.refillRatePerSecond,
        projectedAt,
        sourceCommit,
        projectedAt,
      ],
    });
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), institutionId, route },
      "rate-limiter/write failed — request admitted but bucket not decremented.",
    );
  }

  const resetAtEpochSeconds = nowSec + Math.ceil(config.capacity / config.refillRatePerSecond);
  return {
    ok: true,
    remaining: Math.floor(newTokens),
    capacity: config.capacity,
    retryAfterSeconds: 0,
    resetAtEpochSeconds,
    tier,
  };
}

/**
 * Build the standard X-RateLimit-* + Retry-After headers for a
 * rate-limited response. Used by the API gateway middleware when
 * the rate-limit check rejects a request.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.capacity),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAtEpochSeconds),
  };
  if (!result.ok) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }
  return headers;
}

/**
 * Exported for the status-bar component to render the active tiers.
 */
export const RATE_LIMIT_TIERS = TIER_CONFIG;

/**
 * In-memory IP-based rate limiter.
 *
 * Used to protect public POST endpoints (formation-interest, etc.) from spam
 * before persistent storage or a WAF is in place. Tracks request counts per
 * IP+route key in a Map that auto-expires entries after the window elapses.
 *
 * This is intentionally simple and process-local — sufficient for a single
 * serverless function instance. On Vercel, each function instance gets its
 * own Map, so the effective limit is `maxRequests × instance_count`. For a
 * stronger guarantee, move to Upstash Redis Ratelimit (see RECOMMENDATIONS.md
 * item #6 — Rate Limiting).
 *
 * Usage:
 *   import { checkRateLimit } from "@/lib/rate-limit";
 *   const { allowed, remaining, resetAt } = checkRateLimit("formation", ip, 5, 3600_000);
 *   if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateBucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, RateBucket>();

// Periodically purge expired buckets to prevent memory growth.
// Runs on every check; cheap because we only inspect the current key.
function purgeExpired(now: number): void {
  // Only purge when the map gets large (avoid overhead on every call).
  if (buckets.size < 200) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
  /** Suggested Retry-After header value in seconds (only set when blocked). */
  retryAfterSeconds?: number;
}

/**
 * Check whether a request should be allowed under the rate limit.
 *
 * @param namespace  Logical route name (e.g., "formation-interest")
 * @param identifier Usually the client IP (or user id if authenticated)
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs    Window size in milliseconds
 */
export function checkRateLimit(
  namespace: string,
  identifier: string,
  maxRequests = 5,
  windowMs = 3600_000 // 1 hour
): RateLimitResult {
  const now = Date.now();
  purgeExpired(now);

  const key = `${namespace}:${identifier}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    // First request in window (or previous window expired)
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, maxRequests - existing.count);

  if (existing.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  return { allowed: true, remaining, resetAt: existing.resetAt };
}

/**
 * Extract the client IP from a Next.js Request, handling Vercel's
 * `x-forwarded-for` header. Falls back to "unknown" if no headers are present
 * (in which case rate limiting effectively becomes global, not per-IP).
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // x-forwarded-for can be a comma-separated list; the first entry is the
    // original client IP.
    return xff.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Convenience: rate-limit a public POST endpoint using the standard
 * 5-requests-per-hour-per-IP policy. Returns null if allowed, or a
 * Response object to return immediately if blocked.
 */
export function enforceRateLimit(
  namespace: string,
  req: Request,
  maxRequests = 5,
  windowMs = 3600_000
): Response | null {
  const ip = getClientIp(req);
  const result = checkRateLimit(namespace, ip, maxRequests, windowMs);
  if (result.allowed) return null;
  return new Response(
    JSON.stringify({
      error: "Too many submissions. Please try again later.",
      retryAfter: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds ?? 60),
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}

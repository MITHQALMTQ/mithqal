/**
 * MITHQAL — Replay protection via nonce tracking (Phase 2 Security).
 *
 * Every signed write request MUST include a unique nonce in the
 * `X-Request-Nonce` header. The nonce is recorded in a bounded
 * in-process LRU cache with a 5-minute TTL (matching the signature
 * timestamp tolerance). A request that re-uses a nonce within its
 * TTL is rejected with 401 + `REPLAY_DETECTED`.
 *
 * The cache is per-process; for a multi-instance deployment the
 * cache is synced via the `replay-protection` Inngest function
 * (under `inngest/functions/`) that broadcasts nonce revocations to
 * peer instances via the outbox. For the pilot (single-instance
 * Vercel function) the in-process cache is sufficient.
 *
 * Truth state: WIRED, NOT ENFORCED. The verifier is implemented
 * but not wired into the API gateway (pilot-permissive today).
 *
 * Fail-closed defaults: when ENFORCE_REPLAY_PROTECTION is true and a
 * nonce has been seen before within the TTL, the request is
 * rejected. The cache evicts the oldest entries when it reaches the
 * cap (10_000 entries) so the process memory is bounded.
 */

import { logger } from "@/lib/logger";

const ENFORCE_REPLAY_PROTECTION =
  (process.env.MITHQAL_ENFORCE_REPLAY_PROTECTION ?? "false").trim().toLowerCase() === "true";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes — matches signature tolerance.
const NONCE_CACHE_CAP = 10_000;

interface NonceEntry {
  expiresAt: number; // epoch ms
}

// Bounded LRU-ish cache (Map preserves insertion order in JS, so we
// can evict the oldest entry when the cap is reached).
const nonceCache = new Map<string, NonceEntry>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of nonceCache) {
    if (entry.expiresAt < now) {
      nonceCache.delete(key);
    } else {
      // Map preserves insertion order; expired entries are clustered
      // at the front (oldest first), so we can break early.
      break;
    }
  }
}

function touch(key: string): void {
  const value = nonceCache.get(key);
  if (value) {
    nonceCache.delete(key);
    nonceCache.set(key, value);
  }
}

export interface ReplayCheckResult {
  ok: boolean;
  message?: string;
}

/**
 * Check + record a nonce. Returns:
 *   - { ok: true } when the nonce is fresh (has not been seen in the
 *     TTL window) — the nonce is recorded for future checks.
 *   - { ok: false, message } when the nonce has been seen in the
 *     TTL window — the request is a replay and MUST be refused.
 *
 * When ENFORCE_REPLAY_PROTECTION is false (pilot-permissive), the
 * function returns `{ ok: true }` for every request and does NOT
 * record the nonce — the cache stays empty.
 */
export function checkAndRecordNonce(nonce: string | null): ReplayCheckResult {
  if (!ENFORCE_REPLAY_PROTECTION) {
    return { ok: true, message: "Replay protection not enforced (pilot-permissive posture)." };
  }
  if (!nonce || nonce.length < 8 || nonce.length > 128) {
    return { ok: false, message: "X-Request-Nonce is required and must be 8..128 chars." };
  }

  evictExpired();

  if (nonceCache.has(nonce)) {
    touch(nonce);
    logger.warn(
      { nonce: nonce.slice(0, 8) + "…" },
      "replay-protection/nonce seen before — request refused.",
    );
    return { ok: false, message: "Replay detected: nonce has been seen within the TTL window." };
  }

  // Bounded LRU: when the cap is reached, evict the oldest entry
  // (the first key in the Map's insertion-order iteration).
  if (nonceCache.size >= NONCE_CACHE_CAP) {
    const oldest = nonceCache.keys().next();
    if (!oldest.done && oldest.value) {
      nonceCache.delete(oldest.value);
    }
  }

  nonceCache.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS });
  return { ok: true };
}

/**
 * Inspect the cache state. Used by the status-bar + the health-sweep
 * Inngest function to surface cache pressure.
 */
export function getReplayCacheStats(): {
  enforced: boolean;
  size: number;
  cap: number;
  ttlMs: number;
} {
  evictExpired();
  return {
    enforced: ENFORCE_REPLAY_PROTECTION,
    size: nonceCache.size,
    cap: NONCE_CACHE_CAP,
    ttlMs: NONCE_TTL_MS,
  };
}

/**
 * Test-only helper: clear the cache. Exported so unit tests can
 * reset the cache between scenarios without waiting for the TTL.
 * Not used in production code paths.
 */
export function clearReplayCacheForTests(): void {
  nonceCache.clear();
}

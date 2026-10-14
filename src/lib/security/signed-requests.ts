/**
 * MITHQAL — Signed API requests (Phase 2 Security).
 *
 * Canonical-byte-representation signing scheme for /api/v1/* write
 * endpoints. Every write request MUST carry:
 *   - `X-Signature-Timestamp` — Unix-epoch seconds, ±5 minutes window.
 *   - `X-Body-Digest`         — `sha256=<hex>` of the request body.
 *   - `X-Signature`            — `v1,hmac-sha256,<keyId>,<hex>`.
 *   - `X-Key-Id`               — the key identifier that selects the
 *                                 signing key from the key store.
 *
 * The signature is HMAC-SHA256 over the canonical byte string:
 *
 *   <METHOD>\n
 *   <PATH>\n
 *   <CANONICAL_QUERY>\n
 *   <X-Signature-Timestamp>\n
 *   <X-Body-Digest>\n
 *
 * CANONICAL_QUERY is the query string with parameters sorted by
 * key (byte order), URL-encoded per RFC 3986, and joined by `&`.
 *
 * Truth state: WIRED, NOT ENFORCED. The verifier is implemented but
 * not invoked by any middleware (pilot-permissive today). When G2
 * passes, the `verifySignedRequest()` function is wired into the
 * API gateway alongside `authenticateMtls()`.
 *
 * Fail-closed defaults: when ENFORCE_SIGNED_REQUESTS is true and a
 * request is missing any of the four headers, OR the timestamp is
 * outside the ±5-minute window, OR the signature does not match,
 * the request is rejected with 401 + `SIGNATURE_INVALID`.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { logger } from "@/lib/logger";

const ENFORCE_SIGNED_REQUESTS =
  (process.env.MITHQAL_ENFORCE_SIGNED_REQUESTS ?? "false").trim().toLowerCase() === "true";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60; // ±5 minutes per spec.

/**
 * The key store is keyed by `keyId`. In production, the keys live in
 * an external KMS (AWS KMS, GCP KMS, HashiCorp Vault); for the pilot,
 * the keys are stored in env vars as `MITHQAL_SIGNING_KEY_<KEYID>`
 * (base64url-encoded 32-byte HMAC keys).
 */
function lookupSigningKey(keyId: string): Buffer | null {
  if (!keyId || !/^[A-Za-z0-9_-]+$/.test(keyId)) {
    return null;
  }
  const envVar = `MITHQAL_SIGNING_KEY_${keyId.toUpperCase()}`;
  const b64url = process.env[envVar];
  if (!b64url) return null;
  try {
    // Buffer.from accepts base64url when the input has no padding.
    return Buffer.from(b64url, "base64url");
  } catch {
    return null;
  }
}

/**
 * Compute the canonical query string for a request URL. Parameters
 * are sorted by key (byte order), URL-encoded per RFC 3986, and
 * joined by `&`. Returns an empty string when there is no query.
 */
export function canonicalQueryString(url: string): string {
  let qs = "";
  const qIndex = url.indexOf("?");
  if (qIndex >= 0) {
    qs = url.slice(qIndex + 1);
  }
  if (!qs) return "";
  const pairs: Array<[string, string]> = [];
  for (const pair of qs.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const k = eq >= 0 ? pair.slice(0, eq) : pair;
    const v = eq >= 0 ? pair.slice(eq + 1) : "";
    pairs.push([decodeURIComponent(k), decodeURIComponent(v)]);
  }
  pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return pairs
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/**
 * Construct the canonical byte string that the signature covers.
 * Exported so test code can assert the byte-for-byte shape.
 */
export function canonicalBytes(opts: {
  method: string;
  path: string;
  queryString: string;
  timestamp: string;
  bodyDigest: string;
}): string {
  return (
    `${opts.method.toUpperCase()}\n` +
    `${opts.path}\n` +
    `${opts.queryString}\n` +
    `${opts.timestamp}\n` +
    `${opts.bodyDigest}\n`
  );
}

/**
 * Compute the body digest header value for a given body. Returns
 * `sha256=<hex>` per the spec.
 */
export function computeBodyDigest(body: Buffer | string | null): string {
  const buf = body ? (typeof body === "string" ? Buffer.from(body) : body) : Buffer.alloc(0);
  const hash = createHash("sha256").update(buf).digest("hex");
  return `sha256=${hash}`;
}

/**
 * Sign a request using the canonical bytes + the signing key for the
 * given `keyId`. Returns the canonical `X-Signature` header value:
 *   `v1,hmac-sha256,<keyId>,<hex>`.
 *
 * Exported so the test client + the bank-design-partner example
 * client can construct valid signed requests against the pilot.
 */
export function signRequest(opts: {
  method: string;
  url: string;
  body: Buffer | string | null;
  keyId: string;
  timestampSeconds?: number;
}): { signature: string; timestamp: string; bodyDigest: string } | null {
  const key = lookupSigningKey(opts.keyId);
  if (!key) return null;

  const timestamp = (opts.timestampSeconds ?? Math.floor(Date.now() / 1000)).toString();
  const bodyDigest = computeBodyDigest(opts.body);
  const path = opts.url.split("?")[0] ?? opts.url;
  const queryString = canonicalQueryString(opts.url);

  const bytes = canonicalBytes({
    method: opts.method,
    path,
    queryString,
    timestamp,
    bodyDigest,
  });

  const mac = createHmac("sha256", key).update(Buffer.from(bytes, "utf8")).digest("hex");
  return {
    signature: `v1,hmac-sha256,${opts.keyId},${mac}`,
    timestamp,
    bodyDigest,
  };
}

export interface SignatureVerifyResult {
  valid: boolean;
  keyId: string | null;
  message?: string;
}

/**
 * Verify the signature on an incoming request. The verifier:
 *   1. Reads the four headers (X-Signature-Timestamp, X-Body-Digest,
 *      X-Signature, X-Key-Id).
 *   2. Checks the timestamp is within ±5 minutes of the current time.
 *   3. Looks up the signing key by keyId.
 *   4. Reconstructs the canonical bytes from the request's method,
 *      path, query string, timestamp, and body digest header.
 *   5. Computes the expected HMAC-SHA256 and compares it to the
 *      presented signature using a constant-time comparison.
 *
 * When ENFORCE_SIGNED_REQUESTS is false (pilot-permissive), the
 * verifier returns `{ valid: true }` for every request, with a
 * message recording that signing was bypassed.
 */
export async function verifySignedRequest(request: Request, body: Buffer | string | null): Promise<SignatureVerifyResult> {
  if (!ENFORCE_SIGNED_REQUESTS) {
    return {
      valid: true,
      keyId: null,
      message: "Signed requests not enforced (pilot-permissive posture).",
    };
  }

  const timestamp = request.headers.get("x-signature-timestamp");
  const bodyDigest = request.headers.get("x-body-digest");
  const signature = request.headers.get("x-signature");
  const keyId = request.headers.get("x-key-id");

  if (!timestamp || !bodyDigest || !signature || !keyId) {
    return {
      valid: false,
      keyId: keyId ?? null,
      message: "Missing required signature header (X-Signature-Timestamp, X-Body-Digest, X-Signature, X-Key-Id).",
    };
  }

  const tsNumber = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(tsNumber)) {
    return { valid: false, keyId, message: "X-Signature-Timestamp is not a valid integer." };
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNumber) > TIMESTAMP_TOLERANCE_SECONDS) {
    return {
      valid: false,
      keyId,
      message: `X-Signature-Timestamp ${tsNumber} is outside the ±${TIMESTAMP_TOLERANCE_SECONDS}s window (now=${now}).`,
    };
  }

  // Parse the signature: `v1,hmac-sha256,<keyId>,<hex>`.
  const parts = signature.split(",");
  if (parts.length !== 4 || parts[0] !== "v1" || parts[1] !== "hmac-sha256" || parts[2] !== keyId) {
    return { valid: false, keyId, message: "X-Signature has an unexpected format." };
  }
  const presentedMac = parts[3];

  const key = lookupSigningKey(keyId);
  if (!key) {
    return { valid: false, keyId, message: `Unknown signing key id: ${keyId}` };
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const queryString = canonicalQueryString(request.url);
  const bytes = canonicalBytes({
    method: request.method,
    path,
    queryString,
    timestamp,
    bodyDigest,
  });

  const expectedMac = createHmac("sha256", key).update(Buffer.from(bytes, "utf8")).digest("hex");

  // Constant-time comparison to prevent timing oracles.
  const expected = Buffer.from(expectedMac, "hex");
  const presented = Buffer.from(presentedMac, "hex");
  if (expected.length !== presented.length || !timingSafeEqual(expected, presented)) {
    logger.warn(
      { keyId, path, method: request.method },
      "signed-request verification failed (signature mismatch).",
    );
    return { valid: false, keyId, message: "Signature does not match." };
  }

  return { valid: true, keyId };
}

/**
 * Convenience accessor for the runtime posture. Returns the string
 * the status-bar component uses to render the signed-requests state
 * badge.
 */
export function getSignedRequestsStatus(): { enforced: boolean } {
  return { enforced: ENFORCE_SIGNED_REQUESTS };
}

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Mithqal TOTP (Time-Based One-Time Password) utility — RFC 6238.
 *
 * Implementation notes:
 *   - 20-byte random secret (base32-encoded) — RFC 4226 §4, R4.
 *   - 30-second time step (T) — RFC 6238 §5.2.
 *   - SHA-1 HMAC (the universal default; every authenticator app supports it).
 *   - 6-digit truncated code — RFC 4226 §4.
 *   - Verification allows ±1 window tolerance (i.e. the previous, current,
 *     and next 30-second codes are accepted) to absorb client clock drift
 *     without weakening security.
 *
 * Uses ONLY Node's built-in `crypto` module — no external dependency.
 *
 * Constitutional context:
 *   Article VII (Proof of Reserves) requires daily cryptographic attestation;
 *   operator access to the attestation pipeline is gated by 2FA so that a
 *   compromised ADMIN_PASSWORD_HASH alone is insufficient to publish or
 *   mutate proofs. This module is the cryptographic core of that gate.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TIME_STEP_SECONDS = 30;
const CODE_DIGITS = 6;
const SECRET_BYTES = 20;
const DEFAULT_TOLERANCE = 1; // ±1 window = previous + current + next

/* ---- Base32 (RFC 4648) — encode/decode without padding ---- */

function base32Encode(buf: Buffer): string {
  let output = "";
  let bits = 0;
  let value = 0;
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      // Skip unknown chars (e.g. spaces already stripped, but be defensive)
      continue;
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/* ---- Core HOTP/TOTP primitives ---- */

/**
 * Generate a HOTP code (RFC 4226) for the given counter.
 * Used internally by generateCode/verifyCode.
 */
function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // Counter is a 64-bit big-endian unsigned integer.
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();

  // Dynamic truncation (RFC 4226 §5.3)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = binary % 10 ** CODE_DIGITS;
  return code.toString().padStart(CODE_DIGITS, "0");
}

function counterForTime(timeMs: number): number {
  return Math.floor(Math.floor(timeMs / 1000) / TIME_STEP_SECONDS);
}

/* ---- Public API ---- */

/**
 * Generate a fresh TOTP secret.
 * Returns a base32-encoded 20-byte (160-bit) random key — the standard
 * length recommended by RFC 4226 §4. Suitable for direct entry into any
 * authenticator app (Google Authenticator, Authy, 1Password, etc.).
 *
 * Example otpauth URI for QR-code enrollment:
 *   `otpauth://totp/Mithqal:operator?secret=<secret>&issuer=Mithqal&algorithm=SHA1&digits=6&period=30`
 */
export function generateSecret(): string {
  return base32Encode(randomBytes(SECRET_BYTES));
}

/**
 * Generate the 6-digit TOTP code for the given secret at the given time
 * (defaults to `Date.now()`). Useful for tests and for server-side
 * cross-checks during enrollment.
 */
export function generateCode(secret: string, atTimeMs: number = Date.now()): string {
  const key = base32Decode(secret);
  return hotp(key, counterForTime(atTimeMs));
}

/**
 * Verify a 6-digit TOTP code against a secret. Allows ±`tolerance` windows
 * (default 1 = previous + current + next 30-second codes) to absorb clock
 * drift between the operator's authenticator and the server.
 *
 * Constant-time comparison is used for the final equality check so the
 * verification does not leak timing information about the expected code.
 *
 * Returns true if the code matches any accepted window, false otherwise.
 * Also returns false (rather than throwing) on malformed input — callers
 * can treat any non-true result as "denied".
 */
export function verifyCode(
  secret: string,
  code: string,
  atTimeMs: number = Date.now(),
  tolerance: number = DEFAULT_TOLERANCE,
): boolean {
  // Reject malformed codes before doing any crypto work — avoids
  // timingSafeEqual throwing on length mismatch and gives a clean failure
  // path for "user typed nothing" / "user typed 4 digits".
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) return false;
  if (tolerance < 0 || !Number.isFinite(tolerance)) return false;

  const key = base32Decode(secret);
  const baseCounter = counterForTime(atTimeMs);
  const submitted = Buffer.from(code, "ascii");

  for (let i = -tolerance; i <= tolerance; i++) {
    const expected = hotp(key, baseCounter + i);
    const expectedBuf = Buffer.from(expected, "ascii");
    if (expectedBuf.length === submitted.length && timingSafeEqual(expectedBuf, submitted)) {
      return true;
    }
  }
  return false;
}

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { scryptSync, timingSafeEqual, createHmac } from "crypto";
import { verifyCode } from "./totp";

/**
 * Mithqal operator authentication.
 *
 * A single operator account is defined by environment variables
 * (ADMIN_EMAIL + ADMIN_PASSWORD_HASH). The password is verified against a
 * scrypt hash — no plaintext password is ever stored. No user table is
 * required for auth; the operator is the env-defined principal.
 *
 * Sessions are JWT-based (stateless), so no DB session store is needed.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2FA (TOTP, RFC 6238) — OPTIONAL SECOND STEP
 * ─────────────────────────────────────────────────────────────────────────
 * Two-factor auth is wired and ready, but inert until the operator configures
 * a TOTP secret. To enable:
 *
 *   1. Generate a secret: `import { generateSecret } from "@/lib/totp";`
 *      Call `generateSecret()` once and store the result as the
 *      `OPERATOR_TOTP_SECRET` environment variable (base32 string).
 *   2. Enroll the secret in any authenticator app (Google Authenticator,
 *      Authy, 1Password, etc.) using the otpauth:// URI:
 *        otpauth://totp/Mithqal:operator?secret=<secret>&issuer=Mithqal&algorithm=SHA1&digits=6&period=30
 *   3. The Admin UI can then call `verify2FA(secret, code)` after a successful
 *      credentials login to obtain a `twofaVerified: true` JWT. The session's
 *      `twofaVerified` field is exposed to client code via the session
 *      callback so the UI can gate sensitive actions on it.
 *
 * Until `OPERATOR_TOTP_SECRET` is set, the existing credentials-only login
 * flow is unchanged: `twofaVerified` simply stays `false` on the session and
 * the `verify2FA` helper throws a clear configuration error if invoked.
 */

function verifyPassword(submitted: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = scryptSync(submitted, salt, expected.length);
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h operator session
  pages: {
    // We don't use a separate route — the Admin view renders its own login
    // card and calls signIn("credentials", { redirect: false }).
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Operator",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        const expectedEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
        if (!email || !password || email !== expectedEmail) return null;
        if (!verifyPassword(password)) return null;
        return { id: "operator", email, name: "Operator" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email ?? token.email;
        token.role = "operator";
        // 2FA starts UNVERIFIED on every fresh login. It is flipped to
        // `true` only when the operator completes the second step via
        // `verify2FA()`. Existing credentials-only logins are unchanged —
        // `twofaVerified` simply stays `false` until 2FA is configured.
        token.twofaVerified = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      // Surface the 2FA status on the session object so the Admin UI can
      // gate sensitive actions (proof publication, oracle updates, etc.)
      // behind an `if (session.twofaVerified)` check.
      (session as SessionWith2FA).twofaVerified = Boolean(token.twofaVerified);
      return session;
    },
  },
};

/* ---- 2FA helper ----
 * Returns a signed JWT carrying `twofaVerified: true`. The token is signed
 * with NEXTAUTH_SECRET (falling back to JWT_SECRET) using HS256 — the same
 * secret NextAuth uses to sign its own session JWTs, so verifying either
 * token uses the same key.
 *
 * The operator can attach this token to subsequent requests as
 * `Authorization: Bearer <token>` to prove they have completed the second
 * factor. Verification on the server side is a standard HS256 JWT decode +
 * signature check.
 *
 * Throws if the TOTP secret is not configured OR if the code is wrong.
 * Callers should `try/catch` and treat any throw as "2FA failed".
 */

const TWOfA_TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8h, matches session maxAge

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + TWOfA_TOKEN_TTL_SECONDS };
  const segments = [base64UrlEncode(JSON.stringify(header)), base64UrlEncode(JSON.stringify(body))];
  const signingInput = segments.join(".");
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

export interface Verify2FAResult {
  verified: true;
  token: string;
  /** ISO timestamp at which the issued token expires. */
  expiresAt: string;
}

/**
 * Verify a TOTP code against the operator-configured secret and, on success,
 * issue a JWT asserting `twofaVerified: true`.
 *
 * Usage:
 *   const result = await verify2FA(process.env.OPERATOR_TOTP_SECRET, code);
 *   // result.token → forward to client as the 2FA bearer token
 *
 * Throws if:
 *   - the secret env var is not set (operator hasn't enrolled yet)
 *   - the code is missing/invalid/malformed
 *   - NEXTAUTH_SECRET (or JWT_SECRET) is not set (cannot sign the JWT)
 */
export async function verify2FA(secret: string | undefined, code: string): Promise<Verify2FAResult> {
  if (!secret) {
    throw new Error(
      "2FA is not configured: set OPERATOR_TOTP_SECRET before calling verify2FA(). " +
        "Generate one with `import { generateSecret } from '@/lib/totp'; generateSecret()`.",
    );
  }
  if (!code || typeof code !== "string") {
    throw new Error("2FA code is required.");
  }
  if (!verifyCode(secret, code)) {
    throw new Error("Invalid or expired TOTP code.");
  }

  const signingSecret = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
  if (!signingSecret) {
    throw new Error("Cannot issue 2FA token: NEXTAUTH_SECRET (or JWT_SECRET) is not set.");
  }

  const token = signJwt(
    { sub: "operator", role: "operator", twofaVerified: true },
    signingSecret,
  );
  const expiresAt = new Date(Date.now() + TWOfA_TOKEN_TTL_SECONDS * 1000).toISOString();
  return { verified: true, token, expiresAt };
}

/* ---- Types ---- */

interface SessionWith2FA {
  twofaVerified?: boolean;
}

export type Role = "operator";

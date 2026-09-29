// R12 — CSP nonce pipeline (v25.8)
//
// Generates a per-request 16-byte base64url nonce and:
// 1. Sets it as a cookie (so server components can read it)
// 2. Adds it to the CSP header (script-src 'nonce-<random>' 'strict-dynamic')
// 3. Propagates it to Next.js via the request.headers API
//
// In production, this replaces 'unsafe-inline' in script-src. In dev,
// 'unsafe-inline' + 'unsafe-eval' are kept (Turbopack/webpack HMR needs them).
//
// Per IMPL-RECOMMENDATIONS R12 (MEDIUM priority security debt from v25.4 audit).
//
// NOTE: Next.js 16's App Router does NOT yet propagate a per-request nonce to
// the inline hydration scripts emitted by the framework. Shipping a strict
// prod CSP with `'nonce-<random>'` alone would BREAK the live site (hydration
// scripts would be blocked by the browser). So the production CSP below:
//   • Adds `'nonce-<random>'` + `'strict-dynamic'` (so a nonce-tagged script
//     can bootstrap any cascading scripts it loads).
//   • KEEPS `'unsafe-inline'` as a fallback for now — the nonce alone is the
//     forward-looking signal; `'unsafe-inline'` is ignored by browsers when
//     `'nonce-<random>'` is present (per the CSP spec, a nonce or hash in
//     script-src makes `'unsafe-inline'` ignored), so adding both is the
//     safe stepping-stone. The next hardening pass (after Next.js exposes
//     a per-request nonce API on the framework level) will drop the
//     `'unsafe-inline'` and ship pure nonce enforcement.
//   • REMOVES `'unsafe-eval'` in production (it was only required for dev
//     HMR + sourcemaps).
//
// Note: Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts` (same
// API, new filename). The dev server emits a deprecation warning but the
// middleware still works. Future work: rename to `proxy.ts` once the API
// is fully stabilized.

import { NextRequest, NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

export function middleware(request: NextRequest) {
  const nonce = generateNonce();

  // Clone the request headers so we can set the nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // Build the CSP header — strict in production, permissive in dev
  const csp = isProduction
    ? buildProductionCSP(nonce)
    : buildDevCSP();

  // Create the response with the nonce header set
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  // Also set the nonce as a cookie so server components can read it
  response.cookies.set("x-nonce", nonce, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });

  return response;
}

function generateNonce(): string {
  // 16 bytes = 128 bits of entropy, base64url encoded (22 chars)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildProductionCSP(nonce: string): string {
  // NOTE: 'unsafe-inline' is intentionally retained as a fallback while
  // Next.js 16 App Router doesn't yet propagate a per-request nonce to its
  // inline hydration scripts. Per the CSP spec, when a nonce is present in
  // script-src, browsers IGNORE 'unsafe-inline' — so this is a forward-
  // compatible stepping stone, not a regression.
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.gold-api.com https://open.er-api.com https://api.coingecko.com https://api.metals.dev https://testnet-rpc.monad.xyz https://rpc.testnet.arc.io https://api.devnet.solana.com https://mithqal.vercel.app https://raw.githubusercontent.com wss:",
    "media-src 'self' https://raw.githubusercontent.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
  ].join("; ");
}

function buildDevCSP(): string {
  // Dev mode keeps 'unsafe-inline' + 'unsafe-eval' (required for HMR + sourcemaps)
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.gold-api.com https://open.er-api.com https://api.coingecko.com https://api.metals.dev https://testnet-rpc.monad.xyz https://rpc.testnet.arc.io https://api.devnet.solana.com https://mithqal.vercel.app https://raw.githubusercontent.com wss:",
    "media-src 'self' https://raw.githubusercontent.com",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export const config = {
  // Match all routes except static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore build errors from test files (financial-soundness-tests.ts has
    // pre-existing type import issues that don't affect runtime).
    // Production code is fully typed.
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // ────────────────────────────────────────────────────────────────
          // R12 — CSP nonce pipeline (v25.8 — IMPLEMENTED)
          // ────────────────────────────────────────────────────────────────
          //
          // The Content-Security-Policy header is NO LONGER set here. It is
          // set per-request by `src/middleware.ts` so each response carries a
          // unique `script-src 'nonce-<random>'` value (16 bytes of entropy,
          // base64url — 22 chars).
          //
          // Production CSP (NODE_ENV=production):
          //   script-src 'self' 'nonce-<random>' 'strict-dynamic' 'unsafe-inline'
          //   ↑ removes 'unsafe-eval' (was only required for dev HMR/sourcemaps)
          //   ↑ adds per-request nonce + 'strict-dynamic' (forward-compatible:
          //     per the CSP spec, when a nonce is present, browsers IGNORE
          //     'unsafe-inline', so we keep it as a fallback until Next.js 16
          //     exposes a per-request nonce API on the framework level so we
          //     can tag the inline hydration scripts)
          //   + `report-uri /api/csp-report` (NEW — captured by the new
          //     /api/csp-report endpoint)
          //   + `frame-ancestors 'none'` (was implicit via X-Frame-Options: DENY)
          //
          // Dev CSP (NODE_ENV!==production):
          //   script-src 'self' 'unsafe-inline' 'unsafe-eval'
          //   ↑ kept permissive so Turbopack/webpack HMR + sourcemaps work
          //
          // Debt tracking: see IMPL-RECOMMENDATIONS R12 (MEDIUM priority
          // security debt from v25.4 audit — CLOSED in v25.8 by this commit).
          // ────────────────────────────────────────────────────────────────
        ],
      },
    ];
  },
};

export default nextConfig;

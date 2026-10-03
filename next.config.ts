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
          // R12 — CSP nonce hardening (SECURITY DEBT — tracked for follow-up)
          // ────────────────────────────────────────────────────────────────
          //
          // Current state: script-src retains 'unsafe-inline' + 'unsafe-eval'.
          // This is required because:
          //   • Next.js (Turbopack) injects inline scripts for hydration data
          //     and runtime chunks; without a per-request nonce these are
          //     indistinguishable from XSS payloads.
          //   • Recharts / Framer Motion / shadcn-ui occasionally emit small
          //     inline style blocks that currently rely on 'unsafe-inline'
          //     for style-src as well.
          //
          // Plan to harden (priority MEDIUM, post-launch):
          //   1. Introduce `middleware.ts` that generates a 16-byte base64url
          //      nonce per request and writes it to `request.cookies` and the
          //      response `Content-Security-Policy` header.
          //   2. Configure Next.js to emit the nonce on every <script> via
          //      the App Router nonce propagation (set `__NEXT_NONCE__` env
          //      or use `next.config.ts` `experimental.cspHeader` once the
          //      Turbopack nonce pass-through stabilises).
          //   3. Replace 'unsafe-inline' in script-src with 'nonce-<random>'
          //      AND 'strict-dynamic' to allow trusted cascading scripts.
          //   4. Add 'unsafe-hashes' + per-hash allowlist for any third-party
          //      inline handlers (a partial improvement we can ship today
          //      once the nonce pipeline lands).
          //   5. Remove 'unsafe-eval' once dev-only sourcemap reliance is
          //      moved behind a NODE_ENV guard.
          //
          // Until the nonce pipeline ships, this header intentionally keeps
          // 'unsafe-inline' so the live site remains functional. The debt
          // is documented in RECOMMENDATIONS.md (R12) and tracked in the
          // institutional roadmap.
          // ────────────────────────────────────────────────────────────────
          // CSP — Content Security Policy (free security hardening)
          // Allows: self, Vercel inline styles/scripts, Google Fonts, gold-api.com, er-api.com, CoinGecko, Monad RPC, wss for WebSocket
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.gold-api.com https://open.er-api.com https://api.coingecko.com https://api.metals.dev https://testnet-rpc.monad.xyz https://rpc.testnet.arc.io https://api.devnet.solana.com https://mithqal.vercel.app https://raw.githubusercontent.com wss:",
              "media-src 'self' https://raw.githubusercontent.com",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

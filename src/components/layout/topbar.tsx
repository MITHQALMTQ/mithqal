"use client";

import Link from "next/link";

/* ──────────────────────────────────────────────────────────────
 * Topbar — minimal glassmorphic command-center header.
 *
 * Composition (left → right):
 *   • Brand mark (gold gradient square "M") + "Assurance" wordmark
 *   • DEMO badge (amber, rounded-full, static)
 *   • "← Home" link to "/"
 *
 * Height: h-14. Sticky top, z-40, backdrop-blur, hairline border.
 * ────────────────────────────────────────────────────────────── */

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        {/* ── Brand mark + wordmark ── */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-300 to-amber-500 font-mono text-sm font-bold text-[#0a0e1a] shadow-lg shadow-amber-500/20"
          >
            M
          </span>
          <span className="text-sm font-semibold text-white">Assurance</span>
        </Link>

        {/* ── Right cluster: DEMO badge + Home link ── */}
        <div className="ml-auto flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300"
            title="Running on synthetic demo data"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-amber-400"
              aria-hidden="true"
            />
            DEMO
          </span>
          <Link
            href="/"
            className="text-xs font-medium text-slate-400 transition-colors hover:text-white"
            title="Back to home"
          >
            ← Home
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

/* ──────────────────────────────────────────────────────────────
 * StatusBar — minimal static status strip pinned to the bottom of
 * the dashboard shell.
 *
 * Single line, centered, all-static text — no polling, no fetch, no
 * state. Intentionally a server component (no "use client") so it
 * stays cheap and renders identically on server + client.
 *
 * Layout: "System: Healthy · DB: Connected · Updated: just now"
 * ────────────────────────────────────────────────────────────── */

export function StatusBar() {
  return (
    <footer
      role="contentinfo"
      aria-label="System status"
      className="sticky bottom-0 z-30 w-full border-t border-white/5 bg-[#07090e]/80 backdrop-blur-xl"
    >
      <div className="flex items-center justify-center gap-3 py-1 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
          />
          System:&nbsp;<span className="text-slate-300">Healthy</span>
        </span>
        <span aria-hidden="true" className="text-slate-700">
          ·
        </span>
        <span>
          DB:&nbsp;<span className="text-slate-300">Connected</span>
        </span>
        <span aria-hidden="true" className="text-slate-700">
          ·
        </span>
        <span>
          Updated:&nbsp;<span className="text-slate-300">just now</span>
        </span>
      </div>
    </footer>
  );
}

export default StatusBar;

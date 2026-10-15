import Link from "next/link";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/layout/sidebar";

/**
 * Topbar — sticky institutional header for the dashboard shell.
 *
 * Layout (left → right):
 *   [Mobile hamburger] [Logo + wordmark] [DEMO badge]  ···  [disclaimer]
 *
 * - The hamburger (`<MobileNav />`) is the Sheet trigger wired up in
 *   `sidebar.tsx`. Its own button carries `md:hidden` so it only appears on
 *   mobile; desktop shows the persistent sidebar instead.
 * - The wordmark + DEMO badge use the gold accent token (`text-gold` /
 *   `border-gold/40 bg-gold/10`) to match the institutional design system.
 * - The right-side disclaimer is hidden on very small screens to avoid
 *   crowding the wordmark + badge.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {/* Mobile-only hamburger — opens the Sheet sidebar (md:hidden) */}
        <MobileNav />
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-sm font-semibold tracking-wide text-gold">
            MITHQAL Assurance
          </span>
        </Link>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
          DEMO
        </span>
      </div>
      <span className="hidden sm:inline text-xs text-slate-500">
        DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE
      </span>
    </header>
  );
}

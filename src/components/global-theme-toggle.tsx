"use client";

import { ThemeToggle } from "@/components/theme-toggle";

/**
 * GlobalThemeToggle — fixed-position floating button rendered in the root
 * layout so that the dark / light / cyber theme switcher is accessible
 * from every route (including the 5 institutional pages: /, /features,
 * /ecosystem, /roadmap, /about).
 *
 * Positioned bottom-right with a high z-index so it floats above the
 * institutional dark backgrounds. Pointer-events and aria-label ensure
 * keyboard + screen-reader accessibility.
 */
export function GlobalThemeToggle() {
  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-ink-card/70 backdrop-blur-md shadow-lg shadow-black/40 hover:border-gold/80 hover:bg-ink-card/90 transition-colors"
      aria-label="Theme switcher"
      role="region"
    >
      <ThemeToggle />
    </div>
  );
}

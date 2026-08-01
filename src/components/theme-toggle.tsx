"use client";

import { useState, useCallback } from "react";
import { Moon, Sun, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ThemeToggle — dark / light / cyber mode switcher.
 *
 * Cycles: Dark → Light → Cyber → Dark.
 *
 * Implementation: directly manipulates the `class` attribute on <html>.
 * This avoids next-themes' limitation of only supporting "dark" and "light"
 * natively — "cyber" is a custom theme that adds green-on-black styling.
 *
 * The toggle reads the current theme from <html>'s class list on mount
 * (via a useState initializer + useEffect) to avoid hydration mismatches.
 */

type Theme = "dark" | "light" | "cyber";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("mithqal-theme");
    if (stored === "light" || stored === "cyber" || stored === "dark") return stored;
  } catch {}
  return "dark";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  // Remove all theme classes
  html.classList.remove("dark", "light", "cyber");
  // Add the new one
  html.classList.add(theme);
  // Store preference
  try {
    localStorage.setItem("mithqal-theme", theme);
  } catch {}
}

export function ThemeToggle() {
  const [current, setCurrent] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Read the actual theme on mount (client-only)
  if (typeof window !== "undefined" && !mounted) {
    setMounted(true);
    setCurrent(getStoredTheme());
  }

  const cycle = useCallback(() => {
    const next: Theme = current === "dark" ? "light" : current === "light" ? "cyber" : "dark";
    applyTheme(next);
    setCurrent(next);
  }, [current]);

  // Don't render until mounted (avoids hydration mismatch)
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Switch theme"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted"
      >
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  }

  const nextTheme: Theme = current === "dark" ? "light" : current === "light" ? "cyber" : "dark";
  const ariaLabel =
    nextTheme === "light"
      ? "Switch to light mode"
      : nextTheme === "cyber"
        ? "Switch to cyber mode"
        : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full transition-all",
        "text-fg-muted hover:bg-ink-card/60 hover:text-gold",
        current === "cyber" && "text-reserve",
      )}
    >
      {current === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : current === "light" ? (
        <Terminal className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

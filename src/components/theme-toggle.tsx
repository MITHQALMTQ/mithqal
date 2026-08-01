"use client";

import { useState, useEffect, useCallback } from "react";
import { Moon, Sun, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ThemeToggle — dark / light / cyber mode switcher.
 *
 * Cycles: Dark → Light → Cyber → Dark.
 *
 * Implementation: directly manipulates the `class` attribute on <html>.
 * The toggle reads the current theme from localStorage on mount via
 * useEffect (NOT during render) to avoid hydration mismatches.
 *
 * The server always renders the "dark" placeholder (Moon icon). After
 * hydration, useEffect runs and updates the state to the stored theme.
 * This guarantees server and client render identical HTML on first paint.
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
  html.classList.remove("dark", "light", "cyber");
  html.classList.add(theme);
  try {
    localStorage.setItem("mithqal-theme", theme);
  } catch {}
}

export function ThemeToggle() {
  // Always start with "dark" on both server and client (defaultTheme="dark").
  // useEffect will sync to the stored preference AFTER hydration.
  const [current, setCurrent] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Read stored theme AFTER hydration (useEffect, not during render)
  useEffect(() => {
    const stored = getStoredTheme();
    setCurrent(stored);
    setMounted(true);
  }, []);

  const cycle = useCallback(() => {
    const next: Theme = current === "dark" ? "light" : current === "light" ? "cyber" : "dark";
    applyTheme(next);
    setCurrent(next);
  }, [current]);

  // Before mount: render the dark-mode placeholder (Moon icon).
  // This matches what the server renders, preventing hydration mismatch.
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Switch to light mode"
        title="Switch to light mode"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted hover:bg-ink-card/60 hover:text-gold transition-all"
      >
        <Sun className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  // After mount: render the actual theme toggle
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

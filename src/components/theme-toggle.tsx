"use client";

import { useState, useCallback } from "react";
import { Moon, Sun, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ThemeToggle — dark / light / cyber mode switcher.
 *
 * Cycles: Dark → Light → Cyber → Dark.
 *
 * Uses useSyncExternalStore to read the theme from <html>'s class list
 * (kept in sync by the inline script in layout.tsx + applyTheme()).
 * This avoids useEffect + setState (which triggers the
 * react-hooks/set-state-in-effect lint rule) and prevents hydration
 * mismatches because the server snapshot always returns "dark".
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
  // Dispatch event so useSyncExternalStore picks up the change
  window.dispatchEvent(new Event("mithqal-theme-change"));
}

function subscribeTheme(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("mithqal-theme-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("mithqal-theme-change", cb);
    window.removeEventListener("storage", cb);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") return "dark";
  const list = document.documentElement.classList;
  if (list.contains("light")) return "light";
  if (list.contains("cyber")) return "cyber";
  return "dark";
}

function getThemeServerSnapshot(): Theme {
  return "dark";
}

// useSyncExternalStore import
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const current = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  const cycle = useCallback(() => {
    const next: Theme = current === "dark" ? "light" : current === "light" ? "cyber" : "dark";
    applyTheme(next);
  }, [current]);

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

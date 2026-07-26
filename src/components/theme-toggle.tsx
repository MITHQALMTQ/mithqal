"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * ThemeToggle — dark/light mode switcher (audit recommendation #9).
 *
 * Uses next-themes (already installed) to persist the preference and apply
 * the `dark` / `light` class to <html>. The page renders `suppressHydrationWarning`
 * on <html> in layout.tsx so the SSR/CSR mismatch on the theme class is silent.
 *
 * To determine the current theme without the `mounted` setState-in-effect
 * pattern, we subscribe to <html>'s `class` attribute via MutationObserver.
 * That gives us a live, hydration-safe reading of which theme is currently
 * applied (default: dark, since `defaultTheme="dark"`).
 *
 * Button shows a Moon icon in light mode (action: switch to dark) and a Sun
 * icon in dark mode (action: switch to light).
 */
function subscribeTheme(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getThemeSnapshot(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function getThemeServerSnapshot(): "dark" {
  return "dark";
}

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const current = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const isDark = current !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-fg-muted transition hover:bg-ink-card/60 hover:text-foreground"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  );
}

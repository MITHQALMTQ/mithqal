"use client";

import * as React from "react";
import { Menu, Moon, Search, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Topbar — sticky app-shell header for the MITHQAL Assurance dashboard.
 *
 * Composition (left → right):
 *   • Brand mark (gold "M" sigil) + wordmark "MITHQAL · Assurance"
 *   • DEMO ↔ LIVE mode pill (amber ↔ emerald, localStorage persisted)
 *   • Center-right search trigger (styled like a search input; opens ⌘K)
 *   • Theme toggle (Sun / Moon; localStorage persisted)
 *   • MobileNav trigger (Sheet-based menu — visible only on < md screens)
 *
 * Built by BUILD-1 (brand + mode pill + mobile trigger) and extended by
 * PHASE1B (search trigger, DEMO↔LIVE toggle, theme toggle, ⌘K palette).
 * ────────────────────────────────────────────────────────────── */

type Mode = "DEMO" | "LIVE";
type Theme = "dark" | "light";

const MODE_KEY = "mithqal-mode";
const THEME_KEY = "mithqal-theme";

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

export function Topbar() {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("DEMO");
  const [theme, setTheme] = React.useState<Theme>("dark");
  const [mounted, setMounted] = React.useState(false);

  // ── Hydrate persisted prefs once on mount (avoids SSR mismatch) ──
  React.useEffect(() => {
    // Defer to next microtask to avoid synchronous effect→state loop
    // (React 19 react-hooks/set-state-in-effect rule).
    queueMicrotask(() => {
      setMounted(true);
      const savedMode = readLocal(MODE_KEY);
      if (savedMode === "LIVE" || savedMode === "DEMO") {
        setMode(savedMode);
      }
      const savedTheme = readLocal(THEME_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      }
    });
  }, []);

  // ── Global ⌘K / Ctrl+K listener — opens the command palette ──
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Listen for palette-driven toggle requests (Action group) ──
  React.useEffect(() => {
    const onReqMode = () => {
      setMode((prev) => {
        const next = prev === "DEMO" ? "LIVE" : "DEMO";
        writeLocal(MODE_KEY, next);
        window.dispatchEvent(
          new CustomEvent("mithqal:mode-change", { detail: next }),
        );
        return next;
      });
    };
    const onReqTheme = () => {
      setTheme((prev) => {
        const next = prev === "dark" ? "light" : "dark";
        writeLocal(THEME_KEY, next);
        applyTheme(next);
        window.dispatchEvent(
          new CustomEvent("mithqal:theme-change", { detail: next }),
        );
        return next;
      });
    };
    window.addEventListener("mithqal:request-toggle-mode", onReqMode);
    window.addEventListener("mithqal:request-toggle-theme", onReqTheme);
    return () => {
      window.removeEventListener("mithqal:request-toggle-mode", onReqMode);
      window.removeEventListener("mithqal:request-toggle-theme", onReqTheme);
    };
  }, []);

  // ── Persist + propagate mode toggle ──
  const toggleMode = React.useCallback(() => {
    setMode((prev) => {
      const next = prev === "DEMO" ? "LIVE" : "DEMO";
      writeLocal(MODE_KEY, next);
      // Broadcast so other components (status-bar, command-palette) can react.
      window.dispatchEvent(
        new CustomEvent("mithqal:mode-change", { detail: next }),
      );
      return next;
    });
  }, []);

  // ── Persist + propagate theme toggle ──
  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      writeLocal(THEME_KEY, next);
      applyTheme(next);
      window.dispatchEvent(
        new CustomEvent("mithqal:theme-change", { detail: next }),
      );
      return next;
    });
  }, []);

  const isLive = mode === "LIVE";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full",
          "border-b border-line/60 bg-ink/80 backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-ink/60",
        )}
      >
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          {/* ── Brand mark + wordmark ── */}
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden="true"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                "border border-gold/40 bg-gradient-to-br from-gold-soft/20 to-gold-deep/30",
                "font-semibold text-gold shadow-inner shadow-gold/10",
              )}
            >
              <span className="font-mono text-sm tracking-tight">M</span>
            </div>
            <div className="hidden flex-col leading-none sm:flex">
              <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                MITHQAL
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-fg-muted">
                Assurance
              </span>
            </div>
          </div>

          {/* ── DEMO ↔ LIVE mode pill ── */}
          <button
            type="button"
            onClick={toggleMode}
            aria-pressed={isLive}
            aria-label={`Mode: ${mode}. Click to switch to ${isLive ? "DEMO" : "LIVE"}.`}
            title={`Mode: ${mode} — click to toggle`}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
              isLive
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
            )}
          >
            <Zap className="h-3 w-3" aria-hidden="true" />
            <span>{mode}</span>
            <span
              className={cn(
                "ml-1 hidden h-1.5 w-1.5 rounded-full transition-colors sm:inline-block",
                isLive
                  ? "animate-pulse bg-emerald-400"
                  : "bg-amber-500",
              )}
              aria-hidden="true"
            />
          </button>

          {/* ── Center-right: search trigger (hidden on mobile) ── */}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette (⌘K)"
              title="Search… (⌘K)"
              className={cn(
                "group hidden h-9 min-w-[260px] items-center gap-2 rounded-md border border-line/60 bg-ink-card/60 px-3 text-sm text-fg-muted md:inline-flex",
                "transition-colors hover:border-gold/40 hover:bg-ink-card/80 hover:text-foreground",
              )}
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="flex-1 text-left">Search…</span>
              <kbd
                className={cn(
                  "rounded border border-line/60 bg-ink/80 px-1.5 py-0.5",
                  "font-mono text-[10px] text-fg-muted",
                )}
              >
                ⌘K
              </kbd>
            </button>

            {/* ── Theme toggle ── */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Theme: ${theme}`}
              className="h-9 w-9 text-fg-muted hover:text-foreground"
            >
              {mounted && theme === "dark" ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            {/* MobileNav trigger — Sheet-based mobile drawer (defined in sidebar.tsx) */}
            <div className="md:hidden">
              <MobileNav>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="h-9 w-9 text-fg-muted hover:text-foreground"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </Button>
              </MobileNav>
            </div>
          </div>
        </div>
      </header>

      {/* ── Command palette — controlled by Topbar; also reachable via ⌘K ── */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}

export default Topbar;

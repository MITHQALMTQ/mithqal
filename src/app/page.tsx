"use client";

import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Landmark } from "lucide-react";
import Playbook from "@/components/playbook";
import PublicSite from "@/components/public-site";

type View = "playbook" | "institution";

const STORAGE_KEY = "mithqal.view";
const CHANGE_EVENT = "mithqal:view-change";
const DEFAULT_VIEW: View = "institution";

/* ---- External store (localStorage-backed) via useSyncExternalStore ---- */

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

function getSnapshot(): View {
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "playbook" || v === "institution" ? v : DEFAULT_VIEW;
}

function getServerSnapshot(): View {
  return DEFAULT_VIEW;
}

function writeView(v: View) {
  try {
    window.localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* ignore quota / privacy mode */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export default function Page() {
  // Hydration-safe: server renders DEFAULT_VIEW, client reads localStorage
  // after mount. No setState-in-effect — the external store is the source of
  // truth and React subscribes to it.
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setView = (v: View) => {
    writeView(v);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="print-page flex min-h-screen flex-col bg-ink text-foreground">
      <ViewSwitcher view={view} setView={setView} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {view === "playbook" ? <Playbook /> : <PublicSite />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---- The toggle ---- */

function ViewSwitcher({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  return (
    <div className="no-print sticky top-0 z-[60] flex justify-center border-b border-line/60 bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <span className="hidden text-[11px] font-medium uppercase tracking-[0.22em] text-fg-muted sm:inline">
          Mithqal · working surface
        </span>
        <div className="mx-auto inline-flex items-center rounded-full border border-line bg-ink-card p-1">
          <button
            onClick={() => setView("institution")}
            className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-[13px] ${
              view === "institution"
                ? "bg-gold text-ink"
                : "text-fg-muted hover:text-foreground"
            }`}
            aria-pressed={view === "institution"}
          >
            <Landmark className="h-3.5 w-3.5" />
            Institution
          </button>
          <button
            onClick={() => setView("playbook")}
            className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-[13px] ${
              view === "playbook"
                ? "bg-gold text-ink"
                : "text-fg-muted hover:text-foreground"
            }`}
            aria-pressed={view === "playbook"}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Playbook
          </button>
        </div>
        <span className="hidden text-[11px] text-fg-muted sm:inline">
          {view === "institution" ? "Public-facing" : "Internal · for the COO/PM"}
        </span>
      </div>
    </div>
  );
}

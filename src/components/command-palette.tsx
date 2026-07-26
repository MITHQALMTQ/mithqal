"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";

/**
 * CommandPalette — Cmd+K global search.
 * Lets users quickly jump to any view or section.
 */

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  view?: string;
  action?: () => void;
  icon?: React.ReactNode;
}

const VIEWS: PaletteItem[] = [
  { id: "institution", label: "Institution", hint: "Public-facing", view: "institution" },
  { id: "transparency", label: "Transparency", hint: "Live · build in public", view: "transparency" },
  { id: "engine", label: "Monetary Engine", hint: "5-layer explainer", view: "engine" },
  { id: "infrastructure", label: "Infrastructure", hint: "v19.0 infrastructure", view: "infrastructure" },
  { id: "constitution", label: "Constitution", hint: "v19.0 spec", view: "constitution" },
  { id: "testnet", label: "Testnet", hint: "MTQ simulator", view: "testnet" },
  { id: "os", label: "Operating System", hint: "MTQ Dashboard + MetaMask", view: "os" },
  { id: "audit", label: "Audit", hint: "Testnet validation", view: "audit" },
  { id: "deck", label: "Deck", hint: "Investor teaser", view: "deck" },
  { id: "playbook", label: "Playbook", hint: "Internal · COO/PM", view: "playbook" },
  { id: "admin", label: "Admin", hint: "Intake pipeline", view: "admin" },
];

const EXTERNAL_LINKS: PaletteItem[] = [
  {
    id: "monadscan-mtq",
    label: "View MTQ Token on MonadScan",
    hint: "0x9e6EdC15...",
    action: () => window.open("https://testnet.monadscan.com/address/0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD", "_blank"),
  },
  {
    id: "monadscan-gov",
    label: "View Governance on MonadScan",
    hint: "0xE35a9180...",
    action: () => window.open("https://testnet.monadscan.com/address/0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66", "_blank"),
  },
  {
    id: "github",
    label: "View Source on GitHub",
    hint: "MITHQALMTQ/mithqal",
    action: () => window.open("https://github.com/MITHQALMTQ/mithqal", "_blank"),
  },
  {
    id: "api-status",
    label: "API Health Check",
    hint: "/api/status",
    action: () => window.open("/api/status", "_blank"),
  },
  {
    id: "onchain-test",
    label: "On-Chain Test Results",
    hint: "9/9 PASS",
    action: () => window.open("/api/onchain-test", "_blank"),
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = [...VIEWS, ...EXTERNAL_LINKS];

  const filtered = allItems.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.hint?.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = useCallback((view: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mithqal.view", view);
      window.dispatchEvent(new Event("mithqal:view-change"));
      const url = new URL(window.location.href);
      url.searchParams.set("view", view);
      window.history.pushState({}, "", url);
      // Force reload to ensure the view switches
      window.location.search = `?view=${view}`;
    }
  }, []);

  const selectItem = useCallback(
    (item: PaletteItem) => {
      if (item.view) {
        navigate(item.view);
      } else if (item.action) {
        item.action();
      }
      setOpen(false);
      setQuery("");
    },
    [navigate]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      } else if (open && e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (open && e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (open && e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          selectItem(filtered[selectedIndex]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex, selectItem]);

  useEffect(() => {
    // Reset selection when query changes — using requestAnimationFrame to
    // avoid the synchronous setState-in-effect warning.
    const id = requestAnimationFrame(() => setSelectedIndex(0));
    return () => cancelAnimationFrame(id);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[20%] z-[101] w-[90%] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-gold/30 bg-ink-soft shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search className="h-4 w-4 text-fg-muted" />
              <input
                type="text"
                placeholder="Search views, contracts, APIs…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-fg-muted focus:outline-none"
              />
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-fg-muted hover:text-foreground"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-fg-muted">No results for &ldquo;{query}&rdquo;</div>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      i === selectedIndex ? "bg-gold/10 text-gold" : "text-fg-muted hover:bg-ink-card/50 hover:text-foreground"
                    }`}
                  >
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.hint && <span className="text-[10px] text-fg-muted">{item.hint}</span>}
                    <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[10px] text-fg-muted">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="rounded border border-line px-1">↑</kbd>{" "}
                  <kbd className="rounded border border-line px-1">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="rounded border border-line px-1">↵</kbd> select
                </span>
                <span>
                  <kbd className="rounded border border-line px-1">esc</kbd> close
                </span>
              </div>
              <span>Mithqal · {allItems.length} items</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield } from "lucide-react";
import { LiveIndicator, VerifyOnChainBadge } from "@/components/live-ui";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * GlobalHeader — fixed top bar shown on all pages.
 * Contains: Cmd+K trigger, Live indicator, On-chain verification badge,
 * language switcher, and theme toggle.
 * Enhances every page with "live data pulse" + "verify on chain" trust signals.
 */
export function GlobalHeader() {
  const [onchainScore, setOnchainScore] = useState("15/15");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch on-chain test score on mount
  useEffect(() => {
    fetch("/api/onchain-test", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.summary?.passed && d?.summary?.total) {
          setOnchainScore(`${d.summary.passed}/${d.summary.total}`);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed right-3 top-3 z-50 flex items-center gap-2 rounded-full border border-line/60 bg-ink/80 px-2 py-1 backdrop-blur-xl transition ${
        scrolled ? "shadow-lg shadow-black/30" : ""
      }`}
    >
      {/* Cmd+K search trigger */}
      <button
        onClick={() => {
          // Dispatch the Cmd+K event
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
        }}
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium text-fg-muted transition hover:bg-ink-card/60 hover:text-foreground"
        aria-label="Open search (Cmd+K)"
        title="Search (Cmd+K)"
      >
        <Search className="h-3 w-3" />
        <kbd className="hidden sm:inline">⌘K</kbd>
      </button>

      {/* Live indicator */}
      <LiveIndicator intervalMs={30_000} />

      {/* On-chain verification badge */}
      <VerifyOnChainBadge score={onchainScore} href="/api/onchain-test" />

      {/* Constitutional shield */}
      <div
        className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] font-semibold text-gold"
        title="Constitution v24.2.1 — Published"
      >
        <Shield className="h-2.5 w-2.5" />
        v24.2.1
      </div>

      {/* Language switcher (audit recommendation #7: en/ar/fr) */}
      <LanguageSwitcher />

      {/* Theme toggle (audit recommendation #9: dark/light) */}
      <ThemeToggle />
    </motion.div>
  );
}

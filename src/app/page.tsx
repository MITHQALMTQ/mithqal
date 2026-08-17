"use client";

import { useSyncExternalStore, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark, Eye, Network, ShieldCheck, Presentation, BookOpen, LayoutDashboard,
} from "lucide-react";
import Playbook from "@/components/playbook";
import PublicSite from "@/components/public-site";
import TransparencyDashboard from "@/components/transparency";
import InfrastructureView from "@/components/infrastructure";
import TestnetAudit from "@/components/testnet-audit";
import InvestorDeck from "@/components/deck";
import FAQ from "@/components/faq";
import { OperatingSystem } from "@/components/operating-system";
import { MonetaryEngineExplained } from "@/components/monetary-engine-explained";
import AdminConsole from "@/components/admin";
import TestnetDashboard from "@/components/testnet";
import ConstitutionDocs from "@/components/constitution";
import { LiveStatus } from "@/components/live-status";
import { CommandPalette } from "@/components/command-palette";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

/* ============================================================
 * v25.0 — Unified Navigation System
 * ------------------------------------------------------------
 * Replaces the old 12-button + 7-sub-tab dual navigation
 * with a SINGLE clean navigation bar.
 *
 * 7 primary views (down from 12):
 *   1. Home       — Institution overview + all v25.0 dashboards
 *   2. Transparency — Live data + proofs
 *   3. Engine     — Monetary engine explainer
 *   4. Infrastructure — v25.0 technical architecture
 *   5. Testnet    — MTQ simulator + audit
 *   6. Resources  — Constitution + Deck + FAQ + Playbook
 *   7. Admin      — Admin console (auth gated)
 * ============================================================ */

type View = "home" | "transparency" | "engine" | "infrastructure" | "testnet" | "resources" | "admin";

const STORAGE_KEY = "mithqal.view";
const CHANGE_EVENT = "mithqal:view-change";
const DEFAULT_VIEW: View = "home";

type ViewDef = { id: View; label: string; icon: typeof Landmark; short: string };

const VIEWS: ViewDef[] = [
  { id: "home", label: "Home", icon: Landmark, short: "Home" },
  { id: "transparency", label: "Transparency", icon: Eye, short: "Data" },
  { id: "engine", label: "Monetary Engine", icon: Network, short: "Engine" },
  { id: "infrastructure", label: "Architecture", icon: ShieldCheck, short: "Arch" },
  { id: "testnet", label: "Testnet", icon: Presentation, short: "Test" },
  { id: "resources", label: "Resources", icon: BookOpen, short: "Docs" },
  { id: "admin", label: "Admin", icon: LayoutDashboard, short: "Admin" },
];

const VALID_VIEWS: View[] = ["home", "transparency", "engine", "infrastructure", "testnet", "resources", "admin"];

/* ---- localStorage-backed view state ---- */

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
  return (VALID_VIEWS as string[]).includes(v ?? "") ? (v as View) : DEFAULT_VIEW;
}

function getServerSnapshot(): View {
  return DEFAULT_VIEW;
}

function writeView(v: View) {
  try {
    window.localStorage.setItem(STORAGE_KEY, v);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/* ---- Resources sub-navigation state ---- */
type ResourcePage = "constitution" | "deck" | "faq" | "playbook";

/* ---- Main Page Component ---- */

export default function Page() {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Support deep-linking via ?view=<id>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("view");
    if (q && (VALID_VIEWS as string[]).includes(q)) {
      writeView(q as View);
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const setView = (v: View) => {
    writeView(v);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="print-page flex min-h-screen flex-col overflow-x-hidden bg-ink text-foreground">
      <UnifiedNav view={view} setView={setView} />
      <CommandPalette />
      <main id="main-content" className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {view === "home" && <PublicSite />}
            {view === "transparency" && <TransparencyDashboard />}
            {view === "engine" && <MonetaryEngineExplained />}
            {view === "infrastructure" && <InfrastructureView />}
            {view === "testnet" && <TestnetDashboard />}
            {view === "admin" && <AdminConsole />}
            {view === "resources" && <ResourcesHub />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---- Resources Hub (combines Constitution + Deck + FAQ + Playbook) ---- */

function ResourcesHub() {
  const [page, setPage] = useSyncExternalStore(
    () => () => {},
    () => (typeof window !== "undefined" ? (window.localStorage.getItem("mithqal.resource") as ResourcePage) || "constitution" : "constitution"),
    () => "constitution" as ResourcePage
  );

  const setResourcePage = (p: ResourcePage) => {
    try { window.localStorage.setItem("mithqal.resource", p); } catch { /* ignore */ }
    window.dispatchEvent(new Event("mithqal:view-change"));
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resourceTabs: { id: ResourcePage; label: string }[] = [
    { id: "constitution", label: "Constitution" },
    { id: "deck", label: "Investor Deck" },
    { id: "faq", label: "FAQ" },
    { id: "playbook", label: "Playbook" },
  ];

  return (
    <div className="flex flex-col">
      {/* Sub-navigation for Resources */}
      <nav className="sticky top-[60px] z-40 border-y border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8"
          style={{ scrollbarWidth: "thin" }}
        >
          {resourceTabs.map((tab) => {
            const active = page === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setResourcePage(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div key={page} className="animate-in fade-in duration-500">
        {page === "constitution" && <ConstitutionDocs />}
        {page === "deck" && <InvestorDeck />}
        {page === "faq" && <FAQ />}
        {page === "playbook" && <PlaybookGate />}
      </div>
    </div>
  );
}

/* ---- Playbook auth gate ---- */
function PlaybookGate() {
  const { data: session } = useSession();
  if (session) return <Playbook />;
  return (
    <div className="grain-bg flex min-h-[60vh] items-center justify-center px-5 py-20">
      <div className="max-w-md text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-gold" />
        <h2 className="font-display text-2xl text-foreground">Strategic Document</h2>
        <p className="mt-2 text-sm text-fg-muted">
          The Execution Playbook is a confidential strategic document available to authenticated operators.
        </p>
        <p className="mt-4 text-xs text-fg-muted">
          Switch to the Admin view to sign in, then return here.
        </p>
        <button
          onClick={() => {
            localStorage.setItem("mithqal.view", "admin");
            window.dispatchEvent(new Event("mithqal:view-change"));
          }}
          className="mt-6 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold/90"
        >
          Go to Admin Sign In
        </button>
      </div>
    </div>
  );
}

/* ---- Unified Navigation Bar ---- */

function UnifiedNav({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  return (
    <div className="no-print sticky top-0 z-[60] flex justify-center border-b border-line/40 glass">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-8 sm:py-2.5">
        {/* Left: Brand + Live Status */}
        <div className="hidden items-center gap-3 lg:flex">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-fg-muted">
            Mithqal
          </span>
          <LiveStatus />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LiveStatus />
        </div>

        {/* Center: Unified Navigation */}
        <div className="mx-auto inline-flex items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-ink/60 p-1 backdrop-blur-xl">
          {VIEWS.map((v) => {
            const active = view === v.id;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-[13px] ${
                  active ? "bg-gold text-ink glow-gold" : "text-fg-muted hover:text-foreground hover:bg-ink-card/60"
                }`}
                aria-pressed={active}
                aria-label={v.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
                <span className="sm:hidden">{v.short}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Language + Theme */}
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSyncExternalStore, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Landmark, FlaskConical, Presentation, ScrollText, LayoutDashboard, Eye, Network, ShieldCheck, Cpu, Compass } from "lucide-react";
import Playbook from "@/components/playbook";
import PublicSite from "@/components/public-site";
import TestnetDashboard from "@/components/testnet";
import InvestorDeck from "@/components/deck";
import ConstitutionDocs from "@/components/constitution";
import AdminConsole from "@/components/admin";
import TransparencyDashboard from "@/components/transparency";
import InfrastructureView from "@/components/infrastructure";
import TestnetAudit from "@/components/testnet-audit";
import { OperatingSystem } from "@/components/operating-system";
import { MonetaryEngineExplained } from "@/components/monetary-engine-explained";
import { LiveStatus } from "@/components/live-status";
import { CommandPalette } from "@/components/command-palette";
import { useLanguage } from "@/components/language-provider";

type View = "institution" | "transparency" | "infrastructure" | "playbook" | "testnet" | "audit" | "deck" | "constitution" | "admin" | "os" | "engine";

const STORAGE_KEY = "mithqal.view";
const CHANGE_EVENT = "mithqal:view-change";
const DEFAULT_VIEW: View = "institution";

// The view id maps to a translation key for the localized label.
// The icon + hint are static (not translated yet — see i18n follow-up).
type ViewDef = { id: View; label: string; icon: typeof BookOpen; hint: string; tKey?: string };

const VIEWS: ViewDef[] = [
  { id: "institution", label: "Institution", icon: Landmark, hint: "Public-facing", tKey: "nav.institution" },
  { id: "transparency", label: "Transparency", icon: Eye, hint: "Live · build in public", tKey: "nav.transparency" },
  { id: "engine", label: "Engine", icon: Compass, hint: "5-layer explainer", tKey: "nav.engine" },
  { id: "infrastructure", label: "Infrastructure", icon: Network, hint: "v19.0 infrastructure", tKey: "nav.infrastructure" },
  { id: "constitution", label: "Constitution", icon: ScrollText, hint: "v19.0 spec · citable", tKey: "nav.constitution" },
  { id: "testnet", label: "Testnet", icon: FlaskConical, hint: "MTQ simulator", tKey: "nav.testnet" },
  { id: "os", label: "OS", icon: Cpu, hint: "Operating System", tKey: "nav.os" },
  { id: "audit", label: "Audit", icon: ShieldCheck, hint: "Testnet validation v1.0", tKey: "nav.audit" },
  { id: "deck", label: "Deck", icon: Presentation, hint: "Investor teaser", tKey: "nav.deck" },
  { id: "playbook", label: "Playbook", icon: BookOpen, hint: "Internal · COO/PM", tKey: "nav.playbook" },
  { id: "admin", label: "Admin", icon: LayoutDashboard, hint: "Intake pipeline", tKey: "nav.admin" },
];

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

const VALID_VIEWS: View[] = ["institution", "transparency", "infrastructure", "constitution", "testnet", "os", "audit", "deck", "playbook", "admin", "engine"];

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
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export default function Page() {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Support deep-linking via ?view=<id> — used by the sitemap and shared
  // URLs. On first mount, if a valid view is present in the query string,
  // it takes precedence over the stored preference.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("view");
    if (q && (VALID_VIEWS as string[]).includes(q)) {
      writeView(q as View);
      // Clean the URL (replaceState avoids a history entry / scroll).
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
    <div className="print-page flex min-h-screen flex-col bg-ink text-foreground">
      <ViewSwitcher view={view} setView={setView} />
      <CommandPalette />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {view === "playbook" ? (
              <Playbook />
            ) : view === "testnet" ? (
              <TestnetDashboard />
            ) : view === "os" ? (
              <OperatingSystem />
            ) : view === "audit" ? (
              <TestnetAudit />
            ) : view === "deck" ? (
              <InvestorDeck />
            ) : view === "constitution" ? (
              <ConstitutionDocs />
            ) : view === "admin" ? (
              <AdminConsole />
            ) : view === "transparency" ? (
              <TransparencyDashboard />
            ) : view === "infrastructure" ? (
              <InfrastructureView />
            ) : view === "engine" ? (
              <MonetaryEngineExplained />
            ) : (
              <PublicSite />
            )}
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
  const { t } = useLanguage();
  return (
    <div className="no-print sticky top-0 z-[60] flex justify-center border-b border-line/40 glass">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-8 sm:py-2.5">
        <div className="hidden items-center gap-3 lg:flex">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-fg-muted">
            Mithqal · working surface
          </span>
          <LiveStatus />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LiveStatus />
        </div>
        <div className="mx-auto inline-flex items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-ink/60 p-1 backdrop-blur-xl">
          {VIEWS.map((v) => {
            const active = view === v.id;
            const Icon = v.icon;
            // Localized label — falls back to English if translation missing.
            const label = v.tKey ? t(v.tKey) : v.label;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-[13px] ${
                  active ? "bg-gold text-ink glow-gold" : "text-fg-muted hover:text-foreground hover:bg-ink-card/60"
                }`}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
        <span className="hidden w-[140px] text-right text-[11px] text-fg-muted lg:inline">
          {VIEWS.find((v) => v.id === view)?.hint}
        </span>
      </div>
    </div>
  );
}

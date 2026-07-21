"use client";

import { useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Landmark, FlaskConical, Presentation, ScrollText, LayoutDashboard, Eye } from "lucide-react";
import Playbook from "@/components/playbook";
import PublicSite from "@/components/public-site";
import TestnetDashboard from "@/components/testnet";
import InvestorDeck from "@/components/deck";
import ConstitutionDocs from "@/components/constitution";
import AdminConsole from "@/components/admin";
import TransparencyDashboard from "@/components/transparency";

type View = "institution" | "transparency" | "playbook" | "testnet" | "deck" | "constitution" | "admin";

const STORAGE_KEY = "mithqal.view";
const CHANGE_EVENT = "mithqal:view-change";
const DEFAULT_VIEW: View = "institution";

const VIEWS: { id: View; label: string; icon: typeof BookOpen; hint: string }[] = [
  { id: "institution", label: "Institution", icon: Landmark, hint: "Public-facing" },
  { id: "transparency", label: "Transparency", icon: Eye, hint: "Live · build in public" },
  { id: "constitution", label: "Constitution", icon: ScrollText, hint: "v18 spec · citable" },
  { id: "testnet", label: "Testnet", icon: FlaskConical, hint: "MTQ simulator" },
  { id: "deck", label: "Deck", icon: Presentation, hint: "Investor teaser" },
  { id: "playbook", label: "Playbook", icon: BookOpen, hint: "Internal · COO/PM" },
  { id: "admin", label: "Admin", icon: LayoutDashboard, hint: "Intake pipeline" },
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

const VALID_VIEWS: View[] = ["institution", "transparency", "constitution", "testnet", "deck", "playbook", "admin"];

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
            {view === "playbook" ? (
              <Playbook />
            ) : view === "testnet" ? (
              <TestnetDashboard />
            ) : view === "deck" ? (
              <InvestorDeck />
            ) : view === "constitution" ? (
              <ConstitutionDocs />
            ) : view === "admin" ? (
              <AdminConsole />
            ) : view === "transparency" ? (
              <TransparencyDashboard />
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
  return (
    <div className="no-print sticky top-0 z-[60] flex justify-center border-b border-line/60 bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-8 sm:py-2.5">
        <span className="hidden text-[11px] font-medium uppercase tracking-[0.22em] text-fg-muted lg:inline">
          Mithqal · working surface
        </span>
        <div className="mx-auto inline-flex items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-ink-card p-1">
          {VIEWS.map((v) => {
            const active = view === v.id;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-[13px] ${
                  active ? "bg-gold text-ink" : "text-fg-muted hover:text-foreground"
                }`}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
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

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Landmark,
  Layers,
  Banknote,
  Check,
  X,
  ArrowRight,
  Scale,
  Lock,
  Eye,
  Users,
  Calendar,
  CircleDollarSign,
  Building2,
  Boxes,
  Boxes as BoxesIcon,
  Gauge,
  FileCheck,
  Network,
  Crown,
  Loader2,
  Quote,
  ExternalLink,
  Activity,
  TrendingUp,
  Coins,
  Hexagon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  IDENTITY,
  OBJECTIVES,
  INVARIANTS_PUBLIC,
  ANTI_PLATFORM,
  MTQ_SPEC,
  FEES,
  RESERVE_TIERS,
  TRANSPARENCY,
  GOVERNANCE,
  GOVERNANCE_RULES,
  LIFECYCLE,
  ELIGIBILITY,
  INTEGRATION,
  STATUS_ITEMS,
  LEGAL_STATUS,
  LAYER_ZERO,
  PHASE_ZERO_TIMELINE,
  FORMATION_ROLES,
} from "@/lib/site-data";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { VerifyOnChain } from "@/components/verify-on-chain";
import { AnimatedNumber } from "@/components/animated-number";
import { LiveTimestamp } from "@/components/live-timestamp";
import { useLanguage } from "@/components/language-provider";
import { StressTestProof } from "@/components/stress-test-proof";
import { E2EScenarios } from "@/components/e2e-scenarios";
import { LiveReadinessDashboard } from "@/components/live-readiness-dashboard";
import { CommercialGovernanceDashboard } from "@/components/commercial-governance-dashboard";
import { CommercialTransparency } from "@/components/commercial-transparency";
import { InstitutionalEconomics } from "@/components/institutional-economics";
import { ReserveFlowSimulator } from "@/components/reserve-flow-simulator";
import { MBGDashboard } from "@/components/mbg-dashboard";
import { FinalIntegratedArchitectureDashboard } from "@/components/final-integrated-architecture-dashboard";
import { NonCustodialReserveDashboard } from "@/components/non-custodial-reserve-dashboard";
import { BankFundedIssuanceDashboard } from "@/components/bank-funded-issuance-dashboard";
import { FinalPilotGateDashboard } from "@/components/final-pilot-gate-dashboard";
import { SCDeploymentClosureDashboard } from "@/components/sc-deployment-closure-dashboard";
import { InstitutionalClosureDashboard } from "@/components/institutional-closure-dashboard";

const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 text-gold">
    <span className="h-px w-8 bg-gold/60" />
    <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
      {children}
    </span>
  </div>
);

/* UI-OVERHAUL-1: staggered-children variants for the "Mithqal is" / "Mithqal
 * is not" lists. The container hands each <li> a delay proportional to its
 * index so the items reveal as a cascade rather than all at once. */
const listContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};
const listItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};


/* ---------------- Hero ---------------- */

function SiteHero() {
  const { t } = useLanguage();
  return (
    <section id="s-top" className="relative overflow-hidden grain-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_14%,transparent),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-10 sm:px-8 sm:pb-14 sm:pt-12">
        <Reveal>
          <Badge className="border-gold/40 bg-gold/10 text-gold hover:bg-gold/10">
            {t("hero.eyebrow")}
          </Badge>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mt-5 flex items-center gap-5">
            <Logo className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
            <div>
              <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl">
                <span className="gold-text">{t("hero.title")}</span>
              </h1>
              <p className="mt-1 font-display text-lg text-fg-muted sm:text-xl">
                {IDENTITY.tagline}
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/90 sm:text-lg">
            {IDENTITY.lede}
          </p>
        </Reveal>
        {/* Live KPI bar — merged into the hero (Audit Fix 2 redesign) so the
            Institution's live monetary state is visible above the fold,
            immediately under the value proposition. */}
        <Reveal delay={0.14}>
          <div className="mt-5">
            <LiveStateDashboard />
          </div>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() =>
                document.getElementById("s-institution")?.scrollIntoView({ behavior: "smooth" })
              }
              className="group inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink shadow-[0_0_0_1px_color-mix(in_oklch,var(--gold)_40%,transparent),0_8px_30px_-10px_var(--gold)] transition hover:bg-gold-soft"
            >
              {t("action.whatIsMithqal")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() =>
                document.getElementById("s-contact")?.scrollIntoView({ behavior: "smooth" })
              }
              className="glow-gold inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
            >
              {t("action.expressInterest")}
            </button>
          </div>
        </Reveal>
        {/* Audit Fix 3 — Prominent testnet contract link in the hero.
            The MTQ token contract is published on Monad Testnet; surfacing it
            here — as a gold pill badge with the external-link icon — gives every
            reader an immediate, one-click path to independent on-chain verification. */}
        <Reveal delay={0.22}>
          <a
            href="https://testnet.monadscan.com/address/0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/[0.08] px-4 py-2 text-xs font-semibold text-gold shadow-[0_0_0_1px_color-mix(in_oklch,var(--gold)_30%,transparent),0_4px_20px_-8px_var(--gold)] transition hover:border-gold hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label="Verify the MTQ token contract on Monad Testnet explorer — address 0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD — opens in a new tab"
            title="MTQ Token · Monad Testnet explorer (opens in a new tab)"
          >
            <span aria-hidden="true">🔗</span>
            <span>MTQ on Monad Testnet:</span>
            <span className="font-mono text-[11px] text-gold/90">0x9e6E…253aD</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </Reveal>
      </div>
      <div className="gold-rule h-px w-full" />
    </section>
  );
}

/* ---------------- Live State Dashboard (Audit Fix 2) ---------------- */

/**
 * LiveStateDashboard — auto-refreshing (30s) KPI strip that surfaces the
 * Institution's live monetary state right under the hero: total supply,
 * market NAV, reserve ratio, and the live gold spot price.
 *
 * Task 5-a — Price Unification:
 *   The hero NAV previously read `json.monetary?.nav?.market` from
 *   /api/transparency, which is computed against the testnet simulator's
 *   supply (state.supply = 50M from the genesis deposit) — giving a NAV
 *   different from /api/mint (~$1.04 against the 54M baseline supply).
 *   Now the hero prefers the UNIFIED live NAV from /api/nav (the same
 *   source /api/mint, /api/redeem, /api/contract/info, the testnet
 *   banner and the stress-test-proof section all consume). The
 *   transparency response remains the fallback for the supply / goldUsd
 *   fields (which do not depend on which supply is used for NAV).
 *
 * Falls back to a graceful "live data unavailable" state on fetch
 * failure rather than blocking the page.
 */
interface LiveStateData {
  supply: number;
  navMarket: number;
  reserveRatio: number;
  goldUsd: number;
  lastUpdate: string;
}

// Used only when the fetch fails (or before the first response). Displayed in
// the same KPI layout so the section never collapses to a blank shell.
// NOTE: lastUpdate is a static string to prevent hydration mismatch —
// it's replaced with live data after mount via useEffect.
//
// impl-fix-pages — fallback values pinned to the canonical v19.0.2 baseline
// composition (reserve-policy-spec.ts BASELINE_COMPOSITION): EXPECTED_NAV_M
// = $1.0373, EXPECTED_RR = 102.05%, baseline gold price = $4,076.90/oz, and
// the baseline supply of 54,000,000 MTQ. These match the values returned by
// /api/nav at the canonical baseline, so the pre-fetch render is identical
// to the post-fetch render when the live oracle reports the baseline price.
const LIVE_FALLBACK: LiveStateData = {
  supply: 54_000_000,
  navMarket: 1.0373,
  reserveRatio: 102.05,
  goldUsd: 4076.9,
  lastUpdate: "",
};

function LiveStateDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<LiveStateData>(LIVE_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Task 5-a — fetch BOTH the unified NAV endpoint AND the
      // transparency endpoint in parallel. The unified /api/nav is the
      // single source of truth for "1 MTQ = $X"; transparency is still
      // used for the supply + goldUsd display fields (which do not
      // depend on which supply is used for NAV).
      const [navRes, res] = await Promise.all([
        fetch("/api/nav", { cache: "no-store" }),
        fetch("/api/transparency", { cache: "no-store" }),
      ]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = (await res.json()) as {
        testnet?: { supply?: number; nav?: number; reserveRatio?: number; lastUpdate?: string };
        monetary?: { goldUsd?: number; nav?: { market?: number }; reserveRatio?: { ratio?: number } };
        generatedAt?: string;
      };

      // Prefer the UNIFIED live NAV from /api/nav (single source of truth).
      // Fall back to transparency's monetary.nav.market, then to the
      // testnet simulator NAV (state.nav) — in that order — so the hero
      // always shows a number even if one endpoint fails.
      let liveNav: number | undefined;
      let liveRR: number | undefined;
      if (navRes.ok) {
        try {
          const navData = (await navRes.json()) as { navM?: number; reserveRatio?: number };
          if (typeof navData.navM === "number" && Number.isFinite(navData.navM) && navData.navM > 0) {
            liveNav = navData.navM;
          }
          if (typeof navData.reserveRatio === "number" && Number.isFinite(navData.reserveRatio) && navData.reserveRatio > 0) {
            liveRR = navData.reserveRatio;
          }
        } catch {
          /* fall through to transparency values */
        }
      }

      const next: LiveStateData = {
        supply: json.testnet?.supply ?? LIVE_FALLBACK.supply,
        navMarket:
          liveNav ??
          json.monetary?.nav?.market ??
          json.testnet?.nav ??
          LIVE_FALLBACK.navMarket,
        reserveRatio:
          liveRR ??
          json.monetary?.reserveRatio?.ratio ??
          json.testnet?.reserveRatio ??
          LIVE_FALLBACK.reserveRatio,
        goldUsd: json.monetary?.goldUsd ?? LIVE_FALLBACK.goldUsd,
        lastUpdate: json.testnet?.lastUpdate ?? json.generatedAt ?? "",
      };
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "transparency fetch failed");
      // keep previous data — do not overwrite live numbers with the fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, []);

  const cards: Array<{
    label: string;
    icon: typeof Activity;
    value: number;
    decimals: number;
    prefix?: string;
    suffix?: string;
    caption: string;
    accent: string;
  }> = [
    {
      label: t("hero.totalSupply"),
      icon: Coins,
      value: data.supply,
      decimals: 0,
      suffix: " MTQ",
      caption: t("hero.mintBurn"),
      accent: "text-gold",
    },
    {
      label: t("hero.navMarket"),
      icon: TrendingUp,
      value: data.navMarket,
      decimals: 4,
      prefix: "$",
      caption: t("hero.navCaption"),
      accent: "text-gold",
    },
    {
      label: t("hero.reserveRatio"),
      icon: Gauge,
      value: data.reserveRatio,
      decimals: 2,
      suffix: "%",
      caption: data.reserveRatio >= 100 ? t("hero.ratioAboveFloor") : t("hero.ratioBelowFloor"),
      accent: data.reserveRatio >= 100 ? "text-reserve" : "text-destructive",
    },
    {
      label: t("hero.goldPrice"),
      icon: CircleDollarSign,
      value: data.goldUsd,
      decimals: 2,
      prefix: "$",
      suffix: "/oz",
      caption: t("hero.goldCaption"),
      accent: "text-gold",
    },
  ];

  // Compact KPI bar — designed to live inside the hero (no section chrome).
  // Renders a single inline status row + a 4-card grid. The status indicator
  // collapses to "Connecting…" on first load, "Live" on success, and
  // "Live data unavailable" on persistent failure (with the previous values
  // retained so the section never collapses to a blank shell).
  return (
    <div aria-label="Live monetary state">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-muted">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                error ? "bg-destructive" : "bg-reserve"
              } ${loading ? "animate-ping" : ""}`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                error ? "bg-destructive" : "bg-reserve"
              }`}
            />
          </span>
          <span className="font-semibold uppercase tracking-[0.18em]">
            {error
              ? "Live data unavailable"
              : loading
                ? "Connecting…"
                : t("hero.liveAutoRefresh")}
          </span>
        </span>
        <LiveTimestamp isoString={data.lastUpdate} label={t("hero.updated")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="rounded-xl border border-line bg-ink-card p-4 transition hover:border-gold/40"
            >
              <div className="flex items-center justify-between text-fg-muted">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                  {c.label}
                </span>
                <Icon className={`h-4 w-4 ${c.accent}`} aria-hidden="true" />
              </div>
              <div className={`mt-2 font-display text-xl sm:text-2xl ${c.accent}`}>
                <AnimatedNumber
                  value={Number.isFinite(c.value) ? c.value : 0}
                  decimals={c.decimals}
                  prefix={c.prefix}
                  suffix={c.suffix}
                />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-fg-muted">
                <span className="truncate">{c.caption}</span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      error ? "bg-destructive/70" : "bg-reserve/80"
                    }`}
                    aria-hidden="true"
                  />
                  {error ? "stale" : t("hero.now")}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-fg-muted">
        <span>
          {t("hero.source")}:{" "}
          <code className="rounded bg-ink-card px-1.5 py-0.5 font-mono text-[10px] text-gold/90">
            /api/transparency
          </code>{" "}
          · {t("hero.onChainReserves")}.
        </span>
        <button
          onClick={() => {
            document
              .getElementById("s-reserves")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="inline-flex items-center gap-1 transition hover:text-gold"
        >
          {t("action.reservesBreakdown")}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- What Mithqal is / is not ---------------- */

function WhatItIs() {
  const { t } = useLanguage();
  return (
    <section id="s-institution" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("institution.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("institution.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            {t("institution.body")}
          </p>
        </Reveal>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {/* LEFT — Mithqal IS (green checkmarks). Lead with the affirmative
              column so the reader encounters what the Institution IS before
              what it is NOT. */}
          <Reveal>
            <div className="h-full rounded-2xl border border-reserve/40 bg-reserve/[0.06] p-6 sm:p-7">
              <div className="flex items-center gap-2 text-reserve">
                <Check className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  {t("institution.is.title")}
                </span>
              </div>
              <motion.ul
                className="mt-5 space-y-3"
                variants={listContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                {IDENTITY.is.map((n) => (
                  <motion.li
                    key={n}
                    variants={listItemVariants}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-reserve" />
                    <span>{n}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </Reveal>
          {/* RIGHT — Mithqal is NOT (red X marks). Mirrors the left column so
              the reader can scan both lists side by side. */}
          <Reveal delay={0.08}>
            <div className="h-full rounded-2xl border border-destructive/40 bg-destructive/[0.06] p-6 sm:p-7">
              <div className="flex items-center gap-2 text-destructive">
                <X className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  {t("institution.isnot.title")}
                </span>
              </div>
              <motion.ul
                className="mt-5 space-y-3"
                variants={listContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                {IDENTITY.not.map((n) => (
                  <motion.li
                    key={n}
                    variants={listItemVariants}
                    className="flex items-start gap-3 text-sm text-fg-muted"
                  >
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{n}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Six objectives ---------------- */

function Objectives() {
  const { t } = useLanguage();
  return (
    <section id="s-objectives" className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("objectives.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("objectives.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            They are not ranked. Each is essential. Any decision that advances one at the
            expense of another is critically examined; any that undermines one without
            proportionally strengthening another is rejected.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {OBJECTIVES.map((o, i) => (
            <Reveal key={o.n} delay={i * 0.05}>
              <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-6 transition-colors hover:border-gold/40">
                <div className="font-display text-3xl text-gold">{o.n}</div>
                <h3 className="font-display mt-3 text-lg text-foreground">{o.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{o.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Invariants ---------------- */

function Invariants() {
  const { t } = useLanguage();
  return (
    <section id="s-invariants" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("invariants.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("invariants.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            These are not subject to override by any vote, referendum, or emergency.
            They are the non-negotiable foundation of every other constitutional provision.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INVARIANTS_PUBLIC.map((inv, i) => (
            <Reveal key={inv.t} delay={i * 0.05}>
              <div className="print-card h-full rounded-xl border border-gold/30 bg-gold/[0.05] p-6">
                <Lock className="h-5 w-5 text-gold" />
                <h3 className="font-display mt-4 text-lg text-foreground">{inv.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{inv.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Anti-platform ---------------- */

function AntiPlatform() {
  const { t } = useLanguage();
  return (
    <section id="s-anti-platform" className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("antiplatform.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("antiplatform.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            {ANTI_PLATFORM.intro}
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="print-card h-full rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
              <div className="flex items-center gap-2 text-gold">
                <X className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Constitutionally prohibited
                </span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {ANTI_PLATFORM.prohibited.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm text-fg-muted">
                    <span className="h-1 w-1 rounded-full bg-gold/60" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="print-card h-full rounded-2xl border border-reserve/40 bg-reserve/[0.06] p-6 sm:p-7">
              <div className="flex items-center gap-2 text-reserve">
                <Check className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Permitted activities
                </span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {ANTI_PLATFORM.permitted.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reserve" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- The Settlement Unit (MTQ) ---------------- */

function SettlementUnit() {
  return (
    <section id="s-mtq" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>The Settlement Unit — MTQ</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            One unit. Fully reserved. Always redeemable.
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            MTQ is an ERC-20 token with micro-settlement precision. Supply is dynamic —
            minted only on verified deposit, burned only on redemption. Its value is its
            NAV: a weighted basket of eligible reserve assets with bounded momentum and
            mean reversion.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="print-card rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
              <h3 className="font-display text-lg text-foreground">Token specification</h3>
              <dl className="mt-4 divide-y divide-line">
                {MTQ_SPEC.map((s) => (
                  <div key={s.k} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="text-sm text-fg-muted">{s.k}</dt>
                    <dd className="text-right text-sm font-medium text-foreground">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="print-card rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
              <h3 className="font-display text-lg text-foreground">Fee schedule</h3>
              <p className="mt-2 text-xs text-fg-muted">
                Illustrative ranges. Actual rates are set by Policy. Fees fund operations, never reserves.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-ink-card text-left text-[11px] uppercase tracking-wider text-fg-muted">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Rate</th>
                      <th className="px-3 py-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {FEES.map((f) => (
                      <tr key={f.type}>
                        <td className="px-3 py-2 font-medium text-foreground">{f.type}</td>
                        <td className="px-3 py-2 text-gold">{f.rate}</td>
                        <td className="px-3 py-2 text-fg-muted">{f.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Reserves ---------------- */

function Reserves() {
  const { t } = useLanguage();
  return (
    <section id="s-reserves" className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("reserves.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("reserves.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            Reserves are held in custody across a four-tier reserve-asset structure (cash, sovereign securities, allocated physical bullion, operational liquidity) of central-bank-quality
            assets. Every claim is verifiable — daily cryptographic proofs, quarterly
            independent audits, and a five-year independent constitutional review.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {RESERVE_TIERS.map((t, i) => (
            <Reveal key={t.tier} delay={i * 0.05}>
              <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg text-gold">{t.tier}</span>
                  <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                    {t.weight}
                  </Badge>
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">
                  {t.name}
                </div>
                <p className="mt-3 text-sm text-foreground">{t.assets}</p>
                <p className="mt-2 text-xs text-fg-muted">{t.quality}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 overflow-hidden rounded-2xl border border-line">
            <div className="border-b border-line bg-ink-card px-6 py-3">
              <div className="flex items-center gap-2 text-gold">
                <Eye className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Transparency cadence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
              {TRANSPARENCY.map((t) => (
                <div key={t.item} className="p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                    {t.cadence}
                  </div>
                  <div className="mt-2 text-sm font-medium text-foreground">{t.item}</div>
                  <div className="mt-1 text-xs text-fg-muted">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Monetary Engine Compact (Audit Fix 1) ---------------- */

/**
 * MonetaryEngineCompact — a compact, inline visualization of the v25.0
 * Monetary Engine's currency basket. It is NOT the full interactive Engine
 * view — it shows the single core concept: Gold is the anchor → 8 sovereign
 * currencies contribute weighted pressure → MTQ is the synthesised output.
 *
 * Pulls live weights from /api/transparency and falls back to the published
 * worked-example weights if the API is unreachable, so the section never
 * collapses to a blank card.
 *
 * The "Explore the full interactive engine →" CTA deep-links to ?view=engine,
 * which page.tsx picks up and switches to the full Engine view.
 */
interface BasketCurrency {
  code: string;
  name: string;
  weight: number; // percentage value, e.g. 47.99
}

// Published v25.0 worked-example weights (Part III) — used until the first
// successful /api/transparency response lands, and as a permanent fallback.
const FALLBACK_BASKET: BasketCurrency[] = [
  { code: "USD", name: "US Dollar", weight: 47.99 },
  { code: "EUR", name: "Euro", weight: 19.03 },
  { code: "GBP", name: "Pound Sterling", weight: 10.9 },
  { code: "JPY", name: "Japanese Yen", weight: 10.32 },
  { code: "CNY", name: "Chinese Yuan", weight: 6.73 },
  { code: "CHF", name: "Swiss Franc", weight: 2.0 },
  { code: "AUD", name: "Australian Dollar", weight: 1.68 },
  { code: "CAD", name: "Canadian Dollar", weight: 1.36 },
];

// impl-fix-pages — Canonical baseline gold price (BASELINE_COMPOSITION /
// $4,076.90/oz per reserve-policy-spec.ts). Used only as a pre-fetch
// fallback before /api/transparency resolves; the live oracle price takes
// precedence as soon as the response lands.
const FALLBACK_GOLD_USD = 4076.9;

// Per-currency accent colour, used to tint each bar. Stays inside the gold
// palette so the section feels native to the institutional dark/gold theme.
const CURRENCY_ACCENT: Record<string, string> = {
  USD: "from-gold/90 to-gold/40",
  EUR: "from-gold/80 to-gold/30",
  GBP: "from-gold/75 to-gold/30",
  JPY: "from-gold/70 to-gold/25",
  CNY: "from-gold/65 to-gold/25",
  CHF: "from-gold/60 to-gold/20",
  AUD: "from-gold/55 to-gold/20",
  CAD: "from-gold/50 to-gold/15",
};

function MonetaryEngineCompact() {
  const { t } = useLanguage();
  const [goldUsd, setGoldUsd] = useState<number>(FALLBACK_GOLD_USD);
  const [basket, setBasket] = useState<BasketCurrency[]>(FALLBACK_BASKET);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/transparency", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: unknown) => {
        if (cancelled || !json) return;
        const j = json as {
          monetary?: {
            goldUsd?: number;
            weights?: Array<{
              code: string;
              name?: string;
              normalizedWeight?: number;
              structuralWeight?: number;
            }>;
          };
          generatedAt?: string;
          testnet?: { lastUpdate?: string };
        };
        if (typeof j.monetary?.goldUsd === "number" && Number.isFinite(j.monetary.goldUsd)) {
          setGoldUsd(j.monetary.goldUsd);
        }
        if (Array.isArray(j.monetary?.weights) && j.monetary.weights.length > 0) {
          const parsed: BasketCurrency[] = j.monetary.weights
            .map((w) => ({
              code: w.code,
              name: w.name ?? w.code,
              weight:
                (typeof w.normalizedWeight === "number"
                  ? w.normalizedWeight
                  : typeof w.structuralWeight === "number"
                    ? w.structuralWeight
                    : 0) * 100,
            }))
            .filter((w) => w.code)
            .sort((a, b) => b.weight - a.weight);
          if (parsed.length > 0) setBasket(parsed);
        }
        setLastUpdate(j.testnet?.lastUpdate ?? j.generatedAt ?? "");
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => {
        /* no loading state — fallback is shown immediately */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxWeight = Math.max(...basket.map((c) => c.weight), 1);
  const sumWeight = basket.reduce((s, c) => s + c.weight, 0);

  return (
    <section
      id="s-monetary-engine"
      className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12"
      aria-label="Monetary engine — currency basket visualization"
    >
      <div className="mx-auto w-full max-w-5xl">
        <Reveal>
          <Eyebrow>{t("engine.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("engine.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            MTQ&rsquo;s value is not discretionary. It is the deterministic output of a
            transparent algorithm: gold anchors the basket&rsquo;s real value, eight
            sovereign currencies contribute weighted pressure (COFER + SWIFT + BIS),
            and MTQ is minted as the synthesised settlement unit. No ML, no HFT —
            just constitutionally-bounded math.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/[0.06] to-transparent p-6 sm:p-8">
            {/* Gold anchor — top */}
            <div className="rounded-xl border border-gold/50 bg-gold/[0.08] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-gold/15">
                    <Crown className="h-5 w-5 text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-display text-lg text-foreground sm:text-xl">
                      GOLD — The Anchor
                    </div>
                    <div className="text-xs text-fg-muted">
                      Real value numéraire · reserves held as allocated bullion
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-gold sm:text-2xl">
                    <AnimatedNumber
                      value={goldUsd}
                      decimals={2}
                      prefix="$"
                      suffix="/oz"
                    />
                  </div>
                  <LiveTimestamp isoString={lastUpdate} label="spot" />
                </div>
              </div>
            </div>

            {/* Down arrow */}
            <div className="my-3 flex justify-center text-gold/60" aria-hidden="true">
              <ArrowRight className="h-5 w-5 rotate-90" />
            </div>

            {/* Currency basket — 8 horizontal bars */}
            <div className="rounded-xl border border-line bg-ink-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-muted">
                  8-currency basket · Σ = {sumWeight.toFixed(2)}%
                </div>
                <div className="text-[10px] text-fg-muted">
                  cap 60% · floor 0.5% · momentum-bounded
                </div>
              </div>
              <ul className="space-y-3">
                {basket.map((c, i) => {
                  const widthPct = (c.weight / maxWeight) * 100;
                  const accent =
                    CURRENCY_ACCENT[c.code] ?? "from-gold/60 to-gold/20";
                  return (
                    <li key={c.code} className="grid grid-cols-[3.5rem_1fr_4rem] items-center gap-3 sm:grid-cols-[4.5rem_1fr_5rem]">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-sm font-semibold text-gold">
                          {c.code}
                        </span>
                      </div>
                      <div
                        className="relative h-3 overflow-hidden rounded-full border border-line/60 bg-ink"
                        role="img"
                        aria-label={`${c.name}: ${c.weight.toFixed(2)}% of basket`}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${widthPct}%` }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            duration: 0.9,
                            delay: 0.1 + i * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={`h-full rounded-full bg-gradient-to-r ${accent}`}
                        />
                      </div>
                      <div className="text-right font-mono text-xs text-fg-muted">
                        {c.weight.toFixed(2)}%
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Down arrow */}
            <div className="my-3 flex justify-center text-gold/60" aria-hidden="true">
              <ArrowRight className="h-5 w-5 rotate-90" />
            </div>

            {/* MTQ output — bottom */}
            <div className="rounded-xl border border-gold/50 bg-gold/[0.08] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-gold/15">
                    <Coins className="h-5 w-5 text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-display text-lg text-foreground sm:text-xl">
                      MTQ — The Synthesis
                    </div>
                    <div className="text-xs text-fg-muted">
                      1 MTQ = basket value · minted on verified deposit
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-gold sm:text-2xl">ERC-20</div>
                  <div className="text-[10px] text-fg-muted">on Monad</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">
              The full engine visualizes 5 layers — oracle aggregation, currency
              weighting with cap/floor, shock absorber (EWMA), NAV derivation, and
              reserve-ratio compliance — with shock-phase simulation.
            </p>
            <a
              href="/?view=engine"
              className="group inline-flex items-center gap-2 rounded-md border border-gold/50 bg-gold/[0.06] px-5 py-3 text-sm font-semibold text-gold transition hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              aria-label="Open the full interactive Monetary Engine view"
              title="Switch to the full interactive Monetary Engine view"
            >
              {t("engine.explore")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Governance ---------------- */

function Governance() {
  const { t } = useLanguage();
  return (
    <section id="s-governance" className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("governance.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("governance.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            The Council is the principal governing body, supported by specialised
            committees. Every five years, an independent panel of nine experts audits the
            entire institution. The founder's influence is constitutionally capped.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {GOVERNANCE.map((g, i) => (
            <Reveal key={g.t} delay={i * 0.04}>
              <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-6">
                <div className="flex items-center gap-2 text-gold">
                  {i === GOVERNANCE.length - 1 ? (
                    <Crown className="h-4 w-4" />
                  ) : (
                    <Scale className="h-4 w-4" />
                  )}
                </div>
                <h3 className="font-display mt-3 text-lg text-foreground">{g.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{g.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {GOVERNANCE_RULES.map((r) => (
              <div
                key={r.k}
                className="rounded-lg border border-line bg-ink-card p-4"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  {r.k}
                </div>
                <div className="mt-1 text-sm font-medium text-gold">{r.v}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Lifecycle / roadmap ---------------- */

function Lifecycle() {
  const { t } = useLanguage();
  const toneClass = (s: string) =>
    s === "current"
      ? "border-gold/50 bg-gold/[0.08] text-gold"
      : s === "next"
        ? "border-line bg-ink-soft text-fg-muted"
        : "border-line/60 bg-ink-soft/50 text-fg-muted";
  return (
    <section id="s-lifecycle" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("lifecycle.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("lifecycle.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            By defining every stage in advance — formation through wind-down and succession —
            the Constitution ensures the Institution's path is never determined by courts or
            crisis.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LIFECYCLE.map((l, i) => (
            <Reveal key={l.stage} delay={i * 0.04}>
              <div className={`print-card h-full rounded-xl border p-6 ${toneClass(l.status)}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-foreground">{l.stage}</h3>
                  {l.status === "current" ? (
                    <Badge className="border-gold/40 bg-gold/15 text-[10px] text-gold hover:bg-gold/15">
                      Current
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-fg-muted">
                  {l.gov}
                </div>
                <p className="mt-3 text-sm text-foreground/90">{l.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Eligibility & integration ---------------- */

function Eligibility() {
  const { t } = useLanguage();
  return (
    <section id="s-eligibility" className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("eligibility.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("eligibility.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            Mithqal serves institutions — not retail speculators. Eligibility is objective
            and applied uniformly. Equal fees, equal rights, equal rules for every eligible
            participant.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ELIGIBILITY.map((e, i) => (
            <Reveal key={e.who} delay={i * 0.04}>
              <div className="print-card h-full rounded-xl border border-line bg-ink-soft p-6">
                <Building2 className="h-5 w-5 text-gold" />
                <h3 className="font-display mt-4 text-base text-foreground">{e.who}</h3>
                <p className="mt-2 text-sm text-fg-muted">{e.why}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 rounded-2xl border border-line bg-ink-soft p-6 sm:p-8">
            <h3 className="font-display text-xl text-foreground sm:text-2xl">
              How institutions integrate
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {INTEGRATION.map((s, i) => (
                <div key={s.step} className="relative">
                  <div className="font-display text-2xl text-gold">{s.step}</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{s.t}</div>
                  <p className="mt-1 text-xs text-fg-muted">{s.d}</p>
                  {i < INTEGRATION.length - 1 ? (
                    <ArrowRight className="absolute -right-2 top-3 hidden h-4 w-4 text-line xl:block" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Build-in-public status ---------------- */

function StatusBoard() {
  const { t } = useLanguage();
  const tone = (toneKey: string) =>
    toneKey === "done"
      ? "border-reserve/40 bg-reserve/[0.08] text-reserve"
      : toneKey === "next"
        ? "border-gold/40 bg-gold/[0.08] text-gold"
        : "border-line bg-ink-soft text-fg-muted";
  return (
    <section id="s-status" className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("status.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("status.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            Trust is earned through verifiable operations, not declared. This status board
            tracks where the Institution stands against its own constitutional lifecycle.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATUS_ITEMS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.04}>
              <div className={`print-card rounded-xl border p-5 ${tone(s.tone)}`}>
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  {s.label}
                </div>
                <div className="mt-2 font-display text-lg text-foreground">{s.value}</div>
                <div className="mt-1 text-xs">{s.state}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Layer 0 — Institutional Philosophy ---------------- */

function LayerZero() {
  const { t } = useLanguage();
  return (
    <section id="s-layer-zero" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("layer0.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("layer0.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            {LAYER_ZERO.intro}
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LAYER_ZERO.pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <div className="glass card-hover h-full rounded-xl border-gold/20 p-6">
                <div className="flex items-center gap-2 text-gold">
                  <Shield className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                    Doctrine
                  </span>
                </div>
                <h3 className="font-display mt-3 text-lg text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Legal & Regulatory Status ---------------- */

function LegalStatus() {
  const { t } = useLanguage();
  return (
    <section id="s-legal" className="scroll-mt-24 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("legal.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("legal.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            {t("legal.description")}
          </p>
        </Reveal>

        {/* Entity A — The Institution (non-profit settlement) */}
        <div className="mt-10 rounded-2xl border border-gold/30 bg-gold/[0.03] p-6">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
            <div>
              <h3 className="font-display text-xl text-foreground">
                {t("legal.entityA.name")}
              </h3>
              <p className="mt-1 text-sm text-gold font-medium">
                {t("legal.entityA.type")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {LEGAL_STATUS.entityA.role}
              </p>
              <p className="mt-3 text-xs text-fg-muted">
                <span className="font-semibold text-foreground">{t("legal.entityA.currentOperator")}:</span>{" "}
                {LEGAL_STATUS.entityA.currentOperator}
                <br />
                <span className="font-semibold text-foreground">{t("legal.entityA.targetStructure")}:</span>{" "}
                {LEGAL_STATUS.entityA.targetStructure}
              </p>
            </div>
          </div>
        </div>

        {/* Entity B — The Yield Vehicle (for-profit investment) */}
        <div className="mt-4 rounded-2xl border border-line bg-ink-card/40 p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-6 w-6 shrink-0 text-fg-muted" />
            <div>
              <h3 className="font-display text-xl text-foreground">
                {t("legal.entityB.name")}
              </h3>
              <p className="mt-1 text-sm text-fg-muted font-medium">
                {t("legal.entityB.type")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {LEGAL_STATUS.entityB.role}
              </p>
              <p className="mt-3 text-xs text-fg-muted">
                <span className="font-semibold text-foreground">{t("legal.entityB.status")}:</span>{" "}
                {LEGAL_STATUS.entityB.status}
                <br />
                <span className="font-semibold text-foreground">{t("legal.entityB.mtqExposure")}:</span>{" "}
                {LEGAL_STATUS.entityB.mtqExposure}
              </p>
            </div>
          </div>
        </div>

        {/* Article VIII callout */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/[0.05] p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-foreground">{t("legal.articleVIII")}:</span>{" "}
            {LEGAL_STATUS.articleVIII}
          </p>
        </div>

        {/* Full legal table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 font-semibold">Value</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {LEGAL_STATUS.items.map((item) => {
                const positive = ["Active", "Published", "Filed", "Assigned", "On file", "Constitutional invariant"].includes(item.status);
                return (
                <tr key={item.label} className="hover:bg-ink-card/40">
                  <td className="px-5 py-3 font-medium text-foreground">{item.label}</td>
                  <td className="px-5 py-3 text-fg-muted">{item.value}</td>
                  <td className="px-5 py-3">
                    <Badge
                      className={
                        positive
                          ? "border-reserve/40 bg-reserve/10 text-[10px] text-reserve hover:bg-reserve/10"
                          : "border-gold/30 bg-gold/10 text-[10px] text-gold hover:bg-gold/10"
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/[0.05] p-5">
          <FileCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-foreground">{t("legal.constitutionalVersion")}:</span>{" "}
            {LEGAL_STATUS.constitutionalVersion}
            <br />
            <span className="font-semibold text-foreground">{t("legal.constitutionalStatus")}:</span>{" "}
            {LEGAL_STATUS.constitutionalStatus}
          </p>
        </div>
        {/* Independent verification: on-chain Safe Multi-Sig treasury is the
            single source of truth for any reserve claim the institution makes.
            The Constitution requires every claim rest on verifiable data, so
            we surface the explorer link directly under the legal-entity panel. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-soft p-4">
          <div className="flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">
                Verify on MonadScan
              </div>
              <div className="text-xs text-fg-muted">
                All 9 protocol smart contracts (MTQ, Governance, Algorithm, Reserve,
                Mint, Redeem, Oracle, Takaful, MockOracle) plus the Safe Multi-Sig
                Treasury and the Deployment Wallet are deployed on Monad Testnet.
                Every claim made on this page can be independently verified
                against the public ledger.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VerifyOnChain
              address="0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD"
              label="MTQ Token"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66"
              label="Governance"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0"
              label="Safe Multi-Sig"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0x8839ce50e8D414005518769999c0A5b961D00CB2"
              label="Algorithm"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0x1bbCd78E4DEF79b7a3B77242770cbAefAC816177"
              label="Reserve"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0x197e9CB28216dfe18a199b4c2930F74C2F460809"
              label="Mint"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0x963201C0Fa258033CCDdFcDceb8B5E3bc2b435a4"
              label="Redeem"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0xDfcA66ac0450C9AB86307af1942E157C5A4DB713"
              label="Oracle"
              size="md"
              showAddress={false}
            />
            <VerifyOnChain
              address="0x3eC27BB283644eF0A98B9961E9FBED0583a02f19"
              label="Takaful"
              size="md"
              showAddress={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Phase 0 Timeline ---------------- */

function PhaseZeroTimeline() {
  const { t } = useLanguage();
  const statusIcon = (status: string) => {
    switch (status) {
      case "done": return <Check className="h-4 w-4 text-reserve" />;
      case "in-progress": return <div className="h-3 w-3 animate-pulse rounded-full bg-gold" />;
      case "scheduled": return <Calendar className="h-4 w-4 text-gold" />;
      case "planned": return <Calendar className="h-4 w-4 text-fg-muted" />;
      default: return <CircleDollarSign className="h-4 w-4 text-fg-muted" />;
    }
  };
  const statusLabel = (status: string) => {
    switch (status) {
      case "done": return t("status.done");
      case "in-progress": return t("status.inProgress");
      case "scheduled": return t("status.scheduled");
      case "planned": return t("status.planned");
      default: return t("status.pending");
    }
  };
  return (
    <section id="s-phase-zero" className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <Eyebrow>{t("status.heading")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            From blueprint to live settlement rail
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            The Formation Committee is actively establishing the Institution. We are in Phase 0:
            foundation entity formation, regulatory filings, and institutional build-out.
          </p>
        </Reveal>
        <div className="mt-10 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Milestone</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PHASE_ZERO_TIMELINE.map((m) => (
                <tr key={m.milestone} className="hover:bg-ink-card/40">
                  <td className="px-5 py-3 font-medium text-foreground">{m.milestone}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(m.status)}
                      <span className={
                        m.status === "done" ? "text-reserve" :
                        m.status === "in-progress" ? "text-gold" :
                        "text-fg-muted"
                      }>
                        {statusLabel(m.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-fg-muted">{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Formation Committee contact form ---------------- */

function ContactForm() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    org: "",
    role: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.fullName.trim() || !form.email.trim() || !form.role) {
      toast({
        title: t("intake.missingDetails"),
        description: t("intake.missingDetailsDesc"),
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/formation-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Submission failed");
      }
      toast({
        title: t("intake.recorded"),
        description:
          t("intake.recordedDesc"),
      });
      setForm({ fullName: "", email: "", org: "", role: "", message: "" });
    } catch (err) {
      toast({
        title: t("intake.couldNotSubmit"),
        description:
          err instanceof Error ? err.message : t("intake.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="s-contact" className="scroll-mt-24 border-t border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <Eyebrow>{t("intake.eyebrow")}</Eyebrow>
          <h2 className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl">
            {t("intake.heading")}
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            The Formation Committee convenes to establish the Institution: register the
            Foundation, seat the Council, and deposit initial reserves. If you are an
            investor, advisor, anchor participant, or Council nominee, leave your details.
            We read every submission.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <form
            onSubmit={submit}
            className="mt-8 rounded-2xl border border-line bg-ink-soft p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  {t("intake.name")} *
                </span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder={t("intake.name")}
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  required
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  {t("intake.email")} *
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@org.com"
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  required
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  {t("intake.org")}
                </span>
                <input
                  type="text"
                  value={form.org}
                  onChange={(e) => set("org", e.target.value)}
                  placeholder="Optional"
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  {t("intake.role")} *
                </span>
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  required
                >
                  <option value="">{t("intake.rolePlaceholder")}</option>
                  {FORMATION_ROLES.map((r) => (
                    <option key={r.v} value={r.v}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-5 block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                Message
              </span>
              <textarea
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                rows={4}
                placeholder={t("intake.message")}
                className="mt-2 w-full resize-none rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
              />
            </label>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("intake.submitting")}
                  </>
                ) : (
                  <>
                    {t("intake.submit")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <span className="text-xs text-fg-muted">
                We store submissions securely and never share them.
              </span>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Public footer ---------------- */

function PublicFooter() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <div className="font-display text-base font-semibold text-foreground">
                MITHQAL
              </div>
              <div className="text-xs text-fg-muted">
                Constitutional Settlement Institution
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted">
            <a
              href="/api-docs"
              className="inline-flex items-center gap-1.5 transition hover:text-gold"
            >
              <FileCheck className="h-4 w-4" /> API Docs
            </a>
            <a
              href="https://x.com/MithqalMTQ"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-gold"
            >
              <Network className="h-4 w-4" /> @MithqalMTQ
            </a>
            <a
              href="https://github.com/MITHQALMTQ/mithqal"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-gold"
            >
              <BoxesIcon className="h-4 w-4" /> GitHub
            </a>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" /> Constitution v25.0
            </span>
            {/* A5 — Powered by Monad badge. Links to the Monad Testnet explorer
                so visitors can verify MTQ on-chain. */}
            <a
              href="https://testnet.monadscan.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold transition hover:border-gold hover:bg-gold/20"
              title="Mithqal is deployed on Monad Testnet — open the explorer (opens in a new tab)"
            >
              <Hexagon className="h-3 w-3" aria-hidden="true" />
              Powered by Monad
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
        <Separator className="my-6 bg-line" />
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-fg-muted">
            © 2026 MITHQAL Constitutional Settlement Institution. All rights reserved.
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">
            <span className="font-medium text-gold">MITHQAL v25.0</span> — FINAL INSTITUTIONAL EDITION — Canonical Blueprint.
            Non-custodial · Bank-funded issuance · Gold-anchored · 5-entity corporate structure · 25 FV invariants · 35 integrated test scenarios. Status: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED.
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">
            Operated through <span className="font-medium text-foreground">JOZOUR LLC</span>, a New Jersey limited liability company, USA.
            MTQ is minted exclusively against verified reserve deposits and is never sold unbacked, per the
            Constitution's invariants. Nothing on this page constitutes an offer to sell securities or any MTQ unit.
            Eligibility is objective and applied uniformly.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Shell ---------------- */

export default function PublicSite() {
  return (
    <div className="flex flex-col">
      <SiteHero />
      {/* LiveStateDashboard is now mounted INSIDE SiteHero (Audit Fix 2
          redesign) so the live KPI bar is visible above the fold — see
          LiveStateDashboard() return shape (a div, not a section). */}
      <WhatItIs />
      {/* Audit Fix 4 — Legal & Regulatory Status moved up: surfaces the
          operating entity + constitutional version right after the "what is
          Mithqal" framing, building institutional credibility early. */}
      <LegalStatus />
      <LayerZero />
      <Objectives />
      <Invariants />
      <AntiPlatform />
      <SettlementUnit />
      <Reserves />
      {/* Audit Fix 1 — Compact monetary-engine visualization between the
          reserves overview and governance, so the reader sees the basket
          mechanism right after the reserve structure that backs it. */}
      <MonetaryEngineCompact />
      {/* Task 3-e — Proof-of-Strength section: surfaces the v19.0.2 verified
          stress-test results (20/20 scenarios, stability rank #3 of 14, 5
          historical crises survived, 7 constitutional mechanisms) right
          after the engine explainer so the reader's mental flow is
          "what backs MTQ" → "how the basket works" → "proof it can't break". */}
      <StressTestProof />
      {/* Task 5-c — End-to-end workflow proof: surfaces the 5 verified E2E
          trade scenarios (mint → transfer → redeem → verify, with live NAV,
          FX rates, fees, and constitutional invariants at every checkpoint)
          right after the stress-test proof so the reader's mental flow is
          "proof it can't break" → "here's what real users actually do with
          it". 5/5 scenarios passed · 48/48 invariants hold · 96-99% savings
          vs traditional banking. */}
      <E2EScenarios />
      {/* Task 7-d — Live Readiness Dashboard: synthesizes the outputs of
          the three Task-7 test suites (crypto-economic 7-a, financial
          soundness 7-b, adversarial 7-c) plus the 5-b stress and E2E
          suites into a single board the COO/CTO can present externally.
          165 tests · 154 passed · 0 critical · conditionally ready. */}
      <LiveReadinessDashboard />
      {/* Task 14-a — Commercial Governance Dashboard: surfaces the four
          constitutional entities (Foundation, Holding, Operations, Markets),
          the 12-stage procurement workflow, weighted-median benchmark pricing,
          12-criteria best-execution scoring, the 60/25/15 performance
          participation split, compliance scores, and the immutable
          HMAC-SHA256 audit trail. Chapter XX — Constitutional Commercial
          Governance & Institutional Stewardship. */}
      <CommercialGovernanceDashboard />
      {/* Task 14-a — Commercial Transparency: public disclosure of every
          fee, every revenue source, the 6 commercial principles, the
          conflict-of-interest policy, the no-hidden-fees policy, and the
          audit history. */}
      <CommercialTransparency />
      {/* Task 14-a — Institutional Economics: visual flow diagram showing
          how funds move from participants → Operations → Markets → Reserve
          → back to participants, plus entity responsibilities and reserve
          integrity guardrails. */}
      <InstitutionalEconomics />
      {/* MITHQAL v25.0 FINAL ARCHITECTURAL AMENDMENT — MBG Dashboard:
          The strategic final architecture: a bank-side settlement gateway /
          sidecar that lets banks connect WITHOUT replacing their core banking
          systems. "TRANSLATION, NOT TRANSFORMATION." 12 sections per §29
          (Gateway Status, Connectivity, Pending Instructions, Settlements,
          Reconciliation, MTQ Position, Compliance Attestations, JSG Status,
          Incidents, Limits, Audit, DR Status). Integration state:
          INTEGRATION-READY (0 banks contracted, 20 tests SIMULATED, 18
          acceptance criteria met at spec level). */}
      <MBGDashboard />
      {/* §V25.0.D — Final Integrated Architecture Dashboard:
          The frozen normative v25.0 architecture: 5 corporate entities,
          7-layer MTQ model, DMCE (8 limits), FV11-FV25 (15 invariants),
          35 integrated test scenarios, 12 /gateway/v1/* endpoints, 7x18
          authority matrix, 44 acceptance criteria — all at spec level. */}
      <FinalIntegratedArchitectureDashboard />
      {/* §V25.0.C — Non-Custodial Reserve Architecture Dashboard:
          Canonical distinction: CUSTODY != VERIFICATION != ISSUANCE
          AUTHORIZATION != CANONICAL SUPPLY CONTROL. 5-actor control
          matrix, RCAF + ABC schemas, 15-step issuance gate, 6 custody
          prohibitions, FV11-FV17, Model A 21.5432% vs Model C 4.7086%. */}
      <NonCustodialReserveDashboard />
      {/* §V25.0.B — Bank-Funded Issuance Model Dashboard:
          4 capital concepts (A/B/C/D), Model A 21.5432% vs Model B 4.7086%,
          ILPS $48.1M (Emergency + Structural $23.8M is SUBSET), 6 capital
          categories (NOT auto-combined), 7-row Sources & Uses table,
          5 bank failure scenarios, 9-stage zero-budget evidence pipeline. */}
      <BankFundedIssuanceDashboard />
      {/* §V25.0.A — Smart-Contract Deployment Closure Dashboard:
          37-row inventory matrix (by contract / risk / status), 9 verification
          categories (128 tests, 114 passed, 14 blocked, 0 failed), 28 bytecode
          certificates (4 chains), 5 supply cert properties (all CERTIFIED),
          6 quarantined contracts (incl. Solana NON_CANONICAL), 9 deployment
          gates (0 PRODUCTION, 2 BLOCKED, 7 TESTNET), 10-stage release train. */}
      <SCDeploymentClosureDashboard />
      {/* §V25.0 — Final Pilot Activation Gate Dashboard:
          PILOT-READY (AMBER) — PRODUCTION-BLOCKED. 10 task gates, 10 standing
          blockers (all realWorldEvidence=ABSENT), 3 NEVER rules (0 violations),
          4 REAL / 13 SIMULATED / 0 CONTRACTED / 0 LIVE / 33 ABSENT evidence,
          10 external dependencies, 10 recommended next actions. */}
      <FinalPilotGateDashboard />
      {/* §V25.0 — Institutional Closure Dashboard (8-prompt series + supporting modules) */}
      <InstitutionalClosureDashboard />
      {/* Task 14-a — Reserve Flow Simulator: interactive slider ($1K–$10M)
          showing exactly where every dollar of a transaction goes — mint
          fee, net to procurement, gold purchased, savings split, reserve
          growth, and redemption path. */}
      <ReserveFlowSimulator />
      <Governance />
      <Lifecycle />
      <Eligibility />
      <PhaseZeroTimeline />
      <StatusBoard />
      <ContactForm />
      {/* PublicFooter removed — the global SiteFooter in layout.tsx now
          handles legal links, contact, and the testnet-only disclaimer
          on every view. This avoids duplicate footers on the Institution view. */}
    </div>
  );
}

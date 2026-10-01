"use client";

/* ============================================================================
 * MITHQAL §V25.3 — Institutionalization Control Tower UI
 * ----------------------------------------------------------------------------
 * Task ID: CT-UI
 *
 * The Founder/COO surface for the honest-state question:
 *   "What prevents MITHQAL from being institutionally deployable today?"
 *
 * This component ONLY renders the canonical CONTROL_TOWER_DATA authored in
 * `src/lib/institutionalization-control-tower.ts`. It does NOT invent, derive,
 * aggregate, score, or compute any status. The data is what it is.
 *
 * HONEST-STATE DISCIPLINE (non-negotiable):
 *   - The "NOT PRODUCTION-AUTHORIZED" badge is RED + prominent (header + footer)
 *   - No progress bars, no %, no scores, no vanity metrics
 *   - Every status card shows: status + evidence + timestamp + owner + nextAction
 *   - The 9 P0 blockers are surfaced in a red/amber banner the Founder sees FIRST
 *
 * DESIGN LANGUAGE:
 *   - Dark institutional palette (glass cards, gold accents, ink surfaces)
 *   - Mirrors `src/app/page.tsx` + `src/app/institutional-engagement/page.tsx`
 *   - Lucide icons, framer-motion for subtle transitions
 *   - Responsive: mobile (1 col) → tablet (2 col) → desktop (3 col)
 *
 * COLOR CODING (Founder grid + drill-downs):
 *   red   = blocked / pending external validation
 *   amber = design-time / illustrative / action item
 *   gray  = informational / structural baseline (e.g., FROZEN release)
 * ========================================================================== */

import { useState, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  AlertTriangle,
  AlertOctagon,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Scale,
  Building2,
  Landmark,
  Gavel,
  Cpu,
  Coins,
  Banknote,
  Users,
  FileCheck,
  Boxes,
  Activity,
  GitBranch,
  Tag,
  Ban,
  XCircle,
  ArrowRight,
  Target,
  Wallet,
  FileText,
  Globe,
  Handshake,
  ScrollText,
  Layers,
  type LucideProps,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  ControlTowerData,
  ControlTowerItem,
  DrillDownDomain,
} from "@/lib/institutionalization-control-tower";

/* ----------------------------------------------------------------------------
 * Defensive helpers (prevent null/undefined crashes during render)
 * ------------------------------------------------------------------------- */

/** Safe string — coerces null/undefined/objects to a printable string. */
function S(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return String(value);
  } catch {
    return fallback;
  }
}

/** Safe array — guarantees an array even if the source is null/undefined. */
function Arr<T>(value: readonly T[] | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/** Format an ISO 8601 timestamp into a compact UTC string for display. */
function fmtTimestamp(value: unknown): string {
  const s = S(value);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    // 2026-10-01 06:51 UTC
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
      `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
    );
  } catch {
    return s;
  }
}

/** Truncate a long string to a maximum length with a trailing ellipsis. */
function truncate(value: unknown, max = 220): string {
  const s = S(value);
  if (s.length <= max) return s;
  return `${s.slice(0, max).trimEnd()}…`;
}

/* ----------------------------------------------------------------------------
 * Status classifier — derives the display variant from the honest status text
 * ------------------------------------------------------------------------- */
type StatusVariant = "red" | "amber" | "gray";

function classifyStatus(status: unknown): StatusVariant {
  const s = S(status).toUpperCase();

  // RED = blocked / pending external validation / external decision required
  if (
    s.includes("PENDING") ||
    s.includes("BLOCKED") ||
    s.includes("NOT PRODUCTION") ||
    s.includes("P0 BLOCKER") ||
    s.includes("0 BANKS") ||
    s.includes("0/15") ||
    s.includes("0/40") ||
    s.includes("0 FTE") ||
    s.includes("0 SIGNED") ||
    s.includes("$0") ||
    s.includes("NO QUALIFIED") ||
    s.includes("ALL PENDING") ||
    s.includes("ALL OPEN") ||
    s.includes("ALL DRAFT") ||
    s.includes("UNKNOWN") ||
    s.includes("SEED_DATA") ||
    s.includes("CONSERVATIVE_BLOCK") ||
    s.includes("REQUIRED") ||
    s.includes("NO BANK")
  ) {
    return "red";
  }

  // AMBER = design-time / illustrative / action-item (engage)
  if (
    s.includes("DESIGN-TIME") ||
    s.includes("DESIGN_TIME") ||
    s.includes("SIMULATED") ||
    s.includes("ILLUSTRATIVE") ||
    s.includes("ENGAGE") ||
    s.includes("HTTP 200") ||
    s.includes("DRAFT")
  ) {
    return "amber";
  }

  // GRAY = informational / structural baseline (e.g., FROZEN release)
  return "gray";
}

/* ----------------------------------------------------------------------------
 * Variant → Tailwind class maps
 * ------------------------------------------------------------------------- */
const VARIANT_BORDER: Record<StatusVariant, string> = {
  red: "border-red-500/40",
  amber: "border-amber-500/40",
  gray: "border-line/60",
};

const VARIANT_DOT: Record<StatusVariant, string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  gray: "bg-fg-muted",
};

const VARIANT_TEXT: Record<StatusVariant, string> = {
  red: "text-red-300 dark:text-red-200",
  amber: "text-amber-300 dark:text-amber-200",
  gray: "text-fg-muted",
};

const VARIANT_STATUS_PILL: Record<StatusVariant, string> = {
  red: "border-red-500/30 bg-red-500/10 text-red-300 dark:text-red-200",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300 dark:text-amber-200",
  gray: "border-line/60 bg-ink-card/60 text-fg-muted",
};

/* ----------------------------------------------------------------------------
 * Reusable layout primitives — mirror institutional-engagement page design
 * ------------------------------------------------------------------------- */

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-card rounded-2xl ${className}`}>{children}</div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      {(eyebrow || title || intro) && (
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 max-w-3xl"
        >
          {eyebrow && (
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
              {S(eyebrow)}
            </div>
          )}
          {title && (
            <h2 className="font-display text-balance text-2xl leading-tight text-foreground sm:text-3xl">
              {S(title)}
            </h2>
          )}
          {intro && (
            <div className="mt-3 text-sm leading-relaxed text-fg-muted sm:text-base">
              {intro}
            </div>
          )}
        </motion.header>
      )}
      {children}
    </section>
  );
}

/* ----------------------------------------------------------------------------
 * Iconography map for the 15 Founder/COO items (by id)
 * ------------------------------------------------------------------------- */
const FOUNDER_ICONS: Record<number, ComponentType<LucideProps>> = {
  1: ShieldCheck, // Current Release — FROZEN baseline
  2: Activity, // Current Institutional Phase
  3: AlertTriangle, // P0 Blockers
  4: Lock, // Current Gate Status
  5: Scale, // Legal Status
  6: Landmark, // Regulatory Status
  7: Building2, // Bank Engagement
  8: Boxes, // Custody / Backing
  9: Cpu, // Technical Assurance
  10: Banknote, // Commercial
  11: FileCheck, // Evidence Completeness
  12: Wallet, // Cash / Budget
  13: Target, // Next Critical Action
  14: Ban, // Blocked Actions
  15: Handshake, // Required External Decision
};

function FounderIcon({ id }: { id: number }) {
  const Icon = FOUNDER_ICONS[id] ?? AlertTriangle;
  return <Icon className="h-5 w-5 text-gold" />;
}

/* ----------------------------------------------------------------------------
 * Iconography map for the 10 drill-down domains (by domain id)
 * ------------------------------------------------------------------------- */
const DOMAIN_ICONS: Record<string, ComponentType<LucideProps>> = {
  LEGAL: Scale,
  REGULATORY: Gavel,
  BANK: Building2,
  TECHNICAL: Cpu,
  SECURITY: ShieldAlert,
  ACCOUNTING: FileText,
  LIQUIDITY: Coins,
  COMMERCIAL: Banknote,
  OPERATIONS: Users,
  EVIDENCE: ScrollText,
};

function DomainIcon({ domain }: { domain: string }) {
  const Icon = DOMAIN_ICONS[S(domain).toUpperCase()] ?? Layers;
  return <Icon className="h-5 w-5 text-gold" />;
}

/* ----------------------------------------------------------------------------
 * Sub-component: Header (release version + status badge)
 * ------------------------------------------------------------------------- */
function Header({ release }: { release: ControlTowerData["release"] }) {
  const version = S(release?.version);
  const commit = S(release?.commit);
  const date = fmtTimestamp(release?.date);
  const status = S(release?.status);

  return (
    <header className="mesh-bg relative overflow-hidden border-b border-line/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-gold" />
            Institutionalization Control Tower · {version || "v25.3.2"}
          </div>

          <h1 className="font-display text-balance text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            MITHQAL Institutionalization
            <br />
            <span className="gold-text">Control Tower</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
            The single source of truth for the institutional readiness of the
            MITHQAL platform. Every status is derived from canonical module
            data — not invented, not optimistic, not aggregated into a vanity
            metric. Internal software completeness is never treated as
            institutional readiness.
          </p>

          {/* Status badge — RED, prominent, per task spec */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300 dark:text-red-200">
              <AlertOctagon className="h-4 w-4" />
              {status.includes("NOT PRODUCTION")
                ? "NOT PRODUCTION-AUTHORIZED"
                : status || "NOT PRODUCTION-AUTHORIZED"}
            </span>
            <Badge variant="outline" className="border-gold/30 bg-gold/5 text-gold">
              <Tag className="h-3 w-3" />
              {version}
            </Badge>
            {commit && (
              <Badge variant="outline" className="border-line/60 bg-ink-card/60 text-fg-muted">
                <GitBranch className="h-3 w-3" />
                {commit}
              </Badge>
            )}
            {date !== "—" && (
              <Badge variant="outline" className="border-line/60 bg-ink-card/60 text-fg-muted">
                {date}
              </Badge>
            )}
          </div>
        </motion.div>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------
 * Sub-component: Primary Question Banner — MOST PROMINENT element
 * ------------------------------------------------------------------------- */
function PrimaryQuestionBanner({
  question,
  blockers,
}: {
  question: string;
  blockers: string[];
}) {
  const blockerList = Arr(blockers);
  return (
    <Section
      id="primary-question"
      eyebrow="Primary Question · Founder / COO View"
      title={S(question)}
      intro={
        <span>
          The honest-state answer. Every blocker below is a P0 condition that{" "}
          <strong className="font-semibold text-amber-300 dark:text-amber-200">
            no code change can resolve
          </strong>{" "}
          — each requires an external decision (legal counsel, regulator,
          bank, custodian, or funder).
        </span>
      }
    >
      <GlassCard className="overflow-hidden border border-red-500/30 bg-red-500/5 p-0">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[auto_1fr]">
          {/* Left rail — alert icon + label */}
          <div className="flex items-center gap-4 border-b border-red-500/20 bg-red-500/10 p-6 lg:border-b-0 lg:border-r">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/10">
              <AlertOctagon className="h-7 w-7 text-red-400 dark:text-red-300" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300 dark:text-red-200">
                Honest-State Answer
              </div>
              <div className="mt-1 font-display text-xl font-bold text-foreground">
                {blockerList.length} P0 deployment blockers
              </div>
              <div className="mt-0.5 text-xs text-fg-muted">
                None resolvable by code alone
              </div>
            </div>
          </div>

          {/* Right rail — blocker list */}
          <div className="p-6">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {blockerList.map((blocker, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    delay: Math.min(i * 0.04, 0.32),
                  }}
                  className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-ink-card/40 p-3"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 text-[10px] font-bold text-red-300 dark:text-red-200">
                    {i + 1}
                  </div>
                  <div className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <span>{S(blocker)}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * Sub-component: FounderCard — one of the 15 items
 * ------------------------------------------------------------------------- */
function FounderCard({ item }: { item: ControlTowerItem }) {
  const variant = classifyStatus(item.status);
  const id = Number(item.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <GlassCard
        className={`flex h-full flex-col p-5 ${VARIANT_BORDER[variant]}`}
      >
        {/* Header: icon + id + label */}
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
            <FounderIcon id={id} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {String(id).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-0.5 font-display text-base font-bold leading-tight text-foreground">
              {S(item.label)}
            </h3>
          </div>
        </div>

        {/* Status pill */}
        <div className="mb-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${VARIANT_STATUS_PILL[variant]}`}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${VARIANT_DOT[variant]}`} />
            {S(item.status) || "—"}
          </span>
        </div>

        {/* Evidence (truncated) */}
        <div className="mb-3 flex-1">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Evidence
          </div>
          <p className="text-xs leading-relaxed text-foreground/80">
            {truncate(item.evidence, 240)}
          </p>
        </div>

        {/* Meta rows — timestamp + owner */}
        <div className="mb-3 grid grid-cols-1 gap-2 border-t border-line/40 pt-3">
          <MetaRow
            label="Verified"
            value={fmtTimestamp(item.timestamp)}
            icon={<Activity className="h-3 w-3" />}
          />
          <MetaRow
            label="Owner"
            value={S(item.owner)}
            icon={<Users className="h-3 w-3" />}
          />
        </div>

        {/* Next action */}
        <div className="rounded-lg border border-gold/15 bg-gold/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
            <ArrowRight className="h-3 w-3" />
            Next Action
          </div>
          <p className="text-xs leading-relaxed text-foreground/90">
            {truncate(item.nextAction, 180)}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function MetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
        {icon}
        {S(label)}
      </div>
      <div className="flex-1 text-xs leading-relaxed text-foreground/80">
        {value || "—"}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Sub-component: FounderGrid — 15-item grid (3 cols desktop, 2 tablet, 1 mobile)
 * ------------------------------------------------------------------------- */
function FounderGrid({ items }: { items: ControlTowerItem[] }) {
  const list = Arr(items);
  return (
    <Section
      id="founder-view"
      eyebrow="Founder / COO View · 15 Items"
      title="The 15-item institutional status grid"
      intro={
        <span>
          Each card surfaces the five canonical fields —{" "}
          <em className="not-italic font-semibold text-foreground">status</em>,{" "}
          <em className="not-italic font-semibold text-foreground">evidence</em>,{" "}
          <em className="not-italic font-semibold text-foreground">timestamp</em>,{" "}
          <em className="not-italic font-semibold text-foreground">owner</em>,{" "}
          <em className="not-italic font-semibold text-foreground">nextAction</em>
          . No vanity metrics — no progress bars, no %, no scores. Color
          coding: <span className="text-red-300 dark:text-red-200">red</span> ={" "}
          blocked/pending,{" "}
          <span className="text-amber-300 dark:text-amber-200">amber</span> ={" "}
          design-time,{" "}
          <span className="text-fg-muted">gray</span> = informational.
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((item) => (
          <FounderCard key={Number(item.id)} item={item} />
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * Sub-component: DrillDownRow — one accordion domain (single-expand enforced)
 * ------------------------------------------------------------------------- */
function DrillDownRow({
  domain,
  expanded,
  onToggle,
}: {
  domain: DrillDownDomain;
  expanded: boolean;
  onToggle: () => void;
}) {
  const variant = classifyStatus(domain.status);
  const blockers = Arr(domain.blockers);
  const refs = Arr(domain.evidenceRefs);

  return (
    <div
      className={`glass-card overflow-hidden rounded-2xl border ${VARIANT_BORDER[variant]} ${
        expanded ? "shadow-lg shadow-black/20" : ""
      }`}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`drilldown-panel-${S(domain.domain)}`}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-ink-card/40"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
          <DomainIcon domain={S(domain.domain)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.22em] text-gold">
              {S(domain.domain)}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${VARIANT_STATUS_PILL[variant]}`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${VARIANT_DOT[variant]}`} />
              {S(domain.status) || "—"}
            </span>
          </div>
          <h3 className="mt-1 font-display text-base font-bold leading-tight text-foreground">
            {S(domain.label)}
          </h3>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line/60 bg-ink-card/40"
        >
          <ChevronDown className="h-4 w-4 text-fg-muted" />
        </motion.div>
      </button>

      {/* AnimatePresence-driven expand/collapse panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            id={`drilldown-panel-${S(domain.domain)}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line/40 p-5">
              {/* Evidence (full) */}
              <div className="mb-4">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                  <FileCheck className="h-3 w-3" />
                  Evidence
                </div>
                <p className="text-sm leading-relaxed text-foreground/85">
                  {S(domain.evidence) || "—"}
                </p>
              </div>

              {/* Meta — timestamp + owner + nextAction */}
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetaCard
                  label="Verified"
                  value={fmtTimestamp(domain.timestamp)}
                  icon={<Activity className="h-3 w-3" />}
                />
                <MetaCard
                  label="Owner"
                  value={S(domain.owner)}
                  icon={<Users className="h-3 w-3" />}
                />
                <MetaCard
                  label="Next Action"
                  value={S(domain.nextAction)}
                  icon={<ArrowRight className="h-3 w-3" />}
                />
              </div>

              {/* Blockers */}
              {blockers.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300 dark:text-red-200">
                    <AlertTriangle className="h-3 w-3" />
                    Blockers ({blockers.length})
                  </div>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {blockers.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-red-500/15 bg-red-500/5 p-2.5 text-xs leading-relaxed text-foreground/85"
                      >
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        <span>{S(b)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evidence refs */}
              {refs.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                    <Layers className="h-3 w-3" />
                    Evidence References
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {refs.map((r, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md border border-line/60 bg-ink-card/60 px-2 py-0.5 font-mono text-[10px] text-fg-muted"
                      >
                        {S(r)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetaCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line/40 bg-ink-card/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
        {icon}
        {S(label)}
      </div>
      <div className="text-xs leading-relaxed text-foreground/85">
        {value || "—"}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Sub-component: DrillDownSection — 10 domains accordion
 * ------------------------------------------------------------------------- */
function DrillDownSection({ domains }: { domains: DrillDownDomain[] }) {
  const list = Arr(domains);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const toggle = (domain: string) => {
    setExpandedDomain((prev) => (prev === domain ? null : domain));
  };

  return (
    <Section
      id="drill-downs"
      eyebrow="Drill-Down · 10 Domains"
      title="Ten institutional drill-down domains"
      intro={
        <span>
          Expand a domain for the full evidence chain — status, evidence,
          owner, next action, blockers, and evidence references. Only one
          domain expands at a time (clicking another closes the previous).
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3">
        {list.map((domain) => (
          <DrillDownRow
            key={S(domain.domain)}
            domain={domain}
            expanded={expandedDomain === S(domain.domain)}
            onToggle={() => toggle(S(domain.domain))}
          />
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------------------
 * Sub-component: Footer — honest-state certification
 * ------------------------------------------------------------------------- */
function Footer({
  release,
  honestState,
}: {
  release: ControlTowerData["release"];
  honestState: ControlTowerData["honestState"];
}) {
  const certifications = [
    {
      label: "productionAuthorized",
      value: String(Boolean(honestState?.productionAuthorized)),
      negative: true,
    },
    {
      label: "legalClassificationsPending",
      value: String(Boolean(honestState?.legalClassificationsPending)),
      negative: true,
    },
    {
      label: "contractsDraft",
      value: String(Boolean(honestState?.contractsDraft)),
      negative: true,
    },
    {
      label: "fundingDesignTime",
      value: String(Boolean(honestState?.fundingDesignTime)),
      negative: true,
    },
    {
      label: "fteFilled",
      value: `${Number(honestState?.fteFilled ?? 0)} / 40.75`,
      negative: true,
    },
    {
      label: "pilotGatesPassed",
      value: `${Number(honestState?.pilotGatesPassed ?? 0)} / 15`,
      negative: true,
    },
  ];

  return (
    <footer className="border-t border-line/40 bg-ink-soft/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top — honest-state certification grid */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            <Shield className="h-4 w-4" />
            Honest-State Certification
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {certifications.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-red-500/20 bg-red-500/5 p-3"
              >
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.10em] text-fg-muted">
                  {c.label}
                </div>
                <div className="mt-1 font-display text-lg font-bold text-red-300 dark:text-red-200">
                  {c.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle — the NOT PRODUCTION-AUTHORIZED banner */}
        <div className="mb-8 flex flex-col items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/10">
            <AlertOctagon className="h-6 w-6 text-red-400 dark:text-red-300" />
          </div>
          <div className="flex-1">
            <div className="font-display text-xl font-bold text-red-300 dark:text-red-200">
              NOT PRODUCTION-AUTHORIZED
            </div>
            <div className="mt-1 text-xs leading-relaxed text-fg-muted">
              {S(release?.status)} · {S(release?.version)} · Verified{" "}
              {fmtTimestamp(release?.date)}. This Control Tower renders the
              honest-state. No status is invented, no metric is aggregated.
              Internal software completeness is never treated as institutional
              readiness.
            </div>
          </div>
        </div>

        {/* Bottom — institutional disclaimer line */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line/40 pt-6 text-center sm:flex-row sm:text-left">
          <div className="text-xs text-fg-muted">
            © {new Date().getUTCFullYear()} MITHQAL · §V25.3 Institutional
            Command Center · {S(release?.version)}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Controlled Baseline
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Source of Truth
            </span>
            <span className="inline-flex items-center gap-1 text-red-300 dark:text-red-200">
              <AlertTriangle className="h-3 w-3" />
              Honest-State
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------------------
 * Main exported component
 * ------------------------------------------------------------------------- */
export function InstitutionalizationControlTower({
  data,
}: {
  data: ControlTowerData;
}) {
  // Defensive defaults — if any sub-field is missing the page still renders.
  const release = data?.release ?? {
    version: "",
    commit: "",
    date: "",
    status: "",
  };
  const honestState = data?.honestState ?? {
    productionAuthorized: false,
    legalClassificationsPending: true,
    contractsDraft: true,
    fundingDesignTime: true,
    fteFilled: 0,
    pilotGatesPassed: 0,
  };
  const primaryQuestion = S(data?.primaryQuestion);
  const deploymentBlockers = Arr(data?.deploymentBlockers);
  const founderView = Arr(data?.founderView);
  const drillDowns = Arr(data?.drillDowns);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-ink text-foreground">
      <Header release={release} />

      <main id="main-content" className="flex-1">
        <PrimaryQuestionBanner
          question={primaryQuestion}
          blockers={deploymentBlockers}
        />
        <FounderGrid items={founderView} />
        <DrillDownSection domains={drillDowns} />
      </main>

      <Footer release={release} honestState={honestState} />
    </div>
  );
}

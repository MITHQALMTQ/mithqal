"use client";

/* ============================================================
 * MITHQAL §V25.2 — Institutional Pilot Readiness
 * ------------------------------------------------------------
 * Static, evidence-driven readiness surface for institutional
 * counterparts, regulators, and reviewers. NO fake percentages,
 * NO fake evidence, NO fake approvals. Every status is the
 * default NOT_ASSESSED / PROPOSED until real institutional
 * evidence is produced.
 * ============================================================ */

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Mail,
  Shield,
  FileText,
  ChevronRight,
  AlertTriangle,
  Lock,
  Building2,
  Network,
  FlaskConical,
  ClipboardCheck,
  Gavel,
  Landmark,
  Cpu,
  Banknote,
  ListChecks,
  Layers,
  ShieldCheck,
  BookOpen,
  Handshake,
} from "lucide-react";
import {
  READINESS_CATEGORIES,
  READINESS_STATUS_LABELS,
  JURISDICTION_STATUSES,
  PILOT_FLOW,
  REVIEW_PACKAGE,
  EVIDENCE_STATUS_LABELS,
  INSTITUTIONAL_EMAIL,
  DISCLAIMER,
  SECURITY_NOTICE,
} from "@/lib/institutional/types";

/* ─── Defensive helpers ───────────────────────────────────────
 * Mirrors the pattern used across the MITHQAL institutional
 * surfaces so that any future runtime data swap cannot crash the
 * page. The constants above are statically typed, but we still
 * normalize defensively.
 * ──────────────────────────────────────────────────────────── */
const S = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);
const N = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const Arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/* ─── Status color tokens ─────────────────────────────────────
 * Map the design-system color names ("gray", "amber", "gold",
 * "emerald") used by READINESS_STATUS_LABELS and
 * EVIDENCE_STATUS_LABELS to concrete Tailwind utility strings.
 * Gold uses the institutional CSS variable so it tracks the
 * dark/light/cyber theme palette automatically.
 * ──────────────────────────────────────────────────────────── */
type StatusColor = "gray" | "amber" | "gold" | "emerald";

const STATUS_COLOR_CLASSES: Record<
  StatusColor,
  { badge: string; dot: string; text: string; ring: string }
> = {
  gray: {
    badge:
      "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
    dot: "bg-zinc-400",
    text: "text-zinc-300",
    ring: "ring-zinc-500/30",
  },
  amber: {
    badge:
      "bg-amber-500/10 text-amber-300 border-amber-500/40",
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "ring-amber-500/40",
  },
  gold: {
    badge:
      "border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 text-[color:var(--gold-soft)]",
    dot: "bg-[color:var(--gold)]",
    text: "text-[color:var(--gold-soft)]",
    ring: "ring-[color:var(--gold)]/40",
  },
  emerald: {
    badge:
      "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    ring: "ring-emerald-500/40",
  },
};

function colorOf(name: string): StatusColor {
  if (name === "amber" || name === "gold" || name === "emerald") return name;
  return "gray";
}

/* ─── Motion preset ──────────────────────────────────────────
 * Shared framer-motion reveal props. We use the named easing
 * `easeOut` to keep the prop typing simple (custom bezier tuples
 * can fight framer-motion's `Easing` type under strict TS).
 * ──────────────────────────────────────────────────────────── */
const REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/* ─── Reusable presentational primitives ───────────────────── */
function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      {...REVEAL}
      className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-16"
    >
      {eyebrow && (
        <div className="mb-3 flex items-center gap-3">
          <span className="gold-rule h-px w-10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--gold)]">
            {eyebrow}
          </span>
        </div>
      )}
      <h2 className="font-display text-2xl text-foreground sm:text-3xl">
        {title}
      </h2>
      {intro && (
        <div className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-muted">
          {intro}
        </div>
      )}
      <div className="mt-8">{children}</div>
    </motion.section>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`glass-card card-hover relative overflow-hidden rounded-xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function StatusBadge({ color, label }: { color: StatusColor; label: string }) {
  const c = STATUS_COLOR_CLASSES[color];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${c.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}

/* ─── Section 1 · Header ──────────────────────────────────── */
function PageHeader() {
  return (
    <header className="relative overflow-hidden border-b border-[color:var(--line)]/60">
      <div className="grain-bg absolute inset-0 -z-10 opacity-70" />
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <nav className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--gold)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to MITHQAL
          </Link>
          <span className="text-[color:var(--line)]">/</span>
          <Link
            href="/institutional-engagement"
            className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--gold)]"
          >
            Institutional Engagement
            <ArrowRight className="h-3 w-3" />
          </Link>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-10"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--gold)]">
              MITHQAL §V25.2 · Pilot Readiness
            </span>
            <span className="h-px w-12 bg-[color:var(--gold)]/40" />
          </div>
          <h1 className="font-display text-3xl text-foreground sm:text-5xl">
            <span className="gold-text">INSTITUTIONAL PILOT</span>{" "}
            <span className="text-foreground">READINESS</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-fg-muted">
            Readiness status is evidence-driven and can only advance through
            documented institutional review.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] text-fg-muted">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 font-mono uppercase tracking-[0.18em] text-amber-300">
              <Shield className="h-3 w-3" />
              All categories: NOT ASSESSED
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--ink-card)] px-3 py-1 font-mono uppercase tracking-[0.18em]">
              <FileText className="h-3 w-3" />
              No approvals · No licenses · No live operations
            </span>
          </div>
        </motion.div>
      </div>
    </header>
  );
}

/* ─── Section 2 · Readiness Scorecard ─────────────────────── */
function ReadinessScorecard() {
  const categories = Arr(READINESS_CATEGORIES);
  return (
    <Section
      id="scorecard"
      eyebrow="§1 · Scorecard"
      title="Readiness Scorecard"
      intro={
        <div className="space-y-3">
          <p>
            The ten readiness categories below are the standing dimensions
            against which any institutional pilot must be evaluated. Each
            category carries a status that can only advance through documented
            institutional evidence — never through self-attestation.
          </p>
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-amber-200/90">
            <AlertTriangle className="mr-1.5 inline-block h-3.5 w-3.5 align-text-bottom" />
            Do not calculate fake percentages. Do not manufacture evidence.
          </p>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {categories.map((cat, idx) => {
          const status = S(cat.status);
          const meta =
            READINESS_STATUS_LABELS[status as keyof typeof READINESS_STATUS_LABELS] ??
            { label: status, color: "gray" };
          const color = colorOf(S(meta.color));
          const num = N(idx) + 1;
          return (
            <motion.div
              key={S(cat.id)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.4,
                delay: Math.min(num * 0.04, 0.4),
                ease: "easeOut",
              }}
            >
              <GlassCard>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-[11px] text-[color:var(--gold)]/80">
                      {String(num).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-base text-foreground sm:text-lg">
                        {S(cat.title)}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                        {S(cat.description)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge color={color} label={S(meta.label)} />
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── Section 3 · Pilot Model ─────────────────────────────── */
const PILOT_STEP_ICONS = [
  Building2,
  Landmark,
  Network,
  Banknote,
  FlaskConical,
  Cpu,
  ClipboardCheck,
  Lock,
  ShieldCheck,
];

function PilotModel() {
  const flow = Arr<string>(PILOT_FLOW);
  return (
    <Section
      id="pilot-model"
      eyebrow="§2 · Pilot Model"
      title="Pilot Model"
      intro={
        <p>
          The initial institutional pilot follows a strictly bounded,
          one-institution / one-jurisdiction / one-corridor scope. Each stage
          below is a gate — no stage may be skipped, and no stage implies
          approval of the next.
          <span className="mt-2 block rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-amber-200/90">
            <AlertTriangle className="mr-1.5 inline-block h-3.5 w-3.5 align-text-bottom" />
            Broader treasury holding is outside the initial pilot scope.
          </span>
        </p>
      }
    >
      <ol className="relative mx-auto max-w-3xl">
        {/* Vertical connector */}
        <span
          aria-hidden
          className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-[color:var(--gold)]/40 via-[color:var(--line)] to-transparent"
        />
        {flow.map((step, idx) => {
          const Icon = PILOT_STEP_ICONS[idx % PILOT_STEP_ICONS.length];
          const isLast = idx === flow.length - 1;
          return (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.4,
                delay: Math.min(idx * 0.05, 0.45),
                ease: "easeOut",
              }}
              className="relative flex items-stretch gap-5 pb-5"
            >
              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--ink-card)] text-[color:var(--gold)]">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <GlassCard className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-[color:var(--gold)]/80">
                      {String(N(idx) + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-sm uppercase tracking-[0.12em] text-foreground sm:text-base">
                      {step}
                    </span>
                  </div>
                  {!isLast && (
                    <ArrowDown
                      className="h-4 w-4 shrink-0 text-[color:var(--gold)]/60"
                      aria-hidden
                    />
                  )}
                </GlassCard>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </Section>
  );
}

/* ─── Section 4 · Institutional Review Package ────────────── */
function ReviewPackage() {
  const items = Arr<string>(REVIEW_PACKAGE);
  return (
    <Section
      id="review-package"
      eyebrow="§3 · Review Package"
      title="Institutional Review Package"
      intro={
        <div className="space-y-3">
          <p>
            The MITHQAL review package is the standing set of artifacts and
            templates that institutional counterparts may request during a
            formal engagement. Each item carries the{" "}
            <span className="font-mono text-[color:var(--gold)]">PROPOSED</span>{" "}
            status until an institutional review formally activates it.
          </p>
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-amber-200/90">
            <AlertTriangle className="mr-1.5 inline-block h-3.5 w-3.5 align-text-bottom" />
            These are MITHQAL review artifacts/templates. Not approved by any
            institution.
          </p>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, idx) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{
              duration: 0.35,
              delay: Math.min(idx * 0.04, 0.4),
              ease: "easeOut",
            }}
          >
            <GlassCard className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-[color:var(--gold)]/70" />
                <span className="text-sm leading-snug text-foreground">
                  {item}
                </span>
              </div>
              <StatusBadge color="gray" label="PROPOSED" />
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ─── Section 5 · Evidence / Status Discipline ────────────── */
function EvidenceDiscipline() {
  const entries = Object.entries(EVIDENCE_STATUS_LABELS) as [
    keyof typeof EVIDENCE_STATUS_LABELS,
    { label: string; variant: string }
  ][];
  return (
    <Section
      id="evidence-discipline"
      eyebrow="§4 · Evidence Discipline"
      title="Evidence / Status Discipline"
      intro={
        <p>
          Every institutional engagement element should visually distinguish its
          current evidence state. The five canonical statuses below are the only
          permitted display values on this surface.
        </p>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {entries.map(([key, meta], idx) => {
          const color = colorOf(S(meta.variant));
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{
                duration: 0.35,
                delay: Math.min(idx * 0.06, 0.4),
                ease: "easeOut",
              }}
            >
              <GlassCard className="flex h-full flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.18em] ${color.text}`}
                  >
                    {String(N(idx) + 1).padStart(2, "0")}
                  </span>
                  <StatusBadge color={color} label={S(meta.label)} />
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
                  {key}
                </p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        {...REVEAL}
        className="mt-6 rounded-md border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200/90"
      >
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-red-300">
          <Lock className="h-3.5 w-3.5" />
          Forbidden display values
        </div>
        <p className="leading-relaxed">
          Never display:{" "}
          <span className="font-mono font-semibold text-red-200">
            APPROVED, LICENSED, SUPPORTED, LIVE, PRODUCTION READY
          </span>{" "}
          unless backed by real verified evidence.
        </p>
      </motion.div>
    </Section>
  );
}

/* ─── Section 6 · Status Discipline Reference ─────────────── */
const EVIDENCE_LADDER = [
  "PROPOSED",
  "UNDER_REVIEW",
  "EVIDENCE_REQUIRED",
  "SANDBOX_CANDIDATE",
  "VALIDATED",
] as const;

const TECHNICAL_LADDER = [
  "DESIGNED",
  "IMPLEMENTED",
  "INTEGRATED",
  "TESTED",
  "SANDBOX_VALIDATED",
  "INSTITUTIONALLY_VALIDATED",
  "PRODUCTION_READY",
] as const;

function LadderRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[color:var(--line)]/70 bg-[color:var(--ink-card)]/60 px-3 py-2">
      <ChevronRight className="h-3 w-3 text-[color:var(--gold)]/70" />
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
        {label}
      </span>
    </div>
  );
}

function StatusDisciplineReference() {
  return (
    <Section
      id="status-discipline"
      eyebrow="§5 · Reference"
      title="Status Discipline Reference"
      intro={
        <p>
          Two parallel ladders govern institutional readiness: the{" "}
          <span className="text-foreground">evidence-state ladder</span>{" "}
          (does institutional evidence exist?) and the{" "}
          <span className="text-foreground">technical status ladder</span>{" "}
          (does the implementation satisfy a verification gate?). Both must
          advance together — neither may be inferred from the other.
        </p>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div {...REVEAL}>
          <GlassCard className="h-full">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[color:var(--gold)]" />
              <h3 className="font-display text-base text-foreground">
                Evidence-State Ladder
              </h3>
            </div>
            <div className="space-y-2">
              {EVIDENCE_LADDER.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-6 font-mono text-[10px] text-[color:var(--gold)]/70">
                    {String(N(i) + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <LadderRow label={s} />
                  </div>
                  {i < EVIDENCE_LADDER.length - 1 && (
                    <ArrowDown className="hidden h-3 w-3 text-[color:var(--gold)]/40 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div {...REVEAL}>
          <GlassCard className="h-full">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[color:var(--gold)]" />
              <h3 className="font-display text-base text-foreground">
                Technical Status Ladder
              </h3>
            </div>
            <div className="space-y-2">
              {TECHNICAL_LADDER.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-6 font-mono text-[10px] text-[color:var(--gold)]/70">
                    {String(N(i) + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <LadderRow label={s} />
                  </div>
                  {i < TECHNICAL_LADDER.length - 1 && (
                    <ArrowDown className="hidden h-3 w-3 text-[color:var(--gold)]/40 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <motion.div
        {...REVEAL}
        className="mt-6 rounded-md border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 p-4 text-sm text-[color:var(--gold-soft)]"
      >
        <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
          <Shield className="h-3.5 w-3.5" />
          Advance rule
        </div>
        <p className="leading-relaxed text-foreground/90">
          Only authorized institutional evidence should move an element forward.
        </p>
      </motion.div>
    </Section>
  );
}

/* ─── Section 7 · Jurisdiction Workflow ───────────────────── */
const JURISDICTION_ICONS = [
  FileText,
  ClipboardCheck,
  Landmark,
  Gavel,
  Cpu,
  FlaskConical,
  ShieldCheck,
  Handshake,
];

function JurisdictionWorkflow() {
  const statuses = Arr(JURISDICTION_STATUSES);
  return (
    <Section
      id="jurisdiction"
      eyebrow="§6 · Jurisdiction"
      title="Jurisdiction Workflow"
      intro={
        <div className="space-y-3">
          <p>
            The jurisdiction workflow defines how a jurisdiction evaluation
            request advances — from initial submission through to institutional
            validation. None of these states constitutes a license, an
            approval, or a supported jurisdiction status.
          </p>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-amber-200/90">
            <AlertTriangle className="mr-1.5 inline-block h-3.5 w-3.5 align-text-bottom" />
            A jurisdiction must NEVER become &ldquo;supported&rdquo; simply
            because someone submits a form.
          </div>
          <div className="rounded-md border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 p-3 text-[color:var(--gold-soft)]">
            <Shield className="mr-1.5 inline-block h-3.5 w-3.5 align-text-bottom" />
            Only authorized institutional evidence should move a jurisdiction
            forward.
          </div>
        </div>
      }
    >
      <ol className="relative mx-auto max-w-3xl">
        <span
          aria-hidden
          className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-[color:var(--reserve)]/40 via-[color:var(--line)] to-transparent"
        />
        {statuses.map((entry, idx) => {
          const Icon = JURISDICTION_ICONS[idx % JURISDICTION_ICONS.length];
          const num = N(idx) + 1;
          return (
            <motion.li
              key={S(entry.status)}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.4,
                delay: Math.min(idx * 0.05, 0.4),
                ease: "easeOut",
              }}
              className="relative flex items-stretch gap-5 pb-5"
            >
              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[color:var(--reserve)]/30 bg-[color:var(--ink-card)] text-[color:var(--reserve)]">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <GlassCard>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[color:var(--reserve)]/80">
                          {String(num).padStart(2, "0")}
                        </span>
                        <h3 className="font-display text-sm uppercase tracking-[0.12em] text-foreground sm:text-base">
                          {S(entry.label)}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                        {S(entry.description)}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </Section>
  );
}

/* ─── Section 8 · Contact CTA ─────────────────────────────── */
function ContactCTA() {
  return (
    <Section
      id="contact"
      eyebrow="§7 · Contact"
      title="Institutional Contact"
      intro={
        <p>
          Institutional counterparts, regulators, and reviewers may request the
          review package or initiate a formal evaluation through the channels
          below. Initial contact should contain only institutional,
          non-sensitive information.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <motion.div {...REVEAL}>
          <GlassCard className="flex h-full flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-[color:var(--gold)]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base text-foreground">
                  Email MITHQAL Directly
                </h3>
                <p className="font-mono text-xs text-fg-muted">
                  {INSTITUTIONAL_EMAIL}
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-fg-muted">
              Use this channel to request the institutional review package,
              propose a sandbox evaluation, or initiate a formal architecture
              review. Replies are not instantaneous and do not constitute an
              institutional commitment.
            </p>

            <div className="mt-auto flex flex-wrap gap-3">
              <a
                href={`mailto:${INSTITUTIONAL_EMAIL}`}
                className="glow-gold inline-flex items-center gap-2 rounded-md border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-4 py-2 text-sm font-medium text-[color:var(--gold-soft)] transition hover:bg-[color:var(--gold)]/20"
              >
                <Mail className="h-4 w-4" />
                Email MITHQAL Directly
              </a>
              <Link
                href="/institutional-engagement"
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--line)] bg-[color:var(--ink-card)] px-4 py-2 text-sm font-medium text-foreground transition hover:border-[color:var(--gold)]/40 hover:text-[color:var(--gold-soft)]"
              >
                Institutional Engagement
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div {...REVEAL}>
          <GlassCard className="h-full border-amber-500/30 bg-amber-500/[0.03]">
            <div className="mb-3 flex items-center gap-2 text-amber-300">
              <Shield className="h-4 w-4" />
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em]">
                Security Notice
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-amber-100/90">
              {SECURITY_NOTICE}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </Section>
  );
}

/* ─── Footer ──────────────────────────────────────────────── */
function PageFooter() {
  return (
    <footer className="border-t border-[color:var(--line)]/60 bg-[color:var(--ink-soft)]/40">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--gold)]">
            {DISCLAIMER}
          </p>
          <nav className="flex items-center gap-4 text-xs text-fg-muted">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--gold)]"
            >
              <ArrowLeft className="h-3 w-3" />
              Home
            </Link>
            <Link
              href="/institutional-engagement"
              className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--gold)]"
            >
              Engagement
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/legal/risk-disclosure"
              className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--gold)]"
            >
              <BookOpen className="h-3 w-3" />
              Risk Disclosure
            </Link>
          </nav>
        </div>
        <p className="mt-4 text-[10px] text-fg-muted">
          © {new Date().getFullYear()} MITHQAL · JOZOUR LLC (NJ). All
          readiness states on this page are NOT ASSESSED / PROPOSED by default.
        </p>
      </div>
    </footer>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function InstitutionalReadinessPage() {
  return (
    <main className="min-h-screen bg-[color:var(--ink)] text-foreground">
      <PageHeader />
      <ReadinessScorecard />
      <PilotModel />
      <ReviewPackage />
      <EvidenceDiscipline />
      <StatusDisciplineReference />
      <JurisdictionWorkflow />
      <ContactCTA />
      <PageFooter />
    </main>
  );
}

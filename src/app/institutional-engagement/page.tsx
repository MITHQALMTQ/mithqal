"use client";

/* ============================================================================
 * MITHQAL §V25.2 — Institutional Engagement Page
 * ----------------------------------------------------------------------------
 * The institutional front-door for regulated institutions, monetary
 * authorities, regulators, infrastructure providers and independent assurance
 * institutions. Describes who MITHQAL is seeking to engage, the six engagement
 * types, the readiness checklist, jurisdiction workflow, the pilot model and
 * the institutional review package. Closes with the formal intake form.
 *
 * Design principles:
 *   • Same MITHQAL institutional design system (dark, glass, gold/emerald/amber).
 *   • NO crypto clichés, NO fake partner logos, NO retail fintech aesthetics.
 *   • Institutions are described as "institutions MITHQAL is seeking to
 *     engage" — never as "partners".
 *   • All data comes from `@/lib/institutional/types` — no inline literals.
 *   • Defensive helpers (S / Arr) prevent null/undefined crashes.
 * ========================================================================== */

import { useMemo, type ComponentType } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Landmark,
  Building2,
  Briefcase,
  Network,
  Shield,
  Scale,
  Cpu,
  Lock,
  FileText,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  GitBranch,
  ClipboardList,
  ScrollText,
  ShieldAlert,
  type LucideProps,
} from "lucide-react";

import {
  INSTITUTION_CARDS,
  ENGAGEMENT_TYPES,
  MITHQAL_PROVIDES,
  PILOT_FLOW,
  REVIEW_PACKAGE,
  READINESS_CHECKLIST,
  JURISDICTION_STATUSES,
  EVIDENCE_STATUS_LABELS,
  INSTITUTIONAL_EMAIL,
  SECURITY_NOTICE,
  DISCLAIMER,
  type EvidenceStatus,
} from "@/lib/institutional/types";

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

/* ----------------------------------------------------------------------------
 * Lazy-load the intake form (built by a sibling agent). If the module is
 * missing or errors at runtime, the rest of the page still renders.
 * ------------------------------------------------------------------------- */
const InstitutionalIntakeForm = dynamic(
  () =>
    import("@/components/institutional/intake-form").then(
      (m) => m.InstitutionalIntakeForm,
    ),
  {
    ssr: false,
    loading: () => <IntakeFormSkeleton />,
  },
);

function IntakeFormSkeleton() {
  return (
    <div className="glass-card min-h-[320px] animate-pulse rounded-2xl p-8">
      <div className="mb-6 h-6 w-1/3 rounded bg-ink-card/80" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-ink-card/60" />
        ))}
      </div>
      <p className="mt-4 text-xs text-fg-muted">
        Loading institutional intake form…
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Reusable layout primitives
 * ------------------------------------------------------------------------- */

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 ${className}`}
    >
      {(eyebrow || title || intro) && (
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 max-w-3xl"
        >
          {eyebrow && (
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
              {S(eyebrow)}
            </div>
          )}
          {title && (
            <h2 className="font-display text-balance text-3xl leading-tight text-foreground sm:text-4xl">
              {S(title)}
            </h2>
          )}
          {intro && (
            <div className="mt-4 text-sm leading-relaxed text-fg-muted sm:text-base">
              {intro}
            </div>
          )}
        </motion.header>
      )}
      {children}
    </section>
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
    <div className={`glass-card card-hover rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: "gray" | "amber" | "gold" | "emerald";
}) {
  const palette: Record<string, string> = {
    gray: "border-line/60 bg-ink-card/60 text-fg-muted",
    amber:
      "border-amber-500/30 bg-amber-500/10 text-amber-300 dark:text-amber-200",
    gold: "border-gold/40 bg-gold/10 text-gold",
    emerald:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 dark:text-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${palette[variant] ?? palette.gray}`}
    >
      {children}
    </span>
  );
}

function NoticeBox({
  tone = "amber",
  title,
  children,
}: {
  tone?: "amber" | "gold" | "emerald";
  title: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    amber:
      "border-amber-500/30 bg-amber-500/5 text-amber-200/90 dark:text-amber-100/90",
    gold: "border-gold/30 bg-gold/5 text-gold/90",
    emerald:
      "border-emerald-500/30 bg-emerald-500/5 text-emerald-200/90 dark:text-emerald-100/90",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone] ?? tones.amber}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-xs leading-relaxed">
          <div className="mb-1 font-semibold uppercase tracking-[0.14em]">
            {S(title)}
          </div>
          <div className="opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Iconography map for institution cards
 * ------------------------------------------------------------------------- */
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  Landmark,
  Building2,
  Briefcase,
  Network,
  Shield,
  Scale,
  Cpu,
  Lock,
  FileText,
  BookOpen,
};

function InstitutionIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[S(name)] ?? Landmark;
  return <Icon className="h-5 w-5 text-gold" />;
}

/* ----------------------------------------------------------------------------
 * Top-level page
 * ------------------------------------------------------------------------- */

export default function InstitutionalEngagementPage() {
  /* Group the 33 checklist items by category (preserves declaration order). */
  const checklistByCategory = useMemo(() => {
    const groups: Record<string, typeof READINESS_CHECKLIST> = {};
    for (const item of Arr(READINESS_CHECKLIST)) {
      const key = S(item?.category, "Other");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, []);

  return (
    <div className="print-page flex min-h-screen flex-col overflow-x-hidden bg-ink text-foreground">
      <EngagementHeader />

      <main id="main-content" className="flex-1">
        {/* ──────────────────────────────────────────────────────────────
         * §1 — HERO
         * ────────────────────────────────────────────────────────────── */}
        <section className="mesh-bg relative overflow-hidden border-b border-line/40">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-gold" />
                Institutional Engagement · §V25.2
              </div>

              <h1 className="font-display text-balance text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
                Build.{" "}
                <span className="gold-text glow-text-gold">Test.</span>{" "}
                Validate.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-relaxed text-fg-muted sm:text-lg">
                MITHQAL is seeking regulated institutions, monetary authorities,
                regulators, infrastructure providers and independent assurance
                institutions for controlled technical review, sandbox testing,
                integration assessment and pilot design.
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-fg-muted">
                Engagement is subject to institutional, legal, regulatory,
                technical and jurisdictional review.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#intake-form"
                  className="glow-gold inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold/90"
                >
                  Express Institutional Interest
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/institutional-readiness"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-ink-card/50 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-gold/40 hover:text-gold"
                >
                  View Pilot Requirements
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10">
                <Badge variant="gold">{S(DISCLAIMER)}</Badge>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────
         * §2 — WHO MITHQAL IS SEEKING TO ENGAGE
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="who"
          eyebrow="§2 · Engagement Scope"
          title="Institutions MITHQAL is seeking to engage"
          intro={
            <>
              MITHQAL is not advertising partnerships and is not offering a
              token. The institutions below describe the categories MITHQAL is
              seeking to engage for controlled technical review, sandbox testing,
              integration assessment and pilot design. Engagement is selective,
              evidence-led and jurisdiction-specific.
            </>
          }
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Arr(INSTITUTION_CARDS).map((card, idx) => (
              <motion.div
                key={`${S(card?.type)}-${idx}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(idx * 0.04, 0.4),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <GlassCard className="flex h-full flex-col">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg border border-gold/30 bg-gold/5 p-2">
                      <InstitutionIcon name={S(card?.icon)} />
                    </div>
                    <h3 className="font-display text-base leading-tight text-foreground">
                      {S(card?.title)}
                    </h3>
                  </div>

                  <dl className="space-y-3 text-xs leading-relaxed text-fg-muted">
                    <div>
                      <dt className="mb-1 font-semibold uppercase tracking-[0.12em] text-gold/80">
                        Who they are
                      </dt>
                      <dd className="text-foreground/85">
                        {S(card?.whoTheyAre)}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 font-semibold uppercase tracking-[0.12em] text-gold/80">
                        What MITHQAL may ask
                      </dt>
                      <dd className="text-foreground/85">
                        {S(card?.whatMithqalMayAsk)}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 font-semibold uppercase tracking-[0.12em] text-gold/80">
                        Appropriate engagement
                      </dt>
                      <dd className="text-foreground/85">
                        {S(card?.appropriateEngagement)}
                      </dd>
                    </div>
                  </dl>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §3 — ENGAGEMENT TYPES
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="engagement-types"
          eyebrow="§3 · Engagement Matrix"
          title="Engagement types"
          intro={
            <>
              Each engagement type is a structured technical activity with
              defined inputs, MITHQAL-provided artefacts and the evidence
              expected at closure. All engagement types are currently{" "}
              <span className="text-gold">PROPOSED</span> — none has been
              activated. Activation requires documented institutional
              authorization.
            </>
          }
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Arr(ENGAGEMENT_TYPES).map((et, idx) => {
              const status = S(et?.status, "PROPOSED") as EvidenceStatus;
              const badge = EVIDENCE_STATUS_LABELS?.[status];
              const variant =
                badge?.variant === "gold"
                  ? "gold"
                  : badge?.variant === "amber"
                    ? "amber"
                    : badge?.variant === "emerald"
                      ? "emerald"
                      : "gray";
              return (
                <motion.div
                  key={`${S(et?.type)}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(idx * 0.05, 0.3),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <GlassCard className="flex h-full flex-col">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg text-foreground">
                        {S(et?.title)}
                      </h3>
                      <Badge variant={variant}>
                        {S(badge?.label, "PROPOSED")}
                      </Badge>
                    </div>

                    <p className="mb-4 text-xs leading-relaxed text-fg-muted">
                      {S(et?.purpose)}
                    </p>

                    <dl className="mt-auto space-y-3 text-xs leading-relaxed">
                      <div>
                        <dt className="mb-1 font-semibold uppercase tracking-[0.12em] text-gold/80">
                          Institution inputs
                        </dt>
                        <dd className="text-foreground/85">
                          {S(et?.institutionInputs)}
                        </dd>
                      </div>
                      <div>
                        <dt className="mb-1 font-semibold uppercase tracking-[0.12em] text-gold/80">
                          MITHQAL inputs
                        </dt>
                        <dd className="text-foreground/85">
                          {S(et?.mithqalInputs)}
                        </dd>
                      </div>
                      <div>
                        <dt className="mb-1 font-semibold uppercase tracking-[0.12em] text-gold/80">
                          Expected evidence
                        </dt>
                        <dd className="text-foreground/85">
                          {S(et?.expectedEvidence)}
                        </dd>
                      </div>
                    </dl>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §4 — WHAT WE NEED FROM THE INSTITUTION
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="checklist"
          eyebrow="§4 · Institutional Readiness"
          title="What we need from the institution"
          intro={
            <>
              The checklist below itemises the inputs MITHQAL typically
              requests from an institution during intake. Requirements vary by
              institution, jurisdiction and engagement type. These items are
              display-only — they describe scope, not a contract.
            </>
          }
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Object.entries(checklistByCategory).map(
              ([category, items], catIdx) => (
                <motion.div
                  key={`cat-${S(category)}-${catIdx}`}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(catIdx * 0.04, 0.3),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <GlassCard className="h-full">
                    <div className="mb-4 flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-gold" />
                      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
                        {S(category)}
                      </h3>
                      <Badge variant="gray">
                        {Arr(items).length} item{Arr(items).length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <ul className="space-y-2">
                      {Arr(items).map((item) => (
                        <li
                          key={`item-${S(item?.id)}`}
                          className="flex items-start gap-3 text-xs leading-relaxed text-fg-muted"
                        >
                          <span
                            className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-line bg-ink-card/60"
                            aria-hidden="true"
                          >
                            <CheckCircle2 className="h-3 w-3 text-transparent" />
                          </span>
                          <span className="text-foreground/80">
                            <span className="text-fg-muted">[{S(item?.id)}] </span>
                            {S(item?.label)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </motion.div>
              ),
            )}
          </div>

          <div className="mt-6">
            <NoticeBox tone="amber" title="Security notice">
              {S(SECURITY_NOTICE)}
            </NoticeBox>
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §5 — WHAT MITHQAL PROVIDES
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="provides"
          eyebrow="§5 · MITHQAL Inputs"
          title="What MITHQAL provides"
          intro={
            <>
              MITHQAL can provide, subject to readiness and formal agreement,
              the artefacts below for controlled review, sandbox testing and
              integration assessment. MITHQAL cannot and will not promise:
              licensing, regulatory approval, funding, liquidity, custody,
              financial guarantees, institutional authorization, or production
              deployment.
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Arr(MITHQAL_PROVIDES).map((item, idx) => (
              <motion.div
                key={`prov-${idx}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(idx * 0.03, 0.4),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="glass-card card-hover flex items-start gap-3 rounded-xl p-4"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-gold/5 font-mono text-[11px] text-gold">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <p className="text-xs leading-relaxed text-foreground/85">
                  {S(item)}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-6">
            <NoticeBox tone="gold" title="What MITHQAL will not promise">
              Licensing · Regulatory approval · Funding · Liquidity · Custody ·
              Financial guarantees · Institutional authorization · Production
              deployment. Any pilot is a controlled test, not a production
              commitment.
            </NoticeBox>
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §6 — JURISDICTION SUPPORT CENTER
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="jurisdiction"
          eyebrow="§6 · Jurisdiction Support"
          title="Bring your jurisdiction into the evaluation"
          intro={
            <>
              MITHQAL evaluates jurisdictions individually. A jurisdiction
              becomes a candidate only after institutional, legal, regulatory,
              technical and corridor reviews are completed. The structured
              inputs below describe the information MITHQAL typically requires
              to scope a jurisdiction evaluation. They are display-only and
              non-functional — submit through the formal intake form below.
            </>
          }
        >
          <div className="mb-6">
            <NoticeBox tone="amber" title="Free-text jurisdiction entry">
              Allow regulator/authority fields to be entered as institutional
              free text. MITHQAL does not maintain a public regulatory directory.
              Do not enter confidential information here or in the intake form.
            </NoticeBox>
          </div>

          <GlassCard className="!p-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {JURISDICTION_FIELDS.map((field) => (
                <JurisdictionField key={field.id} field={field} />
              ))}
            </div>
          </GlassCard>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §7 — JURISDICTION WORKFLOW
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="jurisdiction-workflow"
          eyebrow="§7 · Jurisdiction Workflow"
          title="Jurisdiction evaluation workflow"
          intro={
            <>
              A jurisdiction advances through eight evaluation states. None of
              these states constitutes approval. Each transition is gated by
              documented evidence.
            </>
          }
        >
          <div className="mx-auto max-w-3xl">
            <ol className="relative space-y-5 border-l border-gold/30 pl-6">
              {Arr(JURISDICTION_STATUSES).map((js, idx) => (
                <motion.li
                  key={`js-${S(js?.status)}-${idx}`}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(idx * 0.05, 0.4),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative"
                >
                  <span className="absolute -left-[1.65rem] flex h-5 w-5 items-center justify-center rounded-full border border-gold/40 bg-ink font-mono text-[10px] text-gold">
                    {idx + 1}
                  </span>
                  <div className="glass-card rounded-xl p-4">
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                      {S(js?.label)}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                      {S(js?.description)}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>

            <div className="mt-6">
              <NoticeBox tone="amber" title="Hard rule">
                A jurisdiction must NEVER become &quot;supported&quot; simply
                because someone submits a form. Each transition is gated by
                documented institutional evidence and review.
              </NoticeBox>
            </div>
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §8 — INTAKE FORM (lazy-loaded)
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="intake-form"
          eyebrow="§8 · Institutional Intake"
          title="Express institutional interest"
          intro={
            <>
              The intake form below is the formal channel for institutional
              interest. Submission does not constitute an engagement, an offer,
              a partnership or any obligation on either party. It is an
              evaluation request only.
            </>
          }
        >
          <InstitutionalIntakeForm />

          <div className="mt-6">
            <NoticeBox tone="amber" title="Security notice">
              {S(SECURITY_NOTICE)}
            </NoticeBox>
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §9 — CONTACT
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="contact"
          eyebrow="§9 · Direct Contact"
          title="Email MITHQAL directly"
          intro={
            <>
              For institutions unable or unwilling to use the intake form,
              MITHQAL accepts initial institutional contact by email. Initial
              contact should contain only institutional and non-sensitive
              information.
            </>
          }
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <GlassCard className="lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
                  <Mail className="h-5 w-5 text-gold" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-base text-foreground">
                    Institutional email
                  </div>
                  <a
                    href={`mailto:${S(INSTITUTIONAL_EMAIL)}`}
                    className="mt-1 inline-block break-all font-mono text-sm text-gold underline-offset-4 hover:underline"
                  >
                    {S(INSTITUTIONAL_EMAIL)}
                  </a>
                  <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                    Use this address for initial institutional contact only.
                    Do not attach credentials, customer information or other
                    secrets.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={`mailto:${S(INSTITUTIONAL_EMAIL)}`}
                  className="glow-gold inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold/90"
                >
                  <Mail className="h-4 w-4" />
                  Email MITHQAL Directly
                </a>
                <a
                  href="#intake-form"
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-ink-card/50 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold/40 hover:text-gold"
                >
                  Open intake form
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </GlassCard>

            <GlassCard className="!border-amber-500/30">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300 dark:text-amber-200" />
                <div>
                  <div className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-amber-300 dark:text-amber-200">
                    Security notice
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                    {S(SECURITY_NOTICE)}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §10 — PILOT MODEL
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="pilot-model"
          eyebrow="§10 · Pilot Model"
          title="The initial pilot model"
          intro={
            <>
              The initial pilot is scoped narrowly to enable controlled
              testing. Broader treasury holding is outside the initial pilot
              scope. Each stage gates the next.
            </>
          }
        >
          <div className="mx-auto max-w-3xl">
            <ol className="relative space-y-3 border-l-2 border-gold/30 pl-8">
              {Arr(PILOT_FLOW).map((step, idx) => (
                <motion.li
                  key={`pilot-${idx}`}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(idx * 0.04, 0.4),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative"
                >
                  <span className="absolute -left-[2.1rem] flex h-6 w-6 items-center justify-center rounded-full border border-gold/40 bg-ink text-[10px] font-bold text-gold">
                    {idx + 1}
                  </span>
                  <div className="glass-card flex items-center gap-3 rounded-lg px-4 py-3">
                    <GitBranch className="h-4 w-4 text-gold" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                      {S(step)}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ol>

            <div className="mt-6">
              <NoticeBox tone="amber" title="Scope boundary">
                Broader treasury holding is outside the initial pilot scope.
                The pilot evaluates pass-through settlement, reconciliation and
                security semantics — not custody of treasury assets.
              </NoticeBox>
            </div>
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
         * §11 — INSTITUTIONAL REVIEW PACKAGE
         * ────────────────────────────────────────────────────────────── */}
        <Section
          id="review-package"
          eyebrow="§11 · Review Package"
          title="Institutional review package"
          intro={
            <>
              The review package below is the structured set of MITHQAL review
              artefacts and templates. These are MITHQAL review artefacts — not
              approved by any institution. They are provided to institutions for
              controlled technical review and pilot scoping.
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Arr(REVIEW_PACKAGE).map((item, idx) => (
              <motion.div
                key={`rp-${idx}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(idx * 0.04, 0.4),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <GlassCard className="flex h-full items-start gap-4">
                  <div className="mt-0.5 rounded-md border border-gold/30 bg-gold/5 p-2">
                    <ClipboardList className="h-4 w-4 text-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                      Item {String(idx + 1).padStart(2, "0")}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                      {S(item)}
                    </p>
                  </div>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-line" />
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="mt-6">
            <NoticeBox tone="amber" title="Review artefacts only">
              These are MITHQAL review artifacts/templates. Not approved by any
              institution. They are inputs to a controlled review process, not
              artefacts of an activated pilot.
            </NoticeBox>
          </div>
        </Section>
      </main>

      <EngagementFooter />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Header — link back to "/" (main dashboard) + "/institutional-readiness"
 * ------------------------------------------------------------------------- */
function EngagementHeader() {
  return (
    <header className="no-print sticky top-0 z-[60] border-b border-line/40 glass">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-fg-muted transition hover:text-gold"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">MITHQAL Dashboard</span>
          <span className="sm:hidden">Home</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          <Landmark className="h-4 w-4" />
          <span>Institutional Engagement</span>
        </div>

        <Link
          href="/institutional-readiness"
          className="group inline-flex items-center gap-2 rounded-lg border border-line bg-ink-card/50 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-gold/40 hover:text-gold"
        >
          <span className="hidden sm:inline">Pilot Readiness</span>
          <span className="sm:hidden">Ready</span>
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------------------
 * Footer — DISCLAIMER + institutional CTA
 * ------------------------------------------------------------------------- */
function EngagementFooter() {
  return (
    <footer className="border-t border-line/40 bg-ink-soft/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              <ScrollText className="h-4 w-4" />
              Disclaimer
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-fg-muted">
              {S(DISCLAIMER)} This page describes MITHQAL&apos;s institutional
              engagement model under §V25.2. Nothing on this page constitutes a
              license, a legal opinion, a regulatory clearance, an offer to
              enter into a partnership, or a commitment to deploy. All
              engagement is subject to institutional, legal, regulatory,
              technical and jurisdictional review.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end lg:text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-muted">
              Next steps
            </div>
            <a
              href="#intake-form"
              className="glow-gold inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold/90"
            >
              Express Institutional Interest
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${S(INSTITUTIONAL_EMAIL)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-ink-card/50 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold/40 hover:text-gold"
            >
              <Mail className="h-4 w-4" />
              {S(INSTITUTIONAL_EMAIL)}
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-line/40 pt-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="text-[10px] uppercase tracking-[0.22em] text-fg-muted">
              MITHQAL · §V25.2 · Institutional Engagement
            </div>
            <Badge variant="gray">{S(DISCLAIMER)}</Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------------------
 * Jurisdiction field schema + display component (display-only, non-functional)
 * ------------------------------------------------------------------------- */

interface JurisdictionFieldDef {
  id: string;
  label: string;
  hint?: string;
  type: "text" | "textarea" | "select";
  options?: string[];
}

const JURISDICTION_FIELDS: JurisdictionFieldDef[] = [
  { id: "country", label: "Country", type: "text", hint: "Sovereign jurisdiction under evaluation." },
  { id: "regulator", label: "Regulator", type: "text", hint: "Free-text. Do not enter confidential information." },
  { id: "central-bank", label: "Central Bank", type: "text", hint: "Monetary authority for the jurisdiction (if distinct)." },
  { id: "local-currency", label: "Local Currency", type: "text", hint: "ISO 4217 code where applicable." },
  { id: "proposed-corridor", label: "Proposed Corridor", type: "text", hint: "Origin / destination settlement corridor under evaluation." },
  { id: "payment-rails", label: "Payment Rails", type: "text", hint: "e.g. RTGS, ACH, instant payment, host-to-host." },
  { id: "messaging-standards", label: "Messaging Standards", type: "text", hint: "e.g. ISO 20022, SWIFT MT." },
  { id: "sandbox-available", label: "Sandbox Available?", type: "select", options: ["Yes", "No", "Unknown"] },
  { id: "regulatory-framework", label: "Regulatory Framework", type: "textarea", hint: "Brief overview only. No legal opinions." },
  { id: "data-residency", label: "Data Residency", type: "textarea", hint: "Constraints on where institutional data may reside." },
  { id: "legal-questions", label: "Legal Questions", type: "textarea", hint: "Open questions for legal review." },
  { id: "regulatory-questions", label: "Regulatory Questions", type: "textarea", hint: "Open questions for regulatory review." },
  { id: "technical-questions", label: "Technical Questions", type: "textarea", hint: "Open questions for technical review." },
  { id: "integration-questions", label: "Integration Questions", type: "textarea", hint: "Open questions for integration review." },
  { id: "expected-timeline", label: "Expected Timeline", type: "text", hint: "Indicative only. Not a commitment." },
  { id: "institution-role", label: "Institution Role", type: "select", options: ["Sponsor", "Participant", "Observer", "Assurance"] },
];

function JurisdictionField({ field }: { field: JurisdictionFieldDef }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/90">
        {S(field.label)}
      </span>
      {field.type === "textarea" ? (
        <textarea
          rows={3}
          disabled
          placeholder={S(field.hint, "—")}
          className="w-full resize-none rounded-lg border border-line bg-ink-card/40 px-3 py-2 text-xs text-fg-muted placeholder:text-fg-muted/60 disabled:cursor-not-allowed"
        />
      ) : field.type === "select" ? (
        <select
          disabled
          defaultValue=""
          className="w-full rounded-lg border border-line bg-ink-card/40 px-3 py-2 text-xs text-fg-muted disabled:cursor-not-allowed"
        >
          <option value="">Select…</option>
          {Arr(field.options).map((opt) => (
            <option key={S(opt)} value={S(opt)}>
              {S(opt)}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          disabled
          placeholder={S(field.hint, "—")}
          className="w-full rounded-lg border border-line bg-ink-card/40 px-3 py-2 text-xs text-fg-muted placeholder:text-fg-muted/60 disabled:cursor-not-allowed"
        />
      )}
      {field.hint && (
        <span className="mt-1 block text-[10px] leading-snug text-fg-muted/80">
          {S(field.hint)}
        </span>
      )}
    </label>
  );
}

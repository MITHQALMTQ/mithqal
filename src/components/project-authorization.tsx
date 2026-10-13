"use client";

/* ============================================================
 * ProjectAuthorization
 * ------------------------------------------------------------
 * Surfaces the JOZOUR, LLC Resolution dated July 31, 2026
 * that authorizes the MITHQAL project as a project of the
 * Company, names the Manager's 7 authorities, names the
 * three specific digital assets (GitHub, website, X/Twitter),
 * and records the Two-Entity Architecture and the Successor
 * Transfer clause.
 *
 * This is the F1 Gap 4 remediation: a shared section that
 * renders on both /status and /institutional-readiness so
 * the public institutional record shows that MITHQAL is an
 * authorized project (not a private venture).
 *
 * The component is presentation-only — no business logic.
 * Style notes:
 *  - Uses the dark-gold institutional theme shared across
 *    legal surfaces.
 *  - All cards are responsive (grid stacks on mobile).
 *  - Sticky footer pattern is owned by the parent pages,
 *    not this component.
 * ============================================================ */

import { motion } from "framer-motion";
import {
  Github,
  Globe,
  Twitter,
  Building2,
  ShieldCheck,
  ArrowRightLeft,
  Landmark,
  FileText,
  ScrollText,
  Gavel,
  Briefcase,
  Banknote,
  Code2,
  Users,
  HandCoins,
  Landmark as LandmarkIcon,
  BookOpen,
} from "lucide-react";

/* ---- Source data ---- */

const THREE_DIGITAL_ASSETS = [
  {
    label: "GitHub",
    value: "MITHQALMTQ",
    href: "https://github.com/MITHQALMTQ/mithqal",
    icon: Github,
    note: "Source-code organization. The full MITHQAL codebase is public and auditable here.",
  },
  {
    label: "Website",
    value: "mithqal.vercel.app",
    href: "https://mithqal.vercel.app",
    icon: Globe,
    note: "Production deployment hosted on Vercel — the canonical institutional command center.",
  },
  {
    label: "X / Twitter",
    value: "@MithqalMTQ",
    href: "https://x.com/MithqalMTQ",
    icon: Twitter,
    note: "Official social media presence on X (formerly Twitter).",
  },
] as const;

const SEVEN_MANAGER_AUTHORITIES = [
  {
    n: 1,
    title: "Executing Contracts",
    body: "Authority to execute contracts, agreements, and instruments in the name of the Company in connection with the MITHQAL project.",
    icon: FileText,
  },
  {
    n: 2,
    title: "Opening Accounts",
    body: "Authority to open banking and custody accounts for the purpose of holding reserves and operational funds of the MITHQAL project.",
    icon: Banknote,
  },
  {
    n: 3,
    title: "Developing IP",
    body: "Authority to develop, maintain, and publish the intellectual property of the MITHQAL project, including the Constitution, the codebase, and the monetary-engine specification.",
    icon: Code2,
  },
  {
    n: 4,
    title: "Engaging Advisors",
    body: "Authority to engage professional advisors — legal, technical, financial, regulatory, and custody — to support the development of the MITHQAL project.",
    icon: Users,
  },
  {
    n: 5,
    title: "Applying for Grants",
    body: "Authority to apply for grants, sponsorships, and institutional funding from foundations, sovereign entities, and nonprofit partners.",
    icon: HandCoins,
  },
  {
    n: 6,
    title: "Banking & Custody Relationships",
    body: "Authority to establish banking and custody relationships with qualified institutional counterparties, subject to compliance with applicable law.",
    icon: Briefcase,
  },
  {
    n: 7,
    title: "Publishing the Constitution",
    body: "Authority to publish the MITHQAL Constitution and to operate the MITHQAL project consistent with its constitutional framework.",
    icon: BookOpen,
  },
] as const;

/* ---- Motion preset (matches institutional-readiness REVEAL) ---- */
const REVEAL = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/* ---- Page-level wrapper ---- */

type Variant = "status" | "readiness";

export function ProjectAuthorization({ variant }: { variant: Variant }) {
  if (variant === "status") {
    return <StatusVariant />;
  }
  return <ReadinessVariant />;
}

/* ---- /status variant (uses flat section, no Section component) ---- */

function StatusVariant() {
  return (
    <section
      id="project-authorization"
      aria-labelledby="pa-status-heading"
      className="mt-10"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="gold-rule h-px w-10" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
          JOZOUR, LLC Resolution · July 31, 2026
        </span>
      </div>
      <h2
        id="pa-status-heading"
        className="font-display text-lg text-foreground"
      >
        Project Authorization (Jozour, LLC Resolution)
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-fg-muted">
        The MITHQAL project is authorized as a project of{" "}
        <strong>Jozour, LLC</strong>, a New Jersey Limited Liability Company
        (EIN 84-3470275, registered office 116 Mallory Ave, Jersey City, NJ
        07304), sole member <strong>Mohamed Salah Eltonsy</strong>. The
        Resolution was adopted July 31, 2026 under the authority of the
        MITHQAL Constitution v19.0 and remains in effect until modified by
        further written resolution or until successor transfer per the
        Operating Agreement Amendment §1.4.
      </p>

      <div className="mt-6 space-y-6">
        <DigitalAssetsCard />
        <ManagerAuthoritiesCard />
        <TwoEntityCard />
        <SuccessorTransferCard />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-fg-muted">
        Source: Resolution of JOZOUR, LLC Regarding the MITHQAL Project, dated
        July 31, 2026. For the underlying Operating Agreement Amendment
        (including §1.4 Asset Segregation, §1.5 Manager Indemnification,
        §1.7 No Liability for Existing Debts, and §1.8 Non-Profit Character),
        see{" "}
        <a
          href="/legal/institutional-trust"
          className="text-gold hover:underline"
        >
          /legal/institutional-trust
        </a>{" "}
        and{" "}
        <a
          href="/legal/indemnification"
          className="text-gold hover:underline"
        >
          /legal/indemnification
        </a>
        .
      </p>
    </section>
  );
}

/* ---- /institutional-readiness variant (uses Section + GlassCard pattern) ---- */

function ReadinessVariant() {
  return (
    <motion.section
      id="project-authorization"
      {...REVEAL}
      className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-16"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="gold-rule h-px w-10" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--gold)]">
          §7-A · Project Authorization
        </span>
      </div>
      <h2 className="font-display text-2xl text-foreground sm:text-3xl">
        Project Authorization (Jozour, LLC Resolution — July 31, 2026)
      </h2>
      <div className="mt-3 max-w-3xl text-sm leading-relaxed text-fg-muted">
        <p>
          The MITHQAL project is authorized as a project of{" "}
          <strong>Jozour, LLC</strong>, a New Jersey Limited Liability Company
          (EIN 84-3470275, registered office 116 Mallory Ave, Jersey City, NJ
          07304), sole member <strong>Mohamed Salah Eltonsy</strong>. The
          Resolution was adopted July 31, 2026 under the authority of the
          MITHQAL Constitution v19.0 and remains in effect until modified by
          further written resolution or until successor transfer per the
          Operating Agreement Amendment §1.4.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <DigitalAssetsCard />
        <ManagerAuthoritiesCard />
        <div className="grid gap-4 sm:grid-cols-2">
          <TwoEntityCard />
          <SuccessorTransferCard />
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-fg-muted">
        Source: Resolution of JOZOUR, LLC Regarding the MITHQAL Project, dated
        July 31, 2026. For the underlying Operating Agreement Amendment
        (including §1.4 Asset Segregation, §1.5 Manager Indemnification,
        §1.7 No Liability for Existing Debts, and §1.8 Non-Profit Character),
        see the{" "}
        <a
          href="/legal/institutional-trust"
          className="text-gold hover:underline"
        >
          Institutional Trust Framework
        </a>{" "}
        and the{" "}
        <a
          href="/legal/indemnification"
          className="text-gold hover:underline"
        >
          Manager Indemnification Framework
        </a>
        .
      </p>
    </motion.section>
  );
}

/* ---- Reusable cards ---- */

function DigitalAssetsCard() {
  return (
    <motion.div {...REVEAL}>
      <div className="overflow-hidden rounded-xl border border-gold/30 bg-gold/[0.03]">
        <div className="border-b border-gold/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Three digital assets explicitly named
              </h3>
              <p className="text-xs text-fg-muted">
                The Resolution names the GitHub organization, the production
                website, and the X/Twitter account as MITHQAL project assets.
              </p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-line/60">
          {THREE_DIGITAL_ASSETS.map((asset) => (
            <a
              key={asset.label}
              href={asset.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 px-5 py-4 transition hover:bg-gold/[0.04] sm:flex-row sm:items-start sm:gap-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/5 text-gold transition group-hover:bg-gold/15">
                <asset.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-display text-sm font-semibold text-foreground">
                    {asset.label}
                  </span>
                  <code className="font-mono text-xs text-gold-soft">
                    {asset.value}
                  </code>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                  {asset.note}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ManagerAuthoritiesCard() {
  return (
    <motion.div {...REVEAL}>
      <div className="overflow-hidden rounded-xl border border-line bg-ink-card/60">
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Manager&apos;s seven authorities
              </h3>
              <p className="text-xs text-fg-muted">
                The Resolution enumerates seven specific authorities vested in
                the Manager (Mohamed Salah Eltonsy) for the operation of the
                MITHQAL project.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-0 sm:grid-cols-2">
          {SEVEN_MANAGER_AUTHORITIES.map((auth, i) => (
            <div
              key={auth.n}
              className={[
                "flex flex-col gap-2 p-4",
                i % 2 === 0 ? "sm:border-r" : "",
                i < SEVEN_MANAGER_AUTHORITIES.length - 2
                  ? "border-b border-line"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-gold/5 text-gold">
                  <auth.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                    Authority {String(auth.n).padStart(2, "0")}
                  </div>
                  <div className="font-display text-sm font-semibold text-foreground">
                    {auth.title}
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-fg-muted">{auth.body}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TwoEntityCard() {
  return (
    <motion.div {...REVEAL} className="h-full">
      <div className="h-full overflow-hidden rounded-xl border border-line bg-ink-card/60">
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Two-Entity Architecture
              </h3>
              <p className="text-xs text-fg-muted">
                The constitutional destination of the MITHQAL project, as
                recognized by the Resolution.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-line p-4 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-gold" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                Entity A · Planned
              </span>
            </div>
            <p className="mt-2 font-display text-sm font-semibold text-foreground">
              MITHQAL Foundation Inc.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              A nonprofit 501(c)(3) to be formed. Will hold constitutional
              authority over the MITHQAL project. Does not yet exist; pending
              IRS recognition of exemption.
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gold" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                Entity B · Interim
              </span>
            </div>
            <p className="mt-2 font-display text-sm font-semibold text-foreground">
              Jozour, LLC
            </p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              New Jersey LLC, EIN 84-3470275, sole member Mohamed Salah
              Eltonsy. Interim operator pending Foundation formation; holds
              project assets in trust per §1.4(c).
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SuccessorTransferCard() {
  return (
    <motion.div {...REVEAL} className="h-full">
      <div className="h-full overflow-hidden rounded-xl border border-[color:var(--reserve)]/30 bg-[color:var(--reserve)]/[0.04]">
        <div className="border-b border-[color:var(--reserve)]/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--reserve)]/30 bg-[color:var(--reserve)]/10 text-[color:var(--reserve)]">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Successor Transfer clause
              </h3>
              <p className="text-xs text-fg-muted">
                The Resolution acknowledges the §1.4(b) successor-transfer
                provision of the Operating Agreement Amendment.
              </p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs leading-relaxed text-fg-muted">
            Upon formation of MITHQAL Foundation Inc. as a 501(c)(3) tax-exempt
            nonprofit and upon its IRS recognition of exemption, all MITHQAL
            project assets transfer from Jozour, LLC to the Foundation{" "}
            <strong>at no cost or for nominal consideration</strong>. Until
            such transfer, all project assets are held in trust for the benefit
            of the future Foundation per §1.4(c).
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-[color:var(--reserve)]/20 bg-[color:var(--reserve)]/[0.06] px-3 py-2 text-xs text-[color:var(--reserve)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              Constitutional authority transfers with the assets — no
              commercial friction at Foundation formation.
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Github,
  Globe,
  Twitter,
  Building2,
  ShieldCheck,
  ArrowRightLeft,
  Landmark,
  ScrollText,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Institutional Trust Framework",
  description:
    "Jozour, LLC — Interim Operator of the MITHQAL Project. Asset Segregation and Successor Transfer per Jozour Operating Agreement Amendment §1.4.",
};

/* ------------------------------------------------------------------ */
/*  Source data — JOZOUR Operating Agreement Amendment §1.4          */
/* ------------------------------------------------------------------ */

const SIX_ASSET_CATEGORIES = [
  {
    roman: "i",
    heading: "Intellectual Property",
    body: "All intellectual property, software, technology, and code developed under the MITHQAL project name, including the Mithqal Constitution, the MTQ token specification, the monetary-engine implementation, and all derivative works.",
  },
  {
    roman: "ii",
    heading: "Contracts & Instruments",
    body: "All contracts, agreements, and instruments entered into in connection with the MITHQAL project — custody agreements, banking arrangements, oracle service contracts, integration partnerships, and licensing instruments.",
  },
  {
    roman: "iii",
    heading: "Banking & Custody Accounts",
    body: "All banking and custody accounts opened or maintained for the purpose of holding reserves, settlement assets, or operational funds of the MITHQAL project. Accounts are segregated from the Company's general corporate accounts.",
  },
  {
    roman: "iv",
    heading: "Institutional Relationships",
    body: "All institutional relationships and partnerships established in connection with the MITHQAL project — custodian relationships, banking relationships, regulator engagements, exchange listings, and integration partnerships.",
  },
  {
    roman: "v",
    heading: "Records & Documentation",
    body: "All records, documentation, and data generated or maintained in connection with the MITHQAL project — including but not limited to the Constitutional record, audit trails, governance minutes, and operational logs.",
  },
  {
    roman: "vi",
    heading: "Digital Assets",
    body: "All digital assets attributable to the MITHQAL project — including the GitHub organization, the production website, and the project's official social media accounts.",
  },
] as const;

const THREE_DIGITAL_ASSETS = [
  {
    label: "GitHub Organization",
    value: "MITHQALMTQ",
    href: "https://github.com/MITHQALMTQ/mithqal",
    icon: Github,
    description: "Source code repository, smart-contract suite, and constitutional specification are version-controlled here. The full MITHQAL codebase is public and auditable.",
  },
  {
    label: "Production Website",
    value: "mithqal.vercel.app",
    href: "https://mithqal.vercel.app",
    icon: Globe,
    description: "The public-facing production deployment hosted on Vercel. The canonical institutional command center and dashboard.",
  },
  {
    label: "X / Twitter",
    value: "@MithqalMTQ",
    href: "https://x.com/MithqalMTQ",
    icon: Twitter,
    description: "The project's official social media presence on X (formerly Twitter). Used for institutional announcements and constitutional updates.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function InstitutionalTrustPage() {
  return (
    <>
      <h1 className="sr-only">Institutional Trust Framework — Jozour, LLC</h1>
      <div className="flex-1">
        <main className="mx-auto w-full max-w-4xl px-5 py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-fg-muted transition hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Mithqal
          </Link>

          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
              JOZOUR Operating Agreement Amendment · §1.4
            </p>
            <h2 className="font-display mt-2 text-3xl text-foreground sm:text-4xl">
              Institutional Trust Framework
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              Jozour, LLC — Interim Operator of the MITHQAL Project
            </p>
            <p className="mt-2 text-xs text-fg-muted">
              Amendment date: July 31, 2026 · Authority: MITHQAL Constitution v19.0
            </p>
          </div>

          <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
            MITHQAL is currently operated by JOZOUR LLC during the institutional
            development phase. The constitutional architecture described throughout
            this documentation represents the intended institutional destination of
            the project. Planned entities do not yet exist and are not currently
            operating.
          </div>

          {/* Intro paragraph */}
          <p className="mt-8 text-sm leading-relaxed text-fg-muted">
            This page surfaces the institutional-trust provisions of the{" "}
            <strong>JOZOUR, LLC Operating Agreement Amendment</strong>, dated
            July 31, 2026. The Amendment governs the relationship between Jozour,
            LLC (the interim for-profit operator) and the future{" "}
            <strong>MITHQAL Foundation Inc.</strong> (the planned 501(c)(3)
            nonprofit that will hold constitutional authority over the MITHQAL
            project). The provisions below ensure that project assets are
            segregated from the Company&apos;s general corporate assets and that
            they will transfer cleanly to the Foundation upon its formation and
            IRS recognition.
          </p>

          {/* §1.4(a) Asset Segregation */}
          <section className="mt-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="gold-rule h-px w-10" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                §1.4(a) · Asset Segregation
              </span>
            </div>
            <h3 className="font-display text-lg text-foreground">
              Six categories of segregated project assets
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              The Amendment requires that all MITHQAL project assets be held
              separately from the Company&apos;s general corporate assets. The
              six categories enumerated in §1.4(a) are reproduced below.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {SIX_ASSET_CATEGORIES.map((cat) => (
                <Card
                  key={cat.roman}
                  className="border-line bg-ink-card/60 p-4 shadow-none"
                >
                  <CardHeader className="p-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-gold">
                        ({cat.roman})
                      </span>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {cat.heading}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-2 p-0">
                    <CardDescription className="text-xs leading-relaxed text-fg-muted">
                      {cat.body}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Digital Assets card — the three named in §1.4(a)(vi) */}
          <section className="mt-10">
            <Card className="border-gold/30 bg-gold/[0.03] p-0 shadow-none">
              <CardHeader className="border-b border-gold/20 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                    <ScrollText className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      Three Digital Assets (§1.4(a)(vi))
                    </CardTitle>
                    <CardDescription className="text-xs text-fg-muted">
                      The specific digital properties named in the Amendment as
                      MITHQAL project assets held in trust for the future
                      Foundation.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-line/60">
                  {THREE_DIGITAL_ASSETS.map((asset) => (
                    <a
                      key={asset.label}
                      href={asset.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-1 px-6 py-4 transition hover:bg-gold/[0.04] sm:flex-row sm:items-start sm:gap-4"
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
                          {asset.description}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* §1.4(b) Successor Transfer */}
          <section className="mt-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="gold-rule h-px w-10" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                §1.4(b) · Successor Transfer
              </span>
            </div>
            <h3 className="font-display text-lg text-foreground">
              Transfer to the MITHQAL Foundation Inc. at no cost
            </h3>
            <Card className="mt-4 border-line bg-ink-card/60 p-0 shadow-none">
              <CardContent className="p-0">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--reserve)]/30 bg-[color:var(--reserve)]/10 text-[color:var(--reserve)]">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-fg-muted">
                      Upon formation of <strong>MITHQAL Foundation Inc.</strong>{" "}
                      as a 501(c)(3) tax-exempt nonprofit organization — and
                      upon its recognition of exemption by the U.S. Internal
                      Revenue Service — all MITHQAL project assets enumerated in
                      §1.4(a) shall transfer <strong>at no cost or for nominal
                      consideration</strong> from Jozour, LLC to the Foundation.
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                      This provision ensures that the constitutional authority
                      over the MITHQAL project — including the Constitution, the
                      codebase, and the operational infrastructure — passes to
                      the nonprofit Foundation without any commercial friction
                      once the Foundation is recognized.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* §1.4(c) Interim Operation */}
          <section className="mt-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="gold-rule h-px w-10" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                §1.4(c) · Interim Operation
              </span>
            </div>
            <h3 className="font-display text-lg text-foreground">
              Held in trust pending Foundation formation
            </h3>
            <Card className="mt-4 border-line bg-ink-card/60 p-0 shadow-none">
              <CardContent className="p-0">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-fg-muted">
                      Until such transfer, and notwithstanding the for-profit
                      character of Jozour, LLC, all MITHQAL project assets are{" "}
                      <strong>held in trust for the benefit of the future
                      Foundation</strong>. The Company shall not assign,
                      transfer, encumber, or dispose of any MITHQAL project
                      asset except as may be required to operate the project in
                      the ordinary course consistent with the MITHQAL
                      Constitution v19.0.
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                      This means the interim for-profit operator cannot extract
                      value from the MITHQAL project for its own account — every
                      asset acquired, developed, or maintained for the project
                      is held for the future Foundation, pending §1.4(b) transfer.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Two-Entity Architecture reference card */}
          <section className="mt-10">
            <Card className="border-line bg-ink-card/60 p-0 shadow-none">
              <CardHeader className="border-b border-line px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                    <Building2 className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      Two-Entity Architecture (constitutional destination)
                    </CardTitle>
                    <CardDescription className="text-xs text-fg-muted">
                      The §1.4 transfer provisions exist to bridge the
                      interim-for-profit operator and the future nonprofit
                      constitutional authority.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid gap-0 sm:grid-cols-2">
                  <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
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
                      A nonprofit 501(c)(3) to be formed. Upon IRS recognition of
                      exemption, will hold constitutional authority over the
                      MITHQAL project. Receives all project assets per §1.4(b) at
                      no cost or for nominal consideration.
                    </p>
                  </div>
                  <div className="p-5">
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
                      A New Jersey Limited Liability Company (EIN 84-3470275),
                      sole member Mohamed Salah Eltonsy, registered office 116
                      Mallory Ave, Jersey City, NJ 07304. Interim operator pending
                      Foundation formation; holds project assets in trust per
                      §1.4(c).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Authority + jurisdiction footer */}
          <section className="mt-10 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
            <strong>Authority:</strong> This page surfaces §1.4 of the JOZOUR, LLC
            Operating Agreement Amendment dated July 31, 2026, adopted under the
            authority of the MITHQAL Constitution v19.0. The Amendment and the
            underlying Constitution are available on request to institutional
            counterparts. The MITHQAL Foundation Inc. does not yet exist; until
            its 501(c)(3) recognition, Jozour, LLC acts as interim operator and
            holds all project assets in trust per §1.4(c).
          </section>

          <div className="mt-8 flex flex-wrap gap-3 text-xs">
            <Link
              href="/legal/indemnification"
              className="inline-flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/5 px-3 py-1.5 font-medium text-gold transition hover:bg-gold/15"
            >
              §1.5 Manager Indemnification
            </Link>
            <Link
              href="/legal/terms"
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-medium text-fg-muted transition hover:text-foreground"
            >
              Terms of Service (incl. §1.7 + §1.8)
            </Link>
            <Link
              href="/legal/risk-disclosure"
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-medium text-fg-muted transition hover:text-foreground"
            >
              Risk Disclosure
            </Link>
          </div>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}

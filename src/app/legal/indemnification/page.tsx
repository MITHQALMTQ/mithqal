import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Scale,
  AlertTriangle,
  UserCheck,
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
  title: "Manager Indemnification Framework",
  description:
    "Jozour, LLC — Indemnification of the Manager per Operating Agreement Amendment §1.5. Manager: Mohamed Salah Eltonsy.",
};

/* ------------------------------------------------------------------ */
/*  Source data — JOZOUR Operating Agreement Amendment §1.5          */
/* ------------------------------------------------------------------ */

const THREE_TIER_PROTECTION = [
  {
    n: 1,
    title: "Company Indemnifies Manager",
    body: "Jozour, LLC shall indemnify the Manager (Mohamed Salah Eltonsy) against any and all claims, liabilities, losses, damages, costs, and expenses (including reasonable attorneys' fees) arising from or relating to the development and operation of the MITHQAL project, provided the Manager acted in good faith and within the scope of his authority.",
    icon: ShieldCheck,
  },
  {
    n: 2,
    title: "Manager Acts in Good Faith",
    body: "The indemnification is conditioned on the Manager's good-faith conduct. The Manager must act in what he reasonably believes to be the best interest of the Company and the MITHQAL project, with the care an ordinarily prudent person in a like position would exercise under similar circumstances.",
    icon: UserCheck,
  },
  {
    n: 3,
    title: "Exclusions Preserve Accountability",
    body: "The indemnification does not cover, and the Manager is not protected from, claims arising out of (i) gross negligence, (ii) willful misconduct, or (iii) fraud. The exclusions preserve personal accountability for serious misconduct and align the indemnification with standard fiduciary-duty doctrines under New Jersey LLC law.",
    icon: Scale,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function IndemnificationPage() {
  return (
    <>
      <h1 className="sr-only">
        Manager Indemnification Framework — Jozour, LLC §1.5
      </h1>
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
              JOZOUR Operating Agreement Amendment · §1.5
            </p>
            <h2 className="font-display mt-2 text-3xl text-foreground sm:text-4xl">
              Manager Indemnification Framework
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              Jozour, LLC — Indemnification of the Manager
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

          {/* Manager card */}
          <section className="mt-8">
            <Card className="border-gold/30 bg-gold/[0.03] p-0 shadow-none">
              <CardHeader className="border-b border-gold/20 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                    <UserCheck className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      Indemnified Party (the &quot;Manager&quot;)
                    </CardTitle>
                    <CardDescription className="text-xs text-fg-muted">
                      The Manager as defined in the JOZOUR, LLC Operating
                      Agreement, as amended July 31, 2026.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid gap-0 sm:grid-cols-3">
                  <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                      Name
                    </div>
                    <div className="mt-1 font-display text-sm font-semibold text-foreground">
                      Mohamed Salah Eltonsy
                    </div>
                  </div>
                  <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                      Role
                    </div>
                    <div className="mt-1 font-display text-sm font-semibold text-foreground">
                      Manager &amp; Sole Member
                    </div>
                    <div className="mt-0.5 text-xs text-fg-muted">
                      Jozour, LLC (NJ)
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                      Authority
                    </div>
                    <div className="mt-1 font-display text-sm font-semibold text-foreground">
                      MITHQAL Constitution v19.0
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* §1.5 verbatim blockquote */}
          <section className="mt-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="gold-rule h-px w-10" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                §1.5 · Indemnification of Manager
              </span>
            </div>
            <h3 className="font-display text-lg text-foreground">
              Verbatim provision
            </h3>
            <blockquote
              className="mt-4 border-l-2 border-gold/60 bg-ink-card/40 px-5 py-4 text-sm italic leading-relaxed text-fg-muted"
              cite="/legal/indemnification"
            >
              <p>
                The Company shall indemnify the Manager against any and all
                claims, liabilities, losses, damages, costs, and expenses
                (including reasonable attorneys&apos; fees) arising from or
                relating to the development and operation of the MITHQAL
                project, provided that the Manager acted in good faith and
                within the scope of his authority under the MITHQAL
                Constitution v19.0 and this Amendment. This indemnification
                shall not cover claims arising out of the Manager&apos;s gross
                negligence, willful misconduct, or fraud.
              </p>
              <footer className="mt-3 text-xs not-italic text-fg-muted">
                — JOZOUR, LLC Operating Agreement Amendment §1.5, dated
                July 31, 2026
              </footer>
            </blockquote>
          </section>

          {/* Indemnification scope card */}
          <section className="mt-10">
            <Card className="border-line bg-ink-card/60 p-0 shadow-none">
              <CardHeader className="border-b border-line px-6 py-4">
                <CardTitle className="text-base font-semibold text-foreground">
                  Indemnification scope
                </CardTitle>
                <CardDescription className="text-xs text-fg-muted">
                  The categories of claims, losses, and expenses the Company
                  indemnifies the Manager against, per §1.5.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="grid gap-0 sm:grid-cols-2">
                  {[
                    "Claims — any demand, allegation, or legal proceeding",
                    "Liabilities — any financial obligation or debt incurred",
                    "Losses — any diminution in value or capital",
                    "Damages — compensatory, consequential, or statutory",
                    "Costs — out-of-pocket expenditures related to defense",
                    "Reasonable attorneys' fees — counsel retained in good faith",
                  ].map((scope) => (
                    <li
                      key={scope}
                      className="border-b border-line p-4 text-xs leading-relaxed text-fg-muted last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0 sm:[&:nth-last-child(1)]:border-b-0"
                    >
                      {scope}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Three-tier protection card */}
          <section className="mt-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="gold-rule h-px w-10" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
                Three-Tier Protection
              </span>
            </div>
            <h3 className="font-display text-lg text-foreground">
              How the indemnification works in practice
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              The §1.5 indemnification is structured as three interlocking
              tiers: a broad indemnity (Tier 1) conditioned on the Manager&apos;s
              good-faith conduct (Tier 2), with personal accountability preserved
              for serious misconduct via the exclusions (Tier 3).
            </p>

            <div className="mt-6 space-y-4">
              {THREE_TIER_PROTECTION.map((tier) => (
                <Card
                  key={tier.n}
                  className="border-line bg-ink-card/60 p-0 shadow-none"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                        <tier.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono text-xs font-semibold text-gold">
                            Tier {tier.n}
                          </span>
                          <h4 className="font-display text-sm font-semibold text-foreground">
                            {tier.title}
                          </h4>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                          {tier.body}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Exclusions warning card */}
          <section className="mt-10">
            <div className="flex flex-col gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 sm:flex-row sm:items-start">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
              <div className="flex-1">
                <h3 className="font-display text-base font-semibold text-amber-200">
                  Carve-outs preserve accountability
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
                  The indemnification does <strong>not</strong> cover claims
                  arising out of (i) <strong>gross negligence</strong>,{" "}
                  (ii) <strong>willful misconduct</strong>, or (iii){" "}
                  <strong>fraud</strong>. These exclusions preserve the
                  Manager&apos;s personal accountability for serious misconduct
                  and align the indemnification with the standards expected
                  under New Jersey Limited Liability Company law.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-amber-200/80">
                  The carve-outs are not a defense for the Company to avoid its
                  indemnification obligation in good-faith cases — they are the
                  boundaries that keep the indemnification defensible.
                </p>
              </div>
            </div>
          </section>

          {/* Authority footer */}
          <section className="mt-10 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
            <strong>Authority:</strong> This page surfaces §1.5 of the JOZOUR,
            LLC Operating Agreement Amendment dated July 31, 2026, adopted under
            the authority of the MITHQAL Constitution v19.0. The Amendment and
            the underlying Constitution are available on request to institutional
            counterparts. The indemnification is in force from the Amendment
            date and remains in effect until modified by further written
            amendment adopted in accordance with the Company&apos;s Operating
            Agreement.
          </section>

          <div className="mt-8 flex flex-wrap gap-3 text-xs">
            <Link
              href="/legal/institutional-trust"
              className="inline-flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/5 px-3 py-1.5 font-medium text-gold transition hover:bg-gold/15"
            >
              §1.4 Institutional Trust
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

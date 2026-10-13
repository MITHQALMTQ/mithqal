"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  RotateCcw,
  Scale,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";

/**
 * Home page — MITHQAL MASTER BLUEPRINT §2.1.
 *
 * MITHQAL Assurance — Financial-Operations Assurance Platform.
 *
 * Per §2.1: "An independent financial-operations assurance platform that
 * helps institutions validate payment data, resolve operational exceptions,
 * and produce reproducible evidence across authorized systems."
 *
 * The intended role is to complement existing bank, payment, and
 * reconciliation systems — not replace them. The initial product does NOT:
 *   - Accept customer funds
 *   - Issue a financial instrument
 *   - Lend
 *   - Guarantee settlement
 *   - Act as a clearinghouse
 *   - Initiate payment execution
 *
 * MTQ Σ is research-only (§9.1). Production authorization: FALSE.
 * All demo metrics on this page are labelled "DEMO DATA — NOT CUSTOMER OR
 * MARKET PERFORMANCE" per §5.5.
 */

const DEMO_DATA_LABEL = "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE";

const CAPABILITIES: Array<{
  name: string;
  status: "Hypothesis" | "Future" | "Proposed" | "Candidate";
  icon: typeof FileCheck2;
  description: string;
}> = [
  {
    name: "Payment Operations Assurance",
    status: "Hypothesis",
    icon: FileCheck2,
    description: "Validate a specific record/message workflow against versioned rules.",
  },
  {
    name: "Exception Management",
    status: "Hypothesis",
    icon: ClipboardCheck,
    description: "Explain discrepancies and support controlled resolution.",
  },
  {
    name: "Cross-System Reconciliation",
    status: "Future",
    icon: Scale,
    description: "Reconcile authorised records from more than one source.",
  },
  {
    name: "Operational Replay",
    status: "Proposed",
    icon: RotateCcw,
    description:
      "Reconstruct the processing decision using retained inputs, rules, and configuration.",
  },
  {
    name: "Evidence Export",
    status: "Candidate",
    icon: ShieldCheck,
    description: "Provide customer-readable provenance and case evidence.",
  },
  {
    name: "Settlement Visibility",
    status: "Future",
    icon: Clock,
    description: "Display status received from authorised authoritative sources.",
  },
];

const SOURCE_EVENTS = [
  "RECORD_RECEIVED",
  "SOURCE_AUTHENTICATED",
  "VALIDATION_PASSED",
  "EXCEPTION_OPENED",
  "HUMAN_APPROVAL_RECORDED",
  "PROVIDER_ACKNOWLEDGEMENT_RECEIVED",
  "SETTLEMENT_CONFIRMATION_RECEIVED",
  "RECONCILIATION_COMPLETED",
  "EVIDENCE_CONFLICT_DETECTED",
  "DISPUTE_OPENED",
];

const TRUTH_STATES = ["VERIFIED", "HYPOTHESIS", "DECISION", "UNRESOLVED", "NOT AUTHORIZED"];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      {/* ─── Top nav ─── */}
      <nav
        className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-[#07090e]/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"
        aria-label="Primary"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-gold" aria-hidden="true" />
          <span className="font-display text-base font-bold tracking-tight text-white">
            MITHQAL Assurance
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition hover:bg-gold/20"
          >
            Enter Dashboard
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
            Financial-Operations Assurance Platform
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            MITHQAL Assurance
          </h1>

          <p className="max-w-3xl text-lg leading-relaxed text-gray-300 sm:text-xl">
            An independent financial-operations assurance platform that helps institutions{" "}
            <span className="text-white">validate payment data</span>,{" "}
            <span className="text-white">resolve operational exceptions</span>, and{" "}
            <span className="text-white">produce reproducible evidence</span> across authorized
            systems.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-[#07090e] transition hover:bg-gold/90"
            >
              Enter Dashboard
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5"
            >
              Explore capabilities
            </a>
          </div>

          {/* Honest state */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-rose-400">
                Production authorization
              </div>
              <div className="mt-1 font-display text-xl font-bold text-rose-400">FALSE</div>
              <div className="text-[10px] text-gray-500">Cover page · pre-pilot</div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-amber-400">MTQ Σ</div>
              <div className="mt-1 font-display text-xl font-bold text-amber-400">
                NOT AUTHORIZED
              </div>
              <div className="text-[10px] text-gray-500">Research-only · §9.1</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">
                Market validation
              </div>
              <div className="mt-1 font-display text-xl font-bold text-white">UNVALIDATED</div>
              <div className="text-[10px] text-gray-500">Buyer/workflow not yet identified</div>
            </div>
          </div>
        </motion.div>

        {/* ─── What MITHQAL Assurance is / is NOT ─── */}
        <section className="mt-20 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                What MITHQAL Assurance IS
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Validate payment records against versioned rules</li>
              <li>Explain discrepancies across multiple sources</li>
              <li>Reconstruct decisions with retained inputs and policy versions</li>
              <li>Export customer-readable provenance and case evidence</li>
              <li>Complement — not replace — existing bank, payment, and reconciliation systems</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="size-5 text-rose-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-400">
                What MITHQAL Assurance is NOT
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>A payment processor or settlement system</li>
              <li>A custodian of customer funds</li>
              <li>A clearinghouse or guarantor of settlement</li>
              <li>A substitute for a regulated institution&apos;s compliance controls</li>
              <li>A claim of legally binding settlement finality</li>
            </ul>
          </div>
        </section>

        {/* ─── Capabilities ─── */}
        <section id="capabilities" className="mt-20 scroll-mt-20">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Candidate Capabilities
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Per §2.1.1 — possible capabilities subject to validation. Truth states shown for each.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-gold/30"
              >
                <div className="mb-3 flex items-center gap-2">
                  <c.icon className="size-5 text-gold" aria-hidden="true" />
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-gray-400">
                    {c.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                <p className="mt-1 text-xs text-gray-400">{c.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Source-specific evidence events (§5.4) ─── */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Source-Specific Evidence Events
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Per §5.4 — 10 source-specific events replace the legacy F0–F7 finality labels.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {SOURCE_EVENTS.map((e) => (
              <div
                key={e}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-[10px] text-gray-300"
              >
                {e}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Critical rule (§5.4): a SETTLEMENT_CONFIRMATION_RECEIVED event means the system
            received a confirmation — it does NOT rename the case to &quot;final&quot; unless the
            relevant system rules, source authority, and legal analysis justify that wording.
          </p>
        </section>

        {/* ─── Truth-state vocabulary (§D.4) ─── */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Truth-State Vocabulary
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Per §D.4 — every material claim carries one of five states.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TRUTH_STATES.map((s) => (
              <span
                key={s}
                className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            A verified market statistic does not verify the commercial conclusion drawn from it.
            A valid hash does not prove source truth. A testnet deployment does not establish
            reserve backing or production readiness.
          </p>
        </section>

        {/* ─── DEMO DATA disclaimer ─── */}
        <section className="mt-20">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                  {DEMO_DATA_LABEL}
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  All sample figures, example screens, provider scores, and hypothetical
                  transaction records on this site are synthetic illustrations — not measured
                  results. They become authoritative only when calculated from actual authorised
                  records and documented definitions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="mt-16 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-base font-semibold text-[#07090e] transition hover:bg-gold/90"
          >
            Enter Dashboard
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-gray-600 sm:px-6 lg:px-8">
        <p>
          MITHQAL Assurance — Financial-Operations Assurance Platform. MTQ Σ is research-only
          (§9.1). Production authorization: FALSE.
        </p>
        <p className="mt-1">
          Controlled institutional document · Not a license · Not a legal opinion. © 2026 MITHQAL
        </p>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";
import ProgramStatus from "@/components/ProgramStatus";

/**
 * MITHQAL — Pilot Page (/pilot)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 *
 * Landscape-only background (no baked-in text) + Framer Motion text stagger
 * + WebGL water shader + page-specific content sections (pilot eligibility,
 * engagement pathway, pilot constraints).
 */

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const ELIGIBILITY = [
  { num: "01", icon: "🏦", title: "Regulated Institutions", desc: "Only regulated, supervised institutions may participate — non-regulated or unverified entities cannot engage in the pilot." },
  { num: "02", icon: "🌍", title: "Defined Jurisdictions", desc: "Pilot activity is limited to specific, named jurisdictions where legal and regulatory clarity has been confirmed." },
  { num: "03", icon: "🛣", title: "Limited Corridors", desc: "Pilot corridors are explicitly defined — geographies, currencies and counterparty pairs are tightly scoped before any execution." },
  { num: "04", icon: "🔍", title: "Evidence Requirements", desc: "Every pilot settlement must produce attributable, verifiable, auditable evidence — evidence is the gate, not an afterthought." },
];

const PATHWAY = [
  { num: "01", title: "Application", desc: "Institution submits a formal pilot enquiry through the institutional channel." },
  { num: "02", title: "Qualification", desc: "Regulatory, technical and operational qualification is reviewed against pilot criteria." },
  { num: "03", title: "Configuration", desc: "Participant, jurisdiction, corridor and evidence parameters are configured." },
  { num: "04", title: "Pilot Execution", desc: "Settlement activity is executed under live conditions within the configured scope." },
  { num: "05", title: "Evaluation", desc: "Evidence and outcomes are reviewed — expansion is gated by the evaluation result." },
];

const CONSTRAINTS = [
  { num: "01", title: "Limited Scope", desc: "Pilot is bounded by named participants, jurisdictions and corridors — no open-ended scope." },
  { num: "02", title: "Controlled Access", desc: "Engagement is by application and qualification only — no self-service or instant onboarding." },
  { num: "03", title: "Evidence-Gated Expansion — Pilot A operates with MTQ disabled (control-plane mode). Pilot B (MTQ mode) is gated behind separate extension gates requiring Pilot A evidence + G0 pass", desc: "Any expansion beyond the configured scope requires explicit evidence-based evaluation — no silent growth." },
];

/* ───────────────────────────────────────────────────────────────────────────
 * Phase 3 — Pilot Eligibility Checker
 *
 * Interactive 5-question form (radio-based). Each answer contributes a points
 * weight (0-20) and the aggregate score (0-100) gates three outcomes:
 *   ≥80  → Pilot Ready     (CTA enabled → /contact)
 *   50-79→ Exploring       (CTA enabled → /contact)
 *   <50  → Not Ready       (no CTA — focus on building evidence first)
 *
 * Page is already "use client" so useState is permitted inside this component.
 * ─────────────────────────────────────────────────────────────────────────── */

interface CheckerOption {
  label: string;
  value: string;
  points: number;
}
interface CheckerQuestion {
  id: string;
  label: string;
  options: CheckerOption[];
}

const CHECKER_QUESTIONS: CheckerQuestion[] = [
  {
    id: "institutionType",
    label: "Institution Type",
    options: [
      { label: "Regulated Bank", value: "bank", points: 20 },
      { label: "Payment Network", value: "network", points: 15 },
      { label: "Regulator", value: "regulator", points: 10 },
      { label: "Other", value: "other", points: 5 },
    ],
  },
  {
    id: "jurisdiction",
    label: "Jurisdiction",
    options: [
      { label: "Defined", value: "defined", points: 20 },
      { label: "Multiple", value: "multiple", points: 10 },
      { label: "Unknown", value: "unknown", points: 0 },
    ],
  },
  {
    id: "assetVolume",
    label: "Asset Volume",
    options: [
      { label: ">$100M", value: "100m+", points: 20 },
      { label: "$10M-$100M", value: "10-100m", points: 15 },
      { label: "<$10M", value: "10m-", points: 5 },
    ],
  },
  {
    id: "evidenceCapability",
    label: "Evidence Capability",
    options: [
      { label: "Full", value: "full", points: 20 },
      { label: "Partial", value: "partial", points: 10 },
      { label: "None", value: "none", points: 0 },
    ],
  },
  {
    id: "pilotReadiness",
    label: "Pilot Readiness",
    options: [
      { label: "Ready", value: "ready", points: 20 },
      { label: "Exploring", value: "exploring", points: 10 },
      { label: "Not Ready", value: "not-ready", points: 0 },
    ],
  },
];

const CHECKER_MAX_SCORE = 100; // 20 + 20 + 20 + 20 + 20

function EligibilityChecker() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const score = CHECKER_QUESTIONS.reduce((sum, q) => {
    const chosen = q.options.find((o) => o.value === answers[q.id]);
    return sum + (chosen?.points ?? 0);
  }, 0);

  const allAnswered = CHECKER_QUESTIONS.every((q) => answers[q.id]);

  // Tiered result message — only meaningful once every question is answered.
  let resultTitle = "Awaiting Responses";
  let resultMessage = "Answer all five questions to compute your pilot readiness score.";
  let resultAccent = "text-amber-400";
  let showCta = false;

  if (allAnswered) {
    if (score >= 80) {
      resultTitle = "Pilot Ready";
      resultMessage = "Contact the MITHQAL team to begin engagement.";
      resultAccent = "text-emerald-400";
      showCta = true;
    } else if (score >= 50) {
      resultTitle = "Exploring";
      resultMessage = "Review the architecture and evidence model.";
      resultAccent = "text-amber-400";
      showCta = true;
    } else {
      resultTitle = "Not Ready";
      resultMessage = "Focus on building evidence capability first.";
      resultAccent = "text-red-400";
      showCta = false;
    }
  }

  return (
    <section id="checker" className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5">
      <div className="text-center mb-20 scroll-reveal">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="w-px h-4 bg-amber-400" />
          <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">PILOT ELIGIBILITY CHECKER</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Are You <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Pilot Ready?</span></h2>
        <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-8">Answer five institutional questions to compute your pilot readiness score (0–100) and surface the next step for your institution.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {CHECKER_QUESTIONS.map((q, qi) => (
          <div key={q.id} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/20 transition-all duration-300">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-xs font-semibold text-amber-400 tracking-[0.1em]">{String(qi + 1).padStart(2, "0")}</span>
              <h3 className="text-lg font-semibold text-white">{q.label}</h3>
            </div>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={q.label}>
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`cursor-pointer select-none px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 ${selected ? "bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] border-amber-300 shadow-lg shadow-amber-500/20" : "border-amber-400/30 bg-black/30 text-white/80 hover:border-amber-400/60 hover:bg-amber-500/10"}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.value}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Score + result panel */}
        <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-400 tracking-[0.28em] uppercase">Pilot Readiness Score</span>
            <span className="text-2xl font-bold text-white tabular-nums">
              {score}
              <span className="text-base text-[#94a3b8]">/{CHECKER_MAX_SCORE}</span>
            </span>
          </div>

          {/* Gold gradient progress bar — animates width to score% */}
          <div className="h-4 rounded-full bg-black/40 overflow-hidden border border-amber-500/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200"
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Result message */}
          <div className="mt-6">
            <div className={`text-lg font-semibold ${resultAccent} mb-1`}>{resultTitle}</div>
            <div className="text-sm text-[#cbd5e1]">{resultMessage}</div>
          </div>

          {/* CTA — only visible when score >= 50 */}
          {showCta && (
            <div className="mt-6">
              <a
                href="/contact"
                className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300"
              >
                Contact the MITHQAL Team →
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function PilotPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — landscape-only image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-pilot-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl hero-scrim" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">INSTITUTIONAL PILOT</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Controlled</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Pilot</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Engagement.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            MITHQAL's pilot model is designed for limited participants, narrow jurisdictions, and defined corridors — proof under live settlement conditions before any expansion.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="#model" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore Pilot Model →</a>
            <a href="/roadmap" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Roadmap</a>
          </motion.div>
        </motion.div>
      {mounted && <WaterCanvas assetPath="/assets/mithqal-pilot-landscape.png" />}
        <FeatureGrid />
      </section>

      {/* CONTENT SECTIONS (below the fold) */}
      <div className="relative z-20 bg-[#07090e]">
        {/* Pilot Eligibility */}
        <section id="model" className="max-w-[1440px] mx-auto px-6 md:px-12 py-32">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">PILOT ELIGIBILITY</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Bounded by <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Design.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-8">Pilot engagement is bounded by institution, jurisdiction, corridor and evidence — scope is explicit, never open-ended.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ELIGIBILITY.map((item) => (
              <div key={item.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 stagger-card transition-all duration-300 card-lift">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{item.num}</div>
                    <h3 className="text-xl font-semibold text-white mb-4">{item.title}</h3>
                    <p className="text-base text-[#cbd5e1] leading-loose">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Engagement Pathway */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">ENGAGEMENT PATHWAY</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">From Application to <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Evaluation.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-8">Five stages take an institutional enquiry through qualification and configuration to pilot execution and evidence-gated evaluation.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {PATHWAY.map((step, i) => (
              <div key={step.num} className="flex items-center gap-4 md:gap-8">
                <div className="flex flex-col items-center gap-3 max-w-[160px]">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-400/50 bg-amber-500/5 flex items-center justify-center text-amber-400 font-semibold text-sm">{step.num}</div>
                  <span className="text-sm text-white font-semibold">{step.title}</span>
                  <span className="text-xs text-[#94a3b8] text-center leading-relaxed">{step.desc}</span>
                </div>
                {i < PATHWAY.length - 1 && <span className="text-amber-400/70 text-2xl">→</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Pilot Constraints */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">PILOT CONSTRAINTS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Discipline at Every <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Stage.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-8">Pilot constraints ensure scope, access and expansion remain explicitly controlled throughout the engagement lifecycle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CONSTRAINTS.map((item) => (
              <div key={item.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 stagger-card transition-all duration-300 card-lift">
                <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{item.num}</div>
                <h3 className="text-lg font-semibold text-white mb-4">{item.title}</h3>
                <p className="text-base text-[#cbd5e1] leading-loose">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pilot Eligibility Checker (Phase 3 interactive) */}
        <EligibilityChecker />

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Start the <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Conversation.</span></h2>
          <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mb-10">For institutional pilot enquiry, connect with the MITHQAL team through the appropriate channel.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/contact" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Start the Conversation →</a>
            <a href="/architecture" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Architecture</a>
          </div>
        </section>
      </div>
      
      <ProgramStatus data={{"title": "PILOT-A READINESS","badge": "18/18 CONDITIONS BLOCKING","badgeColor": "red","metrics": [{"label": "Conditions Precedent","value": "18/18","status": "blocked"},{"label": "Banks Contacted","value": "0","status": "blocked"},{"label": "Workshops","value": "0","status": "blocked"},{"label": "Counsel Engaged","value": "0","status": "blocked"}],"blockers": ["B-LEGAL: G0_CONDITIONAL + G1 BLOCKED (0 counsel, 50 questions)","B-REGULATORY: 0/8 jurisdictions triaged, 0 filed","B-BANK: 0 banks contacted, 0 workshops conducted","B-DATA: 0 bank baseline data, 0 NDA, 0 DPA","ALL 15 KPI baselines UNKNOWN","Term sheet status: BLOCKED_BY_WORKSHOP"],"note": "Pilot ID: PILOT-A-001. Corridor: C-AE-SG (NOT bank-confirmed). Settlement: PROPOSED (BANK_MONEY, MTQ disabled, SIMULATED). All conditions must be resolved before pilot execution."}} />
      <Footer />
    </main>
  );
}

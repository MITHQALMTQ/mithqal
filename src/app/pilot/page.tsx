"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";

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
  { num: "03", title: "Evidence-Gated Expansion", desc: "Any expansion beyond the configured scope requires explicit evidence-based evaluation — no silent growth." },
];

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
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
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
        <section id="model" className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">PILOT ELIGIBILITY</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Bounded by <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Design.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-6">Pilot engagement is bounded by institution, jurisdiction, corridor and evidence — scope is explicit, never open-ended.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ELIGIBILITY.map((item) => (
              <div key={item.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300 card-lift">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{item.num}</div>
                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-sm text-[#cbd5e1] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Engagement Pathway */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">ENGAGEMENT PATHWAY</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">From Application to <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Evaluation.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-6">Five stages take an institutional enquiry through qualification and configuration to pilot execution and evidence-gated evaluation.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {PATHWAY.map((step, i) => (
              <div key={step.num} className="flex items-center gap-4 md:gap-6">
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
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">PILOT CONSTRAINTS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Discipline at Every <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Stage.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-6">Pilot constraints ensure scope, access and expansion remain explicitly controlled throughout the engagement lifecycle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONSTRAINTS.map((item) => (
              <div key={item.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300 card-lift">
                <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{item.num}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-[#cbd5e1] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Start the <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Conversation.</span></h2>
          <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mb-10">For institutional pilot enquiry, connect with the MITHQAL team through the appropriate channel.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/contact" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Start the Conversation →</a>
            <a href="/architecture" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Architecture</a>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";
import ProgramStatus from "@/components/ProgramStatus";

/**
 * MITHQAL — Roadmap Page (/roadmap)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 */

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } };
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const TIMELINE = [
  { num: "01", title: "Foundation", desc: "Core architecture, security, control framework and evidence model.", icon: "🏗" },
  { num: "02", title: "Pilots", desc: "Limited participants, narrow jurisdictions and defined corridors.", icon: "🚀" },
  { num: "03", title: "Expansion", desc: "Additional rails, broader interoperability and routing.", icon: "📈" },
  { num: "04", title: "Scale", desc: "Operational maturity across multiple institutions and jurisdictions.", icon: "⚖" },
  { num: "05", title: "Global Readiness", desc: "Neutral wholesale settlement available to authorized institutions.", icon: "🌍" },
];

const PILLARS = ["Security", "Compliance", "Interoperability", "Auditability", "Neutrality"];
const ARCH_GROUPS = [
  { label: "Participants", items: ["Regulated institutions", "Bank sponsors", "Auditors"] },
  { label: "Rails", items: ["Multi-rail routing", "Fallback corridors", "Settlement gateways"] },
  { label: "Settlement", items: ["Three-book separation", "Finality controls", "Reconciliation"] },
];

export default function RoadmapPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-roadmap-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl hero-scrim" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">THE MITHQAL ROADMAP</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">A</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Structured</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Path</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">to</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Institutional Evolution.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            MITHQAL&apos;s roadmap outlines a phased approach to building neutral wholesale settlement infrastructure — from foundation through controlled expansion.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="#timeline" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Read the Roadmap →</a>
            <a href="/features" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Features</a>
          </motion.div>
        </motion.div>
      {mounted && <WaterCanvas assetPath="/assets/mithqal-roadmap-landscape.png" />}
        <FeatureGrid />
      </section>

      {/* CONTENT SECTIONS */}
      <div className="relative z-20 bg-[#07090e]">
        {/* 5-Step Timeline */}
        <section id="timeline" className="max-w-[1440px] mx-auto px-6 md:px-12 py-32">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">FIVE PHASES</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Foundation to <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Global Readiness.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-8">MITHQAL advances through five sequential phases — each gated by the evidence and approvals required for the next.</p>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-amber-400/10 via-amber-400/40 to-amber-400/10" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
              {TIMELINE.map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-amber-400 bg-[#07090e] flex items-center justify-center text-3xl mb-6 relative z-10">{step.icon}</div>
                  <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">STEP {step.num}</div>
                  <h3 className="text-lg font-semibold text-white mb-4">{step.title}</h3>
                  <p className="text-base text-[#cbd5e1] leading-loose">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Architecture */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">PLATFORM ARCHITECTURE</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Built for What&apos;s <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Next.</span></h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: arch groups */}
            <div className="space-y-8">
              {ARCH_GROUPS.map((g) => (
                <div key={g.label}>
                  <div className="text-xs font-semibold text-amber-400 tracking-[0.2em] uppercase mb-3">{g.label}</div>
                  {g.items.map((it) => (
                    <div key={it} className="text-white/85 text-sm py-1">• {it}</div>
                  ))}
                </div>
              ))}
            </div>
            {/* Center: isometric visual */}
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 320 280" width="100%" aria-hidden="true">
                <polygon points="160,28 70,72 160,116 250,72" fill="rgba(212,175,55,0.08)" stroke="#D4AF37" strokeWidth="1" />
                <polygon points="160,28 70,72 70,92 160,136 250,92 250,72" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.6)" strokeWidth="1" />
                <polygon points="160,96 56,148 160,200 264,148" fill="rgba(212,175,55,0.06)" stroke="#D4AF37" strokeWidth="1" />
                <polygon points="160,96 56,148 56,172 160,224 264,172 264,148" fill="rgba(212,175,55,0.03)" stroke="rgba(212,175,55,0.5)" strokeWidth="1" />
                <polygon points="160,168 44,226 160,284 276,226" fill="rgba(212,175,55,0.05)" stroke="#D4AF37" strokeWidth="1" />
              </svg>
            </div>
            {/* Right: pillars */}
            <div className="border border-amber-500/14 rounded-2xl p-8 bg-amber-500/5">
              <div className="text-sm font-semibold text-white tracking-[0.18em] uppercase mb-6 pb-4 border-b border-white/10">Foundational Pillars</div>
              {PILLARS.map((p) => (
                <div key={p} className="flex items-center gap-4 py-3 text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">A <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Stronger Future.</span></h2>
          <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mb-10">MITHQAL&apos;s evolution is governed by evidence, controlled progression and institutional validation — not by shortcuts.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/ecosystem" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore Ecosystem →</a>
            <a href="/about" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">About MITHQAL</a>
          </div>
        </section>
      </div>
      
      <ProgramStatus data={{"title": "GATE STATUS — G0 / G1","badge": "G0_FAIL — 16 UNRESOLVED ISSUES","badgeColor": "red","metrics": [{"label": "G0 Status","value": "FAIL","status": "blocked"},{"label": "Unresolved Issues","value": "16","status": "blocked"},{"label": "Primary Docs Missing","value": "4","status": "blocked"},{"label": "Legal Questions","value": "50","status": "blocked"}],"blockers": ["JOZOUR_LLC_NJ — PRIMARY_DOCUMENT_MISSING","Operating Agreement — PRIMARY_DOCUMENT_MISSING","Articles of Incorporation — PRIMARY_DOCUMENT_MISSING","No board resolution — authority matrix PENDING","No shareholder agreement — ownership UNKNOWN"],"note": "G0 must pass before G1 counsel engagement. G1 must pass before Pilot A. All gates are sequential and evidence-based."}} />
      <Footer />
    </main>
  );
}

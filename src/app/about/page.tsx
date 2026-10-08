"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";
import ProgramStatus from "@/components/ProgramStatus";

/**
 * MITHQAL — About Page (/about)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 */

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } };
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const VALUES = [
  { title: "Neutrality", desc: "Non-sovereign, non-speculative infrastructure.", icon: "⚖" },
  { title: "Institutional Focus", desc: "Built for institutions, not retail speculation.", icon: "🏛" },
  { title: "Security & Control", desc: "Cryptographic auditability on every state.", icon: "🔒" },
  { title: "Interoperability", desc: "Complements existing financial infrastructure.", icon: "🔗" },
  { title: "Transparency", desc: "Every settlement state is attributable.", icon: "👁" },
  { title: "Human Oversight", desc: "Operators retain all decision authority.", icon: "👥" },
];

const PRINCIPLES = [
  { title: "Integrity", desc: "Every state leaves attributable evidence.", icon: "🛡" },
  { title: "Resilience", desc: "Controlled through failure and recovery.", icon: "⚡" },
  { title: "Collaboration", desc: "Institutional participants, connected.", icon: "🤝" },
  { title: "Impact", desc: "A more connected financial future.", icon: "🎯" },
];

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-about-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">ABOUT MITHQAL</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">A</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Neutral</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Infrastructure</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">for</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">a</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">More Connected Financial Future.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            MITHQAL is a neutral wholesale settlement control plane — built to coordinate institutional participants, settlement workflows, policy, interoperability, reconciliation and evidence through one controlled architecture.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="/features" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore the Architecture →</a>
            <a href="/ecosystem" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Ecosystem</a>
          </motion.div>
        </motion.div>
      {mounted && <WaterCanvas assetPath="/assets/mithqal-about-landscape.png" />}
        <FeatureGrid />
      </section>

      {/* CONTENT SECTIONS */}
      <div className="relative z-20 bg-[#07090e]">
        {/* Mission / Vision */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">OUR MISSION</span></div>
              <h2 className="text-4xl font-bold tracking-tight text-white mb-6">Enable Institutional Settlement at <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Scale.</span></h2>
              <p className="text-lg text-[#cbd5e1] leading-relaxed">MITHQAL coordinates settlement workflows, policy, finality, reconciliation, multi-rail interoperability and audit-ready evidence through one controlled architecture — complementing existing financial infrastructure.</p>
            </div>
            <div>
              <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">OUR VISION</span></div>
              <h2 className="text-4xl font-bold tracking-tight text-white mb-6">A More Connected <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Financial Ecosystem.</span></h2>
              <p className="text-lg text-[#cbd5e1] leading-relaxed">A neutral infrastructure that connects institutional participants across jurisdictions — without displacing sovereign currencies, central-bank money, or existing financial institutions.</p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">OUR VALUES</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">What MITHQAL <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Stands For.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 stagger-card transition-all duration-300 card-lift">
                <div className="w-14 h-14 rounded-full border border-amber-500/60 flex items-center justify-center text-2xl mb-4">{v.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{v.title}</h3>
                <p className="text-base text-[#cbd5e1] leading-loose">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Principles */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">OUR PRINCIPLES</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Built on <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Principle.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="text-center p-8">
                <div className="text-4xl mb-6 icon-scale">{p.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-4">{p.title}</h3>
                <p className="text-base text-[#cbd5e1] leading-loose">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">A Controlled Path to a <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Connected Financial Future.</span></h2>
          <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mb-10">MITHQAL is not production-authorized. The build is frozen, the MTQ primitive is disabled, and every architectural commitment is documented for institutional review.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/ecosystem" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore the Ecosystem →</a>
            <a href="/roadmap" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Roadmap</a>
          </div>
        </section>
      </div>
      
      <ProgramStatus data={{
  "title": "MITHQAL PROGRAM STATUS",
  "badge": "RELEASE_BLOCKED — NOT PRODUCTION-AUTHORIZED",
  "badgeColor": "red",
  "metrics": [
    {
      "label": "Program Integrity",
      "value": "RECOVERED",
      "status": "conditional"
    },
    {
      "label": "Providers Verified",
      "value": "1/5",
      "status": "blocked"
    },
    {
      "label": "Production Authorized",
      "value": "FALSE",
      "status": "blocked"
    },
    {
      "label": "Institutionally Validated",
      "value": "FALSE",
      "status": "blocked"
    }
  ],
  "blockers": [
    "GitHub: VERIFIED (only provider working)",
    "Vercel: UNVERIFIABLE",
    "Inngest: BLOCKED",
    "Turso: BLOCKED",
    "Neon: BLOCKED",
    "5 credentials require operator rotation (AI cannot rotate)"
  ],
  "note": "MITHQAL is designed, not deployed. The build is frozen, the MTQ primitive is disabled, and every architectural commitment is documented for institutional review. The program is at the G0 gate — entity verification is the first external evidence required."
}} />
      <Footer />
    </main>
  );
}

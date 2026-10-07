"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";

/**
 * MITHQAL — Features Page (/features)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 *
 * Landscape-only background (no baked-in text) + Framer Motion text stagger
 * + WebGL water shader + page-specific content sections (capabilities + workflow).
 */

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const CAPABILITIES = [
  { num: "01", title: "Settlement Orchestration", desc: "Coordinate institutional workflows from instruction through completion.", icon: "⚙" },
  { num: "02", title: "Policy & Authorization", desc: "Institutional policies, risk controls and authorization layers.", icon: "🛡" },
  { num: "03", title: "Multi-Rail Interoperability", desc: "Complements existing financial messaging and payment infrastructure.", icon: "🔗" },
  { num: "04", title: "Reconciliation & Separation", desc: "Three-book architecture ensuring economic separation.", icon: "📊" },
  { num: "05", title: "Evidence & Continuity", desc: "Immutable evidence, controlled backing and recovery.", icon: "🔍" },
];

const WORKFLOW = ["Request", "Validate", "Authorize", "Finality", "Settle", "Reconcile", "Evidence"];

export default function FeaturesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — landscape-only image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-features-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">MITHQAL FEATURES</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">The</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Control</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Plane</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Behind</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Institutional Settlement.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            MITHQAL brings settlement orchestration, policy control, finality, reconciliation, multi-rail interoperability and audit-ready evidence into one coordinated institutional control plane.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="#capabilities" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore Capabilities →</a>
            <a href="/ecosystem" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Ecosystem</a>
          </motion.div>
        </motion.div>
      </section>

      {mounted && <WaterCanvas assetPath="/assets/mithqal-features-landscape.png" />}
      <FeatureGrid />

      {/* CONTENT SECTIONS (below the fold) */}
      <div className="relative z-20 bg-[#07090e]">
        {/* Core Capabilities */}
        <section id="capabilities" className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">CORE CAPABILITIES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Built as One <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Control System.</span></h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">Each capability operates as part of one coordinated institutional architecture rather than as an isolated product feature.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {CAPABILITIES.map((cap) => (
              <div key={cap.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
                <div className="text-3xl mb-4">{cap.icon}</div>
                <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{cap.num}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{cap.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Orchestration Workflow */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">ORCHESTRATION WORKFLOW</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">From Instruction to <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Finality.</span></h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {WORKFLOW.map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-400/50 bg-amber-500/5 flex items-center justify-center text-amber-400 font-semibold text-sm">{i + 1}</div>
                  <span className="text-sm text-white/70 font-medium">{step}</span>
                </div>
                {i < WORKFLOW.length - 1 && <span className="text-amber-400/40 text-2xl">→</span>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">See the Architecture Behind the <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Control Plane.</span></h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">Explore how MITHQAL coordinates institutional participants, settlement workflows, policy, interoperability, reconciliation and evidence through one controlled architecture.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/ecosystem" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore the Ecosystem →</a>
            <a href="/roadmap" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">Read the Roadmap</a>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

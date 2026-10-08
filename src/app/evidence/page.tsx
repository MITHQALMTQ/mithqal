"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";

/**
 * MITHQAL — Evidence Page (/evidence)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 *
 * Landscape-only background (no baked-in text) + Framer Motion text stagger
 * + WebGL water shader + page-specific content sections (six evidence layers,
 * evidence formula, assurance gates).
 */

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const EVIDENCE_LAYERS = [
  { num: "01", icon: "🪪", title: "Identity", desc: "Every participant's identity is attested, verifiable and bound to the settlement state — no anonymous settlement." },
  { num: "02", icon: "📜", title: "Provenance", desc: "Origin of every position, obligation and asset is attributable across the full lifecycle — provenance is preserved." },
  { num: "03", icon: "⚖", title: "Eligibility", desc: "Eligibility to hold, transfer, encumber or settle is verified at each gate — ineligible states cannot execute." },
  { num: "04", icon: "🔒", title: "Encumbrance", desc: "Existing encumbrances are tracked precisely — no backing is double-counted or silently released." },
  { num: "05", icon: "✅", title: "Availability", desc: "Available backing is computed as recognized minus encumbered minus allocated — only true availability is spendable." },
  { num: "06", icon: "🔏", title: "Attestation", desc: "Settlement states are cryptographically attested and auditable — every state carries a verifiable signature." },
];

const GATES = [
  { num: "01", title: "Pre-Execution Gate", desc: "Identity, eligibility, encumbrance and policy checks must pass before any settlement instruction is admitted." },
  { num: "02", title: "Execution Gate", desc: "Finality conditions, authorization and reconciliation are confirmed at execution — no silent or partial settlement." },
  { num: "03", title: "Post-Execution Gate", desc: "After settlement, evidence is recorded, attributable and reconciled against the canonical state — closed-loop." },
  { num: "04", title: "Audit Gate", desc: "Every state is independently auditable — evidence can be re-verified without reusing backing claims across assertions." },
];

export default function EvidencePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — landscape-only image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-evidence-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">EVIDENCE & ASSURANCE</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Every</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">State</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Leaves</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Evidence.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            MITHQAL treats evidence as a control layer — every settlement state is attributable, verifiable, and auditable. Evidence must not be reused across multiple backing claims.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="#layers" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore Evidence Layers →</a>
            <a href="/architecture" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View Architecture</a>
          </motion.div>
        </motion.div>
      {mounted && <WaterCanvas assetPath="/assets/mithqal-evidence-landscape.png" />}
        <FeatureGrid />
      </section>

      {/* CONTENT SECTIONS (below the fold) */}
      <div className="relative z-20 bg-[#07090e]">
        {/* Six Evidence Layers */}
        <section id="layers" className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">SIX EVIDENCE LAYERS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Evidence as a <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Control Layer.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-6">Six independent evidence layers ensure every settlement state is attributable, verifiable and auditable — never reused across multiple backing claims.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EVIDENCE_LAYERS.map((layer) => (
              <div key={layer.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300 card-lift">
                <div className="text-3xl mb-4 icon-scale">{layer.icon}</div>
                <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{layer.num}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{layer.title}</h3>
                <p className="text-sm text-[#cbd5e1] leading-relaxed">{layer.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Evidence Formula — enhanced with animated Reserve Backing Visualization */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">EVIDENCE FORMULA</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Only True <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Availability.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-6">Available backing is not assumed — it is computed. Recognized, minus encumbered, minus allocated, equals only what is truly available to spend.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Formula — prominent display */}
            <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-10 md:p-14 text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-xl md:text-3xl font-semibold text-white/80">
                <span>Recognized</span>
                <span className="text-amber-400">−</span>
                <span>Encumbered</span>
                <span className="text-amber-400">−</span>
                <span>Allocated</span>
                <span className="text-amber-400">=</span>
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Available Backing</span>
              </div>
            </div>

            {/* Reserve Backing Visualization — animated horizontal bars */}
            <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-px h-4 bg-amber-400" />
                <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">RESERVE BACKING VISUALIZATION</span>
              </div>

              <div className="space-y-6">
                {/* Recognized — 100% width, gold */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-white">Recognized</span>
                    <span className="text-sm text-amber-400 font-semibold tabular-nums">$130M</span>
                  </div>
                  <div className="h-8 rounded-full bg-black/40 overflow-hidden border border-amber-500/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Encumbered — 35% width, red-500 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-white">Encumbered</span>
                    <span className="text-sm text-red-400 font-semibold tabular-nums">$45.5M</span>
                  </div>
                  <div className="h-8 rounded-full bg-black/40 overflow-hidden border border-amber-500/10">
                    <motion.div
                      className="h-full rounded-full bg-red-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: "35%" }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                </div>

                {/* Allocated — 20% width, amber-500 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-white">Allocated</span>
                    <span className="text-sm text-amber-500 font-semibold tabular-nums">$26M</span>
                  </div>
                  <div className="h-8 rounded-full bg-black/40 overflow-hidden border border-amber-500/10">
                    <motion.div
                      className="h-full rounded-full bg-amber-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: "20%" }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    />
                  </div>
                </div>

                {/* Available Backing — 45% width, emerald-400 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-white">Available Backing</span>
                    <span className="text-sm text-emerald-400 font-semibold tabular-nums">$58.5M</span>
                  </div>
                  <div className="h-8 rounded-full bg-black/40 overflow-hidden border border-amber-500/10">
                    <motion.div
                      className="h-full rounded-full bg-emerald-400"
                      initial={{ width: 0 }}
                      whileInView={{ width: "45%" }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
                    />
                  </div>
                </div>
              </div>

              {/* Reuse prohibition note */}
              <p className="text-sm text-[#94a3b8] italic mt-8 text-center border-t border-white/5 pt-6">
                Evidence must not be reused across multiple backing claims.
              </p>
            </div>
          </div>
        </section>

        {/* Assurance Gates */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">ASSURANCE GATES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Closed-Loop <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Assurance.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-6">Four assurance gates close the loop — from instruction through execution to audit — leaving no state unaccounted for.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GATES.map((gate) => (
              <div key={gate.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300 card-lift">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/50 bg-amber-500/5 flex items-center justify-center text-amber-400 font-semibold text-sm mb-6">{gate.num}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{gate.title}</h3>
                <p className="text-sm text-[#cbd5e1] leading-relaxed">{gate.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Read the <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Architecture.</span></h2>
          <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mb-10">Explore how layered separation — participants, control plane, rails, and evidence — makes every settlement state attributable and auditable.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/architecture" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Read the Architecture →</a>
            <a href="/pilot" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View Pilot Model</a>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

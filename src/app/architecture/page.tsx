"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";

/**
 * MITHQAL — Architecture Page (/architecture)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 *
 * Landscape-only background (no baked-in text) + Framer Motion text stagger
 * + WebGL water shader + page-specific content sections (four-layer architecture,
 * three-book separation, finality control).
 */

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const LAYERS = [
  { num: "01", icon: "🏦", title: "Participants Layer", desc: "Regulated institutions operate within their own ledger positions — each participant's identity, eligibility and authority are controlled and attributable." },
  { num: "02", icon: "⚙", title: "Control Plane", desc: "MITHQAL orchestrates policy, authorization, finality gates and workflow coordination across all participants in a single institutional plane." },
  { num: "03", icon: "🔗", title: "Settlement Rails", desc: "Multi-rail interoperability complements existing financial messaging and payment infrastructure — never replacing, only coordinating." },
  { num: "04", icon: "🔍", title: "Evidence Layer", desc: "Every settlement state leaves attributable, verifiable, auditable evidence — evidence is a control layer, not a log." },
];

const BOOKS = [
  { book: "A", title: "MITHQAL Corporate", desc: "MITHQAL's own institutional ledger — corporate obligations, treasury positions and operational accounts at the operator level." },
  { book: "B", title: "Bank MTQ Obligations", desc: "Bank-side ledger of MTQ obligations — issued, redeemed, encumbered and reconciled positions held by participating institutions." },
  { book: "C", title: "Participant Position", desc: "Per-participant ledger of holdings, eligibility, encumbrance and availability — the customer-facing position record." },
];

const FINALITY = [
  { num: "01", title: "Technical Finality", desc: "Irreversible settlement state at the protocol level — once written, the state cannot be replayed, reverted or duplicated." },
  { num: "02", title: "Legal / Institutional Finality", desc: "Finality recognized under applicable legal frameworks — the settlement state carries institutional and jurisdictional weight." },
  { num: "03", title: "Required Control Conditions", desc: "Eligibility, encumbrance, authorization and policy conditions must be satisfied before any settlement can become final." },
  { num: "04", title: "Execution Eligibility", desc: "Only positions that pass every evidence gate and policy check are eligible for execution — no silent settlement, no shortcuts." },
];

export default function ArchitecturePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — landscape-only image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-architecture-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">INSTITUTIONAL ARCHITECTURE</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">The</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Architecture</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Behind</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Institutional</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Settlement.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            MITHQAL's architecture is built on layered separation — participants, control plane, rails, and evidence — each layer auditable, reconcilable, and controlled.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="#layers" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore the Architecture →</a>
            <a href="/evidence" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View Evidence Layer</a>
          </motion.div>
        </motion.div>
      </section>

      {mounted && <WaterCanvas assetPath="/assets/mithqal-architecture-landscape.png" />}
      <FeatureGrid />

      {/* CONTENT SECTIONS (below the fold) */}
      <div className="relative z-20 bg-[#07090e]">
        {/* Four-Layer Architecture */}
        <section id="layers" className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">FOUR-LAYER ARCHITECTURE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Layered <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Separation.</span></h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">Each layer operates independently yet remains auditable, reconcilable and controlled as part of one institutional architecture.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LAYERS.map((layer) => (
              <div key={layer.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{layer.icon}</div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{layer.num}</div>
                    <h3 className="text-xl font-semibold text-white mb-3">{layer.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Three-Book Separation */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">THREE-BOOK SEPARATION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Economic <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Separation.</span></h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">Three independent ledgers ensure MITHQAL's obligations, bank obligations, and participant positions remain economically separate and individually auditable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BOOKS.map((book) => (
              <div key={book.book} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/50 bg-amber-500/5 flex items-center justify-center text-amber-400 font-semibold text-lg mb-6">Book {book.book}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{book.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{book.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Finality Control */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">FINALITY CONTROL</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Finality by <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Design.</span></h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">Finality is not a single event — it is a layered chain of technical, legal and control conditions that must all be satisfied.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FINALITY.map((item) => (
              <div key={item.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
                <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{item.num}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Explore the Full <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Architecture.</span></h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">Read how the evidence layer turns every settlement state into attributable, verifiable, auditable control.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/evidence" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore the full architecture →</a>
            <a href="/pilot" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View Pilot Model</a>
          </div>
        </section>
      </div>
    </main>
  );
}

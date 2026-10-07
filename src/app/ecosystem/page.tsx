"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";

/**
 * MITHQAL — Ecosystem Page (/ecosystem)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 */

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } };
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const PARTNERS = [
  { num: "01", title: "Banks", desc: "Regulated commercial banks providing the primary institutional connection.", icon: "🏦" },
  { num: "02", title: "Payment Networks", desc: "Coordinated approved settlement paths across existing infrastructure.", icon: "🌍" },
  { num: "03", title: "Authorized Institutions", desc: "Jurisdiction-controlled participation with applicable legal basis.", icon: "🏛" },
  { num: "04", title: "Technology Partners", desc: "Connectivity, security, identity and infrastructure components.", icon: "⚙" },
  { num: "05", title: "Regulators", desc: "Jurisdiction-specific policy and supervisory observability.", icon: "🛡" },
];

const RAILS = ["SWIFT / ISO 20022", "Domestic Payment Rails", "RTGS", "Bank APIs", "Tokenised Bank Money", "Approved Digital-Asset Rails"];
const ROUTES = [
  { name: "Primary Rail", desc: "The default approved settlement path under normal operating conditions.", icon: "🎯" },
  { name: "Secondary Rail", desc: "An alternate approved path used when the primary is unavailable.", icon: "🔄" },
  { name: "Emergency Rail", desc: "A restricted path used only under defined emergency conditions.", icon: "⚡" },
];

export default function EcosystemPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-ecosystem-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">THE MITHQAL ECOSYSTEM</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Institutional</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Participants.</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Connected</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Through</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">MITHQAL.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            MITHQAL connects participating institutions, banking infrastructure, payment networks and approved settlement rails through one coordinated institutional control plane.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="#partners" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore Participants →</a>
            <a href="/features" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View Architecture</a>
          </motion.div>
        </motion.div>
      {mounted && <WaterCanvas assetPath="/assets/mithqal-ecosystem-landscape.png" />}
        <FeatureGrid />
      </section>

      {/* CONTENT SECTIONS */}
      <div className="relative z-20 bg-[#07090e]">
        {/* Ecosystem Partners */}
        <section id="partners" className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">THE ECOSYSTEM LAYER</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Trusted Partners. Unified <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Infrastructure.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {PARTNERS.map((p) => (
              <div key={p.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300 text-center">
                <div className="text-4xl mb-4">{p.icon}</div>
                <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{p.num}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{p.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Multi-Rail Connectivity */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">MULTI-RAIL CONNECTIVITY</span></div>
              <h2 className="text-4xl font-bold tracking-tight text-white mb-6">One Control Plane. Many Institutional <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Rails.</span></h2>
              <p className="text-lg text-white/60 mb-8">MITHQAL complements existing financial messaging and payment infrastructure — coordinating approved settlement rails through one controlled institutional layer.</p>
              <a href="#routing" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View Rail Details →</a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {RAILS.map((rail) => (
                <div key={rail} className="bg-white/5 border border-amber-500/10 rounded-xl p-6 hover:border-amber-500/30 transition-all duration-300">
                  <div className="text-sm font-semibold text-white">{rail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Controlled Routing */}
        <section id="routing" className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4"><span className="w-px h-4 bg-amber-400" /><span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">CONTROLLED ROUTING</span></div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Primary. Secondary. <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Emergency.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ROUTES.map((r) => (
              <div key={r.name} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
                <div className="text-4xl mb-4">{r.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{r.name}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">A Growing Ecosystem. A <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Stronger Future.</span></h2>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <a href="/features" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore the Architecture →</a>
            <a href="/roadmap" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Roadmap</a>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

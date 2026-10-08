"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";

/**
 * MITHQAL — Legal Page (/legal)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 *
 * Landscape-only background (no baked-in text) + Framer Motion text stagger
 * + WebGL water shader + page-specific content sections (legal framework,
 * disclosures, terms & privacy).
 *
 * NOTE: /legal subroutes (terms, privacy, cookies, risk-disclosure) already
 * exist. This is the index /legal landing page itself.
 */

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const FRAMEWORK = [
  { num: "01", icon: "🏛", title: "Jurisdictional Discipline", desc: "MITHQAL operates within applicable legal frameworks — one architecture, different regulatory perimeters, never one-size-fits-all." },
  { num: "02", icon: "🌐", title: "Regulatory Perimeters", desc: "Each perimeter is explicitly mapped — what applies where, to whom, and under what authority — no implicit or assumed scope." },
  { num: "03", icon: "🛡", title: "Sanctions Screening", desc: "Counterparties, jurisdictions and assets are screened against applicable sanctions lists — unknown means blocked, no exceptions." },
  { num: "04", icon: "⚙", title: "Compliance Gates", desc: "Compliance is enforced as a gate at every layer — pre-execution, execution, post-execution and audit — not as an afterthought." },
];

const DISCLOSURES = [
  { title: "Production Status", desc: "MITHQAL is not production-authorized. All architecture, capabilities and workflows described are design or development-stage only." },
  { title: "MTQ Status", desc: "MTQ is disabled. No MTQ issuance, redemption or settlement is live. Any reference to MTQ activity is conceptual or pilot-stage only." },
  { title: "Build Mode", desc: "MITHQAL operates in build mode. Architecture, evidence and policy layers are being constructed and validated — not yet active in production." },
  { title: "Institutional Validation", desc: "Institutional validation is pending. No institution, jurisdiction or corridor has been confirmed for production engagement at this stage." },
];

const TERMS = [
  "MITHQAL is in build mode and is not production-authorized — no activity described here constitutes an offer, commitment or binding obligation.",
  "All architecture, capabilities, workflows and pilot parameters are design-stage and subject to change without notice.",
  "MTQ is disabled. Any reference to MTQ issuance, redemption or settlement is conceptual or pilot-stage only and does not represent live activity.",
  "No content on this site constitutes legal, regulatory, financial or investment advice — consult qualified counsel before any institutional engagement.",
  "By accessing MITHQAL materials you acknowledge the build-mode status and the absence of any production authorization.",
];

const PRIVACY = [
  "MITHQAL collects only the information necessary to respond to institutional enquiries — name, organization, email and enquiry details.",
  "No enquiry information is shared, sold or used for marketing beyond direct institutional engagement review.",
  "Technical logs (anonymized where possible) may be retained for security, integrity and audit purposes within applicable retention limits.",
  "Enquiry data is retained only for the duration of the institutional review cycle — completed reviews are purged per the applicable retention policy.",
  "Requests to access, correct or delete personal data held by MITHQAL may be submitted through the institutional contact channel.",
];

export default function LegalPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — landscape-only image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-legal-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">LEGAL & DISCLOSURES</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Jurisdictional</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Discipline</motion.span>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">by</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Design.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            MITHQAL operates within applicable legal frameworks — one architecture, different regulatory perimeters. Unknown jurisdiction means blocked. No exceptions.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="#framework" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">View Legal Framework →</a>
            <a href="/contact" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">Contact Legal Team</a>
          </motion.div>
        </motion.div>
      {mounted && <WaterCanvas assetPath="/assets/mithqal-legal-landscape.png" />}
        <FeatureGrid />
      </section>

      {/* CONTENT SECTIONS (below the fold) */}
      <div className="relative z-20 bg-[#07090e]">
        {/* Legal Framework */}
        <section id="framework" className="max-w-[1440px] mx-auto px-6 md:px-12 py-32">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">LEGAL FRAMEWORK</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">One Architecture, Many <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Perimeters.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-8">MITHQAL operates within applicable legal frameworks — discipline is enforced as a gate at every layer, not bolted on after the fact.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FRAMEWORK.map((item) => (
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

        {/* Disclosures */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">DISCLOSURES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Honest About the <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Build Status.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-8">MITHQAL discloses its build status plainly — no production authorization, no live MTQ, no confirmed institutional engagement.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {DISCLOSURES.map((item) => (
              <div key={item.title} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                </div>
                <p className="text-base text-[#cbd5e1] leading-loose">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Terms & Privacy */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">TERMS & PRIVACY</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Clear, Bounded <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Terms.</span></h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mt-8">MITHQAL's terms and privacy principles are stated plainly — what we collect, why, and for how long — within the build-mode context.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Terms of Use</h3>
              <ul className="space-y-3">
                {TERMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-[#cbd5e1] leading-loose">
                    <span className="text-amber-400 mt-1 flex-shrink-0">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Privacy Policy</h3>
              <ul className="space-y-3">
                {PRIVACY.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-[#cbd5e1] leading-loose">
                    <span className="text-amber-400 mt-1 flex-shrink-0">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Contact the <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Legal Team.</span></h2>
          <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mb-10">For institutional legal enquiry, regulatory perimeter questions or build-status clarification, connect with the MITHQAL legal team.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/contact" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Contact Legal Team →</a>
            <a href="/architecture" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Architecture</a>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

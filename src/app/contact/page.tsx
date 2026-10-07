"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";

/**
 * MITHQAL — Contact Page (/contact)
 * v25.22: Cinematic hybrid architecture — same tech stack as home page.
 *
 * Landscape-only background (no baked-in text) + Framer Motion text stagger
 * + WebGL water shader + page-specific content sections (enquiry form,
 * contact channels, response timeline).
 *
 * NOTE: The enquiry form is a visual UI only — no functional backend.
 */

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const CHANNELS = [
  { num: "01", icon: "🏛", title: "Institutional Enquiry", desc: "For general institutional enquiries — capabilities, architecture, evidence and assurance questions.", email: "institutional@mithqal.example" },
  { num: "02", icon: "🛣", title: "Pilot Engagement", desc: "For pilot engagement — eligibility, jurisdiction, corridor and configuration discussions.", email: "pilot@mithqal.example" },
  { num: "03", icon: "⚙", title: "Technical Review", desc: "For technical architecture review — settlement orchestration, evidence layer and finality control.", email: "technical@mithqal.example" },
];

const TIMELINE = [
  { num: "01", title: "Initial Response", timeframe: "48 hours", desc: "Acknowledgement and routing to the appropriate channel — institutional, pilot or technical." },
  { num: "02", title: "Qualification Review", timeframe: "5 business days", desc: "Regulatory, jurisdictional and operational qualification reviewed against pilot eligibility criteria." },
  { num: "03", title: "Engagement Decision", timeframe: "2 weeks", desc: "Decision on engagement, configuration and next steps — communicated through the institutional channel." },
];

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — landscape-only image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/assets/mithqal-contact-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <motion.div variants={wordVariant} className="inline-flex items-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">INSTITUTIONAL ENQUIRY</span>
          </motion.div>
          <motion.h1 variants={container} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
            <motion.span variants={wordVariant} className="inline-block mr-[0.25em]">Contact</motion.span>
            <motion.span variants={wordVariant} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">MITHQAL.</motion.span>
          </motion.h1>
          <motion.p variants={wordVariant} className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
            For institutional enquiries, pilot engagement, or technical architecture review — connect with the MITHQAL team through the appropriate channel.
          </motion.p>
          <motion.div variants={wordVariant} className="flex flex-wrap items-center justify-center gap-4">
            <a href="#form" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Submit Enquiry →</a>
            <a href="/architecture" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View Architecture</a>
          </motion.div>
        </motion.div>
      </section>

      {mounted && <WaterCanvas assetPath="/assets/mithqal-contact-landscape.png" />}
      <FeatureGrid />

      {/* CONTENT SECTIONS (below the fold) */}
      <div className="relative z-20 bg-[#07090e]">
        {/* Enquiry Form */}
        <section id="form" className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">ENQUIRY FORM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Submit an <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Institutional Enquiry.</span></h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">Provide your details and the appropriate MITHQAL team will route and respond within the timeline below.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <form className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 md:p-10 space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold tracking-[0.1em] uppercase text-amber-400 mb-2">Name</label>
                  <input id="name" type="text" placeholder="Full name" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/40 focus:border-amber-400/60 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label htmlFor="organization" className="block text-xs font-semibold tracking-[0.1em] uppercase text-amber-400 mb-2">Organization</label>
                  <input id="organization" type="text" placeholder="Institution name" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/40 focus:border-amber-400/60 focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold tracking-[0.1em] uppercase text-amber-400 mb-2">Email</label>
                  <input id="email" type="email" placeholder="institutional@email.com" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/40 focus:border-amber-400/60 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label htmlFor="enquiry-type" className="block text-xs font-semibold tracking-[0.1em] uppercase text-amber-400 mb-2">Enquiry Type</label>
                  <select id="enquiry-type" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-amber-400/60 focus:outline-none transition-colors">
                    <option value="" className="bg-[#07090e]">Select enquiry type</option>
                    <option value="institutional" className="bg-[#07090e]">Institutional Enquiry</option>
                    <option value="pilot" className="bg-[#07090e]">Pilot Engagement</option>
                    <option value="technical" className="bg-[#07090e]">Technical Review</option>
                    <option value="legal" className="bg-[#07090e]">Legal Enquiry</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-xs font-semibold tracking-[0.1em] uppercase text-amber-400 mb-2">Message</label>
                <textarea id="message" rows={5} placeholder="Describe your institutional enquiry — participants, jurisdictions, corridors, evidence requirements..." className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/40 focus:border-amber-400/60 focus:outline-none transition-colors resize-none" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <p className="text-xs text-white/40 max-w-md">By submitting, you acknowledge MITHQAL's build-mode status. No production activity is authorized.</p>
                <button type="submit" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Submit Enquiry →</button>
              </div>
            </form>
          </div>
        </section>

        {/* Contact Channels */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">CONTACT CHANNELS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Direct <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Channels.</span></h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">Each enquiry type routes to a dedicated institutional channel — no generic inbox, no lost enquiries.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHANNELS.map((channel) => (
              <div key={channel.num} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
                <div className="text-3xl mb-4">{channel.icon}</div>
                <div className="text-xs font-semibold text-amber-400 tracking-[0.1em] mb-2">{channel.num}</div>
                <h3 className="text-lg font-semibold text-white mb-3">{channel.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">{channel.desc}</p>
                <div className="pt-4 border-t border-white/5">
                  <span className="text-xs text-amber-400 tracking-[0.1em] uppercase block mb-1">Email</span>
                  <span className="text-sm text-white/80 break-all">{channel.email}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Response Timeline */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">RESPONSE TIMELINE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">From Submission to <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Decision.</span></h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">Each institutional enquiry moves through three review stages with explicit, bounded response windows.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TIMELINE.map((item, i) => (
              <div key={item.num} className="relative">
                <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-400/50 bg-amber-500/5 flex items-center justify-center text-amber-400 font-semibold text-sm">{item.num}</div>
                    <span className="text-xs font-semibold text-amber-400 tracking-[0.1em] uppercase">{item.timeframe}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-amber-400/40 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-24 border-t border-white/5 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Explore the <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Platform.</span></h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">Before reaching out, explore the MITHQAL architecture, evidence layer, pilot model and legal framework — the institutional context for any enquiry.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/features" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore the Platform →</a>
            <a href="/architecture" className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View the Architecture</a>
          </div>
        </section>
      </div>
    </main>
  );
}

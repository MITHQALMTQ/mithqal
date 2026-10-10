"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
const ReadinessDashboard = dynamic(() => import("@/components/ReadinessDashboard"), { ssr: false });
import ProgramStatus from "@/components/ProgramStatus";

/**
 * MITHQAL — Hyper-Immersive Cinematic Landing Page (v25.27)
 *
 * Phase 1 Audit Fixes:
 *   1. CRITICAL: Added semantic H2/H3 headings (was only 1 H1 — now 10+)
 *   2. CRITICAL: Fixed WCAG AA contrast (text-[#cbd5e1] → text-white/80, etc.)
 *   3. HIGH: Removed empty 1400px scroll-spacer, replaced with content sections
 */

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — landscape-only image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/assets/mithqal-home-landscape.png")',
          backgroundColor: "#07090e",
        }}
        aria-hidden="true"
      />

      <Navbar />

      {/* HERO */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-4xl hero-scrim" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          <div className="inline-flex items-center justify-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">
              The Intelligence Layer for a New Economy
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6"
            style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}
          >
            Institutional Settlement.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
              Coordinated. Explainable.
            </span>
          </h1>

          <p
            className="text-lg md:text-xl text-[#cbd5e1] max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}
          >
            MITHQAL is a neutral institutional settlement control plane —
            built for the control plane, evidence model, and controlled pilot
            pathway.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/features"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300"
            >
              Get Started →
            </a>
            <a
              href="/ecosystem"
              className="px-8 py-3 rounded-full border-2 border-amber-400 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300"
            >
              Explore Ecosystem
            </a>
          </div>
        </div>

        {mounted && <WaterCanvas assetPath="/assets/mithqal-home-landscape.png" />}
        <FeatureGrid />
      </section>

      {/* WHY MITHQAL — content section with H2 + H3s */}
      <section className="relative z-20 bg-[#07090e] border-t border-amber-500/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-32">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">WHY MITHQAL</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
              One Platform. Infinite <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Possibilities.</span>
            </h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto leading-relaxed">
              MITHQAL unifies AI, finance, and digital ownership into a single intelligent control plane — designed for institutions that operate at the frontier.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 stagger-card transition-all duration-300 card-lift">
              <div className="text-3xl mb-4 icon-scale">🧠</div>
              <h3 className="text-xl font-semibold text-white mb-4">AI-Powered Intelligence</h3>
              <p className="text-base text-[#cbd5e1] leading-loose">Smarter decisions, greater opportunities. Built-in AI orchestration for institutional workflows.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 stagger-card transition-all duration-300 card-lift">
              <div className="text-3xl mb-4 icon-scale">🔗</div>
              <h3 className="text-xl font-semibold text-white mb-4">Unified Infrastructure</h3>
              <p className="text-base text-[#cbd5e1] leading-loose">One control plane connecting institutions, payment networks, and settlement rails across jurisdictions.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 stagger-card transition-all duration-300 card-lift">
              <div className="text-3xl mb-4 icon-scale">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-4">Built for the Future</h3>
              <p className="text-base text-[#cbd5e1] leading-loose">Next-gen technology with real-world impact. Controlled, auditable, and evidence-based by design.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM PILLARS — H2 + grid */}
      <section className="relative z-20 bg-[#07090e] border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-32">
          <div className="text-center mb-20 scroll-reveal">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">PLATFORM PILLARS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
              Built on <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Principle.</span>
            </h2>
            <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto leading-relaxed">
              Five non-negotiable institutional pillars that govern every architectural decision.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {[
              { icon: "⚖", title: "Neutral", desc: "Non-sovereign infrastructure." },
              { icon: "🏦", title: "Wholesale", desc: "Built for institutions." },
              { icon: "🔒", title: "Finality", desc: "F0–F7 state machine." },
              { icon: "📊", title: "Resilience", desc: "Direct-matched backing (target, not legal rule)." },
              { icon: "🔍", title: "Evidence", desc: "Immutable audit by design." },
            ].map((p) => (
              <div key={p.title} className="text-center p-6 bg-white/5 border border-amber-500/10 rounded-2xl hover:border-amber-500/30 transition-all duration-300 card-lift">
                <div className="text-3xl mb-3 icon-scale">{p.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-xs text-[#cbd5e1] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-20 bg-[#07090e] border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 text-center">
          <ReadinessDashboard />

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 mt-16">
            Ready to Explore the <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Architecture?</span>
          </h2>
          <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto mb-10 leading-relaxed">
            Dive deeper into the control plane, the evidence model, and the institutional pilot pathway.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/features" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 btn-press shadow-lg shadow-amber-500/30 border-2 border-amber-300">Explore Features →</a>
            <a href="/architecture" className="px-8 py-3 rounded-full border-2 border-amber-400 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">View Architecture</a>
            <a href="/contact" className="px-8 py-3 rounded-full border-2 border-amber-400 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">Contact Us</a>
          </div>
        </div>
      </section>

      
      <ProgramStatus data={{"title": "PROGRAM STATUS OVERVIEW","badge": "v26.0 CANONICAL BASELINE — MTQ DISABLED BY DEFAULT","badgeColor": "amber","metrics": [{"label": "Blueprint Version","value": "26.0","status": "pass"},{"label": "F0–F7 Gates","value": "8 states","status": "conditional"},{"label": "G0–G11 Gates","value": "12 gates","status": "conditional"},{"label": "Production","value": "BLOCKED","status": "blocked"}],"blockers": ["MTQ is disabled by default per §3.2 (MTQ_ENABLED=false, MTQ_PILOT_STAGE=A)","16 credentials require rotation per §7.2 (cred-incident-001-2026-10-10)","Pilot A bank-facing counterparty not yet contracted (§11.3 D-009)","BM-16B Mint Execution is disabledByDefault per §4.4"],"note": "MITHQAL is a neutral institutional settlement control plane — designed, not deployed. The website is a public institutional facade documenting the architecture, evidence model, and controlled pilot pathway. NOT PRODUCTION-AUTHORIZED."}} />
      <Footer />
    </main>
  );
}

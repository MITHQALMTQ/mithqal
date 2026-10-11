"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/global-header";
import { SiteFooter } from "@/components/site-footer";
import FeatureGrid from "@/components/FeatureGrid";
import ProgramStatus from "@/components/ProgramStatus";

const V26InstitutionalDashboard = dynamic(() => import("@/components/v26-institutional-dashboard"), { ssr: false });

/**
 * MITHQAL — Institutional Settlement Control Plane (v26.0 Canonical Baseline)
 *
 * Per v26.0 §0.1: MITHQAL is a neutral institutional settlement control plane.
 * MTQ is an optional, permissioned, closed-loop wholesale module — disabled
 * by default per §3.2 until its gates pass.
 *
 * NOT PRODUCTION-AUTHORIZED per v26.0 §0.2.
 */

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  return (
    <>
      <GlobalHeader />
      <main className="flex-1 relative w-full overflow-x-hidden bg-[#07090e]">
        {/* HERO */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
          <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40" style={{ backgroundImage: 'url("/assets/mithqal-home-landscape.png")', backgroundColor: "#07090e" }} aria-hidden="true" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#07090e]/60 via-[#07090e]/40 to-[#07090e]" aria-hidden="true" />

          <div className="relative z-20 max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center gap-3 mb-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
              <span className="w-px h-4 bg-amber-400" />
              <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">
                Neutral Institutional Settlement Control Plane
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}>
              Institutional Settlement.{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
                Coordinated. Explainable.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#cbd5e1] max-w-2xl mx-auto mb-10 leading-relaxed" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
              MITHQAL coordinates legally recognized settlement assets, institutions, rails, policies, liquidity,
              obligations, evidence, reconciliation, exceptions and operational continuity. MTQ remains an optional,
              permissioned, closed-loop wholesale module — disabled by default until its gates pass.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#dashboard" className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300">
                View Control Tower →
              </a>
              <a href="#why" className="px-8 py-3 rounded-full border-2 border-amber-400 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300">
                Why MITHQAL
              </a>
            </div>
          </div>

          {mounted && <FeatureGrid />}
        </section>

        {/* WHY MITHQAL */}
        <section id="why" className="relative z-20 bg-[#07090e] border-t border-amber-500/10">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-32">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-3 mb-4">
                <span className="w-px h-4 bg-amber-400" />
                <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">WHY MITHQAL</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                One Control Plane. <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Institutional Grade.</span>
              </h2>
              <p className="text-lg text-[#cbd5e1] max-w-2xl mx-auto leading-relaxed">
                MITHQAL coordinates existing settlement assets, institutions, and rails — without requiring
                participants to replace their core systems or adopt a new monetary instrument as a condition of adoption.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: "🧠", title: "Settlement Intelligence", desc: "Explainable legal-obligation metadata, finality mapping, liquidity availability, counterparty exposure, and policy-constrained routing. AI proposes; invariants decide." },
                { icon: "🔗", title: "Translation, Not Transformation", desc: "Adapters connect existing bank processes and recognized settlement assets — software does not change an asset's legal nature by label." },
                { icon: "⚡", title: "Evidence Before Claims", desc: "Every material operational, financial, legal or commercial statement carries provenance and a truth label. Technical completion is never conflated with legal finality." },
              ].map(c => (
                <div key={c.title} className="bg-white/5 backdrop-blur-sm border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
                  <div className="text-3xl mb-4">{c.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-4">{c.title}</h3>
                  <p className="text-base text-[#cbd5e1] leading-loose">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PLATFORM PILLARS */}
        <section className="relative z-20 bg-[#07090e] border-t border-white/5">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-32">
            <div className="text-center mb-20">
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
                { icon: "🔒", title: "Finality", desc: "F0–F7 evidence-gated settlement." },
                { icon: "📊", title: "Resilience", desc: "Direct-matched backing (target, not legal rule)." },
                { icon: "🔍", title: "Evidence", desc: "Immutable audit by design." },
              ].map(p => (
                <div key={p.title} className="text-center p-6 bg-white/5 border border-amber-500/10 rounded-2xl hover:border-amber-500/30 transition-all duration-300">
                  <div className="text-3xl mb-3">{p.icon}</div>
                  <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* V26 INSTITUTIONAL DASHBOARD */}
        <div id="dashboard">
          <V26InstitutionalDashboard />
        </div>

        {/* PROGRAM STATUS */}
        <ProgramStatus data={{
          title: "PROGRAM STATUS OVERVIEW",
          badge: "v26.0 CANONICAL BASELINE — MTQ DISABLED BY DEFAULT",
          metrics: [
            { label: "Blueprint", value: "v26.0", status: "conditional" },
            { label: "Pilot Stage", value: "A", status: "conditional" },
            { label: "MTQ", value: "DISABLED", status: "blocked" },
            { label: "Production", value: "FALSE", status: "blocked" },
          ],
          blockers: [
            "MTQ is disabled by default per v26.0 §3.2 — mint/redeem/transfer paths fail-closed (403)",
            "130% backing pillar removed per v26.0 §3.4 — historical params marked DEFERRED_NOT_ACTIVE",
            "F0–F7 finality state machine + canonical BM-16A/BM-16B naming per v26.0 §4.2/§4.4",
            "Neon authoritative writer wired per v26.0 §6.1/D-006 — Turso projection-only",
            "G0 gate: BLOCKED (entity not legally established; primary documents PENDING)",
          ],
          note: "MITHQAL is a neutral institutional settlement control plane — designed, not deployed. MTQ is an optional, permissioned, closed-loop wholesale module, disabled by default until its legal, accounting, custody, backing, redemption, bank and regulatory gates are independently satisfied. NOT PRODUCTION-AUTHORIZED.",
        }} />

        <SiteFooter />
      </main>
    </>
  );
}

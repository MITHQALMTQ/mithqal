"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";

/**
 * MITHQAL — Hyper-Immersive Cinematic Landing Page (v25.20.4)
 *
 * HYBRID APPROACH (best of both worlds):
 *   1. The reference image (mithqal-home-full.png) as the FULL-PAGE BACKGROUND
 *      — guarantees pixel-perfect visual (the page IS the reference photo)
 *   2. Interactive Navbar overlaid on top (gold branding, nav links, Launch App)
 *   3. WebGL Water Canvas at the bottom 35vh (client-only, after mount)
 *   4. FeatureGrid docked at the bottom (5-icon strip)
 *
 * This fixes the "checkerboard in the sky" issue caused by AI-generated
 * parallax layer images with inconsistent backgrounds. The reference image
 * is guaranteed to look correct because it's the exact photo the user provided.
 *
 * No SSR bailout (no dynamic/ssr:false). WaterCanvas uses mounted state.
 */

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — the reference image (pixel-perfect) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/assets/mithqal-home-full.png")',
          backgroundColor: "#07090e",
        }}
        aria-hidden="true"
      />

      {/* Fixed Premium Navigation */}
      <Navbar />

      {/* Hero text overlay (positioned over the background image) */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">
              The Intelligence Layer for a New Economy
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6">
            Your Digital Capital. Unified. Intelligent.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
              Limitless.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Mithqal is the next-generation platform for AI, finance, and digital
            ownership — built for creators, investors, and visionaries who see
            beyond.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/features"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/20"
            >
              Get Started →
            </a>
            <a
              href="/ecosystem"
              className="px-8 py-3 rounded-full border border-amber-500/40 text-white font-medium text-sm tracking-wide hover:bg-amber-500/10 transition-all duration-300"
            >
              Explore Ecosystem
            </a>
          </div>
        </div>
      </section>

      {/* Z-55: Isolated WebGL Water Reflection Pool (bottom 35vh, client-only) */}
      {mounted && <WaterCanvas assetPath="/assets/mithqal-home-full.png" />}

      {/* Z-60: Docked Footer Feature Matrix */}
      <FeatureGrid />

      {/* Scroll spacer */}
      <div className="relative h-screen w-full" />
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";
import Footer from "@/components/Footer";

/**
 * MITHQAL — Hyper-Immersive Cinematic Landing Page (v25.21)
 *
 * UI FIXES (per Task 34 audit):
 *   1. CRITICAL: Use landscape-only background (mithqal-home-landscape.png)
 *      — no baked-in text/UI, eliminates ghosting/double-vision
 *   2. CRITICAL: WaterCanvas uses the landscape-only image (no mirrored text)
 *   3. MAJOR: Hero text has drop-shadow for readability on bright sky
 *   4. MAJOR: Buttons have stronger contrast (border-2 + backdrop-blur)
 *   5. MAJOR: Eyebrow tagline wrapped in backdrop-blur pill
 *
 * Hybrid Architecture:
 *   - Landscape-only background image (no text — eliminates ghosting)
 *   - Interactive Navbar overlaid on top (with backdrop-blur)
 *   - WebGL Water Canvas at bottom 35vh (mirrors the landscape, not text)
 *   - FeatureGrid docked at bottom (5-icon strip)
 *   - Hero text overlay with drop-shadows for readability
 */

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Full-page background — landscape-only image (NO baked-in text/UI) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/assets/mithqal-home-landscape.png")',
          backgroundColor: "#07090e",
        }}
        aria-hidden="true"
      />

      {/* Fixed Premium Navigation */}
      <Navbar />

      {/* Hero text overlay (positioned over the background image) */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-4xl" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.8))" }}>
          {/* Eyebrow — backdrop-blur pill for readability */}
          <div className="inline-flex items-center justify-center gap-3 mb-6 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">
              The Intelligence Layer for a New Economy
            </span>
          </div>

          {/* Headline — drop-shadow for readability */}
          <h1
            className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6"
            style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.9))" }}
          >
            Your Digital Capital. Unified. Intelligent.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
              Limitless.
            </span>
          </h1>

          {/* Subheadline — stronger contrast */}
          <p
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}
          >
            Mithqal is the next-generation platform for AI, finance, and digital
            ownership — built for creators, investors, and visionaries who see
            beyond.
          </p>

          {/* CTAs — stronger contrast with backdrop-blur */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/features"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide hover:scale-105 transition-transform duration-300 shadow-lg shadow-amber-500/30 border-2 border-amber-300"
            >
              Get Started →
            </a>
            <a
              href="/ecosystem"
              className="px-8 py-3 rounded-full border-2 border-amber-400/70 bg-black/30 backdrop-blur-md text-white font-medium text-sm tracking-wide hover:bg-amber-500/20 transition-all duration-300"
            >
              Explore Ecosystem
            </a>
          </div>
        </div>

        {/* Z-55: Isolated WebGL Water Reflection Pool (bottom 35vh, client-only) */}
        {/* Uses landscape-only image — no mirrored text */}
        {mounted && <WaterCanvas assetPath="/assets/mithqal-home-landscape.png" />}

        {/* Z-60: Docked Footer Feature Matrix */}
        <FeatureGrid />
      </section>

      {/* Scroll spacer */}
      <div className="relative h-screen w-full" />
      <Footer />
    </main>
  );
}

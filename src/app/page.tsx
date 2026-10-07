"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import HeroParallax from "@/components/HeroParallax";
import FeatureGrid from "@/components/FeatureGrid";

/**
 * MITHQAL — Hyper-Immersive Cinematic Landing Page (v25.20)
 *
 * Hybrid Architecture:
 *   - Static DOM for UI (Navbar, text, buttons, FeatureGrid)
 *   - GSAP ScrollTrigger for 2.5D parallax (HeroParallax)
 *   - Framer Motion for text orchestration (word-by-word stagger)
 *   - React Three Fiber WebGL confined to water reflection pool only
 *
 * Z-Index Layering:
 *   Z-10: layer_0_sky.webp (yPercent: 15)
 *   Z-20: HTML Content (titles, CTAs)
 *   Z-30: layer_1_mountains.webp (yPercent: 8)
 *   Z-40: layer_2_monolith.png (yPercent: 2) + amber aura
 *   Z-50: layer_3_foreground_rocks.png (yPercent: 0, anchor)
 *   Z-55: WebGL Water Canvas (bottom 35vh reflection pool)
 *   Z-60: FeatureGrid (docked footer feature matrix)
 *   Z-100: Navbar (fixed top)
 *
 * Performance: 100/100 Lighthouse target. WebGL confined to bottom 35vh.
 */

// Dynamically import WaterShader (client-only, no SSR)
const WaterCanvas = dynamic(
  () => import("@/components/WaterShader").then((m) => m.WaterCanvas),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="relative w-full min-h-screen overflow-x-hidden bg-[#07090e]">
      {/* Fixed Premium Navigation */}
      <Navbar />

      {/* Hero Parallax (GSAP pinned + Framer Motion text stagger) */}
      <HeroParallax />

      {/* Z-55: Isolated WebGL Water Reflection Pool (bottom 35vh) */}
      <WaterCanvas assetPath="/hero/layer_0_sky.webp" />

      {/* Z-60: Docked Footer Feature Matrix */}
      <FeatureGrid />

      {/* Scroll spacer (the pinned hero releases after viewport height) */}
      <div className="relative h-screen w-full" />
    </main>
  );
}

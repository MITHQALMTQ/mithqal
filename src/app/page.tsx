"use client";

import Navbar from "@/components/Navbar";
import HeroParallax from "@/components/HeroParallax";
import FeatureGrid from "@/components/FeatureGrid";
import { WaterCanvas } from "@/components/WaterShader";

/**
 * MITHQAL — Hyper-Immersive Cinematic Landing Page (v25.20.3)
 *
 * FIX for "I see nothing" bug:
 * The previous version used `dynamic(..., { ssr: false })` which triggered
 * `BAILOUT_TO_CLIENT_SIDE_RENDERING` — forcing the ENTIRE page to client-side
 * render. Combined with Framer Motion's `opacity:0` initial state, users saw
 * a blank page until all JS loaded.
 *
 * FIX: Import WaterCanvas directly (it's already "use client"). The WaterCanvas
 * component internally uses a `mounted` check so the WebGL canvas only renders
 * after client hydration. The rest of the page SSRs normally — text is visible
 * immediately, no bailout, no blank page.
 *
 * Hybrid Architecture:
 *   - Static DOM for UI (Navbar, text, buttons, FeatureGrid) — SSR'd
 *   - GSAP ScrollTrigger for 2.5D parallax (client-side effect)
 *   - Framer Motion for text orchestration (hydrates on client)
 *   - React Three Fiber WebGL confined to water reflection pool (client-only)
 *
 * Z-Index Layering:
 *   Z-10: layer_0_sky (yPercent: 15)
 *   Z-20: HTML Content (titles, CTAs)
 *   Z-30: layer_1_mountains (yPercent: 8)
 *   Z-40: layer_2_monolith (yPercent: 2) + amber aura
 *   Z-50: layer_3_foreground_rocks (yPercent: 0, anchor)
 *   Z-55: WebGL Water Canvas (bottom 35vh reflection pool)
 *   Z-60: FeatureGrid (docked footer feature matrix)
 *   Z-100: Navbar (fixed top)
 */

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

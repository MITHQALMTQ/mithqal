"use client";

import React, { useState, useEffect } from "react";

/**
 * Navbar — Premium fixed navigation bar.
 *
 * Left: gold tech-luxury wordmark "MITHQAL" (#D4AF37)
 * Center: menu options with tracking-wide fonts + scale animation on hover
 * Right: "Launch App" capsule pill (border-amber-500/40, rounded-full)
 *
 * Performance: static DOM, no WebGL. Uses CSS transitions only.
 * Backdrop-blur activates on scroll for premium glass effect.
 */

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path
      d="M4 24V6L14 16L24 6V24"
      stroke="#D4AF37"
      strokeWidth="2.5"
      fill="none"
      strokeLinejoin="miter"
      strokeLinecap="square"
    />
    <path d="M14 16V24" stroke="#D4AF37" strokeWidth="2.5" />
  </svg>
);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? "bg-[#07090e]/80 backdrop-blur-xl border-b border-amber-500/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        {/* Left: Brand */}
        <a
          href="/"
          className="flex items-center gap-3 group"
          aria-label="MITHQAL home"
        >
          <MithqalLogo />
          <span
            className="text-xl font-semibold tracking-[0.18em] text-[#D4AF37]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            MITHQAL
          </span>
        </a>

        {/* Center: Nav */}
        <div className="hidden md:flex items-center gap-10">
          {NAV_ITEMS.map((item, i) => (
            <a
              key={item}
              href={NAV_HREFS[i]}
              className="relative text-sm font-medium tracking-wide text-white/80 hover:text-white transition-colors duration-300 group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-amber-400 to-amber-200 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </a>
          ))}
        </div>

        {/* Right: Launch App pill */}
        <a
          href="/features"
          className="border border-amber-500/40 rounded-full px-6 py-2 bg-transparent text-white hover:bg-amber-500/10 transition-all duration-300 text-sm font-medium tracking-wide flex items-center gap-2"
        >
          <span>Launch App</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </nav>
  );
}

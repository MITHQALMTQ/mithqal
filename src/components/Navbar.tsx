"use client";

import React, { useState, useEffect } from "react";

/**
 * Navbar — Premium fixed navigation bar.
 *
 * Primary nav: Home, Features, Ecosystem, Roadmap, About
 * "More" dropdown: Architecture, Evidence, Pilot, Legal, Contact
 * Right: "Launch App" capsule pill
 *
 * Backdrop-blur always active for readability over cinematic backgrounds.
 */

const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "About", href: "/about" },
];

const MORE_NAV = [
  { label: "Architecture", href: "/architecture" },
  { label: "Evidence & Assurance", href: "/evidence" },
  { label: "Institutional / Pilot", href: "/pilot" },
  { label: "Legal / Disclosures", href: "/legal" },
  { label: "Contact / Enquiry", href: "/contact" },
];

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="#D4AF37" strokeWidth="2.5" />
  </svg>
);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 backdrop-blur-md ${
        scrolled
          ? "bg-[#07090e]/80 border-b border-amber-500/10"
          : "bg-black/30 border-b border-white/5"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between gap-6">
        {/* Left: Brand */}
        <a href="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="MITHQAL home">
          <MithqalLogo />
          <span className="text-xl font-semibold tracking-[0.18em] text-[#D4AF37]" style={{ fontFamily: "Inter, sans-serif" }}>MITHQAL</span>
        </a>

        {/* Center: Primary Nav + More dropdown */}
        <div className="hidden md:flex items-center gap-6">
          {PRIMARY_NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`relative text-sm font-medium tracking-wide transition-colors duration-300 group ${
                currentPath === item.href ? "text-white" : "text-white/80 hover:text-white"
              }`}
            >
              {item.label}
              <span className={`absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-amber-400 to-amber-200 transition-transform duration-300 origin-left ${
                currentPath === item.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`} />
            </a>
          ))}

          {/* More dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setMoreOpen(true)}
            onMouseLeave={() => setMoreOpen(false)}
          >
            <button className="relative text-sm font-medium tracking-wide text-white/80 hover:text-white transition-colors duration-300 flex items-center gap-1">
              More
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {moreOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#07090e]/95 backdrop-blur-xl border border-amber-500/20 rounded-xl py-2 shadow-2xl">
                {MORE_NAV.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`block px-4 py-2.5 text-sm transition-colors duration-200 ${
                      currentPath === item.href ? "text-amber-400 bg-amber-500/5" : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Launch App pill */}
        <a
          href="/features"
          className="border border-amber-500/40 rounded-full px-6 py-2 bg-transparent text-white hover:bg-amber-500/10 transition-all duration-300 text-sm font-medium tracking-wide flex items-center gap-2 flex-shrink-0"
        >
          <span>Launch App</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </nav>
  );
}

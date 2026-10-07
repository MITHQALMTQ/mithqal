"use client";

import React, { useState, useEffect } from "react";

/**
 * Navbar — Premium fixed navigation bar with mobile hamburger menu.
 *
 * Desktop: Primary nav (5 items) + "More" dropdown (5 items) + Launch App pill
 * Mobile: Hamburger menu opens full-screen overlay with all 10 links
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

const ALL_NAV = [...PRIMARY_NAV, ...MORE_NAV];

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="#D4AF37" strokeWidth="2.5" />
  </svg>
);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPath(window.location.pathname);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPath(window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, []);

  return (
    <>
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

          {/* Center: Desktop Primary Nav + More dropdown */}
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

          {/* Right: Launch App pill (desktop) */}
          <a
            href="/features"
            className="hidden md:flex border border-amber-500/40 rounded-full px-6 py-2 bg-transparent text-white hover:bg-amber-500/10 transition-all duration-300 text-sm font-medium tracking-wide items-center gap-2 flex-shrink-0"
          >
            <span>Launch App</span>
            <span aria-hidden="true">→</span>
          </a>

          {/* Mobile: Hamburger button */}
          <button
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-1.5 flex-shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={`block w-6 h-0.5 bg-amber-400 transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-amber-400 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-amber-400 transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99] bg-[#07090e]/98 backdrop-blur-xl md:hidden flex flex-col items-center justify-center gap-2 px-6">
          {ALL_NAV.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              className={`text-2xl font-semibold tracking-wide py-3 transition-colors duration-200 ${
                currentPath === item.href ? "text-amber-400" : "text-white/80 hover:text-white"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href="/features"
            className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e] font-semibold text-sm tracking-wide"
            onClick={() => setMobileOpen(false)}
          >
            Launch App →
          </a>
        </div>
      )}
    </>
  );
}

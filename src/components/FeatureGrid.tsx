"use client";

import React from "react";

/**
 * FeatureGrid — Absolute docked footer feature matrix.
 *
 * 5-column row at the bottom of the hero viewport, overlaid on the
 * foreground rocks + water shader. Each cell has a circular outlined
 * gold icon + title + description. Vertical dividers between cells.
 *
 * Performance: static DOM, CSS-only. No WebGL.
 */

const BrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" />
  </svg>
);

const CoinsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h6v4" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const NodesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 7v4M7 17l3-4M17 17l-3-4" />
  </svg>
);

const BoltIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z" />
  </svg>
);

const FEATURES = [
  {
    icon: <BrainIcon />,
    title: "AI-Powered",
    desc: "Smarter decisions. Greater opportunities.",
  },
  {
    icon: <CoinsIcon />,
    title: "DeFi & Finance",
    desc: "Build, earn, and grow with confidence.",
  },
  {
    icon: <ShieldIcon />,
    title: "Digital Ownership",
    desc: "Your assets. Your control.",
  },
  {
    icon: <NodesIcon />,
    title: "Global Ecosystem",
    desc: "Connect. Collaborate. Create.",
  },
  {
    icon: <BoltIcon />,
    title: "Built for the Future",
    desc: "Next-gen technology. Real-world impact.",
  },
];

export default function FeatureGrid() {
  return (
    <section
      className="absolute bottom-0 left-0 right-0 z-[60] px-6 md:px-12 pb-12 pointer-events-none"
      aria-label="MITHQAL capabilities strip"
    >
      <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-0">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`flex items-center gap-4 px-6 py-6 ${
              i < FEATURES.length - 1 ? "border-r border-white/10" : ""
            } ${i >= 2 ? "hidden md:flex" : ""}`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full border border-amber-500/60 text-amber-400 flex-shrink-0">
              {f.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white tracking-wide">
                {f.title}
              </span>
              <span className="text-xs text-[#cbd5e1] leading-snug">
                {f.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

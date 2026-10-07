"use client";

import { useState, useEffect } from "react";

/**
 * ScrollToTop — Floating gold button that appears when the user scrolls
 * down > 500px. Clicking it smoothly scrolls back to the top.
 *
 * Positioned fixed at bottom-right, z-[90] (below navbar z-100, above content).
 * Uses backdrop-blur + border styling to match the cinematic aesthetic.
 */

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-[90] w-12 h-12 rounded-full border border-amber-500/40 bg-black/40 backdrop-blur-md text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition-all duration-300 flex items-center justify-center shadow-lg shadow-amber-500/10"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 4L4 10M10 4L16 10M10 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

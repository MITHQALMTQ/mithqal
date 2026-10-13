"use client";

import { useState, useEffect } from "react";

/**
 * ScrollProgress — Thin gold progress bar at the very top of the viewport.
 * Shows how far the user has scrolled through the page.
 *
 * Positioned fixed at top:0, z-[101] (above navbar z-100 so it's always visible).
 * Uses a gold gradient (from-amber-400 to-amber-200) to match the brand.
 * Width scales with scroll percentage.
 */

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(pct);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initialize
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[101] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-amber-400 to-amber-200 transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

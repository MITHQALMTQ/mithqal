"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Mithqal brand mark — the official gold MTQ monogram.
 *
 * Uses the uploaded MTQ.png (gold MTQ on dark background) for all themes.
 * The image has a dark background that blends seamlessly with the Mithqal
 * dark theme. In light mode, a subtle border is added for definition.
 *
 * The logo is rendered as a rounded image with a subtle gold glow in dark
 * mode. No animated SVG (the uploaded PNG is high-quality and sufficient).
 */
export function Logo({
  className,
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  const isDark = useIsDarkMode();

  return (
    <img
      src="/mithqal-logo.png"
      alt="Mithqal"
      width={120}
      height={120}
      className={cn(
        "rounded-full object-contain",
        isDark && "logo-emblem-glow",
        !isDark && "ring-1 ring-gold/20",
        className
      )}
      draggable={false}
    />
  );
}

/* ---- Hydration-safe dark-mode detector ----
 * Subscribes to <html>'s `class` attribute via MutationObserver so the logo
 * updates live when the theme toggle fires.
 */
function subscribeClass(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getDarkSnapshot(): boolean {
  if (typeof document === "undefined") return true;
  // Dark or Cyber mode → true. Light mode → false.
  return !document.documentElement.classList.contains("light");
}

function getDarkServerSnapshot(): boolean {
  return true;
}

function useIsDarkMode(): boolean {
  return useSyncExternalStore(
    subscribeClass,
    getDarkSnapshot,
    getDarkServerSnapshot,
  );
}

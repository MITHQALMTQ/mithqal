"use client";

import dynamic from "next/dynamic";

/**
 * ClientProviders — Client component wrapper for scroll-related components.
 *
 * These components use browser APIs (window, scroll events) and must be
 * client-only. Wrapping them in a "use client" component allows the root
 * layout.tsx (server component) to import them without SSR issues.
 *
 * Contains:
 *   - ScrollProgress (thin gold bar at top)
 *   - ScrollToTop (floating gold button)
 */

const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });
const ScrollToTop = dynamic(() => import("@/components/ScrollToTop"), { ssr: false });

export default function ClientProviders() {
  return (
    <>
      <ScrollProgress />
      <ScrollToTop />
    </>
  );
}

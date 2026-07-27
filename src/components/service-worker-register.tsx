"use client";

import { useEffect } from "react";

/**
 * Registers the Mithqal service worker (public/sw.js) for PWA offline support.
 *
 * Only registers in production (NODE_ENV=production) and when the browser
 * supports service workers. In dev, the service worker would cache stale
 * assets and interfere with hot-reload, so we skip it.
 *
 * The service worker caches the app shell and Constitution data so the
 * institutional content remains accessible without network connectivity.
 * See RECOMMENDATIONS.md item #8 (PWA).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (reg.installing) {
          console.log("[sw] installing");
        } else if (reg.waiting) {
          console.log("[sw] waiting — will activate on next reload");
        } else if (reg.active) {
          console.log("[sw] active — offline support enabled");
        }
      } catch (err) {
        // Non-fatal — PWA is an enhancement, not a requirement.
        console.warn("[sw] registration failed:", err);
      }
    };

    // Register after window load to avoid competing with first paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}

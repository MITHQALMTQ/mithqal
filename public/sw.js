/**
 * Mithqal Service Worker — PWA offline support.
 *
 * Caches the application shell (HTML, CSS, JS bundles, fonts, images) and
 * the Constitution data so that the core institutional content is accessible
 * even when the user is offline. This is critical for the Constitution view
 * — the constitutional text must be available without network dependency.
 *
 * Strategy:
 *   - App shell (HTML, JS, CSS, fonts): stale-while-revalidate
 *   - Static assets (logo, icons, manifest): cache-first
 *   - API routes (/api/*): network-first (always want fresh data when online)
 *   - Navigation requests: network-first, fall back to cached shell
 *
 * Install location: public/sw.js (served at /sw.js)
 * Registered from: src/app/layout.tsx (client component)
 */

const VERSION = "mithqal-v19.0-stable-1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const CONSTITUTION_CACHE = `${VERSION}-constitution`;

// App shell — the minimum set of files to render the page offline.
const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/logo.svg",
  "/mithqal-logo.png",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/og-image.png",
  "/legal/jozour-llc-nj-certificate.pdf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(SHELL_ASSETS).catch((err) => {
        // Don't fail install if one asset is missing — log and continue.
        console.warn("[sw] shell cache partial failure:", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET — never cache POST/PUT/DELETE.
  if (request.method !== "GET") return;

  // Skip cross-origin requests (analytics, fonts from CDNs, etc.).
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR / dev requests.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // API routes — network-first, fall back to cache only for safe GETs.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigation (HTML page) — network-first, fall back to cached shell.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static assets — stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Only cache successful, non-error responses.
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "Offline — data not cached" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch {
    // Offline — try to serve the cached root, then the cached request.
    const cachedRoot = await caches.match("/");
    if (cachedRoot) return cachedRoot;
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      "<html><body><h1>Offline</h1><p>Mithqal is not available offline yet. Please reconnect.</p></body></html>",
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(() => cached); // network failed, return whatever we have
  return cached || fetchPromise;
}

// Allow the page to trigger an immediate update (e.g., from the Admin console
// "Check for updates" button — future enhancement).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data === "GET_VERSION") {
    event.ports[0].postMessage({ version: VERSION });
  }
});

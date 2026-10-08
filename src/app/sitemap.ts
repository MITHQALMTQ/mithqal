import type { MetadataRoute } from "next";

// Public sitemap — all 10 institutional pages.
// Admin, Playbook, and API routes are intentionally excluded.
const BASE = "https://mithqal.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    { path: "/", priority: 1.0, freq: "daily" as const },
    { path: "/features", priority: 0.9, freq: "weekly" as const },
    { path: "/ecosystem", priority: 0.9, freq: "weekly" as const },
    { path: "/roadmap", priority: 0.8, freq: "monthly" as const },
    { path: "/about", priority: 0.8, freq: "monthly" as const },
    { path: "/architecture", priority: 0.7, freq: "monthly" as const },
    { path: "/evidence", priority: 0.7, freq: "monthly" as const },
    { path: "/pilot", priority: 0.6, freq: "monthly" as const },
    { path: "/legal", priority: 0.5, freq: "yearly" as const },
    { path: "/contact", priority: 0.6, freq: "monthly" as const },
  ];
  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}

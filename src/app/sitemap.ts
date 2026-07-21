import type { MetadataRoute } from "next";

// Public sitemap — the Institution's public surfaces.
// (Admin, Playbook are intentionally excluded — internal/operator-only.)
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://mithqal.io";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/?view=transparency`, lastModified: now, changeFrequency: "always", priority: 0.9 },
    { url: `${base}/?view=constitution`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/?view=testnet`, lastModified: now, changeFrequency: "always", priority: 0.7 },
    { url: `${base}/?view=deck`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}

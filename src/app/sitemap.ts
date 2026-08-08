import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

// Every real, crawlable route. Keep this in sync with src/app/*/page.tsx —
// each one mounts the same app shell, pre-routed to that tool via the
// currentRoute() pathname fallback in appScript.ts.
const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "picker", priority: 0.9, changeFrequency: "weekly" },
  { path: "wheel", priority: 0.9, changeFrequency: "weekly" },
  { path: "teams", priority: 0.8, changeFrequency: "monthly" },
  { path: "bracket", priority: 0.8, changeFrequency: "monthly" },
  { path: "numbers", priority: 0.7, changeFrequency: "monthly" },
  { path: "coin", priority: 0.7, changeFrequency: "monthly" },
  { path: "dice", priority: 0.7, changeFrequency: "monthly" },
  { path: "extras", priority: 0.6, changeFrequency: "monthly" },
  { path: "about", priority: 0.4, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((r) => ({
    url: `${SITE_URL}/${r.path}`.replace(/\/$/, "") || SITE_URL,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}

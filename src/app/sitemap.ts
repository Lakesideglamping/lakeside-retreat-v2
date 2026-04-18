import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://lakesideretreat.co.nz";

  // lastModified is the date the page content was last meaningfully changed.
  // Do NOT use new Date() here — that causes Google to see every page as
  // modified on every crawl, wasting crawl budget on unchanged content.
  const routes: {
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "yearly";
    lastModified: string;
  }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly", lastModified: "2026-04-18" },
    { path: "/dome-pinot", priority: 0.9, changeFrequency: "weekly", lastModified: "2026-04-18" },
    { path: "/dome-rose", priority: 0.9, changeFrequency: "weekly", lastModified: "2026-04-18" },
    { path: "/lakeside-cottage", priority: 0.9, changeFrequency: "weekly", lastModified: "2026-04-18" },
    { path: "/stay", priority: 0.9, changeFrequency: "weekly", lastModified: "2026-04-18" },
    { path: "/gallery", priority: 0.8, changeFrequency: "weekly", lastModified: "2026-04-18" },
    { path: "/reviews", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-04-18" },
    { path: "/explore", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/cromwell-activities", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/guides", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/central-otago-wine-trail", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/couples-retreat-central-otago", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/weekend-getaway-queenstown", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/glamping-central-otago", priority: 0.9, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/winter-glamping-central-otago", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/luxury-accommodation-cromwell", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/dog-friendly-accommodation-central-otago", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/otago-rail-trail-accommodation", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/autumn-central-otago", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/wanaka-day-trip", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/food-dining-central-otago", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/our-story", priority: 0.6, changeFrequency: "monthly", lastModified: "2026-03-01" },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly", lastModified: "2025-01-01" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly", lastModified: "2025-01-01" },
  ];

  return routes.map(({ path, priority, changeFrequency, lastModified }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

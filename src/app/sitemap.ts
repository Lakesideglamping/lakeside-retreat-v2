import { MetadataRoute } from "next";
import { execFileSync } from "node:child_process";

// lastModified per URL is derived from the git history of the page's
// source file at build time. Hardcoding dates here let them drift
// (every page said "2026-04-18" for months); using `new Date()` would
// tell Google every page changed on every crawl and waste crawl budget.
// Git history gives the actual "last meaningfully changed" date.
//
// Falls back to a baseline string if git is unavailable (e.g. running
// outside a checkout, or a brand-new uncommitted page).
const BUILD_FALLBACK = "2026-05-01";

function lastCommitDate(relPath: string): string {
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", relPath],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    // %cI is full ISO-8601; sitemap wants a date or full timestamp. Slice
    // to YYYY-MM-DD to stay terse and avoid timezone noise in the XML.
    return out ? out.slice(0, 10) : BUILD_FALLBACK;
  } catch {
    return BUILD_FALLBACK;
  }
}

// Map a public URL path to its source page file. "/" lives at page.tsx,
// every other route at <slug>/page.tsx inside the (public) route group.
function sourceFileFor(urlPath: string): string {
  const slug = urlPath === "/" ? "" : urlPath.replace(/^\//, "") + "/";
  return `src/app/(public)/${slug}page.tsx`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://lakesideretreat.co.nz";

  const routes: {
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "yearly";
  }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/dome-pinot", priority: 0.9, changeFrequency: "weekly" },
    { path: "/dome-rose", priority: 0.9, changeFrequency: "weekly" },
    { path: "/lakeside-cottage", priority: 0.9, changeFrequency: "weekly" },
    { path: "/stay", priority: 0.9, changeFrequency: "weekly" },
    { path: "/gallery", priority: 0.8, changeFrequency: "weekly" },
    { path: "/reviews", priority: 0.8, changeFrequency: "monthly" },
    { path: "/explore", priority: 0.7, changeFrequency: "monthly" },
    { path: "/cromwell-activities", priority: 0.7, changeFrequency: "monthly" },
    { path: "/guides", priority: 0.7, changeFrequency: "monthly" },
    { path: "/central-otago-wine-trail", priority: 0.7, changeFrequency: "monthly" },
    { path: "/couples-retreat-central-otago", priority: 0.7, changeFrequency: "monthly" },
    { path: "/weekend-getaway-queenstown", priority: 0.7, changeFrequency: "monthly" },
    { path: "/glamping-central-otago", priority: 0.9, changeFrequency: "monthly" },
    { path: "/winter-glamping-central-otago", priority: 0.8, changeFrequency: "monthly" },
    { path: "/luxury-accommodation-cromwell", priority: 0.8, changeFrequency: "monthly" },
    { path: "/dog-friendly-accommodation-central-otago", priority: 0.8, changeFrequency: "monthly" },
    { path: "/otago-rail-trail-accommodation", priority: 0.8, changeFrequency: "monthly" },
    { path: "/autumn-central-otago", priority: 0.8, changeFrequency: "monthly" },
    { path: "/wanaka-day-trip", priority: 0.7, changeFrequency: "monthly" },
    { path: "/food-dining-central-otago", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/our-story", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: lastCommitDate(sourceFileFor(path)),
    changeFrequency,
    priority,
  }));
}

import { MetadataRoute } from "next";

/**
 * Evaluated per request, not baked into the build.
 *
 * This route was prerendered as static, and MAINTENANCE_MODE was read once at
 * module load, so its output was fixed at build time. Turning maintenance off
 * in Render lifted the middleware redirect immediately — middleware runs on
 * every request — while robots.txt kept serving the "disallow: /" baked in by
 * an earlier build, telling every crawler to stay away from a live site.
 *
 * The failure is silent and slow: nothing errors, the site looks fine, and the
 * only symptom is that Google never indexes it. force-dynamic costs nothing
 * here (the response is a few lines of text) and makes the env var the single
 * source of truth at the moment it is asked.
 */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Read inside the handler, so a long-lived server process cannot hold a
  // stale value from whenever the module first loaded.
  const maintenanceMode = process.env.MAINTENANCE_MODE === "true";

  // Block all crawlers while in maintenance mode — no point indexing a
  // coming-soon page, and we don't want half-built content in Google's cache.
  if (maintenanceMode) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/.git/", "/node_modules/"],
        crawlDelay: 1,
      },
    ],
    sitemap: [
      "https://lakesideretreat.co.nz/sitemap.xml",
      "https://lakesideretreat.co.nz/sitemap-images.xml",
    ],
  };
}

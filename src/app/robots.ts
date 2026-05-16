import { MetadataRoute } from "next";

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";

export default function robots(): MetadataRoute.Robots {
  // Block all crawlers while in maintenance mode — no point indexing a
  // coming-soon page, and we don't want half-built content in Google's cache.
  if (MAINTENANCE_MODE) {
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

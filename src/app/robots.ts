import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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

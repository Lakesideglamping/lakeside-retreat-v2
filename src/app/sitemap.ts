import { MetadataRoute } from "next";

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
    {
      path: "/central-otago-wine-trail",
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      path: "/couples-retreat-central-otago",
      priority: 0.7,
      changeFrequency: "monthly",
    },
    {
      path: "/weekend-getaway-queenstown",
      priority: 0.7,
      changeFrequency: "monthly",
    },
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
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}

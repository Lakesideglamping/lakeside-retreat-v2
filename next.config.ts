import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip Next's built-in TypeScript check during `next build`. It OOMs on
  // Render Starter's 460MB cap (compile itself passes, the separate tsc
  // pass is what dies). We already run `tsc --noEmit` locally before every
  // push, so this strips a redundant check, not a real safety net.
  typescript: {
    ignoreBuildErrors: true,
  },

  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Prevent caching on health check endpoint
        source: "/api/health",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // Prevent caching on service worker
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/dome-pinot.html", destination: "/dome-pinot", permanent: true },
      { source: "/dome-rose.html", destination: "/dome-rose", permanent: true },
      { source: "/lakeside-cottage.html", destination: "/lakeside-cottage", permanent: true },
      { source: "/gallery.html", destination: "/gallery", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      { source: "/stay.html", destination: "/stay", permanent: true },
      { source: "/reviews.html", destination: "/reviews", permanent: true },
      { source: "/explore.html", destination: "/explore", permanent: true },
      { source: "/our-story.html", destination: "/our-story", permanent: true },
    ];
  },
};

export default nextConfig;

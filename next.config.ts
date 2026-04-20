import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Hide "X-Powered-By: Next.js" — no reason to advertise framework + version.
  poweredByHeader: false,

  // TypeScript errors always fail the build. If the Render Starter plan
  // OOMs during `next build`, upgrade to Standard — do not re-add
  // ignoreBuildErrors. Run `npm run typecheck` locally before pushing.
  typescript: {
    ignoreBuildErrors: false,
  },

  async headers() {
    // Content-Security-Policy is set per-request by middleware.ts so each
    // response gets a fresh script nonce + strict-dynamic. Keep other
    // static security headers here.
    return [
      {
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
          {
            // Force HTTPS for 2 years, including subdomains and preload lists.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.stripe.com\")",
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
});

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Hide "X-Powered-By: Next.js" — no reason to advertise framework + version.
  poweredByHeader: false,

  // Skip typecheck during `next build` because Render Starter (512MB) OOMs
  // when running tsc + next build together. Type safety is preserved by
  // GitHub Actions CI, which runs `npm run typecheck` on every push and
  // blocks merges on failure. Run `npm run typecheck` locally before pushing.
  typescript: {
    ignoreBuildErrors: true,
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
      { source: "/our-story.html", destination: "/our-story", permanent: true },
      // The /explore page was removed; redirect it (and the legacy .html
      // variant) to /guides so existing links and search-indexed URLs don't 404.
      { source: "/explore", destination: "/guides", permanent: true },
      { source: "/explore.html", destination: "/guides", permanent: true },
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
  // tunnelRoute is deliberately NOT set.
  //
  // It routes every browser Sentry event through our own server at
  // /monitoring, which then forwards it to ingest.us.sentry.io. That dodges ad
  // blockers, but it makes visitor traffic drive outbound connections from the
  // web service — and Render cannot reach Sentry's ingest host: IPv6 is
  // ENETUNREACH and IPv4 hangs until ETIMEDOUT, which takes minutes.
  //
  // It took the site down within an hour of going public. While maintenance
  // mode was on, every visitor got a 12-byte redirect and the browser SDK
  // never ran. The moment real pages started rendering, each page view queued
  // envelopes that each became a multi-minute hanging socket on a 512MB
  // instance. They accumulated faster than they timed out: first slow pages,
  // then nothing served at all.
  //
  // Without the tunnel the browser talks to Sentry directly. If that is
  // blocked the failure stays in the visitor's browser, where it is harmless,
  // instead of consuming server capacity. Do not re-enable it unless Render's
  // egress to Sentry is confirmed working AND the proxy is given a short
  // timeout, because the failure mode is a full outage, not lost telemetry.
});

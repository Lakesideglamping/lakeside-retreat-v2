import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Skip Next's built-in TypeScript check during `next build`. It OOMs on
  // Render Starter's 460MB cap (compile itself passes, the separate tsc
  // pass is what dies). Type safety is enforced by `npm run typecheck`
  // (tsc --noEmit) in CI before the build step runs — see ci.yml.
  // Remove this once the Render plan is upgraded beyond Starter.
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
          {
            // Force HTTPS for 2 years, including subdomains and preload lists.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.stripe.com\")",
          },
          {
            // CSP: allow Stripe (checkout, JS SDK, webhooks) and self. Tailwind
            // and Next.js hydration need 'unsafe-inline' for styles; script
            // 'unsafe-inline' is Next's inline bootstrap until nonces are wired.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.stripe.com https://*.stripe.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
              "form-action 'self' https://checkout.stripe.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
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

"use client";

import dynamic from "next/dynamic";

/**
 * Client-only loader for AnalyticsContent. Must stay `"use client"`
 * because Next 15+ disallows `ssr: false` inside Server Components.
 * The `ssr: false` option keeps recharts (~400KB) out of the server
 * render path — it needs window/canvas measurements at mount anyway.
 *
 * Guarded by bundle-isolation.test.ts.
 */
const AnalyticsContent = dynamic(
  () =>
    import("@/components/admin/analytics/analytics-content").then((m) => ({
      default: m.AnalyticsContent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-muted">Loading analytics…</div>
    ),
  }
);

export function AnalyticsLoader() {
  return <AnalyticsContent />;
}

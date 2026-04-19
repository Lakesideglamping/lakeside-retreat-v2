import { AnalyticsLoader } from "@/components/admin/analytics/analytics-loader";

// The loader is a client component that dynamic-imports AnalyticsContent
// with ssr:false. That split keeps recharts (~400KB) out of the initial
// chunk and complies with Next 15+'s rule that `ssr:false` only works
// inside client components.
export default function AnalyticsPage() {
  return <AnalyticsLoader />;
}

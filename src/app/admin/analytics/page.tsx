import dynamic from "next/dynamic";

// Dynamic-import AnalyticsContent so the ~400KB recharts dependency it
// pulls in stays out of the initial page chunk. The page shell renders
// instantly; the chart code loads after. ssr:false because recharts needs
// window + canvas/svg measurement at mount time.
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

export default function AnalyticsPage() {
  return <AnalyticsContent />;
}

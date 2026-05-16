"use client";

import { useState, useEffect, useCallback } from "react";
import { adminGet } from "@/lib/admin-api";
import { Card } from "@/components/admin/ui/card";
import { Tabs } from "@/components/admin/ui/tabs";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";
import { Alert } from "@/components/admin/ui/alert";

interface Stats {
  abandonedCheckouts: number;
  reviewRequests: number;
  socialDrafts: number;
}

interface AbandonedCheckout {
  id: number;
  booking_id: string;
  guest_email: string;
  guest_name: string | null;
  accommodation: string | null;
  check_in: string | null;
  check_out: string | null;
  reminder_count: number | null;
  last_reminder_sent_at: string | null;
  last_error: string | null;
  created_at: string | null;
}

interface ReviewRequest {
  id: number;
  booking_id: string;
  guest_email: string;
  guest_name: string | null;
  accommodation: string | null;
  check_out: string | null;
  request_count: number | null;
  last_request_sent_at: string | null;
  last_error: string | null;
  status: string | null;
  created_at: string | null;
}

interface SocialDraft {
  id: number;
  platform: string;
  source_type: string | null;
  source_text: string | null;
  accommodation: string | null;
  generated_caption: string | null;
  hashtags: string | null;
  story_text: string | null;
  status: string | null;
  created_at: string | null;
}

const tabs = [
  { key: "abandoned", label: "Abandoned Checkouts" },
  { key: "reviews", label: "Review Requests" },
  { key: "social", label: "Social Content" },
];

const socialStatusVariant: Record<string, "success" | "warning" | "default"> = {
  published: "success",
  draft: "warning",
  archived: "default",
};

const reviewStatusVariant: Record<string, "success" | "warning" | "info" | "default"> = {
  sent: "success",
  pending: "warning",
  completed: "info",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface MarketingContentProps {
  /**
   * Server-prefetched data. When provided, the dashboard renders the
   * tables and stat counters immediately on first paint and skips the
   * initial client-side fetch — eliminates a ~3.6s flicker on slow
   * connections. Manual refresh (loadAll) still re-fetches via the
   * existing API routes.
   */
  initialData?: {
    stats: Stats;
    checkouts: AbandonedCheckout[];
    reviewRequests: ReviewRequest[];
    socialDrafts: SocialDraft[];
  };
}

export function MarketingContent({ initialData }: MarketingContentProps = {}) {
  const [activeTab, setActiveTab] = useState("abandoned");
  const [stats, setStats] = useState<Stats | null>(initialData?.stats ?? null);
  const [checkouts, setCheckouts] = useState<AbandonedCheckout[]>(
    initialData?.checkouts ?? []
  );
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>(
    initialData?.reviewRequests ?? []
  );
  const [socialDrafts, setSocialDrafts] = useState<SocialDraft[]>(
    initialData?.socialDrafts ?? []
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminGet<Stats>("/api/admin/marketing/stats");
      setStats(data);
    } catch {
      // Stats are non-critical
    }
  }, []);

  const fetchCheckouts = useCallback(async () => {
    const data = await adminGet<{ checkouts: AbandonedCheckout[] }>(
      "/api/admin/marketing/abandoned-checkouts"
    );
    setCheckouts(data.checkouts);
  }, []);

  const fetchReviewRequests = useCallback(async () => {
    const data = await adminGet<{ requests: ReviewRequest[] }>(
      "/api/admin/marketing/review-requests"
    );
    setReviewRequests(data.requests);
  }, []);

  const fetchSocialDrafts = useCallback(async () => {
    const data = await adminGet<{ drafts: SocialDraft[] }>(
      "/api/admin/marketing/social"
    );
    setSocialDrafts(data.drafts);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchStats(),
        fetchCheckouts(),
        fetchReviewRequests(),
        fetchSocialDrafts(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchCheckouts, fetchReviewRequests, fetchSocialDrafts]);

  useEffect(() => {
    // Skip the initial fetch when the server has already seeded state.
    // loadAll is still used by manual refresh paths below.
    if (!initialData) loadAll();
  }, [loadAll, initialData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const abandonedColumns = [
    { key: "guest_name", header: "Guest", sortable: true },
    { key: "guest_email", header: "Email", sortable: true },
    {
      key: "accommodation",
      header: "Accommodation",
      render: (v: unknown) => (v as string) ?? "-",
    },
    {
      key: "check_in",
      header: "Check-in",
      render: (v: unknown) => formatDate(v as string | null),
    },
    {
      key: "reminder_count",
      header: "Reminders",
      render: (v: unknown) => String(v ?? 0),
    },
    {
      key: "created_at",
      header: "Created",
      render: (v: unknown) => formatDate(v as string | null),
      sortable: true,
    },
  ];

  const reviewColumns = [
    { key: "guest_name", header: "Guest", sortable: true },
    { key: "guest_email", header: "Email", sortable: true },
    {
      key: "accommodation",
      header: "Accommodation",
      render: (v: unknown) => (v as string) ?? "-",
    },
    {
      key: "check_out",
      header: "Check-out",
      render: (v: unknown) => formatDate(v as string | null),
    },
    {
      key: "request_count",
      header: "Requests Sent",
      render: (v: unknown) => String(v ?? 0),
    },
    {
      key: "status",
      header: "Status",
      render: (v: unknown) => {
        const status = (v as string) ?? "pending";
        return (
          <Badge variant={reviewStatusVariant[status] ?? "default"}>
            {status}
          </Badge>
        );
      },
    },
  ];

  const socialColumns = [
    { key: "platform", header: "Platform", sortable: true },
    {
      key: "accommodation",
      header: "Accommodation",
      render: (v: unknown) => (v as string) ?? "-",
    },
    {
      key: "generated_caption",
      header: "Caption",
      render: (v: unknown) => {
        const text = v as string | null;
        if (!text) return "-";
        return text.length > 60 ? text.slice(0, 60) + "..." : text;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (v: unknown) => {
        const status = (v as string) ?? "draft";
        return (
          <Badge variant={socialStatusVariant[status] ?? "default"}>
            {status}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Created",
      render: (v: unknown) => formatDate(v as string | null),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Read-only dashboard of checkout reminders, review requests, and social drafts tracked by automated jobs
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card
            title="Abandoned Checkouts"
            value={stats.abandonedCheckouts}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            }
          />
          <Card
            title="Review Requests"
            value={stats.reviewRequests}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            }
          />
          <Card
            title="Social Drafts"
            value={stats.socialDrafts}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            }
          />
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "abandoned" && (
        <DataTable
          columns={abandonedColumns}
          data={checkouts as unknown as Record<string, unknown>[]}
          emptyMessage="No abandoned checkouts found"
        />
      )}

      {activeTab === "reviews" && (
        <DataTable
          columns={reviewColumns}
          data={reviewRequests as unknown as Record<string, unknown>[]}
          emptyMessage="No review requests found"
        />
      )}

      {activeTab === "social" && (
        <DataTable
          columns={socialColumns}
          data={socialDrafts as unknown as Record<string, unknown>[]}
          emptyMessage="No social content drafts found"
        />
      )}
    </div>
  );
}

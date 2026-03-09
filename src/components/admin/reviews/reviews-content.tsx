"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/admin/ui/card";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { Tabs } from "@/components/admin/ui/tabs";
import { Modal } from "@/components/admin/ui/modal";
import { FormField } from "@/components/admin/ui/form-field";
import { Alert } from "@/components/admin/ui/alert";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { SearchInput } from "@/components/admin/ui/search-input";
import { adminGet, adminPost, adminPut, adminDelete } from "@/lib/admin-api";

interface Review {
  id: number;
  guest_name: string;
  platform: string | null;
  rating: number | null;
  review_text: string | null;
  stay_date: string | null;
  property: string | null;
  status: string | null;
  is_featured: boolean | null;
  admin_notes: string | null;
  admin_response: string | null;
  response_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ReviewSummary {
  total: number;
  averageRating: number;
  pendingCount: number;
  featuredCount: number;
  byPlatform: Record<string, number>;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
];

const platformVariant: Record<string, "info" | "success" | "warning" | "default"> = {
  airbnb: "info",
  google: "success",
  booking: "warning",
  direct: "default",
};

const statusVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
};

function renderStars(rating: number | null): React.ReactNode {
  const r = rating ?? 0;
  return (
    <span className="inline-flex gap-0.5 text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < r ? "fill-current" : "text-gray-300"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const emptyReviewForm = {
  guest_name: "",
  platform: "direct",
  rating: 5,
  review_text: "",
  stay_date: "",
  property: "",
  status: "approved",
  is_featured: false,
  admin_notes: "",
};

export function ReviewsContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [responseModal, setResponseModal] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseLoading, setResponseLoading] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyReviewForm);
  const [createLoading, setCreateLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (activeTab !== "all") params.set("status", activeTab);
      if (search) params.set("search", search);

      const data = await adminGet<ReviewsResponse>(
        `/api/admin/reviews?${params.toString()}`
      );
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await adminGet<ReviewSummary>("/api/admin/reviews/summary");
      setSummary(data);
    } catch {
      // Summary is non-critical
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleApprove = async (review: Review) => {
    try {
      await adminPut(`/api/admin/reviews/${review.id}`, { status: "approved" });
      setSuccess("Review approved");
      fetchReviews();
      fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve review");
    }
  };

  const handleToggleFeatured = async (review: Review) => {
    try {
      await adminPut(`/api/admin/reviews/${review.id}`, {
        is_featured: !review.is_featured,
      });
      setSuccess(review.is_featured ? "Review unfeatured" : "Review featured");
      fetchReviews();
      fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update review");
    }
  };

  const handleOpenResponse = (review: Review) => {
    setResponseModal(review);
    setResponseText(review.admin_response ?? "");
  };

  const handleSubmitResponse = async () => {
    if (!responseModal) return;
    setResponseLoading(true);
    try {
      await adminPut(`/api/admin/reviews/${responseModal.id}`, {
        admin_response: responseText,
      });
      setSuccess("Response saved");
      setResponseModal(null);
      setResponseText("");
      fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save response");
    } finally {
      setResponseLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    setError(null);
    try {
      await adminPost("/api/admin/reviews", {
        ...createForm,
        rating: Number(createForm.rating),
        stay_date: createForm.stay_date || undefined,
        property: createForm.property || undefined,
        review_text: createForm.review_text || undefined,
        admin_notes: createForm.admin_notes || undefined,
      });
      setSuccess("Review created");
      setCreateModal(false);
      setCreateForm(emptyReviewForm);
      fetchReviews();
      fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create review");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDelete(`/api/admin/reviews/${deleteTarget.id}`);
      setSuccess("Review deleted");
      setDeleteTarget(null);
      fetchReviews();
      fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: "guest_name",
      header: "Guest",
      sortable: true,
      render: (_: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as Review;
        return <span className="font-medium text-gray-900">{r.guest_name}</span>;
      },
    },
    {
      key: "platform",
      header: "Platform",
      render: (_: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as Review;
        const p = r.platform ?? "direct";
        return <Badge variant={platformVariant[p] ?? "default"}>{p}</Badge>;
      },
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (_: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as Review;
        return renderStars(r.rating);
      },
    },
    {
      key: "property",
      header: "Property",
      render: (_: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as Review;
        return <span className="text-gray-600">{r.property ?? "-"}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as Review;
        const s = r.status ?? "pending";
        return <Badge variant={statusVariant[s] ?? "default"}>{s}</Badge>;
      },
    },
    {
      key: "is_featured",
      header: "Featured",
      render: (_: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as Review;
        return r.is_featured ? (
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      render: (_: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as Review;
        return <span className="text-gray-500">{formatDate(r.created_at)}</span>;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-48",
      render: (_: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as Review;
        return (
          <div className="flex items-center gap-1">
            {r.status === "pending" && (
              <button
                onClick={(e) => { e.stopPropagation(); handleApprove(r); }}
                className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                title="Approve"
              >
                Approve
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleFeatured(r); }}
              className="rounded px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-50"
              title={r.is_featured ? "Unfeature" : "Feature"}
            >
              {r.is_featured ? "Unfeature" : "Feature"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenResponse(r); }}
              className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
              title="Respond"
            >
              Respond
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
              className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              title="Delete"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage guest reviews and responses
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848]"
        >
          Add Review
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Total Reviews"
            value={summary.total}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            }
          />
          <Card
            title="Average Rating"
            value={summary.averageRating.toFixed(1)}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
          <Card
            title="Pending"
            value={summary.pendingCount}
            subtitle="Awaiting approval"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <Card
            title="Featured"
            value={summary.featuredCount}
            subtitle="Shown on website"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Search and tabs */}
      <div className="space-y-4">
        <div className="max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search reviews..."
          />
        </div>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={reviews as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No reviews found"
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
      />

      {/* Response Modal */}
      <Modal
        open={!!responseModal}
        onClose={() => { setResponseModal(null); setResponseText(""); }}
        title="Admin Response"
      >
        {responseModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">
                {responseModal.guest_name} - {renderStars(responseModal.rating)}
              </p>
              {responseModal.review_text && (
                <p className="mt-1 text-sm text-gray-600">{responseModal.review_text}</p>
              )}
            </div>
            <FormField
              label="Response"
              name="admin_response"
              type="textarea"
              value={responseText}
              onChange={setResponseText}
              placeholder="Write your response to this review..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setResponseModal(null); setResponseText(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={responseLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white hover:bg-[#234848] disabled:opacity-50"
              >
                {responseLoading && <LoadingSpinner size="sm" className="text-white" />}
                Save Response
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Review Modal */}
      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); setCreateForm(emptyReviewForm); }}
        title="Add Review"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Guest Name"
              name="guest_name"
              value={createForm.guest_name}
              onChange={(v) => setCreateForm((f) => ({ ...f, guest_name: v }))}
              required
            />
            <FormField
              label="Platform"
              name="platform"
              type="select"
              value={createForm.platform}
              onChange={(v) => setCreateForm((f) => ({ ...f, platform: v }))}
              options={[
                { value: "direct", label: "Direct" },
                { value: "airbnb", label: "Airbnb" },
                { value: "google", label: "Google" },
                { value: "booking", label: "Booking.com" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Rating"
              name="rating"
              type="number"
              value={createForm.rating}
              onChange={(v) => setCreateForm((f) => ({ ...f, rating: Number(v) }))}
              required
            />
            <FormField
              label="Property"
              name="property"
              value={createForm.property}
              onChange={(v) => setCreateForm((f) => ({ ...f, property: v }))}
              placeholder="e.g. Dome Pinot, Dome Rose, Lakeside Cottage"
            />
          </div>
          <FormField
            label="Stay Date"
            name="stay_date"
            type="date"
            value={createForm.stay_date}
            onChange={(v) => setCreateForm((f) => ({ ...f, stay_date: v }))}
          />
          <FormField
            label="Review Text"
            name="review_text"
            type="textarea"
            value={createForm.review_text}
            onChange={(v) => setCreateForm((f) => ({ ...f, review_text: v }))}
            placeholder="Guest review text..."
          />
          <FormField
            label="Admin Notes"
            name="admin_notes"
            type="textarea"
            value={createForm.admin_notes}
            onChange={(v) => setCreateForm((f) => ({ ...f, admin_notes: v }))}
            placeholder="Internal notes (not shown publicly)..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setCreateModal(false); setCreateForm(emptyReviewForm); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createLoading || !createForm.guest_name}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white hover:bg-[#234848] disabled:opacity-50"
            >
              {createLoading && <LoadingSpinner size="sm" className="text-white" />}
              Create Review
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Review"
        message={`Are you sure you want to delete the review from "${deleteTarget?.guest_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

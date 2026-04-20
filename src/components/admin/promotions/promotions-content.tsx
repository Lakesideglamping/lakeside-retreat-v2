"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/admin/ui/card";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { Modal } from "@/components/admin/ui/modal";
import { Alert } from "@/components/admin/ui/alert";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { SearchInput } from "@/components/admin/ui/search-input";
import { adminGet, adminPost, adminPut, adminDelete, adminPatch } from "@/lib/admin-api";
import { PromoForm, type PromoFormData } from "./promo-form";

interface PromoCode {
  id: number;
  name: string;
  code: string;
  type: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  min_stay: number | null;
  usage_limit: number | null;
  usage_count: number | null;
  status: string | null;
  partner_info: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface PromosResponse {
  promoCodes: PromoCode[];
  total: number;
  page: number;
  totalPages: number;
  activeCount: number;
  totalUsage: number;
}

const statusVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  active: "success",
  paused: "warning",
  expired: "error",
};

const typeVariant: Record<string, "info" | "success" | "warning" | "default"> = {
  seasonal: "info",
  partner: "success",
  general: "default",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDiscount(type: string, value: number): string {
  return type === "percentage" ? `${value}%` : `$${value}`;
}

export function PromotionsContent() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [totalUsage, setTotalUsage] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PromoCode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);

      const data = await adminGet<PromosResponse>(
        `/api/admin/promotions?${params.toString()}`
      );
      setPromos(data.promoCodes);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setActiveCount(data.activeCount);
      setTotalUsage(data.totalUsage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  // Both handlers re-throw so PromoForm surfaces the error inline in the modal.
  // Side-effects (success alert, close, refetch) run outside the try so they
  // don't get swallowed and misreported as "Failed to save".
  const handleCreate = async (formData: PromoFormData) => {
    try {
      await adminPost("/api/admin/promotions", {
        ...formData,
        min_stay: formData.min_stay || undefined,
        usage_limit: formData.usage_limit || undefined,
        description: formData.description || undefined,
        partner_info: formData.partner_info || undefined,
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined,
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to create promo code");
    }
    setSuccess("Promo code created");
    setCreateModal(false);
    fetchPromos();
  };

  const handleEdit = async (formData: PromoFormData) => {
    if (!editTarget) return;
    try {
      await adminPut(`/api/admin/promotions/${editTarget.id}`, {
        ...formData,
        min_stay: formData.min_stay || undefined,
        usage_limit: formData.usage_limit || undefined,
        description: formData.description || undefined,
        partner_info: formData.partner_info || undefined,
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined,
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update promo code");
    }
    setSuccess("Promo code updated");
    setEditTarget(null);
    fetchPromos();
  };

  const handleToggleStatus = async (promo: PromoCode) => {
    const newStatus = promo.status === "active" ? "paused" : "active";
    try {
      await adminPatch(`/api/admin/promotions/${promo.id}/status`, {
        status: newStatus,
      });
      setSuccess(`Promo code ${newStatus === "active" ? "activated" : "paused"}`);
      fetchPromos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminDelete(`/api/admin/promotions/${deleteTarget.id}`);
      setSuccess("Promo code deleted");
      setDeleteTarget(null);
      fetchPromos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete promo code");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toEditFormData = (promo: PromoCode): Partial<PromoFormData> => ({
    name: promo.name,
    code: promo.code,
    type: promo.type ?? "general",
    description: promo.description ?? "",
    discount_type: promo.discount_type,
    discount_value: Number(promo.discount_value),
    valid_from: promo.valid_from ? promo.valid_from.split("T")[0] : "",
    valid_until: promo.valid_until ? promo.valid_until.split("T")[0] : "",
    min_stay: promo.min_stay ?? "",
    usage_limit: promo.usage_limit ?? "",
    status: promo.status ?? "active",
    partner_info: promo.partner_info ?? "",
  });

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (_: unknown, row: Record<string, unknown>) => {
        const p = row as unknown as PromoCode;
        return <span className="font-medium text-gray-900">{p.name}</span>;
      },
    },
    {
      key: "code",
      header: "Code",
      render: (_: unknown, row: Record<string, unknown>) => {
        const p = row as unknown as PromoCode;
        return (
          <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono text-gray-800">
            {p.code}
          </code>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      render: (_: unknown, row: Record<string, unknown>) => {
        const p = row as unknown as PromoCode;
        const t = p.type ?? "general";
        return <Badge variant={typeVariant[t] ?? "default"}>{t}</Badge>;
      },
    },
    {
      key: "discount_value",
      header: "Discount",
      sortable: true,
      render: (_: unknown, row: Record<string, unknown>) => {
        const p = row as unknown as PromoCode;
        return (
          <span className="font-medium text-gray-900">
            {formatDiscount(p.discount_type, Number(p.discount_value))}
          </span>
        );
      },
    },
    {
      key: "valid_from",
      header: "Valid Period",
      render: (_: unknown, row: Record<string, unknown>) => {
        const p = row as unknown as PromoCode;
        return (
          <span className="text-sm text-gray-600">
            {formatDate(p.valid_from)} - {formatDate(p.valid_until)}
          </span>
        );
      },
    },
    {
      key: "usage_count",
      header: "Usage",
      render: (_: unknown, row: Record<string, unknown>) => {
        const p = row as unknown as PromoCode;
        return (
          <span className="text-sm text-gray-600">
            {p.usage_count ?? 0}
            {p.usage_limit ? ` / ${p.usage_limit}` : ""}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, row: Record<string, unknown>) => {
        const p = row as unknown as PromoCode;
        const s = p.status ?? "active";
        return <Badge variant={statusVariant[s] ?? "default"}>{s}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-40",
      render: (_: unknown, row: Record<string, unknown>) => {
        const p = row as unknown as PromoCode;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setEditTarget(p); }}
              className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(p); }}
              className="rounded px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-50"
            >
              {p.status === "active" ? "Pause" : "Activate"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
              className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
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
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage promo codes and discounts
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848]"
        >
          Create Promo Code
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          title="Total Codes"
          value={total}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          }
        />
        <Card
          title="Active"
          value={activeCount}
          subtitle="Currently available"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <Card
          title="Total Usage"
          value={totalUsage}
          subtitle="Times redeemed"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search promo codes..."
        />
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={promos as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="No promo codes found"
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
      />

      {/* Create Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Promo Code"
        size="lg"
      >
        <PromoForm
          onSubmit={handleCreate}
          onCancel={() => setCreateModal(false)}
          submitLabel="Create"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Promo Code"
        size="lg"
      >
        {editTarget && (
          <PromoForm
            initialData={toEditFormData(editTarget)}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Update"
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Promo Code"
        message={`Are you sure you want to delete the promo code "${deleteTarget?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

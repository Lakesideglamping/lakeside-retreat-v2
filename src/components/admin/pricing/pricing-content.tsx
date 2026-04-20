"use client";

import { useState, useCallback } from "react";
import { adminGet, adminPost, adminPut, adminDelete } from "@/lib/admin-api";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { Modal } from "@/components/admin/ui/modal";
import { FormField } from "@/components/admin/ui/form-field";
import { Alert } from "@/components/admin/ui/alert";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";

interface SeasonalRate {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  multiplier: number;
  is_active: boolean;
}

interface PricingContentProps {
  initialRates: SeasonalRate[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Two active rates with overlapping date ranges produce ambiguous pricing —
// whichever matches first wins. Surface the conflict so the owner can fix it.
function findRateOverlaps(rates: SeasonalRate[]): Array<[SeasonalRate, SeasonalRate]> {
  const active = rates.filter((r) => r.is_active);
  const overlaps: Array<[SeasonalRate, SeasonalRate]> = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (a.start_date <= b.end_date && b.start_date <= a.end_date) {
        overlaps.push([a, b]);
      }
    }
  }
  return overlaps;
}

export function PricingContent({ initialRates }: PricingContentProps) {
  const [rates, setRates] = useState<SeasonalRate[]>(initialRates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<SeasonalRate | null>(null);
  const [rateName, setRateName] = useState("");
  const [rateStartDate, setRateStartDate] = useState("");
  const [rateEndDate, setRateEndDate] = useState("");
  const [rateMultiplier, setRateMultiplier] = useState("1.00");
  const [rateActive, setRateActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SeasonalRate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<{ rates: SeasonalRate[] }>("/api/admin/seasonal-rates");
      setRates(
        res.rates.map((r) => ({
          ...r,
          start_date: typeof r.start_date === "string"
            ? r.start_date.split("T")[0]
            : new Date(r.start_date).toISOString().split("T")[0],
          end_date: typeof r.end_date === "string"
            ? r.end_date.split("T")[0]
            : new Date(r.end_date).toISOString().split("T")[0],
          multiplier: Number(r.multiplier),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rates");
    } finally {
      setLoading(false);
    }
  }, []);

  const openCreateForm = () => {
    setEditingRate(null);
    setRateName("");
    setRateStartDate("");
    setRateEndDate("");
    setRateMultiplier("1.00");
    setRateActive(true);
    setShowRateForm(true);
  };

  const openEditForm = (rate: SeasonalRate) => {
    setEditingRate(rate);
    setRateName(rate.name);
    setRateStartDate(rate.start_date);
    setRateEndDate(rate.end_date);
    setRateMultiplier(String(rate.multiplier));
    setRateActive(rate.is_active);
    setShowRateForm(true);
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const multiplier = parseFloat(rateMultiplier);
    if (isNaN(multiplier) || multiplier <= 0) {
      setError("Multiplier must be a positive number");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: rateName,
        start_date: rateStartDate,
        end_date: rateEndDate,
        multiplier,
        is_active: rateActive,
      };

      if (editingRate) {
        await adminPut(`/api/admin/seasonal-rates/${editingRate.id}`, payload);
        setSuccess("Seasonal rate updated");
      } else {
        await adminPost("/api/admin/seasonal-rates", payload);
        setSuccess("Seasonal rate created");
      }

      setShowRateForm(false);
      await fetchRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDelete(`/api/admin/seasonal-rates/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccess("Seasonal rate deleted");
      await fetchRates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rate");
    } finally {
      setDeleting(false);
    }
  };

  const rateColumns = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "start_date",
      header: "Start Date",
      sortable: true,
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: "end_date",
      header: "End Date",
      sortable: true,
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: "multiplier",
      header: "Multiplier",
      render: (val: unknown) => `${Number(val).toFixed(2)}x`,
    },
    {
      key: "is_active",
      header: "Status",
      render: (val: unknown) => (
        <Badge variant={val ? "success" : "default"}>
          {val ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (_val: unknown, row: SeasonalRate) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditForm(row);
            }}
            className="text-sm text-[#2d5a5a] hover:text-[#234848] font-medium"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seasonal Rates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage seasonal pricing multipliers applied on top of base rates
        </p>
      </div>

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

      {(() => {
        const overlaps = findRateOverlaps(rates);
        if (overlaps.length === 0) return null;
        return (
          <Alert variant="warning" title="Overlapping active rates">
            <ul className="list-disc pl-5 space-y-1">
              {overlaps.map(([a, b]) => (
                <li key={`${a.id}-${b.id}`}>
                  <strong>{a.name}</strong> ({formatDate(a.start_date)}–{formatDate(a.end_date)}) overlaps{" "}
                  <strong>{b.name}</strong> ({formatDate(b.start_date)}–{formatDate(b.end_date)}). Only one
                  will apply on shared dates.
                </li>
              ))}
            </ul>
          </Alert>
        );
      })()}

      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={openCreateForm}
            className="rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848]"
          >
            Add Seasonal Rate
          </button>
        </div>

        <DataTable<SeasonalRate & Record<string, unknown>>
          columns={rateColumns}
          data={rates as (SeasonalRate & Record<string, unknown>)[]}
          loading={loading}
          emptyMessage="No seasonal rates configured"
        />
      </div>

      <Modal
        open={showRateForm}
        onClose={() => setShowRateForm(false)}
        title={editingRate ? "Edit Seasonal Rate" : "Add Seasonal Rate"}
      >
        <form onSubmit={handleRateSubmit} className="space-y-4">
          <FormField
            label="Name"
            name="rate-name"
            value={rateName}
            onChange={setRateName}
            required
            placeholder="e.g. Summer Peak"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Date"
              name="rate-start"
              type="date"
              value={rateStartDate}
              onChange={setRateStartDate}
              required
            />
            <FormField
              label="End Date"
              name="rate-end"
              type="date"
              value={rateEndDate}
              onChange={setRateEndDate}
              required
            />
          </div>
          <FormField
            label="Multiplier"
            name="rate-multiplier"
            type="number"
            value={rateMultiplier}
            onChange={setRateMultiplier}
            required
            placeholder="e.g. 1.25"
          />
          <div className="flex items-center gap-2">
            <input
              id="rate-active"
              type="checkbox"
              checked={rateActive}
              onChange={(e) => setRateActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#2d5a5a] focus:ring-[#2d5a5a]"
            />
            <label htmlFor="rate-active" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRateForm(false)}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848] disabled:bg-[#2d5a5a]/60"
            >
              {submitting && <LoadingSpinner size="sm" className="text-white" />}
              {editingRate ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Seasonal Rate"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteRate}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

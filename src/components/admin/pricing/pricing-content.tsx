"use client";

import { useState, useCallback } from "react";
import { adminGet, adminPost, adminPut, adminDelete } from "@/lib/admin-api";
import { Tabs } from "@/components/admin/ui/tabs";
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
  initialSettings: Record<string, string>;
}

const TABS = [
  { key: "seasonal", label: "Seasonal Rates" },
  { key: "base", label: "Base Pricing" },
];

const ACCOMMODATIONS = [
  { id: "dome-pinot", name: "Dome Pinot" },
  { id: "dome-rose", name: "Dome Rosé" },
  { id: "lakeside-cottage", name: "Lakeside Cottage" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PricingContent({
  initialRates,
  initialSettings,
}: PricingContentProps) {
  const [activeTab, setActiveTab] = useState("seasonal");
  const [rates, setRates] = useState<SeasonalRate[]>(initialRates);
  const [settings] = useState<Record<string, string>>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Rate form state
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<SeasonalRate | null>(null);
  const [rateName, setRateName] = useState("");
  const [rateStartDate, setRateStartDate] = useState("");
  const [rateEndDate, setRateEndDate] = useState("");
  const [rateMultiplier, setRateMultiplier] = useState("1.00");
  const [rateActive, setRateActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SeasonalRate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Base pricing form state
  const [basePricing, setBasePricing] = useState<
    Record<string, { base: string; weekend: string; minNights: string }>
  >(() => {
    const result: Record<string, { base: string; weekend: string; minNights: string }> = {};
    for (const acc of ACCOMMODATIONS) {
      const key = acc.id.replace(/-/g, "_");
      result[acc.id] = {
        base: settings[`pricing_${key}_base`] ?? "",
        weekend: settings[`pricing_${key}_weekend`] ?? "",
        minNights: settings[`pricing_${key}_min_nights`] ?? "",
      };
    }
    return result;
  });
  const [savingPricing, setSavingPricing] = useState<string | null>(null);

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

  const handleSaveBasePricing = async (accId: string) => {
    setSavingPricing(accId);
    setError(null);
    try {
      const data = basePricing[accId];
      await adminPost("/api/admin/pricing-config", {
        accommodation: accId,
        base: parseFloat(data.base) || 0,
        weekend: parseFloat(data.weekend) || 0,
        minNights: parseInt(data.minNights) || 1,
      });
      setSuccess(`Base pricing updated for ${ACCOMMODATIONS.find((a) => a.id === accId)?.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save pricing");
    } finally {
      setSavingPricing(null);
    }
  };

  const updateBasePricing = (accId: string, field: string, value: string) => {
    setBasePricing((prev) => ({
      ...prev,
      [accId]: { ...prev[accId], [field]: value },
    }));
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
        <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage seasonal rates and base pricing
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

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "seasonal" && (
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
      )}

      {activeTab === "base" && (
        <div className="space-y-6">
          {ACCOMMODATIONS.map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{acc.name}</h3>
                <button
                  onClick={() => handleSaveBasePricing(acc.id)}
                  disabled={savingPricing === acc.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848] disabled:bg-[#2d5a5a]/60"
                >
                  {savingPricing === acc.id && (
                    <LoadingSpinner size="sm" className="text-white" />
                  )}
                  Save
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  label="Base Price (per night)"
                  name={`${acc.id}-base`}
                  type="number"
                  value={basePricing[acc.id]?.base ?? ""}
                  onChange={(v) => updateBasePricing(acc.id, "base", v)}
                  placeholder="e.g. 365"
                />
                <FormField
                  label="Weekend Surcharge"
                  name={`${acc.id}-weekend`}
                  type="number"
                  value={basePricing[acc.id]?.weekend ?? ""}
                  onChange={(v) => updateBasePricing(acc.id, "weekend", v)}
                  placeholder="e.g. 50"
                />
                <FormField
                  label="Min Nights"
                  name={`${acc.id}-minNights`}
                  type="number"
                  value={basePricing[acc.id]?.minNights ?? ""}
                  onChange={(v) => updateBasePricing(acc.id, "minNights", v)}
                  placeholder="e.g. 1"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rate create/edit modal */}
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

      {/* Delete confirmation */}
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

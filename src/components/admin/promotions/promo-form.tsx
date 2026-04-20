"use client";

import { useState } from "react";
import { FormField } from "@/components/admin/ui/form-field";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";

export interface PromoFormData {
  name: string;
  code: string;
  type: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  min_stay: number | "";
  usage_limit: number | "";
  status: string;
  partner_info: string;
}

interface PromoFormProps {
  initialData?: Partial<PromoFormData>;
  onSubmit: (data: PromoFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const defaultForm: PromoFormData = {
  name: "",
  code: "",
  type: "general",
  description: "",
  discount_type: "percentage",
  discount_value: 0,
  valid_from: "",
  valid_until: "",
  min_stay: "",
  usage_limit: "",
  status: "active",
  partner_info: "",
};

export function PromoForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: PromoFormProps) {
  const [form, setForm] = useState<PromoFormData>({
    ...defaultForm,
    ...initialData,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.discount_type) {
      setError("Please fill in all required fields");
      return;
    }
    if (
      form.valid_from &&
      form.valid_until &&
      form.valid_until < form.valid_from
    ) {
      setError("Valid Until must be the same day as or after Valid From");
      return;
    }
    if (
      form.discount_type === "percentage" &&
      Number(form.discount_value) > 100
    ) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: keyof PromoFormData, value: string | number) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => update("name", v)}
          required
          placeholder="Summer Sale"
        />
        <FormField
          label="Code"
          name="code"
          value={form.code}
          onChange={(v) => update("code", v.toUpperCase())}
          required
          placeholder="SUMMER2026"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Type"
          name="type"
          type="select"
          value={form.type}
          onChange={(v) => update("type", v)}
          options={[
            { value: "general", label: "General" },
            { value: "seasonal", label: "Seasonal" },
            { value: "partner", label: "Partner" },
          ]}
        />
        <FormField
          label="Status"
          name="status"
          type="select"
          value={form.status}
          onChange={(v) => update("status", v)}
          options={[
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "expired", label: "Expired" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Discount Type"
          name="discount_type"
          type="select"
          value={form.discount_type}
          onChange={(v) => update("discount_type", v)}
          required
          options={[
            { value: "percentage", label: "Percentage" },
            { value: "fixed", label: "Fixed Amount" },
          ]}
        />
        <FormField
          label={form.discount_type === "percentage" ? "Discount (%)" : "Discount ($)"}
          name="discount_value"
          type="number"
          value={form.discount_value}
          onChange={(v) => update("discount_value", Number(v))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Valid From"
          name="valid_from"
          type="date"
          value={form.valid_from}
          onChange={(v) => update("valid_from", v)}
        />
        <FormField
          label="Valid Until"
          name="valid_until"
          type="date"
          value={form.valid_until}
          onChange={(v) => update("valid_until", v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Min Stay (nights)"
          name="min_stay"
          type="number"
          value={form.min_stay}
          onChange={(v) => update("min_stay", v ? Number(v) : "")}
          placeholder="No minimum"
        />
        <FormField
          label="Usage Limit"
          name="usage_limit"
          type="number"
          value={form.usage_limit}
          onChange={(v) => update("usage_limit", v ? Number(v) : "")}
          placeholder="Unlimited"
        />
      </div>

      {form.type === "partner" && (
        <FormField
          label="Partner Info"
          name="partner_info"
          type="textarea"
          value={form.partner_info}
          onChange={(v) => update("partner_info", v)}
          placeholder="Partner details..."
        />
      )}

      <FormField
        label="Description"
        name="description"
        type="textarea"
        value={form.description}
        onChange={(v) => update("description", v)}
        placeholder="Optional description..."
      />

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !form.name || !form.code}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white hover:bg-[#234848] disabled:opacity-50"
        >
          {loading && <LoadingSpinner size="sm" className="text-white" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

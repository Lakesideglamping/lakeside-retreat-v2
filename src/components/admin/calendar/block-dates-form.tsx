"use client";

import { useState } from "react";
import { adminPost } from "@/lib/admin-api";
import { Modal } from "@/components/admin/ui/modal";
import { FormField } from "@/components/admin/ui/form-field";
import { Alert } from "@/components/admin/ui/alert";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";

interface BlockDatesFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate: string | null;
  initialEndDate?: string | null;
  initialProperty?: string | null;
}

const PROPERTY_OPTIONS = [
  { value: "dome-pinot", label: "Dome Pinot" },
  { value: "dome-rose", label: "Dome Rosé" },
  { value: "lakeside-cottage", label: "Lakeside Cottage" },
];

const REASON_OPTIONS = [
  { value: "maintenance", label: "Maintenance" },
  { value: "personal", label: "Personal" },
  { value: "cleaning", label: "Cleaning" },
  { value: "other", label: "Other" },
];

export function BlockDatesForm({
  open,
  onClose,
  onSuccess,
  initialDate,
  initialEndDate,
  initialProperty,
}: BlockDatesFormProps) {
  const [property, setProperty] = useState(initialProperty ?? "");
  const [startDate, setStartDate] = useState(initialDate ?? "");
  const [endDate, setEndDate] = useState(initialEndDate ?? initialDate ?? "");
  const [reason, setReason] = useState("maintenance");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update start/end date when initialDate changes
  const handleOpen = () => {
    if (initialDate) {
      setStartDate(initialDate);
      setEndDate(initialEndDate ?? initialDate);
    }
    if (initialProperty) setProperty(initialProperty);
  };

  // Reset form on close
  const handleClose = () => {
    setProperty("");
    setStartDate("");
    setEndDate("");
    setReason("maintenance");
    setNotes("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!property) {
      setError("Please select a property");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select start and end dates");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after start date");
      return;
    }

    setSubmitting(true);
    try {
      await adminPost("/api/admin/blocked-dates", {
        property,
        start_date: startDate,
        end_date: endDate,
        reason,
        notes: notes || undefined,
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to block dates");
    } finally {
      setSubmitting(false);
    }
  };

  // Sync initialDate when modal opens
  if (open && initialDate && !startDate) {
    handleOpen();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Block Dates" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <FormField
          label="Property"
          name="property"
          type="select"
          value={property}
          onChange={setProperty}
          options={PROPERTY_OPTIONS}
          required
          placeholder="Select property..."
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Start Date"
            name="start_date"
            type="date"
            value={startDate}
            onChange={setStartDate}
            required
          />
          <FormField
            label="End Date"
            name="end_date"
            type="date"
            value={endDate}
            onChange={setEndDate}
            required
          />
        </div>

        <FormField
          label="Reason"
          name="reason"
          type="select"
          value={reason}
          onChange={setReason}
          options={REASON_OPTIONS}
        />

        <FormField
          label="Notes"
          name="notes"
          type="textarea"
          value={notes}
          onChange={setNotes}
          placeholder="Optional notes about this block..."
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
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
            Block Dates
          </button>
        </div>
      </form>
    </Modal>
  );
}

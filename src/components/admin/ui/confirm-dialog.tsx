"use client";

import { Modal } from "./modal";
import { LoadingSpinner } from "./loading-spinner";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const confirmButtonClasses: Record<
  NonNullable<ConfirmDialogProps["variant"]>,
  string
> = {
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
  warning:
    "bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-yellow-300",
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="mb-6 text-sm text-gray-600">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${confirmButtonClasses[variant]}`}
        >
          {loading && <LoadingSpinner size="sm" className="text-white" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

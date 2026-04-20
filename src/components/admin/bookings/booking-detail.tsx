"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminGet, adminPut, adminPost, adminDelete } from "@/lib/admin-api";
import { Badge } from "@/components/admin/ui/badge";
import { Alert } from "@/components/admin/ui/alert";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  accommodation: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number | null;
  status: string | null;
  payment_status: string | null;
  notes: string | null;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  uplisting_id: string | null;
  booking_source: string | null;
  uplisting_sync_status: string | null;
  security_deposit_intent_id: string | null;
  security_deposit_status: string | null;
  security_deposit_amount: number | null;
  security_deposit_released_at: string | null;
  security_deposit_claimed_amount: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface BookingDetailProps {
  bookingId: string;
}

interface AuditLogEntry {
  id: number;
  admin_user: string;
  action: string;
  details: unknown;
  ip_address: string | null;
  created_at: string | null;
}

interface EmailSendEntry {
  id: number;
  template: string;
  recipient: string;
  subject: string;
  status: string;
  error: string | null;
  sent_at: string;
}

const emailTemplateLabels: Record<string, string> = {
  booking_confirmation_guest: "Booking confirmation (guest)",
  booking_confirmation_host: "Booking notification (host)",
  pre_arrival: "Pre-arrival instructions",
  during_stay: "Mid-stay check-in",
  checkout_thank_you: "Checkout thank-you",
  abandoned_checkout: "Abandoned checkout reminder",
  payment_failure: "Payment failure notice",
  cancellation: "Cancellation confirmation",
  payment_notification: "Payment notification (host)",
  contact_enquiry: "Contact form enquiry",
  system_alert: "System alert",
};

const statusVariant: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  confirmed: "success",
  completed: "success",
  pending: "warning",
  cancelled: "error",
};

const paymentVariant: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  paid: "success",
  completed: "success",
  pending: "warning",
  failed: "error",
  refunded: "info",
};

const depositVariant: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  pending: "warning",
  held: "info",
  released: "success",
  claimed: "error",
};

const syncVariant: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  pending: "warning",
  synced: "success",
  failed: "error",
  skipped: "default",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatAccommodation(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Days between today (NZ) and check-in. Negative = past, 0 = today, positive = upcoming.
function daysUntilCheckIn(checkIn: string): number {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const msPerDay = 86400000;
  return Math.round(
    (new Date(checkIn).getTime() - new Date(todayStr).getTime()) / msPerDay
  );
}

export function BookingDetail({ bookingId }: BookingDetailProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  // Confirm dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimReason, setClaimReason] = useState("");

  // Audit log for this booking
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  // Per-booking email send log
  const [emails, setEmails] = useState<EmailSendEntry[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<Booking>(`/api/admin/bookings/${bookingId}`);
      const normalized: Booking = {
        ...data,
        check_in: typeof data.check_in === "string"
          ? data.check_in.split("T")[0]
          : new Date(data.check_in).toISOString().split("T")[0],
        check_out: typeof data.check_out === "string"
          ? data.check_out.split("T")[0]
          : new Date(data.check_out).toISOString().split("T")[0],
        total_price: data.total_price != null ? Number(data.total_price) : null,
        security_deposit_amount: data.security_deposit_amount != null ? Number(data.security_deposit_amount) : null,
        security_deposit_claimed_amount: data.security_deposit_claimed_amount != null ? Number(data.security_deposit_claimed_amount) : null,
      };
      setBooking(normalized);
      setNotesValue(normalized.notes ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await adminGet<{ logs: AuditLogEntry[] }>(
        `/api/admin/audit-logs?bookingId=${encodeURIComponent(bookingId)}&limit=100`
      );
      setAuditLogs(res.logs ?? []);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (auditOpen && auditLogs.length === 0 && !auditLoading) {
      loadAuditLogs();
    }
  }, [auditOpen, auditLogs.length, auditLoading, loadAuditLogs]);

  const loadEmails = useCallback(async () => {
    setEmailsLoading(true);
    try {
      const res = await adminGet<{ emails: EmailSendEntry[] }>(
        `/api/admin/bookings/${encodeURIComponent(bookingId)}/emails`
      );
      setEmails(res.emails ?? []);
    } catch {
      setEmails([]);
    } finally {
      setEmailsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (emailsOpen && emails.length === 0 && !emailsLoading) {
      loadEmails();
    }
  }, [emailsOpen, emails.length, emailsLoading, loadEmails]);

  const updateStatus = async (newStatus: string) => {
    setActionLoading("status");
    setError(null);
    try {
      await adminPut(`/api/admin/bookings/${bookingId}/status`, { status: newStatus });
      setSuccess(`Booking ${newStatus}`);
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = () => updateStatus("confirmed");
  const handleComplete = () => updateStatus("completed");

  const handleCancel = async () => {
    setShowCancelDialog(false);
    await updateStatus("cancelled");
  };

  const handleRefund = async () => {
    setShowRefundDialog(false);
    setActionLoading("refund");
    setError(null);
    try {
      await adminPost(`/api/admin/bookings/${bookingId}/refund`);
      setSuccess("Refund processed");
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process refund");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDepositRelease = async () => {
    setActionLoading("deposit-release");
    setError(null);
    try {
      await adminPost(`/api/admin/bookings/${bookingId}/deposit/release`);
      setSuccess("Security deposit released");
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to release deposit");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDepositClaim = async () => {
    if (!claimReason.trim()) {
      setError("Please enter a reason for the claim");
      return;
    }
    setShowClaimDialog(false);
    setActionLoading("deposit-claim");
    setError(null);
    try {
      await adminPost(`/api/admin/bookings/${bookingId}/deposit/claim`, {
        reason: claimReason.trim(),
      });
      setSuccess("Security deposit claimed");
      setClaimReason("");
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim deposit");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async () => {
    setActionLoading("sync");
    setError(null);
    try {
      await adminPost(`/api/admin/bookings/${bookingId}/sync`);
      setSuccess("Sync initiated");
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    setActionLoading("notes");
    setError(null);
    try {
      await adminPut(`/api/admin/bookings/${bookingId}`, { notes: notesValue });
      setSuccess("Notes updated");
      setEditingNotes(false);
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setActionLoading("delete");
    setError(null);
    try {
      await adminDelete(`/api/admin/bookings/${bookingId}`);
      router.push("/admin/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete booking");
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <Alert variant="error">Booking not found</Alert>
        <button
          onClick={() => router.push("/admin/bookings")}
          className="text-sm font-medium text-[#2d5a5a] hover:text-[#234848]"
        >
          Back to bookings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/bookings")}
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to bookings
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{booking.guest_name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Booking {booking.id.slice(0, 8)}... | {formatAccommodation(booking.accommodation)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[booking.status ?? ""] ?? "default"}>
            {booking.status ?? "unknown"}
          </Badge>
          <Badge variant={paymentVariant[booking.payment_status ?? ""] ?? "default"}>
            {booking.payment_status ?? "unknown"}
          </Badge>
        </div>
      </div>

      {(() => {
        if (booking.status === "cancelled" || booking.status === "completed") return null;
        const days = daysUntilCheckIn(booking.check_in);
        if (days < 0 || days > 3) return null;
        const label =
          days === 0 ? "Check-in is today" :
          days === 1 ? "Check-in is tomorrow" :
          `Check-in in ${days} days`;
        const unpaid = booking.payment_status !== "paid" && booking.payment_status !== "completed";
        const notConfirmed = booking.status !== "confirmed";
        const suffix = [
          unpaid ? "payment not settled" : null,
          notConfirmed ? "not yet confirmed" : null,
        ].filter(Boolean).join(" · ");
        return (
          <Alert variant={unpaid || notConfirmed ? "warning" : "info"}>
            {label}{suffix ? ` — ${suffix}` : ""}
          </Alert>
        );
      })()}

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Guest Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Guest Information</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-sm font-medium text-gray-900">{booking.guest_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-sm font-medium text-gray-900">{booking.guest_email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="text-sm font-medium text-gray-900">{booking.guest_phone ?? "-"}</dd>
            </div>
          </dl>
        </div>

        {/* Booking Details */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Booking Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Accommodation</dt>
              <dd className="text-sm font-medium text-gray-900">{formatAccommodation(booking.accommodation)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Check-in</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(booking.check_in)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Check-out</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(booking.check_out)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Guests</dt>
              <dd className="text-sm font-medium text-gray-900">{booking.guests}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total Price</dt>
              <dd className="text-sm font-bold text-gray-900">
                {booking.total_price != null ? formatCurrency(booking.total_price) : "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Source</dt>
              <dd className="text-sm font-medium text-gray-900">{booking.booking_source ?? "unknown"}</dd>
            </div>
            {booking.created_at && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm text-gray-600">{formatDateTime(booking.created_at)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Status Actions */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Status Management</h2>
          <div className="flex flex-wrap gap-2">
            {booking.status !== "confirmed" && (
              <button
                onClick={handleConfirm}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === "status" && <LoadingSpinner size="sm" className="text-white" />}
                Confirm
              </button>
            )}
            {booking.status !== "completed" && (
              <button
                onClick={handleComplete}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                Complete
              </button>
            )}
            {booking.status !== "cancelled" && (
              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Payment Section */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Payment Status</dt>
              <dd>
                <Badge variant={paymentVariant[booking.payment_status ?? ""] ?? "default"}>
                  {booking.payment_status ?? "unknown"}
                </Badge>
              </dd>
            </div>
            {booking.stripe_session_id && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Stripe Session</dt>
                <dd className="text-xs font-mono text-gray-600 max-w-[200px] truncate" title={booking.stripe_session_id}>
                  {booking.stripe_session_id}
                </dd>
              </div>
            )}
            {booking.stripe_payment_id && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Stripe Payment</dt>
                <dd className="text-xs font-mono text-gray-600 max-w-[200px] truncate" title={booking.stripe_payment_id}>
                  {booking.stripe_payment_id}
                </dd>
              </div>
            )}
          </dl>
          {booking.stripe_payment_id && booking.payment_status !== "refunded" && (
            <div className="mt-4">
              <button
                onClick={() => setShowRefundDialog(true)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading === "refund" && <LoadingSpinner size="sm" />}
                Process Refund
              </button>
            </div>
          )}
        </div>

        {/* Security Deposit */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Security Deposit</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <Badge variant={depositVariant[booking.security_deposit_status ?? ""] ?? "default"}>
                  {booking.security_deposit_status ?? "unknown"}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Amount</dt>
              <dd className="text-sm font-medium text-gray-900">
                {booking.security_deposit_amount != null
                  ? formatCurrency(booking.security_deposit_amount)
                  : "-"}
              </dd>
            </div>
            {booking.security_deposit_released_at && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Released At</dt>
                <dd className="text-sm text-gray-600">{formatDateTime(booking.security_deposit_released_at)}</dd>
              </div>
            )}
            {booking.security_deposit_claimed_amount != null && Number(booking.security_deposit_claimed_amount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Claimed Amount</dt>
                <dd className="text-sm font-medium text-red-600">
                  {formatCurrency(booking.security_deposit_claimed_amount)}
                </dd>
              </div>
            )}
          </dl>
          {booking.security_deposit_status === "pending" || booking.security_deposit_status === "held" ? (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDepositRelease}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === "deposit-release" && <LoadingSpinner size="sm" className="text-white" />}
                Release
              </button>
              <button
                onClick={() => setShowClaimDialog(true)}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading === "deposit-claim" && <LoadingSpinner size="sm" />}
                Claim
              </button>
            </div>
          ) : null}
        </div>

        {/* Uplisting Sync */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Uplisting Sync</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Sync Status</dt>
              <dd>
                <Badge variant={syncVariant[booking.uplisting_sync_status ?? ""] ?? "default"}>
                  {booking.uplisting_sync_status ?? "unknown"}
                </Badge>
              </dd>
            </div>
            {booking.uplisting_id && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Uplisting ID</dt>
                <dd className="text-sm font-mono text-gray-600">{booking.uplisting_id}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4">
            <button
              onClick={handleSync}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading === "sync" && <LoadingSpinner size="sm" />}
              {booking.uplisting_sync_status === "failed" ? "Retry Sync" : "Sync Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-sm font-medium text-[#2d5a5a] hover:text-[#234848]"
            >
              Edit
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a]"
              placeholder="Add notes about this booking..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                disabled={actionLoading === "notes"}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848] disabled:opacity-50"
              >
                {actionLoading === "notes" && <LoadingSpinner size="sm" className="text-white" />}
                Save
              </button>
              <button
                onClick={() => {
                  setEditingNotes(false);
                  setNotesValue(booking.notes ?? "");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            {booking.notes || "No notes"}
          </p>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <button
          onClick={() => setAuditOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
            <p className="text-sm text-gray-600">Every admin action on this booking.</p>
          </div>
          <span className="text-sm text-gray-500">{auditOpen ? "Hide" : "Show"}</span>
        </button>
        {auditOpen && (
          <div className="mt-4">
            {auditLoading && <LoadingSpinner size="sm" />}
            {!auditLoading && auditLogs.length === 0 && (
              <p className="text-sm text-gray-500">No audit entries for this booking yet.</p>
            )}
            {!auditLoading && auditLogs.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {auditLogs.map((entry) => (
                  <li key={entry.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="font-medium text-gray-900">{entry.action}</span>
                      <span className="text-gray-500">by {entry.admin_user}</span>
                      {entry.ip_address && (
                        <span className="text-xs text-gray-400">({entry.ip_address})</span>
                      )}
                      <span className="ml-auto text-xs text-gray-500">
                        {entry.created_at ? formatDateTime(entry.created_at) : "—"}
                      </span>
                    </div>
                    {entry.details != null && (
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Communications — emails sent about this booking */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <button
          onClick={() => setEmailsOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Communications</h2>
            <p className="text-sm text-gray-600">Every email sent for this booking.</p>
          </div>
          <span className="text-sm text-gray-500">{emailsOpen ? "Hide" : "Show"}</span>
        </button>
        {emailsOpen && (
          <div className="mt-4">
            {emailsLoading && <LoadingSpinner size="sm" />}
            {!emailsLoading && emails.length === 0 && (
              <p className="text-sm text-gray-500">No emails have been sent for this booking yet.</p>
            )}
            {!emailsLoading && emails.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {emails.map((entry) => (
                  <li key={entry.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="font-medium text-gray-900">
                        {emailTemplateLabels[entry.template] ?? entry.template}
                      </span>
                      <Badge variant={entry.status === "sent" ? "success" : "error"}>
                        {entry.status}
                      </Badge>
                      <span className="text-gray-500">→ {entry.recipient}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {formatDateTime(entry.sent_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{entry.subject}</p>
                    {entry.error && (
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-red-50 p-2 text-xs text-red-700">
                        {entry.error}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-700 mb-4">
          Soft-deleting a booking will hide it from all views. This action can be reversed at the database level.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          disabled={!!actionLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {actionLoading === "delete" && <LoadingSpinner size="sm" className="text-white" />}
          Delete Booking
        </button>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Booking"
        message={`Are you sure you want to delete the booking for ${booking.guest_name}? The booking will be soft-deleted and hidden from all views.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        loading={actionLoading === "delete"}
      />

      <ConfirmDialog
        open={showRefundDialog}
        title="Process Refund"
        message={`Are you sure you want to process a full refund for this booking? This will refund the payment through Stripe.`}
        confirmLabel="Refund"
        variant="warning"
        onConfirm={handleRefund}
        onCancel={() => setShowRefundDialog(false)}
        loading={actionLoading === "refund"}
      />

      <ConfirmDialog
        open={showCancelDialog}
        title="Cancel Booking"
        message={`Are you sure you want to cancel the booking for ${booking.guest_name}? Consider processing a refund if payment was made.`}
        confirmLabel="Cancel Booking"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
        loading={actionLoading === "status"}
      />

      {showClaimDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Claim Security Deposit</h3>
            <p className="mt-2 text-sm text-gray-600">
              Claiming captures the deposit hold. This is recorded in the audit log —
              please enter a reason.
            </p>
            <textarea
              value={claimReason}
              onChange={(e) => setClaimReason(e.target.value)}
              rows={3}
              placeholder="e.g. damage to pinot dome — see photos in notes"
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a]"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowClaimDialog(false); setClaimReason(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDepositClaim}
                disabled={!claimReason.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Claim Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

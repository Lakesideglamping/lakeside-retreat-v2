"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminGet } from "@/lib/admin-api";
import { DataTable } from "@/components/admin/ui/data-table";
import { SearchInput } from "@/components/admin/ui/search-input";
import { Badge } from "@/components/admin/ui/badge";
import { Alert } from "@/components/admin/ui/alert";

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  accommodation: string;
  check_in: string;
  check_out: string;
  status: string | null;
  payment_status: string | null;
  total_price: number | null;
  booking_source: string | null;
}

interface BookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const ACCOMMODATION_OPTIONS = [
  { value: "", label: "All Properties" },
  { value: "dome-pinot", label: "Dome Pinot" },
  { value: "dome-rose", label: "Dome Rosé" },
  { value: "lakeside-cottage", label: "Lakeside Cottage" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All Sources" },
  { value: "website", label: "Website" },
  { value: "manual", label: "Manual" },
  { value: "uplisting", label: "Uplisting" },
  { value: "airbnb", label: "Airbnb" },
  { value: "booking.com", label: "Booking.com" },
  { value: "unknown", label: "Unknown" },
];

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAccommodation(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function BookingList() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (accommodation) params.set("accommodation", accommodation);
      if (source) params.set("source", source);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await adminGet<BookingsResponse>(
        `/api/admin/bookings?${params.toString()}`
      );

      setBookings(
        res.bookings.map((b) => ({
          ...b,
          check_in: typeof b.check_in === "string"
            ? b.check_in.split("T")[0]
            : new Date(b.check_in).toISOString().split("T")[0],
          check_out: typeof b.check_out === "string"
            ? b.check_out.split("T")[0]
            : new Date(b.check_out).toISOString().split("T")[0],
          total_price: b.total_price != null ? Number(b.total_price) : null,
        }))
      );
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, accommodation, source, dateFrom, dateTo]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, accommodation, source, dateFrom, dateTo]);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/import-bookings", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      const summary = data.results
        .map((r: { property: string; imported: number; skipped: number; errors: number }) =>
          `${r.property}: +${r.imported} new, ${r.skipped} updated`
        )
        .join(" | ");
      setSyncResult(`Synced — ${summary}`);
      fetchBookings();
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (accommodation) params.set("accommodation", accommodation);
    if (source) params.set("source", source);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    window.open(`/api/admin/bookings/export?${params.toString()}`, "_blank");
  };

  const columns = [
    {
      key: "guest_name",
      header: "Guest",
      sortable: true,
      render: (_val: unknown, row: Booking) => (
        <div>
          <p className="font-medium text-gray-900">{row.guest_name}</p>
          <p className="text-xs text-gray-500">{row.guest_email}</p>
        </div>
      ),
    },
    {
      key: "accommodation",
      header: "Accommodation",
      sortable: true,
      render: (val: unknown) => formatAccommodation(String(val)),
    },
    {
      key: "check_in",
      header: "Check-in",
      sortable: true,
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: "check_out",
      header: "Check-out",
      sortable: true,
      render: (val: unknown) => formatDate(String(val)),
    },
    {
      key: "status",
      header: "Status",
      render: (val: unknown) => {
        const s = String(val ?? "unknown");
        return (
          <Badge variant={statusVariant[s] ?? "default"}>
            {s}
          </Badge>
        );
      },
    },
    {
      key: "payment_status",
      header: "Payment",
      render: (val: unknown) => {
        const s = String(val ?? "unknown");
        return (
          <Badge variant={paymentVariant[s] ?? "default"}>
            {s}
          </Badge>
        );
      },
    },
    {
      key: "total_price",
      header: "Amount",
      className: "text-right",
      sortable: true,
      render: (val: unknown) =>
        val != null ? formatCurrency(Number(val)) : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} total booking{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg border border-[#2d5a5a] px-4 py-2 text-sm font-medium text-[#2d5a5a] transition-colors hover:bg-[#2d5a5a]/10 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync from Uplisting"}
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => router.push("/admin/bookings/new")}
            className="rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848]"
          >
            New Booking
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {syncResult && (
        <Alert
          variant={syncResult.startsWith("Synced") ? "success" : "error"}
          dismissible
          onDismiss={() => setSyncResult(null)}
        >
          {syncResult}
        </Alert>
      )}

      {/* Filters */}
      <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search guest name or email..."
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={accommodation}
            onChange={(e) => setAccommodation(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a]"
          >
            {ACCOMMODATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a]"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a]"
            />
          </div>
          {(search || status || accommodation || source || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch("");
                setStatus("");
                setAccommodation("");
                setSource("");
                setDateFrom("");
                setDateTo("");
              }}
              className="text-sm font-medium text-[#2d5a5a] hover:text-[#234848]"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable<Booking & Record<string, unknown>>
        columns={columns}
        data={bookings as (Booking & Record<string, unknown>)[]}
        loading={loading}
        pagination={{
          page,
          totalPages,
          onPageChange: setPage,
        }}
        onRowClick={(row) => router.push(`/admin/bookings/${row.id}`)}
        emptyMessage="No bookings found matching your filters"
      />
    </div>
  );
}

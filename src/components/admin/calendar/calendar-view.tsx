"use client";

import { useState, useCallback } from "react";
import { adminGet, adminDelete } from "@/lib/admin-api";
import { BlockDatesForm } from "./block-dates-form";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";
import { Alert } from "@/components/admin/ui/alert";

interface BlockedDate {
  id: number;
  property: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  notes: string | null;
}

interface CalendarBooking {
  id: string;
  guest_name: string;
  accommodation: string;
  check_in: string;
  check_out: string;
  status: string | null;
  booking_source: string | null;
}

interface UplistingRange {
  from: string;
  to: string;
}

interface CalendarViewProps {
  initialBlockedDates: BlockedDate[];
  initialBookings: CalendarBooking[];
  initialYear: number;
  initialMonth: number;
  initialUplistingBlocked: Record<string, UplistingRange[]>;
  uplistingFetchFailed?: boolean;
}

const DAYS_VISIBLE = 28;
const DAY_WIDTH = 50;
const LEFT_COL = 210;

const PROPERTIES = [
  { id: "lakeside-cottage", label: "Lakeside Retreat in a Vineyard By Lake Dunstan" },
  { id: "dome-pinot", label: "Lakeside Glamping - Dome Pinot" },
  { id: "dome-rose", label: "Lakeside Glamping - Dome Rosé" },
];

const SOURCE_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  "booking.com": { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", label: "Booking.com" },
  "airbnb":      { bg: "#fce7f3", border: "#ec4899", text: "#9d174d", label: "Airbnb" },
  "website":     { bg: "#d1fae5", border: "#10b981", text: "#065f46", label: "Direct" },
  "uplisting":   { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6", label: "Uplisting" },
  "manual":      { bg: "#f3f4f6", border: "#9ca3af", text: "#374151", label: "Manual" },
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function todayNZ(): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()).split("/").reverse().join("-");
}

export function CalendarView({
  initialBlockedDates,
  initialBookings,
  initialUplistingBlocked,
  uplistingFetchFailed = false,
}: CalendarViewProps) {
  const today = todayNZ();

  const [startDate, setStartDate] = useState(() => addDays(today, -3));
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [blockedRes, bookingsRes] = await Promise.all([
        adminGet<{ blockedDates: BlockedDate[] }>("/api/admin/blocked-dates"),
        adminGet<{ bookings: CalendarBooking[]; total: number }>(
          "/api/admin/bookings?limit=500&status=confirmed"
        ),
      ]);
      setBlockedDates(blockedRes.blockedDates);
      setBookings(
        bookingsRes.bookings.map((b) => ({
          ...b,
          check_in: String(b.check_in).split("T")[0],
          check_out: String(b.check_out).split("T")[0],
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Build visible date array
  const dates: string[] = Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(startDate, i));
  const endDate = dates[dates.length - 1];

  function getBarStyle(checkIn: string, checkOut: string) {
    if (checkOut <= startDate || checkIn > endDate) return null;
    const clampedStart = checkIn < startDate ? startDate : checkIn;
    const clampedEnd = checkOut > addDays(endDate, 1) ? addDays(endDate, 1) : checkOut;
    const left = daysBetween(startDate, clampedStart) * DAY_WIDTH;
    const width = daysBetween(clampedStart, clampedEnd) * DAY_WIDTH;
    if (width <= 0) return null;
    return { left, width };
  }

  const handleBlockCreated = () => {
    setShowBlockForm(false);
    setSelectedDate(null);
    fetchData();
  };

  const handleDeleteBlocked = async (id: number) => {
    try {
      await adminDelete(`/api/admin/blocked-dates/${id}`);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete blocked date");
    }
  };

  // Format date range label
  const rangeLabel = `${new Date(startDate).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })} — ${new Date(endDate).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500">Manage availability and bookings</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <LoadingSpinner size="sm" />}
          <button
            onClick={() => { setSelectedDate(today); setShowBlockForm(true); }}
            className="rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white hover:bg-[#234848]"
          >
            Block Dates
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {uplistingFetchFailed && (
        <Alert variant="warning" title="Uplisting calendar unavailable">
          One or more properties failed to load from Uplisting. Cross-platform
          bookings (Airbnb / Booking.com) may be missing below. Check
          UPLISTING_API_KEY and the Uplisting status page.
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStartDate(addDays(startDate, -7))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={() => setStartDate(addDays(startDate, 7))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <button
          onClick={() => setStartDate(addDays(today, -3))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Today
        </button>
        <span className="text-sm text-gray-500">{rangeLabel}</span>
      </div>

      {/* Timeline */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div style={{ minWidth: LEFT_COL + DAYS_VISIBLE * DAY_WIDTH }}>

          {/* Date header */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div
              style={{ width: LEFT_COL, minWidth: LEFT_COL }}
              className="shrink-0 border-r border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500"
            >
              Property
            </div>
            {dates.map((date) => {
              const d = new Date(date + "T12:00:00");
              const isToday = date === today;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div
                  key={date}
                  style={{ width: DAY_WIDTH, minWidth: DAY_WIDTH }}
                  className={`shrink-0 border-r border-gray-100 px-0 py-1 text-center text-[10px] ${
                    isToday ? "bg-[#2d5a5a] text-white" : isWeekend ? "bg-gray-100 text-gray-600" : "text-gray-600"
                  }`}
                >
                  <div className="font-medium uppercase leading-tight">
                    {d.toLocaleDateString("en-NZ", { weekday: "short" })}
                  </div>
                  <div className={`text-sm font-bold leading-tight ${isToday ? "text-white" : "text-gray-900"}`}>
                    {d.getDate()}
                  </div>
                  <div className="leading-tight text-[9px] opacity-70">
                    {d.toLocaleDateString("en-NZ", { month: "short" })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Property rows */}
          {PROPERTIES.map((property, propIdx) => {
            const propBookings = bookings.filter((b) => b.accommodation === property.id);
            const propBlocked = blockedDates.filter((b) => b.property === property.id);
            const uplistingRanges = (initialUplistingBlocked[property.id] ?? []).filter((range) => {
              // Only show if not already covered by a DB booking
              return !propBookings.some((b) => b.check_in <= range.from && b.check_out >= addDays(range.to, 1));
            });

            return (
              <div
                key={property.id}
                className={`flex ${propIdx < PROPERTIES.length - 1 ? "border-b border-gray-200" : ""}`}
              >
                {/* Property label */}
                <div
                  style={{ width: LEFT_COL, minWidth: LEFT_COL }}
                  className="shrink-0 border-r border-gray-200 px-3 py-3 flex items-start"
                >
                  <span className="text-xs font-semibold text-gray-700 leading-tight">
                    {property.label}
                  </span>
                </div>

                {/* Timeline area */}
                <div
                  className="relative"
                  style={{ width: DAYS_VISIBLE * DAY_WIDTH, minHeight: 80 }}
                >
                  {/* Day cell backgrounds */}
                  <div className="absolute inset-0 flex">
                    {dates.map((date) => {
                      const d = new Date(date + "T12:00:00");
                      const isToday = date === today;
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div
                          key={date}
                          style={{ width: DAY_WIDTH }}
                          onClick={() => { setSelectedDate(date); setShowBlockForm(true); }}
                          className={`h-full shrink-0 cursor-pointer border-r border-gray-100 transition-colors hover:bg-blue-50/30 ${
                            isToday ? "bg-teal-50/40" : isWeekend ? "bg-gray-50/60" : ""
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Uplisting / external OTA blocked ranges */}
                  {uplistingRanges.map((range, i) => {
                    const style = getBarStyle(range.from, addDays(range.to, 1));
                    if (!style) return null;
                    return (
                      <div
                        key={`ext-${i}`}
                        className="absolute rounded flex items-center overflow-hidden pointer-events-none"
                        style={{
                          top: 10,
                          height: 36,
                          left: style.left + 2,
                          width: style.width - 4,
                          background: "#f3f4f6",
                          border: "1px solid #d1d5db",
                        }}
                      >
                        <span className="truncate px-2 text-[10px] font-medium text-gray-500">
                          Booked
                        </span>
                      </div>
                    );
                  })}

                  {/* DB bookings */}
                  {propBookings.map((booking) => {
                    const style = getBarStyle(booking.check_in, booking.check_out);
                    if (!style) return null;
                    const sourceKey = booking.booking_source?.toLowerCase() ?? "manual";
                    const s = SOURCE_STYLES[sourceKey] ?? SOURCE_STYLES.manual;
                    return (
                      <div
                        key={`bk-${booking.id}`}
                        className="absolute rounded flex items-center overflow-hidden"
                        style={{
                          top: 10,
                          height: 36,
                          left: style.left + 2,
                          width: style.width - 4,
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                        }}
                        title={`${booking.guest_name} — ${booking.check_in} to ${booking.check_out} (${s.label})`}
                      >
                        <div className="flex min-w-0 flex-col px-2 leading-tight">
                          <span
                            className="truncate text-[11px] font-semibold"
                            style={{ color: s.text }}
                          >
                            {booking.guest_name}
                          </span>
                          <span className="text-[9px]" style={{ color: s.text, opacity: 0.7 }}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Manual blocked dates (from our DB) */}
                  {propBlocked.map((blocked) => {
                    const style = getBarStyle(
                      blocked.start_date,
                      addDays(blocked.end_date, 1)
                    );
                    if (!style) return null;
                    return (
                      <div
                        key={`bl-${blocked.id}`}
                        className="group absolute flex items-center justify-between overflow-hidden rounded"
                        style={{
                          top: 52,
                          height: 18,
                          left: style.left + 2,
                          width: style.width - 4,
                          background: "#fee2e2",
                          border: "1px solid #fca5a5",
                        }}
                        title={`Blocked: ${blocked.reason ?? "no reason"}`}
                      >
                        <span className="truncate px-1.5 text-[9px] font-medium text-red-700">
                          {blocked.reason ?? "Blocked"}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteBlocked(blocked.id); }}
                          className="hidden group-hover:flex shrink-0 pr-1 text-[11px] text-red-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        {Object.entries(SOURCE_STYLES).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-3 w-6 rounded border" style={{ background: s.bg, borderColor: s.border }} />
            <span>{s.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded border border-gray-300 bg-gray-100" />
          <span>External/OTA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded border border-red-300 bg-red-100" />
          <span>Blocked</span>
        </div>
      </div>

      {/* Block dates modal */}
      <BlockDatesForm
        open={showBlockForm}
        onClose={() => { setShowBlockForm(false); setSelectedDate(null); }}
        onSuccess={handleBlockCreated}
        initialDate={selectedDate}
      />
    </div>
  );
}

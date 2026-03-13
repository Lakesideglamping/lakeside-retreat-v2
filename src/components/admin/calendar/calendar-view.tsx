"use client";

import { useState, useEffect, useCallback } from "react";
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
}

interface CalendarViewProps {
  initialBlockedDates: BlockedDate[];
  initialBookings: CalendarBooking[];
  initialYear: number;
  initialMonth: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PROPERTY_FILTERS = [
  { value: "all", label: "All" },
  { value: "dome-pinot", label: "Dome Pinot" },
  { value: "dome-rose", label: "Dome Rosé" },
  { value: "lakeside-cottage", label: "Cottage" },
];

const ACCOMMODATION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "dome-pinot": { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" },
  "dome-rose": { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300" },
  "lakeside-cottage": { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get Monday-based day of week (0=Mon, 6=Sun)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      date: d.toISOString().split("T")[0],
      dayNum: d.getDate(),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      date: date.toISOString().split("T")[0],
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill the grid
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d.toISOString().split("T")[0],
        dayNum: d.getDate(),
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function CalendarView({
  initialBlockedDates,
  initialBookings,
  initialYear,
  initialMonth,
}: CalendarViewProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialMonth = year === initialYear && month === initialMonth;

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
          check_in:
            typeof b.check_in === "string"
              ? b.check_in.split("T")[0]
              : new Date(b.check_in).toISOString().split("T")[0],
          check_out:
            typeof b.check_out === "string"
              ? b.check_out.split("T")[0]
              : new Date(b.check_out).toISOString().split("T")[0],
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when navigating away from the initial month
  useEffect(() => {
    if (!isInitialMonth) {
      fetchCalendarData();
    }
  }, [isInitialMonth, fetchCalendarData]);

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowBlockForm(true);
  };

  const handleBlockCreated = () => {
    setShowBlockForm(false);
    setSelectedDate(null);
    fetchCalendarData();
  };

  const handleDeleteBlocked = async (id: number) => {
    try {
      await adminDelete(`/api/admin/blocked-dates/${id}`);
      fetchCalendarData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete blocked date");
    }
  };

  const days = getMonthDays(year, month);
  const todayStr = new Date().toISOString().split("T")[0];

  const filteredBlockedDates =
    propertyFilter === "all"
      ? blockedDates
      : blockedDates.filter((b) => b.property === propertyFilter);

  const filteredBookings =
    propertyFilter === "all"
      ? bookings
      : bookings.filter((b) => b.accommodation === propertyFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage availability and blocked dates
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(todayStr);
            setShowBlockForm(true);
          }}
          className="rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848]"
        >
          Block Dates
        </button>
      </div>

      {error && (
        <Alert variant="error" title="Error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Property filter */}
      <div className="flex gap-2">
        {PROPERTY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setPropertyFilter(filter.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              propertyFilter === filter.value
                ? "bg-[#2d5a5a] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <button
          onClick={goToPrevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatMonthYear(year, month)}
          </h2>
          {loading && <LoadingSpinner size="sm" />}
          <button
            onClick={goToToday}
            className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Today
          </button>
        </div>
        <button
          onClick={goToNextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const isToday = day.date === todayStr;
            const dayBlocked = filteredBlockedDates.filter((b) =>
              isDateInRange(day.date, b.start_date, b.end_date)
            );
            const dayBookings = filteredBookings.filter((b) =>
              isDateInRange(day.date, b.check_in, b.check_out)
            );
            const isBlocked = dayBlocked.length > 0;

            return (
              <div
                key={i}
                onClick={() => handleDayClick(day.date)}
                className={`relative min-h-[100px] border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors hover:bg-gray-50 ${
                  !day.isCurrentMonth ? "bg-gray-50/50" : ""
                } ${isBlocked ? "bg-red-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      isToday
                        ? "bg-[#2d5a5a] font-bold text-white"
                        : day.isCurrentMonth
                        ? "font-medium text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {day.dayNum}
                  </span>
                  {isBlocked && (
                    <span className="text-xs text-red-600" title={dayBlocked.map((b) => `${b.property}: ${b.reason ?? "blocked"}`).join(", ")}>
                      blocked
                    </span>
                  )}
                </div>

                {/* Blocked date indicators */}
                {dayBlocked.map((blocked) => (
                  <div
                    key={`blocked-${blocked.id}`}
                    className="group mt-0.5 flex items-center justify-between rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-700"
                    title={`${blocked.property} - ${blocked.reason ?? "blocked"}${blocked.notes ? `: ${blocked.notes}` : ""}`}
                  >
                    <span className="truncate">{blocked.reason ?? "blocked"}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBlocked(blocked.id);
                      }}
                      className="ml-1 hidden shrink-0 text-red-500 hover:text-red-700 group-hover:inline"
                      title="Remove block"
                    >
                      x
                    </button>
                  </div>
                ))}

                {/* Booking bars */}
                {dayBookings.map((booking) => {
                  const colors = ACCOMMODATION_COLORS[booking.accommodation] ?? {
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                    border: "border-gray-300",
                  };
                  return (
                    <div
                      key={`booking-${booking.id}`}
                      className={`mt-0.5 truncate rounded border px-1 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border}`}
                      title={`${booking.guest_name} - ${booking.accommodation} (${booking.check_in} to ${booking.check_out})`}
                    >
                      {booking.guest_name}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-red-100 border border-red-300" />
          <span>Blocked</span>
        </div>
        {Object.entries(ACCOMMODATION_COLORS).map(([key, colors]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded ${colors.bg} border ${colors.border}`} />
            <span>{key.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
          </div>
        ))}
      </div>

      {/* Block dates modal */}
      <BlockDatesForm
        open={showBlockForm}
        onClose={() => {
          setShowBlockForm(false);
          setSelectedDate(null);
        }}
        onSuccess={handleBlockCreated}
        initialDate={selectedDate}
      />
    </div>
  );
}

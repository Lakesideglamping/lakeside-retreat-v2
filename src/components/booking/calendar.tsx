"use client";

import { useMemo, useState } from "react";

// How far ahead guests can page. 12 months matches typical short-stay
// rental booking windows and avoids pagination into indefinite future
// months where we have no calendar data anyway.
const MAX_MONTHS_AHEAD = 12;

interface CalendarDay {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
}

interface CalendarProps {
  blockedDates: string[];
  checkIn: string | null;
  checkOut: string | null;
  onDateSelect: (date: string) => void;
  minStay: number;
  loading?: boolean;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Format a Date as YYYY-MM-DD using its LOCAL components.
// Using `toISOString().split("T")[0]` converts to UTC first, which for NZ
// users (UTC+12/+13) lands on the previous day — the button shows "18" but
// the value sent to the API is "2026-04-17". Use local date parts to keep
// visible day and API value aligned.
function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: CalendarDay[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      date: toLocalDateString(d),
      dayNum: d.getDate(),
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      date: toLocalDateString(date),
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: toLocalDateString(d),
        dayNum: d.getDate(),
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString("en-NZ", {
    month: "long",
    year: "numeric",
  });
}

function MonthGrid({
  year,
  month,
  blockedSet,
  todayStr,
  checkIn,
  checkOut,
  onDateSelect,
}: {
  year: number;
  month: number;
  blockedSet: Set<string>;
  todayStr: string;
  checkIn: string | null;
  checkOut: string | null;
  onDateSelect: (date: string) => void;
}) {
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted py-2"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const isPast = day.date < todayStr;
          const isBlocked = blockedSet.has(day.date);
          const isDisabled =
            !day.isCurrentMonth || isPast || isBlocked;
          const isCheckIn = day.date === checkIn;
          const isCheckOut = day.date === checkOut;
          const isInRange =
            checkIn && checkOut && day.date > checkIn && day.date < checkOut;
          const isToday = day.date === todayStr;

          let cellClass =
            "relative h-11 flex items-center justify-center text-sm transition-colors ";

          if (!day.isCurrentMonth) {
            cellClass += "text-gray-300 ";
          } else if (isCheckIn) {
            cellClass +=
              "bg-burgundy text-white font-semibold rounded-l-full z-10 ";
          } else if (isCheckOut) {
            cellClass +=
              "bg-burgundy text-white font-semibold rounded-r-full z-10 ";
          } else if (isInRange) {
            cellClass += "bg-burgundy/10 text-body ";
          } else if (isBlocked) {
            cellClass +=
              "text-gray-300 line-through cursor-not-allowed ";
          } else if (isPast) {
            cellClass += "text-gray-300 cursor-not-allowed ";
          } else {
            cellClass +=
              "text-body hover:bg-burgundy/10 cursor-pointer ";
          }

          if (isToday && !isCheckIn && !isCheckOut) {
            cellClass += "ring-1 ring-teal rounded-md ";
          }

          return (
            <button
              key={`${day.date}-${i}`}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onDateSelect(day.date)}
              className={cellClass}
              aria-label={
                isBlocked
                  ? `${day.date} unavailable`
                  : isCheckIn
                    ? `Check-in: ${day.date}`
                    : isCheckOut
                      ? `Check-out: ${day.date}`
                      : day.date
              }
            >
              {day.dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BookingCalendar({
  blockedDates,
  checkIn,
  checkOut,
  onDateSelect,
  minStay,
  loading,
}: CalendarProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayStr = toLocalDateString(now);

  // Offset in months from the current month. 0 = current+next visible.
  // Each Prev/Next click shifts by 1 so guests can page forward to find
  // availability without losing their selection.
  const [monthOffset, setMonthOffset] = useState(0);

  const blockedSet = useMemo(
    () => new Set(blockedDates),
    [blockedDates]
  );

  const month1Date = new Date(currentYear, currentMonth + monthOffset, 1);
  const month1Year = month1Date.getFullYear();
  const month1Month = month1Date.getMonth();
  const month2Date = new Date(currentYear, currentMonth + monthOffset + 1, 1);
  const month2Year = month2Date.getFullYear();
  const month2Month = month2Date.getMonth();

  const canGoPrev = monthOffset > 0;
  const canGoNext = monthOffset < MAX_MONTHS_AHEAD - 1;

  const navButtons = (
    <div className="flex items-center justify-between mb-4">
      <button
        type="button"
        onClick={() => canGoPrev && setMonthOffset((o) => o - 1)}
        disabled={!canGoPrev}
        aria-label="Previous months"
        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-body hover:border-burgundy hover:text-burgundy transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-body"
      >
        &lsaquo;
      </button>
      <span className="text-xs text-muted">
        {monthOffset === 0 ? "This month" : `${monthOffset} month${monthOffset > 1 ? "s" : ""} ahead`}
      </span>
      <button
        type="button"
        onClick={() => canGoNext && setMonthOffset((o) => o + 1)}
        disabled={!canGoNext}
        aria-label="Next months"
        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-body hover:border-burgundy hover:text-burgundy transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-body"
      >
        &rsaquo;
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-burgundy border-t-transparent" />
        <span className="ml-3 text-muted text-sm">
          Loading availability...
        </span>
      </div>
    );
  }

  return (
    <div>
      {navButtons}

      {/* Desktop: two months side by side */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-8">
        <div>
          <h3 className="text-center font-semibold text-body mb-3">
            {formatMonthYear(month1Year, month1Month)}
          </h3>
          <MonthGrid
            year={month1Year}
            month={month1Month}
            blockedSet={blockedSet}
            todayStr={todayStr}
            checkIn={checkIn}
            checkOut={checkOut}
            onDateSelect={onDateSelect}
          />
        </div>
        <div>
          <h3 className="text-center font-semibold text-body mb-3">
            {formatMonthYear(month2Year, month2Month)}
          </h3>
          <MonthGrid
            year={month2Year}
            month={month2Month}
            blockedSet={blockedSet}
            todayStr={todayStr}
            checkIn={checkIn}
            checkOut={checkOut}
            onDateSelect={onDateSelect}
          />
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="sm:hidden space-y-6">
        <div>
          <h3 className="text-center font-semibold text-body mb-3">
            {formatMonthYear(month1Year, month1Month)}
          </h3>
          <MonthGrid
            year={month1Year}
            month={month1Month}
            blockedSet={blockedSet}
            todayStr={todayStr}
            checkIn={checkIn}
            checkOut={checkOut}
            onDateSelect={onDateSelect}
          />
        </div>
        <div>
          <h3 className="text-center font-semibold text-body mb-3">
            {formatMonthYear(month2Year, month2Month)}
          </h3>
          <MonthGrid
            year={month2Year}
            month={month2Month}
            blockedSet={blockedSet}
            todayStr={todayStr}
            checkIn={checkIn}
            checkOut={checkOut}
            onDateSelect={onDateSelect}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-burgundy" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-burgundy/10 border border-burgundy/20" />{" "}
          Your stay
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-200 line-through" />{" "}
          Unavailable
        </span>
      </div>

      {/* Hints */}
      {!checkIn && (
        <p className="text-center text-sm text-muted mt-3">
          Select your check-in date
        </p>
      )}
      {checkIn && !checkOut && (
        <p className="text-center text-sm text-muted mt-3">
          Now select your check-out date
          {minStay > 1 && (
            <span className="text-burgundy">
              {" "}
              (minimum {minStay} nights)
            </span>
          )}
        </p>
      )}
    </div>
  );
}

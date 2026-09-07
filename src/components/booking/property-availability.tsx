"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookingCalendar } from "./calendar";
import { applyDateClick, nightsBetween } from "@/lib/date-range";

interface Props {
  /** Accommodation id, e.g. "dome-pinot". */
  accommodationId: string;
  /** Minimum nights for this property. */
  minStay: number;
}

const NZ_DATE = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
});

function formatRange(checkIn: string, checkOut: string): string {
  const [ciY, ciM, ciD] = checkIn.split("-").map(Number);
  const [coY, coM, coD] = checkOut.split("-").map(Number);
  const from = NZ_DATE.format(new Date(ciY, ciM - 1, ciD));
  const to = NZ_DATE.format(new Date(coY, coM - 1, coD));
  const nights = nightsBetween(checkIn, checkOut);
  return `${from} → ${to} · ${nights} night${nights > 1 ? "s" : ""}`;
}

/**
 * Availability calendar for property pages.
 *
 * Guests pick a full range here and carry it through to the booking page, so
 * they never choose the same dates twice. Selection and validation come from
 * lib/date-range so this behaves identically to the booking widget's calendar.
 *
 * This was previously wrapped in `pointer-events-none` with a no-op handler,
 * which also disabled the month arrows — a guest could not look beyond the
 * first two months, and a calendar that renders hover states but ignores
 * clicks reads as broken.
 */
export function PropertyAvailability({ accommodationId, minStay }: Props) {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/blocked-dates?accommodation=${encodeURIComponent(accommodationId)}`
        );
        const data = await res.json();
        if (!cancelled && data.success) {
          setBlockedDates(data.blockedDates || []);
        }
      } catch {
        if (!cancelled) setBlockedDates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accommodationId]);

  function handleDateSelect(date: string) {
    const next = applyDateClick(date, checkIn, checkOut, blockedDates, minStay);
    setCheckIn(next.checkIn);
    setCheckOut(next.checkOut);
    setDateError(next.error);
  }

  // Carry whatever is chosen through to the booking page. Dates are only
  // added once the range is complete; a half-selection would leave the widget
  // showing a check-in with no check-out, which it treats as mid-selection.
  const bookHref =
    checkIn && checkOut
      ? `/book?a=${encodeURIComponent(accommodationId)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
      : `/book?a=${encodeURIComponent(accommodationId)}`;

  return (
    <div className="bg-cream/60 rounded-3xl p-6 sm:p-8 shadow-sm">
      <BookingCalendar
        blockedDates={blockedDates}
        checkIn={checkIn}
        checkOut={checkOut}
        onDateSelect={handleDateSelect}
        minStay={minStay}
        loading={loading}
      />

      {dateError && (
        <p
          role="status"
          className="mt-4 text-center text-sm text-burgundy bg-burgundy/5 rounded-lg px-4 py-3"
        >
          {dateError}
        </p>
      )}

      <div className="mt-6 text-center">
        {checkIn && checkOut && (
          <p className="mb-3 text-sm font-semibold text-body">
            {formatRange(checkIn, checkOut)}
            <button
              type="button"
              onClick={() => {
                setCheckIn(null);
                setCheckOut(null);
                setDateError("");
              }}
              className="ml-3 text-xs font-normal text-muted underline hover:text-burgundy"
            >
              Clear
            </button>
          </p>
        )}

        <Link
          href={bookHref}
          className="inline-flex items-center gap-2 bg-burgundy text-white no-underline px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px]"
        >
          {checkIn && checkOut ? "Book these dates" : "Check dates & book"} &rarr;
        </Link>

        <p className="text-xs text-muted mt-3">
          {checkIn && !checkOut
            ? "Now pick your check-out date."
            : "Greyed-out dates are already booked. Pick your dates, then continue."}
        </p>
      </div>
    </div>
  );
}

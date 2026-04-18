"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookingCalendar } from "./calendar";

interface Props {
  /** Accommodation id, e.g. "dome-pinot". */
  accommodationId: string;
  /** Minimum-stay hint passed through to the calendar legend/text. */
  minStay: number;
}

/**
 * Read-only availability calendar for property pages.
 *
 * Pulls blocked dates from /api/blocked-dates and renders the standard
 * BookingCalendar with a no-op date handler so guests can scan two months
 * at a glance before committing to the full booking flow.
 */
export function PropertyAvailability({ accommodationId, minStay }: Props) {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-cream/60 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="pointer-events-none">
        <BookingCalendar
          blockedDates={blockedDates}
          checkIn={null}
          checkOut={null}
          onDateSelect={() => {}}
          minStay={minStay}
          loading={loading}
        />
      </div>
      <div className="mt-6 text-center">
        <Link
          href={`/book?a=${accommodationId}`}
          className="inline-flex items-center gap-2 bg-burgundy text-white no-underline px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px]"
        >
          Check dates &amp; book &rarr;
        </Link>
        <p className="text-xs text-muted mt-3">
          Greyed-out dates are already booked. Pick yours on the booking page.
        </p>
      </div>
    </div>
  );
}

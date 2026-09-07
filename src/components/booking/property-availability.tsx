"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookingCalendar } from "./calendar";

interface Props {
  /** Accommodation id, e.g. "dome-pinot". */
  accommodationId: string;
  /** Minimum-stay hint passed through to the calendar legend/text. */
  minStay: number;
}

/**
 * Availability calendar for property pages.
 *
 * Pulls blocked dates from /api/blocked-dates and renders the standard
 * BookingCalendar so guests can scan two months at a glance. Clicking a date
 * carries it through to the booking page as the check-in, rather than making
 * the guest pick it again.
 *
 * This used to be wrapped in `pointer-events-none` with a no-op handler. That
 * killed the month arrows along with the dates, so a guest could not look
 * beyond the first two months — and a calendar that renders hover states but
 * ignores clicks reads as broken.
 */
export function PropertyAvailability({ accommodationId, minStay }: Props) {
  const router = useRouter();
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
      <BookingCalendar
        blockedDates={blockedDates}
        checkIn={null}
        checkOut={null}
        // Hand the chosen day to the booking page as the check-in. The
        // calendar already refuses past and blocked dates, so anything that
        // reaches here is selectable. The booking widget re-validates it
        // anyway — a URL can be edited by hand.
        onDateSelect={(date) =>
          router.push(
            `/book?a=${encodeURIComponent(accommodationId)}&checkIn=${encodeURIComponent(date)}`
          )
        }
        minStay={minStay}
        loading={loading}
      />
      <div className="mt-6 text-center">
        <Link
          href={`/book?a=${accommodationId}`}
          className="inline-flex items-center gap-2 bg-burgundy text-white no-underline px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px]"
        >
          Check dates &amp; book &rarr;
        </Link>
        <p className="text-xs text-muted mt-3">
          Greyed-out dates are already booked. Pick a date to start your booking.
        </p>
      </div>
    </div>
  );
}

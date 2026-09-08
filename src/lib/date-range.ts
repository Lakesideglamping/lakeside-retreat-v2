/**
 * Date-range helpers shared by the booking widget and the property-page
 * availability calendar.
 *
 * These live here rather than inside a component because both calendars must
 * agree exactly. When the property page gained range selection, copying the
 * logic across would have meant two chances to get the timezone handling
 * wrong — and it had already been wrong once: mixing `new Date("YYYY-MM-DD")`
 * (UTC midnight) with `new Date(y, m, d)` (local midnight) made every stay
 * count one night short under NZDT.
 *
 * Every function here parses date strings the same way: local midnight.
 */

/** Parse "YYYY-MM-DD" as local midnight. */
function toLocalMidnight(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date back to "YYYY-MM-DD" in local time. */
function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Nights between two dates. Both ends are parsed as local midnight, so the
 * result is a whole number of nights regardless of daylight saving.
 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = toLocalMidnight(checkOut).getTime() - toLocalMidnight(checkIn).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * The first blocked night within a stay, or null if the range is clear.
 *
 * Only the nights actually slept in are checked — the check-out day is
 * excluded, since the guest leaves that morning and someone else may arrive.
 */
export function firstBlockedNight(
  checkIn: string,
  checkOut: string,
  blockedDates: Iterable<string>
): string | null {
  const blocked = blockedDates instanceof Set ? blockedDates : new Set(blockedDates);
  const end = toLocalMidnight(checkOut);
  const current = toLocalMidnight(checkIn);
  current.setDate(current.getDate() + 1);

  while (current < end) {
    const dateStr = toDateString(current);
    if (blocked.has(dateStr)) return dateStr;
    current.setDate(current.getDate() + 1);
  }
  return null;
}

export type RangeValidation = { ok: true } | { ok: false; error: string };

/**
 * Validate a proposed stay: no blocked nights inside it, and long enough to
 * meet the property's minimum.
 */
export function validateStayRange(
  checkIn: string,
  checkOut: string,
  blockedDates: Iterable<string>,
  minStay: number
): RangeValidation {
  if (firstBlockedNight(checkIn, checkOut, blockedDates)) {
    return {
      ok: false,
      error:
        "Your selected range includes unavailable dates. Please choose different dates.",
    };
  }

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < minStay) {
    return {
      ok: false,
      error: `Minimum stay is ${minStay} night${minStay > 1 ? "s" : ""}. Please select a later check-out date.`,
    };
  }

  return { ok: true };
}

/**
 * Apply a calendar click to the current selection and return the next one.
 *
 * Shared so both calendars behave identically: the first click sets check-in,
 * the second sets check-out, a click on or before check-in restarts, and a
 * click while a complete range is showing starts over.
 */
export function applyDateClick(
  date: string,
  checkIn: string | null,
  checkOut: string | null,
  blockedDates: Iterable<string>,
  minStay: number
): { checkIn: string | null; checkOut: string | null; error: string } {
  // No selection yet, or the previous range is complete — start again.
  if (!checkIn || checkOut) {
    return { checkIn: date, checkOut: null, error: "" };
  }

  // Clicking on or before check-in restarts from the new date.
  if (date <= checkIn) {
    return { checkIn: date, checkOut: null, error: "" };
  }

  const result = validateStayRange(checkIn, date, blockedDates, minStay);
  if (!result.ok) {
    // A blocked range restarts from the clicked date; too-short keeps the
    // existing check-in so the guest can simply pick a later check-out.
    const blocked = firstBlockedNight(checkIn, date, blockedDates) !== null;
    return blocked
      ? { checkIn: date, checkOut: null, error: result.error }
      : { checkIn, checkOut: null, error: result.error };
  }

  return { checkIn, checkOut: date, error: "" };
}

/**
 * Which month the calendar should open on.
 *
 * Normally the current month, but if a check-in is already selected — say it
 * arrived as a deep link from a property page — open on that month instead so
 * the selection is actually visible. Clamped to the same range the Prev/Next
 * buttons allow, so a far-future date cannot strand the view past the end.
 */
export function initialMonthOffset(
  checkIn: string | null,
  currentYear: number,
  currentMonth: number,
  maxMonthsAhead: number
): number {
  if (!checkIn) return 0;

  const [y, m] = checkIn.split("-").map(Number);
  if (!y || !m) return 0;

  const offset = (y - currentYear) * 12 + (m - 1 - currentMonth);
  return Math.min(Math.max(offset, 0), maxMonthsAhead - 1);
}

/**
 * A date N days later, staying in local time throughout.
 *
 * The naive version — `new Date(str)` then setDate() then toISOString() —
 * mixes a UTC parse with local arithmetic and a UTC readback. It works most of
 * the year and silently fails on the day NZ clocks go forward: advancing from
 * 2026-09-26 returned 2026-09-26 again, because 12:00 local on the 27th is
 * 23:00 UTC on the 26th.
 */
export function addDays(date: string, days: number): string {
  const d = toLocalMidnight(date);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/**
 * Format a moment as YYYY-MM-DD in New Zealand time.
 *
 * The property is in Cromwell, so "today" always means today in New Zealand —
 * never the server's today, nor the viewer's. Those differ for a large part of
 * each day: Render runs UTC, which is 12–13 hours behind, so from NZ midnight
 * until midday the server still believes it is yesterday.
 *
 * Use this for any moment-to-date conversion. Pure calendar arithmetic on date
 * strings (see addDays) needs no timezone and must not use this.
 */
export function nzDateString(date: Date = new Date()): string {
  // en-CA formats as ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Today's date in New Zealand, as YYYY-MM-DD. */
export function nzToday(): string {
  return nzDateString(new Date());
}

/**
 * True when a date string is before today in New Zealand.
 *
 * Compares strings, not Dates: YYYY-MM-DD sorts lexicographically, so this
 * avoids re-introducing a timezone at the point of comparison.
 */
export function isPastInNZ(date: string): boolean {
  return date < nzToday();
}

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

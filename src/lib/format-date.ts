/**
 * Date display that does not depend on where the code happens to run.
 *
 * Two different things get formatted in this codebase, and they go wrong in
 * different ways when formatted the naive way (`new Date(x).toLocaleDateString()`):
 *
 *   - A calendar date — a check-in, a check-out, a promo's valid-from. There is
 *     no time of day and no timezone; "21 November" is 21 November in Cromwell
 *     and nowhere else matters. These arrive as "YYYY-MM-DD" strings from the
 *     booking form and Stripe metadata, or as Prisma `@db.Date` values, which
 *     are JS Dates (or ISO strings) pinned to UTC midnight. Formatting them in
 *     the server's or browser's local zone is right only while that zone is at
 *     or east of UTC. Render is UTC today, so it works — by luck. Anyone west
 *     of Greenwich looking at the admin, or a future region change, would see
 *     every stay a day early.
 *
 *   - A moment — created_at, sent_at, "alert fired at". These must be shown as
 *     New Zealand wall-clock time, whatever the server or viewer uses.
 *
 * Each has its own function here. Callers pick by what the value *is*, not by
 * what type it arrives as.
 */

const NZ_TIME_ZONE = "Pacific/Auckland";
const DEFAULT_LOCALE = "en-NZ";

type CalendarDateInput = string | Date | null | undefined;
type MomentInput = string | Date | number | null | undefined;

interface CalendarParts {
  year: number;
  month: number; // 1-12
  day: number;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
// How a @db.Date column serialises through JSON: midnight UTC, no offset.
const UTC_MIDNIGHT_ISO = /^(\d{4})-(\d{2})-(\d{2})T00:00:00(?:\.000)?Z$/;

function nzParts(moment: Date): CalendarParts | null {
  if (Number.isNaN(moment.getTime())) return null;
  // en-CA gives ISO-style YYYY-MM-DD.
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: NZ_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(moment)
    .split("-")
    .map(Number);
  return { year: y, month: m, day: d };
}

/**
 * The calendar date a value denotes.
 *
 * "YYYY-MM-DD" and a UTC-midnight ISO string are read literally. A Date at
 * UTC midnight (what Prisma returns for @db.Date) is read by its UTC fields.
 * Anything else is a real moment, and the honest calendar date for a moment at
 * this property is the New Zealand one.
 */
export function calendarDateParts(input: CalendarDateInput): CalendarParts | null {
  if (input === null || input === undefined || input === "") return null;

  if (typeof input === "string") {
    const literal = DATE_ONLY.exec(input) ?? UTC_MIDNIGHT_ISO.exec(input);
    if (literal) {
      return { year: Number(literal[1]), month: Number(literal[2]), day: Number(literal[3]) };
    }
    return nzParts(new Date(input));
  }

  if (Number.isNaN(input.getTime())) return null;
  const isUtcMidnight =
    input.getUTCHours() === 0 &&
    input.getUTCMinutes() === 0 &&
    input.getUTCSeconds() === 0 &&
    input.getUTCMilliseconds() === 0;
  if (isUtcMidnight) {
    return { year: input.getUTCFullYear(), month: input.getUTCMonth() + 1, day: input.getUTCDate() };
  }
  return nzParts(input);
}

/**
 * Format a calendar date (check-in, check-out, stay date) identically on
 * every server and in every browser.
 *
 * Unparseable input comes back as the raw text rather than "Invalid Date", so
 * a bad value in an email reads as what it is instead of as a bug.
 */
export function formatCalendarDate(
  input: CalendarDateInput,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = DEFAULT_LOCALE
): string {
  const parts = calendarDateParts(input);
  if (!parts) return input instanceof Date ? "" : (input ?? "");
  // Re-anchor at UTC midnight and format in UTC: the zone cancels out, so the
  // output is the calendar date whatever TZ the process or browser is in.
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
    Date.UTC(parts.year, parts.month - 1, parts.day)
  );
}

/**
 * Format a moment (created_at, sent_at, "now") as New Zealand wall-clock time.
 */
export function formatNZDateTime(
  input: MomentInput,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = DEFAULT_LOCALE
): string {
  if (input === null || input === undefined || input === "") return "";
  const moment = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(moment.getTime())) return typeof input === "string" ? input : "";
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: NZ_TIME_ZONE }).format(moment);
}

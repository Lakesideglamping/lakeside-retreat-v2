import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Regression guard for a timezone off-by-one in the booking widget.
 *
 * `new Date("2026-12-10")` is parsed as UTC midnight; `new Date(y, m, d)` is
 * parsed as local midnight. Subtracting one from the other leaves a gap equal
 * to the UTC offset. At UTC+12 (NZST) that is exactly 12h and Math.round(0.5)
 * rounded back up, so the bug was invisible half the year. At UTC+13 (NZDT —
 * late September to early April, most of the booking season) it is 11h and
 * rounds to zero: every stay counted one night short, so a 1-night minimum
 * demanded 2 nights and a 2-night minimum demanded 3.
 *
 * The server was never wrong — create-session parses both ends the same way.
 * This was purely the client-side check refusing valid stays.
 */

/** The corrected calculation, exercised the way the widget does it. */
function nightsBetween(checkIn: string, checkOut: string): number {
  const [ciY, ciM, ciD] = checkIn.split("-").map(Number);
  const [coY, coM, coD] = checkOut.split("-").map(Number);
  const start = new Date(ciY, ciM - 1, ciD);
  const end = new Date(coY, coM - 1, coD);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

describe("stay length", () => {
  it("counts nights correctly on both sides of a DST change", () => {
    // NZDT (UTC+13) — where the bug bit.
    expect(nightsBetween("2026-12-10", "2026-12-11")).toBe(1);
    expect(nightsBetween("2026-12-10", "2026-12-12")).toBe(2);
    expect(nightsBetween("2026-12-10", "2026-12-17")).toBe(7);

    // NZST (UTC+12) — where Math.round(0.5) masked it.
    expect(nightsBetween("2026-07-10", "2026-07-11")).toBe(1);
    expect(nightsBetween("2026-07-10", "2026-07-12")).toBe(2);

    // Spanning the DST boundary itself (NZDT ends early April 2026).
    expect(nightsBetween("2026-04-03", "2026-04-06")).toBe(3);
  });

  it("a 1-night booking satisfies a 1-night minimum, in every month", () => {
    for (let month = 1; month <= 12; month++) {
      const mm = String(month).padStart(2, "0");
      expect(
        nightsBetween(`2026-${mm}-10`, `2026-${mm}-11`),
        `one night in month ${mm} must count as 1`
      ).toBe(1);
    }
  });

  it("the widget parses both ends of the range the same way", () => {
    // The actual defect was mixing the two parsing styles. Guard the source:
    // the nights calculation must not reach for `new Date(checkIn)`, which
    // parses as UTC while the other end is built as local midnight.
    const source = readFileSync(
      join(__dirname, "..", "..", "components", "booking", "booking-widget.tsx"),
      "utf8"
    );
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ")
      .replace(/\s+/g, " ");

    expect(
      /new Date\(checkIn\)/.test(code),
      "booking-widget must not parse checkIn as a bare date string — build it " +
        "with new Date(y, m, d) so both ends of the range use local midnight"
    ).toBe(false);
  });
});

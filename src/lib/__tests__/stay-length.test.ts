import { describe, it, expect } from "vitest";
import {
  nightsBetween,
  firstBlockedNight,
  validateStayRange,
  applyDateClick,
  initialMonthOffset,
  addDays,
} from "../date-range";

/**
 * These cover the logic shared by the booking widget and the property-page
 * availability calendar.
 *
 * The original defect: `new Date("2026-12-10")` parses as UTC midnight while
 * `new Date(y, m, d)` is local midnight. Subtracting one from the other left a
 * gap equal to the UTC offset. At UTC+12 (NZST) that is exactly 12h and
 * Math.round(0.5) rounded back up, hiding it half the year; at UTC+13 (NZDT —
 * late September to early April, most of the booking season) it is 11h and
 * rounds to zero, so every stay counted one night short. A 1-night minimum
 * demanded 2 nights and the cottage's 2-night minimum demanded 3.
 */

describe("nightsBetween", () => {
  it("counts correctly on both sides of a DST change", () => {
    // NZDT (UTC+13) — where the bug bit.
    expect(nightsBetween("2026-12-10", "2026-12-11")).toBe(1);
    expect(nightsBetween("2026-12-10", "2026-12-12")).toBe(2);
    expect(nightsBetween("2026-12-10", "2026-12-17")).toBe(7);

    // NZST (UTC+12) — where Math.round(0.5) masked it.
    expect(nightsBetween("2026-07-10", "2026-07-11")).toBe(1);
    expect(nightsBetween("2026-07-10", "2026-07-12")).toBe(2);

    // Spanning the DST boundary itself.
    expect(nightsBetween("2026-04-03", "2026-04-06")).toBe(3);
    expect(nightsBetween("2026-09-24", "2026-09-30")).toBe(6);
  });

  it("a 1-night booking counts as 1 in every month", () => {
    for (let month = 1; month <= 12; month++) {
      const mm = String(month).padStart(2, "0");
      expect(
        nightsBetween(`2026-${mm}-10`, `2026-${mm}-11`),
        `one night in month ${mm}`
      ).toBe(1);
    }
  });
});

describe("firstBlockedNight", () => {
  it("ignores the check-out day — the guest leaves that morning", () => {
    // Someone else may check in on the day this guest leaves, so a booking
    // on the check-out date must not block the stay.
    expect(firstBlockedNight("2026-10-10", "2026-10-12", ["2026-10-12"])).toBeNull();
  });

  it("finds a blocked night inside the stay", () => {
    expect(firstBlockedNight("2026-10-10", "2026-10-14", ["2026-10-12"])).toBe(
      "2026-10-12"
    );
  });

  it("ignores the check-in day itself", () => {
    expect(firstBlockedNight("2026-10-10", "2026-10-12", ["2026-10-10"])).toBeNull();
  });

  it("returns null for a clear range", () => {
    expect(firstBlockedNight("2026-10-10", "2026-10-14", [])).toBeNull();
  });
});

describe("validateStayRange", () => {
  it("accepts a stay that meets the minimum", () => {
    expect(validateStayRange("2026-12-10", "2026-12-12", [], 2)).toEqual({ ok: true });
  });

  it("rejects a stay shorter than the minimum", () => {
    const result = validateStayRange("2026-12-10", "2026-12-11", [], 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Minimum stay is 2 nights/);
  });

  it("accepts exactly the minimum, including during NZDT", () => {
    expect(validateStayRange("2026-12-10", "2026-12-11", [], 1)).toEqual({ ok: true });
    expect(validateStayRange("2026-12-10", "2026-12-12", [], 2)).toEqual({ ok: true });
  });

  it("rejects a range containing a blocked night", () => {
    const result = validateStayRange("2026-10-10", "2026-10-14", ["2026-10-12"], 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unavailable dates/);
  });
});

describe("applyDateClick", () => {
  it("first click sets check-in", () => {
    expect(applyDateClick("2026-10-10", null, null, [], 1)).toEqual({
      checkIn: "2026-10-10",
      checkOut: null,
      error: "",
    });
  });

  it("second click completes the range", () => {
    expect(applyDateClick("2026-10-12", "2026-10-10", null, [], 1)).toEqual({
      checkIn: "2026-10-10",
      checkOut: "2026-10-12",
      error: "",
    });
  });

  it("clicking with a complete range starts over", () => {
    expect(applyDateClick("2026-11-01", "2026-10-10", "2026-10-12", [], 1)).toEqual({
      checkIn: "2026-11-01",
      checkOut: null,
      error: "",
    });
  });

  it("clicking on or before check-in restarts from there", () => {
    expect(applyDateClick("2026-10-08", "2026-10-10", null, [], 1)).toEqual({
      checkIn: "2026-10-08",
      checkOut: null,
      error: "",
    });
    expect(applyDateClick("2026-10-10", "2026-10-10", null, [], 1)).toEqual({
      checkIn: "2026-10-10",
      checkOut: null,
      error: "",
    });
  });

  it("keeps check-in when the range is merely too short, so a later date can be picked", () => {
    const next = applyDateClick("2026-10-11", "2026-10-10", null, [], 2);
    expect(next.checkIn).toBe("2026-10-10");
    expect(next.checkOut).toBeNull();
    expect(next.error).toMatch(/Minimum stay is 2 nights/);
  });

  it("restarts from the clicked date when the range spans a blocked night", () => {
    const next = applyDateClick("2026-10-14", "2026-10-10", null, ["2026-10-12"], 1);
    expect(next.checkIn).toBe("2026-10-14");
    expect(next.checkOut).toBeNull();
    expect(next.error).toMatch(/unavailable dates/);
  });
});

describe("initialMonthOffset", () => {
  // "Today" is September 2026 — month index 8.
  const Y = 2026;
  const M = 8;
  const MAX = 12;

  it("opens on the current month when nothing is selected", () => {
    expect(initialMonthOffset(null, Y, M, MAX)).toBe(0);
  });

  it("opens on the check-in month", () => {
    expect(initialMonthOffset("2026-09-20", Y, M, MAX)).toBe(0);
    expect(initialMonthOffset("2026-10-05", Y, M, MAX)).toBe(1);
    // The reported bug: a date three months out was selected but the
    // calendar still opened on the current two months, hiding it.
    expect(initialMonthOffset("2026-12-24", Y, M, MAX)).toBe(3);
  });

  it("counts correctly across a year boundary", () => {
    expect(initialMonthOffset("2027-03-10", Y, M, MAX)).toBe(6);
    expect(initialMonthOffset("2027-01-01", Y, M, MAX)).toBe(4);
  });

  it("clamps rather than stranding the view outside the pageable range", () => {
    expect(initialMonthOffset("2027-09-01", Y, M, MAX)).toBe(MAX - 1);
    expect(initialMonthOffset("2028-05-01", Y, M, MAX)).toBe(MAX - 1);
    // A past date should never scroll the calendar backwards.
    expect(initialMonthOffset("2026-01-05", Y, M, MAX)).toBe(0);
  });

  it("ignores an unparseable value", () => {
    expect(initialMonthOffset("not-a-date", Y, M, MAX)).toBe(0);
  });
});

describe("addDays", () => {
  /**
   * The admin calendar built dates with new Date(str) + setDate() +
   * toISOString(): a UTC parse, local arithmetic, then a UTC readback. It
   * worked all year except the day NZ clocks go forward, when advancing from
   * 2026-09-26 returned 2026-09-26 again — 12:00 local on the 27th is 23:00
   * UTC on the 26th. One day a year the calendar would render a booking
   * short and split a blocked range in two.
   */
  it("advances across the spring-forward boundary", () => {
    expect(addDays("2026-09-26", 1)).toBe("2026-09-27");
    expect(addDays("2026-09-27", 1)).toBe("2026-09-28");
  });

  it("advances across the autumn fall-back boundary", () => {
    expect(addDays("2027-04-03", 1)).toBe("2027-04-04");
    expect(addDays("2027-04-04", 1)).toBe("2027-04-05");
  });

  it("handles ordinary days in both NZST and NZDT", () => {
    expect(addDays("2026-06-10", 1)).toBe("2026-06-11");
    expect(addDays("2026-12-10", 1)).toBe("2026-12-11");
  });

  it("crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29"); // leap year
  });

  it("goes backwards too", () => {
    expect(addDays("2026-09-27", -1)).toBe("2026-09-26");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("stays consistent over a long run spanning both transitions", () => {
    let cur = "2026-09-01";
    for (let i = 0; i < 250; i++) cur = addDays(cur, 1);
    // 250 days from 1 Sept 2026, crossing both DST changes.
    expect(cur).toBe(addDays("2026-09-01", 250));
    expect(nightsBetween("2026-09-01", cur)).toBe(250);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { calendarDateParts, formatCalendarDate, formatNZDateTime } from "../format-date";

/**
 * The property these guard: the text a guest or the host reads for a date
 * must be the same whichever timezone the process runs in. Render is UTC,
 * developers' machines are NZ, and a browser can be anywhere.
 *
 * Node re-reads process.env.TZ at runtime, so each case is run under three
 * zones that bracket the problem: west of UTC (where the naive code fails),
 * UTC itself (production today), and New Zealand.
 */
const ZONES = ["America/Los_Angeles", "UTC", "Pacific/Auckland"];
const ORIGINAL_TZ = process.env.TZ;

afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

function inEveryZone(run: () => string): string[] {
  return ZONES.map((tz) => {
    process.env.TZ = tz;
    return run();
  });
}

const LONG: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

describe("formatCalendarDate", () => {
  it("formats a YYYY-MM-DD string the same in every timezone", () => {
    const out = inEveryZone(() => formatCalendarDate("2026-11-21", LONG));
    expect(new Set(out).size).toBe(1);
    expect(out[0]).toBe("Saturday, 21 November 2026");
  });

  it("reads a @db.Date serialised through JSON (UTC midnight ISO) literally", () => {
    const out = inEveryZone(() => formatCalendarDate("2026-11-21T00:00:00.000Z", LONG));
    expect(new Set(out).size).toBe(1);
    expect(out[0]).toBe("Saturday, 21 November 2026");
  });

  it("reads a Date at UTC midnight (what Prisma returns for @db.Date) by its UTC fields", () => {
    const out = inEveryZone(() => formatCalendarDate(new Date("2026-11-21T00:00:00.000Z"), LONG));
    expect(new Set(out).size).toBe(1);
    expect(out[0]).toBe("Saturday, 21 November 2026");
  });

  it("the naive approach it replaces really does drift a day west of UTC", () => {
    // Documents the failure mode, so nobody "simplifies" this back.
    process.env.TZ = "America/Los_Angeles";
    const naive = new Date("2026-11-21").toLocaleDateString("en-NZ", LONG);
    expect(naive).toBe("Friday, 20 November 2026");
    expect(formatCalendarDate("2026-11-21", LONG)).toBe("Saturday, 21 November 2026");
  });

  it("gives a real moment its New Zealand calendar date", () => {
    // 10:00 on the 21st in Cromwell is still the 20th in UTC.
    const out = inEveryZone(() => formatCalendarDate("2026-11-21T10:00:00+13:00", LONG));
    expect(new Set(out).size).toBe(1);
    expect(out[0]).toBe("Saturday, 21 November 2026");
  });

  it("honours the locale argument", () => {
    expect(
      formatCalendarDate("2026-11-21", { month: "short", day: "numeric", year: "numeric" }, "en-US")
    ).toBe("Nov 21, 2026");
  });

  it("uses en-NZ numeric form by default", () => {
    expect(formatCalendarDate("2026-05-12")).toBe("12/05/2026");
  });

  it("returns empty or the raw text for nothing or garbage rather than Invalid Date", () => {
    expect(formatCalendarDate(null)).toBe("");
    expect(formatCalendarDate(undefined)).toBe("");
    expect(formatCalendarDate("")).toBe("");
    expect(formatCalendarDate("not a date")).toBe("not a date");
    expect(formatCalendarDate(new Date("nope"))).toBe("");
  });
});

describe("calendarDateParts", () => {
  it("returns numeric parts for each accepted shape", () => {
    expect(calendarDateParts("2026-02-03")).toEqual({ year: 2026, month: 2, day: 3 });
    expect(calendarDateParts("2026-02-03T00:00:00Z")).toEqual({ year: 2026, month: 2, day: 3 });
    expect(calendarDateParts(new Date(Date.UTC(2026, 1, 3)))).toEqual({ year: 2026, month: 2, day: 3 });
  });
});

describe("formatNZDateTime", () => {
  it("shows New Zealand wall-clock time whatever the process timezone", () => {
    // 04:55 UTC on 27 Oct 2026 is 17:55 NZDT the same day.
    const out = inEveryZone(() =>
      formatNZDateTime("2026-10-27T04:55:15Z", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
    expect(new Set(out).size).toBe(1);
    expect(out[0]).toContain("27 Oct 2026");
    expect(out[0]).toContain("17:55");
  });

  it("crosses the date line correctly", () => {
    // 14:00 UTC on the 26th is already 03:00 on the 27th in NZ.
    const text = formatNZDateTime(new Date("2026-10-26T14:00:00Z"), {
      day: "numeric",
      month: "short",
    });
    expect(text).toBe("27 Oct");
  });

  it("returns empty or raw text for nothing or garbage", () => {
    expect(formatNZDateTime(null)).toBe("");
    expect(formatNZDateTime("")).toBe("");
    expect(formatNZDateTime("garbage")).toBe("garbage");
  });
});

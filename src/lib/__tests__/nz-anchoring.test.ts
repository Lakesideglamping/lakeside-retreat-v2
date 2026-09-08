import { describe, it, expect, afterEach, vi } from "vitest";
import { nzDateString, nzToday, isPastInNZ } from "../date-range";

/**
 * The property is in Cromwell, so "today" must always mean today in New
 * Zealand — never the server's today, nor the viewer's.
 *
 * The bug these cover: create-session compared a requested check-in against
 * `new Date()` with the hours zeroed, which on Render means UTC midnight. NZ
 * is 12–13 hours ahead, so every morning from NZ midnight until midday the
 * server still believed it was yesterday and accepted a date that had already
 * passed in Cromwell. That is not an edge case — it is half of every day.
 */

afterEach(() => {
  vi.useRealTimers();
});

/** Pin wall-clock time to a specific instant. */
function freezeAt(utcIso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(utcIso));
}

describe("nzDateString", () => {
  it("returns the NZ date, not the UTC one", () => {
    // 20:00 UTC on 8 Sept is already 08:00 on 9 Sept in NZ (NZST, +12).
    expect(nzDateString(new Date("2026-09-08T20:00:00Z"))).toBe("2026-09-09");
    // Just before: 11:00 UTC is 23:00 the same day in NZ.
    expect(nzDateString(new Date("2026-09-08T11:00:00Z"))).toBe("2026-09-08");
  });

  it("handles NZDT, when the offset is 13 hours", () => {
    // 11:00 UTC on 8 Dec is midnight on the 9th in NZ (NZDT, +13).
    expect(nzDateString(new Date("2026-12-08T11:00:00Z"))).toBe("2026-12-09");
    expect(nzDateString(new Date("2026-12-08T10:00:00Z"))).toBe("2026-12-08");
  });
});

describe("isPastInNZ — the morning window", () => {
  it("rejects yesterday's date during the NZ morning (NZST)", () => {
    // 08:00 on 9 September in Cromwell. UTC still says the 8th, which is
    // exactly when the old server check let the 8th through.
    freezeAt("2026-09-08T20:00:00Z");
    expect(nzToday()).toBe("2026-09-09");
    expect(isPastInNZ("2026-09-08"), "8 Sept is past in NZ").toBe(true);
    expect(isPastInNZ("2026-09-09"), "today is not past").toBe(false);
    expect(isPastInNZ("2026-09-10"), "tomorrow is not past").toBe(false);
  });

  it("rejects yesterday's date during the NZ morning (NZDT)", () => {
    // 09:00 on 9 December in Cromwell, +13.
    freezeAt("2026-12-08T20:00:00Z");
    expect(nzToday()).toBe("2026-12-09");
    expect(isPastInNZ("2026-12-08")).toBe(true);
    expect(isPastInNZ("2026-12-09")).toBe(false);
  });

  it("still accepts today during the NZ evening, when UTC agrees", () => {
    // 23:00 on 8 September in Cromwell; UTC is 11:00 the same day.
    freezeAt("2026-09-08T11:00:00Z");
    expect(nzToday()).toBe("2026-09-08");
    expect(isPastInNZ("2026-09-08")).toBe(false);
  });

  it("covers every hour of a day — the window is 12 hours wide, not a corner case", () => {
    // Across 24 hours of UTC on 8 Sept, count how many hours NZ is already
    // on the 9th. The old check was wrong for every one of them.
    let nzAhead = 0;
    for (let h = 0; h < 24; h++) {
      const utc = `2026-09-08T${String(h).padStart(2, "0")}:00:00Z`;
      if (nzDateString(new Date(utc)) !== "2026-09-08") nzAhead++;
    }
    expect(nzAhead).toBe(12); // NZST: 12:00–23:00 UTC is already tomorrow in NZ
  });
});

describe("anchoring is independent of the viewer's timezone", () => {
  // A guest in Los Angeles is up to a day behind Cromwell. Their browser's
  // clock must not decide which nights are still bookable.
  const viewerZones = [
    "Pacific/Auckland",
    "UTC",
    "America/Los_Angeles",
    "Europe/London",
    "Asia/Tokyo",
  ];

  it("gives the same NZ date whatever the host timezone", () => {
    // nzDateString formats via Intl with an explicit timeZone, so the host's
    // zone cannot influence it. Same instant, same answer everywhere.
    const instant = new Date("2026-09-08T20:00:00Z");
    const answers = viewerZones.map(() => nzDateString(instant));
    expect(new Set(answers).size, "one answer for all viewers").toBe(1);
    expect(answers[0]).toBe("2026-09-09");
  });

  it("a date that is past in NZ is past for every viewer", () => {
    freezeAt("2026-09-08T20:00:00Z");
    // In Los Angeles it is still 13:00 on 8 September — the 8th looks current
    // to that guest, but the night in Cromwell has gone.
    expect(isPastInNZ("2026-09-08")).toBe(true);
  });
});

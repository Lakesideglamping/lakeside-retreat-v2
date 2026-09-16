import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Pre-arrival goes out three days before check-in, counted in New Zealand.
 *
 * Two things have to hold together. The cron fires at 20:00 UTC, which is
 * 08:00 the NEXT day in Cromwell — so at the moment this query runs, the
 * server's own date is still yesterday by NZ reckoning. Counting three days
 * from the server's date would target the wrong day for the entire window
 * the job actually runs in.
 *
 * These freeze the clock at that exact firing time and assert on the date
 * bounds handed to Prisma.
 */

const findMany = vi.fn();

vi.mock("../db", () => ({
  prisma: {
    bookings: { findMany: (args: unknown) => findMany(args) },
    review_requests: { findMany: async () => [] },
  },
}));
vi.mock("../logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../email", () => ({
  sendCheckoutThankYou: vi.fn(),
  sendCheckoutReviewReminder: vi.fn(),
}));

beforeEach(() => {
  findMany.mockReset();
  findMany.mockResolvedValue([]);
});
afterEach(() => vi.useRealTimers());

function freezeAt(utcIso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(utcIso));
}

/** The check_in bounds passed to Prisma, as YYYY-MM-DD. */
function windowFromCall() {
  const where = findMany.mock.calls[0][0].where;
  return {
    start: where.check_in.gte.toISOString().slice(0, 10),
    end: where.check_in.lt.toISOString().slice(0, 10),
    startIso: where.check_in.gte.toISOString(),
  };
}

describe("pre-arrival targets check-in three NZ days ahead", () => {
  it("at the 20:00 UTC firing time, counts from NZ's date not the server's", async () => {
    // 20:00 UTC on 9 Sept is 08:00 on 10 Sept in Cromwell (NZST, +12).
    // NZ today is the 10th, so three days out is the 13th. Counting from
    // the server's 9th would have produced the 12th.
    freezeAt("2026-09-09T20:00:00Z");
    const { findPreArrivalBookings } = await import("../marketing-automation");
    await findPreArrivalBookings();

    const w = windowFromCall();
    expect(w.start).toBe("2026-09-13");
    expect(w.end).toBe("2026-09-14");
  });

  it("uses UTC midnight bounds, because check_in is a DATE column", async () => {
    // A DATE compares as that day at 00:00 UTC. Bounds built from local time
    // would sit at midday and quietly exclude the day itself.
    freezeAt("2026-09-09T20:00:00Z");
    const { findPreArrivalBookings } = await import("../marketing-automation");
    await findPreArrivalBookings();

    expect(windowFromCall().startIso).toBe("2026-09-13T00:00:00.000Z");
  });

  it("holds across the NZDT changeover, when the offset is +13", async () => {
    // 20:00 UTC on 8 Dec is 09:00 on 9 Dec in Cromwell (NZDT). Three days
    // from the 9th is the 12th.
    freezeAt("2026-12-08T20:00:00Z");
    const { findPreArrivalBookings } = await import("../marketing-automation");
    await findPreArrivalBookings();

    expect(windowFromCall().start).toBe("2026-12-12");
  });

  it("spans a month boundary without drifting", async () => {
    // NZ date is 30 Sept; three days ahead is 3 October.
    freezeAt("2026-09-29T20:00:00Z");
    const { findPreArrivalBookings } = await import("../marketing-automation");
    await findPreArrivalBookings();

    expect(windowFromCall().start).toBe("2026-10-03");
  });

  it("still restricts to direct bookings with a usable address", async () => {
    freezeAt("2026-09-09T20:00:00Z");
    const mod = await import("../marketing-automation");
    await mod.findPreArrivalBookings();

    const where = findMany.mock.calls[0][0].where;
    expect(where.booking_source).toEqual({ in: mod.DIRECT_BOOKING_SOURCES });
    expect(where.guest_email).toEqual({ contains: "@" });
    expect(where.status).toBe("confirmed");
    expect(where.deleted_at).toBeNull();
  });
});

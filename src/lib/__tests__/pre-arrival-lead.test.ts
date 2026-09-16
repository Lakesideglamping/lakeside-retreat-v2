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

/**
 * A guest who books two days out does not need "your stay starts soon" —
 * they know, they just booked. The confirmation already gave them the
 * address and the check-in time.
 */
describe("pre-arrival skips bookings made inside the 72-hour lead", () => {
  const arrival = new Date("2026-09-13T00:00:00Z"); // the targeted NZ day

  function booking(createdAt: Date | null, id = "b1") {
    return {
      id,
      guest_name: "A",
      guest_email: "a@e.com",
      guest_phone: null,
      accommodation: "dome-pinot",
      check_in: arrival,
      check_out: new Date("2026-09-15T00:00:00Z"),
      guests: 2,
      total_price: 650,
      status: "confirmed",
      payment_status: "paid",
      notes: null,
      deleted_at: null,
      created_at: createdAt,
    };
  }

  /** Hours before the arrival day a booking was created. */
  const madeHoursBefore = (h: number) =>
    new Date(arrival.getTime() - h * 60 * 60 * 1000);

  it.each([
    [96, true, "four days ahead"],
    [73, true, "just over the line"],
    [72, true, "exactly 72 hours — inclusive"],
    [71, false, "just inside"],
    [24, false, "the day before"],
    [1, false, "an hour before"],
  ])("%s hours before arrival -> included=%s (%s)", async (hours, included) => {
    freezeAt("2026-09-09T20:00:00Z");
    findMany.mockResolvedValue([booking(madeHoursBefore(hours as number))]);
    const { findPreArrivalBookings } = await import("../marketing-automation");
    const result = await findPreArrivalBookings();
    expect(result.length).toBe(included ? 1 : 0);
  });

  it("keeps a booking with no created_at rather than silently dropping it", async () => {
    // Older rows predate the column default. Losing a real guest's arrival
    // instructions is worse than sending one we could have skipped.
    freezeAt("2026-09-09T20:00:00Z");
    findMany.mockResolvedValue([booking(null)]);
    const { findPreArrivalBookings } = await import("../marketing-automation");
    expect((await findPreArrivalBookings()).length).toBe(1);
  });

  it("filters per booking, not all-or-nothing", async () => {
    freezeAt("2026-09-09T20:00:00Z");
    findMany.mockResolvedValue([
      booking(madeHoursBefore(200), "early"),
      booking(madeHoursBefore(10), "late"),
      booking(madeHoursBefore(80), "alsoEarly"),
    ]);
    const { findPreArrivalBookings } = await import("../marketing-automation");
    const ids = (await findPreArrivalBookings()).map((b) => b.id);
    expect(ids).toEqual(["early", "alsoEarly"]);
  });
});

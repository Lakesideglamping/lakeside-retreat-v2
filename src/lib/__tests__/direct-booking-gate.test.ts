import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Guest emails must reach direct bookings only.
 *
 * An OTA guest belongs to their channel, not to us. Airbnb gives us no
 * address at all — every airbnb row we hold has an empty guest_email — and
 * Booking.com gives a relay it reads on the way through, while our templates
 * carry a phone number and a WhatsApp link. Both channels message their own
 * guests already.
 *
 * These assert on the Prisma `where` the finders build, because that is where
 * the gate lives. Mocking the client keeps them fast and offline.
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

/** The `where` passed to the first bookings.findMany call. */
function whereOf(call = 0) {
  return findMany.mock.calls[call][0].where;
}

describe("DIRECT_BOOKING_SOURCES", () => {
  it("is website and manual — nothing else", async () => {
    const { DIRECT_BOOKING_SOURCES } = await import("../marketing-automation");
    expect([...DIRECT_BOOKING_SOURCES].sort()).toEqual(["manual", "website"]);
  });

  it("excludes every OTA source we have ever recorded", async () => {
    const { DIRECT_BOOKING_SOURCES } = await import("../marketing-automation");
    // The inbound Uplisting webhook writes these three shapes.
    for (const ota of ["airbnb", "booking.com", "channel:expedia"]) {
      expect(DIRECT_BOOKING_SOURCES).not.toContain(ota);
    }
  });
});

describe("every guest-email finder gates on booking source", () => {
  const finders = [
    "findPreArrivalBookings",
    "findDuringStayBookings",
    "findReviewCandidates",
  ] as const;

  for (const name of finders) {
    it(`${name} filters to direct bookings with a usable address`, async () => {
      const mod = await import("../marketing-automation");
      await mod[name]();

      const where = whereOf();
      expect(where.booking_source, `${name} must gate on booking_source`).toEqual({
        in: mod.DIRECT_BOOKING_SOURCES,
      });
      // 53 rows have no address; one in a batch used to end the whole run.
      expect(where.guest_email, `${name} must require an address`).toEqual({
        contains: "@",
      });
      // The pre-existing guards must survive the change.
      expect(where.deleted_at).toBeNull();
      expect(where.status).toBe("confirmed");
    });
  }
});

describe("the review follow-up is gated independently", () => {
  it("re-checks the source rather than trusting review_requests", async () => {
    // review_requests rows written before the gate existed would otherwise
    // still earn an OTA guest a second email.
    vi.resetModules();
    vi.doMock("../db", () => ({
      prisma: {
        bookings: { findMany: (args: unknown) => findMany(args) },
        review_requests: {
          findMany: async () => [{ id: 1, booking_id: "legacy-ota-row" }],
        },
      },
    }));

    const mod = await import("../marketing-automation");
    await mod.findReviewFollowUpCandidates();

    const where = whereOf();
    expect(where.booking_source).toEqual({ in: mod.DIRECT_BOOKING_SOURCES });
    expect(where.guest_email).toEqual({ contains: "@" });
  });
});

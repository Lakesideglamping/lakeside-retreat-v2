import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * The post-stay review email goes out on departure day, six hours after the
 * 10am check-out.
 *
 * The cron fires at 04:00 UTC, which is 16:00 in Cromwell. At that hour the
 * server's UTC date and the NZ date happen to agree, so a server-local
 * calculation would pass today and break the moment the slot moved past
 * 12:00 UTC. These pin the NZ anchoring rather than the coincidence.
 */

const findMany = vi.fn();
const reviewFindMany = vi.fn();

vi.mock("../db", () => ({
  prisma: {
    bookings: { findMany: (args: unknown) => findMany(args) },
    review_requests: { findMany: (args: unknown) => reviewFindMany(args) },
  },
}));
vi.mock("../logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../email", () => ({
  sendCheckoutReviewReminder: vi.fn(),
}));

beforeEach(() => {
  findMany.mockReset();
  findMany.mockResolvedValue([]);
  reviewFindMany.mockReset();
  reviewFindMany.mockResolvedValue([]);
});
afterEach(() => vi.useRealTimers());

function freezeAt(utcIso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(utcIso));
}

/** The check_out bounds handed to Prisma. */
function windowFromCall() {
  const where = findMany.mock.calls[0][0].where;
  return {
    start: where.check_out.gte.toISOString().slice(0, 10),
    end: where.check_out.lt.toISOString().slice(0, 10),
    startIso: where.check_out.gte.toISOString(),
  };
}

describe("review email targets guests who checked out today in NZ", () => {
  it("at the 04:00 UTC firing time, targets that same NZ day", async () => {
    // 04:00 UTC on 16 Sept is 16:00 on 16 Sept in Cromwell (NZST, +12) —
    // six hours after a 10am check-out.
    freezeAt("2026-09-16T04:00:00Z");
    const { findReviewCandidates } = await import("../marketing-automation");
    await findReviewCandidates();

    const w = windowFromCall();
    expect(w.start).toBe("2026-09-16");
    expect(w.end).toBe("2026-09-17");
  });

  it("uses UTC midnight bounds, because check_out is a DATE column", async () => {
    freezeAt("2026-09-16T04:00:00Z");
    const { findReviewCandidates } = await import("../marketing-automation");
    await findReviewCandidates();

    expect(windowFromCall().startIso).toBe("2026-09-16T00:00:00.000Z");
  });

  it("holds under NZDT, when the offset is +13", async () => {
    // 04:00 UTC on 16 Dec is 17:00 on 16 Dec in Cromwell.
    freezeAt("2026-12-16T04:00:00Z");
    const { findReviewCandidates } = await import("../marketing-automation");
    await findReviewCandidates();

    expect(windowFromCall().start).toBe("2026-12-16");
  });

  it("follows New Zealand, not the server, late in the UTC day", async () => {
    // 23:00 UTC on 16 Sept is already 11:00 on the 17th in Cromwell. A
    // server-local calculation would say the 16th. This is the case the
    // 04:00 slot never reaches — and the reason the anchoring is explicit.
    freezeAt("2026-09-16T23:00:00Z");
    const { findReviewCandidates } = await import("../marketing-automation");
    await findReviewCandidates();

    expect(windowFromCall().start).toBe("2026-09-17");
  });

  it("still restricts to direct bookings with a usable address", async () => {
    freezeAt("2026-09-16T04:00:00Z");
    const mod = await import("../marketing-automation");
    await mod.findReviewCandidates();

    const where = findMany.mock.calls[0][0].where;
    expect(where.booking_source).toEqual({ in: mod.DIRECT_BOOKING_SOURCES });
    expect(where.guest_email).toEqual({ contains: "@" });
    expect(where.status).toBe("confirmed");
    expect(where.deleted_at).toBeNull();
  });
});

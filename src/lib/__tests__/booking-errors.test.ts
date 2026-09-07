import { describe, it, expect } from "vitest";
import { isDuplicateBookingError } from "../booking-errors";

/**
 * The error shapes below mirror what a real postgres produced when the second
 * concurrent website booking was attempted against a database built from
 * these migrations: SQLSTATE 23505 with
 * `constraint: idx_bookings_unique_website_dates`, surfaced by Prisma as P2002.
 *
 * Getting this predicate wrong is expensive in both directions. A false
 * negative sends Stripe into three days of doomed retries while the guest sits
 * charged with no booking. A false positive stops retrying a transient
 * database blip that would have succeeded, losing a booking that was fine.
 */
describe("isDuplicateBookingError", () => {
  it("recognises the date clash when the index is in meta.target as an array", () => {
    expect(
      isDuplicateBookingError({
        code: "P2002",
        meta: { target: ["idx_bookings_unique_website_dates"] },
        message: "Unique constraint failed",
      })
    ).toBe(true);
  });

  it("recognises it when meta.target is a plain string", () => {
    // The shape varies by driver adapter, so both forms must work.
    expect(
      isDuplicateBookingError({
        code: "P2002",
        meta: { target: "idx_bookings_unique_website_dates" },
      })
    ).toBe(true);
  });

  it("falls back to the message when meta is absent", () => {
    expect(
      isDuplicateBookingError({
        code: "P2002",
        message:
          "Unique constraint failed on the constraint: `idx_bookings_unique_website_dates`",
      })
    ).toBe(true);
  });

  it("does NOT match a different unique violation", () => {
    // A repeated stripe_session_id is a genuinely different situation and must
    // stay retryable — treating it as a date clash would stop Stripe retrying
    // an event that could still succeed.
    expect(
      isDuplicateBookingError({
        code: "P2002",
        meta: { target: ["idx_bookings_stripe_session"] },
      })
    ).toBe(false);
  });

  it("does NOT match other Prisma errors", () => {
    // P1001 is "cannot reach database" — transient, must be retried.
    expect(isDuplicateBookingError({ code: "P1001", message: "unreachable" })).toBe(
      false
    );
    expect(isDuplicateBookingError({ code: "P2025" })).toBe(false);
  });

  it("does NOT match a raw error mentioning the index without the P2002 code", () => {
    // Guard against matching on text alone; the code has to agree.
    expect(
      isDuplicateBookingError({
        message: "something about idx_bookings_unique_website_dates",
      })
    ).toBe(false);
  });

  it("handles non-objects safely", () => {
    expect(isDuplicateBookingError(null)).toBe(false);
    expect(isDuplicateBookingError(undefined)).toBe(false);
    expect(isDuplicateBookingError("P2002")).toBe(false);
    expect(isDuplicateBookingError(new Error("boom"))).toBe(false);
  });
});

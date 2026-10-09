import { describe, it, expect, vi, beforeEach } from "vitest";

const { redirect, retrieveCheckoutSession } = vi.hoisted(() => ({
  // Like Next's redirect(): it never returns, it throws.
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  retrieveCheckoutSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/stripe", () => ({ retrieveCheckoutSession }));

import BookingSuccessPage from "../page";

const render = (sessionId?: string) =>
  BookingSuccessPage({
    searchParams: Promise.resolve(sessionId ? { session_id: sessionId } : {}),
  });

beforeEach(() => {
  redirect.mockClear();
  retrieveCheckoutSession.mockReset();
});

describe("booking success page", () => {
  it("sends an unpaid checkout to the cancelled page", async () => {
    retrieveCheckoutSession.mockResolvedValue({
      status: "open",
      payment_status: "unpaid",
      metadata: {},
    });
    await expect(render("cs_test_unpaid")).rejects.toThrow(
      "NEXT_REDIRECT:/booking-cancelled"
    );
  });

  it("confirms a paid checkout", async () => {
    retrieveCheckoutSession.mockResolvedValue({
      status: "complete",
      payment_status: "paid",
      amount_total: 63900,
      currency: "nzd",
      metadata: { guestName: "Test Guest", accommodation: "dome-rose" },
    });
    await expect(render("cs_test_paid")).resolves.toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  // A paying guest must not be told their booking failed because Stripe
  // could not be reached.
  it("shows the generic confirmation when Stripe returns nothing", async () => {
    retrieveCheckoutSession.mockResolvedValue(null);
    await expect(render("cs_test_unknown")).resolves.toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("sends a visit without a session id home", async () => {
    await expect(render()).rejects.toThrow("NEXT_REDIRECT:/");
  });
});

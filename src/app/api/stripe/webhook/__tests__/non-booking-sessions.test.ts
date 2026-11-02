import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The webhook receives every checkout.session.completed on the Stripe
 * account, not only the ones the booking page created. A Payment Link sold
 * by hand (the first gift voucher, November 2026) completes a session with
 * no stay metadata; before the guard, the handler ran it through the booking
 * insert with `new Date(undefined)` for the dates — an exception, a system
 * alert, and at worst a dateless "Guest" booking.
 */

const bookingsCreate = vi.fn();
const processedCreate = vi.fn();
const sendSystemAlert = vi.fn();
const sendBookingConfirmation = vi.fn();
const syncBooking = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    processed_webhook_events: {
      create: (...a: unknown[]) => processedCreate(...(a as [])),
    },
    bookings: {
      create: (...a: unknown[]) => bookingsCreate(...(a as [])),
    },
  },
}));
vi.mock("@/lib/email", () => ({
  hasSentEmail: vi.fn(async () => false),
  sendBookingConfirmation: (...a: unknown[]) => sendBookingConfirmation(...(a as [])),
  sendCancellationConfirmation: vi.fn(),
  sendSystemAlert: (...a: unknown[]) => sendSystemAlert(...(a as [])),
}));
vi.mock("@/lib/uplisting", () => ({
  syncBooking: (...a: unknown[]) => syncBooking(...(a as [])),
}));

// The signature check is Stripe's; the test supplies the decoded event.
let event: unknown;
vi.mock("@/lib/stripe", () => ({
  isDevMode: false,
  constructWebhookEvent: () => event,
}));

import { POST } from "../route";

function completedSession(overrides: Record<string, unknown>) {
  return {
    id: "evt_test",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test",
        currency: "nzd",
        amount_total: 66000,
        payment_intent: "pi_test",
        metadata: {},
        ...overrides,
      },
    },
  };
}

function post() {
  return POST(
    new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=test" },
      body: "{}",
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  processedCreate.mockResolvedValue({});
  bookingsCreate.mockResolvedValue({ reference: "BK-2026-00099" });
  syncBooking.mockResolvedValue({ success: true });
});

describe("stripe webhook: sessions that are not website bookings", () => {
  it("ignores a Payment Link payment (gift voucher) without touching bookings", async () => {
    event = completedSession({
      metadata: { kind: "gift_voucher", voucher_number: "LR-GV-2026-001" },
    });

    const res = await post();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true, ignored: "not_a_booking" });

    expect(bookingsCreate).not.toHaveBeenCalled();
    expect(syncBooking).not.toHaveBeenCalled();
    expect(sendBookingConfirmation).not.toHaveBeenCalled();
    expect(sendSystemAlert).not.toHaveBeenCalled();
  });

  it("ignores a session with no metadata at all", async () => {
    event = completedSession({ metadata: null });

    const res = await post();
    expect(res.status).toBe(200);
    expect(bookingsCreate).not.toHaveBeenCalled();
    expect(sendSystemAlert).not.toHaveBeenCalled();
  });

  it("still records the event so Stripe's retries are deduplicated", async () => {
    event = completedSession({ metadata: { kind: "gift_voucher" } });
    await post();
    expect(processedCreate).toHaveBeenCalledWith({ data: { event_id: "evt_test" } });
  });

  it("lets a real booking session through to the booking insert", async () => {
    event = completedSession({
      amount_total: 115800,
      metadata: {
        accommodation: "dome-pinot",
        checkIn: "2026-12-12",
        checkOut: "2026-12-14",
        guestName: "Test Guest",
        guestEmail: "guest@example.com",
        guests: "2",
        quotedTotalCents: "115800",
      },
    });

    await post();
    expect(bookingsCreate).toHaveBeenCalledTimes(1);
    const data = bookingsCreate.mock.calls[0][0].data;
    expect(data.accommodation).toBe("dome-pinot");
    expect(data.check_in).toEqual(new Date("2026-12-12"));
  });
});

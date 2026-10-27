import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Cancelling a booking in admin must tell the guest. Before this existed the
 * route refunded through Stripe and marked the row cancelled, and the guest
 * heard nothing unless Stripe's refund event happened to trigger the webhook's
 * email — which it never did for an admin cancel, because the row was already
 * "cancelled" by the time the event arrived.
 *
 * What matters:
 *   - the refund wording follows what actually happened (refund issued or not)
 *   - OTA guests are never emailed (that channel owns the conversation)
 *   - a send already in the log is not repeated (the webhook may have won)
 */

const findFirst = vi.fn();
const update = vi.fn();
const sendCancellationConfirmation = vi.fn();
const hasSentEmail = vi.fn();
const auditLog = vi.fn();
const refundsCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    bookings: {
      findFirst: (...a: unknown[]) => findFirst(...(a as [])),
      update: (...a: unknown[]) => update(...(a as [])),
    },
  },
}));
vi.mock("@/lib/email", () => ({
  sendCancellationConfirmation: (...a: unknown[]) =>
    sendCancellationConfirmation(...(a as [])),
  hasSentEmail: (...a: unknown[]) => hasSentEmail(...(a as [])),
}));
vi.mock("@/lib/audit", () => ({ auditLog: (...a: unknown[]) => auditLog(...(a as [])) }));
vi.mock("@/lib/stripe", () => ({
  isDevMode: false,
  stripe: { refunds: { create: (...a: unknown[]) => refundsCreate(...(a as [])) } },
}));
vi.mock("@/lib/admin-route", () => ({
  withAdminMutation: (req: Request, handler: (a: unknown, r: Request) => unknown) =>
    handler({ username: "admin" }, req),
  getClientIp: () => "1.2.3.4",
}));

const baseBooking = {
  id: "6d2f3a1e-9c4b-4e7a-b8d1-2f5c6a7b8c9d",
  reference: "BK-2026-00042",
  guest_name: "Sarah Johnson",
  guest_email: "sarah@example.com",
  accommodation: "lakeside-cottage",
  check_in: new Date("2026-05-12"),
  check_out: new Date("2026-05-15"),
  guests: 2,
  total_price: 1280,
  status: "confirmed",
  payment_status: "paid",
  stripe_payment_id: "pi_123",
  booking_source: "website",
  deleted_at: null,
};

async function cancel(booking: Partial<typeof baseBooking>) {
  const row = { ...baseBooking, ...booking };
  findFirst.mockResolvedValue(row);
  update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    ...row,
    ...data,
  }));
  const { PUT } = await import("../route");
  const res = await PUT(
    new Request(`http://localhost/api/admin/bookings/${row.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    }),
    { params: Promise.resolve({ id: row.id }) }
  );
  // The send is fire-and-forget; let its promise chain settle.
  await new Promise((r) => setTimeout(r, 0));
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  vi.resetModules();
  for (const m of [findFirst, update, sendCancellationConfirmation, hasSentEmail, auditLog, refundsCreate]) {
    m.mockReset();
  }
  auditLog.mockResolvedValue(undefined);
  hasSentEmail.mockResolvedValue(false);
  sendCancellationConfirmation.mockResolvedValue(undefined);
  refundsCreate.mockResolvedValue({ id: "re_1", status: "succeeded", amount: 128000 });
});

describe("cancelling a website booking", () => {
  it("emails the guest with refund wording when a refund was issued", async () => {
    const { status } = await cancel({});
    expect(status).toBe(200);
    expect(refundsCreate).toHaveBeenCalledTimes(1);
    expect(sendCancellationConfirmation).toHaveBeenCalledTimes(1);

    const [data] = sendCancellationConfirmation.mock.calls[0] as [Record<string, unknown>];
    expect(data.guest_email).toBe("sarah@example.com");
    expect(data.refundEligible).toBe(true);
    // The guest-facing reference goes in the email; the UUID is what the log
    // is keyed on.
    expect(data.booking_reference).toBe("BK-2026-00042");
    expect(data.booking_id).toBe(baseBooking.id);
  });

  it("uses the non-refundable wording when nothing was refunded", async () => {
    // No live Stripe payment to refund — e.g. paid offline.
    const { status } = await cancel({ payment_status: "pending", stripe_payment_id: null });
    expect(status).toBe(200);
    expect(refundsCreate).not.toHaveBeenCalled();
    expect(sendCancellationConfirmation).toHaveBeenCalledTimes(1);
    const [data] = sendCancellationConfirmation.mock.calls[0] as [Record<string, unknown>];
    expect(data.refundEligible).toBe(false);
  });

  it("does not email again if the log already has a cancellation send", async () => {
    hasSentEmail.mockResolvedValue(true);
    const { status } = await cancel({});
    expect(status).toBe(200);
    expect(hasSentEmail).toHaveBeenCalledWith(baseBooking.id, "cancellation");
    expect(sendCancellationConfirmation).not.toHaveBeenCalled();
  });

  it("does not email when the booking was already cancelled", async () => {
    await cancel({ status: "cancelled", payment_status: "refunded" });
    expect(sendCancellationConfirmation).not.toHaveBeenCalled();
  });
});

describe("cancelling an OTA booking", () => {
  it("never emails an Airbnb guest", async () => {
    await cancel({
      booking_source: "airbnb",
      guest_email: "",
      stripe_payment_id: null,
      payment_status: "paid_external",
    });
    expect(sendCancellationConfirmation).not.toHaveBeenCalled();
  });

  it("never emails a Booking.com relay address", async () => {
    await cancel({
      booking_source: "booking.com",
      guest_email: "abc123@guest.booking.com",
      stripe_payment_id: null,
      payment_status: "paid_external",
    });
    expect(sendCancellationConfirmation).not.toHaveBeenCalled();
  });
});

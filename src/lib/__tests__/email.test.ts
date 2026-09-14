/**
 * Guards the email sender boundaries:
 *   1. When EMAIL_USER/EMAIL_PASS are unset, senders no-op (no nodemailer
 *      transport created, no send attempted, no throw). This is the
 *      "local dev without SMTP" path — a regression here means dev bookings
 *      crash the booking flow.
 *   2. When configured, sendContactEmail routes to CONTACT_EMAIL (or falls
 *      back to EMAIL_USER), replyTo is the submitter, and the subject line
 *      uses the human label for known subject keys.
 *   3. sendBookingConfirmation sends two emails — guest + host notification.
 *
 * Nodemailer is mocked at the module boundary so we assert on the calls
 * it *would* make, without opening an SMTP connection.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn(async (options: Record<string, unknown>) => {
  void options;
  return { accepted: ["ok"] };
});
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock("nodemailer", () => ({
  default: { createTransport },
  createTransport,
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  sendMail.mockClear();
  createTransport.mockClear();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("sendContactEmail", () => {
  it("no-ops silently when SMTP is not configured", async () => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    const { sendContactEmail } = await import("../email");
    await expect(
      sendContactEmail({
        name: "A",
        email: "a@example.com",
        subject: "booking",
        message: "hi",
      })
    ).resolves.toBeUndefined();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("routes to CONTACT_EMAIL with replyTo=submitter and human subject label", async () => {
    process.env.EMAIL_USER = "host@example.com";
    process.env.EMAIL_PASS = "p";
    process.env.CONTACT_EMAIL = "inbox@example.com";
    const { sendContactEmail } = await import("../email");
    await sendContactEmail({
      name: "Jane",
      email: "jane@example.com",
      subject: "booking",
      message: "hello",
    });
    expect(sendMail).toHaveBeenCalledOnce();
    const call = sendMail.mock.calls[0][0] as {
      to: string;
      replyTo: string;
      subject: string;
      from: string;
    };
    expect(call.to).toBe("inbox@example.com");
    expect(call.replyTo).toBe("jane@example.com");
    expect(call.subject).toContain("Booking Enquiry");
    expect(call.subject).toContain("Jane");
    expect(call.from).toContain("host@example.com");
  });

  it("falls back to EMAIL_USER when CONTACT_EMAIL is unset", async () => {
    process.env.EMAIL_USER = "host@example.com";
    process.env.EMAIL_PASS = "p";
    delete process.env.CONTACT_EMAIL;
    const { sendContactEmail } = await import("../email");
    await sendContactEmail({
      name: "A",
      email: "a@example.com",
      subject: "other",
      message: "hi",
    });
    const call = sendMail.mock.calls[0][0] as { to: string };
    expect(call.to).toBe("host@example.com");
  });

  it("passes unknown subject keys through verbatim (no crash)", async () => {
    process.env.EMAIL_USER = "u@e.com";
    process.env.EMAIL_PASS = "p";
    const { sendContactEmail } = await import("../email");
    await sendContactEmail({
      name: "A",
      email: "a@e.com",
      subject: "weird-unknown-key",
      message: "hi",
    });
    const call = sendMail.mock.calls[0][0] as { subject: string };
    expect(call.subject).toContain("weird-unknown-key");
  });
});

describe("sendBookingConfirmation", () => {
  it("no-ops when SMTP is not configured", async () => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    const { sendBookingConfirmation } = await import("../email");
    await expect(
      sendBookingConfirmation({
        guestName: "A",
        guestEmail: "a@e.com",
        accommodation: "Dome Pinot",
        checkIn: "2026-05-01",
        checkOut: "2026-05-03",
        guests: 2,
        totalAmount: 800,
      })
    ).resolves.toBeUndefined();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends two emails (guest + host) when configured", async () => {
    process.env.EMAIL_USER = "host@e.com";
    process.env.EMAIL_PASS = "p";
    process.env.CONTACT_EMAIL = "ops@e.com";
    const { sendBookingConfirmation } = await import("../email");
    await sendBookingConfirmation({
      guestName: "A",
      guestEmail: "guest@e.com",
      accommodation: "Dome Pinot",
      checkIn: "2026-05-01",
      checkOut: "2026-05-03",
      guests: 2,
      totalAmount: 800,
    });
    expect(sendMail).toHaveBeenCalledTimes(2);
    const recipients = sendMail.mock.calls.map((c) => (c[0] as { to: string }).to);
    expect(recipients).toContain("guest@e.com");
    expect(recipients).toContain("ops@e.com");
  });

  /**
   * The guest half renders the shared template, not inline HTML.
   *
   * It was inline for six months while the template sat unused — the admin
   * preview showed the template, so the discrepancy was invisible. These
   * assert on content only the template produces, so an accidental revert
   * fails here rather than in a customer's inbox.
   */
  it("renders the guest email from the shared template", async () => {
    process.env.EMAIL_USER = "host@e.com";
    process.env.EMAIL_PASS = "p";
    process.env.CONTACT_EMAIL = "ops@e.com";
    const { sendBookingConfirmation } = await import("../email");
    await sendBookingConfirmation({
      guestName: "A",
      guestEmail: "guest@e.com",
      accommodation: "dome-rose",
      checkIn: "2026-05-01",
      checkOut: "2026-05-03",
      guests: 2,
      totalAmount: 650,
      bookingId: "bk-123",
    });

    const guest = sendMail.mock.calls
      .map((c) => c[0] as { to: string; html: string })
      .find((m) => m.to === "guest@e.com")!;

    // The booking ID gives the guest a reference to quote back at us.
    expect(guest.html).toContain("bk-123");
    // The condition we would rely on if a guest arrives with children.
    expect(guest.html).toContain("18+ adults only");
    // Long-form dates — "1/5/2026" is ambiguous to an overseas guest.
    expect(guest.html).toContain("Friday, 1 May 2026");
    expect(guest.html).toContain("Sunday, 3 May 2026");
    // Trailing cents survive: a whole-dollar total must not render as "$650".
    expect(guest.html).toContain("$650.00 NZD");
    // The slug is resolved to the display name, accent intact.
    expect(guest.html).toContain("Dome Rosé");
  });
});

describe("formatAccommodationName re-export", () => {
  it("is exported from email.ts (contract for callers)", async () => {
    const mod = await import("../email");
    expect(typeof mod.formatAccommodationName).toBe("function");
  });
});

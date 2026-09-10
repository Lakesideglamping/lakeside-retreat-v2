import { prisma } from "./db";
import { logger } from "./logger";
import {
  sendCheckoutThankYou,
  sendCheckoutReviewReminder,
} from "./email";

type Booking = {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  accommodation: string;
  check_in: Date;
  check_out: Date;
  guests: number;
  total_price: unknown;
  status: string | null;
  payment_status: string | null;
  notes: string | null;
  deleted_at: Date | null;
};

/**
 * Booking sources we may email guests about.
 *
 * Guests who booked through an OTA belong to that channel, not to us:
 *
 *   - Airbnb sends no usable address. Every airbnb row we hold has an empty
 *     guest_email, so a send fails, and because sendAndLog rethrows it would
 *     abort the whole cron run — silencing the legitimate emails behind it.
 *   - Booking.com supplies a @guest.booking.com relay. Mail routed there is
 *     read by Booking.com, and our templates carry a direct phone number and
 *     a WhatsApp link — off-platform contact they strip, and repeated
 *     attempts can earn the property a warning.
 *   - Both channels already run their own guest messaging, so ours would be
 *     duplicate contact at best.
 *
 * Uplisting cannot cover the gap for direct bookings: its Connect API is
 * read-only for reservations, so a website booking reaches it as a blocked
 * calendar range with the guest's details in a free-text `reason` — there is
 * no guest record for it to message. We are the only sender direct guests
 * have, which is exactly why these four emails still exist.
 *
 * An allow-list rather than a deny-list, deliberately: the Uplisting webhook
 * maps unrecognised channels to `channel:<source>`, so a deny-list would
 * quietly start emailing guests from any newly connected channel. This fails
 * closed instead.
 */
export const DIRECT_BOOKING_SOURCES = ["website", "manual"];

/**
 * Shared `where` fragment: a direct booking we can actually reach.
 *
 * The guest_email check is not paranoia — 53 of the rows we hold have no
 * address at all. One of those in a batch is enough to end the run.
 */
const directBookingWhere = {
  booking_source: { in: DIRECT_BOOKING_SOURCES },
  guest_email: { contains: "@" },
};

// --- Query helpers ---

/**
 * Find bookings that checked out 2 days ago and have not yet received
 * a review request email.
 */
export async function findReviewCandidates(): Promise<Booking[]> {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const startOfDay = new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  // Get all bookings that checked out on that day
  const bookings = await prisma.bookings.findMany({
    where: {
      check_out: { gte: startOfDay, lt: endOfDay },
      payment_status: { in: ["paid", "paid_external"] },
      status: "confirmed",
      deleted_at: null,
      ...directBookingWhere,
    },
  });

  // Filter out bookings that already have a review request
  const bookingIds = bookings.map((b) => b.id);
  const existingRequests = await prisma.review_requests.findMany({
    where: { booking_id: { in: bookingIds } },
    select: { booking_id: true },
  });
  const requestedIds = new Set(existingRequests.map((r) => r.booking_id));

  return bookings.filter((b) => !requestedIds.has(b.id)) as unknown as Booking[];
}

/**
 * Find bookings checking in tomorrow (for pre-arrival emails).
 */
export async function findPreArrivalBookings(): Promise<Booking[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const bookings = await prisma.bookings.findMany({
    where: {
      check_in: { gte: startOfDay, lt: endOfDay },
      payment_status: { in: ["paid", "paid_external"] },
      status: "confirmed",
      deleted_at: null,
      ...directBookingWhere,
    },
  });

  return bookings as unknown as Booking[];
}

/**
 * Find bookings that checked in today (for during-stay welcome emails).
 */
export async function findDuringStayBookings(): Promise<Booking[]> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const bookings = await prisma.bookings.findMany({
    where: {
      check_in: { gte: startOfDay, lt: endOfDay },
      payment_status: { in: ["paid", "paid_external"] },
      status: "confirmed",
      deleted_at: null,
      ...directBookingWhere,
    },
  });

  return bookings as unknown as Booking[];
}

// --- Processing functions ---

/**
 * Send a review request email and create a review_requests entry.
 */
export async function processReviewRequest(booking: Booking): Promise<void> {
  try {
    // Check if a request already exists
    const existing = await prisma.review_requests.findUnique({
      where: { booking_id: booking.id },
    });

    if (existing) {
      logger.info("Review request already exists for booking, skipping", {
        bookingId: booking.id,
      });
      return;
    }

    logger.info("Sending review request email", {
      bookingId: booking.id,
      guestEmail: booking.guest_email,
    });

    await sendCheckoutThankYou({
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      accommodation: booking.accommodation,
      check_in: booking.check_in.toISOString(),
      check_out: booking.check_out.toISOString(),
      num_guests: booking.guests,
      total_price: booking.total_price ? String(booking.total_price) : undefined,
      booking_id: booking.id,
    });

    const now = new Date().toISOString();

    await prisma.review_requests.create({
      data: {
        booking_id: booking.id,
        guest_email: booking.guest_email,
        guest_name: booking.guest_name,
        accommodation: booking.accommodation,
        check_out: booking.check_out.toISOString(),
        request_count: 1,
        last_request_sent_at: now,
        status: "sent",
      },
    });

    logger.info("Review request sent and recorded", {
      bookingId: booking.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to process review request", {
      bookingId: booking.id,
      error: message,
    });
  }
}

// --- Review follow-up (7-day reminder) ---

/**
 * Bookings that received their first review request ≥7 days ago and
 * haven't been nudged a second time. One follow-up only — we don't want
 * to harass guests, and diminishing returns past two attempts.
 */
export async function findReviewFollowUpCandidates(): Promise<
  { booking: Booking; reviewRequestId: number }[]
> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // request_count = 1 means "initial sent, no follow-up yet". The cron will
  // bump it to 2 after sending the reminder, which excludes that row from
  // any future tick.
  const pending = await prisma.review_requests.findMany({
    where: {
      request_count: 1,
      last_request_sent_at: { lt: sevenDaysAgo },
      status: "sent",
    },
    select: { id: true, booking_id: true },
    take: 50,
  });
  if (pending.length === 0) return [];

  // Gated here too, not just in findReviewCandidates. Rows written before the
  // gate existed would otherwise still receive a follow-up, and this query is
  // driven by review_requests rather than by that finder.
  const bookings = await prisma.bookings.findMany({
    where: {
      id: { in: pending.map((p) => p.booking_id) },
      deleted_at: null,
      ...directBookingWhere,
    },
  });
  const bookingMap = new Map(bookings.map((b) => [b.id, b]));

  return pending
    .map((p) => {
      const b = bookingMap.get(p.booking_id);
      return b ? { booking: b as unknown as Booking, reviewRequestId: p.id } : null;
    })
    .filter((x): x is { booking: Booking; reviewRequestId: number } => x !== null);
}

/**
 * Send a follow-up review email and bump the row's request_count so we
 * never send a third nudge.
 */
export async function processReviewFollowUp(
  candidate: { booking: Booking; reviewRequestId: number }
): Promise<void> {
  const { booking, reviewRequestId } = candidate;
  try {
    await sendCheckoutReviewReminder({
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      accommodation: booking.accommodation,
      check_in: booking.check_in.toISOString(),
      check_out: booking.check_out.toISOString(),
      num_guests: booking.guests,
      total_price: booking.total_price ? String(booking.total_price) : undefined,
      booking_id: booking.id,
    });

    await prisma.review_requests.update({
      where: { id: reviewRequestId },
      data: {
        request_count: 2,
        last_request_sent_at: new Date().toISOString(),
      },
    });

    logger.info("Review follow-up sent", { bookingId: booking.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to process review follow-up", {
      bookingId: booking.id,
      error: message,
    });
  }
}
